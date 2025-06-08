-- Create image_downloads table to track user downloads for subscription limits
CREATE TABLE image_downloads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX idx_image_downloads_user_id ON image_downloads(user_id);
CREATE INDEX idx_image_downloads_created_at ON image_downloads(created_at);

-- Enable RLS
ALTER TABLE image_downloads ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can only see their own download records
CREATE POLICY "Users can view own downloads" ON image_downloads FOR SELECT USING (auth.uid() = user_id);

-- RLS policy: Users can insert their own download records
CREATE POLICY "Users can insert own downloads" ON image_downloads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policy: No updates or deletes allowed
CREATE POLICY "No updates allowed" ON image_downloads FOR UPDATE USING (false);
CREATE POLICY "No deletes allowed" ON image_downloads FOR DELETE USING (false);
