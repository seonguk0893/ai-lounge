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

// ============================================================
// 틀린 그림 찾기
// ============================================================
// 핵심 기준
//
// 1. HTML Canvas 내부 좌표는 항상 500 × 500
// 2. differences의 x, y 역시 500 × 500 기준
// 3. CSS로 Canvas가 확대/축소되어도
//    클릭 좌표를 다시 500 × 500으로 변환
// 4. 이미지 실제 크기(naturalWidth)는 좌표 계산에 사용하지 않음
//
// 즉:
//
// 화면 클릭 위치
//      ↓
// CSS Canvas 좌표
//      ↓
// 500 × 500 Canvas 좌표
//      ↓
// differences와 비교
//
// ============================================================

// ============================================================
// DOM
// ============================================================

const startButton = document.getElementById("start-button");
const startOverlay = document.getElementById("start-overlay");

const homeButton = document.getElementById("home-button");
const gameTitle = document.getElementById("game-title");
const gameContainer = document.getElementById("game-container");
const timerBarContainer = document.getElementById("timer-bar-container");

const leftCanvas = document.getElementById("leftImage");
const rightCanvas = document.getElementById("rightImage");

const ctxLeft = leftCanvas.getContext("2d");
const ctxRight = rightCanvas.getContext("2d");

const message = document.getElementById("message");

const popup = document.getElementById("popup");
const popupMessage = document.getElementById("popup-message");

// ============================================================
// Canvas 기준 크기
// ============================================================

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;

// 혹시 HTML에서 변경되어 있더라도
// JS에서 기준값을 명확하게 500 × 500으로 유지

leftCanvas.width = CANVAS_WIDTH;
leftCanvas.height = CANVAS_HEIGHT;

rightCanvas.width = CANVAS_WIDTH;
rightCanvas.height = CANVAS_HEIGHT;

// ============================================================
// 게임 상태
// ============================================================

let imgLeft = new Image();
let imgRight = new Image();

let level = 1;

const TOTAL_LEVELS = 3;

const TIMER_DURATION = 60;

let timerInterval = null;
let timerRemaining = TIMER_DURATION;

let popupTimeout = null;

// ============================================================
// 차이점 좌표
// ============================================================
//
// 중요!
// 이 좌표들은 "이미지 원본 좌표"가 아니라
// "500 × 500 Canvas 좌표" 기준이다.
//
// 기존에 사용하던 좌표를 그대로 유지한다.
// ============================================================

let differences = [
  { x: 80, y: 45 },
  { x: 100, y: 275 },
  { x: 250, y: 170 },
  { x: 400, y: 45 },
  { x: 440, y: 325 },
];

// 이미 찾은 차이점 번호
const found = [];

// 차이점 클릭 판정 반경
const RADIUS = 35;

// ============================================================
// 게임 시작
// ============================================================

startButton.addEventListener("click", () => {
  startOverlay.style.display = "none";

  homeButton.classList.remove("hidden");
  gameTitle.classList.remove("hidden");
  gameContainer.classList.remove("hidden");
  timerBarContainer.classList.remove("hidden");

  loadLevelImages();

  startTimer();
});

// ============================================================
// 레벨별 이미지 불러오기
// ============================================================

function loadLevelImages() {
  imgLeft = new Image();
  imgRight = new Image();

  imgLeft.onload = () => {
    drawImage(ctxLeft, imgLeft);

    redrawFoundMarkers();
  };

  imgRight.onload = () => {
    drawImage(ctxRight, imgRight);

    redrawFoundMarkers();
  };

  if (level === 1) {
    imgLeft.src = "static/images/game-image1.png";
    imgRight.src = "static/images/game-image1-1.png";
  } else if (level === 2) {
    imgLeft.src = "static/images/game-image2.png";
    imgRight.src = "static/images/game-image2-1.png";
  } else if (level === 3) {
    imgLeft.src = "static/images/game-image3.png";
    imgRight.src = "static/images/game-image3-1.png";
  }
}

// ============================================================
// 이미지 그리기
// ============================================================
//
// Canvas는 항상 500 × 500.
//
// 이미지가 500 × 500이 아니더라도
// 기존 drawScaledImage 방식처럼 Canvas 안에 맞춰서 표시한다.
//
// 단,
// "차이점 좌표"는 이미지 좌표가 아니라
// Canvas 좌표라는 전제다.
//
// ============================================================

