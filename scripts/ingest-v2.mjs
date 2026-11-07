#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "data");
const UP = path.join(ROOT, "uploads_extracted");

function parseCalendarMd(text, routeId, label, sampleUrlLine) {
  const lines = text.split("\n");
  const section = lines.find((l) => l.startsWith("## ") && l.includes(sampleUrlLine));
  if (!section) return { routeId, label, checkedAt: "2026-11-07", prices: {}, sampleNote: null, searchUrl: null };
  const prices = {};
  const dayPart = section.replace(/^##\s+[^:]+:\s*/, "");
  for (const part of dayPart.split(",")) {
    const m = part.trim().match(/(\d{1,2})\/(\d{1,2})\s+\$(\d+)/);
    if (m) {
      const y = parseInt(m[2], 10) >= 7 ? 2026 : 2027;
      const key = `${y}-${String(parseInt(m[1], 10)).padStart(2, "0")}-${String(parseInt(m[2], 10)).padStart(2, "0")}`;
      prices[key] = parseInt(m[3], 10);
    }
  }
  const urlLine = lines.find((l, i) => lines[i - 1]?.startsWith("## ") && l.startsWith("URL "));
  const sampleLine = lines.find((l) => l.includes("実便"));
  return {
    routeId,
    label,
    checkedAt: "2026-11-07",
    disclaimer: "日付別最安目安（Google Flights, 2026-11-07確認）",
    prices,
    sampleItinerary: sampleLine || null,
    searchUrl: urlLine?.replace(/^URL\s+/, "") || null,
  };
}

function parseFareCalendars() {
  const main = fs.readFileSync(path.join(UP, "fare_calendar.md"), "utf8");
  const bay = fs.readFileSync(path.join(UP, "fare_calendar_bay.md"), "utf8");
  const routes = [
    parseCalendarMd(main, "sea-nyc", "SEA→NYC", "SEA→NYC"),
    parseCalendarMd(main, "nyc-sea", "NYC→SEA", "NYC→SEA"),
    parseCalendarMd(main, "sea-lax", "SEA→LAX", "SEA→LAX"),
    parseCalendarMd(main, "lax-nyc", "LAX→NYC", "LAX→NYC"),
    parseCalendarMd(bay, "sea-oak", "SEA→OAK", "SEA→OAK"),
    parseCalendarMd(bay, "sea-sfo", "SEA→SFO", "SEA→SFO"),
    parseCalendarMd(bay, "oak-nyc", "OAK→NYC", "OAK→NYC"),
    parseCalendarMd(bay, "sfo-nyc", "SFO→NYC", "SFO→NYC"),
  ];
  const note =
    "片道2本の組み合わせが往復 $558 より安い可能性あり（2026-11-07確認のカレンダー目安）。";
  fs.writeFileSync(
    path.join(DATA, "fare-calendars.json"),
    JSON.stringify({ checkedAt: "2026-11-07", note, routes }, null, 2)
  );
}

function parseHotelBlock(text, sectionTitle) {
  const re = new RegExp(`## ${sectionTitle}[^\\n]*\\n([^#]+)`, "s");
  const m = text.match(re);
  if (!m) return { searchUrl: null, stays: [] };
  const block = m[1];
  const urlMatch = block.match(/検索URL:\s*(https:\/\/\S+)/);
  const line = block.split("\n").find((l) => l.includes("★") || l.includes("$"));
  if (!line) return { searchUrl: urlMatch?.[1] || null, stays: [] };
  const stays = [];
  for (const part of line.split("|")) {
    const p = part.trim();
    const tm = p.match(/^(.+?)\s+\$(\d+)\/泊\s+計\$(\d+)/);
    const tm2 = p.match(/^(.+?)\s+計\$(\d+)/);
    const rm = p.match(/★([\d.]+)\(([\d.K]+)\)/);
    if (tm) {
      stays.push({
        name: tm[1].trim(),
        perNightUsd: parseInt(tm[2], 10),
        totalUsd: parseInt(tm[3], 10),
        rating: rm ? rm[1] : null,
        reviews: rm ? rm[2] : null,
      });
    } else if (tm2) {
      stays.push({
        name: tm2[1].trim(),
        perNightUsd: null,
        totalUsd: parseInt(tm2[2], 10),
        rating: rm ? rm[1] : null,
        reviews: rm ? rm[2] : null,
      });
    }
  }
  return { searchUrl: urlMatch?.[1] || null, stays };
}

function parseHotels() {
  const text = fs.readFileSync(path.join(UP, "hotel_prices.md"), "utf8");
  const checkedAt = "2026-11-07";
  const out = {
    checkedAt,
    disclaimer: "Google Hotels 表示（税・手数料込み目安）。部屋タイプ・空室は未確認。変動します。",
    nyc6n: parseHotelBlock(text, "A\\. NYC"),
    nycNye: parseHotelBlock(text, "B\\. NYC"),
    la4n: parseHotelBlock(text, "C\\. LA"),
  };
  fs.writeFileSync(path.join(DATA, "hotel-google-prices.json"), JSON.stringify(out, null, 2));
}

function enrichLodging() {
  const lodging = JSON.parse(fs.readFileSync(path.join(DATA, "lodging.json"), "utf8"));
  const hotels = JSON.parse(fs.readFileSync(path.join(DATA, "hotel-google-prices.json"), "utf8"));

  function norm(s) {
    return s.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  function matchPrice(name, list) {
    const n = norm(name);
    let best = null;
    for (const h of list.stays) {
      if (norm(h.name) === n || norm(h.name).includes(n) || n.includes(norm(h.name))) {
        best = h;
      }
    }
    return best;
  }

  for (const l of lodging) {
    l.commons_image = null;
    if (l.city === "NYC") {
      const m6 = matchPrice(l.name, hotels.nyc6n);
      const mNye = matchPrice(l.name, hotels.nycNye);
      if (m6) {
        l.google_hotels_6n_total_usd = m6.totalUsd;
        l.google_hotels_6n_per_night_usd = m6.perNightUsd;
        l.google_hotels_6n_note = "目安・Google Hotels 2026-11-07";
      }
      if (mNye) {
        l.google_hotels_nye_total_usd = mNye.totalUsd;
        l.google_hotels_nye_note = "目安・Google Hotels 2026-11-07";
      }
    }
    if (l.city === "LA") {
      const m4 = matchPrice(l.name, hotels.la4n);
      if (m4) {
        l.google_hotels_la4n_total_usd = m4.totalUsd;
        l.google_hotels_la4n_note = "目安・Google Hotels 2026-11-07";
      }
    }
    if (l.image && l.image.startsWith("img/")) {
      l.commons_image = `assets/${l.image.replace(/^img\//, "img/")}`;
    }
  }

  const credits = JSON.parse(fs.readFileSync(path.join(DATA, "commons_credits.json"), "utf8"));
  const bySubject = Object.fromEntries(credits.map((c) => [c.subject.toLowerCase(), c]));

  for (const l of lodging) {
    if (!l.commons_image && l.area) {
      const areaKey = l.area.split(",")[0].toLowerCase();
      for (const [sub, cred] of Object.entries(bySubject)) {
        if (areaKey.includes(sub) || sub.includes("brooklyn") && areaKey.includes("brooklyn")) {
          l.commons_image = `assets/${cred.path}`;
          l.commons_credit_id = cred.id;
          break;
        }
      }
    }
    if (!l.commons_image) {
      const nycDefault = credits.find((c) => c.subject === "Manhattan");
      if (l.city === "NYC" && nycDefault) {
        l.commons_image = `assets/${nycDefault.path}`;
        l.commons_credit_id = nycDefault.id;
      }
      const laDefault = credits.find((c) => c.subject.includes("Santa Monica"));
      if (l.city === "LA" && laDefault) {
        l.commons_image = `assets/${laDefault.path}`;
        l.commons_credit_id = laDefault.id;
      }
    }
  }

  fs.writeFileSync(path.join(DATA, "lodging.json"), JSON.stringify(lodging, null, 2));
}

function attachOptionImages() {
  const options = JSON.parse(fs.readFileSync(path.join(DATA, "options.json"), "utf8"));
  const credits = JSON.parse(fs.readFileSync(path.join(DATA, "commons_credits.json"), "utf8"));
  const byFile = Object.fromEntries(credits.map((c) => [c.path.replace("img/", ""), c]));

  for (const o of options) {
    if (o.image && o.image.startsWith("img/")) {
      const file = o.image.replace("img/", "");
      o.image_asset = `assets/img/${file}`;
      const cred = byFile[file] || credits.find((c) => c.path === o.image);
      if (cred) {
        o.commons_credit_id = cred.id;
        o.photo_caption = cred.caption_note;
      }
    }
  }
  fs.writeFileSync(path.join(DATA, "options.json"), JSON.stringify(options, null, 2));
}

parseFareCalendars();
parseHotels();
enrichLodging();
attachOptionImages();

const meta = JSON.parse(fs.readFileSync(path.join(DATA, "meta.json"), "utf8"));
meta.researchCheckedDatePST = "2026-11-07";
meta.faresCheckedAtPST = "2026-11-07";
meta.v2 = true;
fs.writeFileSync(path.join(DATA, "meta.json"), JSON.stringify(meta, null, 2));

console.log("ingest-v2 complete");
