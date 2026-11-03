// ==========================================
// 📚 1. 카테고리 및 행사 데이터 (사업계획서 반영 완료)
// ==========================================
const quickCardsData = {
  "행정 안내": [
    {
      icon: "📄",
      title: "<strong>주민등록등본</strong><br />무인발급기 위치",
      query: "주민등록등본 발급기 어딨어?",
      bg: "bg-blue",
    },
    {
      icon: "🏛️",
      title: "<strong>시청/구청</strong><br />민원 절차 안내",
      query: "구청 민원실 업무 시간",
      bg: "bg-green",
    },
    {
      icon: "💻",
      title: "<strong>정부24</strong><br />주요 서비스 안내",
      query: "정부24에서 뭐 할 수 있어?",
      bg: "bg-yellow",
    },
    {
      icon: "📜",
      title: "<strong>가족관계증명서</strong><br />발급 수수료",
      query: "가족관계증명서 발급 비용",
      bg: "bg-purple",
    },
  ],
  "복지 서비스": [
    {
      icon: "👵",
      title: "<strong>기초연금</strong><br />신청 자격 확인",
      query: "기초연금 신청 자격",
      bg: "bg-blue",
    },
    {
      icon: "🎓",
      title: "<strong>청년수당</strong><br />지원 혜택 안내",
      query: "청년수당 어떻게 받아?",
      bg: "bg-green",
    },
    {
      icon: "👶",
      title: "<strong>양육지원</strong><br />아동수당 등 혜택",
      query: "양육지원 혜택 알려줘",
      bg: "bg-yellow",
    },
    {
      icon: "🏠",
      title: "<strong>주거 복지</strong><br />지원 제도 안내",
      query: "주거 복지 지원 제도 알려줘",
      bg: "bg-purple",
    },
  ],
  "교통 정보": [
    {
      icon: "🅿️",
      title: "<strong>공영 주차장</strong><br />실시간 빈자리",
      query: "광주 공영주차장 현황 알려줘",
      bg: "bg-blue",
    },
    {
      icon: "🚌",
      title: "<strong>실시간 버스</strong><br />도착 정보",
      query: "버스 도착 정보 알려줘",
      bg: "bg-green",
    },
    {
      icon: "🌤️",
      title: "오늘의 <strong>날씨</strong><br />및 미세먼지",
      query: "오늘 광주 날씨는 어때?",
      bg: "bg-yellow",
    },
    {
      icon: "🚦",
      title: "<strong>교통 안전</strong><br />사고 예방 안내",
      query: "교통 사고 예방 방법 알려줘",
      bg: "bg-purple",
    },
  ],
  "에너지/충전": [
    {
      icon: "⚡",
      title: "<strong>전기차 충전소</strong><br />근처 충전소 안내",
      query: "광주 전기차 충전소 현황 알려줘",
      bg: "bg-blue",
    },
    {
      icon: "☀️",
      title: "<strong>태양광 발전소</strong><br />위치 및 용량",
      query: "광주 태양광 발전소 정보 알려줘",
      bg: "bg-green",
    },
    {
      icon: "🌱",
      title: "광주광역시<br /><strong>신재생에너지</strong> 현황",
      query: "광주 신재생에너지 현황 알려줘",
      bg: "bg-yellow",
    },
    {
      icon: "🌎",
      title: "<strong>탄소중립</strong> 실천 안내",
      query: "탄소중립 실천 방법 알려줘",
      bg: "bg-purple",
    },
  ],
  "안전 정보": [
    {
      icon: "🚨",
      title: "<strong>재난 발생</strong><br />대응 방법 안내",
      query: "재난 발생 시 대처 방법 알려줘",
      bg: "bg-blue",
    },
    {
      icon: "🔥",
      title: "<strong>화재 예방</strong><br />안전 수칙 안내",
      query: "화재 예방 방법 알려줘",
      bg: "bg-green",
    },
    {
      icon: "🏢",
      title: "<strong>임대아파트</strong><br />스프링클러 현황",
      query: "임대아파트 스프링클러 현황 알려줘",
      bg: "bg-yellow",
    },
    {
      icon: "📞",
      title: "<strong>긴급 신고</strong><br />연락 방법 안내",
      query: "긴급 신고 전화번호 알려줘",
      bg: "bg-purple",
    },
  ],
  "문화·행사": [
    {
      icon: "🏢",
      title: "<strong>전일빌딩245</strong> 공지사항 및 행사 안내",
      query: "전일빌딩 행사 일정 알려줘",
      category: "전일빌딩 공지사항",
      bg: "bg-blue",
    },
    {
      icon: "🎆",
      title: "광주 <strong>지역 축제</strong><br />일정 확인",
      query: "광주 지역 축제 일정",
      category: "광주 축제 일정",
      bg: "bg-green",
    },
    {
      icon: "💻",
      title: "<strong>광주평생학습포털</strong><br />인기 강좌 안내",
      query: "디지털 교육 프로그램 알려줘",
      category: "AI 디지털 교육",
      bg: "bg-yellow",
    },
  ],
};

