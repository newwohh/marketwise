-- Account watchlist merges are atomic and retain the newest 100 distinct keys.
-- Identity comes only from auth.uid(); invoker RLS remains in force. A per-user
-- transaction lock serializes concurrent app syncs without a service-role client.
create or replace function public.sync_watchlist(p_items jsonb)
returns table (market text, symbol text)
language plpgsql
security invoker
set search_path = pg_catalog
as $$
declare
  v_user uuid := auth.uid();
  v_now timestamptz;
begin
  if v_user is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Watchlist items must be an array' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) > 100 then
    raise exception 'At most 100 watchlist items per sync' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) as item(value)
    where jsonb_typeof(item.value) <> 'string'
      or (item.value #>> '{}') !~ '^(crypto|stocks|forex):[a-zA-Z0-9][a-zA-Z0-9._/-]{0,79}$'
  ) then
    raise exception 'Invalid watchlist key' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text, 0));
  -- Set the batch clock after acquiring the lock. New keys sort after all
  -- existing account keys even if two clients sync at almost the same instant.
  select greatest(clock_timestamp(), coalesce(max(w.created_at) + interval '1 microsecond', clock_timestamp()))
    into v_now from public.watchlists as w where w.user_id = v_user;

  insert into public.watchlists (user_id, market, symbol, created_at)
  select v_user, split_part(item.value, ':', 1), split_part(item.value, ':', 2),
    v_now + item.position * interval '1 microsecond'
  from jsonb_array_elements_text(p_items) with ordinality as item(value, position)
  on conflict on constraint watchlists_pkey do nothing;

  delete from public.watchlists as w
  where w.user_id = v_user and (w.market, w.symbol) not in (
    select retained.market, retained.symbol
    from public.watchlists as retained
    where retained.user_id = v_user
    order by retained.created_at desc, retained.market desc, retained.symbol desc
    limit 100
  );

  -- API and device storage use chronological order so the newest asset stays
  -- at the end of the same capped array everywhere.
  return query select w.market, w.symbol from public.watchlists as w
    where w.user_id = v_user
    order by w.created_at asc, w.market asc, w.symbol asc;
end;
$$;
revoke all on function public.sync_watchlist(jsonb) from public, anon;
grant execute on function public.sync_watchlist(jsonb) to authenticated;
