const UNT_CENTER = [33.2075, -97.1526];
let map, markers = [], locationsData = [], routingControl = null;

// Initialize map
function initMap() {
  map = L.map("map", { center: UNT_CENTER, zoom: 15 });
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);
}

// Create marker
function createMarker(loc) {
  const m = L.marker([loc.lat, loc.lng]).addTo(map);
  m.bindPopup(`<strong>${loc.name}</strong><br>${loc.description || ""}`);
  m.on("click", () => focusLocation(loc.id));
  return m;
}

// Render markers
function renderMarkers(locs) {
  markers.forEach(m => map.removeLayer(m));
  markers = locs.map(createMarker);
}

// Render sidebar list
function renderList(locs) {
  const list = document.getElementById("locationList");
  list.innerHTML = "";
  const container = document.getElementById("directionsContainer");
  container.innerHTML = "";

  if (!locs.length) {
    const li = document.createElement("li");
    li.textContent = "No locations found.";
    li.className = "empty";
    list.appendChild(li);
    return;
  }

  locs.forEach(loc => {
    const li = document.createElement("li");
    li.textContent = loc.name;
    li.className = "location-item";
    li.onclick = () => focusLocation(loc.id);
    list.appendChild(li);
  });
}

// Focus a location
function focusLocation(id) {
  const loc = locationsData.find(l => l.id === id);
  if (!loc) return;

  map.setView([loc.lat, loc.lng], 17);
  highlightListItem(id);
  showDirectionsButton(loc);
}

// Highlight list
function highlightListItem(id) {
  const name = locationsData.find(l => l.id === id)?.name;
  document.querySelectorAll(".location-item").forEach(li => {
    li.classList.toggle("active", li.textContent === name);
  });
}

// Filter locations
function filterLocations() {
  const text = document.getElementById("searchInput").value.trim().toLowerCase();
  const activeCategories = Array.from(document.querySelectorAll(".category-filter"))
    .filter(cb => cb.checked)
    .map(cb => cb.value);

  const filtered = locationsData.filter(loc =>
    activeCategories.includes(loc.category) &&
    (loc.name.toLowerCase().includes(text) ||
     (loc.description && loc.description.toLowerCase().includes(text)))
  );

  renderMarkers(filtered);
  renderList(filtered);
  return filtered;
}

// Show directions button
function showDirectionsButton(loc) {
  const container = document.getElementById("directionsContainer");
  container.innerHTML = "";
  const btn = document.createElement("button");
  btn.textContent = `Get Directions to ${loc.name}`;
  btn.style.width = "100%";
  btn.onclick = () => showDirections(loc);
  container.appendChild(btn);
}

// Clear directions button
function clearDirectionsButton() {
  const container = document.getElementById("directionsContainer");
  if (container) container.innerHTML = "";
}

// Show route
function showDirections(dest) {
  if (routingControl) map.removeControl(routingControl);

  const start = navigator.geolocation
    ? (position => [position.coords.latitude, position.coords.longitude])
    : UNT_CENTER;

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => addRoute(pos.coords.latitude, pos.coords.longitude, dest.lat, dest.lng),
      () => addRoute(UNT_CENTER[0], UNT_CENTER[1], dest.lat, dest.lng)
    );
  } else {
    addRoute(UNT_CENTER[0], UNT_CENTER[1], dest.lat, dest.lng);
  }
}

// Add route
function addRoute(startLat, startLng, endLat, endLng) {
  routingControl = L.Routing.control({
    waypoints: [
      L.latLng(startLat, startLng),
      L.latLng(endLat, endLng)
    ],
    routeWhileDragging: false,
    addWaypoints: false,
    draggableWaypoints: false,
    createMarker: (i, wp) => L.marker(wp.latLng)
  }).addTo(map);
}

// Initialize filters
function initFilters() {
  const search = document.getElementById("searchInput");
  search.addEventListener("input", filterLocations);
  search.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      const filtered = filterLocations();
      if (filtered.length) focusLocation(filtered[0].id);
    }
  });

  document.querySelectorAll(".category-filter").forEach(cb => {
    cb.addEventListener("change", filterLocations);
  });
}

// Load locations
async function loadLocations() {
  const res = await fetch("data/locations.json");
  locationsData = await res.json();
  filterLocations();
}

// On DOM ready
window.addEventListener("DOMContentLoaded", () => {
  initMap();
  loadLocations().then(initFilters);
});
