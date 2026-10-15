import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import vm from 'node:vm';

const project = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);
const bundle = await build({
  entryPoints: [path.join(project, 'src/components/TeamProfiles.tsx')],
  bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic',
  packages: 'external', loader: { '.css': 'empty' },
  alias: { '@': path.join(project, 'src') },
  plugins: [{ name: 'isolate-animation-from-dom-behaviour', setup(builder) {
    builder.onResolve({ filter: /^@\/lib\/scroll$/ }, () => ({ path: 'scroll', namespace: 'test-double' }));
    builder.onResolve({ filter: /^@gsap\/react$/ }, () => ({ path: 'hook', namespace: 'test-double' }));
    builder.onLoad({ filter: /.*/, namespace: 'test-double' }, ({ path: module }) => ({ contents: module === 'hook'
      ? 'export const useGSAP = () => {}'
      : 'export const lockScroll = (...args) => globalThis.teamLocks.push(globalThis.Array.from(args)); export const gsap = { fromTo(){globalThis.teamTweens++}, matchMedia(){return {add(query, callback){if(window.matchMedia(query).matches) callback()},revert(){globalThis.teamReverts++}}} };', loader: 'js' }));
  } }],
});
const sandbox = { module: { exports: {} }, require, console, globalThis };
for (const key of ['window', 'document', 'HTMLElement']) Object.defineProperty(sandbox, key, { get: () => globalThis[key] });
sandbox.exports = sandbox.module.exports;
vm.runInNewContext(bundle.outputFiles[0].text, sandbox);
const { TeamProfiles } = sandbox.module.exports;
let active;

function setup({ reduced = true, strict = false } = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://sykr4.test/' });
  const previous = new Map();
  for (const key of ['window', 'document', 'HTMLElement', 'HTMLDialogElement', 'IS_REACT_ACT_ENVIRONMENT']) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: key === 'IS_REACT_ACT_ENVIRONMENT' ? true : dom.window[key] });
  }
  window.matchMedia = (query) => ({ matches: query.includes('no-preference') ? !reduced : reduced });
  window.HTMLDialogElement.prototype.showModal = function () { this.open = true; this.querySelector('[autofocus], button')?.focus(); };
  window.HTMLDialogElement.prototype.close = function () { this.open = false; };
  globalThis.teamLocks = []; globalThis.teamTweens = 0; globalThis.teamReverts = 0;
  const root = createRoot(document.getElementById('root'));
  act(() => root.render(strict ? React.createElement(React.StrictMode, null, React.createElement(TeamProfiles)) : React.createElement(TeamProfiles)));
  active = { dom, root, previous };
  return { dom, root };
}
afterEach(() => {
  if (!active) return;
  const { root, dom, previous } = active;
  act(() => root.unmount());
  dom.window.close();
  for (const [key, descriptor] of previous) descriptor ? Object.defineProperty(globalThis, key, descriptor) : delete globalThis[key];
  delete globalThis.teamLocks; delete globalThis.teamTweens; delete globalThis.teamReverts;
  active = null;
});
const query = (selector) => document.querySelector(selector);
function open(id) {
  const button = query(`[data-member="${id}"] button`);
  button.focus();
  act(() => button.click());
  return button;
}

test('team cards omit hierarchy labels and expose one company contact for calls and WhatsApp', () => {
  setup();
  assert.equal(document.querySelectorAll('.team-card').length, 3);
  assert.doesNotMatch(query('.team-grid').textContent, /Cofundador|Director de negocio/i);
  assert.match(query('.team-contact-strip').textContent, /Contacta con el equipo SYKR4/);
  assert.doesNotMatch(query('.team-contact-strip').textContent, /Carlos|Javier|Enrique/);
  assert.equal(query('.team-contact-strip a').getAttribute('href'), 'tel:+34674097280');
  assert.equal(query('.team-contact-strip .team-whatsapp-link').href, 'https://wa.me/34674097280');
  assert.match(query('.team-contact-strip .team-whatsapp-link').rel, /noopener/);
  assert.match(query('.team-contact-strip .team-phone-link').getAttribute('aria-label'), /equipo SYKR4/);
  const instagram = query('.team-contact-strip .team-social-link');
  assert.equal(instagram.href, 'https://www.instagram.com/sykr4_tech/');
  assert.equal(instagram.target, '_blank');
  assert.match(instagram.rel, /noopener/);
});

