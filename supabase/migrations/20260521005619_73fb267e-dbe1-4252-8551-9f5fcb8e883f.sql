
CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_owner_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_month_start timestamptz := date_trunc('month', v_now);
  v_last_month_start timestamptz := date_trunc('month', v_now - interval '1 month');
  v_week_start timestamptz := date_trunc('week', v_now);

  v_total_testimonials int := 0;
  v_this_month int := 0;
  v_last_month int := 0;
  v_week_count int := 0;
  v_avg_rating numeric := 0;
  v_approved_count int := 0;
  v_testimonials_trend int := 0;
  v_collection_rate int := NULL;

  v_revenue_this_month numeric := 0;
  v_revenue_last_month numeric := 0;
  v_weekly_revenue numeric := 0;
  v_revenue_trend int := 0;

  v_impressions bigint := 0;
  v_clicks bigint := 0;
  v_widget_ctr numeric := 0;

  v_recent5 jsonb := '[]'::jsonb;
  v_top_drivers jsonb := '[]'::jsonb;
  v_activity jsonb := '[]'::jsonb;
BEGIN
  -- Authorization: caller must be the owner or a team member.
  IF NOT public.is_team_member_of(p_owner_id) THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;

  -- Testimonials aggregates
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE created_at >= v_month_start),
    COUNT(*) FILTER (WHERE created_at >= v_last_month_start AND created_at < v_month_start),
    COUNT(*) FILTER (WHERE created_at >= v_week_start),
    COALESCE(AVG(rating) FILTER (WHERE rating IS NOT NULL), 0),
    COUNT(*) FILTER (WHERE status = 'approved')
  INTO v_total_testimonials, v_this_month, v_last_month, v_week_count, v_avg_rating, v_approved_count
  FROM public.testimonials
  WHERE user_id = p_owner_id;

  v_testimonials_trend := CASE
    WHEN v_last_month > 0 THEN ROUND(((v_this_month - v_last_month)::numeric / v_last_month) * 100)::int
    WHEN v_this_month > 0 THEN 100
    ELSE 0
  END;

  v_collection_rate := CASE
    WHEN v_total_testimonials > 0 THEN ROUND((v_approved_count::numeric / v_total_testimonials) * 100)::int
    ELSE NULL
  END;

  -- Revenue aggregates
  SELECT
    COALESCE(SUM(amount) FILTER (WHERE attributed_at >= v_month_start), 0),
    COALESCE(SUM(amount) FILTER (WHERE attributed_at >= v_last_month_start AND attributed_at < v_month_start), 0),
    COALESCE(SUM(amount) FILTER (WHERE attributed_at >= v_week_start), 0)
  INTO v_revenue_this_month, v_revenue_last_month, v_weekly_revenue
  FROM public.revenue_events
  WHERE user_id = p_owner_id;

  v_revenue_trend := CASE
    WHEN v_revenue_last_month > 0 THEN ROUND(((v_revenue_this_month - v_revenue_last_month) / v_revenue_last_month) * 100)::int
    WHEN v_revenue_this_month > 0 THEN 100
    ELSE 0
  END;

  -- Widget CTR
  SELECT
    COALESCE(SUM(impressions), 0),
    COALESCE(SUM(clicks), 0)
  INTO v_impressions, v_clicks
  FROM public.widgets
  WHERE user_id = p_owner_id;

  v_widget_ctr := CASE WHEN v_impressions > 0 THEN ROUND((v_clicks::numeric / v_impressions) * 1000) / 10 ELSE 0 END;

  -- Recent 5 testimonials
  SELECT COALESCE(jsonb_agg(t ORDER BY t.created_at DESC), '[]'::jsonb)
  INTO v_recent5
  FROM (
    SELECT id, author_name, author_company, content, rating, sentiment, revenue_attributed, created_at
    FROM public.testimonials
    WHERE user_id = p_owner_id
    ORDER BY created_at DESC
    LIMIT 5
  ) t;

  -- Top 5 revenue drivers
  SELECT COALESCE(jsonb_agg(t ORDER BY t.revenue_attributed DESC), '[]'::jsonb)
  INTO v_top_drivers
  FROM (
    SELECT id, author_name, author_company, content, revenue_attributed
    FROM public.testimonials
    WHERE user_id = p_owner_id
      AND status = 'approved'
      AND revenue_attributed IS NOT NULL
      AND revenue_attributed > 0
    ORDER BY revenue_attributed DESC
    LIMIT 5
  ) t;

  -- Recent activity (10)
  SELECT COALESCE(jsonb_agg(a ORDER BY a.created_at DESC), '[]'::jsonb)
  INTO v_activity
  FROM (
    SELECT id, action, entity_type, entity_id, metadata, created_at
    FROM public.activity_log
    WHERE user_id = p_owner_id
    ORDER BY created_at DESC
    LIMIT 10
  ) a;

  RETURN jsonb_build_object(
    'total_testimonials', v_total_testimonials,
    'testimonials_this_month', v_this_month,
    'testimonials_trend', v_testimonials_trend,
    'this_week_count', v_week_count,
    'avg_rating', ROUND(v_avg_rating::numeric, 1),
    'approved_count', v_approved_count,
    'collection_rate', v_collection_rate,
    'revenue_this_month', v_revenue_this_month,
    'revenue_last_month', v_revenue_last_month,
    'revenue_trend', v_revenue_trend,
    'weekly_revenue', v_weekly_revenue,
    'widget_ctr', v_widget_ctr,
    'recent_5', v_recent5,
    'top_drivers', v_top_drivers,
    'recent_activity', v_activity
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_dashboard_stats(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats(uuid) TO authenticated;
