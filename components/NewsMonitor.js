'use client';
// components/NewsMonitor.js — Section G: traffic news headlines
export default function NewsMonitor({ news, feedStatus }) {
  return (
    <section id="news">
      <h2 className="section-title">News Monitor</h2>
      <p className="section-sub">
        Google News RSS (server-side fetch).{' '}
        {feedStatus === 'live_rss'
          ? '🟢 Live feed connected.'
          : '🟡 Live feed unavailable — showing bundled demonstration headlines.'}{' '}
        Headlines are leads, NOT proof of a live incident.
      </p>
      <div className="grid grid-2">
        {news.map((n, i) => (
          <div key={i} className="card">
            <a href={n.url} target="_blank" rel="noreferrer" style={{ fontWeight: 700, color: 'var(--green)', textDecoration: 'none' }}>
              {n.title} ↗
            </a>
            <p className="section-sub" style={{ marginTop: 6 }}>
              {n.source} · {new Date(n.published_at).toLocaleString()} ·{' '}
              <span className="badge cat">{String(n.category || 'other').replace(/_/g, ' ')}</span>{' '}
              <span className="ai-note">AI relevance {n.relevance_score ?? '—'}/100</span>
            </p>
          </div>
        ))}
        {news.length === 0 && <p className="section-sub">Loading headlines…</p>}
      </div>
    </section>
  );
}