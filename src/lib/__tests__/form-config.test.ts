import { describe, expect, it } from "vitest";
import {
  GENERIC_SUBMIT_ERROR,
  answersByQuestion,
  buildReviewUrl,
  composeStory,
  firstMissingPrompt,
  parseFormConfig,
  readFunctionErrorCode,
  submitErrorMessage,
  writtenPrompts,
  type FormQuestion,
} from "../form-config";

const prompts: FormQuestion[] = [
  { id: "2", type: "long_text", question: "What was going on before?", required: true },
  { id: "3", type: "long_text", question: "What changed?", required: false },
];

describe("parseFormConfig", () => {
  it("gives safe defaults for an empty form", () => {
    const config = parseFormConfig(null);
    expect(config.aiEnabled).toBe(false);
    expect(config.prompts).toEqual([]);
    expect(config.welcomeEnabled).toBe(true);
    expect(config.consentEnabled).toBe(true);
    expect(config.consentText).toContain("{company}");
    expect(config.videoMaxLength).toBe(60);
    expect(config.review).toEqual({ show: false });
  });

  it("reads old forms that store a bare list of questions", () => {
    const config = parseFormConfig([
      { id: 1, type: "rating", question: "Rate us" },
      { id: 2, type: "long_text", question: " What changed? ", required: true },
      { id: 3, type: "long_text", question: "   " },
    ]);
    expect(config.prompts).toEqual([
      { id: "2", type: "long_text", question: "What changed?", placeholder: undefined, helpText: undefined, required: true, purpose: undefined },
    ]);
  });

  it("reads the newer object shape with settings", () => {
    const config = parseFormConfig({
      ai_enabled: true,
      ai_prompt: "  We fix roofs.  ",
      questions: [{ id: "a", type: "short_text", question: "Why us?" }],
      settings: { welcome_enabled: false, consent_enabled: false, video_max_length: 120, review_platform: "google", review_url: "ChIJabc123" },
    });
    expect(config.aiEnabled).toBe(true);
    expect(config.aiPrompt).toBe("We fix roofs.");
    expect(config.welcomeEnabled).toBe(false);
    expect(config.consentEnabled).toBe(false);
    expect(config.videoMaxLength).toBe(120);
    expect(config.review).toEqual({
      show: true,
      label: "Google",
      url: "https://search.google.com/local/writereview?placeid=ChIJabc123",
    });
  });

  it("ignores a video length outside the allowed range", () => {
    expect(parseFormConfig({ settings: { video_max_length: 5 } }).videoMaxLength).toBe(60);
    expect(parseFormConfig({ settings: { video_max_length: 9000 } }).videoMaxLength).toBe(60);
  });

  it("still honours the Google place id that older forms stored", () => {
    const config = parseFormConfig({ settings: { google_place_id: "ChIJold" } });
    expect(config.review).toMatchObject({ show: true, label: "Google" });
  });
});

describe("buildReviewUrl", () => {
  it("keeps a full link and adds https to a bare domain", () => {
    expect(buildReviewUrl("trustpilot", "https://trustpilot.com/review/acme.com")).toBe("https://trustpilot.com/review/acme.com");
    expect(buildReviewUrl("other", "acme.com/reviews")).toBe("https://acme.com/reviews");
  });

  it("refuses anything that is not a web link", () => {
    expect(buildReviewUrl("other", "javascript:alert(1)")).toBeNull();
    expect(buildReviewUrl("other", "   ")).toBeNull();
  });
});

describe("written answers", () => {
  it("leaves the rating and recordings out of the written prompts", () => {
    const all: FormQuestion[] = [{ id: "1", type: "rating", question: "Rate" }, { id: "9", type: "video", question: "Record" }, ...prompts];
    expect(writtenPrompts(all)).toEqual(prompts);
  });

  it("joins answers into one story in question order", () => {
    expect(composeStory(prompts, { "3": " It got faster. ", "2": "We were slow." })).toBe("We were slow.\n\nIt got faster.");
  });

  it("keys answers by the question the client saw", () => {
    expect(answersByQuestion(prompts, { "2": "We were slow.", "3": "  " })).toEqual({ "What was going on before?": "We were slow." });
  });

  it("finds the first required prompt left blank", () => {
    expect(firstMissingPrompt(prompts, { "3": "Answered" })?.id).toBe("2");
    expect(firstMissingPrompt(prompts, { "2": "Answered" })).toBeNull();
  });
});

describe("submit errors", () => {
  it("turns a known code into a message the client can act on", () => {
    expect(submitErrorMessage("rate_limited")).toContain("Wait a minute");
    expect(submitErrorMessage("invalid_custom_fields")).toContain("too long");
  });

  it("falls back to a message that says the answers are safe", () => {
    expect(submitErrorMessage("something_new")).toBe(GENERIC_SUBMIT_ERROR);
    expect(submitErrorMessage(null)).toBe(GENERIC_SUBMIT_ERROR);
  });

  it("reads the error code from a failed function call", async () => {
    const error = { context: new Response(JSON.stringify({ error: "form_not_published" }), { status: 403 }) };
    expect(await readFunctionErrorCode(error)).toBe("form_not_published");
    expect(await readFunctionErrorCode({ context: new Response("not json") })).toBeNull();
    expect(await readFunctionErrorCode(new Error("network"))).toBeNull();
  });
});
