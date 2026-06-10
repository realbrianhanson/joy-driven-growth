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
  MoreVertical,
  Edit,
  Trash2,
  ExternalLink,
  BarChart3,
  Grid3X3,
  Star,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspace } from "@/hooks/use-workspace";
import { toast } from "sonner";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { MOCK_WIDGETS } from "@/data/mock/widgets";

const widgetTypes = [
  { id: 'carousel', Icon: LayoutGrid, name: 'Carousel', description: 'Rotating showcase' },
  { id: 'grid', Icon: Grid3X3, name: 'Grid', description: 'Beautiful masonry' },
  { id: 'single', Icon: Star, name: 'Single', description: 'Featured single' },
  { id: 'fomo', Icon: Bell, name: 'FOMO Popup', description: 'Real-time social proof', isNew: true },
  { id: 'popup', Icon: MessageSquare, name: 'Popup', description: 'Slide-in alerts', isNew: true },
  { id: 'inline', Icon: Award, name: 'Inline', description: 'Compact trust signal' },
];

const getWidgetTypeInfo = (type: string) => {
  const typeMap: Record<string, { label: string; IconComponent: any }> = {
    carousel: { label: 'Carousel', IconComponent: LayoutGrid },
    grid: { label: 'Grid', IconComponent: Grid3X3 },
    single: { label: 'Single', IconComponent: Star },
    popup: { label: 'Popup', IconComponent: MessageSquare },
    fomo: { label: 'FOMO', IconComponent: Bell },
    inline: { label: 'Inline', IconComponent: Award },
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
  const { workspaceOwnerId } = useWorkspace();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const { isDemoMode } = useDemoMode();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: realWidgets = [], isLoading: realLoading, error: widgetsError, refetch } = useQuery({
    queryKey: ['widgets', workspaceOwnerId],
    queryFn: async () => {
      if (!workspaceOwnerId) return [];
      const { data, error } = await supabase
        .from('widgets')
        .select('*')
        .eq('user_id', workspaceOwnerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceOwnerId && !isDemoMode,
  });

  const widgets: any[] = isDemoMode ? (MOCK_WIDGETS as any[]) : realWidgets;
  const isLoading = isDemoMode ? false : realLoading;

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

  const handleDeleteRequest = (id: string) => {
    if (isDemoMode) {
      toast.info("Switch to live data to delete widgets.");
      return;
    }
    setDeleteTarget(id);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const id = deleteTarget;
    setDeleteTarget(null);
    deleteWidget.mutate(id);
  };

  const handlePreview = (widgetId: string) => {
    if (isDemoMode) {
      toast.info("Switch to live data to preview real widgets.");
      return;
    }
    window.open(`/embed/widget/${widgetId}`, "_blank", "noopener,noreferrer");
  };

  const filteredWidgets = widgets.filter(widget =>
    widget.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = widgets.filter((w: any) => w.is_active).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-foreground">Widgets</h1>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="tabular-nums">{widgets.length}</span> total
              {activeCount > 0 && (
                <>
                  <span className="mx-1.5 text-border">·</span>
                  <span className="tabular-nums">{activeCount}</span> active
                </>
              )}
            </p>
          </div>
          <Link to="/dashboard/widgets/new">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              New Widget
            </Button>
          </Link>
        </div>

        {/* Widget Type Cards */}
        <div className="mb-8">
          <h2 className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-3">Create New Widget</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {widgetTypes.map((type) => (
              <Link key={type.id} to={`/dashboard/widgets/new?type=${type.id}`}>
                <Card className="bg-card border border-border hover:border-border-hover hover:bg-primary-light/30 transition-colors cursor-pointer h-full rounded-xl shadow-none">
                  <CardContent className="p-4">
                    <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center mb-3">
                      <type.Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="font-medium text-sm text-foreground flex items-center gap-1.5">
                      {type.name}
                      {type.isNew && (
                        <span className="text-[9px] uppercase tracking-wider font-medium text-primary">New</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{type.description}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search widgets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 bg-card border-border"
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

        {/* Error State */}
        {!isLoading && widgetsError && !isDemoMode && (
          <div className="text-center py-24 border border-dashed border-destructive/30 rounded-xl">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-destructive/10 mb-4">
              <AlertCircle className="w-5 h-5 text-destructive" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1.5">Couldn't load widgets</h3>
            <p className="text-sm text-muted-foreground mb-5">{widgetsError instanceof Error ? widgetsError.message : "Something went wrong."}</p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
          </div>
        )}

        {/* Widgets Grid */}
        {!isLoading && !widgetsError && (
          <div className="grid gap-2">
            {filteredWidgets.map((widget) => {
              const typeInfo = getWidgetTypeInfo(widget.type || 'carousel');
              const ctr = widget.impressions && widget.impressions > 0
                ? ((widget.clicks || 0) / widget.impressions * 100).toFixed(1)
                : '0.0';
              return (
                <Card key={widget.id} className="bg-card border border-border hover:border-border-hover transition-colors rounded-xl shadow-none">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
                          <typeInfo.IconComponent className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground text-[15px] truncate">{widget.name}</h3>
                            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
                              <span
                                className={`inline-block w-1.5 h-1.5 rounded-full ${widget.is_active ? 'bg-success' : 'bg-muted-foreground/40'}`}
                                aria-hidden
                              />
                              {widget.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">{typeInfo.label}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="hidden md:flex items-center gap-6">
                          <div className="text-right">
                            <div className="flex items-center justify-end gap-1 text-[10px] uppercase tracking-wider font-medium text-muted-foreground"><Eye className="w-3 h-3" />Views</div>
                            <div className="font-semibold text-foreground tabular-nums text-sm mt-0.5">{formatNumber(widget.impressions || 0)}</div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center justify-end gap-1 text-[10px] uppercase tracking-wider font-medium text-muted-foreground"><MousePointer className="w-3 h-3" />Clicks</div>
                            <div className="font-semibold text-foreground tabular-nums text-sm mt-0.5">{formatNumber(widget.clicks || 0)}</div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center justify-end gap-1 text-[10px] uppercase tracking-wider font-medium text-muted-foreground"><BarChart3 className="w-3 h-3" />CTR</div>
                            <div className="font-semibold text-foreground tabular-nums text-sm mt-0.5">{ctr}%</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Revenue</div>
                            <div className="font-semibold text-foreground tabular-nums text-sm mt-0.5">{formatCurrency(Number(widget.revenue_attributed) || 0)}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Link to={`/dashboard/widgets/${widget.id}`}>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                          </Link>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"><MoreVertical className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-card border-border">
                              <DropdownMenuItem className="cursor-pointer" onClick={() => handlePreview(widget.id)}><ExternalLink className="w-4 h-4 mr-2" />Preview</DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer text-destructive" onClick={() => handleDeleteRequest(widget.id)}>
                                <Trash2 className="w-4 h-4 mr-2" />Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Stats */}
                    <div className="flex md:hidden items-center gap-4 mt-3 pt-3 border-t border-border">
                      <div className="flex items-center gap-1 text-xs"><Eye className="w-3 h-3 text-muted-foreground" /><span className="font-medium tabular-nums">{formatNumber(widget.impressions || 0)}</span></div>
                      <div className="flex items-center gap-1 text-xs"><MousePointer className="w-3 h-3 text-muted-foreground" /><span className="font-medium tabular-nums">{formatNumber(widget.clicks || 0)}</span></div>
                      <div className="flex items-center gap-1 text-xs"><BarChart3 className="w-3 h-3 text-muted-foreground" /><span className="font-medium tabular-nums">{ctr}%</span></div>
                      <div className="text-xs ml-auto"><span className="font-medium tabular-nums">{formatCurrency(Number(widget.revenue_attributed) || 0)}</span></div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!isLoading && !widgetsError && filteredWidgets.length === 0 && (
          <div className="text-center py-24 border border-dashed border-border rounded-xl">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-light mb-4">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1.5">No widgets yet</h3>
            <p className="text-sm text-muted-foreground mb-5">Create your first widget to start showcasing testimonials</p>
            <Link to="/dashboard/widgets/new">
              <Button size="sm"><Plus className="w-4 h-4 mr-1.5" />Create Widget</Button>
            </Link>
          </div>
        )}

        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete widget?</AlertDialogTitle>
              <AlertDialogDescription>This will remove the widget. Any sites embedding it will stop displaying testimonials.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Widgets;
