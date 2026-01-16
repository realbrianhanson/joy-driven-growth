import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  type: "testimonials" | "revenue";
  onAction?: () => void;
}

export function EmptyState({ type, onAction }: EmptyStateProps) {
  const content = {
    testimonials: {
      emoji: "🚀",
      title: "Let's collect your first happy client!",
      description: "Send your first testimonial request and watch the magic happen. It only takes a minute.",
      buttonText: "Create Collection Form",
    },
    revenue: {
      emoji: "💰",
      title: "Connect Stripe to see revenue attribution",
      description: "Link your payment processor to see exactly how much revenue your testimonials are generating.",
      buttonText: "Connect Stripe",
    },
  };

  const { emoji, title, description, buttonText } = content[type];

  return (
    <Card className="border-dashed border-2 border-border bg-card/50 rounded-2xl">
      <CardContent className="p-12 flex flex-col items-center text-center">
        <div className="text-6xl mb-4 animate-sparkle">{emoji}</div>
        <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground max-w-md mb-6">{description}</p>
        <Button 
          className="gradient-sunny text-white border-0 shadow-warm hover:shadow-warm-lg transition-all"
          onClick={onAction}
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
}
