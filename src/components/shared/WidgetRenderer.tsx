import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DARK_QUOTE_THEME, LIGHT_QUOTE_THEME, QuoteCard, type PublicTestimonial, type QuoteTheme } from "./QuoteCard";

export type WidgetLayout = "carousel" | "grid" | "single";
export type WidgetTheme = "light" | "dark" | "auto";

/**
 * The database still has older widget types. Popups and "just now" style
 * alerts were removed, so anything unknown shows as a single card.
 */
export function normalizeWidgetLayout(type: string | null | undefined): WidgetLayout {
  if (type === "carousel") return "carousel";
  if (type === "grid" || type === "inline") return "grid";
  return "single";
}

function usePrefersDark(enabled: boolean): boolean {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setDark(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [enabled]);
  return enabled && dark;
}

export function useWidgetTheme(theme: string | null | undefined): QuoteTheme {
  const prefersDark = usePrefersDark(theme === "auto");
  if (theme === "dark" || (theme === "auto" && prefersDark)) return DARK_QUOTE_THEME;
  return LIGHT_QUOTE_THEME;
}

interface WidgetRendererProps {
  layout: WidgetLayout;
  testimonials: PublicTestimonial[];
  theme?: string | null;
  showRating?: boolean;
  showDate?: boolean;
  autoRotate?: boolean;
}

const ROTATE_MS = 7000;

/**
 * Draws a widget. The builder preview and the live embed both use this, so
 * what you see while editing is exactly what your visitors get.
 */
export function WidgetRenderer({
  layout,
  testimonials,
  theme,
  showRating = true,
  showDate = false,
  autoRotate = true,
}: WidgetRendererProps) {
  const quoteTheme = useWidgetTheme(theme);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);
  const count = testimonials.length;
  const current = Math.min(index, Math.max(0, count - 1));

  useEffect(() => {
    if (layout !== "carousel" || !autoRotate || paused || count < 2) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => clearInterval(timer);
  }, [layout, autoRotate, paused, count]);

  if (count === 0) return null;

  if (layout === "grid") {
    return (
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
        {testimonials.map((t) => (
          <div key={t.id} className="break-inside-avoid">
            <QuoteCard testimonial={t} theme={quoteTheme} showRating={showRating} showDate={showDate} />
          </div>
        ))}
      </div>
    );
  }

  if (layout === "single" || count === 1) {
    return (
      <div className="mx-auto max-w-2xl">
        <QuoteCard testimonial={testimonials[0]} theme={quoteTheme} showRating={showRating} showDate={showDate} featured />
      </div>
    );
  }

  const go = (delta: number) => setIndex((i) => (i + delta + count) % count);
  const navStyle = { borderColor: quoteTheme.border, color: quoteTheme.text, backgroundColor: quoteTheme.surface };

  return (
    <div
      ref={regionRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Customer testimonials"
      className="mx-auto max-w-2xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") go(-1);
        if (e.key === "ArrowRight") go(1);
      }}
    >
      <div aria-live={paused ? "polite" : "off"}>
        <QuoteCard
          key={testimonials[current].id}
          testimonial={testimonials[current]}
          theme={quoteTheme}
          showRating={showRating}
          showDate={showDate}
          featured
          className="animate-fade-in"
        />
      </div>
      <div className="mt-4 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous testimonial"
          className="flex h-9 w-9 items-center justify-center rounded-full border transition-opacity hover:opacity-70"
          style={navStyle}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-1.5">
          {testimonials.map((t, i) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show testimonial ${i + 1} of ${count}`}
              aria-current={i === current}
              className="h-2 rounded-full transition-all"
              style={{
                width: i === current ? 20 : 8,
                backgroundColor: i === current ? quoteTheme.accent : quoteTheme.border,
              }}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next testimonial"
          className="flex h-9 w-9 items-center justify-center rounded-full border transition-opacity hover:opacity-70"
          style={navStyle}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
