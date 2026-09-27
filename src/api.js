// Talks to the API server. When the app is hosted statically (e.g. GitHub Pages)
// with no API behind it, it falls back to a local demo so the full flow still works.
import { eventById, priceOrder } from './data/venues.js';
import { b64urlEncode, b64urlDecode, randomId } from './util.js';

const API = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export class ApiError extends Error {}
class Unavailable extends Error {}

async function call(path, options) {
  let res;
  try {
    res = await fetch(API + path, { headers: { 'Content-Type': 'application/json' }, ...options });
  } catch {
    throw new Unavailable();
  }
  if ([404, 405, 500, 501, 502, 503, 504].includes(res.status) && !res.headers.get('content-type')?.includes('json')) {
    throw new Unavailable();
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || 'Something went wrong.');
  return data;
}

export async function createOrder(payload) {
  try {
    return await call('/api/orders', { method: 'POST', body: JSON.stringify(payload) });
  } catch (err) {
    if (!(err instanceof Unavailable)) throw err;
    return demoOrder(payload);
  }
}

export async function sendTickets({ to, tickets, fromName, message }) {
  try {
    return await call('/api/tickets/send', {
      method: 'POST',
      body: JSON.stringify({ to, codes: tickets.map((t) => t.code), fromName, message }),
    });
  } catch (err) {
    if (!(err instanceof Unavailable)) throw err;
    // No mail server: hand off to the user's mail app with the ticket links.
    const links = tickets.map((t) => `${t.typeName} – ${t.holder}: ${ticketLink(t.code)}`).join('\n');
    const body = `${message ? message + '\n\n' : ''}Here ${tickets.length > 1 ? 'are your tickets' : 'is your ticket'}:\n${links}`;
    window.location.href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(
      `${fromName || 'A friend'} sent you tickets`,
    )}&body=${encodeURIComponent(body)}`;
    return { ok: true, mailto: true };
  }
}

export async function joinWaitlist(eventId, email) {
  try {
    return await call('/api/waitlist', { method: 'POST', body: JSON.stringify({ eventId, email }) });
  } catch (err) {
    if (!(err instanceof Unavailable)) throw err;
    return { ok: true, demo: true };
  }
}

export const ticketLink = (code) => `${location.origin}${location.pathname}#/ticket/${encodeURIComponent(code)}`;

// Reads the public part of a ticket code (the signature is checked by the server at the gate).
export function decodeTicket(code) {
  try {
    const p = b64urlDecode(code.split('.')[0]);
    const event = eventById(p.e);
    const type = event?.tickets.find((x) => x.id === p.t);
    if (!event || !type) return null;
    return { id: p.i, orderId: p.o, eventId: p.e, typeId: p.t, typeName: type.name, holder: p.n, date: p.d, slot: p.s || null, code };
  } catch {
    return null;
  }
}

function demoOrder(payload) {
  const event = eventById(payload.eventId);
  const price = priceOrder(event, payload.quantities);
  const orderId = randomId('ORD-');
  const date = event.dateMode === 'pick' ? payload.date : event.date;
  const tickets = payload.attendees.map((a) => {
    const t = {
      id: randomId('TKT-', 10),
      orderId,
      eventId: event.id,
      typeId: a.typeId,
      typeName: event.tickets.find((x) => x.id === a.typeId).name,
      holder: a.self ? payload.buyer.name : a.name,
      self: a.self,
      sendTo: a.self ? null : a.email || null,
      fanId: a.fanId || null,
      date,
      slot: payload.slot || null,
    };
    t.code = `${b64urlEncode({ i: t.id, o: orderId, e: t.eventId, t: t.typeId, n: t.holder, d: date, s: t.slot || '' })}.demo`;
    return t;
  });
  return {
    id: orderId,
    demo: true,
    createdAt: new Date().toISOString(),
    eventId: event.id,
    date,
    slot: payload.slot || null,
    buyer: payload.buyer,
    payment: { method: payload.payment.method, status: 'paid' },
    ...price,
    tickets,
  };
}
