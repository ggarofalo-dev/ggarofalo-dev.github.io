import * as T from 'three';
import {QUALITY,adaptiveRatio} from './timeline.js';
                                               
                                      
const quadVertex='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
const blurFragment=`varying vec2 vUv;uniform sampler2D uTexture;uniform vec2 uDirection;uniform float uExtract;
void main(){vec3 c=texture2D(uTexture,vUv).rgb*.227027;
c+=texture2D(uTexture,vUv+uDirection*1.384615).rgb*.316216;
c+=texture2D(uTexture,vUv-uDirection*1.384615).rgb*.316216;
c+=texture2D(uTexture,vUv+uDirection*3.230769).rgb*.07027;
c+=texture2D(uTexture,vUv-uDirection*3.230769).rgb*.07027;
if(uExtract>.5){float l=max(c.r,max(c.g,c.b));c*=smoothstep(1.25,3.,l);}
gl_FragColor=vec4(c,1.);}`;
const compositeFragment=`varying vec2 vUv;uniform sampler2D uScene,uBloom;uniform float uBloomAmount,uExposure;
vec3 filmic(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}
vec3 srgb(vec3 x){return mix(12.92*x,1.055*pow(max(x,vec3(0.)),vec3(1./2.4))-.055,step(vec3(.0031308),x));}
void main(){vec3 color=texture2D(uScene,vUv).rgb+texture2D(uBloom,vUv).rgb*uBloomAmount;
color=filmic(color*uExposure);vec2 p=vUv-.5;float v=1.-smoothstep(.12,.62,dot(p,p))*.22;
color*=v;float grain=fract(sin(dot(vUv,vec2(12.9898,78.233)))*43758.5453)-.5;
gl_FragColor=vec4(srgb(color)+grain*.003,1.);}`;

