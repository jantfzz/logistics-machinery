// =============================================================
// app.js — GeoACE Logistic & Machinery Management System
// Routing, state, rendering, business rules — ES6 vanilla JS
// =============================================================

'use strict';

// ── BOOTSTRAP ────────────────────────────────────────────────
let DB   = GeoACE.loadState();
let currentUser = null;
let currentRole = 'PM Site';

// ── ROLE CONFIG ──────────────────────────────────────────────
const ROLE_MENU = {
  'PM Site': ['dashboard','alat','mobilisasi','maintenance','parts','laporan'],
  'Gudang':  ['dashboard','alat','mobilisasi','parts','laporan'],
  'Mekanik': ['dashboard','alat','maintenance','parts'],
  'Purchasing': ['dashboard','pembelian','parts','laporan'],
  'Manajemen':  ['dashboard','alat','mobilisasi','maintenance','parts','pembelian','laporan','master','pengaturan'],
  'Admin':       ['dashboard','alat','mobilisasi','maintenance','parts','pembelian','laporan','master','pengaturan'],
};

const MENU_ITEMS = [
  { id: 'dashboard',   label: 'Dashboard',             icon: '📊', section: 'Utama' },
  { id: 'alat',        label: 'Database Mesin & Alat', icon: '⚙️', section: 'Utama' },
  { id: 'mobilisasi',  label: 'Kebutuhan & Mobilisasi', icon: '🚛', section: 'Operasional' },
  { id: 'maintenance', label: 'Pemeliharaan',           icon: '🔧', section: 'Operasional' },
  { id: 'parts',       label: 'Suku Cadang',            icon: '🔩', section: 'Operasional' },
  { id: 'pembelian',   label: 'Pembelian',              icon: '🛒', section: 'Keuangan' },
  { id: 'laporan',     label: 'Laporan',                icon: '📋', section: 'Keuangan' },
  { id: 'master',      label: 'Master Data',            icon: '🗄️', section: 'Konfigurasi' },
  { id: 'pengaturan',  label: 'Pengaturan',             icon: '⚙',  section: 'Konfigurasi' },
];

// ── UTILITIES ─────────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const fmt = new Intl.NumberFormat('id-ID');
const fmtRp = v => 'Rp ' + fmt.format(v);
const fmtDate = d => d ? new Date(d).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}) : '—';
const now = () => new Date().toISOString().slice(0,19).replace('T',' ');
const uid = prefix => prefix + '-' + Math.random().toString(36).slice(2,7).toUpperCase();
const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

function statusBadge(status) {
  const map = {
    'Ready':'ready','In Transit':'in-transit','In Use':'in-use',
    'Under Maintenance':'maintenance','Broken':'broken','Scrapped':'scrapped',
    'Pending':'pending','Approved':'approved','Rejected':'rejected',
    'Ordered':'in-transit','Received':'received','Delivered':'received',
    'Critical':'critical','High':'high','Medium':'medium','Low':'low',
    'Open':'open','In Progress':'in-progress','Menunggu Verifikasi':'waiting',
    'Selesai':'done','Completed':'done','Pending Approval':'pending',
    'WO Dibuat':'in-progress','Dilaporkan':'pending',
  };
  const cls = map[status] || 'info';
  return `<span class="badge badge--${cls} badge--dot">${esc(status)}</span>`;
}

function conditionBadge(c) {
  const map = { 'Baik':'ready','Perlu perbaikan':'medium','Rusak ringan':'high','Rusak berat':'broken' };
  return `<span class="badge badge--${map[c]||'info'}">${esc(c||'—')}</span>`;
}

function getEquipmentName(id) {
  const e = DB.equipment.find(x=>x.id===id);
  return e ? `${id} — ${e.name}` : id;
}
function getProjectName(id) {
  if (!id) return '—';
  const p = DB.projects.find(x=>x.id===id); return p ? p.name : id;
}
function getWarehouseName(id) {
  if (!id) return '—';
  const w = DB.warehouses.find(x=>x.id===id); return w ? w.name : id;
}
function getVendorName(id) {
  const v = DB.vendors.find(x=>x.id===id); return v ? v.name : id;
}
function getPartName(id) {
  const p = DB.parts.find(x=>x.id===id); return p ? `${p.name} (${id})` : id;
}
function locationLabel(eq) {
  if (eq.location) return getProjectName(eq.location);
  if (eq.warehouse) return getWarehouseName(eq.warehouse);
  return '—';
}

// ── AUDIT ─────────────────────────────────────────────────────
function addAudit(action, module, recordId, field, oldValue, newValue) {
  DB.auditLog.unshift({
    id: uid('AUD'),
    timestamp: now(),
    user: currentUser ? currentUser.name : currentRole,
    action, module, recordId, field,
    oldValue: oldValue ?? null,
    newValue: newValue ?? null,
  });
  GeoACE.saveState(DB);
}

// ── TOAST ─────────────────────────────────────────────────────
function showToast(msg, type = 'success', duration = 3500) {
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const el = document.createElement('div');
  el.className = `toast toast--${type}`;
  el.innerHTML = `<span class="toast__icon" aria-hidden="true">${icons[type]||'ℹ️'}</span><span>${esc(msg)}</span>`;
  const container = $('#toast-container');
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 320); }, duration);
}

// ── CONFIRM MODAL ────────────────────────────────────────────
let _confirmCb = null;
function showConfirm(msg, cb, title = 'Konfirmasi', okLabel = 'Ya, Lanjutkan', danger = false) {
  $('#confirm-msg').textContent = msg;
  $('#confirm-title').textContent = title;
  $('#confirm-ok-btn').textContent = okLabel;
  $('#confirm-ok-btn').className = `btn ${danger ? 'btn--danger' : 'btn--primary'}`;
  _confirmCb = cb;
  $('#confirm-overlay').classList.add('modal-overlay--open');
}
$('#confirm-cancel-btn').addEventListener('click', () => {
  $('#confirm-overlay').classList.remove('modal-overlay--open');
  _confirmCb = null;
});
$('#confirm-ok-btn').addEventListener('click', () => {
  $('#confirm-overlay').classList.remove('modal-overlay--open');
  if (_confirmCb) { _confirmCb(); _confirmCb = null; }
});

// ── GENERIC MODAL ────────────────────────────────────────────
function openModal(title, bodyHTML, footerHTML = '', size = '') {
  $('#modal-title').textContent = title;
  $('#modal-body').innerHTML = bodyHTML;
  $('#modal-footer').innerHTML = footerHTML;
  $('#modal').className = 'modal' + (size ? ' modal--' + size : '');
  $('#modal-overlay').classList.add('modal-overlay--open');
}
function closeModal() {
  $('#modal-overlay').classList.remove('modal-overlay--open');
}
$('#modal-close-btn').addEventListener('click', closeModal);
$('#modal-overlay').addEventListener('click', e => { if (e.target === $('#modal-overlay')) closeModal(); });

// ── ROUTING ──────────────────────────────────────────────────
function getRoute() {
  const h = location.hash || '#/dashboard';
  const parts = h.replace('#/','').split('/');
  return { page: parts[0] || 'dashboard', param: parts[1] || null };
}

function navigate(path) {
  location.hash = '#/' + path;
}

function renderPage(route) {
  $$('.page').forEach(p => p.classList.remove('page--active'));
  const { page, param } = route;

  if (page === 'alat' && param) {
    $('#page-alat-detail').classList.add('page--active');
    renderAlatDetail(param);
  } else {
    const el = $(`#page-${page}`);
    if (el) el.classList.add('page--active');
    switch (page) {
      case 'dashboard':   renderDashboard();   break;
      case 'alat':        renderAlat();         break;
      case 'mobilisasi':  renderMobilisasi();   break;
      case 'maintenance': renderMaintenance();  break;
      case 'parts':       renderParts();        break;
      case 'pembelian':   renderPembelian();    break;
      case 'laporan':     renderLaporan();      break;
      case 'master':      renderMaster();       break;
      case 'pengaturan':  renderPengaturan();   break;
    }
  }
  updateSidebarActive(page);
  $$('.bottom-nav__item').forEach(b => {
    b.classList.toggle('bottom-nav__item--active', b.dataset.route === page);
  });
}

window.addEventListener('hashchange', () => renderPage(getRoute()));

// ── LOGIN ─────────────────────────────────────────────────────
$$('.login__role-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.login__role-btn').forEach(b => { b.classList.remove('login__role-btn--active'); b.setAttribute('aria-pressed','false'); });
    btn.classList.add('login__role-btn--active');
    btn.setAttribute('aria-pressed','true');
    currentRole = btn.dataset.role;
  });
});

$('#login-form').addEventListener('submit', () => doLogin());
$('#login-btn').addEventListener('click', doLogin);

function doLogin() {
  currentUser = DB.users.find(u => u.role === currentRole) || { id: 'u_guest', name: currentRole + ' User', role: currentRole, avatar: currentRole.slice(0,2).toUpperCase() };
  $('#login-screen').style.display = 'none';
  $('#app').classList.add('app--visible');
  buildSidebar();
  updateTopbar();
  updateNotifBadge();
  navigate('dashboard');
  showToast(`Selamat datang, ${currentUser.name} (${currentRole})`, 'success');
}

$('#logout-btn').addEventListener('click', () => {
  showConfirm('Keluar dari sistem?', () => {
    currentUser = null;
    $('#app').classList.remove('app--visible');
    $('#login-screen').style.display = '';
  }, 'Keluar', 'Ya, Keluar', true);
});

// ── SIDEBAR ──────────────────────────────────────────────────
function buildSidebar() {
  const allowed = ROLE_MENU[currentRole] || [];
  let lastSection = '';
  let html = '';
  MENU_ITEMS.filter(m => allowed.includes(m.id)).forEach(m => {
    if (m.section !== lastSection) {
      html += `<div class="sidebar__section-label">${esc(m.section)}</div>`;
      lastSection = m.section;
    }
    const badge = m.id === 'parts' ? getLowStockCount() : (m.id === 'pembelian' ? getPendingPRCount() : '');
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
    const active = a.dataset.page === page || (page === 'alat-detail' && a.dataset.page === 'alat');
    a.classList.toggle('sidebar__item--active', active);
    a.setAttribute('aria-current', active ? 'page' : 'false');
  });
}

function getLowStockCount() {
  return DB.parts.filter(p => p.stock < p.minStock).length;
}
function getPendingPRCount() {
  return DB.purchaseRequests.filter(p => p.status === 'Pending').length;
}

// ── TOPBAR ───────────────────────────────────────────────────
function updateTopbar() {
  if (!currentUser) return;
  $('#topbar-avatar').textContent = currentUser.avatar;
  $('#topbar-name').textContent   = currentUser.name;
  $('#topbar-role').textContent   = currentUser.role;
  $('#topbar-chip').textContent   = currentUser.role;
}

// ── NOTIFICATIONS ────────────────────────────────────────────
function updateNotifBadge() {
  const count = DB.notifications.filter(n => !n.read).length;
  const badge = $('#notif-badge');
  badge.textContent = count > 0 ? count : '';
  badge.style.display = count > 0 ? '' : 'none';
}

$('#notif-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  const dd = $('#notif-dropdown');
  const open = dd.classList.toggle('notif-dropdown--open');
  $('#notif-btn').setAttribute('aria-expanded', open);
  if (open) renderNotifications();
});

document.addEventListener('click', (e) => {
  if (!$('#notif-dropdown').contains(e.target) && e.target !== $('#notif-btn')) {
    $('#notif-dropdown').classList.remove('notif-dropdown--open');
  }
});

function renderNotifications() {
  const html = DB.notifications.map(n => {
    const icons = { critical: '🔴', warning: '🟡', info: '🔵' };
    return `<div class="notif-item ${n.read ? '' : 'notif-item--unread'}" 
              data-notif="${n.id}" role="listitem" tabindex="0">
      <span class="notif-item__icon" aria-hidden="true">${icons[n.type]||'🔵'}</span>
      <div class="notif-item__body">
        <div class="notif-item__title">${esc(n.title)}</div>
        <div class="notif-item__msg">${esc(n.message)}</div>
        <div class="notif-item__date">${fmtDate(n.date)}</div>
      </div>
    </div>`;
  }).join('');
  $('#notif-list').innerHTML = html || '<div class="empty-state" style="padding:24px"><p>Tidak ada notifikasi</p></div>';

  $$('.notif-item').forEach(el => {
    el.addEventListener('click', () => {
      const n = DB.notifications.find(x => x.id === el.dataset.notif);
      if (n && !n.read) { n.read = true; GeoACE.saveState(DB); updateNotifBadge(); renderNotifications(); }
      if (n && n.link) { $('#notif-dropdown').classList.remove('notif-dropdown--open'); location.hash = n.link; }
    });
  });
}

$('#mark-all-read-btn').addEventListener('click', () => {
  DB.notifications.forEach(n => n.read = true);
  GeoACE.saveState(DB);
  updateNotifBadge();
  renderNotifications();
  showToast('Semua notifikasi ditandai dibaca', 'info');
});

// ── GLOBAL SEARCH ────────────────────────────────────────────
$('#global-search').addEventListener('input', function() {
  const q = this.value.toLowerCase().trim();
  if (q.length < 2) return;
  const eq = DB.equipment.find(e => e.id.toLowerCase().includes(q) || e.name.toLowerCase().includes(q));
  if (eq) { this.value = ''; navigate('alat/' + eq.id); }
});

// ── MOBILE SIDEBAR ───────────────────────────────────────────
$('#sidebar-toggle').addEventListener('click', () => {
  const open = $('#sidebar').classList.toggle('sidebar--open');
  $('#sidebar-overlay').classList.toggle('sidebar-overlay--open', open);
  $('#sidebar-toggle').setAttribute('aria-expanded', open);
});
$('#sidebar-overlay').addEventListener('click', () => {
  $('#sidebar').classList.remove('sidebar--open');
  $('#sidebar-overlay').classList.remove('sidebar-overlay--open');
});
$$('.bottom-nav__item').forEach(btn => {
  btn.addEventListener('click', () => navigate(btn.dataset.route));
});

