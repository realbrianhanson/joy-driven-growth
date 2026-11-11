import type { ReactNode } from "react";
import { CopyButton } from "@/components/shared/CopyButton";
import { QuoteGraphic } from "@/components/content/QuoteGraphic";
import {
  type ContentKind,
  flattenContent,
  readCaseStudy,
  readEmail,
  readLinkedIn,
  readQuote,
  readThread,
} from "@/lib/content";
import { cn } from "@/lib/utils";

function Label({ children }: { children: ReactNode }) {
  return <p className="eyebrow mb-2">{children}</p>;
}

function Paper({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border border-border bg-background/60 p-5", className)}>{children}</div>;
}

function LinkedInView({ data }: { data: unknown }) {
  const post = readLinkedIn(data);
  return (
    <Paper className="space-y-3 text-[0.9375rem] leading-relaxed text-foreground">
      <p className="font-semibold">{post.hook}</p>
      <p className="whitespace-pre-wrap">{post.body}</p>
      {post.cta && <p>{post.cta}</p>}
      {post.hashtags.length > 0 && <p className="text-muted-foreground">{post.hashtags.join(" ")}</p>}
    </Paper>
  );
}

function ThreadView({ data }: { data: unknown }) {
  const { tweets } = readThread(data);
  return (
    <ol className="space-y-2.5">
      {tweets.map((tweet, index) => (
        <li key={index} className="flex items-start gap-3 rounded-xl border border-border bg-background/60 p-4">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums text-muted-foreground">
            {index + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-foreground">{tweet}</p>
            <p className={cn("mt-1.5 text-xs tabular-nums", tweet.length > 280 ? "text-destructive" : "text-muted-foreground")}>
              {tweet.length} of 280 characters
            </p>
          </div>
          <CopyButton text={tweet} iconOnly variant="ghost" label={`Copy post ${index + 1}`} className="-mr-1 -mt-1 shrink-0" />
        </li>
      ))}
    </ol>
  );
}

function EmailView({ data }: { data: unknown }) {
  const email = readEmail(data);
  return (
    <div className="space-y-5">
      <div>
        <Label>Subject lines</Label>
        <ul className="space-y-2">
          {email.subjectLines.map((subject, index) => (
            <li key={index} className="flex items-center gap-2 rounded-lg border border-border bg-background/60 py-1.5 pl-3.5 pr-1.5">
              <span className="min-w-0 flex-1 text-sm text-foreground">{subject}</span>
              <CopyButton text={subject} iconOnly variant="ghost" label="Copy subject line" className="shrink-0" />
            </li>
          ))}
        </ul>
      </div>
      {email.preheader && (
        <div>
          <Label>Preview text</Label>
          <p className="text-sm text-muted-foreground">{email.preheader}</p>
        </div>
      )}
      <div>
        <Label>Body</Label>
        <Paper>
          <p className="whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-foreground">{email.body}</p>
          {email.cta && (
            <span className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">{email.cta}</span>
          )}
        </Paper>
      </div>
    </div>
  );
}

function CaseStudyView({ data }: { data: unknown }) {
  const study = readCaseStudy(data);
  const sections = [
    { label: "The challenge", text: study.challenge },
    { label: "The solution", text: study.solution },
    { label: "The results", text: study.results },
  ].filter((section) => section.text);

  return (
    <Paper className="space-y-5">
      <h3 className="display text-2xl leading-tight text-foreground sm:text-3xl">{study.headline}</h3>
      {sections.map((section) => (
        <div key={section.label}>
          <Label>{section.label}</Label>
          <p className="text-[0.9375rem] leading-relaxed text-foreground">{section.text}</p>
        </div>
      ))}
      {study.metrics.length > 0 && (
        <dl className="grid grid-cols-2 gap-2.5">
          {study.metrics.map((metric, index) => (
            <div key={index} className="rounded-lg border border-border bg-card px-4 py-3">
              <dd className="display text-2xl tabular-nums text-foreground">{metric.value}</dd>
              <dt className="mt-0.5 text-xs text-muted-foreground">{metric.label}</dt>
            </div>
          ))}
        </dl>
      )}
      {study.pullQuote && (
        <blockquote className="border-l-2 border-gold pl-4">
          <p className="quote text-lg text-foreground">&ldquo;{study.pullQuote}&rdquo;</p>
        </blockquote>
      )}
    </Paper>
  );
}

interface ContentRendererProps {
  kind: ContentKind;
  data: unknown;
}

/** Shows one generated piece in the layout that fits its format. */
export function ContentRenderer({ kind, data }: ContentRendererProps) {
  switch (kind) {
    case "linkedin":
      return <LinkedInView data={data} />;
    case "twitter":
      return <ThreadView data={data} />;
    case "email":
      return <EmailView data={data} />;
    case "casestudy":
      return <CaseStudyView data={data} />;
    case "quote":
      return <QuoteGraphic data={readQuote(data)} />;
  }
}

const COPY_LABELS: Record<ContentKind, string> = {
  linkedin: "Copy post",
  twitter: "Copy thread",
  email: "Copy email",
  casestudy: "Copy case study",
  quote: "Copy quote",
};

/** One button that copies the whole piece as plain text. */
export function CopyContentButton({ kind, data, variant = "outline" }: ContentRendererProps & { variant?: "outline" | "default" }) {
  return <CopyButton text={flattenContent(kind, data)} label={COPY_LABELS[kind]} variant={variant} size="default" />;
}
