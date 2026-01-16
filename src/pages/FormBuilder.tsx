import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, Monitor, Smartphone, Plus, GripVertical, Trash2, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  type: "short_text" | "long_text" | "rating" | "video" | "audio" | "multiple_choice" | "sentiment";
  question: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
}

interface FormSettings {
  name: string;
  slug: string;
  status: boolean;
  logo?: string;
  brandColor: string;
  welcomeEnabled: boolean;
  welcomeTitle: string;
  welcomeMessage: string;
  thankYouTitle: string;
  thankYouMessage: string;
  thankYouRedirect?: string;
  confettiEnabled: boolean;
  collectText: boolean;
  collectVideo: boolean;
  collectAudio: boolean;
  letThemChoose: boolean;
  videoMaxLength: number;
  aiInterviewEnabled: boolean;
  aiCustomPrompt: string;
  incentiveEnabled: boolean;
  incentiveType: "discount" | "giftcard" | "download";
  incentiveValue: string;
  reviewRoutingEnabled: boolean;
  positiveThreshold: number;
  positiveAction: string;
  negativeAction: string;
}

const defaultQuestions: Question[] = [
  {
    id: "1",
    type: "rating",
    question: "How would you rate your overall experience?",
    required: true,
  },
  {
    id: "2",
    type: "long_text",
    question: "What did you enjoy most about working with us?",
    placeholder: "Tell us about your experience...",
    required: true,
  },
  {
    id: "3",
    type: "short_text",
    question: "Would you recommend us to others? Why?",
    required: false,
  },
];

const questionTypes = [
  { type: "short_text", icon: "📝", label: "Short Text" },
  { type: "long_text", icon: "📄", label: "Long Text" },
  { type: "rating", icon: "⭐", label: "Rating" },
  { type: "video", icon: "🎥", label: "Video" },
  { type: "audio", icon: "🎤", label: "Audio" },
  { type: "multiple_choice", icon: "☑️", label: "Multiple Choice" },
  { type: "sentiment", icon: "😊", label: "Sentiment" },
];

