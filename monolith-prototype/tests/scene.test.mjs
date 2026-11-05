// Real Three.js scene-graph checks. This does NOT create a WebGL context or render images.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
const vendor=new URL('../public/vendor/three.module.js',import.meta.url).href;
registerHooks({resolve(specifier,context,next){return specifier==='three'?{url:vendor,shortCircuit:true}:next(specifier,context);}});
const T=await import('three');
const {beveledBox}=await import('../src/materials.ts');
const {buildWorld}=await import('../src/world.ts');
test('Beveled architecture has the requested physical bounds and more than twelve faces',()=>{
 const geometry=beveledBox(24,75,12,.2);geometry.computeBoundingBox();const dimensions=geometry.boundingBox.getSize(new T.Vector3());
 assert(Math.abs(dimensions.x-24)<.001);assert(Math.abs(dimensions.y-75)<.001);assert(Math.abs(dimensions.z-12)<.001);assert(geometry.attributes.position.count/3>12);assert(geometry.attributes.normal.count>100);geometry.dispose();
});
test('The actual hall contains instanced architecture, PBR detail, collisions and synchronized 3D changes',()=>{
 const originalDocument=globalThis.document;
 // Only the canvas API surface used to create in-world labels and contact decals.
 // Drawing is intentionally not rasterized here; no visual QA is claimed.
 globalThis.document={createElement(name){assert.equal(name,'canvas');return {width:0,height:0,getContext(){return {createRadialGradient(){return {addColorStop(){}};},clearRect(){},fillRect(){},fillText(){},fillStyle:'',font:'',textAlign:'',textBaseline:''};}};}};
 let world;
 try{
  world=buildWorld({capabilities:{getMaxAnisotropy:()=>4}},()=>{},{bakeEnvironment:false});
  assert.equal(T.REVISION,'180');assert.equal(world.obstacles.length,33);assert(world.materials.floor.isMeshPhysicalMaterial);assert(world.materials.concrete.normalMap.isDataTexture);assert(world.materials.stone.roughnessMap.isDataTexture);
  const batches=[],panels=[],baffles=[];
  world.scene.traverse(object=>{if(object.isInstancedMesh)batches.push(object);if(object.isGroup&&object.parent===world.monolith&&object.children.length>4)panels.push(object);if(object.isGroup&&object.position.y===67)baffles.push(object);});
  assert(batches.length>=10);assert.equal(panels.length,6);assert.equal(baffles.length,8);
  const before=panels.map(p=>p.position.clone());world.update(0,0,false,false);const fogBefore=world.scene.fog.color.clone();const densityBefore=world.scene.fog.density;
  const end=world.update(13,1,true,false);assert(end.done);
  panels.forEach((p,i)=>{assert(p.position.distanceTo(before[i])>10);assert(Math.abs(p.rotation.y)>.25);});
  assert(baffles.every(b=>Math.abs(b.rotation.z)>.2));assert(!world.scene.fog.color.equals(fogBefore));assert(world.scene.fog.density<densityBefore);assert(world.materials.core.emissiveIntensity>3);assert(world.materials.light.emissiveIntensity>2);
  let title=null;world.scene.traverse(object=>{if(object.isMesh&&object.material?.map?.isCanvasTexture&&object.geometry.parameters?.width===40)title=object;});assert(title);assert.equal(title.material.opacity,1);
  // A reset must restore real geometry as well as light and atmosphere.
  world.update(0,0,false,false);panels.forEach((p,i)=>assert(p.position.distanceTo(before[i])<1e-6));assert(baffles.every(b=>b.rotation.z===0));assert(world.scene.fog.color.equals(fogBefore));assert.equal(title.material.opacity,0);
 }finally{world?.dispose();if(originalDocument===undefined)delete globalThis.document;else globalThis.document=originalDocument;}
});
