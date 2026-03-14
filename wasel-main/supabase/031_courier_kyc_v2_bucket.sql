-- Optional migration: create a dedicated KYC bucket v2 with strict policies
-- Run in Supabase SQL Editor if you want to migrate away from the old bucket.

begin;

insert into storage.buckets (id, name, public)
values ('courier-kyc-v2', 'courier-kyc-v2', false)
on conflict (id) do nothing;

drop policy if exists courier_kyc_v2_select_own on storage.objects;
create policy courier_kyc_v2_select_own on storage.objects
for select to authenticated
using (
  bucket_id = 'courier-kyc-v2'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or public.is_staff_user()
  )
);

drop policy if exists courier_kyc_v2_insert_own on storage.objects;
create policy courier_kyc_v2_insert_own on storage.objects
for insert to authenticated
with check (
  bucket_id = 'courier-kyc-v2'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists courier_kyc_v2_update_own on storage.objects;
create policy courier_kyc_v2_update_own on storage.objects
for update to authenticated
using (
  bucket_id = 'courier-kyc-v2'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'courier-kyc-v2'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists courier_kyc_v2_delete_own on storage.objects;
create policy courier_kyc_v2_delete_own on storage.objects
for delete to authenticated
using (
  bucket_id = 'courier-kyc-v2'
  and (
    split_part(name, '/', 1) = auth.uid()::text
    or public.is_staff_user()
  )
);

commit;
