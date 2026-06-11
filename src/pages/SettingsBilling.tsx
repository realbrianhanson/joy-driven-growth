import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Check, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/hooks/use-subscription";
import { useWorkspace } from "@/hooks/use-workspace";
import SettingsLayout from "@/components/settings/SettingsLayout";
import { supabase } from "@/integrations/supabase/client";
import { PLANS } from "@/lib/billing-plans";
import { SALES_EMAIL } from "@/lib/config";

const SettingsBilling = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { workspaceOwnerId } = useWorkspace();
  const subscription = useSubscription();
  const [checkingOut, setCheckingOut] = useState<string | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ["billing-usage", workspaceOwnerId],
    enabled: !!workspaceOwnerId,
    queryFn: async () => {
      const [t, w] = await Promise.all([
        supabase.from("testimonials").select("id", { count: "exact", head: true }).eq("user_id", workspaceOwnerId!),
        supabase.from("widgets").select("id", { count: "exact", head: true }).eq("user_id", workspaceOwnerId!),
      ]);
      return { testimonials: t.count ?? 0, widgets: w.count ?? 0 };
    },
  });

  const startCheckout = async (priceId: string | null, planName: string) => {
    if (!priceId || priceId.startsWith("price_REPLACE_ME")) {
      toast({
        title: "Upgrades aren't available yet",
        description: `Email ${SALES_EMAIL} and we'll get you set up.`,
        variant: "destructive",
      });
      return;
    }
    setCheckingOut(planName);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { price_id: priceId },
      });
      if (error) throw error;
      const payload = data as { url?: string; error?: string };
      if (payload?.error) {
        toast({
          title: "Upgrades aren't available yet",
          description: `Email ${SALES_EMAIL} and we'll help you upgrade.`,
          variant: "destructive",
        });
        return;
      }
      if (payload?.url) window.location.href = payload.url;
    } catch (err) {
      toast({ title: "Couldn't start checkout", description: err instanceof Error ? err.message : "", variant: "destructive" });
    } finally {
      setCheckingOut(null);
    }
  };

  const openPortal = async () => {
    setOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-customer-portal");
      if (error) throw error;
      const payload = data as { url?: string; error?: string };
      if (payload?.error) {
        toast({ title: "Couldn't open portal", description: payload.error, variant: "destructive" });
        return;
      }
      if (payload?.url) window.location.href = payload.url;
    } catch (err) {
      toast({ title: "Couldn't open portal", description: err instanceof Error ? err.message : "", variant: "destructive" });
    } finally {
      setOpeningPortal(false);
    }
  };

  const currentPlan = PLANS[subscription.plan] ?? PLANS.free;
  const renewal = subscription.currentPeriodEnd
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
    : null;

  const upgradesEnabled = !!(PLANS.starter.priceId && !PLANS.starter.priceId.startsWith("price_REPLACE_ME"));

  return (
    <SettingsLayout>
      {!upgradesEnabled && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-foreground">Upgrades aren't available yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Self-serve checkout is coming soon. Want to upgrade now? Email{" "}
              <a href={`mailto:${SALES_EMAIL}`} className="text-primary underline">{SALES_EMAIL}</a> and we'll get you set up.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Current plan</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-2xl font-bold text-foreground">{currentPlan.name}</span>
                  <Badge variant={subscription.isActive ? "default" : "secondary"}>{subscription.status}</Badge>
                  {subscription.cancelAtPeriodEnd && <Badge variant="destructive">Cancels at period end</Badge>}
                </div>
                {renewal && (
                  <p className="text-sm text-muted-foreground">
                    {subscription.cancelAtPeriodEnd ? "Ends" : "Renews"} on {renewal}
                  </p>
                )}
              </div>
              {subscription.hasStripeCustomer && (
                <Button variant="outline" onClick={openPortal} disabled={openingPortal}>
                  {openingPortal ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ExternalLink className="w-4 h-4 mr-2" />}
                  Manage subscription
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Usage</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-4">Lifetime totals for this workspace.</p>
            {usageLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <div className="space-y-4">
                {[
                  { label: "Testimonials", value: usage?.testimonials ?? 0, limit: subscription.plan === "free" ? 25 : null },
                  { label: "Widgets", value: usage?.widgets ?? 0, limit: subscription.plan === "free" ? 1 : 5 },
                ].map((u) => (
                  <div key={u.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground">{u.label}</span>
                      <span className="text-muted-foreground">{u.value}{u.limit != null && ` / ${u.limit}`}</span>
                    </div>
                    {u.limit != null && <Progress value={Math.min(100, (u.value / u.limit) * 100)} />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Available plans</CardTitle></CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(["free", "starter", "pro", "scale"] as const).map((id) => {
                const plan = PLANS[id];
                const isCurrent = subscription.plan === id && subscription.isActive;
                return (
                  <div key={id} className={`relative rounded-xl border p-5 ${plan.popular ? "border-primary ring-2 ring-primary/20" : "border-border"}`}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                        Most popular
                      </div>
                    )}
                    <div className="mb-1 text-sm font-medium text-muted-foreground">{plan.name}</div>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-2xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-xs text-muted-foreground">{plan.period}</span>
                    </div>
                    <ul className="space-y-1.5 mb-5">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-1.5 text-xs text-foreground">
                          <Check className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    {isCurrent ? (
                      <Button variant="outline" disabled className="w-full">Current plan</Button>
                    ) : id === "free" ? (
                      <Button variant="outline" disabled className="w-full">Free forever</Button>
                    ) : id === "scale" ? (
                      <Button asChild variant="outline" className="w-full">
                        <a href={`mailto:${SALES_EMAIL}?subject=Scale%20plan%20inquiry`}>Contact sales</a>
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        variant={plan.popular ? "default" : "outline"}
                        onClick={() => startCheckout(plan.priceId, plan.name)}
                        disabled={checkingOut === plan.name}
                      >
                        {checkingOut === plan.name ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                        Upgrade
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
};

export default SettingsBilling;