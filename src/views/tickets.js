// Order confirmation, "My tickets" and the shareable single-ticket page.
import { eventById, venueById } from '../data/venues.js';
import { getOrders, getOrder, saveOrder } from '../store.js';
import { sendTickets, decodeTicket, ticketLink, ApiError } from '../api.js';
import { miniCelebrate, celebrate } from '../animations.js';
import { ticketPng, saveBlob, qrDataUrl } from '../ticketImage.js';
import { ART } from '../art.js';
import { esc, money, fmtDate, EMAIL_RE, toast, sleep } from '../util.js';

const kindOf = (t) => venueById(eventById(t.eventId).host || eventById(t.eventId).venue).animation;

function ticketCard(t, { actions = true } = {}) {
  const event = eventById(t.eventId);
  const venue = venueById(event.host || event.venue);
  return `
    <article class="ticket" data-id="${esc(t.id)}" style="--from:${venue.theme.from};--to:${venue.theme.to};--accent:${venue.theme.accent}">
      <div class="ticket-main">
        <div class="ticket-art">${ART[venue.animation]()}</div>
        <small>${esc(venue.name)}</small>
        <h3>${esc(event.title)}</h3>
        <dl>
          <div><dt>Date</dt><dd>${fmtDate(t.date)}</dd></div>
          <div><dt>Time</dt><dd>${esc(t.slot || event.time)}</dd></div>
          <div><dt>Ticket</dt><dd>${esc(t.typeName)}</dd></div>
          <div><dt>Holder</dt><dd>${esc(t.holder)}${t.self ? ' <span class="me">you</span>' : ''}</dd></div>
        </dl>
      </div>
      <div class="ticket-stub">
        <img class="qr" alt="QR code for ticket ${esc(t.id)}" data-code="${esc(t.code)}" width="150" height="150">
        <code>${esc(t.id)}</code>
        ${
          actions
            ? `<div class="ticket-actions">
                <button type="button" class="btn btn-sm" data-download="${esc(t.id)}">⬇ Download</button>
                <button type="button" class="btn btn-sm btn-ghost" data-send="${esc(t.id)}">✉ Send</button>
              </div>`
            : ''
        }
        ${t.sentTo ? `<small class="sent">✓ Sent to ${esc(t.sentTo)}</small>` : ''}
      </div>
    </article>`;
}

async function fillQrs(root) {
  for (const img of root.querySelectorAll('img.qr[data-code]')) {
    img.src = await qrDataUrl(img.dataset.code, 300);
  }
}

async function download(t) {
  const anim = miniCelebrate(kindOf(t));
  try {
    const [blob] = await Promise.all([ticketPng(t), sleep(1400)]);
    saveBlob(blob, `${t.id}.png`);
  } catch {
    toast('Could not create the ticket image.', 'error');
  } finally {
    anim.done();
  }
}

function openSendDialog(tickets, { defaultEmail = '', fromName = '' } = {}) {
  const dlg = document.createElement('dialog');
  dlg.className = 'modal';
  dlg.innerHTML = `
    <form method="dialog" class="modal-body">
      <h2>✉ Send ${tickets.length > 1 ? tickets.length + ' tickets' : 'ticket'} to a friend</h2>
      <p class="muted">${tickets.map((t) => `${esc(t.typeName)} · ${esc(t.holder)}`).join('<br>')}</p>
      <label class="field"><span>Friend’s email</span><input type="email" name="to" value="${esc(defaultEmail)}" required autofocus></label>
      <label class="field"><span>Message <small class="muted">(optional)</small></span><textarea name="msg" rows="2" maxlength="300" placeholder="See you there! 🎉"></textarea></label>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" value="cancel" data-cancel>Cancel</button>
        <button class="btn btn-primary" value="send">Send tickets</button>
      </div>
    </form>`;
  document.body.append(dlg);
  dlg.showModal();
  return new Promise((resolve) => {
    dlg.querySelector('[data-cancel]').onclick = () => dlg.close();
    dlg.querySelector('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const to = dlg.querySelector('[name=to]').value.trim();
      if (!EMAIL_RE.test(to)) return toast('Please enter a valid email.', 'error');
      const btn = dlg.querySelector('[value=send]');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner"></span> Sending…';
      try {
        const res = await sendTickets({ to, tickets, fromName, message: dlg.querySelector('[name=msg]').value.trim() });
        toast(res.mailto ? 'Opening your email app…' : res.demo ? `Sent to ${to} (demo mail server).` : `Sent to ${to}! 🎉`, 'success');
        dlg.close();
        resolve(to);
      } catch (err) {
        toast(err instanceof ApiError ? err.message : 'Could not send. Try again.', 'error');
        btn.disabled = false;
        btn.textContent = 'Send tickets';
      }
    });
    dlg.addEventListener('close', () => {
      dlg.remove();
      resolve(null);
    });
  });
}

