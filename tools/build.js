/* =====================================================================
   Build step for GitHub Pages (run by .github/workflows/publish.yml on every push, including
   every Save in /admin). Copies the site into _site/ and creates a real page at each clean address
   from js/urls.js, so links like these open directly and can be shared:

     /portfolio/  /team/ …                       homepage, landing on that section
     /category/realistic-character/              one category
     /portfolio/realistic-character/lehri/       one artwork, with its own title + preview image
     /breakdowns/  /breakdowns/orc-fanart/       breakdowns

   Run locally:  node tools/build.js   (then serve the _site folder)
   ===================================================================== */
"use strict";
const fs = require("fs");
const path = require("path");
const URLS = require("../js/urls.js");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "_site");
const SITE = "https://brothersinteractive.in";
// Never published: tooling, local notes, and the build output itself
const SKIP = new Set([".git", ".github", "_site", "tools", "node_modules", "HANDOFF.md", "DEPLOY.md", ".gitignore"]);

const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const json = (f, fallback) => { try { return JSON.parse(read(f)); } catch (e) { return fallback; } };
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const abs = (u) => !u ? SITE + "/assets/img/brand/og-image.jpg" : /^https?:\/\//.test(u) ? u : SITE + (u.charAt(0) === "/" ? u : "/" + u.replace(/^(\.\.\/)+/, ""));
const short = (s, n) => { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s; };

// ---- 1. copy the site --------------------------------------------------------------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const name of fs.readdirSync(ROOT)) {
  if (SKIP.has(name)) continue;
  fs.cpSync(path.join(ROOT, name), path.join(OUT, name), { recursive: true });
}

