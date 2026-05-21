
-- =====================================================
-- 1. RATE LIMITS INFRASTRUCTURE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  window_started_at timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS rate_limits_key_window_idx
  ON public.rate_limits(key, window_started_at);

CREATE INDEX IF NOT EXISTS rate_limits_window_idx
  ON public.rate_limits(window_started_at);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies: only service role (which bypasses RLS) may access.

-- Atomically bump the counter and report whether the caller is within budget.
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_key text,
  p_max integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window timestamptz;
  v_count integer;
BEGIN
  v_window := to_timestamp(
    (extract(epoch from now())::bigint / p_window_seconds) * p_window_seconds
  );

  INSERT INTO public.rate_limits(key, window_started_at, count, updated_at)
  VALUES (p_key, v_window, 1, now())
  ON CONFLICT (key, window_started_at)
  DO UPDATE SET count = public.rate_limits.count + 1, updated_at = now()
  RETURNING count INTO v_count;

  -- Opportunistically purge old rows (older than 1 hour).
  DELETE FROM public.rate_limits WHERE window_started_at < now() - interval '1 hour';

  RETURN v_count <= p_max;
END;
$$;

-- =====================================================
-- 2. INTEGRATIONS: HIDE OAUTH TOKENS FROM CLIENTS
-- =====================================================
-- Revoke column-level SELECT on token columns from client roles.
REVOKE SELECT (access_token, refresh_token) ON public.integrations FROM anon, authenticated;

-- Safe view that excludes the token columns.
CREATE OR REPLACE VIEW public.integrations_safe
WITH (security_barrier = true, security_invoker = true)
AS
SELECT id, user_id, provider, is_connected, settings, last_synced_at, created_at, updated_at
FROM public.integrations;

GRANT SELECT ON public.integrations_safe TO anon, authenticated;

-- =====================================================
-- 3. ROLE-AWARE WRITE HELPER + TIGHTENED RLS
-- =====================================================
CREATE OR REPLACE FUNCTION public.can_write_for(p_owner_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p_owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.owner_user_id = p_owner_id
        AND tm.member_user_id = auth.uid()
        AND tm.role IN ('owner', 'admin')
    );
$$;

-- testimonials
DROP POLICY IF EXISTS "team can insert testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "team can update testimonials" ON public.testimonials;
CREATE POLICY "team can insert testimonials" ON public.testimonials
  FOR INSERT TO authenticated
  WITH CHECK (public.can_write_for(user_id));
CREATE POLICY "team can update testimonials" ON public.testimonials
  FOR UPDATE TO authenticated
  USING (public.can_write_for(user_id))
  WITH CHECK (public.can_write_for(user_id));

-- forms
DROP POLICY IF EXISTS "team can insert forms" ON public.forms;
DROP POLICY IF EXISTS "team can update forms" ON public.forms;
CREATE POLICY "team can insert forms" ON public.forms
  FOR INSERT TO authenticated
  WITH CHECK (public.can_write_for(user_id));
CREATE POLICY "team can update forms" ON public.forms
  FOR UPDATE TO authenticated
  USING (public.can_write_for(user_id))
  WITH CHECK (public.can_write_for(user_id));

-- widgets
DROP POLICY IF EXISTS "team can insert widgets" ON public.widgets;
DROP POLICY IF EXISTS "team can update widgets" ON public.widgets;
CREATE POLICY "team can insert widgets" ON public.widgets
  FOR INSERT TO authenticated
  WITH CHECK (public.can_write_for(user_id));
CREATE POLICY "team can update widgets" ON public.widgets
  FOR UPDATE TO authenticated
  USING (public.can_write_for(user_id))
  WITH CHECK (public.can_write_for(user_id));

-- walls
DROP POLICY IF EXISTS "team can insert walls" ON public.walls;
DROP POLICY IF EXISTS "team can update walls" ON public.walls;
CREATE POLICY "team can insert walls" ON public.walls
  FOR INSERT TO authenticated
  WITH CHECK (public.can_write_for(user_id));
CREATE POLICY "team can update walls" ON public.walls
  FOR UPDATE TO authenticated
  USING (public.can_write_for(user_id))
  WITH CHECK (public.can_write_for(user_id));

-- campaigns
DROP POLICY IF EXISTS "team can insert campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "team can update campaigns" ON public.campaigns;
CREATE POLICY "team can insert campaigns" ON public.campaigns
  FOR INSERT TO authenticated
  WITH CHECK (public.can_write_for(user_id));
CREATE POLICY "team can update campaigns" ON public.campaigns
  FOR UPDATE TO authenticated
  USING (public.can_write_for(user_id))
  WITH CHECK (public.can_write_for(user_id));

-- generated_content
DROP POLICY IF EXISTS "team can insert generated_content" ON public.generated_content;
DROP POLICY IF EXISTS "team can update generated_content" ON public.generated_content;
CREATE POLICY "team can insert generated_content" ON public.generated_content
  FOR INSERT TO authenticated
  WITH CHECK (public.can_write_for(user_id));
CREATE POLICY "team can update generated_content" ON public.generated_content
  FOR UPDATE TO authenticated
  USING (public.can_write_for(user_id))
  WITH CHECK (public.can_write_for(user_id));