let eventListData = [];

async function loadJeonilEvents() {
  try {
    const res = await fetch("/api/jeonil_events");

    const data = await res.json();

    eventListData = data.map((item, index) => ({
      id: index + 1,
      category: "전일빌딩 공지사항",
      title: item.title,
      date: item.date,
      desc: item.title,
      url: item.url,
      imgContent: `
        <div style="
            width: 100%;
            height: 240px;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #fff;
            border-radius: 10px;
            padding: 20px;
            box-sizing: border-box;
            overflow: hidden;
        ">
            <img
                src="https://www.gwangju.go.kr/home/jeonil/images/sub/info_01.jpg"
                style="
                    width: clamp(120px, 12vw, 220px);
                    height: clamp(120px, 12vw, 220px);
                    object-fit: contain;
                    display: block;
                "
            >
        </div>
      `,
    }));
  } catch (e) {
    console.error(e);
  }
}

async function loadGwangjuEvents() {
  try {
    const res = await fetch("/api/gwangju_events");

    const data = await res.json();

    const startId = eventListData.length + 1;

    const events = data.map((item, index) => ({
      id: startId + index,

      category: "광주 축제 일정",

      title: item.title,

      date: item.period,

      location: item.location,

      desc: `
            <strong>시간</strong> : ${item.time || "-"}<br>
            <strong>연락처</strong> : ${item.contact || "-"}<br>
            <strong>요금</strong> : ${item.fee || "무료"}
            `,

      url: item.url,

      image: item.image,
    }));

    eventListData.push(...events);
  } catch (e) {
    console.error(e);
  }
}

async function loadGieCourses() {
  try {
    const res = await fetch("/api/gie_courses");

    const data = await res.json();

    const startId = eventListData.length + 1;

    const courses = data.map((item, index) => ({
      id: startId + index,
      category: "AI 디지털 교육",
      title: item.title,
      date: item.type,
      location: item.institution,

      desc: `
        <strong>강사</strong> : ${item.instructor || "-"}<br>
        <strong>분야</strong> : ${item.category || "-"}
      `,

      url: item.url,

      image: item.image,
    }));

    eventListData.push(...courses);
  } catch (e) {
    console.error(e);
  }
}

// ==========================================
// 🔊 2. 오디오 및 구글 TTS 설정
// ==========================================
let ttsAudio = new Audio();
ttsAudio.autoplay = true;

// 브라우저의 오디오 자동 재생 정책(Autoplay Policy) 우회
document.addEventListener(
  "click",
  () => {
    if (ttsAudio.muted || ttsAudio.paused) {
      ttsAudio.muted = true;
      ttsAudio.src =
        "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRh" +
        "AgAAAAEA";
      ttsAudio.play().catch(() => {});
    }
  },
  { once: true },
);

