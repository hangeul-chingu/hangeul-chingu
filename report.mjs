import fs from 'fs';
const files=fs.readdirSync('out').filter(f=>/^res_.*\.json$/.test(f)).sort();
let tp=0,tf=0; const rows=[],fails=[];
for(const f of files){const r=JSON.parse(fs.readFileSync('out/'+f));const ok=r.filter(x=>x.ok).length,ng=r.filter(x=>!x.ok);
  tp+=ok;tf+=ng.length; rows.push(`- ${f.replace(/^res_|\.json$/g,'')}: 통과 ${ok} / 실패 ${ng.length}`); ng.forEach(x=>fails.push(`- [${f.replace(/^res_|\.json$/g,'')}] ${x.name} :: ${String(x.detail).slice(0,140)}`));}
const verdict=files.length===0?'결과 없음(실행 실패)':tf===0?'자동 검사 모두 통과':'실패 있음';
fs.writeFileSync('out/REPORT.md',`# 한글 친구 화면 자동 검사 보고서\n\n판정: ${verdict} (통과 ${tp}, 실패 ${tf})\n\n※ 이것은 PC·휴대폰 화면 크기를 흉내 낸 로컬 에뮬레이션입니다. 실기기 통과가 아닙니다. 실제 계정 저장, 아이폰·안드로이드 브라우저 차이, 마이크, 실제 글자 크기 줄바꿈은 확인하지 못합니다.\n\n## 실행별 결과\n${rows.join('\n')}\n\n## 실패 목록\n${fails.length?fails.join('\n'):'- 없음'}\n\n화면 캡처: out/shots/\n`);
console.log(fs.readFileSync('out/REPORT.md','utf8')); process.exit(tf?1:0);
