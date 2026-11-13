// api/chat.js — 보완안 v3 (2026-11-13 대표 승인, V605 클라이언트와 함께 배포)
//
// v2 대비 바뀐 점(재재검토 결과):
//  - 요청 본문 읽기: 기존 코드가 실제로 잘 돌던 '스트림 직접 읽기'로 되돌림(v2의 req.body 우선
//    방식은 검증 없이 넣은 것이었음). 스트림이 비어 있을 때만 req.body를 예비로 사용.
//  - 본문 내용 검사 추가: 앱이 실제로 보내는 블록(text·image·document(base64))만 허용하고
//    나머지(tool_use, url 이미지 등)는 거절. 글자 수·첨부 개수·PDF 크기에 상한.
//  - 비용 가중치: 이미지·PDF가 든 호출은 10회로 계산. 글자 수 일일 예산도 사용자별·전체로 둠.
//  - 인증서 갱신 보강: 모르는 kid가 오면 1분에 한 번만 다시 받고, Google 쪽 오류 시 직전 인증서 유지.
//
// 정직한 한계:
//  - Origin 확인은 '다른 사이트의 브라우저'만 막는다. 터미널(curl)은 위조할 수 있으므로
//    진짜 관문은 로그인 토큰이다. 가입이 열려 있으면 누구나 토큰을 얻을 수 있으므로
//    사용자별·전체 상한이 두 번째 방어선이다.
//  - 호출 횟수·예산 제한은 서버 메모리에 저장돼 인스턴스마다 따로 센다(재시작하면 초기화).
//    비용의 '진짜 상한'은 (1) Console 월 지출 한도, (2) 자동 충전 OFF + 소액 잔액이다.

import { createHash, verify as cryptoVerify, X509Certificate } from 'node:crypto';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'hangeul-chingu';
const ALLOWED_ORIGINS = new Set(
  (process.env.ALLOWED_ORIGINS ||
    'https://hangeul-chingu.com,https://www.hangeul-chingu.com,https://hangeul-chingu.vercel.app')
    .split(',').map(s => s.trim()).filter(Boolean)
);

const num = (v, d) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : d);
const MODEL = process.env.CHAT_MODEL || 'claude-sonnet-4-6';
const MAX_TOKENS_CAP = num(process.env.MAX_TOKENS_CAP, 2000);   // 앱의 최대 요청값은 1800
const MAX_BODY_BYTES = 4_000_000;                                // Vercel 본문 한도(약 4.5MB) 안쪽
const MAX_MESSAGES = 40;
const MAX_TEXT_CHARS = num(process.env.MAX_TEXT_CHARS, 100000);  // 한 번 호출의 글자 수(시스템+메시지)
const MAX_BINARY_BLOCKS = 3;
const MAX_PDF_B64 = num(process.env.MAX_PDF_B64, 1_500_000);     // PDF 한 개(base64 글자 수)
const HEAVY_WEIGHT = 10;                                         // 이미지·PDF 호출 = 10회로 계산
const PER_MINUTE = num(process.env.PER_MINUTE, 20);
const PER_DAY_PER_USER = num(process.env.PER_DAY_PER_USER, 150);
const PER_DAY_GLOBAL = num(process.env.PER_DAY_GLOBAL, 800);
const USER_CHARS_PER_DAY = num(process.env.USER_CHARS_PER_DAY, 1_500_000);
const GLOBAL_CHARS_PER_DAY = num(process.env.GLOBAL_CHARS_PER_DAY, 6_000_000);
const REQUIRE_VERIFIED_EMAIL = process.env.REQUIRE_VERIFIED_EMAIL === 'true';
const ALLOW_ANONYMOUS = process.env.ALLOW_ANONYMOUS === 'true'; // 앱은 익명 로그인을 쓰지 않음

const CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
let certCache = { keys: {}, exp: 0, fetchedAt: 0 };

const perUser = new Map();
const globalDay = { day: '', count: 0, chars: 0 };
const today = () => new Date().toISOString().slice(0, 10);
const b64u = s => Buffer.from(s, 'base64url');

