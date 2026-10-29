// =============================================================
// data.js — GeoACE Logistic & Machinery Management System
// Data lokal / fallback.  Nama kolom HARUS cocok dengan skema
// database (02_seed_geoace.sql).  ID identik dengan seed SQL.
// =============================================================

const INITIAL_DATA = {

  // ── PROYEK ─────────────────────────────────────────────────
  // Tabel: proyek | PK: kode_proyek
  projects: [
    { kode_proyek:'PRJ-2026-01', nama_proyek:'Proyek Eksplorasi Kalimantan',  klien:'PT Tambang Nusantara (fiktif)',      lokasi:'Kutai Barat, Kalimantan Timur',  jenis_pekerjaan:'Pengeboran eksplorasi',   manajer_proyek:'PM Proyek A', rencana_mulai:'2026-01-05', rencana_selesai:'2026-12-20', realisasi_mulai:'2026-01-12', sumber_listrik:'Genset',          kapasitas_listrik_kva:500, cost_center:'CC-PRJ01', status:'Berjalan' },
    { kode_proyek:'PRJ-2026-02', nama_proyek:'Proyek Geoteknik Sulawesi',     klien:'PT Infrastruktur Timur (fiktif)',    lokasi:'Morowali, Sulawesi Tengah',      jenis_pekerjaan:'Investigasi geoteknik',   manajer_proyek:'PM Proyek B', rencana_mulai:'2026-03-01', rencana_selesai:'2026-11-30', realisasi_mulai:'2026-03-09', sumber_listrik:'Genset',          kapasitas_listrik_kva:250, cost_center:'CC-PRJ02', status:'Berjalan' },
    { kode_proyek:'PRJ-2026-03', nama_proyek:'Proyek Survei Sumatra',         klien:'PT Energi Andalas (fiktif)',         lokasi:'Muara Enim, Sumatra Selatan',    jenis_pekerjaan:'Survei geologi',          manajer_proyek:'PM Proyek C', rencana_mulai:'2026-06-01', rencana_selesai:'2027-02-28', realisasi_mulai:'2026-06-15', sumber_listrik:'PLN',             kapasitas_listrik_kva:100, cost_center:'CC-PRJ03', status:'Berjalan' },
    { kode_proyek:'PRJ-2026-04', nama_proyek:'Proyek Pengeboran Jawa Barat',  klien:'PT Panas Bumi Priangan (fiktif)',   lokasi:'Garut, Jawa Barat',              jenis_pekerjaan:'Pengeboran geoteknik',    manajer_proyek:'PM Proyek D', rencana_mulai:'2026-11-15', rencana_selesai:'2027-06-30', realisasi_mulai:null,         sumber_listrik:'Tidak tersedia',  kapasitas_listrik_kva:null, cost_center:'CC-PRJ04', status:'Rencana' },
  ],

  // ── GUDANG & LOKASI ────────────────────────────────────────
  // Tabel: gudang_lokasi | PK: kode_gudang
  warehouses: [
    { kode_gudang:'GDG-PST', nama_gudang:'Gudang Pusat Jakarta',       jenis:'Pusat',   kode_proyek:null,        alamat:'Kawasan Industri Pulogadung, Jakarta Timur', penanggung_jawab:'Kepala Gudang Pusat',            telepon:'021-0000001' },
    { kode_gudang:'GDG-KTB', nama_gudang:'Gudang Site Kalimantan',     jenis:'Site',    kode_proyek:'PRJ-2026-01', alamat:'Base camp Kutai Barat',                    penanggung_jawab:'Petugas Gudang Site Kalimantan',  telepon:'0811-0000002' },
    { kode_gudang:'BKL-PST', nama_gudang:'Bengkel Pusat',              jenis:'Bengkel', kode_proyek:null,        alamat:'Kawasan Industri Pulogadung, Jakarta Timur', penanggung_jawab:'Supervisor Workshop',            telepon:'021-0000003' },
  ],

  // ── VENDOR ─────────────────────────────────────────────────
  // Tabel: vendor | PK: kode_vendor
  vendors: [
    { kode_vendor:'VND-001', nama_vendor:'PT Sarana Alat Berat Mandiri',  npwp:'01.111.111.1-001.000', kota:'Jakarta',    nama_kontak:'Sales Alat Berat',  telepon:'021-1111111', email:'sales@sarana-ab.example',  kategori:'Alat berat',  termin_hari:30, status_pkp:'PKP', aktif:true },
    { kode_vendor:'VND-002', nama_vendor:'PT Daya Genset Prima',          npwp:'01.222.222.2-002.000', kota:'Bekasi',     nama_kontak:'Sales Genset',      telepon:'021-2222222', email:'sales@dayagenset.example', kategori:'Mesin',       termin_hari:30, status_pkp:'PKP', aktif:true },
    { kode_vendor:'VND-003', nama_vendor:'CV Sparepart Teknik Jaya',      npwp:'01.333.333.3-003.000', kota:'Surabaya',   nama_kontak:'Admin Penjualan',   telepon:'031-3333333', email:'order@stj.example',        kategori:'Sparepart',   termin_hari:14, status_pkp:'PKP', aktif:true },
    { kode_vendor:'VND-004', nama_vendor:'PT Presisi Survei Instrumen',   npwp:'01.444.444.4-004.000', kota:'Bandung',    nama_kontak:'Sales Instrumen',   telepon:'022-4444444', email:'sales@presisi.example',    kategori:'Alat ukur',   termin_hari:30, status_pkp:'PKP', aktif:true },
    { kode_vendor:'VND-005', nama_vendor:'CV Pelumas Borneo',             npwp:null,                   kota:'Balikpapan', nama_kontak:'Pemilik',           telepon:'0542-555555', email:'cvpb@mail.example',        kategori:'Consumable',  termin_hari:7,  status_pkp:'Non-PKP', aktif:true },
  ],

  // ── KATEGORI BARANG ────────────────────────────────────────
  // Tabel: kategori_barang | PK: kode_kategori
  categories: [
    { kode_kategori:'SPR', nama_kategori:'Sparepart', satuan_dasar:'Pcs', keterangan:'Suku cadang mesin dan alat' },
    { kode_kategori:'CSM', nama_kategori:'Consumable', satuan_dasar:'Liter', keterangan:'Oli, grease, mata bor habis pakai' },
    { kode_kategori:'BBM', nama_kategori:'BBM', satuan_dasar:'Liter', keterangan:'Solar dan bensin' },
    { kode_kategori:'TLS', nama_kategori:'Tools', satuan_dasar:'Pcs', keterangan:'Perkakas tangan' },
  ],

  // ── PENGGUNA ───────────────────────────────────────────────
  // Tabel: pengguna | PK: id_pengguna
  users: [
    { id_pengguna:'USR-01', nama:'PM Proyek A',          jabatan:'Project Manager',     departemen:'Operasional', email:'pm.a@geoace.example',          peran:'PM Site',    kode_proyek:'PRJ-2026-01', level_approval:1, batas_nilai_approval:50000000,   aktif:true },
    { id_pengguna:'USR-02', nama:'Petugas Gudang Pusat', jabatan:'Staf Logistik',       departemen:'Logistik',    email:'gudang@geoace.example',        peran:'Gudang',     kode_proyek:null,          level_approval:0, batas_nilai_approval:0,          aktif:true },
    { id_pengguna:'USR-03', nama:'Driver Lowbed 1',      jabatan:'Driver',              departemen:'Logistik',    email:'driver1@geoace.example',       peran:'Driver',     kode_proyek:null,          level_approval:0, batas_nilai_approval:0,          aktif:true },
    { id_pengguna:'USR-04', nama:'Mekanik Senior',       jabatan:'Mekanik',             departemen:'Workshop',    email:'mekanik@geoace.example',       peran:'Mekanik',    kode_proyek:null,          level_approval:0, batas_nilai_approval:0,          aktif:true },
    { id_pengguna:'USR-05', nama:'Supervisor Workshop',  jabatan:'Supervisor',          departemen:'Workshop',    email:'spv.workshop@geoace.example',  peran:'Mekanik',    kode_proyek:null,          level_approval:1, batas_nilai_approval:10000000,   aktif:true },
    { id_pengguna:'USR-06', nama:'Staf Purchasing',      jabatan:'Purchasing Officer',  departemen:'Pengadaan',   email:'purchasing@geoace.example',    peran:'Purchasing', kode_proyek:null,          level_approval:0, batas_nilai_approval:0,          aktif:true },
    { id_pengguna:'USR-07', nama:'Staf Finance',         jabatan:'Finance Officer',     departemen:'Keuangan',    email:'finance@geoace.example',       peran:'Finance',    kode_proyek:null,          level_approval:0, batas_nilai_approval:0,          aktif:true },
    { id_pengguna:'USR-08', nama:'Petugas HSE',          jabatan:'HSE Officer',         departemen:'HSE',         email:'hse@geoace.example',           peran:'HSE',        kode_proyek:null,          level_approval:0, batas_nilai_approval:0,          aktif:true },
    { id_pengguna:'USR-09', nama:'Direktur Operasional', jabatan:'Direktur',            departemen:'Direksi',     email:'direksi@geoace.example',       peran:'Manajemen',  kode_proyek:null,          level_approval:3, batas_nilai_approval:5000000000, aktif:true },
    { id_pengguna:'USR-10', nama:'Admin Sistem',         jabatan:'Admin IT',            departemen:'IT',          email:'admin@geoace.example',         peran:'Admin',      kode_proyek:null,          level_approval:0, batas_nilai_approval:0,          aktif:true },
  ],

  // ── ALAT ───────────────────────────────────────────────────
  // Tabel: alat | PK: id_alat
  equipment: [
    { id_alat:'DRL-001', nama_alat:'Drilling Rig Hidrolik 1',        jenis_alat:'Alat berat', merk:'Boart Longyear', tipe:'LF90D',                no_seri:'BL-LF90-23011',    status:'In Use',            kondisi:'Baik',             kode_gudang:null,    kode_proyek:'PRJ-2026-01', pic:'Tim Bor Kalimantan',            hour_meter:3120,  daya:140, satuan_daya:'kW',  bahan_bakar:'Solar',  kepemilikan:'Milik sendiri', tahun_pembuatan:2022, tanggal_beli:'2022-08-10', nilai_aset:4200000000, garansi_sampai:'2025-08-10', tanggal_dihapus:null },
    { id_alat:'DRL-002', nama_alat:'Drilling Rig Hidrolik 2',        jenis_alat:'Alat berat', merk:'Boart Longyear', tipe:'LF90D',                no_seri:'BL-LF90-23047',    status:'Ready',             kondisi:'Baik',             kode_gudang:'GDG-PST', kode_proyek:null,          pic:'Kepala Gudang Pusat',           hour_meter:2480,  daya:140, satuan_daya:'kW',  bahan_bakar:'Solar',  kepemilikan:'Milik sendiri', tahun_pembuatan:2023, tanggal_beli:'2023-02-14', nilai_aset:4350000000, garansi_sampai:'2026-12-14', tanggal_dihapus:null },
    { id_alat:'DRL-003', nama_alat:'Rig Bor Geoteknik Portable',     jenis_alat:'Mesin',      merk:'Tone',           tipe:'TOP-1',                no_seri:'TN-TOP1-1902',     status:'In Use',            kondisi:'Perlu perbaikan',  kode_gudang:null,    kode_proyek:'PRJ-2026-02', pic:'Tim Geoteknik Sulawesi',        hour_meter:5210,  daya:15,  satuan_daya:'HP',  bahan_bakar:'Bensin', kepemilikan:'Milik sendiri', tahun_pembuatan:2019, tanggal_beli:'2019-06-03', nilai_aset:380000000,  garansi_sampai:'2021-06-03', tanggal_dihapus:null },
    { id_alat:'EXC-001', nama_alat:'Excavator 20 Ton',               jenis_alat:'Alat berat', merk:'Komatsu',        tipe:'PC200-8',              no_seri:'KMT-PC200-K12345', status:'In Use',            kondisi:'Baik',             kode_gudang:null,    kode_proyek:'PRJ-2026-01', pic:'Tim Proyek A',                  hour_meter:8450,  daya:110, satuan_daya:'kW',  bahan_bakar:'Solar',  kepemilikan:'Milik sendiri', tahun_pembuatan:2019, tanggal_beli:'2019-05-10', nilai_aset:1200000000, garansi_sampai:'2021-05-10', tanggal_dihapus:null },
    { id_alat:'EXC-002', nama_alat:'Excavator Mini 5 Ton',           jenis_alat:'Alat berat', merk:'Kobelco',        tipe:'SK55SR',               no_seri:'KBL-SK55-77310',   status:'Ready',             kondisi:'Baik',             kode_gudang:'GDG-PST', kode_proyek:null,          pic:'Kepala Gudang Pusat',           hour_meter:2140,  daya:29,  satuan_daya:'kW',  bahan_bakar:'Solar',  kepemilikan:'Milik sendiri', tahun_pembuatan:2021, tanggal_beli:'2021-09-20', nilai_aset:620000000,  garansi_sampai:'2023-09-20', tanggal_dihapus:null },
    { id_alat:'GEN-001', nama_alat:'Genset 100 kVA',                 jenis_alat:'Mesin',      merk:'Cummins',        tipe:'C100D5',               no_seri:'CMN-C100-55102',   status:'In Use',            kondisi:'Baik',             kode_gudang:null,    kode_proyek:'PRJ-2026-01', pic:'Tim Bor Kalimantan',            hour_meter:6900,  daya:100, satuan_daya:'kVA', bahan_bakar:'Solar',  kepemilikan:'Milik sendiri', tahun_pembuatan:2020, tanggal_beli:'2020-03-02', nilai_aset:350000000,  garansi_sampai:'2022-03-02', tanggal_dihapus:null },
    { id_alat:'GEN-002', nama_alat:'Genset 100 kVA',                 jenis_alat:'Mesin',      merk:'Cummins',        tipe:'C100D5',               no_seri:'CMN-C100-55188',   status:'In Transit',        kondisi:'Baik',             kode_gudang:null,    kode_proyek:null,          pic:'Driver Lowbed 1',               hour_meter:4310,  daya:100, satuan_daya:'kVA', bahan_bakar:'Solar',  kepemilikan:'Milik sendiri', tahun_pembuatan:2021, tanggal_beli:'2021-04-12', nilai_aset:365000000,  garansi_sampai:'2023-04-12', tanggal_dihapus:null },
    { id_alat:'GEN-003', nama_alat:'Genset 20 kVA',                  jenis_alat:'Mesin',      merk:'Yanmar',         tipe:'YDG20',                no_seri:'YNM-YDG20-1120',   status:'Ready',             kondisi:'Baik',             kode_gudang:'GDG-KTB', kode_proyek:null,          pic:'Petugas Gudang Site Kalimantan', hour_meter:1870, daya:20,  satuan_daya:'kVA', bahan_bakar:'Solar',  kepemilikan:'Milik sendiri', tahun_pembuatan:2022, tanggal_beli:'2022-01-18', nilai_aset:95000000,   garansi_sampai:'2024-01-18', tanggal_dihapus:null },
    { id_alat:'CMP-001', nama_alat:'Kompresor Udara 750 CFM',        jenis_alat:'Mesin',      merk:'Atlas Copco',    tipe:'XAS 750',              no_seri:'AC-XAS750-8812',   status:'Under Maintenance', kondisi:'Rusak ringan',     kode_gudang:'BKL-PST', kode_proyek:null,          pic:'Supervisor Workshop',           hour_meter:3980,  daya:186, satuan_daya:'kW',  bahan_bakar:'Solar',  kepemilikan:'Milik sendiri', tahun_pembuatan:2020, tanggal_beli:'2020-10-05', nilai_aset:780000000,  garansi_sampai:'2022-10-05', tanggal_dihapus:null },
    { id_alat:'CMP-002', nama_alat:'Kompresor Udara 185 CFM',        jenis_alat:'Mesin',      merk:'Airman',         tipe:'PDS185S',              no_seri:'AIR-PDS185-3021',  status:'In Use',            kondisi:'Baik',             kode_gudang:null,    kode_proyek:'PRJ-2026-03', pic:'Tim Survei Sumatra',            hour_meter:1520,  daya:37,  satuan_daya:'kW',  bahan_bakar:'Solar',  kepemilikan:'Sewa',          tahun_pembuatan:2023, tanggal_beli:null,         nilai_aset:null,       garansi_sampai:null,        tanggal_dihapus:null },
    { id_alat:'PMP-001', nama_alat:'Pompa Lumpur Triplex',           jenis_alat:'Mesin',      merk:'Gardner Denver', tipe:'PZ-7',                 no_seri:'GD-PZ7-0451',      status:'In Use',            kondisi:'Baik',             kode_gudang:null,    kode_proyek:'PRJ-2026-01', pic:'Tim Bor Kalimantan',            hour_meter:4400,  daya:75,  satuan_daya:'kW',  bahan_bakar:'Solar',  kepemilikan:'Milik sendiri', tahun_pembuatan:2021, tanggal_beli:'2021-07-22', nilai_aset:520000000,  garansi_sampai:'2023-07-22', tanggal_dihapus:null },
    { id_alat:'PMP-002', nama_alat:'Pompa Air Submersible 3 inci',   jenis_alat:'Alat ringan', merk:'Grundfos',      tipe:'SP 17-8',              no_seri:'GRF-SP17-9934',    status:'Broken',            kondisi:'Rusak berat',      kode_gudang:null,    kode_proyek:'PRJ-2026-02', pic:'Tim Geoteknik Sulawesi',        hour_meter:2210,  daya:5.5, satuan_daya:'kW',  bahan_bakar:'Listrik', kepemilikan:'Milik sendiri', tahun_pembuatan:2022, tanggal_beli:'2022-05-09', nilai_aset:48000000,   garansi_sampai:'2024-05-09', tanggal_dihapus:null },
    { id_alat:'TRK-001', nama_alat:'Truk Lowbed 30 Ton',             jenis_alat:'Alat berat', merk:'Hino',           tipe:'FM 260 JD',            no_seri:'HNO-FM260-6120',   status:'Ready',             kondisi:'Baik',             kode_gudang:'GDG-PST', kode_proyek:null,          pic:'Driver Lowbed 1',               hour_meter:0,     daya:191, satuan_daya:'kW',  bahan_bakar:'Solar',  kepemilikan:'Milik sendiri', tahun_pembuatan:2018, tanggal_beli:'2018-11-01', nilai_aset:1350000000, garansi_sampai:'2019-11-01', tanggal_dihapus:null },
    { id_alat:'TRK-002', nama_alat:'Truk Crane 5 Ton',               jenis_alat:'Alat berat', merk:'Mitsubishi',     tipe:'Fuso FE 74 + Palfinger', no_seri:'MFS-FE74-4431',  status:'Ready',             kondisi:'Perlu perbaikan',  kode_gudang:'GDG-PST', kode_proyek:null,          pic:'Kepala Gudang Pusat',           hour_meter:0,     daya:100, satuan_daya:'kW',  bahan_bakar:'Solar',  kepemilikan:'Milik sendiri', tahun_pembuatan:2020, tanggal_beli:'2020-02-20', nilai_aset:890000000,  garansi_sampai:'2022-02-20', tanggal_dihapus:null },
    { id_alat:'THD-001', nama_alat:'Total Station',                  jenis_alat:'Alat ukur',  merk:'Topcon',         tipe:'GM-105',               no_seri:'TPC-GM105-7731',   status:'In Use',            kondisi:'Baik',             kode_gudang:null,    kode_proyek:'PRJ-2026-03', pic:'Tim Survei Sumatra',            hour_meter:0,     daya:null, satuan_daya:null, bahan_bakar:'Baterai', kepemilikan:'Milik sendiri', tahun_pembuatan:2024, tanggal_beli:'2024-01-15', nilai_aset:145000000,  garansi_sampai:'2027-01-15', tanggal_dihapus:null },
    { id_alat:'THD-002', nama_alat:'Theodolite Digital',             jenis_alat:'Alat ukur',  merk:'Nikon',          tipe:'NE-103',               no_seri:'NKN-NE103-2290',   status:'Ready',             kondisi:'Baik',             kode_gudang:'GDG-PST', kode_proyek:null,          pic:'Kepala Gudang Pusat',           hour_meter:0,     daya:null, satuan_daya:null, bahan_bakar:'Baterai', kepemilikan:'Milik sendiri', tahun_pembuatan:2021, tanggal_beli:'2021-03-08', nilai_aset:38000000,   garansi_sampai:'2023-03-08', tanggal_dihapus:null },
    { id_alat:'GPS-001', nama_alat:'GNSS RTK Receiver',              jenis_alat:'Alat ukur',  merk:'Trimble',        tipe:'R12i',                 no_seri:'TRM-R12I-6051',    status:'In Use',            kondisi:'Baik',             kode_gudang:null,    kode_proyek:'PRJ-2026-02', pic:'Tim Geoteknik Sulawesi',        hour_meter:0,     daya:null, satuan_daya:null, bahan_bakar:'Baterai', kepemilikan:'Milik sendiri', tahun_pembuatan:2024, tanggal_beli:'2024-06-11', nilai_aset:310000000,  garansi_sampai:'2026-12-11', tanggal_dihapus:null },
    { id_alat:'WLD-001', nama_alat:'Mesin Las Diesel 400A',          jenis_alat:'Mesin',      merk:'Lincoln',        tipe:'Ranger 305D',          no_seri:'LNC-R305-1188',    status:'Under Maintenance', kondisi:'Perlu perbaikan',  kode_gudang:'BKL-PST', kode_proyek:null,          pic:'Supervisor Workshop',           hour_meter:2650,  daya:17,  satuan_daya:'kW',  bahan_bakar:'Solar',  kepemilikan:'Milik sendiri', tahun_pembuatan:2019, tanggal_beli:'2019-09-30', nilai_aset:160000000,  garansi_sampai:'2021-09-30', tanggal_dihapus:null },
    { id_alat:'LGT-001', nama_alat:'Lighting Tower',                 jenis_alat:'Alat ringan', merk:'Generac',       tipe:'VT-Hybrid',            no_seri:'GNR-VTH-4470',     status:'In Use',            kondisi:'Baik',             kode_gudang:null,    kode_proyek:'PRJ-2026-01', pic:'Tim Bor Kalimantan',            hour_meter:3300,  daya:6,   satuan_daya:'kW',  bahan_bakar:'Solar',  kepemilikan:'Sewa',          tahun_pembuatan:2023, tanggal_beli:null,         nilai_aset:null,       garansi_sampai:null,        tanggal_dihapus:null },
    { id_alat:'CMP-000', nama_alat:'Kompresor Udara 375 CFM (lama)', jenis_alat:'Mesin',      merk:'Atlas Copco',    tipe:'XAS 375',              no_seri:'AC-XAS375-1003',   status:'Scrapped',          kondisi:'Rusak berat',      kode_gudang:'GDG-PST', kode_proyek:null,          pic:'Kepala Gudang Pusat',           hour_meter:15800, daya:110, satuan_daya:'kW',  bahan_bakar:'Solar',  kepemilikan:'Milik sendiri', tahun_pembuatan:2012, tanggal_beli:'2012-04-01', nilai_aset:410000000,  garansi_sampai:'2013-04-01', tanggal_dihapus:'2026-06-30' },
  ],

  // ── BARANG / PART ──────────────────────────────────────────
  // Tabel: barang_part | PK: kode_barang
  parts: [
    { kode_barang:'BRG-0001', nama_barang:'Filter Oli Excavator PC200',    kode_kategori:'SPR', satuan:'Pcs',   merk:'Komatsu',        part_number:'600-211-1340',    stok_minimum:10,  lokasi_rak:'A-01', harga_terakhir:150000  },
    { kode_barang:'BRG-0002', nama_barang:'Filter Solar PC200',            kode_kategori:'SPR', satuan:'Pcs',   merk:'Komatsu',        part_number:'600-319-3750',    stok_minimum:10,  lokasi_rak:'A-02', harga_terakhir:210000  },
    { kode_barang:'BRG-0003', nama_barang:'Filter Udara Kompresor XAS',    kode_kategori:'SPR', satuan:'Pcs',   merk:'Atlas Copco',    part_number:'2914 9307 00',    stok_minimum:4,   lokasi_rak:'A-05', harga_terakhir:1250000 },
    { kode_barang:'BRG-0004', nama_barang:'Filter Oli Genset Cummins',     kode_kategori:'SPR', satuan:'Pcs',   merk:'Fleetguard',     part_number:'LF3349',          stok_minimum:8,   lokasi_rak:'A-07', harga_terakhir:185000  },
    { kode_barang:'BRG-0005', nama_barang:'V-Belt Kompresor',              kode_kategori:'SPR', satuan:'Pcs',   merk:'Gates',          part_number:'B-58',            stok_minimum:4,   lokasi_rak:'B-01', harga_terakhir:320000  },
    { kode_barang:'BRG-0006', nama_barang:'Seal Kit Silinder Hidrolik',    kode_kategori:'SPR', satuan:'Set',   merk:'NOK',            part_number:'SK-PC200-ARM',    stok_minimum:2,   lokasi_rak:'B-03', harga_terakhir:2750000 },
    { kode_barang:'BRG-0007', nama_barang:'Liner Pompa Lumpur PZ-7',       kode_kategori:'SPR', satuan:'Pcs',   merk:'Gardner Denver', part_number:'PZ7-LNR-6',       stok_minimum:3,   lokasi_rak:'B-05', harga_terakhir:4800000 },
    { kode_barang:'BRG-0008', nama_barang:'Piston Karet Pompa Lumpur',     kode_kategori:'SPR', satuan:'Pcs',   merk:'Gardner Denver', part_number:'PZ7-PST-6',       stok_minimum:6,   lokasi_rak:'B-06', harga_terakhir:950000  },
    { kode_barang:'BRG-0009', nama_barang:'Mata Bor Inti NQ',              kode_kategori:'CSM', satuan:'Pcs',   merk:'Boart Longyear', part_number:'NQ-IMP-09',       stok_minimum:10,  lokasi_rak:'C-01', harga_terakhir:6200000 },
    { kode_barang:'BRG-0010', nama_barang:'Oli Mesin SAE 15W-40',          kode_kategori:'CSM', satuan:'Liter', merk:'Shell',          part_number:'RIMULA-R4X',      stok_minimum:200, lokasi_rak:'D-01', harga_terakhir:52000   },
    { kode_barang:'BRG-0011', nama_barang:'Oli Hidrolik ISO 68',           kode_kategori:'CSM', satuan:'Liter', merk:'Shell',          part_number:'TELLUS-S2M68',    stok_minimum:200, lokasi_rak:'D-02', harga_terakhir:48000   },
    { kode_barang:'BRG-0012', nama_barang:'Grease Multi Purpose',          kode_kategori:'CSM', satuan:'Kg',    merk:'Pertamina',      part_number:'GREASE-EP2',      stok_minimum:30,  lokasi_rak:'D-03', harga_terakhir:45000   },
    { kode_barang:'BRG-0013', nama_barang:'Solar Industri',                kode_kategori:'BBM', satuan:'Liter', merk:'Pertamina',      part_number:'HSD',             stok_minimum:2000,lokasi_rak:'Tangki-1', harga_terakhir:13500 },
    { kode_barang:'BRG-0014', nama_barang:'Kunci Pipa 24 inci',            kode_kategori:'TLS', satuan:'Pcs',   merk:'Ridgid',         part_number:'31035',           stok_minimum:4,   lokasi_rak:'E-01', harga_terakhir:1150000 },
    { kode_barang:'BRG-0015', nama_barang:'Pompa Submersible Impeller',    kode_kategori:'SPR', satuan:'Pcs',   merk:'Grundfos',       part_number:'SP17-IMP',        stok_minimum:2,   lokasi_rak:'B-08', harga_terakhir:1900000 },
  ],

  // ── STOK GUDANG (denormalisasi untuk mode lokal) ───────────
  // Tabel: stok_gudang | PK: (kode_gudang, kode_barang)
  stockRows: [
    { kode_gudang:'GDG-PST', kode_barang:'BRG-0001', qty:25 },
    { kode_gudang:'GDG-PST', kode_barang:'BRG-0002', qty:6  },
    { kode_gudang:'GDG-PST', kode_barang:'BRG-0003', qty:2  },
    { kode_gudang:'GDG-PST', kode_barang:'BRG-0004', qty:12 },
    { kode_gudang:'GDG-PST', kode_barang:'BRG-0005', qty:5  },
    { kode_gudang:'GDG-PST', kode_barang:'BRG-0006', qty:1  },
    { kode_gudang:'GDG-PST', kode_barang:'BRG-0007', qty:4  },
    { kode_gudang:'GDG-PST', kode_barang:'BRG-0008', qty:10 },
    { kode_gudang:'GDG-PST', kode_barang:'BRG-0010', qty:400 },
    { kode_gudang:'GDG-PST', kode_barang:'BRG-0011', qty:150 },
    { kode_gudang:'GDG-PST', kode_barang:'BRG-0012', qty:40 },
    { kode_gudang:'GDG-PST', kode_barang:'BRG-0014', qty:6  },
    { kode_gudang:'GDG-PST', kode_barang:'BRG-0015', qty:0  },
    { kode_gudang:'GDG-KTB', kode_barang:'BRG-0009', qty:14 },
    { kode_gudang:'GDG-KTB', kode_barang:'BRG-0010', qty:120 },
    { kode_gudang:'GDG-KTB', kode_barang:'BRG-0013', qty:3500 },
    { kode_gudang:'GDG-KTB', kode_barang:'BRG-0008', qty:4  },
  ],

  // ── WORK ORDER ─────────────────────────────────────────────
  // Tabel: work_order | PK: no_wo
  workOrders: [
    { no_wo:'WO-001', no_laporan:null,    id_alat:'EXC-001', jenis:'Preventif',  uraian:'Ganti oli mesin dan filter solar (servis 250 jam)',          bengkel:'Bengkel lapangan Kalimantan', pelaksana:'Mekanik internal', mekanik:'Mekanik Senior',    status:'Selesai',              waktu_mulai:'2026-10-01T08:00:00+07:00', waktu_selesai:'2026-10-01T12:00:00+07:00', dicheck_oleh:'Supervisor Workshop', root_cause:null,           kondisi_akhir:'Baik', hour_meter:8400,  biaya_jasa:500000,  kode_proyek:'PRJ-2026-01' },
    { no_wo:'WO-002', no_laporan:'LK-003', id_alat:'EXC-001', jenis:'Korektif',  uraian:'Ganti seal kit silinder arm',                                bengkel:'Bengkel lapangan Kalimantan', pelaksana:'Mekanik internal', mekanik:'Mekanik Senior',    status:'Selesai',              waktu_mulai:'2026-09-03T08:00:00+07:00', waktu_selesai:'2026-09-04T16:00:00+07:00', dicheck_oleh:'Supervisor Workshop', root_cause:'Seal aus karena umur pakai', kondisi_akhir:'Baik', hour_meter:8210, biaya_jasa:1500000, kode_proyek:'PRJ-2026-01' },
    { no_wo:'WO-003', no_laporan:'LK-001', id_alat:'CMP-001', jenis:'Korektif',  uraian:'Ganti selang udara utama dan perbaiki panel',                bengkel:'Bengkel Pusat',              pelaksana:'Mekanik internal', mekanik:'Mekanik Senior',    status:'In Progress',          waktu_mulai:'2026-10-16T08:00:00+07:00', waktu_selesai:null,                        dicheck_oleh:null,                  root_cause:null,           kondisi_akhir:null,   hour_meter:3980,  biaya_jasa:null,    kode_proyek:null },
    { no_wo:'WO-004', no_laporan:null,    id_alat:'WLD-001', jenis:'Overhaul',   uraian:'Overhaul mesin las, ganti brush generator',                  bengkel:'Bengkel Pusat',              pelaksana:'Bengkel vendor',   mekanik:'Teknisi Vendor',    status:'Menunggu Verifikasi',  waktu_mulai:'2026-10-12T08:00:00+07:00', waktu_selesai:'2026-10-24T17:00:00+07:00', dicheck_oleh:null,                  root_cause:'Brush aus',    kondisi_akhir:null,   hour_meter:2650,  biaya_jasa:3500000, kode_proyek:null },
    { no_wo:'WO-005', no_laporan:null,    id_alat:'GEN-001', jenis:'Preventif',  uraian:'Ganti oli dan filter oli genset',                            bengkel:'Bengkel lapangan Kalimantan', pelaksana:'Mekanik internal', mekanik:'Mekanik Senior',    status:'Selesai',              waktu_mulai:'2026-08-15T08:00:00+07:00', waktu_selesai:'2026-08-15T11:00:00+07:00', dicheck_oleh:'Supervisor Workshop', root_cause:null,           kondisi_akhir:'Baik', hour_meter:6500,  biaya_jasa:300000,  kode_proyek:'PRJ-2026-01' },
    { no_wo:'WO-006', no_laporan:null,    id_alat:'DRL-001', jenis:'Inspeksi',   uraian:'Servis bulanan rig dan cek hidrolik',                        bengkel:'Bengkel lapangan Kalimantan', pelaksana:'Mekanik internal', mekanik:'Mekanik Senior',    status:'Selesai',              waktu_mulai:'2026-10-05T07:00:00+07:00', waktu_selesai:'2026-10-05T15:00:00+07:00', dicheck_oleh:'Supervisor Workshop', root_cause:null,           kondisi_akhir:'Baik', hour_meter:3050,  biaya_jasa:750000,  kode_proyek:'PRJ-2026-01' },
  ],

  // ── LAPORAN KERUSAKAN ──────────────────────────────────────
  // Tabel: laporan_kerusakan | PK: no_laporan
  damageReports: [
    { no_laporan:'LK-001', id_alat:'CMP-001', tanggal:'2026-10-15T14:00:00+07:00', pelapor:'Supervisor Workshop', kode_proyek:null,          gejala:'Selang udara utama retak, tekanan turun',                         urgensi:'Medium',   status:'WO dibuat' },
    { no_laporan:'LK-002', id_alat:'PMP-002', tanggal:'2026-10-25T09:15:00+07:00', pelapor:'PM Proyek B',         kode_proyek:'PRJ-2026-02', gejala:'Pompa tidak mengangkat air, motor panas',                         urgensi:'Critical', status:'Dilaporkan' },
    { no_laporan:'LK-003', id_alat:'EXC-001', tanggal:'2026-09-02T11:00:00+07:00', pelapor:'PM Proyek A',         kode_proyek:'PRJ-2026-01', gejala:'Kebocoran seal silinder arm',                                     urgensi:'Medium',   status:'Selesai' },
  ],

  // ── MUTASI ALAT (mobilisasi) ───────────────────────────────
  // Tabel: mutasi_alat | PK: no_mutasi
  mobilizations: [
    { no_mutasi:'MUT-001', no_permintaan:'REQ-001', id_alat:'DRL-001', jenis:'Mobilisasi',   asal_gudang:'GDG-PST', asal_proyek:null,          tujuan_gudang:null,    tujuan_proyek:'PRJ-2026-01', no_surat_jalan:'SJ-2026-0101', driver:'Driver Lowbed 1', kendaraan:'TRK-001', tanggal_keluar:'2026-01-16T07:00:00+07:00', qr_discan_keluar:true, checklist_keluar:{oli:true,hidrolik:true,aksesoris:true}, hour_meter_keluar:2950, kondisi_kirim:'Baik',           foto_keluar_url:'demo/foto/mut-001-out.jpg', ttd_driver_url:'demo/ttd/mut-001.png', tanggal_masuk:'2026-01-21T15:30:00+07:00', qr_discan_masuk:true, hour_meter_masuk:2952, kondisi_tiba:'Baik',         running_test_ok:true,  penerima:'Petugas Gudang Site Kalimantan', discrepancy_note:null },
    { no_mutasi:'MUT-002', no_permintaan:'REQ-002', id_alat:'GEN-002', jenis:'Mobilisasi',   asal_gudang:'GDG-PST', asal_proyek:null,          tujuan_gudang:null,    tujuan_proyek:'PRJ-2026-01', no_surat_jalan:'SJ-2026-0187', driver:'Driver Lowbed 1', kendaraan:'TRK-001', tanggal_keluar:'2026-10-24T06:30:00+07:00', qr_discan_keluar:true, checklist_keluar:{oli:true,hidrolik:true,aksesoris:true}, hour_meter_keluar:4310, kondisi_kirim:'Baik',           foto_keluar_url:'demo/foto/mut-002-out.jpg', ttd_driver_url:'demo/ttd/mut-002.png', tanggal_masuk:null,                         qr_discan_masuk:false, hour_meter_masuk:null, kondisi_tiba:null,           running_test_ok:null,  penerima:null, discrepancy_note:null },
    { no_mutasi:'MUT-003', no_permintaan:null,      id_alat:'CMP-001', jenis:'Demobilisasi', asal_gudang:null,      asal_proyek:'PRJ-2026-01', tujuan_gudang:'BKL-PST', tujuan_proyek:null,         no_surat_jalan:'SJ-2026-0175', driver:'Driver Lowbed 1', kendaraan:'TRK-001', tanggal_keluar:'2026-10-10T08:00:00+07:00', qr_discan_keluar:true, checklist_keluar:{oli:true,hidrolik:true,aksesoris:false}, hour_meter_keluar:3978, kondisi_kirim:'Perlu perbaikan', foto_keluar_url:'demo/foto/mut-003-out.jpg', ttd_driver_url:'demo/ttd/mut-003.png', tanggal_masuk:'2026-10-15T13:00:00+07:00', qr_discan_masuk:true, hour_meter_masuk:3980, kondisi_tiba:'Rusak ringan', running_test_ok:true,  penerima:'Supervisor Workshop', discrepancy_note:'Selang udara utama retak saat transit; tutup panel penyok.' },
  ],

  // ── PERMINTAAN MOBILISASI ─────────────────────────────────
  // Tabel: permintaan_mobilisasi | PK: no_permintaan
  mobilizationRequests: [
    { no_permintaan:'REQ-001', kode_proyek:'PRJ-2026-01', no_kebutuhan:'KB-001', pemohon:'PM Proyek A', tanggal_butuh:'2026-01-20', status:'Selesai',   approver:'Direktur Operasional', tanggal_approve:'2026-01-14T10:00:00+07:00' },
    { no_permintaan:'REQ-002', kode_proyek:'PRJ-2026-01', no_kebutuhan:'KB-002', pemohon:'PM Proyek A', tanggal_butuh:'2026-10-30', status:'Disetujui', approver:'Direktur Operasional', tanggal_approve:'2026-10-22T09:30:00+07:00' },
    { no_permintaan:'REQ-003', kode_proyek:'PRJ-2026-04', no_kebutuhan:'KB-005', pemohon:'PM Proyek D', tanggal_butuh:'2026-11-20', status:'Diajukan',  approver:null,                    tanggal_approve:null },
  ],

  // ── PURCHASE REQUEST ──────────────────────────────────────
  // Tabel: purchase_request | PK: no_pr
  purchaseRequests: [
    { no_pr:'PR-2026-041', tanggal:'2026-09-20', pemohon:'Supervisor Workshop', kode_proyek:null,          jenis:'Part',        keperluan:'Restock filter dan seal kit',          status:'Disetujui', approver:'Direktur Operasional', tanggal_approve:'2026-09-21T10:00:00+07:00' },
    { no_pr:'PR-2026-044', tanggal:'2026-10-05', pemohon:'PM Proyek A',         kode_proyek:'PRJ-2026-01', jenis:'Part',        keperluan:'Mata bor inti NQ fase 2',              status:'Disetujui', approver:'Direktur Operasional', tanggal_approve:'2026-10-06T08:30:00+07:00' },
    { no_pr:'PR-2026-047', tanggal:'2026-10-18', pemohon:'PM Proyek B',         kode_proyek:'PRJ-2026-02', jenis:'Alat',        keperluan:'Pompa submersible pengganti (KB-003)', status:'Disetujui', approver:'Direktur Operasional', tanggal_approve:'2026-10-20T13:00:00+07:00' },
    { no_pr:'PR-2026-049', tanggal:'2026-10-24', pemohon:'Supervisor Workshop', kode_proyek:null,          jenis:'Part',        keperluan:'Impeller pompa submersible',           status:'Diajukan',  approver:null,                    tanggal_approve:null },
    { no_pr:'PR-2026-050', tanggal:'2026-10-25', pemohon:'PM Proyek C',         kode_proyek:'PRJ-2026-03', jenis:'Barang lain', keperluan:'Tenda lapangan',                       status:'Ditolak',   approver:'Direktur Operasional', tanggal_approve:'2026-10-26T09:00:00+07:00' },
  ],

  // ── PURCHASE ORDER ────────────────────────────────────────
  // Tabel: purchase_order | PK: no_po
  purchaseOrders: [
    { no_po:'PO-2026-118', no_pr:'PR-2026-041', kode_vendor:'VND-003', tanggal_po:'2026-09-23', status:'Diterima',          kode_proyek:null },
    { no_po:'PO-2026-120', no_pr:'PR-2026-044', kode_vendor:'VND-003', tanggal_po:'2026-10-08', status:'Diterima sebagian', kode_proyek:'PRJ-2026-01' },
    { no_po:'PO-2026-123', no_pr:'PR-2026-047', kode_vendor:'VND-003', tanggal_po:'2026-10-22', status:'PO terbit',         kode_proyek:'PRJ-2026-02' },
  ],

  // ── PENAWARAN VENDOR ──────────────────────────────────────
  // Tabel: penawaran_vendor | PK: id (bigint auto)
  quotations: [
    { id:1, no_pr:'PR-2026-047', kode_vendor:'VND-002', harga_total:54500000, lead_time_hari:14, catatan:null,                              dipilih:false },
    { id:2, no_pr:'PR-2026-047', kode_vendor:'VND-003', harga_total:51200000, lead_time_hari:21, catatan:'Harga terbaik',                   dipilih:true  },
    { id:3, no_pr:'PR-2026-047', kode_vendor:'VND-005', harga_total:56900000, lead_time_hari:10, catatan:'Pengiriman paling cepat',         dipilih:false },
  ],

  // ── JADWAL PM ─────────────────────────────────────────────
  // Tabel: jadwal_pm | PK: id (bigint auto)
  preventiveSchedule: [
    { id:1, id_alat:'EXC-001', nama_servis:'Servis 250 jam',      basis:'Hour Meter', interval_hari:null, interval_hm:250,  terakhir_tanggal:'2026-10-01', terakhir_hm:8400,  berikut_tanggal:null,         berikut_hm:8650  },
    { id:2, id_alat:'GEN-001', nama_servis:'Ganti oli & filter',  basis:'Hour Meter', interval_hari:null, interval_hm:500,  terakhir_tanggal:'2026-08-15', terakhir_hm:6500,  berikut_tanggal:null,         berikut_hm:7000  },
    { id:3, id_alat:'DRL-001', nama_servis:'Servis bulanan rig',  basis:'Tanggal',    interval_hari:30,   interval_hm:null, terakhir_tanggal:'2026-10-05', terakhir_hm:3050,  berikut_tanggal:'2026-11-04', berikut_hm:null  },
    { id:4, id_alat:'TRK-002', nama_servis:'Uji riksa crane',     basis:'Tanggal',    interval_hari:365,  interval_hm:null, terakhir_tanggal:'2025-11-20', terakhir_hm:null,  berikut_tanggal:'2026-11-20', berikut_hm:null  },
  ],

  // ── NOTIFIKASI ────────────────────────────────────────────
  // Tabel: notifikasi | PK: id (bigint auto)
  notifications: [
    { id:1, untuk_peran:'Gudang',     judul:'Alat dalam perjalanan',         pesan:'GEN-002 menuju Proyek Eksplorasi Kalimantan (SJ-2026-0187)',   link:'#/mobilisasi/MUT-002', dibaca:false, record_time:'2026-10-24T06:30:00+07:00' },
    { id:2, untuk_peran:'Mekanik',    judul:'Laporan kerusakan Critical',    pesan:'PMP-002 di Proyek Geoteknik Sulawesi perlu work order',        link:'#/maintenance/LK-002', dibaca:false, record_time:'2026-10-25T09:15:00+07:00' },
    { id:3, untuk_peran:'Mekanik',    judul:'WO menunggu verifikasi',        pesan:'WO-004 mesin las WLD-001 perlu diverifikasi',                  link:'#/maintenance/WO-004', dibaca:false, record_time:'2026-10-24T17:00:00+07:00' },
    { id:4, untuk_peran:'Manajemen',  judul:'Permintaan alat baru',          pesan:'REQ-003 dari Proyek Pengeboran Jawa Barat menunggu approval',  link:'#/mobilisasi/REQ-003', dibaca:false, record_time:'2026-10-20T08:00:00+07:00' },
    { id:5, untuk_peran:'Purchasing', judul:'PR menunggu approval',          pesan:'PR-2026-049 impeller pompa submersible',                       link:'#/pembelian/PR-2026-049', dibaca:false, record_time:'2026-10-24T08:00:00+07:00' },
  ],

  // ── AUDIT LOG (lokal – db mengisi ini secara otomatis) ────
  auditLog: [],
};

// ── STATE MANAGEMENT ─────────────────────────────────────────
// Lokal fallback: simpan ke localStorage.
function loadState() {
  try {
    const saved = localStorage.getItem('geoace_data_v2');
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return JSON.parse(JSON.stringify(INITIAL_DATA));
}

function saveState(data) {
  try { localStorage.setItem('geoace_data_v2', JSON.stringify(data)); } catch { /* ignore */ }
}

function resetState() {
  localStorage.removeItem('geoace_data_v2');
  return JSON.parse(JSON.stringify(INITIAL_DATA));
}

// ── Helper lokal: total stok per barang dari stockRows ────────
function getLocalStock(data, kodeBrg) {
  return data.stockRows
    .filter(r => r.kode_barang === kodeBrg)
    .reduce((s, r) => s + (r.qty || 0), 0);
}

// Expose
window.GeoACE = window.GeoACE || {};
window.GeoACE.INITIAL_DATA  = INITIAL_DATA;
window.GeoACE.loadState      = loadState;
window.GeoACE.saveState      = saveState;
window.GeoACE.resetState     = resetState;
window.GeoACE.getLocalStock  = getLocalStock;
