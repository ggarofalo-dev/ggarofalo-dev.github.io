import * as T from 'three';
function hash(x       ,y       ){let v=Math.imul(x+9381,y+1387);v=Math.imul(v^(v>>>13),1274126177);return ((v^(v>>>16))>>>0)/4294967295;}
function noise(x       ,y       ){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);return T.MathUtils.lerp(T.MathUtils.lerp(hash(ix,iy),hash(ix+1,iy),sx),T.MathUtils.lerp(hash(ix,iy+1),hash(ix+1,iy+1),sx),sy);}
export function makeMaterials(renderer                ){
 const size=512,height=new Float32Array(size*size);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++)height[y*size+x]=noise(x/80,y/80)*.45+noise(x/16,y/16)*.22+noise(x/3,y/3)*.13+hash(x,y)*.07+(y%128<2?-.08:0);
 const rough=new Uint8Array(size*size*4),normal=new Uint8Array(size*size*4),albedo=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const p=y*size+x,i=p*4,h=height[p],dx=height[y*size+(x+1)%size]-height[y*size+(x+size-1)%size],dy=height[((y+1)%size)*size+x]-height[((y+size-1)%size)*size+x];
  const value=Math.floor(125+h*110);albedo.set([value,value+2,value+3,255],i);const r=Math.floor(130+h*110);rough.set([r,r,r,255],i);
  const n=new T.Vector3(-dx*2,-dy*2,1).normalize();normal.set([Math.round((n.x*.5+.5)*255),Math.round((n.y*.5+.5)*255),Math.round((n.z*.5+.5)*255),255],i);
 }
 const texture=(data           ,color=false)=>{const tex=new T.DataTexture(data,size,size,T.RGBAFormat);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.magFilter=T.LinearFilter;tex.minFilter=T.LinearMipmapLinearFilter;tex.generateMipmaps=true;tex.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());if(color)tex.colorSpace=T.SRGBColorSpace;tex.repeat.set(5,5);tex.needsUpdate=true;return tex;};
 const diffuse=texture(albedo,true),normalMap=texture(normal),roughnessMap=texture(rough);
 const concrete=new T.MeshStandardMaterial({color:0x556064,map:diffuse,normalMap,normalScale:new T.Vector2(.4,.4),roughnessMap,roughness:.95,metalness:.04});
 const stone=new T.MeshPhysicalMaterial({color:0x20292c,map:diffuse,normalMap,normalScale:new T.Vector2(.18,.18),roughnessMap,roughness:.47,metalness:.28,clearcoat:.35,clearcoatRoughness:.38});
 const metal=new T.MeshStandardMaterial({color:0x263034,normalMap,normalScale:new T.Vector2(.09,.55),roughness:.34,metalness:.82});
 const floor=new T.MeshPhysicalMaterial({color:0x283233,map:diffuse,normalMap,normalScale:new T.Vector2(.045,.045),roughnessMap,roughness:.34,metalness:.4,clearcoat:.5,clearcoatRoughness:.26});
 const recess=new T.MeshStandardMaterial({color:0x080d0f,roughness:.85,metalness:.15});
 const light=new T.MeshStandardMaterial({color:0xdbe2cd,emissive:0xc9dcc5,emissiveIntensity:.3,roughness:.3,metalness:.05});
 const core=new T.MeshPhysicalMaterial({color:0xb9c8a7,emissive:0xdcecc0,emissiveIntensity:.1,roughness:.18,metalness:.25,clearcoat:1,clearcoatRoughness:.2,transparent:true,opacity:.92});
 const seam=new T.MeshStandardMaterial({color:0x394345,metalness:.7,roughness:.31,emissive:0xb5cf91,emissiveIntensity:.03});
 return {concrete,stone,metal,floor,recess,light,core,seam,textures:[diffuse,normalMap,roughnessMap]};
}
export function beveledBox(width       ,height       ,depth       ,bevel=.15){
 const b=Math.min(bevel,Math.min(width,height,depth)*.2),shape=new T.Shape();
 const x=width/2-b,y=height/2-b;
 shape.moveTo(-x,-y);shape.lineTo(x,-y);shape.lineTo(x,y);shape.lineTo(-x,y);shape.closePath();
 const geo=new T.ExtrudeGeometry(shape,{depth:depth-2*b,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:b,bevelThickness:b,curveSegments:1});
 geo.translate(0,0,-depth/2+b);geo.computeVertexNormals();return geo;
}
