
-- 1. Forms: restrict anon column access (RLS gates rows, GRANTs gate columns)
REVOKE SELECT ON public.forms FROM anon;
GRANT SELECT (
  id, slug, name, logo_url, primary_color,
  welcome_title, welcome_message,
  thank_you_title, thank_you_message,
  incentive_enabled, incentive_type, incentive_value,
  custom_questions, require_photo, require_rating,
  collect_text, collect_audio, collect_video,
  is_published
) ON public.forms TO anon;

-- 2. Walls: drop direct anon read; PublicWall uses get_wall_public RPC
DROP POLICY IF EXISTS "Anyone can view published walls" ON public.walls;

-- 3. Storage: allow users to delete their own logos
CREATE POLICY "Users can delete own logos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'logos'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
