import { describe, expect, it } from "vitest";
import {
  MAX_CUSTOM_FIELD_KEYS,
  cleanCustomFields,
  cleanEmail,
  cleanOptionalText,
  cleanRating,
  formSource,
  isAllowedMediaUrl,
} from "../submission";

const HOST = "abc.supabase.co";

describe("cleanCustomFields", () => {
  it("keeps short answers and trims them", () => {
    expect(cleanCustomFields({ " What changed? ": "  A lot.  ", score: 9, ok: true })).toEqual({
      "What changed?": "A lot.",
      score: 9,
      ok: true,
    });
  });

  it("drops empty answers, nested objects and odd values", () => {
    expect(cleanCustomFields({ a: "", b: { nested: 1 }, c: null, d: Number.NaN, e: ["x", "", 2, {}] })).toEqual({ e: ["x", 2] });
  });

  it("treats missing or non-object input as no answers", () => {
    expect(cleanCustomFields(undefined)).toEqual({});
    expect(cleanCustomFields("text")).toEqual({});
    expect(cleanCustomFields([1, 2])).toEqual({});
  });

  it("refuses input that is too large", () => {
    const many = Object.fromEntries(Array.from({ length: MAX_CUSTOM_FIELD_KEYS + 1 }, (_, i) => [`q${i}`, "a"]));
    expect(cleanCustomFields(many)).toBeNull();

    const heavy = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`q${i}`, "x".repeat(4000)]));
    expect(cleanCustomFields(heavy)).toBeNull();
  });
});

describe("isAllowedMediaUrl", () => {
  it("accepts a public file in this project's storage", () => {
    expect(isAllowedMediaUrl(`https://${HOST}/storage/v1/object/public/videos/submissions/a/b.mp4`, HOST)).toBe(true);
  });

  it("rejects other hosts, other paths and plain http", () => {
    expect(isAllowedMediaUrl("https://evil.example.com/storage/v1/object/public/videos/a.mp4", HOST)).toBe(false);
    expect(isAllowedMediaUrl(`https://${HOST}/functions/v1/anything`, HOST)).toBe(false);
    expect(isAllowedMediaUrl(`http://${HOST}/storage/v1/object/public/videos/a.mp4`, HOST)).toBe(false);
    expect(isAllowedMediaUrl("javascript:alert(1)", HOST)).toBe(false);
    expect(isAllowedMediaUrl(42, HOST)).toBe(false);
  });
});

describe("cleanRating", () => {
  it("keeps whole ratings from 1 to 5", () => {
    expect(cleanRating(4)).toBe(4);
    expect(cleanRating("5")).toBe(5);
    expect(cleanRating(9)).toBe(5);
    expect(cleanRating(0)).toBe(1);
  });

  it("returns null when there is no usable rating", () => {
    expect(cleanRating(null)).toBeNull();
    expect(cleanRating("")).toBeNull();
    expect(cleanRating("great")).toBeNull();
  });
});

describe("cleanEmail", () => {
  it("accepts a normal address and lowers the case", () => {
    expect(cleanEmail("  Dana@Example.com ")).toBe("dana@example.com");
  });

  it("returns null for anything that is not an address", () => {
    expect(cleanEmail("n/a")).toBeNull();
    expect(cleanEmail("dana@nowhere")).toBeNull();
    expect(cleanEmail(undefined)).toBeNull();
  });
});

describe("cleanOptionalText", () => {
  it("trims, caps and turns empty text into null", () => {
    expect(cleanOptionalText("  Owner  ", 3)).toBe("Own");
    expect(cleanOptionalText("   ", 10)).toBeNull();
    expect(cleanOptionalText(null, 10)).toBeNull();
  });
});

describe("formSource", () => {
  it("keeps known sources and falls back to the form", () => {
    expect(formSource("ai_interview")).toBe("ai_interview");
    expect(formSource("manual")).toBe("form");
    expect(formSource(undefined)).toBe("form");
  });
});
