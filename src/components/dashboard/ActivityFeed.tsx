import { Card, CardContent } from "@/components/ui/card";

interface ActivityItem {
  id: string;
  icon: string;
  message: string;
  time: string;
  type: "testimonial" | "revenue" | "campaign" | "widget" | "other";
}

interface ActivityFeedProps {
  activities: ActivityItem[];
  onActivityClick?: (id: string) => void;
}

const typeColors = {
  testimonial: "bg-gold-light",
  revenue: "bg-emerald-light",
  campaign: "bg-sky-light",
  widget: "bg-rose-light",
  other: "bg-muted",
};

export function ActivityFeed({ activities, onActivityClick }: ActivityFeedProps) {
  return (
    <Card className="bg-card border border-border rounded-2xl">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
          What's Happening <span>🎉</span>
        </h2>
        
        <div className="space-y-3">
          {activities.map((activity, index) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 cursor-pointer transition-colors animate-slide-in-right"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => onActivityClick?.(activity.id)}
            >
              <div className={`w-10 h-10 rounded-full ${typeColors[activity.type]} flex items-center justify-center text-lg flex-shrink-0`}>
                {activity.icon}
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
