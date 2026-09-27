// Full-screen purchase celebrations and small download animations.
// kind: 'lion' | 'eagle' | 'balloon' | 'concert'
import { ART, pyramids, cloud } from './art.js';
import { SOUNDS } from './sound.js';
import { esc, prefersReducedMotion } from './util.js';

const CONFETTI = {
  lion: ['#f6c945', '#2f7d32', '#e38b2c', '#fff'],
  eagle: ['#c8102e', '#fff', '#ffd23f'],
  balloon: ['#f28c28', '#fff1c1', '#c8102e', '#4fb3ff'],
  concert: ['#ff4fd8', '#4fd8ff', '#ffd23f', '#9b5cff'],
};

const SHOUT = { lion: 'ROAAAR!', eagle: 'YALLA AHLY!', balloon: 'Up we go!', concert: 'Showtime!' };

function scene(kind) {
  switch (kind) {
    case 'lion':
      return `<div class="scene scene-lion">
        <div class="shock"></div><div class="shock s2"></div><div class="shock s3"></div>
        <div class="actor">${ART.lion()}</div>
      </div>`;
    case 'eagle':
      return `<div class="scene scene-eagle">
        <div class="flags">${'<span></span>'.repeat(10)}</div>
        <div class="actor">${ART.eagle()}</div>
      </div>`;
    case 'balloon':
      return `<div class="scene scene-balloon">
        <div class="sun"></div>
        ${cloud('c1')}${cloud('c2')}${cloud('c3')}
        <div class="actor">${ART.balloon()}</div>
        <div class="ground">${pyramids()}</div>
      </div>`;
    default:
      return `<div class="scene scene-concert">
        <div class="notes">${'♪♫♬♩♪♫'.split('').map((n) => `<span>${n}</span>`).join('')}</div>
        <div class="actor">${ART.concert()}</div>
      </div>`;
  }
}

export function confetti(host, colors, count = 90) {
  if (prefersReducedMotion()) return;
  const layer = document.createElement('div');
  layer.className = 'confetti';
  for (let i = 0; i < count; i++) {
    const p = document.createElement('i');
    p.style.left = Math.random() * 100 + '%';
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = Math.random() * 0.8 + 's';
    p.style.animationDuration = 2 + Math.random() * 1.8 + 's';
    p.style.setProperty('--drift', (Math.random() * 2 - 1) * 120 + 'px');
    p.style.setProperty('--spin', Math.random() * 1080 + 'deg');
    if (i % 3 === 0) p.style.borderRadius = '50%';
    layer.append(p);
  }
  host.append(layer);
}

// Resolves when the animation finishes or the user taps to skip.
export function celebrate(kind, { title = "You're going!", subtitle = '' } = {}) {
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = `celebrate celebrate-${kind}`;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', title);
    el.innerHTML = `
      ${scene(kind)}
      <div class="shout" aria-hidden="true">${SHOUT[kind]}</div>
      <div class="celebrate-text">
        <h2>${esc(title)}</h2>
        ${subtitle ? `<p>${esc(subtitle)}</p>` : ''}
        <button class="btn btn-light" type="button">See my tickets</button>
      </div>`;
    document.body.append(el);
    requestAnimationFrame(() => el.classList.add('play'));
    setTimeout(() => SOUNDS[kind]?.(1), kind === 'lion' ? 700 : kind === 'eagle' ? 300 : 150);
    setTimeout(() => {
      confetti(el, CONFETTI[kind]);
      if (kind === 'lion') el.classList.add('shake');
    }, kind === 'lion' ? 700 : 900);

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      el.classList.add('out');
      setTimeout(() => {
        el.remove();
        resolve();
      }, 400);
    };
    el.querySelector('button').addEventListener('click', finish);
    el.addEventListener('keydown', (e) => e.key === 'Escape' && finish());
    el.querySelector('button').focus({ preventScroll: true });
    setTimeout(finish, 6500);
  });
}

// Small animation played while a ticket file is being generated/downloaded.
export function miniCelebrate(kind) {
  const el = document.createElement('div');
  el.className = `mini-celebrate mini-${kind}`;
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<div class="mini-actor">${ART[kind]()}</div><div class="mini-label">${
    { lion: 'Roar! Saving your ticket…', eagle: 'Flying your ticket in…', balloon: 'Lifting your ticket…', concert: 'Dropping your ticket…' }[kind]
  }</div><div class="mini-progress"><span></span></div>`;
  document.body.append(el);
  requestAnimationFrame(() => el.classList.add('play'));
  SOUNDS[kind]?.(0.5);
  return {
    done() {
      el.classList.add('done');
      setTimeout(() => el.classList.add('out'), 700);
      setTimeout(() => el.remove(), 1100);
    },
  };
}
