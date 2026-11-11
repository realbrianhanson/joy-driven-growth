import { beforeEach, describe, expect, it } from "vitest";
import { clearReturnPath, isSafePath, rememberReturnPath, takeReturnPath } from "../return-path";

describe("isSafePath", () => {
  it("accepts paths on this site only", () => {
    expect(isSafePath("/accept-invite/abc")).toBe(true);
    expect(isSafePath("//evil.example.com")).toBe(false);
    expect(isSafePath("https://evil.example.com")).toBe(false);
    expect(isSafePath("/\\evil.example.com")).toBe(false);
    expect(isSafePath(null)).toBe(false);
  });
});

describe("return path", () => {
  beforeEach(() => localStorage.clear());

  it("hands the path back once, then forgets it", () => {
    rememberReturnPath("/accept-invite/abc", 1_000);
    expect(takeReturnPath(2_000)).toBe("/accept-invite/abc");
    expect(takeReturnPath(3_000)).toBeNull();
  });

  it("ignores a path that is more than an hour old", () => {
    rememberReturnPath("/accept-invite/abc", 0);
    expect(takeReturnPath(61 * 60 * 1000)).toBeNull();
  });

  it("never stores or returns a link to another site", () => {
    rememberReturnPath("https://evil.example.com", 0);
    expect(takeReturnPath(1)).toBeNull();
    localStorage.setItem("hc-return-to", JSON.stringify({ path: "//evil.example.com", at: 0 }));
    expect(takeReturnPath(1)).toBeNull();
  });

  it("survives broken stored data", () => {
    localStorage.setItem("hc-return-to", "{not json");
    expect(takeReturnPath(1)).toBeNull();
  });

  it("can be cleared", () => {
    rememberReturnPath("/accept-invite/abc", 0);
    clearReturnPath();
    expect(takeReturnPath(1)).toBeNull();
  });
});
