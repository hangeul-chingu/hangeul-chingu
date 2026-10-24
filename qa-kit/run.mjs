// 사용법: node run.mjs <한글친구 프로젝트 폴더> <후보 App 파일> [팩id ...]
// Windows(PowerShell)·Mac 모두 동작. bash/python 필요 없음.
import fs from 'fs'; import path from 'path'; import crypto from 'crypto'; import http from 'http'; import {spawn,spawnSync} from 'child_process';
import {fileURLToPath} from 'url';
const CWD=process.cwd(); const KIT=path.dirname(fileURLToPath(import.meta.url)); process.chdir(KIT);
const [repoArg,candArg,...ids0]=process.argv.slice(2);
if(!repoArg||!candArg){console.log('사용법: node run.mjs <프로젝트 폴더> <후보 App 파일> [팩id ...]');process.exit(2);}
const REPO=path.resolve(CWD,repoArg), CAND=path.resolve(CWD,candArg);
const sh=(cmd,args,opt={})=>{const r=spawnSync(cmd,args,{stdio:'inherit',shell:process.platform==='win32',...opt}); if(r.status){console.error('실패:',cmd,args.join(' '));process.exit(r.status);}};
if(!fs.existsSync(path.join(REPO,'node_modules','vite'))){console.error('프로젝트 폴더에 node_modules가 없습니다. 그 폴더에서 npm install을 먼저 하세요.');process.exit(2);}
if(!fs.existsSync('node_modules/playwright')){console.log('검사 도구(playwright) 설치 중... 처음 한 번만 몇 분 걸립니다');sh('npm',['i','--no-audit','--no-fund','playwright']);sh('npx',['playwright','install','chromium']);}
fs.rmSync('out',{recursive:true,force:true});fs.rmSync('work',{recursive:true,force:true});fs.rmSync('dist',{recursive:true,force:true});
fs.mkdirSync('out/shots',{recursive:true});fs.mkdirSync('work',{recursive:true});
for(const f of ['index.html','package.json','vite.config.js','public','src']){const s=path.join(REPO,f); if(fs.existsSync(s)) fs.cpSync(s,path.join('work',f),{recursive:true});}
fs.symlinkSync(path.join(REPO,'node_modules'),path.join('work','node_modules'),'junction');
fs.copyFileSync(CAND,'work/src/App.jsx'); fs.writeFileSync('out/spec.json',JSON.stringify({appFile:path.basename(CAND),appSha256:crypto.createHash('sha256').update(fs.readFileSync(CAND)).digest('hex'),startedAt:new Date().toISOString()})); fs.copyFileSync('vite.qa.config.mjs','work/vite.qa.config.mjs');
sh('node',['extract-packs.mjs','work/src/App.jsx','packs.json']);
sh('node',[path.join(REPO,'node_modules','vite','bin','vite.js'),'build','--config','work/vite.qa.config.mjs','--logLevel','error'],{env:{...process.env,QA_KIT:KIT,QA_WORK:path.join(KIT,'work')}});
// 정적 서버
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
const srv=http.createServer((q,r)=>{let f=path.join(KIT,'dist',decodeURIComponent(q.url.split('?')[0])); if(!fs.existsSync(f)||fs.statSync(f).isDirectory()) f=path.join(KIT,'dist','index.html'); r.setHeader('Content-Type',mime[path.extname(f)]||'application/octet-stream'); fs.createReadStream(f).pipe(r);}).listen(5198,'127.0.0.1');
const packs=JSON.parse(fs.readFileSync('packs.json','utf8')); const ids=ids0.length?ids0:packs.map(p=>p.id);
const jobs=[]; for(const id of ids){const t=packs.find(p=>p.id===id)?.title; if(!t){console.error('없는 팩:',id);continue;} jobs.push([id,t,360,740,'m360']);jobs.push([id,t,1280,800,'pc']);if(!process.env.QA_SKIP_EXTRA)jobs.push([id,t,0,0,'x']);}
if(!jobs.some(j=>j[4]!=='x')){console.error('실행할 검사가 0건입니다(팩 id를 확인하세요). 검사를 시작하지 않고 실패로 종료합니다.');process.exit(2);}
let running=0,done=0; const total=jobs.length; fs.writeFileSync('out/expected.txt',String(jobs.filter(j=>j[4]!=='x').length));fs.writeFileSync('out/expected_extra.txt',String(jobs.filter(j=>j[4]==='x').length));
await new Promise(res=>{const next=()=>{ while(running<4&&jobs.length){const [id,t,w,h,tag]=jobs.shift(); running++; const log=fs.openSync(`out/log_${id}_${tag}.txt`,'w');
  const c=spawn('node',tag==='x'?['extra.mjs',id,t,'x']:['e2e.mjs',id,t,String(w),String(h),'1,2,3',tag],{stdio:['ignore',log,log],env:{...process.env,QA_URL:'http://127.0.0.1:5198/'}});
  c.on('close',code=>{running--;done++;console.log(`[${done}/${total}] ${id} ${tag} ${code?'비정상 종료':'완료'}`); next(); if(!running&&!jobs.length) res();});} }; next();});
srv.close(); sh('node',['report.mjs'],{});
