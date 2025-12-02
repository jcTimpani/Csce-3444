const UNT_CENTER = [33.2075, -97.1526]; let map, markers = [], locationsData = [];
let currentBuilding = null;
let currentFloorIndex = 0;
function initMap() { map = L.map("map", { center: UNT_CENTER, zoom: 15 }); L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap" }).addTo(map); }
function createMarker(l) {
    const m = L.marker([l.lat, l.lng]).addTo(map);
    const popupContent = `
    <strong>${l.name}</strong><br/>
    ${l.description || ""}<br/>
    <button onclick="openBuildingMap('${l.id}')" style="margin-top:5px; cursor:pointer;">View Floor Plan</button>
  `;
    m.bindPopup(popupContent);
    m.on("click", () => highlightListItem(l.id));
    return m;
}
function renderMarkers(locs) { markers.forEach(m => map.removeLayer(m)); markers = []; locs.forEach(l => markers.push(createMarker(l))); }
function renderList(locs) {
    const list = document.getElementById("locationList");
    list.innerHTML = "";
    locs.sort((a, b) => a.name.localeCompare(b.name)).forEach(l => {
        const li = document.createElement("li");
        li.textContent = l.name;
        li.className = "location-item";
        li.onclick = () => {
            renderMarkers([l]);
            map.setView([l.lat, l.lng], 17);
            highlightListItem(l.id);
            document.getElementById("showAllBtn").style.display = "block";
        };
        li.ondblclick = () => openBuildingMap(l.id);
        list.appendChild(li);
    });
}
function focusLocation(id) { const l = locationsData.find(x => x.id === id); if (!l) return; map.setView([l.lat, l.lng], 17); highlightListItem(id); }
function highlightListItem(id) { document.querySelectorAll(".location-item").forEach(i => { i.classList.toggle("active", i.textContent === locationsData.find(x => x.id === id).name); }); }

function filterLocations() {
    const checked = Array.from(document.querySelectorAll(".category-filter:checked")).map(c => c.value);
    const filtered = locationsData.filter(l => checked.includes(l.category));
    renderMarkers(filtered);
    renderList(filtered);
    document.getElementById("showAllBtn").style.display = "none";
}

document.getElementById("showAllBtn").onclick = () => {
    filterLocations();
};
document.querySelectorAll(".category-filter").forEach(c => c.addEventListener("change", filterLocations));
async function loadLocations() { const r = await fetch("data/locations.json"); locationsData = await r.json(); filterLocations(); }
window.addEventListener("DOMContentLoaded", () => { initMap(); loadLocations(); });

// Modal Logic
function openBuildingMap(id) {
    // If called from string ID (e.g. popup button)
    const l = locationsData.find(x => x.id === id);
    if (!l) return;

    currentBuilding = l;
    currentFloorIndex = 0;

    document.getElementById("modalTitle").textContent = l.name;
    document.getElementById("mapModal").style.display = "flex";

    updateModalView();
}

function updateModalView() {
    const pdfViewer = document.getElementById("pdfViewer");
    const noMapMsg = document.getElementById("noMapMessage");
    const floorIndicator = document.getElementById("floorIndicator");
    const prevBtn = document.getElementById("prevFloorBtn");
    const nextBtn = document.getElementById("nextFloorBtn");

    // Support both old floorPlans (array) and new floorMap (single PDF)
    if (currentBuilding.floorMap && currentBuilding.floorMap.file) {
        pdfViewer.style.display = "block";
        noMapMsg.style.display = "none";

        // Use URL fragment to navigate to specific page
        const pageNum = currentFloorIndex + 1;
        pdfViewer.src = `${currentBuilding.floorMap.file}#page=${pageNum}`;

        floorIndicator.textContent = `Floor ${pageNum}`;

        // Update button states
        prevBtn.disabled = currentFloorIndex === 0;
        nextBtn.disabled = currentFloorIndex === currentBuilding.floorMap.floors - 1;
    } else if (currentBuilding.floorPlans && currentBuilding.floorPlans.length > 0) {
        // Legacy support for array of PDFs
        pdfViewer.style.display = "block";
        noMapMsg.style.display = "none";
        pdfViewer.src = currentBuilding.floorPlans[currentFloorIndex];

        floorIndicator.textContent = `Floor ${currentFloorIndex + 1}`;

        // Update button states
        prevBtn.disabled = currentFloorIndex === 0;
        nextBtn.disabled = currentFloorIndex === currentBuilding.floorPlans.length - 1;
    } else {
        pdfViewer.style.display = "none";
        noMapMsg.style.display = "block";
        floorIndicator.textContent = "Floor -";
        prevBtn.disabled = true;
        nextBtn.disabled = true;
    }
}

document.getElementById("closeModalBtn").onclick = () => {
    document.getElementById("mapModal").style.display = "none";
    document.getElementById("pdfViewer").src = ""; // Stop loading
};

document.getElementById("prevFloorBtn").onclick = () => {
    if (currentFloorIndex > 0) {
        currentFloorIndex--;
        updateModalView();
    }
};

document.getElementById("nextFloorBtn").onclick = () => {
    const maxFloor = currentBuilding.floorMap
        ? currentBuilding.floorMap.floors - 1
        : currentBuilding.floorPlans
            ? currentBuilding.floorPlans.length - 1
            : 0;

    if (currentFloorIndex < maxFloor) {
        currentFloorIndex++;
        updateModalView();
    }
};

// Expose to global scope for popup button
window.openBuildingMap = openBuildingMap;
