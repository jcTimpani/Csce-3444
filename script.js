const UNT_CENTER = [33.2075, -97.1526]; let map, markers = [], locationsData = [];
function initMap() { map = L.map("map", { center: UNT_CENTER, zoom: 15 }); L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap" }).addTo(map); }
function createMarker(l) { const m = L.marker([l.lat, l.lng]).addTo(map); m.bindPopup(`<strong>${l.name}</strong><br/>${l.description || ""}`); m.on("click", () => highlightListItem(l.id)); return m; }
function renderMarkers(locs) { markers.forEach(m => map.removeLayer(m)); markers = []; locs.forEach(l => markers.push(createMarker(l))); }
function renderList(locs) { const list = document.getElementById("locationList"); list.innerHTML = ""; locs.forEach(l => { const li = document.createElement("li"); li.textContent = l.name; li.className = "location-item"; li.onclick = () => focusLocation(l.id); list.appendChild(li); }); }
function focusLocation(id) { const l = locationsData.find(x => x.id === id); if (!l) return; map.setView([l.lat, l.lng], 17); highlightListItem(id); }
function highlightListItem(id) { document.querySelectorAll(".location-item").forEach(i => { i.classList.toggle("active", i.textContent === locationsData.find(x => x.id === id).name); }); }
function renderDropdown(locs) {
    const sel = document.getElementById("buildingSelect");
    sel.innerHTML = '<option value="">Select a building...</option>';
    locs.sort((a, b) => a.name.localeCompare(b.name)).forEach(l => {
        const opt = document.createElement("option");
        opt.value = l.id;
        opt.textContent = l.name;
        sel.appendChild(opt);
    });
    sel.onchange = (e) => {
        const id = e.target.value;
        if (id) {
            const l = locationsData.find(x => x.id === id);
            if (l) {
                renderMarkers([l]);
                map.setView([l.lat, l.lng], 17);
                highlightListItem(id);
            }
        } else {
            filterLocations();
        }
    };
}
function filterLocations() { const checked = Array.from(document.querySelectorAll(".category-filter:checked")).map(c => c.value); const filtered = locationsData.filter(l => checked.includes(l.category)); renderMarkers(filtered); renderDropdown(filtered); }
document.querySelectorAll(".category-filter").forEach(c => c.addEventListener("change", filterLocations));
async function loadLocations() { const r = await fetch("data/locations.json"); locationsData = await r.json(); filterLocations(); }
window.addEventListener("DOMContentLoaded", () => { initMap(); loadLocations(); });
