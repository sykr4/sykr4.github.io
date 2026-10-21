import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import * as contactRules from '../shared/contact.ts';
const root = fileURLToPath(new URL('../', import.meta.url));
const source = fs.readFileSync(root+'/src/sections/Contact.tsx','utf8');
const services = ['IA y automatización','AWS y control de costes','Seguridad y Microsoft 365','Desarrollo e integraciones','Web y tiendas online','No sé qué necesito todavía'];
const acceptedResponse = { ok: true, status: 202, json: async () => ({ ok: true, accepted: true, id: 'accepted-test' }) };
function setup({fields, env={}, response} = {}) {
  env = { VITE_CONTACT_MODE: 'download', ...env };
  const outputs = {states:[], updates:[], downloads:[], fetches:[], urls:[], timers:[], cleanups:[], focused:[]};
  const form = {fields:fields || {}, querySelector(selector) {return {focus(){outputs.focused.push(selector)}}}};
  let refCount = 0;
  const hooks = {
    useRef(value) {return {current:refCount++ === 0 ? form : value}},
    useState(value) {let index=outputs.states.length;outputs.states.push(value);return [value,next=>{const v=typeof next==='function'?next(outputs.states[index]):next;outputs.states[index]=v;outputs.updates.push([index,v])}]},
    useEffect(fn) {outputs.cleanups.push(fn())},
  };
  function TurnstileWidget() { return null; }
  const element = (type, props) => ({type, props});
  const modules={
    react:hooks,
    'react/jsx-runtime':{jsx:element,jsxs:element,Fragment:'fragment'},
    '@/lib/scroll':{gsap:{fromTo(){}}},
    '@/lib/loop':{addFrame(){return ()=>{}},pointer:{x:0,y:0}},
    '@/lib/device':{getDeviceProfile(){return {reducedMotion:true,touch:false}}},
    '@/data/content':{HELP_OPTIONS:services,SERVICES:services.map(title=>({title}))},
    '@/components/ui':{Magnetic:'magnetic',RollText:'roll',SectionLabel:'label'},
    '@/components/icons':{ArrowUpRight:'arrow',Check:'check'},
    '@/utils/cn':{cn:(...args)=>args.join(' ')},
    '@/components/Astronaut':{Astronaut:'astronaut'},
    '@/components/TurnstileWidget':{TurnstileWidget},
    '../../shared/contact': contactRules,
  };
  const document = {body:{appendChild(x){x.appended=true}},createElement(tag){assert.equal(tag,'a');return {click(){outputs.downloads.push({href:this.href,download:this.download,appended:this.appended})},remove(){this.removed=true}}}};
  const listeners = new Map();
  const window = {addEventListener(type, fn){listeners.set(type,fn)},removeEventListener(type, fn){if(listeners.get(type)===fn)listeners.delete(type)},dispatchEvent(event){listeners.get(event.type)?.(event)},location:{href:''},setTimeout(fn,ms){outputs.timers.push({fn,ms});return outputs.timers.length},clearTimeout(){}};
  const {code} = esbuild.transformSync(source,{loader:'tsx',format:'cjs',target:'es2020',jsx:'automatic',define:{'import.meta.env':JSON.stringify(env)}});
  const sandbox = {exports:{},module:{exports:{}},require:(id)=>{if(!(id in modules))throw Error('missing '+id);return modules[id]},FormData:class{constructor(form){this.values=form.fields}get(k){return this.values[k]??null}},Blob,AbortController,crypto,document,window,URL:{createObjectURL(blob){outputs.urls.push(blob);return 'blob:request-'+outputs.urls.length},revokeObjectURL(){}},fetch:async(url,init)=>{if(url.endsWith('/status'))return {ok:true,json:async()=>({available:true})};outputs.fetches.push({url,init});if(response instanceof Error)throw response;if(response?.hang)return new Promise((_resolve,reject)=>{const abort=()=>reject(Object.assign(new Error('aborted'),{name:'AbortError'}));if(init?.signal?.aborted)abort();else init?.signal?.addEventListener('abort',abort,{once:true});});return response},console};
  sandbox.exports = sandbox.module.exports;
  vm.runInNewContext(code,sandbox);
  const tree = sandbox.module.exports.Contact();
  function find(node,type){if(!node||typeof node!=='object')return null;if(node.type===type)return node;const children=node.props?.children;for(const c of [].concat(children||[])){const found=find(c,type);if(found)return found}return null}
  return {outputs,window,submit:()=>find(tree,'form').props.onSubmit({preventDefault(){}}),tree,form,TurnstileWidget};
}
const fields={nombre:'Enrique',email:'enrique@example.com',empresa:'SYKR4',mensaje:'Queremos automatizar las solicitudes y revisar nuestro cloud.'};

