import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Plus, 
  Search, 
  LayoutGrid, 
  Bell, 
  MessageSquare, 
  Award,
  Sparkles,
  Eye,
  MousePointer,
  DollarSign,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  ExternalLink,
  BarChart3,
  Grid3X3,
  Star,
  Rows3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Widget {
  id: string;
  name: string;
  type: 'carousel' | 'grid' | 'spotlight' | 'wall' | 'fomo' | 'notification' | 'badge';
  status: 'active' | 'inactive';
  impressions: number;
  clicks: number;
  ctr: number;
  revenue: number;
  lastUpdated: string;
}

const widgetTypes = [
  { id: 'carousel', icon: '🎠', name: 'Carousel', description: 'Rotating showcase' },
  { id: 'grid', icon: '📱', name: 'Grid', description: 'Beautiful masonry' },
  { id: 'spotlight', icon: '⭐', name: 'Spotlight', description: 'Featured single' },
  { id: 'wall', icon: '🧱', name: 'Wall of Love', description: 'Infinite scroll page' },
  { id: 'fomo', icon: '🔔', name: 'FOMO Popup', description: 'Real-time social proof', isNew: true },
  { id: 'notification', icon: '💬', name: 'Notification', description: 'Slide-in alerts', isNew: true },
  { id: 'badge', icon: '🏷️', name: 'Badge', description: 'Compact trust signal' },
];

const mockWidgets: Widget[] = [
  {
    id: '1',
    name: 'Homepage Carousel',
    type: 'carousel',
    status: 'active',
    impressions: 12453,
    clicks: 892,
    ctr: 7.2,
    revenue: 8470,
    lastUpdated: '2 hours ago',
  },
  {
    id: '2',
    name: 'Pricing Page Testimonials',
    type: 'grid',
    status: 'active',
    impressions: 8234,
    clicks: 456,
    ctr: 5.5,
    revenue: 4230,
    lastUpdated: '1 day ago',
  },
  {
    id: '3',
    name: 'Social Proof Popup',
    type: 'fomo',
    status: 'active',
    impressions: 34521,
    clicks: 2341,
    ctr: 6.8,
    revenue: 12890,
    lastUpdated: '3 hours ago',
  },
  {
    id: '4',
    name: 'Featured Customer',
    type: 'spotlight',
    status: 'inactive',
    impressions: 2341,
    clicks: 123,
    ctr: 5.3,
    revenue: 890,
    lastUpdated: '5 days ago',
  },
  {
    id: '5',
    name: 'Customer Wall',
    type: 'wall',
    status: 'active',
    impressions: 5672,
    clicks: 345,
    ctr: 6.1,
    revenue: 3450,
    lastUpdated: '12 hours ago',
  },
];

const getWidgetTypeInfo = (type: Widget['type']) => {
  const typeMap = {
    carousel: { icon: '🎠', label: 'Carousel', IconComponent: LayoutGrid },
    grid: { icon: '📱', label: 'Grid', IconComponent: Grid3X3 },
    spotlight: { icon: '⭐', label: 'Spotlight', IconComponent: Star },
    wall: { icon: '🧱', label: 'Wall', IconComponent: Rows3 },
    fomo: { icon: '🔔', label: 'FOMO', IconComponent: Bell },
    notification: { icon: '💬', label: 'Notification', IconComponent: MessageSquare },
    badge: { icon: '🏷️', label: 'Badge', IconComponent: Award },
  };
  return typeMap[type];
};

const formatNumber = (num: number) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount);
};

const Widgets = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [widgets] = useState<Widget[]>(mockWidgets);

  const filteredWidgets = widgets.filter(widget =>
    widget.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
              Popups & Widgets 🔔
            </h1>
            <p className="text-muted-foreground mt-1">
              Show off your happy clients everywhere
            </p>
          </div>
          <Link to="/dashboard/widgets/new">
            <Button className="gradient-sunny text-white shadow-warm hover:shadow-warm-lg transition-all">
              <Plus className="w-4 h-4 mr-2" />
              New Widget
            </Button>
          </Link>
        </div>

        {/* Widget Type Cards */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">Create New Widget</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {widgetTypes.map((type) => (
              <Link key={type.id} to={`/dashboard/widgets/new?type=${type.id}`}>
                <Card className="bg-card hover:border-primary/50 hover:shadow-warm transition-all cursor-pointer group h-full">
                  <CardContent className="p-4 text-center">
                    <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                      {type.icon}
                    </div>
                    <div className="font-medium text-sm text-foreground flex items-center justify-center gap-1">
                      {type.name}
                      {type.isNew && (
                        <Badge className="bg-emerald text-white text-[10px] px-1 py-0">
                          NEW
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {type.description}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search widgets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border focus:border-primary focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Widgets Grid */}
        <div className="grid gap-4">
          {filteredWidgets.map((widget) => {
            const typeInfo = getWidgetTypeInfo(widget.type);
            return (
              <Card 
                key={widget.id}
                className="bg-card hover:border-primary/30 hover:shadow-warm transition-all group"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                        {typeInfo.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{widget.name}</h3>
                          <Badge 
                            variant={widget.status === 'active' ? 'default' : 'secondary'}
                            className={widget.status === 'active' ? 'bg-emerald text-white' : ''}
                          >
                            {widget.status === 'active' ? '🟢 Active' : '⚫ Inactive'}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <typeInfo.IconComponent className="w-3 h-3" />
                          {typeInfo.label} • Updated {widget.lastUpdated}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      {/* Stats */}
                      <div className="hidden md:flex items-center gap-6">
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-muted-foreground text-sm">
                            <Eye className="w-3.5 h-3.5" />
                            Impressions
                          </div>
                          <div className="font-semibold text-foreground">
                            {formatNumber(widget.impressions)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-muted-foreground text-sm">
                            <MousePointer className="w-3.5 h-3.5" />
                            Clicks
                          </div>
                          <div className="font-semibold text-foreground">
                            {formatNumber(widget.clicks)}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-muted-foreground text-sm">
                            <BarChart3 className="w-3.5 h-3.5" />
                            CTR
                          </div>
                          <div className="font-semibold text-foreground">
                            {widget.ctr}%
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center gap-1 text-gold text-sm">
                            <DollarSign className="w-3.5 h-3.5" />
                            Revenue
                          </div>
                          <div className="font-semibold text-gold">
                            {formatCurrency(widget.revenue)}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Link to={`/dashboard/widgets/${widget.id}`}>
                          <Button variant="outline" size="sm" className="border-border hover:border-primary hover:bg-primary/5">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border">
                            <DropdownMenuItem className="cursor-pointer">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Stats */}
                  <div className="flex md:hidden items-center gap-4 mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-1 text-sm">
                      <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium">{formatNumber(widget.impressions)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <MousePointer className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium">{formatNumber(widget.clicks)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gold">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span className="font-medium">{formatCurrency(widget.revenue)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredWidgets.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No widgets yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first widget to start showcasing testimonials
            </p>
            <Link to="/dashboard/widgets/new">
              <Button className="gradient-sunny text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Widget
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Widgets;
