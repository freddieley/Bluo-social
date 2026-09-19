'use client';
import type { AvatarConfig } from '@/lib/types';

const hairPalette=['#2A1C17','#16120F','#6B3E27','#A96C3B','#D9C7B4','#8C8C96'];
const shirtPalette=['#1B78FF','#35A66B','#B35DE6','#F05A6D','#F39A3D','#7D6AF2'];
const bgPalette=['#E8F4FF','#F0F7FF','#F4F0FF','#FFF1F4','#FFF5E8','#EEF8F1'];
const hairStyles=['sidePart','short','bob','long','curls','afro','pixie','braids','bun','wavy'] as const;
const faceShapes=['oval','round','softSquare','heart','long','wide','diamond','square'] as const;
const poses=['front','left','right','relaxed','handsIn','raised','wave','peace'] as const;
const accessories=['none','glasses','none','hairClip','earrings','none'] as const;

function paletteIndex(value:string,palette:string[]){const i=palette.indexOf(value);return i<0?0:i;}

export function Avatar({config,size=48}:{config:AvatarConfig;size?:number}){
  const c=config;
  const hairStyle=c.hairStyle ?? hairStyles[paletteIndex(c.hair,hairPalette)];
  const faceShape=c.faceShape ?? faceShapes[paletteIndex(c.bg,bgPalette)];
  const pose=c.pose ?? poses[paletteIndex(c.shirt,shirtPalette)];
  const accessory=c.accessory ?? accessories[paletteIndex(c.bg,bgPalette)];
  const clothing=c.clothingStyle ?? 'tee';
  const eyeStyle=c.eyeStyle ?? 'round';
  const mouthStyle=c.mouthStyle ?? 'smile';

  const face = faceShape==='round' ? <circle cx="50" cy="53" r="29" fill={c.skin}/> : faceShape==='softSquare' ? <path d="M27 39Q30 27 50 27Q70 27 73 39V59Q70 80 50 84Q30 80 27 59Z" fill={c.skin}/> : faceShape==='heart' ? <path d="M50 83Q28 75 27 53Q27 35 40 29Q47 26 50 34Q53 26 60 29Q73 35 73 53Q72 75 50 83Z" fill={c.skin}/> : faceShape==='long' ? <ellipse cx="50" cy="54" rx="24" ry="32" fill={c.skin}/> : faceShape==='wide' ? <ellipse cx="50" cy="54" rx="31" ry="27" fill={c.skin}/> : faceShape==='diamond' ? <path d="M50 24Q72 35 74 54Q69 76 50 84Q31 76 26 54Q28 35 50 24Z" fill={c.skin}/> : faceShape==='square' ? <path d="M28 35Q31 27 50 27Q69 27 72 35V62Q68 79 50 83Q32 79 28 62Z" fill={c.skin}/> : <ellipse cx="50" cy="54" rx="27" ry="30" fill={c.skin}/>;

  const torsoBase=clothing==='hoodie' ? <path d="M10 100Q15 74 50 69Q85 74 90 100Z" fill={c.shirt}/> : clothing==='crew' ? <path d="M13 100Q18 76 50 70Q82 76 87 100Z" fill={c.shirt}/> : clothing==='polo' ? <path d="M13 100Q18 77 50 70Q82 77 87 100Z" fill={c.shirt}/> : clothing==='jacket' ? <><path d="M11 100Q17 76 50 69Q83 76 89 100Z" fill={c.shirt}/><path d="M50 73V100" stroke="rgba(255,255,255,.55)" strokeWidth="2"/></> : clothing==='striped' ? <><path d="M13 100Q18 76 50 70Q82 76 87 100Z" fill={c.shirt}/><path d="M19 87H81M16 94H84" stroke="rgba(255,255,255,.45)" strokeWidth="5"/></> : <path d="M14 100Q18 78 50 70Q82 78 86 100Z" fill={c.shirt}/>;
  const shoulders=pose==='left' ? <path d="M12 100Q18 78 39 72Q58 68 81 83L90 100Z" fill={c.shirt}/> : pose==='right' ? <path d="M10 100Q19 83 42 73Q64 68 87 79L92 100Z" fill={c.shirt}/> : torsoBase;
  const neck=<path d="M43 73V84Q50 89 57 84V73Z" fill={c.skin}/>;
  const arms=pose==='left' ? <path d="M68 82Q79 85 85 96" fill="none" stroke={c.skin} strokeWidth="8" strokeLinecap="round"/> : pose==='right' ? <path d="M32 82Q21 86 15 96" fill="none" stroke={c.skin} strokeWidth="8" strokeLinecap="round"/> : pose==='relaxed' ? <><path d="M25 84Q16 90 17 99" fill="none" stroke={c.skin} strokeWidth="8" strokeLinecap="round"/><path d="M75 84Q84 90 83 99" fill="none" stroke={c.skin} strokeWidth="8" strokeLinecap="round"/></> : pose==='handsIn' ? <><path d="M27 87Q35 94 42 95" fill="none" stroke={c.skin} strokeWidth="7" strokeLinecap="round"/><path d="M73 87Q65 94 58 95" fill="none" stroke={c.skin} strokeWidth="7" strokeLinecap="round"/></> : pose==='raised' ? <><path d="M25 84Q13 72 18 58" fill="none" stroke={c.skin} strokeWidth="8" strokeLinecap="round"/><path d="M75 84Q87 72 82 58" fill="none" stroke={c.skin} strokeWidth="8" strokeLinecap="round"/></> : pose==='wave' ? <><path d="M27 84Q18 75 23 64" fill="none" stroke={c.skin} strokeWidth="8" strokeLinecap="round"/><path d="M73 84Q82 75 84 64" fill="none" stroke={c.skin} strokeWidth="8" strokeLinecap="round"/><path d="M84 64l4-7M84 64l8-2M84 64l6 5" stroke={c.skin} strokeWidth="4" strokeLinecap="round"/></> : pose==='peace' ? <><path d="M27 86Q19 77 25 67" fill="none" stroke={c.skin} strokeWidth="8" strokeLinecap="round"/><path d="M73 86Q81 77 75 67" fill="none" stroke={c.skin} strokeWidth="8" strokeLinecap="round"/><path d="M75 67l-3-8M75 67l7-7" stroke={c.skin} strokeWidth="4" strokeLinecap="round"/></> : null;

  const hair=hairStyle==='short' ? <path d="M21 49Q18 18 50 14Q82 18 79 49Q70 38 58 36Q44 36 33 49Z" fill={c.hair}/> : hairStyle==='bob' ? <path d="M19 60Q16 18 50 13Q84 18 81 60L68 72V42Q59 33 50 35Q40 33 31 42V72Z" fill={c.hair}/> : hairStyle==='long' ? <path d="M18 63Q15 18 50 12Q85 18 82 63L70 87V43Q61 31 50 34Q39 31 30 43V87Z" fill={c.hair}/> : hairStyle==='curls' ? <><path d="M20 57Q15 22 50 12Q85 22 80 57Q72 43 62 38Q50 32 38 39Q27 44 20 57Z" fill={c.hair}/>{[26,37,49,61,74].map(x=><circle key={x} cx={x} cy="27" r="9" fill={c.hair}/>)}</> : hairStyle==='afro' ? <><circle cx="50" cy="36" r="29" fill={c.hair}/><circle cx="27" cy="38" r="11" fill={c.hair}/><circle cx="73" cy="38" r="11" fill={c.hair}/></> : hairStyle==='pixie' ? <path d="M22 50Q18 20 50 15Q78 18 77 46Q65 35 54 38L45 31Q35 42 22 50Z" fill={c.hair}/> : hairStyle==='braids' ? <><path d="M22 50Q18 19 50 13Q82 19 78 50Q68 34 58 35Q42 33 22 50Z" fill={c.hair}/><path d="M25 43Q14 58 24 78M75 43Q86 58 76 78" fill="none" stroke={c.hair} strokeWidth="8" strokeLinecap="round"/></> : hairStyle==='bun' ? <><circle cx="68" cy="18" r="13" fill={c.hair}/><path d="M21 50Q18 18 50 13Q82 18 79 50Q66 34 50 34Q34 34 21 50Z" fill={c.hair}/></> : hairStyle==='wavy' ? <path d="M19 61Q13 18 50 12Q87 18 81 61L70 83Q67 65 73 47Q61 36 50 39Q37 36 27 48Q33 65 30 83Z" fill={c.hair}/> : <path d="M21 49Q18 18 50 12Q82 18 79 49Q66 30 50 31Q34 30 21 49Z" fill={c.hair}/>;

  const eyes=eyeStyle==='wink' ? <><ellipse cx="40" cy="55" rx="3.5" ry="4.5" fill={c.eyes}/><path d="M57 55q3 3 6 0" fill="none" stroke={c.eyes} strokeWidth="2.5" strokeLinecap="round"/></> : eyeStyle==='soft' ? <><ellipse cx="40" cy="55" rx="3" ry="3.5" fill={c.eyes}/><ellipse cx="60" cy="55" rx="3" ry="3.5" fill={c.eyes}/></> : eyeStyle==='bright' ? <><circle cx="40" cy="55" r="4.5" fill={c.eyes}/><circle cx="60" cy="55" r="4.5" fill={c.eyes}/><circle cx="39" cy="53.5" r="1.3" fill="#fff"/><circle cx="59" cy="53.5" r="1.3" fill="#fff"/></> : eyeStyle==='wide' ? <><ellipse cx="40" cy="55" rx="4.5" ry="5.5" fill={c.eyes}/><ellipse cx="60" cy="55" rx="4.5" ry="5.5" fill={c.eyes}/></> : eyeStyle==='sleepy' ? <><path d="M36 55q4-3 8 0M56 55q4-3 8 0" fill="none" stroke={c.eyes} strokeWidth="2.4" strokeLinecap="round"/></> : <><ellipse cx="40" cy="55" rx="3.5" ry="4.5" fill={c.eyes}/><ellipse cx="60" cy="55" rx="3.5" ry="4.5" fill={c.eyes}/></>;
  const mouth=mouthStyle==='open' ? <ellipse cx="50" cy="70" rx="6" ry="4.5" fill={c.mouth}/> : mouthStyle==='neutral' ? <path d="M45 70h10" fill="none" stroke={c.mouth} strokeWidth="2.4" strokeLinecap="round"/> : mouthStyle==='laugh' ? <path d="M43 69Q50 78 57 69Q54 75 50 75Q46 75 43 69Z" fill={c.mouth}/> : mouthStyle==='smirk' ? <path d="M47 70Q53 72 57 68" fill="none" stroke={c.mouth} strokeWidth="2.5" strokeLinecap="round"/> : mouthStyle==='smallSmile' ? <path d="M46 70Q50 73 54 70" fill="none" stroke={c.mouth} strokeWidth="2.3" strokeLinecap="round"/> : <path d="M44 69Q50 73 56 69" fill="none" stroke={c.mouth} strokeWidth="2.6" strokeLinecap="round"/>;

  return <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Bluo avatar" style={{borderRadius:'30%',background:c.bg,overflow:'hidden',display:'block'}}>
    <ellipse cx="50" cy="97" rx="38" ry="7" fill="rgba(38,68,100,.08)"/>{shoulders}{neck}{arms}{face}
    <path d="M27 50Q22 47 22 53Q23 59 28 58M73 50Q78 47 78 53Q77 59 72 58" fill={c.skin}/>{hair}
    {eyes}{mouth}
    <circle cx="32" cy="65" r="4" fill="#E98989" opacity=".32"/><circle cx="68" cy="65" r="4" fill="#E98989" opacity=".32"/>
    {accessory==='glasses' && <><rect x="30" y="49" width="18" height="13" rx="5" fill="rgba(255,255,255,.18)" stroke={c.eyes} strokeWidth="2.2"/><rect x="52" y="49" width="18" height="13" rx="5" fill="rgba(255,255,255,.18)" stroke={c.eyes} strokeWidth="2.2"/><path d="M48 54h4" stroke={c.eyes} strokeWidth="2"/></>}
    {accessory==='hairClip' && <><path d="M66 30l7 6-9 4z" fill="#1B78FF"/><path d="M68 32l4 4" stroke="#fff" strokeWidth="1.2" opacity=".8"/></>}
    {accessory==='earrings' && <><circle cx="25" cy="58" r="2.3" fill="#F4C95D"/><circle cx="75" cy="58" r="2.3" fill="#F4C95D"/></>}
    {accessory==='headphones' && <><path d="M22 52Q22 22 50 22Q78 22 78 52" fill="none" stroke="#566B88" strokeWidth="4"/><rect x="18" y="48" width="9" height="18" rx="4" fill="#566B88"/><rect x="73" y="48" width="9" height="18" rx="4" fill="#566B88"/></>}
    {accessory==='cap' && <><path d="M25 31Q50 12 75 31V38Q50 29 25 38Z" fill="#1B78FF"/><path d="M61 34Q76 34 82 39Q70 43 60 40Z" fill="#1264D7"/></>}
  </svg>;
}
