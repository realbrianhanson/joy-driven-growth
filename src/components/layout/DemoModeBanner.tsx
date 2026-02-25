import { useState } from "react";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { X } from "lucide-react";

export function DemoModeBanner() {
  const { isDemoMode, toggleDemoMode } = useDemoMode();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [liveDismissed, setLiveDismissed] = useState(() => {
    return localStorage.getItem("live-banner-dismissed") === "true";
  });

  const handleToggle = () => {
    if (isDemoMode) {
      // Switching to live — confirm first
      setConfirmOpen(true);
    } else {
      // Switching back to demo — no confirmation needed
      toggleDemoMode();
      setLiveDismissed(false);
      localStorage.removeItem("live-banner-dismissed");
    }
  };

  const confirmSwitch = () => {
    toggleDemoMode();
    setConfirmOpen(false);
  };

  const dismissLive = () => {
    setLiveDismissed(true);
    localStorage.setItem("live-banner-dismissed", "true");
  };

  // Demo mode banner
  if (isDemoMode) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-50 h-10 flex items-center justify-between px-4 md:px-6 border-b"
          style={{ backgroundColor: "hsl(33 100% 96%)", borderColor: "hsl(30 93% 83%)" }}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: "hsl(25 95% 53%)" }} />
            <span className="text-sm font-medium" style={{ color: "hsl(21 78% 26%)" }}>
              Demo Mode — Showing sample data
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium" style={{ color: "hsl(21 78% 26%)" }}>Use Real Data</span>
            <Switch checked={false} onCheckedChange={handleToggle} />
          </div>
        </div>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Switch to live data?</AlertDialogTitle>
              <AlertDialogDescription>
                Demo data will be hidden. Your real data will be shown.
                You can switch back to demo mode at any time in Settings.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Demo Mode</AlertDialogCancel>
              <AlertDialogAction onClick={confirmSwitch}>Switch to Live Data</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Live mode banner (dismissible)
  if (liveDismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-10 flex items-center justify-between px-4 md:px-6 border-b"
      style={{ backgroundColor: "hsl(138 76% 97%)", borderColor: "hsl(142 69% 82%)" }}
    >
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "hsl(142 71% 45%)" }} />
        <span className="text-sm font-medium" style={{ color: "hsl(143 64% 24%)" }}>
          Live Mode — Connected to real data
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-7"
          onClick={handleToggle}
        >
          Switch to Demo
        </Button>
        <button onClick={dismissLive} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
