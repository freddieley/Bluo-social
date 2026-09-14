'use client';

import { useEffect, useState } from 'react';
import { Camera, Check, Loader2, Upload, X } from 'lucide-react';
import { supabaseBrowser } from '@/lib/supabase';
import { replaceTimetable } from '@/lib/live';
import type { Lesson } from '@/lib/types';

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

type OcrLesson = { day: number; start: string; end: string; name: string; room: string | null };

export function TimetableOCR() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [lessons, setLessons] = useState<OcrLesson[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState(false);
  const sb = supabaseBrowser();

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const chooseFile = (next: File | null) => {
    if (!next) return;
    if (!next.type.startsWith('image/')) { setMessage('Please choose a timetable image.'); return; }
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(URL.createObjectURL(next));
    setLessons([]);
    setSaved(false);
    setMessage('');
  };

  const scan = async () => {
    if (!file) return;
    setBusy(true); setMessage('Reading your timetable…'); setSaved(false);
    try {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch('/api/timetable-ocr', { method: 'POST', body: form });
      const data = await response.json() as { lessons?: OcrLesson[]; error?: string };
      if (!response.ok) throw new Error(data.error || 'Could not scan the timetable.');
      const clean = (data.lessons || []).filter(l => l.day >= 1 && l.day <= 5 && l.start < l.end && l.name.trim());
      if (!clean.length) throw new Error('I could not confidently find any lessons. Try a clearer screenshot.');
      setLessons(clean);
      setMessage(`Found ${clean.length} lesson${clean.length === 1 ? '' : 's'}. Check them before saving.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not scan the timetable.');
    } finally { setBusy(false); }
  };

  const save = async () => {
    if (!sb || !lessons.length) return;
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setMessage('Please sign in again.'); return; }
    setBusy(true);
    try {
      await replaceTimetable(sb, user.id, lessons.map(l => ({ day: l.day, start: l.start, end: l.end, name: l.name, room: l.room || undefined })) as Lesson[]);
      setSaved(true);
      setMessage('Timetable saved. Your availability is now based on these lessons.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not save the timetable.');
    } finally { setBusy(false); }
  };

  if (!open) return <button className="ocr-launch" onClick={() => setOpen(true)}><Camera size={17} /> Scan timetable</button>;

  return <>
    <div className="sheet-backdrop" onClick={() => !busy && setOpen(false)} />
    <div className="sheet ocr-sheet">
      <div className="grabber" />
      <div className="ocr-head"><div><h2>Scan your timetable</h2><p>Take a clear photo or choose a screenshot. Bluo will read the timetable and let you check it before saving.</p></div><button className="icon-btn" onClick={() => setOpen(false)} disabled={busy}><X size={17} /></button></div>
      <label className="ocr-drop">
        <input type="file" accept="image/*" capture="environment" onChange={e => chooseFile(e.target.files?.[0] || null)} />
        {preview ? <img src={preview} alt="Timetable preview" /> : <><Upload size={24} /><b>Choose timetable image</b><span>JPG, PNG or HEIC · up to 8 MB</span></>}
      </label>
      {file && !lessons.length && <button className="primary" style={{ width: '100%', marginTop: 12 }} disabled={busy} onClick={() => void scan()}>{busy ? <><Loader2 size={16} className="spin" /> Scanning…</> : 'Scan timetable'}</button>}
      {lessons.length > 0 && <div className="ocr-results"><div className="ocr-results-head"><b>Check detected lessons</b><span>{lessons.length} found</span></div>{lessons.map((l, i) => <div className="ocr-lesson" key={`${l.day}-${l.start}-${i}`}><div><b>{days[l.day - 1]} · {l.start}–{l.end}</b><span>{l.name}{l.room ? ` · ${l.room}` : ''}</span></div></div>)}<button className="primary" style={{ width: '100%', marginTop: 12 }} disabled={busy || saved} onClick={() => void save()}>{busy ? 'Saving…' : saved ? <><Check size={16} /> Saved</> : 'Save timetable'}</button></div>}
      {message && <div className="notice" style={{ marginTop: 12 }}>{message}</div>}
    </div>
  </>;
}
