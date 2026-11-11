import { useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LogoMark } from "@/components/shared/Logo";
import { PublicNotice } from "@/components/shared/PublicNotice";
import { DARK_QUOTE_THEME, LIGHT_QUOTE_THEME, QuoteCard, type PublicTestimonial, type QuoteTheme } from "@/components/shared/QuoteCard";
import { readableTextColor, safeHex } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface WallData {
  id: string;
  name: string;
  slug: string;
  header_title: string | null;
  header_subtitle: string | null;
  logo_url: string | null;
  layout: string | null;
  columns: number | null;
  background_color: string | null;
  accent_color: string | null;
  testimonials: PublicTestimonial[];
}

const COLUMN_CLASSES: Record<number, string> = {
  1: "columns-1",
  2: "columns-1 md:columns-2",
  3: "columns-1 md:columns-2 lg:columns-3",
  4: "columns-1 sm:columns-2 lg:columns-3 xl:columns-4",
  5: "columns-1 sm:columns-2 lg:columns-4 xl:columns-5",
};

const GRID_CLASSES: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5",
};

interface WallViewProps {
  wall: WallData;
  /** Inside the builder preview: no full-height page, no footer link. */
  preview?: boolean;
}

/** The wall itself. The public page and the builder preview both render this. */
export function WallView({ wall, preview }: WallViewProps) {
  const background = safeHex(wall.background_color, "#F8F5EE");
  const accent = safeHex(wall.accent_color, "#C0902A");
  const onDark = readableTextColor(background) === "#ffffff";
  const theme: QuoteTheme = { ...(onDark ? DARK_QUOTE_THEME : LIGHT_QUOTE_THEME), accent };
  const text = onDark ? "#F8F5EE" : "#1A1714";
  const muted = onDark ? "#B5AEA3" : "#635C54";
  const columns = Math.max(1, Math.min(5, wall.columns ?? 3));
  const layout = wall.layout === "grid" || wall.layout === "list" ? wall.layout : "masonry";

  const summary = useMemo(() => {
    const ratings = wall.testimonials.map((t) => t.rating).filter((r): r is number => r != null && r >= 1);
    if (ratings.length < 3) return null;
    const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
    return { average: average.toFixed(1), count: ratings.length };
  }, [wall.testimonials]);

  return (
    <div className={cn(!preview && "min-h-screen")} style={{ backgroundColor: background, color: text }}>
      <header className="mx-auto max-w-4xl px-6 pb-10 pt-14 text-center sm:pt-20">
        {wall.logo_url && <img src={wall.logo_url} alt="" className="mx-auto mb-8 h-10 max-w-[12rem] object-contain" />}
        <h1 className="display text-[2.5rem] text-balance sm:text-[3.5rem]">{wall.header_title?.trim() || "What our customers say"}</h1>
        {wall.header_subtitle?.trim() && (
          <p className="mx-auto mt-4 max-w-2xl text-lg text-pretty" style={{ color: muted }}>
            {wall.header_subtitle}
          </p>
        )}
        {summary && (
          <p className="mt-6 inline-flex items-center gap-2 text-sm" style={{ color: muted }}>
            <Star className="h-4 w-4" style={{ color: accent, fill: accent }} aria-hidden="true" />
            <span>
              <strong style={{ color: text }}>{summary.average}</strong> average from {summary.count} ratings
            </span>
          </p>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        {wall.testimonials.length === 0 ? (
          <p className="py-16 text-center text-sm" style={{ color: muted }}>
            Testimonials will appear here soon.
          </p>
        ) : layout === "list" ? (
          <div className="mx-auto max-w-2xl space-y-5">
            {wall.testimonials.map((t) => (
              <QuoteCard key={t.id} testimonial={t} theme={theme} />
            ))}
          </div>
        ) : layout === "grid" ? (
          <div className={cn("grid gap-5", GRID_CLASSES[columns])}>
            {wall.testimonials.map((t) => (
              <QuoteCard key={t.id} testimonial={t} theme={theme} />
            ))}
          </div>
        ) : (
          <div className={cn("gap-5 [&>*]:mb-5", COLUMN_CLASSES[columns])}>
            {wall.testimonials.map((t) => (
              <div key={t.id} className="break-inside-avoid">
                <QuoteCard testimonial={t} theme={theme} />
              </div>
            ))}
          </div>
        )}
      </main>

      {!preview && (
        <footer className="pb-10 text-center">
          <a href="/" target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70" style={{ color: muted }}>
            <LogoMark className="h-3.5 w-3.5" />
            Collected with Happy Client
          </a>
        </footer>
      )}
    </div>
  );
}

export default function PublicWall() {
  const { slug } = useParams<{ slug: string }>();
  const counted = useRef(false);

  const { data: wall, isLoading, error } = useQuery({
    queryKey: ["public-wall", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_wall_public", { p_slug: slug! });
      if (error) throw error;
      return data as unknown as WallData | null;
    },
  });

  useEffect(() => {
    if (!wall || !slug || counted.current) return;
    counted.current = true;
    void supabase.rpc("increment_wall_views", { p_slug: slug });
  }, [wall, slug]);

  useEffect(() => {
    if (wall) document.title = wall.header_title?.trim() || wall.name;
  }, [wall]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background px-6 py-16" role="status" aria-label="Loading">
        <div className="mx-auto max-w-6xl">
          <Skeleton className="mx-auto h-12 w-2/3 max-w-lg" />
          <Skeleton className="mx-auto mt-4 h-5 w-1/2 max-w-sm" />
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <PublicNotice
        tone="error"
        title="This page did not load"
        message="Check your connection, then try again."
        action={<Button onClick={() => window.location.reload()}>Try again</Button>}
      />
    );
  }

  if (!wall) {
    return <PublicNotice title="This wall is not available" message="It may have been unpublished, or the link may be wrong." />;
  }

  return <WallView wall={wall} />;
}
