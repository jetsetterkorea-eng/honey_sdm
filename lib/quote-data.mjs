import { readFileSync } from 'node:fs';
import { BUDGETS, CHANNELS, DESTINATIONS } from './quote-schema.mjs';

const source = JSON.parse(readFileSync(new URL('../docs/studio-source.json', import.meta.url), 'utf8'));
export class QuoteError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

function text(value, max = 100) {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string' || value.length > max || /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(value)) {
    throw new QuoteError('입력 내용을 확인해 주세요.');
  }
  return value.trim();
}

export function normalizeQuote(body, policyVersion) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new QuoteError('잘못된 요청입니다.');
  const id = text(body.id, 36);
  if (!/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i.test(id)) throw new QuoteError('접수번호를 확인해 주세요.');
  const name = text(body.name, 30);
  const phone = text(body.phone, 20).replace(/[\s-]/g, '');
  if (!name || !/^01[016789]\d{7,8}$/.test(phone)) throw new QuoteError('이름과 휴대폰 번호를 확인해 주세요.');
  if (body.consent !== true || body.policyVersion !== policyVersion) throw new QuoteError('개인정보 수집 안내를 확인하고 동의해 주세요.');
  if (text(body.website, 200)) throw new QuoteError('요청을 처리할 수 없습니다.');
  const channel = text(body.channel);
  const budget = text(body.budget);
  const region = text(body.region);
  const requestedHotel = text(body.hotel);
  if (!CHANNELS.includes(channel) || !BUDGETS.includes(budget)) throw new QuoteError('안내 방식과 예산을 확인해 주세요.');
  const destination = Object.hasOwn(DESTINATIONS, region) ? DESTINATIONS[region] : null;
  if (!destination && region !== '' && region !== '아직 미정') throw new QuoteError('여행지를 확인해 주세요.');
  const hotel = requestedHotel || destination?.defaultHotel || '';
  if (hotel && (!destination || !Object.hasOwn(destination.hotels, hotel))) throw new QuoteError('선택한 숙소를 확인해 주세요.');
  const studioBase = text(body.studioBase);
  const customStudio = text(body.customStudio);
  const planId = text(body.studioPlanId);
  const studio = source.studios.find(item => item.base === studioBase);
  if (!studio && !['', '아직 미정', 'custom'].includes(studioBase)) throw new QuoteError('촬영 스튜디오를 확인해 주세요.');
  if (studioBase === 'custom' && !customStudio) throw new QuoteError('희망 스튜디오 이름을 입력해 주세요.');
  const plan = studio?.variants.find(item => item.id === planId);
  if (planId && !plan) throw new QuoteError('촬영 세부 구성을 확인해 주세요.');
  if (!Array.isArray(body.extras) || body.extras.length > source.extras.length) throw new QuoteError('추가 항목을 확인해 주세요.');
  const extraNames = [...new Set(body.extras.map(value => text(value)))];
  const extras = extraNames.map(label => {
    const item = source.extras.find(extra => extra.label === label);
    if (!item) throw new QuoteError('추가 항목을 확인해 주세요.');
    return item;
  });
  const month = text(body.weddingMonth, 7);
  if (month && !/^20\d{2}-(0[1-9]|1[0-2])$/.test(month)) throw new QuoteError('예식 예정 월을 확인해 주세요.');
  const page = text(body.page, 500);
  let url;
  try { url = new URL(page || 'https://example.invalid'); }
  catch { throw new QuoteError('유입 페이지를 확인해 주세요.'); }
  if (!['https:', 'http:'].includes(url.protocol)) throw new QuoteError('유입 페이지를 확인해 주세요.');
  return {
    id, name, phone, channel, region, hotel, budget,
    studio: studioBase === 'custom' ? customStudio : studioBase,
    plan: plan?.name || '', studioStart: plan?.startPriceManwon ?? studio?.minimumManwon ?? null,
    bundleStart: destination ? hotel ? destination.hotels[hotel] : destination.start : null,
    month, extras, request: text(body.request, 1000), compare: body.compareExisting === true,
    policyVersion, page: url.origin + url.pathname
  };
}

export function quoteRow(quote, now = new Date()) {
  const date = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).format(now);
  return [date, '신규', quote.name, quote.phone, quote.channel,
    quote.region || '선택 전', quote.hotel, quote.studio || '선택 전', quote.plan, quote.budget || '선택 전',
    quote.month, quote.extras.map(item => item.label).join(', '),
    quote.extras.map(item => item.label + ' ' + item.priceText).join(' / '),
    quote.bundleStart, quote.studioStart, quote.compare ? '요청' : '', quote.request,
    '동의', quote.policyVersion, quote.page, quote.id, '', ''];
}
