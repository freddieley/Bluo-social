import fs from 'node:fs';

const path = 'components/BluoApp.tsx';
let source = fs.readFileSync(path, 'utf8');

const broken = 'permission can be enabled here.</div>}</div></>; }';
const fixed = 'permission can be enabled here.</div></>}</div></>; }';
if (source.includes(broken)) source = source.replace(broken, fixed);

// Make privacy settings server-backed and restore them from the authenticated profile.
const patches = [
  ["const [profile, setProfile] = useLocalState<AvatarConfig>('bluo-avatar', avatarDefaults);", "const [profile, setProfile] = useLocalState<AvatarConfig>('bluo-avatar', avatarDefaults); const [privacy, setPrivacy] = useState({ hidden: false, dnd: false });"],
  ["sb.from('profiles').select('display_name,avatar,year_group').eq('id', sessionUser.id).single()", "sb.from('profiles').select('display_name,avatar,year_group,visible_to,dnd').eq('id', sessionUser.id).single()"],
  ["setName(displayName); setProfile(data.avatar || avatarDefaults); if (nextYear) setYearGroup(nextYear);", "setName(displayName); setProfile(data.avatar || avatarDefaults); setPrivacy({ hidden: data.visible_to === 'nobody', dnd: Boolean(data.dnd) }); if (nextYear) setYearGroup(nextYear);"],
  ["await setLocation(sb, p.coords);", "await setLocation(sb, p.coords, privacy.hidden || privacy.dnd);"],
  ["}, [sb, sessionUser]);\n const visiblePeople", "}, [sb, sessionUser, privacy.hidden, privacy.dnd]);\n const visiblePeople"],
  [" const reportPerson = async (p: LivePerson) => { if (!sb || !sessionUser) return; const reason = typeof window !== 'undefined' ? window.prompt(`Report ${p.name}? Tell us what's wrong, e.g. impersonating someone else.`) : null; if (!reason || !reason.trim()) return; try { await reportUser(sb, sessionUser.id, p.id, reason); setError('Thanks — your report has been sent to the Bluo team.'); } catch (e) { setError(e instanceof Error ? e.message : 'Could not send your report.'); } };", " const reportPerson = async (p: LivePerson) => { if (!sb || !sessionUser) return; const reason = typeof window !== 'undefined' ? window.prompt(`Report ${p.name}? Tell us what's wrong, e.g. impersonating someone else.`) : null; if (!reason || !reason.trim()) return; try { await reportUser(sb, sessionUser.id, p.id, reason); setError('Thanks — your report has been sent to the Bluo team.'); } catch (e) { setError(e instanceof Error ? e.message : 'Could not send your report.'); } };\n const savePrivacy = async (next: { hidden: boolean; dnd: boolean }) => { if (!sb || !sessionUser) return; try { const saved = await updateProfile(sb, sessionUser.id, { dnd: next.dnd, visible_to: next.hidden ? 'nobody' : 'friends_exact_others_approx' }); setPrivacy({ hidden: saved.visible_to === 'nobody', dnd: Boolean(saved.dnd) }); setPeople(await loadPeople(sb, sessionUser.id, myLocation)); } catch (e) { setError(e instanceof Error ? e.message : 'Could not save privacy settings.'); } };"],
  ["{sheet && <Sheet type={sheet} close={() => setSheet(null)} mode={mode} ultra={ultra} setUltra={setUltra} profile={profile} setProfile={setProfile} lessons={lessons} sb={sb} userId={sessionUser.id} />}", "{sheet && <Sheet type={sheet} close={() => setSheet(null)} mode={mode} ultra={ultra} setUltra={setUltra} profile={profile} setProfile={setProfile} lessons={lessons} sb={sb} userId={sessionUser.id} privacy={privacy} onPrivacyChange={savePrivacy} />}"],
  ["function Sheet({ type, close, mode, ultra, setUltra, profile, setProfile, lessons, sb, userId }: { type: 'settings' | 'avatar' | 'timetable' | 'notifications'; close: () => void; mode: DataMode; ultra: boolean; setUltra: (v: boolean) => void; profile: AvatarConfig; setProfile: (v: AvatarConfig) => void; lessons: Lesson[]; sb: SupabaseClient | null; userId: string }) { const [hidden, setHidden] = useState(false); const [dnd, setDnd] = useState(false); const savePrivacy = async (h = hidden, d = dnd) => { if (sb && userId) try { await updateProfile(sb, userId, { dnd: d, visible_to: h ? 'nobody' : 'friends_exact_others_approx' }); } catch {} }; return <>", "function Sheet({ type, close, mode, ultra, setUltra, profile, setProfile, lessons, sb, userId, privacy, onPrivacyChange }: { type: 'settings' | 'avatar' | 'timetable' | 'notifications'; close: () => void; mode: DataMode; ultra: boolean; setUltra: (v: boolean) => void; profile: AvatarConfig; setProfile: (v: AvatarConfig) => void; lessons: Lesson[]; sb: SupabaseClient | null; userId: string; privacy: { hidden: boolean; dnd: boolean }; onPrivacyChange: (next: { hidden: boolean; dnd: boolean }) => Promise<void> }) { return <>"]
];

for (const [before, after] of patches) {
  if (!source.includes(before)) throw new Error(`BluoApp privacy patch could not find expected fragment: ${before.slice(0, 90)}`);
  source = source.replace(before, after);
}

const oldPrivacyButtons = "<button className={`option ${hidden ? 'selected' : ''}`} onClick={() => { const next = !hidden; setHidden(next); void savePrivacy(next, dnd); }}><b>{hidden ? 'Location hidden' : 'Location sharing on'}</b><span>Friends exact · others approx.</span></button><button className={`option ${dnd ? 'selected' : ''}`} onClick={() => { const next = !dnd; setDnd(next); void savePrivacy(hidden, next); }}><b>{dnd ? 'Lock In on' : 'Lock In / DND'}</b><span>Quiet notifications and sharing</span></button>";
const newPrivacyButtons = "<button className={`option ${privacy.hidden ? 'selected' : ''}`} onClick={() => { void onPrivacyChange({ ...privacy, hidden: !privacy.hidden }); }}><b>{privacy.hidden ? 'Location hidden' : 'Location sharing on'}</b><span>Friends exact · others approx.</span></button><button className={`option ${privacy.dnd ? 'selected' : ''}`} onClick={() => { void onPrivacyChange({ ...privacy, dnd: !privacy.dnd }); }}><b>{privacy.dnd ? 'Lock In on' : 'Lock In / DND'}</b><span>Quiet notifications and sharing</span></button>";
if (!source.includes(oldPrivacyButtons)) throw new Error('BluoApp privacy buttons not found');
source = source.replace(oldPrivacyButtons, newPrivacyButtons);

fs.writeFileSync(path, source);
console.log('Applied persistent Bluo privacy settings patch.');
