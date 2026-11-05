// GET /api/news — server-side RSS fetch with demo fallback
import { NextResponse } from 'next/server';
import { fetchTrafficNews } from '@/lib/news';
import { detectRelevance, classifyIncident } from '@/lib/nlp/keywords';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { items, source, ok, error } = await fetchTrafficNews();
  // enrich each headline with AI relevance + classification
  const enriched = items.map((n) => {
    const rel = detectRelevance(n.title);
    const cls = classifyIncident(n.title);
    return { ...n, relevance_score: rel.score, relevant: rel.relevant, category: cls.category };
  });
  return NextResponse.json({ ok: true, feed_status: ok ? 'live_rss' : 'demo_fallback', source, error, items: enriched });
}
