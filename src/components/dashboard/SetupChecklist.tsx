import { useState, type ReactNode } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SetupStep {
  id: string;
  title: string;
  description: string;
  done: boolean;
  /** The button or link that completes the step. */
  action: ReactNode;
}

const DISMISS_KEY = "hc-setup-dismissed";

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * First-run guide. Each step is ticked from real account data, never from a
 * click, so it always tells the truth about what is left to do.
 */
export function SetupChecklist({ steps }: { steps: SetupStep[] }) {
  const [dismissed, setDismissed] = useState(readDismissed);
  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;
  const nextStep = steps.find((s) => !s.done);

  if (dismissed || allDone) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* storage blocked: it hides for this visit only */
    }
  };

  return (
    <section aria-labelledby="setup-title" className="overflow-hidden rounded-2xl border border-border bg-card shadow-subtle">
      <div className="flex items-start justify-between gap-4 px-6 pt-6">
        <div>
          <p className="eyebrow text-gold-deep">
            Step {Math.min(doneCount + 1, steps.length)} of {steps.length}
          </p>
          <h2 id="setup-title" className="display mt-1.5 text-[1.75rem] text-foreground">
            Get your first testimonial live
          </h2>
        </div>
        {doneCount > 0 && (
          <button type="button" onClick={dismiss} aria-label="Hide the setup guide" className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mx-6 mt-4 flex gap-1.5" role="progressbar" aria-valuemin={0} aria-valuemax={steps.length} aria-valuenow={doneCount} aria-label="Setup progress">
        {steps.map((s) => (
          <span key={s.id} className={cn("h-1.5 flex-1 rounded-full", s.done ? "bg-gold" : "bg-muted")} />
        ))}
      </div>

      <ol className="mt-5 divide-y divide-border-subtle border-t border-border-subtle">
        {steps.map((step, i) => {
          const isNext = step.id === nextStep?.id;
          return (
            <li key={step.id} className={cn("flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center", isNext && "bg-gold-light/35")}>
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  step.done ? "bg-gold text-foreground" : isNext ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground",
                )}
                aria-hidden="true"
              >
                {step.done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("text-[0.9375rem] font-medium", step.done ? "text-muted-foreground line-through decoration-border-hover" : "text-foreground")}>
                  {step.title}
                  {step.done && <span className="sr-only"> (done)</span>}
                </p>
                {!step.done && <p className="mt-0.5 text-sm text-muted-foreground">{step.description}</p>}
              </div>
              {!step.done && <div className="shrink-0 sm:ml-4">{step.action}</div>}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
