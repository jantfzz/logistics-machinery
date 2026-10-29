-- =====================================================================
-- GeoACE Logistic & Machinery Management System
-- 02_seed_geoace.sql : data dummy simulasi (jalankan setelah 01_skema)
--
-- Semua nama orang, vendor, dan nomor dokumen fiktif. Status alat sudah
-- konsisten dengan riwayat mutasi dan work order di bawah.
-- Untuk mengulang demo dari awal: jalankan ulang 01 lalu 02.
-- =====================================================================
begin;
set local geoace.seed = 'on';   -- lewati aturan transaksi & audit saat seed

-- ---------- Proyek ----------
insert into proyek (kode_proyek, nama_proyek, klien, lokasi, jenis_pekerjaan, manajer_proyek,
  rencana_mulai, rencana_selesai, realisasi_mulai, sumber_listrik, kapasitas_listrik_kva, cost_center, status) values
('PRJ-2026-01', 'Proyek Eksplorasi Kalimantan', 'PT Tambang Nusantara (fiktif)', 'Kutai Barat, Kalimantan Timur', 'Pengeboran eksplorasi', 'PM Proyek A', '2026-01-05', '2026-12-20', '2026-01-12', 'Genset', 500, 'CC-PRJ01', 'Berjalan'),
('PRJ-2026-02', 'Proyek Geoteknik Sulawesi', 'PT Infrastruktur Timur (fiktif)', 'Morowali, Sulawesi Tengah', 'Investigasi geoteknik', 'PM Proyek B', '2026-03-01', '2026-11-30', '2026-03-09', 'Genset', 250, 'CC-PRJ02', 'Berjalan'),
('PRJ-2026-03', 'Proyek Survei Sumatra', 'PT Energi Andalas (fiktif)', 'Muara Enim, Sumatra Selatan', 'Survei geologi', 'PM Proyek C', '2026-06-01', '2027-02-28', '2026-06-15', 'PLN', 100, 'CC-PRJ03', 'Berjalan'),
('PRJ-2026-04', 'Proyek Pengeboran Jawa Barat', 'PT Panas Bumi Priangan (fiktif)', 'Garut, Jawa Barat', 'Pengeboran geoteknik', 'PM Proyek D', '2026-11-15', '2027-06-30', null, 'Tidak tersedia', null, 'CC-PRJ04', 'Rencana');

-- ---------- Gudang & lokasi ----------
insert into gudang_lokasi (kode_gudang, nama_gudang, jenis, kode_proyek, alamat, penanggung_jawab, telepon) values
('GDG-PST', 'Gudang Pusat Jakarta', 'Pusat', null, 'Kawasan Industri Pulogadung, Jakarta Timur', 'Kepala Gudang Pusat', '021-0000001'),
('GDG-KTB', 'Gudang Site Kalimantan', 'Site', 'PRJ-2026-01', 'Base camp Kutai Barat', 'Petugas Gudang Site Kalimantan', '0811-0000002'),
('BKL-PST', 'Bengkel Pusat', 'Bengkel', null, 'Kawasan Industri Pulogadung, Jakarta Timur', 'Supervisor Workshop', '021-0000003');

-- ---------- Vendor ----------
insert into vendor (kode_vendor, nama_vendor, npwp, kota, nama_kontak, telepon, email, kategori, termin_hari, status_pkp) values
('VND-001', 'PT Sarana Alat Berat Mandiri', '01.111.111.1-001.000', 'Jakarta', 'Sales Alat Berat', '021-1111111', 'sales@sarana-ab.example', 'Alat berat', 30, 'PKP'),
('VND-002', 'PT Daya Genset Prima', '01.222.222.2-002.000', 'Bekasi', 'Sales Genset', '021-2222222', 'sales@dayagenset.example', 'Mesin', 30, 'PKP'),
('VND-003', 'CV Sparepart Teknik Jaya', '01.333.333.3-003.000', 'Surabaya', 'Admin Penjualan', '031-3333333', 'order@stj.example', 'Sparepart', 14, 'PKP'),
('VND-004', 'PT Presisi Survei Instrumen', '01.444.444.4-004.000', 'Bandung', 'Sales Instrumen', '022-4444444', 'sales@presisi.example', 'Alat ukur', 30, 'PKP'),
('VND-005', 'CV Pelumas Borneo', null, 'Balikpapan', 'Pemilik', '0542-555555', 'cvpb@mail.example', 'Consumable', 7, 'Non-PKP');

