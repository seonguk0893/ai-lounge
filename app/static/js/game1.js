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

document.getElementById("start-button").addEventListener("click", () => {
  document.getElementById("start-overlay").style.display = "none";
  document.getElementById("home-button").classList.remove("hidden");
  document.getElementById("sidebar").classList.remove("hidden");
  document.getElementById("container").classList.remove("hidden");

  // 퍼즐을 기본 이미지로 초기화
  setPuzzleImage("static/images/game-image1.png");
});

const SIZE = 3;
const TILE_SIZE = 180;
let tiles = [];
let currentImage = "static/images/game-image1.png"; // 기본 이미지
let selectedTileIndex = null;

function createTiles() {
  tiles = [];
  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      tiles.push({ id: row * SIZE + col, row, col });
    }
  }
}

function shufflePuzzle() {
  tiles.sort(() => Math.random() - 0.5);
  renderBoard();
}

function renderBoard() {
  const board = document.getElementById("puzzle-board");
  board.innerHTML = "";

  tiles.forEach((tile, index) => {
    const div = document.createElement("div");
    div.className = "tile";
    div.setAttribute("data-index", index);

    if (index === selectedTileIndex) {
      div.classList.add("selected");
    }

    // ✅ 비율 단위로 계산 (3x3 기준)
    const posX = (tile.col / (SIZE - 1)) * 100;
    const posY = (tile.row / (SIZE - 1)) * 100;

    div.style.backgroundImage = `url(${currentImage})`;
    div.style.backgroundPosition = `${posX}% ${posY}%`;
    div.style.backgroundSize = `${SIZE * 100}% ${SIZE * 100}%`;

    div.addEventListener("pointerup", (e) => {
      e.preventDefault();
      handleTileClick(index);
    });

    board.appendChild(div);
  });
}

function handleTileClick(index) {
  // 1. 아무것도 선택되지 않은 상태에서 타일을 클릭했을 때
  if (selectedTileIndex === null) {
    selectedTileIndex = index; // 현재 타일을 선택된 것으로 저장
  }
  // 2. 이미 선택된 타일이 있을 때
  else {
    // 같은 타일을 다시 누르면 선택 취소
    if (selectedTileIndex === index) {
      selectedTileIndex = null;
    } else {
      // 다른 타일을 눌렀으면 두 타일의 위치를 교환
      [tiles[selectedTileIndex], tiles[index]] = [
        tiles[index],
        tiles[selectedTileIndex],
      ];
      selectedTileIndex = null; // 교환 후 선택 상태 초기화
    }

    // 퍼즐 완성 여부 체크
    if (checkCompletion()) {
      renderBoard(); // 완성된 화면을 한번 더 그려주고
      setTimeout(showPopup, 300); // 잠시 후 팝업 표시
      return;
    }
  }

  renderBoard(); // 화면을 다시 그려서 변경사항(선택 효과, 위치 교환)을 반영
}

function setPuzzleImage(path) {
  currentImage = path;
  selectedTileIndex = null;
  createTiles();
  shufflePuzzle();
}

// 초기 시작
createTiles();
shufflePuzzle();

function checkCompletion() {
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i].id !== i) return false;
  }
  return true;
}

function handleDrop(e) {
  const targetIndex = +e.target.dataset.index;
  [tiles[draggedIndex], tiles[targetIndex]] = [
    tiles[targetIndex],
    tiles[draggedIndex],
  ];
  renderBoard();

  if (checkCompletion()) {
    showPopup();
  }
}

function showPopup() {
  const overlay = document.getElementById("popup-overlay");
  overlay.classList.add("show");

  // 5초 뒤에 자동 fade-out
  setTimeout(() => {
    overlay.classList.add("fade-out");
    setTimeout(() => {
      overlay.classList.remove("show", "fade-out");
    }, 500); // fade-out 애니메이션 끝나는 시간과 맞춤
  }, 5000);
}

function closePopup() {
  const overlay = document.getElementById("popup-overlay");
  overlay.classList.add("fade-out");
  setTimeout(() => {
    overlay.classList.remove("show", "fade-out");
  }, 500);
}
