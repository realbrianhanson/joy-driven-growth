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
  { path: '/dashboard/settings', label: 'General', icon: Settings },
  { path: '/dashboard/settings/team', label: 'Team', icon: Users },
  { path: '/dashboard/settings/integrations', label: 'Integrations', icon: Plug },
  { path: '/dashboard/settings/billing', label: 'Billing', icon: CreditCard },
  { path: '/dashboard/settings/api', label: 'API', icon: Key },
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
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Dashboard
          </Link>
          <span className="text-xs text-muted-foreground/50">/</span>
          <h1 className="text-[22px] font-semibold text-foreground tracking-tight">Settings</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8 -mt-6 ml-[5.5rem]">Manage your account and preferences</p>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <aside className="w-full md:w-56 flex-shrink-0">
            <nav className="space-y-0.5">
              {settingsNav.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors duration-150",
                    isActive(item.path)
                      ? "bg-primary-light text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="flex-1">{item.label}</span>
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
