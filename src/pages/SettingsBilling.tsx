import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ExternalLink, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import SettingsLayout from "@/components/settings/SettingsLayout";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/use-subscription";
import { useWorkspace } from "@/hooks/use-workspace";
import { PLANS, type PlanId } from "@/lib/billing-plans";
import { SALES_EMAIL } from "@/lib/config";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const PLAN_ORDER: PlanId[] = ["free", "starter", "pro", "scale"];

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  trialing: "Trial",
  past_due: "Payment problem",
  unpaid: "Payment problem",
  canceled: "Cancelled",
  incomplete: "Payment not finished",
};

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h2 className="eyebrow mb-4">{title}</h2>
      {children}
    </section>
  );
}

export default function SettingsBilling() {
  const { workspaceOwnerId, isTeamMember } = useWorkspace();
  const subscription = useSubscription();
  const [checkingOut, setCheckingOut] = useState<PlanId | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);

  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ["billing-usage", workspaceOwnerId],
    enabled: !!workspaceOwnerId,
    queryFn: async () => {
      const [testimonials, widgets, walls] = await Promise.all([
        supabase.from("testimonials").select("id", { count: "exact", head: true }).eq("user_id", workspaceOwnerId!),
        supabase.from("widgets").select("id", { count: "exact", head: true }).eq("user_id", workspaceOwnerId!),
        supabase.from("walls").select("id", { count: "exact", head: true }).eq("user_id", workspaceOwnerId!),
      ]);
      return { testimonials: testimonials.count ?? 0, widgets: widgets.count ?? 0, walls: walls.count ?? 0 };
    },
  });

  // Checkout works only after real Stripe price IDs replace the placeholders.
  const checkoutOpen = !!PLANS.starter.priceId && !PLANS.starter.priceId.startsWith("price_REPLACE_ME");
  const contactSales = () => toast.error(`Online checkout is not open yet. Email ${SALES_EMAIL} to upgrade.`);

  const startCheckout = async (planId: PlanId) => {
    const priceId = PLANS[planId].priceId;
    if (!checkoutOpen || !priceId) {
      contactSales();
      return;
    }
    setCheckingOut(planId);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", { body: { price_id: priceId } });
      if (error) throw error;
      const payload = data as { url?: string; error?: string } | null;
      if (payload?.url) {
        window.location.href = payload.url;
        return;
      }
      contactSales();
    } catch (err) {
      console.error("Checkout failed:", err);
      toast.error(`Checkout did not start. Try again, or email ${SALES_EMAIL}.`);
    } finally {
      setCheckingOut(null);
    }
  };

  const openPortal = async () => {
    setOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-customer-portal");
      if (error) throw error;
      const payload = data as { url?: string; error?: string } | null;
      if (payload?.url) {
        window.location.href = payload.url;
        return;
      }
      throw new Error(payload?.error ?? "no_url");
    } catch (err) {
      console.error("Billing portal failed:", err);
      toast.error(`The billing page did not open. Try again, or email ${SALES_EMAIL}.`);
    } finally {
      setOpeningPortal(false);
    }
  };

  if (isTeamMember) {
    return (
      <SettingsLayout>
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-5">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">The account owner manages billing</h2>
            <p className="mt-1 text-sm text-muted-foreground">Ask the person who invited you to change the plan or the payment method.</p>
          </div>
        </div>
      </SettingsLayout>
    );
  }

  const currentPlan = PLANS[subscription.plan] ?? PLANS.free;
  const statusLabel = STATUS_LABELS[subscription.status];
  const stats = [
    { label: "Testimonials", value: usage?.testimonials ?? 0 },
    { label: "Widgets", value: usage?.widgets ?? 0 },
    { label: "Walls", value: usage?.walls ?? 0 },
  ];

  return (
    <SettingsLayout>
      <div className="space-y-6">
        {!checkoutOpen && (
          <div className="flex items-start gap-3 rounded-2xl border border-gold/40 bg-gold-light/60 p-5">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-gold-deep" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">Online checkout is not open yet</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                To move to a paid plan now, email{" "}
                <a href={`mailto:${SALES_EMAIL}`} className="font-medium text-foreground underline underline-offset-4">
                  {SALES_EMAIL}
                </a>{" "}
                and we will set you up.
              </p>
            </div>
          </div>
        )}

        <Panel title="Your plan">
          {subscription.isLoading ? (
            <Skeleton className="h-14 w-64" />
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="display text-3xl text-foreground">{currentPlan.name}</span>
                  {statusLabel && (
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        subscription.isActive ? "bg-success-light text-success" : "bg-warning-light text-warning",
                      )}
                    >
                      {statusLabel}
                    </span>
                  )}
                </div>
                {subscription.currentPeriodEnd && (
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {subscription.cancelAtPeriodEnd ? "Ends" : "Renews"} on {formatDate(subscription.currentPeriodEnd)}
                  </p>
                )}
              </div>
              {subscription.hasStripeCustomer && (
                <Button variant="outline" onClick={openPortal} disabled={openingPortal}>
                  {openingPortal ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
                  Manage payment and invoices
                </Button>
              )}
            </div>
          )}
        </Panel>

        <Panel title="In this account">
          <dl className="grid grid-cols-3 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border bg-background/60 px-4 py-3">
                <dd className="display text-3xl tabular-nums text-foreground">
                  {usageLoading ? <Skeleton className="h-8 w-12" /> : stat.value.toLocaleString()}
                </dd>
                <dt className="mt-1 text-xs text-muted-foreground">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel title="Plans">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {PLAN_ORDER.map((id) => {
              const plan = PLANS[id];
              const isCurrent = subscription.plan === id && (id === "free" || subscription.isActive);
              return (
                <div
                  key={id}
                  className={cn(
                    "relative flex flex-col rounded-xl border p-5",
                    plan.popular ? "border-foreground" : "border-border",
                  )}
                >
                  {plan.popular && (
                    <span className="absolute -top-2.5 left-5 rounded-full bg-foreground px-2.5 py-0.5 text-[0.6875rem] font-semibold text-background">
                      Most chosen
                    </span>
                  )}
                  <p className="text-sm font-medium text-muted-foreground">{plan.name}</p>
                  <p className="mt-1 flex items-baseline gap-1">
                    <span className="display text-3xl text-foreground">{plan.price}</span>
                    <span className="text-xs text-muted-foreground">{plan.period}</span>
                  </p>
                  <ul className="mb-5 mt-4 flex-1 space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-foreground">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-deep" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Button variant="outline" disabled className="w-full">
                      Your plan
                    </Button>
                  ) : id === "free" ? (
                    <Button variant="outline" disabled className="w-full">
                      Free
                    </Button>
                  ) : id === "scale" ? (
                    <Button asChild variant="outline" className="w-full">
                      <a href={`mailto:${SALES_EMAIL}?subject=Scale%20plan`}>Talk to us</a>
                    </Button>
                  ) : !checkoutOpen ? (
                    <Button asChild className="w-full" variant={plan.popular ? "default" : "outline"}>
                      <a href={`mailto:${SALES_EMAIL}?subject=${encodeURIComponent(`Upgrade to ${plan.name}`)}`}>Email us to upgrade</a>
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => startCheckout(id)}
                      disabled={checkingOut === id}
                    >
                      {checkingOut === id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Upgrade
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </SettingsLayout>
  );
}
