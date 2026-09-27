import './styles.css';
import { renderHome } from './views/home.js';
import { renderVenue } from './views/venue.js';
import { renderBooking } from './views/booking.js';
import { renderOrder, renderMyTickets, renderSharedTicket } from './views/tickets.js';
import { soundOn, setSound, getOrders } from './store.js';

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
      <a class="brand" href="#/" aria-label="Home">
        <span class="brand-mark">AG</span><span>Ahly Group <b>Tickets</b></span>
      </a>
      <div class="topbar-actions">
        <button type="button" class="icon-btn" data-sound aria-pressed="${soundOn()}" title="Sound effects">${soundOn() ? '🔊' : '🔇'}</button>
        <a class="btn btn-sm btn-ghost" href="#/tickets">🎟️ Tickets${count ? ` <span class="count">${count}</span>` : ''}</a>
      </div>
    </header>`;
}

function route() {
  const hash = location.hash || '#/';
  const match = routes.map(([re, fn]) => [hash.match(re), fn]).find(([m]) => m);
  const view = document.createElement('main');
  view.className = 'view';
  app.innerHTML = header();
  app.append(view);
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
route();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
}
