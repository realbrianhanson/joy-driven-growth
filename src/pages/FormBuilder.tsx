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
  { type: "short_text", icon: Type, label: "Short Text" },
  { type: "long_text", icon: AlignLeft, label: "Long Text" },
  { type: "rating", icon: Star, label: "Rating" },
  { type: "video", icon: Video, label: "Video" },
  { type: "audio", icon: Mic, label: "Audio" },
  { type: "multiple_choice", icon: ListChecks, label: "Multiple Choice" },
  { type: "sentiment", icon: Smile, label: "Sentiment" },
] as const;

type QuestionTypeDef = typeof questionTypes[number];

function SortableQuestionRow({
  q,
  Icon,
  selected,
  onSelect,
  onDelete,
}: {
  q: Question;
  Icon?: React.ComponentType<{ className?: string }>;
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
      {Icon && <Icon className="w-4 h-4 text-muted-foreground shrink-0" />}
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{q.question || <span className="text-muted-foreground italic">Untitled question</span>}</p>
        {q.purpose && q.purpose !== "open" && (
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">{PURPOSE_LABELS[q.purpose]}</p>
        )}
      </div>
      {q.required && <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Required</span>}
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

      {(() => {
        const slugUrl = `${window.location.origin}/collect/${settings.slug}`;
        const aiUrl = `${window.location.origin}/collect/${settings.slug}/ai`;
        const initial = (settings.name || "F").trim().charAt(0).toUpperCase();
        const accent = settings.brandColor || "#6366F1";

        const renderQuestionPreview = (q: Question) => {
          const placeholder = q.placeholder || "Your answer…";
          if (q.type === "rating") {
            return (
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-7 h-7" style={{ color: accent }} />
                ))}
              </div>
            );
          }
          if (q.type === "long_text") {
            return (
              <div className="w-full h-24 rounded-lg border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
                {placeholder}
              </div>
            );
          }
          if (q.type === "short_text") {
            return (
              <div className="w-full h-10 rounded-lg border border-border bg-background px-3 flex items-center text-xs text-muted-foreground">
                {placeholder}
              </div>
            );
          }
          if (q.type === "multiple_choice") {
            return (
              <div className="flex flex-wrap gap-2">
                {["Option A", "Option B", "Option C"].map((o) => (
                  <span key={o} className="px-3 py-1.5 rounded-full border border-border text-xs">{o}</span>
                ))}
              </div>
            );
          }
          if (q.type === "video") {
            return (
              <div className="w-full rounded-lg border border-dashed border-border bg-background p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Video className="w-6 h-6" />
                <span className="text-xs">Tap to record video</span>
              </div>
            );
          }
          if (q.type === "audio") {
            return (
              <div className="w-full rounded-lg border border-dashed border-border bg-background p-6 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Mic className="w-6 h-6" />
                <span className="text-xs">Tap to record audio</span>
              </div>
            );
          }
          if (q.type === "sentiment") {
            return (
              <div className="flex gap-2">
                {["😞", "😐", "🙂", "😄", "🤩"].map((e, i) => (
                  <span key={i} className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-lg">{e}</span>
                ))}
              </div>
            );
          }
          return <div className="h-10 rounded-lg border border-border bg-background" />;
        };

        const PreviewFrame = ({ device }: { device: "mobile" | "desktop" }) => (
          <div
            className={`mx-auto bg-card border border-border rounded-2xl shadow-subtle overflow-hidden transition-all ${device === "mobile" ? "w-full max-w-[380px]" : "w-full max-w-[640px]"}`}
          >
            <div className="p-6 text-center border-b border-border" style={{ backgroundColor: accent + "12" }}>
              {settings.logo ? (
                <img src={settings.logo} alt="" className="w-14 h-14 rounded-xl mx-auto mb-4 object-cover" />
              ) : (
                <div
                  className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center text-white text-xl font-semibold"
                  style={{ backgroundColor: accent }}
                >
                  {initial}
                </div>
              )}
              {settings.welcomeEnabled && (
                <>
                  <h2 className="text-lg font-semibold text-foreground">{settings.welcomeTitle || "Welcome"}</h2>
                  {settings.welcomeMessage && (
                    <p className="text-sm text-muted-foreground mt-1.5">{settings.welcomeMessage}</p>
                  )}
                </>
              )}
            </div>

            <div className="max-h-[480px] overflow-y-auto p-6 space-y-6">
              {questions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No questions yet.</p>
              ) : (
                questions.map((q, i) => (
                  <div key={q.id} className="space-y-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-muted-foreground">{i + 1}.</span>
                      <Label className="text-sm font-medium leading-snug">
                        {q.question || <span className="text-muted-foreground italic">Untitled</span>}
                        {q.required && <span className="text-destructive ml-1">*</span>}
                      </Label>
                    </div>
                    {q.helpText && (
                      <p className="text-xs text-muted-foreground pl-4">{q.helpText}</p>
                    )}
                    <div className="pl-4">{renderQuestionPreview(q)}</div>
                  </div>
                ))
              )}

              {settings.consentEnabled && (
                <div className="pt-2 border-t border-border">
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded border border-border mt-0.5 shrink-0" />
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {settings.consentText.slice(0, 220)}{settings.consentText.length > 220 ? "…" : ""}
                    </p>
                  </div>
                </div>
              )}

              <Button className="w-full" style={{ backgroundColor: accent }}>Submit</Button>

              <div className="text-center pt-2">
                <p className="text-[10px] text-muted-foreground">
                  After submit: <span className="font-medium text-foreground">{settings.thankYouTitle}</span>
                </p>
              </div>

              {settings.aiInterviewEnabled && (
                <div className="rounded-lg border border-dashed border-border p-3 flex items-start gap-2 bg-muted/30">
                  <Sparkles className="w-4 h-4 mt-0.5 shrink-0" style={{ color: accent }} />
                  <div className="text-[11px] text-muted-foreground">
                    This form also has a conversational <span className="font-medium text-foreground">AI Interview</span> version at{" "}
                    <span className="font-mono break-all">/collect/{settings.slug}/ai</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

        const PreviewPane = () => (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Button variant={previewDevice === "mobile" ? "default" : "outline"} size="sm" onClick={() => setPreviewDevice("mobile")}>
                <Smartphone className="w-4 h-4 mr-1.5" /> Mobile
              </Button>
              <Button variant={previewDevice === "desktop" ? "default" : "outline"} size="sm" onClick={() => setPreviewDevice("desktop")}>
                <Monitor className="w-4 h-4 mr-1.5" /> Desktop
              </Button>
            </div>
            <PreviewFrame device={previewDevice} />
          </div>
        );

        const ContentTab = (
          <div className="space-y-6">
            <Card className="rounded-xl">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Questions</h3>
                  <span className="text-xs text-muted-foreground">{questions.length} total</span>
                </div>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {questions.map((q) => (
                        <SortableQuestionRow
                          key={q.id}
                          q={q}
                          Icon={questionTypes.find((t) => t.type === q.type)?.icon}
                          selected={selectedQuestion === q.id}
                          onSelect={() => setSelectedQuestion(q.id)}
                          onDelete={() => deleteQuestion(q.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Add a question</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {questionTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <Button
                          key={type.type}
                          variant="outline"
                          size="sm"
                          className="flex-col h-16 gap-1"
                          onClick={() => addQuestion(type.type)}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-[11px]">{type.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {selectedQuestion && (() => {
              const q = questions.find((qq) => qq.id === selectedQuestion);
              if (!q) return null;
              const updateQ = (patch: Partial<Question>) =>
                setQuestions(questions.map((qq) => (qq.id === q.id ? { ...qq, ...patch } : qq)));
              return (
                <Card className="border-primary rounded-xl">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">Edit question</h3>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedQuestion(null)}>Done</Button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label>Type</Label>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mt-1">
                          {questionTypes.map((type) => {
                            const Icon = type.icon;
                            return (
                              <button
                                key={type.type}
                                onClick={() => updateQ({ type: type.type as Question["type"] })}
                                className={`p-2 rounded-lg border flex flex-col items-center gap-1 transition-colors ${q.type === type.type ? "border-primary bg-primary/10" : "border-border hover:border-border-hover"}`}
                              >
                                <Icon className="w-4 h-4" />
                                <span className="text-[10px] text-muted-foreground">{type.label.split(" ")[0]}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <Label>Question text</Label>
                        <Input value={q.question} onChange={(e) => updateQ({ question: e.target.value })} className="mt-1" />
                      </div>
                      <div>
                        <Label>Placeholder</Label>
                        <Input value={q.placeholder || ""} onChange={(e) => updateQ({ placeholder: e.target.value })} placeholder="e.g. Tell us about…" className="mt-1" />
                      </div>
                      <div>
                        <Label>Help text</Label>
                        <Textarea
                          value={q.helpText || ""}
                          onChange={(e) => updateQ({ helpText: e.target.value })}
                          placeholder="Coaching shown under the question to encourage specific, honest answers…"
                          rows={2}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Purpose</Label>
                        <select
                          className="w-full mt-1 p-2 rounded-lg border border-border bg-card text-sm"
                          value={q.purpose ?? "open"}
                          onChange={(e) => updateQ({ purpose: e.target.value as QuestionPurpose })}
                        >
                          {(Object.keys(PURPOSE_LABELS) as QuestionPurpose[]).map((p) => (
                            <option key={p} value={p}>{PURPOSE_LABELS[p]}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Required</Label>
                        <Switch checked={q.required} onCheckedChange={(checked) => updateQ({ required: checked })} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            <Card className="rounded-xl">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Welcome screen</h3>
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

            <Card className="rounded-xl">
              <CardContent className="p-5 space-y-4">
                <h3 className="font-semibold text-foreground">Thank-you screen</h3>
                <div className="space-y-3">
                  <Input value={settings.thankYouTitle} onChange={(e) => setSettings({ ...settings, thankYouTitle: e.target.value })} placeholder="Thank you title" />
                  <Textarea value={settings.thankYouMessage} onChange={(e) => setSettings({ ...settings, thankYouMessage: e.target.value })} placeholder="Thank you message" rows={3} />
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Confetti animation</Label>
                    <Switch checked={settings.confettiEnabled} onCheckedChange={(checked) => setSettings({ ...settings, confettiEnabled: checked })} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

        const DesignTab = (
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

        const SettingsTab = (
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
          </div>
        );

        return (
          <div className="max-w-[1600px] mx-auto p-4 md:p-6">
            {/* Mobile: tabs include Preview */}
            <div className="lg:hidden">
              <Tabs defaultValue="content">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="content">Build</TabsTrigger>
                  <TabsTrigger value="design">Design</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="content" className="mt-6">{ContentTab}</TabsContent>
                <TabsContent value="design" className="mt-6">{DesignTab}</TabsContent>
                <TabsContent value="settings" className="mt-6">{SettingsTab}</TabsContent>
                <TabsContent value="preview" className="mt-6"><PreviewPane /></TabsContent>
              </Tabs>
            </div>

            {/* Desktop: tabs + sticky preview */}
            <div className="hidden lg:grid grid-cols-12 gap-6">
              <div className="col-span-7">
                <Tabs defaultValue="content">
                  <TabsList>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="design">Design &amp; Collection</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                  </TabsList>
                  <TabsContent value="content" className="mt-6">{ContentTab}</TabsContent>
                  <TabsContent value="design" className="mt-6">{DesignTab}</TabsContent>
                  <TabsContent value="settings" className="mt-6">{SettingsTab}</TabsContent>
                </Tabs>
              </div>
              <div className="col-span-5">
                <div className="sticky top-24">
                  <PreviewPane />
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
