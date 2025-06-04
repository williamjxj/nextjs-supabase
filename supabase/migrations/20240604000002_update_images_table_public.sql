-- Update images table and policies to allow public access

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can insert their own images" ON images;
DROP POLICY IF EXISTS "Users can view their own images" ON images;
DROP POLICY IF EXISTS "Users can update their own images" ON images;
DROP POLICY IF EXISTS "Users can delete their own images" ON images;

-- Make user_id optional (nullable)
ALTER TABLE images ALTER COLUMN user_id DROP NOT NULL;

-- Create new public policies
CREATE POLICY "Public can insert images" ON images
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view images" ON images
  FOR SELECT USING (true);

CREATE POLICY "Public can update images" ON images
  FOR UPDATE USING (true);

CREATE POLICY "Public can delete images" ON images
  FOR DELETE USING (true);
