import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Copy, ExternalLink, MoreHorizontal, Pencil, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface Form {
  id: string;
  name: string;
  slug: string;
  status: "active" | "inactive";
  types: ("text" | "video" | "audio")[];
  aiInterview: boolean;
  responses: number;
  completionRate: number;
  lastResponse?: string;
}

const mockForms: Form[] = [
  {
    id: "1",
    name: "Customer Success Story",
    slug: "customer-success",
    status: "active",
    types: ["text", "video"],
    aiInterview: true,
    responses: 47,
    completionRate: 72,
    lastResponse: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    name: "Quick Feedback",
    slug: "quick-feedback",
    status: "active",
    types: ["text"],
    aiInterview: false,
    responses: 128,
    completionRate: 89,
    lastResponse: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "3",
    name: "Video Testimonials",
    slug: "video-testimonials",
    status: "active",
    types: ["video", "audio"],
    aiInterview: true,
    responses: 23,
    completionRate: 45,
    lastResponse: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "4",
    name: "Case Study Collection",
    slug: "case-study",
    status: "inactive",
    types: ["text", "video", "audio"],
    aiInterview: false,
    responses: 8,
    completionRate: 61,
  },
];

export default function Forms() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [forms] = useState<Form[]>(mockForms);

  const typeIcons = {
    text: "📝",
    video: "🎥",
    audio: "🎤",
  };

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return "No responses yet";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/collect/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied!", description: url });
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
              Collection Forms <span>📝</span>
            </h1>
            <p className="text-muted-foreground">
              Create ways to collect testimonials
            </p>
          </div>
          <Button
            className="gradient-sunny text-white border-0 shadow-warm"
            onClick={() => navigate("/dashboard/forms/new/edit")}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Form
          </Button>
        </div>

        {/* Forms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form, index) => (
            <Card
              key={form.id}
              className="card-hover bg-card border border-border hover:border-border-hover rounded-2xl animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {form.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {form.types.map((type) => (
                        <span key={type} className="text-lg">{typeIcons[type]}</span>
                      ))}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/dashboard/forms/${form.id}/edit`)}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/dashboard/forms/${form.id}/responses`)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View responses
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => copyLink(form.slug)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy link
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Status & AI Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <Badge
                    variant={form.status === "active" ? "default" : "secondary"}
                    className={form.status === "active" ? "bg-emerald text-white" : ""}
                  >
                    {form.status === "active" ? "🟢" : "⚫"} {form.status}
                  </Badge>
                  {form.aiInterview && (
                    <Badge className="bg-primary/10 text-primary border-0">
                      🤖 AI Interview
                    </Badge>
                  )}
                </div>

                {/* Stats */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Responses</span>
                    <span className="font-medium text-foreground">{form.responses}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Completion rate</span>
                    <span className="font-medium text-foreground">{form.completionRate}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full gradient-sunny transition-all"
                      style={{ width: `${form.completionRate}%` }}
                    />
                  </div>
                </div>

                {/* Last response */}
                <div className="text-xs text-muted-foreground mb-4">
                  Last response: {formatTimeAgo(form.lastResponse)}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/dashboard/forms/${form.id}/edit`)}
                  >
                    <Pencil className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => copyLink(form.slug)}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Create New Card */}
          <Card
            className="border-2 border-dashed border-border bg-card/50 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all rounded-2xl"
            onClick={() => navigate("/dashboard/forms/new/edit")}
          >
            <CardContent className="p-6 flex flex-col items-center justify-center h-full min-h-[300px]">
              <div className="w-16 h-16 rounded-full gradient-sunny flex items-center justify-center mb-4 shadow-warm">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Create New Form</h3>
              <p className="text-sm text-muted-foreground text-center">
                Design a custom form to collect testimonials
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
