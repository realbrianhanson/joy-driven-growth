import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

interface RevenueDriver {
  id: string;
  name: string;
  company: string;
  avatar?: string;
  snippet: string;
  placement: string;
  views: number;
  conversions: number;
  revenue: number;
  rank: number;
}

interface RevenueDriversProps {
  drivers: RevenueDriver[];
  onDriverClick?: (id: string) => void;
}

export function RevenueDrivers({ drivers, onDriverClick }: RevenueDriversProps) {
  const formatNumber = (value: number) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toString();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);

  return (
    <Card>
      <CardContent className="p-5">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">
          <Trophy className="h-4 w-4 text-muted-foreground" />
          Top Revenue Drivers
        </h2>
        
        {/* Table header */}
        <div className="hidden md:grid grid-cols-[2rem_1fr_5rem_5rem_5rem_6rem] gap-3 px-3 py-2 bg-muted/50 rounded-lg text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          <span>#</span>
          <span>Testimonial</span>
          <span className="text-right">Views</span>
          <span className="text-right">Conv.</span>
          <span className="text-right">Revenue</span>
          <span className="text-right">Placement</span>
        </div>

        <div className="space-y-1">
          {drivers.map((driver, index) => (
            <div
              key={driver.id}
              className="grid grid-cols-1 md:grid-cols-[2rem_1fr_5rem_5rem_5rem_6rem] gap-3 items-center p-3 rounded-lg cursor-pointer transition-colors duration-150 hover:bg-muted/50 border-b border-border/50 last:border-0 animate-fade-in"
              style={{ animationDelay: `${index * 60}ms` }}
              onClick={() => onDriverClick?.(driver.id)}
            >
              <span className="text-sm font-semibold text-muted-foreground">{driver.rank}</span>
              
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                  {driver.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{driver.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{driver.company}</div>
                </div>
              </div>
              
              <div className="hidden md:block text-sm text-right text-foreground">{formatNumber(driver.views)}</div>
              <div className="hidden md:block text-sm text-right text-foreground">{driver.conversions}</div>
              <div className="hidden md:block text-sm text-right font-medium text-success">{formatCurrency(driver.revenue)}</div>
              <div className="hidden md:block text-right">
                <Badge variant="secondary" className="text-[11px]">{driver.placement}</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
