import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Send, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useFormBySlug } from "@/hooks/use-forms";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  role: "ai" | "user";
  content: string;
}

const MAX_USER_MESSAGES = 12;

export default function AiInterview() {
  const { slug } = useParams<{ slug: string }>();
  const { data: form, isLoading: formLoading, error: formError } = useFormBySlug(slug ?? "");

  const [phase, setPhase] = useState<"info" | "chat" | "submitting" | "done">("info");
  const [authorName, setAuthorName] = useState("");
  const [authorEmail, setAuthorEmail] = useState("");
  const [authorCompany, setAuthorCompany] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const aiEnabled = !!(form?.custom_questions as { ai_enabled?: boolean } | null)?.ai_enabled;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (formLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Skeleton className="h-32 w-full max-w-sm" />
      </div>
    );
  }

  if (formError || !form || !aiEnabled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-14 h-14 rounded-xl bg-destructive/10 mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">AI Interview not available</h1>
          <p className="text-sm text-muted-foreground">This form doesn't have AI mode enabled, or it's been unpublished.</p>
        </div>
      </div>
    );
  }

  const startChat = () => {
    setMessages([
      {
        id: "1",
        role: "ai",
        content: `Hi ${authorName.split(" ")[0]}! Thanks for taking the time. To start — how has your overall experience been?`,
      },
    ]);
    setPhase("chat");
  };

  const submitTestimonial = async (compiled: string) => {
    setPhase("submitting");
    try {
      const { data, error } = await supabase.functions.invoke("submit-testimonial", {
        body: {
          form_slug: slug,
          author_name: authorName,
          author_email: authorEmail || undefined,
          author_company: authorCompany || undefined,
          content: compiled,
          type: "text",
          source: "ai_interview",
        },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      setPhase("done");
    } catch (err) {
      console.error("AI interview submit error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save testimonial.");
      setPhase("chat");
    }
  };

  const sendMessage = async (forceWrap = false) => {
    if ((!input.trim() && !forceWrap) || isThinking) return;
    if (userMessageCount >= MAX_USER_MESSAGES && !forceWrap) {
      toast.message("That's plenty for a great testimonial — let me wrap up.");
      return;
    }

    const userMsg: Message | null = input.trim()
      ? { id: Date.now().toString(), role: "user", content: input }
      : null;

    const nextMessages = userMsg ? [...messages, userMsg] : messages;
    setMessages(nextMessages);
    setInput("");
    setIsThinking(true);

    try {
      const apiMessages: { role: "user" | "assistant"; content: string }[] = nextMessages.map((m) => ({
        role: m.role === "ai" ? "assistant" : "user",
        content: m.content,
      }));

      if (forceWrap || nextMessages.filter((m) => m.role === "user").length >= MAX_USER_MESSAGES) {
        apiMessages.push({
          role: "user",
          content: "Please compile what we've discussed into a polished testimonial and respond with the completion JSON.",
        });
      }

      const { data, error } = await supabase.functions.invoke("ai-interview", { body: { messages: apiMessages } });
      if (error) throw error;

      if (data?.complete && data.testimonial) {
        await submitTestimonial(data.testimonial as string);
        return;
      }

      const reply: Message = {
        id: Date.now().toString() + "-ai",
        role: "ai",
        content: (data?.response as string) ?? "Tell me more about that.",
      };
      setMessages((prev) => [...prev, reply]);
    } catch (err) {
      console.error("AI interview error:", err);
      toast.error(err instanceof Error ? err.message : "Something went wrong with the AI.");
    } finally {
      setIsThinking(false);
    }
  };

  if (phase === "info") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 space-y-4">
            <div className="text-center">
              <h1 className="text-xl font-semibold text-foreground">Quick AI Interview</h1>
              <p className="text-sm text-muted-foreground mt-1">A few quick questions about you, then we'll chat.</p>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="ai-name">Your name <span className="text-destructive">*</span></Label>
                <Input id="ai-name" value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Jane Smith" />
              </div>
              <div>
                <Label htmlFor="ai-email">Email (optional)</Label>
                <Input id="ai-email" type="email" value={authorEmail} onChange={(e) => setAuthorEmail(e.target.value)} placeholder="jane@company.com" />
              </div>
              <div>
                <Label htmlFor="ai-company">Company (optional)</Label>
                <Input id="ai-company" value={authorCompany} onChange={(e) => setAuthorCompany(e.target.value)} placeholder="Acme Inc" />
              </div>
            </div>
            <Button className="w-full" disabled={!authorName.trim()} onClick={startChat}>Start chat <Send className="w-4 h-4 ml-2" /></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-14 h-14 rounded-xl bg-emerald-100 mx-auto mb-5 flex items-center justify-center">
              <Check className="w-7 h-7 text-emerald-600" strokeWidth={3} />
            </div>
            <h1 className="text-xl font-semibold text-foreground mb-2">Thank you!</h1>
            <p className="text-sm text-muted-foreground">{form.thank_you_message ?? "Your testimonial has been submitted."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="p-4 border-b border-border bg-card text-center">
        <h1 className="font-semibold text-foreground">Happy Client AI</h1>
        <p className="text-xs text-muted-foreground">
          {phase === "submitting" ? "Saving your testimonial..." : `${userMessageCount}/${MAX_USER_MESSAGES} messages`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] p-4 rounded-2xl ${m.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card border border-border rounded-bl-md"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {(isThinking || phase === "submitting") && (
          <div className="flex justify-start">
            <div className="bg-card border border-border p-4 rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border bg-card">
        <div className="flex gap-2 max-w-lg mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your response..."
            disabled={isThinking || phase === "submitting"}
          />
          <Button onClick={() => sendMessage()} disabled={!input.trim() || isThinking || phase === "submitting"}>
            <Send className="w-4 h-4" />
          </Button>
          {userMessageCount >= MAX_USER_MESSAGES - 2 && (
            <Button variant="outline" onClick={() => sendMessage(true)} disabled={isThinking || phase === "submitting"}>
              {phase === "submitting" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Wrap up"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
