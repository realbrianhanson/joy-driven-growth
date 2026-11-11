import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, Eye, EyeOff, Loader2, Mail, MailCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { clearReturnPath, isSafePath, rememberReturnPath } from "@/lib/return-path";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/Logo";

type Mode = "signin" | "signup" | "magic" | "forgot" | "sent" | "recovery";

interface AuthProps {
  initialMode?: "signin" | "signup";
}

const GoogleIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

/** Plain-language versions of the errors people actually hit. */
function friendlyAuthError(message: string | undefined): string {
  const m = (message ?? "").toLowerCase();
  if (m.includes("invalid login credentials")) return "That email and password do not match. Check them, or reset your password.";
  if (m.includes("email not confirmed")) return "Confirm your email first. Open the link we sent you, then sign in.";
  if (m.includes("already registered") || m.includes("already been registered")) return "An account with that email already exists. Sign in instead.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Wait a minute, then try again.";
  if (m.includes("password") && m.includes("weak")) return "Choose a stronger password. Use at least 8 characters.";
  if (m.includes("failed to fetch") || m.includes("network")) return "We could not reach the server. Check your connection and try again.";
  return message || "Something went wrong. Try again.";
}

const BENEFITS = [
  "One link collects text, video and voice testimonials",
  "Clients give written permission on the form",
  "A wall page and website widgets, ready to publish",
];

