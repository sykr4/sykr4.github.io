import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const out='docs/qa/walkthrough';await mkdir(out,{recursive:true});
const browser=await chromium.launch({args:['--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:out,size:{width:1280,height:720}}});
const page=await context.newPage();const log=[],errors=[],network=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
page.on('requestfailed',r=>network.push({url:r.url(),error:r.failure()?.errorText}));
const sample=async(label)=>{const state=await page.evaluate(()=>({y:scrollY,state:document.querySelector('#recorrido')?.dataset.videoState,time:document.querySelector('video')?.currentTime,rate:document.querySelector('video')?.playbackRate,locked:document.documentElement.style.overflow}));log.push({label,...state});console.log(label,state);};
await page.goto(process.env.QA_BASE_URL||'http://127.0.0.1:4175/');await page.getByLabel('Cargando experiencia SYKR4').waitFor({state:'detached'});await page.waitForTimeout(1000);
await page.mouse.wheel(0,18000);await page.waitForTimeout(1000);await sample('ráfaga: captura a 1x');
for(let i=0;i<150;i++){
  if(await page.locator('#recorrido').getAttribute('data-video-state')!=='playing')break;
  await page.mouse.wheel(0,240);await page.waitForTimeout(220);
  if(i%20===0)await sample('recorrido real acelerado');
}
assert.equal(await page.locator('#recorrido').getAttribute('data-video-state'),'finished');
await sample('final real del MP4');await page.keyboard.press('End');await page.waitForTimeout(900);
await page.getByRole('button',{name:'Volver arriba',exact:true}).click();await sample('Volver arriba');
assert.equal(await page.evaluate(()=>scrollY),0);
await page.waitForTimeout(800);await page.mouse.wheel(0,20000);await page.waitForTimeout(1500);await sample('reactivación manual');
assert.equal(await page.locator('#recorrido').getAttribute('data-video-state'),'playing');
await page.screenshot({path:`${out}/video-without-oval.png`});
// Explicitly documented seek only for reaching the 3D verification after the filmed real traversal.
await page.locator('video').evaluate(v=>{v.currentTime=v.duration-.03;});await page.waitForTimeout(300);
await page.locator('[data-astronaut-host]').scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('[data-astronaut-host]')?.sykr4Astronaut?.getDiagnostics().rendered);
await page.mouse.move(5,5);
const astronaut=[];
for(let n=0;n<90;n++){
  await page.waitForTimeout(1000);
  const d=await page.locator('[data-astronaut-host]').evaluate(el=>el.sykr4Astronaut.getDiagnostics());
  astronaut.push({loaded:d.loaded,rendered:d.rendered,behavior:d.behavior});
  if(n%10===0)console.log('astronaut automatic observation',d.behavior);
  if(d.behavior.automaticCount>0){await page.screenshot({path:`${out}/astronaut-automatic.png`});break;}
}
await context.close();
await page.video().saveAs(`${out}/scroll-top-reactivation.webm`);
await writeFile(`${out}/results.json`,JSON.stringify({browser:browser.version(),log,astronaut,errors,network},null,2));
await browser.close();
assert.ok(astronaut.some(d=>d.behavior.automaticCount>0),'Automatic gesture must happen without demo buttons');
