create table if not exists appointments (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users not null,
  title      text not null,
  starts_at  timestamptz not null,
  ends_at    timestamptz,
  location   text,
  notes      text,
  created_at timestamptz default now()
);

alter table appointments enable row level security;

create policy "Users can manage own appointments"
  on appointments for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index appointments_user_starts on appointments (user_id, starts_at);
