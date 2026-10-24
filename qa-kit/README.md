# 한글 친구 화면 자동 검사 키트 (pack4)

후보 App 파일을 가짜 로그인·가짜 저장소로 빌드해, 13개 팩의 1·2·3일차를
휴대폰(360px)과 PC(1280px)로 끝까지 자동으로 풀어 봅니다. 무엇을 세는지는 TEST-SPEC.md 참고.

## 실행 (Node 18+ 필요, Windows PowerShell·Mac 모두 가능)
    node run.mjs <한글친구 프로젝트 폴더> <후보 App 파일> [팩id ...]
예) node run.mjs C:\hangeul-chingu C:\Downloads\App_V600.jsx
    node run.mjs C:\hangeul-chingu C:\Downloads\App_V600.jsx culture09   (한 팩만)
- 프로젝트 폴더에는 npm install이 되어 있어야 합니다(node_modules 필요).
- 처음 한 번은 검사 도구(playwright) 설치가 자동으로 진행됩니다(몇 분).
- 끝나면 out/REPORT.md(판정·실패 목록)와 out/shots/(화면 캡처)가 생깁니다.
- 후보 파일과 프로젝트 소스는 수정하지 않습니다(작업 복사본 사용).

## 한계
화면 크기 에뮬레이션입니다. 실기기 통과가 아닙니다. 앱의 문항 구조가 바뀌면 검사 도구도 손봐야 합니다.

## pack4 추가 도구
    node verify-outputs.mjs                       필수 산출물(REPORT.md·결과·캡처·로그) 확인, 없으면 실패
    node neg.mjs <프로젝트 폴더> <App 파일> [팩id]   일부러 망가뜨린 경우를 도구가 잡는지 확인(QA-NEG)
기준은 expect.json, 설명은 TEST-SPEC.md의 "업데이트 3".
