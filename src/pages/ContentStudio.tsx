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

interface ContentType {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  category: 'text' | 'visual' | 'video';
  isPro?: boolean;
  dbType: string;
}

const contentTypes: ContentType[] = [
  { id: 'twitter', emoji: '🐦', title: 'Twitter Thread', subtitle: 'Viral thread with hooks', category: 'text', dbType: 'twitter_thread' },
  { id: 'linkedin', emoji: '💼', title: 'LinkedIn Post', subtitle: 'Professional storytelling', category: 'text', dbType: 'linkedin_post' },
  { id: 'instagram', emoji: '📸', title: 'Instagram Carousel', subtitle: '5 swipe-worthy slides', category: 'visual', isPro: true, dbType: 'instagram_carousel' },
  { id: 'email', emoji: '📧', title: 'Email Snippet', subtitle: 'For sales sequences', category: 'text', dbType: 'email_snippet' },
  { id: 'casestudy', emoji: '📄', title: 'Case Study', subtitle: 'Mini success story', category: 'text', dbType: 'case_study' },
  { id: 'quote', emoji: '🖼️', title: 'Quote Graphic', subtitle: 'Share-ready images', category: 'visual', dbType: 'quote_graphic' },
  { id: 'highlight', emoji: '✂️', title: 'Video Highlight', subtitle: 'Best moments clipped', category: 'video', isPro: true, dbType: 'video_highlight' },
  { id: 'avatar', emoji: '🤖', title: 'AI Avatar Video', subtitle: 'Text becomes video', category: 'video', isPro: true, dbType: 'ai_avatar' },
];

const ContentStudio = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<'all' | 'top' | 'video' | 'revenue'>('all');
  const [selectedTestimonials, setSelectedTestimonials] = useState<string[]>([]);
  const [selectedContentType, setSelectedContentType] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);

  // Fetch real testimonials
  const { data: testimonials = [], isLoading } = useQuery({
    queryKey: ['content-studio-testimonials', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('testimonials')
        .select('id, author_name, author_company, content, rating, revenue_attributed, type')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .order('revenue_attributed', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
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
    if (selectedTestimonials.length === 0 || !selectedContentType || !user) return;
    setIsGenerating(true);
    setGeneratedContent(null);

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
        }
      });

      if (error) throw error;
      const content = data.content;
      setGeneratedContent(content);

      // Save to generated_content
      await supabase.from('generated_content').insert({
        user_id: user.id,
        testimonial_ids: selectedTestimonials,
        type: contentTypeInfo?.dbType as any,
        content,
      });

      toast.success('Content generated and saved! ✨');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyContent = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent);
      toast.success('Copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
              Content Studio <span className="text-2xl">✨</span>
            </h1>
            <p className="text-muted-foreground mt-1">Transform testimonials into marketing gold</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT - Source */}
          <div className="space-y-4">
            <Card className="bg-card">
              <CardContent className="p-4">
                <h2 className="font-semibold text-foreground flex items-center gap-2 mb-4">Pick Your Source 💛</h2>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search testimonials..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {[{ value: 'all', label: 'All' }, { value: 'top', label: '⭐ Top' }, { value: 'video', label: '🎥 Video' }, { value: 'revenue', label: '💰 High Revenue' }].map((f) => (
                    <button key={f.value} onClick={() => setFilter(f.value as any)}
                      className={`px-3 py-1 text-sm rounded-full transition-all ${filter === f.value ? 'bg-primary text-white' : 'bg-secondary text-foreground hover:bg-secondary/80'}`}>
                      {f.label}
                    </button>
                  ))}
                </div>

                {selectedTestimonials.length > 0 && (
                  <div className="text-sm text-primary font-medium mb-3">{selectedTestimonials.length} selected</div>
                )}

                {isLoading ? (
                  <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
                ) : testimonials.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-4xl mb-2">📭</p>
                    <p className="text-sm">No approved testimonials yet. Approve some first!</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {filteredTestimonials.map((t) => {
                      const isSelected = selectedTestimonials.includes(t.id);
                      return (
                        <div key={t.id} onClick={() => toggleTestimonial(t.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5 shadow-warm' : 'border-border hover:border-primary/30'}`}>
                          <div className="flex items-start gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-medium">{t.author_name[0]}</div>
                              {isSelected && <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm text-foreground">{t.author_name}</span>
                                {t.type === 'video' && <Badge variant="secondary" className="text-[10px]">🎥</Badge>}
                              </div>
                              <div className="text-xs text-muted-foreground mb-1">{t.author_company}</div>
                              <p className="text-xs text-muted-foreground line-clamp-2">{t.content}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <div className="flex">{[...Array(t.rating || 0)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber text-amber" />)}</div>
                                {Number(t.revenue_attributed) > 0 && (
                                  <Badge className="bg-gold/10 text-gold border-gold/20 text-[10px]">{formatCurrency(Number(t.revenue_attributed))}</Badge>
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
            <Card className="bg-card">
              <CardContent className="p-4">
                <h2 className="font-semibold text-foreground flex items-center gap-2 mb-4">What to Create ✨</h2>
                <div className="grid grid-cols-2 gap-3">
                  {contentTypes.map((type) => {
                    const isSelected = selectedContentType === type.id;
                    return (
                      <button key={type.id} onClick={() => !type.isPro && setSelectedContentType(type.id)} disabled={type.isPro}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all group ${
                          isSelected ? 'border-primary bg-primary/5 shadow-warm' :
                          type.isPro ? 'border-border bg-muted/30 opacity-60' :
                          'border-border hover:border-primary/50 hover:shadow-warm hover:-translate-y-0.5'
                        }`}>
                        <div className="text-2xl mb-2">{type.emoji}</div>
                        <div className="font-medium text-sm text-foreground">{type.title}</div>
                        <div className="text-xs text-muted-foreground">{type.subtitle}</div>
                        {type.isPro && <div className="absolute top-2 right-2"><Badge variant="outline" className="text-[10px] gap-1"><Lock className="w-3 h-3" />Pro</Badge></div>}
                        {isSelected && <div className="absolute top-2 right-2"><div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div></div>}
                      </button>
                    );
                  })}
                </div>
                <Button
                  className="w-full mt-6 gradient-sunny text-white shadow-warm hover:shadow-warm-lg transition-all h-12 text-lg"
                  disabled={selectedTestimonials.length === 0 || !selectedContentType || isGenerating}
                  onClick={generateContent}
                >
                  {isGenerating ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Creating Magic...</> : <><Sparkles className="w-5 h-5 mr-2" />Create Magic ✨</>}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT - Output */}
          <div className="space-y-4">
            <Card className="bg-card min-h-[500px]">
              <CardContent className="p-4 h-full">
                {!generatedContent && !isGenerating && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="text-6xl mb-4">🎨</div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Ready to Create</h3>
                    <p className="text-sm text-muted-foreground max-w-[200px]">Pick a testimonial and content type to get started!</p>
                  </div>
                )}
                {isGenerating && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent animate-pulse" />
                      <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mt-6 mb-2">Creating something beautiful...</h3>
                    <p className="text-sm text-muted-foreground">This usually takes a few seconds</p>
                  </div>
                )}
                {generatedContent && !isGenerating && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">Your Content</h3>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={copyContent}><Copy className="w-4 h-4 mr-1" />Copy</Button>
                        <Button variant="outline" size="sm" onClick={generateContent}><RefreshCw className="w-4 h-4 mr-1" />Regenerate</Button>
                      </div>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <div className="p-4 rounded-lg bg-secondary/50 whitespace-pre-wrap text-sm text-foreground">{generatedContent}</div>
                    </div>
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