function convertTimeForTTS(text) {
  const hourMap = {
    1: "한",
    2: "두",
    3: "세",
    4: "네",
    5: "다섯",
    6: "여섯",
    7: "일곱",
    8: "여덟",
    9: "아홉",
    10: "열",
    11: "열한",
    12: "열두",
  };

  const numberMap = {
    0: "영",
    1: "일",
    2: "이",
    3: "삼",
    4: "사",
    5: "오",
    6: "육",
    7: "칠",
    8: "팔",
    9: "구",
    10: "십",
    20: "이십",
    30: "삼십",
    40: "사십",
    50: "오십",
  };

  return text.replace(
    /(오전|오후)\s*(\d+)시\s*(\d+)분\s*(\d+)초/g,
    (match, ampm, hour, min, sec) => {
      const h = hourMap[hour] || hour;
      const m = numberMap[min] || min;
      const s = numberMap[sec] || sec;
      return `${ampm} ${h} 시 ${m} 분 ${s} 초`;
    },
  );
}

function playTTS(text) {
  const unitMap = {
    kg: "킬로그램",
    g: "그램",
    km: "킬로미터",
    m: "미터",
    cm: "센티미터",
    mm: "밀리미터",
    ml: "밀리리터",
    l: "리터",
    "℃": "도",
    "°C": "도",
    "%": "퍼센트",
  };

  let cleanedText = text
    .replace(/<button[\s\S]*?<\/button>/gi, "")
    .replace(/<a[\s\S]*?<\/a>/gi, "")
    .replace(/<br>/g, "\n")
    .replace(/<\/?[^>]+>/g, "");

  cleanedText = convertTimeForTTS(cleanedText);

  cleanedText = cleanedText.replace(
    /(\d+)\s*[-~]\s*(\d+)\s*(kg|g|km|m|cm|mm|ml|l|℃|°C|%|인치|도)?/g,
    (_, from, to, unit) =>
      `${from}에서 ${to}${unitMap[unit] ? " " + unitMap[unit] : unit || ""}`,
  );

  cleanedText = cleanedText
    .replace(/([-]?\d+)\.(\d+)/g, "$1 점 $2")
    .replace(/[(){}\\[\]<>\*#]/g, "")
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanedText) return;

  fetch("/get_tts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: cleanedText }),
  })
    .then((res) => {
      if (!res.ok) throw new Error("TTS 요청 실패");
      return res.blob();
    })
    .then((blob) => {
      const url = URL.createObjectURL(blob);

      ttsAudio.src = url;
      ttsAudio.muted = false;

      // 기존 종료 이벤트 제거 후 새로 설정
      ttsAudio.onended = function () {
        console.log("🔊 음성 재생 완료");

        const modal = document.getElementById("voiceModal");

        // 음성 모달이 열려 있을 때만 닫기
        if (modal && modal.classList.contains("open")) {
          setTimeout(() => {
            closeVoice();
          }, 300);
        }

        // 임시 Object URL 정리
        URL.revokeObjectURL(url);
      };

      ttsAudio.onerror = function (event) {
        console.error("🔊 음성 재생 오류:", event);

        const modal = document.getElementById("voiceModal");

        if (modal && modal.classList.contains("open")) {
          setTimeout(() => {
            closeVoice();
          }, 300);
        }

        URL.revokeObjectURL(url);
      };

      ttsAudio.play().catch((err) => {
        console.error("🔊 음성 재생 실패:", err);
      });
    })
    .catch((err) => {
      console.error("TTS 오류:", err);
    });
}

