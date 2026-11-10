import { createHash } from 'node:crypto';
import { HEADERS, applicationRow } from './application-data.mjs';

// The receipt marker and data row are committed in one Sheets transaction.
// Keep only recent markers; column U remains the permanent receipt index.
export async function saveToSheets(quote, settings, request) {
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${settings.spreadsheetId}`;
  const call = async (path, method = 'GET', data) => (await request({
    url: base + path, method, data, timeout: 10000, retry: false
  })).data;
  const [metadata, header, ids] = await Promise.all([
    call('?fields=sheets.properties'),
    call('/values/' + encodeURIComponent("'신청접수'!A1:P1")),
    call('/values/' + encodeURIComponent("'신청접수'!B2:B"))
  ]);
  const sheet = metadata.sheets?.find(item => item.properties.title === '신청접수');
  if (!sheet || JSON.stringify(header.values?.[0]) !== JSON.stringify(HEADERS)) {
    throw new Error('SHEET_SCHEMA_MISMATCH');
  }
  if (ids.values?.some(row => row[0] === quote.id)) return;
  const findMarkers = async () => {
    const data = await call('/developerMetadata:search', 'POST', {
      dataFilters: [{ developerMetadataLookup: { metadataKey: 'academy_application', visibility: 'DOCUMENT' } }]
    });
    return (data.matchedDeveloperMetadata || []).map(item => item.developerMetadata);
  };
  const markers = await findMarkers();
  const matches = item => item.metadataValue?.split('|')[0] === quote.id;
  if (markers.some(matches)) return;
  const stale = [...markers].sort((a, b) => Number(b.metadataValue?.split('|')[1]) - Number(a.metadataValue?.split('|')[1])).slice(199);
  const cells = applicationRow(quote).map(value => ({ userEnteredValue:
    typeof value === 'number' ? { numberValue: value } : { stringValue: String(value ?? '') }
  }));
  for (let attempt = 0; attempt < 4; attempt++) {
    const metadataId = (createHash('sha256').update(quote.id + ':' + attempt).digest().readUInt32BE(0) & 0x7fffffff) || 1;
    if (markers.some(item => item.metadataId === metadataId)) continue;
    const requests = [
      { createDeveloperMetadata: { developerMetadata: {
        metadataId, metadataKey: 'academy_application', metadataValue: quote.id + '|' + Date.now(),
        location: { sheetId: sheet.properties.sheetId }, visibility: 'DOCUMENT'
      } } },
      ...stale.map(item => ({ deleteDeveloperMetadata: { dataFilter: {
        developerMetadataLookup: { metadataId: item.metadataId }
      } } })),
      { appendCells: { sheetId: sheet.properties.sheetId, rows: [{ values: cells }], fields: 'userEnteredValue' } }
    ];
    try {
      await call(':batchUpdate', 'POST', { requests });
      return;
    } catch (error) {
      // A response can be lost after Google commits. Check before reporting failure.
      const after = await findMarkers();
      if (after.some(matches)) return;
      if (!after.some(item => item.metadataId === metadataId)) throw error;
    }
  }
  throw new Error('RECEIPT_CONFLICT');
}

let auth;
export async function appendApplication(quote, settings) {
  if (!auth) {
    const { GoogleAuth } = await import('google-auth-library');
    auth = new GoogleAuth({
      credentials: { client_email: settings.email, private_key: settings.privateKey.replace(/\\n/g, '\n') },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
  }
  const client = await auth.getClient();
  await saveToSheets(quote, settings, options => client.request(options));
}
