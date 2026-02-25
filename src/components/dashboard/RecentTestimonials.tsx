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

export function RecentTestimonials({ testimonials, onTestimonialClick }: RecentTestimonialsProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">
        Recent Testimonials
      </h2>
      
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin -mx-1 px-1">
        {testimonials.map((testimonial, index) => (
          <Card 
            key={testimonial.id}
            className="flex-shrink-0 w-72 card-hover cursor-pointer animate-fade-in"
            style={{ animationDelay: `${index * 80}ms` }}
            onClick={() => onTestimonialClick?.(testimonial.id)}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                  {testimonial.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{testimonial.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{testimonial.company}</div>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                "{testimonial.quote}"
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < testimonial.rating 
                          ? 'fill-warning text-warning' 
                          : 'fill-muted text-muted'
                      }`}
                    />
                  ))}
                </div>
                
                {testimonial.revenue && (
                  <span className="text-xs font-medium text-success">
                    {formatCurrency(testimonial.revenue)}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
