import { describe, expect, it } from "vitest";
import {
  formatCompact,
  formatCurrency,
  formatDate,
  initials,
  parseHex,
  pluralize,
  readableTextColor,
  roleLine,
  safeHex,
  timeAgo,
} from "../format";

describe("formatCurrency", () => {
  it("shows whole dollars with separators", () => {
    expect(formatCurrency(12500)).toBe("$12,500");
    expect(formatCurrency(0)).toBe("$0");
  });
});

describe("formatCompact", () => {
  it("shortens large counts", () => {
    expect(formatCompact(950)).toBe("950");
    expect(formatCompact(1500)).toBe("1.5k");
    expect(formatCompact(2000)).toBe("2k");
    expect(formatCompact(48_200)).toBe("48k");
    expect(formatCompact(2_300_000)).toBe("2.3m");
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-11-10T12:00:00Z");

  it("steps from seconds to days, then to a date", () => {
    expect(timeAgo("2026-11-10T11:59:30Z", now)).toBe("Just now");
    expect(timeAgo("2026-11-10T11:15:00Z", now)).toBe("45m ago");
    expect(timeAgo("2026-11-10T07:00:00Z", now)).toBe("5h ago");
    expect(timeAgo("2026-11-07T12:00:00Z", now)).toBe("3d ago");
    expect(timeAgo("2026-09-01T12:00:00Z", now)).toBe(formatDate("2026-09-01T12:00:00Z"));
  });

  it("returns nothing for a missing or broken date", () => {
    expect(timeAgo(null, now)).toBe("");
    expect(timeAgo("not a date", now)).toBe("");
  });
});

describe("formatDate", () => {
  it("returns an empty string for a broken date", () => {
    expect(formatDate("nope")).toBe("");
  });
});

describe("initials", () => {
  it("uses the first and last name", () => {
    expect(initials("Dana Marie Reyes")).toBe("DR");
    expect(initials("dana")).toBe("DA");
  });

  it("never returns an empty avatar", () => {
    expect(initials("")).toBe("?");
    expect(initials(null)).toBe("?");
  });
});

describe("roleLine", () => {
  it("joins the parts that exist", () => {
    expect(roleLine("Owner", "Northside Dental")).toBe("Owner, Northside Dental");
    expect(roleLine(null, " Northside Dental ")).toBe("Northside Dental");
    expect(roleLine(undefined, null)).toBe("");
  });
});

describe("pluralize", () => {
  it("picks the right word for the count", () => {
    expect(pluralize(1, "draft")).toBe("1 draft");
    expect(pluralize(0, "draft")).toBe("0 drafts");
    expect(pluralize(3, "person", "people")).toBe("3 people");
  });
});

describe("colour helpers", () => {
  it("reads 3 and 6 digit hex values", () => {
    expect(parseHex("#fff")).toEqual([255, 255, 255]);
    expect(parseHex("1A1714")).toEqual([26, 23, 20]);
    expect(parseHex("#12345")).toBeNull();
    expect(parseHex(null)).toBeNull();
  });

  it("picks dark text for light colours and white text for dark colours", () => {
    expect(readableTextColor("#F8F6F1")).toBe("#1a1714");
    expect(readableTextColor("#FFD84D")).toBe("#1a1714");
    expect(readableTextColor("#1A1714")).toBe("#ffffff");
    expect(readableTextColor("#2563EB")).toBe("#ffffff");
    expect(readableTextColor("not a colour")).toBe("#ffffff");
  });

  it("falls back when a typed colour is not valid", () => {
    expect(safeHex("#ABC", "#000000")).toBe("#aabbcc");
    expect(safeHex("blue", "#000000")).toBe("#000000");
  });
});