export default function FormBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isNew = id === "new";

  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile");
  const [questions, setQuestions] = useState<Question[]>(defaultQuestions);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [settings, setSettings] = useState<FormSettings>({
    name: isNew ? "New Collection Form" : "Customer Success Story",
    slug: isNew ? "new-form" : "customer-success",
    status: true,
    brandColor: "#f97316",
    welcomeEnabled: true,
    welcomeTitle: "Hey there! 👋",
    welcomeMessage: "We'd love to hear about your experience. It'll only take a minute!",
    thankYouTitle: "You're amazing! 🎉",
    thankYouMessage: "Thank you so much for sharing your story. It means the world to us!",
    confettiEnabled: true,
    collectText: true,
    collectVideo: true,
    collectAudio: false,
    letThemChoose: true,
    videoMaxLength: 60,
    aiInterviewEnabled: false,
    aiCustomPrompt: "Ask about their experience, what results they achieved, and what they'd tell others considering our product.",
    incentiveEnabled: false,
    incentiveType: "discount",
    incentiveValue: "10%",
    reviewRoutingEnabled: false,
    positiveThreshold: 4,
    positiveAction: "google",
    negativeAction: "support@example.com",
  });

  const copySlug = () => {
    const url = `${window.location.origin}/collect/${settings.slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied!", description: url });
  };

  const addQuestion = (type: string) => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type: type as Question["type"],
      question: "New question",
      required: false,
    };
    setQuestions([...questions, newQuestion]);
    setSelectedQuestion(newQuestion.id);
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
    if (selectedQuestion === id) setSelectedQuestion(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/forms")}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div>
              <Input
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="text-lg font-semibold border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={settings.status ? "default" : "secondary"} className={settings.status ? "bg-emerald text-white" : ""}>
              {settings.status ? "Active" : "Inactive"}
            </Badge>
            <Button variant="outline" onClick={() => window.open(`/collect/${settings.slug}`, "_blank")}>
              Preview
            </Button>
            <Button className="gradient-sunny text-white border-0">
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto grid grid-cols-12 gap-6 p-6">
        {/* Left Column - Settings */}
        <div className="col-span-3 space-y-6 overflow-y-auto max-h-[calc(100vh-120px)] scrollbar-warm pr-2">
          {/* Form Basics */}
          <Card className="bg-card border border-border rounded-2xl">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <span>✨</span> Form Basics
              </h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-sm">URL Slug</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={settings.slug}
                      onChange={(e) => setSettings({ ...settings, slug: e.target.value.toLowerCase().replace(/\s/g, "-") })}
                      className="flex-1"
                    />
                    <Button variant="outline" size="icon" onClick={copySlug}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Status</Label>
                  <Switch
                    checked={settings.status}
                    onCheckedChange={(checked) => setSettings({ ...settings, status: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Welcome Screen */}
          <Card className="bg-card border border-border rounded-2xl">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <span>👋</span> Welcome Screen
                </h3>
                <Switch
                  checked={settings.welcomeEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, welcomeEnabled: checked })}
                />
              </div>
              {settings.welcomeEnabled && (
                <div className="space-y-3">
                  <Input
                    value={settings.welcomeTitle}
                    onChange={(e) => setSettings({ ...settings, welcomeTitle: e.target.value })}
                    placeholder="Welcome title"
                  />
                  <Textarea
                    value={settings.welcomeMessage}
                    onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
                    placeholder="Welcome message"
                    rows={3}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Thank You Screen */}
          <Card className="bg-card border border-border rounded-2xl">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <span>🙏</span> Thank You Screen
              </h3>
              <div className="space-y-3">
                <Input
                  value={settings.thankYouTitle}
                  onChange={(e) => setSettings({ ...settings, thankYouTitle: e.target.value })}
                  placeholder="Thank you title"
                />
                <Textarea
                  value={settings.thankYouMessage}
                  onChange={(e) => setSettings({ ...settings, thankYouMessage: e.target.value })}
                  placeholder="Thank you message"
                  rows={3}
                />
                <div className="flex items-center justify-between">
                  <Label className="text-sm">🎊 Confetti</Label>
                  <Switch
                    checked={settings.confettiEnabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, confettiEnabled: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Collection Types */}
          <Card className="bg-card border border-border rounded-2xl">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <span>📹</span> Collection Types
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">📝 Text</Label>
                  <Switch
                    checked={settings.collectText}
                    onCheckedChange={(checked) => setSettings({ ...settings, collectText: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">🎥 Video</Label>
                  <Switch
                    checked={settings.collectVideo}
                    onCheckedChange={(checked) => setSettings({ ...settings, collectVideo: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">🎤 Audio</Label>
                  <Switch
                    checked={settings.collectAudio}
                    onCheckedChange={(checked) => setSettings({ ...settings, collectAudio: checked })}
                  />
                </div>
                {settings.collectVideo && (
                  <div>
                    <Label className="text-sm">Video max length: {settings.videoMaxLength}s</Label>
                    <Slider
                      value={[settings.videoMaxLength]}
                      onValueChange={([value]) => setSettings({ ...settings, videoMaxLength: value })}
                      min={15}
                      max={120}
                      step={15}
                      className="mt-2"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Interview Mode */}
          <Card className={`bg-card border rounded-2xl ${settings.aiInterviewEnabled ? "border-primary shadow-warm" : "border-border"}`}>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <span>🤖</span> AI Interview Mode
                  <Sparkles className="w-4 h-4 text-primary" />
                </h3>
                <Switch
                  checked={settings.aiInterviewEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, aiInterviewEnabled: checked })}
                />
              </div>
              {settings.aiInterviewEnabled && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Our AI will have a natural conversation to extract better testimonials.
                  </p>
                  <Textarea
                    value={settings.aiCustomPrompt}
                    onChange={(e) => setSettings({ ...settings, aiCustomPrompt: e.target.value })}
                    placeholder="Custom instructions for the AI..."
                    rows={3}
                  />
                  <Button variant="outline" className="w-full" onClick={() => navigate(`/collect/${settings.slug}/ai`)}>
                    Test it yourself
                  </Button>
                  <Badge className="bg-emerald-light text-emerald border-0 w-full justify-center">
                    ✨ Gets 2x better testimonials
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Review Routing */}
          <Card className="bg-card border border-border rounded-2xl">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <span>🚨</span> Review Routing
                  <Badge variant="secondary" className="text-xs">PRO</Badge>
                </h3>
                <Switch
                  checked={settings.reviewRoutingEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, reviewRoutingEnabled: checked })}
                />
              </div>
              {settings.reviewRoutingEnabled && (
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm">Positive threshold ({settings.positiveThreshold}+ stars)</Label>
                    <Slider
                      value={[settings.positiveThreshold]}
                      onValueChange={([value]) => setSettings({ ...settings, positiveThreshold: value })}
                      min={3}
                      max={5}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Positive → Send to</Label>
                    <select
                      className="w-full mt-1 p-2 rounded-lg border border-border bg-card text-sm"
                      value={settings.positiveAction}
                      onChange={(e) => setSettings({ ...settings, positiveAction: e.target.value })}
                    >
                      <option value="google">Google Reviews</option>
                      <option value="g2">G2</option>
                      <option value="trustpilot">Trustpilot</option>
                      <option value="capterra">Capterra</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-sm">Negative → Send to support</Label>
                    <Input
                      value={settings.negativeAction}
                      onChange={(e) => setSettings({ ...settings, negativeAction: e.target.value })}
                      placeholder="support@example.com"
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Center Column - Preview */}
        <div className="col-span-5">
          <div className="sticky top-24">
            {/* Device Toggle */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <Button
                variant={previewDevice === "mobile" ? "default" : "outline"}
                size="sm"
                onClick={() => setPreviewDevice("mobile")}
              >
                <Smartphone className="w-4 h-4 mr-1" />
                Mobile
              </Button>
              <Button
                variant={previewDevice === "desktop" ? "default" : "outline"}
                size="sm"
                onClick={() => setPreviewDevice("desktop")}
              >
                <Monitor className="w-4 h-4 mr-1" />
                Desktop
              </Button>
            </div>

            {/* Preview Frame */}
            <div className={`mx-auto bg-card border border-border rounded-3xl shadow-warm-xl overflow-hidden transition-all ${
              previewDevice === "mobile" ? "w-[375px]" : "w-full max-w-[600px]"
            }`}>
              {/* Preview Header */}
              <div className="p-6 text-center" style={{ backgroundColor: settings.brandColor + "15" }}>
                <div className="w-16 h-16 rounded-full mx-auto mb-4 gradient-sunny flex items-center justify-center text-2xl">
                  💛
                </div>
                <h2 className="text-xl font-bold text-foreground">{settings.welcomeTitle}</h2>
                <p className="text-muted-foreground mt-2">{settings.welcomeMessage}</p>
              </div>

              {/* Preview Questions */}
              <div className="p-6 space-y-4">
                {questions.slice(0, 2).map((q, i) => (
                  <div key={q.id} className="space-y-2">
                    <Label className="flex items-center gap-1">
                      {q.question}
                      {q.required && <span className="text-destructive">*</span>}
                    </Label>
                    {q.type === "rating" ? (
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <div key={star} className="w-10 h-10 rounded-lg bg-gold-light flex items-center justify-center text-lg">
                            ⭐
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-10 bg-muted rounded-lg border border-border" />
                    )}
                  </div>
                ))}
                <Button className="w-full gradient-sunny text-white border-0 mt-4">
                  Continue
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Questions */}
        <div className="col-span-4 space-y-6 overflow-y-auto max-h-[calc(100vh-120px)] scrollbar-warm pr-2">
          <Card className="bg-card border border-border rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <span>📝</span> Questions
                </h3>
                <Button variant="outline" size="sm" className="text-primary">
                  <Sparkles className="w-4 h-4 mr-1" />
                  Generate with AI
                </Button>
              </div>

              {/* Questions List */}
              <div className="space-y-2 mb-4">
                {questions.map((q, index) => (
                  <div
                    key={q.id}
                    onClick={() => setSelectedQuestion(q.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                      selectedQuestion === q.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-border-hover"
                    }`}
                  >
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                    <span className="text-lg">
                      {questionTypes.find((t) => t.type === q.type)?.icon}
                    </span>
                    <span className="flex-1 text-sm truncate">{q.question}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => { e.stopPropagation(); deleteQuestion(q.id); }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Add Question */}
              <div className="grid grid-cols-4 gap-2">
                {questionTypes.slice(0, 4).map((type) => (
                  <Button
                    key={type.type}
                    variant="outline"
                    size="sm"
                    className="flex-col h-16 gap-1"
                    onClick={() => addQuestion(type.type)}
                  >
                    <span className="text-lg">{type.icon}</span>
                    <span className="text-xs">{type.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Question Editor */}
          {selectedQuestion && (
            <Card className="bg-card border border-primary rounded-2xl">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-semibold text-foreground">Edit Question</h3>
                {(() => {
                  const q = questions.find((q) => q.id === selectedQuestion);
                  if (!q) return null;
                  return (
                    <div className="space-y-3">
                      <div>
                        <Label>Question Type</Label>
                        <div className="grid grid-cols-4 gap-2 mt-2">
                          {questionTypes.map((type) => (
                            <button
                              key={type.type}
                              onClick={() => {
                                setQuestions(questions.map((question) =>
                                  question.id === q.id
                                    ? { ...question, type: type.type as Question["type"] }
                                    : question
                                ));
                              }}
                              className={`p-2 rounded-lg border text-center ${
                                q.type === type.type
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:border-border-hover"
                              }`}
                            >
                              <span className="text-lg">{type.icon}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label>Question Text</Label>
                        <Input
                          value={q.question}
                          onChange={(e) => {
                            setQuestions(questions.map((question) =>
                              question.id === q.id
                                ? { ...question, question: e.target.value }
                                : question
                            ));
                          }}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Placeholder</Label>
                        <Input
                          value={q.placeholder || ""}
                          onChange={(e) => {
                            setQuestions(questions.map((question) =>
                              question.id === q.id
                                ? { ...question, placeholder: e.target.value }
                                : question
                            ));
                          }}
                          placeholder="Enter placeholder text..."
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Required</Label>
                        <Switch
                          checked={q.required}
                          onCheckedChange={(checked) => {
                            setQuestions(questions.map((question) =>
                              question.id === q.id
                                ? { ...question, required: checked }
                                : question
                            ));
                          }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
