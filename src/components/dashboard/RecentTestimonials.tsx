import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Testimonial {
  id: string;
  name: string;
  company: string;
  avatar?: string;
  quote: string;
  rating: number;
  sentiment: "happy" | "neutral" | "sad";
  revenue?: number;
  videoThumbnail?: string;
}

interface RecentTestimonialsProps {
  testimonials: Testimonial[];
  onTestimonialClick?: (id: string) => void;
}

const sentimentEmoji = {
  happy: "😊",
  neutral: "😐", 
  sad: "😟",
};

export function RecentTestimonials({ testimonials, onTestimonialClick }: RecentTestimonialsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
        Recent Happy Clients <span>💛</span>
      </h2>
      
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-warm -mx-2 px-2">
        {testimonials.map((testimonial, index) => (
          <Card 
            key={testimonial.id}
            className="flex-shrink-0 w-72 card-hover bg-card border border-border hover:border-border-hover rounded-2xl cursor-pointer animate-fade-in-up"
            style={{ animationDelay: `${index * 100}ms` }}
            onClick={() => onTestimonialClick?.(testimonial.id)}
          >
            <CardContent className="p-5">
              {/* Video thumbnail or avatar */}
              <div className="relative mb-4">
                {testimonial.videoThumbnail ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
                    <img 
                      src={testimonial.videoThumbnail} 
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-warm">
                        <div className="w-0 h-0 border-l-[10px] border-l-primary border-y-[6px] border-y-transparent ml-1" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-lg">
                      {testimonial.avatar ? (
                        <img src={testimonial.avatar} alt={testimonial.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        testimonial.name.charAt(0)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground truncate">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground truncate">{testimonial.company}</div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Quote */}
              <p className="text-sm text-foreground line-clamp-3 mb-4">
                "{testimonial.quote}"
              </p>
              
              {/* Footer */}
              <div className="flex items-center justify-between">
                {/* Stars */}
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < testimonial.rating 
                          ? 'fill-gold text-gold' 
                          : 'fill-muted text-muted'
                      }`}
                    />
                  ))}
                </div>
                
                {/* Sentiment & Revenue */}
                <div className="flex items-center gap-2">
                  <span className="text-lg">{sentimentEmoji[testimonial.sentiment]}</span>
                  {testimonial.revenue && (
                    <span className="text-sm font-medium text-emerald">
                      💰 {formatCurrency(testimonial.revenue)}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
