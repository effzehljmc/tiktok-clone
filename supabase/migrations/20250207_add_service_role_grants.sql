-- Grant permissions to service_role
GRANT ALL ON TABLE videos TO service_role;
GRANT ALL ON TABLE recipe_metadata TO service_role;

-- Grant usage on sequences (if any)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role; 