import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
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
  accentColor?: string;
}

export function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  trend,
  highlight,
  animateValue = true,
  delay = 0,
  accentColor = "bg-primary",
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
      className={`card-hover relative overflow-hidden transition-all duration-150 ${
        isVisible ? 'animate-fade-in opacity-100' : 'opacity-0'
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Top accent border */}
      <div className={`absolute top-0 left-0 right-0 h-[3px] ${accentColor}`} />
      <CardContent className="p-5 pt-6">
        <div className="flex items-start justify-between mb-3">
          <Icon className="h-5 w-5 text-muted-foreground" />
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium ${
              trend.value >= 0 ? 'text-success' : 'text-destructive'
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
        
        <div className="text-2xl font-bold text-foreground mb-0.5">
          {displayValue}
        </div>

        <h3 className="text-sm text-muted-foreground mb-1">
          {title}
        </h3>
        
        {subtitle && (
          <p className="text-xs text-muted-foreground">
            {subtitle}
          </p>
        )}
        
        {highlight && (
          <p className="text-xs font-medium text-primary mt-1.5">
            {highlight}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
