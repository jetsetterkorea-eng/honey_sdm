import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { HEADERS } from '../lib/quote-schema.mjs';
import { normalizeQuote, quoteRow } from '../lib/quote-data.mjs';
import { handleQuote } from '../api/quotes.mjs';
import { saveToSheets } from '../lib/sheets-store.mjs';

const policyVersion = 'test-policy-1';
const makeBody = overrides => ({
  id: randomUUID(), name: '접수테스트', phone: '010-0000-0000', channel: '문자 일정·견적 안내',
  region: '발리', hotel: '물리아', studioBase: '메이스튜디오', studioPlanId: '', customStudio: '',
  budget: '400~600만원', extras: [], weddingMonth: '', request: '', page: 'https://honeys.example/',
  consent: true, policyVersion, ...overrides
});
const env = {
  QUOTE_ENABLED: 'true', GOOGLE_SHEETS_ID: 'test-sheet', GOOGLE_SERVICE_ACCOUNT_EMAIL: 'test@example.invalid',
  GOOGLE_PRIVATE_KEY: 'test-only', QUOTE_PRIVACY_RETENTION: '테스트 보유기간', QUOTE_POLICY_VERSION: policyVersion
};
async function api(body, save, overrides = {}) {
  const response = { headers: {}, setHeader(k, v) { this.headers[k] = v; },
    status(value) { this.code = value; return this; }, json(value) { this.body = value; return this; } };
  await handleQuote({ method: 'POST', headers: { origin: 'https://honeys.example', host: 'honeys.example', 'content-type': 'application/json' }, body, ...overrides }, response, env, save);
  return response;
}

test('canonical pricing ignores client amounts and does not add studio/extras to bundle', () => {
  const quote = normalizeQuote(makeBody({ bundleStart: 1, studioStart: 1, extras: ['헬퍼비'] }), policyVersion);
  assert.equal(quote.bundleStart, 498);
  assert.equal(quote.studioStart, 88);
  assert.equal(quote.extras.length, 1);
});
for (const [region, perPerson] of [['시드니', 199], ['코사무이', 169], ['모리셔스', 299]]) {
  test(`${region}: region-only selection uses the canonical two-person price in the saved row`, async () => {
    let saved;
    const response = await api(makeBody({
      region, hotel: '', bundleStart: 1, studioStart: 1, extras: ['헬퍼비']
    }), async quote => { saved = quote; });
    assert.equal(response.code, 200);
    assert.equal(saved.region, region);
    assert.equal(saved.hotel, '상담 시 안내');
    assert.equal(saved.bundleStart, perPerson * 2);
    assert.equal(saved.studioStart, 88);
    assert.equal(saved.extras.length, 1);
    const row = quoteRow(saved);
    assert.equal(row[HEADERS.indexOf('여행지')], region);
    assert.equal(row[HEADERS.indexOf('희망 숙소')], '상담 시 안내');
    assert.equal(row[HEADERS.indexOf('결합 시작가 (만원·2인)')], perPerson * 2);
  });
  test(`${region}: omitted, empty and explicit consultation hotel normalize identically`, () => {
    for (const hotel of [undefined, '', '  ', '상담 시 안내']) {
      const quote = normalizeQuote(makeBody({ region, hotel }), policyVersion);
      assert.equal(quote.hotel, '상담 시 안내');
      assert.equal(quote.bundleStart, perPerson * 2);
    }
  });
  test(`${region}: a stale or invented hotel is rejected before saving`, async () => {
    for (const hotel of ['물리아', '추천 숙소', 'toString', '__proto__']) {
      const result = await api(makeBody({ region, hotel }), () => assert.fail('must not save'));
      assert.equal(result.code, 400);
      assert.match(result.body.message, /숙소/);
    }
  });
}
test('existing destinations retain their region and hotel starting prices', () => {
  for (const [region, hotel, expected] of [
    ['발리', '', 398], ['발리', '풀빌라', 398], ['발리', '물리아', 498],
    ['발리', '아야나', 512], ['발리', '주메이라', 564],
    ['하와이', '', 398], ['하와이', '아웃리거 와이키키 파라다이스', 398],
    ['하와이', '아웃리거 비치콤버', 436],
    ['몰디브', '', 778], ['몰디브', '벨라사루', 778], ['몰디브', '선시암 올후벨리', 798]
  ]) {
    const quote = normalizeQuote(makeBody({ region, hotel }), policyVersion);
    assert.equal(quote.bundleStart, expected);
    assert.equal(quote.hotel, hotel);
  }
});
test('all undecided items are permitted and produce no invented price', () => {
  const quote = normalizeQuote(makeBody({ region: '', hotel: '', studioBase: '', budget: '' }), policyVersion);
  assert.equal(quote.bundleStart, null);
  assert.equal(quote.studioStart, null);
});
test('hotel/region mismatch, invalid plan, and invalid option fail before saving', async () => {
  for (const change of [{ region: '하와이' }, { studioPlanId: 'not-real' }, { extras: ['not-real'] }]) {
    const result = await api(makeBody(change), () => assert.fail('must not save'));
    assert.equal(result.code, 400);
  }
});
test('missing or old consent is rejected', async () => {
  for (const change of [{ consent: false }, { policyVersion: 'old' }]) assert.equal((await api(makeBody(change), () => assert.fail())).code, 400);
});
test('cross-origin and oversized requests are rejected', async () => {
  assert.equal((await api(makeBody(), () => assert.fail(), { headers: { origin: 'https://evil.invalid', host: 'honeys.example' } })).code, 403);
  assert.equal((await api(makeBody({ request: 'x'.repeat(20000) }), () => assert.fail())).code, 413);
});
test('disabled deployment never writes and GET reveals no credentials or sheet ID', async () => {
  const res = { setHeader() {}, status(n) { this.code = n; return this; }, json(v) { this.body = v; } };
  await handleQuote({ method: 'GET' }, res, env);
  assert.equal(res.body.enabled, true);
  assert.doesNotMatch(JSON.stringify(res.body), /test-sheet|PRIVATE_KEY|test@example/);
  await handleQuote({ method: 'POST' }, res, { ...env, QUOTE_ENABLED: 'false' }, () => assert.fail());
  assert.equal(res.code, 503);
});
test('Korean date and row ordering preserve phone text, extras and consultation fields', () => {
  const row = quoteRow(normalizeQuote(makeBody({ compareExisting: true, request: '=1+1' }), policyVersion), new Date('2026-11-03T00:00:00Z'));
  assert.equal(row.length, HEADERS.length);
  assert.equal(row[0], '2026-11-03 09:00:00');
  assert.equal(row[3], '01000000000');
  assert.equal(row[15], '요청');
  assert.equal(row[16], '=1+1');
});

