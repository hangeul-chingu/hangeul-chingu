// REPORT.md 생성 + 판정(기품팀장 10/24 보고서 표준 반영). 사용: node report.mjs  (환경변수 QA_OUT=결과 폴더, 기본 out)
import fs from 'fs'; import path from 'path';
const OUT=process.env.QA_OUT||'out';
const EXP=JSON.parse(fs.readFileSync(new URL('./expect.json',import.meta.url),'utf8'));
const policy=process.env.QA_LOCK_POLICY||EXP.lockPolicy;
if(policy!==EXP.lockPolicy){console.error(`검사 기준(expect.json)은 "${EXP.lockPolicy}" 정책용입니다. "${policy}" 정책의 기준이 아직 없어 판정하지 않습니다(NOT TESTED).`);process.exit(2);}
const list=re=>fs.existsSync(OUT)?fs.readdirSync(OUT).filter(f=>re.test(f)).sort():[];
const files=list(/^res_.*\.json$/), xfiles=list(/^extra_.*\.json$/);
const rd=f=>JSON.parse(fs.readFileSync(path.join(OUT,f),'utf8'));
const num=f=>{const p=path.join(OUT,f);return fs.existsSync(p)?+fs.readFileSync(p,'utf8'):0;};
const spec=fs.existsSync(path.join(OUT,'spec.json'))?rd('spec.json'):{};
const fails=[]; let pass=0, fail=0, skip=0;
const cnt={m360:[0,0],pc:[0,0],p2a:[0,0],p2b:[0,0],p3:[0,0],p4:[0,0]}; // [PASS, FAIL]
const F=(msg)=>{fail++;fails.push('- '+msg);};
const rows=[];

// 1) 실행 수 기대치
const expRuns=num('expected.txt'), expX=num('expected_extra.txt');
if(!expRuns) F('[전체] 기대 실행 수가 0입니다(실행 0건). 검사가 시작되지 않았습니다');
else if(files.length<expRuns) F(`[전체] 결과 파일이 ${files.length}개뿐입니다(기대 ${expRuns}개). 일부 실행이 중간에 실패했습니다. log_*.txt를 확인하세요`);
if(expX&&xfiles.length<expX) F(`[추가검사] 결과 파일이 ${xfiles.length}개뿐입니다(기대 ${expX}개)`);

// 2) 실행별(휴대폰·PC) 결과 + 필수 CASE 확인
for(const f of files){
  const id=f.replace(/^res_|\.json$/g,''); const r=rd(f); const okN=r.filter(x=>x.ok).length, ng=r.filter(x=>!x.ok);
  const key=/_pc$/.test(id)?'pc':'m360'; cnt[key][0]+=okN; cnt[key][1]+=ng.length; pass+=okN; fail+=ng.length;
  rows.push(`- ${id}: PASS ${okN} / FAIL ${ng.length}`);
  ng.forEach(x=>fails.push(`- [${id}] ${x.name} :: ${String(x.detail).slice(0,140)}`));
  if(r.length!==EXP.perRun.total) F(`[${id}] 검사 수가 ${r.length}개입니다(기대 ${EXP.perRun.total}개, 기준 ${EXP.specVersion})`);
  for(const q of EXP.perRun.required){const n=r.filter(x=>new RegExp(q.re).test(x.name)).length; if(n!==q.n) F(`[${id}] 필수 CASE "${q.id}" ${n}건(기대 ${q.n}건)`);}
}

// 3) 추가 검사(P2·P3·P4) + 필수 CASE 확인
const grp=n=>/^P2-A/.test(n)?'p2a':/^P2-B/.test(n)?'p2b':/^P3/.test(n)?'p3':/^P4/.test(n)?'p4':null;
const xrows=[];
for(const f of xfiles){
  const d=rd(f); const names=d.res.map(x=>x.name);
  d.res.forEach(x=>{const g=grp(x.name); if(g) cnt[g][x.ok?0:1]++; if(x.ok) pass++; else {fail++; fails.push(`- [추가검사 ${d.packId}] ${x.name} :: ${String(x.detail).slice(0,140)}`);}});
  xrows.push(`- ${d.packId}: PASS ${d.pass} / FAIL ${d.fail}`);
  if(d.res.length!==EXP.extra.total) F(`[추가검사 ${d.packId}] 검사 수가 ${d.res.length}개입니다(기대 ${EXP.extra.total}개)`);
  for(const n of EXP.extra.required) if(!names.includes(n)) F(`[추가검사 ${d.packId}] 필수 CASE 누락: ${n}`);
}

