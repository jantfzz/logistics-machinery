-- =====================================================================
-- GeoACE Logistic & Machinery Management System
-- 01_skema_geoace.sql : skema database simulasi (Supabase / PostgreSQL 15+)
--
-- Cara pakai: Supabase > SQL Editor > New query > tempel seluruh isi file
-- ini > Run. Lalu jalankan 02_seed_geoace.sql untuk data dummy.
-- Script aman dijalankan ulang: semua objek lama di schema public milik
-- GeoACE dihapus dulu (lihat bagian 0).
--
-- Acuan: BRD v1.0 (BR-01..BR-20, aturan BRL-01..BRL-12) dan
-- Template Master Data & Gap Review GeoACE v1.1.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Reset (hapus objek lama agar script bisa diulang)
-- ---------------------------------------------------------------------
drop view if exists v_dashboard_kpi, v_laporan_stok_alat, v_laporan_kondisi,
  v_peringatan_dini, v_laporan_kebutuhan cascade;
drop table if exists
  audit_log, notifikasi, penerimaan_barang, purchase_order_item, purchase_order,
  penawaran_vendor, purchase_request_item, purchase_request, pemakaian_part,
  work_order, laporan_kerusakan, jadwal_pm, pemeriksaan_kondisi, mutasi_alat,
  permintaan_mobilisasi_item, permintaan_mobilisasi, kebutuhan_alat_proyek,
  dokumen_legal_alat, alat, stok_gudang, barang_part, kategori_barang, pengguna,
  vendor, gudang_lokasi, proyek cascade;
drop function if exists
  fn_waktu_record, fn_audit, fn_mode_seed, fn_cegah_hapus_alat,
  fn_mutasi_sebelum, fn_mutasi_sesudah, fn_kerusakan_sesudah,
  fn_wo_sebelum, fn_wo_sesudah, fn_pakai_part, fn_po_sebelum,
  fn_terima_sebelum, fn_permintaan_item_sebelum cascade;

-- ---------------------------------------------------------------------
-- 1. Fungsi umum
-- ---------------------------------------------------------------------

-- Mode seed: saat 02_seed_geoace.sql berjalan, aturan transaksi dan audit
-- dilewati agar data riwayat bisa dimasukkan apa adanya.
create function fn_mode_seed() returns boolean language sql stable as $$
  select coalesce(current_setting('geoace.seed', true), 'off') = 'on'
$$;

-- BRL-09: record_time dan update_time diisi sistem, tidak bisa diubah user.
create function fn_waktu_record() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    new.record_time := now();
  else
    new.record_time := old.record_time;
  end if;
  new.update_time := now();
  return new;
end $$;

-- BR-18: audit trail. Mencatat siapa, kapan, field, nilai lama, nilai baru.
-- Argumen trigger: nama kolom primary key tabel.
create function fn_audit() returns trigger language plpgsql as $$
declare
  pk text := tg_argv[0];
  baru jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) end;
  lama jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) end;
  oleh text := coalesce(
    baru->>'updated_by',
    nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'email',
    'sistem');
  k text;
begin
  if fn_mode_seed() then return null; end if;
  if tg_op = 'INSERT' then
    insert into audit_log(tabel, id_record, aksi, nilai_baru, oleh)
    values (tg_table_name, baru->>pk, 'INSERT', baru::text, oleh);
  elsif tg_op = 'DELETE' then
    insert into audit_log(tabel, id_record, aksi, nilai_lama, oleh)
    values (tg_table_name, lama->>pk, 'DELETE', lama::text, oleh);
  else
    for k in select jsonb_object_keys(baru) loop
      if k not in ('record_time', 'update_time', 'updated_by')
         and (baru->k) is distinct from (lama->k) then
        insert into audit_log(tabel, id_record, aksi, field, nilai_lama, nilai_baru, oleh)
        values (tg_table_name, baru->>pk, 'UPDATE', k, lama->>k, baru->>k, oleh);
      end if;
    end loop;
  end if;
  return null;
end $$;

-- ---------------------------------------------------------------------
-- 2. Master data
-- ---------------------------------------------------------------------
create table proyek (
  kode_proyek        text primary key,
  nama_proyek        text not null,
  klien              text,
  lokasi             text,
  jenis_pekerjaan    text,
  manajer_proyek     text,
  rencana_mulai      date,
  rencana_selesai    date,
  realisasi_mulai    date,
  realisasi_selesai  date,
  sumber_listrik     text check (sumber_listrik in ('PLN', 'Genset', 'Tidak tersedia')),
  kapasitas_listrik_kva numeric,
  cost_center        text,
  status             text not null default 'Berjalan'
                     check (status in ('Rencana', 'Berjalan', 'Selesai', 'Ditunda')),
  record_time        timestamptz, update_time timestamptz, updated_by text,
  check (rencana_selesai >= rencana_mulai),
  check (realisasi_selesai >= realisasi_mulai)
);

