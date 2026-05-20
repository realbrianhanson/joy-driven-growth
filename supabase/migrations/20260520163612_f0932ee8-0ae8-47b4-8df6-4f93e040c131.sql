ALTER TABLE public.testimonials
  ADD COLUMN IF NOT EXISTS consent_given boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_text text,
  ADD COLUMN IF NOT EXISTS consent_timestamp timestamptz,
  ADD COLUMN IF NOT EXISTS display_preference text NOT NULL DEFAULT 'full'
    CHECK (display_preference IN ('full', 'first_initial', 'anonymous')),
  ADD COLUMN IF NOT EXISTS developed_content text,
  ADD COLUMN IF NOT EXISTS developed_pull_quote text,
  ADD COLUMN IF NOT EXISTS developed_one_liner text,
  ADD COLUMN IF NOT EXISTS developed_at timestamptz;

COMMENT ON COLUMN public.testimonials.consent_given IS 'Whether the submitter granted marketing-use permission';
COMMENT ON COLUMN public.testimonials.consent_text IS 'The exact consent wording the submitter agreed to';
COMMENT ON COLUMN public.testimonials.developed_content IS 'AI-developed copy-paste-ready testimonial (draft for owner approval); never auto-published';
COMMENT ON COLUMN public.testimonials.developed_pull_quote IS 'Short pull-quote version (~1 sentence)';
COMMENT ON COLUMN public.testimonials.developed_one_liner IS 'One-line version for compact widgets';