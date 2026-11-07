export function buildV2Pages(ctx) {
  const {
    esc,
    tag,
    cite,
    banner,
    layoutExt,
    readJson,
    assetPre = "",
    lodgingSlugs = null,
    stayListDepth = 1,
  } = ctx;

  const lodging = readJson("lodging.json");
  const options = readJson("options.json");
  const scenarios = readJson("date_scenarios.json");
  const credits = readJson("commons_credits.json");
  const calendars = readJson("fare-calendars.json");
  const hotels = readJson("hotel-google-prices.json");
  const planC = readJson("plan-c-itinerary.json");
  const manifest = readJson("manifest.json");

  const creditsById = Object.fromEntries(credits.map((c) => [c.id, c]));

  function photoCap(creditId, areaLabel = "", inline = false) {
    const c = creditsById[creditId];
    if (!c) return "";
    const pre = areaLabel ? `<strong>${esc(areaLabel)}</strong> — ` : "";
    const inner = `<small>${pre}写真: ${esc(c.author)} / <a href="${esc(c.license_url || c.file_page_url)}">${esc(c.license)}</a> · <a href="${esc(c.file_page_url)}">Commons</a> · ${esc(c.caption_note || "")}</small>`;
    return inline ? inner : `<span class="photo-cap">${inner}</span>`;
  }

  function figureImg(src, creditId, { variant = "card", areaLabel = "" } = {}) {
    const ar = variant === "hero" ? "ar-hero" : variant === "thumb" ? "ar-thumb" : "ar-card";
    const thumbCls = variant === "thumb" ? " vimg--thumb" : "";
    const cap = creditId ? photoCap(creditId, areaLabel, true) : "";
    return `<figure class="vimg${thumbCls}"><div class="img-box ${ar}"><img src="${esc(src)}" alt="" loading="lazy" decoding="async"></div>${cap ? `<figcaption>${cap}</figcaption>` : ""}</figure>`;
  }

  function commonsImgPath(p) {
    if (!p) return `${assetPre}assets/img/01.webp`;
    if (p.startsWith("http") || p.startsWith("/")) return p;
    if (p.startsWith("assets/")) return `${assetPre}${p}`;
    return `${assetPre}assets/${p.replace(/^img\//, "img/")}`;
  }

  function buildPlanner() {
    const scenarioRows = scenarios
      .slice(0, 49)
      .map(
        (s) => `<tr>
          <td>${esc(s.id)}</td>
          <td>${esc(s.kind || s.name)}</td>
          <td>${esc(s.sea_departure_candidate_dates?.join(", ") || "—")}</td>
          <td>${esc(s.nyc_checkin || "—")}→${esc(s.nyc_checkout || "—")}（${s.nyc_nights ?? "—"}泊）</td>
          <td>${esc(s.seattle_arrival_candidate || "—")}</td>
          <td>${tag("proposal")} ${esc(s.status || "")}</td>
        </tr>`
      )
      .join("");

    const body = `
      ${banner()}
      <h1>日程プランナー（日付可変）</h1>
      <p class="lead">12/31 と 1/1 は NYC 滞在必須。運賃・宿は <span class="tag tag--estimate">目安</span>。JavaScript 無効時は下のシナリオ表を参照。</p>

      <noscript>
        <h2>JS 無効: 49 シナリオ一覧</h2>
        <div class="table-wrap table-scroll"><table class="wide">
          <thead><tr><th>ID</th><th>種別</th><th>SEA 出発候補</th><th>NYC 宿泊</th><th>SEA 帰着</th><th>状態</th></tr></thead>
          <tbody>${scenarioRows}</tbody>
        </table></div>
      </noscript>

      <div id="planner-app">
        <h2>カスタム組み合わせ</h2>
        <div class="form-grid">
          <label>ルート
            <select id="route-type">
              <option value="ny-only">NYのみ</option>
              <option value="la-via">LA経由</option>
              <option value="bay">ベイエリア（友人宅）経由</option>
            </select>
          </label>
          <label>SEA 出発日
            <select id="sea-departure"></select>
          </label>
          <label>NYC 到着日（目安）
            <select id="nyc-arrival"></select>
          </label>
          <label>NYC→SEA 帰路
            <select id="return-date"></select>
          </label>
          <span id="la-fields"><label>LA 泊数（目安）
            <input type="number" id="stopover-nights" min="0" max="6" value="4" />
          </label></span>
          <span id="bay-fields" hidden><label>湾岸空港
            <select id="bay-airport"><option value="oak">OAK</option><option value="sfo">SFO</option></select>
          </label></span>
          <label>NYC 宿（Google Hotels 6泊総額）
            <select id="lodging-select"></select>
          </label>
        </div>

        <div id="warn-box" class="banner" hidden>
          <ul id="warn-list" class="compact"></ul>
        </div>

        <p id="cal-label"></p>
        <div class="table-wrap table-scroll"><table id="leg-table" class="wide">
          <thead><tr><th>区間</th><th>日付</th><th>運賃</th></tr></thead>
          <tbody></tbody>
        </table></div>
        <p id="lodging-line"></p>
        <p id="stopover-line"></p>
        <p id="total-line"></p>
        <p><a id="gf-link" href="https://www.google.com/travel/flights" rel="noopener">Google Flights で再検索</a></p>

        <h2>価格ヒートマップ <span class="tag tag--estimate">目安</span></h2>
        <div class="heat-section"><h3>SEA→NYC</h3><div class="heat-grid" id="hm-sea-nyc"></div></div>
        <div class="heat-section"><h3>NYC→SEA</h3><div class="heat-grid" id="hm-nyc-sea"></div></div>
        <div class="heat-section"><h3>SEA→LAX</h3><div class="heat-grid" id="hm-sea-lax"></div></div>
        <div class="heat-section"><h3>LAX→NYC</h3><div class="heat-grid" id="hm-lax-nyc"></div></div>
        ${cite("https://www.google.com/travel/flights", calendars.checkedAt, calendars.note)}
      </div>
    `;
    return layoutExt({
      title: "プランナー",
      nav: "planner",
      depth: 1,
      body,
      scripts: ["assets/js/planner.js"],
    });
  }

  function buildStays() {
    const relSlug = stayListDepth === 1 ? "" : "../";
    const cards = lodging
      .map((l) => {
        const img = commonsImgPath(l.commons_image);
        const price6 = l.google_hotels_6n_total_usd;
        const priceNye = l.google_hotels_nye_total_usd;
        const priceLa = l.google_hotels_la4n_total_usd;
        const priceData = price6 || priceLa || 99999;
        const slug = lodgingSlugs?.get(l.id) || l.id;
        const detailHref = `${relSlug}${slug}/`;
        const fig = l.commons_credit_id
          ? figureImg(img, l.commons_credit_id, { variant: "thumb", areaLabel: "エリアの写真" })
          : '<div class="img-box ar-thumb noph"><small>写真なし</small></div>';
        return `<article class="stay-card card" data-card data-city="${esc(l.city)}" data-area="${esc(l.area)}" data-price="${priceData}" hidden="false">
          ${fig}
          <div class="cb"><h3><a href="${esc(detailHref)}">${esc(l.name)}</a></h3>
          <p>${esc(l.area)} · ${esc(l.type)}</p>
          <p>${price6 ? `6泊: $${price6} <span class="tag tag--estimate">目安</span>` : '<span class="tag tag--unverified">6泊価格未確認</span>'}</p>
          <p>${priceNye ? `大晦日1泊: $${priceNye} <span class="tag tag--estimate">目安</span>` : ""}</p>
          <p>${priceLa ? `LA 4泊: $${priceLa} <span class="tag tag--estimate">目安</span>` : ""}</p>
          <p class="cite">確認: ${esc(l.checked_at)}</p>
          </div>
        </article>`;
      })
      .join("");

    const body = `
      ${banner()}
      <h1>宿泊候補（${lodging.length}件）</h1>
      <p class="lead">Google Hotels 実売表示の一部をマッチ。全件の指定日総額は未確認のものあり。</p>
      <div class="filter-bar">
        <input type="search" id="stay-search" placeholder="検索" />
        <select id="stay-city"><option value="all">全都市</option><option value="NYC">NYC</option><option value="LA">LA</option></select>
        <select id="stay-area"><option value="all">全エリア</option></select>
        <label>最大6泊総額 <input type="number" id="price-max" value="2500" /></label>
      </div>
      <div class="cards" id="stays-grid" data-filter-grid="stays-grid" data-filter-search="stay-search" data-filter-city="stay-city" data-filter-cat="stay-area">
        ${cards}
      </div>
      ${cite(hotels.nyc6n.searchUrl || "https://www.google.com/travel/hotels", hotels.checkedAt, hotels.disclaimer)}
    `;
    return layoutExt({ title: "宿泊", nav: "stays", depth: 1, body, scripts: ["assets/js/cards-filter.js"] });
  }

  function buildOptionsPage() {
    const categories = [...new Set(options.map((o) => o.category))].sort();
    const catOpts = categories.map((c) => `<option value="${esc(c)}">${esc(c)}</option>`).join("");

    const cards = options
      .map((o) => {
        const img = o.image_asset ? commonsImgPath(o.image_asset.replace(/^assets\//, "")) : null;
        const unv = (o.source_status || "").includes("未確認");
        const price = o.price_usd != null ? `$${o.price_usd}` : "—";
        return `<article class="option-card card${unv ? " is-muted" : ""}" data-card data-city="${esc(o.city)}" data-category="${esc(o.category)}" data-price="${o.price_usd || 0}">
          ${img && o.commons_credit_id ? figureImg(img, o.commons_credit_id, { variant: "thumb" }) : img ? `<figure class="vimg vimg--thumb"><div class="img-box ar-thumb"><img src="${esc(img)}" alt="" loading="lazy" decoding="async"></div></figure>` : ""}
          ${!img && o.commons_credit_id ? photoCap(o.commons_credit_id) : ""}
          <div class="cb"><h3><a href="${esc(o.source_url)}">${esc(o.name)}</a></h3>
          <p>${esc(o.category)} · ${esc(o.city)} ${unv ? tag("unverified") : ""}</p>
          <p>12/31: ${esc(o.hours_2026_12_31)}</p>
          <p>1/1: ${esc(o.hours_2027_01_01)}</p>
          <p>料金: ${esc(price)} ${o.price_note ? `<small>${esc(o.price_note)}</small>` : ""}</p>
          <span class="cite">確認: ${esc(o.checked_at)}</span></div>
        </article>`;
      })
      .join("");

    const body = `
      ${banner()}
      <h1>観光・食事・イベント（${options.length}件）</h1>
      <div class="filter-bar">
        <input type="search" id="opt-search" placeholder="検索" />
        <select id="opt-city"><option value="all">全都市</option><option value="NYC">NYC</option><option value="LA">LA</option></select>
        <select id="opt-cat"><option value="all">全カテゴリ</option>${catOpts}</select>
      </div>
      <div class="cards" id="options-grid" data-filter-grid="options-grid" data-filter-search="opt-search" data-filter-city="opt-city" data-filter-cat="opt-cat">
        ${cards}
      </div>
    `;
    return layoutExt({ title: "観光・食事・イベント", nav: "guide", depth: 2, body, scripts: ["assets/js/cards-filter.js"] });
  }

  function buildMap() {
    const body = `
      ${banner()}
      <h1>地図</h1>
      <p class="lead">OpenStreetMap タイル。座標は出典付き（data/map_points.json）。座標 null の宿はピンなし。</p>
      <div id="map" class="map-canvas" role="application" aria-label="旅行候補地図"></div>
      <p>${tag("estimate")} 写真は参考イメージであり現地の 2026 年末状況を保証しません。</p>
    `;
    return layoutExt({
      title: "地図",
      nav: "map",
      depth: 1,
      body,
      extraHead:
        '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">',
      scripts: [
        "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
        "assets/js/map.js",
      ],
    });
  }

  function buildCredits() {
    const rows = credits
      .map(
        (c) => `<tr>
          <td><img src="${commonsImgPath(c.path)}" alt="" loading="lazy" width="120" /></td>
          <td>${esc(c.subject)}</td>
          <td>${esc(c.author)}</td>
          <td><a href="${esc(c.license_url)}">${esc(c.license)}</a></td>
          <td><a href="${esc(c.file_page_url)}">Commons</a></td>
          <td>${esc(c.checked_at)}</td>
        </tr>`
      )
      .join("");

    const body = `
      ${banner()}
      <h1>写真クレジット（Wikimedia Commons ${credits.length}枚）</h1>
      <p class="lead">サイト掲載写真は Commons の自由ライセンスのみ。加工: WebP リサイズ。</p>
      <div class="table-wrap"><table>
        <thead><tr><th>画像</th><th>対象</th><th>作者</th><th>ライセンス</th><th>出典</th><th>確認</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    `;
    return layoutExt({ title: "クレジット", nav: "credits", depth: 1, body });
  }

  function buildPlanC(ctxBuildPlan) {
    return ctxBuildPlan(planC);
  }

  function buildFaresCalendars(ctxFares) {
    const old = ctxFares();
    const calTables = calendars.routes
      .map((r) => {
        const cells = Object.entries(r.prices)
          .sort()
          .map(([d, p]) => `<tr><td>${esc(d)}</td><td class="price">$${p} <span class="tag tag--estimate">目安</span></td></tr>`)
          .join("");
        return `<h2>${esc(r.label)}</h2>
          <p><span class="tag tag--estimate">目安</span> ${esc(r.disclaimer)}</p>
          ${r.sampleItinerary ? `<p><small>${esc(r.sampleItinerary)}</small></p>` : ""}
          <div class="table-wrap"><table><thead><tr><th>日付</th><th>最安目安</th></tr></thead><tbody>${cells}</tbody></table></div>`;
      })
      .join("");
    return old.replace(
      "<h1>実運賃（Google Flights）</h1>",
      `<h1>実運賃（Google Flights）</h1>
      <div class="card"><p>${esc(calendars.note)} 往復 $558 と比較して片道2本が安い日あり（例: 12/29発 + 1/1帰りはカレンダー上 $189+$279=$468 目安）。</p></div>
      <h2>片道価格カレンダー（2026-11-07 PST）</h2>
      ${calTables}`
    );
  }

  function patchIndex(html, plans, links = {}) {
    const lp = links.planner || "planner/";
    const ls = links.stays || "stays/";
    const lg = links.guide || "guide/";
    const lm = links.map || "map/";
    const lpc = links.planC || "plan/c/";
    const extra = `<p class="links"><a href="${esc(lp)}">プランナー</a> · <a href="${esc(ls)}">宿泊</a> · <a href="${esc(lg)}">ガイド</a> · <a href="${esc(lm)}">地図</a> · <a href="${esc(links.compare || "compare/")}">比較</a></p>
      <p><span class="tag tag--proposal">案C</span> <a href="${esc(lpc)}">ベイエリア経由</a> — 友人宅（可否・日程は未確認）</p>`;
    return html.replace("</h1>", `</h1>\n${extra}`);
  }

  function buildStayDetail(l, slug, assetDepth = 2) {
    const pre = "../".repeat(assetDepth);
    const img = commonsImgPath(l.commons_image);
    const price6 = l.google_hotels_6n_total_usd;
    const priceNye = l.google_hotels_nye_total_usd;
    const priceLa = l.google_hotels_la4n_total_usd;
    const body = `
      ${banner()}
      <p><a href="../">← 宿泊一覧</a></p>
      <h1 class="pg-h">${esc(l.name)}</h1>
      <p>${esc(l.area)} · ${esc(l.type)} · ${esc(l.city)}</p>
      ${figureImg(img, l.commons_credit_id, { variant: "hero", areaLabel: "エリアの写真" })}
      <h2>料金 <span class="tag tag--estimate">目安</span></h2>
      <ul class="compact">
        <li>6泊（12/28→1/3）: ${price6 ? `$${price6}` : '<span class="tag tag--unverified">未確認</span>'}</li>
        <li>大晦日1泊: ${priceNye ? `$${priceNye}` : "—"}</li>
        <li>LA 4泊比較: ${priceLa ? `$${priceLa}` : "—"}</li>
      </ul>
      <p class="note">${esc(l.price_note || "")}</p>
      <h2>アクセス</h2>
      <p>${l.nearest_subway ? esc(l.nearest_subway) : `<span class="tag tag--unverified">最寄駅未確認</span>`}</p>
      <p class="note">${esc(l.nearest_subway_note || "")}</p>
      <h2>リンク・出典</h2>
      <p><a href="${esc(l.official_url)}" rel="noopener">公式ページ</a></p>
      <ul class="compact">${(l.notes || []).map((n) => `<li>${esc(n)}</li>`).join("")}</ul>
      ${(l.sources || []).map((s) => cite(s.url || s.final_url, s.checked_at || l.checked_at)).join("")}
      <p class="cite">確認: ${esc(l.checked_at)} · listing: ${esc(l.listing_status || "")}</p>
    `;
    return layoutExt({ title: l.name, nav: "stays", depth: 2, body });
  }

  return {
    buildPlanner,
    buildStays,
    buildOptionsPage,
    buildMap,
    buildCredits,
    buildPlanC,
    buildFaresCalendars,
    patchIndex,
    buildStayDetail,
    figureImg,
    photoCap,
    commonsImgPath,
    lodging,
    options,
    scenarios,
    credits,
    planC,
  };
}