function drawImage(ctx, img) {
  if (!img.complete || !img.naturalWidth) {
    return;
  }

  const canvas = ctx.canvas;

  const scale = Math.min(
    canvas.width / img.naturalWidth,
    canvas.height / img.naturalHeight,
  );

  const width = img.naturalWidth * scale;

  const height = img.naturalHeight * scale;

  const offsetX = (canvas.width - width) / 2;

  const offsetY = (canvas.height - height) / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.drawImage(img, offsetX, offsetY, width, height);
}

// ============================================================
// 화면 클릭 좌표 → 500 × 500 Canvas 좌표
// ============================================================
//
// 이 부분이 가장 중요하다.
//
// Canvas가 화면에서:
//
// 500 × 500
// 700 × 700
// 400 × 400
// 300 × 300
//
// 어떤 크기로 보이더라도
// 실제 Canvas 좌표를 0 ~ 500으로 변환한다.
//
// ============================================================

function getCanvasPoint(event, canvas) {
  const rect = canvas.getBoundingClientRect();

  // 화면에 표시되는 Canvas 크기
  const displayWidth = rect.width;
  const displayHeight = rect.height;

  // 실제 Canvas 내부 크기
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  // 화면 좌표
  const clientX = event.clientX;
  const clientY = event.clientY;

  // Canvas 내부 좌표로 변환
  const x = (clientX - rect.left) * (canvasWidth / displayWidth);

  const y = (clientY - rect.top) * (canvasHeight / displayHeight);

  return {
    x,
    y,
  };
}

// ============================================================
// Canvas 좌표가 실제 Canvas 범위 안인지 확인
// ============================================================

function isInsideCanvas(x, y) {
  return x >= 0 && x <= CANVAS_WIDTH && y >= 0 && y <= CANVAS_HEIGHT;
}

// ============================================================
// 클릭 처리
// ============================================================

function handleClick(event, canvas) {
  const point = getCanvasPoint(event, canvas);

  console.log(`[클릭 좌표] x: ${point.x.toFixed(1)}, y: ${point.y.toFixed(1)}`);

  // Canvas 바깥
  if (!isInsideCanvas(point.x, point.y)) {
    return;
  }

  let isCorrect = false;

  // 차이점 하나씩 확인
  for (let i = 0; i < differences.length; i++) {
    const diff = differences[i];

    // 이미 찾은 차이점은 제외
    if (found.includes(i)) {
      continue;
    }

    // 거리 계산
    const distance = Math.hypot(diff.x - point.x, diff.y - point.y);

    // 정답
    if (distance <= RADIUS) {
      found.push(i);

      console.log(`[정답] 차이점 ${i + 1}`, `x=${diff.x}`, `y=${diff.y}`);

      // 빨간 원 표시
      redrawCanvas();

      isCorrect = true;

      // 모든 차이점을 찾았는지 확인
      if (found.length === differences.length) {
        clearInterval(timerInterval);

        timerInterval = null;

        if (level < TOTAL_LEVELS) {
          showPopup("🎉 모두 맞췄어요! 다음 레벨로 넘어갈게요!");
        } else {
          showPopup("🎉 모든 레벨이 끝났어요! 수고했어요!", false);
        }
      }

      break;
    }
  }

  if (isCorrect) {
    message.textContent = "정답이에요!";
  } else {
    message.textContent = "틀렸어요! 다시 시도해보세요.";
  }
}

// ============================================================
// Canvas 다시 그리기
// ============================================================
//
// 이미지 + 지금까지 찾은 원을 다시 그린다.
//
// resize나 화면 크기 변경에도 사용한다.
// ============================================================

function redrawCanvas() {
  // 왼쪽 이미지
  if (imgLeft.complete && imgLeft.naturalWidth) {
    drawImage(ctxLeft, imgLeft);
  }

  // 오른쪽 이미지
  if (imgRight.complete && imgRight.naturalWidth) {
    drawImage(ctxRight, imgRight);
  }

  // 찾은 차이점 다시 표시
  redrawFoundMarkers();
}

// ============================================================
// 찾은 차이점 표시
// ============================================================

function redrawFoundMarkers() {
  for (let i = 0; i < found.length; i++) {
    const index = found[i];

    const diff = differences[index];

    drawCircle(ctxLeft, diff.x, diff.y);

    drawCircle(ctxRight, diff.x, diff.y);
  }
}

// ============================================================
// 빨간 원 그리기
// ============================================================
//
// 주의!
// diff.x / diff.y가 이미 500 × 500 Canvas 좌표이므로
// 별도의 이미지 좌표 변환을 하지 않는다.
//
// ============================================================

