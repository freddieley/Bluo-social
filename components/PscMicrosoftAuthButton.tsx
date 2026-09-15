'use client';

import { useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { validateLaunchCode } from '@/lib/live';

type Props = {
  sb: SupabaseClient;
  mode: 'signup' | 'login';
  name: string;
  yearGroup: number;
  accessCode: string;
  onError: (message: string) => void;
};

export function PscMicrosoftAuthButton({ sb, mode, name, yearGroup, accessCode, onError }: Props) {
  const [loading, setLoading] = useState(false);

  const start = async () => {
    setLoading(true);
    onError('');

    try {
      if (mode === 'signup') {
        if (!name.trim()) throw new Error('Add your real name first.');
        if (!Number.isInteger(yearGroup) || yearGroup < 2027 || yearGroup > 2040) {
          throw new Error('Choose your graduation year.');
        }

        // The rollout code is checked before OAuth. Microsoft then supplies the
        // actual PSC identity, so we do not rely on an email confirmation link.
        const valid = await validateLaunchCode(sb, accessCode);
        if (!valid) throw new Error('That PSC launch code is not valid.');

        localStorage.setItem('bluo-pending-profile', JSON.stringify({
          name: name.trim(),
          yearGroup,
        }));
      } else {
        localStorage.removeItem('bluo-pending-profile');
      }

      const { error } = await sb.auth.signInWithOAuth({
        provider: 'azure',
        options: { scopes: 'email' },
      });

      if (error) throw error;
    } catch (e) {
      setLoading(false);
      onError(e instanceof Error ? e.message : 'Could not start PSC Microsoft sign-in.');
    }
  };

  return (
    <button
      type="button"
      className="secondary"
      style={{ width: '100%', marginTop: 8 }}
      onClick={() => void start()}
      disabled={loading}
    >
      {loading ? 'Opening PSC Microsoft sign-in…' : 'Continue with PSC Microsoft account'}
    </button>
  );
}
