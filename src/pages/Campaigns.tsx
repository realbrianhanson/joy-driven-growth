import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquareText, PenLine, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer, PageHeader } from "@/components/shared/PageHeader";
import { EmptyState, ErrorState } from "@/components/shared/States";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { usePlan } from "@/hooks/use-plan";
import { useWorkspace } from "@/hooks/use-workspace";
import { SMS_MONTHLY_ALLOWANCE } from "@/lib/billing-plans";
import { formatDate, pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";

type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];

type Tone = "muted" | "gold" | "success" | "warning";

const TONES: Record<Tone, string> = {
  muted: "bg-muted text-muted-foreground",
  gold: "bg-gold-light text-gold-deep",
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-warning",
};

const JOB_LABELS: Record<string, string> = {
  pending: "Waiting to send",
  processing: "Sending",
  sent: "Sent, waiting for the carrier",
  delivered: "Delivered",
  failed: "Failed",
  undelivered: "Not delivered",
};

/** Where a campaign stands, in plain words. The database keeps "active" after the last text, so "Sent" is worked out here. */
function campaignState(campaign: Campaign): { label: string; tone: Tone } {
  const total = campaign.total_recipients ?? 0;
  const attempted = campaign.sent_count ?? 0;
  switch (campaign.status) {
    case "scheduled":
      return {
        label: campaign.scheduled_at
          ? `Scheduled for ${new Date(campaign.scheduled_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`
          : "Scheduled",
        tone: "gold",
      };
    case "active":
      return total > 0 && attempted >= total ? { label: "Sent", tone: "success" } : { label: "Sending", tone: "gold" };
    case "completed":
      return { label: "Sent", tone: "success" };
    case "paused":
      return { label: "Stopped", tone: "warning" };
    default:
      return { label: "Draft", tone: "muted" };
  }
}

function Tile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-4">
      <p className="eyebrow">{label}</p>
      <p className="display mt-2 text-3xl tabular-nums text-foreground">{value}</p>
      {note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}
    </div>
  );
}

