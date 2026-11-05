'use client';
// ============================================================
// app/page.js — dashboard shell: loads data once, passes to sections
// Works 100% offline with bundled demo data when Supabase is not set.
// ============================================================
import { useEffect, useState } from 'react';
import Overview from '@/components/Overview';
import IncidentMap from '@/components/IncidentMap';
import SocialFeed from '@/components/SocialFeed';
import VerificationCentre from '@/components/VerificationCentre';
import Analytics from '@/components/Analytics';
import CitizenForm from '@/components/CitizenForm';
import NewsMonitor from '@/components/NewsMonitor';

export default function Home() {
  const [reports, setReports] = useState([]);
  const [dataSource, setDataSource] = useState('loading');
  const [incidents, setIncidents] = useState([]);
  const [news, setNews] = useState([]);
  const [newsStatus, setNewsStatus] = useState('loading');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetch('/api/incidents')
      .then((r) => r.json())
      .then((d) => { setIncidents(d.incidents || []); setDataSource(d.data_source || 'demo'); })
      .catch(() => setDataSource('error'));
    fetch('/api/reports')
      .then((r) => r.json())
      .then((d) => setReports(d.reports || []))
      .catch(() => {});
    fetch('/api/news')
      .then((r) => r.json())
      .then((d) => { setNews(d.items || []); setNewsStatus(d.feed_status || 'demo_fallback'); })
      .catch(() => setNewsStatus('demo_fallback'));
  }, [refreshKey]);

  return (
    <>
      <div className="demo-note">
        {dataSource === 'demo'
          ? '⚡ DEMO MODE — bundled demonstration data for Chennai is shown (no Supabase configured).'
          : `🟢 LIVE — data served from Supabase (${dataSource}).`}
      </div>

      <Overview reports={reports} incidents={incidents} />

      <section id="map">
        <h2 className="section-title">Live Incident Map</h2>
        <p className="section-sub">Leaflet + OpenStreetMap · red = high, orange = medium, green = low severity.</p>
        <IncidentMap incidents={incidents} />
      </section>

      <SocialFeed reports={reports} />
      <VerificationCentre reports={reports} />
      <Analytics reports={reports} />
      <CitizenForm onSubmitted={() => setRefreshKey((k) => k + 1)} />
      <NewsMonitor news={news} feedStatus={newsStatus} />
    </>
  );
}