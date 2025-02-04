-- Enable RLS on the videos table
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to published videos
CREATE POLICY "Public videos are viewable by everyone" ON videos
  FOR SELECT
  USING (
    status = 'PUBLISHED'
    AND is_private = false
  );

-- Create policy for authenticated users to view their own private videos
CREATE POLICY "Users can view their own videos" ON videos
  FOR SELECT
  USING (creator_id = auth.uid());

-- Create policy for authenticated users to create videos
CREATE POLICY "Users can create their own videos" ON videos
  FOR INSERT
  WITH CHECK (creator_id = auth.uid());

-- Create policy for authenticated users to update their own videos
CREATE POLICY "Users can update their own videos" ON videos
  FOR UPDATE
  USING (creator_id = auth.uid())
  WITH CHECK (creator_id = auth.uid());

-- Create policy for authenticated users to delete their own videos
CREATE POLICY "Users can delete their own videos" ON videos
  FOR DELETE
  USING (creator_id = auth.uid()); 