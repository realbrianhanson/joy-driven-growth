CREATE POLICY "Anyone can upload submission media"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'videos'
    AND (storage.foldername(name))[1] = 'submissions'
    AND length(name) < 256
  );