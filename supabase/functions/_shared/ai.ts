/**
 * One place for every AI call.
 *
 * Model names go stale. Providers retire models with a few weeks of notice,
 * and a retired name makes a feature fail without warning. Each call walks a
 * short list of models and uses the first one that answers, so a retired
 * model costs one fast failed request and the feature keeps working.
 *
 * To change models without a code change, set the AI_MODEL_FAST or
 * AI_MODEL_QUALITY secret to a model ID from Lovable (Connectors, AI,
 * Available models). The lists below stay in place as the fallback.
 */

export type AiTier = "fast" | "quality";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

/**
 * Preference order per tier, checked against the Lovable changelog in
 * November 2026. "fast" is for chat, where a slow answer feels broken.
 * "quality" is for one-off writing jobs.
 */
export const MODEL_CHAINS: Record<AiTier, string[]> = {
  fast: ["google/gemini-3.8-flash", "openai/gpt-6.1-terra", "google/gemini-3-flash-preview"],
  quality: ["google/gemini-3.8-flash", "openai/gpt-6.1-terra", "openai/gpt-6.1-sol", "google/gemini-4-argon"],
};

/** The longest one model may take before the next one gets a turn. */
const ATTEMPT_TIMEOUT_MS: Record<AiTier, number> = { fast: 25_000, quality: 40_000 };

/** The longest a whole call may take, across every model tried. */
const TOTAL_TIMEOUT_MS = 70_000;

export type AiErrorCode = "rate_limited" | "credits_exhausted" | "not_configured" | "unavailable";

export class AiError extends Error {
  code: AiErrorCode;
  status: number;
  constructor(code: AiErrorCode, status: number) {
    super(code);
    this.name = "AiError";
    this.code = code;
    this.status = status;
  }
}

/** The model that last worked for each tier, kept while this function instance stays warm. */
const lastWorking = new Map<AiTier, string>();

export function resetModelCache(): void {
  lastWorking.clear();
}

/** Candidate models in the order to try them, without repeats. */
export function modelCandidates(tier: AiTier, override?: string | null): string[] {
  const list = [override?.trim() || undefined, lastWorking.get(tier), ...MODEL_CHAINS[tier]];
  return [...new Set(list.filter((m): m is string => !!m))];
}

interface ChatOptions {
  tier: AiTier;
  messages: ChatMessage[];
  apiKey: string | undefined | null;
  /** A model to try first, for example from the AI_MODEL_FAST secret. */
  override?: string | null;
  fetchImpl?: typeof fetch;
  now?: () => number;
}

/**
 * Ask the AI gateway for a completion. Throws AiError with a code the caller
 * can turn into a clear message: rate_limited, credits_exhausted,
 * not_configured or unavailable.
 */
export async function chatCompletion({
  tier,
  messages,
  apiKey,
  override,
  fetchImpl = fetch,
  now = Date.now,
}: ChatOptions): Promise<{ content: string; model: string }> {
  if (!apiKey) throw new AiError("not_configured", 500);

  const deadline = now() + TOTAL_TIMEOUT_MS;

  for (const model of modelCandidates(tier, override)) {
    const remaining = deadline - now();
    if (remaining < 3_000) break;

    const timer = new AbortController();
    const timeout = setTimeout(() => timer.abort(), Math.min(remaining, ATTEMPT_TIMEOUT_MS[tier]));

    let response: Response;
    try {
      response = await fetchImpl(AI_GATEWAY_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages }),
        signal: timer.signal,
      });
    } catch (error) {
      console.error(`AI request failed for ${model}:`, error);
      continue;
    } finally {
      clearTimeout(timeout);
    }

    // These two are about the account, so another model will not help.
    if (response.status === 429) throw new AiError("rate_limited", 429);
    if (response.status === 402) throw new AiError("credits_exhausted", 402);

    if (!response.ok) {
      // Unknown or retired model, or a provider fault. Move to the next one.
      console.warn(`AI model ${model} answered ${response.status}. Trying the next model.`);
      if (lastWorking.get(tier) === model) lastWorking.delete(tier);
      continue;
    }

    const data = await response.json().catch(() => null);
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content === "string" && content.trim()) {
      lastWorking.set(tier, model);
      return { content, model };
    }
    console.warn(`AI model ${model} returned an empty answer. Trying the next model.`);
  }

  throw new AiError("unavailable", 502);
}

/** Reads a JSON object out of a model answer, with or without code fences or extra text around it. */
export function parseJsonObject(text: string): Record<string, unknown> | null {
  const cleaned = String(text ?? "").replace(/```(?:json)?/gi, "").trim();
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first === -1 || last <= first) return null;
  try {
    const parsed = JSON.parse(cleaned.slice(first, last + 1));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** A trimmed string no longer than max, or null when the value is not usable text. */
export function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

/** The status and JSON body for a failed AI call, in the shape the app already reads. */
export function aiErrorBody(error: unknown): { status: number; body: { error: string } } {
  if (error instanceof AiError) {
    return { status: error.status, body: { error: error.code } };
  }
  return { status: 500, body: { error: "ai_error" } };
}
