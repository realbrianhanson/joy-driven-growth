import { Star, Check, Trash2, Edit, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      className={`relative card-hover bg-card border rounded-2xl cursor-pointer transition-all overflow-hidden ${
        isSelected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-border-hover"
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
          <Star className="w-5 h-5 fill-gold text-gold animate-sparkle" />
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
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="w-14 h-14 rounded-full gradient-sunny flex items-center justify-center shadow-warm-lg">
                <Play className="w-6 h-6 text-white ml-1" fill="white" />
              </div>
            </div>
            {/* Type badge */}
            <Badge className="absolute bottom-2 left-2 bg-black/60 text-white border-0">
              🎥 Video
            </Badge>
          </div>
        ) : (
          <div className="p-5 pb-0">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                {testimonial.avatar ? (
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  testimonial.name.charAt(0)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground truncate">
                  {testimonial.name}
                </div>
                <div className="text-sm text-muted-foreground truncate">
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
          <p className="text-sm text-foreground line-clamp-3 mb-4">
            "{testimonial.content.slice(0, 150)}
            {testimonial.content.length > 150 ? "..." : ""}"
          </p>

          {/* Rating */}
          <div className="flex items-center gap-0.5 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < testimonial.rating
                    ? "fill-gold text-gold"
                    : "fill-muted text-muted"
                }`}
              />
            ))}
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {/* Sentiment */}
            <Badge variant="secondary" className="text-xs">
              {sentimentConfig[testimonial.sentiment].emoji}{" "}
              {sentimentConfig[testimonial.sentiment].label}
            </Badge>
            
            {/* Source */}
            <Badge variant="outline" className="text-xs">
              {sourceConfig[testimonial.source].emoji}{" "}
              {sourceConfig[testimonial.source].label}
            </Badge>

            {/* Revenue */}
            {testimonial.revenue && testimonial.revenue > 0 && (
              <Badge className="bg-emerald-light text-emerald border-0 text-xs">
                💰 {formatCurrency(testimonial.revenue)}
              </Badge>
            )}
          </div>

          {/* Tags */}
          {testimonial.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {testimonial.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
              {testimonial.tags.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{testimonial.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Timestamp */}
          <div className="text-xs text-muted-foreground">
            {formatTimeAgo(testimonial.createdAt)}
          </div>
        </div>
      </CardContent>

      {/* Hover actions overlay */}
      {isHovered && (
        <div 
          className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-card via-card to-transparent animate-fade-in-up"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-center gap-2">
            {testimonial.status === "pending" && (
              <Button
                size="sm"
                className="bg-emerald text-white hover:bg-emerald/90"
                onClick={() => onApprove?.(testimonial.id)}
              >
                <Check className="w-4 h-4 mr-1" />
                Approve
              </Button>
            )}
            <Button
              size="sm"
              variant={testimonial.featured ? "default" : "outline"}
              className={testimonial.featured ? "bg-gold text-white hover:bg-gold/90" : ""}
              onClick={() => onFeature?.(testimonial.id)}
            >
              <Star className={`w-4 h-4 ${testimonial.featured ? "fill-current" : ""}`} />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit?.(testimonial.id)}
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => onDelete?.(testimonial.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
