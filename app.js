// =============================================================
// app.js — GeoACE Logistic & Machinery Management System
// Routing, state, rendering, business rules — ES6 vanilla JS
// Koneksi Supabase via db.js; fallback lokal via data.js.
// =============================================================

'use strict';

// ── BOOTSTRAP ────────────────────────────────────────────────
let DB   = GeoACE.loadState();
let currentUser = null;
let currentRole = 'PM Site';
let _isSupabase = DB_API.mode() === 'supabase';

// ── ROLE CONFIG ──────────────────────────────────────────────
const ROLE_MENU = {
  'PM Site':    ['dashboard','alat','mobilisasi','maintenance','parts','laporan'],
  'Gudang':     ['dashboard','alat','mobilisasi','parts','laporan'],
  'Mekanik':    ['dashboard','alat','maintenance','parts'],
  'Purchasing': ['dashboard','pembelian','parts','laporan'],
  'Manajemen':  ['dashboard','alat','mobilisasi','maintenance','parts','pembelian','laporan','master','pengaturan'],
  'Admin':      ['dashboard','alat','mobilisasi','maintenance','parts','pembelian','laporan','master','pengaturan'],
};

const MENU_ITEMS = [
  { id:'dashboard',   label:'Dashboard',              icon:'📊', section:'Utama' },
  { id:'alat',        label:'Database Mesin & Alat',  icon:'⚙️', section:'Utama' },
  { id:'mobilisasi',  label:'Kebutuhan & Mobilisasi', icon:'🚛', section:'Operasional' },
  { id:'maintenance', label:'Pemeliharaan',            icon:'🔧', section:'Operasional' },
  { id:'parts',       label:'Suku Cadang',             icon:'🔩', section:'Operasional' },
  { id:'pembelian',   label:'Pembelian',               icon:'🛒', section:'Keuangan' },
  { id:'laporan',     label:'Laporan',                 icon:'📋', section:'Keuangan' },
  { id:'master',      label:'Master Data',             icon:'🗄️', section:'Konfigurasi' },
  { id:'pengaturan',  label:'Pengaturan',              icon:'⚙',  section:'Konfigurasi' },
];

// ── UTILITIES ─────────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const fmt = new Intl.NumberFormat('id-ID');
const fmtRp = v => v != null ? 'Rp ' + fmt.format(v) : '—';
const fmtDate = d => d ? new Date(d).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}) : '—';
const nowISO = () => new Date().toISOString();
const nowStr = () => new Date().toISOString().slice(0,19).replace('T',' ');
const uid = prefix => prefix + '-' + Math.random().toString(36).slice(2,7).toUpperCase();
const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

// ── LOADING SKELETON ─────────────────────────────────────────
function skeletonRows(cols = 5, rows = 5) {
  return `<div class="table-wrapper"><table class="table"><tbody>${
    Array.from({length:rows}).map(() =>
      `<tr>${Array.from({length:cols}).map(() =>
        `<td><div style="height:14px;background:var(--border);border-radius:4px;animation:pulse 1.2s infinite alternate"></div></td>`
      ).join('')}</tr>`
    ).join('')
  }</tbody></table></div>
  <style>@keyframes pulse{from{opacity:.5}to{opacity:1}}</style>`;
}

// ── STATUS BADGES ─────────────────────────────────────────────
function statusBadge(status) {
  const map = {
    'Ready':'ready','In Transit':'in-transit','In Use':'in-use',
    'Under Maintenance':'maintenance','Broken':'broken','Scrapped':'scrapped',
    // Mobilisasi
    'Diajukan':'pending','Disetujui':'approved','Ditolak':'rejected','Selesai':'done',
    // WO
    'Open':'open','In Progress':'in-progress','Menunggu Verifikasi':'waiting',
    // PR/PO
    'Draft':'pending','PO terbit':'in-transit','Dikirim':'in-transit',
    'Diterima sebagian':'warning','Diterima':'done','Dibatalkan':'broken',
    // LK
    'Dilaporkan':'pending','WO dibuat':'in-progress',
    // Urgensi
    'Critical':'critical','High':'high','Medium':'medium','Low':'low',
    // Kondisi
    'Baik':'ready','Perlu perbaikan':'medium','Rusak ringan':'high','Rusak berat':'broken',
  };
  const cls = map[status] || 'info';
  return `<span class="badge badge--${cls} badge--dot">${esc(status||'—')}</span>`;
}
function conditionBadge(c) {
  return statusBadge(c);
}

// ── LOOKUP HELPERS ────────────────────────────────────────────
const getEquip  = id => DB.equipment.find(e => e.id_alat === id);
const getProject= id => DB.projects.find(p => p.kode_proyek === id);
const getWH     = id => DB.warehouses.find(w => w.kode_gudang === id);
const getVendor = id => DB.vendors.find(v => v.kode_vendor === id);
const getPart   = id => DB.parts.find(p => p.kode_barang === id);

const projectName  = id => getProject(id)?.nama_proyek || id || '—';
const whName       = id => getWH(id)?.nama_gudang || id || '—';
const vendorName   = id => getVendor(id)?.nama_vendor || id || '—';
const partName     = id => getPart(id)?.nama_barang || id || '—';
const equipName    = id => { const e=getEquip(id); return e ? `${id} — ${e.nama_alat}` : (id||'—'); };

function locationLabel(eq) {
  if (!eq) return '—';
  if (eq.kode_proyek) return projectName(eq.kode_proyek);
  if (eq.kode_gudang) return whName(eq.kode_gudang);
  return 'Dalam perjalanan';
}

function equipmentLocalStock(kodeBrg) {
  return GeoACE.getLocalStock(DB, kodeBrg);
}

// ── WRITE HELPER — wraps all DB writes with offline fallback ──
/**
 * Coba tulis ke Supabase; bila gagal karena network, masukkan
 * ke antrean offline dan update state lokal.
 * @param {Function} dbFn        - () => DB_API.insert(...) atau update(...)
 * @param {Function} localFn     - () => mutasi state lokal
 * @param {string}   pendingMsg  - pesan toast saat offline
 * @returns {Promise<object|null>} baris yang disimpan, atau null
 */
async function withFallback(dbFn, localFn, pendingMsg) {
  if (!_isSupabase) { localFn(); GeoACE.saveState(DB); return null; }
  try {
    setBusy(true);
    const result = await dbFn();
    setBusy(false);
    return result;
  } catch (e) {
    setBusy(false);
    if (e.isNetwork) {
      showToast(pendingMsg + ' (disimpan lokal, sinkron saat online)', 'warning');
      localFn();
      GeoACE.saveState(DB);
    } else {
      showToast(e.message, 'error', 5000);
    }
    return null;
  }
}

let _busyCount = 0;
function setBusy(on) {
  _busyCount = Math.max(0, _busyCount + (on ? 1 : -1));
  $$('button.btn--primary, button.btn--danger, button.btn--success, button.btn--teal').forEach(b => {
    b.disabled = _busyCount > 0;
  });
}

// ── TOAST ─────────────────────────────────────────────────────
function showToast(msg, type = 'success', duration = 3500) {
  const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.innerHTML = `<span class="toast__icon" aria-hidden="true">${icons[type]||'ℹ️'}</span><span>${esc(msg)}</span>`;
  $('#toast-container').appendChild(el);
  setTimeout(() => { el.style.opacity='0'; el.style.transition='opacity .3s'; setTimeout(()=>el.remove(), 320); }, duration);
}

// ── CONFIRM MODAL ─────────────────────────────────────────────
let _confirmCb = null;
function showConfirm(msg, cb, title='Konfirmasi', okLabel='Ya, Lanjutkan', danger=false) {
  $('#confirm-msg').textContent = msg;
  $('#confirm-title').textContent = title;
  $('#confirm-ok-btn').textContent = okLabel;
  $('#confirm-ok-btn').className = `btn ${danger?'btn--danger':'btn--primary'}`;
  _confirmCb = cb;
  $('#confirm-overlay').classList.add('modal-overlay--open');
}
$('#confirm-cancel-btn').addEventListener('click', () => {
  $('#confirm-overlay').classList.remove('modal-overlay--open'); _confirmCb=null;
});
$('#confirm-ok-btn').addEventListener('click', () => {
  $('#confirm-overlay').classList.remove('modal-overlay--open');
  if (_confirmCb) { _confirmCb(); _confirmCb=null; }
});

// ── GENERIC MODAL ─────────────────────────────────────────────
function openModal(title, bodyHTML, footerHTML='', size='') {
  $('#modal-title').textContent = title;
  $('#modal-body').innerHTML = bodyHTML;
  $('#modal-footer').innerHTML = footerHTML;
  $('#modal').className = 'modal' + (size ? ' modal--'+size : '');
  $('#modal-overlay').classList.add('modal-overlay--open');
}
function closeModal() { $('#modal-overlay').classList.remove('modal-overlay--open'); }
$('#modal-close-btn').addEventListener('click', closeModal);
$('#modal-overlay').addEventListener('click', e => { if(e.target===$('#modal-overlay')) closeModal(); });

// ── ROUTING ───────────────────────────────────────────────────
function getRoute() {
  const h = location.hash || '#/dashboard';
  const parts = h.replace('#/','').split('/');
  return { page: parts[0]||'dashboard', param: parts[1]||null };
}
function navigate(path) { location.hash = '#/'+path; }

function renderPage(route) {
  $$('.page').forEach(p => p.classList.remove('page--active'));
  const { page, param } = route;
  if (page==='alat' && param) {
    $('#page-alat-detail').classList.add('page--active');
    renderAlatDetail(param);
  } else {
    const el = $(`#page-${page}`);
    if (el) el.classList.add('page--active');
    const fns = { dashboard:renderDashboard, alat:renderAlat, mobilisasi:renderMobilisasi,
                  maintenance:renderMaintenance, parts:renderParts, pembelian:renderPembelian,
                  laporan:renderLaporan, master:renderMaster, pengaturan:renderPengaturan };
    fns[page]?.();
  }
  updateSidebarActive(page);
  $$('.bottom-nav__item').forEach(b => b.classList.toggle('bottom-nav__item--active', b.dataset.route===page));
}
window.addEventListener('hashchange', () => renderPage(getRoute()));

// ── LOGIN ─────────────────────────────────────────────────────
$$('.login__role-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.login__role-btn').forEach(b => { b.classList.remove('login__role-btn--active'); b.setAttribute('aria-pressed','false'); });
    btn.classList.add('login__role-btn--active'); btn.setAttribute('aria-pressed','true');
    currentRole = btn.dataset.role;
  });
});

$('#login-form').addEventListener('submit', () => doLogin());
$('#login-btn').addEventListener('click', doLogin);

async function doLogin() {
  currentUser = DB.users.find(u => u.peran === currentRole) || { id_pengguna:'u_guest', nama:currentRole+' User', peran:currentRole };
  DB_API.setCurrentUser(currentUser.nama);

  $('#login-screen').style.display = 'none';
  $('#app').classList.add('app--visible');

  // Muat data dari Supabase bila tersedia
  if (_isSupabase) {
    showToast('Menghubungkan ke database…', 'info', 1500);
    try {
      const remote = await DB_API.loadAll();
      // Petakan hasil ke struktur DB lokal
      DB.projects            = remote.projects;
      DB.warehouses          = remote.warehouses;
      DB.vendors             = remote.vendors;
      DB.users               = remote.users;
      DB.equipment           = remote.equipment;
      DB.parts               = remote.parts;
      DB.stockRows           = remote.stockRows;
      DB.workOrders          = remote.workOrders;
      DB.damageReports       = remote.damageReports;
      DB.mobilizations       = remote.mobilizations;
      DB.purchaseRequests    = remote.purchaseRequests;
      DB.purchaseOrders      = remote.purchaseOrders;
      DB.quotations          = remote.quotations;
      DB.preventiveSchedule  = remote.preventiveSchedule;
      DB.notifications       = remote.notifications;
    } catch (e) {
      showToast('Tidak dapat terhubung ke Supabase — mode lokal aktif', 'warning');
      _isSupabase = false;
    }
  }

  buildSidebar();
  updateTopbar();
  updateNotifBadge();
  updateDBChip();
  startOfflineSync();
  navigate('dashboard');
  showToast(`Selamat datang, ${currentUser.nama} (${currentRole})`, 'success');
}

$('#logout-btn').addEventListener('click', () => {
  showConfirm('Keluar dari sistem?', () => {
    currentUser=null;
    $('#app').classList.remove('app--visible');
    $('#login-screen').style.display='';
  }, 'Keluar', 'Ya, Keluar', true);
});

// ── SIDEBAR ───────────────────────────────────────────────────
function buildSidebar() {
  const allowed = ROLE_MENU[currentRole] || [];
  let lastSection = '';
  let html = '';
  MENU_ITEMS.filter(m => allowed.includes(m.id)).forEach(m => {
    if (m.section !== lastSection) {
      html += `<div class="sidebar__section-label">${esc(m.section)}</div>`;
      lastSection = m.section;
    }
    const badge = m.id==='parts' ? getLowStockCount() : (m.id==='pembelian' ? getPendingPRCount() : '');
    html += `<a class="sidebar__item" href="#/${m.id}" data-page="${m.id}" aria-label="${esc(m.label)}">
      <span class="sidebar__item-icon" aria-hidden="true">${m.icon}</span>
      <span>${esc(m.label)}</span>
      ${badge ? `<span class="sidebar__item-badge" aria-label="${badge} item">${badge}</span>` : ''}
    </a>`;
  });
  $('#sidebar-nav').innerHTML = html;
}
function updateSidebarActive(page) {
  $$('.sidebar__item').forEach(a => {
    const active = a.dataset.page===page || (page==='alat-detail' && a.dataset.page==='alat');
    a.classList.toggle('sidebar__item--active', active);
    a.setAttribute('aria-current', active?'page':'false');
  });
}
function getLowStockCount() {
  return DB.parts.filter(p => equipmentLocalStock(p.kode_barang) < p.stok_minimum).length;
}
function getPendingPRCount() {
  return DB.purchaseRequests.filter(p => p.status==='Diajukan').length;
}

// ── TOPBAR ────────────────────────────────────────────────────
function updateTopbar() {
  if (!currentUser) return;
  const av = (currentUser.nama||'').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  $('#topbar-avatar').textContent = av;
  $('#topbar-name').textContent   = currentUser.nama;
  $('#topbar-role').textContent   = currentUser.peran;
  $('#topbar-chip').textContent   = currentUser.peran;
}

// ── DB CHIP (sumber data) ─────────────────────────────────────
function updateDBChip() {
  const el = $('#db-source-chip');
  if (!el) return;
  const ls = DB_API.lastSync();
  const lsStr = ls ? ls.toLocaleTimeString('id-ID') : '—';
  el.textContent = _isSupabase ? '🟢 Database: Supabase' : '🔘 Mode lokal';
  el.style.color = _isSupabase ? 'var(--green)' : 'var(--slate)';
  el.title = _isSupabase ? `Sinkron terakhir: ${lsStr}` : 'Data dari localStorage';
}

// ── NOTIFICATIONS ─────────────────────────────────────────────
function updateNotifBadge() {
  const count = DB.notifications.filter(n => !n.dibaca).length;
  const badge = $('#notif-badge');
  badge.textContent = count > 0 ? count : '';
  badge.style.display = count > 0 ? '' : 'none';
}

