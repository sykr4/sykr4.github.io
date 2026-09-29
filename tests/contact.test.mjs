import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
import * as contactRules from '../shared/contact.ts';
const root = fileURLToPath(new URL('../', import.meta.url));
const source = fs.readFileSync(root+'/src/sections/Contact.tsx','utf8');
const services = ['IA y automatización','AWS, cloud y costes','Seguridad y Microsoft 365','Desarrollo e integraciones','Web y ecommerce'];
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
    '../../shared/contact': contactRules,
  };
  const document = {body:{appendChild(x){x.appended=true}},createElement(tag){assert.equal(tag,'a');return {click(){outputs.downloads.push({href:this.href,download:this.download,appended:this.appended})},remove(){this.removed=true}}}};
  const listeners = new Map();
  const window = {addEventListener(type, fn){listeners.set(type,fn)},removeEventListener(type, fn){if(listeners.get(type)===fn)listeners.delete(type)},dispatchEvent(event){listeners.get(event.type)?.(event)},location:{href:''},setTimeout(fn,ms){outputs.timers.push({fn,ms});return outputs.timers.length},clearTimeout(){}};
  const {code} = esbuild.transformSync(source,{loader:'tsx',format:'cjs',target:'es2020',jsx:'automatic',define:{'import.meta.env':JSON.stringify(env)}});
  const sandbox = {exports:{},module:{exports:{}},require:(id)=>{if(!(id in modules))throw Error('missing '+id);return modules[id]},FormData:class{constructor(form){this.values=form.fields}get(k){return this.values[k]??null}},Blob,AbortController,crypto,document,window,URL:{createObjectURL(blob){outputs.urls.push(blob);return 'blob:request-'+outputs.urls.length},revokeObjectURL(){}},fetch:async(url,init)=>{if(url.endsWith('/status'))return {ok:true,json:async()=>({available:true})};outputs.fetches.push({url,init});if(response instanceof Error)throw response;return response},console};
  sandbox.exports = sandbox.module.exports;
  vm.runInNewContext(code,sandbox);
  const tree = sandbox.module.exports.Contact();
  function find(node,type){if(!node||typeof node!=='object')return null;if(node.type===type)return node;const children=node.props?.children;for(const c of [].concat(children||[])){const found=find(c,type);if(found)return found}return null}
  return {outputs,window,submit:()=>find(tree,'form').props.onSubmit({preventDefault(){}}),tree,form};
}
const fields={nombre:'Enrique',email:'enrique@example.com',empresa:'SYKR4',mensaje:'Queremos automatizar las solicitudes y revisar nuestro cloud.'};

test('Contact rejects invalid fields and focuses the first error', async () => {
  const invalid=setup({fields:{nombre:' ',email:'broken',mensaje:'short'}});
  await invalid.submit();
  assert.deepEqual(Object.keys(invalid.outputs.states[1]),['nombre','email','mensaje']);
  assert.equal(invalid.outputs.downloads.length,0);
  assert.equal(invalid.outputs.fetches.length,0);
  assert.equal(invalid.outputs.focused.length,1);
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
  const success=setup({fields,env:{VITE_CONTACT_ENDPOINT:'/api/contact',VITE_CONTACT_EMAIL:'equipo@example.com'},response:{ok:true,json:async()=>({ok:true,id:'accepted-test'})}});
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
  const f=setup({fields,env:{VITE_CONTACT_ENDPOINT:'/api/contact'},response:{ok:true,json:async()=>({ok:true,id:'accepted-test'})}});
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
