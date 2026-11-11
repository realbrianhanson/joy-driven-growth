import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Loader2, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useFormBySlug } from "@/hooks/use-forms";
import { StarInput } from "@/components/shared/Stars";
import { LogoMark } from "@/components/shared/Logo";
import { PublicNotice } from "@/components/shared/PublicNotice";
import { DISPLAY_PREFERENCE_OPTIONS, renderConsentText, type DisplayPreference } from "@/lib/consent";
import { parseFormConfig, readFunctionErrorCode, submitErrorMessage } from "@/lib/form-config";
import { readableTextColor, safeHex } from "@/lib/format";
import { maskName } from "@/lib/testimonial";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "ai" | "user";
  content: string;
}

interface Draft {
  text: string;
  pullQuote: string | null;
  oneLiner: string | null;
}

type Phase = "intro" | "chat" | "review" | "sending" | "done";

const MAX_USER_MESSAGES = 12;
const MIN_MESSAGES_TO_FINISH = 2;

function aiErrorMessage(code: string | null): string {
  const c = (code ?? "").toLowerCase();
  if (c.includes("rate")) return "The assistant is busy. Wait a few seconds, then send again.";
  if (c.includes("credit") || c.includes("unavailable") || c.includes("not_configured")) {
    return "The assistant is not available right now. You can write your testimonial instead.";
  }
  if (c.includes("invalid_messages")) return "That message did not go through. Shorten it, then send again.";
  if (c.includes("form_not_found")) return "This form is no longer accepting responses.";
  return "The assistant did not answer. Send your message again.";
}

/**
 * A short guided chat that drafts a testimonial from the customer's own answers.
 * The customer reads, edits and approves the draft before anything is saved
 * under their name.
 */
