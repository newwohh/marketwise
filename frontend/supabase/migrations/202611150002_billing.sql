-- Customer ownership and webhook cache. Paid access is always verified against
-- Stripe on the server; these rows are never a client-writable entitlement.
create table if not exists public.billing_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  customer_id text unique not null,
  created_at timestamptz not null default now()
);
alter table public.billing_customers enable row level security;
revoke all on public.billing_customers from anon, authenticated;
grant all on public.billing_customers to service_role;
grant select on public.billing_customers to authenticated;
drop policy if exists "billing_customer_owner_read" on public.billing_customers;
create policy "billing_customer_owner_read" on public.billing_customers for select to authenticated using (auth.uid() = user_id);

create table if not exists public.webhook_events (
  id text primary key,
  event_created bigint not null,
  processed_at timestamptz not null default now()
);
alter table public.webhook_events enable row level security;
revoke all on public.webhook_events from anon, authenticated;
grant all on public.webhook_events to service_role;
alter table public.subscriptions add column if not exists last_event_created bigint not null default 0;

create or replace function public.sync_stripe_subscription(p_payload jsonb, p_event_id text, p_event_created bigint)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  -- The unique event insert and subscription update are a single transaction.
  -- A failed update rolls the event insert back, permitting Stripe retries.
  insert into public.webhook_events(id,event_created) values(p_event_id,p_event_created)
    on conflict(id) do nothing;
  if not found then return false; end if;
  insert into public.subscriptions(id,user_id,customer_id,status,current_period_end,price_id,cancel_at_period_end,last_event_created,updated_at)
  values(p_payload->>'id',(p_payload->>'user_id')::uuid,p_payload->>'customer_id',p_payload->>'status',
    (p_payload->>'current_period_end')::timestamptz,p_payload->>'price_id',
    coalesce((p_payload->>'cancel_at_period_end')::boolean,false),p_event_created,now())
  on conflict(id) do update set
    status=excluded.status,current_period_end=excluded.current_period_end,price_id=excluded.price_id,
    cancel_at_period_end=excluded.cancel_at_period_end,last_event_created=excluded.last_event_created,updated_at=now()
  where public.subscriptions.user_id=excluded.user_id
    and public.subscriptions.customer_id=excluded.customer_id
    and public.subscriptions.last_event_created <= excluded.last_event_created;
  return found;
end;
$$;
revoke all on function public.sync_stripe_subscription(jsonb,text,bigint) from public, anon, authenticated;
grant execute on function public.sync_stripe_subscription(jsonb,text,bigint) to service_role;
