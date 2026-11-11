import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "./use-workspace";
import type { Database } from "@/integrations/supabase/types";

export type Wall = Database["public"]["Tables"]["walls"]["Row"];
type WallInsert = Database["public"]["Tables"]["walls"]["Insert"];
type WallUpdate = Database["public"]["Tables"]["walls"]["Update"];

export const useWalls = () => {
  const { workspaceOwnerId } = useWorkspace();
  return useQuery({
    queryKey: ["walls", workspaceOwnerId],
    enabled: !!workspaceOwnerId,
    queryFn: async (): Promise<Wall[]> => {
      const { data, error } = await supabase
        .from("walls")
        .select("*")
        .eq("user_id", workspaceOwnerId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
};

export const useWall = (id: string) =>
  useQuery({
    queryKey: ["wall", id],
    enabled: !!id,
    queryFn: async (): Promise<Wall> => {
      const { data, error } = await supabase.from("walls").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

function useInvalidateWalls() {
  const queryClient = useQueryClient();
  return (id?: string) => {
    void queryClient.invalidateQueries({ queryKey: ["walls"] });
    void queryClient.invalidateQueries({ queryKey: ["showcase-counts"] });
    if (id) void queryClient.invalidateQueries({ queryKey: ["wall", id] });
  };
}

export const useCreateWall = () => {
  const { workspaceOwnerId } = useWorkspace();
  const invalidate = useInvalidateWalls();
  return useMutation({
    mutationFn: async (wall: Omit<WallInsert, "user_id">) => {
      if (!workspaceOwnerId) throw new Error("Your workspace is still loading. Try again in a moment.");
      const { data, error } = await supabase.from("walls").insert({ ...wall, user_id: workspaceOwnerId }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidate(),
  });
};

export const useUpdateWall = () => {
  const invalidate = useInvalidateWalls();
  return useMutation({
    mutationFn: async ({ id, ...updates }: WallUpdate & { id: string }) => {
      const { data, error } = await supabase.from("walls").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => invalidate(data.id),
  });
};

export const useDeleteWall = () => {
  const invalidate = useInvalidateWalls();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("walls").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });
};
