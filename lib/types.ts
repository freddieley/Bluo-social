export type DataMode='full'|'low'|'ultra';
export type AvatarConfig={
  skin:string;
  hair:string;
  shirt:string;
  bg:string;
  eyes:string;
  mouth:string;
  hairStyle?:'short'|'sidePart'|'bob'|'long'|'curls'|'afro'|'pixie'|'braids'|'bun'|'wavy';
  faceShape?:'round'|'oval'|'softSquare'|'heart'|'long'|'wide'|'diamond'|'square';
  pose?:'front'|'left'|'right'|'relaxed'|'handsIn'|'raised'|'wave'|'peace';
  accessory?:'none'|'glasses'|'hairClip'|'earrings'|'headphones'|'cap';
  clothingStyle?:'tee'|'hoodie'|'crew'|'polo'|'jacket'|'striped';
  eyeStyle?:'round'|'soft'|'bright'|'wide'|'sleepy'|'wink';
  mouthStyle?:'smile'|'smallSmile'|'open'|'neutral'|'laugh'|'smirk';
};
export type Person={id:string;name:string;year:number;distance:string;status:string;free:boolean;avatar:AvatarConfig;location:[number,number];updated:string};
export type Lesson={day:number;start:string;end:string;name:string;room?:string;free?:boolean};