test('Contact rejects invalid fields and focuses the first error', async () => {
  const invalid=setup({fields:{nombre:' ',email:'broken',mensaje:'short'},env:{VITE_CONTACT_ENDPOINT:'/api/contact',VITE_TURNSTILE_SITE_KEY:'site-key-test'},response:acceptedResponse});
  widgetOf(invalid).props.onToken('unused-valid-token');
  await invalid.submit();
  assert.deepEqual(Object.keys(invalid.outputs.states[1]),['nombre','email','mensaje']);
  assert.equal(invalid.outputs.downloads.length,0);
  assert.equal(invalid.outputs.fetches.length,0);
  assert.equal(invalid.outputs.focused.length,1);
  assert.equal(invalid.outputs.states[6],0);
});

test('Contact without a destination downloads a named nonempty request and never claims delivery', async () => {
  const fallback=setup({fields});await fallback.submit();
  assert.equal(fallback.outputs.states[0],'prepared');
  assert.equal(fallback.outputs.downloads[0].download,'Consulta-SYKR4.txt');
  assert.equal(fallback.outputs.downloads[0].appended,true);
  assert.equal(fallback.outputs.fetches.length,0);
  const content=await fallback.outputs.urls[0].text();
  assert.ok(content.includes(fields.nombre));assert.ok(content.includes(fields.email));assert.ok(content.includes(fields.mensaje));assert.ok(content.length>100);
  assert.ok(!fallback.outputs.updates.some(([i,v])=>i===0&&v==='sent'));
});

test('Contact email mode encodes the request and asks the visitor to finish sending', async () => {
  const mail=setup({fields,env:{VITE_CONTACT_EMAIL:'equipo@example.com'}});await mail.submit();
  assert.match(mail.window.location.href,/^mailto:equipo@example\.com\?subject=/);
  assert.ok(decodeURIComponent(mail.window.location.href).includes(fields.mensaje));
  assert.equal(mail.outputs.states[0],'email');assert.equal(mail.outputs.downloads.length,0);
});

test('Contact confirms only an acknowledged POST and endpoint takes priority over email', async () => {
  const success=setup({fields,env:{VITE_CONTACT_ENDPOINT:'/api/contact',VITE_CONTACT_EMAIL:'equipo@example.com'},response:acceptedResponse});
  await success.submit();
  assert.equal(success.outputs.states[0],'sent');assert.equal(success.outputs.fetches[0].url,'/api/contact');
  assert.equal(JSON.parse(success.outputs.fetches[0].init.body).message,fields.mensaje);
  assert.equal(success.outputs.downloads.length,0);assert.equal(success.window.location.href,'');
});

const failures = [
  ['negative acknowledgement', {ok:true,json:async()=>({ok:false})}],
  ['HTTP failure', {ok:false,json:async()=>({ok:true})}],
  ['HTML response instead of JSON', {ok:true,json:async()=>{throw new SyntaxError('HTML')}}],
  ['network failure', new Error('Network unavailable')],
];
for (const [name,response] of failures) test(`Contact preserves the request after ${name}`, async () => {
  const failed=setup({fields,env:{VITE_CONTACT_ENDPOINT:'/api/contact'},response});await failed.submit();
  assert.equal(failed.outputs.states[0],'error');assert.equal(failed.form.fields.mensaje,fields.mensaje);assert.equal(failed.outputs.downloads.length,0);
});

test('Contact rejects email header injection in configuration', async () => {
  const invalid=setup({fields,env:{VITE_CONTACT_EMAIL:'bad@example.com\nBcc:hacker@example.com'}});await invalid.submit();
  assert.equal(invalid.outputs.states[0],'prepared');assert.equal(invalid.window.location.href,'');
});

