-- Run in Supabase SQL Editor

create table if not exists plaid_items (
  id               uuid        default gen_random_uuid() primary key,
  user_id          uuid        references auth.users(id) on delete cascade not null,
  item_id          text        not null unique,
  access_token     text        not null,
  institution_name text        not null default 'Bank',
  created_at       timestamptz default now() not null
);

alter table plaid_items enable row level security;

create policy "select own plaid items"  on plaid_items for select  using (auth.uid() = user_id);
create policy "insert own plaid items"  on plaid_items for insert  with check (auth.uid() = user_id);
create policy "delete own plaid items"  on plaid_items for delete  using (auth.uid() = user_id);
