import { test, expect, type Page } from '@playwright/test';

async function open(page: Page) {
  await page.goto('/');
  await page.getByLabel('Cargando experiencia SYKR4').waitFor({ state: 'detached' });
  await page.waitForTimeout(800);
}
const scene = (page: Page) => page.locator('#recorrido');
async function finish(page: Page) {
  // Controlled seek is used for state regressions; the filmed tour plays the actual 76s media.
  await page.locator('video').evaluate(v => { v.currentTime = v.duration - .03; });
  await expect(scene(page)).toHaveAttribute('data-video-state','finished');
}
async function below(page: Page) {
  await page.keyboard.press('End');
  await expect(scene(page)).toHaveAttribute('data-video-state','playing');
  await page.waitForFunction(()=>document.querySelector('video')!.readyState>=2);
  await finish(page);
  await page.keyboard.press('End');
  await expect(page.getByRole('button',{name:'Volver arriba',exact:true})).toBeInViewport();
}

test('fast wheel, partial traversal, explicit top and repeated reactivation', async ({page}) => {
  await open(page);
  for(let i=0;i<3;i++) {
    await page.mouse.wheel(0,20000);
    await expect(scene(page)).toHaveAttribute('data-video-state','playing');
    await page.waitForFunction(()=>document.querySelector('video')!.currentTime>.2);
    await page.waitForTimeout(120);
    for(let burst=0;burst<5;burst++) await page.mouse.wheel(0,900);
    await expect.poll(()=>page.locator('video').evaluate(v=>v.playbackRate)).toBeGreaterThan(1);
    // Trigger the actual footer handler while its off-screen button is not pointer reachable.
    await page.getByRole('button',{name:'Volver arriba',exact:true}).evaluate((button:HTMLButtonElement)=>button.click());
    await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBe(0);
    await expect(scene(page)).toHaveAttribute('data-video-state','idle');
    expect(await page.locator('video').evaluate(v=>v.paused)).toBe(true);
    expect(await page.evaluate(()=>document.documentElement.style.overflow)).toBe('');
  }
  await below(page);
  await page.getByRole('button',{name:'Volver arriba',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBe(0);
  await page.keyboard.press('End');
  await expect(scene(page)).toHaveAttribute('data-video-state','playing');
});

test('entry from below, reverse direction mid-scene, exit and new visit',async({page})=>{
  await open(page);await below(page);
  await page.keyboard.press('Home');
  await expect(scene(page)).toHaveAttribute('data-video-state','playing');
  await expect.poll(()=>page.locator('.vs-hud').innerText()).toContain('REW');
  const time=await page.locator('video').evaluate(v=>v.currentTime);
  await page.waitForTimeout(400);
  expect(await page.locator('video').evaluate(v=>v.currentTime)).toBeLessThan(time);
  await page.mouse.wheel(0,240);
  await expect.poll(()=>page.locator('.vs-hud').innerText()).toContain('PLAY');
  await page.mouse.wheel(0,-240);
  await expect.poll(()=>page.locator('.vs-hud').innerText()).toContain('REW');
  // Complete a real rewind using sustained input, without replacing the virtual media clock.
  for(let i=0;i<120 && await scene(page).getAttribute('data-video-state')==='playing';i++) {
    await page.mouse.wheel(0,-240);await page.waitForTimeout(250);
  }
  await expect(scene(page)).toHaveAttribute('data-video-state','rewound');
  await page.mouse.wheel(0,-1500);await page.waitForTimeout(1600);
  await page.mouse.wheel(0,20000);
  await expect(scene(page)).toHaveAttribute('data-video-state','playing');
});

test('PageDown, PageUp, space and native jumps cannot skip capture',async({page})=>{
  await open(page);
  for(const key of ['PageDown',' ']) {
    await page.evaluate(()=>{const s=document.getElementById('recorrido')!;window.scrollTo(0,s.offsetTop-100);});
    await page.waitForTimeout(100);await page.keyboard.press(key);
    await expect(scene(page)).toHaveAttribute('data-video-state','playing');
    await page.getByRole('button',{name:'Volver arriba',exact:true}).evaluate((b:HTMLButtonElement)=>b.click());
  }
  await below(page);
  await page.evaluate(()=>{const s=document.getElementById('recorrido')!;window.scrollTo(0,s.offsetTop+100);});
  await page.waitForTimeout(200);await page.keyboard.press('PageUp');
  await expect(scene(page)).toHaveAttribute('data-video-state','playing');
  await page.getByRole('button',{name:'Volver arriba',exact:true}).evaluate((b:HTMLButtonElement)=>b.click());
  await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
  await expect(scene(page)).toHaveAttribute('data-video-state','playing');
});

test('resize and restored scroll do not strand the gate',async({page})=>{
  await open(page);await page.keyboard.press('End');
  await expect(scene(page)).toHaveAttribute('data-video-state','playing');
  await page.waitForFunction(()=>document.querySelector('video')!.currentTime>1);
  const time=await page.locator('video').evaluate(v=>v.currentTime);
  await page.setViewportSize({width:844,height:390});
  await expect(scene(page)).toHaveAttribute('data-video-state','playing');
  expect(await page.locator('video').evaluate(v=>v.currentTime)).toBeGreaterThanOrEqual(time);
  await page.reload();await page.getByLabel('Cargando experiencia SYKR4').waitFor({state:'detached'});
  const position=await page.evaluate(()=>({y:scrollY,top:document.getElementById('recorrido')!.offsetTop}));
  expect(Math.abs(position.y-position.top)).toBeLessThan(40);
  await page.keyboard.press('PageDown');
  await expect(scene(page)).toHaveAttribute('data-video-state','playing');
});

test('media failure unlocks the page and retry loads real video',async({page})=>{
  await page.route('**/*.mp4',route=>route.abort());
  await open(page);await page.keyboard.press('End');
  await expect(scene(page)).toHaveAttribute('data-video-state','error');
  expect(await page.evaluate(()=>document.documentElement.style.overflow)).toBe('');
  await page.unroute('**/*.mp4');
  await page.getByRole('button',{name:'Reintentar vídeo'}).click();
  await expect(scene(page)).toHaveAttribute('data-video-state','playing');
  await page.waitForFunction(()=>document.querySelector('video')!.currentTime>.2);
});

test('slow media load times out, unlocks and keeps contact usable',async({page})=>{
  await page.route('**/*.mp4',async route=>{await new Promise(resolve=>setTimeout(resolve,18000));await route.abort().catch(()=>{});});
  await open(page);await page.keyboard.press('End');
  await expect(scene(page)).toHaveAttribute('data-video-state','playing');
  await expect(page.locator('.vs-load-status')).toContainText('Cargando');
  await expect(scene(page)).toHaveAttribute('data-video-state','error',{timeout:22000});
  expect(await page.evaluate(()=>document.documentElement.style.overflow)).toBe('');
  await page.locator('#nombre').fill('Nombre de prueba');
  await expect(page.locator('#nombre')).toHaveValue('Nombre de prueba');
});

test('reduced motion, menu keyboard, service dialog and honest unconfigured form',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});await open(page);
  await page.getByRole('button',{name:'Abrir menú'}).click();
  await expect(page.getByRole('dialog',{name:'Menú principal'})).toBeVisible();
  await page.waitForTimeout(1000);
  await page.getByRole('button',{name:'Cerrar menú'}).focus();await page.keyboard.press('Shift+Tab');
  expect(await page.evaluate(()=>document.activeElement?.closest('#menu')!==null)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button',{name:'Abrir menú'})).toBeFocused();
  await page.locator('.svc-card button').first().click();
  await expect(page.getByRole('dialog')).toHaveCount(2); // menu remains inert in DOM
  await page.keyboard.press('Escape');await page.waitForTimeout(300);
  await page.locator('#contacto form button[type=submit]').click();
  await expect(page.locator('#nombre')).toBeFocused();
  await page.locator('#nombre').fill('Persona de prueba');
  await page.locator('#email').fill('test@example.com');
  await page.locator('#mensaje').fill('Esta consulta de prueba no debe enviarse sin configuración.');
  await page.locator('#contacto form button[type=submit]').click();
  await expect(page.locator('#contacto form')).toContainText('Tu consulta no se ha enviado');
  await expect(page.locator('#mensaje')).not.toHaveValue('');
  await page.keyboard.press('End');
  await expect(scene(page)).toHaveAttribute('data-video-state','static');
});

