'use client';
import { LocateFixed, MapPin } from 'lucide-react';
import type { Person } from '@/lib/types';
import { Avatar } from './Avatar';

function markerPosition(location?: [number, number]): [number, number] | null {
  if (!location || location[0] === 0 || location[1] === 0) return null;
  // Approximate Peter Symonds campus bounds. The server already controls
  // whether these coordinates are exact or rounded before they reach here.
  const minLat = 51.0635;
  const maxLat = 51.0695;
  const minLng = -1.3335;
  const maxLng = -1.3230;
  const x = ((location[1] - minLng) / (maxLng - minLng)) * 100;
  const y = (1 - (location[0] - minLat) / (maxLat - minLat)) * 100;
  if (x < 2 || x > 98 || y < 2 || y > 98) return null;
  return [x, y];
}

export function MapPanel({ people, filter, onFilter }: { people: Person[]; filter: 'friends' | 'nearby' | 'everyone'; onFilter: (f: 'friends' | 'nearby' | 'everyone') => void }) {
  const positioned = people.map((p) => ({ person: p, position: markerPosition(p.location) })).filter((x): x is { person: Person; position: [number, number] } => Boolean(x.position));
  const freeCount = people.filter((p) => p.free).length;

  return <section className="card map-card">
    <div className="map-surface">
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
      {positioned.map(({ person, position }) => <div className="marker" key={person.id} style={{ left: `${position[0]}%`, top: `${position[1]}%` }}>
        <div className="marker-bubble"><Avatar config={person.avatar} size={35} /></div>
        <div className="marker-name">{person.name}</div>
      </div>)}
      {!positioned.length && <div className="map-empty"><MapPin size={22} /><b>Location data will appear here</b><span>Allow location sharing to see friends who choose to share theirs.</span></div>}
    </div>
    <div className="map-overlay">
      <div className="map-filter">{(['friends', 'nearby', 'everyone'] as const).map((f) => <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => onFilter(f)}>{f[0].toUpperCase() + f.slice(1)}</button>)}</div>
      <div className="map-info"><span className="mode-dot" style={{ display: 'inline-block' }} /> {people.length} {people.length === 1 ? 'person' : 'people'} visible</div>
    </div>
    <div className="map-bottom">
      <div className="availability"><strong>{freeCount ? `${freeCount} ${freeCount === 1 ? 'person is' : 'people are'} free now` : 'No friends marked free yet'}</strong><span>{positioned.length ? `${positioned.length} visible on the campus map` : 'Share your location when you are ready'}</span></div>
      <button className="icon-btn" aria-label="Centre map"><LocateFixed size={18} /></button>
    </div>
  </section>;
}
