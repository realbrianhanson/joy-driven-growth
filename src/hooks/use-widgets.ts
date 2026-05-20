import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { useWorkspace } from "./use-workspace";
import { Database } from "@/integrations/supabase/types";

type Widget = Database["public"]["Tables"]["widgets"]["Row"];
type WidgetInsert = Database["public"]["Tables"]["widgets"]["Insert"];
type WidgetUpdate = Database["public"]["Tables"]["widgets"]["Update"];

export const useWidgets = () => {
  const { workspaceOwnerId } = useWorkspace();

  return useQuery({
    queryKey: ["widgets", workspaceOwnerId],
    queryFn: async () => {
      if (!workspaceOwnerId) return [];

      const { data, error } = await supabase
        .from("widgets")
        .select("*")
        .eq("user_id", workspaceOwnerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Widget[];
    },
    enabled: !!workspaceOwnerId,
  });
};

export const useWidget = (id: string) => {
  return useQuery({
    queryKey: ["widget", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("widgets")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Widget;
    },
    enabled: !!id,
  });
};

export const useCreateWidget = () => {
  const queryClient = useQueryClient();
  const { workspaceOwnerId } = useWorkspace();

  return useMutation({
    mutationFn: async (widget: Omit<WidgetInsert, "user_id">) => {
      if (!workspaceOwnerId) throw new Error("Workspace not ready");

      const { data, error } = await supabase
        .from("widgets")
        .insert({ ...widget, user_id: workspaceOwnerId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["widgets"] });
    },
  });
};

export const useUpdateWidget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: WidgetUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("widgets")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["widgets"] });
      queryClient.invalidateQueries({ queryKey: ["widget", data.id] });
    },
  });
};

export const useDeleteWidget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("widgets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["widgets"] });
    },
  });
};
