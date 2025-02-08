-- Add diet_tags and disliked_ingredients columns to users table
ALTER TABLE "public"."User" 
ADD COLUMN IF NOT EXISTS "diet_tags" text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "disliked_ingredients" text[] DEFAULT '{}';

-- Comment on columns
COMMENT ON COLUMN "public"."User"."diet_tags" IS 'User dietary preferences (e.g., vegetarian, vegan)';
COMMENT ON COLUMN "public"."User"."disliked_ingredients" IS 'List of ingredients the user dislikes'; 