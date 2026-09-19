'use client';

import { useState } from 'react';
import { LocateFixed, MapPin, Navigation } from 'lucide-react';
import type { Person } from '@/lib/types';
import { Avatar } from './Avatar';

const MAP_BBOX = { minLat: 51.0635, maxLat: 51.0695, minLng: -1.3335, maxLng: -1.3230 };
const OSM_EMBED_URL = `https://www.openstreetmap.org/export/embed.html?bbox=${MAP_BBOX.minLng},${MAP_BBOX.minLat},${MAP_BBOX.maxLng},${MAP_BBOX.maxLat}&layer=mapnik`;

function markerPosition(location?: [number, number]): [number, number] | null {
  if (!location || location[0] === 0 || location[1] === 0) return null;
  const x = ((location[1] - MAP_BBOX.minLng) / (MAP_BBOX.maxLng - MAP_BBOX.minLng)) * 100;
  const y = (1 - (location[0] - MAP_BBOX.minLat) / (MAP_BBOX.maxLat - MAP_BBOX.minLat)) * 100;
  if (x < 2 || x > 98 || y < 2 || y > 98) return null;
  return [x, y];
}

function connectionIsLow(): boolean {
  if (typeof navigator === 'undefined') return false;
  const c = (navigator as Navigator & { connection?: { effectiveType?: string; rtt?: number; saveData?: boolean } }).connection;
  if (!c) return false;
  return Boolean(c.saveData || c.effectiveType === 'slow-2g' || c.effectiveType === '2g' || (c.rtt ?? 0) > 450);
}

function StaticCampusMap({ people }: { people: Person[] }) {
  const positioned = people.map((p) => ({ person: p, position: markerPosition(p.location) })).filter((x): x is { person: Person; position: [number, number] } => Boolean(x.position));
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
    {positioned.map(({ person, position }) => <div className="marker" key={person.id} style={{ left: `${position[0]}%`, top: `${position[1]}%` }}><div className="marker-bubble"><Avatar config={person.avatar} size={35} /></div><div className="marker-name">{person.name}</div></div>)}
    {!positioned.length && <div className="map-empty"><MapPin size={22} /><b>Location data will appear here</b><span>Allow location sharing to see friends who choose to share theirs.</span></div>}
  </div>;
}

export function MapPanel({ people, filter, onFilter }: { people: Person[]; filter: 'friends' | 'nearby' | 'everyone'; onFilter: (f: 'friends' | 'nearby' | 'everyone') => void }) {
  const [lowData] = useState(connectionIsLow);
  const [mapFailed, setMapFailed] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const positioned = people.map((p) => ({ person: p, position: markerPosition(p.location) })).filter((x): x is { person: Person; position: [number, number] } => Boolean(x.position));
  const freeCount = people.filter((p) => p.free).length;
  const showStatic = lowData || mapFailed;

  return <section className="card map-card">
    {showStatic ? <StaticCampusMap people={people} /> : <div className="map-surface map-live" aria-label="Peter Symonds College street map" style={{ zIndex: 1, background: '#e9eef3' }}>
      <iframe
        key={mapKey}
        title="Peter Symonds College street map"
        src={OSM_EMBED_URL}
        loading="eager"
        referrerPolicy="strict-origin-when-cross-origin"
        onError={() => setMapFailed(true)}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, display: 'block', zIndex: 1 }}
      />
      <div style={{ position: 'absolute', right: 8, bottom: 8, zIndex: 3, background: 'rgba(255,255,255,.9)', borderRadius: 5, padding: '3px 6px', fontSize: 10, color: '#3f4d5e' }}>© OpenStreetMap contributors</div>
      {positioned.map(({ person, position }) => <div className="marker" key={person.id} style={{ left: `${position[0]}%`, top: `${position[1]}%`, zIndex: 5 }}><div className="marker-bubble"><Avatar config={person.avatar} size={35} /></div><div className="marker-name">{person.name}</div></div>)}
      {!positioned.length && <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', zIndex: 4, background: 'rgba(255,255,255,.94)', borderRadius: 12, padding: '10px 13px', boxShadow: '0 6px 18px rgba(20,50,90,.12)', fontSize: 11, color: '#7183a3', display: 'flex', alignItems: 'center', gap: 7, pointerEvents: 'none' }}><Navigation size={16} />Friends who share their location will appear here.</div>}
    </div>}
    <div className="map-overlay">
      <div className="map-filter">{(['friends', 'nearby', 'everyone'] as const).map((f) => <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => onFilter(f)}>{f[0].toUpperCase() + f.slice(1)}</button>)}</div>
      <div className="map-info"><span className="mode-dot" style={{ display: 'inline-block' }} /> {showStatic ? 'Saved campus map' : 'Live street map'} · {people.length} visible</div>
    </div>
    <div className="map-bottom">
      <div className="availability"><strong>{freeCount ? `${freeCount} ${freeCount === 1 ? 'person is' : 'people are'} free now` : 'No friends marked free yet'}</strong><span>{positioned.length ? `${positioned.length} visible on the map` : 'Share your location when you are ready'}</span></div>
      <button className="icon-btn" aria-label="Centre map" onClick={() => setMapKey((value) => value + 1)}><LocateFixed size={18} /></button>
    </div>
  </section>;
}
