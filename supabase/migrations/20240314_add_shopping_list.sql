-- Create the shopping_list table
create table if not exists shopping_list (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid not null,
    ingredient text not null,
    quantity text,
    unit text,
    is_checked boolean default false,
    recipe_id uuid,
    created_at timestamptz(6) default now(),
    updated_at timestamptz(6) default now(),
    constraint fk_shopping_list_user foreign key (user_id) references auth.users(id) on delete cascade,
    constraint fk_shopping_list_recipe foreign key (recipe_id) references videos(id) on delete set null
);

-- Create indexes
create index if not exists shopping_list_user_id_idx on shopping_list(user_id);
create index if not exists shopping_list_recipe_id_idx on shopping_list(recipe_id);

-- Add RLS policies
alter table shopping_list enable row level security;

do $$ begin
    create policy "Users can view their own shopping list"
        on shopping_list for select
        using (auth.uid() = user_id);
    exception when duplicate_object then null;
end $$;

do $$ begin
    create policy "Users can insert into their own shopping list"
        on shopping_list for insert
        with check (auth.uid() = user_id);
    exception when duplicate_object then null;
end $$;

do $$ begin
    create policy "Users can update their own shopping list items"
        on shopping_list for update
        using (auth.uid() = user_id)
        with check (auth.uid() = user_id);
    exception when duplicate_object then null;
end $$;

do $$ begin
    create policy "Users can delete their own shopping list items"
        on shopping_list for delete
        using (auth.uid() = user_id);
    exception when duplicate_object then null;
end $$;

-- Create updated_at trigger
create or replace function handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

do $$ begin
    create trigger set_updated_at
        before update on shopping_list
        for each row
        execute function handle_updated_at();
    exception when duplicate_object then null;
end $$;

-- Grant permissions
grant all on shopping_list to authenticated;
grant usage on all sequences in schema public to authenticated; 