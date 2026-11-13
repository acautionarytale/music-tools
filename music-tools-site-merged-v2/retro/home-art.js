/* Illustrations for the home cards. Colors come from the site's CSS variables, so they follow light and dark. */
(function () {
  var O = 'class="o"';
  function star(x, y, r) { return '<path class="td-f" d="M' + x + ' ' + (y - r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x - r) + ' ' + y + 'Q' + x + ' ' + y + ' ' + x + ' ' + (y - r) + 'Z"/>'; }
  function burst(cx, cy, r1, r2, n) { var d = ''; for (var i = 0; i < n * 2; i++) { var a = Math.PI * i / n, r = i % 2 ? r1 : r2; d += (i ? 'L' : 'M') + (cx + r * Math.cos(a)).toFixed(1) + ' ' + (cy + r * Math.sin(a)).toFixed(1); } return d + 'Z'; }
  function dots(id) { return '<pattern id="dt-' + id + '" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="7" cy="7" r="1.8" class="dotc"/></pattern><rect width="400" height="250" fill="url(#dt-' + id + ')"/>'; }
  function head(id, body) { return '<svg class="art" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">' + dots(id) + body + '</svg>'; }
  var A = {};

  /* album rating card: sleeve with colored tiles, record, score badge */
  var tiles = ['#C8341F', '#E8591A', '#F2A900', '#D3C23A', '#A9B52E', '#7FA533', '#3F9B6A', '#14877F', '#F6C945'], tl = '';
  tiles.forEach(function (c, i) { tl += '<rect x="' + (86 + (i % 3) * 40) + '" y="' + (84 + Math.floor(i / 3) * 40) + '" width="34" height="34" rx="6" fill="' + c + '" class="o2"/>'; });
  A['album-rating'] = head('a',
    '<g class="spin"><circle cx="268" cy="136" r="84" fill="#1B0F2E" class="o"/>' +
    '<circle cx="268" cy="136" r="66" fill="none" stroke="#FFEBC8" stroke-opacity=".16" stroke-width="2"/><circle cx="268" cy="136" r="50" fill="none" stroke="#FFEBC8" stroke-opacity=".16" stroke-width="2"/>' +
    '<circle cx="268" cy="136" r="28" class="p1 o"/><circle cx="268" cy="136" r="7" fill="#1B0F2E"/></g>' +
    '<g transform="rotate(-5 140 140)"><rect x="66" y="64" width="152" height="152" rx="14" class="sh"/><rect x="58" y="56" width="152" height="152" rx="14" class="pp o"/>' +
    '<g transform="translate(-8 -8)">' + tl + '</g></g>' +
    '<circle cx="318" cy="198" r="40" class="sh"/><circle cx="312" cy="192" r="40" fill="#7FA533" class="o"/>' +
    '<text x="312" y="205" text-anchor="middle" class="disp td" font-size="36">8.2</text>' +
    star(48, 214, 14) + star(352, 70, 10));

  /* sorter: two songs facing off */
  A['song-sorter'] = head('b',
    '<g transform="rotate(-7 110 140)"><rect x="46" y="86" width="138" height="116" rx="14" class="sh"/><rect x="38" y="78" width="138" height="116" rx="14" class="pp o"/>' +
    '<text x="107" y="148" text-anchor="middle" class="disp ink" font-size="58">A</text><rect x="60" y="164" width="94" height="9" rx="4.5" class="p2 o2"/><rect x="60" y="178" width="60" height="7" rx="3.5" class="soft o2"/></g>' +
    '<g transform="rotate(6 290 140)"><rect x="226" y="72" width="146" height="124" rx="14" class="sh"/><rect x="218" y="64" width="146" height="124" rx="14" class="p2 o"/>' +
    '<text x="291" y="138" text-anchor="middle" class="disp td" font-size="60">B</text><rect x="240" y="156" width="102" height="9" rx="4.5" class="pp o2"/><rect x="240" y="170" width="64" height="7" rx="3.5" class="pp o2"/>' +
    '<path d="M268 34l9 14 15-6-3 17h-42l-3-17 15 6z" class="p2 o2" transform="translate(-6 20)"/></g>' +
    '<path d="' + burst(200, 134, 26, 40, 9) + '" class="sh" transform="translate(5 5)"/><path d="' + burst(200, 134, 26, 40, 9) + '" class="p3 o"/>' +
    '<text x="200" y="146" text-anchor="middle" class="disp td" font-size="30" transform="rotate(-8 200 134)">VS</text>');

  /* personal chart: a podium of chart rows */
  function row(y, n, fill, w, arrow, hi) {
    return '<rect x="64" y="' + (y + 6) + '" width="284" height="48" rx="12" class="sh"/><rect x="56" y="' + y + '" width="284" height="48" rx="12" class="' + fill + ' o"/>' +
      '<text x="84" y="' + (y + 36) + '" text-anchor="middle" class="disp ' + (hi ? 'td' : 'ink') + '" font-size="32">' + n + '</text>' +
      '<rect x="112" y="' + (y + 14) + '" width="' + w + '" height="10" rx="5" class="' + (hi ? 'pp' : 'p2') + ' o2"/><rect x="112" y="' + (y + 30) + '" width="' + (w - 46) + '" height="7" rx="3.5" class="' + (hi ? 'pp' : 'soft') + ' o2"/>' +
      '<rect x="278" y="' + (y + 13) + '" width="48" height="22" rx="11" class="' + arrow + ' o2"/>' +
      '<path d="' + (arrow === 'p3' ? 'M302 ' + (y + 18) + 'l7 11h-14z' : 'M302 ' + (y + 30) + 'l7-11h-14z') + '" fill="#FFF8E1"/>';
  }
  A['personal-chart'] = head('c', row(62, 1, 'p1', 120, 'p3', true) + row(120, 2, 'pp', 104, 'p1', false) + row(178, 3, 'pp', 88, 'p3', false) +
    '<path d="' + burst(360, 118, 20, 30, 10) + '" class="p3 o2"/><text x="360" y="128" text-anchor="middle" class="disp td" font-size="26" transform="rotate(10 360 118)">#1</text>');

  /* streams table: a colored grid with a percent sticker */
  var cells = [['p3', '+12'], ['p1', '-4'], ['p3', '+22'], ['p1', '-9'], ['p1', '-6'], ['p3', '+8'], ['p1', '-3'], ['p3', '+31'], ['p3', '+5'], ['p3', '+17'], ['p1', '-12'], ['p1', '-2']], g = '';
  cells.forEach(function (c, i) {
    var x = 62 + (i % 4) * 66, y = 98 + Math.floor(i / 4) * 42;
    g += '<rect x="' + x + '" y="' + y + '" width="58" height="34" rx="9" class="' + c[0] + ' o2"/><text x="' + (x + 29) + '" y="' + (y + 23) + '" text-anchor="middle" class="tx td">' + c[1] + '%</text>';
  });
  A['streams-table'] = head('d',
    '<rect x="58" y="62" width="284" height="176" rx="16" class="sh" transform="translate(7 -1)"/><rect x="50" y="48" width="284" height="176" rx="16" class="pp o"/>' +
    '<rect x="62" y="62" width="58" height="14" rx="7" class="p2 o2"/><rect x="128" y="66" width="40" height="7" rx="3.5" class="soft"/><rect x="194" y="66" width="40" height="7" rx="3.5" class="soft"/><rect x="260" y="66" width="40" height="7" rx="3.5" class="soft"/>' +
    g + '<circle cx="346" cy="204" r="32" class="sh" transform="translate(4 4)"/><circle cx="346" cy="204" r="32" class="p2 o"/><text x="346" y="218" text-anchor="middle" class="disp td" font-size="40" transform="rotate(10 346 204)">%</text>');

  /* cumulative graph: sunset, rising lines, outlined dots */
  var sun = '', cols = ['#FFC93C', '#FF7A45', '#FF3E8E'];
  A['cumulative-streams'] = head('e',
    '<clipPath id="sunclip"><circle cx="200" cy="232" r="118"/></clipPath><g clip-path="url(#sunclip)"><rect x="80" y="110" width="240" height="140" fill="#FFC93C"/><rect x="80" y="150" width="240" height="14" fill="#FF7A45"/><rect x="80" y="178" width="240" height="18" fill="#FF3E8E"/><rect x="80" y="212" width="240" height="26" fill="#B0206B"/></g>' +
    '<rect x="30" y="228" width="340" height="6" rx="3" fill="#FFEBC8" opacity=".9"/>' +
    '<g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M48 214C110 206 160 190 200 160S300 100 352 70" stroke="#1B0F2E" stroke-width="15"/><path d="M48 214C110 206 160 190 200 160S300 100 352 70" stroke="#2DD4C0" stroke-width="7"/>' +
    '<path d="M48 216C120 214 180 204 230 180S310 150 352 130" stroke="#1B0F2E" stroke-width="15"/><path d="M48 216C120 214 180 204 230 180S310 150 352 130" stroke="#FFEBC8" stroke-width="7"/></g>' +
    '<circle cx="352" cy="70" r="13" fill="#2DD4C0" stroke="#1B0F2E" stroke-width="5"/><circle cx="352" cy="130" r="13" fill="#FFEBC8" stroke="#1B0F2E" stroke-width="5"/>');

  /* spotify library: a crate of records and an arrow dropping in */
  var recs = [[118, '#FF7A45'], [168, '#2DD4C0'], [218, '#FFC93C'], [268, '#FF3E8E']], r = '';
  recs.forEach(function (c, i) { r += '<g transform="rotate(' + (i * 3 - 4) + ' ' + c[0] + ' 142)"><circle cx="' + c[0] + '" cy="110" r="62" fill="#1B0F2E" class="o"/><circle cx="' + c[0] + '" cy="110" r="38" fill="none" stroke="#FFEBC8" stroke-opacity=".15" stroke-width="2"/><circle cx="' + c[0] + '" cy="110" r="21" fill="' + c[1] + '" stroke="#1B0F2E" stroke-width="3"/><circle cx="' + c[0] + '" cy="110" r="4" fill="#1B0F2E"/></g>'; });
  A['spotify-library'] = head('f', r +
    '<rect x="64" y="154" width="270" height="76" rx="12" class="sh" transform="translate(7 5)"/><rect x="56" y="146" width="270" height="76" rx="12" class="p2 o"/>' +
    '<path d="M56 172H326M56 198H326" stroke-width="3" class="line"/><rect x="152" y="158" width="78" height="14" rx="7" class="pp o2"/>' +
    '<path d="M200 12v26M184 28l16 16 16-16" fill="none" stroke="#FFEBC8" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M200 12v26M184 28l16 16 16-16" fill="none" stroke="#1B0F2E" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>');

  window.HOME_ART = A;
})();
