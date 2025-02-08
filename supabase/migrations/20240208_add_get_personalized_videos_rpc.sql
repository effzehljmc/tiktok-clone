-- Create a function to get personalized videos with proper vector operations
create or replace function public.get_personalized_videos(
  p_user_id uuid,
  p_cursor_score float8 default null,
  p_cursor_video_id uuid default null,
  p_limit int default 5
)
returns table (
  id uuid,
  title text,
  description text,
  video_url text,
  thumbnail_url text,
  views_count int,
  likes_count int,
  comments_count int,
  category text,
  tags text[],
  recipe_metadata jsonb,
  total_score float8,
  engagement_score float8,
  content_similarity_score float8
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  user_embedding vector;
begin
  -- Get the user's embedding
  select embedding_vector into user_embedding
  from public.user_embeddings
  where user_id = p_user_id
  limit 1;

  return query
  select
    v.id,
    v.title,
    v.description,
    v.video_url,
    v.thumbnail_url,
    v.views_count,
    v.likes_count,
    v.comments_count,
    v.category::text as category,
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
    vs.total_score,
    vs.engagement_score,
    vs.content_similarity_score
  from
    public.video_scores as vs
    inner join public.videos as v on v.id = vs.video_id
    left join public.recipe_metadata as rm on rm.video_id = v.id
  where
    vs.user_id = p_user_id
    and v.status = 'PUBLISHED'
    and (
      p_cursor_score is null
      or
      (vs.total_score, v.id) < (p_cursor_score, p_cursor_video_id)
    )
  order by
    vs.total_score desc,
    v.id
  limit p_limit;
end;
$$;

-- Grant access to the function
grant execute on function public.get_personalized_videos(
  uuid,
  float8,
  uuid,
  int
) to authenticated;

comment on function public.get_personalized_videos(
  uuid,
  float8,
  uuid,
  int
) is 'Gets personalized videos for a user with cursor-based pagination'; 