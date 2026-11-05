// Offline delivery path, not a replacement or counterfeit for Vite/tsc.
// Node's native TypeScript stripper checks syntax and emits browser ESM, not types.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {stripTypeScriptTypes} from 'node:module';
import http from 'node:http';
export const root=fileURLToPath(new URL('../',import.meta.url));
export async function build(){
 const out=path.join(root,'dist');await fs.mkdir(path.join(out,'assets'),{recursive:true});
 await fs.cp(path.join(root,'public'),out,{recursive:true});
 const sources=(await fs.readdir(path.join(root,'src'))).filter(n=>n.endsWith('.ts'));
 for(const file of sources){const source=await fs.readFile(path.join(root,'src',file),'utf8');const js=stripTypeScriptTypes(source,{mode:'strip'}).replaceAll(/(from\s+['"]\.\/[^'"]+)\.ts(['"])/g,'$1.js$2');await fs.writeFile(path.join(out,'assets',file.replace(/\.ts$/,'.js')),js);}
 const css=(await fs.readFile(path.join(root,'src/style.css'),'utf8')).replace("url('/space-grotesk.woff2')","url('../space-grotesk.woff2')");await fs.writeFile(path.join(out,'assets/style.css'),css);
 const map='<script type="importmap">{"imports":{"three":"./vendor/three.module.js"}}</script>';
 let html=await fs.readFile(path.join(root,'index.html'),'utf8');html=html.replace('./src/style.css','./assets/style.css').replace('<script type="module" src="./src/main.ts"></script>',`${map}\n<script type="module" src="./assets/main.js"></script>`);await fs.writeFile(path.join(out,'index.html'),html);
 const report={mode:'offline-native-typescript-strip',typechecked:false,viteBuild:false,modules:sources.length,threeRevision:'180',generated:new Date().toISOString()};await fs.writeFile(path.join(out,'build-info.json'),JSON.stringify(report,null,2));console.log(`Offline static build: ${sources.length} TypeScript modules; Three.js r180; no network. This is not a Vite build or a typecheck.`);return out;
}
export function server(directory){return http.createServer(async(req,res)=>{
 try{const requestPath=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const resolved=path.resolve(directory,'.'+requestPath);if(resolved!==directory&&!resolved.startsWith(directory+path.sep)){res.writeHead(403).end();return;}let target=resolved;if((await fs.stat(target)).isDirectory())target=path.join(target,'index.html');const content=await fs.readFile(target);const ext=path.extname(target),mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.woff2':'font/woff2','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8'}[ext]||'application/octet-stream';res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-store'});res.end(content);}catch{res.writeHead(404).end('Not found');}
 });}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const out=await build();if(process.argv[2]==='serve'){const app=server(out);app.listen(Number(process.env.PORT||5173),'127.0.0.1',()=>console.log(`MONOLITH: http://127.0.0.1:${process.env.PORT||5173}`));}
}
