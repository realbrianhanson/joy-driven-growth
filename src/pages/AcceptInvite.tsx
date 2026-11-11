import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Logo } from "@/components/shared/Logo";
import { PublicNotice } from "@/components/shared/PublicNotice";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/lib/format";

interface InviteRow {
  id: string;
  owner_user_id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
}

const PROBLEMS: Record<string, { title: string; message: string }> = {
  invite_not_found: { title: "This invite link is not valid", message: "Check that you copied the whole link, or ask for a new invite." },
  invite_expired: { title: "This invite has expired", message: "Ask the person who invited you to send a new one." },
  invite_accepted: { title: "This invite was already used", message: "If that was you, sign in to open the account." },
  invite_revoked: { title: "This invite was cancelled", message: "Ask the person who invited you to send a new one." },
  cannot_join_own_team: { title: "This is your own account", message: "You sent this invite, so you cannot accept it." },
};

const ACCESS: Record<string, string> = {
  admin: "You will be able to add, edit and approve testimonials, forms, walls and widgets.",
  member: "You will be able to view everything in the account.",
};

/** The page a teammate lands on from an invite link. */
export default function AcceptInvite() {
  const { token = "" } = useParams<{ token: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Team invite | Happy Client";
  }, []);

  const { data: invite, isLoading, error } = useQuery({
    queryKey: ["team-invite", token],
    enabled: !!token,
    retry: 1,
    queryFn: async (): Promise<InviteRow | null> => {
      const { data, error: rpcError } = await supabase.rpc("get_invite_by_token", { p_token: token });
      if (rpcError) throw rpcError;
      const row = Array.isArray(data) ? data[0] : data;
      return (row as InviteRow | undefined) ?? null;
    },
  });

  const accept = async () => {
    setAccepting(true);
    setProblem(null);
    const { data, error: rpcError } = await supabase.rpc("accept_team_invite", { p_token: token });
    const result = (data ?? {}) as { ok?: boolean; error?: string };
    if (rpcError || !result.ok) {
      setProblem(result.error ?? "unknown");
      setAccepting(false);
      return;
    }
    // The signed-in user now works in the inviter's account.
    await queryClient.invalidateQueries();
    setAccepted(true);
    setTimeout(() => navigate("/dashboard", { replace: true }), 1200);
  };

  const returnPath = encodeURIComponent(`/accept-invite/${token}`);

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4" role="status" aria-label="Loading invite">
        <Skeleton className="h-72 w-full max-w-md rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <PublicNotice
        tone="error"
        title="This invite did not load"
        message="Check your connection, then try again."
        action={<Button onClick={() => window.location.reload()}>Try again</Button>}
      />
    );
  }

  const loadProblem = !invite
    ? "invite_not_found"
    : invite.status !== "pending"
      ? `invite_${invite.status}`
      : new Date(invite.expires_at).getTime() < Date.now()
        ? "invite_expired"
        : null;
  const blocking = loadProblem ?? (problem && PROBLEMS[problem] ? problem : null);

  if (blocking) {
    const info = PROBLEMS[blocking] ?? PROBLEMS.invite_not_found;
    return (
      <PublicNotice
        title={info.title}
        message={info.message}
        action={
          <Button asChild variant="outline">
            <Link to={user ? "/dashboard" : "/login"}>{user ? "Go to your dashboard" : "Sign in"}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <Link to="/" className="mb-8" aria-label="Happy Client home">
        <Logo />
      </Link>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card px-8 py-10 text-center shadow-subtle">
        {accepted ? (
          <div role="status">
            <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-success" />
            <h1 className="display text-[1.75rem] text-foreground">You are on the team</h1>
            <p className="mt-2 text-sm text-muted-foreground">Opening the account now.</p>
          </div>
        ) : (
          <>
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-gold-light">
              <Users className="h-5 w-5 text-gold-deep" />
            </div>
            <h1 className="display text-[1.75rem] text-foreground">Join the team</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This invite was sent to <span className="font-medium text-foreground">{invite!.email}</span>. {ACCESS[invite!.role] ?? ACCESS.member}
            </p>

            {problem && (
              <p role="alert" className="mt-5 rounded-lg border border-destructive/30 bg-destructive-light px-3 py-2 text-sm text-destructive">
                The invite was not accepted. Try again.
              </p>
            )}

            {user ? (
              <>
                <Button onClick={accept} disabled={accepting} size="lg" className="mt-6 w-full">
                  {accepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Accept the invite
                </Button>
                <p className="mt-3 text-xs text-muted-foreground">Signed in as {user.email}</p>
              </>
            ) : (
              <div className="mt-6 space-y-2.5">
                <Button asChild size="lg" className="w-full">
                  <Link to={`/signup?redirect=${returnPath}`}>Create an account to join</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full">
                  <Link to={`/login?redirect=${returnPath}`}>I already have an account</Link>
                </Button>
                <p className="pt-1 text-xs text-muted-foreground">You come back to this page after you sign in.</p>
              </div>
            )}

            <p className="mt-6 text-xs text-muted-foreground">This invite expires on {formatDate(invite!.expires_at)}.</p>
          </>
        )}
      </div>
    </div>
  );
}
