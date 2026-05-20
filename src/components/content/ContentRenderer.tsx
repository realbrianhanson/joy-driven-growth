import { Copy, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import QuoteGraphic, { QuoteGraphicData } from "./QuoteGraphic";

interface ContentRendererProps {
  contentType: string;
  data: any;
}

const copy = (text: string, label = "Copied") => {
  navigator.clipboard.writeText(text);
  toast.success(label);
};

export const flattenContent = (contentType: string, data: any): string => {
  if (!data) return "";
  switch (contentType) {
    case "twitter":
      return [
        ...(data.tweets || []).map((t: string, i: number) => `${i + 1}/ ${t}`),
        (data.hashtags || []).join(" "),
      ].filter(Boolean).join("\n\n");
    case "linkedin":
      return [data.hook, data.body, data.cta, (data.hashtags || []).join(" ")].filter(Boolean).join("\n\n");
    case "email":
      return `Subject: ${data.subjectLines?.[0] || ""}\nPreheader: ${data.preheader || ""}\n\n${data.body || ""}\n\n[${data.cta || "CTA"}]`;
    case "casestudy":
      return `${data.headline}\n\nChallenge: ${data.challenge}\n\nSolution: ${data.solution}\n\nResults: ${data.results}\n\n${(data.metrics || []).map((m: any) => `${m.label}: ${m.value}`).join("\n")}\n\n"${data.pullQuote}"`;
    case "quote":
      return `"${data.quote}" — ${data.author}${data.company ? `, ${data.company}` : ""}`;
    default:
      return JSON.stringify(data, null, 2);
  }
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-1.5">{children}</div>
);

const TwitterView = ({ data }: { data: any }) => {
  const tweets: string[] = data.tweets || [];
  const hashtags: string[] = data.hashtags || [];
  return (
    <div className="space-y-0">
      {tweets.map((tweet, i) => (
        <div key={i} className="relative">
          <div className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-primary-light text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                HC
              </div>
              {i < tweets.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="text-sm font-semibold text-foreground">
                  Happy Client <span className="text-muted-foreground font-normal">· {i + 1}/{tweets.length}</span>
                </div>
                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => copy(tweet, "Tweet copied")}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{tweet}</div>
            </div>
          </div>
        </div>
      ))}
      {hashtags.length > 0 && (
        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between gap-2 mb-2">
            <SectionLabel>Hashtags</SectionLabel>
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => copy(hashtags.join(" "), "Hashtags copied")}>
              <Copy className="w-3 h-3 mr-1" />Copy all
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {hashtags.map((h, i) => (
              <span key={i} className="px-2 py-0.5 rounded-md bg-muted text-xs text-foreground">{h}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const LinkedInView = ({ data }: { data: any }) => {
  const full = flattenContent("linkedin", data);
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary-light text-primary flex items-center justify-center text-sm font-semibold">HC</div>
          <div>
            <div className="text-sm font-semibold text-foreground">Happy Client</div>
            <div className="text-xs text-muted-foreground">Founder · 1st</div>
          </div>
        </div>
        <div className="text-sm font-semibold text-foreground mb-2">{data.hook}</div>
        <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed mb-3">{data.body}</div>
        {data.cta && <div className="text-sm text-foreground mb-3">{data.cta}</div>}
        {data.hashtags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {data.hashtags.map((h: string, i: number) => (
              <span key={i} className="text-xs font-medium text-[#0a66c2]">{h}</span>
            ))}
          </div>
        )}
      </div>
      <Button variant="outline" size="sm" className="h-8" onClick={() => copy(full, "Post copied")}>
        <Copy className="w-3.5 h-3.5 mr-1.5" />Copy post
      </Button>
    </div>
  );
};

const EmailView = ({ data }: { data: any }) => (
  <div className="space-y-4">
    <div>
      <SectionLabel>Subject lines</SectionLabel>
      <div className="space-y-1.5">
        {(data.subjectLines || []).map((s: string, i: number) => (
          <div key={i} className="flex items-center justify-between gap-2 p-2.5 rounded-md border border-border bg-muted/30">
            <span className="text-sm text-foreground flex-1">{s}</span>
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => copy(s, "Subject copied")}>
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
    {data.preheader && (
      <div>
        <SectionLabel>Preheader</SectionLabel>
        <div className="text-sm text-muted-foreground italic">{data.preheader}</div>
      </div>
    )}
    <div>
      <SectionLabel>Body</SectionLabel>
      <div className="rounded-lg border border-border bg-card p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
        {data.body}
        {data.cta && (
          <div className="mt-4">
            <span className="inline-block px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium">{data.cta}</span>
          </div>
        )}
      </div>
      <Button variant="outline" size="sm" className="h-8 mt-2" onClick={() => copy(data.body || "", "Body copied")}>
        <Copy className="w-3.5 h-3.5 mr-1.5" />Copy body
      </Button>
    </div>
  </div>
);

const CaseStudyView = ({ data }: { data: any }) => {
  const full = flattenContent("casestudy", data);
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <h3 className="text-lg font-semibold text-foreground tracking-tight leading-tight">{data.headline}</h3>
        {[
          { label: "The Challenge", value: data.challenge },
          { label: "The Solution", value: data.solution },
          { label: "The Results", value: data.results },
        ].map((s) => (
          <div key={s.label}>
            <SectionLabel>{s.label}</SectionLabel>
            <div className="text-sm text-foreground leading-relaxed">{s.value}</div>
          </div>
        ))}
        {data.metrics?.length > 0 && (
          <div className="grid grid-cols-2 gap-2 pt-2">
            {data.metrics.map((m: any, i: number) => (
              <div key={i} className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="text-lg font-semibold text-foreground tabular-nums">{m.value}</div>
                <div className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>
        )}
        {data.pullQuote && (
          <blockquote className="border-l-2 border-primary pl-3 italic text-sm text-foreground">
            &ldquo;{data.pullQuote}&rdquo;
          </blockquote>
        )}
      </div>
      <Button variant="outline" size="sm" className="h-8" onClick={() => copy(full, "Case study copied")}>
        <Copy className="w-3.5 h-3.5 mr-1.5" />Copy as text
      </Button>
    </div>
  );
};

const ContentRenderer = ({ contentType, data }: ContentRendererProps) => {
  if (!data) return null;
  switch (contentType) {
    case "twitter": return <TwitterView data={data} />;
    case "linkedin": return <LinkedInView data={data} />;
    case "email": return <EmailView data={data} />;
    case "casestudy": return <CaseStudyView data={data} />;
    case "quote": return <QuoteGraphic data={data as QuoteGraphicData} />;
    default:
      return (
        <pre className="p-4 rounded-lg bg-muted/40 border border-border text-xs text-foreground overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      );
  }
};

export default ContentRenderer;