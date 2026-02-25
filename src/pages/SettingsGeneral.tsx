import { useState } from "react";
import { 
  Building2, 
  Palette, 
  Globe, 
  Bell,
  Save,
  Upload,
  Check,
  Eye
} from "lucide-react";
import { useDemoMode } from "@/contexts/DemoModeContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

const SettingsGeneral = () => {
  const { isDemoMode, toggleDemoMode } = useDemoMode();
  const [demoConfirmOpen, setDemoConfirmOpen] = useState(false);
  const [orgName, setOrgName] = useState("Acme Corp");
  const [urlSlug, setUrlSlug] = useState("acme-corp");
  const [industry, setIndustry] = useState("saas");
  const [primaryColor, setPrimaryColor] = useState("#F97316");
  const [language, setLanguage] = useState("en");
  const [videoLength, setVideoLength] = useState("120");
  const [autoApprove, setAutoApprove] = useState(false);
  const [notifications, setNotifications] = useState({
    newTestimonial: true,
    weeklyDigest: true,
    revenueAlerts: true,
  });

  const handleSave = () => {
    toast.success("Settings saved successfully! ✨");
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        {/* Organization */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Organization
            </CardTitle>
            <CardDescription>Basic information about your organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="urlSlug">URL Slug</Label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-muted-foreground">happyclient.io/</span>
                  <Input
                    id="urlSlug"
                    value={urlSlug}
                    onChange={(e) => setUrlSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                  />
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Logo</Label>
                <div className="mt-1 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold">
                    {orgName[0]}
                  </div>
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Logo
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saas">SaaS</SelectItem>
                    <SelectItem value="ecommerce">E-Commerce</SelectItem>
                    <SelectItem value="agency">Agency</SelectItem>
                    <SelectItem value="consulting">Consulting</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Branding
            </CardTitle>
            <CardDescription>Customize the look of your collection forms and widgets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex items-center gap-3 mt-1">
                  <input
                    type="color"
                    id="primaryColor"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-12 h-10 rounded-lg border border-border cursor-pointer"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label>Custom Domain</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input placeholder="testimonials.yourcompany.com" disabled />
                  <Button variant="outline" size="sm" disabled>
                    Pro
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Upgrade to Pro for custom domains</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Defaults */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Defaults
            </CardTitle>
            <CardDescription>Default settings for forms and testimonials</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="language">Default Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="videoLength">Max Video Length</Label>
                <Select value={videoLength} onValueChange={setVideoLength}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="60">1 minute</SelectItem>
                    <SelectItem value="120">2 minutes</SelectItem>
                    <SelectItem value="180">3 minutes</SelectItem>
                    <SelectItem value="300">5 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <Label>Auto-approve testimonials</Label>
                <p className="text-sm text-muted-foreground">Automatically approve 5-star testimonials</p>
              </div>
              <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>Configure when and how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'newTestimonial', label: 'New testimonial received', description: 'Get notified when someone submits a testimonial' },
              { key: 'weeklyDigest', label: 'Weekly digest', description: 'Summary of testimonials and revenue' },
              { key: 'revenueAlerts', label: 'Revenue alerts', description: 'Get notified when revenue milestones are hit' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2">
                <div>
                  <Label>{item.label}</Label>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <Switch
                  checked={notifications[item.key as keyof typeof notifications]}
                  onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, [item.key]: checked }))}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Demo Mode */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              Demo & Preview
            </CardTitle>
            <CardDescription>
              Show sample data to showcase the app without real client data.
              Perfect for demos, screenshots, and onboarding walkthroughs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <Label>Demo Mode</Label>
                <p className="text-sm text-muted-foreground">
                  {isDemoMode ? "Currently showing sample data" : "Currently showing live data"}
                </p>
              </div>
              <Switch
                checked={isDemoMode}
                onCheckedChange={() => {
                  if (isDemoMode) {
                    setDemoConfirmOpen(true);
                  } else {
                    toggleDemoMode();
                  }
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Demo data is stored locally and never sent to your database.
            </p>
          </CardContent>
        </Card>

        <AlertDialog open={demoConfirmOpen} onOpenChange={setDemoConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Switch to live data?</AlertDialogTitle>
              <AlertDialogDescription>
                Demo data will be hidden. Your real data will be shown.
                You can switch back to demo mode at any time.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Demo Mode</AlertDialogCancel>
              <AlertDialogAction onClick={() => { toggleDemoMode(); setDemoConfirmOpen(false); }}>
                Switch to Live Data
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </SettingsLayout>
  );
};

export default SettingsGeneral;
