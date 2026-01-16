import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Building2,
  Plus,
  Search,
  MoreVertical,
  Settings,
  Users,
  DollarSign,
  AlertCircle,
  TrendingUp,
  Globe,
  Activity,
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  Crown,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  domain?: string;
  testimonials: number;
  revenue: number;
  health: 'healthy' | 'attention' | 'critical';
  lastActivity: string;
}

const mockClients: Client[] = [
  { id: '1', name: 'TechFlow Inc', domain: 'testimonials.techflow.io', testimonials: 47, revenue: 12400, health: 'healthy', lastActivity: '2 hours ago' },
  { id: '2', name: 'DataSync Corp', domain: 'love.datasync.com', testimonials: 32, revenue: 8900, health: 'healthy', lastActivity: '1 day ago' },
  { id: '3', name: 'GrowthLab', testimonials: 12, revenue: 2100, health: 'attention', lastActivity: '5 days ago' },
  { id: '4', name: 'StartupX', domain: 'reviews.startupx.io', testimonials: 67, revenue: 18700, health: 'healthy', lastActivity: '3 hours ago' },
  { id: '5', name: 'ScaleUp Co', testimonials: 8, revenue: 450, health: 'critical', lastActivity: '2 weeks ago' },
];

const healthConfig = {
  healthy: { label: 'Healthy', color: 'bg-emerald/10 text-emerald border-emerald/20', emoji: '🟢' },
  attention: { label: 'Needs Attention', color: 'bg-amber/10 text-amber border-amber/20', emoji: '🟡' },
  critical: { label: 'Critical', color: 'bg-rose/10 text-rose border-rose/20', emoji: '🔴' },
};

const AgencyDashboard = () => {
  const [clients] = useState<Client[]>(mockClients);
  const [searchQuery, setSearchQuery] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newClientDomain, setNewClientDomain] = useState("");

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRevenue = clients.reduce((acc, c) => acc + c.revenue, 0);
  const totalTestimonials = clients.reduce((acc, c) => acc + c.testimonials, 0);
  const needsAttention = clients.filter(c => c.health !== 'healthy').length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleAddClient = () => {
    if (!newClientName) {
      toast.error("Please enter a client name");
      return;
    }
    toast.success(`Client "${newClientName}" added!`);
    setNewClientName("");
    setNewClientDomain("");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="gradient-sunny text-white">
                <Crown className="w-3 h-3 mr-1" />
                Agency Mode
              </Badge>
            </div>
            <h1 className="text-3xl font-display font-bold text-foreground">Agency Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage all your clients in one place</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gradient-sunny text-white shadow-warm hover:shadow-warm-lg transition-all">
                <Plus className="w-4 h-4 mr-2" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Client</DialogTitle>
                <DialogDescription>Set up a new client workspace</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Company Name</Label>
                  <Input 
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Acme Corp"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Custom Domain (optional)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    <Input 
                      value={newClientDomain}
                      onChange={(e) => setNewClientDomain(e.target.value)}
                      placeholder="testimonials.client.com"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddClient} className="gradient-sunny text-white">
                  Add Client
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{clients.length}</p>
                  <p className="text-xs text-muted-foreground">Active Clients</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gold">{formatCurrency(totalRevenue)}</p>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalTestimonials}</p>
                  <p className="text-xs text-muted-foreground">Total Testimonials</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-card ${needsAttention > 0 ? 'border-amber/30' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${needsAttention > 0 ? 'bg-amber/10' : 'bg-emerald/10'}`}>
                  <AlertCircle className={`w-5 h-5 ${needsAttention > 0 ? 'text-amber' : 'text-emerald'}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{needsAttention}</p>
                  <p className="text-xs text-muted-foreground">Need Attention</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {needsAttention > 0 && (
          <Card className="bg-amber/5 border-amber/20 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber" />
                <div className="flex-1">
                  <p className="font-medium text-foreground">Clients need attention</p>
                  <p className="text-sm text-muted-foreground">
                    {clients.filter(c => c.health === 'attention').map(c => c.name).join(', ')} haven't collected testimonials recently
                  </p>
                </div>
                <Button variant="outline" size="sm">View Details</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card"
            />
          </div>
        </div>

        {/* Clients Table */}
        <Card className="bg-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Custom Domain</TableHead>
                  <TableHead className="text-right">Testimonials</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => {
                  const healthInfo = healthConfig[client.health];
                  return (
                    <TableRow key={client.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white">
                              {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground">{client.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.domain ? (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Globe className="w-3 h-3" />
                            {client.domain}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not configured</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">{client.testimonials}</TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-gold/10 text-gold border-gold/20">
                          {formatCurrency(client.revenue)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={healthInfo.color}>
                          {healthInfo.emoji} {healthInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{client.lastActivity}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card border-border">
                            <DropdownMenuItem className="cursor-pointer">
                              <Eye className="w-4 h-4 mr-2" />
                              View Dashboard
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <BarChart3 className="w-4 h-4 mr-2" />
                              Analytics
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Settings className="w-4 h-4 mr-2" />
                              Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer">
                              <Users className="w-4 h-4 mr-2" />
                              Manage Users
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove Client
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {filteredClients.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏢</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No clients found</h3>
            <p className="text-muted-foreground mb-6">
              Add your first client to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgencyDashboard;