-- ---------- Kategori ----------
insert into kategori_barang (kode_kategori, nama_kategori, satuan_dasar, keterangan) values
('SPR', 'Sparepart', 'Pcs', 'Suku cadang mesin dan alat'),
('CSM', 'Consumable', 'Liter', 'Oli, grease, mata bor habis pakai'),
('BBM', 'BBM', 'Liter', 'Solar dan bensin'),
('TLS', 'Tools', 'Pcs', 'Perkakas tangan');

-- ---------- Pengguna (satu per peran simulasi) ----------
insert into pengguna (id_pengguna, nama, jabatan, departemen, email, peran, kode_proyek, level_approval, batas_nilai_approval) values
('USR-01', 'PM Proyek A', 'Project Manager', 'Operasional', 'pm.a@geoace.example', 'PM Site', 'PRJ-2026-01', 1, 50000000),
('USR-02', 'Petugas Gudang Pusat', 'Staf Logistik', 'Logistik', 'gudang@geoace.example', 'Gudang', null, 0, 0),
('USR-03', 'Driver Lowbed 1', 'Driver', 'Logistik', 'driver1@geoace.example', 'Driver', null, 0, 0),
('USR-04', 'Mekanik Senior', 'Mekanik', 'Workshop', 'mekanik@geoace.example', 'Mekanik', null, 0, 0),
('USR-05', 'Supervisor Workshop', 'Supervisor', 'Workshop', 'spv.workshop@geoace.example', 'Mekanik', null, 1, 10000000),
('USR-06', 'Staf Purchasing', 'Purchasing Officer', 'Pengadaan', 'purchasing@geoace.example', 'Purchasing', null, 0, 0),
('USR-07', 'Staf Finance', 'Finance Officer', 'Keuangan', 'finance@geoace.example', 'Finance', null, 0, 0),
('USR-08', 'Petugas HSE', 'HSE Officer', 'HSE', 'hse@geoace.example', 'HSE', null, 0, 0),
('USR-09', 'Direktur Operasional', 'Direktur', 'Direksi', 'direksi@geoace.example', 'Manajemen', null, 3, 5000000000),
('USR-10', 'Admin Sistem', 'Admin IT', 'IT', 'admin@geoace.example', 'Admin', null, 0, 0);

-- ---------- Mesin & alat (20 unit) ----------
insert into alat (id_alat, nama_alat, jenis_alat, merk, tipe, no_seri, status, kondisi, kode_gudang, kode_proyek, pic,
  hour_meter, spesifikasi, fungsi, daya, satuan_daya, bahan_bakar, kepemilikan, tahun_pembuatan, tanggal_beli, nilai_aset,
  garansi_sampai, no_pembelian, tanggal_dihapus) values
