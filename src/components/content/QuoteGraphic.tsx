import { forwardRef, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Star, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export type QuoteStyle = "sunset" | "minimal" | "bold";

export interface QuoteGraphicData {
  quote: string;
  author: string;
  company?: string;
  rating?: number;
}

interface QuoteGraphicProps {
  data: QuoteGraphicData;
  accentColor?: string;
}

const STYLES: Record<QuoteStyle, { bg: string; text: string; subtext: string; brand: string }> = {
  sunset: {
    bg: "linear-gradient(135deg, #F97316 0%, #DB2777 100%)",
    text: "#FFFFFF",
    subtext: "rgba(255,255,255,0.85)",
    brand: "rgba(255,255,255,0.7)",
  },
  minimal: {
    bg: "#FFFFFF",
    text: "#0B0B0F",
    subtext: "#6B7280",
    brand: "#9CA3AF",
  },
  bold: {
    bg: "#0B1B3A",
    text: "#FFFFFF",
    subtext: "rgba(255,255,255,0.8)",
    brand: "rgba(255,255,255,0.7)",
  },
};

interface CardProps extends QuoteGraphicProps {
  style: QuoteStyle;
  accentColor: string;
  size: number;
}

const QuoteCard = forwardRef<HTMLDivElement, CardProps>(({ data, style, accentColor, size }, ref) => {
  const s = STYLES[style];
  const isMinimal = style === "minimal";
  const accent = style === "bold" ? accentColor : isMinimal ? accentColor : "#FFD166";
  return (
    <div
      ref={ref}
      style={{
        width: size,
        height: size,
        background: s.bg,
        color: s.text,
        padding: size * 0.09,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        position: "relative",
        border: isMinimal ? `1px solid #E5E7EB` : "none",
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", gap: size * 0.012 }}>
        {Array.from({ length: data.rating ?? 5 }).map((_, i) => (
          <Star key={i} size={size * 0.045} fill={accent} stroke={accent} />
        ))}
      </div>

      <div
        style={{
          fontSize: size * 0.065,
          fontWeight: 600,
          lineHeight: 1.2,
          letterSpacing: "-0.02em",
          textAlign: "left",
        }}
      >
        &ldquo;{data.quote}&rdquo;
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <div style={{ fontSize: size * 0.028, fontWeight: 600, marginBottom: size * 0.006 }}>
            {data.author}
          </div>
          {data.company && (
            <div style={{ fontSize: size * 0.022, color: s.subtext, fontWeight: 400 }}>
              {data.company}
            </div>
          )}
        </div>
        <div
          style={{
            fontSize: size * 0.02,
            color: s.brand,
            fontWeight: 500,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Happy Client
        </div>
      </div>
    </div>
  );
});
QuoteCard.displayName = "QuoteCard";

const QuoteGraphic = ({ data, accentColor = "#F97316" }: QuoteGraphicProps) => {
  const [style, setStyle] = useState<QuoteStyle>("sunset");
  const [downloading, setDownloading] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    if (!exportRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(exportRef.current, {
        width: 1080,
        height: 1080,
        pixelRatio: 1,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `quote-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        {(["sunset", "minimal", "bold"] as QuoteStyle[]).map((opt) => (
          <button
            key={opt}
            onClick={() => setStyle(opt)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
              style === opt
                ? "bg-primary-light text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Visible preview, scaled down */}
      <div className="overflow-hidden rounded-lg border border-border bg-muted/30 flex items-center justify-center p-3">
        <div
          style={{
            width: 1080,
            height: 1080,
            transform: "scale(0.32)",
            transformOrigin: "top left",
            marginBottom: -1080 * (1 - 0.32),
            marginRight: -1080 * (1 - 0.32),
          }}
        >
          <QuoteCard data={data} style={style} accentColor={accentColor} size={1080} />
        </div>
      </div>

      {/* Offscreen full-resolution export node */}
      <div style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none" }} aria-hidden>
        <QuoteCard ref={exportRef} data={data} style={style} accentColor={accentColor} size={1080} />
      </div>

      <Button onClick={handleDownload} disabled={downloading} className="w-full h-9">
        <Download className="w-3.5 h-3.5 mr-1.5" />
        {downloading ? "Preparing PNG…" : "Download PNG (1080×1080)"}
      </Button>
    </div>
  );
};

export default QuoteGraphic;