import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function adminClient() {
  if (!supabaseUrl || !serviceRoleKey) throw new Error('Server authentication is not configured.');
  return createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { email?: string; username?: string; password?: string; name?: string; yearGroup?: number; accessCode?: string };
    const email = body.email?.trim().toLowerCase() ?? '';
    const username = body.username?.trim().toLowerCase() ?? '';
    const password = body.password ?? '';
    const name = body.name?.trim() ?? '';
    const yearGroup = Number(body.yearGroup);
    const accessCode = body.accessCode?.trim() ?? '';

    if (!email.endsWith('@students.psc.ac.uk')) return NextResponse.json({ error: 'Use your @students.psc.ac.uk email to join PSC.' }, { status: 400 });
    if (!/^[a-z0-9_]{3,30}$/.test(username)) return NextResponse.json({ error: 'Choose a username using 3-30 lowercase letters, numbers or underscores.' }, { status: 400 });
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    if (!name || name.length > 60) return NextResponse.json({ error: 'Add your real name (up to 60 characters).' }, { status: 400 });
    if (!Number.isInteger(yearGroup) || yearGroup < 2027 || yearGroup > 2040) return NextResponse.json({ error: 'Choose your graduation year.' }, { status: 400 });
    if (!accessCode) return NextResponse.json({ error: 'Enter the PSC launch code.' }, { status: 400 });

    const admin = adminClient();
    const { data: valid, error: codeError } = await admin.rpc('validate_launch_code', { p_code: accessCode });
    if (codeError) throw codeError;
    if (valid !== true) return NextResponse.json({ error: 'That PSC launch code is not valid.' }, { status: 403 });

    const { data: existingUsername } = await admin.from('profiles').select('id').eq('username', username).maybeSingle();
    if (existingUsername) return NextResponse.json({ error: 'That username is already taken.' }, { status: 409 });

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, year_group: yearGroup, username },
    });
    if (createError) {
      const message = createError.message.toLowerCase().includes('already')
        ? 'An account already exists for that PSC email. Try signing in.'
        : createError.message;
      return NextResponse.json({ error: message }, { status: createError.status && createError.status >= 400 ? createError.status : 400 });
    }

    // The database trigger creates the profile. We explicitly set the requested
    // username because it is the sign-in identifier users will see from now on.
    if (created.user) {
      const { error: profileError } = await admin.from('profiles').update({ username }).eq('id', created.user.id);
      if (profileError) throw profileError;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Bluo signup failed', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not create your Bluo account.' }, { status: 500 });
  }
}