test('Contact unmount aborts an in-flight request without reporting success afterwards', async () => {
  let release;
  let started;
  const readingResponse = new Promise(resolve => { started = resolve; });
  const response={ok:true,json:()=>new Promise(resolve=>{release=resolve;started();})};
  const pending=setup({fields,env:{VITE_CONTACT_ENDPOINT:'/api/contact'},response});
  const work=pending.submit();await readingResponse;
  pending.outputs.cleanups.forEach(cleanup=>cleanup?.());
  assert.equal(pending.outputs.fetches[0].init.signal.aborted,true);
  release({ok:true,id:'accepted-test'});await work;
  assert.ok(!pending.outputs.updates.some(([i,v])=>i===0&&v==='sent'));
});

test('Contact blocks concurrent submissions and keeps the same key for uncertain retries', async () => {
  let release;
  let started;
  const reading = new Promise(resolve => { started = resolve; });
  const fixture=setup({fields,env:{VITE_CONTACT_ENDPOINT:'/api/contact'},response:{ok:false,json:()=>new Promise(resolve=>{release=resolve;started();})}});
  const first=fixture.submit();await reading;
  await fixture.submit();
  assert.equal(fixture.outputs.fetches.length,1);
  release({ok:false});await first;
  const retry=fixture.submit();await new Promise(resolve=>setImmediate(resolve));
  release({ok:false});await retry;
  assert.equal(fixture.outputs.fetches.length,2);
  assert.equal(fixture.outputs.fetches[0].init.headers['Idempotency-Key'],fixture.outputs.fetches[1].init.headers['Idempotency-Key']);
});

test('Contact does not send identical accepted content twice', async () => {
  const f=setup({fields,env:{VITE_CONTACT_ENDPOINT:'/api/contact'},response:acceptedResponse});
  await f.submit();await f.submit();
  assert.equal(f.outputs.fetches.length,1);
});

// The contextual CTA must preserve the visitor's message and existing selection.
test('Contact carries a service choice into the form without duplicating or losing data', () => {
  const contact=setup({fields});
  contact.window.dispatchEvent({type:'sykr4:select-service',detail:services[0]});
  contact.window.dispatchEvent({type:'sykr4:select-service',detail:services[0]});
  contact.window.dispatchEvent({type:'sykr4:select-service',detail:services[4]});
  contact.window.dispatchEvent({type:'sykr4:select-service',detail:'Unknown service'});
  assert.deepEqual(Array.from(contact.outputs.states[2]),[services[0],services[4]]);
  assert.equal(contact.form.fields.mensaje,fields.mensaje);
  contact.outputs.cleanups.forEach(fn=>fn?.());
  contact.window.dispatchEvent({type:'sykr4:select-service',detail:services[1]});
  assert.equal(contact.outputs.states[2].length,2);
});

function widgetOf(contact) {
  function walk(node) {
    if (!node || typeof node !== 'object') return null;
    if (node.type === contact.TurnstileWidget) return node;
    for (const child of [].concat(node.props?.children || [])) {
      const found = walk(child);
      if (found) return found;
    }
    return null;
  }
  return walk(contact.tree);
}