('DRL-001', 'Drilling Rig Hidrolik 1', 'Alat berat', 'Boart Longyear', 'LF90D', 'BL-LF90-23011', 'In Use', 'Baik', null, 'PRJ-2026-01', 'Tim Bor Kalimantan', 3120, '{"kedalaman_maks_m":1500,"berat_kg":9800}', 'Pengeboran inti eksplorasi', 140, 'kW', 'Solar', 'Milik sendiri', 2022, '2022-08-10', 4200000000, '2025-08-10', 'PB-0008', null),
('DRL-002', 'Drilling Rig Hidrolik 2', 'Alat berat', 'Boart Longyear', 'LF90D', 'BL-LF90-23047', 'Ready', 'Baik', 'GDG-PST', null, 'Kepala Gudang Pusat', 2480, '{"kedalaman_maks_m":1500,"berat_kg":9800}', 'Pengeboran inti eksplorasi', 140, 'kW', 'Solar', 'Milik sendiri', 2023, '2023-02-14', 4350000000, '2026-12-14', 'PB-0010', null),
('DRL-003', 'Rig Bor Geoteknik Portable', 'Mesin', 'Tone', 'TOP-1', 'TN-TOP1-1902', 'In Use', 'Perlu perbaikan', null, 'PRJ-2026-02', 'Tim Geoteknik Sulawesi', 5210, '{"kedalaman_maks_m":100}', 'Bor SPT dan sampling tanah', 15, 'HP', 'Bensin', 'Milik sendiri', 2019, '2019-06-03', 380000000, '2021-06-03', 'PB-0003', null),
('EXC-001', 'Excavator 20 Ton', 'Alat berat', 'Komatsu', 'PC200-8', 'KMT-PC200-K12345', 'In Use', 'Baik', null, 'PRJ-2026-01', 'Tim Proyek A', 8450, '{"bucket_m3":0.8,"berat_kg":19900}', 'Galian dan pemuatan material', 110, 'kW', 'Solar', 'Milik sendiri', 2019, '2019-05-10', 1200000000, '2021-05-10', 'PB-0012', null),
('EXC-002', 'Excavator Mini 5 Ton', 'Alat berat', 'Kobelco', 'SK55SR', 'KBL-SK55-77310', 'Ready', 'Baik', 'GDG-PST', null, 'Kepala Gudang Pusat', 2140, '{"bucket_m3":0.16,"berat_kg":5200}', 'Galian ringan dan akses lokasi bor', 29, 'kW', 'Solar', 'Milik sendiri', 2021, '2021-09-20', 620000000, '2023-09-20', 'PB-0006', null),
('GEN-001', 'Genset 100 kVA', 'Mesin', 'Cummins', 'C100D5', 'CMN-C100-55102', 'In Use', 'Baik', null, 'PRJ-2026-01', 'Tim Bor Kalimantan', 6900, '{"tegangan_v":400,"fase":3}', 'Sumber listrik camp dan rig', 100, 'kVA', 'Solar', 'Milik sendiri', 2020, '2020-03-02', 350000000, '2022-03-02', 'PB-0004', null),
('GEN-002', 'Genset 100 kVA', 'Mesin', 'Cummins', 'C100D5', 'CMN-C100-55188', 'In Transit', 'Baik', null, null, 'Driver Lowbed 1', 4310, '{"tegangan_v":400,"fase":3}', 'Sumber listrik camp dan rig', 100, 'kVA', 'Solar', 'Milik sendiri', 2021, '2021-04-12', 365000000, '2023-04-12', 'PB-0005', null),
('GEN-003', 'Genset 20 kVA', 'Mesin', 'Yanmar', 'YDG20', 'YNM-YDG20-1120', 'Ready', 'Baik', 'GDG-KTB', null, 'Petugas Gudang Site Kalimantan', 1870, '{"tegangan_v":220,"fase":1}', 'Listrik cadangan site', 20, 'kVA', 'Solar', 'Milik sendiri', 2022, '2022-01-18', 95000000, '2024-01-18', 'PB-0009', null),
('CMP-001', 'Kompresor Udara 750 CFM', 'Mesin', 'Atlas Copco', 'XAS 750', 'AC-XAS750-8812', 'Under Maintenance', 'Rusak ringan', 'BKL-PST', null, 'Supervisor Workshop', 3980, '{"cfm":750,"tekanan_bar":12}', 'Udara bertekanan untuk pengeboran', 186, 'kW', 'Solar', 'Milik sendiri', 2020, '2020-10-05', 780000000, '2022-10-05', 'PB-0007', null),
('CMP-002', 'Kompresor Udara 185 CFM', 'Mesin', 'Airman', 'PDS185S', 'AIR-PDS185-3021', 'In Use', 'Baik', null, 'PRJ-2026-03', 'Tim Survei Sumatra', 1520, '{"cfm":185,"tekanan_bar":7}', 'Udara bertekanan alat ringan', 37, 'kW', 'Solar', 'Sewa', 2023, null, null, null, null, null),
('PMP-001', 'Pompa Lumpur Triplex', 'Mesin', 'Gardner Denver', 'PZ-7', 'GD-PZ7-0451', 'In Use', 'Baik', null, 'PRJ-2026-01', 'Tim Bor Kalimantan', 4400, '{"debit_lpm":450,"tekanan_bar":35}', 'Sirkulasi lumpur pengeboran', 75, 'kW', 'Solar', 'Milik sendiri', 2021, '2021-07-22', 520000000, '2023-07-22', 'PB-0011', null),
('PMP-002', 'Pompa Air Submersible 3 inci', 'Alat ringan', 'Grundfos', 'SP 17-8', 'GRF-SP17-9934', 'Broken', 'Rusak berat', null, 'PRJ-2026-02', 'Tim Geoteknik Sulawesi', 2210, '{"debit_m3_jam":17}', 'Dewatering lubang bor', 5.5, 'kW', 'Listrik', 'Milik sendiri', 2022, '2022-05-09', 48000000, '2024-05-09', 'PB-0013', null),
('TRK-001', 'Truk Lowbed 30 Ton', 'Alat berat', 'Hino', 'FM 260 JD', 'HNO-FM260-6120', 'Ready', 'Baik', 'GDG-PST', null, 'Driver Lowbed 1', 0, '{"kapasitas_ton":30,"km":184300}', 'Angkut alat berat', 191, 'kW', 'Solar', 'Milik sendiri', 2018, '2018-11-01', 1350000000, '2019-11-01', 'PB-0001', null),
('TRK-002', 'Truk Crane 5 Ton', 'Alat berat', 'Mitsubishi', 'Fuso FE 74 + Palfinger', 'MFS-FE74-4431', 'Ready', 'Perlu perbaikan', 'GDG-PST', null, 'Kepala Gudang Pusat', 0, '{"kapasitas_crane_ton":5,"km":96100}', 'Bongkar muat alat dan pipa bor', 100, 'kW', 'Solar', 'Milik sendiri', 2020, '2020-02-20', 890000000, '2022-02-20', 'PB-0002', null),
('THD-001', 'Total Station', 'Alat ukur', 'Topcon', 'GM-105', 'TPC-GM105-7731', 'In Use', 'Baik', null, 'PRJ-2026-03', 'Tim Survei Sumatra', 0, '{"akurasi_detik":5}', 'Pengukuran topografi', null, null, 'Baterai', 'Milik sendiri', 2024, '2024-01-15', 145000000, '2027-01-15', 'PB-0015', null),
('THD-002', 'Theodolite Digital', 'Alat ukur', 'Nikon', 'NE-103', 'NKN-NE103-2290', 'Ready', 'Baik', 'GDG-PST', null, 'Kepala Gudang Pusat', 0, '{"akurasi_detik":7}', 'Pengukuran sudut', null, null, 'Baterai', 'Milik sendiri', 2021, '2021-03-08', 38000000, '2023-03-08', 'PB-0014', null),
('GPS-001', 'GNSS RTK Receiver', 'Alat ukur', 'Trimble', 'R12i', 'TRM-R12I-6051', 'In Use', 'Baik', null, 'PRJ-2026-02', 'Tim Geoteknik Sulawesi', 0, '{"akurasi_mm":8}', 'Penentuan koordinat titik bor', null, null, 'Baterai', 'Milik sendiri', 2024, '2024-06-11', 310000000, '2026-12-11', 'PB-0016', null),
('WLD-001', 'Mesin Las Diesel 400A', 'Mesin', 'Lincoln', 'Ranger 305D', 'LNC-R305-1188', 'Under Maintenance', 'Perlu perbaikan', 'BKL-PST', null, 'Supervisor Workshop', 2650, '{"ampere_maks":400}', 'Pengelasan perbaikan di lapangan', 17, 'kW', 'Solar', 'Milik sendiri', 2019, '2019-09-30', 160000000, '2021-09-30', 'PB-0017', null),
('LGT-001', 'Lighting Tower', 'Alat ringan', 'Generac', 'VT-Hybrid', 'GNR-VTH-4470', 'In Use', 'Baik', null, 'PRJ-2026-01', 'Tim Bor Kalimantan', 3300, '{"lampu":"4 x 350W LED"}', 'Penerangan area bor malam hari', 6, 'kW', 'Solar', 'Sewa', 2023, null, null, null, null, null),
('CMP-000', 'Kompresor Udara 375 CFM (lama)', 'Mesin', 'Atlas Copco', 'XAS 375', 'AC-XAS375-1003', 'Scrapped', 'Rusak berat', 'GDG-PST', null, 'Kepala Gudang Pusat', 15800, '{"cfm":375}', 'Udara bertekanan', 110, 'kW', 'Solar', 'Milik sendiri', 2012, '2012-04-01', 410000000, '2013-04-01', null, '2026-06-30');

