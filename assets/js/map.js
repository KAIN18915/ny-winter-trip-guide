(function () {
  var FX = 159.51378;

  function dataRoot() {
    return document.documentElement.getAttribute("data-root") || "";
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function group(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function usdText(n) {
    if (n == null || n === "") return "価格の記載なし";
    var v = Number(n);
    if (!isFinite(v)) return "価格の記載なし";
    var digits = Math.abs(v - Math.round(v)) < 1e-9 ? 0 : 2;
    var parts = v.toFixed(digits).split(".");
    return parts[1] ? "$" + group(parts[0]) + "." + parts[1] : "$" + group(parts[0]);
  }

  function jpyText(n) {
    if (n == null || n === "") return "";
    var yen = Math.round(Number(n) * FX);
    if (!isFinite(yen)) return "";
    return "約" + group(yen) + "円";
  }

  function fmtMin(n) {
    if (n == null || n === "") return "—";
    var v = Number(n);
    if (!isFinite(v)) return "—";
    if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
    return String(v);
  }

  function typeLabel(type) {
    if (type === "hotel") return "ホテル";
    if (type === "airbnb") return "Airbnb";
    return type || "";
  }

  function headline(item) {
    var mins = fmtMin(item.best_minutes);
    if (item.recommended_mode === "walk") return "徒歩 " + mins + "分";
    if (item.recommended_mode === "transit") return "公共交通 " + mins + "分";
    return (item.recommended_mode || "最短") + " " + mins + "分";
  }

  function taxLabel(item) {
    if (item.taxes_included === true) return "税・手数料込み";
    return "税込みかどうかは記載なし";
  }

  function refundLabel(value) {
    if (value === true) return "返金可";
    if (value === false) return "返金不可";
    if (value === "options") return "返金は選択肢による（データ上 options）";
    return "返金条件は未記載";
  }

  function summaryOf(route) {
    if (!route) return "";
    if (route.legs_summary_ja) return route.legs_summary_ja;
    return "";
  }

  function popupHtml(item) {
    var yen = jpyText(item.total_5_nights_usd);
    var transit = item.transit;
    var summary = summaryOf(transit) || item.legs_summary_ja || "";
    var transitLine = transit
      ? "公共交通: " + fmtMin(transit.total_minutes) + "分"
      : "公共交通: データに無い";
    var alt = (item.transit_alternatives || [])[0];
    var wait =
      transit && typeof transit.wait_after_19_00_minutes === "number" && transit.wait_after_19_00_minutes > 0
        ? transit.wait_after_19_00_minutes
        : null;
    var html = '<div class="stay-pop">';
    html += "<strong>" + esc(item.name) + "</strong>";
    html += "<p>" + esc(typeLabel(item.type)) + " · " + esc(item.area || "") + "</p>";
    html += '<p class="stay-pop-time">' + esc(headline(item)) + "</p>";
    html +=
      "<p>" +
      esc(usdText(item.total_5_nights_usd)) +
      ' <span class="tag tag--estimate">目安</span>' +
      (yen ? " · " + esc(yen) + "（159.51378円換算・目安）" : "") +
      "</p>";
    html += "<p>" + esc(taxLabel(item)) + "。 " + esc(refundLabel(item.refundable)) + "。</p>";
    html += "<p>徒歩: " + esc(fmtMin(item.walk_minutes)) + "分</p>";
    html += "<p>" + esc(transitLine) + "</p>";
    if (summary) html += "<p>" + esc(summary) + "</p>";
    if (alt) {
      html +=
        "<p>別ルート: " +
        esc(fmtMin(alt.total_minutes)) +
        "分" +
        (alt.legs_summary_ja ? " — " + esc(alt.legs_summary_ja) : "") +
        "</p>";
    }
    if (wait != null) {
      html += "<p>19:00 より後の初便待ち " + esc(fmtMin(wait)) + "分は、合計に入っていない。</p>";
    }
    if (item.coords_approximate) html += "<p>地図の位置は約 150m の概算（Airbnb）</p>";
    html +=
      '<p><a href="' +
      esc(item.url) +
      '" target="_blank" rel="noopener noreferrer">掲載ページ</a></p>';
    html += "</div>";
    return html;
  }

  function pinIcon(kind) {
    var size = kind === "dest" ? [22, 22] : [16, 16];
    return L.divIcon({
      className: "pin pin-" + kind,
      iconSize: size,
      iconAnchor: [size[0] / 2, size[1] / 2],
      popupAnchor: [0, -size[1] / 2],
    });
  }

  function bindHover(marker) {
    var timer = null;
    marker.on("mouseover", function () {
      window.clearTimeout(timer);
      marker.openPopup();
    });
    marker.on("mouseout", function () {
      timer = window.setTimeout(function () {
        var el = marker.getPopup() && marker.getPopup().getElement();
        if (el && el.matches(":hover")) return;
        marker.closePopup();
      }, 320);
    });
    marker.on("popupopen", function (event) {
      var el = event.popup.getElement();
      if (!el || el.getAttribute("data-hover-bound")) return;
      el.setAttribute("data-hover-bound", "1");
      el.addEventListener("mouseenter", function () {
        window.clearTimeout(timer);
      });
      el.addEventListener("mouseleave", function () {
        timer = window.setTimeout(function () {
          marker.closePopup();
        }, 200);
      });
    });
  }

  function passes(item, filters) {
    if (filters.type !== "all" && item.type !== filters.type) return false;
    if (filters.maxMin !== "" && Number(item.best_minutes) > Number(filters.maxMin)) return false;
    if (filters.maxPrice !== "") {
      if (item.total_5_nights_usd == null) return false;
      if (Number(item.total_5_nights_usd) > Number(filters.maxPrice)) return false;
    }
    return true;
  }

  async function init() {
    var mapEl = document.getElementById("map");
    if (!mapEl || typeof L === "undefined") return;
    var base = dataRoot();
    var countEl = document.getElementById("stay-count");
    var data;
    try {
      var response = await fetch(base + "data/map_stays.json");
      if (!response.ok) throw new Error(String(response.status));
      data = await response.json();
    } catch (error) {
      if (countEl) countEl.textContent = "地図データを読み込めませんでした。下の一覧は使えます。";
      return;
    }

    var listings = data.listings || [];
    var destination = data.destination;
    var map = L.map(mapEl, { zoomControl: false }).setView([40.75, -73.98], 12);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    var hoverOK = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    var markers = listings.map(function (item) {
      var kind = item.type === "airbnb" ? "airbnb" : "hotel";
      var marker = L.marker([item.lat, item.lng], { icon: pinIcon(kind), title: item.name })
        .addTo(map)
        .bindPopup(popupHtml(item), { maxWidth: 280, autoPan: true });
      if (hoverOK) bindHover(marker);
      return marker;
    });

    if (destination && destination.lat != null && destination.lng != null) {
      L.marker([destination.lat, destination.lng], { icon: pinIcon("dest"), zIndexOffset: 1000, title: "タイムズスクエア" })
        .addTo(map)
        .bindPopup("<strong>タイムズスクエア</strong><p>7番街。西45–46丁目寄り。所要時間の目的地。</p>");
    }

    var bounds = L.latLngBounds(listings.map(function (item) { return [item.lat, item.lng]; }));
    if (destination) bounds.extend([destination.lat, destination.lng]);
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [18, 18] });

    var rows = Array.prototype.slice.call(document.querySelectorAll("#stay-list [data-stay-index]"));
    rows.forEach(function (row) {
      var button = row.querySelector("button");
      if (!button) return;
      button.addEventListener("mousedown", function (event) {
        event.preventDefault();
      });
      button.addEventListener("click", function () {
        var index = Number(row.getAttribute("data-stay-index"));
        var item = listings[index];
        var marker = markers[index];
        if (!item || !marker) return;
        map.setView([item.lat, item.lng], Math.max(map.getZoom(), 15));
        marker.openPopup();
        var top = mapEl.getBoundingClientRect().top + window.pageYOffset - 60;
        window.scrollTo({ top: Math.max(0, top), left: 0, behavior: "instant" });
      });
    });

    function readFilters() {
      return {
        type: document.getElementById("stay-type").value,
        maxMin: document.getElementById("stay-max-min").value.trim(),
        maxPrice: document.getElementById("stay-max-price").value.trim(),
      };
    }

    function apply() {
      var filters = readFilters();
      var shown = 0;
      listings.forEach(function (item, index) {
        var ok = passes(item, filters);
        if (ok) shown += 1;
        var row = rows[index];
        if (row) row.classList.toggle("is-hidden", !ok);
        if (ok) markers[index].addTo(map);
        else markers[index].remove();
      });
      if (countEl) countEl.textContent = "表示 " + shown + " / " + listings.length;
    }

    ["stay-type", "stay-max-min", "stay-max-price"].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("input", apply);
      el.addEventListener("change", apply);
    });
    apply();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