test('Contact sends every selected service and requires a fresh token after provider 503 while keeping the same key', async () => {
  const endpoint = { VITE_CONTACT_ENDPOINT: '/api/contact', VITE_TURNSTILE_SITE_KEY: 'site-key-test' };
  const empty = setup({ fields: { ...fields, empresa: '' }, env: endpoint, response: acceptedResponse });
  empty.window.dispatchEvent({ type: 'sykr4:select-service', detail: services[0] });
  widgetOf(empty).props.onToken('token-vacio');
  await empty.submit();
  const emptyBody = JSON.parse(empty.outputs.fetches[0].init.body);
  assert.equal(emptyBody.company, '');
  assert.deepEqual(emptyBody.services, [services[0]]);
  assert.equal(emptyBody.turnstileToken, 'token-vacio');
  assert.equal(emptyBody.website, '');

  const all = setup({ fields, env: endpoint, response: { status: 503, ok: false, json: async () => ({ ok: false, code: 'provider_rate_limit' }) } });
  for (const service of services) all.window.dispatchEvent({ type: 'sykr4:select-service', detail: service });
  const widget = widgetOf(all);
  widget.props.onToken('token-a');
  await all.submit();
  assert.equal(all.outputs.states[6], 1);
  await all.submit();
  assert.equal(all.outputs.fetches.length, 1);
  widget.props.onToken('token-b');
  assert.equal(all.outputs.fetches.length, 1);
  await all.submit();
  const first = JSON.parse(all.outputs.fetches[0].init.body);
  const second = JSON.parse(all.outputs.fetches[1].init.body);
  assert.deepEqual(first.services, services);
  assert.equal(first.company, 'SYKR4');
  assert.equal(first.turnstileToken, 'token-a');
  assert.equal(second.turnstileToken, 'token-b');
  assert.equal(all.outputs.fetches[0].init.headers['Idempotency-Key'], all.outputs.fetches[1].init.headers['Idempotency-Key']);
  assert.equal(all.form.fields.mensaje, fields.mensaje);
  assert.equal(all.outputs.states[6], 2);
});

test('Contact requires a fresh token for new content after an accepted request', async () => {
  const env = { VITE_CONTACT_ENDPOINT: '/api/contact', VITE_TURNSTILE_SITE_KEY: 'site-key-test' };
  const f = setup({ fields: { ...fields }, env, response: acceptedResponse });
  const widget = widgetOf(f);
  widget.props.onToken('accepted-token-a');
  await f.submit();
  assert.equal(f.outputs.fetches.length, 1);
  assert.equal(f.outputs.states[6], 1);

  f.form.fields.mensaje = `${fields.mensaje} Nueva consulta.`;
  await f.submit();
  assert.equal(f.outputs.fetches.length, 1);
  widget.props.onToken('accepted-token-b');
  assert.equal(f.outputs.fetches.length, 1);
  await f.submit();
  assert.equal(f.outputs.fetches.length, 2);
  assert.notEqual(f.outputs.fetches[0].init.headers['Idempotency-Key'], f.outputs.fetches[1].init.headers['Idempotency-Key']);
  assert.equal(JSON.parse(f.outputs.fetches[1].init.body).turnstileToken, 'accepted-token-b');
});

test('Contact recovers a failed Turnstile load only after a user action and never submits automatically', async () => {
  const env = { VITE_CONTACT_ENDPOINT: '/api/contact', VITE_TURNSTILE_SITE_KEY: 'site-key-test' };
  const f = setup({ fields, env, response: acceptedResponse });
  const widget = widgetOf(f);
  widget.props.onError();
  assert.equal(f.outputs.states[0], 'error');
  assert.match(f.outputs.states[5], /No hemos podido cargar la comprobación/);
  assert.equal(f.outputs.fetches.length, 0);

  await f.submit();
  assert.equal(f.outputs.states[6], 1);
  assert.match(f.outputs.states[5], /Volvemos a cargar la comprobación/);
  assert.equal(f.outputs.fetches.length, 0);
  assert.equal(f.form.fields.mensaje, fields.mensaje);

  widget.props.onToken('recovered-token');
  assert.equal(f.outputs.fetches.length, 0);
  await f.submit();
  assert.equal(f.outputs.fetches.length, 1);
  assert.equal(JSON.parse(f.outputs.fetches[0].init.body).turnstileToken, 'recovered-token');
});

test('Contact does not fetch without a Turnstile token and does not treat partial acknowledgements as success', async () => {
  const env = { VITE_CONTACT_ENDPOINT: '/api/contact', VITE_TURNSTILE_SITE_KEY: 'site-key-test' };
  const missing = setup({ fields, env, response: acceptedResponse });
  await missing.submit();
  assert.equal(missing.outputs.fetches.length, 0);
  assert.equal(missing.outputs.states[0], 'error');
  assert.equal(missing.form.fields.mensaje, fields.mensaje);

  const partial = setup({ fields, env, response: { ok: true, status: 200, json: async () => ({ ok: true, id: 'accepted-test' }) } });
  widgetOf(partial).props.onToken('token-parcial');
  await partial.submit();
  assert.equal(partial.outputs.states[0], 'error');
  assert.equal(partial.outputs.fetches.length, 1);
});

