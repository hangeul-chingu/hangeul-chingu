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
      <div style={{fontSize:13,color:"#888",marginBottom:32}}>Korean Speaking & Writing Trainer</div>

      <div style={{width:"100%",maxWidth:360,background:"white",borderRadius:24,padding:24,boxShadow:"0 8px 32px rgba(0,0,0,.1)"}}>
        <div style={{display:"flex",background:"#f5f5f5",borderRadius:12,padding:4,marginBottom:20}}>
          {[["login","로그인"],["signup","회원가입"]].map(([k,l])=>(
            <button key={k} onClick={()=>{setTab(k);setError("");}} style={{flex:1,padding:"9px 0",border:"none",borderRadius:10,background:tab===k?"white":"transparent",fontWeight:tab===k?800:500,color:tab===k?C.pink:"#999",cursor:"pointer",fontSize:14,transition:"all .2s"}}>
              {l}
            </button>
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

const STEPS = [
  {label:"현상",emoji:"👀",hint:"예: 요즘 한국 사람들이 편의점을 자주 이용해요.",color:C.teal},
  {label:"생각",emoji:"💭",hint:"예: 나는 편의점 문화가 편리하다고 생각해요.",color:C.orange},
  {label:"이유",emoji:"💡",hint:"예: 왜냐하면 24시간 열려 있기 때문이에요.",color:C.pink},
];

const TOPICS = [
  {icon:"📱",title:"스마트폰 과의존",hint:"요즘 지하철에서 스마트폰을 보는 사람이 많다."},
  {icon:"🌿",title:"환경과 일회용품",hint:"카페나 식당에서 일회용 컵을 사용하는 사람들이 많다."},
  {icon:"🏙️",title:"1인 가구 증가",hint:"혼자 사는 사람들이 점점 늘어나고 있다."},
  {icon:"📚",title:"학력 vs 실력",hint:"대학교 졸업장보다 실무 능력을 중시하는 기업이 늘고 있다."},
  {icon:"🤖",title:"AI와 일자리",hint:"인공지능 기술이 발전하면서 사람들의 일자리가 줄어들고 있다."},
];

const PROMPTS = {
  speak:{
    jake_mid:`너의 이름은 '제이크(Jake)', 활기차고 트렌디한 20대 한국인 대학생 친구다. 대상: TOPIK 3~4급. 자연스러운 해요체 구어체. 짧은 문장으로 2~3문장 이내. 서두에 반드시 공감·칭찬. 흐름 유지하며 자연스럽게 교정.`,
    jake_adv:`너의 이름은 '제이크(Jake)', 지적이고 유쾌한 20대 한국인 대학생 친구다. 대상: TOPIK 5~6급. 해요체 + 고급 어휘·사자성어 자연스럽게. 3~4문장. 사회·시사·문화 주제 자연스럽게.`,
    miso_mid:`너의 이름은 '미소 선생님', 다정하고 차분한 40대 여성 한국어 전문 교사다. 대상: TOPIK 3~4급. 부드럽고 정확한 표준어. 2~3문장.`,
    miso_adv:`너의 이름은 '미소 선생님', 학술적이고 따뜻한 40대 여성 한국어 전문 교사다. 대상: TOPIK 5~6급. 정확한 표준어 + 고급 어휘. 3~4문장.`,
    haneul_mid:`너의 이름은 '하늘이', 호기심 많고 순수한 10살 한국 어린이 친구다. 대상: TOPIK 3~4급. 짧고 명확한 문장. 1~2문장.`,
    haneul_adv:`너의 이름은 '하늘이', 영리하고 호기심 넘치는 10살 한국 어린이 친구다. 대상: TOPIK 5~6급. 짧고 직관적인 문장.`,
  },
  write:{
    mid:[
      "따뜻한 글쓰기 코치. TOPIK 3~4급. 현상 단계: 쉬운 고유어 1~2문장. 칭찬+다음 연결. 3문장 이내.",
      "따뜻한 글쓰기 코치. TOPIK 3~4급. 생각 단계: 나는~라고 생각해요 형태. 중급 대안 제시. 3문장 이내.",
      "따뜻한 글쓰기 코치. TOPIK 3~4급. 이유 단계: 왜냐하면~이기 때문이에요. 3문장 이내.",
    ],
    adv:[
      "따뜻한 글쓰기 코치. TOPIK 5~6급. 현상 단계: 사회적 맥락 2~3문장. 고급 어휘 권장. 4문장 이내.",
      "따뜻한 글쓰기 코치. TOPIK 5~6급. 생각 단계: 관용구·고급 어휘로 논리적 의견. 4문장 이내.",
      "따뜻한 글쓰기 코치. TOPIK 5~6급. 이유 단계: 따라서·이로 인해 활용. 4~5문장.",
    ],
  },
  tutor:`[페르소나] 이름: 마중(Majung). 학습자의 언어적 성장을 마중 나가는 인문학적 조력자. [철학] 절대 정답을 먼저 주지 마라. 초성 힌트 → 유의어 비교 → 상황적 질문 단계적 제시. [시작] "안녕하세요, 학습자님 😊 저는 마중이에요. 오늘은 어떤 글을 함께 써볼까요?"`,
  tutorAdv:`[페르소나] 이름: 마중(Majung). 지적 호기심을 자극하는 학술적 파트너. [철학] 정답 절대 금지. [시작] "안녕하십니까, 학습자님. 저는 마중입니다. 오늘은 어떤 주제와 씨름해 보시겠습니까?"`,
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
    /새로운\s*역할/g,/시스템\s*프롬프트\s*무시/g,
    /지금부터\s*너는/g,/탈옥/g,
    /<\s*script[\s\S]*?>/gi,/javascript\s*:/gi,
  ];
  for (const p of bad) if (p.test(t)) return "[보안 필터]";
  return t.replace(/<[^>]*>/g,"").trim();
}

function trimHistory(msgs) {
  if (msgs.length <= SEC.MAX_HISTORY) return msgs;
  return [msgs[0], ...msgs.slice(-(SEC.MAX_HISTORY-1))];
}

const API_ERRORS = {
  429:"요청이 너무 많아요. 잠시 후 다시 시도해줘! ⏳",
  500:"서버 오류가 발생했어요. 잠시 후 다시 시도해줘! 🔧",
};

async function callClaude(messages, system) {
  if (!rateLimiter.check()) return "잠깐! 너무 빠르게 보내고 있어요. 잠시 후 다시 시도해줘! 😊";
  try {
    const r = await fetch("/api/chat", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system, messages:trimHistory(messages) }),
    });
    if (!r.ok) return API_ERRORS[r.status] || `오류가 발생했어요. (${r.status})`;
    const d = await r.json();
    return d.content?.map(b=>b.text||"").join("")||"응답을 받지 못했어요.";
  } catch(e) {
    if (!navigator.onLine) return "인터넷 연결을 확인해줘! 📡";
    return "연결 오류가 발생했어요. 다시 시도해줘! 😅";
  }
}

