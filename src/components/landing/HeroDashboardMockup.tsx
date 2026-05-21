import {
  LayoutDashboard,
  MessageSquareText,
  LayoutGrid,
  BarChart3,
  Settings,
  Search,
  Bell,
  Star,
  DollarSign,
  ArrowUpRight,
} from "lucide-react";

type MockTestimonial = {
  initials: string;
  initialsBg: string;
  initialsText: string;
  name: string;
  role: string;
  rating: number;
  quote: string;
  revenue: string;
  tagBg: string;
  tagText: string;
};

const testimonials: MockTestimonial[] = [
  {
    initials: "SC",
    initialsBg: "bg-primary/10",
    initialsText: "text-primary",
    name: "Sarah Chen",
    role: "Head of Growth · Linear",
    rating: 5,
    quote:
      "We embedded the wall on our pricing page and conversion jumped 18% in two weeks. The revenue attribution is what sold us.",
    revenue: "$24,800",
    tagBg: "bg-emerald-50",
    tagText: "text-emerald-700",
  },
  {
    initials: "MR",
    initialsBg: "bg-amber-100",
    initialsText: "text-amber-700",
    name: "Marcus Reid",
    role: "Founder · Northwind Studio",
    rating: 5,
    quote:
      "The AI interview pulled a story out of a client I'd been chasing for three months. It writes the testimonial for me.",
    revenue: "$11,420",
    tagBg: "bg-emerald-50",
    tagText: "text-emerald-700",
  },
  {
    initials: "PN",
    initialsBg: "bg-indigo-100",
    initialsText: "text-indigo-700",
    name: "Priya Nair",
    role: "Marketing Lead · Foundry",
    rating: 4,
    quote:
      "Switched from a Google Form to Happy Client. We're collecting 4× more video testimonials and the brand polish is night and day.",
    revenue: "$8,150",
    tagBg: "bg-emerald-50",
    tagText: "text-emerald-700",
  },
];

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: MessageSquareText, label: "Testimonials", active: true },
  { icon: LayoutGrid, label: "Walls" },
  { icon: BarChart3, label: "Analytics" },
  { icon: Settings, label: "Settings" },
];

export function HeroDashboardMockup() {
  return (
    <div className="w-full bg-[#F8F8FA] text-foreground select-none">
      {/* Window chrome */}
      <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border/60 bg-card">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-300/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-300/80" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-300/80" />
      </div>

      <div className="flex min-h-[420px] sm:min-h-[480px]">
        {/* Sidebar */}
        <aside className="hidden sm:flex flex-col w-44 lg:w-52 shrink-0 border-r border-border/60 bg-card px-3 py-5">
          <div className="flex items-center gap-2 px-2 mb-6">
            <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-sm">H</span>
            </div>
            <span className="font-semibold text-sm tracking-tight">Happy Client</span>
          </div>
          <nav className="flex flex-col gap-0.5">
            {navItems.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] ${
                  item.active
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground"
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </div>
            ))}
          </nav>
          <div className="mt-auto px-2 pt-4 border-t border-border/60">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] font-bold text-emerald-700">
                AK
              </div>
              <div className="text-[11px] leading-tight">
                <div className="font-medium text-foreground">Alex Kim</div>
                <div className="text-muted-foreground">Pro plan</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top bar */}
          <header className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border/60 bg-card">
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-semibold tracking-tight truncate">Testimonials</h2>
              <p className="text-[11px] text-muted-foreground">128 collected · 24 this week</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border/70 bg-background text-[11px] text-muted-foreground w-44">
                <Search className="w-3 h-3" />
                <span>Search testimonials…</span>
              </div>
              <div className="w-7 h-7 rounded-md border border-border/70 bg-background flex items-center justify-center">
                <Bell className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </div>
          </header>

          {/* Stat strip */}
          <div className="px-4 sm:px-6 pt-5 grid grid-cols-3 gap-3">
            {[
              { label: "Avg rating", value: "4.8", trail: "/5" },
              { label: "Revenue attributed", value: "$44.3k", trend: "+22%" },
              { label: "Wall views", value: "8,214", trend: "+9%" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-border/60 bg-card px-3 py-2.5"
              >
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </div>
                <div className="mt-0.5 flex items-baseline gap-1">
                  <span className="text-base font-semibold tabular-nums">{s.value}</span>
                  {s.trail && <span className="text-[11px] text-muted-foreground">{s.trail}</span>}
                  {s.trend && (
                    <span className="text-[10px] font-medium text-emerald-600 tabular-nums">
                      {s.trend}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Testimonial cards */}
          <div className="px-4 sm:px-6 py-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t) => (
              <article
                key={t.name}
                className="rounded-lg border border-border/60 bg-card p-3.5 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < t.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                  <div
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${t.tagBg} ${t.tagText} text-[10px] font-medium tabular-nums`}
                  >
                    <DollarSign className="w-2.5 h-2.5" strokeWidth={2.5} />
                    {t.revenue}
                  </div>
                </div>

                <p className="text-[12px] leading-snug text-foreground line-clamp-4">
                  "{t.quote}"
                </p>

                <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                  <div
                    className={`w-7 h-7 rounded-full ${t.initialsBg} ${t.initialsText} flex items-center justify-center text-[10px] font-bold`}
                  >
                    {t.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-foreground truncate">{t.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{t.role}</div>
                  </div>
                  <ArrowUpRight className="w-3 h-3 text-muted-foreground/60 ml-auto shrink-0" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroDashboardMockup;