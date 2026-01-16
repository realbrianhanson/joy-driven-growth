import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  ArrowLeft,
  Check,
  Copy,
  Monitor,
  Tablet,
  Smartphone,
  Globe,
  Share2,
  Search,
  Settings,
  Palette,
  Layout,
  FileText,
  Image,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Star,
  ExternalLink,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface Testimonial {
  id: string;
  name: string;
  company: string;
  rating: number;
  content: string;
  tags: string[];
}

const mockTestimonials: Testimonial[] = [
  { id: '1', name: 'Sarah Chen', company: 'TechFlow', rating: 5, content: 'Happy Client transformed how we collect testimonials. Revenue up 40%!', tags: ['saas', 'startup'] },
  { id: '2', name: 'Marcus Johnson', company: 'DataSync', rating: 5, content: 'The AI interviews are genius. Best decision we made this year.', tags: ['enterprise'] },
  { id: '3', name: 'Emily Rodriguez', company: 'GrowthLab', rating: 5, content: 'Our conversion rate jumped 35% after adding the social proof widgets.', tags: ['marketing'] },
  { id: '4', name: 'Alex Kim', company: 'StartupX', rating: 4, content: 'Finally, testimonials that actually convert. Worth every penny.', tags: ['saas', 'startup'] },
  { id: '5', name: 'Jordan Lee', company: 'ScaleUp Co', rating: 5, content: 'The FOMO popups are incredibly effective. Customers love them.', tags: ['ecommerce'] },
];

