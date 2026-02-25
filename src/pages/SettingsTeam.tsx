import { Users, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SettingsLayout from "@/components/settings/SettingsLayout";

const SettingsTeam = () => {
  return (
    <SettingsLayout>
      <div className="space-y-6">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Team Management
              <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
            </CardTitle>
            <CardDescription>Invite team members and manage roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mb-6">
                <Users className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Team features coming soon</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                We're building powerful team collaboration features including role-based access, 
                team invitations, and shared workspaces. Stay tuned!
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                Expected Q2 2026
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
};

export default SettingsTeam;
