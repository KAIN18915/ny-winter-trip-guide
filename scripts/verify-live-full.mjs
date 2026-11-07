#!/usr/bin/env node
const BASE = "https://www.kainel18915.f5.si/ny-winter-trip-guide/";

const seedPages = [
  "",
  "guide/midtown/",
  "stays/hi-new-york-city-hostel/",
  "planner/",
  "stays/",
  "guide/",
];

async function fetchText(url) {
  const r = await fetch(url);
  return { status: r.status, html: await r.text() };
}

async function main() {
  const toVisit = new Set(seedPages);
  const visited = new Set();
  const badPages = [];
  const badImgs = [];
  const imgChecked = new Set();

  while (toVisit.size) {
    const p = [...toVisit][0];
    toVisit.delete(p);
    if (visited.has(p)) continue;
    visited.add(p);
    const url = BASE + p;
    const { status, html } = await fetchText(url);
    if (status !== 200) badPages.push({ path: p, status });
    for (const m of html.matchAll(/<img[^>]+src="([^"]+)"/g)) {
      const src = m[1];
      if (src.startsWith("data:")) continue;
      const abs = new URL(src, url).href;
      if (imgChecked.has(abs)) continue;
      imgChecked.add(abs);
      const ir = await fetch(abs, { method: "HEAD" });
      if (ir.status !== 200) badImgs.push({ src: abs, status: ir.status, from: p });
    }
    for (const m of html.matchAll(/href="(\.\.?\/[^"#?]+|[^.#?][^:]*\/index\.html)"/g)) {
      const href = m[1];
      if (href.startsWith("http")) continue;
      const rel = new URL(href, url).pathname.replace(/^\/ny-winter-trip-guide\//, "");
      if (rel && !visited.has(rel)) toVisit.add(rel);
    }
  }

  const planner = await fetchText(BASE + "planner/");
  const plannerOk =
    planner.status === 200 &&
    planner.html.includes("planner-app") &&
    planner.html.includes("planner.js");

  console.log(
    JSON.stringify(
      {
        pagesVisited: visited.size,
        badPages,
        imgsChecked: imgChecked.size,
        badImgs: badImgs.slice(0, 20),
        badImgCount: badImgs.length,
        plannerOk,
        ok: badPages.length === 0 && badImgs.length === 0 && plannerOk,
      },
      null,
      2
    )
  );
  process.exit(badPages.length + badImgs.length > 0 || !plannerOk ? 1 : 0);
}

main();