for (const [name, response, expectation] of [
  ['captcha', { status: 403, ok: false, json: async () => ({ ok: false, code: 'captcha' }) }, 'captcha'],
  ['iam', { status: 403, ok: false, json: async () => ({ message: 'Forbidden' }) }, 'iam'],
  ['validation', { status: 422, ok: false, json: async () => ({ ok: false, code: 'validation', errors: { mensaje: 'Revisa el mensaje.' } }) }, 'validation'],
  ['rate limit', { status: 429, ok: false, headers: { get: (header) => header === 'Retry-After' ? '12' : null }, json: async () => ({ ok: false, code: 'rate_limit' }) }, 'wait'],
  ['provider', { status: 502, ok: false, json: async () => ({ ok: false, code: 'provider' }) }, 'unavailable'],
  ['unavailable', { status: 503, ok: false, json: async () => ({ ok: false, code: 'provider_rate_limit' }) }, 'unavailable'],
  ['delivery unknown', { status: 502, ok: false, json: async () => ({ ok: false, code: 'delivery_unknown' }) }, 'uncertain'],
]) test(`Contact preserves the form after ${name}`, async () => {
  const env = { VITE_CONTACT_ENDPOINT: '/api/contact', VITE_TURNSTILE_SITE_KEY: 'site-key-test' };
  const f = setup({ fields, env, response });
  widgetOf(f).props.onToken('token-error');
  await f.submit();
  assert.equal(f.outputs.states[0], 'error');
  assert.equal(f.outputs.fetches.length, 1);
  assert.equal(f.form.fields.mensaje, fields.mensaje);
  const message = f.outputs.states[5];
  assert.equal(f.outputs.states[6], 1);
  if (expectation === 'validation') assert.equal(f.outputs.states[1].mensaje, 'Revisa el mensaje.');
  await f.submit();
  assert.equal(f.outputs.fetches.length, 1);
  if (expectation === 'captcha') {
    assert.match(message, /comprobación de seguridad/);
  }
  if (expectation === 'iam') assert.match(message, /no se ha enviado/i);
  if (expectation === 'wait') assert.match(message, /12 segundos/);
  if (expectation === 'unavailable') assert.match(message, /no está disponible/);
  if (expectation === 'uncertain') assert.match(message, /No podemos confirmar si la consulta se ha enviado/);
});

test('Contact timeout does not claim the request was refused or send it again', async () => {
  const f = setup({ fields, env: { VITE_CONTACT_ENDPOINT: '/api/contact', VITE_TURNSTILE_SITE_KEY: 'site-key-test' }, response: { hang: true } });
  widgetOf(f).props.onToken('timeout-token');
  const work = f.submit();
  await new Promise((resolve) => setImmediate(resolve));
  const timer = f.outputs.timers.find((item) => item.ms === 25000);
  assert.ok(timer);
  timer.fn();
  await work;
  assert.equal(f.outputs.states[0], 'error');
  assert.match(f.outputs.states[5], /No podemos confirmar si la consulta se ha enviado/);
  assert.equal(f.outputs.fetches.length, 1);
  assert.equal(f.form.fields.mensaje, fields.mensaje);
  assert.equal(f.outputs.states[6], 1);
  await f.submit();
  assert.equal(f.outputs.fetches.length, 1);
});

test('Contact invalidates a token after a network result is uncertain and preserves the retry key', async () => {
  const env = { VITE_CONTACT_ENDPOINT: '/api/contact', VITE_TURNSTILE_SITE_KEY: 'site-key-test' };
  const f = setup({ fields, env, response: new TypeError('Network unavailable') });
  const widget = widgetOf(f);
  widget.props.onToken('network-token-a');
  await f.submit();
  assert.equal(f.outputs.states[6], 1);
  await f.submit();
  assert.equal(f.outputs.fetches.length, 1);
  widget.props.onToken('network-token-b');
  assert.equal(f.outputs.fetches.length, 1);
  await f.submit();
  assert.equal(f.outputs.fetches.length, 2);
  assert.equal(JSON.parse(f.outputs.fetches[0].init.body).turnstileToken, 'network-token-a');
  assert.equal(JSON.parse(f.outputs.fetches[1].init.body).turnstileToken, 'network-token-b');
  assert.equal(f.outputs.fetches[0].init.headers['Idempotency-Key'], f.outputs.fetches[1].init.headers['Idempotency-Key']);
});

