import { describe, it, expect } from "vitest";
import { FORM_TEMPLATES, PURPOSE_LABELS } from "../form-templates";

describe("FORM_TEMPLATES", () => {
  it("includes the expected templates", () => {
    const ids = FORM_TEMPLATES.map((t) => t.id).sort();
    expect(ids).toEqual(["blank", "casestudy", "marketing", "quick", "video"]);
  });
  it("marketing template is flagged recommended", () => {
    expect(FORM_TEMPLATES.find((t) => t.id === "marketing")!.recommended).toBe(true);
  });
  it("every template has at least one required question", () => {
    for (const tpl of FORM_TEMPLATES) {
      expect(tpl.questions.length).toBeGreaterThan(0);
      expect(tpl.questions.some((q) => q.required)).toBe(true);
    }
  });
  it("non-video templates include a rating question", () => {
    for (const tpl of FORM_TEMPLATES.filter((t) => t.id !== "video")) {
      expect(tpl.questions.some((q) => q.type === "rating")).toBe(true);
    }
  });
  it("every question has a unique id within its template", () => {
    for (const tpl of FORM_TEMPLATES) {
      const ids = tpl.questions.map((q) => q.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
  it("every question purpose has a label", () => {
    for (const tpl of FORM_TEMPLATES) {
      for (const q of tpl.questions) {
        expect(PURPOSE_LABELS[q.purpose]).toBeTruthy();
      }
    }
  });
});