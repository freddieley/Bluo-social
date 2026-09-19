'use client';

import { useEffect, useRef, useState } from 'react';
import { LocateFixed, Minus, Navigation, Plus } from 'lucide-react';
import type { Person } from '@/lib/types';

// Centre on the middle of the Owens Road campus rather than a single building.
// PSC spans several OSM features; using the campus centroid keeps the college
// itself centred in the initial Snapchat-style view.
const CAMPUS_CENTER: [number, number] = [51.0717, -1.3232];
const DEFAULT_ZOOM = 16;
const MIN_ZOOM = 12;
const MAX_ZOOM = 19;
const TILE_SIZE = 256;
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

type Point = { x: number; y: number };
type View = { center: [number, number]; zoom: number };
type Props = { people: Person[]; filter: 'friends' | 'nearby' | 'everyone'; onFilter: (f: 'friends' | 'nearby' | 'everyone') => void };

function validLocation(person: Person): boolean {
  return Number.isFinite(person.location?.[0]) && Number.isFinite(person.location?.[1]) && person.location[0] !== 0 && person.location[1] !== 0;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function project([lat, lon]: [number, number], zoom: number): Point {
  const scale = TILE_SIZE * 2 ** zoom;
  const sin = clamp(Math.sin((lat * Math.PI) / 180), -0.9999, 0.9999);
  return { x: ((lon + 180) / 360) * scale, y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale };
}

function unproject({ x, y }: Point, zoom: number): [number, number] {
  const scale = TILE_SIZE * 2 ** zoom;
  const lon = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));
  return [lat, lon];
}

function wrapX(x: number, worldTiles: number) {
  return ((x % worldTiles) + worldTiles) % worldTiles;
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('') || '?';
}

