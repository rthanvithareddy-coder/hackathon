// GET /api/analytics — aggregates for dashboard charts
import { NextResponse } from 'next/server';
import { fetchReportsSafe } from '@/lib/supabase';
import { CATEGORY_LABELS } from '@/lib/nlp/keywords';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data, data_source } = await fetchReportsSafe();
  const relevant = data.filter((r) => r.relevant !== false);

  const byCategory = {};
  const bySeverity = { high: 0, medium: 0, low: 0 };
  const bySource = {};
  const byLocation = {};
  const byDay = {};

  for (const r of relevant) {
    const cat = r.category || 'other';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
    bySeverity[r.severity || 'low'] = (bySeverity[r.severity || 'low'] || 0) + 1;
    bySource[r.source_type || 'citizen'] = (bySource[r.source_type || 'citizen'] || 0) + 1;
    if (r.location_name) byLocation[r.location_name] = (byLocation[r.location_name] || 0) + 1;
    const day = String(r.event_time || r.created_at || '').slice(0, 10);
    if (day) byDay[day] = (byDay[day] || 0) + 1;
  }

  return NextResponse.json({
    ok: true,
    data_source,
    overview: {
      total_reports: data.length,
      active_incidents: relevant.filter((r) => r.verification_status !== 'rejected').length,
      high_severity: bySeverity.high,
      corroborated: relevant.filter((r) => r.verification_status === 'corroborated').length,
      unverified: relevant.filter((r) => r.verification_status === 'unverified').length,
      officially_confirmed: relevant.filter((r) => r.verification_status === 'officially_confirmed').length,
      rejected: relevant.filter((r) => r.verification_status === 'rejected').length,
      duplicates: relevant.filter((r) => r.status === 'duplicate_demo' || r.duplicate_of).length,
    },
    by_category: Object.entries(byCategory).map(([k, v]) => ({ category: CATEGORY_LABELS[k] || k, count: v })).sort((a, b) => b.count - a.count),
    by_severity: bySeverity,
    by_source: bySource,
    by_location: Object.entries(byLocation).map(([location, count]) => ({ location, count })).sort((a, b) => b.count - a.count).slice(0, 10),
    by_day: Object.entries(byDay).sort(([a], [b]) => (a < b ? -1 : 1)).map(([day, count]) => ({ day, count })),
  });
}
