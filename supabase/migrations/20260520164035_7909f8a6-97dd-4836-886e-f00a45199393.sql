CREATE OR REPLACE FUNCTION public.get_form_owner_company(p_slug text)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.company_name
  FROM public.forms f
  JOIN public.profiles p ON p.user_id = f.user_id
  WHERE f.slug = p_slug
    AND f.is_published = true
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_form_owner_company(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_form_owner_company(text) TO anon, authenticated;