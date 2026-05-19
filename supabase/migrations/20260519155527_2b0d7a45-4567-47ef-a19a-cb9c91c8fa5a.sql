CREATE OR REPLACE FUNCTION public.get_wall_public(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
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
        'author_name', t.author_name,
        'author_title', t.author_title,
        'author_company', t.author_company,
        'author_avatar', t.author_avatar,
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
$$;

CREATE OR REPLACE FUNCTION public.get_widget_public(p_widget_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
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
        'author_name', t.author_name,
        'author_title', t.author_title,
        'author_company', t.author_company,
        'author_avatar', t.author_avatar,
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
$$;

CREATE OR REPLACE FUNCTION public.increment_wall_views(p_slug text)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.walls SET views = COALESCE(views, 0) + 1 WHERE slug = p_slug AND is_published = true;
$$;

CREATE OR REPLACE FUNCTION public.increment_widget_impressions(p_widget_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.widgets SET impressions = COALESCE(impressions, 0) + 1 WHERE id = p_widget_id AND is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.increment_widget_clicks(p_widget_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.widgets SET clicks = COALESCE(clicks, 0) + 1 WHERE id = p_widget_id AND is_active = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_wall_public(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_widget_public(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_wall_views(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_widget_impressions(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_widget_clicks(uuid) TO anon, authenticated;