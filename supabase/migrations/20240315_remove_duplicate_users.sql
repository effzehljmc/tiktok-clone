-- First drop the foreign key constraint
ALTER TABLE IF EXISTS public.recipe_variations 
  DROP CONSTRAINT IF EXISTS recipe_variations_user_id_fkey;

-- Then recreate the foreign key to point to the correct User table
ALTER TABLE IF EXISTS public.recipe_variations
  ADD CONSTRAINT recipe_variations_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES "User"(id) ON DELETE CASCADE;

-- Finally drop the duplicate users table
DROP TABLE IF EXISTS public.users; 