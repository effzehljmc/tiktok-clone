-- Füge beide Testvideos ein
INSERT INTO videos (
  id,
  title,
  description,
  video_url,
  status,
  creator_id,
  created_at,
  updated_at
) VALUES 
(
  uuid_generate_v4(),
  'Vinyl',
  'Music playing',
  'https://wtzfdnzklxlnsgerdegk.supabase.co/storage/v1/object/public/videos//13044379_2160_3840_30fps.mp4',
  'PUBLISHED',
  'b728eed6-4738-46f7-ba79-2cb8f48b5ba4',
  NOW(),
  NOW()
),
(
  uuid_generate_v4(),
  'Horses',
  'Horses in a stable',
  'https://wtzfdnzklxlnsgerdegk.supabase.co/storage/v1/object/public/videos//12992394_2160_3840_30fps.mp4',
  'PUBLISHED',
  'b728eed6-4738-46f7-ba79-2cb8f48b5ba4',
  NOW(),
  NOW()
); 