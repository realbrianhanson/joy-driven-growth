CREATE TABLE IF NOT EXISTS public.campaign_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text NOT NULL,
  first_name text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'delivered', 'failed', 'undelivered')),
  twilio_message_sid text,
  error_code text,
  error_message text,
  attempts integer NOT NULL DEFAULT 0,
  attempted_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaign jobs"
  ON public.campaign_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_campaign_jobs_campaign_id ON public.campaign_jobs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_jobs_status_created ON public.campaign_jobs(status, created_at) WHERE status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_campaign_jobs_twilio_sid ON public.campaign_jobs(twilio_message_sid) WHERE twilio_message_sid IS NOT NULL;

CREATE OR REPLACE FUNCTION public.touch_campaign_jobs_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER campaign_jobs_updated_at
  BEFORE UPDATE ON public.campaign_jobs
  FOR EACH ROW EXECUTE FUNCTION public.touch_campaign_jobs_updated_at();

CREATE OR REPLACE FUNCTION public.promote_scheduled_campaigns()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  promoted_count integer;
BEGIN
  WITH promoted AS (
    UPDATE public.campaigns
    SET status = 'active', updated_at = now()
    WHERE status = 'scheduled' AND scheduled_at <= now()
    RETURNING id
  )
  SELECT COUNT(*) INTO promoted_count FROM promoted;
  RETURN promoted_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_pending_jobs(p_limit integer DEFAULT 50)
RETURNS TABLE (
  id uuid,
  campaign_id uuid,
  user_id uuid,
  phone text,
  first_name text,
  message text
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  UPDATE public.campaign_jobs cj
  SET status = 'processing', attempts = cj.attempts + 1, attempted_at = now()
  WHERE cj.id IN (
    SELECT inner_cj.id
    FROM public.campaign_jobs inner_cj
    JOIN public.campaigns c ON inner_cj.campaign_id = c.id
    WHERE inner_cj.status = 'pending'
      AND c.status = 'active'
    ORDER BY inner_cj.created_at
    LIMIT p_limit
    FOR UPDATE OF inner_cj SKIP LOCKED
  )
  RETURNING cj.id, cj.campaign_id, cj.user_id, cj.phone, cj.first_name, cj.message;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_campaign_counts(p_campaign_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.campaigns SET
    sent_count = (SELECT COUNT(*) FROM public.campaign_jobs WHERE campaign_id = p_campaign_id AND status IN ('sent', 'delivered', 'failed', 'undelivered')),
    delivered_count = (SELECT COUNT(*) FROM public.campaign_jobs WHERE campaign_id = p_campaign_id AND status = 'delivered'),
    completed_count = (SELECT COUNT(*) FROM public.campaign_jobs WHERE campaign_id = p_campaign_id AND status IN ('delivered', 'failed', 'undelivered'))
  WHERE id = p_campaign_id;
$$;

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'promote-scheduled-campaigns',
  '* * * * *',
  $$ SELECT public.promote_scheduled_campaigns(); $$
);

SELECT cron.schedule(
  'drain-campaign-jobs',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.worker_url', true),
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'x-internal-key', current_setting('app.worker_key', true)
    ),
    body := '{}'::jsonb
  ) WHERE current_setting('app.worker_url', true) IS NOT NULL;
  $$
);