$('#notif-btn').addEventListener('click', e => {
  e.stopPropagation();
  const dd = $('#notif-dropdown');
  const open = dd.classList.toggle('notif-dropdown--open');
  $('#notif-btn').setAttribute('aria-expanded', open);
  if (open) renderNotifications();
});
document.addEventListener('click', e => {
  if (!$('#notif-dropdown').contains(e.target) && e.target !== $('#notif-btn'))
    $('#notif-dropdown').classList.remove('notif-dropdown--open');
});

function renderNotifications() {
  const notifs = DB.notifications.filter(n => !n.untuk_peran || n.untuk_peran===currentRole);
  const icons = { Critical:'🔴', warning:'🟡', info:'🔵' };
  const html = notifs.map(n => `<div class="notif-item ${n.dibaca?'':'notif-item--unread'}"
    data-notif="${n.id}" role="listitem" tabindex="0">
    <span class="notif-item__icon" aria-hidden="true">🔔</span>
    <div class="notif-item__body">
      <div class="notif-item__title">${esc(n.judul)}</div>
      <div class="notif-item__msg">${esc(n.pesan||'')}</div>
      <div class="notif-item__date">${fmtDate(n.record_time)}</div>
    </div>
  </div>`).join('') || '<div class="empty-state" style="padding:24px"><p>Tidak ada notifikasi</p></div>';
  $('#notif-list').innerHTML = html;

  $$('.notif-item').forEach(el => {
    el.addEventListener('click', async () => {
      const nId = el.dataset.notif;
      const n = DB.notifications.find(x => String(x.id)===String(nId));
      if (n && !n.dibaca) {
        n.dibaca = true;
        if (_isSupabase) {
          try { await DB_API.update('notifikasi', 'id', nId, { dibaca:true }); } catch {}
        } else { GeoACE.saveState(DB); }
        updateNotifBadge(); renderNotifications();
      }
      if (n?.link) { $('#notif-dropdown').classList.remove('notif-dropdown--open'); location.hash=n.link; }
    });
  });
}

$('#mark-all-read-btn').addEventListener('click', async () => {
  DB.notifications.forEach(n => n.dibaca=true);
  if (_isSupabase) {
    try { await DB_API.request('PATCH','notifikasi?dibaca=eq.false',{dibaca:true}); } catch {}
  } else { GeoACE.saveState(DB); }
  updateNotifBadge(); renderNotifications();
  showToast('Semua notifikasi ditandai dibaca','info');
});

// ── GLOBAL SEARCH ─────────────────────────────────────────────
$('#global-search').addEventListener('input', function() {
  const q = this.value.toLowerCase().trim();
  if (q.length < 2) return;
  const eq = DB.equipment.find(e => e.id_alat.toLowerCase().includes(q) || e.nama_alat.toLowerCase().includes(q));
  if (eq) { this.value=''; navigate('alat/'+eq.id_alat); }
});

// ── MOBILE ────────────────────────────────────────────────────
$('#sidebar-toggle').addEventListener('click', () => {
  const open = $('#sidebar').classList.toggle('sidebar--open');
  $('#sidebar-overlay').classList.toggle('sidebar-overlay--open', open);
  $('#sidebar-toggle').setAttribute('aria-expanded', open);
});
$('#sidebar-overlay').addEventListener('click', () => {
  $('#sidebar').classList.remove('sidebar--open');
  $('#sidebar-overlay').classList.remove('sidebar-overlay--open');
});
$$('.bottom-nav__item').forEach(btn => btn.addEventListener('click', () => navigate(btn.dataset.route)));

// ── OFFLINE SYNC ──────────────────────────────────────────────
function startOfflineSync() {
  DB_API.onQueueChange(q => {
    const pending = q.filter(i => !i.gagal).length;
    const failed  = q.filter(i => i.gagal).length;
    const wrap = $('#offline-badge-wrap');
    if (wrap) {
      wrap.style.setProperty('display', pending+failed > 0 ? 'flex' : 'none', 'important');
      const badge = wrap.querySelector('.offline-badge');
      if (badge) badge.textContent = `📶 ${pending} antrean${failed?' · '+failed+' gagal':''}`;
    }
  });
  window.addEventListener('online', () => DB_API.replayQueue().then(updateDBChip));
  setInterval(() => { if (navigator.onLine) DB_API.replayQueue().then(updateDBChip); }, 30000);
}

// ══════════════════════════════════════════════════════════════
// SCREEN 1: DASHBOARD
// ══════════════════════════════════════════════════════════════
async function renderDashboard() {
  $('#dashboard-content').innerHTML = skeletonRows(4,3);

  let kpi, warnings;
  if (_isSupabase) {
    try {
      [kpi, warnings] = await Promise.all([
        DB_API.view('v_dashboard_kpi'),
        DB_API.view('v_peringatan_dini','select=*&limit=8'),
      ]);
      kpi = Array.isArray(kpi) ? kpi[0] : kpi;
    } catch { kpi=null; warnings=[]; }
  }
  if (!kpi) {
    // Hitung lokal
    const eq = DB.equipment;
    const inUse  = eq.filter(e=>e.status==='In Use').length;
    const total  = eq.filter(e=>e.status!=='Scrapped').length;
    kpi = {
      total_alat: total, alat_in_use: inUse,
      alat_downtime: eq.filter(e=>['Under Maintenance','Broken'].includes(e.status)).length,
      utilisasi_persen: total ? Math.round(100*inUse/total) : 0,
      mobilisasi_aktif: DB.mobilizations.filter(m=>m.tanggal_keluar&&!m.tanggal_masuk).length,
    };
    warnings = buildLocalWarnings();
  }

  // Status donut (lokal tetap lebih detail)
  const eq = DB.equipment;
  const donutData = [
    { label:'Ready',            val:eq.filter(e=>e.status==='Ready').length,            color:'var(--green)' },
    { label:'In Use',           val:eq.filter(e=>e.status==='In Use').length,           color:'var(--accent-amber)' },
    { label:'In Transit',       val:eq.filter(e=>e.status==='In Transit').length,       color:'var(--teal)' },
    { label:'Under Maintenance',val:eq.filter(e=>e.status==='Under Maintenance').length,color:'var(--slate)' },
    { label:'Broken',           val:eq.filter(e=>e.status==='Broken').length,           color:'var(--rust)' },
    { label:'Scrapped',         val:eq.filter(e=>e.status==='Scrapped').length,         color:'var(--scrapped)' },
  ];
  const total = kpi.total_alat || 1;

  const projUsage = DB.projects.map(p => {
    const pEq   = DB.equipment.filter(e=>e.kode_proyek===p.kode_proyek);
    const used  = pEq.filter(e=>e.status==='In Use').length;
    const denom = pEq.length || 1;
    return { name: p.kode_proyek, pct: Math.round((used/denom)*100) };
  });

  const tco = [...DB.equipment].filter(e=>e.nilai_aset).sort((a,b)=>b.nilai_aset-a.nilai_aset).slice(0,5);
  const maxTco = tco[0]?.nilai_aset || 1;

  $('#dashboard-content').innerHTML = `
    <div class="page-header">
      <div>
        <h1 class="page-header__title">Dashboard</h1>
        <p class="page-header__subtitle">Ringkasan operasional alat dan mesin PT GeoACE</p>
      </div>
      <span class="u-small u-color-muted">${nowStr()}</span>
    </div>
    <div class="kpi-grid">
      <div class="kpi-card"><div class="kpi-card__content"><div class="kpi-card__label">Total Alat</div><div class="kpi-card__value">${kpi.total_alat}</div><div class="kpi-card__sub">Unit aktif</div></div><div class="kpi-card__icon kpi-card__icon--blue">⚙️</div></div>
      <div class="kpi-card"><div class="kpi-card__content"><div class="kpi-card__label">Utilisasi</div><div class="kpi-card__value">${kpi.utilisasi_persen}%</div><div class="kpi-card__sub">${kpi.alat_in_use} unit In Use</div></div><div class="kpi-card__icon kpi-card__icon--amber">📈</div></div>
      <div class="kpi-card"><div class="kpi-card__content"><div class="kpi-card__label">Alat Downtime</div><div class="kpi-card__value" style="color:var(--rust)">${kpi.alat_downtime}</div><div class="kpi-card__sub">Maintenance + Broken</div></div><div class="kpi-card__icon kpi-card__icon--rust">⚠️</div></div>
      <div class="kpi-card"><div class="kpi-card__content"><div class="kpi-card__label">Mobilisasi Aktif</div><div class="kpi-card__value" style="color:var(--teal)">${kpi.mobilisasi_aktif}</div><div class="kpi-card__sub">Unit In Transit</div></div><div class="kpi-card__icon kpi-card__icon--green">🚛</div></div>
    </div>
    <div class="dashboard-grid" style="margin-bottom:var(--sp-2)">
      <div class="card">
        <div class="card__header"><span class="card__title">Status Alat</span><span class="u-small u-color-muted">${total} unit</span></div>
        <div class="card__body"><div class="donut-wrap">${buildDonut(donutData,total)}
          <div class="donut-legend">${donutData.map(d=>`<div class="donut-legend__item"><span class="donut-legend__dot" style="background:${d.color}"></span><span class="donut-legend__label">${esc(d.label)}</span><span class="donut-legend__value">${d.val}</span></div>`).join('')}</div>
        </div></div>
      </div>
      <div class="card">
        <div class="card__header"><span class="card__title">Utilisasi per Proyek</span></div>
        <div class="card__body"><div class="bar-chart">
          ${projUsage.map(p=>`<div class="bar-chart__row"><div class="bar-chart__label">${esc(p.name)}</div><div class="bar-chart__track"><div class="bar-chart__fill" style="width:${p.pct}%"></div></div><div class="bar-chart__value">${p.pct}%</div></div>`).join('')}
        </div></div>
      </div>
    </div>
    <div class="dashboard-grid">
      <div class="card">
        <div class="card__header"><span class="card__title">Top 5 TCO Alat</span></div>
        <div class="card__body" style="padding:0"><div class="table-wrapper"><table class="table">
          <thead><tr><th>ID Alat</th><th>Nama</th><th>Nilai Aset</th><th>Proporsi</th></tr></thead>
          <tbody>${tco.map(e=>`<tr>
            <td><a href="#/alat/${e.id_alat}" class="u-mono">${esc(e.id_alat)}</a></td>
            <td>${esc(e.nama_alat)}</td><td>${fmtRp(e.nilai_aset)}</td>
            <td><div class="tco-bar"><div class="tco-bar__fill" style="width:${Math.round((e.nilai_aset/maxTco)*100)}%"></div></div></td>
          </tr>`).join('')}</tbody>
        </table></div></div>
      </div>
      <div class="card">
        <div class="card__header"><span class="card__title">⚠ Early Warning</span></div>
        <div class="card__body"><div class="warning-list">
          ${(warnings||[]).length===0
            ? '<div class="empty-state"><div class="empty-state__icon">✅</div><p>Tidak ada peringatan</p></div>'
            : (warnings||[]).slice(0,8).map(w=>`<div class="alert alert--${w.type||'warning'}">
                <span class="alert__icon">${(w.type||'')===('critical')?'🔴':'🟡'}</span>
                <div class="alert__text"><div class="alert__title">${esc(w.jenis||w.title||'')}</div><div class="alert__msg">${esc(w.keterangan||w.msg||'')}</div></div>
              </div>`).join('')
          }
        </div></div>
      </div>
    </div>`;
}

function buildLocalWarnings() {
  const w = [];
  const today=new Date(), soon=new Date(); soon.setDate(today.getDate()+60);
  DB.equipment.forEach(e => {
    if (e.garansi_sampai) {
      const d=new Date(e.garansi_sampai);
      if (d<today) w.push({jenis:'Garansi kadaluarsa',keterangan:`${e.id_alat} ${e.nama_alat}`,type:'critical'});
      else if (d<soon) w.push({jenis:'Garansi hampir habis',keterangan:`${e.id_alat} ${e.nama_alat}`,type:'warning'});
    }
  });
  DB.parts.filter(p=>equipmentLocalStock(p.kode_barang)<p.stok_minimum).forEach(p=>{
    w.push({jenis:'Stok part kritis',keterangan:`${p.kode_barang} ${p.nama_barang}`,type:'critical'});
  });
  DB.preventiveSchedule.forEach(ps=>{
    if (ps.berikut_tanggal && new Date(ps.berikut_tanggal)<soon)
      w.push({jenis:'Servis jatuh tempo',keterangan:`${ps.nama_servis} — ${equipName(ps.id_alat)}`,type:'warning'});
  });
  return w;
}

function buildDonut(data, total) {
  const size=140,cx=70,cy=70,r=50,stroke=20,circ=2*Math.PI*r;
  let offset=0;
  const segs=data.filter(d=>d.val>0).map(d=>{
    const dash=circ*(d.val/total);
    const seg=`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${d.color}" stroke-width="${stroke}" stroke-dasharray="${dash} ${circ-dash}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})"><title>${d.label}: ${d.val}</title></circle>`;
    offset+=dash; return seg;
  });
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Donut status alat">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--border)" stroke-width="${stroke}"/>
    ${segs.join('')}
    <text x="${cx}" y="${cy-6}" text-anchor="middle" font-size="18" font-weight="800" fill="var(--text-primary)">${total}</text>
    <text x="${cx}" y="${cy+14}" text-anchor="middle" font-size="10" fill="var(--text-muted)">unit</text>
  </svg>`;
}

// ══════════════════════════════════════════════════════════════
// SCREEN 2: DATABASE ALAT
// ══════════════════════════════════════════════════════════════
let alatFilters = { q:'', type:'', status:'', condition:'' };

function renderAlat() {
  const types    = [...new Set(DB.equipment.map(e=>e.jenis_alat))].sort();
  const statuses = ['Ready','In Transit','In Use','Under Maintenance','Broken','Scrapped'];
  const conds    = ['Baik','Perlu perbaikan','Rusak ringan','Rusak berat'];
  const canAdd   = ['Admin','Gudang','Manajemen'].includes(currentRole);

  $('#alat-content').innerHTML = `
    <div class="page-header">
      <div><h1 class="page-header__title">Database Mesin &amp; Alat</h1>
      <p class="page-header__subtitle">${DB.equipment.length} unit terdaftar</p></div>
      ${canAdd?`<div class="page-header__actions"><button class="btn btn--primary" id="btn-tambah-alat">➕ Tambah Alat</button></div>`:''}
    </div>
    <div class="filters">
      <div class="filters__search"><span>🔍</span><input type="search" id="alat-search" placeholder="Cari ID, nama, merk…" value="${esc(alatFilters.q)}" aria-label="Cari alat"></div>
      <select class="filters__select" id="alat-filter-type"><option value="">Semua Jenis</option>${types.map(t=>`<option value="${esc(t)}" ${alatFilters.type===t?'selected':''}>${esc(t)}</option>`).join('')}</select>
      <select class="filters__select" id="alat-filter-status"><option value="">Semua Status</option>${statuses.map(s=>`<option value="${esc(s)}" ${alatFilters.status===s?'selected':''}>${esc(s)}</option>`).join('')}</select>
      <select class="filters__select" id="alat-filter-cond"><option value="">Semua Kondisi</option>${conds.map(c=>`<option value="${esc(c)}" ${alatFilters.condition===c?'selected':''}>${esc(c)}</option>`).join('')}</select>
    </div>
    <div class="card"><div class="table-wrapper"><table class="table" id="alat-table" aria-label="Daftar alat">
      <thead><tr><th>ID Alat</th><th>Nama</th><th>Jenis</th><th>Merk/Tipe</th><th>No. Seri</th><th>Status</th><th>Kondisi</th><th>Lokasi</th><th>PIC</th><th>HM</th><th>Aksi</th></tr></thead>
      <tbody id="alat-tbody"></tbody>
    </table></div></div>`;

  renderAlatTable();
  $('#alat-search').addEventListener('input', function(){ alatFilters.q=this.value; renderAlatTable(); });
  $('#alat-filter-type').addEventListener('change', function(){ alatFilters.type=this.value; renderAlatTable(); });
  $('#alat-filter-status').addEventListener('change', function(){ alatFilters.status=this.value; renderAlatTable(); });
  $('#alat-filter-cond').addEventListener('change', function(){ alatFilters.condition=this.value; renderAlatTable(); });
  if (canAdd) $('#btn-tambah-alat')?.addEventListener('click', showTambahAlatModal);
}

function renderAlatTable() {
  const { q, type, status, condition } = alatFilters;
  const filtered = DB.equipment.filter(e => {
    const sq = q.toLowerCase();
    return (!q || e.id_alat.toLowerCase().includes(sq) || e.nama_alat.toLowerCase().includes(sq) || e.merk.toLowerCase().includes(sq) || e.no_seri.toLowerCase().includes(sq))
      && (!type || e.jenis_alat===type)
      && (!status || e.status===status)
      && (!condition || e.kondisi===condition);
  });
  const tbody = $('#alat-tbody');
  if (!filtered.length) {
    tbody.innerHTML=`<tr><td colspan="11"><div class="empty-state"><div class="empty-state__icon">🔍</div><p class="empty-state__title">Tidak ada data</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = filtered.map(e=>`<tr>
    <td><a href="#/alat/${e.id_alat}" class="u-mono u-fw-bold">${esc(e.id_alat)}</a></td>
    <td>${esc(e.nama_alat)}</td>
    <td><span class="badge badge--info">${esc(e.jenis_alat)}</span></td>
    <td>${esc(e.merk)} ${esc(e.tipe)}</td>
    <td class="u-mono u-small">${esc(e.no_seri)}</td>
    <td>${statusBadge(e.status)}</td>
    <td>${conditionBadge(e.kondisi)}</td>
    <td>${esc(locationLabel(e))}</td>
    <td>${esc(e.pic)}</td>
    <td>${fmt.format(e.hour_meter)} jam</td>
    <td>
      <a href="#/alat/${e.id_alat}" class="btn btn--sm btn--ghost">Detail</a>
      ${e.status!=='Scrapped' && ['Admin','Gudang','Manajemen'].includes(currentRole)
        ? `<button class="btn btn--sm btn--danger" onclick="hapusAlat('${e.id_alat}')">Scrap</button>` : ''}
    </td>
  </tr>`).join('');
}