export function renderOrder(root, id) {
  const order = getOrder(id);
  if (!order) {
    root.innerHTML = `<section class="section empty"><h2>Order not found</h2><p>It may have been bought on another device.</p><a class="btn" href="#/tickets">My tickets</a></section>`;
    return;
  }
  const event = eventById(order.eventId);
  const venue = venueById(event.host || event.venue);
  const pending = order.tickets.filter((t) => t.sendTo && !t.sentTo);
  if (!order.demo && pending.length) {
    pending.forEach((t) => (t.sentTo = t.sendTo)); // the server already emailed them
    saveOrder(order);
  }

  root.style.setProperty('--from', venue.theme.from);
  root.style.setProperty('--to', venue.theme.to);
  root.innerHTML = `
    <section class="order-hero">
      <a class="back" href="#/tickets">← My tickets</a>
      <h1>You’re going! 🎉</h1>
      <p>${esc(event.title)} · ${fmtDate(order.date)}</p>
      <p class="muted">Order ${esc(order.id)} · ${money(order.total)} · confirmation sent to ${esc(order.buyer.email)}</p>
      ${order.demo ? `<p class="demo-note">Demo mode – no payment was taken and no API server is connected.</p>` : ''}
      <div class="order-actions">
        <button type="button" class="btn btn-light" data-download-all>⬇ Download all</button>
        <button type="button" class="btn btn-ghost-light" data-replay>▶ Replay ${venue.animation === 'lion' ? 'roar' : 'celebration'}</button>
      </div>
    </section>
    ${
      order.demo && pending.length
        ? `<section class="section"><div class="card note-card">📨 ${pending.length} ticket${pending.length > 1 ? 's are' : ' is'} waiting to be emailed to friends. Tap <b>Send</b> on each one.</div></section>`
        : ''
    }
    <section class="section tickets">${order.tickets.map((t) => ticketCard(t)).join('')}</section>`;
  fillQrs(root);

  root.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const t = order.tickets.find((x) => x.id === (b.dataset.download || b.dataset.send));
    if (b.dataset.download) return download(t);
    if (b.dataset.send) {
      const to = await openSendDialog([t], { defaultEmail: t.friendEmail || t.sendTo || '', fromName: order.buyer.name });
      if (to) {
        t.sentTo = to;
        saveOrder(order);
        b.closest('.ticket').outerHTML = ticketCard(t);
        fillQrs(root);
      }
      return;
    }
    if ('downloadAll' in b.dataset) {
      for (const x of order.tickets) await download(x);
      return;
    }
    if ('replay' in b.dataset) celebrate(venue.animation, { title: "You're going!", subtitle: event.title });
  });
}

export function renderMyTickets(root) {
  const orders = getOrders();
  root.innerHTML = `
    <section class="section">
      <div class="section-head"><h1>My tickets</h1></div>
      ${
        orders.length
          ? `<div class="order-list">${orders
              .map((o) => {
                const e = eventById(o.eventId);
                const v = venueById(e.host || e.venue);
                return `<a class="order-row" href="#/order/${esc(o.id)}" style="--from:${v.theme.from};--to:${v.theme.to}">
                  <div class="order-row-art">${ART[v.animation]()}</div>
                  <div><b>${esc(e.title)}</b><small>${fmtDate(o.date)} · ${o.tickets.length} ticket${o.tickets.length > 1 ? 's' : ''}</small></div>
                  <span>→</span></a>`;
              })
              .join('')}</div>`
          : `<div class="empty"><p>No tickets yet.</p><a class="btn btn-primary" href="#/">Find something to do</a></div>`
      }
    </section>`;
}

export function renderSharedTicket(root, code) {
  const t = decodeTicket(decodeURIComponent(code));
  if (!t) {
    root.innerHTML = `<section class="section empty"><h2>Invalid ticket link</h2><a class="btn" href="#/">Home</a></section>`;
    return;
  }
  root.innerHTML = `
    <section class="section shared">
      <h1>🎟️ Your ticket</h1>
      <p class="muted">Someone sent you a ticket. Save it to your phone and show the QR at the gate.</p>
      <div class="tickets">${ticketCard(t, { actions: false })}</div>
      <button type="button" class="btn btn-primary" data-dl>⬇ Download ticket</button>
      <p class="muted small">Tip: open <a href="${esc(ticketLink(t.code))}">this link</a> any time to see it again.</p>
    </section>`;
  fillQrs(root);
  root.querySelector('[data-dl]').addEventListener('click', () => download(t));
}
