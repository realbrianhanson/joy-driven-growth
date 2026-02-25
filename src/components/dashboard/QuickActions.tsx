import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon, Send, Bell, Sparkles } from "lucide-react";

interface QuickAction {
  id: string;
  icon: LucideIcon;
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
    icon: Send,
    title: "Send SMS Campaign",
    description: "Get 3x more responses",
    buttonText: "Send Now",
  },
  {
    id: "fomo",
    icon: Bell,
    title: "Add FOMO Popup",
    description: "Boost conversions 15-30%",
    buttonText: "Create Popup",
  },
  {
    id: "content",
    icon: Sparkles,
    title: "Generate Content",
    description: "Turn reviews into posts",
    buttonText: "Generate",
  },
];

export function QuickActions({ actions = defaultActions }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {actions.map((action, index) => (
        <Card 
          key={action.id}
          className="card-hover animate-fade-in"
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <CardContent className="p-5 flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center mb-3">
              <action.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground text-sm mb-1">{action.title}</h3>
            <p className="text-xs text-muted-foreground mb-4">{action.description}</p>
            <Button
              className="w-full"
              size="sm"
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
