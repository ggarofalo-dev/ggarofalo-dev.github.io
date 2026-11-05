import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
registerHooks({resolve(specifier,context,next){return specifier==='three'?{url:new URL('../public/vendor/three.module.js',import.meta.url).href,shortCircuit:true}:next(specifier,context);}});
const {TERRITORIES,HUB_POSITION,planTour}=await import('../src/tour.ts');
const {EYE_HEIGHT}=await import('../src/physics.ts');
test('All guided routes preserve ten-unit eye height, endpoints and architectural clearance',()=>{
 const poses=[HUB_POSITION,...Object.values(TERRITORIES).map(t=>t.position)];
 const boxes=[{x:0,z:-45,w:60,d:38}];
 for(const x of [-101,-63,63,101])for(const z of [-166,-118,-70,-22,26,74,122,170])boxes.push({x,z,w:17,d:15});
 for(const station of Object.values(TERRITORIES))boxes.push({x:station.station[0],z:station.station[2],w:22,d:11});
 assert.equal(EYE_HEIGHT,10);
 for(const from of poses)for(const to of poses){
  const curve=planTour(from,to);assert(curve.getPointAt(0).distanceTo({x:from[0],y:from[1],z:from[2]})<1e-6);assert(curve.getPointAt(1).distanceTo({x:to[0],y:to[1],z:to[2]})<1e-6);
  for(let i=0;i<=240;i++){
   const point=curve.getPointAt(i/240);assert(Math.abs(point.y-10)<1e-6);
   for(const box of boxes){const x=Math.max(box.x-box.w/2,Math.min(box.x+box.w/2,point.x)),z=Math.max(box.z-box.d/2,Math.min(box.z+box.d/2,point.z));assert(Math.hypot(point.x-x,point.z-z)>.8,`Route ${from} -> ${to} clips architecture at ${point.x},${point.z}`);}
  }
 }
});
test('Approach and post-awakening retreat stay in the free central corridor',()=>{
 for(const [from,to] of [[[0,10,113],[0,10,-16]],[[0,10,4],HUB_POSITION]]){
  const curve=planTour(from,to);for(let i=0;i<=100;i++){const p=curve.getPointAt(i/100);assert(Math.abs(p.x)<1e-6);assert(p.z>=-16.001);assert(p.y===10);}
 }
});
