import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import {root,build,server} from './offline.mjs';
const out=await build(),app=server(out);await new Promise(r=>app.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${app.address().port}`;
const report={syntax:'passed',http:[],imports:'passed',licenses:'passed',typecheck:'not available',vite:'dependencies unavailable',visual:'not tested'};
try{
 const modules=(await fs.readdir(path.join(out,'assets'))).filter(n=>n.endsWith('.js'));
 for(const name of modules){const source=await fs.readFile(path.join(out,'assets',name),'utf8');for(const [,importPath]of source.matchAll(/from\s+['"]([^'"]+)['"]/g)){if(importPath==='three')continue;assert(importPath.startsWith('./'));await fs.access(path.join(out,'assets',importPath));}}
 for(const item of ['','assets/main.js','assets/style.css','assets/world.js','assets/rendering.js','assets/tour.js','assets/stations.js','content.json','vendor/three.module.js','vendor/three.core.js','monolith.svg','space-grotesk.woff2','licenses/THREE-LICENSE.txt','licenses/SPACE-GROTESK-OFL.txt']){const response=await fetch(`${base}/${item}`);assert.equal(response.status,200,item);assert((await response.arrayBuffer()).byteLength>30);report.http.push(item||'index');}
 assert.equal((await fetch(`${base}/missing.file`)).status,404);
 for(const name of ['THREE-LICENSE.txt','SPACE-GROTESK-OFL.txt'])assert((await fs.readFile(path.join(out,'licenses',name),'utf8')).length>500);
 const html=await fs.readFile(path.join(out,'index.html'),'utf8');assert(html.includes('type="importmap"'));assert(!html.includes('src/main.ts'));const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
 const main=await fs.readFile(path.join(root,'src/main.ts'),'utf8');for(const [,id] of main.matchAll(/\belement(?:<[^>]+>)?\('([^']+)'\)/g))assert(ids.includes(id),`Missing UI element: ${id}`);assert(!main.includes('requestPointerLock'));assert(!main.includes('new Explorer'));
 assert.equal(JSON.parse(await fs.readFile(path.join(out,'content.json'),'utf8')).length,14);
 report.status='passed';console.log(JSON.stringify(report,null,2));
}finally{await new Promise(r=>app.close(r));await fs.writeFile(path.join(root,'validation/static-report.json'),JSON.stringify(report,null,2));}
