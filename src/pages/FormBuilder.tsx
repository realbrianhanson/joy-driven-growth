import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCreateForm, useForm as useFormData, useUpdateForm } from "@/hooks/use-forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { PageContainer } from "@/components/shared/PageHeader";
import { ErrorState } from "@/components/shared/States";
import { FormPreview } from "@/components/form-builder/FormPreview";
import { QuestionsEditor } from "@/components/form-builder/QuestionsEditor";
import { TemplatePicker, type TemplateChoice } from "@/components/form-builder/TemplatePicker";
import { DEFAULT_BRAND_COLOR, defaultSettings, toPrompts, type FormSettings, type Question, type ReviewPlatform } from "@/components/form-builder/types";
import { DEFAULT_CONSENT_TEMPLATE } from "@/lib/consent";
import { buildReviewUrl } from "@/lib/form-config";
import { safeHex } from "@/lib/format";
import { randomSuffix, sanitizeSlugInput, slugify } from "@/lib/slug";
import { PUBLIC_APP_URL } from "@/lib/config";
import { cn } from "@/lib/utils";

const REVIEW_HELP: Record<Exclude<ReviewPlatform, "none">, string> = {
  google: "Paste your Google review link, or your Place ID (it starts with ChIJ).",
  trustpilot: "Paste your Trustpilot review page link.",
  facebook: "Paste the link to your Facebook Page reviews.",
  g2: "Paste your G2 review link.",
  capterra: "Paste your Capterra review link.",
  other: "Paste any link where clients can leave a review.",
};

function Panel({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-subtle sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
      {children && <div className="mt-5 space-y-4">{children}</div>}
    </section>
  );
}

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-sm font-medium text-foreground">{label}</span>
        {hint && <span className="block text-sm text-muted-foreground">{hint}</span>}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} className="mt-0.5 shrink-0" />
    </label>
  );
}

