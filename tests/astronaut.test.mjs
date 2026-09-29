import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import vm from 'node:vm';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';
const root=fileURLToPath(new URL('../',import.meta.url));
test('Original astronaut runtime: focus, visibility, reduced motion, no-WebGL fallback and disposal', async () => {
const observers=[];const resizeObservers=[];
class Element extends EventTarget {
 constructor(tag='div'){super();this.tagName=tag.toUpperCase();this.children=[];this.attributes={};this.style={};this.clientWidth=500;this.clientHeight=480;this.classSet=new Set();this.classList={add:(x)=>this.classSet.add(x),remove:(x)=>this.classSet.delete(x),contains:(x)=>this.classSet.has(x)};this.hidden=false}
 append(...xs){for(const x of xs){x.parentElement=this;this.children.push(x)}}
 appendChild(x){this.append(x);return x}
 remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(x=>x!==this);this.parentElement=null}
 contains(x){return this===x||this.children.some(c=>c.contains(x))}
 closest(selector){if(selector==='section')return this.tagName==='SECTION'?this:this.parentElement?.closest(selector)||null;if(selector.includes('input'))return ['INPUT','TEXTAREA','SELECT'].includes(this.tagName)?this:null;return null}
 setAttribute(k,v){this.attributes[k]=String(v)}
 getContext(){return null}
 getBoundingClientRect(){return {left:0,top:0,width:this.clientWidth,height:this.clientHeight}}
}
globalThis.HTMLElement=Element;
globalThis.window=globalThis;
globalThis.self=globalThis;
globalThis.devicePixelRatio=1;
globalThis.requestAnimationFrame=()=>1;
globalThis.cancelAnimationFrame=()=>{};
const media=new EventTarget();media.matches=false;globalThis.matchMedia=()=>media;
globalThis.ResizeObserver=class{constructor(cb){this.cb=cb;resizeObservers.push(this)}observe(el){this.element=el}disconnect(){this.disconnected=true}};
globalThis.IntersectionObserver=class{constructor(cb,opts){this.cb=cb;this.opts=opts;observers.push(this)}observe(el){this.element=el}disconnect(){this.disconnected=true}trigger(ratio=1){this.cb([{isIntersecting:ratio>0,intersectionRatio:ratio}])}};
const document=new EventTarget();document.hidden=false;document.baseURI='https://example.test/sykr4/';document.activeElement=null;document.createElement=(tag)=>new Element(tag);document.createElementNS=(_,tag)=>new Element(tag);globalThis.document=document;
const {createAstronaut,astronautConfig}=await import(new URL('../public/astronaut/runtime.mjs',import.meta.url));
const section=new Element('section');const host=new Element();section.append(host);
let errors=0;
const originalError=console.error;console.error=()=>{};
const controller=createAstronaut(host,{...astronautConfig,modelUrl:'https://example.test/sykr4/astronaut/sykr4-astronaut-v4.glb',fallbackUrl:'https://example.test/sykr4/astronaut/sykr4-astronaut-preview.png',pointerScope:section,quietScope:section,onError(){errors++}});
assert.equal(host.children.length,3);assert.equal(observers.length,2);
observers[1].trigger(1);assert.equal(controller.getDiagnostics().paused,false);
const input=new Element('input');section.append(input);document.activeElement=input;document.dispatchEvent(new Event('focusin'));assert.equal(controller.getDiagnostics().paused,true);
const textarea=new Element('textarea');section.append(textarea);document.activeElement=textarea;document.dispatchEvent(new Event('focusout'));await Promise.resolve();assert.equal(controller.getDiagnostics().paused,true);
document.activeElement=null;document.dispatchEvent(new Event('focusout'));await Promise.resolve();assert.equal(controller.getDiagnostics().paused,false);
controller.setPaused(true);assert.equal(controller.getDiagnostics().paused,true);controller.setPaused(false);assert.equal(controller.getDiagnostics().paused,false);
document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));assert.equal(controller.getDiagnostics().paused,true);document.hidden=false;document.dispatchEvent(new Event('visibilitychange'));
media.matches=true;const change=new Event('change');Object.defineProperty(change,'matches',{value:true});media.dispatchEvent(change);assert.equal(controller.getDiagnostics().reducedMotion,true);
const result=await controller.load();assert.equal(result,null);assert.equal(errors,1);assert.equal(controller.getDiagnostics().failed,true);assert.equal(host.children[0].children[0].hidden,false);assert.equal(host.children[1].hidden,true);
controller.dispose();controller.dispose();assert.equal(host.children.length,0);assert.equal(host.classList.contains('sykr4-astronaut'),false);assert.equal(controller.getDiagnostics().disposed,true);assert.ok(observers.every(x=>x.disconnected));assert.ok(resizeObservers.every(x=>x.disconnected));
console.error=originalError;
});

test('Astronaut component resolves assets against actual Vite base configuration', () => {
  const source = fs.readFileSync(root+'/src/components/Astronaut.tsx','utf8');
  const element = (type,props)=>({type,props});
  const hooks={useEffect(){},useRef(){return {current:null}},useState(value){return [value,()=>{}]}};
  const modules={react:hooks,'react/jsx-runtime':{jsx:element,jsxs:element},'./astronaut.css':{}};
  function find(node,type){if(!node||typeof node!=='object')return null;if(node.type===type)return node;for(const c of [].concat(node.props?.children||[])){const result=find(c,type);if(result)return result}return null}
  for (const [base,page,want] of [
    ['./','https://example.test/sykr4/index.html','https://example.test/sykr4/astronaut/sykr4-astronaut-preview.png'],
    ['/','https://example.test/page','https://example.test/astronaut/sykr4-astronaut-preview.png'],
    ['/sykr4/','https://example.test/page','https://example.test/sykr4/astronaut/sykr4-astronaut-preview.png'],
  ]) {
    const {code}=esbuild.transformSync(source,{loader:'tsx',format:'cjs',target:'es2020',jsx:'automatic',define:{'import.meta.env.BASE_URL':JSON.stringify(base)}});
    const sandbox={exports:{},module:{exports:{}},require:(id)=>modules[id],document:{baseURI:page},URL};sandbox.exports=sandbox.module.exports;
    vm.runInNewContext(code,sandbox);
    const tree=sandbox.module.exports.Astronaut({cue:null});
    assert.equal(find(tree,'img').props.src,want);
  }
});

test('Included GLB retains authoritative bytes, embedded resources and all four V4 animation clips', () => {
  const glb=fs.readFileSync(root+'/public/astronaut/sykr4-astronaut-v4.glb');
  assert.equal(crypto.createHash('sha256').update(glb).digest('hex'),'1881085722f3d462d6ba6ead6698dd6bfb447a61f21b42789df555818dea8083');
  assert.equal(glb.readUInt32LE(8),glb.length);
  const documentLength=glb.readUInt32LE(12);
  const gltf=JSON.parse(glb.subarray(20,20+documentLength).toString());
  const animations=gltf.animations.map(a=>a.name);
  for(const clip of ['Idle','Wave_One_Hand','Wrist_Check','Military_Salute'])assert.ok(animations.includes(clip));
  assert.ok(gltf.buffers.every(buffer=>!buffer.uri));
  assert.ok(gltf.images.every(image=>!image.uri));
});