function fail(res, status, type, message) {
  return res.status(status).json({ error: { type, message } });
}

async function getCerts(force) {
  const fresh = certCache.exp > Date.now() && Object.keys(certCache.keys).length;
  if (fresh && !(force && Date.now() - certCache.fetchedAt > 60000)) return certCache.keys;
  try {
    const r = await fetch(CERTS_URL);
    if (!r.ok) throw new Error('cert fetch failed');
    const pems = await r.json();
    const keys = {};
    for (const [kid, pem] of Object.entries(pems)) {
      try { keys[kid] = new X509Certificate(pem).publicKey; } catch { /* 건너뜀 */ }
    }
    if (!Object.keys(keys).length) throw new Error('no certs');
    const m = /max-age=(\d+)/.exec(r.headers.get('cache-control') || '');
    certCache = { keys, exp: Date.now() + (m ? Number(m[1]) : 3600) * 1000, fetchedAt: Date.now() };
  } catch {
    certCache.fetchedAt = Date.now();            // 실패해도 1분은 다시 시도하지 않음
    if (!Object.keys(certCache.keys).length) throw new Error('no certs available');
    certCache.exp = Date.now() + 5 * 60 * 1000;  // 직전 인증서를 잠시 더 사용
  }
  return certCache.keys;
}

// Firebase 공식 검증 절차: alg=RS256, kid 일치, 서명, exp/iat, aud, iss, sub
async function verifyIdToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const header = JSON.parse(b64u(parts[0]).toString());
    const payload = JSON.parse(b64u(parts[1]).toString());
    if (header.alg !== 'RS256' || !header.kid) return null;
    let key = (await getCerts(false))[header.kid];
    if (!key) key = (await getCerts(true))[header.kid];
    if (!key) return null;
    const okSig = cryptoVerify('RSA-SHA256', Buffer.from(parts[0] + '.' + parts[1]), key, b64u(parts[2]));
    if (!okSig) return null;
    const now = Math.floor(Date.now() / 1000);
    if (!(payload.exp > now) || !(payload.iat <= now + 60)) return null;
    if (payload.aud !== PROJECT_ID) return null;
    if (payload.iss !== 'https://securetoken.google.com/' + PROJECT_ID) return null;
    if (typeof payload.sub !== 'string' || !payload.sub) return null;
    const provider = payload.firebase && payload.firebase.sign_in_provider;
    if (provider === 'anonymous' && !ALLOW_ANONYMOUS) return null;
    if (REQUIRE_VERIFIED_EMAIL && payload.email_verified !== true) return null;
    return payload.sub;
  } catch { return null; }
}

// 통과하면 true, 한도를 넘으면 false
function takeQuota(uid, weight, chars) {
  const now = Date.now();
  const day = today();
  if (globalDay.day !== day) { globalDay.day = day; globalDay.count = 0; globalDay.chars = 0; }
  if (globalDay.count + weight > PER_DAY_GLOBAL || globalDay.chars + chars > GLOBAL_CHARS_PER_DAY) return false;
  let u = perUser.get(uid);
  if (!u) { u = { minute: [], day, dayCount: 0, dayChars: 0 }; perUser.set(uid, u); }
  if (u.day !== day) { u.day = day; u.dayCount = 0; u.dayChars = 0; }
  u.minute = u.minute.filter(t => now - t < 60000);
  if (u.minute.length >= PER_MINUTE || u.dayCount + weight > PER_DAY_PER_USER ||
      u.dayChars + chars > USER_CHARS_PER_DAY) return false;
  u.minute.push(now); u.dayCount += weight; u.dayChars += chars;
  globalDay.count += weight; globalDay.chars += chars;
  if (perUser.size > 2000) perUser.clear();
  return true;
}

