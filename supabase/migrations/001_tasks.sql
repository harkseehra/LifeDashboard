-- Run this in Supabase SQL editor (Dashboard → SQL Editor → New query)

create table tasks (
  id           uuid        default gen_random_uuid() primary key,
  user_id      uuid        references auth.users(id) on delete cascade not null,
  title        text        not null,
  notes        text,
  due_date     date,
  completed    boolean     default false not null,
  completed_at timestamptz,
  created_at   timestamptz default now() not null,
  priority     smallint    default 0 not null check (priority >= 0 and priority <= 3)
);

alter table tasks enable row level security;

create policy "select own tasks" on tasks for select using (auth.uid() = user_id);
create policy "insert own tasks" on tasks for insert with check (auth.uid() = user_id);
create policy "update own tasks" on tasks for update using (auth.uid() = user_id);
create policy "delete own tasks" on tasks for delete using (auth.uid() = user_id);
