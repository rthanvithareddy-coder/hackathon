// GET /api/reports — list reports (Supabase or demo fallback)
// POST /api/reports — citizen report submission → runs full AI pipeline
import { NextResponse } from 'next/server';
import { fetchReportsSafe, insertReportSafe } from '@/lib/supabase';
import { processRecord } from '@/lib/pipeline';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, data_source, error } = await fetchReportsSafe();
  return NextResponse.json({ ok: true, data_source, count: data.length, reports: data, error });
}

export async function POST(request) {
  try {
    const body = await request.json();
    // ---- input validation ----
    const errors = [];
    if (!body.description || String(body.description).trim().length < 5)
      errors.push('description must be at least 5 characters');
    if (!body.location_name || String(body.location_name).trim().length < 2)
      errors.push('location_name is required');
    if (body.latitude === undefined || body.longitude === undefined)
      errors.push('latitude and longitude are required');
    const lat = Number(body.latitude), lng = Number(body.longitude);
    if (Number.isNaN(lat) || lat < -90 || lat > 90) errors.push('latitude must be a number between -90 and 90');
    if (Number.isNaN(lng) || lng < -180 || lng > 180) errors.push('longitude must be a number between -180 and 180');
    if (errors.length) return NextResponse.json({ ok: false, errors }, { status: 400 });

    // ---- run the AI pipeline on the submission ----
    const processed = processRecord({
      source_type: 'citizen',
      source: body.source || 'Citizen web form',
      description: String(body.description).trim(),
      location_name: String(body.location_name).trim(),
      latitude: lat,
      longitude: lng,
      event_time: body.event_time || new Date().toISOString(),
      image_url: body.image_url || null,
      is_simulated: false,
      status: 'processed',
    });

    const result = await insertReportSafe(processed);
    return NextResponse.json({
      ok: true,
      saved_to_database: result.inserted,
      save_reason: result.reason,
      analysis: {
        relevant: processed.relevant,
        relevance_score: processed.relevance_score,
        relevance_reasons: processed.relevance_reasons,
        category: processed.category,
        severity: processed.severity,
        location: processed.location_name,
        geocode_source: processed.geocode_source,
      },
      report: processed,
    }, { status: result.reason === 'db_error' ? 207 : 201 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
