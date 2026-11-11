import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "./use-workspace";
import type { Database } from "@/integrations/supabase/types";
import type { ImportRow, TestimonialRow, TestimonialStatus } from "@/lib/testimonial";

type TestimonialInsert = Database["public"]["Tables"]["testimonials"]["Insert"];
type TestimonialUpdate = Database["public"]["Tables"]["testimonials"]["Update"];

/** The API returns at most this many rows in one request. */
export const TESTIMONIAL_PAGE_LIMIT = 1000;

/**
 * Every testimonial in the workspace, newest first. Search, tabs and sorting
 * run in the browser on this one list, so typing in the search box never
 * waits on the network.
 */
export const useTestimonials = () => {
  const { workspaceOwnerId } = useWorkspace();

  return useQuery({
    queryKey: ["testimonials", workspaceOwnerId, "list"],
    enabled: !!workspaceOwnerId,
    queryFn: async (): Promise<TestimonialRow[]> => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("user_id", workspaceOwnerId!)
        .order("created_at", { ascending: false })
        .limit(TESTIMONIAL_PAGE_LIMIT);
      if (error) throw error;
      return data ?? [];
    },
  });
};

function useInvalidateTestimonials() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: ["testimonials"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
  };
}

export const useUpdateTestimonial = () => {
  const invalidate = useInvalidateTestimonials();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TestimonialUpdate & { id: string }) => {
      const { data, error } = await supabase.from("testimonials").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });
};

/** Approve, reject or move back to review. Works on one testimonial or many. */
export const useSetTestimonialStatus = () => {
  const invalidate = useInvalidateTestimonials();
  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: TestimonialStatus }) => {
      if (ids.length === 0) return 0;
      const { error, count } = await supabase
        .from("testimonials")
        .update(
          { status, approved_at: status === "approved" ? new Date().toISOString() : null },
          { count: "exact" },
        )
        .in("id", ids);
      if (error) throw error;
      return count ?? ids.length;
    },
    onSuccess: invalidate,
  });
};

export const useDeleteTestimonials = () => {
  const invalidate = useInvalidateTestimonials();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (ids.length === 0) return 0;
      const { error, count } = await supabase.from("testimonials").delete({ count: "exact" }).in("id", ids);
      if (error) throw error;
      return count ?? ids.length;
    },
    onSuccess: invalidate,
  });
};

export interface ManualTestimonial {
  author_name: string;
  author_title?: string | null;
  author_company?: string | null;
  author_email?: string | null;
  content?: string | null;
  rating?: number | null;
  type?: "text" | "video" | "audio";
  video_url?: string | null;
  audio_url?: string | null;
}

const OWNER_CONSENT_TEXT = "Permission to publish confirmed by the account owner when this testimonial was added.";

/** Add a testimonial the owner already has. It is saved as approved, with the owner's confirmation of permission. */
export const useAddTestimonial = () => {
  const { workspaceOwnerId } = useWorkspace();
  const invalidate = useInvalidateTestimonials();
  return useMutation({
    mutationFn: async (input: ManualTestimonial) => {
      if (!workspaceOwnerId) throw new Error("Your workspace is still loading. Try again in a moment.");
      const now = new Date().toISOString();
      const row: TestimonialInsert = {
        user_id: workspaceOwnerId,
        author_name: input.author_name.trim(),
        author_title: input.author_title?.trim() || null,
        author_company: input.author_company?.trim() || null,
        author_email: input.author_email?.trim() || null,
        content: input.content?.trim() || null,
        rating: input.rating ?? null,
        type: input.type ?? "text",
        video_url: input.video_url ?? null,
        audio_url: input.audio_url ?? null,
        source: "manual",
        status: "approved",
        approved_at: now,
        consent_given: true,
        consent_text: OWNER_CONSENT_TEXT,
        consent_timestamp: now,
      };
      const { data, error } = await supabase.from("testimonials").insert(row).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });
};

/** Insert imported rows in batches, so one bad batch does not lose the rest. */
export const useImportTestimonials = () => {
  const { workspaceOwnerId } = useWorkspace();
  const invalidate = useInvalidateTestimonials();
  return useMutation({
    mutationFn: async (rows: ImportRow[]) => {
      if (!workspaceOwnerId) throw new Error("Your workspace is still loading. Try again in a moment.");
      const now = new Date().toISOString();
      const payload: TestimonialInsert[] = rows.map((r) => ({
        user_id: workspaceOwnerId,
        author_name: r.author_name,
        author_title: r.author_title,
        author_company: r.author_company,
        author_email: r.author_email,
        content: r.content,
        rating: r.rating,
        type: "text",
        source: "import",
        status: "approved",
        approved_at: now,
        consent_given: true,
        consent_text: OWNER_CONSENT_TEXT,
        consent_timestamp: now,
      }));

      let imported = 0;
      let failed = 0;
      for (let i = 0; i < payload.length; i += 100) {
        const batch = payload.slice(i, i + 100);
        const { error } = await supabase.from("testimonials").insert(batch);
        if (error) failed += batch.length;
        else imported += batch.length;
      }
      if (imported === 0) throw new Error("None of the rows could be saved. Check the file and try again.");
      return { imported, failed };
    },
    onSuccess: invalidate,
  });
};

export interface RevenueEvent {
  id: string;
  amount: number;
  currency: string | null;
  created_at: string;
  source: string | null;
  metadata: Record<string, unknown> | null;
}

/** Sales logged against one testimonial. */
export const useTestimonialSales = (testimonialId: string | null) =>
  useQuery({
    queryKey: ["testimonials", "sales", testimonialId],
    enabled: !!testimonialId,
    queryFn: async (): Promise<RevenueEvent[]> => {
      const { data, error } = await supabase
        .from("revenue_events")
        .select("id, amount, currency, created_at, source, metadata")
        .eq("testimonial_id", testimonialId!)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as RevenueEvent[];
    },
  });

/** Record a sale that a testimonial helped close. */
export const useLogSale = () => {
  const { workspaceOwnerId } = useWorkspace();
  const invalidate = useInvalidateTestimonials();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ testimonialId, amount, note }: { testimonialId: string; amount: number; note?: string }) => {
      const { data, error } = await supabase.functions.invoke("track-revenue", {
        body: {
          testimonial_id: testimonialId,
          amount,
          source: "manual",
          workspace_owner_id: workspaceOwnerId ?? undefined,
          metadata: note?.trim() ? { note: note.trim().slice(0, 300) } : {},
        },
      });
      if (error) throw error;
      const failure = (data as { error?: string } | null)?.error;
      if (failure) throw new Error(failure);
      return data;
    },
    onSuccess: () => {
      invalidate();
      void queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
};
