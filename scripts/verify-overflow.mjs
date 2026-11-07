#!/usr/bin/env node
const BASE = process.env.BASE || process.argv[2] || "https://www.kainel18915.f5.si/ny-winter-trip-guide/";

const paths = ["", "guide/", "stays/", "stays/hi-new-york-city-hostel/", "planner/", "compare/"];
const WIDTH = 390;

async function main() {
  const puppeteer = await import("puppeteer-core");
  const browser = await puppeteer.default.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || "/usr/local/bin/google-chrome",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const results = [];
  try {
    for (const p of paths) {
      const page = await browser.newPage();
      await page.setViewport({ width: WIDTH, height: 844 });
      const url = new URL(p || ".", BASE).href;
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await new Promise((r) => setTimeout(r, 400));
      const row = await page.evaluate((pathLabel) => {
        const w = document.documentElement.scrollWidth;
        return {
          scrollWidth: w,
          clientWidth: document.documentElement.clientWidth,
          ok: w <= 390,
          path: pathLabel,
        };
      }, p || "/");
      results.push(row);
      await page.close();
    }
  } finally {
    await browser.close();
  }
  const bad = results.filter((r) => !r.ok);
  console.log(JSON.stringify({ width: WIDTH, results, bad, ok: bad.length === 0 }, null, 2));
  process.exit(bad.length ? 1 : 0);
}

main();
