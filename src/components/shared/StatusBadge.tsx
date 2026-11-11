import { cn } from "@/lib/utils";
import type { TestimonialStatus } from "@/lib/testimonial";

const STYLES: Record<TestimonialStatus, { label: string; dot: string; text: string }> = {
  pending: { label: "Needs review", dot: "bg-warning", text: "text-warning" },
  approved: { label: "Approved", dot: "bg-success", text: "text-success" },
  rejected: { label: "Rejected", dot: "bg-muted-foreground/50", text: "text-muted-foreground" },
};

export function StatusBadge({ status, className }: { status: TestimonialStatus | null | undefined; className?: string }) {
  const s = STYLES[status ?? "pending"];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", s.text, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} aria-hidden="true" />
      {s.label}
    </span>
  );
}
