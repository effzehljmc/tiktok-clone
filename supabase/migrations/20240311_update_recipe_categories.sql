-- Update categories for existing recipe videos
UPDATE videos
SET category = 'BREAKFAST'
WHERE id IN (
    'ca2801fc-3d31-47cf-ae23-756776e2cfd0', -- Avocado Toast
    '0e426e4d-eb7f-422c-b397-0e186277d80c'  -- Healthy Breakfast Muesli
);

UPDATE videos
SET category = 'DINNER'
WHERE id IN (
    'af102917-09de-46dd-ab57-c7d5ed2a301c', -- Japanese-Western Fusion Beef Bowl
    '0157248d-fb0f-424d-a4fe-3d3d34b6d7bf', -- Pan-Seared Salmon
    '00b819e3-939c-4291-9fff-8a35e66a543f'  -- Latin Fusion Chilaquiles
);

UPDATE videos
SET category = 'DESSERT'
WHERE id IN (
    'e57e87e6-bbc6-4a52-becf-0c04943442e4'  -- Chocolate Cake
);

UPDATE videos
SET category = 'SNACKS'
WHERE id IN (
    '59739bae-7ae5-482f-ae97-d9ad5f2ceb65'  -- Fresh Homemade Guacamole
);

-- Update sushi recipes to DINNER category
UPDATE videos
SET category = 'DINNER'
WHERE id IN (
    '140153f8-ab69-45f1-a4c8-9c34b4456ce3', -- Contemporary Fusion Sushi Roll
    'b448bbc6-adcd-4812-aad0-46696341952a'  -- Artisanal Fusion Sushi Creation
); 