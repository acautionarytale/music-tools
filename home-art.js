/* Illustrations for the home cards, drawn in the classic palette. They follow light and dark through the page's CSS variables. */
(function () {
  function dots(id) { return '<pattern id="dt-' + id + '" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="8" cy="8" r="1.3" class="grain"/></pattern><rect width="400" height="250" fill="url(#dt-' + id + ')"/>'; }
  function wrap(id, body) { return '<svg class="art" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">' + dots(id) + body + '</svg>'; }
  var A = {};

  /* album rating card */
  var tile = ['#E8A3A0', '#EDB1A0', '#F1BFA2', '#F4D3A4', '#F3E3A6', '#E1E3A5', '#CDE0AA', '#B8DAB0', '#A5D3B5'], t = '';
  tile.forEach(function (c, i) { t += '<rect x="' + (84 + (i % 3) * 21) + '" y="' + (74 + Math.floor(i / 3) * 21) + '" width="18" height="18" rx="4" fill="' + c + '"/>'; });
  function bar(y, w, c) { return '<rect x="148" y="' + y + '" width="140" height="8" rx="4" class="trk"/><rect x="148" y="' + y + '" width="' + w + '" height="8" rx="4" fill="' + c + '"/>'; }
  A['album-rating'] = wrap('a',
    '<g class="lift"><rect x="62" y="52" width="276" height="166" rx="18" class="pan edge"/>' +
    '<rect x="78" y="68" width="76" height="76" rx="12" class="soft"/>' + '<g transform="translate(-2 -2)">' + t + '</g>' +
    '<text x="174" y="92" class="ser ink" font-size="18" font-weight="700">Typical of Me</text><rect x="174" y="102" width="70" height="6" rx="3" class="mut"/>' +
    '<circle cx="308" cy="100" r="24" fill="#B8DAB0"/><text x="308" y="108" text-anchor="middle" class="ser" font-size="22" font-weight="700" fill="#3F3532">8.2</text>' +
    '<g transform="translate(-6 28)">' + bar(130, 120, '#A5D3B5') + bar(150, 96, '#CDE0AA') + bar(170, 130, '#92CBB4') + '</g>' +
    '<g class="mut"><rect x="86" y="168" width="40" height="6" rx="3"/><rect x="86" y="184" width="30" height="6" rx="3"/></g></g>' +
    '<circle cx="348" cy="58" r="7" fill="#F1BFA2" opacity=".9"/><circle cx="52" cy="206" r="9" fill="#8CB8D9" opacity=".8"/>');

  /* song sorter */
  A['song-sorter'] = wrap('b',
    '<g class="lift"><rect x="40" y="70" width="140" height="120" rx="18" class="pan edge"/><rect x="40" y="70" width="140" height="26" rx="18" fill="#E8A3A0" opacity=".9"/><rect x="40" y="86" width="140" height="10" fill="#E8A3A0" opacity=".9"/>' +
    '<text x="110" y="158" text-anchor="middle" class="ser ink" font-size="52" font-style="italic">A</text><rect x="64" y="170" width="92" height="7" rx="3.5" class="mut"/></g>' +
    '<g class="lift"><rect x="220" y="60" width="140" height="130" rx="18" class="pan edge" style="stroke:#92CBB4;stroke-width:2.5"/><rect x="220" y="60" width="140" height="26" rx="18" fill="#92CBB4"/><rect x="220" y="76" width="140" height="10" fill="#92CBB4"/>' +
    '<text x="290" y="154" text-anchor="middle" class="ser ink" font-size="52" font-style="italic">B</text><rect x="244" y="168" width="92" height="7" rx="3.5" class="mut"/>' +
    '<circle cx="344" cy="64" r="15" fill="#92CBB4" stroke="var(--panel)" stroke-width="3"/><path d="M337 64l5 5 9-10" fill="none" stroke="#3F3532" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></g>' +
    '<circle cx="200" cy="130" r="20" class="pan edge"/><text x="200" y="136" text-anchor="middle" class="ser mutf" font-size="16" font-style="italic">or</text>');

  /* personal chart */
  function row(y, n, w, c, up) {
    return '<rect x="62" y="' + y + '" width="276" height="46" rx="14" class="pan edge"/>' +
      '<text x="88" y="' + (y + 33) + '" text-anchor="middle" class="ser ink" font-size="28" font-weight="700">' + n + '</text>' +
      '<rect x="116" y="' + (y + 12) + '" width="' + w + '" height="9" rx="4.5" fill="' + c + '"/><rect x="116" y="' + (y + 28) + '" width="' + (w - 40) + '" height="6" rx="3" class="mut"/>' +
      '<rect x="286" y="' + (y + 12) + '" width="40" height="22" rx="11" fill="' + (up ? '#B8DAB0' : '#F1B3AE') + '"/><path d="' + (up ? 'M306 ' + (y + 17) + 'l6 10h-12z' : 'M306 ' + (y + 28) + 'l6-10h-12z') + '" fill="#3F3532"/>';
  }
  A['personal-chart'] = wrap('c', '<g class="lift">' + row(46, 1, 110, '#F1BFA2', true) + row(100, 2, 96, '#8CB8D9', false) + row(154, 3, 80, '#B195D4', true) + '</g>' +
    '<circle cx="58" cy="218" r="8" fill="#EDBC6B" opacity=".85"/>');

  /* streams table */
  var up = '#B8DAB0', dn = '#F1B3AE', vals = [[up, '+12'], [dn, '-4'], [up, '+22'], [dn, '-9'], [dn, '-6'], [up, '+8'], [dn, '-3'], [up, '+31'], [up, '+5'], [up, '+17'], [dn, '-12'], [dn, '-2']], g = '';
  vals.forEach(function (v, i) { var x = 76 + (i % 4) * 62, y = 96 + Math.floor(i / 4) * 40; g += '<rect x="' + x + '" y="' + y + '" width="54" height="32" rx="9" fill="' + v[0] + '"/><text x="' + (x + 27) + '" y="' + (y + 21) + '" text-anchor="middle" class="ser" font-size="15" font-weight="700" fill="#3F3532">' + v[1] + '%</text>'; });
  A['streams-table'] = wrap('d',
    '<g class="lift"><rect x="56" y="46" width="292" height="176" rx="18" class="pan edge"/>' +
    '<rect x="76" y="64" width="62" height="10" rx="5" fill="#F4D3A4"/><rect x="146" y="66" width="38" height="6" rx="3" class="mut"/><rect x="208" y="66" width="38" height="6" rx="3" class="mut"/><rect x="270" y="66" width="38" height="6" rx="3" class="mut"/>' +
    '<rect x="76" y="82" width="250" height="1.5" class="rule"/>' + g + '</g>');

  /* cumulative graph */
  A['cumulative-streams'] = wrap('e',
    '<g class="lift"><rect x="40" y="40" width="320" height="180" rx="18" class="pan edge"/>' +
    '<g class="rule"><rect x="64" y="84" width="272" height="1.5"/><rect x="64" y="124" width="272" height="1.5"/><rect x="64" y="164" width="272" height="1.5"/></g><rect x="64" y="196" width="272" height="2" class="axis"/>' +
    '<defs><linearGradient id="gA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8CB8D9" stop-opacity=".45"/><stop offset="1" stop-color="#8CB8D9" stop-opacity="0"/></linearGradient><linearGradient id="gB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E8A3A0" stop-opacity=".35"/><stop offset="1" stop-color="#E8A3A0" stop-opacity="0"/></linearGradient></defs>' +
    '<path d="M64 196C120 188 160 168 200 140S290 96 336 66V196Z" fill="url(#gA)"/><path d="M64 196C130 192 180 182 230 164S300 138 336 124V196Z" fill="url(#gB)"/>' +
    '<g fill="none" stroke-linecap="round"><path d="M64 196C120 188 160 168 200 140S290 96 336 66" stroke="#8CB8D9" stroke-width="4.5"/><path d="M64 196C130 192 180 182 230 164S300 138 336 124" stroke="#E8A3A0" stroke-width="4.5"/><path d="M64 196C140 194 200 190 260 180S316 172 336 168" stroke="#92CBB4" stroke-width="4.5"/></g>' +
    '<g><circle cx="336" cy="66" r="12" fill="#8CB8D9" opacity=".3"/><circle cx="336" cy="66" r="7" class="panf"/><circle cx="336" cy="66" r="4.5" fill="#8CB8D9"/><circle cx="336" cy="124" r="12" fill="#E8A3A0" opacity=".3"/><circle cx="336" cy="124" r="7" class="panf"/><circle cx="336" cy="124" r="4.5" fill="#E8A3A0"/><circle cx="336" cy="168" r="12" fill="#92CBB4" opacity=".3"/><circle cx="336" cy="168" r="7" class="panf"/><circle cx="336" cy="168" r="4.5" fill="#92CBB4"/></g></g>');

  /* spotify library: leaning sleeves and a record */
  A['spotify-library'] = wrap('f',
    '<g class="lift"><g transform="rotate(-9 120 150)"><rect x="70" y="70" width="110" height="110" rx="14" fill="#F1BFA2"/><circle cx="125" cy="125" r="30" fill="#FBF8F1" opacity=".55"/><circle cx="125" cy="125" r="9" fill="#F1BFA2"/></g>' +
    '<g transform="rotate(4 210 150)"><rect x="150" y="62" width="110" height="110" rx="14" fill="#8CB8D9"/><rect x="170" y="86" width="70" height="8" rx="4" fill="#FBF8F1" opacity=".6"/><rect x="170" y="104" width="46" height="8" rx="4" fill="#FBF8F1" opacity=".45"/></g>' +
    '<g transform="rotate(13 300 150)"><rect x="240" y="74" width="110" height="110" rx="14" fill="#B195D4"/><path d="M262 160c14-26 30-26 44-8s24 10 32-14" fill="none" stroke="#FBF8F1" stroke-width="5" stroke-linecap="round" opacity=".7"/></g></g>' +
    '<rect x="52" y="196" width="296" height="8" rx="4" class="shelf"/>' +
    '<path d="M200 22v24M188 36l12 12 12-12" fill="none" stroke="var(--ink)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/>');

  window.HOME_ART = A;
})();
