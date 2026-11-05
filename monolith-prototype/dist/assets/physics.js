                                                                                   
                                         
export const PLAYER_RADIUS=.72;
export const EYE_HEIGHT=10;
export const HALL_LIMITS={minX:-114,maxX:114,minZ:-192,maxZ:192};
export const clamp=(v       ,a       ,b       )=>Math.min(b,Math.max(a,v));
export const damp=(a       ,b       ,lambda       ,dt       )=>a+(b-a)*(1-Math.exp(-lambda*dt));
export function resolveMovement(position         ,dx       ,dz       ,obstacles                    ,radius=PLAYER_RADIUS)         {
 const p={...position},steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/(radius*.45)));
 for(let s=0;s<steps;s++){
  p.x=clamp(p.x+dx/steps,HALL_LIMITS.minX+radius,HALL_LIMITS.maxX-radius);
  p.z=clamp(p.z+dz/steps,HALL_LIMITS.minZ+radius,HALL_LIMITS.maxZ-radius);
  for(const b of obstacles){
   const nx=clamp(p.x,b.minX,b.maxX),nz=clamp(p.z,b.minZ,b.maxZ),vx=p.x-nx,vz=p.z-nz,dist=Math.hypot(vx,vz);
   if(dist>=radius)continue;
   if(dist>.00001){const overlap=radius-dist;p.x+=vx/dist*overlap;p.z+=vz/dist*overlap;}
   else{
    const faces=[{d:p.x-b.minX,x:b.minX-radius,z:p.z},{d:b.maxX-p.x,x:b.maxX+radius,z:p.z},{d:p.z-b.minZ,x:p.x,z:b.minZ-radius},{d:b.maxZ-p.z,x:p.x,z:b.maxZ+radius}].sort((a,b)=>a.d-b.d);
    p.x=faces[0].x;p.z=faces[0].z;
   }
  }
 }
 return {x:clamp(p.x,HALL_LIMITS.minX+radius,HALL_LIMITS.maxX-radius),z:clamp(p.z,HALL_LIMITS.minZ+radius,HALL_LIMITS.maxZ-radius)};
}
