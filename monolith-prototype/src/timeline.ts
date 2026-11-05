import {clamp} from './physics.ts';
export const INTRO_DURATION=10;
export const ACTIVATION_DURATION=13;
export const smooth=(t:number)=>{const x=clamp(t,0,1);return x*x*(3-2*x);};
export const cue=(time:number,start:number,duration:number)=>smooth((time-start)/duration);
export function activationAt(time:number){
 return {
  align:cue(time,0,2.3),
  release:cue(time,1.8,2),
  panels:Array.from({length:6},(_,i)=>cue(time,3+i*.22,3.6)),
  core:cue(time,4.5,3.2),
  architecture:cue(time,5.3,4.5),
  atmosphere:cue(time,5,5.7),
  title:cue(time,8.1,2.3),
  impact:Math.sin(Math.PI*clamp((time-7.2)/1.6,0,1)),
  done:time>=ACTIVATION_DURATION
 };
}
export type QualityName='low'|'balanced'|'high';
export const QUALITY={
 low:{label:'Essenziale',dpr:.85,shadow:1024,reflection:0,bloom:false,shafts:2},
 balanced:{label:'Cinematica',dpr:1.25,shadow:2048,reflection:512,bloom:true,shafts:4},
 high:{label:'Ultra',dpr:1.65,shadow:2048,reflection:1024,bloom:true,shafts:6}
} as const;
export function adaptiveRatio(current:number,averageMs:number,preset:QualityName){
 const max=QUALITY[preset].dpr;
 if(averageMs>24)return Math.max(.65,current-.1);
 if(averageMs<16)return Math.min(max,current+.05);
 return current;
}
