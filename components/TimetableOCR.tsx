'use client';

import { useEffect, useState } from 'react';
import { Camera, Check, Loader2, Upload, X } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase';
import { replaceTimetable } from '@/lib/live';
import type { Lesson } from '@/lib/types';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
type OcrLesson = { day: number; start: string; end: string; name: string; room: string | null };

export function TimetableOCR() {
  const [open, setOpen] = useState(false); const [file, setFile] = useState<File | null>(null); const [preview, setPreview] = useState(''); const [lessons, setLessons] = useState<OcrLesson[]>([]); const [busy, setBusy] = useState(false); const [message, setMessage] = useState(''); const [saved, setSaved] = useState(false); const sb = supabaseBrowser();
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const chooseFile = (next: File | null) => { if (!next) return; if (!next.type.startsWith('image/')) { setMessage('Please choose a timetable image.'); return; } if (preview) URL.revokeObjectURL(preview); setFile(next); setPreview(URL.createObjectURL(next)); setLessons([]); setSaved(false); setMessage(''); };
  const scan = async () => { if (!file) return; setBusy(true); setMessage('Reading your timetable…'); setSaved(false); try { const form = new FormData(); form.append('file', file); const response = await fetch('/api/timetable-ocr', { method: 'POST', body: form }); const data = await response.json() as { lessons?: OcrLesson[]; error?: string }; if (!response.ok) throw new Error(data.error || 'Could not scan the timetable.'); const clean = (data.lessons || []).filter(l => l.day >= 1 && l.day <= 5 && l.start < l.end && l.name.trim()); if (!clean.length) throw new Error('I could not confidently find any lessons. Try a clearer screenshot.'); setLessons(clean); setMessage(`Found ${clean.length} lesson${clean.length === 1 ? '' : 's'}. Check them before saving.`); } catch (e) { setMessage(e instanceof Error ? e.message : 'Could not scan the timetable.'); } finally { setBusy(false); } };
  const save = async () => { if (!sb || !lessons.length) return; const { data: { user } } = await sb.auth.getUser(); if (!user) { setMessage('Please sign in again.'); return; } setBusy(true); try { await replaceTimetable(sb, user.id, lessons.map(l => ({ day: l.day, start: l.start, end: l.end, name: l.name, room: l.room || undefined })) as Lesson[]); setSaved(true); setMessage('Timetable saved. Your availability is now based on these lessons.'); } catch (e) { setMessage(e instanceof Error ? e.message : 'Could not save the timetable.'); } finally { setBusy(false); } };
  if (!open) return <button onClick={() => setOpen(true)} style={{ position: 'fixed', right: 18, bottom: 92, zIndex: 55, display: 'flex', alignItems: 'center', gap: 7, padding: '12px 15px', borderRadius: 16, background: 'var(--blue)', color: '#fff', fontWeight: 800, boxShadow: '0 10px 25px rgba(20,121,255,.28)' }}><Camera size={17} /> Scan timetable</button>;
  return <><div className="sheet-backdrop" onClick={() => !busy && setOpen(false)} /><div className="sheet" style={{ zIndex: 81 }}><div className="grabber" /><div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}><div style={{ flex: 1 }}><h2>Scan your timetable</h2><p>Take a clear photo or choose a screenshot. Bluo will read it and let you check everything before saving.</p></div><button className="icon-btn" onClick={() => setOpen(false)} disabled={busy}><X size={17} /></button></div>
    <label style={{ display: 'grid', placeItems: 'center', minHeight: 150, border: '2px dashed #dbe5f2', borderRadius: 20, overflow: 'hidden', background: '#f8fbff', cursor: 'pointer', textAlign: 'center', padding: 18 }}>
      <input type="file" accept="image/*" capture="environment" onChange={e => chooseFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
      {preview ? <img src={preview} alt="Timetable preview" style={{ maxWidth: '100%', maxHeight: 280, objectFit: 'contain', borderRadius: 12 }} /> : <div><Upload size={24} /><b style={{ display: 'block', marginTop: 8 }}>Choose timetable image</b><span style={{ display: 'block', color: 'var(--muted)', fontSize: 11, marginTop: 4 }}>JPG, PNG or HEIC · up to 8 MB</span></div>}
    </label>
    {file && !lessons.length && <button className="primary" style={{ width: '100%', marginTop: 12 }} disabled={busy} onClick={() => void scan()}>{busy ? <><Loader2 size={16} /> Scanning…</> : 'Scan timetable'}</button>}
    {lessons.length > 0 && <div style={{ marginTop: 14 }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12 }}><b>Check detected lessons</b><span style={{ color: 'var(--muted)' }}>{lessons.length} found</span></div>{lessons.map((l, i) => <div key={`${l.day}-${l.start}-${i}`} style={{ padding: '10px 12px', background: '#f7faff', borderRadius: 12, marginTop: 6 }}><b style={{ fontSize: 12 }}>{days[l.day - 1]} · {l.start}–{l.end}</b><span style={{ display: 'block', color: 'var(--muted)', fontSize: 11, marginTop: 2 }}>{l.name}{l.room ? ` · ${l.room}` : ''}</span></div>)}<button className="primary" style={{ width: '100%', marginTop: 12 }} disabled={busy || saved} onClick={() => void save()}>{busy ? 'Saving…' : saved ? <><Check size={16} /> Saved</> : 'Save timetable'}</button></div>}
    {message && <div className="notice" style={{ marginTop: 12 }}>{message}</div>}
  </div></>;
}
