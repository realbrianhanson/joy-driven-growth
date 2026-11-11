import { createClient } from "npm:@supabase/supabase-js@2";
import { aiErrorBody, chatCompletion, parseJsonObject } from "../_shared/ai.ts";
import {
  contentText,
  isContentKind,
  maskName,
  normalizeContent,
  type SourceTestimonial,
  systemPrompt,
  unverifiedNumbers,
  userPrompt,
} from "../_shared/content.ts";
import { json, preflight } from "../_shared/http.ts";

const MAX_SOURCES = 10;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Drafts marketing copy from approved testimonials.
 *
 * The testimonials are read from the database by id, so the copy is always
 * built from what a real customer said and never from text in the request.
 * Names follow the display choice each customer made.
 *
 * Returns { content, contentType, checks } where checks.unverified_numbers
 * lists numbers in the draft that the customer never gave.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return preflight();
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) return json({ error: "unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) return json({ error: "unauthorized" }, 401);
    const callerId = userData.user.id;

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ error: "invalid_json" }, 400);
    }

    const kind = body.contentType;
    if (!isContentKind(kind)) return json({ error: "unsupported_content_type" }, 400);

    const fromObjects = Array.isArray(body.testimonials)
      ? body.testimonials.map((t) => (t && typeof t === "object" ? (t as { id?: unknown }).id : null))
      : [];
    const fromIds = Array.isArray(body.testimonial_ids) ? body.testimonial_ids : [];
    const ids = [...new Set([...fromIds, ...fromObjects].filter((id): id is string => typeof id === "string" && UUID.test(id)))];
    if (ids.length === 0) return json({ error: "no_testimonials" }, 400);
    if (ids.length > MAX_SOURCES) return json({ error: "too_many_testimonials" }, 400);

    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // The caller works in their own account, or in the account of a team they belong to.
    let ownerId = callerId;
    const requestedOwner = typeof body.workspace_owner_id === "string" ? body.workspace_owner_id : null;
    if (requestedOwner && requestedOwner !== callerId) {
      const { data: member } = await admin
        .from("team_members")
        .select("owner_user_id")
        .eq("owner_user_id", requestedOwner)
        .eq("member_user_id", callerId)
        .maybeSingle();
      if (!member) return json({ error: "forbidden" }, 403);
      ownerId = requestedOwner;
    }

    const { data: allowed, error: limitError } = await admin.rpc("check_rate_limit", {
      p_key: `generate-content:${callerId}`,
      p_max: 20,
      p_window_seconds: 60,
    });
    if (limitError) console.error("rate limit check failed", limitError);
    if (allowed === false) return json({ error: "rate_limited" }, 429);

    const { data: rows, error: rowsError } = await admin
      .from("testimonials")
      .select("id, content, rating, author_name, author_title, author_company, display_preference")
      .in("id", ids)
      .eq("user_id", ownerId)
      .eq("status", "approved");
    if (rowsError) {
      console.error("generate-content load error:", rowsError);
      return json({ error: "load_failed" }, 500);
    }

    // Keep the order the caller chose.
    const byId = new Map((rows ?? []).map((row) => [row.id as string, row]));
    const sources: SourceTestimonial[] = ids
      .map((id) => byId.get(id))
      .filter((row): row is NonNullable<typeof row> => !!row && typeof row.content === "string" && row.content.trim().length > 0)
      .map((row) => ({
        name: maskName(row.author_name, row.display_preference),
        title: row.display_preference === "anonymous" ? null : (row.author_title?.trim() || null),
        company: row.author_company?.trim() || null,
        content: String(row.content).trim().slice(0, 6000),
        rating: typeof row.rating === "number" && row.rating >= 1 && row.rating <= 5 ? row.rating : null,
      }));

    if ((rows ?? []).length === 0) return json({ error: "no_testimonials" }, 404);
    if (sources.length === 0) return json({ error: "no_text" }, 400);

    const messages = [
      { role: "system" as const, content: systemPrompt(kind) },
      { role: "user" as const, content: userPrompt(sources) },
    ];

    let content: Record<string, unknown> | null = null;

    // A short testimonial is its own best quote. No AI call needed.
    if (kind === "quote" && sources[0].content.length <= 180) {
      content = normalizeContent("quote", { quote: sources[0].content }, sources);
    }

    // A model sometimes answers in the wrong shape. One more try is usually enough.
    for (let attempt = 0; attempt < 2 && !content; attempt++) {
      const answer = await chatCompletion({
        tier: "quality",
        apiKey: Deno.env.get("LOVABLE_API_KEY"),
        override: Deno.env.get("AI_MODEL_QUALITY"),
        messages,
      });
      content = normalizeContent(kind, parseJsonObject(answer.content), sources);
    }
    if (!content) return json({ error: "generation_failed" }, 502);

    return json({
      content,
      contentType: kind,
      checks: { unverified_numbers: unverifiedNumbers(contentText(content), sources) },
    });
  } catch (error) {
    console.error("generate-content error:", error);
    const { status, body } = aiErrorBody(error);
    return json(body, status);
  }
});