-- ---------- Dokumen legal ----------
insert into dokumen_legal_alat (id_alat, jenis, nomor, berlaku_sampai) values
('EXC-001', 'SIA', 'SIA/KMT/2026/0112', '2027-03-31'),
('EXC-002', 'SIA', 'SIA/KBL/2025/0981', '2026-11-30'),
('TRK-001', 'STNK', 'B 9123 XYZ', '2027-11-01'),
('TRK-002', 'STNK', 'B 9456 XYZ', '2026-12-05'),
('TRK-002', 'SILO', 'SILO/CRN/2025/0217', '2026-11-20'),
('GEN-001', 'Sertifikat lain', 'Uji riksa genset 2026-0045', '2027-02-01');

-- ---------- Barang / part (15) ----------
insert into barang_part (kode_barang, nama_barang, kode_kategori, satuan, merk, part_number, stok_minimum, lokasi_rak, harga_terakhir) values
('BRG-0001', 'Filter Oli Excavator PC200', 'SPR', 'Pcs', 'Komatsu', '600-211-1340', 10, 'A-01', 150000),
('BRG-0002', 'Filter Solar PC200', 'SPR', 'Pcs', 'Komatsu', '600-319-3750', 10, 'A-02', 210000),
('BRG-0003', 'Filter Udara Kompresor XAS', 'SPR', 'Pcs', 'Atlas Copco', '2914 9307 00', 4, 'A-05', 1250000),
('BRG-0004', 'Filter Oli Genset Cummins', 'SPR', 'Pcs', 'Fleetguard', 'LF3349', 8, 'A-07', 185000),
('BRG-0005', 'V-Belt Kompresor', 'SPR', 'Pcs', 'Gates', 'B-58', 4, 'B-01', 320000),
('BRG-0006', 'Seal Kit Silinder Hidrolik', 'SPR', 'Set', 'NOK', 'SK-PC200-ARM', 2, 'B-03', 2750000),
('BRG-0007', 'Liner Pompa Lumpur PZ-7', 'SPR', 'Pcs', 'Gardner Denver', 'PZ7-LNR-6', 3, 'B-05', 4800000),
('BRG-0008', 'Piston Karet Pompa Lumpur', 'SPR', 'Pcs', 'Gardner Denver', 'PZ7-PST-6', 6, 'B-06', 950000),
('BRG-0009', 'Mata Bor Inti NQ', 'CSM', 'Pcs', 'Boart Longyear', 'NQ-IMP-09', 10, 'C-01', 6200000),
('BRG-0010', 'Oli Mesin SAE 15W-40', 'CSM', 'Liter', 'Shell', 'RIMULA-R4X', 200, 'D-01', 52000),
('BRG-0011', 'Oli Hidrolik ISO 68', 'CSM', 'Liter', 'Shell', 'TELLUS-S2M68', 200, 'D-02', 48000),
('BRG-0012', 'Grease Multi Purpose', 'CSM', 'Kg', 'Pertamina', 'GREASE-EP2', 30, 'D-03', 45000),
('BRG-0013', 'Solar Industri', 'BBM', 'Liter', 'Pertamina', 'HSD', 2000, 'Tangki-1', 13500),
('BRG-0014', 'Kunci Pipa 24 inci', 'TLS', 'Pcs', 'Ridgid', '31035', 4, 'E-01', 1150000),
('BRG-0015', 'Pompa Submersible Impeller', 'SPR', 'Pcs', 'Grundfos', 'SP17-IMP', 2, 'B-08', 1900000);

