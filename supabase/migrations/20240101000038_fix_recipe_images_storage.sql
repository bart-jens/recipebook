-- Fix: recipe-images storage bucket was never created by migration 0010.
-- The bucket has been created via the API. This migration ensures the
-- storage policies exist for authenticated user uploads.

-- Idempotent: drop if they somehow exist from a partial run
DROP POLICY IF EXISTS "Users can upload recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own recipe images storage" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own recipe images storage" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for recipe images" ON storage.objects;

-- INSERT: authenticated users can upload to their own folder
CREATE POLICY "Users can upload recipe images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'recipe-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- UPDATE: users can update their own images
CREATE POLICY "Users can update own recipe images storage"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'recipe-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- DELETE: users can delete their own images
CREATE POLICY "Users can delete own recipe images storage"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'recipe-images'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- SELECT: public read access
CREATE POLICY "Public read access for recipe images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'recipe-images');
