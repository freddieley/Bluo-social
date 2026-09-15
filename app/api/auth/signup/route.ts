import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

// PSC college emails look like fley26@students.psc.ac.uk, where the trailing digits are the join year.
const COLLEGE_EMAIL = /^[a-z][a-z.]*?\d{2}@students\.psc\.ac\.uk$/;

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: unknown; password?: unknown; name?: unknown; yearGroup?: unknown; accessCode?: unknown };
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const yearGroup = typeof body.yearGroup === 'number' ? body.yearGroup : Number(body.yearGroup);
    const accessCode = typeof body.accessCode === 'string' ? body.accessCode : '';

    if (!COLLEGE_EMAIL.test(email)) return jsonError('Use your PSC email, e.g. fley26@students.psc.ac.uk.');
    if (password.length < 8) return jsonError('Password must be at least 8 characters.');
    if (!name) return jsonError('Add your real name first.');
    if (!Number.isInteger(yearGroup) || yearGroup < 2027 || yearGroup > 2040) return jsonError('Choose your graduation year.');

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !publishableKey || !secretKey) return jsonError('Authentication is not configured.', 500);

    const admin = createClient(url, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: codeValid, error: codeError } = await admin.rpc('validate_launch_code', { p_code: accessCode });
    if (codeError) { console.error('validate_launch_code failed', codeError); return jsonError('Could not verify the launch code.', 500); }
    if (codeValid !== true) return jsonError('That PSC launch code is not valid.');

    // Create the account already confirmed — PSC identity cannot be verified yet,
    // so requiring an email confirmation link would just lock genuine students out.
    const { error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, year_group: yearGroup },
    });

    if (createError) {
      if (/registered/i.test(createError.message)) return jsonError('That email already has a Bluo account. Try signing in instead.', 409);
      console.error('createUser failed', createError);
      return jsonError('Could not create your account right now.', 500);
    }

    const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: publishableKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });

    const payload = await response.json();
    if (!response.ok) { console.error('password grant failed after signup', payload); return jsonError('Account created — please sign in.', 401); }

    return NextResponse.json({
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
      expires_in: payload.expires_in,
      expires_at: payload.expires_at,
      token_type: payload.token_type,
      user: payload.user,
    });
  } catch (e) {
    console.error('signup route threw', e);
    return jsonError('Could not create your account right now.', 500);
  }
}
