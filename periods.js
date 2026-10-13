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
