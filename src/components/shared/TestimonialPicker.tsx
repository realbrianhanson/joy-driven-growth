import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Mic, Search, ShieldAlert, Video } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { Stars } from "@/components/shared/Stars";
import type { PublicTestimonial } from "@/components/shared/QuoteCard";
import { useTestimonials } from "@/hooks/use-testimonials";
import { roleLine } from "@/lib/format";
import { maskName, type TestimonialRow } from "@/lib/testimonial";
import { cn } from "@/lib/utils";

/** A testimonial as the public page will show it, with the client's name choice applied. */
export function toPublicTestimonial(t: TestimonialRow): PublicTestimonial {
  const anonymous = t.display_preference === "anonymous";
  return {
    id: t.id,
    author_name: maskName(t.author_name, t.display_preference),
    author_title: t.author_title,
    author_company: t.author_company,
    author_avatar: anonymous ? null : t.author_avatar,
    display_preference: t.display_preference,
    content: t.content,
    rating: t.rating,
    type: (t.type ?? "text") as PublicTestimonial["type"],
    video_url: t.video_url,
    audio_url: t.audio_url,
    thumbnail_url: t.thumbnail_url,
    created_at: t.created_at,
  };
}

/** Approved testimonials, plus helpers to turn selected ids into preview cards in the chosen order. */
export function useApprovedTestimonials() {
  const { data, isLoading, error } = useTestimonials();
  const approved = useMemo(() => (data ?? []).filter((t) => t.status === "approved"), [data]);
  const byId = useMemo(() => new Map(approved.map((t) => [t.id, t])), [approved]);
  const resolve = useCallback(
    (ids: string[]): PublicTestimonial[] =>
      ids.map((id) => byId.get(id)).filter((t): t is TestimonialRow => !!t).map(toPublicTestimonial),
    [byId],
  );
  return { approved, isLoading, error, resolve };
}

interface TestimonialPickerProps {
  approved: TestimonialRow[];
  isLoading: boolean;
  selected: string[];
  onChange: (ids: string[]) => void;
}

/** Choose which approved testimonials appear on a wall or widget. They show in the order you tick them. */
export function TestimonialPicker({ approved, isLoading, selected, onChange }: TestimonialPickerProps) {
  const [search, setSearch] = useState("");
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return approved;
    return approved.filter((t) => [t.author_name, t.author_company, t.content].filter(Boolean).join(" ").toLowerCase().includes(query));
  }, [approved, search]);

  const toggle = (id: string) => {
    onChange(selectedSet.has(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };

  const allVisibleSelected = visible.length > 0 && visible.every((t) => selectedSet.has(t.id));
  const toggleAll = () => {
    if (allVisibleSelected) {
      const hide = new Set(visible.map((t) => t.id));
      onChange(selected.filter((id) => !hide.has(id)));
    } else {
      onChange([...selected, ...visible.filter((t) => !selectedSet.has(t.id)).map((t) => t.id)]);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2" role="status" aria-label="Loading testimonials">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  if (approved.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
        <p className="text-sm font-medium text-foreground">No approved testimonials yet</p>
        <p className="mt-1 text-sm text-muted-foreground">Only testimonials you approve can go public.</p>
        <Button asChild variant="outline" size="sm" className="mt-4">
          <Link to="/dashboard/testimonials">Go to testimonials</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search approved testimonials" aria-label="Search approved testimonials" className="pl-10" />
        </div>
        <Button type="button" variant="outline" onClick={toggleAll} disabled={visible.length === 0}>
          {allVisibleSelected ? "Clear" : "Select all"}
        </Button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {selected.length} of {approved.length} selected. They appear in the order you tick them.
      </p>

      <ul className="mt-3 max-h-[26rem] space-y-2 overflow-y-auto pr-1 scrollbar-thin">
        {visible.map((t) => {
          const checked = selectedSet.has(t.id);
          const position = checked ? selected.indexOf(t.id) + 1 : null;
          const text = (t.content ?? "").trim();
          return (
            <li key={t.id}>
              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors",
                  checked ? "border-foreground bg-muted/40" : "border-border hover:border-border-hover",
                )}
              >
                <Checkbox checked={checked} onCheckedChange={() => toggle(t.id)} className="mt-1" />
                <PersonAvatar name={t.author_name} src={t.author_avatar} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-sm font-medium text-foreground">{t.author_name}</span>
                    <Stars rating={t.rating} size="xs" />
                    {t.type === "video" && <Video className="h-3.5 w-3.5 text-muted-foreground" aria-label="Video" />}
                    {t.type === "audio" && <Mic className="h-3.5 w-3.5 text-muted-foreground" aria-label="Voice" />}
                  </span>
                  <span className="line-clamp-2 block text-sm text-muted-foreground">
                    {text || roleLine(t.author_title, t.author_company) || (t.type === "video" ? "Video testimonial" : "Voice testimonial")}
                  </span>
                  {!t.consent_given && (
                    <span className="mt-1 inline-flex items-center gap-1 text-xs text-warning">
                      <ShieldAlert className="h-3.5 w-3.5" /> No permission on record
                    </span>
                  )}
                </span>
                {position && (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[0.6875rem] font-semibold tabular-nums text-primary-foreground" aria-label={`Position ${position}`}>
                    {position}
                  </span>
                )}
              </label>
            </li>
          );
        })}
        {visible.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">Nothing matches that search.</li>}
      </ul>
    </div>
  );
}