async function hapusAlat(id) {
  const e = DB.equipment.find(x=>x.id_alat===id);
  if (!e) return;
  showConfirm(`Set status "${e.nama_alat}" menjadi Scrapped?`, async () => {
    const changes = { status:'Scrapped', kondisi:'Rusak berat', tanggal_dihapus: new Date().toISOString().slice(0,10) };
    const old = e.status;
    const done = await withFallback(
      () => DB_API.update('alat','id_alat',id, changes),
      () => { Object.assign(e, changes); },
      `Alat ${id} diset Scrapped`
    );
    if (done !== undefined) {
      if (done) Object.assign(e, done);
      showToast(`${id} diset Scrapped`,'warning');
      renderAlatTable();
    }
  },'Konfirmasi Scrap','Ya, Scrap',true);
}

function showTambahAlatModal() {
  const types=[...new Set(DB.equipment.map(e=>e.jenis_alat))].sort();
  const body=`<form id="form-tambah-alat">
    <div class="form-section"><div class="form-section__title">Informasi Dasar</div>
      <div class="form-row">
        <div class="form-group"><label class="form-label form-label--required" for="ta-name">Nama Alat</label><input class="form-control" id="ta-name" required></div>
        <div class="form-group"><label class="form-label form-label--required" for="ta-type">Jenis</label>
          <input class="form-control" id="ta-type" list="ta-type-list" required>
          <datalist id="ta-type-list">${types.map(t=>`<option value="${esc(t)}">`).join('')}</datalist>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label form-label--required" for="ta-merk">Merk</label><input class="form-control" id="ta-merk" required></div>
        <div class="form-group"><label class="form-label form-label--required" for="ta-tipe">Tipe</label><input class="form-control" id="ta-tipe" required></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label form-label--required" for="ta-serial">Nomor Seri</label>
          <input class="form-control" id="ta-serial" required>
          <div class="form-error u-hidden" id="ta-serial-err">Nomor seri sudah ada</div>
        </div>
        <div class="form-group"><label class="form-label" for="ta-bbm">Bahan Bakar</label>
          <select class="form-control" id="ta-bbm"><option>Solar</option><option>Bensin</option><option>Listrik</option><option>Baterai</option></select>
        </div>
      </div>
    </div>
    <div class="form-section"><div class="form-section__title">Legalitas</div>
      <div class="form-row">
        <div class="form-group"><label class="form-label form-label--required" for="ta-buydate">Tanggal Beli</label><input class="form-control" type="date" id="ta-buydate" required></div>
        <div class="form-group"><label class="form-label form-label--required" for="ta-price">Nilai Aset (Rp)</label><input class="form-control" type="number" id="ta-price" required min="0"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label" for="ta-warranty">Garansi s/d</label><input class="form-control" type="date" id="ta-warranty"></div>
        <div class="form-group"><label class="form-label" for="ta-own">Kepemilikan</label>
          <select class="form-control" id="ta-own"><option>Milik sendiri</option><option>Sewa</option></select>
        </div>
      </div>
    </div>
  </form>`;

  openModal('Tambah Alat Baru', body,
    `<button class="btn btn--secondary" onclick="closeModal()">Batal</button><button class="btn btn--primary" id="btn-save-alat">Simpan</button>`,'lg');

  $('#btn-save-alat').addEventListener('click', async () => {
    const serial = $('#ta-serial').value.trim();
    if (DB.equipment.find(e=>e.no_seri===serial)) {
      $('#ta-serial').classList.add('form-control--error');
      $('#ta-serial-err').classList.remove('u-hidden'); return;
    }
    const form = $('#form-tambah-alat');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const newId = 'NEW-' + Date.now().toString(36).toUpperCase();
    const row = {
      id_alat:newId, nama_alat:$('#ta-name').value.trim(),
      jenis_alat:$('#ta-type').value.trim(), merk:$('#ta-merk').value.trim(),
      tipe:$('#ta-tipe').value.trim(), no_seri:serial,
      status:'Ready', kondisi:'Baik', kode_gudang:'GDG-PST', kode_proyek:null,
      pic:currentUser.nama, hour_meter:0, bahan_bakar:$('#ta-bbm').value,
      kepemilikan:$('#ta-own').value, tanggal_beli:$('#ta-buydate').value,
      nilai_aset:Number($('#ta-price').value), garansi_sampai:$('#ta-warranty').value||null,
      spesifikasi:{}, tanggal_dihapus:null,
    };
    const saved = await withFallback(
      () => DB_API.insert('alat', row),
      () => DB.equipment.push(row),
      `Alat ${newId} berhasil ditambahkan`
    );
    if (saved !== undefined) {
      if (saved) { row.id_alat=saved.id_alat||newId; DB.equipment.push(saved); }
      closeModal(); showToast(`Alat berhasil ditambahkan`,'success'); renderAlat();
    }
  });
}

// ══════════════════════════════════════════════════════════════
// SCREEN 3: DETAIL ALAT
// ══════════════════════════════════════════════════════════════
async function renderAlatDetail(id) {
  $('#alat-detail-content').innerHTML = skeletonRows(2,4);
  let eq = DB.equipment.find(e=>e.id_alat===id);
  if (_isSupabase) {
    try { const r=await DB_API.get('alat','id_alat',id); if(r) { eq=r; const i=DB.equipment.findIndex(e=>e.id_alat===id); if(i>=0) DB.equipment[i]=r; else DB.equipment.push(r); } } catch {}
  }
  if (!eq) { $('#alat-detail-content').innerHTML=`<div class="alert alert--critical"><span class="alert__icon">❌</span><div>Alat ${esc(id)} tidak ditemukan.</div></div>`; return; }

  const muts = DB.mobilizations.filter(m=>m.id_alat===id);
  const wos  = DB.workOrders.filter(w=>w.id_alat===id);

  $('#alat-detail-content').innerHTML = `
    <div class="page-header">
      <div>
        <a href="#/alat" class="btn btn--secondary btn--sm u-mb-2">← Kembali</a>
        <h1 class="page-header__title">${esc(eq.nama_alat)}</h1>
        <p class="page-header__subtitle">${esc(eq.id_alat)} · ${esc(eq.merk)} ${esc(eq.tipe)} · ${statusBadge(eq.status)} ${conditionBadge(eq.kondisi)}</p>
      </div>
      <button class="btn btn--ghost btn--sm" onclick="printQR('${eq.id_alat}')">🖨 Cetak QR Label</button>
    </div>
    <div class="tabs" role="tablist" id="detail-tabs">
      <button class="tab tab--active" data-tab="info">Info &amp; Spesifikasi</button>
      <button class="tab" data-tab="legal">Legalitas &amp; Finansial</button>
      <button class="tab" data-tab="mutasi">Riwayat Mutasi</button>
      <button class="tab" data-tab="maintenance">Riwayat Pemeliharaan</button>
      <button class="tab" data-tab="dokumen">Dokumen</button>
    </div>
    <div id="dtab-info" class="tab-panel tab-panel--active">
      <div class="card"><div class="card__body"><div class="form-row">
        <table class="table"><tbody>
          ${infoRow('ID Alat',eq.id_alat,'u-mono')} ${infoRow('Nama',eq.nama_alat)}
          ${infoRow('Jenis',eq.jenis_alat)} ${infoRow('Merk',eq.merk+' '+eq.tipe)}
          ${infoRow('No. Seri',eq.no_seri,'u-mono')} ${infoRow('Status',statusBadge(eq.status))}
          ${infoRow('Kondisi',conditionBadge(eq.kondisi))} ${infoRow('Lokasi',locationLabel(eq))}
          ${infoRow('PIC',eq.pic)} ${infoRow('Hour Meter',fmt.format(eq.hour_meter)+' jam')}
          ${infoRow('Kepemilikan',eq.kepemilikan)} ${infoRow('Bahan Bakar',eq.bahan_bakar||'—')}
          ${infoRow('Daya',eq.daya ? eq.daya+' '+eq.satuan_daya : '—')}
        </tbody></table>
        <div>${buildQR(eq.id_alat)}<div class="u-small u-color-muted u-mt-1">${esc(eq.id_alat)} · ${esc(eq.no_seri)}</div></div>
      </div></div></div>
    </div>
    <div id="dtab-legal" class="tab-panel">
      <div class="card"><div class="card__body"><table class="table"><tbody>
        ${infoRow('Tanggal Beli',fmtDate(eq.tanggal_beli))} ${infoRow('Nilai Aset',fmtRp(eq.nilai_aset))}
        ${infoRow('Garansi s/d', eq.garansi_sampai ? fmtDate(eq.garansi_sampai)+' '+isExpiredSoon(eq.garansi_sampai) : '—')}
        ${infoRow('Tahun Pembuatan',eq.tahun_pembuatan||'—')}
        ${infoRow('No. Pembelian',eq.no_pembelian||'—')}
        ${infoRow('Tanggal Dihapus',eq.tanggal_dihapus ? fmtDate(eq.tanggal_dihapus) : '—')}
      </tbody></table></div></div>
    </div>
    <div id="dtab-mutasi" class="tab-panel">
      <div class="card"><div class="card__body">
        ${muts.length===0
          ? '<div class="empty-state"><div class="empty-state__icon">🚛</div><p>Belum ada riwayat mutasi</p></div>'
          : `<div class="timeline">${muts.map(m=>`<div class="timeline__item">
              <div class="timeline__line"><div class="timeline__dot"></div><div class="timeline__connector"></div></div>
              <div class="timeline__content">
                <div class="timeline__title">${esc(m.no_mutasi)}: ${esc(whName(m.asal_gudang)||projectName(m.asal_proyek)||'—')} → ${esc(projectName(m.tujuan_proyek)||whName(m.tujuan_gudang)||'—')}</div>
                <div class="timeline__meta">${fmtDate(m.tanggal_keluar)} · ${statusBadge(m.tanggal_masuk?'Selesai':'In Transit')} · Driver: ${esc(m.driver||'—')}</div>
              </div>
            </div>`).join('')}</div>`}
      </div></div>
    </div>
    <div id="dtab-maintenance" class="tab-panel">
      <div class="card"><div class="card__body">
        ${wos.length===0
          ? '<div class="empty-state"><div class="empty-state__icon">🔧</div><p>Belum ada riwayat WO</p></div>'
          : `<div class="table-wrapper"><table class="table"><thead><tr><th>WO</th><th>Judul</th><th>Jenis</th><th>Status</th><th>Mulai</th><th>Selesai</th></tr></thead>
              <tbody>${wos.map(w=>`<tr>
                <td class="u-mono">${esc(w.no_wo)}</td><td>${esc(w.uraian)}</td>
                <td><span class="badge badge--info">${esc(w.jenis)}</span></td>
                <td>${statusBadge(w.status)}</td>
                <td>${fmtDate(w.waktu_mulai)}</td><td>${fmtDate(w.waktu_selesai)}</td>
              </tr>`).join('')}</tbody></table></div>`}
      </div></div>
    </div>
    <div id="dtab-dokumen" class="tab-panel">
      <div class="card"><div class="card__body"><div class="empty-state">
        <div class="empty-state__icon">📄</div><div class="empty-state__title">Dokumen</div>
        <button class="btn btn--secondary u-mt-1" onclick="showToast('Fitur upload tersedia di produksi','info')">📤 Upload</button>
      </div></div></div>
    </div>`;

  $$('.tab', $('#alat-detail-content')).forEach(tab=>{
    tab.addEventListener('click', ()=>{
      $$('.tab', $('#alat-detail-content')).forEach(t=>{t.classList.remove('tab--active');t.setAttribute('aria-selected','false');});
      $$('.tab-panel', $('#alat-detail-content')).forEach(p=>p.classList.remove('tab-panel--active'));
      tab.classList.add('tab--active'); tab.setAttribute('aria-selected','true');
      $(`#dtab-${tab.dataset.tab}`)?.classList.add('tab-panel--active');
    });
  });
}