function fakeGoogle({ loseResponse = false, malformedHeaders = false } = {}) {
  const rows = [], markers = new Map();
  let failAfterCommit = loseResponse;
  return { rows, markers, async request({ url, data }) {
    if (url.includes('?fields=')) return { data: { sheets: [{ properties: { title: '상담접수', sheetId: 42 } }] } };
    if (url.includes('/values/')) return { data: { values: decodeURIComponent(url).includes('A1:W1') ? [malformedHeaders ? ['wrong'] : HEADERS] : rows.map(row => [row[20].userEnteredValue.stringValue]) } };
    if (url.endsWith('developerMetadata:search')) return { data: { matchedDeveloperMetadata: [...markers.values()].map(developerMetadata => ({ developerMetadata })) } };
    assert.ok(url.endsWith(':batchUpdate'));
    const added = data.requests[0].createDeveloperMetadata.developerMetadata;
    if (markers.has(added.metadataId)) throw new Error('duplicate metadata ID');
    // Simulate Sheets' atomic transaction. Nothing commits if validation fails.
    markers.set(added.metadataId, added);
    for (const request of data.requests.slice(1)) {
      if (request.deleteDeveloperMetadata) markers.delete(request.deleteDeveloperMetadata.dataFilter.developerMetadataLookup.metadataId);
      if (request.appendCells) rows.push(request.appendCells.rows[0].values);
    }
    if (failAfterCommit) { failAfterCommit = false; throw new Error('response lost'); }
    return { data: {} };
  } };
}
test('concurrent requests with one receipt ID produce one row', async () => {
  const google = fakeGoogle();
  const quote = normalizeQuote(makeBody({ request: '=IMPORTXML("https://invalid.invalid")' }), policyVersion);
  await Promise.all(Array.from({ length: 8 }, () => saveToSheets(quote, { spreadsheetId: 'test' }, google.request)));
  assert.equal(google.rows.length, 1);
  assert.equal(google.rows[0][16].userEnteredValue.stringValue, quote.request);
  assert.equal(google.rows[0][16].userEnteredValue.formulaValue, undefined);
});
test('lost response after commit is recovered and sequential retry does not duplicate', async () => {
  const google = fakeGoogle({ loseResponse: true });
  const quote = normalizeQuote(makeBody(), policyVersion);
  await saveToSheets(quote, { spreadsheetId: 'test' }, google.request);
  await saveToSheets(quote, { spreadsheetId: 'test' }, google.request);
  assert.equal(google.rows.length, 1);
});
test('headers changed by operator fail closed instead of misaligning customer data', async () => {
  const google = fakeGoogle({ malformedHeaders: true });
  await assert.rejects(saveToSheets(normalizeQuote(makeBody(), policyVersion), { spreadsheetId: 'test' }, google.request), /SCHEMA_MISMATCH/);
  assert.equal(google.rows.length, 0);
});
