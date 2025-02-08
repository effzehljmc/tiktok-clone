-- Add recipe details columns to videos table
alter table videos
add column if not exists ingredients text[] default '{}',
add column if not exists equipment text[] default '{}',
add column if not exists steps jsonb[] default '{}';

-- Add comments to explain the columns
comment on column videos.ingredients is 'Array of ingredients needed for the recipe';
comment on column videos.equipment is 'Array of equipment needed for the recipe';
comment on column videos.steps is 'Array of recipe steps with timestamp and description'; 