import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const APP_URL = (Deno.env.get("PUBLIC_APP_URL") || "https://happyclient.io").replace(/\/$/, "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supaUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supaUser.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
    const uid = claims.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const inviteId = typeof body?.invite_id === "string" ? body.invite_id : null;
    if (!inviteId) return json({ error: "invite_id required" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: invite, error: invErr } = await admin
      .from("team_invites")
      .select("id, owner_user_id, email, token, role, expires_at")
      .eq("id", inviteId)
      .single();
    if (invErr || !invite) return json({ error: "invite_not_found" }, 404);
    if (invite.owner_user_id !== uid) return json({ error: "forbidden" }, 403);

    const acceptUrl = `${APP_URL}/accept-invite/${invite.token}`;

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return json({
        ok: true,
        emailed: false,
        message: "Email provider not configured; share the invite link manually.",
        accept_url: acceptUrl,
      });
    }

    // Get inviter info for nicer copy
    let inviterName = "A teammate";
    const { data: prof } = await admin
      .from("profiles")
      .select("full_name, email, company_name")
      .eq("user_id", uid)
      .maybeSingle();
    if (prof?.full_name) inviterName = prof.full_name;
    else if (prof?.email) inviterName = prof.email;

    const html = renderEmail({
      inviterName,
      companyName: prof?.company_name ?? null,
      role: invite.role,
      acceptUrl,
    });

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Happy Client <invites@happyclient.io>",
        to: [invite.email],
        // A reply goes to the person who sent the invite.
        ...(prof?.email ? { reply_to: prof.email } : {}),
        subject: `${inviterName} invited you to their Happy Client account`,
        html,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("Resend error", resp.status, errText);
      return json({ ok: true, emailed: false, message: "Email send failed; share the link manually.", accept_url: acceptUrl });
    }

    return json({ ok: true, emailed: true, accept_url: acceptUrl });
  } catch (e) {
    console.error("send-team-invite error", e);
    return json({ error: (e as Error).message || "Internal error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function renderEmail(opts: { inviterName: string; companyName: string | null; role: string; acceptUrl: string }) {
  const { inviterName, companyName, role, acceptUrl } = opts;
  const org = companyName ? ` (${escapeHtml(companyName)})` : "";
  const access = role === "admin" ? "You can add, edit and approve testimonials." : "You can view everything in the account.";
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#F8F6F1;font-family:Inter,Arial,sans-serif;color:#1A1714;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E7E1D6;border-radius:16px;padding:40px;">
        <tr><td>
          <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;">You are invited to a team</h1>
          <p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#4A443C;">
            <strong>${escapeHtml(inviterName)}</strong>${org} invited you to their account on Happy Client.
          </p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.55;color:#4A443C;">${access}</p>
          <a href="${acceptUrl}" style="display:inline-block;background:#1A1714;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:500;font-size:14px;">
            Accept the invite
          </a>
          <p style="margin:28px 0 0;font-size:12px;color:#8A8378;line-height:1.5;">
            This invite expires in 14 days. If the button does not work, paste this link into your browser:<br>
            <span style="color:#6B645B;word-break:break-all;">${acceptUrl}</span>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}