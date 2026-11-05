import {test} from 'node:test';
import assert from 'node:assert/strict';
import {activationAt,ACTIVATION_DURATION,adaptiveRatio,QUALITY} from '../src/timeline.ts';
test('The monolith has a repeatable thirteen-second central timeline',()=>{
 const start=activationAt(0),end=activationAt(ACTIVATION_DURATION);assert(start.panels.every(x=>x===0));assert.equal(start.core,0);assert.equal(start.title,0);assert(!start.done);assert(end.panels.every(x=>x===1));assert.equal(end.core,1);assert.equal(end.architecture,1);assert.equal(end.atmosphere,1);assert.equal(end.title,1);assert(end.done);
 assert.deepEqual(activationAt(5),activationAt(5));assert.deepEqual(activationAt(0),start);
});
test('Panel release is staggered and title follows the architectural response',()=>{
 const middle=activationAt(4.5);for(let i=1;i<6;i++)assert(middle.panels[i]<=middle.panels[i-1]);assert.equal(middle.title,0);assert(activationAt(9).architecture>0);assert(activationAt(9).core>.9);assert(activationAt(9).title>0);
});
test('All sequence channels stay bounded and structural channels are monotonic',()=>{
 let previous=activationAt(-2);for(let time=-1.9;time<16;time+=.1){const a=activationAt(time);for(const key of ['align','release','core','architecture','atmosphere','title']){assert(a[key]>=0&&a[key]<=1);assert(a[key]+1e-9>=previous[key]);}for(let i=0;i<6;i++)assert(a.panels[i]+1e-9>=previous.panels[i]);assert(a.impact>=0&&a.impact<=1);previous=a;}
});
test('Adaptive DPR reduces cost under load without leaving preset limits',()=>{
 for(const preset of ['low','balanced','high']){assert(adaptiveRatio(.8,32,preset)<.8);assert(adaptiveRatio(.65,32,preset)>=.65);assert(adaptiveRatio(QUALITY[preset].dpr,10,preset)<=QUALITY[preset].dpr);assert.equal(adaptiveRatio(.8,20,preset),.8);}
});
