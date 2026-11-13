/* Shared drawing helpers for the retro look of exported images. */
(function () {
  var D = '"Shrikhand","DM Sans","Avenir Next",Georgia,serif';
  var B = '"DM Sans","Avenir Next","Segoe UI",system-ui,sans-serif';
  function night(bg) { return String(bg).toUpperCase() === "#1B0F2E"; }
  function pal(bg) {
    return night(bg)
      ? { night: true, BG: "#1B0F2E", PAPER: "#2A1748", INK: "#FFEBC8", EDGE: "#A98BE8", SH: "#FF3E8E", MUTED: "#B79CE0", A: "#FF7A45", B: "#FFC93C", C: "#2DD4C0", PINK: "#FF3E8E" }
      : { night: false, BG: bg, PAPER: "#FFF8E1", INK: "#3B2418", EDGE: "#3B2418", SH: "#3B2418", MUTED: "#8A6A4F", A: "#E8591A", B: "#F2A900", C: "#14877F", PINK: "#C8341F" };
  }
  function rr(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  /* Whole-image backdrop: cream/night fill, halftone dots, stripes, heavy frame. */
  function backdrop(c, W, H, bg) {
    var p = pal(bg);
    c.fillStyle = p.BG; c.fillRect(0, 0, W, H);
    c.fillStyle = p.night ? "rgba(169,139,232,0.13)" : "rgba(59,36,24,0.09)";
    for (var y = 30, row = 0; y < H; y += 20, row++) for (var x = (row % 2 ? 20 : 10); x < W; x += 20) { c.beginPath(); c.arc(x, y, 2.2, 0, 6.2832); c.fill(); }
    [p.A, p.B, p.C].forEach(function (k, i) { c.fillStyle = k; c.fillRect(0, i * 6, W, 6); });
    c.fillStyle = p.INK; c.fillRect(0, 18, W, 3);
    c.strokeStyle = p.EDGE; c.lineWidth = 4; rr(c, 10, 26, W - 20, H - 36, 24); c.stroke();
    return p;
  }
  /* Rounded box with a hard offset shadow and a heavy outline. */
  function box(c, x, y, w, h, r, fill, p, off, lw) {
    off = off == null ? 6 : off; lw = lw || 3;
    if (off) { c.fillStyle = p.SH; rr(c, x + off, y + off, w, h, r); c.fill(); }
    c.fillStyle = fill; rr(c, x, y, w, h, r); c.fill();
    c.strokeStyle = p.EDGE; c.lineWidth = lw; rr(c, x, y, w, h, r); c.stroke();
  }
  /* Display heading with a stacked offset shadow. */
  function title(c, text, x, y, size, p, maxW) {
    c.font = "400 " + size + "px " + D; c.textBaseline = "alphabetic"; c.textAlign = "left";
    var t = text;
    if (maxW) { while (t.length > 1 && c.measureText(t).width > maxW) t = t.slice(0, -1); if (t !== text) t = t.replace(/\s+$/, "") + "…"; }
    var o = Math.max(2, Math.round(size / 16));
    c.fillStyle = p.night ? p.PINK : p.B; c.fillText(t, x + o * 2, y + o * 2);
    c.fillStyle = p.A; c.fillText(t, x + o, y + o);
    c.fillStyle = p.INK; c.fillText(t, x, y);
    c.strokeStyle = p.BG; c.lineWidth = 0;
  }
  /* Sticker pill: returns its width. */
  function pill(c, text, x, y, size, fill, p, rot) {
    c.save(); c.font = "700 " + size + "px " + B;
    var w = c.measureText(text).width + size * 1.4, h = size * 1.7;
    c.translate(x, y); if (rot) c.rotate(rot);
    box(c, 0, -h / 2, w, h, h / 2, fill, p, 3, 2.5);
    c.fillStyle = p.night && fill !== p.PAPER ? "#1B0F2E" : "#3B2418"; c.textAlign = "left"; c.textBaseline = "middle";
    c.fillText(text, size * 0.7, 1); c.restore(); return w;
  }
  /* Vinyl record, for decoration. */
  function vinyl(c, cx, cy, r, p) {
    c.save();
    c.fillStyle = "#1B0F2E"; c.beginPath(); c.arc(cx, cy, r, 0, 6.2832); c.fill();
    c.strokeStyle = "rgba(255,235,200,0.14)"; c.lineWidth = 1.5;
    for (var k = 0.45; k < 0.97; k += 0.1) { c.beginPath(); c.arc(cx, cy, r * k, 0, 6.2832); c.stroke(); }
    c.fillStyle = p.A; c.beginPath(); c.arc(cx, cy, r * 0.3, 0, 6.2832); c.fill();
    c.fillStyle = p.B; c.beginPath(); c.arc(cx, cy, r * 0.12, 0, 6.2832); c.fill();
    c.fillStyle = "#1B0F2E"; c.beginPath(); c.arc(cx, cy, r * 0.035, 0, 6.2832); c.fill();
    c.strokeStyle = p.EDGE; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, r, 0, 6.2832); c.stroke();
    c.restore();
  }
  window.RetroGfx = { D: D, B: B, pal: pal, night: night, rr: function (c, x, y, w, h, r) { rr(c, x, y, w, h, r); }, backdrop: backdrop, box: box, title: title, pill: pill, vinyl: vinyl };
})();
