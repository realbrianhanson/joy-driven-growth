CREATE OR REPLACE FUNCTION public.is_team_member_of(p_owner_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    p_owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.owner_user_id = p_owner_id
        AND tm.member_user_id = auth.uid()
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_team_member_of(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_team_owner()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT tm.owner_user_id
  FROM public.team_members tm
  WHERE tm.member_user_id = auth.uid()
  ORDER BY tm.created_at ASC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_team_owner() TO authenticated;