// ==========================================
// 💬 3. 마이크 관련은 common.js에서 구현
// ==========================================
// ==========================================
// 💬 4. 메인 채팅 통신 로직 (Ollama + TTS연동)
// ==========================================
async function sendChat(isVoiceMode = false, voiceMessage = null) {
  const input = document.getElementById("chatInput");
  const startTime = performance.now();

  // 음성 모드면 음성인식 결과를 직접 사용
  const msg = isVoiceMode
    ? (voiceMessage || "").trim()
    : input
      ? input.value.trim()
      : "";

  if (!msg) {
    console.warn("보낼 메시지가 없습니다.");
    return;
  }

  const container = document.getElementById("chatMessages");
  const voiceTranscript = document.getElementById("voiceTranscript");

  // ==========================================
  // 🎙️ 음성 모드
  // ==========================================
  if (isVoiceMode) {
    if (voiceTranscript) {
      voiceTranscript.textContent = "🤖 답변을 생성하고 있습니다...";
    }
  }

  // ==========================================
  // 💬 일반 채팅 모드에서만 사용자 메시지 표시
  // ==========================================
  let typingDiv = null;

  if (!isVoiceMode && container) {
    const userDiv = document.createElement("div");

    userDiv.className = "msg user";

    userDiv.innerHTML = `
      <div class="msg-avatar">👤</div>
      <div class="msg-bubble">${msg}</div>
    `;

    container.appendChild(userDiv);

    if (input) {
      input.value = "";
    }

    container.scrollTop = container.scrollHeight;

    // AI 로딩 메시지
    typingDiv = document.createElement("div");

    typingDiv.className = "msg ai";

    typingDiv.innerHTML = `
      <div class="msg-avatar">🤖</div>
      <div class="msg-bubble" style="color:var(--text-muted)">
        데이터 검색 중... ⏳
      </div>
    `;

    container.appendChild(typingDiv);

    container.scrollTop = container.scrollHeight;
  }

  try {
    console.log("📤 서버로 전송:", msg);

    const response = await fetch("/send_message", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        message: msg,
      }),
    });

    console.log("📥 서버 응답 상태:", response.status);

    if (!response.ok) {
      throw new Error(`서버 응답 오류: ${response.status}`);
    }

    const data = await response.json();
    const endTime = performance.now();

    console.log("🤖 AI 응답:", data);
    console.log(`AI 응답시간: ${((endTime - startTime) / 1000).toFixed(2)}초`);

    const botReply = data.response || "내용이 없습니다.";
    const ttsReply = data.tts_text || botReply;

    // ==========================================
    // 💬 일반 채팅일 때만 AI 답변 표시
    // ==========================================
    if (!isVoiceMode && typingDiv) {
      typingDiv.querySelector(".msg-bubble").innerHTML = botReply.replace(
        /\n/g,
        "<br>",
      );

      if (container) {
        requestAnimationFrame(() => {
          container.scrollTop = container.scrollHeight;
        });
      }
    }

    // ==========================================
    // 🔊 음성 모드
    // ==========================================
    if (isVoiceMode) {
      console.log("🔊 TTS 요청:", ttsReply);

      // 음성으로 재생되는 답변과 동일한 내용을 자막으로 표시
      if (voiceTranscript) {
        voiceTranscript.textContent = ttsReply;
      }

      // 자막이 먼저 화면에 표시된 후 음성 재생
      setTimeout(() => {
        playTTS(ttsReply);
      }, 300);
    } else {
      // 일반 채팅에서도 TTS 재생
      playTTS(ttsReply);
    }
  } catch (error) {
    console.error("❌ 채팅 통신 오류:", error);

    if (isVoiceMode && voiceTranscript) {
      voiceTranscript.textContent = "죄송합니다. 답변을 가져오지 못했습니다.";

      setTimeout(() => {
        closeVoice();
      }, 2000);
    }

    if (!isVoiceMode && typingDiv) {
      typingDiv.querySelector(".msg-bubble").textContent =
        "죄송합니다. 답변을 가져오지 못했습니다.";
    }
  }
}
// ==========================================
// 🎨 5. UI 상호작용 및 네비게이션 함수들
// ==========================================
function handleCardClick(cardElement, serviceName, query) {
  const allCards = document.querySelectorAll(".quick-card");
  allCards.forEach((card) => card.classList.remove("active-quick-card"));

  if (cardElement) cardElement.classList.add("active-quick-card");

  if (serviceName === "문화·행사") {
    if (query === "all") {
      renderEventGrid(eventListData);
    } else {
      const filteredEvents = eventListData.filter(
        (evt) => evt.category === query,
      );
      renderEventGrid(filteredEvents);
    }
  } else {
    document.getElementById("chatInput").value = query;
    sendChat();
  }
}

