// Inline SVG illustrations. Each one has parts with class names that the
// CSS animations in styles.css target (.jaw, .wing-l, .flame, .beam …).

function starPoints(cx, cy, outer, inner, n) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = (Math.PI * i) / n - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

export const lion = () => `
<svg class="art art-lion" viewBox="0 0 200 200" aria-hidden="true">
  <defs>
    <radialGradient id="mane" cx="50%" cy="55%" r="55%">
      <stop offset="0" stop-color="#e38b2c"/><stop offset="1" stop-color="#7a3a0c"/>
    </radialGradient>
  </defs>
  <g class="lion-head">
    <polygon class="mane" points="${starPoints(100, 108, 96, 70, 16)}" fill="url(#mane)"/>
    <polygon class="mane mane-2" points="${starPoints(100, 108, 80, 62, 14)}" fill="#a8531a" opacity=".8"/>
    <circle cx="62" cy="66" r="15" fill="#e9a54f"/><circle cx="62" cy="66" r="8" fill="#c77b35"/>
    <circle cx="138" cy="66" r="15" fill="#e9a54f"/><circle cx="138" cy="66" r="8" fill="#c77b35"/>
    <ellipse cx="100" cy="112" rx="54" ry="58" fill="#f2b45a"/>
    <path class="brow brow-l" d="M70 90 Q82 82 92 90" stroke="#8a4a14" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path class="brow brow-r" d="M108 90 Q118 82 130 90" stroke="#8a4a14" stroke-width="4" fill="none" stroke-linecap="round"/>
    <g class="eyes">
      <ellipse cx="82" cy="101" rx="7" ry="8" fill="#fff"/><circle cx="83" cy="102" r="4.5" fill="#3a1d06"/>
      <ellipse cx="118" cy="101" rx="7" ry="8" fill="#fff"/><circle cx="117" cy="102" r="4.5" fill="#3a1d06"/>
    </g>
    <ellipse cx="100" cy="138" rx="32" ry="24" fill="#fbe2b6"/>
    <g class="jaw">
      <ellipse cx="100" cy="150" rx="20" ry="16" fill="#6b0f12"/>
      <ellipse cx="100" cy="158" rx="11" ry="6" fill="#d9475c"/>
      <path d="M84 139 l4 9 l4 -9 Z M108 139 l4 9 l4 -9 Z" fill="#fff"/>
      <path d="M86 162 l4 -7 l4 7 Z M106 162 l4 -7 l4 7 Z" fill="#fff"/>
    </g>
    <path d="M90 122 Q100 118 110 122 L103 132 Q100 135 97 132 Z" fill="#4a2208"/>
    <path class="smile" d="M88 140 Q100 150 112 140" stroke="#4a2208" stroke-width="3" fill="none" stroke-linecap="round"/>
    <g fill="#8a4a14"><circle cx="82" cy="135" r="1.8"/><circle cx="76" cy="140" r="1.8"/><circle cx="118" cy="135" r="1.8"/><circle cx="124" cy="140" r="1.8"/></g>
  </g>
</svg>`;

export const eagle = () => `
<svg class="art art-eagle" viewBox="0 0 200 160" aria-hidden="true">
  <g class="eagle-body">
    <path class="wing wing-l" d="M92 78 C60 40 30 34 4 44 C22 50 26 56 16 60 C34 62 36 68 26 72 C44 74 46 80 38 84 C58 84 74 88 92 92 Z" fill="#c8102e" stroke="#7a0616" stroke-width="2"/>
    <path class="wing wing-r" d="M108 78 C140 40 170 34 196 44 C178 50 174 56 184 60 C166 62 164 68 174 72 C156 74 154 80 162 84 C142 84 126 88 108 92 Z" fill="#c8102e" stroke="#7a0616" stroke-width="2"/>
    <path d="M86 84 Q100 70 114 84 L112 118 Q100 132 88 118 Z" fill="#a50d25"/>
    <path d="M90 118 L84 140 L96 128 L100 144 L104 128 L116 140 L110 118 Z" fill="#7a0616"/>
    <circle cx="100" cy="70" r="15" fill="#fff"/>
    <path d="M110 66 Q124 68 120 78 Q116 74 108 75 Z" fill="#ffd23f" stroke="#c99a00" stroke-width="1.5"/>
    <circle cx="104" cy="66" r="2.6" fill="#111"/>
    <path d="M96 60 Q104 56 110 61" stroke="#7a0616" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  </g>
</svg>`;