const WallBuilder = () => {
  const { id } = useParams();
  const isNew = id === 'new';

  const [wallName, setWallName] = useState(isNew ? '' : 'Customer Love');
  const [slug, setSlug] = useState(isNew ? '' : 'customer-love');
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  
  // Layout
  const [layout, setLayout] = useState<'masonry' | 'grid' | 'list'>('masonry');
  const [columns, setColumns] = useState([3]);
  
  // Branding
  const [showLogo, setShowLogo] = useState(true);
  const [headerTitle, setHeaderTitle] = useState('What Our Customers Say 💛');
  const [headerDescription, setHeaderDescription] = useState('Real stories from real customers who love using our product.');
  
  // SEO
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  
  // CTA
  const [showCta, setShowCta] = useState(true);
  const [ctaText, setCtaText] = useState('Try It Free');
  const [ctaUrl, setCtaUrl] = useState('https://example.com/signup');
  
  // Testimonials
  const [selectedTestimonials, setSelectedTestimonials] = useState<string[]>(['1', '2', '3', '4', '5']);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterByTag, setFilterByTag] = useState(true);
  
  // Sections
  const [openSections, setOpenSections] = useState({
    settings: true,
    branding: true,
    layout: true,
    seo: false,
    cta: true,
    testimonials: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleTestimonial = (id: string) => {
    setSelectedTestimonials(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`https://happyclient.io/love/${slug}`);
    toast.success('Link copied!');
  };

  const filteredTestimonials = mockTestimonials.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container max-w-7xl mx-auto py-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard/walls">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🧱</span>
                <Input
                  value={wallName}
                  onChange={(e) => setWallName(e.target.value)}
                  placeholder="Wall name..."
                  className="border-none text-lg font-semibold bg-transparent focus:ring-0 w-64"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={copyLink}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button className="gradient-sunny text-white">
                <Check className="w-4 h-4 mr-2" />
                Publish
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left - Controls */}
          <div className="space-y-4 max-h-[calc(100vh-160px)] overflow-y-auto pr-2 scrollbar-warm">
            {/* Basic Settings */}
            <Collapsible open={openSections.settings} onOpenChange={() => toggleSection('settings')}>
              <Card className="bg-card">
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Settings className="w-4 h-4 text-primary" />
                        Settings
                      </CardTitle>
                      {openSections.settings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    <div>
                      <Label className="text-sm">URL Slug</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">happyclient.io/love/</span>
                        <Input
                          value={slug}
                          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                          placeholder="my-wall"
                          className="flex-1"
                        />
                        <Button variant="outline" size="sm" onClick={copyLink}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm">Custom Domain (optional)</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <Input placeholder="love.yourcompany.com" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Add a CNAME record pointing to happyclient.io</p>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Branding */}
            <Collapsible open={openSections.branding} onOpenChange={() => toggleSection('branding')}>
              <Card className="bg-card">
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Palette className="w-4 h-4 text-primary" />
                        Branding
                      </CardTitle>
                      {openSections.branding ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Show Logo</Label>
                      <Switch checked={showLogo} onCheckedChange={setShowLogo} />
                    </div>
                    {showLogo && (
                      <div className="p-4 border-2 border-dashed border-border rounded-lg text-center">
                        <Image className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Drag & drop logo or click to upload</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-sm">Header Title</Label>
                      <Input
                        value={headerTitle}
                        onChange={(e) => setHeaderTitle(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Header Description</Label>
                      <Textarea
                        value={headerDescription}
                        onChange={(e) => setHeaderDescription(e.target.value)}
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Layout */}
            <Collapsible open={openSections.layout} onOpenChange={() => toggleSection('layout')}>
              <Card className="bg-card">
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Layout className="w-4 h-4 text-primary" />
                        Layout
                      </CardTitle>
                      {openSections.layout ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    <div>
                      <Label className="text-sm mb-2 block">Layout Style</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'masonry', label: 'Masonry' },
                          { value: 'grid', label: 'Grid' },
                          { value: 'list', label: 'List' },
                        ].map((l) => (
                          <button
                            key={l.value}
                            onClick={() => setLayout(l.value as typeof layout)}
                            className={`p-3 rounded-lg border-2 transition-all text-sm ${
                              layout === l.value
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/30'
                            }`}
                          >
                            {l.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm mb-2 block">Columns: {columns[0]}</Label>
                      <Slider
                        value={columns}
                        onValueChange={setColumns}
                        min={2}
                        max={5}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Enable tag filtering</Label>
                      <Switch checked={filterByTag} onCheckedChange={setFilterByTag} />
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* SEO */}
            <Collapsible open={openSections.seo} onOpenChange={() => toggleSection('seo')}>
              <Card className="bg-card">
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        SEO Settings
                      </CardTitle>
                      {openSections.seo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    <div>
                      <Label className="text-sm">Meta Title</Label>
                      <Input
                        value={metaTitle}
                        onChange={(e) => setMetaTitle(e.target.value)}
                        placeholder="Customer Testimonials | Your Company"
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">{metaTitle.length}/60 characters</p>
                    </div>
                    <div>
                      <Label className="text-sm">Meta Description</Label>
                      <Textarea
                        value={metaDescription}
                        onChange={(e) => setMetaDescription(e.target.value)}
                        placeholder="See what our customers have to say..."
                        className="mt-1"
                        rows={2}
                      />
                      <p className="text-xs text-muted-foreground mt-1">{metaDescription.length}/160 characters</p>
                    </div>
                    <div>
                      <Label className="text-sm">Social Sharing Image</Label>
                      <div className="p-4 border-2 border-dashed border-border rounded-lg text-center mt-1">
                        <Image className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Upload 1200x630 image</p>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* CTA */}
            <Collapsible open={openSections.cta} onOpenChange={() => toggleSection('cta')}>
              <Card className="bg-card">
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Plus className="w-4 h-4 text-primary" />
                        Call to Action
                      </CardTitle>
                      {openSections.cta ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Show CTA Button</Label>
                      <Switch checked={showCta} onCheckedChange={setShowCta} />
                    </div>
                    {showCta && (
                      <>
                        <div>
                          <Label className="text-sm">Button Text</Label>
                          <Input
                            value={ctaText}
                            onChange={(e) => setCtaText(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Button URL</Label>
                          <Input
                            value={ctaUrl}
                            onChange={(e) => setCtaUrl(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Testimonials */}
            <Collapsible open={openSections.testimonials} onOpenChange={() => toggleSection('testimonials')}>
              <Card className="bg-card">
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Star className="w-4 h-4 text-primary" />
                        Testimonials
                        <Badge variant="secondary">{selectedTestimonials.length}</Badge>
                      </CardTitle>
                      {openSections.testimonials ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search testimonials..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {filteredTestimonials.map((testimonial) => (
                        <div
                          key={testimonial.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedTestimonials.includes(testimonial.id)
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/30'
                          }`}
                          onClick={() => toggleTestimonial(testimonial.id)}
                        >
                          <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                          <Checkbox checked={selectedTestimonials.includes(testimonial.id)} />
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-sm font-medium">
                            {testimonial.name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-foreground truncate">{testimonial.name}</div>
                            <div className="text-xs text-muted-foreground">{testimonial.company}</div>
                          </div>
                          <div className="flex items-center gap-1 text-amber">
                            {[...Array(testimonial.rating)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-current" />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>

          {/* Right - Preview */}
          <div className="space-y-4">
            {/* Preview Controls */}
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
                          device === d.value
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <d.icon className="w-5 h-5" />
                      </button>
                    ))}
                  </div>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Preview
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Preview Area */}
            <div
              className={`rounded-2xl border border-border overflow-hidden transition-all ${
                device === 'mobile' ? 'max-w-[375px] mx-auto' : device === 'tablet' ? 'max-w-[768px] mx-auto' : ''
              }`}
            >
              <div className="min-h-[600px] bg-background-secondary">
                {/* Wall Header Preview */}
                <div className="bg-card p-8 text-center border-b border-border">
                  {showLogo && (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-accent mx-auto mb-4 flex items-center justify-center">
                      <span className="text-2xl text-white">💛</span>
                    </div>
                  )}
                  <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                    {headerTitle || 'Your Wall Title'}
                  </h1>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    {headerDescription || 'Add a description for your wall'}
                  </p>
                  {showCta && (
                    <Button className="gradient-sunny text-white mt-4">
                      {ctaText || 'Get Started'}
                    </Button>
                  )}
                </div>

                {/* Testimonial Grid Preview */}
                <div className="p-6">
                  {filterByTag && (
                    <div className="flex justify-center gap-2 mb-6">
                      <Badge variant="secondary" className="cursor-pointer hover:bg-primary/10">All</Badge>
                      <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">SaaS</Badge>
                      <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">Enterprise</Badge>
                      <Badge variant="outline" className="cursor-pointer hover:bg-primary/10">Startup</Badge>
                    </div>
                  )}
                  <div className={`grid gap-4 ${
                    layout === 'list' ? 'grid-cols-1' : 
                    device === 'mobile' ? 'grid-cols-1' :
                    device === 'tablet' ? 'grid-cols-2' :
                    `grid-cols-${Math.min(columns[0], 3)}`
                  }`}>
                    {mockTestimonials
                      .filter(t => selectedTestimonials.includes(t.id))
                      .slice(0, 6)
                      .map((testimonial) => (
                        <Card key={testimonial.id} className="bg-card">
                          <CardContent className="p-4">
                            <div className="flex gap-0.5 mb-2">
                              {[...Array(testimonial.rating)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-amber text-amber" />
                              ))}
                            </div>
                            <p className="text-sm text-foreground mb-3">"{testimonial.content}"</p>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-medium">
                                {testimonial.name[0]}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-foreground">{testimonial.name}</div>
                                <div className="text-xs text-muted-foreground">{testimonial.company}</div>
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
