
-- ============ TEAM ============

CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  member_user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, member_user_id)
);

CREATE INDEX idx_team_members_owner ON public.team_members(owner_user_id);
CREATE INDEX idx_team_members_member ON public.team_members(member_user_id);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view team"
  ON public.team_members FOR SELECT
  USING (auth.uid() = owner_user_id OR auth.uid() = member_user_id);

CREATE POLICY "Owner can add members"
  ON public.team_members FOR INSERT
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Owner can update members"
  ON public.team_members FOR UPDATE
  USING (auth.uid() = owner_user_id);

CREATE POLICY "Owner can remove members"
  ON public.team_members FOR DELETE
  USING (auth.uid() = owner_user_id);

-- ============ INVITES ============

CREATE TABLE public.team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member')),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked','expired')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '14 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_team_invites_owner ON public.team_invites(owner_user_id);
CREATE INDEX idx_team_invites_token ON public.team_invites(token);

ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages invites"
  ON public.team_invites FOR ALL
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

-- Accept invite by token (security definer so the invitee can read+accept)
CREATE OR REPLACE FUNCTION public.accept_team_invite(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv public.team_invites;
  uid UUID := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO inv FROM public.team_invites WHERE token = p_token;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;

  IF inv.status <> 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_' || inv.status);
  END IF;

  IF inv.expires_at < now() THEN
    UPDATE public.team_invites SET status = 'expired' WHERE id = inv.id;
    RETURN jsonb_build_object('ok', false, 'error', 'expired');
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

-- ============ API KEYS ============

CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,      -- first 8 chars for display, e.g. "hc_live_"
  key_hash TEXT NOT NULL UNIQUE, -- sha-256 hex of full key
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_api_keys_user ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_hash ON public.api_keys(key_hash);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own keys"
  ON public.api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users create their own keys"
  ON public.api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users revoke their own keys"
  ON public.api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users delete their own keys"
  ON public.api_keys FOR DELETE
  USING (auth.uid() = user_id);
