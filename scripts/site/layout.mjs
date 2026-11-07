import { esc } from "../lib/html.mjs";

const NAV_ITEMS = [
  { key: "home", href: "", label: "ホーム" },
  { key: "planner", href: "planner/", label: "プランナー" },
  { key: "compare", href: "compare/", label: "比較" },
  { key: "stays", href: "stays/", label: "宿泊" },
  { key: "guide", href: "guide/", label: "ガイド" },
  { key: "map", href: "map/", label: "地図" },
];

export function relPrefix(depth) {
  return depth <= 0 ? "" : "../".repeat(depth);
}

export function createLayout(meta, depth = 0) {
  const pre = relPrefix(depth);

  function botnav(current) {
    return `<div class="dock" id="dock"><nav class="botnav" aria-label="主要ナビ">
${NAV_ITEMS.map((n) => {
  const href = pre + n.href;
  const cur = n.key === current ? ' aria-current="page"' : "";
  return `<a href="${href}"${cur}><span>${esc(n.label)}</span></a>`;
}).join("\n")}
</nav></div>`;
  }

  function sitebar(current) {
    return `<header class="sitebar"><div class="in">
<a class="brand" href="${pre}">${esc(meta.siteTitleShort || "NY冬旅2026")}</a>
<nav class="topnav" aria-label="サブ">
<a href="${pre}fares/"${current === "fares" ? ' aria-current="page"' : ""}>運賃</a>
<a href="${pre}practical/"${current === "practical" ? ' aria-current="page"' : ""}>実務</a>
<a href="${pre}credits/"${current === "credits" ? ' aria-current="page"' : ""}>写真出典</a>
</nav>
</div></header>`;
  }

  return function pageLayout({
    title,
    nav = "home",
    body,
    extraHead = "",
    scripts = [],
    wide = false,
  }) {
    const scriptTags = scripts
      .map((s) => {
        const src = s.startsWith("http") ? s : pre + s;
        const attr = s.startsWith("http") ? " defer crossorigin" : " defer";
        return `<script src="${esc(src)}"${attr}></script>`;
      })
      .join("\n");

    return `<!DOCTYPE html>
<html lang="ja" data-root="${esc(pre)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)} | ${esc(meta.siteTitle)}</title>
  <meta name="description" content="${esc(meta.disclaimer.slice(0, 140))}">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <meta name="theme-color" content="#16304f">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=BIZ+UDPGothic:wght@400;700&family=Noto+Sans+JP:wght@400;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${pre}assets/app.css">
  <link rel="stylesheet" href="${pre}assets/css/style.css">
  ${extraHead}
</head>
<body class="app p-${esc(nav)}">
${sitebar(nav)}
<main id="main-c" tabindex="-1" class="wrap${wide ? " wrap--wide" : ""}">
${body}
</main>
${botnav(nav)}
<footer class="wrap site-footer note">
  <p>${esc(meta.disclaimer)}</p>
  <p>データ確認: ${esc(meta.researchCheckedDatePST)}（PST）／運賃: ${esc(meta.faresCheckedAtPST)}（PST）</p>
</footer>
${scriptTags}
</body>
</html>`;
  };
}

export function redirectStub(target) {
  const t = esc(target);
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=${t}">
  <link rel="canonical" href="${t}">
  <title>リダイレクト</title>
</head>
<body><p>移動しました: <a href="${t}">${t}</a></p></body>
</html>`;
}