export default function Auth({ initialMode }: AuthProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, signInWithMagicLink, user } = useAuth();

  const modeParam = searchParams.get("mode");
  const requestedMode: Mode = modeParam === "recovery" ? "recovery" : modeParam === "signup" ? "signup" : (initialMode ?? "signin");
  const [mode, setMode] = useState<Mode>(requestedMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState<null | "form" | "google">(null);
  const [error, setError] = useState<string | null>(null);
  const [sentReason, setSentReason] = useState<"confirm" | "magic" | "reset">("confirm");

  // Only same-origin paths. Never follow a redirect to another site.
  const rawRedirect = searchParams.get("redirect");
  const redirectTo = isSafePath(rawRedirect) ? rawRedirect : "/dashboard";

  // A confirmation email opens a new tab on the dashboard. Keep the path so that tab can finish the trip.
  useEffect(() => {
    if (redirectTo !== "/dashboard") rememberReturnPath(redirectTo);
  }, [redirectTo]);

  useEffect(() => {
    let intent: string | null = null;
    try {
      intent = sessionStorage.getItem("hc-auth-intent");
      sessionStorage.removeItem("hc-auth-intent");
    } catch {
      /* storage blocked */
    }
    if (intent === "recovery" || window.location.hash.includes("type=recovery")) setMode("recovery");
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("recovery");
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user && mode !== "recovery") {
      clearReturnPath();
      navigate(redirectTo, { replace: true });
    }
  }, [user, mode, navigate, redirectTo]);

  useEffect(() => {
    document.title = mode === "signup" ? "Create your account | Happy Client" : "Sign in | Happy Client";
  }, [mode]);

  const switchMode = (next: Mode) => {
    setError(null);
    setMode(next);
  };

  const handleGoogle = async () => {
    setError(null);
    setBusy("google");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}${redirectTo}`,
    });
    if (result?.error) {
      setError("Google sign-in did not finish. Try again, or use your email.");
      setBusy(null);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const cleanEmail = email.trim();

    if (mode === "signin") {
      setBusy("form");
      const { error: err } = await signIn(cleanEmail, password);
      setBusy(null);
      if (err) setError(friendlyAuthError(err.message));
      return;
    }

    if (mode === "signup") {
      if (password.length < 8) {
        setError("Use at least 8 characters for your password.");
        return;
      }
      setBusy("form");
      const { error: err } = await signUp(cleanEmail, password, name.trim() || undefined);
      setBusy(null);
      if (err) {
        setError(friendlyAuthError(err.message));
        return;
      }
      setSentReason("confirm");
      setMode("sent");
      return;
    }

    if (mode === "magic") {
      setBusy("form");
      const { error: err } = await signInWithMagicLink(cleanEmail);
      setBusy(null);
      if (err) {
        setError(friendlyAuthError(err.message));
        return;
      }
      setSentReason("magic");
      setMode("sent");
      return;
    }

    if (mode === "forgot") {
      setBusy("form");
      const { error: err } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/login`,
      });
      setBusy(null);
      if (err) {
        setError(friendlyAuthError(err.message));
        return;
      }
      setSentReason("reset");
      setMode("sent");
      return;
    }

    if (mode === "recovery") {
      if (password.length < 8) {
        setError("Use at least 8 characters for your password.");
        return;
      }
      setBusy("form");
      const { error: err } = await supabase.auth.updateUser({ password });
      setBusy(null);
      if (err) {
        setError(friendlyAuthError(err.message));
        return;
      }
      navigate("/dashboard", { replace: true });
    }
  };

  const title: Record<Mode, string> = {
    signin: "Welcome back",
    signup: "Create your account",
    magic: "Sign in with a link",
    forgot: "Reset your password",
    sent: "Check your email",
    recovery: "Choose a new password",
  };

  const subtitle: Record<Mode, string> = {
    signin: "Sign in to your testimonials.",
    signup: "Free for your first 25 testimonials. No card needed.",
    magic: "We email you a link. Click it and you are in. No password.",
    forgot: "Enter your email and we will send a link to set a new password.",
    sent: "",
    recovery: "Use at least 8 characters.",
  };

  const showGoogle = mode === "signin" || mode === "signup";
  const showPasswordField = mode === "signin" || mode === "signup" || mode === "recovery";
  const showEmailField = mode !== "recovery" && mode !== "sent";

  const submitLabel: Record<Mode, string> = {
    signin: "Sign in",
    signup: "Create account",
    magic: "Email me a link",
    forgot: "Send reset link",
    sent: "",
    recovery: "Save new password",
  };

  const sentCopy = {
    confirm: `We sent a confirmation link to ${email.trim()}. Open it to finish creating your account.`,
    magic: `We sent a sign-in link to ${email.trim()}. Open it on this device.`,
    reset: `If an account exists for ${email.trim()}, a reset link is on its way.`,
  }[sentReason];

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <Link to="/" aria-label="Happy Client home" className="self-start">
          <Logo />
        </Link>

        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm animate-fade-in">
            {mode === "sent" ? (
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-gold-light">
                  <MailCheck className="h-6 w-6 text-gold-deep" />
                </div>
                <h1 className="display text-[2.25rem] text-foreground">{title.sent}</h1>
                <p className="mt-3 text-[0.9375rem] text-muted-foreground">{sentCopy}</p>
                <p className="mt-2 text-sm text-muted-foreground">It can take a minute. Look in spam if you do not see it.</p>
                <Button variant="outline" className="mt-8" onClick={() => switchMode("signin")}>
                  <ArrowLeft className="mr-1.5" /> Back to sign in
                </Button>
              </div>
            ) : (
              <>
                <h1 className="display text-[2.5rem] text-foreground">{title[mode]}</h1>
                <p className="mt-2 text-[0.9375rem] text-muted-foreground">{subtitle[mode]}</p>

                {showGoogle && (
                  <>
                    <Button type="button" variant="outline" size="lg" className="mt-8 w-full" onClick={handleGoogle} disabled={busy !== null}>
                      {busy === "google" ? <Loader2 className="mr-2 animate-spin" /> : <span className="mr-2"><GoogleIcon /></span>}
                      Continue with Google
                    </Button>
                    <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground" role="separator">
                      <span className="h-px flex-1 bg-border" />
                      or use your email
                      <span className="h-px flex-1 bg-border" />
                    </div>
                  </>
                )}

                <form onSubmit={handleSubmit} className={showGoogle ? "space-y-4" : "mt-8 space-y-4"}>
                  {mode === "signup" && (
                    <div>
                      <Label htmlFor="auth-name">Your name</Label>
                      <Input id="auth-name" className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={120} />
                    </div>
                  )}

                  {showEmailField && (
                    <div>
                      <Label htmlFor="auth-email">Email</Label>
                      <Input
                        id="auth-email"
                        type="email"
                        className="mt-1.5"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        inputMode="email"
                        required
                      />
                    </div>
                  )}

                  {showPasswordField && (
                    <div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auth-password">{mode === "recovery" ? "New password" : "Password"}</Label>
                        {mode === "signin" && (
                          <button type="button" className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" onClick={() => switchMode("forgot")}>
                            Forgot it?
                          </button>
                        )}
                      </div>
                      <div className="relative mt-1.5">
                        <Input
                          id="auth-password"
                          type={showPassword ? "text" : "password"}
                          className="pr-11"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          autoComplete={mode === "signin" ? "current-password" : "new-password"}
                          minLength={mode === "signin" ? undefined : 8}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          aria-pressed={showPassword}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {mode === "signup" && <p className="mt-1.5 text-xs text-muted-foreground">At least 8 characters.</p>}
                    </div>
                  )}

                  {error && (
                    <p role="alert" className="rounded-lg border border-destructive/25 bg-destructive-light px-3.5 py-2.5 text-sm text-destructive">
                      {error}
                    </p>
                  )}

                  <Button type="submit" size="lg" className="w-full" disabled={busy !== null}>
                    {busy === "form" ? <Loader2 className="mr-2 animate-spin" /> : mode === "magic" ? <Mail className="mr-2" /> : null}
                    {submitLabel[mode]}
                  </Button>

                  {mode === "signup" && (
                    <p className="text-center text-xs text-muted-foreground">
                      By creating an account you agree to the{" "}
                      <Link to="/terms" className="underline underline-offset-2 hover:text-foreground">Terms</Link> and{" "}
                      <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">Privacy Policy</Link>.
                    </p>
                  )}
                </form>

                <div className="mt-8 space-y-2 text-center text-sm text-muted-foreground">
                  {mode === "signin" && (
                    <>
                      <p>
                        <button type="button" className="font-medium text-foreground underline-offset-4 hover:underline" onClick={() => switchMode("magic")}>
                          Email me a sign-in link instead
                        </button>
                      </p>
                      <p>
                        New here?{" "}
                        <button type="button" className="font-medium text-foreground underline-offset-4 hover:underline" onClick={() => switchMode("signup")}>
                          Create an account
                        </button>
                      </p>
                    </>
                  )}
                  {mode === "signup" && (
                    <p>
                      Already have an account?{" "}
                      <button type="button" className="font-medium text-foreground underline-offset-4 hover:underline" onClick={() => switchMode("signin")}>
                        Sign in
                      </button>
                    </p>
                  )}
                  {(mode === "magic" || mode === "forgot") && (
                    <p>
                      <button type="button" className="font-medium text-foreground underline-offset-4 hover:underline" onClick={() => switchMode("signin")}>
                        Back to sign in
                      </button>
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-center lg:px-14">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_50%_at_80%_10%,hsl(var(--gold)/0.22),transparent_70%)]" />
        <div className="relative max-w-md">
          <p className="display text-[2.75rem] text-balance">
            The best sales page you have is <span className="italic text-gold">what your clients already say.</span>
          </p>
          <ul className="mt-10 space-y-4">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex gap-3 text-[0.9375rem] text-primary-foreground/80">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold text-foreground">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
