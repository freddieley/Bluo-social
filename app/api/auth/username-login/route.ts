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
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !publishableKey || !secretKey) return jsonError('Authentication is not configured.', 500);

    // Resolve the public username to the underlying Auth email on the server.
    // The email is never returned to the browser.
    const admin = createClient(url, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (profileError) return jsonError('Could not sign in right now.', 500);
    if (!profile) return jsonError('Incorrect username or password.', 401);

    const { data: userData, error: userError } = await admin.auth.admin.getUserById(profile.id);
    if (userError || !userData.user?.email) return jsonError('Incorrect username or password.', 401);

    // Let Supabase Auth verify the password. We do not inspect, store, or hash
    // passwords ourselves, and the secret key is never sent to the browser.
    const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: publishableKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: userData.user.email, password }),
      cache: 'no-store',
    });

    const payload = await response.json();
    if (!response.ok) return jsonError('Incorrect username or password.', 401);

    return NextResponse.json({
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
      expires_in: payload.expires_in,
      expires_at: payload.expires_at,
      token_type: payload.token_type,
      user: payload.user,
    });
  } catch {
    return jsonError('Could not sign in right now.', 500);
  }
}