create table gudang_lokasi (
  kode_gudang      text primary key,
  nama_gudang      text not null,
  jenis            text not null check (jenis in ('Pusat', 'Site', 'Bengkel')),
  kode_proyek      text references proyek,
  alamat           text,
  penanggung_jawab text,
  telepon          text,
  record_time timestamptz, update_time timestamptz, updated_by text
);

create table vendor (
  kode_vendor   text primary key,
  nama_vendor   text not null,
  npwp          text,
  kota          text,
  nama_kontak   text,
  telepon       text,
  email         text,
  kategori      text,
  termin_hari   int check (termin_hari >= 0),
  status_pkp    text check (status_pkp in ('PKP', 'Non-PKP')),
  aktif         boolean not null default true,
  record_time timestamptz, update_time timestamptz, updated_by text
);

create table kategori_barang (
  kode_kategori text primary key,
  nama_kategori text not null,
  satuan_dasar  text,
  keterangan    text
);

-- BR-19: peran pengguna dan matriks approval sederhana.
create table pengguna (
  id_pengguna           text primary key,
  nama                  text not null,
  jabatan               text,
  departemen            text,
  email                 text unique,
  peran                 text not null check (peran in
                        ('PM Site', 'Gudang', 'Driver', 'Mekanik', 'Purchasing',
                         'Finance', 'HSE', 'Manajemen', 'Admin')),
  kode_proyek           text references proyek,
  level_approval        int check (level_approval between 0 and 3),
  batas_nilai_approval  numeric check (batas_nilai_approval >= 0),
  aktif                 boolean not null default true,
  record_time timestamptz, update_time timestamptz, updated_by text
);

-- BR-01..BR-04: register mesin & alat.
create table alat (
  id_alat          text primary key,
  nama_alat        text not null,
  jenis_alat       text not null check (jenis_alat in
                   ('Alat berat', 'Alat ringan', 'Mesin', 'Alat ukur', 'Perkakas')),
  merk             text not null,
  tipe             text not null,
  no_seri          text not null unique,                       -- BRL-01
  jumlah           int not null default 1 check (jumlah >= 1),
  satuan           text not null default 'Unit',
  status           text not null default 'Ready' check (status in        -- BR-03
                   ('Ready', 'In Transit', 'In Use', 'Under Maintenance',
                    'Broken', 'Scrapped')),
  kondisi          text not null default 'Baik' check (kondisi in        -- BRL-12
                   ('Baik', 'Perlu perbaikan', 'Rusak ringan', 'Rusak berat')),
  kode_gudang      text references gudang_lokasi,
  kode_proyek      text references proyek,
  pic              text,
  hour_meter       numeric not null default 0 check (hour_meter >= 0),
  spesifikasi      jsonb not null default '{}'::jsonb,   -- kapasitas, dimensi, berat, dst.
  fungsi           text,
  daya             numeric,
  satuan_daya      text check (satuan_daya in ('kW', 'HP', 'kVA')),
  bahan_bakar      text,
  kepemilikan      text not null default 'Milik sendiri'
                   check (kepemilikan in ('Milik sendiri', 'Sewa')),
  tahun_pembuatan  int check (tahun_pembuatan between 1950 and 2100),
  tanggal_beli     date,
  nilai_aset       numeric check (nilai_aset >= 0),
  garansi_sampai   date,
  no_pembelian     text,
  manual_url       text,
  foto_url         text,
  tanggal_dihapus  date,
  record_time timestamptz, update_time timestamptz, updated_by text,
  -- Lokasi: di gudang/bengkel atau di proyek (In Transit boleh keduanya kosong).
  check (kode_gudang is null or kode_proyek is null),
  -- BRL-11: alat Scrapped wajib punya tanggal penghapusan.
  constraint ck_scrapped_tanggal check ((status = 'Scrapped') = (tanggal_dihapus is not null))
);

create table dokumen_legal_alat (
  id              bigint generated always as identity primary key,
  id_alat         text not null references alat,
  jenis           text not null check (jenis in ('SIA', 'SILO', 'STNK', 'Sertifikat lain')),
  nomor           text not null,
  berlaku_sampai  date,
  file_url        text,
  record_time timestamptz, update_time timestamptz, updated_by text
);

