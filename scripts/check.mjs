import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {dirname, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {DESTINATIONS} from '../lib/quote-schema.mjs';

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
const inputs = [...html.matchAll(/<input\b[^>]*>/g)].map(match => match[0]);
const radioValues = name => inputs.filter(tag => tag.match(/\bname="([^"]+)"/)?.[1] === name).map(tag => tag.match(/\bvalue="([^"]*)"/)?.[1]);
const regionChoices = radioValues('journey-region');
for (const [, region] of html.matchAll(/data-region="([^"]+)"/g)) {
  assert.ok(regionChoices.includes(region), `Quote button has no destination choice: ${region}`);
}
// A destination must work through selection, comparison and server-side submission.
// All starts are KRW 10,000 for two people; structured data uses KRW instead.
const destinationNames = Object.keys(DESTINATIONS).sort();
const pricingDeclaration = app.match(/const\s+REGION_PRICING\s*=\s*(\{[\s\S]*?\n\s*\});/);
assert.ok(pricingDeclaration, 'Missing frontend destination pricing');
const regionPricing = JSON.parse(pricingDeclaration[1]);
assert.deepEqual(regionPricing, Object.fromEntries(Object.entries(DESTINATIONS).map(([region, data]) => [region, {
  bundleStart: data.start, ...(data.defaultHotel ? {defaultHotel: data.defaultHotel} : {})
}])), 'Frontend and server destination prices/default hotels differ');
assert.deepEqual([...regionChoices].sort(), [...destinationNames, '아직 미정'].sort(), 'Calculator destination choices differ from server');
assert.deepEqual(radioValues('comparison-region').sort(), destinationNames, 'Comparison destination choices differ from server');
const quoteSelect = html.match(/<select\b[^>]*\bid="quote-region-select"[^>]*>([\s\S]*?)<\/select>/);
assert.ok(quoteSelect, 'Missing consultation destination select');
const quoteRegions = [...quoteSelect[1].matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/g)].map(([, attributes, label]) => attributes.match(/\bvalue="([^"]*)"/)?.[1] ?? label.trim());
assert.deepEqual(quoteRegions.sort(), [...destinationNames, '', '아직 미정'].sort(), 'Consultation destination choices differ from server');
const destinationCards = new Map(
  [...html.matchAll(/<article\b[^>]*class="[^"]*\bdestination-choice\b[^"]*"[^>]*>[\s\S]*?<\/article>/g)].map(([card]) => {
    const input = [...card.matchAll(/<input\b[^>]*>/g)].map(match => match[0]).find(tag => /name="journey-region"/.test(tag));
    return [input?.match(/\bvalue="([^"]+)"/)?.[1], card];
  }).filter(([region]) => region !== '아직 미정')
);
assert.deepEqual([...destinationCards.keys()].sort(), destinationNames, 'Missing calculator destination price card');
for (const [region, data] of Object.entries(DESTINATIONS)) {
  const card = destinationCards.get(region);
  const amount = card.match(/class="[^"]*\bdestination-amount\b[^"]*"[^>]*>([\s\S]*?)<\/label>/)?.[1];
  assert.ok(amount, `Missing visible destination price: ${region}`);
  const displayedPrice = amount.match(/<b>\s*([\d,]+)\s*<\/b>/)?.[1];
  assert.equal(Number(displayedPrice?.replaceAll(',', '')), data.start, `Displayed two-person starting price differs from server: ${region}`);
  assert.match(amount, /class="[^"]*\bprice-basis\b[^"]*"[^>]*>\s*2인\s*</, `Destination price must identify the two-person basis: ${region}`);
  if (data.defaultHotel) {
    assert.ok(Object.hasOwn(data.hotels, data.defaultHotel), `Default hotel is missing from server hotel data: ${region}`);
    assert.equal(data.hotels[data.defaultHotel], data.start, `Default hotel and destination prices differ: ${region}`);
    assert.match(card, /class="[^"]*\bdestination-simple\b/, `Consultation hotel must use a simple destination card: ${region}`);
  }
  if (data.defaultHotel || Object.keys(data.hotels).length === 0) {
    assert.doesNotMatch(card, /<details\b|class="[^"]*\bdestination-hotels\b/, `Region-only destination must not offer hotel choices: ${region}`);
  }
}
const structuredData = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(([, json]) => {
  const data = JSON.parse(json);
  return data['@graph'] || [data];
});
const offers = structuredData.find(item => item.hasOfferCatalog?.name === '여행지별 결합 시작가')?.hasOfferCatalog.itemListElement;
assert.ok(Array.isArray(offers), 'Missing structured destination offers');
assert.equal(offers.length, destinationNames.length, 'Structured offers must include every destination exactly once');
for (const [region, data] of Object.entries(DESTINATIONS)) {
  const matching = offers.filter(offer => offer.itemOffered?.name?.startsWith(region + ' '));
  assert.equal(matching.length, 1, `Missing or duplicated structured destination offer: ${region}`);
  assert.match(matching[0].itemOffered.name, /허니문 2인/, `Structured offer must identify the two-person basis: ${region}`);
  assert.equal(matching[0].priceSpecification?.priceCurrency, 'KRW', `Incorrect structured currency: ${region}`);
  assert.equal(matching[0].priceSpecification?.minPrice, data.start * 10000, `Structured destination price differs from server: ${region}`);
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
console.log(`Passed: ${ids.length} unique IDs, anchor/label/asset references, ${destinationNames.length} destinations and prices across UI/server/structured data, credential isolation, ${media.length} media blocks, JavaScript syntax.`);
