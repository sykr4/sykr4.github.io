/**
 * DOM integration tests of the real VideoStory component.
 * These simulate input and media state in jsdom; they are not browser/video QA.
 * Run: node --test tests/videoStory.test.mjs
 */
import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { writeFile, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';

const project = fileURLToPath(new URL('../', import.meta.url));
const runtimeURL = new URL(`.video-story-runtime-${process.pid}.mjs`, import.meta.url);
const mocks = {
  '@/lib/scroll': `
    const chain = { to() { return chain; }, fromTo() { return chain; } };
    export const gsap = { killTweensOf() {}, set() {}, to() {}, fromTo() {}, timeline() { return chain; } };
    export function jumpScrollTo(y) { const h = globalThis.__videoHarness; h.y = y; h.jumps.push(y); }
    export function lockScroll(locked, owner) { const h = globalThis.__videoHarness; h.locks.push([locked, owner]); h.locked = locked; }
  `,
  '@gsap/react': 'export function useGSAP() {}',
  '@/lib/loop': `export function addFrame(cb) { const h = globalThis.__videoHarness; h.frames.add(cb); return () => h.frames.delete(cb); }`,
  '@/lib/hooks': 'export function useInView() { return true; }',
  '@/lib/quality': `export function useQuality() { return { device: globalThis.__videoHarness.device }; }`,
  '@/components/ui': 'export function SectionLabel() { return null; }',
};
const built = await build({
  absWorkingDir: project,
  stdin: { contents: `export { VideoStory } from './src/sections/VideoStory.tsx'; export { navigateDirectlyToTop, isReturningToTop } from './src/lib/topNavigation.ts';`, resolveDir: project, loader: 'ts' },
  bundle: true,
  write: false,
  platform: 'node',
  format: 'esm',
  jsx: 'automatic',
  external: ['react', 'react/jsx-runtime'],
  plugins: [{
    name: 'dom-fixture-adapters',
    setup(plugin) {
      plugin.onResolve({ filter: /.*/ }, ({ path }) => path in mocks ? { path, namespace: 'fixture' } : undefined);
      plugin.onLoad({ filter: /.*/, namespace: 'fixture' }, ({ path }) => ({ contents: mocks[path], loader: 'js' }));
    },
  }],
});
await writeFile(runtimeURL, built.outputFiles[0].text);

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://test.invalid/', pretendToBeVisual: true });
const { window } = dom;
for (const name of ['window', 'document', 'HTMLElement', 'HTMLMediaElement', 'HTMLVideoElement', 'Event', 'WheelEvent', 'KeyboardEvent', 'Node']) {
  Object.defineProperty(globalThis, name, { configurable: true, value: name === 'window' ? window : window[name] });
}
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: window.navigator });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
Object.defineProperty(globalThis, 'performance', { configurable: true, value: { now: () => globalThis.__videoHarness?.now ?? 0 } });
Object.defineProperty(window, 'scrollY', { configurable: true, get: () => globalThis.__videoHarness?.y ?? 0 });
Object.defineProperty(window, 'innerHeight', { configurable: true, get: () => globalThis.__videoHarness?.height ?? 800 });
Object.defineProperty(document, 'hidden', { configurable: true, get: () => globalThis.__videoHarness?.hidden ?? false });
Object.defineProperty(window.HTMLElement.prototype, 'offsetHeight', {
  configurable: true,
  get() { return this.id === 'recorrido' ? window.innerHeight + 32 : 0; },
});
window.HTMLElement.prototype.getBoundingClientRect = function () {
  const h = globalThis.__videoHarness;
  const top = this.id === 'recorrido' ? h.top - h.y : 0;
  return { x: 0, y: top, top, left: 0, right: 1440, bottom: top + this.offsetHeight, width: 1440, height: this.offsetHeight, toJSON() {} };
};
const mediaStates = new WeakMap();
function mediaState(video) {
  if (!mediaStates.has(video)) mediaStates.set(video, { paused: true, currentTime: 0, playbackRate: 1 });
  return mediaStates.get(video);
}
for (const [key, get] of Object.entries({
  duration: () => globalThis.__videoHarness.duration,
  readyState: () => globalThis.__videoHarness.ready ? 4 : 0,
  paused() { return mediaState(this).paused; },
  ended() { return this.currentTime >= this.duration; },
  seeking: () => false,
})) Object.defineProperty(window.HTMLMediaElement.prototype, key, { configurable: true, get });
for (const key of ['currentTime', 'playbackRate']) Object.defineProperty(window.HTMLMediaElement.prototype, key, {
  configurable: true,
  get() { return mediaState(this)[key]; },
  set(value) { mediaState(this)[key] = value; },
});
window.HTMLMediaElement.prototype.load = function () {
  if (globalThis.__videoHarness.ready) this.dispatchEvent(new window.Event('loadedmetadata'));
};
window.HTMLMediaElement.prototype.play = function () { mediaState(this).paused = false; return Promise.resolve(); };
window.HTMLMediaElement.prototype.pause = function () { mediaState(this).paused = true; };

