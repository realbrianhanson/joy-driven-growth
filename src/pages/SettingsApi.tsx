import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, Copy, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import SettingsLayout from "@/components/settings/SettingsLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateApiKey(): { full: string; prefix: string } {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const secret = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  const full = `hc_live_${secret}`;
  return { full, prefix: full.slice(0, 12) };
}

const SettingsApi = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const keys = useQuery({
    queryKey: ["api-keys", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_keys")
        .select("id, name, key_prefix, last_used_at, revoked_at, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleCreate = async () => {
    if (!name.trim() || !user) return;
    setCreating(true);
    try {
      const { full, prefix } = generateApiKey();
      const key_hash = await sha256Hex(full);
      const { error } = await supabase.from("api_keys").insert({
        user_id: user.id,
        name: name.trim(),
        key_prefix: prefix,
        key_hash,
      });
      if (error) throw error;
      setNewKey(full);
      setName("");
      qc.invalidateQueries({ queryKey: ["api-keys"] });
    } catch (e) {
      toast.error("Failed to create key");
    } finally {
      setCreating(false);
    }
  };

  const revoke = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("api_keys")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Key revoked");
      qc.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-testimonial`;

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Create API key</CardTitle>
            <CardDescription>
              Use API keys to submit testimonials programmatically. Treat keys like passwords — they're shown once.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex-1">
                <Label htmlFor="key-name" className="text-xs">Key name</Label>
                <Input
                  id="key-name"
                  placeholder="Production server, Zapier, …"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button onClick={handleCreate} disabled={!name.trim() || creating}>
                {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Generate key
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your keys</CardTitle>
            <CardDescription>Revoking a key immediately blocks all requests using it.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {keys.isLoading ? (
              <p className="text-sm text-muted-foreground p-6">Loading…</p>
            ) : keys.data?.length ? (
              <ul className="divide-y divide-border">
                {keys.data.map((k) => (
                  <li key={k.id} className="flex items-center gap-4 px-6 py-3.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">{k.name}</span>
                        {k.revoked_at && (
                          <span className="text-[10px] uppercase tracking-wider text-destructive">Revoked</span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-muted-foreground mt-0.5">
                        {k.key_prefix}••••••••
                        <span className="ml-3 font-sans">
                          {k.last_used_at
                            ? `Last used ${new Date(k.last_used_at).toLocaleDateString()}`
                            : "Never used"}
                        </span>
                      </p>
                    </div>
                    {!k.revoked_at && (
                      <Button size="sm" variant="ghost" onClick={() => revoke.mutate(k.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground p-6">No keys yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Example request</CardTitle>
            <CardDescription>Submit a testimonial via HTTPS.</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted/60 text-foreground rounded-lg p-4 overflow-x-auto leading-relaxed">
{`curl -X POST ${endpoint} \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{
    "author_name": "Jane Doe",
    "author_company": "Acme Inc",
    "content": "Best product weve used in years.",
    "rating": 5
  }'`}
            </pre>
          </CardContent>
        </Card>

        <AlertDialog open={!!newKey} onOpenChange={(o) => { if (!o) setNewKey(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Your new API key</AlertDialogTitle>
              <AlertDialogDescription>
                Copy this key now. For security, we'll never show it again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3">
              <code className="text-xs font-mono text-foreground flex-1 break-all">{newKey}</code>
              <Button size="sm" variant="outline" onClick={() => newKey && copy(newKey)}>
                {copied ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
              <AlertDialogAction onClick={() => setNewKey(null)}>I've saved it</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SettingsLayout>
  );
};

export default SettingsApi;
