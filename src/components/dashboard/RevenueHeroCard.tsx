import { TrendingUp, ArrowRight, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface RevenueHeroCardProps {
  revenue: number;
  trend: number;
  period: string;
}

export function RevenueHeroCard({ revenue, trend, period }: RevenueHeroCardProps) {
  const [displayRevenue, setDisplayRevenue] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const steps = 50;
    const stepValue = revenue / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += stepValue;
      if (current >= revenue) {
        setDisplayRevenue(revenue);
        clearInterval(timer);
      } else {
        setDisplayRevenue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [revenue]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-warning" />
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-warning" />
              <h2 className="text-sm font-medium text-muted-foreground">Revenue Influenced</h2>
            </div>
            
            <div className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-2">
              {formatCurrency(displayRevenue)}
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">
              From testimonials {period}
            </p>
            
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${
                trend >= 0 
                  ? 'bg-success-light text-success border-success/20' 
                  : 'bg-destructive-light text-destructive border-destructive/20'
              }`}>
                <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
                {trend >= 0 ? '+' : ''}{trend}% vs last month
              </span>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-3">
            <div className="w-full lg:w-56 h-20 bg-surface-subtle rounded-lg flex items-end justify-around px-3 pb-2 gap-1">
              {[40, 55, 45, 70, 60, 85, 75, 95].map((height, i) => (
                <div
                  key={i}
                  className="w-5 rounded-t bg-primary/70"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            
            <button className="group flex items-center gap-1.5 text-sm text-primary font-medium hover:gap-2.5 transition-all duration-150">
              View details
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
