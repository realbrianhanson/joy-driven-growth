import { useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { newQuestionId, type Question } from "./types";

interface RowProps {
  question: Question;
  index: number;
  open: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<Question>) => void;
  onDelete: () => void;
}

function QuestionRow({ question: q, index, open, onToggle, onChange, onDelete }: RowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: q.id });
  const fieldId = `question-${q.id}`;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("rounded-xl border bg-card", open ? "border-foreground" : "border-border", isDragging && "z-10 opacity-70 shadow-hover")}
    >
      <div className="flex items-center gap-1 px-2 py-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reorder question ${index + 1}`}
          className="cursor-grab touch-none rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button type="button" onClick={onToggle} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-1 py-1.5 text-left">
          <span className="min-w-0 flex-1">
            <span className={cn("block truncate text-sm", q.question.trim() ? "font-medium text-foreground" : "italic text-muted-foreground")}>
              {q.question.trim() || "New question"}
            </span>
            <span className="block text-xs text-muted-foreground">
              {q.type === "short_text" ? "Short answer" : "Long answer"} · {q.required ? "Required" : "Optional"}
            </span>
          </span>
          <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onDelete} aria-label={`Delete question ${index + 1}`}>
          <Trash2 />
        </Button>
      </div>

      {open && (
        <div className="space-y-4 border-t border-border-subtle px-4 py-4">
          <div>
            <Label htmlFor={fieldId}>Question</Label>
            <Textarea id={fieldId} className="mt-1.5 min-h-[64px] resize-y" rows={2} value={q.question} onChange={(e) => onChange({ question: e.target.value })} maxLength={300} autoFocus={!q.question} />
          </div>
          <div>
            <Label htmlFor={`${fieldId}-help`}>
              Helper line <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Input id={`${fieldId}-help`} className="mt-1.5" value={q.helpText ?? ""} onChange={(e) => onChange({ helpText: e.target.value || undefined })} maxLength={200} placeholder="A short tip shown under the question" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex rounded-lg border border-border p-0.5" role="radiogroup" aria-label="Answer length">
              {(["long_text", "short_text"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={q.type === type}
                  onClick={() => onChange({ type })}
                  className={cn("rounded-md px-3 py-1.5 text-sm transition-colors", q.type === type ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
                >
                  {type === "long_text" ? "Long answer" : "Short answer"}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2.5 text-sm text-foreground">
              <Switch checked={q.required} onCheckedChange={(checked) => onChange({ required: checked })} />
              Required
            </label>
          </div>
        </div>
      )}
    </li>
  );
}

interface Props {
  questions: Question[];
  onChange: (questions: Question[]) => void;
}

/** The written prompts on a form. Drag to reorder, click a row to edit it in place. */
export function QuestionsEditor({ questions, onChange }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = questions.findIndex((q) => q.id === active.id);
    const to = questions.findIndex((q) => q.id === over.id);
    if (from >= 0 && to >= 0) onChange(arrayMove(questions, from, to));
  };

  const addQuestion = () => {
    const question: Question = { id: newQuestionId(), type: "long_text", question: "", required: false };
    onChange([...questions, question]);
    setOpenId(question.id);
  };

  return (
    <div>
      {questions.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          No written questions. Clients get one open box to write in.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {questions.map((q, i) => (
                <QuestionRow
                  key={q.id}
                  question={q}
                  index={i}
                  open={openId === q.id}
                  onToggle={() => setOpenId(openId === q.id ? null : q.id)}
                  onChange={(patch) => onChange(questions.map((item) => (item.id === q.id ? { ...item, ...patch } : item)))}
                  onDelete={() => {
                    onChange(questions.filter((item) => item.id !== q.id));
                    if (openId === q.id) setOpenId(null);
                  }}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
      <Button type="button" variant="outline" className="mt-3" onClick={addQuestion} disabled={questions.length >= 12}>
        <Plus className="mr-1.5" /> Add a question
      </Button>
      {questions.length >= 12 && <p className="mt-2 text-xs text-muted-foreground">Twelve is the limit. Fewer questions get more answers.</p>}
    </div>
  );
}
