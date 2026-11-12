#!/usr/bin/env node
const BASE = "https://www.kainel18915.f5.si/ny-winter-trip-guide/";

const paths = [
  "",
  "planner/",
  "compare/",
  "stays/",
  "stays/hi-new-york-city-hostel/",
  "guide/",
  "guide/midtown/",
  "guide/more/",
  "guide/nye/",
  "map/",
  "data/map_stays.json",
  "fares/",
  "practical/",
  "credits/",
  "plan/a/",
  "plan/b/",
  "plan/c/",
  "planner.html",
  "stays.html",
  "options.html",
];

async function status(url) {
  const r = await fetch(url, { redirect: "follow" });
  return r.status;
}

async function main() {
  const pageResults = [];
  for (const p of paths) {
    const url = BASE + p;
    pageResults.push({ path: p || "/", status: await status(url) });
  }

  const home = await fetch(BASE);
  const html = await home.text();
  const markers = ["未予約・暫定", "2026-12-27", "2027-01-02", "Pod 39", "現行の候補ではない"];
  const missingMarkers = markers.filter((m) => !html.includes(m));
  const forbidden = ["Alameda", "アラメダ"].filter((m) => html.includes(m));
  const planC = await fetch(BASE + "plan/c/");
  const planCHtml = await planC.text();
  const planCForbidden = ["Alameda", "アラメダ"].filter((m) => planCHtml.includes(m));
  const imgs = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1]);
  const imgResults = [];
  for (const src of imgs) {
    if (src.startsWith("http")) continue;
    const url = new URL(src, BASE).href;
    imgResults.push({ src, status: await status(url) });
  }

  const badPages = pageResults.filter((x) => x.status !== 200);
  const badImgs = imgResults.filter((x) => x.status !== 200);

  console.log(
    JSON.stringify(
      {
        base: BASE,
        pagesChecked: pageResults.length,
        badPages,
        homeImgsChecked: imgResults.length,
        badHomeImgs: badImgs,
        missingMarkers,
        forbidden,
        planCStatus: planC.status,
        planCForbidden,
        ok:
          badPages.length === 0 &&
          badImgs.length === 0 &&
          missingMarkers.length === 0 &&
          forbidden.length === 0 &&
          planC.status === 200 &&
          planCForbidden.length === 0,
      },
      null,
      2
    )
  );

  process.exit(
    badPages.length + badImgs.length + missingMarkers.length + forbidden.length + planCForbidden.length > 0 ||
      planC.status !== 200
      ? 1
      : 0
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
