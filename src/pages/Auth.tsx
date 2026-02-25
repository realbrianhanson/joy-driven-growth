import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, signInWithMagicLink, user } = useAuth();
  const { toast } = useToast();

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isMagicLinkLoading, setIsMagicLinkLoading] = useState(false);
  const [magicLinkMode, setMagicLinkMode] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  if (user) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);
    const { error } = await signIn(signInEmail, signInPassword);
    setIsSigningIn(false);
    if (error) {
      toast({ title: "Unable to sign in", description: error.message, variant: "destructive" });
    } else {
      navigate("/dashboard");
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningUp(true);
    const { error } = await signUp(signUpEmail, signUpPassword, signUpName);
    setIsSigningUp(false);
    if (error) {
      toast({ title: "Unable to create account", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Check your email", description: "We sent you a confirmation link to verify your account." });
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsMagicLinkLoading(true);
    const { error } = await signInWithMagicLink(signInEmail);
    setIsMagicLinkLoading(false);
    if (error) {
      toast({ title: "Unable to send link", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Magic link sent", description: "Check your inbox for the login link." });
    }
  };

  const handleGoogle = async () => {
    setIsGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result?.error) {
      toast({ title: "Unable to sign in", description: String(result.error), variant: "destructive" });
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Happy<span className="text-primary">Client</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">Turn testimonials into revenue</p>
        </div>

        <Card>
          <Tabs defaultValue="signin">
            <CardHeader className="pb-4">
              <TabsList className="w-full">
                <TabsTrigger value="signin" className="flex-1">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="flex-1">Sign Up</TabsTrigger>
              </TabsList>
            </CardHeader>

            {/* SIGN IN */}
            <TabsContent value="signin">
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogle}
                  disabled={isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                  )}
                  Continue with Google
                </Button>

                <div className="relative">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                    or
                  </span>
                </div>

                {magicLinkMode ? (
                  <form onSubmit={handleMagicLink} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="magic-email">Email</Label>
                      <Input
                        id="magic-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isMagicLinkLoading}>
                      {isMagicLinkLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                      Send Magic Link
                    </Button>
                    <button
                      type="button"
                      className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setMagicLinkMode(false)}
                    >
                      Use password instead
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isSigningIn}>
                      {isSigningIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Sign In
                    </Button>
                    <button
                      type="button"
                      className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setMagicLinkMode(true)}
                    >
                      Email me a link instead
                    </button>
                  </form>
                )}
              </CardContent>
            </TabsContent>

            {/* SIGN UP */}
            <TabsContent value="signup">
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      placeholder="Jane Smith"
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="••••••••"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSigningUp}>
                    {isSigningUp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Account
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
