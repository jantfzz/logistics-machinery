// =============================================================
// config.js — GeoACE Logistic & Machinery Management System
// Isi SUPABASE_URL dan SUPABASE_KEY untuk mode database.
// Kosongkan keduanya agar app berjalan dalam mode lokal.
// JANGAN pernah simpan service_role / secret key di sini.
// =============================================================

window.GEOACE_CONFIG = {
  /** URL REST API Supabase — format: https://<project>.supabase.co/rest/v1/ */
  SUPABASE_URL: "https://afaqwkpcglwmrhyubrlb.supabase.co",

  /** Publishable / anon key dari Settings > API > Project API keys */
  SUPABASE_KEY: "sb_publishable_1GC8JZCUL9Yndk7eCDYDyQ_JEEnnycp",

  /** Nama bucket Storage yang sudah dibuat lewat 03_storage_geoace.sql */
  STORAGE_BUCKET: "geoace-bukti",
};
