import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  CreditCard, Check, Zap, Rocket, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import SettingsLayout from "@/components/settings/SettingsLayout";

const SettingsBilling = () => {
  const { user } = useAuth();

  const { data: testimonialCount = 0, isLoading: loadingT } = useQuery({
    queryKey: ['billing-testimonials', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from('testimonials')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  const { data: smsCount = 0, isLoading: loadingS } = useQuery({
    queryKey: ['billing-sms', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data, error } = await supabase
        .from('campaigns')
        .select('sent_count')
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString());
      if (error) throw error;
      return (data || []).reduce((sum, c) => sum + (c.sent_count || 0), 0);
    },
    enabled: !!user,
  });

  const { data: aiCount = 0, isLoading: loadingA } = useQuery({
    queryKey: ['billing-ai', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from('generated_content')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  const isLoading = loadingT || loadingS || loadingA;

  return (
    <SettingsLayout>
      <div className="space-y-6">
        {/* Current Plan */}
        <Card className="bg-card border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />Current Plan
                </CardTitle>
                <CardDescription>Your subscription and usage</CardDescription>
              </div>
              <Badge className="gradient-sunny text-white text-lg px-4 py-1">Starter — Free</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold text-foreground">$0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-2">
                  {['25 testimonials', '2 forms', '1 widget', 'Basic analytics'].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="w-4 h-4 text-emerald" />{f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-foreground mb-3">Usage This Month</h3>
                {isLoading ? (
                  <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
                ) : (
                  <>
                    {[
                      { label: 'Testimonials', used: testimonialCount, limit: 25 },
                      { label: 'SMS Sent', used: smsCount, limit: 0 },
                      { label: 'AI Generations', used: aiCount, limit: 10 },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-foreground">{item.label}</span>
                          <span className="text-muted-foreground">
                            {item.used} / {item.limit === 0 ? '—' : item.limit}
                          </span>
                        </div>
                        <Progress
                          value={item.limit > 0 ? Math.min((item.used / item.limit) * 100, 100) : 0}
                          className="h-2"
                        />
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upgrade CTA */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary" />Upgrade to Pro
            </CardTitle>
            <CardDescription>Unlock unlimited testimonials, SMS campaigns, and more</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-6 rounded-xl border-2 border-primary/20 bg-primary/5">
              <div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-foreground">$49</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-1">
                  {['Unlimited testimonials', '100 SMS/mo', 'AI content studio', 'Revenue tracking'].map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="w-3 h-3 text-emerald" />{f}
                    </li>
                  ))}
                </ul>
              </div>
              <Button className="gradient-sunny text-white shadow-warm" onClick={() => window.open('#', '_blank')}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
};

export default SettingsBilling;
