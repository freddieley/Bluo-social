'use client';
import type { AvatarConfig } from '@/lib/types';

const hairPalette=['#2A1C17','#16120F','#6B3E27','#A96C3B','#D9C7B4','#8C8C96'];
const shirtPalette=['#1B78FF','#35A66B','#B35DE6','#F05A6D','#F39A3D','#7D6AF2'];
const bgPalette=['#E8F4FF','#F0F7FF','#F4F0FF','#FFF1F4','#FFF5E8','#EEF8F1'];

function paletteIndex(value:string,palette:string[]){const i=palette.indexOf(value);return i<0?0:i;}

export function Avatar({config,size=48}:{config:AvatarConfig;size?:number}){
  const c=config;
  const hairStyle=c.hairStyle ?? (['sidePart','short','bob','long','curls','afro'] as const)[paletteIndex(c.hair,hairPalette)];
  const faceShape=c.faceShape ?? (['oval','round','softSquare','heart','long','wide'] as const)[paletteIndex(c.bg,bgPalette)];
  const pose=c.pose ?? (['front','left','right','relaxed','handsIn','raised'] as const)[paletteIndex(c.shirt,shirtPalette)];
  const accessory=c.accessory ?? (['none','glasses','none','hairClip','earrings','none'] as const)[paletteIndex(c.bg,bgPalette)];
  const face = faceShape==='round' ? <circle cx="50" cy="53" r="29" fill={c.skin}/> : faceShape==='softSquare' ? <path d="M27 39Q30 27 50 27Q70 27 73 39V59Q70 80 50 84Q30 80 27 59Z" fill={c.skin}/> : faceShape==='heart' ? <path d="M50 83Q28 75 27 53Q27 35 40 29Q47 26 50 34Q53 26 60 29Q73 35 73 53Q72 75 50 83Z" fill={c.skin}/> : faceShape==='long' ? <ellipse cx="50" cy="54" rx="24" ry="32" fill={c.skin}/> : faceShape==='wide' ? <ellipse cx="50" cy="54" rx="31" ry="27" fill={c.skin}/> : <ellipse cx="50" cy="54" rx="27" ry="30" fill={c.skin}/>;
  const shoulders=pose==='left' ? <path d="M12 100Q18 78 39 72Q58 68 81 83L90 100Z" fill={c.shirt}/> : pose==='right' ? <path d="M10 100Q19 83 42 73Q64 68 87 79L92 100Z" fill={c.shirt}/> : <path d="M14 100Q18 78 50 70Q82 78 86 100Z" fill={c.shirt}/>;
  const neck=<path d="M43 73V84Q50 89 57 84V73Z" fill={c.skin}/>;
  const arms=pose==='left' ? <path d="M68 82Q79 85 85 96" fill="none" stroke={c.skin} strokeWidth="8" strokeLinecap="round"/> : pose==='right' ? <path d="M32 82Q21 86 15 96" fill="none" stroke={c.skin} strokeWidth="8" strokeLinecap="round"/> : pose==='relaxed' ? <><path d="M25 84Q16 90 17 99" fill="none" stroke={c.skin} strokeWidth="8" strokeLinecap="round"/><path d="M75 84Q84 90 83 99" fill="none" stroke={c.skin} strokeWidth="8" strokeLinecap="round"/></> : pose==='handsIn' ? <><path d="M27 87Q35 94 42 95" fill="none" stroke={c.skin} strokeWidth="7" strokeLinecap="round"/><path d="M73 87Q65 94 58 95" fill="none" stroke={c.skin} strokeWidth="7" strokeLinecap="round"/></> : pose==='raised' ? <><path d="M25 84Q13 72 18 58" fill="none" stroke={c.skin} strokeWidth="8" strokeLinecap="round"/><path d="M75 84Q87 72 82 58" fill="none" stroke={c.skin} strokeWidth="8" strokeLinecap="round"/></> : null;
  const hair=hairStyle==='short' ? <path d="M21 49Q18 18 50 14Q82 18 79 49Q70 38 58 36Q44 36 33 49Z" fill={c.hair}/> : hairStyle==='bob' ? <path d="M19 60Q16 18 50 13Q84 18 81 60L68 72V42Q59 33 50 35Q40 33 31 42V72Z" fill={c.hair}/> : hairStyle==='long' ? <path d="M18 63Q15 18 50 12Q85 18 82 63L70 87V43Q61 31 50 34Q39 31 30 43V87Z" fill={c.hair}/> : hairStyle==='curls' ? <><path d="M20 57Q15 22 50 12Q85 22 80 57Q72 43 62 38Q50 32 38 39Q27 44 20 57Z" fill={c.hair}/>{[26,37,49,61,74].map(x=><circle key={x} cx={x} cy="27" r="9" fill={c.hair}/>)}</> : hairStyle==='afro' ? <><circle cx="50" cy="36" r="29" fill={c.hair}/><circle cx="27" cy="38" r="11" fill={c.hair}/><circle cx="73" cy="38" r="11" fill={c.hair}/></> : <path d="M21 49Q18 18 50 12Q82 18 79 49Q66 30 50 31Q34 30 21 49Z" fill={c.hair}/>;
  return <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Bluo avatar" style={{borderRadius:'30%',background:c.bg,overflow:'hidden',display:'block'}}>
    <ellipse cx="50" cy="97" rx="38" ry="7" fill="rgba(38,68,100,.08)"/>{shoulders}{neck}{arms}{face}
    <path d="M27 50Q22 47 22 53Q23 59 28 58M73 50Q78 47 78 53Q77 59 72 58" fill={c.skin}/>{hair}
    <ellipse cx="40" cy="55" rx="3.5" ry="4.5" fill={c.eyes}/><ellipse cx="60" cy="55" rx="3.5" ry="4.5" fill={c.eyes}/>
    <path d="M44 69Q50 73 56 69" fill="none" stroke={c.mouth} strokeWidth="2.6" strokeLinecap="round"/>
    <circle cx="32" cy="65" r="4" fill="#E98989" opacity=".32"/><circle cx="68" cy="65" r="4" fill="#E98989" opacity=".32"/>
    {accessory==='glasses' && <><rect x="30" y="49" width="18" height="13" rx="5" fill="rgba(255,255,255,.18)" stroke={c.eyes} strokeWidth="2.2"/><rect x="52" y="49" width="18" height="13" rx="5" fill="rgba(255,255,255,.18)" stroke={c.eyes} strokeWidth="2.2"/><path d="M48 54h4" stroke={c.eyes} strokeWidth="2"/></>}
    {accessory==='hairClip' && <><path d="M66 30l7 6-9 4z" fill="#1B78FF"/><path d="M68 32l4 4" stroke="#fff" strokeWidth="1.2" opacity=".8"/></>}
    {accessory==='earrings' && <><circle cx="25" cy="58" r="2.3" fill="#F4C95D"/><circle cx="75" cy="58" r="2.3" fill="#F4C95D"/></>}
  </svg>;
}
