import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type WorkspaceRole = "owner" | "admin" | "member";

/**
 * The account the signed-in user works in.
 *
 * An owner works in their own account. A team member works in the account of
 * the person who invited them. One team per member is assumed.
 *
 * Team roles come from the database rules: "admin" can add, edit and approve,
 * and "member" can only view.
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

  const { data: memberRole } = useQuery({
    queryKey: ["workspace-role", user?.id, teamOwnerId],
    enabled: !!user && isTeamMember,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<WorkspaceRole> => {
      const { data, error } = await supabase
        .from("team_members")
        .select("role")
        .eq("owner_user_id", teamOwnerId!)
        .eq("member_user_id", user!.id)
        .maybeSingle();
      if (error) console.error("team role error:", error);
      return data?.role === "admin" || data?.role === "owner" ? (data.role as WorkspaceRole) : "member";
    },
  });

  const role: WorkspaceRole = isTeamMember ? (memberRole ?? "member") : "owner";

  return {
    workspaceOwnerId,
    isTeamMember,
    isOwner: !isTeamMember,
    role,
    /** False for a view-only team member. The database refuses their changes. */
    canEdit: !isTeamMember || memberRole === undefined || role !== "member",
    isLoading,
  };
};