function infoRow(label, value, cls='') {
  return `<tr><td class="u-fw-bold u-color-muted u-small" style="width:140px">${esc(label)}</td><td class="${cls}">${value}</td></tr>`;
}
function isExpiredSoon(ds) {
  if (!ds) return '';
  const diff=(new Date(ds)-new Date())/(864e5);
  if (diff<0) return `<span class="badge badge--broken">KADALUARSA</span>`;
  if (diff<60) return `<span class="badge badge--warning">Hampir Habis</span>`;
  return '';
}
function buildQR(id) {
  const cell=8, size=14, total=size*cell;
  const pat=[[1,1,1,1,1,1,1],[1,0,0,0,0,0,1],[1,0,1,1,1,0,1],[1,0,1,1,1,0,1],[1,0,1,1,1,0,1],[1,0,0,0,0,0,1],[1,1,1,1,1,1,1]];
  const rects=[];
  for(let r=0;r<7;r++) for(let c=0;c<7;c++) if(pat[r][c]) rects.push(`<rect x="${c*cell}" y="${r*cell}" width="${cell}" height="${cell}" fill="var(--primary-dark)"/>`);
  const hash=id.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
  for(let r=0;r<size;r++) for(let c=7;c<size;c++) if((hash+r*size+c)%3===0) rects.push(`<rect x="${c*cell}" y="${r*cell}" width="${cell}" height="${cell}" fill="var(--primary-dark)"/>`);
  for(let r=7;r<size;r++) for(let c=0;c<7;c++) if((hash+r*7+c)%2===0) rects.push(`<rect x="${c*cell}" y="${r*cell}" width="${cell}" height="${cell}" fill="var(--primary-dark)"/>`);
  return `<div class="qr-placeholder" aria-label="QR ${esc(id)}"><svg width="${total}" height="${total}" viewBox="0 0 ${total} ${total}"><rect width="${total}" height="${total}" fill="white"/>${rects.join('')}</svg></div>`;
}
function printQR(id) {
  const eq=DB.equipment.find(e=>e.id_alat===id);
  if(!eq) return;
  openModal('Cetak QR Label',`<div style="text-align:center;padding:var(--sp-2)"><b>PT GeoACE</b>${buildQR(id)}<div class="u-fw-bold">${esc(eq.id_alat)}</div><div>${esc(eq.nama_alat)}</div><div class="u-mono u-small">${esc(eq.no_seri)}</div><div style="margin-top:4px">${statusBadge(eq.status)}</div></div>`,
    `<button class="btn btn--primary" onclick="window.print()">🖨 Print</button><button class="btn btn--secondary" onclick="closeModal()">Tutup</button>`,'sm');
}

// ══════════════════════════════════════════════════════════════
// SCREEN 4: KEBUTUHAN & MOBILISASI
// ══════════════════════════════════════════════════════════════
let mobActiveTab = 'list';

function renderMobilisasi() {
  $('#mobilisasi-content').innerHTML = `
    <div class="page-header">
      <div><h1 class="page-header__title">Kebutuhan &amp; Mobilisasi</h1>
      <p class="page-header__subtitle">Permintaan, check-out, check-in alat ke proyek</p></div>
      <div class="page-header__actions">
        ${['PM Site','Manajemen','Admin'].includes(currentRole) ? `<button class="btn btn--primary" id="btn-new-mob">➕ Buat Permintaan</button>` : ''}
      </div>
    </div>
    <div class="tabs" role="tablist">
      <button class="tab ${mobActiveTab==='list'?'tab--active':''}" data-tab="list">Daftar</button>
      <button class="tab ${mobActiveTab==='stepper'?'tab--active':''}" data-tab="stepper">Proses</button>
      <button class="tab ${mobActiveTab==='sj'?'tab--active':''}" data-tab="sj">Surat Jalan</button>
    </div>
    <div id="mob-tab-content"></div>`;

  $$('#mobilisasi-content .tab').forEach(tab=>{
    tab.addEventListener('click', ()=>{
      $$('#mobilisasi-content .tab').forEach(t=>{t.classList.remove('tab--active');t.setAttribute('aria-selected','false');});
      tab.classList.add('tab--active'); tab.setAttribute('aria-selected','true');
      mobActiveTab=tab.dataset.tab; renderMobTabContent();
    });
  });
  $('#btn-new-mob')?.addEventListener('click', showNewMobModal);
  renderMobTabContent();
}

function renderMobTabContent() {
  const el=$('#mob-tab-content');
  if (mobActiveTab==='list')    { el.innerHTML=buildMobList(); }
  if (mobActiveTab==='stepper') { renderMobStepper(el); }
  if (mobActiveTab==='sj')      { el.innerHTML=buildSuratJalan(); }
}

function buildMobList() {
  return `<div class="card"><div class="table-wrapper"><table class="table" aria-label="Daftar mutasi">
    <thead><tr><th>No. Mutasi</th><th>Alat</th><th>Dari</th><th>Ke</th><th>Keluar</th><th>Masuk</th><th>Driver</th><th>Status</th><th>Aksi</th></tr></thead>
    <tbody>
    ${DB.mobilizations.map(m=>{
      const eq=DB.equipment.find(e=>e.id_alat===m.id_alat);
      const statusM = m.tanggal_masuk ? 'Selesai' : m.tanggal_keluar ? 'In Transit' : 'Baru';
      return `<tr>
        <td class="u-mono u-fw-bold">${esc(m.no_mutasi)}</td>
        <td><a href="#/alat/${m.id_alat}">${esc(eq?.nama_alat||m.id_alat)}</a></td>
        <td>${esc(whName(m.asal_gudang)||projectName(m.asal_proyek))}</td>
        <td>${esc(projectName(m.tujuan_proyek)||whName(m.tujuan_gudang))}</td>
        <td>${fmtDate(m.tanggal_keluar)}</td>
        <td>${fmtDate(m.tanggal_masuk)}</td>
        <td>${esc(m.driver||'—')}</td>
        <td>${statusBadge(statusM)}</td>
        <td>
          ${!m.tanggal_keluar && ['Gudang','Admin','Manajemen'].includes(currentRole)
            ? `<button class="btn btn--sm btn--teal" onclick="startCheckout('${m.no_mutasi}')">Check-out</button>` : ''}
          ${m.tanggal_keluar && !m.tanggal_masuk && ['Admin','Manajemen','PM Site','Gudang'].includes(currentRole)
            ? `<button class="btn btn--sm btn--primary" onclick="startCheckin('${m.no_mutasi}')">Check-in</button>` : ''}
        </td>
      </tr>`;
    }).join('')}
    </tbody>
  </table></div></div>`;
}

async function startCheckout(noMutasi) {
  const m  = DB.mobilizations.find(x=>x.no_mutasi===noMutasi);
  const eq = m ? DB.equipment.find(e=>e.id_alat===m.id_alat) : null;
  if (!m||!eq) return;

  let qrScanned=false, photoUploaded=false, photoFile=null, signed=false;

  const body = `
    ${buildStepperHTML(2,5,['Permintaan','Check-out','Transit','Check-in','Selesai'])}
    <div class="alert alert--info"><span class="alert__icon">ℹ️</span><div><div class="alert__title">Check-out: ${esc(eq.nama_alat)} (${esc(m.no_mutasi)})</div><div class="alert__msg">Lengkapi semua gate sebelum konfirmasi</div></div></div>
    <form id="form-checkout">
      <div class="form-section"><div class="form-section__title">1. Scan QR</div>
        <div class="u-flex u-gap-1" style="align-items:center">${buildQR(eq.id_alat)}
          <div><button type="button" class="btn btn--teal" id="btn-scan-qr">📷 Simulasi Scan QR</button><div id="scan-result" class="form-hint u-mt-1"></div></div>
        </div>
      </div>
      <div class="form-section"><div class="form-section__title">2. Checklist Kondisi</div>
        <label style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="chk-oli"> Oli dalam kondisi baik</label>
        <label style="display:flex;align-items:center;gap:8px;margin-top:6px"><input type="checkbox" id="chk-hyd"> Hidrolik dalam kondisi baik</label>
        <label style="display:flex;align-items:center;gap:8px;margin-top:6px"><input type="checkbox" id="chk-acc"> Aksesoris lengkap</label>
      </div>
      <div class="form-section"><div class="form-section__title">3. Hour Meter &amp; Driver</div>
        <div class="form-row">
          <div class="form-group"><label class="form-label form-label--required" for="co-hm">Hour Meter Keluar</label><input class="form-control" type="number" id="co-hm" value="${eq.hour_meter||0}" required></div>
          <div class="form-group"><label class="form-label form-label--required" for="co-cond">Kondisi Kirim</label>
            <select class="form-control" id="co-cond"><option>Baik</option><option>Perlu perbaikan</option><option>Rusak ringan</option><option>Rusak berat</option></select>
          </div>
        </div>
        <div class="form-group u-mt-1"><label class="form-label form-label--required" for="co-driver">Driver</label><input class="form-control" id="co-driver" value="${esc(m.driver||'')}" required></div>
      </div>
      <div class="form-section"><div class="form-section__title">4. Foto Kondisi</div>
        <input type="file" id="co-photo" accept="image/*" aria-label="Upload foto kondisi alat">
        <button type="button" class="btn btn--secondary u-mt-1" onclick="$('#co-photo').click()">📸 Pilih Foto</button>
        <div id="photo-name" class="form-hint u-mt-1"></div>
      </div>
      <div class="form-section"><div class="form-section__title">5. Tanda Tangan Driver</div>
        <canvas class="signature-pad" id="sig-canvas" width="400" height="100" aria-label="Area tanda tangan"></canvas>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button type="button" class="btn btn--secondary btn--sm" id="btn-clear-sig">Hapus</button>
          <span class="form-hint" id="sig-hint">Gambar tanda tangan di area abu-abu</span>
        </div>
      </div>
    </form>`;

  openModal('Check-out Gudang', body,
    `<button class="btn btn--secondary" onclick="closeModal()">Batal</button><button class="btn btn--primary" id="btn-confirm-checkout">Konfirmasi Check-out</button>`,'lg');

  $('#btn-scan-qr').addEventListener('click', ()=>{
    qrScanned=true;
    $('#btn-scan-qr').textContent='✅ QR Terverifikasi';
    $('#btn-scan-qr').classList.replace('btn--teal','btn--success');
    $('#scan-result').textContent=`QR ${eq.id_alat} OK — ${new Date().toLocaleTimeString('id-ID')}`;
  });
  $('#co-photo').addEventListener('change', function(){
    if (this.files[0]) { photoFile=this.files[0]; photoUploaded=true; $('#photo-name').textContent=this.files[0].name; }
  });

  const canvas=$('#sig-canvas'), ctx=canvas.getContext('2d'); let drawing=false;
  canvas.addEventListener('mousedown',e=>{drawing=true;ctx.beginPath();ctx.moveTo(e.offsetX,e.offsetY);signed=false;});
  canvas.addEventListener('mousemove',e=>{if(!drawing)return;ctx.lineTo(e.offsetX,e.offsetY);ctx.stroke();signed=true;});
  canvas.addEventListener('mouseup',()=>{drawing=false;if(signed){canvas.classList.add('signature-pad--signed');$('#sig-hint').textContent='✅ Tanda tangan terekam';}});
  canvas.addEventListener('touchstart',e=>{e.preventDefault();drawing=true;const r=canvas.getBoundingClientRect();ctx.beginPath();ctx.moveTo(e.touches[0].clientX-r.left,e.touches[0].clientY-r.top);});
  canvas.addEventListener('touchmove',e=>{e.preventDefault();if(!drawing)return;const r=canvas.getBoundingClientRect();ctx.lineTo(e.touches[0].clientX-r.left,e.touches[0].clientY-r.top);ctx.stroke();signed=true;});
  canvas.addEventListener('touchend',()=>{drawing=false;if(signed)canvas.classList.add('signature-pad--signed');});
  $('#btn-clear-sig').addEventListener('click',()=>{ctx.clearRect(0,0,canvas.width,canvas.height);signed=false;canvas.classList.remove('signature-pad--signed');$('#sig-hint').textContent='Gambar tanda tangan di area abu-abu';});

  $('#btn-confirm-checkout').addEventListener('click', async ()=>{
    if (!qrScanned)    { showToast('Scan QR terlebih dahulu','error'); return; }
    if (!$('#chk-oli').checked||!$('#chk-hyd').checked||!$('#chk-acc').checked) { showToast('Checklist belum lengkap','error'); return; }
    if (!$('#co-hm').value)     { showToast('Isi Hour Meter','error'); return; }
    if (!$('#co-driver').value) { showToast('Isi nama driver','error'); return; }
    if (!photoUploaded)         { showToast('Upload foto kondisi','error'); return; }
    if (!signed)                { showToast('Tanda tangan driver diperlukan','error'); return; }

    setBusy(true);
    let fotoUrl='offline-foto', ttdUrl='offline-ttd';
    if (_isSupabase) {
      try {
        if (photoFile) fotoUrl = await DB_API.uploadFile('foto', photoFile);
        const sigBlob = await new Promise(res=>canvas.toBlob(res,'image/png'));
        ttdUrl = await DB_API.uploadFile('ttd', new File([sigBlob],'sig.png',{type:'image/png'}));
      } catch (e) {
        // offline — simpan data-URL
        fotoUrl='placeholder-foto'; ttdUrl='placeholder-ttd';
        DB_API.enqueuePhoto('foto', photoFile?URL.createObjectURL(photoFile):'', 'placeholder-foto');
        DB_API.enqueuePhoto('ttd', canvas.toDataURL(), 'placeholder-ttd');
      }
    }

    const changes = {
      qr_discan_keluar: true,
      checklist_keluar: {oli:$('#chk-oli').checked, hidrolik:$('#chk-hyd').checked, aksesoris:$('#chk-acc').checked},
      hour_meter_keluar: Number($('#co-hm').value),
      kondisi_kirim: $('#co-cond').value,
      foto_keluar_url: fotoUrl, ttd_driver_url: ttdUrl,
      driver: $('#co-driver').value,
      tanggal_keluar: new Date().toISOString(),
    };
    setBusy(false);

    const saved = await withFallback(
      () => DB_API.update('mutasi_alat','no_mutasi',noMutasi, changes),
      () => {
        Object.assign(m, changes);
        const eqLocal=DB.equipment.find(e=>e.id_alat===m.id_alat);
        if (eqLocal) { eqLocal.status='In Transit'; eqLocal.kode_proyek=null; eqLocal.kode_gudang=null; }
        GeoACE.saveState(DB);
      },
      `Check-out ${noMutasi}`
    );

    if (saved!==undefined) {
      if (saved) { Object.assign(m, saved); const fr=DB.equipment.find(e=>e.id_alat===m.id_alat); if(fr) fr.status='In Transit'; }
      closeModal(); showToast(`${noMutasi} check-out berhasil — status In Transit`,'success'); renderMobTabContent();
    }
  });
}

