'use client';

import { useEffect, useState, type ReactNode } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabaseBrowser } from '@/lib/supabase';

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const COLLEGE_EMAIL_RE = /^[a-z][a-z.]*?\d{2}@students\.psc\.ac\.uk$/;

function parseCollegeEmail(email: string) {
  const match = COLLEGE_EMAIL_RE.exec(email);
  return match ? { joinYear: 2000 + Number(match[1]) } : null;
}

type AuthGateProps = { children: ReactNode };

export function AuthGate({ children }: AuthGateProps) {
  const [sb] = useState<SupabaseClient | null>(() => supabaseBrowser());
  const [ready, setReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [name, setName] = useState('');
  const [yearGroup, setYearGroup] = useState(2028);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!sb) {
      setError('Authentication is not configured.');
      setReady(true);
      return;
    }
    let alive = true;
    void sb.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSignedIn(Boolean(data.session));
      setReady(true);
    });
    const { data: listener } = sb.auth.onAuthStateChange((_event, session) => {
      if (alive) setSignedIn(Boolean(session));
    });
    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, [sb]);

  if (signedIn) return <>{children}</>;

  if (!ready) {
    return (
      <main className="onboarding" style={{ position: 'fixed', inset: 0, zIndex: 10000 }}>
        <div className="onboarding-card">
          <div className="logo">Bluo<span className="logo-dot" /></div>
          <h1>Loading Bluo…</h1>
          <p>Checking your secure session.</p>
        </div>
      </main>
    );
  }

  const submit = async () => {
    setError('');
    setSubmitting(true);
    try {
      if (!sb) throw new Error('Authentication is not configured.');
      const cleanUsername = username.trim().toLowerCase();
      if (password.length < 8) throw new Error('Password must be at least 8 characters.');

      if (mode === 'login') {
        if (!USERNAME_RE.test(cleanUsername)) throw new Error('Use your Bluo username (3–20 letters, numbers, or underscores).');
        const response = await fetch('/api/auth/username-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: cleanUsername, password }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || 'Incorrect username or password.');
        const { error: sessionError } = await sb.auth.setSession({ access_token: payload.access_token, refresh_token: payload.refresh_token });
        if (sessionError) throw sessionError;
        return;
      }

      const cleanEmail = email.trim().toLowerCase();
      if (!USERNAME_RE.test(cleanUsername)) throw new Error('Choose a username with 3–20 letters, numbers, or underscores.');
      if (!parseCollegeEmail(cleanEmail)) throw new Error('Use your PSC student email.');
      if (!name.trim()) throw new Error('Add your real name first.');
      if (!Number.isInteger(yearGroup) || yearGroup < 2027 || yearGroup > 2040) throw new Error('Choose your graduation year.');

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, email: cleanEmail, password, name: name.trim(), yearGroup, accessCode }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not create your account.');
      const { error: sessionError } = await sb.auth.setSession({ access_token: payload.access_token, refresh_token: payload.refresh_token });
      if (sessionError) throw sessionError;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not complete authentication.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="onboarding" style={{ position: 'fixed', inset: 0, zIndex: 10000, overflowY: 'auto' }}>
      <div className="onboarding-card">
        <div className="logo">Bluo<span className="logo-dot" /></div>
        <h1>{mode === 'signup' ? 'Find your people.' : 'Welcome back.'}</h1>
        <p>{mode === 'signup' ? "See who's nearby, find when your friends are free, and never spend a break alone. Bluo starts at Peter Symonds College." : 'Sign in with your Bluo username and password.'}</p>

        {mode === 'signup' && <>
          <label className="control-label">Your real name</label>
          <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your real name" autoComplete="name" />
          <label className="control-label">Username</label>
          <input className="input" value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="" autoComplete="username" maxLength={20} />
          <div className="notice" style={{ marginTop: 8 }}>Your username is how you will sign back in. It can use letters, numbers and underscores.</div>
          <label className="control-label">Graduation year</label>
          <select className="input" value={yearGroup} onChange={e => setYearGroup(Number(e.target.value))}>{Array.from({ length: 14 }, (_, i) => 2027 + i).map(y => <option value={y} key={y}>{y}</option>)}</select>
          <label className="control-label">PSC launch code</label>
          <input className="input" value={accessCode} onChange={e => setAccessCode(e.target.value)} placeholder="Launch code" autoComplete="off" />
          <label className="control-label">PSC student email</label>
          <input className="input" value={email} onChange={e => setEmail(e.target.value)} placeholder="Student email" inputMode="email" autoComplete="email" />
        </>}

        {mode === 'login' && <>
          <label className="control-label">Bluo username</label>
          <input className="input" value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="" inputMode="text" autoComplete="username" maxLength={20} />
        </>}

        <label className="control-label">Password</label>
        <input className="input" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
        <div className="notice" style={{ marginTop: 12 }}>Your PSC email is used for eligibility during signup. Bluo does not send a sign-in link — use your username and password to return.</div>
        {error && <div className="error">{error}</div>}
        <button className="primary" style={{ width: '100%', marginTop: 16 }} disabled={submitting} onClick={() => void submit()}>{submitting ? (mode === 'signup' ? 'Creating account…' : 'Signing in…') : mode === 'signup' ? 'Create your Bluo account' : 'Sign in'}</button>
        <button className="secondary" style={{ width: '100%', marginTop: 8 }} onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setPassword(''); setError(''); }}>{mode === 'signup' ? 'Already have an account? Sign in' : 'New to Bluo? Create an account'}</button>
      </div>
    </main>
  );
}
