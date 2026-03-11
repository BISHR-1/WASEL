-- Courier onboarding + referral + payroll migration
-- Run this file in Supabase SQL Editor

begin;

-- 1) Courier profile (required onboarding fields)
create table if not exists public.courier_profiles (
  user_id uuid primary key references public.users(id) on delete cascade,
  phone text,
  vehicle_type text,
  current_location text,
  payout_cycle text not null default 'weekly' check (payout_cycle in ('weekly', 'monthly')),
  id_front_url text,
  id_back_url text,
  onboarding_completed boolean not null default false,
  first_delivery_completed_at timestamptz,
  referral_code text unique,
  balance_usd numeric(12,2) not null default 0,
  balance_syp numeric(14,2) not null default 0,
  completed_orders_count integer not null default 0,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_courier_profiles_referral_code on public.courier_profiles(referral_code);
create index if not exists idx_courier_profiles_onboarding on public.courier_profiles(onboarding_completed);

-- 2) Referral tracking
create table if not exists public.courier_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references public.users(id) on delete cascade,
  referred_user_id uuid not null unique references public.users(id) on delete cascade,
  referral_code text not null,
  joined_via_link boolean not null default true,
  registration_completed boolean not null default false,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_courier_referrals_referrer on public.courier_referrals(referrer_user_id);
create index if not exists idx_courier_referrals_qualified on public.courier_referrals(onboarding_completed);

-- 3) Payout reset logs (admin reset after salary payment)
create table if not exists public.courier_payout_resets (
  id uuid primary key default gen_random_uuid(),
  courier_user_id uuid not null references public.users(id) on delete cascade,
  reset_by uuid references public.users(id) on delete set null,
  amount_usd numeric(12,2) not null default 0,
  amount_syp numeric(14,2) not null default 0,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_courier_payout_resets_courier on public.courier_payout_resets(courier_user_id, created_at desc);

-- 4) Delivery assignment status extension if check constraint exists
-- Handles legacy statuses before applying the new check constraint
do $$
begin
  begin
    alter table public.order_assignments drop constraint if exists order_assignments_status_check;
  exception when others then
    null;
  end;

  -- Normalize legacy values to the new state machine to avoid constraint violations.
  update public.order_assignments
  set status = case lower(coalesce(status, ''))
    when 'paid' then 'assigned'
    when 'pending' then 'assigned'
    when 'processing' then 'accepted'
    when 'accepted_by_driver' then 'accepted'
    when 'inprogress' then 'in_progress'
    when 'in-progress' then 'in_progress'
    when 'out_for_delivery' then 'delivering'
    when 'out-for-delivery' then 'delivering'
    when 'on_the_way' then 'delivering'
    when 'ontheway' then 'delivering'
    when 'delivered' then 'completed'
    when 'done' then 'completed'
    when 'finished' then 'completed'
    when 'rejected_by_driver' then 'rejected'
    when 'canceled' then 'cancelled'
    else 'assigned'
  end
  where status is null
     or lower(status) not in ('assigned', 'accepted', 'in_progress', 'delivering', 'completed', 'rejected', 'cancelled');

  begin
    alter table public.order_assignments
      add constraint order_assignments_status_check
      check (status in ('assigned', 'accepted', 'in_progress', 'delivering', 'completed', 'rejected', 'cancelled'))
      not valid;

    -- Try to validate now; if there are unexpected rows, keep the constraint for new rows only.
    begin
      alter table public.order_assignments validate constraint order_assignments_status_check;
    exception when check_violation then
      raise notice 'order_assignments_status_check left NOT VALID due to remaining legacy rows.';
    end;
  exception when duplicate_object then
    null;
  end;
end $$;

-- 5) Storage bucket for courier IDs
insert into storage.buckets (id, name, public)
values ('courier-kyc', 'courier-kyc', false)
on conflict (id) do nothing;

-- 6) RLS
alter table public.courier_profiles enable row level security;
alter table public.courier_referrals enable row level security;
alter table public.courier_payout_resets enable row level security;

-- Courier profile policies
 drop policy if exists "courier_profiles_select_own" on public.courier_profiles;
create policy "courier_profiles_select_own" on public.courier_profiles
for select to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('admin', 'super_admin', 'support', 'operator', 'supervisor')
  )
);

 drop policy if exists "courier_profiles_upsert_own" on public.courier_profiles;
create policy "courier_profiles_upsert_own" on public.courier_profiles
for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "courier_profiles_admin_update" on public.courier_profiles;
create policy "courier_profiles_admin_update" on public.courier_profiles
for update to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('admin', 'super_admin', 'support', 'operator', 'supervisor')
  )
)
with check (true);

-- Referral policies
 drop policy if exists "courier_referrals_select_related" on public.courier_referrals;
