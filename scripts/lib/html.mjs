export function esc(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function tag(type) {
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

export function cite(url, checked, extra = "") {
  if (!url) return "";
  return `<span class="cite">出典: <a href="${esc(url)}" rel="noopener noreferrer">${esc(url)}</a>　確認: ${esc(checked)}${extra ? ` — ${esc(extra)}` : ""}</span>`;
}

export function slugifyLodging(l, used = new Set()) {
  let base = l.name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  if (!base) base = l.id;
  let slug = base;
  let i = 2;
  while (used.has(slug)) {
    slug = `${base}-${i++}`;
  }
  used.add(slug);
  return slug;
}
