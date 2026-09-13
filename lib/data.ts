import type { AvatarConfig, Lesson, Person } from './types';
export const avatarDefaults:AvatarConfig={skin:'#F0B98A',hair:'#2A1C17',shirt:'#1B78FF',bg:'#E8F4FF',eyes:'#26344A',mouth:'#A95B55'};
const av=(skin:string,hair:string,shirt:string,bg:string):AvatarConfig=>({...avatarDefaults,skin,hair,shirt,bg});
export const demoPeople:Person[]=[
{id:'james',name:'James',year:2028,distance:'120m',status:'Free · Near the canteen',free:true,avatar:av('#D99A70','#211713','#2C79F2','#E8F4FF'),location:[51.0666,-1.3277],updated:'2 min ago'},
{id:'alex',name:'Alex',year:2028,distance:'320m',status:'Free · Library',free:true,avatar:av('#8C5A3B','#16120F','#35A66B','#EEF8F1'),location:[51.0669,-1.3290],updated:'4 min ago'},
{id:'ella',name:'Ella',year:2028,distance:'1.2km',status:'In lesson · English',free:false,avatar:av('#E5B187','#4C3025','#B35DE6','#F6EDFF'),location:[51.0677,-1.3308],updated:'8 min ago'},
{id:'tom',name:'Tom',year:2028,distance:'480m',status:'Free · Main quad',free:true,avatar:av('#9B6448','#33241D','#F39A3D','#FFF4E6'),location:[51.0661,-1.3264],updated:'1 min ago'},
{id:'maya',name:'Maya',year:2028,distance:'1.5km',status:'In lesson · Maths',free:false,avatar:av('#6E493A','#17120F','#F05A6D','#FFF0F3'),location:[51.0648,-1.3302],updated:'7 min ago'},
{id:'leo',name:'Leo',year:2028,distance:'900m',status:'Free · Sports hall',free:true,avatar:av('#C98D68','#39221B','#7D6AF2','#F0EEFF'),location:[51.0656,-1.3249],updated:'5 min ago'},
];
export const demoLessons:Lesson[]=[
{day:1,start:'09:00',end:'10:00',name:'Maths',room:'Room M1'},{day:1,start:'10:00',end:'11:00',name:'Free',free:true},{day:1,start:'11:00',end:'12:00',name:'Physics',room:'Room P2'},{day:1,start:'12:00',end:'13:00',name:'Free',free:true},{day:1,start:'13:00',end:'14:00',name:'Lunch',room:'Canteen'},{day:1,start:'14:00',end:'15:00',name:'Further Maths',room:'Room M3'},{day:1,start:'15:00',end:'16:00',name:'Free',free:true},{day:1,start:'16:00',end:'17:00',name:'Biology',room:'Room B1'}
];