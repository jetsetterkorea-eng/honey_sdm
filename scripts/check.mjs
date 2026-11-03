import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {dirname, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const html = readFileSync(resolve(dist, 'index.html'), 'utf8');
const css = ['site.css', 'choices.css', 'comparison.css'].map(file => readFileSync(resolve(dist, file), 'utf8')).join('\n');
const app = readFileSync(resolve(dist, 'app.js'), 'utf8');
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'Duplicate HTML IDs');

for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) {
  assert.ok(ids.includes(id), `Missing anchor: #${id}`);
}
for (const [, targets] of html.matchAll(/aria-(?:labelledby|describedby|controls)="([^"]+)"/g)) {
  for (const id of targets.split(/\s+/)) assert.ok(ids.includes(id), `Missing accessibility target: ${id}`);
}
for (const [, id] of html.matchAll(/\sfor="([^"]+)"/g)) {
  assert.ok(ids.includes(id), `Missing label target: ${id}`);
}
for (const [, id] of app.matchAll(/byId\('([^']+)'\)/g)) {
  assert.ok(ids.includes(id), `Missing JavaScript target: ${id}`);
}
for (const [, url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  if (/^(?:https?:|data:|#)/.test(url)) continue;
  const asset = resolve(dist, url.split(/[?#]/)[0]);
  assert.ok(asset.startsWith(dist + sep), `Local reference escapes dist: ${url}`);
  assert.ok(existsSync(asset), `Missing local asset: ${url}`);
}
const regionChoices = [...html.matchAll(/<input\b[^>]*>/g)].map(match => match[0]).filter(tag => /name="journey-region"/.test(tag)).map(tag => tag.match(/value="([^"]+)"/)?.[1]);
for (const [, region] of html.matchAll(/data-region="([^"]+)"/g)) {
  assert.ok(regionChoices.includes(region), `Quote button has no destination choice: ${region}`);
}
const media = [...css.matchAll(/@media\s*([^{}]+)\{/g)].map(match => match[1].replace(/\s+/g, ' ').trim());
const tokens = new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map(match => match[1]));
for (const [, token] of css.matchAll(/var\((--[\w-]+)/g)) {
  assert.ok(tokens.has(token) || token === '--honeys-physical-scale', `Undefined design token: ${token}`);
}
assert.doesNotMatch(app, /\b(?:XMLHttpRequest|sendBeacon|localStorage)\b/, 'Do not persist customer data in the browser');
const submitClient = readFileSync(resolve(dist, 'lead-form.js'), 'utf8');
assert.doesNotMatch(submitClient, /GOOGLE_PRIVATE_KEY|GOOGLE_SERVICE_ACCOUNT_EMAIL|sheets\.googleapis\.com/, 'Google credentials and API access belong on the server');
for (const [, endpoint] of submitClient.matchAll(/fetch\('([^']+)'/g)) assert.equal(endpoint, '/api/quotes', 'Lead data must use the same-origin Vercel function');
for (const [, key] of app.matchAll(/sessionStorage\.setItem\('([^']+)'/g)) assert.equal(key, 'honeys-layout-mode', 'Only layout preference may be stored');
assert.match(html, /입력 정보는 저장·전송되지 않으며 상담은 접수되지 않습니다/, 'Preview notice must appear before submission');
assert.match(html, /<form[^>]+id="consult-form"[^>]+novalidate/, 'Expected preview form');
assert.match(html, /<form\b(?=[^>]*id="consult-form")(?=[^>]*method="dialog")[^>]*>/, 'Preview must never send contact fields via native form navigation');
// v90 explicitly authorizes sourced individual studio starts; inferred discounts remain excluded.
const source = JSON.parse(readFileSync(resolve(root, 'docs/studio-source.json'), 'utf8'));
const catalog = JSON.parse(app.match(/const STUDIO_CATALOG = (\{[\s\S]*?\n\});/)[1]);
const displayedStudios = new Map(
  [...html.matchAll(/<label class="studio-choice"[^>]*>([\s\S]*?)<\/label>/g)].map(([, row]) => [
    row.match(/name="journey-studio"[^>]*value="([^"]+)"/)[1],
    Number(row.match(/class="studio-choice-price">(\d+)/)[1])
  ])
);
assert.equal(Object.keys(catalog).length, source.studioCount, 'All sourced studios must be represented');
assert.equal(displayedStudios.size, source.studioCount, 'Calculator must show each sourced studio');
for (const studio of source.studios) {
  assert.equal(displayedStudios.get(studio.base), studio.minimumManwon, `Calculator starting price differs from source: ${studio.base}`);
  assert.deepEqual(catalog[studio.base], {
    start: studio.minimumManwon,
    note: studio.caveat || '',
    plans: studio.variants.map(plan => ({id: plan.id, name: plan.name, start: plan.startPriceManwon}))
  }, `Studio price/conditions differ from source: ${studio.base}`);
}
const extras = [...html.matchAll(/<input\b[^>]*name="journey-extra"[^>]*>/g)].map(([tag]) => ({
  label: tag.match(/value="([^"]+)"/)[1], priceText: tag.match(/data-price="([^"]+)"/)[1]
}));
const byLabel = (a, b) => a.label.localeCompare(b.label);
assert.deepEqual(extras.sort(byLabel), source.extras.map(({label, priceText}) => ({label, priceText})).sort(byLabel), 'Extra choices must preserve sourced ranges');
assert.match(html, /id="journey-panel-3"/, 'Additional choices belong in calculator step 04');
assert.doesNotMatch(html, /id="interactive-cost-list"/, 'Do not duplicate the additional item picker');
assert.doesNotMatch(app, /totalStandalone|extraSum|estimatedRealTotal|standalone:\s*\d/, 'Inferred pricing must not ship');
assert.doesNotMatch(html, /data-extra-min|comparison-difference|live-calc-standalone/, 'Review requests must not be priced automatically');
assert.match(app, /const selectedExtras = new Set\(\)/, 'Extras must be selected independently');
const syntax = spawnSync(process.execPath, ['--check', resolve(dist, 'app.js')], {encoding: 'utf8'});
assert.equal(syntax.status, 0, syntax.stderr);
console.log(`Passed: ${ids.length} unique IDs, anchor/label/asset references, destination handoff, credential isolation, ${media.length} media blocks, JavaScript syntax.`);