const React = await import('react');
const { act } = React;
const { createRoot } = await import('react-dom/client');
const { VideoStory, navigateDirectlyToTop, isReturningToTop } = await import(runtimeURL.href);
after(async () => { await unlink(runtimeURL); dom.window.close(); delete globalThis.__videoHarness; });

async function fixture(options, run) {
  if (typeof options === 'function') { run = options; options = {}; }
  const h = {
    y: 0, top: 1000, height: 800, now: 0, duration: 2, ready: true, hidden: false,
    locked: false, locks: [], jumps: [], frames: new Set(),
    device: { tier: 'low', reducedMotion: false, saveData: false }, ...options,
  };
  globalThis.__videoHarness = h;
  const container = document.createElement('main');
  document.body.replaceChildren(container);
  const root = createRoot(container);
  await act(async () => { root.render(React.createElement(VideoStory)); });
  const f = {
    h,
    get section() { return container.querySelector('#recorrido'); },
    get video() { return container.querySelector('video'); },
    async scroll(y) { await act(async () => { h.y = y; window.dispatchEvent(new window.Event('scroll')); }); },
    async wheel(deltaY, extra = {}) {
      const event = new window.WheelEvent('wheel', { deltaY, bubbles: true, cancelable: true, ...extra });
      await act(async () => { window.dispatchEvent(event); });
      return event;
    },
    async key(key, target = document.body, extra = {}) {
      const event = new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...extra });
      await act(async () => { target.dispatchEvent(event); });
      return event;
    },
    async touch(type, points) {
      const event = new window.Event(type, { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'touches', { value: points.map(clientY => ({ clientY })) });
      await act(async () => { window.dispatchEvent(event); });
      return event;
    },
    async tick(count = 1, dt = 0.05, advanceMedia = true) {
      await act(async () => {
        for (let i = 0; i < count; i++) {
          h.now += dt * 1000;
          const video = f.video;
          if (advanceMedia && video && !video.paused) video.currentTime = Math.min(h.duration, video.currentTime + video.playbackRate * dt);
          for (const frame of [...h.frames]) frame(h.now / 1000, dt);
          await Promise.resolve();
        }
      });
    },
    async finish() {
      assert.ok(f.video && !f.video.paused, 'fixture expects active native forward playback');
      f.video.currentTime = h.duration;
      await f.tick(1, 0.05, false);
    },
  };
  try { await run(f); }
  finally { await act(async () => root.unmount()); assert.equal(h.locked, false, 'unmount must release the owned scroll lock'); assert.equal(h.frames.size, 0); container.remove(); }
}

test('a native scroll that jumps past the entire scene physically returns to its top', async () => fixture(async f => {
  await f.scroll(6000);
  assert.equal(f.h.y, 1000);
  assert.equal(f.h.locked, true);
  assert.equal(f.section.dataset.videoState, 'playing');
  assert.equal(f.video.currentTime, 0);
  assert.equal(f.video.playbackRate, 1);
  assert.equal(f.video.paused, false);
  await f.scroll(20000);
  assert.equal(f.h.y, 1000, 'pending native inertia cannot dislodge the trapped scene');
  await f.scroll(-500);
  assert.equal(f.h.y, 1000, 'native scroll cannot escape through the opposite side either');
}));

test('explicit top navigation pauses a partial visit and rearms repeated manual visits', async () => fixture({ duration: 76 }, async f => {
  for (let cycle = 0; cycle < 3; cycle++) {
    await f.wheel(6000);
    await f.tick(10);
    assert.equal(f.h.locked,true);
    await act(async () => navigateDirectlyToTop(() => { f.h.y=0; window.dispatchEvent(new window.Event('scroll')); }));
    assert.equal(f.h.locked,false);
    assert.equal(f.h.y,0);
    assert.equal(f.video.paused,true);
    assert.equal(isReturningToTop(),false);
    await f.scroll(0); // queued scroll event must not recapture
    assert.equal(f.h.locked,false);
  }
  await f.key('End');
  assert.equal(f.h.locked,true);
}));

