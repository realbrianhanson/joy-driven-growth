import { describe, it, expect } from "vitest";
import { DEFAULT_CONSENT_TEMPLATE, renderConsentText, DISPLAY_PREFERENCE_OPTIONS } from "../consent";

describe("renderConsentText", () => {
  it("substitutes {company} with the provided name", () => {
    const out = renderConsentText(DEFAULT_CONSENT_TEMPLATE, "Acme Co");
    expect(out).toContain("Acme Co permission");
    expect(out).not.toContain("{company}");
  });
  it("falls back to generic phrase when company is empty", () => {
    expect(renderConsentText(DEFAULT_CONSENT_TEMPLATE, "")).toContain("this business");
  });
  it("falls back when company is null/undefined", () => {
    expect(renderConsentText(DEFAULT_CONSENT_TEMPLATE, null)).toContain("this business");
    expect(renderConsentText(DEFAULT_CONSENT_TEMPLATE, undefined)).toContain("this business");
  });
  it("trims whitespace-only company to fallback", () => {
    expect(renderConsentText(DEFAULT_CONSENT_TEMPLATE, "   ")).toContain("this business");
  });
  it("replaces multiple {company} occurrences", () => {
    expect(renderConsentText("{company} and {company}", "X")).toBe("X and X");
  });
});

describe("DISPLAY_PREFERENCE_OPTIONS", () => {
  it("exposes the three required preference values", () => {
    const values = DISPLAY_PREFERENCE_OPTIONS.map((o) => o.value).sort();
    expect(values).toEqual(["anonymous", "first_initial", "full"]);
  });
});