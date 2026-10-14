/* ------------------------------------------------------------------
   Spotify library and import, shared by the Spotify library page, the
   Streams table maker, the Cumulative graph and the Personal chart maker.
   Everything happens in the browser: the files you choose are read here
   and are never uploaded anywhere. Plays are saved in the browser's own
   database (IndexedDB) so they only need adding once.

   SpotifyImport.open({ mode:"table", kind:"albums"|"songs"|"artists", grain, ws, aliases:{ artist:{ alias:target } }, onImport(result, summary) })
       result is { grain, ws, artists:{ name:{ order, vals } } }; needs periods.js
   SpotifyImport.open({ mode:"chart", weekStart, onImport(result, summary, { weekStart }) })
   Options for mode "table": allTime (offers every day/week of history), single (one artist only, no "top 5")
   SpotifyImport.lib: the library API used by the Spotify library page (history, settings, merges)
   ------------------------------------------------------------------ */
(function () {
  var SP = window.SpotifyImport = {};
  var DB = null;   // the plays read so far, kept only in memory

  /* ---------------- reading files ---------------- */
  function blankDB() { return { n:0, ts:[], ms:[], tr:[], ar:[], al:[], strs:[], map:new Map(), files:0, hasAlbum:false }; }
  function intern(db, s) {
    if (s == null || s === "") return -1;
    var i = db.map.get(s);
    if (i === undefined) { i = db.strs.length; db.strs.push(s); db.map.set(s, i); }
    return i;
  }
  function addPlays(db, arr) {
    var got = 0;
    for (var k = 0; k < arr.length; k++) {
      var o = arr[k], t, ms, tr, ar, al;
      if (!o || typeof o !== "object") continue;
      if (o.ts !== undefined) {                       // extended streaming history
        t = Date.parse(o.ts); ms = o.ms_played;
        tr = o.master_metadata_track_name; ar = o.master_metadata_album_artist_name; al = o.master_metadata_album_album_name;
      } else if (o.endTime !== undefined) {           // basic account data (last year, no album names)
        t = Date.parse(String(o.endTime).replace(" ", "T") + (/[zZ]|[+-]\d\d:?\d\d$/.test(o.endTime) ? "" : ":00Z"));
        ms = o.msPlayed; tr = o.trackName; ar = o.artistName; al = null;
      } else continue;
      if (!tr || !ar || !isFinite(t)) continue;       // podcasts and videos have no track name
      db.ts.push(t); db.ms.push(+ms || 0);
      db.tr.push(intern(db, tr)); db.ar.push(intern(db, ar)); db.al.push(intern(db, al));
      if (al) db.hasAlbum = true;
      got++;
    }
    db.n = db.ts.length; return got;
  }
  var WANT = /(^|\/)(Streaming_History_Audio[^\/]*|StreamingHistory(_music)?[^\/]*)\.json$/i;

  function u16(v, o) { return v.getUint16(o, true); }
  function u32(v, o) { return v.getUint32(o, true); }
  // A small zip reader, so the .zip from Spotify can be used as it is.
  async function zipEntries(file) {
    var size = file.size, tailLen = Math.min(size, 65557);
    var tail = new DataView(await file.slice(size - tailLen).arrayBuffer());
    var e = -1;
    for (var i = tailLen - 22; i >= 0; i--) { if (u32(tail, i) === 0x06054b50) { e = i; break; } }
    if (e < 0) throw new Error("That doesn't look like a zip file.");
    var count = u16(tail, e + 10), cdSize = u32(tail, e + 12), cdOff = u32(tail, e + 16);
    if (cdOff === 0xFFFFFFFF || count === 0xFFFF) throw new Error("This zip is too large for the in-browser reader. Unzip it and choose the JSON files instead.");
    var cd = new DataView(await file.slice(cdOff, cdOff + cdSize).arrayBuffer()), out = [], p = 0, dec = new TextDecoder();
    for (var n = 0; n < count && p + 46 <= cd.byteLength; n++) {
      if (u32(cd, p) !== 0x02014b50) break;
      var flags = u16(cd, p + 8), method = u16(cd, p + 10), csize = u32(cd, p + 20), usize = u32(cd, p + 24);
      var nl = u16(cd, p + 28), el = u16(cd, p + 30), cl = u16(cd, p + 32), off = u32(cd, p + 42);
      var name = dec.decode(new Uint8Array(cd.buffer, cd.byteOffset + p + 46, nl));
      out.push({ name: name, method: method, csize: csize, usize: usize, off: off, flags: flags });
      p += 46 + nl + el + cl;
    }
    return out;
  }
  async function zipText(file, ent) {
    var lh = new DataView(await file.slice(ent.off, ent.off + 30).arrayBuffer());
    var start = ent.off + 30 + u16(lh, 26) + u16(lh, 28);
    var blob = file.slice(start, start + ent.csize);
    if (ent.method === 0) return blob.text();
    if (ent.method !== 8) throw new Error("Unsupported zip compression in " + ent.name);
    if (typeof DecompressionStream === "undefined") throw new Error("This browser can't unzip files. Unzip it and choose the JSON files instead.");
    return new Response(blob.stream().pipeThrough(new DecompressionStream("deflate-raw"))).text();
  }
  async function readFiles(files, say) {
    var db = blankDB(), jobs = [], i;
    for (i = 0; i < files.length; i++) {
      var f = files[i];
      if (/\.zip$/i.test(f.name)) {
        var ents = await zipEntries(f);
        ents.filter(function (x) { return WANT.test(x.name); }).forEach(function (x) { jobs.push({ file: f, ent: x, name: x.name }); });
      } else if (/\.json$/i.test(f.name)) jobs.push({ file: f, name: f.name });
    }
    if (!jobs.length) throw new Error("No streaming history files found. Look for files named Streaming_History_Audio_… (extended history) or StreamingHistory_music_… (account data).");
    for (i = 0; i < jobs.length; i++) {
      var j = jobs[i];
      say("Reading file " + (i + 1) + " of " + jobs.length + "…");
      await new Promise(function (r) { setTimeout(r, 0); });
      var text = j.ent ? await zipText(j.file, j.ent) : await j.file.text(), arr;
      try { arr = JSON.parse(text); } catch (e) { throw new Error("Couldn't read " + j.name + "."); }
      if (Array.isArray(arr)) { addPlays(db, arr); db.files++; }
    }
    if (!db.n) throw new Error("No plays found in those files.");
    return db;
  }

  /* ---------------- saved history (kept in this browser's own database) ----------------
     Every play is stored once, so any period or chart can be rebuilt without uploading again.
     Newer exports are merged in; a play already saved (same minute, song and artist) is skipped. */
  var KEPT = null;          // the saved plays, once loaded
  var STORE_OK = true;
  function idbRun(mode, fn) {
    return new Promise(function (res, rej) {
      if (!window.indexedDB) return rej(new Error("This browser can't keep saved data."));
      var open;
      try { open = indexedDB.open("musicTools.history", 1); } catch (e) { return rej(e); }
      open.onupgradeneeded = function () { open.result.createObjectStore("kv"); };
      open.onerror = function () { rej(open.error || new Error("Couldn't open the browser's storage.")); };
      open.onsuccess = function () {
        var db = open.result, out;
        try {
          var tx = db.transaction("kv", mode), req = fn(tx.objectStore("kv"));
          if (req) req.onsuccess = function () { out = req.result; };
          tx.oncomplete = function () { db.close(); res(out); };
          tx.onabort = tx.onerror = function () { db.close(); rej(tx.error || new Error("Couldn't write to the browser's storage.")); };
        } catch (e) { db.close(); rej(e); }
      };
    });
  }
  function pack(db) {
    var n = db.n, r = { v: 1, n: n, ts: new Float64Array(n), ms: new Int32Array(n), tr: new Int32Array(n), ar: new Int32Array(n), al: new Int32Array(n), strs: db.strs.slice(), hasAlbum: !!db.hasAlbum, files: db.files || 0, saved: Date.now() };
    for (var i = 0; i < n; i++) { r.ts[i] = db.ts[i]; r.ms[i] = Math.min(db.ms[i], 2147483647); r.tr[i] = db.tr[i]; r.ar[i] = db.ar[i]; r.al[i] = db.al[i]; }
    return r;
  }
  function unpack(r) {
    var db = blankDB();
    db.ts = Array.from(r.ts); db.ms = Array.from(r.ms); db.tr = Array.from(r.tr); db.ar = Array.from(r.ar); db.al = Array.from(r.al);
    db.strs = r.strs.slice(); db.strs.forEach(function (s, i) { db.map.set(s, i); });
    db.n = db.ts.length; db.hasAlbum = !!r.hasAlbum; db.files = r.files || 0;
    return db;
  }
  function loadKept() {
    return idbRun("readonly", function (s) { return s.get("plays"); }).then(function (rec) { return rec && rec.n ? unpack(rec) : null; });
  }
  function saveKept() {
    return idbRun("readwrite", function (s) { return s.put(pack(KEPT), "plays"); }).then(function () {
      try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}
    });
  }
  // Adds the plays of `inc` to `base`. Only plays already in `base` count as duplicates.
  function mergeDB(base, inc) {
    var seen = new Map(), i, added = 0, dup = 0;
    for (i = 0; i < base.n; i++) seen.set(Math.floor(base.ts[i] / 60000) + "|" + base.tr[i] + "|" + base.ar[i], i);
    for (i = 0; i < inc.n; i++) {
      var tr = intern(base, inc.strs[inc.tr[i]]), ar = intern(base, inc.strs[inc.ar[i]]), al = inc.al[i] < 0 ? -1 : intern(base, inc.strs[inc.al[i]]);
      var j = seen.get(Math.floor(inc.ts[i] / 60000) + "|" + tr + "|" + ar);
      if (j !== undefined) {   // already saved; but fill in the album if the saved copy lacked one
        dup++; if (base.al[j] < 0 && al >= 0) { base.al[j] = al; base.hasAlbum = true; }
        continue;
      }
      base.ts.push(inc.ts[i]); base.ms.push(inc.ms[i]); base.tr.push(tr); base.ar.push(ar); base.al.push(al);
      if (al >= 0) base.hasAlbum = true;
      added++;
    }
    base.n = base.ts.length; base.files += inc.files;
    return { added: added, dup: dup };
  }
  async function backupBlob(db) {
    var r = pack(db), json = JSON.stringify({ v: 1, n: r.n, strs: r.strs, hasAlbum: r.hasAlbum, files: r.files }), enc = new TextEncoder();
    var len = enc.encode(json).length, pad = (8 - ((4 + len) % 8)) % 8;
    var hdr = enc.encode(json + " ".repeat(pad)), head = new Uint8Array(4);
    new DataView(head.buffer).setUint32(0, hdr.length, true);
    var blob = new Blob([head, hdr, r.ts, r.ms, r.tr, r.ar, r.al]);
    if (typeof CompressionStream !== "undefined") blob = await new Response(blob.stream().pipeThrough(new CompressionStream("gzip"))).blob();
    return blob;
  }
  async function readBackup(file) {
    var blob = file, magic = new Uint8Array(await file.slice(0, 2).arrayBuffer());
    if (magic[0] === 0x1f && magic[1] === 0x8b) {
      if (typeof DecompressionStream === "undefined") throw new Error("This browser can't open that backup.");
      blob = await new Response(file.stream().pipeThrough(new DecompressionStream("gzip"))).blob();
    }
    var ab = await blob.arrayBuffer(), bad = new Error("That doesn't look like a backup made by this site.");
    if (ab.byteLength < 12) throw bad;
    var hl = new DataView(ab).getUint32(0, true), h;
    try { h = JSON.parse(new TextDecoder().decode(new Uint8Array(ab, 4, hl))); } catch (e) { throw bad; }
    var n = h && h.v === 1 ? h.n : -1, off = 4 + hl;
    if (!(n >= 0) || !Array.isArray(h.strs) || off % 8 || ab.byteLength !== off + n * 24) throw bad;
    return unpack({ ts: new Float64Array(ab, off, n), ms: new Int32Array(ab, off + n * 8, n), tr: new Int32Array(ab, off + n * 12, n), ar: new Int32Array(ab, off + n * 16, n), al: new Int32Array(ab, off + n * 20, n), strs: h.strs, hasAlbum: h.hasAlbum, files: h.files });
  }

  /* ---------------- the Spotify library: shared settings, merges and helpers ----------------
     Time zone, the "count a play after" cutoff and album/song merges are set once (in the Spotify
     library tool, or in the import window) and used by every tool. Merges are applied when numbers
     are pulled out, so the saved plays themselves never change. */
  var SRC = (document.currentScript && document.currentScript.src) || location.href;
  var LIBKEY = "musicTools.library.v1";
  function detectTZ() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch (e) { return "UTC"; } }
  function getLib() {
    var s = null; try { s = JSON.parse(localStorage.getItem(LIBKEY) || "null"); } catch (e) {}
    s = s && typeof s === "object" ? s : {};
    var r = s.rules && typeof s.rules === "object" ? s.rules : {};
    return { tz: typeof s.tz === "string" && s.tz ? s.tz : detectTZ(), minSec: isFinite(s.minSec) && s.minSec >= 0 ? +s.minSec : 30,
      rules: { albums: r.albums && typeof r.albums === "object" ? r.albums : {}, songs: r.songs && typeof r.songs === "object" ? r.songs : {} }, migrated: !!s.migrated };
  }
  function setLib(L) { try { localStorage.setItem(LIBKEY, JSON.stringify(L)); return true; } catch (e) { return false; } }
  var hasOwn = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); };
  function canonName(map, n) { var g = 0; while (map && hasOwn(map, n) && g++ < 20) n = map[n]; return n; }
  // rules saved in the library, plus any the tool itself holds: { artist: { from: to } }
  function combinedRules(kind, tool) {
    var L = getLib().rules[kind] || {}, out = {};
    Object.keys(L).forEach(function (a) { out[a] = Object.assign({}, L[a]); });
    Object.keys(tool || {}).forEach(function (a) { out[a] = Object.assign(out[a] || {}, tool[a]); });
    return out;
  }
  function addRule(L, kind, artist, from, to) {
    if (!from || !to || from === to) return false;
    var a = L.rules[kind][artist] || (L.rules[kind][artist] = {});
    if (canonName(a, to) === from) return false;   // would loop
    Object.keys(a).forEach(function (k) { if (a[k] === from) a[k] = to; });
    a[from] = to; return true;
  }
  function removeRule(L, kind, artist, from) {
    var a = L.rules[kind][artist]; if (!a) return;
    delete a[from]; if (!Object.keys(a).length) delete L.rules[kind][artist];
  }
  var KEPT_P = null;
  function ensureKept() {
    if (!KEPT_P) KEPT_P = loadKept().then(function (k) { if (!KEPT) KEPT = k; return KEPT; }, function () { STORE_OK = false; return KEPT; });
    return KEPT_P;
  }
  // folds freshly read plays into the saved history and saves it
  async function addToKept(inc) {
    await ensureKept();
    var r, err = "";
    if (!KEPT || !KEPT.n) { KEPT = inc; r = { added: inc.n, dup: 0 }; } else r = mergeDB(KEPT, inc);
    if (!STORE_OK) err = "This browser can't keep saved data here, so the plays are available for this visit only.";
    else { try { await saveKept(); } catch (e) { err = "Couldn't save the plays in this browser (" + e.message + "). They're available for this visit only."; } }
    return { added: r.added, dup: r.dup, err: err };
  }
  async function downloadBackup() {
    if (!KEPT || !KEPT.n) return;
    var blob = await backupBlob(KEPT), a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "music-tools-history-" + new Date().toISOString().slice(0, 10) + ".mthist";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }
  async function clearKept() {
    await idbRun("readwrite", function (s) { return s.delete("plays"); });
    KEPT = null; KEPT_P = Promise.resolve(null);
  }
  function libStatus() {
    if (!KEPT || !KEPT.n) return null;
    var lo = Infinity, hi = -Infinity;
    for (var i = 0; i < KEPT.n; i++) { var t = KEPT.ts[i]; if (t < lo) lo = t; if (t > hi) hi = t; }
    return { n: KEPT.n, lo: lo, hi: hi, files: KEPT.files, hasAlbum: KEPT.hasAlbum, artists: new Set(KEPT.ar).size, mb: Math.max(0.1, Math.round(KEPT.n * 24 / 1e5) / 10) };
  }
  function libArtists(limit) {
    if (!KEPT) return [];
    var minMs = getLib().minSec * 1000, c = new Map();
    for (var i = 0; i < KEPT.n; i++) if (KEPT.ms[i] >= minMs) c.set(KEPT.ar[i], (c.get(KEPT.ar[i]) || 0) + 1);
    return Array.from(c.entries()).sort(function (a, b) { return b[1] - a[1]; }).slice(0, limit || 300).map(function (e) { return { name: KEPT.strs[e[0]], plays: e[1] }; });
  }
  // every album (or song) one artist has, with plays, most played first
  function libItems(artist, kind) {
    if (!KEPT) return [];
    var ai = KEPT.map.get(artist); if (ai === undefined) return [];
    var minMs = getLib().minSec * 1000, arr = kind === "songs" ? KEPT.tr : KEPT.al, m = new Map();
    for (var i = 0; i < KEPT.n; i++) { if (KEPT.ar[i] !== ai || KEPT.ms[i] < minMs) continue; var it = arr[i]; if (it >= 0) m.set(it, (m.get(it) || 0) + 1); }
    return Array.from(m.entries()).sort(function (a, b) { return b[1] - a[1]; }).map(function (e) { return { name: KEPT.strs[e[0]], plays: e[1] }; });
  }
  // every artist's albums (or songs) in one pass: [{ artist, plays, items:[{name, plays}] }]
  function libAllItems(kind) {
    if (!KEPT) return [];
    var minMs = getLib().minSec * 1000, arr = kind === "songs" ? KEPT.tr : KEPT.al, per = new Map(), tot = new Map(), i;
    for (i = 0; i < KEPT.n; i++) {
      if (KEPT.ms[i] < minMs) continue;
      tot.set(KEPT.ar[i], (tot.get(KEPT.ar[i]) || 0) + 1);
      var it = arr[i]; if (it < 0) continue;
      var k = KEPT.ar[i] * 4194304 + it; per.set(k, (per.get(k) || 0) + 1);
    }
    var by = new Map();
    per.forEach(function (c, k) { var a = Math.floor(k / 4194304); if (!by.has(a)) by.set(a, []); by.get(a).push({ name: KEPT.strs[k % 4194304], plays: c }); });
    var out = [];
    by.forEach(function (items, a) { items.sort(function (x, y) { return y.plays - x.plays; }); out.push({ artist: KEPT.strs[a], plays: tot.get(a) || 0, items: items }); });
    return out.sort(function (x, y) { return y.plays - x.plays; });
  }
  SP.lib = {
    get: getLib, set: setLib, addRule: addRule, removeRule: removeRule, canon: canonName,
    ready: ensureKept, status: libStatus, artists: libArtists, items: libItems, allItems: libAllItems, backup: downloadBackup, clear: clearKept,
    addFiles: async function (files, say) { return addToKept(await readFiles(files, say || function () {})); },
    restore: async function (file) { return addToKept(await readBackup(file)); },
    storeOk: function () { return STORE_OK; }, zones: function () { return zones(); }, page: function (rel) { return new URL(rel, SRC).href; }
  };

  /* ---------------- time helpers ---------------- */
  function localizer(tz) {
    var fmt = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" });
    var cache = new Map();
    return function (t) {
      var h = Math.floor(t / 3600000), o = cache.get(h);
      if (o === undefined) {
        var p = {}; fmt.formatToParts(h * 3600000).forEach(function (x) { p[x.type] = x.value; });
        o = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - h * 3600000; cache.set(h, o);
      }
      return t + o;   // the time as if the local clock were UTC
    };
  }
  function zones() {
    var detected = "UTC";
    try { detected = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch (e) {}
    var list = [];
    try { if (Intl.supportedValuesOf) list = Intl.supportedValuesOf("timeZone"); } catch (e) {}
    if (list.indexOf(detected) < 0) list.unshift(detected);
    if (list.indexOf("UTC") < 0) list.push("UTC");
    return { list: list, detected: detected };
  }
  function coverage() {
    var lo = Infinity, hi = -Infinity;
    for (var i = 0; i < DB.n; i++) { var t = DB.ts[i]; if (t < lo) lo = t; if (t > hi) hi = t; }
    return { lo: lo, hi: hi };
  }
  var MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var fmtMonth = function (t) { var d = new Date(t); return MON[d.getUTCMonth()] + " " + d.getUTCFullYear(); };

  /* ---------------- aggregating ---------------- */
  function topN(counts, n) {   // Map -> keys by count, most first
    return Array.from(counts.entries()).sort(function (a, b) { return b[1] - a[1]; }).slice(0, n).map(function (e) { return e[0]; });
  }
  // Play counts per period (day, week, month or year) shaped for the Streams table maker.
  function tableAgg(o) {
    var P = window.Periods, g = o.grain || "month", ws = o.ws == null ? 1 : o.ws;
    var L = localizer(o.tz), N = DB.n, minMs = o.minSec * 1000, NONE = 2147483647, i;
    var moA = new Int32Array(N).fill(NONE), ordA = new Int32Array(N).fill(NONE);
    var moCache = new Map(), ordCache = new Map(), maxM = -1, maxO = -Infinity;
    for (i = 0; i < N; i++) {
      if (DB.ms[i] < minMs) continue;
      var day = Math.floor(L(DB.ts[i]) / 86400000), m = moCache.get(day), od;
      if (m === undefined) { var c = P.civil(day); m = c[0] * 12 + c[1] - 1; moCache.set(day, m); od = P.ordOfDay(g, day, ws); ordCache.set(day, od); }
      else od = ordCache.get(day);
      moA[i] = m; ordA[i] = od; if (m > maxM) maxM = m; if (od > maxO) maxO = od;
    }
    // days and weeks keep only the most recent stretch; months and years keep everything
    var minO = (g === "day" || g === "week") && o.back > 0 ? maxO - o.back + 1 : -Infinity;
    var inRange = function (m) { return o.range === "all" ? true : o.range === "last12" ? m > maxM - 12 : (m >= +o.range * 12 && m < +o.range * 12 + 12); };
    var kind = o.kind, S = DB.strs, plays = 0;
    var groupOf = function (i) { return kind === "artists" ? 0 : DB.ar[i]; };
    // names the user has merged before (for example two editions of one album) are counted as one
    var redirect = new Map();
    var AL = combinedRules(kind, o.aliases);
    Object.keys(AL).forEach(function (an) {
      var gi = kind === "artists" ? 0 : DB.map.get(an), al = AL[an]; if (gi === undefined) return;
      Object.keys(al).forEach(function (from) {
        var fi = DB.map.get(from); if (fi === undefined) return;
        redirect.set(gi * 4194304 + fi, intern(DB, canonName(al, from)));
      });
    });
    var rawItem = function (i) { return kind === "artists" ? DB.ar[i] : kind === "albums" ? DB.al[i] : DB.tr[i]; };
    var itemOf = function (i) { var it = rawItem(i); if (it < 0 || !redirect.size) return it; var r = redirect.get(groupOf(i) * 4194304 + it); return r === undefined ? it : r; };
    var perArtist = new Map(), perItem = new Map();     // plays in the chosen range, used to rank
    for (i = 0; i < N; i++) {
      if (moA[i] === NONE || !inRange(moA[i])) continue;
      perArtist.set(DB.ar[i], (perArtist.get(DB.ar[i]) || 0) + 1);
      var it = itemOf(i); if (it < 0) continue;
      var k = groupOf(i) * 4194304 + it; perItem.set(k, (perItem.get(k) || 0) + 1);
    }
    var groups = [];   // [{name, items:[strIndex]}]
    if (kind === "artists") groups.push({ gi: 0, name: "Artists", items: topN(new Map(Array.from(perItem.entries()).map(function (e) { return [e[0] % 4194304, e[1]]; })), o.n) });
    else {
      var chosen = [];
      if (o.top5) chosen = topN(perArtist, 5);
      else { var want = String(o.artist || "").trim().toLowerCase(), hit = -1; S.forEach(function (s, ix) { if (hit < 0 && s.toLowerCase() === want && perArtist.has(ix)) hit = ix; }); if (hit >= 0) chosen = [hit]; }
      if (!chosen.length) throw new Error("No plays found for that artist in this range.");
      chosen.forEach(function (a) {
        var m = new Map(); perItem.forEach(function (c, k) { if (Math.floor(k / 4194304) === a) m.set(k % 4194304, c); });
        groups.push({ gi: a, name: S[a], items: topN(m, o.n) });
      });
    }
    if (!groups.some(function (g) { return g.items.length; })) throw new Error(kind === "albums" ? "No album names found in that range." : "No plays found in that range.");
    var want2 = new Map();   // group*4194304+item -> { c: { periodNumber: plays } }
    groups.forEach(function (gr) { gr.items.forEach(function (it) { want2.set(gr.gi * 4194304 + it, { c: {} }); }); });
    for (i = 0; i < N; i++) {
      if (ordA[i] === NONE || ordA[i] < minO) continue;
      var it2 = itemOf(i); if (it2 < 0) continue;
      var rec = want2.get(groupOf(i) * 4194304 + it2); if (!rec) continue;
      rec.c[ordA[i]] = (rec.c[ordA[i]] || 0) + 1; plays++;
    }
    var out = {};
    groups.forEach(function (gr) {
      var vals = {};
      gr.items.forEach(function (it) {
        var rec = want2.get(gr.gi * 4194304 + it), m = {};
        Object.keys(rec.c).forEach(function (od) { m[P.key(g, +od, ws)] = rec.c[od]; });
        vals[S[it]] = m;
      });
      out[gr.name] = { order: gr.items.map(function (it) { return S[it]; }), vals: vals };
    });
    var names = groups.map(function (gr) { return gr.name; }), count = groups.reduce(function (a, gr) { return a + gr.items.length; }, 0);
    var noun = kind === "artists" ? "artist" : kind === "albums" ? "album" : "song";
    var by = g === "month" ? "" : ", " + P.ADJ[g];
    return { result: { grain: g, ws: ws, artists: out }, summary: "Imported " + count + " " + noun + (count === 1 ? "" : "s") + (kind === "artists" ? "" : " by " + (names.length > 3 ? names.slice(0, 3).join(", ") + "…" : names.join(", "))) + " from Spotify" + by + " (" + plays.toLocaleString("en-US") + " plays counted)." };
  }
  // Weekly play counts per song, shaped for the Personal chart maker.
  function chartAgg(o) {
    var L = localizer(o.tz), N = DB.n, minMs = o.minSec * 1000, i, perWeek = new Map(), lastDay = -Infinity;
    var songRedirect = new Map(), SR = getLib().rules.songs;   // songs merged in the library count as one
    Object.keys(SR).forEach(function (an) {
      var ai = DB.map.get(an); if (ai === undefined) return;
      Object.keys(SR[an]).forEach(function (from) { var fi = DB.map.get(from); if (fi !== undefined) songRedirect.set(ai * 4194304 + fi, intern(DB, canonName(SR[an], from))); });
    });
    for (i = 0; i < N; i++) {
      if (DB.ms[i] < minMs) continue;
      var local = L(DB.ts[i]), day = Math.floor(local / 86400000), dow = (day + 4) % 7;
      if (day > lastDay) lastDay = day;
      var we = day + ((o.weekEnd - dow + 7) % 7), w = perWeek.get(we);
      if (!w) { w = new Map(); perWeek.set(we, w); }
      var tx = songRedirect.get(DB.ar[i] * 4194304 + DB.tr[i]), k = (tx === undefined ? DB.tr[i] : tx) * 4194304 + DB.ar[i]; w.set(k, (w.get(k) || 0) + 1);
    }
    var ends = Array.from(perWeek.keys()).sort(function (a, b) { return a - b; });
    if (!ends.length) throw new Error("No plays counted. Try a lower play length.");
    var latest = ends[ends.length - 1];
    if (o.skipLast && lastDay < latest) { ends.pop(); latest = ends[ends.length - 1]; }
    if (!ends.length) throw new Error("Only one partial week of data. Untick \"skip the last week if it's incomplete\".");
    var first = o.weeks > 0 ? Math.max(ends[0], latest - 7 * (o.weeks - 1)) : ends[0];
    var out = {}, plays = 0, count = 0, S = DB.strs;
    for (var we2 = first; we2 <= latest; we2 += 7) {
      var m = perWeek.get(we2), list = [];
      if (m) topN(m, o.cap).forEach(function (k) { var n = m.get(k); plays += n; list.push({ t: S[Math.floor(k / 4194304)], a: S[k % 4194304], n: n }); });
      out[new Date(we2 * 86400000).toISOString().slice(0, 10)] = list; count++;
    }
    return { result: out, meta: { weekStart: (o.weekEnd + 1) % 7 }, summary: "Imported " + count + " week" + (count === 1 ? "" : "s") + " from Spotify (" + plays.toLocaleString("en-US") + " plays counted)." };
  }

  /* ---------------- the dialog ---------------- */
  var CSS =
    "dialog.spdlg{border:none;border-radius:18px;padding:0;max-width:min(580px,calc(100vw - 24px));width:100%;background:var(--paper);color:var(--ink);box-shadow:0 20px 60px rgba(0,0,0,.35);font:inherit}" +
    "dialog.spdlg::backdrop{background:rgba(30,22,18,.5)}" +
    "dialog.spdlg .spin{padding:22px 24px 20px}" +
    "dialog.spdlg h2{margin:0 0 6px;font-size:22px}" +
    "dialog.spdlg .row{display:flex;flex-wrap:wrap;gap:10px 14px;align-items:center;margin:0 0 12px}" +
    "dialog.spdlg .drop{border:2px dashed var(--line);border-radius:14px;padding:16px;text-align:center;margin:12px 0}" +
    "dialog.spdlg .drop.over{background:var(--soft);border-color:var(--ink)}" +
    "dialog.spdlg .spopts{border-top:1px solid var(--line);margin-top:14px;padding-top:14px}" +
    "dialog.spdlg .spwarn{color:var(--danger);font-size:15px}" +
    "dialog.spdlg input[type=number]{width:84px}" +
    "dialog.spdlg input[type=text]{width:240px}";
  function el(html) { var d = document.createElement("div"); d.innerHTML = html; return d.firstElementChild; }
  function opt(v, label, sel) { return '<option value="' + v + '"' + (sel ? " selected" : "") + ">" + label + "</option>"; }

  SP.open = function (cfg) {
    if (!document.getElementById("spstyle")) { var st = document.createElement("style"); st.id = "spstyle"; st.textContent = CSS; document.head.appendChild(st); }
    var dlg = document.querySelector("dialog.spdlg");
    if (dlg) dlg.remove();
    var L = getLib(), Z = zones(), isTable = cfg.mode === "table", kind = cfg.kind || "albums";
    var zoneList = Z.list.indexOf(L.tz) < 0 ? [L.tz].concat(Z.list) : Z.list;
    var zoneOpts = zoneList.map(function (z) { return opt(z, z.replace(/_/g, " "), z === L.tz); }).join("");
    var noun = kind === "artists" ? "artists" : kind === "albums" ? "albums" : "songs";
    var DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    var dayOpts = function (sel) { return DAYS.map(function (d, i) { return opt(i, d + (i === 5 ? " (Fri–Thu, like Billboard)" : ""), i === sel); }).join(""); };
    var g0 = cfg.grain || "month", ws0 = cfg.ws == null ? 1 : cfg.ws;
    var tableOpts =
      '<div class="row"><label>Period <select id="sp-grain">' + [["day", "Day"], ["week", "Week"], ["month", "Month"], ["year", "Year"]].map(function (x) { return opt(x[0], x[1], x[0] === g0); }).join("") + '</select></label>' +
      '<label id="sp-wsl">Weeks start on <select id="sp-ws">' + dayOpts(ws0) + '</select></label>' +
      '<label id="sp-backl">Go back <select id="sp-back"></select></label></div>' +
      '<p class="msg" id="sp-gnote"></p>' +
      '<div class="row"><label>Rank by plays in <select id="sp-range"></select></label>' +
      '<label>How many ' + noun + ' <input type="number" id="sp-n" min="1" max="40" value="10"></label></div>' +
      (kind === "artists" ? "" :
        '<div class="row"><label>Artist <input type="text" id="sp-artist" list="sp-artists" placeholder="Artist name" autocomplete="off"></label>' +
        (cfg.single ? "" : '<label><input type="checkbox" id="sp-top5"> Use my 5 most-played artists instead</label>') + '</div><datalist id="sp-artists"></datalist>');
    var chartOpts =
      '<div class="row"><label>Weeks start on <select id="sp-wstart">' + dayOpts(cfg.weekStart == null ? 5 : cfg.weekStart) + '</select></label>' +
      '<label>Weeks to import <select id="sp-weeks">' + opt(8, "Last 8") + opt(12, "Last 12", true) + opt(26, "Last 26") + opt(52, "Last 52") + opt(0, "All of them") + '</select></label></div>' +
      '<div class="row"><label><input type="checkbox" id="sp-skip" checked> Skip the last week if it\'s incomplete</label></div>' +
      '<p class="msg">Billboard\'s weeks run Friday to Thursday, so Friday is the default. The top 100 songs of each week are kept.</p>';
    dlg = el('<dialog class="spdlg" aria-labelledby="sp-h"><div class="spin">' +
      '<h2 id="sp-h">Import from your Spotify library</h2>' +
      '<p class="msg" id="sp-sum">Looking for saved history…</p>' +
      '<details id="sp-add"><summary>Add or update Spotify files</summary>' +
      '<p class="msg">Choose the zip you downloaded from Spotify, or the Streaming_History JSON files inside it. Files are read in this browser and aren\'t uploaded anywhere. Your plays are saved in this browser, so later you only add a newer export.</p>' +
      '<div class="drop" id="sp-drop"><label class="filebtn">Choose files<input type="file" id="sp-file" accept=".zip,.json" multiple hidden></label>' +
      '<div class="msg" id="sp-status" style="margin-top:8px">or drop them here</div></div></details>' +
      '<p class="msg">The <a id="sp-liblink" href="' + SP.lib.page("spotify-library/index.html") + '">Spotify library</a> is where you merge album editions, back up or delete your history.</p>' +
      '<div class="spopts" id="sp-opts" hidden>' +
      '<div class="row"><label>Time zone <select id="sp-tz">' + zoneOpts + '</select></label>' +
      '<label>Count a play after <input type="number" id="sp-sec" min="0" max="300" value="' + L.minSec + '"> sec</label></div>' +
      (isTable ? tableOpts : chartOpts) +
      '<div class="msg spwarn" id="sp-warn"></div></div>' +
      '<div class="row" style="margin-top:14px"><button id="sp-go" disabled>Import</button><button class="alt" id="sp-close" type="button">Close</button></div>' +
      '</div></dialog>');
    document.body.appendChild(dlg);
    var $ = function (id) { return dlg.querySelector("#" + id); };
    var status = $("sp-status"), warn = $("sp-warn"), sum = $("sp-sum"), addBox = $("sp-add"), note = "";

    function fillOptions() {
      var c = coverage(), ys = [], y0 = new Date(c.lo).getUTCFullYear(), y1 = new Date(c.hi).getUTCFullYear();
      sum.textContent = DB.n.toLocaleString("en-US") + " plays from " + fmtMonth(c.lo) + " to " + fmtMonth(c.hi) + (DB === KEPT ? " are saved in this browser." : " (this visit only).") + (note ? " " + note : "");
      $("sp-opts").hidden = false; $("sp-go").disabled = false;
      if (isTable) {
        for (var y = y1; y >= y0; y--) ys.push(opt(y, String(y)));
        $("sp-range").innerHTML = opt("last12", "the last 12 months", !cfg.allTime) + ys.join("") + opt("all", "all time", !!cfg.allTime);
        if (kind !== "artists") {
          var cnt = new Map(); for (var i = 0; i < DB.n; i++) cnt.set(DB.ar[i], (cnt.get(DB.ar[i]) || 0) + 1);
          var top = topN(cnt, 300);
          $("sp-artists").innerHTML = top.map(function (a) { return '<option value="' + DB.strs[a].replace(/"/g, "&quot;") + '">'; }).join("");
          if (!$("sp-artist").value) $("sp-artist").value = cfg.artist || DB.strs[top[0]];
        }
        if (kind === "albums" && !DB.hasAlbum) warn.textContent = "These files have no album names (the account data only covers songs and artists). Albums needs the extended streaming history.";
      }
    }
    var BACK = { day: [[14, "14 days"], [30, "30 days"], [60, "60 days"], [90, "90 days"], [180, "180 days"]], week: [[12, "12 weeks"], [26, "26 weeks"], [52, "52 weeks"], [104, "104 weeks"]] };
    var GNOTE = { day: "Each day becomes one column. Only the most recent days are kept so the table stays a readable size.",
      week: "Weeks run from the day you pick. Only the most recent weeks are kept.",
      month: "", year: "Each year becomes one column. Everything in your history is kept." };
    if (cfg.allTime) {
      BACK.day.unshift([0, "All time"]); BACK.week.unshift([0, "All time"]);
      GNOTE.day = "Every day from your first play is kept. Pick a shorter stretch for a closer look.";
      GNOTE.week = "Weeks run from the day you pick, from your first play on.";
    }
    function syncGrain() {
      if (!isTable) return;
      var g = $("sp-grain").value, b = BACK[g], def = cfg.allTime ? 0 : 1;
      $("sp-wsl").hidden = g !== "week"; $("sp-backl").hidden = !b;
      if (b) { var cur = $("sp-back").value; $("sp-back").innerHTML = b.map(function (x, ix) { return opt(x[0], x[1], cur ? String(x[0]) === cur : ix === def); }).join(""); }
      $("sp-gnote").textContent = GNOTE[g] || ""; $("sp-gnote").hidden = !GNOTE[g];
    }
    if (isTable) { $("sp-grain").addEventListener("change", function () { $("sp-back").innerHTML = ""; syncGrain(); }); syncGrain(); }
    function showFail(e) { status.textContent = ""; warn.textContent = e.message; $("sp-opts").hidden = !DB; $("sp-go").disabled = !DB; if (DB) fillOptions(); }
    async function load(files) {
      if (!files || !files.length) return;
      $("sp-go").disabled = true; $("sp-opts").hidden = true; warn.textContent = ""; note = "";
      try {
        var inc = await readFiles(files, function (m) { status.textContent = m; });
        status.textContent = "Saving…";
        var r = await addToKept(inc);
        DB = KEPT; status.textContent = "or drop more files here";
        note = r.added.toLocaleString("en-US") + " new play" + (r.added === 1 ? "" : "s") + " added" + (r.dup ? ", " + r.dup.toLocaleString("en-US") + " already saved" : "") + ".";
        fillOptions(); if (r.err) warn.textContent = r.err;
      } catch (e) { showFail(e); }
    }
    $("sp-file").addEventListener("change", function (e) { load(e.target.files); e.target.value = ""; });
    var drop = $("sp-drop");
    ["dragenter", "dragover"].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add("over"); }); });
    ["dragleave", "drop"].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove("over"); }); });
    drop.addEventListener("drop", function (e) { load(e.dataTransfer.files); });
    $("sp-close").addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("close", function () { dlg.remove(); });
    $("sp-go").addEventListener("click", function () {
      if (!DB) return;
      warn.textContent = "";
      var base = { tz: $("sp-tz").value, minSec: Math.max(0, Number($("sp-sec").value) || 0) }, r;
      var L2 = getLib(); L2.tz = base.tz; L2.minSec = base.minSec; setLib(L2);   // shared by every tool
      try {
        if (isTable) {
          if (kind === "albums" && !DB.hasAlbum) throw new Error("These files have no album names. Use the extended streaming history for albums, or switch to Songs or Artists.");
          var gsel = $("sp-grain").value;
          r = tableAgg(Object.assign(base, { kind: kind, grain: gsel, ws: Number($("sp-ws").value), back: gsel === "day" || gsel === "week" ? Number($("sp-back").value) : 0, aliases: cfg.aliases || {}, range: $("sp-range").value, n: Math.min(40, Math.max(1, Number($("sp-n").value) || 10)),
            artist: kind === "artists" ? "" : $("sp-artist").value, top5: kind !== "artists" && !cfg.single && $("sp-top5").checked }));
        } else {
          var wstart = Number($("sp-wstart").value);
          r = chartAgg(Object.assign(base, { weekEnd: (wstart + 6) % 7, weeks: Number($("sp-weeks").value), skipLast: $("sp-skip").checked, cap: 100 }));
        }
      } catch (e) { warn.textContent = e.message; return; }
      cfg.onImport(r.result, r.summary, r.meta); dlg.close();
    });
    dlg.showModal();
    var none = function () { sum.textContent = "No saved history yet. Add your Spotify files below."; addBox.open = true; };
    if (DB) fillOptions();   // plays already loaded this visit
    else ensureKept().then(function (k) {
      if (!dlg.isConnected) return;
      if (k && !DB) { DB = k; fillOptions(); } else if (!DB) none();
    });
  };
  SP._test = { addPlays: addPlays, blankDB: blankDB, tableAgg: function (o, db) { DB = db; return tableAgg(o); }, chartAgg: function (o, db) { DB = db; return chartAgg(o); } };
})();
