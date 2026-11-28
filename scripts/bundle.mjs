// Builds a single self-contained page with the CSS and JS inlined.
//   node scripts/bundle.mjs              -> dist/ledgerlands.html (full document)
//   node scripts/bundle.mjs --fragment   -> dist/ledgerlands.fragment.html (no <html>/<head>/<body>,
//                                           for hosts that wrap the page in their own document)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = f => readFileSync(join(root, f), 'utf8');

let html = read('index.html');
html = html.replace(/<link rel="stylesheet" href="(styles\.css)">/, (_, f) => `<style>\n${read(f)}</style>`);
html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, f) => `<script>\n${read(f).replace(/<\/script/gi, '<\\/script')}</script>`);

const fragment = process.argv.includes('--fragment');
if (fragment) {
  const head = html.match(/<head>([\s\S]*?)<\/head>/)[1]
    .replace(/<meta charset[^>]*>\s*/, '')
    .replace(/<meta name="viewport"[^>]*>\s*/, '');
  const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
  html = `${head.trim()}\n${body.trim()}\n`;
}

mkdirSync(join(root, 'dist'), { recursive: true });
const out = join(root, 'dist', fragment ? 'ledgerlands.fragment.html' : 'ledgerlands.html');
writeFileSync(out, html);
console.log(`wrote ${out} (${(Buffer.byteLength(html) / 1024).toFixed(1)} KB)`);
