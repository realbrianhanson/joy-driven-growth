import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, Sparkles, Star, DollarSign, Video, Check,
  Copy, RefreshCw, Edit, Save, Download, Twitter,
  Linkedin, Mail, FileText, Image, Scissors, Bot,
  Lock, Loader2, Instagram
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspace } from "@/hooks/use-workspace";
import ContentRenderer, { flattenContent } from "@/components/content/ContentRenderer";

interface ContentType {
  id: string;
  Icon: any;
  title: string;
  subtitle: string;
  category: 'text' | 'visual' | 'video';
  isPro?: boolean;
  dbType: string;
}

const contentTypes: ContentType[] = [
  { id: 'twitter', Icon: Twitter, title: 'Twitter Thread', subtitle: 'Viral thread with hooks', category: 'text', dbType: 'twitter_thread' },
  { id: 'linkedin', Icon: Linkedin, title: 'LinkedIn Post', subtitle: 'Professional storytelling', category: 'text', dbType: 'linkedin_post' },
  { id: 'instagram', Icon: Instagram, title: 'Instagram Carousel', subtitle: '5 swipe-worthy slides', category: 'visual', isPro: true, dbType: 'instagram_carousel' },
  { id: 'email', Icon: Mail, title: 'Email Snippet', subtitle: 'For sales sequences', category: 'text', dbType: 'email_snippet' },
  { id: 'casestudy', Icon: FileText, title: 'Case Study', subtitle: 'Mini success story', category: 'text', dbType: 'case_study' },
  { id: 'quote', Icon: Image, title: 'Quote Graphic', subtitle: 'Share-ready images', category: 'visual', dbType: 'quote_graphic' },
  { id: 'highlight', Icon: Scissors, title: 'Video Highlight', subtitle: 'Best moments clipped', category: 'video', isPro: true, dbType: 'video_highlight' },
  { id: 'avatar', Icon: Bot, title: 'AI Avatar Video', subtitle: 'Text becomes video', category: 'video', isPro: true, dbType: 'ai_avatar' },
];

interface GeneratedResult {
  contentType: string;
  data: any;
}

