'use client';

import { useMemo, useState } from 'react';
import { Check, Sparkles } from 'lucide-react';
import { Avatar } from './Avatar';
import type { AvatarConfig } from '@/lib/types';

type Tab = 'hair' | 'face' | 'pose' | 'accessories' | 'colours';

const tabs: { id: Tab; label: string }[] = [
  { id: 'hair', label: 'Hair' },
  { id: 'face', label: 'Face' },
  { id: 'pose', label: 'Pose' },
  { id: 'accessories', label: 'Extras' },
  { id: 'colours', label: 'Colours' },
];

const hairOptions: { id: NonNullable<AvatarConfig['hairStyle']>; label: string }[] = [
  { id: 'short', label: 'Short' },
  { id: 'sidePart', label: 'Side part' },
  { id: 'bob', label: 'Bob' },
  { id: 'long', label: 'Long' },
  { id: 'curls', label: 'Curls' },
  { id: 'afro', label: 'Afro' },
];
const faceOptions: { id: NonNullable<AvatarConfig['faceShape']>; label: string }[] = [
  { id: 'round', label: 'Round' },
  { id: 'oval', label: 'Oval' },
  { id: 'softSquare', label: 'Soft square' },
  { id: 'heart', label: 'Heart' },
  { id: 'long', label: 'Long' },
  { id: 'wide', label: 'Wide' },
];
const poseOptions: { id: NonNullable<AvatarConfig['pose']>; label: string }[] = [
  { id: 'front', label: 'Straight on' },
  { id: 'left', label: 'Turned left' },
  { id: 'right', label: 'Turned right' },
  { id: 'relaxed', label: 'Relaxed' },
  { id: 'handsIn', label: 'Hands in' },
  { id: 'raised', label: 'Hands up' },
];
const accessoryOptions: { id: NonNullable<AvatarConfig['accessory']>; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'glasses', label: 'Glasses' },
  { id: 'hairClip', label: 'Hair clip' },
  { id: 'earrings', label: 'Earrings' },
];

const skinColours = ['#F0B98A', '#D99A70', '#8C5A3B', '#6E493A', '#E7C19F', '#B8734E'];
const hairColours = ['#2A1C17', '#16120F', '#6B3E27', '#A96C3B', '#D9C7B4', '#8C8C96'];
const shirtColours = ['#1B78FF', '#35A66B', '#B35DE6', '#F05A6D', '#F39A3D', '#7D6AF2'];
const backgroundColours = ['#E8F4FF', '#F0F7FF', '#F4F0FF', '#FFF1F4', '#FFF5E8', '#EEF8F1'];

export function AvatarCreator({ config, setConfig, close }: { config: AvatarConfig; setConfig: (c: AvatarConfig) => void; close: () => void }) {
  const [tab, setTab] = useState<Tab>('hair');
  const [saved, setSaved] = useState(false);
  const current = useMemo(() => config, [config]);
  const update = (patch: Partial<AvatarConfig>) => {
    setConfig({ ...config, ...patch });
    setSaved(false);
  };
  const optionConfig = (patch: Partial<AvatarConfig>): AvatarConfig => ({ ...current, ...patch });

  return <div className="avatar-creator">
    <div className="avatar-creator-head">
      <div>
        <div className="eyebrow">Your character</div>
        <h2>Make it yours</h2>
        <p>Pick the features that feel most like you. You can change them whenever you want.</p>
      </div>
      <div className="avatar-creator-spark"><Sparkles size={18} /></div>
    </div>

    <div className="avatar-creator-stage">
      <div className="avatar-creator-preview"><Avatar config={current} size={190} /></div>
      <div className="avatar-creator-preview-copy"><b>Looking good.</b><span>Your character appears like this across Bluo.</span></div>
    </div>

    <div className="avatar-tabs" role="tablist" aria-label="Character options">
      {tabs.map(item => <button key={item.id} className={`avatar-tab ${tab === item.id ? 'active' : ''}`} onClick={() => setTab(item.id)} role="tab" aria-selected={tab === item.id}>{item.label}</button>)}
    </div>

    <div className="avatar-option-panel">
      {tab === 'hair' && <VisualOptions title="Choose a hairstyle" options={hairOptions} selected={current.hairStyle} makeConfig={id => optionConfig({ hairStyle: id })} onSelect={id => update({ hairStyle: id })} />}
      {tab === 'face' && <VisualOptions title="Choose a face shape" options={faceOptions} selected={current.faceShape} makeConfig={id => optionConfig({ faceShape: id })} onSelect={id => update({ faceShape: id })} />}
      {tab === 'pose' && <VisualOptions title="Choose a pose" options={poseOptions} selected={current.pose} makeConfig={id => optionConfig({ pose: id })} onSelect={id => update({ pose: id })} />}
      {tab === 'accessories' && <VisualOptions title="Add an extra" options={accessoryOptions} selected={current.accessory} makeConfig={id => optionConfig({ accessory: id })} onSelect={id => update({ accessory: id })} columns={4} />}
      {tab === 'colours' && <ColourOptions config={current} update={update} />}
    </div>

    <div className="avatar-creator-actions">
      <button className="secondary" onClick={close}>Done</button>
      <button className="primary" onClick={() => { setSaved(true); close(); }}><Check size={16} /> {saved ? 'Saved' : 'Save character'}</button>
    </div>
  </div>;
}

function VisualOptions<T extends string>({ title, options, selected, makeConfig, onSelect, columns = 3 }: { title: string; options: { id: T; label: string }[]; selected?: T; makeConfig: (id: T) => AvatarConfig; onSelect: (id: T) => void; columns?: number }) {
  return <section className="avatar-choice-section"><div className="avatar-choice-title">{title}</div><div className="avatar-choice-grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>{options.map(option => <button key={option.id} className={`avatar-choice ${selected === option.id ? 'selected' : ''}`} onClick={() => onSelect(option.id)} aria-label={option.label}><span className="avatar-choice-art"><Avatar config={makeConfig(option.id)} size={82} /></span><span className="avatar-choice-label">{option.label}</span>{selected === option.id && <span className="avatar-choice-check"><Check size={13} /></span>}</button>)}</div></section>;
}

function ColourOptions({ config, update }: { config: AvatarConfig; update: (patch: Partial<AvatarConfig>) => void }) {
  const groups: { label: string; key: 'skin' | 'hair' | 'shirt' | 'bg'; values: string[] }[] = [
    { label: 'Skin tone', key: 'skin', values: skinColours },
    { label: 'Hair colour', key: 'hair', values: hairColours },
    { label: 'Top colour', key: 'shirt', values: shirtColours },
    { label: 'Background', key: 'bg', values: backgroundColours },
  ];
  return <div className="colour-choice-list">{groups.map(group => <section key={group.key} className="colour-choice-row"><div><b>{group.label}</b><span>Choose a colour</span></div><div className="colour-choice-swatches">{group.values.map(value => <button key={value} className={`colour-choice-swatch ${config[group.key] === value ? 'selected' : ''}`} style={{ background: value }} onClick={() => update({ [group.key]: value })} aria-label={`${group.label}: ${value}`} />)}</div></section>)}</div>;
}
