import { chromium, firefox, webkit } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const out='docs/qa/production';await mkdir(out,{recursive:true});
const results=[];
for(const [name,type] of Object.entries({chromium,firefox,webkit})){
  const browser=await type.launch(name==='chromium'?{args:['--enable-unsafe-swiftshader']}:{});
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const row={name,version:browser.version(),console:[],requests:[],failures:[]};
  page.on('console',m=>{if(['warning','error'].includes(m.type()))row.console.push({type:m.type(),text:m.text()});});
  page.on('pageerror',e=>row.failures.push(String(e)));
  page.on('response',r=>{if(/\.mp4|\.glb|runtime.mjs|api\/contact/.test(r.url()))row.requests.push({url:r.url(),status:r.status()});});
  await page.goto(process.env.QA_BASE_URL||'http://127.0.0.1:4176/');
  await page.getByLabel('Cargando experiencia SYKR4').waitFor({state:'detached'});await page.waitForTimeout(1000);
  await page.screenshot({path:`${out}/${name}-hero.jpg`,type:'jpeg',quality:80});
  await page.keyboard.press('End');await page.waitForFunction(()=>document.querySelector('video')?.currentTime>.2);
  await page.waitForTimeout(800);await page.screenshot({path:`${out}/${name}-video.jpg`,type:'jpeg',quality:80});
  await page.locator('video').evaluate(v=>{v.currentTime=v.duration-.03;});await page.waitForFunction(()=>document.querySelector('#recorrido').dataset.videoState==='finished');
  await page.locator('[data-astronaut-host]').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>['ready','fallback'].includes(document.querySelector('[data-astronaut-state]').dataset.astronautState));
  await page.waitForTimeout(900);await page.screenshot({path:`${out}/${name}-contact.jpg`,type:'jpeg',quality:80});
  row.astronaut=await page.locator('[data-astronaut-host]').evaluate(h=>h.sykr4Astronaut?.getDiagnostics());
  results.push(row);console.log(name,row.version,row.failures,row.console);
  await browser.close();
}
await writeFile(`${out}/results.json`,JSON.stringify(results,null,2));
