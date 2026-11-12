const FX = 159.51378;

function group(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function usdText(n) {
  if (n == null || n === "") return "価格の記載なし";
  const v = Number(n);
  if (!Number.isFinite(v)) return "価格の記載なし";
  const digits = Math.abs(v - Math.round(v)) < 1e-9 ? 0 : 2;
  const [whole, frac] = v.toFixed(digits).split(".");
  return frac ? `$${group(whole)}.${frac}` : `$${group(whole)}`;
}

function jpyText(n) {
  if (n == null || n === "") return "";
  const yen = Math.round(Number(n) * FX);
  if (!Number.isFinite(yen)) return "";
  return `約${group(yen)}円`;
}

function fmtMin(n) {
  if (n == null || n === "") return "—";
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  if (Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
  return String(v);
}

function typeLabel(type) {
  if (type === "hotel") return "ホテル";
  if (type === "airbnb") return "Airbnb";
  return type || "";
}

function headline(item) {
  const mins = fmtMin(item.best_minutes);
  if (item.recommended_mode === "walk") return `徒歩 ${mins}分`;
  if (item.recommended_mode === "transit") return `公共交通 ${mins}分`;
  return `${item.recommended_mode || "最短"} ${mins}分`;
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

function transitSummary(item) {
  const transit = item.transit;
  if (transit && transit.legs_summary_ja) return transit.legs_summary_ja;
  if (item.legs_summary_ja) return item.legs_summary_ja;
  return "";
}

export function stayMapNotes() {
  return `<ul class="alerts static" role="status">
  <li><b>未予約・目安</b> <span>2026-12-28 チェックイン、2027-01-02 チェックアウト。5泊、大人1名。予約していない。</span></li>
</ul>
<ul class="compact stay-notes">
  <li>所要時間は 2026-12-29（火）19:00（America/New_York）の時刻表による目安。Transitous（MTA 地下鉄・バス、LIRR、NJ Transit）。ライブではなく、保証でもない。</li>
  <li>合計は、出発にちょうど間に合う場合のドアツードア。19:00 より後の初便待ち（wait_after_19_00_minutes）は合計に入っていない。乗換の待ちは入っている。</li>
  <li>12/31 のタイムズスクエアは、通常、一般の出入りが制限される。この時間は大晦日ではない。</li>
  <li>Times Sq-42 St 駅からの最後の徒歩（およそ 4–7 分）は公共交通の合計に入っている。目的地はタイムズスクエアの 7 番街（42 丁目より西 45–46 丁目寄り）。</li>
  <li>料金は 2026-11-11 夜（PT）に確認。検索時の端末はオフラインで、料金は別のネットワークで読んだ。Expedia の合計は税・手数料込み。Airbnb の表示価格は、税込みか書いていないことが多い。</li>
  <li>円は 1 USD = 159.51378 JPY（open.er-api.com、2026-11-12 00:02 UTC）の目安。</li>
  <li>住所が公開されていない Vrbo 2件は載せていない。Airbnb で「約 150m」と出るピンは、公開座標がぼかされている。</li>
</ul>`;
}

export function stayMapList(listings, esc) {
  return listings
    .map((item, index) => {
      const summary = transitSummary(item);
      const transitLine = item.transit
        ? `公共交通: ${fmtMin(item.transit.total_minutes)}分`
        : "公共交通: データに無い";
      const alt = (item.transit_alternatives || [])[0];
      const altLine = alt
        ? `別ルート: ${fmtMin(alt.total_minutes)}分${alt.legs_summary_ja ? ` — ${alt.legs_summary_ja}` : ""}`
        : "";
      const yen = jpyText(item.total_5_nights_usd);
      const priceAttr = item.total_5_nights_usd == null ? "" : String(item.total_5_nights_usd);
      return `<li data-stay-index="${index}" data-type="${esc(item.type)}" data-minutes="${esc(item.best_minutes)}" data-price="${esc(priceAttr)}">
        <button type="button">
          <b>${esc(item.name)}</b>
          <span>${esc(typeLabel(item.type))} · ${esc(item.area || "")}</span>
          <span>${esc(headline(item))} · ${esc(usdText(item.total_5_nights_usd))}${yen ? ` · ${esc(yen)}` : ""} <span class="tag tag--estimate">目安</span></span>
        </button>
        <p class="stay-static">${esc(`徒歩: ${fmtMin(item.walk_minutes)}分。${transitLine}`)}${summary ? `。${esc(summary)}` : ""}${altLine ? `。${esc(altLine)}` : ""}。${esc(taxLabel(item))}。${esc(refundLabel(item.refundable))}。${item.coords_approximate ? "地図の位置は約 150m の概算（Airbnb）。" : ""}<a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer">掲載ページ</a></p>
      </li>`;
    })
    .join("");
}

export const stayMapFx = FX;
