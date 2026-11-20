-- Server-only per-user checkout lease. All application instances share the same
-- lock so monthly/yearly requests cannot concurrently issue two live checkouts.
create table if not exists public.checkout_leases (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token uuid not null,
  expires_at timestamptz not null
);
alter table public.checkout_leases enable row level security;
revoke all on public.checkout_leases from public, anon, authenticated;
grant all on public.checkout_leases to service_role;

create or replace function public.acquire_billing_checkout(p_user_id uuid, p_token uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  insert into public.checkout_leases(user_id,token,expires_at)
  values(p_user_id,p_token,now()+interval '5 minutes')
  on conflict(user_id) do update set token=excluded.token, expires_at=excluded.expires_at
  where public.checkout_leases.expires_at <= now();
  return found;
end;
$$;

create or replace function public.renew_billing_checkout(p_user_id uuid, p_token uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  update public.checkout_leases set expires_at=now()+interval '5 minutes'
  where user_id=p_user_id and token=p_token and expires_at > now();
  return found;
end;
$$;

create or replace function public.release_billing_checkout(p_user_id uuid, p_token uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  delete from public.checkout_leases where user_id=p_user_id and token=p_token;
  return found;
end;
$$;

revoke all on function public.acquire_billing_checkout(uuid,uuid) from public, anon, authenticated;
revoke all on function public.renew_billing_checkout(uuid,uuid) from public, anon, authenticated;
revoke all on function public.release_billing_checkout(uuid,uuid) from public, anon, authenticated;
grant execute on function public.acquire_billing_checkout(uuid,uuid) to service_role;
grant execute on function public.renew_billing_checkout(uuid,uuid) to service_role;
grant execute on function public.release_billing_checkout(uuid,uuid) to service_role;
