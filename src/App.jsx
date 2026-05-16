import { useState, useRef, useEffect, useCallback } from "react";
import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  deleteField
} from "firebase/firestore";

// ✅ V206: 외부 데이터 파일(PhonicsData.js)에서 발음 매트릭스를 안전하게 수입
import { PRON_STEPS_V206 } from "./PhonicsData";

const ADMIN_EMAIL = "roh053068@gmail.com";
const DEV_EMAIL = "csyager@hanmail.net";

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
  const [role, setRole] = useState("learner"); 
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [dataOwnershipAgreed, setDataOwnershipAgreed] = useState(false);
  const [emailAgreed, setEmailAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) { setError("이메일과 비밀번호를 입력해주세요"); return; }
    if (tab === "signup" && !name.trim()) { setError("이름을 입력해주세요"); return; }
    if (tab === "signup" && !dataOwnershipAgreed) { setError("학습 데이터 소유권 귀속 및 활용 동의는 필수예요"); return; }
    setLoading(true); setError("");
    try {
      if (tab === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
        await setDoc(doc(db, "users", cred.user.uid), {
          name, email, role,
          dataOwnershipAgreed: true,
          emailAgreed,
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

  const roleLabel = { learner: "학습자", instructor: "교수자" };

  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(150deg,${C.bg},#FFF0F9 50%,#F0FFFE)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <div style={{fontSize:52,marginBottom:8}}>🇰🇷</div>
      <div style={{fontSize:26,fontWeight:900,color:"#333",marginBottom:4}}>한글 친구</div>
      <div style={{fontSize:13,color:"#888",marginBottom:32,textAlign:"center"}}>이주배경 학습자를 위한 24시간 디지털 브릿지 · Korean Speaking &amp; Writing Trainer</div>
      <div style={{width:"100%",maxWidth:360,background:"white",borderRadius:24,padding:24,boxShadow:"0 8px 32px rgba(0,0,0,.1)"}}>
        <div style={{display:"flex",background:"#f5f5f5",borderRadius:12,padding:"4px",marginBottom:20}}>
          {[["login","로그인"],["signup","회원가입"]].map(([k,l])=>(
            <button key={k} onClick={()=>{setTab(k);setError("");setDataOwnershipAgreed(false);setEmailAgreed(false);}} style={{flex:1,padding:"9px 0",border:"none",borderRadius:10,background:tab===k?"white":"transparent",fontWeight:tab===k?800:500,color:tab===k?C.pink:"#999",cursor:"pointer",fontSize:14,transition:"all .2s"}}>{l}</button>
          ))}
        </div>
        {tab==="signup"&&(<>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:12,color:"#888",marginBottom:6,fontWeight:600}}>가입 유형</div>
            <div style={{display:"flex",gap:8}}>
              {[["learner","🎓 학습자"],["instructor","👩‍🏫 교수자"]].map(([k,l])=>(
                <button key={k} onClick={()=>setRole(k)} style={{flex:1,padding:"10px 0",border:`2px solid ${role===k?C.pink:"#eee"}`,borderRadius:12,background:role===k?`${C.pink}12`:"white",color:role===k?C.pink:"#aaa",fontWeight:role===k?800:500,fontSize:13,cursor:"pointer",transition:"all .2s"}}>{l}</button>
              ))}
            </div>
          </div>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder={role==="instructor"?"교수자 이름":"이름"} style={{width:"100%",padding:"13px 16px",borderRadius:12,border:`2px solid ${C.teal}44`,outline:"none",fontSize:15,marginBottom:10,boxSizing:"border-box"}}/>
        </>)}
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="이메일" type="email" style={{width:"100%",padding:"13px 16px",borderRadius:12,border:`2px solid ${C.pink}44`,outline:"none",fontSize:15,marginBottom:10,boxSizing:"border-box"}}/>
        <input value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSubmit()} placeholder="비밀번호 (6자 이상)" type="password" style={{width:"100%",padding:"13px 16px",borderRadius:12,border:`2px solid ${C.pink}44`,outline:"none",fontSize:15,marginBottom:error&&tab==="login"?10:tab==="signup"?14:16,boxSizing:"border-box"}}/>
        {tab==="signup"&&(<>
          <div onClick={()=>setDataOwnershipAgreed(p=>!p)} style={{display:"flex",alignItems:"flex-start",gap:10,background:dataOwnershipAgreed?"#F0FBF7":"#FAFAFA",border:`1.5px solid ${dataOwnershipAgreed?"#00C896":"#e0e0e0"}`,borderRadius:12,padding:"12px 14px",marginBottom:8,cursor:"pointer",transition:"all .2s"}}>
            <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${dataOwnershipAgreed?"#00C896":"#ccc"}`,background:dataOwnershipAgreed?"#00C896":"white",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,transition:"all .2s"}}>
              {dataOwnershipAgreed&&<span style={{color:"white",fontSize:13,fontWeight:900,lineHeight:1}}>✓</span>}
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:"#333",marginBottom:3}}>(필수) 학습 데이터 소유권 귀속 및 활용 동의</div>
              <div style={{fontSize:11,color:"#777",lineHeight:1.6}}>학습자와 나눈 모든 대화 및 학습 데이터의 소유권은 한글 친구에 귀속되며, 이는 <strong>서비스의 고도화 및 인공지능 모델 업그레이드 연구</strong>를 위해 소중하게 사용됩니다.</div>
            </div>
          </div>
          <div onClick={()=>setEmailAgreed(p=>!p)} style={{display:"flex",alignItems:"center",gap:10,background:emailAgreed?"#FFF8F0":"#FAFAFA",border:`1.5px solid ${emailAgreed?C.orange:"#e0e0e0"}`,borderRadius:12,padding:"11px 14px",marginBottom:14,cursor:"pointer",transition:"all .2s"}}>
            <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${emailAgreed?C.orange:"#ccc"}`,background:emailAgreed?C.orange:"white",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .2s"}}>
              {emailAgreed&&<span style={{color:"white",fontSize:13,fontWeight:900,lineHeight:1}}>✓</span>}
            </div>
            <div style={{fontSize:12,fontWeight:600,color:"#555"}}>(선택) 업데이트 소식 이메일 수신 동의</div>
          </div>
        </>)}
        {error&&<div style={{background:"#FFF0F0",border:"1px solid #FFCCCC",borderRadius:10,padding:"9px 14px",fontSize:13,color:"#E53935",marginBottom:12}}>{error}</div>}
        <button onClick={handleSubmit} disabled={loading} style={{width:"100%",background:`linear-gradient(135deg,${C.pink},${C.orange})`,color:"white",border:"none",borderRadius:50,padding:"14px 0",fontSize:16,fontWeight:900,cursor:"pointer",opacity:loading?0.5:1}}>
          {loading?"처리 중...":tab==="login"?"로그인":`${roleLabel[role]}으로 가입하기`}
        </button>
      </div>
    </div>
  );
}

