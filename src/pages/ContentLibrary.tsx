import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Search, 
  Plus,
  Twitter,
  Linkedin,
  Mail,
  FileText,
  Image,
  Scissors,
  Copy,
  Edit,
  Trash2,
  MoreVertical,
  Eye,
  Download,
  Calendar,
  Filter,
  Instagram
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface ContentItem {
  id: string;
  type: 'twitter' | 'linkedin' | 'instagram' | 'email' | 'casestudy' | 'quote' | 'highlight';
  title: string;
  preview: string;
  createdAt: string;
  testimonialName: string;
}

const mockContent: ContentItem[] = [
  {
    id: '1',
    type: 'twitter',
    title: 'Twitter Thread - Sarah Chen',
    preview: '🧵 Thread: How we increased conversions by 40% with social proof...',
    createdAt: '2 hours ago',
    testimonialName: 'Sarah Chen',
  },
  {
    id: '2',
    type: 'linkedin',
    title: 'LinkedIn Post - Marcus Johnson',
    preview: 'Last quarter, we made a decision that changed everything...',
    createdAt: '1 day ago',
    testimonialName: 'Marcus Johnson',
  },
  {
    id: '3',
    type: 'quote',
    title: 'Quote Graphic - Emily Rodriguez',
    preview: '"Our conversion rate jumped 35%..."',
    createdAt: '2 days ago',
    testimonialName: 'Emily Rodriguez',
  },
  {
    id: '4',
    type: 'email',
    title: 'Email Snippet - Alex Kim',
    preview: 'Hi {first_name}, I wanted to share something our customers...',
    createdAt: '3 days ago',
    testimonialName: 'Alex Kim',
  },
  {
    id: '5',
    type: 'casestudy',
    title: 'Case Study - Jordan Lee',
    preview: 'Company: ScaleUp Co | Industry: SaaS | Results: 2x conversions...',
    createdAt: '1 week ago',
    testimonialName: 'Jordan Lee',
  },
];

const getTypeIcon = (type: ContentItem['type']) => {
  const icons = {
    twitter: <Twitter className="w-4 h-4" />,
    linkedin: <Linkedin className="w-4 h-4" />,
    instagram: <Instagram className="w-4 h-4" />,
    email: <Mail className="w-4 h-4" />,
    casestudy: <FileText className="w-4 h-4" />,
    quote: <Image className="w-4 h-4" />,
    highlight: <Scissors className="w-4 h-4" />,
  };
  return icons[type];
};

const getTypeEmoji = (type: ContentItem['type']) => {
  const emojis = {
    twitter: '🐦',
    linkedin: '💼',
    instagram: '📸',
    email: '📧',
    casestudy: '📄',
    quote: '🖼️',
    highlight: '✂️',
  };
  return emojis[type];
};

const getTypeLabel = (type: ContentItem['type']) => {
  const labels = {
    twitter: 'Twitter Thread',
    linkedin: 'LinkedIn Post',
    instagram: 'Instagram',
    email: 'Email Snippet',
    casestudy: 'Case Study',
    quote: 'Quote Graphic',
    highlight: 'Video Highlight',
  };
  return labels[type];
};

const ContentLibrary = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [content] = useState<ContentItem[]>(mockContent);

  const filteredContent = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.preview.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.testimonialName.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (typeFilter === 'all') return matchesSearch;
    return matchesSearch && item.type === typeFilter;
  });

  const copyContent = (item: ContentItem) => {
    navigator.clipboard.writeText(item.preview);
    toast.success('Content copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
              Content Library 📚
            </h1>
            <p className="text-muted-foreground mt-1">
              All your generated content in one place
            </p>
          </div>
          <Link to="/dashboard/content">
            <Button className="gradient-sunny text-white shadow-warm hover:shadow-warm-lg transition-all">
              <Plus className="w-4 h-4 mr-2" />
              Create New
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border focus:border-primary focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-3">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px] bg-card">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="twitter">🐦 Twitter</SelectItem>
                <SelectItem value="linkedin">💼 LinkedIn</SelectItem>
                <SelectItem value="email">📧 Email</SelectItem>
                <SelectItem value="casestudy">📄 Case Study</SelectItem>
                <SelectItem value="quote">🖼️ Quote</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px] bg-card">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="type">By Type</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContent.map((item) => (
            <Card 
              key={item.id}
              className="bg-card hover:border-primary/30 hover:shadow-warm transition-all group"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-lg">
                      {getTypeEmoji(item.type)}
                    </div>
                    <div>
                      <Badge variant="secondary" className="text-xs gap-1">
                        {getTypeIcon(item.type)}
                        {getTypeLabel(item.type)}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border">
                      <DropdownMenuItem className="cursor-pointer">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer" onClick={() => copyContent(item)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      {item.type === 'quote' && (
                        <DropdownMenuItem className="cursor-pointer">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="cursor-pointer text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <h3 className="font-medium text-foreground mb-2 line-clamp-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{item.preview}</p>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>From: {item.testimonialName}</span>
                  <span>{item.createdAt}</span>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => copyContent(item)}>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredContent.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No content yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first piece of content from testimonials
            </p>
            <Link to="/dashboard/content">
              <Button className="gradient-sunny text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Content
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentLibrary;
