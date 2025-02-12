-- Create recommendation feedback table
create table recommendation_feedback (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    video_id uuid not null references videos(id) on delete cascade,
    feedback_type text not null check (feedback_type in ('more_like_this', 'not_for_me')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    -- Ensure one feedback per video-user combination
    constraint unique_video_user_feedback unique (video_id, user_id)
);

-- Add indexes for performance
create index idx_recommendation_feedback_user on recommendation_feedback(user_id);
create index idx_recommendation_feedback_video on recommendation_feedback(video_id);
create index idx_recommendation_feedback_type on recommendation_feedback(feedback_type);

-- Add updated_at trigger
create trigger set_recommendation_feedback_timestamp
    before update on recommendation_feedback
    for each row
    execute function trigger_set_timestamp();

-- Enable RLS
alter table recommendation_feedback enable row level security;

-- RLS policies
create policy "Users can view their own feedback"
    on recommendation_feedback
    for select
    using (auth.uid() = user_id);

create policy "Users can insert their own feedback"
    on recommendation_feedback
    for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own feedback"
    on recommendation_feedback
    for update
    using (auth.uid() = user_id);

-- Function to handle recommendation feedback
create or replace function handle_recommendation_feedback(
    p_video_id uuid,
    p_feedback_type text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    v_user_id uuid;
    v_engagement_score float8;
    v_content_similarity_score float8;
begin
    -- Get current user ID
    v_user_id := auth.uid();
    
    -- Insert or update feedback
    insert into public.recommendation_feedback (
        user_id,
        video_id,
        feedback_type
    )
    values (
        v_user_id,
        p_video_id,
        p_feedback_type
    )
    on conflict (video_id, user_id)
    do update set
        feedback_type = excluded.feedback_type,
        updated_at = now();

    -- Adjust scores based on feedback
    select 
        engagement_score,
        content_similarity_score
    into
        v_engagement_score,
        v_content_similarity_score
    from
        public.video_scores
    where
        user_id = v_user_id
        and video_id = p_video_id;

    -- Update scores based on feedback type
    if p_feedback_type = 'more_like_this' then
        -- Boost both engagement and content similarity scores
        v_engagement_score := least(1.0, v_engagement_score * 1.2);
        v_content_similarity_score := least(1.0, v_content_similarity_score * 1.2);
    elsif p_feedback_type = 'not_for_me' then
        -- Reduce scores significantly
        v_engagement_score := greatest(0.0, v_engagement_score * 0.5);
        v_content_similarity_score := greatest(0.0, v_content_similarity_score * 0.5);
    end if;

    -- Update video scores
    update public.video_scores
    set
        engagement_score = v_engagement_score,
        content_similarity_score = v_content_similarity_score,
        total_score = v_engagement_score * 0.7 + v_content_similarity_score * 0.3,
        last_calculated_at = now()
    where
        user_id = v_user_id
        and video_id = p_video_id;
end;
$$;

-- Grant necessary permissions
grant usage on schema public to authenticated;
grant all on public.recommendation_feedback to authenticated;
grant execute on function handle_recommendation_feedback(uuid, text) to authenticated;

-- Drop existing function before redefining with new return type
drop function if exists public.get_preference_based_recommendations(uuid, float8, uuid, int);

-- Update get_preference_based_recommendations to exclude 'not_for_me' videos
create or replace function public.get_preference_based_recommendations(
    p_user_id uuid,
    p_cursor_score float8 default null,
    p_cursor_video_id uuid default null,
    p_limit int default 10
) returns table (
    id uuid,
    title text,
    description text,
    video_url text,
    thumbnail_url text,
    views_count bigint,
    likes_count bigint,
    comments_count bigint,
    category text,
    tags text[],
    recipe_metadata jsonb,
    total_score float8,
    engagement_score float8,
    content_similarity_score float8,
    preference_score float8,
    explanation jsonb,
    user_feedback text
)
language plpgsql
security invoker
set search_path = ''
as $$
begin
    return query
    with user_preferences as (
        select
            u.diet_tags,
            u.disliked_ingredients
        from
            public."User" u
        where
            u.id = p_user_id
    ),
    video_scores as (
        select
            v.id,
            v.title,
            v.description,
            v.video_url,
            v.thumbnail_url,
            v.views_count::bigint,
            v.likes_count::bigint,
            v.comments_count::bigint,
            v.category::text,
            v.tags,
            jsonb_build_object(
                'ingredients', rm.ingredients,
                'cookingTime', rm.cooking_time,
                'difficulty', rm.difficulty,
                'cuisine', rm.cuisine,
                'servings', rm.servings,
                'calories', rm.calories,
                'equipment', rm.equipment,
                'dietaryTags', rm.dietary_tags,
                'steps', rm.steps
            ) as recipe_metadata,
            vs.total_score as base_score,
            vs.engagement_score,
            vs.content_similarity_score,
            public.calculate_preference_match_score(
                rm.dietary_tags,
                up.diet_tags,
                rm.ingredients,
                up.disliked_ingredients
            ) as preference_score,
            rm.dietary_tags,
            rm.ingredients,
            rm.cuisine,
            rf.feedback_type as user_feedback
        from
            public.video_scores vs
            inner join public.videos v on v.id = vs.video_id
            left join public.recipe_metadata rm on rm.video_id = v.id
            left join public.recommendation_feedback rf on rf.video_id = v.id and rf.user_id = p_user_id
            cross join user_preferences up
        where
            vs.user_id = p_user_id
            and v.status = 'PUBLISHED'
            and (rf.feedback_type is null or rf.feedback_type != 'not_for_me')
    )
    select
        v.id,
        v.title,
        v.description,
        v.video_url,
        v.thumbnail_url,
        v.views_count::bigint,
        v.likes_count::bigint,
        v.comments_count::bigint,
        v.category,
        v.tags,
        v.recipe_metadata,
        (v.base_score * 0.7 + v.preference_score * 0.3) as total_score,
        v.engagement_score,
        v.content_similarity_score,
        v.preference_score,
        public.generate_recommendation_explanation(
            v.preference_score,
            v.engagement_score,
            v.dietary_tags,
            up.diet_tags,
            v.ingredients,
            up.disliked_ingredients,
            v.cuisine,
            (v.base_score * 0.7 + v.preference_score * 0.3)
        ) as explanation,
        v.user_feedback
    from
        video_scores v
        cross join user_preferences up
    where
        (
            p_cursor_score is null
            or
            (v.base_score, v.id) < (p_cursor_score, p_cursor_video_id)
        )
    order by
        total_score desc,
        v.id
    limit p_limit;
end;
$$;

-- Add comments
comment on table public.recommendation_feedback is 'Stores user feedback on recipe recommendations';
comment on function public.handle_recommendation_feedback(uuid, text) is 'Handles user feedback on recommendations and updates recommendation scores accordingly'; 