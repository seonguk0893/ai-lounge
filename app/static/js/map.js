// =========================
// 전역 변수
// =========================
let map;
let currentInfoWindow = null;
let currentMarker = null;

// 데이터
let evData = [];
let parkingData = [];
let childZoneData = [];

// 마커 그룹
let evMarkers = [];
let parkingMarkers = [];
let childMarkers = [];

// 레이어 상태
let layerState = {
  ev: true,
  parking: true,
  child: true,
};

// =========================
// 지도 초기화
// =========================

function initMap() {
  const container = document.getElementById("mapContainer");

  map = new kakao.maps.Map(container, {
    center: new kakao.maps.LatLng(35.1595, 126.8526),
  });
}

// =========================
// 페이지 초기화 (단일)
// =========================

function initPage() {
  initMap();

  loadEV();
  loadParking();
  loadChildZone();

  initLayerControls();
  initSearch();
}

// =========================
// EV
// =========================

async function loadEV() {
  try {
    const res = await fetch("/api/ev_charging_station");
    evData = await res.json();
    renderAll();
  } catch (e) {
    console.error(e);
  }
}

// =========================
// 공영주차장
// =========================

async function loadParking() {
  try {
    const res = await fetch("/api/public_parking");
    parkingData = await res.json();
    renderAll();
  } catch (e) {
    console.error(e);
  }
}

// =========================
// 어린이보호구역
// =========================

async function loadChildZone() {
  try {
    const res = await fetch("/api/temporary_parking_restriction");
    childZoneData = await res.json();
    renderAll();
  } catch (e) {
    console.error(e);
  }
}

// =========================
// 전체 렌더 (핵심)
// =========================

function renderAll() {
  clearAllMarkers();

  const list = document.getElementById("facilityList");
  list.innerHTML = "";

  const bounds = new kakao.maps.LatLngBounds();

  // ================= EV =================
  evMarkers = evData.map((d) => createEVMarker(d, list, bounds));

  // ================= PARKING =================
  parkingMarkers = parkingData.map((d) => createParkingMarker(d, list, bounds));

  // ================= CHILD =================
  childMarkers = childZoneData.map((d) => createChildMarker(d, list, bounds));

  if (!bounds.isEmpty()) {
    map.setBounds(bounds);
  }

  updateTotalCount();
}

// =========================
// 컬러 마커 생성
// =========================

function createMarkerImage(color) {
  const svg =
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(`

      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12">
        <circle
          cx="6"
          cy="6"
          r="5"
          fill="${color}"
          stroke="white"
          stroke-width="1.5"/>
      </svg>

    `);

  return new kakao.maps.MarkerImage(
    svg,

    new kakao.maps.Size(15, 15),
  );
}

const evMarkerImage = createMarkerImage("#2F80ED");

const parkingMarkerImage = createMarkerImage("#27AE60");

const childMarkerImage = createMarkerImage("#EB5757");

// =========================
// EV marker
// =========================

function createEVMarker(d, list, bounds) {
  const lat = parseFloat(d.latitude);
  const lng = parseFloat(d.longitude);
  if (isNaN(lat) || isNaN(lng)) return null;

  const pos = new kakao.maps.LatLng(lat, lng);

  const marker = new kakao.maps.Marker({
    map: layerState.ev ? map : null,
    position: pos,
    image: evMarkerImage,
  });

  bounds.extend(pos);

  const facility = {
    name: d.station_name,
    address: d.address,
    latitude: d.latitude,
    longitude: d.longitude,
    time: d.available_time,
    charger: d.charger_type,
  };

  addListItem(list, {
    color: "#2F80ED",
    title: facility.name,
    sub: facility.address,
    onClick: () => {
      selectFacility(marker, pos, "EV 충전소", facility);
    },
  });
  kakao.maps.event.addListener(marker, "click", () => {
    selectFacility(marker, pos, "EV 충전소", facility);
  });

  return marker;
}

// =========================
// PARKING marker
// =========================

function createParkingMarker(d, list, bounds) {
  const lat = parseFloat(d.latitude);
  const lng = parseFloat(d.longitude);
  if (isNaN(lat) || isNaN(lng)) return null;

  const pos = new kakao.maps.LatLng(lat, lng);

  const marker = new kakao.maps.Marker({
    map: layerState.parking ? map : null,
    position: pos,
    image: parkingMarkerImage,
  });

  bounds.extend(pos);

  const facility = {
    name: d.name,
    address: d.address,
    latitude: d.latitude,
    longitude: d.longitude,
    totalSpace: d.parking_spaces,
    fee: d.fee_info,
  };

  addListItem(list, {
    color: "#27AE60",
    title: facility.name,
    sub: facility.address,
    onClick: () => {
      selectFacility(marker, pos, "공영주차장", facility);
    },
  });
  kakao.maps.event.addListener(marker, "click", () => {
    selectFacility(marker, pos, "공영주차장", facility);
  });

  return marker;
}

// =========================
// CHILD marker
// =========================

function createChildMarker(d, list, bounds) {
  const lat = parseFloat(d.latitude);
  const lng = parseFloat(d.longitude);
  if (isNaN(lat) || isNaN(lng)) return null;

  const pos = new kakao.maps.LatLng(lat, lng);

  const marker = new kakao.maps.Marker({
    map: layerState.child ? map : null,
    position: pos,
    image: childMarkerImage,
  });

  bounds.extend(pos);

  const facility = {
    name: d.facility_name,
    address: d.location,
    latitude: d.latitude,
    longitude: d.longitude,
    time: d.allowed_time,
    installed: d.signboard_installed,
  };

  addListItem(list, {
    color: "#EB5757",
    title: facility.name,
    sub: facility.address,
    onClick: () => {
      selectFacility(marker, pos, "주정차금지구역", facility);
    },
  });
  kakao.maps.event.addListener(marker, "click", () => {
    selectFacility(marker, pos, "주정차금지구역", facility);
  });
  return marker;
}

