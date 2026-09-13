export type DataMode='full'|'low'|'ultra';
export type AvatarConfig={skin:string;hair:string;shirt:string;bg:string;eyes:string;mouth:string};
export type Person={id:string;name:string;year:number;distance:string;status:string;free:boolean;avatar:AvatarConfig;location:[number,number];updated:string};
export type Lesson={day:number;start:string;end:string;name:string;room?:string;free?:boolean};