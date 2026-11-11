import { describe, expect, it } from "vitest";
import { mapDashboardStats } from "../dashboard-mapping";

describe("mapDashboardStats", () => {
  it("returns safe defaults when nothing has loaded", () => {
    expect(mapDashboardStats(null)).toEqual({ revenueThisMonth: 0, revenueTrend: 0, drivers: [] });
    expect(mapDashboardStats(undefined)).toEqual({ revenueThisMonth: 0, revenueTrend: 0, drivers: [] });
  });

  it("reads numbers that arrive as text", () => {
    const result = mapDashboardStats({ revenue_this_month: "1250.50", revenue_trend: 12 });
    expect(result.revenueThisMonth).toBe(1250.5);
    expect(result.revenueTrend).toBe(12);
  });

  it("treats a broken number as zero", () => {
    expect(mapDashboardStats({ revenue_this_month: "abc" }).revenueThisMonth).toBe(0);
  });

  it("ranks the top earners in the order the database returns them", () => {
    const result = mapDashboardStats({
      top_drivers: [
        { id: "a", author_name: "Dana", author_company: "Northside Dental", revenue_attributed: "5000" },
        { id: "b", author_name: "Marcus", author_company: null, revenue_attributed: 1200 },
      ],
    });
    expect(result.drivers).toEqual([
      { id: "a", name: "Dana", company: "Northside Dental", revenue: 5000, rank: 1 },
      { id: "b", name: "Marcus", company: "", revenue: 1200, rank: 2 },
    ]);
  });
});