async function startCheckin(noMutasi) {
  const m  = DB.mobilizations.find(x=>x.no_mutasi===noMutasi);
  const eq = m ? DB.equipment.find(e=>e.id_alat===m.id_alat) : null;
  if (!m||!eq) return;

  const body=`
    ${buildStepperHTML(4,5,['Permintaan','Check-out','Transit','Check-in','Selesai'])}
    <div class="alert alert--info"><span class="alert__icon">ℹ️</span><div>
      <div class="alert__title">Check-in: ${esc(eq.nama_alat)}</div>
      <div class="alert__msg">Kondisi dikirim: ${conditionBadge(m.kondisi_kirim||'Baik')}</div>
    </div></div>
    <form id="form-checkin">
      <div class="form-section"><div class="form-section__title">Scan QR Masuk</div>
        <button type="button" class="btn btn--teal" id="btn-scan-qr-in">📷 Simulasi Scan QR</button>
        <div id="scan-result-in" class="form-hint u-mt-1"></div>
      </div>
      <div class="form-section"><div class="form-section__title">Kondisi Tiba</div>
        <div class="form-group"><label class="form-label form-label--required" for="ci-cond">Kondisi Saat Tiba</label>
          <select class="form-control" id="ci-cond" required><option>Baik</option><option>Perlu perbaikan</option><option>Rusak ringan</option><option>Rusak berat</option></select>
        </div>
        <div id="discrepancy-block" class="u-hidden u-mt-1">
          <div class="alert alert--warning"><span class="alert__icon">⚠️</span><div class="alert__msg">Kondisi berbeda — wajib isi catatan.</div></div>
          <div class="form-group u-mt-1"><label class="form-label form-label--required" for="ci-note">Discrepancy Note</label>
            <textarea class="form-control" id="ci-note" rows="3"></textarea>
          </div>
        </div>
      </div>
      <div class="form-section"><div class="form-section__title">Hour Meter &amp; Running Test</div>
        <div class="form-row">
          <div class="form-group"><label class="form-label form-label--required" for="ci-hm">Hour Meter Masuk</label><input class="form-control" type="number" id="ci-hm" value="${m.hour_meter_keluar||eq.hour_meter||0}" required></div>
          <div class="form-group"><label class="form-label" for="ci-penerima">Penerima</label><input class="form-control" id="ci-penerima" value="${esc(currentUser.nama)}"></div>
        </div>
        <label style="display:flex;align-items:center;gap:8px;margin-top:8px"><input type="checkbox" id="ci-running"> Alat running test OK</label>
      </div>
      <div class="form-section"><div class="form-section__title">Foto Masuk</div>
        <input type="file" id="ci-photo" accept="image/*" aria-label="Upload foto masuk">
        <button type="button" class="btn btn--secondary u-mt-1" onclick="$('#ci-photo').click()">📸 Foto</button>
        <div id="ci-photo-name" class="form-hint u-mt-1"></div>
      </div>
    </form>`;

  openModal('Check-in Site', body,
    `<button class="btn btn--secondary" onclick="closeModal()">Batal</button><button class="btn btn--primary" id="btn-confirm-checkin">Konfirmasi Check-in</button>`,'lg');

  let qrIn=false, photoIn=null;
  $('#btn-scan-qr-in').addEventListener('click',()=>{
    qrIn=true; $('#btn-scan-qr-in').textContent='✅ QR OK';
    $('#scan-result-in').textContent=`QR ${eq.id_alat} OK`;
  });
  $('#ci-cond').addEventListener('change', function(){
    const diff=this.value!==(m.kondisi_kirim||'Baik');
    $('#discrepancy-block').classList.toggle('u-hidden',!diff);
  });
  $('#ci-photo').addEventListener('change', function(){
    if(this.files[0]) { photoIn=this.files[0]; $('#ci-photo-name').textContent=this.files[0].name; }
  });

  $('#btn-confirm-checkin').addEventListener('click', async ()=>{
    if (!qrIn) { showToast('Scan QR terlebih dahulu','error'); return; }
    const cond = $('#ci-cond').value;
    const diff = cond!==(m.kondisi_kirim||'Baik');
    if (diff && !$('#ci-note').value.trim()) { showToast('Isi discrepancy note','error'); return; }
    if (!$('#ci-hm').value) { showToast('Isi Hour Meter Masuk','error'); return; }
    if ($('#ci-running').checked==null) { showToast('Isi running test','error'); return; }

    setBusy(true);
    let fotoMasukUrl='offline-foto';
    if (_isSupabase && photoIn) {
      try { fotoMasukUrl=await DB_API.uploadFile('foto',photoIn); } catch { fotoMasukUrl='offline-foto'; }
    }
    setBusy(false);

    const changes = {
      qr_discan_masuk: true,
      hour_meter_masuk: Number($('#ci-hm').value),
      kondisi_tiba: cond,
      running_test_ok: $('#ci-running').checked,
      discrepancy_note: $('#ci-note')?.value||null,
      penerima: $('#ci-penerima').value,
      foto_masuk_url: fotoMasukUrl,
      tanggal_masuk: new Date().toISOString(),
    };

    const newStatus = !$('#ci-running').checked ? 'Broken' : m.tujuan_proyek ? 'In Use' : 'Ready';

    await withFallback(
      () => DB_API.update('mutasi_alat','no_mutasi',noMutasi, changes),
      () => {
        Object.assign(m, changes);
        const eqLocal=DB.equipment.find(e=>e.id_alat===m.id_alat);
        if (eqLocal) {
          eqLocal.status=newStatus; eqLocal.kondisi=cond;
          eqLocal.kode_proyek=m.tujuan_proyek||null;
          eqLocal.kode_gudang=m.tujuan_gudang||null;
          eqLocal.hour_meter=Number($('#ci-hm').value);
        }
        GeoACE.saveState(DB);
      },
      `Check-in ${noMutasi}`
    );

    // Re-fetch alat dari Supabase agar status sinkron (trigger DB)
    if (_isSupabase) {
      try { const r=await DB_API.get('alat','id_alat',m.id_alat); if(r) { const i=DB.equipment.findIndex(e=>e.id_alat===r.id_alat); if(i>=0) DB.equipment[i]=r; } } catch {}
    }

    closeModal(); showToast(`${noMutasi} check-in berhasil`,'success'); renderMobTabContent();
  });
}

function buildStepperHTML(active, total, labels) {
  return `<div class="stepper" aria-label="Langkah proses">${labels.map((lbl,i)=>{
    const step=i+1, cls=step<active?'stepper__step--done':step===active?'stepper__step--active':'';
    return `<div class="stepper__step ${cls}"><div class="stepper__circle">${step<active?'✓':step}</div><div class="stepper__label">${esc(lbl)}</div></div>`;
  }).join('')}</div>`;
}

function renderMobStepper(el) {
  const activeMob=DB.mobilizations.find(m=>m.tanggal_keluar&&!m.tanggal_masuk);
  if (!activeMob) { el.innerHTML=`<div class="alert alert--info"><span class="alert__icon">ℹ️</span><div>Tidak ada mobilisasi In Transit.</div></div>`; return; }
  const eq=DB.equipment.find(e=>e.id_alat===activeMob.id_alat);
  el.innerHTML=`<div class="card"><div class="card__body">
    ${buildStepperHTML(3,5,['Permintaan','Check-out','Transit','Check-in','Selesai'])}
    <div class="alert alert--info u-mt-2"><span class="alert__icon">🚛</span><div>
      <div class="alert__title">${esc(activeMob.no_mutasi)}: ${esc(eq?.nama_alat||activeMob.id_alat)}</div>
      <div class="alert__msg">${esc(whName(activeMob.asal_gudang)||projectName(activeMob.asal_proyek))} → ${esc(projectName(activeMob.tujuan_proyek)||whName(activeMob.tujuan_gudang))}<br>Driver: ${esc(activeMob.driver||'—')} · Keluar: ${fmtDate(activeMob.tanggal_keluar)}</div>
    </div></div>
  </div></div>`;
}

function buildSuratJalan() {
  const mob=DB.mobilizations.find(m=>m.tanggal_keluar);
  if (!mob) return '<div class="alert alert--info"><span class="alert__icon">ℹ️</span><div>Tidak ada surat jalan.</div></div>';
  const eq=DB.equipment.find(e=>e.id_alat===mob.id_alat);
  return `<div class="surat-jalan">
    <div class="surat-jalan__header">
      <div class="surat-jalan__logo-block"><h2>PT GeoACE</h2><p>Logistic &amp; Machinery Management</p></div>
      <div class="surat-jalan__no"><div style="font-size:18px;font-weight:800">SURAT JALAN</div><div>${esc(mob.no_surat_jalan||mob.no_mutasi)}</div><div style="font-size:11px;color:var(--text-muted)">Tgl: ${fmtDate(mob.tanggal_keluar)}</div></div>
    </div>
    <table class="table" style="margin:var(--sp-2) 0"><tbody>
      ${infoRow('Alat',`${mob.id_alat} — ${eq?.nama_alat||''}`)}
      ${infoRow('Dari',whName(mob.asal_gudang)||projectName(mob.asal_proyek))}
      ${infoRow('Ke',projectName(mob.tujuan_proyek)||whName(mob.tujuan_gudang))}
      ${infoRow('Driver',mob.driver||'—')}
      ${infoRow('Kendaraan',mob.kendaraan||'—')}
      ${infoRow('HM Keluar',mob.hour_meter_keluar?fmt.format(mob.hour_meter_keluar)+' jam':'—')}
      ${infoRow('Kondisi Kirim',conditionBadge(mob.kondisi_kirim||'—'))}
    </tbody></table>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-2);margin-top:var(--sp-3)">
      <div style="text-align:center;border-top:1px solid var(--border);padding-top:8px"><div class="u-small u-color-muted">Dikirim oleh</div><div style="font-weight:600;margin-top:32px">Staf Gudang</div></div>
      <div style="text-align:center;border-top:1px solid var(--border);padding-top:8px"><div class="u-small u-color-muted">Diterima oleh</div><div style="font-weight:600;margin-top:32px">Site Receiver</div></div>
    </div>
  </div>
  <button class="btn btn--primary u-mt-2" onclick="window.print()">🖨 Print</button>`;
}

