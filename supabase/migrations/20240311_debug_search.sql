-- Check if videos have categories assigned
SELECT v.id, v.title, v.category, rm.dietary_tags
FROM videos v
LEFT JOIN recipe_metadata rm ON v.id = rm.video_id
WHERE v.status = 'PUBLISHED'
  AND v.is_private = false;

-- Test the search function directly
SELECT v.id, v.title, v.category, rm.dietary_tags
FROM videos v
LEFT JOIN recipe_metadata rm ON v.id = rm.video_id
WHERE v.status = 'PUBLISHED'
  AND v.is_private = false
  AND v.category = 'BREAKFAST'
  AND rm.dietary_tags @> ARRAY['VEGETARIAN'];

-- Check if the array contains operator is working correctly
SELECT v.id, v.title, v.category, rm.dietary_tags
FROM videos v
LEFT JOIN recipe_metadata rm ON v.id = rm.video_id
WHERE v.status = 'PUBLISHED'
  AND v.is_private = false
  AND rm.dietary_tags IS NOT NULL; 