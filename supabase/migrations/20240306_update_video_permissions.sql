-- Grant permissions to update embeddings
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Allow service role to update embeddings
CREATE POLICY "Service role can update embeddings"
ON videos
FOR UPDATE
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Grant permissions to the service role
GRANT ALL ON videos TO service_role;

-- Grant usage on the schema
GRANT USAGE ON SCHEMA public TO service_role; 