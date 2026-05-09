import { useState, useRef, useEffect, useCallback } from "react";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";

const C = {
  pink:"#FF6B9D", orange:"#FF8C42", yellow:"#FFD93D",
  teal:"#4ECDC4", sky:"#74C0FC", coral:"#FF6B6B",
  purple:"#C3B1E1", bg:"#FFF8F2",
};

const AUTH_ERRORS = {
  "auth/email-already-in-use": "이미 사용 중인 이메일이에요",
  "auth/wrong-password": "비밀번호가 틀렸어요",
  "auth/invalid-credential": "비밀번호가 틀렸어요",
  "auth/user-not-found": "등록되지 않은 이메일이에요. 회원가입 해주세요",
  "auth/weak-password": "비밀번호를 6자 이상으로 입력해주세요",
  "auth/invalid-email": "이메일 형식이 맞지 않아요",
  "auth/network-request-failed": "인터넷 연결을 확인해주세요",
  "auth/too-many-requests": "잠시 후 다시 시도해주세요",
};

function AuthScreen({ onLogin }) {
  const [tab, setTab] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) { setError("이메일과 비밀번호를 입력해주세요"); return; }
    if (tab === "signup" && !name.trim()) { setError("이름을 입력해주세요"); return; }
    setLoading(true); setError("");
    try {
      if (tab === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        await setDoc(doc(db, "users", cred.user.uid), {
          name, email,
          createdAt: serverTimestamp(),
          stats: { speak: 0, write: 0, tutor: 0 },
        });
        onLogin(cred.user);
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        onLogin(cred.user);
      }
    } catch (e) {
      setError(AUTH_ERRORS[e.code] || "오류가 발생했어요. 다시 시도해줘요");
    }
    setLoading(false);
  }

  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(150deg,${C.bg},#FFF0F9 50%,#F0FFFE)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <div style={{fontSize:52,marginBottom:8}}>🇰🇷</div>
      <div style={{fontSize:26,fontWeight:900,color:"#333",marginBottom:4}}>한글 친구</div>
      <div style={{fontSize:13,color:"#888",marginBottom:32,textAlign:"center"}}>이주배경 학습자를 위한 24시간 디지털 브릿지 · Korean Speaking &amp; Writing Trainer</div>
      <div style={{width:"100%",maxWidth:360,background:"white",borderRadius:24,padding:24,boxShadow:"0 8px 32px rgba(0,0,0,.1)"}}>
        <div style={{display:"flex",background:"#f5f5f5",borderRadius:12,padding:4,marginBottom:20}}>
          {[["login","로그인"],["signup","회원가입"]].map(([k,l])=>(
            <button key={k} onClick={()=>{setTab(k);setError("");}} style={{flex:1,padding:"9px 0",border:"none",borderRadius:10,background:tab===k?"white":"transparent",fontWeight:tab===k?800:500,color:tab===k?C.pink:"#999",cursor:"pointer",fontSize:14,transition:"all .2s"}}>{l}</button>
          ))}
        </div>
        {tab==="signup"&&(
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="이름" style={{width:"100%",padding:"13px 16px",borderRadius:12,border:`2px solid ${C.teal}44`,outline:"none",fontSize:15,marginBottom:10,boxSizing:"border-box"}}/>
        )}
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="이메일" type="email" style={{width:"100%",padding:"13px 16px",borderRadius:12,border:`2px solid ${C.pink}44`,outline:"none",fontSize:15,marginBottom:10,boxSizing:"border-box"}}/>
        <input value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} placeholder="비밀번호 (6자 이상)" type="password" style={{width:"100%",padding:"13px 16px",borderRadius:12,border:`2px solid ${C.pink}44`,outline:"none",fontSize:15,marginBottom:error?10:16,boxSizing:"border-box"}}/>
        {error&&<div style={{background:"#FFF0F0",border:"1px solid #FFCCCC",borderRadius:10,padding:"9px 14px",fontSize:13,color:"#E53935",marginBottom:12}}>{error}</div>}
        <button onClick={handleSubmit} disabled={loading} style={{width:"100%",background:`linear-gradient(135deg,${C.pink},${C.orange})`,color:"white",border:"none",borderRadius:50,padding:"14px 0",fontSize:16,fontWeight:900,cursor:"pointer",opacity:loading?0.5:1}}>
          {loading?"처리 중...":tab==="login"?"로그인":"회원가입"}
        </button>
      </div>
      <div style={{marginTop:24,textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
        <div style={{fontSize:12,color:"#bbb",marginBottom:2}}>한글 친구가 처음이세요?</div>
        <a href="https://padlet.com/roh053068/breakout-room/Arng4MkerXZDqK6p-k2qlv36MmRprX5Rx" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:8,background:"white",border:`2px solid ${C.pink}55`,borderRadius:50,padding:"11px 22px",textDecoration:"none",color:C.pink,fontWeight:800,fontSize:14,boxShadow:`0 4px 16px ${C.pink}25`,WebkitTapHighlightColor:"transparent"}}>
          📚 소개자료 · 사용 메뉴얼 보기
        </a>
        <a href="https://padlet.com/roh053068/breakout-room/d6AO26JdBPgP2ojL-k2qlv36MmRprX5Rx" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:8,background:"white",border:`2px solid ${C.teal}55`,borderRadius:50,padding:"11px 22px",textDecoration:"none",color:C.teal,fontWeight:800,fontSize:14,boxShadow:`0 4px 16px ${C.teal}25`,WebkitTapHighlightColor:"transparent"}}>
          ✨ 이 앱이 나한테 어떤 도움이 될까?
        </a>
      </div>
    </div>
  );
}

async function recordStat(uid, field) {
  try {
    const ref = doc(db, "users", uid);
    await updateDoc(ref, { [`stats.${field}`]: increment(1) });
  } catch(e) { console.warn("기록 저장 실패", e); }
}

function StatsModal({ user, onClose }) {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    getDoc(doc(db, "users", user.uid)).then(d => {
      if (d.exists()) setStats(d.data().stats);
    }).catch(() => setStats({ speak:0, write:0, tutor:0 }));
  }, [user.uid]);

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:24}}>
      <div style={{background:"white",borderRadius:24,padding:24,width:"100%",maxWidth:340,boxShadow:"0 8px 32px rgba(0,0,0,.2)"}}>
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:36,marginBottom:6}}>📊</div>
          <div style={{fontSize:18,fontWeight:900,color:"#333"}}>{user.displayName}님의 학습 기록</div>
        </div>
        {stats ? (
          <div style={{display:"flex",gap:12,marginBottom:20}}>
            {[["🗣️","프리토킹",stats.speak,C.pink],["✍️","논술",stats.write,C.teal],["🎓","하이터치",stats.tutor,C.purple]].map(([e,l,v,c])=>(
              <div key={l} style={{flex:1,background:`${c}18`,borderRadius:16,padding:"14px 8px",textAlign:"center"}}>
                <div style={{fontSize:24,marginBottom:4}}>{e}</div>
                <div style={{fontSize:22,fontWeight:900,color:c}}>{v}</div>
                <div style={{fontSize:11,color:"#999",marginTop:2}}>{l}</div>
              </div>
            ))}
          </div>
        ) : <div style={{textAlign:"center",color:"#aaa",padding:"20px 0"}}>불러오는 중...</div>}
        <button onClick={onClose} style={{width:"100%",background:`linear-gradient(135deg,${C.pink},${C.orange})`,color:"white",border:"none",borderRadius:50,padding:"13px 0",fontSize:15,fontWeight:900,cursor:"pointer"}}>닫기</button>
      </div>
    </div>
  );
}

// ============================================================
// ✅ V125: BegScreen — 초급 학습자 전용 화면 (고도화)
// ============================================================
const LANG_LIST = [
  {code:"ko", flag:"🇰🇷", label:"한국어로 시작할게요!"},
  {code:"vi", flag:"🇻🇳", label:"Tiếng Việt"},
  {code:"zh", flag:"🇨🇳", label:"中文"},
  {code:"en", flag:"🇺🇸", label:"English"},
  {code:"ja", flag:"🇯🇵", label:"日本語"},
  {code:"id", flag:"🇮🇩", label:"Bahasa Indonesia"},
  {code:"ru", flag:"🇷🇺", label:"Русский"},
  {code:"th", flag:"🇹🇭", label:"ภาษาไทย"},
  {code:"mn", flag:"🇲🇳", label:"Монгол"},
  {code:"uz", flag:"🇺🇿", label:"O'zbek"},
];

// 주제 카드 — 세종학당 방식 (뇌를 먼저 열기)
const BEG_TOPICS = [
  {id:"intro",    emoji:"👋", ko:"자기소개",      en:"Introduce yourself",    vi:"Giới thiệu bản thân",   hint:"이름, 나라, 직업"},
  {id:"family",   emoji:"👨‍👩‍👧", ko:"가족 이야기",    en:"Talk about family",      vi:"Nói về gia đình",       hint:"엄마, 아빠, 형제"},
  {id:"food",     emoji:"🍜", ko:"음식 주문하기",  en:"Order food",             vi:"Gọi món ăn",            hint:"이거 주세요, 맛있어요"},
  {id:"place",    emoji:"🏪", ko:"장소·위치",      en:"Places & directions",    vi:"Địa điểm & hướng đi",  hint:"어디예요? 여기, 저기"},
  {id:"shopping", emoji:"🛍️", ko:"쇼핑·가격",      en:"Shopping & prices",      vi:"Mua sắm & giá cả",     hint:"얼마예요? 주세요"},
  {id:"work",     emoji:"💼", ko:"직장·일상",      en:"Work & daily life",      vi:"Công việc & cuộc sống", hint:"회사, 일해요, 바빠요"},
];

async function callClaudeSimple(prompt, sys) {
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST",
      headers:{"Content-Type":"application/json","x-api-key":import.meta.env.VITE_ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
      body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:300,system:sys,messages:[{role:"user",content:prompt}]}),
    });
    const d = await r.json();
    return d.content?.map(b=>b.text||"").join("")||"";
  } catch(e) { return ""; }
}

// ✅ V129 수정: BEG_VOCAB — 주제별 실제 관련 어휘만, 무관한 단어 제거
const BEG_VOCAB = {
    "intro": [
      "이름", "나이", "나라", "직업", "학생", "대학생", "고등학생", "중학생",
      "회사원", "선생님", "의사", "간호사", "요리사", "외국인", "외국", "한국",
      "친구", "남자", "여자", "누나", "언니", "오빠", "형", "형제",
      "소개하다", "살다", "일하다", "공부하다", "반갑다", "누구", "어디",
      "우리", "저", "나", "저희"
    ],
    "family": [
      "가족", "부모님", "아버지", "어머니", "아빠", "엄마",
      "남편", "아내", "아들", "딸",
      "형", "누나", "언니", "오빠", "남동생", "여동생", "동생",
      "아기", "아이", "할머니", "할아버지", "친척",
      "부부", "결혼", "결혼식", "손녀"
    ],
    "food": [
      "밥", "국", "국수", "냉면", "라면", "떡볶이",
      "김치", "김치찌개", "된장", "된장찌개", "순두부찌개",
      "갈비", "갈비탕", "불고기", "비빔밥", "삼겹살", "삼계탕", "칼국수",
      "빵", "과일", "고기", "채소", "간식",
      "물", "주스", "커피", "차",
      "맛", "맛있다", "맛없다", "맵다", "달다", "짜다", "시다", "싱겁다",
      "먹다", "마시다", "요리하다", "끓이다", "굽다", "볶다",
      "메뉴", "식당", "음식점", "커피숍", "빵집", "냉장고",
      "배고프다", "배부르다", "주문하다"
    ],
    "place": [
      "여기", "거기", "저기", "앞", "뒤", "옆", "위", "아래",
      "오른쪽", "왼쪽", "이쪽", "저쪽", "근처", "건너편",
      "집", "학교", "병원", "약국", "은행", "시장", "마트",
      "공원", "도서관", "역", "지하철역", "주차장", "수영장",
      "카페", "편의점", "화장실", "체육관",
      "입구", "출구", "층", "계단", "엘리베이터", "건물",
      "버스", "지하철", "택시",
      "가깝다", "멀다", "찾다", "가다", "오다", "있다", "없다", "위치"
    ],
    "shopping": [
      "가게", "시장", "마트", "백화점",
      "돈", "원", "가격", "얼마", "싸다", "비싸다",
      "사다", "팔다", "영수증", "카드", "계산", "할인", "교환",
      "옷", "신발", "가방", "사이즈", "크기", "크다", "작다",
      "색", "색깔", "빨간색", "파란색", "노란색", "초록색",
      "흰색", "검은색", "갈색", "회색",
      "예쁘다", "입다", "신다"
    ],
    "work": [
      "회사", "직장", "사무실", "직원", "사장", "부장", "동료",
      "월급", "출근", "퇴근", "바쁘다", "휴가", "아르바이트",
      "전화", "전화기", "전화번호",
      "일하다", "일주일", "일요일", "점심시간", "출장",
      "회사원", "직업"
    ]
};


