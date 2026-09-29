import { cp, mkdtemp, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root=resolve(import.meta.dirname,'..');
const stage=await mkdtemp(join(tmpdir(),'sykr4-v13-package-'));
const destination=join(stage,'SYKR4_WEB_v13');await mkdir(destination);
// Explicit allowlist: no .env.local, node_modules, caches, browser binaries or credentials.
const names=['src','shared','server','public','tests','scripts','docs','package.json','package-lock.json','tsconfig.json','vite.config.ts','playwright.config.ts','index.html','.env.example','.gitignore','README_ENTREGA.md','INICIAR_LOCAL.sh','CONTACTO_ASTRONAUTA.md','AUDITORIA_CAMBIOS.md'];
for(const name of names)await cp(join(root,name),join(destination,name),{recursive:true,filter:path=>!path.includes('/page@')&&!path.endsWith('-failure.jpg')});
const manifest=[];
async function walk(path){for(const entry of await readdir(path,{withFileTypes:true})){const file=join(path,entry.name);if(entry.isDirectory())await walk(file);else manifest.push({path:file.slice(destination.length+1),bytes:(await readFile(file)).length,sha256:createHash('sha256').update(await readFile(file)).digest('hex')});}}
await walk(destination);
if(manifest.some(f=>f.path.includes('node_modules')||/\/(\.env|\.env\.local)$/.test('/'+f.path)))throw Error('Forbidden package entry');
await writeFile(join(destination,'MANIFEST_V13.json'),JSON.stringify(manifest,null,2));
const temporaryArchive=join(stage,'SYKR4_WEB_v13.zip');
const zipped=spawnSync('zip',['-qr',temporaryArchive,'SYKR4_WEB_v13'],{cwd:stage,encoding:'utf8'});
if(zipped.status!==0)throw Error(zipped.stderr);
const archive=join(root,'SYKR4_WEB_v13.zip');
await cp(temporaryArchive,archive);
console.log(JSON.stringify({archive,files:manifest.length,bytes:(await readFile(archive)).length,sha256:createHash('sha256').update(await readFile(archive)).digest('hex'),stage},null,2));
