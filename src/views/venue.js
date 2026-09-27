import { venueById, eventsForVenue } from '../data/venues.js';
import { ART, pyramids } from '../art.js';
import { esc, money, dateBadge, fmtDate } from '../util.js';

export function renderVenue(root, id) {
  const v = venueById(id);
  if (!v) return (location.hash = '#/');
  const events = eventsForVenue(id).sort((a, b) => (a.date || a.from).localeCompare(b.date || b.from));

  root.innerHTML = `
    <section class="venue-hero" style="--from:${v.theme.from};--to:${v.theme.to};--accent:${v.theme.accent}">
      <a class="back" href="#/">← All destinations</a>
      ${v.id === 'balloon' ? `<div class="hero-ground">${pyramids()}</div>` : ''}
      <div class="venue-hero-art">${ART[v.animation]()}</div>
      <div class="venue-hero-text">
        <span class="chip">${esc(v.status)}</span>
        <h1>${esc(v.name)}</h1>
        <p>${esc(v.about)}</p>
        <small>📍 ${esc(v.location)}</small>
      </div>
    </section>

    <section class="section">
      <div class="section-head"><h2>Schedule</h2><span class="muted">${events.length} experiences</span></div>
      <div class="event-list">
        ${events.map((e) => eventRow(e)).join('')}
      </div>
    </section>`;
}

function eventRow(e) {
  const v = venueById(e.host || e.venue);
  const soon = e.status !== 'on_sale';
  const badge =
    e.dateMode === 'fixed'
      ? (() => {
          const b = dateBadge(e.date);
          return `<div class="date-badge"><b>${b.day}</b><span>${b.month}</span><small>${b.year}</small></div>`;
        })()
      : `<div class="date-badge daily"><b>Daily</b><span>from</span><small>${fmtDate(e.from, { month: 'short', year: 'numeric' })}</small></div>`;
  const from = e.tickets.length ? `From ${money(Math.min(...e.tickets.map((t) => t.price)))}` : 'Price TBA';
  return `
    <a class="event-row ${soon ? 'is-soon' : ''}" href="#/event/${e.id}" style="--from:${v.theme.from};--to:${v.theme.to}">
      ${badge}
      <div class="event-row-body">
        <h3>${esc(e.title)}</h3>
        <p>${esc(e.subtitle)}</p>
        <small>${e.host ? '📍 ' + esc(v.name) + ' · ' : ''}${esc(e.time || (e.slots || []).join(' · '))}</small>
      </div>
      <div class="event-row-cta">
        <span class="price">${from}</span>
        <span class="btn btn-sm ${soon ? 'btn-ghost' : ''}">${soon ? 'Notify me' : 'Book'}</span>
      </div>
    </a>`;
}
