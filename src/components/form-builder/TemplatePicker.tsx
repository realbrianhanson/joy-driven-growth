import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FORM_TEMPLATES, type TemplateQuestion } from "@/lib/form-templates";
import type { Question, FormSettings } from "./types";

interface Props {
  onBack: () => void;
  onPick: (questions: Question[], nameOverride: string | null) => void;
}

export function TemplatePicker({ onBack, onPick }: Props) {
  const pick = (tplId: string) => {
    const tpl = FORM_TEMPLATES.find((t) => t.id === tplId) ?? FORM_TEMPLATES[FORM_TEMPLATES.length - 1];
    const qs: Question[] = tpl.questions.map((q: TemplateQuestion) => ({
      id: q.id,
      type: q.type,
      question: q.question,
      placeholder: q.placeholder,
      helpText: q.helpText,
      purpose: q.purpose,
      required: q.required,
    }));
    onPick(qs, tpl.name === "Blank Form" ? null : tpl.name);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-1" /> Forms
        </Button>
        <h1 className="text-2xl font-semibold text-foreground mb-2">Start a new form</h1>
        <p className="text-sm text-muted-foreground mb-6">Pick a template — these are designed to pull honest, context-rich answers that work as testimonials.</p>
        <div className="grid gap-3">
          {FORM_TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => pick(tpl.id)}
              className="text-left p-5 rounded-xl border border-border hover:border-primary/40 bg-card transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-foreground">{tpl.name}</h3>
                {tpl.recommended && <Badge variant="default">Recommended</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{tpl.description}</p>
              <p className="text-xs text-muted-foreground mt-2">{tpl.questions.length} question{tpl.questions.length === 1 ? "" : "s"}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Re-export to keep FormSettings type referenced for callers if needed
export type { FormSettings };