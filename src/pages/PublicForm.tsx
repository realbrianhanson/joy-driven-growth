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
  brandColor: "#f97316",
  welcomeTitle: "Hey there! 👋",
  welcomeMessage: "We'd love to hear about your experience. It'll only take a minute!",
  thankYouTitle: "You're amazing! 🎉",
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

  // Handle sentiment selection
  const handleSentiment = (score: number) => {
    setSentimentScore(score);
    if (score >= formData.positiveThreshold) {
      setStep("welcome");
    } else {
      // Negative path - show support message
      setStep("thankyou");
    }
  };

  // Fire confetti
  const fireConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#f97316", "#f59e0b", "#fbbf24", "#fb7185", "#10b981"],
    });
  };

  // Navigate questions
  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setStep("thankyou");
      if (formData.confettiEnabled) {
        setTimeout(fireConfetti, 300);
      }
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else {
      setStep("welcome");
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(formData.incentiveCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background-secondary flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="fixed inset-0 opacity-30 pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }} />

      <div className="relative w-full max-w-md">
        {/* SENTIMENT GATE */}
        {step === "sentiment" && formData.reviewRoutingEnabled && (
          <div className="bg-card rounded-2xl shadow-warm-xl p-8 animate-fade-in-up text-center">
            <div className="w-16 h-16 rounded-full gradient-sunny mx-auto mb-6 flex items-center justify-center text-3xl animate-sparkle">
              💛
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-3">
              How was your experience?
            </h2>
            <p className="text-muted-foreground mb-8">
              Let us know how we did!
            </p>

            {/* Emoji Scale */}
            <div className="flex justify-center gap-3 mb-8">
              {[
                { score: 1, emoji: "😟" },
                { score: 2, emoji: "😕" },
                { score: 3, emoji: "😐" },
                { score: 4, emoji: "🙂" },
                { score: 5, emoji: "😊" },
              ].map(({ score, emoji }) => (
                <button
                  key={score}
                  onClick={() => handleSentiment(score)}
                  className={`w-14 h-14 rounded-2xl text-3xl transition-all hover:scale-110 hover:shadow-warm ${
                    sentimentScore === score
                      ? "bg-primary/20 ring-2 ring-primary"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Star alternative */}
            <div className="text-sm text-muted-foreground">or rate with stars</div>
            <div className="flex justify-center gap-2 mt-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleSentiment(star)}
                  className="group"
                >
                  <Star
                    className={`w-8 h-8 transition-all group-hover:scale-125 ${
                      sentimentScore && sentimentScore >= star
                        ? "fill-gold text-gold"
                        : "text-muted-foreground group-hover:text-gold"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* WELCOME */}
        {step === "welcome" && (
          <div className="bg-card rounded-2xl shadow-warm-xl p-8 animate-fade-in-up text-center">
            <div 
              className="w-20 h-20 rounded-full gradient-sunny mx-auto mb-6 flex items-center justify-center text-4xl animate-sparkle"
              style={{ animationDelay: "0.2s" }}
            >
              💛
            </div>
            <h2 
              className="text-2xl font-bold text-foreground mb-3 animate-fade-in-up"
              style={{ animationDelay: "0.3s" }}
            >
              {formData.welcomeTitle}
            </h2>
            <p 
              className="text-muted-foreground mb-8 animate-fade-in-up"
              style={{ animationDelay: "0.4s" }}
            >
              {formData.welcomeMessage}
            </p>
            <Button
              onClick={() => setStep("question")}
              className="w-full h-12 text-lg gradient-sunny text-white border-0 shadow-warm hover:shadow-warm-lg transition-all animate-fade-in-up"
              style={{ animationDelay: "0.5s" }}
            >
              Let's Go! <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <p 
              className="text-sm text-muted-foreground mt-4 flex items-center justify-center gap-1 animate-fade-in-up"
              style={{ animationDelay: "0.6s" }}
            >
              ⏱️ Takes about 2 minutes
            </p>
          </div>
        )}

        {/* QUESTIONS */}
        {step === "question" && (
          <div className="bg-card rounded-2xl shadow-warm-xl overflow-hidden animate-fade-in-up">
            {/* Progress bar */}
            <div className="p-4 bg-muted/30">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Question {currentQuestion + 1} of {questions.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full gradient-sunny transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="p-8">
              {(() => {
                const q = questions[currentQuestion];
                return (
                  <div key={q.id} className="animate-fade-in-up">
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {q.question}
                      {q.required && <span className="text-primary ml-1">*</span>}
                    </h3>
                    {q.helpText && (
                      <p className="text-sm text-muted-foreground mb-6">{q.helpText}</p>
                    )}

                    {/* RATING */}
                    {q.type === "rating" && (
                      <div className="flex justify-center gap-3 my-8">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setAnswers({ ...answers, [q.id]: star })}
                            className="group transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-12 h-12 transition-all ${
                                answers[q.id] >= star
                                  ? "fill-gold text-gold drop-shadow-lg"
                                  : "text-muted-foreground group-hover:text-gold"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* SHORT TEXT */}
                    {q.type === "short_text" && (
                      <Input
                        value={answers[q.id] || ""}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                        placeholder={q.placeholder}
                        className="h-12 text-lg border-2 focus:border-primary"
                      />
                    )}

                    {/* LONG TEXT */}
                    {q.type === "long_text" && (
                      <Textarea
                        value={answers[q.id] || ""}
                        onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                        placeholder={q.placeholder}
                        rows={4}
                        className="text-lg border-2 focus:border-primary resize-none"
                      />
                    )}

                    {/* MULTIPLE CHOICE */}
                    {q.type === "multiple_choice" && q.options && (
                      <div className="space-y-3">
                        {q.options.map((option) => (
                          <button
                            key={option}
                            onClick={() => setAnswers({ ...answers, [q.id]: option })}
                            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                              answers[q.id] === option
                                ? "border-primary bg-primary/10 shadow-warm"
                                : "border-border hover:border-primary/50 hover:bg-muted/50"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                  answers[q.id] === option
                                    ? "border-primary bg-primary"
                                    : "border-muted-foreground"
                                }`}
                              >
                                {answers[q.id] === option && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <span className="font-medium">{option}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* VIDEO */}
                    {q.type === "video" && (
                      <VideoRecorder
                        maxDuration={60}
                        onRecordingComplete={(blob, url) => {
                          setAnswers({ ...answers, [q.id]: { blob, url } });
                        }}
                      />
                    )}

                    {/* AUDIO */}
                    {q.type === "audio" && (
                      <AudioRecorder
                        maxDuration={120}
                        onRecordingComplete={(blob, url) => {
                          setAnswers({ ...answers, [q.id]: { blob, url } });
                        }}
                      />
                    )}
                  </div>
                );
              })()}

              {/* Navigation */}
              <div className="flex justify-between mt-8">
                <Button variant="ghost" onClick={prevQuestion}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={nextQuestion}
                  className="gradient-sunny text-white border-0"
                >
                  {currentQuestion === questions.length - 1 ? (
                    <>Share the Love 💛</>
                  ) : (
                    <>
                      {currentQuestion === questions.length - 2 ? "Almost there!" : "Next"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* THANK YOU */}
        {step === "thankyou" && (
          <div className="bg-card rounded-2xl shadow-warm-xl p-8 text-center animate-fade-in-up">
            {sentimentScore && sentimentScore < formData.positiveThreshold ? (
              // Negative path
              <>
                <div className="text-6xl mb-4">😔</div>
                <h2 className="text-2xl font-bold text-foreground mb-3">
                  We're sorry to hear that
                </h2>
                <p className="text-muted-foreground mb-6">
                  Your feedback helps us improve. We'll reach out to make things right.
                </p>
                <Textarea
                  placeholder="Tell us what went wrong..."
                  rows={4}
                  className="mb-4"
                />
                <Button className="w-full gradient-sunny text-white border-0">
                  Submit Feedback
                </Button>
              </>
            ) : (
              // Positive path
              <>
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-emerald mx-auto mb-6 flex items-center justify-center animate-fade-in-up">
                    <Check className="w-10 h-10 text-white" strokeWidth={3} />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                  {formData.thankYouTitle}
                </h2>
                <p className="text-muted-foreground mb-6 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                  {formData.thankYouMessage}
                </p>

                {/* Incentive */}
                {formData.incentiveEnabled && (
                  <div className="bg-gold-light rounded-xl p-4 mb-6 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
                    <div className="text-lg mb-2">Here's your gift! 🎁</div>
                    <div className="flex items-center justify-center gap-2">
                      <code className="bg-card px-4 py-2 rounded-lg font-mono text-lg font-bold">
                        {formData.incentiveCode}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyCode}
                      >
                        {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Review routing */}
                {formData.reviewRoutingEnabled && (
                  <div className="animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
                    <p className="text-foreground font-medium mb-3">One more thing... 🙏</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Would you share your experience publicly?
                    </p>
                    <div className="flex gap-2 justify-center mb-3">
                      <Button className="bg-white border-2 border-border hover:border-primary text-foreground">
                        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4 mr-2" />
                        Google
                      </Button>
                      <Button className="bg-white border-2 border-border hover:border-primary text-foreground">
                        G2
                      </Button>
                      <Button className="bg-white border-2 border-border hover:border-primary text-foreground">
                        Trustpilot
                      </Button>
                    </div>
                    <Button variant="link" className="text-muted-foreground">
                      Maybe later
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Logo */}
            <div className="mt-8 pt-6 border-t border-border">
              <div className="text-sm text-muted-foreground">Powered by</div>
              <div className="font-semibold text-foreground">Happy Client 💛</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
