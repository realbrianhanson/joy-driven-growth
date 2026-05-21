import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import type { FormSettings } from "./types";

interface Props {
  settings: FormSettings;
  setSettings: React.Dispatch<React.SetStateAction<FormSettings>>;
  slugTaken: boolean;
  checkingSlug: boolean;
  copySlug: () => void;
}

export function DesignTab({ settings, setSettings, slugTaken, checkingSlug, copySlug }: Props) {
  return (
    <div className="space-y-6">
      <Card className="rounded-xl">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Form basics</h3>
          <div className="space-y-3">
            <div>
              <Label className="text-sm">URL slug</Label>
              <div className="flex gap-2 mt-1">
                <span className="inline-flex items-center px-3 rounded-lg border border-border bg-muted text-xs text-muted-foreground">/collect/</span>
                <Input
                  value={settings.slug}
                  onChange={(e) => setSettings({ ...settings, slug: e.target.value.toLowerCase().replace(/\s/g, "-") })}
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={copySlug} title="Copy link">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              {checkingSlug && <p className="text-xs text-muted-foreground mt-1">Checking availability…</p>}
              {slugTaken && <p className="text-xs text-destructive mt-1">This URL is taken — try a different one.</p>}
            </div>
            <div className="flex items-center justify-between">
              <Label>Published</Label>
              <Switch checked={settings.status} onCheckedChange={(checked) => setSettings({ ...settings, status: checked })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Branding</h3>
          <div className="space-y-3">
            <div>
              <Label className="text-sm">Brand color</Label>
              <div className="flex gap-2 mt-1">
                <input
                  type="color"
                  value={settings.brandColor}
                  onChange={(e) => setSettings({ ...settings, brandColor: e.target.value })}
                  className="h-10 w-12 rounded-lg border border-border cursor-pointer"
                />
                <Input
                  value={settings.brandColor}
                  onChange={(e) => setSettings({ ...settings, brandColor: e.target.value })}
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm">Logo URL (optional)</Label>
              <Input
                value={settings.logo ?? ""}
                onChange={(e) => setSettings({ ...settings, logo: e.target.value || undefined })}
                placeholder="https://…"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-semibold text-foreground">What to collect</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Text testimonials</Label>
              <Switch checked={settings.collectText} onCheckedChange={(checked) => setSettings({ ...settings, collectText: checked })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Video testimonials</Label>
              <Switch checked={settings.collectVideo} onCheckedChange={(checked) => setSettings({ ...settings, collectVideo: checked })} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Audio testimonials</Label>
              <Switch checked={settings.collectAudio} onCheckedChange={(checked) => setSettings({ ...settings, collectAudio: checked })} />
            </div>
            {settings.collectVideo && (
              <div className="pt-2">
                <Label className="text-sm">Video max length: {settings.videoMaxLength}s</Label>
                <Slider value={[settings.videoMaxLength]} onValueChange={([value]) => setSettings({ ...settings, videoMaxLength: value })} min={15} max={120} step={15} className="mt-2" />
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div>
                <Label>Let them choose the format</Label>
                <p className="text-xs text-muted-foreground">Offer text/video/audio as options</p>
              </div>
              <Switch checked={settings.letThemChoose} onCheckedChange={(checked) => setSettings({ ...settings, letThemChoose: checked })} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}