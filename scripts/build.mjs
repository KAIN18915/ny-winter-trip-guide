#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DATA = path.join(ROOT, "data");

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(DATA, name), "utf8"));
}

const meta = readJson("meta.json");
const uw = readJson("uw-calendar.json");
const plans = readJson("plans.json");
const planA = readJson("plan-a-itinerary.json");
const planB = readJson("plan-b-itinerary.json");
const nye = readJson("nye.json");
const practical = readJson("practical.json");
const fares = readJson("fares.json");
const costs = readJson("cost-estimates.json");

const NAV = [
  { href: "index.html", label: "トップ" },
  { href: "plan-a.html", label: "案A" },
  { href: "plan-b.html", label: "案B" },
  { href: "nye.html", label: "年越し" },
  { href: "practical.html", label: "実務" },
  { href: "fares.html", label: "運賃" },
];

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tag(type) {
  const map = {
    fact: ["事実", "tag--fact"],
    estimate: ["目安", "tag--estimate"],
    proposal: ["提案", "tag--proposal"],
    unverified: ["未確認", "tag--unverified"],
    reference: ["参考", "tag--proposal"],
  };
  const [label, cls] = map[type] || ["", "tag--fact"];
  return label ? `<span class="tag ${cls}">${label}</span>` : "";
}

function cite(url, checked, extra = "") {
  if (!url) return "";
  return `<span class="cite">出典: <a href="${esc(url)}" rel="noopener noreferrer">${esc(url)}</a>　確認: ${esc(checked)}${extra ? ` — ${esc(extra)}` : ""}</span>`;
}

