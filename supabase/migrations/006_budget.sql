-- Budget items: recurring monthly expenses + one-time costs
create table if not exists budget_items (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users not null,
  name         text not null,
  amount       numeric(10,2) not null,
  type         text not null check (type in ('recurring', 'one_time')),
  created_at   timestamptz default now()
);

alter table budget_items enable row level security;

create policy "Users manage own budget items"
  on budget_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
