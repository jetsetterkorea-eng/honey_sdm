import { normalizeQuote, QuoteError } from '../lib/quote-data.mjs';
import { appendQuote } from '../lib/sheets-store.mjs';

export function settingsFromEnv(env) {
  return {
    enabled: env.QUOTE_ENABLED === 'true', spreadsheetId: env.GOOGLE_SHEETS_ID,
    email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL, privateKey: env.GOOGLE_PRIVATE_KEY,
    retention: env.QUOTE_PRIVACY_RETENTION, policyVersion: env.QUOTE_POLICY_VERSION,
    businessName: env.QUOTE_BUSINESS_NAME || '허니스드메'
  };
}

export async function handleQuote(req, res, env = process.env, save = appendQuote) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const settings = settingsFromEnv(env);
  const ready = settings.enabled && ['spreadsheetId', 'email', 'privateKey', 'retention', 'policyVersion'].every(key => Boolean(settings[key]?.trim()));
  if (req.method === 'GET') {
    return res.status(200).json({ enabled: ready, retention: ready ? settings.retention : '',
      policyVersion: ready ? settings.policyVersion : '', businessName: settings.businessName });
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ message: '지원하지 않는 요청입니다.' });
  }
  if (!ready) return res.status(503).json({ message: '현재 상담 접수 연결을 준비 중입니다. 잠시 후 다시 이용해 주세요.' });
  try {
    const origin = new URL(req.headers.origin || 'https://invalid.invalid');
    if (origin.host !== req.headers.host || !['https:', 'http:'].includes(origin.protocol)) {
      return res.status(403).json({ message: '이 홈페이지에서 상담을 신청해 주세요.' });
    }
    if (!req.headers['content-type']?.toLowerCase().startsWith('application/json')) {
      return res.status(415).json({ message: '요청 형식을 확인해 주세요.' });
    }
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? null);
    if (Buffer.byteLength(raw, 'utf8') > 16000) return res.status(413).json({ message: '문의 내용을 조금 줄여 주세요.' });
    let body;
    try { body = JSON.parse(raw); } catch { throw new QuoteError('요청 형식을 확인해 주세요.'); }
    const quote = normalizeQuote(body, settings.policyVersion);
    await save(quote, settings);
    return res.status(200).json({ ok: true, id: quote.id });
  } catch (error) {
    if (error instanceof QuoteError) return res.status(error.status).json({ message: error.message });
    // Do not log names, phone numbers, private keys or Google response bodies.
    console.error('quote_submission_failed', { code: error.code || 'UPSTREAM_FAILURE', status: error.response?.status || 0 });
    return res.status(503).json({ message: '접수를 완료하지 못했습니다. 입력한 내용은 유지되니 다시 눌러 주세요.' });
  }
}

export default async function handler(req, res) {
  return handleQuote(req, res);
}
