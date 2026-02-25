import { useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";

const steps = [
  { id: 1, title: "Setup", icon: Check },
  { id: 2, title: "Message", icon: MessageSquare },
  { id: 3, title: "Recipients", icon: Users },
  { id: 4, title: "Schedule", icon: Calendar },
];

const SMS_CHAR_LIMIT = 160;

function parsePhoneNumbers(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => {
      if (!s) return false;
      // starts with + and at least 10 digits, or 10+ digits
      const digits = s.replace(/\D/g, "");
      return digits.length >= 10;
    });
}

export default function CampaignBuilder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: forms } = useForms();

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 - Setup
  const [campaignName, setCampaignName] = useState("");
  const [selectedFormId, setSelectedFormId] = useState("");

  // Step 2 - Message
  const [message, setMessage] = useState(
    "Hey {first_name}! 👋 Quick favor - would you share your experience with us? Takes 60 sec: {form_link}"
  );

  // Step 3 - Recipients
  const [recipientsText, setRecipientsText] = useState("");

  // Step 4 - Schedule
  const [timing, setTiming] = useState<"now" | "scheduled">("now");
  const [scheduledDate, setScheduledDate] = useState("");

  // Sending state
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState({ current: 0, total: 0 });

  const validNumbers = parsePhoneNumbers(recipientsText);
  const selectedForm = forms?.find((f) => f.id === selectedFormId);
  const formLink = selectedForm
    ? `${window.location.origin}/collect/${selectedForm.slug}`
    : "{form_link}";

  const previewMessage = message
    .replace("{first_name}", "Sarah")
    .replace("{form_link}", formLink);

  const insertVariable = (v: string) => {
    setMessage((prev) => prev + v);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return campaignName.trim().length > 0 && selectedFormId.length > 0;
      case 2: return message.trim().length > 0;
      case 3: return validNumbers.length > 0;
      case 4: return timing === "now" || (timing === "scheduled" && scheduledDate);
      default: return true;
    }
  };

  const saveCampaign = async (status: "draft" | "active" | "scheduled") => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("campaigns")
      .insert({
        user_id: user.id,
        name: campaignName,
        form_id: selectedFormId || null,
        type: "sms" as const,
        status,
        message_template: message,
        recipients: validNumbers.map((p) => ({ phone: p })),
        total_recipients: validNumbers.length,
        scheduled_at: timing === "scheduled" ? scheduledDate : null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  const handleSaveDraft = async () => {
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
    setIsSending(true);
    try {
      const campaign = await saveCampaign(timing === "scheduled" ? "scheduled" : "active");
      if (!campaign) throw new Error("Failed to create campaign");

      if (timing === "now") {
        const total = validNumbers.length;
        setSendProgress({ current: 0, total });

        for (let i = 0; i < total; i++) {
          const phone = validNumbers[i];
          const personalizedMsg = message
            .replace("{first_name}", "")
            .replace("{form_link}", formLink);

          await supabase.functions.invoke("send-sms", {
            body: { to: phone, message: personalizedMsg, campaign_id: campaign.id },
          });
          setSendProgress({ current: i + 1, total });
        }

        // Update campaign stats
        await supabase
          .from("campaigns")
          .update({ sent_count: total, status: "active" as const })
          .eq("id", campaign.id);
      }

      toast({
        title: timing === "now" ? "Campaign sent! 🚀" : "Campaign scheduled! 📅",
        description:
          timing === "now"
            ? `SMS sent to ${validNumbers.length} recipients`
            : `Scheduled for ${new Date(scheduledDate).toLocaleString()}`,
      });
      navigate("/dashboard/campaigns");
    } catch (e: any) {
      toast({ title: "Failed to send", description: e.message, variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/campaigns")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <h1 className="text-xl font-semibold text-foreground">New SMS Campaign</h1>
          </div>
          <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={isSaving || !campaignName.trim()}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                  currentStep >= step.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
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
                <h3 className="text-lg font-semibold text-foreground">
                  Sending {sendProgress.current}/{sendProgress.total}...
                </h3>
                <Progress value={(sendProgress.current / Math.max(sendProgress.total, 1)) * 100} className="h-2" />
                <p className="text-sm text-muted-foreground">Please don't close this page</p>
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
                      {(forms ?? []).map((form) => (
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
                      {(forms ?? []).length === 0 && (
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
                      <Badge variant="outline" className="text-muted-foreground">Email <span className="text-xs ml-1 opacity-60">coming soon</span></Badge>
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
                    <span className={`text-sm ${message.length > SMS_CHAR_LIMIT ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                      {message.length}/{SMS_CHAR_LIMIT}
                    </span>
                  </div>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    maxLength={SMS_CHAR_LIMIT * 2}
                    className="resize-none"
                  />
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
                  <p className="text-muted-foreground">Enter phone numbers, one per line or comma-separated</p>
                </div>

                <div>
                  <Label>Phone Numbers</Label>
                  <Textarea
                    value={recipientsText}
                    onChange={(e) => setRecipientsText(e.target.value)}
                    rows={8}
                    placeholder={"+1234567890\n+1987654321\nor comma-separated: +1555000111, +1555000222"}
                    className="mt-1 font-mono text-sm resize-none"
                  />
                  <div className="flex items-center justify-between mt-2 text-sm">
                    <span className="text-muted-foreground">Must start with + or be 10+ digits</span>
                    <Badge variant={validNumbers.length > 0 ? "default" : "secondary"}>
                      {validNumbers.length} valid number{validNumbers.length !== 1 ? "s" : ""}
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
                          <div className="text-sm text-muted-foreground">Campaign will be sent immediately</div>
                        </Label>
                      </CardContent>
                    </Card>
                    <Card className={`cursor-pointer ${timing === "scheduled" ? "border-primary" : "border-border"}`}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <RadioGroupItem value="scheduled" id="scheduled" />
                        <Label htmlFor="scheduled" className="flex-1 cursor-pointer">
                          <div className="font-medium">Schedule for later</div>
                          <div className="text-sm text-muted-foreground">Pick a specific date and time</div>
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
                      <span className="font-medium text-foreground">{validNumbers.length} contacts</span>
                    </div>
                    <div className="flex justify-between p-3 bg-warning/10 rounded-xl text-sm">
                      <span className="font-medium text-foreground">SMS Credits</span>
                      <span className="font-bold text-foreground">{validNumbers.length} credits</span>
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
                <Button onClick={handleSend} disabled={!canProceed() || isSending}>
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
    </div>
  );
}
