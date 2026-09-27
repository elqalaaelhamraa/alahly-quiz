import { VENUES, EVENTS, venueById } from '../data/venues.js';
import { ART, pyramids } from '../art.js';
import { esc, money, dateBadge } from '../util.js';

export function renderHome(root) {
  const upcoming = EVENTS.filter((e) => e.status === 'on_sale' && e.dateMode === 'fixed')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  root.innerHTML = `
    <section class="home-hero">
      <p class="eyebrow">Ahly Group Tickets</p>
      <h1>Where are we going<span class="dot">?</span></h1>
      <p class="lead">One pass to the stadium, the zoo, the sky above the Pyramids and every show in between.</p>
    </section>

    <nav class="bars" aria-label="Choose a destination">
      ${VENUES.map(
        (v, i) => `
        <a class="bar bar-${v.id}" href="#/venue/${v.id}" style="--from:${v.theme.from};--to:${v.theme.to};--accent:${v.theme.accent};--i:${i}">
          ${v.id === 'balloon' ? `<div class="bar-ground">${pyramids()}</div>` : ''}
          <div class="bar-art">${ART[v.animation]()}</div>
          <div class="bar-text">
            <span class="chip">${esc(v.status)}</span>
            <h2>${esc(v.name)}</h2>
            <p>${esc(v.tagline)}</p>
          </div>
          <span class="bar-go" aria-hidden="true">→</span>
        </a>`,
      ).join('')}
    </nav>

    <section class="section">
      <div class="section-head"><h2>On sale now</h2></div>
      <div class="rail">
        ${upcoming
          .map((e) => {
            const v = venueById(e.host || e.venue);
            const b = dateBadge(e.date);
            const from = Math.min(...e.tickets.map((t) => t.price));
            return `
            <a class="rail-card" href="#/event/${e.id}" style="--from:${v.theme.from};--to:${v.theme.to}">
              <div class="rail-top">
                <div class="date-badge"><b>${b.day}</b><span>${b.month}</span><small>${b.year}</small></div>
                <div class="rail-art">${ART[v.animation]()}</div>
              </div>
              <div class="rail-body">
                <small>${esc(v.name)}</small>
                <h3>${esc(e.title)}</h3>
                <span class="from">From ${money(from)}</span>
              </div>
            </a>`;
          })
          .join('')}
      </div>
    </section>

    <section class="section perks">
      <div><b>🎟️ Buy for friends</b><span>Name every ticket and email it straight to them.</span></div>
      <div><b>📲 QR in seconds</b><span>Download, share or show your tickets from your phone.</span></div>
      <div><b>💳 Pay your way</b><span>Card, Fawry, mobile wallets and InstaPay.</span></div>
    </section>`;
}