function drawCircle(ctx, x, y) {
  ctx.beginPath();

  ctx.strokeStyle = "red";

  ctx.lineWidth = 4;

  ctx.arc(x, y, RADIUS, 0, Math.PI * 2);

  ctx.stroke();
}

// ============================================================
// Pointer 이벤트
// ============================================================
//
// click 대신 pointerdown 사용
//
// PC 마우스
// 태블릿 터치
// 스마트폰 터치
// 펜
//
// 모두 대응한다.
// ============================================================

leftCanvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();

  handleClick(event, leftCanvas);
});

rightCanvas.addEventListener("pointerdown", (event) => {
  event.preventDefault();

  handleClick(event, rightCanvas);
});

// ============================================================
// 타이머
// ============================================================

function startTimer() {
  const bar = document.getElementById("timer-bar");

  const container = document.getElementById("timer-bar-container");

  container.classList.remove("hidden");

  timerRemaining = TIMER_DURATION;

  bar.style.width = "100%";

  clearInterval(timerInterval);

  timerInterval = null;

  bar.style.backgroundColor = "rgb(244, 162, 97)";

  timerInterval = setInterval(() => {
    timerRemaining--;

    const percentage = (timerRemaining / TIMER_DURATION) * 100;

    bar.style.width = `${Math.max(0, percentage)}%`;

    // 시간이 줄어들수록 빨간색으로 변경
    const progress = 1 - timerRemaining / TIMER_DURATION;

    const red = 244 + (214 - 244) * progress;

    const green = 162 + (40 - 162) * progress;

    const blue = 97 + (40 - 97) * progress;

    bar.style.backgroundColor = `rgb(
          ${Math.round(red)},
          ${Math.round(green)},
          ${Math.round(blue)}
        )`;

    // 시간 종료
    if (timerRemaining <= 0) {
      clearInterval(timerInterval);

      timerInterval = null;

      bar.style.width = "0%";

      if (level === TOTAL_LEVELS) {
        showPopup("🎉 모든 레벨이 끝났어요! 수고했어요!", false);
      } else {
        showPopup("⏰ 아쉽지만 시간이 다 지났어요. 다음 레벨로 넘어갈게요!");
      }
    }
  }, 1000);
}

// ============================================================
// 팝업
// ============================================================

function showPopup(messageText, goNext = true) {
  if (popupTimeout) {
    clearTimeout(popupTimeout);

    popupTimeout = null;
  }

  popupMessage.innerHTML = messageText;

  popup.classList.remove("hidden");

  popupTimeout = setTimeout(() => {
    popup.classList.add("hidden");

    popupTimeout = null;

    if (goNext) {
      nextLevel();
    }
  }, 3000);
}

// ============================================================
// 다음 레벨
// ============================================================

function nextLevel() {
  level++;

  // ----------------------------------------------------------
  // LEVEL 2
  // ----------------------------------------------------------

  if (level === 2) {
    differences = [
      { x: 65, y: 65 },
      { x: 209, y: 409 },
      { x: 260, y: 140 },
      { x: 421, y: 241 },
      { x: 451, y: 382 },
    ];
  }

  // ----------------------------------------------------------
  // LEVEL 3
  // ----------------------------------------------------------
  else if (level === 3) {
    differences = [
      { x: 114, y: 463 },
      { x: 217, y: 46 },
      { x: 318, y: 221 },
      { x: 417, y: 385 },
      { x: 458, y: 122 },
    ];
  }

  // ----------------------------------------------------------
  // 게임 종료
  // ----------------------------------------------------------
  else {
    showPopup("🎉 모든 레벨이 끝났어요! 수고했어요!", false);

    return;
  }

  // 찾은 목록 초기화
  found.length = 0;

  // 메시지 초기화
  message.textContent = "";

  // Canvas 초기화
  ctxLeft.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctxRight.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 다음 이미지
  loadLevelImages();

  // 타이머 재시작
  startTimer();
}

// ============================================================
// 화면 크기 변경
// ============================================================
//
// CSS에서 Canvas의 실제 표시 크기가 바뀌어도
// Canvas 내부 좌표는 계속 500 × 500.
//
// 따라서 다시 그리기만 하면 된다.
// ============================================================

window.addEventListener("resize", () => {
  if (gameContainer.classList.contains("hidden")) {
    return;
  }

  redrawCanvas();
});
