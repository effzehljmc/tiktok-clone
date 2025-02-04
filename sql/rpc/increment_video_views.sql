-- Drop existing function if it exists
drop function if exists increment_video_views;

-- Create the function in the public schema
create or replace function public.increment_video_views(video_id uuid)
returns void as $$
begin
  update videos 
  set views_count = views_count + 1,
      updated_at = now()
  where id = video_id;
end;
$$ language plpgsql security definer;

-- Grant execute permission to authenticated users
grant execute on function public.increment_video_views(uuid) to authenticated; 