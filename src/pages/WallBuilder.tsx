import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  ArrowLeft, Check, Copy, Monitor, Tablet, Smartphone,
  Globe, Share2, Search, Settings, Palette, Layout,
  Image, ChevronDown, ChevronUp, GripVertical, Star,
  ExternalLink, Plus, Save, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const WallBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isNew = !id || id === 'new';

  const [wallName, setWallName] = useState('');
  const [slug, setSlug] = useState('');
  const [headerTitle, setHeaderTitle] = useState('What Our Customers Say 💛');
  const [headerSubtitle, setHeaderSubtitle] = useState('Real stories from real customers.');
  const [layout, setLayout] = useState<'masonry' | 'grid' | 'list'>('masonry');
  const [columns, setColumns] = useState([3]);
  const [bgColor, setBgColor] = useState('#FFFBF7');
  const [accentColor, setAccentColor] = useState('#F97316');
  const [isPublished, setIsPublished] = useState(false);
  const [selectedTestimonials, setSelectedTestimonials] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isSaving, setIsSaving] = useState(false);

  const [openSections, setOpenSections] = useState({
    settings: true, branding: true, layout: true, testimonials: true,
  });

  // Fetch existing wall
  const { data: existingWall } = useQuery({
    queryKey: ['wall', id],
    queryFn: async () => {
      if (isNew) return null;
      const { data, error } = await supabase.from('walls').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    },
    enabled: !isNew,
  });

  useEffect(() => {
    if (existingWall) {
      setWallName(existingWall.name);
      setSlug(existingWall.slug);
      setHeaderTitle(existingWall.header_title || '');
      setHeaderSubtitle(existingWall.header_subtitle || '');
      setLayout((existingWall.layout as any) || 'masonry');
      setColumns([existingWall.columns || 3]);
      setBgColor(existingWall.background_color || '#FFFBF7');
      setAccentColor(existingWall.accent_color || '#F97316');
      setIsPublished(existingWall.is_published || false);
      setSelectedTestimonials(existingWall.testimonial_ids || []);
    }
  }, [existingWall]);

  // Fetch approved testimonials
  const { data: testimonials = [], isLoading: loadingTestimonials } = useQuery({
    queryKey: ['approved-testimonials-wall', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('testimonials')
        .select('id, author_name, author_company, content, rating')
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

  const toggleSection = (s: keyof typeof openSections) => setOpenSections(p => ({ ...p, [s]: !p[s] }));
  const toggleTestimonial = (tid: string) => {
    setSelectedTestimonials(p => p.includes(tid) ? p.filter(t => t !== tid) : [...p, tid]);
  };

  const publicUrl = `${window.location.origin}/wall/${slug}`;
  const copyLink = () => { navigator.clipboard.writeText(publicUrl); toast.success('Link copied!'); };

  const handleSave = async () => {
    if (!user || !wallName.trim() || !slug.trim()) {
      toast.error('Please fill in name and slug');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        user_id: user.id,
        name: wallName,
        slug,
        header_title: headerTitle,
        header_subtitle: headerSubtitle,
        layout,
        columns: columns[0],
        background_color: bgColor,
        accent_color: accentColor,
        is_published: isPublished,
        testimonial_ids: selectedTestimonials,
      };
      if (isNew) {
        const { error } = await supabase.from('walls').insert(payload);
        if (error) throw error;
        toast.success('Wall created! 🎉');
      } else {
        const { error } = await supabase.from('walls').update(payload).eq('id', id);
        if (error) throw error;
        toast.success('Wall updated!');
      }
      navigate('/dashboard/walls');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedData = testimonials.filter(t => selectedTestimonials.includes(t.id));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container max-w-7xl mx-auto py-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard/walls"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button></Link>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🧱</span>
                <Input value={wallName} onChange={(e) => setWallName(e.target.value)} placeholder="Wall name..." className="border-none text-lg font-semibold bg-transparent focus:ring-0 w-64" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={copyLink}><Share2 className="w-4 h-4 mr-2" />Share</Button>
              <Button className="gradient-sunny text-white" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {isNew ? 'Create' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left - Controls */}
          <div className="space-y-4 max-h-[calc(100vh-160px)] overflow-y-auto pr-2">
            {/* Settings */}
            <Collapsible open={openSections.settings} onOpenChange={() => toggleSection('settings')}>
              <Card className="bg-card">
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="pb-3"><div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2"><Settings className="w-4 h-4 text-primary" />Settings</CardTitle>
                    {openSections.settings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div></CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    <div>
                      <Label className="text-sm">URL Slug</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground shrink-0">/wall/</span>
                        <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))} placeholder="my-wall" className="flex-1" />
                        <Button variant="outline" size="sm" onClick={copyLink}><Copy className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm">Published</Label>
                        <p className="text-xs text-muted-foreground">{isPublished ? 'Publicly visible' : 'Not visible'}</p>
                      </div>
                      <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Branding */}
            <Collapsible open={openSections.branding} onOpenChange={() => toggleSection('branding')}>
              <Card className="bg-card">
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="pb-3"><div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2"><Palette className="w-4 h-4 text-primary" />Branding</CardTitle>
                    {openSections.branding ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div></CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    <div><Label className="text-sm">Header Title</Label><Input value={headerTitle} onChange={(e) => setHeaderTitle(e.target.value)} className="mt-1" /></div>
                    <div><Label className="text-sm">Subtitle</Label><Textarea value={headerSubtitle} onChange={(e) => setHeaderSubtitle(e.target.value)} className="mt-1" rows={2} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm">Background</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-10 h-8 rounded border border-border cursor-pointer" />
                          <Input value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="flex-1" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm">Accent</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="w-10 h-8 rounded border border-border cursor-pointer" />
                          <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="flex-1" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Layout */}
            <Collapsible open={openSections.layout} onOpenChange={() => toggleSection('layout')}>
              <Card className="bg-card">
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="pb-3"><div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2"><Layout className="w-4 h-4 text-primary" />Layout</CardTitle>
                    {openSections.layout ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div></CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {(['masonry', 'grid', 'list'] as const).map((l) => (
                        <button key={l} onClick={() => setLayout(l)} className={`p-3 rounded-lg border-2 transition-all text-sm capitalize ${layout === l ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`}>{l}</button>
                      ))}
                    </div>
                    <div>
                      <Label className="text-sm mb-2 block">Columns: {columns[0]}</Label>
                      <Slider value={columns} onValueChange={setColumns} min={2} max={5} step={1} />
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Testimonials */}
            <Collapsible open={openSections.testimonials} onOpenChange={() => toggleSection('testimonials')}>
              <Card className="bg-card">
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="pb-3"><div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2"><Star className="w-4 h-4 text-primary" />Testimonials<Badge variant="secondary">{selectedTestimonials.length}</Badge></CardTitle>
                    {openSections.testimonials ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div></CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                    </div>
                    {loadingTestimonials ? (
                      <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {filteredTestimonials.map((t) => (
                          <div key={t.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedTestimonials.includes(t.id) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'}`} onClick={() => toggleTestimonial(t.id)}>
                            <Checkbox checked={selectedTestimonials.includes(t.id)} />
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-medium">{t.author_name[0]}</div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-foreground truncate">{t.author_name}</div>
                              <div className="text-xs text-muted-foreground">{t.author_company}</div>
                            </div>
                            <div className="flex items-center gap-1 text-amber">
                              {[...Array(t.rating || 0)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>

          {/* Right - Preview */}
          <div className="space-y-4">
            <Card className="bg-card">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {[{ value: 'desktop', icon: Monitor }, { value: 'tablet', icon: Tablet }, { value: 'mobile', icon: Smartphone }].map((d) => (
                      <button key={d.value} onClick={() => setDevice(d.value as typeof device)} className={`p-2 rounded-lg transition-all ${device === d.value ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                        <d.icon className="w-5 h-5" />
                      </button>
                    ))}
                  </div>
                  {isPublished && (
                    <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm"><ExternalLink className="w-4 h-4 mr-2" />Open</Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className={`rounded-2xl border border-border overflow-hidden transition-all ${
              device === 'mobile' ? 'max-w-[375px] mx-auto' : device === 'tablet' ? 'max-w-[768px] mx-auto' : ''
            }`}>
              <div className="min-h-[600px]" style={{ backgroundColor: bgColor }}>
                {/* Header */}
                <div className="p-8 text-center border-b border-border" style={{ backgroundColor: bgColor }}>
                  <h1 className="text-2xl font-display font-bold text-foreground mb-2">{headerTitle || 'Your Wall Title'}</h1>
                  <p className="text-muted-foreground max-w-md mx-auto">{headerSubtitle || 'Add a subtitle'}</p>
                </div>
                {/* Grid */}
                <div className="p-6">
                  <div className={`grid gap-4 ${
                    layout === 'list' ? 'grid-cols-1' :
                    device === 'mobile' ? 'grid-cols-1' :
                    device === 'tablet' ? 'grid-cols-2' :
                    `grid-cols-${Math.min(columns[0], 3)}`
                  }`}>
                    {selectedData.length === 0 ? (
                      <div className="col-span-full text-center py-16 text-muted-foreground">
                        <p>Select testimonials to preview your wall</p>
                      </div>
                    ) : selectedData.slice(0, 9).map((t) => (
                      <Card key={t.id} className="bg-card">
                        <CardContent className="p-4">
                          <div className="flex gap-0.5 mb-2">
                            {[...Array(t.rating || 5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber text-amber" />)}
                          </div>
                          <p className="text-sm text-foreground mb-3">"{t.content}"</p>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium" style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}88)` }}>
                              {t.author_name[0]}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-foreground">{t.author_name}</div>
                              <div className="text-xs text-muted-foreground">{t.author_company}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WallBuilder;
