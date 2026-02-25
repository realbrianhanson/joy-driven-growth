import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Circle,
  FileText,
  Share2,
  MessageSquare,
  Puzzle,
  CreditCard,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  icon: typeof FileText;
  completed: boolean;
  href: string;
}

export function OnboardingChecklist() {
  const { user } = useAuth();

  const { data: formCount = 0 } = useQuery({
    queryKey: ["onboarding-forms", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from("forms")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      return count || 0;
    },
    enabled: !!user,
  });

  const { data: testimonialCount = 0 } = useQuery({
    queryKey: ["onboarding-testimonials", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from("testimonials")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      return count || 0;
    },
    enabled: !!user,
  });

  const { data: widgetCount = 0 } = useQuery({
    queryKey: ["onboarding-widgets", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from("widgets")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      return count || 0;
    },
    enabled: !!user,
  });

  const { data: integrationCount = 0 } = useQuery({
    queryKey: ["onboarding-integrations", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from("integrations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_connected", true);
      return count || 0;
    },
    enabled: !!user,
  });

  const items: ChecklistItem[] = useMemo(
    () => [
      {
        id: "account",
        label: "Create your account",
        description: "You're here — great start!",
        icon: CheckCircle2,
        completed: true,
        href: "#",
      },
      {
        id: "form",
        label: "Create your first collection form",
        description: "Design a form to gather testimonials",
        icon: FileText,
        completed: formCount > 0,
        href: "/dashboard/forms/new/edit",
      },
      {
        id: "share",
        label: "Share your form link with a client",
        description: "Send the link and start collecting",
        icon: Share2,
        completed: testimonialCount > 0, // implies form was shared
        href: "/dashboard/forms",
      },
      {
        id: "approve",
        label: "Approve your first testimonial",
        description: "Review and publish incoming feedback",
        icon: MessageSquare,
        completed: testimonialCount > 0,
        href: "/dashboard/testimonials",
      },
      {
        id: "widget",
        label: "Add a widget to your website",
        description: "Showcase social proof on your site",
        icon: Puzzle,
        completed: widgetCount > 0,
        href: "/dashboard/widgets/new",
      },
      {
        id: "stripe",
        label: "Connect Stripe to track revenue",
        description: "See exactly how testimonials drive sales",
        icon: CreditCard,
        completed: integrationCount > 0,
        href: "/dashboard/settings/integrations",
      },
    ],
    [formCount, testimonialCount, widgetCount, integrationCount]
  );

  const completedCount = items.filter((i) => i.completed).length;
  const allDone = completedCount === items.length;

  if (allDone) return null;

  const progress = Math.round((completedCount / items.length) * 100);

  return (
    <Card className="mb-6 border-primary/20 bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Get started
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {completedCount}/{items.length} complete
          </span>
        </div>
        <Progress value={progress} className="h-1.5 mt-2" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {items.map((item) => (
            <Link
              key={item.id}
              to={item.completed ? "#" : item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                item.completed
                  ? "opacity-60"
                  : "hover:bg-muted cursor-pointer"
              }`}
            >
              {item.completed ? (
                <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-border shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    item.completed
                      ? "text-muted-foreground line-through"
                      : "text-foreground"
                  }`}
                >
                  {item.label}
                </p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
              {!item.completed && (
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
