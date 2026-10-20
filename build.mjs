import { build } from 'esbuild';
import { minify } from 'terser';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { deflateRawSync } from 'node:zlib';

const root = path.dirname(fileURLToPath(import.meta.url));
const entry = path.join(root, 'src', 'main.js');
const htmlPath = path.join(root, 'index.html');
const outDir = path.join(root, 'dist');
const outPath = path.join(outDir, 'index.html');
const PHASER_TAG = '<script src="https://cdn.jsdelivr.net/npm/phaser@3.70.0/dist/phaser.min.js"></script>';
const DEV_TAG = '<script type="module" src="./src/main.js"></script>';
const LIMIT = 50000;

const result = await build({
  entryPoints: [entry],
  bundle: true,
  minify: true,
  treeShaking: true,
  write: false,
  format: 'iife',
  target: 'es2020',
  platform: 'browser',
  legalComments: 'none'
});

const source = result.outputFiles[0].text;
const minified = await minify(source, {
  compress: {
    passes: 4,
    unsafe: true,
    pure_getters: true,
    drop_console: true,
    booleans_as_integers: true,
    ecma: 2020
  },
  mangle: { toplevel: true },
  format: { comments: false, ascii_only: true }
});

if (!minified.code) {
  console.error('Build failed: empty output');
  process.exit(1);
}

let template = await readFile(htmlPath, 'utf8');
if (!template.includes(DEV_TAG)) {
  console.error('Build failed: dev script tag not found in index.html');
  process.exit(1);
}

template = template.replace(/<style>([\s\S]*?)<\/style>/, (_, css) => {
  const compact = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>])\s*/g, '$1')
    .trim();
  return `<style>${compact}</style>`;
});
template = template.replace(/<!--[\s\S]*?-->/g, '').replace(/>\s+</g, '><');

const compressed = deflateRawSync(Buffer.from(minified.code, 'utf8'));
const b64 = compressed.toString('base64');
const runtimeBootstrap = `<script>(async()=>{const b=Uint8Array.from(atob("${b64}"),c=>c.charCodeAt(0)),s=new Response(b).body.pipeThrough(new DecompressionStream("deflate-raw")),c=await new Response(s).text();(0,eval)(c);})();</script>`;
let html = template.replace(DEV_TAG, runtimeBootstrap);

const ownHtml = html.replace(PHASER_TAG, '');
const ownBytes = Buffer.byteLength(ownHtml, 'utf8');
const totalBytes = Buffer.byteLength(html, 'utf8');

const external = [...html.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/g)]
  .map(m => m[1])
  .filter(url => !url.includes('cdn.jsdelivr.net/npm/phaser@3.70.0/'));
if (external.length) {
  console.error('Build failed: external resources found:', external);
  process.exit(1);
}
if (/<script[^>]+type="module"/.test(html)) {
  console.error('Build failed: module script was not inlined');
  process.exit(1);
}

await mkdir(outDir, { recursive: true });
await writeFile(outPath, html, 'utf8');

const pct = ((ownBytes / LIMIT) * 100).toFixed(1);
console.log(`Built ${path.relative(root, outPath)}`);
console.log(`Own code: ${ownBytes} bytes (${pct}% of ${LIMIT} limit)`);
console.log(`Total HTML: ${totalBytes} bytes`);
if (ownBytes > LIMIT) {
  console.error(`Build failed: own code exceeds ${LIMIT} bytes by ${ownBytes - LIMIT}`);
  process.exit(1);
}
