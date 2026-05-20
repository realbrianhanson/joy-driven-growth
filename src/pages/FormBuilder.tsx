import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, Monitor, Smartphone, GripVertical, Trash2, Sparkles, Loader2, Star, Type, AlignLeft, Video, Mic, ListChecks, Smile, Plus } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useForm as useFormData, useCreateForm, useUpdateForm } from "@/hooks/use-forms";
import { supabase } from "@/integrations/supabase/client";
import { FORM_TEMPLATES, PURPOSE_LABELS, type QuestionPurpose, type TemplateQuestion } from "@/lib/form-templates";
import { DEFAULT_CONSENT_TEMPLATE } from "@/lib/consent";

interface Question {
  id: string;
  type: "short_text" | "long_text" | "rating" | "video" | "audio" | "multiple_choice" | "sentiment";
  question: string;
  placeholder?: string;
  helpText?: string;
  purpose?: QuestionPurpose;
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
  consentEnabled: boolean;
  consentText: string;
  nameDisplayEnabled: boolean;
}

const defaultQuestions: Question[] = [
  { id: "1", type: "rating", question: "How would you rate your overall experience?", required: true },
  { id: "2", type: "long_text", question: "What did you enjoy most about working with us?", placeholder: "Tell us about your experience...", required: true },
  { id: "3", type: "short_text", question: "Would you recommend us to others? Why?", required: false },
];

const defaultSettings: FormSettings = {
  name: "New Collection Form",
  slug: "new-form",
  status: true,
  brandColor: "#6366F1",
  welcomeEnabled: true,
  welcomeTitle: "Hey there!",
  welcomeMessage: "We'd love to hear about your experience. It'll only take a minute!",
  thankYouTitle: "Thank you!",
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
  consentEnabled: true,
  consentText: DEFAULT_CONSENT_TEMPLATE,
  nameDisplayEnabled: true,
};

const questionTypes = [
  { type: "short_text", icon: "T", label: "Short Text" },
  { type: "long_text", icon: "¶", label: "Long Text" },
  { type: "rating", icon: "★", label: "Rating" },
  { type: "video", icon: "▶", label: "Video" },
  { type: "audio", icon: "♪", label: "Audio" },
  { type: "multiple_choice", icon: "☐", label: "Multiple Choice" },
  { type: "sentiment", icon: "☺", label: "Sentiment" },
];