export class FilmRenderer{
          renderer                ;
         sceneTarget                    ;
         bloomA                    ;
         bloomB                    ;
         reflection                    ;
         mirrorCamera=new T.PerspectiveCamera();
         textureMatrix=new T.Matrix4();
         quadScene=new T.Scene();
         quadCamera=new T.Camera();
         quad       ;
         blur                 ;
         composite                 ;
         reflectionUniform                  ;
         planarAmount={value:1};
 quality            ='balanced';
 ratio=1;
 adaptive=true;
         frame=0;
         average=16.7;
         adaptiveElapsed=0;
         direction=new T.Vector3();
         reflectedTarget=new T.Vector3();
         world           =null;
 constructor(canvas                  ){
  const context=canvas.getContext('webgl2',{alpha:false,antialias:false,powerPreference:'high-performance',stencil:false});
  if(!context)throw new Error('WebGL 2 non disponibile. Nessuna scena è stata caricata.');
  this.renderer=new T.WebGLRenderer({canvas,context,alpha:false,antialias:false,powerPreference:'high-performance'});
  this.renderer.outputColorSpace=T.SRGBColorSpace;this.renderer.toneMapping=T.NoToneMapping;
  this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;this.renderer.shadowMap.autoUpdate=false;
  this.renderer.info.autoReset=false;
  const type=context.getExtension('EXT_color_buffer_float')?T.HalfFloatType:T.UnsignedByteType;
  this.sceneTarget=new T.WebGLRenderTarget(1,1,{type,depthBuffer:true});
  this.bloomA=new T.WebGLRenderTarget(1,1,{type,depthBuffer:false});this.bloomB=this.bloomA.clone();
  this.reflection=new T.WebGLRenderTarget(512,512,{type,depthBuffer:true});this.reflectionUniform={value:this.reflection.texture};
  this.blur=new T.ShaderMaterial({vertexShader:quadVertex,fragmentShader:blurFragment,uniforms:{uTexture:{value:null},uDirection:{value:new T.Vector2()},uExtract:{value:0}},depthTest:false,depthWrite:false,toneMapped:false});
  this.composite=new T.ShaderMaterial({vertexShader:quadVertex,fragmentShader:compositeFragment,uniforms:{uScene:{value:this.sceneTarget.texture},uBloom:{value:this.bloomB.texture},uBloomAmount:{value:.16},uExposure:{value:1.1}},depthTest:false,depthWrite:false,toneMapped:false});
  this.quad=new T.Mesh(new T.PlaneGeometry(2,2),this.composite);this.quad.frustumCulled=false;this.quadScene.add(this.quad);
  this.setQuality(matchMedia('(max-width:850px)').matches?'low':'balanced');
 }
 attach(world      ){
  this.world=world;
  world.materials.floor.onBeforeCompile=shader=>{
   shader.uniforms.uPlanar=this.reflectionUniform;shader.uniforms.uPlanarMatrix={value:this.textureMatrix};shader.uniforms.uPlanarAmount=this.planarAmount;
   shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform mat4 uPlanarMatrix;varying vec4 vPlanarCoord;').replace('#include <project_vertex>','#include <project_vertex>\nvPlanarCoord=uPlanarMatrix*modelMatrix*vec4(transformed,1.);');
   shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D uPlanar;uniform float uPlanarAmount;varying vec4 vPlanarCoord;').replace('#include <opaque_fragment>',`vec2 planarUv=vPlanarCoord.xy/vPlanarCoord.w;
float valid=step(0.,planarUv.x)*step(planarUv.x,1.)*step(0.,planarUv.y)*step(planarUv.y,1.);
vec3 reflected=texture2D(uPlanar,clamp(planarUv,0.,1.)).rgb;
float fresnel=pow(1.-abs(dot(normalize(vViewPosition),normal)),3.);
outgoingLight=mix(outgoingLight,reflected,(.25+fresnel*.24)*valid*uPlanarAmount);
#include <opaque_fragment>`);
  };
  world.materials.floor.customProgramCacheKey=()=>'monolith-planar-r180';
  this.applyWorldQuality();
 }
         applyWorldQuality(){
  if(!this.world)return;const q=QUALITY[this.quality];
  this.world.sun.shadow.mapSize.set(q.shadow,q.shadow);this.world.sun.shadow.map?.dispose();this.world.sun.shadow.map=null;
  this.world.shafts.forEach((shaft,i)=>{shaft.visible=i<q.shafts;});
  this.renderer.shadowMap.needsUpdate=true;
 }
 setQuality(quality            ){
  this.quality=quality;this.ratio=Math.min(devicePixelRatio||1,QUALITY[quality].dpr);
  this.planarAmount.value=QUALITY[quality].reflection?1:0;
  this.sceneTarget.dispose();this.sceneTarget.samples=Math.min(this.renderer.capabilities.maxSamples,quality==='high'?4:quality==='balanced'?2:0);
  this.applyWorldQuality();this.resize();
 }
 resize(){
  const width=innerWidth,height=innerHeight;
  this.renderer.setPixelRatio(this.ratio);this.renderer.setSize(width,height,false);
  this.sceneTarget.setSize(Math.max(1,Math.round(width*this.ratio)),Math.max(1,Math.round(height*this.ratio)));
  this.bloomA.setSize(Math.max(1,Math.round(width*this.ratio/4)),Math.max(1,Math.round(height*this.ratio/4)));this.bloomB.setSize(this.bloomA.width,this.bloomA.height);
  const r=QUALITY[this.quality].reflection||256;this.reflection.setSize(r,Math.max(128,Math.round(r*height/width)));
 }
 render(scene        ,camera                    ,dt       ,cinematic        ){
  const r=this.renderer,q=QUALITY[this.quality];r.info.reset();
  const elapsedMs=dt*1000;this.average=this.average*.96+elapsedMs*.04;this.adaptiveElapsed+=dt;
  if(this.adaptive&&this.adaptiveElapsed>4){this.adaptiveElapsed=0;const ratio=adaptiveRatio(this.ratio,this.average,this.quality);if(Math.abs(ratio-this.ratio)>.025){this.ratio=Math.min(devicePixelRatio||1,ratio);this.resize();}}
  camera.updateMatrixWorld();
  if(q.reflection&&this.world&&(this.frame%2===0||cinematic)){
   this.mirrorCamera.copy(camera);this.mirrorCamera.position.y=.07-camera.position.y;
   camera.getWorldDirection(this.direction);this.direction.y*=-1;
   this.reflectedTarget.copy(this.mirrorCamera.position).add(this.direction);
   this.mirrorCamera.up.set(0,-1,0);this.mirrorCamera.lookAt(this.reflectedTarget);this.mirrorCamera.updateMatrixWorld();
   this.textureMatrix.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1).multiply(this.mirrorCamera.projectionMatrix).multiply(this.mirrorCamera.matrixWorldInverse);
   const visible=this.world.floor.visible;this.world.floor.visible=false;
   const autoUpdate=r.shadowMap.autoUpdate;r.shadowMap.autoUpdate=false;
   r.setRenderTarget(this.reflection);r.clear();r.render(scene,this.mirrorCamera);r.setRenderTarget(null);
   this.world.floor.visible=visible;r.shadowMap.autoUpdate=autoUpdate;
  }
  r.setRenderTarget(this.sceneTarget);r.clear();r.render(scene,camera);
  this.quad.material=this.blur;
  if(q.bloom){
   this.blur.uniforms.uTexture.value=this.sceneTarget.texture;this.blur.uniforms.uDirection.value.set(1/this.sceneTarget.width,0);this.blur.uniforms.uExtract.value=1;
   r.setRenderTarget(this.bloomA);r.render(this.quadScene,this.quadCamera);
   this.blur.uniforms.uTexture.value=this.bloomA.texture;this.blur.uniforms.uDirection.value.set(0,1/this.bloomA.height);this.blur.uniforms.uExtract.value=0;
   r.setRenderTarget(this.bloomB);r.render(this.quadScene,this.quadCamera);
   this.blur.uniforms.uTexture.value=this.bloomB.texture;this.blur.uniforms.uDirection.value.set(1/this.bloomB.width,0);
   r.setRenderTarget(this.bloomA);r.render(this.quadScene,this.quadCamera);
   this.composite.uniforms.uBloom.value=this.bloomA.texture;
  }
  this.composite.uniforms.uBloomAmount.value=q.bloom ? .17 : 0;
  this.quad.material=this.composite;r.setRenderTarget(null);r.render(this.quadScene,this.quadCamera);this.frame++;
 }
 get stats(){return {fps:1000/Math.max(1,this.average),calls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,quality:this.quality,ratio:this.ratio,memory:this.renderer.info.memory};}
 dispose(){this.sceneTarget.dispose();this.bloomA.dispose();this.bloomB.dispose();this.reflection.dispose();this.blur.dispose();this.composite.dispose();this.quad.geometry.dispose();this.renderer.dispose();}
}
