import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Search, Plus, Twitter, Linkedin, Mail, FileText,
  Image, Scissors, Copy, Trash2, MoreVertical,
  Calendar, Filter, Instagram
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const typeConfig: Record<string, { emoji: string; label: string; icon: any }> = {
  twitter_thread: { emoji: '🐦', label: 'Twitter Thread', icon: Twitter },
  linkedin_post: { emoji: '💼', label: 'LinkedIn Post', icon: Linkedin },
  instagram_carousel: { emoji: '📸', label: 'Instagram', icon: Instagram },
  email_snippet: { emoji: '📧', label: 'Email Snippet', icon: Mail },
  case_study: { emoji: '📄', label: 'Case Study', icon: FileText },
  quote_graphic: { emoji: '🖼️', label: 'Quote Graphic', icon: Image },
  video_highlight: { emoji: '✂️', label: 'Video Highlight', icon: Scissors },
  ai_avatar: { emoji: '🤖', label: 'AI Avatar', icon: Scissors },
};

const ContentLibrary = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: content = [], isLoading } = useQuery({
    queryKey: ['generated-content', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('generated_content')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const deleteContent = useMutation({
    mutationFn: async (contentId: string) => {
      const { error } = await supabase.from('generated_content').delete().eq('id', contentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-content'] });
      toast.success('Content deleted');
    },
  });

  const filteredContent = content.filter(item => {
    const matchesSearch = (item.content || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (typeFilter === 'all') return matchesSearch;
    return matchesSearch && item.type === typeFilter;
  });

  const copyContent = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Content copied!');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">Content Library 📚</h1>
            <p className="text-muted-foreground mt-1">All your generated content in one place</p>
          </div>
          <Link to="/dashboard/content">
            <Button className="gradient-sunny text-white shadow-warm hover:shadow-warm-lg transition-all">
              <Plus className="w-4 h-4 mr-2" />Create New
            </Button>
          </Link>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search content..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-card" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px] bg-card"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Filter" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="twitter_thread">🐦 Twitter</SelectItem>
              <SelectItem value="linkedin_post">💼 LinkedIn</SelectItem>
              <SelectItem value="email_snippet">📧 Email</SelectItem>
              <SelectItem value="case_study">📄 Case Study</SelectItem>
              <SelectItem value="quote_graphic">🖼️ Quote</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <Card key={i} className="bg-card"><CardContent className="p-5"><Skeleton className="h-32 w-full" /></CardContent></Card>)}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContent.map((item) => {
              const tc = typeConfig[item.type] || { emoji: '📝', label: item.type, icon: FileText };
              return (
                <Card key={item.id} className="bg-card hover:border-primary/30 hover:shadow-warm transition-all group">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-lg">{tc.emoji}</div>
                        <Badge variant="secondary" className="text-xs gap-1">
                          <tc.icon className="w-3 h-3" />{tc.label}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-card border-border">
                          <DropdownMenuItem className="cursor-pointer" onClick={() => copyContent(item.content || '')}>
                            <Copy className="w-4 h-4 mr-2" />Copy
                          </DropdownMenuItem>
                          <DropdownMenuItem className="cursor-pointer text-destructive" onClick={() => deleteContent.mutate(item.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-4 mb-4">{item.content}</p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{item.testimonial_ids?.length || 0} testimonials</span>
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => copyContent(item.content || '')}>
                        <Copy className="w-3 h-3 mr-1" />Copy
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!isLoading && filteredContent.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No content yet</h3>
            <p className="text-muted-foreground mb-6">Create your first piece of content from testimonials</p>
            <Link to="/dashboard/content">
              <Button className="gradient-sunny text-white"><Plus className="w-4 h-4 mr-2" />Create Content</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentLibrary;
