import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useForm as useFormData, useCreateForm, useUpdateForm } from "@/hooks/use-forms";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_CONSENT_TEMPLATE } from "@/lib/consent";
import {
  defaultQuestions,
  defaultSettings,
  type FormSettings,
  type Question,
} from "@/components/form-builder/types";
import { TemplatePicker } from "@/components/form-builder/TemplatePicker";
import { BuilderHeader } from "@/components/form-builder/BuilderHeader";
import { PreviewPane } from "@/components/form-builder/PreviewPane";
import { ContentTab } from "@/components/form-builder/ContentTab";
import { DesignTab } from "@/components/form-builder/DesignTab";
import { SettingsTab } from "@/components/form-builder/SettingsTab";

export default function FormBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isNew = !id || id === "new";

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
        reviewPlatform:
          persisted.review_platform ??
          (persisted.google_place_id ? "google" : "none"),
        reviewUrl:
          persisted.review_url ??
          (persisted.google_place_id ?? ""),
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
          review_platform: settings.reviewPlatform,
          review_url: settings.reviewUrl,
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
    return (
      <TemplatePicker
        onBack={() => navigate("/dashboard/forms")}
        onPick={(qs, nameOverride) => {
          setQuestions(qs);
          setSettings((s) => ({ ...s, name: nameOverride ?? s.name }));
          setShowTemplatePicker(false);
        }}
      />
    );
  }

  const slugUrl = `${window.location.origin}/collect/${settings.slug}`;
  const aiUrl = `${window.location.origin}/collect/${settings.slug}/ai`;

  const contentTab = (
    <ContentTab
      questions={questions}
      setQuestions={setQuestions}
      selectedQuestion={selectedQuestion}
      setSelectedQuestion={setSelectedQuestion}
      settings={settings}
      setSettings={setSettings}
    />
  );
  const designTab = (
    <DesignTab
      settings={settings}
      setSettings={setSettings}
      slugTaken={slugTaken}
      checkingSlug={checkingSlug}
      copySlug={copySlug}
    />
  );
  const settingsTab = (
    <SettingsTab settings={settings} setSettings={setSettings} slugUrl={slugUrl} aiUrl={aiUrl} />
  );
  const previewPane = (
    <PreviewPane
      settings={settings}
      questions={questions}
      previewDevice={previewDevice}
      setPreviewDevice={setPreviewDevice}
    />
  );

  return (
    <div className="min-h-screen bg-background">
      <BuilderHeader
        settings={settings}
        setSettings={setSettings}
        onBack={() => navigate("/dashboard/forms")}
        onPreview={() => window.open(`/collect/${settings.slug}`, "_blank")}
        onSave={handleSave}
        isSaving={isSaving}
      />

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
            <TabsContent value="content" className="mt-6">{contentTab}</TabsContent>
            <TabsContent value="design" className="mt-6">{designTab}</TabsContent>
            <TabsContent value="settings" className="mt-6">{settingsTab}</TabsContent>
            <TabsContent value="preview" className="mt-6">{previewPane}</TabsContent>
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
              <TabsContent value="content" className="mt-6">{contentTab}</TabsContent>
              <TabsContent value="design" className="mt-6">{designTab}</TabsContent>
              <TabsContent value="settings" className="mt-6">{settingsTab}</TabsContent>
            </Tabs>
          </div>
          <div className="col-span-5">
            <div className="sticky top-24">
              {previewPane}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}