test('top navigation from below never plays the video and clears state even if interrupted by an exception', async () => fixture({ y:6000 }, async f => {
  await act(async () => navigateDirectlyToTop(() => { f.h.y=0; }));
  await f.scroll(0);
  assert.equal(f.video.paused,true);
  assert.equal(f.h.locked,false);
  assert.throws(() => navigateDirectlyToTop(() => { throw Error('interrupted'); }), /interrupted/);
  assert.equal(isReturningToTop(),false);
  await f.wheel(6000);
  assert.equal(f.h.locked,true);
}));

test('restoring a position inside the scene captures a fresh visit', async () => fixture({ y:1016 }, async f => {
  assert.equal(f.h.locked,true);
  assert.equal(f.video.currentTime,0);
  assert.equal(f.video.paused,false);
}));

test('Ctrl+wheel zoom is never swallowed by the video', async () => fixture(async f => {
  assert.equal((await f.wheel(6000,{ctrlKey:true})).defaultPrevented,false);
  assert.equal(f.h.locked,false);
  await f.wheel(6000);
  assert.equal((await f.wheel(-120,{ctrlKey:true})).defaultPrevented,false);
}));

test('a huge wheel entry is cancelled, starts at 1× and only later gestures accelerate', async () => fixture({ duration: 76.1667 }, async f => {
  const entry = await f.wheel(6000);
  assert.equal(entry.defaultPrevented, true);
  assert.equal(f.h.y, 1000);
  await f.tick(3);
  assert.equal(f.video.playbackRate, 1, 'the gesture entering the scene must not become a speed impulse');
  const impulse = await f.wheel(240);
  assert.equal(impulse.defaultPrevented, true);
  await f.tick();
  assert.ok(f.video.playbackRate > 1 && f.video.playbackRate <= 1.71, 'acceleration is bounded per frame');
  await f.tick(100);
  assert.ok(Math.abs(f.video.playbackRate - 1) < 0.04, 'speed returns to approximately 1× after input stops');
}));

test('finishing releases only downwards; an immediate return rewinds and can replay again', async () => fixture(async f => {
  await f.wheel(6000);
  await f.finish();
  assert.equal(f.h.locked, false);
  assert.equal(f.h.y, 1034);
  assert.equal(f.section.dataset.videoState, 'finished');
  assert.equal(f.video.paused, true);
  assert.equal((await f.wheel(300)).defaultPrevented, false, 'completion must allow continuation down');
  const reverse = await f.wheel(-300);
  assert.equal(reverse.defaultPrevented, true);
  assert.equal(f.h.y, 1032);
  assert.equal(f.h.locked, true);
  assert.ok(Math.abs(f.video.currentTime - (f.h.duration - 1 / 24)) < 0.001);
  await f.tick(60);
  assert.equal(f.h.locked, false);
  assert.equal(f.h.y, 998);
  assert.equal(f.video.currentTime, 0);
  assert.equal(f.section.dataset.videoState, 'rewound');
  assert.equal((await f.wheel(-300)).defaultPrevented, false, 'rewinding must allow continuation up');
  assert.equal((await f.wheel(300)).defaultPrevented, true);
  assert.equal(f.h.y, 1000);
  assert.equal(f.video.currentTime, 0);
  assert.equal(f.video.playbackRate, 1);
  assert.equal(f.h.locked, true);
}));

test('a full exit rearms the scene for a fast reverse visit and a later forward visit', async () => fixture(async f => {
  await f.wheel(6000);
  await f.finish();
  await f.scroll(5000);
  await f.tick();
  await f.scroll(0);
  assert.equal(f.h.y, 1032);
  assert.equal(f.h.locked, true);
  await f.tick(60);
  await f.scroll(0);
  await f.tick();
  await f.scroll(5000);
  assert.equal(f.h.y, 1000);
  assert.equal(f.video.currentTime, 0);
  assert.equal(f.video.paused, false);
}));

test('End and Home intercept jumps across the scene in either direction', async () => {
  await fixture(async f => {
    assert.equal((await f.key('End')).defaultPrevented, true);
    assert.equal(f.h.y, 1000);
    assert.equal(f.h.locked, true);
  });
  await fixture({ y: 6000 }, async f => {
    assert.equal((await f.key('Home')).defaultPrevented, true);
    assert.equal(f.h.y, 1032);
    assert.equal(f.h.locked, true);
    assert.equal(f.video.paused, true, 'reverse playback uses the seek clock');
  });
});

