import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AiError,
  MODEL_CHAINS,
  aiErrorBody,
  chatCompletion,
  cleanText,
  modelCandidates,
  parseJsonObject,
  resetModelCache,
} from "../ai";

const messages = [{ role: "user" as const, content: "Hello" }];

function answer(content: string, status = 200): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status });
}

function modelOf(call: unknown[]): string {
  return JSON.parse((call[1] as RequestInit).body as string).model;
}

describe("chatCompletion", () => {
  beforeEach(() => {
    resetModelCache();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("uses the first model when it answers", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(answer("Hi there"));
    const result = await chatCompletion({ tier: "fast", messages, apiKey: "key", fetchImpl });
    expect(result).toEqual({ content: "Hi there", model: MODEL_CHAINS.fast[0] });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("moves to the next model when one is retired", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response("model not found", { status: 404 }))
      .mockResolvedValueOnce(answer("Second model here"));
    const result = await chatCompletion({ tier: "fast", messages, apiKey: "key", fetchImpl });
    expect(result.model).toBe(MODEL_CHAINS.fast[1]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("remembers the model that worked and starts with it next time", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response("gone", { status: 400 }))
      .mockResolvedValueOnce(answer("ok"))
      .mockResolvedValueOnce(answer("ok again"));
    await chatCompletion({ tier: "fast", messages, apiKey: "key", fetchImpl });
    await chatCompletion({ tier: "fast", messages, apiKey: "key", fetchImpl });
    expect(modelOf(fetchImpl.mock.calls[2])).toBe(MODEL_CHAINS.fast[1]);
  });

  it("tries an override model first", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(answer("ok"));
    const result = await chatCompletion({ tier: "quality", messages, apiKey: "key", override: " custom/model ", fetchImpl });
    expect(result.model).toBe("custom/model");
  });

  it("moves on after a network failure or an empty answer", async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValueOnce(answer("   "))
      .mockResolvedValueOnce(answer("Third time"));
    const result = await chatCompletion({ tier: "fast", messages, apiKey: "key", fetchImpl });
    expect(result.content).toBe("Third time");
  });

  it("stops at once when the account is rate limited", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("slow down", { status: 429 }));
    await expect(chatCompletion({ tier: "fast", messages, apiKey: "key", fetchImpl })).rejects.toMatchObject({
      code: "rate_limited",
      status: 429,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("stops at once when AI credits have run out", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("pay", { status: 402 }));
    await expect(chatCompletion({ tier: "fast", messages, apiKey: "key", fetchImpl })).rejects.toMatchObject({
      code: "credits_exhausted",
    });
  });

  it("reports unavailable when every model fails", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("nope", { status: 500 }));
    await expect(chatCompletion({ tier: "fast", messages, apiKey: "key", fetchImpl })).rejects.toMatchObject({
      code: "unavailable",
      status: 502,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(MODEL_CHAINS.fast.length);
  });

  it("gives up when the time budget is spent", async () => {
    let clock = 0;
    const fetchImpl = vi.fn().mockImplementation(async () => {
      clock += 69_000;
      return new Response("slow failure", { status: 500 });
    });
    await expect(
      chatCompletion({ tier: "quality", messages, apiKey: "key", fetchImpl, now: () => clock }),
    ).rejects.toBeInstanceOf(AiError);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("fails clearly when the key is missing", async () => {
    await expect(chatCompletion({ tier: "fast", messages, apiKey: "" })).rejects.toMatchObject({ code: "not_configured" });
  });
});

describe("modelCandidates", () => {
  beforeEach(() => resetModelCache());

  it("lists each model once", () => {
    const list = modelCandidates("quality", MODEL_CHAINS.quality[1]);
    expect(list[0]).toBe(MODEL_CHAINS.quality[1]);
    expect(new Set(list).size).toBe(list.length);
  });

  it("starts both tiers with the current default chat model", () => {
    expect(MODEL_CHAINS.fast[0]).toBe("google/gemini-3.8-flash");
    expect(MODEL_CHAINS.quality[0]).toBe("google/gemini-3.8-flash");
  });
});

describe("parseJsonObject", () => {
  it("reads plain JSON", () => {
    expect(parseJsonObject('{"a": 1}')).toEqual({ a: 1 });
  });

  it("reads JSON inside code fences and extra text", () => {
    expect(parseJsonObject('Here you go:\n```json\n{"a": "b"}\n```\nDone.')).toEqual({ a: "b" });
  });

  it("returns null for anything else", () => {
    expect(parseJsonObject("no json here")).toBeNull();
    expect(parseJsonObject("[1, 2]")).toBeNull();
    expect(parseJsonObject('{"broken": ')).toBeNull();
  });
});

describe("cleanText", () => {
  it("trims and caps text", () => {
    expect(cleanText("  hello world  ", 5)).toBe("hello");
  });

  it("returns null for empty or non-text values", () => {
    expect(cleanText("   ", 10)).toBeNull();
    expect(cleanText(42, 10)).toBeNull();
  });
});

describe("aiErrorBody", () => {
  it("maps an AiError to its code and status", () => {
    expect(aiErrorBody(new AiError("rate_limited", 429))).toEqual({ status: 429, body: { error: "rate_limited" } });
  });

  it("maps anything else to a generic error", () => {
    expect(aiErrorBody(new Error("boom"))).toEqual({ status: 500, body: { error: "ai_error" } });
  });
});
