import { TrendingUp, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface RevenueHeroCardProps {
  revenue: number;
  trend: number;
  period: string;
}

export function RevenueHeroCard({ revenue, trend, period }: RevenueHeroCardProps) {
  const [displayRevenue, setDisplayRevenue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  // Animated counter effect
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const stepValue = revenue / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += stepValue;
      if (current >= revenue) {
        setDisplayRevenue(revenue);
        setIsAnimating(false);
        clearInterval(timer);
      } else {
        setDisplayRevenue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [revenue]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="relative overflow-hidden border-0 shadow-warm-xl">
      {/* Gradient border effect */}
      <div className="absolute inset-0 rounded-2xl border-glow-strong pointer-events-none" />
      
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-card via-card to-orange-light/30 opacity-50" />
      
      <CardContent className="relative p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left side - Revenue info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">💰</span>
              <h2 className="text-lg font-semibold text-foreground">Revenue Influenced</h2>
            </div>
            
            {/* Big revenue number */}
            <div className="mb-3">
              <span 
                className={`text-5xl md:text-6xl lg:text-7xl font-bold text-gradient-sunny tracking-tight ${
                  isAnimating ? '' : 'animate-revenue-glow'
                }`}
              >
                {formatCurrency(displayRevenue)}
              </span>
            </div>
            
            <p className="text-muted-foreground text-lg mb-4">
              from testimonials {period}
            </p>
            
            {/* Trend indicator */}
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
                trend >= 0 
                  ? 'bg-emerald-light text-emerald' 
                  : 'bg-rose-light text-rose'
              }`}>
                <TrendingUp className={`w-4 h-4 ${trend < 0 ? 'rotate-180' : ''}`} />
                <span>{trend >= 0 ? '+' : ''}{trend}% vs last month</span>
              </div>
            </div>
          </div>
          
          {/* Right side - Mini chart placeholder & CTA */}
          <div className="flex flex-col items-end gap-4">
            {/* Mini trend chart */}
            <div className="w-full lg:w-64 h-24 bg-gradient-to-r from-orange-light/50 to-amber-light/50 rounded-xl flex items-end justify-around px-3 pb-2 gap-1">
              {[40, 55, 45, 70, 60, 85, 75, 95].map((height, i) => (
                <div
                  key={i}
                  className="w-6 rounded-t-md gradient-sunny opacity-80"
                  style={{ 
                    height: `${height}%`,
                    animationDelay: `${i * 100}ms`
                  }}
                />
              ))}
            </div>
            
            {/* View details link */}
            <button className="group flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all">
              View details
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
