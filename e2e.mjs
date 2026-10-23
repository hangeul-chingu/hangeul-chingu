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
  let firstPick=true, firstRecall=true;
  for(let step=0;step<20;step++){
    const hd=await head(p); if(/일째 끝|일째 공부를 끝냈어요/.test(hd)) break;
    const pk=find(P,hd,'pick'), rc=find(P,hd,'recall');
    const ctr=(hd.match(/(\d+)일째 · (\d+)\/15/)||[])[0];
    if(pk){
      if(step===0||firstPick){ firstPick=false; const wi=pk.opts.findIndex(o=>o!==pk.answer);
        await btn(p,pk.opts[wi]).click(); await sleep(p,900); const t=await head(p);
        const why=pk.whys[wi]; rec(t.includes('아직이에요')&&(!why||N(t).includes(N(why))),`d${day} ${ctr} 오답설명`,t.slice(0,80));
        await btn(p,'다시 해 보기').click(); await sleep(p,700);}
      await btn(p,pk.answer).click(); await sleep(p,1200); const t=await head(p);
      rec(t.includes('맞았어요')&&N(t).includes(N(pk.explain.slice(0,15))),`d${day} ${ctr} 정답+해설`,t.slice(-120));
      await overflow(`d${day} pick`);
      await btn(p,/다음\s*→/).click(); await sleep(p,1200);
    } else if(rc){
      if(firstRecall){ firstRecall=false; await p.locator('input').first().fill('ㅋㅋㅋ'); await btn(p,'확인').click(); await sleep(p,900);
        const t=await head(p); rec(t.includes('아직이에요'),`d${day} ${ctr} 오답 안내`,t.slice(-120)); await btn(p,'다시 해 보기').click(); await sleep(p,600);}
      const a=rc.answers[(step)%rc.answers.length];
      await p.locator('input').first().fill(a); await btn(p,'확인').click(); await sleep(p,1000); const t=await head(p);
      rec(!t.includes('아직이에요'),`d${day} ${ctr} 정답 인정 "${a}"`,t.slice(-150));
      await overflow(`d${day} recall`);
      await btn(p,/다음\s*→/).click(); await sleep(p,1200);
    } else if(/③ 내 문장 말하기/.test(hd)){
      await overflow(`d${day} speak`);
      const sp=P.items.find(it=>it.kind==='speak'&&hd.includes((it.q||'~~~').slice(0,12)));
      await p.locator('textarea').first().fill('저는 쉬는 날 친구와 이야기를 나누며 시간을 보내요.');
      await btn(p,/다 했어요/).click(); await sleep(p,900);
      const ck=await head(p); rec(ck.includes('내 문장 점검')&&ck.includes('스스로 점검'),`d${day} 말하기 점검화면`,ck.slice(0,160));
      if(sp&&sp.examples&&sp.examples[0]) rec(N(ck).includes(N(sp.examples[0]).slice(0,10)),`d${day} 참고예시 표시`);
      await overflow(`d${day} speakcheck`);
      await btn(p,'이대로 확정').click(); await sleep(p,1300);
    } else { rec(false,`d${day} 알 수 없는 화면`,hd.slice(0,200)); await p.screenshot({path:`out/shots/${packId}_${outTag}_d${day}_unk.png`}); break; }
  }
  const fin=await head(p); await p.screenshot({path:`out/shots/${packId}_${outTag}_d${day}_end.png`});
  console.log(`day${day} END:`,fin.slice(0,250));
  await btn(p,'닫기').click().catch(()=>{}); await sleep(p,600);
}
for(const e of errs) rec(false,'콘솔오류',e);
fs.writeFileSync(`out/res_${packId}_${outTag}.json`,JSON.stringify(res,null,1));
console.log(packId,outTag,'PASS',res.filter(r=>r.ok).length,'FAIL',res.filter(r=>!r.ok).length);
await b.close();
