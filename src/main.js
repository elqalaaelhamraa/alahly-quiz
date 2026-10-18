import '@fontsource/michroma/400.css';
import './styles.css';
import { renderHome } from './views/home.js';
import { renderVenue } from './views/venue.js';
import { renderBooking } from './views/booking.js';
import { renderOrder, renderMyTickets, renderSharedTicket } from './views/tickets.js';
import { soundOn, setSound, getOrders } from './store.js';
import { logo, splash, SLOGAN } from './brand.js';

const routes = [
  [/^#?\/?$/, renderHome],
  [/^#\/venue\/([\w-]+)$/, renderVenue],
  [/^#\/event\/([\w-]+)$/, renderBooking],
  [/^#\/order\/([\w-]+)$/, renderOrder],
  [/^#\/tickets$/, renderMyTickets],
  [/^#\/ticket\/(.+)$/, renderSharedTicket],
];

const app = document.getElementById('app');

function header() {
  const count = getOrders().reduce((n, o) => n + o.tickets.length, 0);
  return `
    <header class="topbar">
      <a class="brand" href="#/" aria-label="QPASS home">${logo({ size: 'sm' })}</a>
      <div class="topbar-actions">
        <button type="button" class="icon-btn" data-sound aria-pressed="${soundOn()}" title="Sound effects">${soundOn() ? '🔊' : '🔇'}</button>
        <a class="btn btn-sm btn-ghost" href="#/tickets">🎟️ Tickets${count ? ` <span class="count">${count}</span>` : ''}</a>
      </div>
    </header>`;
}

function footer() {
  return `
    <footer class="site-footer">
      ${logo({ size: 'md', slogan: true })}
      <span>Al Ahly Stadium · Giza Zoo · Pyramids Balloon · Concerts &amp; Events</span>
      <span>© ${new Date().getFullYear()} QPASS – ${SLOGAN}</span>
    </footer>`;
}

function route() {
  const hash = location.hash || '#/';
  const match = routes.map(([re, fn]) => [hash.match(re), fn]).find(([m]) => m);
  const view = document.createElement('main');
  view.className = 'view';
  app.innerHTML = header();
  app.append(view);
  app.insertAdjacentHTML('beforeend', footer());
  (match ? match[1] : renderHome)(view, ...(match ? match[0].slice(1) : []));
  window.scrollTo({ top: 0 });
}

app.addEventListener('click', (e) => {
  const b = e.target.closest('[data-sound]');
  if (!b) return;
  setSound(!soundOn());
  b.textContent = soundOn() ? '🔊' : '🔇';
  b.setAttribute('aria-pressed', soundOn());
});

window.addEventListener('hashchange', route);
splash();
route();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
}
