import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Testimonials", icon: MessageSquare, path: "/dashboard/testimonials" },
  { label: "Forms", icon: FileText, path: "/dashboard/forms" },
  { label: "Campaigns", icon: Megaphone, path: "/dashboard/campaigns" },
  { label: "Widgets", icon: Puzzle, path: "/dashboard/widgets" },
  { label: "Wall of Love", icon: Heart, path: "/dashboard/walls" },
  { label: "Content Studio", icon: Palette, path: "/dashboard/content" },
  { label: "Analytics", icon: BarChart3, path: "/dashboard/analytics" },
  { label: "Chrome Extension", icon: Chrome, path: "/dashboard/extension" },
  { label: "Agency", icon: Users, path: "/dashboard/agency" },
];

const settingsItems = [
  { label: "Settings", icon: Settings, path: "/dashboard/settings" },
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

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 pb-4">
        <Link to="/dashboard" className="flex items-center gap-2" onClick={onNavigate}>
          <span className="text-2xl">💛</span>
          <span className="font-bold text-lg text-foreground">Happy Client</span>
        </Link>
        {profile?.company_name && (
          <p className="text-xs text-muted-foreground mt-1 ml-9 truncate">{profile.company_name}</p>
        )}
      </div>

      <Separator />

      {/* Nav */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive(item.path)
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>

        <Separator className="my-4" />

        <nav className="space-y-1">
          {settingsItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive(item.path)
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>
      </ScrollArea>

      {/* Logout */}
      <div className="p-3 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all w-full"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 border-r border-border bg-card flex-col fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 border-b border-border bg-card flex items-center px-4">
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
          <span className="text-lg">💛</span>
          <span className="font-bold text-foreground">Happy Client</span>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-60 mt-14 md:mt-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
