'use client';

import { useEffect, useRef, useState } from 'react';
import { LocateFixed, MapPin, Navigation } from 'lucide-react';
import type { Person } from '@/lib/types';
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const CAMPUS_CENTER: [number, number] = [51.0665, -1.3284];
const DEFAULT_ZOOM = 16;
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

function validLocation(person: Person): boolean {
  return Number.isFinite(person.location?.[0]) && Number.isFinite(person.location?.[1]) && person.location[0] !== 0 && person.location[1] !== 0;
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || '?';
}

function markerHtml(person: Person) {
  const safeName = person.name.replace(/[&<>\"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] ?? char));
  return `<div class="bluo-map-marker" aria-label="${safeName}"><div class="bluo-map-avatar">${initials(person.name)}</div><div class="bluo-map-name">${safeName}</div></div>`;
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
    {positioned.map((person) => <div className="marker" key={person.id} style={{ left: '50%', top: '50%' }}><div className="marker-bubble"><MapPin size={22} /></div><div className="marker-name">{person.name}</div></div>)}
    {!positioned.length && <div className="map-empty"><MapPin size={22} /><b>Location data will appear here</b><span>Allow location sharing to see friends who choose to share theirs.</span></div>}
  </div>;
}

export function MapPanel({ people, filter, onFilter }: { people: Person[]; filter: 'friends' | 'nearby' | 'everyone'; onFilter: (f: 'friends' | 'nearby' | 'everyone') => void }) {
  const mapHost = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LeafletMarker[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const positioned = people.filter(validLocation);
  const freeCount = people.filter((p) => p.free).length;

  useEffect(() => {
    if (!mapHost.current) return;
    let disposed = false;
    let fallbackTimer: number | undefined;

    setMapFailed(false);
    setMapReady(false);

    void import('leaflet').then((L) => {
      if (disposed || !mapHost.current) return;

      const map = L.map(mapHost.current, {
        center: CAMPUS_CENTER,
        zoom: DEFAULT_ZOOM,
        minZoom: 12,
        maxZoom: 19,
        zoomControl: false,
        attributionControl: true,
        dragging: true,
        touchZoom: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        tap: true,
      });

      map.attributionControl.setPrefix('');
      L.tileLayer(TILE_URL, {
        maxZoom: 19,
        minZoom: 12,
        tileSize: 256,
        keepBuffer: 2,
        updateWhenIdle: false,
        updateWhenZooming: false,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      mapRef.current = map;
      map.whenReady(() => {
        if (disposed) return;
        map.invalidateSize(false);
        setMapReady(true);
      });

      const tileError = () => {
        if (!disposed) setMapFailed(true);
      };
      map.on('tileerror', tileError);

      fallbackTimer = window.setTimeout(() => {
        if (!disposed && !mapReady) setMapFailed(true);
      }, 9000);
    }).catch(() => setMapFailed(true));

    return () => {
      disposed = true;
      if (fallbackTimer !== undefined) window.clearTimeout(fallbackTimer);
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;
    void import('leaflet').then((L) => {
      const map = mapRef.current;
      if (!map) return;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = positioned.map((person) => {
        const icon = L.divIcon({
          className: 'bluo-leaflet-icon',
          html: markerHtml(person),
          iconSize: [70, 76],
          iconAnchor: [35, 70],
        });
        return L.marker([person.location[0], person.location[1]], { icon, keyboard: true, title: person.name }).addTo(map);
      });
    });
  }, [mapReady, people]);

  const centre = () => mapRef.current?.flyTo(CAMPUS_CENTER, DEFAULT_ZOOM, { duration: 0.55 });

  return <section className="card map-card">
    {mapFailed ? <StaticCampusMap people={people} /> : <div ref={mapHost} className="map-surface map-live" aria-label="Peter Symonds College interactive street map" />}

    {!mapFailed && !mapReady && <div style={{ position: 'absolute', inset: 0, zIndex: 8, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
      <div style={{ background: 'rgba(255,255,255,.94)', borderRadius: 16, padding: '12px 15px', boxShadow: '0 10px 30px rgba(20,50,90,.14)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#7183a3' }}><Navigation size={17} /><b style={{ color: '#0d2d63' }}>Loading live map…</b></div>
    </div>}

    <div className="map-overlay">
      <div className="map-filter">{(['friends', 'nearby', 'everyone'] as const).map((f) => <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => onFilter(f)}>{f[0].toUpperCase() + f.slice(1)}</button>)}</div>
      <div className="map-info"><span className="mode-dot" style={{ display: 'inline-block' }} /> {mapFailed ? 'Saved campus map' : 'Live street map'} · {positioned.length} visible</div>
    </div>

    <div className="map-bottom">
      <div className="availability"><strong>{freeCount ? `${freeCount} ${freeCount === 1 ? 'person is' : 'people are'} free now` : 'No friends marked free yet'}</strong><span>{positioned.length ? `${positioned.length} visible on the map` : 'Share your location when you are ready'}</span></div>
      <button className="icon-btn" aria-label="Centre map" title="Centre map on Peter Symonds College" onClick={centre}><LocateFixed size={18} /></button>
    </div>
  </section>;
}
