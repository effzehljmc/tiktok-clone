-- Create saved_recipes table
create table "public"."saved_recipes" (
  id uuid not null default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  video_id uuid not null references videos(id) on delete cascade,
  saved_at timestamptz not null default now(),
  constraint saved_recipes_pkey primary key (id),
  constraint saved_recipes_user_id_video_id_key unique (user_id, video_id)
);

-- Enable RLS
alter table "public"."saved_recipes" enable row level security;

-- Create policies
create policy "Users can read their own saved recipes"
on "public"."saved_recipes"
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can save recipes"
on "public"."saved_recipes"
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can unsave their recipes"
on "public"."saved_recipes"
for delete
to authenticated
using (auth.uid() = user_id); 