export const balloon = () => `
<svg class="art art-balloon" viewBox="0 0 120 170" aria-hidden="true">
  <g class="balloon-body">
    <path d="M60 4 C22 4 6 34 10 62 C14 88 40 104 48 118 L72 118 C80 104 106 88 110 62 C114 34 98 4 60 4 Z" fill="#f28c28"/>
    <path d="M60 4 C44 4 34 34 36 62 C38 88 48 104 52 118 L68 118 C72 104 82 88 84 62 C86 34 76 4 60 4 Z" fill="#fff1c1"/>
    <path d="M60 4 C54 4 50 34 51 62 C52 88 56 104 57 118 L63 118 C64 104 68 88 69 62 C70 34 66 4 60 4 Z" fill="#c8102e"/>
    <path d="M14 58 Q60 70 106 58" stroke="#8a3b12" stroke-width="2" fill="none" opacity=".5"/>
    <path class="flame" d="M60 128 Q54 120 60 110 Q66 120 60 128 Z" fill="#ffd23f"/>
    <g stroke="#6b3a1a" stroke-width="1.5"><line x1="48" y1="118" x2="50" y2="136"/><line x1="72" y1="118" x2="70" y2="136"/></g>
    <rect x="46" y="136" width="28" height="18" rx="3" fill="#8a5a2b"/>
    <rect x="46" y="136" width="28" height="4" fill="#6b3a1a"/>
  </g>
</svg>`;

export const pyramids = () => `
<svg class="art art-pyramids" viewBox="0 0 400 120" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <polygon points="40,120 130,30 220,120" fill="#d9a55b"/><polygon points="130,30 220,120 150,120" fill="#b9853f"/>
  <polygon points="190,120 270,48 350,120" fill="#e0b16c"/><polygon points="270,48 350,120 285,120" fill="#bf8e49"/>
  <polygon points="330,120 375,78 420,120" fill="#d9a55b"/><polygon points="375,78 420,120 385,120" fill="#b9853f"/>
  <rect y="116" width="400" height="4" fill="#b9853f"/>
</svg>`;

export const stage = () => `
<svg class="art art-stage" viewBox="0 0 200 150" aria-hidden="true">
  <g class="beams">
    <polygon class="beam b1" points="40,0 20,150 70,150" fill="#ff4fd8" opacity=".35"/>
    <polygon class="beam b2" points="100,0 75,150 125,150" fill="#ffd23f" opacity=".35"/>
    <polygon class="beam b3" points="160,0 130,150 180,150" fill="#4fd8ff" opacity=".35"/>
  </g>
  <g class="eq">
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect class="eqb eqb-${i}" x="${37 + i * 18}" y="70" width="12" height="60" rx="3" fill="#fff"/>`).join('')}
  </g>
  <g class="mic" transform="translate(92 38)">
    <rect x="4" y="16" width="8" height="26" rx="3" fill="#ddd"/>
    <circle cx="8" cy="10" r="10" fill="#333" stroke="#ddd" stroke-width="2"/>
  </g>
</svg>`;

export const ART = { lion, eagle, balloon, concert: stage };

export const cloud = (cls = '') => `
<svg class="cloud ${cls}" viewBox="0 0 120 50" aria-hidden="true"><path d="M20 45 Q0 45 6 30 Q8 18 24 20 Q30 4 50 8 Q66 0 78 14 Q98 10 100 26 Q118 28 112 42 Q110 46 100 45 Z" fill="#fff" opacity=".9"/></svg>`;
