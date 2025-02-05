-- First, insert the videos
WITH 
video_1 AS (
    INSERT INTO videos (
        id,
        title,
        description,
        video_url,
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
        'Perfect Avocado Toast with Eggs',
        'Start your day with this delicious and nutritious avocado toast topped with perfectly cooked eggs.',
        'https://wtzfdnzklxlnsgerdegk.supabase.co/storage/v1/object/public/videos//avocado_toast.mov',
        'PUBLISHED',
        false,
        '851c8ed6-7398-4540-a468-7fce7e618cd6',
        'COOKING',
        ARRAY['breakfast', 'healthy', 'avocado', 'eggs'],
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
        'Healthy Breakfast Muesli with Yogurt',
        'A refreshing and healthy breakfast bowl with muesli, yogurt, and fresh fruits.',
        'https://wtzfdnzklxlnsgerdegk.supabase.co/storage/v1/object/public/videos//breakfast.mov',
        'PUBLISHED',
        false,
        '851c8ed6-7398-4540-a468-7fce7e618cd6',
        'COOKING',
        ARRAY['breakfast', 'healthy', 'yogurt', 'muesli'],
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
        'Decadent Chocolate Cake',
        'Indulge in this rich and moist chocolate cake that is perfect for any celebration.',
        'https://wtzfdnzklxlnsgerdegk.supabase.co/storage/v1/object/public/videos//chocolate_cake.mov',
        'PUBLISHED',
        false,
        '851c8ed6-7398-4540-a468-7fce7e618cd6',
        'COOKING',
        ARRAY['dessert', 'baking', 'chocolate', 'cake'],
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
        'Fresh Homemade Guacamole',
        'Quick and easy blender guacamole that is perfect for dipping or as a spread.',
        'https://wtzfdnzklxlnsgerdegk.supabase.co/storage/v1/object/public/videos//guacamole.mov',
        'PUBLISHED',
        false,
        '851c8ed6-7398-4540-a468-7fce7e618cd6',
        'COOKING',
        ARRAY['appetizer', 'mexican', 'avocado', 'dip'],
        NOW(),
        NOW()
    ) RETURNING id
),
video_5 AS (
    INSERT INTO videos (
        id,
        title,
        description,
        video_url,
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
        'Pan-Seared Salmon with Fresh Salad',
        'Learn how to cook the perfect salmon fillet served with a crisp, refreshing salad.',
        'https://wtzfdnzklxlnsgerdegk.supabase.co/storage/v1/object/public/videos//salmon.mov',
        'PUBLISHED',
        false,
        '851c8ed6-7398-4540-a468-7fce7e618cd6',
        'COOKING',
        ARRAY['dinner', 'seafood', 'healthy', 'salad'],
        NOW(),
        NOW()
    ) RETURNING id
)
-- Then, insert the recipe metadata
INSERT INTO recipe_metadata (
    video_id,
    ingredients,
    cooking_time,
    difficulty,
    cuisine,
    servings,
    calories,
    equipment,
    dietary_tags,
    steps
) 
SELECT 
    (SELECT id FROM video_1),
    ARRAY[
        '2 slices sourdough bread',
        '1 ripe avocado',
        '2 eggs',
        'Salt and pepper to taste',
        'Red pepper flakes',
        'Extra virgin olive oil',
        'Optional: microgreens for garnish'
    ],
    15,
    'BEGINNER',
    'Modern',
    2,
    420,
    ARRAY['Toaster', 'Small pan', 'Bowl', 'Fork'],
    ARRAY['VEGETARIAN'],
    '[
        {"timestamp": 0, "description": "Toast the bread until golden brown"},
        {"timestamp": 60, "description": "Mash the avocado with salt and pepper"},
        {"timestamp": 120, "description": "Spread avocado on toast"},
        {"timestamp": 180, "description": "Cook eggs to your preference"},
        {"timestamp": 300, "description": "Top toast with eggs and garnish"}
    ]'::jsonb
FROM video_1
UNION ALL
SELECT 
    (SELECT id FROM video_2),
    ARRAY[
        'Greek yogurt',
        'Muesli mix',
        'Honey',
        'Mixed berries',
        'Banana',
        'Chia seeds',
        'Nuts for topping'
    ],
    10,
    'BEGINNER',
    'International',
    1,
    380,
    ARRAY['Bowl', 'Measuring cups', 'Spoon'],
    ARRAY['VEGETARIAN'],
    '[
        {"timestamp": 0, "description": "Pour yogurt into bowl"},
        {"timestamp": 60, "description": "Add muesli and mix"},
        {"timestamp": 120, "description": "Add sliced fruits"},
        {"timestamp": 180, "description": "Top with honey and seeds"},
        {"timestamp": 240, "description": "Mix and serve immediately"}
    ]'::jsonb
FROM video_2
UNION ALL
SELECT 
    (SELECT id FROM video_3),
    ARRAY[
        '2 cups all-purpose flour',
        '2 cups sugar',
        '3/4 cup cocoa powder',
        '2 eggs',
        '1 cup milk',
        '1/2 cup vegetable oil',
        '2 tsp vanilla extract',
        'Chocolate frosting'
    ],
    90,
    'INTERMEDIATE',
    'American',
    8,
    450,
    ARRAY['Mixing bowls', 'Cake pan', 'Electric mixer', 'Measuring cups'],
    ARRAY['VEGETARIAN'],
    '[
        {"timestamp": 0, "description": "Mix dry ingredients"},
        {"timestamp": 120, "description": "Combine wet ingredients"},
        {"timestamp": 240, "description": "Mix wet and dry ingredients"},
        {"timestamp": 360, "description": "Pour into prepared pan"},
        {"timestamp": 480, "description": "Bake and let cool before frosting"}
    ]'::jsonb
FROM video_3
UNION ALL
SELECT 
    (SELECT id FROM video_4),
    ARRAY[
        '3 ripe avocados',
        '1 lime, juiced',
        '1 small onion',
        '2 tomatoes',
        'Fresh cilantro',
        'Salt and pepper',
        'Jalapeño (optional)'
    ],
    15,
    'BEGINNER',
    'Mexican',
    4,
    180,
    ARRAY['Blender or food processor', 'Bowl', 'Knife'],
    ARRAY['VEGAN', 'GLUTEN_FREE', 'DAIRY_FREE'],
    '[
        {"timestamp": 0, "description": "Roughly chop vegetables"},
        {"timestamp": 60, "description": "Add all ingredients to blender"},
        {"timestamp": 120, "description": "Pulse until desired consistency"},
        {"timestamp": 180, "description": "Season to taste"},
        {"timestamp": 240, "description": "Chill before serving"}
    ]'::jsonb
FROM video_4
UNION ALL
SELECT 
    (SELECT id FROM video_5),
    ARRAY[
        '2 salmon fillets',
        'Mixed salad greens',
        'Cherry tomatoes',
        'Cucumber',
        'Olive oil',
        'Lemon',
        'Salt and pepper'
    ],
    25,
    'INTERMEDIATE',
    'International',
    2,
    520,
    ARRAY['Skillet', 'Salad bowl', 'Sharp knife'],
    ARRAY['GLUTEN_FREE', 'DAIRY_FREE'],
    '[
        {"timestamp": 0, "description": "Season salmon fillets"},
        {"timestamp": 60, "description": "Heat pan and add oil"},
        {"timestamp": 120, "description": "Cook salmon skin-side up"},
        {"timestamp": 240, "description": "Flip and finish cooking"},
        {"timestamp": 360, "description": "Prepare and dress salad"}
    ]'::jsonb
FROM video_5; 