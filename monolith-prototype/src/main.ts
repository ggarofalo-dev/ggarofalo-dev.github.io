import * as T from 'three';
import {FilmRenderer} from './rendering.ts';
import {buildWorld} from './world.ts';
import type {World} from './world.ts';
import {Explorer} from './controller.ts';
import {SpatialAudio} from './audio.ts';
import {INTRO_DURATION,ACTIVATION_DURATION,smooth,cue,QUALITY} from './timeline.ts';
import type {QualityName} from './timeline.ts';
import {clamp,damp,EYE_HEIGHT} from './physics.ts';

const element=<E extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as E;
const canvas=element<HTMLCanvasElement>('world'),pause=element('pause'),fade=element('fade'),loading=element('loading'),chapter=element('chapter');
const enter=element<HTMLButtonElement>('enter'),hint=element('interaction'),tools=element('tools');
const settings=matchMedia('(prefers-reduced-motion:reduce)'),touchMode=matchMedia('(pointer:coarse)').matches;
let film:FilmRenderer|null=null,world:World|null=null,player:Explorer|null=null;
const audio=new SpatialAudio(),camera=new T.PerspectiveCamera(64,innerWidth/innerHeight,.15,650);
let phase:'loading'|'intro'|'explore'|'activation'|'awake'|'failure'='loading';
let introTime=0,activationTime=0,paused=false,reduced=settings.matches,disposed=false,raf=0,last=0,proximity=0,debugVisible=false,debugClock=0;
let mechanicalPlayed=false,impactPlayed=false,helpClock=0,started=false;
const fromPosition=new T.Vector3(),fromQuaternion=new T.Quaternion(),tempCamera=new T.PerspectiveCamera(),targetPosition=new T.Vector3(),lookTarget=new T.Vector3();
const events=new AbortController(),signal=events.signal;
const progress=(value:number,label:string)=>{const percent=Math.round(value*100);element('loading-bar').style.width=`${percent}%`;document.querySelector('.loading-track')?.setAttribute('aria-valuenow',String(percent));element('loading-message').textContent=label;};
const nextPaint=()=>new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
const setChapter=(text:string)=>{if(chapter.textContent!==text)chapter.textContent=text;};
function fail(error:unknown){
 phase='failure';cancelAnimationFrame(raf);document.exitPointerLock?.();loading.classList.add('departed');element('failure').hidden=false;element('failure-message').textContent=error instanceof Error?error.message:String(error);pause.hidden=true;tools.hidden=true;
}
function setPaused(value:boolean){
 paused=value;pause.hidden=!value;
 if(player){player.enabled=!value&&(phase==='explore'||phase==='awake');if(value)player.clear();}
 element('crosshair').hidden=value||phase==='intro'||phase==='activation';
 if(value){enter.textContent=started?'RIPRENDI L’ESPLORAZIONE ↗':'ENTRA NELLO SPAZIO ↗';enter.focus({preventScroll:true});void audio.suspend();}else{canvas.focus({preventScroll:true});void audio.resume();}
 element('touch-controls').hidden=!touchMode||value||phase==='intro'||phase==='activation';
}
function finishIntro(){
 if(!player)return;introTime=INTRO_DURATION;
 camera.position.set(0,EYE_HEIGHT,113);camera.lookAt(0,32,-45);camera.fov=64;camera.updateProjectionMatrix();player.sync();
 phase='explore';fade.style.opacity='0';document.body.classList.remove('cinematic','intro-running');element('skip-intro').hidden=true;
 setChapter('');element('phase-label').textContent='I / THE HALL';setPaused(true);
}
function beginIntro(){
 if(!world||!player)return;
 audio.reset();
 phase='intro';introTime=0;activationTime=0;proximity=0;paused=false;mechanicalPlayed=false;impactPlayed=false;
 player.enabled=false;player.clear();document.exitPointerLock?.();pause.hidden=true;hint.hidden=true;element('crosshair').hidden=true;element('touch-controls').hidden=true;
 document.body.classList.add('cinematic','intro-running');element('skip-intro').hidden=false;setChapter('');world.update(0,0,false,reduced);film!.renderer.shadowMap.needsUpdate=true;
 if(reduced)finishIntro();
}
function startActivation(){
 if(!world||!player||!['explore','awake'].includes(phase)||paused||activationTime>=ACTIVATION_DURATION)return;
 const distance=Math.hypot(camera.position.x,camera.position.z+45);if(distance>30||camera.position.z < -26)return;
 phase='activation';activationTime=0;player.enabled=false;player.clear();fromPosition.copy(camera.position);fromQuaternion.copy(camera.quaternion);
 hint.hidden=true;element('crosshair').hidden=true;element('touch-controls').hidden=true;document.body.classList.add('cinematic');element('phase-label').textContent='II / THE AWAKENING';
 if(reduced){activationTime=ACTIVATION_DURATION;completeActivation();}
}
function completeActivation(){
 phase='awake';activationTime=ACTIVATION_DURATION;document.body.classList.remove('cinematic');element('phase-label').textContent='III / THE HUMAN VARIABLE';setChapter('La scelta resta umana.');helpClock=0;
 player!.sync();player!.enabled=!paused;
 element('crosshair').hidden=paused;element('touch-controls').hidden=!touchMode||paused;
 film!.renderer.shadowMap.needsUpdate=true;
}
async function requestControl(){
 if(phase==='loading'||phase==='failure')return;
 if(touchMode){started=true;setPaused(false);element('first-help').hidden=true;return;}
 try{
  await canvas.requestPointerLock();
  // The change event owns the control transfer. No lock is requested outside a gesture.
 }catch(error){element('pause-description').textContent='Il browser non ha concesso il puntatore. Premi di nuovo Entra; usa Escape per uscire dalla cattura.';setPaused(true);console.warn('Pointer lock unavailable',error);}
}
document.addEventListener('pointerlockchange',()=>{
 if(['intro','loading','failure'].includes(phase))return;
 if(document.pointerLockElement===canvas){started=true;setPaused(false);if(phase==='activation')player!.enabled=false;else{element('first-help').hidden=player!.travel>5;helpClock=0;}}
 else setPaused(true);
},{signal});
document.addEventListener('pointerlockerror',()=>{if(phase!=='intro')setPaused(true);},{signal});
enter.addEventListener('click',()=>void requestControl(),{signal});
canvas.addEventListener('click',()=>{if(!touchMode&&paused)void requestControl();},{signal});
element('skip-intro').addEventListener('click',finishIntro,{signal});
element('restart').addEventListener('click',beginIntro,{signal});
element('help').addEventListener('click',()=>{if(phase==='intro'){finishIntro();return;}document.exitPointerLock?.();setPaused(true);},{signal});
element('retry').addEventListener('click',()=>location.reload(),{signal});
element('sound').addEventListener('click',async()=>{try{const enabled=await audio.toggle();element('sound').textContent=enabled?'AUDIO ON':'AUDIO OFF';element('sound').setAttribute('aria-pressed',String(enabled));element('sound').setAttribute('aria-label',enabled?'Disattiva audio':'Attiva audio procedurale');}catch(error){element('sound').textContent='AUDIO NON DISPONIBILE';console.warn(error);}},{signal});
element<HTMLSelectElement>('quality').addEventListener('change',e=>{film?.setQuality((e.target as HTMLSelectElement).value as QualityName);},{signal});
function setReduced(value:boolean){reduced=value;player&&(player.reduced=value);element('reduce').setAttribute('aria-pressed',String(value));element('reduce').textContent=value?'MOVIMENTO RIDOTTO ON':'MOVIMENTO RIDOTTO';if(value&&phase==='intro')finishIntro();if(value&&phase==='activation'){activationTime=13;completeActivation();}}
element('reduce').addEventListener('click',()=>setReduced(!reduced),{signal});
settings.addEventListener('change',e=>setReduced(e.matches),{signal});
document.addEventListener('keydown',e=>{
 if(e.target instanceof HTMLSelectElement||e.target instanceof HTMLInputElement)return;
 if(e.code==='F3'){e.preventDefault();debugVisible=!debugVisible;element('debug').hidden=!debugVisible;}
 if(e.code==='KeyR'&&!e.repeat&&phase!=='loading'&&phase!=='failure')beginIntro();
 if(e.code==='KeyE'&&!e.repeat)startActivation();
 if(e.code==='Escape'&&phase==='intro')finishIntro();
 if(e.code==='KeyH'&&phase==='intro'){finishIntro();return;}
 if(e.code==='KeyH'&&!e.repeat){e.preventDefault();if(!paused){document.exitPointerLock?.();setPaused(true);}else void requestControl();}
},{signal});
element('touch-interact').addEventListener('click',startActivation,{signal});
const joystick=element('joystick');let joystickPointer:number|null=null;
joystick.addEventListener('pointerdown',e=>{joystickPointer=e.pointerId;joystick.setPointerCapture(e.pointerId);},{signal});
joystick.addEventListener('pointermove',e=>{if(e.pointerId!==joystickPointer||!player)return;const bounds=joystick.getBoundingClientRect();const x=clamp((e.clientX-bounds.left-bounds.width/2)/36,-1,1),y=clamp((e.clientY-bounds.top-bounds.height/2)/36,-1,1);player.touch.set(x,y);(joystick.firstElementChild as HTMLElement).style.transform=`translate(${x*28}px,${y*28}px)`;},{signal});
const resetJoystick=()=>{joystickPointer=null;player?.touch.set(0,0);(joystick.firstElementChild as HTMLElement).style.transform='';};
joystick.addEventListener('pointerup',resetJoystick,{signal});joystick.addEventListener('pointercancel',resetJoystick,{signal});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();film?.resize();},{signal});
document.addEventListener('visibilitychange',()=>{
 if(document.hidden){cancelAnimationFrame(raf);raf=0;void audio.suspend();player?.clear();}
 else if(!disposed&&phase!=='failure'){last=performance.now();if(!raf)raf=requestAnimationFrame(frame);if(!paused)void audio.resume();}
},{signal});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fail(new Error('Il contesto WebGL è stato perso. Le risorse grafiche non sono più disponibili: premi Riprova per riavviare il prototipo.'));},{signal});
function frame(now:number){
 raf=0;if(disposed||phase==='failure'||!film||!world||!player||document.hidden)return;
 const realDt=Math.max(.001,(now-last)/1000),dt=Math.min(realDt,.04);last=now;
 try{
  if(phase==='intro'){
   introTime+=dt;const t=introTime/INTRO_DURATION,s=smooth(t);
   camera.position.set(T.MathUtils.lerp(-12,0,s),T.MathUtils.lerp(7.5,EYE_HEIGHT,s),T.MathUtils.lerp(158,113,s));
   camera.lookAt(T.MathUtils.lerp(4,0,s),T.MathUtils.lerp(40,32,s),-45);fade.style.opacity=String(1-cue(introTime,.1,2.3));
   setChapter(introTime>3.2&&introTime<7.5?'Non tutto ciò che conta può essere previsto.':'');
   if(introTime>=INTRO_DURATION)finishIntro();
  }
  if(phase==='activation'&&!paused){
   activationTime=Math.min(13,activationTime+dt);const align=cue(activationTime,0,2.6),sweep=cue(activationTime,2.6,7.4),settle=cue(activationTime,10,3);
   targetPosition.set(Math.sin(sweep*Math.PI)*5.5,T.MathUtils.lerp(5.5,EYE_HEIGHT,settle),T.MathUtils.lerp(8,4,sweep));
   camera.position.copy(fromPosition).lerp(targetPosition,align);lookTarget.set(0,T.MathUtils.lerp(34,29,sweep),-45);tempCamera.position.copy(camera.position);tempCamera.lookAt(lookTarget);camera.quaternion.copy(fromQuaternion).slerp(tempCamera.quaternion,align);
   if(activationTime>=3&&!mechanicalPlayed){audio.mechanical();mechanicalPlayed=true;}
   if(activationTime>=7.2&&!impactPlayed){audio.impact();impactPlayed=true;}
   setChapter(activationTime<3.4?'Il sistema riconosce una presenza.':activationTime<7.8?'Ma una presenza non è una persona.':'');
   if(activationTime>=ACTIVATION_DURATION)completeActivation();
  }
  if((phase==='explore'||phase==='awake')&&!paused){
   player.update(dt,[...world.obstacles,...world.dynamicObstacles]);helpClock+=dt;
   if(player.travel>5||helpClock>9)element('first-help').hidden=true;
   if(phase==='awake'&&helpClock>5)setChapter('');
  }
  const distance=Math.hypot(camera.position.x,camera.position.z+45),near=clamp((30-distance)/10,0,1);
  proximity=damp(proximity,near,3,dt);
  const activated=phase==='activation'||phase==='awake';const timeline=world.update(activated?activationTime:0,proximity,activated,reduced);
  if(phase==='activation')film.renderer.shadowMap.needsUpdate=true;
  hint.hidden=paused||phase!=='explore'||distance>30||camera.position.z < -26;
  if(!reduced&&phase==='explore'&&proximity>0&&!paused){camera.position.y+=Math.sin(now*.028)*.006*proximity;}
  audio.update(camera,proximity,timeline.core);
  element('position-label').textContent=`HALL / ${Math.round(distance)} M DAL MONOLITE`;
  film.render(world.scene,camera,realDt,phase==='intro'||phase==='activation');
  debugClock+=realDt;if(debugVisible&&debugClock>.35){debugClock=0;const stats=film.stats;element('debug').textContent=`MONOLITH / WEBGL 2\nFPS ${stats.fps.toFixed(1)} (media)\nDRAW CALLS ${stats.calls}\nTRIANGLES ${stats.triangles.toLocaleString()}\nQUALITÀ ${QUALITY[stats.quality].label}\nDPR ${stats.ratio.toFixed(2)} / ADATTIVO\nPHASE ${phase.toUpperCase()}\nGPU GEOMETRIE ${stats.memory.geometries}\nTEXTURES ${stats.memory.textures}`;}
  // Explicit read-only state for deterministic browser QA; no tracking or persistence.
  Object.assign(runtime,{phase,paused,distance,activation:activationTime,position:[camera.position.x,camera.position.y,camera.position.z],quality:film.quality});
 }catch(error){console.error(error);fail(error);return;}
 raf=requestAnimationFrame(frame);
}
const runtime={phase:'loading',paused:false,distance:200,activation:0,position:[0,0,0],quality:'balanced'};
Object.defineProperty(window,'monolithState',{get:()=>Object.freeze({...runtime,position:[...runtime.position]})});
async function boot(){
 try{
  progress(.05,'WEBGL 2 / PREPARAZIONE');await nextPaint();film=new FilmRenderer(canvas);
  progress(.12,'MATERIA / SCALA');await document.fonts.ready;await nextPaint();
  world=buildWorld(film.renderer,progress);film.attach(world);player=new Explorer(camera,canvas);player.reduced=reduced;setReduced(reduced);
  element<HTMLSelectElement>('quality').value=film.quality;
  camera.position.set(-12,7.5,158);camera.lookAt(0,40,-45);world.update(0,0,false,reduced);
  progress(.87,'COMPILAZIONE DEI MATERIALI');await nextPaint();
  await film.renderer.compileAsync(world.scene,camera);film.renderer.shadowMap.needsUpdate=true;film.render(world.scene,camera,1/60,true);
  progress(1,'SPAZIO PRONTO');await nextPaint();loading.classList.add('departed');beginIntro();last=performance.now();raf=requestAnimationFrame(frame);
 }catch(error){console.error(error);fail(error);}
}
function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(raf);events.abort();document.exitPointerLock?.();player?.dispose();audio.dispose();world?.dispose();film?.dispose();}
addEventListener('pagehide',dispose,{once:true});
addEventListener('pageshow',e=>{if(e.persisted&&disposed)location.reload();});
void boot();
