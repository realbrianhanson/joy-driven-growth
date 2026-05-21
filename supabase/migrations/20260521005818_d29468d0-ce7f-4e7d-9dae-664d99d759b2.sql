
CREATE OR REPLACE FUNCTION public.mask_author_name(p_name text, p_preference text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_name text := COALESCE(NULLIF(btrim(p_name), ''), 'Anonymous');
  v_first text;
  v_last text;
BEGIN
  IF p_preference = 'anonymous' THEN
    RETURN 'Anonymous';
  ELSIF p_preference = 'first_initial' THEN
    v_first := split_part(v_name, ' ', 1);
    v_last := btrim(substring(v_name FROM position(' ' IN v_name) + 1));
    IF v_last IS NULL OR v_last = '' OR position(' ' IN v_name) = 0 THEN
      RETURN v_first;
    END IF;
    RETURN v_first || ' ' || upper(left(v_last, 1)) || '.';
  ELSE
    RETURN v_name;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_wall_public(p_slug text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  w public.walls;
  result jsonb;
BEGIN
  SELECT * INTO w FROM public.walls WHERE slug = p_slug AND is_published = true;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'id', w.id,
    'name', w.name,
    'slug', w.slug,
    'header_title', w.header_title,
    'header_subtitle', w.header_subtitle,
    'logo_url', w.logo_url,
    'layout', w.layout,
    'columns', w.columns,
    'background_color', w.background_color,
    'accent_color', w.accent_color,
    'testimonials', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', t.id,
        'author_name', public.mask_author_name(t.author_name, t.display_preference),
        'author_title', t.author_title,
        'author_company', t.author_company,
        'author_avatar', CASE WHEN t.display_preference = 'anonymous' THEN NULL ELSE t.author_avatar END,
        'display_preference', t.display_preference,
        'content', t.content,
        'rating', t.rating,
        'type', t.type,
        'video_url', t.video_url,
        'audio_url', t.audio_url,
        'thumbnail_url', t.thumbnail_url,
        'created_at', t.created_at
      ) ORDER BY array_position(w.testimonial_ids, t.id)), '[]'::jsonb)
      FROM public.testimonials t
      WHERE t.id = ANY(w.testimonial_ids)
        AND t.status = 'approved'
    )
  ) INTO result;

  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_widget_public(p_widget_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  w public.widgets;
  result jsonb;
BEGIN
  SELECT * INTO w FROM public.widgets WHERE id = p_widget_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'id', w.id,
    'name', w.name,
    'type', w.type,
    'theme', w.theme,
    'auto_rotate', w.auto_rotate,
    'show_rating', w.show_rating,
    'show_date', w.show_date,
    'settings', w.settings,
    'testimonials', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'id', t.id,
        'author_name', public.mask_author_name(t.author_name, t.display_preference),
        'author_title', t.author_title,
        'author_company', t.author_company,
        'author_avatar', CASE WHEN t.display_preference = 'anonymous' THEN NULL ELSE t.author_avatar END,
        'display_preference', t.display_preference,
        'content', t.content,
        'rating', t.rating,
        'type', t.type,
        'video_url', t.video_url,
        'audio_url', t.audio_url,
        'thumbnail_url', t.thumbnail_url,
        'created_at', t.created_at
      ) ORDER BY array_position(w.testimonial_ids, t.id)), '[]'::jsonb)
      FROM public.testimonials t
      WHERE t.id = ANY(w.testimonial_ids)
        AND t.status = 'approved'
    )
  ) INTO result;

  RETURN result;
END;
$function$;
