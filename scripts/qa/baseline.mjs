import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const out = 'docs/qa/before';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', args: ['--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
await page.goto('http://127.0.0.1:4175/');
await page.getByLabel('Cargando experiencia SYKR4').waitFor({ state: 'detached' });
await page.waitForTimeout(1800);
await page.screenshot({ path: `${out}/hero-1280x720.png` });
const hero = await page.evaluate(() => ({
  cta: document.querySelector('#inicio .hero-intro button')?.getBoundingClientRect().toJSON(),
  widget: [...document.querySelectorAll('.hero-card')].map(el => el.getBoundingClientRect().toJSON()),
}));
await page.keyboard.press('End');
await page.waitForFunction(() => document.querySelector('#recorrido')?.dataset.videoState === 'playing');
await page.waitForTimeout(2500);
await page.locator('video').evaluate(v => { v.pause(); v.currentTime = 7; });
await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/video-oval.png` });
const sourceFrame = await page.locator('video').evaluate(v => {
  const canvas = document.createElement('canvas');
  canvas.width = v.videoWidth; canvas.height = v.videoHeight;
  canvas.getContext('2d').drawImage(v, 0, 0);
  return { time: v.currentTime, width: v.videoWidth, height: v.videoHeight, data: canvas.toDataURL('image/png') };
});
await writeFile(`${out}/original-video-frame.png`, Buffer.from(sourceFrame.data.split(',')[1], 'base64'));
const layers = await page.locator('#recorrido [role=status]').evaluate(el => ({
  text: el.textContent, box: el.getBoundingClientRect().toJSON(), background: getComputedStyle(el).backgroundColor,
  radius: getComputedStyle(el).borderRadius, padding: getComputedStyle(el).padding,
}));
await writeFile(`${out}/baseline.json`, JSON.stringify({ hero, layers, frameTime: sourceFrame.time, errors }, null, 2));
console.log(JSON.stringify({ hero, layers, frameTime: sourceFrame.time, errors }));
await browser.close();
