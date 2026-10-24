import {open,toHome,btn,openPack,ov} from './lib.mjs';
import {ALL,N,sleep,find,head} from './drv.mjs';
import fs from 'fs';
const [,, packId, title, w='390', h='844', daysArg='1,2,3', outTag='m390']=process.argv;
const P=ALL.find(x=>x.id===packId);
const res=[]; const rec=(ok,name,detail='')=>{res.push({ok,name,detail}); if(!ok) console.log('FAIL',name,detail);};
const {b,p,errs}=await open({w:+w,h:+h,mobile:+w<600});
await toHome(p);
const overflow=async tag=>{const o=await p.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1); if(o) rec(false,'가로넘침 '+tag);};
for(const day of daysArg.split(',').map(Number)){
  await p.evaluate(d=>localStorage.setItem('fake_dayoff',String((d-1)*86400000)),day);
  await p.reload({waitUntil:'load'}); await sleep(p,1500); await toHome(p);
  await openPack(p,title); await sleep(p,500);
  let h0=await head(p);
  if(!h0.includes(day+'일째')){ rec(false,`day${day} 열림`,h0.slice(0,120)); await p.screenshot({path:`out/shots/${packId}_${outTag}_d${day}_nolock.png`}); continue;}
  let pi=0, ri=0, si=0; const V=outTag.startsWith('pc')?1:0, MOB=outTag.startsWith('m');
  const shot=async n=>{ if(MOB) await p.screenshot({path:`out/shots/${packId}_${outTag}_d${day}_${n}.jpg`,type:'jpeg',quality:60}); };
  for(let step=0;step<24;step++){
    const hd=await head(p); if(/일째 끝|일째 공부를 끝냈어요/.test(hd)) break;
    const pk=find(P,hd,'pick'), rc=find(P,hd,'recall');
    const ctr=(hd.match(/(\d+)일째 · (\d+)\/15/)||[])[0];
    if(pk){
      const W=pk.opts.map((o,i)=>i).filter(i=>pk.opts[i]!==pk.answer); const r=(pi+V)%W.length;
      if(pi===0) await shot('01_pick_question');
      // 오답 1: 해당 오답의 이유가 JSON과 일치하는지
      let wi=W[r]; await btn(p,pk.opts[wi]).click(); await sleep(p,900); let t=await head(p);
      rec(t.includes('아직이에요')&&(!pk.whys[wi]||N(t).includes(N(pk.whys[wi]))),`d${day} ${ctr} 오답설명(보기${wi+1})`,t.slice(0,80));
      if(pi===0) await shot('02_pick_wrong');
      await btn(p,'다시 해 보기').click(); await sleep(p,700);
      if(pi<2){ // 오답 2: 두 번째 다른 오답의 이유 확인(끝난 문항으로 기록됨)
        wi=W[(r+1)%W.length]; await btn(p,pk.opts[wi]).click(); await sleep(p,900); t=await head(p);
        rec(!pk.whys[wi]||N(t).includes(N(pk.whys[wi])),`d${day} ${ctr} 두번째 오답설명(보기${wi+1})`,t.slice(0,80));
      } else { // 정답 + 해설
        await btn(p,pk.answer).click(); await sleep(p,1200); t=await head(p);
        rec(t.includes('맞았어요')&&N(t).includes(N(pk.explain.slice(0,15))),`d${day} ${ctr} 정답+해설`,t.slice(-120));
      }
      pi++; await overflow(`d${day} pick`);
      await btn(p,/다음\s*→/).click(); await sleep(p,1200);
    } else if(rc){
      if(ri===0){ await shot('03_recall_question'); rec(await btn(p,'확인').isDisabled(),`d${day} ${ctr} 빈 입력은 확인 불가`);
        await p.locator('input').first().fill('ㅋㅋㅋ'); await btn(p,'확인').click(); await sleep(p,900);
        const t=await head(p); rec(t.includes('아직이에요'),`d${day} ${ctr} 오답 안내`,t.slice(-120)); await shot('04_recall_wrong'); await btn(p,'다시 해 보기').click(); await sleep(p,600);}
      const a=rc.answers[(ri+V)%rc.answers.length]; const typed=V?a.replace(/\s+/g,''):a+'.';
      await p.locator('input').first().fill(typed); await btn(p,'확인').click(); await sleep(p,1000); const t=await head(p);
      rec(!t.includes('아직이에요'),`d${day} ${ctr} 인정 답 "${typed}"`,t.slice(-150));
      if(ri===0) await shot('05_recall_ok');
      ri++; await overflow(`d${day} recall`);
      await btn(p,/다음\s*→/).click(); await sleep(p,1200);
    } else if(/③ 내 문장 말하기/.test(hd)){
      await overflow(`d${day} speak`);
      const sp=P.items.find(it=>it.kind==='speak'&&hd.includes((it.q||'~~~').slice(0,12)));
      await p.locator('textarea').first().fill('저는 쉬는 날 친구와 이야기를 나누며 시간을 보내요.');
      await btn(p,/다 했어요/).click(); await sleep(p,900);
      const ck=await head(p); rec(ck.includes('내 문장 점검')&&ck.includes('스스로 점검'),`d${day} 말하기 점검화면`,ck.slice(0,160));
      if(sp&&sp.examples&&sp.examples[0]) rec(N(ck).includes(N(sp.examples[0]).slice(0,10)),`d${day} 참고예시 표시`);
      await overflow(`d${day} speakcheck`);
      if(si===0) await shot('06_speak_check'); si++;
      await btn(p,'이대로 확정').click(); await sleep(p,1300);
    } else { rec(false,`d${day} 알 수 없는 화면`,hd.slice(0,200)); await p.screenshot({path:`out/shots/${packId}_${outTag}_d${day}_unk.png`}); break; }
  }
  const fin=await head(p); await p.screenshot({path:`out/shots/${packId}_${outTag}_d${day}_end.png`});
  console.log(`day${day} END:`,fin.slice(0,250));
  await btn(p,/닫기|여기서 마치기/).click().catch(()=>{}); await sleep(p,600);
}
for(const e of errs) rec(false,'콘솔오류',e);
fs.writeFileSync(`out/res_${packId}_${outTag}.json`,JSON.stringify(res,null,1));
console.log(packId,outTag,'PASS',res.filter(r=>r.ok).length,'FAIL',res.filter(r=>!r.ok).length);
await b.close();
