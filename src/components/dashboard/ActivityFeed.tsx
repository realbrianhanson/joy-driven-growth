import { Card, CardContent } from "@/components/ui/card";
import { Star, DollarSign, MessageSquare, Megaphone, Puzzle } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface ActivityItem {
  id: string;
  icon: LucideIcon;
  message: string;
  time: string;
  type: "testimonial" | "revenue" | "campaign" | "widget" | "other";
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  onActivityClick?: (id: string) => void;
}

const typeColors: Record<string, string> = {
  testimonial: "bg-warning-light text-warning",
  revenue: "bg-success-light text-success",
  campaign: "bg-primary-light text-primary",
  widget: "bg-destructive-light text-destructive",
  other: "bg-muted text-muted-foreground",
};

export function ActivityFeed({ activities, onActivityClick }: ActivityFeedProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Recent Activity</h2>
        
        <div className="space-y-2">
          {activities.map((activity, index) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors duration-150 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => onActivityClick?.(activity.id)}
            >
              <div className={`w-8 h-8 rounded-lg ${typeColors[activity.type]} flex items-center justify-center flex-shrink-0`}>
                <activity.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{activity.message}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
