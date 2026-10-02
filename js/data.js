/* =====================================================================
   Brothers Interactive — SITE CONTENT
   Edit this file to update the site. No code knowledge needed:
   keep the quotes and commas, save, refresh.
   ===================================================================== */

window.BI = {

  /* ---- Settings (fill in when you have the accounts) ---- */
  CONFIG: {
    availability: "Taking new projects",            // header pill text; "" hides it
    availabilityNote: "Next start: on request",     // small line under the pill
    bookingUrl: "",                                 // e.g. "https://calendly.com/brothersinteractive/intro" — empty hides the button
    plausibleDomain: "",                            // e.g. "brothersinteractive.com" — empty = analytics off
    showreelYouTubeId: "",                          // e.g. "dQw4w9WgXcQ" — empty = image reel from the portfolio
    deckPdf: "/assets/brothers-interactive-capabilities.pdf",
    email: "business@brothersinteractive.com",
    address: "79/5 Shipra Path, Mansarovar, Jaipur 302020, Rajasthan, India"
  },

  /* ---- Homepage hero (headline + stats only — the showcase image is HERO_SHOWCASE below) ---- */
  HERO: {
    eyebrow: "3D Game Art Studio · Est. 2019",
    titleLine1: "We build the",
    titleAccent: "CHARACTERS",
    titleLine3: "players remember.",
    subtitle: "Brothers Interactive is a 3D game art studio specializing in creating high-quality characters, props, and weapons for games. From indie to AAA, we deliver detailed, optimized, engine-ready assets.",
    primaryBtnLabel: "View Portfolio",
    secondaryBtnLabel: "Start a Project",
    stat1Num: 2019, stat1Suffix: "", stat1Label: "Founded",
    stat2Suffix: "+", stat2Label: "Portfolio pieces",
    stat3Suffix: "+", stat3Label: "Shipped games"
  },

  /* ---- Hero showcase: cutout (transparent-background) character renders that stand on the
     rotating podium in the hero. One is picked at random on every page load. Use PNGs with the
     background removed — anything with a background will show as a hard rectangle over the podium. ---- */
  HERO_SHOWCASE: [
    { img: "/assets/img/portfolio/placeholder-silhouette.png", alt: "Placeholder character — replace via admin panel" },
    { img: "/assets/img/portfolio/placeholder-silhouette-2.png", alt: "Placeholder character — replace via admin panel" },
    { img: "/assets/img/portfolio/placeholder-silhouette-3.png", alt: "Placeholder creature — replace via admin panel" }
  ],

  /* ---- Quote estimator: typical artist-days per asset (ranges), editable ---- */
  ESTIMATOR: {
    types: {
      "Hero character": { realistic: [18, 30], stylized: [12, 22], handpainted: [10, 18] },
      "NPC / secondary character": { realistic: [10, 18], stylized: [7, 14], handpainted: [6, 12] },
      "Creature": { realistic: [14, 26], stylized: [10, 18], handpainted: [8, 15] },
      "Hero prop / weapon": { realistic: [4, 8], stylized: [3, 6], handpainted: [3, 5] },
      "Simple prop": { realistic: [1, 3], stylized: [1, 2], handpainted: [1, 2] },
      "Hair set": { realistic: [4, 8], stylized: [2, 5], handpainted: [2, 4] }
    },
    rigging: [3, 6],       // extra days per character when rigging is needed
    outfitVariant: [3, 6], // extra days per variant
    parallelArtists: 4     // how many artists typically work in parallel on one project
  },

  /* ---- Client logo wall (text wordmarks; add {logo:"/assets/img/logos/x.webp"} when you have permission) ---- */
  CLIENTS: [
    { n: "Saber Interactive" }, { n: "Thunderful" }, { n: "Midwinter Entertainment" }, { n: "Slipgate Ironworks" },
    { n: "MoonHood Studios" }, { n: "VOID Interactive" }, { n: "Zoink Games" }, { n: "Event Horizon" }
  ],

  /* ---- Testimonials: { q: "quote", n: "Name", r: "Art Director, Studio", img: "/assets/img/team/x.webp" }
     The three entries below are SAMPLES (sample: true shows a badge). Replace them with real, approved quotes. ---- */
  TESTIMONIALS: [
    { sample: true, q: "The characters matched our in-house style so closely that our own team could not tell which ones were outsourced.", n: "Client name", r: "Art Director, AAA studio", project: "Realistic characters" },
    { sample: true, q: "Clear weekly updates, zero surprises on the deadline, and every revision note handled the same day.", n: "Client name", r: "Producer, indie studio", project: "Stylized cast" },
    { sample: true, q: "Sculpt quality was the best we have seen from an outsourcing partner. We brought them back for the next title.", n: "Client name", r: "Lead Character Artist", project: "Creatures & props" }
  ],

  /* ---- Open roles: { t: "Senior Character Artist", type: "Full-time · Jaipur", d: "One-line summary" } ---- */
  ROLES: [],

  /* ---- Press & recognition: { t: "Title", src: "Publication", url: "https://...", d: "Mar 2025" } ---- */
  PRESS: [],

  /* ---- Sculpt-to-final comparison pairs (auto-detected from the portfolio) ---- */
  PAIRS: [
      {
          "id": "xdAzDY",
          "t": "Cute Monster",
          "before": "/assets/img/portfolio/cute-monster-xdazdy-before.webp",
          "after": "/assets/img/portfolio/cute-monster-xdazdy-after.webp"
      },
      {
          "id": "vbNvDE",
          "t": "Orc Fanart",
          "before": "/assets/img/portfolio/orc-fanart-vbnvde-before.webp",
          "after": "/assets/img/portfolio/orc-fanart-vbnvde-after.webp"
      },
      {
          "id": "mAnNrv",
          "t": "T-Rex - Crash Bandicoot 4 Fanart",
          "before": "/assets/img/portfolio/t-rex-crash-bandicoot-4-fanart-mannrv-before.webp",
          "after": "/assets/img/portfolio/t-rex-crash-bandicoot-4-fanart-mannrv-after.webp"
      },
      {
          "id": "rJVn4e",
          "t": "Zombie-2",
          "before": "/assets/img/portfolio/zombie-2-rjvn4e-before.webp",
          "after": "/assets/img/portfolio/zombie-2-rjvn4e-after.webp"
      },
      {
          "id": "qJY3qa",
          "t": "Orc",
          "before": "/assets/img/portfolio/orc-qjy3qa-before.webp",
          "after": "/assets/img/portfolio/orc-qjy3qa-after.webp"
      },
      {
          "id": "dKWXLA",
          "t": "Lehri",
          "before": "/assets/img/portfolio/lehri-dkwxla-before.webp",
          "after": "/assets/img/portfolio/lehri-dkwxla-after.webp"
      }
  ],

  /* ---- Case studies (cat pulls thumbnails from PROJECTS; stats rows are optional) ---- */
  CASES: [
    {
      t: "Lost in Random", client: "Zoink Games / Thunderful", year: "2021", style: "Stylized", engine: "Unity",
      img: "/assets/img/games/lost-in-random.webp", yt: "diilMn5gSAg", cat: "lost-in-random", stats: [["Published assets", "11"], ["Style", "Stylized"], ["Team size", "Add"], ["Timeline", "Add"]],
      summary: "Gothic fairy-tale characters for Zoink's action adventure. We produced a cast of NPCs and enemies in the game's hand-crafted, stop-motion inspired look, from sculpt through final textures, matched to the in-house cast so the additions are indistinguishable from the studio's own work.",
      scope: ["Stylized character modeling and sculpting", "Hand-painted PBR texturing", "Game-res topology and UVs", "Style matching to existing characters"]
    },
    {
      t: "The Midnight Walk", client: "MoonHood Studios", year: "2025", style: "Stylized claymation", engine: "Unreal Engine",
      img: "/assets/img/games/the-midnight-walk.webp", yt: "QnBE7mU6ZsI", cat: "mid-night-walk", stats: [["Published assets", "9"], ["Style", "Claymation"], ["Team size", "Add"], ["Timeline", "Add"]],
      summary: "Clay-sculpted characters for MoonHood's dark fairy-tale adventure. Our work covered story characters and creatures translated from physical clay reference into game-ready assets that keep the fingerprints-and-tool-marks feel of the original sculpts.",
      scope: ["Character and creature sculpting from clay reference", "Retopology and UVs for a stylized pipeline", "Texturing with hand-made surface detail", "Engine-ready exports"]
    },
    {
      t: "Warhammer 40,000: Space Marine 2", client: "Saber Interactive", year: "2024", style: "Realistic AAA", engine: "Swarm Engine",
      img: "/assets/img/games/warhammer-40-000-space-marine-2.webp", yt: "A_HljUo8Jjk", cat: null,
      summary: "Character and asset production support on Saber Interactive's AAA action title. Details of individual assets are shared on request in line with the project's confidentiality terms.",
      scope: ["3D modeling and sculpting", "Texturing", "Skinning and rigging", "Engine integration support"]
    },
    {
      t: "Ready Or Not", client: "VOID Interactive", year: "2023", style: "Realistic", engine: "Unreal Engine",
      img: "/assets/img/games/ready-or-not.webp", yt: "lLNoftAmKr0", cat: null,
      summary: "Realistic character and equipment production support for VOID Interactive's tactical shooter. Asset breakdowns are available on request.",
      scope: ["Realistic character modeling", "Gear, equipment and prop texturing", "Skinning and rigging support", "Optimization for Unreal"]
    },
    {
      t: "Wavetale", client: "Thunderful Development", year: "2022", style: "Stylized", engine: "Unity",
      img: "/assets/img/games/wavetale.webp", yt: "Zeths3LNBgQ", cat: null,
      summary: "Stylized character work for Thunderful's ocean-surfing adventure. Asset breakdowns are available on request.",
      scope: ["Stylized character modeling", "Texturing", "Game-res topology and UVs"]
    }
  ],

  /* ---- Blog posts (video recaps, rendered as thumbnail cards like GAMES) ---- */
  POSTS: [
    { t: "Farewell Party Tanya Nayak", yt: "A8N3l1nfswg" },
    { t: "Sahil Birthday Party Brothers Interactive", yt: "rxexTN8IBLM" },
    { t: "Goa Trip Brothers Interactive", yt: "xL5N6lc52HU" },
    { t: "Brothers Interactive Awards", yt: "SIvFDCD4RsM" },
    { t: "Brothers Interactive 5th Anniversary", yt: "x08C596I5cA" },
    { t: "Brothers Interactive Goa 1", yt: "3a_yw3iLaWQ" },
    { t: "Brothers Interactive Goa 2", yt: "3zbaObBhE0M" },
    { t: "Brothers Interactive Goa Casino Party", yt: "_GXwwRh4bBc" },
    { t: "Brothers Interactive Christmas Celebration", yt: "f_M6_xG64z0" },
    { t: "Christmas Celebration 2023", yt: "3O682w5lKfg" }
  ],

  /* ---- Game credits ---- */
  GAMES: [
    {"t": "Tormentor", "s": "Slipgate Ironworks", "yt": "FRMIpc-JiOM", "i": "/assets/img/games/tormentor.webp"},
    {"t": "The Midnight Walk", "s": "MoonHood Studios", "yt": "QnBE7mU6ZsI", "i": "/assets/img/games/the-midnight-walk.webp"},
    {"t": "Warhammer 40,000: Space Marine 2", "s": "Saber Interactive", "yt": "A_HljUo8Jjk", "i": "/assets/img/games/warhammer-40-000-space-marine-2.webp"},
    {"t": "Ready or Not", "s": "VOID Interactive", "yt": "lLNoftAmKr0", "i": "/assets/img/games/ready-or-not.webp"},
    {"t": "Supermoves", "s": "Makea Games", "yt": "TetKQGIBjvo", "i": "/assets/img/games/supermoves.webp"},
    {"t": "Warhammer 40,000: Speed Freeks", "s": "Caliber Games", "yt": "tqSelvOZnHU", "i": "/assets/img/games/warhammer-40-000-speed-freeks.webp"},
    {"t": "Dark Envoy", "s": "Event Horizon", "yt": "I07Gm2dpiLs", "i": "/assets/img/games/dark-envoy.webp"},
    {"t": "Lost in Random", "s": "Zoink / Thunderful", "yt": "diilMn5gSAg", "i": "/assets/img/games/lost-in-random.webp"},
    {"t": "The Gunk", "s": "Image & Form / Thunderful", "yt": "Cs96h12uHiE", "i": "/assets/img/games/the-gunk.webp"},
    {"t": "Wavetale", "s": "Thunderful Development", "yt": "Zeths3LNBgQ", "i": "/assets/img/games/wavetale.webp"},
    {"t": "Scavengers", "s": "Midwinter Entertainment", "yt": "hvq9Ov6gXc4", "i": "/assets/img/games/scavengers.webp"}
  ],
};
