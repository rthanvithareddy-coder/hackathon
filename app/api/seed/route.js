// GET /api/seed — idempotently insert the demo dataset into Supabase.
// Uses the SERVER-ONLY service key. Safe to hit once after setting up
// the database (visit http://localhost:3000/api/seed in the browser).
import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { DEMO_REPORTS } from '@/lib/demoData';
import { runPipeline } from '@/lib/pipeline';

export const dynamic = 'force-dynamic';

export async function GET() {
  const sb = getSupabaseAdminClient();
  if (!sb)
    return NextResponse.json(
      { ok: false, error: 'Supabase not configured — set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY in .env.local and restart `npm run dev`.' },
      { status: 400 }
    );

  try {
    const processed = runPipeline(DEMO_REPORTS.map((r) => ({ ...r, official_confirmation: r.verification_status === 'officially_confirmed' })));
    const rows = processed.records.map((r) => ({
      source_type: r.source_type,
      source: r.source,
      post_id: r.post_id,
      description: r.description,
      location_name: r.location_name,
      latitude: r.latitude,
      longitude: r.longitude,
      event_time: r.event_time,
      category: r.category,
      severity: r.severity,
      relevance_score: r.relevance_score,
      relevant: r.relevant,
      verification_status: r.verification_status,
      confidence: r.confidence,
      is_simulated: r.is_simulated,
      status: r.status,
      url: r.url,
    }));
    const { error } = await sb.from('mobility_reports').upsert(rows, { onConflict: 'id' });
    if (error) throw error;
    return NextResponse.json({ ok: true, inserted: rows.length, stats: processed.stats });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
