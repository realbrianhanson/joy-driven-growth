import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { FileUp, Loader2 } from "lucide-react";
import { useImportTestimonials } from "@/hooks/use-testimonials";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Stars } from "@/components/shared/Stars";
import { downloadTextFile, parseTestimonialCsv } from "@/lib/testimonial";
import { pluralize } from "@/lib/format";

// Placeholder rows only. A sample file must never contain a quote someone could publish by mistake.
const SAMPLE_CSV = [
  "name,testimonial,rating,title,company,email",
  '"Client name","Paste what this client said, word for word.",5,"Their job title","Their company","client@example.com"',
  '"Second client","Rating, title, company and email can be left empty.",,,,',
].join("\n");

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Bring in testimonials from a spreadsheet. Paste the rows or choose a CSV file. */
export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const importMutation = useImportTestimonials();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if (open) {
      setText("");
      setHasPermission(false);
    }
  }, [open]);

  const result = useMemo(() => (text.trim() ? parseTestimonialCsv(text) : null), [text]);
  const rows = result?.rows ?? [];
  const canImport = rows.length > 0 && hasPermission && !importMutation.isPending;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("That file is larger than 2 MB. Split it and import it in parts.");
      return;
    }
    setText(await file.text());
  };

  const handleImport = () => {
    importMutation.mutate(rows, {
      onSuccess: ({ imported, failed }) => {
        if (failed > 0) toast.warning(`${pluralize(imported, "testimonial")} imported. ${failed} did not save.`);
        else toast.success(`${pluralize(imported, "testimonial")} imported`);
        onOpenChange(false);
      },
      onError: (err) => toast.error(err instanceof Error ? err.message : "The import failed. Try again."),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !importMutation.isPending && onOpenChange(next)}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="display text-[1.75rem] font-normal">Import testimonials</DialogTitle>
          <DialogDescription>
            Save your spreadsheet as CSV. The first row needs a <strong>name</strong> column and a <strong>testimonial</strong> column.
            Rating, title, company and email are optional.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <input ref={fileInputRef} type="file" accept=".csv,text/csv,text/plain" className="sr-only" onChange={(e) => void handleFile(e.target.files?.[0])} aria-label="Choose a CSV file" />
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <FileUp className="mr-1.5" /> Choose a CSV file
            </Button>
            <Button type="button" variant="link" size="sm" onClick={() => downloadTextFile("happy-client-import-sample.csv", SAMPLE_CSV)}>
              Download a sample file
            </Button>
          </div>

          <div>
            <Label htmlFor="import-text">Or paste the rows here</Label>
            <Textarea
              id="import-text"
              className="mt-1.5 resize-y font-mono text-sm md:text-[0.8125rem]"
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={SAMPLE_CSV}
              spellCheck={false}
            />
          </div>

          {result?.error && (
            <p role="alert" className="rounded-lg border border-destructive/25 bg-destructive-light px-3.5 py-2.5 text-sm text-destructive">
              {result.error}
            </p>
          )}

          {rows.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground">
                {pluralize(rows.length, "testimonial")} ready to import
                {result && result.skipped > 0 && (
                  <span className="font-normal text-muted-foreground"> · {pluralize(result.skipped, "row")} skipped (no name or no text)</span>
                )}
              </p>
              <ul className="mt-2 divide-y divide-border-subtle rounded-xl border border-border">
                {rows.slice(0, 3).map((row, i) => (
                  <li key={i} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium text-foreground">
                        {row.author_name}
                        {row.author_company && <span className="font-normal text-muted-foreground"> · {row.author_company}</span>}
                      </p>
                      <Stars rating={row.rating} size="xs" />
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{row.content}</p>
                  </li>
                ))}
              </ul>
              {rows.length > 3 && <p className="mt-1.5 text-xs text-muted-foreground">And {rows.length - 3} more.</p>}

              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-border px-4 py-3">
                <Checkbox checked={hasPermission} onCheckedChange={(checked) => setHasPermission(checked === true)} className="mt-0.5" />
                <span className="text-sm text-foreground">
                  These are real testimonials from real clients, and I have permission to publish them.
                </span>
              </label>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={importMutation.isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={handleImport} disabled={!canImport}>
            {importMutation.isPending && <Loader2 className="mr-1.5 animate-spin" />}
            {rows.length > 0 ? `Import ${pluralize(rows.length, "testimonial")}` : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
