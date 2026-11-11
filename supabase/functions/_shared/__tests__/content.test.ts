import { describe, expect, it } from "vitest";
import {
  CONTENT_KINDS,
  type SourceTestimonial,
  contentText,
  fallbackQuote,
  isContentKind,
  isVerbatim,
  maskName,
  normalizeContent,
  sourceNumbers,
  systemPrompt,
  unverifiedNumbers,
  userPrompt,
} from "../content";

const source: SourceTestimonial = {
  name: "Dana R.",
  title: "Owner",
  company: "Northside Dental",
  content: "We were losing new patients to slow follow-up. Within three weeks, bookings were up 32%. I'd tell anyone to start sooner.",
  rating: 5,
};

describe("maskName", () => {
  it("matches the display choices used on public pages", () => {
    expect(maskName("Dana Reyes", "full")).toBe("Dana Reyes");
    expect(maskName("Dana Reyes", "first_initial")).toBe("Dana R.");
    expect(maskName("Dana", "first_initial")).toBe("Dana");
    expect(maskName("Dana Reyes", "anonymous")).toBe("Anonymous");
    expect(maskName("  ", null)).toBe("Anonymous");
  });
});

describe("isContentKind", () => {
  it("accepts only the formats that have a prompt", () => {
    for (const kind of CONTENT_KINDS) expect(isContentKind(kind)).toBe(true);
    expect(isContentKind("instagram")).toBe(false);
    expect(isContentKind(undefined)).toBe(false);
  });
});

describe("prompts", () => {
  it("has a prompt for every format", () => {
    for (const kind of CONTENT_KINDS) {
      expect(systemPrompt(kind)).toContain("Shape:");
      expect(systemPrompt(kind)).toContain("Never add one");
    }
  });

  it("gives the model the customer's words and nothing about sales", () => {
    const prompt = userPrompt([source]);
    expect(prompt).toContain("Dana R., Owner, Northside Dental");
    expect(prompt).toContain("Rating: 5 out of 5");
    expect(prompt).toContain(source.content);
  });

  it("leaves the rating out when there is none", () => {
    expect(userPrompt([{ ...source, rating: null }])).not.toContain("Rating");
  });
});

describe("isVerbatim", () => {
  it("accepts an exact line, whatever the quote marks, case or end punctuation", () => {
    expect(isVerbatim("bookings were up 32%", [source])).toBe(true);
    expect(isVerbatim("“I’d tell anyone to start sooner.”", [source])).toBe(true);
    expect(isVerbatim("WE WERE LOSING NEW PATIENTS", [source])).toBe(true);
  });

  it("rejects reworded or very short lines", () => {
    expect(isVerbatim("bookings went up by a third", [source])).toBe(false);
    expect(isVerbatim("up 32%", [source])).toBe(false);
  });
});

describe("fallbackQuote", () => {
  it("returns the first sentence", () => {
    expect(fallbackQuote(source.content)).toBe("We were losing new patients to slow follow-up.");
  });

  it("cuts a very long sentence at a word", () => {
    const quote = fallbackQuote(`${"word ".repeat(80)}end`, 60);
    expect(quote.length).toBeLessThanOrEqual(63);
    expect(quote.endsWith("...")).toBe(true);
  });
});

describe("number checks", () => {
  it("collects numbers the customer gave, with number words", () => {
    const known = sourceNumbers([source]);
    expect(known.has("32")).toBe(true);
    expect(known.has("3")).toBe(true);
    expect(known.has("5")).toBe(true);
  });

  it("flags numbers that the customer never gave", () => {
    expect(unverifiedNumbers("Bookings rose 32% in 3 weeks.", [source])).toEqual([]);
    expect(unverifiedNumbers("Bookings rose 47% and revenue grew $12,000.", [source])).toEqual(["47%", "$12,000"]);
  });

  it("treats 12k and 12,000 as the same number", () => {
    const withMoney = { ...source, content: "We made an extra $12,000 in the first month." };
    expect(unverifiedNumbers("An extra $12k in month one.", [withMoney])).toEqual([]);
  });
});

describe("contentText", () => {
  it("joins every string in a generated piece", () => {
    expect(contentText({ a: "one", b: ["two", { c: "three" }], d: 4 })).toBe("one\ntwo\nthree");
  });
});

describe("normalizeContent", () => {
  it("returns null when the model gave nothing usable", () => {
    expect(normalizeContent("linkedin", null, [source])).toBeNull();
    expect(normalizeContent("linkedin", { hook: "Only a hook" }, [source])).toBeNull();
    expect(normalizeContent("twitter", { tweets: ["one"] }, [source])).toBeNull();
    expect(normalizeContent("email", { body: "Hi" }, [source])).toBeNull();
  });

  it("cleans a LinkedIn post", () => {
    const result = normalizeContent("linkedin", { hook: " A hook ", body: "Body text", cta: "Thoughts?", hashtags: ["dental", "#growth", "x", "y"] }, [source]);
    expect(result).toEqual({ hook: "A hook", body: "Body text", cta: "Thoughts?", hashtags: ["#dental", "#growth", "#x"] });
  });

  it("keeps a thread and drops hashtags", () => {
    const result = normalizeContent("twitter", { tweets: ["One", "Two", 3, "Four"], hashtags: ["#no"] }, [source]);
    expect(result).toEqual({ tweets: ["One", "Two", "Four"], hashtags: [] });
  });

  it("drops case study metrics that the customer never gave", () => {
    const result = normalizeContent(
      "casestudy",
      {
        headline: "Faster follow-up, fuller schedule",
        challenge: "Slow follow-up lost patients.",
        solution: "",
        results: "Bookings rose.",
        metrics: [
          { label: "More bookings", value: "32%" },
          { label: "Revenue", value: "$50,000" },
          { label: "Happier team", value: "Much" },
        ],
        pullQuote: "Bookings exploded overnight",
      },
      [source],
    );
    expect(result?.metrics).toEqual([{ label: "More bookings", value: "32%" }]);
    expect(result?.pullQuote).toBe("We were losing new patients to slow follow-up.");
  });

  it("uses the model's quote only when it is word for word", () => {
    const exact = normalizeContent("quote", { quote: "“bookings were up 32%”" }, [source]);
    expect(exact).toEqual({ quote: "bookings were up 32%", author: "Dana R.", company: "Owner, Northside Dental", rating: 5 });

    const reworded = normalizeContent("quote", { quote: "Bookings jumped by a third in weeks" }, [source]);
    expect(reworded?.quote).toBe("We were losing new patients to slow follow-up.");
  });

  it("takes the author and rating from the record, never from the model", () => {
    const result = normalizeContent("quote", { quote: "bookings were up 32%", author: "Someone Else", rating: 1 }, [source]);
    expect(result?.author).toBe("Dana R.");
    expect(result?.rating).toBe(5);
  });
});
