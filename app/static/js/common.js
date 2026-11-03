// 우클릭 및 단축키 방지
document.addEventListener("contextmenu", function (e) {
  e.preventDefault();
});

document.addEventListener("keydown", function (e) {
  // F12
  if (e.key === "F12") {
    e.preventDefault();
  }

  // Ctrl + Shift + I
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "i") {
    e.preventDefault();
  }

  // Ctrl + Shift + J
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "j") {
    e.preventDefault();
  }

  // Ctrl + U
  if (e.ctrlKey && e.key.toLowerCase() === "u") {
    e.preventDefault();
  }
});

// ======================== CLOCK ========================
function updateClock() {
  const now = new Date();
  const t = now.toLocaleTimeString("ko-KR");
  // 현재 페이지에 존재하는 시계 요소만 업데이트
  const el = document.querySelector(".nav-time");
  if (el) el.textContent = t;
}
setInterval(updateClock, 1000);
updateClock();

// ======================== LARGE MODE ========================
let largeMode = false;
function toggleLargeMode() {
  largeMode = !largeMode;
  document.documentElement.style.setProperty(
    "--large-mode",
    largeMode ? 1.3 : 1,
  );
  const btn = document.getElementById("largeModeToggle");
  if (btn) btn.classList.toggle("active", largeMode);
}

// ======================== VOICE MODAL ========================
const phrases = [
  "가까운 전기차 충전소를 안내해줘",
  "공영주차장을 찾아줘",
  "주정차 금지구역을 지도에서 보여줘",
  "빛고을CC 현황을 알려줘",
  "태양광 발전량을 보여줘",
  "신재생에너지 정보를 알려줘",
  "광주 행사 일정을 알려줘",
  "오늘 날씨를 알려줘",
  "현재 시간을 알려줘",
  "전입신고는 어떻게 하나요?",
  "복지 서비스를 안내해줘",
  "버스 정보를 알려줘",
  "여권 발급 방법을 알려줘",
  "민원 신청 방법을 알려줘",
];

// ======================== SPEECH RECOGNITION ========================
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition = null;
let recognitionStarted = false;
let voiceTimer;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();

  recognition.lang = "ko-KR";
  recognition.interimResults = false;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  // ------------------------
  // 음성인식 시작
  // ------------------------
  recognition.onstart = function () {
    recognitionStarted = true;

    const transcript = document.getElementById("voiceTranscript");

    if (transcript) {
      transcript.textContent = "🎙️ 듣고 있습니다...";
    }
  };

  // ------------------------
  // 음성인식 결과
  // ------------------------
  recognition.onresult = function (event) {
    const text = event.results[0][0].transcript.trim();

    const transcript = document.getElementById("voiceTranscript");

    if (!text) {
      if (transcript) {
        transcript.textContent = "음성을 인식하지 못했습니다.";
      }
      return;
    }

    console.log("🎙️ 음성인식 결과:", text);

    // 사용자가 말한 내용은 잠깐만 표시
    if (transcript) {
      transcript.textContent = `"${text}"`;
    }

    clearInterval(voiceTimer);

    // 음성인식 결과를 직접 sendChat으로 전달
    setTimeout(() => {
      if (transcript) {
        transcript.textContent = "🤖 답변을 생성하고 있습니다...";
      }

      sendChat(true, text);
    }, 500);
  };

  // ------------------------
  // 음성인식 오류
  // ------------------------
  recognition.onerror = function (event) {
    console.error("음성인식 오류:", event.error);

    const transcript = document.getElementById("voiceTranscript");

    if (transcript) {
      if (event.error === "not-allowed") {
        transcript.textContent = "🎙️ 마이크 권한을 허용해주세요.";
      } else if (event.error === "no-speech") {
        transcript.textContent = "음성이 들리지 않았습니다.";
      } else {
        transcript.textContent = "음성을 다시 말씀해주세요.";
      }
    }

    recognitionStarted = false;

    setTimeout(() => {
      closeVoice();
    }, 1500);
  };

  // ------------------------
  // 음성인식 종료
  // ------------------------
  recognition.onend = function () {
    recognitionStarted = false;
  };
}

