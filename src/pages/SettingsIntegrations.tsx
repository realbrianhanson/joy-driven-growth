import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, MessageCircle, DollarSign, Webhook, Zap, ShoppingBag, Copy, Check, Key } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SettingsLayout from "@/components/settings/SettingsLayout";
import { toast } from "sonner";

const planned = [
  { icon: ShoppingBag, name: "Shopify", desc: "Track e-commerce conversions" },
  { icon: MessageCircle, name: "Slack", desc: "Get notified when new testimonials arrive" },
  { icon: Mail, name: "Twilio", desc: "Send testimonial requests over SMS" },
  { icon: Webhook, name: "Webhooks", desc: "Forward events to your own backend" },
  { icon: Zap, name: "Zapier", desc: "Connect Happy Client to 5,000+ apps" },
];

const STRIPE_WEBHOOK_URL = "https://ldniwvyjycerpdlwhntu.supabase.co/functions/v1/stripe-webhook";

const SettingsIntegrations = () => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(STRIPE_WEBHOOK_URL);
    setCopied(true);
    toast.success("Webhook URL copied");
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <SettingsLayout>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary" /> Revenue tracking <Badge className="ml-1">Available</Badge>
          </CardTitle>
          <CardDescription>
            Attribute revenue to specific testimonials and widgets by sending Stripe checkout events to our webhook.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="text-sm text-foreground/80 space-y-2 list-decimal pl-4">
            <li>In Stripe, add a webhook endpoint pointing at the URL below.</li>
            <li>Subscribe it to <code className="text-xs bg-muted px-1.5 py-0.5 rounded">checkout.session.completed</code> and <code className="text-xs bg-muted px-1.5 py-0.5 rounded">payment_intent.succeeded</code>.</li>
            <li>On every checkout, include <code className="text-xs bg-muted px-1.5 py-0.5 rounded">metadata.testimonial_id</code> and/or <code className="text-xs bg-muted px-1.5 py-0.5 rounded">metadata.widget_id</code>, plus <code className="text-xs bg-muted px-1.5 py-0.5 rounded">metadata.user_id</code>.</li>
          </ol>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-3">
            <code className="text-xs font-mono text-foreground flex-1 break-all">{STRIPE_WEBHOOK_URL}</code>
            <Button size="sm" variant="outline" onClick={copy}>
              {copied ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-4 h-4 text-primary" /> API submissions <Badge className="ml-1">Available</Badge>
          </CardTitle>
          <CardDescription>
            Submit testimonials programmatically. Create and manage keys in{" "}
            <Link to="/dashboard/settings/api" className="text-primary underline">Settings &rarr; API</Link>.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-5 mb-6">
        <h3 className="text-sm font-medium text-foreground">More integrations are on the way</h3>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          Live today: Stripe revenue webhook, REST API submissions, and SMS campaigns via Twilio. The list below is what's on deck.
        </p>
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
