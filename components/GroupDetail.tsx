'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Send, Users } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { joinGroup } from '@/lib/live';

type Group = { id: string; name: string; owner_id: string; community: string };
type Member = { user_id: string; display_name: string; avatar: Record<string, string> | null };
type Message = { id: string; sender_id: string; body: string; created_at: string };

export function GroupDetail({ sb, userId, group, onBack }: { sb: SupabaseClient; userId: string; group: Group; onBack: () => void }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    try {
      const [{ data: memberRows, error: memberError }, { data: messageRows, error: messageError }] = await Promise.all([
        sb.from('group_members').select('user_id').eq('group_id', group.id),
        sb.from('messages').select('id,sender_id,body,created_at').eq('group_id', group.id).order('created_at', { ascending: true }).limit(100),
      ]);
      if (memberError) throw memberError;
      if (messageError) throw messageError;
      const ids = (memberRows ?? []).map(row => row.user_id as string);
      if (ids.length) {
        const { data: profiles, error: profileError } = await sb.from('profiles').select('id,display_name,avatar').in('id', ids).order('display_name');
        if (profileError) throw profileError;
        const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));
        setMembers(ids.map(user_id => ({ user_id, display_name: profileMap.get(user_id)?.display_name ?? 'Student', avatar: profileMap.get(user_id)?.avatar ?? null })));
      } else {
        setMembers([]);
      }
      setMessages((messageRows ?? []) as Message[]);
      setIsMember(ids.includes(userId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load this group.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [group.id, userId, sb]);
  useEffect(() => {
    const id = window.setInterval(() => void load(), 10000);
    return () => window.clearInterval(id);
  }, [group.id, userId, sb]);

  const memberNames = useMemo(() => members.slice(0, 6).map(m => m.display_name).join(', '), [members]);

  const join = async () => {
    try {
      await joinGroup(sb, userId, group.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not join this group.');
    }
  };

  const send = async () => {
    const body = text.trim();
    if (!body || !isMember || sending) return;
    setSending(true);
    setError('');
    try {
      const { error: sendError } = await sb.from('messages').insert({ sender_id: userId, group_id: group.id, body });
      if (sendError) throw sendError;
      setText('');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send your message.');
    } finally {
      setSending(false);
    }
  };

  return <>
    <div className="hero-row">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="icon-btn" onClick={onBack} aria-label="Back to groups"><ArrowLeft size={18} /></button>
        <div><div className="eyebrow">PSC community group</div><h1 className="hero-title">{group.name}</h1></div>
      </div>
    </div>
    <div className="grid">
      <section className="card side-card">
        <div className="card-title">About this group</div>
        <div className="notice" style={{ marginTop: 10 }}><Users size={16} /> {members.length} member{members.length === 1 ? '' : 's'}{memberNames ? ` · ${memberNames}${members.length > 6 ? '…' : ''}` : ''}</div>
        {!isMember && <button className="primary" style={{ marginTop: 12, width: '100%' }} onClick={() => void join()}>Join group</button>}
        {isMember && <div className="notice" style={{ marginTop: 12 }}>You're a member. Messages are visible to group members.</div>}
        {error && <div className="error" style={{ marginTop: 12 }}>{error}</div>}
      </section>
      <section className="card side-card">
        <div className="card-title">Group chat</div>
        {!isMember ? <div className="notice" style={{ marginTop: 12 }}>Join the group to see and send messages.</div> : <>
          <div style={{ minHeight: 280, maxHeight: 430, overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            {loading ? <div className="person-meta">Loading…</div> : messages.length ? messages.map(m => <div key={m.id} style={{ alignSelf: m.sender_id === userId ? 'flex-end' : 'flex-start', maxWidth: '78%', padding: '9px 12px', borderRadius: 14, background: m.sender_id === userId ? '#e8f2ff' : '#f3f5f8' }}>{m.body}</div>) : <div className="person-meta">No messages yet. Start the conversation.</div>}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}><input className="input" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') void send(); }} placeholder="Message the group…" maxLength={4000} /><button className="primary" disabled={sending || !text.trim()} onClick={() => void send()} aria-label="Send message"><Send size={16} /></button></div>
        </>}
      </section>
    </div>
  </>;
}
