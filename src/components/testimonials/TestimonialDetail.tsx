import { Star, Copy, Play, Pause, Check, X, Edit, Download, Maximize, ChevronRight, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { Testimonial } from "./TestimonialCard";

interface AiAnalysis {
  happinessScore: number;
  conversionPower: "low" | "medium" | "high";
  themes: string[];
  goldenQuotes: string[];
  summary: string;
  bestUsedFor: string[];
}

interface RevenueAttribution {
  total: number;
  conversions: number;
  widget: string;
  lastConversion: string;
}

interface TestimonialDetailProps {
  testimonial: Testimonial & {
    transcript?: string;
    videoUrl?: string;
    audioUrl?: string;
    email?: string;
    location?: string;
    verified?: boolean;
  };
  aiAnalysis?: AiAnalysis;
  revenueData?: RevenueAttribution;
  onApprove?: () => void;
  onReject?: () => void;
  onRequestEdit?: () => void;
  onFeature?: () => void;
  onGenerateContent?: (type: string) => void;
  onClose?: () => void;
  isAnalyzing?: boolean;
  onRefreshAnalysis?: () => void;
}

const sentimentConfig = {
  positive: { emoji: "😊", label: "Loves it" },
  neutral: { emoji: "😐", label: "Satisfied" },
  negative: { emoji: "😟", label: "Concerned" },
};

const sourceConfig = {
  form: { emoji: "📝", label: "Form" },
  import: { emoji: "📥", label: "Import" },
  ai_interview: { emoji: "🤖", label: "AI Interview" },
  sms: { emoji: "📱", label: "SMS" },
};

export function TestimonialDetail({
  testimonial,
  aiAnalysis,
  revenueData,
  onApprove,
  onReject,
  onRequestEdit,
  onFeature,
  onGenerateContent,
  onClose,
  isAnalyzing,
  onRefreshAnalysis,
}: TestimonialDetailProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [copiedQuote, setCopiedQuote] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedQuote(id);
    setTimeout(() => setCopiedQuote(null), 2000);
  };

  const getConversionPowerColor = (power: string) => {
    switch (power) {
      case "high": return "from-emerald to-emerald-light";
      case "medium": return "from-amber to-amber-light";
      default: return "from-muted-foreground to-muted";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 max-h-[85vh] overflow-y-auto scrollbar-warm p-1">
      {/* Left Column - 60% */}
      <div className="lg:col-span-3 space-y-6">
        {/* Media Section */}
        <Card className="bg-card border border-border rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            {testimonial.type === "video" && (
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                {testimonial.videoThumbnail && (
                  <img
                    src={testimonial.videoThumbnail}
                    alt={testimonial.name}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button
                    size="lg"
                    className="w-16 h-16 rounded-full gradient-sunny shadow-warm-lg"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6" fill="white" />
                    ) : (
                      <Play className="w-6 h-6 ml-1" fill="white" />
                    )}
                  </Button>
                </div>
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <Button size="sm" variant="secondary" className="bg-black/60 text-white border-0">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="secondary" className="bg-black/60 text-white border-0">
                    <Maximize className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {testimonial.type === "text" && (
              <div className="p-8">
                <div className="relative">
                  <span className="absolute -top-4 -left-2 text-6xl text-gradient-sunny opacity-30 font-serif">
                    "
                  </span>
                  <p className="text-xl md:text-2xl text-foreground leading-relaxed pl-8 pr-4">
                    {testimonial.content}
                  </p>
                  <span className="absolute -bottom-8 right-0 text-6xl text-gradient-sunny opacity-30 font-serif">
                    "
                  </span>
                </div>
              </div>
            )}

            {testimonial.type === "audio" && (
              <div className="p-6">
                <div className="bg-muted/50 rounded-xl p-6">
                  {/* Waveform placeholder */}
                  <div className="flex items-end justify-around h-16 gap-1 mb-4">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 bg-primary/60 rounded-full"
                        style={{ height: `${Math.random() * 100}%` }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      size="lg"
                      className="w-14 h-14 rounded-full gradient-sunny"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5" fill="white" />
                      ) : (
                        <Play className="w-5 h-5 ml-0.5" fill="white" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Info Card */}
        <Card className="bg-card border border-border rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent p-0.5">
                <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                  {testimonial.avatar ? (
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-gradient-sunny">
                      {testimonial.name.charAt(0)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">{testimonial.name}</h2>
                  {testimonial.verified && (
                    <Badge className="bg-sky-light text-sky border-0">✓ Verified</Badge>
                  )}
                </div>
                {testimonial.title && (
                  <p className="text-muted-foreground">
                    {testimonial.title} @ {testimonial.company}
                  </p>
                )}
                {!testimonial.title && (
                  <p className="text-muted-foreground">{testimonial.company}</p>
                )}
                {testimonial.location && (
                  <p className="text-sm text-muted-foreground mt-1">📍 {testimonial.location}</p>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              {/* Rating */}
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < testimonial.rating
                        ? "fill-gold text-gold"
                        : "fill-muted text-muted"
                    }`}
                  />
                ))}
              </div>

              {/* Source */}
              <Badge variant="outline">
                {sourceConfig[testimonial.source].emoji} Collected via{" "}
                {sourceConfig[testimonial.source].label}
              </Badge>

              {/* Date */}
              <span className="text-sm text-muted-foreground">
                {new Date(testimonial.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Transcript (if video/audio) */}
        {testimonial.transcript && (
          <Card className="bg-card border border-border rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  📝 Transcript
                  <Badge variant="secondary" className="text-xs">AI cleaned</Badge>
                </h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(testimonial.transcript!, "transcript")}
                >
                  {copiedQuote === "transcript" ? (
                    <Check className="w-4 h-4 mr-1" />
                  ) : (
                    <Copy className="w-4 h-4 mr-1" />
                  )}
                  Copy
                </Button>
              </div>
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {testimonial.transcript}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Column - 40% */}
      <div className="lg:col-span-2 space-y-6">
        {/* AI Analysis Panel */}
        <Card className="bg-card border border-border rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                AI Insights
              </h3>
              {onRefreshAnalysis && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onRefreshAnalysis}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? "Analyzing..." : "Regenerate ✨"}
                </Button>
              )}
            </div>

            {isAnalyzing ? (
              <div className="flex flex-col items-center py-8">
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
                <p className="text-muted-foreground">Analyzing testimonial...</p>
              </div>
            ) : aiAnalysis ? (
              <div className="space-y-6">
                {/* Happiness Score */}
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Happiness Score</div>
                  <div className="flex items-center gap-4">
                    <div className="relative w-20 h-20">
                      <svg className="w-20 h-20 -rotate-90">
                        <circle
                          cx="40"
                          cy="40"
                          r="35"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          className="text-muted"
                        />
                        <circle
                          cx="40"
                          cy="40"
                          r="35"
                          stroke="url(#gradient)"
                          strokeWidth="6"
                          fill="none"
                          strokeDasharray={`${aiAnalysis.happinessScore * 22} 220`}
                          strokeLinecap="round"
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="hsl(24, 94%, 53%)" />
                            <stop offset="100%" stopColor="hsl(38, 92%, 50%)" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold">{aiAnalysis.happinessScore}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl mb-1">
                        {aiAnalysis.happinessScore >= 8 ? "😊" : aiAnalysis.happinessScore >= 5 ? "😐" : "😟"}
                      </div>
                      <div className="text-sm font-medium text-foreground">
                        {aiAnalysis.happinessScore >= 8
                          ? "Absolutely loves it! 🎉"
                          : aiAnalysis.happinessScore >= 5
                          ? "Pretty satisfied"
                          : "Needs attention"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conversion Power */}
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Conversion Power</div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${getConversionPowerColor(aiAnalysis.conversionPower)} transition-all`}
                      style={{
                        width:
                          aiAnalysis.conversionPower === "high"
                            ? "100%"
                            : aiAnalysis.conversionPower === "medium"
                            ? "60%"
                            : "30%",
                      }}
                    />
                  </div>
                  <div className="text-sm font-medium mt-1">
                    {aiAnalysis.conversionPower === "high" && "High converting! 🔥"}
                    {aiAnalysis.conversionPower === "medium" && "Good potential"}
                    {aiAnalysis.conversionPower === "low" && "Needs work"}
                  </div>
                </div>

                {/* Key Themes */}
                <div>
                  <div className="text-sm text-muted-foreground mb-2">What they love</div>
                  <div className="flex flex-wrap gap-2">
                    {aiAnalysis.themes.map((theme) => (
                      <Badge key={theme} variant="secondary" className="bg-orange-light text-primary">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Golden Quotes */}
                <div>
                  <div className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                    💎 Best soundbites
                  </div>
                  <div className="space-y-2">
                    {aiAnalysis.goldenQuotes.map((quote, i) => (
                      <div
                        key={i}
                        className="p-3 bg-gold-light/50 rounded-lg border border-gold/20 flex items-start gap-2"
                      >
                        <p className="text-sm text-foreground flex-1">"{quote}"</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => copyToClipboard(quote, `quote-${i}`)}
                        >
                          {copiedQuote === `quote-${i}` ? (
                            <Check className="w-3 h-3 text-emerald" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AI Summary */}
                <div>
                  <div className="text-sm text-muted-foreground mb-2">AI Summary</div>
                  <p className="text-sm text-foreground">{aiAnalysis.summary}</p>
                </div>

                {/* Best Used For */}
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Best used for</div>
                  <div className="flex flex-wrap gap-2">
                    {aiAnalysis.bestUsedFor.map((use) => (
                      <Badge key={use} className="gradient-sunny text-white border-0">
                        {use}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No analysis yet</p>
                <Button onClick={onRefreshAnalysis}>Analyze with AI ✨</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Attribution */}
        {revenueData && (
          <Card className="bg-card border border-border rounded-2xl">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                💰 Revenue Generated
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-2xl font-bold text-emerald">
                    {formatCurrency(revenueData.total)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Conversions</span>
                  <span className="font-medium">{revenueData.conversions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Widget</span>
                  <span className="font-medium">{revenueData.widget}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last conversion</span>
                  <span className="font-medium">{revenueData.lastConversion}</span>
                </div>
                <Button variant="link" className="p-0 h-auto text-primary">
                  View attribution details <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions Panel */}
        <Card className="bg-card border border-border rounded-2xl">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-semibold text-foreground">Actions</h3>

            {/* Primary Actions */}
            <div className="grid grid-cols-2 gap-2">
              {testimonial.status === "pending" && (
                <>
                  <Button
                    className="bg-emerald text-white hover:bg-emerald/90"
                    onClick={onApprove}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="text-amber hover:bg-amber/10"
                    onClick={onRequestEdit}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Request Edit
                  </Button>
                </>
              )}
              <Button
                variant={testimonial.featured ? "default" : "outline"}
                className={testimonial.featured ? "bg-gold text-white hover:bg-gold/90" : ""}
                onClick={onFeature}
              >
                <Star className={`w-4 h-4 mr-1 ${testimonial.featured ? "fill-current" : ""}`} />
                {testimonial.featured ? "Featured" : "Feature"}
              </Button>
              {testimonial.status === "pending" && (
                <Button
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={onReject}
                >
                  <X className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              )}
            </div>

            {/* Content Generation */}
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="w-full gradient-sunny text-white border-0">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Content
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onGenerateContent?.("twitter")}>
                    🐦 Twitter Thread
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onGenerateContent?.("linkedin")}>
                    💼 LinkedIn Post
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onGenerateContent?.("graphic")}>
                    🖼️ Quote Graphic
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onGenerateContent?.("casestudy")}>
                    📄 Case Study
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onGenerateContent?.("clip")}>
                    ✂️ Video Clip
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Tags */}
            <div>
              <div className="text-sm text-muted-foreground mb-2">Tags</div>
              <div className="flex flex-wrap gap-2">
                {testimonial.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="pr-1">
                    {tag}
                    <button className="ml-1 hover:text-destructive">×</button>
                  </Badge>
                ))}
                <Button size="sm" variant="ghost" className="h-6 text-xs">
                  + Add tag
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
