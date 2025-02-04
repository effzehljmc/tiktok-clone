-- Create a function to increment the comments count for a video
create or replace function increment_comments_count(video_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update videos
  set comments_count = comments_count + 1
  where id = video_id;
end;
$$; 