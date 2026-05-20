import { Card, CardContent } from "@/components/ui/card";
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
      <CardContent className="p-0">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 px-6 py-4 border-b border-border">
          <Trophy className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          Top Revenue Drivers
        </h2>

        {/* Table header */}
        <div className="hidden md:grid grid-cols-[2rem_1fr_5rem_5rem_5rem_6rem] gap-3 px-6 py-3 bg-muted/40 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <span>#</span>
          <span>Testimonial</span>
          <span className="text-right">Views</span>
          <span className="text-right">Conv.</span>
          <span className="text-right">Revenue</span>
          <span className="text-right">Placement</span>
        </div>

        <div className="divide-y divide-border-subtle">
          {drivers.map((driver, index) => (
            <div
              key={driver.id}
              className="grid grid-cols-1 md:grid-cols-[2rem_1fr_5rem_5rem_5rem_6rem] gap-3 items-center px-6 py-3.5 cursor-pointer transition-colors duration-150 hover:bg-muted/40 animate-fade-in"
              style={{ animationDelay: `${index * 60}ms` }}
              onClick={() => onDriverClick?.(driver.id)}
            >
              <span className="text-xs tabular-nums text-muted-foreground">{driver.rank}</span>

              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-primary font-semibold text-[11px] flex-shrink-0">
                  {driver.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground truncate">{driver.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{driver.company}</div>
                </div>
              </div>

              <div className="hidden md:block text-sm text-right tabular-nums text-muted-foreground">{formatNumber(driver.views)}</div>
              <div className="hidden md:block text-sm text-right tabular-nums text-muted-foreground">{driver.conversions}</div>
              <div className="hidden md:block text-sm text-right font-semibold tabular-nums text-success">{formatCurrency(driver.revenue)}</div>
              <div className="hidden md:block text-right">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{driver.placement}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
