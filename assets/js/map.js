(function () {
  async function init() {
    const mapEl = document.getElementById("map");
    if (!mapEl || typeof L === "undefined") return;
    const [points, lodging] = await Promise.all([
      fetch("data/map_points.json").then((r) => r.json()),
      fetch("data/lodging.json").then((r) => r.json()),
    ]);
    const map = L.map("map").setView([40.75, -73.98], 11);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    for (const p of points) {
      if (p.lat == null || p.lng == null) continue;
      const img = p.image ? p.image.replace("img/", "assets/img/") : null;
      const html = `<strong>${p.subject}</strong>${img ? `<br><img src="${img}" alt="" loading="lazy" style="max-width:160px">` : ""}<br><small>${p.coordinate_source || ""}</small>`;
      L.marker([p.lat, p.lng]).addTo(map).bindPopup(html);
    }

    for (const l of lodging) {
      if (l.lat == null || l.lng == null) continue;
      L.circleMarker([l.lat, l.lng], { color: l.city === "LA" ? "#e65100" : "#0d47a1", radius: 6 })
        .addTo(map)
        .bindPopup(`<strong>${l.name}</strong><br>${l.area || ""}<br><a href="${l.official_url}">公式</a>`);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
