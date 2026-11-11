import type { ReactNode } from "react";
import { AlertCircle, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  /** Primary and secondary actions, already rendered as buttons or links. */
  actions?: ReactNode;
  className?: string;
  /** Use inside a card: drops the dashed frame. */
  bare?: boolean;
}

/** Shown when a list has nothing in it yet. Always says what to do next. */
export function EmptyState({ icon: Icon, title, description, actions, className, bare }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center px-6 py-16 text-center",
        !bare && "rounded-2xl border border-dashed border-border bg-card/50",
        className,
      )}
    >
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-gold-light">
        <Icon className="h-5 w-5 text-gold-deep" strokeWidth={1.75} />
      </div>
      <h3 className="display text-2xl text-foreground">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground text-pretty">{description}</p>
      {actions && <div className="mt-6 flex flex-wrap items-center justify-center gap-2">{actions}</div>}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
  className?: string;
}

/** Shown when a query fails. A failed load must never look like an empty list. */
export function ErrorState({ title = "This did not load", error, onRetry, className }: ErrorStateProps) {
  const message = error instanceof Error ? error.message : null;
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center rounded-2xl border border-dashed border-destructive/30 bg-destructive-light/40 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive-light">
        <AlertCircle className="h-5 w-5 text-destructive" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
        {message ?? "Check your connection and try again."}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