function layout({ title, current, body }) {
  const nav = NAV.map(
    (n) =>
      `<a href="${n.href}"${current === n.href ? ' aria-current="page"' : ""}>${esc(n.label)}</a>`
  ).join("\n");
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)} | ${esc(meta.siteTitle)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
  <header class="site-header">
    <div class="site-header__inner">
      <p class="site-title">${esc(meta.siteTitle)}</p>
      <nav class="site-nav" aria-label="主要ページ">${nav}</nav>
    </div>
  </header>
  <main>
    ${body}
  </main>
  <footer class="site-footer">
    <p>${esc(meta.disclaimer)}</p>
    <p>データ確認日（調査）: ${esc(meta.researchCheckedDatePST)}（PST）／運賃確認: ${esc(meta.faresCheckedAtPST)}（PST）</p>
    <p><a href="README.md">README・出典一覧</a></p>
  </footer>
</body>
</html>`;
}

function banner() {
  return `<div class="banner" role="status"><strong>${esc(meta.nothingBooked)}</strong> ${esc(meta.disclaimer)}</div>`;
}

function buildIndex() {
  const cmp = plans.comparison;
  const cmpTable = `
    <div class="table-wrap"><table>
      <thead><tr>
        <th>項目</th><th>${esc(cmp[0].name)}</th><th>${esc(cmp[1].name)}</th>
      </tr></thead>
      <tbody>
        <tr><td>SEA 出発</td><td>${esc(cmp[0].departureSEA)}</td><td>${esc(cmp[1].departureSEA)}</td></tr>
        <tr><td>NY 到着</td><td>${esc(cmp[0].arrivalNY)}</td><td>${esc(cmp[1].laToNY)}（LA 経由後）</td></tr>
        <tr><td>LA 滞在</td><td>—</td><td>${esc(cmp[1].laStay)}（${cmp[1].laNights}泊）</td></tr>
        <tr><td>大晦日・元日</td><td>${esc(cmp[0].nyeAndNewYear)}</td><td>${esc(cmp[1].nyeAndNewYear)}</td></tr>
        <tr><td>SEA 帰着（推奨）</td><td>${esc(cmp[0].returnSEA)}</td><td>${esc(cmp[1].returnSEA)}</td></tr>
        <tr><td>帰路メモ</td><td colspan="2">${esc(cmp[0].returnNote)}</td></tr>
        <tr><td>日数</td><td>${cmp[0].durationDays}日</td><td>${cmp[1].durationDays}日</td></tr>
        <tr><td>航空区間</td><td>${cmp[0].flightLegs}本</td><td>${cmp[1].flightLegs}本</td></tr>
        <tr><td>中心</td><td>${esc(cmp[0].focus)}</td><td>${esc(cmp[1].focus)}</td></tr>
        <tr><td>移動負担</td><td>${esc(cmp[0].travelBurden)}</td><td>${esc(cmp[1].travelBurden)}</td></tr>
      </tbody>
    </table></div>
    ${cite(uw.sourceUrl, uw.checkedDate)}`;

  const cal = plans.calendarEvents
    .map((e) => {
      const trip = e.plan === "both" || e.plan;
      let planBadge = "";
      if (e.plan === "both") {
        planBadge = ' <span class="tag tag--proposal">両案</span>';
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

  const body = `
    ${banner()}
    <h1>結論と2案比較</h1>
    <p class="lead">シアトル在住・学生1人・年末年始の予算旅行案。12/31 と 1/1 は NYC 滞在を固定。</p>
    <div class="rec-box">
      ${tag("proposal")}
      <p>${esc(plans.recommendation.summary)}</p>
      <span class="cite">確認: ${esc(plans.checkedDate)}（PST）</span>
    </div>

    <h2>UW 学事日程 ${tag("fact")}</h2>
    <ul class="compact">
      ${uw.facts.map((f) => `<li>${esc(f.item)}: ${esc(f.dates)}</li>`).join("")}
    </ul>
    ${cite(uw.sourceUrl, uw.checkedDate)}
    <ul class="compact">
      ${uw.unverified.map((u) => `<li>${tag("unverified")} ${esc(u.item)}: ${esc(u.status)} — ${esc(u.note)}</li>`).join("")}
      ${uw.constraints.map((c) => `<li>${tag("proposal")} ${esc(c)}</li>`).join("")}
    </ul>

    <h2>2案比較表</h2>
    ${cmpTable}

    <h2>日程カレンダー</h2>
    <div class="cal-grid">${cal}</div>

    <h2>費用目安（USD・1人） ${tag("estimate")}</h2>
    <p class="lead">${esc(costs.disclaimer)}</p>
    <div class="table-wrap"><table>
      <thead><tr><th>案</th><th>概算合計</th><th>航空券メモ</th></tr></thead>
      <tbody>${costRows}</tbody>
    </table></div>
    <p>詳細内訳と実運賃サンプルは <a href="fares.html">運賃ページ</a> 参照。</p>
    ${cite("https://www.washington.edu/students/reg/2627cal.html", costs.checkedDate, costs.sourceNote)}
  `;
  return layout({ title: "結論・比較", current: "index.html", body });
}

function buildPlanItinerary(data, current) {
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
    <div class="table-wrap"><table>
      <thead><tr><th>日付</th><th>行程</th><th>移動</th><th>休館・メモ</th></tr></thead>
      <tbody>${rows}</tbody>
    </table></div>
    <span class="cite">行程確認日: ${esc(data.checkedDate)}（PST）</span>
  `;
  return layout({ title: data.title, current, body });
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
  return layout({ title: "年越し", current: "nye.html", body });
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
    <div class="table-wrap"><table>
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
    <div class="table-wrap"><table>
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
  return layout({ title: "実務", current: "practical.html", body });
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
        <div class="table-wrap"><table>
          <thead><tr><th>便</th><th>詳細</th><th>表示運賃</th></tr></thead>
          <tbody>${opts}</tbody>
        </table></div>`;
    })
    .join("");

  const costDetail = costs.plans
    .map(
      (p) => `<h3>${esc(p.name)} 内訳 <span class="tag tag--estimate">目安</span></h3>
      <div class="table-wrap"><table>
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
    <p class="lead">${esc(fares.passengerNote)} ${esc(fares.variableDisclaimer)}</p>
    <p>確認日時: <strong>${esc(fares.checkedAtPST)}（PST）</strong></p>

    <h2>${esc(fares.planA.title)}</h2>
    <p><a href="${esc(fares.planA.searchUrl)}">Google Flights で再検索</a></p>
    <div class="table-wrap"><table>
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
  return layout({ title: "運賃", current: "fares.html", body });
}

const pages = [
  ["index.html", buildIndex()],
  ["plan-a.html", buildPlanItinerary(planA, "plan-a.html")],
  ["plan-b.html", buildPlanItinerary(planB, "plan-b.html")],
  ["nye.html", buildNye()],
  ["practical.html", buildPractical()],
  ["fares.html", buildFares()],
];

for (const [file, html] of pages) {
  fs.writeFileSync(path.join(ROOT, file), html, "utf8");
  console.log("Wrote", file);
}

// Copy data snapshot for transparency (optional reference without JS)
fs.mkdirSync(path.join(ROOT, "data"), { recursive: true });
console.log("Build complete.");