// ══════════════════════════════════════════════════════════════
// SCREEN 1: DASHBOARD
// ══════════════════════════════════════════════════════════════
function renderDashboard() {
  const totalAlat   = DB.equipment.length;
  const inUse       = DB.equipment.filter(e => e.status === 'In Use').length;
  const broken      = DB.equipment.filter(e => e.status === 'Broken').length;
  const maintenance = DB.equipment.filter(e => e.status === 'Under Maintenance').length;
  const ready       = DB.equipment.filter(e => e.status === 'Ready').length;
  const scrapped    = DB.equipment.filter(e => e.status === 'Scrapped').length;
  const inTransit   = DB.equipment.filter(e => e.status === 'In Transit').length;
  const utilisasi   = Math.round((inUse / totalAlat) * 100);
  const aktiveMob   = DB.mobilizations.filter(m => m.status === 'In Transit').length;

  // Early warnings
  const today  = new Date();
  const soon   = new Date(today); soon.setDate(today.getDate() + 60);
  const warnings = [];
  DB.equipment.forEach(e => {
    ['sia','silo','stnk'].forEach(cert => {
      if (e[cert]) {
        const d = new Date(e[cert]);
        if (d < today) warnings.push({ type:'critical', title:`${cert.toUpperCase()} Kadaluarsa`, msg:`${e.id} ${e.name}: ${cert.toUpperCase()} habis ${fmtDate(e[cert])}` });
        else if (d < soon) warnings.push({ type:'warning', title:`${cert.toUpperCase()} Hampir Habis`, msg:`${e.id} ${e.name}: ${cert.toUpperCase()} habis ${fmtDate(e[cert])}` });
      }
    });
  });
  DB.preventiveSchedule.filter(ps => ps.status !== 'Done').forEach(ps => {
    const d = new Date(ps.nextDueDate);
    if (d < soon) warnings.push({ type:'warning', title:'PM Jatuh Tempo', msg:`${ps.title} — ${getEquipmentName(ps.equipment)}: ${fmtDate(ps.nextDueDate)}` });
  });
  DB.parts.filter(p => p.stock < p.minStock).forEach(p => {
    warnings.push({ type:'critical', title:'Stok Part Kritis', msg:`${p.id} ${p.name}: stok ${p.stock} (min ${p.minStock})` });
  });

  // TCO top 5 (by buy price as proxy)
  const tco = [...DB.equipment].sort((a,b) => b.buyPrice - a.buyPrice).slice(0,5);
  const maxTco = tco[0]?.buyPrice || 1;

  const donutData = [
    { label: 'Ready',            val: ready,       color: 'var(--green)' },
    { label: 'In Use',           val: inUse,       color: 'var(--accent-amber)' },
    { label: 'In Transit',       val: inTransit,   color: 'var(--teal)' },
    { label: 'Under Maintenance',val: maintenance, color: 'var(--slate)' },
    { label: 'Broken',           val: broken,      color: 'var(--rust)' },
    { label: 'Scrapped',         val: scrapped,    color: 'var(--scrapped)' },
  ];
  const donutSVG = buildDonut(donutData, totalAlat);

  // Utilisasi per proyek (bar)
  const projUsage = DB.projects.map(p => {
    const used = DB.equipment.filter(e => e.location === p.id && e.status === 'In Use').length;
    const total = DB.equipment.filter(e => e.location === p.id).length || 1;
    return { name: p.code, pct: Math.round((used/total)*100) };
  });

  const html = `
    <div class="page-header">
      <div>
        <h1 class="page-header__title">Dashboard</h1>
        <p class="page-header__subtitle">Ringkasan operasional alat dan mesin PT GeoACE</p>
      </div>
      <div class="page-header__actions">
        <span class="u-color-muted u-small">Update: ${now()}</span>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-card__content">
          <div class="kpi-card__label">Total Alat</div>
          <div class="kpi-card__value">${totalAlat}</div>
          <div class="kpi-card__sub">Unit terdaftar</div>
        </div>
        <div class="kpi-card__icon kpi-card__icon--blue" aria-hidden="true">⚙️</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-card__content">
          <div class="kpi-card__label">Utilisasi</div>
          <div class="kpi-card__value">${utilisasi}%</div>
          <div class="kpi-card__sub">${inUse} unit In Use</div>
        </div>
        <div class="kpi-card__icon kpi-card__icon--amber" aria-hidden="true">📈</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-card__content">
          <div class="kpi-card__label">Alat Downtime</div>
          <div class="kpi-card__value" style="color:var(--rust)">${broken + maintenance}</div>
          <div class="kpi-card__sub">${broken} Broken · ${maintenance} Maintenance</div>
        </div>
        <div class="kpi-card__icon kpi-card__icon--rust" aria-hidden="true">⚠️</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-card__content">
          <div class="kpi-card__label">Mobilisasi Aktif</div>
          <div class="kpi-card__value" style="color:var(--teal)">${aktiveMob}</div>
          <div class="kpi-card__sub">Unit In Transit</div>
        </div>
        <div class="kpi-card__icon kpi-card__icon--green" aria-hidden="true">🚛</div>
      </div>
    </div>

    <!-- Charts row -->
    <div class="dashboard-grid" style="margin-bottom:var(--sp-2);">
      <div class="card">
        <div class="card__header">
          <span class="card__title">Status Alat</span>
          <span class="u-small u-color-muted">${totalAlat} unit total</span>
        </div>
        <div class="card__body">
          <div class="donut-wrap">
            ${donutSVG}
            <div class="donut-legend">
              ${donutData.map(d => `
                <div class="donut-legend__item">
                  <span class="donut-legend__dot" style="background:${d.color}" aria-hidden="true"></span>
                  <span class="donut-legend__label">${esc(d.label)}</span>
                  <span class="donut-legend__value">${d.val}</span>
                </div>`).join('')}
            </div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card__header">
          <span class="card__title">Utilisasi per Proyek</span>
        </div>
        <div class="card__body">
          <div class="bar-chart" aria-label="Grafik utilisasi per proyek">
            ${projUsage.map(p => `
              <div class="bar-chart__row">
                <div class="bar-chart__label">${esc(p.name)}</div>
                <div class="bar-chart__track" role="progressbar" aria-valuenow="${p.pct}" aria-valuemin="0" aria-valuemax="100">
                  <div class="bar-chart__fill" style="width:${p.pct}%"></div>
                </div>
                <div class="bar-chart__value">${p.pct}%</div>
              </div>`).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- TCO + Early Warning -->
    <div class="dashboard-grid">
      <div class="card">
        <div class="card__header">
          <span class="card__title">Top 5 TCO Alat</span>
          <span class="u-small u-color-muted">Berdasarkan nilai aset</span>
        </div>
        <div class="card__body" style="padding:0">
          <div class="table-wrapper">
            <table class="table" aria-label="TCO per alat">
              <thead><tr><th>ID Alat</th><th>Nama</th><th>Nilai Aset</th><th>Proporsi</th></tr></thead>
              <tbody>
                ${tco.map(e => `<tr>
                  <td data-label="ID Alat"><a href="#/alat/${e.id}" class="u-mono">${esc(e.id)}</a></td>
                  <td data-label="Nama">${esc(e.name)}</td>
                  <td data-label="Nilai">${fmtRp(e.buyPrice)}</td>
                  <td data-label="Proporsi">
                    <div class="tco-bar"><div class="tco-bar__fill" style="width:${Math.round((e.buyPrice/maxTco)*100)}%"></div></div>
                  </td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card__header">
          <span class="card__title">⚠ Early Warning</span>
          <span class="badge badge--critical">${warnings.filter(w=>w.type==='critical').length} Kritis</span>
        </div>
        <div class="card__body">
          <div class="warning-list" role="list">
            ${warnings.length === 0
              ? '<div class="empty-state"><div class="empty-state__icon">✅</div><p>Tidak ada peringatan aktif</p></div>'
              : warnings.slice(0,8).map(w => `
                <div class="alert alert--${w.type}" role="listitem">
                  <span class="alert__icon" aria-hidden="true">${w.type==='critical'?'🔴':'🟡'}</span>
                  <div class="alert__text">
                    <div class="alert__title">${esc(w.title)}</div>
                    <div class="alert__msg">${esc(w.msg)}</div>
                  </div>
                </div>`).join('')
            }
          </div>
        </div>
      </div>
    </div>`;

  $('#dashboard-content').innerHTML = html;
}

function buildDonut(data, total) {
  const size = 140, cx = 70, cy = 70, r = 50, stroke = 20;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  const segments = data.filter(d => d.val > 0).map(d => {
    const pct = d.val / total;
    const dash = circumference * pct;
    const seg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
      stroke="${d.color}" stroke-width="${stroke}"
      stroke-dasharray="${dash} ${circumference - dash}"
      stroke-dashoffset="${-offset}"
      transform="rotate(-90 ${cx} ${cy})"
      aria-label="${d.label}: ${d.val}"><title>${d.label}: ${d.val}</title></circle>`;
    offset += dash;
    return seg;
  });
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Donut chart status alat">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--border)" stroke-width="${stroke}"/>
    ${segments.join('')}
    <text x="${cx}" y="${cy - 6}" text-anchor="middle" font-size="18" font-weight="800" fill="var(--text-primary)">${total}</text>
    <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="10" fill="var(--text-muted)">unit</text>
  </svg>`;
}

// ══════════════════════════════════════════════════════════════
// SCREEN 2: DATABASE MESIN & ALAT
// ══════════════════════════════════════════════════════════════
let alatFilters = { q:'', type:'', status:'', condition:'', location:'' };

function renderAlat() {
  const types    = [...new Set(DB.equipment.map(e => e.type))].sort();
  const statuses = ['Ready','In Transit','In Use','Under Maintenance','Broken','Scrapped'];
  const conditions = ['Baik','Perlu perbaikan','Rusak ringan','Rusak berat'];

  const canAdd = ['Admin','Gudang','Manajemen'].includes(currentRole);

  const html = `
    <div class="page-header">
      <div>
        <h1 class="page-header__title">Database Mesin &amp; Alat</h1>
        <p class="page-header__subtitle">${DB.equipment.length} unit terdaftar</p>
      </div>
      ${canAdd ? `<div class="page-header__actions">
        <button class="btn btn--primary" id="btn-tambah-alat">➕ Tambah Alat</button>
      </div>` : ''}
    </div>
    <div class="filters" role="search" aria-label="Filter alat">
      <div class="filters__search">
        <span aria-hidden="true">🔍</span>
        <input type="search" id="alat-search" placeholder="Cari ID, nama, merk…" value="${esc(alatFilters.q)}" aria-label="Cari alat">
      </div>
      <select class="filters__select" id="alat-filter-type" aria-label="Filter jenis">
        <option value="">Semua Jenis</option>
        ${types.map(t => `<option value="${esc(t)}" ${alatFilters.type===t?'selected':''}>${esc(t)}</option>`).join('')}
      </select>
      <select class="filters__select" id="alat-filter-status" aria-label="Filter status">
        <option value="">Semua Status</option>
        ${statuses.map(s => `<option value="${esc(s)}" ${alatFilters.status===s?'selected':''}>${esc(s)}</option>`).join('')}
      </select>
      <select class="filters__select" id="alat-filter-condition" aria-label="Filter kondisi">
        <option value="">Semua Kondisi</option>
        ${conditions.map(c => `<option value="${esc(c)}" ${alatFilters.condition===c?'selected':''}>${esc(c)}</option>`).join('')}
      </select>
    </div>
    <div class="card">
      <div class="table-wrapper">
        <table class="table" id="alat-table" aria-label="Daftar alat">
          <thead>
            <tr>
              <th>ID Alat</th><th>Nama</th><th>Jenis</th><th>Merk/Tipe</th>
              <th>No. Seri</th><th>Status</th><th>Kondisi</th><th>Lokasi</th>
              <th>PIC</th><th>Hour Meter</th><th>Aksi</th>
            </tr>
          </thead>
          <tbody id="alat-tbody"></tbody>
        </table>
      </div>
    </div>`;

  $('#alat-content').innerHTML = html;
  renderAlatTable();

  $('#alat-search').addEventListener('input', function(){ alatFilters.q = this.value; renderAlatTable(); });
  $('#alat-filter-type').addEventListener('change', function(){ alatFilters.type = this.value; renderAlatTable(); });
  $('#alat-filter-status').addEventListener('change', function(){ alatFilters.status = this.value; renderAlatTable(); });
  $('#alat-filter-condition').addEventListener('change', function(){ alatFilters.condition = this.value; renderAlatTable(); });
  if (canAdd) $('#btn-tambah-alat')?.addEventListener('click', showTambahAlatModal);
}

function renderAlatTable() {
  const { q, type, status, condition } = alatFilters;
  const filtered = DB.equipment.filter(e => {
    const sq = q.toLowerCase();
    return (!q || e.id.toLowerCase().includes(sq) || e.name.toLowerCase().includes(sq) || e.brand.toLowerCase().includes(sq) || e.serial.toLowerCase().includes(sq))
      && (!type || e.type === type)
      && (!status || e.status === status)
      && (!condition || e.condition === condition);
  });

  const tbody = $('#alat-tbody');
  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="11"><div class="empty-state"><div class="empty-state__icon">🔍</div><p class="empty-state__title">Tidak ada data</p><p class="empty-state__text">Coba ubah filter pencarian</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(e => `
    <tr>
      <td data-label="ID"><a href="#/alat/${e.id}" class="u-mono u-fw-bold">${esc(e.id)}</a></td>
      <td data-label="Nama">${esc(e.name)}</td>
      <td data-label="Jenis"><span class="badge badge--info">${esc(e.type)}</span></td>
      <td data-label="Merk">${esc(e.brand)}</td>
      <td data-label="No. Seri" class="u-mono u-small">${esc(e.serial)}</td>
      <td data-label="Status">${statusBadge(e.status)}</td>
      <td data-label="Kondisi">${conditionBadge(e.condition)}</td>
      <td data-label="Lokasi">${esc(locationLabel(e))}</td>
      <td data-label="PIC">${esc(e.pic)}</td>
      <td data-label="HM">${fmt.format(e.hourMeter)} jam</td>
      <td>
        <a href="#/alat/${e.id}" class="btn btn--sm btn--ghost">Detail</a>
        ${e.status !== 'Scrapped' && ['Admin','Gudang','Manajemen'].includes(currentRole)
          ? `<button class="btn btn--sm btn--danger u-mt-1" onclick="hapusAlat('${e.id}')">Scrap</button>` : ''}
      </td>
    </tr>`).join('');
}

function hapusAlat(id) {
  const e = DB.equipment.find(x => x.id === id);
  if (!e) return;
  showConfirm(`Set status "${e.name}" menjadi Scrapped? Alat tidak akan dihapus dari sistem.`, () => {
    const old = e.status;
    e.status = 'Scrapped';
    e.condition = 'Rusak berat';
    GeoACE.saveState(DB);
    addAudit('UPDATE','Database Alat',id,'status',old,'Scrapped');
    showToast(`${id} diset Scrapped`, 'warning');
    renderAlatTable();
  }, 'Konfirmasi Scrap Alat', 'Ya, Scrap', true);
}

function showTambahAlatModal() {
  const types = [...new Set(DB.equipment.map(e => e.type))].sort();
  const body = `
    <form id="form-tambah-alat">
      <div class="form-section">
        <div class="form-section__title">Informasi Dasar</div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label form-label--required" for="ta-name">Nama Alat</label>
            <input class="form-control" id="ta-name" required placeholder="Nama lengkap alat">
          </div>
          <div class="form-group">
            <label class="form-label form-label--required" for="ta-type">Jenis</label>
            <input class="form-control" id="ta-type" list="ta-type-list" required placeholder="Jenis alat">
            <datalist id="ta-type-list">${types.map(t=>`<option value="${esc(t)}">`).join('')}</datalist>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label form-label--required" for="ta-brand">Merk/Tipe</label>
            <input class="form-control" id="ta-brand" required placeholder="Merk dan tipe">
          </div>
          <div class="form-group">
            <label class="form-label form-label--required" for="ta-serial">Nomor Seri</label>
            <input class="form-control" id="ta-serial" required placeholder="Nomor seri unik">
            <div class="form-error u-hidden" id="ta-serial-err">Nomor seri sudah digunakan</div>
          </div>
        </div>
      </div>
      <div class="form-section">
        <div class="form-section__title">Spesifikasi</div>
        <div class="form-row form-row--3">
          <div class="form-group">
            <label class="form-label" for="ta-power">Daya</label>
            <input class="form-control" id="ta-power" placeholder="cth: 100 kVA">
          </div>
          <div class="form-group">
            <label class="form-label" for="ta-fuel">BBM</label>
            <select class="form-control" id="ta-fuel">
              <option>Solar</option><option>Listrik</option><option>Baterai</option><option>-</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="ta-weight">Berat</label>
            <input class="form-control" id="ta-weight" placeholder="cth: 1.2 ton">
          </div>
        </div>
      </div>
      <div class="form-section">
        <div class="form-section__title">Legalitas & Finansial</div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label form-label--required" for="ta-buydate">Tanggal Beli</label>
            <input class="form-control" type="date" id="ta-buydate" required>
          </div>
          <div class="form-group">
            <label class="form-label form-label--required" for="ta-price">Nilai Aset (Rp)</label>
            <input class="form-control" type="number" id="ta-price" required placeholder="0">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label" for="ta-warranty">Garansi s/d</label>
            <input class="form-control" type="date" id="ta-warranty">
          </div>
          <div class="form-group">
            <label class="form-label" for="ta-ownership">Kepemilikan</label>
            <select class="form-control" id="ta-ownership">
              <option>Milik</option><option>Sewa</option>
            </select>
          </div>
        </div>
      </div>
    </form>`;

  openModal('Tambah Alat Baru', body,
    `<button class="btn btn--secondary" onclick="closeModal()">Batal</button>
     <button class="btn btn--primary" id="btn-save-alat">Simpan Alat</button>`, 'lg');

  $('#btn-save-alat').addEventListener('click', () => {
    const form = $('#form-tambah-alat');
    const serial = $('#ta-serial').value.trim();
    // Validate serial unique
    if (DB.equipment.find(e => e.serial === serial)) {
      $('#ta-serial').classList.add('form-control--error');
      $('#ta-serial-err').classList.remove('u-hidden');
      return;
    }
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const newId = 'ALT-' + String(DB.equipment.length + 1).padStart(3,'0');
    const newEq = {
      id: newId, name: $('#ta-name').value.trim(), type: $('#ta-type').value.trim(),
      brand: $('#ta-brand').value.trim(), serial, status: 'Ready', condition: 'Baik',
      location: null, warehouse: 'w1', pic: currentUser.name,
      hourMeter: 0, power: $('#ta-power').value, fuel: $('#ta-fuel').value,
      weight: $('#ta-weight').value, capacity: '-',
      buyDate: $('#ta-buydate').value, buyPrice: Number($('#ta-price').value),
      warranty: $('#ta-warranty').value, ownership: $('#ta-ownership').value,
      sia: null, silo: null, stnk: null,
    };
    DB.equipment.push(newEq);
    GeoACE.saveState(DB);
    addAudit('CREATE','Database Alat',newId,'status',null,'Ready');
    closeModal();
    showToast(`Alat ${newId} berhasil ditambahkan`, 'success');
    renderAlat();
  });
}

// ══════════════════════════════════════════════════════════════
// SCREEN 3: DETAIL ALAT
// ══════════════════════════════════════════════════════════════
function renderAlatDetail(id) {
  const eq = DB.equipment.find(e => e.id === id);
  if (!eq) {
    $('#alat-detail-content').innerHTML = `<div class="alert alert--critical"><span class="alert__icon">❌</span><div>Alat ${esc(id)} tidak ditemukan.</div></div>`;
    return;
  }

  const mutations = DB.mobilizations.filter(m => m.equipment === id);
  const wos = DB.workOrders.filter(w => w.equipment === id);

  const html = `
    <div class="page-header">
      <div>
        <a href="#/alat" class="btn btn--secondary btn--sm u-mb-2">← Kembali</a>
        <h1 class="page-header__title">${esc(eq.name)}</h1>
        <p class="page-header__subtitle">${esc(eq.id)} · ${esc(eq.brand)} · ${statusBadge(eq.status)} ${conditionBadge(eq.condition)}</p>
      </div>
      <div class="page-header__actions">
        <button class="btn btn--ghost btn--sm" onclick="printQR('${eq.id}')">🖨 Cetak QR Label</button>
      </div>
    </div>
    <div class="tabs" role="tablist" id="detail-tabs">
      <button class="tab tab--active" role="tab" aria-selected="true"  aria-controls="dtab-info"  data-tab="info">Info &amp; Spesifikasi</button>
      <button class="tab" role="tab" aria-selected="false" aria-controls="dtab-legal" data-tab="legal">Legalitas &amp; Finansial</button>
      <button class="tab" role="tab" aria-selected="false" aria-controls="dtab-mutasi" data-tab="mutasi">Riwayat Mutasi</button>
      <button class="tab" role="tab" aria-selected="false" aria-controls="dtab-maintenance" data-tab="maintenance">Riwayat Pemeliharaan</button>
      <button class="tab" role="tab" aria-selected="false" aria-controls="dtab-dokumen" data-tab="dokumen">Dokumen</button>
    </div>
    <div id="dtab-info" class="tab-panel tab-panel--active" role="tabpanel">
      <div class="card"><div class="card__body">
        <div class="form-row">
          <div>
            <table class="table">
              <tbody>
                ${infoRow('ID Alat',eq.id,'u-mono')}
                ${infoRow('Nama Alat',eq.name)}
                ${infoRow('Jenis',eq.type)}
                ${infoRow('Merk/Tipe',eq.brand)}
                ${infoRow('Nomor Seri',eq.serial,'u-mono')}
                ${infoRow('Status',statusBadge(eq.status))}
                ${infoRow('Kondisi',conditionBadge(eq.condition))}
                ${infoRow('Lokasi',locationLabel(eq))}
                ${infoRow('PIC',eq.pic)}
                ${infoRow('Hour Meter',fmt.format(eq.hourMeter)+' jam')}
              </tbody>
            </table>
          </div>
          <div>
            <table class="table">
              <tbody>
                ${infoRow('Daya',eq.power||'—')}
                ${infoRow('Kapasitas',eq.capacity||'—')}
                ${infoRow('BBM',eq.fuel||'—')}
                ${infoRow('Berat',eq.weight||'—')}
              </tbody>
            </table>
            <div class="u-mt-2">
              <div class="form-section__title u-mb-2" style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-secondary)">QR Code</div>
              ${buildQR(eq.id)}
              <div class="u-small u-color-muted u-mt-1">${esc(eq.id)} · ${esc(eq.serial)}</div>
            </div>
          </div>
        </div>
      </div></div>
    </div>
    <div id="dtab-legal" class="tab-panel" role="tabpanel">
      <div class="card"><div class="card__body">
        <table class="table"><tbody>
          ${infoRow('Tanggal Beli',fmtDate(eq.buyDate))}
          ${infoRow('Nilai Aset',fmtRp(eq.buyPrice))}
          ${infoRow('Garansi s/d',fmtDate(eq.warranty))}
          ${infoRow('Kepemilikan',eq.ownership)}
          ${infoRow('SIA s/d', eq.sia ? `${fmtDate(eq.sia)} ${isExpiredSoon(eq.sia)}` : '—')}
          ${infoRow('SILO s/d',eq.silo ? `${fmtDate(eq.silo)} ${isExpiredSoon(eq.silo)}` : '—')}
          ${infoRow('STNK',eq.stnk || '—')}
        </tbody></table>
      </div></div>
    </div>
    <div id="dtab-mutasi" class="tab-panel" role="tabpanel">
      <div class="card"><div class="card__body">
        ${mutations.length === 0
          ? '<div class="empty-state"><div class="empty-state__icon">🚛</div><p>Belum ada riwayat mutasi</p></div>'
          : `<div class="timeline">${mutations.map(m => `
              <div class="timeline__item">
                <div class="timeline__line"><div class="timeline__dot"></div><div class="timeline__connector"></div></div>
                <div class="timeline__content">
                  <div class="timeline__title">${m.id}: ${getWarehouseName(m.from)||getProjectName(m.from)} → ${getProjectName(m.to)||getWarehouseName(m.to)}</div>
                  <div class="timeline__meta">${fmtDate(m.requestDate)} · ${statusBadge(m.status)} · Driver: ${esc(m.driver||'—')}</div>
                </div>
              </div>`).join('')}</div>`
        }
      </div></div>
    </div>
    <div id="dtab-maintenance" class="tab-panel" role="tabpanel">
      <div class="card"><div class="card__body">
        ${wos.length === 0
          ? '<div class="empty-state"><div class="empty-state__icon">🔧</div><p>Belum ada riwayat pemeliharaan</p></div>'
          : `<div class="table-wrapper"><table class="table"><thead><tr><th>WO ID</th><th>Judul</th><th>Tipe</th><th>Status</th><th>Mulai</th><th>Selesai</th></tr></thead>
              <tbody>${wos.map(w => `<tr>
                <td class="u-mono">${esc(w.id)}</td>
                <td>${esc(w.title)}</td>
                <td><span class="badge badge--info">${esc(w.type)}</span></td>
                <td>${statusBadge(w.status)}</td>
                <td>${fmtDate(w.startDate)}</td>
                <td>${fmtDate(w.completedDate)}</td>
              </tr>`).join('')}</tbody></table></div>`
        }
      </div></div>
    </div>
    <div id="dtab-dokumen" class="tab-panel" role="tabpanel">
      <div class="card"><div class="card__body">
        <div class="empty-state">
          <div class="empty-state__icon">📄</div>
          <div class="empty-state__title">Manual &amp; Dokumen</div>
          <div class="empty-state__text">Upload manual PDF, sertifikat, dan dokumen lainnya</div>
          <button class="btn btn--secondary u-mt-1" onclick="showToast('Fitur upload dokumen tersedia dalam versi produksi','info')">📤 Upload Dokumen</button>
        </div>
      </div></div>
    </div>`;

  $('#alat-detail-content').innerHTML = html;

  // Tab switching
  $$('.tab', $('#alat-detail-content')).forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.tab', $('#alat-detail-content')).forEach(t => { t.classList.remove('tab--active'); t.setAttribute('aria-selected','false'); });
      $$('.tab-panel', $('#alat-detail-content')).forEach(p => p.classList.remove('tab-panel--active'));
      tab.classList.add('tab--active');
      tab.setAttribute('aria-selected','true');
      const panel = $(`#dtab-${tab.dataset.tab}`);
      if (panel) panel.classList.add('tab-panel--active');
    });
  });
}

