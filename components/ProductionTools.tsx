'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, MapPin, Plus, Upload, Users, X } from 'lucide-react';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { supabaseBrowser } from '@/lib/supabase';
import { getTimetable, replaceTimetable } from '@/lib/live';
import type { Lesson } from '@/lib/types';

type DraftLesson = Lesson & { id?: string };
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export function ProductionTools() {
  const [sb] = useState<SupabaseClient | null>(() => supabaseBrowser());
  const [user, setUser] = useState<User | null>(null);
  const [quickstart, setQuickstart] = useState(false);
  const [step, setStep] = useState(0);
  const [timetableOpen, setTimetableOpen] = useState(false);

  useEffect(() => {
    if (!sb) return;
    let alive = true;
    void sb.auth.getUser().then(({ data }) => { if (alive) setUser(data.user); });
    const { data } = sb.auth.onAuthStateChange((_event, session) => { if (alive) setUser(session?.user ?? null); });
    return () => { alive = false; data.subscription.unsubscribe(); };
  }, [sb]);

  useEffect(() => {
    if (!user) return;
    const key = `bluo-quickstart-v1:${user.id}`;
    try { if (localStorage.getItem(key) !== 'complete') setQuickstart(true); }
    catch { setQuickstart(true); }
  }, [user]);

  const finishQuickstart = () => {
    if (user) { try { localStorage.setItem(`bluo-quickstart-v1:${user.id}`, 'complete'); } catch {} }
    setQuickstart(false); setStep(0);
  };

  if (!sb || !user) return null;
  return <>
    <button className="floating-timetable" onClick={() => setTimetableOpen(true)} aria-label="Open timetable"><CalendarDays size={17} /> Timetable</button>
    {quickstart && <Quickstart step={step} setStep={setStep} openTimetable={() => setTimetableOpen(true)} close={finishQuickstart} />}
    {timetableOpen && <TimetableManager sb={sb} user={user} close={() => setTimetableOpen(false)} />}
  </>;
}

function Quickstart({ step, setStep, openTimetable, close }: { step: number; setStep: (n: number) => void; openTimetable: () => void; close: () => void }) {
  const steps = useMemo(() => [
    { icon: <Users size={22} />, title: 'Welcome to Bluo', text: 'Bluo helps you see when your friends are free, find them around campus and make the most of your breaks.' },
    { icon: <CalendarDays size={22} />, title: 'Add your timetable', text: 'Your timetable powers availability. Add your lessons now, or skip it and come back whenever you want.' },
    { icon: <MapPin size={22} />, title: 'Share your location', text: 'Location lets friends see where you are when your sharing settings allow it. You can change this at any time.' },
    { icon: <Users size={22} />, title: 'Find your friends', text: 'Follow your friends from the Friends tab. When you follow each other, you become Bluo friends and can see each other more precisely.' },
  ], []);
  const current = steps[step];
  return <div className="quickstart-backdrop" role="dialog" aria-modal="true" aria-label="Bluo quickstart">
    <div className="quickstart-card">
      <button className="quickstart-close" onClick={close} aria-label="Close quickstart"><X size={18} /></button>
      <div className="quickstart-progress">{steps.map((_, i) => <span key={i} className={i <= step ? 'active' : ''} />)}</div>
      <div className="quickstart-icon">{current.icon}</div><div className="eyebrow">Quickstart · {step + 1} of {steps.length}</div>
      <h2>{current.title}</h2><p>{current.text}</p>
      {step === 1 && <button className="primary quickstart-main" onClick={openTimetable}><CalendarDays size={17} /> Set up my timetable</button>}
      {step === 2 && <button className="primary quickstart-main" onClick={() => { if (!navigator.geolocation) return; navigator.geolocation.getCurrentPosition(() => setStep(3), () => setStep(3), { enableHighAccuracy: false, timeout: 10000, maximumAge: 180000 }); }}><MapPin size={17} /> Enable location</button>}
      <div className="quickstart-actions"><button className="secondary" onClick={() => step ? setStep(step - 1) : close()}>{step ? <><ChevronLeft size={16} /> Back</> : 'Skip for now'}</button><button className="primary" onClick={() => step === steps.length - 1 ? close() : setStep(step + 1)}>{step === steps.length - 1 ? <><Check size={16} /> Done</> : <>Next <ChevronRight size={16} /></>}</button></div>
    </div>
  </div>;
}