function updateQuickCards(serviceName) {
  const container = document.getElementById("quickCardsContainer");
  const title = document.getElementById("leftCardTitle");
  const cards = quickCardsData[serviceName] || quickCardsData["행정 안내"];

  // 제목 변경

  if (serviceName === "문화·행사") {
    title.innerHTML = `<strong>${serviceName}</strong> 카테고리`;
  } else {
    title.innerHTML = `<strong>${serviceName}</strong> 추천 질문`;
  }

  container.innerHTML = "";

  if (serviceName === "문화·행사") {
    const allBtnHTML = `
              <div class="quick-card fade-in bg-purple active-quick-card" style="animation-delay: 0s; padding: 20px 16px; cursor: pointer;" onclick="handleCardClick(this, '${serviceName}', 'all')">
                <div class="qc-icon">📋</div>
                <div class="qc-text" style="font-size:16px;"><strong>전체 행사 보기</strong></div>
              </div>
            `;
    container.insertAdjacentHTML("beforeend", allBtnHTML);
  }

  cards.forEach((card, index) => {
    const delay = (index + 1) * 0.05;
    const cardHTML = `
            <div class="quick-card fade-in ${card.bg}" style="animation-delay: ${delay}s; cursor: pointer;" onclick="handleCardClick(this, '${serviceName}', '${
              serviceName === "문화·행사" ? card.category : card.query
            }')">
              <div class="qc-icon">${card.icon}</div>
              <div class="qc-text">${card.title}</div>
            </div>
          `;
    container.insertAdjacentHTML("beforeend", cardHTML);
  });
}

function selectService(cardElement, service) {
  const cards = document.querySelectorAll(".svc-card");
  cards.forEach((card) => card.classList.remove("active-svc"));
  cardElement.classList.add("active-svc");

  // 서비스 이용 기록
  fetch("/api/service_usage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      service: service,
    }),
  });

  updateQuickCards(service);

  if (service === "문화·행사") {
    showEventList();
  } else {
    showChatWindow();
  }
}

function showEventList() {
  document.getElementById("chatWindowArea").style.display = "none";
  document.getElementById("eventListArea").style.display = "flex";
  renderEventGrid(eventListData);
}

function showChatWindow() {
  document.getElementById("eventListArea").style.display = "none";
  document.getElementById("chatWindowArea").style.display = "flex";
}

function returnToChat() {
  const firstCard = document.querySelector(".svc-card");
  selectService(firstCard, "행정 안내");
}

function renderEventGrid(dataToRender) {
  const container = document.getElementById("eventGridContainer");
  container.innerHTML = "";

  if (!dataToRender || dataToRender.length === 0) {
    container.innerHTML =
      '<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--' +
      'text-dim);">해당 카테고리의 행사가 없습니다.</div>';
    return;
  }

  dataToRender.forEach((evt, index) => {
    const delay = index * 0.1;
    const card = `
            <div class="evt-card fade-in" style="animation-delay: ${delay}s" onclick="openEventModal(${evt.id})">
              <div class="evt-img-placeholder">

                  ${
                    evt.imgContent
                      ? evt.imgContent
                      : evt.image
                        ? `<img src="${evt.image}" class="event-thumb">`
                        : "🏢"
                  }

              </div>
              <div class="evt-info">
                <div class="evt-title">${evt.title}</div>
                <div class="evt-meta">📅 ${evt.date}</div>
                ${
                  evt.category !== "전일빌딩 공지사항"
                    ? `<div class="evt-meta">📍 ${evt.location}</div>`
                    : ""
                }
              </div>
            </div>
          `;
    container.insertAdjacentHTML("beforeend", card);
  });
}