function infoRow(label, value, extraClass='') {
  return `<tr><td class="u-fw-bold u-color-muted u-small" style="width:140px">${esc(label)}</td><td class="${extraClass}">${value}</td></tr>`;
}

function isExpiredSoon(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr), today = new Date();
  const diff = (d - today) / (1000*60*60*24);
  if (diff < 0) return `<span class="badge badge--broken">KADALUARSA</span>`;
  if (diff < 60) return `<span class="badge badge--warning">Hampir Habis</span>`;
  return '';
}

function buildQR(id) {
  // SVG QR placeholder grid (7×7 finder patterns)
  const cell = 8, size = 7;
  const rects = [];
  const pattern = [
    [1,1,1,1,1,1,1],[1,0,0,0,0,0,1],[1,0,1,1,1,0,1],[1,0,1,1,1,0,1],[1,0,1,1,1,0,1],[1,0,0,0,0,0,1],[1,1,1,1,1,1,1]
  ];
  for (let r=0;r<size;r++) for (let c=0;c<size;c++) {
    if (pattern[r][c]) rects.push(`<rect x="${c*cell}" y="${r*cell}" width="${cell}" height="${cell}" fill="var(--primary-dark)"/>`);
  }
  // Random data cells
  for (let r=0;r<size;r++) for (let c=0;c<size;c++) {
    if (r<size && c<size) continue; // skip
  }
  // Fill rest randomly but deterministically
  const hash = id.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
  for (let r=0;r<14;r++) for (let c=7;c<14;c++) {
    if ((hash + r*14 + c) % 3 === 0) rects.push(`<rect x="${c*cell}" y="${r*cell}" width="${cell}" height="${cell}" fill="var(--primary-dark)"/>`);
  }
  for (let r=7;r<14;r++) for (let c=0;c<7;c++) {
    if ((hash + r*7 + c) % 2 === 0) rects.push(`<rect x="${c*cell}" y="${r*cell}" width="${cell}" height="${cell}" fill="var(--primary-dark)"/>`);
  }
  const total = 14*cell;
  return `<div class="qr-placeholder" aria-label="QR Code ${esc(id)}">
    <svg width="${total}" height="${total}" viewBox="0 0 ${total} ${total}" role="img" aria-label="QR code placeholder untuk ${esc(id)}">
      <rect width="${total}" height="${total}" fill="white"/>
      ${rects.join('')}
    </svg>
  </div>`;
}

function printQR(id) {
  const eq = DB.equipment.find(e => e.id === id);
  if (!eq) return;
  const body = `
    <div class="surat-jalan" style="max-width:320px;margin:auto;text-align:center">
      <div style="font-size:12px;font-weight:700;margin-bottom:8px">PT GeoACE</div>
      ${buildQR(id)}
      <div style="font-size:16px;font-weight:800;margin-top:8px">${esc(eq.id)}</div>
      <div style="font-size:12px;">${esc(eq.name)}</div>
      <div style="font-size:11px;color:var(--text-muted)">${esc(eq.serial)}</div>
      <div style="font-size:11px;margin-top:4px">${statusBadge(eq.status)}</div>
    </div>`;
  openModal('Cetak QR Label', body, `<button class="btn btn--primary" onclick="window.print()">🖨 Print</button><button class="btn btn--secondary" onclick="closeModal()">Tutup</button>`,'sm');
}

// ══════════════════════════════════════════════════════════════
// SCREEN 4: KEBUTUHAN & MOBILISASI
// ══════════════════════════════════════════════════════════════
let mobActiveTab = 'list';

