import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { AvatarConfig, Person, Lesson } from './types';

const fallbackAvatar: AvatarConfig = { skin: '#F0B98A', hair: '#2A1C17', shirt: '#1B78FF', bg: '#E8F4FF', eyes: '#26344A', mouth: '#A95B55' };

type ProfileRow = { id: string; display_name: string; username: string; year_group: number | null; community: string; avatar: AvatarConfig; status: string; location_mode: string; visible_to: string; dnd: boolean; updated_at: string };
type FollowRow = { follower_id: string; following_id: string };
type LocationRow = { user_id: string; lat: number; lng: number; accuracy_m: number | null; updated_at: string; exact: boolean };
type AvailabilityRow = { user_id: string; free: boolean };
type TimetableRow = { id: string; user_id: string; day: number; start_time: string; end_time: string; subject: string; room: string | null };

function distanceText(lat: number, lng: number, myLat?: number, myLng?: number) {
  if (myLat == null || myLng == null) return 'nearby';
  const dLat = (lat - myLat) * 111_000;
  const dLng = (lng - myLng) * 111_000 * Math.cos((myLat * Math.PI) / 180);
  const metres = Math.sqrt(dLat * dLat + dLng * dLng);
  if (metres < 1000) return `${Math.max(20, Math.round(metres / 10) * 10)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

export async function validateLaunchCode(supabase: SupabaseClient, code: string) {
  const clean = code.trim();
  if (!clean) return false;
  const { data, error } = await supabase.rpc('validate_launch_code', { p_code: clean });
  if (error) throw error;
  return data === true;
}

export async function claimUsername(supabase: SupabaseClient, username: string) {
  const clean = username.trim().toLowerCase();
  const { data, error } = await supabase.rpc('claim_username', { p_username: clean });
  if (error) throw error;
  return data as string;
}

export async function ensureProfile(supabase: SupabaseClient, user: User) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (error) throw error;
  return data as ProfileRow;
}

export async function updateProfile(supabase: SupabaseClient, userId: string, patch: Partial<ProfileRow>) {
  const { data, error } = await supabase.from('profiles').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', userId).select('*').single();
  if (error) throw error;
  return data as ProfileRow;
}

export async function loadPeople(supabase: SupabaseClient, currentUserId: string, myLocation?: [number, number]) {
  const [{ data: profiles, error: profileError }, { data: follows, error: followError }, { data: locations, error: locationError }, { data: availability, error: availabilityError }] = await Promise.all([
    supabase.from('profiles').select('*').order('display_name'),
    supabase.from('follows').select('follower_id,following_id'),
    supabase.rpc('get_visible_locations'),
    supabase.rpc('get_visible_availability'),
  ]);
  if (profileError) throw profileError;
  if (followError) throw followError;
  if (locationError) throw locationError;
  if (availabilityError) throw availabilityError;

  const followRows = (follows ?? []) as FollowRow[];
  const locationRows = (locations ?? []) as LocationRow[];
  const availabilityRows = (availability ?? []) as AvailabilityRow[];
  const availabilityMap = new Map(availabilityRows.map((a) => [a.user_id, a.free]));
  const following = new Set(followRows.filter((f) => f.follower_id === currentUserId).map((f) => f.following_id));
  const followers = new Set(followRows.filter((f) => f.following_id === currentUserId).map((f) => f.follower_id));
  const mutual = new Set([...following].filter((id) => followers.has(id)));
  const locationMap = new Map(locationRows.map((l) => [l.user_id, l]));

  return (profiles as ProfileRow[]).filter((p) => p.id !== currentUserId).map((p): Person & { mutual: boolean; following: boolean; follower: boolean; exact: boolean } => {
    const loc = locationMap.get(p.id);
    const isMutual = mutual.has(p.id);
    const isFollowing = following.has(p.id);
    const isFollower = followers.has(p.id);
    return {
      id: p.id,
      name: p.display_name,
      year: p.year_group ?? 0,
      distance: loc ? distanceText(loc.lat, loc.lng, myLocation?.[0], myLocation?.[1]) : 'offline',
      status: p.status || (loc ? 'Around campus' : 'Not sharing location'),
      free: availabilityMap.get(p.id) ?? false,
      avatar: p.avatar || fallbackAvatar,
      location: loc ? [loc.lat, loc.lng] : [0, 0],
      updated: loc ? new Date(loc.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
      mutual: isMutual,
      following: isFollowing,
      follower: isFollower,
      exact: Boolean(loc?.exact),
    };
  });
}

export async function follow(supabase: SupabaseClient, currentUserId: string, targetId: string) {
  const { error } = await supabase.from('follows').insert({ follower_id: currentUserId, following_id: targetId });
  if (error && error.code !== '23505') throw error;
}

export async function unfollow(supabase: SupabaseClient, currentUserId: string, targetId: string) {
  const { error } = await supabase.from('follows').delete().eq('follower_id', currentUserId).eq('following_id', targetId);
  if (error) throw error;
}

export async function setLocation(supabase: SupabaseClient, coords: GeolocationCoordinates, hidden = false) {
  const { error } = await supabase.rpc('set_my_location', { p_lat: coords.latitude, p_lng: coords.longitude, p_accuracy: coords.accuracy, p_hidden: hidden });
  if (error && error.message !== 'location_rate_limited') throw error;
}

export async function getTimetable(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase.from('timetables').select('*').eq('user_id', userId).order('day').order('start_time');
  if (error) throw error;
  return (data ?? []) as TimetableRow[];
}

export async function replaceTimetable(supabase: SupabaseClient, userId: string, lessons: Lesson[]) {
  const { error: deleteError } = await supabase.from('timetables').delete().eq('user_id', userId);
  if (deleteError) throw deleteError;
  if (!lessons.length) return;
  const { error } = await supabase.from('timetables').insert(lessons.map((l) => ({ user_id: userId, day: l.day, start_time: l.start, end_time: l.end, subject: l.name, room: l.room ?? null })));
  if (error) throw error;
}

export async function getDirectMessages(supabase: SupabaseClient, currentUserId: string, otherId: string) {
  const { data, error } = await supabase.from('messages').select('id,sender_id,recipient_id,body,created_at').or(`and(sender_id.eq.${currentUserId},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${currentUserId})`).order('created_at', { ascending: true }).limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function sendDirectMessage(supabase: SupabaseClient, currentUserId: string, recipientId: string, body: string) {
  const text = body.trim();
  if (!text) return;
  const { error } = await supabase.from('messages').insert({ sender_id: currentUserId, recipient_id: recipientId, body: text });
  if (error) throw error;
}

export async function getGroups(supabase: SupabaseClient) {
  const { data, error } = await supabase.from('groups').select('id,name,owner_id,community,created_at').order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createGroup(supabase: SupabaseClient, userId: string, name: string) {
  const { data, error } = await supabase.from('groups').insert({ owner_id: userId, name: name.trim(), community: 'psc' }).select('*').single();
  if (error) throw error;
  const { error: memberError } = await supabase.from('group_members').insert({ group_id: data.id, user_id: userId });
  if (memberError) throw memberError;
  return data;
}

export async function joinGroup(supabase: SupabaseClient, userId: string, groupId: string) {
  const { error } = await supabase.from('group_members').insert({ group_id: groupId, user_id: userId });
  if (error && error.code !== '23505') throw error;
}
