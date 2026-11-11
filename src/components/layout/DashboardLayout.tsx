import { Suspense, useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  ChevronsUpDown,
  Eye,
  FileText,
  Home,
  LayoutGrid,
  Loader2,
  LogOut,
  Menu,
  MessageSquareQuote,
  PanelsTopLeft,
  PenLine,
  Send,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspace } from "@/hooks/use-workspace";
import { useWorkspaceRealtime } from "@/hooks/use-workspace-realtime";
import { takeReturnPath } from "@/lib/return-path";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Logo } from "@/components/shared/Logo";
import { PersonAvatar } from "@/components/shared/PersonAvatar";

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  badge?: "pending";
}

const NAV: { section: string | null; items: NavItem[] }[] = [
  {
    section: null,
    items: [
      { label: "Home", icon: Home, path: "/dashboard" },
      { label: "Testimonials", icon: MessageSquareQuote, path: "/dashboard/testimonials", badge: "pending" },
    ],
  },
  {
    section: "Collect",
    items: [
      { label: "Forms", icon: FileText, path: "/dashboard/forms" },
      { label: "Text campaigns", icon: Send, path: "/dashboard/campaigns" },
    ],
  },
  {
    section: "Showcase",
    items: [
      { label: "Walls", icon: PanelsTopLeft, path: "/dashboard/walls" },
      { label: "Widgets", icon: LayoutGrid, path: "/dashboard/widgets" },
      { label: "Content", icon: PenLine, path: "/dashboard/content" },
    ],
  },
  {
    section: "Measure",
    items: [{ label: "Results", icon: BarChart3, path: "/dashboard/analytics" }],
  },
];

function usePendingCount() {
  const { workspaceOwnerId } = useWorkspace();
  const { data } = useQuery({
    queryKey: ["testimonials", workspaceOwnerId, "pending-count"],
    enabled: !!workspaceOwnerId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("testimonials")
        .select("id", { count: "exact", head: true })
        .eq("user_id", workspaceOwnerId!)
        .eq("status", "pending");
      if (error) throw error;
      return count ?? 0;
    },
  });
  return data ?? 0;
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile, user } = useAuth();
  const pending = usePendingCount();

  const isActive = (path: string) =>
    path === "/dashboard" ? location.pathname === "/dashboard" : location.pathname.startsWith(path);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  const displayName = profile?.full_name?.trim() || profile?.email?.split("@")[0] || "Your account";
  const email = profile?.email ?? user?.email ?? "";

  const linkClass = (active: boolean) =>
    cn(
      "group flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
      active
        ? "bg-primary text-primary-foreground font-medium"
        : "text-foreground/75 hover:bg-accent hover:text-foreground",
    );

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-16 shrink-0 items-center px-5">
        <Link to="/dashboard" onClick={onNavigate} aria-label="Happy Client home">
          <Logo size="sm" />
        </Link>
      </div>

      <nav aria-label="Main" className="flex-1 space-y-6 overflow-y-auto px-3 py-2 scrollbar-thin">
        {NAV.map((group, i) => (
          <div key={group.section ?? i}>
            {group.section && <p className="eyebrow mb-1.5 px-3">{group.section}</p>}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={linkClass(active)}
                    >
                      <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge === "pending" && pending > 0 && (
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[0.6875rem] font-semibold tabular-nums leading-none",
                            active ? "bg-gold text-foreground" : "bg-gold-light text-gold-deep",
                          )}
                          aria-label={`${pending} waiting for review`}
                        >
                          {pending > 99 ? "99+" : pending}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 space-y-1 border-t border-sidebar-border p-3">
        <Link
          to="/dashboard/settings"
          onClick={onNavigate}
          aria-current={isActive("/dashboard/settings") ? "page" : undefined}
          className={linkClass(isActive("/dashboard/settings"))}
        >
          <Settings className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          Settings
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent"
            >
              <PersonAvatar name={displayName} src={profile?.avatar_url} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">{displayName}</span>
                <span className="block truncate text-xs text-muted-foreground">{email}</span>
              </span>
              <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-56">
            <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/dashboard/settings" onClick={onNavigate}>
                <Settings className="mr-2 h-4 w-4" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

const ContentLoader = () => (
  <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-label="Loading">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  </div>
);

/** The signed-in frame: sidebar on desktop, a top bar with a drawer on phones. */
export default function DashboardLayout() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { canEdit } = useWorkspace();
  useWorkspaceRealtime();

  // Finish a trip that a sign-up interrupted, such as accepting a team invite.
  useEffect(() => {
    const path = takeReturnPath();
    if (path && !path.startsWith("/dashboard")) navigate(path, { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-sidebar-border md:block">
        <SidebarContent />
      </aside>

      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-card/95 px-3 backdrop-blur md:hidden">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <SidebarContent onNavigate={() => setSheetOpen(false)} />
          </SheetContent>
        </Sheet>
        <Link to="/dashboard" aria-label="Happy Client home">
          <Logo size="sm" />
        </Link>
      </header>

      <main id="main" className="md:pl-60">
        {!canEdit && (
          <p role="status" className="flex items-center justify-center gap-2 border-b border-border bg-muted/60 px-4 py-2 text-center text-sm text-foreground">
            <Eye className="h-4 w-4 shrink-0 text-muted-foreground" />
            You have view-only access to this account. Ask the owner for the Admin role to make changes.
          </p>
        )}
        <ErrorBoundary resetKey={location.pathname}>
          <Suspense fallback={<ContentLoader />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}