function renderMobilisasi() {
  const html = `
    <div class="page-header">
      <div>
        <h1 class="page-header__title">Kebutuhan &amp; Mobilisasi</h1>
        <p class="page-header__subtitle">Kelola permintaan dan pengiriman alat ke proyek</p>
      </div>
      <div class="page-header__actions">
        ${['PM Site','Manajemen','Admin'].includes(currentRole) ? `<button class="btn btn--primary" id="btn-new-mob">➕ Buat Permintaan</button>` : ''}
      </div>
    </div>
    <div class="tabs" role="tablist">
      <button class="tab ${mobActiveTab==='list'?'tab--active':''}" role="tab" data-tab="list">Daftar Permintaan</button>
      <button class="tab ${mobActiveTab==='stepper'?'tab--active':''}" role="tab" data-tab="stepper">Proses Mobilisasi</button>
      <button class="tab ${mobActiveTab==='sj'?'tab--active':''}" role="tab" data-tab="sj">Surat Jalan</button>
    </div>
    <div id="mob-tab-content"></div>`;
  $('#mobilisasi-content').innerHTML = html;

  $$('#mobilisasi-content .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('#mobilisasi-content .tab').forEach(t => { t.classList.remove('tab--active'); t.setAttribute('aria-selected','false'); });
      tab.classList.add('tab--active'); tab.setAttribute('aria-selected','true');
      mobActiveTab = tab.dataset.tab;
      renderMobTabContent();
    });
  });

  $('#btn-new-mob')?.addEventListener('click', showNewMobModal);
  renderMobTabContent();
}

function renderMobTabContent() {
  const el = $('#mob-tab-content');
  if (mobActiveTab === 'list')    { el.innerHTML = buildMobList(); bindMobActions(); }
  if (mobActiveTab === 'stepper') { renderMobStepper(el); }
  if (mobActiveTab === 'sj')      { el.innerHTML = buildSuratJalan(); }
}

function buildMobList() {
  return `<div class="card">
    <div class="table-wrapper">
      <table class="table" aria-label="Daftar mobilisasi">
        <thead><tr><th>ID</th><th>Alat</th><th>Dari</th><th>Ke</th><th>Tgl Request</th><th>Status</th><th>Driver</th><th>Aksi</th></tr></thead>
        <tbody>
          ${DB.mobilizations.map(m => {
            const eq = DB.equipment.find(e => e.id === m.equipment);
            return `<tr>
              <td class="u-mono u-fw-bold">${esc(m.id)}</td>
              <td><a href="#/alat/${m.equipment}">${esc(eq?.name||m.equipment)}</a></td>
              <td>${esc(getWarehouseName(m.from)||getProjectName(m.from))}</td>
              <td>${esc(getProjectName(m.to)||getWarehouseName(m.to))}</td>
              <td>${fmtDate(m.requestDate)}</td>
              <td>${statusBadge(m.status)}</td>
              <td>${esc(m.driver||'—')}</td>
              <td>
                ${m.status === 'Pending Approval' && ['Manajemen','Admin'].includes(currentRole)
                  ? `<button class="btn btn--sm btn--success" onclick="approveMob('${m.id}')">✓ Approve</button>
                     <button class="btn btn--sm btn--danger" onclick="rejectMob('${m.id}')">✗ Tolak</button>`
                  : ''}
                ${m.status === 'Approved' && ['Gudang','Admin','Manajemen'].includes(currentRole)
                  ? `<button class="btn btn--sm btn--teal" onclick="startCheckout('${m.id}')">Check-out</button>` : ''}
                ${m.status === 'In Transit' && ['Site Receiver','Admin','Manajemen'].includes(currentRole)
                  ? `<button class="btn btn--sm btn--primary" onclick="startCheckin('${m.id}')">Check-in</button>` : ''}
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function bindMobActions() {
  // bound via onclick attributes
}

function approveMob(id) {
  const m = DB.mobilizations.find(x => x.id === id);
  showConfirm(`Setujui mobilisasi ${id}?`, () => {
    m.status = 'Approved'; m.approvedBy = currentUser.name; m.approvedDate = now().slice(0,10);
    GeoACE.saveState(DB);
    addAudit('UPDATE','Mobilisasi',id,'status','Pending Approval','Approved');
    showToast(`${id} disetujui`, 'success');
    renderMobTabContent();
  });
}
function rejectMob(id) {
  const m = DB.mobilizations.find(x => x.id === id);
  showConfirm(`Tolak mobilisasi ${id}?`, () => {
    m.status = 'Rejected';
    GeoACE.saveState(DB);
    addAudit('UPDATE','Mobilisasi',id,'status','Pending Approval','Rejected');
    showToast(`${id} ditolak`, 'warning');
    renderMobTabContent();
  }, 'Konfirmasi Penolakan', 'Ya, Tolak', true);
}

function startCheckout(id) {
  const m = DB.mobilizations.find(x => x.id === id);
  const eq = DB.equipment.find(e => e.id === m.equipment);
  let signed = false;
  let photoUploaded = false;

  const body = `
    <div id="checkout-stepper">
      ${buildStepperHTML(2,5,['Permintaan','Check-out Gudang','Transit','Check-in Site','Selesai'])}
    </div>
    <div class="alert alert--info"><span class="alert__icon">ℹ️</span><div>
      <div class="alert__title">Check-out: ${esc(eq?.name)} (${esc(m.id)})</div>
      <div class="alert__msg">Lengkapi semua field sebelum proses check-out</div>
    </div></div>
    <form id="form-checkout">
      <div class="form-section">
        <div class="form-section__title">1. Scan QR Code</div>
        <div class="u-flex u-gap-1" style="align-items:center">
          ${buildQR(eq?.id||'')}
          <div>
            <button type="button" class="btn btn--teal" id="btn-scan-qr">📷 Simulasi Scan QR</button>
            <div id="scan-result" class="form-hint u-mt-1"></div>
          </div>
        </div>
      </div>
      <div class="form-section">
        <div class="form-section__title">2. Checklist Kondisi</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <label style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="chk-oli" ${m.checkoutOil?'checked':''}> Oli dalam kondisi baik</label>
          <label style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="chk-hyd" ${m.checkoutHydraulic?'checked':''}> Hidrolik dalam kondisi baik</label>
          <label style="display:flex;align-items:center;gap:8px"><input type="checkbox" id="chk-acc" ${m.checkoutAccessories?'checked':''}> Aksesoris lengkap</label>
        </div>
      </div>
      <div class="form-section">
        <div class="form-section__title">3. Hour Meter &amp; Driver</div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label form-label--required" for="co-hm">Hour Meter Keluar</label>
            <input class="form-control" type="number" id="co-hm" value="${m.hourMeterOut||eq?.hourMeter||0}" required>
          </div>
          <div class="form-group">
            <label class="form-label form-label--required" for="co-driver">Driver</label>
            <input class="form-control" id="co-driver" value="${esc(m.driver||'')}" required placeholder="Nama driver">
          </div>
        </div>
      </div>
      <div class="form-section">
        <div class="form-section__title">4. Foto Kondisi Alat</div>
        <button type="button" class="btn btn--secondary" id="btn-photo">📸 Upload Foto (Simulasi)</button>
        <div id="photo-result" class="form-hint u-mt-1"></div>
      </div>
      <div class="form-section">
        <div class="form-section__title">5. Tanda Tangan Driver</div>
        <canvas class="signature-pad" id="sig-canvas" aria-label="Area tanda tangan driver" width="400" height="100"></canvas>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button type="button" class="btn btn--secondary btn--sm" id="btn-clear-sig">Hapus</button>
          <span class="form-hint" id="sig-hint">Gambar tanda tangan di area abu-abu</span>
        </div>
      </div>
    </form>`;

  openModal('Check-out Gudang', body, `
    <button class="btn btn--secondary" onclick="closeModal()">Batal</button>
    <button class="btn btn--primary" id="btn-confirm-checkout">Konfirmasi Check-out</button>`, 'lg');

  // QR Scan simulation
  let qrScanned = false;
  $('#btn-scan-qr').addEventListener('click', () => {
    qrScanned = true;
    $('#btn-scan-qr').textContent = '✅ QR Terverifikasi';
    $('#btn-scan-qr').classList.replace('btn--teal','btn--success');
    $('#scan-result').textContent = `QR ${eq?.id} berhasil discan — ${now()}`;
  });

  // Photo simulation
  $('#btn-photo').addEventListener('click', () => {
    photoUploaded = true;
    $('#btn-photo').textContent = '✅ Foto Terupload';
    $('#photo-result').textContent = 'foto_kondisi_' + (eq?.id||'alat') + '.jpg';
  });

  // Signature canvas
  const canvas = $('#sig-canvas');
  const ctx = canvas.getContext('2d');
  let drawing = false;
  canvas.addEventListener('mousedown', e => { drawing=true; ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY); signed=false; });
  canvas.addEventListener('mousemove', e => { if(!drawing) return; ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke(); signed=true; });
  canvas.addEventListener('mouseup',   () => { drawing=false; if(signed) { canvas.classList.add('signature-pad--signed'); $('#sig-hint').textContent='✅ Tanda tangan terekam'; } });
  canvas.addEventListener('touchstart', e => { e.preventDefault(); drawing=true; const r=canvas.getBoundingClientRect(); ctx.beginPath(); ctx.moveTo(e.touches[0].clientX-r.left,e.touches[0].clientY-r.top); });
  canvas.addEventListener('touchmove', e => { e.preventDefault(); if(!drawing)return; const r=canvas.getBoundingClientRect(); ctx.lineTo(e.touches[0].clientX-r.left,e.touches[0].clientY-r.top); ctx.stroke(); signed=true; });
  canvas.addEventListener('touchend', () => { drawing=false; if(signed){ canvas.classList.add('signature-pad--signed'); } });
  $('#btn-clear-sig').addEventListener('click', () => { ctx.clearRect(0,0,canvas.width,canvas.height); signed=false; canvas.classList.remove('signature-pad--signed'); $('#sig-hint').textContent='Gambar tanda tangan di area abu-abu'; });

  $('#btn-confirm-checkout').addEventListener('click', () => {
    if (!qrScanned)    { showToast('Scan QR terlebih dahulu', 'error'); return; }
    if (!$('#chk-oli').checked || !$('#chk-hyd').checked || !$('#chk-acc').checked) { showToast('Checklist kondisi belum lengkap', 'error'); return; }
    if (!$('#co-hm').value)     { showToast('Isi Hour Meter', 'error'); return; }
    if (!$('#co-driver').value) { showToast('Isi nama driver', 'error'); return; }
    if (!photoUploaded)         { showToast('Upload foto kondisi alat', 'error'); return; }
    if (!signed)                { showToast('Tanda tangan driver diperlukan', 'error'); return; }

    m.status = 'In Transit';
    m.hourMeterOut = Number($('#co-hm').value);
    m.driver = $('#co-driver').value;
    m.checkoutOil = $('#chk-oli').checked;
    m.checkoutHydraulic = $('#chk-hyd').checked;
    m.checkoutAccessories = $('#chk-acc').checked;
    m.departureDate = now().slice(0,10);
    m.condition_sent = eq?.condition;
    if (eq) { const old=eq.status; eq.status='In Transit'; eq.location=null; eq.warehouse=null; addAudit('UPDATE','Database Alat',eq.id,'status',old,'In Transit'); }
    GeoACE.saveState(DB);
    addAudit('UPDATE','Mobilisasi',id,'status','Approved','In Transit');
    closeModal();
    showToast(`${id} berhasil check-out — status In Transit`, 'success');
    renderMobTabContent();
  });
}

function startCheckin(id) {
  const m = DB.mobilizations.find(x => x.id === id);
  const eq = DB.equipment.find(e => e.id === m.equipment);

  const body = `
    <div id="checkin-stepper">
      ${buildStepperHTML(4,5,['Permintaan','Check-out','Transit','Check-in Site','Selesai'])}
    </div>
    <div class="alert alert--info"><span class="alert__icon">ℹ️</span><div>
      <div class="alert__title">Check-in: ${esc(eq?.name)} (${esc(m.id)})</div>
      <div class="alert__msg">Kondisi dikirim: ${conditionBadge(m.condition_sent||'Baik')}</div>
    </div></div>
    <form id="form-checkin">
      <div class="form-section">
        <div class="form-section__title">Kondisi Tiba</div>
        <div class="form-group">
          <label class="form-label form-label--required" for="ci-cond">Kondisi Alat Saat Tiba</label>
          <select class="form-control" id="ci-cond" required>
            <option>Baik</option>
            <option>Perlu perbaikan</option>
            <option>Rusak ringan</option>
            <option>Rusak berat</option>
          </select>
        </div>
        <div id="discrepancy-block" class="u-hidden">
          <div class="alert alert--warning u-mt-1"><span class="alert__icon">⚠️</span><div class="alert__msg">Kondisi berbeda dengan saat pengiriman. Isi catatan perbedaan.</div></div>
          <div class="form-group u-mt-1">
            <label class="form-label form-label--required" for="ci-note">Catatan Perbedaan Kondisi</label>
            <textarea class="form-control" id="ci-note" rows="3" placeholder="Deskripsikan perbedaan kondisi…"></textarea>
          </div>
        </div>
      </div>
      <div class="form-section">
        <div class="form-section__title">Running Test</div>
        <label style="display:flex;align-items:center;gap:8px">
          <input type="checkbox" id="ci-running"> Alat berhasil dinyalakan dan berjalan normal
        </label>
      </div>
      <div class="form-section">
        <div class="form-section__title">Hour Meter Tiba</div>
        <div class="form-group">
          <label class="form-label" for="ci-hm">Hour Meter Saat Tiba</label>
          <input class="form-control" type="number" id="ci-hm" value="${m.hourMeterOut||0}">
        </div>
      </div>
    </form>`;

  openModal('Check-in Site', body, `
    <button class="btn btn--secondary" onclick="closeModal()">Batal</button>
    <button class="btn btn--primary" id="btn-confirm-checkin">Konfirmasi Check-in</button>`, 'lg');

  $('#ci-cond').addEventListener('change', function() {
    const diff = this.value !== (m.condition_sent || 'Baik');
    $('#discrepancy-block').classList.toggle('u-hidden', !diff);
  });

  $('#btn-confirm-checkin').addEventListener('click', () => {
    const cond = $('#ci-cond').value;
    const diff = cond !== (m.condition_sent || 'Baik');
    if (diff && !$('#ci-note').value.trim()) { showToast('Isi catatan perbedaan kondisi','error'); return; }

    m.status = 'Completed';
    m.condition_arrived = cond;
    m.running_test = $('#ci-running').checked;
    m.notes = $('#ci-note')?.value||'';
    if (eq) {
      const old = eq.status;
      eq.status = 'In Use';
      eq.location = m.to;
      eq.warehouse = null;
      eq.hourMeter = Number($('#ci-hm').value) || eq.hourMeter;
      eq.condition = cond;
      addAudit('UPDATE','Database Alat',eq.id,'status',old,'In Use');
    }
    GeoACE.saveState(DB);
    addAudit('UPDATE','Mobilisasi',id,'status','In Transit','Completed');
    closeModal();
    showToast(`${id} berhasil check-in — alat kini In Use di ${getProjectName(m.to)}`, 'success');
    renderMobTabContent();
  });
}

