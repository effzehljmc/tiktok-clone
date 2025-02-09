-- Function to calculate preference match score
create or replace function public.calculate_preference_match_score(
  video_dietary_tags text[],
  user_diet_tags text[],
  video_ingredients text[],
  user_disliked_ingredients text[]
) returns float8
language plpgsql
security invoker
set search_path = ''
as $$
declare
  dietary_match_score float8;
  ingredient_penalty float8;
  strict_diet_tags text[] := array['VEGAN', 'VEGETARIAN', 'GLUTEN_FREE', 'DAIRY_FREE', 'NUT_FREE', 'HALAL', 'KOSHER'];
  user_strict_tags text[];
  normalized_video_tags text[];
  normalized_user_tags text[];
  has_strict_violation boolean;
begin
  -- Debug input parameters
  raise notice 'Input parameters:';
  raise notice 'video_dietary_tags: %', video_dietary_tags;
  raise notice 'user_diet_tags: %', user_diet_tags;
  raise notice 'video_ingredients: %', array_length(video_ingredients, 1);
  raise notice 'user_disliked_ingredients: %', array_length(user_disliked_ingredients, 1);

  -- Early return if no video tags
  if video_dietary_tags is null or array_length(video_dietary_tags, 1) = 0 then
    raise notice 'No video dietary tags, returning 0.5';
    return 0.5;
  end if;

  -- Early return if no user preferences
  if user_diet_tags is null or array_length(user_diet_tags, 1) = 0 then
    raise notice 'No user dietary tags, returning 0.8';
    return 0.8; -- Slightly favor recipes even without preferences
  end if;

  -- Normalize arrays (convert to uppercase for consistent comparison)
  normalized_video_tags := array(
    select upper(trim(tag))
    from unnest(video_dietary_tags) as tag
    where tag is not null and trim(tag) != ''
  );
  
  normalized_user_tags := array(
    select upper(trim(tag))
    from unnest(user_diet_tags) as tag
    where tag is not null and trim(tag) != ''
  );

  raise notice 'Normalized tags:';
  raise notice 'video: %', normalized_video_tags;
  raise notice 'user: %', normalized_user_tags;

  -- Get user's strict dietary requirements
  user_strict_tags := array(
    select unnest(normalized_user_tags)
    intersect
    select unnest(strict_diet_tags)
  );

  raise notice 'User strict tags: %', user_strict_tags;

  -- Check for strict dietary violations
  if array_length(user_strict_tags, 1) > 0 then
    has_strict_violation := not exists (
      select 1
      from unnest(user_strict_tags) as user_tag
      where exists (
        select 1
        from unnest(normalized_video_tags) as video_tag
        where video_tag = user_tag
      )
    );

    raise notice 'Strict violation check - has violation: %', has_strict_violation;

    if has_strict_violation then
      raise notice 'Strict dietary violation found - returning 0';
      return 0.0;
    end if;
  end if;

  -- Calculate dietary match score
  select count(*)::float8 / array_length(normalized_user_tags, 1)::float8
  into dietary_match_score
  from (
    select unnest(normalized_video_tags)
    intersect
    select unnest(normalized_user_tags)
  ) as matching_tags;

  raise notice 'Initial dietary match score: %', dietary_match_score;

  -- If we have a strict tag match, boost the score
  if array_length(user_strict_tags, 1) > 0 and not has_strict_violation then
    dietary_match_score := dietary_match_score * 1.2; -- 20% boost for matching strict requirements
    raise notice 'Boosted dietary match score: %', dietary_match_score;
  end if;

  -- Calculate ingredient penalty
  if array_length(user_disliked_ingredients, 1) > 0 and array_length(video_ingredients, 1) > 0 then
    select count(*)::float8 / array_length(video_ingredients, 1)::float8
    into ingredient_penalty
    from (
      select upper(trim(unnest(video_ingredients)))
      intersect
      select upper(trim(unnest(user_disliked_ingredients)))
    ) as matching_ingredients;

    -- Scale penalty to be less aggressive
    ingredient_penalty := ingredient_penalty * 0.5; -- 50% reduction in penalty impact
  else
    ingredient_penalty := 0.0;
  end if;

  raise notice 'Ingredient penalty: %', ingredient_penalty;

  -- Calculate final score
  declare
    final_score float8;
  begin
    final_score := greatest(0.0, least(1.0, dietary_match_score * (1.0 - ingredient_penalty)));
    
    raise notice 'Final score calculation: % * (1 - %) = %',
      dietary_match_score, ingredient_penalty, final_score;
    
    return final_score;
  end;
end;
$$;

-- Enhanced personalized videos function with preference matching
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
  preference_score float8
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
      ) as preference_score
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
    v.preference_score
  from
    video_scores v
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

-- Grant access to the functions
grant execute on function public.calculate_preference_match_score(text[], text[], text[], text[]) to authenticated;
grant execute on function public.get_preference_based_recommendations(uuid, float8, uuid, int) to authenticated;

comment on function public.calculate_preference_match_score(text[], text[], text[], text[]) 
  is 'Calculates a match score between video attributes and user preferences';
comment on function public.get_preference_based_recommendations(uuid, float8, uuid, int)
  is 'Gets personalized video recommendations considering user dietary preferences and restrictions'; 