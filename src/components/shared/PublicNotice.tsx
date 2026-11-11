import type { ReactNode } from "react";
import { AlertCircle, Info } from "lucide-react";
import { LogoMark } from "./Logo";

interface PublicNoticeProps {
  title: string;
  message: string;
  tone?: "info" | "error";
  action?: ReactNode;
}

/** Full-page message for public links that are closed, wrong, or failed to load. */
export function PublicNotice({ title, message, tone = "info", action }: PublicNoticeProps) {
  const Icon = tone === "error" ? AlertCircle : Info;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card px-8 py-10 text-center shadow-subtle" role={tone === "error" ? "alert" : undefined}>
        <div className={`mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full ${tone === "error" ? "bg-destructive-light" : "bg-gold-light"}`}>
          <Icon className={`h-5 w-5 ${tone === "error" ? "text-destructive" : "text-gold-deep"}`} />
        </div>
        <h1 className="display text-[1.75rem] text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        {action && <div className="mt-6 flex justify-center">{action}</div>}
      </div>
      <a href="/" className="mt-8 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <LogoMark className="h-3.5 w-3.5" />
        Happy Client
      </a>
    </div>
  );
}