export default function FormBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, profile } = useAuth();
  const isNew = !id || id === "new";

  const { data: existingForm, isLoading, error, refetch } = useFormData(isNew ? "" : (id ?? ""));
  const createMutation = useCreateForm();
  const updateMutation = useUpdateForm();

  const [settings, setSettings] = useState<FormSettings>(defaultSettings);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [showTemplates, setShowTemplates] = useState(isNew);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [slugTaken, setSlugTaken] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState<string | null>(null);

  const suffix = useRef(randomSuffix());
  const logoInputRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof FormSettings>(key: K, value: FormSettings[K]) => setSettings((prev) => ({ ...prev, [key]: value }));

  const snapshot = useMemo(() => JSON.stringify({ settings, questions }), [settings, questions]);
  const dirty = initialized && savedSnapshot !== null && snapshot !== savedSnapshot;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    document.title = `${isNew ? "New form" : "Edit form"} | Happy Client`;
  }, [isNew]);

  // Load an existing form once.
  useEffect(() => {
    if (!existingForm || initialized) return;
    const root = (existingForm.custom_questions ?? {}) as Record<string, unknown>;
    const persisted = (root.settings ?? {}) as Record<string, unknown>;
    const { prompts } = toPrompts(Array.isArray(existingForm.custom_questions) ? existingForm.custom_questions : root.questions);
    const platform = (typeof persisted.review_platform === "string" ? persisted.review_platform : persisted.google_place_id ? "google" : "none") as ReviewPlatform;
    const loaded: FormSettings = {
      name: existingForm.name,
      slug: existingForm.slug,
      published: existingForm.is_published ?? false,
      logo: existingForm.logo_url ?? null,
      brandColor: safeHex(existingForm.primary_color, DEFAULT_BRAND_COLOR),
      welcomeEnabled: persisted.welcome_enabled !== false,
      welcomeTitle: existingForm.welcome_title ?? defaultSettings.welcomeTitle,
      welcomeMessage: existingForm.welcome_message ?? "",
      thankYouTitle: existingForm.thank_you_title ?? defaultSettings.thankYouTitle,
      thankYouMessage: existingForm.thank_you_message ?? "",
      confettiEnabled: persisted.confetti_enabled !== false,
      collectText: existingForm.collect_text ?? true,
      collectVideo: existingForm.collect_video ?? true,
      collectAudio: existingForm.collect_audio ?? false,
      videoMaxLength: typeof persisted.video_max_length === "number" ? persisted.video_max_length : 60,
      requireRating: existingForm.require_rating ?? true,
      requirePhoto: existingForm.require_photo ?? false,
      aiInterviewEnabled: root.ai_enabled === true,
      aiCustomPrompt: typeof root.ai_prompt === "string" ? root.ai_prompt : "",
      incentiveEnabled: existingForm.incentive_enabled ?? false,
      incentiveValue: existingForm.incentive_value ?? "",
      consentEnabled: persisted.consent_enabled !== false,
      consentText: typeof persisted.consent_text === "string" && persisted.consent_text ? persisted.consent_text : DEFAULT_CONSENT_TEMPLATE,
      nameDisplayEnabled: persisted.name_display_enabled !== false,
      reviewPlatform: platform,
      reviewUrl: typeof persisted.review_url === "string" ? persisted.review_url : typeof persisted.google_place_id === "string" ? persisted.google_place_id : "",
    };
    setSettings(loaded);
    setQuestions(prompts);
    setSavedSnapshot(JSON.stringify({ settings: loaded, questions: prompts }));
    setInitialized(true);
  }, [existingForm, initialized]);

  // A new form's link follows its name until someone edits the link by hand.
  useEffect(() => {
    if (!isNew || slugTouched) return;
    const base = slugify(settings.name, 40) || "testimonials";
    setSettings((prev) => (prev.slug === `${base}-${suffix.current}` ? prev : { ...prev, slug: `${base}-${suffix.current}` }));
  }, [isNew, slugTouched, settings.name]);

  // Check the link is free. Unpublished forms on other accounts are invisible here, so save also handles a clash.
  useEffect(() => {
    const slug = settings.slug;
    if (slug.length < 3) {
      setSlugTaken(false);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase.from("forms").select("id").eq("slug", slug).maybeSingle();
      setSlugTaken(!!data && data.id !== id);
    }, 400);
    return () => clearTimeout(timer);
  }, [settings.slug, id]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const handleTemplate = (choice: TemplateChoice) => {
    const next: FormSettings = {
      ...defaultSettings,
      name: choice.name ?? defaultSettings.name,
      requireRating: choice.requireRating,
      collectText: !choice.videoFirst,
      collectVideo: true,
    };
    setSettings(next);
    setQuestions(choice.prompts);
    setSavedSnapshot("");
    setInitialized(true);
    setShowTemplates(false);
  };

  const uploadLogo = async (file: File | undefined) => {
    if (!file || !user) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast.error("Use a PNG, JPG or WebP image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("That image is larger than 2 MB. Use a smaller one.");
      return;
    }
    setUploadingLogo(true);
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("logos").upload(path, file, { contentType: file.type, upsert: false });
    setUploadingLogo(false);
    if (uploadError) {
      toast.error("The logo did not upload. Try again.");
      return;
    }
    set("logo", supabase.storage.from("logos").getPublicUrl(path).data.publicUrl);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const validate = (): string | null => {
    if (!settings.name.trim()) return "Give the form a name.";
    if (settings.slug.length < 3) return "The link name needs at least 3 characters.";
    if (slugTaken) return "That link name is already used. Choose another one.";
    if (!settings.collectText && !settings.collectVideo && !settings.collectAudio) return "Turn on at least one format: written, video or voice.";
    if (questions.some((q) => !q.question.trim())) return "One question is empty. Write it or delete it.";
    if (settings.incentiveEnabled && !settings.incentiveValue.trim()) return "Enter the reward clients get, or turn the reward off.";
    if (settings.reviewPlatform !== "none" && !buildReviewUrl(settings.reviewPlatform, settings.reviewUrl)) return "Add a valid review link, or set the review prompt to None.";
    return null;
  };

  const handleSave = () => {
    const problem = validate();
    if (problem) {
      toast.error(problem);
      return;
    }
    const payload = {
      name: settings.name.trim(),
      slug: settings.slug,
      is_published: settings.published,
      primary_color: safeHex(settings.brandColor, DEFAULT_BRAND_COLOR),
      logo_url: settings.logo,
      welcome_title: settings.welcomeTitle.trim(),
      welcome_message: settings.welcomeMessage.trim(),
      thank_you_title: settings.thankYouTitle.trim(),
      thank_you_message: settings.thankYouMessage.trim(),
      collect_text: settings.collectText,
      collect_video: settings.collectVideo,
      collect_audio: settings.collectAudio,
      require_rating: settings.requireRating,
      require_photo: settings.requirePhoto,
      incentive_enabled: settings.incentiveEnabled,
      incentive_type: "discount",
      incentive_value: settings.incentiveValue.trim(),
      custom_questions: JSON.parse(
        JSON.stringify({
          ai_enabled: settings.aiInterviewEnabled,
          ai_prompt: settings.aiCustomPrompt.trim(),
          questions: questions.map((q) => ({ ...q, question: q.question.trim() })),
          settings: {
            welcome_enabled: settings.welcomeEnabled,
            confetti_enabled: settings.confettiEnabled,
            video_max_length: settings.videoMaxLength,
            consent_enabled: settings.consentEnabled,
            consent_text: settings.consentText,
            name_display_enabled: settings.nameDisplayEnabled,
            review_platform: settings.reviewPlatform,
            review_url: settings.reviewUrl.trim(),
          },
        }),
      ),
    };

    const onError = (err: unknown) => {
      const code = (err as { code?: string } | null)?.code;
      toast.error(code === "23505" ? "That link name is already used. Choose another one in Settings." : "The form did not save. Try again.");
    };

    if (isNew) {
      createMutation.mutate(payload, {
        onSuccess: (form) => {
          setSavedSnapshot(snapshot);
          navigate(`/dashboard/forms?share=${form.id}&new=1`);
        },
        onError,
      });
    } else {
      updateMutation.mutate(
        { id: id!, ...payload },
        {
          onSuccess: () => {
            setSavedSnapshot(snapshot);
            toast.success("Form saved");
          },
          onError,
        },
      );
    }
  };

  const goBack = () => {
    if (dirty && !window.confirm("You have changes that are not saved. Leave without saving?")) return;
    navigate("/dashboard/forms");
  };

  if (!isNew && isLoading) {
    return (
      <PageContainer>
        <div className="space-y-4" role="status" aria-label="Loading form">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </PageContainer>
    );
  }

  if (!isNew && (error || (!isLoading && !existingForm))) {
    return (
      <PageContainer>
        <ErrorState title="This form did not load" error={error ?? new Error("It may have been deleted.")} onRetry={() => void refetch()} />
        <div className="mt-4 text-center">
          <Button variant="ghost" onClick={() => navigate("/dashboard/forms")}>
            <ArrowLeft className="mr-1.5" /> Back to forms
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (isNew && showTemplates) {
    return <TemplatePicker onBack={() => navigate("/dashboard/forms")} onPick={handleTemplate} />;
  }

  const link = `${PUBLIC_APP_URL}/collect/${settings.slug}`;

  const questionsTab = (
    <div className="space-y-5">
      <Panel title="Questions" description="Clients answer these in writing. On video, they see them as talking points.">
        <QuestionsEditor questions={questions} onChange={setQuestions} />
      </Panel>

      <Panel title="Formats" description="How clients can answer.">
        <ToggleRow label="Written" checked={settings.collectText} onChange={(v) => set("collectText", v)} />
        <ToggleRow label="Video" hint="Recorded in the browser, or uploaded from their phone." checked={settings.collectVideo} onChange={(v) => set("collectVideo", v)} />
        <ToggleRow label="Voice only" hint="For clients who do not want to be on camera." checked={settings.collectAudio} onChange={(v) => set("collectAudio", v)} />
        {(settings.collectVideo || settings.collectAudio) && (
          <div className="border-t border-border-subtle pt-4">
            <Label>Longest recording: {settings.videoMaxLength} seconds</Label>
            <Slider className="mt-3" value={[settings.videoMaxLength]} onValueChange={([v]) => set("videoMaxLength", v)} min={30} max={180} step={15} aria-label="Longest recording in seconds" />
          </div>
        )}
      </Panel>

      <Panel title="Rating and photo">
        <ToggleRow label="Require a star rating" hint="Off means clients can skip the stars." checked={settings.requireRating} onChange={(v) => set("requireRating", v)} />
        <ToggleRow label="Require a photo" hint="Off means the photo is optional. Most clients skip it." checked={settings.requirePhoto} onChange={(v) => set("requirePhoto", v)} />
      </Panel>

      <Panel
        title="Guided interview"
        description="For clients who do not know what to write. An AI assistant asks follow-up questions and drafts the testimonial. The client reads it and approves it."
        action={<Switch checked={settings.aiInterviewEnabled} onCheckedChange={(v) => set("aiInterviewEnabled", v)} aria-label="Guided interview" />}
      >
        {settings.aiInterviewEnabled && (
          <div>
            <Label htmlFor="ai-prompt">
              What should it ask about? <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea id="ai-prompt" className="mt-1.5 resize-y" rows={3} maxLength={1000} value={settings.aiCustomPrompt} onChange={(e) => set("aiCustomPrompt", e.target.value)} placeholder="Example: We are a roofing company. Ask how fast we responded and how the crew treated their home." />
          </div>
        )}
      </Panel>
    </div>
  );

  const lookTab = (
    <div className="space-y-5">
      <Panel title="Brand">
        <div>
          <Label htmlFor="brand-color">Button colour</Label>
          <div className="mt-1.5 flex items-center gap-2">
            <input
              id="brand-color"
              type="color"
              value={safeHex(settings.brandColor, DEFAULT_BRAND_COLOR)}
              onChange={(e) => set("brandColor", e.target.value)}
              className="h-10 w-12 cursor-pointer rounded-lg border border-input bg-card p-1"
            />
            <Input value={settings.brandColor} onChange={(e) => set("brandColor", e.target.value)} className="w-32 font-mono" aria-label="Button colour hex code" maxLength={7} />
          </div>
        </div>
        <div>
          <Label>Logo</Label>
          <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => void uploadLogo(e.target.files?.[0])} aria-label="Upload a logo" />
          <div className="mt-1.5 flex items-center gap-3">
            {settings.logo && (
              <span className="flex h-12 items-center rounded-lg border border-border bg-background px-3">
                <img src={settings.logo} alt="Your logo" className="h-8 max-w-[10rem] object-contain" />
              </span>
            )}
            <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>
              {uploadingLogo ? <Loader2 className="mr-1.5 animate-spin" /> : <ImagePlus className="mr-1.5" />}
              {settings.logo ? "Replace" : "Upload logo"}
            </Button>
            {settings.logo && (
              <Button type="button" variant="ghost" size="sm" onClick={() => set("logo", null)}>
                <Trash2 className="mr-1.5" /> Remove
              </Button>
            )}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">PNG, JPG or WebP, up to 2 MB. Without a logo, the form shows your business name.</p>
        </div>
      </Panel>

      <Panel
        title="Welcome screen"
        description="The first thing clients see."
        action={<Switch checked={settings.welcomeEnabled} onCheckedChange={(v) => set("welcomeEnabled", v)} aria-label="Welcome screen" />}
      >
        {settings.welcomeEnabled && (
          <>
            <div>
              <Label htmlFor="welcome-title">Headline</Label>
              <Input id="welcome-title" className="mt-1.5" value={settings.welcomeTitle} onChange={(e) => set("welcomeTitle", e.target.value)} maxLength={80} />
            </div>
            <div>
              <Label htmlFor="welcome-message">Message</Label>
              <Textarea id="welcome-message" className="mt-1.5 resize-y" rows={2} value={settings.welcomeMessage} onChange={(e) => set("welcomeMessage", e.target.value)} maxLength={300} />
            </div>
          </>
        )}
      </Panel>

      <Panel title="Thank-you screen" description="Shown after they send it.">
        <div>
          <Label htmlFor="thanks-title">Headline</Label>
          <Input id="thanks-title" className="mt-1.5" value={settings.thankYouTitle} onChange={(e) => set("thankYouTitle", e.target.value)} maxLength={80} />
        </div>
        <div>
          <Label htmlFor="thanks-message">Message</Label>
          <Textarea id="thanks-message" className="mt-1.5 resize-y" rows={2} value={settings.thankYouMessage} onChange={(e) => set("thankYouMessage", e.target.value)} maxLength={300} />
        </div>
        <ToggleRow label="Confetti" hint="A short burst when they finish. It is skipped for low ratings." checked={settings.confettiEnabled} onChange={(v) => set("confettiEnabled", v)} />
      </Panel>
    </div>
  );

  const settingsTab = (
    <div className="space-y-5">
      <Panel title="Link" description="The address you send to clients.">
        <div>
          <Label htmlFor="form-slug">Link name</Label>
          <div className="mt-1.5 flex items-center">
            <span className="flex h-10 items-center rounded-l-lg border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">/collect/</span>
            <Input
              id="form-slug"
              value={settings.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", sanitizeSlugInput(e.target.value));
              }}
              className={cn("rounded-l-none font-mono", slugTaken && "border-destructive")}
              aria-invalid={slugTaken || undefined}
            />
          </div>
          {slugTaken ? (
            <p role="alert" className="mt-1.5 text-sm text-destructive">That link name is already used. Choose another one.</p>
          ) : (
            <p className="mt-1.5 break-all text-xs text-muted-foreground">{link}</p>
          )}
          {!isNew && <p className="mt-1.5 text-xs text-muted-foreground">If you change it, links and QR codes you already sent stop working.</p>}
        </div>
      </Panel>

      <Panel title="Permission" description="Get it in writing when they submit, so you never have to ask later.">
        <ToggleRow label="Ask for permission to publish" hint="Clients tick a box to agree before they send." checked={settings.consentEnabled} onChange={(v) => set("consentEnabled", v)} />
        {settings.consentEnabled && (
          <div>
            <Label htmlFor="consent-text">What they agree to</Label>
            <Textarea id="consent-text" className="mt-1.5 resize-y text-sm md:text-sm" rows={5} value={settings.consentText} onChange={(e) => set("consentText", e.target.value)} maxLength={2000} />
            <p className="mt-1.5 text-xs text-muted-foreground">
              <code className="rounded bg-muted px-1 py-0.5">{"{company}"}</code> becomes your business name. This is a plain-language default. Ask a lawyer if you need more.
            </p>
          </div>
        )}
        <ToggleRow label="Let them choose how their name appears" hint="Full name, first name and initial, or anonymous." checked={settings.nameDisplayEnabled} onChange={(v) => set("nameDisplayEnabled", v)} />
      </Panel>

      <Panel
        title="Thank-you reward"
        description="A discount code or gift shown after they submit."
        action={<Switch checked={settings.incentiveEnabled} onCheckedChange={(v) => set("incentiveEnabled", v)} aria-label="Thank-you reward" />}
      >
        {settings.incentiveEnabled && (
          <div>
            <Label htmlFor="incentive-value">Code or reward</Label>
            <Input id="incentive-value" className="mt-1.5" value={settings.incentiveValue} onChange={(e) => set("incentiveValue", e.target.value)} placeholder="THANKYOU10" maxLength={80} />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Give the reward for any honest testimonial, good or bad, and say that the client got a reward when you publish it. FTC rules in the US cover both points.
            </p>
          </div>
        )}
      </Panel>

      <Panel title="Public review prompt" description="After they submit, invite every client to post on a review site too.">
        <div>
          <Label htmlFor="review-platform">Review site</Label>
          <Select value={settings.reviewPlatform} onValueChange={(v) => set("reviewPlatform", v as ReviewPlatform)}>
            <SelectTrigger id="review-platform" className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="trustpilot">Trustpilot</SelectItem>
              <SelectItem value="g2">G2</SelectItem>
              <SelectItem value="capterra">Capterra</SelectItem>
              <SelectItem value="other">Another site</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {settings.reviewPlatform !== "none" && (
          <div>
            <Label htmlFor="review-url">Review link</Label>
            <Input id="review-url" className="mt-1.5 font-mono text-sm md:text-sm" value={settings.reviewUrl} onChange={(e) => set("reviewUrl", e.target.value)} placeholder="https://" />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {REVIEW_HELP[settings.reviewPlatform]} Every client sees this prompt, whatever rating they gave. Sites such as Google do not allow asking only happy clients.
            </p>
          </div>
        )}
      </Panel>
    </div>
  );

  const preview = <FormPreview settings={settings} questions={questions} company={profile?.company_name ?? null} />;

  return (
    <div>
      <div className="sticky top-14 z-30 border-b border-border bg-card/95 backdrop-blur md:top-0">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-6">
          <Button variant="ghost" size="sm" onClick={goBack} className="-ml-2">
            <ArrowLeft className="mr-1" /> Forms
          </Button>
          <Label htmlFor="form-name" className="sr-only">Form name</Label>
          <Input
            id="form-name"
            value={settings.name}
            onChange={(e) => set("name", e.target.value)}
            maxLength={80}
            className="h-9 min-w-0 flex-1 border-transparent bg-transparent px-2 text-base font-semibold hover:border-input focus-visible:bg-card sm:max-w-sm"
          />
          <div className="ml-auto flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Switch checked={settings.published} onCheckedChange={(v) => set("published", v)} />
              <span className="hidden sm:inline">{settings.published ? "Accepting answers" : "Turned off"}</span>
            </label>
            {!isNew && (
              <Button asChild variant="outline" size="sm">
                <a href={link} target="_blank" rel="noopener noreferrer">
                  Open <ExternalLink className="ml-1.5" />
                </a>
              </Button>
            )}
            <Button size="sm" onClick={handleSave} disabled={isSaving || (!isNew && !dirty)}>
              {isSaving && <Loader2 className="mr-1.5 animate-spin" />}
              {isNew ? "Save form" : dirty ? "Save changes" : "Saved"}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Tabs defaultValue="questions">
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="questions" className="flex-1 sm:flex-none">Questions</TabsTrigger>
                <TabsTrigger value="look" className="flex-1 sm:flex-none">Look</TabsTrigger>
                <TabsTrigger value="settings" className="flex-1 sm:flex-none">Settings</TabsTrigger>
                <TabsTrigger value="preview" className="flex-1 sm:flex-none lg:hidden">Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="questions" className="mt-5">{questionsTab}</TabsContent>
              <TabsContent value="look" className="mt-5">{lookTab}</TabsContent>
              <TabsContent value="settings" className="mt-5">{settingsTab}</TabsContent>
              <TabsContent value="preview" className="mt-5 lg:hidden">{preview}</TabsContent>
            </div>
            <aside className="hidden lg:col-span-5 lg:block" aria-label="Preview">
              <div className="sticky top-20">
                <p className="eyebrow mb-2">What clients see</p>
                <div className="max-h-[calc(100vh-8rem)] overflow-y-auto rounded-2xl scrollbar-thin">{preview}</div>
              </div>
            </aside>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
