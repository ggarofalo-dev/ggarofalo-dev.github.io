import type {PerspectiveCamera} from 'three';
import {Vector3} from 'three';
export class SpatialAudio{
 enabled=false;
 private context:AudioContext|null=null;
 private master:GainNode|null=null;
 private spatial:PannerNode|null=null;
 private drone:GainNode|null=null;
 private nodes:AudioScheduledSourceNode[]=[];
 private effects=new Set<AudioScheduledSourceNode>();
 private direction=new Vector3();
 async toggle(){
  if(!this.context)this.create();
  this.enabled=!this.enabled;
  if(this.enabled)await this.context!.resume();
  this.master!.gain.setTargetAtTime(this.enabled ? .22 : 0,this.context!.currentTime,.15);
  return this.enabled;
 }
 private create(){
  const context=this.context=new AudioContext();this.master=context.createGain();this.master.gain.value=0;this.master.connect(context.destination);
  this.spatial=context.createPanner();this.spatial.panningModel='HRTF';this.spatial.distanceModel='inverse';this.spatial.refDistance=20;this.spatial.maxDistance=350;this.spatial.rolloffFactor=.6;this.spatial.positionX.value=0;this.spatial.positionY.value=20;this.spatial.positionZ.value=-45;this.spatial.connect(this.master);
  this.drone=context.createGain();this.drone.gain.value=.18;this.drone.connect(this.spatial);
  for(const [frequency,volume] of [[36.7,.6],[55,.16],[110,.035]]){const oscillator=context.createOscillator(),gain=context.createGain();oscillator.type='sine';oscillator.frequency.value=frequency;gain.gain.value=volume;oscillator.connect(gain);gain.connect(this.drone);oscillator.start();this.nodes.push(oscillator);}
 }
 update(camera:PerspectiveCamera,proximity:number,energy:number){
  if(!this.context||!this.enabled)return;
  const listener=this.context.listener,time=this.context.currentTime;camera.getWorldDirection(this.direction);
  listener.positionX.value=camera.position.x;listener.positionY.value=camera.position.y;listener.positionZ.value=camera.position.z;
  listener.forwardX.value=this.direction.x;listener.forwardY.value=this.direction.y;listener.forwardZ.value=this.direction.z;listener.upX.value=0;listener.upY.value=1;listener.upZ.value=0;
  this.drone!.gain.setTargetAtTime(.14+proximity*.4+energy*.26,time,.2);
 }
 mechanical(){
  if(!this.context||!this.enabled)return;
  const c=this.context,time=c.currentTime,buffer=c.createBuffer(1,c.sampleRate*5,c.sampleRate),data=buffer.getChannelData(0);
  let seed=1873,previous=0;for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;previous=(previous+(seed/4294967295*2-1)*.03)/1.03;data[i]=previous*3;}
  const source=c.createBufferSource();source.buffer=buffer;const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=280;const gain=c.createGain();gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(.32,time+.8);gain.gain.exponentialRampToValueAtTime(.001,time+5);source.connect(filter);filter.connect(gain);gain.connect(this.spatial!);source.start();this.effects.add(source);source.onended=()=>{this.effects.delete(source);source.disconnect();filter.disconnect();gain.disconnect();};
 }
 impact(){
  if(!this.context||!this.enabled)return;
  const c=this.context,time=c.currentTime,osc=c.createOscillator(),gain=c.createGain();osc.type='sine';osc.frequency.setValueAtTime(78,time);osc.frequency.exponentialRampToValueAtTime(28,time+2.3);gain.gain.setValueAtTime(.001,time);gain.gain.linearRampToValueAtTime(.48,time+.04);gain.gain.exponentialRampToValueAtTime(.001,time+3);osc.connect(gain);gain.connect(this.spatial!);osc.start();osc.stop(time+3.1);this.effects.add(osc);osc.onended=()=>{this.effects.delete(osc);osc.disconnect();gain.disconnect();};
 }
 async suspend(){if(this.context?.state==='running')await this.context.suspend();}
 async resume(){if(this.enabled&&this.context?.state==='suspended')await this.context.resume();}
 reset(){this.effects.forEach(source=>{try{source.stop();}catch{}});this.effects.clear();}
 dispose(){this.reset();this.nodes.forEach(n=>{n.stop();n.disconnect();});void this.context?.close();this.nodes=[];this.context=null;}
}
