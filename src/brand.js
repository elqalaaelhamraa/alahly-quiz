// QPASS brand: the stylised Q (metallic ring + ticket tail with a teal glow)
// and the PASS wordmark, recreated as SVG/CSS for the web.

export const SLOGAN = 'your way in';
export const TEAL = '#19f0c3';

let uid = 0;

// Q mark. `edge` adds a faint light rim so the black Q still reads on dark backgrounds.
export function qMark({ edge = true, cls = '' } = {}) {
  const id = `q${++uid}`;
  return `
<svg class="q-mark ${cls}" viewBox="0 0 200 200" role="img" aria-label="QPASS">
  <defs>
    <linearGradient id="${id}m" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#4a4d52"/><stop offset=".28" stop-color="#121315"/>
      <stop offset=".52" stop-color="#2e3034"/><stop offset=".74" stop-color="#0b0b0c"/>
      <stop offset="1" stop-color="#1c1d20"/>
    </linearGradient>
    <linearGradient id="${id}t" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#2a2c30"/><stop offset=".5" stop-color="#0d0e10"/>
      <stop offset=".78" stop-color="#0f4a3f"/><stop offset="1" stop-color="${TEAL}"/>
    </linearGradient>
    <filter id="${id}g" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4"/></filter>
    <mask id="${id}n" maskUnits="userSpaceOnUse" x="-20" y="-40" width="160" height="80">
      <rect x="-20" y="-40" width="160" height="80" fill="#fff"/>
      <circle cx="105" cy="-19" r="7" fill="#000"/>
    </mask>
  </defs>
  <path class="q-glow" d="M66 164 A78 78 0 0 1 28 70" fill="none" stroke="${TEAL}" stroke-width="7" filter="url(#${id}g)" opacity=".9"/>
  <path class="q-ring" d="M146 122 A56 56 0 1 0 78 143" fill="none" stroke="url(#${id}m)" stroke-width="44"/>
  ${edge ? `<path d="M146 122 A56 56 0 1 0 78 143" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="45.5" style="mix-blend-mode:screen" opacity=".5"/>` : ''}
  <g class="q-tail" transform="translate(92 94) rotate(45)">
    <rect x="104" y="-14" width="22" height="28" rx="8" fill="${TEAL}" filter="url(#${id}g)" opacity=".8"/>
    <rect x="0" y="-19" width="128" height="38" rx="12" fill="url(#${id}t)" mask="url(#${id}n)"/>
    <line x1="105" y1="-12" x2="105" y2="17" stroke="#0b0b0c" stroke-width="1.6" stroke-dasharray="3 2.5" opacity=".5"/>
  </g>
</svg>`;
}

// Full lockup: Q + PASS (+ optional slogan underneath).
export function logo({ size = 'md', slogan = false, cls = '' } = {}) {
  return `
<span class="qpass qpass-${size} ${cls}">
  <span class="qpass-row">${qMark()}<span class="qpass-word" aria-hidden="true">PASS</span></span>
  ${slogan ? `<span class="qpass-slogan">${SLOGAN}</span>` : ''}
</span>`;
}

// Splash / intro screen – shown once per browser session while the app warms up.
export function splash() {
  let seen = false;
  try {
    seen = sessionStorage.getItem('qpass.splash') === '1';
    sessionStorage.setItem('qpass.splash', '1');
  } catch {
    /* storage blocked – just show it */
  }
  if (seen) return;
  const el = document.createElement('div');
  el.className = 'splash';
  el.setAttribute('role', 'status');
  el.innerHTML = `${logo({ size: 'xl', slogan: true })}<span class="splash-bar"><i></i></span>`;
  document.body.append(el);
  const close = () => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 500);
  };
  el.addEventListener('click', close);
  setTimeout(close, 1900);
}

// Plain SVG source of the Q mark (no light rim), for drawing on canvas.
export const qMarkSvgSource = () =>
  qMark({ edge: false }).trim().replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" ');