function BegScreen({ user, onBack, begSpeak=false, onReady, skipToLearn=false }) {
  const [step, setStep] = useState(skipToLearn ? "learn" : "lang");   // lang → curriculum → plan → topic → learn
  const [lang, setLang] = useState(null);
  const [topic, setTopic] = useState(null);
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const chatBottomRef = useRef(null);

  // ✅ V131: D-Day 학습 계획
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [minPerDay, setMinPerDay] = useState(30);
  const [goalDate, setGoalDate] = useState(null);   // 확정된 목표일 (Date)
  const [studyGoal, setStudyGoal] = useState(null); // ✅ V140: 학습 목표
  const [showResetModal, setShowResetModal] = useState(false);

  // ✅ V145: 발음 화면 state (훅 규칙 — 컴포넌트 최상단에 선언)
  const [pronStep, setPronStep] = useState(0);
  const [josaStep, setJosaStep] = useState(0);   // V147: 조사·대명사 단계
  const [flipped, setFlipped] = useState({});

  // 목표별 기준 시간 (단위: 시간)
  // ⚠️ V142: 근거 탐색 중 — 추후 수정 가능
  const GOAL_HOURS = {
    topik2: 80,   // 초급 완성 (저자 80시간 기준)
    topik4: 160,  // 중급 완성 (근거 탐색 중)
    daily:  80,   // 일상 한국어 (초급 완성으로 충분)
    work:   120,  // 직장·현장 (근거 탐색 중)
    life:   80,   // 한국 생활 적응 (초급 완성으로 충분)
  };

  // 목표별 D-Day 계산
  function calcGoalDate(dpw, mpd, goal) {
    const hours = GOAL_HOURS[goal] ?? 80;
    const totalMin = hours * 60;
    const minPerWeek = dpw * mpd;
    const weeksNeeded = Math.ceil(totalMin / minPerWeek);
    const d = new Date();
    d.setDate(d.getDate() + weeksNeeded * 7);
    return d;
  }

  function formatDate(d) {
    if (!d) return "";
    return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일`;
  }

  function confirmPlan() {
    setGoalDate(calcGoalDate(daysPerWeek, minPerDay, studyGoal));
    // ✅ V145: 목표 그룹에 따라 분기
    // 그룹 A (커리큘럼 순서형): topik2, life → 발음 화면부터
    // 그룹 B (자유 탐색형): topik4, daily, work → 기존 자유 탭 열림
    const groupA = ["topik2", "life"];
    if (groupA.includes(studyGoal)) {
      setStep("pronunciation");
    } else {
      onReady?.();
      setStep("learn");
    }
  }

  function resetDDay() {
    setGoalDate(calcGoalDate(daysPerWeek, minPerDay, studyGoal));
    setShowResetModal(false);
  }

  useEffect(()=>{
    chatBottomRef.current?.scrollIntoView({behavior:"smooth"});
  },[chat, sending]);

  // ✅ V140: topic 없이 learn으로 진입 시 자동으로 마중이 첫 메시지 시작
  useEffect(()=>{
    if (step === "learn" && !topic && chat.length === 0 && !sending) {
      const autoStart = async () => {
        setSending(true);
        const sys = buildSys(null);
        const r = await fetch("https://api.anthropic.com/v1/messages", {
          method:"POST",
          headers:{"Content-Type":"application/json","x-api-key":import.meta.env.VITE_ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
          body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:350,system:sys,messages:[{role:"user",content:"초급 한국어 학습자야. 자기소개부터 자연스럽게 시작해줘. 첫 인사와 함께 이름 묻는 표현을 알려줘."}]}),
        });
        const d = await r.json();
        const msg = d.content?.[0]?.text || "안녕하세요! 😊 저는 마중이에요. 같이 한국어 연습해요! 이름이 뭐예요?";
        setChat([{role:"assistant",text:msg}]);
        setSending(false);
      };
      autoStart();
    }
  },[step]);

  // 언어 선택 → 커리큘럼 미리보기로 이동
  function handleLang(l) {
    setLang(l);
    setStep("curriculum");
  }

  // 주제 선택 → 학습 시작
  async function handleTopic(t) {
    setTopic(t);
    setStep("learn");
    // onReady는 confirmPlan에서 이미 호출됨 (V140)
    setSending(true);

    // 마중이 첫 메시지 — 주제 기반으로 자연스럽게 시작
    const sys = buildSys(t);
    const startPrompt = t
      ? `학습자가 "${t.ko}" 주제를 선택했어. 첫 인사와 함께 이 주제의 첫 번째 한국어 표현 하나를 자연스럽게 알려줘.`
      : `초급 한국어 학습자야. 자기소개부터 자연스럽게 시작해줘. 첫 인사와 함께 이름 묻는 표현을 알려줘.`;
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST",
      headers:{"Content-Type":"application/json","x-api-key":import.meta.env.VITE_ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
      body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:350,system:sys,messages:[{role:"user",content:startPrompt}]}),
    });
    const d = await r.json();
    const reply = d.content?.map(b=>b.text||"").join("")||`${t.emoji} 좋아요! "${t.ko}" 시작해봐요! 😊`;
    setChat([{role:"assistant", text:reply}]);
    setTurnCount(1);
    setSending(false);
  }

  const SITUATION_HINTS = {
    daily:    "학습자는 한국에서 실제로 생활하고 있어요. 집 근처, 가게, 이웃과의 대화 등 생활 속 상황에서 바로 쓸 수 있는 표현 중심으로 가르쳐 주세요.",
    work:     "학습자는 한국 직장이나 공사 현장에서 일하고 있어요. 동료 대화, 일 지시, 안전 표현 등 현장에서 바로 쓸 수 있는 표현을 우선해 주세요.",
    topik:    "학습자는 TOPIK 1~2급을 목표로 공부하고 있어요. 시험에 자주 나오는 어휘와 표현을 자연스럽게 연습시켜 주세요.",
    kculture: "학습자는 K팝·드라마·음식 등 K컬처에 관심이 많아요. 드라마 표현·한국 음식 이름 등을 자연스럽게 대화에 녹여 주세요.",
    overseas: "학습자는 해외에서 한국어를 배우는 재외동포 또는 K컬처 팬이에요. 한국 문화 이해와 기초 회화 표현을 친근하게 알려 주세요.",
  };

  function buildSys(t) {
    const topicName = t?.ko || "자기소개";
    const langLabel = lang?.label || "한국어";
    const isKo = lang?.code === "ko";
    const topicVocab = BEG_VOCAB[t?.id] || [];
    const vocabList = topicVocab.join(", ");
    return `[페르소나] 이름: 마중. 초급 한국어 학습자의 첫 친구이자 따뜻한 안내자.

[현재 주제] ${topicName} (${t?.hint||""})

[언어 원칙]
- 설명: ${isKo ? "한국어" : langLabel}로
- 학습 내용(한국어 표현): 반드시 한국어로
- 한국어 표현 옆에 항상 발음과 뜻을 함께 표기

[어휘 수준 제한 — 가장 중요한 원칙]
아래는 2017년 국제통용 한국어 표준 교육과정 1·2급(초급) 인증 어휘 목록이야.
마중이가 학습자에게 가르치거나 발화할 한국어 표현은 반드시 이 목록 범위 안에서만 선택해야 해.
이 목록에 없는 어휘는 절대 학습 표현으로 제시하지 마.
단, 조사(은/는/이/가/을/를/에/에서/으로/와/과/도)와 기본 어미(아요/어요/습니다/세요)는 자유롭게 사용 가능.

✅ 허용 어휘 목록 (${topicVocab.length}개):
${vocabList}

[학습 흐름 — 반드시 이 순서를 지켜라]
1. 허용 어휘 안에서 표현 1개 제시 (예: "안녕하세요!")
2. 발음 힌트 + 뜻 설명
3. "따라 해봐요! 😊" 로 학습자 발화 유도
4. 학습자 답변 → 칭찬 → 짧은 교정(있으면) → 다음 표현 1개
5. 3~4개 표현 익히면 → 아래 문법 단계로 자연스럽게 연결

[✅ V133 문법 단계 — 초급 서술어 커리큘럼 (단원 순서대로 자연스럽게 사용)]
학습자가 어휘를 익히면 아래 문법 표현을 대화 속에 녹여서 단계적으로 연습시켜. 문법 용어는 절대 말하지 말고, 자연스러운 대화 상황으로 유도해.

● 기초 (1~8단원): 이에요/이다, 있다/없다, 형용사, 세요, 그리고/그런데, 고 있다, 같이 해요
● 가능/희망 (9~11단원): -(으)ㄹ 수 있어요 / 하고 싶어요 / ~으면 좋겠어요
● 부정/허락 (12~13단원): 안/못 해요 / ~아도 돼요? / ~면 안 돼요 / ~아야 해요
● 경험 (14단원): ~은 적 있어요? / ~은 적 없어요
  예: "한국 음식 먹은 적 있어요? 😊"
● 도움 (15~16단원): ~아/어 줄게요 / ~아/어 주세요
  예: "제가 도와줄게요! 😊" / "한 번 더 말해 주세요"
● 추측 (17단원): ~은/ㄴ 것 같아요 / ~는 것 같아요 / ~을/ㄹ 것 같아요
  예: "오늘 비가 올 것 같아요" / "지금 바쁜 것 같아요"
● 공감·추측 (18단원): 형용사 + ~겠습니다·~겠어요
  예: "배고프시겠어요" / "많이 힘드시겠어요 😊"
● 계획·임박 (19단원): ~(으)려고 하다
  예: "내년에 한국 유학을 가려고 해요" / "지금 막 출발하려고 해요"
● 감탄·새발견 (20단원): ~네요 / ~군요 / ~구나
  예: "정말 잘했네요! 😊" / "한국어가 많이 늘었네요!"
● 확인 (21단원): ~지요? / ~죠?
  예: "한국어 공부하고 있죠? 😊" / "이거 맞죠?"
● 상태1 (22단원): 동사 + ~아/어 있다 (완료→지속)
  예: "문이 열려 있어요" / "지금 앉아 있어요"
● 상태2 (23단원): 착용동사 + ~고 있다
  예: "빨간 옷을 입고 있어요" / "가방을 들고 있어요"
● 결정·결심·약속 (24단원): ~기로 하다
  예: "같이 공부하기로 해요!" / "한국어를 열심히 하기로 했어요"
● 기간·시간·돈 (25단원): ~ㄴ지 + 시간 + 되다 / 걸리다 / 들다
  예: "한국어 배운 지 얼마나 됐어요?" / "여기까지 얼마나 걸려요?"

[✅ V135 부사어 — 대화 속에서 자연스럽게 활용해]
서술어 문법을 익힌 학습자에게 아래 부사어 표현을 대화 흐름에 맞게 하나씩 녹여줘. 문법 용어 없이, 상황으로만 유도해.

▶ 시간 표현
- ~ㄹ/을 때: "공부할 때 뭐 들어요? 😊"
- 명사+전에 / ~기 전에: "자기 전에 뭐 해요?"
- 명사+후에 / ~ㄴ 후에: "밥 먹은 후에 산책해요?"
- ~고 (순서): "씻고 자요? 아니면 자고 씻어요? 😄"
- 명사+동안 / ~는 동안: "한국어 배운 동안 어땠어요?"
- ~아/어서 (순서): "카페에 가서 뭐 했어요?"
- ~면서 (동시): "음악 들으면서 공부해요?"
- ~자마자 (즉시): "집에 오자마자 뭐 해요?"
- ~부터 ~까지: "몇 시부터 몇 시까지 일해요?"
- ~다가 (전환): "공부하다가 졸렸어요? 😄"

▶ 원인 표현
- 명사+때문에: "요즘 바빠요? 뭐 때문에요?"
- 명사+덕분에: "한국어 덕분에 좋은 일 있었어요?"
- ~아/어서 (이유): "왜 한국어 배워요? 좋아서요? 😊"
- ~(으)니까: "피곤하니까 오늘은 짧게 해요!"

▶ 목적 표현
- ~위해서: "뭘 위해서 한국어 공부해요?"
- ~려고: "취직하려고 배워요? 여행하려고요?"
- ~(으)러 (이동): "어디 가요? — 밥 먹으러 가요!"

▶ 조건/필수조건
- ~(으)면: "시간 있으면 뭐 하고 싶어요?"
- ~(으)려면 ~아야 해요: "한국어 잘하려면 매일 연습해야 해요! 😊"

▶ 양보
- ~아/어도: "바빠도 한글 친구랑 매일 얘기해요! 💪"

▶ 배경·상황
- ~는데 / ~은/ㄴ데: "비가 오는데 우산 있어요?"

[✅ V136 기타 표현 — 대화 속에서 자연스럽게 활용해]
아래 표현들도 학습자 수준에 맞게 대화에 자연스럽게 녹여줘.

▶ 비교·최상급
- ~보다 더: "한국어가 영어보다 더 어려워요?"
- 제일/가장: "한국 음식 중에 제일 좋아하는 게 뭐예요?"

▶ 쯤·정도 (어림)
- ~쯤 / ~정도: "몇 시간쯤 자요? 하루에 한국어 얼마나 공부해요?"

▶ 만·밖에 (한정·부정)
- ~만: "한국어만 공부해요, 아니면 다른 것도요?"
- ~밖에 + 부정: "시간이 10분밖에 없어요 → 그럼 빨리 해봐요! 😊"

▶ 빈도부사
- 항상·자주·가끔·거의·전혀: "한국 드라마 자주 봐요? 가끔요?"

▶ 변화 표현
- ~아/어지다 (상태 변화): "한국어가 점점 늘어지고 있어요! 😊"
- ~게 되다 (자연스러운 변화): "어떻게 한국어를 좋아하게 됐어요?"

▶ 존칭
- 선생님·어른께: "드리다/여쭤보다/뵙다" 자연스럽게 유도
- 예: "선생님께 드릴 거예요? 아니면 친구에게 줄 거예요?"

▶ 간접화법
- ~라고 했어요 / ~(으)라고 했어요: "친구가 뭐라고 했어요?"
- ~(으)ㄹ 거라고 했어요: "언제 온다고 했어요?"

▶ 관형어 (문장을 꾸미는 표현)
- 동사+는/ㄴ/ㄹ + 명사: "지금 먹는 음식이 뭐예요?" / "어제 만난 친구요?" / "내일 할 일이 있어요?"
- 형용사+ㄴ/은 + 명사: "맛있는 음식, 예쁜 사람, 바쁜 하루"

[절대 금지]
- 한 번에 2개 이상 표현 가르치기 ❌
- 어려운 문법 용어 사용 ❌ (예: 연결어미, 종결어미, 불규칙 등)
- 틀렸을 때 부정적 반응 ❌
- 허용 어휘 목록 밖의 한국어 단어를 학습 표현으로 제시하기 ❌
- 상황 설명이나 대화 유도 시에도 어려운 한자어 금지 ❌

[분위기] 친구에게 말하듯 밝고 따뜻하게. 틀려도 "잘했어요! 조금만 고치면 완벽해요 😊".

[출력 형식 — 반드시 지켜라]
- 마크다운 절대 금지: 표, 헤더(#), 구분선(---), 코드블록 사용 금지
- 친구에게 문자 보내듯 짧고 자연스러운 문장으로만 대화해
- 예문은 줄바꿈으로 자연스럽게 보여줘. 따옴표나 화살표(→)로 간단히 표시해도 좋아
- 이모지는 자연스럽게 1~2개 정도만

[✅ V137 답변량 제한 — 초급 인지과부하 방지]
- 한 번 응답에 최대 80자 이내로 짧게 끊어라
- 예문은 1개만. 절대 2개 이상 연속으로 주지 마
- 설명 후 반드시 학습자에게 질문 1개로 공을 넘겨라
- 학습자가 더 알고 싶으면 스스로 물어보게 유도해
- "더 알고 싶어요?" 같은 유도 문구 금지 — 자연스러운 질문으로 끝내라`;
  }

  // ✅ V129 수정: 퀴즈 — "이 중 주제 단어가 아닌 것은?" 형식
  function makeQuiz(t) {
    const vocab = BEG_VOCAB[t?.id] || [];
    if (vocab.length < 3) return null;

    // 정답 주제 단어 3개 (같은 주제)
    const shuffled = [...vocab].sort(() => Math.random() - 0.5);
    const correct3 = shuffled.slice(0, 3);

    // 오답 1개 (다른 주제 어휘)
    const otherVocab = Object.entries(BEG_VOCAB)
      .filter(([id]) => id !== t?.id)
      .flatMap(([, words]) => words);
    const wrong1 = otherVocab.sort(() => Math.random() - 0.5)[0];

    if (!wrong1) return null;

    const options = [...correct3, wrong1].sort(() => Math.random() - 0.5);

    return {
      type: "quiz",
      question: `✨ 잠깐 연습해요!\n다음 중 어울리지 않는 단어는?`,
      answer: wrong1,
      options,
      selected: null,
    };
  }

  // 학습 채팅
  async function handleSend() {
    if (!input.trim() || sending) return;
    const userMsg = {role:"user", text:input.trim()};
    const newChat = [...chat, userMsg];
    setChat(newChat);
    setInput("");
    setSending(true);

    const sys = buildSys(topic);
    const msgs = newChat.filter(m=>m.type!=="quiz").map(m=>({role:m.role==="user"?"user":"assistant", content:m.text}));
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST",
      headers:{"Content-Type":"application/json","x-api-key":import.meta.env.VITE_ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
      body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:350,system:sys,messages:msgs}),
    });
    const d = await r.json();
    const reply = d.content?.map(b=>b.text||"").join("")||"다시 한번 해봐요! 😊";
    const nextTurn = turnCount + 1;
    // ✅ V129: 5턴마다 퀴즈 카드 삽입
    if (nextTurn % 5 === 0) {
      const quiz = makeQuiz(topic);
      setChat(p=>[...p, {role:"assistant", text:reply}, ...(quiz ? [quiz] : [])]);
    } else {
      setChat(p=>[...p, {role:"assistant", text:reply}]);
    }
    setTurnCount(nextTurn);
    setSending(false);
  }

  // ✅ V129: 퀴즈 답 선택 처리
  function handleQuizAnswer(qIdx, opt) {
    setChat(prev => prev.map((m, i) => {
      if (i !== qIdx || m.type !== "quiz") return m;
      const correct = opt === m.answer;
      return {...m, selected: opt};
    }));
    // 정답/오답 마중이 반응 메시지
    const q = chat[qIdx];
    if (!q) return;
    const correct = opt === q.answer;
    const reaction = correct
      ? `정답이에요! 🎉 "${q.answer}"은(는) 어울리지 않는 단어예요! 정말 잘했어요! 😊`
      : `아쉽지만 괜찮아요! 😊 "${q.answer}"이(가) 어울리지 않는 단어예요. 나머지 셋은 모두 잘 어울리는 말이에요! 다시 기억해봐요 💪`;
    setChat(p=>[...p, {role:"assistant", text:reaction}]);
  }

  // ── 언어 선택 화면 ──
  if (step === "lang") return (
    <div style={{minHeight:begSpeak?"auto":"100vh",background:begSpeak?"transparent":`linear-gradient(150deg,${C.bg},#F3EEFF)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:begSpeak?"flex-start":"center",padding:begSpeak?"8px 0":"24px",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      {!begSpeak && <><div style={{fontSize:48,marginBottom:8}}>🌸</div>
      <div style={{fontSize:22,fontWeight:900,color:"#9C6FDE",marginBottom:4}}>한글 친구</div></>}
      <div style={{background:"white",borderRadius:18,padding:"18px 16px",boxShadow:"0 4px 18px rgba(0,0,0,.07)",marginBottom:14,textAlign:"center",width:"100%"}}>
        <div style={{fontSize:28,marginBottom:6}}>🌍</div>
        <div style={{fontSize:17,fontWeight:900,color:"#333",marginBottom:4}}>언어를 선택해 주세요</div>
        <div style={{fontSize:13,color:"#999"}}>Select your language</div>
      </div>
      <div style={{width:"100%",maxWidth:360,display:"flex",flexDirection:"column",gap:10}}>
        {LANG_LIST.map(l=>(
          <button key={l.code} onClick={()=>handleLang(l)} style={{background:"white",border:"2px solid #9C6FDE44",borderRadius:16,padding:"14px 20px",cursor:"pointer",display:"flex",alignItems:"center",gap:12,fontSize:16,fontWeight:700,color:"#333",boxShadow:"0 2px 10px rgba(156,111,222,.1)",WebkitTapHighlightColor:"transparent"}}>
            <span style={{fontSize:24}}>{l.flag}</span>
            <span>{l.label}</span>
          </button>
        ))}
      </div>
      {!begSpeak && <button onClick={onBack} style={{marginTop:20,background:"none",border:"none",color:"#ccc",fontSize:13,cursor:"pointer"}}>← 뒤로</button>}
    </div>
  );

  // ── D-Day 학습 계획 화면 (V131 신규) ──
  // ── 80시간 커리큘럼 미리보기 화면 ──
  if (step === "curriculum") {
    const items = [
      { emoji:"🔤", label:"발음 · 모음 · 자음 · 받침 · 연음",                    hours:13, color:"#E8F4FD", border:"#90CAF9" },
      { emoji:"📌", label:"조사 · 대명사",                                           hours: 3, color:"#FFF3E0", border:"#FFCC80" },
      { emoji:"🗣️", label:"서술어 1~25단원 (기초 → 추측 · 결정 · 기간)",             hours:33, color:"#F3EEFF", border:"#CE93D8" },
      { emoji:"⏱️", label:"부사어 (때 · 전에 · 후에 · 면서 · 때문에 · 려고 등)",     hours: 5, color:"#FFF8E1", border:"#FFD54F" },
      { emoji:"📖", label:"기타 표현 (비교 · 존칭 · 간접화법 · 관형어 등)",           hours: 5, color:"#FDE8F5", border:"#F48FB1" },
      { emoji:"💪", label:"통합 실전 훈련 (4회 반복)",                               hours:15, color:"#E8F5E9", border:"#A5D6A7" },
      { emoji:"🏁", label:"마무리 + 예비",                                           hours: 6, color:"#FCE4EC", border:"#F48FB1" },
    ];
    const vi = lang?.code==="vi", en = lang?.code==="en";
    return (
      <div style={{minHeight:begSpeak?"auto":"100vh",background:begSpeak?"transparent":`linear-gradient(150deg,${C.bg},#F3EEFF)`,display:"flex",flexDirection:"column",alignItems:"center",padding:"28px 20px 40px",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <div style={{fontSize:36,marginBottom:8,marginTop:begSpeak?0:12}}>📚</div>
        <div style={{fontSize:18,fontWeight:900,color:"#9C6FDE",marginBottom:4,textAlign:"center"}}>
          {vi?"80 giờ của bạn!":en?"Your 80 Hours!":"나의 80시간 커리큘럼"}
        </div>
        <div style={{fontSize:13,color:"#aaa",marginBottom:22,textAlign:"center"}}>
          {vi?"Đây là những gì bạn sẽ học trong 80 giờ!":en?"Here's what you'll learn in 80 hours!":"80시간 동안 이걸 배워요! 🌏"}
        </div>

        {/* 커리큘럼 카드 */}
        <div style={{width:"100%",maxWidth:360,display:"flex",flexDirection:"column",gap:10,marginBottom:18}}>
          {items.map((it,i)=>(
            <div key={i} style={{background:it.color,border:`2px solid ${it.border}`,borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",gap:12}}>
              <div style={{fontSize:24,minWidth:32,textAlign:"center"}}>{it.emoji}</div>
              <div style={{flex:1,fontSize:13,fontWeight:800,color:"#444",lineHeight:1.4}}>{it.label}</div>
              <div style={{background:"white",borderRadius:50,padding:"4px 10px",fontSize:12,fontWeight:900,color:"#9C6FDE",whiteSpace:"nowrap",boxShadow:"0 2px 6px rgba(0,0,0,.08)"}}>{it.hours}h</div>
            </div>
          ))}
          {/* 합계 */}
          <div style={{background:"linear-gradient(135deg,#9C6FDE,#C084FC)",borderRadius:16,padding:"14px 16px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontSize:14,fontWeight:900,color:"white"}}>🎯 {vi?"Tổng cộng":en?"Total":"합계"}</div>
            <div style={{fontSize:18,fontWeight:900,color:"white"}}>80h</div>
          </div>
        </div>

        {/* 약속 문구 */}
        <div style={{width:"100%",maxWidth:360,background:"white",borderRadius:16,padding:"14px 18px",marginBottom:22,textAlign:"center",boxShadow:"0 2px 12px rgba(156,111,222,.10)"}}>
          <div style={{fontSize:12,color:"#9C6FDE",fontWeight:800,marginBottom:4}}>💜 한글 친구의 약속</div>
          <div style={{fontSize:12,color:"#666",lineHeight:1.6}}>
            {vi?"80 giờ của bạn sẽ mở ra một thế giới mới.":en?"Your 80 hours will open a new world.":"당신의 80시간은 새로운 세상을 열어줍니다."}
          </div>
        </div>

        <button onClick={()=>setStep("plan")}
          style={{width:"100%",maxWidth:360,background:"linear-gradient(135deg,#9C6FDE,#C084FC)",color:"white",border:"none",borderRadius:50,padding:"15px 0",fontSize:16,fontWeight:900,cursor:"pointer",boxShadow:"0 4px 16px #9C6FDE44",WebkitTapHighlightColor:"transparent"}}>
          {vi?"Tiếp theo! →":en?"Next! →":"학습 계획 세우기 →"}
        </button>
        <button onClick={()=>setStep("lang")} style={{marginTop:14,background:"none",border:"none",color:"#ccc",fontSize:13,cursor:"pointer"}}>← 뒤로</button>
      </div>
    );
  }

  if (step === "plan") {
    const preview = calcGoalDate(daysPerWeek, minPerDay, studyGoal);
    return (
      <div style={{minHeight:begSpeak?"auto":"100vh",background:begSpeak?"transparent":`linear-gradient(150deg,${C.bg},#F3EEFF)`,display:"flex",flexDirection:"column",alignItems:"center",padding:"28px 24px",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <div style={{fontSize:36,marginBottom:8,marginTop:begSpeak?0:16}}>🎯</div>
        <div style={{fontSize:18,fontWeight:900,color:"#9C6FDE",marginBottom:4,textAlign:"center"}}>나만의 학습 계획</div>
        <div style={{fontSize:13,color:"#aaa",marginBottom:24,textAlign:"center"}}>
          {lang?.code==="vi"?"Hãy đặt kế hoạch học của bạn!":lang?.code==="en"?"Set your learning plan!":"한글 친구와 함께 목표일을 정해요!"}
        </div>

        {/* 목표 선택 */}
        <div style={{width:"100%",maxWidth:360,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:800,color:"#9C6FDE",marginBottom:10,textAlign:"center"}}>
            🎯 {lang?.code==="vi"?"Mục tiêu của bạn là gì?":lang?.code==="en"?"What's your goal?":"나의 목표를 선택해요!"}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[
              {id:"topik2", emoji:"🏆", label:lang?.code==="vi"?"Đạt TOPIK cấp 2":lang?.code==="en"?"Achieve TOPIK Level 2":"TOPIK 2급 달성하기"},
              {id:"topik4", emoji:"🏆", label:lang?.code==="vi"?"Đạt TOPIK cấp 4":lang?.code==="en"?"Achieve TOPIK Level 4":"TOPIK 4급 달성하기"},
              {id:"daily", emoji:"💬", label:lang?.code==="vi"?"Nói tiếng Hàn hàng ngày tự do":lang?.code==="en"?"Speak Korean freely in daily life":"일상 한국어 자유롭게 말하기"},
              {id:"work",  emoji:"💼", label:lang?.code==="vi"?"Tiếng Hàn công việc":lang?.code==="en"?"Korean for work":"직장·현장 한국어 익히기"},
              {id:"life",  emoji:"🏠", label:lang?.code==="vi"?"Thích nghi cuộc sống Hàn Quốc":lang?.code==="en"?"Adapt to life in Korea":"한국 생활 적응하기"},
            ].map(g=>(
              <button key={g.id} onClick={()=>setStudyGoal(g.id)}
                style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",borderRadius:14,border:`2px solid ${studyGoal===g.id?"#9C6FDE":"#eee"}`,background:studyGoal===g.id?"#F3EEFF":"white",cursor:"pointer",textAlign:"left",WebkitTapHighlightColor:"transparent",transition:"all .15s"}}>
                <span style={{fontSize:20}}>{g.emoji}</span>
                <span style={{fontSize:13,fontWeight:studyGoal===g.id?800:500,color:studyGoal===g.id?"#9C6FDE":"#555"}}>{g.label}</span>
                {studyGoal===g.id&&<span style={{marginLeft:"auto",color:"#9C6FDE",fontSize:16}}>✓</span>}
              </button>
            ))}
          </div>
        </div>

        <div style={{width:"100%",maxWidth:360,background:"white",borderRadius:20,padding:"22px 20px",boxShadow:"0 4px 20px rgba(156,111,222,.10)",marginBottom:16}}>
          {/* 주 몇 회 */}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:13,fontWeight:800,color:"#9C6FDE",marginBottom:10}}>
              📅 {lang?.code==="vi"?"Mỗi tuần học mấy ngày?":lang?.code==="en"?"How many days per week?":"일주일에 며칠 공부할 수 있어요?"}
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {[1,2,3,4,5,6,7].map(d=>(
                <button key={d} onClick={()=>setDaysPerWeek(d)}
                  style={{width:40,height:40,borderRadius:50,border:`2px solid ${daysPerWeek===d?"#9C6FDE":"#eee"}`,background:daysPerWeek===d?"#9C6FDE":"white",color:daysPerWeek===d?"white":"#aaa",fontWeight:800,fontSize:14,cursor:"pointer",transition:"all .15s"}}>
                  {d}
                </button>
              ))}
            </div>
            <div style={{fontSize:11,color:"#bbb",marginTop:6}}>
              {lang?.code==="vi"?`${daysPerWeek} ngày/tuần`:lang?.code==="en"?`${daysPerWeek} day(s)/week`:`주 ${daysPerWeek}일`}
            </div>
          </div>

          {/* 하루 몇 분 */}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:13,fontWeight:800,color:"#9C6FDE",marginBottom:10}}>
              ⏱️ {lang?.code==="vi"?"Mỗi ngày học bao nhiêu phút?":lang?.code==="en"?"How many minutes per day?":"하루에 몇 분 공부할 수 있어요?"}
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {[15,20,30,45,60,90].map(m=>(
                <button key={m} onClick={()=>setMinPerDay(m)}
                  style={{padding:"8px 14px",borderRadius:50,border:`2px solid ${minPerDay===m?"#9C6FDE":"#eee"}`,background:minPerDay===m?"#9C6FDE":"white",color:minPerDay===m?"white":"#aaa",fontWeight:800,fontSize:13,cursor:"pointer",transition:"all .15s"}}>
                  {m}분
                </button>
              ))}
            </div>
          </div>

          {/* D-Day 미리보기 */}
          <div style={{background:"linear-gradient(135deg,#9C6FDE15,#C084FC15)",borderRadius:14,padding:"16px",textAlign:"center"}}>
            <div style={{fontSize:12,color:"#aaa",marginBottom:4}}>
              {lang?.code==="vi"?"Ngày hoàn thành dự kiến":lang?.code==="en"?"Estimated completion date":"목표 완주일"}
            </div>
            <div style={{fontSize:20,fontWeight:900,color:"#9C6FDE"}}>{formatDate(preview)}</div>
            {studyGoal&&<div style={{fontSize:12,color:"#9C6FDE",fontWeight:700,marginTop:6,background:"#9C6FDE18",borderRadius:8,padding:"4px 10px",display:"inline-block"}}>
              {[{id:"topik2",label:"TOPIK 2급 달성"},{id:"topik4",label:"TOPIK 4급 달성"},{id:"daily",label:"일상 한국어 말하기"},{id:"work",label:"직장 한국어 익히기"},{id:"life",label:"한국 생활 적응"}].find(g=>g.id===studyGoal)?.label} 🎯
            </div>}
            <div style={{fontSize:11,color:"#bbb",marginTop:4}}>
              {lang?.code==="vi"?"80 giờ học = thế giới mới!":lang?.code==="en"?"80 hours = a new world!":"80시간 = 새로운 세상! 🌏"}
            </div>
          </div>
        </div>

        <button onClick={confirmPlan}
          style={{width:"100%",maxWidth:360,background:"linear-gradient(135deg,#9C6FDE,#C084FC)",color:"white",border:"none",borderRadius:50,padding:"15px 0",fontSize:16,fontWeight:900,cursor:"pointer",boxShadow:"0 4px 16px #9C6FDE44",WebkitTapHighlightColor:"transparent"}}>
          {lang?.code==="vi"?"Bắt đầu thôi! 🚀":lang?.code==="en"?"Let's go! 🚀":"도전 시작! 🚀"}
        </button>
        <button onClick={()=>setStep("curriculum")} style={{marginTop:14,background:"none",border:"none",color:"#ccc",fontSize:13,cursor:"pointer"}}>← 뒤로</button>
      </div>
    );
  }
  // ── V145: 발음 화면 (그룹 A 전용 — TOPIK 2급, 한국 생활 적응) ──
  if (step === "pronunciation") {
    const vi = lang?.code === "vi";
    const en = lang?.code === "en";

    // 발음 단계 목록
    const PRON_STEPS = [
      { id:"vowel1",  emoji:"🔤", title:vi?"Nguyên âm 1":en?"Vowels 1":"모음 1",
        desc:vi?"14 nguyên âm cơ bản":en?"14 basic vowels":"기본 모음 14개",
        items:[
          {char:"ㅏ", word:"아버지", meaning:vi?"bố":en?"father":"아버지"},
          {char:"ㅑ", word:"야채",   meaning:vi?"rau củ":en?"vegetable":"야채"},
          {char:"ㅓ", word:"어머니", meaning:vi?"mẹ":en?"mother":"어머니"},
          {char:"ㅕ", word:"여행",   meaning:vi?"du lịch":en?"travel":"여행"},
          {char:"ㅗ", word:"오빠",   meaning:vi?"anh trai":en?"older brother":"오빠"},
          {char:"ㅛ", word:"요리",   meaning:vi?"nấu ăn":en?"cooking":"요리"},
          {char:"ㅜ", word:"우리",   meaning:vi?"chúng ta":en?"we/our":"우리"},
          {char:"ㅠ", word:"유리",   meaning:vi?"thủy tinh":en?"glass":"유리"},
          {char:"ㅡ", word:"으쌰",   meaning:vi?"cố lên!":en?"let's go!":"으쌰!"},
          {char:"ㅣ", word:"이름",   meaning:vi?"tên":en?"name":"이름"},
          {char:"ㅐ", word:"개",     meaning:vi?"con chó":en?"dog":"개"},
          {char:"ㅔ", word:"세계",   meaning:vi?"thế giới":en?"world":"세계"},
          {char:"ㅒ", word:"얘기",   meaning:vi?"câu chuyện":en?"story":"얘기"},
          {char:"ㅖ", word:"예쁘다", meaning:vi?"đẹp":en?"pretty":"예쁘다"},
        ],
        tip: vi?"ㅐ và ㅔ nghe gần giống nhau — đừng lo!":en?"ㅐ and ㅔ sound similar — don't worry!":"ㅐ와 ㅔ는 발음이 비슷해요 — 걱정 마세요! 😊"
      },
      { id:"vowel2",  emoji:"🔤", title:vi?"Nguyên âm 2":en?"Vowels 2":"모음 2",
        desc:vi?"Nguyên âm kép — đã quen rồi!":en?"Compound vowels — already familiar!":"복합 모음 — 이미 아는 발음이에요!",
        items:[
          {char:"ㅘ", word:"화요일", meaning:vi?"thứ ba":en?"Tuesday":"화요일"},
          {char:"ㅙ", word:"왜",     meaning:vi?"tại sao":en?"why":"왜"},
          {char:"ㅚ", word:"최고",   meaning:vi?"tốt nhất":en?"the best":"최고"},
          {char:"ㅝ", word:"원하다", meaning:vi?"muốn":en?"to want":"원하다"},
          {char:"ㅞ", word:"웨이터", meaning:vi?"bồi bàn":en?"waiter":"웨이터"},
          {char:"ㅟ", word:"위험",   meaning:vi?"nguy hiểm":en?"danger":"위험"},
          {char:"ㅢ", word:"의사",   meaning:vi?"bác sĩ":en?"doctor":"의사"},
        ],
        tip: vi?"Nguyên âm kép = 2 âm ghép lại — đơn giản thôi!":en?"Compound vowels = 2 sounds combined — simple!":"복합 모음 = 두 소리가 합쳐진 것 — 쉬워요!"
      },
      { id:"ssang", emoji:"💪", title:vi?"Phụ âm đôi":en?"Double consonants":"쌍자음",
        desc:vi?"Mạnh hơn — căng hơn!":en?"Stronger — more tense!":"더 강하게! 긴장음이에요",
        items:[
          {char:"ㄲ", word:"까치",   meaning:vi?"chim ác là":en?"magpie":"까치"},
          {char:"ㄸ", word:"딸기",   meaning:vi?"dâu tây":en?"strawberry":"딸기"},
          {char:"ㅃ", word:"빠르다", meaning:vi?"nhanh":en?"fast":"빠르다"},
          {char:"ㅆ", word:"씩씩하다",meaning:vi?"dũng cảm":en?"brave":"씩씩하다"},
          {char:"ㅉ", word:"짜다",   meaning:vi?"mặn":en?"salty":"짜다"},
        ],
        tip: vi?"Phụ âm đôi = phụ âm bình thường nhưng căng hơn — đừng lo!":en?"Double consonants = same but more tense — just push harder!":"쌍자음 = 같은 자음을 더 강하게! 아는 소리예요 😊"
      },
      { id:"batchim1", emoji:"🧱", title:vi?"Phụ âm cuối 1":en?"Final consonants 1":"받침 1",
        desc:vi?"ㄱ · ㅇ · ㅁ":en?"ㄱ · ㅇ · ㅁ":"ㄱ · ㅇ · ㅁ 받침",
        items:[
          {char:"국", word:"국",     meaning:vi?"canh":en?"soup":"국"},
          {char:"책", word:"책",     meaning:vi?"sách":en?"book":"책"},
          {char:"학교",word:"학교",  meaning:vi?"trường học":en?"school":"학교"},
          {char:"영어",word:"영어",  meaning:vi?"tiếng Anh":en?"English":"영어"},
          {char:"방",  word:"방",    meaning:vi?"phòng":en?"room":"방"},
          {char:"강",  word:"강",    meaning:vi?"sông":en?"river":"강"},
          {char:"밥",  word:"밥",    meaning:vi?"cơm":en?"rice":"밥"},
          {char:"몸",  word:"몸",    meaning:vi?"cơ thể":en?"body":"몸"},
          {char:"봄",  word:"봄",    meaning:vi?"mùa xuân":en?"spring":"봄"},
        ],
        tip: vi?"Phụ âm cuối = âm nhẹ ở cuối — chỉ cần khép miệng!":en?"Final consonant = soft sound at the end!":"받침은 마지막에 살짝 닫는 소리예요 😊"
      },
      { id:"batchim2", emoji:"🧱", title:vi?"Phụ âm cuối 2":en?"Final consonants 2":"받침 2",
        desc:vi?"ㅂ · ㄹ · ㄴ":en?"ㅂ · ㄹ · ㄴ":"ㅂ · ㄹ · ㄴ 받침",
        items:[
          {char:"입",  word:"입",    meaning:vi?"miệng":en?"mouth":"입"},
          {char:"집",  word:"집",    meaning:vi?"nhà":en?"house":"집"},
          {char:"앞",  word:"앞",    meaning:vi?"phía trước":en?"front":"앞"},
          {char:"말",  word:"말",    meaning:vi?"ngựa/lời":en?"horse/word":"말"},
          {char:"글",  word:"글",    meaning:vi?"chữ viết":en?"writing":"글"},
          {char:"일",  word:"일",    meaning:vi?"công việc":en?"work":"일"},
          {char:"눈",  word:"눈",    meaning:vi?"mắt/tuyết":en?"eye/snow":"눈"},
          {char:"손",  word:"손",    meaning:vi?"tay":en?"hand":"손"},
          {char:"문",  word:"문",    meaning:vi?"cửa":en?"door":"문"},
        ],
        tip: vi?"ㄹ cuối = lưỡi chạm nhẹ — nghe như L nhẹ!":en?"ㄹ at end = soft L sound!":"ㄹ받침은 혀를 살짝 굴리는 소리예요 😊"
      },
      { id:"batchim3", emoji:"🧱", title:vi?"Phụ âm cuối 3":en?"Final consonants 3":"받침 3",
        desc:vi?"ㄷ · ㅅ · ㅈ · ㅎ 계열":en?"ㄷ · ㅅ · ㅈ · ㅎ group":"ㄷ·ㅅ·ㅈ·ㅎ 계열",
        items:[
          {char:"낮",  word:"낮",    meaning:vi?"ban ngày":en?"daytime":"낮"},
          {char:"꽃",  word:"꽃",    meaning:vi?"hoa":en?"flower":"꽃"},
          {char:"빛",  word:"빛",    meaning:vi?"ánh sáng":en?"light":"빛"},
          {char:"옷",  word:"옷",    meaning:vi?"quần áo":en?"clothes":"옷"},
          {char:"밖",  word:"밖",    meaning:vi?"bên ngoài":en?"outside":"밖"},
          {char:"부엌",word:"부엌",  meaning:vi?"nhà bếp":en?"kitchen":"부엌"},
        ],
        tip: vi?"Nhóm này đều phát âm như ㄷ ở cuối — cùng một âm!":en?"This group all sound like ㄷ at the end — same sound!":"이 계열은 모두 받침에서 ㄷ처럼 소리나요 😊"
      },
      { id:"double", emoji:"🔀", title:vi?"Phụ âm cuối kép":en?"Double final consonants":"겹받침",
        desc:vi?"2 phụ âm — chỉ đọc 1!":en?"2 consonants — only read 1!":"두 개지만 하나만 읽어요!",
        items:[
          {char:"닭",  word:"닭",    meaning:vi?"con gà":en?"chicken":"닭"},
          {char:"삶",  word:"삶",    meaning:vi?"cuộc sống":en?"life":"삶"},
          {char:"읽다",word:"읽다",  meaning:vi?"đọc":en?"to read":"읽다"},
          {char:"젊다",word:"젊다",  meaning:vi?"trẻ":en?"young":"젊다"},
          {char:"넓다",word:"넓다",  meaning:vi?"rộng":en?"wide":"넓다"},
          {char:"많다",word:"많다",  meaning:vi?"nhiều":en?"many":"많다"},
        ],
        tip: vi?"Đừng lo — chỉ cần đọc 1 trong 2 phụ âm!":en?"Don't worry — just read one of the two!":"어렵게 생각 말아요 — 둘 중 하나만 읽어요! 😊"
      },
      { id:"liaison", emoji:"🔗", title:vi?"Liên âm":en?"Liaison":"연음",
        desc:vi?"Kết nối âm — nói tự nhiên hơn!":en?"Sound linking — speak naturally!":"소리가 이어져요 — 실전 발음!",
        items:[
          {char:"국이",  word:"국이",   meaning:vi?"canh (chủ ngữ)":en?"soup (subject)":"국+이"},
          {char:"집에",  word:"집에",   meaning:vi?"ở nhà":en?"at home":"집+에"},
          {char:"옷을",  word:"옷을",   meaning:vi?"quần áo (tân ngữ)":en?"clothes (object)":"옷+을"},
          {char:"밥을",  word:"밥을",   meaning:vi?"cơm (tân ngữ)":en?"rice (object)":"밥+을"},
          {char:"책이",  word:"책이",   meaning:vi?"sách (chủ ngữ)":en?"book (subject)":"책+이"},
          {char:"일이",  word:"일이",   meaning:vi?"công việc":en?"work (subject)":"일+이"},
        ],
        tip: vi?"Khi có nguyên âm theo sau — phụ âm cuối chuyển sang!":en?"When a vowel follows — the final consonant moves over!":"모음이 오면 받침이 다음 음절로 넘어가요 😊"
      },
    ];

    const current = PRON_STEPS[pronStep];

    function playSound(text) {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "ko-KR";
      utter.rate = 0.8;
      utter.pitch = 1;
      window.speechSynthesis.speak(utter);
    }

    return (
      <div style={{minHeight:"100vh", background:`linear-gradient(150deg,${C.bg},#F3EEFF)`, display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 20px 60px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        {/* 헤더 */}
        <div style={{fontSize:32, marginBottom:4}}>{current.emoji}</div>
        <div style={{fontSize:17, fontWeight:900, color:"#9C6FDE", marginBottom:2, textAlign:"center"}}>
          {vi?"Phát âm":en?"Pronunciation":"발음 학습"} — {current.title}
        </div>
        <div style={{fontSize:12, color:"#aaa", marginBottom:6, textAlign:"center"}}>{current.desc}</div>

        {/* 진행 표시 */}
        <div style={{display:"flex", gap:6, marginBottom:16}}>
          {PRON_STEPS.map((s,i)=>(
            <div key={s.id} style={{width:28, height:6, borderRadius:3, background:i===pronStep?"#9C6FDE":i<pronStep?"#C084FC":"#eee", transition:"all .3s"}}/>
          ))}
          <div style={{width:28, height:6, borderRadius:3, background:"#eee"}}/>
          <div style={{fontSize:10, color:"#bbb", marginLeft:4, alignSelf:"center"}}>···</div>
        </div>

        {/* 팁 배너 */}
        <div style={{background:"#F3EEFF", border:"1.5px solid #C084FC44", borderRadius:12, padding:"8px 14px", marginBottom:14, maxWidth:360, width:"100%", fontSize:12, color:"#9C6FDE", fontWeight:600, textAlign:"center"}}>
          💡 {current.tip}
        </div>

        {/* 모음 카드 그리드 */}
        <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, maxWidth:380, width:"100%", marginBottom:20}}>
          {current.items.map((item,i)=>(
            <div key={i} onClick={()=>{ setFlipped(f=>({...f,[i]:!f[i]})); playSound(flipped[i] ? item.char : item.word); }}
              style={{background:flipped[i]?"#9C6FDE":"white", border:`2px solid ${flipped[i]?"#9C6FDE":"#E8E0F8"}`, borderRadius:14, padding:"10px 6px", cursor:"pointer", textAlign:"center", transition:"all .2s", boxShadow:"0 2px 8px #9C6FDE18"}}>
              {flipped[i] ? (
                <>
                  <div style={{fontSize:12, color:"white", fontWeight:700, marginBottom:2, wordBreak:"keep-all"}}>{item.word}</div>
                  <div style={{fontSize:10, color:"rgba(255,255,255,.85)"}}>{item.meaning}</div>
                </>
              ) : (
                <>
                  <div style={{fontSize:34, fontWeight:900, color:"#9C6FDE", marginBottom:2, lineHeight:1.1}}>{item.char}</div>
                  <div style={{fontSize:9, color:"#bbb"}}>탭하세요</div>
                </>
              )}
            </div>
          ))}
        </div>

        <div style={{fontSize:11, color:"#bbb", marginBottom:20, textAlign:"center"}}>
          {vi?"Chạm vào thẻ để xem từ ví dụ":en?"Tap a card to see example word":"카드를 탭하면 예시 단어가 나와요 😊"}
        </div>

        {/* 다음 / 자유학습으로 버튼 */}
        {pronStep < PRON_STEPS.length - 1 ? (
          <button onClick={()=>{setPronStep(p=>p+1); setFlipped({});}}
            style={{width:"100%", maxWidth:360, background:"linear-gradient(135deg,#9C6FDE,#C084FC)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", boxShadow:"0 4px 16px #9C6FDE44"}}>
            {vi?"Tiếp theo →":en?"Next →":"다음 →"} {PRON_STEPS[pronStep+1].title}
          </button>
        ) : (
          <button onClick={()=>{setStep("josa"); setJosaStep(0);}}
            style={{width:"100%", maxWidth:360, background:"linear-gradient(135deg,#00C896,#00A876)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", boxShadow:"0 4px 16px #00C89644"}}>
            {vi?"Bắt đầu học! 🚀":en?"Start learning! 🚀":"학습 시작! 🚀"}
          </button>
        )}

        <button onClick={()=>setStep("plan")} style={{marginTop:12, background:"none", border:"none", color:"#ccc", fontSize:12, cursor:"pointer"}}>← 뒤로</button>
      </div>
    );
  }

  // ── V147: 조사·대명사 화면 (발음 다음 순서 — 3h) ──
  if (step === "josa") {
    const vi = lang?.code === "vi";
    const en = lang?.code === "en";

    const JOSA_STEPS = [
      {
        id: "topic_marker",
        emoji: "🏷️",
        title: vi ? "Trợ từ chủ đề 은/는" : en ? "Topic Marker 은/는" : "은/는 — 주제 조사",
        desc: vi ? "Đánh dấu chủ đề câu" : en ? "Marks the topic of a sentence" : "문장의 주제를 나타내요",
        items: [
          { form: "저는", ex: vi ? "Tôi (thì)..." : en ? "I (as for me)..." : "저는 학생이에요.", note: vi ? "받침 없음 → 는" : en ? "No final consonant → 는" : "받침 없음 → 는" },
          { form: "학생은", ex: vi ? "Học sinh (thì)..." : en ? "Student (as for)..." : "학생은 바빠요.", note: vi ? "받침 있음 → 은" : en ? "Final consonant → 은" : "받침 있음 → 은" },
        ],
        tip: vi ? "은/는 = 'As for...' — giới thiệu chủ đề!" : en ? "은/는 = 'As for...' — introduces the topic!" : "은/는은 '~은/는 말이에요'처럼 주제를 소개해요 😊"
      },
      {
        id: "subject_marker",
        emoji: "👆",
        title: vi ? "Trợ từ chủ ngữ 이/가" : en ? "Subject Marker 이/가" : "이/가 — 주격 조사",
        desc: vi ? "Đánh dấu chủ ngữ thực hiện hành động" : en ? "Marks who/what does the action" : "동작·상태의 주체를 나타내요",
        items: [
          { form: "친구가", ex: vi ? "Bạn bè (làm gì đó)..." : en ? "Friend (does)..." : "친구가 와요.", note: vi ? "받침 없음 → 가" : en ? "No final consonant → 가" : "받침 없음 → 가" },
          { form: "책이", ex: vi ? "Sách (ở đâu đó)..." : en ? "Book (is)..." : "책이 있어요.", note: vi ? "받침 있음 → 이" : en ? "Final consonant → 이" : "받침 있음 → 이" },
        ],
        tip: vi ? "이/가 = ai/cái gì thực hiện hành động!" : en ? "이/가 = who/what does the action!" : "이/가는 동작·상태의 주인공을 가리켜요 😊"
      },
      {
        id: "object_marker",
        emoji: "🎯",
        title: vi ? "Trợ từ tân ngữ 을/를" : en ? "Object Marker 을/를" : "을/를 — 목적격 조사",
        desc: vi ? "Đánh dấu tân ngữ (đối tượng bị tác động)" : en ? "Marks the object of an action" : "동작의 대상을 나타내요",
        items: [
          { form: "밥을", ex: vi ? "Ăn cơm" : en ? "Eat rice" : "밥을 먹어요.", note: vi ? "받침 있음 → 을" : en ? "Final consonant → 을" : "받침 있음 → 을" },
          { form: "커피를", ex: vi ? "Uống cà phê" : en ? "Drink coffee" : "커피를 마셔요.", note: vi ? "받침 없음 → 를" : en ? "No final consonant → 를" : "받침 없음 → 를" },
        ],
        tip: vi ? "을/를 = danh từ bị tác động bởi hành động!" : en ? "을/를 = the noun the action affects!" : "을/를은 '~을/를 해요'처럼 동작의 대상이에요 😊"
      },
      {
        id: "place_marker",
        emoji: "📍",
        title: vi ? "Trợ từ nơi chốn 에/에서" : en ? "Place Markers 에/에서" : "에/에서 — 장소 조사",
        desc: vi ? "에 = ở (trạng thái), 에서 = ở (hành động)" : en ? "에 = location (state), 에서 = location (action)" : "에 = 있는 곳 / 에서 = 행동하는 곳",
        items: [
          { form: "학교에", ex: vi ? "Ở trường (có ai đó)" : en ? "At school (someone is there)" : "학교에 있어요.", note: vi ? "에 = vị trí tồn tại" : en ? "에 = where something exists" : "에 = 존재하는 장소" },
          { form: "학교에서", ex: vi ? "Học ở trường" : en ? "Study at school" : "학교에서 공부해요.", note: vi ? "에서 = nơi xảy ra hành động" : en ? "에서 = where action happens" : "에서 = 행동이 일어나는 장소" },
        ],
        tip: vi ? "에 있다 / 에서 하다 — hãy nhớ cặp này!" : en ? "에 있다 / 에서 하다 — remember this pair!" : "에 있어요 / 에서 해요 — 이 짝을 기억해요! 😊"
      },
      {
        id: "and_marker",
        emoji: "🤝",
        title: vi ? "Trợ từ liên kết 와/과·하고" : en ? "And-Markers 와/과·하고" : "와/과·하고 — 연결 조사",
        desc: vi ? "Nối các danh từ với nhau (và)" : en ? "Connects nouns (and)" : "명사와 명사를 이어줘요",
        items: [
          { form: "친구와", ex: vi ? "Với bạn" : en ? "With a friend" : "친구와 가요.", note: vi ? "받침 없음 → 와 (văn viết)" : en ? "No consonant → 와 (formal)" : "받침 없음 → 와 (격식체)" },
          { form: "선생님하고", ex: vi ? "Với giáo viên" : en ? "With the teacher" : "선생님하고 이야기해요.", note: vi ? "하고 = thông dụng hơn" : en ? "하고 = more casual" : "하고 = 일상 대화에서 자주 써요" },
        ],
        tip: vi ? "하고 dùng được cho cả hai — tiện hơn!" : en ? "하고 works for both — easier in conversation!" : "하고는 받침 상관없이 쓸 수 있어요 — 편리해요! 😊"
      },
      {
        id: "pronouns",
        emoji: "❓",
        title: vi ? "Đại từ nghi vấn" : en ? "Question Pronouns" : "의문 대명사",
        desc: vi ? "5 từ để hỏi trong tiếng Hàn" : en ? "5 question words in Korean" : "한국어 5대 의문 대명사",
        items: [
          { form: "누구", ex: vi ? "Đây là ai?" : en ? "Who is this?" : "누구예요?", note: vi ? "who" : en ? "who" : "사람을 물어볼 때" },
          { form: "언제", ex: vi ? "Khi nào?" : en ? "When?" : "언제 와요?", note: vi ? "when" : en ? "when" : "시간을 물어볼 때" },
          { form: "어디", ex: vi ? "Ở đâu?" : en ? "Where?" : "어디 가요?", note: vi ? "where" : en ? "where" : "장소를 물어볼 때" },
          { form: "무엇/뭐", ex: vi ? "Cái gì?" : en ? "What?" : "뭐예요?", note: vi ? "what" : en ? "what" : "사물을 물어볼 때" },
          { form: "왜", ex: vi ? "Tại sao?" : en ? "Why?" : "왜 그래요?", note: vi ? "why" : en ? "why" : "이유를 물어볼 때" },
        ],
        tip: vi ? "누구·언제·어디·무엇·왜 — học thuộc 5 từ này!" : en ? "누구·언제·어디·무엇·왜 — master these 5!" : "누구·언제·어디·무엇·왜 — 5개만 외우면 끝! 😊"
      },
    ];

    const cur = JOSA_STEPS[josaStep];
    const totalSteps = JOSA_STEPS.length;

    return (
      <div style={{minHeight:"100vh", background:`linear-gradient(150deg,#FFFBF0,#FFF3E0)`, display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px 40px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        {/* 헤더 */}
        <div style={{width:"100%", maxWidth:400, marginBottom:16}}>
          <div style={{fontSize:13, color:"#aaa", marginBottom:6, textAlign:"center"}}>
            {vi?"Bước 2/8 — Trợ từ & Đại từ":en?"Step 2/8 — Particles & Pronouns":"2단계/8단계 — 조사·대명사"}
          </div>
          {/* 진행 바 */}
          <div style={{display:"flex", gap:5, justifyContent:"center", marginBottom:20}}>
            {JOSA_STEPS.map((_,i)=>(
              <div key={i} style={{width:28, height:6, borderRadius:3, background:i===josaStep?"#FF9800":i<josaStep?"#FFB74D":"#eee", transition:"all .3s"}}/>
            ))}
          </div>

          {/* 카드 */}
          <div style={{background:"white", borderRadius:20, padding:"24px 20px", boxShadow:"0 4px 24px #FF980022", border:"2px solid #FFE0B2"}}>
            <div style={{fontSize:32, textAlign:"center", marginBottom:6}}>{cur.emoji}</div>
            <div style={{fontSize:17, fontWeight:900, color:"#E65100", textAlign:"center", marginBottom:4}}>{cur.title}</div>
            <div style={{fontSize:13, color:"#aaa", textAlign:"center", marginBottom:18}}>{cur.desc}</div>

            {/* 예시 항목 */}
            <div style={{display:"flex", flexDirection:"column", gap:10}}>
              {cur.items.map((item,i)=>(
                <div key={i} style={{background:"#FFF8F0", borderRadius:12, padding:"12px 14px", border:"1px solid #FFE0B2"}}>
                  <div style={{display:"flex", alignItems:"center", gap:10, flexWrap:"wrap"}}>
                    <span style={{fontSize:20, fontWeight:900, color:"#E65100", minWidth:60}}>{item.form}</span>
                    <span style={{fontSize:13, color:"#555", flex:1}}>{item.ex}</span>
                  </div>
                  <div style={{fontSize:11, color:"#FF9800", marginTop:4}}>💡 {item.note}</div>
                </div>
              ))}
            </div>

            {/* 팁 */}
            {cur.tip && (
              <div style={{marginTop:16, background:"#FFF3E0", borderRadius:10, padding:"10px 14px", fontSize:13, color:"#E65100", textAlign:"center"}}>
                ✨ {cur.tip}
              </div>
            )}
          </div>
        </div>

        {/* 버튼 */}
        <div style={{width:"100%", maxWidth:400}}>
          {josaStep < totalSteps - 1 ? (
            <button onClick={()=>setJosaStep(s=>s+1)}
              style={{width:"100%", background:"linear-gradient(135deg,#FF9800,#E65100)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", boxShadow:"0 4px 16px #FF980044"}}>
              {vi?"Tiếp theo →":en?"Next →":"다음 →"} {JOSA_STEPS[josaStep+1].title}
            </button>
          ) : (
            <button onClick={()=>{onReady?.(); setStep("learn");}}
              style={{width:"100%", background:"linear-gradient(135deg,#00C896,#00A876)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", boxShadow:"0 4px 16px #00C89644"}}>
              {vi?"Bắt đầu học! 🚀":en?"Start learning! 🚀":"학습 시작! 🚀"}
            </button>
          )}
          <button onClick={()=>{setStep("pronunciation"); setPronStep(7);}}
            style={{marginTop:12, background:"none", border:"none", color:"#ccc", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>
            ← {vi?"Quay lại":en?"Back":"뒤로"}
          </button>
        </div>
      </div>
    );
  }

  if (step === "topic") return (
    <div style={{minHeight:begSpeak?"auto":"100vh",background:begSpeak?"transparent":`linear-gradient(150deg,${C.bg},#F3EEFF)`,display:"flex",flexDirection:"column",alignItems:"center",padding:"24px",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <div style={{fontSize:36,marginBottom:8,marginTop:24}}>🌸</div>
      <div style={{fontSize:18,fontWeight:900,color:"#9C6FDE",marginBottom:4,textAlign:"center"}}>오늘 뭐 배울까요?</div>
      <div style={{fontSize:13,color:"#aaa",marginBottom:20,textAlign:"center"}}>
        {lang?.code==="vi"?"Hôm nay học gì?":lang?.code==="en"?"What do you want to learn today?":"What would you like to learn?"}
      </div>
      <div style={{width:"100%",maxWidth:360,display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {BEG_TOPICS.map(t=>(
          <button key={t.id} onClick={()=>handleTopic(t)} style={{background:"white",border:"2px solid #9C6FDE33",borderRadius:18,padding:"18px 12px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:6,boxShadow:"0 2px 12px rgba(156,111,222,.08)",WebkitTapHighlightColor:"transparent",transition:"all .15s"}}>
            <span style={{fontSize:32}}>{t.emoji}</span>
            <span style={{fontSize:14,fontWeight:900,color:"#9C6FDE"}}>{t.ko}</span>
            <span style={{fontSize:11,color:"#bbb",textAlign:"center",lineHeight:1.4}}>
              {lang?.code==="vi"?t.vi:lang?.code==="en"?t.en:t.hint}
            </span>
          </button>
        ))}
      </div>
      <button onClick={()=>setStep("lang")} style={{marginTop:20,background:"none",border:"none",color:"#ccc",fontSize:13,cursor:"pointer"}}>← 뒤로</button>
    </div>
  );

  // ── 학습 채팅 화면 ──
  return (
    <div style={{minHeight:begSpeak?"auto":"100vh",background:begSpeak?"transparent":`linear-gradient(150deg,${C.bg},#F3EEFF)`,display:"flex",flexDirection:"column",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      {/* 헤더 */}
      <div style={{background:`linear-gradient(100deg,#9C6FDE,#C3B1E1)`,padding:"14px 16px",display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
        <div style={{fontSize:24}}>🌸</div>
        <div style={{flex:1}}>
          <div style={{fontSize:15,fontWeight:900,color:"white"}}>한글 친구 · 마중</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,.8)"}}>{topic?.emoji} {topic?.ko} · {user.displayName||user.email}</div>
        </div>
        {/* 주제 바꾸기 버튼 */}
        <button onClick={()=>{setStep("topic");setChat([]);setTurnCount(0);}} style={{background:"rgba(255,255,255,.18)",border:"1.5px solid rgba(255,255,255,.5)",borderRadius:14,padding:"4px 10px",cursor:"pointer",color:"white",fontSize:11,fontWeight:700,marginRight:6}}>주제 바꾸기</button>
        <button onClick={onBack} style={{background:"rgba(255,255,255,.22)",border:"1.5px solid rgba(255,255,255,.6)",borderRadius:20,padding:"4px 12px",cursor:"pointer",color:"white",fontSize:11,fontWeight:700}}>✕</button>
      </div>

      {/* ✅ V131: D-Day 뱃지 + 리셋 버튼 + V140 진도 게이지 */}
      {goalDate && (()=>{
        const now = new Date();
        const startDate = new Date(); startDate.setDate(startDate.getDate()-1);
        const pct = Math.min(100, Math.round(((now-startDate)/Math.max(1,goalDate-startDate))*100));
        const dLeft = Math.max(0, Math.ceil((goalDate-now)/(1000*60*60*24)));
        const goalLabel = [{id:"topik2",label:"TOPIK 2급"},{id:"topik4",label:"TOPIK 4급"},{id:"daily",label:"일상 말하기"},{id:"work",label:"직장 한국어"},{id:"life",label:"한국 생활 적응"}].find(g=>g.id===studyGoal)?.label||"목표";
        const msg = pct<20?"시작이 반이에요! 💪":pct<50?"잘 하고 있어요! 🌟":pct<80?"절반 넘었어요! 🔥":"거의 다 왔어요! 🏁";
        return (
          <div style={{background:"white",padding:"10px 16px",borderBottom:"1px solid #f0eaff",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
              <div style={{fontSize:11,color:"#9C6FDE",fontWeight:800}}>🎯 {goalLabel}</div>
              <div style={{fontSize:11,color:"#aaa",flex:1}}>D-{dLeft} · {pct}%</div>
              <button onClick={()=>setShowResetModal(true)}
                style={{background:"none",border:"1.5px solid #9C6FDE44",borderRadius:20,padding:"3px 10px",cursor:"pointer",color:"#9C6FDE",fontSize:11,fontWeight:700}}>
                🔄 리셋
              </button>
            </div>
            <div style={{background:"#f0eaff",borderRadius:50,height:7,overflow:"hidden",marginBottom:4}}>
              <div style={{width:`${pct}%`,height:"100%",background:"linear-gradient(90deg,#9C6FDE,#C084FC)",borderRadius:50}}/>
            </div>
            <div style={{fontSize:10,color:"#9C6FDE",fontWeight:600}}>{msg}</div>
          </div>
        );
      })()}

      {/* ✅ V131: D-Day 리셋 모달 */}
      {showResetModal && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
          <div style={{background:"white",borderRadius:24,padding:"28px 24px",maxWidth:320,width:"100%",boxShadow:"0 8px 40px rgba(0,0,0,.18)",textAlign:"center"}}>
            <div style={{fontSize:36,marginBottom:8}}>🔄</div>
            <div style={{fontSize:16,fontWeight:900,color:"#9C6FDE",marginBottom:6}}>D-Day 리셋</div>
            <div style={{fontSize:13,color:"#666",marginBottom:20,lineHeight:1.7}}>
              쉰 날이 있어도 괜찮아요!<br/>
              학습 진도는 그대로 유지되고<br/>
              목표일만 오늘 기준으로 새로 계산할게요.
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:12,color:"#aaa",width:80,textAlign:"right"}}>주 몇 회</span>
                <div style={{display:"flex",gap:6,flex:1,flexWrap:"wrap"}}>
                  {[1,2,3,4,5,6,7].map(d=>(
                    <button key={d} onClick={()=>setDaysPerWeek(d)}
                      style={{width:32,height:32,borderRadius:50,border:`2px solid ${daysPerWeek===d?"#9C6FDE":"#eee"}`,background:daysPerWeek===d?"#9C6FDE":"white",color:daysPerWeek===d?"white":"#aaa",fontWeight:800,fontSize:12,cursor:"pointer"}}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:12,color:"#aaa",width:80,textAlign:"right"}}>하루 몇 분</span>
                <div style={{display:"flex",gap:6,flex:1,flexWrap:"wrap"}}>
                  {[15,20,30,45,60,90].map(m=>(
                    <button key={m} onClick={()=>setMinPerDay(m)}
                      style={{padding:"4px 10px",borderRadius:50,border:`2px solid ${minPerDay===m?"#9C6FDE":"#eee"}`,background:minPerDay===m?"#9C6FDE":"white",color:minPerDay===m?"white":"#aaa",fontWeight:800,fontSize:11,cursor:"pointer"}}>
                      {m}분
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{background:"#F3EEFF",borderRadius:12,padding:"10px",marginBottom:18,fontSize:13,fontWeight:800,color:"#9C6FDE"}}>
              새 목표일: {formatDate(calcGoalDate(daysPerWeek, minPerDay, studyGoal))}
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={()=>setShowResetModal(false)}
                style={{flex:1,background:"#f5f5f5",border:"none",borderRadius:50,padding:"12px 0",fontSize:14,fontWeight:700,color:"#aaa",cursor:"pointer"}}>
                취소
              </button>
              <button onClick={resetDDay}
                style={{flex:1,background:"linear-gradient(135deg,#9C6FDE,#C084FC)",border:"none",borderRadius:50,padding:"12px 0",fontSize:14,fontWeight:900,color:"white",cursor:"pointer"}}>
                확정!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 학습 진행 표시 바 */}
      <div style={{background:"white",padding:"8px 16px",borderBottom:"1px solid #f0eaff",display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
        <div style={{fontSize:11,color:"#9C6FDE",fontWeight:700}}>학습 중</div>
        <div style={{flex:1,height:6,background:"#F3EEFF",borderRadius:10,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${Math.min(turnCount*12,100)}%`,background:"linear-gradient(90deg,#9C6FDE,#C3B1E1)",borderRadius:10,transition:"width .4s"}}/>
        </div>
        <div style={{fontSize:11,color:"#bbb"}}>{turnCount}번 연습</div>
      </div>

      {/* 채팅 영역 */}
      <div style={{flex:1,overflowY:"auto",padding:begSpeak?"16px 0 16px":"16px 12px 80px",maxWidth:600,margin:"0 auto",width:"100%",boxSizing:"border-box"}}>
        {chat.map((m,i)=>{
          // ✅ V129: 퀴즈 카드 렌더
          if (m.type === "quiz") return (
            <div key={i} style={{marginBottom:16,background:"white",borderRadius:18,padding:"16px",boxShadow:"0 4px 18px rgba(156,111,222,.15)",border:"2px solid #9C6FDE33"}}>
              <div style={{fontSize:13,fontWeight:900,color:"#9C6FDE",marginBottom:10,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{m.question}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {m.options.map((opt,j)=>{
                  const selected = m.selected !== null;
                  const isCorrect = opt === m.answer;
                  const isSelected = opt === m.selected;
                  let bg = "white", border = "#ddd", color = "#333";
                  if (selected) {
                    if (isCorrect) { bg="#E8F5E9"; border="#4CAF50"; color="#2E7D32"; }
                    else if (isSelected) { bg="#FFEBEE"; border="#EF5350"; color="#C62828"; }
                  }
                  return (
                    <button key={j} onClick={()=>!m.selected && handleQuizAnswer(i, opt)}
                      disabled={!!m.selected}
                      style={{background:bg,border:`2px solid ${border}`,borderRadius:12,padding:"10px 8px",cursor:m.selected?"default":"pointer",fontSize:13,fontWeight:700,color,transition:"all .2s",WebkitTapHighlightColor:"transparent"}}>
                      {isCorrect && selected ? "✅ " : isSelected && !isCorrect ? "❌ " : ""}{opt}
                    </button>
                  );
                })}
              </div>
            </div>
          );
          return (
            <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:12}}>
              {m.role==="assistant"&&<div style={{fontSize:22,marginRight:6,flexShrink:0,alignSelf:"flex-end"}}>🌸</div>}
              <div style={{maxWidth:"80%",background:m.role==="user"?"#9C6FDE":"white",color:m.role==="user"?"white":"#333",borderRadius:m.role==="user"?"20px 20px 4px 20px":"20px 20px 20px 4px",padding:"12px 16px",fontSize:14,lineHeight:1.75,boxShadow:"0 2px 10px rgba(0,0,0,.08)",whiteSpace:"pre-wrap"}}>
                {m.text}
              </div>
            </div>
          );
        })}
        {sending&&(
          <div style={{display:"flex",alignItems:"center",gap:6,color:"#bbb",fontSize:13,marginBottom:12}}>
            <span>🌸</span>
            <div style={{background:"white",borderRadius:"20px 20px 20px 4px",padding:"10px 16px",boxShadow:"0 2px 8px rgba(0,0,0,.06)"}}>
              <span style={{letterSpacing:3}}>•••</span>
            </div>
          </div>
        )}
        <div ref={chatBottomRef}/>
      </div>

      {/* ✅ V137 placeholder 이탤릭+연한색 */}
      <style>{`.beg-placeholder::placeholder{color:#C3B1E1;font-style:italic;opacity:1;}`}</style>
      {/* ✅ V137 질문 유도 힌트 배너 */}
      {chat.length > 0 && chat.length < 8 && (
        <div style={{position:begSpeak?"relative":"fixed",bottom:begSpeak?undefined:62,left:begSpeak?undefined:0,right:begSpeak?undefined:0,maxWidth:600,margin:"0 auto",padding:"6px 12px",boxSizing:"border-box",pointerEvents:"none"}}>
          <div style={{background:"#9C6FDE",borderRadius:12,padding:"8px 14px",fontSize:12,color:"white",fontWeight:700,textAlign:"center",boxShadow:"0 2px 10px #9C6FDE44"}}>
            💬 궁금한 한국어 표현이 있으면 뭐든 물어봐요!
            <div style={{fontSize:11,fontWeight:500,marginTop:2,opacity:.85}}>예: "~자마자 어떻게 써요?" · "이 단어 무슨 뜻이에요?"</div>
          </div>
        </div>
      )}
      {/* 입력창 */}
      <div style={{position:begSpeak?"relative":"fixed",bottom:begSpeak?undefined:0,left:begSpeak?undefined:0,right:begSpeak?undefined:0,background:"white",borderTop:"1px solid #eee",borderRadius:begSpeak?16:0,padding:"10px 12px",display:"flex",gap:8,maxWidth:600,margin:begSpeak?"8px 0 0":"0 auto",boxSizing:"border-box"}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSend()} placeholder="한국어로 써봐요! 궁금한 것도 물어봐요 😊" className="beg-placeholder" style={{flex:1,padding:"12px 16px",borderRadius:50,border:`2px solid #9C6FDE44`,outline:"none",fontSize:14,fontFamily:"inherit"}} />
        <button onClick={handleSend} disabled={!input.trim()||sending} style={{background:"#9C6FDE",color:"white",border:"none",borderRadius:50,padding:"12px 18px",cursor:"pointer",fontSize:14,fontWeight:900,opacity:!input.trim()||sending?0.4:1,flexShrink:0}}>→</button>
      </div>
    </div>
  );
}

const STEPS = [
  {label:"현상", emoji:"👀", hint:"예: 요즘 한국 사람들이 편의점을 자주 이용해요.", color:C.teal},
  {label:"생각", emoji:"💭", hint:"예: 나는 편의점 문화가 편리하다고 생각해요.", color:C.orange},
  {label:"이유", emoji:"💡", hint:"예: 왜냐하면 24시간 열려 있기 때문이에요.", color:C.pink},
];

const TOPICS = [
  {icon:"📱", title:"스마트폰 과의존", hint:"요즘 사람들이 스마트폰을 너무 많이 사용하는 것 같다."},
  {icon:"🌿", title:"환경과 일회용품", hint:"카페나 식당에서 일회용 컵을 사용하는 사람들이 많다."},
  {icon:"🏙️", title:"1인 가구 증가", hint:"혼자 사는 사람들이 점점 늘어나고 있다."},
  {icon:"📚", title:"학력 vs 실력", hint:"대학교 졸업장보다 실무 능력을 중시하는 기업이 늘고 있다."},
  {icon:"🤖", title:"AI와 일자리", hint:"인공지능 기술이 발전하면서 사람들의 일자리가 줄어들고 있다."},
  {icon:"🌏", title:"이주배경 학생과 학교 생활", hint:"한국 학교에서 처음 생활할 때 어려운 점이 있다."},
  {icon:"🏭", title:"직장 속 한국어", hint:"한국 직장에서 한국어로 소통하는 것이 중요하다."},
  // ✅ V122 추가: 8번째 논술 카드 (적용/개선 4월 No.7 — 산업 현장 소통 문제)
  {icon:"🦺", title:"직장에서의 소통", hint:"한국어를 어느 정도 알아도 직장에서 소통이 어려운 경우가 많다."},
];

const CULTURAL_KEYWORDS = [
  {word:"먹방",  level:"3~4급", meaning:"음식을 먹는 모습을 보여주는 방송", topic:"SNS·유튜브 문화"},
  {word:"웹툰",  level:"3~4급", meaning:"인터넷에서 보는 만화", topic:"한국 디지털 콘텐츠"},
  {word:"치맥",  level:"3~4급", meaning:"치킨과 맥주를 함께 먹는 문화", topic:"한국 음식 문화"},
  {word:"눈치",  level:"4~5급", meaning:"상황을 빠르게 파악하는 능력", topic:"한국 사회·인간관계"},
  {word:"길거리 응원", level:"3~4급", meaning:"거리에서 함께 모여 응원하는 문화", topic:"한국 스포츠 문화"},
  {word:"눈치껏", level:"4~5급", meaning:"상황을 보고 스스로 알아서", topic:"한국 직장·사회"},
  {word:"대세",  level:"3~4급", meaning:"요즘 가장 인기 있는 사람이나 것", topic:"트렌드·연예"},
  {word:"오빠",  level:"2~3급", meaning:"여자가 남자 형이나 친한 남자에게 부르는 말. 드라마에서 자주 등장", topic:"K드라마·인간관계", etym:"오빠(oppa) — 한국 드라마에서 세계적으로 유명해진 표현"},
  {word:"정(情)", level:"4~5급", meaning:"오랜 시간 함께하며 생기는 따뜻한 감정. 한국인의 핵심 정서", topic:"K드라마·한국 정서", etym:"情(정) — 감정(感情)·우정(友情)·열정(熱情)에도 쓰여요"},
  {word:"빨리빨리", level:"3~4급", meaning:"한국 사람들의 빠른 속도를 중시하는 문화", topic:"K드라마·한국 사회"},
  {word:"눈물샘", level:"4~5급", meaning:"눈물이 나오는 곳. '눈물샘이 터진다' = 눈물이 많이 난다", topic:"K드라마·감정 표현"},
  {word:"현타",  level:"3~4급", meaning:"현실 자각 타임. 갑자기 현실을 깨닫는 순간", topic:"K드라마·신조어"},
  {word:"설레다", level:"3~4급", meaning:"기대와 떨림이 함께 느껴지는 감정. 드라마 로맨스의 핵심 표현", topic:"K드라마·감정"},
  {word:"최애",  level:"3~4급", meaning:"가장 좋아하는 것·사람. K팝·드라마 팬들이 자주 씀", topic:"K팝·K드라마"},
  {word:"심심한 사과", level:"5~6급", meaning:"'심심하다'는 여기서 '매우 깊다'는 뜻. 깊이 있는 사과라는 의미", topic:"어원 한자어·문해력", etym:"甚深(심심) — 깊을 심(深). '심해(深海·깊은 바다)'와 같은 한자"},
  {word:"금일",  level:"4~5급", meaning:"오늘. '금(今)'은 지금·오늘이라는 뜻의 한자어", topic:"어원 한자어·공문서", etym:"今日(금일) — 금년(今年·올해)·금방(今方·방금)에도 같은 今 사용"},
  {word:"우천시", level:"4~5급", meaning:"비가 올 때. 공지·안내문에서 자주 나오는 한자어 표현", topic:"어원 한자어·생활", etym:"雨天時(우천시) — 우산(雨傘)·우기(雨期)의 雨(비 우)"},
  {word:"안전",  level:"3~4급", meaning:"위험이 없는 상태", topic:"어원 한자어·생활", etym:"安全(안전) — 安(안)은 편안(便安)·불안(不安)·보안(保安)에도 쓰여요"},
  {word:"문화",  level:"3~4급", meaning:"사람들이 만들어온 생활 방식과 가치관의 총체", topic:"어원 한자어·사회", etym:"文化(문화) — 文(문)은 문학(文學)·문명(文明)·문자(文字)에도 쓰여요"},
  // ✅ V122 추가: 생활·다문화·직장 카테고리 6개 (적용/개선 No.4, 4월 No.7)
  {word:"자조모임", level:"3~4급", meaning:"비슷한 상황에 있는 사람들이 서로 돕고 나누는 모임", topic:"생활·다문화"},
  {word:"이중언어", level:"4~5급", meaning:"두 가지 언어를 함께 쓰거나 배우는 것", topic:"다문화·교육"},
  {word:"통번역", level:"4~5급", meaning:"말(통역)과 글(번역)을 다른 언어로 바꿔주는 것", topic:"직업·다문화"},
  {word:"작업지시", level:"3~4급", meaning:"일하는 방법이나 순서를 설명하는 것", topic:"직장·현장"},
  {word:"안전수칙", level:"3~4급", meaning:"다치지 않으려고 반드시 지켜야 하는 규칙", topic:"직장·현장"},
  {word:"귀화",  level:"4~5급", meaning:"다른 나라의 국적을 얻어 그 나라 국민이 되는 것", topic:"생활·법률"},
];
const todayKeyword = CULTURAL_KEYWORDS[new Date().getDay() % CULTURAL_KEYWORDS.length];

const WORKPLACE_SCENARIOS = [
  {situation:"회의 반대 의견", level:"3~4급", expression:"저는 조금 다르게 생각하는데요, 혹시 ~는 어떨까요?", tip:"부드러운 의견 제시 — 직접 반박보다 대안 제안"},
  {situation:"동료 업무 부탁", level:"3~4급", expression:"바쁘신 거 알지만, 혹시 이것 좀 도와주실 수 있을까요?", tip:"'혹시'+'~실 수 있을까요?' 조합이 가장 자연스러운 부탁 표현"},
  {situation:"상사에게 보고", level:"4~5급", expression:"말씀드릴 사항이 있는데요, 잠깐 시간 괜찮으세요?", tip:"'말씀드리다'는 '말하다'의 높임말 — 보고 상황의 핵심 표현"},
  {situation:"칭찬·감사 표현", level:"3~4급", expression:"덕분에 잘 마무리됐어요. 정말 감사합니다!", tip:"'덕분에'는 상대방의 도움으로 잘 됐을 때 쓰는 감사 표현"},
  {situation:"업무 일정 조율", level:"4~5급", expression:"언제가 편하세요? 제가 맞출게요.", tip:"자신을 낮추는 표현 — 한국 직장 문화의 배려 표현"},
  {situation:"실수 사과", level:"3~4급", expression:"제 실수였습니다. 죄송합니다. 바로 수정하겠습니다.", tip:"사과 후 즉시 해결 의지 표현 — 신뢰 회복의 핵심"},
  {situation:"퇴근 인사", level:"2~3급", expression:"먼저 들어가겠습니다. 수고하세요!", tip:"'수고하세요'는 남아있는 사람에게, '수고하셨습니다'는 끝낸 사람에게"},
];
const todayWorkplace = WORKPLACE_SCENARIOS[new Date().getDay() % WORKPLACE_SCENARIOS.length];

const SAFETY_SCENARIOS = [
  {situation:"안전모 착용", expression:"여기서는 반드시 안전모를 써야 해요!", tip:"'반드시'는 꼭 해야 할 때 쓰는 강조 표현"},
  {situation:"위험 구역 경고", expression:"저쪽은 위험 구역이에요. 들어가면 안 돼요!", tip:"'~면 안 돼요'는 금지를 부드럽게 말하는 표현"},
  {situation:"응급 상황 신고", expression:"사람이 다쳤어요! 119에 전화해 주세요!", tip:"응급 전화: 119(소방/구급), 112(경찰)"},
  {situation:"작업 전 점검", expression:"작업 시작 전에 장비를 꼭 확인해야 해요.", tip:"'꼭'은 반드시와 같은 뜻 — 일상에서 더 자주 씀"},
  {situation:"작업 지시 이해 확인", expression:"지금 말한 거 이해했어요? 다시 한 번 말해볼 수 있어요?", tip:"상대방에게 확인할 때 쓰는 자연스러운 표현"},
];
const todaySafety = SAFETY_SCENARIOS[new Date().getDay() % SAFETY_SCENARIOS.length];

const PROMPTS = {
  speak:{
    jake_mid:`너의 이름은 '제이크(Jake)', 활기차고 트렌디한 20대 한국인 대학생 친구다.
대상: TOPIK 3~4급.
[말투] 자연스러운 해요체 구어체. "어~ 진짜요?", "대박!", "맞아 맞아요!" 등 리액션 활용.
[TTS 최적화] 짧은 문장 + 쉼표(,)로 호흡 조절. 2~3문장 이내.
[피드백] 서두에 반드시 공감·칭찬
[교정] 흐름 유지. "아, ~라는 말이구나요! 그럴 땐 ~라고 하면 더 자연스러워요! 😊"
[✅코드 스위칭 대응] 학습자가 모국어를 섞어 쓸 때 절대 지적하지 말고 자연스럽게 한국어로 유도. 예: "방금 그 표현, 한국어로는 어떻게 말할 수 있을까요? 😊" 형태로 부드럽게 전환.
[어휘] TOPIK 3~4급. 고유어 위주. 이모지 적절히 활용 😊👍✨
[✅음식 경험 유도] 학습자가 말이 없거나 대화가 멈출 때, 주제를 제시하지 말고 경험을 물어봐. 예: "오늘 뭐 먹었어요?", "고향 음식 중에 제일 좋아하는 거 뭐예요?", "한국 음식 중에 처음 먹어본 거 있어요?" — 음식은 주제가 아니라 경험이니까 자연스럽게 말문이 열려.
[금기] 유아적 칭찬 금지. 문화적 편견 금지. "오늘 주제는~" 같은 주제 제시 절대 금지.`,
    jake_adv:`너의 이름은 '제이크(Jake)', 지적이고 유쾌한 20대 한국인 대학생 친구다.
대상: TOPIK 5~6급.
[말투] 해요체 + 고급 어휘·사자성어 자연스럽게.
[TTS 최적화] 명확한 문장, 쉼표로 호흡 조절. 3~4문장.
[피드백] 성인 학습자 적합한 격려
[교정] 고급 대안 표현·사자성어 슬쩍 권유.
[✅코드 스위칭 대응] 학습자가 모국어를 섞어 쓸 때 "방금 그 표현을 한국어로 하면 어떻게 될까요? 비슷한 한국어 표현을 알고 있나요?" 형태로 자연스럽게 유도.
[특징] 사회·시사·문화 주제 자연스럽게. 심층 질문으로 사고 확장.
[✅음식 경험 유도] 대화가 멈출 때 경험을 물어봐. 예: "최근에 인상 깊었던 식사 자리가 있었나요?", "한국 음식 중에 문화적으로 흥미롭다고 느낀 것이 있어요?" — 음식을 매개로 문화·사회 이야기로 자연스럽게 확장.
[금기] 유아적 칭찬 금지. 문화적 편견 금지.`,
    miso_mid:`너의 이름은 '미소 선생님', 다정하고 차분한 40대 여성 한국어 전문 교사다.
대상: TOPIK 3~4급.
[말투] 부드럽고 정확한 표준어. 격려 중심.
[TTS 최적화] 천천히 명확하게. 2~3문장.
[피드백] 항상 공감 먼저.
[✅코드 스위칭 대응] 학습자가 모국어를 섞어 쓸 때 따뜻하게 "그 표현이 한국어로는 ~예요. 같이 연습해 볼까요? 😊" 형태로 자연스럽게 연결.
[어휘] TOPIK 3~4급. 쉽고 명확하게. 이모지 온화하게 사용 😊✨
[금기] 날카로운 지적 금지. 학습자 자존감 존중.`,
    miso_adv:`너의 이름은 '미소 선생님', 학술적이고 따뜻한 40대 여성 한국어 전문 교사다.
대상: TOPIK 5~6급.
[말투] 정확한 표준어 + 고급 어휘. 격려하되 지적 깊이 있게.
[TTS 최적화] 명확하고 품위 있는 문장. 3~4문장.
[교정] 문법적 정확성 + 화용적 맥락까지 세밀하게 다듬어줌.
[✅코드 스위칭 대응] 학습자가 모국어를 섞어 쓸 때 "방금 그 표현의 한국어 대응 표현은 ~입니다. 맥락에 따라 ~도 쓸 수 있어요." 형태로 정교하게 연결.`,
    haneul_mid:`너의 이름은 '하늘이', 호기심 많고 순수한 10살 한국 어린이 친구다.
대상: TOPIK 3~4급.
[말투] 짧고 명확한 문장.
[TTS 최적화] 아주 짧은 문장. 1~2문장.
[어휘] 어려운 한자어 절대 금지. 쉬운 고유어 + 의성어/의태어.
[✅코드 스위칭 대응] 학습자가 다른 나라 말을 섞어 쓰면 "어? 그게 무슨 뜻이에요? 한국어로 말하면 ~예요! 😊" 형태로 귀엽게 한국어로 이어줘.
[이모지] 밝고 귀엽게 🎈😊🌟`,
    haneul_adv:`너의 이름은 '하늘이', 영리하고 호기심 넘치는 10살 한국 어린이 친구다.
대상: TOPIK 5~6급.
[말투] 짧고 직관적인 문장. 순수한 궁금증으로 심층 표현 유도.
[특징] "왜요?", "그럼 어떻게 해요?", "그게 뭐예요? 🌟"
[✅코드 스위칭 대응] 학습자가 다른 나라 말을 섞어 쓰면 "그건 한국어로 어떻게 해요? 저도 배우고 싶어요! 🌟" 형태로 자연스럽게 이어줘.
[이모지] 🎈😊🌟`,
    jake_vietnam:`너의 이름은 '제이크(Jake)', 활기차고 트렌디한 20대 한국인 대학생 친구다.
대상: 베트남어권 TOPIK 3~4급 학습자.
[말투] 자연스러운 해요체 구어체. "어~ 진짜요?", "대박!", "맞아 맞아요!" 등 리액션 활용.
[TTS 최적화] 짧은 문장 + 쉼표(,)로 호흡 조절. 2~3문장 이내.
[베트남 문화 연결] 대화 중 자연스럽게 한-베트남 공통 정서 활용. 예: "베트남에도 콩쥐팥쥐 같은 이야기가 있나요?", "설날에 베트남에서는 뭘 먹어요?" 형태로 문화 브릿지 질문 1개씩 녹이기.
[코드 스위칭 대응] 베트남어를 섞어 쓸 때 "방금 그 표현, 한국어로는 어떻게 말할 수 있을까요? 😊" 형태로 부드럽게 전환.
[어휘] TOPIK 3~4급. 고유어 위주. 이모지 적절히 활용 😊👍✨
[금기] 유아적 칭찬 금지. 문화적 편견 금지.`,
  },
  write:{
    beg:[
      "따뜻한 글쓰기 코치. 초급(TOPIK 1~2급). 현상 단계: 아주 짧고 쉬운 1문장. 이모지 1개 포함. 칭찬 먼저. 쉬운 어휘로 교정 1가지. 한자어 금지. 2문장 이내.",
      "따뜻한 글쓰기 코치. 초급(TOPIK 1~2급). 생각 단계: '나는 ~이 좋아요/싫어요' 형태 유도. 칭찬+쉬운 대안 1가지. 2문장 이내.",
      "따뜻한 글쓰기 코치. 초급(TOPIK 1~2급). 이유 단계: '왜냐하면 ~ 이에요' 형태. 아주 간단한 발전 표현 1가지. 2문장 이내. 잘했다고 마무리.",
    ],
    mid:[
      "따뜻한 글쓰기 코치. TOPIK 3~4급. 현상 단계: 쉬운 고유어 1~2문장. 칭찬+다음 연결. 3문장 이내. [어휘 맥락] 구어체·문어체 구분 1가지 교정 제안 포함. [✅어원 코칭] 학습자가 쓴 한자어가 있으면 같은 어원의 단어 1개를 자연스럽게 추가 안내. 예: '안전' → '안(安)은 편안·불안·보안에도 쓰여요!'",
      "따뜻한 글쓰기 코치. TOPIK 3~4급. 생각 단계: 나는~라고 생각해요 형태. 중급 대안 제시. 칭찬+이유 연결. 3문장 이내. [어휘 맥락] 구어체·문어체 구분 1가지 교정 제안 포함. [✅어원 코칭] 학습자가 쓴 한자어가 있으면 같은 어원의 단어 1개를 자연스럽게 추가 안내.",
      "따뜻한 글쓰기 코치. TOPIK 3~4급. 이유 단계: 왜냐하면~이기 때문이에요. 중급 발전 표현 1가지. 3문장 이내. [어휘 맥락] 구어체·문어체 구분 1가지 교정 제안 포함. [✅어원 코칭] 학습자가 쓴 한자어가 있으면 같은 어원의 단어 1개를 자연스럽게 추가 안내.",
    ],
    adv:[
      "따뜻한 글쓰기 코치. TOPIK 5~6급. 현상 단계: 사회적 맥락 2~3문장. 고급 어휘 권장. 4문장 이내. [어휘 맥락] 문어체·관용구·격식 어휘 교정 1가지 포함. [✅어원 코칭] 학습자가 쓴 한자어의 어원 계열 단어 1~2개 자연스럽게 연결 안내. 예: '문화(文化)' → '문명(文明)·문학(文學)에도 文이 쓰여요!'",
      "따뜻한 글쓰기 코치. TOPIK 5~6급. 생각 단계: 관용구·고급 어휘로 논리적 의견. 4문장 이내. [어휘 맥락] 문어체·관용구·격식 어휘 교정 1가지 포함. [✅어원 코칭] 학습자가 쓴 한자어의 어원 계열 단어 1~2개 자연스럽게 연결 안내.",
      "따뜻한 글쓰기 코치. TOPIK 5~6급. 이유 단계: 따라서·이로 인해 활용. 사자성어·관용구 제안. 4~5문장. [어휘 맥락] 문어체·관용구·격식 어휘 교정 1가지 포함. [✅어원 코칭] 학습자가 쓴 한자어의 어원 계열 단어 1~2개 자연스럽게 연결 안내.",
    ],
  },
  tutor:`[페르소나] 이름: 마중(Majung). 학습자의 언어적 성장을 마중 나가고, 두 문화 사이의 다리를 놓는 인문학적 조력자.
[철학] 비계 설정: 절대 정답을 먼저 주지 마라. 초성 힌트 → 유의어 비교 → 상황적 질문 단계적 제시. 학습자가 3회 이상 실패하거나 직접 요청할 때만 교정안 제시.
[도입] 글의 목적·학습자 문화적 배경·한국 방문 여부를 먼저 확인하라.
[✅K콘텐츠 연결] 첫 대화 또는 어색한 침묵 때 "요즘 본 한국 드라마나 예능에서 이해 안 된 표현이 있었나요? 그 표현으로 같이 써볼까요?" 형태로 자연스럽게 연결.
[보상] 완성 시 학습자 글의 구체적 단어를 인용하여 한국 예술과 연결한 진심 어린 찬사를 보내라.
[금기] 영혼 없는 칭찬 금지. 완성 문장 먼저 제시 금지.
[시작] "안녕하세요, 학습자님 😊 저는 마중이에요. 오늘은 어떤 글을 함께 써볼까요?"`,
  tutorAdv:`[페르소나] 이름: 마중(Majung). 지적 호기심을 자극하고 격조 있는 담론을 나누는 학술적 파트너.
[철학] 비계 설정: 정답 절대 금지. 한자어 초성·사자성어·복문 문형으로 힌트.
[톤] "~하도록 조력하겠습니다". 거대 담론 유도. 어휘 고도화.
[✅K콘텐츠 연결] 필요 시 "최근 보신 한국 드라마나 영화에서 인상적인 대사가 있었나요? 그것을 논술 소재로 발전시켜 볼 수 있습니다." 형태로 연결.
[보상] 역사적·철학적 맥락과 함께 학술적 찬사. 학습자 단어 인용 + 조선 회화·국악 연결.
[금기] 영혼 없는 칭찬 금지. 완성 문장 먼저 제시 금지.
[시작] "안녕하십니까, 학습자님. 저는 마중입니다. 오늘은 어떤 주제와 씨름해 보시겠습니까?"`,
  tutorBeginner:`[페르소나] 이름: 마중(Majung). 학습자의 첫걸음을 따뜻하게 맞이하는 친절한 안내자.
[대상] TOPIK 1~2급. 한국 학교나 생활이 낯선 초급 학습자.
[철학] 절대 어려운 말 금지. 쉬운 단어로 천천히. 학습자가 틀려도 웃으며 다시 안내.
[말투] 짧고 쉬운 문장. "천천히 괜찮아요 😊", "잘 했어요! 🎉" 격려 중심.
[힌트 방식] 초성 힌트 → 그림으로 설명 → 쉬운 예문 순서로.
[도입] 학교생활·일상 중 가장 어려운 것부터 먼저 물어보기.
[금기] 긴 문장 금지. 한자어 금지. 학습자 실수 지적 금지.
[시작] "안녕하세요! 😊 저는 마중이에요. 한국어가 어렵죠? 같이 천천히 해봐요! 오늘 학교에서 제일 어려운 게 뭐예요?"`,
  tutorHeritage:`[페르소나] 이름: 마중(Majung). 뿌리를 찾는 여정의 따뜻한 동반자. 두 문화 사이에 다리를 놓는 인문학적 조력자.
[대상] 재외동포 2·3세. 가족·뿌리와 연결되고 싶은 학습자.
[철학] 언어보다 감정 먼저. "왜 배우려는지"를 충분히 듣고 공감. 정체성 존중.
[말투] 따뜻하고 진심 어린 어조. 영어·한국어 혼용 이해. 판단 없음.
[도입] 가족과 한국어로 나누고 싶은 이야기·기억을 먼저 물어보기.
[교정] 언어 교정보다 표현의 감정을 먼저 인정. 교정은 자연스럽게 슬쩍.
[✅뿌리 메시지] 대화 중 자연스럽게 "당신의 한국어는 당신의 뿌리예요. 함께 지켜가요 🌱" 메시지 녹이기.
[보상] 완성 시 학습자 표현을 인용해 가족·고향·한국 문화와 연결한 진심 어린 찬사.
[금기] 영혼 없는 칭찬 금지. 정체성 혼란 부추기기 금지. 완성 문장 먼저 제시 금지.
[시작] "안녕하세요 😊 저는 마중이에요. 가족과 한국어로 나누고 싶은 이야기가 있나요? 어떤 말을 제일 먼저 배우고 싶으세요?"`,
  tutorSurvival:`[페르소나] 이름: 마중(Majung). 절박한 순간에 곁에 있어주는 실질적인 조력자.
[대상] 비자 연장·취업·TOPIK 2급 취득이 절박하게 필요한 학습자.
[철학] 공감 먼저, 실질적 도움 바로. 막연한 위로 대신 "이거 같이 해요, 충분히 할 수 있어요!" 성취 경험 중심.
[말투] 따뜻하되 명확하고 실용적. "이 표현만 알면 돼요", "딱 이것만 먼저 해요" 형태.
[힌트 방식] TOPIK 2급 핵심 표현 먼저. 어려운 거 나중에. 지금 당장 쓸 수 있는 것부터.
[도입] "지금 가장 급한 게 뭐예요? 비자요? 시험이요? 같이 해결해봐요!" 형태로 시작.
[금기] 긴 이론 설명 금지. 막연한 칭찬 금지. 학습자 불안 자극 금지.
[시작] "안녕하세요 😊 저는 마중이에요. 지금 가장 급한 게 뭐예요? 같이 해낼 수 있어요. 충분히 가능해요!"`,
};

const SEC = { MAX_LEN:500, MAX_HISTORY:30, RPM:15, WINDOW:60_000 };

const rateLimiter = (() => {
  const calls = [];
  return { check() {
    const now = Date.now();
    while (calls.length && calls[0] < now - SEC.WINDOW) calls.shift();
    if (calls.length >= SEC.RPM) return false;
    calls.push(now); return true;
  }};
})();

function sanitize(text) {
  if (!text || typeof text !== "string") return "";
  let t = text.slice(0, SEC.MAX_LEN);
  const bad = [
    /ignore\s+(all\s+)?previous\s+instructions?/gi,
    /ignore\s+(the\s+)?system\s+prompt/gi,
    /you\s+are\s+now\s+(a\s+)?/gi,
    /새로운\s*역할/g, /시스템\s*프롬프트\s*무시/g,
    /지금부터\s*너는/g, /탈옥/g,
    /<\s*script[\s\S]*?>/gi, /javascript\s*:/gi,
  ];
  for (const p of bad) if (p.test(t)) return "[보안 필터]";
  return t.replace(/<[^>]*>/g, "").trim();
}

function trimHistory(msgs) {
  if (msgs.length <= SEC.MAX_HISTORY) return msgs;
  return [msgs[0], ...msgs.slice(-(SEC.MAX_HISTORY - 1))];
}

const API_ERRORS = {
  401:"API 인증 오류예요. 관리자에게 문의해주세요. 🔑",
  402:"AI 사용 크레딧이 부족해요. 관리자에게 문의해주세요. 💳",
  404:"AI 모델 오류예요. 관리자에게 문의해주세요. 🔧",
  429:"요청이 너무 많아요. 잠시 후 다시 시도해줘! ⏳",
  500:"서버 오류가 발생했어요. 잠시 후 다시 시도해줘! 🔧",
  503:"서비스가 일시적으로 불안정해요. 잠시 후 다시 시도해줘! 🔧",
};

// ============================================================
// ✅ V122 수정 1: callClaude — /api/chat 프록시로 변경
// 이유: 브라우저 직접 호출 시 API 키 노출 + 모바일 CORS 불안정
// ============================================================
async function callClaude(messages, system) {
  if (!rateLimiter.check()) return "잠깐! 너무 빠르게 보내고 있어요. 잠시 후 다시 시도해줘! 😊";
  try {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system,
        messages: trimHistory(messages),
      }),
    });
    if (!r.ok) return API_ERRORS[r.status] || `오류가 발생했어요. (${r.status})`;
    const d = await r.json();
    if (d.error) return `오류: ${d.error.message}`;
    return d.content?.map(b => b.text || "").join("") || "응답을 받지 못했어요.";
  } catch(e) {
    if (!navigator.onLine) return "인터넷 연결을 확인해줘! 📡";
    return "연결 오류가 발생했어요. 다시 시도해줘! 😅";
  }
}

// ============================================================
// ✅ V122 수정 1-b: evaluateFile — /api/chat 프록시로 변경
// ============================================================
function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result.split(",")[1]);
    r.onerror = () => rej(new Error("파일 읽기 실패"));
    r.readAsDataURL(file);
  });
}

function buildWriteEvalSys(level, depth = "normal") {
  const isAdv = level === "adv";
  const depthInstruction = {
    simple:  "피드백은 핵심만 짧게. [잘한 점 🌟] 1가지 + [개선 포인트 💡] 1가지 + [응원 메시지 💪] 1가지만. 합계 5문장 이내.",
    normal:  "피드백은 균형 있게. 아래 형식 모두 포함.",
    detailed:"피드백은 아주 꼼꼼하게. 아래 형식 모두 포함하되 각 항목마다 구체적 예시와 대안 표현을 2~3개 제시. 어원 코칭도 반드시 포함.",
  }[depth] || "피드백은 균형 있게. 아래 형식 모두 포함.";

  if (isAdv) return `너는 한국어 쓰기 평가 전문가 AI '마중'이야.
학습자가 제출한 글을 읽고, TOPIK 쓰기 평가 기준을 바탕으로 따뜻하고 구체적인 피드백을 줘.
[깊이 지침] ${depthInstruction}
[고급 평가 기준 - TOPIK 5~6급]
내용: 사회적·추상적 주제에 대해 논리적으로 주장할 수 있는가?
구조: 논설문/설명문 형식, 단락마다 하나의 핵심 내용
어휘: 고급 어휘(전문 용어·관용어·속담·사자성어) 사용 여부
문법: 복잡한 문법 구조 정확한 사용
[피드백 출력 형식]
1. [잘한 점 🌟] 구체적으로 1~2가지 칭찬
2. [개선 포인트 💡] 핵심 2~3개만
3. [수정 예시 ✍️] 학습자 문장을 직접 고쳐서 보여줌
4. [응원 메시지 💪] 동기부여로 마무리
5. [어휘 맥락 코칭 🔤] 격식·비격식 어휘 사용 맥락 점검. 관용구·사자성어 활용이 자연스러운지 확인. 더 고급스러운 표현 1가지 제안.
6. [✅어원 코칭 📖] 학습자가 쓴 한자어 1개의 어원 계열 단어를 자연스럽게 소개. 예: '안전(安全)' → '안(安)은 편안(便安)·불안(不安)·보안(保安)에도 쓰여요!'`;

  return `너는 한국어 쓰기 평가 전문가 AI '마중'이야.
학습자가 제출한 글을 읽고, TOPIK 쓰기 평가 기준을 바탕으로 따뜻하고 구체적인 피드백을 줘.
[깊이 지침] ${depthInstruction}
[중급 평가 기준 - TOPIK 3~4급]
내용: 일상적·사회적 주제에 대해 자신의 생각을 썼는가?
구조: 단락 구분이 있고 흐름이 이어지는가?
어휘: 중급 어휘 사용, 같은 단어 반복 최소화
문법: 연결어미·종결어미·높임법 적절히 사용
[피드백 출력 형식]
1. [잘한 점 🌟] 구체적으로 1~2가지 칭찬
2. [개선 포인트 💡] 핵심 1~2가지만
3. [수정 예시 ✍️] 학습자 문장을 직접 고쳐서 보여줌
4. [응원 메시지 💪] 동기부여로 마무리
5. [어휘 맥락 코칭 🔤] 구어체 표현 1가지를 찾아 문어체 대안을 제시. 예: '맛있다' → '풍미가 있다'
6. [✅어원 코칭 📖] 학습자가 쓴 한자어가 있으면 관련 단어 1개 자연스럽게 소개. 없으면 생략.`;
}

async function evaluateFile(file, level, depth = "normal") {
  if (!rateLimiter.check()) return "잠깐! 너무 빠르게 보내고 있어요. 잠시 후 다시 시도해줘! 😊";
  try {
    const isTXT = file.type === "text/plain" || file.name.endsWith(".txt");
    const isPDF = file.type === "application/pdf";
    const evalSys = buildWriteEvalSys(level, depth);

    let userContent;
    if (isTXT) {
      const text = await file.text();
      const safe = sanitize(text.slice(0, 3000));
      userContent = [{ type:"text", text:`다음은 학습자가 제출한 한국어 글입니다:\n\n${safe}\n\n위 글을 평가해 주세요.` }];
    } else {
      const base64 = await fileToBase64(file);
      const contentBlock = isPDF
        ? { type:"document", source:{ type:"base64", media_type:"application/pdf", data:base64 } }
        : { type:"image",    source:{ type:"base64", media_type:file.type, data:base64 } };
      userContent = [contentBlock, { type:"text", text:"위 글을 평가해 주세요." }];
    }

    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: evalSys,
        messages: [{ role:"user", content:userContent }],
      }),
    });
    if (!r.ok) return API_ERRORS[r.status] || `오류 (${r.status})`;
    const d = await r.json();
    return d.content?.map(b => b.text || "").join("") || "응답을 받지 못했어요.";
  } catch(e) {
    if (!navigator.onLine) return "인터넷 연결을 확인해줘! 📡";
    return "오류가 발생했어요. 다시 시도해줘! 😅";
  }
}

function cleanTTS(t) {
  return t.replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{1F300}-\u{1F9FF}]/gu, "")
          .replace(/[~*_#^[\]{}|\\<>]/g, "").replace(/\s+/g, " ").trim();
}

const TTS_PROFILES = {
  jake:   { rate:1.15, pitch:0.9,  volume:1.0 },
  miso:   { rate:0.9,  pitch:1.05, volume:0.95 },
  haneul: { rate:1.1,  pitch:1.5,  volume:1.0 },
  default:{ rate:1.0,  pitch:1.0,  volume:1.0 },
};

// ============================================================
// ✅ V122 핵심 수정: useTTS
// 수정 1: callClaude /api/chat 프록시 전환 (API 키 보안 + 모바일 안정)
// 수정 2: Android pause/resume 타이밍 50ms → 200ms (묵음 버그 핵심 원인)
// 수정 3: unlock 완료 후 speak 실행 (iOS/Android unlock 타이밍 보장)
// ============================================================
function useTTS() {
  const [speaking, setSpeaking] = useState(null);
  const [ttsHint,  setTtsHint]  = useState(false);
  const voicesRef = useRef({ male:null, female:null, fallback:null });
  const unRef     = useRef(false);

  useEffect(() => {
    const s = window.speechSynthesis; if (!s) return;
    const load = () => {
      const vs = s.getVoices().filter(v => v.lang === "ko-KR" || v.lang.startsWith("ko"));
      const male = vs.find(v => /male|남성|hyun|jun|min/i.test(v.name))
                || vs.find(v => /google.*ko|ko.*google/i.test(v.name) && !/yuna|female|여/i.test(v.name));
      const female = vs.find(v => /yuna|female|여성/i.test(v.name))
                  || vs.find(v => /google/i.test(v.name));
      const fallback = vs[0] || null;
      voicesRef.current = { male: male||fallback, female: female||fallback, fallback };
    };
    load(); s.onvoiceschanged = load;
    return () => { s.onvoiceschanged = null; };
  }, []);

  const unlock = useCallback(() => {
    if (unRef.current) return;
    const s = window.speechSynthesis; if (!s) return;
    const u = new SpeechSynthesisUtterance(" ");
    u.lang = "ko-KR"; u.volume = 0; u.rate = 10;
    s.speak(u); unRef.current = true;
  }, []);

  const speak = useCallback((text, idx, character = "default") => {
    const s = window.speechSynthesis;
    if (!s) { setTtsHint(true); setTimeout(() => setTtsHint(false), 3000); return; }
    if (speaking === idx) { s.cancel(); setSpeaking(null); return; }
    s.cancel();
    const tts = cleanTTS(text.replace(/같이/g, "가치").replace(/굳이/g, "구지"));
    if (!tts) return;

    const doSpeak = () => {
      const profile = TTS_PROFILES[character] || TTS_PROFILES.default;
      const isQ = /[?？]/.test(text);
      const u = new SpeechSynthesisUtterance(tts);
      u.lang   = "ko-KR";
      u.volume = profile.volume;
      u.rate   = profile.rate  * (isQ ? 0.93 : 1.0);
      u.pitch  = profile.pitch * (isQ ? 1.12 : 1.0);
      const { male, female, fallback } = voicesRef.current;
      if      (character === "jake")   u.voice = male   || fallback;
      else if (character === "miso")   u.voice = female || fallback;
      else if (character === "haneul") u.voice = female || fallback;
      else                             u.voice = fallback;

      u.onstart = () => { setSpeaking(idx); setTtsHint(false); };
      u.onend   = () => setSpeaking(null);
      u.onerror = (e) => {
        setSpeaking(null);
        if (e.error !== "interrupted") { setTtsHint(true); setTimeout(() => setTtsHint(false), 4000); }
      };

      // speak() 먼저 실행
      s.speak(u);

      // ✅ V122 수정 2: Android Chrome 묵음 버그 수정
      // pause/resume 타이머 방식 제거 → keepAlive 단독 방식으로 변경
      // 100ms마다 paused 상태 감지 후 즉시 resume — 중간 멈춤 완전 대응
      if (/android/i.test(navigator.userAgent)) {
        const keepAlive = setInterval(() => {
          if (!s.speaking) { clearInterval(keepAlive); return; }
          if (s.paused) s.resume();
        }, 100);
        // 60초 후 강제 종료 (무한루프 방지)
        setTimeout(() => clearInterval(keepAlive), 60000);
      }
    };

    // voices 로드 대기 — Android/iOS에서 voices가 늦게 로드되는 문제 해결
    const voices = s.getVoices();
    if (voices.length > 0) {
      doSpeak();
    } else {
      s.onvoiceschanged = () => {
        s.onvoiceschanged = null;
        const vs = s.getVoices().filter(v => v.lang === "ko-KR" || v.lang.startsWith("ko"));
        const male = vs.find(v => /male|남성|hyun|jun|min/i.test(v.name))
                  || vs.find(v => /google.*ko|ko.*google/i.test(v.name) && !/yuna|female|여/i.test(v.name));
        const female = vs.find(v => /yuna|female|여성/i.test(v.name))
                    || vs.find(v => /google/i.test(v.name));
        voicesRef.current = { male: male || vs[0], female: female || vs[0], fallback: vs[0] || null };
        doSpeak();
      };
      setTimeout(doSpeak, 1000);
    }
  }, [speaking]);

  return { speaking, ttsHint, unlock, speak };
}

// ✅ V144: useSTT — Web Speech API 음성 입력 훅
function useSTT({ onResult }) {
  const [listening, setListening] = useState(false);
  const [sttError,  setSttError]  = useState("");   // "unsupported" | "denied" | ""
  const recogRef = useRef(null);

  // 아이폰 + Chrome 조합 감지 (iOS에서 Chrome은 STT 미지원)
  const isIOS    = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isChrome = /CriOS/.test(navigator.userAgent);   // iOS Chrome 식별자
  const iosChrome = isIOS && isChrome;

  const supported = !iosChrome && (
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );

  function startListening() {
    if (!supported) { setSttError("unsupported"); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r  = new SR();
    r.lang         = "ko-KR";
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onstart  = () => { setListening(true); setSttError(""); };
    r.onend    = () => setListening(false);
    r.onerror  = (e) => {
      setListening(false);
      if (e.error === "not-allowed") setSttError("denied");
    };
    r.onresult = (e) => {
      const text = e.results[0][0].transcript;
      if (text) onResult(text);
    };
    recogRef.current = r;
    r.start();
  }

  function stopListening() {
    recogRef.current?.stop();
    setListening(false);
  }

  return { listening, sttError, supported, iosChrome, startListening, stopListening };
}

const StreetScene = () => (
  <svg viewBox="0 0 360 200" xmlns="http://www.w3.org/2000/svg" style={{width:"100%",height:"auto",borderRadius:14,display:"block"}}>
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5B9FD4"/><stop offset="100%" stopColor="#A8CCE8"/></linearGradient>
      <linearGradient id="road" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6B6B6B"/><stop offset="100%" stopColor="#4A4A4A"/></linearGradient>
      <linearGradient id="b1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#C8956C"/><stop offset="100%" stopColor="#A0724A"/></linearGradient>
      <linearGradient id="b2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7EB8B0"/><stop offset="100%" stopColor="#4E8F87"/></linearGradient>
      <linearGradient id="b3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#9B8EC4"/><stop offset="100%" stopColor="#6B5E9E"/></linearGradient>
      <linearGradient id="b4" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#E8856A"/><stop offset="100%" stopColor="#C05A3A"/></linearGradient>
      <linearGradient id="pv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#B0A898"/><stop offset="100%" stopColor="#8A8070"/></linearGradient>
      <filter id="gl"><feGaussianBlur stdDeviation="1.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <rect width="360" height="200" fill="url(#sky)"/>
    <g opacity=".92"><ellipse cx="62" cy="32" rx="30" ry="14" fill="white"/><ellipse cx="48" cy="36" rx="20" ry="12" fill="white"/><ellipse cx="80" cy="37" rx="22" ry="11" fill="white"/></g>
    <g opacity=".88"><ellipse cx="260" cy="25" rx="26" ry="11" fill="white"/><ellipse cx="246" cy="29" rx="17" ry="10" fill="white"/><ellipse cx="275" cy="29" rx="18" ry="9" fill="white"/></g>
    <polygon points="0,158 360,158 360,200 0,200" fill="url(#road)"/>
    {[20,65,110,155,200,245,290,335].map((x,i)=><rect key={i} x={x} y="174" width="30" height="5" rx="2" fill="#E8D44D" opacity=".7"/>)}
    <polygon points="0,148 360,148 360,162 0,162" fill="url(#pv)"/>
    <rect x="0" y="58" width="68" height="104" fill="url(#b1)"/>
    {[[6,70],[36,70],[6,98],[36,98],[6,126],[36,126]].map(([wx,wy],i)=><g key={i}><rect x={wx} y={wy} width="18" height="20" rx="2" fill="#1A2A3A" opacity=".85"/><rect x={wx+2} y={wy+2} width="6" height="8" rx="1" fill="#4A90D9" opacity=".5"/><rect x={wx+10} y={wy+2} width="6" height="8" rx="1" fill="#4A90D9" opacity=".5"/></g>)}
    <rect x="20" y="128" width="26" height="30" rx="2" fill="#1A1A1A" opacity=".8"/>
    <rect x="82" y="38" width="72" height="122" fill="url(#b2)"/>
    {[42,56,70,84,98,112,126,140].map((y,r)=>[86,100,114,128,140].map((x,c)=><rect key={r+"-"+c} x={x} y={y} width="11" height="11" rx="1" fill={r%3===0?"#A8D8D0":"#7EC8C0"} opacity=".55"/>))}
    <rect x="158" y="50" width="56" height="110" fill="url(#b3)"/>
    {[[162,62],[180,62],[196,62],[162,84],[180,84],[196,84],[162,106],[180,106],[196,106],[162,128],[180,128],[196,128]].map(([wx,wy],i)=><rect key={i} x={wx} y={wy} width="14" height="16" rx="1" fill={i%4===0?"#FFE082":"#1A2540"} opacity=".8"/>)}
    <rect x="220" y="44" width="64" height="116" fill="url(#b4)"/>
    {[[224,50],[242,50],[258,50],[272,50],[224,68],[242,68],[258,68],[272,68],[224,86],[242,86],[258,86],[272,86],[224,104],[242,104],[258,104],[272,104],[224,122],[242,122],[258,122],[272,122]].map(([wx,wy],i)=><rect key={i} x={wx} y={wy} width="14" height="16" rx="1" fill="#1A2840" opacity=".8"/>)}
    <rect x="224" y="136" width="56" height="14" rx="2" fill="#B04020" opacity=".9"/>
    <rect x="290" y="60" width="70" height="100" fill="#8AACC0"/>
    {[[294,68],[310,68],[326,68],[342,68],[294,86],[310,86],[326,86],[342,86],[294,104],[310,104],[326,104],[342,104],[294,122],[310,122],[326,122],[342,122]].map(([wx,wy],i)=><rect key={i} x={wx} y={wy} width="12" height="14" rx="1" fill={i===5||i===9?"#FFD070":"#1A2840"} opacity=".78"/>)}
    <rect x="147" y="112" width="6" height="38" rx="2" fill="#5D3A1A"/>
    <ellipse cx="150" cy="106" rx="16" ry="18" fill="#2E7D32"/>
    <ellipse cx="142" cy="112" rx="10" ry="12" fill="#388E3C"/>
    <ellipse cx="159" cy="112" rx="10" ry="12" fill="#1B5E20"/>
    <rect x="76" y="100" width="3" height="50" fill="#4A4A4A"/>
    <path d="M78,100 Q90,92 95,96" fill="none" stroke="#4A4A4A" strokeWidth="2.5"/>
    <ellipse cx="95" cy="97" rx="5" ry="3" fill="#FFE082" filter="url(#gl)" opacity=".9"/>
    <g opacity=".85"><circle cx="174" cy="141" r="5" fill="#2C3E50"/><rect x="171" y="146" width="6" height="12" rx="2" fill="#34495E"/><line x1="171" y1="149" x2="166" y2="155" stroke="#2C3E50" strokeWidth="2" strokeLinecap="round"/><line x1="177" y1="149" x2="182" y2="153" stroke="#2C3E50" strokeWidth="2" strokeLinecap="round"/><line x1="172" y1="158" x2="170" y2="165" stroke="#2C3E50" strokeWidth="2" strokeLinecap="round"/><line x1="176" y1="158" x2="178" y2="165" stroke="#2C3E50" strokeWidth="2" strokeLinecap="round"/></g>
  </svg>
);

const DAILY_TOPICS = [
  {emoji:"🍜",text:"한국의 배달 음식 문화"},{emoji:"📱",text:"SNS와 현대인의 소통 방식"},
  {emoji:"🏙️",text:"서울의 빠른 변화와 옛 골목"},{emoji:"🌿",text:"환경을 생각하는 소비 습관"},
  {emoji:"🎓",text:"한국의 교육열"},{emoji:"🤖",text:"AI 시대, 우리는 무엇을 배워야 할까"},
  {emoji:"☕",text:"카페 문화와 혼자만의 시간"},{emoji:"🎵",text:"K-pop이 세계로 퍼진 이유"},
];

const CHARS = [
  {key:"jake",  emoji:"👦", name:"제이크",     sub:"활기찬 대학생 친구",  color:C.sky,    bg:"#EBF8FF", initMsg:"어~ 안녕하세요! 😊 저 제이크예요, 반가워요! 지금 어디 사세요? 한국어 얼마나 배우셨어요?"},
  {key:"miso",  emoji:"👩‍🏫", name:"미소 선생님",sub:"다정한 한국어 선생님",color:C.pink,   bg:"#FFF0F6", initMsg:"안녕하세요, 학습자님 😊 저는 미소 선생님이에요. 오늘 어떤 주제로 이야기해 볼까요?"},
  {key:"haneul",emoji:"🎒", name:"하늘이",     sub:"귀여운 어린이 친구",  color:C.yellow, bg:"#FFFBEB", initMsg:"안녕하세요~! 🎈 나는 하늘이예요! 같이 놀아요! 오늘 뭐 했어요?"},
];

const CHARS_VIETNAM = [
  {key:"jake_vietnam", emoji:"👦", name:"제이크 (베트남 특화)", sub:"한-베트남 문화 브릿지", color:C.sky, bg:"#EBF8FF", initMsg:"안녕하세요! 😊 저 제이크예요! 베트남에서 오셨어요? 반가워요! 베트남 음식 중에 뭘 제일 좋아해요?"},
];

function renderFeedback(text, accentColor) {
  if (!text) return null;
  const lines = text.split("\n").filter(l => l.trim() !== "---").map(l => l.trim());
  return lines.map((line, i) => {
    if (!line) return <div key={i} style={{height:6}}/>;
    if (/^[""].*[""]$/.test(line)) {
      const clean = line.replace(/^[""]|[""]$/g,"");
      return (
        <div key={i} style={{margin:"10px 0",padding:"11px 14px",background:`${accentColor}18`,borderLeft:`4px solid ${accentColor}`,borderRadius:"0 10px 10px 0",fontSize:14,fontWeight:700,color:accentColor,lineHeight:1.7}}>
          "{clean}"
        </div>
      );
    }
    if (/^#{1,3}\s/.test(line)) {
      return <div key={i} style={{fontSize:13,fontWeight:700,color:accentColor,marginTop:10,marginBottom:2}}>{line.replace(/^#{1,3}\s/,"")}</div>;
    }
    const parts = line.split(/(\*\*.*?\*\*)/g);
    const rendered = parts.map((p,j) =>
      /^\*\*.*\*\*$/.test(p)
        ? <strong key={j} style={{fontWeight:700,color:"#333"}}>{p.slice(2,-2)}</strong>
        : <span key={j}>{p}</span>
    );
    return <div key={i} style={{fontSize:13,color:"#444",lineHeight:1.8,marginBottom:2}}>{rendered}</div>;
  });
}

function TodayTopic({purple}) {
  const t = DAILY_TOPICS[new Date().getDay() % DAILY_TOPICS.length];
  return (
    <div style={{background:`linear-gradient(135deg,${purple}18,#FFD93D18)`,border:`1.5px solid ${purple}33`,borderRadius:16,padding:"13px 16px",marginBottom:14,display:"flex",alignItems:"center",gap:12}}>
      <div style={{fontSize:28,flexShrink:0}}>{t.emoji}</div>
      <div>
        <div style={{fontSize:10,fontWeight:800,color:purple,letterSpacing:.5,marginBottom:3}}>💬 오늘의 추천 글쓰기 주제</div>
        <div style={{fontSize:14,fontWeight:700,color:"#333"}}>{t.text}</div>
        <div style={{fontSize:11,color:"#aaa",marginTop:2}}>이 주제로 튜터와 이야기해 보세요!</div>
      </div>
    </div>
  );
}

// ✅ V122 수정8: 학습 성장 경로 시각화 컴포넌트
// 근거: 적용/개선 No.3, No.5 (적응→자립→기여 3단계)
// "기여" 예시: 통번역·멘토 등 — 고정 직함이 아닌 열린 표현으로 표시
function GrowthPathBanner({ level }) {
  const steps = [
    {
      emoji: "🌱", label: "적응", sub: "TOPIK 3~4급",
      desc: "일상 소통\n기초 자립", color: C.teal, bg: "#E8FAF8",
      active: level === "mid",
    },
    {
      emoji: "🌿", label: "자립", sub: "TOPIK 5~6급",
      desc: "직장·학업\n사회 참여", color: C.pink, bg: "#FFF0F6",
      active: level === "adv",
    },
    {
      emoji: "🌳", label: "기여", sub: "TOPIK 합격 후",
      desc: "통번역·멘토\n등 지역사회", color: C.orange, bg: "#FFF3E8",
      active: false,
    },
  ];
  return (
    <div style={{background:"white",border:"1.5px solid #e8e8e8",borderRadius:16,padding:"14px 16px",marginBottom:16,maxWidth:340,width:"100%",boxShadow:"0 2px 12px rgba(0,0,0,.06)"}}>
      <div style={{fontSize:11,fontWeight:800,color:"#aaa",letterSpacing:.5,marginBottom:10,textAlign:"center"}}>
        📍 나의 한국어 성장 경로
      </div>
      <div style={{display:"flex",alignItems:"center",gap:0}}>
        {steps.map((s, i) => (
          <div key={i} style={{display:"flex",alignItems:"center",flex:1}}>
            <div style={{flex:1,background:s.active?s.bg:"#fafafa",border:`2px solid ${s.active?s.color:"#e0e0e0"}`,borderRadius:12,padding:"10px 6px",textAlign:"center",boxShadow:s.active?`0 2px 10px ${s.color}30`:"none",transition:"all .2s"}}>
              <div style={{fontSize:22,marginBottom:3}}>{s.emoji}</div>
              <div style={{fontSize:13,fontWeight:900,color:s.active?s.color:"#bbb",marginBottom:2}}>{s.label}</div>
              <div style={{fontSize:9,color:s.active?s.color:"#ccc",fontWeight:700,marginBottom:3}}>{s.sub}</div>
              <div style={{fontSize:9,color:s.active?"#666":"#ccc",lineHeight:1.5,whiteSpace:"pre-line"}}>{s.desc}</div>
            </div>
            {i < steps.length - 1 && (
              <div style={{fontSize:14,color:"#ccc",padding:"0 3px",flexShrink:0}}>→</div>
            )}
          </div>
        ))}
      </div>
      <div style={{fontSize:10,color:"#bbb",textAlign:"center",marginTop:8,lineHeight:1.5}}>
        한글 친구는 적응을 넘어 자립과 기여까지 함께해요 🇰🇷
      </div>
    </div>
  );
}

// ✅ V130: 중급 퀴즈 뱅크
const MID_QUIZ = [
  {q:"'결정하다'와 비슷한 말은?", answer:"정하다", opts:["정하다","부르다","넘다","받다"]},
  {q:"'천천히'의 반대말은?", answer:"빨리", opts:["빨리","조용히","혼자","가끔"]},
  {q:"'기분이 좋다'를 다르게 표현하면?", answer:"즐겁다", opts:["즐겁다","피곤하다","어렵다","무섭다"]},
  {q:"'매우'와 같은 뜻으로 쓸 수 있는 말은?", answer:"아주", opts:["아주","조금","별로","거의"]},
  {q:"'부탁하다'와 가장 가까운 표현은?", answer:"요청하다", opts:["요청하다","거절하다","기억하다","준비하다"]},
  {q:"'약속을 ___다' — 알맞은 말은?", answer:"지키", opts:["지키","만들","고치","버리"]},
  {q:"'감사합니다'보다 더 격식 있는 표현은?", answer:"감사드립니다", opts:["감사드립니다","고마워요","감사해","고맙긴 해"]},
  {q:"'조금'의 반대 개념에 가장 가까운 말은?", answer:"많이", opts:["많이","가끔","다시","또"]},
];

// ✅ V130: 고급 퀴즈 뱅크 (사자성어·관용구)
const ADV_QUIZ = [
  {q:"'일석이조(一石二鳥)'의 뜻은?", answer:"한 가지 행동으로 두 가지 이득을 얻음", opts:["한 가지 행동으로 두 가지 이득을 얻음","어려운 일도 열심히 하면 됨","혼자보다 함께가 낫다는 뜻","작은 것부터 시작해야 한다는 뜻"]},
  {q:"'발이 넓다'는 표현의 뜻은?", answer:"아는 사람이 많다", opts:["아는 사람이 많다","걷는 것을 좋아한다","자주 여행을 간다","발이 크다"]},
  {q:"'산 넘어 산'의 뜻은?", answer:"어려움이 계속 이어짐", opts:["어려움이 계속 이어짐","자연이 아름답다","멀리 여행을 간다","목표에 가까워짐"]},
  {q:"'배보다 배꼽이 크다'의 뜻은?", answer:"부수적인 것이 주된 것보다 더 큼", opts:["부수적인 것이 주된 것보다 더 큼","배가 많이 고프다","일이 계획보다 잘 됨","이익이 매우 크다"]},
  {q:"'우공이산(愚公移山)'이 주는 교훈은?", answer:"끈기와 노력으로 불가능도 가능해짐", opts:["끈기와 노력으로 불가능도 가능해짐","빠른 결정이 중요하다","혼자 하는 것이 낫다","산에서 지혜를 얻어야 한다"]},
  {q:"'손이 크다'는 관용구의 뜻은?", answer:"씀씀이가 넉넉하고 후하다", opts:["씀씀이가 넉넉하고 후하다","손이 물리적으로 크다","일을 잘 한다","욕심이 많다"]},
  {q:"'고진감래(苦盡甘來)'의 뜻은?", answer:"고생 끝에 즐거움이 옴", opts:["고생 끝에 즐거움이 옴","달콤한 것을 먹으면 기분이 좋아짐","고생은 피해야 한다","즐거움은 짧게 온다"]},
  {q:"'눈이 높다'는 관용구의 뜻은?", answer:"기준이나 이상이 높다", opts:["기준이나 이상이 높다","시력이 좋다","높은 곳을 잘 본다","욕심이 없다"]},
];

function SpeakTab({level, uid, unlock, speaking, speak, begReady}) {
  const [character, setCharacter] = useState(null);
  const [chatUI,    setChatUI]    = useState([]);
  const [apiMsgs,   setApiMsgs]   = useState([]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [recorded,  setRecorded]  = useState(false);
  const [motivation, setMotivation] = useState(null);
  // ✅ V122 수정7: 상황 맥락 선택 state (주제가 아닌 상황만 선택)
  const [context, setContext] = useState(null);
  // ✅ V130: 중·고급 퀴즈용 턴 카운트
  const [turnCount, setTurnCount] = useState(0);
  const chatEnd = useRef(null);
  // ✅ V144: STT 훅 연결
  const { listening, sttError, supported: sttSupported, iosChrome,
          startListening, stopListening } = useSTT({
    onResult: (text) => setInput(prev => prev ? prev + " " + text : text),
  });
  const lvKey = level === "adv" ? "adv" : "mid";

  const MOTIVATION_HINTS = {
    kpop:    "학습자는 K팝·드라마·영화에 관심이 많아요. 관련 문화 어휘(예: 최애, 컴백, 팬미팅, OST 등)를 자연스럽게 대화에 녹이고, 좋아하는 아티스트나 작품 이야기로 대화를 시작해 보세요. 오늘 본 드라마나 예능 이야기를 먼저 물어보세요.",
    work:    "학습자는 한국 직장 생활·비즈니스에 관심이 있어요. 직장 상황별 표현을 자연스럽게 연습시켜 주세요. 아래 시나리오 중 하나를 대화 흐름에 맞게 활용하세요: (1) 회의에서 반대 의견 부드럽게 말하기 — '저는 조금 다르게 생각하는데요, 혹시 ~는 어떨까요?' (2) 동료에게 업무 부탁하기 — '바쁘신 거 알지만, 혹시 이것 좀 도와주실 수 있을까요?' (3) 상사에게 보고하기 — '말씀드릴 사항이 있는데요, 잠깐 시간 괜찮으세요?' (4) 회식 자리 음식 추천하기 — '여기 삼겹살이 맛있다고 하던데, 드셔보셨어요?' 틀린 표현은 자연스럽게 교정하고, 격식체와 비격식체 차이도 설명해 주세요.",
    family:  "학습자는 가족·친구·일상 대화를 배우고 싶어해요. 일상적인 상황(식사, 주말 계획, 날씨, 감정 표현)을 주제로 친근하게 대화해 주세요.",
    culture: "학습자는 한국 문화·여행에 관심이 있어요. 한국 음식, 관광지, 전통 풍습, 한국인의 생활 방식을 주제로 대화하고 관련 어휘를 소개해 주세요.",
    study:   "학습자는 TOPIK 시험·학업을 목표로 해요. 학습에 도움이 되는 표현과 어휘를 사용하고, 틀린 표현이 있으면 TOPIK 기준에 맞게 부드럽게 교정해 주세요.",
    safety:  `학습자는 제조·건설·조선 등 산업 현장에서 일하고 있어요. 안전 한국어 표현을 자연스럽게 연습시켜 주세요. 오늘의 안전 시나리오: '${todaySafety.situation}' — 핵심 표현: '${todaySafety.expression}' (팁: ${todaySafety.tip}). 작업 지시·안전 수칙·응급 상황 표현을 실제처럼 연습시켜 주세요. 오늘 작업 순서를 한국어로 설명해보라고 부탁해 보세요.`,
    vietnam: "학습자는 베트남어권 학습자예요. 한-베트남 공통 정서를 활용한 문화 브릿지 대화를 이끌어 주세요. 콩쥐팥쥐와 베트남의 비슷한 이야기 비교, 설날 비교, 한국 음식과 베트남 음식 비교 등 자연스러운 문화 연결 질문을 대화 중에 녹여주세요.",
    folk: "학습자는 한국 전래동화·전통문화에 관심이 있어요. 흥부와 놀부·콩쥐팥쥐·선녀와 나무꾼 등 전래동화 캐릭터의 감정과 상황을 소재로 자연스럽게 대화를 이끌어 주세요. '흥부처럼 착한 마음이 있나요?', '콩쥐 같은 경험 있어요?' 형태로 학습자 경험과 연결하세요. 전통 어휘(박, 제비, 도깨비방망이 등)도 자연스럽게 소개해 주세요.",
  };

  const charKey = character === "jake_vietnam"
    ? "jake_vietnam"
    : character
    ? `${character}_${lvKey}`
    : "jake_mid";
  const basePrompt = PROMPTS.speak[charKey] || PROMPTS.speak.jake_mid;
  const motivationCtx = motivation && MOTIVATION_HINTS[motivation] ? '\n[학습 동기 맞춤] ' + MOTIVATION_HINTS[motivation] : '';
  // ✅ V122 수정7: 상황 맥락 힌트 — "주제"가 아닌 "상황" 설정
  const CONTEXT_HINTS = {
    daily:    "\n[상황 맥락] 학습자가 현재 일상적인 상황(집, 카페, 시장, 이웃과의 대화 등)에 있다고 가정해. 특별한 주제를 제시하지 말고, 자연스럽게 오늘 하루 이야기를 물어봐. 예: '오늘 뭐 했어요?', '점심 뭐 드셨어요?'",
    workplace:"\n[상황 맥락] 학습자가 한국 직장이나 현장 상황에 있다고 가정해. 업무 관련 표현이 나오면 자연스럽게 교정하고, 격식체·비격식체 차이도 알려줘. 주제를 먼저 제시하지 말고 '요즘 직장에서 어때요?' 처럼 경험을 물어봐.",
    home:     "\n[상황 맥락] 학습자가 집에서 가족이나 친구와 이야기하는 상황이야. 편안하고 친근한 분위기로, 음식·가족·일상 소재가 나오면 자연스럽게 이어받아. 주제 제시 금지.",
    outside:  "\n[상황 맥락] 학습자가 한국 거리·가게·식당·카페 등 실외에 있는 상황이야. 주문하기, 길 물어보기, 가게에서 대화하기 등이 나올 수 있어. 경험을 물어보면서 시작해.",
  };
  const contextCtx = context && CONTEXT_HINTS[context] ? CONTEXT_HINTS[context] : '';
  const workplaceCtx = (motivation === 'work' && todayWorkplace)
    ? '\n[오늘의 직장 시나리오] 오늘은 \''+todayWorkplace.situation+'\' 상황을 연습해 보세요. 핵심 표현: \''+todayWorkplace.expression+'\' — '+todayWorkplace.tip+'.'
    : '';
  const safetyCtx = (motivation === 'safety' && todaySafety)
    ? '\n[오늘의 안전 시나리오] 반드시 첫 대화 시작 시 오늘의 안전 표현을 꺼내주세요. 오늘 상황: \''+todaySafety.situation+'\'. 핵심 표현: \''+todaySafety.expression+'\'. 팁: '+todaySafety.tip+'. 예시: "오늘은 \''+todaySafety.situation+'\' 상황을 같이 연습해봐요! \''+todaySafety.expression+'\' — 이 표현 알아요?" 형태로 자연스럽게 시작하세요.'
    : '';
  const sys = basePrompt + motivationCtx + contextCtx + (todayKeyword ? '\n[오늘의 문화 어휘] 오늘 대화에서 \''+todayKeyword.word+'\' 라는 표현을 자연스럽게 소개해 보세요. 뜻: '+todayKeyword.meaning+'. 관련 주제: '+todayKeyword.topic+'.' : '') + workplaceCtx + safetyCtx;

  useEffect(() => { chatEnd.current?.scrollIntoView({behavior:"smooth"}); }, [chatUI, loading]);

  // ✅ V130: 중·고급 퀴즈 생성
  function makeMidAdvQuiz() {
    const bank = level === "adv" ? ADV_QUIZ : MID_QUIZ;
    const q = bank[Math.floor(Math.random() * bank.length)];
    return {type:"quiz", question:`✨ 잠깐 연습해요!\n${q.q}`, answer:q.answer, options:[...q.opts].sort(()=>Math.random()-0.5), selected:null};
  }

  async function sendMsg() {
    if (!input.trim() || loading) return;
    const txt = sanitize(input.trim());
    if (!txt || txt === "[보안 필터]") { setInput(""); return; }
    setInput("");
    const newUI  = [...chatUI,  {role:"user", text:txt}];
    const newAPI = [...apiMsgs, {role:"user", content:txt}];
    setChatUI(newUI); setLoading(true);
    const reply = await callClaude(newAPI, sys);
    const nextTurn = turnCount + 1;
    // ✅ V130: 5턴마다 퀴즈 카드 삽입
    if (nextTurn % 5 === 0) {
      const quiz = makeMidAdvQuiz();
      setChatUI([...newUI, {role:"assistant", text:reply}, quiz]);
    } else {
      setChatUI([...newUI, {role:"assistant", text:reply}]);
    }
    setApiMsgs([...newAPI, {role:"assistant", content:reply}]);
    setTurnCount(nextTurn);
    if (!recorded && uid) { recordStat(uid,"speak"); setRecorded(true); }
    setLoading(false);
  }

  function getInitMsg(ch, mot) {
    if (mot === 'safety' && todaySafety) {
      const name = ch.key === 'haneul' ? '하늘이' : ch.key === 'miso' ? '미소 선생님' : '제이크';
      return '안녕하세요! 😊 저 ' + name + '예요! 오늘은 현장 안전 한국어 연습해봐요! 💪\n\n오늘 상황: "' + todaySafety.situation + '" 🦺\n\n"' + todaySafety.expression + '"\n\n이 표현 알아요? 현장에서 정말 중요한 표현이에요! 같이 연습해봐요!';
    }
    if (mot === 'work' && todayWorkplace) {
      const name = ch.key === 'haneul' ? '하늘이' : ch.key === 'miso' ? '미소 선생님' : '제이크';
      return '안녕하세요! 😊 저 ' + name + '예요! 오늘은 직장 한국어 연습해봐요! 💼\n\n오늘 상황: "' + todayWorkplace.situation + '"\n핵심 표현: "' + todayWorkplace.expression + '"\n\n이 표현 써봐요!';
    }
    if (mot === 'vietnam') {
      return '안녕하세요! 😊 저 제이크예요! 베트남에서 오셨어요? 반가워요! 🇻🇳 베트남 음식 중에 뭘 제일 좋아해요?';
    }
    if (mot === 'folk') {
      const name = ch.key === 'haneul' ? '하늘이' : ch.key === 'miso' ? '미소 선생님' : '제이크';
      return '안녕하세요! 😊 저 ' + name + '예요! 오늘은 한국 전래동화로 한국어 연습해봐요! 🎎\n\n흥부와 놀부, 콩쥐팥쥐 들어봤어요?\n\n"흥부는 착하고, 놀부는 욕심이 많아요."\n\n이 이야기에서 좋아하는 캐릭터가 있어요? 😊';
    }
    return ch.initMsg;
  }

  function selectChar(ch) {
    setCharacter(ch.key);
    const msg = getInitMsg(ch, motivation);
    const showImage = ch.key === 'jake' || ch.key === 'jake_vietnam';
    setChatUI([{role:'assistant', text:msg, image:showImage}]);
    setApiMsgs([{role:'assistant', content:msg}]);
  }

  // ✅ V140: 초급 처리
  if (level === "beg") {
    // begReady=false: BegScreen 재진입 (언어/커리큘럼/계획/주제 선택)
    if (!begReady) return <BegScreen user={{uid, displayName:"", email:""}} onBack={()=>{}} begSpeak={true}/>;
    // begReady=true: BegScreen 채팅 화면으로 직접 연결
    return <BegScreen user={{uid, displayName:"", email:""}} onBack={()=>{}} begSpeak={true} skipToLearn={true}/>;
  }

    if (!motivation) return (
    <div style={{padding:"8px 0"}}>
      <div style={{background:"white",borderRadius:18,padding:"18px 16px",boxShadow:"0 4px 18px rgba(0,0,0,.07)",marginBottom:14,textAlign:"center"}}>
        <div style={{fontSize:28,marginBottom:6}}>🌟</div>
        <div style={{fontSize:17,fontWeight:900,color:"#333",marginBottom:4}}>왜 한국어를 배우세요?</div>
        <div style={{fontSize:13,color:"#999"}}>딱 맞는 대화 주제로 연결해 드릴게요!</div>
      </div>
      {[
        {key:"kpop",    emoji:"🎵", label:"K팝 · 드라마 · 영화",  color:C.pink,   bg:"#FFF0F6"},
        {key:"work",    emoji:"💼", label:"한국 직장 · 비즈니스", color:C.teal,   bg:"#E8FAF8", sub:`오늘: ${todayWorkplace ? todayWorkplace.situation : "직장 표현"}`},
        {key:"family",  emoji:"👨‍👩‍👧", label:"가족 · 친구 · 일상",   color:C.sky,    bg:"#EBF8FF"},
        {key:"culture", emoji:"🏛️", label:"한국 문화 · 여행",     color:C.orange, bg:"#FFF3E8"},
        {key:"study",   emoji:"📚", label:"TOPIK · 학업 · 진학",  color:C.purple, bg:"#F5F0FF"},
        {key:"safety",  emoji:"⛑️", label:"현장 안전 한국어",     color:"#E53935", bg:"#FFF5F5", sub:`오늘: ${todaySafety.situation}`},
        {key:"vietnam", emoji:"🇻🇳", label:"베트남 특화 대화",     color:"#1565C0", bg:"#E8F0FE", sub:"한-베트남 문화 연결"},
        {key:"folk",    emoji:"🎎", label:"한국 전래동화 · 전통",  color:"#6D4C41", bg:"#FBF0E4", sub:"흥부놀부·콩쥐팥쥐 역할극"},
      ].map(m => (
        <button key={m.key} onClick={()=>setMotivation(m.key)} style={{width:"100%",marginBottom:10,background:m.bg,border:`2px solid ${m.color}55`,borderRadius:16,padding:"14px 18px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:14,WebkitTapHighlightColor:"transparent",touchAction:"manipulation"}}>
          <div style={{fontSize:30,flexShrink:0}}>{m.emoji}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:15,fontWeight:800,color:m.color}}>{m.label}</div>
            {m.sub && <div style={{fontSize:11,color:m.color,opacity:.75,marginTop:3}}>📅 {m.sub}</div>}
          </div>
          <div style={{fontSize:18,color:m.color,opacity:.5}}>›</div>
        </button>
      ))}
    </div>
  );

  // ✅ V122 수정7: 상황 맥락 선택 화면
  // safety/vietnam/folk/work는 상황 맥락 없이 바로 페르소나 선택으로
  if (!context && !["safety","vietnam","folk","work"].includes(motivation)) return (
    <div style={{padding:"8px 0"}}>
      <div style={{background:"white",borderRadius:18,padding:"18px 16px",boxShadow:"0 4px 18px rgba(0,0,0,.07)",marginBottom:14,textAlign:"center"}}>
        <div style={{fontSize:28,marginBottom:6}}>🗺️</div>
        <div style={{fontSize:17,fontWeight:900,color:"#333",marginBottom:4}}>지금 어떤 상황이에요?</div>
        <div style={{fontSize:13,color:"#999"}}>주제가 아닌 상황만 골라요 — 대화는 자연스럽게!</div>
      </div>
      {[
        {key:"daily",     emoji:"🏡", label:"집 · 일상",          sub:"오늘 하루 이야기",       color:C.teal,   bg:"#E8FAF8"},
        {key:"workplace", emoji:"🏢", label:"직장 · 학교",        sub:"한국 직장·학교 분위기",  color:C.sky,    bg:"#EBF8FF"},
        {key:"home",      emoji:"👨\u200d👩\u200d👧", label:"가족 · 친구와 함께", sub:"편안하고 친근한 대화",  color:C.pink,   bg:"#FFF0F6"},
        {key:"outside",   emoji:"🛍️", label:"거리 · 가게 · 식당", sub:"실외 실생활 한국어",     color:C.orange, bg:"#FFF3E8"},
      ].map(ctx => (
        <button key={ctx.key} onClick={()=>setContext(ctx.key)} style={{width:"100%",marginBottom:10,background:ctx.bg,border:`2px solid ${ctx.color}55`,borderRadius:16,padding:"14px 18px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:14,WebkitTapHighlightColor:"transparent",touchAction:"manipulation"}}>
          <div style={{fontSize:30,flexShrink:0}}>{ctx.emoji}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:15,fontWeight:800,color:ctx.color}}>{ctx.label}</div>
            <div style={{fontSize:12,color:"#888",marginTop:2}}>{ctx.sub}</div>
          </div>
          <div style={{fontSize:18,color:ctx.color,opacity:.5}}>›</div>
        </button>
      ))}
      <button onClick={()=>setContext("daily")} style={{width:"100%",marginTop:4,background:"none",border:"none",color:"#bbb",fontSize:13,cursor:"pointer",padding:"10px 0",WebkitTapHighlightColor:"transparent"}}>
        그냥 바로 시작할게요 →
      </button>
    </div>
  );


  if (!character) {
    const availableChars = motivation === "vietnam"
      ? [...CHARS, ...CHARS_VIETNAM]
      : CHARS;
    return (
      <div style={{padding:"8px 0"}}>
        <div style={{background:"white",borderRadius:18,padding:"18px 16px",boxShadow:"0 4px 18px rgba(0,0,0,.07)",marginBottom:14,textAlign:"center"}}>
          <div style={{fontSize:28,marginBottom:6}}>💬</div>
          <div style={{fontSize:17,fontWeight:900,color:"#333",marginBottom:4}}>누구와 대화할까요?</div>
          <div style={{fontSize:13,color:"#999"}}>원하는 친구를 선택해 주세요!</div>
        </div>
        {availableChars.map(ch => (
          <button key={ch.key} onClick={() => selectChar(ch)} style={{width:"100%",marginBottom:12,background:ch.bg,border:`2px solid ${ch.color}55`,borderRadius:18,padding:"16px 18px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:14,WebkitTapHighlightColor:"transparent",touchAction:"manipulation"}}>
            <div style={{fontSize:40,flexShrink:0}}>{ch.emoji}</div>
            <div>
              <div style={{fontSize:17,fontWeight:900,color:ch.color,marginBottom:2}}>{ch.name}</div>
              <div style={{fontSize:13,color:"#777"}}>{ch.sub}</div>
            </div>
            <div style={{marginLeft:"auto",fontSize:20,color:ch.color,opacity:.5}}>›</div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* ✅ V144: 마이크 pulse 애니메이션 */}
      <style>{`@keyframes pulse{0%,100%{box-shadow:0 0 0 4px rgba(255,107,107,0.3)}50%{box-shadow:0 0 0 8px rgba(255,107,107,0.1)}}`}</style>
      <div style={{background:"white",borderRadius:18,padding:12,minHeight:360,maxHeight:420,overflowY:"auto",boxShadow:"0 4px 18px rgba(0,0,0,.07)",marginBottom:10}}>
        {chatUI.map((m,i) => {
          // ✅ V130: 퀴즈 카드 렌더
          if (m.type === "quiz") return (
            <div key={i} style={{background:"#FFF8E1",border:"2px solid #FFD93D",borderRadius:16,padding:"14px",marginBottom:10}}>
              <div style={{fontSize:13,fontWeight:800,color:"#F39C12",marginBottom:8,whiteSpace:"pre-line"}}>{m.question}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {m.options.map((opt,j) => {
                  const answered = !!m.selected;
                  const isCorrect = opt === m.answer;
                  const isPicked = opt === m.selected;
                  return (
                    <button key={j} onClick={()=>{
                      if (m.selected) return;
                      const correct = opt === m.answer;
                      setChatUI(prev => prev.map((msg,idx) => idx===i ? {...msg, selected:opt} : msg));
                      const reaction = correct
                        ? `정답이에요! 🎉 "${m.answer}" — 정말 잘했어요! 😊`
                        : `아쉽지만 괜찮아요! 😊 정답은 "${m.answer}"이에요. 다시 기억해봐요 💪`;
                      setChatUI(prev => [...prev, {role:"assistant", text:reaction}]);
                    }}
                      style={{padding:"10px 8px",borderRadius:12,border:"2px solid",fontSize:13,fontWeight:700,cursor:answered?"default":"pointer",transition:"all .2s",textAlign:"center",
                        borderColor: !answered ? "#FFD93D" : isCorrect ? "#28a745" : isPicked ? "#e74c3c" : "#ddd",
                        background: !answered ? "white" : isCorrect ? "#D4EDDA" : isPicked ? "#FDECEA" : "#fafafa",
                        color: !answered ? "#555" : isCorrect ? "#28a745" : isPicked ? "#e74c3c" : "#bbb",
                        WebkitTapHighlightColor:"transparent"}}>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          );
          return (
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:10,alignItems:"flex-end",gap:6}}>
            {m.role==="assistant"&&<div style={{fontSize:24,flexShrink:0,lineHeight:1}}>👨‍🦱</div>}
            <div style={{maxWidth:"78%"}}>
              {m.image&&<div style={{marginBottom:6,borderRadius:12,overflow:"hidden"}}><StreetScene/></div>}
              <div style={{position:"relative"}}>
                <div style={{background:m.role==="user"?`linear-gradient(135deg,${C.pink},${C.coral})`:`linear-gradient(135deg,${C.teal},${C.sky})`,color:"white",padding:m.role==="assistant"?"9px 36px 9px 12px":"9px 12px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",fontSize:14,lineHeight:1.6,wordBreak:"break-word",whiteSpace:"pre-wrap"}}>{m.text}</div>
                {m.role==="assistant"&&(
                  <button
                    onPointerDown={() => {
                      unlock();
                      setTimeout(() => speak(m.text, `speak-${i}`, character), 100);
                    }}
                    aria-label="음성 재생"
                    style={{position:"absolute",right:4,top:"50%",transform:"translateY(-50%)",background:speaking===`speak-${i}`?"rgba(255,255,255,.5)":"rgba(255,255,255,.25)",border:"none",borderRadius:"50%",width:28,height:28,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",padding:0,WebkitTapHighlightColor:"transparent"}}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      {speaking===`speak-${i}`?<><rect x="5" y="4" width="4" height="16" rx="1.5" fill="white"/><rect x="15" y="4" width="4" height="16" rx="1.5" fill="white"/></>:<><path d="M11 5L6 9H2v6h4l5 4V5z" fill="white"/><path d="M19.07 4.93a10 10 0 010 14.14" stroke="white" strokeWidth="2" strokeLinecap="round"/><path d="M15.54 8.46a5 5 0 010 7.07" stroke="white" strokeWidth="2" strokeLinecap="round"/></>}
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
          );
        })}
        {loading&&<div style={{display:"flex",alignItems:"flex-end",gap:6}}><div style={{fontSize:24}}>👨‍🦱</div><div style={{background:"#f0f0f0",borderRadius:"16px 16px 16px 4px",padding:"9px 14px",color:"#999",fontSize:13}}>입력 중... ✍️</div></div>}
        <div ref={chatEnd}/>
      </div>
      {/* ✅ V144: 아이폰 + Chrome 감지 시 Safari 안내 문구 */}
      {iosChrome && (
        <div style={{background:"#FFF3CD",border:"1px solid #FFD93D",borderRadius:12,padding:"10px 14px",marginBottom:6,fontSize:13,color:"#5D4037",textAlign:"center",lineHeight:1.55}}>
          🍎 <strong>아이폰에서 음성 입력은 Safari로 열어주세요!</strong><br/>
          <span style={{fontSize:12,color:"#888"}}>Chrome 앱은 마이크 기능을 지원하지 않아요.</span>
        </div>
      )}
      {/* ✅ V144: 마이크 권한 거부 시 안내 */}
      {sttError === "denied" && (
        <div style={{background:"#FCE4D6",border:"1px solid #FF8C42",borderRadius:12,padding:"10px 14px",marginBottom:6,fontSize:13,color:"#5D4037",textAlign:"center"}}>
          🎤 마이크 권한이 거부됐어요. 브라우저 설정에서 마이크를 허용해주세요.
        </div>
      )}
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        {/* ✅ V144: 마이크 버튼 — STT 지원 환경에서만 표시 */}
        {sttSupported && (
          <button
            onPointerDown={unlock}
            onClick={listening ? stopListening : startListening}
            aria-label={listening ? "녹음 중지" : "음성 입력"}
            style={{flexShrink:0,width:50,height:50,
              background: listening
                ? `linear-gradient(135deg,#FF6B6B,#FF4757)`
                : `linear-gradient(135deg,#9C6FDE,#C3B1E1)`,
              border:"none",borderRadius:"50%",cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",
              WebkitTapHighlightColor:"transparent",touchAction:"manipulation",padding:0,
              boxShadow: listening ? "0 0 0 4px rgba(255,107,107,0.3)" : "none",
              animation: listening ? "pulse 1.2s infinite" : "none",
            }}>
            {listening
              ? <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><rect x="4" y="4" width="16" height="16" rx="3"/></svg>
              : <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="2" width="6" height="12" rx="3" fill="white"/>
                  <path d="M5 11a7 7 0 0014 0" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="12" y1="19" x2="12" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="8"  y1="22" x2="16" y2="22" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
            }
          </button>
        )}
        <div style={{flex:1,minWidth:0,position:"relative"}}>
          <input value={input} onChange={e=>setInput(e.target.value.slice(0,SEC.MAX_LEN))} onKeyDown={e=>e.key==="Enter"&&sendMsg()}
            placeholder={listening ? "🎤 듣고 있어요... 말해보세요!" : "한국어로 자유롭게! 😊"}
            aria-label="메시지 입력"
            style={{width:"100%",padding:"13px 16px",borderRadius:50,
              border:`2px solid ${listening ? "#FF6B6B" : C.pink}`,
              outline:"none",fontSize:15,background: listening ? "#FFF5F5" : "white",
              boxSizing:"border-box",WebkitAppearance:"none",transition:"all .2s"}}/>
          {input.length>400&&<span style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",fontSize:10,color:input.length>=SEC.MAX_LEN?"#e74c3c":"#aaa"}}>{input.length}/{SEC.MAX_LEN}</span>}
        </div>
        <button onPointerDown={unlock} onClick={sendMsg} disabled={loading||!input.trim()} aria-label="전송" style={{flexShrink:0,width:50,height:50,background:`linear-gradient(135deg,${C.pink},${C.orange})`,border:"none",borderRadius:"50%",cursor:"pointer",opacity:loading||!input.trim()?0.4:1,display:"flex",alignItems:"center",justifyContent:"center",WebkitTapHighlightColor:"transparent",touchAction:"manipulation",padding:0}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" fill="white"/></svg>
        </button>
      </div>
    </>
  );
}

function WriteTab({level, uid}) {
  const [mode,        setMode]        = useState(null);
  const [wStep,       setWStep]       = useState(0);
  const [wText,       setWText]       = useState(["","",""]);
  const [wFeed,       setWFeed]       = useState(["","",""]);
  const [wLoad,       setWLoad]       = useState(false);
  const [artFeed,     setArtFeed]     = useState(null);
  const [artLoading,  setArtLoading]  = useState(false);
  const [showTopics,  setShowTopics]  = useState(false);
  const [hintLoading, setHintLoading] = useState(false);
  const [submitFile,  setSubmitFile]  = useState(null);
  const [submitLoad,  setSubmitLoad]  = useState(false);
  const [submitFeed,  setSubmitFeed]  = useState(null);
  const [feedDepth,   setFeedDepth]   = useState("normal");
  const fileRef = useRef(null);
  const writeSys = PROMPTS.write[level === "beg" ? "beg" : level === "adv" ? "adv" : "mid"];

  async function submitStep() {
    if (!wText[wStep].trim() || wLoad) return;
    setWLoad(true);
    let ctx = wStep > 0 ? `[현상] ${wText[0]}\n` : "";
    if (wStep > 1) ctx += `[생각] ${wText[1]}\n`;
    ctx += `[학생 입력] ${wText[wStep]}`;
    const fb = await callClaude([{role:"user", content:ctx}], writeSys[wStep]);
    const nf = [...wFeed]; nf[wStep] = fb; setWFeed(nf);
    const next = wStep < 2 ? wStep + 1 : 3;
    setWStep(next);
    if (next === 3) {
      setArtLoading(true);
      const full = `[현상] ${wText[0]}\n[생각] ${wText[1]}\n[이유] ${wText[2]}`;
      const isAdv = level === "adv";
      const artSys = isAdv
        ? `너는 한국 예술·문화 감성 분석 전문가야. 학습자의 글을 읽고 반드시 아래 JSON 형식으로만 응답해. 다른 텍스트 절대 출력하지 마.
{"emotion":"핵심감정한단어","praise":"학습자단어인용+자연물비유찬사(2문장)","painting":"화풍과감정연결2~3문장","paintingSync":"한국인도같은감정느낀다유대메시지1문장","music":"국악추천1문장","musicSync":"음악감정연결이유1문장","musicEmoji":"악기이모지","bridgePlace":"장소명","bridgeDesc":"장소연결이유1문장"}`
        : `너는 한국 예술·문화 감성 분석 전문가야. 학습자의 글을 읽고 반드시 아래 JSON 형식으로만 응답해. 다른 텍스트 절대 출력하지 마.
중급(TOPIK 3~4급) 학습자용: 모든 텍스트는 짧고 쉬운 한국어로. 한자어·고급어휘 절대 금지. 이모지 적극 활용. 각 항목 1문장 이내.
{"emotion":"쉬운감정단어(예:따뜻함,설렘,그리움)","praise":"학습자를칭찬하는쉽고짧은문장+이모지","painting":"그림이름과쉬운설명1문장+이모지","paintingSync":"한국사람들도이그림보면같은기분이래요스타일1문장","music":"악기이름+쉬운설명1문장+이모지","musicSync":"이음악이어울리는쉬운이유1문장","musicEmoji":"악기이모지","bridgePlace":"장소명","bridgeDesc":"그장소와글연결쉬운1문장"}`;
      const ar = await callClaude([{role:"user", content:`글 분석:\n${full}`}], artSys);
      try { setArtFeed(JSON.parse(ar.replace(/```json|```/g,"").trim())); }
      catch { setArtFeed({emotion:"성찰",praise:"당신의 문장은 새벽 안개를 걷어내는 햇살 같네요.",painting:"추사 김정희의 묵향처럼 깊은 여운이 남습니다.",music:"거문고의 낮고 깊은 선율이 어울려요.",musicEmoji:"🎵"}); }
      setArtLoading(false);
    }
    if (uid) recordStat(uid,"write");
    setWLoad(false);
  }

  async function getHint() {
    setHintLoading(true);
    const topic = wText[0].trim() || "스마트폰 과의존";
    const isAdv = level === "adv";
    const sys = isAdv ? "TOPIK 5~6급 글쓰기 코치. 문장 하나만 출력." : "TOPIK 3~4급 글쓰기 코치. 쉬운 문장 하나만 출력.";
    const prompt = isAdv
      ? `"${topic}" 현상 단계 첫 문장. '~에 주목할 필요가 있다' 포함. 40자 이내.`
      : `"${topic}" 현상 단계 첫 문장. 쉬운 고유어로 30자 이내.`;
    const reply = await callClaude([{role:"user", content:prompt}], sys);
    const a = [...wText]; a[0] = reply.trim(); setWText(a);
    setHintLoading(false);
  }

  async function handleSubmit() {
    if (!submitFile || submitLoad) return;
    setSubmitLoad(true); setSubmitFeed(null);
    const result = await evaluateFile(submitFile, level, feedDepth);
    setSubmitFeed(result);
    setSubmitLoad(false);
  }

  function resetWrite() {
    setWStep(0); setWText(["","",""]); setWFeed(["","",""]); setArtFeed(null); setMode(null);
  }

  if (!mode) return (
    <div style={{padding:"8px 0"}}>
      <div style={{background:"white",borderRadius:18,padding:"18px 16px",boxShadow:"0 4px 18px rgba(0,0,0,.07)",marginBottom:14,textAlign:"center"}}>
        <div style={{fontSize:28,marginBottom:6}}>✍️</div>
        <div style={{fontSize:17,fontWeight:900,color:"#333",marginBottom:4}}>논술 모드를 선택해 주세요</div>
        <div style={{fontSize:13,color:"#999"}}>어떻게 공부할지 골라봐요!</div>
      </div>
      <button onClick={()=>setMode("guide")} style={{width:"100%",marginBottom:12,background:"#E8FAF8",border:`2px solid ${C.teal}55`,borderRadius:18,padding:"18px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:14,WebkitTapHighlightColor:"transparent",touchAction:"manipulation"}}>
        <div style={{fontSize:36,flexShrink:0}}>🪜</div>
        <div>
          <div style={{fontSize:16,fontWeight:900,color:C.teal,marginBottom:3}}>단계별 글쓰기 가이드</div>
          <div style={{fontSize:13,color:"#777",lineHeight:1.5}}>현상 → 생각 → 이유<br/>AI와 함께 3단계로 글 완성</div>
        </div>
      </button>
      <button onClick={()=>setMode("submit")} style={{width:"100%",marginBottom:12,background:"#FFF0F6",border:`2px solid ${C.pink}55`,borderRadius:18,padding:"18px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:14,WebkitTapHighlightColor:"transparent",touchAction:"manipulation"}}>
        <div style={{fontSize:36,flexShrink:0}}>📤</div>
        <div>
          <div style={{fontSize:16,fontWeight:900,color:C.pink,marginBottom:3}}>완성 글 제출 &amp; 평가</div>
          <div style={{fontSize:13,color:"#777",lineHeight:1.5}}>네이버 논술 자료 읽고 쓴 글<br/>사진·PDF 업로드 → AI 피드백</div>
        </div>
      </button>
      <button onClick={()=>setMode("culture")} style={{background:"linear-gradient(135deg,#FFF3E8,#FFE4C4)",border:"2px solid #FF8C42",borderRadius:16,padding:"20px 24px",cursor:"pointer",display:"flex",alignItems:"center",gap:16,width:"100%",WebkitTapHighlightColor:"transparent",touchAction:"manipulation"}}>
        <div style={{fontSize:40,flexShrink:0}}>🎎</div>
        <div style={{textAlign:"left"}}>
          <div style={{fontSize:13,fontWeight:800,color:"#FF8C42",marginBottom:4}}>문화 비교 자유 논술</div>
          <div style={{fontSize:15,fontWeight:700,color:"#333",marginBottom:2}}>한국 세시풍속 · 문화 비교</div>
          <div style={{fontSize:12,color:"#888"}}>내 나라와 한국의 문화를 비교해서 써요</div>
        </div>
      </button>
    </div>
  );

  if (mode === "culture") return (
    <div style={{minHeight:"100vh",background:"linear-gradient(150deg,#FFF3E8,#FFF8F0)",padding:"20px 16px",maxWidth:700,margin:"0 auto"}}>
      <button onClick={()=>setMode(null)} style={{background:"none",border:"none",color:"#FF8C42",fontWeight:700,fontSize:14,cursor:"pointer",marginBottom:16}}>← 논술 모드 선택으로</button>
      <div style={{textAlign:"center",marginBottom:24}}>
        <div style={{fontSize:36,marginBottom:8}}>🎎</div>
        <div style={{fontSize:20,fontWeight:900,color:"#333",marginBottom:4}}>한국 세시풍속 · 문화 비교 논술</div>
        <div style={{fontSize:13,color:"#888"}}>내 나라와 한국의 문화를 비교해서 한국어로 표현해 보세요</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {["설날과 내 나라 새해의 차이를 비교해서 써보세요","추석과 내 나라의 비슷한 명절을 비교해 보세요","한국 급식 문화를 처음 경험했을 때 느낀 점을 써보세요","한국의 돌잔치 문화와 내 나라의 아기 축하 문화를 비교해 보세요","한국 명절 음식(떡국, 송편 등)과 내 나라 명절 음식을 비교해 보세요"].map((topic, i) => (
          <div key={i} style={{background:"#fff",border:"1.5px solid #FFD4A8",borderRadius:12,padding:"16px 18px",fontSize:14,color:"#555",lineHeight:1.5}}>
            <span style={{color:"#FF8C42",fontWeight:700,marginRight:8}}>{i+1}.</span>{topic}
            <div style={{marginTop:10,padding:"10px 14px",background:"#FFF3E8",borderRadius:8,fontSize:13,color:"#777"}}>이 주제로 글쓰기를 시작해 보세요. 단계별 글쓰기 가이드 탭을 이용하거나 자유롭게 작성 후 제출 평가를 받아보세요.</div>
          </div>
        ))}
      </div>
    </div>
  );

  if (mode === "submit") return (
    <div style={{padding:"8px 0"}}>
      <button onClick={()=>{setMode(null);setSubmitFile(null);setSubmitFeed(null);if(fileRef.current)fileRef.current.value="";}} style={{background:"none",border:"none",color:C.pink,fontWeight:700,fontSize:13,cursor:"pointer",marginBottom:12,padding:0}}>← 뒤로</button>
      <div style={{background:"white",borderRadius:16,padding:"14px 16px",boxShadow:"0 4px 18px rgba(0,0,0,.07)",marginBottom:10}}>
        <div style={{fontSize:13,fontWeight:800,color:"#555",marginBottom:10}}>📊 피드백 깊이 선택</div>
        <div style={{display:"flex",gap:8}}>
          {[
            {key:"simple",  label:"간단히",  emoji:"⚡", desc:"핵심만"},
            {key:"normal",  label:"보통",    emoji:"✅", desc:"균형있게"},
            {key:"detailed",label:"꼼꼼하게",emoji:"🔍", desc:"예시까지"},
          ].map(d => (
            <button key={d.key} onClick={()=>setFeedDepth(d.key)} style={{flex:1,padding:"10px 4px",borderRadius:12,border:`2px solid ${feedDepth===d.key?C.teal:"#e0e0e0"}`,background:feedDepth===d.key?`${C.teal}15`:"#fafafa",cursor:"pointer",textAlign:"center",WebkitTapHighlightColor:"transparent"}}>
              <div style={{fontSize:18,marginBottom:3}}>{d.emoji}</div>
              <div style={{fontSize:12,fontWeight:800,color:feedDepth===d.key?C.teal:"#888"}}>{d.label}</div>
              <div style={{fontSize:10,color:"#aaa",marginTop:1}}>{d.desc}</div>
            </button>
          ))}
        </div>
      </div>
      <div style={{background:"white",borderRadius:16,padding:"14px 16px",boxShadow:"0 4px 18px rgba(0,0,0,.07)",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:C.teal,color:"white",fontWeight:900,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>①</div>
          <div style={{fontSize:14,fontWeight:900,color:C.teal}}>구글 드라이브에서 PDF 열기</div>
        </div>
        <a href="https://drive.google.com/drive/folders/1ZIY4lE9fiUjupAN5U2kiaPVlFGNCOtAS" target="_blank" rel="noreferrer" style={{display:"block",background:`${C.teal}12`,border:`1.5px solid ${C.teal}44`,borderRadius:10,padding:"10px 14px",fontSize:13,color:C.teal,fontWeight:700,textDecoration:"none",textAlign:"center"}}>
          📂 읽기 자료 열기 (네이버 어린이 논술) →
        </a>
      </div>
      <div style={{background:"white",borderRadius:16,padding:"14px 16px",boxShadow:"0 4px 18px rgba(0,0,0,.07)",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:C.orange,color:"white",fontWeight:900,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>②</div>
          <div style={{fontSize:14,fontWeight:900,color:C.orange}}>모국어로 옮겨 적기</div>
        </div>
        <div style={{fontSize:13,color:"#666",lineHeight:1.7,paddingLeft:38}}>
          한국어로 된 PDF 자료를 읽고,<br/>내용을 <strong>자신의 모국어로</strong> 정리해서 적어보세요.<br/>
          <span style={{fontSize:11,color:"#aaa"}}>※ 이 단계는 종이, 메모장 또는 워드 프로그램으로 직접 하면 돼요.</span>
        </div>
      </div>
      <div style={{background:"white",borderRadius:16,padding:"14px 16px",boxShadow:"0 4px 18px rgba(0,0,0,.07)",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:C.purple,color:"white",fontWeight:900,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>③</div>
          <div style={{fontSize:14,fontWeight:900,color:C.purple}}>완성된 한국어 글 업로드</div>
        </div>
        <div style={{fontSize:13,color:"#666",lineHeight:1.7,paddingLeft:38,marginBottom:12}}>
          모국어로 정리한 내용을 바탕으로<br/><strong>한국어 글쓰기를 마쳤으면</strong> 완성된 글을 여기에 올려주세요.<br/>
          <span style={{fontSize:11,color:"#aaa"}}>사진(JPG·PNG) · PDF · 텍스트(TXT) 모두 가능해요.</span>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,application/pdf,text/plain,.txt" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)setSubmitFile(f);}}/>
        <button onClick={()=>fileRef.current?.click()} style={{width:"100%",border:`2px dashed ${C.purple}66`,borderRadius:12,padding:"22px 16px",background:submitFile?"#F5F0FF":"#fafafa",cursor:"pointer",textAlign:"center",WebkitTapHighlightColor:"transparent"}}>
          {submitFile ? (
            <div><div style={{fontSize:24,marginBottom:4}}>✅</div><div style={{fontSize:14,fontWeight:700,color:C.purple}}>{submitFile.name}</div><div style={{fontSize:11,color:"#aaa",marginTop:2}}>{(submitFile.size/1024).toFixed(0)} KB</div></div>
          ) : (
            <div><div style={{fontSize:32,marginBottom:6}}>📁</div><div style={{fontSize:14,fontWeight:700,color:"#777"}}>여기를 탭해서 파일 선택</div><div style={{fontSize:12,color:"#aaa",marginTop:3}}>사진 · PDF · TXT</div></div>
          )}
        </button>
      </div>
      <div style={{background:"white",borderRadius:16,padding:"14px 16px",boxShadow:"0 4px 18px rgba(0,0,0,.07)",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:C.pink,color:"white",fontWeight:900,fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>④</div>
          <div style={{fontSize:14,fontWeight:900,color:C.pink}}>AI 평가 받기</div>
        </div>
        <button onClick={handleSubmit} disabled={!submitFile||submitLoad} style={{width:"100%",background:`linear-gradient(135deg,${C.pink},${C.orange})`,color:"white",border:"none",borderRadius:50,padding:"14px 0",fontSize:15,fontWeight:900,cursor:"pointer",opacity:!submitFile||submitLoad?0.4:1,WebkitTapHighlightColor:"transparent",touchAction:"manipulation"}}>
          {submitLoad?"AI가 읽는 중... 📖":"✅ 여기를 클릭해서 평가 받기"}
        </button>
        {!submitFile&&<div style={{fontSize:11,color:"#aaa",textAlign:"center",marginTop:6}}>③에서 파일을 먼저 올려주세요</div>}
      </div>
      {submitFeed && (
        <div style={{background:"white",borderRadius:18,padding:16,boxShadow:"0 4px 18px rgba(0,0,0,.07)"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
            <div style={{fontSize:24}}>🎓</div>
            <div style={{fontSize:15,fontWeight:900,color:C.purple}}>AI 피드백 ({level==="adv"?"고급 5~6급":"중급 3~4급"} · {feedDepth==="simple"?"간단히":feedDepth==="detailed"?"꼼꼼하게":"보통"})</div>
          </div>
          <div style={{fontSize:14,color:"#444",lineHeight:1.85}}>{renderFeedback(submitFeed, C.teal)}</div>
          <button onClick={()=>{setSubmitFile(null);setSubmitFeed(null);if(fileRef.current)fileRef.current.value="";}} style={{marginTop:14,width:"100%",background:`linear-gradient(135deg,${C.teal},${C.sky})`,color:"white",border:"none",borderRadius:50,padding:"12px 0",fontSize:14,fontWeight:900,cursor:"pointer",WebkitTapHighlightColor:"transparent"}}>다른 글 제출하기 ✨</button>
        </div>
      )}
    </div>
  );

  return (
    <div style={{padding:"8px 0"}}>
      <button onClick={()=>setMode(null)} style={{background:"none",border:"none",color:C.teal,fontWeight:700,fontSize:13,cursor:"pointer",marginBottom:8,padding:0}}>← 뒤로</button>
      <div style={{background:"white",borderRadius:18,padding:"14px 16px",boxShadow:"0 4px 18px rgba(0,0,0,.07)",marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"center",gap:8}}>
          {STEPS.map((s,i) => {
            const done = wStep > i;
            const current = wStep === i;
            const clickable = done;
            return (
              <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",flex:1}}>
                <button onClick={()=>clickable && setWStep(i)} disabled={!clickable} style={{width:40,height:40,borderRadius:"50%",background:done?s.color:current?s.color:"#e8e8e8",border:clickable?`2.5px solid ${s.color}`:"none",display:"flex",alignItems:"center",justifyContent:"center",fontSize:done?15:18,color:"white",transition:"all .2s",fontWeight:800,cursor:clickable?"pointer":"default",boxShadow:clickable?`0 2px 10px ${s.color}55`:"none",padding:0,WebkitTapHighlightColor:"transparent"}}>
                  {done ? "✓" : s.emoji}
                </button>
                <div style={{fontSize:11,color:wStep>=i?s.color:"#ccc",fontWeight:current?800:500,marginTop:4}}>{s.label}</div>
                {clickable && <div style={{fontSize:9,color:s.color,opacity:.7,marginTop:1}}>↩ 돌아가기</div>}
              </div>
            );
          })}
        </div>
      </div>
      {wStep < 3 ? (
        <div style={{background:"white",borderRadius:18,padding:16,boxShadow:"0 4px 18px rgba(0,0,0,.07)"}}>
          <div style={{color:STEPS[wStep].color,fontSize:18,fontWeight:900,marginBottom:8}}>{STEPS[wStep].emoji} {STEPS[wStep].label} 단계</div>
          {wStep===0&&(
            <>
              <div style={{background:`${C.teal}10`,border:`1.5px solid ${C.teal}44`,borderRadius:"4px 16px 16px 16px",padding:"10px 14px",marginBottom:12,position:"relative"}}>
                <div style={{position:"absolute",top:-10,left:12,background:C.teal,color:"white",fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:10}}>🤖 AI 가이드</div>
                <p style={{margin:0,fontSize:13,color:"#444",lineHeight:1.8}}><strong>'현상'</strong>이란 요즘 직접 보거나 느낀 사실이에요.<br/><span style={{color:C.teal,fontWeight:700}}>예: "요즘 지하철에서 스마트폰을 보는 사람이 많다."</span></p>
              </div>
              <div style={{marginBottom:12}}>
                <button onClick={()=>setShowTopics(v=>!v)} style={{background:"none",border:`1.5px solid ${C.orange}`,borderRadius:20,padding:"5px 14px",fontSize:12,color:C.orange,fontWeight:700,cursor:"pointer",marginBottom:8,WebkitTapHighlightColor:"transparent"}}>{showTopics?"▲ 닫기":"📋 추천 논제 보기"}</button>
                {showTopics&&(
                  <div style={{display:"flex",flexDirection:"column",gap:7}}>
                    {TOPICS.map((t,i)=>(
                      <button key={i} onClick={()=>{const a=[...wText];a[0]=t.hint;setWText(a);setShowTopics(false);}} style={{background:`${C.orange}0D`,border:`1.5px solid ${C.orange}55`,borderRadius:12,padding:"9px 12px",cursor:"pointer",textAlign:"left",WebkitTapHighlightColor:"transparent",display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:22,flexShrink:0}}>{t.icon}</span>
                        <div><div style={{fontSize:13,fontWeight:800,color:C.orange,marginBottom:2}}>{t.title}</div><div style={{fontSize:11,color:"#888"}}>{t.hint}</div></div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div style={{marginBottom:8}}>
                <button onClick={getHint} disabled={hintLoading} style={{background:"none",border:`1.5px solid ${C.teal}`,borderRadius:20,padding:"5px 14px",fontSize:12,color:C.teal,fontWeight:700,cursor:"pointer",WebkitTapHighlightColor:"transparent",opacity:hintLoading?0.5:1}}>{hintLoading?"생성 중...":"💡 문장 시작 힌트"}{level==="adv"&&" ✦"}</button>
              </div>
            </>
          )}
          <div style={{display:"flex",gap:6,marginBottom:12}}>
            {STEPS.map((s,i)=>(
              <div key={i} style={{flex:1,borderRadius:10,padding:"6px 4px",background:i===wStep?`${s.color}15`:"#f5f5f5",border:`1.5px dashed ${i===wStep?s.color:"#e0e0e0"}`,textAlign:"center"}}>
                <div style={{fontSize:14}}>{s.emoji}</div>
                <div style={{fontSize:10,fontWeight:800,color:i===wStep?s.color:"#ccc",marginTop:2}}>{s.label}</div>
              </div>
            ))}
          </div>
          {wStep>0&&<div style={{background:"#f8f8f8",borderRadius:10,padding:"8px 12px",marginBottom:10,fontSize:13,lineHeight:1.7}}>{wText[0]&&<div style={{color:C.teal}}><strong>👀 현상:</strong> {wText[0]}</div>}{wStep>1&&wText[1]&&<div style={{color:C.orange,marginTop:3}}><strong>💭 생각:</strong> {wText[1]}</div>}</div>}
          <textarea value={wText[wStep]} onChange={e=>{const a=[...wText];a[wStep]=e.target.value;setWText(a);}} placeholder={STEPS[wStep].hint} rows={3} style={{width:"100%",padding:"11px 12px",borderRadius:12,border:`2px solid ${STEPS[wStep].color}55`,outline:"none",fontSize:14,resize:"none",boxSizing:"border-box",background:"#fafafa",lineHeight:1.65,WebkitAppearance:"none"}}/>
          {wStep>0&&wFeed[wStep-1]&&<div style={{background:`${STEPS[wStep-1].color}12`,borderRadius:10,padding:"10px 14px",marginTop:8,borderLeft:`3px solid ${STEPS[wStep-1].color}`}}><div style={{fontSize:11,color:STEPS[wStep-1].color,fontWeight:700,marginBottom:6}}>✨ AI 피드백</div>{renderFeedback(wFeed[wStep-1], STEPS[wStep-1].color)}</div>}
          <button onClick={submitStep} disabled={wLoad||!wText[wStep].trim()} style={{marginTop:12,width:"100%",background:`linear-gradient(135deg,${STEPS[wStep].color},${C.yellow})`,color:"white",border:"none",borderRadius:50,padding:"13px 0",fontSize:15,fontWeight:900,cursor:"pointer",opacity:wLoad||!wText[wStep].trim()?0.5:1,WebkitTapHighlightColor:"transparent",touchAction:"manipulation"}}>
            {wLoad?"AI가 읽는 중... 📖":wStep<2?`다음 → ${STEPS[wStep+1].label} ${STEPS[wStep+1].emoji}`:"완성하기 🎉"}
          </button>
        </div>
      ) : (
        <div style={{background:"white",borderRadius:18,padding:16,boxShadow:"0 4px 18px rgba(0,0,0,.07)"}}>
          <div style={{textAlign:"center",marginBottom:14}}><div style={{fontSize:40}}>🎉</div><div style={{fontSize:18,fontWeight:900,color:C.pink}}>완성된 글</div></div>
          {STEPS.map((s,i) => (
            <div key={i} style={{marginBottom:14}}>
              <div style={{fontSize:12,color:s.color,fontWeight:800,marginBottom:4}}>{s.emoji} {s.label}</div>
              <div style={{background:`${s.color}14`,borderRadius:10,padding:"8px 12px",fontSize:14,color:"#444",lineHeight:1.7,borderLeft:`3px solid ${s.color}`}}>{wText[i]}</div>
              {wFeed[i]&&<div style={{marginTop:5,padding:"8px 12px",background:"#f5f5f5",borderRadius:8,lineHeight:1.6}}>{renderFeedback(wFeed[i], "#888")}</div>}
            </div>
          ))}
          {artLoading&&<div style={{textAlign:"center",padding:"24px 0",color:C.purple}}><div style={{fontSize:28,marginBottom:8}}>🎨</div><div style={{fontSize:13,fontWeight:700}}>감성 매핑 중...</div></div>}
          {artFeed&&!artLoading&&(
            <div style={{background:`linear-gradient(135deg,#1a1a2e,#2d1b69)`,borderRadius:16,padding:20,marginTop:8,marginBottom:16}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                <div style={{fontSize:28}}>🎨</div>
                <div><div style={{color:"#E8D5FF",fontSize:11,fontWeight:700,letterSpacing:1,marginBottom:2}}>감성 매핑 리포트</div><div style={{color:"white",fontSize:16,fontWeight:900}}>핵심 감정: <span style={{color:"#FFD93D"}}>{artFeed.emotion}</span></div></div>
              </div>
              <div style={{background:"rgba(255,255,255,.08)",borderRadius:12,padding:"12px 14px",marginBottom:10,borderLeft:"3px solid #FFD93D"}}><div style={{color:"#FFD93D",fontSize:10,fontWeight:800,marginBottom:6}}>✨ 비유적 찬사</div><div style={{color:"white",fontSize:14,lineHeight:1.8,fontStyle:"italic"}}>"{artFeed.praise}"</div></div>
              <div style={{background:"rgba(255,255,255,.06)",borderRadius:12,padding:"12px 14px",marginBottom:10}}><div style={{color:"#C3B1E1",fontSize:10,fontWeight:800,marginBottom:6}}>🖼️ 어울리는 한국 회화</div><div style={{color:"rgba(255,255,255,.85)",fontSize:13,lineHeight:1.7}}>{artFeed.painting}</div>{artFeed.paintingSync&&<div style={{background:"rgba(255,215,0,.12)",borderRadius:8,padding:"7px 10px",marginTop:8,borderLeft:"2px solid #FFD93D"}}><div style={{color:"#FFD93D",fontSize:12,lineHeight:1.65}}>🤝 {artFeed.paintingSync}</div></div>}</div>
              <div style={{background:"rgba(255,255,255,.06)",borderRadius:12,padding:"12px 14px",marginBottom:10}}><div style={{color:"#A8E6CF",fontSize:10,fontWeight:800,marginBottom:6}}>{artFeed.musicEmoji} 어울리는 국악</div><div style={{color:"rgba(255,255,255,.85)",fontSize:13,lineHeight:1.7}}>{artFeed.music}</div></div>
              {artFeed.bridgePlace&&<div style={{background:"rgba(255,140,66,.1)",borderRadius:12,padding:"12px 14px",borderLeft:"3px solid #FF8C42"}}><div style={{color:"#FF8C42",fontSize:10,fontWeight:800,marginBottom:6}}>🌏 마중의 약속</div><div style={{color:"rgba(255,255,255,.9)",fontSize:13,lineHeight:1.75}}>나중에 한국에 오신다면 <strong style={{color:"#FFD93D"}}>{artFeed.bridgePlace}</strong>을 마중 나가서 보여드리고 싶네요 🇰🇷</div></div>}
            </div>
          )}
          <button onClick={resetWrite} style={{width:"100%",background:`linear-gradient(135deg,${C.teal},${C.sky})`,color:"white",border:"none",borderRadius:50,padding:"13px 0",fontSize:15,fontWeight:900,cursor:"pointer",WebkitTapHighlightColor:"transparent"}}>새로운 글 쓰기 ✨</button>
        </div>
      )}
    </div>
  );
}

function TutorTab({level, uid}) {
  const [started,    setStarted]    = useState(false);
  const [tutorUI,    setTutorUI]    = useState([]);
  const [tutorMsgs,  setTutorMsgs]  = useState([]);
  const [tutorInput, setTutorInput] = useState("");
  const [tutorLoad,  setTutorLoad]  = useState(false);
  const [recorded,   setRecorded]   = useState(false);
  const [tutorType, setTutorType] = useState(null);
  const tutorEnd = useRef(null);
  const BEG_SYS = "친절하고 쉬운 초급 한국어 코치 마중이. TOPIK 1~2급 학습자 대상. 문장은 짧고 쉽게. 한자어 금지. 칭찬 먼저. 교정은 1가지만. 이모지 적극 활용.";
  const sys = tutorType === 'adv'          ? PROMPTS.tutorAdv :
              tutorType === 'heritage'     ? PROMPTS.tutorHeritage :
              tutorType === 'survival'     ? PROMPTS.tutorSurvival :
              tutorType === 'mid'          ? PROMPTS.tutor :
              tutorType?.startsWith('beg') ? BEG_SYS :
              level === "adv"              ? PROMPTS.tutorAdv : PROMPTS.tutor;

  useEffect(() => { tutorEnd.current?.scrollIntoView({behavior:"smooth"}); }, [tutorUI, tutorLoad]);

  async function startTutor() {
    setStarted(true); setTutorLoad(true);
    const first =
      tutorType === 'adv'      ? "안녕하십니까, 학습자님. 저는 마중입니다. 오늘은 어떤 주제와 씨름해 보시겠습니까?" :
      tutorType === 'heritage' ? "안녕하세요 😊 저는 마중이에요. 가족과 한국어로 나누고 싶은 이야기가 있나요? 어떤 말을 제일 먼저 배우고 싶으세요?" :
      tutorType === 'survival' ? "안녕하세요 😊 저는 마중이에요. 지금 가장 급한 게 뭐예요? 같이 해낼 수 있어요. 충분히 가능해요!" :
      "안녕하세요, 학습자님 😊 저는 마중이에요.\n오늘은 어떤 글을 함께 써볼까요?\n상황을 알려주시면 딱 맞는 조력자가 되어 드릴게요.";
    setTutorUI([{role:"assistant", text:first}]);
    setTutorMsgs([{role:"assistant", content:first}]);
    setTutorLoad(false);
  }

  async function sendTutor() {
    if (!tutorInput.trim() || tutorLoad) return;
    const txt = sanitize(tutorInput.trim());
    if (!txt || txt === "[보안 필터]") { setTutorInput(""); return; }
    setTutorInput("");
    const newUI  = [...tutorUI,   {role:"user", text:txt}];
    const newAPI = [...tutorMsgs, {role:"user", content:txt}];
    setTutorUI(newUI); setTutorLoad(true);
    const reply = await callClaude(newAPI, sys);
    setTutorMsgs([...newAPI, {role:"assistant", content:reply}]);
    setTutorUI([...newUI,   {role:"assistant", text:reply}]);
    if (!recorded && uid) { recordStat(uid,"tutor"); setRecorded(true); }
    setTutorLoad(false);
  }

  // ✅ V140: 초급 전용 하이터치 화면 — 4개 버튼 선택
  if (level === "beg" && !started) {
    const BEG_TUTOR_MODES = [
      {
        key:"grammar", emoji:"💬", label:"문법으로 문장 만들기",
        sub:"오늘 배운 문법 표현을 연습해요",
        color:"#9C6FDE", bg:"#F3EEFF",
        msg:"안녕하세요! 😊 저는 마중이에요.\n오늘 배운 문법으로 문장 만들기 연습을 해볼게요!\n\n어떤 문법을 연습하고 싶어요? 예: -아요/어요, -고 싶어요, -이에요/예요 등\n모르면 '모르겠어요'라고 해도 괜찮아요 🌸",
      },
      {
        key:"vocab", emoji:"🔤", label:"모르는 단어 물어보기",
        sub:"궁금한 단어를 쉽게 설명해 드려요",
        color:"#00BFA5", bg:"#E8FAF8",
        msg:"안녕하세요! 😊 저는 마중이에요.\n모르는 한국어 단어가 있으면 뭐든 물어봐요!\n\n단어를 쓰거나 뜻을 설명하면 쉽게 알려드릴게요 🔤",
      },
      {
        key:"writing", emoji:"✏️", label:"짧은 문장 쓰기 연습",
        sub:"자유롭게 짧은 문장을 써봐요",
        color:"#FF7043", bg:"#FFF3E0",
        msg:"안녕하세요! 😊 저는 마중이에요.\n짧은 문장 쓰기 연습을 시작해요!\n\n오늘 있었던 일이나 느낌을 한국어로 짧게 써봐요.\n틀려도 괜찮아요, 함께 고쳐나가면 돼요 ✏️",
      },
      {
        key:"topik", emoji:"🎯", label:"TOPIK 2급 표현 연습",
        sub:"핵심 표현을 반복 연습해요",
        color:"#E91E8C", bg:"#FFF0F6",
        msg:"안녕하세요! 😊 저는 마중이에요.\nTOPIK 2급 핵심 표현 집중 연습을 시작해요!\n\n오늘의 첫 번째 표현: -(으)ㄹ 수 있어요\n\n예: '저는 한국어를 말할 수 있어요.'\n\n이 표현으로 문장 하나 만들어볼 수 있어요? 🎯",
      },
    ];
    return (
      <div style={{padding:"8px 0"}}>
        <div style={{background:"white",borderRadius:18,padding:"16px",boxShadow:"0 4px 18px rgba(0,0,0,.07)",marginBottom:12,textAlign:"center"}}>
          <div style={{fontSize:28,marginBottom:4}}>🌸</div>
          <div style={{fontSize:15,fontWeight:900,color:"#9C6FDE",marginBottom:2}}>마중이와 1:1 한국어 연습</div>
          <div style={{fontSize:12,color:"#999"}}>오늘 어떤 연습을 할까요?</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {BEG_TUTOR_MODES.map(m=>(
            <button key={m.key} onClick={()=>{
              setStarted(true);
              setTutorType("beg_"+m.key);
              setTutorUI([{role:"assistant",text:m.msg}]);
              setTutorMsgs([{role:"assistant",content:m.msg}]);
            }} style={{background:m.bg,border:`2px solid ${m.color}44`,borderRadius:16,padding:"14px 16px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:12,WebkitTapHighlightColor:"transparent",transition:"all .15s"}}>
              <span style={{fontSize:28,flexShrink:0}}>{m.emoji}</span>
              <div>
                <div style={{fontSize:14,fontWeight:800,color:m.color,marginBottom:2}}>{m.label}</div>
                <div style={{fontSize:12,color:"#888"}}>{m.sub}</div>
              </div>
              <span style={{marginLeft:"auto",color:m.color,fontSize:16,flexShrink:0}}>›</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!tutorType) return (
    <div style={{padding:"8px 0"}}>
      <div style={{background:"white",borderRadius:18,padding:"18px 16px",boxShadow:"0 4px 18px rgba(0,0,0,.07)",marginBottom:14,textAlign:"center"}}>
        <div style={{fontSize:28,marginBottom:6}}>🌟</div>
        <div style={{fontSize:17,fontWeight:900,color:"#333",marginBottom:4}}>어떤 학습자세요?</div>
        <div style={{fontSize:13,color:"#999"}}>딱 맞는 마중 방식으로 시작할게요</div>
      </div>
      {[
        {key:"mid",      emoji:"🌱", label:"TOPIK 3~4급",       sub:"중급 수준 논술 연습",          color:C.teal,   bg:"#E8FAF8"},
        {key:"adv",      emoji:"🔥", label:"TOPIK 5~6급",       sub:"고급 글쓰기 심화 담론",        color:C.pink,   bg:"#FFF0F6"},
        {key:"heritage", emoji:"🏷️", label:"재외동포 2·3세",    sub:"가족·뿌리와 연결되고 싶어요",  color:C.coral,  bg:"#FFF3F0"},
        {key:"survival", emoji:"⚡", label:"비자·취업 긴급 준비", sub:"TOPIK 2급 · 비자연장 절박해요", color:"#F57C00", bg:"#FFF8E1"},
      ].map(t => (
        <button key={t.key} onClick={()=>setTutorType(t.key)} style={{width:"100%",marginBottom:12,background:t.bg,border:`2px solid ${t.color}55`,borderRadius:18,padding:"16px 18px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:14,WebkitTapHighlightColor:"transparent",touchAction:"manipulation"}}>
          <div style={{fontSize:38,flexShrink:0}}>{t.emoji}</div>
          <div>
            <div style={{fontSize:16,fontWeight:900,color:t.color,marginBottom:2}}>{t.label}</div>
            <div style={{fontSize:13,color:"#777"}}>{t.sub}</div>
          </div>
          <div style={{marginLeft:"auto",fontSize:20,color:t.color,opacity:.5}}>›</div>
        </button>
      ))}
    </div>
  );

  if (!started) return (
    <div style={{padding:"24px 8px"}}>
      <div style={{background:"white",borderRadius:24,padding:24,boxShadow:`0 6px 28px ${C.purple}22`,marginBottom:16}}>
        <div style={{textAlign:"center",marginBottom:18}}>
          <div style={{fontSize:48,marginBottom:8}}>🎓</div>
          <div style={{fontSize:20,fontWeight:900,color:C.purple,marginBottom:4}}>하이 터치 튜터</div>
          <div style={{fontSize:13,color:"#999"}}>AI 선생님과 1:1 맞춤 글쓰기 수업</div>
        </div>
        {[
          {emoji:"💡",title:"혼자서도 잘 써요",desc:"정답 대신 힌트로 스스로 발견하게 도와줘요."},
          {emoji:"🤝",title:"상황에 딱 맞는 말투",desc:"격식/비격식 맥락을 먼저 확인하고 안내해요."},
          {emoji:"🎨",title:"글이 예술이 되는 순간",desc:"완성 시 한국 그림·국악으로 감성 피드백!"},
        ].map((item,i)=>(
          <div key={i} style={{display:"flex",gap:14,alignItems:"flex-start",padding:"12px 0",borderBottom:i<2?"1px solid #f0f0f0":"none"}}>
            <div style={{width:44,height:44,borderRadius:14,background:`${C.purple}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{item.emoji}</div>
            <div><div style={{fontWeight:800,fontSize:14,color:"#333",marginBottom:3}}>{item.title}</div><div style={{fontSize:13,color:"#777",lineHeight:1.6}}>{item.desc}</div></div>
          </div>
        ))}
      </div>
      <TodayTopic purple={C.purple}/>
      <button onClick={startTutor} style={{width:"100%",background:`linear-gradient(135deg,${C.purple},${C.pink})`,color:"white",border:"none",borderRadius:50,padding:"15px 0",fontSize:16,fontWeight:900,cursor:"pointer",boxShadow:`0 5px 18px ${C.purple}55`,WebkitTapHighlightColor:"transparent",touchAction:"manipulation"}}>선생님과 글쓰기 시작하기 ✨</button>
    </div>
  );

  return (
    <>
      <div style={{background:"white",borderRadius:18,padding:12,minHeight:380,maxHeight:460,overflowY:"auto",boxShadow:"0 4px 18px rgba(0,0,0,.07)",marginBottom:10}}>
        {tutorUI.map((m,i) => (
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:12,alignItems:"flex-end",gap:6}}>
            {m.role==="assistant"&&<div style={{fontSize:24,flexShrink:0,lineHeight:1}}>🎓</div>}
            <div style={{maxWidth:"82%"}}>
              <div style={{background:m.role==="user"?`linear-gradient(135deg,${C.purple},${C.pink})`:"white",color:m.role==="user"?"white":"#333",padding:"10px 14px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",fontSize:14,lineHeight:1.75,boxShadow:m.role==="user"?"0 2px 8px rgba(0,0,0,.1)":`0 2px 12px ${C.purple}18`,border:m.role==="assistant"?`1px solid ${C.purple}22`:"none",wordBreak:"break-word",whiteSpace:"pre-wrap"}}>{m.text}</div>
            </div>
          </div>
        ))}
        {tutorLoad&&<div style={{display:"flex",alignItems:"flex-end",gap:6}}><div style={{fontSize:24}}>🎓</div><div style={{background:"#f5f0ff",borderRadius:"16px 16px 16px 4px",padding:"9px 14px",color:C.purple,fontSize:13}}>생각 중... ✨</div></div>}
        <div ref={tutorEnd}/>
      </div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <input value={tutorInput} onChange={e=>setTutorInput(e.target.value.slice(0,SEC.MAX_LEN))} onKeyDown={e=>e.key==="Enter"&&sendTutor()} placeholder="글을 쓰거나 질문해 보세요 ✍️" aria-label="튜터 입력" style={{flex:1,minWidth:0,padding:"13px 16px",borderRadius:50,border:`2px solid ${C.purple}`,outline:"none",fontSize:15,background:"white",boxSizing:"border-box",WebkitAppearance:"none"}}/>
        <button onClick={sendTutor} disabled={tutorLoad||!tutorInput.trim()} aria-label="전송" style={{flexShrink:0,width:50,height:50,background:`linear-gradient(135deg,${C.purple},${C.pink})`,border:"none",borderRadius:"50%",cursor:"pointer",opacity:tutorLoad||!tutorInput.trim()?0.4:1,display:"flex",alignItems:"center",justifyContent:"center",WebkitTapHighlightColor:"transparent",touchAction:"manipulation",padding:0}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" fill="white"/></svg>
        </button>
      </div>
    </>
  );
}

// ✅ V130: 게임 탭
function GameTab({level}) {
  const [game, setGame] = useState(null); // null | "flip" | "match" | "quiz"
  const isBeg = level === "beg";

  // ── 카드 뒤집기 게임 (초급용 — BEG_VOCAB 활용) ──
  function FlipGame() {
    const topicKeys = Object.keys(BEG_VOCAB);
    const [topicIdx, setTopicIdx] = useState(0);
    const topicId = topicKeys[topicIdx];
    const topicLabel = {
      intro: "인사·소개", family: "가족", food: "음식·주문",
      place: "장소·위치", shop: "쇼핑", work: "직장·일상"
    }[topicId] || topicId;

    const pool = BEG_VOCAB[topicId] || [];
    const [cards, setCards] = useState(() => makeCards(pool));
    const [flipped, setFlipped] = useState([]); // 뒤집힌 인덱스들
    const [matched, setMatched] = useState([]); // 맞춘 인덱스들
    const [lock, setLock] = useState(false);
    const [score, setScore] = useState(0);
    const [tries, setTries] = useState(0);

    function makeCards(words) {
      const pick = [...words].sort(() => Math.random() - 0.5).slice(0, 6);
      const pairs = [...pick, ...pick].map((w, i) => ({id: i, word: w, pairId: pick.indexOf(w) < 6 ? pick.indexOf(w) : i - 6}));
      return pairs.sort(() => Math.random() - 0.5).map((c, i) => ({...c, idx: i}));
    }

    function handleFlip(idx) {
      if (lock || flipped.includes(idx) || matched.includes(idx)) return;
      const next = [...flipped, idx];
      setFlipped(next);
      if (next.length === 2) {
        setLock(true);
        setTries(t => t + 1);
        const [a, b] = next;
        if (cards[a].word === cards[b].word) {
          setMatched(m => [...m, a, b]);
          setScore(s => s + 1);
          setFlipped([]);
          setLock(false);
        } else {
          setTimeout(() => { setFlipped([]); setLock(false); }, 900);
        }
      }
    }

    function reset() {
      setCards(makeCards(pool));
      setFlipped([]); setMatched([]); setScore(0); setTries(0); setLock(false);
    }

    const done = matched.length === cards.length;

    return (
      <div style={{padding:"8px 0"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {topicKeys.map((k, i) => {
              const lbl = {intro:"인사",family:"가족",food:"음식",place:"장소",shop:"쇼핑",work:"직장"}[k]||k;
              return (
                <button key={k} onClick={()=>{setTopicIdx(i);setFlipped([]);setMatched([]);setScore(0);setTries(0);setLock(false);setCards(makeCards(BEG_VOCAB[k]||[]));}}
                  style={{padding:"4px 10px",borderRadius:20,border:`1.5px solid ${i===topicIdx?"#9C6FDE":"#ddd"}`,background:i===topicIdx?"#F3EEFF":"white",color:i===topicIdx?"#9C6FDE":"#888",fontSize:12,fontWeight:i===topicIdx?800:500,cursor:"pointer"}}>
                  {lbl}
                </button>
              );
            })}
          </div>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:13,color:"#666"}}>🎯 맞춘 쌍: <strong style={{color:"#9C6FDE"}}>{score}/6</strong> &nbsp;|&nbsp; 시도: {tries}</div>
          <button onClick={reset} style={{padding:"5px 12px",borderRadius:20,border:"1.5px solid #9C6FDE",background:"white",color:"#9C6FDE",fontSize:12,fontWeight:700,cursor:"pointer"}}>🔄 다시</button>
        </div>
        {done && (
          <div style={{background:"#F3EEFF",borderRadius:14,padding:"12px",textAlign:"center",marginBottom:12,fontWeight:800,color:"#9C6FDE",fontSize:15}}>
            🎉 완성! {tries}번 만에 다 맞췄어요! 정말 잘했어요!
          </div>
        )}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
          {cards.map((c, i) => {
            const isFlipped = flipped.includes(i) || matched.includes(i);
            const isMatched = matched.includes(i);
            return (
              <div key={i} onClick={()=>handleFlip(i)}
                style={{aspectRatio:"1",borderRadius:12,cursor:isMatched?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                  background: isMatched ? "#D4EDDA" : isFlipped ? "#F3EEFF" : "#9C6FDE",
                  border: isMatched ? "2px solid #28a745" : isFlipped ? "2px solid #9C6FDE" : "2px solid #7B4FBE",
                  boxShadow: isFlipped&&!isMatched ? "0 2px 10px #9C6FDE44" : "none",
                  transition:"all .2s",fontSize:13,fontWeight:800,
                  color: isMatched ? "#28a745" : isFlipped ? "#9C6FDE" : "transparent",
                  padding:"4px",textAlign:"center",wordBreak:"break-all",lineHeight:1.3,
                  userSelect:"none",WebkitTapHighlightColor:"transparent"}}>
                {isFlipped ? c.word : "🃏"}
              </div>
            );
          })}
        </div>
        <div style={{marginTop:12,fontSize:12,color:"#aaa",textAlign:"center"}}>같은 단어 카드 2장을 찾아요!</div>
      </div>
    );
  }

  // ── 문장 완성 게임 ──
  function SentenceGame() {
    const QBANK = [
      {q:"안녕_____요.", blank:"하세", opts:["하세","있어","없어","됩니"]},
      {q:"저는 학생_____.", blank:"이에요", opts:["이에요","했어요","갔어요","왔어요"]},
      {q:"이름이 _____요?", blank:"뭐예", opts:["뭐예","언제","어디","얼마"]},
      {q:"밥 _____어요.", blank:"먹었", opts:["먹었","마셨","갔었","왔었"]},
      {q:"한국어가 _____어요.", blank:"재미있", opts:["재미있","맛있었","없었","됐"]},
      {q:"감사합니_____.", blank:"다", opts:["다","까","요","죠"]},
      {q:"안녕히 _____세요.", blank:"가", opts:["가","오","있","계"]},
      {q:"저는 한국어를 _____고 싶어요.", blank:"배우", opts:["배우","먹으","가","자"]},
      {q:"물 한 잔 _____세요.", blank:"주", opts:["주","받","갖","드"]},
      {q:"지금 어디 _____어요?", blank:"있", opts:["있","없","됐","갔"]},
    ];
    const [pool] = useState(() => [...QBANK].sort(()=>Math.random()-0.5).slice(0,5));
    const [cur, setCur] = useState(0);
    const [selected, setSelected] = useState(null);
    const [results, setResults] = useState([]);
    const done = cur >= pool.length;

    function handleSelect(opt) {
      if (selected) return;
      setSelected(opt);
      setTimeout(() => {
        setResults(r => [...r, opt === pool[cur].blank]);
        setCur(c => c + 1);
        setSelected(null);
      }, 800);
    }

    function reset() { setCur(0); setSelected(null); setResults([]); }

    if (done) {
      const correct = results.filter(Boolean).length;
      return (
        <div style={{textAlign:"center",padding:"24px 0"}}>
          <div style={{fontSize:48,marginBottom:8}}>{correct===5?"🏆":correct>=3?"🎉":"💪"}</div>
          <div style={{fontSize:20,fontWeight:900,color:"#9C6FDE",marginBottom:4}}>
            {correct}개 맞췄어요!
          </div>
          <div style={{fontSize:14,color:"#666",marginBottom:20}}>
            {correct===5?"완벽해요! 최고예요! 😊":correct>=3?"잘했어요! 다시 한 번 도전해봐요 💪":"괜찮아요! 연습하면 돼요 😊"}
          </div>
          <button onClick={reset} style={{padding:"12px 28px",borderRadius:50,background:"#9C6FDE",color:"white",border:"none",fontSize:15,fontWeight:800,cursor:"pointer"}}>🔄 다시 도전</button>
        </div>
      );
    }

    const q = pool[cur];
    const sentence = q.q.replace("_____", `[   ]`);

    return (
      <div style={{padding:"8px 0"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontSize:13,color:"#888"}}>문제 {cur+1} / {pool.length}</div>
          <div style={{display:"flex",gap:4}}>
            {results.map((r,i)=><span key={i} style={{fontSize:16}}>{r?"✅":"❌"}</span>)}
          </div>
        </div>
        <div style={{background:"#F3EEFF",borderRadius:16,padding:"20px",marginBottom:20,textAlign:"center"}}>
          <div style={{fontSize:18,fontWeight:800,color:"#333",lineHeight:1.8}}>
            {q.q.split("_____").map((part, i) => (
              <span key={i}>
                {part}
                {i === 0 && (
                  <span style={{
                    display:"inline-block",minWidth:60,borderBottom:"3px solid #9C6FDE",
                    color: selected ? (selected===q.blank?"#28a745":"#e74c3c") : "#9C6FDE",
                    fontWeight:900,padding:"0 4px",transition:"color .2s"
                  }}>
                    {selected || "___"}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {q.opts.map(opt => (
            <button key={opt} onClick={()=>handleSelect(opt)} disabled={!!selected}
              style={{padding:"14px",borderRadius:14,border:"2px solid",
                borderColor: !selected ? "#9C6FDE44" : opt===q.blank ? "#28a745" : opt===selected ? "#e74c3c" : "#ddd",
                background: !selected ? "white" : opt===q.blank ? "#D4EDDA" : opt===selected ? "#FDECEA" : "white",
                color: !selected ? "#333" : opt===q.blank ? "#28a745" : opt===selected ? "#e74c3c" : "#aaa",
                fontSize:15,fontWeight:800,cursor:selected?"default":"pointer",transition:"all .2s",
                WebkitTapHighlightColor:"transparent"}}>
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── 짝 찾기 게임 (V132 신규) ──
  function MatchGame() {
    const topicKeys = Object.keys(BEG_VOCAB);
    const [topicIdx, setTopicIdx] = useState(0);
    const topicId = topicKeys[topicIdx];

    // 뜻 매핑 (간단한 영어/한자 힌트)
    const MEANINGS = {
      "안녕하세요":"hello","감사합니다":"thank you","이름":"name","저":"I/me","나이":"age",
      "직업":"job","학생":"student","선생님":"teacher","회사원":"office worker","의사":"doctor",
      "아버지":"father","어머니":"mother","형":"older brother","언니":"older sister","동생":"younger sibling",
      "아이":"child","남편":"husband","아내":"wife","친구":"friend","가족":"family",
      "밥":"rice/meal","물":"water","커피":"coffee","빵":"bread","고기":"meat",
      "채소":"vegetable","과일":"fruit","음식":"food","맵다":"spicy","달다":"sweet",
      "학교":"school","집":"home","병원":"hospital","마트":"market","공원":"park",
      "역":"station","길":"road","왼쪽":"left","오른쪽":"right","앞":"front",
      "옷":"clothes","신발":"shoes","가방":"bag","얼마":"how much","할인":"discount",
      "일하다":"to work","회의":"meeting","점심시간":"lunch break","퇴근":"leave work","월급":"salary"
    };

    function makeMatchCards(pool) {
      const pick = [...pool].sort(()=>Math.random()-0.5).slice(0,6);
      const koCards = pick.map((w,i)=>({id:`ko-${i}`,word:w,pair:i,type:"ko"}));
      const enCards = pick.map((w,i)=>({id:`en-${i}`,word:MEANINGS[w]||w,pair:i,type:"en"}));
      return [...koCards,...enCards].sort(()=>Math.random()-0.5);
    }

    const pool = BEG_VOCAB[topicId] || [];
    const [cards, setCards] = useState(()=>makeMatchCards(pool));
    const [selected, setSelected] = useState(null); // card id
    const [matched, setMatched] = useState([]); // pair indices
    const [wrong, setWrong] = useState([]); // card ids (잠깐 빨갛게)
    const [score, setScore] = useState(0);
    const [tries, setTries] = useState(0);

    function handleSelect(card) {
      if (matched.includes(card.pair) || wrong.includes(card.id)) return;
      if (!selected) { setSelected(card); return; }
      if (selected.id === card.id) { setSelected(null); return; }
      setTries(t=>t+1);
      if (selected.pair === card.pair && selected.type !== card.type) {
        setMatched(m=>[...m,card.pair]);
        setScore(s=>s+1);
        setSelected(null);
      } else {
        setWrong([selected.id, card.id]);
        setTimeout(()=>{ setWrong([]); setSelected(null); }, 700);
      }
    }

    function reset() {
      setCards(makeMatchCards(pool));
      setSelected(null); setMatched([]); setWrong([]); setScore(0); setTries(0);
    }

    const done = matched.length === 6;
    const topicLbls = {intro:"인사",family:"가족",food:"음식",place:"장소",shop:"쇼핑",work:"직장"};

    return (
      <div style={{padding:"8px 0"}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
          {topicKeys.map((k,i)=>(
            <button key={k} onClick={()=>{setTopicIdx(i);setSelected(null);setMatched([]);setWrong([]);setScore(0);setTries(0);setCards(makeMatchCards(BEG_VOCAB[k]||[]));}}
              style={{padding:"4px 10px",borderRadius:20,border:`1.5px solid ${i===topicIdx?"#FF6B9D":"#ddd"}`,background:i===topicIdx?"#FFF0F5":"white",color:i===topicIdx?"#FF6B9D":"#888",fontSize:12,fontWeight:i===topicIdx?800:500,cursor:"pointer"}}>
              {topicLbls[k]||k}
            </button>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:13,color:"#666"}}>🔗 맞춘 쌍: <strong style={{color:"#FF6B9D"}}>{score}/6</strong> &nbsp;|&nbsp; 시도: {tries}</div>
          <button onClick={reset} style={{padding:"5px 12px",borderRadius:20,border:"1.5px solid #FF6B9D",background:"white",color:"#FF6B9D",fontSize:12,fontWeight:700,cursor:"pointer"}}>🔄 다시</button>
        </div>
        {done && (
          <div style={{background:"#FFF0F5",borderRadius:14,padding:"12px",textAlign:"center",marginBottom:12,fontWeight:800,color:"#FF6B9D",fontSize:15}}>
            🎉 완성! {tries}번 만에 다 맞췄어요!
          </div>
        )}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {cards.map(card=>{
            const isMatched = matched.includes(card.pair);
            const isSelected = selected?.id === card.id;
            const isWrong = wrong.includes(card.id);
            let bg="white", border="#ddd", color="#333";
            if (isMatched) { bg="#D4EDDA"; border="#28a745"; color="#2E7D32"; }
            else if (isWrong) { bg="#FDECEA"; border="#e74c3c"; color="#e74c3c"; }
            else if (isSelected) { bg="#FFF0F5"; border="#FF6B9D"; color="#FF6B9D"; }
            return (
              <button key={card.id} onClick={()=>handleSelect(card)} disabled={isMatched}
                style={{padding:"14px 10px",borderRadius:14,border:`2px solid ${border}`,background:bg,color,fontSize:14,fontWeight:800,cursor:isMatched?"default":"pointer",transition:"all .15s",minHeight:52,WebkitTapHighlightColor:"transparent",wordBreak:"break-all",lineHeight:1.4}}>
                {card.word}
              </button>
            );
          })}
        </div>
        <div style={{marginTop:10,fontSize:12,color:"#aaa",textAlign:"center"}}>한국어 ↔ 뜻 카드를 짝지어요!</div>
      </div>
    );
  }

  // ── 4지선다 퀴즈 게임 (V132 신규) ──
  function QuizGame() {
    const topicKeys = Object.keys(BEG_VOCAB);
    const [topicIdx, setTopicIdx] = useState(0);
    const topicId = topicKeys[topicIdx];

    const MEANINGS = {
      "안녕하세요":"hello","감사합니다":"thank you","이름":"name","저":"I/me","나이":"age",
      "직업":"job","학생":"student","선생님":"teacher","회사원":"office worker","의사":"doctor",
      "아버지":"father","어머니":"mother","형":"older brother","언니":"older sister","동생":"younger sibling",
      "아이":"child","남편":"husband","아내":"wife","친구":"friend","가족":"family",
      "밥":"rice/meal","물":"water","커피":"coffee","빵":"bread","고기":"meat",
      "채소":"vegetable","과일":"fruit","음식":"food","맵다":"spicy","달다":"sweet",
      "학교":"school","집":"home","병원":"hospital","마트":"market","공원":"park",
      "역":"station","길":"road","왼쪽":"left","오른쪽":"right","앞":"front",
      "옷":"clothes","신발":"shoes","가방":"bag","얼마":"how much","할인":"discount",
      "일하다":"to work","회의":"meeting","점심시간":"lunch break","퇴근":"leave work","월급":"salary"
    };

    function makeQuizPool(pool) {
      const known = pool.filter(w=>MEANINGS[w]);
      const pick = [...known].sort(()=>Math.random()-0.5).slice(0,8);
      return pick.map(answer=>{
        const wrongs = Object.keys(MEANINGS).filter(w=>w!==answer).sort(()=>Math.random()-0.5).slice(0,3);
        const opts = [...wrongs, answer].sort(()=>Math.random()-0.5);
        return { answer, meaning: MEANINGS[answer], opts };
      });
    }

    const pool = BEG_VOCAB[topicId] || [];
    const [questions, setQuestions] = useState(()=>makeQuizPool(pool));
    const [cur, setCur] = useState(0);
    const [selected, setSelected] = useState(null);
    const [results, setResults] = useState([]);
    const done = cur >= questions.length || questions.length === 0;

    function handleSelect(opt) {
      if (selected) return;
      setSelected(opt);
      setTimeout(()=>{
        setResults(r=>[...r, opt===questions[cur].answer]);
        setCur(c=>c+1);
        setSelected(null);
      }, 800);
    }

    function reset() {
      setQuestions(makeQuizPool(BEG_VOCAB[topicId]||[]));
      setCur(0); setSelected(null); setResults([]);
    }

    const topicLbls = {intro:"인사",family:"가족",food:"음식",place:"장소",shop:"쇼핑",work:"직장"};

    if (done && questions.length > 0) {
      const correct = results.filter(Boolean).length;
      return (
        <div style={{textAlign:"center",padding:"24px 0"}}>
          <div style={{fontSize:48,marginBottom:8}}>{correct===questions.length?"🏆":correct>=questions.length*0.7?"🎉":"💪"}</div>
          <div style={{fontSize:20,fontWeight:900,color:"#FFB347",marginBottom:4}}>{correct}/{questions.length}개 맞췄어요!</div>
          <div style={{fontSize:14,color:"#666",marginBottom:20}}>
            {correct===questions.length?"완벽해요! 최고예요! 😊":correct>=questions.length*0.7?"잘했어요! 한 번 더 도전해봐요 💪":"괜찮아요! 연습하면 돼요 😊"}
          </div>
          <button onClick={reset} style={{padding:"12px 28px",borderRadius:50,background:"#FFB347",color:"white",border:"none",fontSize:15,fontWeight:800,cursor:"pointer"}}>🔄 다시 도전</button>
        </div>
      );
    }

    if (questions.length === 0) return (
      <div style={{textAlign:"center",padding:24,color:"#aaa",fontSize:14}}>이 주제는 준비 중이에요! 다른 주제를 골라봐요 😊</div>
    );

    const q = questions[cur];

    return (
      <div style={{padding:"8px 0"}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
          {topicKeys.map((k,i)=>(
            <button key={k} onClick={()=>{setTopicIdx(i);setQuestions(makeQuizPool(BEG_VOCAB[k]||[]));setCur(0);setSelected(null);setResults([]);}}
              style={{padding:"4px 10px",borderRadius:20,border:`1.5px solid ${i===topicIdx?"#FFB347":"#ddd"}`,background:i===topicIdx?"#FFF8EC":"white",color:i===topicIdx?"#FFB347":"#888",fontSize:12,fontWeight:i===topicIdx?800:500,cursor:"pointer"}}>
              {topicLbls[k]||k}
            </button>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontSize:13,color:"#888"}}>문제 {cur+1} / {questions.length}</div>
          <div style={{display:"flex",gap:4}}>{results.map((r,i)=><span key={i} style={{fontSize:15}}>{r?"✅":"❌"}</span>)}</div>
        </div>
        <div style={{background:"#FFF8EC",borderRadius:16,padding:"24px 20px",marginBottom:20,textAlign:"center",border:"2px solid #FFB34733"}}>
          <div style={{fontSize:13,color:"#aaa",marginBottom:6}}>뜻을 보고 한국어를 골라요!</div>
          <div style={{fontSize:26,fontWeight:900,color:"#333"}}>{q.meaning}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {q.opts.map(opt=>{
            const isCorrect = opt===q.answer;
            const isSelected = opt===selected;
            let bg="white", border="#FFB34744", color="#333";
            if (selected) {
              if (isCorrect) { bg="#D4EDDA"; border="#28a745"; color="#2E7D32"; }
              else if (isSelected) { bg="#FDECEA"; border="#e74c3c"; color="#e74c3c"; }
              else { border="#eee"; color="#bbb"; }
            }
            return (
              <button key={opt} onClick={()=>handleSelect(opt)} disabled={!!selected}
                style={{padding:"16px 10px",borderRadius:14,border:`2px solid ${border}`,background:bg,color,fontSize:15,fontWeight:800,cursor:selected?"default":"pointer",transition:"all .2s",WebkitTapHighlightColor:"transparent"}}>
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ── 게임 선택 화면 ──
  if (!game) return (
    <div style={{padding:"16px 0"}}>
      <div style={{textAlign:"center",marginBottom:20}}>
        <div style={{fontSize:32,marginBottom:6}}>🎮</div>
        <div style={{fontSize:18,fontWeight:900,color:"#333",marginBottom:4}}>게임으로 연습해요!</div>
        <div style={{fontSize:13,color:"#888"}}>배운 한국어를 게임으로 즐겁게 익혀봐요</div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        <button onClick={()=>setGame("flip")}
          style={{background:"#F3EEFF",border:"2px solid #9C6FDE",borderRadius:18,padding:"20px",textAlign:"left",cursor:"pointer",WebkitTapHighlightColor:"transparent"}}>
          <div style={{fontSize:28,marginBottom:6}}>🃏</div>
          <div style={{fontSize:16,fontWeight:900,color:"#9C6FDE",marginBottom:4}}>단어 카드 뒤집기</div>
          <div style={{fontSize:13,color:"#666"}}>같은 단어 카드 2장을 짝지어 보세요!</div>
        </button>
        <button onClick={()=>setGame("match")}
          style={{background:"#FFF0F5",border:"2px solid #FF6B9D",borderRadius:18,padding:"20px",textAlign:"left",cursor:"pointer",WebkitTapHighlightColor:"transparent"}}>
          <div style={{fontSize:28,marginBottom:6}}>🔗</div>
          <div style={{fontSize:16,fontWeight:900,color:"#FF6B9D",marginBottom:4}}>짝 찾기</div>
          <div style={{fontSize:13,color:"#666"}}>한국어와 뜻 카드를 짝지어 보세요!</div>
        </button>
        <button onClick={()=>setGame("quiz")}
          style={{background:"#FFF8EC",border:"2px solid #FFB347",borderRadius:18,padding:"20px",textAlign:"left",cursor:"pointer",WebkitTapHighlightColor:"transparent"}}>
          <div style={{fontSize:28,marginBottom:6}}>🎯</div>
          <div style={{fontSize:16,fontWeight:900,color:"#FFB347",marginBottom:4}}>4지선다 퀴즈</div>
          <div style={{fontSize:13,color:"#666"}}>뜻을 보고 알맞은 한국어를 골라요!</div>
        </button>
      </div>
    </div>
  );

  return (
    <div style={{padding:"8px 0"}}>
      <button onClick={()=>setGame(null)}
        style={{background:"none",border:"none",color:"#9C6FDE",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:12,padding:"4px 0",display:"flex",alignItems:"center",gap:4}}>
        ← 게임 선택으로
      </button>
      {game === "flip" && <FlipGame />}
      {game === "match" && <MatchGame />}
      {game === "quiz" && <QuizGame />}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(undefined);
  const [level, setLevel] = useState(null);
  const [tab,   setTab]   = useState("speak");
  const [showStats, setShowStats] = useState(false);
  const [showTopikChoice, setShowTopikChoice] = useState(false); // ✅ V123: 레벨 2단계 선택
  const [begReady, setBegReady] = useState(false); // ✅ V139: 초급 도전 시작 전까지 탭 숨김
  const [showPromo, setShowPromo] = useState(false); // ✅ V143: 홍보 모달

  // ✅ V143: 로그인 후 방문 횟수 확인 (최대 3회)
  useEffect(()=>{
    if(!user) return;
    const key = `hc_promo_${user.uid}`;
    const count = parseInt(localStorage.getItem(key)||"0");
    if(count < 3){ setShowPromo(true); localStorage.setItem(key, String(count+1)); }
  },[user]);
  const {speaking, ttsHint, unlock, speak} = useTTS();

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, u => setUser(u||null));
    return ()=>unsub();
  },[]);

  async function handleLogout() {
    await signOut(auth);
    setLevel(null); setTab("speak"); setShowTopikChoice(false); setBegReady(false);
  }

  if (user===undefined) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg}}>
      <div style={{fontSize:40}}>🇰🇷</div>
    </div>
  );

  if (!user) return <AuthScreen onLogin={setUser}/>;

  // ✅ V143: 홍보 모달 (최초 3회 로그인 시 표시)
  if (showPromo) {
    const count = parseInt(localStorage.getItem(`hc_promo_${user.uid}`)||"1");
    const visitLabel = count===1?"첫 번째":count===2?"두 번째":"세 번째";
    const btnLabel = `${visitLabel} 방문 환영해요! ${count===1?"🚀":count===2?"😊":"🌸"}`;
    const badgeLabel = `${visitLabel} 방문이에요! ${count===1?"👋":count===2?"😊":"🎉"}`;
    return (
      <div onClick={unlock} style={{minHeight:"100vh",background:"rgba(0,0,0,0.55)",display:"flex",alignItems:"center",justifyContent:"center",padding:"16px",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",boxSizing:"border-box"}}>
        <div style={{background:"white",borderRadius:20,width:"100%",maxWidth:360,overflow:"hidden"}}>
          {/* 헤더 */}
          <div style={{background:"#9C6FDE",padding:"18px 20px 14px",textAlign:"center"}}>
            <div style={{display:"inline-block",background:"rgba(255,255,255,0.25)",borderRadius:20,padding:"3px 14px",fontSize:11,color:"white",fontWeight:700,marginBottom:8}}>{badgeLabel}</div>
            <div style={{fontSize:17,fontWeight:900,color:"white",marginBottom:3}}>🌸 한글 친구가 특별한 이유</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.85)",marginBottom:10}}>딱 세 번만 보여드려요 — 꼭 기억해 주세요!</div>
            <div style={{display:"flex",gap:6,justifyContent:"center"}}>
              {[1,2,3].map(i=>(
                <div key={i} style={{width:8,height:8,borderRadius:"50%",background:i<=count?"white":"rgba(255,255,255,0.3)"}}/>
              ))}
            </div>
          </div>
          {/* 본문 */}
          <div style={{padding:16}}>
            <div style={{background:"#F3EEFF",borderRadius:"0 12px 12px 0",borderLeft:"3px solid #9C6FDE",padding:"11px 13px",marginBottom:13}}>
              <div style={{fontSize:11,fontWeight:800,color:"#6B46C1",marginBottom:2}}>💡 핵심 차이</div>
              <div style={{fontSize:11,color:"#553C9A",lineHeight:1.55}}>다른 기관 <strong>200~400시간</strong>이 필요한 초급 완성을<br/>한글 친구는 <strong>80시간</strong>에 약속합니다!</div>
            </div>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:10.5,tableLayout:"fixed",marginBottom:13}}>
              <thead>
                <tr style={{background:"#F8F4FF"}}>
                  {["기관","초급 시간","말하기 훈련","장소 무관","비용"].map((h,i)=>(
                    <th key={i} style={{padding:"7px 5px",color:"#6B46C1",fontWeight:700,borderBottom:"2px solid #9C6FDE",textAlign:i===0?"left":"center",fontSize:10}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ["A 기관","400h","△","✕","고비용","#f59e0b","#ef4444","#ef4444","#666"],
                  ["B 기관","215h","△","✕","제한적","#f59e0b","#ef4444","#ef4444","#666"],
                  ["C 기관","45~104h","✕","✕","제한적","#ef4444","#ef4444","#ef4444","#666"],
                ].map(([name,h,sp,loc,cost,sc,lc,cc,tc])=>(
                  <tr key={name} style={{borderBottom:"0.5px solid #f0f0f0"}}>
                    <td style={{padding:"6px 5px",fontWeight:600,color:"#444",fontSize:10}}>{name}</td>
                    <td style={{padding:"6px 5px",textAlign:"center",color:"#555"}}>{h}</td>
                    <td style={{padding:"6px 5px",textAlign:"center",color:sc,fontWeight:700}}>{sp}</td>
                    <td style={{padding:"6px 5px",textAlign:"center",color:lc,fontWeight:700}}>{loc}</td>
                    <td style={{padding:"6px 5px",textAlign:"center",color:tc,fontSize:9}}>{cost}</td>
                  </tr>
                ))}
                <tr style={{background:"#F8F4FF"}}>
                  <td style={{padding:"6px 5px",fontWeight:800,color:"#9C6FDE",fontSize:10}}>🌸 한글 친구</td>
                  <td style={{padding:"6px 5px",textAlign:"center",color:"#9C6FDE",fontWeight:800}}>80h</td>
                  <td style={{padding:"6px 5px",textAlign:"center",color:"#00C896",fontWeight:900,fontSize:14}}>✓</td>
                  <td style={{padding:"6px 5px",textAlign:"center",color:"#00C896",fontWeight:900,fontSize:14}}>✓</td>
                  <td style={{padding:"6px 5px",textAlign:"center",color:"#888",fontSize:9}}>??</td>
                </tr>
              </tbody>
            </table>
            <div style={{background:"#E8FAF8",borderRadius:10,padding:"10px 12px",fontSize:11,color:"#085041",lineHeight:1.55}}>
              🎯 <strong>"설계는 우리가 했습니다.<br/>이대로만 따라오면 됩니다."</strong>
            </div>
          </div>
          {/* 버튼 */}
          <button onClick={()=>setShowPromo(false)} style={{width:"100%",padding:14,background:"linear-gradient(135deg,#9C6FDE,#C084FC)",border:"none",color:"white",fontSize:15,fontWeight:900,cursor:"pointer",letterSpacing:0.5,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            <span>지금 바로 시작하기</span><span style={{fontSize:18}}>→</span>
          </button>
        </div>
      </div>
    );
  }

  // ✅ V126: beg는 탭 화면으로 진입 (BegScreen은 프리토킹 탭 안에서 제공)

  if (!level) return (
    <div onClick={unlock} style={{minHeight:"100vh",background:`linear-gradient(150deg,${C.bg},#FFF0F9 50%,#F0FFFE)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <div style={{fontSize:52,marginBottom:12}}>🇰🇷</div>
      <div style={{fontSize:26,fontWeight:900,color:"#333",marginBottom:4}}>한글 친구</div>
      <div style={{fontSize:14,color:"#888",marginBottom:8,textAlign:"center"}}>안녕하세요, {user.displayName||user.email}님! 👋</div>
      <div style={{fontSize:13,color:"#bbb",marginBottom:16}}>한국어 수준을 선택해 주세요</div>
      {/* ✅ V122 수정8: 성장 경로 배너 — 레벨 선택 전 전체 여정 미리 보여주기 */}
      <GrowthPathBanner level={level} />
      <div style={{background:"white",border:`1.5px solid ${C.teal}44`,borderRadius:14,padding:"12px 16px",marginBottom:16,maxWidth:340,width:"100%",boxShadow:"0 2px 12px rgba(78,205,196,.1)"}}>
        <div style={{fontSize:11,fontWeight:800,color:C.teal,marginBottom:6}}>🔗 나에게 맞는 학습 경로</div>
        <div style={{fontSize:12,color:"#555",lineHeight:1.7}}>
          한국어를 처음 시작하거나 기초부터 다시 다지고 싶다면 <strong style={{color:"#9C6FDE"}}>처음 시작해요</strong>를 선택해요.<br/>
          TOPIK 시험을 준비 중이라면 <strong style={{color:C.pink}}>TOPIK 준비해요</strong>를 선택해요.<br/>
          <span style={{fontSize:11,color:"#aaa"}}>인풋(읽기·듣기) 완성 → 아웃풋(말하기·쓰기) 훈련</span>
        </div>
      </div>

      {!showTopikChoice ? (
        /* ── 1단계: 초급 직진 / TOPIK 진입 ── */
        <>
          {/* 🌸 처음 시작해요 → 초급(beg) 바로 진입 */}
          <button onClick={()=>setLevel("beg")} style={{width:"100%",maxWidth:340,marginBottom:14,background:"#F3EEFF",border:"2.5px solid #9C6FDE",borderRadius:20,padding:"20px 22px",cursor:"pointer",textAlign:"left",boxShadow:"0 4px 18px #9C6FDE28",display:"flex",alignItems:"center",gap:16,WebkitTapHighlightColor:"transparent",touchAction:"manipulation"}}>
            <div style={{fontSize:40,flexShrink:0}}>🌸</div>
            <div>
              <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:4}}>
                <span style={{fontSize:20,fontWeight:900,color:"#9C6FDE"}}>처음 시작해요</span>
                <span style={{fontSize:12,color:"#999",fontWeight:600}}>초급</span>
              </div>
              <div style={{fontSize:13,color:"#666",lineHeight:1.6}}>한글 자모부터 생활 한국어까지{"\n"}세종학당 방식으로 자연스럽게</div>
            </div>
          </button>

          {/* 📚 TOPIK 준비해요 → 2단계(중·고급 선택)로 이동 */}
          <button onClick={e=>{e.stopPropagation();setShowTopikChoice(true);}} style={{width:"100%",maxWidth:340,marginBottom:16,background:"#FFF0F6",border:"2.5px solid #FF6B9D",borderRadius:20,padding:"20px 22px",cursor:"pointer",textAlign:"left",boxShadow:"0 4px 18px #FF6B9D28",display:"flex",alignItems:"center",gap:16,WebkitTapHighlightColor:"transparent",touchAction:"manipulation"}}>
            <div style={{fontSize:40,flexShrink:0}}>📚</div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:4}}>
                <span style={{fontSize:20,fontWeight:900,color:C.pink}}>TOPIK 준비해요</span>
                <span style={{fontSize:12,color:"#999",fontWeight:600}}>중·고급</span>
              </div>
              <div style={{fontSize:13,color:"#666",lineHeight:1.6}}>TOPIK 3~6급 실전 말하기·쓰기{"\n"}심화 출력 훈련</div>
            </div>
            <div style={{fontSize:20,color:C.pink,opacity:.5,flexShrink:0}}>›</div>
          </button>
        </>
      ) : (
        /* ── 2단계: 중급 / 고급 선택 ── */
        <>
          <button onClick={e=>{e.stopPropagation();setShowTopikChoice(false);}} style={{alignSelf:"flex-start",marginLeft:"calc(50% - 170px)",background:"none",border:"none",color:"#aaa",fontSize:13,cursor:"pointer",marginBottom:8,padding:"4px 0"}}>← 뒤로</button>
          <div style={{fontSize:13,color:"#888",marginBottom:12,textAlign:"center"}}>TOPIK 급수를 선택해 주세요</div>
          {[
            {key:"mid",emoji:"🌱",label:"중급",sub:"TOPIK 3~4급",desc:"고유어 위주 짧은 문장\n일상 대화 중심",color:C.teal,bg:"#E8FAF8"},
            {key:"adv",emoji:"🔥",label:"고급",sub:"TOPIK 5~6급",desc:"한자어·사자성어·관용구\n사회·문화 심화 대화",color:C.pink,bg:"#FFF0F6"},
          ].map(o=>(
            <button key={o.key} onClick={()=>setLevel(o.key)} style={{width:"100%",maxWidth:340,marginBottom:14,background:o.bg,border:`2.5px solid ${o.color}`,borderRadius:20,padding:"20px 22px",cursor:"pointer",textAlign:"left",boxShadow:`0 4px 18px ${o.color}28`,display:"flex",alignItems:"center",gap:16,WebkitTapHighlightColor:"transparent",touchAction:"manipulation"}}>
              <div style={{fontSize:40,flexShrink:0}}>{o.emoji}</div>
              <div>
                <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:4}}>
                  <span style={{fontSize:20,fontWeight:900,color:o.color}}>{o.label}</span>
                  <span style={{fontSize:12,color:"#999",fontWeight:600}}>{o.sub}</span>
                </div>
                <div style={{fontSize:13,color:"#666",lineHeight:1.6,whiteSpace:"pre-line"}}>{o.desc}</div>
              </div>
            </button>
          ))}
        </>
      )}

      <div style={{fontSize:11,color:"#ccc",textAlign:"center",marginBottom:4,lineHeight:1.6,padding:"0 20px"}}>한국어 수준 분류는 국립국어원 한국어기초사전 초·중·고급 기준을 참고합니다.</div>
      <button onClick={handleLogout} style={{marginTop:8,background:"none",border:"none",color:"#ccc",fontSize:13,cursor:"pointer"}}>로그아웃</button>
    </div>
  );

  // ✅ V139: 초급 — 도전 시작 전까지 BegScreen 전체화면 (탭 숨김)
  if (level === "beg" && !begReady) return (
    <BegScreen user={user} onBack={()=>setLevel(null)} onReady={()=>setBegReady(true)}/>
  );

  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(150deg,${C.bg},#FFF0F9 50%,#F0FFFE)`,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      {showStats&&<StatsModal user={user} onClose={()=>setShowStats(false)}/>}
      <div style={{background:level==="beg"?`linear-gradient(100deg,#9C6FDE,#C3B1E1)`:`linear-gradient(100deg,${C.pink},${C.orange},${C.yellow})`,padding:"16px 16px 12px",position:"relative"}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:24,fontWeight:900,color:"white",textShadow:"0 2px 8px rgba(0,0,0,.2)"}}>한글 친구 🇰🇷</div>
          <div style={{color:"rgba(255,255,255,.85)",fontSize:12,marginTop:2}}>{user.displayName||user.email}</div>
        </div>
        <div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",display:"flex",gap:6}}>
          <button onClick={()=>setShowStats(true)} style={{background:"rgba(255,255,255,.22)",border:"1.5px solid rgba(255,255,255,.6)",borderRadius:20,padding:"4px 10px",cursor:"pointer",color:"white",fontSize:11,fontWeight:700}}>📊</button>
          <button onClick={()=>setLevel(null)} style={{background:"rgba(255,255,255,.22)",border:"1.5px solid rgba(255,255,255,.6)",borderRadius:20,padding:"4px 10px",cursor:"pointer",color:"white",fontSize:11,fontWeight:700}}>{level==="adv"?"🔥":level==="beg"?"🌸":"🌱"} ✕</button>
        </div>
      </div>
      <div style={{maxWidth:600,margin:"0 auto",width:"100%"}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",background:"white",boxShadow:"0 2px 10px rgba(0,0,0,.07)",gap:1,backgroundColor:"#ebebeb",borderRadius:"0 0 16px 16px",overflow:"hidden"}}>
          {[["speak","🗣️","프리토킹",C.pink,"#FCE8F3"],["write","✍️","논술",C.teal,"#E8FAF8"],["tutor","🎓","하이터치",C.purple,"#F3EEFF"],["game","🎮","게임",C.yellow,"#FFFBE8"]].map(([k,emoji,label,col,bg])=>(
            <button key={k} onClick={()=>setTab(k)} style={{padding:"16px 0 12px",border:"none",background:tab===k?bg:"white",cursor:"pointer",transition:"all .2s",WebkitTapHighlightColor:"transparent",display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
              <div style={{width:52,height:52,borderRadius:"50%",background:tab===k?bg:"#f5f5f5",border:tab===k?`2.5px solid ${col}`:"2px solid #e8e8e8",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,transition:"all .2s",boxShadow:tab===k?`0 4px 12px ${col}33`:"none"}}>
                {emoji}
              </div>
              <span style={{fontSize:12,fontWeight:tab===k?800:500,color:tab===k?col:"#aaa",transition:"all .2s"}}>{label}</span>
            </button>
          ))}
        </div>
      </div>
      <div style={{maxWidth:600,margin:"0 auto",padding:"12px 12px 80px",boxSizing:"border-box"}}>
        {ttsHint&&<div style={{background:"#FFF8E1",border:"1px solid #FFD93D",borderRadius:12,padding:"10px 14px",marginBottom:8,fontSize:13,color:"#5D4037",textAlign:"center"}}>🔇 소리를 들으려면 화면을 터치한 뒤 스피커를 눌러주세요</div>}
        {tab==="speak"&&<SpeakTab level={level} uid={user.uid} unlock={unlock} speaking={speaking} speak={speak} begReady={begReady}/>}
        {tab==="write"&&(level==="beg"
          ? <div style={{padding:"48px 24px",textAlign:"center"}}>
              <div style={{fontSize:52,marginBottom:14}}>🔒</div>
              <div style={{fontSize:16,fontWeight:900,color:"#9C6FDE",marginBottom:8}}>논술은 중급부터 열려요!</div>
              <div style={{fontSize:13,color:"#999",lineHeight:1.8}}>프리토킹으로 말하기 기초를 먼저 다져요.<br/>TOPIK 3급 이상이 되면 논술이 열려요 😊</div>
            </div>
          : <WriteTab level={level} uid={user.uid}/>
        )}
        {tab==="tutor"&&<TutorTab level={level} uid={user.uid}/>}
        {tab==="game"&&<GameTab level={level}/>}
      </div>
    </div>
  );
}
