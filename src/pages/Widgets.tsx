import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Plus, 
  Search, 
  LayoutGrid, 
  Bell, 
  MessageSquare, 
  Award,
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
  Rows3,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const widgetTypes = [
  { id: 'carousel', icon: '🎠', name: 'Carousel', description: 'Rotating showcase' },
  { id: 'grid', icon: '📱', name: 'Grid', description: 'Beautiful masonry' },
  { id: 'single', icon: '⭐', name: 'Single', description: 'Featured single' },
  { id: 'fomo', icon: '🔔', name: 'FOMO Popup', description: 'Real-time social proof', isNew: true },
  { id: 'popup', icon: '💬', name: 'Popup', description: 'Slide-in alerts', isNew: true },
  { id: 'inline', icon: '🏷️', name: 'Inline', description: 'Compact trust signal' },
];

const getWidgetTypeInfo = (type: string) => {
  const typeMap: Record<string, { icon: string; label: string; IconComponent: any }> = {
    carousel: { icon: '🎠', label: 'Carousel', IconComponent: LayoutGrid },
    grid: { icon: '📱', label: 'Grid', IconComponent: Grid3X3 },
    single: { icon: '⭐', label: 'Single', IconComponent: Star },
    popup: { icon: '💬', label: 'Popup', IconComponent: MessageSquare },
    fomo: { icon: '🔔', label: 'FOMO', IconComponent: Bell },
    inline: { icon: '🏷️', label: 'Inline', IconComponent: Award },
  };
  return typeMap[type] || typeMap.carousel;
};

const formatNumber = (num: number) => {
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
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
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: widgets = [], isLoading } = useQuery({
    queryKey: ['widgets', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('widgets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const deleteWidget = useMutation({
    mutationFn: async (widgetId: string) => {
      const { error } = await supabase.from('widgets').delete().eq('id', widgetId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widgets'] });
      toast.success('Widget deleted');
    },
    onError: () => toast.error('Failed to delete widget'),
  });

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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
                        <Badge className="bg-emerald text-white text-[10px] px-1 py-0">NEW</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{type.description}</div>
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

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-card"><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))}
          </div>
        )}

        {/* Widgets Grid */}
        {!isLoading && (
          <div className="grid gap-4">
            {filteredWidgets.map((widget) => {
              const typeInfo = getWidgetTypeInfo(widget.type || 'carousel');
              const ctr = widget.impressions && widget.impressions > 0
                ? ((widget.clicks || 0) / widget.impressions * 100).toFixed(1)
                : '0.0';
              return (
                <Card key={widget.id} className="bg-card hover:border-primary/30 hover:shadow-warm transition-all group">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                          {typeInfo.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">{widget.name}</h3>
                            <Badge variant={widget.is_active ? 'default' : 'secondary'} className={widget.is_active ? 'bg-emerald text-white' : ''}>
                              {widget.is_active ? '🟢 Active' : '⚫ Inactive'}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <typeInfo.IconComponent className="w-3 h-3" />
                            {typeInfo.label}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                        <div className="hidden md:flex items-center gap-6">
                          <div className="text-center">
                            <div className="flex items-center gap-1 text-muted-foreground text-sm"><Eye className="w-3.5 h-3.5" />Views</div>
                            <div className="font-semibold text-foreground">{formatNumber(widget.impressions || 0)}</div>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center gap-1 text-muted-foreground text-sm"><MousePointer className="w-3.5 h-3.5" />Clicks</div>
                            <div className="font-semibold text-foreground">{formatNumber(widget.clicks || 0)}</div>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center gap-1 text-muted-foreground text-sm"><BarChart3 className="w-3.5 h-3.5" />CTR</div>
                            <div className="font-semibold text-foreground">{ctr}%</div>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center gap-1 text-gold text-sm"><DollarSign className="w-3.5 h-3.5" />Revenue</div>
                            <div className="font-semibold text-gold">{formatCurrency(Number(widget.revenue_attributed) || 0)}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link to={`/dashboard/widgets/${widget.id}`}>
                            <Button variant="outline" size="sm" className="border-border hover:border-primary hover:bg-primary/5">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card border-border">
                              <DropdownMenuItem className="cursor-pointer"><ExternalLink className="w-4 h-4 mr-2" />Preview</DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer text-destructive" onClick={() => deleteWidget.mutate(widget.id)}>
                                <Trash2 className="w-4 h-4 mr-2" />Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Stats */}
                    <div className="flex md:hidden items-center gap-4 mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-1 text-sm"><Eye className="w-3.5 h-3.5 text-muted-foreground" /><span className="font-medium">{formatNumber(widget.impressions || 0)}</span></div>
                      <div className="flex items-center gap-1 text-sm"><MousePointer className="w-3.5 h-3.5 text-muted-foreground" /><span className="font-medium">{formatNumber(widget.clicks || 0)}</span></div>
                      <div className="flex items-center gap-1 text-sm text-gold"><DollarSign className="w-3.5 h-3.5" /><span className="font-medium">{formatCurrency(Number(widget.revenue_attributed) || 0)}</span></div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!isLoading && filteredWidgets.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No widgets yet</h3>
            <p className="text-muted-foreground mb-6">Create your first widget to start showcasing testimonials</p>
            <Link to="/dashboard/widgets/new">
              <Button className="gradient-sunny text-white"><Plus className="w-4 h-4 mr-2" />Create Widget</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Widgets;
