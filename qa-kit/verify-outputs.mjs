// 필수 산출물 확인(워크플로 마지막 관문). 사용: node verify-outputs.mjs  (환경변수 QA_OUT=결과 폴더, 기본 out)
// REPORT.md, 결과 JSON, 화면 캡처가 없거나 비어 있으면 실패(종료코드 1).
import fs from 'fs'; import path from 'path';
const OUT=process.env.QA_OUT||'out'; const errs=[];
const rp=path.join(OUT,'REPORT.md');
if(!fs.existsSync(rp)||fs.statSync(rp).size<200) errs.push('REPORT.md가 없거나 비어 있습니다');
const ls=d=>fs.existsSync(d)?fs.readdirSync(d):[];
if(!ls(OUT).some(f=>/^res_.*\.json$/.test(f))) errs.push('결과 JSON(res_*.json)이 없습니다');
const shots=ls(path.join(OUT,'shots'));
if(!shots.some(f=>/\.jpg$/.test(f))) errs.push('휴대폰 화면 캡처(JPG)가 없습니다');
if(!shots.some(f=>/\.png$/.test(f))) errs.push('일차 완료 화면 캡처(PNG)가 없습니다');
if(!ls(OUT).some(f=>/^log_.*\.txt$/.test(f))) errs.push('실행 로그(log_*.txt)가 없습니다');
if(errs.length){errs.forEach(e=>console.error('필수 산출물 누락: '+e)); process.exit(1);}
console.log('필수 산출물 확인 OK');
