import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { DemoModeBanner } from "@/components/layout/DemoModeBanner";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Megaphone,
  Puzzle,
  Heart,
  Palette,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  Chrome,
  Users,
} from "lucide-react";

const mainNav = [
  { section: "Collect", items: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { label: "Testimonials", icon: MessageSquare, path: "/dashboard/testimonials" },
    { label: "Forms", icon: FileText, path: "/dashboard/forms" },
    { label: "Campaigns", icon: Megaphone, path: "/dashboard/campaigns" },
  ]},
  { section: "Showcase", items: [
    { label: "Widgets", icon: Puzzle, path: "/dashboard/widgets" },
    { label: "Wall of Love", icon: Heart, path: "/dashboard/walls" },
    { label: "Content Studio", icon: Palette, path: "/dashboard/content" },
  ]},
  { section: "Measure", items: [
    { label: "Analytics", icon: BarChart3, path: "/dashboard/analytics" },
  ]},
  { section: "Tools", items: [
    { label: "Chrome Extension", icon: Chrome, path: "/dashboard/extension" },
    { label: "Agency", icon: Users, path: "/dashboard/agency" },
  ]},
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();

  const isActive = (path: string) => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : profile?.email?.slice(0, 2).toUpperCase() ?? "U";

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-5 border-b border-border shrink-0">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground text-xs font-bold">T</span>
        </div>
        <span className="font-semibold text-foreground">Testimonial</span>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-5">
          {mainNav.map((group) => (
            <div key={group.section}>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-1 px-3">
                {group.section}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 h-9 text-sm font-medium transition-colors duration-150",
                      isActive(item.path)
                        ? "bg-primary-light text-primary font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Bottom */}
      <div className="border-t border-border p-3 space-y-1">
        <Link
          to="/dashboard/settings"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 h-9 text-sm font-medium transition-colors duration-150",
            isActive("/dashboard/settings")
              ? "bg-primary-light text-primary font-semibold"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          Settings
        </Link>

        <Separator className="my-2" />

        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary-light text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {profile?.full_name || "User"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {profile?.email}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-muted-foreground hover:text-destructive transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { isDemoMode } = useDemoMode();

  // Banner is 40px tall; offset everything when visible
  const bannerH = isDemoMode || !localStorage.getItem("live-banner-dismissed") ? "h-10" : "h-0";

  return (
    <div className="min-h-screen flex w-full bg-background">
      <DemoModeBanner />

      {/* Desktop sidebar */}
      <aside className={`hidden md:flex w-60 shrink-0 border-r border-border bg-card flex-col fixed left-0 z-30 top-10 bottom-0`}>
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-10 left-0 right-0 z-40 h-14 border-b border-border bg-card flex items-center px-4">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-60">
            <SidebarContent onNavigate={() => setSheetOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2 ml-2">
          <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-[10px] font-bold">T</span>
          </div>
          <span className="font-semibold text-foreground text-sm">Testimonial</span>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-60 mt-24 md:mt-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
