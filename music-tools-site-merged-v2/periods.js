/* ------------------------------------------------------------------
   Shared time-period helpers for the Streams table maker, the
   Cumulative streams graph and the Spotify importer.

   A dataset has one period ("grain"): day, week, month or year. Weeks
   also carry the weekday they start on (0 = Sunday ... 6 = Saturday).
   Each period is a whole number ("ordinal") so ranges are easy to walk,
   and a text key for saving: "2026-03-15" for a day or a week (its
   first day), "2026-03" for a month and "2026" for a year.
   Everything works in whole days, so there are no time-zone surprises.
   ------------------------------------------------------------------ */
(function () {
  var P = window.Periods = {};
  var DAY = 86400000;
  var MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  P.GRAINS = [["day","Day"],["week","Week"],["month","Month"],["year","Year"]];
  P.WEEKDAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  P.UNIT  = { day:"day", week:"week", month:"month", year:"year" };
  P.ADJ   = { day:"daily", week:"weekly", month:"monthly", year:"yearly" };
  P.CSVHEAD = { day:"Date", week:"Week starting", month:"Month", year:"Year" };
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };

  /* ---- days (whole days since 1970-01-01) ---- */
  P.dayOf = function (y, m, d) { return Math.floor(Date.UTC(y, m - 1, d) / DAY); };
  P.civil = function (day) { var d = new Date(day * DAY); return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()]; };
  P.dow = function (day) { return (((day + 4) % 7) + 7) % 7; };            // 1970-01-01 was a Thursday
  P.todayDay = function () { var n = new Date(); return P.dayOf(n.getFullYear(), n.getMonth() + 1, n.getDate()); };
  P.iso = function (day) { var c = P.civil(day); return c[0] + "-" + pad(c[1]) + "-" + pad(c[2]); };
  P.isoDay = function (s) { var m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(String(s)); return m ? P.dayOf(+m[1], +m[2], +m[3]) : null; };

  /* ---- periods ---- */
  var weekOff = function (ws) { return (((ws - 4) % 7) + 7) % 7; };
  P.ordOfDay = function (g, day, ws) {
    if (g === "day") return day;
    if (g === "week") return Math.floor((day - weekOff(ws)) / 7);
    var c = P.civil(day);
    return g === "month" ? c[0] * 12 + c[1] - 1 : c[0];
  };
  P.startDay = function (g, o, ws) {
    if (g === "day") return o;
    if (g === "week") return o * 7 + weekOff(ws);
    if (g === "month") return P.dayOf(Math.floor(o / 12), ((o % 12) + 12) % 12 + 1, 1);
    return P.dayOf(o, 1, 1);
  };
  P.endDay = function (g, o, ws) { return P.startDay(g, o + 1, ws) - 1; };
  P.len = function (g, o, ws) { return P.endDay(g, o, ws) - P.startDay(g, o, ws) + 1; };
  P.key = function (g, o, ws) {
    var s = P.startDay(g, o, ws);
    if (g === "day" || g === "week") return P.iso(s);
    var c = P.civil(s);
    return g === "month" ? c[0] + "-" + pad(c[1]) : String(c[0]);
  };
  P.ordOfKey = function (g, k, ws) {
    k = String(k); var m;
    if (g === "year") { m = /^(\d{4})/.exec(k); return m ? +m[1] : null; }
    if (g === "month") { m = /^(\d{4})-(\d{1,2})/.exec(k); return m ? +m[1] * 12 + +m[2] - 1 : null; }
    var d = P.isoDay(k); return d == null ? null : P.ordOfDay(g, d, ws);
  };
  P.latestOrd = function (g, ws) { return P.ordOfDay(g, P.todayDay(), ws); };

  /* ---- labels ---- */
  function fmtDay(day, withYear) { var c = P.civil(day); return MON[c[1] - 1] + " " + c[2] + (withYear ? ", " + c[0] : ""); }
  P.label = function (g, o, ws, short) {          // "Mar 2026", "Mar 15, 2026", "Mar 13–19, 2026", "2026"
    if (g === "year") return String(o);
    var s = P.startDay(g, o, ws), c = P.civil(s);
    if (g === "month") return short ? MON[c[1] - 1] : MON[c[1] - 1] + " " + c[0];
    if (g === "day") return fmtDay(s, !short);
    var e = P.endDay(g, o, ws), ce = P.civil(e);
    if (short) return fmtDay(s, false);
    if (c[0] !== ce[0]) return fmtDay(s, true) + " – " + fmtDay(e, true);
    if (c[1] !== ce[1]) return fmtDay(s, false) + " – " + fmtDay(e, false) + ", " + c[0];
    return MON[c[1] - 1] + " " + c[2] + "–" + ce[2] + ", " + c[0];
  };
  // The label under an axis tick, which marks the END of the period. Weeks use their last day.
  P.axisYear = function (g, o, ws) { return g === "year" ? o : P.civil(g === "week" ? P.endDay(g, o, ws) : P.startDay(g, o, ws))[0]; };
  P.axisLabel = function (g, o, ws, withYear) {
    if (g === "year") return String(o);
    var d = g === "week" ? P.endDay(g, o, ws) : P.startDay(g, o, ws), c = P.civil(d);
    if (g === "month") return MON[c[1] - 1] + (withYear ? " " + c[0] : "");
    return fmtDay(d, withYear);
  };
  // "Jan 2025 to Apr 2026", "Aug 14 to Oct 8, 2026", "2023 to 2026"
  P.spanLabel = function (g, o0, o1, ws) {
    if (g === "year") return o0 === o1 ? String(o0) : o0 + " to " + o1;
    if (g === "month") return o0 === o1 ? P.label(g, o0, ws) : P.label(g, o0, ws) + " to " + P.label(g, o1, ws);
    var s = P.startDay(g, o0, ws), e = P.endDay(g, o1, ws), same = P.civil(s)[0] === P.civil(e)[0];
    return fmtDay(s, !same) + " to " + fmtDay(e, true);
  };

  /* ---- the columns shown in the editor and the table image ---- */
  var DEFN = { day:14, week:12, month:12, year:8 }, MAXN = { day:31, week:26, month:12, year:12 };
  P.DEFN = DEFN; P.MAXN = MAXN;
  // ui: { year, n, end }. Months show one calendar year; the others show the n periods up to "end" (or the latest).
  P.window = function (g, ws, ui, latest) {
    var ords = [], i;
    if (g === "month") {
      var y = +ui.year || Math.floor(latest / 12);
      for (i = 0; i < 12; i++) ords.push(y * 12 + i);
    } else {
      var n = Math.max(2, Math.min(MAXN[g], Math.round(+ui.n) || DEFN[g]));
      var end = ui.end ? P.ordOfKey(g, ui.end, ws) : null;
      if (end == null) end = latest;
      for (i = 0; i < n; i++) ords.push(end - n + 1 + i);
    }
    return { ords: ords, prev: ords[0] - 1, all: [ords[0] - 1].concat(ords) };
  };

  /* ---- changing the period of saved numbers ---- */
  // Finer periods can be added up into coarser ones, never the other way round. A week that
  // straddles New Year counts toward the year it starts in.
  P.canConvert = function (g1, ws1, g2, ws2) {
    if (g1 === g2) return g1 !== "week" || ws1 === ws2;
    return (g1 === "day" && g2 !== "day") || (g1 === "week" && g2 === "year") || (g1 === "month" && g2 === "year");
  };
  P.rollKey = function (k, g1, ws1, g2, ws2) {
    var o = P.ordOfKey(g1, k, ws1); if (o == null) return null;
    return P.key(g2, P.ordOfDay(g2, P.startDay(g1, o, ws1), ws2), ws2);
  };
  // vals is { name: { key: number } }
  P.rollVals = function (vals, g1, ws1, g2, ws2) {
    var out = {};
    Object.keys(vals).forEach(function (n) {
      var src = vals[n] || {}, dst = {};
      Object.keys(src).forEach(function (k) {
        var nk = P.rollKey(k, g1, ws1, g2, ws2); if (nk == null || src[k] == null) return;
        dst[nk] = (dst[nk] || 0) + Number(src[k]);
      });
      out[n] = dst;
    });
    return out;
  };

  /* ---- older saves had 12-month arrays per year ---- */
  P.yearsToVals = function (years) {
    var vals = {};
    Object.keys(years || {}).forEach(function (y) {
      var yr = years[y] || {};
      Object.keys(yr).forEach(function (n) {
        var arr = yr[n]; if (!arr) return;
        for (var m = 0; m < 12; m++) if (arr[m] != null && isFinite(arr[m])) (vals[n] || (vals[n] = {}))[y + "-" + pad(m + 1)] = Number(arr[m]);
      });
    });
    return vals;
  };
  // The Streams table maker's saved set for one kind: { grain, ws, artists:{ name:{ order, vals } } } (older saves are upgraded).
  P.migrateSet = function (d) {
    if (!d || typeof d !== "object" || !d.artists || typeof d.artists !== "object") return null;
    if (d.grain) { if (typeof d.ws !== "number") d.ws = 1; return d; }
    var out = { grain: "month", ws: 1, artists: {} };
    Object.keys(d.artists).forEach(function (a) {
      var art = d.artists[a] || {};
      out.artists[a] = { order: (art.order || []).slice(), vals: art.vals || P.yearsToVals(art.years) };
    });
    return out;
  };
  P.hasValues = function (vals, names) {
    return (names || Object.keys(vals)).some(function (n) { var m = Object.prototype.hasOwnProperty.call(vals, n) ? vals[n] : null; return m && Object.keys(m).some(function (k) { return m[k] != null; }); });
  };

  /* ---- merging rows (for example two editions of one album) ---- */
  // A merge is remembered as an alias { "Fearless (Platinum Edition)": "Fearless" }, so later imports merge the same pair again.
  var own = function (o, k) { return Object.prototype.hasOwnProperty.call(o, k); };
  P.canon = function (aliases, n) { var g = 0; while (aliases && own(aliases, n) && g++ < 20) n = aliases[n]; return n; };
  // Rewrites { order, vals } so every aliased name becomes its target and their numbers are added together.
  P.applyAliases = function (order, vals, aliases) {
    if (!aliases || !Object.keys(aliases).length) return { order: order, vals: vals };
    var o2 = [], v2 = {};
    order.forEach(function (n) { var c = P.canon(aliases, n); if (o2.indexOf(c) < 0) o2.push(c); });
    Object.keys(vals).forEach(function (n) {
      var c = P.canon(aliases, n), src = vals[n] || {}, dst = own(v2, c) ? v2[c] : (v2[c] = {});
      Object.keys(src).forEach(function (k) { if (src[k] != null) dst[k] = (dst[k] || 0) + Number(src[k]); });
    });
    return { order: o2, vals: v2 };
  };
  // art is { order, vals, aliases? }. Adds row "from" into row "to", removes "from" and remembers the pairing.
  P.mergeRows = function (art, from, to) {
    if (from === to) return false;
    var src = own(art.vals, from) ? art.vals[from] : null, dst = own(art.vals, to) ? art.vals[to] : (art.vals[to] = {});
    if (src) Object.keys(src).forEach(function (k) { if (src[k] != null) dst[k] = (dst[k] || 0) + Number(src[k]); });
    delete art.vals[from];
    var i = art.order.indexOf(from); if (i >= 0) art.order.splice(i, 1);
    if (art.order.indexOf(to) < 0) art.order.push(to);
    var al = art.aliases || (art.aliases = {});
    Object.keys(al).forEach(function (k) { if (al[k] === from) al[k] = to; });
    al[from] = to;
    return true;
  };
  // "Fearless (Platinum Edition)" and "Fearless" share a base name; "Fearless (Taylor's Version)" does not.
  var ED = "deluxe|platinum|expanded|edition|bonus|remaster(?:ed)?|anniversary|special|international|extended|version|standard|explicit|clean|exclusive|tour|collector'?s|complete|digital|super|japan(?:ese)?|uk|us|european|reissue|re-?issue|apple music|limited|mono|stereo|radio edit|single version|album version";
  var EDRE = new RegExp("\\b(?:" + ED + ")\\b", "i");
  var OWNVER = /\b[\w]+['’]s version\b/i;           // "Taylor's Version" is a different recording, never an edition
  var isEd = function (t) { return EDRE.test(t) && !OWNVER.test(t); };
  var TRAIL = /(?:\s+(?:deluxe|platinum|expanded|special|international|extended|standard|anniversary|bonus|collector s|complete|digital|super|japan|japanese|uk|us|european|limited|tour|explicit|clean|exclusive|remastered|remaster)(?:\s+(?:edition|version|reissue|tracks?))*|\s+edition)+\s*$/;
  var plain = function (t) {
    t = String(t).normalize ? String(t).normalize("NFKD").replace(/[̀-ͯ]/g, "") : String(t);
    return t.toLowerCase().replace(/&/g, " and ").replace(/['’`]/g, "'").replace(/[^a-z0-9'\s]/g, " ").replace(/'/g, " ").replace(/\s+/g, " ").trim();
  };
  P.baseName = function (n) {
    var t = String(n);
    t = t.replace(/\s*[\(\[][^\)\]]*[\)\]]/g, function (m) { return isEd(m) ? "" : m; });      // (Deluxe Edition), [Remastered 2009]
    t = t.replace(/\s+[-–—]\s+(.*)$/, function (m, rest) { return isEd(rest) ? "" : m; });   // - Remastered 2011
    var b = plain(t), c = b.replace(TRAIL, "");                                                  // "Fearless Platinum Edition"
    return c && !/^(the|a|an)$/.test(c) ? c : b;
  };
  var lev = function (a, b) {
    if (a === b) return 0; if (Math.abs(a.length - b.length) > 2) return 3;
    var prev = [], i, j; for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) { var cur = [i]; for (j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
    return prev[b.length];
  };
  // "evermore" and "evermore the long version", or one-letter typos
  var near = function (x, y) {
    if (x === y || (/ s version\b/.test(x) !== / s version\b/.test(y))) return false;   // an own-version re-recording stays separate
    var s1 = x.length <= y.length ? x : y, l1 = x.length <= y.length ? y : x;
    if (s1.length >= 4 && l1.indexOf(s1 + " ") === 0) return true;
    var d = lev(x, y); return (x.length >= 7 && d <= 1) || (x.length >= 12 && d <= 2);
  };
  // Groups of names that look like the same thing: [{ names, strong }]. strong = same base name; otherwise "maybe".
  P.dupGroups = function (names) {
    var base = names.map(P.baseName), par = names.map(function (_, i) { return i; });
    var find = function (i) { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; };
    var join = function (i, j) { par[find(i)] = find(j); }, i, j, seen = Object.create(null);
    for (i = 0; i < names.length; i++) { if (!base[i]) continue; if (seen[base[i]] !== undefined) join(i, seen[base[i]]); else seen[base[i]] = i; }
    var uniq = Object.keys(seen);
    for (i = 0; i < uniq.length; i++) for (j = i + 1; j < uniq.length; j++) if (near(uniq[i], uniq[j])) join(seen[uniq[i]], seen[uniq[j]]);
    var by = Object.create(null), keys = [];
    names.forEach(function (n, k) { var r = find(k); if (!by[r]) { by[r] = []; keys.push(r); } by[r].push(k); });
    var out = [];
    keys.forEach(function (r) {
      var idx = by[r]; if (idx.length < 2) return;
      var bs = {}; idx.forEach(function (k) { bs[base[k]] = 1; });
      out.push({ names: idx.map(function (k) { return names[k]; }), strong: Object.keys(bs).length === 1 });
    });
    return out;
  };
  // pairs [from, to] that look like the same thing (clear matches only); the shortest name in each group is the target
  P.dupSuggestions = function (names) {
    var out = [];
    P.dupGroups(names).forEach(function (g) {
      if (!g.strong) return;
      var t = g.names.slice().sort(function (x, y) { return x.length - y.length; })[0];
      g.names.forEach(function (n) { if (n !== t) out.push([n, t]); });
    });
    return out;
  };
  P.guessTarget = function (name, names) {
    var b = P.baseName(name), best = null;
    names.forEach(function (n) { if (n !== name && P.baseName(n) === b && (best === null || n.length < best.length)) best = n; });
    return best;
  };

  /* ---- reading dates out of uploaded sheets ---- */
  // Returns { day, prec } where prec says how precise the cell was: "year", "month" or "day".
  P.parseWhen = function (v) {
    if (v instanceof Date) { var d = new Date(v.getTime() + 12 * 3600 * 1000); return { day: P.dayOf(d.getFullYear(), d.getMonth() + 1, d.getDate()), prec: "day" }; }
    if (typeof v === "number") {
      if (v > 20000 && v < 90000) return { day: Math.round(v - 25569), prec: "day" };       // an Excel date
      if (Number.isInteger(v) && v >= 1900 && v <= 2200) return { day: P.dayOf(v, 1, 1), prec: "year" };
      return null;
    }
    if (typeof v === "string") {
      var t = v.trim(), r;
      if ((r = /^(\d{4})$/.exec(t))) return { day: P.dayOf(+r[1], 1, 1), prec: "year" };
      if ((r = /^(\d{4})-(\d{1,2})$/.exec(t)) && +r[2] >= 1 && +r[2] <= 12) return { day: P.dayOf(+r[1], +r[2], 1), prec: "month" };
      if ((r = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(t)) && +r[2] >= 1 && +r[2] <= 12 && +r[3] >= 1 && +r[3] <= 31) return { day: P.dayOf(+r[1], +r[2], +r[3]), prec: "day" };
      var dd = new Date(t); if (!isNaN(dd)) return { day: P.dayOf(dd.getFullYear(), dd.getMonth() + 1, dd.getDate()), prec: "day" };
    }
    return null;
  };
  // Which period a sheet is in: plain years are yearly, first-of-month dates are monthly,
  // dates that all fall on one weekday are weekly, anything else is daily.
  P.inferGrain = function (rows) {
    if (!rows.length) return { grain: "month", ws: 1 };
    if (rows.every(function (r) { return r.prec === "year"; })) return { grain: "year", ws: 1 };
    if (rows.every(function (r) { return r.prec !== "day" || P.civil(r.day)[2] === 1; })) return { grain: "month", ws: 1 };
    var seen = {}, days = []; rows.forEach(function (r) { if (!seen[r.day]) { seen[r.day] = 1; days.push(r.day); } });
    if (days.length >= 2) { var w = P.dow(days[0]); if (days.every(function (d) { return P.dow(d) === w; })) return { grain: "week", ws: w }; }
    return { grain: "day", ws: 1 };
  };
})();
