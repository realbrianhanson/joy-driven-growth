import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Search, Globe, Eye, Edit, Copy, Trash2, MoreVertical, ExternalLink, Share2, BarChart3, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const WallOfLove = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: walls = [], isLoading } = useQuery({
    queryKey: ['walls', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('walls').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const deleteWall = useMutation({
    mutationFn: async (wallId: string) => {
      const { error } = await supabase.from('walls').delete().eq('id', wallId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['walls'] }); toast.success('Wall deleted'); },
  });

  const filteredWalls = walls.filter(w => w.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/wall/${slug}`);
    toast.success('Link copied!');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Wall of Love</h1>
            <p className="text-muted-foreground mt-1">Create beautiful testimonial pages to share with the world</p>
          </div>
          <Link to="/dashboard/walls/new"><Button><Plus className="w-4 h-4 mr-2" />New Wall</Button></Link>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search walls..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-card" />
          </div>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Card key={i}><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>)}
          </div>
        ) : filteredWalls.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-muted mb-4">
              <Heart className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Create your first wall</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6">Build a beautiful public page to showcase your best testimonials.</p>
            <Link to="/dashboard/walls/new"><Button><Plus className="w-4 h-4 mr-2" />Create Wall</Button></Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link to="/dashboard/walls/new">
              <Card className="border-2 border-dashed border-border bg-card/50 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all h-full">
                <CardContent className="p-6 flex flex-col items-center justify-center min-h-[200px] text-center">
                  <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mb-4">
                    <Plus className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">Create New Wall</h3>
                  <p className="text-sm text-muted-foreground">Build a beautiful testimonial page</p>
                </CardContent>
              </Card>
            </Link>

            {filteredWalls.map((wall) => (
              <Card key={wall.id} className="bg-card hover:border-border-hover transition-all group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{wall.name}</h3>
                        <Badge variant={wall.is_published ? 'default' : 'secondary'} className={wall.is_published ? 'bg-success text-white' : ''}>
                          {wall.is_published ? 'Live' : 'Draft'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Globe className="w-3.5 h-3.5" />/wall/{wall.slug}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="cursor-pointer" onClick={() => copyLink(wall.slug)}><Copy className="w-4 h-4 mr-2" />Copy Link</DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer text-destructive" onClick={() => deleteWall.mutate(wall.id)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="aspect-video rounded-lg bg-muted flex items-center justify-center mb-4">
                    <div className="text-center p-4">
                      <Heart className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <div className="text-sm font-medium text-muted-foreground">{wall.testimonial_ids?.length || 0} testimonials</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-muted-foreground"><Eye className="w-3.5 h-3.5" />{(wall.views || 0).toLocaleString()} views</div>
                      <div className="flex items-center gap-1 text-muted-foreground"><BarChart3 className="w-3.5 h-3.5" />{wall.testimonial_ids?.length || 0} items</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-border">
                    <Link to={`/dashboard/walls/${wall.id}`} className="flex-1"><Button variant="outline" size="sm" className="w-full"><Edit className="w-4 h-4 mr-2" />Edit</Button></Link>
                    <Button variant="outline" size="sm" onClick={() => copyLink(wall.slug)}><Share2 className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default WallOfLove;