async function getBody(req) {
  if (Number(req.headers['content-length'] || 0) > MAX_BODY_BYTES) return { tooLarge: true };
  const chunks = []; let size = 0;
  for await (const c of req) { size += c.length; if (size > MAX_BODY_BYTES) return { tooLarge: true }; chunks.push(c); }
  let b;
  try {
    if (chunks.length) b = JSON.parse(Buffer.concat(chunks).toString());
    else { b = req.body; if (typeof b === 'string') b = JSON.parse(b); }
  } catch { return { invalid: true }; }
  return b && typeof b === 'object' ? { body: b } : { invalid: true };
}

// 앱이 실제로 보내는 형태(text / image·document 의 base64)만 허용하고 글자 수·첨부를 센다.
function inspectRequest(b) {
  const out = { ok: true, chars: 0, binary: 0 };
  const bad = () => { out.ok = false; };
  const textBlock = blk => { if (typeof blk.text !== 'string') bad(); else out.chars += blk.text.length; };
  const walk = content => {
    if (typeof content === 'string') { out.chars += content.length; return; }
    if (!Array.isArray(content)) return bad();
    for (const blk of content) {
      if (!blk || typeof blk !== 'object') { bad(); continue; }
      if (blk.type === 'text') textBlock(blk);
      else if (blk.type === 'image' || blk.type === 'document') {
        out.binary++;
        const s = blk.source;
        if (!s || s.type !== 'base64' || typeof s.data !== 'string' || typeof s.media_type !== 'string') bad();
        else if (blk.type === 'document' && s.data.length > MAX_PDF_B64) bad();
      } else bad();
    }
  };
  if (!Array.isArray(b.messages) || b.messages.length === 0 || b.messages.length > MAX_MESSAGES) { bad(); return out; }
  for (const m of b.messages) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) { bad(); continue; }
    walk(m.content);
  }
  if (b.system !== undefined) {
    if (typeof b.system === 'string') out.chars += b.system.length;
    else if (Array.isArray(b.system) && b.system.every(x => x && x.type === 'text')) b.system.forEach(textBlock);
    else bad();
  }
  if (out.chars > MAX_TEXT_CHARS || out.binary > MAX_BINARY_BLOCKS) bad();
  return out;
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return fail(res, 405, 'method_not_allowed', 'Method not allowed');
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return fail(res, 403, 'forbidden', 'Origin not allowed');

  const auth = String(req.headers.authorization || '');
  const idToken = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!idToken) return fail(res, 401, 'unauthorized', 'Login required');
  const uid = await verifyIdToken(idToken);
  if (!uid) return fail(res, 401, 'unauthorized', 'Invalid or expired login');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return fail(res, 500, 'server_error', 'API key not configured');

  const parsed = await getBody(req);
  if (parsed.tooLarge) return fail(res, 413, 'too_large', 'Request too large');
  if (parsed.invalid) return fail(res, 400, 'bad_request', 'Invalid JSON');
  const b = parsed.body;
  const info = inspectRequest(b);
  if (!info.ok) return fail(res, 400, 'bad_request', 'Invalid or oversized request');
  if (!takeQuota(uid, info.binary > 0 ? HEAVY_WEIGHT : 1, info.chars)) return fail(res, 429, 'rate_limited', 'Too many requests');

  // 요청에서 받는 것은 system·messages·max_tokens(상한 적용)뿐. model은 서버가 정한다.
  const requested = Math.floor(Number(b.max_tokens));
  const payload = {
    model: MODEL,
    max_tokens: Math.min(requested > 0 ? requested : 1000, MAX_TOKENS_CAP),
    messages: b.messages,
  };
  if (b.system) payload.system = b.system;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    // 기록은 '누가(해시)·결과·출력 토큰'만. 요청 내용은 기록하지 않음(개인정보처리방침 문구와 일치).
    console.log(JSON.stringify({ t: 'chat', u: createHash('sha256').update(uid).digest('hex').slice(0, 8), s: response.status, out: data && data.usage ? data.usage.output_tokens : null, heavy: info.binary > 0 }));
    return res.status(response.status).json(data);
  } catch (error) {
    return fail(res, 500, 'server_error', error.message);
  }
}