test('CTA respects the video and resumes its destination; opening a menu preserves the video lock',async({page})=>{
  await open(page);
  await page.locator('#inicio').getByRole('button',{name:'Hablemos de tu proyecto',exact:true}).click();
  await expect(scene(page)).toHaveAttribute('data-video-state','playing');
  await page.waitForFunction(()=>document.querySelector('video')!.readyState>=2);
  await finish(page);
  await expect.poll(()=>page.locator('#contacto').evaluate(el=>Math.abs(el.getBoundingClientRect().top))).toBeLessThan(3);
  await page.getByRole('button',{name:'Volver arriba',exact:true}).evaluate((b:HTMLButtonElement)=>b.click());
  await page.keyboard.press('End');await expect(scene(page)).toHaveAttribute('data-video-state','playing');
  await page.getByRole('button',{name:'Abrir menú'}).evaluate((b:HTMLButtonElement)=>b.click());
  await page.waitForTimeout(600);await page.keyboard.press('Escape');
  expect(await page.evaluate(()=>document.documentElement.style.overflow)).toBe('hidden');
  await page.getByRole('button',{name:'Volver arriba',exact:true}).evaluate((b:HTMLButtonElement)=>b.click());
  expect(await page.evaluate(()=>document.documentElement.style.overflow)).toBe('');
});

test('changing reduced-motion preference during capture cleans the lock',async({page})=>{
  await open(page);await page.keyboard.press('End');
  await expect(scene(page)).toHaveAttribute('data-video-state','playing');
  await page.emulateMedia({reducedMotion:'reduce'});
  await expect(scene(page)).toHaveAttribute('data-video-state','static');
  expect(await page.evaluate(()=>document.documentElement.style.overflow)).toBe('');
  await page.keyboard.press('End');
  await expect(page.getByRole('button',{name:'Volver arriba',exact:true})).toBeInViewport();
});
