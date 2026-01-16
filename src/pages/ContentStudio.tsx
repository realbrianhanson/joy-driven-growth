import { useState } from "react";
import { 
  Search, 
  Sparkles, 
  Star, 
  DollarSign, 
  Video, 
  Check,
  Copy,
  RefreshCw,
  Edit,
  Save,
  Download,
  Twitter,
  Linkedin,
  Mail,
  FileText,
  Image,
  Scissors,
  Bot,
  Lock,
  Loader2,
  Instagram
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Testimonial {
  id: string;
  name: string;
  company: string;
  content: string;
  rating: number;
  revenue?: number;
  type: 'text' | 'video' | 'audio';
  avatar?: string;
}

interface ContentType {
  id: string;
  icon: React.ReactNode;
  emoji: string;
  title: string;
  subtitle: string;
  category: 'text' | 'visual' | 'video';
  isPro?: boolean;
}

const mockTestimonials: Testimonial[] = [
  { id: '1', name: 'Sarah Chen', company: 'TechFlow', content: 'Happy Client transformed how we collect testimonials. Revenue up 40%! The AI interviews are incredible.', rating: 5, revenue: 2500, type: 'text' },
  { id: '2', name: 'Marcus Johnson', company: 'DataSync', content: 'The AI interviews are genius. Best decision we made this year. Our conversion rate jumped 35%.', rating: 5, revenue: 1800, type: 'video' },
  { id: '3', name: 'Emily Rodriguez', company: 'GrowthLab', content: 'Our conversion rate jumped 35% after adding the social proof widgets. Customers love them.', rating: 5, revenue: 3200, type: 'text' },
  { id: '4', name: 'Alex Kim', company: 'StartupX', content: 'Finally, testimonials that actually convert. Worth every penny. The FOMO popups are incredibly effective.', rating: 4, revenue: 1200, type: 'text' },
  { id: '5', name: 'Jordan Lee', company: 'ScaleUp Co', content: 'The FOMO popups are incredibly effective. Customers love them. Revenue tracking is a game-changer.', rating: 5, revenue: 2100, type: 'video' },
];

const contentTypes: ContentType[] = [
  { id: 'twitter', icon: <Twitter className="w-6 h-6" />, emoji: '🐦', title: 'Twitter Thread', subtitle: 'Viral thread with hooks', category: 'text' },
  { id: 'linkedin', icon: <Linkedin className="w-6 h-6" />, emoji: '💼', title: 'LinkedIn Post', subtitle: 'Professional storytelling', category: 'text' },
  { id: 'instagram', icon: <Instagram className="w-6 h-6" />, emoji: '📸', title: 'Instagram Carousel', subtitle: '5 swipe-worthy slides', category: 'visual', isPro: true },
  { id: 'email', icon: <Mail className="w-6 h-6" />, emoji: '📧', title: 'Email Snippet', subtitle: 'For sales sequences', category: 'text' },
  { id: 'casestudy', icon: <FileText className="w-6 h-6" />, emoji: '📄', title: 'Case Study', subtitle: 'Mini success story', category: 'text' },
  { id: 'quote', icon: <Image className="w-6 h-6" />, emoji: '🖼️', title: 'Quote Graphic', subtitle: 'Share-ready images', category: 'visual' },
  { id: 'highlight', icon: <Scissors className="w-6 h-6" />, emoji: '✂️', title: 'Video Highlight', subtitle: 'Best moments clipped', category: 'video', isPro: true },
  { id: 'avatar', icon: <Bot className="w-6 h-6" />, emoji: '🤖', title: 'AI Avatar Video', subtitle: 'Text becomes video', category: 'video', isPro: true },
];

const ContentStudio = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<'all' | 'top' | 'video' | 'revenue'>('all');
  const [selectedTestimonials, setSelectedTestimonials] = useState<string[]>([]);
  const [selectedContentType, setSelectedContentType] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [usageCount] = useState(18);
  const [usageLimit] = useState(50);

  // Quote graphic settings
  const [quoteTemplate, setQuoteTemplate] = useState<'minimal' | 'bold' | 'warm' | 'photo'>('minimal');
  const [quoteSize, setQuoteSize] = useState<'square' | 'portrait' | 'wide'>('square');

  const filteredTestimonials = mockTestimonials.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filter === 'top') return matchesSearch && t.rating === 5;
    if (filter === 'video') return matchesSearch && t.type === 'video';
    if (filter === 'revenue') return matchesSearch && t.revenue && t.revenue > 2000;
    return matchesSearch;
  });

  const toggleTestimonial = (id: string) => {
    setSelectedTestimonials(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const generateContent = async () => {
    if (selectedTestimonials.length === 0 || !selectedContentType) return;

    setIsGenerating(true);
    setGeneratedContent(null);

    try {
      const selectedTestimonialData = mockTestimonials.filter(t => 
        selectedTestimonials.includes(t.id)
      );
      
      const contentTypeInfo = contentTypes.find(ct => ct.id === selectedContentType);

      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          testimonials: selectedTestimonialData,
          contentType: selectedContentType,
          contentTypeInfo: {
            title: contentTypeInfo?.title,
            subtitle: contentTypeInfo?.subtitle,
          }
        }
      });

      if (error) throw error;

      setGeneratedContent(data.content);
      toast.success('Content generated successfully! ✨');
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content. Please try again.');
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
              Content Studio <span className="text-2xl">✨</span>
            </h1>
            <p className="text-muted-foreground mt-1">
              Transform testimonials into marketing gold
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">
              {usageCount} / {usageLimit} creations this month
            </div>
            <Progress value={(usageCount / usageLimit) * 100} className="w-32 h-2" />
          </div>
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT - Source Selection */}
          <div className="space-y-4">
            <Card className="bg-card">
              <CardContent className="p-4">
                <h2 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                  Pick Your Source <span className="text-lg">💛</span>
                </h2>
                
                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search testimonials..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'top', label: '⭐ Top' },
                    { value: 'video', label: '🎥 Video' },
                    { value: 'revenue', label: '💰 High Revenue' },
                  ].map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFilter(f.value as typeof filter)}
                      className={`px-3 py-1 text-sm rounded-full transition-all ${
                        filter === f.value
                          ? 'bg-primary text-white'
                          : 'bg-secondary text-foreground hover:bg-secondary/80'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Selection Count */}
                {selectedTestimonials.length > 0 && (
                  <div className="text-sm text-primary font-medium mb-3">
                    {selectedTestimonials.length} selected
                  </div>
                )}

                {/* Testimonial List */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto scrollbar-warm">
                  {filteredTestimonials.map((testimonial) => {
                    const isSelected = selectedTestimonials.includes(testimonial.id);
                    return (
                      <div
                        key={testimonial.id}
                        onClick={() => toggleTestimonial(testimonial.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-warm'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-medium">
                              {testimonial.name[0]}
                            </div>
                            {isSelected && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-foreground">{testimonial.name}</span>
                              {testimonial.type === 'video' && (
                                <Badge variant="secondary" className="text-[10px]">🎥</Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mb-1">{testimonial.company}</div>
                            <p className="text-xs text-muted-foreground line-clamp-2">{testimonial.content}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                  <Star key={i} className="w-3 h-3 fill-amber text-amber" />
                                ))}
                              </div>
                              {testimonial.revenue && (
                                <Badge className="bg-gold/10 text-gold border-gold/20 text-[10px]">
                                  {formatCurrency(testimonial.revenue)}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CENTER - Content Type Selection */}
          <div className="space-y-4">
            <Card className="bg-card">
              <CardContent className="p-4">
                <h2 className="font-semibold text-foreground flex items-center gap-2 mb-4">
                  What to Create <span className="text-lg">✨</span>
                </h2>

                {/* Content Type Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {contentTypes.map((type) => {
                    const isSelected = selectedContentType === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => !type.isPro && setSelectedContentType(type.id)}
                        disabled={type.isPro}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all group ${
                          isSelected
                            ? 'border-primary bg-primary/5 shadow-warm'
                            : type.isPro
                            ? 'border-border bg-muted/30 opacity-60'
                            : 'border-border hover:border-primary/50 hover:shadow-warm hover:-translate-y-0.5'
                        }`}
                      >
                        <div className="text-2xl mb-2">{type.emoji}</div>
                        <div className="font-medium text-sm text-foreground">{type.title}</div>
                        <div className="text-xs text-muted-foreground">{type.subtitle}</div>
                        {type.isPro && (
                          <div className="absolute top-2 right-2">
                            <Badge variant="outline" className="text-[10px] gap-1">
                              <Lock className="w-3 h-3" />
                              Pro
                            </Badge>
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Generate Button */}
                <Button
                  className="w-full mt-6 gradient-sunny text-white shadow-warm hover:shadow-warm-lg transition-all h-12 text-lg"
                  disabled={selectedTestimonials.length === 0 || !selectedContentType || isGenerating}
                  onClick={generateContent}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Creating Magic...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Create Magic ✨
                    </>
                  )}
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
                    <p className="text-sm text-muted-foreground max-w-[200px]">
                      Pick a testimonial and content type to get started!
                    </p>
                  </div>
                )}

                {isGenerating && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent animate-pulse-glow" />
                      <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-white animate-sparkle" />
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
                        <Button variant="outline" size="sm" onClick={copyContent}>
                          <Copy className="w-4 h-4 mr-1" />
                          Copy
                        </Button>
                        <Button variant="outline" size="sm" onClick={generateContent}>
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Regenerate
                        </Button>
                      </div>
                    </div>

                    {/* Text Content */}
                    {(selectedContentType === 'twitter' || selectedContentType === 'linkedin' || selectedContentType === 'email' || selectedContentType === 'casestudy') && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-lg bg-secondary/50 border border-border whitespace-pre-wrap text-sm text-foreground">
                          {generatedContent}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            <Save className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Quote Graphic */}
                    {selectedContentType === 'quote' && (
                      <div className="space-y-4">
                        {/* Template Selection */}
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">Template</label>
                          <div className="grid grid-cols-4 gap-2">
                            {[
                              { value: 'minimal', label: 'Minimal' },
                              { value: 'bold', label: 'Bold' },
                              { value: 'warm', label: 'Warm' },
                              { value: 'photo', label: 'Photo' },
                            ].map((t) => (
                              <button
                                key={t.value}
                                onClick={() => setQuoteTemplate(t.value as typeof quoteTemplate)}
                                className={`p-2 text-xs rounded-lg border-2 transition-all ${
                                  quoteTemplate === t.value
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/30'
                                }`}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Size Selection */}
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">Size</label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { value: 'square', label: 'Square' },
                              { value: 'portrait', label: 'Portrait' },
                              { value: 'wide', label: 'Wide' },
                            ].map((s) => (
                              <button
                                key={s.value}
                                onClick={() => setQuoteSize(s.value as typeof quoteSize)}
                                className={`p-2 text-xs rounded-lg border-2 transition-all ${
                                  quoteSize === s.value
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/30'
                                }`}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Preview */}
                        <div 
                          className={`rounded-xl overflow-hidden ${
                            quoteTemplate === 'minimal' ? 'bg-white' :
                            quoteTemplate === 'bold' ? 'bg-foreground' :
                            quoteTemplate === 'warm' ? 'gradient-sunny' :
                            'bg-gradient-to-br from-primary/20 to-accent/20'
                          } ${
                            quoteSize === 'square' ? 'aspect-square' :
                            quoteSize === 'portrait' ? 'aspect-[3/4]' :
                            'aspect-video'
                          }`}
                        >
                          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                            <div className={`text-4xl mb-3 ${quoteTemplate === 'bold' ? 'text-primary' : 'text-primary'}`}>"</div>
                            <p className={`text-sm font-medium mb-4 ${
                              quoteTemplate === 'bold' ? 'text-white' : 'text-foreground'
                            }`}>
                              {mockTestimonials.find(t => selectedTestimonials.includes(t.id))?.content.slice(0, 100)}...
                            </p>
                            <div className={`text-xs ${
                              quoteTemplate === 'bold' ? 'text-white/70' : 'text-muted-foreground'
                            }`}>
                              — {mockTestimonials.find(t => selectedTestimonials.includes(t.id))?.name}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button className="flex-1 gradient-sunny text-white">
                            <Download className="w-4 h-4 mr-2" />
                            Download PNG
                          </Button>
                          <Button variant="outline">
                            <Download className="w-4 h-4 mr-1" />
                            JPG
                          </Button>
                        </div>
                      </div>
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
