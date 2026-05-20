import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2, Copy, Check, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SettingsLayout from "@/components/settings/SettingsLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const SettingsTeam = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");
  const [copied, setCopied] = useState<string | null>(null);

  const members = useQuery({
    queryKey: ["team-members", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("id, member_user_id, role, created_at")
        .eq("owner_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const invites = useQuery({
    queryKey: ["team-invites", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_invites")
        .select("id, email, role, token, status, expires_at, created_at")
        .eq("owner_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const createInvite = useMutation({
    mutationFn: async () => {
      if (!email.trim()) throw new Error("Email required");
      const { error } = await supabase.from("team_invites").insert({
        owner_user_id: user!.id,
        email: email.trim().toLowerCase(),
        role,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Invite created");
      setEmail("");
      qc.invalidateQueries({ queryKey: ["team-invites"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeInvite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("team_invites").update({ status: "revoked" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Invite revoked");
      qc.invalidateQueries({ queryKey: ["team-invites"] });
    },
  });

  const removeMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("team_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Member removed");
      qc.invalidateQueries({ queryKey: ["team-members"] });
    },
  });

  const copyLink = (token: string) => {
    const link = `${window.location.origin}/accept-invite/${token}`;
    navigator.clipboard.writeText(link);
    setCopied(token);
    toast.success("Invite link copied");
    setTimeout(() => setCopied(null), 1800);
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Invite a teammate</CardTitle>
            <CardDescription>Send a private invite link. They'll join your team after accepting.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex-1">
                <Label htmlFor="invite-email" className="text-xs">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="teammate@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="w-full sm:w-40">
                <Label className="text-xs">Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as "member" | "admin")}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={() => createInvite.mutate()}
                disabled={createInvite.isPending || !email.trim()}
              >
                {createInvite.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Send invite
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending invites</CardTitle>
            <CardDescription>Copy the link and send it to your teammate. Expires after 14 days.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {invites.isLoading ? (
              <p className="text-sm text-muted-foreground p-6">Loading…</p>
            ) : invites.data?.length ? (
              <ul className="divide-y divide-border">
                {invites.data.map((inv) => (
                  <li key={inv.id} className="flex items-center gap-4 px-6 py-3.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground truncate">{inv.email}</span>
                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">{inv.role}</Badge>
                        <Badge
                          variant={inv.status === "pending" ? "outline" : "secondary"}
                          className="text-[10px] uppercase tracking-wider"
                        >
                          {inv.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Expires {new Date(inv.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                    {inv.status === "pending" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => copyLink(inv.token)}>
                          {copied === inv.token ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                          {copied === inv.token ? "Copied" : "Copy link"}
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => revokeInvite.mutate(inv.id)}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground p-6">No pending invites.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>People with access to this account.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              <li className="flex items-center gap-4 px-6 py-3.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{user?.email}</span>
                    <Badge className="text-[10px] uppercase tracking-wider">Owner</Badge>
                  </div>
                </div>
              </li>
              {members.data?.map((m) => (
                <li key={m.id} className="flex items-center gap-4 px-6 py-3.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono text-muted-foreground truncate">{m.member_user_id.slice(0, 8)}…</span>
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">{m.role}</Badge>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => removeMember.mutate(m.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
};

export default SettingsTeam;
