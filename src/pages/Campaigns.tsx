import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Send, TrendingUp, MessageSquare, Users, Megaphone } from "lucide-react";
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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { MOCK_CAMPAIGNS } from "@/data/mock/campaigns";

export default function Campaigns() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDemoMode } = useDemoMode();

  const { data: realCampaigns, isLoading } = useQuery({
    queryKey: ["campaigns", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !isDemoMode,
  });

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="p-0 h-auto">
                <ArrowLeft className="w-5 h-5 mr-1" />
                Back
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-foreground">SMS Campaigns</h1>
            <p className="text-muted-foreground">98% open rate. 3x more testimonials.</p>
          </div>
          <Button onClick={() => navigate("/dashboard/campaigns/new")}>
            <Plus className="w-4 h-4 mr-2" />
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
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-muted mb-4">
              <Megaphone className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-6">
              Send your first SMS campaign and get 3x more testimonials than email.
            </p>
            <Button onClick={() => navigate("/dashboard/campaigns/new")}>
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </div>
        ) : (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="bg-card border border-border rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Send className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">SMS sent this month</span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-bold text-foreground">{totalSent}</span>
                    <span className="text-muted-foreground">/ {monthlyLimit}</span>
                  </div>
                  <Progress value={(totalSent / monthlyLimit) * 100} className="h-2" />
                </CardContent>
              </Card>

              <Card className="bg-card border border-border rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-success" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">Response rate</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-foreground">{avgResponseRate}%</span>
                    {avgResponseRate >= 30 && (
                      <Badge className="bg-success/10 text-success border-0">Above average! 🎉</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border border-border rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-warning" />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">Testimonials from SMS</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-foreground">{totalCompleted}</span>
                    <span className="text-sm text-muted-foreground">collected</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Campaigns Table */}
            <Card className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">Your Campaigns</h2>
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
                    return (
                      <TableRow key={campaign.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <div>
                            <div className="font-medium text-foreground">{campaign.name}</div>
                            <div className="text-sm text-muted-foreground">{formatDate(campaign.created_at)}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            {campaign.total_recipients ?? 0}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{campaign.delivered_count ?? 0}</TableCell>
                        <TableCell className="text-center">{campaign.completed_count ?? 0}</TableCell>
                        <TableCell className="text-center">
                          <span className={responseRate >= 30 ? "text-success font-medium" : ""}>
                            {responseRate}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className={getStatusBadge(campaign.status ?? "draft")}>
                            {campaign.status ?? "draft"}
                          </Badge>
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
