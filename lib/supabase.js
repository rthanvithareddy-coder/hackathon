// ============================================================
// lib/supabase.js — Supabase connection + graceful demo fallback
// ------------------------------------------------------------
// Two clients:
//   * browser-safe client  : uses the public anon key (RLS protects it)
//   * server admin client  : uses the SECRET service key, only ever
//                            imported from API routes (server side)
// If Supabase env vars are missing or the DB is unreachable, every
// helper falls back to the bundled demo dataset so the hackathon
// demo ALWAYS works, even fully offline.
// ============================================================
import { createClient } from '@supabase/supabase-js';
import { DEMO_REPORTS } from './demoData';

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/** Browser-safe client (safe to use in client components). */
export function getSupabaseBrowserClient() {
  if (!isSupabaseConfigured()) return null;
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );
}

/** Server-only admin client. NEVER import this in a client component. */
export function getSupabaseAdminClient() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  )
    return null;
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

function demoRows() {
  const now = Date.now();
  return DEMO_REPORTS.map((r, i) => ({
    ...r,
    id: r.id || i + 1,
    created_at: new Date(now - i * 45 * 60 * 1000).toISOString(),
  }));
}

/**
 * Unified read: try Supabase; on ANY failure return demo data with
 * a `data_source` flag the UI displays honestly.
 */
export async function fetchReportsSafe() {
  const sb = getSupabaseBrowserClient();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('mobility_reports')
        .select('*')
        .order('event_time', { ascending: false })
        .limit(500);
      if (!error && data && data.length > 0) {
        return { data, data_source: 'supabase', error: null };
      }
      if (error && error.code !== 'PGRST116') {
        console.error('[supabase] fetch failed:', error.message);
      }
    } catch (e) {
      console.error('[supabase] unreachable:', e.message);
    }
  }
  return { data: demoRows(), data_source: 'demo', error: null };
}

/** Server-side insert with duplicate prevention (same text+location within 30 min). */
export async function insertReportSafe(report) {
  const sb = getSupabaseAdminClient();
  if (!sb)
    return { inserted: false, reason: 'demo_mode', data: null, error: null };
  try {
    const { data: dup, error: dupErr } = await sb
      .from('mobility_reports')
      .select('id')
      .eq('description', report.description)
      .eq('location_name', report.location_name)
      .gte('created_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
      .limit(1);
    if (dupErr) throw dupErr;
    if (dup && dup.length > 0)
      return { inserted: false, reason: 'duplicate', data: dup[0], error: null };
    const { data, error } = await sb
      .from('mobility_reports')
      .insert(report)
      .select()
      .single();
    if (error) throw error;
    return { inserted: true, reason: null, data, error: null };
  } catch (e) {
    return { inserted: false, reason: 'db_error', data: null, error: e.message };
  }
}
