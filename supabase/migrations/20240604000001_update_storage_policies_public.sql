-- Update storage policies to allow public access without authentication

-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their images" ON storage.objects;

-- Create new public policies
CREATE POLICY "Public can upload images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'images');

CREATE POLICY "Public can view images" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Public can update images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'images');

CREATE POLICY "Public can delete images" ON storage.objects
  FOR DELETE USING (bucket_id = 'images');
