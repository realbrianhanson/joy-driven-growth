import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Loader2, Paperclip, Star, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useAddTestimonial, useUpdateTestimonial } from "@/hooks/use-testimonials";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { baseMimeType, contentTypeFor, extensionForMime, validateMediaFile, type MediaKind } from "@/lib/media";
import type { TestimonialRow } from "@/lib/testimonial";
import { cn } from "@/lib/utils";

interface TestimonialFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass a testimonial to edit it. Leave empty to add a new one. */
  testimonial?: TestimonialRow | null;
}

function RatingPicker({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div role="radiogroup" aria-label="Rating" className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star === 1 ? "" : "s"}`}
          onClick={() => onChange(value === star ? 0 : star)}
          className="rounded-md p-1 hover:bg-muted"
        >
          <Star className={cn("h-6 w-6", value >= star ? "fill-gold text-gold" : "text-border-hover")} strokeWidth={1.5} />
        </button>
      ))}
      <span className="ml-2 text-xs text-muted-foreground">{value === 0 ? "No rating" : `${value} of 5`}</span>
    </div>
  );
}

/** Add a testimonial you already have, or fix the details on one. */
export function TestimonialFormDialog({ open, onOpenChange, testimonial }: TestimonialFormDialogProps) {
  const { user } = useAuth();
  const addMutation = useAddTestimonial();
  const updateMutation = useUpdateTestimonial();
  const isEdit = !!testimonial;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(testimonial?.author_name ?? "");
    setTitle(testimonial?.author_title ?? "");
    setCompany(testimonial?.author_company ?? "");
    setEmail(testimonial?.author_email ?? "");
    setContent(testimonial?.content ?? "");
    setRating(testimonial?.rating ?? 0);
    setFile(null);
    setFileError(null);
    setHasPermission(false);
    setIsSaving(false);
  }, [open, testimonial]);

  const fileKind: MediaKind | null = file ? (baseMimeType(file.type).startsWith("audio/") ? "audio" : "video") : null;
  const hasBody = content.trim().length > 0 || !!file || (isEdit && testimonial?.type !== "text");
  const canSave = name.trim().length > 0 && hasBody && (isEdit || hasPermission) && !isSaving;

  const handleFile = (picked: File | undefined) => {
    if (!picked) return;
    const kind: MediaKind = baseMimeType(picked.type).startsWith("audio/") ? "audio" : "video";
    const problem = validateMediaFile(picked, kind);
    if (problem) {
      setFileError(problem);
      setFile(null);
      return;
    }
    setFileError(null);
    setFile(picked);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    setIsSaving(true);

    try {
      if (isEdit && testimonial) {
        await updateMutation.mutateAsync({
          id: testimonial.id,
          author_name: name.trim(),
          author_title: title.trim() || null,
          author_company: company.trim() || null,
          author_email: email.trim() || null,
          content: content.trim() || null,
          rating: rating >= 1 ? rating : null,
        });
        toast.success("Testimonial updated");
      } else {
        let video_url: string | null = null;
        let audio_url: string | null = null;
        if (file && fileKind && user) {
          const path = `${user.id}/${crypto.randomUUID()}.${extensionForMime(file.type, fileKind)}`;
          const { error: uploadError } = await supabase.storage
            .from("videos")
            .upload(path, file, { contentType: contentTypeFor(file.type, fileKind), upsert: false });
          if (uploadError) throw new Error("The file did not upload. Check your connection and try again.");
          const url = supabase.storage.from("videos").getPublicUrl(path).data.publicUrl;
          if (fileKind === "video") video_url = url;
          else audio_url = url;
        }
        await addMutation.mutateAsync({
          author_name: name,
          author_title: title,
          author_company: company,
          author_email: email,
          content,
          rating: rating >= 1 ? rating : null,
          type: fileKind ?? "text",
          video_url,
          audio_url,
        });
        toast.success("Testimonial added", { description: "It is approved and ready to use on a wall or widget." });
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "That did not save. Try again.");
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isSaving && onOpenChange(next)}>
      <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="display text-[1.75rem] font-normal">{isEdit ? "Edit testimonial" : "Add a testimonial"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Fix typos or trim the length. Keep the meaning the same as what the client said."
              : "Use this for kind words you already have: an email, a text message, a review, or a video on your phone."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="t-name">
                Client name <span className="text-destructive">*</span>
              </Label>
              <Input id="t-name" className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} maxLength={200} required autoFocus={!isEdit} />
            </div>
            <div>
              <Label htmlFor="t-title">Job title</Label>
              <Input id="t-title" className="mt-1.5" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
            </div>
            <div>
              <Label htmlFor="t-company">Company</Label>
              <Input id="t-company" className="mt-1.5" value={company} onChange={(e) => setCompany(e.target.value)} maxLength={200} />
            </div>
          </div>

          <div>
            <Label htmlFor="t-content">
              What they said {!file && !isEdit && <span className="text-destructive">*</span>}
            </Label>
            <Textarea id="t-content" className="mt-1.5 resize-y" rows={5} value={content} onChange={(e) => setContent(e.target.value)} maxLength={4000} placeholder="Paste their words exactly as they wrote them." />
          </div>

          <div>
            <Label>Rating</Label>
            <div className="mt-1.5">
              <RatingPicker value={rating} onChange={setRating} />
            </div>
          </div>

          {!isEdit && (
            <div>
              <Label htmlFor="t-file">
                Video or audio file <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <input ref={fileInputRef} id="t-file" type="file" accept="video/*,audio/*" className="sr-only" onChange={(e) => handleFile(e.target.files?.[0])} />
              <div className="mt-1.5 flex items-center gap-2">
                {file ? (
                  <span className="inline-flex min-w-0 items-center gap-2 rounded-lg border border-border bg-muted/50 py-1.5 pl-3 pr-1.5 text-sm text-foreground">
                    <Paperclip className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      aria-label="Remove file"
                      className="rounded p-1 text-muted-foreground hover:bg-border hover:text-foreground"
                      onClick={() => {
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ) : (
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Paperclip className="mr-1.5 h-3.5 w-3.5" /> Choose a file
                  </Button>
                )}
              </div>
              {fileError && (
                <p role="alert" className="mt-1.5 text-sm text-destructive">
                  {fileError}
                </p>
              )}
            </div>
          )}

          {!isEdit && (
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border px-4 py-3">
              <Checkbox checked={hasPermission} onCheckedChange={(checked) => setHasPermission(checked === true)} className="mt-0.5" />
              <span className="text-sm text-foreground">
                This is a real testimonial from a real client, and I have their permission to publish it.
              </span>
            </label>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSave}>
              {isSaving && <Loader2 className="mr-1.5 animate-spin" />}
              {isEdit ? "Save changes" : file ? "Upload and add" : "Add testimonial"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
