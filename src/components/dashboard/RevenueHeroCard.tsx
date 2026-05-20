import { TrendingUp, ArrowRight, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { forwardRef, useEffect, useState } from "react";

interface RevenueHeroCardProps {
  revenue: number;
  trend: number;
  period: string;
}

export const RevenueHeroCard = forwardRef<HTMLDivElement, RevenueHeroCardProps>(({ revenue, trend, period }, ref) => {
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
    <Card ref={ref} className="relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary" />
      <CardContent className="p-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4 text-primary">
              <DollarSign className="h-4 w-4" />
              <h2 className="text-xs font-semibold uppercase tracking-wider">Revenue Influenced</h2>
            </div>

            <div className="flex items-baseline gap-3 mb-1">
              <div className="text-4xl md:text-5xl font-bold text-foreground tracking-tight tabular-nums">
                {formatCurrency(displayRevenue)}
              </div>
              <span className={`text-sm font-medium tabular-nums ${trend >= 0 ? 'text-success' : 'text-destructive'}`}>
                {trend >= 0 ? '+' : ''}{trend}% vs last month
              </span>
            </div>

            <p className="text-sm text-muted-foreground">
              From testimonials {period}
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex items-end gap-1.5 h-24">
              {[40, 55, 48, 70, 60, 85, 95].map((height, i, arr) => {
                const opacity = 0.15 + (i / (arr.length - 1)) * 0.85;
                return (
                  <div
                    key={i}
                    className="w-5 rounded-t-sm bg-primary"
                    style={{ height: `${height}%`, opacity }}
                  />
                );
              })}
            </div>

            <button className="group flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider hover:gap-2.5 transition-all duration-150">
              View details
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

RevenueHeroCard.displayName = "RevenueHeroCard";