// 모달 제어
function openEventModal(id) {
  const evt = eventListData.find((e) => e.id === id);

  if (!evt) return;

  document.getElementById("modalEventTitle").textContent = evt.title;

  document.getElementById("modalEventImage").innerHTML = evt.imgContent
    ? evt.imgContent
    : evt.image
      ? `<img src="${evt.image}" style="width:100%;border-radius:10px;">`
      : "";

  document.getElementById("modalEventDate").innerHTML =
    `<strong>📅 기간 :</strong> ${evt.date}`;

  const locationElement = document.getElementById("modalEventLocation");

  if (evt.category === "전일빌딩 공지사항") {
    locationElement.style.display = "none";
  } else {
    locationElement.style.display = "block";
    locationElement.innerHTML = `<strong>📍 장소 :</strong> ${evt.location}`;
  }

  document.getElementById("modalEventDesc").innerHTML = `

      ${evt.desc}

      <br><br>

      <a href="${evt.url}" target="_blank" class="btn">

        상세보기

      </a>

  `;

  document.getElementById("eventModal").classList.add("active");
}

function closeEventModal() {
  document.getElementById("eventModal").classList.remove("active");
}
function openMapModal() {
  document.getElementById("mapModal").classList.add("active");
}
function closeMapModal() {
  document.getElementById("mapModal").classList.remove("active");
}

let SMART_CITY_QUIZZES = [];
let currentSmartCityQuiz = null;
let currentQuizNumber = 1;

// ==========================================
// 🚀 6. 초기화
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  await loadSmartCityQuizzes();
  await loadJeonilEvents();
  await loadGwangjuEvents();
  await loadGieCourses();

  const urlParams = new URLSearchParams(window.location.search);
  const serviceParam = urlParams.get("service");
  const targetServiceName = serviceParam ? serviceParam : "행정 안내";

  const cards = document.querySelectorAll(".svc-card");
  let targetCardElement = null;

  cards.forEach((card) => {
    const nameElement = card.querySelector(".svc-name");
    if (nameElement && nameElement.textContent.trim() === targetServiceName) {
      targetCardElement = card;
    }
  });

  if (targetCardElement) {
    selectService(targetCardElement, targetServiceName);
  } else if (cards.length > 0) {
    selectService(cards[0], "행정 안내");
  }
});

/* =========================================================
   스마트 퀴즈 데이터 불러오기
========================================================= */

async function loadSmartCityQuizzes() {
  try {
    const response = await fetch("/api/smart-city-quizzes");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    SMART_CITY_QUIZZES = await response.json();

    console.log(`[SmartQuiz] ${SMART_CITY_QUIZZES.length}개 문제 로드 완료`);
  } catch (error) {
    console.error("[SmartQuiz] 퀴즈 데이터를 불러오지 못했습니다.", error);
  }
}

/* =========================================================
   랜덤 퀴즈 선택
========================================================= */

function getRandomSmartCityQuiz() {
  if (!SMART_CITY_QUIZZES.length) {
    console.warn("[SmartQuiz] 퀴즈 데이터가 없습니다.");

    return null;
  }

  const randomIndex = Math.floor(Math.random() * SMART_CITY_QUIZZES.length);

  return SMART_CITY_QUIZZES[randomIndex];
}

/* =========================================================
   퀴즈 모달 열기
========================================================= */

function openSmartCityQuiz() {
  const modal = document.getElementById("smartCityQuizModal");

  if (!modal) {
    console.warn("[SmartQuiz] quiz modal not found");

    return;
  }

  // 퀴즈 초기화
  resetSmartCityQuiz();

  // 모달 표시
  modal.style.display = "flex";

  // 배경 스크롤 방지
  document.body.style.overflow = "hidden";
}

/* =========================================================
   퀴즈 모달 닫기
========================================================= */

function closeSmartCityQuiz() {
  const modal = document.getElementById("smartCityQuizModal");

  if (!modal) return;

  modal.style.display = "none";

  // 배경 스크롤 복구
  document.body.style.overflow = "";
}

