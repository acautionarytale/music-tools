/* ------------------------------------------------------------------
   The list of tools. To add a new one:
     1. put its page in a new folder, e.g. my-tool/index.html
     2. add one entry below
   It then shows up as a card and a sidebar link on the home page, and in
   the "Tools" menu at the top of every tool page.
   ------------------------------------------------------------------ */
window.MUSIC_TOOLS = [
  {
    id: "album-rating", name: "Album rating card", tag: "Ratings",
    href: "album-rating/index.html",
    img: "assets/album-rating-preview.png", w: 760, h: 570,
    alt: "Example album rating card with an album score, a colored scale and a bar for each song",
    desc: "Rate every song on an album from 1 to 10 and export a card with your album score and a bar for each track."
  },
  {
    id: "song-sorter", name: "Song & album sorter", tag: "Ranking",
    href: "song-sorter/index.html",
    img: "assets/song-sorter-preview.png", w: 1000, h: 750,
    alt: "Example ranking of seven songs, numbered one to seven, with gold, silver and bronze circles for the top three",
    desc: "Paste a tracklist and pick a winner from each pair. A merge sort turns your choices into a full ranking you can download."
  },
  {
    id: "personal-chart", name: "Personal chart maker", tag: "Chart",
    href: "personal-chart/index.html",
    img: "assets/personal-chart-preview.png", w: 1000, h: 750,
    alt: "Example weekly top 5 chart of songs ranked by plays, with movement arrows, last week, peak and weeks on chart",
    desc: "Enter the songs you played each week and get a Hot 100-style chart of your own, with last week, peak, weeks on chart and movement worked out for you."
  },
  {
    id: "streams-table", name: "Streams table maker", tag: "Streams table",
    href: "streams-table/index.html",
    img: "assets/streams-table-preview.png", w: 1000, h: 750,
    alt: "Example table of monthly streams per album with green and red percent changes",
    desc: "Make a table image of daily average streams by month, with month-over-month change, for a set of albums, songs or artists. Upload a sheet or type in monthly totals."
  },
  {
    id: "cumulative-streams", name: "Cumulative streams graph", tag: "Graph",
    href: "cumulative-streams/index.html",
    img: "assets/cumulative-streams-preview.png", w: 1000, h: 750,
    alt: "Line graph of cumulative streams for several albums over time",
    desc: "Plot the running total of streams for several albums, artists or tracks over any stretch of time, as lines or stacked areas."
  },
];

/* "Tools" menu next to the "All tools" link on each tool page. */
(function () {
  var home = document.querySelector(".homelink");
  if (!home || !window.MUSIC_TOOLS) return;
  var base = document.currentScript && document.currentScript.src ? document.currentScript.src : location.href;
  var css = document.createElement("style");
  css.textContent =
    ".toolsmenu{position:relative;display:inline-block;margin:0 0 12px 14px;vertical-align:top}" +
    ".toolsmenu>button{all:unset;box-sizing:border-box;cursor:pointer;font:inherit;font-size:15px;line-height:1.3;padding:0 12px;border:1px solid var(--line,#DDD2BF);border-radius:999px;color:var(--ink-soft,var(--muted,#85766D));background:var(--field,#FFFDF8)}" +
    ".toolsmenu>button:hover,.toolsmenu>button[aria-expanded=true]{color:var(--ink,#4A3F3B);background:var(--soft,#F3ECDD)}" +
    ".toolsmenu>button:focus-visible{outline:3px solid var(--focus,#8B6FA8);outline-offset:2px}" +
    ".toolsmenu .tm-panel{position:absolute;left:0;top:calc(100% + 6px);z-index:60;min-width:260px;max-width:min(92vw,340px);padding:6px;border-radius:14px;border:1px solid var(--line,#DDD2BF);background:var(--paper,var(--panel,#FBF8F1));box-shadow:0 12px 32px var(--shadow,rgba(74,63,59,.25))}" +
    ".toolsmenu .tm-panel[hidden]{display:none}" +
    ".toolsmenu .tm-panel a{display:flex;gap:10px;align-items:baseline;padding:8px 10px;border-radius:9px;color:var(--ink,#4A3F3B);text-decoration:none;font-size:16px;line-height:1.3}" +
    ".toolsmenu .tm-panel a:hover,.toolsmenu .tm-panel a:focus-visible{background:var(--soft,#F3ECDD);outline:none}" +
    ".toolsmenu .tm-panel a[aria-current=page]{font-weight:700}" +
    ".toolsmenu .tm-panel i{font-style:italic;font-weight:400;color:var(--ink-soft,var(--muted,#85766D));min-width:1.5em}";
  document.head.appendChild(css);
  var wrap = document.createElement("span"); wrap.className = "toolsmenu";
  var btn = document.createElement("button"); btn.type = "button"; btn.textContent = "Tools ▾";
  btn.setAttribute("aria-expanded", "false"); btn.setAttribute("aria-haspopup", "true");
  var panel = document.createElement("div"); panel.className = "tm-panel"; panel.hidden = true;
  var here = location.pathname.replace(/index\.html$/, "");
  window.MUSIC_TOOLS.forEach(function (t, i) {
    var url = new URL(t.href, base), a = document.createElement("a");
    a.href = url.href;
    var num = document.createElement("i"); num.textContent = String(i + 1).padStart(2, "0");
    var nm = document.createElement("span"); nm.textContent = t.name;
    a.append(num, nm);
    if (url.pathname.replace(/index\.html$/, "") === here) a.setAttribute("aria-current", "page");
    panel.appendChild(a);
  });
  function set(open) { panel.hidden = !open; btn.setAttribute("aria-expanded", String(open)); }
  btn.addEventListener("click", function () { set(panel.hidden); });
  document.addEventListener("click", function (e) { if (!wrap.contains(e.target)) set(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) { set(false); btn.focus(); } });
  wrap.append(btn, panel);
  home.insertAdjacentElement("afterend", wrap);
})();
