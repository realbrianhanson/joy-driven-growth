import { describe, it, expect } from "vitest";
import { mapDashboardStats, mapSentiment, type DashboardStats } from "../dashboard-mapping";

const baseStats: DashboardStats = {
  total_testimonials: 0,
  testimonials_this_month: 0,
  testimonials_trend: 0,
  this_week_count: 0,
  avg_rating: 0,
  approved_count: 0,
  collection_rate: null,
  revenue_this_month: 0,
  revenue_last_month: 0,
  revenue_trend: 0,
  weekly_revenue: 0,
  widget_ctr: 0,
  recent_5: [],
  top_drivers: [],
  recent_activity: [],
};

describe("mapSentiment", () => {
  it("maps positive to happy", () => expect(mapSentiment("positive")).toBe("happy"));
  it("maps negative to sad", () => expect(mapSentiment("negative")).toBe("sad"));
  it("maps null to neutral", () => expect(mapSentiment(null)).toBe("neutral"));
  it("maps unknown to neutral", () => expect(mapSentiment("mixed")).toBe("neutral"));
});

describe("mapDashboardStats", () => {
  it("returns safe defaults for null", () => {
    const r = mapDashboardStats(null);
    expect(r.totalTestimonials).toBe(0);
    expect(r.avgRating).toBe("0");
    expect(r.widgetCTR).toBe("0.0%");
    expect(r.recent5).toEqual([]);
    expect(r.drivers).toEqual([]);
    expect(r.activities).toEqual([]);
    expect(r.hasTestimonials).toBe(false);
  });

  it("formats avg rating to 1 decimal when > 0", () => {
    const r = mapDashboardStats({ ...baseStats, avg_rating: 4.567 });
    expect(r.avgRating).toBe("4.6");
  });

  it("formats widget CTR as percent string", () => {
    const r = mapDashboardStats({ ...baseStats, widget_ctr: 12.345 });
    expect(r.widgetCTR).toBe("12.3%");
  });

  it("flags hasTestimonials when total > 0", () => {
    const r = mapDashboardStats({ ...baseStats, total_testimonials: 3 });
    expect(r.hasTestimonials).toBe(true);
  });

  it("ranks top drivers and truncates snippet", () => {
    const longContent = "x".repeat(120);
    const r = mapDashboardStats({
      ...baseStats,
      top_drivers: [
        { id: "1", author_name: "A", author_company: "AC", content: longContent, revenue_attributed: "100" },
        { id: "2", author_name: "B", author_company: null, content: "short", revenue_attributed: 50 },
      ],
    });
    expect(r.drivers).toHaveLength(2);
    expect(r.drivers[0].rank).toBe(1);
    expect(r.drivers[1].rank).toBe(2);
    expect(r.drivers[0].snippet.endsWith("...")).toBe(true);
    expect(r.drivers[0].snippet.length).toBe(63);
    expect(r.drivers[0].revenue).toBe(100);
    expect(r.drivers[1].company).toBe("");
  });

  it("maps recent testimonials with sentiment and revenue", () => {
    const r = mapDashboardStats({
      ...baseStats,
      recent_5: [
        { id: "t1", author_name: "Sue", author_company: "Co", content: "great", rating: 5, sentiment: "positive", revenue_attributed: "42" },
        { id: "t2", author_name: "Bob", author_company: null, content: null, rating: null, sentiment: "negative", revenue_attributed: null },
      ],
    });
    expect(r.recent5[0].sentiment).toBe("happy");
    expect(r.recent5[0].revenue).toBe(42);
    expect(r.recent5[1].sentiment).toBe("sad");
    expect(r.recent5[1].revenue).toBeUndefined();
    expect(r.recent5[1].quote).toBe("");
    expect(r.recent5[1].rating).toBe(0);
  });

  it("maps recent activity entity types", () => {
    const r = mapDashboardStats({
      ...baseStats,
      recent_activity: [
        { id: "a1", action: "New testimonial", entity_type: "testimonial", entity_id: "t1", metadata: null, created_at: new Date().toISOString() },
        { id: "a2", action: "Unknown", entity_type: "weird", entity_id: null, metadata: null, created_at: new Date().toISOString() },
      ],
    });
    expect(r.activities[0].type).toBe("testimonial");
    expect(r.activities[1].type).toBe("other");
    expect(typeof r.activities[0].time).toBe("string");
  });
});