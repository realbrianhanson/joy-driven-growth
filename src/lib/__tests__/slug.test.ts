import { describe, expect, it } from "vitest";
import { randomSuffix, sanitizeSlugInput, slugify, suggestSlug } from "../slug";

describe("slugify", () => {
  it("makes a clean lower-case slug", () => {
    expect(slugify("  Acme Roofing & Sons!  ")).toBe("acme-roofing-sons");
    expect(slugify("Café Déjà Vu")).toBe("cafe-deja-vu");
  });

  it("never ends with a hyphen after trimming to length", () => {
    expect(slugify("abcd efgh", 5)).toBe("abcd");
  });

  it("returns an empty string when nothing usable is left", () => {
    expect(slugify("!!!")).toBe("");
  });
});

describe("randomSuffix", () => {
  it("returns the asked length from characters that are easy to read", () => {
    const suffix = randomSuffix(6);
    expect(suffix).toMatch(/^[a-hj-km-np-z2-9]{6}$/);
  });
});

describe("suggestSlug", () => {
  it("adds a short suffix so two accounts never collide on a common name", () => {
    expect(suggestSlug("Client Feedback")).toMatch(/^client-feedback-[a-z0-9]{4}$/);
    expect(suggestSlug("Client Feedback")).not.toBe(suggestSlug("Client Feedback"));
  });

  it("uses the fallback when the name has no usable characters", () => {
    expect(suggestSlug("???", "wall")).toMatch(/^wall-[a-z0-9]{4}$/);
  });
});

describe("sanitizeSlugInput", () => {
  it("cleans typing without removing a trailing hyphen mid-word", () => {
    expect(sanitizeSlugInput("My Form ")).toBe("my-form-");
    expect(sanitizeSlugInput("a--b__c")).toBe("a-bc");
  });
});
