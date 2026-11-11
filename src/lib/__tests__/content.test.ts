import { describe, expect, it } from "vitest";
import {
  CONTENT_FORMATS,
  contentErrorMessage,
  contentTypeLabel,
  flattenContent,
  isContentKind,
  kindFromDbType,
  readCaseStudy,
  readQuote,
  readThread,
  readableStoredContent,
  storedStructure,
} from "../content";
import { CONTENT_KINDS } from "../../../supabase/functions/_shared/content";

describe("formats", () => {
  it("offers exactly the formats the server can write", () => {
    expect(CONTENT_FORMATS.map((f) => f.id).sort()).toEqual([...CONTENT_KINDS].sort());
  });

  it("maps saved rows back to a format", () => {
    expect(kindFromDbType("linkedin_post")).toBe("linkedin");
    expect(kindFromDbType("video_highlight")).toBeNull();
    expect(isContentKind("quote")).toBe(true);
    expect(isContentKind("instagram")).toBe(false);
  });

  it("labels every saved type, old ones included", () => {
    expect(contentTypeLabel("case_study")).toBe("Case study");
    expect(contentTypeLabel("instagram_carousel")).toBe("Instagram carousel");
    expect(contentTypeLabel("unknown_type")).toBe("Draft");
  });
});

describe("readers", () => {
  it("fills gaps in what a model returned", () => {
    expect(readThread({ tweets: ["One", 2, " ", "Three"] })).toEqual({ tweets: ["One", "Three"] });
    expect(readThread(null)).toEqual({ tweets: [] });
  });

  it("drops case study metrics with a missing part", () => {
    const study = readCaseStudy({ headline: "Faster", metrics: [{ label: "Growth", value: "32%" }, { label: "", value: "5" }, "junk"] });
    expect(study.metrics).toEqual([{ label: "Growth", value: "32%" }]);
    expect(study.challenge).toBe("");
  });

  it("never invents a star rating", () => {
    expect(readQuote({ quote: "Great", author: "Dana" }).rating).toBeNull();
    expect(readQuote({ quote: "Great", rating: 9 }).rating).toBeNull();
    expect(readQuote({ quote: "Great", rating: 4 }).rating).toBe(4);
  });
});

describe("flattenContent", () => {
  it("writes a LinkedIn post as plain paragraphs", () => {
    expect(flattenContent("linkedin", { hook: "A hook", body: "The body.", cta: "", hashtags: ["#one", "#two"] })).toBe("A hook\n\nThe body.\n\n#one #two");
  });

  it("writes an email with its first subject line", () => {
    expect(flattenContent("email", { subjectLines: ["First", "Second"], preheader: "Peek", body: "Hi {first_name},", cta: "Book a call" })).toBe(
      "Subject: First\n\nPreview: Peek\n\nHi {first_name},\n\n[Book a call]",
    );
  });

  it("writes a case study with only the parts that exist", () => {
    const text = flattenContent("casestudy", {
      headline: "Faster follow-up",
      challenge: "Slow replies.",
      results: "Bookings rose.",
      metrics: [{ label: "More bookings", value: "32%" }],
      pullQuote: "It worked.",
    });
    expect(text).toBe('Faster follow-up\n\nThe challenge\nSlow replies.\n\nThe results\nBookings rose.\n\nMore bookings: 32%\n\n"It worked."');
  });

  it("writes a quote with its byline and no em dash", () => {
    const text = flattenContent("quote", { quote: "It worked.", author: "Dana R.", company: "Northside Dental" });
    expect(text).toBe('"It worked."\nDana R., Northside Dental');
    expect(text).not.toContain("—");
  });

  it("joins a thread with blank lines", () => {
    expect(flattenContent("twitter", { tweets: ["One", "Two"] })).toBe("One\n\nTwo");
  });
});

describe("saved rows", () => {
  it("shows plain text as it is", () => {
    expect(readableStoredContent("linkedin_post", "  Hello there  ")).toBe("Hello there");
    expect(readableStoredContent("linkedin_post", null)).toBe("");
  });

  it("turns old rows that stored raw JSON back into text", () => {
    expect(readableStoredContent("twitter_thread", JSON.stringify({ tweets: ["One", "Two"] }))).toBe("One\n\nTwo");
    expect(readableStoredContent("instagram_carousel", JSON.stringify({ slides: [{ text: "Slide one" }, { text: "Slide two" }] }))).toBe("Slide one\n\nSlide two");
  });

  it("returns broken JSON untouched", () => {
    expect(readableStoredContent("case_study", "{broken")).toBe("{broken");
  });

  it("finds the structured copy only when the row has one it can render", () => {
    expect(storedStructure({ contentTypeKey: "quote", structured: { quote: "Hi" } })).toEqual({ kind: "quote", data: { quote: "Hi" } });
    expect(storedStructure({ contentTypeKey: "instagram", structured: {} })).toBeNull();
    expect(storedStructure(null)).toBeNull();
  });
});

describe("contentErrorMessage", () => {
  it("never tells a customer about the operator's AI credits", () => {
    const message = contentErrorMessage("credits_exhausted");
    expect(message).toContain("not available");
    expect(message.toLowerCase()).not.toContain("credit");
  });

  it("explains the common failures", () => {
    expect(contentErrorMessage("rate_limited")).toContain("Wait a minute");
    expect(contentErrorMessage("no_text")).toContain("no written text");
    expect(contentErrorMessage(undefined)).toContain("Try again");
  });
});
