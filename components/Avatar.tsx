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

  const outline='#26364A';
  const shadow='#17345A';
  const skinShadow='rgba(91,52,35,.18)';
  const highlight='rgba(255,255,255,.28)';

  const face = faceShape==='round'
    ? <path d="M27 47Q27 27 50 25Q73 27 73 47V58Q70 78 50 83Q30 78 27 58Z" fill={c.skin} stroke={outline} strokeWidth="2.2"/>
    : faceShape==='softSquare'
    ? <path d="M28 40Q30 28 50 27Q70 28 72 40V59Q68 78 50 83Q32 78 28 59Z" fill={c.skin} stroke={outline} strokeWidth="2.2"/>
    : faceShape==='heart'
    ? <path d="M50 83Q28 77 27 55Q26 37 39 29Q46 25 50 34Q54 25 61 29Q74 37 73 55Q72 77 50 83Z" fill={c.skin} stroke={outline} strokeWidth="2.2"/>
    : faceShape==='long'
    ? <ellipse cx="50" cy="54" rx="24" ry="31" fill={c.skin} stroke={outline} strokeWidth="2.2"/>
    : faceShape==='wide'
    ? <ellipse cx="50" cy="54" rx="31" ry="27" fill={c.skin} stroke={outline} strokeWidth="2.2"/>
    : faceShape==='diamond'
    ? <path d="M50 25Q70 33 74 53Q69 75 50 83Q31 75 26 53Q30 33 50 25Z" fill={c.skin} stroke={outline} strokeWidth="2.2"/>
    : faceShape==='square'
    ? <path d="M29 36Q32 27 50 27Q68 27 71 36V61Q67 78 50 83Q33 78 29 61Z" fill={c.skin} stroke={outline} strokeWidth="2.2"/>
    : <ellipse cx="50" cy="54" rx="27" ry="30" fill={c.skin} stroke={outline} strokeWidth="2.2"/>;

  const torsoBase = clothing==='hoodie'
    ? <><path d="M11 101Q15 75 39 69L50 76L61 69Q85 75 89 101Z" fill={c.shirt} stroke={outline} strokeWidth="2.4"/><path d="M39 69Q42 78 50 80Q58 78 61 69" fill="none" stroke={highlight} strokeWidth="2.2"/><path d="M40 78Q35 84 35 100M60 78Q65 84 65 100" fill="none" stroke={shadow} strokeOpacity=".18" strokeWidth="2"/></>
    : clothing==='crew'
    ? <path d="M12 101Q16 77 38 71L50 76L62 71Q84 77 88 101Z" fill={c.shirt} stroke={outline} strokeWidth="2.4"/>
    : clothing==='polo'
    ? <><path d="M12 101Q16 77 38 71L50 76L62 71Q84 77 88 101Z" fill={c.shirt} stroke={outline} strokeWidth="2.4"/><path d="M43 73L50 82L57 73" fill="none" stroke={outline} strokeWidth="2"/><circle cx="55" cy="84" r="1.3" fill={outline}/><circle cx="55" cy="88" r="1.3" fill={outline}/></>
    : clothing==='jacket'
    ? <><path d="M11 101Q15 76 38 70L50 76L62 70Q85 76 89 101Z" fill={c.shirt} stroke={outline} strokeWidth="2.4"/><path d="M50 76V101" stroke={outline} strokeWidth="2"/><path d="M34 79L44 89L50 76L56 89L66 79" fill="none" stroke={highlight} strokeWidth="2"/></>
    : clothing==='striped'
    ? <><path d="M12 101Q16 77 38 71L50 76L62 71Q84 77 88 101Z" fill={c.shirt} stroke={outline} strokeWidth="2.4"/><path d="M17 87Q50 93 83 87M15 94Q50 100 85 94" fill="none" stroke="rgba(255,255,255,.48)" strokeWidth="5"/></>
    : <path d="M12 101Q16 77 38 71L50 76L62 71Q84 77 88 101Z" fill={c.shirt} stroke={outline} strokeWidth="2.4"/>;

  const shoulders=pose==='left'
    ? <path d="M10 101Q16 79 37 72Q57 68 83 82L91 101Z" fill={c.shirt} stroke={outline} strokeWidth="2.4"/>
    : pose==='right'
    ? <path d="M9 101Q18 82 42 72Q63 68 89 79L92 101Z" fill={c.shirt} stroke={outline} strokeWidth="2.4"/>
    : torsoBase;

  const neck=<path d="M42 72V84Q50 90 58 84V72Z" fill={c.skin} stroke={outline} strokeWidth="2"/>;

  const arms=pose==='left'
    ? <path d="M68 82Q80 85 86 97" fill="none" stroke={c.skin} strokeWidth="8" strokeLinecap="round"/>
    : pose==='right'
    ? <path d="M32 82Q20 86 14 97" fill="none" stroke={c.skin} strokeWidth="8" strokeLinecap="round"/>
    : pose==='relaxed'
    ? <><path d="M26 84Q16 91 17 99" fill="none" stroke={c.skin} strokeWidth="8" strokeLinecap="round"/><path d="M74 84Q84 91 83 99" fill="none" stroke={c.skin} strokeWidth="8" strokeLinecap="round"/></>
    : pose==='handsIn'
    ? <><path d="M27 87Q35 95 42 95" fill="none" stroke={c.skin} strokeWidth="7" strokeLinecap="round"/><path d="M73 87Q65 95 58 95" fill="none" stroke={c.skin} strokeWidth="7" strokeLinecap="round"/></>
    : pose==='raised'
    ? <><path d="M25 84Q12 71 18 57" fill="none" stroke={c.skin} strokeWidth="8" strokeLinecap="round"/><path d="M75 84Q88 71 82 57" fill="none" stroke={c.skin} strokeWidth="8" strokeLinecap="round"/></>
    : pose==='wave'
    ? <><path d="M27 84Q17 75 23 63" fill="none" stroke={c.skin} strokeWidth="8" strokeLinecap="round"/><path d="M73 84Q83 75 84 64" fill="none" stroke={c.skin} strokeWidth="8" strokeLinecap="round"/><path d="M84 64l4-7M84 64l8-2M84 64l6 5" stroke={c.skin} strokeWidth="4" strokeLinecap="round"/></>
    : pose==='peace'
    ? <><path d="M27 86Q18 77 25 67" fill="none" stroke={c.skin} strokeWidth="8" strokeLinecap="round"/><path d="M73 86Q82 77 75 67" fill="none" stroke={c.skin} strokeWidth="8" strokeLinecap="round"/><path d="M75 67l-3-8M75 67l7-7" stroke={c.skin} strokeWidth="4" strokeLinecap="round"/></>
    : null;

  const hair=hairStyle==='short'
    ? <path d="M20 50Q18 20 50 14Q82 20 80 50Q70 39 59 37Q44 36 32 49Z" fill={c.hair} stroke={outline} strokeWidth="2.4"/>
    : hairStyle==='sidePart'
    ? <><path d="M19 51Q17 19 49 13Q78 17 81 47Q69 35 56 34Q44 34 34 43Q29 47 19 51Z" fill={c.hair} stroke={outline} strokeWidth="2.4"/><path d="M57 16Q55 28 49 35" fill="none" stroke={highlight} strokeWidth="2.2" strokeLinecap="round"/></>
    : hairStyle==='bob'
    ? <path d="M19 61Q15 19 50 13Q85 19 81 61L69 73V43Q60 33 50 35Q40 33 31 43V73Z" fill={c.hair} stroke={outline} strokeWidth="2.4"/>
    : hairStyle==='long'
    ? <path d="M18 64Q15 18 50 12Q85 18 82 64L70 89V43Q61 31 50 34Q39 31 30 43V89Z" fill={c.hair} stroke={outline} strokeWidth="2.4"/>
    : hairStyle==='curls'
    ? <><path d="M20 57Q15 22 50 12Q85 22 80 57Q72 43 62 38Q50 32 38 39Q27 44 20 57Z" fill={c.hair} stroke={outline} strokeWidth="2.2"/>{[26,37,49,61,74].map((x,i)=><circle key={x} cx={x} cy={27+(i%2)*2} r="9" fill={c.hair} stroke={outline} strokeWidth="1.5"/> )}</>
    : hairStyle==='afro'
    ? <><circle cx="50" cy="37" r="30" fill={c.hair} stroke={outline} strokeWidth="2.4"/><circle cx="27" cy="39" r="11" fill={c.hair}/><circle cx="73" cy="39" r="11" fill={c.hair}/><path d="M27 27Q50 10 73 27" fill="none" stroke={highlight} strokeWidth="2" opacity=".45"/></>
    : hairStyle==='pixie'
    ? <path d="M22 51Q18 20 50 15Q79 18 78 46Q65 35 54 38L45 31Q35 42 22 51Z" fill={c.hair} stroke={outline} strokeWidth="2.4"/>
    : hairStyle==='braids'
    ? <><path d="M22 50Q18 19 50 13Q82 19 78 50Q68 34 58 35Q42 33 22 50Z" fill={c.hair} stroke={outline} strokeWidth="2.4"/><path d="M25 43Q14 58 24 79M75 43Q86 58 76 79" fill="none" stroke={c.hair} strokeWidth="9" strokeLinecap="round"/><path d="M20 54L26 58L19 63L25 67L21 72M80 54L74 58L81 63L75 67L79 72" fill="none" stroke={outline} strokeOpacity=".45" strokeWidth="1.5"/></>
    : hairStyle==='bun'
    ? <><circle cx="68" cy="18" r="13" fill={c.hair} stroke={outline} strokeWidth="2.2"/><path d="M21 50Q18 18 50 13Q82 18 79 50Q66 34 50 34Q34 34 21 50Z" fill={c.hair} stroke={outline} strokeWidth="2.4"/></>
    : <path d="M19 61Q13 18 50 12Q87 18 81 61L70 84Q67 65 73 47Q61 36 50 39Q37 36 27 48Q33 65 30 84Z" fill={c.hair} stroke={outline} strokeWidth="2.4"/>;

  const eyes=eyeStyle==='wink'
    ? <><ellipse cx="40" cy="55" rx="3.7" ry="4.7" fill={c.eyes} stroke={outline} strokeWidth=".8"/><path d="M57 55q3 3 6 0" fill="none" stroke={c.eyes} strokeWidth="2.7" strokeLinecap="round"/></>
    : eyeStyle==='soft'
    ? <><ellipse cx="40" cy="55" rx="3" ry="3.6" fill={c.eyes}/><ellipse cx="60" cy="55" rx="3" ry="3.6" fill={c.eyes}/></>
    : eyeStyle==='bright'
    ? <><circle cx="40" cy="55" r="4.5" fill={c.eyes}/><circle cx="60" cy="55" r="4.5" fill={c.eyes}/><circle cx="38.8" cy="53.5" r="1.35" fill="#fff"/><circle cx="58.8" cy="53.5" r="1.35" fill="#fff"/></>
    : eyeStyle==='wide'
    ? <><ellipse cx="40" cy="55" rx="4.5" ry="5.5" fill={c.eyes}/><ellipse cx="60" cy="55" rx="4.5" ry="5.5" fill={c.eyes}/><circle cx="39" cy="53.2" r="1.1" fill="#fff"/><circle cx="59" cy="53.2" r="1.1" fill="#fff"/></>
    : eyeStyle==='sleepy'
    ? <><path d="M36 55q4-3 8 0M56 55q4-3 8 0" fill="none" stroke={c.eyes} strokeWidth="2.4" strokeLinecap="round"/></>
    : <><ellipse cx="40" cy="55" rx="3.5" ry="4.5" fill={c.eyes}/><ellipse cx="60" cy="55" rx="3.5" ry="4.5" fill={c.eyes}/><circle cx="39" cy="53.5" r=".9" fill="#fff"/><circle cx="59" cy="53.5" r=".9" fill="#fff"/></>;

  const mouth=mouthStyle==='open'
    ? <ellipse cx="50" cy="70" rx="6" ry="4.5" fill={c.mouth} stroke={outline} strokeWidth="1.4"/>
    : mouthStyle==='neutral'
    ? <path d="M45 70h10" fill="none" stroke={c.mouth} strokeWidth="2.4" strokeLinecap="round"/>
    : mouthStyle==='laugh'
    ? <path d="M43 69Q50 78 57 69Q54 76 50 76Q46 76 43 69Z" fill={c.mouth} stroke={outline} strokeWidth="1"/>
    : mouthStyle==='smirk'
    ? <path d="M47 70Q53 72 57 68" fill="none" stroke={c.mouth} strokeWidth="2.5" strokeLinecap="round"/>
    : mouthStyle==='smallSmile'
    ? <path d="M46 70Q50 73 54 70" fill="none" stroke={c.mouth} strokeWidth="2.3" strokeLinecap="round"/>
    : <path d="M44 69Q50 74 56 69" fill="none" stroke={c.mouth} strokeWidth="2.7" strokeLinecap="round"/>;

  return <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label="Bluo avatar" style={{borderRadius:'30%',background:c.bg,overflow:'hidden',display:'block'}}>
    <defs><linearGradient id="bluoshine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".2"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient></defs>
    <ellipse cx="50" cy="97" rx="38" ry="7" fill="rgba(38,68,100,.12)"/>
    {shoulders}{neck}{arms}
    <path d="M43 74Q50 80 57 74" fill="none" stroke={skinShadow} strokeWidth="2"/>
    {face}
    <path d="M27 50Q22 47 22 53Q23 59 28 58M73 50Q78 47 78 53Q77 59 72 58" fill={c.skin} stroke={outline} strokeWidth="1.6"/>
    {hair}
    {eyes}{mouth}
    <circle cx="32" cy="65" r="4.5" fill="#E98989" opacity=".28"/><circle cx="68" cy="65" r="4.5" fill="#E98989" opacity=".28"/>
    <path d="M29 44Q35 39 41 39M59 39Q66 39 71 44" fill="none" stroke={outline} strokeWidth="1.4" strokeLinecap="round" opacity=".7"/>
    {accessory==='glasses' && <><rect x="30" y="49" width="18" height="13" rx="5" fill="rgba(255,255,255,.2)" stroke={outline} strokeWidth="2.2"/><rect x="52" y="49" width="18" height="13" rx="5" fill="rgba(255,255,255,.2)" stroke={outline} strokeWidth="2.2"/><path d="M48 54h4" stroke={outline} strokeWidth="2"/></>}
    {accessory==='hairClip' && <><path d="M66 29l8 7-10 5z" fill="#1B78FF" stroke={outline} strokeWidth="1.2"/><path d="M68 31l4 4" stroke="#fff" strokeWidth="1.3" opacity=".9"/></>}
    {accessory==='earrings' && <><circle cx="25" cy="58" r="2.6" fill="#F4C95D" stroke={outline} strokeWidth="1"/><circle cx="75" cy="58" r="2.6" fill="#F4C95D" stroke={outline} strokeWidth="1"/></>}
    {accessory==='headphones' && <><path d="M22 52Q22 22 50 22Q78 22 78 52" fill="none" stroke="#566B88" strokeWidth="4"/><rect x="18" y="48" width="9" height="18" rx="4" fill="#566B88"/><rect x="73" y="48" width="9" height="18" rx="4" fill="#566B88"/></>}
    {accessory==='cap' && <><path d="M25 31Q50 12 75 31V38Q50 29 25 38Z" fill="#1B78FF" stroke={outline} strokeWidth="1.8"/><path d="M61 34Q76 34 82 39Q70 43 60 40Z" fill="#1264D7" stroke={outline} strokeWidth="1.2"/></>}
    <rect x="0" y="0" width="100" height="100" rx="30" fill="url(#bluoshine)" pointerEvents="none"/>
  </svg>;
}
