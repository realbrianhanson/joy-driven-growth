import { createElement, useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RevealProps extends HTMLAttributes<HTMLElement> {
  /** The element to render. A div unless the markup needs something else, such as a list item. */
  as?: "div" | "li" | "section";
  /** Milliseconds to wait before the fade starts. Used to stagger a row of cards. */
  delay?: number;
  /** Fade in when the page loads, without waiting for the element to scroll into view. */
  immediate?: boolean;
  children: ReactNode;
}

/**
 * Fades content up as it scrolls into view. It is a few lines of CSS and one
 * IntersectionObserver, so the landing page does not load an animation
 * library for it. People who ask for reduced motion see the content at once.
 */
export function Reveal({ as = "div", delay = 0, immediate = false, className, style, children, ...rest }: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (immediate || typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -60px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [immediate]);

  return createElement(
    as,
    {
      ...rest,
      ref,
      className: cn("reveal", shown && "reveal-shown", className),
      style: delay > 0 ? { ...style, transitionDelay: `${delay}ms` } : style,
    },
    children,
  );
}
