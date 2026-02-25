import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, DollarSign, LucideIcon } from "lucide-react";

interface EmptyStateProps {
  type: "testimonials" | "revenue";
  onAction?: () => void;
}

const contentMap: Record<string, { icon: LucideIcon; title: string; description: string; buttonText: string }> = {
  testimonials: {
    icon: FileText,
    title: "No testimonials yet",
    description: "Send your first testimonial request and start collecting client feedback. It only takes a minute.",
    buttonText: "Create Collection Form",
  },
  revenue: {
    icon: DollarSign,
    title: "No revenue data yet",
    description: "Connect your payment processor to see exactly how much revenue your testimonials are generating.",
    buttonText: "Connect Stripe",
  },
};

export function EmptyState({ type, onAction }: EmptyStateProps) {
  const { icon: Icon, title, description, buttonText } = contentMap[type];

  return (
    <Card className="border-dashed border-2 bg-card/50">
      <CardContent className="p-10 flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1.5">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-5">{description}</p>
        <Button onClick={onAction}>
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
}
