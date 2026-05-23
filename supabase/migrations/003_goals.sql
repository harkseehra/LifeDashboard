create table if not exists goals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users not null,
  title      text not null,
  emoji      text not null default '🌱',
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists goal_check_ins (
  id             uuid primary key default gen_random_uuid(),
  goal_id        uuid references goals on delete cascade not null,
  user_id        uuid references auth.users not null,
  checked_in_on  date not null,
  notes          text,
  created_at     timestamptz default now(),
  unique (goal_id, checked_in_on)
);

alter table goals enable row level security;
alter table goal_check_ins enable row level security;

create policy "Users manage own goals"
  on goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage own check-ins"
  on goal_check_ins for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index goal_check_ins_goal_date on goal_check_ins (goal_id, checked_in_on desc);
