-- Create type constraint for illustration_style
do $$
begin
  create type "public"."illustration_style_enum" as enum (
    'photorealistic',
    'minimalistic',
    'cartoon',
    'line-art',
    'watercolor'
  );
exception
  when duplicate_object then null;
end $$;

-- Add illustration_style column to users table with the correct type
alter table "public"."User"
add column "illustration_style" "public"."illustration_style_enum" not null default 'photorealistic'::"public"."illustration_style_enum";

-- Add comment to explain the column
comment on column "public"."User"."illustration_style" is 'The user''s preferred style for recipe step illustrations'; 