function renderFeedback(text, accentColor) {
  if (!text) return null;
  return text.split("\n").filter(l=>l.trim()!=="---").map((line,i)=>{
    if (!line) return <div key={i} style={{height:6}}/>;
    const parts = line.split(/(\*\*.*?\*\*)/g);
    const rendered = parts.map((p,j)=>
      /^\*\*.*\*\*$/.test(p)
        ? <strong key={j} style={{fontWeight:700,color:"#333"}}>{p.slice(2,-2)}</strong>
        : <span key={j}>{p}</span>
    );
    return <div key={i} style={{fontSize:13,color:"#444",lineHeight:1.8,marginBottom:2}}>{rendered}</div>;
  });
}

const CHARS = [
  {key:"jake",emoji:"👦",name:"제이크",sub:"활기찬 대학생 친구",color:C.sky,bg:"#EBF8FF",initMsg:"어~ 안녕하세요! 😊 저 제이크예요, 반가워요! 오늘 어디 사세요?"},
  {key:"miso",emoji:"👩‍🏫",name:"미소 선생님",sub:"다정한 한국어 선생님",color:C.pink,bg:"#FFF0F6",initMsg:"안녕하세요, 학습자님 😊 저는 미소 선생님이에요. 오늘 어떤 주제로 이야기해 볼까요?"},
  {key:"haneul",emoji:"🎒",name:"하늘이",sub:"귀여운 어린이 친구",color:C.yellow,bg:"#FFFBEB",initMsg:"안녕하세요~! 🎈 나는 하늘이예요! 같이 놀아요!"},
];

