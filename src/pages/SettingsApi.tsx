import { useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import SettingsLayout from "@/components/settings/SettingsLayout";
import { CopyButton } from "@/components/shared/CopyButton";
import { ErrorState } from "@/components/shared/States";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

async function sha256Hex(input: string): Promise<string> {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** A new random key. Only its hash is stored, so the full key can be shown one time. */
function generateApiKey(): { full: string; prefix: string } {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const secret = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const full = `hc_live_${secret}`;
  return { full, prefix: full.slice(0, 12) };
}

function Panel({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card">
      <div className="px-5 pt-5 sm:px-6 sm:pt-6">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

const FIELDS: { name: string; note: string }[] = [
  { name: "author_name", note: "Required. The client's name." },
  { name: "content", note: "Required. The testimonial, up to 4,000 characters." },
  { name: "rating", note: "Optional. A whole number from 1 to 5." },
  { name: "author_email", note: "Optional." },
  { name: "author_title", note: "Optional. The client's job title." },
  { name: "author_company", note: "Optional." },
];

export default function SettingsApi() {
  const { workspaceOwnerId } = useWorkspace();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; name: string } | null>(null);

  const keys = useQuery({
    queryKey: ["api-keys", workspaceOwnerId],
    enabled: !!workspaceOwnerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_keys")
        .select("id, name, key_prefix, last_used_at, revoked_at, created_at")
        .eq("user_id", workspaceOwnerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const createKey = async (event: FormEvent) => {
    event.preventDefault();
    const label = name.trim().slice(0, 80);
    if (!label || !workspaceOwnerId || creating) return;
    setCreating(true);
    try {
      const { full, prefix } = generateApiKey();
      const { error } = await supabase.from("api_keys").insert({
        user_id: workspaceOwnerId,
        name: label,
        key_prefix: prefix,
        key_hash: await sha256Hex(full),
      });
      if (error) throw error;
      setNewKey(full);
      setName("");
      void queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    } catch (err) {
      console.error("API key creation failed:", err);
      toast.error("The key was not created. Try again.");
    } finally {
      setCreating(false);
    }
  };

  const revoke = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Key turned off");
      void queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
    onError: () => toast.error("The key was not turned off. Try again."),
  });

  const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-testimonial`;
  const example = `curl -X POST ${endpoint} \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "author_name": "Jane Doe",
    "author_company": "Acme Inc",
    "content": "The team finished our project two weeks early.",
    "rating": 5
  }'`;

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <Panel
          title="Create a key"
          description="A key lets your own system, Zapier or Make send testimonials into this account. Each one arrives under Needs review."
        >
          <form onSubmit={createKey} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label htmlFor="key-name">Name</Label>
              <Input
                id="key-name"
                placeholder="Where you will use it, like Zapier"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                className="mt-1.5"
              />
            </div>
            <Button type="submit" disabled={!name.trim() || creating}>
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Create key
            </Button>
          </form>
        </Panel>

        <Panel title="Your keys" description="Everyone on your team shares these keys. A key that is turned off stops working at once.">
          {keys.isLoading ? (
            <div className="space-y-3" role="status" aria-label="Loading keys">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : keys.error ? (
            <ErrorState title="Your keys did not load" error={keys.error} onRetry={() => void keys.refetch()} />
          ) : keys.data && keys.data.length > 0 ? (
            <ul className="-my-3 divide-y divide-border">
              {keys.data.map((key) => (
                <li key={key.id} className={cn("flex items-center gap-3 py-3", key.revoked_at && "opacity-60")}>
                  <KeyRound className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                      <span className="truncate">{key.name}</span>
                      {key.revoked_at && (
                        <span className="rounded-full bg-destructive-light px-2 py-0.5 text-xs font-medium text-destructive">Turned off</span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      <span className="font-mono">{key.key_prefix}...</span>
                      <span className="mx-1.5" aria-hidden="true">
                        ·
                      </span>
                      {key.last_used_at ? `Last used on ${formatDate(key.last_used_at)}` : "Never used"}
                    </p>
                  </div>
                  {!key.revoked_at && (
                    <Button variant="ghost" size="icon" onClick={() => setRevokeTarget({ id: key.id, name: key.name })} aria-label={`Turn off ${key.name}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No keys yet. Create one above when you are ready to connect a system.</p>
          )}
        </Panel>

        <Panel title="How to send a testimonial" description="Send a POST request with JSON. Put your key in the x-api-key header.">
          <div className="relative">
            <pre className="overflow-x-auto rounded-xl bg-foreground p-4 pr-14 text-xs leading-relaxed text-background">
              <code>{example}</code>
            </pre>
            <CopyButton text={example} iconOnly variant="ghost" label="Copy the example" className="absolute right-2 top-2 text-background hover:bg-white/10 hover:text-background" />
          </div>
          <dl className="mt-5 grid gap-x-6 gap-y-2.5 sm:grid-cols-[auto_1fr]">
            {FIELDS.map((field) => (
              <div key={field.name} className="contents">
                <dt className="font-mono text-xs text-foreground">{field.name}</dt>
                <dd className="text-sm text-muted-foreground">{field.note}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-sm text-muted-foreground">
            A good request returns <code className="font-mono text-xs text-foreground">{'{"ok": true}'}</code>. The limit is 20 requests each minute.
          </p>
        </Panel>
      </div>

      <Dialog open={!!newKey} onOpenChange={(open) => !open && setNewKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy your new key now</DialogTitle>
            <DialogDescription>This is the only time the full key is shown. Store it somewhere safe, like a password manager.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-3">
            <code className="min-w-0 flex-1 break-all font-mono text-xs text-foreground">{newKey}</code>
            <CopyButton text={newKey ?? ""} toastMessage="Key copied" />
          </div>
          <DialogFooter>
            <Button onClick={() => setNewKey(null)}>I saved it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!revokeTarget} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Turn off {revokeTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>Anything that uses this key stops working at once. You cannot turn a key back on.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it on</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (revokeTarget) revoke.mutate(revokeTarget.id);
                setRevokeTarget(null);
              }}
            >
              Turn off key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsLayout>
  );
}
