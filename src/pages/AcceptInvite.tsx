import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Loader2, CheckCircle2, AlertCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type InviteRow = {
  id: string;
  owner_user_id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
};

const ERROR_MESSAGES: Record<string, string> = {
  invite_not_found: "Invite not found.",
  invite_expired: "This invite has expired.",
  invite_accepted: "This invite was already used.",
  invite_revoked: "This invite was revoked.",
  cannot_join_own_team: "You can't accept your own invite.",
  not_authenticated: "Please sign in to accept this invite.",
};

const AcceptInvite = () => {
  const { token } = useParams<{ token: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteRow | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoadError("invite_not_found");
      setLoading(false);
      return;
    }
    supabase
      .rpc("get_invite_by_token", { p_token: token })
      .then(({ data, error }) => {
        if (error) {
          setLoadError(error.message);
        } else if (!data || (Array.isArray(data) && data.length === 0)) {
          setLoadError("invite_not_found");
        } else {
          const row = (Array.isArray(data) ? data[0] : data) as InviteRow;
          setInvite(row);
          if (row.status !== "pending") {
            setLoadError(`invite_${row.status}`);
          } else if (new Date(row.expires_at) < new Date()) {
            setLoadError("invite_expired");
          }
        }
        setLoading(false);
      });
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setAccepting(true);
    setAcceptError(null);
    const { data, error } = await supabase.rpc("accept_team_invite", { p_token: token });
    const result = (data as any) ?? {};
    if (error || !result?.ok) {
      const code = result?.error || "unknown";
      setAcceptError(ERROR_MESSAGES[code] || error?.message || "Could not accept invite.");
      setAccepting(false);
      return;
    }
    setAccepted(true);
    setTimeout(() => navigate("/dashboard"), 1500);
  };

  const goSignIn = () => {
    navigate(`/auth?redirect=${encodeURIComponent(`/accept-invite/${token}`)}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8">
        {loading || authLoading ? (
          <div className="text-center py-6">
            <Loader2 className="w-7 h-7 text-primary animate-spin mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading invite…</p>
          </div>
        ) : accepted ? (
          <div className="text-center">
            <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-4" />
            <h1 className="text-xl font-semibold tracking-tight mb-2">You're on the team</h1>
            <p className="text-sm text-muted-foreground mb-6">Redirecting to your dashboard…</p>
            <Button asChild className="w-full"><Link to="/dashboard">Go to Dashboard</Link></Button>
          </div>
        ) : loadError ? (
          <div className="text-center">
            <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-semibold tracking-tight mb-2">Invite unavailable</h1>
            <p className="text-sm text-muted-foreground mb-6">{ERROR_MESSAGES[loadError] || loadError}</p>
            <Button asChild variant="outline" className="w-full"><Link to="/">Go home</Link></Button>
          </div>
        ) : invite ? (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-5 h-5 text-primary" />
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Team invitation</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight mb-2">Join the team</h1>
            <p className="text-sm text-muted-foreground mb-6">
              You've been invited to join as <Badge variant="secondary" className="ml-1 text-[10px] uppercase tracking-wider">{invite.role}</Badge>.
              The invite was sent to <span className="text-foreground font-medium">{invite.email}</span>.
            </p>

            {acceptError && (
              <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {acceptError}
              </div>
            )}

            {user ? (
              <Button onClick={handleAccept} disabled={accepting} className="w-full">
                {accepting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Accept invitation
              </Button>
            ) : (
              <div className="space-y-2">
                <Button onClick={goSignIn} className="w-full">Sign in to accept</Button>
                <p className="text-xs text-muted-foreground text-center">
                  You'll come back here automatically after signing in.
                </p>
              </div>
            )}

            <p className="text-[11px] text-muted-foreground text-center mt-6">
              Expires {new Date(invite.expires_at).toLocaleDateString()}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AcceptInvite;