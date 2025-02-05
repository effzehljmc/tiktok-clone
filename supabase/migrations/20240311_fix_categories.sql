-- Fix categories for recipes
UPDATE videos
SET category = 'BREAKFAST'
WHERE id = '0e426e4d-eb7f-422d-b397-0e186277d80c'; -- Healthy Breakfast Muesli

-- Verify all recipes have the correct categories
SELECT v.id, v.title, v.category, rm.dietary_tags
FROM videos v
LEFT JOIN recipe_metadata rm ON v.id = rm.video_id
WHERE v.status = 'PUBLISHED'
  AND v.is_private = false
ORDER BY v.category; 