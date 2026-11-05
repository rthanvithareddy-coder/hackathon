'use client';
// components/VerificationCentre.js — Section D: AI Verification Centre
export default function VerificationCentre({ reports }) {
  const buckets = [
    { key: 'relevant', label: 'Relevant reports', test: (r) => r.relevant !== false },
    { key: 'irrelevant', label: 'Irrelevant reports', test: (r) => r.relevant === false },
    { key: 'dup', label: 'Duplicate reports', test: (r) => r.status === 'duplicate_demo' || r.duplicate_of },
    { key: 'corr', label: 'Corroborated', test: (r) => r.verification_status === 'corroborated' },
    { key: 'official', label: 'Officially confirmed', test: (r) => r.verification_status === 'officially_confirmed' },
    { key: 'unver', label: 'Unverified', test: (r) => r.verification_status === 'unverified' },
    { key: 'rej', label: 'Rejected', test: (r) => r.verification_status === 'rejected' },
  ];
  const showCase = reports.slice(0, 12);
  return (
    <section id="verification">
      <h2 className="section-title">AI Verification Centre</h2>
      <p className="section-sub">
        Explainable confidence scoring. Corroboration can never produce “Officially Confirmed” — that requires an authority feed.
      </p>
      <div className="grid grid-3">
        {buckets.map((b) => (
          <div key={b.key} className="card stat-tile">
            <span className="stat-value">{reports.filter(b.test).length}</span>
            <span className="stat-label">{b.label}</span>
          </div>
        ))}
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <h3 style={{ color: 'var(--green)', marginBottom: 8 }}>Scoring audit trail (sample)</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Report</th><th>Status</th><th>Confidence</th><th>Why (AI reasons)</th></tr></thead>
            <tbody>
              {showCase.map((r) => (
                <tr key={r.id}>
                  <td style={{ maxWidth: 240 }}>{(r.description || '').slice(0, 80)}…</td>
                  <td><span className={`badge ${r.verification_status}`}>{r.verification_status}</span></td>
                  <td>{r.confidence ?? '—'}%</td>
                  <td className="reasons">{Array.isArray(r.verification_reasons) ? r.verification_reasons.join(' · ') : (r.relevance_reasons || []).slice(0, 3).join(' · ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="ai-note" style={{ marginTop: 10 }}>
          ⚠️ AI-generated confidence estimates are decision support, not factual verification.
        </p>
      </div>
    </section>
  );
}