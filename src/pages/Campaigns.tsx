import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Send, TrendingUp, MessageSquare, Users, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspace } from "@/hooks/use-workspace";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { MOCK_CAMPAIGNS } from "@/data/mock/campaigns";

export default function Campaigns() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { workspaceOwnerId } = useWorkspace();
  const { isDemoMode } = useDemoMode();
  const queryClient = useQueryClient();

  const { data: realCampaigns, isLoading } = useQuery({
    queryKey: ["campaigns", workspaceOwnerId],
    queryFn: async () => {
      if (!workspaceOwnerId) return [];
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("user_id", workspaceOwnerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceOwnerId && !isDemoMode,
  });

  useEffect(() => {
    if (!workspaceOwnerId || isDemoMode) return;
    const channel = supabase
      .channel("campaigns-changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "campaigns", filter: `user_id=eq.${workspaceOwnerId}` },
        () => queryClient.invalidateQueries({ queryKey: ["campaigns", workspaceOwnerId] })
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [workspaceOwnerId, isDemoMode, queryClient]);

  const loading = isDemoMode ? false : isLoading;
  const campaigns = isDemoMode ? MOCK_CAMPAIGNS : (realCampaigns ?? []);

  const totalSent = campaigns.reduce((sum, c) => sum + (c.sent_count ?? 0), 0);
  const monthlyLimit = 500;

  const campaignsWithSent = campaigns.filter((c) => (c.sent_count ?? 0) > 0);
  const avgResponseRate = campaignsWithSent.length > 0
    ? Math.round(campaignsWithSent.reduce((sum, c) => sum + ((c.completed_count ?? 0) / (c.sent_count ?? 1)) * 100, 0) / campaignsWithSent.length)
    : 0;

  const totalCompleted = campaigns.reduce((sum, c) => sum + (c.completed_count ?? 0), 0);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: "bg-success text-white",
      completed: "bg-primary text-primary-foreground",
      draft: "",
      scheduled: "bg-warning text-white",
      paused: "bg-muted text-muted-foreground",
    };
    return map[status] ?? "";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-foreground">SMS Campaigns</h1>
            <p className="text-sm text-muted-foreground mt-1">
              <span className="tabular-nums">{campaigns.length}</span> total
              <span className="mx-1.5 text-border">·</span>
              <span className="tabular-nums">{totalCompleted}</span> testimonials collected
            </p>
          </div>
          <Button size="sm" onClick={() => navigate("/dashboard/campaigns/new")}>
            <Plus className="w-4 h-4 mr-1.5" />
            New Campaign
          </Button>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}><CardContent className="p-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
              ))}
            </div>
            <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-border rounded-xl">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-light mb-4">
              <Megaphone className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1.5">No campaigns yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">
              Send your first SMS campaign and get 3x more testimonials than email.
            </p>
            <Button size="sm" onClick={() => navigate("/dashboard/campaigns/new")}>
              <Plus className="w-4 h-4 mr-1.5" />
              Create Campaign
            </Button>
          </div>
        ) : (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
              <Card className="bg-card border border-border rounded-xl shadow-none">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Send className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">SMS sent this month</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-3">
                    <span className="text-2xl font-semibold text-foreground tabular-nums">{totalSent}</span>
                    <span className="text-sm text-muted-foreground tabular-nums">/ {monthlyLimit}</span>
                  </div>
                  <Progress value={(totalSent / monthlyLimit) * 100} className="h-1" />
                </CardContent>
              </Card>

              <Card className="bg-card border border-border rounded-xl shadow-none">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Response rate</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-semibold text-foreground tabular-nums">{avgResponseRate}%</span>
                    {avgResponseRate >= 30 && (
                      <span className="text-[10px] uppercase tracking-wider font-medium text-success">Above avg</span>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border border-border rounded-xl shadow-none">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Testimonials from SMS</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-semibold text-foreground tabular-nums">{totalCompleted}</span>
                    <span className="text-xs text-muted-foreground">collected</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Campaigns Table */}
            <Card className="bg-card border border-border rounded-xl overflow-hidden shadow-none">
              <div className="px-5 py-3 border-b border-border">
                <h2 className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">Your Campaigns</h2>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead className="text-center">Recipients</TableHead>
                    <TableHead className="text-center">Delivered</TableHead>
                    <TableHead className="text-center">Completed</TableHead>
                    <TableHead className="text-center">Response Rate</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map((campaign) => {
                    const responseRate = (campaign.sent_count ?? 0) > 0
                      ? Math.round(((campaign.completed_count ?? 0) / (campaign.sent_count ?? 1)) * 100)
                      : 0;
                    const total = campaign.total_recipients ?? 0;
                    const completed = campaign.completed_count ?? 0;
                    const progressPct = total > 0 ? Math.min(100, (completed / total) * 100) : 0;
                    const inFlight = campaign.status === "active" && completed < total;
                    const scheduledFuture =
                      campaign.status === "scheduled" && campaign.scheduled_at && new Date(campaign.scheduled_at) > new Date();
                    const status = campaign.status ?? "draft";
                    const dotColor =
                      status === "active" ? "bg-success" :
                      status === "completed" ? "bg-primary" :
                      status === "scheduled" ? "bg-warning" :
                      status === "paused" ? "bg-muted-foreground/60" :
                      "bg-muted-foreground/40";
                    return (
                      <TableRow key={campaign.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <div>
                            <div className="font-medium text-foreground">{campaign.name}</div>
                            <div className="text-xs text-muted-foreground tabular-nums mt-0.5">{formatDate(campaign.created_at)}</div>
                            {(inFlight || progressPct > 0) && total > 0 && (
                              <div className="mt-2 max-w-[220px]">
                                <Progress value={progressPct} className="h-1" />
                                <div className="text-xs text-muted-foreground mt-1 tabular-nums">
                                  {completed} / {total} delivered
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center tabular-nums">
                          <div className="flex items-center justify-center gap-1">
                            <Users className="w-3.5 h-3.5 text-muted-foreground" />
                            {campaign.total_recipients ?? 0}
                          </div>
                        </TableCell>
                        <TableCell className="text-center tabular-nums">{campaign.delivered_count ?? 0}</TableCell>
                        <TableCell className="text-center tabular-nums">{campaign.completed_count ?? 0}</TableCell>
                        <TableCell className="text-center tabular-nums">
                          <span className={responseRate >= 30 ? "text-success font-medium" : "text-foreground"}>
                            {responseRate}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${dotColor}`} aria-hidden />
                            {scheduledFuture
                              ? `Scheduled ${new Date(campaign.scheduled_at!).toLocaleDateString()}`
                              : inFlight
                                ? "Sending"
                                : status}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
