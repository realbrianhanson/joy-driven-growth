import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { 
  Settings, 
  Users, 
  Plug, 
  CreditCard, 
  Key,
  ArrowLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const settingsNav = [
  { path: '/dashboard/settings', label: 'General', icon: Settings, emoji: '⚙️' },
  { path: '/dashboard/settings/team', label: 'Team', icon: Users, emoji: '👥' },
  { path: '/dashboard/settings/integrations', label: 'Integrations', icon: Plug, emoji: '🔌' },
  { path: '/dashboard/settings/billing', label: 'Billing', icon: CreditCard, emoji: '💳' },
  { path: '/dashboard/settings/api', label: 'API', icon: Key, emoji: '🔑' },
];

interface SettingsLayoutProps {
  children: React.ReactNode;
}

const SettingsLayout = ({ children }: SettingsLayoutProps) => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/dashboard/settings') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/dashboard">
            <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-64 flex-shrink-0">
            <nav className="space-y-1">
              {settingsNav.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all group",
                    isActive(item.path)
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "hover:bg-secondary text-foreground"
                  )}
                >
                  <span className="text-lg">{item.emoji}</span>
                  <span className="flex-1 font-medium">{item.label}</span>
                  <ChevronRight className={cn(
                    "w-4 h-4 transition-transform",
                    isActive(item.path) ? "text-primary" : "text-muted-foreground group-hover:translate-x-1"
                  )} />
                </Link>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SettingsLayout;
