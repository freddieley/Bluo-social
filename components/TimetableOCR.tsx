'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Check, Loader2, Upload, X } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase';
import { replaceTimetable } from '@/lib/live';
import type { Lesson } from '@/lib/types';

type OcrItem = { text: string; score?: number; poly: number[][] };
type OcrLesson = { day: number; start: string; end: string; name: string; room: string | null };
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const ignored = /^(break|study period|lunch|free|lesson|monday|tuesday|wednesday|thursday|friday)$/i;
const rangeRe = /\b(\d{1,2}):([0-5]\d)\s*[-–—]\s*(\d{1,2}):([0-5]\d)\b/;
const roomRe = /^(?:[A-Z]{1,5}\s*)?\d{2,4}[A-Z]?$|^[A-Z]{1,5}\d{2,4}[A-Z]?$/i;

function box(item: OcrItem) {
  const xs = item.poly.flatMap(p => [p[0]]);
  const ys = item.poly.flatMap(p => [p[1]]);
  return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
}

function parseTimeRange(text: string) {
  const m = text.replace(/\s+/g, ' ').match(rangeRe);
  if (!m) return null;
  const start = `${m[1].padStart(2, '0')}:${m[2]}`;
  const end = `${m[3].padStart(2, '0')}:${m[4]}`;
  if (start >= end) return null;
  return { start, end };
}

function dayFromX(x: number, headers: Array<{ day: number; x: number }>, width: number) {
  if (headers.length) return headers.reduce((best, h) => Math.abs(h.x - x) < Math.abs(best.x - x) ? h : best).day;
  const left = width * 0.06, right = width * 0.995;
  return Math.min(5, Math.max(1, Math.floor(((x - left) / (right - left)) * 5) + 1));
}

function parseTimetable(items: OcrItem[], imageWidth: number): OcrLesson[] {
  const usable = items.filter(i => i.text.trim() && (i.score ?? 1) >= 0.35).map(i => ({ ...i, text: i.text.replace(/\s+/g, ' ').trim(), ...box(i) }));
  const headers = usable.flatMap(i => {
    const t = i.text.toLowerCase();
    const day = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].findIndex(d => t.startsWith(d));
    return day >= 0 ? [{ day: day + 1, x: i.x }] : [];
  });
  const ranges = usable.map(i => ({ item: i, time: parseTimeRange(i.text) })).filter((x): x is { item: typeof usable[number]; time: { start: string; end: string } } => Boolean(x.time));
  const result: OcrLesson[] = [];

  for (const current of ranges) {
    const day = dayFromX(current.item.x, headers, imageWidth);
    const nextSameDay = ranges.filter(r => r !== current && dayFromX(r.item.x, headers, imageWidth) === day && r.item.y > current.item.y).sort((a, b) => a.item.y - b.item.y)[0];
    const candidates = usable
      .filter(i => i !== current.item && i.x > current.item.x - imageWidth * 0.08 && i.x < current.item.x + imageWidth * 0.08 && i.y > current.item.y + 8 && (!nextSameDay || i.y < nextSameDay.item.y - 5))
      .filter(i => !parseTimeRange(i.text) && !ignored.test(i.text))
      .sort((a, b) => a.y - b.y);
    const nameItem = candidates.find(i => !roomRe.test(i.text));
    if (!nameItem) continue;
    const roomItem = candidates.find(i => i !== nameItem && roomRe.test(i.text));
    result.push({ day, start: current.time.start, end: current.time.end, name: nameItem.text, room: roomItem?.text || null });
  }

  return result.filter((lesson, index, all) => all.findIndex(x => x.day === lesson.day && x.start === lesson.start && x.end === lesson.end && x.name === lesson.name) === index).sort((a, b) => a.day - b.day || a.start.localeCompare(b.start));
}

type OcrEngine = {
  predict: (image: Blob) => Promise<Array<{ image: { width: number; height: number }; items: OcrItem[] }>>;
  dispose?: () => void;
};

