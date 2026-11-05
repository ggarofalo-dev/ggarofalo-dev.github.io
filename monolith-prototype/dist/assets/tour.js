import * as T from 'three';
import {EYE_HEIGHT} from './physics.js';
export const TERRITORIES={
 build:{number:'01',title:'BUILD',subtitle:'Dare forma alla complessità.',position:[-33,EYE_HEIGHT,50],look:[-46,17,13],station:[-46,0,13],yaw:.27},
 think:{number:'02',title:'THINK',subtitle:'Interrompere l’automatismo.',position:[33,EYE_HEIGHT,50],look:[46,17,13],station:[46,0,13],yaw:-.27},
 speak:{number:'03',title:'SPEAK',subtitle:'Il pensiero diventa confronto.',position:[-33,EYE_HEIGHT,-77],look:[-46,17,-103],station:[-46,0,-103],yaw:.27},
 write:{number:'04',title:'WRITE',subtitle:'Restituire tempo al pensiero.',position:[33,EYE_HEIGHT,-77],look:[46,17,-103],station:[46,0,-103],yaw:-.27}
}         ;
                                               
export const HUB_POSITION=[0,EYE_HEIGHT,58]         ;
export const HUB_LOOK=[0,35,-45]         ;
// Crossing the hall happens in front of the plinth. Rear travel uses the clear side aisles.
export function planTour(from                  ,to                  ){
 const a=new T.Vector3(from[0],EYE_HEIGHT,from[2]),b=new T.Vector3(to[0],EYE_HEIGHT,to[2]);
 const points=[a],sourceRear=a.z < -26,targetRear=b.z < -26;
 const sourceSide=Math.sign(a.x)||1,targetSide=Math.sign(b.x)||1;
 if(sourceRear&&(!targetRear||sourceSide!==targetSide))points.push(new T.Vector3(sourceSide*33,EYE_HEIGHT,14));
 if(targetRear&&(!sourceRear||sourceSide!==targetSide))points.push(new T.Vector3(targetSide*33,EYE_HEIGHT,14));
 points.push(b);
 const unique=points.filter((point,i)=>i===0||point.distanceTo(points[i-1])>.01);
 if(unique.length===1)unique.push(unique[0].clone());
 return new T.CatmullRomCurve3(unique,false,'catmullrom',.08);
}