insert into stok_gudang (kode_gudang, kode_barang, qty) values
('GDG-PST', 'BRG-0001', 25), ('GDG-PST', 'BRG-0002', 6), ('GDG-PST', 'BRG-0003', 2),
('GDG-PST', 'BRG-0004', 12), ('GDG-PST', 'BRG-0005', 5), ('GDG-PST', 'BRG-0006', 1),
('GDG-PST', 'BRG-0007', 4), ('GDG-PST', 'BRG-0008', 10), ('GDG-PST', 'BRG-0010', 400),
('GDG-PST', 'BRG-0011', 150), ('GDG-PST', 'BRG-0012', 40), ('GDG-PST', 'BRG-0014', 6),
('GDG-PST', 'BRG-0015', 0),
('GDG-KTB', 'BRG-0009', 14), ('GDG-KTB', 'BRG-0010', 120), ('GDG-KTB', 'BRG-0013', 3500),
('GDG-KTB', 'BRG-0008', 4);

-- ---------- Kebutuhan alat proyek ----------
insert into kebutuhan_alat_proyek (no_kebutuhan, kode_proyek, item_pekerjaan, jenis_alat, kapasitas_minimum,
  jumlah_dibutuhkan, jumlah_terpenuhi, mulai, selesai, jam_operasi_hari, sumber_pemenuhan, pengaju) values
('KB-001', 'PRJ-2026-01', 'Pengeboran inti fase 2', 'Drilling rig', '1000 m', 2, 1, '2026-02-01', '2026-12-15', 20, 'Milik sendiri', 'PM Proyek A'),
('KB-002', 'PRJ-2026-01', 'Listrik camp dan rig', 'Genset 100 kVA', '100 kVA', 2, 1, '2026-02-01', '2026-12-15', 24, 'Milik sendiri', 'PM Proyek A'),
('KB-003', 'PRJ-2026-02', 'Dewatering lubang bor', 'Pompa submersible', '15 m3/jam', 2, 1, '2026-03-15', '2026-11-30', 10, 'Beli', 'PM Proyek B'),
('KB-004', 'PRJ-2026-03', 'Pengukuran topografi', 'Total station', '5 detik', 1, 1, '2026-06-15', '2027-02-28', 8, 'Milik sendiri', 'PM Proyek C'),
('KB-005', 'PRJ-2026-04', 'Mobilisasi awal', 'Drilling rig', '1000 m', 1, 0, '2026-11-20', '2027-06-30', 20, 'Milik sendiri', 'PM Proyek D');

