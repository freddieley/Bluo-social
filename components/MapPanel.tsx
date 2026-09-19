'use client';

import { useEffect, useRef, useState } from 'react';
import { LocateFixed, MapPin, Minus, Navigation, Plus } from 'lucide-react';
import type { Person } from '@/lib/types';
import { Avatar } from './Avatar';
import type { Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const CAMPUS_CENTER: [number, number] = [-1.3284, 51.0665];
const STREET_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_ZOOM = 16.2;

function validLocation(person: Person): boolean {
  return Number.isFinite(person.location?.[0]) && Number.isFinite(person.location?.[1]) && person.location[0] !== 0 && person.location[1] !== 0;
}

function markerElement(person: Person): HTMLDivElement {
  const root = document.createElement('div');
  root.style.cssText = 'display:flex;flex-direction:column;align-items:center;transform:translateY(-100%);pointer-events:auto;cursor:pointer';
  root.title = person.name;

  const bubble = document.createElement('div');
  bubble.style.cssText = 'width:48px;height:48px;border-radius:50%;background:#fff;border:3px solid #1479ff;box-shadow:0 8px 22px rgba(19,91,188,.28);display:grid;place-items:center;overflow:hidden';
  const avatarHost = document.createElement('div');
  avatarHost.style.cssText = 'width:100%;height:100%;display:grid;place-items:center';
  bubble.appendChild(avatarHost);
  root.appendChild(bubble);

  const label = document.createElement('div');
  label.style.cssText = 'margin-top:5px;background:rgba(255,255,255,.96);padding:4px 8px;border-radius:8px;box-shadow:0 5px 15px rgba(30,60,90,.14);font:800 10px system-ui;white-space:nowrap;color:#0d2d63';
  label.textContent = person.name;
  root.appendChild(label);

  void import('react-dom/client').then(({ createRoot }) => {
    if (!avatarHost.isConnected) return;
    createRoot(avatarHost).render(<Avatar config={person.avatar} size={40} />);
  });

  return root;
}

function StaticCampusMap({ people }: { people: Person[] }) {
  const positioned = people.filter(validLocation);
  return <div className="map-surface map-static" style={{ background: '#dcebd9' }}>
    <div className="campus">
      <div className="building" style={{ left: '15%', top: '28%', width: '25%', height: '16%' }} />
      <div className="building" style={{ left: '49%', top: '12%', width: '29%', height: '23%' }} />
      <div className="building" style={{ left: '36%', top: '52%', width: '30%', height: '20%' }} />
      <div className="building" style={{ left: '70%', top: '55%', width: '18%', height: '18%' }} />
    </div>
    <span className="map-label" style={{ left: '15%', top: '18%' }}>SCIENCE CENTRE</span>
    <span className="map-label" style={{ left: '63%', top: '42%' }}>CANTEEN</span>
    <span className="map-label" style={{ left: '32%', top: '76%' }}>COLLEGE CENTRE</span>
    <span className="map-label" style={{ right: '11%', bottom: '17%' }}>SPORTS HALL</span>
    {positioned.map((person) => <div className="marker" key={person.id} style={{ left: '50%', top: '50%' }}><div className="marker-bubble"><Avatar config={person.avatar} size={35} /></div><div className="marker-name">{person.name}</div></div>)}
    {!positioned.length && <div className="map-empty"><MapPin size={22} /><b>Location data will appear here</b><span>Allow location sharing to see friends who choose to share theirs.</span></div>}
  </div>;
}

export function MapPanel({ people, filter, onFilter }: { people: Person[]; filter: 'friends' | 'nearby' | 'everyone'; onFilter: (f: 'friends' | 'nearby' | 'everyone') => void }) {
  const mapHost = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<MapLibreMarker[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const positioned = people.filter(validLocation);
  const freeCount = people.filter((p) => p.free).length;

  useEffect(() => {
    if (!mapHost.current) return;
    let disposed = false;
    let loaded = false;
    let fallbackTimer: number | undefined;
    setMapFailed(false);

    void import('maplibre-gl').then(({ Map }) => {
      if (disposed || !mapHost.current) return;
      const map = new Map({
        container: mapHost.current,
        style: {
          version: 8,
          sources: {
            street: {
              type: 'raster',
              tiles: [STREET_TILES],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors',
            },
          },
          layers: [{ id: 'street', type: 'raster', source: 'street' }],
        },
        center: CAMPUS_CENTER,
        zoom: DEFAULT_ZOOM,
        minZoom: 13,
        maxZoom: 19,
        attributionControl: { compact: true },
        dragRotate: false,
        touchPitch: false,
      });
      mapRef.current = map;
      map.on('load', () => {
        if (disposed) return;
        loaded = true;
        map.resize();
        setMapReady(true);
      });
      map.on('error', (event) => {
        if (!disposed && event.error) setMapFailed(true);
      });
      fallbackTimer = window.setTimeout(() => {
        if (!disposed && !loaded) setMapFailed(true);
      }, 12000);
    }).catch(() => setMapFailed(true));

    return () => {
      disposed = true;
      if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    const map = mapRef.current;
    map.resize();
    let cancelled = false;

    void import('maplibre-gl').then(({ Marker }) => {
      if (cancelled || !mapRef.current) return;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = positioned.map((person) => new Marker({ element: markerElement(person), anchor: 'bottom' }).setLngLat([person.location[1], person.location[0]]).addTo(map));
    });

    return () => { cancelled = true; };
  }, [mapReady, people]);

  const centre = () => mapRef.current?.flyTo({ center: CAMPUS_CENTER, zoom: DEFAULT_ZOOM, duration: 550 });
  const zoomIn = () => mapRef.current?.zoomIn({ duration: 220 });
  const zoomOut = () => mapRef.current?.zoomOut({ duration: 220 });

  return <section className="card map-card">
    {mapFailed ? <StaticCampusMap people={people} /> : <div ref={mapHost} className="map-surface map-live" aria-label="Peter Symonds College interactive street map" style={{ zIndex: 1 }} />}

    {!mapFailed && !mapReady && <div style={{ position: 'absolute', inset: 0, zIndex: 8, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
      <div style={{ background: 'rgba(255,255,255,.94)', borderRadius: 16, padding: '12px 15px', boxShadow: '0 10px 30px rgba(20,50,90,.14)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#7183a3' }}><Navigation size={17} /><b style={{ color: '#0d2d63' }}>Loading live map…</b></div>
    </div>}

    <div className="map-overlay">
      <div className="map-filter">{(['friends', 'nearby', 'everyone'] as const).map((f) => <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => onFilter(f)}>{f[0].toUpperCase() + f.slice(1)}</button>)}</div>
      <div className="map-info"><span className="mode-dot" style={{ display: 'inline-block' }} /> {mapFailed ? 'Saved campus map' : 'Live street map'} · {people.length} visible</div>
    </div>

    {!mapFailed && <div style={{ position: 'absolute', right: 18, top: 76, zIndex: 14, display: 'grid', gap: 6 }}>
      <button className="icon-btn" aria-label="Zoom in" title="Zoom in" onClick={zoomIn}><Plus size={18} /></button>
      <button className="icon-btn" aria-label="Zoom out" title="Zoom out" onClick={zoomOut}><Minus size={18} /></button>
    </div>}

    <div className="map-bottom">
      <div className="availability"><strong>{freeCount ? `${freeCount} ${freeCount === 1 ? 'person is' : 'people are'} free now` : 'No friends marked free yet'}</strong><span>{positioned.length ? `${positioned.length} visible on the map` : 'Share your location when you are ready'}</span></div>
      <button className="icon-btn" aria-label="Centre map" title="Centre map on Peter Symonds College" onClick={centre}><LocateFixed size={18} /></button>
    </div>
  </section>;
}
