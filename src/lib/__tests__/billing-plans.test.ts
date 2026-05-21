import { describe, it, expect } from "vitest";
import { PLANS, PLAN_RANK, meetsPlan } from "../billing-plans";

describe("PLANS catalog", () => {
  it("includes free, starter, pro, scale", () => {
    expect(Object.keys(PLANS).sort()).toEqual(["free", "pro", "scale", "starter"]);
  });
  it("marks pro as popular", () => {
    expect(PLANS.pro.popular).toBe(true);
  });
  it("free and scale have no priceId", () => {
    expect(PLANS.free.priceId).toBeNull();
    expect(PLANS.scale.priceId).toBeNull();
  });
});

describe("meetsPlan", () => {
  it("returns true when current equals required", () => {
    expect(meetsPlan("pro", "pro")).toBe(true);
  });
  it("returns true when current is higher rank", () => {
    expect(meetsPlan("pro", "starter")).toBe(true);
    expect(meetsPlan("scale", "free")).toBe(true);
  });
  it("returns false when current is lower rank", () => {
    expect(meetsPlan("free", "starter")).toBe(false);
    expect(meetsPlan("starter", "pro")).toBe(false);
  });
  it("ranks are strictly ordered free<starter<pro<scale", () => {
    expect(PLAN_RANK.free).toBeLessThan(PLAN_RANK.starter);
    expect(PLAN_RANK.starter).toBeLessThan(PLAN_RANK.pro);
    expect(PLAN_RANK.pro).toBeLessThan(PLAN_RANK.scale);
  });
});