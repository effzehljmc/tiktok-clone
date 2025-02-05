-- Grant all permissions on all tables in public schema to service_role
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Grant usage on schema
    GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
    
    -- Grant all privileges on all tables in public schema
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'GRANT ALL ON TABLE public.' || quote_ident(r.tablename) || ' TO service_role';
    END LOOP;
    
    -- Grant all privileges on all sequences in public schema
    FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
        EXECUTE 'GRANT ALL ON SEQUENCE public.' || quote_ident(r.sequence_name) || ' TO service_role';
    END LOOP;
END $$; 