-- Enable RLS
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_metadata ENABLE ROW LEVEL SECURITY;

-- Create policies for videos
CREATE POLICY "Enable read access for all users" ON videos
    FOR SELECT USING (true);

CREATE POLICY "Enable update for service role" ON videos
    FOR UPDATE USING (auth.role() = 'service_role');

-- Create policies for recipe_metadata
CREATE POLICY "Enable read access for all users" ON recipe_metadata
    FOR SELECT USING (true);

CREATE POLICY "Enable update for service role" ON recipe_metadata
    FOR UPDATE USING (auth.role() = 'service_role'); 