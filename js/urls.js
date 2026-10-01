/* =====================================================================
   Brothers Interactive — clean web addresses
   One place that decides every page's address, used by the website (window.BIURL)
   AND by tools/build.js, which creates a real page at each address on GitHub:

     /                                  homepage
     /portfolio/  /team/  /careers/ …   homepage, scrolled to that section
     /category/realistic-character/     one portfolio category
     /portfolio/realistic-character/lehri/   one artwork (shareable with clients)
     /breakdowns/  /breakdowns/orc-fanart/   breakdown list and one breakdown
   ===================================================================== */
(function (root) {
  "use strict";

  /* Portfolio categories as visitors see them. "match" lists the category keys stored on each
     piece (p.c / p.cats in data/portfolio.json) that belong under this slug. */
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

  // Homepage sections that get their own address (/games/, /team/ …). "home" is the bare "/".
  var SECTIONS = ["home", "games", "testimonials", "about", "portfolio", "breakdown", "compare", "services", "faq", "team", "careers", "blog"];

  function slugify(s) {
    return String(s || "").toLowerCase()
      .normalize("NFKD").replace(/[̀-ͯ]/g, "")
      .replace(/&/g, " and ").replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  // Category key on a piece (e.g. "realistic-humans") -> the slug used in addresses ("realistic-character")
  function catSlug(key) {
    for (var i = 0; i < BROWSE_CATS.length; i++) if (BROWSE_CATS[i].match.indexOf(key) !== -1) return BROWSE_CATS[i].slug;
    return slugify(key) || "work";
  }

  /* Every piece's address, worked out from the whole list at once so two pieces with the same name in
     the same category still get different addresses (the second becomes "-2"). The name comes from the
     optional "Link name" field in /admin, else the title. Returns { id: "/portfolio/cat/name/" }. */
  function piecePaths(items) {
    var out = {}, used = {};
    (items || []).forEach(function (p) {
      if (!p || !p.id) return;
      var cat = catSlug(p.c), name = slugify(p.slug) || slugify(p.t) || slugify(p.id), key = cat + "/" + name, n = 1;
      while (used[key]) key = cat + "/" + name + "-" + (++n);
      used[key] = true;
      out[p.id] = "/portfolio/" + key + "/";
    });
    return out;
  }

  function categoryPath(slug) { return "/category/" + slug + "/"; }
  function sectionPath(id) { return id === "home" ? "/" : "/" + id + "/"; }
  function breakdownPath(id) { return id ? "/breakdowns/" + slugify(id) + "/" : "/breakdowns/"; }

  var api = {
    BROWSE_CATS: BROWSE_CATS, SECTIONS: SECTIONS, slugify: slugify, catSlug: catSlug, piecePaths: piecePaths,
    categoryPath: categoryPath, sectionPath: sectionPath, breakdownPath: breakdownPath
  };
  if (typeof module === "object" && module.exports) module.exports = api; else root.BIURL = api;
})(this);
