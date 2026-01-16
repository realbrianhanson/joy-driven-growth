import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

const rankBadges = ["🥇", "🥈", "🥉"];

export function RevenueDrivers({ drivers, onDriverClick }: RevenueDriversProps) {
  const formatNumber = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toString();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="bg-card border border-border rounded-2xl">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
          <span>💰</span> Top Revenue Drivers
        </h2>
        
        <div className="space-y-3">
          {drivers.map((driver, index) => (
            <div
              key={driver.id}
              className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all animate-fade-in-up ${
                driver.rank === 1 
                  ? 'bg-gradient-to-r from-gold-light/50 to-amber-light/30 border border-gold/30 hover:border-gold/50' 
                  : 'bg-muted/30 hover:bg-muted/50 border border-transparent'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => onDriverClick?.(driver.id)}
            >
              {/* Rank badge */}
              <div className="text-2xl flex-shrink-0">
                {rankBadges[driver.rank - 1] || `#${driver.rank}`}
              </div>
              
              {/* Avatar & info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {driver.avatar ? (
                    <img src={driver.avatar} alt={driver.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    driver.name.charAt(0)
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-foreground truncate">{driver.name}</div>
                  <div className="text-xs text-muted-foreground truncate">"{driver.snippet}"</div>
                </div>
              </div>
              
              {/* Stats */}
              <div className="hidden md:flex items-center gap-6 text-sm">
                <div className="text-center">
                  <div className="font-medium text-foreground">{formatNumber(driver.views)}</div>
                  <div className="text-xs text-muted-foreground">Views</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-foreground">{driver.conversions}</div>
                  <div className="text-xs text-muted-foreground">Conversions</div>
                </div>
              </div>
              
              {/* Revenue */}
              <div className="text-right flex-shrink-0">
                <div className="font-bold text-emerald">{formatCurrency(driver.revenue)}</div>
                <Badge variant="secondary" className={driver.rank === 1 ? 'badge-gold text-xs' : 'text-xs'}>
                  {driver.rank === 1 ? 'Top Performer' : driver.placement}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