create table barang_part (
  kode_barang      text primary key,
  nama_barang      text not null,
  kode_kategori    text not null references kategori_barang,
  satuan           text not null,
  merk             text,
  part_number      text,
  part_substitusi  text,
  stok_minimum     numeric not null default 0 check (stok_minimum >= 0),
  lokasi_rak       text,
  harga_terakhir   numeric check (harga_terakhir >= 0),
  record_time timestamptz, update_time timestamptz, updated_by text
);

create table stok_gudang (
  kode_gudang  text references gudang_lokasi,
  kode_barang  text references barang_part,
  qty          numeric not null default 0 constraint ck_stok_cukup check (qty >= 0),
  update_time  timestamptz not null default now(),
  primary key (kode_gudang, kode_barang)
);

-- ---------------------------------------------------------------------
-- 3. Kebutuhan & mobilisasi (BR-05..BR-08)
-- ---------------------------------------------------------------------
create table kebutuhan_alat_proyek (
  no_kebutuhan      text primary key,
  kode_proyek       text not null references proyek,
  item_pekerjaan    text,
  jenis_alat        text not null,
  kapasitas_minimum text,
  jumlah_dibutuhkan int not null check (jumlah_dibutuhkan > 0),
  jumlah_terpenuhi  int not null default 0 check (jumlah_terpenuhi >= 0),
  mulai             date,
  selesai           date,
  jam_operasi_hari  numeric,
  sumber_pemenuhan  text check (sumber_pemenuhan in ('Milik sendiri', 'Sewa', 'Beli')),
  pengaju           text,
  record_time timestamptz, update_time timestamptz, updated_by text,
  check (selesai >= mulai)
);

create table permintaan_mobilisasi (
  no_permintaan    text primary key,
  kode_proyek      text not null references proyek,
  no_kebutuhan     text references kebutuhan_alat_proyek,
  pemohon          text not null,
  tanggal_butuh    date,
  status           text not null default 'Diajukan'
                   check (status in ('Diajukan', 'Disetujui', 'Ditolak', 'Selesai')),
  approver         text,
  tanggal_approve  timestamptz,
  catatan          text,
  record_time timestamptz, update_time timestamptz, updated_by text
);

create table permintaan_mobilisasi_item (
  id             bigint generated always as identity primary key,
  no_permintaan  text not null references permintaan_mobilisasi on delete cascade,
  id_alat        text not null references alat,
  unique (no_permintaan, id_alat)
);

-- Satu baris = satu perjalanan alat: check-out (keluar) lalu check-in (masuk).
create table mutasi_alat (
  no_mutasi           text primary key,
  no_permintaan       text references permintaan_mobilisasi,
  id_alat             text not null references alat,
  jenis               text not null check (jenis in ('Mobilisasi', 'Demobilisasi', 'Transfer')),
  asal_gudang         text references gudang_lokasi,
  asal_proyek         text references proyek,
  tujuan_gudang       text references gudang_lokasi,
  tujuan_proyek       text references proyek,
  no_surat_jalan      text unique,
  driver              text,
  kendaraan           text,
  -- Check-out (BR-06, BRL-04)
  tanggal_keluar      timestamptz,
  qr_discan_keluar    boolean not null default false,
  checklist_keluar    jsonb,            -- {"oli":true,"hidrolik":true,"aksesoris":true}
  hour_meter_keluar   numeric check (hour_meter_keluar >= 0),
  kondisi_kirim       text check (kondisi_kirim in
                      ('Baik', 'Perlu perbaikan', 'Rusak ringan', 'Rusak berat')),
  foto_keluar_url     text,
  ttd_driver_url      text,
  -- Check-in (BR-07, BRL-05)
  tanggal_masuk       timestamptz,
  qr_discan_masuk     boolean not null default false,
  hour_meter_masuk    numeric,
  kondisi_tiba        text check (kondisi_tiba in
                      ('Baik', 'Perlu perbaikan', 'Rusak ringan', 'Rusak berat')),
  running_test_ok     boolean,
  foto_masuk_url      text,
  penerima            text,
  discrepancy_note    text,
  geo_lat             numeric, geo_lng numeric,      -- BR-18 geo-tag
  record_time timestamptz, update_time timestamptz, updated_by text,
  check (num_nonnulls(tujuan_gudang, tujuan_proyek) = 1),
  -- BRL-04: check-out lengkap
  constraint ck_checkout_lengkap check (tanggal_keluar is null or (qr_discan_keluar and checklist_keluar is not null
         and hour_meter_keluar is not null and kondisi_kirim is not null
         and foto_keluar_url is not null and ttd_driver_url is not null)),
  -- BRL-08: masuk >= keluar, hour meter tidak mundur
  constraint ck_tanggal_masuk check (tanggal_masuk is null or (tanggal_keluar is not null and tanggal_masuk >= tanggal_keluar)),
  constraint ck_hour_meter_mundur check (hour_meter_masuk is null or hour_meter_masuk >= hour_meter_keluar),
  -- BRL-05: check-in lengkap; selisih kondisi wajib discrepancy note
  constraint ck_checkin_lengkap check (tanggal_masuk is null or (qr_discan_masuk and kondisi_tiba is not null
         and hour_meter_masuk is not null and running_test_ok is not null)),
  constraint ck_discrepancy_note check (kondisi_tiba is null or kondisi_tiba = kondisi_kirim
         or coalesce(discrepancy_note, '') <> '')
);

