import assert from 'node:assert/strict';
import { test } from 'node:test';
import { access, readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function sourceFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await sourceFiles(full));
    else if (/\.(?:ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

test('every local media path referenced by the source exists in public/', async () => {
  const refs = new Set();
  for (const file of await sourceFiles(path.join(root, 'src'))) {
    const text = await readFile(file, 'utf8');
    for (const match of text.matchAll(/["'](\/?images\/[^"']+|\/SYKR4_6_Planetas_WEB_720p\.mp4)["']/g)) refs.add('/' + match[1].replace(/^\//, ''));
    for (const match of text.matchAll(/astronautAsset\("([^"]+)"\)/g)) refs.add('/astronaut/' + match[1]);
  }
  assert.ok(refs.size >= 8, `expected a useful asset inventory, found ${refs.size}`);
  for (const ref of refs) await access(path.join(root, 'public', ref.replace(/^\//, '')));
});

test('delivery keeps the heavy assets within the intended budget', async () => {
  const video = await stat(path.join(root, 'public/SYKR4_6_Planetas_WEB_720p.mp4'));
  const glb = await stat(path.join(root, 'public/astronaut/sykr4-astronaut-v4.glb'));
  assert.ok(video.size < 22 * 1024 * 1024, `video too large: ${video.size}`);
  assert.ok(glb.size < 10 * 1024 * 1024, `astronaut model unexpectedly grew: ${glb.size}`);
});
