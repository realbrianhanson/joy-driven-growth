import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { CreditCard, Key, Plug, Settings, Users } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/shared/PageHeader";
import { cn } from "@/lib/utils";

const NAV = [
  { path: "/dashboard/settings", label: "General", icon: Settings },
  { path: "/dashboard/settings/team", label: "Team", icon: Users },
  { path: "/dashboard/settings/billing", label: "Plan and billing", icon: CreditCard },
  { path: "/dashboard/settings/integrations", label: "Connections", icon: Plug },
  { path: "/dashboard/settings/api", label: "API keys", icon: Key },
];

const SettingsLayout = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const isActive = (path: string) => (path === "/dashboard/settings" ? pathname === path : pathname.startsWith(path));

  return (
    <PageContainer>
      <PageHeader title="Settings" description="Your account, your team, and your plan." />
      <div className="flex flex-col gap-8 md:flex-row">
        <nav aria-label="Settings" className="-mx-1 flex shrink-0 gap-1 overflow-x-auto px-1 pb-1 md:mx-0 md:w-52 md:flex-col md:overflow-visible md:px-0 md:pb-0">
          {NAV.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-10 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 text-sm transition-colors",
                  active ? "bg-primary font-medium text-primary-foreground" : "text-foreground/75 hover:bg-accent hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </PageContainer>
  );
};

export default SettingsLayout;
