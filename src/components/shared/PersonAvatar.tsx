import { useState } from "react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

interface PersonAvatarProps {
  name: string | null | undefined;
  src?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const SIZES = {
  sm: "h-8 w-8 text-[0.6875rem]",
  md: "h-10 w-10 text-xs",
  lg: "h-12 w-12 text-sm",
  xl: "h-16 w-16 text-lg",
};

/** A photo when there is one, initials on gold when there is not. Falls back if the photo fails to load. */
export function PersonAvatar({ name, src, className, size = "md" }: PersonAvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = !!src && !failed;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gold-light font-semibold text-gold-deep",
        SIZES[size],
        className,
      )}
    >
      {showImage ? (
        <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
    </span>
  );
}
