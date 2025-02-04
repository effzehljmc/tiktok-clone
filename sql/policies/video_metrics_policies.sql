-- Enable RLS
alter table video_metrics enable row level security;

-- Allow authenticated users to view their own metrics
create policy "Users can view their own video metrics"
  on video_metrics for select
  using (auth.uid() = user_id);

-- Allow authenticated users to insert their own metrics
create policy "Users can insert their own video metrics"
  on video_metrics for insert
  with check (auth.uid() = user_id);

-- Allow authenticated users to update their own metrics
create policy "Users can update their own video metrics"
  on video_metrics for update
  using (auth.uid() = user_id); 