function SortableQuestionRow({
  q,
  icon,
  selected,
  onSelect,
  onDelete,
}: {
  q: Question;
  icon?: string;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: q.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={`p-3 rounded-lg border cursor-pointer transition-colors flex items-center gap-3 ${selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <span className="text-sm font-medium text-muted-foreground">{icon}</span>
      <span className="flex-1 text-sm truncate">{q.question}</span>
      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
}

export default function FormBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isNew = !id || id === "new";

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((q) => q.id === active.id);
        const newIndex = items.findIndex((q) => q.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const { data: existingForm, isLoading: formLoading } = useFormData(isNew ? "" : (id ?? ""));
  const createMutation = useCreateForm();
  const updateMutation = useUpdateForm();

  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile");
  const [questions, setQuestions] = useState<Question[]>(defaultQuestions);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [settings, setSettings] = useState<FormSettings>(defaultSettings);
  const [initialized, setInitialized] = useState(isNew);
  const [slugTaken, setSlugTaken] = useState(false);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(isNew);

  useEffect(() => {
    const slug = settings.slug;
    if (!slug || slug.length < 3) {
      setSlugTaken(false);
      return;
    }
    const timer = setTimeout(async () => {
      setCheckingSlug(true);
      const { data } = await supabase
        .from("forms")
        .select("id, user_id")
        .eq("slug", slug)
        .maybeSingle();
      setCheckingSlug(false);
      setSlugTaken(!!data && data.id !== id);
    }, 400);
    return () => clearTimeout(timer);
  }, [settings.slug, id]);

  // Populate from existing form
  useEffect(() => {
    if (existingForm && !initialized) {
      const cq = existingForm.custom_questions as any;
      const persisted = cq?.settings ?? {};
      const routing = persisted.review_routing ?? {};
      setSettings({
        name: existingForm.name,
        slug: existingForm.slug,
        status: existingForm.is_published ?? false,
        brandColor: existingForm.primary_color ?? "#6366F1",
        logo: existingForm.logo_url ?? undefined,
        welcomeEnabled: persisted.welcome_enabled ?? true,
        welcomeTitle: existingForm.welcome_title ?? "Hey there!",
        welcomeMessage: existingForm.welcome_message ?? "",
        thankYouTitle: existingForm.thank_you_title ?? "Thank you!",
        thankYouMessage: existingForm.thank_you_message ?? "",
        confettiEnabled: persisted.confetti_enabled ?? true,
        collectText: existingForm.collect_text ?? true,
        collectVideo: existingForm.collect_video ?? true,
        collectAudio: existingForm.collect_audio ?? false,
        letThemChoose: persisted.let_them_choose ?? true,
        videoMaxLength: persisted.video_max_length ?? 60,
        aiInterviewEnabled: cq?.ai_enabled ?? false,
        aiCustomPrompt: cq?.ai_prompt ?? defaultSettings.aiCustomPrompt,
        incentiveEnabled: existingForm.incentive_enabled ?? false,
        incentiveType: (existingForm.incentive_type as any) ?? "discount",
        incentiveValue: existingForm.incentive_value ?? "10%",
        reviewRoutingEnabled: routing.enabled ?? false,
        positiveThreshold: routing.positive_threshold ?? 4,
        positiveAction: routing.positive_action ?? "google",
        negativeAction: routing.negative_action ?? "support@example.com",
        consentEnabled: persisted.consent_enabled ?? true,
        consentText: persisted.consent_text ?? DEFAULT_CONSENT_TEMPLATE,
        nameDisplayEnabled: persisted.name_display_enabled ?? true,
      });
      if (cq?.questions && Array.isArray(cq.questions)) {
        setQuestions(cq.questions);
      }
      setInitialized(true);
    }
  }, [existingForm, initialized]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSave = () => {
    if (slugTaken) {
      toast({ title: "That URL is already taken. Please pick a different slug.", variant: "destructive" });
      return;
    }
    const formData = {
      name: settings.name,
      slug: settings.slug,
      is_published: settings.status,
      primary_color: settings.brandColor,
      logo_url: settings.logo ?? null,
      welcome_title: settings.welcomeTitle,
      welcome_message: settings.welcomeMessage,
      thank_you_title: settings.thankYouTitle,
      thank_you_message: settings.thankYouMessage,
      collect_text: settings.collectText,
      collect_video: settings.collectVideo,
      collect_audio: settings.collectAudio,
      require_rating: questions.some((q) => q.type === "rating" && q.required),
      incentive_enabled: settings.incentiveEnabled,
      incentive_type: settings.incentiveType,
      incentive_value: settings.incentiveValue,
      custom_questions: JSON.parse(JSON.stringify({
        ai_enabled: settings.aiInterviewEnabled,
        ai_prompt: settings.aiCustomPrompt,
        questions,
        settings: {
          welcome_enabled: settings.welcomeEnabled,
          confetti_enabled: settings.confettiEnabled,
          let_them_choose: settings.letThemChoose,
          video_max_length: settings.videoMaxLength,
          review_routing: {
            enabled: settings.reviewRoutingEnabled,
            positive_threshold: settings.positiveThreshold,
            positive_action: settings.positiveAction,
            negative_action: settings.negativeAction,
          },
          consent_enabled: settings.consentEnabled,
          consent_text: settings.consentText,
          name_display_enabled: settings.nameDisplayEnabled,
        },
      })),
    };

    if (isNew) {
      createMutation.mutate(formData, {
        onSuccess: () => {
          toast({ title: "Form saved" });
          navigate("/dashboard/forms");
        },
        onError: (e) => {
          toast({ title: "Failed to save form", description: e.message, variant: "destructive" });
        },
      });
    } else {
      updateMutation.mutate({ id: id!, ...formData }, {
        onSuccess: () => {
          toast({ title: "Form saved" });
          navigate("/dashboard/forms");
        },
        onError: (e) => {
          toast({ title: "Failed to save form", description: e.message, variant: "destructive" });
        },
      });
    }
  };

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

  const deleteQuestion = (qId: string) => {
    setQuestions(questions.filter((q) => q.id !== qId));
    if (selectedQuestion === qId) setSelectedQuestion(null);
  };

  if (!isNew && formLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (isNew && showTemplatePicker) {
    const pickTemplate = (tplId: string) => {
      const tpl = FORM_TEMPLATES.find((t) => t.id === tplId) ?? FORM_TEMPLATES[FORM_TEMPLATES.length - 1];
      const qs: Question[] = tpl.questions.map((q: TemplateQuestion) => ({
        id: q.id,
        type: q.type,
        question: q.question,
        placeholder: q.placeholder,
        helpText: q.helpText,
        purpose: q.purpose,
        required: q.required,
      }));
      setQuestions(qs);
      setSettings((s) => ({ ...s, name: tpl.name === "Blank Form" ? "New Collection Form" : tpl.name }));
      setShowTemplatePicker(false);
    };
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-3xl mx-auto">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/forms")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" /> Forms
          </Button>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Start a new form</h1>
          <p className="text-sm text-muted-foreground mb-6">Pick a template — these are designed to pull honest, context-rich answers that work as testimonials.</p>
          <div className="grid gap-3">
            {FORM_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                onClick={() => pickTemplate(tpl.id)}
                className="text-left p-5 rounded-xl border border-border hover:border-primary/40 bg-card transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-foreground">{tpl.name}</h3>
                  {tpl.recommended && <Badge variant="default">Recommended</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{tpl.description}</p>
                <p className="text-xs text-muted-foreground mt-2">{tpl.questions.length} question{tpl.questions.length === 1 ? "" : "s"}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-[1800px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard/forms")}
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Forms
            </Button>
            <span className="text-border" aria-hidden>/</span>
            <Input
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              className="text-[15px] font-semibold border-0 bg-transparent p-0 h-auto focus-visible:ring-0 max-w-[320px]"
            />
            <span className="inline-flex items-center gap-1.5 ml-2 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${settings.status ? "bg-success" : "bg-muted-foreground/40"}`}
                aria-hidden
              />
              {settings.status ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8" onClick={() => window.open(`/collect/${settings.slug}`, "_blank")}>
              Preview
            </Button>
            <Button size="sm" className="h-8" onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Save
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto grid grid-cols-12 gap-6 p-6">
        {/* Left Column - Settings */}
        <div className="col-span-3 space-y-6 overflow-y-auto max-h-[calc(100vh-120px)] pr-2">
          {/* Form Basics */}
          <Card className="rounded-xl">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold text-foreground">Form Basics</h3>
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

          {/* Welcome Screen */}
          <Card className="rounded-xl">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Welcome Screen</h3>
                <Switch checked={settings.welcomeEnabled} onCheckedChange={(checked) => setSettings({ ...settings, welcomeEnabled: checked })} />
              </div>
              {settings.welcomeEnabled && (
                <div className="space-y-3">
                  <Input value={settings.welcomeTitle} onChange={(e) => setSettings({ ...settings, welcomeTitle: e.target.value })} placeholder="Welcome title" />
                  <Textarea value={settings.welcomeMessage} onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })} placeholder="Welcome message" rows={3} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Thank You Screen */}
          <Card className="rounded-xl">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold text-foreground">Thank You Screen</h3>
              <div className="space-y-3">
                <Input value={settings.thankYouTitle} onChange={(e) => setSettings({ ...settings, thankYouTitle: e.target.value })} placeholder="Thank you title" />
                <Textarea value={settings.thankYouMessage} onChange={(e) => setSettings({ ...settings, thankYouMessage: e.target.value })} placeholder="Thank you message" rows={3} />
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Confetti</Label>
                  <Switch checked={settings.confettiEnabled} onCheckedChange={(checked) => setSettings({ ...settings, confettiEnabled: checked })} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Collection Types */}
          <Card className="rounded-xl">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold text-foreground">Collection Types</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Text</Label>
                  <Switch checked={settings.collectText} onCheckedChange={(checked) => setSettings({ ...settings, collectText: checked })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Video</Label>
                  <Switch checked={settings.collectVideo} onCheckedChange={(checked) => setSettings({ ...settings, collectVideo: checked })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Audio</Label>
                  <Switch checked={settings.collectAudio} onCheckedChange={(checked) => setSettings({ ...settings, collectAudio: checked })} />
                </div>
                {settings.collectVideo && (
                  <div>
                    <Label className="text-sm">Video max length: {settings.videoMaxLength}s</Label>
                    <Slider value={[settings.videoMaxLength]} onValueChange={([value]) => setSettings({ ...settings, videoMaxLength: value })} min={15} max={120} step={15} className="mt-2" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Interview Mode */}
          <Card className={`rounded-xl ${settings.aiInterviewEnabled ? "border-primary" : ""}`}>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  AI Interview
                  <Sparkles className="w-4 h-4 text-primary" />
                </h3>
                <Switch checked={settings.aiInterviewEnabled} onCheckedChange={(checked) => setSettings({ ...settings, aiInterviewEnabled: checked })} />
              </div>
              {settings.aiInterviewEnabled && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">Our AI will have a natural conversation to extract better testimonials.</p>
                  <Textarea value={settings.aiCustomPrompt} onChange={(e) => setSettings({ ...settings, aiCustomPrompt: e.target.value })} placeholder="Custom instructions for the AI..." rows={3} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Incentives */}
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
                    <select className="w-full mt-1 p-2 rounded-lg border border-border bg-card text-sm" value={settings.incentiveType} onChange={(e) => setSettings({ ...settings, incentiveType: e.target.value as any })}>
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

          {/* Permission & Consent */}
          <Card className="rounded-xl">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold text-foreground">Permission & Consent</h3>
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
                </div>
              )}
              <div className="flex items-center justify-between">
                <Label className="text-sm">Ask how they want their name shown</Label>
                <Switch
                  checked={settings.nameDisplayEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, nameDisplayEnabled: checked })}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Shown as a required checkbox on the form before submission. <code>{"{company}"}</code> is replaced with your company name.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Center Column - Preview */}
        <div className="col-span-5">
          <div className="sticky top-24">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Button variant={previewDevice === "mobile" ? "default" : "outline"} size="sm" onClick={() => setPreviewDevice("mobile")}>
                <Smartphone className="w-4 h-4 mr-1" /> Mobile
              </Button>
              <Button variant={previewDevice === "desktop" ? "default" : "outline"} size="sm" onClick={() => setPreviewDevice("desktop")}>
                <Monitor className="w-4 h-4 mr-1" /> Desktop
              </Button>
            </div>

            <div className={`mx-auto bg-card border rounded-xl shadow-subtle overflow-hidden transition-all ${previewDevice === "mobile" ? "w-[375px]" : "w-full max-w-[600px]"}`}>
              <div className="p-6 text-center" style={{ backgroundColor: settings.brandColor + "15" }}>
                <div className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center text-primary-foreground" style={{ backgroundColor: settings.brandColor }}>
                  <span className="text-xl font-bold">T</span>
                </div>
                <h2 className="text-xl font-bold text-foreground">{settings.welcomeTitle}</h2>
                <p className="text-muted-foreground mt-2">{settings.welcomeMessage}</p>
              </div>

              <div className="p-6 space-y-4">
                {questions.slice(0, 2).map((q) => (
                  <div key={q.id} className="space-y-2">
                    <Label className="flex items-center gap-1">
                      {q.question}
                      {q.required && <span className="text-destructive">*</span>}
                    </Label>
                    {q.type === "rating" ? (
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <div key={star} className="w-10 h-10 rounded-lg bg-warning-light flex items-center justify-center text-warning text-lg">★</div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-10 bg-muted rounded-lg border border-border" />
                    )}
                  </div>
                ))}
                <Button className="w-full mt-4">Continue</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Questions */}
        <div className="col-span-4 space-y-6 overflow-y-auto max-h-[calc(100vh-120px)] pr-2">
          <Card className="rounded-xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Questions</h3>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2 mb-4">
                    {questions.map((q) => (
                      <SortableQuestionRow
                        key={q.id}
                        q={q}
                        icon={questionTypes.find((t) => t.type === q.type)?.icon}
                        selected={selectedQuestion === q.id}
                        onSelect={() => setSelectedQuestion(q.id)}
                        onDelete={() => deleteQuestion(q.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <div className="grid grid-cols-4 gap-2">
                {questionTypes.slice(0, 4).map((type) => (
                  <Button key={type.type} variant="outline" size="sm" className="flex-col h-16 gap-1" onClick={() => addQuestion(type.type)}>
                    <span className="text-lg">{type.icon}</span>
                    <span className="text-xs">{type.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedQuestion && (
            <Card className="border-primary rounded-xl">
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
                              onClick={() => setQuestions(questions.map((question) => question.id === q.id ? { ...question, type: type.type as Question["type"] } : question))}
                              className={`p-2 rounded-lg border text-center transition-all duration-150 ${q.type === type.type ? "border-primary bg-primary/10" : "border-border hover:border-border-hover"}`}
                            >
                              <span className="text-lg">{type.icon}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label>Question Text</Label>
                        <Input value={q.question} onChange={(e) => setQuestions(questions.map((question) => question.id === q.id ? { ...question, question: e.target.value } : question))} className="mt-1" />
                      </div>
                      <div>
                        <Label>Placeholder</Label>
                        <Input value={q.placeholder || ""} onChange={(e) => setQuestions(questions.map((question) => question.id === q.id ? { ...question, placeholder: e.target.value } : question))} placeholder="Enter placeholder text..." className="mt-1" />
                      </div>
                      <div>
                        <Label>Help text</Label>
                        <Textarea
                          value={q.helpText || ""}
                          onChange={(e) => setQuestions(questions.map((question) => question.id === q.id ? { ...question, helpText: e.target.value } : question))}
                          placeholder="Coaching text shown under the question to encourage specific, honest answers..."
                          rows={2}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Purpose</Label>
                        <select
                          className="w-full mt-1 p-2 rounded-lg border border-border bg-card text-sm"
                          value={q.purpose ?? "open"}
                          onChange={(e) => setQuestions(questions.map((question) => question.id === q.id ? { ...question, purpose: e.target.value as QuestionPurpose } : question))}
                        >
                          {(Object.keys(PURPOSE_LABELS) as QuestionPurpose[]).map((p) => (
                            <option key={p} value={p}>{PURPOSE_LABELS[p]}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Required</Label>
                        <Switch checked={q.required} onCheckedChange={(checked) => setQuestions(questions.map((question) => question.id === q.id ? { ...question, required: checked } : question))} />
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
