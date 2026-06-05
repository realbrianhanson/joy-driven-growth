REVOKE EXECUTE ON FUNCTION public.increment_testimonial_revenue(uuid, numeric) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_widget_revenue(uuid, numeric) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_campaign_sent(uuid) FROM PUBLIC, anon, authenticated;