const LS='fake_fs';
function load(){try{return JSON.parse(localStorage.getItem(LS)||'{}')}catch(e){return{}}}
function save(m){localStorage.setItem(LS,JSON.stringify(m))}
const subs=[];
function norm(segs){return segs.filter(s=>typeof s==='string').join('/')}
export function doc(db,...segs){const p=norm(segs);return{path:p,id:p.split('/').pop(),isDoc:true}}
export function collection(db,...segs){return{path:norm(segs),isCol:true}}
export function query(c,...r){return{...c,query:true}}
export const where=()=>({}),orderBy=()=>({}),limit=()=>({}),startAfter=()=>({});
export const serverTimestamp=()=>({__ts:1});
export const increment=n=>({__inc:n});
export const arrayUnion=(...v)=>({__au:v});
export const deleteField=()=>({__del:1});
function apply(old,patch,merge){
  const out=merge?{...(old||{})}:{};
  for(const k of Object.keys(patch)){const v=patch[k];
    if(v&&v.__ts)out[k]=Date.now();
    else if(v&&v.__inc!==undefined)out[k]=(Number(out[k])||0)+v.__inc;
    else if(v&&v.__au)out[k]=[...(Array.isArray(out[k])?out[k]:[]),...v.__au];
    else if(v&&v.__del)delete out[k];
    else out[k]=v}
  return out}
function snap(ref,m){const d=m[ref.path];return{id:ref.id,ref,exists:()=>d!==undefined,data:()=>d===undefined?undefined:JSON.parse(JSON.stringify(d))}}
function notify(){const m=load();subs.forEach(s=>{try{s.cb(snap(s.ref,m))}catch(e){console.error(e)}})}
export async function getDoc(ref){return snap(ref,load())}
export const getDocFromServer=getDoc;
export async function setDoc(ref,data,opts){if(localStorage.getItem('fake_fail')==='1'){const e=new Error('fake unavailable');e.code='unavailable';throw e}const m=load();m[ref.path]=apply(m[ref.path],data,!!(opts&&opts.merge));save(m);notify()}
export async function updateDoc(ref,data){const m=load();if(m[ref.path]===undefined)throw new Error('not-found');m[ref.path]=apply(m[ref.path],data,true);save(m);notify()}
export async function addDoc(col,data){const m=load();const id='auto'+Date.now()+Math.random().toString(36).slice(2,6);m[col.path+'/'+id]=apply({},data,false);save(m);notify();return{id}}
export async function deleteDoc(ref){const m=load();delete m[ref.path];save(m);notify()}
export async function getDocs(q){const m=load();const pre=q.path+'/';const docs=Object.keys(m).filter(k=>k.startsWith(pre)&&!k.slice(pre.length).includes('/')).map(k=>snap({path:k,id:k.split('/').pop()},m));return{docs,empty:!docs.length,size:docs.length,forEach:f=>docs.forEach(f)}}
export function onSnapshot(ref,cb,err){
  if(ref.isDoc){const s={ref,cb};subs.push(s);setTimeout(()=>cb(snap(ref,load())),0);return()=>{const i=subs.indexOf(s);if(i>=0)subs.splice(i,1)}}
  setTimeout(async()=>{const r=await getDocs(ref);cb(r)},0);return()=>{}}
export const getFirestore=()=>({});
