import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildV2Pages } from "./render-v2.mjs";
import { esc, tag, cite } from "./lib/html.mjs";
import { renderCurrentPlan } from "./site/current-plan.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DATA = path.join(ROOT, "data");

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(DATA, name), "utf8"));
}

export function runSiteBuild({ layouts, write, lodgingSlugs, guideAreas }) {
const meta = readJson("meta.json");
const uw = readJson("uw-calendar.json");
const plans = readJson("plans.json");
const planA = readJson("plan-a-itinerary.json");
const planB = readJson("plan-b-itinerary.json");
const nye = readJson("nye.json");
const practical = readJson("practical.json");
const fares = readJson("fares.json");
const costs = readJson("cost-estimates.json");
const currentPlan = readJson("current-plan.json");
const stayMap = readJson("map_stays.json");

const layout0 = layouts[0];
const layout1 = layouts[1];
const layout2 = layouts[2];
const layout3 = layouts[3] || layout2;

function layoutExt(opts) {
  const depth = opts.depth ?? 0;
  const lay = [layout0, layout1, layout2, layout3][depth] || layout0;
  return lay({
    title: opts.title,
    nav: opts.nav || "home",
    body: opts.body,
    extraHead: opts.extraHead || "",
    scripts: opts.scripts || [],
    wide: opts.wide,
  });
}

function banner() {
  return `<ul class="alerts static" role="status">
  <li class="a-cap"><b>未予約・暫定</b> <span>${esc(meta.nothingBooked)}</span></li>
</ul>`;
}

function costForPlan(planKey) {
  const row = costs.plans.find((p) => p.planKey === planKey);
  return row?.totalRangeUsd || "—";
}

function buildIndex() {
  const cmp = plans.comparison;
  const c0 = cmp[0];
  const c1 = cmp[1];
  const c2 = cmp[2];
  const cmpTable = `
    <div class="table-wrap table-scroll"><table class="wide">
      <thead><tr>
        <th>項目</th><th>${esc(c0.name)}</th><th>${esc(c1.name)}</th><th>${esc(c2.name)}</th>
      </tr></thead>
      <tbody>
        <tr><td>SEA 出発</td><td>${esc(c0.departureSEA)}</td><td>${esc(c1.departureSEA)}</td><td>${esc(c2.departureSEA)}</td></tr>
        <tr><td>経由・滞在</td><td>—</td><td>${esc(c1.laStay || "—")}</td><td>${esc(c2.bayStay)}</td></tr>
        <tr><td>→ NYC</td><td>${esc(c0.arrivalNY)}</td><td>${esc(c1.laToNY)}</td><td>${esc(c2.bayToNY)}</td></tr>
        <tr><td>12/31・1/1</td><td>${esc(c0.nyeAndNewYear)}</td><td>${esc(c1.nyeAndNewYear)}</td><td>${esc(c2.nyeAndNewYear)}</td></tr>
        <tr><td>SEA 帰着</td><td>${esc(c0.returnSEA)}</td><td>${esc(c1.returnSEA)}</td><td>${esc(c2.returnSEA)}</td></tr>
        <tr><td>航空区間</td><td>${c0.flightLegs}本</td><td>${c1.flightLegs}本</td><td>${c2.flightLegs}本</td></tr>
        <tr><td>中心</td><td>${esc(c0.focus)}</td><td>${esc(c1.focus)}</td><td>${esc(c2.focus)}</td></tr>
        <tr><td>コストメモ</td><td>${esc(c0.costNote)}</td><td>${esc(c1.costNote)}</td><td>${esc(c2.costNote)}</td></tr>
      </tbody>
    </table></div>
    ${cite(uw.sourceUrl, uw.checkedDate)}`;

  const cal = plans.calendarEvents
    .map((e) => {
      const trip = e.plan === "both" || e.plan;
      let planBadge = "";
      if (e.plan === "both") {
        planBadge = ' <span class="tag tag--proposal">A/B</span>';
      } else if (e.plan === "all") {
        planBadge = ' <span class="tag tag--proposal">全案</span>';
      } else if (e.plan === "current") {
        planBadge = ' <span class="tag tag--estimate">暫定</span>';
      } else if (e.plan) {
        planBadge = ` <span class="tag tag--proposal">案${String(e.plan).toUpperCase()}</span>`;
      }
      return `<div class="cal-item${trip ? " cal-item--trip" : ""}">
        <time datetime="${esc(e.date)}">${esc(e.date)}</time>
        ${esc(e.label)}${planBadge}
      </div>`;
    })
    .join("");

  const costRows = costs.plans
    .map(
      (p) => `<tr>
        <td>${esc(p.name)}</td>
        <td class="price">${esc(p.totalRangeUsd)} <span class="tag tag--estimate">目安</span></td>
        <td>${esc(p.lines.find((l) => l.item === "航空券")?.note || "")}</td>
      </tr>`
    )
    .join("");

  const currentHtml = renderCurrentPlan(currentPlan, {
    photoCap: (creditId, areaLabel, inline) => v2d1.photoCap(creditId, areaLabel, inline),
    lodgingHref: (id) => {
      const slug = lodgingSlugs.get(id);
      return slug ? `stays/${slug}/` : "";
    },
  });

  const body = `
    ${banner()}
    ${currentHtml}

    <section class="panel" id="stay-map-link">
      <h2>宿と Times Square までの所要時間</h2>
      <p>${esc(String(stayMap.counts.on_map))}件（ホテル ${esc(String(stayMap.counts.hotel))}、Airbnb ${esc(String(stayMap.counts.airbnb))}）を地図に置いています。未予約・目安。12/28 チェックイン、1/2 チェックアウト、5泊、1名。</p>
      <p class="btns"><a class="btn" href="map/">地図を開く</a></p>
    </section>

    <h2>UW 学事日程 ${tag("fact")}</h2>
    <ul class="compact">
      ${uw.facts.map((f) => `<li>${esc(f.item)}: ${esc(f.dates)}</li>`).join("")}
    </ul>
    ${cite(uw.sourceUrl, uw.checkedDate)}
    <ul class="compact">
      ${uw.unverified.map((u) => `<li>${tag("unverified")} ${esc(u.item)}: ${esc(u.status)} — ${esc(u.note)}</li>`).join("")}
      ${uw.constraints.map((c) => `<li>${tag("proposal")} ${esc(c)}</li>`).join("")}
    </ul>

    <h2>代替案（案A・案B・案C）</h2>
    <p class="lead">上の暫定とは別の案です。予約ではありません。12/31 と 1/1 は NYC。<a href="planner/">日付可変プランナー</a>は、2026-11-07 の片道カレンダーで試すページです。案Cの滞在は友人宅（可否未確認）。</p>
    <section class="panel"><h2 class="pg-h" style="margin-top:0">3案</h2>
    <div class="plans">${cmp
      .map((p) => {
        const slug = p.key.replace("plan-", "");
        const days = esc(p.durationDays || "—");
        const amt =
          p.key === "plan-c"
            ? "$900–2,200"
            : esc(costForPlan(p.key));
        return `<article class="plan"><header><b>${esc(p.name.split("：")[0])}</b> <span class="lbl c-est">目安</span></header>
        <p class="amt">${amt} <small>概算合計（USD）</small></p>
        <p class="pname">${esc(p.name)} · ${days}</p>
        <ul class="keypts">
          <li>出発: ${esc(p.departureSEA)}</li>
          <li>12/31・1/1: ${esc(p.nyeAndNewYear)}</li>
          <li>帰国: ${esc(p.returnSEA)}</li>
          <li>${esc(p.focus)}</li>
        </ul>
        <p class="btns"><a class="btn" href="plan/${slug}/">行程を見る</a> <a class="btn" href="planner/">日付試算</a></p>
        </article>`;
      })
      .join("")}</div></section>
    <div class="rec-box">
      ${tag("proposal")}
      <p>${esc(plans.recommendation.summary)}</p>
      <span class="cite">確認: ${esc(plans.checkedDate)}（PT）</span>
    </div>

    <h2>3案比較表</h2>
    ${cmpTable}

    <h2>日程シナリオ（49件） ${tag("proposal")}</h2>
    <p>${esc(plans.scenarioNote)} — <a href="planner/">一覧・試算</a></p>

    <h2>日程カレンダー</h2>
    <div class="cal-grid">${cal}</div>

    <h2>費用目安（USD・1人） ${tag("estimate")}</h2>
    <p class="lead">案A/B/Cの古い概算です。ホーム上部の 2026-11-11 の Expedia・Google Flights とは別です。${esc(costs.disclaimer)}</p>
    <div class="table-wrap table-scroll"><table class="wide">
      <thead><tr><th>案</th><th>概算合計</th><th>航空券メモ</th></tr></thead>
      <tbody>${costRows}</tbody>
    </table></div>
    <p>詳細内訳と実運賃サンプルは <a href="fares/">運賃ページ</a> 参照。</p>
    ${cite("https://www.washington.edu/students/reg/2627cal.html", costs.checkedDate, costs.sourceNote)}
  `;
  return layoutExt({ title: "現行の暫定プラン", nav: "home", body, depth: 0 });
}

function buildPlanItinerary(data, planNav) {
  const rows = data.days
    .map(
      (d) => `<tr>
        <td>${esc(d.date)}<br>（${esc(d.weekdayJa)}）</td>
        <td>${esc(d.summary)}</td>
        <td>${esc(d.transit)}</td>
        <td>${d.closuresRef ? esc(d.closuresRef) : "—"}</td>
      </tr>`
    )
    .join("");

  const extra =
    data.optionalEarlierReturn &&
    `<p>${tag("proposal")} 任意の早期帰国: ${esc(data.optionalEarlierReturn.date)} — ${esc(data.optionalEarlierReturn.reason)}</p>`;

  const body = `
    ${banner()}
    <h1>${esc(data.title)}</h1>
    <p class="lead">${esc(data.dates)}　${tag(data.type === "proposal" ? "proposal" : "fact")}</p>
    <p>${esc(data.note)}</p>
    ${extra || ""}
    <h2>日別行程表 ${tag("proposal")}</h2>
    <div class="table-wrap table-scroll"><table class="wide">
      <thead><tr><th>日付</th><th>行程</th><th>移動</th><th>休館・メモ</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <span class="cite">行程確認日: ${esc(data.checkedDate)}（PST）</span>
  `;
  return layoutExt({ title: data.title, nav: planNav || "home", body, depth: 1 });
}

function buildNye() {
  const blocks = nye.options
    .map((opt) => {
      const sources = opt.sources
        .map((s) => cite(s.url, s.checkedDate, s.note || ""))
        .join("");
      const rules =
        opt.referenceRulesFromPastFaq &&
        `<ul class="compact">${opt.referenceRulesFromPastFaq
          .map(
            (r) =>
              `<li>${tag(r.type === "unverified" || r.type === "unverified_for_2026" ? "unverified" : r.type === "fact_from_faq" ? "fact" : "reference")} ${esc(r.item)}: ${esc(r.value)}</li>`
          )
          .join("")}</ul>`;
      const sched =
        opt.schedule &&
        `<ul class="compact">${opt.schedule
          .map(
            (s) =>
              `<li>${tag(s.type === "unverified" ? "unverified" : "fact")} ${esc(s.item)}: ${esc(s.value)}</li>`
          )
          .join("")}</ul>`;
      return `<section class="card">
        <h2>${esc(opt.name)}</h2>
        <p>${esc(opt.price)}</p>
        ${rules || ""}
        ${sched || ""}
        ${opt.proposal ? `<p>${tag("proposal")} ${esc(opt.proposal)}</p>` : ""}
        ${sources}
      </section>`;
    })
    .join("");

  const body = `
    ${banner()}
    <h1>年越しの過ごし方（NYC）</h1>
    <p class="lead">${esc(nye.intro)}</p>
    ${blocks}
    <span class="cite">ページ確認日: ${esc(nye.checkedDate)}（PST）</span>
  `;
  return layoutExt({ title: "年越し", nav: "guide", body, depth: 2 });
}

function buildPractical() {
  const nyRows = practical.airportAccessNY.items
    .map(
      (a) => `<tr>
        <td>${esc(a.airport)}</td>
        <td>${esc(a.route)} ${a.durationNote ? `<span class="tag tag--estimate">目安</span>` : ""}</td>
        <td>${esc(a.fare)}</td>
      </tr>`
    )
    .join("");

  const closureRows = practical.closures.rows
    .map(
      (r) => `<tr>
        <td>${esc(r.venue)}</td>
        <td>${esc(r.dec25)}</td>
        <td>${esc(r.jan1)}</td>
      </tr>`
    )
    .join("");

  const body = `
    ${banner()}
    <h1>実務情報（交通・休館・天気）</h1>

    <h2>${esc(practical.nycTransit.title)} ${tag("fact")}</h2>
    <ul class="compact">
      ${practical.nycTransit.items
        .map(
          (i) =>
            `<li>${esc(i.label)}: ${esc(i.value)} ${cite(i.sourceUrl, i.checkedDate)}</li>`
        )
        .join("")}
    </ul>
    <p>${esc(practical.nycTransit.note)}</p>

    <h2>${esc(practical.airportAccessNY.title)}</h2>
    <div class="table-wrap table-scroll"><table class="wide">
      <thead><tr><th>空港</th><th>ルート</th><th>運賃（参考）</th></tr></thead>
      <tbody>${nyRows}</tbody>
    </table></div>
    ${practical.airportAccessNY.items
      .map((a) => cite(a.sources[0], a.checkedDate))
      .slice(0, 1)
      .join("")}
    <p>${tag("proposal")} ${esc(practical.airportAccessNY.proposal)}</p>
    <p>${tag("unverified")} LIRR 便料金・夜間ダイヤ・空港工事（NY）。LA: ${practical.laTransit.unverified.map(esc).join("、")}</p>

    <h2>${esc(practical.laTransit.title)}</h2>
    <ul class="compact">
      ${practical.laTransit.items
        .map((i) => `<li>${esc(i.label)}: ${esc(i.value)} ${cite(i.sourceUrl, i.checkedDate)}</li>`)
        .join("")}
    </ul>

    <h2>${esc(practical.closures.title)}</h2>
    <div class="table-wrap table-scroll"><table class="wide">
      <thead><tr><th>施設</th><th>12/25</th><th>1/1</th></tr></thead>
      <tbody>${closureRows}</tbody>
    </table></div>
    ${practical.closures.rows.map((r) => cite(r.sourceUrl, practical.closures.checkedDate)).slice(0, 1).join("")}

    <h2>${esc(practical.weather.title)}</h2>
    <ul class="compact">
      ${practical.weather.items
        .map((w) => `<li>${esc(w.date)} — 最高 ${esc(w.highC)}、最低 ${esc(w.lowC)}</li>`)
        .join("")}
    </ul>
    ${cite(practical.weather.sourceUrl, practical.weather.checkedDate)}
    <p>${tag("unverified")} ${esc(Array.isArray(practical.weather.unverified) ? practical.weather.unverified.join("、") : practical.weather.unverified)}</p>
    <p>${tag("proposal")} ${esc(practical.weather.proposal)}</p>

    <h2>持ち物・書類</h2>
    <p>${esc(practical.packingAndDocuments.j1OneLine)} ${cite(practical.packingAndDocuments.sourceUrl, practical.packingAndDocuments.checkedDate)}</p>

    <h2>${esc(practical.laFreeAttractions.title)}</h2>
    <ul class="compact">
      ${practical.laFreeAttractions.items
        .map((i) => `<li><strong>${esc(i.name)}</strong>: ${esc(i.note)} ${cite(i.url, practical.laFreeAttractions.checkedDate)}</li>`)
        .join("")}
    </ul>
  `;
  return layoutExt({ title: "実務", nav: "practical", body, depth: 1 });
}

function buildFares() {
  const planArows = fares.planA.options
    .map(
      (o) => `<tr>
        <td>${esc(o.airline)}</td>
        <td>${esc(o.route)}</td>
        <td>${esc(o.detail)}</td>
        <td class="price">$${o.priceUsd}</td>
      </tr>`
    )
    .join("");

  const planBSections = fares.planB.segments
    .map((seg) => {
      const opts = seg.options
        .map(
          (o) => `<tr>
            <td>${esc(o.airline)}</td>
            <td>${esc(o.detail)}</td>
            <td class="price">$${o.priceUsd}</td>
          </tr>`
        )
        .join("");
      return `<h3>${esc(seg.title)}</h3>
        <p><a href="${esc(seg.searchUrl)}">Google Flights で再検索</a>　確認: ${esc(fares.checkedAtPST)}（PST）</p>
        <div class="table-wrap table-scroll"><table class="wide">
          <thead><tr><th>便</th><th>詳細</th><th>表示運賃</th></tr></thead>
          <tbody>${opts}</tbody>
        </table></div>`;
    })
    .join("");

  const costDetail = costs.plans
    .map(
      (p) => `<h3>${esc(p.name)} 内訳 <span class="tag tag--estimate">目安</span></h3>
      <div class="table-wrap table-scroll"><table class="wide">
        <thead><tr><th>項目</th><th>レンジ</th><th>メモ</th></tr></thead>
        <tbody>${p.lines
          .map(
            (l) =>
              `<tr><td>${esc(l.item)}</td><td>${esc(l.range)}</td><td>${l.note ? esc(l.note) : "—"}</td></tr>`
          )
          .join("")}</tbody>
      </table></div>`
    )
    .join("");

  const body = `
    ${banner()}
    <h1>実運賃（Google Flights）</h1>
    <p class="lead">現行暫定の直行参考帯（2026-11-11、約 $686–722）は<a href="../">ホーム</a>。このページは 2026-11-07 のカレンダーです。${esc(fares.passengerNote)} ${esc(fares.variableDisclaimer)}</p>
    <p>確認日時: <strong>${esc(fares.checkedAtPST)}（PST）</strong></p>

    <h2>${esc(fares.planA.title)}</h2>
    <p><a href="${esc(fares.planA.searchUrl)}">Google Flights で再検索</a></p>
    <div class="table-wrap table-scroll"><table class="wide">
      <thead><tr><th>航空会社</th><th>区間</th><th>詳細</th><th>表示運賃</th></tr></thead>
      <tbody>${planArows}</tbody>
    </table></div>
    ${cite("https://www.google.com/travel/flights", fares.checkedAtPST, "検索結果は変動します")}

    <h2>案B（3区間）</h2>
    ${planBSections}
    <div class="card">
      <p><span class="tag tag--estimate">目安</span> ${esc(fares.planB.comboEstimate.description)}</p>
      <p class="price">${esc(fares.planB.comboEstimate.calculation)}</p>
      <p>${esc(fares.planB.comboEstimate.alt)}</p>
      <p>${tag("unverified")} ${esc(fares.planB.comboEstimate.lodgingNote)}</p>
    </div>

    <h2>総予算レンジ（宿泊等込み・目安）</h2>
    <p>${esc(costs.disclaimer)}</p>
    ${costDetail}
  `;
  return layoutExt({ title: "運賃", nav: "fares", body, depth: 1 });
}

function buildCompare(v2d1) {
  const lodging = v2d1.lodging;
  const hotels = readJson("hotel-google-prices.json");
  const calendars = readJson("fare-calendars.json");
  const fareRows = calendars.routes
    .slice(0, 6)
    .map((r) => {
      const sample = Object.entries(r.prices).sort().slice(0, 5);
      return `<tr><td>${esc(r.label)}</td><td>${sample.map(([d, p]) => `${esc(d)} $${p}`).join("<br>")}</td></tr>`;
    })
    .join("");
  const stayRows = lodging
    .filter((l) => l.city === "NYC")
    .slice(0, 20)
    .map(
      (l) => `<tr>
        <td><a href="../stays/${esc(lodgingSlugs.get(l.id))}/">${esc(l.name)}</a></td>
        <td>${esc(l.area)}</td>
        <td>${l.google_hotels_6n_total_usd ? `$${l.google_hotels_6n_total_usd}` : '<span class="tag tag--unverified">未確認</span>'}</td>
      </tr>`
    )
    .join("");
  const body = `
    ${banner()}
    <h1 class="pg-h">運賃・宿泊の比較</h1>
    <p class="lead">${tag("estimate")} Google Flights / Google Hotels の調査値。購入前に再確認。現行暫定（5泊・2026-11-11）は <a href="../">ホーム</a>。</p>
    <h2>片道運賃サンプル（各ルート先頭5日）</h2>
    <div class="table-wrap table-scroll"><table class="wide"><thead><tr><th>ルート</th><th>日付・目安</th></tr></thead><tbody>${fareRows}</tbody></table></div>
    ${cite("https://www.google.com/travel/flights", calendars.checkedAt, calendars.note)}
    <h2>NYC 宿泊候補（6泊目安・一部）</h2>
    <div class="table-wrap table-scroll"><table class="wide"><thead><tr><th>宿</th><th>エリア</th><th>6泊総額</th></tr></thead><tbody>${stayRows}</tbody></table></div>
    <p><a href="../stays/">全 ${lodging.length} 件 →</a></p>
    ${cite(hotels.nyc6n?.searchUrl || "https://www.google.com/travel/hotels", hotels.checkedAt, hotels.disclaimer)}
  `;
  return layoutExt({ title: "比較", nav: "compare", body, depth: 1 });
}

function assignOptionArea(o, areas) {
  const hay = `${o.name} ${o.category} ${o.city} ${(o.notes || []).join(" ")}`.toLowerCase();
  if (hay.includes("new year") || hay.includes("nye") || hay.includes("times square") && hay.includes("eve")) return "nye";
  if (o.city === "LA") return "la";
  if (o.city === "SF" || hay.includes("oakland")) return "bay";
  for (const a of areas) {
    if (a.id === "nye") continue;
    if (a.keywords.some((kw) => hay.includes(kw.toLowerCase()))) return a.id;
  }
  if (o.city === "NYC") return "midtown";
  return "queens";
}

function buildGuideIndex(v2, areas) {
  const cards = areas
    .map((a) => {
      const img = a.heroPhoto
        ? `<div class="img-box ar-thumb"><img src="../assets/${esc(a.heroPhoto)}" alt="" loading="lazy" decoding="async"></div>`
        : "";
      return `<a class="card guide-area" href="${a.id}/">${img}<div class="cb"><b>${esc(a.nameJa)}</b></div></a>`;
    })
    .join("");
  const body = `
    ${banner()}
    <h1 class="pg-h">エリア別ガイド</h1>
    <div class="cards">${cards}</div>
    <p><a href="more/">全 ${v2.options.length} 件の候補一覧 →</a></p>
  `;
  return layoutExt({ title: "旅行ガイド", nav: "guide", body, depth: 1 });
}

function buildGuideArea(areaId, v2, areas) {
  const area = areas.find((a) => a.id === areaId);
  const opts = v2.options.filter((o) => assignOptionArea(o, areas) === areaId);
  const heroBlock =
    area.heroPhoto && area.creditId
      ? `<figure class="vimg"><div class="img-box ar-hero"><img src="../../assets/${esc(area.heroPhoto)}" alt="" loading="lazy" decoding="async"></div><figcaption>${v2.photoCap(area.creditId, area.areaLabel || "エリアの写真")}</figcaption></figure>`
      : area.id === "bay"
        ? `<p class="note">${tag("unverified")} ベイエリア用の Commons 参考写真は未掲載（住居可否も未確認）。</p>`
        : "";
  const cards = opts
    .map((o) => {
      const img = o.image_asset ? v2.commonsImgPath(o.image_asset) : null;
      const unv = (o.source_status || "").includes("未確認");
        return `<article class="card option-card${unv ? " is-muted" : ""}">
        ${img ? `<figure class="vimg vimg--thumb"><div class="img-box ar-thumb"><img src="${esc(img)}" alt="" loading="lazy" decoding="async"></div></figure>` : ""}
        <div class="cb"><h3><a href="${esc(o.source_url)}" rel="noopener">${esc(o.name)}</a> ${unv ? tag("unverified") : ""}</h3>
        <p>${esc(o.category)} · 12/31 ${esc(o.hours_2026_12_31)} / 1/1 ${esc(o.hours_2027_01_01)}</p>
        ${o.commons_credit_id ? v2.photoCap(o.commons_credit_id) : ""}
        </div></article>`;
    })
    .join("");
  const body = `
    ${banner()}
    <p><a href="../">← ガイド一覧</a></p>
    <h1 class="pg-h">${esc(area.nameJa)}</h1>
    ${heroBlock}
    <p>${opts.length} 件の候補</p>
    <div class="cards">${cards || "<p>該当候補なし</p>"}</div>
  `;
  return layoutExt({ title: area.nameJa, nav: "guide", body, depth: 2 });
}

const v2d1 = buildV2Pages({
  esc,
  tag,
  cite,
  banner,
  layoutExt,
  readJson,
  assetPre: "../",
  lodgingSlugs,
  stayListDepth: 1,
});

const v2d2 = buildV2Pages({
  esc,
  tag,
  cite,
  banner,
  layoutExt,
  readJson,
  assetPre: "../../",
  lodgingSlugs,
  stayListDepth: 2,
});

let indexHtml = buildIndex();
indexHtml = v2d1.patchIndex(indexHtml, plans);

const out = [
  ["index.html", indexHtml],
  ["planner/index.html", v2d1.buildPlanner()],
  ["compare/index.html", buildCompare(v2d1)],
  ["stays/index.html", v2d1.buildStays()],
  ["guide/index.html", buildGuideIndex(v2d1, guideAreas)],
  ["guide/more/index.html", v2d2.buildOptionsPage()],
  ["map/index.html", v2d1.buildMap()],
  ["fares/index.html", v2d1.buildFaresCalendars(buildFares)],
  ["practical/index.html", buildPractical()],
  ["credits/index.html", v2d1.buildCredits()],
  ["plan/a/index.html", buildPlanItinerary(planA, "home")],
  ["plan/b/index.html", buildPlanItinerary(planB, "home")],
  ["plan/c/index.html", v2d1.buildPlanC((data) => buildPlanItinerary(data, "home"))],
  ["guide/nye/index.html", buildNye()],
];

for (const l of v2d1.lodging) {
  const slug = lodgingSlugs.get(l.id);
  out.push([`stays/${slug}/index.html`, v2d2.buildStayDetail(l, slug, 2)]);
}

for (const a of guideAreas) {
  if (a.id === "nye") continue;
  out.push([`guide/${a.id}/index.html`, buildGuideArea(a.id, v2d2, guideAreas)]);
}

for (const [file, html] of out) {
  write(file, html);
}

return { pages: out.map(([f]) => f), lodgingSlugs };
}
