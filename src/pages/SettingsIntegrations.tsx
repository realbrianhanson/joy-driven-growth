import { useState } from "react";
import { 
  DollarSign,
  MessageCircle,
  Download,
  Briefcase,
  MessageSquare,
  RefreshCw,
  Webhook,
  Check,
  ExternalLink,
  Unplug,
  Settings,
  Zap,
  Send,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import SettingsLayout from "@/components/settings/SettingsLayout";

interface Integration {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  lastSynced?: string;
  autoImport?: boolean;
}

const reviewPlatforms: Integration[] = [
  { id: 'google', name: 'Google Reviews', icon: '⭐', connected: true, lastSynced: '2 hours ago', autoImport: true },
  { id: 'g2', name: 'G2', icon: '📊', connected: true, lastSynced: '1 day ago', autoImport: true },
  { id: 'capterra', name: 'Capterra', icon: '💼', connected: false },
  { id: 'trustpilot', name: 'Trustpilot', icon: '✓', connected: false },
  { id: 'facebook', name: 'Facebook', icon: '📘', connected: false },
  { id: 'twitter', name: 'Twitter/X', icon: '🐦', connected: false },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', connected: false },
  { id: 'producthunt', name: 'Product Hunt', icon: '🚀', connected: true, lastSynced: '3 days ago', autoImport: false },
  { id: 'appstore', name: 'App Store', icon: '📱', connected: false },
  { id: 'playstore', name: 'Play Store', icon: '🤖', connected: false },
];

const crmPlatforms = [
  { id: 'hubspot', name: 'HubSpot', icon: '🟠', connected: false },
  { id: 'salesforce', name: 'Salesforce', icon: '☁️', connected: true },
  { id: 'pipedrive', name: 'Pipedrive', icon: '🔵', connected: false },
];

const SettingsIntegrations = () => {
  const [stripeConnected, setStripeConnected] = useState(true);
  const [shopifyConnected, setShopifyConnected] = useState(false);
  const [slackConnected, setSlackConnected] = useState(true);
  const [slackChannel, setSlackChannel] = useState("#testimonials");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("whsec_xxx...xxx");
  const [isTesting, setIsTesting] = useState(false);
  
  // Twilio
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioToken, setTwilioToken] = useState("");
  const [twilioPhone, setTwilioPhone] = useState("");

  const [slackNotifications, setSlackNotifications] = useState({
    newTestimonial: true,
    fiveStarOnly: false,
    revenueEvents: true,
    weeklyDigest: true,
  });

  const handleConnect = (platform: string) => {
    toast.success(`Connecting to ${platform}...`);
  };

  const handleDisconnect = (platform: string) => {
    toast.success(`Disconnected from ${platform}`);
  };

  const testWebhook = async () => {
    if (!webhookUrl) {
      toast.error("Please enter a webhook URL");
      return;
    }
    setIsTesting(true);
    await new Promise(r => setTimeout(r, 1500));
    setIsTesting(false);
    toast.success("Webhook test sent successfully! ✅");
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        {/* Revenue Tracking */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💰 Revenue Tracking
            </CardTitle>
            <CardDescription>Connect payment providers to track revenue attribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stripe */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#635BFF]/10 flex items-center justify-center text-2xl font-bold text-[#635BFF]">
                  S
                </div>
                <div>
                  <div className="font-medium text-foreground flex items-center gap-2">
                    Stripe
                    {stripeConnected && <Badge className="bg-emerald text-white text-xs">Connected ✅</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">Track conversions and revenue</p>
                </div>
              </div>
              {stripeConnected ? (
                <Button variant="outline" size="sm" onClick={() => setStripeConnected(false)}>
                  <Unplug className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              ) : (
                <Button onClick={() => setStripeConnected(true)} className="gradient-sunny text-white">
                  Connect
                </Button>
              )}
            </div>

            {/* Shopify */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#95BF47]/10 flex items-center justify-center text-2xl">
                  🛒
                </div>
                <div>
                  <div className="font-medium text-foreground flex items-center gap-2">
                    Shopify
                    {shopifyConnected && <Badge className="bg-emerald text-white text-xs">Connected ✅</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">Track e-commerce purchases</p>
                </div>
              </div>
              <Button variant="outline" onClick={() => setShopifyConnected(!shopifyConnected)}>
                {shopifyConnected ? 'Disconnect' : 'Connect'}
              </Button>
            </div>

            {/* WooCommerce */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#96588A]/10 flex items-center justify-center text-2xl">
                  🔮
                </div>
                <div>
                  <div className="font-medium text-foreground">WooCommerce</div>
                  <p className="text-sm text-muted-foreground">Install plugin for WordPress</p>
                </div>
              </div>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Get Plugin
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* SMS */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📱 SMS
            </CardTitle>
            <CardDescription>Configure SMS for testimonial requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border border-border">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-[#F22F46]/10 flex items-center justify-center text-2xl">
                  📞
                </div>
                <div>
                  <div className="font-medium text-foreground">Twilio</div>
                  <p className="text-sm text-muted-foreground">100 SMS/mo on Pro • Buy more credits</p>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Account SID</Label>
                  <Input 
                    value={twilioSid} 
                    onChange={(e) => setTwilioSid(e.target.value)}
                    placeholder="ACxxxxxxxxxxxxxxxx"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Auth Token</Label>
                  <Input 
                    type="password"
                    value={twilioToken} 
                    onChange={(e) => setTwilioToken(e.target.value)}
                    placeholder="••••••••••••"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input 
                    value={twilioPhone} 
                    onChange={(e) => setTwilioPhone(e.target.value)}
                    placeholder="+1234567890"
                    className="mt-1"
                  />
                </div>
              </div>
              <Button className="mt-4" variant="outline">
                Save Twilio Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Import Reviews */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📥 Import Reviews
            </CardTitle>
            <CardDescription>Connect platforms to import existing reviews</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {reviewPlatforms.map((platform) => (
                <div
                  key={platform.id}
                  className={`p-4 rounded-lg border text-center transition-all cursor-pointer ${
                    platform.connected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="text-2xl mb-2">{platform.icon}</div>
                  <div className="text-sm font-medium text-foreground mb-1">{platform.name}</div>
                  {platform.connected ? (
                    <div className="space-y-1">
                      <Badge className="bg-emerald/10 text-emerald text-[10px]">Connected</Badge>
                      {platform.lastSynced && (
                        <p className="text-[10px] text-muted-foreground">Synced {platform.lastSynced}</p>
                      )}
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm" className="text-xs h-7 px-2">
                      Connect
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* CRM */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💼 CRM
            </CardTitle>
            <CardDescription>Sync testimonials with your CRM</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {crmPlatforms.map((platform) => (
                <div
                  key={platform.id}
                  className={`p-4 rounded-lg border ${
                    platform.connected ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{platform.icon}</span>
                    <div>
                      <div className="font-medium text-foreground">{platform.name}</div>
                      {platform.connected && (
                        <Badge className="bg-emerald/10 text-emerald text-xs">Connected</Badge>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant={platform.connected ? "outline" : "default"}
                    size="sm"
                    className={platform.connected ? "" : "gradient-sunny text-white"}
                    onClick={() => platform.connected ? handleDisconnect(platform.name) : handleConnect(platform.name)}
                  >
                    {platform.connected ? 'Manage' : 'Connect'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team Chat */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              💬 Team Chat
            </CardTitle>
            <CardDescription>Get notifications in your team chat</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Slack */}
            <div className="p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#4A154B]/10 flex items-center justify-center text-2xl">
                    💬
                  </div>
                  <div>
                    <div className="font-medium text-foreground flex items-center gap-2">
                      Slack
                      {slackConnected && <Badge className="bg-emerald text-white text-xs">Connected ✅</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">Get notified in Slack</p>
                  </div>
                </div>
                <Button 
                  variant={slackConnected ? "outline" : "default"}
                  onClick={() => setSlackConnected(!slackConnected)}
                >
                  {slackConnected ? 'Disconnect' : 'Connect Workspace'}
                </Button>
              </div>

              {slackConnected && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div>
                    <Label>Notification Channel</Label>
                    <Select value={slackChannel} onValueChange={setSlackChannel}>
                      <SelectTrigger className="mt-1 w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="#testimonials">#testimonials</SelectItem>
                        <SelectItem value="#marketing">#marketing</SelectItem>
                        <SelectItem value="#general">#general</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label>Notifications</Label>
                    {[
                      { key: 'newTestimonial', label: 'New testimonial received' },
                      { key: 'fiveStarOnly', label: '5-star reviews only' },
                      { key: 'revenueEvents', label: 'Revenue attribution events' },
                      { key: 'weeklyDigest', label: 'Weekly digest' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between">
                        <span className="text-sm text-foreground">{item.label}</span>
                        <Switch
                          checked={slackNotifications[item.key as keyof typeof slackNotifications]}
                          onCheckedChange={(checked) => setSlackNotifications(prev => ({ ...prev, [item.key]: checked }))}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Automation */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔄 Automation
            </CardTitle>
            <CardDescription>Connect to automation platforms</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Zapier */}
            <div className="p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#FF4A00]/10 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-[#FF4A00]" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">Zapier</div>
                    <p className="text-sm text-muted-foreground">5 active Zaps</p>
                  </div>
                </div>
                <Button variant="outline">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Zaps
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">📋 Zap Templates</Button>
                <Button variant="outline" size="sm">🔑 Get API Key</Button>
              </div>
            </div>

            {/* Webhooks */}
            <div className="p-4 rounded-lg border border-border">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                  <Webhook className="w-6 h-6 text-foreground" />
                </div>
                <div>
                  <div className="font-medium text-foreground">Webhooks</div>
                  <p className="text-sm text-muted-foreground">Send events to your server</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Endpoint URL</Label>
                  <Input 
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    placeholder="https://your-server.com/webhook"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Secret Key</Label>
                  <Input 
                    value={webhookSecret}
                    readOnly
                    className="mt-1 font-mono"
                  />
                </div>
                <div>
                  <Label>Events</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['testimonial.created', 'testimonial.approved', 'revenue.attributed'].map((event) => (
                      <Badge key={event} variant="secondary" className="font-mono text-xs">
                        {event}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button variant="outline" onClick={testWebhook} disabled={isTesting}>
                  {isTesting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Test Webhook
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
};

export default SettingsIntegrations;
