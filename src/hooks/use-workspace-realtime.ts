import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";

/**
 * Keeps the signed-in app live. When a client submits a testimonial or a sale
 * is logged, the lists refresh and a toast points to the new item.
 */
export function useWorkspaceRealtime() {
  const { workspaceOwnerId } = useWorkspace();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (!workspaceOwnerId) return;

    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ["testimonials"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    };

    const channel = supabase
      .channel(`workspace-${workspaceOwnerId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "testimonials", filter: `user_id=eq.${workspaceOwnerId}` },
        (payload) => {
          refresh();
          const row = payload.new as { id?: string; author_name?: string; source?: string | null };
          // Rows the owner adds by hand already show their own confirmation.
          if (!row?.id || row.source === "manual" || row.source === "import") return;
          toast("New testimonial", {
            description: row.author_name ? `From ${row.author_name}` : undefined,
            action: { label: "Review", onClick: () => navigate(`/dashboard/testimonials/${row.id}`) },
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "revenue_events", filter: `user_id=eq.${workspaceOwnerId}` },
        refresh,
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [workspaceOwnerId, queryClient, navigate]);
}