-- ---------------------------------------------------------------------
-- 4. Pemeliharaan (BR-10, BR-11) dan suku cadang (BR-12)
-- ---------------------------------------------------------------------
create table pemeriksaan_kondisi (
  no_pemeriksaan  text primary key,
  id_alat         text not null references alat,
  tanggal         date not null,
  judul           text,
  kode_proyek     text references proyek,
  kondisi         text not null check (kondisi in
                  ('Baik', 'Perlu perbaikan', 'Rusak ringan', 'Rusak berat')),
  hour_meter      numeric,
  uraian          text,
  pemeriksa       text not null,
  foto_url        text,
  record_time timestamptz, update_time timestamptz, updated_by text
);

create table jadwal_pm (
  id                bigint generated always as identity primary key,
  id_alat           text not null references alat,
  nama_servis       text not null,
  basis             text not null check (basis in ('Tanggal', 'Hour Meter', 'Km')),
  interval_hari     int,
  interval_hm       numeric,
  terakhir_tanggal  date,
  terakhir_hm       numeric,
  berikut_tanggal   date,
  berikut_hm        numeric,
  checklist         jsonb,
  record_time timestamptz, update_time timestamptz, updated_by text
);

create table laporan_kerusakan (
  no_laporan    text primary key,
  id_alat       text not null references alat,
  tanggal       timestamptz not null default now(),
  pelapor       text not null,
  kode_proyek   text references proyek,
  gejala        text not null,
  urgensi       text not null check (urgensi in ('Low', 'Medium', 'Critical')),
  foto_url      text,
  status        text not null default 'Dilaporkan'
                check (status in ('Dilaporkan', 'WO dibuat', 'Selesai')),
  record_time timestamptz, update_time timestamptz, updated_by text
);

create table work_order (
  no_wo          text primary key,
  no_laporan     text references laporan_kerusakan,
  id_alat        text not null references alat,
  jenis          text not null check (jenis in ('Preventif', 'Korektif', 'Overhaul', 'Inspeksi')),
  uraian         text not null,
  bengkel        text not null,
  pelaksana      text check (pelaksana in ('Mekanik internal', 'Bengkel vendor')),
  mekanik        text,
  status         text not null default 'Open' check (status in
                 ('Open', 'In Progress', 'Menunggu Verifikasi', 'Selesai')),
  waktu_mulai    timestamptz,
  waktu_selesai  timestamptz,
  dicheck_oleh   text,
  root_cause     text,
  kondisi_akhir  text check (kondisi_akhir in
                 ('Baik', 'Perlu perbaikan', 'Rusak ringan', 'Rusak berat')),
  hour_meter     numeric,
  biaya_jasa     numeric check (biaya_jasa >= 0),
  kode_proyek    text references proyek,
  record_time timestamptz, update_time timestamptz, updated_by text,
  constraint ck_wo_tanggal check (waktu_selesai >= waktu_mulai),                                  -- BRL-08
  -- BRL-07: WO hanya bisa ditutup setelah diverifikasi
  constraint ck_wo_verifikasi check (status <> 'Selesai' or (dicheck_oleh is not null and waktu_selesai is not null
         and kondisi_akhir is not null))
);

create table pemakaian_part (
  id           bigint generated always as identity primary key,
  no_wo        text not null references work_order,
  kode_barang  text not null references barang_part,
  kode_gudang  text not null references gudang_lokasi,
  qty          numeric not null check (qty > 0),
  harga_satuan numeric check (harga_satuan >= 0),
  record_time timestamptz, update_time timestamptz, updated_by text
);