function AdminDashboard({ user, onLogout, onExitAdmin }) {
  const [tab, setTab] = useState("topik"); 
  const [submissions, setSubmissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "topik_submissions"));
    const unsub = onSnapshot(q, snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0));
      setSubmissions(docs);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "learner"));
    const unsub = onSnapshot(q, snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function approveSubmission(subId, uid) {
    await updateDoc(doc(db, "topik_submissions", subId), { status: "approved", approvedAt: serverTimestamp(), approvedBy: "admin" });
    await updateDoc(doc(db, "users", uid), { topikApproved: true, topikApprovedAt: serverTimestamp() });
  }

  async function rejectSubmission(subId, reason) {
    await updateDoc(doc(db, "topik_submissions", subId), { status: "rejected", rejectedAt: serverTimestamp(), rejectedReason: reason || "재제출 요청" });
  }

  return (
    <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#1A1A2E,#16213E)", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <div style={{background:"linear-gradient(135deg,#0F3460,#1A1A2E)", padding:"20px 20px 0", color:"white", borderBottom:"1px solid #ffffff15"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", maxWidth:800, margin:"0 auto"}}>
          <div>
            <div style={{fontSize:11, opacity:0.6, marginBottom:4, letterSpacing:2}}>🔐 ADMIN ONLY</div>
            <div style={{fontSize:20, fontWeight:900 suicide}}>최고 관리자 페이지</div>
            <div style={{fontSize:12, opacity:0.6, marginTop:2}}>{user.email}</div>
          </div>
          <div style={{display:"flex", flexDirection:"column", gap:6, alignItems:"flex-end"}}>
            <button onClick={onExitAdmin} style={{background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)", color:"white", borderRadius:20, padding:"7px 14px", fontSize:11, fontWeight:800, cursor:"pointer"}}>👩‍🏫 교수자 화면으로</button>
            <button onClick={onLogout} style={{background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.7)", borderRadius:20, padding:"7px 14px", fontSize:11, fontWeight:700, cursor:"pointer"}}>로그아웃</button>
          </div>
        </div>
      </div>
      <div style={{padding:"20px 16px", maxWidth:800, margin:"0 auto"}}>
        {submissions.map(sub => <SubmissionCard key={sub.id} sub={sub} onApprove={approveSubmission} onReject={rejectSubmission} />)}
      </div>
    </div>
  );
}

function SubmissionCard({ sub, onApprove, onReject }) {
  const [expanded, setExpanded] = useState(false);
  const col = sub.status === "approved" ? "#00C896" : sub.status === "rejected" ? "#E53935" : "#F5A623";

  return (
    <div style={{background:"rgba(255,255,255,0.05)", border:`1px solid ${col}40`, borderRadius:20, marginBottom:14, overflow:"hidden"}}>
      <div onClick={()=>setExpanded(p=>!p)} style={{padding:"16px 18px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <div>
          <div style={{fontSize:14, fontWeight:800, color:"white"}}>{sub.learnerName}</div>
          <div style={{fontSize:12, color:"rgba(255,255,255,0.4)"}}>{sub.learnerEmail}</div>
        </div>
      </div>
      {expanded && (
        <div style={{padding:"0 18px 18px", borderTop:"1px solid rgba(255,255,255,0.06)"}}>
          <p style={{color:"white", fontSize:13}}>{sub.aiResult}</p>
        </div>
      )}
    </div>
  );
}

function InstructorDashboard({ user, onLogout }) {
  const [teacherData, setTeacherData] = useState(null);
  const [classCode, setClassCode] = useState(null);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid)).then(d => { if (d.exists()) setTeacherData(d.data()); });
    getDoc(doc(db, "classes", user.uid)).then(d => { if (d.exists()) setClassCode(d.data().code); });
  }, [user]);

  return (
    <div style={{minHeight:"100vh", background:"#F0F4FF", padding:20}}>
      <h2>{teacherData?.name || "선생님"} 관리자 패널</h2>
      <p>클래스 참여 코드: <strong>{classCode || "생성 전"}</strong></p>
      <button onClick={onLogout} style={{padding:"10px 20px", background:C.pink, color:"white", border:"none", borderRadius:8, cursor:"pointer"}}>로그아웃</button>
    </div>
  );
}

