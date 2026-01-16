import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  icon: string;
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
  };
  highlight?: string;
  animateValue?: boolean;
  delay?: number;
}

export function StatCard({
  icon,
  title,
  value,
  subtitle,
  trend,
  highlight,
  animateValue = true,
  delay = 0,
}: StatCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [displayValue, setDisplayValue] = useState(animateValue && typeof value === 'number' ? 0 : value);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isVisible || !animateValue || typeof value !== 'number') return;
    
    const duration = 1000;
    const steps = 40;
    const stepValue = value / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value, isVisible, animateValue]);

  return (
    <Card 
      className={`card-hover bg-card border border-border hover:border-border-hover rounded-2xl transition-all duration-300 ${
        isVisible ? 'animate-fade-in-up opacity-100' : 'opacity-0'
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <span className="text-2xl">{icon}</span>
          {trend && (
            <div className={`flex items-center gap-1 text-sm font-medium ${
              trend.value >= 0 ? 'text-emerald' : 'text-rose'
            }`}>
              {trend.value >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{trend.value >= 0 ? '+' : ''}{trend.value}%</span>
            </div>
          )}
        </div>
        
        <h3 className="text-sm font-medium text-muted-foreground mb-1">
          {title}
        </h3>
        
        <div className="text-3xl font-bold text-foreground mb-1">
          {displayValue}
        </div>
        
        {subtitle && (
          <p className="text-sm text-muted-foreground">
            {subtitle}
          </p>
        )}
        
        {highlight && (
          <p className="text-sm font-medium text-primary mt-2">
            {highlight}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
