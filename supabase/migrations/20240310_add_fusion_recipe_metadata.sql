-- Add recipe metadata for fusion videos
WITH 
video_1_id AS (
    SELECT id FROM videos 
    WHERE title = 'Japanese-Western Fusion Beef Bowl'
    ORDER BY created_at DESC
    LIMIT 1
),
video_2_id AS (
    SELECT id FROM videos 
    WHERE title = 'Contemporary Fusion Sushi Roll'
    ORDER BY created_at DESC
    LIMIT 1
),
video_3_id AS (
    SELECT id FROM videos 
    WHERE title = 'Latin Fusion Chilaquiles'
    ORDER BY created_at DESC
    LIMIT 1
),
video_4_id AS (
    SELECT id FROM videos 
    WHERE title = 'Artisanal Fusion Sushi Creation'
    ORDER BY created_at DESC
    LIMIT 1
)
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
    (SELECT id FROM video_1_id),
    ARRAY[
        'Thinly sliced beef (sukiyaki-cut)',
        'Sweet onions',
        'Eggs (for onsen tamago)',
        'Soy sauce',
        'Mirin',
        'Sake',
        'Sugar',
        'Black sesame seeds',
        'Steamed rice',
        'Green onions'
    ],
    30,
    'INTERMEDIATE',
    'Japanese Fusion',
    2,
    650,
    ARRAY['Rice cooker', 'Large pan', 'Small pot for eggs', 'Thermometer'],
    ARRAY['DAIRY_FREE'],
    '[
        {"timestamp": 0, "description": "Prepare onsen eggs by cooking at 63°C for 45 minutes"},
        {"timestamp": 60, "description": "Slice onions and prepare sauce mixture"},
        {"timestamp": 120, "description": "Cook beef and onions with sauce"},
        {"timestamp": 180, "description": "Assemble bowl with rice, beef, and onsen egg"},
        {"timestamp": 240, "description": "Garnish with sesame seeds and green onions"}
    ]'::jsonb
UNION ALL
SELECT 
    (SELECT id FROM video_2_id),
    ARRAY[
        'Sushi rice',
        'Nori sheets',
        'Fresh fish (salmon or tuna)',
        'Cream cheese',
        'Sun-dried tomatoes',
        'Microgreens',
        'Spicy mayo',
        'Soy glaze',
        'Rice vinegar',
        'Sesame seeds'
    ],
    45,
    'ADVANCED',
    'Japanese Fusion',
    4,
    420,
    ARRAY['Sushi mat', 'Rice cooker', 'Sharp knife', 'Cutting board'],
    ARRAY['GLUTEN_FREE'],
    '[
        {"timestamp": 0, "description": "Prepare sushi rice with vinegar seasoning"},
        {"timestamp": 60, "description": "Prepare fillings and slice fish"},
        {"timestamp": 120, "description": "Assemble roll with rice, nori, and fillings"},
        {"timestamp": 180, "description": "Roll and slice the sushi"},
        {"timestamp": 240, "description": "Plate and garnish with sauces and microgreens"}
    ]'::jsonb
UNION ALL
SELECT 
    (SELECT id FROM video_3_id),
    ARRAY[
        'Corn tortillas',
        'Shredded meat (chicken or pork)',
        'Eggs',
        'Red salsa',
        'White onion',
        'Crema',
        'Queso fresco',
        'Avocado',
        'Cilantro',
        'Lime'
    ],
    35,
    'INTERMEDIATE',
    'Latin Fusion',
    2,
    580,
    ARRAY['Large skillet', 'Small pan for eggs', 'Tongs', 'Blender for salsa'],
    ARRAY['GLUTEN_FREE'],
    '[
        {"timestamp": 0, "description": "Cut tortillas and fry until crispy"},
        {"timestamp": 60, "description": "Heat and season the shredded meat"},
        {"timestamp": 120, "description": "Fry eggs to desired doneness"},
        {"timestamp": 180, "description": "Layer chips, meat, and eggs"},
        {"timestamp": 240, "description": "Top with salsa, crema, cheese, and garnishes"}
    ]'::jsonb
UNION ALL
SELECT 
    (SELECT id FROM video_4_id),
    ARRAY[
        'Sushi-grade fish',
        'Cream cheese',
        'Sun-dried tomatoes',
        'Sushi rice',
        'Nori',
        'Spicy mayo',
        'Eel sauce',
        'Microgreens',
        'Tobiko',
        'Sesame seeds'
    ],
    50,
    'ADVANCED',
    'Japanese Fusion',
    3,
    480,
    ARRAY['Sushi mat', 'Rice cooker', 'Sharp knife', 'Torch for searing'],
    ARRAY['GLUTEN_FREE'],
    '[
        {"timestamp": 0, "description": "Prepare and season sushi rice"},
        {"timestamp": 60, "description": "Prepare all ingredients and sauces"},
        {"timestamp": 120, "description": "Assemble inside-out roll with creative layering"},
        {"timestamp": 180, "description": "Sear fish and add toppings"},
        {"timestamp": 240, "description": "Plate with artistic sauce presentation"}
    ]'::jsonb; 