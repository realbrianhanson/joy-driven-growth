import { forwardRef, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ScaledPreview } from "@/components/shared/ScaledPreview";
import type { QuoteContent } from "@/lib/content";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";

type QuoteStyle = "ivory" | "ink" | "gold";

const SIZE = 1080;

const STYLES: Record<QuoteStyle, { label: string; background: string; text: string; muted: string; accent: string }> = {
  ivory: { label: "Ivory", background: "#F8F6F1", text: "#1A1714", muted: "#6B645B", accent: "#C08E2A" },
  ink: { label: "Ink", background: "#1A1714", text: "#F8F6F1", muted: "#B8B0A4", accent: "#D4A94A" },
  gold: {
    label: "Gold",
    background: "linear-gradient(140deg, #6F4A10 0%, #A0741F 100%)",
    text: "#FDFBF6",
    muted: "rgba(253, 251, 246, 0.82)",
    accent: "#F3E0AE",
  },
};

/** Long quotes get smaller type, so every quote fills the square without spilling. */
function quoteFontSize(length: number): number {
  if (length <= 70) return 88;
  if (length <= 120) return 72;
  if (length <= 180) return 60;
  if (length <= 260) return 50;
  return 42;
}

const STAR_PATH = "M12 2.5l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 17.6l-5.9 3.1 1.2-6.6L2.5 9.5l6.6-.9L12 2.5z";

interface QuoteArtProps {
  data: QuoteContent;
  style: QuoteStyle;
}

/** The square graphic at full size. Inline styles only, so the exported image matches the preview. */
const QuoteArt = forwardRef<HTMLDivElement, QuoteArtProps>(({ data, style }, ref) => {
  const s = STYLES[style];
  return (
    <div
      ref={ref}
      style={{
        width: SIZE,
        height: SIZE,
        boxSizing: "border-box",
        padding: 104,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: s.background,
        color: s.text,
        fontFamily: '"Inter Variable", Inter, system-ui, sans-serif',
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", height: 72 }}>
        <div
          aria-hidden="true"
          style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontSize: 190, lineHeight: 0.82, height: 72, color: s.accent }}
        >
          &ldquo;
        </div>
        {data.rating ? (
          <div style={{ display: "flex", gap: 8 }}>
            {Array.from({ length: data.rating }, (_, i) => (
              <svg key={i} width="36" height="36" viewBox="0 0 24 24" aria-hidden="true">
                <path d={STAR_PATH} fill={s.accent} />
              </svg>
            ))}
          </div>
        ) : null}
      </div>

      <div
        style={{
          fontFamily: '"Instrument Serif", Georgia, serif',
          fontSize: quoteFontSize(data.quote.length),
          lineHeight: 1.16,
          letterSpacing: "-0.01em",
          fontWeight: 400,
        }}
      >
        {data.quote}
      </div>

      <div>
        <div style={{ width: 72, height: 3, background: s.accent, marginBottom: 32 }} />
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 40 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 34, fontWeight: 600, lineHeight: 1.25 }}>{data.author || "A happy client"}</div>
            {data.company && <div style={{ fontSize: 26, lineHeight: 1.35, color: s.muted, marginTop: 6 }}>{data.company}</div>}
          </div>
          <div style={{ fontSize: 18, letterSpacing: "0.16em", textTransform: "uppercase", color: s.muted, whiteSpace: "nowrap" }}>
            Happy Client
          </div>
        </div>
      </div>
    </div>
  );
});
QuoteArt.displayName = "QuoteArt";

/** A square quote image in three styles, with a PNG download. */
export function QuoteGraphic({ data }: { data: QuoteContent }) {
  const [style, setStyle] = useState<QuoteStyle>("ivory");
  const [downloading, setDownloading] = useState(false);
  const artRef = useRef<HTMLDivElement>(null);

  const download = async () => {
    if (!artRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(artRef.current, { width: SIZE, height: SIZE, pixelRatio: 1, cacheBust: true });
      const link = document.createElement("a");
      link.download = `quote-${slugify(data.author) || "testimonial"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Quote image export failed:", error);
      toast.error("The image did not download. Try again, or take a screenshot of the preview.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div role="radiogroup" aria-label="Image style" className="flex gap-2">
        {(Object.keys(STYLES) as QuoteStyle[]).map((key) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={style === key}
            onClick={() => setStyle(key)}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              style === key ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:border-border-hover hover:text-foreground",
            )}
          >
            <span className="h-3 w-3 rounded-full border border-black/10" style={{ background: STYLES[key].background }} aria-hidden="true" />
            {STYLES[key].label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border shadow-subtle">
        <ScaledPreview designWidth={SIZE}>
          <QuoteArt ref={artRef} data={data} style={style} />
        </ScaledPreview>
      </div>

      <Button onClick={download} disabled={downloading} className="w-full sm:w-auto">
        {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
        {downloading ? "Preparing image" : "Download image (1080 x 1080)"}
      </Button>
    </div>
  );
}