function createTurnstileHarness() {
  const source = fs.readFileSync(root + 'src/components/TurnstileWidget.tsx', 'utf8');
  assert.equal(source.includes('fetch('), false);
  const { code } = esbuild.transformSync(source, { loader: 'tsx', format: 'cjs', target: 'es2020', jsx: 'automatic' });
  const scripts = [];
  const createdScripts = [];
  const timers = new Map();
  const tokens = [];
  const loadErrors = [];
  const removed = [];
  const rendered = [];
  let timerId = 0;
  const window = {
    setTimeout(fn, ms) { const id = ++timerId; timers.set(id, { fn, ms }); return id; },
    clearTimeout(id) { timers.delete(id); },
  };
  const createScript = () => {
    const listeners = new Map();
    const script = {
      src: '',
      async: false,
      defer: false,
      dataset: {},
      addEventListener(type, fn) {
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type).add(fn);
      },
      removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
      dispatch(type) { for (const fn of [...(listeners.get(type) || [])]) fn(); },
      listenerCount(type) { return listeners.get(type)?.size || 0; },
      remove() {
        const index = scripts.indexOf(script);
        if (index >= 0) scripts.splice(index, 1);
      },
    };
    createdScripts.push(script);
    return script;
  };
  const document = {
    head: { appendChild(script) { if (!scripts.includes(script)) scripts.push(script); } },
    querySelector(selector) { return scripts.find((script) => selector.includes(script.src)) ?? null; },
    createElement(tag) { assert.equal(tag, 'script'); return createScript(); },
  };
  const element = (type, props) => ({ type, props });
  const refs = [];
  let refCursor = 0;
  let effect = null;
  const hooks = {
    useRef(value) { const index = refCursor++; if (!refs[index]) refs[index] = { current: value }; return refs[index]; },
    useEffect(fn) { effect = fn; },
  };
  const sandbox = {
    exports: {},
    module: { exports: {} },
    require: (id) => id === 'react' ? hooks : { jsx: element, jsxs: element },
    document,
    window,
    console,
  };
  sandbox.exports = sandbox.module.exports;
  vm.runInNewContext(code, sandbox);
  const turnstile = {
    render(_element, options) { rendered.push(options); return 'widget-' + rendered.length; },
    remove(id) { removed.push(id); },
  };
  const mount = (resetKey = 0) => {
    refCursor = 0;
    refs.length = 0;
    effect = null;
    const tree = sandbox.module.exports.TurnstileWidget({
      siteKey: 'site-key-test',
      resetKey,
      onToken: (token) => tokens.push(token),
      onError: () => loadErrors.push('load-error'),
    });
    tree.props.ref.current = { isConnected: true };
    return { cleanup: effect() };
  };
  return { api: sandbox.module.exports, document, window, scripts, createdScripts, timers, tokens, loadErrors, removed, rendered, turnstile, mount };
}

