import { useState } from "react";
import { 
  Key, Copy, Code, Webhook, AlertCircle, Check, RefreshCw, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import SettingsLayout from "@/components/settings/SettingsLayout";

const SettingsApi = () => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateApiKey = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const key = `hc_live_${crypto.randomUUID().replace(/-/g, '').slice(0, 24)}`;
      setApiKey(key);
      setIsGenerating(false);
      toast.success('API key generated! Copy it now — you won\'t see it again.');
    }, 800);
  };

  const copyKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      toast.success('API key copied!');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied!');
  };

  const baseUrl = window.location.origin;

  const codeExamples: Record<string, string> = {
    curl: `curl -X POST "${baseUrl}/functions/v1/submit-testimonial" \\
  -H "Content-Type: application/json" \\
  -d '{
    "form_slug": "your-form-slug",
    "author_name": "Jane Doe",
    "author_email": "jane@example.com",
    "content": "Great product!",
    "rating": 5
  }'`,
    javascript: `const response = await fetch('${baseUrl}/functions/v1/submit-testimonial', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    form_slug: 'your-form-slug',
    author_name: 'Jane Doe',
    author_email: 'jane@example.com',
    content: 'Great product!',
    rating: 5
  })
});

const result = await response.json();
console.log(result);`,
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        {/* API Key */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5 text-primary" />API Key
            </CardTitle>
            <CardDescription>Generate an API key to submit testimonials programmatically</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!apiKey ? (
              <Button onClick={generateApiKey} className="gradient-sunny text-white" disabled={isGenerating}>
                {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
                Generate API Key
              </Button>
            ) : (
              <>
                <Alert className="border-amber/20 bg-amber/5">
                  <AlertCircle className="h-4 w-4 text-amber" />
                  <AlertDescription className="text-amber">
                    Copy your API key now. You won't be able to see it again!
                  </AlertDescription>
                </Alert>
                <div className="flex items-center gap-2">
                  <Input value={apiKey} readOnly className="font-mono" />
                  <Button variant="outline" size="icon" onClick={copyKey}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Documentation */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5 text-primary" />Quick Start
            </CardTitle>
            <CardDescription>Submit testimonials via the REST API</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="curl">
              <TabsList className="bg-secondary">
                <TabsTrigger value="curl">cURL</TabsTrigger>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
              </TabsList>
              {Object.entries(codeExamples).map(([lang, code]) => (
                <TabsContent key={lang} value={lang}>
                  <div className="relative">
                    <pre className="p-4 rounded-lg bg-foreground/5 text-sm overflow-x-auto">
                      <code className="text-foreground">{code}</code>
                    </pre>
                    <Button size="sm" variant="outline" className="absolute top-2 right-2" onClick={() => copyCode(code)}>
                      <Copy className="w-4 h-4 mr-1" />Copy
                    </Button>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="w-5 h-5 text-primary" />Available Endpoints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { method: 'POST', path: '/functions/v1/submit-testimonial', description: 'Submit a testimonial via a published form' },
                { method: 'POST', path: '/functions/v1/analyze-testimonial', description: 'Analyze a testimonial with AI' },
                { method: 'POST', path: '/functions/v1/generate-content', description: 'Generate marketing content from testimonials' },
              ].map((endpoint, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                  <Badge variant="outline" className={`font-mono text-xs ${
                    endpoint.method === 'GET' ? 'text-emerald border-emerald/30' : 'text-sky border-sky/30'
                  }`}>
                    {endpoint.method}
                  </Badge>
                  <code className="text-sm font-mono text-foreground">{endpoint.path}</code>
                  <span className="text-sm text-muted-foreground flex-1">{endpoint.description}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
};

export default SettingsApi;
