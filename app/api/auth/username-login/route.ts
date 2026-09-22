import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { username?: unknown; password?: unknown };
    const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!/^[a-z0-9_]{3,20}$/.test(username)) return jsonError('Enter a valid username.');
    if (password.length < 8) return jsonError('Password must be at least 8 characters.');

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !secretKey) return jsonError('Authentication is not configured.', 500);

    // Resolve the public username to the underlying Auth user on the server.
    // The Auth email is never returned to the browser.
    const admin = createClient(url, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // limit(1) makes the login path resilient to an accidentally duplicated
    // username row instead of turning the request into a 500.
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id')
      .eq('username', username)
      .limit(1)
      .maybeSingle();

    if (profileError) {
      console.error('username-login profile lookup failed', profileError);
      return jsonError('Could not sign in right now.', 500);
    }
    if (!profile) return jsonError('Incorrect username or password.', 401);

    const { data: userData, error: userError } = await admin.auth.admin.getUserById(profile.id);
    if (userError || !userData.user?.email) {
      console.error('username-login auth user lookup failed', userError);
      return jsonError('Incorrect username or password.', 401);
    }

    // Verify the password through Supabase Auth using the server-only client.
    // This avoids depending on a browser/public key for the password grant.
    const { data: authData, error: authError } = await admin.auth.signInWithPassword({
      email: userData.user.email,
      password,
    });

    if (authError || !authData.session) {
      if (authError) console.error('username-login password verification failed', authError);
      return jsonError('Incorrect username or password.', 401);
    }

    return NextResponse.json({
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
      expires_in: authData.session.expires_in,
      expires_at: authData.session.expires_at,
      token_type: authData.session.token_type,
      user: authData.user,
    });
  } catch (error) {
    console.error('username-login route threw', error);
    return jsonError('Could not sign in right now.', 500);
  }
}