/** Text campaigns: send a form link to a list of clients by SMS, and see what was delivered. */
export default function Campaigns() {
  const { workspaceOwnerId, isOwner } = useWorkspace();
  const { plan, isLoading: planLoading } = usePlan();
  const queryClient = useQueryClient();
  const [detail, setDetail] = useState<Campaign | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);

  const { data: campaigns, isLoading, error, refetch } = useQuery({
    queryKey: ["campaigns", workspaceOwnerId],
    enabled: !!workspaceOwnerId,
    queryFn: async (): Promise<Campaign[]> => {
      const { data, error: queryError } = await supabase
        .from("campaigns")
        .select("*")
        .eq("user_id", workspaceOwnerId!)
        .order("created_at", { ascending: false });
      if (queryError) throw queryError;
      return data ?? [];
    },
  });

  // Texts queued this calendar month. This is what the plan's allowance counts.
  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString();
  const { data: usedThisMonth } = useQuery({
    queryKey: ["campaigns", workspaceOwnerId, "month-usage", monthStart],
    enabled: !!workspaceOwnerId && isOwner,
    queryFn: async () => {
      const { count, error: countError } = await supabase
        .from("campaign_jobs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", workspaceOwnerId!)
        .gte("created_at", monthStart);
      if (countError) throw countError;
      return count ?? 0;
    },
  });

  const { data: detailJobs } = useQuery({
    queryKey: ["campaigns", "job-status", detail?.id],
    enabled: !!detail && detail.status !== "draft",
    queryFn: async () => {
      const { data, error: jobsError } = await supabase.from("campaign_jobs").select("status").eq("campaign_id", detail!.id);
      if (jobsError) throw jobsError;
      const counts: Record<string, number> = {};
      for (const row of data ?? []) counts[row.status] = (counts[row.status] ?? 0) + 1;
      return counts;
    },
  });

  // Counts change as carriers confirm delivery. Refresh when the database says so.
  useEffect(() => {
    if (!workspaceOwnerId) return;
    const channel = supabase
      .channel(`campaigns-${workspaceOwnerId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "campaigns", filter: `user_id=eq.${workspaceOwnerId}` }, () => {
        void queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [workspaceOwnerId, queryClient]);

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error: deleteError } = await supabase.from("campaigns").delete().eq("id", id);
      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      toast.success("Campaign deleted");
      void queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: () => toast.error("The campaign was not deleted. Only the account owner can delete campaigns."),
  });

  const list = campaigns ?? [];
  const allowance = SMS_MONTHLY_ALLOWANCE[plan] ?? 0;
  const attempted = list.reduce((sum, c) => sum + (c.sent_count ?? 0), 0);
  const delivered = list.reduce((sum, c) => sum + (c.delivered_count ?? 0), 0);

  const newButton = (
    <Button asChild>
      <Link to="/dashboard/campaigns/new">
        <Plus className="mr-1.5 h-4 w-4" />
        New campaign
      </Link>
    </Button>
  );

  return (
    <PageContainer>
      <PageHeader
        title="Text campaigns"
        description="Text your form link to a list of clients. Only text people who agreed to hear from you."
        actions={newButton}
      />

      {!planLoading && allowance === 0 && (
        <div className="mb-6 rounded-2xl border border-gold/40 bg-gold-light/60 px-5 py-4 text-sm text-foreground">
          Text campaigns are part of the Starter plan and up. You can build and save a campaign now, and send it after you upgrade.{" "}
          <Link to="/dashboard/settings/billing" className="font-medium underline underline-offset-4">
            See plans
          </Link>
        </div>
      )}

      {error ? (
        <ErrorState title="Your campaigns did not load" error={error} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <div className="space-y-3" role="status" aria-label="Loading campaigns">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={MessageSquareText}
          title="Ask by text message"
          description="Paste a list of mobile numbers, write one short message, and every client gets your form link. Most people read a text within minutes."
          actions={newButton}
        />
      ) : (
        <>
          <div className={cn("mb-6 grid gap-3", isOwner && allowance !== 0 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
            {isOwner && allowance !== 0 && (
              <Tile
                label="Texts this month"
                value={(usedThisMonth ?? 0).toLocaleString()}
                note={allowance === null ? "Your plan has no monthly cap." : `Your plan includes ${allowance.toLocaleString()} each month.`}
              />
            )}
            <Tile label="Delivered" value={delivered.toLocaleString()} note="Confirmed by the phone carrier, all time." />
            <Tile
              label="Delivery rate"
              value={attempted > 0 ? `${Math.round((delivered / attempted) * 100)}%` : "No data"}
              note={attempted > 0 ? `Of ${pluralize(attempted, "text")} sent.` : "Shows after your first campaign goes out."}
            />
          </div>

          <ul className="space-y-3">
            {list.map((campaign) => {
              const state = campaignState(campaign);
              const total = campaign.total_recipients ?? 0;
              const isDraft = (campaign.status ?? "draft") === "draft";
              const canDelete = isOwner && (isDraft || campaign.status === "scheduled" || campaign.status === "paused");
              return (
                <li key={campaign.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-base font-semibold text-foreground">{campaign.name}</h2>
                        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", TONES[state.tone])}>{state.label}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {pluralize(total, "person", "people")} · Created {formatDate(campaign.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isDraft ? (
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/dashboard/campaigns/new?draft=${campaign.id}`}>
                            <PenLine className="mr-1.5 h-3.5 w-3.5" />
                            Continue
                          </Link>
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => setDetail(campaign)}>
                          Details
                        </Button>
                      )}
                      {canDelete && (
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(campaign)} aria-label={`Delete ${campaign.name}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {!isDraft && campaign.status !== "scheduled" && (
                    <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4 text-sm">
                      {[
                        { label: "Sent", value: campaign.sent_count ?? 0 },
                        { label: "Delivered", value: campaign.delivered_count ?? 0 },
                        { label: "Failed", value: Math.max(0, (campaign.completed_count ?? 0) - (campaign.delivered_count ?? 0)) },
                      ].map((stat) => (
                        <div key={stat.label}>
                          <dt className="text-xs text-muted-foreground">{stat.label}</dt>
                          <dd className="mt-0.5 font-semibold tabular-nums text-foreground">{stat.value.toLocaleString()}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-w-md">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle>{detail.name}</DialogTitle>
                <DialogDescription>
                  {campaignState(detail).label} · {pluralize(detail.total_recipients ?? 0, "person", "people")}
                </DialogDescription>
              </DialogHeader>
              {detail.message_template && (
                <div>
                  <p className="eyebrow mb-2">Message</p>
                  <p className="whitespace-pre-wrap rounded-xl bg-muted/50 px-4 py-3 text-sm text-foreground">{detail.message_template}</p>
                </div>
              )}
              <div>
                <p className="eyebrow mb-2">Where the texts stand</p>
                {detailJobs && Object.keys(detailJobs).length > 0 ? (
                  <ul className="divide-y divide-border rounded-xl border border-border">
                    {Object.entries(detailJobs).map(([status, count]) => (
                      <li key={status} className="flex items-center justify-between px-4 py-2.5 text-sm">
                        <span className="text-muted-foreground">{JOB_LABELS[status] ?? status}</span>
                        <span className="font-medium tabular-nums text-foreground">{count.toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {isOwner ? "No texts in the queue for this campaign." : "Only the account owner can see each text."}
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.status === "scheduled"
                ? "The scheduled texts are cancelled and nothing is sent."
                : "The campaign and its list of numbers are removed."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) remove.mutate(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Delete campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
