import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const AcceptInvite = () => {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"idle" | "accepting" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate(`/login?redirect=/accept-invite/${token}`);
      return;
    }
    if (!token) return;
    setStatus("accepting");
    supabase.rpc("accept_team_invite", { p_token: token }).then(({ data, error }) => {
      const result = (data as any) ?? {};
      if (error || !result?.ok) {
        setStatus("error");
        setMessage(result?.error ? `Invite ${String(result.error).replace(/_/g, " ")}.` : error?.message || "Could not accept invite.");
      } else {
        setStatus("ok");
      }
    });
  }, [authLoading, user, token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-background">
      <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center">
        {status === "accepting" || authLoading ? (
          <>
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-4" />
            <h1 className="text-lg font-semibold tracking-tight">Accepting your invite…</h1>
          </>
        ) : status === "ok" ? (
          <>
            <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-4" />
            <h1 className="text-xl font-semibold tracking-tight mb-2">You're on the team</h1>
            <p className="text-sm text-muted-foreground mb-6">Welcome aboard. You can now access shared data.</p>
            <Button asChild className="w-full"><Link to="/dashboard">Go to Dashboard</Link></Button>
          </>
        ) : status === "error" ? (
          <>
            <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-semibold tracking-tight mb-2">Couldn't accept invite</h1>
            <p className="text-sm text-muted-foreground mb-6">{message}</p>
            <Button asChild variant="outline" className="w-full"><Link to="/dashboard">Continue to Dashboard</Link></Button>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default AcceptInvite;