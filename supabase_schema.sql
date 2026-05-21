-- VibeHub Supabase Migration Schema
-- Run this in the SQL Editor of your Supabase dashboard to create all tables, triggers, and enable real-time updates.

-- 1. Create Profiles Table (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  email text not null,
  first_name text default '',
  last_name text default '',
  bio text default '',
  profile_picture text,
  cover_picture text,
  website text default '',
  location text default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

create policy "Allow public read access to profiles" on public.profiles
  for select using (true);

create policy "Allow users to update their own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Allow users to insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Trigger to automatically create a profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, email, first_name, last_name, profile_picture)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'user_name', new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    coalesce(split_part(new.raw_user_meta_data->>'full_name', ' ', 1), ''),
    coalesce(split_part(new.raw_user_meta_data->>'full_name', ' ', 2), ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do update set
    username = excluded.username,
    email = excluded.email,
    profile_picture = coalesce(excluded.profile_picture, profiles.profile_picture);
  return new;
end;
$$ language plpgsql security definer;

-- Recreate trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Create Posts Table
create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text default '',
  media text,
  media_type text default 'text' check (media_type in ('image', 'video', 'text')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.posts enable row level security;

create policy "Allow public read access to posts" on public.posts
  for select using (true);

create policy "Allow authenticated users to create posts" on public.posts
  for insert with check (auth.uid() = author_id);

create policy "Allow users to update their own posts" on public.posts
  for update using (auth.uid() = author_id);

create policy "Allow users to delete their own posts" on public.posts
  for delete using (auth.uid() = author_id);

-- 3. Create Likes Table
create table if not exists public.likes (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, post_id)
);

alter table public.likes enable row level security;

create policy "Allow public read access to likes" on public.likes
  for select using (true);

create policy "Allow authenticated users to like posts" on public.likes
  for insert with check (auth.uid() = user_id);

create policy "Allow users to unlike posts" on public.likes
  for delete using (auth.uid() = user_id);

-- 4. Create Comments Table
create table if not exists public.comments (
  id bigint generated always as identity primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  parent_id bigint references public.comments(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.comments enable row level security;

create policy "Allow public read access to comments" on public.comments
  for select using (true);

create policy "Allow authenticated users to comment" on public.comments
  for insert with check (auth.uid() = author_id);

create policy "Allow users to delete their own comments" on public.comments
  for delete using (auth.uid() = author_id);

-- 5. Create Follows Table
create table if not exists public.follows (
  id bigint generated always as identity primary key,
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(follower_id, following_id)
);

alter table public.follows enable row level security;

create policy "Allow public read access to follows" on public.follows
  for select using (true);

create policy "Allow authenticated users to follow others" on public.follows
  for insert with check (auth.uid() = follower_id);

create policy "Allow users to unfollow others" on public.follows
  for delete using (auth.uid() = follower_id);

-- 6. Create Saved Posts Table
create table if not exists public.saved_posts (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  post_id uuid references public.posts(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, post_id)
);

alter table public.saved_posts enable row level security;

create policy "Allow users to view their own saved posts" on public.saved_posts
  for select using (auth.uid() = user_id);

create policy "Allow authenticated users to save posts" on public.saved_posts
  for insert with check (auth.uid() = user_id);

create policy "Allow users to unsave posts" on public.saved_posts
  for delete using (auth.uid() = user_id);

-- 7. Create Stories Table
create table if not exists public.stories (
  id bigint generated always as identity primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  media text not null,
  media_type text default 'image' check (media_type in ('image', 'video')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone default (timezone('utc'::text, now()) + interval '24 hours') not null
);

alter table public.stories enable row level security;

create policy "Allow public read access to stories" on public.stories
  for select using (true);

create policy "Allow authenticated users to upload stories" on public.stories
  for insert with check (auth.uid() = author_id);

create policy "Allow users to delete their own stories" on public.stories
  for delete using (auth.uid() = author_id);

-- 8. Create Story Views Table
create table if not exists public.story_views (
  id bigint generated always as identity primary key,
  story_id bigint references public.stories(id) on delete cascade not null,
  viewer_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(story_id, viewer_id)
);

alter table public.story_views enable row level security;

create policy "Allow authors and viewers to read views" on public.story_views
  for select using (true);

create policy "Allow authenticated users to mark story as viewed" on public.story_views
  for insert with check (auth.uid() = viewer_id);

-- 9. Create Story Likes Table (For metrics inside stories)
create table if not exists public.story_likes (
  id bigint generated always as identity primary key,
  story_id bigint references public.stories(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(story_id, user_id)
);

alter table public.story_likes enable row level security;

create policy "Allow public read access to story likes" on public.story_likes
  for select using (true);

create policy "Allow users to like story" on public.story_likes
  for insert with check (auth.uid() = user_id);

create policy "Allow users to unlike story" on public.story_likes
  for delete using (auth.uid() = user_id);

-- 10. Create Story Comments Table
create table if not exists public.story_comments (
  id bigint generated always as identity primary key,
  story_id bigint references public.stories(id) on delete cascade not null,
  author_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.story_comments enable row level security;

create policy "Allow public read access to story comments" on public.story_comments
  for select using (true);

create policy "Allow users to comment on story" on public.story_comments
  for insert with check (auth.uid() = author_id);

-- 11. Create Conversations Table
create table if not exists public.conversations (
  id bigint generated always as identity primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.conversations enable row level security;

create policy "Allow authenticated users to create conversations" on public.conversations
  for insert with check (true);

-- 12. Create Conversation Participants Table
create table if not exists public.conversation_participants (
  id bigint generated always as identity primary key,
  conversation_id bigint references public.conversations(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  unique(conversation_id, user_id)
);

create policy "Allow users to read conversations they belong to" on public.conversations
  for select using (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = id and user_id = auth.uid()
    ) or not exists (
      select 1 from public.conversation_participants
      where conversation_id = id
    )
  );

alter table public.conversation_participants enable row level security;

-- Helper function to check conversation membership without RLS infinite recursion
create or replace function public.is_conversation_member(conv_id bigint, user_uuid uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.conversation_participants
    where conversation_id = conv_id and user_id = user_uuid
  );
end;
$$ language plpgsql security definer;

create policy "Allow reading participants in shared conversations" on public.conversation_participants
  for select using (
    public.is_conversation_member(conversation_id, auth.uid())
  );

create policy "Allow authenticated users to join/create participation" on public.conversation_participants
  for insert with check (true);

-- 13. Create Messages Table
create table if not exists public.messages (
  id bigint generated always as identity primary key,
  conversation_id bigint references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  content text default '',
  media text,
  media_type text default 'text' check (media_type in ('text', 'image')),
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.messages enable row level security;

create policy "Allow users to read messages in their conversations" on public.messages
  for select using (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id and user_id = auth.uid()
    )
  );

create policy "Allow users to send messages to their conversations" on public.messages
  for insert with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id and user_id = auth.uid()
    )
  );

create policy "Allow users to delete messages in their conversations" on public.messages
  for delete using (
    exists (
      select 1 from public.conversation_participants
      where conversation_id = messages.conversation_id and user_id = auth.uid()
    )
  );

-- Trigger to update conversation's updated_at field when a message is added
create or replace function public.update_conversation_timestamp()
returns trigger as $$
begin
  update public.conversations
  set updated_at = timezone('utc'::text, now())
  where id = new.conversation_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_message_inserted
  after insert on public.messages
  for each row execute procedure public.update_conversation_timestamp();

-- 14. Create Notifications Table
create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  recipient_id uuid references public.profiles(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  type text check (type in ('follow', 'like', 'comment', 'message', 'mention')),
  post_id uuid references public.posts(id) on delete cascade,
  comment_id bigint references public.comments(id) on delete cascade,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.notifications enable row level security;

create policy "Allow users to read their own notifications" on public.notifications
  for select using (auth.uid() = recipient_id);

create policy "Allow users to update/delete their own notifications" on public.notifications
  for update using (auth.uid() = recipient_id);

create policy "Allow authenticated users to create notifications" on public.notifications
  for insert with check (auth.uid() = sender_id);

-- Enable real-time replication for messages and notifications
alter table public.messages replica identity full;
alter table public.notifications replica identity full;

-- Add tables to replication (ignore if already added)
do $$
begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception when others then
    raise notice 'Table public.messages already in publication or error: %', SQLERRM;
  end;
  begin
    alter publication supabase_realtime add table public.notifications;
  exception when others then
    raise notice 'Table public.notifications already in publication or error: %', SQLERRM;
  end;
end $$;
