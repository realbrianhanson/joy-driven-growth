import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

/**
 * Resolves the "active workspace owner" for the current user.
 * - If the user owns their account (no team membership), this is their own id.
 * - If the user is a member of someone else's team, this is that owner's id.
 * One team per member is assumed for now.
 */
export const useWorkspace = () => {
  const { user } = useAuth();

  const { data: teamOwnerId, isLoading } = useQuery({
    queryKey: ["workspace-owner", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<string | null> => {
      const { data, error } = await supabase.rpc("get_my_team_owner");
      if (error) {
        console.error("get_my_team_owner error:", error);
        return null;
      }
      return (data as string | null) ?? null;
    },
  });

  const workspaceOwnerId = teamOwnerId ?? user?.id ?? null;
  const isTeamMember = !!teamOwnerId && teamOwnerId !== user?.id;

  return {
    workspaceOwnerId,
    isTeamMember,
    isOwner: !isTeamMember,
    isLoading,
  };
};
