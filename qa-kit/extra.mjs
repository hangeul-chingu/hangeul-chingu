// P2(새로고침 후 진도·하루 잠금·자정 경계) / P3(200% 확대 에뮬레이션) / P4(저장 실패) 추가 검사. 사용: node extra.mjs <packId> <제목> <태그>
import {open,toHome,btn,openPack,ov} from './lib.mjs';
import {ALL,find,head,sleep} from './drv.mjs';
import fs from 'fs';
const [,, packId, title, tag='x']=process.argv;
const P=ALL.find(x=>x.id===packId);
const res=[]; const rec=(ok,name,detail='')=>{res.push({ok,name,detail}); if(!ok) console.log('FAIL',name,detail);};
const ctrOf=h=>((h.match(/(\d+)일째 · (\d+)\/15/)||[])[0]||'');
async function answerOne(p,hd){ // 문항 하나를 정답으로 넘김. 반환: 처리한 종류
  const pk=find(P,hd,'pick'), rc=find(P,hd,'recall');
  if(pk){ await btn(p,pk.answer).click(); await sleep(p,1300); await btn(p,/다음\s*→/).click(); await sleep(p,1200); return 'pick'; }
  if(rc){ await p.locator('input').first().fill(rc.answers[0]); await btn(p,'확인').click(); await sleep(p,1100); await btn(p,/다음\s*→/).click(); await sleep(p,1200); return 'recall'; }
  if(/③ 내 문장 말하기/.test(hd)){ await p.locator('textarea').first().fill('저는 쉬는 날 친구와 이야기를 나누며 시간을 보내요.'); await btn(p,/다 했어요/).click(); await sleep(p,900); await btn(p,'이대로 확정').click(); await sleep(p,1300); return 'speak'; }
  return null;
}
async function finishDay(p){ for(let i=0;i<24;i++){ const hd=await head(p); if(/일째 끝|일째 공부를 끝냈어요/.test(hd)) return true; if(!await answerOne(p,hd)) return false; } return false; }
async function reopen(p){ await p.reload({waitUntil:'load'}); await sleep(p,1800);
  let h=await head(p); if(/일째/.test(h)) return h;
  await toHome(p); await sleep(p,1500); h=await head(p); if(/일째/.test(h)) return h;
  await openPack(p,title); await sleep(p,900); return await head(p); }