-- ---------- Permintaan & mutasi ----------
insert into permintaan_mobilisasi (no_permintaan, kode_proyek, no_kebutuhan, pemohon, tanggal_butuh, status, approver, tanggal_approve) values
('REQ-001', 'PRJ-2026-01', 'KB-001', 'PM Proyek A', '2026-01-20', 'Selesai', 'Direktur Operasional', '2026-01-14 10:00+07'),
('REQ-002', 'PRJ-2026-01', 'KB-002', 'PM Proyek A', '2026-10-30', 'Disetujui', 'Direktur Operasional', '2026-10-22 09:30+07'),
('REQ-003', 'PRJ-2026-04', 'KB-005', 'PM Proyek D', '2026-11-20', 'Diajukan', null, null);

insert into permintaan_mobilisasi_item (no_permintaan, id_alat) values
('REQ-001', 'DRL-001'), ('REQ-002', 'GEN-002'), ('REQ-003', 'DRL-002');

insert into mutasi_alat (no_mutasi, no_permintaan, id_alat, jenis, asal_gudang, tujuan_proyek, no_surat_jalan, driver, kendaraan,
  tanggal_keluar, qr_discan_keluar, checklist_keluar, hour_meter_keluar, kondisi_kirim, foto_keluar_url, ttd_driver_url,
  tanggal_masuk, qr_discan_masuk, hour_meter_masuk, kondisi_tiba, running_test_ok, penerima, discrepancy_note) values
('MUT-001', 'REQ-001', 'DRL-001', 'Mobilisasi', 'GDG-PST', 'PRJ-2026-01', 'SJ-2026-0101', 'Driver Lowbed 1', 'TRK-001',
  '2026-01-16 07:00+07', true, '{"oli":true,"hidrolik":true,"aksesoris":true}', 2950, 'Baik', 'demo/foto/mut-001-out.jpg', 'demo/ttd/mut-001.png',
  '2026-01-21 15:30+07', true, 2952, 'Baik', true, 'Petugas Gudang Site Kalimantan', null),
('MUT-002', 'REQ-002', 'GEN-002', 'Mobilisasi', 'GDG-PST', 'PRJ-2026-01', 'SJ-2026-0187', 'Driver Lowbed 1', 'TRK-001',
  '2026-10-24 06:30+07', true, '{"oli":true,"hidrolik":true,"aksesoris":true}', 4310, 'Baik', 'demo/foto/mut-002-out.jpg', 'demo/ttd/mut-002.png',
  null, false, null, null, null, null, null);

insert into mutasi_alat (no_mutasi, id_alat, jenis, asal_proyek, tujuan_gudang, no_surat_jalan, driver, kendaraan,
  tanggal_keluar, qr_discan_keluar, checklist_keluar, hour_meter_keluar, kondisi_kirim, foto_keluar_url, ttd_driver_url,
  tanggal_masuk, qr_discan_masuk, hour_meter_masuk, kondisi_tiba, running_test_ok, penerima, discrepancy_note) values
('MUT-003', 'CMP-001', 'Demobilisasi', 'PRJ-2026-01', 'BKL-PST', 'SJ-2026-0175', 'Driver Lowbed 1', 'TRK-001',
  '2026-10-10 08:00+07', true, '{"oli":true,"hidrolik":true,"aksesoris":false}', 3978, 'Perlu perbaikan', 'demo/foto/mut-003-out.jpg', 'demo/ttd/mut-003.png',
  '2026-10-15 13:00+07', true, 3980, 'Rusak ringan', true, 'Supervisor Workshop', 'Selang udara utama retak saat transit; tutup panel penyok.');

-- ---------- Pemeriksaan kondisi ----------
insert into pemeriksaan_kondisi (no_pemeriksaan, id_alat, tanggal, judul, kode_proyek, kondisi, hour_meter, uraian, pemeriksa) values
('INS-001', 'EXC-001', '2026-10-10', 'Inspeksi mingguan', 'PRJ-2026-01', 'Baik', 8450, 'Tidak ada kebocoran', 'Mekanik Senior'),
('INS-002', 'DRL-003', '2026-10-18', 'Inspeksi mingguan', 'PRJ-2026-02', 'Perlu perbaikan', 5208, 'Rantai feed mulai kendur', 'Mekanik Senior'),
('INS-003', 'GEN-001', '2026-10-20', 'Inspeksi bulanan', 'PRJ-2026-01', 'Baik', 6895, 'Tegangan stabil', 'Mekanik Senior');

-- ---------- Jadwal PM ----------
insert into jadwal_pm (id_alat, nama_servis, basis, interval_hari, interval_hm, terakhir_tanggal, terakhir_hm, berikut_tanggal, berikut_hm) values
('EXC-001', 'Servis 250 jam', 'Hour Meter', null, 250, '2026-10-01', 8400, null, 8650),
('GEN-001', 'Ganti oli & filter', 'Hour Meter', null, 500, '2026-08-15', 6500, null, 7000),
('DRL-001', 'Servis bulanan rig', 'Tanggal', 30, null, '2026-10-05', 3050, '2026-11-04', null),
('TRK-002', 'Uji riksa crane', 'Tanggal', 365, null, '2025-11-20', null, '2026-11-20', null);