function TimetableManager({ sb, user, close }: { sb: SupabaseClient; user: User; close: () => void }) {
  const [lessons, setLessons] = useState<DraftLesson[]>([]); const [day, setDay] = useState(1); const [name, setName] = useState(''); const [start, setStart] = useState('09:00'); const [end, setEnd] = useState('10:00'); const [room, setRoom] = useState(''); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [message, setMessage] = useState(''); const [imageUrl, setImageUrl] = useState<string | null>(null);
  useEffect(() => { void getTimetable(sb, user.id).then(rows => setLessons(rows.map(l => ({ day: l.day, start: l.start_time.slice(0, 5), end: l.end_time.slice(0, 5), name: l.subject, room: l.room ?? undefined })))).catch(() => setMessage('Could not load your timetable.')).finally(() => setLoading(false)); }, [sb, user.id]);
  useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl); }, [imageUrl]);
  const add = () => { if (!name.trim() || end <= start) { setMessage('Add a subject and make sure the end time is after the start time.'); return; } setLessons(prev => [...prev, { day, start, end, name: name.trim(), room: room.trim() || undefined }].sort((a, b) => a.day - b.day || a.start.localeCompare(b.start))); setName(''); setRoom(''); setMessage(''); };
  const remove = (index: number) => setLessons(prev => prev.filter((_, i) => i !== index));
  const save = async () => { setSaving(true); setMessage(''); try { await replaceTimetable(sb, user.id, lessons); setMessage('Timetable saved.'); } catch (e) { setMessage(e instanceof Error ? e.message : 'Could not save timetable.'); } finally { setSaving(false); } };
  return <div className="quickstart-backdrop" role="dialog" aria-modal="true" aria-label="Timetable"><div className="timetable-modal">
    <div className="sheet-head"><div><div className="eyebrow">Your schedule</div><h2>Timetable</h2><p>Add, change or remove lessons whenever you need.</p></div><button className="icon-btn" onClick={close} aria-label="Close timetable"><X size={18} /></button></div>
    <div className="timetable-tools"><label className="upload-control"><Upload size={16} /> Upload timetable screenshot<input type="file" accept="image/*" onChange={e => { const file = e.target.files?.[0]; if (file) { if (file.size > 6 * 1024 * 1024) { setMessage('Please use an image under 6 MB.'); return; } setImageUrl(URL.createObjectURL(file)); setMessage('Screenshot loaded. Use it as a reference while adding the lessons below.'); } }} /></label><span className="person-meta">Manual editing is always available.</span></div>
    {imageUrl && <div className="timetable-image-wrap"><img src={imageUrl} alt="Uploaded timetable reference" /><button className="secondary" onClick={() => setImageUrl(null)}>Remove screenshot</button></div>}
    <div className="lesson-form"><select className="input" value={day} onChange={e => setDay(Number(e.target.value))}>{days.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}</select><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Subject" maxLength={80} /><input className="input" type="time" value={start} onChange={e => setStart(e.target.value)} /><input className="input" type="time" value={end} onChange={e => setEnd(e.target.value)} /><input className="input" value={room} onChange={e => setRoom(e.target.value)} placeholder="Room (optional)" maxLength={40} /><button className="primary" onClick={add}><Plus size={16} /> Add lesson</button></div>
    <div className="lesson-list">{loading ? <p className="person-meta">Loading timetable…</p> : lessons.length ? lessons.map((l, i) => <div className="lesson-editor-row" key={`${l.day}-${l.start}-${l.name}-${i}`}><div className="time">{days[l.day - 1]?.slice(0, 3)}<br />{l.start}</div><div className="lesson"><b>{l.name}</b><span>{l.start}–{l.end} · {l.room || 'No room'}</span></div><button className="secondary delete-lesson" onClick={() => remove(i)}>Remove</button></div>) : <div className="notice"><Clock3 size={15} /> No lessons yet. Add them above or use your timetable screenshot as a reference.</div>}</div>
    {message && <div className="notice" style={{ marginTop: 12 }}>{message}</div>}<div className="sheet-actions"><button className="secondary" onClick={close}>Close</button><button className="primary" onClick={() => void save()} disabled={saving}>{saving ? 'Saving…' : 'Save timetable'}</button></div>
  </div></div>;
}
