import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { eventById, priceOrder } from '../src/data/venues.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const WAITLIST_FILE = path.join(DATA_DIR, 'waitlist.json');

export const PAYMENT_METHODS = ['card', 'fawry', 'wallet', 'instapay'];
const EMAIL_RE = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']{2,}$/;
const FAN_ID_RE = /^[A-Za-z0-9]{6,20}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export class OrderError extends Error {}

fsSync.mkdirSync(DATA_DIR, { recursive: true });
const SECRET = process.env.TICKET_SECRET || loadDevSecret();

function loadDevSecret() {
  const file = path.join(DATA_DIR, '.ticket-secret');
  if (!fsSync.existsSync(file)) fsSync.writeFileSync(file, crypto.randomBytes(32).toString('hex'), { mode: 0o600 });
  console.warn('TICKET_SECRET not set – using a generated development secret.');
  return fsSync.readFileSync(file, 'utf8').trim();
}

const b64url = (buf) => Buffer.from(buf).toString('base64url');
const sign = (payload) => crypto.createHmac('sha256', SECRET).update(payload).digest('base64url').slice(0, 22);

// A ticket code is "<base64url JSON>.<hmac>" – scannable offline, unforgeable without the secret.
export function encodeTicket(t) {
  const payload = b64url(
    JSON.stringify({ i: t.id, o: t.orderId, e: t.eventId, t: t.typeId, n: t.holder, d: t.date, s: t.slot || '' }),
  );
  return `${payload}.${sign(payload)}`;
}

export function verifyTicket(code) {
  if (typeof code !== 'string' || code.length > 1000) return null;
  const [payload, sig] = code.split('.');
  if (!payload || !sig) return null;
  const expected = sign(payload);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const p = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const event = eventById(p.e);
    const type = event?.tickets.find((x) => x.id === p.t);
    if (!event || !type) return null;
    return {
      id: p.i,
      orderId: p.o,
      eventId: p.e,
      typeId: p.t,
      typeName: type.name,
      holder: p.n,
      date: p.d,
      slot: p.s || null,
      code,
    };
  } catch {
    return null;
  }
}

const clean = (s, max = 80) => String(s ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max);

async function readJson(file) {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch {
    return [];
  }
}

// Writes are serialised so concurrent orders never clobber each other.
let queue = Promise.resolve();
function appendJson(file, record) {
  queue = queue.then(async () => {
    const list = await readJson(file);
    list.push(record);
    await fs.writeFile(file, JSON.stringify(list, null, 2));
  });
  return queue;
}

export async function createOrder(body = {}) {
  const event = eventById(body.eventId);
  if (!event) throw new OrderError('Event not found.');
  if (event.status !== 'on_sale') throw new OrderError('Tickets for this event are not on sale yet.');

  // Date & slot
  let date = event.date;
  if (event.dateMode === 'pick') {
    date = String(body.date || '');
    if (!DATE_RE.test(date) || date < event.from || date > event.to) throw new OrderError('Please pick a valid date.');
  }
  let slot = null;
  if (event.slots?.length) {
    if (!event.slots.includes(body.slot)) throw new OrderError('Please pick a time slot.');
    slot = body.slot;
  }

  // Quantities & price (always recomputed here)
  const quantities = body.quantities || {};
  const price = priceOrder(event, quantities);
  if (price.count < 1) throw new OrderError('Select at least one ticket.');
  if (price.count > (event.maxPerOrder || 10)) throw new OrderError(`Maximum ${event.maxPerOrder} tickets per order.`);

  // Buyer
  const buyer = { name: clean(body.buyer?.name), email: clean(body.buyer?.email, 120), phone: clean(body.buyer?.phone, 20) };
  if (buyer.name.length < 2) throw new OrderError('Please enter your full name.');
  if (!EMAIL_RE.test(buyer.email)) throw new OrderError('Please enter a valid email.');
  if (!PAYMENT_METHODS.includes(body.payment?.method)) throw new OrderError('Choose a payment method.');

  // Attendees – one per ticket, matching the ticket types chosen.
  const attendees = Array.isArray(body.attendees) ? body.attendees : [];
  if (attendees.length !== price.count) throw new OrderError('Every ticket needs an attendee.');
  const remaining = { ...quantities };
  const orderId = 'ORD-' + crypto.randomBytes(4).toString('hex').toUpperCase();

  const tickets = attendees.map((a, idx) => {
    const typeId = String(a.typeId);
    if (!(Number(remaining[typeId]) > 0)) throw new OrderError('Attendees do not match the tickets selected.');
    remaining[typeId] -= 1;
    const holder = a.self ? buyer.name : clean(a.name);
    if (holder.length < 2) throw new OrderError(`Ticket ${idx + 1}: enter the attendee's name.`);
    const sendTo = a.self ? null : clean(a.email, 120) || null;
    if (sendTo && !EMAIL_RE.test(sendTo)) throw new OrderError(`Ticket ${idx + 1}: the email address is not valid.`);
    const fanId = event.fanId ? clean(a.fanId, 20) : null;
    if (event.fanId && !FAN_ID_RE.test(fanId)) throw new OrderError(`Ticket ${idx + 1}: a valid Fan ID is required.`);

    const t = {
      id: 'TKT-' + crypto.randomBytes(5).toString('hex').toUpperCase(),
      orderId,
      eventId: event.id,
      typeId,
      typeName: event.tickets.find((x) => x.id === typeId).name,
      holder,
      self: Boolean(a.self),
      sendTo,
      fanId,
      date,
      slot,
    };
    t.code = encodeTicket(t);
    return t;
  });

  // Payment would be captured here (Paymob / Fawry / wallet gateway). Demo: approved.
  const order = {
    id: orderId,
    createdAt: new Date().toISOString(),
    eventId: event.id,
    date,
    slot,
    buyer,
    payment: { method: body.payment.method, status: 'paid' },
    ...price,
    tickets,
  };
  await appendJson(ORDERS_FILE, order);
  return order;
}

export async function addToWaitlist({ eventId, email }) {
  const event = eventById(eventId);
  if (!event) throw new OrderError('Event not found.');
  const e = clean(email, 120);
  if (!EMAIL_RE.test(e)) throw new OrderError('Please enter a valid email.');
  await appendJson(WAITLIST_FILE, { eventId, email: e, at: new Date().toISOString() });
}
