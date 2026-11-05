'use client';
// components/Overview.js — Section A: key stat tiles
export default function Overview({ reports, incidents }) {
  const relevant = reports.filter((r) => r.relevant !== false);
  const count = (fn) => relevant.filter(fn).length;
  const stats = [
    { label: 'Total Reports', value: reports.length, cls: '' },
    { label: 'Active Incidents', value: incidents.length, cls: 'accent-teal' },
    { label: 'High Severity', value: count((r) => r.severity === 'high'), cls: 'accent-red' },
    { label: 'Corroborated', value: count((r) => r.verification_status === 'corroborated'), cls: 'accent-teal' },
    { label: 'Unverified', value: count((r) => r.verification_status === 'unverified'), cls: 'accent-orange' },
  ];
  return (
    <section id="overview">
      <h2 className="section-title">City Pulse — Overview</h2>
      <p className="section-sub">Live counts from the processing pipeline.</p>
      <div className="grid grid-3">
        {stats.map((s) => (
          <div key={s.label} className={`card stat-tile ${s.cls}`}>
            <span className="stat-value">{s.value}</span>
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}