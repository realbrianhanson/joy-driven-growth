import { Star, Check, Trash2, Edit, Play, FileText, Mic, Video, Inbox, Sparkles, MessageCircle, Smile, Meh, Frown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

export interface Testimonial {
  id: string;
  type: "video" | "text" | "audio";
  status: "pending" | "approved" | "rejected";
  featured: boolean;
  name: string;
  title?: string;
  company: string;
  avatar?: string;
  content: string;
  rating: number;
  sentiment: "positive" | "neutral" | "negative";
  source: "form" | "import" | "ai_interview" | "sms";
  revenue?: number;
  tags: string[];
  createdAt: string;
  videoThumbnail?: string;
}

interface TestimonialCardProps {
  testimonial: Testimonial;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onClick: (id: string) => void;
  onApprove?: (id: string) => void;
  onFeature?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const sentimentConfig = {
  positive: { Icon: Smile, label: "Loves it" },
  neutral: { Icon: Meh, label: "Satisfied" },
  negative: { Icon: Frown, label: "Concerned" },
};

const sourceConfig = {
  form: { Icon: FileText, label: "Form" },
  import: { Icon: Inbox, label: "Import" },
  ai_interview: { Icon: Sparkles, label: "AI Interview" },
  sms: { Icon: MessageCircle, label: "SMS" },
};

export function TestimonialCard({
  testimonial,
  isSelected,
  onSelect,
  onClick,
  onApprove,
  onFeature,
  onEdit,
  onDelete,
}: TestimonialCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card
      className={`relative bg-card border rounded-xl cursor-pointer transition-all overflow-hidden hover:shadow-sm ${
        isSelected ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-foreground/15"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onClick(testimonial.id)}
    >
      {/* Selection checkbox */}
      <div 
        className="absolute top-3 left-3 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(testimonial.id, !!checked)}
          className="bg-card border-2"
        />
      </div>

      {/* Featured star */}
      {testimonial.featured && (
        <div className="absolute top-3 right-3 z-10">
          <Star className="w-4 h-4 fill-foreground text-foreground" />
        </div>
      )}

      <CardContent className="p-0">
        {/* Video thumbnail or avatar section */}
        {testimonial.type === "video" && testimonial.videoThumbnail ? (
          <div className="relative aspect-video bg-muted">
            <img
              src={testimonial.videoThumbnail}
              alt={testimonial.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-foreground/10">
              <div className="w-12 h-12 rounded-full bg-card/95 flex items-center justify-center shadow-md">
                <Play className="w-5 h-5 text-foreground ml-0.5" fill="currentColor" />
              </div>
            </div>
            <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-foreground/80 text-background">
              <Video className="w-3 h-3" />
              Video
            </div>
          </div>
        ) : (
          <div className="p-5 pb-0">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                {testimonial.avatar ? (
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  testimonial.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground truncate text-sm">
                  {testimonial.name}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {testimonial.title && `${testimonial.title} @ `}
                  {testimonial.company}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-5">
          {/* Quote */}
          <p className="text-sm leading-relaxed text-foreground line-clamp-3 mb-4">
            "{testimonial.content.slice(0, 150)}
            {testimonial.content.length > 150 ? "..." : ""}"
          </p>

          {/* Rating */}
          <div className="flex items-center gap-0.5 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < testimonial.rating
                    ? "fill-foreground text-foreground"
                    : "fill-muted text-muted"
                }`}
              />
            ))}
          </div>

          {/* Meta row */}
          {(() => {
            const sentiment = sentimentConfig[testimonial.sentiment] ?? sentimentConfig.neutral;
            const source = sourceConfig[testimonial.source] ?? sourceConfig.form;
            const SentimentIcon = sentiment.Icon;
            const SourceIcon = source.Icon;
            return (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <SentimentIcon className="w-3 h-3" />
                  {sentiment.label}
                </span>
                <span className="inline-flex items-center gap-1">
                  <SourceIcon className="w-3 h-3" />
                  {source.label}
                </span>
                {testimonial.revenue && testimonial.revenue > 0 && (
                  <span className="inline-flex items-center gap-1 text-emerald font-semibold tabular-nums normal-case tracking-normal">
                    {formatCurrency(testimonial.revenue)}
                  </span>
                )}
              </div>
            );
          })()}

          {/* Tags */}
          {testimonial.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {testimonial.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
              {testimonial.tags.length > 3 && (
                <span className="text-[11px] text-muted-foreground">
                  +{testimonial.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Timestamp */}
          <div className="text-[11px] text-muted-foreground tabular-nums">
            {formatTimeAgo(testimonial.createdAt)}
          </div>
        </div>
      </CardContent>

      {/* Hover actions overlay */}
      {isHovered && (
        <div 
          className="absolute inset-x-0 bottom-0 p-3 bg-card border-t border-border animate-fade-in-up"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-center gap-1.5">
            {testimonial.status === "pending" && (
              <Button
                size="sm"
                className="h-8 bg-foreground text-background hover:bg-foreground/90"
                onClick={() => onApprove?.(testimonial.id)}
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                Approve
              </Button>
            )}
            <Button
              size="sm"
              variant={testimonial.featured ? "default" : "outline"}
              className={`h-8 w-8 p-0 ${testimonial.featured ? "" : ""}`}
              onClick={() => onFeature?.(testimonial.id)}
            >
              <Star className={`w-3.5 h-3.5 ${testimonial.featured ? "fill-current" : ""}`} />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => onEdit?.(testimonial.id)}
            >
              <Edit className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => onDelete?.(testimonial.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
