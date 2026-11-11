import { useEffect, useRef, useState, type ReactNode } from "react";

interface ScaledPreviewProps {
  /** The width the content is designed for, in pixels. */
  designWidth: number;
  children: ReactNode;
  className?: string;
}

/**
 * Shows content at its real desktop width, shrunk to fit a preview pane.
 * Layout breakpoints follow the browser window, not the pane, so drawing at
 * full width and scaling down is the only way a small preview stays true.
 */
export function ScaledPreview({ designWidth, children, className }: ScaledPreviewProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    const update = () => {
      const next = Math.min(1, outer.clientWidth / designWidth);
      setScale(next);
      setHeight(inner.offsetHeight * next);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(outer);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [designWidth]);

  return (
    // The inner layer is taken out of the flow. Its fixed width would otherwise
    // stretch a grid or flex parent, such as a dialog, and the preview would never shrink.
    <div ref={outerRef} className={className} style={{ position: "relative", width: "100%", height, overflow: "hidden" }}>
      <div
        ref={innerRef}
        style={{ position: "absolute", top: 0, left: 0, width: designWidth, transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        {children}
      </div>
    </div>
  );
}
