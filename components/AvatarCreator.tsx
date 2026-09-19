'use client';

import { useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { Avatar } from './Avatar';
import type { AvatarConfig } from '@/lib/types';

type Tab='hair'|'face'|'pose'|'extras'|'clothing'|'expression'|'colours';
const tabs:{id:Tab;label:string}[]=[
 {id:'hair',label:'Hair'},{id:'face',label:'Face'},{id:'pose',label:'Pose'},{id:'extras',label:'Extras'},
 {id:'clothing',label:'Clothes'},{id:'expression',label:'Expression'},{id:'colours',label:'Colours'},
];

const hairOptions=[
 ['short','Short'],['sidePart','Side part'],['bob','Bob'],['long','Long'],['curls','Curls'],['afro','Afro'],['pixie','Pixie'],['braids','Braids'],['bun','Bun'],['wavy','Wavy'],
] as const;
const faceOptions=[['round','Round'],['oval','Oval'],['softSquare','Soft square'],['heart','Heart'],['long','Long'],['wide','Wide'],['diamond','Diamond'],['square','Square']] as const;
const poseOptions=[['front','Straight on'],['left','Turned left'],['right','Turned right'],['relaxed','Relaxed'],['handsIn','Hands in'],['raised','Hands up'],['wave','Wave'],['peace','Peace']] as const;
const extraOptions=[['none','None'],['glasses','Glasses'],['hairClip','Hair clip'],['earrings','Earrings'],['headphones','Headphones'],['cap','Cap']] as const;
const clothingOptions=[['tee','T-shirt'],['hoodie','Hoodie'],['crew','Crew neck'],['polo','Polo'],['jacket','Jacket'],['striped','Striped']] as const;
const eyeOptions=[['round','Round'],['soft','Soft'],['bright','Bright'],['wide','Wide'],['sleepy','Sleepy'],['wink','Wink']] as const;
const mouthOptions=[['smile','Smile'],['smallSmile','Small smile'],['open','Open'],['neutral','Neutral'],['laugh','Laugh'],['smirk','Smirk']] as const;
const skinColours=['#F0B98A','#D99A70','#8C5A3B','#6E493A','#E7C19F','#B8734E'];
const hairColours=['#2A1C17','#16120F','#6B3E27','#A96C3B','#D9C7B4','#8C8C96'];
const shirtColours=['#1B78FF','#35A66B','#B35DE6','#F05A6D','#F39A3D','#7D6AF2'];
const backgroundColours=['#E8F4FF','#F0F7FF','#F4F0FF','#FFF1F4','#FFF5E8','#EEF8F1'];

type OptionTuple=readonly [string,string];

export function AvatarCreator({config,setConfig,close}:{config:AvatarConfig;setConfig:(c:AvatarConfig)=>void;close:()=>void}){
 const [tab,setTab]=useState<Tab>('hair');
 const update=(patch:Partial<AvatarConfig>)=>setConfig({...config,...patch});
 const optionConfig=(patch:Partial<AvatarConfig>):AvatarConfig=>({...config,...patch});
 const selectedLabel=tab==='hair'?hairOptions.find(x=>x[0]===config.hairStyle)?.[1]:tab==='face'?faceOptions.find(x=>x[0]===config.faceShape)?.[1]:tab==='pose'?poseOptions.find(x=>x[0]===config.pose)?.[1]:tab==='extras'?extraOptions.find(x=>x[0]===config.accessory)?.[1]:tab==='clothing'?clothingOptions.find(x=>x[0]===config.clothingStyle)?.[1]:tab==='expression'?(eyeOptions.find(x=>x[0]===config.eyeStyle)?.[1]??'')+' eyes':undefined;
 return <div className="avatar-creator">
   <style jsx>{`.avatar-creator{display:flex;flex-direction:column;gap:18px}.avatar-creator-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start}.avatar-creator-head h2{font-family:'Plus Jakarta Sans';font-size:25px;letter-spacing:-.7px;margin:5px 0}.avatar-creator-head p{margin:0;color:#7183a3;font-size:12px;line-height:1.5;max-width:490px}.avatar-creator-spark{width:40px;height:40px;border-radius:14px;background:#eaf3ff;color:#1479ff;display:grid;place-items:center;flex:none}.avatar-creator-stage{display:grid;grid-template-columns:180px 1fr;gap:18px;align-items:center;padding:16px;border:1px solid #e7edf6;border-radius:24px;background:linear-gradient(145deg,#edf7ff,#fff)}.avatar-creator-preview{display:grid;place-items:center;min-height:190px}.avatar-creator-preview-copy{display:flex;flex-direction:column;gap:5px}.avatar-creator-preview-copy b{font-family:'Plus Jakarta Sans';font-size:16px}.avatar-creator-preview-copy span{font-size:12px;color:#7183a3;line-height:1.5}.avatar-tabs{display:flex;gap:6px;overflow-x:auto;padding:3px 1px 7px;scrollbar-width:none}.avatar-tabs::-webkit-scrollbar{display:none}.avatar-tab{white-space:nowrap;padding:9px 12px;border-radius:12px;background:#f3f6fa;color:#72839f;font-size:11px;font-weight:800}.avatar-tab.active{background:#1479ff;color:#fff;box-shadow:0 7px 16px rgba(20,121,255,.18)}.avatar-choice-section{display:flex;flex-direction:column;gap:10px}.avatar-choice-title{font-size:12px;font-weight:800;color:#6d82a5}.avatar-choice-grid{display:grid;gap:8px}.avatar-choice{position:relative;min-width:0;padding:8px 5px 9px;border:1px solid #e7edf6;background:#f8faff;border-radius:17px;text-align:center;transition:.16s}.avatar-choice:hover{transform:translateY(-1px);border-color:#a9cdfb}.avatar-choice.selected{border-color:#75b5ff;background:#eef6ff;box-shadow:inset 0 0 0 1px #75b5ff}.avatar-choice-art{display:grid;place-items:center;min-height:84px}.avatar-choice-label{display:block;font-size:10px;font-weight:800;color:#526b8e;margin-top:3px}.avatar-choice-check{position:absolute;top:6px;right:6px;width:20px;height:20px;border-radius:50%;background:#1479ff;color:#fff;display:grid;place-items:center}.colour-choice-list{display:grid;gap:10px}.colour-choice-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 12px;border:1px solid #e7edf6;border-radius:16px;background:#fbfcfe}.colour-choice-row>div:first-child{display:flex;flex-direction:column;gap:2px}.colour-choice-row b{font-size:11px}.colour-choice-row span{font-size:10px;color:#8391a7}.colour-choice-swatches{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.colour-choice-swatch{width:28px;height:28px;border-radius:50%;border:3px solid #fff;box-shadow:0 0 0 1px #dce4ef}.colour-choice-swatch.selected{box-shadow:0 0 0 2px #1479ff}.avatar-creator-actions{display:flex;gap:10px}.avatar-creator-actions>*{flex:1;display:flex;justify-content:center;align-items:center;gap:6px}.avatar-creator-note{font-size:10px;color:#8291a8;text-align:center;margin-top:-8px}@media(max-width:600px){.avatar-creator-stage{grid-template-columns:125px 1fr;padding:12px}.avatar-creator-preview{min-height:140px}.avatar-creator-preview :global(svg){width:135px!important;height:135px!important}.avatar-choice-grid{grid-template-columns:repeat(3,minmax(0,1fr))!important}.avatar-choice-art{min-height:75px}.avatar-choice-art :global(svg){width:68px!important;height:68px!important}}`}</style>
   <div className="avatar-creator-head"><div><div className="eyebrow">Your character</div><h2>Make it yours</h2><p>Mix and match the details that feel like you. Nothing is permanent — you can change your character whenever you want.</p></div><div className="avatar-creator-spark"><Sparkles size={18}/></div></div>
   <div className="avatar-creator-stage"><div className="avatar-creator-preview"><Avatar config={config} size={190}/></div><div className="avatar-creator-preview-copy"><b>{selectedLabel ? `${selectedLabel} selected.` : 'Your character, your way.'}</b><span>This is how your character appears across Bluo. Try a few combinations and make it feel yours.</span></div></div>
   <div className="avatar-tabs" role="tablist" aria-label="Character options">{tabs.map(item=><button key={item.id} className={`avatar-tab ${tab===item.id?'active':''}`} onClick={()=>setTab(item.id)} role="tab" aria-selected={tab===item.id}>{item.label}</button>)}</div>
   <div className="avatar-option-panel">
    {tab==='hair'&&<VisualOptions title="Choose a hairstyle" options={hairOptions} selected={config.hairStyle} makeConfig={id=>optionConfig({hairStyle:id as AvatarConfig['hairStyle']})} onSelect={id=>update({hairStyle:id as AvatarConfig['hairStyle']})}/>} 
    {tab==='face'&&<VisualOptions title="Choose a face shape" options={faceOptions} selected={config.faceShape} makeConfig={id=>optionConfig({faceShape:id as AvatarConfig['faceShape']})} onSelect={id=>update({faceShape:id as AvatarConfig['faceShape']})}/>} 
    {tab==='pose'&&<VisualOptions title="Choose a pose" options={poseOptions} selected={config.pose} makeConfig={id=>optionConfig({pose:id as AvatarConfig['pose']})} onSelect={id=>update({pose:id as AvatarConfig['pose']})}/>} 
    {tab==='extras'&&<VisualOptions title="Add something extra" options={extraOptions} selected={config.accessory} makeConfig={id=>optionConfig({accessory:id as AvatarConfig['accessory']})} onSelect={id=>update({accessory:id as AvatarConfig['accessory']})}/>} 
    {tab==='clothing'&&<VisualOptions title="Pick your top" options={clothingOptions} selected={config.clothingStyle} makeConfig={id=>optionConfig({clothingStyle:id as AvatarConfig['clothingStyle']})} onSelect={id=>update({clothingStyle:id as AvatarConfig['clothingStyle']})}/>} 
    {tab==='expression'&&<><VisualOptions title="Eye style" options={eyeOptions} selected={config.eyeStyle} makeConfig={id=>optionConfig({eyeStyle:id as AvatarConfig['eyeStyle']})} onSelect={id=>update({eyeStyle:id as AvatarConfig['eyeStyle']})}/><div style={{height:10}}/><VisualOptions title="Mouth style" options={mouthOptions} selected={config.mouthStyle} makeConfig={id=>optionConfig({mouthStyle:id as AvatarConfig['mouthStyle']})} onSelect={id=>update({mouthStyle:id as AvatarConfig['mouthStyle']})}/></>}
    {tab==='colours'&&<ColourOptions config={config} update={update}/>} 
   </div>
   <div className="avatar-creator-actions"><button className="secondary" onClick={close}>Done</button><button className="primary" onClick={close}><Check size={16}/>Save character</button></div>
   <div className="avatar-creator-note">Your character is only an illustration — it doesn't need to match you exactly.</div>
 </div>;
}

function VisualOptions<T extends string>({title,options,selected,makeConfig,onSelect}:{title:string;options:readonly OptionTuple[];selected?:T;makeConfig:(id:string)=>AvatarConfig;onSelect:(id:string)=>void}){
 return <section className="avatar-choice-section"><div className="avatar-choice-title">{title}</div><div className="avatar-choice-grid" style={{gridTemplateColumns:'repeat(4,minmax(0,1fr))'}}>{options.map(([id,label])=><button key={id} className={`avatar-choice ${selected===id?'selected':''}`} onClick={()=>onSelect(id)} aria-label={label}><span className="avatar-choice-art"><Avatar config={makeConfig(id)} size={82}/></span><span className="avatar-choice-label">{label}</span>{selected===id&&<span className="avatar-choice-check"><Check size={13}/></span>}</button>)}</div></section>;
}

function ColourOptions({config,update}:{config:AvatarConfig;update:(patch:Partial<AvatarConfig>)=>void}){
 const groups:{label:string;key:'skin'|'hair'|'shirt'|'bg';values:string[]}[]=[{label:'Skin tone',key:'skin',values:skinColours},{label:'Hair colour',key:'hair',values:hairColours},{label:'Top colour',key:'shirt',values:shirtColours},{label:'Background',key:'bg',values:backgroundColours}];
 return <div className="colour-choice-list">{groups.map(group=><section key={group.key} className="colour-choice-row"><div><b>{group.label}</b><span>Choose a colour</span></div><div className="colour-choice-swatches">{group.values.map(value=><button key={value} className={`colour-choice-swatch ${config[group.key]===value?'selected':''}`} style={{background:value}} onClick={()=>update({[group.key]:value})} aria-label={`${group.label}: ${value}`}/>)}</div></section>)}</div>;
}