function buildStepperHTML(active, total, labels) {
  return `<div class="stepper" aria-label="Langkah proses mobilisasi">
    ${labels.map((lbl, i) => {
      const step = i+1;
      const cls = step < active ? 'stepper__step--done' : step === active ? 'stepper__step--active' : '';
      const circle = step < active ? '✓' : step;
      return `<div class="stepper__step ${cls}" aria-current="${step===active?'step':'false'}">
        <div class="stepper__circle">${circle}</div>
        <div class="stepper__label">${esc(lbl)}</div>
      </div>`;
    }).join('')}
  </div>`;
}

function renderMobStepper(el) {
  const activeMob = DB.mobilizations.find(m => m.status === 'In Transit' || m.status === 'Approved');
  if (!activeMob) {
    el.innerHTML = `<div class="alert alert--info"><span class="alert__icon">ℹ️</span><div>Tidak ada mobilisasi aktif yang sedang berjalan.</div></div>`;
    return;
  }
  const stepMap = { 'Pending Approval':1, 'Approved':2, 'In Transit':3, 'Completed':5 };
  const step = stepMap[activeMob.status] || 1;
  const eq = DB.equipment.find(e => e.id === activeMob.equipment);
  el.innerHTML = `
    <div class="card"><div class="card__body">
      ${buildStepperHTML(step,5,['Permintaan Site','Check-out Gudang','Transit','Check-in Site','Kembali/Selesai'])}
      <div class="alert alert--info u-mt-2"><span class="alert__icon">🚛</span><div>
        <div class="alert__title">${esc(activeMob.id)}: ${esc(eq?.name||activeMob.equipment)}</div>
        <div class="alert__msg">
          ${esc(getWarehouseName(activeMob.from)||getProjectName(activeMob.from))}
          → ${esc(getProjectName(activeMob.to)||getWarehouseName(activeMob.to))}<br>
          Status: ${statusBadge(activeMob.status)} · Driver: ${esc(activeMob.driver||'—')}<br>
          Keberangkatan: ${fmtDate(activeMob.departureDate)}
        </div>
      </div></div>
    </div></div>`;
}

function buildSuratJalan() {
  const mob = DB.mobilizations.find(m => m.status !== 'Pending Approval');
  if (!mob) return '<div class="alert alert--info"><span class="alert__icon">ℹ️</span><div>Tidak ada surat jalan yang dapat ditampilkan.</div></div>';
  const eq = DB.equipment.find(e => e.id === mob.equipment);
  return `
    <div class="surat-jalan" id="surat-jalan-print">
      <div class="surat-jalan__header">
        <div class="surat-jalan__logo-block">
          <h2>PT GeoACE</h2>
          <p>Logistic &amp; Machinery Management</p>
          <p>Jl. Industri Raya No. 12, Jakarta Utara</p>
        </div>
        <div class="surat-jalan__no">
          <div style="font-size:18px;font-weight:800;">SURAT JALAN</div>
          <div>${esc(mob.id)}</div>
          <div style="font-size:11px;color:var(--text-muted)">Tgl: ${fmtDate(mob.departureDate||mob.requestDate)}</div>
        </div>
      </div>
      <table class="table" style="margin:var(--sp-2) 0">
        <tbody>
          ${infoRow('ID Mobilisasi', mob.id)}
          ${infoRow('Alat', `${mob.equipment} — ${eq?.name||''}` )}
          ${infoRow('Dari', getWarehouseName(mob.from)||getProjectName(mob.from))}
          ${infoRow('Ke', getProjectName(mob.to)||getWarehouseName(mob.to))}
          ${infoRow('Driver', mob.driver||'—')}
          ${infoRow('Disetujui oleh', mob.approvedBy||'—')}
          ${infoRow('Status', statusBadge(mob.status))}
          ${infoRow('HM Keluar', mob.hourMeterOut ? fmt.format(mob.hourMeterOut)+' jam' : '—')}
        </tbody>
      </table>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-2);margin-top:var(--sp-3)">
        <div style="text-align:center;border-top:1px solid var(--border);padding-top:8px">
          <div style="font-size:11px;color:var(--text-muted)">Dikirim oleh</div>
          <div style="font-size:12px;font-weight:600;margin-top:32px">Staf Gudang</div>
        </div>
        <div style="text-align:center;border-top:1px solid var(--border);padding-top:8px">
          <div style="font-size:11px;color:var(--text-muted)">Diterima oleh</div>
          <div style="font-size:12px;font-weight:600;margin-top:32px">Site Receiver</div>
        </div>
      </div>
    </div>
    <div style="display:flex;gap:8px;margin-top:var(--sp-2)">
      <button class="btn btn--primary" onclick="window.print()">🖨 Print Surat Jalan</button>
    </div>`;
}

