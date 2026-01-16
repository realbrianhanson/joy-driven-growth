import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Upload, Users, MessageSquare, Calendar, Send, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Recipient {
  name: string;
  phone: string;
  company?: string;
}

const steps = [
  { id: 1, title: "Recipients", icon: Users },
  { id: 2, title: "Message", icon: MessageSquare },
  { id: 3, title: "Timing", icon: Calendar },
  { id: 4, title: "Form", icon: Check },
  { id: 5, title: "Review", icon: Send },
];

const messageTemplates = [
  {
    id: "friendly",
    name: "Friendly Ask",
    preview: "Hey {name}! 👋 Quick favor - would you share your experience with us? Takes 60 sec: {link}",
  },
  {
    id: "professional",
    name: "Professional",
    preview: "Hi {name}, we'd love your feedback on your experience with [Company]. Your insights help us improve: {link}",
  },
  {
    id: "personal",
    name: "Personal Touch",
    preview: "Hi {name}! I hope you're doing well. I was wondering if you'd be willing to share a quick testimonial? It would mean a lot to us: {link}",
  },
];

export default function CampaignBuilder() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [recipients, setRecipients] = useState<Recipient[]>([
    { name: "Sarah Johnson", phone: "+1234567890", company: "TechStart Inc" },
    { name: "Michael Chen", phone: "+1987654321", company: "Growth Labs" },
    { name: "Emily Rodriguez", phone: "+1555555555", company: "Bloom Agency" },
  ]);
  const [message, setMessage] = useState(messageTemplates[0].preview);
  const [selectedTemplate, setSelectedTemplate] = useState("friendly");
  const [timing, setTiming] = useState<"now" | "scheduled" | "optimal">("now");
  const [scheduledDate, setScheduledDate] = useState("");
  const [followUp, setFollowUp] = useState(true);
  const [followUpDays, setFollowUpDays] = useState(3);
  const [selectedForm, setSelectedForm] = useState("customer-success");

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSend = () => {
    toast({
      title: "Campaign sent! 🚀",
      description: `SMS sent to ${recipients.length} recipients`,
    });
    navigate("/dashboard/campaigns");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/campaigns")}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <h1 className="text-xl font-semibold text-foreground">New SMS Campaign</h1>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  currentStep >= step.id
                    ? "gradient-sunny text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <step.icon className="w-5 h-5" />
              </div>
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

        {/* Step Content */}
        <Card className="bg-card border border-border rounded-2xl">
          <CardContent className="p-8">
            {/* Step 1: Recipients */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Who's receiving this?</h2>
                  <p className="text-muted-foreground">Import your contacts or add them manually</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Card className="border-2 border-dashed border-border hover:border-primary cursor-pointer transition-all p-6 text-center">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <span className="text-sm font-medium">Import CSV</span>
                  </Card>
                  <Card className="border-2 border-dashed border-border hover:border-primary cursor-pointer transition-all p-6 text-center">
                    <div className="text-2xl mb-2">🔗</div>
                    <span className="text-sm font-medium">Connect CRM</span>
                  </Card>
                  <Card className="border-2 border-dashed border-border hover:border-primary cursor-pointer transition-all p-6 text-center">
                    <div className="text-2xl mb-2">✏️</div>
                    <span className="text-sm font-medium">Manual Entry</span>
                  </Card>
                </div>

                {/* Recipients List */}
                <div className="border border-border rounded-xl overflow-hidden">
                  <div className="p-4 bg-muted/50 border-b border-border flex justify-between items-center">
                    <span className="font-medium">{recipients.length} recipients</span>
                    <Button variant="outline" size="sm">+ Add</Button>
                  </div>
                  <div className="divide-y divide-border max-h-64 overflow-y-auto">
                    {recipients.map((r, i) => (
                      <div key={i} className="p-4 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground">{r.name}</div>
                          <div className="text-sm text-muted-foreground">{r.company}</div>
                        </div>
                        <div className="text-sm text-muted-foreground">{r.phone}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Message */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Craft your message</h2>
                  <p className="text-muted-foreground">Choose a template or write your own</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {messageTemplates.map((template) => (
                    <Card
                      key={template.id}
                      onClick={() => {
                        setSelectedTemplate(template.id);
                        setMessage(template.preview);
                      }}
                      className={`cursor-pointer transition-all ${
                        selectedTemplate === template.id
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-border-hover"
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="font-medium text-foreground mb-2">{template.name}</div>
                        <p className="text-xs text-muted-foreground line-clamp-3">{template.preview}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div>
                  <Label>Message</Label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>Variables: {"{name}"}, {"{company}"}, {"{link}"}</span>
                    <span>{message.length} characters</span>
                  </div>
                </div>

                {/* Phone Preview */}
                <div className="flex justify-center">
                  <div className="w-64 bg-foreground/5 rounded-3xl p-4 border-4 border-foreground/10">
                    <div className="bg-card rounded-2xl p-4 shadow-sm">
                      <div className="text-xs text-muted-foreground mb-2">SMS Preview</div>
                      <p className="text-sm text-foreground">
                        {message.replace("{name}", "Sarah").replace("{link}", "yoursite.com/c/abc")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Timing */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">When should we send it?</h2>
                  <p className="text-muted-foreground">Choose the best time for your campaign</p>
                </div>

                <RadioGroup value={timing} onValueChange={(v) => setTiming(v as any)}>
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
                    <Card className={`cursor-pointer ${timing === "optimal" ? "border-primary" : "border-border"}`}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <RadioGroupItem value="optimal" id="optimal" />
                        <Label htmlFor="optimal" className="flex-1 cursor-pointer">
                          <div className="font-medium flex items-center gap-2">
                            Optimal time
                            <Badge className="bg-primary/10 text-primary border-0">AI ✨</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">AI picks the best time based on your audience</div>
                        </Label>
                      </CardContent>
                    </Card>
                  </div>
                </RadioGroup>

                <Card className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="font-medium">Auto-remind non-responders</Label>
                      <input
                        type="checkbox"
                        checked={followUp}
                        onChange={(e) => setFollowUp(e.target.checked)}
                        className="w-5 h-5"
                      />
                    </div>
                    {followUp && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Remind after</span>
                        <Input
                          type="number"
                          value={followUpDays}
                          onChange={(e) => setFollowUpDays(parseInt(e.target.value))}
                          className="w-20"
                          min={1}
                          max={14}
                        />
                        <span className="text-sm text-muted-foreground">days</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 4: Form */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Link to a form</h2>
                  <p className="text-muted-foreground">Which form should recipients complete?</p>
                </div>

                <div className="space-y-3">
                  {[
                    { id: "customer-success", name: "Customer Success Story", responses: 47 },
                    { id: "quick-feedback", name: "Quick Feedback", responses: 128 },
                    { id: "video-testimonials", name: "Video Testimonials", responses: 23 },
                  ].map((form) => (
                    <Card
                      key={form.id}
                      onClick={() => setSelectedForm(form.id)}
                      className={`cursor-pointer transition-all ${
                        selectedForm === form.id
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-border-hover"
                      }`}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground">{form.name}</div>
                          <div className="text-sm text-muted-foreground">{form.responses} responses</div>
                        </div>
                        {selectedForm === form.id && (
                          <div className="w-6 h-6 rounded-full gradient-sunny flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Button variant="outline" className="w-full" onClick={() => navigate("/dashboard/forms/new/edit")}>
                  + Create new form
                </Button>
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Ready to send? 🚀</h2>
                  <p className="text-muted-foreground">Review your campaign before sending</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between p-4 bg-muted/50 rounded-xl">
                    <span className="text-muted-foreground">Recipients</span>
                    <span className="font-medium">{recipients.length} contacts</span>
                  </div>
                  <div className="flex justify-between p-4 bg-muted/50 rounded-xl">
                    <span className="text-muted-foreground">Timing</span>
                    <span className="font-medium">
                      {timing === "now" ? "Send immediately" : timing === "optimal" ? "AI-optimized" : scheduledDate}
                    </span>
                  </div>
                  <div className="flex justify-between p-4 bg-muted/50 rounded-xl">
                    <span className="text-muted-foreground">Form</span>
                    <span className="font-medium">{selectedForm}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-muted/50 rounded-xl">
                    <span className="text-muted-foreground">Follow-up</span>
                    <span className="font-medium">{followUp ? `After ${followUpDays} days` : "Disabled"}</span>
                  </div>
                  <div className="flex justify-between p-4 bg-gold-light rounded-xl">
                    <span className="text-foreground font-medium">SMS Credits</span>
                    <span className="font-bold text-foreground">{recipients.length} credits</span>
                  </div>
                </div>

                <Button
                  className="w-full h-14 text-lg gradient-sunny text-white border-0 shadow-warm-lg"
                  onClick={handleSend}
                >
                  <Send className="w-5 h-5 mr-2" />
                  Send Campaign 🚀
                </Button>
              </div>
            )}

            {/* Navigation */}
            {currentStep < 5 && (
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleNext} className="gradient-sunny text-white border-0">
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
