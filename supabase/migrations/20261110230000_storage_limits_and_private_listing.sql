-- Storage hardening.
--
-- 1. Size and type limits. Collection forms let anyone upload to videos/submissions/.
--    Without limits that path could be used to host any file of any size.
UPDATE storage.buckets
SET file_size_limit = 104857600,
    allowed_mime_types = ARRAY['video/*', 'audio/*', 'image/jpeg', 'image/png', 'image/webp']
WHERE id = 'videos';

UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'avatars';

UPDATE storage.buckets
SET file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'logos';

-- 2. Stop anonymous listing of media.
--    A public bucket serves a file by its link without any SELECT policy. The broad
--    policies below only added the power to list every file in the bucket, which
--    exposed recordings that an owner had not approved, or had rejected.
--    Uploads need INSERT only. An upsert (the profile photo) also needs SELECT and
--    UPDATE on the caller's own folder, which the new policy keeps.
DROP POLICY IF EXISTS "Videos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Logos are publicly accessible" ON storage.objects;

DROP POLICY IF EXISTS "Users can list own media" ON storage.objects;
CREATE POLICY "Users can list own media" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id IN ('videos', 'avatars', 'logos')
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );
