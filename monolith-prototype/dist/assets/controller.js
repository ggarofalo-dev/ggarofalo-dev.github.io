import * as T from 'three';
import {damp,clamp,resolveMovement,EYE_HEIGHT} from './physics.js';
                                           
export class Explorer{
          keys=new Set        ();
          velocity=new T.Vector2();
          position=new T.Vector3(0,EYE_HEIGHT,113);
          touch=new T.Vector2();
 yaw=0;pitch=0;targetYaw=0;targetPitch=0;enabled=false;reduced=false;travel=0;
         bobPhase=0;
         euler=new T.Euler(0,0,0,'YXZ');
         listeners=new AbortController();
         lookPointer            =null;
         lastX=0;        lastY=0;
          camera                    ;
          canvas                  ;
 constructor(camera                    ,canvas                  ){
  this.camera=camera;this.canvas=canvas;
  const signal=this.listeners.signal;
  document.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement)return;if(['KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight'].includes(e.code)){this.keys.add(e.code);if(this.enabled)e.preventDefault();}},{signal});
  document.addEventListener('keyup',e=>this.keys.delete(e.code),{signal});
  document.addEventListener('mousemove',e=>{if(document.pointerLockElement===canvas&&this.enabled){this.targetYaw-=e.movementX*.0017;this.targetPitch=clamp(this.targetPitch-e.movementY*.0017,-1.2,1.3);}},{signal});
  window.addEventListener('blur',()=>this.clear(),{signal});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)this.clear();},{signal});
  canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&this.enabled&&e.clientX>innerWidth*.38){this.lookPointer=e.pointerId;this.lastX=e.clientX;this.lastY=e.clientY;canvas.setPointerCapture(e.pointerId);}},{signal});
  canvas.addEventListener('pointermove',e=>{if(e.pointerId===this.lookPointer&&this.enabled){this.targetYaw-=(e.clientX-this.lastX)*.003;this.targetPitch=clamp(this.targetPitch-(e.clientY-this.lastY)*.003,-1.2,1.3);this.lastX=e.clientX;this.lastY=e.clientY;}},{signal});
  canvas.addEventListener('pointerup',e=>{if(this.lookPointer===e.pointerId)this.lookPointer=null;},{signal});
  canvas.addEventListener('pointercancel',()=>{this.lookPointer=null;},{signal});
 }
 clear(){this.keys.clear();this.velocity.set(0,0);this.touch.set(0,0);this.lookPointer=null;}
 sync(){this.euler.setFromQuaternion(this.camera.quaternion,'YXZ');this.yaw=this.targetYaw=this.euler.y;this.pitch=this.targetPitch=this.euler.x;this.position.copy(this.camera.position);this.position.y=EYE_HEIGHT;this.clear();}
 update(dt       ,obstacles                    ){
  if(!this.enabled)return;
  const acceleration=this.reduced?18:8;
  this.yaw=damp(this.yaw,this.targetYaw,this.reduced?30:18,dt);this.pitch=damp(this.pitch,this.targetPitch,this.reduced?30:18,dt);
  const forward=(this.keys.has('KeyW')?1:0)-(this.keys.has('KeyS')?1:0)-this.touch.y;
  const sideways=(this.keys.has('KeyD')?1:0)-(this.keys.has('KeyA')?1:0)+this.touch.x;
  const length=Math.max(1,Math.hypot(forward,sideways)),speed=this.keys.has('ShiftLeft')||this.keys.has('ShiftRight')?18:9;
  const vx=(sideways*Math.cos(this.yaw)-forward*Math.sin(this.yaw))/length*speed;
  const vz=(-forward*Math.cos(this.yaw)-sideways*Math.sin(this.yaw))/length*speed;
  this.velocity.x=damp(this.velocity.x,vx,acceleration,dt);this.velocity.y=damp(this.velocity.y,vz,acceleration,dt);
  const result=resolveMovement(this.position,this.velocity.x*dt,this.velocity.y*dt,obstacles);
  const distance=Math.hypot(result.x-this.position.x,result.z-this.position.z);this.travel+=distance;this.bobPhase+=distance*1.5;
  this.position.x=result.x;this.position.z=result.z;
  const bob=this.reduced?0:Math.sin(this.bobPhase)*Math.min(.027,this.velocity.length()*.003);
  this.camera.position.set(this.position.x,EYE_HEIGHT+bob,this.position.z);this.euler.set(this.pitch,this.yaw,0,'YXZ');this.camera.quaternion.setFromEuler(this.euler);
 }
 dispose(){this.listeners.abort();this.clear();}
}
