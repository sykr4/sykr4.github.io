import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const out='docs/qa/services';await mkdir(out,{recursive:true});
const browser=await chromium.launch();const results=[];
for(const width of [320,390,768,1280]){
  const page=await browser.newPage({viewport:{width,height:800},reducedMotion:'reduce'});
  await page.goto(process.env.QA_BASE_URL||'http://127.0.0.1:4175/');await page.getByLabel('Cargando experiencia SYKR4').waitFor({state:'detached'});
  for(let i=0;i<5;i++){
    await page.locator('.svc-card button').nth(i).click();
    const title=page.locator('#service-detail-title');await title.waitFor();
    const layout=await title.evaluate(el=>({title:el.textContent,width:el.clientWidth,scroll:el.scrollWidth,dialogWidth:el.closest('[role=dialog]').querySelector('[data-lenis-prevent]').scrollWidth,viewport:innerWidth}));
    assert.ok(layout.scroll<=layout.width+1,`Clipped title ${width} ${i}`);assert.ok(layout.dialogWidth<=layout.viewport,`Dialog overflow ${width} ${i}`);
    await page.screenshot({path:`${out}/${width}-service-${i+1}.jpg`,type:'jpeg',quality:75});
    results.push({width,...layout});
    await page.keyboard.press('Escape');
  }
  await page.close();
}
await writeFile(`${out}/results.json`,JSON.stringify(results,null,2));
console.log('PASS',results.length,'service dialogs');await browser.close();