export default function AiInterview() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { data: form, isLoading, error } = useFormBySlug(slug);

  const { data: ownerCompany } = useQuery({
    queryKey: ["form-owner-company", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_form_owner_company", { p_slug: slug });
      if (error) return null;
      return (data as string | null) ?? null;
    },
  });

  const [phase, setPhase] = useState<Phase>("intro");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [authorCompany, setAuthorCompany] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editedText, setEditedText] = useState("");
  const [rating, setRating] = useState(0);
  const [consentChecked, setConsentChecked] = useState(false);
  const [displayPreference, setDisplayPreference] = useState<DisplayPreference>("full");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showProblems, setShowProblems] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const config = useMemo(() => parseFormConfig(form?.custom_questions), [form?.custom_questions]);
  const userMessageCount = messages.filter((m) => m.role === "user").length;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isThinking]);

  useEffect(() => {
    if (phase !== "chat") window.scrollTo({ top: 0 });
  }, [phase]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4" role="status" aria-label="Loading">
        <Skeleton className="h-72 w-full max-w-xl rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <PublicNotice
        tone="error"
        title="This page did not load"
        message="Check your connection, then try again."
        action={<Button onClick={() => window.location.reload()}>Try again</Button>}
      />
    );
  }

  if (!form || !config.aiEnabled) {
    return (
      <PublicNotice
        title="This interview is not available"
        message="The guided interview is turned off for this form, or the link is wrong."
        action={
          form ? (
            <Button asChild>
              <Link to={`/collect/${slug}`}>Write a testimonial instead</Link>
            </Button>
          ) : undefined
        }
      />
    );
  }

  const company = ownerCompany?.trim() || form.name;
  const brand = safeHex(form.primary_color, "#1A1714");
  const brandButton = { backgroundColor: brand, color: readableTextColor(brand) };
  const consentText = renderConsentText(config.consentText, ownerCompany);
  const firstName = authorName.trim().split(/\s+/)[0] || "there";

  const startChat = () => {
    setMessages([
      {
        id: "intro",
        role: "ai",
        content: `Hi ${firstName}. Thanks for doing this. To start: what was going on before you started working with ${company}?`,
      },
    ]);
    setPhase("chat");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const sendMessage = async (wrapUp = false) => {
    const text = input.trim();
    if ((!text && !wrapUp) || isThinking) return;
    setChatError(null);

    const nextMessages: Message[] = text ? [...messages, { id: crypto.randomUUID(), role: "user", content: text }] : messages;
    setMessages(nextMessages);
    setInput("");
    setIsThinking(true);

    try {
      const apiMessages: { role: "user" | "assistant"; content: string }[] = nextMessages.map((m) => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.content,
      }));
      const atLimit = nextMessages.filter((m) => m.role === "user").length >= MAX_USER_MESSAGES;
      if (wrapUp || atLimit) {
        apiMessages.push({
          role: "user",
          content: "Please compile what we've discussed into a polished testimonial and respond with the completion JSON.",
        });
      }

      const { data, error: invokeError } = await supabase.functions.invoke("ai-interview", {
        body: { messages: apiMessages, form_context: config.aiPrompt ?? undefined, form_slug: slug },
      });
      if (invokeError) throw invokeError;

      const result = data as {
        complete?: boolean;
        testimonial?: string;
        pull_quote?: string | null;
        one_liner?: string | null;
        response?: string;
        error?: string;
      } | null;

      if (result?.error) {
        setChatError(aiErrorMessage(result.error));
        return;
      }

      if (result?.complete && result.testimonial?.trim()) {
        const drafted = result.testimonial.trim();
        setDraft({ text: drafted, pullQuote: result.pull_quote ?? null, oneLiner: result.one_liner ?? null });
        setEditedText(drafted);
        setPhase("review");
        return;
      }

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "ai", content: result?.response?.trim() || "Tell me a little more about that." },
      ]);
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch (err) {
      console.error("AI interview error:", err);
      setChatError(aiErrorMessage(await readFunctionErrorCode(err)));
    } finally {
      setIsThinking(false);
    }
  };

  const reviewProblem: string | null = (() => {
    if (editedText.trim().length < 15) return "The testimonial is too short. Add a sentence or two.";
    if (editedText.trim().length > 4000) return "That is over 4,000 characters. Trim it a little.";
    if (form.require_rating && rating === 0) return "Choose a star rating.";
    if (config.consentEnabled && !consentChecked) return "Tick the box to give permission.";
    return null;
  })();

  const submit = async () => {
    if (reviewProblem) {
      setShowProblems(true);
      return;
    }
    setSubmitError(null);
    setPhase("sending");
    const finalText = editedText.trim();
    const unchanged = draft?.text === finalText;
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("submit-testimonial", {
        body: {
          form_slug: slug,
          author_name: authorName.trim(),
          author_email: authorEmail.trim() || undefined,
          author_company: authorCompany.trim() || undefined,
          content: finalText,
          rating: rating >= 1 ? rating : undefined,
          type: "text",
          source: "ai_interview",
          already_developed: true,
          developed_content: finalText,
          developed_pull_quote: unchanged ? (draft?.pullQuote ?? undefined) : undefined,
          developed_one_liner: unchanged ? (draft?.oneLiner ?? undefined) : undefined,
          consent_given: config.consentEnabled ? consentChecked : false,
          consent_text: config.consentEnabled ? consentText : undefined,
          display_preference: config.nameDisplayEnabled ? displayPreference : "full",
        },
      });
      if (invokeError) throw invokeError;
      const code = (data as { error?: string } | null)?.error;
      if (code) {
        setSubmitError(submitErrorMessage(code));
        setPhase("review");
        return;
      }
      setPhase("done");
    } catch (err) {
      console.error("AI interview submit error:", err);
      setSubmitError(submitErrorMessage(await readFunctionErrorCode(err)));
      setPhase("review");
    }
  };

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-background">
      <div className="h-1 w-full" style={{ backgroundColor: brand }} aria-hidden="true" />
      <main className="mx-auto w-full max-w-xl px-4 pb-10 pt-8 sm:pt-12">
        <header className="mb-6 flex items-center justify-center">
          {form.logo_url ? (
            <img src={form.logo_url} alt={company} className="h-10 max-w-[12rem] object-contain" />
          ) : (
            <p className="display text-2xl text-foreground">{company}</p>
          )}
        </header>
        <div className="rounded-2xl border border-border bg-card shadow-subtle">{children}</div>
        <footer className="mt-8 text-center">
          <a href="/" target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <LogoMark className="h-3.5 w-3.5" />
            Collected with Happy Client
          </a>
        </footer>
      </main>
    </div>
  );

  if (phase === "intro") {
    return shell(
      <form
        className="px-6 py-7 sm:px-8 sm:py-9"
        onSubmit={(e) => {
          e.preventDefault();
          if (authorName.trim()) startChat();
        }}
      >
        <h1 className="display text-[1.85rem] text-foreground text-balance">A quick guided interview</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          An AI assistant asks you about five short questions, then writes a draft from your answers. You read it and
          change anything before it is sent.
        </p>
        <div className="mt-6 space-y-4">
          <div>
            <Label htmlFor="ai-name">
              Your name <span className="text-destructive">*</span>
            </Label>
            <Input id="ai-name" className="mt-1.5" value={authorName} onChange={(e) => setAuthorName(e.target.value)} autoComplete="name" maxLength={200} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="ai-email">
                Email <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input id="ai-email" type="email" className="mt-1.5" value={authorEmail} onChange={(e) => setAuthorEmail(e.target.value)} autoComplete="email" maxLength={200} />
            </div>
            <div>
              <Label htmlFor="ai-company">
                Company <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input id="ai-company" className="mt-1.5" value={authorCompany} onChange={(e) => setAuthorCompany(e.target.value)} autoComplete="organization" maxLength={200} />
            </div>
          </div>
        </div>
        <div className="mt-8 flex items-center justify-between gap-3">
          <Button asChild variant="ghost">
            <Link to={`/collect/${slug}`}>
              <ArrowLeft className="mr-1.5" /> Write it myself
            </Link>
          </Button>
          <Button type="submit" size="lg" disabled={!authorName.trim()} style={brandButton}>
            Start <ArrowRight className="ml-1.5" />
          </Button>
        </div>
      </form>,
    );
  }

  if (phase === "done") {
    return shell(
      <div className="px-6 py-10 text-center sm:px-8">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full" style={brandButton}>
          <Check className="h-7 w-7" strokeWidth={2.5} />
        </div>
        <h1 className="display text-[2.1rem] text-foreground">{form.thank_you_title?.trim() || "Thank you"}</h1>
        <p className="mx-auto mt-3 max-w-md text-base text-muted-foreground">
          {form.thank_you_message?.trim() || `${company} has your testimonial. It means a lot.`}
        </p>
      </div>,
    );
  }

  if (phase === "sending") {
    return shell(
      <div className="px-6 py-14 text-center" role="status" aria-live="polite">
        <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-base font-medium text-foreground">Sending your testimonial</p>
      </div>,
    );
  }

  if (phase === "review") {
    return shell(
      <div className="px-6 py-7 sm:px-8 sm:py-9">
        <h1 className="display text-[1.85rem] text-foreground text-balance">Here is your draft</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Written from what you said. Change anything that is not true or does not sound like you.
        </p>

        <Label htmlFor="ai-draft" className="sr-only">
          Your testimonial
        </Label>
        <Textarea id="ai-draft" className="mt-5 resize-y" rows={9} maxLength={4000} value={editedText} onChange={(e) => setEditedText(e.target.value)} />

        <div className="mt-7">
          <p className="mb-2 text-center text-sm font-medium text-foreground">
            How would you rate your experience?
            {form.require_rating && <span className="ml-1 text-destructive">*</span>}
          </p>
          <StarInput value={rating} onChange={setRating} label="Your rating" />
        </div>

        {config.nameDisplayEnabled && (
          <fieldset className="mt-7">
            <legend className="mb-2.5 text-sm font-medium text-foreground">How should your name appear?</legend>
            <div className="space-y-2">
              {DISPLAY_PREFERENCE_OPTIONS.map((option) => {
                const selected = displayPreference === option.value;
                return (
                  <label
                    key={option.value}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors",
                      selected ? "border-foreground bg-muted/40" : "border-border hover:border-border-hover",
                    )}
                  >
                    <input
                      type="radio"
                      name="display_preference"
                      value={option.value}
                      checked={selected}
                      onChange={() => setDisplayPreference(option.value)}
                      className="mt-1 h-4 w-4 accent-[hsl(var(--foreground))]"
                    />
                    <span>
                      <span className="block text-sm font-medium text-foreground">{option.label}</span>
                      <span className="block text-sm text-muted-foreground">Shown as: {maskName(authorName, option.value)}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        {config.consentEnabled && (
          <label
            className={cn(
              "mt-6 flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 transition-colors",
              consentChecked ? "border-foreground bg-muted/40" : "border-border hover:border-border-hover",
              showProblems && !consentChecked && "border-destructive",
            )}
          >
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-[hsl(var(--foreground))]"
            />
            <span className="text-sm leading-relaxed text-foreground">{consentText}</span>
          </label>
        )}

        {(submitError || (showProblems && reviewProblem)) && (
          <p role="alert" className="mt-6 rounded-lg border border-destructive/25 bg-destructive-light px-3.5 py-2.5 text-sm text-destructive">
            {submitError ?? reviewProblem}
          </p>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button type="button" variant="ghost" onClick={() => setPhase("chat")}>
            <ArrowLeft className="mr-1.5" /> Back to chat
          </Button>
          <Button type="button" size="lg" onClick={submit} className={cn(reviewProblem && "opacity-60")} style={brandButton}>
            Send testimonial
          </Button>
        </div>
      </div>,
    );
  }

  // Chat
  const canFinish = userMessageCount >= MIN_MESSAGES_TO_FINISH;
  const atLimit = userMessageCount >= MAX_USER_MESSAGES;

  return shell(
    <div className="flex h-[min(70vh,640px)] flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-3">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-gold-deep" />
          AI assistant for {company}
        </p>
        {canFinish && (
          <Button type="button" variant="outline" size="sm" onClick={() => sendMessage(true)} disabled={isThinking}>
            Finish and see my draft
          </Button>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5 scrollbar-thin" role="log" aria-live="polite" aria-label="Conversation">
        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-[0.9375rem] leading-relaxed",
                m.role === "user" ? "rounded-br-md" : "rounded-bl-md bg-muted text-foreground",
              )}
              style={m.role === "user" ? brandButton : undefined}
            >
              {m.content}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-start" role="status" aria-label="The assistant is typing">
            <div className="flex gap-1 rounded-2xl rounded-bl-md bg-muted px-4 py-3.5">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${i * 120}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border-subtle px-4 py-3">
        {chatError && (
          <p role="alert" className="mb-2 text-sm text-destructive">
            {chatError}
          </p>
        )}
        {atLimit ? (
          <Button type="button" className="w-full" size="lg" onClick={() => sendMessage(true)} disabled={isThinking} style={brandButton}>
            {isThinking ? <Loader2 className="mr-2 animate-spin" /> : null}
            See my draft
          </Button>
        ) : (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage();
            }}
          >
            <Label htmlFor="ai-message" className="sr-only">
              Your answer
            </Label>
            <Input
              id="ai-message"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your answer"
              disabled={isThinking}
              autoComplete="off"
              maxLength={2000}
            />
            <Button type="submit" size="icon" disabled={!input.trim() || isThinking} aria-label="Send" style={brandButton}>
              <Send />
            </Button>
          </form>
        )}
      </div>
    </div>,
  );
}
