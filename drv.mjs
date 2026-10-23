import {open,toHome,btn,openPack,ov} from './lib.mjs';
import fs from 'fs';
export const ALL=JSON.parse(fs.readFileSync(new URL('./packs.json',import.meta.url),'utf8'));
export const N=s=>s.replace(/[\s|_]+/g,'');
export const sleep=(p,ms)=>p.waitForTimeout(ms);
export function find(P,head,kind){return P.items.find(it=>it.kind===kind&&N(head).includes(N(it.q)));}
export async function head(p){const t=await ov(p);const i=t.indexOf('📚');return i>0?t.slice(0,i):t.slice(0,600);}
