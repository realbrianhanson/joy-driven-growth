import { useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { 
  ArrowLeft,
  Check,
  Copy,
  Monitor,
  Tablet,
  Smartphone,
  Sun,
  Moon,
  Settings,
  Palette,
  Users,
  Sparkles,
  Zap,
  Eye,
  Star,
  Play,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Search,
  Code,
  ExternalLink,
  TestTube,
  Clock,
  MousePointer,
  Target,
  Shuffle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const widgetTypeConfig = {
  carousel: { icon: '🎠', name: 'Carousel' },
  grid: { icon: '📱', name: 'Grid' },
  spotlight: { icon: '⭐', name: 'Spotlight' },
  wall: { icon: '🧱', name: 'Wall of Love' },
  fomo: { icon: '🔔', name: 'FOMO Popup' },
  notification: { icon: '💬', name: 'Notification' },
  badge: { icon: '🏷️', name: 'Badge' },
};

interface Testimonial {
  id: string;
  name: string;
  company: string;
  avatar: string;
  rating: number;
  content: string;
  revenue?: number;
}

const mockTestimonials: Testimonial[] = [
  { id: '1', name: 'Sarah Chen', company: 'TechFlow', avatar: '', rating: 5, content: 'Happy Client transformed how we collect testimonials. Revenue up 40%!', revenue: 2500 },
  { id: '2', name: 'Marcus Johnson', company: 'DataSync', avatar: '', rating: 5, content: 'The AI interviews are genius. Best decision we made this year.', revenue: 1800 },
  { id: '3', name: 'Emily Rodriguez', company: 'GrowthLab', avatar: '', rating: 5, content: 'Our conversion rate jumped 35% after adding the social proof widgets.', revenue: 3200 },
  { id: '4', name: 'Alex Kim', company: 'StartupX', avatar: '', rating: 4, content: 'Finally, testimonials that actually convert. Worth every penny.', revenue: 1200 },
  { id: '5', name: 'Jordan Lee', company: 'ScaleUp Co', avatar: '', rating: 5, content: 'The FOMO popups are incredibly effective. Customers love them.', revenue: 2100 },
];

const WidgetBuilder = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') || 'carousel';
  
  const [widgetType, setWidgetType] = useState(initialType);
  const [widgetName, setWidgetName] = useState(id === 'new' ? '' : 'Homepage Carousel');
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('light');
  const [previewBg, setPreviewBg] = useState<'light' | 'dark' | 'custom'>('light');
  
  // Settings
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotateSpeed, setRotateSpeed] = useState([5]);
  const [pauseOnHover, setPauseOnHover] = useState(true);
  const [showAvatar, setShowAvatar] = useState(true);
  const [showName, setShowName] = useState(true);
  const [showCompany, setShowCompany] = useState(true);
  const [showRating, setShowRating] = useState(true);
  const [showRevenue, setShowRevenue] = useState(true);
  const [borderRadius, setBorderRadius] = useState([12]);
  const [shadow, setShadow] = useState([50]);
  
  // FOMO specific
  const [fomoPosition, setFomoPosition] = useState('bottom-left');
  const [fomoTrigger, setFomoTrigger] = useState('time');
  const [fomoDelay, setFomoDelay] = useState([5]);
  const [fomoMaxShows, setFomoMaxShows] = useState([3]);
  const [fomoAnimation, setFomoAnimation] = useState('slide');
  const [abTestEnabled, setAbTestEnabled] = useState(false);
  
  // Testimonials
  const [testimonialMode, setTestimonialMode] = useState<'pick' | 'auto'>('pick');
  const [selectedTestimonials, setSelectedTestimonials] = useState<string[]>(['1', '2', '3']);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Sections
  const [openSections, setOpenSections] = useState({
    type: true,
    testimonials: true,
    appearance: true,
    behavior: true,
    fomo: true,
    personalization: false,
    abtest: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleTestimonial = (id: string) => {
    setSelectedTestimonials(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const copyEmbedCode = () => {
    const code = `<script src="https://happyclient.io/widget.js" data-id="${id || 'new'}"></script>`;
    navigator.clipboard.writeText(code);
    toast.success('Embed code copied!');
  };

  const filteredTestimonials = mockTestimonials.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.company.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isFomo = widgetType === 'fomo' || widgetType === 'notification';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container max-w-7xl mx-auto py-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard/widgets">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{widgetTypeConfig[widgetType as keyof typeof widgetTypeConfig]?.icon}</span>
                <Input
                  value={widgetName}
                  onChange={(e) => setWidgetName(e.target.value)}
                  placeholder="Widget name..."
                  className="border-none text-lg font-semibold bg-transparent focus:ring-0 w-64"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button className="gradient-sunny text-white">
                <Check className="w-4 h-4 mr-2" />
                Save Widget
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left - Controls */}
          <div className="space-y-4 max-h-[calc(100vh-160px)] overflow-y-auto pr-2 scrollbar-warm">
            {/* Widget Type */}
            <Collapsible open={openSections.type} onOpenChange={() => toggleSection('type')}>
              <Card className="bg-card">
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Settings className="w-4 h-4 text-primary" />
                        Widget Type
                      </CardTitle>
                      {openSections.type ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-4 gap-2">
                      {Object.entries(widgetTypeConfig).map(([key, config]) => (
                        <button
                          key={key}
                          onClick={() => setWidgetType(key)}
                          className={`p-3 rounded-xl border-2 transition-all text-center ${
                            widgetType === key 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="text-2xl mb-1">{config.icon}</div>
                          <div className="text-xs font-medium text-foreground">{config.name}</div>
                        </button>
                      ))}
                    </div>
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
                        <Users className="w-4 h-4 text-primary" />
                        Testimonials
                      </CardTitle>
                      {openSections.testimonials ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    <Tabs value={testimonialMode} onValueChange={(v) => setTestimonialMode(v as 'pick' | 'auto')}>
                      <TabsList className="grid w-full grid-cols-2 bg-secondary">
                        <TabsTrigger value="pick">Pick</TabsTrigger>
                        <TabsTrigger value="auto">Auto</TabsTrigger>
                      </TabsList>
                      <TabsContent value="pick" className="mt-4 space-y-3">
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
                              {testimonial.revenue && (
                                <Badge className="bg-gold/10 text-gold border-gold/20">
                                  ${testimonial.revenue}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                      <TabsContent value="auto" className="mt-4 space-y-4">
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm">Minimum Rating</Label>
                            <Select defaultValue="4">
                              <SelectTrigger className="mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="5">5 stars only</SelectItem>
                                <SelectItem value="4">4+ stars</SelectItem>
                                <SelectItem value="3">3+ stars</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-sm">Max testimonials</Label>
                            <Input type="number" defaultValue={10} className="mt-1" />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Auto-add new</Label>
                            <Switch defaultChecked />
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Appearance */}
            <Collapsible open={openSections.appearance} onOpenChange={() => toggleSection('appearance')}>
              <Card className="bg-card">
                <CollapsibleTrigger className="w-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Palette className="w-4 h-4 text-primary" />
                        Appearance
                      </CardTitle>
                      {openSections.appearance ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-4">
                    {/* Theme */}
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
                              theme === t.value
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/30'
                            }`}
                          >
                            <t.icon className="w-4 h-4" />
                            <span className="text-sm">{t.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Border Radius */}
                    <div>
                      <Label className="text-sm mb-2 block">Border Radius: {borderRadius[0]}px</Label>
                      <Slider
                        value={borderRadius}
                        onValueChange={setBorderRadius}
                        max={24}
                        step={2}
                        className="w-full"
                      />
                    </div>

                    {/* Shadow */}
                    <div>
                      <Label className="text-sm mb-2 block">Shadow: {shadow[0]}%</Label>
                      <Slider
                        value={shadow}
                        onValueChange={setShadow}
                        max={100}
                        step={10}
                        className="w-full"
                      />
                    </div>

                    {/* Content Toggles */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Show avatar</Label>
                        <Switch checked={showAvatar} onCheckedChange={setShowAvatar} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Show name</Label>
                        <Switch checked={showName} onCheckedChange={setShowName} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Show company</Label>
                        <Switch checked={showCompany} onCheckedChange={setShowCompany} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Show rating</Label>
                        <Switch checked={showRating} onCheckedChange={setShowRating} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm flex items-center gap-1">
                          Show revenue 
                          <Badge className="bg-gold/10 text-gold text-[10px]">💰</Badge>
                        </Label>
                        <Switch checked={showRevenue} onCheckedChange={setShowRevenue} />
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Behavior (for Carousel) */}
            {(widgetType === 'carousel') && (
              <Collapsible open={openSections.behavior} onOpenChange={() => toggleSection('behavior')}>
                <Card className="bg-card">
                  <CollapsibleTrigger className="w-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Play className="w-4 h-4 text-primary" />
                          Behavior
                        </CardTitle>
                        {openSections.behavior ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Auto-rotate</Label>
                        <Switch checked={autoRotate} onCheckedChange={setAutoRotate} />
                      </div>
                      {autoRotate && (
                        <div>
                          <Label className="text-sm mb-2 block flex items-center gap-2">
                            Speed: {rotateSpeed[0]}s
                            <span className="text-muted-foreground">🐢 → 🐇</span>
                          </Label>
                          <Slider
                            value={rotateSpeed}
                            onValueChange={setRotateSpeed}
                            min={2}
                            max={10}
                            step={1}
                            className="w-full"
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Pause on hover</Label>
                        <Switch checked={pauseOnHover} onCheckedChange={setPauseOnHover} />
                      </div>
                      <div>
                        <Label className="text-sm mb-2 block">Animation style</Label>
                        <Select defaultValue="slide">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fade">Fade</SelectItem>
                            <SelectItem value="slide">Slide</SelectItem>
                            <SelectItem value="zoom">Zoom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            )}

            {/* FOMO Settings */}
            {isFomo && (
              <>
                <Collapsible open={openSections.fomo} onOpenChange={() => toggleSection('fomo')}>
                  <Card className="bg-card border-primary/20">
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Zap className="w-4 h-4 text-primary" />
                            Popup Settings
                            <Badge className="bg-emerald text-white text-[10px]">FOMO</Badge>
                          </CardTitle>
                          {openSections.fomo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-4">
                        {/* Position */}
                        <div>
                          <Label className="text-sm mb-2 block">Position</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { value: 'bottom-left', label: 'Bottom Left' },
                              { value: 'bottom-right', label: 'Bottom Right' },
                              { value: 'top-left', label: 'Top Left' },
                              { value: 'top-right', label: 'Top Right' },
                            ].map((pos) => (
                              <button
                                key={pos.value}
                                onClick={() => setFomoPosition(pos.value)}
                                className={`p-2 text-sm rounded-lg border-2 transition-all ${
                                  fomoPosition === pos.value
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/30'
                                }`}
                              >
                                {pos.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Trigger */}
                        <div>
                          <Label className="text-sm mb-2 block">Trigger</Label>
                          <Select value={fomoTrigger} onValueChange={setFomoTrigger}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="time">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  Time delay
                                </div>
                              </SelectItem>
                              <SelectItem value="scroll">
                                <div className="flex items-center gap-2">
                                  <MousePointer className="w-4 h-4" />
                                  Scroll percentage
                                </div>
                              </SelectItem>
                              <SelectItem value="exit">
                                <div className="flex items-center gap-2">
                                  <Target className="w-4 h-4" />
                                  Exit intent
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {fomoTrigger === 'time' && (
                          <div>
                            <Label className="text-sm mb-2 block">Delay: {fomoDelay[0]} seconds</Label>
                            <Slider
                              value={fomoDelay}
                              onValueChange={setFomoDelay}
                              min={1}
                              max={30}
                              step={1}
                              className="w-full"
                            />
                          </div>
                        )}

                        <div>
                          <Label className="text-sm mb-2 block">Max shows per session: {fomoMaxShows[0]}</Label>
                          <Slider
                            value={fomoMaxShows}
                            onValueChange={setFomoMaxShows}
                            min={1}
                            max={10}
                            step={1}
                            className="w-full"
                          />
                        </div>

                        {/* Animation */}
                        <div>
                          <Label className="text-sm mb-2 block">Animation</Label>
                          <div className="flex gap-2">
                            {['slide', 'fade', 'bounce'].map((anim) => (
                              <button
                                key={anim}
                                onClick={() => setFomoAnimation(anim)}
                                className={`flex-1 p-2 text-sm rounded-lg border-2 capitalize transition-all ${
                                  fomoAnimation === anim
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/30'
                                }`}
                              >
                                {anim}
                              </button>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* Personalization */}
                <Collapsible open={openSections.personalization} onOpenChange={() => toggleSection('personalization')}>
                  <Card className="bg-card">
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            Personalization
                            <Badge variant="outline" className="text-[10px]">PRO</Badge>
                          </CardTitle>
                          {openSections.personalization ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Show relevant testimonials to each visitor
                        </p>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Match by industry</Label>
                            <Switch />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Match by location</Label>
                            <Switch />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label className="text-sm">Match by page topic</Label>
                            <Switch />
                          </div>
                        </div>
                        <div className="p-3 rounded-lg bg-secondary/50 text-sm text-muted-foreground">
                          💡 SaaS visitor sees SaaS testimonials
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>

                {/* A/B Testing */}
                <Collapsible open={openSections.abtest} onOpenChange={() => toggleSection('abtest')}>
                  <Card className="bg-card">
                    <CollapsibleTrigger className="w-full">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base flex items-center gap-2">
                            <TestTube className="w-4 h-4 text-primary" />
                            A/B Testing
                          </CardTitle>
                          {openSections.abtest ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Enable A/B test</Label>
                          <Switch checked={abTestEnabled} onCheckedChange={setAbTestEnabled} />
                        </div>
                        {abTestEnabled && (
                          <div className="space-y-3">
                            <div className="p-3 rounded-lg border border-border">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge>A</Badge>
                                <span className="text-sm font-medium">Variant A</span>
                              </div>
                              <p className="text-xs text-muted-foreground">Current testimonial set</p>
                            </div>
                            <div className="p-3 rounded-lg border border-border">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">B</Badge>
                                <span className="text-sm font-medium">Variant B</span>
                              </div>
                              <Button variant="outline" size="sm" className="mt-2">
                                <Shuffle className="w-4 h-4 mr-2" />
                                Select testimonials
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Auto-pick winner after 1,000 impressions
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </>
            )}

            {/* Embed Code */}
            <Card className="bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Code className="w-4 h-4 text-primary" />
                  Embed Code
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Tabs defaultValue="html">
                  <TabsList className="grid w-full grid-cols-4 bg-secondary">
                    <TabsTrigger value="html">HTML</TabsTrigger>
                    <TabsTrigger value="react">React</TabsTrigger>
                    <TabsTrigger value="wordpress">WP</TabsTrigger>
                    <TabsTrigger value="shopify">Shopify</TabsTrigger>
                  </TabsList>
                  <TabsContent value="html" className="mt-4">
                    <div className="relative">
                      <pre className="p-4 rounded-lg bg-foreground/5 text-sm overflow-x-auto">
                        <code className="text-foreground">
{`<script src="https://happyclient.io/widget.js"
  data-id="${id || 'widget-id'}"
></script>`}
                        </code>
                      </pre>
                      <Button
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={copyEmbedCode}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="react" className="mt-4">
                    <div className="relative">
                      <pre className="p-4 rounded-lg bg-foreground/5 text-sm overflow-x-auto">
                        <code className="text-foreground">
{`import { HappyClientWidget } from '@happyclient/react';

<HappyClientWidget id="${id || 'widget-id'}" />`}
                        </code>
                      </pre>
                      <Button size="sm" className="absolute top-2 right-2" onClick={copyEmbedCode}>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="wordpress" className="mt-4">
                    <div className="p-4 rounded-lg bg-foreground/5 text-sm">
                      <p className="text-muted-foreground mb-2">Use our WordPress plugin:</p>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Download Plugin
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="shopify" className="mt-4">
                    <div className="p-4 rounded-lg bg-foreground/5 text-sm">
                      <p className="text-muted-foreground mb-2">Install from Shopify App Store:</p>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Install App
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
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
                  <div className="flex items-center gap-2">
                    {[
                      { value: 'light', label: 'Light' },
                      { value: 'dark', label: 'Dark' },
                    ].map((bg) => (
                      <button
                        key={bg.value}
                        onClick={() => setPreviewBg(bg.value as typeof previewBg)}
                        className={`px-3 py-1 text-sm rounded-lg transition-all ${
                          previewBg === bg.value
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {bg.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview Area */}
            <div
              className={`rounded-2xl border border-border overflow-hidden transition-all ${
                device === 'mobile' ? 'max-w-[375px] mx-auto' : device === 'tablet' ? 'max-w-[768px] mx-auto' : ''
              }`}
            >
              <div
                className={`min-h-[500px] p-8 ${
                  previewBg === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
                }`}
              >
                {/* Widget Preview */}
                {widgetType === 'carousel' && (
                  <WidgetPreviewCarousel 
                    testimonials={mockTestimonials.filter(t => selectedTestimonials.includes(t.id))}
                    showAvatar={showAvatar}
                    showName={showName}
                    showCompany={showCompany}
                    showRating={showRating}
                    showRevenue={showRevenue}
                    borderRadius={borderRadius[0]}
                    isDark={previewBg === 'dark'}
                  />
                )}
                {widgetType === 'grid' && (
                  <WidgetPreviewGrid 
                    testimonials={mockTestimonials.filter(t => selectedTestimonials.includes(t.id))}
                    showAvatar={showAvatar}
                    showName={showName}
                    showRating={showRating}
                    borderRadius={borderRadius[0]}
                    isDark={previewBg === 'dark'}
                  />
                )}
                {(widgetType === 'fomo' || widgetType === 'notification') && (
                  <WidgetPreviewFomo
                    testimonial={mockTestimonials[0]}
                    position={fomoPosition}
                    animation={fomoAnimation}
                    isDark={previewBg === 'dark'}
                  />
                )}
                {widgetType === 'spotlight' && (
                  <WidgetPreviewSpotlight
                    testimonial={mockTestimonials[0]}
                    showRating={showRating}
                    borderRadius={borderRadius[0]}
                    isDark={previewBg === 'dark'}
                  />
                )}
                {widgetType === 'badge' && (
                  <WidgetPreviewBadge isDark={previewBg === 'dark'} />
                )}
                {widgetType === 'wall' && (
                  <WidgetPreviewWall
                    testimonials={mockTestimonials}
                    isDark={previewBg === 'dark'}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Widget Preview Components
interface PreviewProps {
  isDark: boolean;
}

interface CarouselPreviewProps extends PreviewProps {
  testimonials: Testimonial[];
  showAvatar: boolean;
  showName: boolean;
  showCompany: boolean;
  showRating: boolean;
  showRevenue: boolean;
  borderRadius: number;
}

const WidgetPreviewCarousel = ({ testimonials, showAvatar, showName, showCompany, showRating, showRevenue, borderRadius, isDark }: CarouselPreviewProps) => {
  const t = testimonials[0] || mockTestimonials[0];
  return (
    <div 
      className={`p-6 ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow-lg`}
      style={{ borderRadius: `${borderRadius}px` }}
    >
      <div className="flex items-start gap-4">
        {showAvatar && (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange to-amber flex items-center justify-center text-white font-medium">
            {t.name[0]}
          </div>
        )}
        <div className="flex-1">
          <p className={`text-sm mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            "{t.content}"
          </p>
          <div className="flex items-center justify-between">
            <div>
              {showName && <div className="font-semibold text-sm">{t.name}</div>}
              {showCompany && <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.company}</div>}
            </div>
            <div className="flex items-center gap-2">
              {showRating && (
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < t.rating ? 'fill-amber text-amber' : 'text-gray-300'}`} />
                  ))}
                </div>
              )}
              {showRevenue && t.revenue && (
                <Badge className="bg-gold/10 text-gold border-gold/20 text-xs">
                  💰 ${t.revenue}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-center gap-1.5 mt-4">
        {testimonials.map((_, i) => (
          <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-primary' : isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />
        ))}
      </div>
    </div>
  );
};

interface GridPreviewProps extends PreviewProps {
  testimonials: Testimonial[];
  showAvatar: boolean;
  showName: boolean;
  showRating: boolean;
  borderRadius: number;
}

const WidgetPreviewGrid = ({ testimonials, showAvatar, showName, showRating, borderRadius, isDark }: GridPreviewProps) => (
  <div className="grid grid-cols-2 gap-3">
    {testimonials.slice(0, 4).map((t) => (
      <div 
        key={t.id}
        className={`p-4 ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow-md`}
        style={{ borderRadius: `${borderRadius}px` }}
      >
        {showRating && (
          <div className="flex gap-0.5 mb-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className={`w-3 h-3 ${i < t.rating ? 'fill-amber text-amber' : 'text-gray-300'}`} />
            ))}
          </div>
        )}
        <p className={`text-xs mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          "{t.content.slice(0, 60)}..."
        </p>
        <div className="flex items-center gap-2">
          {showAvatar && (
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange to-amber flex items-center justify-center text-white text-xs">
              {t.name[0]}
            </div>
          )}
          {showName && <span className="text-xs font-medium">{t.name}</span>}
        </div>
      </div>
    ))}
  </div>
);

interface FomoPreviewProps extends PreviewProps {
  testimonial: Testimonial;
  position: string;
  animation: string;
}

const WidgetPreviewFomo = ({ testimonial, position, isDark }: FomoPreviewProps) => {
  const positionClasses = {
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
  };

  return (
    <div className="relative min-h-[400px]">
      <div className={`absolute ${positionClasses[position as keyof typeof positionClasses]}`}>
        <div className={`flex items-center gap-3 p-4 rounded-xl shadow-lg ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} animate-fade-in-up max-w-xs`}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange to-amber flex items-center justify-center text-white font-medium">
            {testimonial.name[0]}
          </div>
          <div>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              <span className="font-medium">{testimonial.name}</span> from {testimonial.company} just left a 5-star review ⭐
            </p>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>2 minutes ago</p>
          </div>
        </div>
      </div>
    </div>
  );
};

interface SpotlightPreviewProps extends PreviewProps {
  testimonial: Testimonial;
  showRating: boolean;
  borderRadius: number;
}

const WidgetPreviewSpotlight = ({ testimonial, showRating, borderRadius, isDark }: SpotlightPreviewProps) => (
  <div 
    className={`p-8 text-center ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow-lg`}
    style={{ borderRadius: `${borderRadius}px` }}
  >
    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange to-amber flex items-center justify-center text-white text-xl font-medium mx-auto mb-4">
      {testimonial.name[0]}
    </div>
    {showRating && (
      <div className="flex justify-center gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`w-5 h-5 ${i < testimonial.rating ? 'fill-amber text-amber' : 'text-gray-300'}`} />
        ))}
      </div>
    )}
    <p className={`text-lg mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
      "{testimonial.content}"
    </p>
    <div className="font-semibold">{testimonial.name}</div>
    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{testimonial.company}</div>
  </div>
);

const WidgetPreviewBadge = ({ isDark }: PreviewProps) => (
  <div className="flex justify-center">
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full shadow-md ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
      <div className="flex -space-x-2">
        {['S', 'M', 'E'].map((letter, i) => (
          <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-orange to-amber flex items-center justify-center text-white text-xs font-medium border-2 border-white">
            {letter}
          </div>
        ))}
      </div>
      <div className="text-sm">
        <span className="font-semibold">127</span> happy customers
        <div className="flex gap-0.5 ml-1 inline-flex">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-3 h-3 fill-amber text-amber" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

interface WallPreviewProps extends PreviewProps {
  testimonials: Testimonial[];
}

const WidgetPreviewWall = ({ testimonials, isDark }: WallPreviewProps) => (
  <div className="space-y-3">
    <div className="text-center mb-4">
      <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Wall of Love 💛</h3>
    </div>
    <div className="grid grid-cols-2 gap-2">
      {testimonials.slice(0, 4).map((t) => (
        <div key={t.id} className={`p-3 rounded-lg ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow-sm`}>
          <div className="flex gap-0.5 mb-1">
            {[...Array(t.rating)].map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-amber text-amber" />
            ))}
          </div>
          <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>"{t.content.slice(0, 40)}..."</p>
          <div className="text-xs font-medium mt-1">— {t.name}</div>
        </div>
      ))}
    </div>
  </div>
);

export default WidgetBuilder;