test('each button opens its own complete profile and close returns focus to that button', () => {
  setup();
  for (const [id, name, experience] of [['javier', 'Javier Millán', '5 años'], ['enrique', 'Enrique Acón', '10 años'], ['carlos', 'Carlos', null]]) {
    const opener = open(id);
    const dialog = query('dialog');
    assert.equal(dialog.open, true);
    assert.equal(query('#team-profile-name').textContent, name);
    assert.equal(query('#team-profile-area').textContent, query(`[data-member="${id}"] .team-card-area`).textContent);
    assert.equal(dialog.querySelectorAll('.team-dialog-copy li').length, 3);
    if (experience) assert.match(dialog.textContent, new RegExp(experience));
    else assert.doesNotMatch(dialog.textContent, /años de experiencia/);
    assert.equal(dialog.querySelector('.team-phone-link').getAttribute('href'), 'tel:+34674097280');
    assert.match(dialog.querySelector('.team-phone-link').getAttribute('aria-label'), /equipo SYKR4/);
    assert.equal(dialog.querySelector('.team-whatsapp-link').href, 'https://wa.me/34674097280');
    assert.doesNotMatch(dialog.querySelector('.team-dialog-contact').textContent, /Carlos|Javier|Enrique/);
    assert.doesNotMatch(dialog.textContent, /cofundador|director de negocio/i);
    act(() => dialog.querySelector('.team-dialog-close').click());
    assert.equal(query('dialog'), null);
    assert.equal(document.activeElement, opener);
  }
  assert.deepEqual(globalThis.teamLocks, [[true, 'team-profile'], [false, 'team-profile'], [true, 'team-profile'], [false, 'team-profile'], [true, 'team-profile'], [false, 'team-profile']]);
});

test('the native cancellation event dismisses the profile and releases its own scroll lock', () => {
  const { dom } = setup();
  const opener = open('carlos');
  const cancel = new dom.window.Event('cancel', { cancelable: true });
  act(() => query('dialog').dispatchEvent(cancel));
  assert.equal(cancel.defaultPrevented, true);
  assert.equal(query('dialog'), null);
  assert.equal(document.activeElement, opener);
  assert.deepEqual(globalThis.teamLocks.at(-1), [false, 'team-profile']);
});

test('clicking inside preserves the profile; a pointer click on its backdrop closes it', () => {
  const { dom } = setup(); open('javier');
  act(() => query('.team-dialog-copy p').click());
  assert.ok(query('dialog'));
  const dialog = query('dialog');
  act(() => { dialog.dispatchEvent(new dom.window.Event('pointerdown', { bubbles: true })); dialog.click(); });
  assert.equal(query('dialog'), null);
});

test('a drag starting inside the panel does not count as clicking the backdrop', () => {
  const { dom } = setup(); open('enrique');
  act(() => { query('.team-dialog-copy').dispatchEvent(new dom.window.Event('pointerdown', { bubbles: true })); query('dialog').click(); });
  assert.ok(query('dialog'));
});

test('a missing portrait has a named fallback and the profile still works', () => {
  const { dom } = setup();
  act(() => query('[data-member="carlos"] img').dispatchEvent(new dom.window.Event('error')));
  assert.equal(query('[data-member="carlos"] img'), null);
  assert.match(query('[data-member="carlos"] [role="img"]').getAttribute('aria-label'), /Carlos/);
  open('carlos');
  assert.equal(query('#team-profile-name').textContent, 'Carlos');
});

test('reduced-motion profiles are readable without a tween and release resources on unmount', () => {
  const { root } = setup({ reduced: true }); open('carlos');
  assert.match(query('.team-dialog-copy').textContent, /marketing en redes sociales/);
  assert.equal(globalThis.teamTweens, 0);
  act(() => root.render(null));
  assert.equal(query('dialog'), null);
  assert.equal(globalThis.teamReverts, 1);
  assert.deepEqual(globalThis.teamLocks.at(-1), [false, 'team-profile']);
});

test('React StrictMode can remount and close a profile without retaining a lock or a second dialog', () => {
  setup({ strict: true, reduced: false });
  const opener = open('javier');
  assert.equal(document.querySelectorAll('dialog').length, 1);
  act(() => query('.team-dialog-close').click());
  assert.equal(document.activeElement, opener);
  assert.equal(query('dialog'), null);
  assert.equal(globalThis.teamLocks.filter(([locked]) => locked).length, globalThis.teamLocks.filter(([locked]) => !locked).length);
  assert.ok(globalThis.teamReverts >= 2);
});

test('the three bundled portrait files are WebP images with a bounded transfer size', async () => {
  for (const id of ['javier', 'enrique', 'carlos']) {
    const bytes = await readFile(path.join(project, `public/images/team/${id}.webp`));
    assert.equal(bytes.subarray(0, 4).toString(), 'RIFF');
    assert.equal(bytes.subarray(8, 12).toString(), 'WEBP');
    assert.ok(bytes.length < 100_000, `${id}: portrait exceeds the 100 kB budget`);
  }
});
