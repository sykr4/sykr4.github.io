import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const out='docs/qa/responsive';
await mkdir(out,{recursive:true});
const browser=await chromium.launch({args:['--enable-unsafe-swiftshader']});
const sizes=[[320,568],[360,800],[390,844],[430,932],[844,390],[768,1024],[1024,768],[1280,720],[1366,768],[1440,900],[1920,1080],[2560,1440],[3440,1440]];
const extra=[[479,800],[480,800],[639,800],[640,800],[767,900],[769,900],[1023,780],[1024,779],[1024,780],[1025,781],[1279,900],[1281,900],[1535,900],[1536,900]];
const only=process.env.QA_ONLY;
const results=only?JSON.parse(await readFile(`${out}/results.json`,'utf8')).results:[];
const url=process.env.QA_BASE_URL||'http://127.0.0.1:4175';
async function check(width,height,{full=true,zoom=1}={}) {
  const label=zoom===1?`${width}x${height}`:`zoom-${zoom}-${width}x${height}`;
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:zoom,isMobile:width<768,hasTouch:width<1024});
  const page=await context.newPage();
  const errors=[],failures=[],network=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('requestfailed',r=>{if(!r.failure()?.errorText.includes('ABORTED')) failures.push({url:r.url(),error:r.failure()?.errorText});});
  page.on('response',r=>{if(r.status()>=400)network.push({url:r.url(),status:r.status()});});
  const row={label,width,height,zoom,full,errors,failures,network,checks:[],overflows:[]};
  const screenshot=async(name)=>{if(full)await page.screenshot({path:`${out}/${label}-${name}.jpg`,type:'jpeg',quality:75});};
  const audit=async(name)=>{
    const geometry=await page.evaluate(()=>({width:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth}));
    row.checks.push({name,...geometry});
    if(geometry.scrollWidth>geometry.width+1)row.overflows.push(name);
  };
  try {
    await page.goto(url);await page.getByLabel('Cargando experiencia SYKR4').waitFor({state:'detached'});await page.waitForTimeout(800);
    await screenshot('hero');await audit('hero');
    row.serviceTitles=await page.locator('.svc-card h3').evaluateAll(els=>els.map(el=>({text:el.textContent,width:el.clientWidth,scrollWidth:el.scrollWidth})));
    assert.ok(row.serviceTitles.every(el=>el.scrollWidth<=el.width+1),'Service title clipped');
    const cta=page.locator('#inicio').getByRole('button',{name:'Hablemos de tu proyecto',exact:true});
    await cta.scrollIntoViewIfNeeded();await page.waitForTimeout(350);
    row.cta=await cta.evaluate(el=>{
      const r=el.getBoundingClientRect();
      const hits=[.1,.5,.9].flatMap(x=>[.2,.5,.8].map(y=>el.contains(document.elementFromPoint(r.x+r.width*x,r.y+r.height*y))));
      const overlaps=[...document.querySelectorAll('.hero-card-inner')].some(card=>{const c=card.getBoundingClientRect();return c.left<r.right&&c.right>r.left&&c.top<r.bottom&&c.bottom>r.top;});
      return {box:r.toJSON(),hits,overlaps};
    });
    await screenshot('cta');
    assert.ok(row.cta.hits.every(Boolean),'CTA click surface intercepted');assert.equal(row.cta.overlaps,false,'HUD overlaps CTA');
    if(full){
      await page.getByRole('button',{name:'Abrir menú'}).evaluate(b=>b.click());await page.waitForTimeout(1400);await screenshot('menu');await audit('menu');
      await page.getByRole('button',{name:'Cerrar menú'}).click();await page.waitForTimeout(950);
      for(const id of ['manifiesto','servicios']){
        await page.evaluate(id=>document.getElementById(id).scrollIntoView(),id);await page.waitForTimeout(1600);await screenshot(id);await audit(id);
      }
      await page.evaluate(()=>{const i=document.querySelector('.video-intro');scrollTo(0,i.getBoundingClientRect().top+scrollY-80);});
      await page.waitForTimeout(600);await screenshot('intro');
      row.intro=await page.evaluate(()=>({title:document.querySelector('.video-intro h2').getBoundingClientRect().toJSON(),scene:document.querySelector('#recorrido').getBoundingClientRect().toJSON()}));
      assert.ok(row.intro.title.bottom<row.intro.scene.top,'Intro overlaps video');
      await page.mouse.wheel(0,20000);
      await page.waitForFunction(()=>document.querySelector('#recorrido').dataset.videoState==='playing');
      await page.waitForFunction(()=>document.querySelector('video')?.readyState>=2);
      await page.locator('video').evaluate(v=>{v.currentTime=18;});await page.waitForTimeout(1400);await screenshot('video');await audit('video');
      assert.equal(await page.locator('.vs-load-status').isVisible(),false,'Empty loading pill');
      row.video=await page.locator('video').evaluate(v=>({duration:v.duration,width:v.videoWidth,height:v.videoHeight,fit:getComputedStyle(v).objectFit,box:v.getBoundingClientRect().toJSON()}));
      await page.locator('video').evaluate(v=>{v.currentTime=v.duration-.03;});await page.waitForFunction(()=>document.querySelector('#recorrido').dataset.videoState==='finished');
      await page.evaluate(()=>document.getElementById('contacto').scrollIntoView());await page.waitForTimeout(1600);await audit('contacto');await screenshot('contacto');
      await page.locator('[data-astronaut-host]').scrollIntoViewIfNeeded();
      await page.waitForFunction(()=>['ready','fallback'].includes(document.querySelector('[data-astronaut-state]').dataset.astronautState),{timeout:20000});
      await page.waitForTimeout(600);await screenshot('astronaut');
      row.astronaut=await page.locator('[data-astronaut-host]').evaluate(h=>h.sykr4Astronaut?.getDiagnostics()??{});
      await page.locator('#contacto form button[type=submit]').click();await page.waitForTimeout(800);await screenshot('form-errors');await audit('form-errors');
      await page.locator('#nombre').fill('Nombre de prueba muy largo '.repeat(4));
      await page.locator('#email').fill('persona-con-un-correo-muy-largo@example.com');
      await page.locator('#empresa').fill('Empresa con un nombre largo '.repeat(4));
      await page.locator('#mensaje').fill('Mensaje largo para comprobar el ajuste de campos. '.repeat(80));
      await page.locator('#contacto form button[type=submit]').click();await page.waitForTimeout(800);await screenshot('form-unconfigured');await audit('form-long');
      for(const id of ['casos','resultados','nosotros']){
        await page.evaluate(id=>document.getElementById(id).scrollIntoView(),id);await page.waitForTimeout(1500);await audit(id);await screenshot(id);
      }
      await page.keyboard.press('End');await page.waitForTimeout(800);await screenshot('footer');await audit('footer');
      if([390,768,1280,1920,3440].includes(width))await page.screenshot({path:`${out}/${label}-full.jpg`,fullPage:true,type:'jpeg',quality:70});
    }
    assert.equal(row.overflows.length,0,'Horizontal overflow');assert.equal(errors.length,0,'Page exception');
    row.pass=true;
  }catch(e){row.pass=false;row.failure=String(e);await page.screenshot({path:`${out}/${label}-failure.jpg`,type:'jpeg',quality:80}).catch(()=>{});}
  const previous=results.findIndex(r=>r.label===label);
  if(previous>=0)results[previous]=row;else results.push(row);
  await writeFile(`${out}/results.json`,JSON.stringify({browser:browser.version(),results},null,2));
  console.log(label,row.pass?'PASS':row.failure);
  await context.close();
}
for(const [w,h] of sizes)if(!only||only===`${w}x${h}`)await check(w,h);
for(const [w,h] of extra)if(!only||only===`${w}x${h}`)await check(w,h,{full:false});
// Browser zoom layout equivalence: CSS viewport divided by zoom and DPR multiplied.
if(!only)for(const zoom of [1.25,1.5,2])await check(Math.round(1280/zoom),Math.round(720/zoom),{full:true,zoom});
await browser.close();
if(results.some(r=>!r.pass))process.exitCode=1;
