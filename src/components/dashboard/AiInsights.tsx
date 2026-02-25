import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, Lightbulb } from "lucide-react";

interface Insight {
  id: string;
  message: string;
  action?: string;
  priority?: "high" | "medium" | "low";
}

interface AiInsightsProps {
  insights: Insight[];
  onInsightClick?: (id: string) => void;
}

const priorityColors = {
  high: "border-l-destructive",
  medium: "border-l-warning",
  low: "border-l-success",
};

export function AiInsights({ insights, onInsightClick }: AiInsightsProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
          <Lightbulb className="h-4 w-4 text-muted-foreground" />
          AI Insights
        </h2>
        
        <div className="space-y-2">
          {insights.map((insight, index) => (
            <div
              key={insight.id}
              className={`flex items-center gap-3 p-3 rounded-lg border-l-[3px] ${
                priorityColors[insight.priority || "low"]
              } bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors duration-150 group animate-fade-in`}
              style={{ animationDelay: `${index * 80}ms` }}
              onClick={() => onInsightClick?.(insight.id)}
            >
              <div className="flex-1">
                <p className="text-sm text-foreground">{insight.message}</p>
                {insight.action && (
                  <p className="text-xs text-primary font-medium mt-1">{insight.action}</p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
