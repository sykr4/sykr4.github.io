import { chromium } from '@playwright/test';
const b=await chromium.launch({ignoreDefaultArgs:['--hide-scrollbars']});
const p=await b.newPage({viewport:{width:1280,height:720}});
await p.goto('http://127.0.0.1:4175/');await p.getByLabel('Cargando experiencia SYKR4').waitFor({state:'detached'});
await p.waitForTimeout(1200);
await p.evaluate(()=>{window.__scrollLog=[];addEventListener('scroll',()=>window.__scrollLog.push({y:scrollY,state:document.getElementById('recorrido').dataset.videoState}));});
const geometry=await p.evaluate(()=>({width:innerWidth,client:document.documentElement.clientWidth,height:innerHeight,doc:document.documentElement.scrollHeight,overflow:document.documentElement.style.overflow}));
console.log(geometry);
await p.screenshot({path:'docs/qa/scrollbar-before.png'});
const x=1275;
await p.mouse.move(x,12);await p.mouse.down();
for(let y=30;y<715;y+=60){await p.mouse.move(x,y);await p.waitForTimeout(150);console.log(y,await p.evaluate(()=>({y:scrollY,state:document.getElementById('recorrido').dataset.videoState})));}
await p.mouse.up();await p.waitForTimeout(500);
console.log(await p.evaluate(()=>window.__scrollLog));
await p.screenshot({path:'docs/qa/scrollbar-after.png'});
await b.close();
