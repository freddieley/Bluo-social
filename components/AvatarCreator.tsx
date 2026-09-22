'use client';

import { useState } from 'react';
import { Check, ChevronLeft } from 'lucide-react';
import { Avatar } from './Avatar';
import type { AvatarConfig } from '@/lib/types';

type Tab='hair'|'face'|'pose'|'extras'|'clothing'|'expression'|'colours';
const tabs:{id:Tab;label:string}[]=[['hair','Hair'],['face','Face'],['pose','Pose'],['extras','Extras'],['clothing','Clothes'],['expression','Expression'],['colours','Colours']].map(([id,label])=>({id:id as Tab,label}));
const hair=[['short','Short'],['sidePart','Side part'],['bob','Bob'],['long','Long'],['curls','Curls'],['afro','Afro'],['pixie','Pixie'],['braids','Braids'],['bun','Bun'],['wavy','Wavy']] as const;
const face=[['round','Round'],['oval','Oval'],['softSquare','Soft square'],['heart','Heart'],['long','Long'],['wide','Wide'],['diamond','Diamond'],['square','Square']] as const;
const pose=[['front','Straight on'],['left','Turned left'],['right','Turned right'],['relaxed','Relaxed'],['handsIn','Hands in'],['raised','Hands up'],['wave','Wave'],['peace','Peace']] as const;
const extras=[['none','None'],['glasses','Glasses'],['hairClip','Hair clip'],['earrings','Earrings'],['headphones','Headphones'],['cap','Cap']] as const;
const clothing=[['tee','T-shirt'],['hoodie','Hoodie'],['crew','Crew neck'],['polo','Polo'],['jacket','Jacket'],['striped','Striped']] as const;
const eye=[['round','Round'],['soft','Soft'],['bright','Bright'],['wide','Wide'],['sleepy','Sleepy'],['wink','Wink']] as const;
const mouth=[['smile','Smile'],['smallSmile','Small smile'],['open','Open'],['neutral','Neutral'],['laugh','Laugh'],['smirk','Smirk']] as const;
const skinColours=['#F0B98A','#D99A70','#8C5A3B','#6E493A','#E7C19F','#B8734E'];
const hairColours=['#2A1C17','#16120F','#6B3E27','#A96C3B','#D9C7B4','#8C8C96'];
const shirtColours=['#1479FF','#35A66B','#B35DE6','#F05A6D','#F39A3D','#7D6AF2'];
const backgroundColours=['#EAF4FF','#F1F7FF','#F5F1FF','#FFF2F5','#FFF6E9','#EEF9F2'];
type Opt=readonly [string,string];

