
-- App-level settings (read by edge functions via service role)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- No public policies — only service_role bypasses RLS and can read this.

-- Function for SettingsTeam to fetch real profiles of teammates
CREATE OR REPLACE FUNCTION public.get_team_member_profiles()
RETURNS TABLE (
  member_user_id uuid,
  full_name text,
  email text,
  role text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Owner perspective: list their team's members (and themselves)
  SELECT tm.member_user_id, p.full_name, p.email, tm.role::text, tm.created_at
  FROM public.team_members tm
  LEFT JOIN public.profiles p ON p.user_id = tm.member_user_id
  WHERE tm.owner_user_id = auth.uid()
  UNION
  -- Member perspective: list the members of the team they belong to
  SELECT tm.member_user_id, p.full_name, p.email, tm.role::text, tm.created_at
  FROM public.team_members tm
  LEFT JOIN public.profiles p ON p.user_id = tm.member_user_id
  WHERE tm.owner_user_id IN (
    SELECT owner_user_id FROM public.team_members WHERE member_user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.get_team_member_profiles() TO authenticated;
