import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {root,build,server} from './offline.mjs';
const require=createRequire(import.meta.url);
let playwright;
try{playwright=require('playwright');}catch{playwright=createRequire(path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json'))('playwright');}
const out=await build(),app=server(out);await new Promise(r=>app.listen(0,'127.0.0.1',r));
const report={status:'pending',visualInspected:false,errors:[],responses:[],measurements:null};let browser;
try{
 browser=await playwright.chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1920,height:1080}});
 page.on('pageerror',error=>report.errors.push(error.message));page.on('console',message=>{if(message.type()==='error')report.errors.push(message.text());});
 page.on('response',response=>{if(response.status()>=400)report.responses.push([response.status(),response.url()]);});
 await page.goto(`http://127.0.0.1:${app.address().port}`);
 await page.waitForFunction(()=>['travel','activation'].includes(window.monolithState?.phase),{},{timeout:90000});
 await page.screenshot({path:path.join(root,'validation/guided-approach.png')});
 // No click, keyboard input or pointer lock before the opening completes.
 assert(await page.locator('#pause').isHidden());assert(await page.locator('#tools').isHidden());
 await page.waitForFunction(()=>window.monolithState.phase==='activation',{},{timeout:25000});
 assert(await page.locator('#interaction').isHidden());
 assert.equal(await page.evaluate(()=>document.pointerLockElement),null);
 await page.waitForFunction(()=>window.monolithState.activation>7,{},{timeout:15000});await page.screenshot({path:path.join(root,'validation/awakening.png')});
 await page.waitForFunction(()=>window.monolithState.phase==='hub',{},{timeout:25000});
 assert(await page.locator('#territory-dock').isVisible());
 await page.screenshot({path:path.join(root,'validation/guided-hub.png')});
 for(const id of ['build','think','speak','write']){
  await page.locator('[data-territory="'+id+'"]').click();
  await page.waitForFunction(target=>window.monolithState.phase==='territory'&&window.monolithState.territory===target,id,{timeout:10000});
  assert(await page.locator('#reader').isVisible());assert((await page.locator('#reader-body').innerText()).length>200);
  assert.equal(await page.evaluate(()=>window.monolithState.position[1]),10);
  assert.equal(await page.evaluate(()=>document.pointerLockElement),null);
  await page.screenshot({path:path.join(root,'validation/guided-'+id+'.png')});
 }
 assert.equal(await page.locator('#reader-body article').count(),8);
 await page.locator('#reader-close').click();assert(await page.locator('#reader').isHidden());
 await page.locator('[data-territory="speak"]').click();await page.locator('#skip-journey').click();
 assert.equal(await page.evaluate(()=>window.monolithState.phase),'territory');assert.equal(await page.locator('#reader-body article').count(),6);
 await page.keyboard.press('F3');await page.waitForTimeout(1000);report.measurements=await page.locator('#debug').innerText();
 await page.locator('#reader-close').click();await page.locator('#reduce').click();
 await page.locator('#hub-button').click();assert.equal(await page.evaluate(()=>window.monolithState.phase),'hub');
 await page.locator('[data-territory="think"]').click();assert.equal(await page.evaluate(()=>window.monolithState.phase),'territory');
 await page.selectOption('#quality','low');await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>window.monolithState.quality),'low');
 await page.keyboard.press('r');await page.waitForFunction(()=>window.monolithState.phase==='hub');assert.equal((await page.evaluate(()=>window.monolithState)).activation,13);
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.responses,[]);report.status='passed';
}catch(error){report.status='blocked-or-failed';report.reason=error.message;process.exitCode=1;console.error(error.message);}
finally{await browser?.close();await new Promise(r=>app.close(r));await fs.writeFile(path.join(root,'validation/browser-report.json'),JSON.stringify(report,null,2));}
console.log(JSON.stringify(report,null,2));
