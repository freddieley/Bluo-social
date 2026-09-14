'use client';

import { useEffect, useRef, useState } from 'react';
import { LocateFixed, MapPin } from 'lucide-react';
import type { Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';
import type { DataMode, Person } from '@/lib/types';
import { Avatar } from './Avatar';

type Props = {
  people: Person[];
  filter: 'friends' | 'nearby' | 'everyone';
  onFilter: (f: 'friends' | 'nearby' | 'everyone') => void;
  mode: DataMode;
};

const CAMPUS_CENTER: [number, number] = [-1.32825, 51.0665];
const SATELLITE_TILES = 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/g/{z}/{y}/{x}.jpg';

function markerPosition(location?: [number, number]): [number, number] | null {
  if (!location || location[0] === 0 || location[1] === 0) return null;
  const minLat = 51.0635, maxLat = 51.0695, minLng = -1.3335, maxLng = -1.3230;
  const x = ((location[1] - minLng) / (maxLng - minLng)) * 100;
  const y = (1 - (location[0] - minLat) / (maxLat - minLat)) * 100;
  if (x < 2 || x > 98 || y < 2 || y > 98) return null;
  return [x, y];
}

function StaticCampusMap({ people }: { people: Person[] }) {
  const positioned = people.map((p) => ({ person: p, position: markerPosition(p.location) })).filter((x): x is { person: Person; position: [number, number] } => Boolean(x.position));
  return <div className="map-surface map-static">
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

function SatelliteMap({ people }: { people: Person[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<MapLibreMarker[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void import('maplibre-gl').then((maplibregl) => {
      if (cancelled || !containerRef.current) return;
      const map = new maplibregl.Map({
        container: containerRef.current,
        center: CAMPUS_CENTER,
        zoom: 16.8,
        minZoom: 14,
        maxZoom: 19,
        attributionControl: true,
        style: {
          version: 8,
          sources: {
            satellite: {
              type: 'raster',
              tiles: [SATELLITE_TILES],
              tileSize: 256,
              attribution: 'Satellite imagery © EOX IT Services GmbH / Sentinel-2'
            }
          },
          layers: [{ id: 'satellite', type: 'raster', source: 'satellite' }]
        }
      });
      mapRef.current = map;
      map.on('error', (event) => { if (event.error) setFailed(true); });
    }).catch(() => setFailed(true));
    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || failed) return;
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    void import('maplibre-gl').then((maplibregl) => {
      if (!mapRef.current) return;
      markersRef.current = people.filter((p) => p.location[0] !== 0 || p.location[1] !== 0).map((person) => {
        const element = document.createElement('div');
        element.className = 'map-avatar-marker';
        element.setAttribute('aria-label', person.name);
        element.textContent = person.name.slice(0, 1).toUpperCase();
        return new maplibregl.Marker({ element, anchor: 'bottom' }).setLngLat([person.location[1], person.location[0]]).addTo(map);
      });
    });
  }, [people, failed]);

  if (failed) return <StaticCampusMap people={people} />;
  return <div ref={containerRef} className="map-surface map-live" aria-label="Peter Symonds College satellite map" />;
}

export function SatelliteMapPanel({ people, filter, onFilter, mode }: Props) {
  const freeCount = people.filter((p) => p.free).length;
  return <section className="card map-card">
    {mode === 'full' ? <SatelliteMap people={people} /> : <StaticCampusMap people={people} />}
    <div className="map-overlay">
      <div className="map-filter">{(['friends', 'nearby', 'everyone'] as const).map((f) => <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => onFilter(f)}>{f[0].toUpperCase() + f.slice(1)}</button>)}</div>
      <div className="map-info"><span className="mode-dot" style={{ display: 'inline-block' }} /> {people.length} {people.length === 1 ? 'person' : 'people'} visible</div>
    </div>
    <div className="map-bottom">
      <div className="availability"><strong>{freeCount ? `${freeCount} ${freeCount === 1 ? 'person is' : 'people are'} free now` : 'No friends marked free yet'}</strong><span>{mode === 'full' ? 'Live satellite map' : 'Saved campus map · low data mode'}</span></div>
      <button className="icon-btn" aria-label="Centre map"><LocateFixed size={18} /></button>
    </div>
  </section>;
}
