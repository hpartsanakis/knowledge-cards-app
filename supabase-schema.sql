create table if not exists public.knowledge_cards (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text not null,
  content text not null,
  tags text[] not null default '{}',
  favorite boolean not null default false,
  review jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.knowledge_cards enable row level security;

grant select, insert, update, delete on public.knowledge_cards to authenticated;

create index if not exists knowledge_cards_user_id_idx
on public.knowledge_cards using btree (user_id);

drop policy if exists "Users can read their own cards" on public.knowledge_cards;
create policy "Users can read their own cards"
on public.knowledge_cards
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own cards" on public.knowledge_cards;
create policy "Users can create their own cards"
on public.knowledge_cards
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own cards" on public.knowledge_cards;
create policy "Users can update their own cards"
on public.knowledge_cards
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own cards" on public.knowledge_cards;
create policy "Users can delete their own cards"
on public.knowledge_cards
for delete
to authenticated
using ((select auth.uid()) = user_id);
