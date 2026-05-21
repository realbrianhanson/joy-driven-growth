import { GripVertical, Trash2 } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { PURPOSE_LABELS } from "@/lib/form-templates";
import type { Question } from "./types";

interface Props {
  q: Question;
  Icon?: React.ComponentType<{ className?: string }>;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function SortableQuestionRow({ q, Icon, selected, onSelect, onDelete }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: q.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-center gap-3 ${selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      {Icon && <Icon className="w-4 h-4 text-muted-foreground shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{q.question || <span className="text-muted-foreground italic">Untitled question</span>}</p>
        {q.purpose && q.purpose !== "open" && (
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{PURPOSE_LABELS[q.purpose]}</p>
        )}
      </div>
      {q.required && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Required</span>}
      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
}