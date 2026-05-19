CREATE OR REPLACE FUNCTION public.increment_testimonial_revenue(p_testimonial_id uuid, p_amount numeric)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.testimonials
  SET revenue_attributed = COALESCE(revenue_attributed, 0) + p_amount
  WHERE id = p_testimonial_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_widget_revenue(p_widget_id uuid, p_amount numeric)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.widgets
  SET revenue_attributed = COALESCE(revenue_attributed, 0) + p_amount
  WHERE id = p_widget_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_campaign_sent(campaign_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.campaigns
  SET sent_count = COALESCE(sent_count, 0) + 1
  WHERE id = campaign_id;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_revenue_events_stripe_payment_id
  ON public.revenue_events(stripe_payment_id)
  WHERE stripe_payment_id IS NOT NULL;