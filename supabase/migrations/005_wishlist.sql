-- Run in Supabase SQL Editor

create table if not exists wishlist_items (
  id             uuid        default gen_random_uuid() primary key,
  user_id        uuid        references auth.users(id) on delete cascade not null,
  title          text        not null,
  estimated_cost numeric     not null,
  priority       smallint    not null default 1,
  notes          text,
  emoji          text        not null default '🛒',
  created_at     timestamptz default now() not null
);

alter table wishlist_items enable row level security;

create policy "select own wishlist" on wishlist_items for select using (auth.uid() = user_id);
create policy "insert own wishlist" on wishlist_items for insert with check (auth.uid() = user_id);
create policy "update own wishlist" on wishlist_items for update using (auth.uid() = user_id);
create policy "delete own wishlist" on wishlist_items for delete using (auth.uid() = user_id);