test('Turnstile keeps one pending or loaded script and cleans its handlers', async () => {
  const h = createTurnstileHarness();
  const firstLoad = h.api.loadTurnstileScript(h.document);
  const sameLoad = h.api.loadTurnstileScript(h.document);
  assert.equal(firstLoad, sameLoad);
  assert.equal(h.scripts.length, 1);
  assert.equal(h.createdScripts.length, 1);
  assert.equal(h.scripts[0].listenerCount('load'), 1);
  assert.equal(h.scripts[0].listenerCount('error'), 1);
  assert.equal([...h.timers.values()][0].ms, 10000);
  h.window.turnstile = h.turnstile;
  h.scripts[0].dispatch('load');
  await firstLoad;
  assert.equal(h.scripts[0].listenerCount('load'), 0);
  assert.equal(h.scripts[0].listenerCount('error'), 0);
  assert.equal(h.timers.size, 0);
  await h.api.loadTurnstileScript(h.document);
  assert.equal(h.createdScripts.length, 1);

  const first = h.mount(0);
  await Promise.resolve();
  assert.equal(h.rendered[0].action, 'contact');
  assert.equal(h.rendered[0].appearance, 'interaction-only');
  assert.equal(h.rendered[0].language, 'es');
  h.rendered[0].callback('token-vivo');
  h.rendered[0]['expired-callback']();
  h.rendered[0]['error-callback']();
  assert.deepEqual(h.tokens, ['token-vivo', '', '']);
  first.cleanup();
  assert.deepEqual(h.removed, ['widget-1']);
  assert.equal(h.tokens.at(-1), '');
  h.mount(1);
  await Promise.resolve();
  assert.equal(h.createdScripts.length, 1);
  assert.equal(h.rendered.length, 2);
});

test('Turnstile removes a failed script and a deliberate second load can recover', async () => {
  const h = createTurnstileHarness();
  const firstLoad = h.api.loadTurnstileScript(h.document);
  const failedScript = h.scripts[0];
  const rejected = assert.rejects(firstLoad, /turnstile_unavailable/);
  failedScript.dispatch('error');
  await rejected;
  assert.equal(h.scripts.length, 0);
  assert.equal(failedScript.listenerCount('load'), 0);
  assert.equal(failedScript.listenerCount('error'), 0);
  assert.equal(h.timers.size, 0);

  const secondLoad = h.api.loadTurnstileScript(h.document);
  assert.equal(h.scripts.length, 1);
  assert.equal(h.createdScripts.length, 2);
  assert.notEqual(h.scripts[0], failedScript);
  h.window.turnstile = h.turnstile;
  h.scripts[0].dispatch('load');
  await secondLoad;
  assert.equal(h.scripts.length, 1);
  assert.equal(h.scripts[0].listenerCount('load'), 0);
  assert.equal(h.scripts[0].listenerCount('error'), 0);
});

test('Turnstile load timeout is bounded, reported, and leaves a clean retry', async () => {
  const h = createTurnstileHarness();
  const mounted = h.mount();
  const timedOutScript = h.scripts[0];
  const timer = [...h.timers.values()].find((item) => item.ms === 10000);
  assert.ok(timer);
  timer.fn();
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(h.loadErrors.length, 1);
  assert.deepEqual(h.tokens, ['']);
  assert.equal(h.scripts.length, 0);
  assert.equal(timedOutScript.listenerCount('load'), 0);
  assert.equal(timedOutScript.listenerCount('error'), 0);
  assert.equal(h.timers.size, 0);

  const retry = h.api.loadTurnstileScript(h.document);
  assert.equal(h.createdScripts.length, 2);
  h.window.turnstile = h.turnstile;
  h.scripts[0].dispatch('load');
  await retry;
  assert.equal(h.scripts.length, 1);
  mounted.cleanup();
});

test('production files do not hardcode the endpoint or restore download mode', () => {
  const production = fs.readFileSync(root + '.env.production', 'utf8');
  const workflow = fs.readFileSync(root + '.github/workflows/deploy-pages.yml', 'utf8');
  const contact = fs.readFileSync(root + 'src/sections/Contact.tsx', 'utf8');
  const widget = fs.readFileSync(root + 'src/components/TurnstileWidget.tsx', 'utf8');
  assert.equal(production.split('\n').some((line) => !line.trim().startsWith('#') && line.includes('VITE_CONTACT_MODE')), false);
  assert.equal(production.includes('w80imhinme'), false);
  assert.equal(contact.includes('w80imhinme'), false);
  assert.equal(widget.includes('w80imhinme'), false);
  assert.match(workflow, /vars\.VITE_CONTACT_ENDPOINT/);
  assert.match(workflow, /vars\.VITE_TURNSTILE_SITE_KEY/);
  assert.equal(workflow.includes('w80imhinme'), false);
  assert.match(fs.readFileSync(root + 'vite.config.ts', 'utf8'), /command === "build" && mode === "production"/);
});
