import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/shared/PageHeader";
import { FORM_TEMPLATES, type FormTemplate } from "@/lib/form-templates";
import { toPrompts, type Question } from "./types";

export interface TemplateChoice {
  name: string | null;
  prompts: Question[];
  requireRating: boolean;
  videoFirst: boolean;
}

interface Props {
  onBack: () => void;
  onPick: (choice: TemplateChoice) => void;
}

export function TemplatePicker({ onBack, onPick }: Props) {
  const pick = (template: FormTemplate) => {
    const { prompts, hasRequiredRating } = toPrompts(template.questions);
    onPick({
      name: template.id === "blank" ? null : template.name,
      prompts,
      requireRating: template.id === "video" ? false : hasRequiredRating,
      videoFirst: template.id === "video",
    });
  };

  return (
    <PageContainer className="max-w-3xl">
      <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2 mb-4">
        <ArrowLeft className="mr-1" /> Forms
      </Button>
      <h1 className="page-title">Choose your questions</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Good questions get specific answers. Pick a starting set. You can change every word after.
      </p>

      <ul className="mt-8 space-y-3">
        {FORM_TEMPLATES.map((template) => {
          const promptCount = toPrompts(template.questions).prompts.length;
          return (
            <li key={template.id}>
              <button
                type="button"
                onClick={() => pick(template)}
                className="card-hover group flex w-full items-center gap-4 rounded-2xl border border-border bg-card px-6 py-5 text-left shadow-subtle"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2.5">
                    <span className="text-base font-semibold text-foreground">{template.name}</span>
                    {template.recommended && (
                      <span className="rounded-full bg-gold px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-foreground">
                        Start here
                      </span>
                    )}
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">{template.description}</span>
                  <span className="mt-2 block text-xs text-muted-foreground">
                    {promptCount === 0 ? "No written questions" : `${promptCount} written question${promptCount === 1 ? "" : "s"}`}
                  </span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </button>
            </li>
          );
        })}
      </ul>
    </PageContainer>
  );
}
