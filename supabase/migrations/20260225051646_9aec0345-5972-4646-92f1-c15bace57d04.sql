-- Create function to increment form submission count
CREATE OR REPLACE FUNCTION public.increment_form_submissions(form_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE forms SET submission_count = COALESCE(submission_count, 0) + 1 WHERE id = form_id;
END;
$$;