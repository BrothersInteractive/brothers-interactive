/* =====================================================================
   Brothers Interactive — site scripts
   Portfolio data, filtering, lightbox, games trailers, blog, nav, forms
   ===================================================================== */

function siteMain() {
  "use strict";

  /* ------------------------------------------------------------------
     DATA lives in data.js (window.BI). Edit content there, not here.
     ------------------------------------------------------------------ */
  var BI = window.BI || {};
  var CFG = BI.CONFIG || {};
  var CAT = {
    "modular-chr-skins": "Modular CHR Skins",
    "realistic-humans": "Realistic CHR",
    "realistic-creatures": "Realistic Creature",
    "realistic-hairs": "Realistic Hair Card",
    "stylized-human": "Stylized CHR",
    "stylized-creature": "Stylized Creature",
    "props": "Realistic Props",
    "weapons": "Realistic Weapons",
    "mid-night-walk": "Game - Midnight Walk",
    "lost-in-random": "Game - Lost in Random"
  };
  /* "Browse by style" tiles on the homepage/category pages. Each groups one or
     more of the CAT keys above (a piece's own p.c is untouched, so its label
     everywhere else — lightbox, asset page, work-card badge — is unaffected).
     A slug with an empty match list has no tagged work yet and renders as a
     non-clickable "Coming soon" tile instead of linking to an empty page. */
  var BROWSE_CATS = [
    { slug: "modular-chr-skins", label: "Modular CHR Skins", match: ["modular-chr-skins"] },
    { slug: "realistic-character", label: "Realistic CHR", match: ["realistic-humans"] },
    { slug: "realistic-creature", label: "Realistic Creature", match: ["realistic-creatures"] },
    { slug: "realistic-hair", label: "Realistic Hair Card", match: ["realistic-hairs"] },
    { slug: "stylized-character", label: "Stylized CHR", match: ["stylized-human"] },
    { slug: "stylized-creature", label: "Stylized Creature", match: ["stylized-creature"] },
    { slug: "props", label: "Realistic Props", match: ["props"] },
    { slug: "weapons", label: "Realistic Weapons", match: ["weapons"] },
    { slug: "midnight-walk", label: "Game - Midnight Walk", match: ["mid-night-walk"] },
    { slug: "lost-in-random", label: "Game - Lost in Random", match: ["lost-in-random"] }
  ];
  /* A piece belongs to its main category (p.c) plus any extra ones listed in
     p.cats ("Also show in" in /admin), so one upload can appear in several
     category pages. p.c alone still drives the piece's label elsewhere. */
  function inCat(p, key) { return p.c === key || (Array.isArray(p.cats) && p.cats.indexOf(key) !== -1); }
  function inAnyCat(p, keys) { for (var k = 0; k < keys.length; k++) { if (inCat(p, keys[k])) return true; } return false; }
  var BASE = "https://brothersinteractive.com/projects/";

  /* Grid images: a 640px WebP thumbnail (assets/img/thumbs/<folder>/<name>.webp) with the
     full image offered for high-res screens via srcset, so grids don't download 1000px+
     files to show them at ~400-600px. A missing thumbnail (e.g. a brand-new /admin upload)
     falls back to the full image automatically. Returns the src/srcset/sizes attributes. */
  var THUMB_RE = /assets\/img\/(portfolio|games|categories)\/([^\/?#]+)\.(webp|jpe?g|png)$/i;
  function imgAttrs(u, sizes) {
    u = u || "";
    if (!THUMB_RE.test(u)) return 'src="' + u + '"';
    var t = u.replace(THUMB_RE, "assets/img/thumbs/$1/$2.webp");
    return 'src="' + t + '" srcset="' + t + ' 640w, ' + u + ' 1280w" sizes="' + (sizes || "33vw") + '" data-full="' + u + '"';
  }
  document.addEventListener("error", function (e) {
    var img = e.target;
    if (img && img.tagName === "IMG" && img.dataset.full && !img.dataset.fellBack) {
      img.dataset.fellBack = "1"; img.removeAttribute("srcset"); img.src = img.dataset.full;
    }
  }, true);

  /* All editable content lives in data/*.json (not data.js) so the /admin
     CMS can change it without touching any code. Loaded synchronously here
     so the rest of this file can keep assuming the data is ready. A file
     with no CMS-made changes yet just 404s and the data.js fallback (if any)
     is used instead — nothing breaks either way. */
  // Data files are normally already fetched, all in parallel, by the loader at the bottom of
  // this file (window.__BI_JSON). Anything not preloaded falls back to a one-off synchronous
  // request (the ?t= stamp stops a stale cached copy after an /admin edit).
  var JSON_STAMP = Date.now(), jsonCache = window.__BI_JSON || {};
  function loadJSON(name) {
    if (name in jsonCache) return jsonCache[name];
    var out = null;
    try {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", "data/" + name + ".json?t=" + JSON_STAMP, false);
      xhr.send(null);
      if (xhr.status === 200) out = JSON.parse(xhr.responseText);
    } catch (e) {}
    return (jsonCache[name] = out);
  }
  function loadList(name, fallback) {
    var loaded = loadJSON(name);
    var list = Array.isArray(loaded) ? loaded : (loaded && loaded.items) || null;
    return list && list.length ? list : (fallback || []);
  }

  var PROJECTS = loadList("portfolio", BI.PROJECTS);
  var GAMES = loadList("games", BI.GAMES);
  var CASES = loadList("cases", BI.CASES);
  var POSTS = loadList("posts", BI.POSTS);
  var TESTIMONIALS = loadList("testimonials", BI.TESTIMONIALS);
  var ROLES = loadList("roles", BI.ROLES);
  var PAIRS = loadList("pairs", BI.PAIRS);
  var CLIENTS = loadList("clients", BI.CLIENTS);
  var PRESS = loadList("press", BI.PRESS);
  var TEAM = loadList("team", []);
  var HERO_SHOWCASE = loadList("hero-showcase", BI.HERO_SHOWCASE);

  /* Stat counters that must track real data instead of a hand-typed number
     (data-stat="projects"/"games"/"clients"/"years" on any .stat-num, any page).
     Runs before the reveal/counter-animation wiring below picks up data-count. */
  $$(".stat-num[data-stat]").forEach(function (el) {
    var kind = el.dataset.stat;
    var val = kind === "projects" ? PROJECTS.length
      : kind === "games" ? GAMES.length
      : kind === "clients" ? CLIENTS.length
      : kind === "years" ? (new Date().getFullYear() - 2019)
      : null;
    if (val != null) el.setAttribute("data-count", val);
  });

  (function () {
    var loadedCfg = loadJSON("config");
    if (loadedCfg && typeof loadedCfg === "object") {
      for (var k in loadedCfg) { if (loadedCfg[k] !== "" && loadedCfg[k] != null) CFG[k] = loadedCfg[k]; }
    }
  })();
  var EMAIL = CFG.email || "business@brothersinteractive.com";
  var JOBS_EMAIL = "contact@brothersinteractive.com";

  var HERO = BI.HERO || {};
  (function () {
    var loadedHero = loadJSON("hero");
    if (loadedHero && typeof loadedHero === "object") {
      for (var k in loadedHero) { if (loadedHero[k] !== "" && loadedHero[k] != null) HERO[k] = loadedHero[k]; }
    }
  })();

  /* Analytics hook: no-op until CONFIG.plausibleDomain is set */
  function track(name, props) {
    try { if (window.plausible) window.plausible(name, props ? { props: props } : undefined); } catch (err) {}
  }

  /* Shared form sender: posts straight to the inbox via FormSubmit.co (no signup,
     just a one-time "Activate Form" email the first time EMAIL receives one),
     falls back to the visitor's email client if the request is blocked/offline. */
  function sendForm(formEl, noteEl, payload, eventName, mailtoHref, targetEmail) {
    noteEl.className = "form-note"; noteEl.textContent = "Sending...";
    var body = {};
    for (var k in payload) body[k] = payload[k];
    body._captcha = "false";
    body._template = "table";
    if (payload.email) body._replyto = payload.email;
    fetch("https://formsubmit.co/ajax/" + (targetEmail || EMAIL), {
      method: "POST", headers: { "Accept": "application/json", "Content-Type": "application/json" }, body: JSON.stringify(body)
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (out) { return { ok: r.ok, out: out }; }); })
      .then(function (res) {
        if (!res.ok || String(res.out.success) !== "true") throw new Error((res.out && res.out.message) || "send failed");
        noteEl.className = "form-note ok"; noteEl.textContent = "Sent! Thank you, we'll be in touch shortly.";
        formEl.reset(); track(eventName);
      }).catch(function () {
        noteEl.className = "form-note err"; noteEl.textContent = "Could not send online. Opening your email client instead...";
        window.location.href = mailtoHref;
      });
  }

  /* ------------------------------------------------------------------
     Helpers
     ------------------------------------------------------------------ */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  /* Accepts a bare YouTube ID (what the CMS asks for) or a pasted-in-by-mistake
     full URL (watch?v=, youtu.be/, embed/) and always returns just the ID. */
  function ytId(v) {
    if (!v) return "";
    var m = String(v).match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{6,})/);
    return m ? m[1] : v;
  }
  /* A link typed without http(s):// (e.g. "www.linkedin.com/...") would
     otherwise resolve as a relative path on the current page and 404.
     Leaves mailto:, tel:, #anchors and already-absolute URLs untouched. */
  function normalizeUrl(u) {
    u = String(u || "").trim();
    if (!u || /^(https?:|mailto:|tel:|#)/i.test(u)) return u;
    return "https://" + u;
  }

  /* ==================================================================
     HOME PAGE ONLY — everything inside this block needs the portfolio,
     games, case study and blog containers that exist on index.html.
     ================================================================== */
  if ($("#portfolioGrid")) {

  /* ------------------------------------------------------------------
     Hero (index.html only — category.html shares this HOME-only block
     but has no #home hero section, so this simply no-ops there)
     ------------------------------------------------------------------ */
  if ($("#home")) {
    if (HERO.eyebrow) $("#heroEyebrowText").textContent = HERO.eyebrow;
    if (HERO.titleLine1) $("#heroLine1").textContent = HERO.titleLine1;
    if (HERO.titleAccent) { $("#heroAccent").textContent = HERO.titleAccent; $("#heroAccent").setAttribute("data-text", HERO.titleAccent); }
    if (HERO.titleLine3) $("#heroLine3").textContent = HERO.titleLine3;
    if (HERO.subtitle) $("#heroSub").textContent = HERO.subtitle;
    if (HERO.primaryBtnLabel) $("#heroBtnPrimary").textContent = HERO.primaryBtnLabel;
    if (HERO.secondaryBtnLabel) $("#heroBtnSecondary").textContent = HERO.secondaryBtnLabel + " →";
    [1, 2, 3].forEach(function (n) {
      // Stat 2 (portfolio pieces) and stat 3 (shipped games) always reflect the
      // real data length -- never the CMS's typed-in number -- so the count on
      // screen can't drift out of sync when items are added or removed.
      var num = n === 2 ? PROJECTS.length : n === 3 ? GAMES.length : HERO["stat" + n + "Num"];
      var suffix = HERO["stat" + n + "Suffix"], label = HERO["stat" + n + "Label"];
      var numEl = $("#heroStat" + n + "Num"), labelEl = $("#heroStat" + n + "Label");
      if (num || num === 0) numEl.setAttribute("data-count", num);
      if (suffix != null) numEl.setAttribute("data-suffix", suffix);
      if (label) labelEl.textContent = label;
    });
    // Showcase: one entry picked at random on every load/refresh (Hero Showcase Images in /admin).
    // Priority per entry: 3D model (drag-to-rotate turntable) > video/GIF (silent loop) > image.
    // The entry's image, if any, is the loading picture for a model or video.
    // On localhost only, ?heroModel=<url> / ?heroVideo=<url> preview without touching the data.
    var showImg = $("#heroShowcaseImg");
    var entries = HERO_SHOWCASE.filter(function (x) { return x && (x.img || x.model || x.video); });
    var isLocal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    var previewModel = (location.search.match(/[?&]heroModel=([^&]+)/) || [])[1];
    var previewVideo = (location.search.match(/[?&]heroVideo=([^&]+)/) || [])[1];
    var previewSize = (location.search.match(/[?&]heroSize=(\d+)/) || [])[1];
    if (isLocal && previewModel) entries = [{ model: decodeURIComponent(previewModel), alt: "Preview model", modelSize: previewSize && +previewSize }];
    else if (isLocal && previewVideo) entries = [{ video: decodeURIComponent(previewVideo), alt: "Preview video" }];
    if (showImg && entries.length) {
      var pick = entries[Math.floor(Math.random() * entries.length)];
      if (pick.img) showImg.src = pick.img;
      showImg.alt = pick.alt || "";
      if (pick.model) mountHeroModel(pick.model, showImg, pick.alt, pick.modelSize);
      else if (pick.video) mountHeroVideo(pick.video, showImg, pick.alt);
    }
  }

  function mountHeroVideo(src, img, alt) {
    if (!img) return;
    // A GIF is just an animated image: show it in place of the still.
    if (/\.gif(\?|$)/i.test(src)) { img.src = src; return; }
    // Safari can't play WebM transparency (it would show a black box), so keep the image there.
    var isSafari = /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);
    if (/\.webm(\?|$)/i.test(src) && isSafari) return;
    var v = document.createElement("video");
    v.className = "hero-video";
    v.muted = true; v.loop = true; v.autoplay = true; v.playsInline = true;
    v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("preload", "auto");
    v.setAttribute("aria-label", alt || "Character video");
    if (img.getAttribute("src")) v.poster = img.getAttribute("src");
    v.src = src;
    // If the video can't play at all, fall back to the image.
    v.addEventListener("error", function () { v.remove(); img.hidden = false; });
    img.hidden = true;
    img.parentNode.insertBefore(v, img);
    var p = v.play(); if (p && p.catch) p.catch(function () {});
  }

  function mountHeroModel(src, img, alt, size) {
    // "3D model size (%)" from /admin: 100 = auto framing (whole model fits); 125 = camera 1.25x closer, etc.
    size = Math.max(50, Math.min(150, +size || 100));
    var radius = size === 100 ? "auto" : Math.round(10000 / size) + "%";
    if (!img) return;
    if (!document.querySelector("script[data-model-viewer]")) {
      var mvs = document.createElement("script");
      mvs.type = "module"; mvs.setAttribute("data-model-viewer", "");
      mvs.src = "https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js";
      document.head.appendChild(mvs);
    }
    var mv = document.createElement("model-viewer");
    var attrs = {
      src: src, alt: alt || "3D character model",
      poster: img.getAttribute("src") || "", loading: "eager", reveal: "auto",
      "camera-controls": "", "disable-zoom": "", "disable-pan": "", "touch-action": "pan-y",
      "auto-rotate": "", "auto-rotate-delay": "0", "rotation-per-second": "18deg", "interaction-prompt": "none",
      "shadow-intensity": "1.2", "shadow-softness": "0.9", exposure: "1.05", "environment-image": "neutral",
      "camera-orbit": "0deg 80deg " + radius, // auto radius always fits the whole model; the size setting moves the camera closer/further
      // Spin freely left/right; only a small up/down tilt is allowed (phi 64°-96°), and it glides back to eye level on release.
      "min-camera-orbit": "-Infinity 64deg 50%", "max-camera-orbit": "Infinity 96deg 250%" // distance range wide enough for sizes 50-150
    };
    Object.keys(attrs).forEach(function (k) { mv.setAttribute(k, attrs[k]); });
    // Without a loading picture the model fades in smoothly once it's ready instead of popping in.
    mv.className = "hero-model" + (attrs.poster ? "" : " hero-model--fade");
    img.hidden = true;
    img.parentNode.insertBefore(mv, img);
    var hint = document.createElement("span");
    hint.className = "hero-model-hint"; hint.setAttribute("aria-hidden", "true");
    hint.innerHTML = "Loading 3D model&hellip;";
    img.parentNode.appendChild(hint);
    mv.addEventListener("load", function () {
      mv.classList.add("ready");
      if (!hint.classList.contains("gone")) hint.innerHTML = "&#8634; Drag to rotate";
    });
    mv.addEventListener("pointerdown", function () { hint.classList.add("gone"); }, { once: true });

    // After a drag, ease the vertical angle back to eye level slowly, keeping the horizontal angle.
    var settleTimer = 0;
    function settle() {
      if (!mv.getCameraOrbit) return;
      var o = mv.getCameraOrbit();
      if (Math.abs(o.phi * 180 / Math.PI - 80) < 0.5) return;
      mv.setAttribute("interpolation-decay", "600");            // slow glide (default is 50)
      mv.cameraOrbit = (o.theta * 180 / Math.PI).toFixed(2) + "deg 80deg " + radius;
      clearTimeout(settleTimer);
      settleTimer = setTimeout(function () { mv.setAttribute("interpolation-decay", "50"); }, 2500); // snappy again for the next drag
    }
    mv.addEventListener("pointerdown", function () { clearTimeout(settleTimer); mv.setAttribute("interpolation-decay", "50"); });
    window.addEventListener("pointerup", function () { setTimeout(settle, 60); });
    window.addEventListener("touchend", function () { setTimeout(settle, 60); });
  }

  /* ------------------------------------------------------------------
     Portfolio grid + filters + load more
     ------------------------------------------------------------------ */
  var grid = $("#portfolioGrid");
  var loadMoreBtn = $("#loadMoreBtn");
  var PAGE = 12; // still used for the staggered fade-in animation, not for hiding items
  // category.html links here as ?cat=<key> to land already filtered to one style
  var qCat = (location.search.match(/[?&]cat=([^&]+)/) || [])[1];
  var activeFilter = qCat ? decodeURIComponent(qCat) : "all";
  var shown = Infinity; // show the whole portfolio at once, no "Load More" needed
  var visibleList = [];

  // ?cat= can be a BROWSE_CATS slug (grouped tile) or a raw CAT key (legacy link)
  var activeBrowseCat = BROWSE_CATS.filter(function (b) { return b.slug === activeFilter; })[0];

  // category.html: fill in the page title/heading from the ?cat= key
  var catTitleEl = $("#categoryTitle");
  if (catTitleEl) {
    var catLabel = (activeBrowseCat && activeBrowseCat.label) || CAT[activeFilter] || "Portfolio";
    catTitleEl.textContent = catLabel;
    document.title = catLabel + " | Brothers Interactive";
  }

  /* A fresh random order on every page load, so the portfolio never looks the same twice */
  var SHUFFLED = PROJECTS.slice();
  for (var si = SHUFFLED.length - 1; si > 0; si--) {
    var sj = Math.floor(Math.random() * (si + 1));
    var tmp = SHUFFLED[si]; SHUFFLED[si] = SHUFFLED[sj]; SHUFFLED[sj] = tmp;
  }
  function filtered() {
    if (activeFilter === "all") return SHUFFLED;
    if (activeBrowseCat) return SHUFFLED.filter(function (p) { return inAnyCat(p, activeBrowseCat.match); });
    return SHUFFLED.filter(function (p) { return inCat(p, activeFilter); });
  }

  function renderGrid() {
    visibleList = filtered();
    var slice = visibleList.slice(0, shown);
    if (!slice.length) {
      grid.innerHTML = '<p class="portfolio-empty">No pieces in this category yet.</p>';
    } else {
      grid.innerHTML = slice.map(function (p, idx) {
        var ar = p.w && p.h ? 'aspect-ratio:' + p.w + '/' + p.h + ';' : '';
        return (
          '<article class="work-card ripple-host" data-index="' + PROJECTS.indexOf(p) + '" style="' + ar + '--i:' + idx + ';animation-delay:' + (idx % PAGE) * 40 + 'ms" tabindex="0" role="button" aria-label="Open ' + esc(p.t) + '">' +
            '<img ' + imgAttrs(p.i, "(max-width: 600px) 50vw, (max-width: 1100px) 33vw, 25vw") + ' alt="' + esc(p.t) + '" loading="lazy"' + (p.w ? ' width="' + p.w + '" height="' + p.h + '"' : '') + ' />' +
            '<span class="work-zoom" aria-hidden="true">&#x2922;</span>' +
            // On a category page, a piece shown via "Also show in" is labelled with that page's category
            '<div class="work-info"><span class="work-cat">' + esc(activeBrowseCat && activeBrowseCat.match.indexOf(p.c) === -1 ? activeBrowseCat.label : CAT[p.c]) + '</span><span class="work-title">' + esc(p.t) + '</span></div>' +
          '</article>'
        );
      }).join("");
    }
    loadMoreBtn.style.display = shown >= visibleList.length ? "none" : "";
  }

  var filterBarEl = $("#filterBar");
  if (filterBarEl) filterBarEl.addEventListener("click", function (e) {
    var btn = e.target.closest(".filter-btn");
    if (!btn) return;
    // reset the lightbox list to the grid selection
    visibleList = [];
    $$(".filter-btn").forEach(function (b) { b.classList.remove("active"); b.setAttribute("aria-selected", "false"); });
    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");
    activeFilter = btn.dataset.filter;
    shown = Infinity;
    // animate old cards out, then render the new set (cards animate in with a stagger)
    grid.classList.add("leaving");
    setTimeout(function () { renderGrid(); grid.classList.remove("leaving"); }, 220);
  });

  loadMoreBtn.addEventListener("click", function () {
    shown += PAGE;
    renderGrid();
  });

  renderGrid();

  /* ------------------------------------------------------------------
     Category grid ("browse by art style" tiles) -- each tile links to
     category.html?cat=<key>, which reuses this same portfolio-grid +
     lightbox code path pre-filtered to that one category.
     ------------------------------------------------------------------ */
  var categoryGridEl = $("#categoryGrid");
  if (categoryGridEl) {
    // Optional hand-picked tile images from /admin ("Category Tile Images"),
    // keyed by slug with "-" as "_". Empty = pick the first piece automatically.
    var TILE_IMG = loadJSON("category-tiles") || {};
    categoryGridEl.innerHTML = BROWSE_CATS.map(function (b, i) {
      // Prefer a piece whose main category is this one for the tile image; fall back to an "Also show in" piece
      var thumb = PROJECTS.filter(function (p) { return b.match.indexOf(p.c) !== -1; })[0] ||
                  PROJECTS.filter(function (p) { return inAnyCat(p, b.match); })[0];
      if (!thumb) {
        return (
          '<div class="style-tile style-tile--soon reveal" style="transition-delay:' + (i % 3) * 70 + 'ms" aria-hidden="true">' +
            '<span class="style-tile-label">' + esc(b.label) + '<small>Coming soon</small></span>' +
          '</div>'
        );
      }
      return (
        '<a class="style-tile reveal" href="category.html?cat=' + encodeURIComponent(b.slug) + '" style="transition-delay:' + (i % 3) * 70 + 'ms" aria-label="Browse ' + esc(b.label) + '">' +
          '<img ' + imgAttrs(TILE_IMG[b.slug.replace(/-/g, "_")] || thumb.i, "(max-width: 600px) 50vw, 33vw") + ' alt="" loading="lazy" />' +
          '<span class="style-tile-label">' + esc(b.label) + '</span>' +
        '</a>'
      );
    }).join("");
  }

  /* ------------------------------------------------------------------
     Lightbox
     ------------------------------------------------------------------ */
  var lb = $("#lightbox");
  var lbImg = $("#lightboxImg");
  var lbCat = $("#lightboxCat");
  var lbTitle = $("#lightboxTitle");
  var lbLink = $("#lightboxLink");
  var lbThumbs = $("#lightboxThumbs");
  var lbPos = 0; // position within visibleList
  var lbFigure = $(".lightbox-figure", lb);
  var lbOrigin = null; // element the lightbox was opened from (for the zoom animation)
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Zoom-from-thumbnail: a clone of the clicked image flies to where the lightbox image will sit.
     Cleanup runs on transitionend, with a timer as fallback, so a throttled tab never leaves a clone behind. */
  function clearClones() { $$(".flip-clone").forEach(function (c) { c.remove(); }); lbFigure.classList.remove("hidden-for-flip", "settle"); }
  function afterMove(clone, ms, fn) {
    var fired = false;
    var go = function () { if (fired) return; fired = true; fn(); };
    clone.addEventListener("transitionend", function (e) { if (e.propertyName === "transform") go(); });
    setTimeout(go, ms + 80);
  }
  /* Sizes/positions the clone at its FINAL (toRect) box immediately — no layout
     animation — then fakes the starting look with a transform (translate+scale)
     computed from fromRect. Only that transform is ever animated afterwards. */
  function makeClone(srcImg, fromRect, toRect, fit) {
    var clone = srcImg.cloneNode(false);
    // Reuse the exact picture already on screen: without this the bigger box makes the browser
    // pick the 1280px file from srcset and download/decode it mid-animation (the visible hitch).
    clone.removeAttribute("srcset"); clone.removeAttribute("sizes"); clone.removeAttribute("loading");
    clone.src = srcImg.currentSrc || srcImg.src;
    clone.className = "flip-clone loaded";
    var sx = fromRect.width / toRect.width, sy = fromRect.height / toRect.height;
    var tx = (fromRect.left + fromRect.width / 2) - (toRect.left + toRect.width / 2);
    var ty = (fromRect.top + fromRect.height / 2) - (toRect.top + toRect.height / 2);
    clone.style.cssText = "top:" + toRect.top + "px;left:" + toRect.left + "px;width:" + toRect.width + "px;height:" + toRect.height + "px;object-fit:" + fit + ";" +
      "transition:none;transform:translate(" + tx + "px," + ty + "px) scale(" + sx + "," + sy + ");";
    document.body.appendChild(clone);
    return clone;
  }
  function flipTo(fromEl, done) {
    clearClones();
    var srcImg = fromEl && fromEl.querySelector("img");
    if (!srcImg || reduceMotion) { done(); return; }
    var from = srcImg.getBoundingClientRect();
    if (!from.width) { done(); return; }
    lbFigure.classList.add("hidden-for-flip");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var box = lbImg.getBoundingClientRect();
        if (!box.width) { box = { top: window.innerHeight * 0.06, left: window.innerWidth * 0.2, width: window.innerWidth * 0.6, height: window.innerHeight * 0.78 }; }
        // Land on the picture's real (contained) rectangle inside the viewer box, with the card's
        // proportions — so the flight is one uniform scale, never a stretch/squash.
        var ratio = from.width / from.height, w = box.width, h = w / ratio;
        if (h > box.height) { h = box.height; w = h * ratio; }
        var to = { top: box.top + (box.height - h) / 2, left: box.left + (box.width - w) / 2, width: w, height: h };
        var clone = makeClone(srcImg, from, to, "cover");
        clone.getBoundingClientRect(); // commit the instant starting transform before animating
        clone.style.transition = "transform 0.42s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s";
        clone.style.transform = "none";
        afterMove(clone, 420, function () {
          // Hand over only once the full-size picture is decoded, so there's no blank/pop frame.
          var ready = lbImg.decode ? lbImg.decode().catch(function () {}) : Promise.resolve();
          Promise.race([ready, new Promise(function (r) { setTimeout(r, 1200); })]).then(function () {
            lbFigure.classList.remove("hidden-for-flip");
            clone.style.opacity = "0";
            setTimeout(function () { clone.remove(); done(); }, 250);
          });
        });
      });
    });
  }
  function flipBack(toEl, done) {
    clearClones();
    var dstImg = toEl && toEl.querySelector("img");
    if (!dstImg || reduceMotion || !lb.classList.contains("open")) { done(); return; }
    var box = lbImg.getBoundingClientRect(); var to = dstImg.getBoundingClientRect();
    if (!box.width || !to.width || to.bottom < 0 || to.top > window.innerHeight) { done(); return; }
    // start from the picture's visible (contained) rectangle, in the card's proportions: uniform shrink, no squash
    var ratio = to.width / to.height, w = box.width, h = w / ratio;
    if (h > box.height) { h = box.height; w = h * ratio; }
    var from = { top: box.top + (box.height - h) / 2, left: box.left + (box.width - w) / 2, width: w, height: h };
    var clone = makeClone(lbImg, from, to, "cover");
    lbFigure.classList.add("hidden-for-flip");
    clone.getBoundingClientRect(); // commit the instant starting transform before animating
    requestAnimationFrame(function () {
      clone.style.transition = "transform 0.38s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s";
      clone.style.transform = "none";
      afterMove(clone, 380, function () {
        clone.style.opacity = "0";
        setTimeout(function () { clone.remove(); lbFigure.classList.remove("hidden-for-flip"); done(); }, 200);
      });
    });
  }

  function openLightbox(projectIndex, fromEl) {
    var p = PROJECTS[projectIndex];
    if (visibleList.indexOf(p) === -1) visibleList = [p];
    lbPos = visibleList.indexOf(p);
    lbOrigin = fromEl || null;
    showLightbox(p);
    lb.classList.add("open");
    lb.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    flipTo(fromEl, function () {});
  }
  function showLightbox(p, dir) {
    var swap = function () {
      lbImg.src = p.i;
      lbImg.alt = p.t;
      lbImg.classList.add("loaded");
      lbCat.textContent = CAT[p.c];
      lbTitle.textContent = p.t;
      lbLink.href = "asset.html?id=" + p.id;
      lbLink.textContent = "Asset details & breakdown \u2192";
      var variants = [p.i].concat(p.imgs || []);
      lbThumbs.innerHTML = variants.length > 1 ? variants.map(function (u, i) {
        return '<button class="asset-thumb' + (i === 0 ? ' active' : '') + '" data-src="' + u + '" aria-label="View ' + (i + 1) + '"><img ' + imgAttrs(u, "120px") + ' alt="" loading="lazy" /></button>';
      }).join("") : "";
    };
    if (!dir || reduceMotion) { swap(); return; }
    lbImg.className = "loaded " + (dir > 0 ? "slide-out-left" : "slide-out-right");
    setTimeout(function () {
      swap();
      lbImg.className = "loaded " + (dir > 0 ? "slide-in-right" : "slide-in-left");
      setTimeout(function () { lbImg.className = "loaded"; }, 340);
    }, 200);
  }
  function closeLightbox() {
    if (!lb.classList.contains("open")) return;
    var origin = lbOrigin; lbOrigin = null;
    flipBack(origin, function () {
      lb.classList.remove("open");
      lb.setAttribute("aria-hidden", "true");
      document.body.classList.remove("no-scroll");
      clearClones();
    });
  }
  function stepLightbox(dir) {
    if (!visibleList.length) return;
    lbPos = (lbPos + dir + visibleList.length) % visibleList.length;
    lbOrigin = $('.work-card[data-index="' + PROJECTS.indexOf(visibleList[lbPos]) + '"]') || lbOrigin;
    showLightbox(visibleList[lbPos], dir);
  }

  grid.addEventListener("click", function (e) {
    var card = e.target.closest(".work-card");
    if (card) { visibleList = filtered(); openLightbox(+card.dataset.index, card); }
  });
  grid.addEventListener("keydown", function (e) {
    var card = e.target.closest(".work-card");
    if (card && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); visibleList = filtered(); openLightbox(+card.dataset.index); }
  });
  lbThumbs.addEventListener("click", function (e) {
    var btn = e.target.closest(".asset-thumb");
    if (!btn || btn.classList.contains("active")) return;
    $$(".asset-thumb", lbThumbs).forEach(function (b) { b.classList.toggle("active", b === btn); });
    lbImg.classList.add("fading");
    setTimeout(function () {
      lbImg.src = btn.dataset.src;
      lbImg.classList.remove("fading");
    }, 160);
  });
  $("#lightboxClose").addEventListener("click", closeLightbox);
  $("#lightboxPrev").addEventListener("click", function () { stepLightbox(-1); });
  $("#lightboxNext").addEventListener("click", function () { stepLightbox(1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLightbox(); });

  /* ------------------------------------------------------------------
     Games grid + trailer modal
     ------------------------------------------------------------------ */
  var gamesGrid = $("#gamesGrid");
  if (gamesGrid) gamesGrid.innerHTML = GAMES.map(function (g, i) {
    return (
      '<article class="game-card reveal" data-yt="' + esc(ytId(g.yt)) + '" tabindex="0" role="button" aria-label="Play trailer: ' + esc(g.t) + '" style="transition-delay:' + (i % 3) * 90 + 'ms">' +
        '<img ' + imgAttrs(g.i, "(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 25vw") + ' alt="' + esc(g.t) + ' key art" loading="lazy" />' +
        '<span class="game-play" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>' +
        '<div class="game-info"><div><span class="game-studio">' + esc(g.s || "") + '</span><span class="game-title">' + esc(g.t) + '</span></div><span class="game-tag">Watch trailer</span></div>' +
      '</article>'
    );
  }).join("");

  var vm = $("#videoModal");
  var vmFrame = $("#videoIframe");
  function openVideo(id) {
    if (!vm) return;
    id = ytId(id);
    track("trailer_played", { video: id });
    vmFrame.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
    vm.classList.add("open");
    vm.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  }
  function closeVideo() {
    if (!vm) return;
    vm.classList.remove("open");
    vm.setAttribute("aria-hidden", "true");
    vmFrame.src = "";
    document.body.classList.remove("no-scroll");
  }
  if (gamesGrid) {
    gamesGrid.addEventListener("click", function (e) {
      var card = e.target.closest(".game-card");
      if (card) openVideo(card.dataset.yt);
    });
    gamesGrid.addEventListener("keydown", function (e) {
      var card = e.target.closest(".game-card");
      if (card && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openVideo(card.dataset.yt); }
    });
  }
  if (vm) {
    $("#videoClose").addEventListener("click", closeVideo);
    vm.addEventListener("click", function (e) { if (e.target === vm) closeVideo(); });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeLightbox(); closeVideo(); closeNav(); }
    if (lb.classList.contains("open")) {
      if (e.key === "ArrowLeft") stepLightbox(-1);
      if (e.key === "ArrowRight") stepLightbox(1);
    }
  });

  /* ------------------------------------------------------------------
     Case studies
     ------------------------------------------------------------------ */
  var caseList = $("#caseList");
  function casePieces(c) {
    return c.cat ? PROJECTS.filter(function (p) { return p.c === c.cat; }) : [];
  }
  if (caseList) caseList.innerHTML = CASES.map(function (c, i) {
    var pieces = casePieces(c);
    var thumbs = pieces.slice(0, 6).map(function (p) {
      return '<button class="case-thumb" data-index="' + PROJECTS.indexOf(p) + '" data-case="' + i + '" aria-label="Open ' + esc(p.t) + '"><img src="' + p.i + '" alt="' + esc(p.t) + '" loading="lazy" /></button>';
    }).join("");
    var piecesHtml = pieces.length
      ? '<div class="case-pieces"><span class="case-pieces-label">' + pieces.length + ' published asset' + (pieces.length > 1 ? 's' : '') + ' from this project</span><div class="case-thumbs">' + thumbs + '</div></div>'
      : '<div class="case-pieces case-pieces--nda"><span class="case-pieces-label">Asset breakdowns available on request</span></div>';
    return (
      '<article class="case-card reveal' + (i % 2 ? ' case-card--flip' : '') + '">' +
        '<div class="case-media" data-yt="' + esc(ytId(c.yt)) + '" role="button" tabindex="0" aria-label="Play trailer: ' + esc(c.t) + '">' +
          '<img src="' + c.img + '" alt="' + esc(c.t) + ' key art" loading="lazy" />' +
          '<span class="game-play" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>' +
        '</div>' +
        '<div class="case-body">' +
          '<span class="case-num">Case ' + (i + 1 < 10 ? '0' : '') + (i + 1) + '</span>' +
          '<h3 class="case-title">' + esc(c.t) + '</h3>' +
          '<ul class="case-meta">' +
            '<li><span>Client</span>' + esc(c.client) + '</li>' +
            '<li><span>Year</span>' + esc(c.year) + '</li>' +
            '<li><span>Style</span>' + esc(c.style) + '</li>' +
            '<li><span>Engine</span>' + esc(c.engine) + '</li>' +
          '</ul>' +
          '<p class="case-summary">' + esc(c.summary) + '</p>' +
          (c.stats ? '<ul class="case-stats">' + c.stats.map(function (st) { return '<li><strong>' + esc(st[1]) + '</strong><span>' + esc(st[0]) + '</span></li>'; }).join("") + '</ul>' : '') +
          '<ul class="case-scope">' + c.scope.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join("") + '</ul>' +
          piecesHtml +
        '</div>' +
      '</article>'
    );
  }).join("");

  if (caseList) caseList.addEventListener("click", function (e) {
    var media = e.target.closest(".case-media");
    if (media) { openVideo(media.dataset.yt); return; }
    var thumb = e.target.closest(".case-thumb");
    if (thumb) {
      visibleList = casePieces(CASES[+thumb.dataset.case]);
      openLightbox(+thumb.dataset.index, thumb);
    }
  });
  if (caseList) caseList.addEventListener("keydown", function (e) {
    var media = e.target.closest(".case-media");
    if (media && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openVideo(media.dataset.yt); }
  });

  /* ------------------------------------------------------------------
     Blog
     ------------------------------------------------------------------ */
  var blogGridEl = $("#blogGrid");
  if (blogGridEl) blogGridEl.innerHTML = POSTS.map(function (p, i) {
    var id = ytId(p.yt);
    return (
      '<article class="game-card reveal" data-yt="' + esc(id) + '" tabindex="0" role="button" aria-label="Play video: ' + esc(p.t) + '" style="transition-delay:' + (i % 3) * 90 + 'ms">' +
        '<img src="https://img.youtube.com/vi/' + id + '/hqdefault.jpg" alt="' + esc(p.t) + '" loading="lazy" />' +
        '<span class="game-play" aria-hidden="true"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>' +
        '<div class="game-info"><div><span class="game-title">' + esc(p.t) + '</span></div><span class="game-tag">Watch video</span></div>' +
      '</article>'
    );
  }).join("");

  if (blogGridEl) {
    blogGridEl.addEventListener("click", function (e) {
      var card = e.target.closest(".game-card");
      if (card) openVideo(card.dataset.yt);
    });
    blogGridEl.addEventListener("keydown", function (e) {
      var card = e.target.closest(".game-card");
      if (card && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openVideo(card.dataset.yt); }
    });
  }

  } /* ---- end HOME PAGE ONLY block ---- */

  /* ------------------------------------------------------------------
     Drag-to-compare slider (sculpt/final) — delegated at document level,
     not scoped to #compareGrid, so any page with static .compare-stage
     markup (e.g. breakdown.html) gets a working slider for free.
     ------------------------------------------------------------------ */
  document.addEventListener("input", function (e) {
    var r = e.target.closest(".compare-range"); if (!r) return;
    var st = r.parentElement, v = +r.value;
    $(".compare-before", st).style.clipPath = "inset(0 " + (100 - v) + "% 0 0)";
    $(".compare-handle", st).style.left = v + "%";
  });

  /* ------------------------------------------------------------------
     Testimonials + open roles (data-driven, used on several pages)
     ------------------------------------------------------------------ */
  var tGrid = $("#testimonialGrid");
  if (tGrid) {
    var initials = function (n) { return String(n || "").split(/\s+/).map(function (w) { return w.charAt(0); }).join("").slice(0, 2).toUpperCase() || "BI"; };
    var tCards = TESTIMONIALS.map(function (t) {
          return '<blockquote class="testimonial">' +
            (t.sample ? '<span class="sample-badge" title="Replace in data.js">Sample</span>' : '') +
            '<span class="quote-mark" aria-hidden="true">&ldquo;</span>' +
            '<p>' + esc(t.q) + '</p>' +
            '<footer>' +
              (t.img ? '<img class="t-avatar" src="' + t.img + '" alt="' + esc(t.n) + '" loading="lazy" />' : '<span class="t-avatar t-avatar--initials">' + esc(initials(t.n)) + '</span>') +
              '<div><strong>' + esc(t.n) + '</strong><span>' + esc(t.r) + (t.project ? ' &middot; ' + esc(t.project) : '') + '</span></div>' +
            '</footer>' +
          '</blockquote>';
        }).join("");
    // Horizontal auto-scrolling strip, like the logo wall. One "set" repeats the
    // quotes until it's wider than any screen (so a short list never leaves a gap),
    // then the set is duplicated once so translateX(-50%) loops seamlessly.
    // Everything after the first copy of each quote is hidden from screen readers.
    var tHidden = tCards.replace(/<blockquote class="testimonial">/g, '<blockquote class="testimonial" aria-hidden="true">');
    var tRepeats = Math.max(1, Math.ceil(6 / Math.max(1, TESTIMONIALS.length)));
    var tSet = tCards; for (var ti = 1; ti < tRepeats; ti++) tSet += tHidden;
    var tSetHidden = ""; for (var tj = 0; tj < tRepeats; tj++) tSetHidden += tHidden;
    tGrid.innerHTML = TESTIMONIALS.length
      ? '<div class="testimonial-track" style="animation-duration:' + (TESTIMONIALS.length * tRepeats * 9) + 's">' + tSet + tSetHidden + '</div>'
      : '<p class="portfolio-empty">Client quotes are being collected. Ask us for references directly.</p>';
  }
  $$("[data-roles]").forEach(function (list) {
    var applyHref = list.dataset.roles === "full" ? "./#careers" : null;
    list.innerHTML = ROLES.length
      ? ROLES.map(function (r) {
          var href = applyHref || ("mailto:" + EMAIL + "?subject=" + encodeURIComponent("Application: " + r.t));
          return '<li class="role"><div><strong>' + esc(r.t) + '</strong><span>' + esc(r.type) + '</span></div><p>' + esc(r.d) + '</p><a href="' + href + '">Apply &rarr;</a></li>';
        }).join("")
      : '<li class="role role--empty">No open roles right now. Check back soon or send a speculative portfolio below.</li>';
  });
  if ($("#rolesCount")) $("#rolesCount").textContent = ROLES.length ? ROLES.length + " open role" + (ROLES.length > 1 ? "s" : "") : "No open roles at the moment";

  /* ------------------------------------------------------------------
     Header, mobile nav, active link, scroll progress, back to top
     ------------------------------------------------------------------ */
  var header = $("#siteHeader");
  var nav = $("#mainNav");
  var toggle = $("#navToggle");
  var progress = $("#scrollProgress");
  var backToTop = $("#backToTop");
  var navLinks = $$(".nav-link");
  var sections = navLinks.map(function (a) {
    var href = a.getAttribute("href") || "";
    return href.charAt(0) === "#" && href.length > 1 ? $(href) : null;
  }).filter(Boolean);

  function closeNav() {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }
  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  navLinks.forEach(function (a) { a.addEventListener("click", closeNav); });

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    if (header) header.classList.toggle("scrolled", y > 20);
    if (progress) progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    if (backToTop) backToTop.classList.toggle("show", y > 600);

    if (!sections.length) return; // sub-pages highlight their own link via the markup
    var current = sections[0];
    var probe = y + window.innerHeight * 0.35;
    sections.forEach(function (s) { if (s.offsetTop <= probe) current = s; });
    navLinks.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + current.id); });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  if (backToTop) backToTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });

  /* ------------------------------------------------------------------
     Reveal on scroll + counters
     ------------------------------------------------------------------ */
  function animateCount(el) {
    var target = +el.dataset.count;
    var suffix = el.dataset.suffix || "";
    var start = null;
    var dur = 1400;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  var io = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("in");
        $$(".stat-num[data-count]", en.target).forEach(function (n) { if (!n.dataset.done) { n.dataset.done = "1"; animateCount(n); } });
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  }
  /* Watches every .reveal element not yet watched. Called again at the end so elements
     rendered later in this script (comparison sliders, credits) are picked up too. */
  function watchReveals() {
    $$(".reveal").forEach(function (el) {
      if (el.dataset.watched) return;
      el.dataset.watched = "1";
      if (io) io.observe(el);
      else { el.classList.add("in"); $$(".stat-num[data-count]", el).forEach(animateCount); }
    });
    revealVisible();
  }
  /* Belt-and-braces: anything already inside the viewport is revealed straight away,
     independent of IntersectionObserver timing. Also runs on every scroll. */
  function revealVisible() {
    var h = window.innerHeight;
    $$(".reveal:not(.in)").forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < h - 40 && r.bottom > 0) {
        el.classList.add("in");
        $$(".stat-num[data-count]", el).forEach(function (n) { if (!n.dataset.done) { n.dataset.done = "1"; animateCount(n); } });
      }
    });
  }
  watchReveals();
  window.addEventListener("scroll", revealVisible, { passive: true });
  window.addEventListener("load", revealVisible);

  /* ------------------------------------------------------------------
     Contact form — posts to EMAIL via FormSubmit.co (see sendForm)
     ------------------------------------------------------------------ */
  var form = $("#contactForm");
  var note = $("#formNote");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = $("#cfName"), email = $("#cfEmail"), msg = $("#cfMessage");
    var ok = true;
    [name, email, msg].forEach(function (f) {
      var valid = f.value.trim() !== "" && (f.type !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value));
      f.parentElement.classList.toggle("invalid", !valid);
      if (!valid) ok = false;
    });
    if (!ok) {
      note.className = "form-note err";
      note.textContent = "Please fill in every field with a valid email address.";
      return;
    }
    var extra = [
      ["Studio", $("#cfStudio").value], ["Asset type", $("#cfType").value], ["Art style", $("#cfStyle").value],
      ["Asset count", $("#cfCount").value], ["Deadline", $("#cfDeadline").value]
    ].filter(function (f) { return f[1].trim(); }).map(function (f) { return f[0] + ": " + f[1].trim(); }).join("\n");
    var subjectText = "Project brief from " + name.value.trim() + ($("#cfStudio").value.trim() ? " (" + $("#cfStudio").value.trim() + ")" : "");
    var bodyText = (extra ? extra + "\n\n" : "") + msg.value.trim() + "\n\n— " + name.value.trim() + " (" + email.value.trim() + ")";
    var payload = {
      _subject: subjectText, name: name.value.trim(), email: email.value.trim(), studio: $("#cfStudio").value.trim(),
      assetType: $("#cfType").value, artStyle: $("#cfStyle").value, assetCount: $("#cfCount").value.trim(),
      deadline: $("#cfDeadline").value.trim(), message: msg.value.trim()
    };
    sendForm(form, note, payload, "brief_sent", "mailto:" + EMAIL + "?subject=" + encodeURIComponent(subjectText) + "&body=" + encodeURIComponent(bodyText));
  });

  /* ------------------------------------------------------------------
     Site settings: analytics, availability pill, booking + deck buttons
     ------------------------------------------------------------------ */
  if (CFG.plausibleDomain) {
    var pa = document.createElement("script"); pa.defer = true; pa.setAttribute("data-domain", CFG.plausibleDomain);
    pa.src = "https://plausible.io/js/script.js"; document.head.appendChild(pa);
  }
  var pill = $("#availability");
  if (pill) {
    if (CFG.availability) { pill.hidden = false; $(".avail-text", pill).textContent = CFG.availability; if (CFG.availabilityNote) pill.title = CFG.availabilityNote; }
    else pill.hidden = true;
  }
  $$("[data-booking]").forEach(function (a) { if (CFG.bookingUrl) { a.href = normalizeUrl(CFG.bookingUrl); a.hidden = false; } else { a.hidden = true; } });
  $$("[data-deck]").forEach(function (a) {
    if (CFG.deckPdf) { a.href = CFG.deckPdf; a.addEventListener("click", function () { track("deck_downloaded"); }); } else { a.hidden = true; }
  });

  /* ------------------------------------------------------------------
     Client logo wall (text wordmarks until logos are supplied)
     ------------------------------------------------------------------ */
  var wall = $("#logoWall");
  if (wall && CLIENTS.length) {
    var logoItems = CLIENTS.map(function (c) {
      return '<li>' + (c.logo ? '<img src="' + c.logo + '" alt="' + esc(c.n) + '" loading="lazy" />' : '<span class="wordmark">' + esc(c.n) + '</span>') + '</li>';
    }).join("");
    // Scrolling ticker: duplicated once so translateX(-50%) loops seamlessly.
    wall.innerHTML = logoItems + logoItems;
  }

  /* ------------------------------------------------------------------
     Shared media helpers: YouTube, looping GIF/video, Sketchfab
     ------------------------------------------------------------------ */
  function isVideoFile(u) { return /\.(mp4|webm)(\?|#|$)/i.test(u || ""); }
  function isGif(u) { return /\.gif(\?|#|$)/i.test(u || ""); }
  function ytThumb(v) { return "https://img.youtube.com/vi/" + ytId(v) + "/hqdefault.jpg"; }
  function sketchfabId(v) { var m = String(v || "").match(/([0-9a-f]{32})/i); return m ? m[1] : ""; }
  function loopMedia(u, alt, cls) {
    return isVideoFile(u)
      ? '<video class="' + cls + '" src="' + esc(u) + '" autoplay muted loop playsinline preload="metadata" aria-label="' + esc(alt) + '"></video>'
      : '<img class="' + cls + '" src="' + esc(u) + '" alt="' + esc(alt) + '" loading="lazy" />';
  }
  // Plays a YouTube video in the page's pop-up player (homepage); elsewhere opens YouTube.
  function openYouTube(v) {
    var m = $("#videoModal"), fr = $("#videoIframe"), id = ytId(v);
    if (!m || !fr) { window.open("https://www.youtube.com/watch?v=" + id, "_blank", "noopener"); return; }
    track("trailer_played", { video: id });
    fr.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
    m.classList.add("open"); m.setAttribute("aria-hidden", "false"); document.body.classList.add("no-scroll");
  }

  /* ------------------------------------------------------------------
     Sculpt-to-final cards (homepage). Each pair (/admin > Sculpt to Final) shows,
     in order of priority: a YouTube video (plays in the pop-up), a looping GIF or
     video file, or the before/after drag slider.
     ------------------------------------------------------------------ */
  var cmp = $("#compareGrid");
  if (cmp) {
    // Homepage shows the first 3 usable pairs only; reorder them in /admin to choose which.
    var pairsShown = PAIRS.filter(function (p) { return p && (p.youtube || p.video || (p.before && p.after)); }).slice(0, 3);
    cmp.innerHTML = pairsShown.map(function (pr, i) {
      var stage;
      if (pr.youtube) {
        stage = '<button type="button" class="compare-stage compare-media compare-yt" data-yt="' + esc(ytId(pr.youtube)) + '" aria-label="Play the ' + esc(pr.t) + ' video">' +
          '<img src="' + ytThumb(pr.youtube) + '" alt="" loading="lazy" /><span class="play-badge" aria-hidden="true">&#9654;</span></button>';
      } else if (pr.video) {
        stage = '<div class="compare-stage compare-media">' + loopMedia(pr.video, pr.t, "compare-loop") + '</div>';
      } else {
        stage = '<div class="compare-stage">' +
          '<img class="compare-after" ' + imgAttrs(pr.after, "(max-width: 600px) 100vw, 33vw") + ' alt="' + esc(pr.t) + ' final" loading="lazy" />' +
          '<img class="compare-before" ' + imgAttrs(pr.before, "(max-width: 600px) 100vw, 33vw") + ' alt="' + esc(pr.t) + ' sculpt" loading="lazy" style="clip-path: inset(0 50% 0 0)" />' +
          '<span class="compare-handle" style="left:50%" aria-hidden="true"></span>' +
          '<span class="compare-label compare-label--a">Sculpt</span><span class="compare-label compare-label--b">Final</span>' +
          '<input type="range" class="compare-range" min="0" max="100" value="50" aria-label="Compare sculpt and final for ' + esc(pr.t) + '" />' +
        '</div>';
      }
      return '<figure class="compare reveal" style="transition-delay:' + (i % 3) * 90 + 'ms">' + stage +
        '<figcaption><span>' + esc(pr.t) + '</span>' + (pr.id ? '<a href="asset.html?id=' + encodeURIComponent(pr.id) + '">Details &rarr;</a>' : '') + '</figcaption>' +
      '</figure>';
    }).join("");
    cmp.addEventListener("click", function (e) {
      var b = e.target.closest(".compare-yt");
      if (b) openYouTube(b.dataset.yt);
    });
  }

  /* ------------------------------------------------------------------
     Production breakdowns (/admin > Breakdowns -> data/breakdowns.json)
     Homepage: tiles, 3 per row, each opening breakdown.html?id=<id>.
     breakdown.html: one breakdown (any mix of Sketchfab / Marmoset 3D viewer,
     sculpt-to-final slider, YouTube, GIF/video, gallery, pipeline steps), or
     the list of all breakdowns when no id is given.
     ------------------------------------------------------------------ */
  var BREAKDOWNS = loadList("breakdowns", []).filter(function (b) { return b && b.t && b.id; });
  function bdCover(b) { return b.cover || b.after || (b.gallery && b.gallery[0]) || (b.youtube ? ytThumb(b.youtube) : "") || (b.video && !isVideoFile(b.video) ? b.video : "") || b.before || ""; }
  function bdBadges(b) {
    var t = [];
    if (b.sketchfab || b.marmoset) t.push("3D viewer");
    if (b.youtube || isVideoFile(b.video)) t.push("Video");
    if (isGif(b.video)) t.push("GIF");
    if (b.before && b.after) t.push("Sculpt → Final");
    return t;
  }
  function bdTile(b, i) {
    var c = bdCover(b), badges = bdBadges(b);
    return '<a class="style-tile bd-tile reveal" href="breakdown.html?id=' + encodeURIComponent(b.id) + '" style="transition-delay:' + (i % 3) * 70 + 'ms" aria-label="Open the ' + esc(b.t) + ' breakdown">' +
      (c ? '<img ' + imgAttrs(c, "(max-width: 600px) 50vw, 33vw") + ' alt="" loading="lazy" />' : '') +
      '<span class="style-tile-label">' + esc(b.t) +
        (badges.length ? '<small class="bd-badges">' + badges.map(function (x) { return '<i>' + esc(x) + '</i>'; }).join("") + '</small>' : '') +
      '</span></a>';
  }
  var bdGrid = $("#breakdownGrid");
  if (bdGrid) {
    bdGrid.innerHTML = BREAKDOWNS.length ? BREAKDOWNS.slice(0, 6).map(bdTile).join("") : '<p class="portfolio-empty">Breakdowns coming soon.</p>';
    if (BREAKDOWNS.length > 6 && $("#breakdownMore")) $("#breakdownMore").hidden = false;
  }

  var bdPage = $("#breakdownPage");
  if (bdPage) {
    var bdId = decodeURIComponent((location.search.match(/[?&]id=([^&#]+)/) || [])[1] || "");
    var B = bdId ? BREAKDOWNS.filter(function (b) { return b.id === bdId; })[0] : null;
    var DEFAULT_STEPS = [
      { t: "Brief & Reference", d: "Concept art and reference gathered, style and quality target confirmed before any sculpting starts." },
      { t: "Blockout", d: "Fast proportion and silhouette pass to lock the read of the character early." },
      { t: "High-poly Sculpt", d: "Full anatomy, cloth and hard-surface detail." },
      { t: "Retopology & UVs", d: "Clean, animation-friendly topology and UV layouts packed for the target texel density." },
      { t: "Baking & Texturing", d: "Normal, AO and ID bakes, then textures matched to the art direction." },
      { t: "Final Polish", d: "Lighting, render setup and the final presentation pass." }
    ];
    if (!B) {
      // List of every breakdown
      bdPage.innerHTML =
        '<section class="page-hero page-hero--compact"><div class="container page-hero-inner"><div class="reveal">' +
          '<p class="eyebrow"><span class="eyebrow-dot"></span> <a href="./#breakdown">&larr; Home</a> / Breakdowns</p>' +
          '<h1 class="page-title">Production <span class="accent">breakdowns</span></h1>' +
          '<p class="page-sub">' + (bdId ? 'That breakdown could not be found. Here are all of them.' : 'Sculpt to final, in detail, for selected characters.') + '</p>' +
        '</div></div></section>' +
        '<section class="section section--flush-top"><div class="container"><div class="style-grid">' +
          (BREAKDOWNS.length ? BREAKDOWNS.map(bdTile).join("") : '<p class="portfolio-empty">Breakdowns coming soon.</p>') +
        '</div></div></section>';
    } else {
      document.title = B.t + " Breakdown | Brothers Interactive";
      var n = 0, secs = [];
      var pad = function (k) { return (k < 10 ? "0" : "") + k; };
      var sec = function (label, titleHtml, sub, body) {
        n++;
        return '<section class="section' + (n % 2 ? '' : ' section--alt') + '"><div class="container">' +
          '<div class="section-head reveal"><p class="eyebrow">// ' + pad(n) + ' &middot; ' + esc(label) + '</p>' +
          '<h2 class="section-title">' + titleHtml + '</h2>' + (sub ? '<p class="section-sub">' + esc(sub) + '</p>' : '') + '</div>' +
          body + '</div></section>';
      };
      var sfId = sketchfabId(B.sketchfab);
      if (sfId || B.marmoset) {
        secs.push(sec("Interactive 3D", 'Explore it <span class="accent">in 3D</span>', "Drag to orbit, scroll to zoom. The real asset, not a render.",
          (sfId ? '<div class="bd-embed reveal"><iframe title="' + esc(B.t) + ' 3D model" src="https://sketchfab.com/models/' + sfId + '/embed?autostart=0&ui_theme=dark&dnt=1" allow="autoplay; fullscreen; xr-spatial-tracking" allowfullscreen loading="lazy"></iframe></div>' : '') +
          (B.marmoset ? '<div class="bd-embed reveal' + (sfId ? ' bd-embed--gap' : '') + '" id="bdMarmoset"><p class="bd-embed-note">Loading Marmoset viewer&hellip;</p></div>' : '')));
      }
      if (B.before && B.after) {
        secs.push(sec("Sculpt to final", 'Drag to see the <span class="accent">work underneath</span>', "High-poly sculpt on the left, textured game-ready asset on the right.",
          '<figure class="compare compare--large reveal"><div class="compare-stage">' +
            '<img class="compare-after" src="' + esc(B.after) + '" alt="' + esc(B.t) + ' final" loading="lazy" />' +
            '<img class="compare-before" src="' + esc(B.before) + '" alt="' + esc(B.t) + ' sculpt" loading="lazy" style="clip-path: inset(0 50% 0 0)" />' +
            '<span class="compare-handle" style="left:50%" aria-hidden="true"></span>' +
            '<span class="compare-label compare-label--a">Sculpt</span><span class="compare-label compare-label--b">Final</span>' +
            '<input type="range" class="compare-range" min="0" max="100" value="50" aria-label="Compare sculpt and final for ' + esc(B.t) + '" />' +
          '</div></figure>'));
      }
      if (B.youtube) {
        secs.push(sec("Video", 'Watch the <span class="accent">process</span>', "",
          '<div class="bd-embed reveal"><iframe title="' + esc(B.t) + ' video" src="https://www.youtube-nocookie.com/embed/' + esc(ytId(B.youtube)) + '?rel=0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe></div>'));
      }
      if (B.video) {
        secs.push(sec(isGif(B.video) ? "In motion" : "Turntable", 'In <span class="accent">motion</span>', "",
          '<div class="bd-media reveal">' + loopMedia(B.video, B.t + " in motion", "bd-loop") + '</div>'));
      }
      if (B.gallery && B.gallery.length) {
        secs.push(sec("Gallery", 'Final <span class="accent">renders</span>', "Click any image to see it full size.",
          '<div class="bd-gallery">' + B.gallery.map(function (u, i) {
            return '<a class="reveal" href="' + esc(u) + '" data-i="' + i + '" style="transition-delay:' + (i % 3) * 70 + 'ms"><img ' + imgAttrs(u, "(max-width: 600px) 50vw, 33vw") + ' alt="' + esc(B.t) + ' render ' + (i + 1) + '" loading="lazy" /></a>';
          }).join("") + '</div>'));
      }
      var steps = (B.steps && B.steps.length) ? B.steps : DEFAULT_STEPS;
      secs.push(sec("How this piece was made", 'Stage by <span class="accent">stage</span>', "The same pipeline behind every character we ship.",
        '<ol class="process-grid">' + steps.map(function (s, i) {
          return '<li class="process-step reveal"><span class="process-num">' + pad(i + 1) + '</span><h3>' + esc(s.t || "") + '</h3><p>' + esc(s.d || "") + '</p></li>';
        }).join("") + '</ol>'));

      var descHtml = String(B.desc || "").split(/\n\s*\n/).filter(Boolean).map(function (p) { return '<p class="page-sub bd-desc">' + esc(p.trim()) + '</p>'; }).join("");
      bdPage.innerHTML =
        '<section class="page-hero page-hero--compact"><div class="container page-hero-inner"><div class="reveal">' +
          '<p class="eyebrow"><span class="eyebrow-dot"></span> <a href="./#breakdown">&larr; Breakdowns</a> / ' + esc(B.t) + '</p>' +
          '<h1 class="page-title">' + esc(B.t) + ' <span class="accent">Breakdown</span></h1>' +
          (B.sub ? '<p class="page-sub">' + esc(B.sub) + '</p>' : '') + descHtml +
          '<div class="hero-actions">' +
            (B.assetId ? '<a href="asset.html?id=' + encodeURIComponent(B.assetId) + '" class="btn btn--primary">View full asset page</a>' : '') +
            '<a href="contact.html" class="btn btn--ghost">Get a breakdown like this</a>' +
          '</div>' +
        '</div></div></section>' + secs.join("");

      // Gallery: open renders in a full-screen viewer (same look as the portfolio lightbox) instead of a new tab/download.
      if (B.gallery && B.gallery.length) {
        var gl = document.createElement("div");
        gl.className = "lightbox"; gl.setAttribute("aria-hidden", "true"); gl.setAttribute("role", "dialog"); gl.setAttribute("aria-label", "Image viewer");
        gl.innerHTML = '<button class="lightbox-close" aria-label="Close">&times;</button>' +
          (B.gallery.length > 1 ? '<button class="lightbox-nav lightbox-prev" aria-label="Previous">&lsaquo;</button><button class="lightbox-nav lightbox-next" aria-label="Next">&rsaquo;</button>' : '') +
          '<figure class="lightbox-figure"><img class="loaded" alt="" /><figcaption><span class="lightbox-title"></span></figcaption></figure>';
        document.body.appendChild(gl);
        var glImg = $("img", gl), glCap = $(".lightbox-title", gl), glPos = 0;
        var glShow = function (i) {
          glPos = (i + B.gallery.length) % B.gallery.length;
          glImg.src = B.gallery[glPos]; glImg.alt = B.t + " render " + (glPos + 1);
          glCap.textContent = B.t + (B.gallery.length > 1 ? "  ·  " + (glPos + 1) + " / " + B.gallery.length : "");
        };
        var glClose = function () { gl.classList.remove("open"); gl.setAttribute("aria-hidden", "true"); document.body.classList.remove("no-scroll"); };
        $(".bd-gallery", bdPage).addEventListener("click", function (e) {
          var a = e.target.closest("a"); if (!a) return;
          e.preventDefault();
          glShow(+a.dataset.i);
          gl.classList.add("open"); gl.setAttribute("aria-hidden", "false"); document.body.classList.add("no-scroll");
        });
        gl.addEventListener("click", function (e) {
          if (e.target === gl || e.target.closest(".lightbox-close")) glClose();
          else if (e.target.closest(".lightbox-prev")) glShow(glPos - 1);
          else if (e.target.closest(".lightbox-next")) glShow(glPos + 1);
        });
        document.addEventListener("keydown", function (e) {
          if (!gl.classList.contains("open")) return;
          if (e.key === "Escape") glClose();
          else if (e.key === "ArrowLeft") glShow(glPos - 1);
          else if (e.key === "ArrowRight") glShow(glPos + 1);
        });
      }

      // Marmoset Viewer: .mview file uploaded in /admin, rendered with Marmoset's official player.
      if (B.marmoset) {
        var mBox = $("#bdMarmoset");
        var startMarmoset = function () {
          if (!window.marmoset || !mBox) { if (mBox) mBox.innerHTML = '<p class="bd-embed-note">The Marmoset viewer could not load.</p>'; return; }
          var w = mBox.clientWidth, h = mBox.clientHeight;
          var viewer = new window.marmoset.WebViewer(w, h, B.marmoset);
          mBox.innerHTML = ""; mBox.appendChild(viewer.domRoot); viewer.loadScene();
          window.addEventListener("resize", function () { viewer.resize(mBox.clientWidth, mBox.clientHeight); });
        };
        var ms = document.createElement("script");
        ms.src = "https://viewer.marmoset.co/main/marmoset.js";
        ms.onload = startMarmoset; ms.onerror = startMarmoset;
        document.head.appendChild(ms);
      }
    }
  }

  /* ------------------------------------------------------------------
     Quote estimator (artist-days, from ESTIMATOR ranges in data.js)
     ------------------------------------------------------------------ */
  var est = $("#estimator");
  if (est && BI.ESTIMATOR) {
    var E = BI.ESTIMATOR;
    var typeSel = $("#estType");
    typeSel.innerHTML = Object.keys(E.types).map(function (k) { return '<option>' + esc(k) + '</option>'; }).join("");
    var runEstimate = function () {
      var t = E.types[typeSel.value] || {}; var style = $("#estStyle").value; var n = Math.max(1, +$("#estCount").value || 1);
      var rig = $("#estRig").checked; var variants = Math.max(0, +$("#estVariants").value || 0);
      var r = t[style] || t.realistic || [1, 2];
      var lo = r[0] * n, hi = r[1] * n;
      var isChar = /character|creature/i.test(typeSel.value);
      if (rig && isChar) { lo += E.rigging[0] * n; hi += E.rigging[1] * n; }
      if (variants) { lo += E.outfitVariant[0] * variants; hi += E.outfitVariant[1] * variants; }
      var par = Math.max(1, Math.min(E.parallelArtists || 1, n));
      var wlo = Math.max(1, Math.round(lo / par / 5)), whi = Math.max(wlo, Math.round(hi / par / 5));
      $("#estDays").textContent = lo + "–" + hi;
      $("#estWeeks").textContent = wlo + "–" + whi;
      $("#estPar").textContent = par;
      $("#estRigRow").style.display = isChar ? "" : "none";
    };
    est.addEventListener("input", runEstimate);
    est.addEventListener("submit", function (e) { e.preventDefault(); runEstimate(); track("estimate_run"); });
    runEstimate();
    var useBtn = $("#estUse");
    if (useBtn) useBtn.addEventListener("click", function () {
      var map = { realistic: "Realistic", stylized: "Stylized", handpainted: "Hand-painted" };
      if ($("#cfType")) $("#cfType").value = /prop/i.test(typeSel.value) ? "Props & weapons" : /creature/i.test(typeSel.value) ? "Creatures" : /hair/i.test(typeSel.value) ? "Hair & grooming" : "Characters";
      if ($("#cfStyle")) $("#cfStyle").value = map[$("#estStyle").value] || "";
      if ($("#cfCount")) $("#cfCount").value = $("#estCount").value + " × " + typeSel.value + ($("#estRig").checked ? ", rigged" : "");
      if ($("#cfMessage")) $("#cfMessage").value = "Estimator result: about " + $("#estDays").textContent + " artist-days (" + $("#estWeeks").textContent + " weeks with " + $("#estPar").textContent + " artists in parallel).\n\n";
      track("estimate_used");
      location.hash = "#contact";
    });
  }

  /* ------------------------------------------------------------------
     Showreel: YouTube id when configured, otherwise a portfolio image reel
     ------------------------------------------------------------------ */
  var reelBtn = $("#showreelBtn");
  var reel = $("#reelModal");
  var reelTimer = null;
  function openReel() {
    if (CFG.showreelYouTubeId && $("#videoModal")) {
      track("trailer_played", { video: "showreel" });
      $("#videoIframe").src = "https://www.youtube-nocookie.com/embed/" + CFG.showreelYouTubeId + "?autoplay=1&rel=0";
      $("#videoModal").classList.add("open"); $("#videoModal").setAttribute("aria-hidden", "false"); document.body.classList.add("no-scroll");
      return;
    }
    if (!reel) return;
    var pool = PROJECTS.slice().sort(function () { return Math.random() - 0.5; }).slice(0, 12);
    var idx = 0, img = $("#reelImg"), cap = $("#reelCap");
    var show = function () {
      var p = pool[idx % pool.length];
      img.classList.remove("kb"); void img.offsetWidth;
      img.src = p.i; img.alt = p.t; img.classList.add("kb");
      cap.textContent = p.t + " · " + CAT[p.c]; idx++;
    };
    show(); reelTimer = setInterval(show, 2800);
    reel.classList.add("open"); reel.setAttribute("aria-hidden", "false"); document.body.classList.add("no-scroll");
    track("trailer_played", { video: "image-reel" });
  }
  function closeReel() {
    if (!reel) return;
    clearInterval(reelTimer); reel.classList.remove("open"); reel.setAttribute("aria-hidden", "true"); document.body.classList.remove("no-scroll");
  }
  if (reelBtn) reelBtn.addEventListener("click", openReel);
  if (reel) {
    $("#reelClose").addEventListener("click", closeReel);
    reel.addEventListener("click", function (e) { if (e.target === reel) closeReel(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeReel(); });
  }

  /* ------------------------------------------------------------------
     Asset detail page (asset.html?id=XXXX)
     ------------------------------------------------------------------ */
  var ap = $("#assetPage");
  if (ap && PROJECTS.length) {
    var aid = (location.search.match(/[?&]id=([A-Za-z0-9]+)/) || [])[1];
    var aidx = -1; PROJECTS.forEach(function (x, i) { if (x.id === aid) aidx = i; });
    if (aidx === -1) aidx = 0;
    var P = PROJECTS[aidx];
    document.title = P.t + " | Brothers Interactive";
    $("#assetTitle").textContent = P.t; $("#assetCat").textContent = CAT[P.c] || "";
    var paras = (P.desc || "").split(/\n\n+/).filter(Boolean);
    $("#assetDesc").innerHTML = paras.length ? paras.map(function (t) { return '<p>' + esc(t).replace(/\n/g, '<br>') + '</p>'; }).join("") : '<p>Breakdown and technical details available on request.</p>';
    var all = [P.i].concat(P.imgs || []);
    $("#assetMain").src = all[0]; $("#assetMain").alt = P.t;
    $("#assetThumbs").innerHTML = all.map(function (u, i) { return '<button class="asset-thumb' + (i ? '' : ' active') + '" data-src="' + u + '" aria-label="View ' + (i + 1) + '"><img ' + imgAttrs(u, "120px") + ' alt="' + esc(P.t) + ' view ' + (i + 1) + '" loading="lazy" /></button>'; }).join("");
    $("#assetThumbs").addEventListener("click", function (e) {
      var b = e.target.closest(".asset-thumb"); if (!b) return;
      $("#assetMain").src = b.dataset.src; $$(".asset-thumb").forEach(function (x) { x.classList.toggle("active", x === b); });
    });
    $("#assetTags").innerHTML = (P.tags || []).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join("");
    var commissionBtn = $("#assetCommission");
    if (commissionBtn) commissionBtn.href = "contact.html?ref=" + encodeURIComponent(P.id);
    var srcUrl = normalizeUrl(P.src);
    /* Seed data filled every piece's "src" with a https://brothersinteractive.com/projects/<id>
       placeholder (no such route exists on this site) — treat that as "not set yet" and send
       visitors to the real ArtStation profile instead of a dead link, until the CMS's optional
       "Original page link" field is filled in with that piece's actual page. */
    $("#assetSrc").href = (srcUrl && srcUrl.indexOf(BASE) !== 0) ? srcUrl : "https://www.artstation.com/brothersinteractive";
    var view3d = $("#asset3d");
    if (view3d) {
      if (P.sketchfab) { view3d.hidden = false; $("iframe", view3d).src = "https://sketchfab.com/models/" + P.sketchfab + "/embed?autostart=0&ui_theme=dark"; }
      else view3d.hidden = true;
    }
    var projName = P.project || (P.c === "lost-in-random" ? "Lost in Random" : P.c === "mid-night-walk" ? "The Midnight Walk" : /fanart/i.test(P.t) ? "Fan art / studio piece" : "Studio work");
    var specs = [["Category", CAT[P.c] || ""], ["Project", projName], ["Software", P.software && P.software.length ? P.software.join(", ") : "On request"], ["Poly count", P.polys || "On request"], ["Textures", P.textures || "On request"]];
    $("#assetSpecs").innerHTML = specs.map(function (s) { return '<li><span>' + esc(s[0]) + '</span><strong>' + esc(s[1]) + '</strong></li>'; }).join("");
    var prevP = PROJECTS[(aidx - 1 + PROJECTS.length) % PROJECTS.length], nextP = PROJECTS[(aidx + 1) % PROJECTS.length];
    $("#assetPrev").href = "asset.html?id=" + prevP.id; $("#assetPrev").textContent = "← " + prevP.t;
    $("#assetNext").href = "asset.html?id=" + nextP.id; $("#assetNext").textContent = nextP.t + " →";
    var rel = PROJECTS.filter(function (x) { return x.c === P.c && x.id !== P.id; }).slice(0, 4);
    $("#assetRelated").innerHTML = rel.map(function (x) {
      var ar = x.w && x.h ? ' style="aspect-ratio:' + x.w + '/' + x.h + '"' : '';
      return '<a class="work-card ripple-host" href="asset.html?id=' + x.id + '"' + ar + '><img ' + imgAttrs(x.i, "(max-width: 600px) 50vw, 25vw") + ' alt="' + esc(x.t) + '" loading="lazy" /><div class="work-info"><span class="work-cat">' + esc(CAT[x.c]) + '</span><span class="work-title">' + esc(x.t) + '</span></div></a>';
    }).join("");
  }

  /* ------------------------------------------------------------------
     Contact form pre-fill when arriving from an asset page's
     "Commission similar work" link (contact.html?ref=<project id>)
     ------------------------------------------------------------------ */
  var refBanner = $("#cfRefBanner");
  if (refBanner && PROJECTS.length) {
    var refId = (location.search.match(/[?&]ref=([^&]+)/) || [])[1];
    var refP = null;
    if (refId) { refId = decodeURIComponent(refId); PROJECTS.forEach(function (x) { if (x.id === refId) refP = x; }); }
    if (refP) {
      var CAT_TYPE = {
        "realistic-humans": "Characters", "stylized-human": "Characters", "mid-night-walk": "Characters", "lost-in-random": "Characters", "modular-chr-skins": "Characters",
        "realistic-creatures": "Creatures", "stylized-creature": "Creatures",
        "realistic-hairs": "Hair & grooming", "props": "Props & weapons", "weapons": "Props & weapons"
      };
      var CAT_STYLE = {
        "realistic-humans": "Realistic", "realistic-creatures": "Realistic", "realistic-hairs": "Realistic",
        "stylized-human": "Stylized", "stylized-creature": "Stylized",
        "mid-night-walk": "Hand-painted", "lost-in-random": "Hand-painted"
      };
      $("#cfRefImg").src = refP.i; $("#cfRefImg").alt = refP.t;
      $("#cfRefTitle").textContent = refP.t;
      $("#cfRefCat").textContent = CAT[refP.c] || "";
      refBanner.hidden = false;
      var cfType = $("#cfType"), cfStyle = $("#cfStyle"), cfMessage = $("#cfMessage");
      if (cfType && CAT_TYPE[refP.c]) cfType.value = CAT_TYPE[refP.c];
      if (cfStyle && CAT_STYLE[refP.c]) cfStyle.value = CAT_STYLE[refP.c];
      if (cfMessage) cfMessage.value = 'Referencing your piece "' + refP.t + '" (' + (CAT[refP.c] || "") + ') — we\'re looking for something in a similar style.\n\n';
      $("#cfRefClose").addEventListener("click", function () { refBanner.hidden = true; });
    }
  }

  /* ------------------------------------------------------------------
     Credits + press page
     ------------------------------------------------------------------ */
  var creditsList = $("#creditsList");
  if (creditsList) {
    creditsList.innerHTML = GAMES.map(function (g) {
      return '<li class="credit-card reveal"><img src="' + g.i + '" alt="' + esc(g.t) + ' key art" loading="lazy" />' +
        '<div><span class="game-studio">' + esc(g.s || "") + '</span><h3>' + esc(g.t) + '</h3>' +
        '<p>Character and asset production support.</p>' +
        '<a href="https://www.youtube.com/watch?v=' + esc(ytId(g.yt)) + '" target="_blank" rel="noopener">Watch trailer &rarr;</a></div></li>';
    }).join("");
    var pl = $("#pressList");
    if (pl) pl.innerHTML = PRESS.length
      ? PRESS.map(function (p) { return '<li class="role"><div><strong>' + esc(p.t) + '</strong><span>' + esc(p.d || "") + '</span></div><p>' + esc(p.src || "") + '</p>' + (p.url ? '<a href="' + esc(normalizeUrl(p.url)) + '" target="_blank" rel="noopener">Read &rarr;</a>' : '') + '</li>'; }).join("")
      : '<li class="role role--empty">Press mentions, ArtStation features and awards will appear here once added via /admin.</li>';
  }

  /* ------------------------------------------------------------------
     Motion: image fade-in, ripples, 3D tilt, hero parallax, cursor glow
     ------------------------------------------------------------------ */
  var motionOK = !(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var finePointer = window.matchMedia && window.matchMedia("(pointer: fine)").matches;

  // images fade in as they finish loading (works for images added later too)
  function markLoaded(img) { img.classList.add("loaded"); }
  document.addEventListener("load", function (e) { if (e.target.tagName === "IMG") markLoaded(e.target); }, true);
  document.addEventListener("error", function (e) { if (e.target.tagName === "IMG") markLoaded(e.target); }, true);
  $$("img").forEach(function (img) { if (img.complete) markLoaded(img); });

  // ripple on click for buttons, chips and cards
  document.addEventListener("pointerdown", function (e) {
    if (!motionOK || !(e.target instanceof Element)) return;
    var host = e.target.closest(".btn, .filter-btn, .work-card, .game-card, .case-media, .theme-opt, .team-card, .value-card, .service-card, .blog-card, .credit-card");
    if (!host) return;
    host.classList.add("ripple-host");
    var r = host.getBoundingClientRect();
    var size = Math.max(r.width, r.height) * 2;
    var s = document.createElement("span");
    s.className = "ripple";
    s.style.cssText = "left:" + (e.clientX - r.left) + "px;top:" + (e.clientY - r.top) + "px;width:" + size + "px;height:" + size + "px;";
    host.appendChild(s);
    setTimeout(function () { s.remove(); }, 700);
  });

  // 3D tilt following the cursor
  if (motionOK && finePointer) {
    var tiltSel = ".work-card, .game-card, .service-card, .team-card, .value-card, .blog-card, .process-step, .credit-card";
    document.addEventListener("pointermove", function (e) {
      if (!(e.target instanceof Element)) return;
      var el = e.target.closest(tiltSel);
      if (!el || document.body.classList.contains("no-scroll")) return;
      var r = el.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      el.classList.add("tilt");
      el.style.transform = "perspective(900px) rotateX(" + (-py * 8).toFixed(2) + "deg) rotateY(" + (px * 10).toFixed(2) + "deg) translateY(-4px)";
    });
    document.addEventListener("pointerout", function (e) {
      if (!(e.target instanceof Element)) return;
      var el = e.target.closest(tiltSel);
      if (el && !el.contains(e.relatedTarget)) { el.style.transform = ""; el.classList.remove("tilt"); }
    });
  }

  // hero cards drift with the cursor
  var heroVisual = $(".hero-visual");
  if (heroVisual && motionOK && finePointer) {
    var heroCards = $$(".hero-card", heroVisual);
    document.addEventListener("pointermove", function (e) {
      var r = heroVisual.getBoundingClientRect();
      if (r.bottom < 0) return;
      var px = (e.clientX / window.innerWidth - 0.5), py = (e.clientY / window.innerHeight - 0.5);
      heroCards.forEach(function (c, i) {
        var depth = (i + 1) * 8;
        c.style.transform = "translate(" + (px * depth).toFixed(1) + "px," + (py * depth).toFixed(1) + "px)";
      });
    });
  }

  // soft cursor glow
  if (motionOK && finePointer) {
    var glow = document.createElement("div"); glow.className = "cursor-glow"; document.body.appendChild(glow);
    document.addEventListener("pointermove", function (e) { glow.style.left = e.clientX + "px"; glow.style.top = e.clientY + "px"; glow.classList.add("on"); });
    document.addEventListener("pointerleave", function () { glow.classList.remove("on"); });
  }

  // artist cursor: a paintbrush that follows the pointer, with a lagging ring and hover states
  if (motionOK && finePointer) {
    var cur = document.createElement("div");
    cur.className = "art-cursor";
    cur.innerHTML =
      '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true">' +
        '<path d="M2 2c4 .4 8.5 3 10.5 7.5L8 14C3.5 12 1.2 7 2 2z" class="c-tip"/>' +
        '<path d="M11 11.5 27 27.5c1.4 1.4 1.4 3.2 0 4.4-1.2 1.2-3 1.2-4.4 0L6.8 16z" class="c-handle"/>' +
        '<path d="M11 11.5 14.5 15" class="c-band"/>' +
        '<circle cx="27.5" cy="28" r="1.6" class="c-dot"/>' +
      '</svg><span class="label"></span>';
    var ring = document.createElement("div");
    ring.className = "art-cursor-ring";
    document.body.appendChild(ring); document.body.appendChild(cur);
    document.body.classList.add("art-cursor-on");
    var mx = -100, my = -100, rx = -100, ry = -100, shown = false, ringRaf = 0;
    // The lagging ring eases toward the pointer and stops its frame loop once it has caught up,
    // so an idle page isn't redrawing 60 times a second; the next pointer move restarts it.
    function ringLoop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
      ringRaf = (Math.abs(mx - rx) + Math.abs(my - ry) > 0.3) ? requestAnimationFrame(ringLoop) : 0;
    }
    document.addEventListener("pointermove", function (e) {
      mx = e.clientX; my = e.clientY;
      cur.style.transform = "translate(" + (mx - 2) + "px," + (my - 2) + "px)";
      if (!shown) { shown = true; rx = mx; ry = my; cur.classList.add("on"); ring.classList.add("on"); }
      if (!ringRaf) ringRaf = requestAnimationFrame(ringLoop);
    });
    document.addEventListener("pointerover", function (e) {
      var t = e.target;
      if (!(t instanceof Element)) return;
      if (t.closest("input:not([type=range]):not([type=checkbox]), textarea, select")) { cur.classList.add("hidden"); ring.classList.add("hidden"); return; }
      var state = "", label = "";
      if (t.closest(".compare-stage")) { state = "zoom"; label = "Drag"; }
      else if (t.closest(".work-card, .case-thumb, .asset-thumb, .style-samples a, .lightbox-figure img")) { state = "zoom"; label = "View"; }
      else if (t.closest(".game-card, .case-media, #showreelBtn")) { state = "zoom"; label = "Play"; }
      else if (t.closest("a, button, [role=button], label, summary, .theme-opt")) { state = "hover"; }
      cur.className = "art-cursor on" + (state ? " " + state : "");
      ring.className = "art-cursor-ring on" + (state ? " " + state : "");
      cur.querySelector(".label").textContent = label;
    });
    document.addEventListener("pointerdown", function () { cur.classList.add("down"); });
    document.addEventListener("pointerup", function () { cur.classList.remove("down"); });
    document.documentElement.addEventListener("mouseleave", function () { cur.classList.remove("on"); ring.classList.remove("on"); });
    document.documentElement.addEventListener("mouseenter", function () { cur.classList.add("on"); ring.classList.add("on"); });
  }

  /* ------------------------------------------------------------------
     Theme switcher — sets data-theme on <html>, remembers the choice
     ------------------------------------------------------------------ */
  var THEMES = ["midnight", "arctic", "ocean", "steel", "aurora", "desert"];
  var switcher = $("#themeSwitcher");
  var themeToggle = $("#themeToggle");
  var themeOpts = $$(".theme-opt");

  function applyTheme(name, persist) {
    if (THEMES.indexOf(name) === -1) name = "midnight";
    if (name === "midnight") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", name);
    themeOpts.forEach(function (b) {
      var on = b.dataset.theme === name;
      b.classList.toggle("active", on);
      b.setAttribute("aria-checked", String(on));
    });
    if (persist) { try { localStorage.setItem("bi-theme", name); } catch (err) {} track("theme_changed", { theme: name }); }
  }
  function closeThemePanel() {
    switcher.classList.remove("open");
    themeToggle.setAttribute("aria-expanded", "false");
  }

  var saved = null;
  try { saved = localStorage.getItem("bi-theme"); } catch (err) {}
  // ?theme=ocean in the URL overrides the saved choice (handy for sharing a specific look)
  var fromUrl = (window.location.search.match(/[?&]theme=([a-z]+)/) || [])[1];
  if (fromUrl && THEMES.indexOf(fromUrl) !== -1) applyTheme(fromUrl, true);
  else applyTheme(saved || "midnight", false);

  themeToggle.addEventListener("click", function () {
    var open = switcher.classList.toggle("open");
    themeToggle.setAttribute("aria-expanded", String(open));
  });
  themeOpts.forEach(function (b) {
    b.addEventListener("click", function () { applyTheme(b.dataset.theme, true); closeThemePanel(); });
  });
  document.addEventListener("click", function (e) { if (!switcher.contains(e.target)) closeThemePanel(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeThemePanel(); });

  /* ------------------------------------------------------------------
     Job applications (homepage #careers section) — handled by a Google Form.
     The form link is set in /admin > Settings > "Careers application form (Google Form link)".
     Until it's set, the button is hidden and an "opening soon" note shows instead.
     ------------------------------------------------------------------ */
  var applyBtn = $("#applyFormBtn");
  if (applyBtn) {
    var formUrl = String(CFG.careersFormUrl || "").trim();
    if (/^https?:\/\//i.test(formUrl)) {
      applyBtn.href = formUrl;
      applyBtn.addEventListener("click", function () { track("application_form_opened"); });
    } else {
      applyBtn.hidden = true;
      $("#applyFormSoon").hidden = false;
    }
  }

  /* ------------------------------------------------------------------
     Hero visual — random portfolio pieces on every load, each card
     framed to that image's real aspect ratio (no cropping/cutting)
     ------------------------------------------------------------------ */
  var heroVisual = $(".hero-visual");
  if (heroVisual && PROJECTS.length) {
    var heroSlots = [
      { el: $(".hero-card--main", heroVisual), eager: true },
      { el: $(".hero-card--a", heroVisual), eager: false },
      { el: $(".hero-card--b", heroVisual), eager: false }
    ].filter(function (s) { return s.el; });

    var heroPool = PROJECTS.filter(function (p) { return p.i && p.w && p.h; })
      .sort(function () { return Math.random() - 0.5; });

    heroSlots.forEach(function (slot, i) {
      var p = heroPool[i % heroPool.length];
      if (!p) return;
      var img = $("img", slot.el), tag = $(".hero-card-tag", slot.el);
      if (img) { img.src = p.i; img.alt = p.t; img.loading = slot.eager ? "eager" : "lazy"; }
      if (tag) tag.textContent = CAT[p.c] || p.t;
      slot.el.style.aspectRatio = p.w + " / " + p.h;
    });

    /* Cluster the cards tightly regardless of each image's height: chain
       card A off the main card's real bottom, and card B off card A's,
       instead of relying on fixed percentages tuned for one aspect ratio.
       Desktop layout only — the mobile breakpoint uses its own square grid. */
    if (window.innerWidth > 900) {
      var mainEl = heroSlots[0] && heroSlots[0].el;
      var aEl = heroSlots[1] && heroSlots[1].el;
      var bEl = heroSlots[2] && heroSlots[2].el;
      if (mainEl) {
        var vTop = heroVisual.getBoundingClientRect().top;
        var mTop = mainEl.getBoundingClientRect().top - vTop;
        var mHeight = mainEl.getBoundingClientRect().height;
        var bottomMost = mTop + mHeight;

        if (aEl) {
          var aTop = mTop + mHeight * 0.4;
          aEl.style.top = aTop + "px";
          aEl.style.bottom = "auto";
          var aHeight = aEl.getBoundingClientRect().height;
          bottomMost = Math.max(bottomMost, aTop + aHeight);

          if (bEl) {
            var bTop = aTop + aHeight * 0.5;
            bEl.style.top = bTop + "px";
            bEl.style.bottom = "auto";
            bottomMost = Math.max(bottomMost, bTop + bEl.getBoundingClientRect().height);
          }
        } else if (bEl) {
          var bTopAlt = mTop + mHeight * 0.5;
          bEl.style.top = bTopAlt + "px";
          bEl.style.bottom = "auto";
          bottomMost = Math.max(bottomMost, bTopAlt + bEl.getBoundingClientRect().height);
        }

        heroVisual.style.minHeight = Math.ceil(bottomMost + 24) + "px";
      }
    }
  }

  /* ------------------------------------------------------------------
     Careers hero images — rendered from data/careers-hero.json (/admin > Careers Page Images).
     One image at a time, 10s each, soft cross-fade.
     ------------------------------------------------------------------ */
  var careersSlides = $("#careersSlides");
  var CAREERS_HERO = loadList("careers-hero", []).filter(function (x) { return x && x.img; });
  if (careersSlides && CAREERS_HERO.length) {
    careersSlides.innerHTML = CAREERS_HERO.map(function (x, i) {
      return '<div class="careers-slide' + (i ? "" : " is-active") + '"><img src="' + esc(x.img) + '" alt="' + esc(x.alt || "") + '" /></div>';
    }).join("");
  }
  if (careersSlides) {
    var cSlides = careersSlides.querySelectorAll(".careers-slide"), cIdx = 0;
    if (cSlides.length > 1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInterval(function () {
        if (document.hidden) return; // background tab: don't queue fades that all replay at once on return
        cSlides[cIdx].classList.remove("is-active");
        cIdx = (cIdx + 1) % cSlides.length;
        cSlides[cIdx].classList.add("is-active");
      }, 10000);
    }
  }

  /* ------------------------------------------------------------------
     Team grid (homepage #team section) — rendered from data/team.json
     ------------------------------------------------------------------ */
  var teamGrid = $("#teamGrid");
  if (teamGrid && TEAM.length) {
    teamGrid.innerHTML = TEAM.map(function (m) {
      var photo = m.photo ? '<img src="' + m.photo + '" alt="' + esc(m.name) + '" loading="lazy" />' : "";
      var tags = (m.tags || []).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("");
      var links = (m.links || []).map(function (l) {
        var href = normalizeUrl(l.url);
        var external = /^https?:\/\//i.test(href);
        return '<a href="' + esc(href) + '"' + (external ? ' target="_blank" rel="noopener"' : "") + ">" + esc(l.label) + "</a>";
      }).join("");
      return (
        '<article class="team-card reveal">' +
          '<div class="team-photo" data-initials="' + esc(m.initials || "") + '">' + photo + '</div>' +
          '<div class="team-body">' +
            "<h3>" + esc(m.name) + "</h3>" +
            '<span class="team-role">' + esc(m.role || "") + "</span>" +
            "<p>" + esc(m.bio || "") + "</p>" +
            (tags ? '<ul class="team-tags">' + tags + "</ul>" : "") +
            (links ? '<div class="team-links">' + links + "</div>" : "") +
          "</div>" +
        "</article>"
      );
    }).join("");
  }

  /* ------------------------------------------------------------------
     Footer year + late reveal pass for elements rendered above
     ------------------------------------------------------------------ */
  $$("#year, .year").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  watchReveals();

  /* ------------------------------------------------------------------
     Section links (nav "Careers", "Team", index.html#careers from other pages...):
     the page is built from data after load and images above keep loading, so a plain
     #hash jump lands in the wrong place. Scroll under the fixed header ourselves, then
     re-check a few times as the layout settles.
     ------------------------------------------------------------------ */
  // Only the LATEST jump may correct itself: every new nav click, or any manual scroll
  // (wheel, touch, keys, scrollbar drag), cancels the follow-up checks of earlier jumps.
  var sectionJob = 0;
  ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (t) {
    window.addEventListener(t, function (e) {
      if (t === "mousedown" && e.target.closest && e.target.closest('a[href*="#"]')) return; // the nav click itself
      sectionJob++;
    }, { passive: true });
  });
  function goToSection(id, smooth) {
    var target = id && document.getElementById(id);
    if (!target) return false;
    var job = ++sectionJob;
    var headerH = header ? header.offsetHeight : 0;
    var offBy = function () { return target.getBoundingClientRect().top - headerH; };
    var place = function (behavior) {
      window.scrollTo({ top: Math.max(0, offBy() + (window.scrollY || window.pageYOffset) + 1), behavior: behavior });
    };
    place(smooth ? "smooth" : "instant");
    // Images/3D above may still be loading and push the section down. Once the scroll has
    // come to rest, nudge it back into place — never mid-animation, never after a newer jump.
    var lastY = -1, checks = 0;
    (function settle() {
      if (job !== sectionJob || checks++ > 12) return;   // superseded, or ~4s passed
      var y = window.scrollY || window.pageYOffset;
      if (y === lastY && Math.abs(offBy()) > 4) place("instant");
      lastY = y;
      setTimeout(settle, 300);
    })();
    return true;
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href*="#"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var url = new URL(a.getAttribute("href"), location.href);
    if (url.pathname !== location.pathname || !url.hash || url.hash === "#") return;
    if (!document.getElementById(url.hash.slice(1))) return;
    e.preventDefault();
    history.pushState(null, "", url.hash);
    goToSection(url.hash.slice(1), true);
  });
  if (location.hash.length > 1) {
    var hashId = decodeURIComponent(location.hash.slice(1));
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    goToSection(hashId, false);
    var jobAtStart = sectionJob;
    // re-align once everything has loaded — but only if the visitor hasn't clicked/scrolled elsewhere since
    window.addEventListener("load", function () { if (sectionJob === jobAtStart) goToSection(hashId, false); });
  }
}

/* ------------------------------------------------------------------
   Loader: fetch every data file in parallel (instead of one blocking
   request after another), then run the site. "no-cache" makes the browser
   re-check each file with the server (a tiny 304 when unchanged), so /admin
   edits still show on the next refresh without re-downloading everything.
   ------------------------------------------------------------------ */
(function () {
  var names = ["portfolio", "games", "cases", "posts", "testimonials", "roles", "pairs", "clients", "press", "team", "hero-showcase", "config", "hero", "breakdowns", "careers-hero"];
  if (document.getElementById("categoryGrid")) names.push("category-tiles");
  var store = window.__BI_JSON = {};
  if (!window.fetch || !window.Promise) { siteMain(); return; }
  Promise.all(names.map(function (n) {
    return fetch("data/" + n + ".json", { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { store[n] = j; }, function () { store[n] = null; });
  })).then(function () { siteMain(); });
})();