// ---------- P2 / P4 : 휴대폰 360 ----------
{
  const {b,p,errs}=await open({w:360,h:740,mobile:true}); await toHome(p);
  await openPack(p,title); await sleep(p,600);
  // P2-A 새로고침 전후 진도
  for(let i=0;i<2;i++) await answerOne(p,await head(p));
  const before=await head(p); const c0=ctrOf(before);
  const h1=await reopen(p);
  rec(c0!==''&&ctrOf(h1)===c0,'P2-A 새로고침 후 진도 유지',`전 ${c0} / 후 ${ctrOf(h1)}`);
  // P4 저장 실패: 저장 막고 한 문제 풀기 → 안내, 풀고 나면 안내 사라짐
  await p.evaluate(()=>localStorage.setItem('fake_fail','1'));
  const hd=await head(p); await answerOne(p,hd); await sleep(p,500);
  const bodyTxt=await ov(p);
  rec(/저장하지 못했어요/.test(bodyTxt),'P4-A 저장 실패 시 안내 표시',bodyTxt.slice(0,120).replace(/\n/g,' '));
  rec(!/저장 완료|저장됐어요/.test(bodyTxt),'P4-A 저장 실패 시 거짓 완료 표시 없음');
  await p.screenshot({path:`out/shots/${packId}_${tag}_p4_savefail.jpg`,type:'jpeg',quality:60});
  await p.evaluate(()=>localStorage.setItem('fake_fail','0'));
  await answerOne(p,await head(p)); await sleep(p,700);
  const t2=await ov(p); rec(!/저장하지 못했어요/.test(t2),'P4-A 연결 회복 후 안내 사라짐');
  // P2-B 하루 잠금, 자정 경계(한국 시간)
  const ok=await finishDay(p); rec(ok,'P2-B 1일차 완료');
  const lk=await reopen(p); rec(/1일째까지 끝났어요|오늘 공부는 끝났어요/.test(lk)&&!/2일째 · \d/.test(lk),'P2-B 같은 날엔 2일차 잠금',lk.slice(0,100));
  const setOff=async ms=>{ await p.evaluate(m=>{ const D=Date.__proto__===undefined?null:null; localStorage.setItem('fake_dayoff',String(m)); },ms); };
  const untilMid=await p.evaluate(()=>{const f=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Seoul',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}).formatToParts(new Date());const g=t=>+f.find(x=>x.type===t).value;return 86400000-((g('hour')%24)*3600+g('minute')*60+g('second'))*1000;});
  await setOff(untilMid-120000); const b4=await reopen(p); rec(/1일째까지 끝났어요|오늘 공부는 끝났어요/.test(b4),'P2-B 한국 자정 2분 전: 아직 잠금',b4.slice(0,100));
  await setOff(untilMid+120000); const af=await reopen(p); rec(/2일째 · \d+\/15/.test(af),'P2-B 한국 자정 2분 후: 2일차 열림',af.slice(0,100));
  errs.forEach(e=>rec(false,'페이지 오류 '+e));
  await b.close();
}
// ---------- P3 : 브라우저 200% 확대 에뮬레이션(360px → 180px 폭) ----------
{
  const {b,p,errs}=await open({w:180,h:370,mobile:false}); await toHome(p);
  await openPack(p,title); await sleep(p,700);
  const outside=()=>p.evaluate(()=>{const o=[...document.querySelectorAll('div')].find(d=>{const c=getComputedStyle(d);return c.position==='fixed'&&c.zIndex==='3100'}); if(!o) return -1; return [...o.querySelectorAll('*')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.right>window.innerWidth+1}).length;});
  const inView=async(loc,name)=>{ const bb=await loc.boundingBox(); rec(!!bb&&bb.x>=-1&&bb.x+bb.width<=181,name,bb?`x ${Math.round(bb.x)} w ${Math.round(bb.width)}`:'없음'); };
  for(let s=0;s<12;s++){
    const hd=await head(p); const pk=find(P,hd,'pick'), rc=find(P,hd,'recall');
    if(pk){
      for(let k=0;k<pk.opts.length;k++){ await inView(p.locator(`button[aria-label="보기 ${k+1}"]`),'P3 알아보기 보기 '+(k+1)+' 화면 안'); }
      {const n=await outside(); rec(n===0,'P3 알아보기: 화면 오른쪽 밖으로 나간 요소 없음',String(n));}
      await p.screenshot({path:`out/shots/${packId}_${tag}_p3_pick.jpg`,type:'jpeg',quality:60});
      const wi=pk.opts.findIndex(o=>o!==pk.answer); await p.locator(`button[aria-label="보기 ${wi+1}"]`).scrollIntoViewIfNeeded(); await p.locator(`button[aria-label="보기 ${wi+1}"]`).click(); await sleep(p,900);
      await btn(p,'다시 해 보기').scrollIntoViewIfNeeded(); await inView(btn(p,'다시 해 보기'),'P3 다시 해 보기 버튼 화면 안');
      await p.screenshot({path:`out/shots/${packId}_${tag}_p3_wrong.jpg`,type:'jpeg',quality:60});
      await btn(p,'다시 해 보기').click(); await sleep(p,700);
      break;
    }
    await answerOne(p,hd);
  }
  for(let s=0;s<12;s++){
    const hd=await head(p); const rc=find(P,hd,'recall');
    if(rc){ await inView(p.locator('input').first(),'P3 떠올리기 입력창 화면 안'); await inView(btn(p,'확인'),'P3 확인 버튼 화면 안');
      {const n=await outside(); rec(n===0,'P3 떠올리기: 화면 오른쪽 밖으로 나간 요소 없음',String(n));}
      await p.screenshot({path:`out/shots/${packId}_${tag}_p3_recall.jpg`,type:'jpeg',quality:60}); break; }
    // 알아보기 이어서 정답 처리
    const hd2=await head(p); const pk=find(P,hd2,'pick'); if(pk){ const ai=pk.opts.indexOf(pk.answer); const ab=p.locator(`button[aria-label="보기 ${ai+1}"]`); await ab.scrollIntoViewIfNeeded(); await ab.click(); await sleep(p,1300); const nx=btn(p,/다음\s*→/); await nx.scrollIntoViewIfNeeded(); await nx.click(); await sleep(p,1200); } else break;
  }
  errs.forEach(e=>rec(false,'페이지 오류 '+e));
  await b.close();
}
const pass=res.filter(r=>r.ok).length, fail=res.length-pass;
fs.writeFileSync(`out/extra_${packId}_${tag}.json`,JSON.stringify({packId,tag,pass,fail,res},null,1));
console.log(`${packId} extra PASS ${pass} FAIL ${fail}`);
