-- Fix User table permissions
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Grant permissions to service role and authenticated users
GRANT ALL ON "User" TO service_role;
GRANT ALL ON "User" TO authenticated;
GRANT SELECT ON "User" TO anon;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all profiles" ON "User";
DROP POLICY IF EXISTS "Users can insert their own profile" ON "User";
DROP POLICY IF EXISTS "Users can update their own profile" ON "User";
DROP POLICY IF EXISTS "Service role can create user profiles" ON "User";
DROP POLICY IF EXISTS "Service role can update user profiles" ON "User";

-- Create policies for User table
CREATE POLICY "Users can view all profiles"
ON "User"
FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can insert their own profile"
ON "User"
FOR INSERT
TO authenticated
WITH CHECK (auth.uid()::uuid = id);

CREATE POLICY "Users can update their own profile"
ON "User"
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can create user profiles"
ON "User"
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update user profiles"
ON "User"
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Create a function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public."User" (id, email, username, "createdAt", "updatedAt")
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        username = COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        "updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile after auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user(); 