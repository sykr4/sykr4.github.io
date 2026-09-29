import { test, expect } from '@playwright/test';

test('touch flings, repeats, orientation and reduced viewport while typing (emulated)',async({browser,browserName})=>{
  test.skip(browserName!=='chromium','CDP touch input is Chromium-only; physical touch hardware is not available.');
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const page=await context.newPage();
  try {
    await page.goto('/');await page.getByLabel('Cargando experiencia SYKR4').waitFor({state:'detached'});
    const client=await context.newCDPSession(page);
    const touch=async(type:string,x:number,y:number)=>client.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y}],modifiers:0});
    for(let cycle=0;cycle<3;cycle++){
      await page.evaluate(()=>scrollTo(0,document.getElementById('recorrido')!.offsetTop-70));
      await page.waitForTimeout(100);
      await touch('touchStart',180,730);await touch('touchMove',180,130);await touch('touchEnd',180,130);
      await expect(page.locator('#recorrido')).toHaveAttribute('data-video-state','playing');
      await page.waitForTimeout(200);
      for(let n=0;n<4;n++){await touch('touchStart',180,730);await touch('touchMove',180,130);await touch('touchEnd',180,130);}
      await expect.poll(()=>page.locator('video').evaluate(v=>v.playbackRate)).toBeGreaterThan(1);
      await page.getByRole('button',{name:'Volver arriba',exact:true}).evaluate((b:HTMLButtonElement)=>b.click());
      await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);
    }
    await page.keyboard.press('End');await expect(page.locator('#recorrido')).toHaveAttribute('data-video-state','playing');
    await page.setViewportSize({width:844,height:390});
    await expect(page.locator('#recorrido')).toHaveAttribute('data-video-state','playing');
    await page.locator('video').evaluate(v=>{v.currentTime=v.duration-.03;});
    await expect(page.locator('#recorrido')).toHaveAttribute('data-video-state','finished');
    await page.setViewportSize({width:390,height:844});
    await page.locator('#mensaje').fill('Consulta con el teclado virtual simulado mediante una ventana reducida.');
    await page.setViewportSize({width:390,height:440});
    await page.locator('#mensaje').scrollIntoViewIfNeeded();
    await expect(page.locator('#mensaje')).toBeInViewport();
    await page.locator('#nombre').fill('Persona');await page.locator('#email').fill('test@example.com');
    await page.getByRole('button',{name:'Enviar consulta',exact:true}).click();
    await expect(page.locator('#contacto form')).toContainText('Tu consulta no se ha enviado');
  }finally{await context.close();}
});

test('small wheel deltas simulating trackpad and dragging the native scrollbar capture the scene',async({page,browserName})=>{
  test.skip(browserName!=='chromium','Native scrollbar geometry verified in Chromium.');
  await page.goto('/');await page.getByLabel('Cargando experiencia SYKR4').waitFor({state:'detached'});
  await page.evaluate(()=>scrollTo(0,document.getElementById('recorrido')!.offsetTop-60));await page.waitForTimeout(200);
  for(let i=0;i<20;i++){await page.mouse.wheel(0,8);await page.waitForTimeout(20);}
  await expect(page.locator('#recorrido')).toHaveAttribute('data-video-state','playing');
  await page.getByRole('button',{name:'Volver arriba',exact:true}).evaluate((b:HTMLButtonElement)=>b.click());
  // Wait for the compositor to recreate the native scrollbar after overflow:hidden.
  await page.waitForTimeout(500);
  const geometry=await page.evaluate(()=>({width:innerWidth,client:document.documentElement.clientWidth,height:innerHeight,doc:document.documentElement.scrollHeight}));
  expect(geometry.width-geometry.client).toBeGreaterThan(0);
  const x=geometry.client+(geometry.width-geometry.client)/2;
  await page.mouse.move(x,12);await page.mouse.down();
  for(let y=30;y<geometry.height-8;y+=60){await page.mouse.move(x,y);await page.waitForTimeout(100);}
  await page.mouse.up();
  await expect(page.locator('#recorrido')).toHaveAttribute('data-video-state','playing');
});

test('browser acceptance UI and negative acknowledgements keep data (local HTTP responses, no real email)',async({page})=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.route('**/api/contact/status',r=>r.fulfill({json:{available:true}}));
  let requests=0;
  await page.route('**/api/contact',async r=>{requests++;await new Promise(resolve=>setTimeout(resolve,400));await r.fulfill({status:502,json:{ok:false,code:'provider'}});});
  await page.goto('/');await page.getByLabel('Cargando experiencia SYKR4').waitFor({state:'detached'});
  await page.locator('#nombre').fill('Persona de prueba');await page.locator('#email').fill('test@example.com');await page.locator('#mensaje').fill('Este mensaje se comprueba mediante una respuesta HTTP local.');
  await page.getByRole('button',{name:'Enviar consulta',exact:true}).click();
  await expect(page.locator('#contacto form')).toHaveAttribute('aria-busy','true');
  await expect(page.locator('#contacto form')).toContainText('No hemos podido confirmar');
  await expect(page.locator('#mensaje')).not.toHaveValue('');
  await page.unroute('**/api/contact');
  await page.route('**/api/contact',r=>{requests++;return r.fulfill({status:202,json:{ok:true,id:'local-acceptance-test',accepted:true}});});
  await page.getByRole('button',{name:'Enviar consulta',exact:true}).click();
  await expect(page.locator('#contacto form')).toContainText('El servicio ha aceptado');
  await expect(page.getByRole('button',{name:'Consulta aceptada',exact:true})).toBeDisabled();
  expect(requests).toBe(2);
});
