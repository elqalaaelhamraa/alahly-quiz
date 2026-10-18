import { eventById, venueById, priceOrder, SERVICE_FEE_RATE } from '../data/venues.js';
import { ART } from '../art.js';
import { draft, resetDraft, saveOrder } from '../store.js';
import { createOrder, joinWaitlist, ApiError } from '../api.js';
import { celebrate } from '../animations.js';
import { click } from '../sound.js';
import { esc, money, fmtDate, EMAIL_RE, toast } from '../util.js';
import { logo } from '../brand.js';

const STEPS = ['Tickets', 'Who’s going', 'Payment'];
const PAYMENTS = [
  { id: 'card', label: 'Card', hint: 'Visa · Mastercard · Meeza', icon: '💳' },
  { id: 'fawry', label: 'Fawry', hint: 'Pay at any Fawry outlet', icon: '🏪' },
  { id: 'wallet', label: 'Mobile wallet', hint: 'Vodafone Cash · Orange · Etisalat', icon: '📱' },
  { id: 'instapay', label: 'InstaPay', hint: 'Instant bank transfer', icon: '⚡' },
];
const FAN_ID_RE = /^[A-Za-z0-9]{6,20}$/;

export function renderBooking(root, eventId) {
  const event = eventById(eventId);
  if (!event) return (location.hash = '#/');
  const venue = venueById(event.host || event.venue);
  if (draft.eventId !== eventId) resetDraft(eventId);
  let step = 0;

  root.style.setProperty('--from', venue.theme.from);
  root.style.setProperty('--to', venue.theme.to);
  root.style.setProperty('--accent', venue.theme.accent);

  const header = () => `
    <section class="event-hero">
      <a class="back" href="#/venue/${event.venue}">← ${esc(venueById(event.venue).name)}</a>
      <div class="event-hero-art">${ART[venue.animation]()}</div>
      <div>
        <span class="chip">${esc(venue.name)}</span>
        <h1>${esc(event.title)}</h1>
        <p>${esc(event.subtitle)}</p>
        <p class="meta">${
          event.dateMode === 'fixed'
            ? `📅 ${fmtDate(event.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · ⏰ ${esc(event.time)}`
            : `📅 Daily, ${fmtDate(event.from)} – ${fmtDate(event.to)}`
        }</p>
      </div>
    </section>`;

  const stepper = () => `
    <ol class="stepper">${STEPS.map(
      (s, i) => `<li class="${i === step ? 'on' : i < step ? 'done' : ''}"><span>${i < step ? '✓' : i + 1}</span>${s}</li>`,
    ).join('')}</ol>`;

  function paint(scroll = false) {
    if (event.status !== 'on_sale') {
      root.innerHTML = header() + waitlistView();
      return;
    }
    const body = [ticketsStep, attendeesStep, paymentStep][step]();
    root.innerHTML = `${header()}<section class="section booking">${stepper()}${body}</section>${summaryBar()}`;
    if (scroll) root.querySelector('.stepper').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ── Step 1: date, slot, quantities ──
  function ticketsStep() {
    const q = draft.quantities;
    return `
      ${
        event.dateMode === 'pick'
          ? `<div class="card">
              <label class="field"><span>Choose a date</span>
                <input type="date" name="date" min="${event.from}" max="${event.to}" value="${esc(draft.date)}" required>
              </label>
            </div>`
          : ''
      }
      ${
        event.slots
          ? `<div class="card"><span class="field-label">Pick a time</span><div class="slots">${event.slots
              .map((s) => `<button type="button" class="slot ${draft.slot === s ? 'on' : ''}" data-slot="${s}">${s}</button>`)
              .join('')}</div></div>`
          : ''
      }
      <div class="card">
        <span class="field-label">Tickets <small class="muted">· max ${event.maxPerOrder} per order</small></span>
        ${event.tickets
          .map(
            (t) => `
          <div class="ticket-type">
            <div><b>${esc(t.name)}</b><span>${money(t.price)}</span></div>
            <div class="stepper-qty">
              <button type="button" data-dec="${t.id}" aria-label="Remove one ${esc(t.name)}" ${!q[t.id] ? 'disabled' : ''}>−</button>
              <output>${q[t.id] || 0}</output>
              <button type="button" data-inc="${t.id}" aria-label="Add one ${esc(t.name)}">+</button>
            </div>
          </div>`,
          )
          .join('')}
        ${event.fanId ? `<p class="note">🆔 Stadium tickets need a Fan ID for every attendee (as on Tazkarti).</p>` : ''}
      </div>`;
  }

  // ── Step 2: attendees (me / friends) ──
  function attendeesStep() {
    return `
      <p class="muted intro">Buying for friends? Add their name and email – we’ll send each of them their own ticket.</p>
      ${draft.attendees
        .map((a, i) => {
          const type = event.tickets.find((t) => t.id === a.typeId);
          return `
          <div class="card attendee" data-i="${i}">
            <div class="attendee-head"><b>Ticket ${i + 1}</b><span>${esc(type.name)}</span></div>
            <div class="seg" role="radiogroup" aria-label="Who is ticket ${i + 1} for?">
              <button type="button" role="radio" aria-checked="${a.self}" class="${a.self ? 'on' : ''}" data-who="me">🙋 Me</button>
              <button type="button" role="radio" aria-checked="${!a.self}" class="${!a.self ? 'on' : ''}" data-who="other">🎁 A friend</button>
            </div>
            ${
              a.self
                ? `<p class="muted small">This ticket will be in your name.</p>`
                : `<div class="grid2">
                    <label class="field"><span>Full name</span><input name="name" autocomplete="off" value="${esc(a.name)}" placeholder="Friend’s name" required></label>
                    <label class="field"><span>Email <small class="muted">(optional)</small></span><input type="email" name="email" autocomplete="off" value="${esc(a.email)}" placeholder="friend@email.com"></label>
                  </div>
                  <label class="check"><input type="checkbox" name="sendNow" ${a.sendNow ? 'checked' : ''}> Email this ticket to them right after payment</label>`
            }
            ${
              event.fanId
                ? `<label class="field"><span>Fan ID</span><input name="fanId" inputmode="numeric" value="${esc(a.fanId)}" placeholder="e.g. 12345678" required></label>`
                : ''
            }
          </div>`;
        })
        .join('')}`;
  }

  // ── Step 3: buyer + payment ──
  function paymentStep() {
    const b = draft.buyer;
    const p = priceOrder(event, draft.quantities);
    return `
      <div class="card">
        <span class="field-label">Your details</span>
        <div class="grid2">
          <label class="field"><span>Full name</span><input name="bname" autocomplete="name" value="${esc(b.name)}" required></label>
          <label class="field"><span>Mobile</span><input name="bphone" type="tel" autocomplete="tel" value="${esc(b.phone)}" placeholder="01x xxxx xxxx"></label>
        </div>
        <label class="field"><span>Email – your tickets are sent here</span><input name="bemail" type="email" autocomplete="email" value="${esc(b.email)}" required></label>
      </div>
      <div class="card">
        <span class="field-label">Payment method</span>
        <div class="pay-grid">
          ${PAYMENTS.map(
            (m) => `<button type="button" class="pay ${draft.payment === m.id ? 'on' : ''}" data-pay="${m.id}">
              <span class="pay-icon">${m.icon}</span><b>${m.label}</b><small>${m.hint}</small></button>`,
          ).join('')}
        </div>
        ${
          draft.payment === 'card'
            ? `<div class="card-form">
                <label class="field"><span>Card number</span><input inputmode="numeric" autocomplete="cc-number" placeholder="4242 4242 4242 4242" maxlength="19" data-card></label>
                <div class="grid2">
                  <label class="field"><span>Expiry</span><input autocomplete="cc-exp" placeholder="MM/YY" maxlength="5"></label>
                  <label class="field"><span>CVV</span><input inputmode="numeric" autocomplete="cc-csc" placeholder="123" maxlength="4"></label>
                </div>
                <p class="note">🔒 In production, card details go straight to the payment gateway (e.g. Paymob) and never touch our servers.</p>
              </div>`
            : `<p class="note">You’ll get a reference number to complete the payment with ${esc(PAYMENTS.find((m) => m.id === draft.payment).label)}.</p>`
        }
      </div>
      <div class="card totals">
        ${event.tickets
          .filter((t) => draft.quantities[t.id])
          .map((t) => `<div><span>${draft.quantities[t.id]} × ${esc(t.name)}</span><span>${money(draft.quantities[t.id] * t.price)}</span></div>`)
          .join('')}
        <div><span>Service fee (${SERVICE_FEE_RATE * 100}%)</span><span>${money(p.fees)}</span></div>
        <div class="grand"><span>Total</span><span>${money(p.total)}</span></div>
      </div>
      <p class="secured">Secure checkout by ${logo({ size: 'sm' })}</p>`;
  }

  function summaryBar() {
    const p = priceOrder(event, draft.quantities);
    const label = ['Continue', 'Continue to payment', `Pay ${money(p.total)}`][step];
    return `
      <div class="summary-bar">
        <div class="summary-info">
          ${step > 0 ? `<button type="button" class="btn btn-ghost btn-sm" data-back>←</button>` : ''}
          <div><small>${p.count} ticket${p.count === 1 ? '' : 's'}</small><b>${money(p.total)}</b></div>
        </div>
        <button type="button" class="btn btn-primary" data-next ${p.count ? '' : 'disabled'}>${label}</button>
      </div>`;
  }

  function waitlistView() {
    return `
      <section class="section">
        <div class="card waitlist">
          <h2>🔔 Coming soon</h2>
          <p>Tickets aren’t on sale yet. Join the waitlist and we’ll email you the moment they drop – before anyone else.</p>
          <form class="inline-form" data-waitlist>
            <input type="email" name="email" placeholder="you@email.com" required aria-label="Email">
            <button class="btn btn-primary">Notify me</button>
          </form>
        </div>
      </section>`;
  }

  // Keep one attendee per ticket, preserving what was typed already.
  function syncAttendees() {
    const want = event.tickets.flatMap((t) => Array(draft.quantities[t.id] || 0).fill(t.id));
    const pool = [...draft.attendees];
    draft.attendees = want.map((typeId) => {
      const i = pool.findIndex((a) => a.typeId === typeId);
      return i >= 0 ? pool.splice(i, 1)[0] : { typeId, self: false, name: '', email: '', sendNow: true, fanId: '' };
    });
    if (draft.attendees.length && !draft.attendees.some((a) => a.self) && !pool.some((a) => a.self)) {
      draft.attendees[0].self = true;
    }
  }

  function validate() {
    if (step === 0) {
      if (event.dateMode === 'pick' && (!draft.date || draft.date < event.from || draft.date > event.to))
        return 'Please choose a date.';
      if (event.slots && !draft.slot) return 'Please pick a time slot.';
    }
    if (step === 1) {
      for (const [i, a] of draft.attendees.entries()) {
        if (!a.self && a.name.trim().length < 2) return `Ticket ${i + 1}: add your friend’s name.`;
        if (!a.self && a.email && !EMAIL_RE.test(a.email.trim())) return `Ticket ${i + 1}: check the email address.`;
        if (!a.self && a.sendNow && !a.email) return `Ticket ${i + 1}: add an email or untick “Email this ticket”.`;
        if (event.fanId && !FAN_ID_RE.test(a.fanId.trim())) return `Ticket ${i + 1}: enter a valid Fan ID.`;
      }
    }
    if (step === 2) {
      if ((draft.buyer.name || '').trim().length < 2) return 'Please enter your full name.';
      if (!EMAIL_RE.test((draft.buyer.email || '').trim())) return 'Please enter a valid email.';
    }
    return null;
  }

  async function pay() {
    const btn = root.querySelector('[data-next]');
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Processing…`;
    const payload = {
      eventId: event.id,
      date: draft.date,
      slot: draft.slot,
      quantities: draft.quantities,
      buyer: { name: draft.buyer.name.trim(), email: draft.buyer.email.trim(), phone: (draft.buyer.phone || '').trim() },
      payment: { method: draft.payment },
      attendees: draft.attendees.map((a) => ({
        typeId: a.typeId,
        self: a.self,
        name: a.self ? '' : a.name.trim(),
        email: !a.self && a.sendNow ? a.email.trim() : '',
        fanId: (a.fanId || '').trim(),
      })),
    };
    try {
      const order = await createOrder(payload);
      // Keep friends' emails (even unsent) so "Send" can be pre-filled later.
      order.tickets.forEach((t, i) => (t.friendEmail = draft.attendees[i]?.self ? '' : draft.attendees[i]?.email || ''));
      saveOrder(order);
      resetDraft(null);
      const n = order.tickets.length;
      await celebrate(venue.animation, {
        title: "You're going!",
        subtitle: `${n} ticket${n === 1 ? '' : 's'} for ${event.title}`,
      });
      location.hash = `#/order/${order.id}`;
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Payment failed. Please try again.', 'error');
      btn.disabled = false;
      btn.textContent = `Pay ${money(priceOrder(event, draft.quantities).total)}`;
    }
  }

  // ── Events ──
  root.addEventListener('click', (e) => {
    const t = e.target.closest('button');
    if (!t) return;
    if (t.dataset.inc || t.dataset.dec) {
      const id = t.dataset.inc || t.dataset.dec;
      const p = priceOrder(event, draft.quantities);
      if (t.dataset.inc && p.count >= event.maxPerOrder) return toast(`Maximum ${event.maxPerOrder} tickets per order.`);
      draft.quantities[id] = Math.max(0, (draft.quantities[id] || 0) + (t.dataset.inc ? 1 : -1));
      click();
      syncAttendees();
      return paint();
    }
    if (t.dataset.slot) {
      draft.slot = t.dataset.slot;
      return paint();
    }
    if (t.dataset.who) {
      const i = Number(t.closest('.attendee').dataset.i);
      const self = t.dataset.who === 'me';
      draft.attendees.forEach((a, j) => (a.self = j === i ? self : self ? false : a.self));
      return paint();
    }
    if (t.dataset.pay) {
      draft.payment = t.dataset.pay;
      return paint();
    }
    if ('back' in t.dataset) {
      step -= 1;
      return paint(true);
    }
    if ('next' in t.dataset) {
      const err = validate();
      if (err) return toast(err, 'error');
      if (step < 2) {
        step += 1;
        return paint(true);
      }
      return pay();
    }
  });

  root.addEventListener('input', (e) => {
    const el = e.target;
    const card = el.closest('.attendee');
    if (card) {
      const a = draft.attendees[Number(card.dataset.i)];
      a[el.name] = el.type === 'checkbox' ? el.checked : el.value;
      return;
    }
    if (el.name === 'date') draft.date = el.value;
    if (el.name === 'bname') draft.buyer.name = el.value;
    if (el.name === 'bemail') draft.buyer.email = el.value;
    if (el.name === 'bphone') draft.buyer.phone = el.value;
    if ('card' in el.dataset) el.value = el.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19);
  });
  root.addEventListener('change', (e) => {
    const card = e.target.closest('.attendee');
    if (card && e.target.type === 'checkbox') draft.attendees[Number(card.dataset.i)].sendNow = e.target.checked;
  });

  root.addEventListener('submit', async (e) => {
    if (!e.target.matches('[data-waitlist]')) return;
    e.preventDefault();
    const email = e.target.email.value.trim();
    if (!EMAIL_RE.test(email)) return toast('Please enter a valid email.', 'error');
    try {
      await joinWaitlist(event.id, email);
      e.target.outerHTML = `<p class="success-note">✅ You’re on the list! We’ll email ${esc(email)} when tickets go on sale.</p>`;
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  paint();
}
