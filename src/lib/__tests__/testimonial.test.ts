import { describe, expect, it } from "vitest";
import { IMPORT_MAX_ROWS, answerEntries, maskName, parseCsv, parseTestimonialCsv, sourceLabel, toCsv } from "../testimonial";
import { maskName as serverMaskName } from "../../../supabase/functions/_shared/content";

describe("maskName", () => {
  it("follows the display choice the client made", () => {
    expect(maskName("Dana Reyes", "full")).toBe("Dana Reyes");
    expect(maskName("Dana Maria Reyes", "first_initial")).toBe("Dana M.");
    expect(maskName("Dana", "first_initial")).toBe("Dana");
    expect(maskName("Dana Reyes", "anonymous")).toBe("Anonymous");
    expect(maskName(null, "full")).toBe("Anonymous");
  });

  it("matches the copy the server uses for generated content", () => {
    for (const preference of ["full", "first_initial", "anonymous", null]) {
      for (const name of ["Dana Reyes", "dana", "  ", "Jo van der Berg"]) {
        expect(serverMaskName(name, preference)).toBe(maskName(name, preference));
      }
    }
  });
});

describe("sourceLabel", () => {
  it("names known sources and treats the rest as the form", () => {
    expect(sourceLabel("ai_interview")).toBe("Guided interview");
    expect(sourceLabel("import")).toBe("Imported");
    expect(sourceLabel(null)).toBe("Form");
    expect(sourceLabel("mystery")).toBe("Form");
  });
});

describe("answerEntries", () => {
  it("shows answers under the question the client saw", () => {
    expect(answerEntries({ "What changed?": " Everything. " })).toEqual([{ label: "What changed?", answer: "Everything." }]);
  });

  it("turns old numeric keys back into question text when the form is known", () => {
    const questions = [{ id: "2", question: "What was going on before?" }];
    expect(answerEntries({ "2": "Chaos", "7": "More" }, questions)).toEqual([
      { label: "What was going on before?", answer: "Chaos" },
      { label: "Question 7", answer: "More" },
    ]);
  });

  it("skips empty answers and bad input", () => {
    expect(answerEntries({ a: "", b: null })).toEqual([]);
    expect(answerEntries(null)).toEqual([]);
    expect(answerEntries(["x"])).toEqual([]);
  });
});

describe("parseCsv", () => {
  it("reads quoted fields with commas, quotes and line breaks inside", () => {
    const rows = parseCsv('name,quote\r\n"Reyes, Dana","She said ""wow""\nand meant it"\n');
    expect(rows).toEqual([
      ["name", "quote"],
      ["Reyes, Dana", 'She said "wow"\nand meant it'],
    ]);
  });

  it("ignores a byte order mark and blank lines", () => {
    expect(parseCsv("﻿a,b\n\n1,2\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("parseTestimonialCsv", () => {
  it("maps common column names", () => {
    const result = parseTestimonialCsv("Customer Name,Review,Stars,Company,Email\nDana,Great work,4.6,Northside,DANA@example.com\n");
    expect(result.error).toBeNull();
    expect(result.rows).toEqual([
      {
        author_name: "Dana",
        content: "Great work",
        rating: 5,
        author_title: null,
        author_company: "Northside",
        author_email: "DANA@example.com",
      },
    ]);
  });

  it("skips rows with no name or no words, and drops bad ratings and emails", () => {
    const result = parseTestimonialCsv("name,testimonial,rating,email\nDana,,5,\n,No name,5,\nSam,Solid,11,not-an-email\n");
    expect(result.skipped).toBe(2);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].rating).toBeNull();
    expect(result.rows[0].author_email).toBeNull();
  });

  it("explains what is missing", () => {
    expect(parseTestimonialCsv("name,testimonial").error).toContain("header row");
    expect(parseTestimonialCsv("who,what\nDana,Great").error).toContain('"name" column');
    expect(parseTestimonialCsv("name,testimonial\n,\nDana,").error).toContain("No rows");
  });

  it("refuses a file that is too large to review", () => {
    const rows = Array.from({ length: IMPORT_MAX_ROWS + 1 }, (_, i) => `Person ${i},Good`).join("\n");
    expect(parseTestimonialCsv(`name,testimonial\n${rows}`).error).toContain(`up to ${IMPORT_MAX_ROWS}`);
  });
});

describe("toCsv", () => {
  it("quotes only the fields that need it and round-trips through the parser", () => {
    const csv = toCsv([{ name: "Reyes, Dana", quote: 'Said "wow"', rating: 5, note: null }]);
    expect(csv).toBe('name,quote,rating,note\n"Reyes, Dana","Said ""wow""",5,');
    expect(parseCsv(csv)[1]).toEqual(["Reyes, Dana", 'Said "wow"', "5", ""]);
  });

  it("returns an empty string for no rows", () => {
    expect(toCsv([])).toBe("");
  });
});
