export const HEADERS = ['접수시각','접수번호','기수','상담상태','이름','휴대전화','이메일','운영채널','대표채널URL','활동명','팔로워·구독자수','참여목표','개인정보동의','동의버전','담당자','상담메모'];
export class ApplicationError extends Error {}
export function normalizeApplication(body, policyVersion) {
  const fail = message => { throw new ApplicationError(message); };
  if (!body || typeof body !== 'object' || Array.isArray(body)) fail('신청 내용을 확인해 주세요.');
  if (body.consent !== true || body.policyVersion !== policyVersion) fail('개인정보 안내를 다시 확인하고 동의해 주세요.');
  if (typeof body.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.id)) fail('접수번호를 확인해 주세요.');
  const data = {id:body.id, policyVersion};
  for (const [key,max] of Object.entries({name:80,mobile:24,email:254,channels:100,url:2048,alias:100,audience:50,goal:1000})) {
    if (typeof body[key] !== 'string' || !body[key].trim() || body[key].length > max) fail('필수 항목과 입력 길이를 확인해 주세요.');
    data[key] = body[key].trim();
  }
  data.mobile = data.mobile.replace(/[\s()-]/g,'').replace(/^\+82(?:0)?/,'0');
  if (!/^01(?:0\d{8}|[16789]\d{7,8})$/.test(data.mobile)) fail('휴대전화 번호를 확인해 주세요.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) fail('이메일 주소를 확인해 주세요.');
  let url; try {url = new URL(data.url);} catch {fail('채널 URL을 확인해 주세요.');}
  if (!['http:','https:'].includes(url.protocol) || !url.hostname.includes('.') || url.username || url.password) fail('채널 URL을 확인해 주세요.');
  if (!data.channels.split(', ').every(x => ['인스타그램','유튜브','틱톡','블로그','기타'].includes(x))) fail('운영 채널을 확인해 주세요.');
  if (!['0명 · 이제 시작해요','1명~999명','1천 명~1만 명 미만','1만 명~5만 명 미만','5만 명~10만 명 미만','10만 명 이상'].includes(data.audience)) fail('팔로워 수 범위를 확인해 주세요.');
  data.createdAt = new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',dateStyle:'short',timeStyle:'medium'}).format(new Date());
  return data;
}
export const applicationRow = d => [d.createdAt,d.id,'2기','신규',d.name,d.mobile,d.email,d.channels,d.url,d.alias,d.audience,d.goal,'동의',d.policyVersion,'',''];
