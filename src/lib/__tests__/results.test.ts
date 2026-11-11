import { describe, expect, it } from "vitest";
import { computeResults, type ResultSale, type ResultTestimonial } from "../results";

const now = new Date(2026, 10, 10, 15, 0, 0);
const daysAgo = (days: number, hour = 12) => new Date(2026, 10, 10 - days, hour, 0, 0).toISOString();

const testimonial = (days: number, extra: Partial<ResultTestimonial> = {}): ResultTestimonial => ({
  created_at: daysAgo(days),
  status: "approved",
  type: "text",
  source: "form",
  rating: 5,
  ...extra,
});
const sale = (days: number, amount: number | string): ResultSale => ({ attributed_at: daysAgo(days), amount });

describe("computeResults", () => {
  it("returns zeros and no trends when there is no data", () => {
    const results = computeResults([], [], 30, now);
    expect(results.salesTotal).toBe(0);
    expect(results.salesAverage).toBe(0);
    expect(results.salesTrend).toBeNull();
    expect(results.collected).toBe(0);
    expect(results.collectedTrend).toBeNull();
    expect(results.averageRating).toBeNull();
    expect(results.buckets).toHaveLength(30);
  });

  it("counts only what falls inside the range", () => {
    const results = computeResults([testimonial(0), testimonial(6), testimonial(7), testimonial(40)], [sale(1, 500), sale(8, "250.50")], 7, now);
    expect(results.collected).toBe(2);
    expect(results.salesTotal).toBe(500);
    expect(results.salesCount).toBe(1);
    expect(results.salesAverage).toBe(500);
  });

  it("compares with the period before", () => {
    const results = computeResults([testimonial(1), testimonial(2), testimonial(3), testimonial(9)], [sale(1, 300), sale(10, 200)], 7, now);
    expect(results.collectedTrend).toBe(200);
    expect(results.salesTrend).toBe(50);
  });

  it("averages only real ratings", () => {
    const results = computeResults([testimonial(1, { rating: 5 }), testimonial(2, { rating: 4 }), testimonial(3, { rating: null })], [], 30, now);
    expect(results.averageRating).toBe(4.5);
    expect(results.ratingCount).toBe(2);
  });

  it("splits by status, format and source", () => {
    const results = computeResults(
      [
        testimonial(1, { status: "pending", type: "video", source: "ai_interview" }),
        testimonial(2, { status: null, type: null, source: null }),
        testimonial(3),
      ],
      [],
      30,
      now,
    );
    expect(results.approved).toBe(1);
    expect(results.pending).toBe(2);
    expect(results.byFormat).toEqual([
      { key: "text", count: 2 },
      { key: "video", count: 1 },
    ]);
    expect(results.bySource[0]).toEqual({ key: "form", count: 2 });
  });

  it("puts each day in its own bar for short ranges", () => {
    const results = computeResults([testimonial(0), testimonial(0), testimonial(6)], [sale(0, 100), sale(0, 50)], 7, now);
    expect(results.buckets).toHaveLength(7);
    expect(results.buckets[6].testimonials).toBe(2);
    expect(results.buckets[6].sales).toBe(150);
    expect(results.buckets[0].testimonials).toBe(1);
  });

  it("uses weekly bars for 90 days and loses nothing", () => {
    const rows = [testimonial(0), testimonial(45), testimonial(89)];
    const results = computeResults(rows, [], 90, now);
    expect(results.buckets).toHaveLength(13);
    expect(results.buckets.reduce((sum, bucket) => sum + bucket.testimonials, 0)).toBe(3);
  });
});
