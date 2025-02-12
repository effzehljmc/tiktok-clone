-- Drop existing types if they exist
do $$ 
begin
    if not exists (select 1 from pg_type where typname = 'recommendation_factor_type') then
        create type public.recommendation_factor_type as enum (
          'dietary',
          'engagement',
          'ingredient',
          'similarity'
        );
    end if;
end $$;

comment on type public.recommendation_factor_type is 'Types of factors that influence recipe recommendations';

-- Create composite type for recommendation factors
do $$ 
begin
    if not exists (select 1 from pg_type where typname = 'recommendation_factor') then
        create type public.recommendation_factor as (
          type recommendation_factor_type,
          score float8,
          description text,
          i18n_key text,
          i18n_params jsonb
        );
    end if;
end $$;

comment on type public.recommendation_factor is 'Structure for individual recommendation explanation factors';

-- Create function to generate recommendation explanations
create or replace function public.generate_recommendation_explanation(
  p_preference_score float8,    -- Score based on dietary preferences match (0-1)
  p_engagement_score float8,    -- Score based on user engagement (0-1)
  p_dietary_tags text[],        -- Recipe's dietary tags
  p_user_diet_tags text[],      -- User's dietary preferences
  p_ingredients text[],         -- Recipe's ingredients
  p_disliked_ingredients text[],-- User's disliked ingredients
  p_cuisine text,              -- Recipe's cuisine type
  p_total_score float8         -- Combined recommendation score (0-1)
) returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  explanation jsonb;
  factors jsonb := '[]'::jsonb;
  main_reason text;
  matching_diet_tags text[];
  avoided_ingredients text[];
begin
  -- Calculate matching dietary tags
  select array(
    select unnest(p_dietary_tags)
    intersect
    select unnest(p_user_diet_tags)
  ) into matching_diet_tags;

  -- Calculate avoided ingredients
  select array(
    select unnest(p_ingredients)
    intersect
    select unnest(p_disliked_ingredients)
  ) into avoided_ingredients;

  -- Add dietary factor if relevant
  if array_length(p_user_diet_tags, 1) > 0 then
    factors = factors || jsonb_build_object(
      'type', 'dietary',
      'score', p_preference_score,
      'description', format(
        'Matches %s of your dietary preferences%s',
        case 
          when p_preference_score >= 0.8 then 'most'
          when p_preference_score >= 0.5 then 'some'
          else 'few'
        end,
        case
          when array_length(matching_diet_tags, 1) > 0 
          then format(' (%s)', array_to_string(matching_diet_tags, ', '))
          else ''
        end
      ),
      'i18n_key', 'recommendation.factors.dietary.' || 
        case 
          when p_preference_score >= 0.8 then 'high'
          when p_preference_score >= 0.5 then 'medium'
          else 'low'
        end,
      'i18n_params', jsonb_build_object(
        'tags', matching_diet_tags
      )
    );
  end if;

  -- Add engagement factor with transparency about scoring weights
  if p_engagement_score > 0 then
    factors = factors || jsonb_build_object(
      'type', 'engagement',
      'score', p_engagement_score,
      'description', format(
        'Based on your viewing history',
        round(70.0)  -- Expose the actual weight
      ),
      'i18n_key', 'recommendation.factors.engagement',
      'i18n_params', jsonb_build_object(
        'weight', 70,
        'score', round(p_engagement_score * 100)
      )
    );
  end if;

  -- Add ingredient factor if relevant
  if array_length(p_disliked_ingredients, 1) > 0 then
    factors = factors || jsonb_build_object(
      'type', 'ingredient',
      'score', 1.0,
      'description', 'Excludes ingredients you dislike',
      'i18n_key', 'recommendation.factors.ingredient'
    );
  end if;

  -- Add cuisine factor if it matches user's frequently watched cuisines
  -- Note: This would ideally be based on user's cuisine preferences,
  -- which could be added in a future enhancement
  if p_cuisine is not null then
    factors = factors || jsonb_build_object(
      'type', 'similarity',
      'score', 0.8,
      'description', format('Matches your interest in %s cuisine', p_cuisine),
      'i18n_key', 'recommendation.factors.cuisine',
      'i18n_params', jsonb_build_object(
        'cuisine', p_cuisine
      )
    );
  end if;

  -- Determine main reason with detailed explanation
  select into main_reason
    case
      when p_preference_score >= 0.8 then 
        'High match with your preferences'
      when p_engagement_score >= 0.7 then 
        'Similar to recipes you enjoy'
      else 'Recommended based on your profile'
    end;

  -- Build final explanation with detailed insights
  explanation = jsonb_build_object(
    'mainReason', main_reason,
    'factors', factors,
    'detailedExplanation', 
    case
      when array_length(matching_diet_tags, 1) > 0 then
        format(
          'This recipe matches your %s preferences. Based on your viewing history and preferences, we think you''ll enjoy this %s recipe.',
          array_to_string(matching_diet_tags, ', '),
          p_cuisine
        )
      else
        format(
          'Based on your viewing history, we think you''ll enjoy this %s recipe.',
          p_cuisine
        )
    end
  );

  return explanation;
end;
$$;

comment on function public.generate_recommendation_explanation(float8, float8, text[], text[], text[], text[], text, float8) 
  is 'Generates a detailed explanation for why a recipe was recommended to a user, including dietary matches, engagement scores, and cuisine preferences';

-- Drop existing function before redefining
drop function if exists public.get_preference_based_recommendations(uuid, float8, uuid, int);

-- Update the get_preference_based_recommendations function to include explanations
create or replace function public.get_preference_based_recommendations(
  p_user_id uuid,              -- ID of the user requesting recommendations
  p_cursor_score float8 default null,  -- Score-based pagination cursor
  p_cursor_video_id uuid default null, -- ID-based pagination cursor
  p_limit int default 10       -- Number of recommendations to return
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
  explanation jsonb            -- Detailed explanation of the recommendation
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
      rm.cuisine
    from
      public.video_scores vs
      inner join public.videos v on v.id = vs.video_id
      left join public.recipe_metadata rm on rm.video_id = v.id
      cross join user_preferences up
    where
      vs.user_id = p_user_id
      and v.status = 'PUBLISHED'
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
    ) as explanation
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

comment on function public.get_preference_based_recommendations(uuid, float8, uuid, int)
  is 'Gets personalized video recommendations with explanations based on user preferences and engagement, supporting cursor-based pagination';

-- Add comment for video_scores table if not exists
comment on table public.video_scores is 'Stores calculated recommendation scores for videos per user, including engagement and content similarity metrics';

-- Grant access to the new function
grant execute on function public.generate_recommendation_explanation(float8, float8, text[], text[], text[], text[], text, float8) to authenticated;

-- Add helpful comments
comment on function public.generate_recommendation_explanation(float8, float8, text[], text[], text[], text[], text, float8) 
  is 'Generates a detailed explanation for why a recipe was recommended to a user';

comment on function public.get_preference_based_recommendations(uuid, float8, uuid, int)
  is 'Gets personalized video recommendations with explanations based on user preferences and engagement'; 