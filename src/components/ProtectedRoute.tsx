import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

/** Sends signed-out visitors to sign in, then back to the page they asked for. */
export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background" role="status" aria-label="Loading">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    const target = `${location.pathname}${location.search}`;
    const query = target && target !== "/dashboard" ? `?redirect=${encodeURIComponent(target)}` : "";
    return <Navigate to={`/login${query}`} replace />;
  }

  return <>{children}</>;
};