-- ---------- Laporan kerusakan & work order ----------
insert into laporan_kerusakan (no_laporan, id_alat, tanggal, pelapor, kode_proyek, gejala, urgensi, status) values
('LK-001', 'CMP-001', '2026-10-15 14:00+07', 'Supervisor Workshop', null, 'Selang udara utama retak, tekanan turun', 'Medium', 'WO dibuat'),
('LK-002', 'PMP-002', '2026-10-25 09:15+07', 'PM Proyek B', 'PRJ-2026-02', 'Pompa tidak mengangkat air, motor panas', 'Critical', 'Dilaporkan'),
('LK-003', 'EXC-001', '2026-09-02 11:00+07', 'PM Proyek A', 'PRJ-2026-01', 'Kebocoran seal silinder arm', 'Medium', 'Selesai');

insert into work_order (no_wo, no_laporan, id_alat, jenis, uraian, bengkel, pelaksana, mekanik, status, waktu_mulai, waktu_selesai,
  dicheck_oleh, root_cause, kondisi_akhir, hour_meter, biaya_jasa, kode_proyek) values
('WO-001', null, 'EXC-001', 'Preventif', 'Ganti oli mesin dan filter solar (servis 250 jam)', 'Bengkel lapangan Kalimantan', 'Mekanik internal', 'Mekanik Senior', 'Selesai', '2026-10-01 08:00+07', '2026-10-01 12:00+07', 'Supervisor Workshop', null, 'Baik', 8400, 500000, 'PRJ-2026-01'),
('WO-002', 'LK-003', 'EXC-001', 'Korektif', 'Ganti seal kit silinder arm', 'Bengkel lapangan Kalimantan', 'Mekanik internal', 'Mekanik Senior', 'Selesai', '2026-09-03 08:00+07', '2026-09-04 16:00+07', 'Supervisor Workshop', 'Seal aus karena umur pakai', 'Baik', 8210, 1500000, 'PRJ-2026-01'),
('WO-003', 'LK-001', 'CMP-001', 'Korektif', 'Ganti selang udara utama dan perbaiki panel', 'Bengkel Pusat', 'Mekanik internal', 'Mekanik Senior', 'In Progress', '2026-10-16 08:00+07', null, null, null, null, 3980, null, null),
('WO-004', null, 'WLD-001', 'Overhaul', 'Overhaul mesin las, ganti brush generator', 'Bengkel Pusat', 'Bengkel vendor', 'Teknisi Vendor', 'Menunggu Verifikasi', '2026-10-12 08:00+07', '2026-10-24 17:00+07', null, 'Brush aus', null, 2650, 3500000, null),
('WO-005', null, 'GEN-001', 'Preventif', 'Ganti oli dan filter oli genset', 'Bengkel lapangan Kalimantan', 'Mekanik internal', 'Mekanik Senior', 'Selesai', '2026-08-15 08:00+07', '2026-08-15 11:00+07', 'Supervisor Workshop', null, 'Baik', 6500, 300000, 'PRJ-2026-01'),
('WO-006', null, 'DRL-001', 'Inspeksi', 'Servis bulanan rig dan cek hidrolik', 'Bengkel lapangan Kalimantan', 'Mekanik internal', 'Mekanik Senior', 'Selesai', '2026-10-05 07:00+07', '2026-10-05 15:00+07', 'Supervisor Workshop', null, 'Baik', 3050, 750000, 'PRJ-2026-01');

insert into pemakaian_part (no_wo, kode_barang, kode_gudang, qty, harga_satuan) values
('WO-001', 'BRG-0001', 'GDG-PST', 1, 150000), ('WO-001', 'BRG-0002', 'GDG-PST', 1, 210000),
('WO-001', 'BRG-0010', 'GDG-KTB', 20, 52000), ('WO-002', 'BRG-0006', 'GDG-PST', 1, 2750000),
('WO-005', 'BRG-0004', 'GDG-PST', 1, 185000), ('WO-005', 'BRG-0010', 'GDG-KTB', 18, 52000);

