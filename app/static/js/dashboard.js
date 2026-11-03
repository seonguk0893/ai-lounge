// =========================
// dashboard.js
// MySQL → Flask API → Dashboard Render
// =========================

// AI 서비스 사용 통계
fetch("/api/usage_stats")
  .then((res) => res.json())
  .then((data) => {
    document.getElementById("userCount").textContent = data.users + "회";

    document.getElementById("chatCount").textContent = data.total + "건";

    document.getElementById("completionRate").textContent = data.today + "건";

    const chart = document.getElementById("usageChart");

    chart.innerHTML = "";

    const colors = ["blue", "green", "orange", "purple", "red"];

    let total = data.services.reduce((sum, s) => sum + s.cnt, 0);

    let services = data.services.sort((a, b) => b.cnt - a.cnt);

    let topServices = services.slice(0, 5);

    let etcCount = services.slice(5).reduce((sum, item) => sum + item.cnt, 0);

    if (etcCount > 0) {
      topServices.push({
        service: "기타",
        cnt: etcCount,
      });
    }

    topServices.forEach((item, index) => {
      let percent = Math.round((item.cnt / total) * 100);

      chart.innerHTML += `
        <div class="usage-row">

          <div class="usage-label">
            ${index < 3 ? ["🥇", "🥈", "🥉"][index] : ""}
            ${item.service}
          </div>

          <div class="usage-bar">
            <div class="usage-fill ${colors[index % colors.length]}"
              style="width:${percent}%">
            </div>
          </div>

          <div class="usage-value">
            ${percent}%
          </div>

        </div>
      `;
    });
  });

// -------------------------
// 1. 태양광 데이터 로딩
// -------------------------
async function loadSolar() {
  try {
    const res = await fetch("/api/solar_power_plant");
    const data = await res.json();

    const solarList = document.getElementById("solarPlantList");
    solarList.innerHTML = "";

    data.forEach((d) => {
      solarList.innerHTML += `
        <div class="data-item">
          <div class="item-main">
            <div class="item-title">
              ${d.plant_name || "-"}
              <span style="
                font-size:14px;
                font-weight:400;
                color:var(--text-muted);
                border:1px solid var(--border);
                padding:1px 4px;
                border-radius:4px;
                margin-left:4px;
              ">
                ${d.project_type || "-"}
              </span>
            </div>
            <div class="item-desc">
              용량: ${d.capacity_kw || 0} kW | 주소: ${d.address || "-"}
            </div>
          </div>
        </div>
      `;
    });
  } catch (err) {
    console.error("solar_power 로딩 실패:", err);
  }
}

// =========================
// 2. 신재생에너지 통계
// =========================

