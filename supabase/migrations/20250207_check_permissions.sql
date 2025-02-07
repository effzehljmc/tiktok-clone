-- 1. Check RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('videos', 'recipe_metadata');

-- 2. Test basic select
SELECT *
FROM recipe_metadata
LIMIT 5;

-- 3. Test the exact join we're using in our script
SELECT v.id, v.title, v.description, v.tags,
       rm.ingredients, rm.cooking_time, rm.difficulty, rm.cuisine, rm.dietary_tags
FROM videos v
LEFT JOIN recipe_metadata rm ON rm.video_id = v.id
WHERE v.embedding_vector IS NULL
LIMIT 5;

-- 4. Check current grants
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'recipe_metadata'; 