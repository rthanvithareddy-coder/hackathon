'use client';
// components/IncidentMap.js — Section B: Leaflet + OpenStreetMap
// Leaflet is loaded client-side only (dynamic, ssr:false) to avoid the
// "window is not defined" build error; default marker icons are fixed
// with explicit icon URLs from unpkg.
import { useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';

const MapContainer = dynamic(
  () => import('react-leaflet').then((m) => m.MapContainer),
  { ssr: false, loading: () => <p className="section-sub">Loading map…</p> }
);
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((m) => m.Popup), { ssr: false });
const LayerGroup = dynamic(() => import('react-leaflet').then((m) => m.LayerGroup), { ssr: false });

const SEVERITY_PIN = {
  high: '#d9534f',
  medium: '#f0a13a',
  low: '#3a9d6d',
};

function pinIcon(severity) {
  if (typeof window === 'undefined') return undefined;
  // eslint-disable-next-line global-require
  const L = require('leaflet');
  const color = SEVERITY_PIN[severity] || '#0e8f7e';
  return L.divIcon({
    className: '',
    html: `<div style="width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
  });
}

export default function IncidentMap({ incidents }) {
  const center = useMemo(() => [13.0827, 80.2707], []); // Chennai
  return (
    <div className="card">
      <MapContainer center={center} zoom={11} scrollWheelZoom className="map-box">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LayerGroup>
          {incidents.map((inc) => (
            <Marker key={inc.id} position={[inc.latitude, inc.longitude]} icon={pinIcon(inc.severity)}>
              <Popup>
                <div className="incident-popup">
                  <h4>{inc.location_name || 'Unknown location'}</h4>
                  <p>{inc.description}</p>
                  <p>
                    <span className={`badge ${inc.severity}`}>{inc.severity}</span>{' '}
                    <span className={`badge ${inc.verification_status}`}>{inc.verification_status}</span>
                    {inc.is_simulated && <span className="badge sim">SIMULATED</span>}
                  </p>
                  <p className="ai-note">AI confidence: {inc.confidence ?? '—'}% (estimate, not official verification)</p>
                  <p className="ai-note">{new Date(inc.event_time).toLocaleString()}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </LayerGroup>
      </MapContainer>
    </div>
  );
}