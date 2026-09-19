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
  const face = faceShape==='round' ? <circle cx="50" cy="55" r="28" fill={c.skin}/> : faceShape==='softSquare' ? <path d="M29 36Q32 27 50 27Q68 27 71 36V60Q68 81 50 84Q32 81 29 60Z" fill={c.skin}/> : faceShape==='heart' ? <path d="M50 82Q29 74 28 53Q27 35 40 30Q47 27 50 34Q53 27 60 30Q73 35 72 53Q71 74 50 82Z" fill={c.skin}/> : faceShape==='long' ? <ellipse cx="50" cy="55" rx="24" ry="31" fill={c.skin}/> : faceShape==='wide' ? <ellipse cx="50" cy="55" rx="31" ry="26" fill={c.skin}/> : <ellipse cx="50" cy="55" rx="27" ry="30" fill={c.skin}/>;
  const body = pose==='left' ? <><path d="M15 100Q18 76 40 72Q58 69 79 83L87 100Z" fill={c.shirt}/><path d="M67 82q11 3 17 13" fill="none" stroke={c.skin} strokeWidth="8" strokeLinecap="round"/></> : pose==='right' ? <><path d="M13 100Q21 82 42 74Q63 69 85 78L89 100Z" fill={c.shirt}/><path d="M32 82q-12 4-18 15" fill="none" stroke={c.skin} strokeWidth="8" strokeLinecap="round"/></> : pose==='relaxed' ? <><path d="M18 100Q20 77 50 71Q80 77 82 100Z" fill={c.shirt}/><path d="M25 84q-9 7-8 17M75 84q9 7 8 17" fill="none" stroke={c.skin} strokeWidth="8" strokeLinecap="round"/></> : pose==='handsIn' ? <><path d="M18 100Q21 76 50 71Q79 76 82 100Z" fill={c.shirt}/><path d="M27 88q8 7 15 7M73 88q-8 7-15 7" fill="none" stroke={c.skin} strokeWidth="7" strokeLinecap="round"/></> : pose==='raised' ? <><path d="M18 100Q21 76 50 71Q79 76 82 100Z" fill={c.shirt}/><path d="M24 84Q12 72 17 59M76 84Q88 72 83 59" fill="none" stroke={c.skin} strokeWidth="8" strokeLinecap="round"/></> : <path d="M18 100Q20 76 50 70Q80 76 82 100Z" fill={c.shirt}/>;
  const hair = hairStyle==='short' ? <path d="M22 49Q19 17 50 14Q81 17 78 49Q69 38 58 37Q45 37 34 49Z" fill={c.hair}/> : hairStyle==='bob' ? <path d="M20 58Q17 18 50 14Q83 18 80 58L68 70V42Q58 33 50 35Q39 33 32 42V70Z" fill={c.hair}/> : hairStyle==='long' ? <path d="M19 61Q16 18 50 13Q84 18 81 61L70 82V43Q61 31 50 34Q39 31 30 43V82Z" fill={c.hair}/> : hairStyle==='curls' ? <><path d="M21 56Q16 22 50 13Q84 22 79 56Q72 43 62 38Q51 33 39 39Q28 44 21 56Z" fill={c.hair}/>{[27,38,50,62,73].map(x=><circle key={x} cx={x} cy="27" r="9" fill={c.hair}/>)}</> : hairStyle==='afro' ? <><circle cx="50" cy="36" r="27" fill={c.hair}/><circle cx="28" cy="37" r="10" fill={c.hair}/><circle cx="72" cy="37" r="10" fill={c.hair}/></> : <path d="M22 48Q18 18 50 13Q82 18 78 48Q65 30 50 31Q35 30 22 48Z" fill={c.hair}/>;
  return <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Avatar" style={{borderRadius:'30%',background:c.bg,overflow:'hidden'}}>
    {body}
    {face}
    <path d="M27 50Q23 47 22 53Q23 59 28 58M73 50Q77 47 78 53Q77 59 72 58" fill={c.skin}/>
    {hair}
    <ellipse cx="40" cy="55" rx="3.5" ry="4.5" fill={c.eyes}/><ellipse cx="60" cy="55" rx="3.5" ry="4.5" fill={c.eyes}/>
    <path d="M43 70Q50 75 57 70" fill="none" stroke={c.mouth} strokeWidth="2.6" strokeLinecap="round"/>
    <circle cx="32" cy="65" r="4" fill="#E98989" opacity=".32"/><circle cx="68" cy="65" r="4" fill="#E98989" opacity=".32"/>
    {accessory==='glasses' && <><rect x="31" y="50" width="17" height="12" rx="5" fill="none" stroke={c.eyes} strokeWidth="2.2"/><rect x="52" y="50" width="17" height="12" rx="5" fill="none" stroke={c.eyes} strokeWidth="2.2"/><path d="M48 54h4" stroke={c.eyes} strokeWidth="2"/></>}
    {accessory==='hairClip' && <path d="M67 31l5 5-7 3z" fill="#1B78FF"/>}
    {accessory==='earrings' && <><circle cx="26" cy="58" r="2.2" fill="#F4C95D"/><circle cx="74" cy="58" r="2.2" fill="#F4C95D"/></>}
  </svg>;
}
