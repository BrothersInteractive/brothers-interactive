/* =====================================================================
   "Find on this page" for the content editor (/admin).
   Sveltia's own search finds whole entries; this finds a word INSIDE the open page, including text typed
   in the fields (which the browser's Ctrl+F cannot see), highlights every match and jumps between them.
   Enter / ↓ = next, Shift+Enter / ↑ = previous, Esc = clear. Ctrl+Shift+F puts the cursor in the box.
   ===================================================================== */
(function () {
  "use strict";
  var supportsHighlight = typeof CSS !== "undefined" && CSS.highlights && typeof Highlight !== "undefined";
  var box, input, counter, hits = [], current = -1, timer = 0, observer = null, lastQuery = "";

  function build() {
    if (box && document.body.contains(box)) return;
    box = document.createElement("div");
    box.className = "bi-find";
    box.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10" cy="10" r="6.5"/><path d="M15 15l5.5 5.5"/></svg>' +
      '<input type="search" placeholder="Find on this page" aria-label="Find on this page" />' +
      '<span class="bi-find-count" aria-live="polite"></span>' +
      '<button type="button" data-step="-1" aria-label="Previous match" title="Previous (Shift+Enter)">&#8593;</button>' +
      '<button type="button" data-step="1" aria-label="Next match" title="Next (Enter)">&#8595;</button>';
    document.body.appendChild(box);
    input = box.querySelector("input");
    counter = box.querySelector(".bi-find-count");
    input.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(function () { search(true); }, 180); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); step(e.shiftKey ? -1 : 1); }
      else if (e.key === "ArrowDown") { e.preventDefault(); step(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); step(-1); }
      else if (e.key === "Escape") { input.value = ""; search(false); input.blur(); }
    });
    box.addEventListener("click", function (e) { var b = e.target.closest("button[data-step]"); if (b) step(+b.dataset.step); });
  }

  function visible(el) {
    if (!el || !el.getClientRects().length) return false;
    var cs = getComputedStyle(el);
    return cs.visibility !== "hidden" && cs.display !== "none";
  }

  function clearMarks() {
    if (supportsHighlight) { CSS.highlights.delete("bi-find"); CSS.highlights.delete("bi-find-now"); }
    document.querySelectorAll(".bi-find-field, .bi-find-field-now").forEach(function (el) { el.classList.remove("bi-find-field", "bi-find-field-now"); });
  }

  /* A match inside a closed box: the editor keeps closed boxes on the page but hidden, and each box's
     open/close button names the part it shows (aria-controls) and says whether it is open (aria-expanded).
     Returns the buttons to click to reveal el, outermost box first, or [] if el is hidden for another reason. */
  function openersFor(el) {
    var list = [];
    for (var a = el; a && a !== document.body; a = a.parentElement) {
      var btn = null;
      if (a.id) btn = document.querySelector('[aria-controls~="' + CSS.escape(a.id) + '"][aria-expanded="false"]');
      if (!btn && a.classList && a.classList.contains("collapsed") && a.parentElement) {
        btn = a.parentElement.querySelector(':scope > [aria-expanded="false"], :scope > * > [aria-expanded="false"]');
      }
      if (btn && list.indexOf(btn) === -1) list.unshift(btn);
    }
    return list;
  }

  // Every piece of text (as ranges) and every field whose typed value contains the word, in page order,
  // including ones inside closed boxes (those carry the buttons that open them)
  function collect(q) {
    var out = [], ql = q.toLowerCase();
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var p = n.parentElement;
        if (!p || box.contains(p) || /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|OPTION)$/.test(p.tagName)) return NodeFilter.FILTER_REJECT;
        return n.nodeValue.toLowerCase().indexOf(ql) === -1 ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT;
      }
    });
    var n;
    while ((n = walker.nextNode())) {
      var openers = visible(n.parentElement) ? null : openersFor(n.parentElement);
      if (openers && !openers.length) continue;   // hidden, and not by a closed box: skip
      var text = n.nodeValue.toLowerCase(), i = text.indexOf(ql);
      while (i !== -1) {
        var r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + q.length);
        out.push({ range: r, node: n.parentElement, openers: openers });
        i = text.indexOf(ql, i + q.length);
      }
    }
    document.querySelectorAll("input:not([type=checkbox]):not([type=radio]):not([type=hidden]), textarea, [contenteditable=true]").forEach(function (f) {
      if (box.contains(f)) return;
      var openers = visible(f) ? null : openersFor(f);
      if (openers && !openers.length) return;
      var v = f.isContentEditable ? "" : String(f.value || "");   // contenteditable text is already in the walk above
      if (v && v.toLowerCase().indexOf(ql) !== -1) out.push({ field: f, node: f, openers: openers });
    });
    out.sort(function (a, b) {
      if (a.node === b.node) return 0;
      return a.node.compareDocumentPosition(b.node) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    });
    return out;
  }

  function paint() {
    clearMarks();
    var all = [], now = [];
    hits.forEach(function (h, i) {
      if (h.range) (i === current ? now : all).push(h.range);
      else h.field.classList.add(i === current ? "bi-find-field-now" : "bi-find-field");
    });
    if (supportsHighlight) {
      var make = function (ranges) { var hl = new Highlight(); ranges.forEach(function (r) { hl.add(r); }); return hl; };   // Highlight takes ranges one by one, not an array
      if (all.length) CSS.highlights.set("bi-find", make(all));
      if (now.length) CSS.highlights.set("bi-find-now", make(now));
    }
    counter.textContent = input.value.trim() ? (hits.length ? (current + 1) + " of " + hits.length : "No matches") : "";
    box.classList.toggle("bi-find--none", !!input.value.trim() && !hits.length);
  }

  // Go to the current match; if it sits in closed boxes, open them first, then find it again and go there
  function jump() {
    var h = hits[current]; if (!h) return;
    if (h.openers && h.openers.length) {
      h.openers.forEach(function (b) { if (b.getAttribute("aria-expanded") === "false") b.click(); });
      var keep = current;
      setTimeout(function () {
        hits = collect(input.value.trim());
        current = Math.min(keep, hits.length - 1);
        paint();
        var again = hits[current];
        if (again && !(again.openers && again.openers.length)) (again.field || again.node).scrollIntoView({ block: "center", behavior: "smooth" });
      }, 220);
      return;
    }
    (h.field || h.node).scrollIntoView({ block: "center", behavior: "smooth" });
  }

  function search(goFirst) {
    var q = input.value.trim();
    lastQuery = q;
    if (!q) { hits = []; current = -1; paint(); return; }
    hits = collect(q);
    if (goFirst || current >= hits.length) current = hits.length ? 0 : -1;
    paint();
    if (goFirst) jump();
  }

  function step(d) {
    if (!input.value.trim()) { input.focus(); return; }
    if (input.value.trim() !== lastQuery || !hits.length) search(false);
    if (!hits.length) return;
    current = (current + d + hits.length) % hits.length;
    paint(); jump();
  }

  // The editor redraws as you open boxes or switch pages: keep the box present and the marks fresh
  function watch() {
    if (observer) return;
    observer = new MutationObserver(function (list) {
      if (box && !document.body.contains(box)) build();
      if (!input || !input.value.trim()) return;
      for (var i = 0; i < list.length; i++) if (!box.contains(list[i].target)) { clearTimeout(timer); timer = setTimeout(function () { search(false); }, 300); return; }
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.shiftKey && (e.key === "F" || e.key === "f")) { e.preventDefault(); build(); input.focus(); input.select(); }
  });

  var css = document.createElement("style");
  css.textContent =
    ".bi-find{position:fixed;top:64px;right:20px;z-index:2147483000;display:flex;align-items:center;gap:6px;padding:6px 8px 6px 12px;" +
    "background:#fff;border:1px solid #c9ced8;border-radius:999px;box-shadow:0 6px 20px rgba(0,0,0,.15);font:14px/1.2 system-ui,'Segoe UI',sans-serif}" +
    ".bi-find svg{width:16px;height:16px;fill:none;stroke:#6b7280;stroke-width:2;stroke-linecap:round;flex:none}" +
    ".bi-find input{border:0;outline:0;width:190px;font:inherit;background:transparent;color:#111}" +
    ".bi-find-count{color:#6b7280;font-size:12px;white-space:nowrap;min-width:0}" +
    ".bi-find--none .bi-find-count{color:#c2410c}" +
    ".bi-find button{border:0;background:#eef1f6;color:#374151;width:26px;height:26px;border-radius:50%;cursor:pointer;font-size:14px;line-height:1}" +
    ".bi-find button:hover{background:#d4af37;color:#160f00}" +
    "::highlight(bi-find){background:#fde68a;color:#111}" +
    "::highlight(bi-find-now){background:#f59e0b;color:#111}" +
    ".bi-find-field{outline:2px solid #fbbf24 !important;outline-offset:2px}" +
    ".bi-find-field-now{outline:3px solid #f59e0b !important;outline-offset:2px;box-shadow:0 0 0 6px rgba(245,158,11,.25) !important}";
  document.head.appendChild(css);

  function start() { build(); watch(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
