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
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  deleteField,
} from "firebase/firestore";

// ✅ V150: 최고 관리자 이메일 (이 이메일로만 AdminDashboard 접근 가능)
const ADMIN_EMAIL = "roh053068@gmail.com";
// ✅ V153: 개발자 학습자 이메일 (이 이메일로만 단계 점프 버튼 표시)
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
  const [role, setRole] = useState("learner"); // "learner" | "instructor"
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
        {/* 로그인 / 회원가입 탭 */}
        <div style={{display:"flex",background:"#f5f5f5",borderRadius:12,padding:4,marginBottom:20}}>
          {[["login","로그인"],["signup","회원가입"]].map(([k,l])=>(
            <button key={k} onClick={()=>{setTab(k);setError("");setDataOwnershipAgreed(false);setEmailAgreed(false);}} style={{flex:1,padding:"9px 0",border:"none",borderRadius:10,background:tab===k?"white":"transparent",fontWeight:tab===k?800:500,color:tab===k?C.pink:"#999",cursor:"pointer",fontSize:14,transition:"all .2s"}}>{l}</button>
          ))}
        </div>

        {/* 회원가입 전용 필드 */}
        {tab==="signup"&&(<>
          {/* 역할 선택 */}
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

        {/* 회원가입 동의 항목 */}
        {tab==="signup"&&(<>
          {/* 필수 동의 */}
          <div onClick={()=>setDataOwnershipAgreed(p=>!p)} style={{display:"flex",alignItems:"flex-start",gap:10,background:dataOwnershipAgreed?"#F0FBF7":"#FAFAFA",border:`1.5px solid ${dataOwnershipAgreed?"#00C896":"#e0e0e0"}`,borderRadius:12,padding:"12px 14px",marginBottom:8,cursor:"pointer",transition:"all .2s"}}>
            <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${dataOwnershipAgreed?"#00C896":"#ccc"}`,background:dataOwnershipAgreed?"#00C896":"white",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,transition:"all .2s"}}>
              {dataOwnershipAgreed&&<span style={{color:"white",fontSize:13,fontWeight:900,lineHeight:1}}>✓</span>}
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:"#333",marginBottom:3}}>(필수) 학습 데이터 소유권 귀속 및 활용 동의</div>
              <div style={{fontSize:11,color:"#777",lineHeight:1.6}}>학습자와 나눈 모든 대화 및 학습 데이터의 소유권은 한글 친구에 귀속되며, 이는 <strong>서비스의 고도화 및 인공지능 모델 업그레이드 연구</strong>를 위해 소중하게 사용됩니다.</div>
            </div>
          </div>

          {/* 선택 동의 */}
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
      <div style={{marginTop:24,textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:12}}>
        <div style={{fontSize:12,color:"#bbb",marginBottom:2}}>한글 친구가 처음이세요?</div>
        <a href="https://padlet.com/roh053068/breakout-room/Arng4MkerXZDqK6p-k2qlv36MmRprX5Rx" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:8,background:"white",border:`2px solid ${C.pink}55`,borderRadius:50,padding:"11px 22px",textDecoration:"none",color:C.pink,fontWeight:800,fontSize:14,boxShadow:`0 4px 16px ${C.pink}25`,WebkitTapHighlightColor:"transparent"}}>
          📚 소개자료 · 사용 메뉴얼 보기
        </a>
        <a href="https://padlet.com/roh053068/breakout-room/d6AO26JdBPgP2ojL-k2qlv36MmRprX5Rx" target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",gap:8,background:"white",border:`2px solid ${C.teal}55`,borderRadius:50,padding:"11px 22px",textDecoration:"none",color:C.teal,fontWeight:800,fontSize:14,boxShadow:`0 4px 16px ${C.teal}25`,WebkitTapHighlightColor:"transparent"}}>
          ✨ 이 앱이 나한테 어떤 도움이 될까?
        </a>
        {/* ✅ V148: 교육과정 표준 준수 증명서 요청 버튼 */}
        <CertRequestButton />
      </div>
    </div>
  );
}


// ════════════════════════════════════════════════════════
// ✅ V150: 최고 관리자 전용 화면 (AdminDashboard)
// ════════════════════════════════════════════════════════
function AdminDashboard({ user, onLogout, onExitAdmin }) {
  const [tab, setTab] = useState("topik"); // "topik" | "users"
  const [submissions, setSubmissions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // TOPIK 제출 목록 실시간 구독
  useEffect(() => {
    const q = query(collection(db, "topik_submissions"));
    const unsub = onSnapshot(q, snap => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // 최신순 정렬
      docs.sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0));
      setSubmissions(docs);
    });
    return () => unsub();
  }, []);

  // 전체 학습자 목록
  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "learner"));
    const unsub = onSnapshot(q, snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 관리자 최종 승인
  async function approveSubmission(subId, uid) {
    await updateDoc(doc(db, "topik_submissions", subId), {
      status: "approved",
      approvedAt: serverTimestamp(),
      approvedBy: "admin",
    });
    await updateDoc(doc(db, "users", uid), {
      topikApproved: true,
      topikApprovedAt: serverTimestamp(),
    });
  }

  // 반려
  async function rejectSubmission(subId, reason) {
    await updateDoc(doc(db, "topik_submissions", subId), {
      status: "rejected",
      rejectedAt: serverTimestamp(),
      rejectedReason: reason || "재제출 요청",
    });
  }

  const pending   = submissions.filter(s => s.status === "ai_reviewed");
  const approved  = submissions.filter(s => s.status === "approved");
  const rejected  = submissions.filter(s => s.status === "rejected");

  const STATUS_COLOR = { ai_reviewed:"#F5A623", approved:"#00C896", rejected:"#E53935", pending:"#aaa" };
  const STATUS_LABEL = { ai_reviewed:"AI 판독 완료 — 승인 대기", approved:"✅ 승인 완료", rejected:"❌ 반려", pending:"제출됨" };

  return (
    <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#1A1A2E,#16213E)", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      {/* 헤더 */}
      <div style={{background:"linear-gradient(135deg,#0F3460,#1A1A2E)", padding:"20px 20px 0", color:"white", borderBottom:"1px solid #ffffff15"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", maxWidth:800, margin:"0 auto"}}>
          <div>
            <div style={{fontSize:11, opacity:0.6, marginBottom:4, letterSpacing:2}}>🔐 ADMIN ONLY</div>
            <div style={{fontSize:20, fontWeight:900}}>최고 관리자 페이지</div>
            <div style={{fontSize:12, opacity:0.6, marginTop:2}}>{user.email}</div>
          </div>
          <div style={{display:"flex", flexDirection:"column", gap:6, alignItems:"flex-end"}}>
            <button onClick={onExitAdmin} style={{background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)", color:"white", borderRadius:20, padding:"7px 14px", fontSize:11, fontWeight:800, cursor:"pointer"}}>
              👩‍🏫 교수자 화면으로
            </button>
            <button onClick={onLogout} style={{background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.7)", borderRadius:20, padding:"7px 14px", fontSize:11, fontWeight:700, cursor:"pointer"}}>
              로그아웃
            </button>
          </div>
        </div>
        {/* 탭 */}
        <div style={{display:"flex", gap:8, marginTop:16, maxWidth:800, margin:"16px auto 0"}}>
          {[["topik","🎓 TOPIK 성적 검증"],["users","👥 전체 학습자"]].map(([k,l]) => (
            <button key={k} onClick={()=>setTab(k)} style={{padding:"9px 20px", border:"none", borderRadius:"16px 16px 0 0", background:tab===k?"white":"transparent", color:tab===k?"#0F3460":"rgba(255,255,255,0.6)", fontWeight:tab===k?800:500, fontSize:13, cursor:"pointer"}}>
              {l} {k==="topik" && pending.length > 0 && <span style={{background:"#F5A623", color:"white", borderRadius:10, padding:"1px 7px", fontSize:11, marginLeft:4}}>{pending.length}</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:"20px 16px", maxWidth:800, margin:"0 auto"}}>

        {/* ── TOPIK 성적 검증 탭 ── */}
        {tab === "topik" && (
          <div>
            {/* 통계 요약 */}
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:20}}>
              {[
                ["⏳", "승인 대기", pending.length, "#F5A623"],
                ["✅", "승인 완료", approved.length, "#00C896"],
                ["❌", "반려", rejected.length, "#E53935"],
              ].map(([icon, label, count, color]) => (
                <div key={label} style={{background:"rgba(255,255,255,0.05)", border:`1px solid ${color}40`, borderRadius:16, padding:"14px 12px", textAlign:"center"}}>
                  <div style={{fontSize:22}}>{icon}</div>
                  <div style={{fontSize:22, fontWeight:900, color}}>{count}</div>
                  <div style={{fontSize:11, color:"rgba(255,255,255,0.5)", marginTop:2}}>{label}</div>
                </div>
              ))}
            </div>

            {submissions.length === 0 ? (
              <div style={{background:"rgba(255,255,255,0.05)", borderRadius:20, padding:40, textAlign:"center"}}>
                <div style={{fontSize:40, marginBottom:12}}>📭</div>
                <div style={{fontSize:15, fontWeight:700, color:"rgba(255,255,255,0.7)"}}>아직 제출된 성적표가 없어요</div>
              </div>
            ) : (
              submissions.map(sub => (
                <SubmissionCard key={sub.id} sub={sub} onApprove={approveSubmission} onReject={rejectSubmission} />
              ))
            )}
          </div>
        )}

        {/* ── 전체 학습자 탭 ── */}
        {tab === "users" && (
          <div>
            {loading ? (
              <div style={{color:"rgba(255,255,255,0.5)", textAlign:"center", padding:40}}>로딩 중...</div>
            ) : users.length === 0 ? (
              <div style={{color:"rgba(255,255,255,0.5)", textAlign:"center", padding:40}}>학습자가 없어요</div>
            ) : (
              users.map(u => (
                <div key={u.id} style={{background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:16, marginBottom:10}}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                    <div>
                      <div style={{fontSize:14, fontWeight:800, color:"white"}}>{u.name || "이름 없음"}</div>
                      <div style={{fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:2}}>{u.email}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      {u.topikApproved && <div style={{fontSize:11, background:"#00C89620", color:"#00C896", borderRadius:10, padding:"3px 10px", fontWeight:700}}>TOPIK 인증 ✅</div>}
                      <div style={{fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:4}}>
                        말하기 {u.stats?.speak||0} · 쓰기 {u.stats?.write||0}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// 개별 제출 카드 (AI 판독 결과 + 관리자 승인/반려)
function SubmissionCard({ sub, onApprove, onReject }) {
  const [expanded, setExpanded] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [acting, setActing] = useState(false);

  const statusColor = { ai_reviewed:"#F5A623", approved:"#00C896", rejected:"#E53935", pending:"#aaa" };
  const statusLabel = { ai_reviewed:"AI 판독 완료 — 승인 대기", approved:"승인 완료", rejected:"반려됨", pending:"분석 중" };
  const col = statusColor[sub.status] || "#aaa";

  async function handleApprove() {
    setActing(true);
    await onApprove(sub.id, sub.uid);
    setActing(false);
  }
  async function handleReject() {
    setActing(true);
    await onReject(sub.id, rejectReason);
    setActing(false);
  }

  return (
    <div style={{background:"rgba(255,255,255,0.05)", border:`1px solid ${col}40`, borderRadius:20, marginBottom:14, overflow:"hidden"}}>
      {/* 헤더 행 */}
      <div onClick={()=>setExpanded(p=>!p)} style={{padding:"16px 18px", cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <div>
          <div style={{fontSize:14, fontWeight:800, color:"white"}}>{sub.learnerName || "이름 없음"}</div>
          <div style={{fontSize:12, color:"rgba(255,255,255,0.4)", marginTop:2}}>{sub.learnerEmail}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:11, background:`${col}20`, color:col, borderRadius:10, padding:"3px 10px", fontWeight:700}}>
            {statusLabel[sub.status] || sub.status}
          </div>
          <div style={{fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:4}}>
            {sub.submittedAt ? new Date(sub.submittedAt.seconds*1000).toLocaleDateString("ko-KR") : ""}
          </div>
        </div>
      </div>

      {/* 상세 (펼침) */}
      {expanded && (
        <div style={{padding:"0 18px 18px", borderTop:"1px solid rgba(255,255,255,0.06)"}}>
          {/* AI 판독 결과 */}
          <div style={{background:"rgba(0,0,0,0.3)", borderRadius:14, padding:16, marginTop:14, marginBottom:14}}>
            <div style={{fontSize:12, color:"#F5A623", fontWeight:700, marginBottom:8}}>🤖 Claude AI 판독 결과</div>
            <div style={{fontSize:13, color:"rgba(255,255,255,0.8)", lineHeight:1.7, whiteSpace:"pre-wrap"}}>
              {sub.aiResult || "판독 결과 없음"}
            </div>
            {sub.aiScore && (
              <div style={{marginTop:10, display:"flex", gap:8}}>
                <span style={{background:"#00C89620", color:"#00C896", borderRadius:10, padding:"4px 12px", fontSize:12, fontWeight:700}}>
                  판독 점수: {sub.aiScore}점
                </span>
                <span style={{background:sub.aiPassed?"#00C89620":"#E5393520", color:sub.aiPassed?"#00C896":"#E53935", borderRadius:10, padding:"4px 12px", fontSize:12, fontWeight:700}}>
                  {sub.aiPassed ? "✅ 합격 판정" : "❌ 미합격 판정"}
                </span>
              </div>
            )}
          </div>

          {/* 이미지 링크 */}
          {sub.imageUrl && (
            <a href={sub.imageUrl} target="_blank" rel="noopener noreferrer"
              style={{display:"inline-flex", alignItems:"center", gap:6, background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:10, padding:"8px 14px", color:"rgba(255,255,255,0.7)", fontSize:12, textDecoration:"none", marginBottom:14}}>
              🖼️ 원본 이미지 열기
            </a>
          )}

          {/* 승인/반려 버튼 (대기 상태일 때만) */}
          {sub.status === "ai_reviewed" && (
            <div>
              <button onClick={handleApprove} disabled={acting}
                style={{width:"100%", background:"linear-gradient(135deg,#00C896,#00A87A)", color:"white", border:"none", borderRadius:12, padding:"13px 0", fontSize:14, fontWeight:900, cursor:"pointer", marginBottom:10}}>
                {acting ? "처리 중..." : "✅ 최종 승인 — 배지 & 권한 부여"}
              </button>
              <input value={rejectReason} onChange={e=>setRejectReason(e.target.value)}
                placeholder="반려 사유 (선택)"
                style={{width:"100%", padding:"10px 14px", borderRadius:10, border:"1px solid rgba(255,255,255,0.15)", background:"rgba(255,255,255,0.05)", color:"white", fontSize:13, marginBottom:8, boxSizing:"border-box"}}
              />
              <button onClick={handleReject} disabled={acting}
                style={{width:"100%", background:"rgba(229,57,53,0.15)", border:"1px solid #E5393540", color:"#E53935", borderRadius:12, padding:"11px 0", fontSize:13, fontWeight:700, cursor:"pointer"}}>
                ❌ 반려
              </button>
            </div>
          )}

          {sub.status === "approved" && (
            <div style={{background:"#00C89615", border:"1px solid #00C89640", borderRadius:12, padding:"12px 16px", fontSize:13, color:"#00C896", fontWeight:600}}>
              ✅ 승인 완료 — 학습자에게 배지 및 원어민 대화권이 부여됐어요.
            </div>
          )}
          {sub.status === "rejected" && (
            <div style={{background:"#E5393515", border:"1px solid #E5393540", borderRadius:12, padding:"12px 16px", fontSize:13, color:"#E53935"}}>
              ❌ 반려됨 — 사유: {sub.rejectedReason || "없음"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// ✅ V148: 교수자 전용 관리 화면 (InstructorDashboard)
// ════════════════════════════════════════════════════════
function InstructorDashboard({ user, onLogout, isAdmin=false, onEnterAdmin }) {
  const [teacherData, setTeacherData] = useState(null);
  const [classCode, setClassCode] = useState(null);
  const [students, setStudents] = useState([]);
  const [tab, setTab] = useState("class"); // "class" | "students" | "quote"
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // 교수자 정보 및 클래스 코드 로드
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid)).then(d => {
      if (d.exists()) setTeacherData(d.data());
    });
    // 클래스 코드 조회 (없으면 null)
    getDoc(doc(db, "classes", user.uid)).then(d => {
      if (d.exists()) setClassCode(d.data().code);
    }).catch(() => {});
    setLoading(false);
  }, [user]);

  // 연결된 학습자 실시간 구독
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users"), where("currentTeacherId", "==", user.uid));
    const unsub = onSnapshot(q, snap => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  // 클래스 코드 생성
  async function generateCode() {
    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      await setDoc(doc(db, "classes", user.uid), {
        teacherId: user.uid,
        teacherName: teacherData?.name || user.displayName || "선생님",
        code,
        createdAt: serverTimestamp(),
      });
      setClassCode(code);
    } catch(e) {
      alert("코드 생성 중 오류가 발생했어요: " + e.message);
    }
  }

  // 클래스 링크 복사
  function copyLink() {
    const link = `${window.location.origin}?join=${classCode}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // 학습자 연결 해제
  async function disconnectStudent(studentId) {
    if (!window.confirm("이 학습자와의 연결을 해제하시겠습니까?")) return;
    await updateDoc(doc(db, "users", studentId), {
      currentTeacherId: deleteField(),
      teacherName: deleteField(),
    });
  }

  const teacherName = teacherData?.name || user.displayName || "선생님";

  return (
    <div style={{minHeight:"100vh", background:`linear-gradient(150deg,#F0F4FF,#E8F0FB)`, fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      {/* 헤더 */}
      <div style={{background:"linear-gradient(135deg,#2E75B6,#1A3A5C)", padding:"20px 20px 16px", color:"white"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
          <div>
            <div style={{fontSize:12, opacity:0.8, marginBottom:4}}>👩‍🏫 교수자 관리 화면</div>
            <div style={{fontSize:20, fontWeight:900}}>{teacherName} 선생님</div>
            <div style={{fontSize:12, opacity:0.75, marginTop:2}}>{user.email}</div>
          </div>
          <div style={{display:"flex", flexDirection:"column", gap:6, alignItems:"flex-end"}}>
            {isAdmin && (
              <button onClick={onEnterAdmin} style={{background:"linear-gradient(135deg,#F5A623,#E8940F)", border:"none", color:"white", borderRadius:20, padding:"7px 14px", fontSize:11, fontWeight:800, cursor:"pointer", letterSpacing:0.5}}>
                🔐 관리자 페이지
              </button>
            )}
            <button onClick={onLogout} style={{background:"rgba(255,255,255,0.15)", border:"none", color:"white", borderRadius:20, padding:"8px 16px", fontSize:12, fontWeight:700, cursor:"pointer"}}>
              로그아웃
            </button>
          </div>
        </div>
        {/* 탭 */}
        <div style={{display:"flex", gap:8, marginTop:16}}>
          {[["class","🏫 클래스 관리"],["students","👥 학습자 목록"],["quote","📄 견적서"]].map(([k,l]) => (
            <button key={k} onClick={()=>setTab(k)} style={{padding:"8px 18px", border:"none", borderRadius:20, background:tab===k?"white":"rgba(255,255,255,0.15)", color:tab===k?"#2E75B6":"white", fontWeight:tab===k?800:600, fontSize:13, cursor:"pointer", transition:"all .2s"}}>
              {l} {k==="students" && students.length > 0 && `(${students.length})`}
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:"20px 16px", maxWidth:600, margin:"0 auto"}}>

        {/* ── 클래스 관리 탭 ── */}
        {tab === "class" && (
          <div>
            <div style={{background:"white", borderRadius:20, padding:24, boxShadow:"0 4px 16px rgba(0,0,0,0.08)", marginBottom:16}}>
              <div style={{fontSize:15, fontWeight:900, color:"#1A3A5C", marginBottom:4}}>📋 클래스 참여 코드</div>
              <div style={{fontSize:13, color:"#888", marginBottom:20}}>학습자가 이 코드 또는 링크로 선생님 클래스에 참여할 수 있어요.</div>

              {classCode ? (
                <>
                  {/* 코드 표시 */}
                  <div style={{background:"#F0F4FF", border:"2px dashed #2E75B6", borderRadius:16, padding:"20px", textAlign:"center", marginBottom:16}}>
                    <div style={{fontSize:12, color:"#888", marginBottom:8}}>클래스 참여 코드</div>
                    <div style={{fontSize:40, fontWeight:900, color:"#2E75B6", letterSpacing:8}}>{classCode}</div>
                    <div style={{fontSize:11, color:"#aaa", marginTop:8}}>학습자에게 이 코드를 알려주세요</div>
                  </div>

                  {/* 링크 복사 */}
                  <div style={{background:"#f9f9f9", border:"1px solid #eee", borderRadius:12, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12}}>
                    <div style={{fontSize:12, color:"#666", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1}}>
                      {window.location.origin}?join={classCode}
                    </div>
                    <button onClick={copyLink} style={{background: copied?"#00C896":"#2E75B6", color:"white", border:"none", borderRadius:20, padding:"7px 16px", fontSize:12, fontWeight:800, cursor:"pointer", marginLeft:12, flexShrink:0, transition:"all .3s"}}>
                      {copied ? "✅ 복사됨" : "링크 복사"}
                    </button>
                  </div>

                  {/* 재생성 */}
                  <button onClick={generateCode} style={{width:"100%", background:"none", border:"1.5px solid #ddd", borderRadius:12, padding:"10px 0", fontSize:13, color:"#aaa", cursor:"pointer"}}>
                    🔄 코드 재생성
                  </button>
                </>
              ) : (
                <button onClick={generateCode} style={{width:"100%", background:"linear-gradient(135deg,#2E75B6,#1A3A5C)", color:"white", border:"none", borderRadius:16, padding:"18px 0", fontSize:16, fontWeight:900, cursor:"pointer"}}>
                  ✨ 클래스 코드 생성하기
                </button>
              )}
            </div>

            {/* 사용 안내 */}
            <div style={{background:"white", borderRadius:20, padding:20, boxShadow:"0 4px 16px rgba(0,0,0,0.06)"}}>
              <div style={{fontSize:14, fontWeight:800, color:"#1A3A5C", marginBottom:12}}>📖 사용 방법</div>
              {[
                ["1", "위 코드 생성 버튼을 눌러 클래스 코드를 만드세요"],
                ["2", "학습자에게 코드 또는 링크를 공유하세요"],
                ["3", "학습자가 앱에서 코드를 입력하면 연결 요청이 옵니다"],
                ["4", "연결된 학습자의 학습 데이터를 '학습자 목록' 탭에서 확인하세요"],
              ].map(([no, text]) => (
                <div key={no} style={{display:"flex", gap:12, marginBottom:10, alignItems:"flex-start"}}>
                  <div style={{width:24, height:24, borderRadius:"50%", background:"#2E75B6", color:"white", fontSize:12, fontWeight:900, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                    {no}
                  </div>
                  <div style={{fontSize:13, color:"#555", lineHeight:1.6, paddingTop:2}}>{text}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 학습자 목록 탭 ── */}
        {tab === "students" && (
          <div>
            {students.length === 0 ? (
              <div style={{background:"white", borderRadius:20, padding:40, textAlign:"center", boxShadow:"0 4px 16px rgba(0,0,0,0.06)"}}>
                <div style={{fontSize:40, marginBottom:12}}>👥</div>
                <div style={{fontSize:15, fontWeight:800, color:"#1A3A5C", marginBottom:8}}>아직 연결된 학습자가 없어요</div>
                <div style={{fontSize:13, color:"#aaa"}}>클래스 코드를 공유해서 학습자를 초대해 보세요</div>
              </div>
            ) : (
              students.map(st => (
                <div key={st.id} style={{background:"white", borderRadius:16, padding:18, marginBottom:12, boxShadow:"0 4px 12px rgba(0,0,0,0.06)"}}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
                    <div>
                      <div style={{fontSize:15, fontWeight:800, color:"#1A3A5C"}}>{st.name || "이름 없음"}</div>
                      <div style={{fontSize:12, color:"#aaa", marginTop:2}}>{st.email}</div>
                    </div>
                    <button onClick={()=>disconnectStudent(st.id)} style={{background:"#FFF0F0", border:"1px solid #FFCCCC", color:"#E53935", borderRadius:20, padding:"6px 14px", fontSize:12, fontWeight:700, cursor:"pointer"}}>
                      연결 해제
                    </button>
                  </div>
                  {/* 학습 통계 */}
                  <div style={{display:"flex", gap:8}}>
                    {[["🗣️","말하기", st.stats?.speak||0],["✍️","쓰기", st.stats?.write||0],["🤝","하이터치", st.stats?.tutor||0]].map(([icon, label, val]) => (
                      <div key={label} style={{flex:1, background:"#F5F8FF", borderRadius:10, padding:"10px 8px", textAlign:"center"}}>
                        <div style={{fontSize:16}}>{icon}</div>
                        <div style={{fontSize:18, fontWeight:900, color:"#2E75B6"}}>{val}</div>
                        <div style={{fontSize:11, color:"#888"}}>{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── 견적서 탭 ── */}
        {tab === "quote" && <QuoteTab teacherName={teacherName} />}

      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// ✅ V149: 견적서 생성 컴포넌트
// ════════════════════════════════════════════════════════
function QuoteTab({ teacherName }) {
  const [studentCount, setStudentCount] = useState(30);
  const [months, setMonths] = useState(6);
  const [orgName, setOrgName] = useState("");
  const [generated, setGenerated] = useState(false);

  // 요금제 (학생 수 기준)
  const PLANS = [
    { max: 30,  unitPrice: 5000,  label: "소규모 (30명 이하)" },
    { max: 100, unitPrice: 4000,  label: "중규모 (31~100명)" },
    { max: 300, unitPrice: 3000,  label: "대규모 (101~300명)" },
    { max: 9999,unitPrice: 2500,  label: "기관 맞춤 (300명 초과)" },
  ];

  const plan = PLANS.find(p => studentCount <= p.max) || PLANS[PLANS.length - 1];
  const monthlyTotal = studentCount * plan.unitPrice;
  const grandTotal = monthlyTotal * months;
  const fmt = n => n.toLocaleString("ko-KR");

  function printQuote() {
    const today = new Date();
    const dateStr = `${today.getFullYear()}년 ${today.getMonth()+1}월 ${today.getDate()}일`;
    const validDate = new Date(today); validDate.setDate(validDate.getDate() + 30);
    const validStr = `${validDate.getFullYear()}년 ${validDate.getMonth()+1}월 ${validDate.getDate()}일`;

    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8"/>
<title>견적서 — 한글 친구</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Noto Sans KR',sans-serif; color:#1A1A2E; background:#fff; padding:40px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:36px; border-bottom:3px solid #2E75B6; padding-bottom:20px; }
  .brand { font-size:22px; font-weight:900; color:#2E75B6; }
  .brand-sub { font-size:12px; color:#888; margin-top:4px; }
  .doc-title { font-size:28px; font-weight:900; text-align:center; margin-bottom:28px; color:#1A3A5C; }
  .meta { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:28px; }
  .meta-box { background:#F0F4FF; border-radius:12px; padding:14px 18px; }
  .meta-label { font-size:11px; color:#888; margin-bottom:4px; }
  .meta-value { font-size:14px; font-weight:700; color:#1A3A5C; }
  table { width:100%; border-collapse:collapse; margin-bottom:24px; }
  th { background:#2E75B6; color:white; padding:12px 16px; font-size:13px; text-align:left; }
  td { padding:12px 16px; border-bottom:1px solid #eee; font-size:13px; }
  tr:nth-child(even) td { background:#F5F8FF; }
  .total-row td { background:#1A3A5C; color:white; font-weight:900; font-size:15px; }
  .note { background:#FFF8EC; border-left:4px solid #F5A623; border-radius:0 12px 12px 0; padding:16px 20px; margin-bottom:24px; font-size:13px; line-height:1.7; color:#555; }
  .footer { text-align:center; font-size:12px; color:#aaa; margin-top:36px; padding-top:16px; border-top:1px solid #eee; }
  .sign-area { display:flex; justify-content:flex-end; margin-top:28px; }
  .sign-box { text-align:center; border:1px solid #ddd; border-radius:12px; padding:16px 32px; }
  .sign-label { font-size:12px; color:#888; margin-bottom:8px; }
  .sign-name { font-size:15px; font-weight:900; color:#1A3A5C; }
  @media print { body { padding:20px; } }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="brand">한글 친구 (Hangeul Chingu)</div>
    <div class="brand-sub">AI 기반 한국어 학습 플랫폼 · hangeul-chingu.vercel.app</div>
  </div>
  <div style="text-align:right; font-size:12px; color:#888;">
    <div>발행일: ${dateStr}</div>
    <div>유효기간: ${validStr}까지</div>
  </div>
</div>

<div class="doc-title">📄 예산 기획 및 견적서</div>

<div class="meta">
  <div class="meta-box">
    <div class="meta-label">수신 기관명</div>
    <div class="meta-value">${orgName || "(기관명 미입력)"}</div>
  </div>
  <div class="meta-box">
    <div class="meta-label">담당 교수자</div>
    <div class="meta-value">${teacherName} 선생님</div>
  </div>
  <div class="meta-box">
    <div class="meta-label">학습자 규모</div>
    <div class="meta-value">${fmt(studentCount)}명</div>
  </div>
  <div class="meta-box">
    <div class="meta-label">운영 기간</div>
    <div class="meta-value">${months}개월</div>
  </div>
</div>

<table>
  <thead>
    <tr><th>항목</th><th>단가 (1인/월)</th><th>인원</th><th>기간</th><th>금액</th></tr>
  </thead>
  <tbody>
    <tr>
      <td>디지털 학습 인프라 구축 및 AI 서버 유지 후원금<br/><span style="font-size:11px;color:#aaa;">${plan.label} 요금제 · 한글 친구 AI 학습 플랫폼</span></td>
      <td>${fmt(plan.unitPrice)}원</td>
      <td>${fmt(studentCount)}명</td>
      <td>${months}개월</td>
      <td style="font-weight:700;">${fmt(grandTotal)}원</td>
    </tr>
    <tr class="total-row">
      <td colspan="4" style="text-align:right;">합계 (VAT 포함)</td>
      <td>${fmt(grandTotal)}원</td>
    </tr>
  </tbody>
</table>

<div class="note">
  <strong>📌 비용 명목 안내</strong><br/>
  본 견적서의 비용 항목은 <strong>디지털 학습 인프라 구축 및 AI 서버 유지 후원금</strong>으로,
  한글 친구 AI 학습 플랫폼의 지속적인 운영·고도화를 위한 재원으로 사용됩니다.
  공공기관 및 비영리 교육 기관의 예산 편성 기준에 맞게 설계된 항목명입니다.<br/><br/>
  <strong>📌 서비스 내용</strong><br/>
  • AI 기반 1:1 맞춤형 한국어 말하기·쓰기 훈련 (마중이 AI)<br/>
  • TOPIK 1~2급 대응 80시간 압축 커리큘럼<br/>
  • 교수자 대시보드 · 학습자 진도 관리 · 클래스 운영 시스템<br/>
  • 다국어 지원 (한국어·베트남어·영어)
</div>

<div class="sign-area">
  <div class="sign-box">
    <div class="sign-label">발행인</div>
    <div class="sign-name">한글 친구 (Hangeul Chingu)</div>
    <div style="font-size:11px;color:#aaa;margin-top:4px;">한국어 교원 2급 (문화체육관광부)</div>
    <div style="margin-top:12px; border-top:1px solid #eee; padding-top:10px; font-size:12px; color:#2E75B6;">hangeul-chingu.vercel.app</div>
  </div>
</div>

<div class="footer">
  본 견적서는 한글 친구(Hangeul Chingu) AI 학습 플랫폼이 자동 생성한 문서입니다.<br/>
  문의: hangeul-chingu.vercel.app
</div>
</body>
</html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
    setGenerated(true);
  }

  return (
    <div>
      <div style={{background:"white", borderRadius:20, padding:24, boxShadow:"0 4px 16px rgba(0,0,0,0.08)", marginBottom:16}}>
        <div style={{fontSize:15, fontWeight:900, color:"#1A3A5C", marginBottom:4}}>📄 예산 기획 및 견적서 생성</div>
        <div style={{fontSize:13, color:"#888", marginBottom:20, lineHeight:1.6}}>기관 제출용 견적서를 자동으로 생성해요.<br/>인쇄하거나 PDF로 저장할 수 있어요.</div>

        {/* 기관명 */}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:13, fontWeight:700, color:"#1A3A5C", marginBottom:8}}>수신 기관명 (선택)</div>
          <input
            value={orgName}
            onChange={e=>setOrgName(e.target.value)}
            placeholder="예: ○○다문화가족지원센터"
            style={{width:"100%", padding:"11px 14px", borderRadius:12, border:"1.5px solid #e0e0e0", fontSize:14, outline:"none", boxSizing:"border-box"}}
          />
        </div>

        {/* 학생 수 */}
        <div style={{marginBottom:16}}>
          <div style={{fontSize:13, fontWeight:700, color:"#1A3A5C", marginBottom:8}}>
            학습자 수: <span style={{color:"#2E75B6"}}>{studentCount}명</span>
          </div>
          <input type="range" min={1} max={300} value={studentCount}
            onChange={e=>setStudentCount(Number(e.target.value))}
            style={{width:"100%", accentColor:"#2E75B6"}}
          />
          <div style={{display:"flex", justifyContent:"space-between", fontSize:11, color:"#aaa", marginTop:4}}>
            <span>1명</span><span>150명</span><span>300명</span>
          </div>
          {/* 직접 입력 */}
          <input type="number" min={1} max={9999} value={studentCount}
            onChange={e=>setStudentCount(Math.max(1,Number(e.target.value)))}
            style={{marginTop:8, width:90, padding:"7px 10px", borderRadius:10, border:"1.5px solid #e0e0e0", fontSize:13, textAlign:"center"}}
          />
          <span style={{fontSize:12, color:"#888", marginLeft:6}}>명 직접 입력</span>
        </div>

        {/* 운영 기간 */}
        <div style={{marginBottom:20}}>
          <div style={{fontSize:13, fontWeight:700, color:"#1A3A5C", marginBottom:8}}>
            운영 기간: <span style={{color:"#2E75B6"}}>{months}개월</span>
          </div>
          <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
            {[3,6,9,12].map(m => (
              <button key={m} onClick={()=>setMonths(m)}
                style={{padding:"8px 18px", borderRadius:20, border:`2px solid ${months===m?"#2E75B6":"#e0e0e0"}`,
                  background:months===m?"#2E75B6":"white", color:months===m?"white":"#555",
                  fontWeight:months===m?800:600, fontSize:13, cursor:"pointer"}}>
                {m}개월
              </button>
            ))}
          </div>
        </div>

        {/* 요금 요약 */}
        <div style={{background:"#F0F4FF", borderRadius:16, padding:18, marginBottom:20}}>
          <div style={{fontSize:12, color:"#888", marginBottom:8}}>{plan.label} 요금제 적용</div>
          <div style={{display:"flex", justifyContent:"space-between", marginBottom:6}}>
            <span style={{fontSize:13, color:"#555"}}>1인당 월 단가</span>
            <span style={{fontSize:13, fontWeight:700}}>{fmt(plan.unitPrice)}원</span>
          </div>
          <div style={{display:"flex", justifyContent:"space-between", marginBottom:6}}>
            <span style={{fontSize:13, color:"#555"}}>월 합계</span>
            <span style={{fontSize:13, fontWeight:700}}>{fmt(monthlyTotal)}원</span>
          </div>
          <div style={{borderTop:"1px solid #2E75B620", margin:"10px 0"}}/>
          <div style={{display:"flex", justifyContent:"space-between"}}>
            <span style={{fontSize:15, fontWeight:900, color:"#1A3A5C"}}>{months}개월 총액</span>
            <span style={{fontSize:18, fontWeight:900, color:"#2E75B6"}}>{fmt(grandTotal)}원</span>
          </div>
        </div>

        <button onClick={printQuote}
          style={{width:"100%", background:"linear-gradient(135deg,#2E75B6,#1A3A5C)", color:"white",
            border:"none", borderRadius:16, padding:"16px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>
          🖨️ 견적서 출력 / PDF 저장
        </button>

        {generated && (
          <div style={{marginTop:12, background:"#E8F5EE", border:"1px solid #00C896", borderRadius:12,
            padding:"12px 16px", fontSize:13, color:"#1E6B3C", fontWeight:600, textAlign:"center"}}>
            ✅ 견적서가 생성됐어요! 인쇄 창에서 'PDF로 저장'을 선택하세요.
          </div>
        )}
      </div>

      {/* 요금제 안내 */}
      <div style={{background:"white", borderRadius:20, padding:20, boxShadow:"0 4px 16px rgba(0,0,0,0.06)"}}>
        <div style={{fontSize:14, fontWeight:800, color:"#1A3A5C", marginBottom:12}}>💡 요금제 안내</div>
        {PLANS.slice(0,3).map((p,i) => (
          <div key={i} style={{display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"10px 0", borderBottom: i<2?"1px solid #f0f0f0":"none"}}>
            <span style={{fontSize:13, color:"#555"}}>{p.label}</span>
            <span style={{fontSize:13, fontWeight:700, color:"#2E75B6"}}>{fmt(p.unitPrice)}원/인·월</span>
          </div>
        ))}
        <div style={{marginTop:12, fontSize:12, color:"#aaa", lineHeight:1.6}}>
          ※ 비용 명목: 디지털 학습 인프라 구축 및 AI 서버 유지 후원금<br/>
          ※ 300명 초과 기관은 별도 협의&nbsp;
          <button onClick={()=>{
            const to = "roh053068@gmail.com";
            const subject = encodeURIComponent("[한글 친구] 300명 초과 기관 도입 협의 요청");
            const body = encodeURIComponent(
              "안녕하세요, 한글 친구 담당자님.\n\n" +
              "저는 " + teacherName + " 입니다.\n" +
              "300명 초과 규모의 기관 도입을 협의하고 싶어 연락드립니다.\n\n" +
              "━━━━━━━━━━━━━━━━━━━━\n" +
              "▪ 기관명: (기관명을 입력해주세요)\n" +
              "▪ 예상 학습자 수: (인원을 입력해주세요)\n" +
              "▪ 운영 예정 기간: (기간을 입력해주세요)\n" +
              "▪ 문의 내용: (자유롭게 작성해주세요)\n" +
              "━━━━━━━━━━━━━━━━━━━━\n\n" +
              "감사합니다."
            );
            window.open(
              `https://mail.google.com/mail/?view=cm&to=${to}&su=${subject}&body=${body}`,
              "_blank"
            );
          }} style={{
            display:"inline-block",
            background:"linear-gradient(135deg,#2E75B6,#1A3A5C)",
            color:"white", border:"none", borderRadius:20,
            padding:"5px 14px", fontSize:12, fontWeight:800,
            cursor:"pointer", verticalAlign:"middle", marginLeft:4
          }}>
            📩 협의 요청
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// ✅ V148: 학습자 → 교수자 클래스 참여 팝업
// ════════════════════════════════════════════════════════
function JoinClassModal({ user, code, onClose }) {
  const [teacherData, setTeacherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // 코드로 교수자 클래스 조회
    const q = query(collection(db, "classes"), where("code", "==", code));
    getDocs(q).then(snap => {
      if (snap.empty) { setError("유효하지 않은 코드예요"); setLoading(false); return; }
      setTeacherData(snap.docs[0].data());
      setLoading(false);
    }).catch(() => { setError("조회 중 오류가 발생했어요"); setLoading(false); });
  }, [code]);

  async function handleJoin() {
    if (!teacherData) return;
    setJoining(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        currentTeacherId: teacherData.teacherId,
        teacherName: teacherData.teacherName,
        connectedAt: serverTimestamp(),
      });
      onClose(true);
    } catch(e) {
      setError("연결 중 오류가 발생했어요");
    }
    setJoining(false);
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:3000,padding:24,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <div style={{background:"white",borderRadius:24,width:"100%",maxWidth:360,overflow:"hidden",boxShadow:"0 16px 48px rgba(0,0,0,0.25)"}}>
        <div style={{background:"linear-gradient(135deg,#2E75B6,#1A3A5C)",padding:"22px 24px 18px",textAlign:"center"}}>
          <div style={{fontSize:36,marginBottom:6}}>🏫</div>
          <div style={{fontSize:17,fontWeight:900,color:"white"}}>클래스 참여 요청</div>
        </div>
        <div style={{padding:"24px"}}>
          {loading ? (
            <div style={{textAlign:"center",padding:20,color:"#aaa"}}>확인 중...</div>
          ) : error ? (
            <>
              <div style={{background:"#FFF0F0",border:"1px solid #FFCCCC",borderRadius:12,padding:"14px",fontSize:14,color:"#E53935",textAlign:"center",marginBottom:16}}>{error}</div>
              <button onClick={()=>onClose(false)} style={{width:"100%",background:"#f5f5f5",border:"none",borderRadius:50,padding:"12px 0",fontSize:14,color:"#888",cursor:"pointer"}}>닫기</button>
            </>
          ) : (
            <>
              <div style={{background:"#F0F4FF",borderRadius:16,padding:18,textAlign:"center",marginBottom:20}}>
                <div style={{fontSize:14,color:"#888",marginBottom:6}}>클래스 참여 요청</div>
                <div style={{fontSize:20,fontWeight:900,color:"#1A3A5C"}}>{teacherData?.teacherName} 선생님</div>
                <div style={{fontSize:12,color:"#aaa",marginTop:4}}>의 클래스에 참여하시겠습니까?</div>
              </div>
              <div style={{background:"#FFF8DC",border:"1px solid #F0D060",borderRadius:12,padding:"12px 14px",fontSize:12,color:"#7A6000",lineHeight:1.7,marginBottom:20}}>
                ⚠️ <strong>{teacherData?.teacherName} 선생님</strong>에게 나의 학습 데이터(학습 기록, 대화 내용, 통계)를 공유하게 됩니다. 연결은 언제든지 해제할 수 있습니다.
              </div>
              <button onClick={handleJoin} disabled={joining} style={{width:"100%",background:"linear-gradient(135deg,#2E75B6,#1A3A5C)",color:"white",border:"none",borderRadius:50,padding:"14px 0",fontSize:15,fontWeight:900,cursor:"pointer",opacity:joining?0.5:1,marginBottom:10}}>
                {joining ? "연결 중..." : "✅ 동의하고 클래스 참여하기"}
              </button>
              <button onClick={()=>onClose(false)} style={{width:"100%",background:"none",border:"none",color:"#bbb",fontSize:12,cursor:"pointer",padding:"6px 0"}}>
                취소
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ✅ V148: 교육과정 표준 준수 증명서 요청 컴포넌트
function CertRequestButton() {
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function handleRequest() {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("올바른 이메일 주소를 입력해 주세요");
      return;
    }
    const subject = encodeURIComponent("교육과정 표준 준수 증명서 요청");
    const body = encodeURIComponent(
      "안녕하세요,\n\n한글 친구(Hangeul Chingu) 교육과정 표준 준수 증명서를 요청합니다.\n\n요청자 이메일: " + trimmed + "\n\n감사합니다."
    );
    window.location.href = `mailto:roh053068@gmail.com?subject=${subject}&body=${body}`;
    setSent(true);
    setError("");
  }

  if (!open) return (
    <button onClick={()=>setOpen(true)} style={{display:"inline-flex",alignItems:"center",gap:8,background:"white",border:"2px solid #2E75B655",borderRadius:50,padding:"11px 22px",color:"#2E75B6",fontWeight:800,fontSize:14,boxShadow:"0 4px 16px #2E75B625",cursor:"pointer",WebkitTapHighlightColor:"transparent"}}>
      📄 교육과정 표준 준수 증명서 요청
    </button>
  );

  return (
    <div style={{width:"100%",maxWidth:360,background:"white",border:"2px solid #2E75B655",borderRadius:20,padding:"18px 20px",boxShadow:"0 4px 16px #2E75B625"}}>
      <div style={{fontSize:13,fontWeight:800,color:"#2E75B6",marginBottom:4}}>📄 교육과정 표준 준수 증명서 요청</div>
      <div style={{fontSize:12,color:"#888",marginBottom:12,lineHeight:1.6}}>요청자 이메일을 입력하면 개발자에게 요청 메일이 발송됩니다. 증명서는 이메일로 회신드립니다.</div>
      {sent ? (
        <div style={{background:"#E8F5EE",border:"1px solid #00C896",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#1E6B3C",fontWeight:600}}>
          ✅ 요청이 발송되었습니다! 이메일을 확인해 주세요.
        </div>
      ) : (<>
        <input
          value={email}
          onChange={e=>{setEmail(e.target.value);setError("");}}
          placeholder="요청자 이메일 주소"
          type="email"
          style={{width:"100%",padding:"11px 14px",borderRadius:12,border:`1.5px solid ${error?"#E53935":"#2E75B644"}`,outline:"none",fontSize:14,marginBottom:error?6:10,boxSizing:"border-box"}}
        />
        {error&&<div style={{fontSize:12,color:"#E53935",marginBottom:8}}>{error}</div>}
        <div style={{display:"flex",gap:8}}>
          <button onClick={handleRequest} style={{flex:1,background:"linear-gradient(135deg,#2E75B6,#1A3A5C)",color:"white",border:"none",borderRadius:50,padding:"11px 0",fontSize:14,fontWeight:800,cursor:"pointer"}}>
            요청 메일 보내기
          </button>
          <button onClick={()=>{setOpen(false);setEmail("");setError("");}} style={{padding:"11px 16px",background:"#f5f5f5",border:"none",borderRadius:50,fontSize:13,color:"#999",cursor:"pointer"}}>
            취소
          </button>
        </div>
      </>)}
    </div>
  );
}

async function recordStat(uid, field) {
  try {
    const ref = doc(db, "users", uid);
    await updateDoc(ref, { [`stats.${field}`]: increment(1) });
  } catch(e) { console.warn("기록 저장 실패", e); }
}

// ✅ V148: 기존 가입자 마이그레이션 팝업
function MigrationModal({ user, onComplete, onReject }) {
  const [role, setRole] = useState("learner");
  const [dataOwnershipAgreed, setDataOwnershipAgreed] = useState(false);
  const [emailAgreed, setEmailAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAgree() {
    if (!dataOwnershipAgreed) { setError("학습 데이터 소유권 귀속 및 활용 동의는 필수예요"); return; }
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid), { role, dataOwnershipAgreed: true, emailAgreed });
      onComplete();
    } catch(e) { setError("저장 중 오류가 발생했어요. 다시 시도해줘요"); }
    setLoading(false);
  }

  async function handleReject() {
    await signOut(auth);
    onReject();
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:2000,padding:24,fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
      <div style={{background:"white",borderRadius:24,width:"100%",maxWidth:380,overflow:"hidden",boxShadow:"0 16px 48px rgba(0,0,0,0.25)"}}>
        {/* 헤더 */}
        <div style={{background:`linear-gradient(135deg,${C.pink},${C.orange})`,padding:"22px 24px 18px",textAlign:"center"}}>
          <div style={{fontSize:36,marginBottom:6}}>🤝</div>
          <div style={{fontSize:17,fontWeight:900,color:"white",marginBottom:4}}>한글 친구와 함께하기 위한 약속</div>
          <div style={{fontSize:12,color:"rgba(255,255,255,0.85)"}}>상호 신뢰·상호 협조로 함께 성장해요</div>
        </div>

        {/* 본문 */}
        <div style={{padding:"20px 24px 24px"}}>
          {/* 역할 선택 */}
          <div style={{marginBottom:16}}>
            <div style={{fontSize:12,color:"#888",fontWeight:700,marginBottom:8}}>나는 한글 친구에서</div>
            <div style={{display:"flex",gap:8}}>
              {[["learner","🎓 학습자"],["instructor","👩‍🏫 교수자"]].map(([k,l])=>(
                <button key={k} onClick={()=>setRole(k)} style={{flex:1,padding:"11px 0",border:`2px solid ${role===k?C.pink:"#eee"}`,borderRadius:12,background:role===k?`${C.pink}12`:"white",color:role===k?C.pink:"#aaa",fontWeight:role===k?800:500,fontSize:13,cursor:"pointer",transition:"all .2s"}}>{l}</button>
              ))}
            </div>
          </div>

          {/* 필수 동의 */}
          <div onClick={()=>setDataOwnershipAgreed(p=>!p)} style={{display:"flex",alignItems:"flex-start",gap:10,background:dataOwnershipAgreed?"#F0FBF7":"#FAFAFA",border:`1.5px solid ${dataOwnershipAgreed?"#00C896":"#e0e0e0"}`,borderRadius:12,padding:"12px 14px",marginBottom:8,cursor:"pointer",transition:"all .2s"}}>
            <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${dataOwnershipAgreed?"#00C896":"#ccc"}`,background:dataOwnershipAgreed?"#00C896":"white",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,transition:"all .2s"}}>
              {dataOwnershipAgreed&&<span style={{color:"white",fontSize:13,fontWeight:900,lineHeight:1}}>✓</span>}
            </div>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:"#333",marginBottom:3}}>(필수) 학습 데이터 소유권 귀속 및 활용 동의</div>
              <div style={{fontSize:11,color:"#777",lineHeight:1.6}}>학습자와 나눈 모든 대화 및 학습 데이터의 소유권은 한글 친구에 귀속되며, 이는 <strong>서비스의 고도화 및 인공지능 모델 업그레이드 연구</strong>를 위해 소중하게 사용됩니다.</div>
            </div>
          </div>

          {/* 선택 동의 */}
          <div onClick={()=>setEmailAgreed(p=>!p)} style={{display:"flex",alignItems:"center",gap:10,background:emailAgreed?"#FFF8F0":"#FAFAFA",border:`1.5px solid ${emailAgreed?C.orange:"#e0e0e0"}`,borderRadius:12,padding:"11px 14px",marginBottom:16,cursor:"pointer",transition:"all .2s"}}>
            <div style={{width:20,height:20,borderRadius:6,border:`2px solid ${emailAgreed?C.orange:"#ccc"}`,background:emailAgreed?C.orange:"white",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all .2s"}}>
              {emailAgreed&&<span style={{color:"white",fontSize:13,fontWeight:900,lineHeight:1}}>✓</span>}
            </div>
            <div style={{fontSize:12,fontWeight:600,color:"#555"}}>(선택) 업데이트 소식 이메일 수신 동의</div>
          </div>

          {error&&<div style={{background:"#FFF0F0",border:"1px solid #FFCCCC",borderRadius:10,padding:"9px 14px",fontSize:13,color:"#E53935",marginBottom:12}}>{error}</div>}

          {/* 동의 버튼 */}
          <button onClick={handleAgree} disabled={loading} style={{width:"100%",background:`linear-gradient(135deg,${C.pink},${C.orange})`,color:"white",border:"none",borderRadius:50,padding:"14px 0",fontSize:15,fontWeight:900,cursor:"pointer",opacity:loading?0.5:1,marginBottom:10}}>
            {loading?"저장 중...":"동의하고 한글 친구 시작하기 🚀"}
          </button>

          {/* 거부 버튼 */}
          <button onClick={handleReject} style={{width:"100%",background:"none",border:"none",color:"#bbb",fontSize:12,cursor:"pointer",padding:"6px 0"}}>
            동의하지 않음 (앱 사용 불가, 로그아웃)
          </button>
        </div>
      </div>
    </div>
  );
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
  const [josaSelWord, setJosaSelWord] = useState(null);  // V197: 조사 선택 어휘
  const [josaShowRule, setJosaShowRule] = useState(false); // V197: 핵심 규칙 토글
  const [josaRevealMap, setJosaRevealMap] = useState({}); // V198: 조사 행별 공개 상태
  const [flipped, setFlipped] = useState({});

  // ✅ V153: 발음 테스트 state
  const [pronTestItems, setPronTestItems] = useState([]);   // 테스트할 단어 목록
  const [pronTestIdx, setPronTestIdx] = useState(0);        // 현재 문제 인덱스
  const [pronTestResults, setPronTestResults] = useState([]); // 결과 누적
  const [pronTestSTT, setPronTestSTT] = useState("");       // STT 인식 결과
  const [pronTestListening, setPronTestListening] = useState(false);
  const [pronTestFeedback, setPronTestFeedback] = useState(null); // {ok, msg, similarity}
  const [pronTestLoading, setPronTestLoading] = useState(false);
  const [pronTestFromStep, setPronTestFromStep] = useState(0); // 어느 발음 단계에서 왔는지
  const pronRecRef = useRef(null); // ✅ V153: STT 인스턴스 ref (재클릭 종료용)
  const isListeningRef = useRef(false); // ✅ V153: 클로저 문제 해결용 — state 대신 ref로 추적

  // ✅ V152: 서술어 단원 학습 + 누적 테스트 state
  const [tenseCardIdx, setTenseCardIdx] = useState(0);   // 시제 카드 인덱스
  const [tenseRevealed, setTenseRevealed] = useState(false); // 시제 정답 공개
  const [tenseTestAnswers, setTenseTestAnswers] = useState({});  // 시제 총합 테스트 입력값
  const [tenseTestResult, setTenseTestResult] = useState(null);  // 시제 총합 테스트 결과
  const [tenseInputs, setTenseInputs] = useState({});     // 시제 입력값 {pres,presQ,past,pastQ,fut,futQ}
  const [unitCardIdx, setUnitCardIdx] = useState(0);   // 학습 카드 인덱스
  const [unitCardInput, setUnitCardInput] = useState(""); // 카드 타이핑 입력값
  const [unitCardRevealed, setUnitCardRevealed] = useState(false); // 정답 공개 여부
  const [testQuestions, setTestQuestions] = useState([]); // AI 생성 문제 (서술어 테스트용)
  const [testAnswers, setTestAnswers] = useState({});     // 학습자 답변 (서술어 테스트용)
  const [testResult, setTestResult] = useState(null);    // {passed, score, feedback} (서술어 테스트용)
  const [testLoading, setTestLoading] = useState(false); // (서술어 테스트용)
  // ✅ V155: 조사 테스트 전용 상태 (서술어 테스트와 완전 분리)
  const [josaTestQuestions, setJosaTestQuestions] = useState([]);
  const [josaTestAnswers, setJosaTestAnswers] = useState({});
  const [josaTestResult, setJosaTestResult] = useState(null);
  const [josaTestLoading, setJosaTestLoading] = useState(false);
  // ✅ V154: 조사 STT state
  const [josaListeningKey, setJosaListeningKey] = useState(null);
  const [josaSTTMap, setJosaSTTMap] = useState({});
  const [unitsPassed, setUnitsPassed] = useState(() => {
    // Firestore에서 불러오기 (초기값은 localStorage 캐시 사용)
    try { return JSON.parse(localStorage.getItem(`hc_units_${user?.uid}`) || "[]"); }
    catch { return []; }
  });

  // ✅ V164: test1 — API 제거, UNIT1_CARDS 기반 고정 10문제
  useEffect(() => {
    if (step !== "test1" || testQuestions.length > 0) return;
    const FIXED_QUESTIONS = [
      {id:1,  sentence:"저는 학생___.",              answers:["입니다"],      hint:"학생 → 받침 있어요 → 입니다"},
      {id:2,  sentence:"여기는 학교___.",             answers:["입니다"],      hint:"학교 → 받침 없어요 → 입니다"},
      {id:3,  sentence:"이분은 선생님___.",            answers:["이세요"],      hint:"이분 = 높여 부르는 말 → ??"},
      {id:4,  sentence:"오늘은 월요일___.",            answers:["입니다"],      hint:"월요일 → 받침 있어요 → 입니다"},
      {id:5,  sentence:"저는 베트남 사람___.",         answers:["입니다"],      hint:"사람 → 받침 있어요 → 입니다"},
      {id:6,  sentence:"이것은 가방___.",              answers:["입니다"],      hint:"가방 → 받침 있어요 → 입니다"},
      {id:7,  sentence:"선생님___ 교실에 있습니다.",   answers:["은","이"],     hint:"선생님 → 받침 있어요 → ??"},
      {id:8,  sentence:"친구___ 공원에 갑니다.",       answers:["와","는","가"], hint:"친구 → 받침 없어요 → ??"},
      {id:9,  sentence:"새로 오신 분이 ___입니까?",    answers:["누구"],        hint:"사람을 물어볼 때 → ??"},
      {id:10, sentence:"무엇을 먹습니까?",              answers:["무엇을","뭐"], hint:"사물을 물어볼 때 → ??"},
    ];
    setTestQuestions(FIXED_QUESTIONS);
    setTestLoading(false);
  }, [step]);

  // ✅ V153: 개발자 전용 단계 점프 (csyager@hanmail.net 만 표시)
  const isDev = user?.email === DEV_EMAIL;
  function DevJumpPanel() {
    if (!isDev) return null;
    const jumps = [
      { label:"발음①", action:()=>{ setPronStep(0); setStep("pronunciation"); }},
      { label:"발음⑧", action:()=>{ setPronStep(7); setStep("pronunciation"); }},
      { label:"시제1",  action:()=>{ setTenseCardIdx(0); setTenseRevealed(false); setTenseInputs({}); setStep("tense1"); }},
      { label:"시제2",  action:()=>{ setTenseCardIdx(0); setTenseRevealed(false); setTenseInputs({}); setStep("tense2"); }},
      { label:"시제3",  action:()=>{ setTenseCardIdx(0); setTenseRevealed(false); setStep("tense3"); }},
      { label:"시제4",  action:()=>{ setTenseCardIdx(0); setTenseRevealed(false); setStep("tense4"); }},
      { label:"시제5",  action:()=>{ setTenseCardIdx(0); setTenseRevealed(false); setStep("tense5"); }},
      { label:"시제6",  action:()=>{ setTenseCardIdx(0); setTenseRevealed(false); setStep("tense6"); }},
      { label:"시제테스트",action:()=>{ setStep("tenseTest"); }},
      { label:"조사",   action:()=>{ setJosaStep(0); setStep("josa"); }},
      { label:"서술어1A",action:()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit1"); }},
      { label:"서술어1B",action:()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit1b"); }},
      { label:"테스트1",action:()=>{ setTestAnswers({}); setTestResult(null); setTestQuestions([]); setTestLoading(true); setStep("test1"); }},
      { label:"조사테스트",action:()=>{ setJosaTestAnswers({}); setJosaTestResult(null); setJosaTestQuestions([]); setJosaTestLoading(false); setJosaSTTMap({}); setJosaListeningKey(null); setStep("testJosa"); }},
      { label:"서술어2A",action:()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit2"); }},
      { label:"서술어2B",action:()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit2b"); }},
      { label:"테스트2",action:()=>{ setTestAnswers({}); setTestResult(null); setTestQuestions([]); setStep("test2"); }},
      { label:"서술어3A",action:()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit3"); }},
      { label:"서술어3B",action:()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit3b"); }},
      { label:"테스트3",action:()=>{ setTestAnswers({}); setTestResult(null); setTestQuestions([]); setStep("test3"); }},
      { label:"서술어4",action:()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit4"); }},
      { label:"테스트4",action:()=>{ setTestAnswers({}); setTestResult(null); setTestQuestions([]); setStep("test4"); }},
      { label:"서술어5",action:()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit5"); }},
      { label:"서술어6A",action:()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit6a"); }},
      { label:"서술어6B",action:()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit6b"); }},
      { label:"서술어6C",action:()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit6c"); }},
      { label:"테스트5",action:()=>{ setTestAnswers({}); setTestResult(null); setTestQuestions([]); setStep("test5"); }},
      { label:"테스트6",action:()=>{ setTestAnswers({}); setTestResult(null); setTestQuestions([]); setStep("test6"); }},
      { label:"서술어7",action:()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit7"); }},
      { label:"테스트7",action:()=>{ setTestAnswers({}); setTestResult(null); setTestQuestions([]); setStep("test7"); }},
      { label:"서술어8",action:()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit8"); }},
      { label:"테스트8",action:()=>{ setTestAnswers({}); setTestResult(null); setTestQuestions([]); setStep("test8"); }},
      { label:"서술어9",action:()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit9"); }},
      { label:"테스트9",action:()=>{ setTestAnswers({}); setTestResult(null); setTestQuestions([]); setStep("test9"); }},
      { label:"서술어10",action:()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit10"); }},
      { label:"테스트10",action:()=>{ setTestAnswers({}); setTestResult(null); setTestQuestions([]); setStep("test10"); }},
      { label:"서술어11",action:()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit11"); }},
      { label:"테스트11",action:()=>{ setTestAnswers({}); setTestResult(null); setTestQuestions([]); setStep("test11"); }},
      { label:"서술어12",action:()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit12"); }},
      { label:"테스트12",action:()=>{ setTestAnswers({}); setTestResult(null); setTestQuestions([]); setStep("test12"); }},
      { label:"서술어13",action:()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit13"); }},
      { label:"테스트13",action:()=>{ setTestAnswers({}); setTestResult(null); setTestQuestions([]); setStep("test13"); }},
      { label:"마중이", action:()=>{ onReady?.(); setStep("learn"); }},
    ];
    return (
      <div style={{position:"fixed", bottom:16, right:16, zIndex:9999,
        background:"#1A1A2E", borderRadius:16, padding:"10px 14px",
        boxShadow:"0 4px 20px rgba(0,0,0,.5)", maxWidth:320}}>
        <div style={{fontSize:10, color:"#FF6B6B", fontWeight:800, marginBottom:8, letterSpacing:1}}>
          🔧 DEV ONLY
        </div>
        <div style={{display:"flex", flexWrap:"wrap", gap:6}}>
          {jumps.map((s,i)=>(
            <button key={i} onClick={s.action} style={{
              background:"#2D2D44", color:"#A8E6CF", border:"1px solid #3D3D5C",
              borderRadius:8, padding:"5px 10px", fontSize:11, fontWeight:700,
              cursor:"pointer", whiteSpace:"nowrap"}}>
              {s.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

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
- 동사+는/ㄴ/ㄹ + 명사: "지금 먹는 음식이 뭐예요?" / "어제 만난 친구예요?" / "내일 할 일이 있어요?"
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
      // ── 단계 1: 모음1 학습 ──
      { id:"vowel1", type:"learn", emoji:"🔤",
        title:"01. 기본 모음",
        desc:"한국어 기본 모음 10개의 소리와 형태를 익히고 소리 내어 말합니다.",
        items:[
          { char:"ㅏ", word:"아버지", meaning:{ko:"아버지",vi:"bố",zh:"父亲",en:"father",ja:"お父さん",id:"ayah",ru:"отец",th:"พ่อ",mn:"аав",uz:"ota"} },
          { char:"ㅑ", word:"야채",   meaning:{ko:"야채",  vi:"rau củ",zh:"蔬菜",en:"vegetable",ja:"野菜",id:"sayuran",ru:"овощи",th:"ผัก",mn:"ногоо",uz:"sabzavot"} },
          { char:"ㅓ", word:"어머니", meaning:{ko:"어머니",vi:"mẹ",zh:"母亲",en:"mother",ja:"お母さん",id:"ibu",ru:"мать",th:"แม่",mn:"ээж",uz:"ona"} },
          { char:"ㅕ", word:"여자",   meaning:{ko:"여자",  vi:"phụ nữ",zh:"女子",en:"woman",ja:"女性",id:"wanita",ru:"женщина",th:"ผู้หญิง",mn:"эмэгтэй",uz:"ayol"} },
          { char:"ㅗ", word:"오빠",   meaning:{ko:"오빠",  vi:"anh trai",zh:"哥哥",en:"older brother",ja:"お兄さん",id:"kakak laki-laki",ru:"старший брат",th:"พี่ชาย",mn:"ах",uz:"aka"} },
          { char:"ㅛ", word:"요리",   meaning:{ko:"요리",  vi:"nấu ăn",zh:"料理",en:"cooking",ja:"料理",id:"memasak",ru:"приготовление пищи",th:"การทำอาหาร",mn:"хоол хийх",uz:"ovqat pishirish"} },
          { char:"ㅜ", word:"우리",   meaning:{ko:"우리",  vi:"chúng ta",zh:"我们",en:"we/us",ja:"私たち",id:"kita",ru:"мы",th:"เรา",mn:"бид",uz:"biz"} },
          { char:"ㅠ", word:"유리",   meaning:{ko:"유리",  vi:"thủy tinh",zh:"玻璃",en:"glass",ja:"ガラス",id:"kaca",ru:"стекло",th:"กระจก",mn:"шил",uz:"shisha"} },
          { char:"ㅡ", word:"음식",   meaning:{ko:"음식",  vi:"thức ăn",zh:"食物",en:"food",ja:"食べ物",id:"makanan",ru:"еда",th:"อาหาร",mn:"хоол",uz:"ovqat"} },
          { char:"ㅣ", word:"이름",   meaning:{ko:"이름",  vi:"tên",zh:"名字",en:"name",ja:"名前",id:"nama",ru:"имя",th:"ชื่อ",mn:"нэр",uz:"ism"} },
        ],
        tip:"입 모양과 소리의 패턴을 여러 번 듣고 소리 내어 암송하십시오."
      },
      // ── 단계 2: 모음 쓰기 ──
      { id:"vowel1_write", type:"write", emoji:"✏️",
        title:"02. 모음 쓰기",
        desc:"기본 모음 10개를 순서에 맞게 써봅니다.",
        writeTask:"ㅏ ㅑ ㅓ ㅕ ㅗ ㅛ ㅜ ㅠ ㅡ ㅣ 를 각각 5번씩 써서 사진으로 제출하세요.",
        items:[
          { char:"ㅏ" }, { char:"ㅑ" }, { char:"ㅓ" }, { char:"ㅕ" },
          { char:"ㅗ" }, { char:"ㅛ" }, { char:"ㅜ" }, { char:"ㅠ" },
          { char:"ㅡ" }, { char:"ㅣ" },
        ],
        tip:"획순을 지켜서 천천히 써보세요. 80% 이상 정확하면 다음 단계로 넘어갑니다."
      },
      // ── 단계 3: 모음1 단어 ──
      { id:"vowel1_word", type:"learn", emoji:"📖",
        title:"03. 모음1 단어",
        desc:"배운 모음이 들어간 실생활 단어를 읽고 뜻을 익힙니다. (놀라운 한국어 기준 120% 이상)",
        items:[
          // ── 가족 (6개) ──
          { char:"어머니", word:"어머니", meaning:{ko:"어머니",vi:"mẹ",zh:"母亲",en:"mother",ja:"お母さん",id:"ibu",ru:"мать",th:"แม่",mn:"ээж",uz:"ona"} },
          { char:"아버지", word:"아버지", meaning:{ko:"아버지",vi:"bố",zh:"父亲",en:"father",ja:"お父さん",id:"ayah",ru:"отец",th:"พ่อ",mn:"аав",uz:"ota"} },
          { char:"누나",   word:"누나",   meaning:{ko:"누나",  vi:"chị gái",zh:"姐姐",en:"older sister",ja:"お姉さん",id:"kakak perempuan",ru:"старшая сестра",th:"พี่สาว",mn:"эгч",uz:"opa"} },
          { char:"아가",   word:"아가",   meaning:{ko:"아가",  vi:"em bé",zh:"婴儿",en:"baby",ja:"赤ちゃん",id:"bayi",ru:"малыш",th:"ทารก",mn:"нялх хүүхэд",uz:"chaqaloq"} },
          { char:"아이",   word:"아이",   meaning:{ko:"아이",  vi:"trẻ em",zh:"孩子",en:"child",ja:"子供",id:"anak",ru:"ребёнок",th:"เด็ก",mn:"хүүхэд",uz:"bola"} },
          { char:"여자",   word:"여자",   meaning:{ko:"여자",  vi:"phụ nữ",zh:"女子",en:"woman",ja:"女性",id:"wanita",ru:"женщина",th:"ผู้หญิง",mn:"эмэгтэй",uz:"ayol"} },
          // ── 직업 (4개) ──
          { char:"의사",   word:"의사",   meaning:{ko:"의사",  vi:"bác sĩ",zh:"医生",en:"doctor",ja:"医者",id:"dokter",ru:"врач",th:"หมอ",mn:"эмч",uz:"shifokor"} },
          { char:"가수",   word:"가수",   meaning:{ko:"가수",  vi:"ca sĩ",zh:"歌手",en:"singer",ja:"歌手",id:"penyanyi",ru:"певец",th:"นักร้อง",mn:"дуучин",uz:"qo'shiqchi"} },
          { char:"기자",   word:"기자",   meaning:{ko:"기자",  vi:"phóng viên",zh:"记者",en:"reporter",ja:"記者",id:"jurnalis",ru:"журналист",th:"นักข่าว",mn:"сэтгүүлч",uz:"jurnalist"} },
          { char:"교수",   word:"교수",   meaning:{ko:"교수",  vi:"giáo sư",zh:"教授",en:"professor",ja:"教授",id:"profesor",ru:"профессор",th:"ศาสตราจารย์",mn:"профессор",uz:"professor"} },
          // ── 시간·일상 (4개) ──
          { char:"오후",   word:"오후",   meaning:{ko:"오후",  vi:"buổi chiều",zh:"下午",en:"afternoon",ja:"午後",id:"sore",ru:"послеполудень",th:"บ่าย",mn:"үд хойно",uz:"tushdan keyin"} },
          { char:"하루",   word:"하루",   meaning:{ko:"하루",  vi:"một ngày",zh:"一天",en:"one day",ja:"一日",id:"satu hari",ru:"один день",th:"หนึ่งวัน",mn:"нэг өдөр",uz:"bir kun"} },
          { char:"휴가",   word:"휴가",   meaning:{ko:"휴가",  vi:"kỳ nghỉ",zh:"休假",en:"vacation",ja:"休暇",id:"liburan",ru:"отпуск",th:"วันหยุด",mn:"амралт",uz:"ta'til"} },
          { char:"자주",   word:"자주",   meaning:{ko:"자주",  vi:"thường xuyên",zh:"经常",en:"often",ja:"よく",id:"sering",ru:"часто",th:"บ่อยๆ",mn:"байнга",uz:"tez-tez"} },
          // ── 장소·주거 (5개) ──
          { char:"도시",   word:"도시",   meaning:{ko:"도시",  vi:"thành phố",zh:"都市",en:"city",ja:"都市",id:"kota",ru:"город",th:"เมือง",mn:"хот",uz:"shahar"} },
          { char:"아파트", word:"아파트", meaning:{ko:"아파트",vi:"căn hộ",zh:"公寓",en:"apartment",ja:"アパート",id:"apartemen",ru:"квартира",th:"อพาร์ตเมนต์",mn:"орон сууц",uz:"kvartira"} },
          { char:"주소",   word:"주소",   meaning:{ko:"주소",  vi:"địa chỉ",zh:"地址",en:"address",ja:"住所",id:"alamat",ru:"адрес",th:"ที่อยู่",mn:"хаяг",uz:"manzil"} },
          { char:"가구",   word:"가구",   meaning:{ko:"가구",  vi:"đồ nội thất",zh:"家具",en:"furniture",ja:"家具",id:"furnitur",ru:"мебель",th:"เฟอร์นิเจอร์",mn:"тавилга",uz:"mebel"} },
          { char:"비누",   word:"비누",   meaning:{ko:"비누",  vi:"xà phòng",zh:"肥皂",en:"soap",ja:"石鹸",id:"sabun",ru:"мыло",th:"สบู่",mn:"саван",uz:"sovun"} },
          // ── 의류 (5개) ──
          { char:"치마",   word:"치마",   meaning:{ko:"치마",  vi:"váy",zh:"裙子",en:"skirt",ja:"スカート",id:"rok",ru:"юбка",th:"กระโปรง",mn:"банзал",uz:"yubka"} },
          { char:"바지",   word:"바지",   meaning:{ko:"바지",  vi:"quần",zh:"裤子",en:"pants",ja:"ズボン",id:"celana",ru:"брюки",th:"กางเกง",mn:"өмд",uz:"shim"} },
          { char:"구두",   word:"구두",   meaning:{ko:"구두",  vi:"giày",zh:"皮鞋",en:"shoes",ja:"靴",id:"sepatu",ru:"туфли",th:"รองเท้า",mn:"гутал",uz:"tufli"} },
          { char:"모자",   word:"모자",   meaning:{ko:"모자",  vi:"mũ",zh:"帽子",en:"hat",ja:"帽子",id:"topi",ru:"шапка",th:"หมวก",mn:"малгай",uz:"shapka"} },
          { char:"우표",   word:"우표",   meaning:{ko:"우표",  vi:"tem thư",zh:"邮票",en:"stamp",ja:"切手",id:"perangko",ru:"марка",th:"แสตมป์",mn:"марк",uz:"marka"} },
          // ── 신체 (8개) ──
          { char:"머리",   word:"머리",   meaning:{ko:"머리",  vi:"đầu",zh:"头",en:"head",ja:"頭",id:"kepala",ru:"голова",th:"หัว",mn:"толгой",uz:"bosh"} },
          { char:"이마",   word:"이마",   meaning:{ko:"이마",  vi:"trán",zh:"额头",en:"forehead",ja:"額",id:"dahi",ru:"лоб",th:"หน้าผาก",mn:"дух",uz:"peshona"} },
          { char:"코",     word:"코",     meaning:{ko:"코",    vi:"mũi",zh:"鼻子",en:"nose",ja:"鼻",id:"hidung",ru:"нос",th:"จมูก",mn:"хамар",uz:"burun"} },
          { char:"허리",   word:"허리",   meaning:{ko:"허리",  vi:"eo",zh:"腰",en:"waist",ja:"腰",id:"pinggang",ru:"талия",th:"เอว",mn:"бүсэлхий",uz:"bel"} },
          { char:"다리",   word:"다리",   meaning:{ko:"다리",  vi:"chân",zh:"腿",en:"leg",ja:"足",id:"kaki",ru:"нога",th:"ขา",mn:"хөл",uz:"oyoq"} },
          { char:"혀",     word:"혀",     meaning:{ko:"혀",    vi:"lưỡi",zh:"舌头",en:"tongue",ja:"舌",id:"lidah",ru:"язык",th:"ลิ้น",mn:"хэл",uz:"til"} },
          { char:"키",     word:"키",     meaning:{ko:"키",    vi:"chiều cao",zh:"身高",en:"height",ja:"身長",id:"tinggi",ru:"рост",th:"ส่วนสูง",mn:"өндөр",uz:"bo'y"} },
          { char:"이",     word:"이",     meaning:{ko:"이",    vi:"răng",zh:"牙齿",en:"tooth",ja:"歯",id:"gigi",ru:"зуб",th:"ฟัน",mn:"шүд",uz:"tish"} },
          // ── 음식·음료 (10개) ──
          { char:"피자",   word:"피자",   meaning:{ko:"피자",  vi:"pizza",zh:"披萨",en:"pizza",ja:"ピザ",id:"pizza",ru:"пицца",th:"พิซซ่า",mn:"пицца",uz:"pitsa"} },
          { char:"소고기", word:"소고기", meaning:{ko:"소고기",vi:"thịt bò",zh:"牛肉",en:"beef",ja:"牛肉",id:"daging sapi",ru:"говядина",th:"เนื้อวัว",mn:"үхрийн мах",uz:"mol go'shti"} },
          { char:"오이",   word:"오이",   meaning:{ko:"오이",  vi:"dưa chuột",zh:"黄瓜",en:"cucumber",ja:"きゅうり",id:"mentimun",ru:"огурец",th:"แตงกวา",mn:"өргөст хэмх",uz:"bodring"} },
          { char:"고구마", word:"고구마", meaning:{ko:"고구마",vi:"khoai lang",zh:"地瓜",en:"sweet potato",ja:"サツマイモ",id:"ubi jalar",ru:"батат",th:"มันเทศ",mn:"батат",uz:"battat"} },
          { char:"두부",   word:"두부",   meaning:{ko:"두부",  vi:"đậu phụ",zh:"豆腐",en:"tofu",ja:"豆腐",id:"tahu",ru:"тофу",th:"เต้าหู้",mn:"тофу",uz:"tofu"} },
          { char:"포도",   word:"포도",   meaning:{ko:"포도",  vi:"nho",zh:"葡萄",en:"grape",ja:"ブドウ",id:"anggur",ru:"виноград",th:"องุ่น",mn:"усан үзэм",uz:"uzum"} },
          { char:"바나나", word:"바나나", meaning:{ko:"바나나",vi:"chuối",zh:"香蕉",en:"banana",ja:"バナナ",id:"pisang",ru:"банан",th:"กล้วย",mn:"банан",uz:"banan"} },
          { char:"우유",   word:"우유",   meaning:{ko:"우유",  vi:"sữa",zh:"牛奶",en:"milk",ja:"牛乳",id:"susu",ru:"молоко",th:"นม",mn:"сүү",uz:"sut"} },
          { char:"주스",   word:"주스",   meaning:{ko:"주스",  vi:"nước trái cây",zh:"果汁",en:"juice",ja:"ジュース",id:"jus",ru:"сок",th:"น้ำผลไม้",mn:"шүүс",uz:"sharbat"} },
          { char:"커피",   word:"커피",   meaning:{ko:"커피",  vi:"cà phê",zh:"咖啡",en:"coffee",ja:"コーヒー",id:"kopi",ru:"кофе",th:"กาแฟ",mn:"кофе",uz:"qahva"} },
          // ── 교통·기기 (5개) ──
          { char:"버스",   word:"버스",   meaning:{ko:"버스",  vi:"xe buýt",zh:"巴士",en:"bus",ja:"バス",id:"bus",ru:"автобус",th:"รถบัส",mn:"автобус",uz:"avtobus"} },
          { char:"오토바이",word:"오토바이",meaning:{ko:"오토바이",vi:"xe máy",zh:"摩托车",en:"motorcycle",ja:"バイク",id:"motor",ru:"мотоцикл",th:"มอเตอร์ไซค์",mn:"мотоцикл",uz:"mototsikl"} },
          { char:"라디오", word:"라디오", meaning:{ko:"라디오",vi:"đài phát thanh",zh:"收音机",en:"radio",ja:"ラジオ",id:"radio",ru:"радио",th:"วิทยุ",mn:"радио",uz:"radio"} },
          { char:"키보드", word:"키보드", meaning:{ko:"키보드",vi:"bàn phím",zh:"键盘",en:"keyboard",ja:"キーボード",id:"keyboard",ru:"клавиатура",th:"คีย์บอร์ด",mn:"гар",uz:"klaviatura"} },
          { char:"마우스", word:"마우스", meaning:{ko:"마우스",vi:"chuột máy tính",zh:"鼠标",en:"mouse",ja:"マウス",id:"mouse",ru:"мышка",th:"เมาส์",mn:"хулгана",uz:"sichqoncha"} },
        ],
        tip:"단어의 뜻을 이해한 채로 소리 내어 읽으면 기억에 훨씬 오래 남습니다. 놀라운 한국어 모음1 단어 전체 반영!"
      },

      // ── 단계 4: 모음2 학습 ──
      { id:"vowel2", type:"learn", emoji:"🔤",
        title:"04. 복합 모음",
        desc:"두 모음이 합쳐진 복합 모음의 소리를 익힙니다.",
        items:[
          { char:"ㅘ", word:"화요일", meaning:{ko:"화요일",vi:"thứ ba",zh:"星期二",en:"Tuesday",ja:"火曜日",id:"Selasa",ru:"вторник",th:"วันอังคาร",mn:"мягмар",uz:"seshanba"} },
          { char:"ㅙ", word:"왜",     meaning:{ko:"왜",    vi:"tại sao",zh:"为什么",en:"why",ja:"なぜ",id:"mengapa",ru:"почему",th:"ทำไม",mn:"яагаад",uz:"nima uchun"} },
          { char:"ㅚ", word:"최고",   meaning:{ko:"최고",  vi:"tốt nhất",zh:"最好",en:"the best",ja:"最高",id:"terbaik",ru:"лучший",th:"ดีที่สุด",mn:"хамгийн сайн",uz:"eng yaxshi"} },
          { char:"ㅝ", word:"원하다", meaning:{ko:"원하다",vi:"muốn",zh:"想要",en:"to want",ja:"欲しい",id:"ingin",ru:"хотеть",th:"ต้องการ",mn:"хүсэх",uz:"xohlamoq"} },
          { char:"ㅞ", word:"웨이터", meaning:{ko:"웨이터",vi:"bồi bàn",zh:"服务生",en:"waiter",ja:"ウェイター",id:"pelayan",ru:"официант",th:"บริกร",mn:"зөөгч",uz:"ofitsiant"} },
          { char:"ㅟ", word:"위험",   meaning:{ko:"위험",  vi:"nguy hiểm",zh:"危险",en:"danger",ja:"危険",id:"bahaya",ru:"опасность",th:"อันตราย",mn:"аюул",uz:"xavf"} },
          { char:"ㅢ", word:"의사",   meaning:{ko:"의사",  vi:"bác sĩ",zh:"医生",en:"doctor",ja:"医者",id:"dokter",ru:"врач",th:"หมอ",mn:"эмч",uz:"shifokor"} },
        ],
        tip:"복합 모음은 두 소리가 부드럽게 하나로 합쳐지는 소리입니다."
      },
      // ── 단계 5: 모음2 쓰기 ──
      { id:"vowel2_write", type:"write", emoji:"✏️",
        title:"05. 복합 모음 쓰기",
        desc:"복합 모음 7개를 써봅니다.",
        writeTask:"ㅘ ㅙ ㅚ ㅝ ㅞ ㅟ ㅢ 를 각각 5번씩 써서 사진으로 제출하세요.",
        items:[
          { char:"ㅘ" }, { char:"ㅙ" }, { char:"ㅚ" },
          { char:"ㅝ" }, { char:"ㅞ" }, { char:"ㅟ" }, { char:"ㅢ" },
        ],
        tip:"두 모음이 합쳐진 모양을 천천히 따라 써보세요."
      },
      // ── 단계 6: 모음2 단어 ──
      { id:"vowel2_word", type:"learn", emoji:"📖",
        title:"06. 복합 모음 단어",
        desc:"복합 모음이 들어간 실생활 단어를 익힙니다.",
        items:[
          { char:"회사", word:"회사",  meaning:{ko:"회사",  vi:"công ty",zh:"公司",en:"company",ja:"会社",id:"perusahaan",ru:"компания",th:"บริษัท",mn:"компани",uz:"kompaniya"} },
          { char:"회의", word:"회의",  meaning:{ko:"회의",  vi:"cuộc họp",zh:"会议",en:"meeting",ja:"会議",id:"rapat",ru:"собрание",th:"การประชุม",mn:"хурал",uz:"yig'ilish"} },
          { char:"카페", word:"카페",  meaning:{ko:"카페",  vi:"quán cà phê",zh:"咖啡厅",en:"cafe",ja:"カフェ",id:"kafe",ru:"кафе",th:"คาเฟ่",mn:"кафе",uz:"kafe"} },
          { char:"의자", word:"의자",  meaning:{ko:"의자",  vi:"ghế",zh:"椅子",en:"chair",ja:"椅子",id:"kursi",ru:"стул",th:"เก้าอี้",mn:"сандал",uz:"stul"} },
          { char:"시계", word:"시계",  meaning:{ko:"시계",  vi:"đồng hồ",zh:"手表",en:"watch/clock",ja:"時計",id:"jam",ru:"часы",th:"นาฬิกา",mn:"цаг",uz:"soat"} },
          { char:"카메라",word:"카메라",meaning:{ko:"카메라",vi:"máy ảnh",zh:"相机",en:"camera",ja:"カメラ",id:"kamera",ru:"камера",th:"กล้อง",mn:"камер",uz:"kamera"} },
          { char:"샤워", word:"샤워",  meaning:{ko:"샤워",  vi:"tắm vòi sen",zh:"淋浴",en:"shower",ja:"シャワー",id:"mandi",ru:"душ",th:"อาบน้ำฝักบัว",mn:"шүршүүр",uz:"dush"} },
          { char:"사과", word:"사과",  meaning:{ko:"사과",  vi:"táo",zh:"苹果",en:"apple",ja:"りんご",id:"apel",ru:"яблоко",th:"แอปเปิ้ล",mn:"алим",uz:"olma"} },
          { char:"야채", word:"야채",  meaning:{ko:"야채",  vi:"rau",zh:"蔬菜",en:"vegetable",ja:"野菜",en:"vegetable",id:"sayuran",ru:"овощи",th:"ผัก",mn:"ногоо",uz:"sabzavot"} },
          { char:"배추", word:"배추",  meaning:{ko:"배추",  vi:"cải thảo",zh:"白菜",en:"cabbage",ja:"白菜",id:"sawi putih",ru:"пекинская капуста",th:"กะหล่ำปลีจีน",mn:"Хятад байцаа",uz:"xitoy karam"} },
          { char:"귀",   word:"귀",    meaning:{ko:"귀",    vi:"tai",zh:"耳朵",en:"ear",ja:"耳",id:"telinga",ru:"ухо",th:"หู",mn:"чих",uz:"quloq"} },
          { char:"어제", word:"어제",  meaning:{ko:"어제",  vi:"hôm qua",zh:"昨天",en:"yesterday",ja:"昨日",id:"kemarin",ru:"вчера",th:"เมื่อวาน",mn:"өчигдөр",uz:"kecha"} },
        ],
        tip:"단어를 보면서 뜻을 확인하고, 소리 내어 3번씩 말해보세요."
      },
      // ── 단계 7: 쌍자음 학습 ──
      { id:"ssang", type:"learn", emoji:"💪",
        title:"07. 쌍자음",
        desc:"된소리(긴장음) 쌍자음 5개의 발음을 연습합니다.",
        items:[
          { char:"ㄲ", word:"까치",   meaning:{ko:"까치",  vi:"chim ác là",zh:"喜鹊",en:"magpie",ja:"カチ",id:"burung murai",ru:"сорока",th:"นกสาลิกา",mn:"шаазгай",uz:"urriq"} },
          { char:"ㄸ", word:"딸기",   meaning:{ko:"딸기",  vi:"dâu tây",zh:"草莓",en:"strawberry",ja:"いちご",id:"stroberi",ru:"клубника",th:"สตรอเบอร์รี่",mn:"гүзээлзгэнэ",uz:"qulupnay"} },
          { char:"ㅃ", word:"빠르다", meaning:{ko:"빠르다",vi:"nhanh",zh:"快速",en:"fast",ja:"速い",id:"cepat",ru:"быстрый",th:"เร็ว",mn:"хурдан",uz:"tez"} },
          { char:"ㅆ", word:"씩씩하다",meaning:{ko:"씩씩하다",vi:"dũng cảm",zh:"勇敢",en:"brave",ja:"勇ましい",id:"berani",ru:"смелый",th:"กล้าหาญ",mn:"зоригтой",uz:"jasur"} },
          { char:"ㅉ", word:"짜다",   meaning:{ko:"짜다",  vi:"mặn",zh:"咸",en:"salty",ja:"塩辛い",id:"asin",ru:"солёный",th:"เค็ม",mn:"давслаг",uz:"sho'r"} },
        ],
        tip:"목에 살짝 힘을 주어 소리를 강하게 밀어내며 말해보세요."
      },
      // ── 단계 8: 쌍자음 쓰기 ──
      { id:"ssang_write", type:"write", emoji:"✏️",
        title:"08. 쌍자음 쓰기",
        desc:"쌍자음 5개를 써봅니다.",
        writeTask:"ㄲ ㄸ ㅃ ㅆ ㅉ 를 각각 5번씩 써서 사진으로 제출하세요.",
        items:[
          { char:"ㄲ" }, { char:"ㄸ" }, { char:"ㅃ" }, { char:"ㅆ" }, { char:"ㅉ" },
        ],
        tip:"같은 자음을 두 번 겹쳐 쓰는 모양입니다. 획순에 맞게 써보세요."
      },
      // ── 단계 9: 쌍자음 단어 ──
      { id:"ssang_word", type:"learn", emoji:"📖",
        title:"09. 쌍자음 단어",
        desc:"쌍자음이 들어간 실생활 단어를 익힙니다.",
        items:[
          { char:"오빠", word:"오빠",  meaning:{ko:"오빠",  vi:"anh trai (em gái gọi)",zh:"哥哥",en:"older brother",ja:"お兄さん",id:"kakak laki-laki",ru:"старший брат",th:"พี่ชาย",mn:"ах",uz:"aka"} },
          { char:"아빠", word:"아빠",  meaning:{ko:"아빠",  vi:"bố",zh:"爸爸",en:"dad",ja:"パパ",id:"ayah",ru:"папа",th:"พ่อ",mn:"аав",uz:"dada"} },
          { char:"토끼", word:"토끼",  meaning:{ko:"토끼",  vi:"con thỏ",zh:"兔子",en:"rabbit",ja:"ウサギ",id:"kelinci",ru:"кролик",th:"กระต่าย",mn:"туулай",uz:"quyon"} },
          { char:"코끼리",word:"코끼리",meaning:{ko:"코끼리",vi:"con voi",zh:"大象",en:"elephant",ja:"ゾウ",id:"gajah",ru:"слон",th:"ช้าง",mn:"заан",uz:"fil"} },
          { char:"찌개", word:"찌개",  meaning:{ko:"찌개",  vi:"canh hầm",zh:"炖菜",en:"stew",ja:"チゲ",id:"sup rebus",ru:"чигэ",th:"ซุปเกาหลี",mn:"шөл",uz:"qozon osh"} },
          { char:"예쁘다",word:"예쁘다",meaning:{ko:"예쁘다",vi:"xinh đẹp",zh:"漂亮",en:"pretty",ja:"きれいだ",id:"cantik",ru:"красивый",th:"สวยงาม",mn:"үзэсгэлэнтэй",uz:"chiroyli"} },
          { char:"바쁘다",word:"바쁘다",meaning:{ko:"바쁘다",vi:"bận rộn",zh:"忙",en:"busy",ja:"忙しい",id:"sibuk",ru:"занятый",th:"ยุ่ง",mn:"завгүй",uz:"band"} },
          { char:"싸다", word:"싸다",  meaning:{ko:"싸다",  vi:"rẻ",zh:"便宜",en:"cheap",ja:"安い",id:"murah",ru:"дешёвый",th:"ถูก",mn:"хямд",uz:"arzon"} },
          { char:"비싸다",word:"비싸다",meaning:{ko:"비싸다",vi:"đắt",zh:"贵",en:"expensive",ja:"高い",id:"mahal",ru:"дорогой",th:"แพง",mn:"үнэтэй",uz:"qimmat"} },
          { char:"기쁘다",word:"기쁘다",meaning:{ko:"기쁘다",vi:"vui vẻ",zh:"高兴",en:"glad/happy",ja:"嬉しい",id:"gembira",ru:"радостный",th:"ดีใจ",mn:"баяртай",uz:"xursand"} },
        ],
        tip:"쌍자음이 들어간 단어는 강하고 힘찬 소리가 납니다. 과감하게 발음해보세요."
      },
      // ── 단계 10: 받침 ㄱ·ㄲ·ㅋ ──
      { id:"batchim_gk", type:"learn", emoji:"🧱",
        title:"10. 받침 [ㄱ·ㄲ·ㅋ]",
        desc:"교육·장소·음식 관련 어휘로 ㄱ계열 받침을 익힙니다.",
        items:[
          { char:"국",    word:"국",    meaning:{ko:"국",    vi:"canh",zh:"汤",en:"soup",ja:"スープ",id:"sup",ru:"суп",th:"ซุป",mn:"шөл",uz:"sho'rva"} },
          { char:"학교",  word:"학교",  meaning:{ko:"학교",  vi:"trường học",zh:"学校",en:"school",ja:"学校",id:"sekolah",ru:"школа",th:"โรงเรียน",mn:"сургууль",uz:"maktab"} },
          { char:"약국",  word:"약국",  meaning:{ko:"약국",  vi:"hiệu thuốc",zh:"药店",en:"pharmacy",ja:"薬局",id:"apotek",ru:"аптека",th:"ร้านขายยา",mn:"эмийн сан",uz:"dorixona"} },
          { char:"역",    word:"역",    meaning:{ko:"역",    vi:"ga",zh:"车站",en:"station",ja:"駅",id:"stasiun",ru:"станция",th:"สถานี",mn:"буудал",uz:"stansiya"} },
          { char:"수박",  word:"수박",  meaning:{ko:"수박",  vi:"dưa hấu",zh:"西瓜",en:"watermelon",ja:"スイカ",id:"semangka",ru:"арбуз",th:"แตงโม",mn:"тарвас",uz:"tarvuz"} },
          { char:"책",    word:"책",    meaning:{ko:"책",    vi:"sách",zh:"书",en:"book",ja:"本",id:"buku",ru:"книга",th:"หนังสือ",mn:"ном",uz:"kitob"} },
          { char:"국수",  word:"국수",  meaning:{ko:"국수",  vi:"mì",zh:"面条",en:"noodle",ja:"そば",id:"mie",ru:"лапша",th:"เส้นก๋วยเตี๋ยว",mn:"гоймон",uz:"erishtа"} },
          { char:"음악",  word:"음악",  meaning:{ko:"음악",  vi:"âm nhạc",zh:"音乐",en:"music",ja:"音楽",id:"musik",ru:"музыка",th:"ดนตรี",mn:"хөгжим",uz:"musiqa"} },
        ],
        tip:"받침 ㄱ은 소리가 입 밖으로 나가지 않도록 안으로 모아 닫습니다."
      },
      // ── 단계 11: 받침 ㅇ ──
      { id:"batchim_ng", type:"learn", emoji:"🧱",
        title:"11. 받침 [ㅇ]",
        desc:"가족·사회생활 관련 어휘로 ㅇ받침을 익힙니다.",
        items:[
          { char:"가족",  word:"가족",  meaning:{ko:"가족",  vi:"gia đình",zh:"家庭",en:"family",ja:"家族",id:"keluarga",ru:"семья",th:"ครอบครัว",mn:"гэр бүл",uz:"oila"} },
          { char:"방",    word:"방",    meaning:{ko:"방",    vi:"phòng",zh:"房间",en:"room",ja:"部屋",id:"kamar",ru:"комната",th:"ห้อง",mn:"өрөө",uz:"xona"} },
          { char:"강",    word:"강",    meaning:{ko:"강",    vi:"sông",zh:"河流",en:"river",ja:"川",id:"sungai",ru:"река",th:"แม่น้ำ",mn:"гол",uz:"daryo"} },
          { char:"영어",  word:"영어",  meaning:{ko:"영어",  vi:"tiếng Anh",zh:"英语",en:"English",ja:"英語",id:"bahasa Inggris",ru:"английский",th:"ภาษาอังกฤษ",mn:"англи хэл",uz:"ingliz tili"} },
          { char:"병원",  word:"병원",  meaning:{ko:"병원",  vi:"bệnh viện",zh:"医院",en:"hospital",ja:"病院",id:"rumah sakit",ru:"больница",th:"โรงพยาบาล",mn:"эмнэлэг",uz:"kasalxona"} },
          { char:"공항",  word:"공항",  meaning:{ko:"공항",  vi:"sân bay",zh:"机场",en:"airport",ja:"空港",id:"bandara",ru:"аэропорт",th:"สนามบิน",mn:"нисэх онгоцны буудал",uz:"aeroport"} },
          { char:"학생",  word:"학생",  meaning:{ko:"학생",  vi:"học sinh",zh:"学生",en:"student",ja:"学生",id:"siswa",ru:"студент",th:"นักเรียน",mn:"сурагч",uz:"talaba"} },
          { char:"경찰",  word:"경찰",  meaning:{ko:"경찰",  vi:"cảnh sát",zh:"警察",en:"police",ja:"警察",id:"polisi",ru:"полиция",th:"ตำรวจ",mn:"цагдаа",uz:"politsiya"} },
        ],
        tip:"ㅇ받침은 코를 울리며 소리의 꼬리를 부드럽게 이어줍니다."
      },
      // ── 단계 12: 받침 ㅁ ──
      { id:"batchim_m", type:"learn", emoji:"🧱",
        title:"12. 받침 [ㅁ]",
        desc:"가족·음식·감정 관련 어휘로 ㅁ받침을 익힙니다.",
        items:[
          { char:"엄마",  word:"엄마",  meaning:{ko:"엄마",  vi:"mẹ",zh:"妈妈",en:"mom",ja:"ママ",id:"mama",ru:"мама",th:"แม่",mn:"ээж",uz:"oyi"} },
          { char:"몸",    word:"몸",    meaning:{ko:"몸",    vi:"cơ thể",zh:"身体",en:"body",ja:"体",id:"tubuh",ru:"тело",th:"ร่างกาย",mn:"бие",uz:"tana"} },
          { char:"봄",    word:"봄",    meaning:{ko:"봄",    vi:"mùa xuân",zh:"春天",en:"spring",ja:"春",id:"musim semi",ru:"весна",th:"ฤดูใบไม้ผลิ",mn:"хавар",uz:"bahor"} },
          { char:"이름",  word:"이름",  meaning:{ko:"이름",  vi:"tên",zh:"名字",en:"name",ja:"名前",id:"nama",ru:"имя",th:"ชื่อ",mn:"нэр",uz:"ism"} },
          { char:"마음",  word:"마음",  meaning:{ko:"마음",  vi:"tâm hồn",zh:"心",en:"heart/mind",ja:"心",id:"hati",ru:"сердце",th:"ใจ",mn:"сэтгэл",uz:"yurak"} },
          { char:"꿈",    word:"꿈",    meaning:{ko:"꿈",    vi:"giấc mơ",zh:"梦想",en:"dream",ja:"夢",id:"mimpi",ru:"мечта",th:"ความฝัน",mn:"мөрөөдөл",uz:"orzu"} },
          { char:"음식",  word:"음식",  meaning:{ko:"음식",  vi:"thức ăn",zh:"食物",en:"food",ja:"食べ物",id:"makanan",ru:"еда",th:"อาหาร",mn:"хоол",uz:"ovqat"} },
          { char:"사람",  word:"사람",  meaning:{ko:"사람",  vi:"người",zh:"人",en:"person",ja:"人",id:"orang",ru:"человек",th:"คน",mn:"хүн",uz:"odam"} },
        ],
        tip:"ㅁ받침은 입술을 가볍게 다물어 소리가 입 안에 머물도록 합니다."
      },
      // ── 단계 13: 받침 ㅂ·ㅍ ──
      { id:"batchim_bp", type:"learn", emoji:"🧱",
        title:"13. 받침 [ㅂ·ㅍ]",
        desc:"직업·장소·신체 관련 어휘로 ㅂ계열 받침을 익힙니다.",
        items:[
          { char:"밥",    word:"밥",    meaning:{ko:"밥",    vi:"cơm",zh:"米饭",en:"rice",ja:"ご飯",id:"nasi",ru:"рис",th:"ข้าว",mn:"цагаан будаа",uz:"guruch"} },
          { char:"집",    word:"집",    meaning:{ko:"집",    vi:"nhà",zh:"家",en:"house/home",ja:"家",id:"rumah",ru:"дом",th:"บ้าน",mn:"гэр",uz:"uy"} },
          { char:"앞",    word:"앞",    meaning:{ko:"앞",    vi:"phía trước",zh:"前面",en:"front",ja:"前",id:"depan",ru:"перед",th:"ข้างหน้า",mn:"өмнө",uz:"oldi"} },
          { char:"입",    word:"입",    meaning:{ko:"입",    vi:"miệng",zh:"嘴",en:"mouth",ja:"口",id:"mulut",ru:"рот",th:"ปาก",mn:"ам",uz:"og'iz"} },
          { char:"숲",    word:"숲",    meaning:{ko:"숲",    vi:"rừng",zh:"森林",en:"forest",ja:"森",id:"hutan",ru:"лес",th:"ป่า",mn:"ой",uz:"o'rmon"} },
          { char:"무릎",  word:"무릎",  meaning:{ko:"무릎",  vi:"đầu gối",zh:"膝盖",en:"knee",ja:"膝",id:"lutut",ru:"колено",th:"เข่า",mn:"өвдөг",uz:"tizza"} },
        ],
        tip:"양 입술을 맞부딪치며 소리를 입 안에서 멈추는 소리입니다."
      },
      // ── 단계 14: 받침 ㄹ ⭐ ──
      { id:"batchim_r", type:"learn", emoji:"⭐",
        title:"14. 받침 [ㄹ] — 일상 대화 분기점!",
        desc:"이 단계를 마치면 일상적인 한국어 대화가 가능합니다!",
        items:[
          { char:"말",    word:"말",    meaning:{ko:"말",    vi:"lời nói",zh:"话语",en:"word/speech",ja:"言葉",id:"kata",ru:"слово",th:"คำพูด",mn:"үг",uz:"so'z"} },
          { char:"글",    word:"글",    meaning:{ko:"글",    vi:"chữ viết",zh:"文字",en:"writing",ja:"文字",id:"tulisan",ru:"письмо",th:"การเขียน",mn:"бичиг",uz:"yozuv"} },
          { char:"일",    word:"일",    meaning:{ko:"일",    vi:"công việc",zh:"工作",en:"work/job",ja:"仕事",id:"pekerjaan",ru:"работа",th:"งาน",mn:"ажил",uz:"ish"} },
          { char:"불",    word:"불",    meaning:{ko:"불",    vi:"lửa",zh:"火",en:"fire",ja:"火",id:"api",ru:"огонь",th:"ไฟ",mn:"гал",uz:"olov"} },
          { char:"발",    word:"발",    meaning:{ko:"발",    vi:"bàn chân",zh:"脚",en:"foot",ja:"足",id:"kaki",ru:"нога/стопа",th:"เท้า",mn:"хөл",uz:"oyoq"} },
          { char:"물",    word:"물",    meaning:{ko:"물",    vi:"nước",zh:"水",en:"water",ja:"水",id:"air",ru:"вода",th:"น้ำ",mn:"ус",uz:"suv"} },
          { char:"길",    word:"길",    meaning:{ko:"길",    vi:"đường",zh:"路",en:"road/way",ja:"道",id:"jalan",ru:"дорога",th:"ถนน",mn:"зам",uz:"yo'l"} },
          { char:"달",    word:"달",    meaning:{ko:"달",    vi:"mặt trăng",zh:"月亮",en:"moon",ja:"月",id:"bulan",ru:"луна",th:"พระจันทร์",mn:"сар",uz:"oy"} },
          { char:"별",    word:"별",    meaning:{ko:"별",    vi:"ngôi sao",zh:"星星",en:"star",ja:"星",id:"bintang",ru:"звезда",th:"ดาว",mn:"од",uz:"yulduz"} },
          { char:"하늘",  word:"하늘",  meaning:{ko:"하늘",  vi:"bầu trời",zh:"天空",en:"sky",ja:"空",id:"langit",ru:"небо",th:"ท้องฟ้า",mn:"тэнгэр",uz:"osmon"} },
        ],
        tip:"⭐ 중요 마일스톤! 혀끝을 윗잇몸에 가볍게 대며 소리를 부드럽게 굴려줍니다."
      },
      // ── 단계 15: 받침 ㄴ ──
      { id:"batchim_n", type:"learn", emoji:"🧱",
        title:"15. 받침 [ㄴ]",
        desc:"요일·나라·일상 어휘로 ㄴ받침을 익힙니다.",
        items:[
          { char:"눈",    word:"눈",    meaning:{ko:"눈",    vi:"mắt / tuyết",zh:"眼睛 / 雪",en:"eye / snow",ja:"目 / 雪",id:"mata / salju",ru:"глаз / снег",th:"ตา / หิมะ",mn:"нүд / цас",uz:"ko'z / qor"} },
          { char:"손",    word:"손",    meaning:{ko:"손",    vi:"bàn tay",zh:"手",en:"hand",ja:"手",id:"tangan",ru:"рука",th:"มือ",mn:"гар",uz:"qo'l"} },
          { char:"문",    word:"문",    meaning:{ko:"문",    vi:"cửa",zh:"门",en:"door",ja:"ドア",id:"pintu",ru:"дверь",th:"ประตู",mn:"хаалга",uz:"eshik"} },
          { char:"돈",    word:"돈",    meaning:{ko:"돈",    vi:"tiền",zh:"钱",en:"money",ja:"お金",id:"uang",ru:"деньги",th:"เงิน",mn:"мөнгө",uz:"pul"} },
          { char:"친구",  word:"친구",  meaning:{ko:"친구",  vi:"bạn bè",zh:"朋友",en:"friend",ja:"友達",id:"teman",ru:"друг",th:"เพื่อน",mn:"найз",uz:"do'st"} },
          { char:"전화",  word:"전화",  meaning:{ko:"전화",  vi:"điện thoại",zh:"电话",en:"phone",ja:"電話",id:"telepon",ru:"телефон",th:"โทรศัพท์",mn:"утас",uz:"telefon"} },
          { char:"인생",  word:"인생",  meaning:{ko:"인생",  vi:"cuộc đời",zh:"人生",en:"life",ja:"人生",id:"kehidupan",ru:"жизнь",th:"ชีวิต",mn:"амьдрал",uz:"hayot"} },
          { char:"한국",  word:"한국",  meaning:{ko:"한국",  vi:"Hàn Quốc",zh:"韩国",en:"Korea",ja:"韓国",id:"Korea",ru:"Корея",th:"เกาหลี",mn:"Солонгос",uz:"Koreya"} },
          { char:"신발",  word:"신발",  meaning:{ko:"신발",  vi:"giày dép",zh:"鞋子",en:"shoes",ja:"靴",id:"alas kaki",ru:"обувь",th:"รองเท้า",mn:"гутал",uz:"oyoq kiyim"} },
          { char:"월요일",word:"월요일",meaning:{ko:"월요일",vi:"thứ hai",zh:"星期一",en:"Monday",ja:"月曜日",id:"Senin",ru:"понедельник",th:"วันจันทร์",mn:"даваа",uz:"dushanba"} },
        ],
        tip:"혀를 앞니 안쪽에 대며 공기를 코로 살짝 내보내는 소리입니다."
      },
      // ── 단계 16: 받침 ㄷ계열 ──
      { id:"batchim_d", type:"learn", emoji:"🧱",
        title:"16. 받침 [ㄷ·ㅌ·ㅅ·ㅆ·ㅈ·ㅊ·ㅎ]",
        desc:"모양은 달라도 받침에서는 모두 같은 [ㄷ] 소리가 납니다.",
        items:[
          { char:"옷",    word:"옷",    meaning:{ko:"옷",    vi:"quần áo",zh:"衣服",en:"clothes",ja:"服",id:"pakaian",ru:"одежда",th:"เสื้อผ้า",mn:"хувцас",uz:"kiyim"} },
          { char:"꽃",    word:"꽃",    meaning:{ko:"꽃",    vi:"hoa",zh:"花",en:"flower",ja:"花",id:"bunga",ru:"цветок",th:"ดอกไม้",mn:"цэцэг",uz:"gul"} },
          { char:"빛",    word:"빛",    meaning:{ko:"빛",    vi:"ánh sáng",zh:"光",en:"light",ja:"光",id:"cahaya",ru:"свет",th:"แสง",mn:"гэрэл",uz:"nur"} },
          { char:"낮",    word:"낮",    meaning:{ko:"낮",    vi:"ban ngày",zh:"白天",en:"daytime",ja:"昼",id:"siang hari",ru:"день",th:"กลางวัน",mn:"өдөр",uz:"kunduz"} },
          { char:"밖",    word:"밖",    meaning:{ko:"밖",    vi:"bên ngoài",zh:"外面",en:"outside",ja:"外",id:"luar",ru:"снаружи",th:"ข้างนอก",mn:"гадаа",uz:"tashqari"} },
          { char:"듣다",  word:"듣다",  meaning:{ko:"듣다",  vi:"nghe",zh:"听",en:"to listen",ja:"聞く",id:"mendengar",ru:"слушать",th:"ฟัง",mn:"сонсох",uz:"eshitmoq"} },
          { char:"믿다",  word:"믿다",  meaning:{ko:"믿다",  vi:"tin tưởng",zh:"相信",en:"to trust",ja:"信じる",id:"percaya",ru:"верить",th:"เชื่อ",mn:"итгэх",uz:"ishonmoq"} },
          { char:"걷다",  word:"걷다",  meaning:{ko:"걷다",  vi:"đi bộ",zh:"走路",en:"to walk",ja:"歩く",id:"berjalan",ru:"ходить",th:"เดิน",mn:"явах",uz:"yurmoq"} },
        ],
        tip:"글자 모양은 모두 다르지만 받침 위치에서는 모두 [ㄷ] 음가로 통일됩니다."
      },
      // ── 단계 17: 겹받침 + 연음 ──
      { id:"double_liaison", type:"learn", emoji:"🔗",
        title:"17. 겹받침 + 연음법칙 — 최종 관문!",
        desc:"겹받침과 조사 결합 시 소리 변화(연음)를 익힙니다.",
        items:[
          { char:"닭",    word:"닭",    meaning:{ko:"닭",    vi:"con gà",zh:"鸡",en:"chicken",ja:"鶏",id:"ayam",ru:"курица",th:"ไก่",mn:"тахиа",uz:"tovuq"} },
          { char:"앉다",  word:"앉다",  meaning:{ko:"앉다",  vi:"ngồi",zh:"坐",en:"to sit",ja:"座る",id:"duduk",ru:"сидеть",th:"นั่ง",mn:"суух",uz:"o'tirmoq"} },
          { char:"읽다",  word:"읽다",  meaning:{ko:"읽다",  vi:"đọc",zh:"读",en:"to read",ja:"読む",id:"membaca",ru:"читать",th:"อ่าน",mn:"унших",uz:"o'qimoq"} },
          { char:"없다",  word:"없다",  meaning:{ko:"없다",  vi:"không có",zh:"没有",en:"to not exist",ja:"ない",id:"tidak ada",ru:"нет",th:"ไม่มี",mn:"байхгүй",uz:"yo'q"} },
          { char:"가족이",word:"가족이", meaning:{ko:"가족이",vi:"gia đình (chủ ngữ)",zh:"家庭(主语)",en:"family (subject)",ja:"家族が",id:"keluarga (subjek)",ru:"семья (субъект)",th:"ครอบครัว (ประธาน)",mn:"гэр бүл (эзэн)",uz:"oila (ega)"} },
          { char:"옷이",  word:"옷이",  meaning:{ko:"옷이",  vi:"quần áo (chủ ngữ)",zh:"衣服(主语)",en:"clothes (subject)",ja:"服が",id:"pakaian (subjek)",ru:"одежда (субъект)",th:"เสื้อผ้า (ประธาน)",mn:"хувцас (эзэн)",uz:"kiyim (ega)"} },
          { char:"꽃이",  word:"꽃이",  meaning:{ko:"꽃이",  vi:"hoa (chủ ngữ)",zh:"花(主语)",en:"flower (subject)",ja:"花が",id:"bunga (subjek)",ru:"цветок (субъект)",th:"ดอกไม้ (ประธาน)",mn:"цэцэг (эзэн)",uz:"gul (ega)"} },
          { char:"밥을",  word:"밥을",  meaning:{ko:"밥을",  vi:"cơm (tân ngữ)",zh:"米饭(宾语)",en:"rice (object)",ja:"ご飯を",id:"nasi (objek)",ru:"рис (объект)",th:"ข้าว (กรรม)",mn:"будаа (тэсвэрлэгч)",uz:"guruch (to'ldiruvchi)"} },
          { char:"읽어요",word:"읽어요", meaning:{ko:"읽어요",vi:"đọc (thể hiện nay)",zh:"读",en:"(I) read",ja:"読みます",id:"membaca",ru:"читаю",th:"อ่าน",mn:"уншдаг",uz:"o'qiyman"} },
          { char:"앉아요",word:"앉아요", meaning:{ko:"앉아요",vi:"ngồi",zh:"坐下",en:"(I) sit",ja:"座ります",id:"duduk",ru:"сижу",th:"นั่ง",mn:"суудаг",uz:"o'tiraman"} },
        ],
        tip:"⭐ 받침 뒤에 모음 조사가 오면 받침이 다음 음절 첫소리로 넘어갑니다. '옷이' → [오시]"
      },
    ];

    const current = PRON_STEPS[pronStep];

    function playSound(text) {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "ko-KR";
      utter.rate = 0.65;
      utter.pitch = 1;
      window.speechSynthesis.speak(utter);
    }

    return (
      <div style={{minHeight:"100vh", background:`linear-gradient(150deg,${C.bg},#F3EEFF)`, display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 20px 60px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
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

        {/* 쓰기 단계 / 학습 단계 분기 */}
        {current.type === "write" ? (
          <div style={{width:"100%", maxWidth:380, marginBottom:20}}>
            <div style={{background:"#FFF8E7", border:"2px solid #FFC107", borderRadius:16, padding:"18px 16px", marginBottom:16, textAlign:"center"}}>
              <div style={{fontSize:16, fontWeight:900, color:"#E65100", marginBottom:8}}>✏️ {vi?"Bài tập viết":en?"Writing task":"쓰기 과제"}</div>
              <div style={{fontSize:13, color:"#5D4037", lineHeight:1.7, marginBottom:12}}>{current.writeTask}</div>
              <div style={{display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center"}}>
                {current.items.map((item,i)=>(
                  <div key={i} style={{background:"white", border:"2px solid #FFC107", borderRadius:10, padding:"8px 14px", fontSize:28, fontWeight:900, color:"#9C6FDE"}}>{item.char}</div>
                ))}
              </div>
            </div>
            <div style={{background:"#F5F5F5", border:"2px dashed #ccc", borderRadius:16, padding:"20px", textAlign:"center", marginBottom:12}}>
              <div style={{fontSize:24, marginBottom:8}}>📷</div>
              <div style={{fontSize:13, color:"#888", marginBottom:12}}>
                {vi?"Chụp ảnh bài viết và tải lên":en?"Take a photo of your writing and upload":"쓴 것을 사진으로 찍어서 업로드하세요"}
              </div>
              <div style={{background:"#9C6FDE", color:"white", borderRadius:50, padding:"10px 24px", fontSize:13, fontWeight:700, display:"inline-block", opacity:0.6}}>
                📤 {vi?"Tải lên (sắp có)":en?"Upload (coming soon)":"업로드 (준비중)"}
              </div>
            </div>
            <button onClick={()=>{
              if(pronStep < PRON_STEPS.length - 1){ setPronStep(s=>s+1); setFlipped({}); }
              else setStep("pronResult");
            }} style={{width:"100%", background:"linear-gradient(135deg,#9C6FDE,#C084FC)", color:"white", border:"none", borderRadius:50, padding:"13px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>
              ✅ {vi?"Hoàn thành — Tiếp theo":en?"Done — Next step":"완료 — 다음 단계로"}
            </button>
          </div>
        ) : (
        <>
        {/* 학습 카드 그리드 */}
        <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, maxWidth:380, width:"100%", marginBottom:20}}>
          {current.items.map((item,i)=>(
            <div key={i} onClick={()=>{ setFlipped(f=>({...f,[i]:!f[i]})); playSound(flipped[i] ? item.char : item.word); }}
              style={{background:flipped[i]?"#9C6FDE":"white", border:`2px solid ${flipped[i]?"#9C6FDE":"#E8E0F8"}`, borderRadius:14, padding:"10px 6px", cursor:"pointer", textAlign:"center", transition:"all .2s", boxShadow:"0 2px 8px #9C6FDE18"}}>
              {flipped[i] ? (
                <>
                  <div style={{fontSize:12, color:"white", fontWeight:700, marginBottom:2, wordBreak:"keep-all"}}>{item.word}</div>
                  <div style={{fontSize:10, color:"rgba(255,255,255,.85)"}}>{item.meaning?.[lang?.code] ?? item.meaning?.en ?? ""}</div>
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
        </>
        )}

        {/* 발음 테스트 버튼 — 각 단계마다 테스트 후 다음으로 */}
        <button onClick={()=>{
          // ✅ V153: 누적 반복 원칙 — 현재 단계 + 이전 모든 단계 단어 전체
          const accumulated = PRON_STEPS.slice(0, pronStep + 1)
            .flatMap(s => s.items || []);
          // 순서를 섞어서 제시 (전체 단어, 랜덤 순서)
          const picked = [...accumulated].sort(() => Math.random() - 0.5);
          setPronTestItems(picked);
          setPronTestIdx(0);
          setPronTestResults([]);
          setPronTestSTT("");
          setPronTestFeedback(null);
          setPronTestFromStep(pronStep);
          setStep("pronTest");
        }}
          style={{width:"100%", maxWidth:360, background:"linear-gradient(135deg,#9C6FDE,#C084FC)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", boxShadow:"0 4px 16px #9C6FDE44"}}>
          🎤 {vi?"Kiểm tra phát âm!":en?"Pronunciation test!":"발음 테스트하기!"}
        </button>

        <button onClick={()=>setStep("plan")} style={{marginTop:12, background:"none", border:"none", color:"#ccc", fontSize:12, cursor:"pointer"}}>← 뒤로</button>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // ✅ V153: 발음 STT 테스트 화면
  // ════════════════════════════════════════════════════════
  if (step === "pronTest") {
    const vi = lang?.code === "vi";
    const en = lang?.code === "en";
    const PRON_STEPS_COUNT = 17; // 총 발음 단계 수

    // 유사도 계산 함수 (레벤슈타인 거리 기반)
    function calcSimilarity(a, b) {
      const s1 = a.trim().toLowerCase();
      const s2 = b.trim().toLowerCase();
      if (s1 === s2) return 100;
      if (!s1 || !s2) return 0;
      const m = s1.length, n = s2.length;
      const dp = Array.from({length:m+1}, (_,i) => Array.from({length:n+1}, (_,j) => i===0?j:j===0?i:0));
      for (let i=1;i<=m;i++) for (let j=1;j<=n;j++)
        dp[i][j] = s1[i-1]===s2[j-1] ? dp[i-1][j-1] : 1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
      const maxLen = Math.max(m,n);
      return Math.round((1 - dp[m][n]/maxLen)*100);
    }

    // STT 시작
    function startSTT() {
      // ✅ V153: 듣는 중일 때 버튼 재클릭 → 즉시 종료 후 평가
      if (isListeningRef.current && pronRecRef.current) {
        pronRecRef.current.stop();
        return;
      }
      if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
        alert(vi?"Trình duyệt không hỗ trợ STT":en?"Browser doesn't support STT":"이 브라우저는 음성 인식을 지원하지 않아요");
        return;
      }
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SR();
      rec.lang = "ko-KR";
      rec.interimResults = true;   // ✅ 중간 결과도 받아서 짧은 단어 인식 개선
      rec.continuous = true;        // ✅ 짧은 단어도 끊기지 않게
      rec.maxAlternatives = 3;
      pronRecRef.current = rec;
      isListeningRef.current = true;
      let hasResult = false;        // ✅ 결과 수신 여부 추적
      setPronTestListening(true);
      setPronTestSTT("");
      setPronTestFeedback(null);
      rec.onresult = async (e) => {
        // 최종 결과(isFinal)만 처리
        const finalResult = Array.from(e.results).find(r => r.isFinal);
        if (!finalResult) return; // 중간 결과는 무시
        hasResult = true;
        rec.stop();
        isListeningRef.current = false;
        pronRecRef.current = null;
        const target = pronTestItems[pronTestIdx]?.word || "";
        let bestText = finalResult[0].transcript;
        let bestSim = calcSimilarity(bestText, target);
        for (let i=0;i<finalResult.length;i++) {
          const t = finalResult[i].transcript;
          const s = calcSimilarity(t, target);
          if (s > bestSim) { bestSim = s; bestText = t; }
        }
        setPronTestSTT(bestText);
        setPronTestListening(false);
        await judgePronunciation(bestText, target, bestSim);
      };
      rec.onerror = (e) => {
        hasResult = true; // 에러도 결과로 처리해서 onend 중복 방지
        isListeningRef.current = false;
        pronRecRef.current = null;
        setPronTestListening(false);
        if (e.error !== "aborted") {
          setPronTestFeedback({ok:false, similarity:0, msg:"🎤 마이크를 확인하고 다시 시도해주세요"});
        }
      };
      rec.onend = () => {
        isListeningRef.current = false;
        pronRecRef.current = null;
        setPronTestListening(false);
        // 결과 없이 종료된 경우 — 다시 시도 안내
        if (!hasResult) {
          setPronTestFeedback({ok:false, similarity:0, msg: vi?"Không nghe thấy. Thử lại nhé! 🎤":en?"Couldn't hear you. Try again! 🎤":"소리를 인식하지 못했어요. 크게 다시 말해봐요! 🎤"});
          setPronTestResults(r=>[...r, {target: pronTestItems[pronTestIdx]?.word||"", sttText:"(인식 실패)", similarity:0, ok:false}]);
        }
      };
      rec.start();
    }

    // 판단 함수
    async function judgePronunciation(sttText, target, similarity) {
      if (similarity >= 85) {
        // 바로 통과
        setPronTestFeedback({ok:true, similarity, msg: vi?"Xuất sắc! Phát âm chuẩn!":en?"Excellent pronunciation!":"완벽해요! 🎉"});
        setPronTestResults(r=>[...r, {target, sttText, similarity, ok:true}]);
      } else if (similarity >= 50) {
        // Claude 판단
        setPronTestLoading(true);
        try {
          const res = await fetch("https://api.anthropic.com/v1/messages",{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({
              model:"claude-sonnet-4-20250514",
              max_tokens:200,
              messages:[{role:"user", content:`
한국어 초급 학습자의 발음을 평가해주세요.
목표 단어: "${target}"
STT 인식 결과: "${sttText}"
유사도: ${similarity}%

이 학습자의 발음이 통과 수준인지 판단하고, 짧은 피드백을 주세요.
JSON으로만 응답: {"pass":true또는false,"feedback":"한 줄 피드백(${lang?.code==="vi"?"베트남어":lang?.code==="en"?"영어":"한국어"})"}
`}]
            })
          });
          const data = await res.json();
          const text = data.content?.[0]?.text || "";
          const clean = text.replace(/```json|```/g,"").trim();
          const parsed = JSON.parse(clean);
          setPronTestFeedback({ok:parsed.pass, similarity, msg:parsed.feedback});
          setPronTestResults(r=>[...r, {target, sttText, similarity, ok:parsed.pass}]);
        } catch {
          // Claude 실패 시 유사도 70% 기준으로 fallback
          const ok = similarity >= 70;
          setPronTestFeedback({ok, similarity, msg: ok?"잘했어요! 😊":"다시 한번 해봐요! 💪"});
          setPronTestResults(r=>[...r, {target, sttText, similarity, ok}]);
        }
        setPronTestLoading(false);
      } else {
        // 바로 실패
        setPronTestFeedback({ok:false, similarity, msg: vi?"Thử lại nhé! 💪":en?"Try again! 💪":"다시 해봐요! 💪"});
        setPronTestResults(r=>[...r, {target, sttText, similarity, ok:false}]);
      }
    }

    // 다음 문제 / 결과 보기
    function goNext() {
      if (pronTestIdx < pronTestItems.length - 1) {
        setPronTestIdx(i=>i+1);
        setPronTestSTT("");
        setPronTestFeedback(null);
      } else {
        // 전체 결과 — 80% 이상 통과
        const passed = pronTestResults.filter(r=>r.ok).length;
        const total = pronTestResults.length;
        const score = Math.round((passed/total)*100);
        setStep("pronResult");
        setPronTestResults(r => [{_summary:true, passed, total, score, fromStep: pronTestFromStep}, ...r]);
      }
    }

    const currentItem = pronTestItems[pronTestIdx];
    if (!currentItem) return null;

    return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#F3EEFF,#E8E0FF)", display:"flex", flexDirection:"column", alignItems:"center", padding:"28px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <div style={{width:"100%", maxWidth:380}}>
          {/* 헤더 */}
          <div style={{fontSize:13, color:"#9C6FDE", fontWeight:700, marginBottom:4}}>
            🎤 {vi?"Kiểm tra phát âm":en?"Pronunciation Test":"발음 테스트"} ({pronTestIdx+1}/{pronTestItems.length})
          </div>
          <div style={{display:"flex", gap:4, marginBottom:20}}>
            {pronTestItems.map((_,i)=>(
              <div key={i} style={{flex:1, height:5, borderRadius:3, background:i<pronTestIdx?"#9C6FDE":i===pronTestIdx?"#C084FC":"#E0D0FF"}}/>
            ))}
          </div>

          {/* 목표 단어 카드 */}
          <div style={{background:"white", borderRadius:20, padding:28, textAlign:"center", boxShadow:"0 8px 32px #9C6FDE22", marginBottom:20}}>
            <div style={{fontSize:13, color:"#aaa", marginBottom:8}}>
              {vi?"Hãy đọc to từ này":en?"Read this word aloud":"이 단어를 크게 발음해보세요"}
            </div>
            <div style={{fontSize:48, fontWeight:900, color:"#7C3AED", marginBottom:4}}>
              {currentItem.word}
            </div>
            <div style={{fontSize:14, color:"#aaa"}}>
              {currentItem.meaning}
            </div>
            {/* 예시 듣기 버튼 */}
            <button onClick={()=>{
              const u = new SpeechSynthesisUtterance(currentItem.word);
              u.lang="ko-KR"; u.rate=0.55;
              window.speechSynthesis.cancel();
              window.speechSynthesis.speak(u);
            }} style={{marginTop:12, background:"#F3EEFF", border:"none", borderRadius:20, padding:"6px 16px", fontSize:12, color:"#9C6FDE", cursor:"pointer", fontWeight:700}}>
              🔊 {vi?"Nghe mẫu":en?"Listen":"예시 듣기"}
            </button>
          </div>

          {/* STT 결과 표시 */}
          {pronTestSTT && (
            <div style={{background:"white", borderRadius:14, padding:14, marginBottom:12, textAlign:"center"}}>
              <div style={{fontSize:12, color:"#aaa", marginBottom:4}}>{vi?"Bạn đã nói":en?"You said":"내가 말한 것"}</div>
              <div style={{fontSize:20, fontWeight:700, color:"#333"}}>{pronTestSTT}</div>
              <div style={{fontSize:12, color:"#9C6FDE", marginTop:4}}>
                {vi?"Độ tương đồng":en?"Similarity":"유사도"}: {pronTestFeedback?.similarity}%
              </div>
            </div>
          )}

          {/* 피드백 */}
          {pronTestLoading && (
            <div style={{textAlign:"center", padding:12, color:"#9C6FDE", fontWeight:700}}>
              ⏳ {vi?"Đang đánh giá...":en?"Evaluating...":"평가 중..."}
            </div>
          )}
          {pronTestFeedback && !pronTestLoading && (
            <div style={{background: pronTestFeedback.ok?"#F0FBF6":"#FFF0F0", borderRadius:14, padding:14, marginBottom:12, textAlign:"center"}}>
              <div style={{fontSize:24, marginBottom:4}}>{pronTestFeedback.ok?"✅":"❌"}</div>
              <div style={{fontSize:14, fontWeight:700, color: pronTestFeedback.ok?"#00A876":"#E64A00"}}>
                {pronTestFeedback.msg}
              </div>
            </div>
          )}

          {/* 버튼 영역 */}
          {!pronTestFeedback && !pronTestLoading && (
            <button onClick={startSTT}
              style={{width:"100%", background: pronTestListening?"linear-gradient(135deg,#FF6B6B,#E64A00)":"linear-gradient(135deg,#9C6FDE,#7C3AED)", color:"white", border:"none", borderRadius:50, padding:"16px 0", fontSize:16, fontWeight:900, cursor:"pointer", boxShadow:"0 4px 16px #9C6FDE44"}}>
              {pronTestListening
                ? (vi?"🔴 Đang nghe... (nhấn lại để dừng)":en?"🔴 Listening... (tap again to stop)":"🔴 듣는 중... (다시 누르면 종료)")
                : (vi?"🎤 Bắt đầu nói":en?"🎤 Speak now":"🎤 말하기 시작")}
            </button>
          )}
          {pronTestFeedback && !pronTestLoading && (
            <div style={{display:"flex", gap:8}}>
              {!pronTestFeedback.ok && (
                <button onClick={()=>{setPronTestSTT(""); setPronTestFeedback(null);}}
                  style={{flex:1, background:"white", border:"2px solid #9C6FDE", color:"#9C6FDE", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:700, cursor:"pointer"}}>
                  🔄 {vi?"Thử lại":en?"Retry":"다시 시도"}
                </button>
              )}
              <button onClick={goNext}
                style={{flex:2, background:"linear-gradient(135deg,#9C6FDE,#7C3AED)", color:"white", border:"none", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>
                {pronTestIdx < pronTestItems.length-1
                  ? (vi?"Câu tiếp →":en?"Next →":"다음 문제 →")
                  : (vi?"Xem kết quả →":en?"See results →":"결과 보기 →")}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // ✅ V153: 발음 테스트 결과 화면
  // ════════════════════════════════════════════════════════
  if (step === "pronResult") {
    const vi = lang?.code === "vi";
    const en = lang?.code === "en";
    const summary = pronTestResults[0]?._summary ? pronTestResults[0] : null;
    const details = pronTestResults.filter(r=>!r._summary);
    const passed = summary?.score >= 80;
    const fromStep = summary?.fromStep ?? 0;
    const PRON_STEPS_COUNT = 17;

    return (
      <div style={{minHeight:"100vh", background: passed?"linear-gradient(150deg,#E8F8F2,#D0F0E4)":"linear-gradient(150deg,#FFF0F0,#FFE0E0)", display:"flex", flexDirection:"column", alignItems:"center", padding:"28px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <div style={{width:"100%", maxWidth:380}}>
          <div style={{textAlign:"center", marginBottom:24}}>
            <div style={{fontSize:56}}>{passed?"🎉":"💪"}</div>
            <div style={{fontSize:22, fontWeight:900, color: passed?"#00A876":"#E64A00", marginBottom:4}}>
              {passed
                ? (vi?"Qua rồi!":en?"Passed!":"통과! 🎉")
                : (vi?"Chưa qua. Luyện lại nhé!":en?"Not passed. Practice more!":"미통과 — 다시 연습해요")}
            </div>
            <div style={{fontSize:28, fontWeight:900, color: passed?"#00C896":"#FF6B6B"}}>
              {summary?.passed}/{summary?.total} ({summary?.score}점)
            </div>
            <div style={{fontSize:12, color:"#888", marginTop:4}}>통과 기준: 80점 이상</div>
          </div>

          {/* 문제별 결과 */}
          <div style={{background:"white", borderRadius:16, padding:16, marginBottom:20}}>
            {details.map((r,i)=>(
              <div key={i} style={{marginBottom:10, padding:10, borderRadius:10, background:r.ok?"#F0FBF6":"#FFF0F0"}}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                  <span style={{fontWeight:700, color:"#333"}}>{r.target}</span>
                  <span style={{fontSize:12, color: r.ok?"#00A876":"#E64A00", fontWeight:700}}>
                    {r.ok?"✅":"❌"} {r.similarity}%
                  </span>
                </div>
                <div style={{fontSize:12, color:"#888", marginTop:2}}>
                  {vi?"Bạn nói":en?"You said":"말한 것"}: {r.sttText || "(없음)"}
                </div>
              </div>
            ))}
          </div>

          {passed ? (
            <button onClick={()=>{
              setFlipped({});
              if (fromStep < PRON_STEPS_COUNT - 1) {
                setPronStep(fromStep + 1);
                setStep("pronunciation");
              } else {
                setStep("tense1");
              }
            }}
              style={{width:"100%", background:"linear-gradient(135deg,#9C6FDE,#7C3AED)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>
              {fromStep < PRON_STEPS_COUNT - 1
                ? (vi?"Học bài tiếp theo →":en?"Next lesson →":"다음 단계로 →")
                : (vi?"Học động từ/tính từ! 🚀":en?"Learn verb tenses! 🚀":"시제 학습으로! 🚀")}
            </button>
          ) : (
            <button onClick={()=>{
              setPronTestIdx(0);
              setPronTestResults([]);
              setPronTestSTT("");
              setPronTestFeedback(null);
              setStep("pronTest");
            }}
              style={{width:"100%", background:"linear-gradient(135deg,#9C6FDE,#7C3AED)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>
              🔄 {vi?"Làm lại bài kiểm tra":en?"Retake test":"발음 테스트 다시 도전"}
            </button>
          )}

          <button onClick={()=>{setStep("pronunciation"); setPronStep(fromStep);}}
            style={{marginTop:10, width:"100%", background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer"}}>
            ← {vi?"Xem lại bài học":en?"Review lesson":"학습 다시 보기"}
          </button>
        </div>
      </div>
    );
  }

  // ── V147: 조사·대명사 화면 (발음 다음 순서 — 3h) ──

  // ══════════════════════════════════════════
  // 시제 1단원 — 규칙 동사 (현재·과거·미래)
  // ══════════════════════════════════════════
  if (step === "tense1") {
    const vi = lang?.code === "vi";
    const en = lang?.code === "en";

    const TENSE1_CARDS = [
      { base:"먹다",    meaning:{vi:"ăn",       en:"eat"},    batchim:true,
        pres:"먹습니다",  presQ:"먹습니까?",  past:"먹었습니다", pastQ:"먹었습니까?",  fut:"먹을 것입니다",  futQ:"먹을 것입니까?" },
      { base:"가다",    meaning:{vi:"đi",       en:"go"},     batchim:false,
        pres:"갑니다",    presQ:"갑니까?",    past:"갔습니다",   pastQ:"갔습니까?",    fut:"갈 것입니다",    futQ:"갈 것입니까?" },
      { base:"오다",    meaning:{vi:"đến/đi",   en:"come"},   batchim:false,
        pres:"옵니다",    presQ:"옵니까?",    past:"왔습니다",   pastQ:"왔습니까?",    fut:"올 것입니다",    futQ:"올 것입니까?" },
      { base:"보다",    meaning:{vi:"xem/nhìn", en:"see/watch"},batchim:false,
        pres:"봅니다",    presQ:"봅니까?",    past:"봤습니다",   pastQ:"봤습니까?",    fut:"볼 것입니다",    futQ:"볼 것입니까?" },
      { base:"마시다",  meaning:{vi:"uống",     en:"drink"},  batchim:false,
        pres:"마십니다",  presQ:"마십니까?",  past:"마셨습니다", pastQ:"마셨습니까?",  fut:"마실 것입니다",  futQ:"마실 것입니까?" },
      { base:"읽다",    meaning:{vi:"đọc",      en:"read"},   batchim:true,
        pres:"읽습니다",  presQ:"읽습니까?",  past:"읽었습니다", pastQ:"읽었습니까?",  fut:"읽을 것입니다",  futQ:"읽을 것입니까?" },
      { base:"앉다",    meaning:{vi:"ngồi",     en:"sit"},    batchim:true,
        pres:"앉습니다",  presQ:"앉습니까?",  past:"앉았습니다", pastQ:"앉았습니까?",  fut:"앉을 것입니다",  futQ:"앉을 것입니까?" },
      { base:"웃다",    meaning:{vi:"cười",     en:"laugh"},  batchim:true,
        pres:"웃습니다",  presQ:"웃습니까?",  past:"웃었습니다", pastQ:"웃었습니까?",  fut:"웃을 것입니다",  futQ:"웃을 것입니까?" },
      { base:"찾다",    meaning:{vi:"tìm",      en:"find"},   batchim:true,
        pres:"찾습니다",  presQ:"찾습니까?",  past:"찾았습니다", pastQ:"찾았습니까?",  fut:"찾을 것입니다",  futQ:"찾을 것입니까?" },
      { base:"씻다",    meaning:{vi:"rửa",      en:"wash"},   batchim:true,
        pres:"씻습니다",  presQ:"씻습니까?",  past:"씻었습니다", pastQ:"씻었습니까?",  fut:"씻을 것입니다",  futQ:"씻을 것입니까?" },
      { base:"서다",    meaning:{vi:"đứng",     en:"stand"},  batchim:false,
        pres:"섭니다",    presQ:"섭니까?",    past:"섰습니다",   pastQ:"섰습니까?",    fut:"설 것입니다",    futQ:"설 것입니까?" },
      { base:"자다",    meaning:{vi:"ngủ",      en:"sleep"},  batchim:false,
        pres:"잡니다",    presQ:"잡니까?",    past:"잤습니다",   pastQ:"잤습니까?",    fut:"잘 것입니다",    futQ:"잘 것입니까?" },
      { base:"사다",    meaning:{vi:"mua",      en:"buy"},    batchim:false,
        pres:"삽니다",    presQ:"삽니까?",    past:"샀습니다",   pastQ:"샀습니까?",    fut:"살 것입니다",    futQ:"살 것입니까?" },
      { base:"타다",    meaning:{vi:"đi (xe)",  en:"ride"},   batchim:false,
        pres:"탑니다",    presQ:"탑니까?",    past:"탔습니다",   pastQ:"탔습니까?",    fut:"탈 것입니다",    futQ:"탈 것입니까?" },
      { base:"만나다",  meaning:{vi:"gặp",      en:"meet"},   batchim:false,
        pres:"만납니다",  presQ:"만납니까?",  past:"만났습니다", pastQ:"만났습니까?",  fut:"만날 것입니다",  futQ:"만날 것입니까?" },
      { base:"배우다",  meaning:{vi:"học",      en:"learn"},  batchim:false,
        pres:"배웁니다",  presQ:"배웁니까?",  past:"배웠습니다", pastQ:"배웠습니까?",  fut:"배울 것입니다",  futQ:"배울 것입니까?" },
      { base:"주다",    meaning:{vi:"cho/đưa",  en:"give"},   batchim:false,
        pres:"줍니다",    presQ:"줍니까?",    past:"줬습니다",   pastQ:"줬습니까?",    fut:"줄 것입니다",    futQ:"줄 것입니까?" },
      { base:"내리다",  meaning:{vi:"xuống",    en:"get off"},batchim:false,
        pres:"내립니다",  presQ:"내립니까?",  past:"내렸습니다", pastQ:"내렸습니까?",  fut:"내릴 것입니다",  futQ:"내릴 것입니까?" },
      { base:"기다리다",meaning:{vi:"đợi",      en:"wait"},   batchim:false,
        pres:"기다립니다",presQ:"기다립니까?",past:"기다렸습니다",pastQ:"기다렸습니까?",fut:"기다릴 것입니다",futQ:"기다릴 것입니까?" },
      { base:"보내다",  meaning:{vi:"gửi",      en:"send"},   batchim:false,
        pres:"보냅니다",  presQ:"보냅니까?",  past:"보냈습니다", pastQ:"보냈습니까?",  fut:"보낼 것입니다",  futQ:"보낼 것입니까?" },
      { base:"늦다",    meaning:{vi:"muộn",    en:"be late"}, batchim:true,
        pres:"늦습니다",  presQ:"늦습니까?",  past:"늦었습니다", pastQ:"늦었습니까?",  fut:"늦을 것입니다",  futQ:"늦을 것입니까?" },
      { base:"놓다",    meaning:{vi:"đặt/để",  en:"put down"}, batchim:true,
        pres:"놓습니다",  presQ:"놓습니까?",  past:"놓았습니다", pastQ:"놓았습니까?",  fut:"놓을 것입니다",  futQ:"놓을 것입니까?" },
      { base:"신다",    meaning:{vi:"mang (giày)",en:"put on shoes"}, batchim:true,
        pres:"신습니다",  presQ:"신습니까?",  past:"신었습니다", pastQ:"신었습니까?",  fut:"신을 것입니다",  futQ:"신을 것입니까?" },
    ];

    const card = TENSE1_CARDS[tenseCardIdx];
    const total = TENSE1_CARDS.length;
    const meaning = vi ? card.meaning.vi : en ? card.meaning.en : card.meaning.en;

    // 현재 카드 입력값
    const inp = tenseInputs[tenseCardIdx] || {};
    const setInp = (key, val) => setTenseInputs(prev => ({
      ...prev,
      [tenseCardIdx]: { ...(prev[tenseCardIdx]||{}), [key]: val }
    }));

    // 정답 공개 시 맞/틀 판정
    const check = (key) => {
      if (!tenseRevealed) return null;
      const userVal = (inp[key]||"").trim().replace(/\s+/g,"");
      const correct = (card[key]||"").replace(/\s+/g,"");
      return userVal === correct ? "correct" : "wrong";
    };

    // 셀 렌더링 (입력 or 결과)
    const renderCell = (key, color, bg) => {
      const status = check(key);
      const border = !tenseRevealed ? "2px solid #e0e0e0"
        : status==="correct" ? "2px solid #2E7D32"
        : "2px solid #C62828";
      const cellBg = !tenseRevealed ? "#fafafa"
        : status==="correct" ? "#E8F5E9"
        : "#FFEBEE";
      return (
        <div style={{padding:"6px 4px", borderRight:"1px solid #f0f0f0", background:cellBg}}>
          <input
            type="text"
            value={inp[key]||""}
            onChange={e => { if(!tenseRevealed) setInp(key, e.target.value); }}
            onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Tab") e.stopPropagation(); }}
            readOnly={tenseRevealed}
            style={{width:"100%", border, borderRadius:6, padding:"6px 4px", fontSize:12, fontWeight:700,
              textAlign:"center", outline:"none", boxSizing:"border-box",
              color: !tenseRevealed ? "#333" : status==="correct" ? "#2E7D32" : "#C62828",
              background:"transparent", cursor: tenseRevealed?"default":"text"}}
            placeholder="..."
          />
          {tenseRevealed && status==="wrong" && (
            <div style={{fontSize:11, color:"#2E7D32", fontWeight:900, textAlign:"center", marginTop:2}}>
              → {card[key]}
            </div>
          )}
        </div>
      );
    };

    // 색상 테마
    const C = { bg:"linear-gradient(150deg,#E8F5E9,#C8E6C9)", accent:"#2E7D32",
                 light:"#F1F8E9", border:"#A5D6A7",
                 pres:"#1565C0", past:"#6A1B9A", fut:"#E65100",
                 presLight:"#E3F2FD", pastLight:"#F3E5F5", futLight:"#FFF3E0" };

    return (
      <div style={{minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:420}}>

          {/* 헤더 */}
          <div style={{fontSize:13, fontWeight:900, color:C.accent, marginBottom:2}}>
            📚 {vi?"시제 1단원 — Động từ (Hiện tại·Quá khứ·Tương lai)":en?"Tense Unit 1 — Verbs (Present·Past·Future)":"시제 1단원 — 동사 (현재·과거·미래)"}
          </div>
          <div style={{fontSize:12, color:"#555", background:"#F1F8E9", borderRadius:10, padding:"10px 14px", marginBottom:12, lineHeight:1.7}}>
            {vi
              ? <>📌 <b>합니다체</b>: văn phong <b>trang trọng, lịch sự</b> — dùng trong công sở, hội nghị, phát thanh.<br/>Bảng dưới có 2 hàng: <b>câu kể (.)</b> và <b>câu hỏi (?)</b> × 3 thì.<br/>Nhìn bảng → nhớ dạng → bấm <b>"Xem đáp án"</b>!</>
              : en
              ? <>📌 <b>합니다체</b> = <b>formal/polite</b> style — used at work, meetings, broadcasts.<br/>The table has 2 rows: <b>statement (.)</b> and <b>question (?)</b> × 3 tenses.<br/>Study the table → memorize the forms → tap <b>"Show answers"</b>!</>
              : <>📌 <b>합니다체</b>: 직장·회의·방송에서 쓰는 <b>공식·격식 표현</b>이에요.<br/>표에는 두 줄이 있어요: <b>진술(.)</b>과 <b>질문(?)</b> × 현재·과거·미래.<br/>표를 보고 → 형태를 익히고 → <b>"정답 보기"</b>를 눌러 확인하세요!</>
            }
          </div>

          {/* 진행 바 */}
          <div style={{display:"flex", gap:3, marginBottom:16}}>
            {TENSE1_CARDS.map((_,i) => (
              <div key={i} style={{flex:1, height:4, borderRadius:2, background:i<=tenseCardIdx?C.accent:"#ddd"}} />
            ))}
          </div>

          {/* 카드 */}
          <div style={{background:"white", borderRadius:20, overflow:"hidden", boxShadow:"0 4px 20px rgba(46,125,50,.12)", marginBottom:16}}>

            {/* 기본형 + 뜻 + 받침 힌트 */}
            <div style={{background:C.accent, padding:"14px 20px"}}>
              <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4}}>
                <div style={{fontSize:28, fontWeight:900, color:"white"}}>{card.base}</div>
                <div style={{fontSize:14, color:"rgba(255,255,255,.85)", fontWeight:700}}>{meaning}</div>
              </div>
              <div style={{fontSize:12, color:"rgba(255,255,255,.9)", fontWeight:700, background:"rgba(0,0,0,.15)", borderRadius:6, padding:"4px 10px", display:"inline-block"}}>
                {card.batchim
                  ? (vi?"받침 있음 → +습니다":en?"Has final consonant → +습니다":"받침 있음 → +습니다")
                  : (vi?"받침 없음 → +ㅂ니다":en?"No final consonant → +ㅂ니다":"받침 없음 → +ㅂ니다")}
              </div>
            </div>

            {/* 시제 표 */}
            <div style={{padding:"0"}}>
              {/* 헤더 행 */}
              <div style={{display:"grid", gridTemplateColumns:"32px 1fr 1fr 1fr", borderBottom:"1px solid #f0f0f0"}}>
                <div style={{background:"#f5f5f5"}} />
                <div style={{padding:"10px 0", textAlign:"center", fontSize:13, fontWeight:900, color:C.pres, background:C.presLight}}>
                  {vi?"Hiện tại":en?"Present":"현재"}
                </div>
                <div style={{padding:"10px 0", textAlign:"center", fontSize:13, fontWeight:900, color:C.past, background:C.pastLight}}>
                  {vi?"Quá khứ":en?"Past":"과거"}
                </div>
                <div style={{padding:"10px 0", textAlign:"center", fontSize:13, fontWeight:900, color:C.fut, background:C.futLight}}>
                  {vi?"Tương lai":en?"Future":"미래"}
                </div>
              </div>

              {/* 진술(.) 행 */}
              <div style={{display:"grid", gridTemplateColumns:"32px 1fr 1fr 1fr", borderBottom:"2px solid #e0e0e0"}}>
                <div style={{display:"flex", alignItems:"center", justifyContent:"center", background:"#f5f5f5", borderRight:"1px solid #e8e8e8"}}>
                  <span style={{fontSize:20, fontWeight:900, color:"#555"}}>.</span>
                </div>
                {renderCell("pres", C.pres, C.presLight)}
                {renderCell("past", C.past, C.pastLight)}
                {renderCell("fut",  C.fut,  C.futLight)}
              </div>

              {/* 질문(?) 행 */}
              <div style={{display:"grid", gridTemplateColumns:"32px 1fr 1fr 1fr"}}>
                <div style={{display:"flex", alignItems:"center", justifyContent:"center", background:"#f5f5f5", borderRight:"1px solid #e8e8e8"}}>
                  <span style={{fontSize:18, fontWeight:900, color:"#E65100"}}>?</span>
                </div>
                {renderCell("presQ", C.pres, C.presLight)}
                {renderCell("pastQ", C.past, C.pastLight)}
                {renderCell("futQ",  C.fut,  C.futLight)}
              </div>
            </div>

            {/* ? 입력 안내 */}
            <div style={{padding:"8px 14px", background:"#FFF8E1", borderTop:"1px solid #FFE082"}}>
              <div style={{fontSize:11, color:"#E65100", fontWeight:800}}>
                {vi?"⚠️ Hàng (?) — nhớ gõ dấu '?' ở cuối! Ví dụ: ~ㅂ니까?":en?"⚠️ (?) row — always end with '?'! e.g. ~ㅂ니까?":"⚠️ 물음표(?) 행은 반드시 끝에 '?'를 붙여 입력하세요! 예: ~ㅂ니까?"}
              </div>
            </div>

            {/* 정답 보기 버튼 */}
            {!tenseRevealed && (
              <div style={{padding:"16px"}}>
                <button onClick={() => setTenseRevealed(true)}
                  style={{width:"100%", background:`linear-gradient(135deg,${C.accent},#1B5E20)`, color:"white", border:"none", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>
                  {vi?"Xem đáp án 👀":en?"Show answers 👀":"정답 보기 👀"}
                </button>
              </div>
            )}
          </div>

          {/* 이전 / 다음 */}
          <div style={{display:"flex", gap:8}}>
            {tenseCardIdx > 0 && (
              <button onClick={() => { setTenseCardIdx(i=>i-1); setTenseRevealed(false); }}
                style={{flex:1, background:"white", border:`2px solid ${C.border}`, borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:700, color:C.accent, cursor:"pointer"}}>
                ← {vi?"Trước":en?"Prev":"이전"}
              </button>
            )}
            {tenseCardIdx < total - 1 ? (
              <button onClick={() => { setTenseCardIdx(i=>i+1); setTenseRevealed(false); }}
                style={{flex:1, background:`linear-gradient(135deg,${C.accent},#1B5E20)`, color:"white", border:"none", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>
                {vi?"Tiếp theo →":en?"Next →":"다음 카드 →"}
              </button>
            ) : (
              <button onClick={() => { setTenseCardIdx(0); setTenseRevealed(false); setTenseInputs({}); setStep("tense2"); }}
                style={{flex:1, background:"linear-gradient(135deg,#FF8F00,#E65100)", color:"white", border:"none", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>
                {vi?"Tiếp theo: Tense 2! 🚀":en?"Next: Tense 2! 🚀":"시제 2단원으로! 🚀"}
              </button>
            )}
          </div>

          <button onClick={() => setStep("pronResult")}
            style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>
            ← {vi?"Quay lại phát âm":en?"Back to pronunciation":"뒤로 (발음)"}
          </button>
        </div>
      </div>
    );
  }

  // ── 시제 2단원: ㄹ탈락 동사 + 있다/없다 계열 ──
  if (step === "tense2") {
    const vi = lang?.code === "vi";
    const en = lang?.code === "en";

    const TENSE2_CARDS = [
      { base:"살다",    meaning:{vi:"sống/ở",   en:"live"},
        pres:"삽니다",    presQ:"삽니까?",
        past:"살았습니다",pastQ:"살았습니까?",
        fut:"살 것입니다",  futQ:"살 것입니까?",
        rule:vi?"살다 → 살+ㅂ니다 → ㄹ탈락 → 삽니다":en?"살다 → 살+ㅂ니다 → ㄹ drop → 삽니다":"살다 → 살+ㅂ니다 → ㄹ탈락 → 삽니다" },
      { base:"알다",    meaning:{vi:"biết",     en:"know"},
        pres:"압니다",    presQ:"압니까?",
        past:"알았습니다",pastQ:"알았습니까?",
        fut:"알 것입니다",  futQ:"알 것입니까?",
        rule:vi?"알다 → 알+ㅂ니다 → ㄹ탈락 → 압니다":en?"알다 → 알+ㅂ니다 → ㄹ drop → 압니다":"알다 → 알+ㅂ니다 → ㄹ탈락 → 압니다" },
      { base:"만들다",  meaning:{vi:"làm/tạo",  en:"make"},
        pres:"만듭니다",  presQ:"만듭니까?",
        past:"만들었습니다",pastQ:"만들었습니까?",
        fut:"만들 것입니다",futQ:"만들 것입니까?",
        rule:vi?"만들다 → 만들+ㅂ니다 → ㄹ탈락 → 만듭니다":en?"만들다 → 만들+ㅂ니다 → ㄹ drop → 만듭니다":"만들다 → 만들+ㅂ니다 → ㄹ탈락 → 만듭니다" },
      { base:"팔다",    meaning:{vi:"bán",      en:"sell"},
        pres:"팝니다",    presQ:"팝니까?",
        past:"팔았습니다",pastQ:"팔았습니까?",
        fut:"팔 것입니다",  futQ:"팔 것입니까?",
        rule:vi?"팔다 → 팔+ㅂ니다 → ㄹ탈락 → 팝니다":en?"팔다 → 팔+ㅂ니다 → ㄹ drop → 팝니다":"팔다 → 팔+ㅂ니다 → ㄹ탈락 → 팝니다" },
      { base:"놀다",    meaning:{vi:"chơi",     en:"play"},
        pres:"놉니다",    presQ:"놉니까?",
        past:"놀았습니다",pastQ:"놀았습니까?",
        fut:"놀 것입니다",  futQ:"놀 것입니까?",
        rule:vi?"놀다 → 놀+ㅂ니다 → ㄹ탈락 → 놉니다":en?"놀다 → 놀+ㅂ니다 → ㄹ drop → 놉니다":"놀다 → 놀+ㅂ니다 → ㄹ탈락 → 놉니다" },
      { base:"열다",    meaning:{vi:"mở",       en:"open"},
        pres:"엽니다",    presQ:"엽니까?",
        past:"열었습니다",pastQ:"열었습니까?",
        fut:"열 것입니다",  futQ:"열 것입니까?",
        rule:vi?"열다 → 열+ㅂ니다 → ㄹ탈락 → 엽니다":en?"열다 → 열+ㅂ니다 → ㄹ drop → 엽니다":"열다 → 열+ㅂ니다 → ㄹ탈락 → 엽니다" },
      { base:"들다",    meaning:{vi:"cầm/nâng", en:"hold/lift"},
        pres:"듭니다",    presQ:"듭니까?",
        past:"들었습니다",pastQ:"들었습니까?",
        fut:"들 것입니다",  futQ:"들 것입니까?",
        rule:vi?"들다 → 들+ㅂ니다 → ㄹ탈락 → 듭니다":en?"들다 → 들+ㅂ니다 → ㄹ drop → 듭니다":"들다 → 들+ㅂ니다 → ㄹ탈락 → 듭니다" },
      { base:"울다",    meaning:{vi:"khóc",     en:"cry"},
        pres:"웁니다",    presQ:"웁니까?",
        past:"울었습니다",pastQ:"울었습니까?",
        fut:"울 것입니다",  futQ:"울 것입니까?",
        rule:vi?"울다 → 울+ㅂ니다 → ㄹ탈락 → 웁니다":en?"울다 → 울+ㅂ니다 → ㄹ drop → 웁니다":"울다 → 울+ㅂ니다 → ㄹ탈락 → 웁니다" },
      { base:"날다",    meaning:{vi:"bay",      en:"fly"},
        pres:"납니다",    presQ:"납니까?",
        past:"날았습니다",pastQ:"날았습니까?",
        fut:"날 것입니다",  futQ:"날 것입니까?",
        rule:vi?"날다 → 날+ㅂ니다 → ㄹ탈락 → 납니다":en?"날다 → 날+ㅂ니다 → ㄹ drop → 납니다":"날다 → 날+ㅂ니다 → ㄹ탈락 → 납니다" },
      { base:"있다",    meaning:{vi:"có/ở",     en:"exist/have"},
        pres:"있습니다",  presQ:"있습니까?",
        past:"있었습니다",pastQ:"있었습니까?",
        fut:"있을 것입니다",futQ:"있을 것입니까?",
        rule:vi?"있다 → 있+습니다 → 있습니다 (그대로!)":en?"있다 → 있+습니다 → 있습니다 (no change!)":"있다 → 있+습니다 → 있습니다 (그대로!)" },
      { base:"없다",    meaning:{vi:"không có", en:"not exist"},
        pres:"없습니다",  presQ:"없습니까?",
        past:"없었습니다",pastQ:"없었습니까?",
        fut:"없을 것입니다",futQ:"없을 것입니까?",
        rule:vi?"없다 → 없+습니다 → 없습니다 (그대로!)":en?"없다 → 없+습니다 → 없습니다 (no change!)":"없다 → 없+습니다 → 없습니다 (그대로!)" },
      { base:"재미있다",meaning:{vi:"thú vị",   en:"interesting"},
        pres:"재미있습니다",presQ:"재미있습니까?",
        past:"재미있었습니다",pastQ:"재미있었습니까?",
        fut:"재미있을 것입니다",futQ:"재미있을 것입니까?",
        rule:vi?"재미있다 → 재미있+습니다 → 재미있습니다 (그대로!)":en?"재미있다 → 재미있+습니다 → 재미있습니다 (no change!)":"재미있다 → 재미있+습니다 → 재미있습니다 (그대로!)" },
      { base:"맛있다",  meaning:{vi:"ngon",     en:"delicious"},
        pres:"맛있습니다",presQ:"맛있습니까?",
        past:"맛있었습니다",pastQ:"맛있었습니까?",
        fut:"맛있을 것입니다",futQ:"맛있을 것입니까?",
        rule:vi?"맛있다 → 맛있+습니다 → 맛있습니다 (그대로!)":en?"맛있다 → 맛있+습니다 → 맛있습니다 (no change!)":"맛있다 → 맛있+습니다 → 맛있습니다 (그대로!)" },
      { base:"되다",    meaning:{vi:"trở thành",en:"become"},
        pres:"됩니다",    presQ:"됩니까?",
        past:"됐습니다",  pastQ:"됐습니까?",
        fut:"될 것입니다",  futQ:"될 것입니까?",
        rule:vi?"되다 → 되+ㅂ니다 → ㄹ탈락 → 됩니다":en?"되다 → 되+ㅂ니다 → ㄹ drop → 됩니다":"되다 → 되+ㅂ니다 → ㄹ탈락 → 됩니다" },
      { base:"쉬다",    meaning:{vi:"nghỉ",     en:"rest"},
        pres:"쉽니다",    presQ:"쉽니까?",
        past:"쉬었습니다",pastQ:"쉬었습니까?",
        fut:"쉴 것입니다",  futQ:"쉴 것입니까?",
        rule:vi?"쉬다 → 쉬+ㅂ니다 → ㄹ탈락 → 쉽니다":en?"쉬다 → 쉬+ㅂ니다 → ㄹ drop → 쉽니다":"쉬다 → 쉬+ㅂ니다 → ㄹ탈락 → 쉽니다" },
      { base:"같다",    meaning:{vi:"giống",    en:"same/like"},
        pres:"같습니다",  presQ:"같습니까?",
        past:"같았습니다",pastQ:"같았습니까?",
        fut:"같을 것입니다",futQ:"같을 것입니까?",
        rule:vi?"같다 → 같+습니다 → 같습니다 (그대로!)":en?"같다 → 같+습니다 → 같습니다 (no change!)":"같다 → 같+습니다 → 같습니다 (그대로!)" },
      { base:"싸다",    meaning:{vi:"rẻ",       en:"cheap"},
        pres:"쌉니다",    presQ:"쌉니까?",
        past:"쌌습니다",  pastQ:"쌌습니까?",
        fut:"쌀 것입니다",  futQ:"쌀 것입니까?",
        rule:vi?"싸다 → 싸+ㅂ니다 → ㄹ탈락 → 쌉니다":en?"싸다 → 싸+ㅂ니다 → ㄹ drop → 쌉니다":"싸다 → 싸+ㅂ니다 → ㄹ탈락 → 쌉니다" },
      { base:"비싸다",  meaning:{vi:"đắt",      en:"expensive"},
        pres:"비쌉니다",  presQ:"비쌉니까?",
        past:"비쌌습니다",pastQ:"비쌌습니까?",
        fut:"비쌀 것입니다",futQ:"비쌀 것입니까?",
        rule:vi?"비싸다 → 비싸+ㅂ니다 → ㄹ탈락 → 비쌉니다":en?"비싸다 → 비싸+ㅂ니다 → ㄹ drop → 비쌉니다":"비싸다 → 비싸+ㅂ니다 → ㄹ탈락 → 비쌉니다" },
    ];

    const card = TENSE2_CARDS[tenseCardIdx];
    const total = TENSE2_CARDS.length;
    const meaning = vi ? card.meaning.vi : en ? card.meaning.en : card.meaning.en;

    const C = { bg:"linear-gradient(150deg,#EDE7F6,#D1C4E9)", accent:"#512DA8",
                 border:"#CE93D8",
                 pres:"#1565C0", past:"#6A1B9A", fut:"#E65100",
                 presLight:"#E3F2FD", pastLight:"#F3E5F5", futLight:"#FFF3E0" };

    const inp2 = tenseInputs[tenseCardIdx] || {};
    const setInp2 = (key, val) => setTenseInputs(prev => ({
      ...prev,
      [tenseCardIdx]: { ...(prev[tenseCardIdx]||{}), [key]: val }
    }));
    const check2 = (key) => {
      if (!tenseRevealed) return null;
      const userVal = (inp2[key]||"").trim().replace(/\s+/g,"");
      const correct = (card[key]||"").replace(/\s+/g,"");
      return userVal === correct ? "correct" : "wrong";
    };
    const renderCell2 = (key) => {
      const status = check2(key);
      const border = !tenseRevealed ? "2px solid #e0e0e0"
        : status==="correct" ? "2px solid #2E7D32"
        : "2px solid #C62828";
      return (
        <div style={{padding:"6px 4px", borderRight:"1px solid #f0f0f0"}}>
          <input
            type="text"
            value={inp2[key]||""}
            onChange={e => { if(!tenseRevealed) setInp2(key, e.target.value); }}
            onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Tab") e.stopPropagation(); }}
            readOnly={tenseRevealed}
            style={{width:"100%", border, borderRadius:6, padding:"6px 4px", fontSize:12, fontWeight:700,
              textAlign:"center", outline:"none", boxSizing:"border-box",
              color: !tenseRevealed ? "#333" : status==="correct" ? "#2E7D32" : "#C62828",
              background:"transparent", cursor: tenseRevealed?"default":"text"}}
            placeholder="..."
          />
          {tenseRevealed && status==="wrong" && (
            <div style={{fontSize:11, color:"#2E7D32", fontWeight:900, textAlign:"center", marginTop:2}}>
              → {card[key]}
            </div>
          )}
        </div>
      );
    };

    return (
      <div style={{minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:420}}>

          <div style={{fontSize:13, fontWeight:900, color:C.accent, marginBottom:2}}>
            📚 {vi?"시제 2단원 — Động từ ㄹ탈락 + 있다/없다":en?"Tense Unit 2 — ㄹ-drop Verbs + 있다/없다":"시제 2단원 — ㄹ탈락 동사 + 있다/없다 계열"}
          </div>
          <div style={{fontSize:12, color:"#555", background:"#EDE7F6", borderRadius:10, padding:"10px 14px", marginBottom:12, lineHeight:1.7}}>
            {vi
              ? <>📌 <b>ㄹ탈락 규칙</b>: khi gốc kết thúc bằng <b>ㄹ</b>, thêm <b>ㅂ니다</b> → <b>ㄹ bị mất</b>.<br/>Ví dụ: 살다 → 살+ㅂ니다 → <b>ㄹ탈락</b> → <b>삽니다</b></>
              : en
              ? <>📌 <b>ㄹ-drop rule</b>: when a stem ends in <b>ㄹ</b> and you add <b>ㅂ니다</b>, the <b>ㄹ drops</b>.<br/>Example: 살다 → 살+ㅂ니다 → <b>ㄹ drops</b> → <b>삽니다</b></>
              : <>📌 <b>ㄹ탈락 규칙</b>: 어간 끝이 <b>ㄹ</b>일 때 <b>ㅂ니다</b>를 붙이면 <b>ㄹ이 탈락</b>해요.<br/>예: 살다 → 살+ㅂ니다 → <b>ㄹ탈락</b> → <b>삽니다</b></>
            }
          </div>

          <div style={{display:"flex", gap:3, marginBottom:16}}>
            {TENSE2_CARDS.map((_,i) => (
              <div key={i} style={{flex:1, height:4, borderRadius:2, background:i<=tenseCardIdx?C.accent:"#ddd"}} />
            ))}
          </div>

          <div style={{background:"white", borderRadius:20, overflow:"hidden", boxShadow:"0 4px 20px rgba(81,45,168,.12)", marginBottom:16}}>

            <div style={{background:C.accent, padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
              <div style={{fontSize:28, fontWeight:900, color:"white"}}>{card.base}</div>
              <div style={{fontSize:14, color:"rgba(255,255,255,.85)", fontWeight:700}}>{meaning}</div>
            </div>

            <div style={{padding:"0"}}>
              <div style={{display:"grid", gridTemplateColumns:"32px 1fr 1fr 1fr", borderBottom:"1px solid #f0f0f0"}}>
                <div style={{background:"#f5f5f5"}} />
                <div style={{padding:"10px 0", textAlign:"center", fontSize:13, fontWeight:900, color:C.pres, background:C.presLight}}>
                  {vi?"Hiện tại":en?"Present":"현재"}
                </div>
                <div style={{padding:"10px 0", textAlign:"center", fontSize:13, fontWeight:900, color:C.past, background:C.pastLight}}>
                  {vi?"Quá khứ":en?"Past":"과거"}
                </div>
                <div style={{padding:"10px 0", textAlign:"center", fontSize:13, fontWeight:900, color:C.fut, background:C.futLight}}>
                  {vi?"Tương lai":en?"Future":"미래"}
                </div>
              </div>

              <div style={{display:"grid", gridTemplateColumns:"32px 1fr 1fr 1fr", borderBottom:"2px solid #e0e0e0"}}>
                <div style={{display:"flex", alignItems:"center", justifyContent:"center", background:"#f5f5f5", borderRight:"1px solid #e8e8e8"}}>
                  <span style={{fontSize:20, fontWeight:900, color:"#555"}}>.</span>
                </div>
                {renderCell2("pres")}
                {renderCell2("past")}
                {renderCell2("fut")}
              </div>

              <div style={{display:"grid", gridTemplateColumns:"32px 1fr 1fr 1fr"}}>
                <div style={{display:"flex", alignItems:"center", justifyContent:"center", background:"#f5f5f5", borderRight:"1px solid #e8e8e8"}}>
                  <span style={{fontSize:18, fontWeight:900, color:"#E65100"}}>?</span>
                </div>
                {renderCell2("presQ")}
                {renderCell2("pastQ")}
                {renderCell2("futQ")}
              </div>

              <div style={{padding:"8px 14px", background:"#FFF8E1", borderTop:"1px solid #FFE082"}}>
                <div style={{fontSize:11, color:"#E65100", fontWeight:800}}>
                  {vi?"⚠️ Hàng (?) — nhớ gõ dấu '?' ở cuối! Ví dụ: ~ㅂ니까?":en?"⚠️ (?) row — always end with '?'! e.g. ~ㅂ니까?":"⚠️ 물음표(?) 행은 반드시 끝에 '?'를 붙여 입력하세요! 예: ~ㅂ니까?"}
                </div>
              </div>

              {tenseRevealed && (
                <div style={{padding:"10px 14px", background:"#EDE7F6", borderTop:"1px solid #D1C4E9"}}>
                  <div style={{fontSize:12, color:C.accent, fontWeight:800}}>📌 {card.rule}</div>
                </div>
              )}

              {!tenseRevealed && (
                <div style={{padding:"16px"}}>
                  <button onClick={() => setTenseRevealed(true)}
                    style={{width:"100%", background:`linear-gradient(135deg,${C.accent},#311B92)`, color:"white", border:"none", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>
                    {vi?"Xem đáp án 👀":en?"Show answers 👀":"정답 보기 👀"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={{display:"flex", gap:8}}>
            {tenseCardIdx > 0 && (
              <button onClick={() => { setTenseCardIdx(i=>i-1); setTenseRevealed(false); }}
                style={{flex:1, background:"white", border:`2px solid ${C.border}`, borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:700, color:C.accent, cursor:"pointer"}}>
                ← {vi?"Trước":en?"Prev":"이전"}
              </button>
            )}
            {tenseCardIdx < total - 1 ? (
              <button onClick={() => { setTenseCardIdx(i=>i+1); setTenseRevealed(false); }}
                style={{flex:1, background:`linear-gradient(135deg,${C.accent},#311B92)`, color:"white", border:"none", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>
                {vi?"Tiếp theo →":en?"Next →":"다음 카드 →"}
              </button>
            ) : (
              <button onClick={() => { setTenseCardIdx(0); setTenseRevealed(false); setTenseInputs({}); setStep("tense3"); }}
                style={{flex:1, background:"linear-gradient(135deg,#FF8F00,#E65100)", color:"white", border:"none", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>
                {vi?"Tiếp theo: Tense 3! 🚀":en?"Next: Tense 3! 🚀":"시제 3단원으로! 🚀"}
              </button>
            )}
          </div>

          <button onClick={() => { setTenseCardIdx(0); setTenseRevealed(false); setStep("tense1"); }}
            style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>
            ← {vi?"Quay lại Tense 1":en?"Back to Tense 1":"뒤로 (시제 1단원)"}
          </button>
        </div>
      </div>
    );
  }

  if (step === "josa") {
    const vi = lang?.code === "vi";
    const en = lang?.code === "en";

    // ── 18개 어휘 (받침 없음 9 / 받침 있음 9) ──
    // ── 21개 어휘: 받침 없음/있음 분산 + 연관성 인접 배치 ──
    // 순서: 인칭대명사 → BTS/블랙핑크 → 인칭대명사2 → 지시/장소 → 음식/사물 → 사람/나라
    const VOCAB = [
      // [1] 1인칭 — 저(없) · 당신(있): 대화의 시작, 나↔너 쌍
      { word:"저",     hasBatchim:false, ex_topic:"저는 학생입니다.", ex_subj:"제가 먼저 갑니다.", ex_obj:"선생님이 저를 부르십니다.", ex_and:"저와 함께 공부합니다.", ex_or:null, ex_also:"저도 갑니다." },
      { word:"당신",   hasBatchim:true,  ex_topic:"당신은 학생입니까?", ex_subj:"당신이 맞습니다.", ex_obj:"저는 당신을 만납니다.", ex_and:"당신과 이야기합니다.", ex_or:null, ex_also:"당신도 갑니까?" },
      // [2] BTS/블랙핑크 — 정국(있) · 지수(없): 받침 있↔없 대비
      { word:"정국",   hasBatchim:true,  ex_topic:"정국은 가수입니다.", ex_subj:"정국이 노래합니다.", ex_obj:"저는 정국을 좋아합니다.", ex_and:"정국과 함께 공부합니다.", ex_or:null, ex_also:"정국도 좋습니다." },
      { word:"지수",   hasBatchim:false, ex_topic:"지수는 가수입니다.", ex_subj:"지수가 노래합니다.", ex_obj:"저는 지수를 좋아합니다.", ex_and:"지수와 함께 공부합니다.", ex_or:null, ex_also:"지수도 좋습니다." },
      // [3] 3인칭 — 그(없) · 그녀(없) · 그들(있): 인칭 계열 묶음
      { word:"그",     hasBatchim:false, ex_topic:"그는 선생님입니다.", ex_subj:"그가 옵니다.", ex_obj:"저는 그를 만납니다.", ex_and:"그와 공부합니다.", ex_or:null, ex_also:"그도 옵니다." },
      { word:"그녀",   hasBatchim:false, ex_topic:"그녀는 의사입니다.", ex_subj:"그녀가 옵니다.", ex_obj:"저는 그녀를 만납니다.", ex_and:"그녀와 이야기합니다.", ex_or:null, ex_also:"그녀도 옵니다." },
      { word:"그들",   hasBatchim:true,  ex_topic:"그들은 학생입니다.", ex_subj:"그들이 갑니다.", ex_obj:"저는 그들을 만납니다.", ex_and:"그들과 공부합니다.", ex_or:null, ex_also:"그들도 갑니다." },
      // [4] 복수 1인칭 — 우리(없): 그들과 대비
      { word:"우리",   hasBatchim:false, ex_topic:"우리는 친구입니다.", ex_subj:"우리가 갑니다.", ex_obj:"선생님이 우리를 도와주십니다.", ex_and:"우리와 함께 공부합니다.", ex_or:null, ex_also:"우리도 갑니다." },
      // [5] 지시대명사 — 이것(없) · 저것(있): 이↔저 쌍
      { word:"이것",   hasBatchim:true,  ex_topic:"이것은 책입니다.", ex_subj:"이것이 좋습니다.", ex_obj:"이것을 주십시오.", ex_and:null, ex_or:"이것이나 저것을 고르십시오.", ex_also:"이것도 있습니다." },
      { word:"저것",   hasBatchim:true,  ex_topic:"저것은 가방입니다.", ex_subj:"저것이 예쁩니다.", ex_obj:"저것을 보십시오.", ex_and:null, ex_or:"이것이나 저것을 고르십시오.", ex_also:"저것도 있습니다." },
      // [6] 장소대명사 — 여기(없) · 저기(있): 이↔저 장소 쌍
      { word:"여기",   hasBatchim:false, ex_topic:"여기는 학교입니다.", ex_subj:"여기가 좋습니다.", ex_obj:null, ex_and:null, ex_or:null, ex_also:"여기도 좋습니다." },
      { word:"저기",   hasBatchim:false, ex_topic:"저기는 병원입니다.", ex_subj:"저기가 좋습니다.", ex_obj:null, ex_and:null, ex_or:null, ex_also:"저기도 좋습니다." },
      // [7] 음식 쌍 — 사과(없) · 빵(있)
      { word:"사과",   hasBatchim:false, ex_topic:"사과는 맛있습니다.", ex_subj:"사과가 있습니다.", ex_obj:"사과를 먹습니다.", ex_and:"사과와 바나나가 있습니다.", ex_or:"사과나 바나나를 드십시오.", ex_also:"사과도 맛있습니다." },
      { word:"빵",     hasBatchim:true,  ex_topic:"빵은 맛있습니다.", ex_subj:"빵이 있습니다.", ex_obj:"빵을 먹습니다.", ex_and:"빵과 우유가 있습니다.", ex_or:"빵이나 밥을 먹습니다.", ex_also:"빵도 맛있습니다." },
      // [8] 음료/사물 쌍 — 커피(없) · 책(있)
      { word:"커피",   hasBatchim:false, ex_topic:"커피는 뜨겁습니다.", ex_subj:"커피가 있습니다.", ex_obj:"커피를 마십니다.", ex_and:"커피와 빵이 있습니다.", ex_or:"커피나 주스를 마십니다.", ex_also:"커피도 있습니다." },
      { word:"책",     hasBatchim:true,  ex_topic:"책은 재미있습니다.", ex_subj:"책이 있습니다.", ex_obj:"책을 읽습니다.", ex_and:"책과 연필이 있습니다.", ex_or:"책이나 연필을 삽니다.", ex_also:"책도 있습니다." },
      // [9] 자연물 — 꽃(없): 단독
      { word:"꽃",     hasBatchim:false, ex_topic:"꽃은 예쁩니다.", ex_subj:"꽃이 있습니다.", ex_obj:"꽃을 삽니다.", ex_and:null, ex_or:null, ex_also:"꽃도 좋습니다." },
      // [10] 사람 쌍 — 학생(있) · 선생님(있): 교실 관계 쌍
      { word:"학생",   hasBatchim:true,  ex_topic:"학생은 바쁩니다.", ex_subj:"학생이 공부합니다.", ex_obj:"선생님이 학생을 돕습니다.", ex_and:"학생과 선생님이 있습니다.", ex_or:null, ex_also:"학생도 쉽니다." },
      { word:"선생님", hasBatchim:true,  ex_topic:"선생님은 바쁩니다.", ex_subj:"선생님이 오십니다.", ex_obj:"저는 선생님을 만납니다.", ex_and:"선생님과 공부합니다.", ex_or:null, ex_also:"선생님도 가십니다." },
      // [11] 나라 — 한국(없): 마무리
      { word:"한국",   hasBatchim:false, ex_topic:"한국은 아름답습니다.", ex_subj:"한국이 좋습니다.", ex_obj:null, ex_and:null, ex_or:null, ex_also:"한국도 갑니다." },
    ];

    const COLS = [
      { key:"topic", label:vi?"Chủ đề":en?"Topic":"주제", josa_no:"는", josa_yes:"은" },
      { key:"subj",  label:vi?"Chủ ngữ":en?"Subject":"주어(주격)", josa_no:"가", josa_yes:"이" },
      { key:"obj",   label:vi?"Tân ngữ":en?"Object":"목적어", josa_no:"를", josa_yes:"을" },
      { key:"and",   label:vi?"Và":en?"And":"and (연결)", josa_no:"와", josa_yes:"과" },
      { key:"or",    label:vi?"Hoặc":en?"Or":"or (선택)", josa_no:"나", josa_yes:"이나" },
      { key:"also",  label:vi?"Cũng":en?"Also":"도 (함께)", josa_no:"도", josa_yes:"도" },
    ];

    // 의문대명사 데이터 (놀라운 한국어 방식: 주어/부사어/간접목적어/목적어/서술어)
    const QPRON = [
      { word:"누구", meaning:vi?"ai":en?"who":"사람",
        rows:[
          { role:vi?"Chủ ngữ":en?"Subject":"주어",                        form:"누가",        ex:"누가 BTS입니까?" },
          { role:vi?"Trạng ngữ":en?"Adverbial":"부사어",                   form:"누구와",      ex:"당신은 누구와 공부합니까?" },
          { role:vi?"Tân ngữ gián tiếp":en?"Indirect Obj":"간접목적어",    form:"누구에게",    ex:"당신은 누구에게 선물을 주었습니까?" },
          { role:vi?"Tân ngữ":en?"Object":"목적어",                        form:"누구를",      ex:"당신은 내일 누구를 만날 것입니까?" },
          { role:vi?"Vị ngữ":en?"Predicate":"서술어",                      form:"누구입니까?", ex:"저 사람은 누구입니까?" },
        ]
      },
      { word:"언제", meaning:vi?"khi nào":en?"when":"시간",
        rows:[
          { role:vi?"Chủ ngữ":en?"Subject":"주어",                        form:"언제가",      ex:"언제가 당신의 생일입니까?" },
          { role:vi?"Trạng ngữ":en?"Adverbial":"부사어(시간)",              form:"언제",        ex:"당신은 언제 한국에 갔습니까?" },
          { role:vi?"Vị ngữ":en?"Predicate":"서술어",                      form:"언제입니까?", ex:"회의는 언제입니까?" },
        ]
      },
      { word:"어디", meaning:vi?"ở đâu":en?"where":"장소",
        rows:[
          { role:vi?"Chủ ngữ":en?"Subject":"주어",                        form:"어디가",      ex:"어디가 제일 좋습니까?" },
          { role:vi?"Trạng ngữ":en?"Adverbial":"부사어(장소·존재)",         form:"어디에",      ex:"학교에 갑니다. → 당신은 어디에 갑니까?" },
          { role:vi?"Trạng ngữ":en?"Adverbial":"부사어(장소·행동)",         form:"어디에서",    ex:"학교에서 공부합니다. → 당신은 어디에서 공부합니까?" },
          { role:vi?"Vị ngữ":en?"Predicate":"서술어",                      form:"어디입니까?", ex:"도서관은 어디입니까?" },
        ]
      },
      { word:"무엇(뭐)", meaning:vi?"cái gì":en?"what":"사물",
        rows:[
          { role:vi?"Chủ ngữ":en?"Subject":"주어",                        form:"무엇이/뭐가", ex:"이것은 무엇입니까?" },
          { role:vi?"Tân ngữ":en?"Object":"목적어",                        form:"무엇을",      ex:"당신은 무엇을 공부합니까? (= 무슨 과목을 공부합니까?)" },
          { role:vi?"Tân ngữ":en?"Object":"목적어(구어)",                   form:"뭐를/뭘",     ex:"오늘 뭘 먹었습니까?" },
          { role:vi?"Vị ngữ":en?"Predicate":"서술어",                      form:"무엇입니까?", ex:"이것은 무엇입니까? (= 이게 뭐예요?)" },
        ]
      },
      { word:"왜", meaning:vi?"tại sao":en?"why":"이유",
        rows:[
          { role:vi?"Trạng ngữ":en?"Adverbial":"부사어(이유·기본)",         form:"왜",          ex:"당신은 왜 한국어를 공부합니까?" },
          { role:vi?"Trạng ngữ":en?"Adverbial":"부사어(시간+이유)",          form:"왜",          ex:"당신은 어제 왜 학교에 갔습니까?" },
          { role:vi?"Trạng ngữ":en?"Adverbial":"부사어(장소+이유)",          form:"왜",          ex:"당신은 왜 도서관에서 공부합니까?" },
          { role:vi?"Tân ngữ gián tiếp + Tân ngữ":en?"Indirect+Object":"간접목적어+목적어+이유", form:"왜", ex:"당신은 왜 친구에게 선물을 줍니까?" },
        ]
      },
    ];

    const selWord = josaSelWord;
    const setSelWord = setJosaSelWord;
    const showRule = josaShowRule;
    const setShowRule = setJosaShowRule;

    function speak(text) {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "ko-KR"; u.rate = 0.65;
      window.speechSynthesis.speak(u);
    }

    const vocab = selWord ? VOCAB.find(v => v.word === selWord) : null;

    // 행 공개 토글
    function toggleReveal(word, colKey) {
      const mapKey = word + "_" + colKey;
      setJosaRevealMap(prev => ({ ...prev, [mapKey]: !prev[mapKey] }));
    }
    function isRevealed(word, colKey) {
      return !!josaRevealMap[word + "_" + colKey];
    }

    return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#FFFBF0,#FFF3E0)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px 60px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />

        <div style={{width:"100%", maxWidth:420}}>
          {/* 헤더 */}
          <div style={{fontSize:13, color:"#aaa", textAlign:"center", marginBottom:4}}>
            {vi?"Bước 2/8 — Trợ từ & Đại từ":en?"Step 2/8 — Particles & Pronouns":"2단계/8단계 — 조사·대명사"}
          </div>
          <div style={{fontSize:18, fontWeight:900, color:"#E65100", textAlign:"center", marginBottom:4}}>
            🏷️ {vi?"Trợ từ tiếng Hàn":en?"Korean Particles":"조사 학습"}
          </div>
          <div style={{fontSize:12, color:"#888", textAlign:"center", marginBottom:14}}>
            {vi?"Chọn từ → nhấn ô để xem đáp án":en?"Pick a word → tap each cell to reveal":"어휘 선택 → 각 칸을 눌러서 확인해보세요"}
          </div>

          {/* 핵심 규칙 — 항상 표시 */}
          <div style={{background:"white", borderRadius:14, border:"2px solid #FFE0B2", marginBottom:14, overflow:"hidden"}}>
            <div style={{padding:"10px 12px 4px", display:"flex", alignItems:"center", gap:6}}>
              <span style={{fontSize:13, fontWeight:800, color:"#E65100"}}>📌 {vi?"Quy tắc cốt lõi":en?"Core Rule":"핵심 규칙 — 받침 유무"}</span>
            </div>
            <div style={{padding:"0 12px 12px"}}>
              <div style={{display:"grid", gridTemplateColumns:"1.2fr 1fr 1fr", gap:5, fontSize:12}}>
                <div style={{fontWeight:800, color:"#aaa", textAlign:"center", paddingBottom:4}}>기능</div>
                <div style={{fontWeight:800, color:"#4CAF50", textAlign:"center", paddingBottom:4}}>받침 없음</div>
                <div style={{fontWeight:800, color:"#2196F3", textAlign:"center", paddingBottom:4}}>받침 있음</div>
                {COLS.map(c=>(
                  <div key={c.key} style={{display:"contents"}}>
                    <div style={{color:"#666", textAlign:"center", padding:"3px 0", fontSize:11}}>{c.label}</div>
                    <div style={{fontWeight:900, color:"#4CAF50", textAlign:"center", background:"#F1F8E9", borderRadius:6, padding:"3px 0"}}>-{c.josa_no}</div>
                    <div style={{fontWeight:900, color:"#2196F3", textAlign:"center", background:"#E3F2FD", borderRadius:6, padding:"3px 0"}}>-{c.josa_yes}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 어휘 선택 그리드 */}
          <div style={{fontSize:13, fontWeight:700, color:"#E65100", marginBottom:8}}>
            📝 {vi?"Chọn một từ:":en?"Select a word:":"어휘를 선택하세요:"}
          </div>
          {(() => {
            // 현재 완료된 어휘 인덱스 계산 (모든 COLS 행이 정답 처리된 것)
            const completedIdx = VOCAB.reduce((max, v, i) => {
              const allDone = COLS.every(c => josaRevealMap[v.word+"_"+c.key+"_status"]==="correct");
              return allDone ? i : max;
            }, -1);
            const unlockedIdx = completedIdx + 1; // 현재 풀 수 있는 인덱스
            const selIdx = VOCAB.findIndex(v => v.word === selWord);
            return (
              <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6, marginBottom:14}}>
                {VOCAB.map((v, i) => {
                  const isSel = v.word === selWord;
                  const isDone = COLS.every(c => josaRevealMap[v.word+"_"+c.key+"_status"]==="correct");
                  const isUnlocked = i <= unlockedIdx;
                  return (
                    <button key={v.word}
                      onClick={()=>{ if(!isUnlocked) return; setSelWord(isSel ? null : v.word); }}
                      style={{
                        padding:"10px 4px", borderRadius:10,
                        border:`2px solid ${isSel?"#E65100":isDone?"#4CAF50":isUnlocked?(v.hasBatchim?"#90CAF9":"#A5D6A7"):"#ddd"}`,
                        background: isSel?"#E65100": isDone?"#E8F5E9": isUnlocked?(v.hasBatchim?"#E3F2FD":"#F1F8E9"):"#f8f8f8",
                        color: isSel?"white": isDone?"#2E7D32": isUnlocked?(v.hasBatchim?"#1565C0":"#2E7D32"):"#ccc",
                        fontWeight:900, fontSize:15, cursor:isUnlocked?"pointer":"default",
                        boxShadow: isSel?"0 2px 10px #E6510044":"none",
                        display:"flex", flexDirection:"column", alignItems:"center", gap:2
                      }}>
                      {isDone ? "✅" : isUnlocked ? v.word : "🔒"}
                      <div style={{fontSize:9, opacity:0.7}}>
                        {isDone ? v.word : isUnlocked ? (v.hasBatchim?(vi?"batchim":en?"batchim":"받침 있"):(vi?"không":en?"none":"받침 없")) : ""}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })()}

          {/* 결과 테이블 — 빈칸 클릭 공개 */}
          {vocab && (
            <div style={{background:"white", borderRadius:16, border:"2px solid #FFE0B2", overflow:"hidden", marginBottom:14}}>
              {/* 선택 어휘 헤더 */}
              <div style={{background: vocab.hasBatchim?"#E3F2FD":"#F1F8E9", padding:"12px 16px", display:"flex", alignItems:"center", gap:10}}>
                <span style={{fontSize:26, fontWeight:900, color: vocab.hasBatchim?"#1565C0":"#2E7D32"}}>{vocab.word}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:11, color:"#888"}}>
                    {vocab.hasBatchim
                      ? (vi?"Có batchim → 은·이·을·과·이나·도":en?"Has batchim → 은·이·을·과·이나·도":"받침 있음 → 은·이·을·과·이나·도")
                      : (vi?"Không batchim → 는·가·를·와·나·도":en?"No batchim → 는·가·를·와·나·도":"받침 없음 → 는·가·를·와·나·도")}
                  </div>
                  <div style={{fontSize:11, color:"#aaa", marginTop:2}}>
                    {vi?"Nhấn từng ô để xem":en?"Tap each row to reveal":"각 칸을 눌러 확인하세요 👇"}
                  </div>
                </div>
                <button onClick={()=>speak(vocab.word)}
                  style={{background:"#FF9800", border:"none", borderRadius:50, width:32, height:32, fontSize:15, cursor:"pointer", flexShrink:0}}>
                  🔊
                </button>
              </div>

              {/* 조사 행들 — 클릭 전: ?, 클릭 후: 형태+예문 */}
              {COLS.map(col => {
                const josa = vocab.hasBatchim ? col.josa_yes : col.josa_no;
                // 저+가(주격) → 제가 불규칙 예외처리
                const form = (vocab.word === "저" && col.key === "subj") ? "제가" : vocab.word + josa;
                // 정답 판정에도 제가 허용
                const correctAnswers = (vocab.word === "저" && col.key === "subj")
                  ? ["제가", "저가"]
                  : [form, josa];
                const exKey = "ex_" + col.key;
                const ex = vocab[exKey];
                const mapKey = vocab.word + "_" + col.key;
                const userInput = josaRevealMap[mapKey + "_input"] || "";
                const status = josaRevealMap[mapKey + "_status"] || "idle"; // idle | correct | wrong
                return (
                  <div key={col.key} style={{borderTop:"1px solid #FFF3E0", padding:"10px 14px"}}>
                    <div style={{display:"flex", alignItems:"center", gap:6, flexWrap:"wrap"}}>
                      {/* 기능 라벨 */}
                      <span style={{fontSize:10, color:"#aaa", minWidth:56, flexShrink:0}}>{col.label}</span>
                      {/* 입력칸 */}
                      <input
                        type="text"
                        value={userInput}
                        onChange={e => setJosaRevealMap(prev=>({...prev, [mapKey+"_input"]: e.target.value, [mapKey+"_status"]: "idle"}))}
                        onKeyDown={e=>{
                          if(e.key==="Enter"||e.key==="Tab") {
                            e.preventDefault();
                            const ans = (josaRevealMap[mapKey+"_input"]||"").trim();
                            if(correctAnswers.includes(ans)) {
                              setJosaRevealMap(prev=>({...prev,[mapKey+"_status"]:"correct"}));
                              if(ex) setTimeout(()=>speak(ex),200);
                            } else {
                              setJosaRevealMap(prev=>({...prev,[mapKey+"_status"]:"wrong"}));
                            }
                          }
                        }}
                        placeholder={vi?"Nhập vào...":en?"Type here...":vocab.word+"___"}
                        style={{
                          width:90, border:`2px solid ${status==="correct"?"#4CAF50":status==="wrong"?"#E53935":"#FFE0B2"}`,
                          borderRadius:8, padding:"5px 8px", fontSize:13, fontWeight:700,
                          outline:"none", background: status==="correct"?"#F1F8E9": status==="wrong"?"#FFF3E0":"white",
                          color: status==="correct"?"#2E7D32": status==="wrong"?"#E53935":"#333"
                        }}
                      />
                      <button onClick={()=>{
                        const ans = (josaRevealMap[mapKey+"_input"]||"").trim();
                        if(correctAnswers.includes(ans)) {
                          setJosaRevealMap(prev=>({...prev,[mapKey+"_status"]:"correct"}));
                          if(ex) setTimeout(()=>speak(ex),200);
                        } else {
                          setJosaRevealMap(prev=>({...prev,[mapKey+"_status"]:"wrong"}));
                        }
                      }} style={{background:"#FF9800", border:"none", borderRadius:8, padding:"5px 10px", fontSize:12, fontWeight:800, color:"white", cursor:"pointer", flexShrink:0}}>
                        {vi?"Kiểm tra":en?"Check":"확인"}
                      </button>
                      {/* 정답 공개 후 */}
                      {status==="correct" && ex && (
                        <div style={{width:"100%", marginTop:4, display:"flex", alignItems:"center", gap:6}}>
                          <span style={{fontSize:12, fontWeight:900, color:"#4CAF50"}}>✅ {form} (-{josa})</span>
                          <span style={{fontSize:12, color:"#555", flex:1}}>{ex}</span>
                          <button onClick={()=>speak(ex)} style={{background:"#FF9800", border:"none", borderRadius:50, width:26, height:26, fontSize:12, cursor:"pointer", flexShrink:0}}>🔊</button>
                        </div>
                      )}
                      {status==="correct" && !ex && (
                        <span style={{fontSize:12, fontWeight:900, color:"#4CAF50"}}>✅ {form} (-{josa})</span>
                      )}
                      {status==="wrong" && (
                        <span style={{fontSize:12, color:"#E53935", fontWeight:700}}>❌ {vi?"Thử lại!":en?"Try again!":"다시 도전!"}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 선택 안 했을 때 안내 */}
          {!vocab && (
            <div style={{background:"white", borderRadius:16, border:"2px dashed #FFE0B2", padding:"28px 20px", textAlign:"center", color:"#ccc", fontSize:14, marginBottom:14}}>
              {vi?"← Chọn một từ phía trên!":en?"← Pick a word above!":"← 위에서 어휘를 선택하세요!"}
            </div>
          )}

          {/* ── 의문대명사 섹션 (놀라운 한국어 방식) ── */}
          <div style={{background:"white", borderRadius:14, border:"2px solid #FFE0B2", overflow:"hidden", marginBottom:14}}>
            <div style={{background:"#FFF3E0", padding:"12px 16px", borderBottom:"1px solid #FFE0B2"}}>
              <div style={{fontSize:14, fontWeight:900, color:"#E65100"}}>❓ {vi?"Đại từ nghi vấn":en?"Question Pronouns":"의문 대명사"}</div>
              <div style={{fontSize:11, color:"#aaa", marginTop:2}}>
                {vi?"Xem cách dùng theo chức năng câu":en?"See usage by sentence function":"문장 성분별 사용법을 확인하세요"}
              </div>
            </div>
            {QPRON.map((qp, qi) => (
              <div key={qi} style={{borderTop: qi===0?"none":"1px solid #FFF3E0"}}>
                {/* 의문대명사 헤더 */}
                <div style={{padding:"10px 14px 4px", display:"flex", alignItems:"center", gap:8}}>
                  <span style={{fontSize:18, fontWeight:900, color:"#E65100"}}>{qp.word}</span>
                  <span style={{fontSize:11, color:"#888"}}>({qp.meaning})</span>
                  <button onClick={()=>speak(qp.word)}
                    style={{background:"#FF9800", border:"none", borderRadius:50, width:24, height:24, fontSize:11, cursor:"pointer", marginLeft:"auto"}}>🔊</button>
                </div>
                {/* 문장성분별 행 — 클릭하면 공개 */}
                {qp.rows.filter(r=>r.form).map((row, ri) => {
                  const qKey = "q_" + qi + "_" + ri;
                  const revealed = !!josaRevealMap[qKey];
                  return (
                    <div key={ri} style={{padding:"6px 14px 6px 24px", borderTop:"1px solid #FFF8F0"}}>
                      <div style={{display:"flex", alignItems:"flex-start", gap:8}}>
                        <span style={{fontSize:10, color:"#aaa", minWidth:64, paddingTop:6, flexShrink:0}}>{row.role}</span>
                        {revealed ? (
                          <div style={{flex:1}}>
                            <span style={{fontSize:14, fontWeight:800, color:"#FF9800"}}>{row.form}</span>
                            <div style={{fontSize:12, color:"#555", marginTop:3, lineHeight:1.5}}>{row.ex}</div>
                          </div>
                        ) : (
                          <button onClick={()=>{ setJosaRevealMap(prev=>({...prev,[qKey]:true})); setTimeout(()=>speak(row.ex),200); }}
                            style={{background:"#FFF3E0", border:"2px dashed #FFD54F", borderRadius:8, padding:"5px 18px", fontSize:15, fontWeight:900, color:"#FFB300", cursor:"pointer", marginTop:2}}>
                            ?
                          </button>
                        )}
                        {revealed && (
                          <button onClick={()=>speak(row.ex)}
                            style={{background:"#FF9800", border:"none", borderRadius:50, width:24, height:24, fontSize:11, cursor:"pointer", flexShrink:0, marginTop:4}}>🔊</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* 테스트 버튼 */}
          <button onClick={async()=>{
            setJosaTestAnswers({}); setJosaTestResult(null); setJosaTestQuestions([]);
            setJosaSTTMap({}); setJosaListeningKey(null);
            setJosaTestLoading(true);
            setStep("testJosa");
            try {
              const res = await fetch("https://api.anthropic.com/v1/messages",{
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify({
                  model:"claude-sonnet-4-20250514",
                  max_tokens:900,
                  messages:[{role:"user", content:`한국어 초급 조사 빈칸 채우기 12문제를 만들어주세요.
배운 조사: 은/는(주제) 이/가(주격) 을/를(목적격) 와/과(연결) 나/이나(선택) 도(동반)
의문대명사: 누구/누가·언제·어디·무엇(뭐)·왜
규칙: 초급 어휘만, 받침 유무 구분 골고루, ___ 빈칸, 정답은 조사 1개
출력: JSON만 {"questions":[{"id":1,"sentence":"저___ 학생입니다.","answer":"는","hint":"받침 없음 → 주제 조사"}]}
힌트는 반드시 '받침 없음 → ...' 또는 '받침 있음 → ...' 형식으로 작성`}]
                })
              });
              const data = await res.json();
              const text = data.content?.[0]?.text || "";
              const clean = text.replace(/```json|```/g,"").trim();
              const parsed = JSON.parse(clean);
              setJosaTestQuestions(parsed.questions || []);
            } catch {
              setJosaTestQuestions([
                {id:1, sentence:"저___ 학생이에요.",      answer:"는",   hint:"받침 없음 → 주제 조사"},
                {id:2, sentence:"정국___ 가수예요.",       answer:"은",   hint:"받침 있음 → 주제 조사"},
                {id:3, sentence:"지수___ 노래해요.",       answer:"가",   hint:"받침 없음 → 주격 조사"},
                {id:4, sentence:"학생___ 공부해요.",       answer:"이",   hint:"받침 있음 → 주격 조사"},
                {id:5, sentence:"커피___ 마셔요.",         answer:"를",   hint:"받침 없음 → 목적격"},
                {id:6, sentence:"빵___ 먹어요.",           answer:"을",   hint:"받침 있음 → 목적격"},
                {id:7, sentence:"사과___ 바나나가 있어요.", answer:"와",  hint:"받침 없음 → 연결(and)"},
                {id:8, sentence:"빵___ 우유가 있어요.",    answer:"과",   hint:"받침 있음 → 연결(and)"},
                {id:9, sentence:"커피___ 주스를 마셔요.",  answer:"나",   hint:"받침 없음 → 선택(or)"},
                {id:10,sentence:"빵___ 밥을 먹어요.",      answer:"이나", hint:"받침 있음 → 선택(or)"},
                {id:11,sentence:"저___ 갈게요.",           answer:"도",   hint:"동반 조사"},
                {id:12,sentence:"___ 예요? (사람)",        answer:"누구", hint:"의문대명사 — 사람"},
              ]);
            }
            setJosaTestLoading(false);
          }}
            style={{width:"100%", background:"linear-gradient(135deg,#FF6B35,#E64A00)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", boxShadow:"0 4px 16px #FF6B3544"}}>
            📝 {vi?"Làm bài kiểm tra!":en?"Take the test!":"조사·대명사 테스트! 📝"}
          </button>
          <button onClick={()=>{setStep("pronunciation"); setPronStep(7);}}
            style={{marginTop:12, background:"none", border:"none", color:"#ccc", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>
            ← {vi?"Quay lại":en?"Back":"뒤로"}
          </button>
        </div>
      </div>
    );
  }





  // ── 시제 3단원: ㅂ불규칙 + 으탈락 형용사 ──
  if (step === "tense3") {
    const vi = lang?.code === "vi";
    const en = lang?.code === "en";

    const TENSE3_CARDS = [
      // ── ㅂ불규칙 동사/형용사 ──
      { base:"돕다",    meaning:{vi:"giúp đỡ",    en:"help"},
        pres:"돕습니다",   presQ:"돕습니까?",
        past:"도왔습니다",  pastQ:"도왔습니까?",
        fut:"도울 것입니다",futQ:"도울 것입니까?",
        rule:vi?"돕다 → 도+아서 → ㅂ탈락+오 → 도왔습니다":en?"돕다 → ㅂ drops → 도+와/았 → 도왔습니다":"돕다 → ㅂ탈락 → 도+아서 → 도왔습니다",
        type:"ㅂ불규칙" },
      { base:"눕다",    meaning:{vi:"nằm xuống",  en:"lie down"},
        pres:"눕습니다",   presQ:"눕습니까?",
        past:"누웠습니다",  pastQ:"누웠습니까?",
        fut:"누울 것입니다",futQ:"누울 것입니까?",
        rule:vi?"눕다 → ㅂ탈락 → 누+워서 → 누웠습니다":en?"눕다 → ㅂ drops → 누+워/었 → 누웠습니다":"눕다 → ㅂ탈락 → 누+워서 → 누웠습니다",
        type:"ㅂ불규칙" },
      { base:"쉽다",    meaning:{vi:"dễ",         en:"easy"},
        pres:"쉽습니다",   presQ:"쉽습니까?",
        past:"쉬웠습니다",  pastQ:"쉬웠습니까?",
        fut:"쉬울 것입니다",futQ:"쉬울 것입니까?",
        rule:vi?"쉽다 → ㅂ탈락 → 쉬+워서 → 쉬웠습니다":en?"쉽다 → ㅂ drops → 쉬+워/었 → 쉬웠습니다":"쉽다 → ㅂ탈락 → 쉬+워서 → 쉬웠습니다",
        type:"ㅂ불규칙" },
      { base:"어렵다",  meaning:{vi:"khó",        en:"difficult"},
        pres:"어렵습니다", presQ:"어렵습니까?",
        past:"어려웠습니다",pastQ:"어려웠습니까?",
        fut:"어려울 것입니다",futQ:"어려울 것입니까?",
        rule:vi?"어렵다 → ㅂ탈락 → 어려+워서 → 어려웠습니다":en?"어렵다 → ㅂ drops → 어려+워/었 → 어려웠습니다":"어렵다 → ㅂ탈락 → 어려+워서 → 어려웠습니다",
        type:"ㅂ불규칙" },
      // ── 으탈락 형용사 ──
      { base:"크다",    meaning:{vi:"to/lớn",    en:"big"},
        pres:"큽니다",     presQ:"큽니까?",
        past:"컸습니다",   pastQ:"컸습니까?",
        fut:"클 것입니다",  futQ:"클 것입니까?",
        rule:vi?"크다 → 으탈락 → 크+아서 → 컸습니다":en?"크다 → 으 drops → 크+아/어 → 컸습니다":"크다 → 으탈락 → 크+아서 → 컸습니다",
        type:"으탈락" },
      { base:"기쁘다",  meaning:{vi:"vui mừng",  en:"happy/glad"},
        pres:"기쁩니다",   presQ:"기쁩니까?",
        past:"기뻤습니다",  pastQ:"기뻤습니까?",
        fut:"기쁠 것입니다",futQ:"기쁠 것입니까?",
        rule:vi?"기쁘다 → 으탈락 → 기쁘+어서 → 기뻤습니다":en?"기쁘다 → 으 drops → 기쁘+어/었 → 기뻤습니다":"기쁘다 → 으탈락 → 기쁘+어서 → 기뻤습니다",
        type:"으탈락" },
      { base:"예쁘다",  meaning:{vi:"đẹp",       en:"pretty"},
        pres:"예쁩니다",   presQ:"예쁩니까?",
        past:"예뻤습니다",  pastQ:"예뻤습니까?",
        fut:"예쁠 것입니다",futQ:"예쁠 것입니까?",
        rule:vi?"예쁘다 → 으탈락 → 예쁘+어서 → 예뻤습니다":en?"예쁘다 → 으 drops → 예쁘+어/었 → 예뻤습니다":"예쁘다 → 으탈락 → 예쁘+어서 → 예뻤습니다",
        type:"으탈락" },
      { base:"슬프다",  meaning:{vi:"buồn",      en:"sad"},
        pres:"슬픕니다",   presQ:"슬픕니까?",
        past:"슬펐습니다",  pastQ:"슬펐습니까?",
        fut:"슬플 것입니다",futQ:"슬플 것입니까?",
        rule:vi?"슬프다 → 으탈락 → 슬프+어서 → 슬펐습니다":en?"슬프다 → 으 drops → 슬프+어/었 → 슬펐습니다":"슬프다 → 으탈락 → 슬프+어서 → 슬펐습니다",
        type:"으탈락" },
      { base:"바쁘다",  meaning:{vi:"bận",       en:"busy"},
        pres:"바쁩니다",   presQ:"바쁩니까?",
        past:"바빴습니다",  pastQ:"바빴습니까?",
        fut:"바쁠 것입니다",futQ:"바쁠 것입니까?",
        rule:vi?"바쁘다 → 으탈락 → 바쁘+아서 → 바빴습니다":en?"바쁘다 → 으 drops → 바쁘+아/었 → 바빴습니다":"바쁘다 → 으탈락 → 바쁘+아서 → 바빴습니다",
        type:"으탈락" },
      { base:"아프다",  meaning:{vi:"đau/ốm",   en:"sick/painful"},
        pres:"아픕니다",   presQ:"아픕니까?",
        past:"아팠습니다",  pastQ:"아팠습니까?",
        fut:"아플 것입니다",futQ:"아플 것입니까?",
        rule:vi?"아프다 → 으탈락 → 아프+아서 → 아팠습니다":en?"아프다 → 으 drops → 아프+아/었 → 아팠습니다":"아프다 → 으탈락 → 아프+아서 → 아팠습니다",
        type:"으탈락" },
    ];

    const card = TENSE3_CARDS[tenseCardIdx];
    const total = TENSE3_CARDS.length;
    const meaning = vi ? card.meaning.vi : en ? card.meaning.en : card.meaning.en;

    const C = { bg:"linear-gradient(150deg,#FFF3E0,#FFE0B2)", accent:"#E65100",
                 border:"#FFCC80",
                 pres:"#1565C0", past:"#6A1B9A", fut:"#2E7D32",
                 presLight:"#E3F2FD", pastLight:"#F3E5F5", futLight:"#E8F5E9" };

    const typeBadge = card.type === "ㅂ불규칙"
      ? { bg:"#FF6B35", label: vi?"ㅂ불규칙":en?"ㅂ-irregular":"ㅂ불규칙" }
      : { bg:"#512DA8", label: vi?"으탈락":en?"으-drop":"으탈락" };

    const inp3 = tenseInputs[tenseCardIdx] || {};
    const setInp3 = (key, val) => setTenseInputs(prev => ({
      ...prev,
      [tenseCardIdx]: { ...(prev[tenseCardIdx]||{}), [key]: val }
    }));
    const check3 = (key) => {
      if (!tenseRevealed) return null;
      const userVal = (inp3[key]||"").trim().replace(/\s+/g,"");
      const correct = (card[key]||"").replace(/\s+/g,"");
      return userVal === correct ? "correct" : "wrong";
    };
    const renderCell3 = (key) => {
      const status = check3(key);
      const border = !tenseRevealed ? "2px solid #e0e0e0"
        : status==="correct" ? "2px solid #2E7D32"
        : "2px solid #C62828";
      return (
        <div style={{padding:"6px 4px", borderRight:"1px solid #f0f0f0"}}>
          <input
            type="text"
            value={inp3[key]||""}
            onChange={e => { if(!tenseRevealed) setInp3(key, e.target.value); }}
            onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Tab") e.stopPropagation(); }}
            readOnly={tenseRevealed}
            style={{width:"100%", border, borderRadius:6, padding:"6px 4px", fontSize:12, fontWeight:700,
              textAlign:"center", outline:"none", boxSizing:"border-box",
              color: !tenseRevealed ? "#333" : status==="correct" ? "#2E7D32" : "#C62828",
              background:"transparent", cursor: tenseRevealed?"default":"text"}}
            placeholder="..."
          />
          {tenseRevealed && status==="wrong" && (
            <div style={{fontSize:11, color:"#2E7D32", fontWeight:900, textAlign:"center", marginTop:2}}>
              → {card[key]}
            </div>
          )}
        </div>
      );
    };

    return (
      <div style={{minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:420}}>

          <div style={{fontSize:13, fontWeight:900, color:C.accent, marginBottom:2}}>
            📚 {vi?"시제 3단원 — ㅂ불규칙 + 으탈락 형용사":en?"Tense Unit 3 — ㅂ-irregular + 으-drop":"시제 3단원 — ㅂ불규칙 + 으탈락 형용사"}
          </div>
          <div style={{fontSize:12, color:"#555", background:"#FFF3E0", borderRadius:10, padding:"10px 14px", marginBottom:12, lineHeight:1.7}}>
            {vi
              ? <><b>🔶 ㅂ불규칙</b>: gốc kết thúc bằng <b>ㅂ</b> → <b>ㅂ bị mất</b>, thêm <b>오/우</b><br/>예: 돕다 → 도<b>왔</b>습니다 / 눕다 → 누<b>웠</b>습니다<br/><b>🔷 으탈락</b>: gốc kết thúc bằng <b>으</b> → <b>으 bị mất</b> trước 아/어<br/>예: 크다 → <b>컸</b>습니다 / 예쁘다 → <b>예뻤</b>습니다</>
              : en
              ? <><b>🔶 ㅂ-irregular</b>: stem ending in <b>ㅂ</b> → <b>ㅂ drops</b>, add <b>오/우</b><br/>e.g. 돕다 → 도<b>왔</b>습니다 / 눕다 → 누<b>웠</b>습니다<br/><b>🔷 으-drop</b>: stem ending in <b>으</b> → <b>으 drops</b> before 아/어<br/>e.g. 크다 → <b>컸</b>습니다 / 예쁘다 → <b>예뻤</b>습니다</>
              : <><b>🔶 ㅂ불규칙</b>: 어간 끝 <b>ㅂ</b> → <b>ㅂ탈락</b> + <b>오/우</b> 결합<br/>예: 돕다 → 도<b>왔</b>습니다 / 눕다 → 누<b>웠</b>습니다<br/><b>🔷 으탈락</b>: 어간 끝 <b>으</b> → 아/어 앞에서 <b>으탈락</b><br/>예: 크다 → <b>컸</b>습니다 / 예쁘다 → <b>예뻤</b>습니다</>
            }
          </div>

          <div style={{display:"flex", gap:3, marginBottom:16}}>
            {TENSE3_CARDS.map((_,i) => (
              <div key={i} style={{flex:1, height:4, borderRadius:2, background:i<=tenseCardIdx?C.accent:"#ddd"}} />
            ))}
          </div>

          <div style={{background:"white", borderRadius:20, overflow:"hidden", boxShadow:"0 4px 20px rgba(230,81,0,.12)", marginBottom:16}}>

            <div style={{background:C.accent, padding:"16px 20px"}}>
              <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6}}>
                <div style={{fontSize:28, fontWeight:900, color:"white"}}>{card.base}</div>
                <div style={{fontSize:14, color:"rgba(255,255,255,.85)", fontWeight:700}}>{meaning}</div>
              </div>
              <div style={{display:"inline-block", background:typeBadge.bg, borderRadius:20, padding:"3px 12px", fontSize:12, fontWeight:900, color:"white"}}>
                {typeBadge.label}
              </div>
            </div>

            <div style={{padding:"0"}}>
              <div style={{display:"grid", gridTemplateColumns:"32px 1fr 1fr 1fr", borderBottom:"1px solid #f0f0f0"}}>
                <div style={{background:"#f5f5f5"}} />
                <div style={{padding:"10px 0", textAlign:"center", fontSize:13, fontWeight:900, color:C.pres, background:C.presLight}}>
                  {vi?"Hiện tại":en?"Present":"현재"}
                </div>
                <div style={{padding:"10px 0", textAlign:"center", fontSize:13, fontWeight:900, color:C.past, background:C.pastLight}}>
                  {vi?"Quá khứ":en?"Past":"과거"}
                </div>
                <div style={{padding:"10px 0", textAlign:"center", fontSize:13, fontWeight:900, color:C.fut, background:C.futLight}}>
                  {vi?"Tương lai":en?"Future":"미래"}
                </div>
              </div>

              <div style={{display:"grid", gridTemplateColumns:"32px 1fr 1fr 1fr", borderBottom:"2px solid #e0e0e0"}}>
                <div style={{display:"flex", alignItems:"center", justifyContent:"center", background:"#f5f5f5", borderRight:"1px solid #e8e8e8"}}>
                  <span style={{fontSize:20, fontWeight:900, color:"#555"}}>.</span>
                </div>
                {renderCell3("pres")}
                {renderCell3("past")}
                {renderCell3("fut")}
              </div>

              <div style={{display:"grid", gridTemplateColumns:"32px 1fr 1fr 1fr"}}>
                <div style={{display:"flex", alignItems:"center", justifyContent:"center", background:"#f5f5f5", borderRight:"1px solid #e8e8e8"}}>
                  <span style={{fontSize:18, fontWeight:900, color:"#E65100"}}>?</span>
                </div>
                {renderCell3("presQ")}
                {renderCell3("pastQ")}
                {renderCell3("futQ")}
              </div>

              <div style={{padding:"8px 14px", background:"#FFF8E1", borderTop:"1px solid #FFE082"}}>
                <div style={{fontSize:11, color:"#E65100", fontWeight:800}}>
                  {vi?"⚠️ Hàng (?) — nhớ gõ dấu '?' ở cuối! Ví dụ: ~ㅂ니까?":en?"⚠️ (?) row — always end with '?'! e.g. ~ㅂ니까?":"⚠️ 물음표(?) 행은 반드시 끝에 '?'를 붙여 입력하세요! 예: ~ㅂ니까?"}
                </div>
              </div>

              {tenseRevealed && (
                <div style={{padding:"10px 14px", background:"#FFF3E0", borderTop:"1px solid #FFE0B2"}}>
                  <div style={{fontSize:12, color:C.accent, fontWeight:800}}>📌 {card.rule}</div>
                </div>
              )}

              {!tenseRevealed && (
                <div style={{padding:"16px"}}>
                  <button onClick={() => setTenseRevealed(true)}
                    style={{width:"100%", background:`linear-gradient(135deg,${C.accent},#BF360C)`, color:"white", border:"none", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>
                    {vi?"Xem đáp án 👀":en?"Show answers 👀":"정답 보기 👀"}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={{display:"flex", gap:8}}>
            {tenseCardIdx > 0 && (
              <button onClick={() => { setTenseCardIdx(i=>i-1); setTenseRevealed(false); }}
                style={{flex:1, background:"white", border:`2px solid ${C.border}`, borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:700, color:C.accent, cursor:"pointer"}}>
                ← {vi?"Trước":en?"Prev":"이전"}
              </button>
            )}
            {tenseCardIdx < total - 1 ? (
              <button onClick={() => { setTenseCardIdx(i=>i+1); setTenseRevealed(false); }}
                style={{flex:1, background:`linear-gradient(135deg,${C.accent},#BF360C)`, color:"white", border:"none", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>
                {vi?"Tiếp theo →":en?"Next →":"다음 카드 →"}
              </button>
            ) : (
              <button onClick={() => { setTenseCardIdx(0); setTenseRevealed(false); setTenseInputs({}); setStep("tense4"); }}
                style={{flex:1, background:"linear-gradient(135deg,#1565C0,#0D47A1)", color:"white", border:"none", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>
                {vi?"Tiếp theo: Tense 4! 🚀":en?"Next: Tense 4! 🚀":"시제 4단원으로! 🚀"}
              </button>
            )}
          </div>

          <button onClick={() => { setTenseCardIdx(0); setTenseRevealed(false); setStep("tense2"); }}
            style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>
            ← {vi?"Quay lại Tense 2":en?"Back to Tense 2":"뒤로 (시제 2단원)"}
          </button>
        </div>
      </div>
    );
  }

  // ── 시제 4단원: ㄷ불규칙 + 르불규칙 + ㅅ불규칙 ──
  if (step === "tense4") {
    const vi = lang?.code === "vi";
    const en = lang?.code === "en";

    const TENSE4_CARDS = [
      // ── ㄷ불규칙 ──
      { base:"걷다",  meaning:{vi:"đi bộ",    en:"walk"},
        pres:"걷습니다",  presQ:"걷습니까?",
        past:"걸었습니다", pastQ:"걸었습니까?",
        fut:"걸을 것입니다",futQ:"걸을 것입니까?",
        rule:vi?"걷다 → ㄷ불규칙 → 걸+어서 → 걸었습니다":en?"걷다 → ㄷ→ㄹ irregular → 걸었습니다":"걷다 → ㄷ불규칙 → ㄷ이 ㄹ로 바뀜 → 걸었습니다",
        type:"ㄷ불규칙" },
      { base:"듣다",  meaning:{vi:"nghe",     en:"listen"},
        pres:"듣습니다",  presQ:"듣습니까?",
        past:"들었습니다", pastQ:"들었습니까?",
        fut:"들을 것입니다",futQ:"들을 것입니까?",
        rule:vi?"듣다 → ㄷ불규칙 → 들+어서 → 들었습니다":en?"듣다 → ㄷ→ㄹ irregular → 들었습니다":"듣다 → ㄷ불규칙 → ㄷ이 ㄹ로 바뀜 → 들었습니다",
        type:"ㄷ불규칙" },
      { base:"묻다",  meaning:{vi:"hỏi",      en:"ask"},
        pres:"묻습니다",  presQ:"묻습니까?",
        past:"물었습니다", pastQ:"물었습니까?",
        fut:"물을 것입니다",futQ:"물을 것입니까?",
        rule:vi?"묻다 → ㄷ불규칙 → 물+어서 → 물었습니다":en?"묻다 → ㄷ→ㄹ irregular → 물었습니다":"묻다 → ㄷ불규칙 → ㄷ이 ㄹ로 바뀜 → 물었습니다",
        type:"ㄷ불규칙" },
      // ── 르불규칙 ──
      { base:"모르다", meaning:{vi:"không biết",en:"not know"},
        pres:"모릅니다",  presQ:"모릅니까?",
        past:"몰랐습니다", pastQ:"몰랐습니까?",
        fut:"모를 것입니다",futQ:"모를 것입니까?",
        rule:vi?"모르다 → 르불규칙 → 모르+아 → ㄹ두개 → 몰랐습니다":en?"모르다 → 르 irregular → ㄹ doubles → 몰랐습니다":"모르다 → 르불규칙 → 모르+아 → ㄹ이 두 개 → 몰랐습니다",
        type:"르불규칙" },
      { base:"빠르다", meaning:{vi:"nhanh",    en:"fast"},
        pres:"빠릅니다",  presQ:"빠릅니까?",
        past:"빨랐습니다", pastQ:"빨랐습니까?",
        fut:"빠를 것입니다",futQ:"빠를 것입니까?",
        rule:vi?"빠르다 → 르불규칙 → 빠르+아 → ㄹ두개 → 빨랐습니다":en?"빠르다 → 르 irregular → ㄹ doubles → 빨랐습니다":"빠르다 → 르불규칙 → 빠르+아 → ㄹ이 두 개 → 빨랐습니다",
        type:"르불규칙" },
      { base:"다르다", meaning:{vi:"khác",     en:"different"},
        pres:"다릅니다",  presQ:"다릅니까?",
        past:"달랐습니다", pastQ:"달랐습니까?",
        fut:"다를 것입니다",futQ:"다를 것입니까?",
        rule:vi?"다르다 → 르불규칙 → 다르+아 → ㄹ두개 → 달랐습니다":en?"다르다 → 르 irregular → ㄹ doubles → 달랐습니다":"다르다 → 르불규칙 → 다르+아 → ㄹ이 두 개 → 달랐습니다",
        type:"르불규칙" },
      // ── ㅅ불규칙 (쓰다·끄다는 으탈락 동사) ──
      { base:"쓰다",  meaning:{vi:"viết/dùng", en:"write/use"},
        pres:"씁니다",    presQ:"씁니까?",
        past:"썼습니다",  pastQ:"썼습니까?",
        fut:"쓸 것입니다", futQ:"쓸 것입니까?",
        rule:vi?"쓰다 → 으탈락 → 쓰+어 → 썼습니다":en?"쓰다 → 으-drop → 쓰+어 → 썼습니다":"쓰다 → 으탈락 → 쓰+어 → 썼습니다",
        type:"으탈락" },
      { base:"끄다",  meaning:{vi:"tắt",      en:"turn off"},
        pres:"끕니다",    presQ:"끕니까?",
        past:"껐습니다",  pastQ:"껐습니까?",
        fut:"끌 것입니다", futQ:"끌 것입니까?",
        rule:vi?"끄다 → 으탈락 → 끄+어 → 껐습니다":en?"끄다 → 으-drop → 끄+어 → 껐습니다":"끄다 → 으탈락 → 끄+어 → 껐습니다",
        type:"으탈락" },
    ];

    const card = TENSE4_CARDS[tenseCardIdx];
    const total = TENSE4_CARDS.length;
    const meaning = vi ? card.meaning.vi : en ? card.meaning.en : card.meaning.en;

    const C = { bg:"linear-gradient(150deg,#E8F5E9,#C8E6C9)", accent:"#1B5E20",
                 border:"#A5D6A7",
                 pres:"#1565C0", past:"#6A1B9A", fut:"#E65100",
                 presLight:"#E3F2FD", pastLight:"#F3E5F5", futLight:"#FFF3E0" };

    const typeBadge = card.type === "ㄷ불규칙"
      ? { bg:"#1565C0", label: vi?"ㄷ불규칙":en?"ㄷ-irregular":"ㄷ불규칙" }
      : card.type === "르불규칙"
      ? { bg:"#6A1B9A", label: vi?"르불규칙":en?"르-irregular":"르불규칙" }
      : { bg:"#E65100", label: vi?"으탈락(동사)":en?"으-drop(verb)":"으탈락(동사)" };

    const inp4 = tenseInputs[tenseCardIdx] || {};
    const setInp4 = (key, val) => setTenseInputs(prev => ({
      ...prev,
      [tenseCardIdx]: { ...(prev[tenseCardIdx]||{}), [key]: val }
    }));
    const check4 = (key) => {
      if (!tenseRevealed) return null;
      const userVal = (inp4[key]||"").trim().replace(/\s+/g,"");
      const correct = (card[key]||"").replace(/\s+/g,"");
      return userVal === correct ? "correct" : "wrong";
    };
    const renderCell4 = (key) => {
      const status = check4(key);
      const border = !tenseRevealed ? "2px solid #e0e0e0"
        : status==="correct" ? "2px solid #2E7D32" : "2px solid #C62828";
      return (
        <div style={{padding:"6px 4px", borderRight:"1px solid #f0f0f0"}}>
          <input type="text" value={inp4[key]||""}
            onChange={e => { if(!tenseRevealed) setInp4(key, e.target.value); }}
            onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Tab") e.stopPropagation(); }}
            readOnly={tenseRevealed}
            style={{width:"100%", border, borderRadius:6, padding:"6px 4px", fontSize:12, fontWeight:700,
              textAlign:"center", outline:"none", boxSizing:"border-box",
              color: !tenseRevealed?"#333":status==="correct"?"#2E7D32":"#C62828",
              background:"transparent", cursor:tenseRevealed?"default":"text"}}
            placeholder="..." />
          {tenseRevealed && status==="wrong" && (
            <div style={{fontSize:11, color:"#2E7D32", fontWeight:900, textAlign:"center", marginTop:2}}>→ {card[key]}</div>
          )}
        </div>
      );
    };

    return (
      <div style={{minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:420}}>
          <div style={{fontSize:13, fontWeight:900, color:C.accent, marginBottom:2}}>
            📚 {vi?"시제 4단원 — ㄷ불규칙 + 르불규칙 + 으탈락 동사":en?"Tense Unit 4 — ㄷ/르 irregular + 으-drop":"시제 4단원 — ㄷ불규칙 + 르불규칙 + 으탈락 동사"}
          </div>
          <div style={{fontSize:12, color:"#555", background:"#E8F5E9", borderRadius:10, padding:"10px 14px", marginBottom:12, lineHeight:1.7}}>
            {vi
              ? <><b>🔵 ㄷ불규칙</b>: ㄷ → <b>ㄹ</b>로 바뀜 (걷다→걸, 듣다→들)<br/><b>🟣 르불규칙</b>: 르 → <b>ㄹㄹ</b>로 바뀜 (모르다→몰랐)<br/><b>🟠 으탈락</b>: 끝 으 탈락 (쓰다→썼, 끄다→껐)</>
              : en
              ? <><b>🔵 ㄷ-irregular</b>: ㄷ → <b>ㄹ</b> before vowel (걷다→걸, 듣다→들)<br/><b>🟣 르-irregular</b>: 르 → <b>ㄹㄹ</b> (모르다→몰랐)<br/><b>🟠 으-drop</b>: final 으 drops (쓰다→썼, 끄다→껐)</>
              : <><b>🔵 ㄷ불규칙</b>: 모음 앞에서 ㄷ → <b>ㄹ</b>로 교체 (걷다→걸, 듣다→들)<br/><b>🟣 르불규칙</b>: 르 → 아/어 앞에서 <b>ㄹㄹ</b>로 변환 (모르다→몰랐)<br/><b>🟠 으탈락</b>: 어간 끝 으 탈락 (쓰다→썼, 끄다→껐)</>
            }
          </div>
          <div style={{display:"flex", gap:3, marginBottom:16}}>
            {TENSE4_CARDS.map((_,i) => (
              <div key={i} style={{flex:1, height:4, borderRadius:2, background:i<=tenseCardIdx?C.accent:"#ddd"}} />
            ))}
          </div>
          <div style={{background:"white", borderRadius:20, overflow:"hidden", boxShadow:"0 4px 20px rgba(27,94,32,.12)", marginBottom:16}}>
            <div style={{background:C.accent, padding:"16px 20px"}}>
              <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6}}>
                <div style={{fontSize:28, fontWeight:900, color:"white"}}>{card.base}</div>
                <div style={{fontSize:14, color:"rgba(255,255,255,.85)", fontWeight:700}}>{meaning}</div>
              </div>
              <div style={{display:"inline-block", background:typeBadge.bg, borderRadius:20, padding:"3px 12px", fontSize:12, fontWeight:900, color:"white"}}>
                {typeBadge.label}
              </div>
            </div>
            <div style={{padding:"0"}}>
              <div style={{display:"grid", gridTemplateColumns:"32px 1fr 1fr 1fr", borderBottom:"1px solid #f0f0f0"}}>
                <div style={{background:"#f5f5f5"}} />
                {["현재","과거","미래"].map((t,i)=>(
                  <div key={i} style={{padding:"10px 0", textAlign:"center", fontSize:13, fontWeight:900,
                    color:[C.pres,C.past,C.fut][i], background:[C.presLight,C.pastLight,C.futLight][i]}}>
                    {vi?["Hiện tại","Quá khứ","Tương lai"][i]:en?["Present","Past","Future"][i]:t}
                  </div>
                ))}
              </div>
              <div style={{display:"grid", gridTemplateColumns:"32px 1fr 1fr 1fr", borderBottom:"2px solid #e0e0e0"}}>
                <div style={{display:"flex", alignItems:"center", justifyContent:"center", background:"#f5f5f5", borderRight:"1px solid #e8e8e8"}}>
                  <span style={{fontSize:20, fontWeight:900, color:"#555"}}>.</span>
                </div>
                {renderCell4("pres")}{renderCell4("past")}{renderCell4("fut")}
              </div>
              <div style={{display:"grid", gridTemplateColumns:"32px 1fr 1fr 1fr"}}>
                <div style={{display:"flex", alignItems:"center", justifyContent:"center", background:"#f5f5f5", borderRight:"1px solid #e8e8e8"}}>
                  <span style={{fontSize:18, fontWeight:900, color:"#E65100"}}>?</span>
                </div>
                {renderCell4("presQ")}{renderCell4("pastQ")}{renderCell4("futQ")}
              </div>
              <div style={{padding:"8px 14px", background:"#FFF8E1", borderTop:"1px solid #FFE082"}}>
                <div style={{fontSize:11, color:"#E65100", fontWeight:800}}>
                  {vi?"⚠️ Hàng (?) — nhớ gõ '?' ở cuối! Ví dụ: ~ㅂ니까?":en?"⚠️ (?) row — end with '?'! e.g. ~ㅂ니까?":"⚠️ 물음표(?) 행은 반드시 끝에 '?'를 붙여 입력하세요! 예: ~ㅂ니까?"}
                </div>
              </div>
              {tenseRevealed && (
                <div style={{padding:"10px 14px", background:"#E8F5E9", borderTop:"1px solid #C8E6C9"}}>
                  <div style={{fontSize:12, color:C.accent, fontWeight:800}}>📌 {card.rule}</div>
                </div>
              )}
              {!tenseRevealed && (
                <div style={{padding:"16px"}}>
                  <button onClick={()=>setTenseRevealed(true)}
                    style={{width:"100%", background:`linear-gradient(135deg,${C.accent},#1B5E20)`, color:"white", border:"none", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>
                    {vi?"Xem đáp án 👀":en?"Show answers 👀":"정답 보기 👀"}
                  </button>
                </div>
              )}
            </div>
          </div>
          <div style={{display:"flex", gap:8}}>
            {tenseCardIdx > 0 && (
              <button onClick={()=>{ setTenseCardIdx(i=>i-1); setTenseRevealed(false); }}
                style={{flex:1, background:"white", border:`2px solid ${C.border}`, borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:700, color:C.accent, cursor:"pointer"}}>
                ← {vi?"Trước":en?"Prev":"이전"}
              </button>
            )}
            {tenseCardIdx < total-1 ? (
              <button onClick={()=>{ setTenseCardIdx(i=>i+1); setTenseRevealed(false); }}
                style={{flex:1, background:`linear-gradient(135deg,${C.accent},#1B5E20)`, color:"white", border:"none", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>
                {vi?"Tiếp theo →":en?"Next →":"다음 카드 →"}
              </button>
            ) : (
              <button onClick={()=>{ setTenseCardIdx(0); setTenseRevealed(false); setTenseInputs({}); setStep("tense5"); }}
                style={{flex:1, background:"linear-gradient(135deg,#AD1457,#880E4F)", color:"white", border:"none", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>
                {vi?"Tiếp theo: Tense 5! 🚀":en?"Next: Tense 5! 🚀":"시제 5단원으로! 🚀"}
              </button>
            )}
          </div>
          <button onClick={()=>{ setTenseCardIdx(0); setTenseRevealed(false); setStep("tense3"); }}
            style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>
            ← {vi?"Quay lại Tense 3":en?"Back to Tense 3":"뒤로 (시제 3단원)"}
          </button>
        </div>
      </div>
    );
  }

  // ── 시제 5단원: 받다·닫다·잡다·입다 (규칙 ㄷ받침) + 받침 없는 규칙 보강 ──
  if (step === "tense5") {
    const vi = lang?.code === "vi";
    const en = lang?.code === "en";

    const TENSE5_CARDS = [
      { base:"받다",   meaning:{vi:"nhận",    en:"receive"},
        pres:"받습니다",  presQ:"받습니까?",
        past:"받았습니다", pastQ:"받았습니까?",
        fut:"받을 것입니다",futQ:"받을 것입니까?",
        rule:vi?"받다 → 규칙! 받+았 → 받았습니다 (ㄷ변화 없음)":en?"받다 → regular! ㄷ stays → 받았습니다":"받다 → 규칙 동사! ㄷ이 그대로 → 받았습니다",
        type:"규칙" },
      { base:"닫다",   meaning:{vi:"đóng",    en:"close"},
        pres:"닫습니다",  presQ:"닫습니까?",
        past:"닫았습니다", pastQ:"닫았습니까?",
        fut:"닫을 것입니다",futQ:"닫을 것입니까?",
        rule:vi?"닫다 → 규칙! 닫+았 → 닫았습니다 (ㄷ변화 없음)":en?"닫다 → regular! ㄷ stays → 닫았습니다":"닫다 → 규칙 동사! ㄷ이 그대로 → 닫았습니다",
        type:"규칙" },
      { base:"잡다",   meaning:{vi:"bắt/nắm", en:"grab/catch"},
        pres:"잡습니다",  presQ:"잡습니까?",
        past:"잡았습니다", pastQ:"잡았습니까?",
        fut:"잡을 것입니다",futQ:"잡을 것입니까?",
        rule:vi?"잡다 → 규칙! 잡+았 → 잡았습니다":en?"잡다 → regular → 잡았습니다":"잡다 → 규칙 동사 → 잡았습니다",
        type:"규칙" },
      { base:"입다",   meaning:{vi:"mặc",     en:"wear"},
        pres:"입습니다",  presQ:"입습니까?",
        past:"입었습니다", pastQ:"입었습니까?",
        fut:"입을 것입니다",futQ:"입을 것입니까?",
        rule:vi?"입다 → 규칙! 입+었 → 입었습니다":en?"입다 → regular → 입었습니다":"입다 → 규칙 동사 → 입었습니다",
        type:"규칙" },
      { base:"켜다",   meaning:{vi:"bật",     en:"turn on"},
        pres:"켭니다",    presQ:"켭니까?",
        past:"켰습니다",  pastQ:"켰습니까?",
        fut:"켤 것입니다", futQ:"켤 것입니까?",
        rule:vi?"켜다 → 받침 없음 → 켜+ㅂ니다 → ㄹ탈락 → 켭니다":en?"켜다 → no batchim → ㄹ drop → 켭니다":"켜다 → 받침 없음 → ㄹ탈락 → 켭니다",
        type:"규칙" },
      { base:"지우다",  meaning:{vi:"xóa",    en:"erase"},
        pres:"지웁니다",  presQ:"지웁니까?",
        past:"지웠습니다", pastQ:"지웠습니까?",
        fut:"지울 것입니다",futQ:"지울 것입니까?",
        rule:vi?"지우다 → 지우+어 → 지웠습니다":en?"지우다 → 지우+어 → 지웠습니다":"지우다 → 지우+어 → 지웠습니다",
        type:"규칙" },
      { base:"바꾸다",  meaning:{vi:"thay đổi",en:"change"},
        pres:"바꿉니다",  presQ:"바꿉니까?",
        past:"바꿨습니다", pastQ:"바꿨습니까?",
        fut:"바꿀 것입니다",futQ:"바꿀 것입니까?",
        rule:vi?"바꾸다 → 바꾸+어 → 바꿨습니다":en?"바꾸다 → 바꾸+어 → 바꿨습니다":"바꾸다 → 바꾸+어 → 바꿨습니다",
        type:"규칙" },
      { base:"그리다",  meaning:{vi:"vẽ",     en:"draw"},
        pres:"그립니다",  presQ:"그립니까?",
        past:"그렸습니다", pastQ:"그렸습니까?",
        fut:"그릴 것입니다",futQ:"그릴 것입니까?",
        rule:vi?"그리다 → 그리+어 → 그렸습니다":en?"그리다 → 그리+어 → 그렸습니다":"그리다 → 그리+어 → 그렸습니다",
        type:"규칙" },
    ];

    const card = TENSE5_CARDS[tenseCardIdx];
    const total = TENSE5_CARDS.length;
    const meaning = vi ? card.meaning.vi : en ? card.meaning.en : card.meaning.en;

    const C = { bg:"linear-gradient(150deg,#FCE4EC,#F8BBD9)", accent:"#AD1457",
                 border:"#F48FB1",
                 pres:"#1565C0", past:"#6A1B9A", fut:"#E65100",
                 presLight:"#E3F2FD", pastLight:"#F3E5F5", futLight:"#FFF3E0" };

    const inp5 = tenseInputs[tenseCardIdx] || {};
    const setInp5 = (key, val) => setTenseInputs(prev => ({
      ...prev,
      [tenseCardIdx]: { ...(prev[tenseCardIdx]||{}), [key]: val }
    }));
    const check5 = (key) => {
      if (!tenseRevealed) return null;
      const userVal = (inp5[key]||"").trim().replace(/\s+/g,"");
      const correct = (card[key]||"").replace(/\s+/g,"");
      return userVal === correct ? "correct" : "wrong";
    };
    const renderCell5 = (key) => {
      const status = check5(key);
      const border = !tenseRevealed ? "2px solid #e0e0e0"
        : status==="correct" ? "2px solid #2E7D32" : "2px solid #C62828";
      return (
        <div style={{padding:"6px 4px", borderRight:"1px solid #f0f0f0"}}>
          <input type="text" value={inp5[key]||""}
            onChange={e => { if(!tenseRevealed) setInp5(key, e.target.value); }}
            onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Tab") e.stopPropagation(); }}
            readOnly={tenseRevealed}
            style={{width:"100%", border, borderRadius:6, padding:"6px 4px", fontSize:12, fontWeight:700,
              textAlign:"center", outline:"none", boxSizing:"border-box",
              color: !tenseRevealed?"#333":status==="correct"?"#2E7D32":"#C62828",
              background:"transparent", cursor:tenseRevealed?"default":"text"}}
            placeholder="..." />
          {tenseRevealed && status==="wrong" && (
            <div style={{fontSize:11, color:"#2E7D32", fontWeight:900, textAlign:"center", marginTop:2}}>→ {card[key]}</div>
          )}
        </div>
      );
    };

    return (
      <div style={{minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:420}}>
          <div style={{fontSize:13, fontWeight:900, color:C.accent, marginBottom:2}}>
            📚 {vi?"시제 5단원 — 규칙 동사 보강 (받침 있음·없음)":en?"Tense Unit 5 — Regular Verbs (with/without batchim)":"시제 5단원 — 규칙 동사 보강 (받침 있음·없음)"}
          </div>
          <div style={{fontSize:12, color:"#555", background:"#FCE4EC", borderRadius:10, padding:"10px 14px", marginBottom:12, lineHeight:1.7}}>
            {vi
              ? <>📌 <b>받다·닫다</b>: ㄷ받침이지만 <b>규칙 동사</b>! (걷다·듣다와 달라요)<br/>받다 → 받<b>았</b>습니다 ✅ (ㄷ 그대로)<br/>📌 <b>켜다·지우다·바꾸다·그리다</b>: 받침 없는 규칙 동사</>
              : en
              ? <>📌 <b>받다·닫다</b>: ends in ㄷ but <b>regular</b>! (unlike 걷다·듣다)<br/>받다 → 받<b>았</b>습니다 ✅ (ㄷ unchanged)<br/>📌 <b>켜다·지우다·바꾸다·그리다</b>: regular verbs, no batchim</>
              : <>📌 <b>받다·닫다</b>: ㄷ받침이지만 <b>규칙 동사</b>예요! (걷다·듣다·묻다와 달라요)<br/>받다 → 받<b>았</b>습니다 ✅ (ㄷ 변화 없음)<br/>📌 <b>켜다·지우다·바꾸다·그리다</b>: 받침 없는 규칙 동사</>
            }
          </div>
          <div style={{display:"flex", gap:3, marginBottom:16}}>
            {TENSE5_CARDS.map((_,i) => (
              <div key={i} style={{flex:1, height:4, borderRadius:2, background:i<=tenseCardIdx?C.accent:"#ddd"}} />
            ))}
          </div>
          <div style={{background:"white", borderRadius:20, overflow:"hidden", boxShadow:"0 4px 20px rgba(173,20,87,.12)", marginBottom:16}}>
            <div style={{background:C.accent, padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
              <div style={{fontSize:28, fontWeight:900, color:"white"}}>{card.base}</div>
              <div style={{fontSize:14, color:"rgba(255,255,255,.85)", fontWeight:700}}>{meaning}</div>
            </div>
            <div style={{padding:"0"}}>
              <div style={{display:"grid", gridTemplateColumns:"32px 1fr 1fr 1fr", borderBottom:"1px solid #f0f0f0"}}>
                <div style={{background:"#f5f5f5"}} />
                {["현재","과거","미래"].map((t,i)=>(
                  <div key={i} style={{padding:"10px 0", textAlign:"center", fontSize:13, fontWeight:900,
                    color:[C.pres,C.past,C.fut][i], background:[C.presLight,C.pastLight,C.futLight][i]}}>
                    {vi?["Hiện tại","Quá khứ","Tương lai"][i]:en?["Present","Past","Future"][i]:t}
                  </div>
                ))}
              </div>
              <div style={{display:"grid", gridTemplateColumns:"32px 1fr 1fr 1fr", borderBottom:"2px solid #e0e0e0"}}>
                <div style={{display:"flex", alignItems:"center", justifyContent:"center", background:"#f5f5f5", borderRight:"1px solid #e8e8e8"}}>
                  <span style={{fontSize:20, fontWeight:900, color:"#555"}}>.</span>
                </div>
                {renderCell5("pres")}{renderCell5("past")}{renderCell5("fut")}
              </div>
              <div style={{display:"grid", gridTemplateColumns:"32px 1fr 1fr 1fr"}}>
                <div style={{display:"flex", alignItems:"center", justifyContent:"center", background:"#f5f5f5", borderRight:"1px solid #e8e8e8"}}>
                  <span style={{fontSize:18, fontWeight:900, color:"#E65100"}}>?</span>
                </div>
                {renderCell5("presQ")}{renderCell5("pastQ")}{renderCell5("futQ")}
              </div>
              <div style={{padding:"8px 14px", background:"#FFF8E1", borderTop:"1px solid #FFE082"}}>
                <div style={{fontSize:11, color:"#E65100", fontWeight:800}}>
                  {vi?"⚠️ Hàng (?) — nhớ gõ '?' ở cuối! Ví dụ: ~ㅂ니까?":en?"⚠️ (?) row — end with '?'! e.g. ~ㅂ니까?":"⚠️ 물음표(?) 행은 반드시 끝에 '?'를 붙여 입력하세요! 예: ~ㅂ니까?"}
                </div>
              </div>
              {tenseRevealed && (
                <div style={{padding:"10px 14px", background:"#FCE4EC", borderTop:"1px solid #F8BBD9"}}>
                  <div style={{fontSize:12, color:C.accent, fontWeight:800}}>📌 {card.rule}</div>
                </div>
              )}
              {!tenseRevealed && (
                <div style={{padding:"16px"}}>
                  <button onClick={()=>setTenseRevealed(true)}
                    style={{width:"100%", background:`linear-gradient(135deg,${C.accent},#880E4F)`, color:"white", border:"none", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>
                    {vi?"Xem đáp án 👀":en?"Show answers 👀":"정답 보기 👀"}
                  </button>
                </div>
              )}
            </div>
          </div>
          <div style={{display:"flex", gap:8}}>
            {tenseCardIdx > 0 && (
              <button onClick={()=>{ setTenseCardIdx(i=>i-1); setTenseRevealed(false); }}
                style={{flex:1, background:"white", border:`2px solid ${C.border}`, borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:700, color:C.accent, cursor:"pointer"}}>
                ← {vi?"Trước":en?"Prev":"이전"}
              </button>
            )}
            {tenseCardIdx < total-1 ? (
              <button onClick={()=>{ setTenseCardIdx(i=>i+1); setTenseRevealed(false); }}
                style={{flex:1, background:`linear-gradient(135deg,${C.accent},#880E4F)`, color:"white", border:"none", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>
                {vi?"Tiếp theo →":en?"Next →":"다음 카드 →"}
              </button>
            ) : (
              <button onClick={()=>{ setTenseCardIdx(0); setTenseRevealed(false); setTenseInputs({}); setStep("tense6"); }}
                style={{flex:1, background:"linear-gradient(135deg,#00695C,#004D40)", color:"white", border:"none", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>
                {vi?"Tiếp theo: Tense 6! 🚀":en?"Next: Tense 6! 🚀":"시제 6단원으로! 🚀"}
              </button>
            )}
          </div>
          <button onClick={()=>{ setTenseCardIdx(0); setTenseRevealed(false); setStep("tense4"); }}
            style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>
            ← {vi?"Quay lại Tense 4":en?"Back to Tense 4":"뒤로 (시제 4단원)"}
          </button>
        </div>
      </div>
    );
  }

  // ── 시제 6단원: 하다 동사 ──
  if (step === "tense6") {
    const vi = lang?.code === "vi";
    const en = lang?.code === "en";

    const TENSE6_CARDS = [
      { base:"공부하다",  meaning:{vi:"học bài",    en:"study"},
        pres:"공부합니다",   presQ:"공부합니까?",
        past:"공부했습니다",  pastQ:"공부했습니까?",
        fut:"공부할 것입니다",futQ:"공부할 것입니까?" },
      { base:"일하다",   meaning:{vi:"làm việc",   en:"work"},
        pres:"일합니다",    presQ:"일합니까?",
        past:"일했습니다",   pastQ:"일했습니까?",
        fut:"일할 것입니다",  futQ:"일할 것입니까?" },
      { base:"운동하다",  meaning:{vi:"tập thể dục",en:"exercise"},
        pres:"운동합니다",   presQ:"운동합니까?",
        past:"운동했습니다",  pastQ:"운동했습니까?",
        fut:"운동할 것입니다",futQ:"운동할 것입니까?" },
      { base:"요리하다",  meaning:{vi:"nấu ăn",    en:"cook"},
        pres:"요리합니다",   presQ:"요리합니까?",
        past:"요리했습니다",  pastQ:"요리했습니까?",
        fut:"요리할 것입니다",futQ:"요리할 것입니까?" },
      { base:"전화하다",  meaning:{vi:"gọi điện",   en:"call"},
        pres:"전화합니다",   presQ:"전화합니까?",
        past:"전화했습니다",  pastQ:"전화했습니까?",
        fut:"전화할 것입니다",futQ:"전화할 것입니까?" },
      { base:"청소하다",  meaning:{vi:"dọn dẹp",   en:"clean"},
        pres:"청소합니다",   presQ:"청소합니까?",
        past:"청소했습니다",  pastQ:"청소했습니까?",
        fut:"청소할 것입니다",futQ:"청소할 것입니까?" },
      { base:"이야기하다", meaning:{vi:"nói chuyện", en:"talk"},
        pres:"이야기합니다",  presQ:"이야기합니까?",
        past:"이야기했습니다", pastQ:"이야기했습니까?",
        fut:"이야기할 것입니다",futQ:"이야기할 것입니까?" },
      { base:"준비하다",  meaning:{vi:"chuẩn bị",  en:"prepare"},
        pres:"준비합니다",   presQ:"준비합니까?",
        past:"준비했습니다",  pastQ:"준비했습니까?",
        fut:"준비할 것입니다",futQ:"준비할 것입니까?" },
      { base:"출발하다",  meaning:{vi:"khởi hành",  en:"depart"},
        pres:"출발합니다",   presQ:"출발합니까?",
        past:"출발했습니다",  pastQ:"출발했습니까?",
        fut:"출발할 것입니다",futQ:"출발할 것입니까?" },
      { base:"도착하다",  meaning:{vi:"đến nơi",   en:"arrive"},
        pres:"도착합니다",   presQ:"도착합니까?",
        past:"도착했습니다",  pastQ:"도착했습니까?",
        fut:"도착할 것입니다",futQ:"도착할 것입니까?" },
      { base:"시작하다",  meaning:{vi:"bắt đầu",   en:"start"},
        pres:"시작합니다",   presQ:"시작합니까?",
        past:"시작했습니다",  pastQ:"시작했습니까?",
        fut:"시작할 것입니다",futQ:"시작할 것입니까?" },
      { base:"생각하다",  meaning:{vi:"suy nghĩ",  en:"think"},
        pres:"생각합니다",   presQ:"생각합니까?",
        past:"생각했습니다",  pastQ:"생각했습니까?",
        fut:"생각할 것입니다",futQ:"생각할 것입니까?" },
      { base:"이해하다",  meaning:{vi:"hiểu",      en:"understand"},
        pres:"이해합니다",   presQ:"이해합니까?",
        past:"이해했습니다",  pastQ:"이해했습니까?",
        fut:"이해할 것입니다",futQ:"이해할 것입니까?" },
      { base:"약속하다",  meaning:{vi:"hẹn/hứa",   en:"promise"},
        pres:"약속합니다",   presQ:"약속합니까?",
        past:"약속했습니다",  pastQ:"약속했습니까?",
        fut:"약속할 것입니다",futQ:"약속할 것입니까?" },
      { base:"졸업하다",  meaning:{vi:"tốt nghiệp", en:"graduate"},
        pres:"졸업합니다",   presQ:"졸업합니까?",
        past:"졸업했습니다",  pastQ:"졸업했습니까?",
        fut:"졸업할 것입니다",futQ:"졸업할 것입니까?" },
      { base:"연습하다",  meaning:{vi:"luyện tập",  en:"practice"},
        pres:"연습합니다",   presQ:"연습합니까?",
        past:"연습했습니다",  pastQ:"연습했습니까?",
        fut:"연습할 것입니다",futQ:"연습할 것입니까?" },
      { base:"감사하다",  meaning:{vi:"cảm ơn",    en:"thank"},
        pres:"감사합니다",   presQ:"감사합니까?",
        past:"감사했습니다",  pastQ:"감사했습니까?",
        fut:"감사할 것입니다",futQ:"감사할 것입니까?" },
      { base:"소개하다",  meaning:{vi:"giới thiệu", en:"introduce"},
        pres:"소개합니다",   presQ:"소개합니까?",
        past:"소개했습니다",  pastQ:"소개했습니까?",
        fut:"소개할 것입니다",futQ:"소개할 것입니까?" },
      { base:"노래하다",  meaning:{vi:"hát",       en:"sing"},
        pres:"노래합니다",   presQ:"노래합니까?",
        past:"노래했습니다",  pastQ:"노래했습니까?",
        fut:"노래할 것입니다",futQ:"노래할 것입니까?" },
      { base:"성공하다",  meaning:{vi:"thành công", en:"succeed"},
        pres:"성공합니다",   presQ:"성공합니까?",
        past:"성공했습니다",  pastQ:"성공했습니까?",
        fut:"성공할 것입니다",futQ:"성공할 것입니까?" },
      { base:"설명하다",  meaning:{vi:"giải thích", en:"explain"},
        pres:"설명합니다",   presQ:"설명합니까?",
        past:"설명했습니다",  pastQ:"설명했습니까?",
        fut:"설명할 것입니다",futQ:"설명할 것입니까?" },
      { base:"기억하다",  meaning:{vi:"ghi nhớ",   en:"remember"},
        pres:"기억합니다",   presQ:"기억합니까?",
        past:"기억했습니다",  pastQ:"기억했습니까?",
        fut:"기억할 것입니다",futQ:"기억할 것입니까?" },
      { base:"말하다",    meaning:{vi:"nói",        en:"say/tell"},
        pres:"말합니다",    presQ:"말합니까?",
        past:"말했습니다",   pastQ:"말했습니까?",
        fut:"말할 것입니다", futQ:"말할 것입니까?" },
      { base:"잘하다",    meaning:{vi:"làm giỏi",   en:"do well"},
        pres:"잘합니다",    presQ:"잘합니까?",
        past:"잘했습니다",   pastQ:"잘했습니까?",
        fut:"잘할 것입니다", futQ:"잘할 것입니까?" },
      { base:"용서하다",  meaning:{vi:"tha thứ",    en:"forgive"},
        pres:"용서합니다",   presQ:"용서합니까?",
        past:"용서했습니다",  pastQ:"용서했습니까?",
        fut:"용서할 것입니다",futQ:"용서할 것입니까?" },
    ];

    const card = TENSE6_CARDS[tenseCardIdx];
    const total = TENSE6_CARDS.length;
    const meaning = vi ? card.meaning.vi : en ? card.meaning.en : card.meaning.en;
    const rule6 = vi?"하다 → 합니다 (현재) / 했습니다 (과거) / 할 것입니다 (미래)":en?"하다 → 합니다 (pres) / 했습니다 (past) / 할 것입니다 (future)":"하다 → 합니다 (현재) / 했습니다 (과거) / 할 것입니다 (미래)";

    const C = { bg:"linear-gradient(150deg,#E0F2F1,#B2DFDB)", accent:"#00695C",
                 border:"#80CBC4",
                 pres:"#1565C0", past:"#6A1B9A", fut:"#E65100",
                 presLight:"#E3F2FD", pastLight:"#F3E5F5", futLight:"#FFF3E0" };

    const inp6 = tenseInputs[tenseCardIdx] || {};
    const setInp6 = (key, val) => setTenseInputs(prev => ({
      ...prev,
      [tenseCardIdx]: { ...(prev[tenseCardIdx]||{}), [key]: val }
    }));
    const check6 = (key) => {
      if (!tenseRevealed) return null;
      const userVal = (inp6[key]||"").trim().replace(/\s+/g,"");
      const correct = (card[key]||"").replace(/\s+/g,"");
      return userVal === correct ? "correct" : "wrong";
    };
    const renderCell6 = (key) => {
      const status = check6(key);
      const border = !tenseRevealed ? "2px solid #e0e0e0"
        : status==="correct" ? "2px solid #2E7D32" : "2px solid #C62828";
      return (
        <div style={{padding:"6px 4px", borderRight:"1px solid #f0f0f0"}}>
          <input type="text" value={inp6[key]||""}
            onChange={e => { if(!tenseRevealed) setInp6(key, e.target.value); }}
            onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Tab") e.stopPropagation(); }}
            readOnly={tenseRevealed}
            style={{width:"100%", border, borderRadius:6, padding:"6px 4px", fontSize:12, fontWeight:700,
              textAlign:"center", outline:"none", boxSizing:"border-box",
              color: !tenseRevealed?"#333":status==="correct"?"#2E7D32":"#C62828",
              background:"transparent", cursor:tenseRevealed?"default":"text"}}
            placeholder="..." />
          {tenseRevealed && status==="wrong" && (
            <div style={{fontSize:11, color:"#2E7D32", fontWeight:900, textAlign:"center", marginTop:2}}>→ {card[key]}</div>
          )}
        </div>
      );
    };

    return (
      <div style={{minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:420}}>
          <div style={{fontSize:13, fontWeight:900, color:C.accent, marginBottom:2}}>
            📚 {vi?"시제 6단원 — 하다 동사":en?"Tense Unit 6 — 하다 Verbs":"시제 6단원 — 하다 동사"}
          </div>
          <div style={{fontSize:12, color:"#555", background:"#E0F2F1", borderRadius:10, padding:"10px 14px", marginBottom:12, lineHeight:1.7}}>
            {vi
              ? <>📌 <b>하다 동사 규칙</b> (항상 규칙!):<br/>현재: <b>합니다</b> / 과거: <b>했습니다</b> / 미래: <b>할 것입니다</b><br/>공부<b>하다</b> → 공부<b>합니다</b> / 공부<b>했습니다</b> / 공부<b>할 것입니다</b></>
              : en
              ? <>📌 <b>하다 verb rule</b> (always regular!):<br/>Present: <b>합니다</b> / Past: <b>했습니다</b> / Future: <b>할 것입니다</b><br/>공부<b>하다</b> → 공부<b>합니다</b> / 공부<b>했습니다</b> / 공부<b>할 것입니다</b></>
              : <>📌 <b>하다 동사 규칙</b> (항상 규칙이에요!):<br/>현재: <b>합니다</b> / 과거: <b>했습니다</b> / 미래: <b>할 것입니다</b><br/>공부<b>하다</b> → 공부<b>합니다</b> / 공부<b>했습니다</b> / 공부<b>할 것입니다</b></>
            }
          </div>
          <div style={{display:"flex", gap:3, marginBottom:16}}>
            {TENSE6_CARDS.map((_,i) => (
              <div key={i} style={{flex:1, height:4, borderRadius:2, background:i<=tenseCardIdx?C.accent:"#ddd"}} />
            ))}
          </div>
          <div style={{background:"white", borderRadius:20, overflow:"hidden", boxShadow:"0 4px 20px rgba(0,105,92,.12)", marginBottom:16}}>
            <div style={{background:C.accent, padding:"16px 20px", display:"flex", alignItems:"center", justifyContent:"space-between"}}>
              <div style={{fontSize:28, fontWeight:900, color:"white"}}>{card.base}</div>
              <div style={{fontSize:14, color:"rgba(255,255,255,.85)", fontWeight:700}}>{meaning}</div>
            </div>
            <div style={{padding:"0"}}>
              <div style={{display:"grid", gridTemplateColumns:"32px 1fr 1fr 1fr", borderBottom:"1px solid #f0f0f0"}}>
                <div style={{background:"#f5f5f5"}} />
                {["현재","과거","미래"].map((t,i)=>(
                  <div key={i} style={{padding:"10px 0", textAlign:"center", fontSize:13, fontWeight:900,
                    color:[C.pres,C.past,C.fut][i], background:[C.presLight,C.pastLight,C.futLight][i]}}>
                    {vi?["Hiện tại","Quá khứ","Tương lai"][i]:en?["Present","Past","Future"][i]:t}
                  </div>
                ))}
              </div>
              <div style={{display:"grid", gridTemplateColumns:"32px 1fr 1fr 1fr", borderBottom:"2px solid #e0e0e0"}}>
                <div style={{display:"flex", alignItems:"center", justifyContent:"center", background:"#f5f5f5", borderRight:"1px solid #e8e8e8"}}>
                  <span style={{fontSize:20, fontWeight:900, color:"#555"}}>.</span>
                </div>
                {renderCell6("pres")}{renderCell6("past")}{renderCell6("fut")}
              </div>
              <div style={{display:"grid", gridTemplateColumns:"32px 1fr 1fr 1fr"}}>
                <div style={{display:"flex", alignItems:"center", justifyContent:"center", background:"#f5f5f5", borderRight:"1px solid #e8e8e8"}}>
                  <span style={{fontSize:18, fontWeight:900, color:"#E65100"}}>?</span>
                </div>
                {renderCell6("presQ")}{renderCell6("pastQ")}{renderCell6("futQ")}
              </div>
              <div style={{padding:"8px 14px", background:"#FFF8E1", borderTop:"1px solid #FFE082"}}>
                <div style={{fontSize:11, color:"#E65100", fontWeight:800}}>
                  {vi?"⚠️ Hàng (?) — nhớ gõ '?' ở cuối! Ví dụ: ~ㅂ니까?":en?"⚠️ (?) row — end with '?'! e.g. ~ㅂ니까?":"⚠️ 물음표(?) 행은 반드시 끝에 '?'를 붙여 입력하세요! 예: ~ㅂ니까?"}
                </div>
              </div>
              {tenseRevealed && (
                <div style={{padding:"10px 14px", background:"#E0F2F1", borderTop:"1px solid #B2DFDB"}}>
                  <div style={{fontSize:12, color:C.accent, fontWeight:800}}>📌 {rule6}</div>
                </div>
              )}
              {!tenseRevealed && (
                <div style={{padding:"16px"}}>
                  <button onClick={()=>setTenseRevealed(true)}
                    style={{width:"100%", background:`linear-gradient(135deg,${C.accent},#004D40)`, color:"white", border:"none", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>
                    {vi?"Xem đáp án 👀":en?"Show answers 👀":"정답 보기 👀"}
                  </button>
                </div>
              )}
            </div>
          </div>
          <div style={{display:"flex", gap:8}}>
            {tenseCardIdx > 0 && (
              <button onClick={()=>{ setTenseCardIdx(i=>i-1); setTenseRevealed(false); }}
                style={{flex:1, background:"white", border:`2px solid ${C.border}`, borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:700, color:C.accent, cursor:"pointer"}}>
                ← {vi?"Trước":en?"Prev":"이전"}
              </button>
            )}
            {tenseCardIdx < total-1 ? (
              <button onClick={()=>{ setTenseCardIdx(i=>i+1); setTenseRevealed(false); }}
                style={{flex:1, background:`linear-gradient(135deg,${C.accent},#004D40)`, color:"white", border:"none", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>
                {vi?"Tiếp theo →":en?"Next →":"다음 카드 →"}
              </button>
            ) : (
              <button onClick={()=>{ setTenseCardIdx(0); setTenseRevealed(false); setTenseInputs({}); setStep("tenseTest"); }}
                style={{flex:1, background:"linear-gradient(135deg,#1565C0,#0D47A1)", color:"white", border:"none", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>
                {vi?"Tense hoàn thành! 🎉 → Kiểm tra":en?"Tense Complete! 🎉 → Final Test":"시제 완료! 🎉 → 최종 테스트"}
              </button>
            )}
          </div>
          <button onClick={()=>{ setTenseCardIdx(0); setTenseRevealed(false); setStep("tense5"); }}
            style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>
            ← {vi?"Quay lại Tense 5":en?"Back to Tense 5":"뒤로 (시제 5단원)"}
          </button>
        </div>
      </div>
    );
  }

  // ── 시제 누적 테스트 ──
  if (step === "tenseTest") {
    const vi = lang?.code === "vi"; const en = lang?.code === "en";

    const TENSE_TEST_Q = [
      // ── 1단원: 규칙 동사 (받침 있음) — 헷갈리기 쉬운 것 위주 ──
      { id:"tt01",  base:"먹다",    col:"현재 .",  colSub:".",  answer:"먹습니다",      hint:"받침 있음 → 먹+습니다" },
      { id:"tt02",  base:"읽다",    col:"과거 .",  colSub:".",  answer:"읽었습니다",    hint:"읽다 → 읽었습니다" },
      { id:"tt03",  base:"앉다",    col:"미래 .",  colSub:".",  answer:"앉을 것입니다", hint:"받침 있음 → 을 것입니다" },
      { id:"tt04",  base:"씻다",    col:"현재 ?",  colSub:"?",  answer:"씻습니까?",     hint:"씻다 → 씻+습니까?" },
      { id:"tt05",  base:"찾다",    col:"과거 .",  colSub:".",  answer:"찾았습니다",    hint:"찾다 → 찾았습니다" },
      { id:"tt06",  base:"웃다",    col:"미래 .",  colSub:".",  answer:"웃을 것입니다", hint:"웃다 → 웃을 것입니다" },
      { id:"tt07",  base:"놓다",    col:"현재 .",  colSub:".",  answer:"놓습니다",      hint:"놓다 → 놓+습니다" },
      { id:"tt08",  base:"늦다",    col:"과거 .",  colSub:".",  answer:"늦었습니다",    hint:"늦다 → 늦었습니다" },
      // ── 규칙 동사 (받침 없음) ──
      { id:"tt09",  base:"가다",    col:"과거 .",  colSub:".",  answer:"갔습니다",      hint:"가다 → 갔습니다" },
      { id:"tt10",  base:"오다",    col:"미래 .",  colSub:".",  answer:"올 것입니다",   hint:"오다 → 올 것입니다 (ㄹ)" },
      { id:"tt11",  base:"자다",    col:"현재 ?",  colSub:"?",  answer:"잡니까?",       hint:"자다 → 잡니까? (ㅂ 삽입)" },
      { id:"tt12",  base:"보다",    col:"과거 .",  colSub:".",  answer:"봤습니다",      hint:"보다 → 봤습니다" },
      { id:"tt13",  base:"서다",    col:"미래 .",  colSub:".",  answer:"설 것입니다",   hint:"서다 → 설 것입니다" },
      { id:"tt14",  base:"되다",    col:"현재 .",  colSub:".",  answer:"됩니다",        hint:"되다 → 됩니다" },
      { id:"tt15",  base:"마시다",  col:"과거 .",  colSub:".",  answer:"마셨습니다",    hint:"마시다 → 마셨습니다" },
      { id:"tt16",  base:"내리다",  col:"현재 ?",  colSub:"?",  answer:"내립니까?",     hint:"내리다 → 내립니까?" },
      // ── 2단원: ㄹ탈락 ──
      { id:"tt17",  base:"살다",    col:"현재 .",  colSub:".",  answer:"삽니다",        hint:"ㄹ탈락 → 살→삽니다" },
      { id:"tt18",  base:"알다",    col:"현재 ?",  colSub:"?",  answer:"압니까?",       hint:"ㄹ탈락 → 알→압니까?" },
      { id:"tt19",  base:"울다",    col:"과거 .",  colSub:".",  answer:"울었습니다",    hint:"울다 과거 → 울었습니다" },
      { id:"tt20",  base:"열다",    col:"미래 .",  colSub:".",  answer:"열 것입니다",   hint:"ㄹ탈락 → 열 것입니다" },
      { id:"tt21",  base:"팔다",    col:"현재 .",  colSub:".",  answer:"팝니다",        hint:"ㄹ탈락 → 팔→팝니다" },
      { id:"tt22",  base:"놀다",    col:"현재 ?",  colSub:"?",  answer:"놉니까?",       hint:"ㄹ탈락 → 놀→놉니까?" },
      { id:"tt23",  base:"만들다",  col:"과거 .",  colSub:".",  answer:"만들었습니다",  hint:"만들다 → 만들었습니다" },
      { id:"tt24",  base:"들다",    col:"미래 .",  colSub:".",  answer:"들 것입니다",   hint:"ㄹ탈락 → 들 것입니다" },
      // ── 있다/없다 계열 ──
      { id:"tt25",  base:"있다",    col:"현재 ?",  colSub:"?",  answer:"있습니까?",     hint:"있다 → 있습니까?" },
      { id:"tt26",  base:"없다",    col:"과거 .",  colSub:".",  answer:"없었습니다",    hint:"없다 → 없었습니다" },
      { id:"tt27",  base:"재미있다",col:"미래 .",  colSub:".",  answer:"재미있을 것입니다", hint:"재미있다 → 있을 것" },
      { id:"tt28",  base:"맛있다",  col:"현재 .",  colSub:".",  answer:"맛있습니다",    hint:"맛있다 → 맛있습니다" },
      // ── 3단원: ㅂ불규칙 ──
      { id:"tt29",  base:"돕다",    col:"과거 .",  colSub:".",  answer:"도왔습니다",    hint:"ㅂ불규칙 → 도+왔습니다" },
      { id:"tt30",  base:"눕다",    col:"미래 .",  colSub:".",  answer:"누울 것입니다", hint:"ㅂ불규칙 → 누울 것" },
      { id:"tt31",  base:"쉽다",    col:"현재 .",  colSub:".",  answer:"쉽습니다",      hint:"쉽다 → 쉽습니다" },
      { id:"tt32",  base:"어렵다",  col:"과거 .",  colSub:".",  answer:"어려웠습니다",  hint:"ㅂ불규칙 → 어려웠습니다" },
      { id:"tt33",  base:"어렵다",  col:"현재 ?",  colSub:"?",  answer:"어렵습니까?",   hint:"어렵다 현재 질문" },
      // ── 3단원: 으탈락 형용사 ──
      { id:"tt34",  base:"크다",    col:"과거 .",  colSub:".",  answer:"컸습니다",      hint:"으탈락 → 크→컸습니다" },
      { id:"tt35",  base:"기쁘다",  col:"미래 .",  colSub:".",  answer:"기쁠 것입니다", hint:"으탈락 → 기쁠 것" },
      { id:"tt36",  base:"예쁘다",  col:"과거 .",  colSub:".",  answer:"예뻤습니다",    hint:"으탈락 → 예뻤습니다" },
      { id:"tt37",  base:"슬프다",  col:"현재 ?",  colSub:"?",  answer:"슬픕니까?",     hint:"슬프다 → 슬픕니까?" },
      { id:"tt38",  base:"바쁘다",  col:"과거 .",  colSub:".",  answer:"바빴습니다",    hint:"으탈락 → 바빴습니다" },
      { id:"tt39",  base:"아프다",  col:"미래 .",  colSub:".",  answer:"아플 것입니다", hint:"으탈락 → 아플 것" },
      // ── 4단원: ㄷ불규칙 ──
      { id:"tt40",  base:"걷다",    col:"과거 .",  colSub:".",  answer:"걸었습니다",    hint:"ㄷ불규칙 → 걸었습니다" },
      { id:"tt41",  base:"듣다",    col:"현재 ?",  colSub:"?",  answer:"듣습니까?",     hint:"듣다 현재 질문" },
      { id:"tt42",  base:"묻다",    col:"미래 .",  colSub:".",  answer:"물을 것입니다", hint:"ㄷ불규칙 → 물을 것" },
      // ── 규칙 ㄷ받침 (불규칙 아님 — 혼동 포인트!) ──
      { id:"tt43",  base:"받다",    col:"과거 .",  colSub:".",  answer:"받았습니다",    hint:"규칙 → 받았습니다 (ㄷ불규칙 아님!)" },
      { id:"tt44",  base:"닫다",    col:"현재 .",  colSub:".",  answer:"닫습니다",      hint:"규칙 → 닫+습니다" },
      // ── 4단원: 르불규칙 ──
      { id:"tt45",  base:"모르다",  col:"과거 .",  colSub:".",  answer:"몰랐습니다",    hint:"르불규칙 → ㄹㄹ → 몰랐습니다" },
      { id:"tt46",  base:"빠르다",  col:"현재 ?",  colSub:"?",  answer:"빠릅니까?",     hint:"르불규칙 현재 질문" },
      { id:"tt47",  base:"다르다",  col:"미래 .",  colSub:".",  answer:"다를 것입니다", hint:"르불규칙 → 다를 것" },
      // ── 으탈락 동사 ──
      { id:"tt48",  base:"쓰다",    col:"과거 .",  colSub:".",  answer:"썼습니다",      hint:"으탈락(동사) → 썼습니다" },
      { id:"tt49",  base:"끄다",    col:"과거 .",  colSub:".",  answer:"껐습니다",      hint:"으탈락(동사) → 껐습니다" },
      { id:"tt50",  base:"끄다",    col:"현재 ?",  colSub:"?",  answer:"끕니까?",       hint:"끄다 → 끕니까?" },
      // ── 5단원: 규칙 동사 보강 (받침X·ㅏ/ㅗ→았) ──
      { id:"tt51",  base:"사다",    col:"과거 .",  colSub:".",  answer:"샀습니다",      hint:"사다 → 샀습니다" },
      { id:"tt52",  base:"만나다",  col:"현재 .",  colSub:".",  answer:"만납니다",      hint:"만나다 → 만납니다" },
      { id:"tt53",  base:"배우다",  col:"과거 .",  colSub:".",  answer:"배웠습니다",    hint:"배우다 → 배웠습니다" },
      { id:"tt54",  base:"주다",    col:"미래 .",  colSub:".",  answer:"줄 것입니다",   hint:"주다 → 줄 것입니다" },
      { id:"tt55",  base:"뛰다",    col:"과거 .",  colSub:".",  answer:"뛰었습니다",    hint:"뛰다 → 뛰었습니다" },
      { id:"tt56",  base:"쉬다",    col:"현재 ?",  colSub:"?",  answer:"쉽니까?",       hint:"쉬다 → 쉽니까? (ㅂ 삽입)" },
      { id:"tt57",  base:"기다리다",col:"미래 .",  colSub:".",  answer:"기다릴 것입니다",hint:"기다리다 → 기다릴 것" },
      { id:"tt58",  base:"고치다",  col:"과거 .",  colSub:".",  answer:"고쳤습니다",    hint:"고치다 → 고쳤습니다" },
      // ── 6단원: 하다 동사 ──
      { id:"tt59",  base:"공부하다",col:"과거 .",  colSub:".",  answer:"공부했습니다",  hint:"하다 → 했습니다" },
      { id:"tt60",  base:"운동하다",col:"현재 ?",  colSub:"?",  answer:"운동합니까?",   hint:"하다 → 합니까?" },
      { id:"tt61",  base:"청소하다",col:"미래 .",  colSub:".",  answer:"청소할 것입니다",hint:"하다 → 할 것입니다" },
      { id:"tt62",  base:"전화하다",col:"현재 .",  colSub:".",  answer:"전화합니다",    hint:"하다 → 합니다" },
      { id:"tt63",  base:"준비하다",col:"과거 .",  colSub:".",  answer:"준비했습니다",  hint:"하다 → 했습니다" },
      { id:"tt64",  base:"약속하다",col:"현재 ?",  colSub:"?",  answer:"약속합니까?",   hint:"하다 → 합니까?" },
      { id:"tt65",  base:"연습하다",col:"미래 .",  colSub:".",  answer:"연습할 것입니다",hint:"하다 → 할 것입니다" },
      { id:"tt66",  base:"못하다",  col:"현재 .",  colSub:".",  answer:"못합니다",      hint:"못하다 → 못합니다" },
    ];

    function gradeTenseTest() {
      let ok = 0;
      TENSE_TEST_Q.forEach(q => {
        const v = (tenseTestAnswers[q.id]||"").trim().replace(/\s+/g,"");
        if (v === q.answer.replace(/\s+/g,"")) ok++;
      });
      setTenseTestResult({ score:ok, total:TENSE_TEST_Q.length, pass: ok/TENSE_TEST_Q.length >= 0.8 });
    }

    const C = { bg:"linear-gradient(150deg,#E8F5E9,#DCEDC8)", accent:"#2E7D32", border:"#A5D6A7" };

    if (tenseTestResult) return (
      <div style={{minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px 16px"}}>
        <DevJumpPanel />
        <div style={{background:"white", borderRadius:24, padding:"32px 24px", maxWidth:380, width:"100%", textAlign:"center", boxShadow:"0 4px 24px rgba(46,125,50,.15)"}}>
          <div style={{fontSize:52, marginBottom:8}}>{tenseTestResult.pass ? "🏆" : "💪"}</div>
          <div style={{fontSize:22, fontWeight:900, color:tenseTestResult.pass?"#2E7D32":"#E65100", marginBottom:4}}>
            {tenseTestResult.score}/{tenseTestResult.total}점
          </div>
          <div style={{fontSize:13, color:"#888", marginBottom:6}}>
            {Math.round(tenseTestResult.score/tenseTestResult.total*100)}% — 통과 기준 80%
          </div>
          <div style={{fontSize:15, fontWeight:700, color:"#333", marginBottom:20}}>
            {tenseTestResult.pass
              ? (vi?"Xuất sắc! Sang phần Trợ từ! 🎉":en?"Excellent! On to Particles! 🎉":"시제 마스터! 🎉 이제 조사로 넘어가요!")
              : (vi?"Cần ôn lại! Thử lại nhé 💪":en?"Review needed! Try again 💪":"한 번 더 도전해봐요! 💪")}
          </div>
          {tenseTestResult.pass ? (
            <button onClick={()=>{ setJosaStep(0); setStep("josa"); }}
              style={{width:"100%", background:"linear-gradient(135deg,#2E7D32,#1B5E20)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>
              {vi?"Sang Trợ từ! 🚀":en?"To Particles! 🚀":"조사 학습으로! 🚀"}
            </button>
          ) : (
            <button onClick={()=>{ setTenseTestResult(null); setTenseTestAnswers({}); }}
              style={{width:"100%", background:"linear-gradient(135deg,#E65100,#BF360C)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>
              {vi?"Thử lại 🔄":en?"Try again 🔄":"다시 풀기 🔄"}
            </button>
          )}
          <button onClick={()=>{ setTenseCardIdx(0); setTenseRevealed(false); setTenseInputs({}); setStep("tense1"); }}
            style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>
            ← {vi?"Học lại từ đầu":en?"Review from Tense 1":"시제 1단원부터 다시"}
          </button>
        </div>
      </div>
    );

    return (
      <div style={{minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:420}}>
          <div style={{fontSize:14, fontWeight:900, color:C.accent, marginBottom:2}}>
            🏆 {vi?"Kiểm tra tổng hợp Thì (Tense 1~6)":en?"Tense Final Test (Units 1~6)":"시제 총합 테스트 (1~6단원)"}
          </div>

          {/* 합니다체 기본 규칙 설명 */}
          <div style={{background:"white", borderRadius:12, padding:"12px 14px", marginBottom:12, fontSize:12, lineHeight:1.8, boxShadow:"0 1px 6px rgba(46,125,50,.08)"}}>
            <div style={{fontWeight:900, color:C.accent, marginBottom:4}}>📌 합니다체 기본 규칙</div>
            <div style={{display:"grid", gridTemplateColumns:"auto 1fr", gap:"2px 10px", color:"#444"}}>
              <span style={{fontWeight:800, color:"#1565C0"}}>현재 .</span><span>받침O → <b>+습니다</b> / 받침X → <b>+ㅂ니다</b></span>
              <span style={{fontWeight:800, color:"#1565C0"}}>현재 ?</span><span>받침O → <b>+습니까?</b> / 받침X → <b>+ㅂ니까?</b></span>
              <span style={{fontWeight:800, color:"#6A1B9A"}}>과거 .</span><span>아/어 계열 + <b>았/었습니다</b> (ㅏㅗ→았 / 나머지→었)</span>
              <span style={{fontWeight:800, color:"#6A1B9A"}}>과거 ?</span><span>아/어 계열 + <b>았/었습니까?</b></span>
              <span style={{fontWeight:800, color:"#2E7D32"}}>미래 .</span><span>받침O → <b>+을 것입니다</b> / 받침X·ㄹ → <b>+ㄹ 것입니다</b></span>
              <span style={{fontWeight:800, color:"#2E7D32"}}>미래 ?</span><span>받침O → <b>+을 것입니까?</b> / 받침X·ㄹ → <b>+ㄹ 것입니까?</b></span>
            </div>
          </div>

          <div style={{fontSize:12, color:"#888", marginBottom:10, textAlign:"right"}}>
            {vi?"⚠️ Bất quy tắc: xem gợi ý sau khi nộp bài":en?"⚠️ Irregular verbs: hints shown after grading":"⚠️ 불규칙 힌트는 채점 후 표시"}
          </div>

          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:4, marginBottom:6, padding:"0 2px"}}>
            {["단어","시제/종류","내 답"].map((h,i) => (
              <div key={i} style={{fontSize:11, fontWeight:900, color:"#888", textAlign:"center", padding:"4px 0"}}>{h}</div>
            ))}
          </div>

          {TENSE_TEST_Q.map((q, i) => {
            const isQ = q.colSub === "?";
            const tCol = q.col.replace(" .", "").replace(" ?", "");
            const colColor = tCol==="현재" ? "#1565C0" : tCol==="과거" ? "#6A1B9A" : "#2E7D32";
            const isCorrect = tenseTestResult && (tenseTestAnswers[q.id]||"").trim().replace(/\s+/g,"") === q.answer.replace(/\s+/g,"");
            const isWrong = tenseTestResult && !isCorrect;
            return (
              <div key={q.id} style={{display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:4, marginBottom:6, alignItems:"center"}}>
                <div style={{background:"white", borderRadius:8, padding:"8px 10px", fontSize:13, fontWeight:900, color:C.accent, textAlign:"center", boxShadow:"0 1px 4px rgba(46,125,50,.08)"}}>{q.base}</div>
                <div style={{background:"white", borderRadius:8, padding:"6px 4px", textAlign:"center", boxShadow:"0 1px 4px rgba(46,125,50,.06)"}}>
                  <div style={{fontSize:12, fontWeight:900, color:colColor}}>{tCol}</div>
                  <div style={{fontSize:14, fontWeight:900, color:isQ?"#E65100":"#555", lineHeight:1}}>{isQ ? "?" : "."}</div>
                </div>
                <div>
                  <input type="text"
                    value={tenseTestAnswers[q.id]||""}
                    onChange={e => setTenseTestAnswers(prev=>({...prev,[q.id]:e.target.value}))}
                    onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Tab") e.stopPropagation(); }}
                    readOnly={!!tenseTestResult}
                    placeholder="..."
                    style={{width:"100%", border:`2px solid ${tenseTestResult?(isCorrect?"#2E7D32":"#C62828"):"#A5D6A7"}`, borderRadius:8, padding:"7px 6px", fontSize:12, fontWeight:700, textAlign:"center", outline:"none", boxSizing:"border-box",
                      color: tenseTestResult?(isCorrect?"#2E7D32":"#C62828"):"#333", background:"white"}}
                  />
                  {isWrong && q.hint && (
                    <div style={{fontSize:10, color:"#2E7D32", fontWeight:800, marginTop:2, textAlign:"center"}}>
                      → {q.answer} ({q.hint})
                    </div>
                  )}
                  {isWrong && !q.hint && (
                    <div style={{fontSize:10, color:"#2E7D32", fontWeight:800, marginTop:2, textAlign:"center"}}>
                      → {q.answer}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <button type="button" onClick={gradeTenseTest}
            style={{width:"100%", background:`linear-gradient(135deg,${C.accent},#1B5E20)`, color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", marginTop:8}}>
            {vi?"Nộp bài! 📊":en?"Submit! 📊":"채점하기! 📊"}
          </button>
          <button onClick={()=>{ setTenseCardIdx(0); setTenseRevealed(false); setTenseInputs({}); setStep("tense6"); }}
            style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>
            ← {vi?"Quay lại Tense 6":en?"Back to Tense 6":"뒤로 (시제 6단원)"}
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // ✅ V154: 조사·대명사 테스트 화면
  // ════════════════════════════════════════════════════════
  if (step === "testJosa") {
    const vi = lang?.code === "vi";
    const en = lang?.code === "en";

    // STT 예문 목록 (학습한 예시 문장 전체)
    const STT_SENTENCES = [
      "저는 학생이에요.",
      "정국은 가수예요.",
      "지수가 노래해요.",
      "커피를 마셔요.",
      "빵을 먹어요.",
      "사과와 바나나가 있어요.",
      "저도 갈게요.",
      "누구예요?",
      "어디 가요?",
      "언제 와요?",
    ];

    // 채점 — setJosaTestAnswers 함수형 업데이트로 최신 answers 확보 후 채점
    function gradeJosaTest() {
      if (josaTestQuestions.length === 0) return;
      setJosaTestAnswers(latestAnswers => {
        let correct = 0;
        const writingFb = josaTestQuestions.map(q => {
          const ua = (latestAnswers[q.id]||"").trim();
          const ok = ua === q.answer || ua.replace(/\s/g,"") === q.answer.replace(/\s/g,"");
          if (ok) correct++;
          return {...q, userAns:ua, ok};
        });
        let sttCorrect = 0;
        const sttFb = STT_SENTENCES.map((s,i) => {
          const d = josaSTTMap[i];
          if (d?.ok) sttCorrect++;
          return {sentence:s, ...d};
        });
        const writingScore = Math.round((correct/josaTestQuestions.length)*100);
        const sttScore = Math.round((sttCorrect/STT_SENTENCES.length)*100);
        const total = Math.round((writingScore + sttScore) / 2);
        setJosaTestResult({passed: total >= 80, score: total, writingScore, sttScore, writingFb, sttFb});
        return latestAnswers; // 상태 변경 없이 최신값만 읽음
      });
    }

    // 로딩 중
    if (josaTestLoading) return (
      <div style={{minHeight:"100vh",background:"linear-gradient(150deg,#FFFBF0,#FFF3E0)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <DevJumpPanel />
        <div style={{fontSize:40,marginBottom:16}}>📝</div>
        <div style={{fontSize:15,color:"#FF9800",fontWeight:700}}>문제 만드는 중...</div>
      </div>
    );

    // 결과 화면
    if (josaTestResult) {
      const {passed,score,writingScore,sttScore,writingFb,sttFb} = josaTestResult;
      return (
        <div style={{minHeight:"100vh",background:"linear-gradient(150deg,#FFFBF0,#FFF3E0)",display:"flex",flexDirection:"column",alignItems:"center",padding:"24px 16px",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
          <DevJumpPanel />
          <div style={{width:"100%",maxWidth:400}}>
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{fontSize:48}}>{passed?"🎉":"😊"}</div>
              <div style={{fontSize:22,fontWeight:900,color:passed?"#E65100":"#FF9800",marginBottom:8}}>
                {passed?(vi?"Xuất sắc!":en?"Excellent!":"통과! 🎉"):(vi?"Thử lại nhé!":en?"Try again!":"조금 더 연습해요!")}
              </div>
              <div style={{display:"flex",gap:12,justifyContent:"center",marginBottom:4}}>
                <div style={{background:"white",borderRadius:12,padding:"8px 16px",textAlign:"center",boxShadow:"0 2px 8px #FF980022"}}>
                  <div style={{fontSize:11,color:"#aaa"}}>✍️ 빈칸</div>
                  <div style={{fontSize:20,fontWeight:900,color:"#E65100"}}>{writingScore}점</div>
                </div>
                <div style={{background:"white",borderRadius:12,padding:"8px 16px",textAlign:"center",boxShadow:"0 2px 8px #FF980022"}}>
                  <div style={{fontSize:11,color:"#aaa"}}>🎤 말하기</div>
                  <div style={{fontSize:20,fontWeight:900,color:"#E65100"}}>{sttScore}점</div>
                </div>
                <div style={{background:"#E65100",borderRadius:12,padding:"8px 16px",textAlign:"center"}}>
                  <div style={{fontSize:11,color:"rgba(255,255,255,.8)"}}>종합</div>
                  <div style={{fontSize:20,fontWeight:900,color:"white"}}>{score}점</div>
                </div>
              </div>
              <div style={{fontSize:12,color:"#aaa"}}>80점 이상 통과</div>
            </div>
            {/* 빈칸 결과 */}
            <div style={{fontSize:13,fontWeight:700,color:"#E65100",marginBottom:8}}>✍️ 빈칸 채우기</div>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:16}}>
              {(writingFb||[]).map(r=>(
                <div key={r.id} style={{background:r.ok?"#E8F5E9":"#FFF3E0",borderRadius:10,padding:"8px 12px",border:`1px solid ${r.ok?"#A5D6A7":"#FFCC80"}`}}>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontSize:13,color:"#333"}}>{r.sentence}</span>
                    <span style={{fontSize:12,color:r.ok?"#2E7D32":"#E65100",fontWeight:700}}>{r.ok?"✅":"❌"}</span>
                  </div>
                  {!r.ok&&<div style={{fontSize:11,color:"#888",marginTop:2}}>정답: <b>{r.answer}</b> / 내 답: {r.userAns||(vi?"(trống)":en?"(empty)":"(없음)")}</div>}
                </div>
              ))}
            </div>
            {/* STT 결과 */}
            <div style={{fontSize:13,fontWeight:700,color:"#E65100",marginBottom:8}}>🎤 따라 말하기</div>
            <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:20}}>
              {(sttFb||[]).map((r,i)=>(
                <div key={i} style={{background:r?.ok?"#E8F5E9":"#FFF3E0",borderRadius:10,padding:"8px 12px",border:`1px solid ${r?.ok?"#A5D6A7":"#FFCC80"}`}}>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontSize:13,color:"#333"}}>{r.sentence}</span>
                    <span style={{fontSize:12,color:r?.ok?"#2E7D32":"#E65100",fontWeight:700}}>{r?.ok?"✅":"❌"}</span>
                  </div>
                  {r?.result&&<div style={{fontSize:11,color:"#888",marginTop:2}}>말한 것: {r.result} ({r.similarity}%)</div>}
                  {!r?.result&&<div style={{fontSize:11,color:"#bbb",marginTop:2}}>{vi?"Chưa thử":en?"Not attempted":"시도 안 함"}</div>}
                </div>
              ))}
            </div>
            {passed ? (
              <button onClick={()=>{setJosaTestResult(null);setJosaTestAnswers({});setJosaTestQuestions([]);onReady?.();setUnitCardIdx(0);setStep("unit1");}}
                style={{width:"100%",background:"linear-gradient(135deg,#00C896,#00A876)",color:"white",border:"none",borderRadius:50,padding:"14px 0",fontSize:15,fontWeight:900,cursor:"pointer",boxShadow:"0 4px 16px #00C89644"}}>
                {vi?"Tiếp theo! 🚀":en?"Next! 🚀":"서술어 1단원으로! 🚀"}
              </button>
            ) : (
              <button onClick={()=>{setJosaTestResult(null);setJosaTestAnswers({});setJosaTestQuestions([]);setJosaStep(0);setJosaSTTMap({});setJosaListeningKey(null);setStep("josa");}}
                style={{width:"100%",background:"linear-gradient(135deg,#FF9800,#E65100)",color:"white",border:"none",borderRadius:50,padding:"14px 0",fontSize:15,fontWeight:900,cursor:"pointer"}}>
                🔄 {vi?"Học lại từ đầu":en?"Study again":"조사·대명사 처음부터 다시 학습"}
              </button>
            )}
          </div>
        </div>
      );
    }

    // 문제 풀기 화면
    return (
      <div style={{minHeight:"100vh",background:"linear-gradient(150deg,#FFFBF0,#FFF3E0)",display:"flex",flexDirection:"column",alignItems:"center",padding:"24px 16px 40px",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%",maxWidth:400}}>
          <div style={{fontSize:14,fontWeight:900,color:"#E65100",marginBottom:2}}>
            📝 {vi?"Bài kiểm tra — Trợ từ & Đại từ":en?"Test — Particles & Pronouns":"조사·대명사 테스트"}
          </div>
          <div style={{fontSize:12,color:"#aaa",marginBottom:18}}>
            {vi?"빈칸 채우기 + 따라 말하기":en?"Fill in blanks + Speak along":"✍️ 빈칸 채우기 + 🎤 따라 말하기"}
          </div>

          {/* 섹션1: 빈칸 채우기 */}
          <div style={{fontSize:13,fontWeight:700,color:"#E65100",marginBottom:8}}>✍️ 빈칸 채우기</div>
          {josaTestQuestions.map(q=>(
            <div key={q.id} style={{background:"white",borderRadius:12,padding:"12px 14px",marginBottom:8,border:"1px solid #FFE0B2"}}>
              <div style={{fontSize:14,fontWeight:700,color:"#333",marginBottom:6}}>{q.sentence}</div>
              <div style={{fontSize:11,color:"#FF9800",marginBottom:6}}>💡 {q.hint}</div>
              <input
                type="text"
                value={josaTestAnswers[q.id]||""}
                onChange={e=>setJosaTestAnswers(a=>({...a,[q.id]:e.target.value}))}
                onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Tab") e.stopPropagation(); }}
                placeholder={vi?"Điền vào...":en?"Fill in...":"여기에 쓰세요..."}
                style={{width:"100%",border:"2px solid #FFE0B2",borderRadius:8,padding:"7px 10px",fontSize:14,outline:"none",boxSizing:"border-box"}}
              />
            </div>
          ))}

          {/* 섹션2: 따라 말하기 */}
          <div style={{fontSize:13,fontWeight:700,color:"#E65100",margin:"18px 0 8px"}}>🎤 따라 말하기</div>
          <div style={{fontSize:11,color:"#aaa",marginBottom:10}}>{vi?"Nghe và đọc theo":en?"Listen and repeat":"🔊 듣고 따라 말해보세요"}</div>
          {STT_SENTENCES.map((sentence,i)=>{
            const key = i;
            const isListening = josaListeningKey === key;
            const result = josaSTTMap[key];
            return (
              <div key={i} style={{background:"white",borderRadius:12,padding:"12px 14px",marginBottom:8,border:`2px solid ${result?.ok?"#A5D6A7":result?"#FFCC80":"#FFE0B2"}`}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:result?6:0}}>
                  {/* 듣기 버튼 */}
                  <button onClick={()=>{
                    if(!window.speechSynthesis)return;
                    window.speechSynthesis.cancel();
                    const u=new SpeechSynthesisUtterance(sentence);
                    u.lang="ko-KR";u.rate=0.65;
                    window.speechSynthesis.speak(u);
                  }} style={{background:"#FF9800",border:"none",borderRadius:50,width:30,height:30,fontSize:13,cursor:"pointer",flexShrink:0}}>🔊</button>
                  {/* 문장 */}
                  <span style={{fontSize:14,fontWeight:700,color:"#333",flex:1}}>{sentence}</span>
                  {/* 말하기 버튼 — 이 카드만 활성화 */}
                  <button onClick={()=>{
                    if(!("webkitSpeechRecognition" in window)&&!("SpeechRecognition" in window)){
                      alert("Chrome 브라우저를 사용해주세요.");return;
                    }
                    if(isListening){setJosaListeningKey(null);return;}
                    setJosaListeningKey(key);
                    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
                    const rec=new SR();
                    rec.lang="ko-KR";rec.interimResults=false;rec.maxAlternatives=1;
                    rec.onresult=(e)=>{
                      const said=e.results[0][0].transcript.replace(/[.,!?]/g,"").trim();
                      const target=sentence.replace(/[.,!?]/g,"").trim();
                      let match=0;
                      for(const ch of said){if(target.includes(ch))match++;}
                      const sim=Math.round((match/Math.max(target.length,1))*100);
                      setJosaSTTMap(m=>({...m,[key]:{result:said,ok:sim>=60,similarity:sim}}));
                      setJosaListeningKey(null);
                    };
                    rec.onerror=()=>setJosaListeningKey(null);
                    rec.onend=()=>setJosaListeningKey(null);
                    rec.start();
                  }} style={{background:isListening?"#E53935":"#FF9800",border:"none",borderRadius:50,width:30,height:30,fontSize:13,cursor:"pointer",flexShrink:0}}>
                    {isListening?"⏹":"🎤"}
                  </button>
                  {result&&<span style={{fontSize:13,color:result.ok?"#2E7D32":"#E65100",fontWeight:700}}>{result.ok?"✅":"❌"}</span>}
                </div>
                {result&&<div style={{fontSize:11,color:"#888"}}>말한 것: {result.result} ({result.similarity}%)</div>}
              </div>
            );
          })}

          <button type="button" onClick={gradeJosaTest}
            style={{width:"100%",background:"linear-gradient(135deg,#FF6B35,#E64A00)",color:"white",border:"none",borderRadius:50,padding:"14px 0",fontSize:15,fontWeight:900,cursor:"pointer",marginTop:12,boxShadow:"0 4px 16px #FF6B3544"}}>
            {vi?"Nộp bài!":en?"Submit!":"채점하기! 📊"}
          </button>
          <button onClick={()=>{setJosaStep(5);setStep("josa");}}
            style={{marginTop:12,background:"none",border:"none",color:"#aaa",fontSize:12,cursor:"pointer",display:"block",margin:"12px auto 0"}}>
            ← {vi?"Quay lại":en?"Back":"뒤로"}
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // ✅ V156: 서술어 1단원 학습 화면 — 이에요/이다 (A=B)
  // ════════════════════════════════════════════════════════
  if (step === "unit1") {
    const vi = lang?.code === "vi";
    const en = lang?.code === "en";

    // 확인하기 버튼 — 입력값 TTS로 읽고 정답 공개
    function handleUnitCardSubmit() {
      if (!unitCardInput.trim()) return;
      setUnitCardRevealed(true);
      // 학습자가 쓴 답을 TTS로 읽어줌
      speakKo(unitCardInput.trim());
    }

    const UNIT1_CARDS = [
      {
        front: "저는 학생___.",
        blank: "입니다",
        full: "저는 학생입니다.",
        hint: vi?"받침 ㅇ 있어요 → 이__요":en?"Has final consonant ㅇ → 이__요":"받침 ㅇ 있어요 → 이__요",
      },
      {
        front: "여기는 학교___.",
        blank: "입니다",
        full: "여기는 학교입니다.",
        hint: vi?"받침 없어요 → __요":en?"No final consonant → __요":"받침 없어요 → __요",
      },
      {
        front: "저는 의사___.",
        blank: "입니다",
        full: "저는 의사입니다.",
        hint: vi?"받침 없어요 → __요":en?"No final consonant → __요":"받침 없어요 → __요",
      },
      {
        front: "오늘은 월요일___.",
        blank: "입니다",
        full: "오늘은 월요일입니다.",
        hint: vi?"받침 ㄹ 있어요 → 이__요":en?"Has final consonant ㄹ → 이__요":"받침 ㄹ 있어요 → 이__요",
      },
      {
        front: "저는 베트남 사람___.",
        blank: "입니다",
        full: "저는 베트남 사람입니다.",
        hint: vi?"받침 ㅁ 있어요 → 이__요":en?"Has final consonant ㅁ → 이__요":"받침 ㅁ 있어요 → 이__요",
      },
      {
        front: "제 이름은 마중___.",
        blank: "입니다",
        full: "제 이름은 마중입니다.",
        hint: vi?"받침 ㅇ 있어요 → 이__요":en?"Has final consonant ㅇ → 이__요":"받침 ㅇ 있어요 → 이__요",
      },
    ];
    const card = UNIT1_CARDS[unitCardIdx];
    const total = UNIT1_CARDS.length;
    return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#E8F8F2,#D0F0E4)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        {/* 헤더 */}
        <div style={{width:"100%", maxWidth:400, marginBottom:16}}>
          <div style={{fontSize:12, color:"#00A876", fontWeight:700, marginBottom:6}}>
            📘 {vi?"Bài 1 — Trợ từ 이에요/이다":en?"Unit 1 — Predicate 이에요/이다":"서술어 1단원 — 이에요/이다 (A=B)"}
          </div>
          {/* 진행 바 */}
          <div style={{display:"flex", gap:4}}>
            {UNIT1_CARDS.map((_,i)=>(
              <div key={i} style={{flex:1, height:5, borderRadius:3, background: i<unitCardIdx?"#00C896": i===unitCardIdx?"#00A876":"#cce8dc", transition:"all .3s"}}/>
            ))}
          </div>
          <div style={{fontSize:11, color:"#aaa", marginTop:4, textAlign:"right"}}>{unitCardIdx+1} / {total}</div>
        </div>

        {/* 카드 */}
        <div style={{width:"100%", maxWidth:400, background:"white", borderRadius:20, padding:28, boxShadow:"0 8px 32px #00C89622", marginBottom:16}}>
          <div style={{fontSize:13, color:"#aaa", marginBottom:16, textAlign:"center"}}>
            {vi?"Điền vào chỗ trống":en?"Fill in the blank":"빈칸을 채워보세요 ✍️"}
          </div>

          {/* 빈칸 문장 — ___ 부분을 input으로 */}
          <div style={{fontSize:20, fontWeight:900, color:"#1A3A2A", textAlign:"center", marginBottom:16, lineHeight:1.8}}>
            {card.front.split("___")[0]}
            <input
              type="text"
              value={unitCardInput}
              onChange={e=>setUnitCardInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter" && !unitCardRevealed && unitCardInput.trim()) { e.preventDefault(); handleUnitCardSubmit(); } }}
              disabled={unitCardRevealed}
              placeholder="..."
              style={{
                display:"inline-block", width:80, textAlign:"center",
                border:"none", borderBottom:`3px solid ${unitCardRevealed?(unitCardInput.trim()===card.blank?"#00C896":"#FF6B35"):"#00C896"}`,
                fontSize:20, fontWeight:900, color:"#00A876", background:"transparent",
                outline:"none", padding:"0 4px"
              }}
            />
            {card.front.split("___")[1]}
          </div>

          {/* 정답 공개 후: 전체 문장 + TTS 듣기 버튼 */}
          {unitCardRevealed && (
            <div style={{textAlign:"center", marginBottom:12}}>
              <div style={{fontSize:15, color: unitCardInput.trim()===card.blank?"#00A876":"#FF6B35", fontWeight:700, marginBottom:8}}>
                {unitCardInput.trim()===card.blank ? "✅ 정답!" : `❌ 정답: ${card.blank}`}
              </div>
              <div style={{fontSize:14, color:"#555", marginBottom:12}}>→ {card.full}</div>
              <button onClick={()=>{
                speakKo(card.full);
              }} style={{background:"#00C896", border:"none", borderRadius:50, padding:"8px 20px", color:"white", fontSize:13, fontWeight:700, cursor:"pointer"}}>
                🔊 {vi?"Nghe lại":en?"Listen":"전체 문장 듣기"}
              </button>
            </div>
          )}

          {/* 힌트 */}
          <div style={{background:"#F0FBF6", borderRadius:12, padding:"10px 14px", fontSize:13, color:"#555", textAlign:"center"}}>
            💡 {card.hint}
          </div>
        </div>

        {/* 규칙 요약 (첫 카드에만, 정답 공개 전) */}
        {!unitCardRevealed && (
          <div style={{width:"100%", maxWidth:400, background:"white", borderRadius:16, padding:16, marginBottom:16, fontSize:12, color:"#444"}}>
            <div style={{fontWeight:900, color:"#00A876", marginBottom:8}}>📌 {vi?"Quy tắc":en?"Rule":"핵심 규칙"}</div>
            <div>· 받침 <b>있음</b> → <b>이__요</b> &nbsp;(학생, 사람, 월요일 + ?)</div>
            <div>· 받침 <b>없음</b> → <b>__요</b> &nbsp;(학교, 의사, 커피 + ?)</div>
            <div>· 높임 → <b>이세요</b> &nbsp;(선생님, 교수님 + ?)</div>
          </div>
        )}

        {/* 버튼 — 입력 전: 확인하기 / 정답 공개 후: 다음 */}
        {!unitCardRevealed ? (
          <button onClick={handleUnitCardSubmit} disabled={!unitCardInput.trim()}
            style={{width:"100%", maxWidth:400, background: unitCardInput.trim()?"linear-gradient(135deg,#00C896,#00A876)":"#ccc", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor: unitCardInput.trim()?"pointer":"default", boxShadow: unitCardInput.trim()?"0 4px 16px #00C89644":"none"}}>
            {vi?"Kiểm tra":en?"Check":"확인하기 ✓"}
          </button>
        ) : unitCardIdx < total - 1 ? (
          <button onClick={()=>{ setUnitCardIdx(i=>i+1); setUnitCardInput(""); setUnitCardRevealed(false); }}
            style={{width:"100%", maxWidth:400, background:"linear-gradient(135deg,#00C896,#00A876)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", boxShadow:"0 4px 16px #00C89644"}}>
            {vi?"Tiếp theo →":en?"Next →":"다음 →"} ({unitCardIdx+2}/{total})
          </button>
        ) : (
          <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit1b"); }}
            style={{width:"100%", maxWidth:400, background:"linear-gradient(135deg,#00C896,#00A876)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", boxShadow:"0 4px 16px #00C89644"}}>
            {vi?"Tiếp theo: Bài 1B →":en?"Next: Unit 1B →":"다음 단계로 → (1B단원) 🚀"}
          </button>
        )}
        <button onClick={()=>{setStep("josa"); setJosaStep(5);}}
          style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer"}}>
          ← {vi?"Quay lại":en?"Back":"뒤로"}
        </button>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // ✅ V180: 1B단원 — 아니에요 + 묻고 답하기
  // ════════════════════════════════════════════════════════
  if (step === "unit1b") {
    const vi = lang?.code === "vi";
    const en = lang?.code === "en";

    function handleUnit1bSubmit() {
      if (!unitCardInput.trim()) return;
      setUnitCardRevealed(true);
      speakKo(unitCardInput.trim());
    }

    const UNIT1B_CARDS = [
      {
        front: "저는 선생님이 ___.",
        blank: "아닙니다",
        full: "저는 선생님이 아닙니다.",
        hint: vi?"이에요/예요의 반대말은?":en?"Opposite of 이에요/예요?":"이에요/예요의 반대말은?",
      },
      {
        front: "이분은 학생이 ___.",
        blank: "아닙니다",
        full: "이분은 학생이 아닙니다.",
        hint: vi?"선생님이에요 → 학생이 ___?":en?"Is a teacher → not a student → ___?":"선생님이에요 → 학생이 ___?",
      },
      {
        front: "이름이 ___?",
        blank: "무엇입니까",
        full: "이름이 무엇입니까?",
        hint: vi?"이름을 물어볼 때 → 이름이 ___?":en?"Asking someone's name → 이름이 ___?":"이름을 물어볼 때 → 이름이 ___?",
      },
      {
        front: "직업이 ___?",
        blank: "무엇입니까",
        full: "직업이 무엇입니까?",
        hint: vi?"직업을 물어볼 때 → 직업이 ___?":en?"Asking someone's job → 직업이 ___?":"직업을 물어볼 때 → 직업이 ___?",
      },
      {
        front: "저는 요리사___.",
        blank: "입니다",
        full: "저는 요리사입니다.",
        hint: vi?"받침 없어요 → __요":en?"No final consonant → __요":"받침 없어요 → __요",
      },
      {
        front: "저는 간호사___.",
        blank: "입니다",
        full: "저는 간호사입니다.",
        hint: vi?"받침 없어요 → __요":en?"No final consonant → __요":"받침 없어요 → __요",
      },
    ];

    const card = UNIT1B_CARDS[unitCardIdx];
    const total = UNIT1B_CARDS.length;

    return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#E8F8F2,#D0F0E4)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:400, marginBottom:16}}>
          <div style={{fontSize:12, color:"#00A876", fontWeight:700, marginBottom:6}}>
            📘 {vi?"Bài 1B — 아니에요 + 묻고 답하기":en?"Unit 1B — 아니에요 + Q&A":"서술어 1B단원 — 아니에요 · 묻고 답하기"}
          </div>
          <div style={{display:"flex", gap:4}}>
            {UNIT1B_CARDS.map((_,i)=>(
              <div key={i} style={{flex:1, height:5, borderRadius:3, background: i<unitCardIdx?"#00C896": i===unitCardIdx?"#00A876":"#cce8dc", transition:"all .3s"}}/>
            ))}
          </div>
          <div style={{fontSize:11, color:"#aaa", marginTop:4, textAlign:"right"}}>{unitCardIdx+1} / {total}</div>
        </div>

        <div style={{width:"100%", maxWidth:400, background:"white", borderRadius:20, padding:28, boxShadow:"0 8px 32px #00C89622", marginBottom:16}}>
          <div style={{fontSize:13, color:"#aaa", marginBottom:16, textAlign:"center"}}>
            {vi?"Điền vào chỗ trống":en?"Fill in the blank":"빈칸을 채워보세요 ✍️"}
          </div>
          <div style={{fontSize:20, fontWeight:900, color:"#1A3A2A", textAlign:"center", marginBottom:16, lineHeight:1.8}}>
            {card.front.split("___")[0]}
            <input
              type="text"
              value={unitCardInput}
              onChange={e=>setUnitCardInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter" && !unitCardRevealed && unitCardInput.trim()) { e.preventDefault(); handleUnit1bSubmit(); } }}
              disabled={unitCardRevealed}
              placeholder="..."
              style={{
                display:"inline-block", width:90, textAlign:"center",
                border:"none", borderBottom:`3px solid ${unitCardRevealed?(unitCardInput.trim()===card.blank?"#00C896":"#FF6B35"):"#00C896"}`,
                fontSize:20, fontWeight:900, color:"#00A876", background:"transparent",
                outline:"none", padding:"0 4px"
              }}
            />
            {card.front.split("___")[1]}
          </div>

          {unitCardRevealed && (
            <div style={{textAlign:"center", marginBottom:12}}>
              <div style={{fontSize:15, color: unitCardInput.trim()===card.blank?"#00A876":"#FF6B35", fontWeight:700, marginBottom:8}}>
                {unitCardInput.trim()===card.blank ? "✅ 정답!" : `❌ 정답: ${card.blank}`}
              </div>
              <div style={{fontSize:14, color:"#555", marginBottom:12}}>→ {card.full}</div>
              <button onClick={()=>speakKo(card.full)}
                style={{background:"#00C896", border:"none", borderRadius:50, padding:"8px 20px", color:"white", fontSize:13, fontWeight:700, cursor:"pointer"}}>
                🔊 {vi?"Nghe lại":en?"Listen":"전체 문장 듣기"}
              </button>
            </div>
          )}

          <div style={{background:"#F0FBF6", borderRadius:12, padding:"10px 14px", fontSize:13, color:"#555", textAlign:"center"}}>
            💡 {card.hint}
          </div>
        </div>

        {!unitCardRevealed && (
          <div style={{width:"100%", maxWidth:400, background:"white", borderRadius:16, padding:16, marginBottom:16, fontSize:12, color:"#444"}}>
            <div style={{fontWeight:900, color:"#00A876", marginBottom:8}}>📌 {vi?"Ví dụ":en?"Examples":"패턴 보기"}</div>
            <div>· 이에요/예요의 반대말 → <b>이 ___</b></div>
            <div>· 이름을 물어볼 때 → <b>이름이 ___?</b></div>
            <div>· 직업을 물어볼 때 → <b>직업이 ___?</b></div>
          </div>
        )}

        {!unitCardRevealed ? (
          <button onClick={handleUnit1bSubmit} disabled={!unitCardInput.trim()}
            style={{width:"100%", maxWidth:400, background: unitCardInput.trim()?"linear-gradient(135deg,#00C896,#00A876)":"#ccc", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor: unitCardInput.trim()?"pointer":"default", boxShadow: unitCardInput.trim()?"0 4px 16px #00C89644":"none"}}>
            {vi?"Kiểm tra":en?"Check":"확인하기 ✓"}
          </button>
        ) : unitCardIdx < total - 1 ? (
          <button onClick={()=>{ setUnitCardIdx(i=>i+1); setUnitCardInput(""); setUnitCardRevealed(false); }}
            style={{width:"100%", maxWidth:400, background:"linear-gradient(135deg,#00C896,#00A876)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", boxShadow:"0 4px 16px #00C89644"}}>
            {vi?"Tiếp theo →":en?"Next →":"다음 →"} ({unitCardIdx+2}/{total})
          </button>
        ) : (
          <button onClick={()=>{ setTestAnswers({}); setTestResult(null); setTestQuestions([]); setTestLoading(true); setStep("test1"); }}
            style={{width:"100%", maxWidth:400, background:"linear-gradient(135deg,#FF6B35,#E64A00)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", boxShadow:"0 4px 16px #FF6B3544"}}>
            📝 {vi?"Làm bài kiểm tra!":en?"Take the test!":"누적 테스트 시작! (1A+1B) 📝"}
          </button>
        )}
        <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit1"); }}
          style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer"}}>
          ← {vi?"Quay lại":en?"Back":"뒤로 (1A단원)"}
        </button>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // ✅ V152: 누적 테스트 화면 — 서술어 1단원 (발음+조사+1단원 전체)
  // ════════════════════════════════════════════════════════
  if (step === "test1") {
    const vi = lang?.code === "vi";
    const en = lang?.code === "en";
    // 채점 함수
    function gradeTest() {
      if (testQuestions.length === 0) return;
      let correct = 0;
      const feedback = testQuestions.map(q => {
        const userAns = (testAnswers[q.id] || "").trim();
        // answers 배열(복수정답) 또는 answer 단일 정답 모두 지원
        const validAnswers = q.answers || (q.answer ? [q.answer] : []);
        const ok = validAnswers.some(a =>
          userAns === a || userAns.replace(/\s/g,"") === a.replace(/\s/g,"")
        );
        if (ok) correct++;
        return {...q, userAns, ok};
      });
      const score = Math.round((correct / testQuestions.length) * 100);
      const passed = score >= 80;

      // Firestore + localStorage 진도 저장
      if (passed) {
        const newPassed = [...new Set([...unitsPassed, 1])];
        setUnitsPassed(newPassed);
        localStorage.setItem(`hc_units_${user?.uid}`, JSON.stringify(newPassed));
        try {
          const { doc, updateDoc } = window._firestore || {};
          if (doc && updateDoc) {
            updateDoc(doc(db,"users",user.uid), {
              unitsPassed: newPassed, currentUnit: 2
            });
          }
        } catch(_) {}
      }
      setTestResult({passed, score, correct, total: testQuestions.length, feedback});
    }

    // 로딩 화면
    if (testLoading) return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#E8F8F2,#D0F0E4)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <div style={{fontSize:48, marginBottom:16}}>⏳</div>
        <div style={{fontSize:18, fontWeight:700, color:"#00A876"}}>문제 생성 중...</div>
        <div style={{fontSize:13, color:"#888", marginTop:8}}>잠깐만요 🙏</div>
      </div>
    );

    // 문제가 없으면 (API 실패 후 fallback도 없는 경우) 방어
    if (testQuestions.length === 0) return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#E8F8F2,#D0F0E4)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", padding:24}}>
        <div style={{fontSize:48, marginBottom:16}}>⚠️</div>
        <div style={{fontSize:16, fontWeight:700, color:"#E64A00", marginBottom:8}}>문제를 불러오지 못했어요</div>
        <div style={{fontSize:12, color:"#aaa", marginBottom:4}}>loading: {String(testLoading)}</div>
        <div style={{fontSize:12, color:"#aaa", marginBottom:16}}>questions: {testQuestions.length}개</div>
        <button onClick={()=>{ setTestQuestions([]); setTestLoading(false); setTestResult(null); setTestAnswers({}); setStep("unit1"); }} style={{background:"#00C896", border:"none", borderRadius:50, padding:"12px 28px", color:"white", fontSize:14, fontWeight:700, cursor:"pointer", marginBottom:8}}>← 단원으로 돌아가기</button>
        <button onClick={()=>{ setTestQuestions([]); setTestLoading(false); }} style={{background:"#FF8C42", border:"none", borderRadius:50, padding:"12px 28px", color:"white", fontSize:14, fontWeight:700, cursor:"pointer"}}>🔄 다시 시도</button>
      </div>
    );

    // 결과 화면
    if (testResult) {
      return (
        <div style={{minHeight:"100vh", background: testResult.passed?"linear-gradient(150deg,#E8F8F2,#D0F0E4)":"linear-gradient(150deg,#FFF0F0,#FFE0E0)", display:"flex", flexDirection:"column", alignItems:"center", padding:"28px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
          <div style={{width:"100%", maxWidth:400}}>
            <div style={{textAlign:"center", marginBottom:24}}>
              <div style={{fontSize:56}}>{testResult.passed?"🎉":"💪"}</div>
              <div style={{fontSize:22, fontWeight:900, color: testResult.passed?"#00A876":"#E64A00", marginBottom:4}}>
                {testResult.passed
                  ? (vi?"Xuất sắc! Qua rồi!":en?"Excellent! You passed!":"통과! 🎉")
                  : (vi?"Chưa qua. Học lại nhé!":en?"Not passed. Study again!":"미통과 😢 다시 학습해요")}
              </div>
              <div style={{fontSize:28, fontWeight:900, color: testResult.passed?"#00C896":"#FF6B6B"}}>
                {testResult.score}점 ({testResult.correct}/{testResult.total})
              </div>
              <div style={{fontSize:13, color:"#888", marginTop:4}}>
                {vi?"Tiêu chuẩn đạt: 80점 이상":en?"Pass standard: 80+ points":"통과 기준: 80점 이상"}
              </div>
            </div>

            {/* 문제별 결과 */}
            <div style={{background:"white", borderRadius:16, padding:16, marginBottom:20}}>
              {testResult.feedback.map(q=>(
                <div key={q.id} style={{marginBottom:12, padding:10, borderRadius:10, background: q.ok?"#F0FBF6":"#FFF0F0"}}>
                  <div style={{fontSize:13, color:"#555"}}>{q.sentence}</div>
                  <div style={{fontSize:12, marginTop:4}}>
                    {q.ok
                      ? <span style={{color:"#00A876", fontWeight:700}}>✅ {q.answer}</span>
                      : <><span style={{color:"#E64A00"}}>❌ 내 답: {q.userAns||"(없음)"}</span> → <span style={{color:"#00A876", fontWeight:700}}>정답: {q.answer}</span></>
                    }
                  </div>
                </div>
              ))}
            </div>

            {testResult.passed ? (
              <button onClick={()=>{setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit2");}}
                style={{width:"100%", background:"linear-gradient(135deg,#00C896,#00A876)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", boxShadow:"0 4px 16px #00C89644"}}>
                {vi?"Tiếp tục — Bài 2! 🚀":en?"Continue — Unit 2! 🚀":"2단원으로 계속하기 🚀"}
              </button>
            ) : (
              <button onClick={()=>{setUnitCardIdx(0); setTestResult(null); setTestAnswers({}); setTestQuestions([]); setStep("unit1");}}
                style={{width:"100%", background:"linear-gradient(135deg,#FF8C42,#E64A00)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", boxShadow:"0 4px 16px #FF8C4244"}}>
                {vi?"Học lại từ đầu 🔄":en?"Study again from start 🔄":"1단원 처음부터 다시 학습 🔄"}
              </button>
            )}
          </div>
        </div>
      );
    }

    // 문제 풀기 화면
    return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#FFF8F0,#FFE8D0)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:400}}>
          <div style={{fontSize:14, fontWeight:900, color:"#E64A00", marginBottom:4}}>
            📝 {vi?"Bài kiểm tra — Tổng hợp (Bài 1)":en?"Test — Cumulative (Unit 1)":"누적 테스트 — 1단원"}
          </div>
          <div style={{fontSize:12, color:"#aaa", marginBottom:16}}>
            {vi?"Phạm vi: Phát âm + Trợ từ + Đại từ nghi vấn + Bài 1":
             en?"Scope: Pronunciation + Particles + Interrogatives + Unit 1":
             "범위: 발음 + 조사 + 의문대명사 + 서술어 1단원 전체"}
          </div>

          {testLoading ? (
            <div style={{textAlign:"center", padding:40}}>
              <div style={{fontSize:32, marginBottom:12}}>⏳</div>
              <div style={{color:"#E64A00", fontWeight:700}}>
                {vi?"Đang tạo câu hỏi...":en?"Generating questions...":"문제 생성 중..."}
              </div>
            </div>
          ) : (
            <>
              {testQuestions.map((q,qi)=>(
                <div key={q.id} style={{background:"white", borderRadius:16, padding:16, marginBottom:12, boxShadow:"0 2px 8px #E64A0011"}}>
                  <div style={{fontSize:12, color:"#aaa", marginBottom:6}}>문제 {qi+1}</div>
                  <div style={{fontSize:16, fontWeight:700, color:"#333", marginBottom:4}}>{q.sentence}</div>
                  {q.hint && <div style={{fontSize:12, color:"#888", marginBottom:8}}>
                    💡 {q.hint.split(/(→|·|:)/).map((part, i) =>
                      i === 0
                        ? <strong key={i} style={{color:"#E64A00", fontWeight:900}}>{part}</strong>
                        : <span key={i} style={{color:"#888"}}>{part}</span>
                    )}
                  </div>}
                  <input
                    value={testAnswers[q.id]||""}
                    onChange={e=>setTestAnswers(a=>({...a,[q.id]:e.target.value}))}
                    placeholder={vi?"Nhập câu trả lời...":en?"Type your answer...":"답을 입력하세요..."}
                    style={{width:"100%", border:"2px solid #FFD0A0", borderRadius:10, padding:"10px 12px", fontSize:14, outline:"none", boxSizing:"border-box", fontFamily:"inherit"}}
                  />
                </div>
              ))}

              {testQuestions.length > 0 && (
                <button onClick={gradeTest}
                  style={{width:"100%", background:"linear-gradient(135deg,#FF8C42,#E64A00)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", marginTop:8, boxShadow:"0 4px 16px #FF8C4244"}}>
                  {vi?"Nộp bài ✅":en?"Submit ✅":"제출하기 ✅"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // ✅ V168: 서술어 2단원 학습 화면 — 있다/없다/많다/적다
  // ════════════════════════════════════════════════════════
  if (step === "unit2") {
    const vi = lang?.code === "vi";
    const en = lang?.code === "en";

    function handleUnit2Submit() {
      if (!unitCardInput.trim()) return;
      setUnitCardRevealed(true);
      speakKo(unitCardInput.trim());
    }

    const UNIT2_CARDS = [
      {
        front: "시간이 ___.",
        blank: "있습니다",
        full: "시간이 있습니다.",
        hint: vi?"'có' — dùng khi có thứ gì đó":en?"Use when something IS there":"뭔가 있을 때 쓰는 말",
      },
      {
        front: "돈이 ___.",
        blank: "없습니다",
        full: "돈이 없습니다.",
        hint: vi?"'không có' — dùng khi không có thứ gì":en?"Use when something is NOT there":"뭔가 없을 때 쓰는 말",
      },
      {
        front: "친구가 ___.",
        blank: "많습니다",
        full: "친구가 많습니다.",
        hint: vi?"Số lượng lớn → dùng từ gì?":en?"A lot → which word?":"수가 많을 때 → 어떤 말?",
      },
      {
        front: "시간이 ___.",
        blank: "없습니다",
        full: "시간이 없습니다.",
        hint: vi?"'có' = 있다 → 'không có' = ?":en?"'있다' = have → opposite?":"앞에서 배운 '있다'의 반대말",
      },
      {
        front: "사람이 ___.",
        blank: "많습니다",
        full: "사람이 많습니다.",
        hint: vi?"Rất nhiều người → từ nào?":en?"So many people → which word?":"사람이 아주 많을 때 → 어떤 말?",
      },
      {
        front: "학생이 ___.",
        blank: "적습니다",
        full: "학생이 적습니다.",
        hint: vi?"Ít người → ngược với '많다'":en?"Few → opposite of '많다'":"'많다'의 반대말",
      },
    ];

    const card = UNIT2_CARDS[unitCardIdx];
    const total = UNIT2_CARDS.length;

    return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#E8F4FE,#D0E8FD)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        {/* 헤더 */}
        <div style={{width:"100%", maxWidth:400, marginBottom:16}}>
          <div style={{fontSize:12, color:"#1565C0", fontWeight:700, marginBottom:6}}>
            📘 {vi?"Bài 2 — Vị ngữ 있다·없다·많다·적다":en?"Unit 2 — Predicates 있다·없다·많다·적다":"서술어 2단원 — 있다·없다·많다·적다"}
          </div>
          <div style={{display:"flex", gap:4}}>
            {UNIT2_CARDS.map((_,i)=>(
              <div key={i} style={{flex:1, height:5, borderRadius:3, background: i<unitCardIdx?"#1E88E5": i===unitCardIdx?"#1565C0":"#BBDEFB", transition:"all .3s"}}/>
            ))}
          </div>
          <div style={{fontSize:11, color:"#aaa", marginTop:4, textAlign:"right"}}>{unitCardIdx+1} / {total}</div>
        </div>

        {/* 카드 */}
        <div style={{width:"100%", maxWidth:400, background:"white", borderRadius:20, padding:28, boxShadow:"0 8px 32px #1E88E522", marginBottom:16}}>
          <div style={{fontSize:13, color:"#aaa", marginBottom:16, textAlign:"center"}}>
            {vi?"Điền vào chỗ trống":en?"Fill in the blank":"빈칸을 채워보세요 ✍️"}
          </div>
          <div style={{fontSize:20, fontWeight:900, color:"#1A2A3A", textAlign:"center", marginBottom:16, lineHeight:1.8}}>
            {card.front.split("___")[0]}
            <input
              type="text"
              value={unitCardInput}
              onChange={e=>setUnitCardInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter" && !unitCardRevealed && unitCardInput.trim()) { e.preventDefault(); handleUnit2Submit(); } }}
              disabled={unitCardRevealed}
              placeholder="..."
              style={{
                display:"inline-block", width:90, textAlign:"center",
                border:"none", borderBottom:`3px solid ${unitCardRevealed?(unitCardInput.trim()===card.blank?"#1E88E5":"#FF6B35"):"#1E88E5"}`,
                fontSize:20, fontWeight:900, color:"#1565C0", background:"transparent",
                outline:"none", padding:"0 4px"
              }}
            />
            {card.front.split("___")[1]}
          </div>

          {unitCardRevealed && (
            <div style={{textAlign:"center", marginBottom:12}}>
              <div style={{fontSize:15, color: unitCardInput.trim()===card.blank?"#1565C0":"#FF6B35", fontWeight:700, marginBottom:8}}>
                {unitCardInput.trim()===card.blank ? "✅ 정답!" : `❌ 정답: ${card.blank}`}
              </div>
              <div style={{fontSize:14, color:"#555", marginBottom:12}}>→ {card.full}</div>
              <button onClick={()=>speakKo(card.full)}
                style={{background:"#1E88E5", border:"none", borderRadius:50, padding:"8px 20px", color:"white", fontSize:13, fontWeight:700, cursor:"pointer"}}>
                🔊 {vi?"Nghe lại":en?"Listen":"전체 문장 듣기"}
              </button>
            </div>
          )}
          <div style={{background:"#EEF6FF", borderRadius:12, padding:"10px 14px", fontSize:13, color:"#555", textAlign:"center"}}>
            💡 {card.hint}
          </div>
        </div>

        {/* 규칙 요약 (첫 카드에만) */}
        {!unitCardRevealed && (
          <div style={{width:"100%", maxWidth:400, background:"white", borderRadius:16, padding:16, marginBottom:16, fontSize:12, color:"#444"}}>
            <div style={{fontWeight:900, color:"#1565C0", marginBottom:8}}>📌 {vi?"Quy tắc":en?"Rule":"핵심 규칙"}</div>
            <div>· 있다 → <b>있__요</b> &nbsp;(책 + 있다 + ?)</div>
            <div>· 없다 → <b>없__요</b> &nbsp;(우유 + 없다 + ?)</div>
            <div>· 많다 → <b>많__요</b> &nbsp;(숙제 + 많다 + ?)</div>
            <div>· 적다 → <b>적__요</b> &nbsp;(물 + 적다 + ?)</div>
          </div>
        )}

        {!unitCardRevealed ? (
          <button onClick={handleUnit2Submit} disabled={!unitCardInput.trim()}
            style={{width:"100%", maxWidth:400, background: unitCardInput.trim()?"linear-gradient(135deg,#1E88E5,#1565C0)":"#ccc", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor: unitCardInput.trim()?"pointer":"default", boxShadow: unitCardInput.trim()?"0 4px 16px #1E88E544":"none"}}>
            {vi?"Kiểm tra":en?"Check":"확인하기 ✓"}
          </button>
        ) : unitCardIdx < total - 1 ? (
          <button onClick={()=>{ setUnitCardIdx(i=>i+1); setUnitCardInput(""); setUnitCardRevealed(false); }}
            style={{width:"100%", maxWidth:400, background:"linear-gradient(135deg,#1E88E5,#1565C0)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", boxShadow:"0 4px 16px #1E88E544"}}>
            {vi?"Tiếp theo →":en?"Next →":"다음 →"} ({unitCardIdx+2}/{total})
          </button>
        ) : (
          <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit2b"); }}
            style={{width:"100%", maxWidth:400, background:"linear-gradient(135deg,#43A047,#2E7D32)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", boxShadow:"0 4px 16px #43A04744"}}>
            {vi?"Tiếp theo — Bài 2B →":en?"Next — Unit 2B →":"다음 → 2B단원 (위치 표현) 🚀"}
          </button>
        )}
        <button onClick={()=>{ setTestResult(null); setTestAnswers({}); setTestQuestions([]); setUnitCardIdx(0); setStep("test1"); }}
          style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer"}}>
          ← {vi?"Quay lại":en?"Back":"뒤로 (1단원 테스트)"}
        </button>
      </div>
    );
  }


  // ════════════════════════════════════════════════════════
  // ✅ V181: 서술어 2B단원 — 어디에 있어요? (위치 표현)
  // ════════════════════════════════════════════════════════
  if (step === "unit2b") {
    const vi = lang?.code === "vi";
    const en = lang?.code === "en";

    function handleUnit2bSubmit() {
      if (!unitCardInput.trim()) return;
      setUnitCardRevealed(true);
      speakKo(unitCardInput.trim());
    }

    const UNIT2B_CARDS = [
      {
        front: "책상 위에 책이 ___.",
        blank: "있습니다",
        full: "책상 위에 책이 있습니다.",
        hint: vi?"'있다' = có (dùng cho vị trí)":en?"'있다' = exists (for location)":"위치 + 있어요 — ~에 있어요",
      },
      {
        front: "의자 아래에 가방이 ___.",
        blank: "있습니다",
        full: "의자 아래에 가방이 있습니다.",
        hint: vi?"아래 = dưới — vật ở dưới":en?"아래 = below — object is below":"아래 = 밑이에요",
      },
      {
        front: "화장실이 어디에 ___?",
        blank: "있습니까",
        full: "화장실이 어디에 있습니까?",
        hint: vi?"어디에 있어요? = ở đâu?":en?"어디에 있어요? = Where is it?":"어디에 있어요? = Where is ~?",
      },
      {
        front: "냉장고 앞에 고양이가 ___.",
        blank: "있습니다",
        full: "냉장고 앞에 고양이가 있습니다.",
        hint: vi?"앞 = trước — trước tủ lạnh":en?"앞 = in front of":"앞 = 정면이에요",
      },
      {
        front: "은행 옆에 편의점이 ___.",
        blank: "있습니다",
        full: "은행 옆에 편의점이 있습니다.",
        hint: vi?"옆 = bên cạnh — cạnh bên":en?"옆 = next to, beside":"옆 = 나란히 있어요",
      },
      {
        front: "가방 안에 지갑이 ___.",
        blank: "있습니다",
        full: "가방 안에 지갑이 있습니다.",
        hint: vi?"안 = bên trong — bên trong túi":en?"안 = inside":"안 = 속이에요",
      },
    ];

    const card = UNIT2B_CARDS[unitCardIdx];
    const total = UNIT2B_CARDS.length;

    return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#E8F4FE,#D0E8FD)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        {/* 헤더 */}
        <div style={{width:"100%", maxWidth:400, marginBottom:16}}>
          <div style={{fontSize:12, color:"#1565C0", fontWeight:700, marginBottom:6}}>
            📘 {vi?"Bài 2B — Ở đâu? (vị trí)":en?"Unit 2B — Where is it? (location)":"서술어 2B단원 — 어디에 있어요? (위치 표현)"}
          </div>
          <div style={{display:"flex", gap:4}}>
            {UNIT2B_CARDS.map((_,i)=>(
              <div key={i} style={{flex:1, height:5, borderRadius:3, background: i<unitCardIdx?"#1E88E5": i===unitCardIdx?"#1565C0":"#BBDEFB", transition:"all .3s"}}/>
            ))}
          </div>
          <div style={{fontSize:11, color:"#aaa", marginTop:4, textAlign:"right"}}>{unitCardIdx+1} / {total}</div>
        </div>

        {/* 카드 */}
        <div style={{width:"100%", maxWidth:400, background:"white", borderRadius:20, padding:28, boxShadow:"0 8px 32px #1E88E522", marginBottom:16}}>
          <div style={{fontSize:13, color:"#aaa", marginBottom:16, textAlign:"center"}}>
            {vi?"Điền vào chỗ trống":en?"Fill in the blank":"빈칸을 채워보세요 ✍️"}
          </div>
          <div style={{fontSize:20, fontWeight:900, color:"#1A2A3A", textAlign:"center", marginBottom:16, lineHeight:1.8}}>
            {card.front.split("___")[0]}
            <input
              type="text"
              value={unitCardInput}
              onChange={e=>setUnitCardInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter" && !unitCardRevealed && unitCardInput.trim()) { e.preventDefault(); handleUnit2bSubmit(); } }}
              disabled={unitCardRevealed}
              placeholder="..."
              style={{
                display:"inline-block", width:90, textAlign:"center",
                border:"none", borderBottom:`3px solid ${unitCardRevealed?(unitCardInput.trim()===card.blank?"#1E88E5":"#FF6B35"):"#1E88E5"}`,
                fontSize:20, fontWeight:900, color:"#1565C0", background:"transparent",
                outline:"none", padding:"0 4px"
              }}
            />
            {card.front.split("___")[1]}
          </div>

          {unitCardRevealed && (
            <div style={{textAlign:"center", marginBottom:12}}>
              <div style={{fontSize:15, color: unitCardInput.trim()===card.blank?"#1565C0":"#FF6B35", fontWeight:700, marginBottom:8}}>
                {unitCardInput.trim()===card.blank ? "✅ 정답!" : `❌ 정답: ${card.blank}`}
              </div>
              <div style={{fontSize:14, color:"#555", marginBottom:12}}>→ {card.full}</div>
              <button onClick={()=>speakKo(card.full)}
                style={{background:"#1E88E5", border:"none", borderRadius:50, padding:"8px 20px", color:"white", fontSize:13, fontWeight:700, cursor:"pointer"}}>
                🔊 {vi?"Nghe lại":en?"Listen":"전체 문장 듣기"}
              </button>
            </div>
          )}
          <div style={{background:"#EEF6FF", borderRadius:12, padding:"10px 14px", fontSize:13, color:"#555", textAlign:"center"}}>
            💡 {card.hint}
          </div>
        </div>

        {/* 위치어 요약 박스 */}
        {!unitCardRevealed && (
          <div style={{width:"100%", maxWidth:400, background:"white", borderRadius:16, padding:16, marginBottom:16, fontSize:12, color:"#444"}}>
            <div style={{fontWeight:900, color:"#1565C0", marginBottom:8}}>📌 {vi?"Vị trí":en?"Location words":"위치어"}</div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px 12px"}}>
              <div>· 위 <span style={{color:"#888"}}>{vi?"trên":en?"above":"(above)"}</span></div>
              <div>· 아래 <span style={{color:"#888"}}>{vi?"dưới":en?"below":"(below)"}</span></div>
              <div>· 앞 <span style={{color:"#888"}}>{vi?"trước":en?"in front":"(front)"}</span></div>
              <div>· 뒤 <span style={{color:"#888"}}>{vi?"sau":en?"behind":"(behind)"}</span></div>
              <div>· 옆 <span style={{color:"#888"}}>{vi?"bên cạnh":en?"beside":"(beside)"}</span></div>
              <div>· 안 <span style={{color:"#888"}}>{vi?"trong":en?"inside":"(inside)"}</span></div>
            </div>
          </div>
        )}

        {!unitCardRevealed ? (
          <button onClick={handleUnit2bSubmit} disabled={!unitCardInput.trim()}
            style={{width:"100%", maxWidth:400, background: unitCardInput.trim()?"linear-gradient(135deg,#1E88E5,#1565C0)":"#ccc", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor: unitCardInput.trim()?"pointer":"default", boxShadow: unitCardInput.trim()?"0 4px 16px #1E88E544":"none"}}>
            {vi?"Kiểm tra":en?"Check":"확인하기 ✓"}
          </button>
        ) : unitCardIdx < total - 1 ? (
          <button onClick={()=>{ setUnitCardIdx(i=>i+1); setUnitCardInput(""); setUnitCardRevealed(false); }}
            style={{width:"100%", maxWidth:400, background:"linear-gradient(135deg,#1E88E5,#1565C0)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", boxShadow:"0 4px 16px #1E88E544"}}>
            {vi?"Tiếp theo →":en?"Next →":"다음 →"} ({unitCardIdx+2}/{total})
          </button>
        ) : (
          <button onClick={()=>{
            setTestAnswers({});
            setTestResult(null);
            setTestQuestions([]);
            setStep("test2");
          }}
            style={{width:"100%", maxWidth:400, background:"linear-gradient(135deg,#FF6B35,#E64A00)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", boxShadow:"0 4px 16px #FF6B3544"}}>
            📝 {vi?"Làm bài kiểm tra!":en?"Take the test!":"누적 테스트 시작! (1~2단원) 📝"}
          </button>
        )}
        <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit2"); }}
          style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>
          ← {vi?"Quay lại":en?"Back":"뒤로 (2A단원)"}
        </button>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // ✅ V168: 누적 테스트 — 2단원 (1단원+2단원 전체 범위)
  // ════════════════════════════════════════════════════════
  if (step === "test2") {
    const vi = lang?.code === "vi";
    const en = lang?.code === "en";

    const TEST2_QUESTIONS = [
      // ── 1단원 복습 10문제 (이에요/예요/이다)
      { id:"t2_1",  q:"저는 학생___.",         answer:"입니다",  answers:["입니다","입니다."],  hint:"💡 학생 → 받침 있음 → 입니다" },
      { id:"t2_2",  q:"여기는 학교___.",        answer:"입니다",  answers:["입니다","입니다."],  hint:"💡 학교 → 입니다" },
      { id:"t2_3",  q:"오늘은 월요일___.",       answer:"입니다",  answers:["입니다","입니다."],  hint:"💡 월요일 → 받침 있음 → 입니다" },
      { id:"t2_4",  q:"저는 의사___.",          answer:"입니다",  answers:["입니다","입니다."],  hint:"💡 의사 → 입니다" },
      { id:"t2_5",  q:"이분은 선생님___.",       answer:"이세요",  answers:["이세요","이세요."],  hint:"💡 높임말 (어른께 쓰는 말)" },
      { id:"t2_6",  q:"저는 베트남 사람___.",    answer:"입니다",  answers:["입니다","입니다."],  hint:"💡 사람 → 받침 있음" },
      { id:"t2_7",  q:"여기는 회사___.",         answer:"입니다",  answers:["입니다","입니다."],      hint:"💡 회사 → 받침 없음" },
      { id:"t2_8",  q:"저 분은 친구___.",        answer:"입니다",  answers:["입니다","입니다."],      hint:"💡 친구 → 받침 없음" },
      { id:"t2_9",  q:"오늘은 화요일___.",       answer:"입니다",  answers:["입니다","입니다."],  hint:"💡 화요일 → 받침 있음" },
      { id:"t2_10", q:"저는 한국어 선생님___.",  answer:"입니다",  answers:["입니다","입니다."],  hint:"💡 선생님 → 받침 있음" },
      // ── 2단원 10문제 (있다·없다·많다·적다)
      { id:"t2_11", q:"시간이 ___.",            answer:"있습니다",  answers:["있습니다","있습니다."],  hint:"💡 있다" },
      { id:"t2_12", q:"돈이 ___.",              answer:"없습니다",  answers:["없습니다","없습니다."],  hint:"💡 없다" },
      { id:"t2_13", q:"친구가 ___.",            answer:"많습니다",  answers:["많습니다","많습니다."],  hint:"💡 많다" },
      { id:"t2_14", q:"학생이 ___.",            answer:"적습니다",  answers:["적습니다","적습니다."],  hint:"💡 적다" },
      { id:"t2_15", q:"숙제가 ___.",            answer:"많습니다",  answers:["많습니다","많습니다."],  hint:"💡 많다" },
      { id:"t2_16", q:"오늘 시간이 ___.",       answer:"없습니다",  answers:["없습니다","없습니다."],  hint:"💡 없다" },
      { id:"t2_17", q:"교실에 의자가 ___.",     answer:"있습니다",  answers:["있습니다","있습니다."],  hint:"💡 있다" },
      { id:"t2_18", q:"오늘 사람이 ___.",       answer:"적습니다",  answers:["적습니다","적습니다."],  hint:"💡 적다" },
      { id:"t2_19", q:"냉장고에 음식이 ___.",   answer:"없습니다",  answers:["없습니다","없습니다."],  hint:"💡 없다" },
      { id:"t2_20", q:"우리 반 학생이 ___.",    answer:"많습니다",  answers:["많습니다","많습니다."],  hint:"💡 많다" },
      // ── 2B단원 10문제 (위치 표현)
      { id:"t2_21", q:"책상 위에 책이 ___.",         answer:"있습니다",  answers:["있습니다","있습니다."],  hint:"💡 위치 표현 → 있습니다" },
      { id:"t2_22", q:"화장실이 어디에 ___?",         answer:"있습니까",  answers:["있습니까","있습니까?"],  hint:"💡 장소를 물을 때 → 있습니까?" },
      { id:"t2_23", q:"가방 안에 지갑이 ___.",        answer:"있습니다",  answers:["있습니다","있습니다."],  hint:"💡 안(inside) → 있습니다" },
      { id:"t2_24", q:"은행 옆에 편의점이 ___.",      answer:"있습니다",  answers:["있습니다","있습니다."],  hint:"💡 옆(beside) → 있습니다" },
      { id:"t2_25", q:"냉장고 앞에 고양이가 ___.",    answer:"있습니다",  answers:["있습니다","있습니다."],  hint:"💡 앞(in front) → 있습니다" },
      { id:"t2_26", q:"의자 아래에 가방이 ___.",      answer:"있습니다",  answers:["있습니다","있습니다."],  hint:"💡 아래(below) → 있습니다" },
      { id:"t2_27", q:"학교 앞에 카페가 ___.",        answer:"있습니다",  answers:["있습니다","있습니다."],  hint:"💡 앞(정면) → 있습니다" },
      { id:"t2_28", q:"마트가 어디에 ___?",           answer:"있어요",  answers:["있어요","있어요?","있어요."],  hint:"💡 장소를 물을 때 → 있습니까?" },
      { id:"t2_29", q:"방 안에 침대가 ___.",          answer:"있습니다",  answers:["있습니다","있습니다."],  hint:"💡 안(속) → 뭐가 있어요?" },
      { id:"t2_30", q:"소파 위에 고양이가 ___.",      answer:"있습니다",  answers:["있습니다","있습니다."],  hint:"💡 위(above) → 뭐가 있어요?" },
    ];

    function gradeTest2() {
      if (TEST2_QUESTIONS.length === 0) return;
      let correct = 0;
      const feedback = TEST2_QUESTIONS.map(q => {
        const userAns = (testAnswers[q.id] || "").trim();
        const validAnswers = q.answers || [q.answer];
        const ok = validAnswers.some(a =>
          userAns === a || userAns.replace(/\s/g,"") === a.replace(/\s/g,"")
        );
        if (ok) correct++;
        return {...q, userAns, ok};
      });
      const score = Math.round((correct / TEST2_QUESTIONS.length) * 100);
      const passed = score >= 80;

      if (passed) {
        const newPassed = [...new Set([...unitsPassed, 1, 2])];
        setUnitsPassed(newPassed);
        try {
          localStorage.setItem("hc_unitsPassed", JSON.stringify(newPassed));
        } catch(e) {}
      }
      setTestResult({ score, passed, feedback });
    }

    if (testResult) {
      return (
        <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#FFF8F0,#FFE8D0)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
          <DevJumpPanel />
          <div style={{width:"100%", maxWidth:400}}>
            <div style={{textAlign:"center", marginBottom:20}}>
              <div style={{fontSize:40}}>{testResult.passed?"🎉":"💪"}</div>
              <div style={{fontSize:22, fontWeight:900, color: testResult.passed?"#1565C0":"#E64A00", marginBottom:4}}>
                {testResult.score}점 {testResult.passed?"— 통과!":"— 다시 도전!"}
              </div>
              <div style={{fontSize:13, color:"#888"}}>
                {vi?"Phạm vi: Bài 1 + Bài 2A + Bài 2B":en?"Scope: Unit 1 + Unit 2A + Unit 2B":"범위: 서술어 1단원 + 2A단원 + 2B단원"}
              </div>
            </div>
            <div style={{background:"white", borderRadius:16, padding:16, marginBottom:16}}>
              {testResult.feedback.map((q,i)=>(
                <div key={i} style={{padding:"8px 0", borderBottom: i<testResult.feedback.length-1?"1px solid #f0f0f0":"none"}}>
                  <div style={{fontSize:13, color:"#333", fontWeight:600}}>{i+1}. {q.q}</div>
                  <div style={{fontSize:12, marginTop:4}}>
                    {q.ok
                      ? <span style={{color:"#1565C0", fontWeight:700}}>✅ {q.answer}</span>
                      : <><span style={{color:"#E64A00"}}>❌ 내 답: {q.userAns||"(없음)"}</span> → <span style={{color:"#1565C0", fontWeight:700}}>정답: {q.answer}</span></>
                    }
                  </div>
                </div>
              ))}
            </div>
            {testResult.passed ? (
              <button onClick={()=>{setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit3");}}
                style={{width:"100%", background:"linear-gradient(135deg,#1E88E5,#1565C0)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", boxShadow:"0 4px 16px #1E88E544"}}>
                {vi?"Tiếp tục — Bài 3! 🚀":en?"Continue — Unit 3! 🚀":"3단원으로 계속하기 🚀"}
              </button>
            ) : (
              <button onClick={()=>{setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setTestResult(null); setTestAnswers({}); setStep("unit2");}}
                style={{width:"100%", background:"linear-gradient(135deg,#FF8C42,#E64A00)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", boxShadow:"0 4px 16px #FF8C4244"}}>
                {vi?"Học lại từ đầu Bài 2 🔄":en?"Study Unit 2 again 🔄":"2단원 처음부터 다시 학습 🔄"}
              </button>
            )}
            <button onClick={()=>{setTestResult(null); setTestAnswers({});}}
              style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>
              ← {vi?"Thử lại":en?"Try again":"다시 풀기"}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#FFF8F0,#FFE8D0)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:400}}>
          <div style={{fontSize:14, fontWeight:900, color:"#E64A00", marginBottom:4}}>
            📝 {vi?"Bài kiểm tra — Tổng hợp (Bài 1+2)":en?"Test — Cumulative (Unit 1+2)":"누적 테스트 — 1·2A·2B단원"}
          </div>
          <div style={{fontSize:12, color:"#aaa", marginBottom:16}}>
            {vi?"Phạm vi: Bài 1 (이에요/이다) + Bài 2 (있다·없다·많다·적다)":
             en?"Scope: Unit 1 (이에요/이다) + Unit 2 (있다·없다·많다·적다)":
             "범위: 서술어 1단원(이에요/이다) + 2A단원(있다·없다·많다·적다) + 2B단원(위치 표현)"}
          </div>
          {TEST2_QUESTIONS.map((q,i)=>(
            <div key={q.id} style={{background:"white", borderRadius:12, padding:"12px 14px", marginBottom:8}}>
              <div style={{fontSize:13, fontWeight:700, color:"#333", marginBottom:6}}>{i+1}. {q.q}</div>
              <input
                type="text"
                value={testAnswers[q.id]||""}
                onChange={e=>setTestAnswers(a=>({...a,[q.id]:e.target.value}))}
                onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Tab") e.stopPropagation(); }}
                placeholder={vi?"Điền vào...":en?"Fill in...":"여기에 쓰세요..."}
                style={{width:"100%", border:"2px solid #BBDEFB", borderRadius:8, padding:"7px 10px", fontSize:14, outline:"none", boxSizing:"border-box"}}
              />
              <div style={{fontSize:12, color:"#C62828", fontWeight:800, marginTop:6}}>{q.hint}</div>
            </div>
          ))}
          <button type="button" onClick={gradeTest2}
            style={{width:"100%", background:"linear-gradient(135deg,#FF6B35,#E64A00)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", marginTop:12, boxShadow:"0 4px 16px #FF6B3544"}}>
            {vi?"Nộp bài!":en?"Submit!":"채점하기! 📊"}
          </button>
          <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit2"); }}
            style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>
            ← {vi?"Quay lại":en?"Back":"뒤로 (2단원 학습)"}
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // ✅ V172: 서술어 3단원 — 형용사 서술어 (크다·작다·좋다·나쁘다 등)
  // ════════════════════════════════════════════════════════
  if (step === "unit3") {
    const vi = lang?.code === "vi";
    const en = lang?.code === "en";

    function handleUnit3Submit() {
      if (!unitCardInput.trim()) return;
      setUnitCardRevealed(true);
      speakKo(unitCardInput.trim());
    }

    const UNIT3_CARDS = [
      {
        front: "이 가방이 ___.",
        blank: "큽니다",
        full: "이 가방이 큽니다.",
        hint: vi?"'크다' → dùng khi vật to lớn":en?"'크다' → used when something is big":"크다 → 크+어요 → ?요 (ㅡ 탈락)",
      },
      {
        front: "저 가방이 ___.",
        blank: "작습니다",
        full: "저 가방이 작습니다.",
        hint: vi?"'작다' → nhỏ (ngược với 크다)":en?"'작다' → small (opposite of 크다)":"작다 → 작+아요 → ?요",
      },
      {
        front: "날씨가 ___.",
        blank: "좋습니다",
        full: "날씨가 좋습니다.",
        hint: vi?"'좋다' → tốt, đẹp":en?"'좋다' → good, nice":"좋다 → 좋+아요 → ?요",
      },
      {
        front: "음식이 ___.",
        blank: "맛있습니다",
        full: "음식이 맛있습니다.",
        hint: vi?"'맛있다' = ngon (맛+있다)":en?"'맛있다' = delicious (맛+있다)":"맛있다 → 맛있+어요 → ?요",
      },
      {
        front: "이 식당이 ___.",
        blank: "쌉니다",
        full: "이 식당이 쌉니다.",
        hint: vi?"'싸다' → rẻ (ㅏ → 아요)":en?"'싸다' → cheap (ㅏ → 아요)":"싸다 → 싸+아요 → ?요 (ㅏ로 끝남)",
      },
      {
        front: "한국어가 ___.",
        blank: "재미있습니다",
        full: "한국어가 재미있습니다.",
        hint: vi?"'재미있다' = thú vị (재미+있다)":en?"'재미있다' = interesting (재미+있다)":"재미있다 → 재미있+어요 → ?요",
      },
    ];

    const card = UNIT3_CARDS[unitCardIdx];
    const total = UNIT3_CARDS.length;

    return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#F3E5F5,#E1BEE7)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:400, marginBottom:16}}>
          <div style={{fontSize:12, color:"#7B1FA2", fontWeight:700, marginBottom:6}}>
            📘 {vi?"Bài 3 — Vị ngữ tính từ":en?"Unit 3 — Adjective Predicates":"서술어 3단원 — 형용사 서술어"}
          </div>
          <div style={{display:"flex", gap:4}}>
            {UNIT3_CARDS.map((_,i)=>(
              <div key={i} style={{flex:1, height:5, borderRadius:3, background: i<unitCardIdx?"#9C27B0": i===unitCardIdx?"#7B1FA2":"#E1BEE7", transition:"all .3s"}}/>
            ))}
          </div>
          <div style={{fontSize:11, color:"#aaa", marginTop:4, textAlign:"right"}}>{unitCardIdx+1} / {total}</div>
        </div>

        <div style={{width:"100%", maxWidth:400, background:"white", borderRadius:20, padding:28, boxShadow:"0 8px 32px #9C27B022", marginBottom:16}}>
          <div style={{fontSize:13, color:"#aaa", marginBottom:16, textAlign:"center"}}>
            {vi?"Điền vào chỗ trống":en?"Fill in the blank":"빈칸을 채워보세요 ✍️"}
          </div>
          <div style={{fontSize:20, fontWeight:900, color:"#2A1A3A", textAlign:"center", marginBottom:16, lineHeight:1.8}}>
            {card.front.split("___")[0]}
            <input type="text" value={unitCardInput}
              onChange={e=>setUnitCardInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter" && !unitCardRevealed && unitCardInput.trim()) { e.preventDefault(); handleUnit3Submit(); } }}
              disabled={unitCardRevealed} placeholder="..."
              style={{display:"inline-block", width:100, textAlign:"center", border:"none",
                borderBottom:`3px solid ${unitCardRevealed?(unitCardInput.trim()===card.blank?"#9C27B0":"#FF6B35"):"#9C27B0"}`,
                fontSize:20, fontWeight:900, color:"#7B1FA2", background:"transparent", outline:"none", padding:"0 4px"}}
            />
            {card.front.split("___")[1]}
          </div>
          {unitCardRevealed && (
            <div style={{textAlign:"center", marginBottom:12}}>
              <div style={{fontSize:15, color: unitCardInput.trim()===card.blank?"#7B1FA2":"#FF6B35", fontWeight:700, marginBottom:8}}>
                {unitCardInput.trim()===card.blank ? "✅ 정답!" : `❌ 정답: ${card.blank}`}
              </div>
              <div style={{fontSize:14, color:"#555", marginBottom:12}}>→ {card.full}</div>
              <button onClick={()=>speakKo(card.full)}
                style={{background:"#9C27B0", border:"none", borderRadius:50, padding:"8px 20px", color:"white", fontSize:13, fontWeight:700, cursor:"pointer"}}>
                🔊 {vi?"Nghe lại":en?"Listen":"전체 문장 듣기"}
              </button>
            </div>
          )}
          <div style={{background:"#F9F0FF", borderRadius:12, padding:"10px 14px", fontSize:13, color:"#555", textAlign:"center"}}>
            💡 {card.hint}
          </div>
        </div>

        {!unitCardRevealed && (
          <div style={{width:"100%", maxWidth:400, background:"white", borderRadius:16, padding:16, marginBottom:16, fontSize:12, color:"#444"}}>
            <div style={{fontWeight:900, color:"#7B1FA2", marginBottom:8}}>📌 {vi?"Quy tắc":en?"Rule":"핵심 규칙"}</div>
            <div>· ㅏ/ㅗ 끝 → <b>아__</b> &nbsp;(작다 + ?)</div>
            <div>· 그 외 → <b>어__</b> &nbsp;(좋다 + ?)</div>
            <div>· ㅡ 끝 → <b>ㅡ 빠지고 어__</b> &nbsp;(크다 + ?)</div>
          </div>
        )}

        {!unitCardRevealed ? (
          <button onClick={handleUnit3Submit} disabled={!unitCardInput.trim()}
            style={{width:"100%", maxWidth:400, background: unitCardInput.trim()?"linear-gradient(135deg,#9C27B0,#7B1FA2)":"#ccc", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor: unitCardInput.trim()?"pointer":"default", boxShadow: unitCardInput.trim()?"0 4px 16px #9C27B044":"none"}}>
            {vi?"Kiểm tra":en?"Check":"확인하기 ✓"}
          </button>
        ) : unitCardIdx < total - 1 ? (
          <button onClick={()=>{ setUnitCardIdx(i=>i+1); setUnitCardInput(""); setUnitCardRevealed(false); }}
            style={{width:"100%", maxWidth:400, background:"linear-gradient(135deg,#9C27B0,#7B1FA2)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", boxShadow:"0 4px 16px #9C27B044"}}>
            {vi?"Tiếp theo →":en?"Next →":"다음 →"} ({unitCardIdx+2}/{total})
          </button>
        ) : (
          <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit3b"); }}
            style={{width:"100%", maxWidth:400, background:"linear-gradient(135deg,#AB47BC,#7B1FA2)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", boxShadow:"0 4px 16px #AB47BC44"}}>
            {vi?"Tiếp theo — Bài 3B →":en?"Next — Unit 3B →":"다음 → 3B단원 (ㅂ불규칙) 🚀"}
          </button>
        )}
        <button onClick={()=>{ setTestResult(null); setTestAnswers({}); setUnitCardIdx(0); setStep("test2"); }}
          style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer"}}>
          ← {vi?"Quay lại":en?"Back":"뒤로 (2단원 테스트)"}
        </button>
      </div>
    );
  }


  // ════════════════════════════════════════════════════════
  // ✅ V181: 서술어 3B단원 — ㅂ불규칙 형용사 (춥다·덥다·어렵다 등)
  // ════════════════════════════════════════════════════════
  if (step === "unit3b") {
    const vi = lang?.code === "vi";
    const en = lang?.code === "en";

    function handleUnit3bSubmit() {
      if (!unitCardInput.trim()) return;
      setUnitCardRevealed(true);
      speakKo(unitCardInput.trim());
    }

    const UNIT3B_CARDS = [
      {
        front: "오늘 날씨가 ___.",
        blank: "춥습니다",
        full: "오늘 날씨가 춥습니다.",
        hint: vi?"'춥다' → lạnh (ㅂ → 워요)":en?"'춥다' → cold (ㅂ→우+어요)":"춥다 → 추+워요 (ㅂ→우)",
      },
      {
        front: "여름에 날씨가 ___.",
        blank: "덥습니다",
        full: "여름에 날씨가 덥습니다.",
        hint: vi?"'덥다' → nóng (ㅂ → 워요)":en?"'덥다' → hot (ㅂ→우+어요)":"덥다 → 더+워요 (ㅂ→우)",
      },
      {
        front: "한국어가 ___.",
        blank: "어렵습니다",
        full: "한국어가 어렵습니다.",
        hint: vi?"'어렵다' → khó (ㅂ → 워요)":en?"'어렵다' → difficult (ㅂ→우+어요)":"어렵다 → 어려+워요 (ㅂ→우)",
      },
      {
        front: "이 가방이 ___.",
        blank: "가볍습니다",
        full: "이 가방이 가볍습니다.",
        hint: vi?"'가볍다' → nhẹ (ㅂ → 워요)":en?"'가볍다' → light (ㅂ→우+어요)":"가볍다 → 가벼+워요 (ㅂ→우)",
      },
      {
        front: "이 짐이 ___.",
        blank: "무겁습니다",
        full: "이 짐이 무겁습니다.",
        hint: vi?"'무겁다' → nặng (ㅂ → 워요)":en?"'무겁다' → heavy (ㅂ→우+어요)":"무겁다 → 무거+워요 (ㅂ→우)",
      },
      {
        front: "이 음식이 ___.",
        blank: "맵습니다",
        full: "이 음식이 맵습니다.",
        hint: vi?"'맵다' → cay (ㅂ → 워요)":en?"'맵다' → spicy (ㅂ→우+어요)":"맵다 → 매+워요 (ㅂ→우)",
      },
    ];

    const card = UNIT3B_CARDS[unitCardIdx];
    const total = UNIT3B_CARDS.length;

    return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#F3E5F5,#E1BEE7)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:400, marginBottom:16}}>
          <div style={{fontSize:12, color:"#7B1FA2", fontWeight:700, marginBottom:6}}>
            📘 {vi?"Bài 3B — Bất quy tắc ㅂ (춥다·덥다·어렵다)":en?"Unit 3B — ㅂ Irregular (춥다·덥다·어렵다)":"서술어 3B단원 — ㅂ불규칙 형용사"}
          </div>
          <div style={{display:"flex", gap:4}}>
            {UNIT3B_CARDS.map((_,i)=>(
              <div key={i} style={{flex:1, height:5, borderRadius:3, background: i<unitCardIdx?"#9C27B0": i===unitCardIdx?"#7B1FA2":"#E1BEE7", transition:"all .3s"}}/>
            ))}
          </div>
          <div style={{fontSize:11, color:"#aaa", marginTop:4, textAlign:"right"}}>{unitCardIdx+1} / {total}</div>
        </div>

        <div style={{width:"100%", maxWidth:400, background:"white", borderRadius:20, padding:28, boxShadow:"0 8px 32px #9C27B022", marginBottom:16}}>
          <div style={{fontSize:13, color:"#aaa", marginBottom:16, textAlign:"center"}}>
            {vi?"Điền vào chỗ trống":en?"Fill in the blank":"빈칸을 채워보세요 ✍️"}
          </div>
          <div style={{fontSize:20, fontWeight:900, color:"#2A1A3A", textAlign:"center", marginBottom:16, lineHeight:1.8}}>
            {card.front.split("___")[0]}
            <input type="text" value={unitCardInput}
              onChange={e=>setUnitCardInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter" && !unitCardRevealed && unitCardInput.trim()) { e.preventDefault(); handleUnit3bSubmit(); } }}
              disabled={unitCardRevealed} placeholder="..."
              style={{display:"inline-block", width:110, textAlign:"center", border:"none",
                borderBottom:`3px solid ${unitCardRevealed?(unitCardInput.trim()===card.blank?"#9C27B0":"#FF6B35"):"#9C27B0"}`,
                fontSize:20, fontWeight:900, color:"#7B1FA2", background:"transparent", outline:"none", padding:"0 4px"}}
            />
            {card.front.split("___")[1]}
          </div>
          {unitCardRevealed && (
            <div style={{textAlign:"center", marginBottom:12}}>
              <div style={{fontSize:15, color: unitCardInput.trim()===card.blank?"#7B1FA2":"#FF6B35", fontWeight:700, marginBottom:8}}>
                {unitCardInput.trim()===card.blank ? "✅ 정답!" : `❌ 정답: ${card.blank}`}
              </div>
              <div style={{fontSize:14, color:"#555", marginBottom:12}}>→ {card.full}</div>
              <button onClick={()=>speakKo(card.full)}
                style={{background:"#9C27B0", border:"none", borderRadius:50, padding:"8px 20px", color:"white", fontSize:13, fontWeight:700, cursor:"pointer"}}>
                🔊 {vi?"Nghe lại":en?"Listen":"전체 문장 듣기"}
              </button>
            </div>
          )}
          <div style={{background:"#F9F0FF", borderRadius:12, padding:"10px 14px", fontSize:13, color:"#555", textAlign:"center"}}>
            💡 {card.hint}
          </div>
        </div>

        {/* ㅂ불규칙 패턴 박스 — 정답 공개 후에만 표시 */}
        {unitCardRevealed && (
          <div style={{width:"100%", maxWidth:400, background:"white", borderRadius:16, padding:16, marginBottom:16, fontSize:12, color:"#444"}}>
            <div style={{fontWeight:900, color:"#7B1FA2", marginBottom:8}}>📌 {vi?"Quy tắc bất quy tắc ㅂ":en?"ㅂ Irregular Rule":"ㅂ불규칙 패턴"}</div>
            <div style={{background:"#F9F0FF", borderRadius:8, padding:"8px 12px", marginBottom:8, fontSize:13, textAlign:"center", color:"#7B1FA2", fontWeight:700}}>
              ㅂ → 우 + 어요 = <b>워요</b>
            </div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"3px 8px", fontSize:11}}>
              <div>춥다 → <b>추워요</b></div>
              <div>덥다 → <b>더워요</b></div>
              <div>어렵다 → <b>어려워요</b></div>
              <div>가볍다 → <b>가벼워요</b></div>
              <div>무겁다 → <b>무거워요</b></div>
              <div>맵다 → <b>매워요</b></div>
            </div>
          </div>
        )}

        {!unitCardRevealed ? (
          <button onClick={handleUnit3bSubmit} disabled={!unitCardInput.trim()}
            style={{width:"100%", maxWidth:400, background: unitCardInput.trim()?"linear-gradient(135deg,#9C27B0,#7B1FA2)":"#ccc", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor: unitCardInput.trim()?"pointer":"default", boxShadow: unitCardInput.trim()?"0 4px 16px #9C27B044":"none"}}>
            {vi?"Kiểm tra":en?"Check":"확인하기 ✓"}
          </button>
        ) : unitCardIdx < total - 1 ? (
          <button onClick={()=>{ setUnitCardIdx(i=>i+1); setUnitCardInput(""); setUnitCardRevealed(false); }}
            style={{width:"100%", maxWidth:400, background:"linear-gradient(135deg,#9C27B0,#7B1FA2)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", boxShadow:"0 4px 16px #9C27B044"}}>
            {vi?"Tiếp theo →":en?"Next →":"다음 →"} ({unitCardIdx+2}/{total})
          </button>
        ) : (
          <button onClick={()=>{ setTestAnswers({}); setTestResult(null); setTestQuestions([]); setStep("test3"); }}
            style={{width:"100%", maxWidth:400, background:"linear-gradient(135deg,#FF6B35,#E64A00)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", boxShadow:"0 4px 16px #FF6B3544"}}>
            📝 {vi?"Làm bài kiểm tra!":en?"Take the test!":"누적 테스트 시작! (1~3단원) 📝"}
          </button>
        )}
        <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit3"); }}
          style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>
          ← {vi?"Quay lại":en?"Back":"뒤로 (3A단원)"}
        </button>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // ✅ V172: 누적 테스트 3 — 1·2·3단원 전체
  // ════════════════════════════════════════════════════════
  if (step === "test3") {
    const vi = lang?.code === "vi";
    const en = lang?.code === "en";

    const TEST3_QUESTIONS = [
      // ── 1단원 복습 10문제
      { id:"t3_1",  q:"저는 학생___.",         answer:"이에요",     answers:["이에요","이에요."],     hint:"💡 학생 → 받침 있음" },
      { id:"t3_2",  q:"여기는 학교___.",        answer:"예요",       answers:["예요","예요."],         hint:"💡 학교 → 받침 없음" },
      { id:"t3_3",  q:"오늘은 목요일___.",       answer:"이에요",     answers:["이에요","이에요."],     hint:"💡 목요일 → 받침 있음" },
      { id:"t3_4",  q:"저는 간호사___.",         answer:"예요",       answers:["예요","예요."],         hint:"💡 간호사 → 받침 없음" },
      { id:"t3_5",  q:"이분은 교수님___.",        answer:"이세요",     answers:["이세요","이세요."],     hint:"💡 높임말 (어른께 쓰는 말)" },
      { id:"t3_6",  q:"저는 중국 사람___.",      answer:"이에요",     answers:["이에요","이에요."],     hint:"💡 사람 → 받침 있음" },
      { id:"t3_7",  q:"여기는 병원___.",          answer:"이에요",     answers:["이에요","이에요."],     hint:"💡 병원 → 받침 있음" },
      { id:"t3_8",  q:"저 분은 동료___.",         answer:"예요",       answers:["예요","예요."],         hint:"💡 동료 → 받침 없음" },
      { id:"t3_9",  q:"오늘은 수요일___.",        answer:"이에요",     answers:["이에요","이에요."],     hint:"💡 수요일 → 받침 있음" },
      { id:"t3_10", q:"저는 요리사___.",          answer:"예요",       answers:["예요","예요."],         hint:"💡 요리사 → 받침 없음" },
      // ── 2단원 복습 10문제
      { id:"t3_11", q:"시간이 ___.",             answer:"있어요",     answers:["있어요","있어요."],     hint:"💡 있다" },
      { id:"t3_12", q:"돈이 ___.",               answer:"없어요",     answers:["없어요","없어요."],     hint:"💡 없다" },
      { id:"t3_13", q:"친구가 ___.",             answer:"많아요",     answers:["많아요","많아요."],     hint:"💡 많다" },
      { id:"t3_14", q:"학생이 ___.",             answer:"적어요",     answers:["적어요","적어요."],     hint:"💡 적다" },
      { id:"t3_15", q:"오늘 숙제가 ___.",        answer:"없어요",     answers:["없어요","없어요."],     hint:"💡 없다" },
      { id:"t3_16", q:"냉장고에 음식이 ___.",    answer:"있어요",     answers:["있어요","있어요."],     hint:"💡 있다" },
      { id:"t3_17", q:"오늘 손님이 ___.",        answer:"많아요",     answers:["많아요","많아요."],     hint:"💡 많다" },
      { id:"t3_18", q:"오늘 수업이 ___.",        answer:"없어요",     answers:["없어요","없어요."],     hint:"💡 없다" },
      { id:"t3_19", q:"우리 반에 남자가 ___.",   answer:"적어요",     answers:["적어요","적어요."],     hint:"💡 적다" },
      { id:"t3_20", q:"오늘 할 일이 ___.",       answer:"많아요",     answers:["많아요","많아요."],     hint:"💡 많다" },
      // ── 3단원 10문제 (형용사)
      { id:"t3_21", q:"이 가방이 ___.",          answer:"커요",       answers:["커요","커요."],         hint:"💡 크다" },
      { id:"t3_22", q:"저 가방이 ___.",          answer:"작아요",     answers:["작아요","작아요."],     hint:"💡 작다" },
      { id:"t3_23", q:"날씨가 ___.",             answer:"좋아요",     answers:["좋아요","좋아요."],     hint:"💡 좋다" },
      { id:"t3_24", q:"음식이 ___.",             answer:"맛있어요",   answers:["맛있어요","맛있어요."], hint:"💡 맛있다" },
      { id:"t3_25", q:"한국어가 ___.",           answer:"재미있어요", answers:["재미있어요","재미있어요."], hint:"💡 재미있다" },
      { id:"t3_26", q:"오늘 너무 ___.",          answer:"바빠요",     answers:["바빠요","바빠요."],     hint:"💡 바쁘다" },
      { id:"t3_27", q:"머리가 ___.",             answer:"아파요",     answers:["아파요","아파요."],     hint:"💡 아프다" },
      { id:"t3_28", q:"오늘 날씨가 ___.",        answer:"싫어요",     answers:["싫어요","싫어요."],     hint:"💡 싫다" },
      { id:"t3_29", q:"이 음식이 ___.",          answer:"맛없어요",   answers:["맛없어요","맛없어요."], hint:"💡 맛없다" },
      { id:"t3_30", q:"한국어가 ___.",           answer:"어려워요",   answers:["어려워요","어려워요."], hint:"💡 어렵다" },
      // ── 3B단원 10문제 (ㅂ불규칙)
      { id:"t3_31", q:"오늘 날씨가 ___.",          answer:"추워요",     answers:["추워요","추워요."],     hint:"💡 춥다 → ㅂ불규칙" },
      { id:"t3_32", q:"여름에 날씨가 ___.",         answer:"더워요",     answers:["더워요","더워요."],     hint:"💡 덥다 → ㅂ불규칙" },
      { id:"t3_33", q:"한국어가 ___.",              answer:"어려워요",   answers:["어려워요","어려워요."], hint:"💡 어렵다 → ㅂ불규칙" },
      { id:"t3_34", q:"이 가방이 ___.",             answer:"가벼워요",   answers:["가벼워요","가벼워요."], hint:"💡 가볍다 → ㅂ불규칙" },
      { id:"t3_35", q:"이 짐이 ___.",               answer:"무거워요",   answers:["무거워요","무거워요."], hint:"💡 무겁다 → ㅂ불규칙" },
      { id:"t3_36", q:"이 음식이 ___.",             answer:"매워요",     answers:["매워요","매워요."],     hint:"💡 맵다 → ㅂ불규칙" },
      { id:"t3_37", q:"겨울에 날씨가 ___.",         answer:"추워요",     answers:["추워요","추워요."],     hint:"💡 춥다 → 추+워요" },
      { id:"t3_38", q:"이 책이 ___.",               answer:"어려워요",   answers:["어려워요","어려워요."], hint:"💡 어렵다 → 어려+워요" },
      { id:"t3_39", q:"이 짐이 너무 ___.",          answer:"무거워요",   answers:["무거워요","무거워요."], hint:"💡 무겁다 → 무거+워요" },
      { id:"t3_40", q:"김치가 ___.",                answer:"매워요",     answers:["매워요","매워요."],     hint:"💡 맵다 → 매+워요" },
    ];

    function gradeTest3() {
      let correct = 0;
      const feedback = TEST3_QUESTIONS.map(q => {
        const userAns = (testAnswers[q.id] || "").trim();
        const ok = (q.answers || [q.answer]).some(a => userAns === a || userAns.replace(/\s/g,"") === a.replace(/\s/g,""));
        if (ok) correct++;
        return {...q, userAns, ok};
      });
      const score = Math.round((correct / TEST3_QUESTIONS.length) * 100);
      const passed = score >= 80;
      if (passed) {
        const newPassed = [...new Set([...unitsPassed, 1, 2, 3, "2b", "3b"])];
        setUnitsPassed(newPassed);
        try { localStorage.setItem("hc_unitsPassed", JSON.stringify(newPassed)); } catch(e) {}
      }
      setTestResult({ score, passed, feedback });
    }

    if (testResult) {
      return (
        <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#FFF8F0,#FFE8D0)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
          <DevJumpPanel />
          <div style={{width:"100%", maxWidth:400}}>
            <div style={{textAlign:"center", marginBottom:20}}>
              <div style={{fontSize:40}}>{testResult.passed?"🎉":"💪"}</div>
              <div style={{fontSize:22, fontWeight:900, color: testResult.passed?"#7B1FA2":"#E64A00", marginBottom:4}}>
                {testResult.score}점 {testResult.passed?"— 통과!":"— 다시 도전!"}
              </div>
              <div style={{fontSize:13, color:"#888"}}>범위: 서술어 1·2·3단원</div>
            </div>
            <div style={{background:"white", borderRadius:16, padding:16, marginBottom:16}}>
              {testResult.feedback.map((q,i)=>(
                <div key={i} style={{padding:"8px 0", borderBottom: i<testResult.feedback.length-1?"1px solid #f0f0f0":"none"}}>
                  <div style={{fontSize:13, color:"#333", fontWeight:600}}>{i+1}. {q.q}</div>
                  <div style={{fontSize:12, marginTop:4}}>
                    {q.ok
                      ? <span style={{color:"#7B1FA2", fontWeight:700}}>✅ {q.answer}</span>
                      : <><span style={{color:"#E64A00"}}>❌ 내 답: {q.userAns||"(없음)"}</span> → <span style={{color:"#7B1FA2", fontWeight:700}}>정답: {q.answer}</span></>
                    }
                  </div>
                </div>
              ))}
            </div>
            {testResult.passed ? (
              <button onClick={()=>{setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit4");}}
                style={{width:"100%", background:"linear-gradient(135deg,#9C27B0,#7B1FA2)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", boxShadow:"0 4px 16px #9C27B044"}}>
                {vi?"Tiếp tục — Bài 4! 🚀":en?"Continue — Unit 4! 🚀":"4단원으로 계속하기 🚀"}
              </button>
            ) : (
              <button onClick={()=>{setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setTestResult(null); setTestAnswers({}); setStep("unit3");}}
                style={{width:"100%", background:"linear-gradient(135deg,#FF8C42,#E64A00)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", boxShadow:"0 4px 16px #FF8C4244"}}>
                {vi?"Học lại Bài 3 🔄":en?"Study Unit 3 again 🔄":"3단원 처음부터 다시 학습 🔄"}
              </button>
            )}
            <button onClick={()=>{setTestResult(null); setTestAnswers({});}}
              style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>
              ← {vi?"Thử lại":en?"Try again":"다시 풀기"}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#FFF8F0,#FFE8D0)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:400}}>
          <div style={{fontSize:14, fontWeight:900, color:"#E64A00", marginBottom:4}}>
            📝 {vi?"Bài kiểm tra — Tổng hợp (Bài 1·2·3)":en?"Test — Cumulative (Unit 1·2·3)":"누적 테스트 — 1·2A·2B·3A·3B단원"}
          </div>
          <div style={{fontSize:12, color:"#aaa", marginBottom:16}}>
            범위: 이에요/이다 + 있다·없다·많다·적다 + 형용사 서술어
          </div>
          {TEST3_QUESTIONS.map((q,i)=>(
            <div key={q.id} style={{background:"white", borderRadius:12, padding:"12px 14px", marginBottom:8}}>
              <div style={{fontSize:13, fontWeight:700, color:"#333", marginBottom:6}}>{i+1}. {q.q}</div>
              <input type="text" value={testAnswers[q.id]||""}
                onChange={e=>setTestAnswers(a=>({...a,[q.id]:e.target.value}))}
                onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Tab") e.stopPropagation(); }}
                placeholder={vi?"Điền vào...":en?"Fill in...":"여기에 쓰세요..."}
                style={{width:"100%", border:"2px solid #E1BEE7", borderRadius:8, padding:"7px 10px", fontSize:14, outline:"none", boxSizing:"border-box"}}
              />
              <div style={{fontSize:12, color:"#C62828", fontWeight:800, marginTop:6}}>{q.hint}</div>
            </div>
          ))}
          <button type="button" onClick={gradeTest3}
            style={{width:"100%", background:"linear-gradient(135deg,#FF6B35,#E64A00)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", marginTop:12, boxShadow:"0 4px 16px #FF6B3544"}}>
            {vi?"Nộp bài!":en?"Submit!":"채점하기! 📊"}
          </button>
          <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit3"); }}
            style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>
            ← {vi?"Quay lại":en?"Back":"뒤로 (3단원 학습)"}
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // ✅ V175: 서술어 4단원 — 의문대명사 실전 (누구·언제·어디·무엇·왜)
  // ════════════════════════════════════════════════════════
  if (step === "unit4") {
    const vi = lang?.code === "vi";
    const en = lang?.code === "en";

    function handleUnit4Submit() {
      if (!unitCardInput.trim()) return;
      setUnitCardRevealed(true);
      speakKo(unitCardInput.trim());
    }

    const UNIT4_CARDS = [
      {
        front: "___입니까? (사람을 물어볼 때)",
        blank: "누구",
        full: "누구입니까?",
        hint: vi?"Hỏi về người → dùng từ gì?":en?"Asking about a person → which word?":"사람을 물어볼 때 쓰는 말",
      },
      {
        front: "___ 갑니까? (시간을 물어볼 때)",
        blank: "언제",
        full: "언제 갑니까?",
        hint: vi?"Hỏi về thời gian → dùng từ gì?":en?"Asking about time → which word?":"시간을 물어볼 때 쓰는 말",
      },
      {
        front: "___ 갑니까? (장소를 물어볼 때)",
        blank: "어디",
        full: "어디 갑니까?",
        hint: vi?"Hỏi về nơi chốn → dùng từ gì?":en?"Asking about a place → which word?":"장소를 물어볼 때 쓰는 말",
      },
      {
        front: "___ 먹습니까? (사물을 물어볼 때)",
        blank: "무엇을",
        full: "무엇을 먹습니까?",
        hint: vi?"Hỏi về sự vật → '무엇' hoặc?":en?"Asking about a thing → '무엇' or?":"'무엇'의 줄임말 → 대화에서 자주 써요",
      },
      {
        front: "___ 합니까? (이유를 물어볼 때)",
        blank: "왜",
        full: "왜 합니까?",
        hint: vi?"Hỏi về lý do → dùng từ gì?":en?"Asking about a reason → which word?":"이유를 물어볼 때 쓰는 말",
      },
      {
        front: "___ 친구입니까? (사람 + 이/가)",
        blank: "누가",
        full: "누가 친구입니까?",
        hint: vi?"'누구' + 이/가 → 누가 (rút gọn)":en?"'누구' + 이/가 → 누가 (shortened)":"누구 + 가 → 누가 (줄여서 써요)",
      },
    ];

    const card = UNIT4_CARDS[unitCardIdx];
    const total = UNIT4_CARDS.length;

    return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#E8F5E9,#C8E6C9)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:400, marginBottom:16}}>
          <div style={{fontSize:12, color:"#2E7D32", fontWeight:700, marginBottom:6}}>
            📘 {vi?"Bài 4 — Đại từ nghi vấn thực hành":en?"Unit 4 — Question Words in Practice":"서술어 4단원 — 의문대명사 실전"}
          </div>
          <div style={{display:"flex", gap:4}}>
            {UNIT4_CARDS.map((_,i)=>(
              <div key={i} style={{flex:1, height:5, borderRadius:3, background: i<unitCardIdx?"#43A047": i===unitCardIdx?"#2E7D32":"#C8E6C9", transition:"all .3s"}}/>
            ))}
          </div>
          <div style={{fontSize:11, color:"#aaa", marginTop:4, textAlign:"right"}}>{unitCardIdx+1} / {total}</div>
        </div>

        <div style={{width:"100%", maxWidth:400, background:"white", borderRadius:20, padding:28, boxShadow:"0 8px 32px #43A04722", marginBottom:16}}>
          <div style={{fontSize:13, color:"#aaa", marginBottom:16, textAlign:"center"}}>
            {vi?"Điền vào chỗ trống":en?"Fill in the blank":"빈칸을 채워보세요 ✍️"}
          </div>
          <div style={{fontSize:18, fontWeight:900, color:"#1A2A1A", textAlign:"center", marginBottom:16, lineHeight:1.8}}>
            {card.front.split("___")[0]}
            <input type="text" value={unitCardInput}
              onChange={e=>setUnitCardInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter" && !unitCardRevealed && unitCardInput.trim()) { e.preventDefault(); handleUnit4Submit(); } }}
              disabled={unitCardRevealed} placeholder="..."
              style={{display:"inline-block", width:80, textAlign:"center", border:"none",
                borderBottom:`3px solid ${unitCardRevealed?(unitCardInput.trim()===card.blank?"#43A047":"#FF6B35"):"#43A047"}`,
                fontSize:18, fontWeight:900, color:"#2E7D32", background:"transparent", outline:"none", padding:"0 4px"}}
            />
            {card.front.split("___")[1]}
          </div>
          {unitCardRevealed && (
            <div style={{textAlign:"center", marginBottom:12}}>
              <div style={{fontSize:15, color: unitCardInput.trim()===card.blank?"#2E7D32":"#FF6B35", fontWeight:700, marginBottom:8}}>
                {unitCardInput.trim()===card.blank ? "✅ 정답!" : `❌ 정답: ${card.blank}`}
              </div>
              <div style={{fontSize:14, color:"#555", marginBottom:12}}>→ {card.full}</div>
              <button onClick={()=>speakKo(card.full)}
                style={{background:"#43A047", border:"none", borderRadius:50, padding:"8px 20px", color:"white", fontSize:13, fontWeight:700, cursor:"pointer"}}>
                🔊 {vi?"Nghe lại":en?"Listen":"전체 문장 듣기"}
              </button>
            </div>
          )}
          <div style={{background:"#F1F8E9", borderRadius:12, padding:"10px 14px", fontSize:13, color:"#555", textAlign:"center"}}>
            💡 {card.hint}
          </div>
        </div>

        {!unitCardRevealed && unitCardIdx < 5 && (
          <div style={{width:"100%", maxWidth:400, background:"white", borderRadius:16, padding:16, marginBottom:16, fontSize:12, color:"#444"}}>
            <div style={{fontWeight:900, color:"#2E7D32", marginBottom:8}}>📌 {vi?"Quy tắc":en?"Rule":"핵심 규칙"}</div>
            <div>· 사람 → <b>누구?</b> &nbsp;(주어일 때 → <b>누가?</b>)</div>
            <div>· 시간 → <b>언제?</b></div>
            <div>· 장소 → <b>어디?</b></div>
            <div>· 사물 → <b>무엇? / 뭐?</b> &nbsp;(대화에선 '뭐')</div>
            <div>· 이유 → <b>왜?</b></div>
          </div>
        )}

        {!unitCardRevealed ? (
          <button onClick={handleUnit4Submit} disabled={!unitCardInput.trim()}
            style={{width:"100%", maxWidth:400, background: unitCardInput.trim()?"linear-gradient(135deg,#43A047,#2E7D32)":"#ccc", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor: unitCardInput.trim()?"pointer":"default"}}>
            {vi?"Kiểm tra":en?"Check":"확인하기 ✓"}
          </button>
        ) : unitCardIdx < total - 1 ? (
          <button onClick={()=>{ setUnitCardIdx(i=>i+1); setUnitCardInput(""); setUnitCardRevealed(false); }}
            style={{width:"100%", maxWidth:400, background:"linear-gradient(135deg,#43A047,#2E7D32)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>
            {vi?"Tiếp theo →":en?"Next →":"다음 →"} ({unitCardIdx+2}/{total})
          </button>
        ) : (
          <button onClick={()=>{ setTestAnswers({}); setTestResult(null); setTestQuestions([]); setStep("test4"); }}
            style={{width:"100%", maxWidth:400, background:"linear-gradient(135deg,#FF6B35,#E64A00)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>
            📝 {vi?"Làm bài kiểm tra!":en?"Take the test!":"누적 테스트 시작! (1~4단원) 📝"}
          </button>
        )}
        <button onClick={()=>{ setTestResult(null); setTestAnswers({}); setUnitCardIdx(0); setStep("test3"); }}
          style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer"}}>
          ← {vi?"Quay lại":en?"Back":"뒤로 (3단원 테스트)"}
        </button>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // ✅ V175: 누적 테스트 4 — 1·2·3·4단원
  // ════════════════════════════════════════════════════════
  if (step === "test4") {
    const vi = lang?.code === "vi";
    const en = lang?.code === "en";

    // 포함 단원: 2·3·4단원 (1단원 졸업 — 3회 졸업 규칙 적용)
    const TEST4_QUESTIONS = [
      // ── 2단원 복습 (8문항) ──
      { id:"t4_1",  q:"오늘 시간이 ___.",              answer:"없습니다",  answers:["없습니다","없습니다."],  hint:"💡 없다 → 없습니다" },
      { id:"t4_2",  q:"교실에 학생이 ___.",             answer:"많습니다",  answers:["많습니다","많습니다."],  hint:"💡 많다 → 많습니다" },
      { id:"t4_3",  q:"냉장고에 음식이 ___.",           answer:"있습니다",  answers:["있습니다","있습니다."],  hint:"💡 있다 → 있습니다" },
      { id:"t4_4",  q:"오늘 버스에 사람이 ___.",        answer:"적습니다",  answers:["적습니다","적습니다."],  hint:"💡 적다 → 적습니다" },
      { id:"t4_5",  q:"책상 위에 책이 ___.",            answer:"있습니다",  answers:["있습니다","있습니다."],  hint:"💡 있다 → 있습니다" },
      { id:"t4_6",  q:"가방 안에 지갑이 ___.",          answer:"있습니다",  answers:["있습니다","있습니다."],  hint:"💡 있다 → 있습니다" },
      { id:"t4_7",  q:"은행 옆에 편의점이 ___.",        answer:"있습니다",  answers:["있습니다","있습니다."],  hint:"💡 있다 → 있습니다" },
      { id:"t4_8",  q:"화장실이 어디에 ___?",           answer:"있습니까",  answers:["있습니까","있습니까?"], hint:"💡 있다 → 있습니까?" },
      // ── 3단원 복습 (8문항) ──
      { id:"t4_9",  q:"날씨가 ___. (좋다)",             answer:"좋습니다",  answers:["좋습니다","좋습니다."],  hint:"💡 좋다 → 좋습니다" },
      { id:"t4_10", q:"이 음식이 ___. (맵다→ㅂ불규칙)", answer:"맵습니다",  answers:["맵습니다","맵습니다."],  hint:"💡 맵다 → ㅂ불규칙 → 맵습니다" },
      { id:"t4_11", q:"이 가방이 ___. (크다→으탈락)",    answer:"큽니다",    answers:["큽니다","큽니다."],      hint:"💡 크다 → 으탈락 → 큽니다" },
      { id:"t4_12", q:"오늘 날씨가 ___. (춥다→ㅂ불규칙)",answer:"춥습니다",  answers:["춥습니다","춥습니다."],  hint:"💡 춥다 → ㅂ불규칙 → 춥습니다" },
      { id:"t4_13", q:"이 짐이 ___. (무겁다→ㅂ불규칙)", answer:"무겁습니다",answers:["무겁습니다","무겁습니다."],hint:"💡 무겁다 → 무겁습니다" },
      { id:"t4_14", q:"이 음식이 ___. (달다)",           answer:"답니다",    answers:["답니다","답니다."],      hint:"💡 달다 → ㄹ탈락 → 답니다" },
      { id:"t4_15", q:"한국어가 ___. (재미있다)",        answer:"재미있습니다",answers:["재미있습니다","재미있습니다."],hint:"💡 재미있다 → 재미있습니다" },
      { id:"t4_16", q:"이 식당이 ___. (비싸다)",         answer:"비쌉니다",  answers:["비쌉니다","비쌉니다."],  hint:"💡 비싸다 → 비쌉니다" },
      // ── 4단원 신규 (14문항) ──
      { id:"t4_17", q:"___ 갑니까? (장소)",              answer:"어디",      answers:["어디"],                  hint:"💡 장소 의문대명사" },
      { id:"t4_18", q:"___ 입니까? (사람)",              answer:"누구",      answers:["누구"],                  hint:"💡 사람 의문대명사" },
      { id:"t4_19", q:"___ 먹습니까? (사물)",            answer:"무엇을",    answers:["무엇을","뭐"],            hint:"💡 사물 의문대명사" },
      { id:"t4_20", q:"___ 합니까? (때)",                answer:"언제",      answers:["언제"],                  hint:"💡 시간 의문대명사" },
      { id:"t4_21", q:"___ 왔습니까? (방법)",            answer:"어떻게",    answers:["어떻게"],                hint:"💡 방법 의문대명사" },
      { id:"t4_22", q:"이게 ___ 입니까? (값)",           answer:"얼마",      answers:["얼마"],                  hint:"💡 가격 의문대명사" },
      { id:"t4_23", q:"___ 가 의사입니까? (주어)",       answer:"누가",      answers:["누가"],                  hint:"💡 누구 + 이/가 → 누가" },
      { id:"t4_24", q:"이 음식이 ___ 음식입니까?",       answer:"무슨",      answers:["무슨"],                  hint:"💡 무슨 + 명사 = 어떤 종류" },
      { id:"t4_25", q:"___ 한국어를 공부합니까? (이유)", answer:"왜",        answers:["왜"],                    hint:"💡 이유 의문대명사" },
      { id:"t4_26", q:"학교가 ___ 있습니까? (장소)",     answer:"어디에",    answers:["어디에","어디"],          hint:"💡 어디에 + 있다" },
      { id:"t4_27", q:"___ 친구가 옵니까? (수량)",       answer:"몇",        answers:["몇"],                    hint:"💡 수량 의문대명사" },
      { id:"t4_28", q:"지금 ___ 입니까? (시간)",         answer:"몇 시",     answers:["몇 시","몇시"],           hint:"💡 몇 시 = what time" },
      { id:"t4_29", q:"___ 이 더 큽니까? (비교)",        answer:"어느 것",   answers:["어느 것","어느것"],       hint:"💡 어느 것 = which one" },
      { id:"t4_30", q:"이 가방이 ___ 입니까? (색깔)",    answer:"무슨 색",   answers:["무슨 색","무슨색"],       hint:"💡 무슨 색 = what color" },
    ];

    function gradeTest4() {
      let correct = 0;
      const feedback = TEST4_QUESTIONS.map(q => {
        const userAns = (testAnswers[q.id] || "").trim();
        const ok = (q.answers || [q.answer]).some(a => userAns === a || userAns.replace(/\s/g,"") === a.replace(/\s/g,""));
        if (ok) correct++;
        return {...q, userAns, ok};
      });
      const score = Math.round((correct / TEST4_QUESTIONS.length) * 100);
      const passed = score >= 80;
      if (passed) {
        const newPassed = [...new Set([...unitsPassed, 1,2,3,4])];
        setUnitsPassed(newPassed);
        try { localStorage.setItem("hc_unitsPassed", JSON.stringify(newPassed)); } catch(e) {}
      }
      setTestResult({ score, passed, feedback });
    }

    if (testResult) {
      return (
        <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#FFF8F0,#FFE8D0)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
          <DevJumpPanel />
          <div style={{width:"100%", maxWidth:400}}>
            <div style={{textAlign:"center", marginBottom:20}}>
              <div style={{fontSize:40}}>{testResult.passed?"🎉":"💪"}</div>
              <div style={{fontSize:22, fontWeight:900, color: testResult.passed?"#2E7D32":"#E64A00", marginBottom:4}}>
                {testResult.score}점 {testResult.passed?"— 통과!":"— 다시 도전!"}
              </div>
              <div style={{fontSize:13, color:"#888"}}>범위: 서술어 1·2A·2B·3A·3B·4단원 (50문제)</div>
            </div>
            <div style={{background:"white", borderRadius:16, padding:16, marginBottom:16}}>
              {testResult.feedback.map((q,i)=>(
                <div key={i} style={{padding:"8px 0", borderBottom:i<testResult.feedback.length-1?"1px solid #f0f0f0":"none"}}>
                  <div style={{fontSize:13, color:"#333", fontWeight:600}}>{i+1}. {q.q}</div>
                  <div style={{fontSize:12, marginTop:4}}>
                    {q.ok
                      ? <span style={{color:"#2E7D32", fontWeight:700}}>✅ {q.answer}</span>
                      : <><span style={{color:"#E64A00"}}>❌ 내 답: {q.userAns||"(없음)"}</span> → <span style={{color:"#2E7D32", fontWeight:700}}>정답: {q.answer}</span></>
                    }
                  </div>
                </div>
              ))}
            </div>
            {testResult.passed ? (
              <button onClick={()=>{setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit6a");}}
                style={{width:"100%", background:"linear-gradient(135deg,#43A047,#2E7D32)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>
                {vi?"Tiếp tục — Bài 6A! 🚀":en?"Continue — Unit 6A! 🚀":"6단원으로 계속하기 🚀"}
              </button>
            ) : (
              <button onClick={()=>{setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setTestResult(null); setTestAnswers({}); setStep("unit4");}}
                style={{width:"100%", background:"linear-gradient(135deg,#FF8C42,#E64A00)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>
                {vi?"Học lại Bài 4 🔄":en?"Study Unit 4 again 🔄":"4단원 처음부터 다시 학습 🔄"}
              </button>
            )}
            <button onClick={()=>{setTestResult(null); setTestAnswers({});}}
              style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>
              ← {vi?"Thử lại":en?"Try again":"다시 풀기"}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#FFF8F0,#FFE8D0)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:400}}>
          <div style={{fontSize:14, fontWeight:900, color:"#E64A00", marginBottom:4}}>
            📝 누적 테스트 — 1·2·3·4단원
          </div>
          <div style={{fontSize:12, color:"#aaa", marginBottom:16}}>
            범위: 이에요/이다 + 있다·없다·많다·적다 + 형용사 + 의문대명사 (50문제)
          </div>
          {TEST4_QUESTIONS.map((q,i)=>(
            <div key={q.id} style={{background:"white", borderRadius:12, padding:"12px 14px", marginBottom:8}}>
              <div style={{fontSize:13, fontWeight:700, color:"#333", marginBottom:6}}>{i+1}. {q.q}</div>
              <input type="text" value={testAnswers[q.id]||""}
                onChange={e=>setTestAnswers(a=>({...a,[q.id]:e.target.value}))}
                onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Tab") e.stopPropagation(); }}
                placeholder={vi?"Điền vào...":en?"Fill in...":"여기에 쓰세요..."}
                style={{width:"100%", border:"2px solid #C8E6C9", borderRadius:8, padding:"7px 10px", fontSize:14, outline:"none", boxSizing:"border-box"}}
              />
              <div style={{fontSize:12, color:"#C62828", fontWeight:800, marginTop:6}}>{q.hint}</div>
            </div>
          ))}
          <button type="button" onClick={gradeTest4}
            style={{width:"100%", background:"linear-gradient(135deg,#FF6B35,#E64A00)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", marginTop:12}}>
            {vi?"Nộp bài!":en?"Submit!":"채점하기! 📊"}
          </button>
          <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit4"); }}
            style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>
            ← {vi?"Quay lại":en?"Back":"뒤로 (4단원 학습)"}
          </button>
        </div>
      </div>
    );
  }

  // ✅ V177: 서술어 5단원 — 부드러운 명령 ~세요
  if (step === "unit5") {
    const vi = lang?.code === "vi";
    const en = lang?.code === "en";

    function handleUnit5Submit() {
      setUnitCardRevealed(true);
    }

    const UNIT5_CARDS = [
      {
        front: "___ (앉다 → 명령)",
        blank: "앉으세요",
        full: "앉으세요.",
        hint: vi?"받침 있음 → 으세요":en?"Has final consonant → 으세요":"받침 있음 → 으세요",
      },
      {
        front: "___ (오다 → 명령)",
        blank: "오세요",
        full: "오세요.",
        hint: vi?"받침 없음 → 세요":en?"No final consonant → 세요":"받침 없음 → 세요",
      },
      {
        front: "___ (먹다의 높임말)",
        blank: "드세요",
        full: "드세요.",
        hint: vi?"먹다·마시다 → 드시다 (높임)":en?"먹다·마시다 → 드시다 (polite)":"먹다·마시다는 '드시다'로 높여요",
      },
      {
        front: "___ (알다 → 높임 명령)",
        blank: "아세요",
        full: "아세요.",
        hint: vi?"알다: ㄹ받침 → 어떻게 될까요?":en?"알다: ㄹ drops → ___세요?":"알다 → ㄹ 빠지면 → ___세요?",
      },
      {
        front: "___ (읽다 → 명령)",
        blank: "읽으세요",
        full: "읽으세요.",
        hint: vi?"받침 있음 → 으세요":en?"Has final consonant → 으세요":"받침 있음 → 으세요",
      },
      {
        front: "___ (살다 → 높임 명령)",
        blank: "사세요",
        full: "사세요.",
        hint: vi?"살다: ㄹ받침 → 어떻게 될까요?":en?"살다: ㄹ drops → ___세요?":"살다 → ㄹ 빠지면 → ___세요?",
      },
    ];

    const card = UNIT5_CARDS[unitCardIdx];
    const total = UNIT5_CARDS.length;

    return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#E8F5E9,#C8E6C9)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:400, marginBottom:16}}>
          <div style={{fontSize:13, fontWeight:900, color:"#2E7D32", marginBottom:2}}>
            📘 5단원 — 부드러운 명령 ~세요
          </div>
          <div style={{display:"flex", gap:4, marginBottom:8}}>
            {UNIT5_CARDS.map((_,i)=>(
              <div key={i} style={{flex:1, height:4, borderRadius:4, background: i<=unitCardIdx?"#43A047":"#ddd"}} />
            ))}
          </div>
          <div style={{fontSize:11, color:"#888", textAlign:"right"}}>{unitCardIdx+1} / {total}</div>
        </div>

        <div style={{width:"100%", maxWidth:400, background:"white", borderRadius:20, padding:28, boxShadow:"0 8px 32px #43A04722", marginBottom:16}}>
          <div style={{fontSize:13, color:"#aaa", marginBottom:16, textAlign:"center"}}>
            {vi?"Điền vào chỗ trống":en?"Fill in the blank":"빈칸을 채워보세요 ✍️"}
          </div>
          <div style={{fontSize:18, fontWeight:900, color:"#1A2A1A", textAlign:"center", marginBottom:16, lineHeight:1.8}}>
            {card.front.split("___")[0]}
            <input type="text" value={unitCardInput}
              onChange={e=>setUnitCardInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter" && !unitCardRevealed && unitCardInput.trim()) { e.preventDefault(); handleUnit5Submit(); } }}
              disabled={unitCardRevealed} placeholder="..."
              style={{display:"inline-block", width:140, textAlign:"center", border:"none",
                borderBottom:`3px solid ${unitCardRevealed?(unitCardInput.trim()===card.blank?"#43A047":"#FF6B35"):"#43A047"}`,
                fontSize:16, fontWeight:900, color:"#2E7D32", background:"transparent", outline:"none", padding:"0 4px"}}
            />
            {card.front.split("___")[1]}
          </div>
          {unitCardRevealed && (
            <div style={{textAlign:"center", marginBottom:12}}>
              <div style={{fontSize:15, color: unitCardInput.trim()===card.blank?"#2E7D32":"#FF6B35", fontWeight:700, marginBottom:8}}>
                {unitCardInput.trim()===card.blank ? "✅ 정답!" : `❌ 정답: ${card.blank}`}
              </div>
              <div style={{fontSize:14, color:"#555", marginBottom:12}}>→ {card.full}</div>
              <button onClick={()=>speakKo(card.full)}
                style={{background:"#43A047", border:"none", borderRadius:50, padding:"8px 20px", color:"white", fontSize:13, fontWeight:700, cursor:"pointer"}}>
                🔊 {vi?"Nghe lại":en?"Listen":"전체 문장 듣기"}
              </button>
            </div>
          )}
          <div style={{background:"#F1F8E9", borderRadius:12, padding:"10px 14px", fontSize:13, color:"#555", textAlign:"center"}}>
            💡 {card.hint}
          </div>
        </div>

        {!unitCardRevealed && (
          <div style={{width:"100%", maxWidth:400, background:"white", borderRadius:16, padding:16, marginBottom:16, fontSize:12, color:"#444"}}>
            <div style={{fontWeight:900, color:"#2E7D32", marginBottom:8}}>📌 {vi?"Quy tắc":en?"Rule":"핵심 규칙"}</div>
            <div>· 받침 <b>없음</b> → <b>~세요</b> &nbsp;(오다, 가다 + ?)</div>
            <div>· 받침 <b>있음</b> → <b>~으세요</b> &nbsp;(앉다, 읽다 + ?)</div>
            <div>· 먹다·마시다 → <b>드세요</b> &nbsp;(특별 높임말)</div>
            <div>· ㄹ받침 → <b>ㄹ 빠지고 ~세요</b> &nbsp;(알다→___, 살다→___)</div>
          </div>
        )}

        {!unitCardRevealed ? (
          <button onClick={handleUnit5Submit} disabled={!unitCardInput.trim()}
            style={{width:"100%", maxWidth:400, background: unitCardInput.trim()?"linear-gradient(135deg,#43A047,#2E7D32)":"#ccc", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor: unitCardInput.trim()?"pointer":"default"}}>
            {vi?"Kiểm tra":en?"Check":"확인하기 ✓"}
          </button>
        ) : unitCardIdx < total - 1 ? (
          <button onClick={()=>{ setUnitCardIdx(i=>i+1); setUnitCardInput(""); setUnitCardRevealed(false); }}
            style={{width:"100%", maxWidth:400, background:"linear-gradient(135deg,#43A047,#2E7D32)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>
            {vi?"Tiếp theo →":en?"Next →":"다음 →"} ({unitCardIdx+2}/{total})
          </button>
        ) : (
          <button onClick={()=>{ setTestAnswers({}); setTestResult(null); setTestQuestions([]); setStep("test5"); }}
            style={{width:"100%", maxWidth:400, background:"linear-gradient(135deg,#FF6B35,#E64A00)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>
            📝 {vi?"Làm bài kiểm tra!":en?"Take the test!":"누적 테스트 시작! (1~5단원) 📝"}
          </button>
        )}
        <button onClick={()=>{ setTestResult(null); setTestAnswers({}); setUnitCardIdx(0); setStep("test4"); }}
          style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>
          ← {vi?"Quay lại":en?"Back":"뒤로 (4단원 테스트)"}
        </button>
      </div>
    );
  }


  // ════════════════════════════════════════════════════════
  // ✅ V183: 서술어 6A단원 — 그리고·그런데·하지만·그래서 (연결어)
  // ════════════════════════════════════════════════════════
  if (step === "unit6a") {
    const vi = lang?.code === "vi";
    const en = lang?.code === "en";

    function handleUnit6aSubmit() {
      if (!unitCardInput.trim()) return;
      setUnitCardRevealed(true);
      speakKo(unitCardInput.trim());
    }

    const UNIT6A_CARDS = [
      {
        front: "저는 커피를 좋아합니다. ___ 차도 좋아합니다.",
        blank: "그리고",
        blanks: ["그리고","또"],
        full: "저는 커피를 좋아합니다. 그리고 차도 좋아합니다.",
        hint: vi?"Thêm thông tin → dùng từ nào?":en?"Adding more info → which word?":"앞 내용에 더 추가할 때 → ___?",
      },
      {
        front: "날씨가 좋습니다. ___ 바람이 붑니다.",
        blank: "그런데",
        full: "날씨가 좋습니다. 그런데 바람이 붑니다.",
        hint: vi?"Chuyển chủ đề nhẹ nhàng → dùng từ gì?":en?"Soft topic shift → which word?":"화제를 살짝 전환할 때 → ___",
      },
      {
        front: "한국어가 재미있습니다. ___ 어렵습니다.",
        blank: "하지만",
        blanks: ["하지만","그러나","그렇지만"],
        full: "한국어가 재미있습니다. 하지만 어렵습니다.",
        hint: vi?"Đối lập mạnh, phủ định → ___":en?"Strong contrast → which word?":"재미있다 ↔ 어렵다: 이 두 감정이 반대될 때 → ___",
      },
      {
        front: "비가 옵니다. ___ 우산을 가져왔습니다.",
        blank: "그래서",
        full: "비가 옵니다. 그래서 우산을 가져왔습니다.",
        hint: vi?"Kết quả/lý do → dùng từ gì?":en?"Result/reason → which word?":"앞이 이유, 뒤가 결과일 때 → ___",
      },
      {
        front: "배가 고픕니다. ___ 밥을 먹었습니다.",
        blank: "그래서",
        full: "배가 고픕니다. 그래서 밥을 먹었습니다.",
        hint: vi?"Nguyên nhân → kết quả":en?"Cause → result":"배고프다 → 먹다: 원인·결과 → ___",
      },
      {
        front: "저는 한국 음식을 좋아합니다. ___ 매운 건 못 먹습니다.",
        blank: "하지만",
        blanks: ["하지만","그러나","그렇지만"],
        full: "저는 한국 음식을 좋아합니다. 하지만 매운 건 못 먹습니다.",
        hint: vi?"Yêu thích nhưng không ăn được → cảm giác đối lập?":en?"Like it but can't eat it → contrast word?":"좋아하지만 못 먹어요: 좋다 ↔ 못 먹다, 이럴 때 → ___",
      },
      {
        front: "시간이 있습니다. ___ 같이 갑시다.",
        blank: "그러면",
        full: "시간이 있습니다. 그러면 같이 갑시다.",
        hint: vi?"Tình huống đã có → đề xuất tiếp → ___?":en?"Given the situation → then what? → ___?":"시간이 있다는 걸 확인하고 제안할 때 → ___",
      },
      {
        front: "비쌉니다. ___ 살 겁니다.",
        blank: "그래도",
        full: "비쌉니다. 그래도 살 겁니다.",
        hint: vi?"Dù đắt vẫn mua → vẫn cứ làm → ___?":en?"Expensive but buying anyway → which word?":"비싸도 포기 안 해요: 불구하고 계속할 때 → ___",
      },
      {
        front: "커피입니까, ___ 차입니까?",
        blank: "아니면",
        full: "커피입니까, 아니면 차입니까?",
        hint: vi?"Hỏi chọn một trong hai → ___?":en?"Asking to choose between two → ___?":"둘 중 하나를 고를 때 묻는 말 → ___",
      },
    ];

    const card = UNIT6A_CARDS[unitCardIdx];
    const total = UNIT6A_CARDS.length;

    return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#FFF8E1,#FFE082)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:400, marginBottom:16}}>
          <div style={{fontSize:12, color:"#E65100", fontWeight:700, marginBottom:6}}>
            📘 {vi?"Bài 6A — Liên từ (그리고·그런데·하지만·그래서)":en?"Unit 6A — Connectors (그리고·그런데·하지만·그래서)":"서술어 6A단원 — 연결어 (그리고·그런데·하지만·그래서·그러면·그래도·아니면)"}
          </div>
          <div style={{display:"flex", gap:4}}>
            {UNIT6A_CARDS.map((_,i)=>(
              <div key={i} style={{flex:1, height:5, borderRadius:3, background: i<unitCardIdx?"#FF8F00": i===unitCardIdx?"#E65100":"#FFE082", transition:"all .3s"}}/>
            ))}
          </div>
          <div style={{fontSize:11, color:"#aaa", marginTop:4, textAlign:"right"}}>{unitCardIdx+1} / {total}</div>
        </div>

        <div style={{width:"100%", maxWidth:400, background:"white", borderRadius:20, padding:28, boxShadow:"0 8px 32px #FF8F0022", marginBottom:16}}>
          <div style={{fontSize:13, color:"#aaa", marginBottom:16, textAlign:"center"}}>
            {vi?"Điền vào chỗ trống":en?"Fill in the blank":"빈칸을 채워보세요 ✍️"}
          </div>
          <div style={{fontSize:17, fontWeight:900, color:"#2A1A00", textAlign:"center", marginBottom:16, lineHeight:2}}>
            {card.front.split("___")[0]}
            <input type="text" value={unitCardInput}
              onChange={e=>setUnitCardInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter" && !unitCardRevealed && unitCardInput.trim()) { e.preventDefault(); handleUnit6aSubmit(); } }}
              disabled={unitCardRevealed} placeholder="..."
              style={{display:"inline-block", width:90, textAlign:"center", border:"none",
                borderBottom:`3px solid ${unitCardRevealed?((card.blanks||[card.blank]).includes(unitCardInput.trim())?"#FF8F00":"#FF6B35"):"#FF8F00"}`,
                fontSize:17, fontWeight:900, color:"#E65100", background:"transparent", outline:"none", padding:"0 4px"}}
            />
            {card.front.split("___")[1]}
          </div>
          {unitCardRevealed && (
            <div style={{textAlign:"center", marginBottom:12}}>
              <div style={{fontSize:15, color: (card.blanks||[card.blank]).includes(unitCardInput.trim())?"#E65100":"#FF6B35", fontWeight:700, marginBottom:8}}>
                {(card.blanks||[card.blank]).includes(unitCardInput.trim()) ? "✅ 정답!" : `❌ 정답: ${card.blank} (또는 ${(card.blanks||[card.blank]).filter(b=>b!==card.blank).join("/")||card.blank})`}
              </div>
              <div style={{fontSize:14, color:"#555", marginBottom:12}}>→ {card.full}</div>
              <button onClick={()=>speakKo(card.full)}
                style={{background:"#FF8F00", border:"none", borderRadius:50, padding:"8px 20px", color:"white", fontSize:13, fontWeight:700, cursor:"pointer"}}>
                🔊 {vi?"Nghe lại":en?"Listen":"전체 문장 듣기"}
              </button>
            </div>
          )}
          <div style={{background:"#FFF8E1", borderRadius:12, padding:"10px 14px", fontSize:13, color:"#555", textAlign:"center"}}>
            💡 {card.hint}
          </div>
        </div>

        {unitCardRevealed && (
          <div style={{width:"100%", maxWidth:400, background:"white", borderRadius:16, padding:16, marginBottom:16, fontSize:12, color:"#444"}}>
            <div style={{fontWeight:900, color:"#E65100", marginBottom:8}}>📌 {vi?"Quy tắc":en?"Rule":"핵심 규칙"}</div>
            <div>· <b>그리고 / 또</b> — {vi?"và / ngoài ra (thêm)":en?"and / also (add)":"그리고·또 → 추가"}</div>
            <div>· <b>그런데</b> — {vi?"nhưng mà (chuyển)":en?"but/however (shift)":"그런데 → 전환"}</div>
            <div>· <b>하지만 / 그러나 / 그렇지만</b> — {vi?"nhưng (đối lập)":en?"but (contrast)":"하지만·그러나·그렇지만 → 반대"}</div>
            <div>· <b>그래서</b> — {vi?"vì vậy (kết quả)":en?"so/therefore (result)":"그래서 → 결과"}</div>
            <div>· <b>그러면</b> — {vi?"thế thì (điều kiện→đề xuất)":en?"then/if so (condition→result)":"그러면 → 앞 상황 받아 제안"}</div>
            <div>· <b>그래도</b> — {vi?"dù vậy (nhượng bộ)":en?"even so (concession)":"그래도 → 양보"}</div>
            <div>· <b>아니면</b> — {vi?"hoặc là (lựa chọn)":en?"or (choice)":"아니면 → 선택"}</div>
          </div>
        )}

        {!unitCardRevealed ? (
          <button onClick={handleUnit6aSubmit} disabled={!unitCardInput.trim()}
            style={{width:"100%", maxWidth:400, background: unitCardInput.trim()?"linear-gradient(135deg,#FF8F00,#E65100)":"#ccc", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor: unitCardInput.trim()?"pointer":"default", boxShadow: unitCardInput.trim()?"0 4px 16px #FF8F0044":"none"}}>
            {vi?"Kiểm tra":en?"Check":"확인하기 ✓"}
          </button>
        ) : unitCardIdx < total - 1 ? (
          <button onClick={()=>{ setUnitCardIdx(i=>i+1); setUnitCardInput(""); setUnitCardRevealed(false); }}
            style={{width:"100%", maxWidth:400, background:"linear-gradient(135deg,#FF8F00,#E65100)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>
            {vi?"Tiếp theo →":en?"Next →":"다음 →"} ({unitCardIdx+2}/{total})
          </button>
        ) : (
          <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit6b"); }}
            style={{width:"100%", maxWidth:400, background:"linear-gradient(135deg,#FFA726,#E65100)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>
            {vi?"Tiếp theo — Bài 6B →":en?"Next — Unit 6B →":"다음 → 6B단원 (-고/-지만) 🚀"}
          </button>
        )}
        <button onClick={()=>{ setTestResult(null); setTestAnswers({}); setUnitCardIdx(0); setStep("test5"); }}
          style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>
          ← {vi?"Quay lại":en?"Back":"뒤로 (5단원 테스트)"}
        </button>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // ✅ V183: 서술어 6B단원 — -고/-지만/-아서 (문장 내 연결어미)
  // ════════════════════════════════════════════════════════
  if (step === "unit6b") {
    const vi = lang?.code === "vi";
    const en = lang?.code === "en";

    function handleUnit6bSubmit() {
      if (!unitCardInput.trim()) return;
      setUnitCardRevealed(true);
      speakKo(unitCardInput.trim());
    }

    const UNIT6B_CARDS = [
      {
        front: "밥을 먹___ 영화를 봅니다.",
        blank: "고",
        full: "밥을 먹고 영화를 봅니다.",
        hint: vi?"먹다 + ___ + 동작 나열":en?"먹다 + ___ + listing actions":"먹다 줄기 + ___ → 두 동작 나열",
      },
      {
        front: "저는 키가 크___ 마릅니다.",
        blank: "고",
        full: "저는 키가 크고 마릅니다.",
        hint: vi?"두 가지 특징을 이을 때":en?"Listing two features":"두 가지 특징을 이을 때 → ___",
      },
      {
        front: "비가 오___ 바람이 붑니다.",
        blank: "고",
        full: "비가 오고 바람이 붑니다.",
        hint: vi?"오다 + ___ (động từ nối tiếp)":en?"오다 + ___ (sequential actions)":"오다 + ___ → 동시·순서 연결",
      },
      {
        front: "한국어가 재미있___ 어렵습니다.",
        blank: "지만",
        full: "한국어가 재미있지만 어렵습니다.",
        hint: vi?"Đối lập trong 1 câu → ___":en?"Contrast in one sentence → ___":"한 문장 안에서 반대 내용 → ___",
      },
      {
        front: "값이 비싸___ 좋습니다.",
        blank: "지만",
        full: "값이 비싸지만 좋습니다.",
        hint: vi?"비싸다 + ___ (đối lập trong câu)":en?"비싸다 + ___ (contrast within sentence)":"비싸다 ↔ 좋아요: 한 문장 안에서 반대 → ___",
      },
      {
        front: "배가 고파___ 밥을 먹습니다.",
        blank: "서",
        full: "배가 고파서 밥을 먹습니다.",
        hint: vi?"배가 고프다 → 왜 밥 먹어요? (nguyên nhân)":en?"Hungry → why eat? (reason)":"배가 고파서 먹어요: 이유를 말할 때 어미는 → ___",
      },
    ];

    const card = UNIT6B_CARDS[unitCardIdx];
    const total = UNIT6B_CARDS.length;

    return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#FFF8E1,#FFE082)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:400, marginBottom:16}}>
          <div style={{fontSize:12, color:"#E65100", fontWeight:700, marginBottom:6}}>
            📘 {vi?"Bài 6B — Liên kết trong câu (-고/-지만/-아서)":en?"Unit 6B — In-sentence connectors (-고/-지만/-아서)":"서술어 6B단원 — 문장 안 연결어미 (-고/-지만/-아서)"}
          </div>
          <div style={{display:"flex", gap:4}}>
            {UNIT6B_CARDS.map((_,i)=>(
              <div key={i} style={{flex:1, height:5, borderRadius:3, background: i<unitCardIdx?"#FF8F00": i===unitCardIdx?"#E65100":"#FFE082", transition:"all .3s"}}/>
            ))}
          </div>
          <div style={{fontSize:11, color:"#aaa", marginTop:4, textAlign:"right"}}>{unitCardIdx+1} / {total}</div>
        </div>

        <div style={{width:"100%", maxWidth:400, background:"white", borderRadius:20, padding:28, boxShadow:"0 8px 32px #FF8F0022", marginBottom:16}}>
          <div style={{fontSize:13, color:"#aaa", marginBottom:16, textAlign:"center"}}>
            {vi?"Điền vào chỗ trống":en?"Fill in the blank":"빈칸을 채워보세요 ✍️"}
          </div>
          <div style={{fontSize:17, fontWeight:900, color:"#2A1A00", textAlign:"center", marginBottom:16, lineHeight:2}}>
            {card.front.split("___")[0]}
            <input type="text" value={unitCardInput}
              onChange={e=>setUnitCardInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter" && !unitCardRevealed && unitCardInput.trim()) { e.preventDefault(); handleUnit6bSubmit(); } }}
              disabled={unitCardRevealed} placeholder="..."
              style={{display:"inline-block", width:70, textAlign:"center", border:"none",
                borderBottom:`3px solid ${unitCardRevealed?(unitCardInput.trim()===card.blank?"#FF8F00":"#FF6B35"):"#FF8F00"}`,
                fontSize:17, fontWeight:900, color:"#E65100", background:"transparent", outline:"none", padding:"0 4px"}}
            />
            {card.front.split("___")[1]}
          </div>
          {unitCardRevealed && (
            <div style={{textAlign:"center", marginBottom:12}}>
              <div style={{fontSize:15, color: unitCardInput.trim()===card.blank?"#E65100":"#FF6B35", fontWeight:700, marginBottom:8}}>
                {unitCardInput.trim()===card.blank ? "✅ 정답!" : `❌ 정답: ${card.blank}`}
              </div>
              <div style={{fontSize:14, color:"#555", marginBottom:12}}>→ {card.full}</div>
              <button onClick={()=>speakKo(card.full)}
                style={{background:"#FF8F00", border:"none", borderRadius:50, padding:"8px 20px", color:"white", fontSize:13, fontWeight:700, cursor:"pointer"}}>
                🔊 {vi?"Nghe lại":en?"Listen":"전체 문장 듣기"}
              </button>
            </div>
          )}
          <div style={{background:"#FFF8E1", borderRadius:12, padding:"10px 14px", fontSize:13, color:"#555", textAlign:"center"}}>
            💡 {card.hint}
          </div>
        </div>

        {unitCardRevealed && (
          <div style={{width:"100%", maxWidth:400, background:"white", borderRadius:16, padding:16, marginBottom:16, fontSize:12, color:"#444"}}>
            <div style={{fontWeight:900, color:"#E65100", marginBottom:8}}>📌 {vi?"Quy tắc":en?"Rule":"핵심 규칙"}</div>
            <div>· <b>-고</b> — {vi?"và (liệt kê, nối tiếp)":en?"and (list, sequence)":"나열·순서 → 동사/형용사 + 고"}</div>
            <div>· <b>-지만</b> — {vi?"nhưng (đối lập)":en?"but (contrast)":"반대 → 동사/형용사 + 지만"}</div>
            <div>· <b>-아/어서</b> — {vi?"vì (nguyên nhân)":en?"because/so (cause)":"이유 → 아/어서 (고파서·좋아서)"}</div>
          </div>
        )}

        {!unitCardRevealed ? (
          <button onClick={handleUnit6bSubmit} disabled={!unitCardInput.trim()}
            style={{width:"100%", maxWidth:400, background: unitCardInput.trim()?"linear-gradient(135deg,#FF8F00,#E65100)":"#ccc", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor: unitCardInput.trim()?"pointer":"default", boxShadow: unitCardInput.trim()?"0 4px 16px #FF8F0044":"none"}}>
            {vi?"Kiểm tra":en?"Check":"확인하기 ✓"}
          </button>
        ) : unitCardIdx < total - 1 ? (
          <button onClick={()=>{ setUnitCardIdx(i=>i+1); setUnitCardInput(""); setUnitCardRevealed(false); }}
            style={{width:"100%", maxWidth:400, background:"linear-gradient(135deg,#FF8F00,#E65100)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>
            {vi?"Tiếp theo →":en?"Next →":"다음 →"} ({unitCardIdx+2}/{total})
          </button>
        ) : (
          <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit6c"); }}
            style={{width:"100%", maxWidth:400, background:"linear-gradient(135deg,#FF6D00,#BF360C)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>
            {vi?"Tiếp theo — Bài 6C →":en?"Next — Unit 6C →":"다음 → 6C단원 (-(으)면·-니까·-는데) 🚀"}
          </button>
        )}
        <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit6a"); }}
          style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>
          ← {vi?"Quay lại":en?"Back":"뒤로 (6A단원)"}
        </button>
      </div>
    );
  }

  // ✅ V177: 누적 테스트 5 (1~5단원)
  if (step === "test5") {
    const vi = lang?.code === "vi";
    const en = lang?.code === "en";

    // 포함 단원: 3·4·5단원 (2단원 졸업 — 3회 졸업 규칙 적용)
    const TEST5_QUESTIONS = [
      // ── 3단원 복습 (8문항) ──
      { id:"t5_1",  q:"날씨가 ___. (좋다)",              answer:"좋습니다",   answers:["좋습니다","좋습니다."],   hint:"💡 좋다 → 좋습니다" },
      { id:"t5_2",  q:"오늘 날씨가 ___. (춥다)",          answer:"춥습니다",   answers:["춥습니다","춥습니다."],   hint:"💡 춥다 → ㅂ불규칙 → 춥습니다" },
      { id:"t5_3",  q:"이 음식이 ___. (맵다)",            answer:"맵습니다",   answers:["맵습니다","맵습니다."],   hint:"💡 맵다 → ㅂ불규칙 → 맵습니다" },
      { id:"t5_4",  q:"한국어가 ___. (어렵다)",           answer:"어렵습니다", answers:["어렵습니다","어렵습니다."],hint:"💡 어렵다 → ㅂ불규칙 → 어렵습니다" },
      { id:"t5_5",  q:"이 가방이 ___. (가볍다)",          answer:"가볍습니다", answers:["가볍습니다","가볍습니다."],hint:"💡 가볍다 → ㅂ불규칙 → 가볍습니다" },
      { id:"t5_6",  q:"여름에 날씨가 ___. (덥다)",        answer:"덥습니다",   answers:["덥습니다","덥습니다."],   hint:"💡 덥다 → ㅂ불규칙 → 덥습니다" },
      { id:"t5_7",  q:"이 식당이 ___. (비싸다)",          answer:"비쌉니다",   answers:["비쌉니다","비쌉니다."],   hint:"💡 비싸다 → 비쌉니다" },
      { id:"t5_8",  q:"오늘 기분이 ___. (좋다)",          answer:"좋습니다",   answers:["좋습니다","좋습니다."],   hint:"💡 좋다 → 좋습니다" },
      // ── 4단원 복습 (8문항) ──
      { id:"t5_9",  q:"___ 갑니까? (장소)",               answer:"어디",       answers:["어디"],                   hint:"💡 장소 의문대명사" },
      { id:"t5_10", q:"___ 입니까? (사람)",               answer:"누구",       answers:["누구"],                   hint:"💡 사람 의문대명사" },
      { id:"t5_11", q:"___ 먹습니까? (사물)",             answer:"무엇을",     answers:["무엇을","뭐"],             hint:"💡 사물 의문대명사" },
      { id:"t5_12", q:"___ 합니까? (때)",                 answer:"언제",       answers:["언제"],                   hint:"💡 시간 의문대명사" },
      { id:"t5_13", q:"___ 왔습니까? (방법)",             answer:"어떻게",     answers:["어떻게"],                 hint:"💡 방법 의문대명사" },
      { id:"t5_14", q:"___ 한국어를 공부합니까? (이유)",  answer:"왜",         answers:["왜"],                     hint:"💡 이유 의문대명사" },
      { id:"t5_15", q:"이게 ___ 입니까? (값)",            answer:"얼마",       answers:["얼마"],                   hint:"💡 가격 의문대명사" },
      { id:"t5_16", q:"___ 이 더 큽니까? (비교)",         answer:"어느 것",    answers:["어느 것","어느것"],        hint:"💡 어느 것 = which one" },
      // ── 5단원 신규 (14문항) ──
      { id:"t5_17", q:"앉다 → ___",                       answer:"앉으세요",   answers:["앉으세요","앉으세요."],   hint:"💡 받침 있음 → 으세요" },
      { id:"t5_18", q:"읽다 → ___",                       answer:"읽으세요",   answers:["읽으세요","읽으세요."],   hint:"💡 받침 있음 → 으세요" },
      { id:"t5_19", q:"오다 → ___",                       answer:"오세요",     answers:["오세요","오세요."],       hint:"💡 받침 없음 → 세요" },
      { id:"t5_20", q:"먹다 → ___ (높임)",                answer:"드세요",     answers:["드세요","드세요."],       hint:"💡 먹다 높임말 → 드세요" },
      { id:"t5_21", q:"알다 → ___",                       answer:"아세요",     answers:["아세요","아세요."],       hint:"💡 알다 → ㄹ탈락 → 아세요" },
      { id:"t5_22", q:"살다 → ___",                       answer:"사세요",     answers:["사세요","사세요."],       hint:"💡 살다 → ㄹ탈락 → 사세요" },
      { id:"t5_23", q:"천천히 ___. (걷다)",               answer:"걸으세요",   answers:["걸으세요","걸으세요."],   hint:"💡 걷다 → ㄷ불규칙 → 걸으세요" },
      { id:"t5_24", q:"말하다 → ___",                     answer:"말하세요",   answers:["말하세요","말하세요."],   hint:"💡 받침 없음 → 세요" },
      { id:"t5_25", q:"잠깐 기다려 ___. (부탁)",          answer:"주세요",     answers:["주세요","주세요."],       hint:"💡 주다 → 주세요 (부탁)" },
      { id:"t5_26", q:"여기에 ___. (앉다)",               answer:"앉으세요",   answers:["앉으세요","앉으세요."],   hint:"💡 앉다 → 앉으세요" },
      { id:"t5_27", q:"천천히 ___. (말하다)",             answer:"말하세요",   answers:["말하세요","말하세요."],   hint:"💡 말하다 → 말하세요" },
      { id:"t5_28", q:"이쪽으로 ___. (오다)",             answer:"오세요",     answers:["오세요","오세요."],       hint:"💡 오다 → 오세요" },
      { id:"t5_29", q:"한국어를 ___. (공부하다)",         answer:"공부하세요", answers:["공부하세요","공부하세요."],hint:"💡 공부하다 → 공부하세요" },
      { id:"t5_30", q:"이 음식을 ___. (먹다·높임)",       answer:"드세요",     answers:["드세요","드세요."],       hint:"💡 먹다 높임말 → 드세요" },
    ];

    function gradeTest5() {
      let correct = 0;
      const feedback = TEST5_QUESTIONS.map(q => {
        const userAns = (testAnswers[q.id] || "").trim();
        const ok = (q.answers || [q.answer]).some(a => userAns === a || userAns.replace(/\s/g,"") === a.replace(/\s/g,""));
        if (ok) correct++;
        return {...q, userAns, ok};
      });
      const score = Math.round((correct / TEST5_QUESTIONS.length) * 100);
      const passed = score >= 80;
      if (passed) {
        const newPassed = [...new Set([...unitsPassed, 1,2,3,4,5])];
        setUnitsPassed(newPassed);
        try { localStorage.setItem("hc_unitsPassed", JSON.stringify(newPassed)); } catch(e) {}
      }
      setTestResult({ score, passed, feedback });
    }

    if (testResult) {
      return (
        <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#FFF8F0,#FFE8D0)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
          <DevJumpPanel />
          <div style={{width:"100%", maxWidth:400}}>
            <div style={{textAlign:"center", marginBottom:20}}>
              <div style={{fontSize:40}}>{testResult.passed?"🎉":"💪"}</div>
              <div style={{fontSize:22, fontWeight:900, color: testResult.passed?"#2E7D32":"#E64A00", marginBottom:4}}>
                {testResult.score}점 {testResult.passed?"— 통과!":"— 다시 도전!"}
              </div>
              <div style={{fontSize:13, color:"#888"}}>범위: 서술어 1·2A·2B·3A·3B·4·5단원 (60문제)</div>
            </div>
            <div style={{background:"white", borderRadius:16, padding:16, marginBottom:16}}>
              {testResult.feedback.map((q,i)=>(
                <div key={i} style={{padding:"8px 0", borderBottom:i<testResult.feedback.length-1?"1px solid #f0f0f0":"none"}}>
                  <div style={{fontSize:13, color:"#333", fontWeight:600}}>{i+1}. {q.q}</div>
                  <div style={{fontSize:12, marginTop:4}}>
                    {q.ok
                      ? <span style={{color:"#2E7D32", fontWeight:700}}>✅ {q.answer}</span>
                      : <><span style={{color:"#E64A00"}}>❌ 내 답: {q.userAns||"(없음)"}</span> → <span style={{color:"#2E7D32", fontWeight:700}}>정답: {q.answer}</span></>
                    }
                  </div>
                </div>
              ))}
            </div>
            {testResult.passed ? (
              <button onClick={()=>{setStep("learn"); onReady?.();}}
                style={{width:"100%", background:"linear-gradient(135deg,#43A047,#2E7D32)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>
                {vi?"Tiếp tục học với 마중이! 🚀":en?"Continue with 마중이! 🚀":"마중이와 계속 학습하기 🚀"}
              </button>
            ) : (
              <button onClick={()=>{setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setTestResult(null); setTestAnswers({}); setStep("unit5");}}
                style={{width:"100%", background:"linear-gradient(135deg,#FF8C42,#E64A00)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>
                {vi?"Học lại Bài 5 🔄":en?"Study Unit 5 again 🔄":"5단원 처음부터 다시 학습 🔄"}
              </button>
            )}
            <button onClick={()=>{setTestResult(null); setTestAnswers({});}}
              style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>
              ← {vi?"Thử lại":en?"Try again":"다시 풀기"}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#FFF8F0,#FFE8D0)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:400}}>
          <div style={{fontSize:14, fontWeight:900, color:"#E64A00", marginBottom:4}}>
            📝 누적 테스트 — 1·2A·2B·3A·3B·4·5단원
          </div>
          <div style={{fontSize:12, color:"#aaa", marginBottom:16}}>
            범위: 이에요/이다 + 있다·없다·많다·적다 + 형용사 + 의문대명사 + ~세요 (60문제)
          </div>
          {TEST5_QUESTIONS.map((q,i)=>(
            <div key={q.id} style={{background:"white", borderRadius:12, padding:"12px 14px", marginBottom:8}}>
              <div style={{fontSize:13, fontWeight:700, color:"#333", marginBottom:6}}>{i+1}. {q.q}</div>
              <input type="text" value={testAnswers[q.id]||""}
                onChange={e=>setTestAnswers(a=>({...a,[q.id]:e.target.value}))}
                onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Tab") e.stopPropagation(); }}
                placeholder={vi?"Điền vào...":en?"Fill in...":"여기에 쓰세요..."}
                style={{width:"100%", border:"2px solid #C8E6C9", borderRadius:8, padding:"7px 10px", fontSize:14, outline:"none", boxSizing:"border-box"}}
              />
              <div style={{fontSize:12, color:"#C62828", fontWeight:800, marginTop:6}}>{q.hint}</div>
            </div>
          ))}
          <button type="button" onClick={gradeTest5}
            style={{width:"100%", background:"linear-gradient(135deg,#FF6B35,#E64A00)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", marginTop:12}}>
            {vi?"Nộp bài!":en?"Submit!":"채점하기! 📊"}
          </button>
          <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit5"); }}
            style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>
            ← {vi?"Quay lại":en?"Back":"뒤로 (5단원 학습)"}
          </button>
        </div>
      </div>
    );
  }



  // ════════════════════════════════════════════════════════
  // ✅ V184: 서술어 6C단원 — -(으)면·-(으)니까·-는데 (조건·이유·배경)
  // ════════════════════════════════════════════════════════
  if (step === "unit6c") {
    const vi = lang?.code === "vi";
    const en = lang?.code === "en";

    function handleUnit6cSubmit() {
      if (!unitCardInput.trim()) return;
      setUnitCardRevealed(true);
      speakKo(unitCardInput.trim());
    }

    const UNIT6C_CARDS = [
      {
        front: "시간이 있___ 옵니다.",
        blank: "으면",
        full: "시간이 있으면 옵니다.",
        hint: vi?"Nếu có thời gian thì... → điều kiện → ___?":en?"If there's time → condition ending → ___?":"시간이 있다면 올 거예요: 조건(if)을 붙일 때, 받침 있으면 → ___?",
      },
      {
        front: "날씨가 좋___ 공원에 갑니다.",
        blank: "으면",
        full: "날씨가 좋으면 공원에 갑니다.",
        hint: vi?"Nếu thời tiết đẹp thì... → ___?":en?"If the weather is nice then... → ___?":"날씨가 좋다 → 공원에 가요: 받침 있을 때 조건 어미 → ___?",
      },
      {
        front: "한국에 가___ 한국어를 배웁니다.",
        blank: "면",
        full: "한국에 가면 한국어를 배웁니다.",
        hint: vi?"가다 → 받침 없음 → 조건 어미는? (nếu đi)":en?"가다 → no final consonant → condition ending?":"가다처럼 받침 없을 때 조건(if) 어미 → ___?",
      },
      {
        front: "바쁘___ 못 갑니다.",
        blank: "니까",
        full: "바쁘니까 못 갑니다.",
        hint: vi?"바빠서 못 가요 → 구어로 이유 말할 때 → ___?":en?"Too busy, can't go → spoken reason ending → ___?":"바쁘다: 이유를 구어로 말할 때 받침 없으면 → ___?",
      },
      {
        front: "늦었___ 빨리 갑니다.",
        blank: "으니까",
        full: "늦었으니까 빨리 갑니다.",
        hint: vi?"늦었으니까 서둘러요 → 받침 있을 때 이유 어미 → ___?":en?"Late → hurry: reason ending with final consonant → ___?":"늦었다: 받침 있을 때 이유(구어) 어미 → ___?",
      },
      {
        front: "비가 오___ 우산 있습니까?",
        blank: "는데",
        full: "비가 오는데 우산 있습니까?",
        hint: vi?"비가 온다 → 상황 설명 후 질문할 때 → ___?":en?"Rain is falling → set the scene then ask → ___?":"오다(동사): 배경 설명 후 이어말할 때 어미 → ___?",
      },
    ];

    const card = UNIT6C_CARDS[unitCardIdx];
    const total = UNIT6C_CARDS.length;

    return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#FFF3E0,#FFE0B2)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:400, marginBottom:16}}>
          <div style={{fontSize:12, color:"#BF360C", fontWeight:700, marginBottom:6}}>
            📘 {vi?"Bài 6C — Điều kiện·Lý do·Nền (-(으)면·-(으)니까·-는데)":en?"Unit 6C — Condition·Reason·Background":"서술어 6C단원 — -(으)면·-(으)니까·-는데"}
          </div>
          <div style={{display:"flex", gap:4}}>
            {UNIT6C_CARDS.map((_,i)=>(
              <div key={i} style={{flex:1, height:5, borderRadius:3, background: i<unitCardIdx?"#FF6D00": i===unitCardIdx?"#BF360C":"#FFE0B2", transition:"all .3s"}}/>
            ))}
          </div>
          <div style={{fontSize:11, color:"#aaa", marginTop:4, textAlign:"right"}}>{unitCardIdx+1} / {total}</div>
        </div>

        <div style={{width:"100%", maxWidth:400, background:"white", borderRadius:20, padding:28, boxShadow:"0 8px 32px #FF6D0022", marginBottom:16}}>
          <div style={{fontSize:13, color:"#aaa", marginBottom:16, textAlign:"center"}}>
            {vi?"Điền vào chỗ trống":en?"Fill in the blank":"빈칸을 채워보세요 ✍️"}
          </div>
          <div style={{fontSize:17, fontWeight:900, color:"#2A1000", textAlign:"center", marginBottom:16, lineHeight:2}}>
            {card.front.split("___")[0]}
            <input type="text" value={unitCardInput}
              onChange={e=>setUnitCardInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter" && !unitCardRevealed && unitCardInput.trim()) { e.preventDefault(); handleUnit6cSubmit(); } }}
              disabled={unitCardRevealed} placeholder="..."
              style={{display:"inline-block", width:80, textAlign:"center", border:"none",
                borderBottom:`3px solid ${unitCardRevealed?((card.blanks||[card.blank]).includes(unitCardInput.trim())?"#FF6D00":"#FF3D00"):"#FF6D00"}`,
                fontSize:17, fontWeight:900, color:"#BF360C", background:"transparent", outline:"none", padding:"0 4px"}}
            />
            {card.front.split("___")[1]}
          </div>
          {unitCardRevealed && (
            <div style={{textAlign:"center", marginBottom:12}}>
              <div style={{fontSize:15, color:(card.blanks||[card.blank]).includes(unitCardInput.trim())?"#BF360C":"#FF3D00", fontWeight:700, marginBottom:8}}>
                {(card.blanks||[card.blank]).includes(unitCardInput.trim()) ? "✅ 정답!" : `❌ 정답: ${card.blank}`}
              </div>
              <div style={{fontSize:14, color:"#555", marginBottom:12}}>→ {card.full}</div>
              <button onClick={()=>speakKo(card.full)}
                style={{background:"#FF6D00", border:"none", borderRadius:50, padding:"8px 20px", color:"white", fontSize:13, fontWeight:700, cursor:"pointer"}}>
                🔊 {vi?"Nghe lại":en?"Listen":"전체 문장 듣기"}
              </button>
            </div>
          )}
          <div style={{background:"#FFF3E0", borderRadius:12, padding:"10px 14px", fontSize:13, color:"#555", textAlign:"center"}}>
            💡 {card.hint}
          </div>
        </div>

        {unitCardRevealed && (
          <div style={{width:"100%", maxWidth:400, background:"white", borderRadius:16, padding:16, marginBottom:16, fontSize:12, color:"#444"}}>
            <div style={{fontWeight:900, color:"#BF360C", marginBottom:8}}>📌 {vi?"Quy tắc":en?"Rule":"핵심 규칙"}</div>
            <div>· <b>받침 없음 + -면</b> — {vi?"nếu (가다→가면)":en?"if (가다→가면)":"조건: 받침 없음 → -면"}</div>
            <div>· <b>받침 있음 + -으면</b> — {vi?"nếu (있다→있으면)":en?"if (있다→있으면)":"조건: 받침 있음 → -으면"}</div>
            <div>· <b>받침 없음 + -니까</b> — {vi?"vì (바쁘다→바쁘니까)":en?"because (구어)":"이유(구어): 받침 없음 → -니까"}</div>
            <div>· <b>받침 있음 + -으니까</b> — {vi?"vì (늦다→늦으니까)":en?"because (받침 있음)":"이유(구어): 받침 있음 → -으니까"}</div>
            <div>· <b>동사 + -는데</b> — {vi?"... mà (nền+nối)":en?"background + connect":"배경 설명 후 연결 → -는데"}</div>
          </div>
        )}

        {!unitCardRevealed ? (
          <button onClick={handleUnit6cSubmit} disabled={!unitCardInput.trim()}
            style={{width:"100%", maxWidth:400, background: unitCardInput.trim()?"linear-gradient(135deg,#FF6D00,#BF360C)":"#ccc", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor: unitCardInput.trim()?"pointer":"default"}}>
            {vi?"Kiểm tra":en?"Check":"확인하기 ✓"}
          </button>
        ) : unitCardIdx < total - 1 ? (
          <button onClick={()=>{ setUnitCardIdx(i=>i+1); setUnitCardInput(""); setUnitCardRevealed(false); }}
            style={{width:"100%", maxWidth:400, background:"linear-gradient(135deg,#FF6D00,#BF360C)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>
            {vi?"Tiếp theo →":en?"Next →":"다음 →"} ({unitCardIdx+2}/{total})
          </button>
        ) : (
          <button onClick={()=>{ setTestAnswers({}); setTestResult(null); setTestQuestions([]); setStep("test6"); }}
            style={{width:"100%", maxWidth:400, background:"linear-gradient(135deg,#FF6B35,#E64A00)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>
            📝 {vi?"Làm bài kiểm tra!":en?"Take the test!":"누적 테스트 시작! (1~6단원) 📝"}
          </button>
        )}
        <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit6b"); }}
          style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>
          ← {vi?"Quay lại":en?"Back":"뒤로 (6B단원)"}
        </button>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // ✅ V183: 누적 테스트 6 — 1·2A·2B·3A·3B·4·5·6단원
  // ════════════════════════════════════════════════════════
  if (step === "test6") {
    const vi = lang?.code === "vi";
    const en = lang?.code === "en";

    // 포함 단원: 4·5·6단원 (3단원 졸업 — 3회 졸업 규칙 적용)
    const TEST6_QUESTIONS = [
      // ── 4단원 복습 (8문항) ──
      { id:"t6_1",  q:"___ 갑니까? (장소)",              answer:"어디",      answers:["어디"],                  hint:"💡 장소 의문대명사" },
      { id:"t6_2",  q:"___ 입니까? (사람)",              answer:"누구",      answers:["누구"],                  hint:"💡 사람 의문대명사" },
      { id:"t6_3",  q:"___ 먹습니까? (사물)",            answer:"무엇을",    answers:["무엇을","뭐"],            hint:"💡 사물 의문대명사" },
      { id:"t6_4",  q:"___ 합니까? (때)",                answer:"언제",      answers:["언제"],                  hint:"💡 시간 의문대명사" },
      { id:"t6_5",  q:"___ 왔습니까? (방법)",            answer:"어떻게",    answers:["어떻게"],                hint:"💡 방법 의문대명사" },
      { id:"t6_6",  q:"이게 ___ 입니까? (값)",           answer:"얼마",      answers:["얼마"],                  hint:"💡 가격 의문대명사" },
      { id:"t6_7",  q:"___ 한국어를 공부합니까? (이유)", answer:"왜",        answers:["왜"],                    hint:"💡 이유 의문대명사" },
      { id:"t6_8",  q:"___ 이 더 큽니까? (비교)",        answer:"어느 것",   answers:["어느 것","어느것"],       hint:"💡 어느 것 = which one" },
      // ── 5단원 복습 (8문항) ──
      { id:"t6_9",  q:"앉다 → ___",                      answer:"앉으세요",  answers:["앉으세요","앉으세요."],  hint:"💡 받침 있음 → 으세요" },
      { id:"t6_10", q:"읽다 → ___",                      answer:"읽으세요",  answers:["읽으세요","읽으세요."],  hint:"💡 받침 있음 → 읽으세요" },
      { id:"t6_11", q:"오다 → ___",                      answer:"오세요",    answers:["오세요","오세요."],      hint:"💡 받침 없음 → 세요" },
      { id:"t6_12", q:"먹다 → ___ (높임)",               answer:"드세요",    answers:["드세요","드세요."],      hint:"💡 먹다 높임말 → 드세요" },
      { id:"t6_13", q:"알다 → ___",                      answer:"아세요",    answers:["아세요","아세요."],      hint:"💡 알다 → ㄹ탈락 → 아세요" },
      { id:"t6_14", q:"천천히 ___. (걷다)",              answer:"걸으세요",  answers:["걸으세요","걸으세요."],  hint:"💡 걷다 → ㄷ불규칙 → 걸으세요" },
      { id:"t6_15", q:"잠깐 기다려 ___. (부탁)",         answer:"주세요",    answers:["주세요","주세요."],      hint:"💡 주다 → 주세요" },
      { id:"t6_16", q:"한국어를 ___. (공부하다)",        answer:"공부하세요",answers:["공부하세요","공부하세요."],hint:"💡 공부하다 → 공부하세요" },
      // ── 6단원 신규 (14문항) ──
      { id:"t6_17", q:"저는 커피를 좋아합니다. ___ 차도 좋아합니다.", answer:"그리고", answers:["그리고"], hint:"💡 그리고 = and (나열)" },
      { id:"t6_18", q:"날씨가 좋습니다. ___ 바람이 붑니다.",          answer:"그런데", answers:["그런데"], hint:"💡 그런데 = but/however (전환)" },
      { id:"t6_19", q:"한국어가 재미있습니다. ___ 어렵습니다.",       answer:"하지만", answers:["하지만"], hint:"💡 하지만 = but (대조)" },
      { id:"t6_20", q:"비가 옵니다. ___ 우산을 가져왔습니다.",        answer:"그래서", answers:["그래서"], hint:"💡 그래서 = so/therefore (결과)" },
      { id:"t6_21", q:"비쌉니다. ___ 삽니다.",                        answer:"그래도", answers:["그래도"], hint:"💡 그래도 = even so (양보)" },
      { id:"t6_22", q:"커피입니까, ___ 차입니까?",                    answer:"아니면", answers:["아니면"], hint:"💡 아니면 = or (선택)" },
      { id:"t6_23", q:"비싸___ 좋습니다. (대조)",                     answer:"지만",   answers:["지만"],   hint:"💡 -지만 = but" },
      { id:"t6_24", q:"배가 고파___ 밥 먹습니다. (이유)",             answer:"서",     answers:["서"],     hint:"💡 고파서 = 이유" },
      { id:"t6_25", q:"밥을 먹___ 커피를 마십니다. (나열)",           answer:"고",     answers:["고"],     hint:"💡 -고 = and (나열)" },
      { id:"t6_26", q:"학교에 가___ 한국어를 배웁니다. (순서)",       answer:"서",     answers:["서"],     hint:"💡 가서 = 순서·이유" },
      { id:"t6_27", q:"날씨가 좋___ 산책합니다. (이유)",              answer:"아서",   answers:["아서"],   hint:"💡 좋다 + 아서 → 좋아서" },
      { id:"t6_28", q:"시간이 있___ 도와드릴게요. (조건)",            answer:"으면",   answers:["으면"],   hint:"💡 있다 + 으면 → 있으면" },
      { id:"t6_29", q:"피곤하___ 일합니다. (대조)",                   answer:"지만",   answers:["지만"],   hint:"💡 -지만 = but" },
      { id:"t6_30", q:"비가 오___ 우산 있습니까? (배경)",             answer:"는데",   answers:["는데"],   hint:"💡 -는데 = 배경 설명" },
    ];

    function gradeTest6() {
      let correct = 0;
      const feedback = TEST6_QUESTIONS.map(q => {
        const userAns = (testAnswers[q.id] || "").trim();
        const ok = (q.answers || [q.answer]).some(a => userAns === a || userAns.replace(/\s/g,"") === a.replace(/\s/g,""));
        if (ok) correct++;
        return {...q, userAns, ok};
      });
      const score = Math.round((correct / TEST6_QUESTIONS.length) * 100);
      const passed = score >= 80;
      if (passed) {
        const newPassed = [...new Set([...unitsPassed, 1,2,3,4,5,6,"2b","3b","6b"])];
        setUnitsPassed(newPassed);
        try { localStorage.setItem("hc_unitsPassed", JSON.stringify(newPassed)); } catch(e) {}
      }
      setTestResult({ score, passed, feedback });
    }

    if (testResult) {
      return (
        <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#FFF8F0,#FFE8D0)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
          <DevJumpPanel />
          <div style={{width:"100%", maxWidth:400}}>
            <div style={{textAlign:"center", marginBottom:20}}>
              <div style={{fontSize:40}}>{testResult.passed?"🎉":"💪"}</div>
              <div style={{fontSize:22, fontWeight:900, color: testResult.passed?"#E65100":"#E64A00", marginBottom:4}}>
                {testResult.score}점 {testResult.passed?"— 통과!":"— 다시 도전!"}
              </div>
              <div style={{fontSize:13, color:"#888"}}>범위: 서술어 1·2A·2B·3A·3B·4·5·6단원 (76문제)</div>
            </div>
            <div style={{background:"white", borderRadius:16, padding:16, marginBottom:16}}>
              {testResult.feedback.map((q,i)=>(
                <div key={i} style={{padding:"8px 0", borderBottom: i<testResult.feedback.length-1?"1px solid #f0f0f0":"none"}}>
                  <div style={{fontSize:13, color:"#333", fontWeight:600}}>{i+1}. {q.q}</div>
                  <div style={{fontSize:12, marginTop:4}}>
                    {q.ok
                      ? <span style={{color:"#E65100", fontWeight:700}}>✅ {q.answer}</span>
                      : <><span style={{color:"#E64A00"}}>❌ 내 답: {q.userAns||"(없음)"}</span> → <span style={{color:"#E65100", fontWeight:700}}>정답: {q.answer}</span></>
                    }
                  </div>
                </div>
              ))}
            </div>
            {testResult.passed ? (
              <button onClick={()=>{setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit7");}}
                style={{width:"100%", background:"linear-gradient(135deg,#FF8F00,#E65100)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>
                {vi?"Tiếp tục — Bài 7! 🚀":en?"Continue — Unit 7! 🚀":"7단원으로 계속하기 🚀"}
              </button>
            ) : (
              <button onClick={()=>{setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setTestResult(null); setTestAnswers({}); setStep("unit6a");}}
                style={{width:"100%", background:"linear-gradient(135deg,#FF8C42,#E64A00)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>
                {vi?"Học lại Bài 6A 🔄":en?"Study Unit 6A again 🔄":"6A단원 처음부터 다시 학습 🔄"}
              </button>
            )}
            <button onClick={()=>{setTestResult(null); setTestAnswers({});}}
              style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>
              ← {vi?"Thử lại":en?"Try again":"다시 풀기"}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#FFF8F0,#FFE8D0)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:400}}>
          <div style={{fontSize:14, fontWeight:900, color:"#E65100", marginBottom:4}}>
            📝 누적 테스트 — 1·2A·2B·3A·3B·4·5·6단원
          </div>
          <div style={{fontSize:12, color:"#aaa", marginBottom:16}}>
            범위: 서술어 1단원 ~ 6단원 전체 (62문제)
          </div>
          {TEST6_QUESTIONS.map((q,i)=>(
            <div key={q.id} style={{background:"white", borderRadius:12, padding:"12px 14px", marginBottom:8}}>
              <div style={{fontSize:13, fontWeight:700, color:"#333", marginBottom:6}}>{i+1}. {q.q}</div>
              <input type="text"
                value={testAnswers[q.id]||""}
                onChange={e=>setTestAnswers(a=>({...a,[q.id]:e.target.value}))}
                onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Tab") e.stopPropagation(); }}
                placeholder={vi?"Điền vào...":en?"Fill in...":"여기에 쓰세요..."}
                style={{width:"100%", border:"2px solid #FFE082", borderRadius:8, padding:"7px 10px", fontSize:14, outline:"none", boxSizing:"border-box"}}
              />
              <div style={{fontSize:12, color:"#C62828", fontWeight:800, marginTop:6}}>{q.hint}</div>
            </div>
          ))}
          <button type="button" onClick={gradeTest6}
            style={{width:"100%", background:"linear-gradient(135deg,#FF6B35,#E64A00)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", marginTop:12}}>
            {vi?"Nộp bài!":en?"Submit!":"채점하기! 📊"}
          </button>
          <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit6b"); }}
            style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>
            ← {vi?"Quay lại":en?"Back":"뒤로 (6B단원 학습)"}
          </button>
        </div>
      </div>
    );
  }

  // ── 7단원: 현재진행 -고 있다 ──
  if (step === "unit7") {
    const vi = lang?.code === "vi";
    const en = lang?.code === "en";
    const UNIT7_CARDS = [
      {
        front: "지금 밥___.",
        base: "먹다",
        blank: "먹고 있습니다",
        full: "지금 밥 먹고 있습니다.",
        hint: vi?"먹다 + ___ + 있어요 → 지금 하는 중":en?"먹다 + ___ + 있어요 → action in progress":"동사 원형 + ___ + 있어요 → 지금 하는 중",
        rule: vi?"동사 기본형 + 고 있어요 = 지금 ~하는 중":en?"Verb stem + 고 있어요 = currently doing ~":"동사 원형 + 고 있어요 = 지금 ~하는 중이에요",
      },
      {
        front: "친구가 전화___.",
        base: "하다 / 걸다",
        blank: "하고 있습니다",
        alts: ["걸고 있어요"],
        full: "친구가 전화하고 있어요. / 전화 걸고 있어요.",
        hint: vi?"하다 + ___ + 있어요 → 지금 진행 중":en?"하다 + ___ → ongoing right now":"하다 → 하+고 있어요 → ___?",
        rule: vi?"하다 → 하+고 있어요":en?"하다 → 하+고 있어요":"하다 → 하+고 있어요",
      },
      {
        front: "아이가 자___.",
        base: "자다",
        blank: "고 있습니다",
        full: "아이가 자고 있습니다.",
        hint: vi?"자다(ngủ): 줄기 끝이 모음 → ___":en?"자다: vowel ending stem → ___":"자다: 줄기 '자' + ___ + 있어요",
        rule: vi?"받침 유무 상관없이 + 고 있어요":en?"고 있어요 attaches regardless of final consonant":"받침 있든 없든 → 동사 원형 + 고 있어요",
      },
      {
        front: "저는 한국어___.",
        base: "공부하다",
        blank: "공부하고 있습니다",
        full: "저는 한국어 공부하고 있습니다.",
        hint: vi?"공부하다 + ___: đang học":en?"공부하다 → currently studying":"공부하다 → 공부하+고 있어요 → ___?",
        rule: vi?"'공부하다' là ví dụ 하다동사":en?"'하다' verbs: noun + 하다 → noun + 하+고 있어요":"명사+하다 동사: 명사+하+고 있어요",
      },
      {
        front: "엄마가 요리___.",
        base: "요리하다",
        blank: "하고 있습니다",
        full: "엄마가 요리하고 있습니다.",
        hint: vi?"요리하다: đang nấu ăn → ___":en?"요리하다 → cooking right now → ___":"요리하다 → 요리하+고 있어요",
        rule: vi?"'지금 ~하는 중이에요'라고도 말해요":en?"You can also say '지금 ~하는 중이에요'":"'지금 ~하는 중이에요' = 같은 뜻이에요",
      },
      {
        front: "비가 ___.",
        base: "오다",
        blank: "오고 있습니다",
        full: "비가 오고 있습니다.",
        hint: vi?"오다(đến/rơi): 줄기 '오' + ___":en?"오다: stem '오' + ___ + 있어요":"비가 내리고 있어요 = 비가 오+고 있어요",
        rule: vi?"오다: 오+고 있어요 → 지금 비가 내리고 있어요":en?"비가 오고 있어요 = It's raining right now":"오다 → 오+고 있어요 = 지금 비가 내리는 중이에요",
      },
    ];
    const card = UNIT7_CARDS[unitCardIdx];
    const total = UNIT7_CARDS.length;
    return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#E8F5E9,#C8E6C9)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:400}}>
          <div style={{fontSize:13, fontWeight:900, color:"#2E7D32", marginBottom:4}}>🎬 7단원 — 현재진행 (-고 있어요)</div>
          <div style={{fontSize:11, color:"#aaa", marginBottom:12}}>지금 하는 동작을 말할 때 써요</div>
          {/* 진행 바 */}
          <div style={{display:"flex", gap:4, marginBottom:16}}>
            {UNIT7_CARDS.map((_,i)=>(
              <div key={i} style={{flex:1, height:4, borderRadius:2, background: i<=unitCardIdx?"#2E7D32":"#ddd"}} />
            ))}
          </div>
          {/* 카드 */}
          <div style={{background:"white", borderRadius:20, padding:"28px 20px", boxShadow:"0 4px 20px rgba(46,125,50,.12)", marginBottom:16, textAlign:"center"}}>
            {card.base && (
              <div style={{display:"inline-block", background:"#FFF3E0", border:"1.5px solid #FFB74D", borderRadius:20, padding:"3px 12px", fontSize:12, fontWeight:700, color:"#E65100", marginBottom:10}}>
                기본형: {card.base}
              </div>
            )}
            <div style={{fontSize:22, fontWeight:900, color:"#1B5E20", marginBottom:16, lineHeight:1.4}}>
              {card.front.replace("___", "　　　")}
            </div>
            <input
              type="text"
              value={unitCardInput}
              onChange={e=>setUnitCardInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Tab") e.stopPropagation(); }}
              placeholder={vi?"Điền vào...":en?"Type here...":"빈칸을 채워보세요..."}
              style={{width:"100%", border:"2px solid #A5D6A7", borderRadius:12, padding:"10px 14px", fontSize:15, outline:"none", boxSizing:"border-box", textAlign:"center", marginBottom:12}}
            />
            <button type="button" onClick={()=>setUnitCardRevealed(true)}
              style={{background:"linear-gradient(135deg,#43A047,#2E7D32)", color:"white", border:"none", borderRadius:50, padding:"10px 28px", fontSize:14, fontWeight:900, cursor:"pointer"}}>
              {vi?"Xem đáp án":en?"Show answer":"정답 보기 👀"}
            </button>
            {unitCardRevealed && (
              <div style={{marginTop:14}}>
                <div style={{fontSize:18, fontWeight:900, color:"#2E7D32", marginBottom:6}}>
                  ✅ {card.blank.includes("고 있어요")
                    ? <>{card.blank.replace("고 있어요","")}<span style={{color:"#C62828"}}>고 있어요</span></>
                    : card.blank}
                </div>
                {card.alts && (
                  <div style={{fontSize:13, color:"#888", marginBottom:6}}>
                    또는: {card.alts.map((a,i)=>(
                      <span key={i} style={{color:"#555", fontWeight:700}}>
                        {a.includes("고 있어요")
                          ? <>{a.replace("고 있어요","")}<span style={{color:"#C62828"}}>고 있어요</span></>
                          : a}
                        {i < card.alts.length-1 ? " / " : ""}
                      </span>
                    ))}
                  </div>
                )}
                <div style={{fontSize:14, color:"#555", marginBottom:8}}>→ {card.full}</div>
                <div style={{fontSize:12, color:"#888", background:"#F1F8E9", borderRadius:8, padding:"8px 12px", marginBottom:8}}>{card.hint}</div>
                <div style={{fontSize:12, color:"#2E7D32", fontWeight:700, background:"#E8F5E9", borderRadius:8, padding:"8px 12px"}}>
                  📌 {card.rule}
                </div>
              </div>
            )}
          </div>
          {/* 이전/다음 */}
          <div style={{display:"flex", gap:8}}>
            {unitCardIdx > 0 && (
              <button onClick={()=>{ setUnitCardIdx(i=>i-1); setUnitCardInput(""); setUnitCardRevealed(false); }}
                style={{flex:1, background:"white", border:"2px solid #A5D6A7", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:700, color:"#2E7D32", cursor:"pointer"}}>
                ← {vi?"Trước":en?"Prev":"이전"}
              </button>
            )}
            {unitCardIdx < total - 1 ? (
              <button onClick={()=>{ setUnitCardIdx(i=>i+1); setUnitCardInput(""); setUnitCardRevealed(false); }}
                style={{flex:1, background:"linear-gradient(135deg,#43A047,#2E7D32)", color:"white", border:"none", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>
                {vi?"Tiếp theo →":en?"Next →":"다음 카드 →"}
              </button>
            ) : (
              <button onClick={()=>{ setTestAnswers({}); setTestResult(null); setTestQuestions([]); setStep("test7"); }}
                style={{flex:1, background:"linear-gradient(135deg,#FF8F00,#E65100)", color:"white", border:"none", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>
                {vi?"Làm bài kiểm tra! 📝":en?"Take Test! 📝":"누적 테스트 풀기! 📝"}
              </button>
            )}
          </div>
          <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("test6"); }}
            style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>
            ← {vi?"Quay lại":en?"Back":"뒤로 (6단원 테스트)"}
          </button>
        </div>
      </div>
    );
  }

  // ── 누적 테스트 7 ──
  if (step === "test7") {
    const vi = lang?.code === "vi";
    const en = lang?.code === "en";
    // 포함 단원: 5·6·7단원 (4단원 졸업 — 3회 졸업 규칙 적용)
    const TEST7_QUESTIONS = [
      // ── 5단원 복습 (8문항) ──
      { id:"t7_1",  q:"앉다 → ___",                       answer:"앉으세요",  answers:["앉으세요","앉으세요."],   hint:"💡 받침 있음 → 으세요" },
      { id:"t7_2",  q:"읽다 → ___",                       answer:"읽으세요",  answers:["읽으세요","읽으세요."],   hint:"💡 받침 있음 → 읽으세요" },
      { id:"t7_3",  q:"오다 → ___",                       answer:"오세요",    answers:["오세요","오세요."],       hint:"💡 받침 없음 → 세요" },
      { id:"t7_4",  q:"먹다 → ___ (높임)",                answer:"드세요",    answers:["드세요","드세요."],       hint:"💡 먹다 높임말 → 드세요" },
      { id:"t7_5",  q:"알다 → ___",                       answer:"아세요",    answers:["아세요","아세요."],       hint:"💡 알다 → ㄹ탈락 → 아세요" },
      { id:"t7_6",  q:"천천히 ___. (걷다)",               answer:"걸으세요",  answers:["걸으세요","걸으세요."],   hint:"💡 걷다 → ㄷ불규칙 → 걸으세요" },
      { id:"t7_7",  q:"잠깐 기다려 ___. (부탁)",          answer:"주세요",    answers:["주세요","주세요."],       hint:"💡 주다 → 주세요" },
      { id:"t7_8",  q:"이 음식을 ___. (먹다·높임)",       answer:"드세요",    answers:["드세요","드세요."],       hint:"💡 먹다 높임말 → 드세요" },
      // ── 6단원 복습 (8문항) ──
      { id:"t7_9",  q:"비싸___ 좋습니다. (대조)",         answer:"지만",      answers:["지만"],                   hint:"💡 -지만 = but" },
      { id:"t7_10", q:"배가 고파___ 밥 먹습니다. (이유)", answer:"서",        answers:["서"],                     hint:"💡 이유 → 고파서" },
      { id:"t7_11", q:"한국어가 재미있___ 어렵습니다.",   answer:"지만",      answers:["지만"],                   hint:"💡 -지만 = but" },
      { id:"t7_12", q:"비가 오___ 우산 있습니까? (배경)", answer:"는데",      answers:["는데"],                   hint:"💡 -는데 = 배경" },
      { id:"t7_13", q:"밥을 먹___ 커피를 마십니다.",      answer:"고",        answers:["고"],                     hint:"💡 나열 → -고" },
      { id:"t7_14", q:"날씨가 좋___ 산책합니다. (이유)",  answer:"아서",      answers:["아서"],                   hint:"💡 좋다 + 아서 → 좋아서" },
      { id:"t7_15", q:"피곤하___ 일합니다. (대조)",       answer:"지만",      answers:["지만"],                   hint:"💡 -지만 = but" },
      { id:"t7_16", q:"시간이 있___ 도와드릴게요. (조건)",answer:"으면",      answers:["으면"],                   hint:"💡 있으면 = 조건" },
      // ── 7단원 신규 (14문항) ──
      { id:"t7_17", q:"지금 밥 먹___ 있습니다.",          answer:"고",        answers:["고"],                     hint:"💡 동사 + 고 있다" },
      { id:"t7_18", q:"친구가 전화하___ 있습니다.",       answer:"고",        answers:["고"],                     hint:"💡 하다 계열 + 고" },
      { id:"t7_19", q:"아이가 자고 ___.",                 answer:"있습니다",  answers:["있습니다","있습니다."],   hint:"💡 -고 있___" },
      { id:"t7_20", q:"저는 한국어 공부하___ 있습니다.",  answer:"고",        answers:["고"],                     hint:"💡 공부하다 + 고" },
      { id:"t7_21", q:"엄마가 요리하고 ___.",             answer:"있습니다",  answers:["있습니다","있습니다."],   hint:"💡 -고 있___" },
      { id:"t7_22", q:"비가 오고 ___.",                   answer:"있습니다",  answers:["있습니다","있습니다."],   hint:"💡 -고 있___" },
      { id:"t7_23", q:"지금 뭐 하___ 있습니까?",          answer:"고",        answers:["고"],                     hint:"💡 동사 + 고 있다" },
      { id:"t7_24", q:"동생이 음악 듣___ 있습니다.",      answer:"고",        answers:["고"],                     hint:"💡 듣다 + 고" },
      { id:"t7_25", q:"저는 지금 일하고 ___.",            answer:"있습니다",  answers:["있습니다","있습니다."],   hint:"💡 -고 있___" },
      { id:"t7_26", q:"선생님이 책을 읽___ 있습니다.",    answer:"고",        answers:["고"],                     hint:"💡 읽다 + 고" },
      { id:"t7_27", q:"지금 눈이 오___ 있습니다.",        answer:"고",        answers:["고"],                     hint:"💡 오다 + 고" },
      { id:"t7_28", q:"형이 지금 운동하___ 있습니다.",    answer:"고",        answers:["고"],                     hint:"💡 운동하다 + 고" },
      { id:"t7_29", q:"선생님이 수업을 가르치___ 있습니다.", answer:"고",     answers:["고"],                     hint:"💡 가르치다 + 고" },
      { id:"t7_30", q:"저는 지금 영화를 보___ 있습니다.", answer:"고",        answers:["고"],                     hint:"💡 보다 + 고" },
    ];

    function gradeTest7() {
      let correct = 0;
      const feedback = TEST7_QUESTIONS.map(q=>{
        const userAns = (testAnswers[q.id]||"").trim();
        const acceptList = q.answers || [q.answer];
        const ok = acceptList.some(a => a.toLowerCase() === userAns.toLowerCase());
        if(ok) correct++;
        return { q: q.q, answer: q.answer, userAns, ok };
      });
      const score = Math.round((correct / TEST7_QUESTIONS.length) * 100);
      const passed = score >= 80;
      setTestResult({ score, passed, correct, total: TEST7_QUESTIONS.length, feedback });
    }

    if (testResult) {
      return (
        <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#E8F5E9,#C8E6C9)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
          <DevJumpPanel />
          <div style={{width:"100%", maxWidth:400}}>
            <div style={{background:"white", borderRadius:20, padding:24, textAlign:"center", marginBottom:16, boxShadow:"0 4px 20px rgba(46,125,50,.12)"}}>
              <div style={{fontSize:48, marginBottom:8}}>{testResult.passed?"🎉":"💪"}</div>
              <div style={{fontSize:22, fontWeight:900, color: testResult.passed?"#2E7D32":"#E65100"}}>
                {testResult.score}점
              </div>
              <div style={{fontSize:14, color:"#666", marginTop:4}}>
                {testResult.correct} / {testResult.total} 정답
              </div>
              <div style={{fontSize:13, color: testResult.passed?"#2E7D32":"#E65100", fontWeight:700, marginTop:8}}>
                {testResult.passed
                  ? (vi?"Xuất sắc! Tiếp tục bài 8 🚀":en?"Excellent! On to Unit 8 🚀":"합격! 🎉 8단원으로 가요!")
                  : (vi?"Cần ôn lại. Học lại bài 7 nhé!":en?"Need review. Study Unit 7 again!":"80점 이상이 되어야 다음 단원으로 갈 수 있어요")}
              </div>
            </div>
            <div style={{background:"white", borderRadius:16, padding:16, marginBottom:16}}>
              {testResult.feedback.map((q,i)=>(
                <div key={i} style={{padding:"8px 0", borderBottom: i<testResult.feedback.length-1?"1px solid #f0f0f0":"none"}}>
                  <div style={{fontSize:13, color:"#333", fontWeight:600}}>{i+1}. {q.q}</div>
                  <div style={{fontSize:12, marginTop:4}}>
                    {q.ok
                      ? <span style={{color:"#2E7D32", fontWeight:700}}>✅ {q.answer}</span>
                      : <><span style={{color:"#E64A00"}}>❌ 내 답: {q.userAns||"(없음)"}</span> → <span style={{color:"#2E7D32", fontWeight:700}}>정답: {q.answer}</span></>
                    }
                  </div>
                </div>
              ))}
            </div>
            {testResult.passed ? (
              <button onClick={()=>{setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit8");}}
                style={{width:"100%", background:"linear-gradient(135deg,#FF8F00,#E65100)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>
                {vi?"Tiếp tục — Bài 8! 🚀":en?"Continue — Unit 8! 🚀":"8단원으로 계속하기 🚀"}
              </button>
            ) : (
              <button onClick={()=>{setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setTestResult(null); setTestAnswers({}); setStep("unit7");}}
                style={{width:"100%", background:"linear-gradient(135deg,#43A047,#2E7D32)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>
                {vi?"Học lại Bài 7 🔄":en?"Study Unit 7 again 🔄":"7단원 처음부터 다시 학습 🔄"}
              </button>
            )}
            <button onClick={()=>{ setTestResult(null); setTestAnswers({}); }}
              style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>
              ← {vi?"Thử lại":en?"Try again":"다시 풀기"}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#E8F5E9,#C8E6C9)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:400}}>
          <div style={{fontSize:14, fontWeight:900, color:"#2E7D32", marginBottom:4}}>
            📝 누적 테스트 — 1·2A·2B·3A·3B·4·5·6·7단원
          </div>
          <div style={{fontSize:12, color:"#aaa", marginBottom:16}}>
            범위: 서술어 1단원 ~ 7단원 전체 (90문제)
          </div>
          {TEST7_QUESTIONS.map((q,i)=>(
            <div key={q.id} style={{background:"white", borderRadius:12, padding:"12px 14px", marginBottom:8}}>
              <div style={{fontSize:13, fontWeight:700, color:"#333", marginBottom:6}}>{i+1}. {q.q}</div>
              <input type="text"
                value={testAnswers[q.id]||""}
                onChange={e=>setTestAnswers(a=>({...a,[q.id]:e.target.value}))}
                onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Tab") e.stopPropagation(); }}
                placeholder={vi?"Điền vào...":en?"Fill in...":"여기에 쓰세요..."}
                style={{width:"100%", border:"2px solid #A5D6A7", borderRadius:8, padding:"7px 10px", fontSize:14, outline:"none", boxSizing:"border-box"}}
              />
              <div style={{fontSize:12, color:"#C62828", fontWeight:800, marginTop:6}}>{q.hint}</div>
            </div>
          ))}
          <button type="button" onClick={gradeTest7}
            style={{width:"100%", background:"linear-gradient(135deg,#43A047,#2E7D32)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", marginTop:12}}>
            {vi?"Nộp bài!":en?"Submit!":"채점하기! 📊"}
          </button>
          <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit7"); }}
            style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>
            ← {vi?"Quay lại":en?"Back":"뒤로 (7단원 학습)"}
          </button>
        </div>
      </div>
    );
  }

  // ── 8단원: 청유 ~ㅂ시다 / ㄹ까요 / ㄹ래요 ──
  if (step === "unit8") {
    const vi = lang?.code === "vi"; const en = lang?.code === "en";
    const UNIT8_CARDS = [
      { front:"같이 밥 먹___. (함께 하자)", blank:"읍시다", full:"같이 밥 먹읍시다.", hint:"💡 먹다 → 받침 있음 → 읍시다" },
      { front:"빨리 ___. (가자)", blank:"갑시다", full:"빨리 갑시다.", hint:"💡 가다 → 받침 없음 → ㅂ시다" },
      { front:"영화 볼___? (제안·의향)", blank:"까요", full:"영화 볼까요?", hint:"💡 -(으)ㄹ까요? 제안" },
      { front:"뭐 먹을___? (의향 물음)", blank:"까요", full:"뭐 먹을까요?", hint:"💡 먹다 → 먹을까요?" },
      { front:"같이 공부할___? (함께 하자)", blank:"래요", full:"같이 공부할래요?", hint:"💡 -(으)ㄹ래요? 의지·권유" },
      { front:"커피 마실___? (권유)", blank:"래요", full:"커피 마실래요?", hint:"💡 마시다 → 마실래요?" },
    ];
    const card = UNIT8_CARDS[unitCardIdx];
    const C = { bg:"linear-gradient(150deg,#E3F2FD,#BBDEFB)", accent:"#1565C0", border:"#90CAF9" };
    return (
      <div style={{minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:400}}>
          <div style={{fontSize:13, fontWeight:900, color:C.accent, marginBottom:4}}>
            📚 {vi?"Bài 8 — Cùng nhau (~ㅂ시다 / ~ㄹ까요 / ~ㄹ래요)":en?"Unit 8 — Let's / Shall we / Want to?":"8단원 — 청유 (~ㅂ시다 / ~ㄹ까요 / ~ㄹ래요)"}
          </div>
          <div style={{fontSize:12, color:"#555", background:"#E3F2FD", borderRadius:10, padding:"10px 14px", marginBottom:12, lineHeight:1.7}}>
            {vi ? <>📌 <b>~ㅂ시다</b>: "Cùng nhau...!" (đề nghị trang trọng)<br/><b>~ㄹ까요?</b>: "Chúng ta...nhé?" (hỏi ý kiến)<br/><b>~ㄹ래요?</b>: "Bạn có muốn...không?" (hỏi ý muốn)</> : en ? <>📌 <b>~ㅂ시다</b>: "Let's...!" (formal proposal)<br/><b>~ㄹ까요?</b>: "Shall we...?" (seeking opinion)<br/><b>~ㄹ래요?</b>: "Do you want to...?" (asking preference)</> : <>📌 <b>~ㅂ시다</b>: "함께 하자!"는 격식 청유<br/><b>~ㄹ까요?</b>: 상대 의향을 묻는 제안<br/><b>~ㄹ래요?</b>: 상대 의지·선호를 묻는 권유</>}
          </div>
          <div style={{display:"flex", gap:3, marginBottom:16}}>
            {UNIT8_CARDS.map((_,i) => <div key={i} style={{flex:1, height:4, borderRadius:2, background:i<=unitCardIdx?C.accent:"#ddd"}} />)}
          </div>
          <div style={{background:"white", borderRadius:20, padding:"20px", boxShadow:"0 4px 20px rgba(21,101,192,.12)", marginBottom:16}}>
            <div style={{fontSize:18, fontWeight:900, color:"#333", marginBottom:12, lineHeight:1.5}}>{card.front}</div>
            <input type="text" value={unitCardInput}
              onChange={e=>{ if(!unitCardRevealed) setUnitCardInput(e.target.value); }}
              onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Tab") e.stopPropagation(); }}
              readOnly={unitCardRevealed}
              placeholder="..." style={{width:"100%", border:`2px solid ${unitCardRevealed?(unitCardInput.trim()===card.blank||unitCardInput.trim()===card.full?"#2E7D32":"#C62828"):"#90CAF9"}`, borderRadius:10, padding:"10px 14px", fontSize:15, fontWeight:700, outline:"none", boxSizing:"border-box", color:unitCardRevealed?(unitCardInput.trim()===card.blank||unitCardInput.trim()===card.full?"#2E7D32":"#C62828"):"#333"}} />
            {unitCardRevealed && (
              <div style={{marginTop:10, fontSize:13, color:C.accent, fontWeight:800}}>✅ {card.full}</div>
            )}
            <div style={{fontSize:12, color:"#C62828", fontWeight:800, marginTop:8}}>{card.hint}</div>
            {!unitCardRevealed && (
              <button onClick={()=>setUnitCardRevealed(true)} style={{width:"100%", marginTop:12, background:`linear-gradient(135deg,${C.accent},#0D47A1)`, color:"white", border:"none", borderRadius:50, padding:"11px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>
                {vi?"Xem đáp án 👀":en?"Show answer 👀":"정답 보기 👀"}
              </button>
            )}
          </div>
          <div style={{display:"flex", gap:8}}>
            {unitCardIdx > 0 && <button onClick={()=>{ setUnitCardIdx(i=>i-1); setUnitCardInput(""); setUnitCardRevealed(false); }} style={{flex:1, background:"white", border:`2px solid ${C.border}`, borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:700, color:C.accent, cursor:"pointer"}}>← {vi?"Trước":en?"Prev":"이전"}</button>}
            {unitCardIdx < UNIT8_CARDS.length-1
              ? <button onClick={()=>{ setUnitCardIdx(i=>i+1); setUnitCardInput(""); setUnitCardRevealed(false); }} style={{flex:1, background:`linear-gradient(135deg,${C.accent},#0D47A1)`, color:"white", border:"none", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>{vi?"Tiếp →":en?"Next →":"다음 카드 →"}</button>
              : <button onClick={()=>{ setTestAnswers({}); setTestResult(null); setTestQuestions([]); setStep("test8"); }} style={{flex:1, background:"linear-gradient(135deg,#FF8F00,#E65100)", color:"white", border:"none", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>{vi?"Kiểm tra! 📝":en?"Take test! 📝":"테스트하기! 📝"}</button>}
          </div>
          <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("test7"); }} style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>← {vi?"Quay lại":en?"Back":"뒤로 (7단원 테스트)"}</button>
        </div>
      </div>
    );
  }

  // ── 테스트8: 1~8단원 누적 ──
  if (step === "test8") {
    const vi = lang?.code === "vi"; const en = lang?.code === "en";
    // 포함 단원: 6·7·8단원 (5단원 졸업 — 3회 졸업 규칙 적용)
    const TEST8_Q = [
      // ── 6단원 복습 (8문항) ──
      { id:"t8_1",  q:"비싸___ 좋습니다. (대조)",          answer:"지만",     answers:["지만"],                   hint:"💡 -지만 = but" },
      { id:"t8_2",  q:"배가 고파___ 밥 먹습니다. (이유)",  answer:"서",       answers:["서"],                     hint:"💡 이유 → 고파서" },
      { id:"t8_3",  q:"비가 오___ 우산 있습니까? (배경)",  answer:"는데",     answers:["는데"],                   hint:"💡 -는데 = 배경" },
      { id:"t8_4",  q:"밥을 먹___ 커피를 마십니다. (나열)",answer:"고",       answers:["고"],                     hint:"💡 나열 → -고" },
      { id:"t8_5",  q:"날씨가 좋___ 산책합니다. (이유)",   answer:"아서",     answers:["아서"],                   hint:"💡 좋다 + 아서 → 좋아서" },
      { id:"t8_6",  q:"시간이 있___ 도와드릴게요. (조건)", answer:"으면",     answers:["으면"],                   hint:"💡 있으면 = 조건" },
      { id:"t8_7",  q:"피곤하___ 일합니다. (대조)",        answer:"지만",     answers:["지만"],                   hint:"💡 -지만 = but" },
      { id:"t8_8",  q:"한국어가 재미있___ 어렵습니다.",    answer:"지만",     answers:["지만"],                   hint:"💡 -지만 = but" },
      // ── 7단원 복습 (8문항) ──
      { id:"t8_9",  q:"지금 밥 먹___ 있습니다.",           answer:"고",       answers:["고"],                     hint:"💡 동사 + 고 있다" },
      { id:"t8_10", q:"아이가 자고 ___.",                  answer:"있습니다", answers:["있습니다","있습니다."],   hint:"💡 -고 있___" },
      { id:"t8_11", q:"저는 한국어 공부하___ 있습니다.",   answer:"고",       answers:["고"],                     hint:"💡 공부하다 + 고" },
      { id:"t8_12", q:"엄마가 요리하고 ___.",              answer:"있습니다", answers:["있습니다","있습니다."],   hint:"💡 -고 있___" },
      { id:"t8_13", q:"동생이 음악 듣___ 있습니다.",       answer:"고",       answers:["고"],                     hint:"💡 듣다 + 고" },
      { id:"t8_14", q:"지금 눈이 오___ 있습니다.",         answer:"고",       answers:["고"],                     hint:"💡 오다 + 고" },
      { id:"t8_15", q:"선생님이 책을 읽___ 있습니다.",     answer:"고",       answers:["고"],                     hint:"💡 읽다 + 고" },
      { id:"t8_16", q:"저는 지금 영화를 보___ 있습니다.",  answer:"고",       answers:["고"],                     hint:"💡 보다 + 고" },
      // ── 8단원 신규 (14문항) ──
      { id:"t8_17", q:"같이 밥 먹___. (함께·격식)",        answer:"읍시다",   answers:["읍시다","읍시다."],       hint:"💡 먹다 → 받침+읍시다" },
      { id:"t8_18", q:"빨리 ___. (가자·격식)",              answer:"갑시다",   answers:["갑시다","갑시다."],       hint:"💡 가다 → ㅂ시다" },
      { id:"t8_19", q:"영화 볼___? (제안·의향)",            answer:"까요",     answers:["까요","까요?"],           hint:"💡 -(으)ㄹ까요?" },
      { id:"t8_20", q:"뭐 먹을___? (의향)",                 answer:"까요",     answers:["까요","까요?"],           hint:"💡 먹다 → 먹을까요?" },
      { id:"t8_21", q:"같이 공부할___? (권유)",             answer:"래요",     answers:["래요","래요?"],           hint:"💡 -(으)ㄹ래요?" },
      { id:"t8_22", q:"커피 마실___? (권유)",               answer:"래요",     answers:["래요","래요?"],           hint:"💡 마시다 → 마실래요?" },
      { id:"t8_23", q:"같이 걸을___? (제안)",               answer:"까요",     answers:["까요","까요?"],           hint:"💡 걷다 → 걸을까요?" },
      { id:"t8_24", q:"내일 만날___? (의향)",               answer:"래요",     answers:["래요","래요?"],           hint:"💡 만나다 → 만날래요?" },
      { id:"t8_25", q:"함께 청소합___. (격식 청유)",        answer:"시다",     answers:["시다","시다."],           hint:"💡 하다 → 합시다" },
      { id:"t8_26", q:"도서관에서 공부합___. (격식 청유)",  answer:"시다",     answers:["시다","시다."],           hint:"💡 합니다 → 합시다" },
      { id:"t8_27", q:"같이 운동할___? (권유)",             answer:"래요",     answers:["래요","래요?"],           hint:"💡 -(으)ㄹ래요?" },
      { id:"t8_28", q:"어디서 먹을___? (장소 제안)",        answer:"까요",     answers:["까요","까요?"],           hint:"💡 -(으)ㄹ까요?" },
      { id:"t8_29", q:"같이 여행 갑___. (격식 청유)",       answer:"시다",     answers:["시다","시다."],           hint:"💡 가다 → 갑시다" },
      { id:"t8_30", q:"뭘 마실___? (의향)",                 answer:"래요",     answers:["래요","래요?"],           hint:"💡 -(으)ㄹ래요?" },
    ];;
    function gradeTest8() {
      let ok=0;
      TEST8_Q.forEach(q=>{ const v=(testAnswers[q.id]||"").trim(); if(q.answers.includes(v)) ok++; });
      setTestResult({score:ok, total:TEST8_Q.length, pass: ok/TEST8_Q.length>=0.8});
    }
    if (testResult) return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#E3F2FD,#BBDEFB)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px 16px"}}>
        <DevJumpPanel />
        <div style={{background:"white", borderRadius:24, padding:"32px 24px", maxWidth:360, width:"100%", textAlign:"center", boxShadow:"0 4px 24px rgba(21,101,192,.12)"}}>
          <div style={{fontSize:48, marginBottom:8}}>{testResult.pass?"🎉":"💪"}</div>
          <div style={{fontSize:22, fontWeight:900, color:testResult.pass?"#1565C0":"#E65100", marginBottom:8}}>
            {testResult.score}/{testResult.total}점
          </div>
          <div style={{fontSize:14, color:"#555", marginBottom:20}}>
            {testResult.pass ? (vi?"Tuyệt vời! Sang bài 9!":en?"Excellent! On to Unit 9!":"훌륭해요! 9단원으로 고고!") : (vi?"Thử lại nhé!":en?"Try again!":"다시 한번 도전해요!")}
          </div>
          {testResult.pass
            ? <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setTestResult(null); setTestAnswers({}); setStep("unit9"); }} style={{width:"100%", background:"linear-gradient(135deg,#FF8F00,#E65100)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>{vi?"Tiếp — Bài 9! 🚀":en?"Next — Unit 9! 🚀":"9단원으로! 🚀"}</button>
            : <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setTestResult(null); setTestAnswers({}); setStep("unit8"); }} style={{width:"100%", background:"linear-gradient(135deg,#1565C0,#0D47A1)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>{vi?"Học lại Bài 8 🔄":en?"Retry Unit 8 🔄":"8단원 다시 학습 🔄"}</button>}
          <button onClick={()=>{ setTestResult(null); setTestAnswers({}); }} style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>← {vi?"Thử lại":en?"Try again":"다시 풀기"}</button>
        </div>
      </div>
    );
    return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#E3F2FD,#BBDEFB)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:400}}>
          <div style={{fontSize:14, fontWeight:900, color:"#1565C0", marginBottom:4}}>📝 누적 테스트 — 1~8단원</div>
          <div style={{fontSize:12, color:"#aaa", marginBottom:16}}>범위: 이다·있다·형용사·의문대명사·세요·연결·진행·청유 (78문제)</div>
          {TEST8_Q.map((q,i) => (
            <div key={q.id} style={{background:"white", borderRadius:12, padding:"12px 14px", marginBottom:8}}>
              <div style={{fontSize:13, fontWeight:700, color:"#333", marginBottom:6}}>{i+1}. {q.q}</div>
              <input type="text" value={testAnswers[q.id]||""} onChange={e=>setTestAnswers(a=>({...a,[q.id]:e.target.value}))} onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Tab") e.stopPropagation(); }} placeholder={vi?"Điền vào...":en?"Fill in...":"여기에 쓰세요..."} style={{width:"100%", border:"2px solid #90CAF9", borderRadius:8, padding:"7px 10px", fontSize:14, outline:"none", boxSizing:"border-box"}} />
              <div style={{fontSize:12, color:"#C62828", fontWeight:800, marginTop:6}}>{q.hint}</div>
            </div>
          ))}
          <button type="button" onClick={gradeTest8} style={{width:"100%", background:"linear-gradient(135deg,#1565C0,#0D47A1)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", marginTop:12}}>{vi?"Nộp bài!":en?"Submit!":"채점하기! 📊"}</button>
          <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit8"); }} style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>← {vi?"Quay lại":en?"Back":"뒤로 (8단원 학습)"}</button>
        </div>
      </div>
    );
  }

  // ── 9단원: 능력·가능 -(으)ㄹ 수 있다/없다 ──
  if (step === "unit9") {
    const vi = lang?.code === "vi"; const en = lang?.code === "en";
    const UNIT9_CARDS = [
      { front:"저는 한국어를 말할 ___ ___. (가능)", blank:"수 있습니다", full:"저는 한국어를 말할 수 있습니다.", hint:"💡 동사+ㄹ 수 있다 = 할 수 있음" },
      { front:"저는 수영을 할 ___ ___. (불가능)", blank:"수 없습니다", full:"저는 수영을 할 수 없습니다.", hint:"💡 동사+ㄹ 수 없다 = 못함" },
      { front:"이 음식을 먹을 ___ ___? (가능 여부)", blank:"수 있습니까", full:"이 음식을 먹을 수 있습니까?", hint:"💡 먹다 → 먹을 수 있다" },
      { front:"저는 피아노를 칠 ___ ___. (가능)", blank:"수 있습니다", full:"저는 피아노를 칠 수 있습니다.", hint:"💡 치다 → 칠 수 있다" },
      { front:"오늘 만날 ___ ___? (가능 여부)", blank:"수 있습니까", full:"오늘 만날 수 있습니까?", hint:"💡 만나다 → 만날 수 있다" },
      { front:"저는 운전을 할 ___ ___. (불가능)", blank:"수 없습니다", full:"저는 운전을 할 수 없습니다.", hint:"💡 할 수 없다 = 못함" },
    ];
    const card = UNIT9_CARDS[unitCardIdx];
    const C = { bg:"linear-gradient(150deg,#F3E5F5,#E1BEE7)", accent:"#6A1B9A", border:"#CE93D8" };
    return (
      <div style={{minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:400}}>
          <div style={{fontSize:13, fontWeight:900, color:C.accent, marginBottom:4}}>
            📚 {vi?"Bài 9 — Có thể / Không thể (-(으)ㄹ 수 있다/없다)":en?"Unit 9 — Can / Cannot (-(으)ㄹ 수 있다/없다)":"9단원 — 능력·가능 (-(으)ㄹ 수 있다/없다)"}
          </div>
          <div style={{fontSize:12, color:"#555", background:"#F3E5F5", borderRadius:10, padding:"10px 14px", marginBottom:12, lineHeight:1.7}}>
            {vi ? <>📌 동사 + <b>(으)ㄹ 수 있다</b> = có thể làm<br/>동사 + <b>(으)ㄹ 수 없다</b> = không thể làm<br/>받침 있음 → <b>을 수</b> / 없음 → <b>ㄹ 수</b></> : en ? <>📌 Verb + <b>(으)ㄹ 수 있다</b> = can do<br/>Verb + <b>(으)ㄹ 수 없다</b> = cannot do<br/>With batchim → <b>을 수</b> / Without → <b>ㄹ 수</b></> : <>📌 동사 + <b>(으)ㄹ 수 있다</b> = ~할 수 있어요<br/>동사 + <b>(으)ㄹ 수 없다</b> = ~할 수 없어요<br/>받침 있음 → <b>을 수</b> / 없음 → <b>ㄹ 수</b></>}
          </div>
          <div style={{display:"flex", gap:3, marginBottom:16}}>
            {UNIT9_CARDS.map((_,i) => <div key={i} style={{flex:1, height:4, borderRadius:2, background:i<=unitCardIdx?C.accent:"#ddd"}} />)}
          </div>
          <div style={{background:"white", borderRadius:20, padding:"20px", boxShadow:"0 4px 20px rgba(106,27,154,.12)", marginBottom:16}}>
            <div style={{fontSize:18, fontWeight:900, color:"#333", marginBottom:12, lineHeight:1.5}}>{card.front}</div>
            <input type="text" value={unitCardInput} onChange={e=>{ if(!unitCardRevealed) setUnitCardInput(e.target.value); }} onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Tab") e.stopPropagation(); }} readOnly={unitCardRevealed} placeholder="..." style={{width:"100%", border:`2px solid ${unitCardRevealed?(unitCardInput.trim()===card.blank||unitCardInput.trim()===card.full?"#2E7D32":"#C62828"):"#CE93D8"}`, borderRadius:10, padding:"10px 14px", fontSize:15, fontWeight:700, outline:"none", boxSizing:"border-box", color:unitCardRevealed?(unitCardInput.trim()===card.blank||unitCardInput.trim()===card.full?"#2E7D32":"#C62828"):"#333"}} />
            {unitCardRevealed && <div style={{marginTop:10, fontSize:13, color:C.accent, fontWeight:800}}>✅ {card.full}</div>}
            <div style={{fontSize:12, color:"#C62828", fontWeight:800, marginTop:8}}>{card.hint}</div>
            {!unitCardRevealed && <button onClick={()=>setUnitCardRevealed(true)} style={{width:"100%", marginTop:12, background:`linear-gradient(135deg,${C.accent},#4A148C)`, color:"white", border:"none", borderRadius:50, padding:"11px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>{vi?"Xem đáp án 👀":en?"Show answer 👀":"정답 보기 👀"}</button>}
          </div>
          <div style={{display:"flex", gap:8}}>
            {unitCardIdx > 0 && <button onClick={()=>{ setUnitCardIdx(i=>i-1); setUnitCardInput(""); setUnitCardRevealed(false); }} style={{flex:1, background:"white", border:`2px solid ${C.border}`, borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:700, color:C.accent, cursor:"pointer"}}>← {vi?"Trước":en?"Prev":"이전"}</button>}
            {unitCardIdx < UNIT9_CARDS.length-1
              ? <button onClick={()=>{ setUnitCardIdx(i=>i+1); setUnitCardInput(""); setUnitCardRevealed(false); }} style={{flex:1, background:`linear-gradient(135deg,${C.accent},#4A148C)`, color:"white", border:"none", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>{vi?"Tiếp →":en?"Next →":"다음 카드 →"}</button>
              : <button onClick={()=>{ setTestAnswers({}); setTestResult(null); setTestQuestions([]); setStep("test9"); }} style={{flex:1, background:"linear-gradient(135deg,#FF8F00,#E65100)", color:"white", border:"none", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>{vi?"Kiểm tra! 📝":en?"Take test! 📝":"테스트하기! 📝"}</button>}
          </div>
          <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("test8"); }} style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>← {vi?"Quay lại":en?"Back":"뒤로 (8단원 테스트)"}</button>
        </div>
      </div>
    );
  }

  // ── 테스트9: 1~9단원 누적 ──
  if (step === "test9") {
    const vi = lang?.code === "vi"; const en = lang?.code === "en";
    // 포함 단원: 7·8·9단원 (6단원 졸업 — 3회 졸업 규칙 적용)
    const TEST9_Q = [
      // ── 7단원 복습 (8문항) ──
      { id:"t9_1",  q:"지금 밥 먹___ 있습니다.",           answer:"고",        answers:["고"],                     hint:"💡 동사 + 고 있다" },
      { id:"t9_2",  q:"아이가 자고 ___.",                  answer:"있습니다",  answers:["있습니다","있습니다."],   hint:"💡 -고 있___" },
      { id:"t9_3",  q:"저는 한국어 공부하___ 있습니다.",   answer:"고",        answers:["고"],                     hint:"💡 공부하다 + 고" },
      { id:"t9_4",  q:"엄마가 요리하고 ___.",              answer:"있습니다",  answers:["있습니다","있습니다."],   hint:"💡 -고 있___" },
      { id:"t9_5",  q:"동생이 음악 듣___ 있습니다.",       answer:"고",        answers:["고"],                     hint:"💡 듣다 + 고" },
      { id:"t9_6",  q:"지금 눈이 오___ 있습니다.",         answer:"고",        answers:["고"],                     hint:"💡 오다 + 고" },
      { id:"t9_7",  q:"선생님이 책을 읽___ 있습니다.",     answer:"고",        answers:["고"],                     hint:"💡 읽다 + 고" },
      { id:"t9_8",  q:"저는 지금 영화를 보___ 있습니다.",  answer:"고",        answers:["고"],                     hint:"💡 보다 + 고" },
      // ── 8단원 복습 (8문항) ──
      { id:"t9_9",  q:"같이 밥 먹___. (함께·격식)",        answer:"읍시다",    answers:["읍시다","읍시다."],       hint:"💡 먹다 → 받침+읍시다" },
      { id:"t9_10", q:"빨리 ___. (가자·격식)",              answer:"갑시다",    answers:["갑시다","갑시다."],       hint:"💡 가다 → ㅂ시다" },
      { id:"t9_11", q:"영화 볼___? (제안·의향)",            answer:"까요",      answers:["까요","까요?"],           hint:"💡 -(으)ㄹ까요?" },
      { id:"t9_12", q:"같이 공부할___? (권유)",             answer:"래요",      answers:["래요","래요?"],           hint:"💡 -(으)ㄹ래요?" },
      { id:"t9_13", q:"함께 청소합___. (격식 청유)",        answer:"시다",      answers:["시다","시다."],           hint:"💡 하다 → 합시다" },
      { id:"t9_14", q:"같이 운동할___? (권유)",             answer:"래요",      answers:["래요","래요?"],           hint:"💡 -(으)ㄹ래요?" },
      { id:"t9_15", q:"어디서 먹을___? (장소 제안)",        answer:"까요",      answers:["까요","까요?"],           hint:"💡 -(으)ㄹ까요?" },
      { id:"t9_16", q:"같이 여행 갑___. (격식 청유)",       answer:"시다",      answers:["시다","시다."],           hint:"💡 가다 → 갑시다" },
      // ── 9단원 신규 (14문항) ──
      { id:"t9_17", q:"저는 한국어를 말할 ___ ___. (가능)",  answer:"수 있습니다",  answers:["수 있습니다","수 있습니다."],  hint:"💡 -(으)ㄹ 수 있다 → 있습니다" },
      { id:"t9_18", q:"저는 수영을 할 ___ ___. (불가능)",    answer:"수 없습니다",  answers:["수 없습니다","수 없습니다."],  hint:"💡 -(으)ㄹ 수 없다 → 없습니다" },
      { id:"t9_19", q:"이 음식을 먹을 ___ ___? (가능 여부)", answer:"수 있습니까",  answers:["수 있습니까","수 있습니까?"],  hint:"💡 먹다 → 먹을 수 있습니까?" },
      { id:"t9_20", q:"저는 피아노를 칠 ___ ___. (가능)",    answer:"수 있습니다",  answers:["수 있습니다","수 있습니다."],  hint:"💡 치다 → 칠 수 있습니다" },
      { id:"t9_21", q:"오늘 만날 ___ ___? (가능 여부)",      answer:"수 있습니까",  answers:["수 있습니까","수 있습니까?"],  hint:"💡 만나다 → 만날 수 있습니까?" },
      { id:"t9_22", q:"저는 운전을 할 ___ ___. (불가능)",    answer:"수 없습니다",  answers:["수 없습니다","수 없습니다."],  hint:"💡 할 수 없다 → 없습니다" },
      { id:"t9_23", q:"한국어를 읽을 ___ ___? (가능)",       answer:"수 있습니까",  answers:["수 있습니까","수 있습니까?"],  hint:"💡 읽다 → 읽을 수 있습니까?" },
      { id:"t9_24", q:"자전거를 탈 ___ ___. (가능)",         answer:"수 있습니다",  answers:["수 있습니다","수 있습니다."],  hint:"💡 타다 → 탈 수 있습니다" },
      { id:"t9_25", q:"김치를 먹을 ___ ___? (가능)",         answer:"수 있습니까",  answers:["수 있습니까","수 있습니까?"],  hint:"💡 먹다 → 먹을 수 있습니까?" },
      { id:"t9_26", q:"저는 일찍 올 ___ ___. (불가능)",      answer:"수 없습니다",  answers:["수 없습니다","수 없습니다."],  hint:"💡 오다 → 올 수 없습니다" },
      { id:"t9_27", q:"한국 노래를 부를 ___ ___? (가능)",    answer:"수 있습니까",  answers:["수 있습니까","수 있습니까?"],  hint:"💡 부르다 → 부를 수 있습니까?" },
      { id:"t9_28", q:"저는 요리를 할 ___ ___. (가능)",      answer:"수 있습니다",  answers:["수 있습니다","수 있습니다."],  hint:"💡 하다 → 할 수 있습니다" },
      { id:"t9_29", q:"태권도를 할 ___ ___? (가능 여부)",    answer:"수 있습니까",  answers:["수 있습니까","수 있습니까?"],  hint:"💡 하다 → 할 수 있습니까?" },
      { id:"t9_30", q:"혼자 갈 ___ ___. (불가능)",           answer:"수 없습니다",  answers:["수 없습니다","수 없습니다."],  hint:"💡 가다 → 갈 수 없습니다" },
    ];;
    function gradeTest9() {
      let ok=0;
      TEST9_Q.forEach(q=>{ const v=(testAnswers[q.id]||"").trim(); if(q.answers.includes(v)) ok++; });
      setTestResult({score:ok, total:TEST9_Q.length, pass: ok/TEST9_Q.length>=0.8});
    }
    if (testResult) return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#F3E5F5,#E1BEE7)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px 16px"}}>
        <DevJumpPanel />
        <div style={{background:"white", borderRadius:24, padding:"32px 24px", maxWidth:360, width:"100%", textAlign:"center", boxShadow:"0 4px 24px rgba(106,27,154,.12)"}}>
          <div style={{fontSize:48, marginBottom:8}}>{testResult.pass?"🎉":"💪"}</div>
          <div style={{fontSize:22, fontWeight:900, color:testResult.pass?"#6A1B9A":"#E65100", marginBottom:8}}>{testResult.score}/{testResult.total}점</div>
          <div style={{fontSize:14, color:"#555", marginBottom:20}}>{testResult.pass?(vi?"Tuyệt! Sang bài 10!":en?"Great! On to Unit 10!":"훌륭해요! 10단원으로!"):(vi?"Thử lại nhé!":en?"Try again!":"다시 도전!")}</div>
          {testResult.pass
            ? <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setTestResult(null); setTestAnswers({}); setStep("unit10"); }} style={{width:"100%", background:"linear-gradient(135deg,#FF8F00,#E65100)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>{vi?"Tiếp — Bài 10! 🚀":en?"Next — Unit 10! 🚀":"10단원으로! 🚀"}</button>
            : <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setTestResult(null); setTestAnswers({}); setStep("unit9"); }} style={{width:"100%", background:`linear-gradient(135deg,#6A1B9A,#4A148C)`, color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>{vi?"Học lại Bài 9 🔄":en?"Retry Unit 9 🔄":"9단원 다시 학습 🔄"}</button>}
          <button onClick={()=>{ setTestResult(null); setTestAnswers({}); }} style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>← {vi?"Thử lại":en?"Try again":"다시 풀기"}</button>
        </div>
      </div>
    );
    return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#F3E5F5,#E1BEE7)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:400}}>
          <div style={{fontSize:14, fontWeight:900, color:"#6A1B9A", marginBottom:4}}>📝 누적 테스트 — 1~9단원</div>
          <div style={{fontSize:12, color:"#aaa", marginBottom:16}}>범위: 이다~능력가능 (10문제)</div>
          {TEST9_Q.map((q,i) => (
            <div key={q.id} style={{background:"white", borderRadius:12, padding:"12px 14px", marginBottom:8}}>
              <div style={{fontSize:13, fontWeight:700, color:"#333", marginBottom:6}}>{i+1}. {q.q}</div>
              <input type="text" value={testAnswers[q.id]||""} onChange={e=>setTestAnswers(a=>({...a,[q.id]:e.target.value}))} onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Tab") e.stopPropagation(); }} placeholder={vi?"Điền vào...":en?"Fill in...":"여기에 쓰세요..."} style={{width:"100%", border:"2px solid #CE93D8", borderRadius:8, padding:"7px 10px", fontSize:14, outline:"none", boxSizing:"border-box"}} />
              <div style={{fontSize:12, color:"#C62828", fontWeight:800, marginTop:6}}>{q.hint}</div>
            </div>
          ))}
          <button type="button" onClick={gradeTest9} style={{width:"100%", background:`linear-gradient(135deg,#6A1B9A,#4A148C)`, color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", marginTop:12}}>{vi?"Nộp bài!":en?"Submit!":"채점하기! 📊"}</button>
          <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit9"); }} style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>← {vi?"Quay lại":en?"Back":"뒤로 (9단원 학습)"}</button>
        </div>
      </div>
    );
  }

  // ── 10단원: 희망1 -고 싶다 ──
  if (step === "unit10") {
    const vi = lang?.code === "vi"; const en = lang?.code === "en";
    const UNIT10_CARDS = [
      { front:"저는 한국에 가고 ___. (희망)", blank:"싶습니다", full:"저는 한국에 가고 싶습니다.", hint:"💡 동사+고 싶다 = 원함" },
      { front:"저는 한국어를 잘하고 ___. (희망)", blank:"싶습니다", full:"저는 한국어를 잘하고 싶습니다.", hint:"💡 잘하다+고 싶다" },
      { front:"무엇을 먹고 ___? (의향)", blank:"싶습니까", full:"무엇을 먹고 싶습니까?", hint:"💡 먹다+고 싶다 → 질문" },
      { front:"저는 친구를 만나고 ___. (희망)", blank:"싶습니다", full:"저는 친구를 만나고 싶습니다.", hint:"💡 만나다+고 싶다" },
      { front:"저는 쉬고 ___. (희망)", blank:"싶습니다", full:"저는 쉬고 싶습니다.", hint:"💡 쉬다+고 싶다" },
      { front:"무슨 영화를 보고 ___? (의향)", blank:"싶습니까", full:"무슨 영화를 보고 싶습니까?", hint:"💡 보다+고 싶다" },
    ];
    const card = UNIT10_CARDS[unitCardIdx];
    const C = { bg:"linear-gradient(150deg,#FFF8E1,#FFECB3)", accent:"#F57F17", border:"#FFD54F" };
    return (
      <div style={{minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:400}}>
          <div style={{fontSize:13, fontWeight:900, color:C.accent, marginBottom:4}}>
            📚 {vi?"Bài 10 — Mong muốn (-고 싶다)":en?"Unit 10 — Want to (-고 싶다)":"10단원 — 희망1 (-고 싶다)"}
          </div>
          <div style={{fontSize:12, color:"#555", background:"#FFF8E1", borderRadius:10, padding:"10px 14px", marginBottom:12, lineHeight:1.7}}>
            {vi ? <>📌 동사 + <b>-고 싶다</b> = muốn làm gì đó<br/>예: 가다 → 가<b>고 싶어요</b> (muốn đi)</> : en ? <>📌 Verb + <b>-고 싶다</b> = want to do something<br/>e.g. 가다 → 가<b>고 싶어요</b> (want to go)</> : <>📌 동사 + <b>-고 싶다</b> = ~하고 싶어요<br/>예: 가다 → 가<b>고 싶어요</b> (가고 싶음)</>}
          </div>
          <div style={{display:"flex", gap:3, marginBottom:16}}>
            {UNIT10_CARDS.map((_,i) => <div key={i} style={{flex:1, height:4, borderRadius:2, background:i<=unitCardIdx?C.accent:"#ddd"}} />)}
          </div>
          <div style={{background:"white", borderRadius:20, padding:"20px", boxShadow:"0 4px 20px rgba(245,127,23,.12)", marginBottom:16}}>
            <div style={{fontSize:18, fontWeight:900, color:"#333", marginBottom:12, lineHeight:1.5}}>{card.front}</div>
            <input type="text" value={unitCardInput} onChange={e=>{ if(!unitCardRevealed) setUnitCardInput(e.target.value); }} onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Tab") e.stopPropagation(); }} readOnly={unitCardRevealed} placeholder="..." style={{width:"100%", border:`2px solid ${unitCardRevealed?(unitCardInput.trim()===card.blank||unitCardInput.trim()===card.full?"#2E7D32":"#C62828"):"#FFD54F"}`, borderRadius:10, padding:"10px 14px", fontSize:15, fontWeight:700, outline:"none", boxSizing:"border-box", color:unitCardRevealed?(unitCardInput.trim()===card.blank||unitCardInput.trim()===card.full?"#2E7D32":"#C62828"):"#333"}} />
            {unitCardRevealed && <div style={{marginTop:10, fontSize:13, color:C.accent, fontWeight:800}}>✅ {card.full}</div>}
            <div style={{fontSize:12, color:"#C62828", fontWeight:800, marginTop:8}}>{card.hint}</div>
            {!unitCardRevealed && <button onClick={()=>setUnitCardRevealed(true)} style={{width:"100%", marginTop:12, background:`linear-gradient(135deg,${C.accent},#E65100)`, color:"white", border:"none", borderRadius:50, padding:"11px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>{vi?"Xem đáp án 👀":en?"Show answer 👀":"정답 보기 👀"}</button>}
          </div>
          <div style={{display:"flex", gap:8}}>
            {unitCardIdx > 0 && <button onClick={()=>{ setUnitCardIdx(i=>i-1); setUnitCardInput(""); setUnitCardRevealed(false); }} style={{flex:1, background:"white", border:`2px solid ${C.border}`, borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:700, color:C.accent, cursor:"pointer"}}>← {vi?"Trước":en?"Prev":"이전"}</button>}
            {unitCardIdx < UNIT10_CARDS.length-1
              ? <button onClick={()=>{ setUnitCardIdx(i=>i+1); setUnitCardInput(""); setUnitCardRevealed(false); }} style={{flex:1, background:`linear-gradient(135deg,${C.accent},#E65100)`, color:"white", border:"none", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>{vi?"Tiếp →":en?"Next →":"다음 카드 →"}</button>
              : <button onClick={()=>{ setTestAnswers({}); setTestResult(null); setTestQuestions([]); setStep("test10"); }} style={{flex:1, background:"linear-gradient(135deg,#FF8F00,#E65100)", color:"white", border:"none", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>{vi?"Kiểm tra! 📝":en?"Take test! 📝":"테스트하기! 📝"}</button>}
          </div>
          <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("test9"); }} style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>← {vi?"Quay lại":en?"Back":"뒤로 (9단원 테스트)"}</button>
        </div>
      </div>
    );
  }

  // ── 테스트10: 1~10단원 누적 ──
  if (step === "test10") {
    const vi = lang?.code === "vi"; const en = lang?.code === "en";
    // 포함 단원: 8·9·10단원 (7단원 졸업 — 3회 졸업 규칙 적용)
    const TEST10_Q = [
      // ── 8단원 복습 (8문항) ──
      { id:"t10_1", q:"같이 밥 먹___. (함께·격식)",        answer:"읍시다",    answers:["읍시다","읍시다."],       hint:"💡 먹다 → 받침+읍시다" },
      { id:"t10_2", q:"빨리 ___. (가자·격식)",              answer:"갑시다",    answers:["갑시다","갑시다."],       hint:"💡 가다 → ㅂ시다" },
      { id:"t10_3", q:"영화 볼___? (제안·의향)",            answer:"까요",      answers:["까요","까요?"],           hint:"💡 -(으)ㄹ까요?" },
      { id:"t10_4", q:"같이 공부할___? (권유)",             answer:"래요",      answers:["래요","래요?"],           hint:"💡 -(으)ㄹ래요?" },
      { id:"t10_5", q:"함께 청소합___. (격식 청유)",        answer:"시다",      answers:["시다","시다."],           hint:"💡 하다 → 합시다" },
      { id:"t10_6", q:"같이 운동할___? (권유)",             answer:"래요",      answers:["래요","래요?"],           hint:"💡 -(으)ㄹ래요?" },
      { id:"t10_7", q:"어디서 먹을___? (장소 제안)",        answer:"까요",      answers:["까요","까요?"],           hint:"💡 -(으)ㄹ까요?" },
      { id:"t10_8", q:"같이 여행 갑___. (격식 청유)",       answer:"시다",      answers:["시다","시다."],           hint:"💡 가다 → 갑시다" },
      // ── 9단원 복습 (8문항) ──
      { id:"t10_9",  q:"저는 한국어를 말할 ___ ___. (가능)",  answer:"수 있습니다",  answers:["수 있습니다","수 있습니다."],  hint:"💡 말할 수 있습니다" },
      { id:"t10_10", q:"저는 수영을 할 ___ ___. (불가능)",    answer:"수 없습니다",  answers:["수 없습니다","수 없습니다."],  hint:"💡 할 수 없습니다" },
      { id:"t10_11", q:"이 음식을 먹을 ___ ___? (가능)",      answer:"수 있습니까",  answers:["수 있습니까","수 있습니까?"],  hint:"💡 먹을 수 있습니까?" },
      { id:"t10_12", q:"오늘 만날 ___ ___? (가능)",           answer:"수 있습니까",  answers:["수 있습니까","수 있습니까?"],  hint:"💡 만날 수 있습니까?" },
      { id:"t10_13", q:"저는 운전을 할 ___ ___. (불가능)",    answer:"수 없습니다",  answers:["수 없습니다","수 없습니다."],  hint:"💡 할 수 없습니다" },
      { id:"t10_14", q:"자전거를 탈 ___ ___. (가능)",         answer:"수 있습니다",  answers:["수 있습니다","수 있습니다."],  hint:"💡 탈 수 있습니다" },
      { id:"t10_15", q:"저는 요리를 할 ___ ___. (가능)",      answer:"수 있습니다",  answers:["수 있습니다","수 있습니다."],  hint:"💡 할 수 있습니다" },
      { id:"t10_16", q:"혼자 갈 ___ ___. (불가능)",           answer:"수 없습니다",  answers:["수 없습니다","수 없습니다."],  hint:"💡 갈 수 없습니다" },
      // ── 10단원 신규 (14문항) ──
      { id:"t10_17", q:"저는 한국에 가고 ___. (희망)",        answer:"싶습니다",  answers:["싶습니다","싶습니다."],   hint:"💡 -고 싶다 → 싶습니다" },
      { id:"t10_18", q:"무엇을 먹고 ___? (의향)",             answer:"싶습니까",  answers:["싶습니까","싶습니까?"],   hint:"💡 먹다+고 싶다 → 싶습니까?" },
      { id:"t10_19", q:"저는 친구를 만나고 ___. (희망)",      answer:"싶습니다",  answers:["싶습니다","싶습니다."],   hint:"💡 만나다+고 싶다 → 싶습니다" },
      { id:"t10_20", q:"저는 쉬고 ___. (희망)",               answer:"싶습니다",  answers:["싶습니다","싶습니다."],   hint:"💡 쉬다+고 싶다 → 싶습니다" },
      { id:"t10_21", q:"무슨 영화를 보고 ___? (의향)",        answer:"싶습니까",  answers:["싶습니까","싶습니까?"],   hint:"💡 보다+고 싶다 → 싶습니까?" },
      { id:"t10_22", q:"저는 한국어를 잘하고 ___. (희망)",    answer:"싶습니다",  answers:["싶습니다","싶습니다."],   hint:"💡 잘하다+고 싶다 → 싶습니다" },
      { id:"t10_23", q:"어디에 가고 ___? (의향)",             answer:"싶습니까",  answers:["싶습니까","싶습니까?"],   hint:"💡 가다+고 싶다 → 싶습니까?" },
      { id:"t10_24", q:"저는 피아노를 배우고 ___. (희망)",    answer:"싶습니다",  answers:["싶습니다","싶습니다."],   hint:"💡 배우다+고 싶다 → 싶습니다" },
      { id:"t10_25", q:"저는 한국 음식을 먹고 ___. (희망)",   answer:"싶습니다",  answers:["싶습니다","싶습니다."],   hint:"💡 먹다+고 싶다 → 싶습니다" },
      { id:"t10_26", q:"무엇을 마시고 ___? (의향)",           answer:"싶습니까",  answers:["싶습니까","싶습니까?"],   hint:"💡 마시다+고 싶다 → 싶습니까?" },
      { id:"t10_27", q:"저는 한국에서 살고 ___. (희망)",      answer:"싶습니다",  answers:["싶습니다","싶습니다."],   hint:"💡 살다+고 싶다 → 싶습니다" },
      { id:"t10_28", q:"누구를 만나고 ___? (의향)",           answer:"싶습니까",  answers:["싶습니까","싶습니까?"],   hint:"💡 만나다+고 싶다 → 싶습니까?" },
      { id:"t10_29", q:"저는 의사가 되고 ___. (희망)",        answer:"싶습니다",  answers:["싶습니다","싶습니다."],   hint:"💡 되다+고 싶다 → 싶습니다" },
      { id:"t10_30", q:"어떤 음악을 듣고 ___? (의향)",        answer:"싶습니까",  answers:["싶습니까","싶습니까?"],   hint:"💡 듣다+고 싶다 → 싶습니까?" },
    ];;
    function gradeTest10() {
      let ok=0;
      TEST10_Q.forEach(q=>{ const v=(testAnswers[q.id]||"").trim(); if(q.answers.includes(v)) ok++; });
      setTestResult({score:ok, total:TEST10_Q.length, pass: ok/TEST10_Q.length>=0.8});
    }
    if (testResult) return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#FFF8E1,#FFECB3)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px 16px"}}>
        <DevJumpPanel />
        <div style={{background:"white", borderRadius:24, padding:"32px 24px", maxWidth:360, width:"100%", textAlign:"center", boxShadow:"0 4px 24px rgba(245,127,23,.12)"}}>
          <div style={{fontSize:48, marginBottom:8}}>{testResult.pass?"🎉":"💪"}</div>
          <div style={{fontSize:22, fontWeight:900, color:testResult.pass?"#F57F17":"#E65100", marginBottom:8}}>{testResult.score}/{testResult.total}점</div>
          <div style={{fontSize:14, color:"#555", marginBottom:20}}>{testResult.pass?(vi?"Xuất sắc! Sang bài 11!":en?"Excellent! On to Unit 11!":"훌륭해요! 11단원으로!"):(vi?"Thử lại!":en?"Try again!":"다시 도전!")}</div>
          {testResult.pass
            ? <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setTestResult(null); setTestAnswers({}); setStep("unit11"); }} style={{width:"100%", background:"linear-gradient(135deg,#FF8F00,#E65100)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>{vi?"Tiếp — Bài 11! 🚀":en?"Next — Unit 11! 🚀":"11단원으로! 🚀"}</button>
            : <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setTestResult(null); setTestAnswers({}); setStep("unit10"); }} style={{width:"100%", background:`linear-gradient(135deg,#F57F17,#E65100)`, color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>{vi?"Học lại Bài 10 🔄":en?"Retry Unit 10 🔄":"10단원 다시 학습 🔄"}</button>}
          <button onClick={()=>{ setTestResult(null); setTestAnswers({}); }} style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>← {vi?"Thử lại":en?"Try again":"다시 풀기"}</button>
        </div>
      </div>
    );
    return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#FFF8E1,#FFECB3)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:400}}>
          <div style={{fontSize:14, fontWeight:900, color:"#F57F17", marginBottom:4}}>📝 누적 테스트 — 1~10단원</div>
          <div style={{fontSize:12, color:"#aaa", marginBottom:16}}>범위: 이다~희망1 (10문제)</div>
          {TEST10_Q.map((q,i) => (
            <div key={q.id} style={{background:"white", borderRadius:12, padding:"12px 14px", marginBottom:8}}>
              <div style={{fontSize:13, fontWeight:700, color:"#333", marginBottom:6}}>{i+1}. {q.q}</div>
              <input type="text" value={testAnswers[q.id]||""} onChange={e=>setTestAnswers(a=>({...a,[q.id]:e.target.value}))} onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Tab") e.stopPropagation(); }} placeholder={vi?"Điền vào...":en?"Fill in...":"여기에 쓰세요..."} style={{width:"100%", border:"2px solid #FFD54F", borderRadius:8, padding:"7px 10px", fontSize:14, outline:"none", boxSizing:"border-box"}} />
              <div style={{fontSize:12, color:"#C62828", fontWeight:800, marginTop:6}}>{q.hint}</div>
            </div>
          ))}
          <button type="button" onClick={gradeTest10} style={{width:"100%", background:`linear-gradient(135deg,#F57F17,#E65100)`, color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", marginTop:12}}>{vi?"Nộp bài!":en?"Submit!":"채점하기! 📊"}</button>
          <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit10"); }} style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>← {vi?"Quay lại":en?"Back":"뒤로 (10단원 학습)"}</button>
        </div>
      </div>
    );
  }

  // ── 11단원: 희망2 -았/었으면 좋겠다 ──
  if (step === "unit11") {
    const vi = lang?.code === "vi"; const en = lang?.code === "en";
    const UNIT11_CARDS = [
      { front:"날씨가 좋___으면 좋겠습니다. (희망)", blank:"았", full:"날씨가 좋았으면 좋겠습니다.", hint:"💡 좋다(아계열)+았으면 좋겠다" },
      { front:"빨리 방학이 ___으면 좋겠습니다. (희망)", blank:"됐", full:"빨리 방학이 됐으면 좋겠습니다.", hint:"💡 되다 → 됐으면 좋겠다" },
      { front:"돈이 많___으면 좋겠습니다. (희망)", blank:"았", full:"돈이 많았으면 좋겠습니다.", hint:"💡 많다+았으면 좋겠다" },
      { front:"건강___으면 좋겠습니다. (희망·건강)", blank:"했", full:"건강했으면 좋겠습니다.", hint:"💡 건강하다 → 했으면 좋겠다" },
      { front:"걱정이 없___으면 좋겠습니다. (희망)", blank:"었", full:"걱정이 없었으면 좋겠습니다.", hint:"💡 없다(어계열)+었으면 좋겠다" },
      { front:"부모님이 오래 사셨___으면 좋겠습니다.", blank:"으면 좋겠습니다", full:"부모님이 오래 사셨으면 좋겠습니다.", hint:"💡 -셨으면 좋겠다 (높임+희망)" },
    ];
    const card = UNIT11_CARDS[unitCardIdx];
    const C = { bg:"linear-gradient(150deg,#E8EAF6,#C5CAE9)", accent:"#283593", border:"#9FA8DA" };
    return (
      <div style={{minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:400}}>
          <div style={{fontSize:13, fontWeight:900, color:C.accent, marginBottom:4}}>
            📚 {vi?"Bài 11 — Ước gì (-았/었으면 좋겠다)":en?"Unit 11 — I wish (-았/었으면 좋겠다)":"11단원 — 희망2 (-았/었으면 좋겠다)"}
          </div>
          <div style={{fontSize:12, color:"#555", background:"#E8EAF6", borderRadius:10, padding:"10px 14px", marginBottom:12, lineHeight:1.7}}>
            {vi ? <>📌 동사/형용사 + <b>-았/었으면 좋겠다</b> = ước muốn<br/>아 계열 → <b>았으면</b> / 어 계열 → <b>었으면</b><br/>하다 계열 → <b>했으면 좋겠다</b></> : en ? <>📌 Verb + <b>-았/었으면 좋겠다</b> = "I wish..."<br/>아 stem → <b>았으면</b> / 어 stem → <b>었으면</b><br/>하다 → <b>했으면 좋겠다</b></> : <>📌 동사/형용사 + <b>-았/었으면 좋겠다</b><br/>아 계열 → <b>았으면</b> / 어 계열 → <b>었으면</b><br/>하다 계열 → <b>했으면 좋겠다</b></>}
          </div>
          <div style={{display:"flex", gap:3, marginBottom:16}}>
            {UNIT11_CARDS.map((_,i) => <div key={i} style={{flex:1, height:4, borderRadius:2, background:i<=unitCardIdx?C.accent:"#ddd"}} />)}
          </div>
          <div style={{background:"white", borderRadius:20, padding:"20px", boxShadow:"0 4px 20px rgba(40,53,147,.12)", marginBottom:16}}>
            <div style={{fontSize:18, fontWeight:900, color:"#333", marginBottom:12, lineHeight:1.5}}>{card.front}</div>
            <input type="text" value={unitCardInput} onChange={e=>{ if(!unitCardRevealed) setUnitCardInput(e.target.value); }} onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Tab") e.stopPropagation(); }} readOnly={unitCardRevealed} placeholder="..." style={{width:"100%", border:`2px solid ${unitCardRevealed?(unitCardInput.trim()===card.blank||unitCardInput.trim()===card.full?"#2E7D32":"#C62828"):"#9FA8DA"}`, borderRadius:10, padding:"10px 14px", fontSize:15, fontWeight:700, outline:"none", boxSizing:"border-box", color:unitCardRevealed?(unitCardInput.trim()===card.blank||unitCardInput.trim()===card.full?"#2E7D32":"#C62828"):"#333"}} />
            {unitCardRevealed && <div style={{marginTop:10, fontSize:13, color:C.accent, fontWeight:800}}>✅ {card.full}</div>}
            <div style={{fontSize:12, color:"#C62828", fontWeight:800, marginTop:8}}>{card.hint}</div>
            {!unitCardRevealed && <button onClick={()=>setUnitCardRevealed(true)} style={{width:"100%", marginTop:12, background:`linear-gradient(135deg,${C.accent},#1A237E)`, color:"white", border:"none", borderRadius:50, padding:"11px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>{vi?"Xem đáp án 👀":en?"Show answer 👀":"정답 보기 👀"}</button>}
          </div>
          <div style={{display:"flex", gap:8}}>
            {unitCardIdx > 0 && <button onClick={()=>{ setUnitCardIdx(i=>i-1); setUnitCardInput(""); setUnitCardRevealed(false); }} style={{flex:1, background:"white", border:`2px solid ${C.border}`, borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:700, color:C.accent, cursor:"pointer"}}>← {vi?"Trước":en?"Prev":"이전"}</button>}
            {unitCardIdx < UNIT11_CARDS.length-1
              ? <button onClick={()=>{ setUnitCardIdx(i=>i+1); setUnitCardInput(""); setUnitCardRevealed(false); }} style={{flex:1, background:`linear-gradient(135deg,${C.accent},#1A237E)`, color:"white", border:"none", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>{vi?"Tiếp →":en?"Next →":"다음 카드 →"}</button>
              : <button onClick={()=>{ setTestAnswers({}); setTestResult(null); setTestQuestions([]); setStep("test11"); }} style={{flex:1, background:"linear-gradient(135deg,#FF8F00,#E65100)", color:"white", border:"none", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>{vi?"Kiểm tra! 📝":en?"Take test! 📝":"테스트하기! 📝"}</button>}
          </div>
          <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("test10"); }} style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>← {vi?"Quay lại":en?"Back":"뒤로 (10단원 테스트)"}</button>
        </div>
      </div>
    );
  }

  // ── 테스트11: 1~11단원 누적 ──
  if (step === "test11") {
    const vi = lang?.code === "vi"; const en = lang?.code === "en";
    // 포함 단원: 9·10·11단원 (8단원 졸업 — 3회 졸업 규칙 적용)
    const TEST11_Q = [
      // ── 9단원 복습 (8문항) ──
      { id:"t11_1",  q:"저는 한국어를 말할 ___ ___. (가능)",  answer:"수 있습니다",  answers:["수 있습니다","수 있습니다."],  hint:"💡 말할 수 있습니다" },
      { id:"t11_2",  q:"저는 수영을 할 ___ ___. (불가능)",    answer:"수 없습니다",  answers:["수 없습니다","수 없습니다."],  hint:"💡 할 수 없습니다" },
      { id:"t11_3",  q:"이 음식을 먹을 ___ ___? (가능)",      answer:"수 있습니까",  answers:["수 있습니까","수 있습니까?"],  hint:"💡 먹을 수 있습니까?" },
      { id:"t11_4",  q:"저는 운전을 할 ___ ___. (불가능)",    answer:"수 없습니다",  answers:["수 없습니다","수 없습니다."],  hint:"💡 할 수 없습니다" },
      { id:"t11_5",  q:"자전거를 탈 ___ ___. (가능)",         answer:"수 있습니다",  answers:["수 있습니다","수 있습니다."],  hint:"💡 탈 수 있습니다" },
      { id:"t11_6",  q:"저는 요리를 할 ___ ___. (가능)",      answer:"수 있습니다",  answers:["수 있습니다","수 있습니다."],  hint:"💡 할 수 있습니다" },
      { id:"t11_7",  q:"혼자 갈 ___ ___. (불가능)",           answer:"수 없습니다",  answers:["수 없습니다","수 없습니다."],  hint:"💡 갈 수 없습니다" },
      { id:"t11_8",  q:"한국 노래를 부를 ___ ___? (가능)",    answer:"수 있습니까",  answers:["수 있습니까","수 있습니까?"],  hint:"💡 부를 수 있습니까?" },
      // ── 10단원 복습 (8문항) ──
      { id:"t11_9",  q:"저는 한국에 가고 ___. (희망)",        answer:"싶습니다",  answers:["싶습니다","싶습니다."],   hint:"💡 -고 싶다 → 싶습니다" },
      { id:"t11_10", q:"무엇을 먹고 ___? (의향)",             answer:"싶습니까",  answers:["싶습니까","싶습니까?"],   hint:"💡 먹다+고 싶다 → 싶습니까?" },
      { id:"t11_11", q:"저는 쉬고 ___. (희망)",               answer:"싶습니다",  answers:["싶습니다","싶습니다."],   hint:"💡 쉬다+고 싶다 → 싶습니다" },
      { id:"t11_12", q:"저는 한국어를 잘하고 ___. (희망)",    answer:"싶습니다",  answers:["싶습니다","싶습니다."],   hint:"💡 잘하다+고 싶다 → 싶습니다" },
      { id:"t11_13", q:"어디에 가고 ___? (의향)",             answer:"싶습니까",  answers:["싶습니까","싶습니까?"],   hint:"💡 가다+고 싶다 → 싶습니까?" },
      { id:"t11_14", q:"저는 한국에서 살고 ___. (희망)",      answer:"싶습니다",  answers:["싶습니다","싶습니다."],   hint:"💡 살다+고 싶다 → 싶습니다" },
      { id:"t11_15", q:"저는 의사가 되고 ___. (희망)",        answer:"싶습니다",  answers:["싶습니다","싶습니다."],   hint:"💡 되다+고 싶다 → 싶습니다" },
      { id:"t11_16", q:"누구를 만나고 ___? (의향)",           answer:"싶습니까",  answers:["싶습니까","싶습니까?"],   hint:"💡 만나다+고 싶다 → 싶습니까?" },
      // ── 11단원 신규 (14문항) ──
      { id:"t11_17", q:"날씨가 좋___으면 좋겠습니다. (희망)", answer:"았",  answers:["았"],  hint:"💡 좋다(아계열) → 았으면" },
      { id:"t11_18", q:"빨리 방학이 ___으면 좋겠습니다.",     answer:"됐",  answers:["됐"],  hint:"💡 되다 → 됐으면 좋겠다" },
      { id:"t11_19", q:"돈이 많___으면 좋겠습니다.",          answer:"았",  answers:["았"],  hint:"💡 많다(아계열) → 았으면" },
      { id:"t11_20", q:"건강___으면 좋겠습니다.",             answer:"했",  answers:["했"],  hint:"💡 건강하다 → 했으면" },
      { id:"t11_21", q:"걱정이 없___으면 좋겠습니다.",        answer:"었",  answers:["었"],  hint:"💡 없다(어계열) → 었으면" },
      { id:"t11_22", q:"한국어를 잘했___으면 좋겠습니다.",    answer:"으면 좋겠습니다", answers:["으면 좋겠습니다","으면 좋겠습니다."], hint:"💡 -았/었으면 좋겠다" },
      { id:"t11_23", q:"날씨가 따뜻했___으면 좋겠습니다.",   answer:"으면 좋겠습니다", answers:["으면 좋겠습니다"],  hint:"💡 따뜻하다 → 했으면" },
      { id:"t11_24", q:"비가 안 왔___으면 좋겠습니다.",       answer:"으면 좋겠습니다", answers:["으면 좋겠습니다"],  hint:"💡 오다 + 았/었으면" },
      { id:"t11_25", q:"친구가 빨리 나았___으면 좋겠습니다.",answer:"으면 좋겠습니다", answers:["으면 좋겠습니다"],  hint:"💡 낫다(아계열) → 나았으면" },
      { id:"t11_26", q:"시험이 쉬웠___으면 좋겠습니다.",      answer:"으면 좋겠습니다", answers:["으면 좋겠습니다"],  hint:"💡 쉽다 → 쉬웠으면" },
      { id:"t11_27", q:"봄이 빨리 왔___으면 좋겠습니다.",     answer:"으면 좋겠습니다", answers:["으면 좋겠습니다"],  hint:"💡 오다 → 왔으면" },
      { id:"t11_28", q:"모두가 행복했___으면 좋겠습니다.",    answer:"으면 좋겠습니다", answers:["으면 좋겠습니다"],  hint:"💡 행복하다 → 행복했으면" },
      { id:"t11_29", q:"일이 잘 됐___으면 좋겠습니다.",       answer:"으면 좋겠습니다", answers:["으면 좋겠습니다"],  hint:"💡 되다 → 됐으면" },
      { id:"t11_30", q:"부모님이 건강하셨___으면 좋겠습니다.",answer:"으면 좋겠습니다", answers:["으면 좋겠습니다"],  hint:"💡 -셨으면 좋겠다 (높임)" },
    ];;
    function gradeTest11() {
      let ok=0;
      TEST11_Q.forEach(q=>{ const v=(testAnswers[q.id]||"").trim(); if(q.answers.includes(v)) ok++; });
      setTestResult({score:ok, total:TEST11_Q.length, pass: ok/TEST11_Q.length>=0.8});
    }
    if (testResult) return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#E8EAF6,#C5CAE9)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px 16px"}}>
        <DevJumpPanel />
        <div style={{background:"white", borderRadius:24, padding:"32px 24px", maxWidth:360, width:"100%", textAlign:"center", boxShadow:"0 4px 24px rgba(40,53,147,.12)"}}>
          <div style={{fontSize:48, marginBottom:8}}>{testResult.pass?"🎉":"💪"}</div>
          <div style={{fontSize:22, fontWeight:900, color:testResult.pass?"#283593":"#E65100", marginBottom:8}}>{testResult.score}/{testResult.total}점</div>
          <div style={{fontSize:14, color:"#555", marginBottom:20}}>{testResult.pass?(vi?"Tuyệt! Sang bài 12!":en?"Great! Unit 12!":"훌륭해요! 12단원으로!"):(vi?"Thử lại!":en?"Try again!":"다시 도전!")}</div>
          {testResult.pass
            ? <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setTestResult(null); setTestAnswers({}); setStep("unit12"); }} style={{width:"100%", background:"linear-gradient(135deg,#FF8F00,#E65100)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>{vi?"Tiếp — Bài 12! 🚀":en?"Next — Unit 12! 🚀":"12단원으로! 🚀"}</button>
            : <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setTestResult(null); setTestAnswers({}); setStep("unit11"); }} style={{width:"100%", background:`linear-gradient(135deg,#283593,#1A237E)`, color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>{vi?"Học lại Bài 11 🔄":en?"Retry Unit 11 🔄":"11단원 다시 학습 🔄"}</button>}
          <button onClick={()=>{ setTestResult(null); setTestAnswers({}); }} style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>← {vi?"Thử lại":en?"Try again":"다시 풀기"}</button>
        </div>
      </div>
    );
    return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#E8EAF6,#C5CAE9)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:400}}>
          <div style={{fontSize:14, fontWeight:900, color:"#283593", marginBottom:4}}>📝 누적 테스트 — 1~11단원</div>
          <div style={{fontSize:12, color:"#aaa", marginBottom:16}}>범위: 이다~희망2 (10문제)</div>
          {TEST11_Q.map((q,i) => (
            <div key={q.id} style={{background:"white", borderRadius:12, padding:"12px 14px", marginBottom:8}}>
              <div style={{fontSize:13, fontWeight:700, color:"#333", marginBottom:6}}>{i+1}. {q.q}</div>
              <input type="text" value={testAnswers[q.id]||""} onChange={e=>setTestAnswers(a=>({...a,[q.id]:e.target.value}))} onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Tab") e.stopPropagation(); }} placeholder={vi?"Điền vào...":en?"Fill in...":"여기에 쓰세요..."} style={{width:"100%", border:"2px solid #9FA8DA", borderRadius:8, padding:"7px 10px", fontSize:14, outline:"none", boxSizing:"border-box"}} />
              <div style={{fontSize:12, color:"#C62828", fontWeight:800, marginTop:6}}>{q.hint}</div>
            </div>
          ))}
          <button type="button" onClick={gradeTest11} style={{width:"100%", background:`linear-gradient(135deg,#283593,#1A237E)`, color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", marginTop:12}}>{vi?"Nộp bài!":en?"Submit!":"채점하기! 📊"}</button>
          <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit11"); }} style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>← {vi?"Quay lại":en?"Back":"뒤로 (11단원 학습)"}</button>
        </div>
      </div>
    );
  }

  // ── 12단원: 부정 (안·못·-지 않다·-지 못하다·-지 마세요·-지 맙시다) ──
  if (step === "unit12") {
    const vi = lang?.code === "vi"; const en = lang?.code === "en";
    const UNIT12_CARDS = [
      { front:"저는 오늘 밥을 ___ 먹습니다. (의지 부정)", blank:"안", full:"저는 오늘 밥을 안 먹습니다.", hint:"💡 안 + 동사 = 의지로 안 함" },
      { front:"저는 수영을 ___ 합니다. (능력 부정)", blank:"못", full:"저는 수영을 못 합니다.", hint:"💡 못 + 동사 = 능력이 없어서" },
      { front:"저는 고기를 먹지 ___. (의지 부정·정중)", blank:"않습니다", full:"저는 고기를 먹지 않습니다.", hint:"💡 -지 않다 = 안 하다(정중)" },
      { front:"저는 운전을 하지 ___. (능력 부정·정중)", blank:"못합니다", full:"저는 운전을 하지 못합니다.", hint:"💡 -지 못하다 = 못 하다(정중)" },
      { front:"여기서 사진을 찍지 ___. (금지)", blank:"마세요", full:"여기서 사진을 찍지 마세요.", hint:"💡 -지 마세요 = 금지" },
      { front:"교실에서 떠들지 ___. (금지·함께)", blank:"맙시다", full:"교실에서 떠들지 맙시다.", hint:"💡 -지 맙시다 = 함께 하지 말자" },
    ];
    const card = UNIT12_CARDS[unitCardIdx];
    const C = { bg:"linear-gradient(150deg,#FFEBEE,#FFCDD2)", accent:"#B71C1C", border:"#EF9A9A" };
    return (
      <div style={{minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:400}}>
          <div style={{fontSize:13, fontWeight:900, color:C.accent, marginBottom:4}}>
            📚 {vi?"Bài 12 — Phủ định (안·못·-지 않다·-지 마세요)":en?"Unit 12 — Negation (안·못·-지 않다·-지 마세요)":"12단원 — 부정 (안·못·-지 않다·-지 못하다·-지 마세요·-지 맙시다)"}
          </div>
          <div style={{fontSize:12, color:"#555", background:"#FFEBEE", borderRadius:10, padding:"10px 14px", marginBottom:12, lineHeight:1.7}}>
            {vi ? <>📌 <b>안</b> + 동사: không làm (ý muốn)<br/><b>못</b> + 동사: không thể làm (năng lực)<br/><b>-지 않다</b>: phủ định lịch sự / <b>-지 마세요</b>: cấm</>
              : en ? <>📌 <b>안</b> + verb: don't (by choice)<br/><b>못</b> + verb: can't (lack of ability)<br/><b>-지 않다</b>: polite negation / <b>-지 마세요</b>: prohibition</>
              : <>📌 <b>안</b> + 동사: 의지로 안 함<br/><b>못</b> + 동사: 능력이 없어서 못 함<br/><b>-지 않다</b>: 정중한 부정 / <b>-지 마세요</b>: 금지</>}
          </div>
          <div style={{display:"flex", gap:3, marginBottom:16}}>
            {UNIT12_CARDS.map((_,i) => <div key={i} style={{flex:1, height:4, borderRadius:2, background:i<=unitCardIdx?C.accent:"#ddd"}} />)}
          </div>
          <div style={{background:"white", borderRadius:20, padding:"20px", boxShadow:"0 4px 20px rgba(183,28,28,.12)", marginBottom:16}}>
            <div style={{fontSize:18, fontWeight:900, color:"#333", marginBottom:12, lineHeight:1.5}}>{card.front}</div>
            <input type="text" value={unitCardInput} onChange={e=>{ if(!unitCardRevealed) setUnitCardInput(e.target.value); }} onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Tab") e.stopPropagation(); }} readOnly={unitCardRevealed} placeholder="..." style={{width:"100%", border:`2px solid ${unitCardRevealed?(unitCardInput.trim()===card.blank||unitCardInput.trim()===card.full?"#2E7D32":"#C62828"):"#EF9A9A"}`, borderRadius:10, padding:"10px 14px", fontSize:15, fontWeight:700, outline:"none", boxSizing:"border-box", color:unitCardRevealed?(unitCardInput.trim()===card.blank||unitCardInput.trim()===card.full?"#2E7D32":"#C62828"):"#333"}} />
            {unitCardRevealed && <div style={{marginTop:10, fontSize:13, color:C.accent, fontWeight:800}}>✅ {card.full}</div>}
            <div style={{fontSize:12, color:"#C62828", fontWeight:800, marginTop:8}}>{card.hint}</div>
            {!unitCardRevealed && <button onClick={()=>setUnitCardRevealed(true)} style={{width:"100%", marginTop:12, background:`linear-gradient(135deg,${C.accent},#7F0000)`, color:"white", border:"none", borderRadius:50, padding:"11px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>{vi?"Xem đáp án 👀":en?"Show answer 👀":"정답 보기 👀"}</button>}
          </div>
          <div style={{display:"flex", gap:8}}>
            {unitCardIdx > 0 && <button onClick={()=>{ setUnitCardIdx(i=>i-1); setUnitCardInput(""); setUnitCardRevealed(false); }} style={{flex:1, background:"white", border:`2px solid ${C.border}`, borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:700, color:C.accent, cursor:"pointer"}}>← {vi?"Trước":en?"Prev":"이전"}</button>}
            {unitCardIdx < UNIT12_CARDS.length-1
              ? <button onClick={()=>{ setUnitCardIdx(i=>i+1); setUnitCardInput(""); setUnitCardRevealed(false); }} style={{flex:1, background:`linear-gradient(135deg,${C.accent},#7F0000)`, color:"white", border:"none", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>{vi?"Tiếp →":en?"Next →":"다음 카드 →"}</button>
              : <button onClick={()=>{ setTestAnswers({}); setTestResult(null); setTestQuestions([]); setStep("test12"); }} style={{flex:1, background:"linear-gradient(135deg,#FF8F00,#E65100)", color:"white", border:"none", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>{vi?"Kiểm tra! 📝":en?"Take test! 📝":"테스트하기! 📝"}</button>}
          </div>
          <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("test11"); }} style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>← {vi?"Quay lại":en?"Back":"뒤로 (11단원 테스트)"}</button>
        </div>
      </div>
    );
  }

  // ── 테스트12: 1~12단원 누적 ──
  if (step === "test12") {
    const vi = lang?.code === "vi"; const en = lang?.code === "en";
    // 포함 단원: 10·11·12단원 (9단원 졸업 — 3회 졸업 규칙 적용)
    const TEST12_Q = [
      // ── 10단원 복습 (8문항) ──
      { id:"t12_1",  q:"저는 한국에 가고 ___. (희망)",        answer:"싶습니다",  answers:["싶습니다","싶습니다."],   hint:"💡 -고 싶다 → 싶습니다" },
      { id:"t12_2",  q:"무엇을 먹고 ___? (의향)",             answer:"싶습니까",  answers:["싶습니까","싶습니까?"],   hint:"💡 먹다+고 싶다 → 싶습니까?" },
      { id:"t12_3",  q:"저는 쉬고 ___. (희망)",               answer:"싶습니다",  answers:["싶습니다","싶습니다."],   hint:"💡 쉬다+고 싶다 → 싶습니다" },
      { id:"t12_4",  q:"저는 한국어를 잘하고 ___. (희망)",    answer:"싶습니다",  answers:["싶습니다","싶습니다."],   hint:"💡 잘하다+고 싶다 → 싶습니다" },
      { id:"t12_5",  q:"어디에 가고 ___? (의향)",             answer:"싶습니까",  answers:["싶습니까","싶습니까?"],   hint:"💡 가다+고 싶다 → 싶습니까?" },
      { id:"t12_6",  q:"저는 의사가 되고 ___. (희망)",        answer:"싶습니다",  answers:["싶습니다","싶습니다."],   hint:"💡 되다+고 싶다 → 싶습니다" },
      { id:"t12_7",  q:"저는 피아노를 배우고 ___. (희망)",    answer:"싶습니다",  answers:["싶습니다","싶습니다."],   hint:"💡 배우다+고 싶다 → 싶습니다" },
      { id:"t12_8",  q:"누구를 만나고 ___? (의향)",           answer:"싶습니까",  answers:["싶습니까","싶습니까?"],   hint:"💡 만나다+고 싶다 → 싶습니까?" },
      // ── 11단원 복습 (8문항) ──
      { id:"t12_9",  q:"날씨가 좋___으면 좋겠습니다.",        answer:"았",  answers:["았"],  hint:"💡 좋다(아계열) → 았으면" },
      { id:"t12_10", q:"돈이 많___으면 좋겠습니다.",          answer:"았",  answers:["았"],  hint:"💡 많다(아계열) → 았으면" },
      { id:"t12_11", q:"걱정이 없___으면 좋겠습니다.",        answer:"었",  answers:["었"],  hint:"💡 없다(어계열) → 었으면" },
      { id:"t12_12", q:"건강___으면 좋겠습니다.",             answer:"했",  answers:["했"],  hint:"💡 건강하다 → 했으면" },
      { id:"t12_13", q:"봄이 빨리 왔___으면 좋겠습니다.",     answer:"으면 좋겠습니다", answers:["으면 좋겠습니다"],  hint:"💡 오다 → 왔으면" },
      { id:"t12_14", q:"일이 잘 됐___으면 좋겠습니다.",       answer:"으면 좋겠습니다", answers:["으면 좋겠습니다"],  hint:"💡 되다 → 됐으면" },
      { id:"t12_15", q:"시험이 쉬웠___으면 좋겠습니다.",      answer:"으면 좋겠습니다", answers:["으면 좋겠습니다"],  hint:"💡 쉽다 → 쉬웠으면" },
      { id:"t12_16", q:"모두가 행복했___으면 좋겠습니다.",    answer:"으면 좋겠습니다", answers:["으면 좋겠습니다"],  hint:"💡 행복하다 → 행복했으면" },
      // ── 12단원 신규 (14문항) ──
      { id:"t12_17", q:"저는 오늘 밥을 ___ 먹습니다. (의지 부정)", answer:"안",         answers:["안"],                       hint:"💡 안 + 동사 = 의지로 안 함" },
      { id:"t12_18", q:"저는 수영을 ___ 합니다. (능력 부정)",       answer:"못",         answers:["못"],                       hint:"💡 못 + 동사 = 능력이 없어서" },
      { id:"t12_19", q:"저는 고기를 먹지 ___. (정중 부정)",          answer:"않습니다",   answers:["않습니다","않습니다."],      hint:"💡 -지 않다 → 않습니다" },
      { id:"t12_20", q:"저는 운전을 하지 ___. (능력 부정·정중)",     answer:"못합니다",   answers:["못합니다","못합니다."],      hint:"💡 -지 못하다 → 못합니다" },
      { id:"t12_21", q:"여기서 사진을 찍지 ___. (금지)",             answer:"마세요",     answers:["마세요","마세요."],          hint:"💡 -지 마세요 = 금지" },
      { id:"t12_22", q:"교실에서 떠들지 ___. (함께 금지)",           answer:"맙시다",     answers:["맙시다","맙시다."],          hint:"💡 -지 맙시다 = 함께 하지 말자" },
      { id:"t12_23", q:"저는 커피를 ___ 마십니다. (의지 부정)",      answer:"안",         answers:["안"],                       hint:"💡 안 + 동사" },
      { id:"t12_24", q:"저는 야채를 먹지 ___. (정중 부정)",          answer:"않습니다",   answers:["않습니다","않습니다."],      hint:"💡 -지 않다 → 않습니다" },
      { id:"t12_25", q:"저는 한국어를 ___ 합니다. (능력 부정)",      answer:"못",         answers:["못"],                       hint:"💡 못 + 동사" },
      { id:"t12_26", q:"수업 중에 전화를 받지 ___. (정중 부정)",     answer:"않습니다",   answers:["않습니다","않습니다."],      hint:"💡 -지 않다 → 않습니다" },
      { id:"t12_27", q:"늦게 일어나지 ___. (금지 명령)",             answer:"마세요",     answers:["마세요","마세요."],          hint:"💡 -지 마세요" },
      { id:"t12_28", q:"길에서 달리지 ___. (함께 금지)",             answer:"맙시다",     answers:["맙시다","맙시다."],          hint:"💡 -지 맙시다" },
      { id:"t12_29", q:"저는 매운 음식을 먹지 ___. (능력 부정)",     answer:"못합니다",   answers:["못합니다","못합니다."],      hint:"💡 -지 못하다 → 못합니다" },
      { id:"t12_30", q:"수업 시간에 핸드폰을 보지 ___. (금지)",      answer:"마세요",     answers:["마세요","마세요."],          hint:"💡 -지 마세요" },
    ];;
    function gradeTest12() {
      let ok=0;
      TEST12_Q.forEach(q=>{ const v=(testAnswers[q.id]||"").trim(); if(q.answers.includes(v)) ok++; });
      setTestResult({score:ok, total:TEST12_Q.length, pass: ok/TEST12_Q.length>=0.8});
    }
    if (testResult) return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#FFEBEE,#FFCDD2)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px 16px"}}>
        <DevJumpPanel />
        <div style={{background:"white", borderRadius:24, padding:"32px 24px", maxWidth:360, width:"100%", textAlign:"center", boxShadow:"0 4px 24px rgba(183,28,28,.12)"}}>
          <div style={{fontSize:48, marginBottom:8}}>{testResult.pass?"🎉":"💪"}</div>
          <div style={{fontSize:22, fontWeight:900, color:testResult.pass?"#B71C1C":"#E65100", marginBottom:8}}>{testResult.score}/{testResult.total}점</div>
          <div style={{fontSize:14, color:"#555", marginBottom:20}}>{testResult.pass?(vi?"Xuất sắc! Sang bài 13!":en?"Excellent! Unit 13!":"훌륭해요! 13단원으로!"):(vi?"Thử lại!":en?"Try again!":"다시 도전!")}</div>
          {testResult.pass
            ? <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setTestResult(null); setTestAnswers({}); setStep("unit13"); }} style={{width:"100%", background:"linear-gradient(135deg,#FF8F00,#E65100)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>{vi?"Tiếp — Bài 13! 🚀":en?"Next — Unit 13! 🚀":"13단원으로! 🚀"}</button>
            : <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setTestResult(null); setTestAnswers({}); setStep("unit12"); }} style={{width:"100%", background:`linear-gradient(135deg,#B71C1C,#7F0000)`, color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>{vi?"Học lại Bài 12 🔄":en?"Retry Unit 12 🔄":"12단원 다시 학습 🔄"}</button>}
          <button onClick={()=>{ setTestResult(null); setTestAnswers({}); }} style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>← {vi?"Thử lại":en?"Try again":"다시 풀기"}</button>
        </div>
      </div>
    );
    return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#FFEBEE,#FFCDD2)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:400}}>
          <div style={{fontSize:14, fontWeight:900, color:"#B71C1C", marginBottom:4}}>📝 누적 테스트 — 1~12단원</div>
          <div style={{fontSize:12, color:"#aaa", marginBottom:16}}>범위: 이다~부정 (10문제)</div>
          {TEST12_Q.map((q,i) => (
            <div key={q.id} style={{background:"white", borderRadius:12, padding:"12px 14px", marginBottom:8}}>
              <div style={{fontSize:13, fontWeight:700, color:"#333", marginBottom:6}}>{i+1}. {q.q}</div>
              <input type="text" value={testAnswers[q.id]||""} onChange={e=>setTestAnswers(a=>({...a,[q.id]:e.target.value}))} onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Tab") e.stopPropagation(); }} placeholder={vi?"Điền vào...":en?"Fill in...":"여기에 쓰세요..."} style={{width:"100%", border:"2px solid #EF9A9A", borderRadius:8, padding:"7px 10px", fontSize:14, outline:"none", boxSizing:"border-box"}} />
              <div style={{fontSize:12, color:"#C62828", fontWeight:800, marginTop:6}}>{q.hint}</div>
            </div>
          ))}
          <button type="button" onClick={gradeTest12} style={{width:"100%", background:`linear-gradient(135deg,#B71C1C,#7F0000)`, color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", marginTop:12}}>{vi?"Nộp bài!":en?"Submit!":"채점하기! 📊"}</button>
          <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit12"); }} style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>← {vi?"Quay lại":en?"Back":"뒤로 (12단원 학습)"}</button>
        </div>
      </div>
    );
  }

  // ── 서술어 13단원: 허락·금지·의무·면제 ──
  if (step === "unit13") {
    const vi = lang?.code === "vi"; const en = lang?.code === "en";
    const UNIT13_CARDS = [
      { front:"여기서 사진을 찍어도 ___? (허락 질문)", blank:"됩니까", full:"여기서 사진을 찍어도 됩니까?", hint:"💡 -아/어도 됩니까? = ~해도 괜찮습니까?" },
      { front:"네, 찍어도 ___. (허락)", blank:"됩니다", full:"네, 찍어도 됩니다.", hint:"💡 -아/어도 됩니다 = 허락할 때" },
      { front:"아니요, 찍으면 ___ ___. (금지)", blank:"안 됩니다", full:"아니요, 찍으면 안 됩니다.", hint:"💡 -(으)면 안 됩니다 = 금지할 때" },
      { front:"여기서 사진을 찍지 ___. (명령 금지)", blank:"마세요", full:"여기서 사진을 찍지 마세요.", hint:"💡 -지 마세요 = 직접 금지 명령" },
      { front:"조용히 해야 ___. (의무)", blank:"합니다", full:"조용히 해야 합니다.", hint:"💡 -아/어야 합니다 = 꼭 해야 함" },
      { front:"예약하지 않아도 ___. (면제)", blank:"됩니다", full:"예약하지 않아도 됩니다.", hint:"💡 -지 않아도 됩니다 = 안 해도 괜찮습니다" },
    ];
    const card = UNIT13_CARDS[unitCardIdx];
    const C13 = { bg:"linear-gradient(150deg,#E0F7FA,#B2EBF2)", accent:"#00838F", border:"#80DEEA" };
    return (
      <div style={{minHeight:"100vh", background:C13.bg, display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:400}}>
          <div style={{fontSize:13, fontWeight:900, color:C13.accent, marginBottom:4}}>
            📚 {vi?"Bài 13 — Cho phép · Cấm · Nghĩa vụ · Miễn trừ":en?"Unit 13 — Permission · Prohibition · Obligation · Exemption":"13단원 — 허락·금지·의무·면제"}
          </div>
          <div style={{fontSize:12, color:"#555", background:"#E0F7FA", borderRadius:10, padding:"10px 14px", marginBottom:12, lineHeight:1.8}}>
            {vi ? <>📌 <b>-아/어도 돼요?</b>: hỏi cho phép<br/><b>-(으)면 안 돼요</b>: cấm<br/><b>-아/어야 해요</b>: bắt buộc<br/><b>-지 않아도 돼요</b>: miễn trừ</>
              : en ? <>📌 <b>-아/어도 돼요?</b>: asking permission<br/><b>-(으)면 안 돼요</b>: prohibition<br/><b>-아/어야 해요</b>: obligation<br/><b>-지 않아도 돼요</b>: exemption</>
              : <>📌 <b>-아/어도 돼요?</b>: 허락 질문<br/><b>-(으)면 안 돼요</b>: 금지<br/><b>-아/어야 해요</b>: 의무<br/><b>-지 않아도 돼요</b>: 면제</>}
          </div>
          <div style={{display:"flex", gap:3, marginBottom:16}}>
            {UNIT13_CARDS.map((_,i) => <div key={i} style={{flex:1, height:4, borderRadius:2, background:i<=unitCardIdx?C13.accent:"#ddd"}} />)}
          </div>
          <div style={{background:"white", borderRadius:20, padding:"20px", boxShadow:"0 4px 20px rgba(0,131,143,.12)", marginBottom:16}}>
            <div style={{fontSize:18, fontWeight:900, color:"#333", marginBottom:12, lineHeight:1.5}}>{card.front}</div>
            <input type="text" value={unitCardInput} onChange={e=>{ if(!unitCardRevealed) setUnitCardInput(e.target.value); }} onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Tab") e.stopPropagation(); }} readOnly={unitCardRevealed} placeholder="..." style={{width:"100%", border:`2px solid ${unitCardRevealed?(unitCardInput.trim()===card.blank||unitCardInput.trim()===card.full?"#2E7D32":"#C62828"):C13.border}`, borderRadius:10, padding:"10px 14px", fontSize:15, fontWeight:700, outline:"none", boxSizing:"border-box", color:unitCardRevealed?(unitCardInput.trim()===card.blank||unitCardInput.trim()===card.full?"#2E7D32":"#C62828"):"#333"}} />
            {unitCardRevealed && <div style={{marginTop:10, fontSize:13, color:C13.accent, fontWeight:800}}>✅ {card.full}</div>}
            <div style={{fontSize:12, color:"#C62828", fontWeight:800, marginTop:8}}>{card.hint}</div>
            {!unitCardRevealed && <button onClick={()=>setUnitCardRevealed(true)} style={{width:"100%", marginTop:12, background:`linear-gradient(135deg,${C13.accent},#004D40)`, color:"white", border:"none", borderRadius:50, padding:"11px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>{vi?"Xem đáp án 👀":en?"Show answer 👀":"정답 보기 👀"}</button>}
          </div>
          <div style={{display:"flex", gap:8}}>
            {unitCardIdx > 0 && <button onClick={()=>{ setUnitCardIdx(i=>i-1); setUnitCardInput(""); setUnitCardRevealed(false); }} style={{flex:1, background:"white", border:`2px solid ${C13.border}`, borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:700, color:C13.accent, cursor:"pointer"}}>← {vi?"Trước":en?"Prev":"이전"}</button>}
            {unitCardIdx < UNIT13_CARDS.length-1
              ? <button onClick={()=>{ setUnitCardIdx(i=>i+1); setUnitCardInput(""); setUnitCardRevealed(false); }} style={{flex:1, background:`linear-gradient(135deg,${C13.accent},#004D40)`, color:"white", border:"none", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>{vi?"Tiếp →":en?"Next →":"다음 카드 →"}</button>
              : <button onClick={()=>{ setTestAnswers({}); setTestResult(null); setTestQuestions([]); setStep("test13"); }} style={{flex:1, background:"linear-gradient(135deg,#FF8F00,#E65100)", color:"white", border:"none", borderRadius:50, padding:"12px 0", fontSize:14, fontWeight:900, cursor:"pointer"}}>{vi?"Kiểm tra! 📝":en?"Take test! 📝":"테스트하기! 📝"}</button>}
          </div>
          <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("test12"); }} style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>← {vi?"Quay lại":en?"Back":"뒤로 (12단원 테스트)"}</button>
        </div>
      </div>
    );
  }

  // ── 테스트13: 1~13단원 누적 ──
  if (step === "test13") {
    const vi = lang?.code === "vi"; const en = lang?.code === "en";
    // 포함 단원: 11·12·13단원 (10단원 졸업 — 3회 졸업 규칙 적용)
    const TEST13_Q = [
      // ── 11단원 복습 (8문항) ──
      { id:"t13_1",  q:"날씨가 좋___으면 좋겠습니다.",        answer:"았",  answers:["았"],  hint:"💡 좋다(아계열) → 았으면" },
      { id:"t13_2",  q:"돈이 많___으면 좋겠습니다.",          answer:"았",  answers:["았"],  hint:"💡 많다(아계열) → 았으면" },
      { id:"t13_3",  q:"걱정이 없___으면 좋겠습니다.",        answer:"었",  answers:["었"],  hint:"💡 없다(어계열) → 었으면" },
      { id:"t13_4",  q:"건강___으면 좋겠습니다.",             answer:"했",  answers:["했"],  hint:"💡 건강하다 → 했으면" },
      { id:"t13_5",  q:"봄이 빨리 왔___으면 좋겠습니다.",     answer:"으면 좋겠습니다", answers:["으면 좋겠습니다"],  hint:"💡 오다 → 왔으면" },
      { id:"t13_6",  q:"일이 잘 됐___으면 좋겠습니다.",       answer:"으면 좋겠습니다", answers:["으면 좋겠습니다"],  hint:"💡 되다 → 됐으면" },
      { id:"t13_7",  q:"시험이 쉬웠___으면 좋겠습니다.",      answer:"으면 좋겠습니다", answers:["으면 좋겠습니다"],  hint:"💡 쉽다 → 쉬웠으면" },
      { id:"t13_8",  q:"모두가 행복했___으면 좋겠습니다.",    answer:"으면 좋겠습니다", answers:["으면 좋겠습니다"],  hint:"💡 행복하다 → 행복했으면" },
      // ── 12단원 복습 (8문항) ──
      { id:"t13_9",  q:"저는 오늘 밥을 ___ 먹습니다. (의지)", answer:"안",        answers:["안"],                   hint:"💡 안 + 동사" },
      { id:"t13_10", q:"저는 수영을 ___ 합니다. (능력)",      answer:"못",        answers:["못"],                   hint:"💡 못 + 동사" },
      { id:"t13_11", q:"저는 고기를 먹지 ___. (정중 부정)",   answer:"않습니다",  answers:["않습니다","않습니다."], hint:"💡 -지 않다 → 않습니다" },
      { id:"t13_12", q:"저는 운전을 하지 ___. (능력 부정)",   answer:"못합니다",  answers:["못합니다","못합니다."], hint:"💡 -지 못하다 → 못합니다" },
      { id:"t13_13", q:"여기서 사진을 찍지 ___. (금지)",      answer:"마세요",    answers:["마세요","마세요."],     hint:"💡 -지 마세요 = 금지" },
      { id:"t13_14", q:"교실에서 떠들지 ___. (함께 금지)",    answer:"맙시다",    answers:["맙시다","맙시다."],     hint:"💡 -지 맙시다" },
      { id:"t13_15", q:"수업 중에 전화를 받지 ___. (부정)",   answer:"않습니다",  answers:["않습니다","않습니다."], hint:"💡 -지 않다 → 않습니다" },
      { id:"t13_16", q:"수업 시간에 핸드폰을 보지 ___. (금지)",answer:"마세요",   answers:["마세요","마세요."],     hint:"💡 -지 마세요" },
      // ── 13단원 신규 (14문항) ──
      { id:"t13_17", q:"여기서 사진을 찍어도 ___? (허락 질문)", answer:"됩니까",    answers:["됩니까","됩니까?"],     hint:"💡 -아/어도 됩니까?" },
      { id:"t13_18", q:"네, 찍어도 ___. (허락)",                answer:"됩니다",    answers:["됩니다","됩니다."],     hint:"💡 -아/어도 됩니다" },
      { id:"t13_19", q:"아니요, 찍으면 ___ ___. (금지)",        answer:"안 됩니다", answers:["안 됩니다","안 됩니다."],hint:"💡 -(으)면 안 됩니다" },
      { id:"t13_20", q:"여기서 사진을 찍지 ___. (명령 금지)",   answer:"마세요",    answers:["마세요","마세요."],     hint:"💡 -지 마세요 (세요 유지)" },
      { id:"t13_21", q:"조용히 해야 ___. (의무)",               answer:"합니다",    answers:["합니다","합니다."],     hint:"💡 -아/어야 합니다" },
      { id:"t13_22", q:"예약하지 않아도 ___. (면제)",           answer:"됩니다",    answers:["됩니다","됩니다."],     hint:"💡 -지 않아도 됩니다" },
      { id:"t13_23", q:"수업 중에 자도 ___? (허락 질문)",       answer:"됩니까",    answers:["됩니까","됩니까?"],     hint:"💡 -아/어도 됩니까?" },
      { id:"t13_24", q:"아니요, 자면 ___ ___. (금지)",          answer:"안 됩니다", answers:["안 됩니다","안 됩니다."],hint:"💡 -(으)면 안 됩니다" },
      { id:"t13_25", q:"숙제를 해야 ___. (의무)",               answer:"합니다",    answers:["합니다","합니다."],     hint:"💡 -아/어야 합니다" },
      { id:"t13_26", q:"준비하지 않아도 ___. (면제)",           answer:"됩니다",    answers:["됩니다","됩니다."],     hint:"💡 -지 않아도 됩니다" },
      { id:"t13_27", q:"여기서 음식을 먹어도 ___? (허락)",      answer:"됩니까",    answers:["됩니까","됩니까?"],     hint:"💡 -아/어도 됩니까?" },
      { id:"t13_28", q:"아니요, 먹으면 ___ ___. (금지)",        answer:"안 됩니다", answers:["안 됩니다","안 됩니다."],hint:"💡 -(으)면 안 됩니다" },
      { id:"t13_29", q:"매일 운동해야 ___. (의무)",             answer:"합니다",    answers:["합니다","합니다."],     hint:"💡 -아/어야 합니다" },
      { id:"t13_30", q:"걱정하지 않아도 ___. (면제)",           answer:"됩니다",    answers:["됩니다","됩니다."],     hint:"💡 -지 않아도 됩니다" },
    ];;
    function gradeTest13() {
      let ok=0;
      TEST13_Q.forEach(q=>{ const v=(testAnswers[q.id]||"").trim(); if(q.answers.includes(v)) ok++; });
      setTestResult({score:ok, total:TEST13_Q.length, pass: ok/TEST13_Q.length>=0.8});
    }
    if (testResult) return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#E0F7FA,#B2EBF2)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"24px 16px"}}>
        <DevJumpPanel />
        <div style={{background:"white", borderRadius:24, padding:"32px 24px", maxWidth:360, width:"100%", textAlign:"center", boxShadow:"0 4px 24px rgba(0,131,143,.12)"}}>
          <div style={{fontSize:48, marginBottom:8}}>{testResult.pass?"🎉":"💪"}</div>
          <div style={{fontSize:22, fontWeight:900, color:testResult.pass?"#00838F":"#E65100", marginBottom:8}}>{testResult.score}/{testResult.total}점</div>
          <div style={{fontSize:14, color:"#555", marginBottom:20}}>{testResult.pass?(vi?"Xuất sắc! Sang bài 14!":en?"Excellent! Unit 14!":"훌륭해요! 14단원으로!"):(vi?"Thử lại!":en?"Try again!":"다시 도전!")}</div>
          {testResult.pass
            ? <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setTestResult(null); setTestAnswers({}); setStep("unit14"); }} style={{width:"100%", background:"linear-gradient(135deg,#FF8F00,#E65100)", color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>{vi?"Tiếp — Bài 14! 🚀":en?"Next — Unit 14! 🚀":"14단원으로! 🚀"}</button>
            : <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setTestResult(null); setTestAnswers({}); setStep("unit13"); }} style={{width:"100%", background:`linear-gradient(135deg,#00838F,#004D40)`, color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer"}}>{vi?"Học lại Bài 13 🔄":en?"Retry Unit 13 🔄":"13단원 다시 학습 🔄"}</button>}
          <button onClick={()=>{ setTestResult(null); setTestAnswers({}); }} style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>← {vi?"Thử lại":en?"Try again":"다시 풀기"}</button>
        </div>
      </div>
    );
    return (
      <div style={{minHeight:"100vh", background:"linear-gradient(150deg,#E0F7FA,#B2EBF2)", display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 16px", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"}}>
        <DevJumpPanel />
        <div style={{width:"100%", maxWidth:400}}>
          <div style={{fontSize:14, fontWeight:900, color:"#00838F", marginBottom:4}}>📝 누적 테스트 — 1~13단원</div>
          <div style={{fontSize:12, color:"#aaa", marginBottom:16}}>범위: 이다~허락·금지·의무·면제 (10문제)</div>
          {TEST13_Q.map((q,i) => (
            <div key={q.id} style={{background:"white", borderRadius:12, padding:"12px 14px", marginBottom:8}}>
              <div style={{fontSize:13, fontWeight:700, color:"#333", marginBottom:6}}>{i+1}. {q.q}</div>
              <input type="text" value={testAnswers[q.id]||""} onChange={e=>setTestAnswers(a=>({...a,[q.id]:e.target.value}))} onKeyDown={e=>{ if(e.key==="Enter"||e.key==="Tab") e.stopPropagation(); }} placeholder={vi?"Điền vào...":en?"Fill in...":"여기에 쓰세요..."} style={{width:"100%", border:"2px solid #80DEEA", borderRadius:8, padding:"7px 10px", fontSize:14, outline:"none", boxSizing:"border-box"}} />
              <div style={{fontSize:12, color:"#C62828", fontWeight:800, marginTop:6}}>{q.hint}</div>
            </div>
          ))}
          <button type="button" onClick={gradeTest13} style={{width:"100%", background:`linear-gradient(135deg,#00838F,#004D40)`, color:"white", border:"none", borderRadius:50, padding:"14px 0", fontSize:15, fontWeight:900, cursor:"pointer", marginTop:12}}>{vi?"Nộp bài!":en?"Submit!":"채점하기! 📊"}</button>
          <button onClick={()=>{ setUnitCardIdx(0); setUnitCardInput(""); setUnitCardRevealed(false); setStep("unit13"); }} style={{marginTop:12, background:"none", border:"none", color:"#aaa", fontSize:12, cursor:"pointer", display:"block", margin:"12px auto 0"}}>← {vi?"Quay lại":en?"Back":"뒤로 (13단원 학습)"}</button>
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

// ════════════════════════════════════════════════════════
// ✅ V150: TOPIK 성적표 업로드 & Claude Vision 판독
// ════════════════════════════════════════════════════════
function TopikCertTab({ user }) {
  const [file,       setFile]    = useState(null);
  const [preview,    setPreview] = useState(null);
  const [loading,    setLoading] = useState(false);
  const [result,     setResult]  = useState(null);
  const [submitted,  setSubmitted] = useState(false);
  const [alreadyOk,  setAlreadyOk] = useState(false);
  const fileRef = useRef(null);

  // 이미 승인된 사용자 확인
  useEffect(() => {
    if (!user?.uid) return;
    getDoc(doc(db, "users", user.uid)).then(d => {
      if (d.exists() && d.data().topikApproved) setAlreadyOk(true);
    });
  }, [user]);

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setSubmitted(false);
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target.result);
    reader.readAsDataURL(f);
  }

  async function analyzeAndSubmit() {
    if (!file || !preview) return;
    setLoading(true);
    setResult(null);

    try {
      // base64 추출
      const base64 = preview.split(",")[1];
      const mediaType = file.type || "image/jpeg";

      // Claude Vision API 호출
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: [
              {
                type: "image",
                source: { type: "base64", media_type: mediaType, data: base64 }
              },
              {
                type: "text",
                text: `이 이미지는 한국어능력시험(TOPIK) 성적표입니다.
다음 항목을 분석하고 JSON 형식으로만 답해주세요 (설명 없이 JSON만):
{
  "isTopik": true/false,
  "examLevel": "TOPIK I 또는 TOPIK II 또는 불명",
  "grade": "1급/2급/3급/4급/5급/6급 또는 불합격 또는 판독불가",
  "totalScore": 숫자 또는 null,
  "passed": true/false,
  "confidence": "높음/중간/낮음",
  "reason": "판독 근거 한 줄 요약"
}`
              }
            ]
          }]
        })
      });

      const data = await res.json();
      const raw = data.content?.[0]?.text || "{}";
      let parsed;
      try {
        parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      } catch {
        parsed = { isTopik: false, passed: false, confidence: "낮음", reason: "판독 실패" };
      }
      setResult(parsed);

      // Firestore에 제출 저장
      const subRef = doc(collection(db, "topik_submissions"));
      await setDoc(subRef, {
        uid: user.uid,
        learnerName: user.displayName || user.email,
        learnerEmail: user.email,
        imageUrl: null, // Firebase Storage 미사용 — 관리자는 AI 결과로 판단
        aiResult: `등급: ${parsed.grade} / 점수: ${parsed.totalScore ?? "판독불가"} / 합격여부: ${parsed.passed ? "합격" : "불합격"} / 신뢰도: ${parsed.confidence}
근거: ${parsed.reason}`,
        aiScore: parsed.totalScore,
        aiPassed: parsed.passed,
        aiGrade: parsed.grade,
        aiConfidence: parsed.confidence,
        status: "ai_reviewed",
        submittedAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (e) {
      setResult({ isTopik: false, passed: false, confidence: "낮음", reason: "오류 발생: " + e.message });
    }
    setLoading(false);
  }

  if (alreadyOk) return (
    <div style={{textAlign:"center", padding:"40px 20px"}}>
      <div style={{fontSize:60, marginBottom:16}}>🏆</div>
      <div style={{fontSize:18, fontWeight:900, color:"#00C896", marginBottom:8}}>TOPIK 합격 인증 완료!</div>
      <div style={{fontSize:14, color:"#888"}}>배지와 원어민 대화권이 부여됐어요.</div>
    </div>
  );

  return (
    <div style={{padding:"0 4px"}}>
      <div style={{background:"white", borderRadius:20, padding:24, boxShadow:"0 4px 16px rgba(0,0,0,0.08)", marginBottom:14}}>
        <div style={{fontSize:15, fontWeight:900, color:"#1A3A5C", marginBottom:4}}>🎓 TOPIK 합격 인증</div>
        <div style={{fontSize:13, color:"#888", lineHeight:1.6, marginBottom:20}}>
          TOPIK 성적표 사진을 업로드하면 AI가 즉시 분석해요.<br/>
          분석 결과는 관리자가 최종 확인 후 승인됩니다.
        </div>

        {/* 이미지 업로드 */}
        <div onClick={()=>fileRef.current?.click()}
          style={{border:"2px dashed #2E75B655", borderRadius:16, padding:"28px 20px", textAlign:"center", cursor:"pointer", background:"#F5F8FF", marginBottom:16}}>
          {preview ? (
            <img src={preview} alt="성적표" style={{maxWidth:"100%", maxHeight:200, borderRadius:8, objectFit:"contain"}} />
          ) : (
            <>
              <div style={{fontSize:36, marginBottom:8}}>📄</div>
              <div style={{fontSize:14, fontWeight:700, color:"#2E75B6"}}>성적표 사진 업로드</div>
              <div style={{fontSize:12, color:"#aaa", marginTop:4}}>JPG · PNG · PDF</div>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={handleFile} style={{display:"none"}} />

        {file && !submitted && (
          <button onClick={analyzeAndSubmit} disabled={loading}
            style={{width:"100%", background:"linear-gradient(135deg,#2E75B6,#1A3A5C)", color:"white", border:"none", borderRadius:14, padding:"14px 0", fontSize:14, fontWeight:900, cursor:loading?"not-allowed":"pointer"}}>
            {loading ? "🤖 AI 분석 중..." : "🔍 AI 판독 & 제출하기"}
          </button>
        )}
      </div>

      {/* AI 판독 결과 */}
      {result && (
        <div style={{background:"white", borderRadius:20, padding:20, boxShadow:"0 4px 16px rgba(0,0,0,0.08)"}}>
          <div style={{fontSize:13, fontWeight:800, color:"#1A3A5C", marginBottom:12}}>🤖 AI 판독 결과</div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14}}>
            {[
              ["등급", result.grade || "판독불가"],
              ["점수", result.totalScore ? result.totalScore + "점" : "판독불가"],
              ["합격 여부", result.passed ? "✅ 합격" : "❌ 불합격"],
              ["판독 신뢰도", result.confidence || "낮음"],
            ].map(([k,v]) => (
              <div key={k} style={{background:"#F5F8FF", borderRadius:12, padding:"10px 14px"}}>
                <div style={{fontSize:11, color:"#888", marginBottom:3}}>{k}</div>
                <div style={{fontSize:14, fontWeight:800, color:"#1A3A5C"}}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:12, color:"#888", lineHeight:1.6, marginBottom:submitted?12:0}}>
            📝 {result.reason}
          </div>
          {submitted && (
            <div style={{background:"#E8F5EE", border:"1px solid #00C896", borderRadius:12, padding:"12px 16px", fontSize:13, color:"#1E6B3C", fontWeight:600}}>
              ✅ 제출 완료! 관리자 최종 확인 후 승인 안내드릴게요.
            </div>
          )}
        </div>
      )}
    </div>
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

// ✅ V156: 크롬 TTS — cancel 후 setTimeout으로 확실하게 재생
function speakKo(text, rate=0.65) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  // cancel() 직후 바로 speak하면 크롬에서 씹힘 — 짧은 딜레이 필수
  setTimeout(() => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "ko-KR";
    utter.rate = rate;
    window.speechSynthesis.speak(utter);
  }, 150);
}

export default function App() {
  const [user, setUser] = useState(undefined);
  const [level, setLevel] = useState(null);
  const [tab,   setTab]   = useState("speak");
  const [showStats, setShowStats] = useState(false);
  const [showTopikChoice, setShowTopikChoice] = useState(false); // ✅ V123: 레벨 2단계 선택
  const [begReady, setBegReady] = useState(false); // ✅ V139: 초급 도전 시작 전까지 탭 숨김
  const [showPromo, setShowPromo] = useState(false); // ✅ V143: 홍보 모달
  const [showMigration, setShowMigration] = useState(false); // ✅ V148: 기존 가입자 마이그레이션
  const [userRole, setUserRole] = useState(null); // ✅ V148: 로그인 후 Firestore role
  const [adminMode, setAdminMode] = useState(false);  // ✅ V151: 관리자 모드 토글
  const [joinCode, setJoinCode] = useState(null); // ✅ V148: URL ?join= 파라미터

  // ✅ V148: 기존 가입자 마이그레이션 체크 (dataOwnershipAgreed 없으면 팝업)
  useEffect(()=>{
    if(!user) return;
    getDoc(doc(db, "users", user.uid)).then(d => {
      if(d.exists() && d.data().dataOwnershipAgreed === undefined) {
        setShowMigration(true);
      }
    }).catch(()=>{});
  },[user]);

  // ✅ V148: 로그인 후 role 로드
  useEffect(()=>{
    if(!user) return;
    getDoc(doc(db, "users", user.uid)).then(d => {
      if(d.exists()) setUserRole(d.data().role || "learner");
    }).catch(()=>setUserRole("learner"));
  },[user]);

  // ✅ V148: URL ?join= 파라미터 감지
  useEffect(()=>{
    const params = new URLSearchParams(window.location.search);
    const code = params.get("join");
    if(code) setJoinCode(code.toUpperCase());
  },[]);

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

  // ✅ V148: 기존 가입자 마이그레이션 팝업
  if (showMigration) return (
    <MigrationModal
      user={user}
      onComplete={()=>setShowMigration(false)}
      onReject={()=>setUser(null)}
    />
  );

  // ✅ V151: 관리자 이메일 → 관리자 모드 토글 시 AdminDashboard
  if (user.email === ADMIN_EMAIL && adminMode) return (
    <AdminDashboard user={user} onLogout={handleLogout} onExitAdmin={()=>setAdminMode(false)} />
  );

  // ✅ V148: 교수자 전용 관리 화면 (관리자 이메일도 교수자로 진입)
  if (userRole === "instructor") return (
    <>
      <InstructorDashboard user={user} onLogout={handleLogout} isAdmin={user.email === ADMIN_EMAIL} onEnterAdmin={()=>setAdminMode(true)} />
      {joinCode && (
        <JoinClassModal
          user={user}
          code={joinCode}
          onClose={(success)=>{
            setJoinCode(null);
            window.history.replaceState({}, "", window.location.pathname);
          }}
        />
      )}
    </>
  );

  // ✅ V148: 학습자 클래스 참여 팝업 (URL ?join= 감지)
  // joinCode가 있고 학습자인 경우 → 앱 위에 팝업 오버레이

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
      {/* ✅ V148: 학습자 클래스 참여 팝업 */}
      {joinCode && userRole === "learner" && (
        <JoinClassModal
          user={user}
          code={joinCode}
          onClose={(success)=>{
            setJoinCode(null);
            window.history.replaceState({}, "", window.location.pathname);
          }}
        />
      )}
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
          {[["speak","🗣️","프리토킹",C.pink,"#FCE8F3"],["write","✍️","논술",C.teal,"#E8FAF8"],["tutor","🎓","하이터치",C.purple,"#F3EEFF"],["game","🎮","게임",C.yellow,"#FFFBE8"],["topik","🏆","TOPIK인증","#2E75B6","#F0F4FF"]].map(([k,emoji,label,col,bg])=>(
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
        {tab==="topik"&&<TopikCertTab user={user}/>}
      </div>
    </div>
  );
}