async function loadRenewable() {
  try {
    const [renewableRes, bitgoeulRes] = await Promise.all([
      fetch("/api/renewable_energy"),
    ]);

    const renewable = await renewableRes.json();

    // 총 발전소

    document.getElementById("totalPlantCount").textContent =
      renewable.length + "개";

    // 총 설비용량

    const totalCapacity = renewable.reduce(
      (sum, d) => sum + Number(d.capacity_kw || 0),

      0,
    );

    document.getElementById("totalCapacity").textContent =
      totalCapacity.toLocaleString() + " kW";

    //-------------------------
    // 에너지 종류별 차트
    //-------------------------
    renewableData = renewable;

    const typeCount = {};

    renewable.forEach((d) => {
      const type = d.energy_type || "기타";

      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    const chart = document.getElementById("energyTypeChart");

    const labels = document.getElementById("energyTypeLabels");

    chart.innerHTML = "";

    labels.innerHTML = "";

    const max = Math.max(...Object.values(typeCount));

    const colors = ["#00c853", "#2196f3", "#ff9800", "#9c27b0", "#f44336"];

    Object.entries(typeCount).forEach(([type, count], idx) => {
      const bar = document.createElement("div");

      bar.className = "bar";

      bar.style.height = `${(count / max) * 100}%`;
      bar.style.background = colors[idx % colors.length];

      bar.style.cursor = "pointer";

      // ⭐ 에너지 종류 저장
      bar.dataset.energyType = type;

      bar.addEventListener("click", () => {
        renderRenewableList(type);
      });

      // 개수 표시
      const value = document.createElement("span");

      value.className = "bar-value";
      value.textContent = count + "개";
      bar.appendChild(value);
      chart.appendChild(bar);

      const label = document.createElement("div");

      label.className = "bar-label";
      label.textContent = type;
      labels.appendChild(label);
    });
  } catch (err) {
    console.error(err);
  }
}

// 발전소 리스트 출력 함수
function renderRenewableList(type) {
  const modal = document.getElementById("renewableModal");

  const title = document.getElementById("renewableModalTitle");

  const list = document.getElementById("renewableList");

  title.textContent = `${type} 발전소 목록`;

  const items = renewableData.filter((d) => d.energy_type === type);

  list.innerHTML = "";

  items.forEach((d) => {
    list.innerHTML += `

      <div class="data-item">
        <div class="item-main">
          <div class="item-title">${d.plant_name}</div>
          <div class="item-desc">
            ${Number(d.capacity_kw).toLocaleString()} kW · ${d.location}
          </div>
        </div>
      </div>
    `;
  });

  modal.classList.add("show");
}

const renewableModal = document.getElementById("renewableModal");

document

  .getElementById("closeRenewableModal")

  .addEventListener("click", () => {
    renewableModal.classList.remove("show");
  });

// 모달 바깥 클릭 시 닫기

renewableModal.addEventListener("click", (e) => {
  if (e.target === renewableModal) {
    renewableModal.classList.remove("show");
  }
});

// -------------------------
// 3. 임대아파트 데이터 로딩
// -------------------------
async function loadApartment() {
  try {
    const res = await fetch("/api/rental_apartment");
    const data = await res.json();

    const aptList = document.getElementById("apartmentList");
    aptList.innerHTML = "";

    data.forEach((d) => {
      aptList.innerHTML += `
        <div class="data-item">
          <div class="item-main">
            <div class="item-title">
              ${d.housing_name || "-"}
              <span style="
                font-size:14px;
                font-weight:400;
                color:var(--accent);
                background:rgba(0,212,255,0.1);
                padding:1px 4px;
                border-radius:4px;
                margin-left:4px;
              ">
                ${d.rental_type} | ${d.supply_type}
              </span>
            </div>

            <div class="item-desc">
              세대수: ${d.household_count || 0} | 승인: ${
                d.approval_year
              }년 | 스프링클러 설치: ${d.sprinkler_households}개
      
            </div>
          </div>
        </div>
      `;
    });
  } catch (err) {
    console.error("rental_apartment 로딩 실패:", err);
  }
}

// =========================
// 4. CCTV
// =========================
async function loadCCTV() {
  try {
    const res = await fetch("/api/cctv");
    const data = await res.json();
    //---------------------------------
    // 통계
    //---------------------------------
    const total = data.length;
    const totalCamera = data.reduce(
      (sum, d) => sum + Number(d.camera_count || 0),
      0,
    );

    const avgRetention = (
      data.reduce((sum, d) => sum + Number(d.retention_days || 0), 0) / total
    ).toFixed(0);

    document.getElementById("cctvNormal").textContent = total;
    document.getElementById("cctvInspect").textContent = totalCamera;
    document.getElementById("cctvError").textContent = avgRetention + "일";

    //---------------------------------
    // 목록
    //---------------------------------
    const list = document.getElementById("cctvList");

    list.innerHTML = "";

    data.slice(0, 50).forEach((d) => {
      list.innerHTML += `
        <div class="data-item ok">
            <div class="alert-icon">
                📷
            </div>
            <div class="alert-text">
                <div class="alert-title">
                    도로명주소 : ${d.address_road}
                </div>
                <div class="alert-sub">
                    관리기관명 : ${d.management_name}
                </div>
            </div>
            <div class="alert-time">
                ${d.camera_count}대
            </div>
        </div>
      `;
    });
  } catch (err) {
    console.error(err);
  }
}

// -------------------------
// 5. 빛고을cc
// -------------------------
async function loadBitgoeul() {
  try {
    const res = await fetch("/api/bitgoeul_stats");

    const data = await res.json();

    if (data.length === 0) return;

    // =========================
    // 누적 통계
    // =========================

    const totalVisitor = data.reduce(
      (sum, d) => sum + Number(d.visitor_count || 0),
      0,
    );

    const totalCustomer = data.reduce(
      (sum, d) => sum + Number(d.customer_service_count || 0),
      0,
    );

    const totalLost = data.reduce(
      (sum, d) => sum + Number(d.lost_report_count || 0),
      0,
    );

    document.getElementById("visitorCount").textContent =
      totalVisitor.toLocaleString() + "명";

    document.getElementById("customerCount").textContent =
      totalCustomer.toLocaleString() + "건";

    document.getElementById("lostCount").textContent =
      totalLost.toLocaleString() + "건";

    // =========================
    // 최근 운영내역
    // =========================

    const list = document.getElementById("bitgoeulList");

    list.innerHTML = "";

    data.forEach((d) => {
      list.innerHTML += `
        <div class="data-item">
          <div class="item-main">
            <div class="item-title">
              ${d.year}년
            </div>
            <div class="item-desc">
              이용객 ${Number(d.visitor_count).toLocaleString()}명 ·
              문의 ${Number(d.customer_service_count).toLocaleString()}건 ·
              분실물 ${Number(d.lost_report_count).toLocaleString()}건
            </div>
          </div>
        </div>
      `;
    });
  } catch (err) {
    console.error(err);
  }
}

// -------------------------
// 6. 에너지 차트
// -------------------------
function renderEnergyChart() {
  const energyTypes = [
    { label: "태양광", val: 82, color: "var(--accent4)" },
    { label: "태양열", val: 12, color: "var(--accent5)" },
    { label: "지열", val: 4, color: "var(--accent2)" },
    { label: "기타", val: 2, color: "var(--text-muted)" },
  ];

  const eChart = document.getElementById("energyTypeChart");
  const eLabels = document.getElementById("energyTypeLabels");

  eChart.innerHTML = "";
  eLabels.innerHTML = "";

  energyTypes.forEach((d) => {
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.height = d.val + "%";
    bar.style.background = d.color;
    bar.setAttribute("data-val", d.val + "%");
    eChart.appendChild(bar);

    const lbl = document.createElement("div");
    lbl.className = "bar-label";
    lbl.textContent = d.label;
    eLabels.appendChild(lbl);
  });
}

// ==========================================
// 🔍 대시보드 패널 확대 기능
// ==========================================

const panelZoomModal = document.getElementById("panelZoomModal");
const panelZoomContent = document.getElementById("panelZoomContent");
const closePanelZoom = document.getElementById("closePanelZoom");

// 패널 확대
function openPanelZoom(panel) {
  if (!panelZoomModal || !panelZoomContent) return;

  panelZoomContent.innerHTML = "";

  // 패널 복제
  const clonedPanel = panel.cloneNode(true);

  // 확대용 클래스
  clonedPanel.classList.add("zoom-panel");

  // 확대 패널은 다시 확대되지 않도록
  clonedPanel.style.cursor = "default";

  panelZoomContent.appendChild(clonedPanel);

  // 모달 표시
  panelZoomModal.classList.add("active");

  document.body.style.overflow = "hidden";

  // 신재생에너지 차트 이벤트 다시 연결
  initZoomRenewableChart(clonedPanel);
}

function initZoomRenewableChart(zoomPanel) {
  const chart = zoomPanel.querySelector("#energyTypeChart");

  if (!chart) return;

  const bars = chart.querySelectorAll(".bar");

  bars.forEach((bar) => {
    const type = bar.dataset.energyType;

    if (!type) return;

    bar.addEventListener("click", function (e) {
      e.stopPropagation();

      renderRenewableList(type);
    });
  });
}

// 패널 확대 이벤트 등록
function initPanelZoom() {
  const panels = document.querySelectorAll(".dash-panel");

  panels.forEach((panel) => {
    panel.addEventListener("click", function (e) {
      // 기존 내부 버튼이나 차트 클릭은 확대 이벤트 방지
      if (
        e.target.closest("button") ||
        e.target.closest("a") ||
        e.target.closest(".bar-chart") ||
        e.target.closest(".usage-chart")
      ) {
        return;
      }

      openPanelZoom(panel);
    });
  });
}

// 닫기
function closePanelZoomModal() {
  panelZoomModal.classList.remove("active");

  panelZoomContent.innerHTML = "";

  document.body.style.overflow = "";
}

// X 버튼
if (closePanelZoom) {
  closePanelZoom.addEventListener("click", closePanelZoomModal);
}

// 모달 바깥 클릭
if (panelZoomModal) {
  panelZoomModal.addEventListener("click", function (e) {
    if (e.target === panelZoomModal) {
      closePanelZoomModal();
    }
  });
}

// ESC로 닫기
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && panelZoomModal.classList.contains("active")) {
    closePanelZoomModal();
  }
});

// DOM 로드 후 패널 이벤트 등록
document.addEventListener("DOMContentLoaded", function () {
  initPanelZoom();
});

// -------------------------
// 전체 초기화
// -------------------------
function initDashboard() {
  loadSolar();
  loadRenewable();
  loadApartment();
  loadCCTV();
  loadBitgoeul();
}

// -------------------------
// 9. 실행
// -------------------------
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDashboard);
} else {
  initDashboard();
}
