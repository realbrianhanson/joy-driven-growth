export const MOCK_ANALYTICS_DATA = {
  totalRevenue: 12847,
  revenueTrend: 23,
  totalTestimonials: 47,
  testimonialsTrend: 12,
  avgRating: 4.8,
  conversionRate: 12.4,
  monthlyRevenue: [
    { month: "Sep", revenue: 4200 },
    { month: "Oct", revenue: 5800 },
    { month: "Nov", revenue: 7100 },
    { month: "Dec", revenue: 8400 },
    { month: "Jan", revenue: 10200 },
    { month: "Feb", revenue: 12847 },
  ],
  testimonialsBySource: [
    { source: "Form", count: 28 },
    { source: "Import", count: 9 },
    { source: "Interview", count: 6 },
    { source: "Chrome Extension", count: 4 },
  ],
  sentimentBreakdown: [
    { sentiment: "Positive", count: 41 },
    { sentiment: "Neutral", count: 4 },
    { sentiment: "Negative", count: 2 },
  ],
};

export const MOCK_WIDGET_DATA = [
  { id: "w-1", name: "Homepage Carousel", type: "carousel", impressions: 12500, clicks: 1550, conversions: 48, revenue: 2400 },
  { id: "w-2", name: "Pricing FOMO Popup", type: "fomo", impressions: 8200, clicks: 820, conversions: 32, revenue: 1850 },
  { id: "w-3", name: "Case Study Grid", type: "grid", impressions: 6100, clicks: 490, conversions: 18, revenue: 920 },
  { id: "w-4", name: "Email Inline Quote", type: "inline", impressions: 4500, clicks: 360, conversions: 12, revenue: 680 },
];
