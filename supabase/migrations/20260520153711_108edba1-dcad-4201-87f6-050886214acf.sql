
-- get_invite_by_token: lets an invitee preview an invite before accepting
CREATE OR REPLACE FUNCTION public.get_invite_by_token(p_token text)
RETURNS TABLE (
  id uuid,
  owner_user_id uuid,
  email text,
  role text,
  status text,
  expires_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, owner_user_id, email, role, status, expires_at
  FROM public.team_invites
  WHERE token = p_token
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_invite_by_token(text) TO authenticated, anon;

-- Update accept_team_invite to block joining own team
CREATE OR REPLACE FUNCTION public.accept_team_invite(p_token text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  inv public.team_invites;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO inv FROM public.team_invites WHERE token = p_token;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invite_not_found');
  END IF;

  IF inv.status <> 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invite_' || inv.status);
  END IF;

  IF inv.expires_at < now() THEN
    UPDATE public.team_invites SET status = 'expired' WHERE id = inv.id;
    RETURN jsonb_build_object('ok', false, 'error', 'invite_expired');
  END IF;

  IF inv.owner_user_id = uid THEN
    RETURN jsonb_build_object('ok', false, 'error', 'cannot_join_own_team');
  END IF;

  INSERT INTO public.team_members (owner_user_id, member_user_id, role)
  VALUES (inv.owner_user_id, uid, inv.role)
  ON CONFLICT (owner_user_id, member_user_id) DO UPDATE SET role = EXCLUDED.role;

  UPDATE public.team_invites
  SET status = 'accepted', accepted_at = now(), accepted_by = uid
  WHERE id = inv.id;

  RETURN jsonb_build_object('ok', true, 'owner_user_id', inv.owner_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_team_invite(text) TO authenticated;
