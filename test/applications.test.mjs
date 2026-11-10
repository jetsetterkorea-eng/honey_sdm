import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { HEADERS, normalizeApplication, applicationRow } from '../lib/application-data.mjs';
import { handleApplication } from '../api/applications.mjs';
import { saveToSheets } from '../lib/application-store.mjs';
const policyVersion = 'test-v1';
const makeBody = overrides => ({id:randomUUID(),name:'접수테스트',mobile:'010-0000-0000',email:'test@example.invalid',channels:'인스타그램',url:'https://example.com/test',alias:'테스트',audience:'0명 · 이제 시작해요',goal:'접수 테스트',consent:true,policyVersion,...overrides});
test('invalid inputs and stale consent are rejected', () => {
 for (const change of [{consent:false},{policyVersion:'old'},{mobile:'abc'},{channels:'invalid'},{audience:'invalid'},{url:'javascript:alert(1)'},{name:''},{goal:'x'.repeat(1001)}]) assert.throws(() => normalizeApplication(makeBody(change),policyVersion));
 const row = applicationRow(normalizeApplication(makeBody(),policyVersion));
 assert.equal(row.length,HEADERS.length); assert.equal(row[2],'2기'); assert.equal(row[5],'01000000000');
});
test('API validates origins, readiness, and consent before writing', async () => {
 const env={APPLICATION_ENABLED:'true',APPLICATION_SHEETS_ID:'test',GOOGLE_SERVICE_ACCOUNT_EMAIL:'test',GOOGLE_PRIVATE_KEY:'test',APPLICATION_RETENTION:'3개월',APPLICATION_POLICY_VERSION:policyVersion};
 const response=()=>({setHeader(){},status(n){this.code=n;return this;},json(v){this.body=v;return this;}});
 const req={method:'POST',headers:{origin:'https://example.com',host:'example.com','content-type':'application/json'},body:makeBody()};
 let saved;const res=response();await handleApplication(req,res,env,async d=>{saved=d;});assert.equal(res.code,200);assert.equal(saved.id,req.body.id);
 for(const [input,settings,code] of [[{...req,body:makeBody({consent:false})},env,400],[{...req,headers:{...req.headers,origin:'https://evil.invalid'}},env,403],[req,{...env,APPLICATION_ENABLED:'false'},503]]){const r=response();await handleApplication(input,r,settings,()=>assert.fail());assert.equal(r.code,code);}
});
function fakeGoogle({ loseResponse = false, malformedHeaders = false } = {}) {
  const rows = [], markers = new Map();
  let failAfterCommit = loseResponse;
  return { rows, markers, async request({ url, data }) {
    if (url.includes('?fields=')) return { data: { sheets: [{ properties: { title: '신청접수', sheetId: 42 } }] } };
    if (url.includes('/values/')) return { data: { values: decodeURIComponent(url).includes('A1:P1') ? [malformedHeaders ? ['wrong'] : HEADERS] : rows.map(row => [row[1].userEnteredValue.stringValue]) } };
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
  const quote = normalizeApplication(makeBody({ goal: '=IMPORTXML("https://invalid.invalid")' }), policyVersion);
  await Promise.all(Array.from({ length: 8 }, () => saveToSheets(quote, { spreadsheetId: 'test' }, google.request)));
  assert.equal(google.rows.length, 1);
  assert.equal(google.rows[0][11].userEnteredValue.stringValue, quote.goal);
  assert.equal(google.rows[0][11].userEnteredValue.formulaValue, undefined);
});
test('lost response after commit is recovered and sequential retry does not duplicate', async () => {
  const google = fakeGoogle({ loseResponse: true });
  const quote = normalizeApplication(makeBody(), policyVersion);
  await saveToSheets(quote, { spreadsheetId: 'test' }, google.request);
  await saveToSheets(quote, { spreadsheetId: 'test' }, google.request);
  assert.equal(google.rows.length, 1);
});
test('headers changed by operator fail closed instead of misaligning customer data', async () => {
  const google = fakeGoogle({ malformedHeaders: true });
  await assert.rejects(saveToSheets(normalizeApplication(makeBody(), policyVersion), { spreadsheetId: 'test' }, google.request), /SCHEMA_MISMATCH/);
  assert.equal(google.rows.length, 0);
});
