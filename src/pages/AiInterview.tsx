import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Send, Mic, Check, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  role: "ai" | "user";
  content: string;
}

export default function AiInterview() {
  const { slug } = useParams();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      content: "Hey there! 👋 I'm so excited to hear about your experience. Let's have a quick chat - I promise it'll be fun! First off, how has your overall experience been working with us?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [compiledTestimonial, setCompiledTestimonial] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-interview", {
        body: {
          messages: [...messages, userMessage].map((m) => ({
            role: m.role === "ai" ? "assistant" : "user",
            content: m.content,
          })),
        },
      });

      if (error) throw error;

      if (data.complete) {
        setIsComplete(true);
        setCompiledTestimonial(data.testimonial);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: Date.now().toString(), role: "ai", content: data.response },
        ]);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full border border-border rounded-2xl shadow-warm-xl">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">✨</div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Let me put that together...</h2>
            <p className="text-muted-foreground mb-6">Here's what I captured from our conversation:</p>
            <div className="bg-muted/50 rounded-xl p-6 text-left mb-6">
              <p className="text-foreground italic">"{compiledTestimonial}"</p>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 gradient-sunny text-white border-0">
                <Check className="w-4 h-4 mr-2" />
                This looks great! ✅
              </Button>
              <Button variant="outline" className="flex-1">
                <Edit className="w-4 h-4 mr-2" />
                Let me adjust ✏️
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card text-center">
        <div className="w-12 h-12 rounded-full gradient-sunny mx-auto mb-2 flex items-center justify-center text-xl">
          💛
        </div>
        <h1 className="font-semibold text-foreground">Happy Client AI</h1>
        <p className="text-sm text-muted-foreground">Let's chat about your experience!</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-2xl ${
                message.role === "user"
                  ? "gradient-sunny text-white rounded-br-md"
                  : "bg-card border border-border rounded-bl-md"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isLoading && (
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

      {/* Input */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex gap-2 max-w-lg mx-auto">
          <Button variant="outline" size="icon" className="flex-shrink-0">
            <Mic className="w-5 h-5" />
          </Button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your response..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="gradient-sunny text-white border-0"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
