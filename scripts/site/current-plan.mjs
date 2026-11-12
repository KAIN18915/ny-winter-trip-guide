import { esc, tag, cite } from "../lib/html.mjs";

function usdText(n) {
  const v = Number(n);
  const digits = Number.isInteger(v) ? 0 : 2;
  const [whole, frac] = v.toFixed(digits).split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return frac ? `$${grouped}.${frac}` : `$${grouped}`;
}

function jpyText(usd, rate) {
  const yen = Math.round(Number(usd) * rate);
  const grouped = String(yen).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `約${grouped}円`;
}

function priceBits(usd, rate) {
  return `${usdText(usd)} <span class="tag tag--estimate">目安</span> <small>${esc(jpyText(usd, rate))}（${esc(String(rate))}円換算）</small>`;
}

function planFigure(photoCap, image, creditId, areaLabel) {
  if (!image || !creditId || !photoCap) return "";
  const cap = photoCap(creditId, areaLabel, true);
  return `<figure class="vimg"><div class="img-box ar-card"><img src="${esc(image)}" alt="${esc(areaLabel)}" loading="lazy" decoding="async"></div>${cap ? `<figcaption>${cap}</figcaption>` : ""}</figure>`;
}

export function renderCurrentPlan(plan, { photoCap, lodgingHref }) {
  const rate = plan.exchange.usdJpy;
  const flight = plan.flights.nonstopReferenceUsd;
  const hotelPrices = plan.hotels.items.map((h) => h.priceUsd);
  const hotelMin = Math.min(...hotelPrices);
  const hotelMax = Math.max(...hotelPrices);
  const sumLo = flight.low + hotelMin;
  const sumHi = flight.high + hotelMax;

  const hotelCards = plan.hotels.items
    .map((h) => {
      const href = h.lodgingId && lodgingHref ? lodgingHref(h.lodgingId) : "";
      const name = href ? `<a href="${esc(href)}">${esc(h.name)}</a>` : esc(h.name);
      const extras = (h.extraPrices || [])
        .map((p) => `<p>${esc(p.label)} ${priceBits(p.usd, rate)}</p>`)
        .join("");
      const label = h.priceLabel ? `${esc(h.priceLabel)} ` : "";
      const rec = h.recommended ? `<span class="lbl c-rec">この5件では推奨</span> ` : "";
      return `<article class="stay-card card${h.recommended ? " is-rec" : ""}">
        ${planFigure(photoCap, h.image, h.creditId, h.areaLabel)}
        <div class="cb">
          <h3>${name}</h3>
          <p>${rec}<span class="lbl c-unv">未予約</span></p>
          <p>${esc(h.area)}</p>
          <p class="price-line">${label}${priceBits(h.priceUsd, rate)}</p>
          ${extras}
          <ul class="keypts">${h.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
        </div>
      </article>`;
    })
    .join("");

  const lic = plan.hotels.areaWithoutPrice;
  const licCard = `<article class="stay-card card">
    ${planFigure(photoCap, lic.image, lic.creditId, lic.areaLabel)}
    <div class="cb">
      <h3>${esc(lic.name)}</h3>
      <p><span class="lbl c-unv">価格候補なし</span></p>
      <p>${esc(lic.note)}</p>
    </div>
  </article>`;

  const days = plan.days
    .map((d) => {
      const fig = planFigure(photoCap, d.image, d.creditId, d.areaLabel);
      return `<article>
        <time datetime="${esc(d.date)}">${esc(d.date)}（${esc(d.weekdayJa)}）</time>
        <b>${esc(d.title)}</b>
        ${fig}
        <p>${esc(d.body)}</p>
      </article>`;
    })
    .join("");

  return `<section class="panel tentative" id="current-plan" aria-labelledby="current-plan-h">
    <h1 id="current-plan-h">${esc(plan.title)} <span class="lbl c-unv">${esc(plan.statusLabel)}</span></h1>
    <p class="lead">${esc(plan.dateLine)}</p>
    <p>${esc(plan.intro)}</p>
    <p class="amt">未予約 <small>料金は ${esc(plan.checkedDate)}（PT）の目安。航空券と宿泊は別々に書く</small></p>
    <dl class="facts">
      <div><dt>${esc(plan.outbound.label)}</dt><dd>${esc(plan.outbound.text)}</dd></div>
      <div><dt>${esc(plan.returnFlight.label)}</dt><dd>${esc(plan.returnFlight.text)}</dd></div>
      <div><dt>${esc(plan.stay.label)}</dt><dd>${esc(plan.stay.text)}</dd></div>
    </dl>
    <p>${tag("fact")} ${esc(plan.why)}</p>
  </section>

  <section class="panel" id="current-flights" aria-labelledby="current-flights-h">
    <h2 id="current-flights-h">航空券 ${tag("estimate")}</h2>
    <p>${esc(plan.flights.progressNote)}</p>
    <p>直行の参考帯: ${priceBits(flight.low, rate)} 〜 ${priceBits(flight.high, rate)}</p>
    <p>${esc(flight.note)} ${esc(plan.flights.noReturnNonstopRedeye)}</p>
    <p>${tag("fact")} ${esc(plan.flights.noJan3MorningNonstop)}</p>
    <aside class="not-pick">
      <h3>${esc(plan.flights.notCurrent.heading)}</h3>
      <p>${esc(plan.flights.notCurrent.text)}</p>
    </aside>
    <aside class="not-pick">
      <h3>${esc(plan.flights.stopExample.heading)}</h3>
      <p>${esc(plan.flights.stopExample.text)}</p>
    </aside>
    ${cite(plan.flights.sourceUrl, plan.flights.checkedDate, "検索条件付きのURLは残していない。公式サイトの確認は途中。")}
  </section>

  <section class="panel" id="current-hotels" aria-labelledby="current-hotels-h">
    <h2 id="current-hotels-h">宿泊の候補 ${tag("estimate")}</h2>
    <p>${esc(plan.hotels.terms)} ${esc(plan.hotels.preferFreeCancel)}</p>
    <ul class="alerts static" role="status">
      <li><b>朝着</b> <span>${esc(plan.hotels.checkInNote)}</span></li>
    </ul>
    <p>${esc(plan.hotels.resortFee.note)} 5泊で掛けると ${usdText(Math.round(plan.hotels.resortFee.usdPerNight * plan.nights * 100) / 100)}（${esc(jpyText(Math.round(plan.hotels.resortFee.usdPerNight * plan.nights * 100) / 100, rate))}）。かかる場合の計算で、見積額ではない。</p>
    <p>${esc(plan.hotels.timesSquareNote)}</p>
    <p>5件の見出し金額は ${usdText(hotelMin)}〜${usdText(hotelMax)}。航空券の参考帯と足すと ${usdText(sumLo)}〜${usdText(sumHi)}（${esc(jpyText(sumLo, rate))}〜${esc(jpyText(sumHi, rate))}）。ダブルルーム、返金可の上位プラン、リゾートフィーは含まない。足し算の目安であり、予約額ではない。</p>
    <p>換算: ${esc(plan.exchange.label)}（${esc(plan.exchange.asOf)}）。${esc(plan.exchange.sourceNote)}</p>
    <div class="cards pick-cards">${hotelCards}${licCard}</div>
    <p class="note">宿泊ページにある Pod の金額は、2026-11-07 の Google Hotels（6泊・12/28→1/3 など）の目安です。上の5泊とは別です。</p>
    ${cite(plan.hotels.sourceUrl, plan.hotels.checkedDate, "税込・後払い。各ホテル公式では未再確認。検索条件付きのURLは残していない。")}
  </section>

  <section class="panel" id="current-days" aria-labelledby="current-days-h">
    <h2 id="current-days-h">日付の並び ${tag("proposal")}</h2>
    <p class="lead">移動と宿泊の枠だけです。日中の観光は決めていません。</p>
    <div class="dayline">${days}</div>
  </section>`;
}
