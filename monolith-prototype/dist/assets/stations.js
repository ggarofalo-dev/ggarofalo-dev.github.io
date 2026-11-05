import * as T from 'three';
import {beveledBox} from './materials.js';
import {TERRITORIES} from './tour.js';
                                         
                                      
export function createStations(world      ){
 const stations=Object.entries(TERRITORIES).map(([id,data])=>{
  const group=new T.Group();group.position.fromArray(data.station);group.rotation.y=data.yaw;world.scene.add(group);
  const add=(w       ,h       ,d       ,x       ,y       ,z       ,material           )=>{const mesh=new T.Mesh(beveledBox(w,h,d,.09),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;};
  add(20,.6,8,0,.3,0,world.materials.stone);
  add(18,23,2,0,11.8,0,world.materials.recess);
  for(const side of [-1,1])add(.7,24,3,side*9.3,12,0,world.materials.metal);
  add(19.2,.6,3,0,24,0,world.materials.stone);
  const glow=new T.MeshStandardMaterial({color:0x9ba894,emissive:0xd5e8b5,emissiveIntensity:0,roughness:.25,metalness:.3});
  add(.11,21,.15,-8.6,12,1.12,glow);
  const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=768;const ctx=canvas.getContext('2d') ;
  ctx.fillStyle='#bfcbb6';ctx.font='400 38px Exhibit, Arial';ctx.fillText(data.number+' / GIANLUCA GAROFALO',100,115);
  ctx.fillStyle='#edf0e2';ctx.font='500 225px Exhibit, Arial';ctx.fillText(data.title,85,410);
  ctx.fillStyle='#acb7b0';ctx.font='400 43px Exhibit, Arial';ctx.fillText(data.subtitle,100,540);
  ctx.strokeStyle='#a9be8f';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(100,620);ctx.lineTo(1420,620);ctx.stroke();
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
  const lettering=new T.MeshBasicMaterial({map,transparent:true,opacity:0,depthWrite:false});
  const plaque=new T.Mesh(new T.PlaneGeometry(17,8.5),lettering);plaque.position.set(0,15,1.16);group.add(plaque);
  const light=new T.PointLight(0xd5e8b5,0,34,2);light.position.set(0,10,4);group.add(light);
  return {id:id             ,group,glow,lettering,light};
 });
 return {update(energy       ,selected               ){for(const station of stations){station.group.visible=energy>.001;station.lettering.opacity=energy;station.glow.emissiveIntensity=energy*(selected===station.id?2.4:.55);station.light.intensity=energy*(selected===station.id?110:25);}}};
}