export function MapPanel({ people, filter, onFilter }: Props) {
  const mapHost = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<View>({ center: CAMPUS_CENTER, zoom: DEFAULT_ZOOM });
  const dragRef = useRef<{ pointerId: number; start: Point; center: Point } | null>(null);
  const pointersRef = useRef<Map<number, Point>>(new Map());
  const [view, setView] = useState<View>(viewRef.current);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [tileLoaded, setTileLoaded] = useState(false);
  const [myLocation, setMyLocation] = useState<[number, number] | undefined>();
  const positioned = people.filter(validLocation);
  const freeCount = people.filter((p) => p.free).length;

  // loadPeople intentionally excludes the signed-in user because it feeds the
  // social/friends UI. Read the browser location locally so solo testers still
  // see themselves on the map immediately after granting location permission.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    let active = true;
    const locate = () => navigator.geolocation.getCurrentPosition(
      (position) => { if (active) setMyLocation([position.coords.latitude, position.coords.longitude]); },
      () => {},
      { enableHighAccuracy: false, maximumAge: 180000, timeout: 10000 },
    );
    locate();
    const id = window.setInterval(locate, 300000);
    return () => { active = false; window.clearInterval(id); };
  }, []);

  useEffect(() => {
    const host = mapHost.current;
    if (!host) return;
    const update = () => setSize({ width: host.clientWidth, height: host.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  const commitView = (next: View) => { viewRef.current = next; setView(next); };

  const zoomAt = (nextZoom: number, point?: Point) => {
    const current = viewRef.current;
    const zoom = clamp(Math.round(nextZoom), MIN_ZOOM, MAX_ZOOM);
    if (zoom === current.zoom) return;
    const anchor = point ?? { x: size.width / 2, y: size.height / 2 };
    const oldCenter = project(current.center, current.zoom);
    const worldAtAnchor = { x: oldCenter.x + anchor.x - size.width / 2, y: oldCenter.y + anchor.y - size.height / 2 };
    const geographicAnchor = unproject(worldAtAnchor, current.zoom);
    const newAnchor = project(geographicAnchor, zoom);
    const newCenterWorld = { x: newAnchor.x - anchor.x + size.width / 2, y: newAnchor.y - anchor.y + size.height / 2 };
    commitView({ center: unproject(newCenterWorld, zoom), zoom });
  };

  const centre = () => commitView({ center: CAMPUS_CENTER, zoom: DEFAULT_ZOOM });

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    event.currentTarget.setPointerCapture(event.pointerId);
    pointersRef.current.set(event.pointerId, point);
    if (pointersRef.current.size === 1) dragRef.current = { pointerId: event.pointerId, start: point, center: project(viewRef.current.center, viewRef.current.zoom) };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    pointersRef.current.set(event.pointerId, point);
    const drag = dragRef.current;
    if (!drag || pointersRef.current.size !== 1 || drag.pointerId !== event.pointerId) return;
    const nextWorld = { x: drag.center.x - (point.x - drag.start.x), y: drag.center.y - (point.y - drag.start.y) };
    commitView({ ...viewRef.current, center: unproject(nextWorld, viewRef.current.zoom) });
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => { pointersRef.current.delete(event.pointerId); dragRef.current = null; };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    zoomAt(viewRef.current.zoom + (event.deltaY < 0 ? 1 : -1), point);
  };

  const centerWorld = project(view.center, view.zoom);
  const worldTiles = 2 ** view.zoom;
  const left = centerWorld.x - size.width / 2;
  const top = centerWorld.y - size.height / 2;
  const firstX = Math.floor(left / TILE_SIZE) - 1;
  const firstY = Math.floor(top / TILE_SIZE) - 1;
  const cols = Math.ceil(size.width / TILE_SIZE) + 3;
  const rows = Math.ceil(size.height / TILE_SIZE) + 3;
  const tiles = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const x = firstX + col;
      const y = firstY + row;
      if (y < 0 || y >= worldTiles) continue;
      const wrappedX = wrapX(x, worldTiles);
      tiles.push({ key: `${view.zoom}-${wrappedX}-${y}`, x: x * TILE_SIZE - left, y: y * TILE_SIZE - top, url: TILE_URL.replace('{z}', String(view.zoom)).replace('{x}', String(wrappedX)).replace('{y}', String(y)) });
    }
  }

  const markerPosition = (location: [number, number]) => {
    const point = project(location, view.zoom);
    return { x: point.x - left, y: point.y - top };
  };
  const mePoint = myLocation ? markerPosition(myLocation) : null;
  const meVisible = Boolean(mePoint && mePoint.x >= -100 && mePoint.y >= -100 && mePoint.x <= size.width + 100 && mePoint.y <= size.height + 100);
  const visibleCount = positioned.length + (myLocation ? 1 : 0);

  return <section className="card map-card">
    <style jsx global>{`
      .map-live { background:#dcebd9 !important; overflow:hidden; cursor:grab; touch-action:none; user-select:none; }
      .map-live:before { display:none !important; }
      .bluo-tile { position:absolute; width:256px; height:256px; max-width:none; pointer-events:none; user-select:none; }
      .bluo-map-marker-live { position:absolute; width:90px; transform:translate(-50%,-100%); display:flex; flex-direction:column; align-items:center; z-index:4; pointer-events:none; }
      .bluo-map-avatar-live { width:46px; height:46px; border-radius:50%; display:grid; place-items:center; background:#1479ff; color:#fff; border:3px solid #fff; box-shadow:0 7px 20px rgba(19,91,188,.30); font:800 13px 'Plus Jakarta Sans',sans-serif; }
      .bluo-map-avatar-me { background:#0d2d63; box-shadow:0 0 0 4px rgba(20,121,255,.18), 0 7px 20px rgba(19,91,188,.30); }
      .bluo-map-name-live { margin-top:4px; max-width:90px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; background:rgba(255,255,255,.96); color:#0d2d63; padding:4px 7px; border-radius:8px; box-shadow:0 5px 15px rgba(30,60,90,.14); font:800 10px system-ui,sans-serif; }
      .bluo-map-name-me { background:#0d2d63; color:#fff; }
      .map-zoom-controls { position:absolute; right:18px; top:84px; z-index:15; display:grid; gap:6px; }
      .map-zoom-controls button { width:42px; height:42px; border-radius:14px; background:rgba(255,255,255,.94); color:#0d2d63; display:grid; place-items:center; box-shadow:0 8px 22px rgba(20,50,90,.14); }
      .map-attribution { position:absolute; right:10px; bottom:10px; z-index:6; background:rgba(255,255,255,.88); padding:3px 6px; border-radius:7px; font-size:9px; color:#52647f; }
      .map-attribution a { color:#0d2d63; }
    `}</style>

    <div ref={mapHost} className="map-surface map-live" aria-label="Peter Symonds College interactive street map" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerEnd} onPointerCancel={handlePointerEnd} onWheel={handleWheel}>
      {tiles.map((tile) => <img key={tile.key} className="bluo-tile" src={tile.url} alt="" draggable={false} onLoad={() => setTileLoaded(true)} style={{ left: tile.x, top: tile.y }} />)}
      {positioned.map((person) => {
        const { x, y } = markerPosition(person.location);
        if (x < -100 || y < -100 || x > size.width + 100 || y > size.height + 100) return null;
        return <div key={person.id} className="bluo-map-marker-live" style={{ left: x, top: y }}><div className="bluo-map-avatar-live">{initials(person.name)}</div><div className="bluo-map-name-live">{person.name}</div></div>;
      })}
      {meVisible && mePoint && <div className="bluo-map-marker-live" style={{ left: mePoint.x, top: mePoint.y }}><div className="bluo-map-avatar-live bluo-map-avatar-me">You</div><div className="bluo-map-name-live bluo-map-name-me">You</div></div>}
      <div className="map-attribution">&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors</div>
    </div>

    {!tileLoaded && <div style={{ position:'absolute', inset:0, zIndex:8, display:'grid', placeItems:'center', pointerEvents:'none' }}><div style={{ background:'rgba(255,255,255,.94)', borderRadius:16, padding:'12px 15px', boxShadow:'0 10px 30px rgba(20,50,90,.14)', display:'flex', alignItems:'center', gap:8, fontSize:12, color:'#7183a3' }}><Navigation size={17}/><b style={{ color:'#0d2d63' }}>Loading live map…</b></div></div>}

    <div className="map-overlay">
      <div className="map-filter">{(['friends', 'nearby', 'everyone'] as const).map((f) => <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => onFilter(f)}>{f[0].toUpperCase() + f.slice(1)}</button>)}</div>
      <div className="map-info"><span className="mode-dot" style={{ display:'inline-block' }} /> Live street map · {visibleCount} visible</div>
    </div>

    <div className="map-zoom-controls">
      <button aria-label="Zoom in" onClick={() => zoomAt(view.zoom + 1)}><Plus size={20}/></button>
      <button aria-label="Zoom out" onClick={() => zoomAt(view.zoom - 1)}><Minus size={20}/></button>
    </div>

    <div className="map-bottom">
      <div className="availability"><strong>{freeCount ? `${freeCount} ${freeCount === 1 ? 'person is' : 'people are'} free now` : 'No friends marked free yet'}</strong><span>{visibleCount ? `${visibleCount} visible on the map` : 'Share your location when you are ready'}</span></div>
      <button className="icon-btn" aria-label="Centre map" title="Centre map on Peter Symonds College" onClick={centre}><LocateFixed size={18}/></button>
    </div>
  </section>;
}
