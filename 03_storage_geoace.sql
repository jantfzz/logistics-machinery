-- =====================================================================
-- GeoACE Logistic & Machinery Management System
-- 03_storage_geoace.sql : bucket Supabase Storage untuk foto & tanda tangan
--
-- Jalankan sekali di Supabase SQL Editor setelah 01 dan 02.
-- Bucket publik khusus simulasi: siapa pun yang tahu URL file bisa melihat.
-- Untuk production, jadikan bucket privat dan pakai signed URL.
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('geoace-bukti', 'geoace-bukti', true)
on conflict (id) do nothing;

drop policy if exists "simulasi baca bukti" on storage.objects;
drop policy if exists "simulasi unggah bukti" on storage.objects;

create policy "simulasi baca bukti" on storage.objects
  for select to anon, authenticated using (bucket_id = 'geoace-bukti');

create policy "simulasi unggah bukti" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'geoace-bukti');
