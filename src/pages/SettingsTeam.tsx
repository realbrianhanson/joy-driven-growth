import { useState, type FormEvent, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Info, Loader2, Send, Trash2, X } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import SettingsLayout from "@/components/settings/SettingsLayout";
import { CopyButton } from "@/components/shared/CopyButton";
import { PersonAvatar } from "@/components/shared/PersonAvatar";
import { ErrorState } from "@/components/shared/States";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspace } from "@/hooks/use-workspace";
import { PUBLIC_APP_URL } from "@/lib/config";
import { formatDate } from "@/lib/format";

type TeamRole = "admin" | "member";

const ROLE_LABELS: Record<string, string> = { owner: "Owner", admin: "Can edit", member: "View only" };

function Panel({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
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

function RoleTag({ role }: { role: string }) {
  return <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">{ROLE_LABELS[role] ?? role}</span>;
}

export default function SettingsTeam() {
  const { user } = useAuth();
  const { isTeamMember } = useWorkspace();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<TeamRole>("admin");
  const [removeTarget, setRemoveTarget] = useState<{ id: string; label: string } | null>(null);

  const members = useQuery({
    queryKey: ["team-members", user?.id],
    enabled: !!user && !isTeamMember,
    queryFn: async () => {
      const [rows, profiles] = await Promise.all([
        supabase
          .from("team_members")
          .select("id, member_user_id, role, created_at")
          .eq("owner_user_id", user!.id)
          .order("created_at", { ascending: false }),
        supabase.rpc("get_team_member_profiles"),
      ]);
      if (rows.error) throw rows.error;
      const profileList = (profiles.data as { member_user_id: string; full_name: string | null; email: string | null }[] | null) ?? [];
      const byId = new Map(profileList.map((p) => [p.member_user_id, p]));
      return (rows.data ?? []).map((m) => ({
        ...m,
        full_name: byId.get(m.member_user_id)?.full_name ?? null,
        email: byId.get(m.member_user_id)?.email ?? null,
      }));
    },
  });

  const invites = useQuery({
    queryKey: ["team-invites", user?.id],
    enabled: !!user && !isTeamMember,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_invites")
        .select("id, email, role, token, status, expires_at, created_at")
        .eq("owner_user_id", user!.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const createInvite = useMutation({
    mutationFn: async () => {
      const address = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(address)) throw new Error("Enter a full email address, like name@company.com.");
      if (address === user?.email?.toLowerCase()) throw new Error("That is your own email address.");
      if ((invites.data ?? []).some((invite) => invite.email === address)) throw new Error("That person already has an open invite.");
      if ((members.data ?? []).some((member) => member.email?.toLowerCase() === address)) throw new Error("That person is already on your team.");

      const { data: invite, error } = await supabase
        .from("team_invites")
        .insert({ owner_user_id: user!.id, email: address, role })
        .select()
        .single();
      if (error) throw new Error("The invite was not created. Try again.");

      const { data: sendResult } = await supabase.functions.invoke("send-team-invite", { body: { invite_id: invite.id } });
      return { email: invite.email, emailed: (sendResult as { emailed?: boolean } | null)?.emailed === true };
    },
    onSuccess: (result) => {
      if (result.emailed) toast.success(`Invite sent to ${result.email}`);
      else toast.success("Invite ready", { description: "The email did not go out. Copy the invite link below and send it yourself." });
      setEmail("");
      void queryClient.invalidateQueries({ queryKey: ["team-invites"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const cancelInvite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("team_invites").update({ status: "revoked" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Invite cancelled");
      void queryClient.invalidateQueries({ queryKey: ["team-invites"] });
    },
    onError: () => toast.error("The invite was not cancelled. Try again."),
  });

  const removeMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("team_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Member removed");
      void queryClient.invalidateQueries({ queryKey: ["team-members"] });
    },
    onError: () => toast.error("The member was not removed. Try again."),
  });

  const submitInvite = (event: FormEvent) => {
    event.preventDefault();
    if (!createInvite.isPending) createInvite.mutate();
  };

  if (isTeamMember) {
    return (
      <SettingsLayout>
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">The account owner manages the team</h2>
            <p className="mt-1 text-sm text-muted-foreground">Ask the person who invited you to add or remove people.</p>
          </div>
        </div>
      </SettingsLayout>
    );
  }

  const now = Date.now();

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <Panel title="Invite a teammate" description="They get a private link by email. The link works for 14 days.">
          <form onSubmit={submitInvite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label htmlFor="invite-email">Email</Label>
              <Input
                id="invite-email"
                type="email"
                autoComplete="off"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div className="w-full sm:w-44">
              <Label htmlFor="invite-role">Access</Label>
              <Select value={role} onValueChange={(value) => setRole(value as TeamRole)}>
                <SelectTrigger id="invite-role" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Can edit</SelectItem>
                  <SelectItem value="member">View only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={createInvite.isPending || !email.trim()}>
              {createInvite.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send invite
            </Button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            {role === "admin"
              ? "Can edit: adds, edits and approves testimonials, forms, walls and widgets."
              : "View only: sees everything in the account and changes nothing."}
          </p>
        </Panel>

        {invites.error ? (
          <ErrorState title="Open invites did not load" error={invites.error} onRetry={() => void invites.refetch()} />
        ) : (invites.data ?? []).length > 0 ? (
          <Panel title="Open invites" description="Not accepted yet. Copy a link to send it yourself.">
            <ul className="-my-3 divide-y divide-border">
              {invites.data!.map((invite) => {
                const expired = new Date(invite.expires_at).getTime() < now;
                return (
                  <li key={invite.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-medium text-foreground">{invite.email}</span>
                        <RoleTag role={invite.role} />
                      </div>
                      <p className={expired ? "mt-0.5 text-xs text-destructive" : "mt-0.5 text-xs text-muted-foreground"}>
                        {expired ? "Expired on" : "Expires on"} {formatDate(invite.expires_at)}
                      </p>
                    </div>
                    {!expired && (
                      <CopyButton text={`${PUBLIC_APP_URL}/accept-invite/${invite.token}`} label="Copy link" toastMessage="Invite link copied" />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => cancelInvite.mutate(invite.id)}
                      disabled={cancelInvite.isPending}
                      aria-label={`Cancel the invite for ${invite.email}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </Panel>
        ) : null}

        <Panel title="People in this account">
          {members.isLoading ? (
            <div className="space-y-3" role="status" aria-label="Loading team">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : members.error ? (
            <ErrorState title="The team did not load" error={members.error} onRetry={() => void members.refetch()} />
          ) : (
            <ul className="-my-3 divide-y divide-border">
              <li className="flex items-center gap-3 py-3">
                <PersonAvatar name={user?.email} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{user?.email} (you)</span>
                <RoleTag role="owner" />
              </li>
              {(members.data ?? []).map((member) => {
                const label = member.full_name || member.email || "Team member";
                return (
                  <li key={member.id} className="flex items-center gap-3 py-3">
                    <PersonAvatar name={label} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{label}</p>
                      {member.full_name && member.email && <p className="truncate text-xs text-muted-foreground">{member.email}</p>}
                    </div>
                    <RoleTag role={member.role} />
                    <Button variant="ghost" size="icon" onClick={() => setRemoveTarget({ id: member.id, label })} aria-label={`Remove ${label}`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <AlertDialog open={!!removeTarget} onOpenChange={(open) => !open && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removeTarget?.label}?</AlertDialogTitle>
            <AlertDialogDescription>They lose access to this account right away. You can invite them again later.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep them</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (removeTarget) removeMember.mutate(removeTarget.id);
                setRemoveTarget(null);
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsLayout>
  );
}
