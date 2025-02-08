-- Drop policies first
DROP POLICY IF EXISTS "Users can view their own recipe variations" ON public.recipe_variations;
DROP POLICY IF EXISTS "Users can create their own recipe variations" ON public.recipe_variations;
DROP POLICY IF EXISTS "Users can update their own recipe variations" ON public.recipe_variations;
DROP POLICY IF EXISTS "Users can delete their own recipe variations" ON public.recipe_variations;

-- Drop the table
DROP TABLE IF EXISTS public.recipe_variations;

-- Drop the enum type
DROP TYPE IF EXISTS public.variation_type; 
