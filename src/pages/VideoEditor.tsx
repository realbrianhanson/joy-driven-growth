import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Maximize,
  Scissors,
  Type,
  Music,
  Wand2,
  ZoomIn,
  Mic,
  Film,
  Download,
  Check,
  RotateCcw,
  Sparkles,
  Clock,
  Languages,
  Loader2,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface TranscriptSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  type: 'normal' | 'filler' | 'pause';
  speaker?: string;
}

const mockTranscript: TranscriptSegment[] = [
  { id: '1', start: 0, end: 3.2, text: "Happy Client has been incredible for our business.", type: 'normal' },
  { id: '2', start: 3.2, end: 3.8, text: "Um,", type: 'filler' },
  { id: '3', start: 3.8, end: 7.5, text: "the AI interviews are like nothing I've seen before.", type: 'normal' },
  { id: '4', start: 7.5, end: 9.2, text: "", type: 'pause' },
  { id: '5', start: 9.2, end: 13.1, text: "Our conversion rate went up 40% in just two months.", type: 'normal' },
  { id: '6', start: 13.1, end: 13.6, text: "Uh,", type: 'filler' },
  { id: '7', start: 13.6, end: 17.8, text: "I would definitely recommend it to any business.", type: 'normal' },
  { id: '8', start: 17.8, end: 20.0, text: "", type: 'pause' },
  { id: '9', start: 20.0, end: 24.5, text: "The social proof widgets have been a game-changer.", type: 'normal' },
];

