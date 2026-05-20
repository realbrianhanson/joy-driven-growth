import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { useWorkspace } from "./use-workspace";
import { Database } from "@/integrations/supabase/types";

type Form = Database["public"]["Tables"]["forms"]["Row"];
type FormInsert = Database["public"]["Tables"]["forms"]["Insert"];
type FormUpdate = Database["public"]["Tables"]["forms"]["Update"];

export const useForms = () => {
  const { workspaceOwnerId } = useWorkspace();

  return useQuery({
    queryKey: ["forms", workspaceOwnerId],
    queryFn: async () => {
      if (!workspaceOwnerId) return [];

      const { data, error } = await supabase
        .from("forms")
        .select("*")
        .eq("user_id", workspaceOwnerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Form[];
    },
    enabled: !!workspaceOwnerId,
  });
};

export const useForm = (id: string) => {
  return useQuery({
    queryKey: ["form", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forms")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Form;
    },
    enabled: !!id,
  });
};

export const useFormBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["form-slug", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("forms")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      if (error) throw error;
      return data as Form | null;
    },
    enabled: !!slug,
  });
};

export const useCreateForm = () => {
  const queryClient = useQueryClient();
  const { workspaceOwnerId } = useWorkspace();

  return useMutation({
    mutationFn: async (form: Omit<FormInsert, "user_id">) => {
      if (!workspaceOwnerId) throw new Error("Workspace not ready");

      const { data, error } = await supabase
        .from("forms")
        .insert({ ...form, user_id: workspaceOwnerId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
    },
  });
};

export const useUpdateForm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: FormUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("forms")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
      queryClient.invalidateQueries({ queryKey: ["form", data.id] });
    },
  });
};

export const useDeleteForm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("forms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
    },
  });
};

export const usePublishForm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("forms")
        .update({ is_published: true })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forms"] });
    },
  });
};