-- ---------------------------------------------------------------------
-- 5. Pembelian (BR-13)
-- ---------------------------------------------------------------------
create table purchase_request (
  no_pr            text primary key,
  tanggal          date not null default current_date,
  pemohon          text not null,
  kode_proyek      text references proyek,
  jenis            text not null check (jenis in ('Alat', 'Part', 'Barang lain')),
  keperluan        text,
  status           text not null default 'Diajukan'
                   check (status in ('Draft', 'Diajukan', 'Disetujui', 'Ditolak')),
  approver         text,
  tanggal_approve  timestamptz,
  record_time timestamptz, update_time timestamptz, updated_by text
);

create table purchase_request_item (
  id              bigint generated always as identity primary key,
  no_pr           text not null references purchase_request on delete cascade,
  kode_barang     text references barang_part,
  deskripsi       text not null,
  qty             numeric not null check (qty > 0),
  satuan          text not null,
  harga_estimasi  numeric check (harga_estimasi >= 0)
);

create table penawaran_vendor (
  id              bigint generated always as identity primary key,
  no_pr           text not null references purchase_request on delete cascade,
  kode_vendor     text not null references vendor,
  harga_total     numeric not null check (harga_total >= 0),
  lead_time_hari  int,
  catatan         text,
  dipilih         boolean not null default false,
  unique (no_pr, kode_vendor)
);

create table purchase_order (
  no_po        text primary key,
  no_pr        text not null references purchase_request,              -- BRL-06
  kode_vendor  text not null references vendor,
  tanggal_po   date not null default current_date,
  status       text not null default 'PO terbit' check (status in
               ('PO terbit', 'Dikirim', 'Diterima sebagian', 'Diterima', 'Dibatalkan')),
  kode_proyek  text references proyek,
  record_time timestamptz, update_time timestamptz, updated_by text
);

create table purchase_order_item (
  id            bigint generated always as identity primary key,
  no_po         text not null references purchase_order on delete cascade,
  kode_barang   text references barang_part,
  deskripsi     text not null,
  qty           numeric not null check (qty > 0),
  satuan        text not null,
  harga_satuan  numeric not null check (harga_satuan >= 0),
  qty_diterima  numeric not null default 0,
  check (qty_diterima between 0 and qty)
);

create table penerimaan_barang (
  no_penerimaan  text primary key,
  no_po          text not null references purchase_order,
  tanggal_terima date not null,
  kode_gudang    text not null references gudang_lokasi,
  penerima       text not null,
  catatan        text,
  record_time timestamptz, update_time timestamptz, updated_by text
);

-- ---------------------------------------------------------------------
-- 6. Lintas modul
-- ---------------------------------------------------------------------
create table notifikasi (
  id           bigint generated always as identity primary key,
  untuk_peran  text,
  judul        text not null,
  pesan        text,
  link         text,              -- hash route di simulasi, mis. '#/alat/EXC-001'
  dibaca       boolean not null default false,
  record_time  timestamptz not null default now()
);

create table audit_log (
  id          bigint generated always as identity primary key,
  waktu       timestamptz not null default now(),
  oleh        text not null,
  tabel       text not null,
  id_record   text,
  aksi        text not null check (aksi in ('INSERT', 'UPDATE', 'DELETE')),
  field       text,
  nilai_lama  text,
  nilai_baru  text
);
create index on audit_log (tabel, id_record);
create index on audit_log (waktu desc);

-- ---------------------------------------------------------------------
-- 7. Trigger record_time/update_time dan audit trail untuk semua tabel
-- ---------------------------------------------------------------------
do $$
declare
  t record;
