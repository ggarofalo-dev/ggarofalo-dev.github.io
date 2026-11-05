import * as T from 'three';
import {makeMaterials,beveledBox} from './materials.js';
import {activationAt} from './timeline.js';
                                           
import {EYE_HEIGHT} from './physics.js';

export function buildWorld(renderer                ,progress                                  ,options                           ={}){
 const scene=new T.Scene();scene.background=new T.Color(0x141d22);scene.fog=new T.FogExp2(0x172329,.0053);
 const materials=makeMaterials(renderer);progress(.28,'CALCESTRUZZO / PIETRA / METALLO');
 const obstacles           =[],dynamicObstacles           =[];
 const geoCache=new Map                         ();
 const geo=(w       ,h       ,d       ,b=.14)=>{const key=`${w}/${h}/${d}/${b}`;if(!geoCache.has(key))geoCache.set(key,beveledBox(w,h,d,b));return geoCache.get(key) ;};
 const mesh=(w       ,h       ,d       ,mat           ,x       ,y       ,z       ,b=.14,parent           =scene)=>{const m=new T.Mesh(geo(w,h,d,b),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
 const obstacle=(name       ,x       ,z       ,w       ,d       )=>obstacles.push({name,minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});
 const instances=(geometry                 ,material           ,positions                    ,cast=true)=>{
  const batch=new T.InstancedMesh(geometry,material,positions.length),dummy=new T.Object3D();
  positions.forEach((p,i)=>{dummy.position.set(p[0],p[1],p[2]);dummy.rotation.set(0,p[3]||0,0);dummy.updateMatrix();batch.setMatrixAt(i,dummy.matrix);});
  batch.castShadow=cast;batch.receiveShadow=true;batch.computeBoundingSphere();scene.add(batch);return batch;
 };
 // A physically legible floor: side paving, inset polished nave, expansion joints.
 const ground=new T.Mesh(new T.PlaneGeometry(240,400),materials.concrete);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
 const floor=new T.Mesh(new T.PlaneGeometry(35,388),materials.floor);floor.rotation.x=-Math.PI/2;floor.position.set(0,.035,0);floor.receiveShadow=true;scene.add(floor);
 const pavers           =[];for(const side of [-1,1])for(let x=29;x<113;x+=21)for(let z=-184;z<200;z+=24)pavers.push([side*x,-.29,z]);
 instances(geo(20.85,.55,23.85,.065),materials.stone,pavers,false);
 const pathStrips           =[],channels           =[];
 for(const side of [-1,1])for(let z=-180;z<=180;z+=12){pathStrips.push([side*18.1,.085,z]);channels.push([side*18.1,.045,z]);}
 instances(geo(.7,.1,8.8,.02),materials.recess,channels,false);
 const pathLights=instances(geo(.13,.035,8.1,.005),materials.light,pathStrips,false);
 const joints           =[];for(let z=-190;z<200;z+=12)joints.push([0,.043,z]);
 instances(geo(34.8,.015,.045,.002),materials.recess,joints,false);
 // Four rows of engineered piers, articulated bases, ribs and capitals.
 const pillarPositions           =[],bases           =[],capitals           =[],ribs           =[],lintels           =[];
 const zRows=[-166,-118,-70,-22,26,74,122,170];
 for(const x of [-101,-63,63,101])for(const z of zRows){
  pillarPositions.push([x,49,z]);bases.push([x,1.35,z]);capitals.push([x,96,z]);obstacle('pier',x,z,17,15);
  for(const offset of [-5.9,5.9])ribs.push([x+offset,48,z+5.25],[x+offset,48,z-5.25]);
 }
 instances(geo(12.5,94,11,.2),materials.concrete,pillarPositions);
 instances(geo(17,2.7,15,.23),materials.stone,bases);
 instances(geo(17,4,15,.25),materials.concrete,capitals);
 instances(geo(.45,87,.85,.07),materials.metal,ribs);
 for(const z of zRows)lintels.push([0,97,z]);
 instances(geo(239,5,8,.22),materials.concrete,lintels);
 // Solid side walls and roof wings surround genuine apertures, not a skybox facade.
 mesh(5,100,400,materials.concrete,-120,50,0);mesh(5,100,400,materials.concrete,120,50,0);
 mesh(97,5,400,materials.recess,-72,102,0);mesh(97,5,400,materials.recess,72,102,0);
 mesh(96,100,7,materials.concrete,-73,50,-200);mesh(96,100,7,materials.concrete,73,50,-200);
 mesh(50,12,7,materials.concrete,0,94,-200);
 mesh(108,100,7,materials.concrete,-69,50,200);mesh(108,100,7,materials.concrete,69,50,200);
 mesh(30,46,8,materials.concrete,0,77,200);
 const revealWall=new T.MeshBasicMaterial({color:new T.Color(.75,.89,.9)});
 mesh(38,88,1,revealWall,0,44,-212,.02);
 const bays           =[],ledges           =[];
 for(const side of [-1,1])for(const z of zRows){bays.push([side*117.2,29,z+23]);ledges.push([side*115,61,z+23]);}
 instances(geo(.8,48,25,.1),materials.recess,bays);
 instances(geo(5,2,34,.15),materials.stone,ledges);
 const baffles          =[];
 for(const side of [-1,1])for(const z of [-142,-46,50,146]){
  const group=new T.Group();group.position.set(side*43,67,z);scene.add(group);
  mesh(23,2,29,materials.metal,0,0,0,.2,group);
  for(let i=0;i<4;i++)mesh(21,.3,1,materials.concrete,0,-1.2,-10+i*7,.06,group);
  baffles.push(group);
 }
 // Black plinth / six mechanically independent articulated front panels.
 mesh(45,.65,35,materials.stone,0,.35,-45,.17);mesh(41,1,31,materials.stone,0,1.1,-45,.18);
 obstacle('monolith plinth',0,-45,45,35);
 const monolith=new T.Group();monolith.position.set(0,1.7,-45);scene.add(monolith);
 mesh(25,76,2,materials.recess,0,38,-5,.16,monolith);
 for(const side of [-1,1]){mesh(1.4,76,10,materials.metal,side*12.3,38,0,.2,monolith);mesh(.16,72,.5,materials.seam,side*11.3,38,5.15,.02,monolith);}
 mesh(24,1.2,12,materials.metal,0,75.5,0,.15,monolith);
 const panels                                                           =[];
 for(let row=0;row<3;row++)for(const side of [-1,1]){
  const panel=new T.Group();panel.position.set(side*6.13,12.5+row*24.9,6);monolith.add(panel);
  mesh(11.9,24.35,2.2,materials.stone,0,0,0,.16,panel);
  mesh(10.9,22.4,.35,materials.metal,0,0,1.25,.09,panel);
  mesh(9.8,21.2,.22,materials.stone,0,0,1.48,.07,panel);
  for(const offset of [-4.65,4.65])mesh(.08,19,.12,materials.recess,offset,0,1.64,.012,panel);
  mesh(.12,22.6,.16,materials.seam,-side*5.62,0,1.5,.02,panel);
  const boltGeo=new T.CylinderGeometry(.13,.13,.12,6);boltGeo.rotateX(Math.PI/2);
  const bolts=new T.InstancedMesh(boltGeo,materials.metal,4),dummy=new T.Object3D();
  [[-5,10],[5,10],[-5,-10],[5,-10]].forEach(([x,y],i)=>{dummy.position.set(x,y,1.51);dummy.updateMatrix();bolts.setMatrixAt(i,dummy.matrix);});panel.add(bolts);
  panels.push({object:panel,side,row,origin:panel.position.clone()});
 }
 const coreGroup=new T.Group();coreGroup.position.set(0,37,0);monolith.add(coreGroup);
 const crystal=new T.Mesh(new T.CylinderGeometry(3.7,2.6,58,6,1),materials.core);crystal.scale.z=.7;coreGroup.add(crystal);
 const heartMaterial=new T.MeshStandardMaterial({color:0xe5e9d3,emissive:0xe8f4c9,emissiveIntensity:.1,roughness:.15});
 const heart=new T.Mesh(new T.CylinderGeometry(.45,.45,57,6),heartMaterial);coreGroup.add(heart);
 for(const side of [-1,1])mesh(.8,62,3,materials.metal,side*4.8,37,-.5,.12,monolith);
 for(let y=8;y<74;y+=9){mesh(10,.4,1.3,materials.metal,0,y,2.6,.06,monolith);}
 const coreLight=new T.PointLight(0xd9edb6,0,110,2);coreLight.position.set(0,30,-34);scene.add(coreLight);
 const corona=new T.SpotLight(0xdfebc3,0,150,.9,.8,1.6);corona.position.set(0,48,-31);corona.target.position.set(0,0,8);scene.add(corona,corona.target);
 const textCanvas=document.createElement('canvas');textCanvas.width=2048;textCanvas.height=256;
 const ctx=textCanvas.getContext('2d') ;ctx.clearRect(0,0,2048,256);ctx.fillStyle='#eff0db';ctx.font='400 118px Exhibit, Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('THE HUMAN VARIABLE',1024,128);
 const titleTexture=new T.CanvasTexture(textCanvas);titleTexture.colorSpace=T.SRGBColorSpace;
 const titleMaterial=new T.MeshBasicMaterial({map:titleTexture,transparent:true,opacity:0,depthWrite:false,toneMapped:false});
 const title=new T.Mesh(new T.PlaneGeometry(40,5),titleMaterial);title.position.set(0,47.5,-29);scene.add(title);
 const titleBacking=new T.Mesh(new T.PlaneGeometry(43,7),new T.MeshBasicMaterial({color:0x0a1011,transparent:true,opacity:0}));titleBacking.position.copy(title.position).add(new T.Vector3(0,0,-.15));scene.add(titleBacking);
 progress(.57,'ARCHITETTURA / DIAFRAMMI / NUCLEO');
 // One shadow-casting sun. Additional illumination is deliberately unshadowed.
 const sun=new T.DirectionalLight(0xd9e5e4,4.2);sun.position.set(-90,135,50);sun.target.position.set(0,0,-60);scene.add(sun,sun.target);sun.castShadow=true;
 sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-115,right:115,top:115,bottom:-115,near:10,far:330});sun.shadow.bias=-.00025;sun.shadow.normalBias=.1;sun.shadow.radius=3;
 const hemi=new T.HemisphereLight(0xb9d4e1,0x18201b,.52);scene.add(hemi);
 const fill=new T.DirectionalLight(0x8aadb6,.7);fill.position.set(90,45,150);scene.add(fill);
 const backlight=new T.SpotLight(0xe2e4d5,60000,350,.37,.6,2);backlight.position.set(0,100,-165);backlight.target.position.set(0,20,-45);scene.add(backlight,backlight.target);
 // Low-cost contact occlusion decals, anchored to the physical supports.
 const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;const sc=shadowCanvas.getContext('2d') ;
 const grad=sc.createRadialGradient(64,64,13,64,64,64);grad.addColorStop(0,'rgba(0,0,0,.7)');grad.addColorStop(.5,'rgba(0,0,0,.3)');grad.addColorStop(1,'rgba(0,0,0,0)');sc.fillStyle=grad;sc.fillRect(0,0,128,128);
 const contactTexture=new T.CanvasTexture(shadowCanvas),contactMaterial=new T.MeshBasicMaterial({map:contactTexture,transparent:true,depthWrite:false,opacity:.8});
 const contacts=new T.InstancedMesh(new T.PlaneGeometry(27,27),contactMaterial,bases.length+1),dummy=new T.Object3D();dummy.rotation.x=-Math.PI/2;
 [...bases,[0,0,-45]].forEach((p,i)=>{dummy.position.set(p[0],.055,p[2]);dummy.scale.set(i===bases.length?2:1,i===bases.length?1.8:1,1);dummy.updateMatrix();contacts.setMatrixAt(i,dummy.matrix);});contacts.computeBoundingSphere();scene.add(contacts);
 // Sparse light shafts are a scattering approximation, not particles or ray marching.
 const shaftMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,uniforms:{uColor:{value:new T.Color(0x8da4a7)},uStrength:{value:.055}},vertexShader:'varying vec2 vUv;varying vec3 vWorld;void main(){vUv=uv;vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 uColor;uniform float uStrength;varying vec2 vUv;varying vec3 vWorld;void main(){float edge=pow(max(0.,sin(vUv.x*3.14159)),3.);float height=sin(vUv.y*3.14159);float grain=.85+.15*sin(vWorld.y*.8+vWorld.x*.4);float alpha=edge*height*grain*uStrength;gl_FragColor=vec4(uColor,alpha);}' });
 const shafts         =[];
 for(let i=0;i<6;i++){
  const shaft=new T.Mesh(new T.PlaneGeometry(15,167),shaftMaterial);
  const openingZ=-142+i*48;
  shaft.position.set(16,51,openingZ-41.5);
  shaft.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(-68,103,83).normalize());
  shaft.renderOrder=3;scene.add(shaft);shafts.push(shaft);
 }
 // A small procedural studio sky is convolved for coherent PBR environment reflections.
 const envScene=new T.Scene();envScene.background=new T.Color(.035,.05,.065);
 const envGeometry=new T.BoxGeometry(1,1,1),envMaterials             =[];
 for(const [x,y,z,sx,sy,sz,intensity] of [[-20,25,0,8,30,35,4],[15,15,-20,3,20,30,1.2],[0,30,0,40,1,40,1.5]]){
  const material=new T.MeshBasicMaterial({color:new T.Color(intensity,intensity*1.04,intensity*1.02)});envMaterials.push(material);const panel=new T.Mesh(envGeometry,material);panel.position.set(x,y,z);panel.scale.set(sx,sy,sz);envScene.add(panel);
 }
 let environment                         =null;
 if(options.bakeEnvironment!==false){const pmrem=new T.PMREMGenerator(renderer);pmrem.compileCubemapShader();environment=pmrem.fromScene(envScene,.08,.1,200);scene.environment=environment.texture;pmrem.dispose();}
 scene.environmentIntensity=.65;envGeometry.dispose();envMaterials.forEach(m=>m.dispose());
 const staticFog=new T.Color(0x172329),awakenedFog=new T.Color(0x343b32),coolShaft=new T.Color(0x8da4a7),warmShaft=new T.Color(0xd1d0a8);
 const boxes=panels.map(()=>new T.Box3());
 function update(time       ,proximity       ,activated        ,reduced        ){
  const a=activationAt(time),energy=activated?a.core:0;
  materials.core.emissiveIntensity=.12+proximity*.75+energy*3.2;
  heartMaterial.emissiveIntensity=.1+proximity*.4+energy*6;
  materials.seam.emissiveIntensity=.04+proximity*.55+energy*2;
  materials.light.emissiveIntensity=.18+proximity*.5+a.architecture*2.4;
  coreLight.intensity=energy*1500+proximity*55;corona.intensity=energy*8500;
  for(let i=0;i<panels.length;i++){
   const panel=panels[i],open=activated?a.panels[i]:0;
   panel.object.position.copy(panel.origin);panel.object.position.x+=panel.side*open*(13+panel.row*1.8);panel.object.position.z+=open*5;panel.object.position.y+=open*(panel.row-1)*2;
   panel.object.rotation.y=panel.side*open*.3;
  }
  // The surrounding eight overhead diaphragms are part of the same timeline.
  baffles.forEach((b,i)=>{const opening=activated?Math.max(0,a.architecture-i*.015):0;b.rotation.z=(i<4?1:-1)*opening*.3;b.position.y=67+opening*5;});
  const fog=scene.fog             ;fog.color.copy(staticFog).lerp(awakenedFog,a.atmosphere);fog.density=.0053-a.atmosphere*.0015;
  (scene.background           ).copy(fog.color).multiplyScalar(.65);
  shaftMaterial.uniforms.uColor.value.copy(coolShaft).lerp(warmShaft,a.atmosphere);shaftMaterial.uniforms.uStrength.value=.055+a.architecture*.04;
  sun.intensity=4.2+a.architecture*.9;hemi.intensity=.52+a.atmosphere*.15;
  titleMaterial.opacity=a.title;(titleBacking.material                       ).opacity=a.title*.86;
  title.position.y=47.5+(reduced?0:(1-a.title)*1.2);titleBacking.position.y=title.position.y;
  dynamicObstacles.length=0;monolith.updateMatrixWorld(true);
  panels.forEach((p,i)=>{boxes[i].setFromObject(p.object);const box=boxes[i];if(box.min.y<EYE_HEIGHT+.3)dynamicObstacles.push({name:'open panel',minX:box.min.x-.1,maxX:box.max.x+.1,minZ:box.min.z-.1,maxZ:box.max.z+.1});});
  return a;
 }
 function dispose(){
  const geometries=new Set                  (),mats=new Set            (),textures=new Set           ();
  scene.traverse(object=>{if(object instanceof T.Mesh){geometries.add(object.geometry);const list=Array.isArray(object.material)?object.material:[object.material];list.forEach(mat=>{mats.add(mat);for(const value of Object.values(mat))if(value instanceof T.Texture)textures.add(value);});}});
  geometries.forEach(g=>g.dispose());mats.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());environment?.dispose();
 }
 progress(.76,'LUMIÈRE / ATMOSFERA / RIFLESSI');
 return {scene,floor,sun,shafts,monolith,obstacles,dynamicObstacles,update,dispose,materials};
}
                                                
