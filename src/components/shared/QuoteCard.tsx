import type { CSSProperties } from "react";
import { Star } from "lucide-react";
import { initials, roleLine } from "@/lib/format";
import { cn } from "@/lib/utils";

/** A testimonial as the public RPCs return it: already approved, name already masked. */
export interface PublicTestimonial {
  id: string;
  author_name: string;
  author_title: string | null;
  author_company: string | null;
  author_avatar: string | null;
  display_preference?: string | null;
  content: string | null;
  rating: number | null;
  type: "text" | "video" | "audio";
  video_url?: string | null;
  audio_url?: string | null;
  thumbnail_url?: string | null;
  created_at?: string;
}

/**
 * Colours for a public card. These are plain values, not app tokens, because
 * the card also renders inside an iframe on someone else's website.
 */
export interface QuoteTheme {
  surface: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
  chip: string;
}

export const LIGHT_QUOTE_THEME: QuoteTheme = {
  surface: "#FDFCFA",
  text: "#1A1714",
  muted: "#635C54",
  border: "#E2DCD0",
  accent: "#C0902A",
  chip: "#F5ECD4",
};

export const DARK_QUOTE_THEME: QuoteTheme = {
  surface: "#1C1A17",
  text: "#F8F5EE",
  muted: "#A8A094",
  border: "#38332C",
  accent: "#D9B45A",
  chip: "#2E2A23",
};

interface QuoteCardProps {
  testimonial: PublicTestimonial;
  theme?: QuoteTheme;
  showRating?: boolean;
  showDate?: boolean;
  /** Larger type, for a single featured quote. */
  featured?: boolean;
  className?: string;
  style?: CSSProperties;
}

function monthYear(dateString?: string): string {
  if (!dateString) return "";
  const d = new Date(dateString);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

/** One testimonial, as visitors see it on a wall or in an embedded widget. */
export function QuoteCard({
  testimonial: t,
  theme = LIGHT_QUOTE_THEME,
  showRating = true,
  showDate = false,
  featured = false,
  className,
  style,
}: QuoteCardProps) {
  const hasVideo = t.type === "video" && !!t.video_url;
  const hasAudio = t.type === "audio" && !!t.audio_url;
  const text = (t.content ?? "").trim();
  const role = roleLine(t.author_title, t.author_company);
  const rating = t.rating != null && t.rating >= 1 ? Math.min(5, Math.round(t.rating)) : null;
  const date = showDate ? monthYear(t.created_at) : "";

  return (
    <figure
      className={cn("flex h-full flex-col rounded-2xl border", featured ? "p-7 sm:p-9" : "p-5 sm:p-6", className)}
      style={{ backgroundColor: theme.surface, borderColor: theme.border, color: theme.text, ...style }}
    >
      {showRating && rating != null && (
        <div className="mb-4 flex items-center gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              aria-hidden="true"
              className={featured ? "h-5 w-5" : "h-4 w-4"}
              strokeWidth={1.5}
              style={{
                color: i < rating ? theme.accent : theme.border,
                fill: i < rating ? theme.accent : "transparent",
              }}
            />
          ))}
        </div>
      )}

      {hasVideo && (
        <video
          src={t.video_url ?? undefined}
          poster={t.thumbnail_url ?? undefined}
          controls
          playsInline
          preload="metadata"
          className="mb-4 aspect-video w-full rounded-xl bg-black object-contain"
        />
      )}

      {hasAudio && (
        <audio src={t.audio_url ?? undefined} controls preload="none" className="mb-4 w-full" />
      )}

      {text && (
        <blockquote
          className={cn(
            "quote flex-1 text-pretty",
            featured ? "text-[1.6rem] sm:text-[1.9rem]" : text.length > 320 ? "text-[1.05rem]" : "text-[1.2rem]",
          )}
        >
          <span aria-hidden="true">&ldquo;</span>
          {text}
          <span aria-hidden="true">&rdquo;</span>
        </blockquote>
      )}

      <figcaption className={cn("flex items-center gap-3", text || hasVideo || hasAudio ? "mt-5" : "")}>
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold"
          style={{ backgroundColor: theme.chip, color: theme.text }}
        >
          {t.author_avatar ? (
            <img src={t.author_avatar} alt="" loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <span aria-hidden="true">{initials(t.author_name)}</span>
          )}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{t.author_name}</span>
          {(role || date) && (
            <span className="block truncate text-xs" style={{ color: theme.muted }}>
              {[role, date].filter(Boolean).join(" · ")}
            </span>
          )}
        </span>
      </figcaption>
    </figure>
  );
}
