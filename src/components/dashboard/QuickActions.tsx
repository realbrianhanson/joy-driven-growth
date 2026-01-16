import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface QuickAction {
  id: string;
  icon: string;
  title: string;
  description: string;
  buttonText: string;
  onClick?: () => void;
}

interface QuickActionsProps {
  actions?: QuickAction[];
}

const defaultActions: QuickAction[] = [
  {
    id: "sms",
    icon: "📱",
    title: "Send SMS Campaign",
    description: "Get 3x more responses",
    buttonText: "Send Now",
  },
  {
    id: "fomo",
    icon: "🔔",
    title: "Add FOMO Popup",
    description: "Boost conversions 15-30%",
    buttonText: "Create Popup",
  },
  {
    id: "content",
    icon: "✨",
    title: "Generate Content",
    description: "Turn love into posts",
    buttonText: "Generate",
  },
];

export function QuickActions({ actions = defaultActions }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {actions.map((action, index) => (
        <Card 
          key={action.id}
          className="card-hover bg-card border border-border hover:border-border-hover rounded-2xl animate-fade-in-up"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardContent className="p-6 flex flex-col items-center text-center">
            <span className="text-4xl mb-3">{action.icon}</span>
            <h3 className="font-semibold text-foreground mb-1">{action.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">{action.description}</p>
            <Button 
              className="w-full gradient-sunny text-white border-0 shadow-warm hover:shadow-warm-lg transition-all"
              onClick={action.onClick}
            >
              {action.buttonText}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
