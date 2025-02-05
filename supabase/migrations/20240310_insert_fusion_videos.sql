-- Insert new fusion recipe videos
WITH 
video_1 AS (
    INSERT INTO videos (
        id,
        title,
        description,
        video_url,
        thumbnail_url,
        status,
        is_private,
        creator_id,
        category,
        tags,
        created_at,
        updated_at
    ) VALUES 
    (
        uuid_generate_v4(),
        'Japanese-Western Fusion Beef Bowl',
        'This dish appears to be a fusion recipe that combines Japanese and Western culinary styles. It features thinly sliced beef cooked with onions in a savory-sweet sauce, topped with a perfectly cooked onsen egg and black sesame seeds.',
        'https://wtzfdnzklxlnsgerdegk.supabase.co/storage/v1/object/public/videos//0205%20(1).mov',
        'https://wtzfdnzklxlnsgerdegk.supabase.co/storage/v1/object/public/videos//Bildschirmfoto%202025-02-05%20um%2012.44.03.png',
        'PUBLISHED',
        false,
        'ded51478-3c4f-466d-aa1a-305997cfc3e1',
        'COOKING',
        ARRAY['fusion', 'japanese', 'beef', 'egg', 'onsen egg', 'asian fusion'],
        NOW(),
        NOW()
    ) RETURNING id
),
video_2 AS (
    INSERT INTO videos (
        id,
        title,
        description,
        video_url,
        thumbnail_url,
        status,
        is_private,
        creator_id,
        category,
        tags,
        created_at,
        updated_at
    ) VALUES 
    (
        uuid_generate_v4(),
        'Contemporary Fusion Sushi Roll',
        'A sophisticated sushi roll combining traditional Japanese elements with contemporary Western influences. Features cream cheese, sun-dried tomatoes, fresh greens, and seared fish, topped with spicy mayo and sweet soy glaze.',
        'https://wtzfdnzklxlnsgerdegk.supabase.co/storage/v1/object/public/videos//0205%20(1)(1).mov',
        'https://wtzfdnzklxlnsgerdegk.supabase.co/storage/v1/object/public/videos//Bildschirmfoto%202025-02-05%20um%2012.46.29.png',
        'PUBLISHED',
        false,
        'ded51478-3c4f-466d-aa1a-305997cfc3e1',
        'COOKING',
        ARRAY['fusion', 'japanese', 'sushi', 'cream cheese', 'contemporary', 'asian fusion'],
        NOW(),
        NOW()
    ) RETURNING id
),
video_3 AS (
    INSERT INTO videos (
        id,
        title,
        description,
        video_url,
        thumbnail_url,
        status,
        is_private,
        creator_id,
        category,
        tags,
        created_at,
        updated_at
    ) VALUES 
    (
        uuid_generate_v4(),
        'Latin Fusion Chilaquiles',
        'A hearty and indulgent fusion creation blending Latin American comfort food with modern gourmet elements. Crispy tortilla chips topped with slow-cooked shredded meat and a perfect fried egg.',
        'https://wtzfdnzklxlnsgerdegk.supabase.co/storage/v1/object/public/videos//0205%20(1)(3).mov',
        'https://wtzfdnzklxlnsgerdegk.supabase.co/storage/v1/object/public/videos//Bildschirmfoto%202025-02-05%20um%2012.46.45.png',
        'PUBLISHED',
        false,
        'ded51478-3c4f-466d-aa1a-305997cfc3e1',
        'COOKING',
        ARRAY['fusion', 'latin', 'mexican', 'chilaquiles', 'comfort food', 'breakfast'],
        NOW(),
        NOW()
    ) RETURNING id
),
video_4 AS (
    INSERT INTO videos (
        id,
        title,
        description,
        video_url,
        thumbnail_url,
        status,
        is_private,
        creator_id,
        category,
        tags,
        created_at,
        updated_at
    ) VALUES 
    (
        uuid_generate_v4(),
        'Artisanal Fusion Sushi Creation',
        'A beautifully crafted fusion dish blending traditional sushi elements with innovative presentation. Features cream cheese, sun-dried tomatoes, seared fish, and artistic sauce presentation.',
        'https://wtzfdnzklxlnsgerdegk.supabase.co/storage/v1/object/public/videos//0205%20(1)(2).mov',
        'https://wtzfdnzklxlnsgerdegk.supabase.co/storage/v1/object/public/videos//Bildschirmfoto%202025-02-05%20um%2012.46.29.png',
        'PUBLISHED',
        false,
        'ded51478-3c4f-466d-aa1a-305997cfc3e1',
        'COOKING',
        ARRAY['fusion', 'japanese', 'sushi', 'artisanal', 'contemporary', 'asian fusion'],
        NOW(),
        NOW()
    ) RETURNING id
)
SELECT 'Videos inserted successfully' as result; 