test('typing in the contact form and activating buttons does not capture navigation keys', async () => fixture(async f => {
  for (const tag of ['input', 'textarea', 'select']) {
    const input = document.createElement(tag);
    document.body.append(input);
    for (const key of ['End', 'Home', 'ArrowDown', 'PageDown', ' ']) assert.equal((await f.key(key, input)).defaultPrevented, false, `${tag}: ${key}`);
    input.remove();
  }
  const editable = document.createElement('div');
  editable.setAttribute('contenteditable', 'true');
  document.body.append(editable);
  assert.equal((await f.key('End', editable)).defaultPrevented, false);
  editable.remove();
  const button = document.createElement('button');
  document.body.append(button);
  assert.equal((await f.key(' ', button)).defaultPrevented, false);
  button.remove();
  assert.equal((await f.key('End', document.body, { ctrlKey: true })).defaultPrevented, false);
  assert.equal(f.h.locked, false);
  assert.equal(f.h.y, 0);
}));

test('touch entry cannot jump over the scene and pinch gestures remain untouched', async () => fixture({ y: 900 }, async f => {
  await f.touch('touchstart', [1000, 1200]);
  assert.equal((await f.touch('touchmove', [0, 200])).defaultPrevented, false);
  assert.equal(f.h.locked, false);
  await f.touch('touchend', []);
  await f.touch('touchstart', [1000]);
  assert.equal((await f.touch('touchmove', [0])).defaultPrevented, true);
  assert.equal(f.h.locked, true);
  assert.equal(f.h.y, 1000);
  assert.equal(f.video.playbackRate, 1);
}));

test('entry before metadata retains the lock and starts playback when metadata arrives', async () => fixture({ ready: false }, async f => {
  await f.wheel(6000);
  assert.equal(f.h.locked, true);
  assert.equal(f.video.paused, true);
  await f.tick();
  assert.match(f.section.querySelector('[role=status]').textContent, /Cargando/);
  await act(async () => { f.h.ready = true; f.video.dispatchEvent(new window.Event('loadedmetadata')); });
  await f.tick(1, 0.05, false);
  assert.equal(f.video.paused, false);
  assert.equal(f.video.currentTime, 0);
  assert.equal(f.h.locked, true);
}));

test('a stalled load releases the page and offers a working retry', async () => fixture({ ready: false }, async f => {
  await f.wheel(6000);
  f.h.now += 16000;
  await f.tick(1, 0.05, false);
  assert.equal(f.h.locked, false);
  assert.equal(f.section.dataset.videoState, 'error');
  assert.equal(f.video, null);
  const retry = f.section.querySelector('button');
  assert.match(retry.textContent, /Reintentar/);
  f.h.ready = true;
  await act(async () => { retry.click(); });
  assert.ok(f.video);
  assert.equal(f.h.locked, true);
  assert.equal(f.video.paused, false);
  assert.equal(f.video.currentTime, 0);
}));

test('a media error releases the page immediately', async () => fixture(async f => {
  await f.wheel(6000);
  await act(async () => { f.video.dispatchEvent(new window.Event('error')); });
  assert.equal(f.h.locked, false);
  assert.equal(f.section.dataset.videoState, 'error');
  assert.equal(f.h.frames.size, 0);
}));

test('a background tab does not count as a stalled media load', async () => fixture({ ready: false }, async f => {
  await f.wheel(6000);
  f.h.hidden = true;
  f.h.now += 30000;
  await f.tick(1, 0.05, false);
  assert.equal(f.h.locked, true);
  assert.equal(f.section.dataset.videoState, 'playing');
  f.h.hidden = false;
  await f.tick(1, 0.05, false);
  assert.equal(f.h.locked, true);
}));

test('a layout resize moves the scroll anchor without resetting video progress', async () => fixture({ duration: 76.1667 }, async f => {
  await f.wheel(6000);
  await f.tick(20);
  const currentTime = f.video.currentTime;
  f.h.top = 1250;
  f.h.height = 600;
  await act(async () => { window.dispatchEvent(new window.Event('resize')); });
  assert.equal(f.h.y, 1250);
  assert.equal(f.h.locked, true);
  assert.equal(f.video.currentTime, currentTime);
  await f.scroll(6000);
  assert.equal(f.h.y, 1250);
}));

test('reduced-motion mode leaves scroll free until the visitor explicitly plays', async () => fixture({ device: { tier: 'low', reducedMotion: true, saveData: false } }, async f => {
  assert.equal(f.video, null);
  assert.equal(f.section.dataset.videoState, 'static');
  assert.equal((await f.wheel(6000)).defaultPrevented, false);
  assert.equal(f.h.locked, false);
  const play = f.section.querySelector('button');
  await act(async () => { play.click(); });
  assert.ok(f.video);
  assert.equal(f.h.locked, true);
  assert.equal(f.video.paused, false);
}));