create policy "courier_referrals_select_related" on public.courier_referrals
for select to authenticated
using (
  referrer_user_id = auth.uid()
  or referred_user_id = auth.uid()
  or exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('admin', 'super_admin', 'support', 'operator', 'supervisor')
  )
);

 drop policy if exists "courier_referrals_insert_auth" on public.courier_referrals;
create policy "courier_referrals_insert_auth" on public.courier_referrals
for insert to authenticated
with check (true);

 drop policy if exists "courier_referrals_update_related" on public.courier_referrals;
create policy "courier_referrals_update_related" on public.courier_referrals
for update to authenticated
using (referrer_user_id = auth.uid() or referred_user_id = auth.uid())
with check (referrer_user_id = referrer_user_id);

-- Payout reset policies (admin only write)
 drop policy if exists "courier_payout_resets_select_related" on public.courier_payout_resets;
create policy "courier_payout_resets_select_related" on public.courier_payout_resets
for select to authenticated
using (
  courier_user_id = auth.uid()
  or exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('admin', 'super_admin', 'support', 'operator', 'supervisor')
  )
);

 drop policy if exists "courier_payout_resets_insert_admin" on public.courier_payout_resets;
create policy "courier_payout_resets_insert_admin" on public.courier_payout_resets
for insert to authenticated
with check (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role in ('admin', 'super_admin', 'support', 'operator', 'supervisor')
  )
);

-- Storage policies (courier uploads only to own folder)
 drop policy if exists "courier_kyc_select_own" on storage.objects;
create policy "courier_kyc_select_own" on storage.objects
for select to authenticated
using (
  bucket_id = 'courier-kyc'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role in ('admin', 'super_admin', 'support', 'operator', 'supervisor')
    )
  )
);

 drop policy if exists "courier_kyc_insert_own" on storage.objects;
create policy "courier_kyc_insert_own" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'courier-kyc'
  and split_part(name, '/', 1) = auth.uid()::text
);

 drop policy if exists "courier_kyc_update_own" on storage.objects;
create policy "courier_kyc_update_own" on storage.objects
for update to authenticated
using (bucket_id = 'courier-kyc' and split_part(name, '/', 1) = auth.uid()::text)
with check (bucket_id = 'courier-kyc' and split_part(name, '/', 1) = auth.uid()::text);

-- Referral signup completion under RLS: force referred account role to courier and create referral row.
create or replace function public.complete_referral_courier_signup(p_referral_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_id uuid;
  v_email text;
  v_normalized_code text;
  v_referrer_user_id uuid;
  v_referred_user_id uuid;
begin
  v_auth_id := auth.uid();
  if v_auth_id is null then
    raise exception 'Authenticated user required';
  end if;

  v_email := lower(coalesce((auth.jwt() ->> 'email')::text, ''));
  if v_email = '' then
    raise exception 'Authenticated email required';
  end if;

  v_normalized_code := upper(trim(coalesce(p_referral_code, '')));
  if v_normalized_code = '' then
    raise exception 'Referral code required';
  end if;

  select cp.user_id
    into v_referrer_user_id
  from public.courier_profiles cp
  where upper(cp.referral_code) = v_normalized_code
  limit 1;

  if v_referrer_user_id is null then
    raise exception 'Referral code not found';
  end if;

  select u.id
    into v_referred_user_id
  from public.users u
  where lower(u.email) = v_email
  limit 1;

  if v_referred_user_id is not null then
    update public.users
    set
      auth_id = coalesce(auth_id, v_auth_id),
      role = 'courier',
      updated_at = now()
    where id = v_referred_user_id;
  else
    insert into public.users (id, auth_id, email, role, created_at, updated_at)
    values (v_auth_id, v_auth_id, v_email, 'courier', now(), now())
    on conflict (id) do update
      set
        auth_id = excluded.auth_id,
        email = excluded.email,
        role = 'courier',
        updated_at = now();
    v_referred_user_id := v_auth_id;
  end if;

  insert into public.courier_referrals (
    referrer_user_id,
    referred_user_id,
    referral_code,
    joined_via_link,
    registration_completed,
    onboarding_completed,
    created_at,
    updated_at
  )
  values (
    v_referrer_user_id,
    v_referred_user_id,
    v_normalized_code,
    true,
    true,
    false,
    now(),
    now()
  )
  on conflict (referred_user_id) do update
    set
      referrer_user_id = excluded.referrer_user_id,
      referral_code = excluded.referral_code,
      joined_via_link = true,
      registration_completed = true,
      updated_at = now();

  return jsonb_build_object(
    'ok', true,
    'referrer_user_id', v_referrer_user_id,
    'referred_user_id', v_referred_user_id,
    'role', 'courier'
  );
end;
$$;

grant execute on function public.complete_referral_courier_signup(text) to authenticated;

commit;
