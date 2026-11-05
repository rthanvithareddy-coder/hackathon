'use client';
// components/Analytics.js — Section E: Traffic Analytics (pure-CSS charts)
function Bars({ title, rows, unit = '' }) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="card">
      <h3 style={{ color: 'var(--green)', marginBottom: 12 }}>{title}</h3>
      <div className="chart-bars">
        {rows.map((r) => (
          <div key={r.label} className="chart-row">
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</span>
            <div className="chart-bar-track">
              <div className="chart-bar-fill" style={{ width: `${(r.count / max) * 100}%` }} />
            </div>
            <strong>{r.count}{unit}</strong>
          </div>
        ))}
        {rows.length === 0 && <p className="section-sub">No data yet.</p>}
      </div>
    </div>
  );
}

export default function Analytics({ reports }) {
  const relevant = reports.filter((r) => r.relevant !== false);
  const group = (fn) => {
    const m = {};
    relevant.forEach((r) => { const k = fn(r); if (k) m[k] = (m[k] || 0) + 1; });
    return Object.entries(m).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  };
  const catRows = group((r) => (r.category || 'other').replace(/_/g, ' '));
  const locRows = group((r) => r.location_name).slice(0, 8);
  const sevRows = group((r) => r.severity);
  const srcRows = group((r) => r.source_type);
  const dayRows = group((r) => String(r.event_time || r.created_at || '').slice(0, 10)).sort((a, b) => (a.label < b.label ? -1 : 1));

  return (
    <section id="analytics">
      <h2 className="section-title">Traffic Analytics</h2>
      <p className="section-sub">Aggregated from all processed reports.</p>
      <div className="grid grid-2">
        <Bars title="Incidents by Category" rows={catRows} />
        <Bars title="Most Affected Locations" rows={locRows} />
        <Bars title="Severity Distribution" rows={sevRows} />
        <Bars title="Source-wise Distribution" rows={srcRows} />
        <Bars title="Daily Incident Trend" rows={dayRows} />
      </div>
    </section>
  );
}