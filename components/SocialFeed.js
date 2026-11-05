'use client';
// components/SocialFeed.js — Section C: Social media intelligence
export default function SocialFeed({ reports }) {
  const social = reports
    .filter((r) => r.source_type === 'social_sim' || r.source_type === 'social_real')
    .slice(0, 20);
  return (
    <section id="social">
      <h2 className="section-title">Social Media Intelligence</h2>
      <p className="section-sub">Posts analysed by the AI pipeline. Every row marked SIMULATED is demonstration data only.</p>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Source</th><th>Post</th><th>Location</th><th>Time</th>
              <th>Category</th><th>AI Relevance</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {social.map((r) => (
              <tr key={r.id}>
                <td>{r.source}{r.is_simulated && <> <span className="badge sim">SIMULATED</span></>}</td>
                <td style={{ maxWidth: 380 }}>
                  {r.description}
                  {r.url && <><br /><a href={r.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem' }}>view post ↗</a></>}
                </td>
                <td>{r.location_name}</td>
                <td>{new Date(r.event_time || r.created_at).toLocaleString()}</td>
                <td><span className="badge cat">{r.category?.replace(/_/g, ' ')}</span></td>
                <td>{r.relevance_score ?? '—'}/100</td>
                <td><span className={`badge ${r.verification_status}`}>{r.verification_status}</span></td>
              </tr>
            ))}
            {social.length === 0 && <tr><td colSpan={7}>No social posts loaded.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}