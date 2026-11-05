'use client';
// components/CitizenForm.js — Section F: working citizen report form
// On submit → POST /api/reports → full AI pipeline → result shown.
import { useState } from 'react';

export default function CitizenForm({ onSubmitted }) {
  const [form, setForm] = useState({
    description: '', location_name: '', latitude: '', longitude: '', event_time: '',
  });
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(null); setResult(null);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, latitude: Number(form.latitude), longitude: Number(form.longitude) }),
      });
      const data = await res.json();
      if (!res.ok) setError((data.errors || [data.error]).join(' · '));
      else { setResult(data); onSubmitted?.(); }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="report">
      <h2 className="section-title">Citizen Reporting</h2>
      <p className="section-sub">Your report runs through the AI pipeline instantly (relevance → classification → location → verification).</p>
      <form className="card" onSubmit={submit}>
        <div className="form-grid">
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label htmlFor="desc">Incident description</label>
            <textarea id="desc" required minLength={5} value={form.description} onChange={set('description')} placeholder="e.g. Heavy traffic jam near Tambaram GST road" />
          </div>
          <div className="field">
            <label htmlFor="loc">Location name</label>
            <input id="loc" required value={form.location_name} onChange={set('location_name')} placeholder="Tambaram" />
          </div>
          <div className="field">
            <label htmlFor="lat">Latitude</label>
            <input id="lat" required type="number" step="any" min="-90" max="90" value={form.latitude} onChange={set('latitude')} placeholder="12.9249" />
          </div>
          <div className="field">
            <label htmlFor="lng">Longitude</label>
            <input id="lng" required type="number" step="any" min="-180" max="180" value={form.longitude} onChange={set('longitude')} placeholder="80.1000" />
          </div>
          <div className="field">
            <label htmlFor="when">Date &amp; time (optional, defaults to now)</label>
            <input id="when" type="datetime-local" value={form.event_time} onChange={set('event_time')} />
          </div>
        </div>
        <div style={{ marginTop: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn" type="submit" disabled={busy}>{busy ? 'Analysing…' : 'Submit Report'}</button>
          <span className="ai-note">Image upload &amp; account sign-in are future enhancements (schema ready).</span>
        </div>
      </form>

      {error && <div className="card" style={{ borderColor: 'var(--red)' }}><strong style={{ color: 'var(--red)' }}>Error:</strong> {error}</div>}
      {result && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ color: 'var(--green)' }}>✅ Report processed</h3>
          <p className="section-sub">Saved to database: {result.saved_to_database ? 'yes' : `no (${result.save_reason || 'demo mode'})`}</p>
          <div className="table-wrap">
            <table>
              <tbody>
                <tr><td>Relevant?</td><td>{String(result.analysis.relevant)} ({result.analysis.relevance_score}/100)</td></tr>
                <tr><td>Category</td><td><span className="badge cat">{result.analysis.category.replace(/_/g, ' ')}</span></td></tr>
                <tr><td>Severity</td><td><span className={`badge ${result.analysis.severity}`}>{result.analysis.severity}</span></td></tr>
                <tr><td>Location resolved</td><td>{result.analysis.location} · via {result.analysis.geocode_source}</td></tr>
                <tr><td>Why relevant (AI reasons)</td><td className="reasons">{result.analysis.relevance_reasons.join(' · ')}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}