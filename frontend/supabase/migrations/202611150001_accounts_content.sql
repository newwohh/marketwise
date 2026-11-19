-- Core schema. Browser sessions use RLS; subscriptions are server-write-only.
create extension if not exists pgcrypto;
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Marketwise member' check (char_length(display_name) between 1 and 80),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.watchlists (
  user_id uuid not null references auth.users(id) on delete cascade,
  market text not null check (market in ('crypto', 'stocks', 'forex')),
  symbol text not null check (char_length(symbol) between 1 and 80),
  created_at timestamptz not null default now(), primary key (user_id, market, symbol)
);
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(), author_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null default 'Marketwise contributor' check (char_length(author_name) between 1 and 80),
  title text not null check (char_length(title) between 1 and 160), body text not null check (char_length(body) between 1 and 50000),
  published boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists posts_published_date_idx on public.posts(published, created_at desc);
create index if not exists posts_author_idx on public.posts(author_id);
create table if not exists public.subscriptions (
  id text primary key, user_id uuid not null references auth.users(id) on delete cascade,
  customer_id text not null, status text not null, current_period_end timestamptz, price_id text,
  cancel_at_period_end boolean not null default false, updated_at timestamptz not null default now()
);
create index if not exists subscriptions_user_idx on public.subscriptions(user_id);
alter table public.profiles enable row level security;
alter table public.watchlists enable row level security;
alter table public.posts enable row level security;
alter table public.subscriptions enable row level security;
create policy "Read own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "Create own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "Update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Read own watchlist" on public.watchlists for select to authenticated using ((select auth.uid()) = user_id);
create policy "Create own watchlist entries" on public.watchlists for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Delete own watchlist entries" on public.watchlists for delete to authenticated using ((select auth.uid()) = user_id);
create policy "Read published posts" on public.posts for select to anon, authenticated using (published = true);
create policy "Read own drafts" on public.posts for select to authenticated using ((select auth.uid()) = author_id);
create policy "Create own posts" on public.posts for insert to authenticated with check ((select auth.uid()) = author_id);
create policy "Update own posts" on public.posts for update to authenticated using ((select auth.uid()) = author_id) with check ((select auth.uid()) = author_id);
create policy "Delete own posts" on public.posts for delete to authenticated using ((select auth.uid()) = author_id);
create policy "Read own subscriptions" on public.subscriptions for select to authenticated using ((select auth.uid()) = user_id);
revoke all on public.profiles, public.watchlists, public.posts, public.subscriptions from anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, delete on public.watchlists to authenticated;
grant select on public.posts to anon;
grant select, insert, update, delete on public.posts to authenticated;
grant select on public.subscriptions to authenticated;
grant all on public.profiles, public.watchlists, public.posts, public.subscriptions to service_role;
create or replace function public.create_marketwise_profile()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, display_name)
  values (new.id, coalesce(nullif(left(trim(new.raw_user_meta_data ->> 'display_name'), 80), ''), 'Marketwise member'))
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke execute on function public.create_marketwise_profile() from public, anon, authenticated;
drop trigger if exists on_marketwise_user_created on auth.users;
create trigger on_marketwise_user_created after insert on auth.users for each row execute function public.create_marketwise_profile();
