'use client';

import { useMemo } from 'react';
import { LocateFixed, MapPin } from 'lucide-react';
import type { Person } from '@/lib/types';
import { Avatar } from './Avatar';

const MAP_CENTER: [number, number] = [-1.3284, 51.0665];
const MAP_ZOOM = 16;
const TILE_SIZE = 256;
const STREET_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const MAP_BBOX = { minLat: 51.0635, maxLat: 51.0695, minLng: -1.3335, maxLng: -1.3230 };

function markerPosition(location?: [number, number]): [number, number] | null {
  if (!location || location[0] === 0 || location[1] === 0) return null;
  const x = ((location[1] - MAP_BBOX.minLng) / (MAP_BBOX.maxLng - MAP_BBOX.minLng)) * 100;
  const y = (1 - (location[0] - MAP_BBOX.minLat) / (MAP_BBOX.maxLat - MAP_BBOX.minLat)) * 100;
  if (x < 2 || x > 98 || y < 2 || y > 98) return null;
  return [x, y];
}

function worldPixel(lng: number, lat: number, zoom: number): [number, number] {
  const scale = TILE_SIZE * 2 ** zoom;
  const x = ((lng + 180) / 360) * scale;
  const sinLat = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
  return [x, y];
}

function TileMap({ people }: { people: Person[] }) {
  const [centerX, centerY] = worldPixel(MAP_CENTER[0], MAP_CENTER[1], MAP_ZOOM);
  const centerTileX = Math.floor(centerX / TILE_SIZE);
  const centerTileY = Math.floor(centerY / TILE_SIZE);
  const offsetX = centerX - centerTileX * TILE_SIZE;
  const offsetY = centerY - centerTileY * TILE_SIZE;
  const positioned = people.map((p) => ({ person: p, position: markerPosition(p.location) })).filter((x): x is { person: Person; position: [number, number] } => Boolean(x.position));

  const tiles = useMemo(() => [-1, 0, 1].flatMap((dy) => [-1, 0, 1].map((dx) => {
    const x = centerTileX + dx;
    const y = centerTileY + dy;
    const src = STREET_TILES.replace('{z}', String(MAP_ZOOM)).replace('{x}', String(x)).replace('{y}', String(y));
    return { x, y, dx, dy, src };
  })), [centerTileX, centerTileY]);

  return <div className="map-surface map-live" aria-label="Peter Symonds College street map" style={{ background: '#e8edf1' }}>
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {tiles.map((tile) => <img key={`${tile.x}-${tile.y}`} src={tile.src} alt="" draggable={false} style={{ position: 'absolute', width: TILE_SIZE, height: TILE_SIZE, maxWidth: 'none', left: `calc(50% + ${tile.dx * TILE_SIZE - offsetX}px)`, top: `calc(50% + ${tile.dy * TILE_SIZE - offsetY}px)`, userSelect: 'none' }} />)}
      {positioned.map(({ person, position }) => <div className="marker" key={person.id} style={{ left: `${position[0]}%`, top: `${position[1]}%`, zIndex: 5 }}><div className="marker-bubble"><Avatar config={person.avatar} size={35} /></div><div className="marker-name">{person.name}</div></div>)}
      {!positioned.length && <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', zIndex: 4, background: 'rgba(255,255,255,.94)', borderRadius: 12, padding: '10px 13px', boxShadow: '0 6px 18px rgba(20,50,90,.12)', fontSize: 11, color: '#7183a3', display: 'flex', alignItems: 'center', gap: 7, pointerEvents: 'none' }}><MapPin size={16} />Friends who share their location will appear here.</div>}
    </div>
    <div style={{ position: 'absolute', right: 8, bottom: 8, zIndex: 8, background: 'rgba(255,255,255,.9)', borderRadius: 5, padding: '3px 6px', fontSize: 10, color: '#3f4d5e' }}>© OpenStreetMap contributors</div>
  </div>;
}

export function MapPanel({ people, filter, onFilter }: { people: Person[]; filter: 'friends' | 'nearby' | 'everyone'; onFilter: (f: 'friends' | 'nearby' | 'everyone') => void }) {
  const positioned = people.map((p) => ({ person: p, position: markerPosition(p.location) })).filter((x): x is { person: Person; position: [number, number] } => Boolean(x.position));
  const freeCount = people.filter((p) => p.free).length;

  return <section className="card map-card">
    <TileMap people={people} />
    <div className="map-overlay">
      <div className="map-filter">{(['friends', 'nearby', 'everyone'] as const).map((f) => <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => onFilter(f)}>{f[0].toUpperCase() + f.slice(1)}</button>)}</div>
      <div className="map-info"><span className="mode-dot" style={{ display: 'inline-block' }} /> Live street map · {people.length} visible</div>
    </div>
    <div className="map-bottom">
      <div className="availability"><strong>{freeCount ? `${freeCount} ${freeCount === 1 ? 'person is' : 'people are'} free now` : 'No friends marked free yet'}</strong><span>{positioned.length ? `${positioned.length} visible on the map` : 'Share your location when you are ready'}</span></div>
      <button className="icon-btn" aria-label="Centre map" title="Map is centred on Peter Symonds College"><LocateFixed size={18} /></button>
    </div>
  </section>;
}
