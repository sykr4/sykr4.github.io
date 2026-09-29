import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { createContactHandler, contactConfig } from "../server/contact.ts";

const body = { name: "Persona de prueba", email: "prueba@example.com", company: "Compañía", message: "Una consulta de prueba que nunca se envía a un proveedor real.", services: ["IA y automatización"], website: "" };
async function fixture(run: (ctx: { post: (data?: unknown, options?: RequestInit) => Promise<Response>; url: string; sent: { url: string; init?: RequestInit }[] }) => Promise<void>, provider: typeof fetch = async () => Response.json({ id: "provider-test-id" }), configured = true) {
  const sent: { url: string; init?: RequestInit }[] = [];
  const handler = createContactHandler(contactConfig(configured ? { PUBLIC_ORIGIN: "https://sykr4.example", RESEND_API_KEY: "test-only", CONTACT_FROM: "website@example.com", CONTACT_TO: "team@example.com" } : {}), async (url, init) => { sent.push({url:String(url),init}); return provider(url,init); });
  const server = createServer((req,res) => { void handler(req,res); });
  await new Promise<void>(resolve => server.listen(0,"127.0.0.1",resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const url = `http://127.0.0.1:${address.port}/api/contact`;
  try {
    await run({ url, sent, post: (data=body, options={}) => fetch(url,{method:"POST",body:JSON.stringify(data),...options,headers:{"Content-Type":"application/json",Origin:"https://sykr4.example","Idempotency-Key":randomUUID(),...options.headers}}) });
  } finally { server.closeAllConnections(); await new Promise<void>(resolve=>server.close(()=>resolve())); }
}

test("server only accepts success after provider acknowledgement and formats the real request", () => fixture(async ({post,sent}) => {
  const response=await post();assert.equal(response.status,202);assert.equal((await response.json()).ok,true);
  assert.equal(sent.length,1);assert.equal(sent[0].url,"https://api.resend.com/emails");
  const payload=JSON.parse(String(sent[0].init?.body));
  assert.deepEqual(payload.to,["team@example.com"]);assert.equal(payload.reply_to,body.email);assert.match(payload.text,/Compañía/);
  assert.ok(sent[0].init?.signal);
}));
test("unconfigured server reports 503 honestly and never calls a provider", () => fixture(async ({post,url,sent}) => {
  assert.equal((await post()).status,503);assert.equal((await (await fetch(url+"/status")).json()).available,false);assert.equal(sent.length,0);
},undefined,false));
test("server rejects malformed fields, long data, unknown services and honeypot submissions", () => fixture(async ({post,sent}) => {
  for (const data of [{...body,email:"bad\r\nBcc:x@y.com"},{...body,name:"x".repeat(121)},{...body,message:"short"},{...body,services:["invented"]},{...body,website:"spam"}]) assert.equal((await post(data)).status,422);
  assert.equal(sent.length,0);
}));
test("server enforces origin, JSON and payload size", () => fixture(async ({post,sent}) => {
  assert.equal((await post(body,{headers:{Origin:"https://evil.example"}})).status,403);
  assert.equal((await post(body,{headers:{"Content-Type":"text/plain"}})).status,415);
  assert.equal((await post({...body,message:"x".repeat(34000)})).status,413);
  assert.equal((await post(body,{body:"{"})).status,400);
  assert.equal(sent.length,0);
}));
test("concurrent duplicates and retries send once; changed payload cannot reuse an id", () => fixture(async ({post,sent}) => {
  const headers={"Idempotency-Key":randomUUID()};
  const responses=await Promise.all([post(body,{headers}),post(body,{headers})]);
  assert.deepEqual(responses.map(r=>r.status),[202,202]);
  assert.equal((await post(body,{headers})).status,202);assert.equal(sent.length,1);
  assert.equal((await post({...body,message:"A different long message"},{headers})).status,409);
},async()=>{await new Promise(resolve=>setTimeout(resolve,30));return Response.json({id:"dedup-test"});}));
test("basic rate limiting stops repeated attempts", () => fixture(async ({post,sent}) => {
  for(let n=0;n<5;n++) assert.equal((await post()).status,202);
  const limited=await post();assert.equal(limited.status,429);assert.ok(limited.headers.get("retry-after"));assert.equal(sent.length,5);
}));
test("the existing orientation option is accepted alongside the five service areas",()=>fixture(async({post})=>{
  assert.equal((await post({...body,services:[...body.services,"Quiero orientación"]})).status,202);
}));
for(const [label,provider] of [
  ["negative response",async()=>Response.json({message:"no"},{status:403})],
  ["missing id",async()=>Response.json({ok:true})],
  ["network error",async()=>{throw Error("offline");}],
] as [string,typeof fetch][]) test(`provider ${label} never produces success`,()=>fixture(async({post})=>{
  const response=await post();assert.equal(response.status,502);assert.equal((await response.json()).ok,false);
},provider));
