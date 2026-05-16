// src/PhonicsData.js
// ✅ V206: 대용량 학습 데이터를 외부 파일로 분리하여 코드 무결성 확보 (3428줄 제한 완전 해결)
export const PRON_STEPS_V206 = [
  { id: "vowel1", emoji: "🔤", title: "01. 기본 모음 14개", desc: "기본 단모음의 소리와 형태를 익히고 발화합니다.",
    items: [
      { char: "ㅏ", word: "아버지", meaning: "bố / father" },
      { char: "ㅑ", word: "야채",   meaning: "rau củ / vegetable" },
      { char: "ㅓ", word: "어머니", meaning: "mẹ / mother" },
      { char: "ㅕ", word: "여행",   meaning: "du lịch / travel" },
      { char: "ㅗ", word: "오빠",   meaning: "anh trai / older brother" },
      { char: "ㅛ", word: "요리",   meaning: "nấu ăn / cooking" },
      { char: "ㅜ", word: "우리",   meaning: "chúng ta / we" },
      { char: "ㅠ", word: "유리",   meaning: "thủy tinh / glass" },
      { char: "ㅡ", word: "음식",   meaning: "thức ăn / food" },
      { char: "ㅣ", word: "이름",   meaning: "tên / name" }
    ],
    tip: "문법 용어 배제! 입 모양과 소리의 패턴을 여러 번 듣고 입으로 암송하십시오."
  },
  { id: "vowel2", emoji: "🔤", title: "02. 복합 모음 7개", desc: "이중 모음 및 복합 모음의 결합 원리를 이해합니다.",
    items: [
      { char: "ㅘ", word: "화요일", meaning: "thứ ba / Tuesday" },
      { char: "ㅙ", word: "왜",     meaning: "tại sao / why" },
      { char: "ㅚ", word: "최고",   meaning: "tốt nhất / the best" },
      { char: "ㅝ", word: "원하다", meaning: "muốn / to want" },
      { char: "ㅞ", word: "웨이터", meaning: "bồi bàn / waiter" },
      { char: "ㅟ", word: "위험",   meaning: "nguy hiểm / danger" },
      { char: "ㅢ", word: "의사",   meaning: "bác sĩ / doctor" }
    ],
    tip: "복합 모음은 두 소리가 부드럽게 하나로 합쳐지는 과정입니다."
  },
  { id: "ssang", emoji: "💪", title: "03. 쌍자음 긴장음", desc: "구어 발화 시 뇌를 여는 강한 긴장음을 연습합니다.",
    items: [
      { char: "ㄲ", word: "까치",   meaning: "chim ác là / magpie" },
      { char: "ㄸ", word: "딸기",   meaning: "dâu tây / strawberry" },
      { char: "ㅃ", word: "빠르다", meaning: "nhanh / fast" },
      { char: "ㅆ", word: "씩씩하다", meaning: "dũng cảm / brave" },
      { char: "ㅉ", word: "짜다",   meaning: "mặn / salty" }
    ],
    tip: "목에 부드럽게 힘을 주어 소리를 밖으로 강하게 밀어내며 암송하십시오."
  },
  { id: "batchim1", emoji: "🧱", title: "04. 받침 [ㄱ, ㄲ, ㅋ]", desc: "학교 및 교육 현장 생존 어휘와 받침을 결합합니다.",
    items: [
      { char: "국", word: "국",     meaning: "canh / soup" },
      { char: "책", word: "책",     meaning: "sách / book" },
      { char: "학교", word: "학교",   meaning: "trường học / school" }
    ],
    tip: "마지막 자음 소리가 입 밖으로 나가지 않도록 안으로 모아 닫아줍니다."
  },
  { id: "batchim2", emoji: "🧱", title: "05. 받침 [ㅇ]", desc: "가족 관계 및 기초 사회생활 필수 어휘를 연동합니다.",
    items: [
      { char: "영어", word: "영어",   meaning: "tiếng Anh / English" },
      { char: "방", word: "방",     meaning: "phòng / room" },
      { char: "강", word: "강",     meaning: "sông / river" }
    ],
    tip: "코를 울리며 소리의 꼬리를 부드럽게 이어주는 소리입니다."
  },
  { id: "batchim3", emoji: "🧱", title: "06. 받침 [ㅁ]", desc: "가족·음식·의료 상황 소통 어휘를 바인딩합니다.",
    items: [
      { char: "엄마", word: "엄마",   meaning: "mẹ / mom" },
      { char: "몸", word: "몸",     meaning: "cơ thể / body" },
      { char: "봄", word: "봄",     meaning: "mùa xuân / spring" }
    ],
    tip: "입술을 가볍게 다물어 소리가 입 안에 머물도록 유도하십시오."
  },
  { id: "batchim4", emoji: "🧱", title: "07. 받침 [ㅂ, ㅍ]", desc: "초기 정착 직업 및 감정 표현 어휘를 구사합니다.",
    items: [
      { char: "밥", word: "밥",     meaning: "cơm / rice" },
      { char: "집", word: "집",     meaning: "nhà / house" },
      { char: "앞", word: "앞",     meaning: "phía trước / front" }
    ],
    tip: "양 입술을 맞부딪치며 소리를 멈추는 매커니즘입니다."
  },
  { id: "batchim5", emoji: "🧱", title: "08. 받침 [ㄹ] (일상 분기점)", desc: "시간·일상·신체 표현 어휘를 자동 매핑합니다. (대화 가능 분기점)",
    items: [
      { char: "말", word: "말",     meaning: "ngựa/lời / word" },
      { char: "글", word: "글",     meaning: "chữ viết / writing" },
      { char: "일", word: "일",     meaning: "công việc / work" }
    ],
    tip: "⭐ 중요 마일스톤: 혀끝을 위 잇몸에 대며 소리를 부드럽게 굴려줍니다."
  },
  { id: "batchim6", emoji: "🧱", title: "09. 받침 [ㄴ]", desc: "요일, 나라이름 등 일상 자원을 융합합니다.",
    items: [
      { char: "눈", word: "눈",     meaning: "mắt/tuyết / eye" },
      { char: "손", word: "손",     meaning: "tay / hand" },
      { char: "문", word: "문",     meaning: "cửa / door" }
    ],
    tip: "혀를 앞니 안쪽에 대며 공기를 코로 살짝 내보냅니다."
  },
  { id: "batchim7", emoji: "🧱", title: "10. 받침 [ㄷ, ㅌ, ㅅ, ㅆ, ㅈ, ㅊ, ㅎ]", desc: "동일 음가인 ㄷ 받침 계열의 음소를 완전 통합 마스터합니다.",
    items: [
      { char: "옷", word: "옷",     meaning: "quần áo / clothes" },
      { char: "꽃", word: "꽃",     meaning: "hoa / flower" },
      { char: "듣다", word: "듣다",   meaning: "nghe / listen" }
    ],
    tip: "글자 모양은 모두 다르지만 받침 위치에서는 모두 [ㄷ] 음가로 통일됩니다."
  },
  { id: "double", emoji: "🔤", title: "11. 겹받침 변신", desc: "글자 형태소 변신 원리를 이해하여 공포증을 해소합니다.",
    items: [
      { char: "닭", word: "닭",     meaning: "con gà / chicken" },
      { char: "앉다", word: "앉다",   meaning: "ngồi / sit" },
      { char: "읽다", word: "읽다",   meaning: "đọc / read" }
    ],
    tip: "자음이 두 개 쓰여있지만 겁먹지 말고 규칙에 따라 하나만 발음하십시오."
  },
  { id: "liaison", emoji: "🔗", title: "12. 연음 법칙 (최종 관문)", desc: "어휘와 조사가 결합할 때의 소리 변화를 최종 측정합니다.",
    items: [
      { char: "책이", word: "책이",   meaning: "[채기] 로 이어져 소리남" },
      { char: "집에", word: "집에",   meaning: "[지베] 로 이어져 소리남" },
      { char: "한국어", word: "한국어", meaning: "[한구거] 로 이어져 소리남" }
    ],
    tip: "⭐ 최종 발음 관문: 뒤에 모음 조사 형제가 오면 받침이 빈자리로 넘어가 춤을 춥니다."
  }
];
