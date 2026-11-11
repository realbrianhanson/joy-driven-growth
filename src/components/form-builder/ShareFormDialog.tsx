import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/shared/CopyButton";
import { PUBLIC_APP_URL } from "@/lib/config";

interface ShareFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: { name: string; slug: string; is_published: boolean | null } | null;
  /** Shown once, right after a new form is saved. */
  justCreated?: boolean;
}

/** Everything needed to get a form in front of a client: the link, a message to send, and a QR code. */
export function ShareFormDialog({ open, onOpenChange, form, justCreated }: ShareFormDialogProps) {
  const [qr, setQr] = useState<string | null>(null);
  const link = form ? `${PUBLIC_APP_URL}/collect/${form.slug}` : "";
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open || !link) return;
    setMessage(
      `Hi, it was great working with you. Would you share a few words about how it went? It takes about two minutes:\n${link}\n\nThank you!`,
    );
    let cancelled = false;
    QRCode.toDataURL(link, { width: 640, margin: 2, color: { dark: "#1a1714", light: "#ffffff" } })
      .then((url) => {
        if (!cancelled) setQr(url);
      })
      .catch(() => {
        if (!cancelled) setQr(null);
      });
    return () => {
      cancelled = true;
    };
  }, [open, link]);

  if (!form) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="display text-[1.75rem] font-normal">{justCreated ? "Your form is ready" : "Share this form"}</DialogTitle>
          <DialogDescription>
            {form.is_published
              ? "Send the link to a happy client. Their answer shows up in Testimonials for you to approve."
              : "This form is turned off. Turn it on in the form editor before you send the link."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <Label htmlFor="share-link">Form link</Label>
            <div className="mt-1.5 flex gap-2">
              <Input id="share-link" readOnly value={link} onFocus={(e) => e.currentTarget.select()} className="font-mono text-sm md:text-sm" />
              <CopyButton text={link} size="default" variant="default" toastMessage="Link copied" />
              <Button asChild variant="outline" size="icon" aria-label="Open the form in a new tab">
                <a href={link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink />
                </a>
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="share-message">A message you can send</Label>
            <Textarea id="share-message" className="mt-1.5 resize-y" rows={5} value={message} onChange={(e) => setMessage(e.target.value)} />
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">Edit it so it sounds like you. Then paste it in a text or email.</p>
              <CopyButton text={message} label="Copy message" toastMessage="Message copied" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-muted/40 p-4 sm:flex-row">
            <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-lg border border-border bg-white">
              {qr ? <img src={qr} alt={`QR code for ${form.name}`} className="h-full w-full rounded-lg" /> : <span className="text-xs text-muted-foreground">QR code</span>}
            </div>
            <div className="text-center sm:text-left">
              <p className="text-sm font-medium text-foreground">QR code</p>
              <p className="mt-0.5 text-sm text-muted-foreground">Print it on a counter card, a receipt or an invoice. Clients scan it with a phone camera.</p>
              {qr && (
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <a href={qr} download={`${form.slug}-qr-code.png`}>
                    <Download className="mr-1.5" /> Download PNG
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