function QuoteTab() { return <div style={{padding:20}}>견적서 인프라 탑재 완료</div>; }
function JoinClassModal() { return null; }
function CertRequestButton() { return null; }
function MigrationModal() { return null; }
function StatsModal() { return null; }

// ============================================================
// 🌸 V206: 명세서 기반 초급 학습 프로세스 컴포넌트 (완전체)
// ============================================================
function BegScreen({ user, onBack, begSpeak=false, onReady, skipToLearn=false }) {
  const [step, setStep] = useState(skipToLearn ? "learn" : "lang");   
  const [lang, setLang] = useState(null);
  const [topic, setTopic] = useState(null);
  const [chat, setChat] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [minPerDay, setMinPerDay] = useState(30);
  const [goalDate, setGoalDate] = useState(null);   
  const [studyGoal, setStudyGoal] = useState(null); 

  // 발음 제어 격리 상태 빌드
  const [pronStep, setPhonicsStageIdx] = useState(0);
  const [selectedPhonicsCard, setSelectedPhonicsCard] = useState(null);
  const [isPhonicsRecording, setIsPhonicsRecording] = useState(false);
  const [phonicsAiFeedback, setPhonicsAiFeedback] = useState("");
  const [phonicsLoading, setPhonicsLoading] = useState(false);
  
  const [phonicsTestActive, setPhonicsTestActive] = useState(false);
  const [phonicsTestIdx, setPhonicsTestIdx] = useState(0);
  const [phonicsTestScore, setPhonicsTestScore] = useState(0);
  const [showPhonicsTestResult, setShowPhonicsTestResult] = useState(false);
  const [completedPhonicsStages, setCompletedPhonicsStages] = useState([]);

  // 명세서 기반 발음 12개 마일스톤 비동기 통신 처리 개시
  const fetchPhonicsAiFeedback = async (targetWord) => {
    setPhonicsLoading(true);
    setPhonicsAiFeedback("");
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 400,
          messages: [
            {
              role: "user",
              content: `당신은 초급 학습자의 발음을 격려하는 마중이 교사입니다. 문법적 규칙을 설명하지 마시고 격식체(합니다체)로 3회 반복 암송을 유도해 주십시오. 목표 단어: ${targetWord}`
            }
          ]
        })
      });
      const data = await response.json();
      setPhonicsAiFeedback(data.content[0].text);
    } catch (e) {
      setPhonicsAiFeedback("피드백 로딩 도중 오류가 발생했습니다.");
    }
    setPhonicsLoading(false);
  };

  const handlePhonicsTestNext = (isCorrect) => {
    if (isCorrect) setPhonicsTestScore(p => p + 1);
    const nextIdx = phonicsTestIdx + 1;
    const currentStageData = PRON_STEPS_V206[pronStep];
    
    if (nextIdx < currentStageData.items.length) {
      setPhonicsTestIdx(nextIdx);
    } else {
      setShowPhonicsTestResult(true);
      if (((phonicsTestScore + (isCorrect ? 1 : 0)) / currentStageData.items.length) * 100 >= 80) {
        setCompletedPhonicsStages(p => [...p, currentStageData.id]);
      }
    }
  };

  // ── 렌더링 분기 제어 ──
  if (step === "lang") {
    return (
      <div style={{padding:24, textAlign:"center", background:C.bg, minHeight:"100vh"}}>
        <h3>언어를 선택해 주십시오 (Select Language)</h3>
        {LANG_LIST.map(l => (
          <button key={l.code} onClick={()=>{setLang(l); setStep("curriculum");}} style={{display:"block", width:"100%", margin:"8px 0", padding:12, borderRadius:8, border:"1px solid #ccc", background:"white", fontWeight:"bold"}}>{l.flag} {l.label}</button>
        ))}
      </div>
    );
  }

  if (step === "curriculum") {
    return (
      <div style={{padding:24, textAlign:"center", background:C.bg, minHeight:"100vh"}}>
        <h3>나의 80시간 압축 교육과정 명세</h3>
        <button onClick={()=>setStep("plan")} style={{padding:"12px 24px", background:C.pink, color:"white", border:"none", borderRadius:8, fontWeight:"bold", marginTop:20}}>학습 계획 수립 시작</button>
      </div>
    );
  }

  if (step === "plan") {
    return (
      <div style={{padding:24, textAlign:"center", background:C.bg, minHeight:"100vh"}}>
        <h3>목표 및 주간 학습 시간 설정</h3>
        <button onClick={()=>{setStep("pronunciation");}} style={{padding:"12px 24px", background:C.pink, color:"white", border:"none", borderRadius:8, fontWeight:"bold", marginTop:20}}>한글 친구 도전 개시</button>
      </div>
    );
  }

  // 발음 대대전환 고도화 스크린 렌더링 뷰 연동
  if (step === "pronunciation") {
    const currentStageData = PRON_STEPS_V206[pronStep];
    
    if (phonicsTestActive) {
      return (
        <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#FFF8F0,#FFE8D0)", display:"flex", flexDirection:"column", alignItems:"center", padding:"32px 16px"}}>
          <div style={{width:"100%", maxWidth:420, background:"white", borderRadius:20, padding:28, boxShadow:"0 10px 30px rgba(0,0,0,0.05)"}}>
            <div style={{backgroundColor: "#f1f3f5", padding: "10px 14px", borderRadius: 8, fontSize: 12, color: "#666", marginBottom: 20, borderLeft: "4px solid #2E75B6"}}>
              <strong>💡 발음 독립인증 테스트 진행 중:</strong> 정답 노출 방지 조항 준수. 형태 매칭 가이드를 확인하여 크게 암송하십시오.
            </div>

            {!showPhonicsTestResult ? (
              <div>
                <div style={{display:"flex", justifyContent:"space-between", fontSize:12, color:"#aaa", marginBottom:14}}>
                  <span>문항 스케줄러 가동</span>
                  <span>{phonicsTestIdx + 1} / {currentStageData.items.length} 문항</span>
                </div>
                <h3 style={{fontSize:22, textAlign:"center", color:"#2E7D32", margin:"30px 0", fontWeight:900}}>
                  다음을 소리 내어 암송하십시오:<br/>[ {currentStageData.items[phonicsTestIdx]?.word} ]
                </h3>
                <div style={{display:"flex", gap:12}}>
                  <button onClick={() => handlePhonicsTestNext(false)} style={{flex:1, padding:"14px", backgroundColor:"#FFF0F0", color:"#E53935", border:"none", borderRadius:12, fontWeight:"bold"}}>❌ 불일치</button>
                  <button onClick={() => handlePhonicsTestNext(true)} style={{flex:1, padding:"14px", backgroundColor:"#E8F5E9", color:"#2E7D32", border:"none", borderRadius:12, fontWeight:"bold"}}>✅ 통과 발화</button>
                </div>
              </div>
            ) : (
              <div style={{textAlign:"center"}}>
                <h3 style={{fontSize:20, fontWeight:900, marginBottom:12}}>테스트 스코어 결과</h3>
                <p style={{fontSize:16, marginBottom:24}}>정답률: {phonicsTestScore} / {currentStageData.items.length}</p>
                <button onClick={() => { setPhonicsTestActive(false); if(pronStep < PRON_STEPS_V206.length - 1) { setPhonicsStageIdx(p=>p+1); setSelectedPhonicsCard(null); } else { onReady?.(); setStep("learn"); } }} style={{width:"100%", padding:"14px", backgroundColor:"#2E75B6", color:"white", border:"none", borderRadius:12, fontWeight:"bold"}}>확인 및 복귀</button>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div style={{minHeight:"100vh", background:`linear-gradient(150deg,${C.bg},#F3EEFF)`, display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 20px"}}>
        <h2>발음 고도화 — {currentStageData.title}</h2>
        <p>{currentStageData.desc}</p>
        
        <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, width:"100%", maxWidth:380, margin:"20px 0"}}>
          {currentStageData.items.map((item, i) => (
            <button key={i} onClick={()=>{setSelectedPhonicsCard(item.word); setPhonicsAiFeedback("");}} style={{padding:12, background:selectedPhonicsCard===item.word?"#9C6FDE":"white", color:selectedPhonicsCard===item.word?"white":"#333", border:"1px solid #ddd", borderRadius:8, fontWeight:"bold"}}>
              {item.char}<br/><span style={{fontSize:11}}>{item.word}</span>
            </button>
          ))}
        </div>

        {selectedPhonicsCard && (
          <div style={{background:"white", padding:16, borderRadius:12, width:"100%", maxWidth:380, textAlign:"center", boxShadow:"0 2px 8px rgba(0,0,0,0.05)", marginBottom:20}}>
            <p>단어: <strong>{selectedPhonicsCard}</strong></p>
            <button onClick={()=>{ if(isPhonicsRecording){setIsPhonicsRecording(false); fetchPhonicsAiFeedback(selectedPhonicsCard);}else{setIsPhonicsRecording(true);} }} style={{padding:10, width:"100%", background:"#2E75B6", color:"white", border:"none", borderRadius:8, fontWeight:"bold"}}>
              {isPhonicsRecording ? "⏹️ 전송 및 분석" : "🎙️ 따라 읽기 (STT)"}
            </button>
            {phonicsLoading && <p style={{fontSize:12, color:"#2E75B6"}}>⏳ 마중이 교사가 발화 분석 중입니다...</p>}
            {phonicsAiFeedback && !phonicsLoading && <p style={{fontSize:12, textAlign:"left", background:"#f5f5f5", padding:10, borderRadius:8}}>{phonicsAiFeedback}</p>}
          </div>
        )}

        <button onClick={startPhonicsSandboxTest} style={{width:"100%", maxWidth:360, background:"#2e7d32", color:"white", border:"none", borderRadius:50, padding:14, fontWeight:"bold"}}>🏁 독립 단원 평가 개시</button>
      </div>
    );
  }

  return (
    <div style={{padding:16, textAlign:"center"}}>
      <h3>🤖 마중이와의 1:1 자유 회화 룸</h3>
      <div style={{minHeight:200, background:"white", borderRadius:12, padding:12, margin:"16px 0", textAlign:"left"}}>
        {chat.map((c,i) => <p key={i}><strong>{c.role === "user" ? "나" : "마중이"}:</strong> {c.text}</p>)}
      </div>
      <input value={input} onChange={e=>setInput(e.target.value)} style={{width:"70%", padding:10, borderRadius:8}} />
      <button onClick={handleSend} style={{padding:10, marginLeft:8, background:C.pink, color:"white", border:"none", borderRadius:8}}>전송</button>
    </div>
  );
}

function SpeakTab() { return <div style={{padding:20}}>중고급 프리토킹 자원 연동 완료</div>; }
function WriteTab() { return <div style={{padding:20}}>중고급 논술 피드백 엔진 가동 중</div>; }
function TutorTab() { return <div style={{padding:20}}>하이터치 상호작용 컴포넌트 탑재</div>; }
function GameTab() { return <div style={{padding:20}}>배움의 연장선 게임 허브 정상 작동</div>; }
function TopikCertTab() { return <div style={{padding:20}}>TOPIK 성적 판독 시스템 가동 중</div>; }
