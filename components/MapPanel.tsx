'use client';

import { useEffect, useRef, useState } from 'react';
import { LocateFixed, MapPin, Navigation } from 'lucide-react';
import type { Person } from '@/lib/types';
import { Avatar } from './Avatar';
import type { Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

function markerPosition(location?: [number, number]): [number, number] | null {
  if (!location || location[0] === 0 || location[1] === 0) return null;
  const minLat = 51.0635, maxLat = 51.0695, minLng = -1.3335, maxLng = -1.3230;
  const x = ((location[1] - minLng) / (maxLng - minLng)) * 100;
  const y = (1 - (location[0] - minLat) / (maxLat - minLat)) * 100;
  if (x < 2 || x > 98 || y < 2 || y > 98) return null;
  return [x, y];
}

function connectionIsLow(): boolean {
  if (typeof navigator === 'undefined') return false;
  const c = (navigator as Navigator & { connection?: { effectiveType?: string; rtt?: number; saveData?: boolean } }).connection;
  if (!c) return false;
  return Boolean(c.saveData || c.effectiveType === 'slow-2g' || c.effectiveType === '2g' || (c.rtt ?? 0) > 450);
}

function markerElement(person: Person) {
  const root = document.createElement('div');
  root.style.cssText = 'display:flex;flex-direction:column;align-items:center;transform:translateY(-100%);pointer-events:auto';
  root.title = person.name;
  const bubble = document.createElement('div');
  bubble.style.cssText = 'width:40px;height:40px;border-radius:50%;background:#1479ff;color:#fff;border:3px solid #fff;box-shadow:0 6px 18px rgba(10,70,150,.3);display:grid;place-items:center;font:800 16px system-ui';
  bubble.textContent = person.name.trim().charAt(0).toUpperCase() || '?';
  const label = document.createElement('div');
  label.style.cssText = 'margin-top:4px;background:rgba(255,255,255,.95);padding:3px 7px;border-radius:7px;box-shadow:0 4px 12px rgba(20,50,90,.14);font:800 10px system-ui;white-space:nowrap;color:#0d2d63';
  label.textContent = person.name;
  root.append(bubble, label);
  return root;
}

export function MapPanel({ people, filter, onFilter }: { people: Person[]; filter: 'friends' | 'nearby' | 'everyone'; onFilter: (f: 'friends' | 'nearby' | 'everyone') => void }) {
  const mapHost = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<MapLibreMarker[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [lowData, setLowData] = useState(connectionIsLow);
  const positioned = people.map((p) => ({ person: p, position: markerPosition(p.location) })).filter((x): x is { person: Person; position: [number, number] } => Boolean(x.position));
  const freeCount = people.filter((p) => p.free).length;

  useEffect(() => {
    const update = () => setLowData(connectionIsLow());
    update();
    const id = window.setInterval(update, 8000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (lowData || !mapHost.current) return;
    let disposed = false;
    setMapFailed(false);
    void import('maplibre-gl').then(({ Map }) => {
      if (disposed || !mapHost.current) return;
      const map = new Map({ container: mapHost.current, style: 'https://tiles.openfreemap.org/styles/liberty', center: [-1.3284, 51.0665], zoom: 16.2, minZoom: 14, maxZoom: 19, attributionControl: false });
      mapRef.current = map;
      map.on('load', () => { if (!disposed) setMapReady(true); });
      map.on('error', (event) => { if (!disposed && event.error) setMapFailed(true); });
    }).catch(() => setMapFailed(true));
    return () => {
      disposed = true;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [lowData]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    let cancelled = false;
    void import('maplibre-gl').then(({ Marker }) => {
      if (cancelled || !mapRef.current) return;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      markersRef.current = positioned.map(({ person }) => new Marker({ element: markerElement(person) }).setLngLat([person.location[1], person.location[0]]).addTo(mapRef.current!));
    });
    return () => { cancelled = true; };
  }, [mapReady, people]);

  const centre = () => mapRef.current?.flyTo({ center: [-1.3284, 51.0665], zoom: 16.2 });

  return <section className="card map-card">
    <div className="map-surface" style={{ background: '#dcebd9' }}>
      {lowData || mapFailed ? <img src="/psc-campus-map.svg" alt="Peter Symonds College campus map" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} /> : <div ref={mapHost} aria-label="Peter Symonds College street map" style={{ position: 'absolute', inset: 0 }} />}
      {(lowData || mapFailed) && positioned.map(({ person, position }) => <div key={person.id} style={{ position: 'absolute', left: `${position[0]}%`, top: `${position[1]}%`, transform: 'translate(-50%,-100%)', zIndex: 5 }}><div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1479ff', border: '3px solid #fff', boxShadow: '0 6px 18px rgba(10,70,150,.3)', display: 'grid', placeItems: 'center' }}><Avatar config={person.avatar} size={30} /></div><div style={{ marginTop: 4, background: 'rgba(255,255,255,.95)', padding: '3px 7px', borderRadius: 7, boxShadow: '0 4px 12px rgba(20,50,90,.14)', font: '800 10px system-ui', whiteSpace: 'nowrap', color: '#0d2d63' }}>{person.name}</div></div>)}
      {!lowData && !mapFailed && !mapReady && <div className="map-loading"><Navigation size={20} /><b>Loading campus map…</b><span>The saved PSC map is used automatically on slower connections.</span></div>}
      {!positioned.length && <div className="map-empty"><MapPin size={22} /><b>Location data will appear here</b><span>Allow location sharing to see friends who choose to share theirs.</span></div>}
    </div>
    <div className="map-overlay">
      <div className="map-filter">{(['friends', 'nearby', 'everyone'] as const).map((f) => <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => onFilter(f)}>{f[0].toUpperCase() + f.slice(1)}</button>)}</div>
      <div className="map-info"><span className="mode-dot" style={{ display: 'inline-block' }} /> {lowData || mapFailed ? 'Saved campus map' : 'Live street map'} · {people.length} visible</div>
    </div>
    <div className="map-bottom">
      <div className="availability"><strong>{freeCount ? `${freeCount} ${freeCount === 1 ? 'person is' : 'people are'} free now` : 'No friends marked free yet'}</strong><span>{positioned.length ? `${positioned.length} visible on the map` : 'Share your location when you are ready'}</span></div>
      <button className="icon-btn" aria-label="Centre map" onClick={centre}><LocateFixed size={18} /></button>
    </div>
  </section>;
}
