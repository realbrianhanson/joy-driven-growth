import { Check, Mic, MoreHorizontal, Pencil, Play, RotateCcw, Star, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { Stars } from "@/components/shared/Stars";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { formatCurrency, roleLine, timeAgo } from "@/lib/format";
import { sourceLabel, type TestimonialRow, type TestimonialStatus } from "@/lib/testimonial";
import { cn } from "@/lib/utils";

interface TestimonialCardProps {
  testimonial: TestimonialRow;
  selected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onOpen: (id: string) => void;
  onStatus: (id: string, status: TestimonialStatus) => void;
  onFeature: (id: string, featured: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

/** One testimonial in the inbox. Every action works by touch; nothing hides behind hover. */
export function TestimonialCard({ testimonial: t, selected, onSelect, onOpen, onStatus, onFeature, onEdit, onDelete }: TestimonialCardProps) {
  const status = t.status ?? "pending";
  const text = (t.content ?? "").trim();
  const role = roleLine(t.author_title, t.author_company);
  const sales = Number(t.revenue_attributed ?? 0);
  const isMedia = t.type === "video" || t.type === "audio";

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-2xl border bg-card transition-shadow hover:shadow-hover",
        selected ? "border-foreground ring-1 ring-foreground" : "border-border",
        status === "rejected" && "opacity-70",
      )}
    >
      <div className="flex items-center justify-between gap-2 px-5 pt-4">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelect(t.id, checked === true)}
            aria-label={`Select testimonial from ${t.author_name}`}
          />
          <StatusBadge status={status} />
        </div>
        <button
          type="button"
          onClick={() => onFeature(t.id, !t.is_featured)}
          aria-pressed={!!t.is_featured}
          aria-label={t.is_featured ? "Remove from featured" : "Mark as featured"}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Star className={cn("h-4 w-4", t.is_featured && "fill-gold text-gold")} strokeWidth={1.75} />
        </button>
      </div>

      <button type="button" onClick={() => onOpen(t.id)} className="flex flex-1 flex-col px-5 pb-4 pt-3 text-left outline-none">
        <span className="sr-only">Open testimonial from {t.author_name}</span>

        {isMedia && (
          <span className="mb-3 flex items-center gap-2.5 rounded-xl bg-muted px-3 py-2.5 text-sm text-foreground">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
              {t.type === "video" ? <Play className="ml-0.5 h-3.5 w-3.5 fill-current" /> : <Mic className="h-3.5 w-3.5" />}
            </span>
            {t.type === "video" ? "Video testimonial" : "Voice testimonial"}
          </span>
        )}

        {text ? (
          <span className="quote line-clamp-5 block text-[1.1rem] text-foreground">
            &ldquo;{text}&rdquo;
          </span>
        ) : (
          !isMedia && <span className="text-sm italic text-muted-foreground">No written text.</span>
        )}

        <Stars rating={t.rating} className="mt-3" />

        <span className="mt-auto flex items-center gap-3 pt-4">
          <PersonAvatar name={t.author_name} src={t.author_avatar} size="sm" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-foreground">{t.author_name}</span>
            {role && <span className="block truncate text-xs text-muted-foreground">{role}</span>}
          </span>
        </span>
      </button>

      <div className="flex items-center justify-between gap-2 border-t border-border-subtle px-5 py-2.5">
        <p className="min-w-0 truncate text-xs text-muted-foreground">
          {timeAgo(t.created_at)} · {sourceLabel(t.source)}
          {sales > 0 && <span className="ml-1.5 font-semibold text-success">· {formatCurrency(sales)}</span>}
        </p>
        <div className="flex shrink-0 items-center gap-1">
          {status === "pending" && (
            <Button size="sm" className="h-8" onClick={() => onStatus(t.id, "approved")}>
              <Check className="mr-1" /> Approve
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`More actions for ${t.author_name}`}>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {status !== "approved" && (
                <DropdownMenuItem onSelect={() => onStatus(t.id, "approved")}>
                  <Check className="mr-2 h-4 w-4" /> Approve
                </DropdownMenuItem>
              )}
              {status !== "rejected" && (
                <DropdownMenuItem onSelect={() => onStatus(t.id, "rejected")}>
                  <X className="mr-2 h-4 w-4" /> Reject
                </DropdownMenuItem>
              )}
              {status !== "pending" && (
                <DropdownMenuItem onSelect={() => onStatus(t.id, "pending")}>
                  <RotateCcw className="mr-2 h-4 w-4" /> Move to review
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={() => onEdit(t.id)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => onDelete(t.id)} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </article>
  );
}
