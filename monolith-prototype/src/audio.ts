import type {PerspectiveCamera} from 'three';
import {Vector3} from 'three';
export class SpatialAudio{
 enabled=true;
 private context:AudioContext|null=null;
 private master:GainNode|null=null;
 private spatial:PannerNode|null=null;
 private drone:GainNode|null=null;
 private limiter:DynamicsCompressorNode|null=null;
 private nodes:AudioScheduledSourceNode[]=[];
 private effects=new Set<AudioScheduledSourceNode>();
 private direction=new Vector3();
 get running(){return this.context?.state==='running';}
 async start(){
  if(!this.enabled)return false;
  if(!this.context)this.create();
  this.master!.gain.setTargetAtTime(.72,this.context!.currentTime,.2);
  await this.context!.resume();return this.running;
 }
 async toggle(){
  this.enabled=!this.enabled;
  if(this.enabled)await this.start();
  else if(this.context)this.master!.gain.setTargetAtTime(0,this.context.currentTime,.12);
  return this.enabled;
 }
 private create(){
  const context=this.context=new AudioContext();this.master=context.createGain();this.master.gain.value=0;
  this.limiter=context.createDynamicsCompressor();this.limiter.threshold.value=-10;this.limiter.knee.value=8;this.limiter.ratio.value=12;this.limiter.attack.value=.003;this.limiter.release.value=.22;this.master.connect(this.limiter);this.limiter.connect(context.destination);
  this.spatial=context.createPanner();this.spatial.panningModel='HRTF';this.spatial.distanceModel='inverse';this.spatial.refDistance=50;this.spatial.maxDistance=350;this.spatial.rolloffFactor=.28;this.spatial.positionX.value=0;this.spatial.positionY.value=20;this.spatial.positionZ.value=-45;this.spatial.connect(this.master);
  this.drone=context.createGain();this.drone.gain.value=.28;this.drone.connect(this.spatial);
  for(const [frequency,volume] of [[36.7,.45],[73.4,.28],[110,.24],[146.8,.12],[220,.06]]){const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type='sine';oscillator.frequency.value=frequency;gain.gain.value=volume;oscillator.connect(gain);gain.connect(this.drone);oscillator.start();this.nodes.push(oscillator);}
 }
 update(camera:PerspectiveCamera,proximity:number,energy:number){
  if(!this.context||!this.enabled||!this.running)return;
  const listener=this.context.listener,time=this.context.currentTime;camera.getWorldDirection(this.direction);
  listener.positionX.value=camera.position.x;listener.positionY.value=camera.position.y;listener.positionZ.value=camera.position.z;
  listener.forwardX.value=this.direction.x;listener.forwardY.value=this.direction.y;listener.forwardZ.value=this.direction.z;listener.upX.value=0;listener.upY.value=1;listener.upZ.value=0;
  this.drone!.gain.setTargetAtTime(.28+proximity*.25+energy*.22,time,.2);
 }
 mechanical(){
  if(!this.context||!this.enabled||!this.running)return;
  const c=this.context,time=c.currentTime,buffer=c.createBuffer(1,c.sampleRate*5,c.sampleRate),data=buffer.getChannelData(0);
  let seed=1873,previous=0;for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;previous=(previous+(seed/4294967295*2-1)*.03)/1.03;data[i]=previous*3;}
  const source=c.createBufferSource();source.buffer=buffer;const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=850;const gain=c.createGain();gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(.75,time+.55);gain.gain.exponentialRampToValueAtTime(.001,time+5);source.connect(filter);filter.connect(gain);gain.connect(this.spatial!);source.start();this.effects.add(source);source.onended=()=>{this.effects.delete(source);source.disconnect();filter.disconnect();gain.disconnect();};
 }
 impact(){
  if(!this.context||!this.enabled||!this.running)return;
  const c=this.context,time=c.currentTime,osc=c.createOscillator(),gain=c.createGain();osc.type='triangle';osc.frequency.setValueAtTime(130,time);osc.frequency.exponentialRampToValueAtTime(38,time+2.3);gain.gain.setValueAtTime(.001,time);gain.gain.linearRampToValueAtTime(.78,time+.04);gain.gain.exponentialRampToValueAtTime(.001,time+3);osc.connect(gain);gain.connect(this.spatial!);osc.start();osc.stop(time+3.1);this.effects.add(osc);osc.onended=()=>{this.effects.delete(osc);osc.disconnect();gain.disconnect();};
 }
 async suspend(){if(this.context?.state==='running')await this.context.suspend();}
 async resume(){if(this.enabled&&this.context?.state==='suspended')await this.context.resume();}
 reset(){this.effects.forEach(source=>{try{source.stop();}catch{}});this.effects.clear();}
 dispose(){this.reset();this.nodes.forEach(n=>{n.stop();n.disconnect();});this.master?.disconnect();this.limiter?.disconnect();void this.context?.close();this.nodes=[];this.context=null;}
}
