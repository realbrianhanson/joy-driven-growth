import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Camera, 
  Type, 
  Check, 
  ExternalLink, 
  Twitter, 
  Linkedin, 
  Facebook, 
  Mail,
  Globe,
  Tag,
  FolderOpen,
  Sparkles,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ChromeExtension = () => {
  const [mode, setMode] = useState<"text" | "screenshot" | null>(null);
  const [saved, setSaved] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [detectedAuthor, setDetectedAuthor] = useState("");
  const [detectedPlatform, setDetectedPlatform] = useState("");
  const [selectedProject, setSelectedProject] = useState("happy-client-saas");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  const platforms = [
    { id: "twitter", name: "Twitter/X", icon: Twitter, color: "bg-sky-500" },
    { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "bg-blue-600" },
    { id: "facebook", name: "Facebook", icon: Facebook, color: "bg-blue-500" },
    { id: "email", name: "Email", icon: Mail, color: "bg-rose-500" },
    { id: "web", name: "Any Webpage", icon: Globe, color: "bg-emerald-500" },
  ];

  const handleTextMode = () => {
    setMode("text");
    // Simulate detected text
    setSelectedText("This product completely transformed our workflow. We've seen a 300% increase in productivity since implementing it. The team at Happy Client has been incredibly supportive throughout the entire process.");
    setDetectedAuthor("Sarah Mitchell");
    setDetectedPlatform("linkedin");
  };

  const handleScreenshotMode = () => {
    setMode("screenshot");
    setSelectedText("");
    setDetectedAuthor("");
    setDetectedPlatform("");
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setMode(null);
    }, 3000);
  };

  const addTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-orange-50/30 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 gradient-sunny rounded-xl flex items-center justify-center shadow-warm">
              <span className="text-2xl">💛</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Chrome Extension</h1>
          </div>
          <p className="text-muted-foreground">
            Save testimonials from anywhere on the web with just a click
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Extension Preview */}
          <div className="space-y-6">
            <Card className="border-2 border-border bg-card shadow-warm-lg rounded-2xl overflow-hidden animate-fade-in-up">
              <CardHeader className="gradient-sunny text-white p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <span className="text-lg">💛</span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">Happy Client</CardTitle>
                    <p className="text-white/80 text-sm">Save a testimonial</p>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                {/* Current Page Info */}
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="text-xs text-muted-foreground mb-1">Current Page</p>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium truncate">linkedin.com/posts/sarah-mitchell...</span>
                  </div>
                </div>

                {/* Mode Selection */}
                <AnimatePresence mode="wait">
                  {!mode && !saved && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="grid grid-cols-2 gap-4"
                    >
                      <button
                        onClick={handleTextMode}
                        className="p-6 bg-background border-2 border-border hover:border-primary rounded-xl transition-all hover:-translate-y-1 hover:shadow-warm group"
                      >
                        <Type className="w-8 h-8 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />
                        <p className="font-semibold text-foreground">Text Selection</p>
                        <p className="text-xs text-muted-foreground mt-1">Highlight text on page</p>
                      </button>
                      
                      <button
                        onClick={handleScreenshotMode}
                        className="p-6 bg-background border-2 border-border hover:border-primary rounded-xl transition-all hover:-translate-y-1 hover:shadow-warm group"
                      >
                        <Camera className="w-8 h-8 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />
                        <p className="font-semibold text-foreground">Screenshot</p>
                        <p className="text-xs text-muted-foreground mt-1">Capture area + OCR</p>
                      </button>
                    </motion.div>
                  )}

                  {mode === "text" && !saved && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      {/* Selected Text */}
                      <div>
                        <Label className="text-xs text-muted-foreground">Selected Text</Label>
                        <div className="mt-1 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
                          "{selectedText}"
                        </div>
                      </div>

                      {/* Auto-detected Info */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Author (auto-detected)</Label>
                          <Input 
                            value={detectedAuthor} 
                            onChange={(e) => setDetectedAuthor(e.target.value)}
                            className="mt-1 bg-background border-border rounded-lg"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Platform</Label>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                              <Linkedin className="w-3 h-3 mr-1" />
                              LinkedIn
                            </Badge>
                            <span className="text-xs text-muted-foreground">✓ detected</span>
                          </div>
                        </div>
                      </div>

                      {/* Project Selection */}
                      <div>
                        <Label className="text-xs text-muted-foreground">Save to Project</Label>
                        <div className="mt-1 flex items-center gap-2 p-2 bg-background border border-border rounded-lg">
                          <FolderOpen className="w-4 h-4 text-muted-foreground" />
                          <select 
                            value={selectedProject}
                            onChange={(e) => setSelectedProject(e.target.value)}
                            className="flex-1 bg-transparent text-sm outline-none"
                          >
                            <option value="happy-client-saas">Happy Client SaaS</option>
                            <option value="marketing-site">Marketing Site</option>
                            <option value="product-launch">Product Launch</option>
                          </select>
                        </div>
                      </div>

                      {/* Tags */}
                      <div>
                        <Label className="text-xs text-muted-foreground">Tags</Label>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <Badge 
                              key={tag} 
                              variant="secondary" 
                              className="bg-muted text-foreground"
                              onClick={() => setTags(tags.filter(t => t !== tag))}
                            >
                              {tag} ×
                            </Badge>
                          ))}
                          <div className="flex items-center gap-1">
                            <Input
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              placeholder="Add tag..."
                              className="h-6 w-24 text-xs bg-background border-border"
                              onKeyDown={(e) => e.key === "Enter" && addTag()}
                            />
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={addTag}>
                              <Tag className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Save Button */}
                      <Button 
                        onClick={handleSave}
                        className="w-full gradient-sunny text-white shadow-warm hover:shadow-warm-lg transition-all h-12"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Save to Happy Client
                      </Button>

                      <button 
                        onClick={() => setMode(null)}
                        className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        ← Back
                      </button>
                    </motion.div>
                  )}

                  {mode === "screenshot" && !saved && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      {/* Screenshot Preview */}
                      <div className="aspect-video bg-muted/50 rounded-xl border-2 border-dashed border-border flex items-center justify-center">
                        <div className="text-center">
                          <Camera className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">Click to capture area</p>
                          <p className="text-xs text-muted-foreground mt-1">OCR will extract text</p>
                        </div>
                      </div>

                      <Button 
                        className="w-full gradient-sunny text-white shadow-warm hover:shadow-warm-lg transition-all h-12"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Capture Screenshot
                      </Button>

                      <button 
                        onClick={() => setMode(null)}
                        className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        ← Back
                      </button>
                    </motion.div>
                  )}

                  {saved && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-8"
                    >
                      <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Check className="w-8 h-8 text-emerald-600" />
                      </div>
                      <h3 className="text-xl font-bold text-foreground mb-2">Saved! 🎉</h3>
                      <p className="text-muted-foreground mb-4">Testimonial added to Happy Client</p>
                      <Button variant="outline" className="border-border hover:bg-muted">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View in Happy Client
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>

          {/* Supported Platforms */}
          <div className="space-y-6">
            <Card className="border border-border bg-card shadow-warm rounded-2xl animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              <CardHeader>
                <CardTitle className="text-lg">Works Everywhere 🌍</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {platforms.map((platform, index) => (
                  <div 
                    key={platform.id}
                    className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className={`w-10 h-10 ${platform.color} rounded-lg flex items-center justify-center text-white`}>
                      <platform.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{platform.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {platform.id === "twitter" && "Extracts tweet + author automatically"}
                        {platform.id === "linkedin" && "Extracts post content + profile"}
                        {platform.id === "facebook" && "Captures posts and reviews"}
                        {platform.id === "email" && "Extract quotes from emails"}
                        {platform.id === "web" && "Select any text on any page"}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border border-border bg-card shadow-warm rounded-2xl animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              <CardHeader>
                <CardTitle className="text-lg">Get the Extension</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Install our Chrome extension to capture testimonials from anywhere on the web with just a click.
                </p>
                <Button className="w-full gradient-sunny text-white shadow-warm hover:shadow-warm-lg transition-all">
                  <Download className="w-4 h-4 mr-2" />
                  Add to Chrome - Free
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  Also available for Firefox and Safari
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border bg-gradient-to-br from-amber-50 to-orange-50 shadow-warm rounded-2xl animate-fade-in-up" style={{ animationDelay: "300ms" }}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">💡</div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Pro Tip</h3>
                    <p className="text-sm text-muted-foreground">
                      Use the keyboard shortcut <kbd className="px-1.5 py-0.5 bg-background rounded border border-border text-xs">Ctrl+Shift+H</kbd> to 
                      quickly save selected text as a testimonial!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChromeExtension;
