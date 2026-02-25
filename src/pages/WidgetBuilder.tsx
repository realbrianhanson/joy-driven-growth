import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  ArrowLeft, Check, Copy, Monitor, Tablet, Smartphone,
  Sun, Moon, Settings, Palette, Users, Sparkles, Zap,
  Eye, Star, Play, ChevronDown, ChevronUp, GripVertical,
  Search, Code, ExternalLink, TestTube, Clock,
  MousePointer, Target, Shuffle, Loader2, Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const widgetTypeConfig: Record<string, { icon: string; name: string }> = {
  carousel: { icon: '🎠', name: 'Carousel' },
  grid: { icon: '📱', name: 'Grid' },
  single: { icon: '⭐', name: 'Single' },
  fomo: { icon: '🔔', name: 'FOMO Popup' },
  popup: { icon: '💬', name: 'Popup' },
  inline: { icon: '🏷️', name: 'Inline' },
};

const WidgetBuilder = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = !id || id === 'new';
  const initialType = searchParams.get('type') || 'carousel';

  const [widgetType, setWidgetType] = useState(initialType);
  const [widgetName, setWidgetName] = useState('');
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light');
  const [autoRotate, setAutoRotate] = useState(true);
  const [showRating, setShowRating] = useState(true);
  const [showDate, setShowDate] = useState(false);
  const [selectedTestimonials, setSelectedTestimonials] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch existing widget if editing
  const { data: existingWidget } = useQuery({
    queryKey: ['widget', id],
    queryFn: async () => {
      if (isNew) return null;
      const { data, error } = await supabase.from('widgets').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    enabled: !isNew,
  });

  useEffect(() => {
    if (existingWidget) {
      setWidgetName(existingWidget.name);
      setWidgetType(existingWidget.type || 'carousel');
      setTheme((existingWidget.theme as any) || 'light');
      setAutoRotate(existingWidget.auto_rotate ?? true);
      setShowRating(existingWidget.show_rating ?? true);
      setShowDate(existingWidget.show_date ?? false);
      setSelectedTestimonials(existingWidget.testimonial_ids || []);
    }
  }, [existingWidget]);

  // Fetch approved testimonials
  const { data: testimonials = [], isLoading: loadingTestimonials } = useQuery({
    queryKey: ['approved-testimonials', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('testimonials')
        .select('id, author_name, author_company, content, rating, revenue_attributed')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const filteredTestimonials = testimonials.filter(t =>
    t.author_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.author_company || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleTestimonial = (tid: string) => {
    setSelectedTestimonials(prev =>
      prev.includes(tid) ? prev.filter(t => t !== tid) : [...prev, tid]
    );
  };

  const embedCode = useMemo(() => {
    const widgetId = isNew ? 'YOUR_WIDGET_ID' : id;
    return `<script src="${window.location.origin}/widget.js" data-widget-id="${widgetId}"></script>`;
  }, [id, isNew]);

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    toast.success('Embed code copied!');
  };

  const handleSave = async () => {
    if (!user || !widgetName.trim()) {
      toast.error('Please enter a widget name');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        user_id: user.id,
        name: widgetName,
        type: widgetType as any,
        theme,
        auto_rotate: autoRotate,
        show_rating: showRating,
        show_date: showDate,
        testimonial_ids: selectedTestimonials,
        is_active: true,
      };

      if (isNew) {
        const { error } = await supabase.from('widgets').insert(payload);
        if (error) throw error;
        toast.success('Widget created! 🎉');
      } else {
        const { error } = await supabase.from('widgets').update(payload).eq('id', id);
        if (error) throw error;
        toast.success('Widget updated!');
      }
      navigate('/dashboard/widgets');
    } catch (error) {
      toast.error('Failed to save widget');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const isFomo = widgetType === 'fomo' || widgetType === 'popup';
  const selectedData = testimonials.filter(t => selectedTestimonials.includes(t.id));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container max-w-7xl mx-auto py-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard/widgets">
                <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{widgetTypeConfig[widgetType]?.icon}</span>
                <Input
                  value={widgetName}
                  onChange={(e) => setWidgetName(e.target.value)}
                  placeholder="Widget name..."
                  className="border-none text-lg font-semibold bg-transparent focus:ring-0 w-64"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button className="gradient-sunny text-white" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {isNew ? 'Create Widget' : 'Save Widget'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left - Controls */}
          <div className="space-y-4 max-h-[calc(100vh-160px)] overflow-y-auto pr-2">
            {/* Widget Type */}
            <Card className="bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="w-4 h-4 text-primary" />Widget Type
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(widgetTypeConfig).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setWidgetType(key)}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${
                        widgetType === key ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="text-2xl mb-1">{config.icon}</div>
                      <div className="text-xs font-medium text-foreground">{config.name}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Testimonials Selector */}
            <Card className="bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Testimonials
                  <Badge variant="secondary">{selectedTestimonials.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
                {loadingTestimonials ? (
                  <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
                ) : testimonials.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-sm">
                    <p>No approved testimonials yet.</p>
                    <p className="mt-1">Approve some testimonials first!</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredTestimonials.map((t) => (
                      <div
                        key={t.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedTestimonials.includes(t.id) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                        }`}
                        onClick={() => toggleTestimonial(t.id)}
                      >
                        <Checkbox checked={selectedTestimonials.includes(t.id)} />
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-medium">
                          {t.author_name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-foreground truncate">{t.author_name}</div>
                          <div className="text-xs text-muted-foreground">{t.author_company}</div>
                        </div>
                        <div className="flex items-center gap-1 text-amber">
                          {[...Array(t.rating || 0)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Settings */}
            <Card className="bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" />Appearance & Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-4">
                <div>
                  <Label className="text-sm mb-2 block">Theme</Label>
                  <div className="flex gap-2">
                    {[
                      { value: 'light', icon: Sun, label: 'Light' },
                      { value: 'dark', icon: Moon, label: 'Dark' },
                      { value: 'auto', icon: Settings, label: 'Auto' },
                    ].map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setTheme(t.value as typeof theme)}
                        className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border-2 transition-all ${
                          theme === t.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <t.icon className="w-4 h-4" /><span className="text-sm">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Show rating</Label>
                  <Switch checked={showRating} onCheckedChange={setShowRating} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Show date</Label>
                  <Switch checked={showDate} onCheckedChange={setShowDate} />
                </div>
                {widgetType === 'carousel' && (
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Auto-rotate</Label>
                    <Switch checked={autoRotate} onCheckedChange={setAutoRotate} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Embed Code */}
            <Card className="bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Code className="w-4 h-4 text-primary" />Embed Code
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="relative">
                  <pre className="p-4 rounded-lg bg-foreground/5 text-sm overflow-x-auto">
                    <code className="text-foreground">{embedCode}</code>
                  </pre>
                  <Button size="sm" className="absolute top-2 right-2" onClick={copyEmbedCode}>
                    <Copy className="w-4 h-4 mr-1" />Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right - Preview */}
          <div className="space-y-4">
            <Card className="bg-card">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {[
                      { value: 'desktop', icon: Monitor },
                      { value: 'tablet', icon: Tablet },
                      { value: 'mobile', icon: Smartphone },
                    ].map((d) => (
                      <button
                        key={d.value}
                        onClick={() => setDevice(d.value as typeof device)}
                        className={`p-2 rounded-lg transition-all ${
                          device === d.value ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <d.icon className="w-5 h-5" />
                      </button>
                    ))}
                  </div>
                  <Badge variant="secondary">{selectedTestimonials.length} testimonials</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Preview Area */}
            <div className={`rounded-2xl border border-border overflow-hidden transition-all ${
              device === 'mobile' ? 'max-w-[375px] mx-auto' : device === 'tablet' ? 'max-w-[768px] mx-auto' : ''
            }`}>
              <div className={`min-h-[500px] p-6 ${theme === 'dark' ? 'bg-gray-900' : 'bg-background'}`}>
                {selectedData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-20">
                    <div className="text-5xl mb-4">👆</div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Select Testimonials</h3>
                    <p className="text-sm text-muted-foreground">Pick testimonials from the left to preview your widget</p>
                  </div>
                ) : widgetType === 'carousel' ? (
                  <div className="space-y-4">
                    {selectedData.slice(0, 1).map((t) => (
                      <Card key={t.id} className="bg-card">
                        <CardContent className="p-6 text-center">
                          {showRating && (
                            <div className="flex justify-center gap-0.5 mb-3">
                              {[...Array(t.rating || 5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-amber text-amber" />)}
                            </div>
                          )}
                          <p className="text-foreground mb-4 italic">"{t.content}"</p>
                          <div className="font-medium text-foreground">{t.author_name}</div>
                          <div className="text-sm text-muted-foreground">{t.author_company}</div>
                        </CardContent>
                      </Card>
                    ))}
                    <div className="flex justify-center gap-2">
                      {selectedData.slice(0, 5).map((_, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-primary' : 'bg-muted'}`} />
                      ))}
                    </div>
                  </div>
                ) : widgetType === 'grid' ? (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedData.slice(0, 4).map((t) => (
                      <Card key={t.id} className="bg-card">
                        <CardContent className="p-4">
                          {showRating && (
                            <div className="flex gap-0.5 mb-2">
                              {[...Array(t.rating || 5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber text-amber" />)}
                            </div>
                          )}
                          <p className="text-sm text-foreground mb-3 line-clamp-3">"{t.content}"</p>
                          <div className="text-sm font-medium text-foreground">{t.author_name}</div>
                          <div className="text-xs text-muted-foreground">{t.author_company}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : widgetType === 'fomo' || widgetType === 'popup' ? (
                  <div className="flex items-end justify-start h-full">
                    <div className="bg-card border border-border rounded-xl p-4 shadow-lg max-w-xs animate-in slide-in-from-bottom-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-bold">
                          {selectedData[0]?.author_name?.[0] || '?'}
                        </div>
                        <div>
                          <p className="text-sm text-foreground font-medium">{selectedData[0]?.author_name} just left a review</p>
                          {showRating && (
                            <div className="flex gap-0.5 mt-1">
                              {[...Array(selectedData[0]?.rating || 5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber text-amber" />)}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">just now</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Single / Inline */
                  <Card className="bg-card">
                    <CardContent className="p-6">
                      {showRating && (
                        <div className="flex gap-0.5 mb-3">
                          {[...Array(selectedData[0]?.rating || 5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-amber text-amber" />)}
                        </div>
                      )}
                      <p className="text-foreground mb-4">"{selectedData[0]?.content}"</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-medium">
                          {selectedData[0]?.author_name?.[0]}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{selectedData[0]?.author_name}</div>
                          <div className="text-sm text-muted-foreground">{selectedData[0]?.author_company}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WidgetBuilder;
