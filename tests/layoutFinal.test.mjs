import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, stat } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('hero keeps the original editorial composition instead of the production side rail', async () => {
  const hero = await read('src/sections/Hero.tsx');
  const css = await read('src/index.css');
  assert.match(hero, /text-\[clamp\(2\.35rem,7\.6vw,8\.2rem\)\]/);
  assert.match(hero, /absolute inset-0 z-10 hidden xl:block/);
  assert.doesNotMatch(css, /\.hero-content\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*260px/s);
});

test('services use pinned storytelling on pointer desktops and a real responsive grid elsewhere', async () => {
  const services = await read('src/sections/Services.tsx');
  assert.match(services, /\(min-width: 1024px\) and \(hover: hover\)/);
  assert.doesNotMatch(services, /min-height:\s*780px/);
  assert.match(services, /mt-12 grid gap-4 px-5 pb-6 sm:grid-cols-2/);
  assert.match(services, /line-clamp-4/);
});

test('large story video is deferred and optimized for streaming', async () => {
  const story = await read('src/sections/VideoStory.tsx');
  assert.match(story, /preload="metadata"/);
  assert.match(story, /useInView\(sectionRef, "100% 0px", true\)/);
  assert.match(story, /opacity-25 blur-3xl brightness-50 saturate-150 md:hidden/);
  assert.match(story, /\/\/ statusRef\.current\.textContent = !st\.ready \|\| v\.readyState < 2 \? \"Cargando el recorrido…\"/);
  const file = await stat(new URL('../public/SYKR4_6_Planetas_WEB_720p.mp4', import.meta.url));
  assert.ok(file.size < 22 * 1024 * 1024, `optimized video is still too large: ${file.size}`);
});

test('responsive hardening keeps long content shrinkable', async () => {
  const css = await read('src/index.css');
  assert.match(css, /#contacto form, #contacto \[data-field\] \{ min-width: 0; \}/);
  assert.match(css, /#casos \.case-item, #casos \.case-item \*, #casos \.grid > div \{ min-width: 0; \}/);
  assert.match(css, /@media \(max-width: 767px\)/);
  assert.match(css, /@media \(max-height: 540px\)/);
});


test('visual effects use a saner GPU budget and hidden hero decor does not animate', async () => {
  const device = await read('src/lib/device.ts');
  const hero = await read('src/sections/Hero.tsx');
  assert.match(device, /high: 24000, mid: 10000, low: 4000/);
  assert.match(device, /high: 1\.5, mid: 1\.25, low: 1/);
  assert.match(hero, /useMediaQuery\("\(min-width: 1280px\)"\)/);
  assert.match(hero, /device\.touch \|\| device\.reducedMotion \|\| !showDecor/);
});


test('explicit contact navigation bypasses the video gate while manual traversal stays armed', async () => {
  const scroll = await read('src/lib/scroll.ts');
  const story = await read('src/sections/VideoStory.tsx');
  const direct = await read('src/lib/topNavigation.ts');
  assert.match(scroll, /goesToContact/);
  assert.match(scroll, /navigateDirectlyToTarget\(\(\) => jumpScrollTo\(top\)\)/);
  assert.match(story, /isBypassingVideo\(\)/);
  assert.match(direct, /export function navigateDirectlyToTarget/);
});
