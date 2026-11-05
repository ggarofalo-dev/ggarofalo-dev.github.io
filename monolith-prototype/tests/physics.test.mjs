import {test} from 'node:test';
import assert from 'node:assert/strict';
import {resolveMovement,PLAYER_RADIUS,HALL_LIMITS,damp} from '../src/physics.ts';
const pillar={name:'pier',minX:-7,maxX:7,minZ:-7,maxZ:7};
test('Fast travel cannot tunnel through a massive pillar',()=>{
 const p=resolveMovement({x:0,z:50},0,-100,[pillar]);assert(p.z>=7+PLAYER_RADIUS-.0001);assert(Math.abs(p.x)<.001);
});
test('Movement slides along a wall instead of crossing it',()=>{
 const wall={name:'wall',minX:5,maxX:10,minZ:-100,maxZ:100};let p={x:0,z:0};
 for(let i=0;i<40;i++)p=resolveMovement(p,.5,.8,[wall]);assert(p.x<=5-PLAYER_RADIUS+.001);assert(p.z>25);
});
test('Diagonal motion cannot pass through a pier corner',()=>{
 let p={x:20,z:20};for(let i=0;i<100;i++)p=resolveMovement(p,-.8,-.8,[pillar]);assert(p.x>=7||p.z>=7);const nearX=Math.min(7,Math.max(-7,p.x)),nearZ=Math.min(7,Math.max(-7,p.z));assert(Math.hypot(p.x-nearX,p.z-nearZ)>=PLAYER_RADIUS-.001);
});
test('All outer boundaries retain the full player radius',()=>{
 for(const [dx,dz]of [[1000,0],[-1000,0],[0,1000],[0,-1000]]){const p=resolveMovement({x:0,z:0},dx,dz,[]);assert(p.x>=HALL_LIMITS.minX+PLAYER_RADIUS&&p.x<=HALL_LIMITS.maxX-PLAYER_RADIUS);assert(p.z>=HALL_LIMITS.minZ+PLAYER_RADIUS&&p.z<=HALL_LIMITS.maxZ-PLAYER_RADIUS);}
});
test('An overlapping initial point is expelled from architecture',()=>{const p=resolveMovement({x:0,z:0},0,0,[pillar]);assert(p.x<=-7-PLAYER_RADIUS||p.x>=7+PLAYER_RADIUS||p.z<=-7-PLAYER_RADIUS||p.z>=7+PLAYER_RADIUS);});
test('Damping is frame-rate independent over equal elapsed time',()=>{let a=0,b=0;for(let i=0;i<60;i++)a=damp(a,9,8,1/60);for(let i=0;i<30;i++)b=damp(b,9,8,1/30);assert(Math.abs(a-b)<1e-10);});
