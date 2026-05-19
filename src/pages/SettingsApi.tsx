import { Key } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SettingsLayout from "@/components/settings/SettingsLayout";

const SettingsApi = () => {
  return (
    <SettingsLayout>
      <Card className="bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-primary" />
                API access
              </CardTitle>
              <CardDescription>Submit testimonials and pull analytics programmatically</CardDescription>
            </div>
            <Badge variant="secondary">Coming soon</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            We're building a clean key-based API for programmatic submission and analytics. If you need this today, reach out and we'll prioritize it.
          </p>
          <p className="text-xs text-muted-foreground">
            In the meantime, testimonials can be submitted via any published form at{" "}
            <code className="px-1.5 py-0.5 rounded bg-muted text-foreground">/collect/&lt;form-slug&gt;</code>.
          </p>
        </CardContent>
      </Card>
    </SettingsLayout>
  );
};

export default SettingsApi;