function showNewMobModal() {
  const readyEquip = DB.equipment.filter(e => e.status === 'Ready');
  if (!readyEquip.length) { showToast('Tidak ada alat dengan status Ready','warning'); return; }

  const body = `
    <form id="form-new-mob">
      <div class="alert alert--info"><span class="alert__icon">ℹ️</span><div class="alert__msg">Hanya alat berstatus <strong>Ready</strong> yang dapat dimobilisasi.</div></div>
      <div class="form-section u-mt-1">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label form-label--required" for="nm-equip">Pilih Alat</label>
            <select class="form-control" id="nm-equip" required>
              <option value="">— Pilih alat —</option>
              ${readyEquip.map(e => `<option value="${e.id}">${esc(e.id)} — ${esc(e.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label form-label--required" for="nm-to">Tujuan Proyek</label>
            <select class="form-control" id="nm-to" required>
              <option value="">— Pilih proyek —</option>
              ${DB.projects.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>
    </form>`;

  openModal('Buat Permintaan Mobilisasi', body, `
    <button class="btn btn--secondary" onclick="closeModal()">Batal</button>
    <button class="btn btn--primary" id="btn-save-mob">Kirim Permintaan</button>`, 'lg');

  $('#btn-save-mob').addEventListener('click', () => {
    const eq = $('#nm-equip').value;
    const to = $('#nm-to').value;
    if (!eq || !to) { showToast('Lengkapi semua field','error'); return; }

    const eqObj = DB.equipment.find(e => e.id === eq);
    // Business rule: only Ready
    if (eqObj.status !== 'Ready') { showToast('Alat tidak berstatus Ready','error'); return; }

    const newMob = {
      id: uid('MOB'), equipment: eq,
      from: eqObj.warehouse || eqObj.location || 'w1',
      to, requestBy: currentUser.name, requestDate: now().slice(0,10),
      approvedBy: null, approvedDate: null, driver: null,
      departureDate: null, estimatedArrival: null,
      status: 'Pending Approval',
      checkoutOil:false, checkoutHydraulic:false, checkoutAccessories:false,
      hourMeterOut:null, condition_sent:null, condition_arrived:null, running_test:null, notes:'',
    };
    DB.mobilizations.push(newMob);
    GeoACE.saveState(DB);
    addAudit('CREATE','Mobilisasi',newMob.id,'status',null,'Pending Approval');
    closeModal();
    showToast(`Permintaan ${newMob.id} dikirim — menunggu persetujuan`, 'success');
    renderMobTabContent();
  });
}

// ══════════════════════════════════════════════════════════════
// SCREEN 5: PEMELIHARAAN
// ══════════════════════════════════════════════════════════════
let mtnActiveTab = 'kanban';

function renderMaintenance() {
  const html = `
    <div class="page-header">
      <div>
        <h1 class="page-header__title">Pemeliharaan</h1>
        <p class="page-header__subtitle">Work order, laporan kerusakan, dan jadwal PM</p>
      </div>
      <div class="page-header__actions">
        ${['Mekanik','Gudang','Admin','Manajemen'].includes(currentRole) ? `<button class="btn btn--primary" id="btn-new-wo">➕ Lapor Kerusakan</button>` : ''}
        ${['Mekanik','Admin','Manajemen'].includes(currentRole) ? `<button class="btn btn--teal" id="btn-new-prev-wo">🔧 Buat WO Preventif</button>` : ''}
      </div>
    </div>
    <div class="tabs" role="tablist">
      <button class="tab ${mtnActiveTab==='kanban'?'tab--active':''}" data-tab="kanban">Kanban Work Order</button>
      <button class="tab ${mtnActiveTab==='damage'?'tab--active':''}" data-tab="damage">Laporan Kerusakan</button>
      <button class="tab ${mtnActiveTab==='schedule'?'tab--active':''}" data-tab="schedule">Jadwal PM</button>
    </div>
    <div id="mtn-tab-content"></div>`;
  $('#maintenance-content').innerHTML = html;

  $$('#maintenance-content .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('#maintenance-content .tab').forEach(t => { t.classList.remove('tab--active'); t.setAttribute('aria-selected','false'); });
      tab.classList.add('tab--active'); tab.setAttribute('aria-selected','true');
      mtnActiveTab = tab.dataset.tab;
      renderMtnTabContent();
    });
  });

  $('#btn-new-wo')?.addEventListener('click', showDamageReportModal);
  $('#btn-new-prev-wo')?.addEventListener('click', () => showCreateWOModal('Preventive'));
  renderMtnTabContent();
}

function renderMtnTabContent() {
  const el = $('#mtn-tab-content');
  if (mtnActiveTab === 'kanban')   renderKanban(el);
  if (mtnActiveTab === 'damage')   el.innerHTML = buildDamageList();
  if (mtnActiveTab === 'schedule') el.innerHTML = buildPMSchedule();
}

function renderKanban(el) {
  const cols = [
    { id:'Open',                 label:'Open',                 color:'var(--teal)' },
    { id:'In Progress',          label:'In Progress',          color:'var(--accent-amber)' },
    { id:'Menunggu Verifikasi',  label:'Menunggu Verifikasi',  color:'var(--slate)' },
    { id:'Selesai',              label:'Selesai',              color:'var(--green)' },
  ];
  el.innerHTML = `<div class="kanban" aria-label="Kanban Work Order">
    ${cols.map(col => {
      const wos = DB.workOrders.filter(w => w.status === col.id);
      return `<div class="kanban__col">
        <div class="kanban__col-header" style="border-left:3px solid ${col.color}">
          <span>${esc(col.label)}</span>
          <span class="badge badge--info">${wos.length}</span>
        </div>
        <div class="kanban__col-body">
          ${wos.length === 0 ? '<div class="u-color-muted u-small u-text-center" style="padding:8px">Kosong</div>' : ''}
          ${wos.map(w => {
            const eq = DB.equipment.find(e => e.id === w.equipment);
            return `<div class="kanban__card" onclick="openWODetail('${w.id}')" tabindex="0" role="button" aria-label="Work Order ${w.id}">
              <div class="kanban__card-title">${esc(w.id)}</div>
              <div class="kanban__card-meta">${esc(eq?.name||w.equipment)}</div>
              <div style="margin-top:4px">${statusBadge(w.priority)}</div>
              <div class="u-small u-color-muted u-mt-1">Mekanik: ${esc(w.mechanic)}</div>
            </div>`;
          }).join('')}
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

function openWODetail(id) {
  const w = DB.workOrders.find(x => x.id === id);
  if (!w) return;
  const eq = DB.equipment.find(e => e.id === w.equipment);
  const partsHtml = w.parts.map(p => {
    const pt = DB.parts.find(x => x.id === p.partId);
    return `<tr><td>${esc(p.partId)}</td><td>${esc(pt?.name||'—')}</td><td>${p.qty} ${esc(pt?.unit||'pcs')}</td></tr>`;
  }).join('');

  const canVerify   = ['Manajemen','Gudang','Admin'].includes(currentRole) && w.status === 'Menunggu Verifikasi';
  const canProgress = ['Mekanik','Admin'].includes(currentRole) && w.status === 'Open';
  const canFinish   = ['Mekanik','Admin'].includes(currentRole) && w.status === 'In Progress';

  const body = `
    <table class="table"><tbody>
      ${infoRow('WO ID',w.id,'u-mono')}
      ${infoRow('Alat', `<a href="#/alat/${w.equipment}">${esc(eq?.name||w.equipment)}</a>`)}
      ${infoRow('Tipe',w.type)} ${infoRow('Status',statusBadge(w.status))}
      ${infoRow('Prioritas',statusBadge(w.priority))}
      ${infoRow('Mekanik',w.mechanic)} ${infoRow('Workshop',w.workshop)}
      ${infoRow('Mulai',fmtDate(w.startDate))} ${infoRow('Deadline',fmtDate(w.dueDate))}
      ${infoRow('Selesai',fmtDate(w.completedDate))}
      ${infoRow('Diverifikasi',w.verifiedBy||'—')}
      ${infoRow('Catatan',w.notes)}
    </tbody></table>
    ${partsHtml ? `<div class="form-section__title u-mt-1" style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--text-secondary)">Suku Cadang Digunakan</div>
    <div class="table-wrapper"><table class="table"><thead><tr><th>Part ID</th><th>Nama</th><th>Qty</th></tr></thead><tbody>${partsHtml}</tbody></table></div>` : ''}`;

  const footer = `
    <button class="btn btn--secondary" onclick="closeModal()">Tutup</button>
    ${canProgress ? `<button class="btn btn--teal"    onclick="updateWOStatus('${id}','In Progress')">Mulai Pengerjaan</button>` : ''}
    ${canFinish   ? `<button class="btn btn--primary"  onclick="updateWOStatus('${id}','Menunggu Verifikasi')">Selesai — Minta Verifikasi</button>` : ''}
    ${canVerify   ? `<button class="btn btn--success"  onclick="verifyWO('${id}')">✓ Verifikasi &amp; Selesai</button>` : ''}`;

  openModal(`Detail Work Order: ${id}`, body, footer, 'lg');
}

function updateWOStatus(id, newStatus) {
  const w = DB.workOrders.find(x => x.id === id);
  if (!w) return;
  const old = w.status;
  w.status = newStatus;
  if (newStatus === 'In Progress') {
    const eq = DB.equipment.find(e => e.id === w.equipment);
    if (eq && eq.status !== 'Under Maintenance') {
      const eqOld = eq.status; eq.status = 'Under Maintenance';
      addAudit('UPDATE','Database Alat',eq.id,'status',eqOld,'Under Maintenance');
    }
  }
  if (newStatus === 'Menunggu Verifikasi') w.completedDate = now().slice(0,10);
  GeoACE.saveState(DB);
  addAudit('UPDATE','Work Order',id,'status',old,newStatus);
  closeModal();
  showToast(`WO ${id} diupdate ke ${newStatus}`, 'success');
  renderMtnTabContent();
}

function verifyWO(id) {
  const w = DB.workOrders.find(x => x.id === id);
  if (!w) return;
  showConfirm(`Verifikasi dan tutup WO ${id}? Alat akan kembali ke status Ready.`, () => {
    const old = w.status;
    w.status = 'Selesai';
    w.verifiedBy = currentUser.name;
    const eq = DB.equipment.find(e => e.id === w.equipment);
    if (eq) {
      const eqOld = eq.status; eq.status = 'Ready'; eq.condition = 'Baik';
      addAudit('UPDATE','Database Alat',eq.id,'status',eqOld,'Ready');
    }
    GeoACE.saveState(DB);
    addAudit('UPDATE','Work Order',id,'status',old,'Selesai');
    closeModal();
    showToast(`WO ${id} selesai dan terverifikasi — alat kembali Ready`, 'success');
    buildSidebar();
    renderMtnTabContent();
  }, 'Verifikasi Work Order', 'Ya, Verifikasi');
}

function buildDamageList() {
  return `<div class="card"><div class="table-wrapper">
    <table class="table" aria-label="Daftar laporan kerusakan">
      <thead><tr><th>ID</th><th>Alat</th><th>Gejala</th><th>Urgensi</th><th>Tanggal</th><th>Status</th><th>WO Terkait</th></tr></thead>
      <tbody>
        ${DB.damageReports.map(d => {
          const eq = DB.equipment.find(e => e.id === d.equipment);
          return `<tr>
            <td class="u-mono">${esc(d.id)}</td>
            <td><a href="#/alat/${d.equipment}">${esc(eq?.name||d.equipment)}</a></td>
            <td>${esc(d.symptom)}</td>
            <td>${statusBadge(d.urgency)}</td>
            <td>${fmtDate(d.reportDate)}</td>
            <td>${statusBadge(d.status)}</td>
            <td>${d.linkedWO ? `<button class="btn btn--sm btn--ghost" onclick="openWODetail('${d.linkedWO}')">${esc(d.linkedWO)}</button>` : '—'}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div></div>`;
}

function buildPMSchedule() {
  return `<div class="card"><div class="table-wrapper">
    <table class="table" aria-label="Jadwal PM">
      <thead><tr><th>ID</th><th>Alat</th><th>Judul</th><th>Interval (jam)</th><th>Terakhir</th><th>Jatuh Tempo</th><th>Status</th></tr></thead>
      <tbody>
        ${DB.preventiveSchedule.map(ps => {
          const eq = DB.equipment.find(e => e.id === ps.equipment);
          return `<tr>
            <td class="u-mono">${esc(ps.id)}</td>
            <td><a href="#/alat/${ps.equipment}">${esc(eq?.name||ps.equipment)}</a></td>
            <td>${esc(ps.title)}</td>
            <td>${fmt.format(ps.intervalHours)}</td>
            <td>${fmtDate(ps.lastDoneDate)}</td>
            <td>${fmtDate(ps.nextDueDate)}</td>
            <td>${statusBadge(ps.status)}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
  </div></div>`;
}

function showDamageReportModal() {
  const body = `
    <form id="form-damage">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label form-label--required" for="dr-equip">Alat</label>
          <select class="form-control" id="dr-equip" required>
            <option value="">— Pilih alat —</option>
            ${DB.equipment.filter(e => e.status !== 'Scrapped').map(e => `<option value="${e.id}">${esc(e.id)} — ${esc(e.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label form-label--required" for="dr-urgency">Urgensi</label>
          <select class="form-control" id="dr-urgency" required>
            <option>Low</option><option>Medium</option><option value="Critical">Critical</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label form-label--required" for="dr-symptom">Gejala Kerusakan</label>
        <textarea class="form-control" id="dr-symptom" rows="3" required placeholder="Deskripsikan gejala kerusakan secara detail…"></textarea>
      </div>
    </form>`;

  openModal('Laporan Kerusakan Baru', body, `
    <button class="btn btn--secondary" onclick="closeModal()">Batal</button>
    <button class="btn btn--danger" id="btn-save-damage">Laporkan Kerusakan</button>`);

  $('#btn-save-damage').addEventListener('click', () => {
    const form = $('#form-damage');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const eqId  = $('#dr-equip').value;
    const urgency = $('#dr-urgency').value;
    const eq = DB.equipment.find(e => e.id === eqId);

    const newDR = {
      id: uid('DR'), equipment: eqId, reporter: currentUser.name,
      symptom: $('#dr-symptom').value, urgency,
      reportDate: now().slice(0,10), photos: [], status: 'Dilaporkan', linkedWO: null,
    };
    DB.damageReports.push(newDR);
    addAudit('CREATE','Laporan Kerusakan',newDR.id,'status',null,'Dilaporkan');

    // Auto-create WO for Critical
    if (urgency === 'Critical' && eq) {
      const old = eq.status; eq.status = 'Broken'; eq.condition = 'Rusak berat';
      addAudit('UPDATE','Database Alat',eqId,'status',old,'Broken');
      showToast(`Urgensi Critical: status ${eqId} otomatis Broken`, 'warning');
    }

    // Auto-create WO
    const newWO = {
      id: uid('WO'), equipment: eqId, type:'Corrective',
      title: `Perbaikan ${eq?.name||eqId} — ${urgency}`,
      status:'Open', priority: urgency, mechanic: 'Cecep Nugraha',
      workshop:'Workshop Gudang Pusat', startDate: now().slice(0,10),
      dueDate: null, parts:[], notes: $('#dr-symptom').value,
      verifiedBy:null, completedDate:null, damageReport: newDR.id,
    };
    DB.workOrders.push(newWO);
    newDR.linkedWO = newWO.id; newDR.status = 'WO Dibuat';
    addAudit('CREATE','Work Order',newWO.id,'status',null,'Open');
    GeoACE.saveState(DB);

    closeModal();
    showToast(`Laporan ${newDR.id} berhasil dibuat, WO ${newWO.id} dibuat otomatis`, 'success');
    renderMtnTabContent();
  });
}

function showCreateWOModal(type) {
  const body = `
    <form id="form-create-wo">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label form-label--required" for="wo-equip">Alat</label>
          <select class="form-control" id="wo-equip" required>
            <option value="">— Pilih alat —</option>
            ${DB.equipment.filter(e => e.status !== 'Scrapped').map(e => `<option value="${e.id}">${esc(e.id)} — ${esc(e.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label form-label--required" for="wo-priority">Prioritas</label>
          <select class="form-control" id="wo-priority" required>
            <option>Low</option><option selected>Medium</option><option>High</option><option>Critical</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label form-label--required" for="wo-title">Judul WO</label>
        <input class="form-control" id="wo-title" required placeholder="Judul pekerjaan">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="wo-mechanic">Mekanik</label>
          <input class="form-control" id="wo-mechanic" value="${esc(currentUser.name)}" placeholder="Nama mekanik">
        </div>
        <div class="form-group">
          <label class="form-label" for="wo-due">Deadline</label>
          <input class="form-control" type="date" id="wo-due">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="wo-notes">Catatan</label>
        <textarea class="form-control" id="wo-notes" rows="2"></textarea>
      </div>
    </form>`;

  openModal(`Buat Work Order ${type}`, body, `
    <button class="btn btn--secondary" onclick="closeModal()">Batal</button>
    <button class="btn btn--primary" id="btn-save-wo">Buat WO</button>`);

  $('#btn-save-wo').addEventListener('click', () => {
    const form = $('#form-create-wo');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const newWO = {
      id: uid('WO'), equipment: $('#wo-equip').value, type,
      title: $('#wo-title').value, status:'Open',
      priority: $('#wo-priority').value,
      mechanic: $('#wo-mechanic').value||currentUser.name,
      workshop:'Workshop Gudang Pusat',
      startDate: now().slice(0,10), dueDate: $('#wo-due').value||null,
      parts:[], notes: $('#wo-notes').value,
      verifiedBy:null, completedDate:null, damageReport:null,
    };
    DB.workOrders.push(newWO);
    GeoACE.saveState(DB);
    addAudit('CREATE','Work Order',newWO.id,'status',null,'Open');
    closeModal();
    showToast(`WO ${newWO.id} berhasil dibuat`, 'success');
    renderMtnTabContent();
  });
}

// ══════════════════════════════════════════════════════════════
// SCREEN 6: SUKU CADANG
// ══════════════════════════════════════════════════════════════
function renderParts() {
  const lowStock = DB.parts.filter(p => p.stock < p.minStock);
  const html = `
    <div class="page-header">
      <div>
        <h1 class="page-header__title">Suku Cadang</h1>
        <p class="page-header__subtitle">${DB.parts.length} jenis part · ${lowStock.length} item stok kritis</p>
      </div>
      ${['Gudang','Admin','Manajemen'].includes(currentRole) ? `<div class="page-header__actions">
        <button class="btn btn--primary" id="btn-add-part">➕ Tambah Part</button>
      </div>` : ''}
    </div>
    ${lowStock.length > 0 ? `<div class="alert alert--critical u-mb-2"><span class="alert__icon">🔴</span><div>
      <div class="alert__title">${lowStock.length} item stok di bawah minimum</div>
      <div class="alert__msg">${lowStock.map(p => `${p.id} ${p.name}: ${p.stock}/${p.minStock}`).join(' · ')}</div>
    </div></div>` : ''}
    <div class="card">
      <div class="table-wrapper">
        <table class="table" aria-label="Daftar suku cadang">
          <thead><tr><th>Kode</th><th>Nama</th><th>Merk</th><th>Part Number</th><th>Stok</th><th>Min. Stok</th><th>Satuan</th><th>Lokasi Rak</th><th>Harga</th></tr></thead>
          <tbody>
            ${DB.parts.map(p => `
              <tr class="${p.stock < p.minStock ? 'table--low-stock' : ''}">
                <td class="u-mono u-fw-bold">${esc(p.id)}</td>
                <td>${esc(p.name)}</td>
                <td>${esc(p.brand)}</td>
                <td class="u-mono u-small">${esc(p.partNumber)}</td>
                <td><strong style="color:${p.stock < p.minStock ? 'var(--rust)' : 'var(--green)'}">${p.stock}</strong></td>
                <td>${p.minStock}</td>
                <td>${esc(p.unit)}</td>
                <td>${esc(p.rack)}</td>
                <td>${fmtRp(p.price)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`;

  $('#parts-content').innerHTML = html;
  $('#btn-add-part')?.addEventListener('click', showAddPartModal);
}

function showAddPartModal() {
  const body = `
    <form id="form-add-part">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label form-label--required" for="ap-name">Nama Part</label>
          <input class="form-control" id="ap-name" required>
        </div>
        <div class="form-group">
          <label class="form-label form-label--required" for="ap-brand">Merk</label>
          <input class="form-control" id="ap-brand" required>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="ap-pn">Part Number</label>
          <input class="form-control" id="ap-pn">
        </div>
        <div class="form-group">
          <label class="form-label" for="ap-rack">Lokasi Rak</label>
          <input class="form-control" id="ap-rack" placeholder="cth: A-01">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label form-label--required" for="ap-stock">Stok Awal</label>
          <input class="form-control" type="number" id="ap-stock" value="0" min="0" required>
        </div>
        <div class="form-group">
          <label class="form-label form-label--required" for="ap-minstock">Stok Minimum</label>
          <input class="form-control" type="number" id="ap-minstock" value="1" min="0" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="ap-unit">Satuan</label>
          <select class="form-control" id="ap-unit"><option>pcs</option><option>set</option><option>liter</option><option>meter</option><option>unit</option></select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="ap-price">Harga Satuan (Rp)</label>
        <input class="form-control" type="number" id="ap-price" value="0" min="0">
      </div>
    </form>`;

  openModal('Tambah Suku Cadang', body, `
    <button class="btn btn--secondary" onclick="closeModal()">Batal</button>
    <button class="btn btn--primary" id="btn-save-part">Simpan Part</button>`);

  $('#btn-save-part').addEventListener('click', () => {
    const form = $('#form-add-part');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const newId = 'SPC-' + String(DB.parts.length + 1).padStart(3,'0');
    DB.parts.push({
      id: newId, name: $('#ap-name').value, brand: $('#ap-brand').value,
      partNumber: $('#ap-pn').value, category: 'Umum',
      stock: Number($('#ap-stock').value), minStock: Number($('#ap-minstock').value),
      unit: $('#ap-unit').value, rack: $('#ap-rack').value,
      price: Number($('#ap-price').value),
    });
    GeoACE.saveState(DB);
    addAudit('CREATE','Suku Cadang',newId,'stock',null,String($('#ap-stock').value));
    closeModal();
    showToast(`Part ${newId} berhasil ditambahkan`, 'success');
    renderParts();
    buildSidebar();
  });
}

// ══════════════════════════════════════════════════════════════
// SCREEN 7: PEMBELIAN
// ══════════════════════════════════════════════════════════════
let bliActiveTab = 'pr';

function renderPembelian() {
  const pendingCount = DB.purchaseRequests.filter(p => p.status === 'Pending').length;
  const html = `
    <div class="page-header">
      <div>
        <h1 class="page-header__title">Pembelian</h1>
        <p class="page-header__subtitle">Purchase Request, Quotation, PO &amp; Penerimaan Barang</p>
      </div>
      <div class="page-header__actions">
        ${['Purchasing','Mekanik','Gudang','Admin'].includes(currentRole) ? `<button class="btn btn--primary" id="btn-new-pr">➕ Buat PR Baru</button>` : ''}
      </div>
    </div>
    <div class="tabs" role="tablist">
      <button class="tab ${bliActiveTab==='pr'?'tab--active':''}" data-tab="pr">Purchase Request${pendingCount > 0 ? ` <span class="badge badge--critical">${pendingCount}</span>` : ''}</button>
      <button class="tab ${bliActiveTab==='quotation'?'tab--active':''}" data-tab="quotation">Perbandingan Quotation</button>
      <button class="tab ${bliActiveTab==='po'?'tab--active':''}" data-tab="po">Purchase Order</button>
      <button class="tab ${bliActiveTab==='gr'?'tab--active':''}" data-tab="gr">Penerimaan Barang</button>
    </div>
    <div id="bli-tab-content"></div>`;
  $('#pembelian-content').innerHTML = html;

  $$('#pembelian-content .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('#pembelian-content .tab').forEach(t => { t.classList.remove('tab--active'); t.setAttribute('aria-selected','false'); });
      tab.classList.add('tab--active'); tab.setAttribute('aria-selected','true');
      bliActiveTab = tab.dataset.tab;
      renderBliTabContent();
    });
  });

  $('#btn-new-pr')?.addEventListener('click', showNewPRModal);
  renderBliTabContent();
}

function renderBliTabContent() {
  const el = $('#bli-tab-content');
  if (bliActiveTab === 'pr')        el.innerHTML = buildPRList();
  if (bliActiveTab === 'quotation') el.innerHTML = buildQuotationCompare();
  if (bliActiveTab === 'po')        el.innerHTML = buildPOList();
  if (bliActiveTab === 'gr')        el.innerHTML = buildGRList();
  if (bliActiveTab === 'pr') bindPRActions();
  if (bliActiveTab === 'po') bindPOActions();
  if (bliActiveTab === 'gr') bindGRActions();
}

function buildPRList() {
  return `<div class="card"><div class="table-wrapper">
    <table class="table" aria-label="Daftar purchase request">
      <thead><tr><th>ID PR</th><th>Judul</th><th>Diminta oleh</th><th>Tanggal</th><th>Prioritas</th><th>Status</th><th>PO Terkait</th><th>Aksi</th></tr></thead>
      <tbody>
        ${DB.purchaseRequests.map(pr => `<tr>
          <td class="u-mono u-fw-bold">${esc(pr.id)}</td>
          <td>${esc(pr.title)}</td>
          <td>${esc(pr.requestBy)}</td>
          <td>${fmtDate(pr.requestDate)}</td>
          <td>${statusBadge(pr.priority)}</td>
          <td>${statusBadge(pr.status)}</td>
          <td>${pr.linkedPO ? `<button class="btn btn--sm btn--ghost" onclick="showPODetail('${pr.linkedPO}')">${esc(pr.linkedPO)}</button>` : '—'}</td>
          <td>
            <button class="btn btn--sm btn--ghost" onclick="showPRDetail('${pr.id}')">Detail</button>
            ${pr.status === 'Pending' && ['Manajemen','Admin'].includes(currentRole)
              ? `<button class="btn btn--sm btn--success" onclick="approvePR('${pr.id}')">✓ Approve</button>
                 <button class="btn btn--sm btn--danger"  onclick="rejectPR('${pr.id}')">✗ Tolak</button>` : ''}
            ${pr.status === 'Approved' && !pr.linkedPO && ['Purchasing','Admin'].includes(currentRole)
              ? `<button class="btn btn--sm btn--teal" onclick="createPOFromPR('${pr.id}')">Buat PO</button>` : ''}
          </td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div></div>`;
}

function bindPRActions() {}

function showPRDetail(id) {
  const pr = DB.purchaseRequests.find(x => x.id === id);
  if (!pr) return;
  const total = pr.items.reduce((s,i) => s + i.qty * i.estimatedPrice, 0);
  const body = `
    <table class="table"><tbody>
      ${infoRow('PR ID',pr.id,'u-mono')} ${infoRow('Judul',pr.title)}
      ${infoRow('Diminta oleh',pr.requestBy)} ${infoRow('Departemen',pr.department)}
      ${infoRow('Tanggal',fmtDate(pr.requestDate))} ${infoRow('Status',statusBadge(pr.status))}
      ${infoRow('Disetujui',pr.approvedBy||'—')} ${infoRow('Catatan',pr.notes||'—')}
    </tbody></table>
    <div class="form-section__title u-mt-1" style="font-size:12px;font-weight:700;text-transform:uppercase;color:var(--text-secondary)">Item PR</div>
    <div class="table-wrapper"><table class="table"><thead><tr><th>Part</th><th>Qty</th><th>Est. Harga</th><th>Subtotal</th></tr></thead><tbody>
      ${pr.items.map(i => `<tr>
        <td>${esc(getPartName(i.partId))}</td>
        <td>${i.qty}</td>
        <td>${fmtRp(i.estimatedPrice)}</td>
        <td>${fmtRp(i.qty * i.estimatedPrice)}</td>
      </tr>`).join('')}
      <tr style="font-weight:700"><td colspan="3">Total Estimasi</td><td>${fmtRp(total)}</td></tr>
    </tbody></table></div>`;
  openModal(`Detail PR: ${id}`, body, `<button class="btn btn--secondary" onclick="closeModal()">Tutup</button>`, 'lg');
}

function approvePR(id) {
  const pr = DB.purchaseRequests.find(x => x.id === id);
  showConfirm(`Setujui PR ${id}: "${pr.title}"?`, () => {
    const old = pr.status; pr.status = 'Approved'; pr.approvedBy = currentUser.name; pr.approvedDate = now().slice(0,10);
    GeoACE.saveState(DB);
    addAudit('UPDATE','Purchase Request',id,'status',old,'Approved');
    showToast(`PR ${id} disetujui`, 'success');
    renderBliTabContent(); buildSidebar();
  });
}
function rejectPR(id) {
  const pr = DB.purchaseRequests.find(x => x.id === id);
  showConfirm(`Tolak PR ${id}?`, () => {
    const old = pr.status; pr.status = 'Rejected'; pr.approvedBy = currentUser.name;
    GeoACE.saveState(DB);
    addAudit('UPDATE','Purchase Request',id,'status',old,'Rejected');
    showToast(`PR ${id} ditolak`, 'warning');
    renderBliTabContent(); buildSidebar();
  }, 'Tolak PR', 'Ya, Tolak', true);
}

function createPOFromPR(prId) {
  const pr = DB.purchaseRequests.find(x => x.id === prId);
  if (!pr || pr.status !== 'Approved') { showToast('PR harus Approved untuk membuat PO','error'); return; }

  const body = `
    <div class="alert alert--info"><span class="alert__icon">ℹ️</span><div>Membuat PO dari ${esc(pr.title)}</div></div>
    <form id="form-po">
      <div class="form-row u-mt-1">
        <div class="form-group">
          <label class="form-label form-label--required" for="po-vendor">Vendor</label>
          <select class="form-control" id="po-vendor" required>
            <option value="">— Pilih vendor —</option>
            ${DB.vendors.map(v => `<option value="${v.id}">${esc(v.name)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label form-label--required" for="po-delivery">Est. Tanggal Terima</label>
          <input class="form-control" type="date" id="po-delivery" required>
        </div>
      </div>
    </form>`;

  openModal('Buat Purchase Order', body, `
    <button class="btn btn--secondary" onclick="closeModal()">Batal</button>
    <button class="btn btn--primary" id="btn-save-po">Buat PO</button>`);

  $('#btn-save-po').addEventListener('click', () => {
    const form = $('#form-po');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const newPO = {
      id: uid('PO'), pr: prId, vendor: $('#po-vendor').value,
      items: pr.items.map(i => ({ partId: i.partId, qty: i.qty, unitPrice: i.estimatedPrice })),
      orderDate: now().slice(0,10), deliveryDate: $('#po-delivery').value,
      status:'Ordered', total: pr.items.reduce((s,i) => s + i.qty*i.estimatedPrice, 0),
      grDate:null, grBy:null,
    };
    DB.purchaseOrders.push(newPO);
    pr.linkedPO = newPO.id;
    GeoACE.saveState(DB);
    addAudit('CREATE','Purchase Order',newPO.id,'status',null,'Ordered');
    closeModal();
    showToast(`PO ${newPO.id} berhasil dibuat`, 'success');
    renderBliTabContent();
  });
}

function buildQuotationCompare() {
  const qt1 = DB.quotations.filter(q => q.pr === 'PR-001');
  if (!qt1.length) return '<div class="empty-state"><div class="empty-state__icon">📋</div><p>Tidak ada data quotation</p></div>';
  const min = Math.min(...qt1.map(q => q.total));
  return `<div>
    <div class="form-section__title" style="font-size:14px;font-weight:700;margin-bottom:var(--sp-2)">Perbandingan Quotation — PR-001</div>
    <div class="quote-grid">
      ${qt1.map(q => `<div class="quote-card ${q.total === min ? 'quote-card--winner' : ''}">
        <div class="quote-card__header">
          <div class="quote-card__vendor">${esc(getVendorName(q.vendor))}</div>
          ${q.total === min ? '<span class="badge badge--approved">Terbaik</span>' : ''}
        </div>
        <div class="quote-card__body">
          ${q.items.map((i,idx) => `<div class="quote-row ${q.total === min ? 'quote-row--winner' : ''}">
            <span>${esc(getPartName(DB.purchaseRequests.find(x=>x.id==='PR-001')?.items[idx]?.partId||''))}</span>
            <span>${fmtRp(i.unitPrice)}</span>
          </div>`).join('')}
          <div style="padding:8px 0;font-weight:800;font-size:15px">Total: <span class="quote-card__total">${fmtRp(q.total)}</span></div>
          <div class="u-small u-color-muted">${esc(q.notes)}</div>
        </div>
      </div>`).join('')}
    </div>
  </div>`;
}

function buildPOList() {
  return `<div class="card"><div class="table-wrapper">
    <table class="table" aria-label="Daftar purchase order">
      <thead><tr><th>PO ID</th><th>PR</th><th>Vendor</th><th>Tgl Order</th><th>Est. Terima</th><th>Total</th><th>Status</th><th>Aksi</th></tr></thead>
      <tbody>
        ${DB.purchaseOrders.map(po => `<tr>
          <td class="u-mono u-fw-bold">${esc(po.id)}</td>
          <td class="u-mono">${esc(po.pr)}</td>
          <td>${esc(getVendorName(po.vendor))}</td>
          <td>${fmtDate(po.orderDate)}</td>
          <td>${fmtDate(po.deliveryDate)}</td>
          <td class="u-fw-bold">${fmtRp(po.total)}</td>
          <td>${statusBadge(po.status)}</td>
          <td>
            <button class="btn btn--sm btn--ghost" onclick="showPODetail('${po.id}')">Detail</button>
            ${po.status === 'Delivered' && !po.grDate && ['Gudang','Admin'].includes(currentRole)
              ? `<button class="btn btn--sm btn--success" onclick="processGR('${po.id}')">Terima Barang</button>` : ''}
          </td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div></div>`;
}

function bindPOActions(){}
function bindGRActions(){}

function showPODetail(id) {
  const po = DB.purchaseOrders.find(x => x.id === id);
  if (!po) return;
  const body = `
    <table class="table"><tbody>
      ${infoRow('PO ID',po.id,'u-mono')} ${infoRow('PR',po.pr,'u-mono')}
      ${infoRow('Vendor',getVendorName(po.vendor))} ${infoRow('Status',statusBadge(po.status))}
      ${infoRow('Tgl Order',fmtDate(po.orderDate))} ${infoRow('Est. Terima',fmtDate(po.deliveryDate))}
      ${infoRow('Tgl Diterima',fmtDate(po.grDate))} ${infoRow('Diterima oleh',po.grBy||'—')}
    </tbody></table>
    <div class="table-wrapper u-mt-2"><table class="table"><thead><tr><th>Part</th><th>Qty</th><th>Harga Satuan</th><th>Subtotal</th></tr></thead><tbody>
      ${po.items.map(i => `<tr>
        <td>${esc(getPartName(i.partId))}</td><td>${i.qty}</td>
        <td>${fmtRp(i.unitPrice)}</td><td>${fmtRp(i.qty*i.unitPrice)}</td>
      </tr>`).join('')}
      <tr style="font-weight:700"><td colspan="3">Total</td><td>${fmtRp(po.total)}</td></tr>
    </tbody></table></div>`;
  openModal(`Detail PO: ${id}`, body, `<button class="btn btn--secondary" onclick="closeModal()">Tutup</button>`, 'lg');
}

function processGR(poId) {
  const po = DB.purchaseOrders.find(x => x.id === poId);
  showConfirm(`Konfirmasi penerimaan barang PO ${poId}? Stok part akan diperbarui.`, () => {
    po.status = 'Received'; po.grDate = now().slice(0,10); po.grBy = currentUser.name;
    // Update stock
    po.items.forEach(item => {
      const p = DB.parts.find(x => x.id === item.partId);
      if (p) { p.stock += item.qty; }
    });
    GeoACE.saveState(DB);
    addAudit('UPDATE','Purchase Order',poId,'status','Delivered','Received');
    showToast(`Penerimaan barang ${poId} berhasil — stok diperbarui`, 'success');
    renderBliTabContent(); buildSidebar();
  });
}

function buildGRList() {
  const received = DB.purchaseOrders.filter(p => p.status === 'Received');
  if (!received.length) return '<div class="empty-state"><div class="empty-state__icon">📦</div><p class="empty-state__title">Belum ada penerimaan barang</p></div>';
  return `<div class="card"><div class="table-wrapper">
    <table class="table" aria-label="Penerimaan barang">
      <thead><tr><th>PO ID</th><th>Vendor</th><th>Total</th><th>Tgl Diterima</th><th>Diterima oleh</th></tr></thead>
      <tbody>
        ${received.map(po => `<tr>
          <td class="u-mono">${esc(po.id)}</td>
          <td>${esc(getVendorName(po.vendor))}</td>
          <td>${fmtRp(po.total)}</td>
          <td>${fmtDate(po.grDate)}</td>
          <td>${esc(po.grBy)}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div></div>`;
}

function showNewPRModal() {
  const body = `
    <form id="form-new-pr">
      <div class="form-group">
        <label class="form-label form-label--required" for="pr-title">Judul PR</label>
        <input class="form-control" id="pr-title" required placeholder="Judul permintaan pembelian">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label" for="pr-dept">Departemen</label>
          <select class="form-control" id="pr-dept">
            <option>Workshop</option><option>Gudang</option><option>Proyek</option><option>Kantor</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="pr-priority">Prioritas</label>
          <select class="form-control" id="pr-priority">
            <option>Low</option><option selected>Medium</option><option>High</option><option>Critical</option>
          </select>
        </div>
      </div>
      <div class="form-section">
        <div class="form-section__title">Item PR</div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label form-label--required" for="pr-part">Part</label>
            <select class="form-control" id="pr-part" required>
              <option value="">— Pilih part —</option>
              ${DB.parts.map(p => `<option value="${p.id}">${esc(p.id)} — ${esc(p.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label form-label--required" for="pr-qty">Jumlah</label>
            <input class="form-control" type="number" id="pr-qty" value="1" min="1" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="pr-price">Est. Harga (Rp)</label>
            <input class="form-control" type="number" id="pr-price" value="0" min="0">
          </div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label" for="pr-notes">Catatan</label>
        <textarea class="form-control" id="pr-notes" rows="2"></textarea>
      </div>
    </form>`;

  openModal('Buat Purchase Request Baru', body, `
    <button class="btn btn--secondary" onclick="closeModal()">Batal</button>
    <button class="btn btn--primary" id="btn-save-pr">Simpan PR</button>`, 'lg');

  $('#btn-save-pr').addEventListener('click', () => {
    const form = $('#form-new-pr');
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const newPR = {
      id: uid('PR'), title: $('#pr-title').value,
      requestBy: currentUser.name, department: $('#pr-dept').value,
      requestDate: now().slice(0,10), priority: $('#pr-priority').value,
      items: [{ partId: $('#pr-part').value, qty: Number($('#pr-qty').value), estimatedPrice: Number($('#pr-price').value) }],
      status: 'Pending', approvedBy:null, approvedDate:null, linkedPO:null,
      notes: $('#pr-notes').value,
    };
    DB.purchaseRequests.push(newPR);
    GeoACE.saveState(DB);
    addAudit('CREATE','Purchase Request',newPR.id,'status',null,'Pending');
    closeModal();
    showToast(`PR ${newPR.id} berhasil dibuat — menunggu persetujuan`, 'success');
    renderBliTabContent(); buildSidebar();
  });
}

// ══════════════════════════════════════════════════════════════
// SCREEN 8: LAPORAN
// ══════════════════════════════════════════════════════════════
let laporanType = 'stok';

function renderLaporan() {
  const html = `
    <div class="page-header">
      <div>
        <h1 class="page-header__title">Laporan</h1>
        <p class="page-header__subtitle">Export dan analisis data operasional alat</p>
      </div>
    </div>
    <div class="card" style="margin-bottom:var(--sp-2)">
      <div class="card__body">
        <div class="filters">
          <select class="filters__select" id="lap-type" aria-label="Jenis laporan">
            <option value="stok">Laporan Stok</option>
            <option value="kondisi">Laporan Kondisi Alat</option>
            <option value="out">Laporan Out Proyek</option>
            <option value="in">Laporan In Proyek</option>
            <option value="pembelian">Laporan Pembelian</option>
            <option value="kebutuhan">Laporan Kebutuhan</option>
          </select>
          <select class="filters__select" id="lap-proj" aria-label="Filter proyek">
            <option value="">Semua Proyek</option>
            ${DB.projects.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('')}
          </select>
          <select class="filters__select" id="lap-jenis" aria-label="Filter jenis alat">
            <option value="">Semua Jenis</option>
            ${[...new Set(DB.equipment.map(e=>e.type))].sort().map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('')}
          </select>
          <button class="btn btn--primary" id="btn-gen-report">Generate Laporan</button>
        </div>
      </div>
    </div>
    <div id="laporan-result"></div>`;

  $('#laporan-content').innerHTML = html;
  $('#btn-gen-report').addEventListener('click', generateReport);
  generateReport();
}

function generateReport() {
  const type  = $('#lap-type').value;
  const proj  = $('#lap-proj').value;
  const jenis = $('#lap-jenis').value;
  laporanType = type;

  let data = DB.equipment;
  if (proj)  data = data.filter(e => e.location === proj);
  if (jenis) data = data.filter(e => e.type === jenis);

  const titles = { stok:'Laporan Stok Alat', kondisi:'Laporan Kondisi Alat', out:'Laporan Out Proyek', in:'Laporan In Proyek', pembelian:'Laporan Pembelian', kebutuhan:'Laporan Kebutuhan' };

  let tableHtml = '';
  if (type === 'stok') {
    tableHtml = `<table class="table"><thead><tr><th>ID</th><th>Nama</th><th>Jenis</th><th>Status</th><th>Lokasi</th><th>HM</th></tr></thead><tbody>
      ${data.map(e => `<tr><td class="u-mono">${esc(e.id)}</td><td>${esc(e.name)}</td><td>${esc(e.type)}</td><td>${statusBadge(e.status)}</td><td>${esc(locationLabel(e))}</td><td>${fmt.format(e.hourMeter)}</td></tr>`).join('')}
    </tbody></table>`;
  } else if (type === 'kondisi') {
    tableHtml = `<table class="table"><thead><tr><th>ID</th><th>Nama</th><th>Kondisi</th><th>Status</th><th>PIC</th><th>Nilai Aset</th></tr></thead><tbody>
      ${data.map(e => `<tr><td class="u-mono">${esc(e.id)}</td><td>${esc(e.name)}</td><td>${conditionBadge(e.condition)}</td><td>${statusBadge(e.status)}</td><td>${esc(e.pic)}</td><td>${fmtRp(e.buyPrice)}</td></tr>`).join('')}
    </tbody></table>`;
  } else if (type === 'out' || type === 'in') {
    const mobs = DB.mobilizations.filter(m => type === 'out' ? m.departureDate : m.condition_arrived);
    tableHtml = `<table class="table"><thead><tr><th>MOB ID</th><th>Alat</th><th>Dari</th><th>Ke</th><th>Tgl</th><th>Status</th></tr></thead><tbody>
      ${mobs.map(m => { const eq=DB.equipment.find(e=>e.id===m.equipment); return `<tr><td class="u-mono">${esc(m.id)}</td><td>${esc(eq?.name||m.equipment)}</td><td>${esc(getWarehouseName(m.from)||getProjectName(m.from))}</td><td>${esc(getProjectName(m.to)||getWarehouseName(m.to))}</td><td>${fmtDate(m.departureDate||m.requestDate)}</td><td>${statusBadge(m.status)}</td></tr>`;}).join('')}
    </tbody></table>`;
  } else if (type === 'pembelian') {
    tableHtml = `<table class="table"><thead><tr><th>PO ID</th><th>PR</th><th>Vendor</th><th>Total</th><th>Status</th><th>Tgl Order</th></tr></thead><tbody>
      ${DB.purchaseOrders.map(po => `<tr><td class="u-mono">${esc(po.id)}</td><td>${esc(po.pr)}</td><td>${esc(getVendorName(po.vendor))}</td><td>${fmtRp(po.total)}</td><td>${statusBadge(po.status)}</td><td>${fmtDate(po.orderDate)}</td></tr>`).join('')}
    </tbody></table>`;
  } else if (type === 'kebutuhan') {
    tableHtml = `<table class="table"><thead><tr><th>PR ID</th><th>Judul</th><th>Diminta</th><th>Prioritas</th><th>Status</th></tr></thead><tbody>
      ${DB.purchaseRequests.map(pr => `<tr><td class="u-mono">${esc(pr.id)}</td><td>${esc(pr.title)}</td><td>${esc(pr.requestBy)}</td><td>${statusBadge(pr.priority)}</td><td>${statusBadge(pr.status)}</td></tr>`).join('')}
    </tbody></table>`;
  }

  $('#laporan-result').innerHTML = `
    <div class="card">
      <div class="card__header">
        <span class="card__title">${esc(titles[type])}</span>
        <div style="display:flex;gap:8px">
          <button class="btn btn--sm btn--secondary" onclick="exportCSV()">📥 Export Excel (CSV)</button>
          <button class="btn btn--sm btn--teal" onclick="showToast('PDF export tersimulasi — ${esc(titles[type])}.pdf','info')">📄 Export PDF</button>
        </div>
      </div>
      <div class="card__body" style="padding:0">
        <div class="table-wrapper">${tableHtml}</div>
      </div>
    </div>`;
}

function exportCSV() {
  const type = laporanType;
  let rows = [['ID','Nama','Status','Lokasi','HM']];
  DB.equipment.forEach(e => rows.push([e.id, e.name, e.status, locationLabel(e), e.hourMeter]));
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type:'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `geoace_laporan_${type}_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  showToast('File CSV berhasil diunduh', 'success');
}

// ══════════════════════════════════════════════════════════════
// SCREEN 9: MASTER DATA
// ══════════════════════════════════════════════════════════════
let masterTab = 'proyek';

function renderMaster() {
  const html = `
    <div class="page-header">
      <div>
        <h1 class="page-header__title">Master Data</h1>
        <p class="page-header__subtitle">Kelola data referensi sistem</p>
      </div>
    </div>
    <div class="tabs" role="tablist">
      <button class="tab ${masterTab==='proyek'?'tab--active':''}" data-tab="proyek">Proyek</button>
      <button class="tab ${masterTab==='gudang'?'tab--active':''}" data-tab="gudang">Gudang &amp; Lokasi</button>
      <button class="tab ${masterTab==='vendor'?'tab--active':''}" data-tab="vendor">Vendor</button>
      <button class="tab ${masterTab==='pengguna'?'tab--active':''}" data-tab="pengguna">Pengguna &amp; Approval</button>
      <button class="tab ${masterTab==='import'?'tab--active':''}" data-tab="import">Import Excel/CSV</button>
    </div>
    <div id="master-tab-content"></div>`;
  $('#master-content').innerHTML = html;
  $$('#master-content .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('#master-content .tab').forEach(t => { t.classList.remove('tab--active'); t.setAttribute('aria-selected','false'); });
      tab.classList.add('tab--active'); tab.setAttribute('aria-selected','true');
      masterTab = tab.dataset.tab;
      renderMasterTabContent();
    });
  });
  renderMasterTabContent();
}

function renderMasterTabContent() {
  const el = $('#master-tab-content');
  if (masterTab === 'proyek')   el.innerHTML = buildMasterTable('Proyek', DB.projects,  ['id','name','code','location','status','pm','start','end']);
  if (masterTab === 'gudang')   el.innerHTML = buildMasterTable('Gudang', DB.warehouses, ['id','name','code','city','keeper','address']);
  if (masterTab === 'vendor')   el.innerHTML = buildMasterTable('Vendor', DB.vendors,   ['id','name','city','contact','category','status']);
  if (masterTab === 'pengguna') el.innerHTML = buildMasterTable('Pengguna', DB.users,   ['id','name','role','avatar']);
  if (masterTab === 'import')   el.innerHTML = buildImportScreen();
}

function buildMasterTable(title, data, fields) {
  if (!data.length) return `<div class="empty-state"><div class="empty-state__icon">📋</div><p>Data ${title} kosong</p></div>`;
  return `<div class="card"><div class="table-wrapper">
    <table class="table" aria-label="Master ${title}">
      <thead><tr>${fields.map(f => `<th>${esc(f)}</th>`).join('')}</tr></thead>
      <tbody>
        ${data.map(row => `<tr>${fields.map(f => `<td>${esc(String(row[f]||'—'))}</td>`).join('')}</tr>`).join('')}
      </tbody>
    </table>
  </div></div>`;
}

function buildImportScreen() {
  return `
    <div class="card u-mb-2"><div class="card__body">
      <div class="upload-zone" id="import-zone" role="button" tabindex="0" aria-label="Area upload file Excel atau CSV">
        <div class="upload-zone__icon">📤</div>
        <div class="upload-zone__title">Upload File Excel / CSV</div>
        <div class="upload-zone__hint">Klik atau seret file .xlsx / .csv ke sini</div>
        <input type="file" id="import-file" accept=".csv,.xlsx" style="display:none" aria-label="Pilih file">
        <button class="btn btn--secondary u-mt-1" onclick="$('#import-file').click()">Pilih File</button>
      </div>
    </div></div>
    <div id="import-result"></div>`;
}

// ══════════════════════════════════════════════════════════════
// SCREEN 10: PENGATURAN & AUDIT LOG
// ══════════════════════════════════════════════════════════════
function renderPengaturan() {
  const html = `
    <div class="page-header">
      <div>
        <h1 class="page-header__title">Pengaturan &amp; Audit Log</h1>
        <p class="page-header__subtitle">Log aktivitas sistem dan pengaturan aplikasi</p>
      </div>
      <div class="page-header__actions">
        <button class="btn btn--danger btn--sm" id="btn-reset-data">↩ Reset Data Demo</button>
      </div>
    </div>
    <div class="tabs" role="tablist">
      <button class="tab tab--active" data-tab="audit">Audit Log</button>
      <button class="tab" data-tab="settings">Pengaturan</button>
    </div>
    <div id="pgtr-tab-content"></div>`;
  $('#pengaturan-content').innerHTML = html;

  $$('#pengaturan-content .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('#pengaturan-content .tab').forEach(t => { t.classList.remove('tab--active'); t.setAttribute('aria-selected','false'); });
      tab.classList.add('tab--active'); tab.setAttribute('aria-selected','true');
      const el = $('#pgtr-tab-content');
      if (tab.dataset.tab === 'audit')    el.innerHTML = buildAuditLog();
      if (tab.dataset.tab === 'settings') el.innerHTML = buildSettings();
    });
  });

  $('#btn-reset-data').addEventListener('click', () => {
    showConfirm('Reset semua data ke kondisi awal? Semua perubahan akan hilang.', () => {
      DB = GeoACE.resetState();
      showToast('Data berhasil direset ke kondisi awal', 'info');
      renderPengaturan();
      buildSidebar();
      updateNotifBadge();
    }, 'Reset Data Demo', 'Ya, Reset', true);
  });

  $('#pgtr-tab-content').innerHTML = buildAuditLog();
}

function buildAuditLog() {
  return `<div class="card"><div class="table-wrapper">
    <table class="table audit-row" aria-label="Audit log">
      <thead><tr><th>Waktu</th><th>Pengguna</th><th>Aksi</th><th>Modul</th><th>Record ID</th><th>Field</th><th>Nilai Lama</th><th>Nilai Baru</th></tr></thead>
      <tbody>
        ${DB.auditLog.map(a => `<tr>
          <td class="u-mono u-small">${esc(a.timestamp)}</td>
          <td>${esc(a.user)}</td>
          <td><span class="badge badge--${a.action==='CREATE'?'approved':a.action==='UPDATE'?'in-use':'broken'}">${esc(a.action)}</span></td>
          <td>${esc(a.module)}</td>
          <td class="u-mono u-small">${esc(a.recordId)}</td>
          <td>${esc(a.field)}</td>
          <td class="u-color-muted">${esc(a.oldValue||'—')}</td>
          <td class="u-fw-bold">${esc(a.newValue||'—')}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div></div>`;
}

function buildSettings() {
  return `<div class="card"><div class="card__body">
    <div class="form-section">
      <div class="form-section__title">Sesi Aktif</div>
      <table class="table"><tbody>
        ${infoRow('Pengguna',currentUser?.name||'—')}
        ${infoRow('Role',currentRole)}
        ${infoRow('Login',now())}
      </tbody></table>
    </div>
    <div class="form-section">
      <div class="form-section__title">Konfigurasi Sistem</div>
      <div class="alert alert--info"><span class="alert__icon">ℹ️</span><div class="alert__msg">Konfigurasi sistem tersedia untuk Admin. Fitur ini disimulasikan.</div></div>
      <div style="display:flex;flex-direction:column;gap:var(--sp-1);margin-top:var(--sp-1)">
        <button class="btn btn--secondary" onclick="showToast('Notifikasi email diaktifkan (simulasi)','success')">📧 Aktifkan Notifikasi Email</button>
        <button class="btn btn--secondary" onclick="showToast('Export audit log berhasil (simulasi)','info')">📋 Export Audit Log</button>
      </div>
    </div>
  </div></div>`;
}

// ══════════════════════════════════════════════════════════════
// INIT
// ══════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  // Show login, hide app
  $('#login-screen').style.display = '';
  $('#app').classList.remove('app--visible');

  // Keyboard navigation for modals
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if ($('#modal-overlay').classList.contains('modal-overlay--open')) closeModal();
      if ($('#confirm-overlay').classList.contains('modal-overlay--open')) {
        $('#confirm-overlay').classList.remove('modal-overlay--open');
        _confirmCb = null;
      }
    }
  });

  // Handle hash routing
  if (location.hash && location.hash !== '#/') {
    // Wait for login
  }
});

// Expose globals used in inline onclick (limited set)
window.openWODetail       = openWODetail;
window.updateWOStatus     = updateWOStatus;
window.verifyWO           = verifyWO;
window.approveMob         = approveMob;
window.rejectMob          = rejectMob;
window.startCheckout      = startCheckout;
window.startCheckin       = startCheckin;
window.hapusAlat          = hapusAlat;
window.printQR            = printQR;
window.approvePR          = approvePR;
window.rejectPR           = rejectPR;
window.createPOFromPR     = createPOFromPR;
window.showPRDetail       = showPRDetail;
window.showPODetail       = showPODetail;
window.processGR          = processGR;
window.closeModal         = closeModal;
window.exportCSV          = exportCSV;
window.showToast          = showToast;
