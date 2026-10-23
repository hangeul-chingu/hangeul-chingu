import { chromium } from 'playwright';
export const URL=process.env.QA_URL||'http://127.0.0.1:5199/';
export const SEED={'users/qa-learner':{role:'learner',isAdult:true,serviceAgreed:true,dataOwnershipAgreed:true,researchAsked:true,researchConsent:false,profileAsked:true,name:'학습자QA',level:'mid',lang:'ko',createdAt:1}};
export async function open({w=390,h=844,mobile=true,fontScale=1,seed=SEED}={}){
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:w,height:h},locale:'ko-KR',isMobile:mobile,hasTouch:mobile,deviceScaleFactor:2});
  await ctx.addInitScript(([s])=>{ if(!localStorage.getItem('fake_fs')) localStorage.setItem('fake_fs',JSON.stringify(s)); },[seed]);
  await ctx.addInitScript(()=>{ const off=()=>{try{return +localStorage.getItem('fake_dayoff')||0}catch(e){return 0}}; const D=Date; class F extends D{constructor(...a){ if(a.length) super(...a); else super(D.now()+off()); } static now(){return D.now()+off();}} window.Date=F; });
  const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await p.goto(URL,{waitUntil:'load'}); await p.waitForTimeout(1200);
  return {b,ctx,p,errs};
}
const DISMISS=['다음에 볼게요','괜찮아요, 다음에','건너뛰기','나중에 할게요','나중에','지금은 안 할래요','닫기'];
export async function toHome(p){
  for(let i=0;i<15;i++){
    if(await p.getByText('한국문화로 배우는 한국어').count()) return true;
    let done=false;
    for(const t of DISMISS){const l=p.getByText(t,{exact:false}).first(); if(await l.count()){ try{await l.click({timeout:1500});}catch(e){} await p.waitForTimeout(700); done=true; break;}}
    if(!done) break;
  }
  return !!(await p.getByText('한국문화로 배우는 한국어').count());
}
export const text=async p=>(await p.innerText('body')).replace(/\n+/g,' | ');
export const btn=(p,t)=>p.locator('button').filter({hasText:t}).first();
export async function openPack(p,title){
  const card=p.locator('div',{hasText:title}).filter({has:p.locator('button',{hasText:/^(시작|이어서)$/})}).last();
  const b2=card.locator('button').filter({hasText:/시작|이어서/}).first();
  await b2.click(); await p.waitForTimeout(900);
}
export async function ov(p){const t=await text(p); const i=t.indexOf('닫기 |'); return i>=0?t.slice(i):t}
