-- Grant access to the saved_recipes table for authenticated users
grant usage on schema public to authenticated;
grant all on table public.saved_recipes to authenticated;

-- Recreate policies with explicit permissions
drop policy if exists "Users can read their own saved recipes" on public.saved_recipes;
drop policy if exists "Users can save recipes" on public.saved_recipes;
drop policy if exists "Users can unsave their recipes" on public.saved_recipes;

create policy "Users can read their own saved recipes"
on public.saved_recipes
for select
to authenticated
using (auth.uid()::text = user_id::text);

create policy "Users can save recipes"
on public.saved_recipes
for insert
to authenticated
with check (auth.uid()::text = user_id::text);

create policy "Users can unsave their recipes"
on public.saved_recipes
for delete
to authenticated
using (auth.uid()::text = user_id::text); 