export function AvatarCreator({config,setConfig,close}:{config:AvatarConfig;setConfig:(c:AvatarConfig)=>void;close:()=>void}){
 const [tab,setTab]=useState<Tab>('hair');
 const update=(patch:Partial<AvatarConfig>)=>setConfig({...config,...patch});
 const selected=tab==='hair'?config.hairStyle:tab==='face'?config.faceShape:tab==='pose'?config.pose:tab==='extras'?config.accessory:tab==='clothing'?config.clothingStyle:undefined;
 return <div className="avatar-creator">
  <style jsx>{`
   .avatar-creator{font-family:'DM Sans',system-ui,sans-serif;color:#102f67;margin:-18px -20px -28px;background:#fff;height:94dvh;max-height:94dvh;display:flex;flex-direction:column;overflow:hidden;min-height:0}
   :global(.sheet:has(.avatar-creator)){padding-bottom:0;max-height:94dvh;height:94dvh;overflow:hidden}
   .ac-header{padding:4px 22px 12px;flex:0 0 auto}.ac-header-row{display:flex;align-items:center;gap:12px}.ac-back{width:36px;height:36px;border-radius:12px;background:#eef5ff;color:#1479ff;display:grid;place-items:center}.ac-title{font-family:'Plus Jakarta Sans';font-size:25px;line-height:1.1;letter-spacing:-.8px;font-weight:700;margin:0}.ac-sub{font-size:12px;color:#7286a6;margin:5px 0 0 48px;line-height:1.45}
   .ac-preview{margin:0 22px 14px;border-radius:25px;background:linear-gradient(145deg,#eaf5ff 0%,#f8fbff 55%,#fff 100%);border:1px solid #dceaf8;min-height:188px;display:grid;place-items:center;position:relative;overflow:hidden;box-shadow:0 10px 28px rgba(29,91,163,.08);flex:0 0 auto}
   .ac-preview:before{content:'';position:absolute;width:210px;height:210px;border-radius:50%;background:rgba(255,255,255,.55);top:-95px;right:-55px}.ac-preview:after{content:'';position:absolute;width:150px;height:150px;border-radius:50%;background:rgba(179,221,255,.18);bottom:-100px;left:-35px}.ac-preview-art{position:relative;z-index:1;filter:drop-shadow(0 10px 12px rgba(39,79,120,.10))}.ac-preview-label{position:absolute;z-index:2;left:16px;bottom:13px;background:rgba(255,255,255,.88);border:1px solid rgba(216,229,243,.9);padding:7px 10px;border-radius:12px;font-size:10px;font-weight:800;color:#587294;backdrop-filter:blur(8px)}
   .ac-tabs{display:flex;gap:6px;padding:4px 22px 11px;overflow-x:auto;scrollbar-width:none;flex:0 0 auto}.ac-tabs::-webkit-scrollbar{display:none}.ac-tab{white-space:nowrap;padding:8px 13px;border-radius:999px;background:#f1f5fa;color:#7084a3;font-size:10px;font-weight:800;border:1px solid transparent}
   .ac-tab.active{background:#1479ff;color:#fff;box-shadow:0 5px 12px rgba(20,121,255,.18)}
   .ac-scroll{flex:1 1 auto;min-height:0;min-width:0;overflow-y:auto;overflow-x:hidden;padding:0 22px 120px;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;touch-action:pan-y}.ac-section-title{font-family:'Plus Jakarta Sans';font-size:16px;font-weight:700;letter-spacing:-.25px;margin:2px 0 10px}.ac-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.ac-choice{position:relative;min-width:0;padding:7px 6px 9px;border:1px solid #e0e9f4;background:#f8fbff;border-radius:20px;text-align:center;transition:.16s;box-shadow:0 3px 10px rgba(30,70,115,.035)}.ac-choice:active{transform:scale(.98)}.ac-choice.selected{border-color:#1479ff;background:#edf6ff;box-shadow:0 0 0 2px rgba(20,121,255,.13),0 7px 18px rgba(20,121,255,.10)}.ac-art{height:105px;border-radius:16px;background:linear-gradient(145deg,#f2efff,#edf6ff);display:grid;place-items:center;overflow:hidden}.ac-art :global(svg){width:96px!important;height:96px!important}.ac-label{display:block;color:#1b3b70;font-size:10px;font-weight:800;margin-top:7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ac-check{position:absolute;top:10px;right:10px;width:22px;height:22px;border-radius:50%;background:#1479ff;color:#fff;display:grid;place-items:center;box-shadow:0 4px 10px rgba(20,121,255,.22)}
   .ac-colours{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding-bottom:16px}.ac-colour{padding:13px;border:1px solid #e0e9f4;background:#f8fbff;border-radius:18px}.ac-colour b{display:block;font-size:11px}.ac-colour span{display:block;color:#8291a8;font-size:9px;margin:2px 0 10px}.ac-swatches{display:flex;gap:8px;flex-wrap:wrap}.ac-swatch{display:block;flex:0 0 29px;width:29px;height:29px;min-width:29px;min-height:29px;padding:0;margin:0;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 1px #d9e3ef;appearance:none;-webkit-appearance:none;cursor:pointer}.ac-swatch.selected{box-shadow:0 0 0 2px #1479ff,0 4px 10px rgba(20,121,255,.14)}
   .ac-footer{position:sticky;bottom:0;display:flex;gap:10px;padding:12px 22px 18px;background:linear-gradient(to bottom,rgba(255,255,255,0),#fff 22%);z-index:4;flex:0 0 auto}.ac-footer button{flex:1;height:56px;border-radius:19px;font-weight:800;font-size:15px}.ac-done{background:#edf3fa;color:#183764}.ac-save{background:#1479ff;color:#fff;box-shadow:0 10px 24px rgba(20,121,255,.24);display:flex;align-items:center;justify-content:center;gap:7px}
   @media(min-width:700px){.avatar-creator{margin:-18px -20px -28px;height:94dvh;max-height:94dvh}.ac-preview{margin:0 28px 16px;min-height:220px}.ac-header{padding-left:28px;padding-right:28px}.ac-tabs,.ac-scroll{padding-left:28px;padding-right:28px}.ac-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.ac-footer{padding-left:28px;padding-right:28px}.ac-art{height:115px}}
   @media(max-width:520px){.ac-header{padding-top:0}.ac-sub{display:none}.ac-preview{min-height:170px;margin-bottom:10px}.ac-preview-art :global(svg){width:154px!important;height:154px!important}.ac-tabs{padding-bottom:9px}.ac-scroll{padding-bottom:110px}.ac-grid{gap:8px}.ac-choice{border-radius:18px;padding:6px 5px 8px}.ac-art{height:94px;border-radius:14px}.ac-art :global(svg){width:88px!important;height:88px!important}.ac-colours{grid-template-columns:1fr}.ac-footer{padding-left:16px;padding-right:16px}.ac-footer button{height:58px}}
  `}</style>
  <header className="ac-header"><div className="ac-header-row"><button type="button" className="ac-back" onClick={close} aria-label="Close"><ChevronLeft size={20}/></button><h2 className="ac-title">Make your Bluo</h2></div><p className="ac-sub">Create a character that feels like you. You can change it whenever you want.</p></header>
  <div className="ac-preview"><div className="ac-preview-art"><Avatar config={config} size={170}/></div><div className="ac-preview-label">Your Bluo · {tab==='colours'?'Colours':tab.charAt(0).toUpperCase()+tab.slice(1)}</div></div>
  <div className="ac-tabs">{tabs.map(t=><button type="button" key={t.id} className={`ac-tab ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}>{t.label}</button>)}</div>
  <div className="ac-scroll">
   {tab==='hair'&&<Options title="Choose a hairstyle" options={hair} selected={selected} patch={id=>({hairStyle:id as AvatarConfig['hairStyle']})} update={update}/>} 
   {tab==='face'&&<Options title="Choose a face shape" options={face} selected={selected} patch={id=>({faceShape:id as AvatarConfig['faceShape']})} update={update}/>} 
   {tab==='pose'&&<Options title="Choose a pose" options={pose} selected={selected} patch={id=>({pose:id as AvatarConfig['pose']})} update={update}/>} 
   {tab==='extras'&&<Options title="Add an extra" options={extras} selected={selected} patch={id=>({accessory:id as AvatarConfig['accessory']})} update={update}/>} 
   {tab==='clothing'&&<Options title="Choose clothing" options={clothing} selected={selected} patch={id=>({clothingStyle:id as AvatarConfig['clothingStyle']})} update={update}/>} 
   {tab==='expression'&&<><Options title="Eyes" options={eye} selected={config.eyeStyle} patch={id=>({eyeStyle:id as AvatarConfig['eyeStyle']})} update={update}/><div style={{height:16}}/><Options title="Mouth" options={mouth} selected={config.mouthStyle} patch={id=>({mouthStyle:id as AvatarConfig['mouthStyle']})} update={update}/></>}
   {tab==='colours'&&<Colours config={config} update={update}/>} 
  </div>
  <div className="ac-footer"><button type="button" className="ac-done" onClick={close}>Done</button><button type="button" className="ac-save" onClick={close}><Check size={18}/>Save character</button></div>
 </div>;
}
function Options({title,options,selected,patch,update}:{title:string;options:readonly Opt[];selected?:string;patch:(id:string)=>Partial<AvatarConfig>;update:(p:Partial<AvatarConfig>)=>void}){
 return <section><h3 className="ac-section-title">{title}</h3><div className="ac-grid">{options.map(([id,label])=><button type="button" key={id} className={`ac-choice ${selected===id?'selected':''}`} onClick={()=>update(patch(id))}><span className="ac-art"><Avatar config={{skin:'#D99A70',hair:'#2A1C17',shirt:'#1479FF',bg:'#EAF4FF',eyes:'#25364d',mouth:'#8f4e51',...patch(id)}} size={96}/></span><span className="ac-label">{label}</span>{selected===id&&<span className="ac-check"><Check size={13}/></span>}</button>)}</div></section>;
}
function Colours({config,update}:{config:AvatarConfig;update:(p:Partial<AvatarConfig>)=>void}){
 const groups:[string,'skin'|'hair'|'shirt'|'bg',string[]][]=[['Skin tone','skin',skinColours],['Hair colour','hair',hairColours],['Top colour','shirt',shirtColours],['Background','bg',backgroundColours]];
 return <div className="ac-colours">{groups.map(([label,key,values])=><section className="ac-colour" key={key} style={{display:'block',padding:'13px',border:'1px solid #e0e9f4',background:'#f8fbff',borderRadius:'18px'}}><b style={{display:'block',fontSize:'11px',lineHeight:1.2}}>{label}</b><span style={{display:'block',color:'#8291a8',fontSize:'9px',lineHeight:1.2,margin:'4px 0 10px'}}>Choose a colour</span><div className="ac-swatches" style={{display:'flex',gap:'9px',flexWrap:'wrap'}}>{values.map(v=><div key={v} role="radio" aria-checked={config[key]===v} tabIndex={0} className={`ac-swatch ${config[key]===v?'selected':''}`} style={{display:'block',flex:'0 0 29px',width:'29px',height:'29px',minWidth:'29px',minHeight:'29px',padding:0,margin:0,borderRadius:'50%',border:'3px solid #fff',backgroundColor:v,boxShadow:config[key]===v?'0 0 0 2px #1479ff,0 4px 10px rgba(20,121,255,.14)':'0 0 0 1px #d9e3ef',cursor:'pointer'}} onClick={()=>update({[key]:v})} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();update({[key]:v})}}} aria-label={`${label}: ${v}`}/>)}</div></section>)}</div>;
}
