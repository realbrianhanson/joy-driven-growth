import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Search, Globe, Eye, Edit, Copy, Trash2, MoreVertical, ExternalLink, Share2, BarChart3, Heart, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspace } from "@/hooks/use-workspace";
import { toast } from "sonner";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { MOCK_WALLS } from "@/data/mock/walls";

const WallOfLove = () => {
  const { user } = useAuth();
  const { workspaceOwnerId } = useWorkspace();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const { isDemoMode } = useDemoMode();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const { data: realWalls = [], isLoading: realLoading, error: wallsError, refetch } = useQuery({
    queryKey: ['walls', workspaceOwnerId],
    queryFn: async () => {
      if (!workspaceOwnerId) return [];
      const { data, error } = await supabase.from('walls').select('*').eq('user_id', workspaceOwnerId).order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceOwnerId && !isDemoMode,
  });

  const walls: any[] = isDemoMode ? (MOCK_WALLS as any[]) : realWalls;
  const isLoading = isDemoMode ? false : realLoading;

  const deleteWall = useMutation({
    mutationFn: async (wallId: string) => {
      const { error } = await supabase.from('walls').delete().eq('id', wallId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['walls'] }); toast.success('Wall deleted'); },
    onError: () => toast.error('Failed to delete wall'),
  });

  const handleDeleteRequest = (id: string) => {
    if (isDemoMode) {
      toast.info("Switch to live data to delete walls.");
      return;
    }
    setDeleteTarget(id);
  };
  const confirmDelete = () => {
    if (!deleteTarget) return;
    const id = deleteTarget;
    setDeleteTarget(null);
    deleteWall.mutate(id);
  };

  const viewWall = (slug: string, isPublished: boolean) => {
    if (!isPublished) {
      toast.info("Publish this wall first to view it.");
      return;
    }
    window.open(`/wall/${slug}`, "_blank", "noopener,noreferrer");
  };

  const filteredWalls = walls.filter(w => w.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/wall/${slug}`);
    toast.success('Link copied!');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {(() => {
          const liveCount = walls.filter((w: any) => w.is_published).length;
          return (
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-foreground">Wall of Love</h1>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="tabular-nums">{walls.length}</span> total
              {liveCount > 0 && (
                <>
                  <span className="mx-1.5 text-border">·</span>
                  <span className="tabular-nums">{liveCount}</span> live
                </>
              )}
            </p>
          </div>
          <Link to="/dashboard/walls/new"><Button size="sm"><Plus className="w-4 h-4 mr-1.5" />New Wall</Button></Link>
        </div>
          );
        })()}

        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search walls..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-9 bg-card" />
          </div>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Card key={i}><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>)}
          </div>
        ) : wallsError && !isDemoMode ? (
          <div className="text-center py-24 border border-dashed border-destructive/30 rounded-xl">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-destructive/10 mb-4">
              <AlertCircle className="w-5 h-5 text-destructive" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1.5">Couldn't load walls</h3>
            <p className="text-sm text-muted-foreground mb-5">{wallsError instanceof Error ? wallsError.message : "Something went wrong."}</p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : filteredWalls.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-border rounded-xl">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-light mb-4">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1.5">Create your first wall</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">Build a beautiful public page to showcase your best testimonials.</p>
            <Link to="/dashboard/walls/new"><Button size="sm"><Plus className="w-4 h-4 mr-1.5" />Create Wall</Button></Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            <Link to="/dashboard/walls/new">
              <Card className="border border-dashed border-border bg-transparent hover:border-primary/50 hover:bg-primary-light/40 cursor-pointer transition-colors h-full rounded-xl shadow-none">
                <CardContent className="p-5 flex flex-col items-center justify-center min-h-[240px] text-center">
                  <div className="w-10 h-10 rounded-lg bg-primary-light flex items-center justify-center mb-3">
                    <Plus className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground text-[15px] mb-1">Create New Wall</h3>
                  <p className="text-xs text-muted-foreground">Build a beautiful testimonial page</p>
                </CardContent>
              </Card>
            </Link>

            {filteredWalls.map((wall) => (
              <Card key={wall.id} className="bg-card border border-border hover:border-border-hover transition-colors rounded-xl shadow-none">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`inline-block w-1.5 h-1.5 rounded-full ${wall.is_published ? 'bg-success' : 'bg-muted-foreground/40'}`}
                          aria-hidden
                        />
                        <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
                          {wall.is_published ? 'Live' : 'Draft'}
                        </span>
                      </div>
                      <h3 className="font-semibold text-foreground text-[15px] truncate">{wall.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 truncate">
                        <Globe className="w-3 h-3 shrink-0" />/wall/{wall.slug}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0 -mr-1 -mt-1 text-muted-foreground hover:text-foreground"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="cursor-pointer" onClick={() => copyLink(wall.slug)}><Copy className="w-4 h-4 mr-2" />Copy Link</DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer" onClick={() => viewWall(wall.slug, !!wall.is_published)}><ExternalLink className="w-4 h-4 mr-2" />View wall</DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer text-destructive" onClick={() => handleDeleteRequest(wall.id)}><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 mt-3 border-t border-border">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Testimonials</div>
                      <div className="text-xl font-semibold text-foreground tabular-nums mt-0.5">{wall.testimonial_ids?.length || 0}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Views</div>
                      <div className="text-xl font-semibold text-foreground tabular-nums mt-0.5">{(wall.views || 0).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                    <Link to={`/dashboard/walls/${wall.id}`} className="flex-1"><Button variant="outline" size="sm" className="w-full h-8"><Edit className="w-3 h-3 mr-1.5" />Edit</Button></Link>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => viewWall(wall.slug, !!wall.is_published)} aria-label="View wall" disabled={!wall.is_published}><ExternalLink className="w-3.5 h-3.5" /></Button>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => copyLink(wall.slug)} aria-label="Copy link"><Share2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete wall?</AlertDialogTitle>
              <AlertDialogDescription>This will permanently remove the wall and its public page.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </motion.div>
  );
};

export default WallOfLove;
