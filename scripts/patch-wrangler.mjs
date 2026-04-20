import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const SESSION_KV_ID = 'b014f776c9124a5e97e46ec0445fccac';

// 1) Inject SESSION KV namespace ID into the generated wrangler config.
const wranglerPath = resolve('dist/server/wrangler.json');
const cfg = JSON.parse(readFileSync(wranglerPath, 'utf8'));
const kv = cfg.kv_namespaces?.find((n) => n.binding === 'SESSION');
if (!kv) throw new Error('SESSION KV binding not found in generated wrangler.json');
kv.id = SESSION_KV_ID;

cfg.routes = [
  { pattern: 'poopcheck.app', custom_domain: true },
  { pattern: 'www.poopcheck.app', custom_domain: true },
];
cfg.workers_dev = true;

writeFileSync(wranglerPath, JSON.stringify(cfg));
console.log(`Patched SESSION KV binding with id=${SESSION_KV_ID}`);
console.log('Added custom domain routes: poopcheck.app, www.poopcheck.app');

// 2) Normalize _redirects for Cloudflare:
//    - Strip trailing `/index.html` from splat targets (Cloudflare flags these as redirect loops).
//    - Replace `*` in splat targets with `:splat` so the captured path is substituted at runtime.
const redirectsPath = resolve('dist/client/_redirects');
if (existsSync(redirectsPath)) {
  const lines = readFileSync(redirectsPath, 'utf8').split('\n');
  const out = lines.map((line) => {
    if (!line.trim() || line.trim().startsWith('#')) return line;
    const parts = line.split(/(\s+)/);
    const tokens = parts.filter((p, i) => i % 2 === 0);
    const gaps = parts.filter((p, i) => i % 2 === 1);
    if (tokens.length < 2) return line;
    const [source, target, ...rest] = tokens;
    if (!source.includes('/*') || !target.includes('/*')) return line;
    const newTarget = target.replace(/\/\*\/index\.html$/, '/:splat/').replace(/\/\*(\/?)$/, '/:splat$1');
    const newTokens = [source, newTarget, ...rest];
    let rebuilt = '';
    for (let i = 0; i < newTokens.length; i++) {
      rebuilt += newTokens[i];
      if (i < gaps.length) rebuilt += gaps[i];
    }
    return rebuilt;
  });
  const fixed = out.join('\n');
  writeFileSync(redirectsPath, fixed);
  console.log('Normalized splat redirects: * -> :splat and stripped /index.html');
}
