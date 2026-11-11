import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Hide the wordmark and show only the mark. */
  markOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { mark: "h-5 w-5", text: "text-[1.25rem]" },
  md: { mark: "h-6 w-6", text: "text-[1.5rem]" },
  lg: { mark: "h-8 w-8", text: "text-[2rem]" },
};

/** Four-point spark in gold. The only place gold carries the brand on its own. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("shrink-0 text-gold", className)} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 1C12.8 7.5 16.5 11.2 23 12C16.5 12.8 12.8 16.5 12 23C11.2 16.5 7.5 12.8 1 12C7.5 11.2 11.2 7.5 12 1Z"
      />
    </svg>
  );
}

export function Logo({ className, markOnly, size = "md" }: LogoProps) {
  const s = SIZES[size];
  return (
    <span className={cn("inline-flex items-center gap-2 text-foreground", className)}>
      <LogoMark className={s.mark} />
      {!markOnly && (
        <span className={cn("font-display leading-none tracking-[-0.01em]", s.text)}>
          Happy <span className="italic">Client</span>
        </span>
      )}
    </span>
  );
}