-- ---------- Pembelian ----------
insert into purchase_request (no_pr, tanggal, pemohon, kode_proyek, jenis, keperluan, status, approver, tanggal_approve) values
('PR-2026-041', '2026-09-20', 'Supervisor Workshop', null, 'Part', 'Restock filter dan seal kit', 'Disetujui', 'Direktur Operasional', '2026-09-21 10:00+07'),
('PR-2026-044', '2026-10-05', 'PM Proyek A', 'PRJ-2026-01', 'Part', 'Mata bor inti NQ fase 2', 'Disetujui', 'Direktur Operasional', '2026-10-06 08:30+07'),
('PR-2026-047', '2026-10-18', 'PM Proyek B', 'PRJ-2026-02', 'Alat', 'Pompa submersible pengganti (KB-003)', 'Disetujui', 'Direktur Operasional', '2026-10-20 13:00+07'),
('PR-2026-049', '2026-10-24', 'Supervisor Workshop', null, 'Part', 'Impeller pompa submersible', 'Diajukan', null, null),
('PR-2026-050', '2026-10-25', 'PM Proyek C', 'PRJ-2026-03', 'Barang lain', 'Tenda lapangan', 'Ditolak', 'Direktur Operasional', '2026-10-26 09:00+07');

insert into purchase_request_item (no_pr, kode_barang, deskripsi, qty, satuan, harga_estimasi) values
('PR-2026-041', 'BRG-0002', 'Filter Solar PC200', 10, 'Pcs', 210000),
('PR-2026-041', 'BRG-0006', 'Seal Kit Silinder Hidrolik', 2, 'Set', 2750000),
('PR-2026-044', 'BRG-0009', 'Mata Bor Inti NQ', 20, 'Pcs', 6200000),
('PR-2026-047', null, 'Pompa submersible 3 inci 17 m3/jam', 1, 'Unit', 52000000),
('PR-2026-049', 'BRG-0015', 'Pompa Submersible Impeller', 4, 'Pcs', 1900000),
('PR-2026-050', null, 'Tenda lapangan 6x8 m', 2, 'Unit', 7500000);

insert into penawaran_vendor (no_pr, kode_vendor, harga_total, lead_time_hari, dipilih) values
('PR-2026-047', 'VND-002', 54500000, 14, false),
('PR-2026-047', 'VND-003', 51200000, 21, true),
('PR-2026-047', 'VND-005', 56900000, 10, false);

insert into purchase_order (no_po, no_pr, kode_vendor, tanggal_po, status, kode_proyek) values
('PO-2026-118', 'PR-2026-041', 'VND-003', '2026-09-23', 'Diterima', null),
('PO-2026-120', 'PR-2026-044', 'VND-003', '2026-10-08', 'Diterima sebagian', 'PRJ-2026-01'),
('PO-2026-123', 'PR-2026-047', 'VND-003', '2026-10-22', 'PO terbit', 'PRJ-2026-02');

insert into purchase_order_item (no_po, kode_barang, deskripsi, qty, satuan, harga_satuan, qty_diterima) values
('PO-2026-118', 'BRG-0002', 'Filter Solar PC200', 10, 'Pcs', 205000, 10),
('PO-2026-118', 'BRG-0006', 'Seal Kit Silinder Hidrolik', 2, 'Set', 2700000, 2),
('PO-2026-120', 'BRG-0009', 'Mata Bor Inti NQ', 20, 'Pcs', 6150000, 8),
('PO-2026-123', null, 'Pompa submersible 3 inci 17 m3/jam', 1, 'Unit', 51200000, 0);

insert into penerimaan_barang (no_penerimaan, no_po, tanggal_terima, kode_gudang, penerima, catatan) values
('GR-2026-090', 'PO-2026-118', '2026-09-30', 'GDG-PST', 'Petugas Gudang Pusat', 'Lengkap'),
('GR-2026-095', 'PO-2026-120', '2026-10-17', 'GDG-KTB', 'Petugas Gudang Site Kalimantan', 'Diterima 8 dari 20 pcs');

-- ---------- Notifikasi ----------
insert into notifikasi (untuk_peran, judul, pesan, link) values
('Gudang', 'Alat dalam perjalanan', 'GEN-002 menuju Proyek Eksplorasi Kalimantan (SJ-2026-0187)', '#/mobilisasi/MUT-002'),
('Mekanik', 'Laporan kerusakan Critical', 'PMP-002 di Proyek Geoteknik Sulawesi perlu work order', '#/pemeliharaan/LK-002'),
('Mekanik', 'WO menunggu verifikasi', 'WO-004 mesin las WLD-001 perlu diverifikasi', '#/pemeliharaan/WO-004'),
('Manajemen', 'Permintaan alat baru', 'REQ-003 dari Proyek Pengeboran Jawa Barat menunggu approval', '#/mobilisasi/REQ-003'),
('Purchasing', 'PR menunggu approval', 'PR-2026-049 impeller pompa submersible', '#/pembelian/PR-2026-049');

commit;
