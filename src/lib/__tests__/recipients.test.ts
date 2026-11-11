import { describe, expect, it } from "vitest";
import { normalizePhone, parseRecipients, recipientsToText, renderMessage, smsSize } from "../recipients";

describe("normalizePhone", () => {
  it("reads US and Canada numbers the way people write them", () => {
    expect(normalizePhone("(904) 555-0142")).toBe("+19045550142");
    expect(normalizePhone("904.555.0142")).toBe("+19045550142");
    expect(normalizePhone("1 904 555 0142")).toBe("+19045550142");
  });

  it("keeps a number that already has a country code", () => {
    expect(normalizePhone("+44 7700 900123")).toBe("+447700900123");
  });

  it("refuses anything that is not a full number", () => {
    expect(normalizePhone("555-0142")).toBeNull();
    expect(normalizePhone("044 7700 900123")).toBeNull();
    expect(normalizePhone("call me")).toBeNull();
    expect(normalizePhone("0045550142")).toBeNull();
    expect(normalizePhone("")).toBeNull();
  });
});

describe("parseRecipients", () => {
  it("reads a number with a name on either side", () => {
    const result = parseRecipients("(904) 555-0142, Jane Doe\nMarcus\t904-555-0177\n+447700900123");
    expect(result.valid).toEqual([
      { phone: "+19045550142", first_name: "Jane" },
      { phone: "+19045550177", first_name: "Marcus" },
      { phone: "+447700900123", first_name: "" },
    ]);
    expect(result.invalid).toEqual([]);
  });

  it("removes repeats and reports lines with no number", () => {
    const result = parseRecipients("9045550142, Jane\n+1 904 555 0142, Jane again\nnot a number\n\n");
    expect(result.valid).toHaveLength(1);
    expect(result.duplicates).toBe(1);
    expect(result.invalid).toEqual(["not a number"]);
  });

  it("does not report a header row as a mistake", () => {
    const result = parseRecipients("phone, name\n9045550142, Jane");
    expect(result.invalid).toEqual([]);
    expect(result.valid).toHaveLength(1);
  });
});

describe("recipientsToText", () => {
  it("turns a saved list back into lines and survives a round trip", () => {
    const saved = [{ phone: "+19045550142", first_name: "Jane" }, { phone: "+19045550177", first_name: "" }, { nope: true }];
    const text = recipientsToText(saved);
    expect(text).toBe("+19045550142, Jane\n+19045550177");
    expect(parseRecipients(text).valid).toEqual([
      { phone: "+19045550142", first_name: "Jane" },
      { phone: "+19045550177", first_name: "" },
    ]);
  });

  it("returns an empty string for anything that is not a list", () => {
    expect(recipientsToText(null)).toBe("");
  });
});

describe("renderMessage", () => {
  it("fills in the name and the link everywhere they appear", () => {
    expect(renderMessage("Hi {first_name}! {form_link} Thanks, {first_name}.", "Jane", "https://x.io/f")).toBe("Hi Jane! https://x.io/f Thanks, Jane.");
  });

  it("uses a friendly word when there is no name", () => {
    expect(renderMessage("Hi {first_name}", "  ", "")).toBe("Hi there");
  });
});

describe("smsSize", () => {
  it("counts plain messages at 160 characters a text", () => {
    expect(smsSize("a".repeat(160))).toEqual({ characters: 160, segments: 1, unicode: false });
    expect(smsSize("a".repeat(161)).segments).toBe(2);
  });

  it("counts the wider symbols twice", () => {
    expect(smsSize("Cost: 20€").characters).toBe(10);
  });

  it("switches to the short format when a message has an emoji", () => {
    const size = smsSize(`${"a".repeat(70)}🙂`);
    expect(size.unicode).toBe(true);
    expect(size.segments).toBe(2);
  });

  it("counts an empty message as nothing to send", () => {
    expect(smsSize("").segments).toBe(0);
  });
});
