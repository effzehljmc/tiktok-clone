-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant access to User table
GRANT SELECT ON "User" TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON "User" TO authenticated;

-- Grant access to videos table
GRANT SELECT ON videos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON videos TO authenticated;

-- Grant access to likes table
GRANT SELECT ON likes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON likes TO authenticated;

-- Grant access to comments table
GRANT SELECT ON comments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON comments TO authenticated;

-- Grant access to followers table
GRANT SELECT ON followers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON followers TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated; 