// =========================
// 리스트 생성
// =========================
function setActiveItem(selectedItem) {
  document.querySelectorAll(".facility-item").forEach((item) => {
    item.classList.remove("active");
  });

  selectedItem.classList.add("active");
}

function addListItem(list, data) {
  const item = document.createElement("div");

  item.className = "facility-item";

  item.innerHTML = `
    <div class="facility-name">
      <span class="facility-dot" style="background:${data.color};"></span>
      ${data.title}
    </div>
    <div class="facility-address">${data.sub || "-"}</div>
  `;

  item.addEventListener("click", () => {
    setActiveItem(item);

    data.onClick();
  });

  list.appendChild(item);

  return item;
}

// =========================
// InfoWindow
// =========================
function selectFacility(marker, pos, type, facility) {
  map.setCenter(pos);

  map.setLevel(4);

  openInfo(marker, type, facility.name, facility.address);

  showFacilityDetail(type, facility);
}

function showFacilityDetail(type, facility) {
  const detail = document.getElementById("facilityDetail");

  if (type === "EV 충전소") {
    detail.innerHTML = `
      <div class="detail-row">
        <div class="detail-label">주소</div>
        <div class="detail-value">${facility.address}</div>
      </div>

      <div class="detail-row">
        <div class="detail-label">충전타입</div>
        <div class="detail-value">${facility.charger}</div>
      </div>

      <div class="detail-row">
        <div class="detail-label">이용시간</div>
        <div class="detail-value">${facility.time || "-"}</div>
      </div>
    `;
  } else if (type === "공영주차장") {
    detail.innerHTML = `
      <div class="detail-row">
        <div class="detail-label">주소</div>
        <div class="detail-value">${facility.address || "-"}</div>
      </div>

      <div class="detail-row">
        <div class="detail-label">총 주차면수</div>
        <div class="detail-value">${facility.totalSpace || "-"}</div>
      </div>

      <div class="detail-row">
        <div class="detail-label">요금정보</div>
        <div class="detail-value">${facility.fee || "-"}</div>
      </div>
    `;
  } else if (type === "주정차금지구역") {
    detail.innerHTML = `
      <div class="detail-row">
        <div class="detail-label" style="width:270px;">주소</div>
        <div class="detail-value">${facility.address}</div>
      </div>

      <div class="detail-row">
        <div class="detail-label" style="width:270px;">한시적 주정차 허용시간</div>
        <div class="detail-value">${facility.time || "-"}</div>
      </div>

      <div class="detail-row">
        <div class="detail-label" style="width:270px;">한시적 주정차 허용 표지판 설치 여부</div>
        <div class="detail-value">${facility.installed || "-"}</div>
      </div>
    `;
  }
}

function openInfo(marker, type, name, address) {
  // 같은 마커를 다시 클릭하면 닫기

  if (currentMarker === marker && currentInfoWindow) {
    currentInfoWindow.close();

    currentInfoWindow = null;

    currentMarker = null;

    return;
  }

  // 다른 마커가 열려있으면 닫기

  if (currentInfoWindow) {
    currentInfoWindow.close();
  }

  const info = new kakao.maps.InfoWindow({
    content: `
      <div style="
        width:100%;
        padding:10px 12px;
        font-size:16px;
        line-height:1.5;
      ">
        <div style="color:#000; font-weight:700; margin-bottom:6px;">
          ${type}
        </div>

        <div style="color:#000; margin-bottom:4px; white-space:nowrap;">
          ${name}
        </div>

        <div style="color:#666; white-space:nowrap;">
          ${address}
        </div>
      </div>
    `,
  });

  info.open(map, marker);

  currentInfoWindow = info;

  currentMarker = marker;
}

// =========================
// 마커 초기화
// =========================
function clearAllMarkers() {
  [...evMarkers, ...parkingMarkers, ...childMarkers].forEach((m) => {
    if (m) m.setMap(null);
  });

  evMarkers = [];
  parkingMarkers = [];
  childMarkers = [];
}

// =========================
// 토글
// =========================

function initLayerControls() {
  document.getElementById("layerEV").addEventListener("change", (e) => {
    toggle(evMarkers, "ev", e.target.checked);
  });

  document.getElementById("layerParking").addEventListener("change", (e) => {
    toggle(parkingMarkers, "parking", e.target.checked);
  });

  document.getElementById("layerSchool").addEventListener("change", (e) => {
    toggle(childMarkers, "child", e.target.checked);
  });
}

function toggle(markers, type, on) {
  layerState[type] = on;
  markers.forEach((m) => m && m.setMap(on ? map : null));
}

// =========================
// 검색
// =========================

function initSearch() {
  const input = document.getElementById("searchInput");

  input.addEventListener("input", (e) => {
    const keyword = e.target.value.toLowerCase();
    document.querySelectorAll(".facility-item").forEach((el) => {
      el.style.display = el.innerText.toLowerCase().includes(keyword)
        ? "block"
        : "none";
    });
  });
}

// =========================
// 총 개수
// =========================
function updateTotalCount() {
  document.getElementById("totalFacilityCount").textContent =
    evData.length + parkingData.length + childZoneData.length;

  document.getElementById("evCount").textContent = evData.length;

  document.getElementById("parkingCount").textContent = parkingData.length;

  document.getElementById("childCount").textContent = childZoneData.length;
}

// =========================
// 키카오 맵 실행
// =========================
kakao.maps.load(() => {
  initPage();
});
