import { Mail, MessageCircle, DollarSign, Webhook, Zap, ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SettingsLayout from "@/components/settings/SettingsLayout";

const planned = [
  { icon: DollarSign, name: "Stripe", desc: "Attribute revenue to specific testimonials" },
  { icon: ShoppingBag, name: "Shopify", desc: "Track e-commerce conversions" },
  { icon: MessageCircle, name: "Slack", desc: "Get notified when new testimonials arrive" },
  { icon: Mail, name: "Twilio", desc: "Send testimonial requests over SMS" },
  { icon: Webhook, name: "Webhooks", desc: "Forward events to your own backend" },
  { icon: Zap, name: "Zapier", desc: "Connect Happy Client to 5,000+ apps" },
];

const SettingsIntegrations = () => {
  return (
    <SettingsLayout>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 mb-6 flex items-start gap-3">
        <span className="text-2xl">🚧</span>
        <div>
          <h3 className="font-semibold text-foreground">Integrations are coming soon</h3>
          <p className="text-sm text-muted-foreground mt-1">
            We're hardening these one at a time with real OAuth flows and webhook delivery. The list below is what's on deck.
          </p>
        </div>
      </div>

      <Card className="bg-card">
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {planned.map((p) => (
              <li key={p.name} className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center">
                  <p.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground flex items-center gap-2">
                    {p.name}
                    <Badge variant="secondary" className="text-xs">Coming soon</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{p.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground mt-6 text-center">
        Need a specific integration prioritized? Reply to your welcome email and tell us.
      </p>
    </SettingsLayout>
  );
};

export default SettingsIntegrations;
