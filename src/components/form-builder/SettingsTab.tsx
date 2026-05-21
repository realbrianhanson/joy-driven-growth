import { Copy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { FormSettings } from "./types";

interface Props {
  settings: FormSettings;
  setSettings: React.Dispatch<React.SetStateAction<FormSettings>>;
  slugUrl: string;
  aiUrl: string;
}

export function SettingsTab({ settings, setSettings, slugUrl, aiUrl }: Props) {
  const { toast } = useToast();
  return (
    <div className="space-y-6">
      <Card className={`rounded-xl ${settings.aiInterviewEnabled ? "border-primary" : ""}`}>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              AI Interview
              <Sparkles className="w-4 h-4 text-primary" />
            </h3>
            <Switch checked={settings.aiInterviewEnabled} onCheckedChange={(checked) => setSettings({ ...settings, aiInterviewEnabled: checked })} />
          </div>
          <p className="text-sm text-muted-foreground">
            Standard form = the customer fills out the questions themselves. AI Interview = a short, warm chat that interviews them and writes the testimonial.
          </p>
          {settings.aiInterviewEnabled && (
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                <p className="text-xs font-medium text-foreground">Share this link for the AI-guided experience</p>
                <div className="flex gap-2">
                  <Input readOnly value={aiUrl} className="flex-1 font-mono text-xs" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(aiUrl);
                      toast({ title: "AI Interview link copied" });
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Standard form link: <span className="font-mono">{slugUrl}</span>
                </p>
              </div>
              <div>
                <Label className="text-sm">Custom AI instructions</Label>
                <Textarea
                  value={settings.aiCustomPrompt}
                  onChange={(e) => setSettings({ ...settings, aiCustomPrompt: e.target.value })}
                  placeholder="What should the AI focus on? e.g. 'Ask about results they got in the first 30 days.'"
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Incentive</h3>
            <Switch checked={settings.incentiveEnabled} onCheckedChange={(checked) => setSettings({ ...settings, incentiveEnabled: checked })} />
          </div>
          {settings.incentiveEnabled && (
            <div className="space-y-3">
              <div>
                <Label className="text-sm">Type</Label>
                <select
                  className="w-full mt-1 p-2 rounded-lg border border-border bg-card text-sm"
                  value={settings.incentiveType}
                  onChange={(e) => setSettings({ ...settings, incentiveType: e.target.value as FormSettings["incentiveType"] })}
                >
                  <option value="discount">Discount Code</option>
                  <option value="giftcard">Gift Card</option>
                  <option value="download">Digital Download</option>
                </select>
              </div>
              <div>
                <Label className="text-sm">Value</Label>
                <Input value={settings.incentiveValue} onChange={(e) => setSettings({ ...settings, incentiveValue: e.target.value })} placeholder="e.g. 10%" className="mt-1" />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Permission &amp; consent</h3>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Ask for marketing permission</Label>
            <Switch
              checked={settings.consentEnabled}
              onCheckedChange={(checked) => setSettings({ ...settings, consentEnabled: checked })}
            />
          </div>
          {settings.consentEnabled && (
            <div>
              <Label className="text-sm">Consent text</Label>
              <Textarea
                value={settings.consentText}
                onChange={(e) => setSettings({ ...settings, consentText: e.target.value })}
                rows={5}
                className="mt-1 text-xs"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Shown as a required checkbox before submission. <code>{"{company}"}</code> is replaced with your company name.
              </p>
            </div>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <Label className="text-sm">Ask how they want their name shown</Label>
            <Switch
              checked={settings.nameDisplayEnabled}
              onCheckedChange={(checked) => setSettings({ ...settings, nameDisplayEnabled: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Review routing</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Send happy reviewers to public review sites, route unhappy ones to support.</p>
            </div>
            <Switch
              checked={settings.reviewRoutingEnabled}
              onCheckedChange={(checked) => setSettings({ ...settings, reviewRoutingEnabled: checked })}
            />
          </div>
          {settings.reviewRoutingEnabled && (
            <div className="space-y-3 pt-2 border-t border-border">
              <div>
                <Label className="text-sm">Happy if rating is ≥ {settings.positiveThreshold} stars</Label>
                <Slider
                  value={[settings.positiveThreshold]}
                  onValueChange={([value]) => setSettings({ ...settings, positiveThreshold: value })}
                  min={1}
                  max={5}
                  step={1}
                  className="mt-2"
                />
              </div>
              <div>
                <Label className="text-sm">Happy customers → send to</Label>
                <select
                  className="w-full mt-1 p-2 rounded-lg border border-border bg-card text-sm"
                  value={settings.positiveAction}
                  onChange={(e) => setSettings({ ...settings, positiveAction: e.target.value })}
                >
                  <option value="google">Google Reviews</option>
                  <option value="trustpilot">Trustpilot</option>
                  <option value="g2">G2</option>
                  <option value="capterra">Capterra</option>
                  <option value="none">Nothing — keep on form</option>
                </select>
              </div>
              <div>
                <Label className="text-sm">Unhappy customers → notify</Label>
                <Input
                  value={settings.negativeAction}
                  onChange={(e) => setSettings({ ...settings, negativeAction: e.target.value })}
                  placeholder="support@yourcompany.com"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">Email address to forward low-rating feedback to.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardContent className="p-5 space-y-3">
          <h3 className="font-semibold text-foreground">External reviews</h3>
          <div>
            <Label className="text-sm">Review platform</Label>
            <Select
              value={settings.reviewPlatform}
              onValueChange={(v) => setSettings({ ...settings, reviewPlatform: v as FormSettings["reviewPlatform"] })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (don't ask)</SelectItem>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="trustpilot">Trustpilot</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="g2">G2</SelectItem>
                <SelectItem value="capterra">Capterra</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {settings.reviewPlatform === "none" ? (
            <p className="text-xs text-muted-foreground">No external review prompt will be shown after submission.</p>
          ) : (
            <div>
              <Label className="text-sm">Review page URL</Label>
              <Input
                value={settings.reviewUrl}
                onChange={(e) => setSettings({ ...settings, reviewUrl: e.target.value })}
                placeholder={
                  settings.reviewPlatform === "google"
                    ? "ChIJ... or https://search.google.com/local/writereview?placeid=..."
                    : "https://..."
                }
                className="mt-1 font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground mt-2">
                {settings.reviewPlatform === "google" &&
                  <>Paste either your Google Place ID (it looks like <code>ChIJ...</code>) or your full Google review link.</>}
                {settings.reviewPlatform === "trustpilot" &&
                  <>Paste your Trustpilot review page URL (e.g. <code>trustpilot.com/review/yourdomain.com</code>).</>}
                {settings.reviewPlatform === "facebook" &&
                  <>Paste your Facebook Page reviews/recommendations URL.</>}
                {settings.reviewPlatform === "g2" &&
                  <>Paste your G2 product review URL.</>}
                {settings.reviewPlatform === "capterra" &&
                  <>Paste your Capterra product review URL.</>}
                {settings.reviewPlatform === "other" &&
                  <>Paste any URL where customers can leave a review.</>}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}