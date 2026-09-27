import { test } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'agt-'));
process.env.TICKET_SECRET = 'test-secret';
const { createOrder, verifyTicket, OrderError } = await import('../server/orders.js');

const base = {
  eventId: 'zoo-daily',
  date: '2027-03-05',
  slot: '12:00',
  quantities: { adult: 2 },
  buyer: { name: 'Ahmed Mohamed', email: 'ahmed@example.com' },
  payment: { method: 'card' },
  attendees: [
    { typeId: 'adult', self: true },
    { typeId: 'adult', self: false, name: 'Omar', email: 'omar@example.com' },
  ],
};

test('creates an order priced on the server with signed tickets', async () => {
  const order = await createOrder({ ...base, total: 1 });
  assert.equal(order.subtotal, 160);
  assert.equal(order.total, 168);
  assert.equal(order.tickets[0].holder, 'Ahmed Mohamed');
  assert.equal(order.tickets[1].sendTo, 'omar@example.com');
  assert.equal(verifyTicket(order.tickets[1].code).holder, 'Omar');
});

test('rejects tampered ticket codes', async () => {
  const order = await createOrder(base);
  const [payload, sig] = order.tickets[0].code.split('.');
  const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(payload, 'base64url')), n: 'Hacker' })).toString('base64url');
  assert.equal(verifyTicket(`${forged}.${sig}`), null);
});

test('validates dates, attendees, fan IDs and sale status', async () => {
  await assert.rejects(createOrder({ ...base, date: '2020-01-01' }), OrderError);
  await assert.rejects(createOrder({ ...base, attendees: base.attendees.slice(1) }), OrderError);
  await assert.rejects(createOrder({ ...base, eventId: 'ahly-derby' }), /not on sale/);
  await assert.rejects(
    createOrder({ eventId: 'ahly-founders', quantities: { cat1: 1 }, buyer: base.buyer, payment: base.payment, attendees: [{ typeId: 'cat1', self: true }] }),
    /Fan ID/,
  );
});