export function TimetableOCR() {
  const [open, setOpen] = useState(false); const [signedIn, setSignedIn] = useState(false); const [file, setFile] = useState<File | null>(null); const [preview, setPreview] = useState(''); const [lessons, setLessons] = useState<OcrLesson[]>([]); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [saved, setSaved] = useState(false);
  const sb = supabaseBrowser();
  const ocrRef = useRef<OcrEngine | null>(null);

  useEffect(() => { if (!sb) return; void sb.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user))); const { data } = sb.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session?.user))); return () => data.subscription.unsubscribe(); }, [sb]);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); ocrRef.current?.dispose?.(); }, [preview]);

  const chooseFile = (next: File | null) => { if (!next) return; if (!next.type.startsWith('image/')) { setMessage('Please choose a timetable image.'); return; } if (next.size > 8 * 1024 * 1024) { setMessage('Please choose an image under 8 MB.'); return; } if (preview) URL.revokeObjectURL(preview); setFile(next); setPreview(URL.createObjectURL(next)); setLessons([]); setSaved(false); setMessage(''); };

  const scan = async () => {
    if (!file) return;
    setBusy(true); setMessage('Loading the free on-device OCR engine…'); setSaved(false);
    try {
      if (!ocrRef.current) {
        const paddleOcrUrl = 'https://esm.sh/@paddleocr/paddleocr-js@0.4.2?bundle&target=es2022';
        const { PaddleOCR } = await import(/* webpackIgnore: true */ paddleOcrUrl);
        ocrRef.current = await PaddleOCR.create({ lang: 'en', ocrVersion: 'PP-OCRv5', ortOptions: { backend: 'wasm', wasmPaths: 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/', numThreads: 2, simd: true } });
      }
      const ocr = ocrRef.current;
      if (!ocr) throw new Error('The OCR engine could not be loaded. Please try again.');
      setMessage('Reading your timetable on this device…');
      const [result] = await ocr.predict(file);
      const clean = parseTimetable(result.items, result.image.width);
      if (!clean.length) throw new Error('I could not confidently find the timetable cells. Try a clearer screenshot.');
      setLessons(clean); setMessage(`Found ${clean.length} lesson${clean.length === 1 ? '' : 's'}. Check them before saving.`);
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Could not scan the timetable.'); } finally { setBusy(false); }
  };

  const save = async () => { if (!sb || !lessons.length) return; const { data: { user } } = await sb.auth.getUser(); if (!user) { setMessage('Please sign in again.'); return; } setBusy(true); try { await replaceTimetable(sb, user.id, lessons.map(l => ({ day: l.day, start: l.start, end: l.end, name: l.name, room: l.room || undefined })) as Lesson[]); setSaved(true); setMessage('Timetable saved. Your availability is now based on these lessons.'); } catch (e) { setMessage(e instanceof Error ? e.message : 'Could not save the timetable.'); } finally { setBusy(false); } };
  if (!signedIn) return null;
  if (!open) return <button onClick={() => setOpen(true)} style={{ position: 'fixed', right: 18, bottom: 92, zIndex: 55, display: 'flex', alignItems: 'center', gap: 7, padding: '12px 15px', borderRadius: 16, background: 'var(--blue)', color: '#fff', fontWeight: 800, boxShadow: '0 10px 25px rgba(20,121,255,.28)' }}><Camera size={17} /> Scan timetable</button>;
  return <><div className="sheet-backdrop" onClick={() => !busy && setOpen(false)} /><div className="sheet" style={{ zIndex: 81 }}><div className="grabber" /><div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}><div style={{ flex: 1 }}><h2>Scan your timetable</h2><p>Take a clear photo or choose a screenshot. OCR runs on this device, so the timetable image is not uploaded to an OCR service.</p></div><button className="icon-btn" onClick={() => setOpen(false)} disabled={busy}><X size={17} /></button></div>
    <label style={{ display: 'grid', placeItems: 'center', minHeight: 150, border: '2px dashed #dbe5f2', borderRadius: 20, overflow: 'hidden', background: '#f8fbff', cursor: 'pointer', textAlign: 'center', padding: 18 }}>
      <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={e => chooseFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
      {preview ? <img src={preview} alt="Timetable preview" style={{ maxWidth: '100%', maxHeight: 280, objectFit: 'contain', borderRadius: 12 }} /> : <div><Upload size={24} /><b style={{ display: 'block', marginTop: 8 }}>Choose timetable image</b><span style={{ display: 'block', color: 'var(--muted)', fontSize: 11, marginTop: 4 }}>JPG, PNG or WebP · up to 8 MB</span></div>}
    </label>
    {file && !lessons.length && <button className="primary" style={{ width: '100%', marginTop: 12 }} disabled={busy} onClick={() => void scan()}>{busy ? <><Loader2 size={16} /> Scanning…</> : 'Scan timetable'}</button>}
    {lessons.length > 0 && <div style={{ marginTop: 14 }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}><b>Check detected lessons</b><span style={{ color: 'var(--muted)' }}>{lessons.length} found</span></div>{lessons.map((l, i) => <div key={`${l.day}-${l.start}-${i}`} style={{ padding: '10px 12px', background: '#f7faff', borderRadius: 12, marginTop: 6 }}><b style={{ fontSize: 12 }}>{days[l.day - 1]} · {l.start}–{l.end}</b><span style={{ display: 'block', color: 'var(--muted)', fontSize: 11, marginTop: 2 }}>{l.name}{l.room ? ` · ${l.room}` : ''}</span></div>)}<button className="primary" style={{ width: '100%', marginTop: 12 }} disabled={busy || saved} onClick={() => void save()}>{busy ? 'Saving…' : saved ? <><Check size={16} /> Saved</> : 'Save timetable'}</button></div>}
    {message && <div className="notice" style={{ marginTop: 12 }}>{message}</div>}
  </div></>;
}
