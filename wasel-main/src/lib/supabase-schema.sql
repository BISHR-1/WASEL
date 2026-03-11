-- Stories Table for Local Spotlight
create table if not exists stories (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text,
  image_url text, -- For image/video thumbnail
  video_url text, -- Optional video link
  media_type text default 'image', -- 'image' or 'video'
  is_featured boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Stories
alter table stories enable row level security;

-- Policy: Everyone can read
create policy "Anyone can view stories" on stories
  for select using (true);

-- Policy: Only authenticated users (admins) can insert/update/delete
-- Assuming admin has specific role or just auth for now
create policy "Authenticated users can manage stories" on stories
  for all using (auth.role() = 'authenticated');


-- Reviews Table for Order Rating
create table if not exists reviews (
  id uuid default gen_random_uuid() primary key,
  order_id text, -- Link to order ID
  rating integer check (rating >= 1 and rating <= 5),
  comment text,
  user_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Reviews
alter table reviews enable row level security;

-- Policy: Everyone can create a review (or restrict to order owner if auth exists)
create policy "Anyone can create reviews" on reviews
  for insert with check (true);

-- Policy: Everyone can read reviews
create policy "Anyone can read reviews" on reviews
  for select using (true);