// ========================
// 🎙️ 음성 모달 열기
// ========================

function openVoice() {
  const modal = document.getElementById("voiceModal");
  const el = document.getElementById("voiceTranscript");

  if (!modal || !el) return;

  // 모달 열기
  modal.classList.add("open");

  // 음성인식 지원 여부 확인
  if (!recognition) {
    el.textContent = "이 브라우저에서는 음성인식을 지원하지 않습니다.";
    return;
  }

  // 기존 음성인식이 실행 중이라면 중지
  try {
    recognition.abort();
  } catch (e) {}

  // 음성인식 시작 안내
  el.textContent = "🎙️ 듣고 있습니다...";

  // 음성인식 시작
  try {
    recognition.start();
  } catch (e) {
    console.error("음성인식 시작 오류:", e);
  }
}

// ========================
// 🎙️ 음성 모달 닫기
// ========================

function closeVoice() {
  const modal = document.getElementById("voiceModal");

  if (modal) {
    modal.classList.remove("open");
  }

  clearInterval(voiceTimer);

  recognitionStarted = false;

  if (recognition) {
    try {
      recognition.stop();
    } catch (e) {}
  }
}

// ===== 전역 테마 토글 및 유지 기능 (Dark / Light) ======

function toggleTheme() {
  const body = document.body;
  body.classList.toggle("light-theme");

  // 현재 테마가 라이트인지 확인
  const isLight = body.classList.contains("light-theme");

  // 브라우저에 테마 상태 저장 (다른 페이지 이동 시 유지)
  localStorage.setItem("smartcity_theme", isLight ? "light" : "dark");

  // UI 텍스트 및 아이콘 즉시 업데이트
  updateThemeUI(isLight);
}

function initTheme() {
  // 저장된 테마 불러오기
  const savedTheme = localStorage.getItem("smartcity_theme");

  // 저장된 테마가 없거나(처음 접속) 'light'인 경우 무조건 밝은 화면 적용
  if (savedTheme !== "dark") {
    document.body.classList.add("light-theme");
    updateThemeUI(true);
  } else {
    // 사용자가 명시적으로 'dark'로 설정했던 경우에만 어두운 화면 유지
    document.body.classList.remove("light-theme");
    updateThemeUI(false);
  }
}

function updateThemeUI(isLight) {
  // 화면 내의 테마 관련 아이콘/텍스트 일괄 변경
  document.querySelectorAll(".theme-icon").forEach((icon) => {
    icon.textContent = isLight ? "🌙" : "☀️";
  });
  document.querySelectorAll(".theme-label").forEach((label) => {
    label.textContent = isLight ? "어두운 화면" : "밝은 화면";
  });
}

// 스크립트가 로드되자마자 실행하여 화면 깜빡임 최소화
initTheme();

// ========================
// 30초 비활성 시 홈으로 이동
// ========================

const IDLE_TIMEOUT = 30 * 1000;
const HOME_URL = "/";

let idleTimer = null;

function resetIdleTimer() {
  clearTimeout(idleTimer);

  // 현재 페이지가 홈이면 타이머를 실행하지 않음
  const isHome =
    window.location.pathname === "/" ||
    window.location.pathname === "/index.html";

  if (isHome) return;

  idleTimer = setTimeout(() => {
    console.log("30초 동안 사용자 입력이 없어 홈으로 이동합니다.");

    if (typeof closeVoice === "function") {
      closeVoice();
    }

    window.location.href = HOME_URL;
  }, IDLE_TIMEOUT);
}

const activityEvents = [
  "pointerdown",
  "touchstart",
  "keydown",
  "wheel",
  "scroll",
  "input",
  "change",
];

activityEvents.forEach((eventName) => {
  document.addEventListener(eventName, resetIdleTimer, true);
});

// 홈이 아닌 페이지에서만 타이머 시작
resetIdleTimer();