function updateQuizDestinationButton() {
  const textElement = document.getElementById("smartQuizDashboardText");

  if (!textElement || !currentSmartCityQuiz) {
    return;
  }

  const service = currentSmartCityQuiz.service;
  const target = currentSmartCityQuiz.target;

  if (service === "문화·행사") {
    switch (target) {
      case "jeonil":
        textElement.textContent = "전일빌딩 행사 보러가기";
        break;

      case "festival":
        textElement.textContent = "광주 축제 보러가기";
        break;

      case "lifelong":
        textElement.textContent = "인터넷 강좌 보러가기";
        break;

      default:
        textElement.textContent = "문화·행사 보러가기";
    }

    return;
  }

  if (service === "대시보드") {
    textElement.textContent = "대시보드에서 확인하기";
    return;
  }

  if (service === "지도") {
    textElement.textContent = "지도에서 확인하기";
    return;
  }

  textElement.textContent = "관련 서비스 확인하기";
}

/* =========================================================
   퀴즈 초기화
========================================================= */

function resetSmartCityQuiz() {
  const question = document.getElementById("smartQuizQuestion");

  const number = document.getElementById("smartQuizNumber");

  const optionsContainer = document.getElementById("smartQuizOptions");

  const result = document.getElementById("smartQuizResult");

  if (!question || !number || !optionsContainer || !result) {
    return;
  }

  /* 랜덤 문제 선택 */

  currentSmartCityQuiz = getRandomSmartCityQuiz();

  if (!currentSmartCityQuiz) {
    return;
  }

  updateQuizDestinationButton();
  /* 문제 번호 */

  number.textContent = `QUESTION ${String(currentQuizNumber).padStart(2, "0")}`;

  /* 문제 */

  question.textContent = currentSmartCityQuiz.question;

  /* 기존 선택지 제거 */

  optionsContainer.innerHTML = "";

  /* 선택지 번호 */

  const optionNumbers = ["①", "②", "③", "④"];

  /* 선택지 생성 */

  currentSmartCityQuiz.options.forEach((option, index) => {
    const button = document.createElement("button");

    button.type = "button";

    button.className = "smart-quiz-option";

    button.innerHTML = `

        <span class="smart-quiz-option-number">
          ${optionNumbers[index] || ""}
        </span>

        <span class="smart-quiz-option-text">
          ${option}
        </span>

      `;

    button.addEventListener("click", () => {
      selectSmartCityQuizAnswer(index);
    });

    optionsContainer.appendChild(button);
  });

  /* 결과 초기화 */

  result.style.display = "none";

  const resultIcon = document.getElementById("smartQuizResultIcon");

  const resultTitle = document.getElementById("smartQuizResultTitle");

  const resultDescription = document.getElementById(
    "smartQuizResultDescription",
  );

  if (resultIcon) resultIcon.textContent = "";

  if (resultTitle) resultTitle.textContent = "";

  if (resultDescription) resultDescription.textContent = "";
}

