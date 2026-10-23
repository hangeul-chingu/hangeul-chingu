// App.jsx 안의 SELF_PACKS를 packs.json(정답 기준 자료)으로 뽑는다.
import fs from 'fs';
const [,,src,out]=process.argv;
const s=fs.readFileSync(src,'utf8');
const a=s.indexOf('const SELF_PACKS = [');
const e=s.indexOf('\n];',a);
if(a<0||e<0){console.error('SELF_PACKS를 찾지 못했습니다');process.exit(2);}
const arr=new Function('return '+s.slice(a+'const SELF_PACKS = '.length,e+3))();
const packs=arr.map(p=>({id:p.id,title:p.title,items:p.items.map((it,i)=>({t:i,day:Math.floor(i/15),kind:i%3===0?'pick':i%3===1?'recall':'speak',...it}))}));
fs.writeFileSync(out,JSON.stringify(packs));
console.log('팩',packs.length,'개 추출');
