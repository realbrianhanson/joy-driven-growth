import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Plus,
  Search,
  Globe,
  Eye,
  Edit,
  Copy,
  Trash2,
  MoreVertical,
  ExternalLink,
  Share2,
  Settings,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Wall {
  id: string;
  name: string;
  slug: string;
  status: 'published' | 'draft';
  testimonialCount: number;
  views: number;
  lastUpdated: string;
  customDomain?: string;
}

const mockWalls: Wall[] = [
  {
    id: '1',
    name: 'Customer Love',
    slug: 'customer-love',
    status: 'published',
    testimonialCount: 47,
    views: 2341,
    lastUpdated: '2 hours ago',
  },
  {
    id: '2',
    name: 'Success Stories',
    slug: 'success-stories',
    status: 'published',
    testimonialCount: 23,
    views: 892,
    lastUpdated: '1 day ago',
    customDomain: 'love.mycompany.com',
  },
  {
    id: '3',
    name: 'Partner Reviews',
    slug: 'partner-reviews',
    status: 'draft',
    testimonialCount: 12,
    views: 0,
    lastUpdated: '3 days ago',
  },
];

const WallOfLove = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [walls] = useState<Wall[]>(mockWalls);

  const filteredWalls = walls.filter(wall =>
    wall.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`https://happyclient.io/love/${slug}`);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
              Wall of Love 🧱
            </h1>
            <p className="text-muted-foreground mt-1">
              Create beautiful testimonial pages to share with the world
            </p>
          </div>
          <Link to="/dashboard/walls/new">
            <Button className="gradient-sunny text-white shadow-warm hover:shadow-warm-lg transition-all">
              <Plus className="w-4 h-4 mr-2" />
              New Wall
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search walls..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border focus:border-primary focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Walls Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Create New Card */}
          <Link to="/dashboard/walls/new">
            <Card className="bg-card hover:border-primary/50 hover:shadow-warm transition-all cursor-pointer h-full border-dashed border-2">
              <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px] text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Create New Wall</h3>
                <p className="text-sm text-muted-foreground">
                  Build a beautiful testimonial page
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Wall Cards */}
          {filteredWalls.map((wall) => (
            <Card 
              key={wall.id}
              className="bg-card hover:border-primary/30 hover:shadow-warm transition-all group"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{wall.name}</h3>
                      <Badge 
                        variant={wall.status === 'published' ? 'default' : 'secondary'}
                        className={wall.status === 'published' ? 'bg-emerald text-white' : ''}
                      >
                        {wall.status === 'published' ? '🟢 Live' : '📝 Draft'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Globe className="w-3.5 h-3.5" />
                      {wall.customDomain || `happyclient.io/love/${wall.slug}`}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border">
                      <DropdownMenuItem className="cursor-pointer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Live
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer" onClick={() => copyLink(wall.slug)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Preview */}
                <div className="aspect-video rounded-lg bg-gradient-to-br from-orange-light to-amber-light flex items-center justify-center mb-4 overflow-hidden">
                  <div className="text-center p-4">
                    <div className="text-4xl mb-2">💛</div>
                    <div className="text-sm font-medium text-foreground/80">{wall.testimonialCount} testimonials</div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Eye className="w-3.5 h-3.5" />
                      {wall.views.toLocaleString()} views
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <BarChart3 className="w-3.5 h-3.5" />
                      {wall.testimonialCount} items
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Updated {wall.lastUpdated}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                  <Link to={`/dashboard/walls/${wall.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={() => copyLink(wall.slug)}>
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredWalls.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🧱</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No walls yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first Wall of Love to showcase testimonials
            </p>
            <Link to="/dashboard/walls/new">
              <Button className="gradient-sunny text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Wall
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default WallOfLove;
