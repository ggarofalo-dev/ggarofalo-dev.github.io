import * as T from 'three';
import {FilmRenderer} from './rendering.ts';
import {buildWorld} from './world.ts';
import type {World} from './world.ts';
import {SpatialAudio} from './audio.ts';
import {ACTIVATION_DURATION,smooth,cue,QUALITY} from './timeline.ts';
import type {QualityName} from './timeline.ts';
import {clamp,damp,EYE_HEIGHT} from './physics.ts';
import {TERRITORIES,HUB_POSITION,HUB_LOOK,planTour} from './tour.ts';
import type {Territory} from './tour.ts';
import {createStations} from './stations.ts';

type Publication={type:string;title:string;url:string;date:string;description:string};
type Phase='loading'|'welcome'|'travel'|'ready'|'activation'|'hub'|'territory'|'failure';
const element=<E extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as E;
const canvas=element<HTMLCanvasElement>('world'),loading=element('loading'),fade=element('fade'),chapter=element('chapter'),pause=element('pause');
const dock=element('territory-dock'),reader=element('reader'),journeyUI=element('journey-controls'),wake=element<HTMLButtonElement>('interaction');
const camera=new T.PerspectiveCamera(64,innerWidth/innerHeight,.15,650),audio=new SpatialAudio(),settings=matchMedia('(prefers-reduced-motion:reduce)');
let film:FilmRenderer|null=null,world:World|null=null,stations:ReturnType<typeof createStations>|null=null;
let phase:Phase='loading',activationTime=0,awakened=false,reduced=settings.matches,disposed=false,raf=0,last=0,proximity=0,debugVisible=false,debugClock=0;
let selected:Territory|null=null,publications:Publication[]=[],mechanicalPlayed=false,impactPlayed=false;
const events=new AbortController(),signal=events.signal,fromPosition=new T.Vector3(),fromQuaternion=new T.Quaternion(),tempCamera=new T.PerspectiveCamera();
let journey:{curve:T.CatmullRomCurve3;elapsed:number;duration:number;from:T.Quaternion;to:T.Quaternion;arrive:()=>void}|null=null;
const runtime={phase:'loading',paused:false,distance:200,activation:0,position:[0,0,0],quality:'balanced',territory:null as Territory|null,guided:true};
Object.defineProperty(window,'monolithState',{get:()=>Object.freeze({...runtime,position:[...runtime.position]})});
const progress=(v:number,label:string)=>{const n=Math.round(v*100);element('loading-bar').style.width=n+'%';document.querySelector('.loading-track')?.setAttribute('aria-valuenow',String(n));element('loading-message').textContent=label;};
const nextPaint=()=>new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
const message=(text:string)=>{if(chapter.textContent!==text)chapter.textContent=text;};
function fail(error:unknown){phase='failure';cancelAnimationFrame(raf);loading.classList.add('departed');document.body.classList.remove('intro-running','cinematic');element('failure').hidden=false;element('failure-message').textContent=error instanceof Error?error.message:String(error);pause.hidden=true;dock.hidden=true;reader.hidden=true;journeyUI.hidden=true;wake.hidden=true;}
function cameraAt(position:readonly number[],look:readonly number[]){camera.position.fromArray(position);camera.lookAt(new T.Vector3().fromArray(look));camera.updateMatrixWorld();}
function closeReader(){reader.hidden=true;document.querySelector<HTMLButtonElement>(`[data-territory="${selected||'build'}"]`)?.focus({preventScroll:true});}
function setDock(enabled:boolean){dock.hidden=!awakened;document.querySelectorAll<HTMLButtonElement>('#territory-dock button').forEach(button=>{button.disabled=!enabled;button.setAttribute('aria-current',String((button.id==='hub-button'?selected===null:button.dataset.territory===selected)));});}
function beginOpening(){
 if(!world)return;audio.reset();journey=null;selected=null;awakened=false;activationTime=0;mechanicalPlayed=false;impactPlayed=false;proximity=0;phase='welcome';
 pause.hidden=true;element('tools').hidden=true;reader.hidden=true;dock.hidden=true;journeyUI.hidden=true;wake.hidden=true;message('');world.update(0,0,false,reduced);stations?.update(0,null);film!.renderer.shadowMap.needsUpdate=true;
 document.body.classList.remove('cinematic','intro-running');cameraAt([0,EYE_HEIGHT,113],[0,32,-45]);fade.style.opacity='0';element('phase-label').textContent='VERSO IL MONOLITE';approach();
}
function finishJourney(){
 const current=journey;if(!current)return;journey=null;camera.position.copy(current.curve.getPointAt(1));camera.quaternion.copy(current.to);journeyUI.hidden=true;document.body.classList.remove('cinematic','travelling');current.arrive();
}
function travelTo(position:readonly number[],look:readonly number[],label:string,arrive:()=>void){
 if(!world||phase==='travel')return;
 reader.hidden=true;pause.hidden=true;wake.hidden=true;message('');setDock(false);
 const curve=planTour(camera.position.toArray(),position);tempCamera.position.fromArray(position);tempCamera.lookAt(new T.Vector3().fromArray(look));
 journey={curve,elapsed:0,duration:clamp(curve.getLength()/65+1.1,2.2,4),from:camera.quaternion.clone(),to:tempCamera.quaternion.clone(),arrive};
 phase='travel';document.body.classList.add('cinematic','travelling');journeyUI.hidden=false;element('journey-label').textContent=label;element('phase-label').textContent=label;
 if(reduced)finishJourney();
}
function approach(){if(phase!=='welcome')return;travelTo([0,EYE_HEIGHT,-16],[0,35,-45],'VERSO IL MONOLITE',()=>{phase='ready';element('phase-label').textContent='II / IL RISVEGLIO';activate();});}
function hub(){
 if(!awakened||phase==='travel')return;selected=null;
 travelTo(HUB_POSITION,HUB_LOOK,'IL CENTRO / QUATTRO POSSIBILITÀ',()=>{phase='hub';setDock(true);element('tools').hidden=false;element('phase-label').textContent='SCEGLI UN TERRITORIO';message('Quattro direzioni. Il percorso lo scegli tu.');document.querySelector<HTMLButtonElement>('[data-territory="build"]')?.focus({preventScroll:true});});
}
function completeActivation(){
 awakened=true;activationTime=ACTIVATION_DURATION;phase='hub';document.body.classList.remove('cinematic');message('');journeyUI.hidden=true;film!.renderer.shadowMap.needsUpdate=true;hub();
}
function activate(){
 if(phase!=='ready')return;phase='activation';activationTime=0;fromPosition.copy(camera.position);fromQuaternion.copy(camera.quaternion);wake.hidden=true;document.body.classList.add('cinematic');element('phase-label').textContent='III / THE AWAKENING';journeyUI.hidden=false;element('journey-label').textContent='IL RISVEGLIO';
 if(reduced)completeActivation();
}
function visit(id:Territory){
 if(!awakened||phase==='travel'||phase==='activation')return;
 if(selected===id){showContent(id);return;}
 selected=id;const place=TERRITORIES[id];
 travelTo(place.position,place.look,`${place.number} / ${place.title}`,()=>{phase='territory';setDock(true);element('phase-label').textContent=`${place.title} / ${place.subtitle}`;showContent(id);});
}
function paragraph(parent:HTMLElement,text:string,tag='p'){const node=document.createElement(tag);node.textContent=text;parent.append(node);return node;}
function link(parent:HTMLElement,title:string,url:string){const a=document.createElement('a');a.textContent=title+' ↗';a.href=url;a.target='_blank';a.rel='noopener noreferrer';parent.append(a);return a;}
function publicationList(parent:HTMLElement,items:Publication[]){
 for(const item of items){const article=document.createElement('article');paragraph(article,new Intl.DateTimeFormat('it',{dateStyle:'long',timeZone:'UTC'}).format(new Date(item.date)),'small');const h=document.createElement('h3');link(h,item.title,item.url);article.append(h);paragraph(article,item.description);parent.append(article);}
}
function showContent(id:Territory){
 const place=TERRITORIES[id];element('reader-kicker').textContent=`${place.number} / ${place.title}`;element('reader-title').textContent=place.subtitle;
 const body=element('reader-body');body.replaceChildren();
 if(id==='build'){
  paragraph(body,'Opero nel settore IT da oltre trent’anni, tra sviluppo software, automazione e modernizzazione dei sistemi enterprise, in particolare in ambito assicurativo e finanziario.');
  paragraph(body,'Dai sistemi alle organizzazioni','h3');paragraph(body,'Sviluppo software, automazione dei processi, test automation, sistemi legacy, DevOps e ottimizzazione dei processi.');
  paragraph(body,'Il focus attuale','h3');paragraph(body,'Intelligenza artificiale generativa e integrazione efficace, concreta e responsabile nei processi organizzativi. AI Governance e impatto sociale della tecnologia.');
  paragraph(body,'Costruire per capire','h3');publicationList(body,publications.filter(p=>p.title.includes('videogioco')));
 }else if(id==='think'){
  paragraph(body,'La domanda non è soltanto cosa può fare l’AI. È cosa scegliamo di affidarle.');
  paragraph(body,'Uno strumento, non un’autorità','h3');paragraph(body,'La sicurezza con cui viene formulata una risposta non è una prova della sua correttezza. Fonti, contesto e verifica contano.');
  paragraph(body,'Delegare un compito, conservare il giudizio','h3');paragraph(body,'L’automazione aiuta. La delega cognitiva diventa un rischio quando non sappiamo più spiegare o valutare il risultato che utilizziamo.');
  publicationList(body,publications.filter(p=>p.type==='article'&&/produttività|principles|giudicati|fermarsi/i.test(p.title)));
 }else if(id==='speak'){
  paragraph(body,'Articoli, saggi e incontri pubblici su apprendimento, pensiero critico e cultura digitale. Sono membro del Comitato Tecnico Scientifico di ENIA, Fondazione Ente Nazionale per l’Intelligenza Artificiale.');
  paragraph(body,'Registrazioni e divulgazione','h3');paragraph(body,'Le date riportate indicano la pubblicazione dei video, non necessariamente la data dell’intervento.');publicationList(body,publications.filter(p=>p.type!=='article'));
 }else{
  paragraph(body,'Articoli, libri e appunti per leggere il presente. Con il tempo e lo spazio che le domande complesse meritano.');
  paragraph(body,'Crescere con l’AI','h3');paragraph(body,'Una guida per ragazzi, genitori ed educatori: imparare a fare domande, verificare e pensare con la propria testa.');link(body,'Scopri il libro','https://www.amazon.it/dp/B0HGLVB51B');
  paragraph(body,'Il Dio che stiamo creando','h3');paragraph(body,'Algoritmi, simboli e bisogno umano di senso. Una riflessione filosofica e narrativa sullo spazio delle risposte definitive.');link(body,'Scopri il saggio','https://www.amazon.it/dp/B0FQC3V8BT');
  paragraph(body,'Dal taccuino digitale','h3');publicationList(body,publications.filter(p=>p.type==='article'));
 }
 const footer=document.createElement('div');footer.className='reader-person';paragraph(footer,'Gianluca Garofalo / IT professional, autore e divulgatore','small');link(footer,'Continua il confronto','mailto:gianluca.garofalo@gmail.com');body.append(footer);
 reader.hidden=false;reader.scrollTop=0;element('reader-title').focus({preventScroll:true});
}
function skipCurrent(){if(phase==='travel')finishJourney();else if(phase==='activation')completeActivation();}
function setReduced(value:boolean){reduced=value;element('reduce').setAttribute('aria-pressed',String(value));element('reduce').textContent=value?'MOVIMENTO RIDOTTO ON':'MOVIMENTO RIDOTTO';if(value)skipCurrent();}
function help(){
if(phase==='travel'||phase==='activation'){skipCurrent();return;}
 if(phase==='welcome'){approach();return;}
 if(!awakened)return;
 element('reader-kicker').textContent='MONOLITH / NAVIGAZIONE GUIDATA';element('reader-title').textContent='Scegli dove. Al viaggio pensiamo noi.';const body=element('reader-body');body.replaceChildren();paragraph(body,'Scegli BUILD, THINK, SPEAK o WRITE. Ogni trasferimento dura da due a quattro secondi e può essere saltato. La lettura avviene a camera ferma, senza catturare il mouse.');paragraph(body,'1–4: scegli un territorio. 0: torna al centro. Escape: chiudi la lettura o salta il trasferimento. R: ricomincia. F3: prestazioni.');reader.hidden=false;element('reader-title').focus({preventScroll:true});
}
element('enter').addEventListener('click',approach,{signal});wake.addEventListener('click',activate,{signal});
element('skip-journey').addEventListener('click',skipCurrent,{signal});
element('restart').addEventListener('click',beginOpening,{signal});element('help').addEventListener('click',help,{signal});element('reader-close').addEventListener('click',closeReader,{signal});element('hub-button').addEventListener('click',hub,{signal});
element('retry').addEventListener('click',()=>location.reload(),{signal});
document.querySelectorAll<HTMLButtonElement>('[data-territory]').forEach(button=>button.addEventListener('click',()=>visit(button.dataset.territory as Territory),{signal}));
function syncSound(){
 const button=element('sound');button.textContent=audio.enabled?(audio.running?'AUDIO ON':'AUDIO ON · TOCCA PER AVVIARE'):'AUDIO OFF';button.setAttribute('aria-pressed',String(audio.enabled));button.setAttribute('aria-label',audio.enabled?(audio.running?'Disattiva audio':'Avvia audio già abilitato'):'Attiva audio');
}
async function unlockAudio(){try{await audio.start();syncSound();}catch{element('sound').textContent='AUDIO NON DISPONIBILE';}}
function gestureAudio(event:Event){if(event.target instanceof Element&&event.target.closest('#sound'))return;if(audio.enabled&&!audio.running)void unlockAudio();}
document.addEventListener('pointerdown',gestureAudio,{signal});document.addEventListener('keydown',gestureAudio,{signal});
element('sound').addEventListener('click',async()=>{try{if(audio.enabled&&!audio.running)await audio.start();else await audio.toggle();syncSound();}catch{element('sound').textContent='AUDIO NON DISPONIBILE';}},{signal});
element<HTMLSelectElement>('quality').addEventListener('change',e=>film?.setQuality((e.target as HTMLSelectElement).value as QualityName),{signal});
element('reduce').addEventListener('click',()=>setReduced(!reduced),{signal});settings.addEventListener('change',e=>setReduced(e.matches),{signal});
document.addEventListener('keydown',e=>{
 if(e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement||e.metaKey||e.ctrlKey||e.altKey)return;
 if(e.code==='F3'){e.preventDefault();debugVisible=!debugVisible;element('debug').hidden=!debugVisible;}
 if(e.code==='Escape'){if(!reader.hidden)closeReader();else skipCurrent();}
 if(e.code==='KeyE'&&!e.repeat)activate();if(e.code==='KeyR'&&!e.repeat&&world&&phase!=='failure')beginOpening();if(e.code==='KeyH'&&!e.repeat)help();
 const keys=['Digit1','Digit2','Digit3','Digit4'];const index=keys.indexOf(e.code);if(index>=0&&!e.repeat)visit(Object.keys(TERRITORIES)[index] as Territory);if(e.code==='Digit0')hub();
},{signal});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();film?.resize();},{signal});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;void audio.suspend();}else if(!disposed&&phase!=='failure'){last=performance.now();if(!raf)raf=requestAnimationFrame(frame);void audio.resume();}},{signal});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fail(new Error('Contesto WebGL perso. Premi Riprova per riaprire lo spazio.'));},{signal});
function frame(now:number){
 raf=0;if(disposed||phase==='failure'||!film||!world||document.hidden)return;const realDt=Math.max(.001,(now-last)/1000),dt=Math.min(realDt,.05);last=now;
 try{
  if(phase==='travel'&&journey){journey.elapsed+=dt;const t=smooth(clamp(journey.elapsed/journey.duration,0,1));camera.position.copy(journey.curve.getPointAt(t));camera.quaternion.copy(journey.from).slerp(journey.to,t);element('journey-progress').style.transform=`scaleX(${t})`;if(journey.elapsed>=journey.duration)finishJourney();}
  if(phase==='activation'){
   activationTime=Math.min(ACTIVATION_DURATION,activationTime+dt);const align=cue(activationTime,0,2.6),sweep=cue(activationTime,2.6,7.4);const target=new T.Vector3(Math.sin(sweep*Math.PI)*5.5,EYE_HEIGHT,T.MathUtils.lerp(8,4,sweep));camera.position.copy(fromPosition).lerp(target,align);tempCamera.position.copy(camera.position);tempCamera.lookAt(0,T.MathUtils.lerp(34,29,sweep),-45);camera.quaternion.copy(fromQuaternion).slerp(tempCamera.quaternion,align);
   if(activationTime>=3&&!mechanicalPlayed){audio.mechanical();mechanicalPlayed=true;}if(activationTime>=7.2&&!impactPlayed){audio.impact();impactPlayed=true;}
   message(activationTime<3.4?'Il sistema riconosce una presenza.':activationTime<7.8?'Ma una presenza non è una persona.':'');element('journey-progress').style.transform=`scaleX(${activationTime/ACTIVATION_DURATION})`;if(activationTime>=ACTIVATION_DURATION)completeActivation();
  }
  const distance=Math.hypot(camera.position.x,camera.position.z+45);proximity=damp(proximity,clamp((30-distance)/10,0,1),3,dt);
  const timeline=world.update(awakened||phase==='activation'?activationTime:0,proximity,awakened||phase==='activation',reduced);stations?.update(timeline.architecture,selected);
  if(phase==='activation')film.renderer.shadowMap.needsUpdate=true;audio.update(camera,proximity,timeline.core);
  film.render(world.scene,camera,realDt,phase==='activation'||phase==='travel');
  debugClock+=realDt;if(debugVisible&&debugClock>.35){debugClock=0;const s=film.stats;element('debug').textContent=`MONOLITH / GUIDED\nFPS ${s.fps.toFixed(1)}\nDRAW CALLS ${s.calls}\nTRIANGLES ${s.triangles.toLocaleString()}\nQUALITÀ ${QUALITY[s.quality].label}\nDPR ${s.ratio.toFixed(2)}\nPHASE ${phase}\nALTEZZA ${camera.position.y.toFixed(1)}`;}
  Object.assign(runtime,{phase,paused:false,distance,activation:activationTime,position:camera.position.toArray(),quality:film.quality,territory:selected});
 }catch(error){console.error(error);fail(error);return;}raf=requestAnimationFrame(frame);
}
async function boot(){
 syncSound();void unlockAudio();
 try{progress(.05,'WEBGL 2 / PREPARAZIONE');await nextPaint();film=new FilmRenderer(canvas);const response=await fetch(new URL('./content.json',document.baseURI));if(!response.ok)throw Error('Archivio non disponibile');publications=await response.json();await document.fonts.ready;await nextPaint();world=buildWorld(film.renderer,progress);stations=createStations(world);film.attach(world);element<HTMLSelectElement>('quality').value=film.quality;setReduced(reduced);cameraAt([0,EYE_HEIGHT,113],[0,32,-45]);progress(.87,'COMPILAZIONE DELLO SPAZIO');await nextPaint();await film.renderer.compileAsync(world.scene,camera);stations.update(0,null);film.renderer.shadowMap.needsUpdate=true;film.render(world.scene,camera,1/60,true);progress(1,'SPAZIO PRONTO');await nextPaint();loading.classList.add('departed');beginOpening();last=performance.now();raf=requestAnimationFrame(frame);}catch(error){console.error(error);fail(error);}
}
function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(raf);events.abort();audio.dispose();world?.dispose();film?.dispose();}
addEventListener('pagehide',dispose,{once:true});addEventListener('pageshow',e=>{if(e.persisted&&disposed)location.reload();});void boot();
