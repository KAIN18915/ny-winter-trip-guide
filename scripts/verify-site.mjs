#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function listHtml(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) listHtml(p, acc);
    else if (ent.name === "index.html") acc.push(p);
    else if (ent.name.endsWith(".html")) acc.push(p);
  }
  return acc;
}

const htmlFiles = listHtml(ROOT).filter((p) => !p.includes("/scripts/") && !p.includes("node_modules"));

const imgFailures = [];
const linkFailures = [];
const pages = [];

for (const file of htmlFiles) {
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  pages.push(rel);
  const html = fs.readFileSync(file, "utf8");
  for (const m of html.matchAll(/<img[^>]+src="([^"]+)"/g)) {
    const src = m[1];
    if (src.startsWith("http")) continue;
    const target = path.normalize(path.join(path.dirname(file), src));
    if (!fs.existsSync(target)) imgFailures.push({ page: rel, src });
  }
  for (const m of html.matchAll(/<a[^>]+href="([^"#?]+)"/g)) {
    const href = m[1];
    if (href.startsWith("http") || href.startsWith("mailto:") || href.endsWith(".md")) continue;
    let target;
    if (href.endsWith("/")) target = path.join(path.dirname(file), href, "index.html");
    else target = path.join(path.dirname(file), href);
    target = path.normalize(target);
    if (!fs.existsSync(target) && !href.includes("://")) {
      if (!href.endsWith("/") && !fs.existsSync(target) && !fs.existsSync(target + "/index.html")) {
        linkFailures.push({ page: rel, href });
      }
    }
  }
}

console.log(JSON.stringify({ pageCount: pages.length, imgFailures: imgFailures.length, linkFailures: linkFailures.length, sampleLinkFails: linkFailures.slice(0, 15) }, null, 2));
process.exit(imgFailures.length + linkFailures.length > 0 ? 1 : 0);