const VideoEditor = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(24.5);
  const [volume, setVolume] = useState([80]);
  
  // Enhancement toggles
  const [removeFillers, setRemoveFillers] = useState(true);
  const [removePauses, setRemovePauses] = useState(true);
  const [autoCaptions, setAutoCaptions] = useState(true);
  const [audioEnhance, setAudioEnhance] = useState(true);
  const [zoomOnFace, setZoomOnFace] = useState(false);
  
  // Export settings
  const [aspectRatio, setAspectRatio] = useState<'original' | 'square' | 'vertical'>('original');
  const [captionLanguage, setCaptionLanguage] = useState('en');
  const [showBefore, setShowBefore] = useState(false);
  
  // Processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredTranscript = mockTranscript.filter(segment => {
    if (removeFillers && segment.type === 'filler') return false;
    if (removePauses && segment.type === 'pause') return false;
    return true;
  });

  const totalRemoved = mockTranscript.length - filteredTranscript.length;
  const timeSaved = mockTranscript
    .filter(s => (removeFillers && s.type === 'filler') || (removePauses && s.type === 'pause'))
    .reduce((acc, s) => acc + (s.end - s.start), 0);

  const processVideo = async () => {
    setIsProcessing(true);
    setProcessingProgress(0);

    const steps = [
      'Analyzing video...',
      'Removing filler words...',
      'Trimming pauses...',
      'Enhancing audio...',
      'Generating captions...',
      'Finalizing...',
    ];

    for (let i = 0; i < steps.length; i++) {
      setProcessingStep(steps[i]);
      setProcessingProgress(((i + 1) / steps.length) * 100);
      await new Promise(r => setTimeout(r, 1000));
    }

    setIsProcessing(false);
    toast.success('Video processed successfully! ✨');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container max-w-7xl mx-auto py-4 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/dashboard/content">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎬</span>
                <h1 className="text-lg font-semibold text-foreground">AI Video Editor</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setShowBefore(!showBefore)}>
                {showBefore ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showBefore ? 'Hide' : 'Show'} Before
              </Button>
              <Button 
                className="gradient-sunny text-white"
                onClick={processVideo}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Process Video
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-96">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent mx-auto mb-4 flex items-center justify-center animate-pulse-glow">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{processingStep}</h3>
              <Progress value={processingProgress} className="mb-2" />
              <p className="text-sm text-muted-foreground">{Math.round(processingProgress)}% complete</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="container max-w-7xl mx-auto py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Video Player & Timeline */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video Player */}
            <Card className="bg-card overflow-hidden">
              <div className="aspect-video bg-foreground/5 relative flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent mx-auto mb-4 flex items-center justify-center">
                    <Film className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-muted-foreground">Video testimonial preview</p>
                  <p className="text-sm text-muted-foreground">Sarah Chen - TechFlow</p>
                </div>

                {/* Captions Preview */}
                {autoCaptions && (
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-foreground/80 text-background px-4 py-2 rounded-lg text-sm max-w-md text-center">
                    Happy Client has been incredible for our business.
                  </div>
                )}

                {/* Before/After Badge */}
                {showBefore && (
                  <Badge className="absolute top-4 left-4 bg-destructive text-white">
                    Original
                  </Badge>
                )}
              </div>

              {/* Video Controls */}
              <div className="p-4 border-t border-border">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="w-10 h-10 rounded-full"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <SkipForward className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex-1">
                    <Slider
                      value={[currentTime]}
                      max={duration}
                      step={0.1}
                      onValueChange={(v) => setCurrentTime(v[0])}
                      className="w-full"
                    />
                  </div>

                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4" />
                      <Slider
                        value={volume}
                        max={100}
                        step={1}
                        onValueChange={setVolume}
                        className="w-20"
                      />
                    </div>
                    <Button variant="ghost" size="sm">
                      <Maximize className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Transcript */}
            <Card className="bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Type className="w-4 h-4 text-primary" />
                    Transcript
                  </CardTitle>
                  {totalRemoved > 0 && (
                    <Badge className="bg-emerald/10 text-emerald border-emerald/20">
                      {totalRemoved} items removed • {timeSaved.toFixed(1)}s saved
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-warm">
                  {mockTranscript.map((segment) => {
                    const isRemoved = (removeFillers && segment.type === 'filler') ||
                      (removePauses && segment.type === 'pause');
                    
                    return (
                      <div
                        key={segment.id}
                        className={`flex items-start gap-3 p-2 rounded-lg transition-all ${
                          isRemoved ? 'opacity-40 line-through bg-destructive/5' :
                          segment.type === 'filler' ? 'bg-amber/10' :
                          segment.type === 'pause' ? 'bg-muted' :
                          'hover:bg-secondary/50'
                        }`}
                      >
                        <span className="text-xs text-muted-foreground font-mono w-12 flex-shrink-0">
                          {formatTime(segment.start)}
                        </span>
                        <span className={`text-sm flex-1 ${segment.type === 'pause' ? 'italic text-muted-foreground' : 'text-foreground'}`}>
                          {segment.type === 'pause' ? '[pause]' : segment.text}
                        </span>
                        {segment.type === 'filler' && !isRemoved && (
                          <Badge variant="outline" className="text-[10px] text-amber border-amber/30">
                            Filler
                          </Badge>
                        )}
                        {isRemoved && (
                          <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">
                            Removed
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right - Enhancements */}
          <div className="space-y-4">
            <Tabs defaultValue="enhance">
              <TabsList className="grid w-full grid-cols-2 bg-secondary">
                <TabsTrigger value="enhance">Enhance</TabsTrigger>
                <TabsTrigger value="export">Export</TabsTrigger>
              </TabsList>

              <TabsContent value="enhance" className="mt-4 space-y-4">
                {/* One-Click Enhancements */}
                <Card className="bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Wand2 className="w-4 h-4 text-primary" />
                      AI Enhancements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Scissors className="w-4 h-4 text-muted-foreground" />
                        <Label className="text-sm">Remove filler words</Label>
                      </div>
                      <Switch checked={removeFillers} onCheckedChange={setRemoveFillers} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <Label className="text-sm">Remove long pauses</Label>
                      </div>
                      <Switch checked={removePauses} onCheckedChange={setRemovePauses} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Type className="w-4 h-4 text-muted-foreground" />
                        <Label className="text-sm">Auto-captions</Label>
                      </div>
                      <Switch checked={autoCaptions} onCheckedChange={setAutoCaptions} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mic className="w-4 h-4 text-muted-foreground" />
                        <Label className="text-sm">Enhance audio</Label>
                      </div>
                      <Switch checked={audioEnhance} onCheckedChange={setAudioEnhance} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ZoomIn className="w-4 h-4 text-muted-foreground" />
                        <Label className="text-sm">Zoom on face</Label>
                      </div>
                      <Switch checked={zoomOnFace} onCheckedChange={setZoomOnFace} />
                    </div>
                  </CardContent>
                </Card>

                {/* Advanced Options */}
                <Card className="bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Music className="w-4 h-4 text-primary" />
                      Additional Options
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <Music className="w-4 h-4 mr-2" />
                      Add background music
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <Film className="w-4 h-4 mr-2" />
                      Add B-roll suggestions
                    </Button>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate highlight reel
                    </Button>
                  </CardContent>
                </Card>

                {/* Summary */}
                {(removeFillers || removePauses) && (
                  <Card className="bg-emerald/5 border-emerald/20">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Check className="w-4 h-4 text-emerald" />
                        <span className="font-medium text-emerald text-sm">Improvements Preview</span>
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {removeFillers && (
                          <li>• Removed {mockTranscript.filter(s => s.type === 'filler').length} filler words</li>
                        )}
                        {removePauses && (
                          <li>• Trimmed {mockTranscript.filter(s => s.type === 'pause').length} long pauses</li>
                        )}
                        <li className="text-emerald font-medium">
                          • Saved {timeSaved.toFixed(1)} seconds ({Math.round((timeSaved / duration) * 100)}% shorter)
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="export" className="mt-4 space-y-4">
                {/* Aspect Ratio */}
                <Card className="bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Aspect Ratio</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'original', label: 'Original', ratio: '16:9' },
                        { value: 'square', label: 'Square', ratio: '1:1' },
                        { value: 'vertical', label: 'Vertical', ratio: '9:16' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setAspectRatio(option.value as typeof aspectRatio)}
                          className={`p-3 rounded-lg border-2 text-center transition-all ${
                            aspectRatio === option.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary/30'
                          }`}
                        >
                          <div className="text-sm font-medium">{option.label}</div>
                          <div className="text-xs text-muted-foreground">{option.ratio}</div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Captions */}
                <Card className="bg-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Languages className="w-4 h-4 text-primary" />
                      Captions Language
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Select value={captionLanguage} onValueChange={setCaptionLanguage}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="pt">Portuguese</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-2">
                      AI-powered translation to 50+ languages
                    </p>
                  </CardContent>
                </Card>

                {/* Export Buttons */}
                <Card className="bg-card">
                  <CardContent className="p-4 space-y-3">
                    <Button className="w-full gradient-sunny text-white">
                      <Download className="w-4 h-4 mr-2" />
                      Export MP4
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-1" />
                        GIF
                      </Button>
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-1" />
                        WebM
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoEditor;
