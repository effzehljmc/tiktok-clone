-- Create the step_illustrations table
create table "public"."step_illustrations" (
    "id" uuid not null default uuid_generate_v4(),
    "recipe_id" uuid not null,
    "step_index" integer not null,
    "image_url" text not null,
    "created_at" timestamp with time zone not null default now(),
    
    constraint "step_illustrations_pkey" primary key ("id"),
    constraint "step_illustrations_recipe_id_fkey" foreign key ("recipe_id") references "public"."recipe_metadata"("id") on delete cascade,
    constraint "step_illustrations_recipe_id_step_index_key" unique ("recipe_id", "step_index")
);

-- Create index for faster lookups
create index "step_illustrations_recipe_id_idx" on "public"."step_illustrations" ("recipe_id");

-- Enable RLS
alter table "public"."step_illustrations" enable row level security;

-- Create policies
create policy "Enable read access for all users"
on "public"."step_illustrations"
for select
to authenticated
using (true);

create policy "Enable insert for authenticated users"
on "public"."step_illustrations"
for insert
to authenticated
with check (true);

create policy "Enable update for authenticated users"
on "public"."step_illustrations"
for update
to authenticated
using (true)
with check (true);

create policy "Enable delete for authenticated users"
on "public"."step_illustrations"
for delete
to authenticated
using (true);

-- Grant access to authenticated users
grant all on "public"."step_illustrations" to authenticated; 