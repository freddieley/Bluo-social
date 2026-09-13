'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    const run = async () => {
      const supabase = supabaseBrowser();
      if (!supabase) {
        setError('Supabase is not configured yet.');
        return;
      }
      const code = new URLSearchParams(window.location.search).get('code');
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }
      }
      router.replace('/');
      router.refresh();
    };
    void run();
  }, [router]);

  return <main className="onboarding"><div className="onboarding-card"><div className="logo">Bluo<span className="logo-dot" /></div><h1>Signing you in…</h1><p>{error || 'Finishing your secure PSC account setup.'}</p>{error && <button className="primary" onClick={() => router.replace('/')}>Back to Bluo</button>}</div></main>;
}
