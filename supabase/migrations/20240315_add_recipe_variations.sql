-- Create the variation_type enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE public.variation_type AS ENUM (
    'DIETARY',
    'INGREDIENT_SUBSTITUTION',
    'PORTION_ADJUSTMENT',
    'COOKING_METHOD',
    'FLAVOR_PROFILE'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create the recipe_variations table
CREATE TABLE IF NOT EXISTS public.recipe_variations (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES public.recipe_metadata(id) ON DELETE CASCADE,
  title text,
  ingredients text[] NOT NULL DEFAULT '{}',
  equipment text[] NOT NULL DEFAULT '{}',
  steps jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  ai_prompt text NOT NULL,
  original_prompt text NOT NULL,
  variation_type variation_type NOT NULL,
  metadata jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS recipe_variations_user_id_idx ON public.recipe_variations(user_id);
CREATE INDEX IF NOT EXISTS recipe_variations_recipe_id_idx ON public.recipe_variations(recipe_id);

-- Enable RLS
ALTER TABLE public.recipe_variations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own recipe variations" ON public.recipe_variations;
  CREATE POLICY "Users can view their own recipe variations"
    ON public.recipe_variations
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION WHEN undefined_object THEN 
  NULL;
END $$;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can create their own recipe variations" ON public.recipe_variations;
  CREATE POLICY "Users can create their own recipe variations"
    ON public.recipe_variations
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN undefined_object THEN 
  NULL;
END $$;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can update their own recipe variations" ON public.recipe_variations;
  CREATE POLICY "Users can update their own recipe variations"
    ON public.recipe_variations
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN undefined_object THEN 
  NULL;
END $$;

DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can delete their own recipe variations" ON public.recipe_variations;
  CREATE POLICY "Users can delete their own recipe variations"
    ON public.recipe_variations
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION WHEN undefined_object THEN 
  NULL;
END $$;

-- Grant access to authenticated users
GRANT ALL ON public.recipe_variations TO authenticated;
GRANT USAGE ON TYPE public.variation_type TO authenticated; 