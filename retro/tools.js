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
    desc: "Make a table image of daily average streams by day, week, month or year, with change from the period before, for a set of albums, songs or artists. Import from Spotify, upload a sheet or type in totals."
  },
  {
    id: "cumulative-streams", name: "Cumulative streams graph", tag: "Graph",
    href: "cumulative-streams/index.html",
    img: "assets/cumulative-streams-preview.png", w: 1000, h: 750,
    alt: "Line graph of cumulative streams for several albums over time",
    desc: "Plot the running total of streams for several albums, artists or tracks by day, week, month or year, as lines or stacked areas."
  },
  {
    id: "spotify-library", name: "Spotify library", tag: "Import",
    href: "spotify-library/index.html",
    img: "assets/spotify-library-preview.png", w: 1000, h: 750,
    alt: "The Spotify library page showing a saved play count, settings and a list of album editions to merge",
    desc: "Add your Spotify history once, merge album editions like Fearless and Fearless (Platinum Edition), and use it in the graph, table and weekly chart tools."
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

/* ------------------------------------------------------------------
   Hidden door between the classic and retro editions.
   Type the word, enter the Konami code, or tap a page title five times.
   ------------------------------------------------------------------ */
(function () {
  var EDITION = "retro";                 // "classic" or "retro"
  var script = document.currentScript, src = script && script.src ? script.src : "";
  if (!src) return;
  var here = new URL("./", src);
  var other = EDITION === "retro" ? new URL("../", here) : new URL("retro/", here);
  var hp = decodeURI(here.pathname), lp = decodeURI(location.pathname);
  var rel = lp.indexOf(hp) === 0 ? lp.slice(hp.length) : "";
  var target = new URL(rel, other); target.search = location.search; target.hash = location.hash;
  var WORD = EDITION === "retro" ? "classic" : "retro";
  var KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  var typed = "", konami = 0, taps = [], open = false;
  function wireButton() {
    var b = document.getElementById("editionLink"); if (b) b.href = target.href;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wireButton); else wireButton();
  try { if (localStorage.getItem("musicTools.egg") === "1") showLink(); } catch (e) {}

  function showLink() {
    function add() {
      var foot = document.querySelector(".foot");
      if (!foot || foot.querySelector(".egg-link") || document.getElementById("editionLink")) return;
      var a = document.createElement("a"); a.className = "egg-link"; a.href = target.href;
      a.textContent = EDITION === "retro" ? "Classic edition" : "Retro edition";
      a.style.cssText = "margin-left:10px;color:inherit;text-decoration:underline;text-underline-offset:3px";
      foot.append(" ", a);
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", add); else add();
  }

  var CSS = EDITION === "retro"
    ? "dialog.egg{border:3px solid var(--edge,#3B2418);border-radius:24px;background:var(--paper,#FFF8E1);color:var(--ink,#3B2418);padding:26px 26px 22px;max-width:min(92vw,420px);box-shadow:9px 9px 0 var(--hard,#3B2418);font-family:var(--serif,sans-serif);overflow:visible}" +
      "dialog.egg::backdrop{background:rgba(27,15,46,.62)}" +
      "dialog.egg[open]{animation:eggpop .42s cubic-bezier(.2,1.4,.4,1)}" +
      "dialog.egg .egg-tag{position:absolute;top:-16px;left:20px;transform:rotate(-4deg);background:var(--pop2,#F2A900);color:#3B2418;border:2.5px solid var(--edge,#3B2418);border-radius:8px;padding:3px 12px;font-weight:700;font-size:12px;letter-spacing:.08em;text-transform:uppercase;box-shadow:2px 2px 0 var(--hard,#3B2418)}" +
      "dialog.egg h2{font-family:var(--display,serif);font-weight:400;font-size:34px;line-height:1.05;margin:6px 0 10px;text-shadow:2px 2px 0 var(--pop2,#F2A900)}" +
      "dialog.egg p{margin:0 0 18px;font-size:17px;line-height:1.45}" +
      "dialog.egg .egg-disc{position:absolute;right:-22px;top:-30px;width:74px;height:74px;border-radius:50%;border:3px solid var(--edge,#3B2418);background:radial-gradient(circle,#1B0F2E 0 9%,var(--pop3,#14877F) 10% 26%,#1B0F2E 27% 100%);box-shadow:3px 3px 0 var(--hard,#3B2418);animation:eggspin 3s linear infinite}" +
      "dialog.egg .egg-row{display:flex;gap:12px;flex-wrap:wrap}" +
      "dialog.egg .egg-btn{font:inherit;font-weight:700;font-size:16px;cursor:pointer;padding:9px 18px;border:3px solid var(--edge,#3B2418);border-radius:12px;background:var(--paper,#FFF8E1);color:var(--ink,#3B2418);box-shadow:3px 3px 0 var(--hard,#3B2418);transition:transform .08s,box-shadow .08s;text-decoration:none;display:inline-block}" +
      "dialog.egg .egg-btn.go{background:var(--pop,#E8591A);color:#FFF8E1}" +
      "dialog.egg .egg-btn:active{transform:translate(3px,3px);box-shadow:0 0 0 var(--hard,#3B2418)}" +
      "dialog.egg .egg-btn:focus-visible{outline:3px solid var(--focus,#0F7C78);outline-offset:3px}"
    : "dialog.egg{border:1px solid var(--line,#DDD2BF);border-radius:20px;background:var(--paper,var(--panel,#FBF8F1));color:var(--ink,#4A3F3B);padding:26px 26px 22px;max-width:min(92vw,400px);box-shadow:0 28px 70px -24px rgba(40,25,15,.55);font-family:var(--serif,Georgia,serif);overflow:visible}" +
      "dialog.egg::backdrop{background:rgba(30,22,18,.45);backdrop-filter:blur(2px)}" +
      "dialog.egg[open]{animation:eggpop .38s cubic-bezier(.2,.9,.3,1.2)}" +
      "dialog.egg .egg-tag{display:inline-block;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-soft,var(--muted,#85766D));margin-bottom:8px}" +
      "dialog.egg h2{font-size:27px;line-height:1.15;margin:0 0 8px;font-weight:700}" +
      "dialog.egg p{margin:0 0 18px;font-size:17px;line-height:1.5;color:var(--ink-soft,var(--muted,#85766D))}" +
      "dialog.egg .egg-disc{position:absolute;right:20px;top:-22px;width:46px;height:46px;border-radius:50%;background:conic-gradient(from 20deg,#E58F8B,#EDBC6B,#92C896,#7FB2D6,#B195D4,#E58F8B);box-shadow:0 6px 16px -4px rgba(40,25,15,.45);animation:eggspin 6s linear infinite}" +
      "dialog.egg .egg-disc::after{content:'';position:absolute;inset:17px;border-radius:50%;background:var(--paper,#FBF8F1)}" +
      "dialog.egg .egg-row{display:flex;gap:10px;flex-wrap:wrap}" +
      "dialog.egg .egg-btn{font:inherit;font-weight:700;font-size:16px;cursor:pointer;padding:9px 20px;border:1px solid var(--line,#DDD2BF);border-radius:999px;background:var(--field,#FFFDF8);color:var(--ink,#4A3F3B);text-decoration:none;display:inline-block;box-shadow:none}" +
      "dialog.egg .egg-btn.go{background:var(--ink,#4A3F3B);color:var(--on-ink,#FFFDF8);border-color:var(--ink,#4A3F3B)}" +
      "dialog.egg .egg-btn:hover{filter:brightness(1.08)}" +
      "dialog.egg .egg-btn:focus-visible{outline:3px solid var(--focus,#8B6FA8);outline-offset:2px}";
  CSS += "@keyframes eggpop{from{opacity:0;transform:translateY(14px) scale(.9)}to{opacity:1;transform:none}}@keyframes eggspin{to{transform:rotate(360deg)}}" +
    "@media (prefers-reduced-motion:reduce){dialog.egg[open],dialog.egg .egg-disc{animation:none}}";

  function popup() {
    if (open) return; open = true;
    try { localStorage.setItem("musicTools.egg", "1"); } catch (e) {}
    var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    var d = document.createElement("dialog"); d.className = "egg"; d.setAttribute("aria-labelledby", "egg-h");
    var tag = document.createElement("span"); tag.className = "egg-tag"; tag.textContent = "Secret";
    var disc = document.createElement("span"); disc.className = "egg-disc"; disc.setAttribute("aria-hidden", "true");
    var h = document.createElement("h2"); h.id = "egg-h";
    var p = document.createElement("p");
    var row = document.createElement("div"); row.className = "egg-row";
    var go = document.createElement("a"); go.className = "egg-btn go"; go.href = target.href;
    var stay = document.createElement("button"); stay.type = "button"; stay.className = "egg-btn"; stay.textContent = "Stay here";
    if (EDITION === "retro") { h.textContent = "Back to the classic edition?"; p.textContent = "Your saved work comes along."; go.textContent = "Take me back"; }
    else { h.textContent = "You found the retro edition."; p.textContent = "Same tools, different look. Your saved work comes along."; go.textContent = "Take me there"; }
    row.append(go, stay); d.append(tag, disc, h, p, row); document.body.appendChild(d);
    function close() { open = false; try { d.close(); } catch (e) {} d.remove(); st.remove(); }
    stay.addEventListener("click", close);
    d.addEventListener("cancel", function () { open = false; setTimeout(function () { d.remove(); st.remove(); }, 0); });
    d.addEventListener("click", function (e) { if (e.target === d) close(); });
    if (d.showModal) d.showModal(); else d.setAttribute("open", "");
    go.focus();
    showLink();
  }

  document.addEventListener("keydown", function (e) {
    var t = e.target, tag = t && t.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (t && t.isContentEditable) || e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key;
    konami = (k === KONAMI[konami] || k.toLowerCase() === KONAMI[konami]) ? konami + 1 : (k === KONAMI[0] ? 1 : 0);
    if (konami === KONAMI.length) { konami = 0; popup(); return; }
    if (k.length === 1) { typed = (typed + k.toLowerCase()).slice(-WORD.length); if (typed === WORD) { typed = ""; popup(); } }
  });
  document.addEventListener("click", function (e) {
    var el = e.target.closest ? e.target.closest("h1, .brand .mark") : null;
    if (!el) return;
    var now = Date.now(); taps = taps.filter(function (t) { return now - t < 2500; }); taps.push(now);
    if (taps.length >= 5) { taps = []; popup(); }
  });
})();
