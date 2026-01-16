import { useState } from "react";
import { 
  Key,
  Plus,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Code,
  Webhook,
  AlertCircle,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Alert,
  AlertDescription,
} from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import SettingsLayout from "@/components/settings/SettingsLayout";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
}

const mockApiKeys: ApiKey[] = [
  { id: '1', name: 'Production', key: 'hc_live_xxxxxxxxxxxx', created: 'Jan 15, 2024', lastUsed: '2 hours ago' },
  { id: '2', name: 'Development', key: 'hc_test_xxxxxxxxxxxx', created: 'Jan 10, 2024', lastUsed: '1 day ago' },
  { id: '3', name: 'Zapier Integration', key: 'hc_live_yyyyyyyyyyyy', created: 'Dec 20, 2023', lastUsed: '3 days ago' },
];

const codeExamples = {
  curl: `curl -X GET "https://api.happyclient.io/v1/testimonials" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`,
  javascript: `const response = await fetch('https://api.happyclient.io/v1/testimonials', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const testimonials = await response.json();`,
  python: `import requests

headers = {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
}

response = requests.get('https://api.happyclient.io/v1/testimonials', headers=headers)
testimonials = response.json()`,
};

const SettingsApi = () => {
  const [apiKeys] = useState<ApiKey[]>(mockApiKeys);
  const [newKeyName, setNewKeyName] = useState("");
  const [showNewKey, setShowNewKey] = useState(false);
  const [newKeyValue, setNewKeyValue] = useState("");
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleCreateKey = () => {
    if (!newKeyName) {
      toast.error("Please enter a name for the API key");
      return;
    }
    
    const newKey = `hc_live_${Math.random().toString(36).substring(2, 15)}`;
    setNewKeyValue(newKey);
    setShowNewKey(true);
    toast.success("API key created!");
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("API key copied to clipboard!");
  };

  const handleRevokeKey = (key: ApiKey) => {
    toast.success(`API key "${key.name}" revoked`);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied!");
  };

  return (
    <SettingsLayout>
      <div className="space-y-6">
        {/* API Keys */}
        <Card className="bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-primary" />
                  API Keys
                </CardTitle>
                <CardDescription>Manage your API keys for programmatic access</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="gradient-sunny text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Key
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create API Key</DialogTitle>
                    <DialogDescription>
                      Give your API key a name to help you identify it later.
                    </DialogDescription>
                  </DialogHeader>
                  {!showNewKey ? (
                    <>
                      <div>
                        <Label htmlFor="keyName">Key Name</Label>
                        <Input
                          id="keyName"
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          placeholder="e.g., Production, Zapier, etc."
                          className="mt-1"
                        />
                      </div>
                      <DialogFooter>
                        <Button onClick={handleCreateKey} className="gradient-sunny text-white">
                          Create Key
                        </Button>
                      </DialogFooter>
                    </>
                  ) : (
                    <>
                      <Alert className="border-amber/20 bg-amber/5">
                        <AlertCircle className="h-4 w-4 text-amber" />
                        <AlertDescription className="text-amber">
                          Make sure to copy your API key now. You won't be able to see it again!
                        </AlertDescription>
                      </Alert>
                      <div className="flex items-center gap-2">
                        <Input
                          value={newKeyValue}
                          readOnly
                          className="font-mono"
                        />
                        <Button variant="outline" size="icon" onClick={() => handleCopyKey(newKeyValue)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <DialogFooter>
                        <Button 
                          onClick={() => {
                            setShowNewKey(false);
                            setNewKeyName("");
                            setNewKeyValue("");
                          }}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Done
                        </Button>
                      </DialogFooter>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Key</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-secondary px-2 py-1 rounded font-mono">
                          {visibleKeys.has(key.id) ? key.key : `${key.key.slice(0, 8)}...${key.key.slice(-4)}`}
                        </code>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => toggleKeyVisibility(key.id)}
                        >
                          {visibleKeys.has(key.id) ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => handleCopyKey(key.key)}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{key.created}</TableCell>
                    <TableCell className="text-muted-foreground">{key.lastUsed}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRevokeKey(key)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Documentation */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="w-5 h-5 text-primary" />
              Quick Start
            </CardTitle>
            <CardDescription>Get started with the Happy Client API</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-6">
              <Button variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                Full Documentation
              </Button>
              <Button variant="outline">
                <Code className="w-4 h-4 mr-2" />
                API Reference
              </Button>
            </div>

            <Tabs defaultValue="curl">
              <TabsList className="bg-secondary">
                <TabsTrigger value="curl">cURL</TabsTrigger>
                <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
              </TabsList>
              {Object.entries(codeExamples).map(([lang, code]) => (
                <TabsContent key={lang} value={lang}>
                  <div className="relative">
                    <pre className="p-4 rounded-lg bg-foreground/5 text-sm overflow-x-auto">
                      <code className="text-foreground">{code}</code>
                    </pre>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2"
                      onClick={() => copyCode(code)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
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
              <Webhook className="w-5 h-5 text-primary" />
              Available Endpoints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { method: 'GET', path: '/v1/testimonials', description: 'List all testimonials' },
                { method: 'GET', path: '/v1/testimonials/:id', description: 'Get a single testimonial' },
                { method: 'POST', path: '/v1/testimonials', description: 'Create a testimonial' },
                { method: 'PATCH', path: '/v1/testimonials/:id', description: 'Update a testimonial' },
                { method: 'DELETE', path: '/v1/testimonials/:id', description: 'Delete a testimonial' },
                { method: 'GET', path: '/v1/widgets', description: 'List all widgets' },
                { method: 'GET', path: '/v1/analytics/revenue', description: 'Get revenue attribution data' },
              ].map((endpoint, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors">
                  <Badge 
                    variant="outline" 
                    className={`font-mono text-xs ${
                      endpoint.method === 'GET' ? 'text-emerald border-emerald/30' :
                      endpoint.method === 'POST' ? 'text-sky border-sky/30' :
                      endpoint.method === 'PATCH' ? 'text-amber border-amber/30' :
                      'text-rose border-rose/30'
                    }`}
                  >
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
