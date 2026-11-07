#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createLayout, redirectStub } from "./site/layout.mjs";
import { slugifyLodging } from "./lib/html.mjs";
import { runSiteBuild } from "./build-pages.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DATA = path.join(ROOT, "data");

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(DATA, name), "utf8"));
}

function writePage(rel, html) {
  const full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, html, "utf8");
  console.log("Wrote", rel);
}

const meta = readJson("meta.json");
const lodging = readJson("lodging.json");
const guideAreas = readJson("guide-areas.json");

const used = new Set();
const lodgingSlugs = new Map();
for (const l of lodging) {
  lodgingSlugs.set(l.id, slugifyLodging(l, used));
}

const layouts = [0, 1, 2, 3].map((d) => createLayout(meta, d));

const redirects = {
  "planner.html": "planner/",
  "plan-a.html": "plan/a/",
  "plan-b.html": "plan/b/",
  "plan-c.html": "plan/c/",
  "stays.html": "stays/",
  "options.html": "guide/more/",
  "map.html": "map/",
  "fares.html": "fares/",
  "practical.html": "practical/",
  "credits.html": "credits/",
  "nye.html": "guide/nye/",
};

export function buildSite() {
  const { pages } = runSiteBuild({
    layouts,
    write: writePage,
    lodgingSlugs,
    guideAreas,
  });

  for (const [from, to] of Object.entries(redirects)) {
    writePage(from, redirectStub(to));
  }

  return { pages: [...pages, ...Object.keys(redirects)], lodgingSlugs };
}