/* =========================================================
   정답 선택
========================================================= */
function selectSmartCityQuizAnswer(selectedIndex) {
  const optionButtons = document.querySelectorAll(
    "#smartQuizOptions .smart-quiz-option",
  );

  const result = document.getElementById("smartQuizResult");
  const resultIcon = document.getElementById("smartQuizResultIcon");
  const resultTitle = document.getElementById("smartQuizResultTitle");
  const resultDescription = document.getElementById(
    "smartQuizResultDescription",
  );

  if (!optionButtons.length || !result || !currentSmartCityQuiz) {
    return;
  }

  /* 한 번만 선택 */
  optionButtons.forEach((button) => {
    button.disabled = true;
  });

  /* 정답 */
  if (selectedIndex === currentSmartCityQuiz.answer) {
    optionButtons[selectedIndex].classList.add("correct");

    if (resultIcon) {
      resultIcon.textContent = "🎉";
    }

    if (resultTitle) {
      resultTitle.textContent = "정답입니다!";
    }

    if (resultDescription) {
      resultDescription.textContent = currentSmartCityQuiz.explanation;
    }
  } else {
    /* 오답 */
    optionButtons[selectedIndex].classList.add("wrong");

    optionButtons[currentSmartCityQuiz.answer].classList.add("correct");

    if (resultIcon) {
      resultIcon.textContent = "💡";
    }

    if (resultTitle) {
      resultTitle.textContent = "아쉬워요!";
    }

    if (resultDescription) {
      const answerNumber = ["①", "②", "③", "④"][currentSmartCityQuiz.answer];

      const answerText =
        currentSmartCityQuiz.options[currentSmartCityQuiz.answer];

      resultDescription.textContent = `정답은 ${answerNumber} ${answerText}입니다. ${currentSmartCityQuiz.explanation}`;
    }
  }

  /* 결과 표시 */

  result.style.display = "block";

  setTimeout(() => {
    result.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, 50);
}

/* =========================================================
   실제 통계 보기
========================================================= */
function goToQuizService() {
  const service = currentSmartCityQuiz?.service;
  const target = currentSmartCityQuiz?.target;

  if (!service) {
    closeSmartCityQuiz();
    return;
  }

  // ==========================================
  // 📊 대시보드
  // ==========================================
  if (service === "대시보드") {
    window.location.href = "/dashboard";
    return;
  }

  // ==========================================
  // 🗺️ 지도
  // ==========================================
  if (service === "지도") {
    window.location.href = "/map";
    return;
  }

  // ==========================================
  // 🎉 문화·행사
  // ==========================================
  if (service === "문화·행사") {
    closeSmartCityQuiz();

    // 1. 문화·행사 서비스 버튼 찾기
    const serviceCards = document.querySelectorAll(".svc-card");
    let cultureCard = null;

    serviceCards.forEach((card) => {
      const nameElement = card.querySelector(".svc-name");

      if (nameElement && nameElement.textContent.trim() === "문화·행사") {
        cultureCard = card;
      }
    });

    // 2. 문화·행사 서비스 활성화
    if (!cultureCard) {
      console.warn("[SmartQuiz] 문화·행사 서비스 카드를 찾을 수 없습니다.");
      return;
    }

    selectService(cultureCard, "문화·행사");

    // ==========================================
    // 3. 문화·행사 내부의 특정 카드 클릭
    // ==========================================
    setTimeout(() => {
      const quickCards = document.querySelectorAll(
        "#quickCardsContainer .quick-card",
      );

      let targetCategory = null;

      switch (target) {
        case "jeonil":
          targetCategory = "전일빌딩 공지사항";
          break;

        case "festival":
          targetCategory = "광주 축제 일정";
          break;

        case "lifelong":
          targetCategory = "AI 디지털 교육";
          break;

        default:
          // 특정 target이 없으면 전체 행사
          targetCategory = "all";
          break;
      }

      // 전체 행사
      if (targetCategory === "all") {
        const allCard = Array.from(quickCards).find((card) => {
          const text = card.textContent.trim();
          return text.includes("전체 행사 보기");
        });

        if (allCard) {
          allCard.click();
        }

        return;
      }

      // 특정 카테고리 카드 찾기
      const targetCard = Array.from(quickCards).find((card) => {
        const text = card.textContent.trim();

        if (target === "jeonil") {
          return text.includes("전일빌딩");
        }

        if (target === "festival") {
          return text.includes("지역 축제");
        }

        if (target === "lifelong") {
          return text.includes("광주평생학습포털");
        }

        return false;
      });

      if (targetCard) {
        targetCard.click();
      } else {
        console.warn(`[SmartQuiz] ${target} 대상 카드를 찾을 수 없습니다.`);
      }
    }, 50);

    return;
  }

  closeSmartCityQuiz();
}

/* =========================================================
   ESC 키로 퀴즈 닫기
========================================================= */

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") {
    return;
  }

  const modal = document.getElementById("smartCityQuizModal");

  if (modal && modal.style.display !== "none") {
    closeSmartCityQuiz();
  }
});

/* =========================================================
   모달 바깥 클릭으로 닫기
========================================================= */

document.addEventListener("click", (event) => {
  const modal = document.getElementById("smartCityQuizModal");

  if (!modal || modal.style.display === "none") {
    return;
  }

  if (event.target === modal) {
    closeSmartCityQuiz();
  }
});
