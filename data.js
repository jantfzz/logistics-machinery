// =============================================================
// data.js — GeoACE Logistic & Machinery Management System
// All dummy data; state loaded from / persisted to localStorage
// =============================================================

const INITIAL_DATA = {

  // ── USERS ────────────────────────────────────────────────
  users: [
    { id: 'u1', name: 'Ahmad Bachtiar', role: 'PM Site',   project: 'p1', avatar: 'AB' },
    { id: 'u2', name: 'Budi Santoso',   role: 'Gudang',    project: null, avatar: 'BS' },
    { id: 'u3', name: 'Cecep Nugraha',  role: 'Mekanik',   project: null, avatar: 'CN' },
    { id: 'u4', name: 'Dewi Rahayu',    role: 'Purchasing', project: null, avatar: 'DR' },
    { id: 'u5', name: 'Eko Prasetyo',   role: 'Manajemen', project: null, avatar: 'EP' },
    { id: 'u6', name: 'Fajar Hidayat',  role: 'Admin',     project: null, avatar: 'FH' },
    { id: 'u7', name: 'Gita Lestari',   role: 'Driver',    project: null, avatar: 'GL' },
    { id: 'u8', name: 'Hendra Wijaya',  role: 'Site Receiver', project: 'p2', avatar: 'HW' },
  ],

  // ── PROJECTS ─────────────────────────────────────────────
  projects: [
    { id: 'p1', name: 'Proyek Eksplorasi Kalimantan', code: 'KAL-01', location: 'Kalimantan Tengah', status: 'Active', pm: 'Ahmad Bachtiar', start: '2024-01-15', end: '2025-06-30' },
    { id: 'p2', name: 'Proyek Geoteknik Sulawesi',   code: 'SUL-02', location: 'Sulawesi Selatan',  status: 'Active', pm: 'Site Manager',    start: '2024-03-01', end: '2025-03-31' },
    { id: 'p3', name: 'Proyek Survei Sumatra',        code: 'SUM-03', location: 'Sumatra Barat',     status: 'Active', pm: 'Site Manager 3',  start: '2024-06-01', end: '2025-12-31' },
    { id: 'p4', name: 'Proyek Pengeboran Jawa Barat', code: 'JAB-04', location: 'Jawa Barat',        status: 'Planning', pm: 'Site Manager 4', start: '2025-02-01', end: '2026-01-31' },
  ],

  // ── WAREHOUSES ───────────────────────────────────────────
  warehouses: [
    { id: 'w1', name: 'Gudang Pusat Jakarta', code: 'GPJ', city: 'Jakarta',          keeper: 'Budi Santoso',  address: 'Jl. Industri Raya No. 12, Jakarta Utara' },
    { id: 'w2', name: 'Gudang Site Kalimantan', code: 'GSK', city: 'Kalimantan Tengah', keeper: 'Staf Gudang 2', address: 'Area Base Camp KAL-01' },
    { id: 'w3', name: 'Gudang Site Sulawesi',   code: 'GSS', city: 'Sulawesi Selatan',  keeper: 'Staf Gudang 3', address: 'Area Base Camp SUL-02' },
  ],

  // ── VENDORS ──────────────────────────────────────────────
  vendors: [
    { id: 'v1', name: 'PT Maju Jaya Teknik',     city: 'Jakarta',   contact: '021-5551001', category: 'Alat Berat',      npwp: '01.234.567.8-001.000', status: 'Active' },
    { id: 'v2', name: 'CV Karya Mandiri',         city: 'Surabaya',  contact: '031-5552002', category: 'Suku Cadang',     npwp: '02.345.678.9-002.000', status: 'Active' },
    { id: 'v3', name: 'PT Bumi Energi Nusantara', city: 'Bandung',   contact: '022-5553003', category: 'Genset & Pompa',  npwp: '03.456.789.0-003.000', status: 'Active' },
    { id: 'v4', name: 'UD Sentosa Spare Parts',   city: 'Medan',     contact: '061-5554004', category: 'Suku Cadang',     npwp: '04.567.890.1-004.000', status: 'Active' },
    { id: 'v5', name: 'PT Drilling Support Indo', city: 'Balikpapan',contact: '0542-555005', category: 'Drilling Equip', npwp: '05.678.901.2-005.000', status: 'Active' },
  ],

  // ── EQUIPMENT MASTER ─────────────────────────────────────
  equipment: [
    { id: 'ALT-001', name: 'Drilling Rig Rotary 500',  type: 'Drilling Rig',   brand: 'Soilmec SR-30', serial: 'SMC-SR30-2021-001', status: 'In Use',           condition: 'Baik',             location: 'p1', warehouse: null, pic: 'Ahmad Bachtiar', hourMeter: 4820, power: '220 kW', capacity: '500 m', weight: '18.5 ton', fuel: 'Solar', buyDate: '2021-05-10', buyPrice: 3200000000, warranty: '2024-05-10', ownership: 'Milik', sia: '2025-05-10', silo: null, stnk: null },
    { id: 'ALT-002', name: 'Drilling Rig Rotary 300',  type: 'Drilling Rig',   brand: 'Soilmec SR-20', serial: 'SMC-SR20-2022-002', status: 'Ready',            condition: 'Baik',             location: null, warehouse: 'w1', pic: 'Budi Santoso',   hourMeter: 1200, power: '150 kW', capacity: '300 m', weight: '14.2 ton', fuel: 'Solar', buyDate: '2022-03-15', buyPrice: 2100000000, warranty: '2025-03-15', ownership: 'Milik', sia: '2025-08-20', silo: null, stnk: null },
    { id: 'ALT-003', name: 'Genset 100 kVA Perkins',   type: 'Genset',         brand: 'Perkins 1104A', serial: 'PKS-1104A-2020-003', status: 'Ready',            condition: 'Baik',             location: null, warehouse: 'w1', pic: 'Budi Santoso',   hourMeter: 6540, power: '100 kVA', capacity: '-', weight: '1.2 ton', fuel: 'Solar', buyDate: '2020-08-20', buyPrice: 380000000, warranty: '2023-08-20', ownership: 'Milik', sia: null, silo: '2025-03-15', stnk: null },
    { id: 'ALT-004', name: 'Genset 250 kVA Cummins',   type: 'Genset',         brand: 'Cummins C250D5', serial: 'CUM-C250-2021-004', status: 'In Use',           condition: 'Baik',             location: 'p2', warehouse: null, pic: 'Hendra Wijaya',  hourMeter: 8100, power: '250 kVA', capacity: '-', weight: '2.8 ton', fuel: 'Solar', buyDate: '2021-11-01', buyPrice: 820000000, warranty: '2024-11-01', ownership: 'Milik', sia: null, silo: '2025-07-22', stnk: null },
    { id: 'ALT-005', name: 'Excavator CAT 320',        type: 'Excavator',      brand: 'Caterpillar 320', serial: 'CAT-320-2022-005', status: 'Ready',            condition: 'Baik',             location: null, warehouse: 'w1', pic: 'Budi Santoso',   hourMeter: 2310, power: '122 kW', capacity: '1.2 m³', weight: '22.0 ton', fuel: 'Solar', buyDate: '2022-06-05', buyPrice: 1950000000, warranty: '2025-06-05', ownership: 'Milik', sia: '2025-09-30', silo: null, stnk: 'B 9821 KAL' },
    { id: 'ALT-006', name: 'Excavator Komatsu PC200',  type: 'Excavator',      brand: 'Komatsu PC200-8', serial: 'KOM-PC200-2020-006', status: 'Under Maintenance', condition: 'Perlu perbaikan', location: null, warehouse: 'w1', pic: 'Cecep Nugraha', hourMeter: 9800, power: '110 kW', capacity: '0.93 m³', weight: '20.5 ton', fuel: 'Solar', buyDate: '2020-01-20', buyPrice: 1650000000, warranty: '2023-01-20', ownership: 'Milik', sia: '2024-12-31', silo: null, stnk: 'B 8832 KAL' },
    { id: 'ALT-007', name: 'Air Compressor Atlas 185', type: 'Compressor',     brand: 'Atlas Copco XAS185', serial: 'ATC-XAS185-2021-007', status: 'In Use',    condition: 'Baik',             location: 'p1', warehouse: null, pic: 'Ahmad Bachtiar', hourMeter: 3650, power: '55 kW', capacity: '185 cfm', weight: '1.8 ton', fuel: 'Solar', buyDate: '2021-09-12', buyPrice: 420000000, warranty: '2024-09-12', ownership: 'Milik', sia: null, silo: '2025-11-05', stnk: null },
    { id: 'ALT-008', name: 'Air Compressor Ingersoll',  type: 'Compressor',     brand: 'Ingersoll Rand 175', serial: 'IR-175-2022-008', status: 'Ready',          condition: 'Baik',             location: null, warehouse: 'w2', pic: 'Staf Gudang 2',  hourMeter: 980,  power: '45 kW', capacity: '175 cfm', weight: '1.6 ton', fuel: 'Solar', buyDate: '2022-04-18', buyPrice: 380000000, warranty: '2025-04-18', ownership: 'Milik', sia: null, silo: '2026-04-18', stnk: null },
    { id: 'ALT-009', name: 'Mud Pump National 10-P',   type: 'Pompa Lumpur',   brand: 'National 10-P-130', serial: 'NAT-10P-2021-009', status: 'In Use',         condition: 'Baik',             location: 'p1', warehouse: null, pic: 'Ahmad Bachtiar', hourMeter: 5200, power: '800 HP', capacity: '800 HP', weight: '9.5 ton', fuel: 'Solar', buyDate: '2021-07-01', buyPrice: 2800000000, warranty: '2024-07-01', ownership: 'Milik', sia: '2025-06-30', silo: null, stnk: null },
    { id: 'ALT-010', name: 'Mud Pump Gardner Denver',  type: 'Pompa Lumpur',   brand: 'Gardner Denver PZ-9', serial: 'GD-PZ9-2022-010', status: 'Ready',          condition: 'Baik',             location: null, warehouse: 'w1', pic: 'Budi Santoso',   hourMeter: 750,  power: '600 HP', capacity: '600 HP', weight: '7.8 ton', fuel: 'Solar', buyDate: '2022-10-10', buyPrice: 2200000000, warranty: '2025-10-10', ownership: 'Milik', sia: '2026-10-10', silo: null, stnk: null },
    { id: 'ALT-011', name: 'Theodolite Leica TS06',    type: 'Survei',         brand: 'Leica TS06', serial: 'LCA-TS06-2023-011', status: 'In Use',               condition: 'Baik',             location: 'p3', warehouse: null, pic: 'Staf Survei 1',  hourMeter: 0,    power: 'Baterai', capacity: '-', weight: '5.1 kg', fuel: '-', buyDate: '2023-02-14', buyPrice: 85000000, warranty: '2026-02-14', ownership: 'Milik', sia: null, silo: null, stnk: null },
    { id: 'ALT-012', name: 'GPS RTK Trimble R10',      type: 'Survei',         brand: 'Trimble R10', serial: 'TRM-R10-2023-012', status: 'Ready',                condition: 'Baik',             location: null, warehouse: 'w1', pic: 'Budi Santoso',   hourMeter: 0,    power: 'Baterai', capacity: '-', weight: '1.9 kg', fuel: '-', buyDate: '2023-05-20', buyPrice: 120000000, warranty: '2026-05-20', ownership: 'Milik', sia: null, silo: null, stnk: null },
    { id: 'ALT-013', name: 'Pompa Sentrifugal 4"',     type: 'Pompa Air',      brand: 'Grundfos CM5-4', serial: 'GRF-CM5-2022-013', status: 'Ready',              condition: 'Baik',             location: null, warehouse: 'w1', pic: 'Budi Santoso',   hourMeter: 1840, power: '3.7 kW', capacity: '4"', weight: '25 kg', fuel: 'Listrik', buyDate: '2022-07-07', buyPrice: 45000000, warranty: '2025-07-07', ownership: 'Milik', sia: null, silo: null, stnk: null },
    { id: 'ALT-014', name: 'Crane Truck 10 Ton',       type: 'Crane',          brand: 'Tadano TM-ZE 100M', serial: 'TDN-ZE100-2021-014', status: 'Ready',        condition: 'Baik',             location: null, warehouse: 'w1', pic: 'Budi Santoso',   hourMeter: 3200, power: '187 kW', capacity: '10 ton', weight: '15.8 ton', fuel: 'Solar', buyDate: '2021-03-22', buyPrice: 1400000000, warranty: '2024-03-22', ownership: 'Milik', sia: '2025-04-15', silo: null, stnk: 'B 1234 KP' },
    { id: 'ALT-015', name: 'Flatbed Truck Hino 500',   type: 'Truck',          brand: 'Hino FM260JD', serial: 'HNO-FM260-2022-015', status: 'In Transit',        condition: 'Baik',             location: null, warehouse: null, pic: 'Gita Lestari',   hourMeter: 42000, power: '260 HP', capacity: '15 ton', weight: '10.5 ton', fuel: 'Solar', buyDate: '2022-01-10', buyPrice: 750000000, warranty: '2025-01-10', ownership: 'Milik', sia: null, silo: null, stnk: 'B 7890 KP' },
    { id: 'ALT-016', name: 'Water Tanker Truck 6000L', type: 'Truck',          brand: 'Isuzu FVR 34P', serial: 'ISZ-FVR34-2020-016', status: 'In Use',           condition: 'Baik',             location: 'p2', warehouse: null, pic: 'Hendra Wijaya',  hourMeter: 58000, power: '195 HP', capacity: '6000 L', weight: '12.0 ton', fuel: 'Solar', buyDate: '2020-09-15', buyPrice: 480000000, warranty: '2023-09-15', ownership: 'Milik', sia: null, silo: null, stnk: 'B 4455 KP' },
    { id: 'ALT-017', name: 'Welding Machine ESAB',     type: 'Alat Las',       brand: 'ESAB Rebel EMP 235ic', serial: 'ESB-235-2023-017', status: 'Ready',       condition: 'Baik',             location: null, warehouse: 'w1', pic: 'Budi Santoso',   hourMeter: 340,  power: '7.3 kW', capacity: '235 A', weight: '20 kg', fuel: 'Listrik', buyDate: '2023-01-05', buyPrice: 28000000, warranty: '2026-01-05', ownership: 'Milik', sia: null, silo: null, stnk: null },
    { id: 'ALT-018', name: 'Forklift Electric 3T',     type: 'Forklift',       brand: 'Toyota 8FBET30', serial: 'TYT-8FBE-2022-018', status: 'Ready',            condition: 'Baik',             location: null, warehouse: 'w1', pic: 'Budi Santoso',   hourMeter: 2100, power: '15 kW', capacity: '3 ton', weight: '5.8 ton', fuel: 'Listrik', buyDate: '2022-11-20', buyPrice: 380000000, warranty: '2025-11-20', ownership: 'Milik', sia: '2025-12-01', silo: null, stnk: null },
    { id: 'ALT-019', name: 'Drilling Rig SPT-100',     type: 'Drilling Rig',   brand: 'CME 55', serial: 'CME-55-2023-019', status: 'Broken',                     condition: 'Rusak berat',      location: null, warehouse: 'w1', pic: 'Cecep Nugraha',  hourMeter: 12400, power: '80 HP', capacity: '100 m', weight: '3.2 ton', fuel: 'Solar', buyDate: '2023-08-01', buyPrice: 650000000, warranty: '2026-08-01', ownership: 'Milik', sia: '2025-01-20', silo: null, stnk: null },
    { id: 'ALT-020', name: 'Genset 75 kVA Mitsubishi', type: 'Genset',         brand: 'Mitsubishi S4L2', serial: 'MTS-S4L2-2021-020', status: 'Ready',           condition: 'Baik',             location: null, warehouse: 'w2', pic: 'Staf Gudang 2',  hourMeter: 3890, power: '75 kVA', capacity: '-', weight: '1.0 ton', fuel: 'Solar', buyDate: '2021-12-10', buyPrice: 280000000, warranty: '2024-12-10', ownership: 'Milik', sia: null, silo: '2025-02-28', stnk: null },
    { id: 'ALT-021', name: 'Boring Machine CBT-6',     type: 'Boring Machine', brand: 'CBT Boring 6', serial: 'CBT-6-2022-021', status: 'In Use',                 condition: 'Baik',             location: 'p4', warehouse: null, pic: 'Site Manager 4', hourMeter: 1560, power: '45 kW', capacity: '150 m', weight: '4.2 ton', fuel: 'Solar', buyDate: '2022-09-01', buyPrice: 520000000, warranty: '2025-09-01', ownership: 'Sewa', sia: '2025-09-01', silo: null, stnk: null },
    { id: 'ALT-022', name: 'Pressure Washer Karcher',  type: 'Alat Kebersihan', brand: 'Karcher HD10/25-4S', serial: 'KCH-HD10-2023-022', status: 'Ready',        condition: 'Baik',            location: null, warehouse: 'w1', pic: 'Budi Santoso',   hourMeter: 120,  power: '7.5 kW', capacity: '250 bar', weight: '130 kg', fuel: 'Listrik', buyDate: '2023-07-14', buyPrice: 42000000, warranty: '2026-07-14', ownership: 'Milik', sia: null, silo: null, stnk: null },
  ],

  // ── SPARE PARTS ──────────────────────────────────────────
  parts: [
    { id: 'SPC-001', name: 'Filter Oli Mesin Caterpillar', brand: 'Caterpillar', partNumber: '1R-0716',   category: 'Filter',      stock: 8,  minStock: 5,  unit: 'pcs', rack: 'A-01', price: 320000 },
    { id: 'SPC-002', name: 'Filter Solar Komatsu',          brand: 'Komatsu',    partNumber: '600-311-8321', category: 'Filter',   stock: 3,  minStock: 5,  unit: 'pcs', rack: 'A-02', price: 285000 },
    { id: 'SPC-003', name: 'Oli Mesin Shell Rimula 15W40',  brand: 'Shell',      partNumber: 'SHL-RIM-15W40', category: 'Oli',    stock: 24, minStock: 10, unit: 'liter', rack: 'B-01', price: 58000 },
    { id: 'SPC-004', name: 'Oli Hidrolik Shell Tellus 46',  brand: 'Shell',      partNumber: 'SHL-TEL-46', category: 'Oli',       stock: 18, minStock: 10, unit: 'liter', rack: 'B-02', price: 62000 },
    { id: 'SPC-005', name: 'V-Belt B-52 Excavator',         brand: 'Gates',      partNumber: 'GT-B52',    category: 'Belt',        stock: 6,  minStock: 4,  unit: 'pcs', rack: 'C-01', price: 145000 },
    { id: 'SPC-006', name: 'Busi Bosh Genset Perkins',      brand: 'Bosch',      partNumber: 'BSH-YR6ME', category: 'Ignition',    stock: 12, minStock: 8,  unit: 'pcs', rack: 'C-02', price: 85000 },
    { id: 'SPC-007', name: 'Aki 12V 100Ah Yuasa',           brand: 'Yuasa',      partNumber: 'YUA-NP100-12', category: 'Elektrikal', stock: 4,minStock: 2, unit: 'unit', rack: 'D-01', price: 1250000 },
    { id: 'SPC-008', name: 'Seal Kit Hidrolik Komatsu PC200', brand: 'Komatsu',  partNumber: 'KOM-707-99-45290', category: 'Seal', stock: 2, minStock: 3,  unit: 'set', rack: 'D-02', price: 2800000 },
    { id: 'SPC-009', name: 'Air Filter Caterpillar 320',    brand: 'Caterpillar', partNumber: '6I-2506',  category: 'Filter',      stock: 5,  minStock: 4,  unit: 'pcs', rack: 'A-03', price: 420000 },
    { id: 'SPC-010', name: 'Radiator Coolant Prestone',     brand: 'Prestone',   partNumber: 'PRE-AF2000', category: 'Cairan',     stock: 15, minStock: 8,  unit: 'liter', rack: 'B-03', price: 75000 },
    { id: 'SPC-011', name: 'Lampu Kerja LED 50W',           brand: 'Philips',    partNumber: 'PHI-BVP150-50W', category: 'Elektrikal', stock: 8,minStock: 4, unit: 'pcs', rack: 'E-01', price: 185000 },
    { id: 'SPC-012', name: 'Greasing/Grease Nipple M8',     brand: 'SKF',        partNumber: 'SKF-GRP-M8', category: 'Fastener',   stock: 35, minStock: 20, unit: 'pcs', rack: 'E-02', price: 12000 },
    { id: 'SPC-013', name: 'Seal Ring Mud Pump National',   brand: 'National',   partNumber: 'NAT-P-109438', category: 'Seal',     stock: 1,  minStock: 3,  unit: 'set', rack: 'D-03', price: 4500000 },
    { id: 'SPC-014', name: 'Coupling Flexible 100mm',       brand: 'Rexnord',    partNumber: 'REX-KBSS100', category: 'Coupling',  stock: 3,  minStock: 2,  unit: 'pcs', rack: 'C-03', price: 850000 },
    { id: 'SPC-015', name: 'Karet Seal Pintu Panel Listrik', brand: 'Generic',   partNumber: 'GEN-SEAL-PANEL', category: 'Seal',   stock: 10, minStock: 5,  unit: 'meter', rack: 'E-03', price: 35000 },
  ],

  // ── WORK ORDERS ──────────────────────────────────────────
  workOrders: [
    { id: 'WO-001', equipment: 'ALT-006', type: 'Corrective', title: 'Perbaikan Hidrolik Komatsu PC200', status: 'In Progress', priority: 'Critical', mechanic: 'Cecep Nugraha', workshop: 'Workshop Gudang Pusat', startDate: '2025-01-10', dueDate: '2025-01-20', parts: [{ partId: 'SPC-008', qty: 1 }, { partId: 'SPC-004', qty: 5 }], notes: 'Kebocoran seal silinder hidrolik lengan', verifiedBy: null, completedDate: null, damageReport: 'DR-001' },
    { id: 'WO-002', equipment: 'ALT-003', type: 'Preventive', title: 'Service 500 Jam Genset Perkins',   status: 'Selesai',     priority: 'Medium',   mechanic: 'Cecep Nugraha', workshop: 'Workshop Gudang Pusat', startDate: '2025-01-05', dueDate: '2025-01-08', parts: [{ partId: 'SPC-001', qty: 1 }, { partId: 'SPC-003', qty: 6 }, { partId: 'SPC-006', qty: 4 }], notes: 'Ganti oli, filter, busi rutin 500 jam', verifiedBy: 'Budi Santoso', completedDate: '2025-01-08', damageReport: null },
    { id: 'WO-003', equipment: 'ALT-019', type: 'Corrective', title: 'Overhaul Mesin CME-55',            status: 'Open',        priority: 'Critical', mechanic: 'Cecep Nugraha', workshop: 'Workshop Bengkel Luar', startDate: '2025-01-15', dueDate: '2025-02-15', parts: [{ partId: 'SPC-003', qty: 12 }, { partId: 'SPC-009', qty: 2 }], notes: 'Mesin tidak bisa start, perlu overhaul total', verifiedBy: null, completedDate: null, damageReport: 'DR-002' },
    { id: 'WO-004', equipment: 'ALT-005', type: 'Preventive', title: 'Servis Berkala Excavator CAT 320', status: 'Menunggu Verifikasi', priority: 'Low', mechanic: 'Cecep Nugraha', workshop: 'Workshop Gudang Pusat', startDate: '2025-01-12', dueDate: '2025-01-14', parts: [{ partId: 'SPC-001', qty: 1 }, { partId: 'SPC-003', qty: 8 }, { partId: 'SPC-009', qty: 1 }], notes: 'Ganti oli dan filter rutin', verifiedBy: null, completedDate: '2025-01-14', damageReport: null },
    { id: 'WO-005', equipment: 'ALT-007', type: 'Preventive', title: 'Cek Rutin Kompresor Atlas',        status: 'In Progress', priority: 'Medium',   mechanic: 'Staf Mekanik 2', workshop: 'Site Workshop KAL', startDate: '2025-01-18', dueDate: '2025-01-22', parts: [{ partId: 'SPC-005', qty: 2 }, { partId: 'SPC-010', qty: 3 }], notes: 'Pemeriksaan dan penggantian belt dan coolant', verifiedBy: null, completedDate: null, damageReport: null },
    { id: 'WO-006', equipment: 'ALT-004', type: 'Corrective', title: 'Perbaikan AVR Genset Cummins',     status: 'Open',        priority: 'Medium',   mechanic: 'Staf Mekanik 3', workshop: 'Site Workshop SUL', startDate: '2025-01-20', dueDate: '2025-01-25', parts: [{ partId: 'SPC-007', qty: 1 }], notes: 'AVR tidak stabil, tegangan naik turun', verifiedBy: null, completedDate: null, damageReport: 'DR-003' },
  ],

  // ── DAMAGE REPORTS ───────────────────────────────────────
  damageReports: [
    { id: 'DR-001', equipment: 'ALT-006', reporter: 'Operator Site', symptom: 'Kebocoran oli hidrolik pada silinder lengan', urgency: 'Critical', reportDate: '2025-01-09', photos: [], status: 'WO Dibuat', linkedWO: 'WO-001' },
    { id: 'DR-002', equipment: 'ALT-019', reporter: 'Cecep Nugraha',  symptom: 'Mesin tidak dapat dihidupkan sama sekali, starter berputar tapi mesin tidak menyala', urgency: 'Critical', reportDate: '2025-01-14', photos: [], status: 'WO Dibuat', linkedWO: 'WO-003' },
    { id: 'DR-003', equipment: 'ALT-004', reporter: 'Operator SUL-02', symptom: 'Tegangan output tidak stabil 180-240V fluktuatif', urgency: 'Medium', reportDate: '2025-01-19', photos: [], status: 'WO Dibuat', linkedWO: 'WO-006' },
  ],

  // ── MOBILIZATIONS ────────────────────────────────────────
  mobilizations: [
    { id: 'MOB-001', equipment: 'ALT-015', from: 'w1', to: 'p2', requestBy: 'Ahmad Bachtiar', requestDate: '2025-01-10', approvedBy: 'Eko Prasetyo', approvedDate: '2025-01-11', driver: 'Gita Lestari', departureDate: '2025-01-12', estimatedArrival: '2025-01-14', status: 'In Transit', checkoutOil: true, checkoutHydraulic: true, checkoutAccessories: true, hourMeterOut: 41900, condition_sent: 'Baik', condition_arrived: null, running_test: null, notes: '' },
    { id: 'MOB-002', equipment: 'ALT-002', from: 'w1', to: 'p1', requestBy: 'Ahmad Bachtiar', requestDate: '2025-01-08', approvedBy: 'Eko Prasetyo', approvedDate: '2025-01-09', driver: 'Gita Lestari', departureDate: '2025-01-09', estimatedArrival: '2025-01-12', status: 'Completed', checkoutOil: true, checkoutHydraulic: true, checkoutAccessories: true, hourMeterOut: 1150, condition_sent: 'Baik', condition_arrived: 'Baik', running_test: true, notes: '' },
    { id: 'MOB-003', equipment: 'ALT-012', from: 'w1', to: 'p3', requestBy: 'Site Manager', requestDate: '2025-01-15', approvedBy: null, approvedDate: null, driver: null, departureDate: null, estimatedArrival: null, status: 'Pending Approval', checkoutOil: false, checkoutHydraulic: false, checkoutAccessories: false, hourMeterOut: null, condition_sent: null, condition_arrived: null, running_test: null, notes: '' },
  ],

  // ── PURCHASE REQUESTS ────────────────────────────────────
  purchaseRequests: [
    { id: 'PR-001', title: 'Pengadaan Suku Cadang Rutin Q1 2025', requestBy: 'Cecep Nugraha', department: 'Workshop', requestDate: '2025-01-05', priority: 'Medium', items: [{ partId: 'SPC-002', qty: 10, estimatedPrice: 285000 }, { partId: 'SPC-008', qty: 3, estimatedPrice: 2800000 }, { partId: 'SPC-013', qty: 4, estimatedPrice: 4500000 }], status: 'Approved', approvedBy: 'Eko Prasetyo', approvedDate: '2025-01-07', linkedPO: 'PO-001', notes: 'Untuk kebutuhan maintenance Q1' },
    { id: 'PR-002', title: 'Pembelian Aki dan Lampu Kerja',        requestBy: 'Budi Santoso',  department: 'Gudang',    requestDate: '2025-01-10', priority: 'Low',    items: [{ partId: 'SPC-007', qty: 5, estimatedPrice: 1250000 }, { partId: 'SPC-011', qty: 10, estimatedPrice: 185000 }], status: 'Approved', approvedBy: 'Eko Prasetyo', approvedDate: '2025-01-12', linkedPO: 'PO-002', notes: 'Stok gudang hampir habis' },
    { id: 'PR-003', title: 'Pengadaan Filter & Oli Bulk',          requestBy: 'Cecep Nugraha', department: 'Workshop',  requestDate: '2025-01-18', priority: 'High',   items: [{ partId: 'SPC-001', qty: 20, estimatedPrice: 320000 }, { partId: 'SPC-003', qty: 100, estimatedPrice: 58000 }, { partId: 'SPC-010', qty: 50, estimatedPrice: 75000 }], status: 'Pending', approvedBy: null, approvedDate: null, linkedPO: null, notes: 'Stok oli hampir habis, butuh segera' },
    { id: 'PR-004', title: 'Spare Parts Overhaul CME-55',          requestBy: 'Cecep Nugraha', department: 'Workshop',  requestDate: '2025-01-16', priority: 'Critical', items: [{ partId: 'SPC-009', qty: 4, estimatedPrice: 420000 }, { partId: 'SPC-005', qty: 6, estimatedPrice: 145000 }, { partId: 'SPC-014', qty: 2, estimatedPrice: 850000 }], status: 'Approved', approvedBy: 'Eko Prasetyo', approvedDate: '2025-01-17', linkedPO: null, notes: 'Untuk WO-003 Overhaul CME-55' },
    { id: 'PR-005', title: 'Pembelian Greasing Material',          requestBy: 'Budi Santoso',  department: 'Gudang',    requestDate: '2025-01-20', priority: 'Low',    items: [{ partId: 'SPC-012', qty: 100, estimatedPrice: 12000 }, { partId: 'SPC-015', qty: 20, estimatedPrice: 35000 }], status: 'Rejected', approvedBy: 'Eko Prasetyo', approvedDate: '2025-01-21', linkedPO: null, notes: 'Ditolak: stok masih cukup' },
  ],

  // ── PURCHASE ORDERS ──────────────────────────────────────
  purchaseOrders: [
    { id: 'PO-001', pr: 'PR-001', vendor: 'v4', items: [{ partId: 'SPC-002', qty: 10, unitPrice: 270000 }, { partId: 'SPC-008', qty: 3, unitPrice: 2650000 }, { partId: 'SPC-013', qty: 4, unitPrice: 4200000 }], orderDate: '2025-01-08', deliveryDate: '2025-01-15', status: 'Received', total: 27450000, grDate: '2025-01-15', grBy: 'Budi Santoso' },
    { id: 'PO-002', pr: 'PR-002', vendor: 'v2', items: [{ partId: 'SPC-007', qty: 5, unitPrice: 1200000 }, { partId: 'SPC-011', qty: 10, unitPrice: 175000 }], orderDate: '2025-01-13', deliveryDate: '2025-01-20', status: 'Delivered', total: 7750000, grDate: null, grBy: null },
  ],

  // ── QUOTATIONS ────────────────────────────────────────────
  quotations: [
    { id: 'QT-001', pr: 'PR-001', vendor: 'v2', items: [{ partId: 'SPC-002', unitPrice: 290000 }, { partId: 'SPC-008', unitPrice: 2750000 }, { partId: 'SPC-013', unitPrice: 4300000 }], total: 28100000, notes: 'Pengiriman 5 hari kerja' },
    { id: 'QT-002', pr: 'PR-001', vendor: 'v4', items: [{ partId: 'SPC-002', unitPrice: 270000 }, { partId: 'SPC-008', unitPrice: 2650000 }, { partId: 'SPC-013', unitPrice: 4200000 }], total: 27450000, notes: 'Pengiriman 7 hari kerja, harga terbaik' },
    { id: 'QT-003', pr: 'PR-001', vendor: 'v1', items: [{ partId: 'SPC-002', unitPrice: 310000 }, { partId: 'SPC-008', unitPrice: 2900000 }, { partId: 'SPC-013', unitPrice: 4600000 }], total: 30050000, notes: 'Garansi 6 bulan per item' },
  ],

  // ── PREVENTIVE SCHEDULE ──────────────────────────────────
  preventiveSchedule: [
    { id: 'PS-001', equipment: 'ALT-003', title: 'Service 1000 Jam',  intervalHours: 1000, nextDueDate: '2025-02-10', lastDoneDate: '2024-11-10', status: 'Upcoming' },
    { id: 'PS-002', equipment: 'ALT-004', title: 'Service 500 Jam',   intervalHours: 500,  nextDueDate: '2025-01-28', lastDoneDate: '2024-12-28', status: 'Due Soon' },
    { id: 'PS-003', equipment: 'ALT-005', title: 'Ganti Oli Bulanan', intervalHours: 250,  nextDueDate: '2025-02-05', lastDoneDate: '2025-01-05', status: 'Upcoming' },
    { id: 'PS-004', equipment: 'ALT-001', title: 'Service 500 Jam',   intervalHours: 500,  nextDueDate: '2025-01-25', lastDoneDate: '2024-12-25', status: 'Due Soon' },
    { id: 'PS-005', equipment: 'ALT-009', title: 'Overhaul Liner',    intervalHours: 2000, nextDueDate: '2025-03-15', lastDoneDate: '2024-09-15', status: 'Upcoming' },
  ],

  // ── NOTIFICATIONS ────────────────────────────────────────
  notifications: [
    { id: 'N001', type: 'warning',  title: 'Sertifikat SILO Hampir Habis', message: 'Genset 100 kVA Perkins (ALT-003): SILO habis 15 Mar 2025', date: '2025-01-15', read: false, link: '#/alat/ALT-003' },
    { id: 'N002', type: 'warning',  title: 'Servis Jatuh Tempo',            message: 'Genset 250 kVA (ALT-004): PM-500Jam jatuh tempo 28 Jan 2025', date: '2025-01-16', read: false, link: '#/maintenance' },
    { id: 'N003', type: 'critical', title: 'Stok Part Kritis',              message: 'Seal Kit Hidrolik Komatsu (SPC-008): Stok 2 di bawah minimum 3', date: '2025-01-17', read: false, link: '#/parts' },
    { id: 'N004', type: 'critical', title: 'Stok Part Kritis',              message: 'Seal Ring Mud Pump (SPC-013): Stok 1 di bawah minimum 3', date: '2025-01-17', read: false, link: '#/parts' },
    { id: 'N005', type: 'info',     title: 'PR Menunggu Persetujuan',       message: 'PR-003 Pengadaan Filter & Oli Bulk menunggu approval', date: '2025-01-18', read: false, link: '#/pembelian' },
    { id: 'N006', type: 'info',     title: 'Mobilisasi Baru',               message: 'MOB-003 Trimble R10 menunggu persetujuan ke Proyek Survei Sumatra', date: '2025-01-15', read: true, link: '#/mobilisasi' },
    { id: 'N007', type: 'warning',  title: 'SIA Hampir Habis',              message: 'Drilling Rig SPT-100 (ALT-019): SIA habis 20 Jan 2025 — SUDAH LEWAT', date: '2025-01-10', read: true, link: '#/alat/ALT-019' },
    { id: 'N008', type: 'warning',  title: 'Genset SILO Hampir Habis',      message: 'Genset 75 kVA Mitsubishi (ALT-020): SILO habis 28 Feb 2025', date: '2025-01-18', read: false, link: '#/alat/ALT-020' },
  ],

  // ── AUDIT LOG ────────────────────────────────────────────
  auditLog: [
    { id: 'AUD-001', timestamp: '2025-01-09 08:32:15', user: 'Operator Site',   action: 'CREATE',  module: 'Laporan Kerusakan', recordId: 'DR-001', field: 'status',    oldValue: null,             newValue: 'Dilaporkan' },
    { id: 'AUD-002', timestamp: '2025-01-09 09:15:44', user: 'Cecep Nugraha',   action: 'CREATE',  module: 'Work Order',        recordId: 'WO-001', field: 'status',    oldValue: null,             newValue: 'Open' },
    { id: 'AUD-003', timestamp: '2025-01-09 09:16:01', user: 'Cecep Nugraha',   action: 'UPDATE',  module: 'Database Alat',     recordId: 'ALT-006', field: 'status',   oldValue: 'Ready',          newValue: 'Under Maintenance' },
    { id: 'AUD-004', timestamp: '2025-01-10 10:05:22', user: 'Cecep Nugraha',   action: 'UPDATE',  module: 'Work Order',        recordId: 'WO-001', field: 'status',    oldValue: 'Open',           newValue: 'In Progress' },
    { id: 'AUD-005', timestamp: '2025-01-05 14:22:10', user: 'Cecep Nugraha',   action: 'CREATE',  module: 'Purchase Request',  recordId: 'PR-001', field: 'status',    oldValue: null,             newValue: 'Pending' },
    { id: 'AUD-006', timestamp: '2025-01-07 09:00:00', user: 'Eko Prasetyo',    action: 'UPDATE',  module: 'Purchase Request',  recordId: 'PR-001', field: 'status',    oldValue: 'Pending',        newValue: 'Approved' },
    { id: 'AUD-007', timestamp: '2025-01-08 11:30:00', user: 'Dewi Rahayu',     action: 'CREATE',  module: 'Purchase Order',    recordId: 'PO-001', field: 'status',    oldValue: null,             newValue: 'Ordered' },
    { id: 'AUD-008', timestamp: '2025-01-15 16:45:30', user: 'Budi Santoso',    action: 'UPDATE',  module: 'Purchase Order',    recordId: 'PO-001', field: 'status',    oldValue: 'Ordered',        newValue: 'Received' },
    { id: 'AUD-009', timestamp: '2025-01-10 08:00:00', user: 'Ahmad Bachtiar',  action: 'CREATE',  module: 'Mobilisasi',        recordId: 'MOB-001', field: 'status',   oldValue: null,             newValue: 'Pending Approval' },
    { id: 'AUD-010', timestamp: '2025-01-11 10:20:00', user: 'Eko Prasetyo',    action: 'UPDATE',  module: 'Mobilisasi',        recordId: 'MOB-001', field: 'status',   oldValue: 'Pending Approval', newValue: 'Approved' },
    { id: 'AUD-011', timestamp: '2025-01-12 07:00:00', user: 'Budi Santoso',    action: 'UPDATE',  module: 'Mobilisasi',        recordId: 'MOB-001', field: 'status',   oldValue: 'Approved',       newValue: 'In Transit' },
    { id: 'AUD-012', timestamp: '2025-01-12 07:00:00', user: 'Budi Santoso',    action: 'UPDATE',  module: 'Database Alat',     recordId: 'ALT-015', field: 'status',   oldValue: 'Ready',          newValue: 'In Transit' },
  ],
};

// ── STATE MANAGEMENT ─────────────────────────────────────────
function loadState() {
  try {
    const saved = localStorage.getItem('geoace_data');
    if (saved) return JSON.parse(saved);
  } catch (e) { /* ignore */ }
  return JSON.parse(JSON.stringify(INITIAL_DATA));
}

function saveState(data) {
  try {
    localStorage.setItem('geoace_data', JSON.stringify(data));
  } catch (e) { /* ignore */ }
}

function resetState() {
  localStorage.removeItem('geoace_data');
  return JSON.parse(JSON.stringify(INITIAL_DATA));
}

// Expose
window.GeoACE = window.GeoACE || {};
window.GeoACE.INITIAL_DATA = INITIAL_DATA;
window.GeoACE.loadState = loadState;
window.GeoACE.saveState = saveState;
window.GeoACE.resetState = resetState;