const ContentStudio = () => {
  const { user } = useAuth();
  const { workspaceOwnerId } = useWorkspace();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<'all' | 'top' | 'video' | 'revenue'>('all');
  const [selectedTestimonials, setSelectedTestimonials] = useState<string[]>([]);
  const [selectedContentType, setSelectedContentType] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [variants, setVariants] = useState<GeneratedResult[]>([]);
  const [activeVariant, setActiveVariant] = useState(0);

  // Fetch real testimonials
  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ['content-studio-testimonials', workspaceOwnerId],
    queryFn: async () => {
      if (!workspaceOwnerId) return [];
      const { data, error } = await supabase
        .from('testimonials')
        .select('id, author_name, author_company, content, rating, revenue_attributed, type')
        .eq('user_id', workspaceOwnerId)
        .eq('status', 'approved')
        .order('revenue_attributed', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceOwnerId,
  });

  const filteredTestimonials = testimonials.filter(t => {
    const matchesSearch = t.author_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.author_company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.content || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === 'top') return matchesSearch && t.rating === 5;
    if (filter === 'video') return matchesSearch && t.type === 'video';
    if (filter === 'revenue') return matchesSearch && Number(t.revenue_attributed) > 2000;
    return matchesSearch;
  });

  const toggleTestimonial = (id: string) => {
    setSelectedTestimonials(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

  const generateContent = async () => {
    if (selectedTestimonials.length === 0 || !selectedContentType || !workspaceOwnerId) return;
    setIsGenerating(true);

    try {
      const selectedData = testimonials.filter(t => selectedTestimonials.includes(t.id));
      const contentTypeInfo = contentTypes.find(ct => ct.id === selectedContentType);

      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          testimonials: selectedData.map(t => ({
            id: t.id,
            name: t.author_name,
            company: t.author_company || '',
            content: t.content || '',
            rating: t.rating || 5,
            revenue: Number(t.revenue_attributed) || 0,
          })),
          contentType: selectedContentType,
          contentTypeInfo: { title: contentTypeInfo?.title, subtitle: contentTypeInfo?.subtitle },
          workspace_owner_id: workspaceOwnerId,
        }
      });

      if (error) throw error;
      const result: GeneratedResult = {
        contentType: data.contentType || selectedContentType,
        data: data.content,
      };
      // Keep up to 3 variants
      setVariants(prev => {
        const next = [...prev, result].slice(-3);
        setActiveVariant(next.length - 1);
        return next;
      });

      // Save to generated_content
      await supabase.from('generated_content').insert({
        user_id: workspaceOwnerId,
        testimonial_ids: selectedTestimonials,
        type: contentTypeInfo?.dbType as any,
        content: JSON.stringify(result.data),
      });

      toast.success('Content generated and saved');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const current = variants[activeVariant] || null;
  const copyContent = () => {
    if (!current) return;
    navigator.clipboard.writeText(flattenContent(current.contentType, current.data));
    toast.success('Copied to clipboard!');
  };



  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-foreground">Content Studio</h1>
            <p className="text-sm text-muted-foreground mt-1">Transform testimonials into ready-to-publish marketing assets.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* LEFT - Source */}
          <div className="space-y-4">
            <Card className="bg-card border border-border rounded-xl shadow-none">
              <CardContent className="p-5">
                <h2 className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-3">Source</h2>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search testimonials..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-9" />
                </div>
                <div className="flex flex-wrap gap-1 mb-4 border-b border-border -mx-5 px-5 pb-3">
                  {[{ value: 'all', label: 'All' }, { value: 'top', label: 'Top rated' }, { value: 'video', label: 'Video' }, { value: 'revenue', label: 'High revenue' }].map((f) => (
                    <button key={f.value} onClick={() => setFilter(f.value as any)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${filter === f.value ? 'bg-primary-light text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}`}>
                      {f.label}
                    </button>
                  ))}
                </div>

                {selectedTestimonials.length > 0 && (
                  <div className="text-[10px] uppercase tracking-wider font-medium text-primary mb-3 tabular-nums">{selectedTestimonials.length} selected</div>
                )}

                {isLoading ? (
                  <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
                ) : testimonials.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-border rounded-lg">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary-light mb-3">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">No approved testimonials yet.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[440px] overflow-y-auto -mx-1 px-1">
                    {filteredTestimonials.map((t) => {
                      const isSelected = selectedTestimonials.includes(t.id);
                      return (
                        <div key={t.id} onClick={() => toggleTestimonial(t.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'border-primary bg-primary-light/60' : 'border-border hover:border-border-hover'}`}>
                          <div className="flex items-start gap-3">
                            <div className="relative shrink-0">
                              <div className="w-9 h-9 rounded-full bg-primary-light text-primary flex items-center justify-center text-sm font-semibold">{t.author_name[0]}</div>
                              {isSelected && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center ring-2 ring-card">
                                  <Check className="w-2.5 h-2.5 text-primary-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="font-medium text-sm text-foreground truncate">{t.author_name}</span>
                                {t.type === 'video' && <Video className="w-3 h-3 text-muted-foreground shrink-0" />}
                              </div>
                              <div className="text-xs text-muted-foreground mb-1 truncate">{t.author_company}</div>
                              <p className="text-xs text-muted-foreground line-clamp-2">{t.content}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <div className="flex gap-px">{[...Array(t.rating || 0)].map((_, i) => <Star key={i} className="w-3 h-3 fill-foreground text-foreground" />)}</div>
                                {Number(t.revenue_attributed) > 0 && (
                                  <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground tabular-nums">
                                    {formatCurrency(Number(t.revenue_attributed))}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* CENTER - Content Type */}
          <div className="space-y-4">
            <Card className="bg-card border border-border rounded-xl shadow-none">
              <CardContent className="p-5">
                <h2 className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-3">Format</h2>
                <div className="grid grid-cols-2 gap-2">
                  {contentTypes.map((type) => {
                    const isSelected = selectedContentType === type.id;
                    return (
                      <button key={type.id} onClick={() => !type.isPro && setSelectedContentType(type.id)} disabled={type.isPro}
                        className={`relative p-3 rounded-lg border text-left transition-colors ${
                          isSelected ? 'border-primary bg-primary-light' :
                          type.isPro ? 'border-border bg-muted/30 opacity-60' :
                          'border-border hover:border-border-hover'
                        }`}>
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center mb-2 ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                          <type.Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="font-medium text-sm text-foreground">{type.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{type.subtitle}</div>
                        {type.isPro && (
                          <div className="absolute top-2 right-2 inline-flex items-center gap-1 text-[9px] uppercase tracking-wider font-medium text-muted-foreground">
                            <Lock className="w-2.5 h-2.5" /> Pro
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <Button
                  className="w-full mt-5 h-9"
                  disabled={selectedTestimonials.length === 0 || !selectedContentType || isGenerating}
                  onClick={() => { setVariants([]); setActiveVariant(0); generateContent(); }}
                >
                  {isGenerating ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />Generating…</> : <><Sparkles className="w-4 h-4 mr-1.5" />Generate</>}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT - Output */}
          <div className="space-y-4">
            <Card className="bg-card border border-border rounded-xl shadow-none min-h-[520px]">
              <CardContent className="p-5 h-full">
                {!current && !isGenerating && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-light mb-4">
                      <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1.5">Ready to generate</h3>
                    <p className="text-sm text-muted-foreground max-w-[220px]">Pick at least one testimonial and a format to get started.</p>
                  </div>
                )}
                {isGenerating && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <Loader2 className="w-6 h-6 text-primary animate-spin mb-4" />
                    <h3 className="text-base font-semibold text-foreground mb-1">Generating…</h3>
                    <p className="text-sm text-muted-foreground">This usually takes a few seconds.</p>
                  </div>
                )}
                {current && !isGenerating && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Output</h3>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="h-8" onClick={copyContent}><Copy className="w-3.5 h-3.5 mr-1.5" />Copy</Button>
                        <Button variant="outline" size="sm" className="h-8" onClick={generateContent}><RefreshCw className="w-3.5 h-3.5 mr-1.5" />Regenerate</Button>
                      </div>
                    </div>
                    {variants.length > 1 && (
                      <div className="flex gap-1">
                        {variants.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveVariant(i)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                              activeVariant === i ? 'bg-primary-light text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                            }`}
                          >
                            Version {i + 1}
                          </button>
                        ))}
                      </div>
                    )}
                    <ContentRenderer contentType={current.contentType} data={current.data} />
                    {variants.length < 3 && (
                      <Button variant="outline" size="sm" className="h-8 w-full" onClick={generateContent}>
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />Generate another version
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentStudio;
