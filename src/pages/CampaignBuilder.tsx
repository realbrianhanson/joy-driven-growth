import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Users, MessageSquare, Calendar, Send, Check, Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useForms } from "@/hooks/use-forms";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspace } from "@/hooks/use-workspace";
import { supabase } from "@/integrations/supabase/client";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const steps = [
  { id: 1, title: "Setup", icon: Check },
  { id: 2, title: "Message", icon: MessageSquare },
  { id: 3, title: "Recipients", icon: Users },
  { id: 4, title: "Schedule", icon: Calendar },
];

const SMS_CHAR_LIMIT = 160;
const SMS_HARD_LIMIT = 320;

function parseRecipients(text: string): { phone: string; first_name: string }[] {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[,\t]/).map((s) => s.trim());
      const phone = parts[0];
      const first_name = parts[1] ?? "";
      return { phone, first_name };
    })
    .filter(({ phone }) => /^\+[1-9]\d{1,14}$/.test(phone));
}

export default function CampaignBuilder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { workspaceOwnerId } = useWorkspace();
  const { data: forms, isLoading: formsLoading } = useForms();
  const { isDemoMode } = useDemoMode();
  const [demoBlockOpen, setDemoBlockOpen] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 - Setup
  const [campaignName, setCampaignName] = useState("");
  const [selectedFormId, setSelectedFormId] = useState("");

  // Step 2 - Message
  const [message, setMessage] = useState(
    "Hey {first_name}! 👋 Quick favor - would you share your experience with us? Takes 60 sec: {form_link} Reply STOP to opt out."
  );

  // Step 3 - Recipients
  const [recipientsText, setRecipientsText] = useState("");

  // Step 4 - Schedule
  const [timing, setTiming] = useState<"now" | "scheduled">("now");
  const [scheduledDate, setScheduledDate] = useState("");

  // Sending state
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const validRecipients = parseRecipients(recipientsText);
  const selectedForm = forms?.find((f) => f.id === selectedFormId);
  const formLink = selectedForm
    ? `${window.location.origin}/collect/${selectedForm.slug}`
    : "{form_link}";

  const previewMessage = message
    .replace(/\{first_name\}/g, "Sarah")
    .replace(/\{form_link\}/g, formLink);

  const insertVariable = (v: string) => {
    setMessage((prev) => prev + v);
  };

  const estimatedLength = useMemo(() => previewMessage.length, [previewMessage]);
  const overHardLimit = estimatedLength > SMS_HARD_LIMIT;

  const isStepValid = (step: number) => {
    switch (step) {
      case 1: return campaignName.trim().length > 0 && selectedFormId.length > 0;
      case 2: return message.trim().length > 0 && !overHardLimit;
      case 3: return validRecipients.length > 0;
      case 4: return timing === "now" || (timing === "scheduled" && scheduledDate.length > 0);
      default: return true;
    }
  };
  const canProceed = () => isStepValid(currentStep);
  const canJumpTo = (target: number) => {
    if (target <= currentStep) return true;
    for (let s = 1; s < target; s++) if (!isStepValid(s)) return false;
    return true;
  };
  const allValid = isStepValid(1) && isStepValid(2) && isStepValid(3) && isStepValid(4);

  const saveCampaign = async (status: "draft" | "active" | "scheduled") => {
    if (!workspaceOwnerId) return null;
    const { data, error } = await supabase
      .from("campaigns")
      .insert({
        user_id: workspaceOwnerId,
        name: campaignName,
        form_id: selectedFormId || null,
        type: "sms" as const,
        status,
        message_template: message,
        recipients: validRecipients,
        total_recipients: validRecipients.length,
        scheduled_at: timing === "scheduled" && scheduledDate ? new Date(scheduledDate).toISOString() : null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  const handleSaveDraft = async () => {
    if (isDemoMode) { setDemoBlockOpen(true); return; }
    if (!workspaceOwnerId) {
      toast({ title: "Workspace not ready", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      await saveCampaign("draft");
      toast({ title: "Campaign saved as draft" });
      navigate("/dashboard/campaigns");
    } catch (e: any) {
      toast({ title: "Failed to save", description: e.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSend = async () => {
    if (isDemoMode) { setDemoBlockOpen(true); return; }
    if (!workspaceOwnerId) {
      toast({ title: "Workspace not ready", variant: "destructive" });
      return;
    }
    if (!allValid || overHardLimit) {
      toast({ title: "Complete every step and trim message under 320 chars.", variant: "destructive" });
      return;
    }
    setIsSending(true);
    try {
      const isScheduled = timing === "scheduled" && !!scheduledDate;
      const campaignStatus: "scheduled" | "active" = isScheduled ? "scheduled" : "active";
      const campaign = await saveCampaign(campaignStatus);
      if (!campaign) throw new Error("Failed to create campaign");

      const jobs = validRecipients.map((r) => ({
        campaign_id: campaign.id,
        user_id: workspaceOwnerId,
        phone: r.phone,
        first_name: r.first_name || null,
        message: message
          .replace(/\{first_name\}/g, r.first_name || "there")
          .replace(/\{form_link\}/g, formLink),
      }));

      if (jobs.length > 0) {
        const { error: jobsError } = await (supabase as any).from("campaign_jobs").insert(jobs);
        if (jobsError) throw jobsError;
      }

      toast({
        title: isScheduled ? "Campaign scheduled" : "Campaign queued — sending shortly",
        description: isScheduled
          ? `Will send to ${jobs.length} recipients on ${new Date(scheduledDate).toLocaleString()}.`
          : `Queued ${jobs.length} messages. Delivery completes within a minute.`,
      });
      navigate("/dashboard/campaigns");
    } catch (e: any) {
      toast({ title: "Failed to queue campaign", description: e.message, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground" onClick={() => navigate("/dashboard/campaigns")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Campaigns
            </Button>
            <span className="text-border" aria-hidden>/</span>
            <h1 className="text-[15px] font-semibold text-foreground truncate">New SMS Campaign</h1>
          </div>
          <Button variant="outline" size="sm" className="h-8" onClick={handleSaveDraft} disabled={isSaving || !campaignName.trim()}>
            {isSaving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
            Save Draft
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => {
                  if (canJumpTo(step.id)) setCurrentStep(step.id);
                  else toast({ title: "Complete the current step first." });
                }}
                disabled={!canJumpTo(step.id)}
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                  currentStep >= step.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                } ${!canJumpTo(step.id) ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <step.icon className="w-5 h-5" />
              </button>
              <span className={`ml-2 text-sm font-medium hidden sm:block ${
                currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
              }`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-12 lg:w-24 h-0.5 mx-2 ${
                  currentStep > step.id ? "bg-primary" : "bg-muted"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Sending overlay */}
        {isSending && (
          <div className="fixed inset-0 z-50 bg-background/80 flex items-center justify-center">
            <Card className="w-full max-w-sm">
              <CardContent className="p-8 text-center space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                <h3 className="text-lg font-semibold text-foreground">Queueing campaign…</h3>
                <p className="text-sm text-muted-foreground">This only takes a moment.</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="bg-card border border-border rounded-2xl">
          <CardContent className="p-8">
            {/* Step 1: Setup */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Campaign Setup</h2>
                  <p className="text-muted-foreground">Name your campaign and select a form</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Campaign Name</Label>
                    <Input
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      placeholder="e.g. Q1 Customer Check-in"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Linked Form</Label>
                    <p className="text-sm text-muted-foreground mb-2">Which form should recipients complete?</p>
                    <div className="space-y-2">
                      {formsLoading && [1,2].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                      {!formsLoading && (forms ?? []).map((form) => (
                        <Card
                          key={form.id}
                          onClick={() => setSelectedFormId(form.id)}
                          className={`cursor-pointer transition-all ${
                            selectedFormId === form.id
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-border hover:border-border"
                          }`}
                        >
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <div className="font-medium text-foreground">{form.name}</div>
                              <div className="text-sm text-muted-foreground">{form.submission_count ?? 0} responses</div>
                            </div>
                            {selectedFormId === form.id && (
                              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                <Check className="w-4 h-4 text-primary-foreground" />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                      {!formsLoading && (forms ?? []).length === 0 && (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          No forms yet.{" "}
                          <button className="text-primary underline" onClick={() => navigate("/dashboard/forms/new/edit")}>
                            Create one first
                          </button>
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Campaign Type</Label>
                    <div className="flex gap-3 mt-1">
                      <Badge className="bg-primary text-primary-foreground">SMS</Badge>
                      <Badge variant="outline" className="text-muted-foreground opacity-60">Email <span className="text-xs ml-1">SMS only for now</span></Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Message */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Craft your message</h2>
                  <p className="text-muted-foreground">Write your SMS with a {SMS_CHAR_LIMIT} character limit</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Message</Label>
                    <span className={`text-sm tabular-nums ${overHardLimit ? "text-destructive font-medium" : estimatedLength > SMS_CHAR_LIMIT ? "text-warning font-medium" : "text-muted-foreground"}`}>
                      {estimatedLength}/{SMS_HARD_LIMIT}{selectedForm ? "" : " (pick a form for accurate count)"}
                    </span>
                  </div>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    maxLength={500}
                    className="resize-none"
                  />
                  {overHardLimit && (
                    <p className="text-xs text-destructive mt-2">Expands past {SMS_HARD_LIMIT} chars with the link. Shorten before sending.</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={() => insertVariable("{first_name}")}>
                      + {"{first_name}"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => insertVariable("{form_link}")}>
                      + {"{form_link}"}
                    </Button>
                  </div>
                </div>

                {/* Phone preview */}
                <div className="flex justify-center">
                  <div className="w-64 rounded-3xl p-4 border-4 border-border bg-muted/30">
                    <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                      <Smartphone className="w-3 h-3" />
                      SMS Preview
                    </div>
                    <div className="bg-card rounded-2xl p-4 shadow-sm border">
                      <p className="text-sm text-foreground whitespace-pre-wrap break-words">{previewMessage}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Recipients */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Add recipients</h2>
                  <p className="text-muted-foreground">One per line. Optionally add a first name after a comma.</p>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">⚠️</span>
                    <div className="text-xs text-foreground">
                      <p className="font-semibold mb-1">SMS compliance — you are responsible</p>
                      <p className="text-muted-foreground">
                        Only send to recipients who have given you explicit prior consent to receive SMS from your business. Include "Reply STOP to unsubscribe" in your message template when sending to US numbers. You're also responsible for 10DLC registration with carriers — Happy Client does not handle this for you.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Recipients</Label>
                  <Textarea
                    value={recipientsText}
                    onChange={(e) => setRecipientsText(e.target.value)}
                    rows={8}
                    placeholder={"+1234567890, Jane\n+1987654321, Bob\n+1555000111"}
                    className="mt-1 font-mono text-sm resize-none"
                  />
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span className="text-muted-foreground">E.164 format (e.g. +14155551234)</span>
                    <Badge variant={validRecipients.length > 0 ? "default" : "secondary"}>
                      {validRecipients.length} valid recipient{validRecipients.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Schedule */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">When should we send?</h2>
                  <p className="text-muted-foreground">Choose when to deliver your campaign</p>
                </div>

                <RadioGroup value={timing} onValueChange={(v) => setTiming(v as "now" | "scheduled")}>
                  <div className="space-y-3">
                    <Card className={`cursor-pointer ${timing === "now" ? "border-primary" : "border-border"}`}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <RadioGroupItem value="now" id="now" />
                        <Label htmlFor="now" className="flex-1 cursor-pointer">
                          <div className="font-medium">Send now</div>
                          <div className="text-sm text-muted-foreground">Queues immediately; typically delivered within a minute.</div>
                        </Label>
                      </CardContent>
                    </Card>
                    <Card className={`cursor-pointer ${timing === "scheduled" ? "border-primary" : "border-border"}`}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <RadioGroupItem value="scheduled" id="scheduled" />
                        <Label htmlFor="scheduled" className="flex-1 cursor-pointer">
                          <div className="font-medium">Schedule for later</div>
                          <div className="text-sm text-muted-foreground">Pick a specific date and time.</div>
                        </Label>
                        {timing === "scheduled" && (
                          <Input
                            type="datetime-local"
                            value={scheduledDate}
                            onChange={(e) => setScheduledDate(e.target.value)}
                            className="w-auto"
                          />
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </RadioGroup>

                {/* Review summary */}
                <div className="mt-6 space-y-3">
                  <h3 className="font-semibold text-foreground">Review</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between p-3 bg-muted/50 rounded-xl text-sm">
                      <span className="text-muted-foreground">Campaign</span>
                      <span className="font-medium text-foreground">{campaignName}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-muted/50 rounded-xl text-sm">
                      <span className="text-muted-foreground">Form</span>
                      <span className="font-medium text-foreground">{selectedForm?.name ?? "—"}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-muted/50 rounded-xl text-sm">
                      <span className="text-muted-foreground">Recipients</span>
                      <span className="font-medium text-foreground">{validRecipients.length} contacts</span>
                    </div>
                    <div className="flex justify-between p-3 bg-warning/10 rounded-xl text-sm">
                      <span className="font-medium text-foreground">SMS Credits</span>
                      <span className="font-bold text-foreground">{validRecipients.length} credits</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <Button
                variant="ghost"
                onClick={() => setCurrentStep((s) => s - 1)}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>

              {currentStep < 4 ? (
                <Button onClick={() => setCurrentStep((s) => s + 1)} disabled={!canProceed()}>
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSend} disabled={!allValid || isSending || overHardLimit}>
                  {isSending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  {timing === "now" ? "Send Campaign" : "Schedule Campaign"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={demoBlockOpen} onOpenChange={setDemoBlockOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Demo mode is on</DialogTitle>
            <DialogDescription>
              You're previewing with mock data. Switch off Demo Mode to send a real campaign — we won't write anything while demo is on.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDemoBlockOpen(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
