// QA-NEG 부정 시험: 검사 도구가 "일부러 망가뜨린 경우"를 정말 FAIL로 잡는지 확인합니다.
// 사용: node neg.mjs <한글친구 프로젝트 폴더> <후보 App 파일> [팩id=culture08]
// 본 앱·운영 데이터는 건드리지 않습니다. 변이는 이 키트 폴더 안의 사본(neg-out/)에서만 만듭니다.
import fs from 'fs'; import path from 'path'; import {spawnSync} from 'child_process'; import {fileURLToPath} from 'url';
const CWD=process.cwd(); const KIT=path.dirname(fileURLToPath(import.meta.url)); process.chdir(KIT);
const [repoArg,candArg,packId='culture08']=process.argv.slice(2);
if(!repoArg||!candArg){console.log('사용법: node neg.mjs <프로젝트 폴더> <후보 App 파일> [팩id]');process.exit(2);}
const REPO=path.resolve(CWD,repoArg), CAND=path.resolve(CWD,candArg);
const N='neg-out'; fs.rmSync(N,{recursive:true,force:true}); fs.mkdirSync(N,{recursive:true});
const run=(args,env={},timeout=1500000)=>{const r=spawnSync('node',args,{encoding:'utf8',timeout,env:{...process.env,...env},maxBuffer:64*1024*1024}); return {st:r.status,out:(r.stdout||'')+(r.stderr||''),killed:r.status===null};};
const results=[]; const note=(id,what,expect,r,ok,detail)=>{results.push({id,what,expect,ok,detail}); console.log(`[${id}] ${ok?'탐지 성공':'NOT DETECTED'} — ${what} :: ${detail}`);};
const copyOut=dst=>fs.cpSync('out',path.join(N,dst),{recursive:true});

// 0) 기준선: 정상 앱은 PASS여야 부정 시험이 의미가 있음
console.log('기준선(정상 앱) 실행 중...');
const base=run(['run.mjs',REPO,CAND,packId]);
if(base.st!==0){console.error('기준선이 PASS가 아닙니다. 부정 시험을 진행하지 않습니다.\n'+base.out.slice(-1500)); process.exit(2);}
copyOut('base');
const rep=(dir,extra={})=>run(['report.mjs'],{QA_OUT:path.join(N,dir),...extra},120000);
const ver=dir=>run(['verify-outputs.mjs'],{QA_OUT:path.join(N,dir)},60000);
const resFile=(dir,tag)=>path.join(N,dir,`res_${packId}_${tag}.json`);

// NEG-04a 결과 파일 1개 삭제 → 보고서 FAIL
copyOut('base'.replace('base','n04a')); fs.rmSync(resFile('n04a','pc'));
let r=rep('n04a'); note('NEG-04a','결과 파일 1개 삭제(PC 실행)','FAIL',r,r.st===1&&/결과 파일이/.test(r.out),`종료코드 ${r.st}`);
// NEG-04b 결과 안의 검사 1개 삭제(81→80) → 보고서 FAIL
fs.cpSync(path.join(N,'base'),path.join(N,'n04b'),{recursive:true}); const j=JSON.parse(fs.readFileSync(resFile('n04b','m360'),'utf8')); j.pop(); fs.writeFileSync(resFile('n04b','m360'),JSON.stringify(j));
r=rep('n04b'); note('NEG-04b','검사 1개 삭제(81→80)','FAIL',r,r.st===1&&/검사 수가 80개/.test(r.out),`종료코드 ${r.st}`);
// NEG-06a REPORT.md 삭제 → 산출물 확인 FAIL
fs.cpSync(path.join(N,'base'),path.join(N,'n06a'),{recursive:true}); fs.rmSync(path.join(N,'n06a','REPORT.md'));
r=ver('n06a'); note('NEG-06a','REPORT.md 누락','FAIL',r,r.st===1&&/REPORT\.md/.test(r.out),`종료코드 ${r.st}`);
// NEG-06b 화면 캡처 폴더 삭제 → 산출물 확인 FAIL + 보고서 FAIL
fs.cpSync(path.join(N,'base'),path.join(N,'n06b'),{recursive:true}); fs.rmSync(path.join(N,'n06b','shots'),{recursive:true});
r=ver('n06b'); const r2=rep('n06b');
note('NEG-06b','화면 캡처 폴더 누락','FAIL',r,r.st===1&&r2.st===1,`산출물 확인 ${r.st} / 보고서 ${r2.st}`);

// NEG-05 실행 0건(없는 팩 id) → 멈추지 않고 실패로 종료
console.log('NEG-05 실행 중...');
r=run(['run.mjs',REPO,CAND,'culture99'],{},300000);
note('NEG-05','실행 0건(없는 팩 id)','FAIL',r,!r.killed&&r.st===2,r.killed?'멈춤(시간 초과)':`종료코드 ${r.st}`);

// NEG-01 저장 실패 안내 문구 제거 → P4-A가 FAIL이어야 함
console.log('NEG-01 실행 중...');
const src=fs.readFileSync(CAND,'utf8'); const mut=src.split('저장하지 못했어요').join('처리했어요');
const mutated=src!==mut; const mp=path.join(N,'App_neg01.jsx'); fs.writeFileSync(mp,mut);
r=run(['run.mjs',REPO,mp,packId]);
note('NEG-01','저장 실패 안내 문구 제거(변이 적용 '+(mutated?'됨':'안 됨')+')','FAIL',r,mutated&&r.st===1&&/P4-A 저장 실패 시 안내 표시/.test(r.out),`종료코드 ${r.st}`);

// 보고서
const nd=results.filter(x=>!x.ok).length;
const md=`# QA-NEG 부정 시험 결과\n\n> 이 결과는 검사 도구가 일부러 만든 오류를 잡는지만 확인합니다. 앱의 품질 판정이 아닙니다. 대상: ${packId}, 앱 파일 ${path.basename(CAND)}.\n\n판정: ${nd?`NOT DETECTED ${nd}건 — 검사 도구 결함(해당 케이스 FAIL)`:`${results.length}개 변이 모두 탐지(케이스 PASS)`}\n\n`+results.map(x=>`- ${x.id} ${x.what}: ${x.ok?'PASS (변이 탐지됨)':'FAIL — NOT DETECTED'} (${x.detail})`).join('\n')+`\n\n## 아직 하지 않은 변이\n- NEG-02 거짓 성공 표시 추가: 다음 라운드\n- NEG-03 오답 이유 바꿔치기: 다음 라운드\n`;
fs.writeFileSync(path.join(N,'NEG_REPORT.md'),md); console.log('\n'+md); process.exit(nd?1:0);
