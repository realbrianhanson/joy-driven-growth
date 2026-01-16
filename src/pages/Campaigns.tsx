import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Send, Users, MessageSquare, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Campaign {
  id: string;
  name: string;
  recipients: number;
  sentDate: string;
  delivered: number;
  opened: number;
  completed: number;
  responseRate: number;
  status: "sent" | "scheduled" | "draft";
}

const mockCampaigns: Campaign[] = [
  {
    id: "1",
    name: "Q4 Customer Check-in",
    recipients: 150,
    sentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    delivered: 147,
    opened: 89,
    completed: 42,
    responseRate: 28,
    status: "sent",
  },
  {
    id: "2",
    name: "Product Launch Feedback",
    recipients: 75,
    sentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    delivered: 74,
    opened: 52,
    completed: 31,
    responseRate: 41,
    status: "sent",
  },
  {
    id: "3",
    name: "Enterprise Client Stories",
    recipients: 25,
    sentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    delivered: 0,
    opened: 0,
    completed: 0,
    responseRate: 0,
    status: "scheduled",
  },
];

export default function Campaigns() {
  const navigate = useNavigate();
  const [campaigns] = useState<Campaign[]>(mockCampaigns);

  const totalSent = 225;
  const monthlyLimit = 500;
  const testimonialCount = 73;
  const avgResponseRate = 42;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    if (date > now) {
      return `Scheduled: ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="p-0 h-auto"
              >
                <ArrowLeft className="w-5 h-5 mr-1" />
                Back
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              SMS Campaigns <span>📱</span>
            </h1>
            <p className="text-muted-foreground">
              98% open rate. 3x more testimonials.
            </p>
          </div>
          <Button
            className="gradient-sunny text-white border-0 shadow-warm"
            onClick={() => navigate("/dashboard/campaigns/new")}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-card border border-border rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Send className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  SMS sent this month
                </span>
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
                <div className="w-10 h-10 rounded-full bg-emerald/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  Response rate
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">{avgResponseRate}%</span>
                <Badge className="bg-emerald-light text-emerald border-0">
                  Above average! 🎉
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border border-border rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-gold" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  Testimonials from SMS
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-foreground">{testimonialCount}</span>
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
                <TableHead className="text-center">Opened</TableHead>
                <TableHead className="text-center">Completed</TableHead>
                <TableHead className="text-center">Response Rate</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow
                  key={campaign.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/dashboard/campaigns/${campaign.id}`)}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium text-foreground">{campaign.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(campaign.sentDate)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      {campaign.recipients}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{campaign.delivered}</TableCell>
                  <TableCell className="text-center">{campaign.opened}</TableCell>
                  <TableCell className="text-center">{campaign.completed}</TableCell>
                  <TableCell className="text-center">
                    <span className={campaign.responseRate >= 30 ? "text-emerald font-medium" : ""}>
                      {campaign.responseRate}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={campaign.status === "sent" ? "default" : "secondary"}
                      className={
                        campaign.status === "sent"
                          ? "bg-emerald text-white"
                          : campaign.status === "scheduled"
                          ? "bg-amber text-white"
                          : ""
                      }
                    >
                      {campaign.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