function showNewMobModal() {
  const readyEq=DB.equipment.filter(e=>e.status==='Ready');
  if (!readyEq.length) { showToast('Tidak ada alat Ready','warning'); return; }
  const body=`<form id="form-new-mob">
    <div class="alert alert--info"><span class="alert__icon">ℹ️</span><div class="alert__msg">Hanya alat berstatus <strong>Ready</strong> yang bisa dimobilisasi.</div></div>
    <div class="form-section u-mt-1"><div class="form-row">
      <div class="form-group"><label class="form-label form-label--required" for="nm-alat">Pilih Alat</label>
        <select class="form-control" id="nm-alat" required><option value="">— Pilih alat —</option>
          ${readyEq.map(e=>`<option value="${e.id_alat}">${esc(e.id_alat)} — ${esc(e.nama_alat)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label form-label--required" for="nm-to">Tujuan Proyek</label>
        <select class="form-control" id="nm-to" required><option value="">— Pilih proyek —</option>
          ${DB.projects.map(p=>`<option value="${p.kode_proyek}">${esc(p.nama_proyek)}</option>`).join('')}
        </select>
      </div>
    </div></div>
  </form>`;
  openModal('Buat Mutasi Baru', body, `<button class="btn btn--secondary" onclick="closeModal()">Batal</button><button class="btn btn--primary" id="btn-save-mob">Buat</button>`,'lg');

  $('#btn-save-mob').addEventListener('click', async ()=>{
    const idAlat=$('#nm-alat').value, tujPrj=$('#nm-to').value;
    if (!idAlat||!tujPrj) { showToast('Lengkapi semua field','error'); return; }
    const eqObj=DB.equipment.find(e=>e.id_alat===idAlat);
    if (eqObj?.status!=='Ready') { showToast('Alat tidak berstatus Ready','error'); return; }

    const noMutasi=uid('MUT');
    const row = {
      no_mutasi:noMutasi, id_alat:idAlat, jenis:'Mobilisasi',
      asal_gudang:eqObj.kode_gudang||null, asal_proyek:eqObj.kode_proyek||null,
      tujuan_proyek:tujPrj, tujuan_gudang:null,
      no_surat_jalan:'SJ-'+noMutasi, driver:null, kendaraan:null,
      tanggal_keluar:null, qr_discan_keluar:false, checklist_keluar:null,
      hour_meter_keluar:null, kondisi_kirim:null, foto_keluar_url:null, ttd_driver_url:null,
      tanggal_masuk:null, qr_discan_masuk:false, hour_meter_masuk:null,
      kondisi_tiba:null, running_test_ok:null, foto_masuk_url:null,
      penerima:null, discrepancy_note:null,
    };
    await withFallback(
      () => DB_API.insert('mutasi_alat', row),
      () => { DB.mobilizations.push(row); GeoACE.saveState(DB); },
      `Mutasi ${noMutasi} dibuat`
    );
    closeModal(); showToast(`Mutasi ${noMutasi} berhasil dibuat`,'success'); renderMobTabContent();
  });
}

// ══════════════════════════════════════════════════════════════
// SCREEN 5: PEMELIHARAAN
// ══════════════════════════════════════════════════════════════
let mtnActiveTab = 'kanban';

function renderMaintenance() {
  $('#maintenance-content').innerHTML=`
    <div class="page-header">
      <div><h1 class="page-header__title">Pemeliharaan</h1><p class="page-header__subtitle">Work order, laporan kerusakan, jadwal PM</p></div>
      <div class="page-header__actions">
        ${['Mekanik','Gudang','Admin','Manajemen','PM Site'].includes(currentRole) ? `<button class="btn btn--danger" id="btn-new-lk">⚠ Lapor Kerusakan</button>` : ''}
        ${['Mekanik','Admin','Manajemen'].includes(currentRole) ? `<button class="btn btn--teal" id="btn-new-wo">🔧 Buat WO</button>` : ''}
      </div>
    </div>
    <div class="tabs" role="tablist">
      <button class="tab ${mtnActiveTab==='kanban'?'tab--active':''}" data-tab="kanban">Kanban WO</button>
      <button class="tab ${mtnActiveTab==='damage'?'tab--active':''}" data-tab="damage">Laporan Kerusakan</button>
      <button class="tab ${mtnActiveTab==='schedule'?'tab--active':''}" data-tab="schedule">Jadwal PM</button>
    </div>
    <div id="mtn-tab-content"></div>`;

  $$('#maintenance-content .tab').forEach(tab=>{
    tab.addEventListener('click',()=>{
      $$('#maintenance-content .tab').forEach(t=>{t.classList.remove('tab--active');t.setAttribute('aria-selected','false');});
      tab.classList.add('tab--active'); tab.setAttribute('aria-selected','true');
      mtnActiveTab=tab.dataset.tab; renderMtnTabContent();
    });
  });
  $('#btn-new-lk')?.addEventListener('click', showDamageReportModal);
  $('#btn-new-wo')?.addEventListener('click', showCreateWOModal);
  renderMtnTabContent();
}

function renderMtnTabContent() {
  const el=$('#mtn-tab-content');
  if (mtnActiveTab==='kanban')   renderKanban(el);
  if (mtnActiveTab==='damage')   el.innerHTML=buildDamageList();
  if (mtnActiveTab==='schedule') el.innerHTML=buildPMSchedule();
}

function renderKanban(el) {
  const cols=[
    {id:'Open',label:'Open',color:'var(--teal)'},
    {id:'In Progress',label:'In Progress',color:'var(--accent-amber)'},
    {id:'Menunggu Verifikasi',label:'Menunggu Verifikasi',color:'var(--slate)'},
    {id:'Selesai',label:'Selesai',color:'var(--green)'},
  ];
  el.innerHTML=`<div class="kanban">${cols.map(col=>{
    const wos=DB.workOrders.filter(w=>w.status===col.id);
    return `<div class="kanban__col">
      <div class="kanban__col-header" style="border-left:3px solid ${col.color}"><span>${esc(col.label)}</span><span class="badge badge--info">${wos.length}</span></div>
      <div class="kanban__col-body">
        ${wos.length===0?'<div class="u-color-muted u-small u-text-center" style="padding:8px">Kosong</div>':''}
        ${wos.map(w=>{const eq=DB.equipment.find(e=>e.id_alat===w.id_alat);return `<div class="kanban__card" onclick="openWODetail('${w.no_wo}')" tabindex="0" role="button">
          <div class="kanban__card-title">${esc(w.no_wo)}</div>
          <div class="kanban__card-meta">${esc(eq?.nama_alat||w.id_alat)}</div>
          <div style="margin-top:4px">${statusBadge(w.jenis)}</div>
          <div class="u-small u-color-muted u-mt-1">Mekanik: ${esc(w.mekanik||'—')}</div>
        </div>`;}).join('')}
      </div>
    </div>`;
  }).join('')}</div>`;
}

function openWODetail(noWO) {
  const w=DB.workOrders.find(x=>x.no_wo===noWO); if(!w) return;
  const eq=DB.equipment.find(e=>e.id_alat===w.id_alat);
  const canVerify  = ['Manajemen','Gudang','Admin'].includes(currentRole) && w.status==='Menunggu Verifikasi';
  const canProgress= ['Mekanik','Admin'].includes(currentRole) && w.status==='Open';
  const canFinish  = ['Mekanik','Admin'].includes(currentRole) && w.status==='In Progress';

  openModal(`Work Order: ${noWO}`,`
    <table class="table"><tbody>
      ${infoRow('No. WO',w.no_wo,'u-mono')} ${infoRow('Alat',`<a href="#/alat/${w.id_alat}">${esc(eq?.nama_alat||w.id_alat)}</a>`)}
      ${infoRow('Jenis',w.jenis)} ${infoRow('Status',statusBadge(w.status))}
      ${infoRow('Mekanik',w.mekanik||'—')} ${infoRow('Bengkel',w.bengkel)}
      ${infoRow('Mulai',fmtDate(w.waktu_mulai))} ${infoRow('Selesai',fmtDate(w.waktu_selesai))}
      ${infoRow('Dicheck',w.dicheck_oleh||'—')} ${infoRow('Kondisi Akhir',w.kondisi_akhir?conditionBadge(w.kondisi_akhir):'—')}
      ${infoRow('Root Cause',w.root_cause||'—')} ${infoRow('Uraian',w.uraian)}
    </tbody></table>
    ${canVerify ? `<div class="form-section u-mt-1"><div class="form-section__title">Verifikasi WO</div>
      <div class="form-row">
        <div class="form-group"><label class="form-label form-label--required" for="v-dicheck">Dicheck oleh</label><input class="form-control" id="v-dicheck" value="${esc(currentUser.nama)}" required></div>
        <div class="form-group"><label class="form-label form-label--required" for="v-kondisi">Kondisi Akhir</label>
          <select class="form-control" id="v-kondisi"><option>Baik</option><option>Perlu perbaikan</option><option>Rusak ringan</option></select>
        </div>
      </div>
    </div>` : ''}`,
    `<button class="btn btn--secondary" onclick="closeModal()">Tutup</button>
     ${canProgress ? `<button class="btn btn--teal" onclick="updateWOStatus('${noWO}','In Progress')">Mulai Pengerjaan</button>` : ''}
     ${canFinish   ? `<button class="btn btn--primary" onclick="updateWOStatus('${noWO}','Menunggu Verifikasi')">Selesai — Minta Verifikasi</button>` : ''}
     ${canVerify   ? `<button class="btn btn--success" onclick="verifyWO('${noWO}')">✓ Verifikasi &amp; Tutup WO</button>` : ''}`, 'lg');
}

async function updateWOStatus(noWO, newStatus) {
  const w=DB.workOrders.find(x=>x.no_wo===noWO); if(!w) return;
  const changes = { status:newStatus };
  if (newStatus==='Menunggu Verifikasi') changes.waktu_selesai=new Date().toISOString();
  if (newStatus==='In Progress') changes.waktu_mulai=changes.waktu_mulai||new Date().toISOString();

  await withFallback(
    () => DB_API.update('work_order','no_wo',noWO, changes),
    () => {
      Object.assign(w, changes);
      if (newStatus==='In Progress') { const eq=DB.equipment.find(e=>e.id_alat===w.id_alat); if(eq&&eq.status!=='Under Maintenance') eq.status='Under Maintenance'; }
      GeoACE.saveState(DB);
    },
    `WO ${noWO} diupdate`
  );
  // Re-fetch alat
  if (_isSupabase) { try { const r=await DB_API.get('alat','id_alat',w.id_alat); if(r){const i=DB.equipment.findIndex(e=>e.id_alat===r.id_alat);if(i>=0)DB.equipment[i]=r;} } catch {} }
  closeModal(); showToast(`WO ${noWO} → ${newStatus}`,'success'); renderMtnTabContent();
}

async function verifyWO(noWO) {
  const w=DB.workOrders.find(x=>x.no_wo===noWO); if(!w) return;
  const dicheck=$('#v-dicheck')?.value||currentUser.nama;
  const kondisiAkhir=$('#v-kondisi')?.value||'Baik';
  if (!dicheck) { showToast('Isi "Dicheck oleh"','error'); return; }

  const changes = { status:'Selesai', dicheck_oleh:dicheck, kondisi_akhir:kondisiAkhir, waktu_selesai:w.waktu_selesai||new Date().toISOString() };
  await withFallback(
    () => DB_API.update('work_order','no_wo',noWO, changes),
    () => {
      Object.assign(w, changes);
      const eq=DB.equipment.find(e=>e.id_alat===w.id_alat);
      if (eq) { eq.status='Ready'; eq.kondisi=kondisiAkhir; }
      GeoACE.saveState(DB);
    },
    `WO ${noWO} diverifikasi`
  );
  if (_isSupabase) { try { const r=await DB_API.get('alat','id_alat',w.id_alat); if(r){const i=DB.equipment.findIndex(e=>e.id_alat===r.id_alat);if(i>=0)DB.equipment[i]=r;} } catch {} }
  closeModal(); showToast(`WO ${noWO} selesai — alat kembali Ready`,'success'); renderMtnTabContent();
}

function buildDamageList() {
  return `<div class="card"><div class="table-wrapper"><table class="table">
    <thead><tr><th>No.</th><th>Alat</th><th>Gejala</th><th>Urgensi</th><th>Tanggal</th><th>Status</th><th>WO</th></tr></thead>
    <tbody>${DB.damageReports.map(d=>{const eq=DB.equipment.find(e=>e.id_alat===d.id_alat);return `<tr>
      <td class="u-mono">${esc(d.no_laporan)}</td>
      <td><a href="#/alat/${d.id_alat}">${esc(eq?.nama_alat||d.id_alat)}</a></td>
      <td>${esc(d.gejala)}</td><td>${statusBadge(d.urgensi)}</td>
      <td>${fmtDate(d.tanggal)}</td><td>${statusBadge(d.status)}</td>
      <td>${d.no_wo?`<button class="btn btn--sm btn--ghost" onclick="openWODetail('${d.no_wo}')">${esc(d.no_wo)}</button>`:'—'}</td>
    </tr>`}).join('')}</tbody>
  </table></div></div>`;
}

function buildPMSchedule() {
  return `<div class="card"><div class="table-wrapper"><table class="table">
    <thead><tr><th>Alat</th><th>Servis</th><th>Basis</th><th>Interval</th><th>Terakhir</th><th>Jatuh Tempo</th></tr></thead>
    <tbody>${DB.preventiveSchedule.map(ps=>{const eq=DB.equipment.find(e=>e.id_alat===ps.id_alat);return `<tr>
      <td><a href="#/alat/${ps.id_alat}">${esc(eq?.nama_alat||ps.id_alat)}</a></td>
      <td>${esc(ps.nama_servis)}</td><td><span class="badge badge--info">${esc(ps.basis)}</span></td>
      <td>${ps.interval_hm?fmt.format(ps.interval_hm)+' jam':ps.interval_hari+' hari'}</td>
      <td>${fmtDate(ps.terakhir_tanggal)}</td><td>${fmtDate(ps.berikut_tanggal)||fmt.format(ps.berikut_hm)+' jam'}</td>
    </tr>`}).join('')}</tbody>
  </table></div></div>`;
}

function showDamageReportModal() {
  const body=`<form id="form-damage">
    <div class="form-row">
      <div class="form-group"><label class="form-label form-label--required" for="dr-alat">Alat</label>
        <select class="form-control" id="dr-alat" required><option value="">— Pilih alat —</option>
          ${DB.equipment.filter(e=>e.status!=='Scrapped').map(e=>`<option value="${e.id_alat}">${esc(e.id_alat)} — ${esc(e.nama_alat)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label form-label--required" for="dr-urgensi">Urgensi</label>
        <select class="form-control" id="dr-urgensi" required><option>Low</option><option>Medium</option><option>Critical</option></select>
      </div>
    </div>
    <div class="form-group u-mt-1"><label class="form-label form-label--required" for="dr-gejala">Gejala Kerusakan</label>
      <textarea class="form-control" id="dr-gejala" rows="3" required placeholder="Deskripsikan gejala…"></textarea>
    </div>
  </form>`;
  openModal('Laporan Kerusakan Baru', body,
    `<button class="btn btn--secondary" onclick="closeModal()">Batal</button><button class="btn btn--danger" id="btn-save-dr">Laporkan</button>`);

  $('#btn-save-dr').addEventListener('click', async ()=>{
    const form=$('#form-damage'); if(!form.checkValidity()){form.reportValidity();return;}
    const idAlat=$('#dr-alat').value, urgensi=$('#dr-urgensi').value;
    const noLaporan=uid('LK');
    const row={no_laporan:noLaporan, id_alat:idAlat, pelapor:currentUser.nama,
               gejala:$('#dr-gejala').value, urgensi, status:'Dilaporkan', tanggal:new Date().toISOString()};
    await withFallback(
      () => DB_API.insert('laporan_kerusakan', row),
      () => {
        DB.damageReports.push(row);
        if (urgensi==='Critical') { const eq=DB.equipment.find(e=>e.id_alat===idAlat); if(eq) { eq.status='Broken'; eq.kondisi='Rusak berat'; } }
        GeoACE.saveState(DB);
      },
      `Laporan ${noLaporan} dibuat`
    );
    if (_isSupabase) { try { const r=await DB_API.get('alat','id_alat',idAlat); if(r){const i=DB.equipment.findIndex(e=>e.id_alat===r.id_alat);if(i>=0)DB.equipment[i]=r;} } catch {} }
    closeModal(); showToast(`Laporan ${noLaporan} dibuat`,'success'); renderMtnTabContent();
  });
}

function showCreateWOModal() {
  const body=`<form id="form-wo">
    <div class="form-row">
      <div class="form-group"><label class="form-label form-label--required" for="wo-alat">Alat</label>
        <select class="form-control" id="wo-alat" required><option value="">—</option>
          ${DB.equipment.filter(e=>e.status!=='Scrapped').map(e=>`<option value="${e.id_alat}">${esc(e.id_alat)} — ${esc(e.nama_alat)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label form-label--required" for="wo-jenis">Jenis</label>
        <select class="form-control" id="wo-jenis" required><option>Preventif</option><option>Korektif</option><option>Overhaul</option><option>Inspeksi</option></select>
      </div>
    </div>
    <div class="form-group u-mt-1"><label class="form-label form-label--required" for="wo-uraian">Uraian Pekerjaan</label><input class="form-control" id="wo-uraian" required></div>
    <div class="form-row u-mt-1">
      <div class="form-group"><label class="form-label" for="wo-mekanik">Mekanik</label><input class="form-control" id="wo-mekanik" value="${esc(currentUser.nama)}"></div>
      <div class="form-group"><label class="form-label form-label--required" for="wo-bengkel">Bengkel</label><input class="form-control" id="wo-bengkel" value="Bengkel Pusat" required></div>
    </div>
  </form>`;
  openModal('Buat Work Order', body,
    `<button class="btn btn--secondary" onclick="closeModal()">Batal</button><button class="btn btn--primary" id="btn-save-wo">Buat WO</button>`);

  $('#btn-save-wo').addEventListener('click', async ()=>{
    const form=$('#form-wo'); if(!form.checkValidity()){form.reportValidity();return;}
    const noWO=uid('WO');
    const row={no_wo:noWO, id_alat:$('#wo-alat').value, jenis:$('#wo-jenis').value,
               uraian:$('#wo-uraian').value, bengkel:$('#wo-bengkel').value,
               mekanik:$('#wo-mekanik').value, pelaksana:'Mekanik internal',
               status:'Open', waktu_mulai:new Date().toISOString(),
               waktu_selesai:null, dicheck_oleh:null, kondisi_akhir:null, root_cause:null};
    await withFallback(
      () => DB_API.insert('work_order', row),
      () => {
        DB.workOrders.push(row);
        const eq=DB.equipment.find(e=>e.id_alat===row.id_alat); if(eq) eq.status='Under Maintenance';
        GeoACE.saveState(DB);
      },
      `WO ${noWO} dibuat`
    );
    if (_isSupabase) { try { const r=await DB_API.get('alat','id_alat',row.id_alat); if(r){const i=DB.equipment.findIndex(e=>e.id_alat===r.id_alat);if(i>=0)DB.equipment[i]=r;} } catch {} }
    closeModal(); showToast(`WO ${noWO} dibuat`,'success'); renderMtnTabContent();
  });
}

// ══════════════════════════════════════════════════════════════
// SCREEN 6: SUKU CADANG
// ══════════════════════════════════════════════════════════════
function renderParts() {
  const lowStock=DB.parts.filter(p=>equipmentLocalStock(p.kode_barang)<p.stok_minimum);
  $('#parts-content').innerHTML=`
    <div class="page-header">
      <div><h1 class="page-header__title">Suku Cadang</h1><p class="page-header__subtitle">${DB.parts.length} jenis · ${lowStock.length} stok kritis</p></div>
      ${['Gudang','Admin','Manajemen'].includes(currentRole)?`<div class="page-header__actions"><button class="btn btn--primary" id="btn-add-part">➕ Tambah Part</button></div>`:''}
    </div>
    ${lowStock.length>0?`<div class="alert alert--critical u-mb-2"><span class="alert__icon">🔴</span><div><div class="alert__title">${lowStock.length} item stok di bawah minimum</div><div class="alert__msg">${lowStock.map(p=>`${p.kode_barang}: ${equipmentLocalStock(p.kode_barang)}/${p.stok_minimum}`).join(' · ')}</div></div></div>`:''}
    <div class="card"><div class="table-wrapper"><table class="table" aria-label="Suku cadang">
      <thead><tr><th>Kode</th><th>Nama</th><th>Merk</th><th>Part Number</th><th>Stok (GPJ)</th><th>Min</th><th>Satuan</th><th>Rak</th><th>Harga</th></tr></thead>
      <tbody>${DB.parts.map(p=>{
        const stok=equipmentLocalStock(p.kode_barang);
        return `<tr class="${stok<p.stok_minimum?'table--low-stock':''}">
          <td class="u-mono u-fw-bold">${esc(p.kode_barang)}</td><td>${esc(p.nama_barang)}</td>
          <td>${esc(p.merk)}</td><td class="u-mono u-small">${esc(p.part_number)}</td>
          <td><strong style="color:${stok<p.stok_minimum?'var(--rust)':'var(--green)'}">${stok}</strong></td>
          <td>${p.stok_minimum}</td><td>${esc(p.satuan)}</td>
          <td>${esc(p.lokasi_rak)}</td><td>${fmtRp(p.harga_terakhir)}</td>
        </tr>`;
      }).join('')}</tbody>
    </table></div></div>`;
  $('#btn-add-part')?.addEventListener('click', showAddPartModal);
}

function showAddPartModal() {
  const body=`<form id="form-add-part">
    <div class="form-row">
      <div class="form-group"><label class="form-label form-label--required" for="ap-name">Nama Part</label><input class="form-control" id="ap-name" required></div>
      <div class="form-group"><label class="form-label form-label--required" for="ap-merk">Merk</label><input class="form-control" id="ap-merk" required></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label" for="ap-pn">Part Number</label><input class="form-control" id="ap-pn"></div>
      <div class="form-group"><label class="form-label" for="ap-rak">Lokasi Rak</label><input class="form-control" id="ap-rak" placeholder="cth: A-01"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label form-label--required" for="ap-min">Stok Minimum</label><input class="form-control" type="number" id="ap-min" value="1" min="0" required></div>
      <div class="form-group"><label class="form-label" for="ap-sat">Satuan</label>
        <select class="form-control" id="ap-sat"><option>Pcs</option><option>Set</option><option>Liter</option><option>Kg</option><option>Meter</option></select>
      </div>
      <div class="form-group"><label class="form-label" for="ap-harga">Harga (Rp)</label><input class="form-control" type="number" id="ap-harga" value="0" min="0"></div>
    </div>
  </form>`;
  openModal('Tambah Suku Cadang', body,
    `<button class="btn btn--secondary" onclick="closeModal()">Batal</button><button class="btn btn--primary" id="btn-save-part">Simpan</button>`);

  $('#btn-save-part').addEventListener('click', async ()=>{
    const form=$('#form-add-part'); if(!form.checkValidity()){form.reportValidity();return;}
    const newId='BRG-'+String(DB.parts.length+1).padStart(4,'0');
    const row={kode_barang:newId, nama_barang:$('#ap-name').value, kode_kategori:'SPR',
               merk:$('#ap-merk').value, part_number:$('#ap-pn').value,
               satuan:$('#ap-sat').value, stok_minimum:Number($('#ap-min').value),
               lokasi_rak:$('#ap-rak').value, harga_terakhir:Number($('#ap-harga').value)};
    await withFallback(
      () => DB_API.insert('barang_part', row),
      () => { DB.parts.push(row); GeoACE.saveState(DB); },
      `Part ${newId} ditambahkan`
    );
    closeModal(); showToast(`Part ${newId} berhasil ditambahkan`,'success'); renderParts(); buildSidebar();
  });
}

// ══════════════════════════════════════════════════════════════
// SCREEN 7: PEMBELIAN
// ══════════════════════════════════════════════════════════════
let bliActiveTab='pr';
function renderPembelian() {
  const pendingCount=DB.purchaseRequests.filter(p=>p.status==='Diajukan').length;
  $('#pembelian-content').innerHTML=`
    <div class="page-header">
      <div><h1 class="page-header__title">Pembelian</h1><p class="page-header__subtitle">PR, Quotation, PO &amp; Penerimaan Barang</p></div>
      ${['Purchasing','Mekanik','Gudang','Admin'].includes(currentRole)?`<div class="page-header__actions"><button class="btn btn--primary" id="btn-new-pr">➕ Buat PR</button></div>`:''}
    </div>
    <div class="tabs" role="tablist">
      <button class="tab ${bliActiveTab==='pr'?'tab--active':''}" data-tab="pr">Purchase Request${pendingCount>0?` <span class="badge badge--critical">${pendingCount}</span>`:''}</button>
      <button class="tab ${bliActiveTab==='quotation'?'tab--active':''}" data-tab="quotation">Perbandingan Quotation</button>
      <button class="tab ${bliActiveTab==='po'?'tab--active':''}" data-tab="po">Purchase Order</button>
    </div>
    <div id="bli-tab-content"></div>`;

  $$('#pembelian-content .tab').forEach(tab=>{
    tab.addEventListener('click',()=>{
      $$('#pembelian-content .tab').forEach(t=>{t.classList.remove('tab--active');t.setAttribute('aria-selected','false');});
      tab.classList.add('tab--active'); tab.setAttribute('aria-selected','true');
      bliActiveTab=tab.dataset.tab; renderBliTabContent();
    });
  });
  $('#btn-new-pr')?.addEventListener('click', showNewPRModal);
  renderBliTabContent();
}

function renderBliTabContent() {
  const el=$('#bli-tab-content');
  if (bliActiveTab==='pr')        el.innerHTML=buildPRList();
  if (bliActiveTab==='quotation') el.innerHTML=buildQuotationCompare();
  if (bliActiveTab==='po')        el.innerHTML=buildPOList();
}

function buildPRList() {
  return `<div class="card"><div class="table-wrapper"><table class="table">
    <thead><tr><th>No. PR</th><th>Pemohon</th><th>Jenis</th><th>Keperluan</th><th>Tanggal</th><th>Status</th><th>Aksi</th></tr></thead>
    <tbody>${DB.purchaseRequests.map(pr=>`<tr>
      <td class="u-mono u-fw-bold">${esc(pr.no_pr)}</td><td>${esc(pr.pemohon)}</td>
      <td><span class="badge badge--info">${esc(pr.jenis)}</span></td><td>${esc(pr.keperluan||'—')}</td>
      <td>${fmtDate(pr.tanggal)}</td><td>${statusBadge(pr.status)}</td>
      <td>
        ${pr.status==='Diajukan'&&['Manajemen','Admin'].includes(currentRole)
          ? `<button class="btn btn--sm btn--success" onclick="approvePR('${pr.no_pr}')">✓ Approve</button>
             <button class="btn btn--sm btn--danger" onclick="rejectPR('${pr.no_pr}')">✗ Tolak</button>` : ''}
        ${pr.status==='Disetujui'&&!DB.purchaseOrders.find(p=>p.no_pr===pr.no_pr)&&['Purchasing','Admin'].includes(currentRole)
          ? `<button class="btn btn--sm btn--teal" onclick="createPOFromPR('${pr.no_pr}')">Buat PO</button>` : ''}
      </td>
    </tr>`).join('')}
    </tbody>
  </table></div></div>`;
}

async function approvePR(noPR) {
  const pr=DB.purchaseRequests.find(x=>x.no_pr===noPR);
  showConfirm(`Setujui PR ${noPR}?`, async ()=>{
    const changes={status:'Disetujui',approver:currentUser.nama,tanggal_approve:new Date().toISOString()};
    await withFallback(
      ()=>DB_API.update('purchase_request','no_pr',noPR,changes),
      ()=>{Object.assign(pr,changes);GeoACE.saveState(DB);},
      `PR ${noPR} disetujui`
    );
    showToast(`PR ${noPR} disetujui`,'success'); renderBliTabContent(); buildSidebar();
  });
}
async function rejectPR(noPR) {
  const pr=DB.purchaseRequests.find(x=>x.no_pr===noPR);
  showConfirm(`Tolak PR ${noPR}?`, async ()=>{
    const changes={status:'Ditolak',approver:currentUser.nama,tanggal_approve:new Date().toISOString()};
    await withFallback(
      ()=>DB_API.update('purchase_request','no_pr',noPR,changes),
      ()=>{Object.assign(pr,changes);GeoACE.saveState(DB);},
      `PR ${noPR} ditolak`
    );
    showToast(`PR ${noPR} ditolak`,'warning'); renderBliTabContent(); buildSidebar();
  },'Tolak PR','Ya, Tolak',true);
}

function createPOFromPR(noPR) {
  const pr=DB.purchaseRequests.find(x=>x.no_pr===noPR);
  if (!pr||pr.status!=='Disetujui'){showToast('PR harus Disetujui terlebih dahulu','error');return;}
  const body=`<div class="alert alert--info"><span class="alert__icon">ℹ️</span><div>Membuat PO dari ${esc(pr.keperluan)}</div></div>
  <form id="form-po" class="u-mt-1">
    <div class="form-row">
      <div class="form-group"><label class="form-label form-label--required" for="po-vendor">Vendor</label>
        <select class="form-control" id="po-vendor" required><option value="">—</option>
          ${DB.vendors.map(v=>`<option value="${v.kode_vendor}">${esc(v.nama_vendor)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group"><label class="form-label form-label--required" for="po-tgl">Tgl PO</label><input class="form-control" type="date" id="po-tgl" value="${new Date().toISOString().slice(0,10)}" required></div>
    </div>
  </form>`;
  openModal('Buat Purchase Order',body,`<button class="btn btn--secondary" onclick="closeModal()">Batal</button><button class="btn btn--primary" id="btn-save-po">Buat PO</button>`);
  $('#btn-save-po').addEventListener('click',async()=>{
    const form=$('#form-po'); if(!form.checkValidity()){form.reportValidity();return;}
    const noPO=uid('PO');
    const row={no_po:noPO,no_pr:noPR,kode_vendor:$('#po-vendor').value,tanggal_po:$('#po-tgl').value,status:'PO terbit',kode_proyek:pr.kode_proyek||null};
    await withFallback(
      ()=>DB_API.insert('purchase_order',row),
      ()=>{DB.purchaseOrders.push(row);GeoACE.saveState(DB);},
      `PO ${noPO} dibuat`
    );
    closeModal(); showToast(`PO ${noPO} berhasil dibuat`,'success'); renderBliTabContent();
  });
}

function buildQuotationCompare() {
  const qts=DB.quotations; if(!qts.length) return '<div class="empty-state"><div class="empty-state__icon">📋</div><p>Tidak ada data quotation</p></div>';
  const byPR={}; qts.forEach(q=>{ if(!byPR[q.no_pr]) byPR[q.no_pr]=[]; byPR[q.no_pr].push(q); });
  return Object.entries(byPR).map(([noPR,qs])=>{
    const min=Math.min(...qs.map(q=>q.harga_total));
    return `<div class="form-section__title" style="font-size:14px;font-weight:700;margin-bottom:var(--sp-2)">${esc(noPR)}</div>
    <div class="quote-grid">${qs.map(q=>`<div class="quote-card ${q.harga_total===min||q.dipilih?'quote-card--winner':''}">
      <div class="quote-card__header"><div class="quote-card__vendor">${esc(vendorName(q.kode_vendor))}</div>${q.dipilih?'<span class="badge badge--approved">Dipilih</span>':''}</div>
      <div class="quote-card__body">
        <div style="font-weight:800;font-size:15px;padding:8px 0">Total: <span class="quote-card__total">${fmtRp(q.harga_total)}</span></div>
        <div class="u-small u-color-muted">Lead time: ${q.lead_time_hari||'—'} hari</div>
        ${q.catatan?`<div class="u-small u-color-muted u-mt-1">${esc(q.catatan)}</div>`:''}
      </div>
    </div>`).join('')}</div>`;
  }).join('');
}

function buildPOList() {
  return `<div class="card"><div class="table-wrapper"><table class="table">
    <thead><tr><th>No. PO</th><th>PR</th><th>Vendor</th><th>Tgl PO</th><th>Status</th></tr></thead>
    <tbody>${DB.purchaseOrders.map(po=>`<tr>
      <td class="u-mono u-fw-bold">${esc(po.no_po)}</td><td class="u-mono">${esc(po.no_pr)}</td>
      <td>${esc(vendorName(po.kode_vendor))}</td><td>${fmtDate(po.tanggal_po)}</td>
      <td>${statusBadge(po.status)}</td>
    </tr>`).join('')}</tbody>
  </table></div></div>`;
}

function showNewPRModal() {
  const body=`<form id="form-pr">
    <div class="form-group"><label class="form-label form-label--required" for="pr-keperluan">Keperluan / Judul</label><input class="form-control" id="pr-keperluan" required></div>
    <div class="form-row u-mt-1">
      <div class="form-group"><label class="form-label form-label--required" for="pr-jenis">Jenis</label>
        <select class="form-control" id="pr-jenis"><option>Part</option><option>Alat</option><option>Barang lain</option></select>
      </div>
      <div class="form-group"><label class="form-label" for="pr-proyek">Proyek</label>
        <select class="form-control" id="pr-proyek"><option value="">—</option>
          ${DB.projects.map(p=>`<option value="${p.kode_proyek}">${esc(p.nama_proyek)}</option>`).join('')}
        </select>
      </div>
    </div>
  </form>`;
  openModal('Buat Purchase Request', body,
    `<button class="btn btn--secondary" onclick="closeModal()">Batal</button><button class="btn btn--primary" id="btn-save-pr">Buat PR</button>`);
  $('#btn-save-pr').addEventListener('click',async()=>{
    const form=$('#form-pr'); if(!form.checkValidity()){form.reportValidity();return;}
    const noPR='PR-'+new Date().getFullYear()+'-'+Math.floor(Math.random()*900+100);
    const row={no_pr:noPR,tanggal:new Date().toISOString().slice(0,10),pemohon:currentUser.nama,
               kode_proyek:$('#pr-proyek').value||null,jenis:$('#pr-jenis').value,
               keperluan:$('#pr-keperluan').value,status:'Diajukan',approver:null,tanggal_approve:null};
    await withFallback(
      ()=>DB_API.insert('purchase_request',row),
      ()=>{DB.purchaseRequests.push(row);GeoACE.saveState(DB);},
      `PR ${noPR} dibuat`
    );
    closeModal(); showToast(`PR ${noPR} dibuat`,'success'); renderBliTabContent(); buildSidebar();
  });
}

// ══════════════════════════════════════════════════════════════
// SCREEN 8: LAPORAN
// ══════════════════════════════════════════════════════════════
let laporanType='stok';
function renderLaporan() {
  $('#laporan-content').innerHTML=`
    <div class="page-header"><div><h1 class="page-header__title">Laporan</h1></div></div>
    <div class="card u-mb-2"><div class="card__body">
      <div class="filters">
        <select class="filters__select" id="lap-type" aria-label="Jenis laporan">
          <option value="stok">Laporan Stok</option>
          <option value="kondisi">Laporan Kondisi</option>
          <option value="out">Laporan Out Proyek</option>
          <option value="in">Laporan In Proyek</option>
          <option value="pembelian">Laporan Pembelian</option>
          <option value="kebutuhan">Laporan Kebutuhan</option>
        </select>
        <select class="filters__select" id="lap-proj"><option value="">Semua Proyek</option>${DB.projects.map(p=>`<option value="${p.kode_proyek}">${esc(p.nama_proyek)}</option>`).join('')}</select>
        <button class="btn btn--primary" id="btn-gen-report">Generate</button>
      </div>
    </div></div>
    <div id="laporan-result"></div>`;
  $('#btn-gen-report').addEventListener('click', generateReport);
  generateReport();
}

async function generateReport() {
  const type=$('#lap-type').value, proj=$('#lap-proj').value;
  laporanType=type;
  $('#laporan-result').innerHTML=skeletonRows(5,5);

  let data;
  if (_isSupabase) {
    try {
      if (type==='stok')     data=await DB_API.view('v_laporan_stok_alat', proj?`select=*&kode_proyek=eq.${proj}`:'select=*');
      if (type==='kondisi')  data=await DB_API.view('v_laporan_kondisi','select=*');
      if (type==='kebutuhan')data=await DB_API.view('v_laporan_kebutuhan','select=*');
    } catch { data=null; }
  }
  if (!data) data=buildLocalReport(type, proj);

  const titles={stok:'Laporan Stok Alat',kondisi:'Laporan Kondisi Alat',out:'Laporan Out Proyek',in:'Laporan In Proyek',pembelian:'Laporan Pembelian',kebutuhan:'Laporan Kebutuhan'};
  let tableHtml='';
  if (type==='stok'||type==='kondisi') {
    const cols=type==='stok'
      ?['id_alat','nama_alat','jenis_alat','merk_tipe','no_seri','status','kondisi','lokasi','pic','hour_meter']
      :['id_alat','nama_alat','status','kondisi','hour_meter'];
    tableHtml=`<table class="table"><thead><tr>${cols.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>
      ${(data||[]).map(r=>`<tr>${cols.map(c=>{
        const v=r[c]||'—';
        if(c==='status') return `<td>${statusBadge(v)}</td>`;
        if(c==='kondisi') return `<td>${conditionBadge(v)}</td>`;
        return `<td>${esc(String(v))}</td>`;
      }).join('')}</tr>`).join('')}</tbody></table>`;
  } else {
    tableHtml=type==='pembelian'
      ? `<table class="table"><thead><tr><th>PO</th><th>PR</th><th>Vendor</th><th>Status</th><th>Tgl PO</th></tr></thead><tbody>${DB.purchaseOrders.map(po=>`<tr><td class="u-mono">${esc(po.no_po)}</td><td>${esc(po.no_pr)}</td><td>${esc(vendorName(po.kode_vendor))}</td><td>${statusBadge(po.status)}</td><td>${fmtDate(po.tanggal_po)}</td></tr>`).join('')}</tbody></table>`
      : `<table class="table"><thead><tr><th>ID</th><th>Alat</th><th>Dari</th><th>Ke</th><th>Status</th></tr></thead><tbody>${DB.mobilizations.map(m=>`<tr><td class="u-mono">${esc(m.no_mutasi)}</td><td>${esc(equipName(m.id_alat))}</td><td>${esc(whName(m.asal_gudang)||projectName(m.asal_proyek))}</td><td>${esc(projectName(m.tujuan_proyek)||whName(m.tujuan_gudang))}</td><td>${statusBadge(m.tanggal_masuk?'Selesai':'In Transit')}</td></tr>`).join('')}</tbody></table>`;
  }

  $('#laporan-result').innerHTML=`<div class="card">
    <div class="card__header"><span class="card__title">${esc(titles[type])}</span>
      <div style="display:flex;gap:8px">
        <button class="btn btn--sm btn--secondary" onclick="exportCSV()">📥 Export Excel</button>
        <button class="btn btn--sm btn--teal" onclick="showToast('PDF export tersimulasi','info')">📄 Export PDF</button>
      </div>
    </div>
    <div class="card__body" style="padding:0"><div class="table-wrapper">${tableHtml}</div></div>
  </div>`;
}

function buildLocalReport(type, proj) {
  let data=DB.equipment; if(proj) data=data.filter(e=>e.kode_proyek===proj);
  return data.map(e=>({
    id_alat:e.id_alat, nama_alat:e.nama_alat, jenis_alat:e.jenis_alat,
    merk_tipe:`${e.merk} ${e.tipe}`, no_seri:e.no_seri, status:e.status,
    kondisi:e.kondisi, lokasi:locationLabel(e), pic:e.pic, hour_meter:e.hour_meter,
  }));
}

function exportCSV() {
  const rows=[['id_alat','nama_alat','status','kondisi','lokasi','hour_meter']];
  DB.equipment.forEach(e=>rows.push([e.id_alat,e.nama_alat,e.status,e.kondisi,locationLabel(e),e.hour_meter]));
  const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  a.download=`geoace_laporan_${laporanType}_${new Date().toISOString().slice(0,10)}.csv`;
  a.click(); showToast('File CSV berhasil diunduh','success');
}

// ══════════════════════════════════════════════════════════════
// SCREEN 9: MASTER DATA
// ══════════════════════════════════════════════════════════════
let masterTab='proyek';
function renderMaster() {
  $('#master-content').innerHTML=`
    <div class="page-header"><div><h1 class="page-header__title">Master Data</h1></div></div>
    <div class="tabs" role="tablist">
      <button class="tab ${masterTab==='proyek'?'tab--active':''}" data-tab="proyek">Proyek</button>
      <button class="tab ${masterTab==='gudang'?'tab--active':''}" data-tab="gudang">Gudang</button>
      <button class="tab ${masterTab==='vendor'?'tab--active':''}" data-tab="vendor">Vendor</button>
      <button class="tab ${masterTab==='pengguna'?'tab--active':''}" data-tab="pengguna">Pengguna</button>
      <button class="tab ${masterTab==='import'?'tab--active':''}" data-tab="import">Import</button>
    </div>
    <div id="master-tab-content"></div>`;
  $$('#master-content .tab').forEach(tab=>{
    tab.addEventListener('click',()=>{
      $$('#master-content .tab').forEach(t=>{t.classList.remove('tab--active');t.setAttribute('aria-selected','false');});
      tab.classList.add('tab--active'); tab.setAttribute('aria-selected','true');
      masterTab=tab.dataset.tab; renderMasterTabContent();
    });
  });
  renderMasterTabContent();
}
function renderMasterTabContent() {
  const el=$('#master-tab-content');
  if (masterTab==='proyek')   el.innerHTML=buildMasterTable(DB.projects,['kode_proyek','nama_proyek','lokasi','status','manajer_proyek','rencana_mulai','rencana_selesai']);
  if (masterTab==='gudang')   el.innerHTML=buildMasterTable(DB.warehouses,['kode_gudang','nama_gudang','jenis','alamat','penanggung_jawab']);
  if (masterTab==='vendor')   el.innerHTML=buildMasterTable(DB.vendors,['kode_vendor','nama_vendor','kota','kategori','telepon','status_pkp','aktif']);
  if (masterTab==='pengguna') el.innerHTML=buildMasterTable(DB.users,['id_pengguna','nama','peran','departemen','level_approval','aktif']);
  if (masterTab==='import')   el.innerHTML=buildImportScreen();
}
function buildMasterTable(data, fields) {
  if (!data?.length) return '<div class="empty-state"><div class="empty-state__icon">📋</div><p>Data kosong</p></div>';
  return `<div class="card"><div class="table-wrapper"><table class="table">
    <thead><tr>${fields.map(f=>`<th>${esc(f)}</th>`).join('')}</tr></thead>
    <tbody>${data.map(row=>`<tr>${fields.map(f=>{
      const v=row[f]; if(f==='status'||f==='aktif') return `<td>${statusBadge(String(v))}</td>`;
      return `<td>${esc(String(v??'—'))}</td>`;
    }).join('')}</tr>`).join('')}</tbody>
  </table></div></div>`;
}
function buildImportScreen() {
  return `<div class="card u-mb-2"><div class="card__body">
    <div class="upload-zone" role="button" tabindex="0">
      <div class="upload-zone__icon">📤</div>
      <div class="upload-zone__title">Upload File Excel / CSV</div>
      <div class="upload-zone__hint">Klik atau seret file .xlsx / .csv ke sini</div>
      <input type="file" id="import-file" accept=".csv,.xlsx" style="display:none">
      <button class="btn btn--secondary u-mt-1" onclick="$('#import-file').click()">Pilih File</button>
    </div>
  </div></div>`;
}

// ══════════════════════════════════════════════════════════════
// SCREEN 10: PENGATURAN & AUDIT LOG
// ══════════════════════════════════════════════════════════════
let auditPage = 0;
let auditFilterTable = '', auditFilterId = '';

function renderPengaturan() {
  $('#pengaturan-content').innerHTML=`
    <div class="page-header">
      <div><h1 class="page-header__title">Pengaturan &amp; Audit Log</h1></div>
      <div class="page-header__actions"><button class="btn btn--danger btn--sm" id="btn-reset-data">↩ Reset Data</button></div>
    </div>
    <div class="tabs" role="tablist">
      <button class="tab tab--active" data-tab="audit">Audit Log</button>
      <button class="tab" data-tab="db">Koneksi Database</button>
      <button class="tab" data-tab="queue">Antrean Offline</button>
    </div>
    <div id="pgtr-tab-content"></div>`;

  $$('#pengaturan-content .tab').forEach(tab=>{
    tab.addEventListener('click',()=>{
      $$('#pengaturan-content .tab').forEach(t=>{t.classList.remove('tab--active');t.setAttribute('aria-selected','false');});
      tab.classList.add('tab--active'); tab.setAttribute('aria-selected','true');
      const el=$('#pgtr-tab-content');
      if(tab.dataset.tab==='audit') renderAuditLog(el);
      if(tab.dataset.tab==='db')    el.innerHTML=buildDBSettings();
      if(tab.dataset.tab==='queue') el.innerHTML=buildQueuePanel();
    });
  });

  $('#btn-reset-data').addEventListener('click',()=>{
    showConfirm('Reset semua data lokal ke kondisi awal?', ()=>{
      DB=GeoACE.resetState(); buildSidebar(); updateNotifBadge();
      showToast('Data direset','info'); renderPengaturan();
    },'Reset Data','Ya, Reset',true);
  });

  renderAuditLog($('#pgtr-tab-content'));
}

async function renderAuditLog(el) {
  el.innerHTML=skeletonRows(7,8);

  let rows=[];
  if (_isSupabase) {
    try {
      let q=`select=*&order=waktu.desc&limit=50&offset=${auditPage*50}`;
      if (auditFilterTable) q+=`&tabel=eq.${auditFilterTable}`;
      if (auditFilterId)    q+=`&id_record=ilike.*${encodeURIComponent(auditFilterId)}*`;
      rows=await DB_API.list('audit_log', q);
    } catch { rows=DB.auditLog||[]; }
  } else { rows=DB.auditLog||[]; }

  el.innerHTML=`
    <div class="filters u-mb-2">
      <div class="filters__search"><span>🔍</span><input type="search" id="audit-filter-id" placeholder="Filter ID record…" value="${esc(auditFilterId)}" aria-label="Filter ID"></div>
      <select class="filters__select" id="audit-filter-table" aria-label="Filter tabel">
        <option value="">Semua Tabel</option>
        ${['alat','mutasi_alat','work_order','laporan_kerusakan','purchase_request','purchase_order'].map(t=>`<option value="${t}" ${auditFilterTable===t?'selected':''}>${t}</option>`).join('')}
      </select>
      <button class="btn btn--secondary btn--sm" id="btn-audit-filter">Filter</button>
    </div>
    <div class="card"><div class="table-wrapper"><table class="table" aria-label="Audit log">
      <thead><tr><th>Waktu</th><th>Oleh</th><th>Tabel</th><th>ID Record</th><th>Aksi</th><th>Field</th><th>Nilai Lama</th><th>Nilai Baru</th></tr></thead>
      <tbody>
        ${rows.length===0
          ? `<tr><td colspan="8"><div class="empty-state"><div class="empty-state__icon">📋</div><p>Belum ada audit log</p></div></td></tr>`
          : rows.map(a=>`<tr>
              <td class="u-mono u-small">${esc(a.waktu||a.timestamp||'')}</td>
              <td>${esc(a.oleh||a.user||'—')}</td>
              <td><span class="badge badge--info">${esc(a.tabel||a.module||'—')}</span></td>
              <td class="u-mono u-small">${esc(a.id_record||a.recordId||'—')}</td>
              <td><span class="badge badge--${(a.aksi||a.action)==='INSERT'?'approved':(a.aksi||a.action)==='UPDATE'?'in-use':'broken'}">${esc(a.aksi||a.action||'—')}</span></td>
              <td>${esc(a.field||'—')}</td>
              <td class="u-color-muted u-small">${esc(a.nilai_lama||a.oldValue||'—')}</td>
              <td class="u-fw-bold u-small">${esc(a.nilai_baru||a.newValue||'—')}</td>
            </tr>`).join('')
        }
      </tbody>
    </table></div></div>
    <div style="display:flex;gap:8px;margin-top:8px">
      ${auditPage>0?`<button class="btn btn--secondary btn--sm" id="btn-audit-prev">← Sebelumnya</button>`:''}
      <button class="btn btn--secondary btn--sm" id="btn-audit-next">Berikutnya →</button>
    </div>`;

  $('#btn-audit-filter')?.addEventListener('click',()=>{
    auditFilterTable=$('#audit-filter-table').value;
    auditFilterId=$('#audit-filter-id').value;
    auditPage=0; renderAuditLog(el);
  });
  $('#btn-audit-prev')?.addEventListener('click',()=>{auditPage--;renderAuditLog(el);});
  $('#btn-audit-next')?.addEventListener('click',()=>{auditPage++;renderAuditLog(el);});
}

function buildDBSettings() {
  const cfgUrl=(window.GEOACE_CONFIG?.SUPABASE_URL||'');
  const masked=cfgUrl ? cfgUrl.replace(/https?:\/\//,'').split('.')[0].slice(0,8)+'…supabase.co' : '—';
  return `<div class="card"><div class="card__body">
    <div class="form-section"><div class="form-section__title">Status Koneksi</div>
      <table class="table"><tbody>
        ${infoRow('Mode', _isSupabase ? '<span class="badge badge--approved">🟢 Supabase</span>' : '<span class="badge badge--pending">🔘 Lokal</span>')}
        ${infoRow('URL', esc(masked))}
        ${infoRow('Sinkron Terakhir', DB_API.lastSync() ? DB_API.lastSync().toLocaleString('id-ID') : '—')}
      </tbody></table>
      <div style="display:flex;gap:8px;margin-top:var(--sp-1)">
        <button class="btn btn--secondary" id="btn-tes-koneksi">🔌 Tes Koneksi</button>
        <button class="btn btn--teal" id="btn-sync-now">🔄 Sinkronkan Sekarang</button>
      </div>
    </div>
  </div></div>`;
}

// (event binding setelah render)
document.addEventListener('click', async e=>{
  if (e.target.id==='btn-tes-koneksi') {
    showToast('Menguji koneksi…','info',1500);
    const ok=await DB_API.ping();
    showToast(ok?'Koneksi ke Supabase berhasil ✅':'Tidak dapat terhubung ke Supabase ❌', ok?'success':'error');
    updateDBChip();
  }
  if (e.target.id==='btn-sync-now') {
    await DB_API.replayQueue(); updateDBChip();
    showToast('Sinkronisasi selesai','success');
  }
});

function buildQueuePanel() {
  const q=DB_API.getQueue();
  if (!q.length) return `<div class="empty-state"><div class="empty-state__icon">✅</div><p class="empty-state__title">Antrean kosong</p><p class="empty-state__text">Semua data sudah tersinkron</p></div>`;
  return `<div class="card"><div class="table-wrapper"><table class="table">
    <thead><tr><th>Waktu</th><th>Metode</th><th>Path</th><th>Status</th><th>Pesan</th><th>Aksi</th></tr></thead>
    <tbody>${q.map(item=>`<tr>
      <td class="u-mono u-small">${esc(item.waktu)}</td>
      <td><span class="badge badge--info">${esc(item.method)}</span></td>
      <td class="u-mono u-small">${esc(item.path||'—')}</td>
      <td>${item.gagal?'<span class="badge badge--broken">Gagal</span>':'<span class="badge badge--pending">Antre</span>'}</td>
      <td class="u-small u-color-muted">${esc(item.pesanGagal||'—')}</td>
      <td><button class="btn btn--sm btn--danger" onclick="removeQueue('${item.id}')">Hapus</button></td>
    </tr>`).join('')}</tbody>
  </table></div></div>`;
}

function removeQueue(id) {
  DB_API.removeFromQueue(id);
  showToast('Item dihapus dari antrean','info');
  // Re-render queue panel jika masih aktif
  const tab = $$('#pengaturan-content .tab').find(t=>t.dataset.tab==='queue'&&t.classList.contains('tab--active'));
  if (tab) $('#pgtr-tab-content').innerHTML=buildQueuePanel();
}

// ── INIT ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  $('#login-screen').style.display='';
  $('#app').classList.remove('app--visible');

  document.addEventListener('keydown', e=>{
    if (e.key==='Escape') {
      if ($('#modal-overlay').classList.contains('modal-overlay--open')) closeModal();
      if ($('#confirm-overlay').classList.contains('modal-overlay--open')) {
        $('#confirm-overlay').classList.remove('modal-overlay--open'); _confirmCb=null;
      }
    }
  });
});

// ── GLOBAL ONCLICK BINDINGS ───────────────────────────────────
window.openWODetail      = openWODetail;
window.updateWOStatus    = updateWOStatus;
window.verifyWO          = verifyWO;
window.startCheckout     = startCheckout;
window.startCheckin      = startCheckin;
window.hapusAlat         = hapusAlat;
window.printQR           = printQR;
window.approvePR         = approvePR;
window.rejectPR          = rejectPR;
window.createPOFromPR    = createPOFromPR;
window.closeModal        = closeModal;
window.exportCSV         = exportCSV;
window.showToast         = showToast;
window.removeQueue       = removeQueue;
