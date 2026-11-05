// GET /api/incidents — map-ready incident markers (relevant + geo only)
import { NextResponse } from 'next/server';
import { fetchReportsSafe } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, data_source } = await fetchReportsSafe();
  const incidents = data
    .filter((r) => r.relevant !== false && r.latitude != null && r.longitude != null)
    .map((r) => ({
      id: r.id,
      title: r.description?.slice(0, 80) || 'Incident',
      description: r.description,
      category: r.category,
      severity: r.severity,
      location_name: r.location_name,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      event_time: r.event_time || r.created_at,
      source: r.source,
      source_type: r.source_type,
      verification_status: r.verification_status,
      confidence: r.confidence,
      is_simulated: Boolean(r.is_simulated),
    }));
  return NextResponse.json({ ok: true, data_source, count: incidents.length, incidents });
}
