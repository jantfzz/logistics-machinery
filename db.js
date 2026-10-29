// =============================================================
// db.js — GeoACE Logistic & Machinery Management System
// Satu-satunya modul yang boleh membaca / menulis data.
// app.js memanggil fungsi di sini; tidak boleh akses data.js
// atau localStorage secara langsung.
//
// Mode "supabase": semua operasi lewat Supabase REST API.
// Mode "lokal"   : data dari data.js / localStorage.
// =============================================================

'use strict';

(function (global) {

  // ── Konfigurasi ──────────────────────────────────────────────
  const CFG   = global.GEOACE_CONFIG || {};
  const URL   = (CFG.SUPABASE_URL || '').replace(/\/$/, '');
  const KEY   = CFG.SUPABASE_KEY  || '';
  const BUCKET = CFG.STORAGE_BUCKET || 'geoace-bukti';
  const IS_SUPA = !!(URL && KEY);

  // Nama pengguna aktif ditetapkan app.js setelah login.
  let _currentUserName = 'sistem';

  /** Tetapkan nama pengguna aktif (dipanggil app.js setelah login). */
  function setCurrentUser(name) { _currentUserName = name || 'sistem'; }

  /** Kembalikan "supabase" atau "lokal". */
  function mode() { return IS_SUPA ? 'supabase' : 'lokal'; }

  // ── Waktu sync terakhir ──────────────────────────────────────
  let _lastSync = null;
  function lastSync() { return _lastSync; }

  // ── Tabel yang TIDAK memiliki kolom updated_by ───────────────
  const NO_UPDATED_BY = new Set([
    'stok_gudang', 'notifikasi',
    'permintaan_mobilisasi_item', 'purchase_request_item',
    'purchase_order_item', 'penawaran_vendor', 'kategori_barang',
  ]);

  // ── Header standar ───────────────────────────────────────────
  function _headers(extra = {}) {
    const h = { 'apikey': KEY, ...extra };
    // Hanya kirim Authorization jika key adalah JWT (legacy)
    if (KEY.startsWith('eyJ')) h['Authorization'] = `Bearer ${KEY}`;
    return h;
  }

  // ── Terjemahan error Supabase → Bahasa Indonesia ─────────────
  /**
   * Terima objek error JSON dari Supabase dan kembalikan
   * pesan yang siap ditampilkan kepada pengguna.
   * @param {object} err  - { code, message, details, hint }
   * @returns {string}
   */
  function translateError(err) {
    if (!err) return 'Terjadi kesalahan tidak diketahui.';
    const { code = '', message = '', details = '' } = err;
    const msg = String(message);

    if (code === 'P0001') return msg;   // pesan dari trigger, sudah Bahasa Indonesia

    if (code === '23505') return 'Data sudah ada. Nomor seri atau kode tidak boleh duplikat.';

    if (code === '23514') {
      // Petakan nama constraint → pesan Indonesia
      const MAP = {
        'ck_checkout_lengkap'  : 'Check-out belum lengkap: scan QR, checklist, hour meter, kondisi, foto, dan tanda tangan driver wajib diisi.',
        'ck_checkin_lengkap'   : 'Check-in belum lengkap: scan QR, kondisi, hour meter, dan running test wajib diisi.',
        'ck_discrepancy_note'  : 'Kondisi tiba berbeda dari kondisi kirim. Isi discrepancy note.',
        'ck_tanggal_masuk'     : 'Tanggal masuk tidak boleh lebih awal dari tanggal keluar.',
        'ck_hour_meter_mundur' : 'Hour meter masuk tidak boleh lebih kecil dari hour meter keluar.',
        'ck_wo_tanggal'        : 'Waktu selesai tidak boleh lebih awal dari waktu mulai.',
        'ck_wo_verifikasi'     : "Work order hanya bisa ditutup setelah diisi 'Dicheck oleh', waktu selesai, dan kondisi akhir.",
        'ck_scrapped_tanggal'  : 'Alat Scrapped wajib punya tanggal penghapusan.',
        'ck_stok_cukup'        : 'Stok part di gudang tidak cukup.',
      };
      for (const [k, v] of Object.entries(MAP)) {
        if (msg.includes(k) || (details && details.includes(k))) return v;
      }
      return 'Data tidak valid: ' + msg;
    }

    if (code === '23503') return 'Data referensi tidak ditemukan (proyek, gudang, alat, atau vendor).';
    if (code === '42501') return 'Anda tidak punya akses untuk aksi ini.';

    return msg || 'Terjadi kesalahan pada server.';
  }

  // ── Antrian offline (localStorage) ──────────────────────────
  const QUEUE_KEY = 'geoace_sync_queue';

  function _loadQueue() {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]'); } catch { return []; }
  }
  function _saveQueue(q) {
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch {}
  }
  /** Kembalikan semua item antrean sinkronisasi. */
  function getQueue() { return _loadQueue(); }

  /** Hapus satu item dari antrean berdasarkan id. */
  function removeFromQueue(id) {
    _saveQueue(_loadQueue().filter(item => item.id !== id));
    _notifyQueueChange();
  }

  function _enqueue(method, path, body) {
    const q = _loadQueue();
    q.push({ id: Date.now() + '-' + Math.random().toString(36).slice(2, 6),
             method, path, body, waktu: new Date().toISOString(), gagal: false, pesanGagal: '' });
    _saveQueue(q);
    _notifyQueueChange();
  }

  /** Callback yang di-set app.js agar badge offline diperbarui. */
  let _onQueueChange = null;
  function onQueueChange(cb) { _onQueueChange = cb; }
  function _notifyQueueChange() { if (_onQueueChange) _onQueueChange(_loadQueue()); }

  // ── Permintaan HTTP inti ─────────────────────────────────────
  /**
   * Kirim permintaan HTTP ke Supabase REST API.
   * @param {'GET'|'POST'|'PATCH'|'DELETE'} method
   * @param {string} path   - path relatif dari /rest/v1/, mis. "alat?select=*"
   * @param {object|null} body  - objek yang akan di-JSON.stringify
   * @param {object} extraHeaders - header tambahan
   * @returns {Promise<any>}   - array atau objek hasil; lempar Error bila gagal
   */
  async function request(method, path, body = null, extraHeaders = {}) {
    if (!IS_SUPA) throw Object.assign(new Error('Mode lokal aktif.'), { localOnly: true });

    const ac = new AbortController();
    const tid = setTimeout(() => ac.abort(), 8000);

    const heads = _headers({ ...extraHeaders });
    if (body && (method === 'POST' || method === 'PATCH')) {
      heads['Content-Type'] = 'application/json';
      heads['Prefer'] = 'return=representation';
    }
    if (method === 'GET') {
      heads['Accept'] = 'application/json';
    }

    try {
      const res = await fetch(`${URL}/rest/v1/${path}`, {
        method,
        headers: heads,
        body: body ? JSON.stringify(body) : undefined,
        signal: ac.signal,
      });
      clearTimeout(tid);

      // Supabase kembalikan 200/201/204; error adalah 4xx/5xx dengan JSON
      if (!res.ok) {
        let errObj = {};
        try { errObj = await res.json(); } catch {}
        const msg = translateError(errObj);
        throw Object.assign(new Error(msg), { supabaseError: errObj, status: res.status });
      }

      if (res.status === 204) return null;
      return await res.json();
    } catch (e) {
      clearTimeout(tid);
      if (e.name === 'AbortError') {
        const ne = new Error('Koneksi ke server timeout. Periksa jaringan Anda.');
        ne.isNetwork = true;
        throw ne;
      }
      if (e.isNetwork || e.localOnly) throw e;
      // Kesalahan jaringan (fetch gagal tanpa respons)
      if (!e.supabaseError) {
        const ne = new Error('Tidak dapat terhubung ke server. Data akan disimpan lokal.');
        ne.isNetwork = true;
        throw ne;
      }
      throw e;
    }
  }

  // ── Operasi CRUD ─────────────────────────────────────────────

  /**
   * Ambil banyak baris dari tabel.
   * @param {string} table  - nama tabel, mis. "alat"
   * @param {string} [query] - query string PostgREST, mis. "select=*&status=eq.Ready&order=id_alat"
   * @returns {Promise<object[]>}
   */
  async function list(table, query = 'select=*') {
    return request('GET', `${table}?${query}`);
  }

  /**
   * Ambil satu baris berdasarkan primary key.
   * @param {string} table
   * @param {string} pkColumn  - nama kolom PK, mis. "id_alat"
   * @param {string|number} id
   * @returns {Promise<object>}
   */
  async function get(table, pkColumn, id) {
    const rows = await request('GET', `${table}?${pkColumn}=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    return Array.isArray(rows) ? rows[0] : rows;
  }

  /**
   * Sisipkan baris baru; otomatis menambahkan updated_by.
   * @param {string} table
   * @param {object} row
   * @returns {Promise<object>}  - baris yang disimpan (dari Prefer: return=representation)
   */
  async function insert(table, row) {
    const payload = { ...row };
    if (!NO_UPDATED_BY.has(table)) payload.updated_by = _currentUserName;
    const result = await request('POST', table, payload);
    return Array.isArray(result) ? result[0] : result;
  }

  /**
   * Perbarui baris berdasarkan primary key; otomatis menambahkan updated_by.
   * @param {string} table
   * @param {string} pkColumn
   * @param {string|number} id
   * @param {object} changes
   * @returns {Promise<object>}
   */
  async function update(table, pkColumn, id, changes) {
    const payload = { ...changes };
    if (!NO_UPDATED_BY.has(table)) payload.updated_by = _currentUserName;
    const result = await request('PATCH', `${table}?${pkColumn}=eq.${encodeURIComponent(id)}`, payload);
    return Array.isArray(result) ? result[0] : result;
  }

  /**
   * Ambil baris dari sebuah view.
   * @param {string} name   - nama view, mis. "v_dashboard_kpi"
   * @param {string} [query]
   * @returns {Promise<object[]>}
   */
  async function view(name, query = 'select=*') {
    return request('GET', `${name}?${query}`);
  }

  // ── Upload file ke Storage ───────────────────────────────────
  /**
   * Upload File atau Blob ke bucket geoace-bukti.
   * @param {'foto'|'ttd'} folder - sub-folder di dalam bucket
   * @param {File|Blob} file
   * @returns {Promise<string>} URL publik file yang diunggah
   */
  async function uploadFile(folder, file) {
    if (!IS_SUPA) throw Object.assign(new Error('Upload hanya tersedia di mode Supabase.'), { localOnly: true });

    const name = (file instanceof File ? file.name : 'blob') || 'file';
    const path = `${folder}/${Date.now()}-${name}`;
    const storageUrl = `${URL}/storage/v1/object/${BUCKET}/${path}`;

    const heads = _headers({ 'Content-Type': file.type || 'application/octet-stream' });
    const ac = new AbortController();
    const tid = setTimeout(() => ac.abort(), 15000);

    try {
      const res = await fetch(storageUrl, {
        method: 'POST',
        headers: heads,
        body: file,
        signal: ac.signal,
      });
      clearTimeout(tid);
      if (!res.ok) {
        let errObj = {};
        try { errObj = await res.json(); } catch {}
        throw new Error(translateError(errObj) || 'Gagal mengunggah file.');
      }
      return `${URL}/storage/v1/object/public/${BUCKET}/${path}`;
    } catch (e) {
      clearTimeout(tid);
      if (e.name === 'AbortError') throw new Error('Upload timeout. Periksa jaringan Anda.');
      throw e;
    }
  }

  // ── Tes koneksi ──────────────────────────────────────────────
  /**
   * Ping Supabase dengan query ringan; kembalikan true bila berhasil.
   * @returns {Promise<boolean>}
   */
  async function ping() {
    if (!IS_SUPA) return false;
    try {
      await request('GET', 'proyek?select=kode_proyek&limit=1');
      _lastSync = new Date();
      return true;
    } catch { return false; }
  }

  // ── Replay antrean offline ───────────────────────────────────
  /**
   * Kirim ulang semua item antrean ke Supabase secara berurutan.
   * Item dengan error database (bukan network) ditandai gagal.
   */
  async function replayQueue() {
    if (!IS_SUPA) return;
    const q = _loadQueue();
    if (!q.length) return;

    for (const item of q) {
      if (item.gagal) continue;   // sudah gagal permanen, biarkan user hapus manual
      try {
        // Foto data-URL diunggah terlebih dahulu
        if (item.method === '_UPLOAD_PHOTO') {
          const blob = await _dataURLtoBlob(item.body.dataURL);
          const url  = await uploadFile(item.body.folder, blob);
          // Perbarui referensi di item berikutnya yang punya placeholder yang sama
          const ph = item.body.placeholder;
          for (const other of q) {
            if (other.body && typeof other.body === 'object') {
              _replacePlaceholder(other.body, ph, url);
            }
          }
          _removeQueueItemById(item.id);
          continue;
        }
        await request(item.method, item.path, item.body);
        _removeQueueItemById(item.id);
        _lastSync = new Date();
      } catch (e) {
        if (e.isNetwork) break;   // masih offline, hentikan
        // Error database permanen → tandai gagal
        item.gagal = true;
        item.pesanGagal = e.message;
      }
    }
    _saveQueue(_loadQueue());   // tulis ulang setelah modifikasi
    _notifyQueueChange();
  }

  function _removeQueueItemById(id) {
    _saveQueue(_loadQueue().filter(i => i.id !== id));
  }

  function _replacePlaceholder(obj, placeholder, value) {
    for (const k of Object.keys(obj)) {
      if (obj[k] === placeholder) obj[k] = value;
    }
  }

  async function _dataURLtoBlob(dataURL) {
    const res = await fetch(dataURL);
    return res.blob();
  }

  /**
   * Tambahkan upload foto ke antrean offline (simpan sebagai data-URL).
   * @param {'foto'|'ttd'} folder
   * @param {string} dataURL
   * @param {string} placeholder  - nilai sementara yang disimpan di row body
   */
  function enqueuePhoto(folder, dataURL, placeholder) {
    const q = _loadQueue();
    q.unshift({
      id: Date.now() + '-photo-' + Math.random().toString(36).slice(2, 5),
      method: '_UPLOAD_PHOTO',
      path: null,
      body: { folder, dataURL, placeholder },
      waktu: new Date().toISOString(),
      gagal: false, pesanGagal: '',
    });
    _saveQueue(q);
  }

  /**
   * Tambahkan operasi tulis ke antrean sinkronisasi.
   * Dipanggil oleh app.js ketika write gagal karena network.
   * @param {'POST'|'PATCH'} method
   * @param {string} path
   * @param {object} body
   */
  function enqueueWrite(method, path, body) {
    _enqueue(method, path, body);
  }

  // ── Loader data saat startup ─────────────────────────────────
  /**
   * Muat semua data master dari Supabase.
   * Kembalikan objek dengan kunci yang sama dengan data.js
   * agar app.js bisa langsung menggantinya.
   * @returns {Promise<object>}
   */
  async function loadAll() {
    const [
      projects, warehouses, vendors, users, equipment,
      parts, stockRows, workOrders, damageReports,
      mobilizations, purchaseRequests, purchaseOrders,
      quotations, preventiveSchedule, notifications,
    ] = await Promise.all([
      list('proyek', 'select=*&order=kode_proyek'),
      list('gudang_lokasi', 'select=*&order=kode_gudang'),
      list('vendor', 'select=*&order=kode_vendor'),
      list('pengguna', 'select=*&order=id_pengguna'),
      list('alat', 'select=*&order=id_alat'),
      list('barang_part', 'select=*&order=kode_barang'),
      list('stok_gudang', 'select=*'),
      list('work_order', 'select=*&order=no_wo'),
      list('laporan_kerusakan', 'select=*&order=tanggal.desc'),
      list('mutasi_alat', 'select=*&order=no_mutasi'),
      list('purchase_request', 'select=*&order=no_pr.desc'),
      list('purchase_order', 'select=*&order=no_po.desc'),
      list('penawaran_vendor', 'select=*&order=id'),
      list('jadwal_pm', 'select=*&order=id'),
      list('notifikasi', 'select=*&order=record_time.desc&limit=50'),
    ]);
    _lastSync = new Date();
    return { projects, warehouses, vendors, users, equipment, parts,
             stockRows, workOrders, damageReports, mobilizations,
             purchaseRequests, purchaseOrders, quotations,
             preventiveSchedule, notifications };
  }

  // ── Ekspor ───────────────────────────────────────────────────
  global.DB_API = {
    mode, setCurrentUser, lastSync,
    request, list, get, insert, update, view,
    uploadFile, ping,
    getQueue, removeFromQueue, enqueueWrite, enqueuePhoto,
    onQueueChange, replayQueue,
    loadAll,
    translateError,
  };

}(window));
