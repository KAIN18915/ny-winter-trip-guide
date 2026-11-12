(function () {
  const CAL_LABEL = "日付別最安目安（Google Flights, 2026-11-07確認）";
  const NYE = "2026-12-31";
  const NYD = "2027-01-01";

  let calendars, hotels, lodging;

  function $(id) {
    return document.getElementById(id);
  }

  function priceFor(routeId, iso) {
    const route = calendars.routes.find((r) => r.routeId === routeId);
    if (!route || !route.prices[iso]) return null;
    return route.prices[iso];
  }

  function daysBetween(a, b) {
    const da = new Date(a + "T12:00:00Z");
    const db = new Date(b + "T12:00:00Z");
    return Math.round((db - da) / 86400000);
  }

  function dateInNycRange(checkIn, checkOut, d) {
    return d >= checkIn && d < checkOut;
  }

  function validateNycConstraint(nycCheckIn, nycCheckOut, warnings) {
    if (!dateInNycRange(nycCheckIn, nycCheckOut, NYE)) {
      warnings.push("12/31（大晦日）に NYC 滞在が日付上含まれません。チェックインを早めるか、到着日を再確認してください。");
    }
    if (!dateInNycRange(nycCheckIn, nycCheckOut, NYD)) {
      warnings.push("1/1（元日）に NYC 滞在が日付上含まれません。チェックアウトを 1/2 以降にしてください。");
    }
  }

  function scaleLodging(total6, nights, baseNights) {
    if (!total6 || nights <= 0) return null;
    return Math.round((total6 / baseNights) * nights);
  }

  function updateHeatmaps() {
    const types = [
      ["hm-sea-nyc", "sea-nyc"],
      ["hm-nyc-sea", "nyc-sea"],
      ["hm-sea-lax", "sea-lax"],
      ["hm-lax-nyc", "lax-nyc"],
    ];
    for (const [elId, routeId] of types) {
      const el = $(elId);
      if (!el) continue;
      const route = calendars.routes.find((r) => r.routeId === routeId);
      el.innerHTML = "";
      if (!route) continue;
      const entries = Object.entries(route.prices).sort();
      const max = Math.max(...entries.map((e) => e[1]));
      const min = Math.min(...entries.map((e) => e[1]));
      for (const [d, p] of entries) {
        const cell = document.createElement("div");
        cell.className = "heat-cell";
        const t = (p - min) / (max - min + 1);
        const hue = Math.round(120 - t * 120);
        cell.style.background = `hsl(${hue} 55% 88%)`;
        cell.innerHTML = `<span class="heat-date">${d.slice(5)}</span><span class="heat-price">$${p}</span>`;
        el.appendChild(cell);
      }
    }
  }

  function googleFlightsUrl() {
    return "https://www.google.com/travel/flights";
  }

  function compute() {
    const warnings = [];
    const route = $("route-type").value;
    const seaDep = $("sea-departure").value;
    const ret = $("return-date").value;
    const bayAirport = $("bay-airport")?.value || "oak";
    const laNights = parseInt($("stopover-nights").value, 10) || 0;
    const nycArrival = $("nyc-arrival").value;
    const lodgingSel = $("lodging-select").value;

    $("warn-box").hidden = warnings.length === 0;
    $("warn-list").innerHTML = "";

    const nycCheckOut = ret;
    let nycCheckIn = nycArrival;
    const nycNights = daysBetween(nycCheckIn, nycCheckOut);
    if (nycNights < 2) warnings.push("NY 泊数が短すぎる可能性があります（目安）。");

    validateNycConstraint(nycCheckIn, nycCheckOut, warnings);

    if (ret === NYE) {
      warnings.push("帰路を 12/31 にすると大晦日の NYC 滞在と矛盾する恐れがあります。");
    }

    let legs = [];
    let stopCost = 0;
    let stopLabel = "";

    if (route === "ny-only") {
      const p1 = priceFor("sea-nyc", seaDep);
      const p2 = priceFor("nyc-sea", ret);
      legs.push({ label: "SEA→NYC", date: seaDep, price: p1 });
      legs.push({ label: "NYC→SEA", date: ret, price: p2 });
    } else if (route === "la-via") {
      const laArr = seaDep;
      const laxToNy = nycArrival;
      const p1 = priceFor("sea-lax", laArr);
      const p2 = priceFor("lax-nyc", laxToNy);
      const p3 = priceFor("nyc-sea", ret);
      legs.push({ label: "SEA→LAX", date: laArr, price: p1 });
      legs.push({ label: "LAX→NYC", date: laxToNy, price: p2 });
      legs.push({ label: "NYC→SEA", date: ret, price: p3 });
      const lod = hotels.la4n.stays.find((s) => s.name === lodgingSel);
      if (lod) {
        stopCost = scaleLodging(lod.totalUsd, laNights || 4, 4) || lod.totalUsd;
        stopLabel = `LA 宿泊（${laNights || 4}泊・目安）`;
      }
    } else {
      const bayRoute = bayAirport === "sfo" ? "sea-sfo" : "sea-oak";
      const nyRoute = bayAirport === "sfo" ? "sfo-nyc" : "oak-nyc";
      const p1 = priceFor(bayRoute, seaDep);
      const p2 = priceFor(nyRoute, nycArrival);
      const p3 = priceFor("nyc-sea", ret);
      legs.push({ label: calendars.routes.find((r) => r.routeId === bayRoute).label, date: seaDep, price: p1 });
      legs.push({ label: calendars.routes.find((r) => r.routeId === nyRoute).label, date: nycArrival, price: p2 });
      legs.push({ label: "NYC→SEA", date: ret, price: p3 });
      stopLabel = "ベイエリア 友人宅（可否未確認・$0 目安）";
      stopCost = 0;
    }

    const nycLod = hotels.nyc6n.stays.find((s) => s.name === lodgingSel) ||
      lodging.find((l) => l.name === lodgingSel && l.google_hotels_6n_total_usd);
    let nycLodCost = null;
    if (nycLod) {
      const total = nycLod.totalUsd || nycLod.google_hotels_6n_total_usd;
      nycLodCost = scaleLodging(total, nycNights, 6);
    }

    const flightSum = legs.reduce((s, l) => s + (l.price || 0), 0);
    const missing = legs.filter((l) => l.price == null);

    const tbody = $("leg-table").querySelector("tbody");
    tbody.innerHTML = legs
      .map(
        (l) =>
          `<tr><td>${l.label}</td><td>${l.date}</td><td class="price">${l.price != null ? "$" + l.price : "—"} <span class="tag tag--estimate">目安</span></td></tr>`
      )
      .join("");

    $("lodging-line").textContent =
      nycLodCost != null
        ? `NYC 宿泊 ${nycNights}泊: $${nycLodCost}（6泊総額から按分・目安）`
        : "NYC 宿泊: 未選択または価格未確認";
    $("stopover-line").textContent = route === "ny-only" ? "経由地宿泊: なし" : `${stopLabel}: $${stopCost}`;

    const total = flightSum + (nycLodCost || 0) + stopCost;
    $("total-line").innerHTML = `<strong>合計目安: $${total}</strong>` + (missing.length ? ` <span class="tag tag--unverified">一部運賃未登録</span>` : "");
    $("cal-label").textContent = CAL_LABEL;
    $("gf-link").href = googleFlightsUrl();

    if (route === "la-via" && $("stopover-nights").value) {
      const dep = new Date(seaDep + "T12:00:00Z");
      dep.setUTCDate(dep.getUTCDate() + laNights);
      const suggested = dep.toISOString().slice(0, 10);
      if ($("nyc-arrival").value < suggested) {
        warnings.push(`LA ${laNights}泊後の最短 NYC 出発は ${suggested} 頃が目安です。`);
      }
    }

    $("warn-box").hidden = warnings.length === 0;
    $("warn-list").innerHTML = warnings.map((w) => `<li>${w}</li>`).join("");
  }

  function fillSelects() {
    const dep = $("sea-departure");
    const ret = $("return-date");
    const arr = $("nyc-arrival");
    const route = calendars.routes.find((r) => r.routeId === "sea-nyc");
    for (const d of Object.keys(route.prices).sort()) {
      dep.add(new Option(d, d));
    }
    const back = calendars.routes.find((r) => r.routeId === "nyc-sea");
    for (const d of Object.keys(back.prices).sort()) {
      if (d !== "2027-01-04") ret.add(new Option(d + (d === "2027-01-04" ? "（授業日参考）" : ""), d));
    }
    dep.value = "2026-12-28";
    ret.value = "2027-01-03";
    for (const d of Object.keys(route.prices).sort()) {
      arr.add(new Option(d, d));
    }
    arr.value = "2026-12-28";

    const sel = $("lodging-select");
    hotels.nyc6n.stays.forEach((s) => sel.add(new Option(`${s.name} — 6泊 $${s.totalUsd}（目安）`, s.name)));
  }

  function dataRoot() {
    return document.documentElement.getAttribute("data-root") || "";
  }

  async function init() {
    const base = dataRoot();
    const [c, h, l] = await Promise.all([
      fetch(`${base}data/fare-calendars.json`).then((r) => r.json()),
      fetch(`${base}data/hotel-google-prices.json`).then((r) => r.json()),
      fetch(`${base}data/lodging.json`).then((r) => r.json()),
    ]);
    calendars = c;
    hotels = h;
    lodging = l;
    fillSelects();
    updateHeatmaps();
    ["route-type", "sea-departure", "return-date", "nyc-arrival", "stopover-nights", "lodging-select", "bay-airport"].forEach(
      (id) => {
        const el = $(id);
        if (el) el.addEventListener("change", compute);
      }
    );
    $("route-type").addEventListener("change", () => {
      const v = $("route-type").value;
      $("bay-fields").hidden = v !== "bay";
      $("la-fields").hidden = v !== "la-via";
      compute();
    });
    compute();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
