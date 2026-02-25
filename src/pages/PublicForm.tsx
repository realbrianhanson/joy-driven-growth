import { useState } from "react";
import { useParams } from "react-router-dom";
import { Star, ArrowRight, ArrowLeft, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import confetti from "canvas-confetti";
import { VideoRecorder } from "@/components/testimonials/VideoRecorder";
import { AudioRecorder } from "@/components/testimonials/AudioRecorder";

type FormStep = "sentiment" | "welcome" | "question" | "thankyou";
type QuestionType = "short_text" | "long_text" | "rating" | "video" | "audio" | "multiple_choice";

interface Question {
  id: string;
  type: QuestionType;
  question: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: string[];
}

const mockFormData = {
  name: "Customer Success Story",
  logo: null,
  brandColor: "#6366F1",
  welcomeTitle: "Hey there!",
  welcomeMessage: "We'd love to hear about your experience. It'll only take a minute!",
  thankYouTitle: "Thank you!",
  thankYouMessage: "Thank you so much for sharing your story. It means the world to us!",
  confettiEnabled: true,
  reviewRoutingEnabled: true,
  positiveThreshold: 4,
  incentiveEnabled: true,
  incentiveCode: "THANKYOU20",
  questions: [
    { id: "1", type: "rating" as QuestionType, question: "How would you rate your overall experience?", required: true },
    { id: "2", type: "long_text" as QuestionType, question: "What did you enjoy most about working with us?", placeholder: "Tell us about your experience...", required: true },
    { id: "3", type: "short_text" as QuestionType, question: "What results did you achieve?", placeholder: "e.g., Saved 10 hours per week", required: false },
    { id: "4", type: "multiple_choice" as QuestionType, question: "Would you recommend us to others?", options: ["Absolutely!", "Probably", "Maybe", "Not sure"], required: true },
  ] as Question[],
};

export default function PublicForm() {
  const { slug } = useParams();
  const [step, setStep] = useState<FormStep>("sentiment");
  const [sentimentScore, setSentimentScore] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [copiedCode, setCopiedCode] = useState(false);

  const formData = mockFormData;
  const questions = formData.questions;
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleSentiment = (score: number) => {
    setSentimentScore(score);
    if (score >= formData.positiveThreshold) {
      setStep("welcome");
    } else {
      setStep("thankyou");
    }
  };

  const fireConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 },
      colors: ["#6366F1", "#818CF8", "#A5B4FC", "#16A34A", "#D97706"],
    });
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setStep("thankyou");
      if (formData.confettiEnabled) setTimeout(fireConfetti, 300);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
    else setStep("welcome");
  };

  const copyCode = () => {
    navigator.clipboard.writeText(formData.incentiveCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* SENTIMENT GATE */}
        {step === "sentiment" && formData.reviewRoutingEnabled && (
          <div className="bg-card rounded-xl shadow-subtle border p-8 animate-fade-in text-center">
            <div className="w-14 h-14 rounded-xl bg-primary-light mx-auto mb-5 flex items-center justify-center">
              <Star className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              How was your experience?
            </h2>
            <p className="text-sm text-muted-foreground mb-6">Let us know how we did</p>

            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleSentiment(star)}
                  className="group"
                >
                  <Star
                    className={`w-10 h-10 transition-all duration-150 group-hover:scale-110 ${
                      sentimentScore && sentimentScore >= star
                        ? "fill-warning text-warning"
                        : "text-muted-foreground/40 group-hover:text-warning"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* WELCOME */}
        {step === "welcome" && (
          <div className="bg-card rounded-xl shadow-subtle border p-8 animate-fade-in text-center">
            <div className="w-14 h-14 rounded-xl bg-primary-light mx-auto mb-5 flex items-center justify-center">
              <span className="text-primary text-xl font-bold">T</span>
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {formData.welcomeTitle}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {formData.welcomeMessage}
            </p>
            <Button onClick={() => setStep("question")} className="w-full">
              Get Started <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <p className="text-xs text-muted-foreground mt-3">Takes about 2 minutes</p>
          </div>
        )}

        {/* QUESTIONS */}
        {step === "question" && (
          <div className="bg-card rounded-xl shadow-subtle border overflow-hidden animate-fade-in">
            <div className="p-4 border-b">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Question {currentQuestion + 1} of {questions.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="p-8">
              {(() => {
                const q = questions[currentQuestion];
                return (
                  <div key={q.id} className="animate-fade-in">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {q.question}
                      {q.required && <span className="text-destructive ml-1">*</span>}
                    </h3>
                    {q.helpText && <p className="text-sm text-muted-foreground mb-4">{q.helpText}</p>}

                    {q.type === "rating" && (
                      <div className="flex justify-center gap-2 my-6">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} onClick={() => setAnswers({ ...answers, [q.id]: star })} className="group">
                            <Star className={`w-10 h-10 transition-all duration-150 group-hover:scale-110 ${answers[q.id] >= star ? "fill-warning text-warning" : "text-muted-foreground/40 group-hover:text-warning"}`} />
                          </button>
                        ))}
                      </div>
                    )}

                    {q.type === "short_text" && (
                      <Input value={answers[q.id] || ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} placeholder={q.placeholder} className="h-10" />
                    )}

                    {q.type === "long_text" && (
                      <Textarea value={answers[q.id] || ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} placeholder={q.placeholder} rows={4} className="resize-none" />
                    )}

                    {q.type === "multiple_choice" && q.options && (
                      <div className="space-y-2">
                        {q.options.map((option) => (
                          <button
                            key={option}
                            onClick={() => setAnswers({ ...answers, [q.id]: option })}
                            className={`w-full p-3 rounded-lg border text-left transition-all duration-150 ${
                              answers[q.id] === option ? "border-primary bg-primary-light" : "border-border hover:border-primary/40 hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${answers[q.id] === option ? "border-primary bg-primary" : "border-muted-foreground/40"}`}>
                                {answers[q.id] === option && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                              </div>
                              <span className="text-sm font-medium">{option}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {q.type === "video" && (
                      <VideoRecorder maxDuration={60} onRecordingComplete={(blob, url) => setAnswers({ ...answers, [q.id]: { blob, url } })} />
                    )}

                    {q.type === "audio" && (
                      <AudioRecorder maxDuration={120} onRecordingComplete={(blob, url) => setAnswers({ ...answers, [q.id]: { blob, url } })} />
                    )}
                  </div>
                );
              })()}

              <div className="flex justify-between mt-8">
                <Button variant="ghost" onClick={prevQuestion}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button onClick={nextQuestion}>
                  {currentQuestion === questions.length - 1 ? "Submit" : "Next"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* THANK YOU */}
        {step === "thankyou" && (
          <div className="bg-card rounded-xl shadow-subtle border p-8 text-center animate-fade-in">
            {sentimentScore && sentimentScore < formData.positiveThreshold ? (
              <>
                <div className="w-14 h-14 rounded-xl bg-destructive-light mx-auto mb-5 flex items-center justify-center">
                  <span className="text-destructive text-xl font-bold">!</span>
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">We're sorry to hear that</h2>
                <p className="text-sm text-muted-foreground mb-4">Your feedback helps us improve. We'll reach out to make things right.</p>
                <Textarea placeholder="Tell us what went wrong..." rows={4} className="mb-4" />
                <Button className="w-full">Submit Feedback</Button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-xl bg-success-light mx-auto mb-5 flex items-center justify-center">
                  <Check className="w-7 h-7 text-success" strokeWidth={3} />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">{formData.thankYouTitle}</h2>
                <p className="text-sm text-muted-foreground mb-5">{formData.thankYouMessage}</p>

                {formData.incentiveEnabled && (
                  <div className="bg-warning-light rounded-lg p-4 mb-5">
                    <p className="text-sm font-medium text-foreground mb-2">Here's your discount code</p>
                    <div className="flex items-center justify-center gap-2">
                      <code className="bg-card px-4 py-2 rounded-lg font-mono text-sm font-bold border">{formData.incentiveCode}</code>
                      <Button variant="outline" size="sm" onClick={copyCode}>
                        {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                {formData.reviewRoutingEnabled && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Would you share publicly?</p>
                    <div className="flex gap-2 justify-center mb-3">
                      <Button variant="outline" size="sm">
                        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-3.5 h-3.5 mr-1.5" />
                        Google
                      </Button>
                      <Button variant="outline" size="sm">G2</Button>
                      <Button variant="outline" size="sm">Trustpilot</Button>
                    </div>
                    <Button variant="link" className="text-muted-foreground text-xs">Maybe later</Button>
                  </div>
                )}
              </>
            )}

            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">Powered by</p>
              <p className="text-xs font-semibold text-foreground">Testimonial</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