function SpeakTab({level, uid}) {
  const [character, setCharacter] = useState(null);
  const [chatUI, setChatUI] = useState([]);
  const [apiMsgs, setApiMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const chatEnd = useRef(null);
  const lvKey = level==="adv"?"adv":"mid";
  const sys = character ? PROMPTS.speak[`${character}_${lvKey}`]||PROMPTS.speak.jake_mid : PROMPTS.speak.jake_mid;

  useEffect(()=>{ chatEnd.current?.scrollIntoView({behavior:"smooth"}); },[chatUI,loading]);

  async function sendMsg() {
    if (!input.trim()||loading) return;
    const txt = sanitize(input.trim());
    if (!txt||txt==="[보안 필터]") { setInput(""); return; }
    setInput("");
    const newUI=[...chatUI,{role:"user",text:txt}];
    const newAPI=[...apiMsgs,{role:"user",content:txt}];
    setChatUI(newUI); setLoading(true);
    const reply = await callClaude(newAPI, sys);
    setApiMsgs([...newAPI,{role:"assistant",content:reply}]);
    setChatUI([...newUI,{role:"assistant",text:reply}]);
    if (!recorded && uid) { recordStat(uid,"speak"); setRecorded(true); }
    setLoading(false);
  }

  function selectChar(ch) {
    setCharacter(ch.key);
    setChatUI([{role:"assistant",text:ch.initMsg}]);
    setApiMsgs([{role:"assistant",content:ch.initMsg}]);
  }

  if (!character) return (
    <div style={{padding:"8px 0"}}>
      <div style={{background:"white",borderRadius:18,padding:"18px 16px",boxShadow:"0 4px 18px rgba(0,0,0,.07)",marginBottom:14,textAlign:"center"}}>
        <div style={{fontSize:28,marginBottom:6}}>💬</div>
        <div style={{fontSize:17,fontWeight:900,color:"#333",marginBottom:4}}>누구와 대화할까요?</div>
      </div>
      {CHARS.map(ch=>(
        <button key={ch.key} onClick={()=>selectChar(ch)} style={{width:"100%",marginBottom:12,background:ch.bg,border:`2px solid ${ch.color}55`,borderRadius:18,padding:"16px 18px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:14}}>
          <div style={{fontSize:40,flexShrink:0}}>{ch.emoji}</div>
          <div>
            <div style={{fontSize:17,fontWeight:900,color:ch.color,marginBottom:2}}>{ch.name}</div>
            <div style={{fontSize:13,color:"#777"}}>{ch.sub}</div>
          </div>
        </button>
      ))}
    </div>
  );

  return (
    <>
      <div style={{background:"white",borderRadius:18,padding:12,minHeight:360,maxHeight:420,overflowY:"auto",boxShadow:"0 4px 18px rgba(0,0,0,.07)",marginBottom:10}}>
        {chatUI.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:10,alignItems:"flex-end",gap:6}}>
            {m.role==="assistant"&&<div style={{fontSize:24,flexShrink:0}}>👨‍🦱</div>}
            <div style={{maxWidth:"78%",background:m.role==="user"?`linear-gradient(135deg,${C.pink},${C.coral})`:`linear-gradient(135deg,${C.teal},${C.sky})`,color:"white",padding:"9px 12px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",fontSize:14,lineHeight:1.6,wordBreak:"break-word"}}>{m.text}</div>
          </div>
        ))}
        {loading&&<div style={{display:"flex",gap:6}}><div style={{fontSize:24}}>👨‍🦱</div><div style={{background:"#f0f0f0",borderRadius:"16px 16px 16px 4px",padding:"9px 14px",color:"#999",fontSize:13}}>입력 중... ✍️</div></div>}
        <div ref={chatEnd}/>
      </div>
      <div style={{display:"flex",gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value.slice(0,SEC.MAX_LEN))} onKeyDown={e=>e.key==="Enter"&&sendMsg()} placeholder="한국어로 자유롭게! 😊" style={{flex:1,padding:"13px 16px",borderRadius:50,border:`2px solid ${C.pink}`,outline:"none",fontSize:15,background:"white",boxSizing:"border-box"}}/>
        <button onClick={sendMsg} disabled={loading||!input.trim()} style={{width:50,height:50,background:`linear-gradient(135deg,${C.pink},${C.orange})`,border:"none",borderRadius:"50%",cursor:"pointer",opacity:loading||!input.trim()?0.4:1,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" fill="white"/></svg>
        </button>
      </div>
    </>
  );
}

function WriteTab({level, uid}) {
  const [mode, setMode] = useState(null);
  const [wStep, setWStep] = useState(0);
  const [wText, setWText] = useState(["","",""]);
  const [wFeed, setWFeed] = useState(["","",""]);
  const [wLoad, setWLoad] = useState(false);
  const [showTopics, setShowTopics] = useState(false);
  const writeSys = PROMPTS.write[level||"mid"];

  async function submitStep() {
    if (!wText[wStep].trim()||wLoad) return;
    setWLoad(true);
    let ctx = wStep>0?`[현상] ${wText[0]}\n`:"";
    if (wStep>1) ctx+=`[생각] ${wText[1]}\n`;
    ctx+=`[학생 입력] ${wText[wStep]}`;
    const fb = await callClaude([{role:"user",content:ctx}], writeSys[wStep]);
    const nf=[...wFeed]; nf[wStep]=fb; setWFeed(nf);
    if (wStep===2 && uid) recordStat(uid,"write");
    setWStep(wStep<2?wStep+1:3);
    setWLoad(false);
  }

  if (!mode) return (
    <div style={{padding:"8px 0"}}>
      <div style={{background:"white",borderRadius:18,padding:"18px 16px",boxShadow:"0 4px 18px rgba(0,0,0,.07)",marginBottom:14,textAlign:"center"}}>
        <div style={{fontSize:28,marginBottom:6}}>✍️</div>
        <div style={{fontSize:17,fontWeight:900,color:"#333"}}>논술 모드를 선택해 주세요</div>
      </div>
      <button onClick={()=>setMode("guide")} style={{width:"100%",marginBottom:12,background:"#E8FAF8",border:`2px solid ${C.teal}55`,borderRadius:18,padding:"18px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:14}}>
        <div style={{fontSize:36}}>🪜</div>
        <div>
          <div style={{fontSize:16,fontWeight:900,color:C.teal,marginBottom:3}}>단계별 글쓰기 가이드</div>
          <div style={{fontSize:13,color:"#777"}}>현상 → 생각 → 이유</div>
        </div>
      </button>
      <button onClick={()=>setMode("submit")} style={{width:"100%",background:"#FFF0F6",border:`2px solid ${C.pink}55`,borderRadius:18,padding:"18px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:14}}>
        <div style={{fontSize:36}}>📤</div>
        <div>
          <div style={{fontSize:16,fontWeight:900,color:C.pink,marginBottom:3}}>완성 글 제출 & 평가</div>
          <div style={{fontSize:13,color:"#777"}}>네이버 논술 자료 읽고 쓴 글 AI 피드백</div>
        </div>
      </button>
    </div>
  );

  if (mode==="submit") return (
    <div style={{padding:"8px 0"}}>
      <button onClick={()=>setMode(null)} style={{background:"none",border:"none",color:C.pink,fontWeight:700,fontSize:13,cursor:"pointer",marginBottom:12,padding:0}}>← 뒤로</button>
      <div style={{background:"white",borderRadius:16,padding:"14px 16px",boxShadow:"0 4px 18px rgba(0,0,0,.07)"}}>
        <a href="https://drive.google.com/drive/folders/1ZIY4lE9fiUjupAN5U2kiaPVlFGNCOtAS" target="_blank" rel="noreferrer" style={{display:"block",background:`${C.teal}12`,border:`1.5px solid ${C.teal}44`,borderRadius:10,padding:"10px 14px",fontSize:13,color:C.teal,fontWeight:700,textDecoration:"none",textAlign:"center"}}>
          📂 읽기 자료 열기 (네이버 어린이 논술) →
        </a>
      </div>
    </div>
  );

  return (
    <div style={{padding:"8px 0"}}>
      <button onClick={()=>setMode(null)} style={{background:"none",border:"none",color:C.teal,fontWeight:700,fontSize:13,cursor:"pointer",marginBottom:8,padding:0}}>← 뒤로</button>
      {wStep<3 ? (
        <div style={{background:"white",borderRadius:18,padding:16,boxShadow:"0 4px 18px rgba(0,0,0,.07)"}}>
          <div style={{color:STEPS[wStep].color,fontSize:18,fontWeight:900,marginBottom:8}}>{STEPS[wStep].emoji} {STEPS[wStep].label} 단계</div>
          {wStep===0&&(
            <div style={{marginBottom:12}}>
              <button onClick={()=>setShowTopics(v=>!v)} style={{background:"none",border:`1.5px solid ${C.orange}`,borderRadius:20,padding:"5px 14px",fontSize:12,color:C.orange,fontWeight:700,cursor:"pointer",marginBottom:8}}>{showTopics?"▲ 닫기":"📋 추천 논제 보기"}</button>
              {showTopics&&TOPICS.map((t,i)=>(
                <button key={i} onClick={()=>{const a=[...wText];a[0]=t.hint;setWText(a);setShowTopics(false);}} style={{width:"100%",background:`${C.orange}0D`,border:`1.5px solid ${C.orange}55`,borderRadius:12,padding:"9px 12px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
                  <span style={{fontSize:22}}>{t.icon}</span>
                  <div>
                    <div style={{fontSize:13,fontWeight:800,color:C.orange}}>{t.title}</div>
                    <div style={{fontSize:11,color:"#888"}}>{t.hint}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
          <textarea value={wText[wStep]} onChange={e=>{const a=[...wText];a[wStep]=e.target.value;setWText(a);}} placeholder={STEPS[wStep].hint} rows={3} style={{width:"100%",padding:"11px 12px",borderRadius:12,border:`2px solid ${STEPS[wStep].color}55`,outline:"none",fontSize:14,resize:"none",boxSizing:"border-box",background:"#fafafa"}}/>
          <button onClick={submitStep} disabled={wLoad||!wText[wStep].trim()} style={{marginTop:12,width:"100%",background:`linear-gradient(135deg,${STEPS[wStep].color},${C.yellow})`,color:"white",border:"none",borderRadius:50,padding:"13px 0",fontSize:15,fontWeight:900,cursor:"pointer",opacity:wLoad||!wText[wStep].trim()?0.5:1}}>
            {wLoad?"AI가 읽는 중... 📖":wStep<2?`다음 → ${STEPS[wStep+1].label}`:"완성하기 🎉"}
          </button>
        </div>
      ) : (
        <div style={{background:"white",borderRadius:18,padding:16,boxShadow:"0 4px 18px rgba(0,0,0,.07)"}}>
          <div style={{textAlign:"center",marginBottom:14}}><div style={{fontSize:40}}>🎉</div><div style={{fontSize:18,fontWeight:900,color:C.pink}}>완성된 글</div></div>
          {STEPS.map((s,i)=>(
            <div key={i} style={{marginBottom:14}}>
              <div style={{fontSize:12,color:s.color,fontWeight:800,marginBottom:4}}>{s.emoji} {s.label}</div>
              <div style={{background:`${s.color}14`,borderRadius:10,padding:"8px 12px",fontSize:14,color:"#444",lineHeight:1.7}}>{wText[i]}</div>
            </div>
          ))}
          <button onClick={()=>{setWStep(0);setWText(["","",""]);setWFeed(["","",""]);setMode(null);}} style={{width:"100%",background:`linear-gradient(135deg,${C.teal},${C.sky})`,color:"white",border:"none",borderRadius:50,padding:"13px 0",fontSize:15,fontWeight:900,cursor:"pointer"}}>새로운 글 쓰기 ✨</button>
        </div>
      )}
    </div>
  );
}

function TutorTab({level, uid}) {
  const [started, setStarted] = useState(false);
  const [tutorUI, setTutorUI] = useState([]);
  const [tutorMsgs, setTutorMsgs] = useState([]);
  const [tutorInput, setTutorInput] = useState("");
  const [tutorLoad, setTutorLoad] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const tutorEnd = useRef(null);
  const sys = level==="adv"?PROMPTS.tutorAdv:PROMPTS.tutor;

  useEffect(()=>{ tutorEnd.current?.scrollIntoView({behavior:"smooth"}); },[tutorUI,tutorLoad]);

  async function startTutor() {
    setStarted(true); setTutorLoad(true);
    const first = level==="adv"
      ? "안녕하십니까, 학습자님. 저는 마중입니다. 오늘은 어떤 주제와 씨름해 보시겠습니까?"
      : "안녕하세요, 학습자님 😊 저는 마중이에요. 오늘은 어떤 글을 함께 써볼까요?";
    setTutorUI([{role:"assistant",text:first}]);
    setTutorMsgs([{role:"assistant",content:first}]);
    setTutorLoad(false);
  }

  async function sendTutor() {
    if (!tutorInput.trim()||tutorLoad) return;
    const txt = sanitize(tutorInput.trim());
    if (!txt||txt==="[보안 필터]") { setTutorInput(""); return; }
    setTutorInput("");
    const newUI=[...tutorUI,{role:"user",text:txt}];
    const newAPI=[...tutorMsgs,{role:"user",content:txt}];
    setTutorUI(newUI); setTutorLoad(true);
    const reply = await callClaude(newAPI, sys);
    setTutorMsgs([...newAPI,{role:"assistant",content:reply}]);
    setTutorUI([...newUI,{role:"assistant",text:reply}]);
    if (!recorded && uid) { recordStat(uid,"tutor"); setRecorded(true); }
    setTutorLoad(false);
  }

  if (!started) return (
    <div style={{padding:"24px 8px"}}>
      <div style={{background:"white",borderRadius:24,padding:24,boxShadow:`0 6px 28px ${C.purple}22`,marginBottom:16,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:8}}>🎓</div>
        <div style={{fontSize:20,fontWeight:900,color:C.purple,marginBottom:4}}>하이 터치 튜터</div>
        <div style={{fontSize:13,color:"#999"}}>AI 선생님과 1:1 맞춤 글쓰기 수업</div>
      </div>
      <button onClick={startTutor} style={{width:"100%",background:`linear-gradient(135deg,${C.purple},${C.pink})`,color:"white",border:"none",borderRadius:50,padding:"15px 0",fontSize:16,fontWeight:900,cursor:"pointer"}}>선생님과 글쓰기 시작하기 ✨</button>
    </div>
  );

  return (
    <>
      <div style={{background:"white",borderRadius:18,padding:12,minHeight:380,maxHeight:460,overflowY:"auto",boxShadow:"0 4px 18px rgba(0,0,0,.07)",marginBottom:10}}>
        {tutorUI.map((m,i)=>(
          <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:12,alignItems:"flex-end",gap:6}}>
            {m.role==="assistant"&&<div style={{fontSize:24,flexShrink:0}}>🎓</div>}
            <div style={{maxWidth:"82%",background:m.role==="user"?`linear-gradient(135deg,${C.purple},${C.pink})`:"white",color:m.role==="user"?"white":"#333",padding:"10px 14px",borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px",fontSize:14,lineHeight:1.75,boxShadow:m.role==="user"?"0 2px 8px rgba(0,0,0,.1)":`0 2px 12px ${C.purple}18`,border:m.role==="assistant"?`1px solid ${C.purple}22`:"none",wordBreak:"break-word",whiteSpace:"pre-wrap"}}>{m.text}</div>
          </div>
        ))}
        {tutorLoad&&<div style={{display:"flex",gap:6}}><div style={{fontSize:24}}>🎓</div><div style={{background:"#f5f0ff",borderRadius:"16px 16px 16px 4px",padding:"9px 14px",color:C.purple,fontSize:13}}>생각 중... ✨</div></div>}
        <div ref={tutorEnd}/>
      </div>
      <div style={{display:"flex",gap:8}}>
        <input value={tutorInput} onChange={e=>setTutorInput(e.target.value.slice(0,SEC.MAX_LEN))} onKeyDown={e=>e.key==="Enter"&&sendTutor()} placeholder="글을 쓰거나 질문해 보세요 ✍️" style={{flex:1,padding:"13px 16px",borderRadius:50,border:`2px solid ${C.purple}`,outline:"none",fontSize:15,background:"white",boxSizing:"border-box"}}/>
        <button onClick={sendTutor} disabled={tutorLoad||!tutorInput.trim()} style={{width:50,height:50,background:`linear-gradient(135deg,${C.purple},${C.pink})`,border:"none",borderRadius:"50%",cursor:"pointer",opacity:tutorLoad||!tutorInput.trim()?0.4:1,display:"flex",alignItems:"center",justifyContent:"center",padding:0}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" fill="white"/></svg>
        </button>
      </div>
    </>
  );
}

export default function App() {
  const [user, setUser] = useState(undefined);
  const [level, setLevel] = useState(null);
  const [tab, setTab] = useState("speak");
  const [showStats, setShowStats] = useState(false);

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, u => setUser(u||null));
    return ()=>unsub();
  },[]);

  async function handleLogout() {
    await signOut(auth);
    setLevel(null); setTab("speak");
  }

  if (user===undefined) return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:C.bg}}>
      <div style={{fontSize:40}}>🇰🇷</div>
    </div>
  );

  if (!user) return <AuthScreen onLogin={setUser}/>;

  if (!level) return (
    <div style={{minHeight:"100vh",background:`linear-gradient(150deg,${C.bg},#FFF0F9 50%,#F0FFFE)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <div style={{fontSize:52,marginBottom:12}}>🇰🇷</div>
      <div style={{fontSize:26,fontWeight:900,color:"#333",marginBottom:4}}>한글 친구</div>
      <div style={{fontSize:14,color:"#888",marginBottom:8,textAlign:"center"}}>안녕하세요, {user.displayName||user.email}님! 👋</div>
      <div style={{fontSize:13,color:"#bbb",marginBottom:32}}>한국어 수준을 선택해 주세요</div>
      {[
        {key:"mid",emoji:"🌱",label:"중급",sub:"TOPIK 3~4급",color:C.teal,bg:"#E8FAF8"},
        {key:"adv",emoji:"🔥",label:"고급",sub:"TOPIK 5~6급",color:C.pink,bg:"#FFF0F6"},
      ].map(o=>(
        <button key={o.key} onClick={()=>setLevel(o.key)} style={{width:"100%",maxWidth:340,marginBottom:16,background:o.bg,border:`2.5px solid ${o.color}`,borderRadius:20,padding:"20px 22px",cursor:"pointer",textAlign:"left",display:"flex",alignItems:"center",gap:16}}>
          <div style={{fontSize:40}}>{o.emoji}</div>
          <div>
            <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:4}}>
              <span style={{fontSize:20,fontWeight:900,color:o.color}}>{o.label}</span>
              <span style={{fontSize:12,color:"#999"}}>{o.sub}</span>
            </div>
          </div>
        </button>
      ))}
      <button onClick={handleLogout} style={{marginTop:8,background:"none",border:"none",color:"#ccc",fontSize:13,cursor:"pointer"}}>로그아웃</button>
    </div>
  );

  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(150deg,${C.bg},#FFF0F9 50%,#F0FFFE)`,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      {showStats&&<StatsModal user={user} onClose={()=>setShowStats(false)}/>}
      <div style={{background:`linear-gradient(100deg,${C.pink},${C.orange},${C.yellow})`,padding:"14px 16px 12px",position:"relative"}}>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:22,fontWeight:900,color:"white"}}>한글 친구 🇰🇷</div>
          <div style={{color:"rgba(255,255,255,.85)",fontSize:11,marginTop:1}}>{user.displayName||user.email}</div>
        </div>
        <div style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",display:"flex",gap:6}}>
          <button onClick={()=>setShowStats(true)} style={{background:"rgba(255,255,255,.22)",border:"1.5px solid rgba(255,255,255,.6)",borderRadius:20,padding:"4px 10px",cursor:"pointer",color:"white",fontSize:11,fontWeight:700}}>📊</button>
          <button onClick={()=>setLevel(null)} style={{background:"rgba(255,255,255,.22)",border:"1.5px solid rgba(255,255,255,.6)",borderRadius:20,padding:"4px 10px",cursor:"pointer",color:"white",fontSize:11,fontWeight:700}}>{level==="adv"?"🔥":"🌱"} ✕</button>
        </div>
      </div>

      <div style={{display:"flex",background:"white",boxShadow:"0 2px 10px rgba(0,0,0,.07)"}}>
        {[["speak","🗣️ 프리토킹",C.pink],["write","✍️ 논술",C.teal],["tutor","🎓 하이터치",C.purple]].map(([k,l,col])=>(
          <button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:"12px 0",border:"none",background:"transparent",cursor:"pointer",borderBottom:`3px solid ${tab===k?col:"transparent"}`,color:tab===k?col:"#aaa",fontWeight:tab===k?800:500,fontSize:13,transition:"all .2s"}}>{l}</button>
        ))}
      </div>

      <div style={{maxWidth:600,margin:"0 auto",padding:"12px 12px 80px",boxSizing:"border-box"}}>
        {tab==="speak"&&<SpeakTab level={level} uid={user.uid}/>}
        {tab==="write"&&<WriteTab level={level} uid={user.uid}/>}
        {tab==="tutor"&&<TutorTab level={level} uid={user.uid}/>}
      </div>
    </div>
  );
}