// 4) 화면 캡처 수량(팩 수 기준)
const packIds=[...new Set(files.map(f=>f.replace(/^res_|_(m360|pc)\.json$/g,'')))];
const shots=fs.existsSync(path.join(OUT,'shots'))?fs.readdirSync(path.join(OUT,'shots')):[];
const jpg=shots.filter(s=>/\.jpg$/.test(s)).length, png=shots.filter(s=>/\.png$/.test(s)).length;
if(packIds.length){
  if(jpg<EXP.shotsPerPack.jpgMin*packIds.length) F(`[캡처] JPG ${jpg}장(기대 ${EXP.shotsPerPack.jpgMin*packIds.length}장 이상)`);
  if(png<EXP.shotsPerPack.pngMin*packIds.length) F(`[캡처] PNG ${png}장(기대 ${EXP.shotsPerPack.pngMin*packIds.length}장 이상)`);
}

// 5) 판정과 보고서
const verdict=!files.length?'FAIL — 결과 없음(실행 0건 또는 전부 실패)':fail===0?`지정 환경의 ${pass}개 검사 PASS, FAIL 0`:`FAIL ${fail}건 (PASS ${pass})`;
const line=(label,[p,f])=>`- ${label}: PASS ${p} / FAIL ${f}`;
const md=`# 한글 친구 화면 자동 검사 보고서

> 이 결과는 표기한 검사 환경·버전·CASE-ID에 한정됩니다. 로컬 브라우저 화면 크기 에뮬레이션·모의 계정/저장 결과는 실기기, 운영 Firebase, 운영 서버 날짜 정책을 입증하지 않습니다.

- 검사 기준 버전: ${EXP.specVersion} (잠금 정책: ${EXP.lockPolicy} = 하루 한 일차)
- 대상 앱 파일 SHA-256(앞 12자리): ${spec.appSha256?String(spec.appSha256).slice(0,12):'기록 없음'}
- 대상 팩 ${packIds.length}개: ${packIds.join(', ')||'없음'}

## 판정
${verdict}

## 요약 (항목별로 따로 집계)
- PASS ${pass} / FAIL ${fail} / SKIP ${skip} / NOT TESTED 5개 항목(아래 목록)

## 검사 범위별 결과
${line('휴대폰 360px 에뮬레이션 검사(팩당 기본 '+EXP.perRun.total+'개)',cnt.m360)}
${line('PC 1280px 에뮬레이션 검사(팩당 기본 '+EXP.perRun.total+'개)',cnt.pc)}
${line('새로고침 후 진도 유지 검사(P2-A)',cnt.p2a)}
${line('브라우저 모의 시계 기준 날짜 경계 검사(P2-B)',cnt.p2b)}
${line('CSS 뷰포트 180px 극소폭 배치 스트레스 검사(P3)',cnt.p3)}
${line('로컬 모의 저장 실패·복구 UI 검사(P4-A)',cnt.p4)}

## NOT TESTED (이 보고서가 확인하지 않은 것)
- 실제 서버 날짜·다중 기기 시간 기준 검증: NOT TESTED (서버 기준 정책 자체도 확인 필요)
- 실기기 OS 글자 200% 및 브라우저 확대 검사: NOT TESTED
- 실제 Firebase 인증·읽기·저장·재접속·권한 검증: NOT TESTED
- 실기기(아이폰·안드로이드) 입력창·줄바꿈·마이크: NOT TESTED
- A안(독학 연속 학습 허용)의 P2-B 새 기준 4케이스: NOT TESTED (앱에 구현되기 전)

## 실행별 결과
${rows.join('\n')||'- 없음'}

## 추가 검사 결과
${xrows.join('\n')||'- 실행 안 함'}

## 실패 목록
${fails.length?fails.join('\n'):'- 없음'}

화면 캡처: ${OUT}/shots/ (JPG ${jpg}장, PNG ${png}장)
`;
fs.writeFileSync(path.join(OUT,'REPORT.md'),md);
console.log(md); process.exit(fail?1:0);
