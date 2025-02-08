-- Create the AI response cache table
create table if not exists ai_response_cache (
  id uuid primary key default uuid_generate_v4(),
  cache_key text not null unique,
  response text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table ai_response_cache enable row level security;

-- Create policy to allow service role to read cache
create policy "Allow service role to read cache"
  on ai_response_cache
  for select
  to service_role
  using (true);

-- Create policy to allow service role to insert cache entries
create policy "Allow service role to insert cache"
  on ai_response_cache
  for insert
  to service_role
  with check (true);

-- Create policy to allow service role to update cache entries
create policy "Allow service role to update cache"
  on ai_response_cache
  for update
  to service_role
  using (true)
  with check (true);

-- Create policy to allow service role to delete cache entries
create policy "Allow service role to delete cache"
  on ai_response_cache
  for delete
  to service_role
  using (true);

-- Create index on cache_key for faster lookups
create index if not exists ai_response_cache_cache_key_idx on ai_response_cache(cache_key);

-- Add function to automatically update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Drop existing trigger if it exists
drop trigger if exists update_ai_response_cache_updated_at on ai_response_cache;

-- Create trigger to update updated_at on row update
create trigger update_ai_response_cache_updated_at
  before update on ai_response_cache
  for each row
  execute function update_updated_at_column(); 