begin
  for t in select * from (values
    ('proyek', 'kode_proyek'), ('gudang_lokasi', 'kode_gudang'),
    ('vendor', 'kode_vendor'), ('pengguna', 'id_pengguna'), ('alat', 'id_alat'),
    ('dokumen_legal_alat', 'id'), ('barang_part', 'kode_barang'),
    ('kebutuhan_alat_proyek', 'no_kebutuhan'), ('permintaan_mobilisasi', 'no_permintaan'),
    ('mutasi_alat', 'no_mutasi'), ('pemeriksaan_kondisi', 'no_pemeriksaan'),
    ('jadwal_pm', 'id'), ('laporan_kerusakan', 'no_laporan'), ('work_order', 'no_wo'),
    ('pemakaian_part', 'id'), ('purchase_request', 'no_pr'),
    ('purchase_order', 'no_po'), ('penerimaan_barang', 'no_penerimaan')
  ) v(tabel, pk) loop
    execute format('create trigger trg_%1$s_waktu before insert or update on %1$I
                    for each row execute function fn_waktu_record()', t.tabel);
    execute format('create trigger trg_%1$s_audit after insert or update or delete on %1$I
                    for each row execute function fn_audit(%2$L)', t.tabel, t.pk);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 8. Aturan bisnis di database
-- ---------------------------------------------------------------------

-- BRL-11: data alat tidak boleh dihapus permanen.
create function fn_cegah_hapus_alat() returns trigger language plpgsql as $$
begin
  raise exception 'Alat % tidak boleh dihapus. Ubah status menjadi Scrapped dan isi tanggal_dihapus.', old.id_alat;
end $$;
create trigger trg_alat_cegah_hapus before delete on alat
  for each row execute function fn_cegah_hapus_alat();

-- BRL-02/03: hanya alat Ready yang bisa dimasukkan ke permintaan site.
create function fn_permintaan_item_sebelum() returns trigger language plpgsql as $$
declare st text;
begin
  if fn_mode_seed() then return new; end if;
  select status into st from alat where id_alat = new.id_alat;
  if st <> 'Ready' then
    raise exception 'Alat % berstatus % dan tidak dapat dialokasikan. Hanya alat Ready yang bisa diminta.', new.id_alat, st;
  end if;
  return new;
end $$;
create trigger trg_permintaan_item_sebelum before insert on permintaan_mobilisasi_item
  for each row execute function fn_permintaan_item_sebelum();

-- BRL-02/03/08: validasi sebelum mutasi.
create function fn_mutasi_sebelum() returns trigger language plpgsql as $$
declare
  a alat;
  p proyek;
begin
  if fn_mode_seed() then return new; end if;
  select * into a from alat where id_alat = new.id_alat;
  if tg_op = 'INSERT' then
    if a.status in ('Under Maintenance', 'Broken', 'Scrapped') then
      raise exception 'Alat % berstatus % dan tidak dapat dimobilisasi.', a.id_alat, a.status;
    end if;
    if new.jenis = 'Mobilisasi' and a.status <> 'Ready' then
      raise exception 'Mobilisasi hanya untuk alat Ready (status % saat ini: %).', a.id_alat, a.status;
    end if;
    if new.jenis in ('Demobilisasi', 'Transfer') and a.status <> 'In Use' then
      raise exception 'Demobilisasi/transfer hanya untuk alat In Use (status % saat ini: %).', a.id_alat, a.status;
    end if;
    if new.no_permintaan is not null and not exists (
       select 1 from permintaan_mobilisasi where no_permintaan = new.no_permintaan
       and status = 'Disetujui') then
      raise exception 'Permintaan % belum disetujui.', new.no_permintaan;
    end if;
  end if;
  -- BRL-08: tanggal masuk proyek harus dalam periode proyek
  if new.tanggal_masuk is not null and new.tujuan_proyek is not null then
    select * into p from proyek where kode_proyek = new.tujuan_proyek;
    if new.tanggal_masuk::date < coalesce(p.realisasi_mulai, p.rencana_mulai, '-infinity')
       or new.tanggal_masuk::date > coalesce(p.realisasi_selesai, p.rencana_selesai, 'infinity') then
      raise exception 'Tanggal masuk % di luar periode proyek %.', new.tanggal_masuk::date, p.kode_proyek;
    end if;
  end if;
  return new;
end $$;
create trigger trg_mutasi_sebelum before insert or update on mutasi_alat
  for each row execute function fn_mutasi_sebelum();

-- Status alat ikut berubah saat check-out dan check-in.
create function fn_mutasi_sesudah() returns trigger language plpgsql as $$
begin
  if fn_mode_seed() then return null; end if;
  if new.tanggal_masuk is not null
     and (tg_op = 'INSERT' or old.tanggal_masuk is null) then
    update alat set
      status      = case when not new.running_test_ok then 'Broken'
                         when new.tujuan_proyek is not null then 'In Use'
                         else 'Ready' end,
      kode_proyek = new.tujuan_proyek,
      kode_gudang = new.tujuan_gudang,
      kondisi     = new.kondisi_tiba,
      hour_meter  = new.hour_meter_masuk,
      updated_by  = coalesce(new.updated_by, 'sistem') || ' (check-in ' || new.no_mutasi || ')'
    where id_alat = new.id_alat;
  elsif new.tanggal_keluar is not null
     and (tg_op = 'INSERT' or old.tanggal_keluar is null) then
    update alat set
      status      = 'In Transit',
      kode_proyek = null,
      kode_gudang = null,
      hour_meter  = greatest(hour_meter, new.hour_meter_keluar),
      updated_by  = coalesce(new.updated_by, 'sistem') || ' (check-out ' || new.no_mutasi || ')'
    where id_alat = new.id_alat;
  end if;
  return null;
end $$;
create trigger trg_mutasi_sesudah after insert or update on mutasi_alat
  for each row execute function fn_mutasi_sesudah();

-- Laporan kerusakan Critical membuat alat Broken.
create function fn_kerusakan_sesudah() returns trigger language plpgsql as $$
begin
  if fn_mode_seed() then return null; end if;
  if new.urgensi = 'Critical' then
    update alat set status = 'Broken',
      updated_by = coalesce(new.updated_by, 'sistem') || ' (laporan ' || new.no_laporan || ')'
    where id_alat = new.id_alat and status <> 'Scrapped';
  end if;
  return null;
end $$;
create trigger trg_kerusakan_sesudah after insert on laporan_kerusakan
  for each row execute function fn_kerusakan_sesudah();

-- Work order: alat Scrapped tidak bisa dibuka WO.
create function fn_wo_sebelum() returns trigger language plpgsql as $$
begin
  if fn_mode_seed() then return new; end if;
  if tg_op = 'INSERT' and exists (select 1 from alat where id_alat = new.id_alat
                                  and status = 'Scrapped') then
    raise exception 'Alat % sudah Scrapped.', new.id_alat;
  end if;
  return new;
end $$;
create trigger trg_wo_sebelum before insert on work_order
  for each row execute function fn_wo_sebelum();

-- WO dibuka -> Under Maintenance; WO selesai & terverifikasi -> Ready (BRL-07).
create function fn_wo_sesudah() returns trigger language plpgsql as $$
begin
  if fn_mode_seed() then return null; end if;
  if new.status = 'Selesai' and (tg_op = 'INSERT' or old.status <> 'Selesai') then
    update alat set status = 'Ready', kondisi = new.kondisi_akhir,
      hour_meter = greatest(hour_meter, coalesce(new.hour_meter, 0)),
      updated_by = coalesce(new.updated_by, 'sistem') || ' (WO ' || new.no_wo || ' diverifikasi)'
    where id_alat = new.id_alat;
    update laporan_kerusakan set status = 'Selesai' where no_laporan = new.no_laporan;
  elsif tg_op = 'INSERT' then
    update alat set status = 'Under Maintenance',
      updated_by = coalesce(new.updated_by, 'sistem') || ' (WO ' || new.no_wo || ')'
    where id_alat = new.id_alat;
    update laporan_kerusakan set status = 'WO dibuat' where no_laporan = new.no_laporan;
  end if;
  return null;
end $$;
create trigger trg_wo_sesudah after insert or update on work_order
  for each row execute function fn_wo_sesudah();

-- Pemakaian part mengurangi stok gudang (gagal bila stok kurang).
create function fn_pakai_part() returns trigger language plpgsql as $$
begin
  if fn_mode_seed() then return new; end if;
  update stok_gudang set qty = qty - new.qty, update_time = now()
  where kode_gudang = new.kode_gudang and kode_barang = new.kode_barang;
  if not found then
    raise exception 'Part % tidak ada di gudang %.', new.kode_barang, new.kode_gudang;
  end if;
  return new;
end $$;
create trigger trg_pakai_part before insert on pemakaian_part
  for each row execute function fn_pakai_part();

-- BRL-06: PO hanya dari PR yang disetujui.
create function fn_po_sebelum() returns trigger language plpgsql as $$
declare st text;
begin
  if fn_mode_seed() then return new; end if;
  select status into st from purchase_request where no_pr = new.no_pr;
  if st is distinct from 'Disetujui' then
    raise exception 'PO tidak bisa dibuat: PR % berstatus %.', new.no_pr, coalesce(st, 'tidak ditemukan');
  end if;
  return new;
end $$;
create trigger trg_po_sebelum before insert on purchase_order
  for each row execute function fn_po_sebelum();

-- BRL-08: tanggal diterima >= tanggal PO.
create function fn_terima_sebelum() returns trigger language plpgsql as $$
declare tgl date;
begin
  select tanggal_po into tgl from purchase_order where no_po = new.no_po;
  if new.tanggal_terima < tgl then
    raise exception 'Tanggal terima % lebih awal dari tanggal PO %.', new.tanggal_terima, tgl;
  end if;
  return new;
end $$;
create trigger trg_terima_sebelum before insert or update on penerimaan_barang
  for each row execute function fn_terima_sebelum();

-- ---------------------------------------------------------------------
-- 9. View untuk dashboard dan laporan (BR-14..BR-16)
-- ---------------------------------------------------------------------
create view v_dashboard_kpi as
select
  count(*) filter (where status <> 'Scrapped')                         as total_alat,
  count(*) filter (where status = 'In Use')                            as alat_in_use,
  count(*) filter (where status in ('Under Maintenance', 'Broken'))    as alat_downtime,
  round(100.0 * count(*) filter (where status = 'In Use')
        / nullif(count(*) filter (where status <> 'Scrapped'), 0))     as utilisasi_persen,
  (select count(*) from mutasi_alat where tanggal_keluar is not null
                                      and tanggal_masuk is null)        as mobilisasi_aktif
from alat;

create view v_laporan_stok_alat as
select a.id_alat, a.nama_alat, a.jenis_alat, a.merk || ' ' || a.tipe as merk_tipe,
       a.no_seri, a.status, a.kondisi,
       coalesce(p.nama_proyek, g.nama_gudang, 'Dalam perjalanan') as lokasi,
       a.kode_proyek, a.kode_gudang, a.pic, a.hour_meter
from alat a
left join proyek p on p.kode_proyek = a.kode_proyek
left join gudang_lokasi g on g.kode_gudang = a.kode_gudang;

create view v_laporan_kondisi as
select a.id_alat, a.nama_alat, a.status, a.kondisi, a.hour_meter,
       pk.tanggal as pemeriksaan_terakhir, pk.pemeriksa,
       (select count(*) from work_order w where w.id_alat = a.id_alat) as jumlah_wo
from alat a
left join lateral (select tanggal, pemeriksa from pemeriksaan_kondisi x
                   where x.id_alat = a.id_alat order by tanggal desc limit 1) pk on true;

create view v_laporan_kebutuhan as
select k.*, p.nama_proyek, k.jumlah_dibutuhkan - k.jumlah_terpenuhi as selisih
from kebutuhan_alat_proyek k join proyek p using (kode_proyek);

create view v_peringatan_dini as
select 'Servis jatuh tempo' as jenis, j.id_alat as referensi,
       j.nama_servis as keterangan, j.berikut_tanggal as tanggal
from jadwal_pm j join alat a using (id_alat)
where (j.berikut_tanggal <= current_date + 14
       or (j.berikut_hm is not null and a.hour_meter >= j.berikut_hm - 50))
  and a.status <> 'Scrapped'
union all
select 'Dokumen ' || d.jenis || ' hampir habis', d.id_alat, d.nomor, d.berlaku_sampai
from dokumen_legal_alat d
where d.berlaku_sampai <= current_date + 60
union all
select 'Garansi hampir habis', a.id_alat, a.nama_alat, a.garansi_sampai
from alat a
where a.garansi_sampai between current_date and current_date + 60
union all
select 'Stok part kritis', b.kode_barang,
       b.nama_barang || ' (stok ' || coalesce(s.total, 0) || ', min ' || b.stok_minimum || ')', null
from barang_part b
left join (select kode_barang, sum(qty) total from stok_gudang group by kode_barang) s
  using (kode_barang)
where coalesce(s.total, 0) < b.stok_minimum;

-- View mengikuti hak akses pemanggil (Supabase API).
alter view v_dashboard_kpi set (security_invoker = true);
alter view v_laporan_stok_alat set (security_invoker = true);
alter view v_laporan_kondisi set (security_invoker = true);
alter view v_laporan_kebutuhan set (security_invoker = true);
alter view v_peringatan_dini set (security_invoker = true);

-- ---------------------------------------------------------------------
-- 10. Row Level Security
-- KHUSUS SIMULASI: role anon dan authenticated boleh baca/tulis semua
-- tabel agar demo jalan tanpa login sungguhan. Audit log hanya bisa
-- dibaca dan ditambah, tidak bisa diubah atau dihapus.
-- Untuk production, ganti dengan policy per peran (BR-19).
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table %I enable row level security', t);
    if t = 'audit_log' then
      execute format('create policy simulasi_baca on %I for select to anon, authenticated using (true)', t);
    else
      execute format('create policy simulasi_akses on %I for all to anon, authenticated using (true) with check (true)', t);
    end if;
  end loop;
end $$;
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
revoke insert, update, delete on audit_log from anon, authenticated;
grant usage on all sequences in schema public to anon, authenticated;

-- Fungsi trigger audit berjalan sebagai pemilik agar bisa menulis audit_log.
alter function fn_audit() security definer set search_path = public;

-- Selesai. Lanjutkan dengan 02_seed_geoace.sql.
