/* "Collage crop" field for /admin (Portfolio pieces): the piece's collage picture with a box you drag over the
   part the homepage tile should show. The box keeps the tile's shape (square, wide 2:1 or tall 1:2, from the
   field's `ratio` in config.yml) and the value is "x,y,w,h" in % of the picture, saved with the piece by the
   normal /admin Save. The build cuts that part out as the tile's picture (tools/build.js, makeThumbs).
   mountCollageCrop() is plain DOM so it can be tested on its own; the bottom of the file registers it with
   Sveltia CMS as the "collagecrop" field type. */
(function () {
  var CSS =
    ".bi-crop{font:14px/1.45 system-ui,'Segoe UI',sans-serif}" +
    ".bi-crop-row{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-start}" +
    ".bi-crop-stage{position:relative;display:inline-block;max-width:100%;cursor:crosshair;border-radius:6px;overflow:hidden;user-select:none;touch-action:none;background:#0e1424}" +
    ".bi-crop-stage img{display:block;max-width:100%;max-height:340px;pointer-events:none}" +
    ".bi-crop-box{position:absolute;border:2px solid #d4af37;box-shadow:0 0 0 9999px rgba(0,0,0,.55);cursor:move}" +
    ".bi-crop-box[hidden]{display:none}" +
    ".bi-crop-grip{position:absolute;width:16px;height:16px;right:-9px;bottom:-9px;background:#d4af37;border-radius:3px;cursor:nwse-resize}" +
    ".bi-crop-tile{position:relative;overflow:hidden;border-radius:6px;background:#0e1424;flex:none}" +
    ".bi-crop-tile img{position:absolute;max-width:none}" +
    ".bi-crop-side{display:flex;flex-direction:column;gap:8px;align-items:flex-start}" +
    ".bi-crop-val{opacity:.8;font-size:12px}" +
    ".bi-crop-btn{border:1px solid currentColor;background:none;color:inherit;border-radius:999px;padding:5px 12px;font:600 12px system-ui;cursor:pointer;opacity:.85}" +
    ".bi-crop-btn:hover{opacity:1;border-color:#d4af37;color:#d4af37}" +
    ".bi-crop-msg{opacity:.75;font-size:12px;margin:6px 0 0}";
  function addCss() {
    if (document.getElementById("biCropCss")) return;
    var st = document.createElement("style"); st.id = "biCropCss"; st.textContent = CSS; document.head.appendChild(st);
  }
  function parse(v) { var n = String(v || "").split(",").map(Number); return n.length === 4 && n.every(isFinite) && n[2] > 0 && n[3] > 0 ? n : null; }
  function text(c) { return c ? c.map(function (v) { return Math.round(v * 10) / 10; }).join(",") : ""; }

  /* el: where to draw. opts: { ratio: 1 | 2 | 0.5, src: picture url, value: "x,y,w,h" or "", onChange(text) } */
  function mountCollageCrop(el, opts) {
    addCss();
    var ratio = +opts.ratio || 1, crop = parse(opts.value), onChange = opts.onChange || function () {};
    var tw = ratio >= 1 ? 160 : 80, th = ratio >= 1 ? Math.round(160 / ratio) : 160;
    el.innerHTML =
      '<div class="bi-crop"><div class="bi-crop-row">' +
        '<div class="bi-crop-stage"><img alt="" /><div class="bi-crop-box" hidden><i class="bi-crop-grip"></i></div></div>' +
        '<div class="bi-crop-side"><div class="bi-crop-tile" style="width:' + tw + 'px;height:' + th + 'px"><img alt="" /></div>' +
          '<span class="bi-crop-val"></span><button type="button" class="bi-crop-btn">Clear (whole picture)</button></div>' +
      '</div><p class="bi-crop-msg"></p></div>';
    var stage = el.querySelector(".bi-crop-stage"), big = stage.querySelector("img"), box = el.querySelector(".bi-crop-box");
    var tile = el.querySelector(".bi-crop-tile"), timg = tile.querySelector("img"), val = el.querySelector(".bi-crop-val"), msg = el.querySelector(".bi-crop-msg");
    var src = "";
    function draw() {
      box.hidden = !crop;
      if (crop) { box.style.left = crop[0] + "%"; box.style.top = crop[1] + "%"; box.style.width = crop[2] + "%"; box.style.height = crop[3] + "%"; }
      val.textContent = crop ? "Crop: " + text(crop) : "No crop: the tile shows the middle of the whole picture.";
      var nw = big.naturalWidth, nh = big.naturalHeight; if (!nw) return;
      var c = crop || [0, 0, 100, 100], cx = nw * c[0] / 100, cy = nh * c[1] / 100, cw = nw * c[2] / 100, ch = nh * c[3] / 100, s = Math.max(tw / cw, th / ch);
      timg.style.width = nw * s + "px"; timg.style.height = nh * s + "px";
      timg.style.left = (tw / 2 - (cx + cw / 2) * s) + "px"; timg.style.top = (th / 2 - (cy + ch / 2) * s) + "px";
    }
    function setSrc(u) {
      if (!u) { msg.textContent = "Add the piece's Main image first."; return; }
      if (u === src) return;
      src = u; big.onload = draw; big.src = u; timg.src = u;
      msg.textContent = "Drag on the picture to choose what the tile shows. Drag inside the box to move it, or its gold corner to resize. Then Save the piece as usual.";
    }
    function pct(e) { var r = big.getBoundingClientRect(); return [Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)), Math.max(0, Math.min(100, (e.clientY - r.top) / r.height * 100))]; }
    function hFor(w) { return w * big.naturalWidth / big.naturalHeight / ratio; }
    function fit(x, w) {   // keeps the tile's shape and stays inside the picture
      var h = hFor(w); if (h > 100) { h = 100; w = h * ratio * big.naturalHeight / big.naturalWidth; }
      w = Math.min(w, 100);
      return [Math.max(0, Math.min(100 - w, x[0])), Math.max(0, Math.min(100 - h, x[1])), w, h];
    }
    var drag = null;
    stage.addEventListener("pointerdown", function (e) {
      if (!big.naturalWidth) return;
      stage.setPointerCapture(e.pointerId);
      var p = pct(e);
      if (e.target.classList.contains("bi-crop-grip") && crop) drag = { mode: "size", start: p, c: crop.slice() };
      else if (e.target === box && crop) drag = { mode: "move", start: p, c: crop.slice() };
      else drag = { mode: "new", start: p };
      e.preventDefault();
    });
    stage.addEventListener("pointermove", function (e) {
      if (!drag) return;
      var p = pct(e), s = drag.start, c = drag.c;
      if (drag.mode === "move") crop = fit([c[0] + p[0] - s[0], c[1] + p[1] - s[1]], c[2]);
      else if (drag.mode === "size") crop = fit([c[0], c[1]], Math.max(2, Math.min(100 - c[0], c[2] + p[0] - s[0])));
      else { var w = Math.abs(p[0] - s[0]); if (w < 1) return; var h = hFor(w); crop = fit([p[0] < s[0] ? s[0] - w : s[0], p[1] < s[1] ? s[1] - h : s[1]], w); }
      draw();
    });
    function end() { if (!drag) return; drag = null; onChange(text(crop)); }
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", end);
    el.querySelector(".bi-crop-btn").addEventListener("click", function () { crop = null; draw(); onChange(""); });
    setSrc(opts.src);
    return {
      // new props from the form: a different picture, or the value changed elsewhere
      update: function (o) {
        if (o.onChange) onChange = o.onChange;
        if (!drag && o.value !== undefined && text(parse(o.value)) !== text(crop)) { crop = parse(o.value); draw(); }
        setSrc(o.src);
      }
    };
  }
  window.mountCollageCrop = mountCollageCrop;

  // ---- Sveltia CMS: the "collagecrop" field type ----
  if (!window.CMS || !window.CMS.registerFieldType || !window.createClass || !window.h) return;
  // the picture the tile uses: Collage picture if set, else the Main image (an unsaved upload via getAsset)
  function pictureOf(props) {
    var e = props.entry, path = "";
    try { path = (e && e.getIn && (e.getIn(["data", "thumb"]) || e.getIn(["data", "i"]))) || ""; } catch (err) {}
    if (!path) return "";
    try { var a = props.getAsset && props.getAsset(path); var u = a && (a.url || (a.toString && a.toString())); if (u && u !== "[object Object]") return u; } catch (err) {}
    return "/" + String(path).replace(/^\//, "");
  }
  function ratioOf(props) { var f = props.field, r = f && (f.get ? f.get("ratio") : f.ratio); return +r || 1; }
  window.CMS.registerFieldType("collagecrop", window.createClass({
    componentDidMount: function () {
      var self = this;
      this.ui = mountCollageCrop(this.el, { ratio: ratioOf(this.props), src: pictureOf(this.props), value: this.props.value, onChange: function (v) { self.props.onChange(v); } });
    },
    componentDidUpdate: function () { if (this.ui) this.ui.update({ src: pictureOf(this.props), value: this.props.value }); },
    render: function () { var self = this; return window.h("div", { ref: function (el) { self.el = el; }, className: this.props.classNameWrapper }); }
  }));
})();
