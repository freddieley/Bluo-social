import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function clients() {
  if (!supabaseUrl || !publishableKey || !serviceRoleKey) throw new Error('Server authentication is not configured.');
  return {
    admin: createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } }),
    auth: createClient(supabaseUrl, publishableKey, { auth: { autoRefreshToken: false, persistSession: false } }),
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { username?: string; password?: string };
    const username = body.username?.trim().toLowerCase() ?? '';
    const password = body.password ?? '';

    if (!/^[a-z0-9_]{3,30}$/.test(username)) return NextResponse.json({ error: 'Enter your Bluo username.' }, { status: 400 });
    if (!password) return NextResponse.json({ error: 'Enter your password.' }, { status: 400 });

    const { admin, auth } = clients();
    const { data: profile, error: profileError } = await admin.from('profiles').select('id').eq('username', username).maybeSingle();
    if (profileError) throw profileError;
    if (!profile) return NextResponse.json({ error: 'Username or password is incorrect.' }, { status: 401 });

    const { data: userData, error: userError } = await admin.auth.admin.getUserById(profile.id);
    if (userError || !userData.user?.email) return NextResponse.json({ error: 'Username or password is incorrect.' }, { status: 401 });

    const { data: sessionData, error: signInError } = await auth.auth.signInWithPassword({ email: userData.user.email, password });
    if (signInError || !sessionData.session) return NextResponse.json({ error: 'Username or password is incorrect.' }, { status: 401 });

    return NextResponse.json({ session: sessionData.session });
  } catch (error) {
    console.error('Bluo login failed', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not sign you in.' }, { status: 500 });
  }
}
