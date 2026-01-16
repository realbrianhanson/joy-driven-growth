import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

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
  high: "border-l-rose",
  medium: "border-l-amber",
  low: "border-l-emerald",
};

export function AiInsights({ insights, onInsightClick }: AiInsightsProps) {
  return (
    <Card className="bg-card border border-border rounded-2xl">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
          <span>🧠</span> AI Insights
        </h2>
        
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div
              key={insight.id}
              className={`flex items-center gap-3 p-3 rounded-xl border-l-4 ${
                priorityColors[insight.priority || "low"]
              } bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors group animate-fade-in-up`}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => onInsightClick?.(insight.id)}
            >
              <div className="flex-1">
                <p className="text-sm text-foreground">{insight.message}</p>
                {insight.action && (
                  <p className="text-xs text-primary font-medium mt-1">{insight.action}</p>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
