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
 await page.waitForFunction(()=>window.monolithState?.phase==='intro',{},{timeout:90000});
 await page.waitForTimeout(2500);await page.screenshot({path:path.join(root,'validation/prologue.png')});
 await page.locator('#skip-intro').click();await page.waitForFunction(()=>window.monolithState.phase==='explore');
 assert(await page.locator('#pause').isVisible());
 await page.locator('#enter').click();await page.waitForFunction(()=>!window.monolithState.paused);
 await page.waitForTimeout(800);await page.screenshot({path:path.join(root,'validation/hall-1080p.png')});
 const start=await page.evaluate(()=>window.monolithState.position);
 await page.keyboard.down('Shift');await page.keyboard.down('w');
 await page.waitForFunction(()=>window.monolithState.distance<28,{},{timeout:20000});
 await page.keyboard.up('w');await page.keyboard.up('Shift');await page.waitForTimeout(500);
 const near=await page.evaluate(()=>window.monolithState);assert(near.position[2]<start[2]-80);assert(near.position[2]>-27);assert(await page.locator('#interaction').isVisible());
 await page.keyboard.press('e');await page.waitForFunction(()=>window.monolithState.phase==='activation');
 await page.waitForFunction(()=>window.monolithState.activation>7,{},{timeout:15000});
 await page.screenshot({path:path.join(root,'validation/awakening.png')});
 await page.waitForFunction(()=>window.monolithState.phase==='awake',{},{timeout:20000});
 await page.screenshot({path:path.join(root,'validation/the-human-variable.png')});
 await page.keyboard.press('F3');await page.waitForTimeout(1000);report.measurements=await page.locator('#debug').innerText();
 await page.keyboard.press('Escape');await page.waitForFunction(()=>window.monolithState.paused);
 assert(await page.locator('#pause').isVisible());
 await page.selectOption('#quality','low');assert.equal(await page.evaluate(()=>window.monolithState.quality),'low');
 await page.locator('#reduce').click();assert.equal(await page.locator('#reduce').getAttribute('aria-pressed'),'true');
 await page.locator('#restart').click();await page.waitForFunction(()=>window.monolithState.phase==='explore');assert.equal((await page.evaluate(()=>window.monolithState)).activation,0);
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.responses,[]);report.status='passed';
}catch(error){report.status='blocked-or-failed';report.reason=error.message;process.exitCode=1;console.error(error.message);}
finally{await browser?.close();await new Promise(r=>app.close(r));await fs.writeFile(path.join(root,'validation/browser-report.json'),JSON.stringify(report,null,2));}
console.log(JSON.stringify(report,null,2));