// ---- 1b. grid thumbnails -----------------------------------------------------------------
// Grids show WebP copies 960px wide (assets/img/thumbs/<folder>/<name>.webp, see imgAttrs() in
// js/script.js): sharp in the 3-column grid even on screens scaled up to ~167%. Images uploaded through
// /admin have none, and the older copies in the repo are only 640px, so make or remake them here; the
// originals (used by the viewer and the lens) are never touched. Needs the "sharp" package (installed by
// the GitHub workflow); without it the build still works and grids use the copies already in the repo.
const THUMB_W = 960;
async function makeThumbs() {
  let sharp;
  try { sharp = require("sharp"); } catch (e) { console.log("Thumbnails: sharp not installed, skipped (grids use the copies in the repo, or the full image for new uploads)."); return; }
  sharp.cache(false);   // sharp keeps files open in its cache, which on Windows blocks overwriting them
  let made = 0, remade = 0;
  for (const folder of ["portfolio", "games", "categories"]) {
    const src = path.join(OUT, "assets/img", folder), dst = path.join(OUT, "assets/img/thumbs", folder);
    if (!fs.existsSync(src)) continue;
    fs.mkdirSync(dst, { recursive: true });
    for (const f of fs.readdirSync(src)) {
      if (!/\.(webp|jpe?g|png)$/i.test(f)) continue;
      const from = path.join(src, f), out = path.join(dst, f.replace(/\.(webp|jpe?g|png)$/i, ".webp"));
      try {
        const exists = fs.existsSync(out), source = fs.readFileSync(from);   // read into memory: no open file handles
        if (exists) {
          // keep a copy that is already as wide as it can usefully be (960px, or the whole original)
          const [have, orig] = await Promise.all([sharp(fs.readFileSync(out)).metadata(), sharp(source).metadata()]);
          if (have.width >= Math.min(THUMB_W, orig.width)) continue;
        }
        const buf = await sharp(source).resize({ width: THUMB_W, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
        fs.writeFileSync(out, buf);
        exists ? remade++ : made++;
      } catch (e) { console.log("Thumbnail failed for " + folder + "/" + f + ": " + e.message); }
    }
  }
  console.log("Thumbnails (" + THUMB_W + "px): made " + made + " new, remade " + remade + " narrower ones.");
}

// ---- 2. page writer ------------------------------------------------------------------
const TEMPLATES = { home: read("index.html"), category: read("category.html"), asset: read("asset.html"), breakdown: read("breakdown.html") };
const written = [];

/* Copies a template to <address>/index.html with: what this page shows (window.__BI_PAGE, read by
   js/script.js) and, when given, its own title / description / preview image / canonical address. */
function writePage(address, tpl, info, meta) {
  let html = TEMPLATES[tpl];
  const nl = html.includes("\r\n") ? "\r\n" : "\n";
  if (meta) {
    html = html
      .replace(/<title>[^<]*<\/title>/, "<title>" + esc(meta.title) + "</title>")
      .replace(/^[ \t]*<meta (name="description"|property="og:(title|description|image|url)"|name="twitter:card")[^>]*>\r?\n/gm, "")
      .replace(/^[ \t]*<link rel="canonical"[^>]*>\r?\n/gm, "");
    const tags = [
      '<meta name="description" content="' + esc(meta.description) + '" />',
      '<meta property="og:title" content="' + esc(meta.title) + '" />',
      '<meta property="og:description" content="' + esc(meta.description) + '" />',
      '<meta property="og:image" content="' + esc(abs(meta.image)) + '" />',
      '<meta property="og:url" content="' + SITE + address + '" />',
      '<meta name="twitter:card" content="summary_large_image" />',
      '<link rel="canonical" href="' + SITE + address + '" />'
    ];
    html = html.replace(/(<\/title>)/, "$1" + nl + "  " + tags.join(nl + "  "));
  }
  html = html.replace(/(<base href="\/" \/>)/, "$1" + nl + "  <script>window.__BI_PAGE = " + JSON.stringify(info) + ";</script>");
  const dir = path.join(OUT, address);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
  written.push({ address, sitemap: !!meta });
}

// ---- 3. homepage sections: /portfolio/, /team/ … ------------------------------------
for (const id of URLS.SECTIONS) if (id !== "home") writePage("/" + id + "/", "home", { section: id });

// ---- 4. categories: /category/<slug>/ ---------------------------------------------
// Categories as edited in /admin (data/categories.json) replace the built-in list
URLS.setCategories(json("data/categories.json", {}).items);
const PROJECTS = (json("data/portfolio.json", {}).items || []).filter((p) => p && p.id && !p.hidden); // "Hide from the website" in /admin
const inCat = (p, key) => p.c === key || (Array.isArray(p.cats) && p.cats.indexOf(key) !== -1);
for (const b of URLS.BROWSE_CATS) {
  const pieces = PROJECTS.filter((p) => b.match.some((k) => inCat(p, k)));
  writePage(URLS.categoryPath(b.slug), "category", { cat: b.slug }, {
    title: b.label + " | Brothers Interactive",
    description: b.label + " from the Brothers Interactive portfolio: game-ready 3D work by a studio specialized in characters for games.",
    image: pieces[0] && pieces[0].i
  });
  // /portfolio/<slug>/ (someone trimming an artwork link) leads to the same category
  writePage("/portfolio/" + b.slug + "/", "category", { cat: b.slug });
}

// ---- 5. artworks: /portfolio/<category>/<name>/ -------------------------------------
const CAT_LABEL = {};
URLS.BROWSE_CATS.forEach((b) => b.match.forEach((k) => { CAT_LABEL[k] = b.label; }));
const PIECE_PATH = URLS.piecePaths(PROJECTS);
for (const p of PROJECTS) {
  writePage(PIECE_PATH[p.id], "asset", { asset: p.id }, {
    title: p.t + " | Brothers Interactive",
    description: short(p.desc, 180) || (p.t + " (" + (CAT_LABEL[p.c] || "3D artwork") + ") by Brothers Interactive, 3D characters for games."),
    image: p.i
  });
}

// ---- 6. breakdowns: /breakdowns/ and /breakdowns/<id>/ -----------------------------
const BREAKDOWNS = (json("data/breakdowns.json", {}).items || []).filter((b) => b && b.t && b.id);
writePage(URLS.breakdownPath(), "breakdown", {}, {
  title: "Production Breakdowns | Brothers Interactive",
  description: "Sculpt to final, in detail: production breakdowns of game characters from Brothers Interactive.",
  image: BREAKDOWNS[0] && (BREAKDOWNS[0].cover || BREAKDOWNS[0].after)
});
for (const b of BREAKDOWNS) {
  writePage(URLS.breakdownPath(b.id), "breakdown", { bd: b.id }, {
    title: b.t + " Breakdown | Brothers Interactive",
    description: short(b.sub || b.desc, 180) || (b.t + " production breakdown by Brothers Interactive."),
    image: b.cover || b.after || (b.gallery && b.gallery[0])
  });
}

// ---- 6b. admin dropdowns ------------------------------------------------------------------
/* The Portfolio form's Category, "Also show in" and Project dropdowns are filled from the Categories and
   Projects lists (and the Games list) every build, so something added there appears in the form about two
   minutes after saving. In admin/config.yml the option lines sit between "# @categories" / "# @projects"
   and "# @end" marker comments; only the published copy in _site is rewritten. */
(function fillAdminDropdowns() {
  const cfgPath = path.join(OUT, "admin/config.yml");
  if (!fs.existsSync(cfgPath)) return;
  const q = (v) => JSON.stringify(String(v));
  const catLines = URLS.BROWSE_CATS.map((b) => "{ label: " + q(b.label) + ", value: " + q(b.match[0]) + " }");
  const projectNames = [];
  (json("data/projects.json", {}).items || []).concat((json("data/games.json", {}).items || []).map((g) => ({ name: g && g.t })))
    .forEach((p) => { const n = p && String(p.name || "").trim(); if (n && projectNames.indexOf(n) === -1) projectNames.push(n); });
  const projLines = projectNames.map(q);
  // Rebuild the option lines between each "# @categories" / "# @projects" marker and its "# @end"
  const src = fs.readFileSync(cfgPath, "utf8").split(/\r?\n/), out = [];
  let n = 0;
  for (let i = 0; i < src.length; i++) {
    const m = src[i].match(/^(\s*)# @(categories|projects)\b/);
    if (!m) { out.push(src[i]); continue; }
    const indent = m[1], kind = m[2];
    let j = i + 1;
    while (j < src.length && !/^\s*# @end\b/.test(src[j])) j++;
    out.push(indent + "# @" + kind + " (filled in by tools/build.js)");
    (kind === "categories" ? catLines : projLines).forEach((l) => out.push(indent + "- " + l));
    out.push(indent + "# @end");
    i = j; n++;
  }
  const cfg = out.join("\n");
  fs.writeFileSync(cfgPath, cfg);
  console.log("Admin dropdowns: " + n + " filled (" + catLines.length + " categories, " + projLines.length + " projects).");
})();

// ---- 7. sitemap ---------------------------------------------------------------------------
const urls = ["/", "/contact", "/getting-started"].concat(written.filter((w) => w.sitemap).map((w) => w.address));
fs.writeFileSync(path.join(OUT, "sitemap.xml"),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map((u) => "  <url><loc>" + SITE + u + "</loc></url>").join("\n") + "\n</urlset>\n");

console.log("Built _site: " + written.length + " pages (" + PROJECTS.length + " artworks, " + URLS.BROWSE_CATS.length +
  " categories, " + BREAKDOWNS.length + " breakdowns), sitemap with " + urls.length + " addresses.");

makeThumbs().catch((e) => { console.error(e); process.exit(1); });
