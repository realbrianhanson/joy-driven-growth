import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarsProps {
  rating: number | null | undefined;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
  /** Override the fill colour, for owner-branded walls and forms. */
  color?: string;
}

const STAR_SIZE = { xs: "h-3 w-3", sm: "h-3.5 w-3.5", md: "h-4 w-4", lg: "h-5 w-5" };

/** Read-only star rating. Renders nothing when there is no rating, so we never imply one. */
export function Stars({ rating, className, size = "sm", color }: StarsProps) {
  if (rating == null || rating < 1) return null;
  const value = Math.min(5, Math.round(rating));
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={`${value} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={cn(STAR_SIZE[size], i < value ? "fill-gold text-gold" : "fill-transparent text-border-hover")}
          style={i < value && color ? { color, fill: color } : undefined}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

interface StarInputProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  color?: string;
  className?: string;
}

/** Star picker. A real radio group, so it works with a keyboard and a screen reader. */
export function StarInput({ value, onChange, label, color, className }: StarInputProps) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div role="radiogroup" aria-label={label} className={cn("flex items-center justify-center gap-1.5", className)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const active = shown >= star;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onFocus={() => setHover(star)}
            onBlur={() => setHover(0)}
            className="rounded-md p-1 transition-transform duration-150 hover:scale-110 active:scale-95"
          >
            <Star
              aria-hidden="true"
              className={cn("h-9 w-9", active ? "fill-gold text-gold" : "fill-transparent text-border-hover")}
              style={active && color ? { color, fill: color } : undefined}
              strokeWidth={1.25}
            />
          </button>
        );
      })}
    </div>
  );
}
