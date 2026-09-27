// API server for the ticketing hub.
//   POST /api/orders              create an order and issue signed tickets
//   POST /api/tickets/send        email one or more tickets to a friend
//   GET  /api/tickets/:code       verify a ticket (gate scanners)
//   POST /api/waitlist            join the waitlist of a coming-soon event
// In production it also serves the built web app from /dist.

import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createOrder, verifyTicket, addToWaitlist, OrderError } from './orders.js';
import { sendTicketsEmail } from './mailer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT) || 8787;

app.use(express.json({ limit: '64kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/orders', async (req, res, next) => {
  try {
    const order = await createOrder(req.body);
    // Tickets flagged "send to their email" are delivered right away.
    const deliveries = [];
    for (const t of order.tickets) {
      if (t.sendTo) {
        deliveries.push(
          sendTicketsEmail({ to: t.sendTo, tickets: [t], fromName: order.buyer.name }).catch((err) => {
            console.error('Delivery failed for', t.id, err.message);
          }),
        );
      }
    }
    await Promise.all(deliveries);
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

app.post('/api/tickets/send', async (req, res, next) => {
  try {
    const { to, codes, fromName, message } = req.body || {};
    if (!Array.isArray(codes) || codes.length === 0 || codes.length > 20) {
      throw new OrderError('Pick between 1 and 20 tickets to send.');
    }
    // Only genuine, signed tickets can be emailed – the endpoint is not an open relay.
    const tickets = codes.map((c) => {
      const t = verifyTicket(c);
      if (!t) throw new OrderError('One of the tickets is not valid.');
      return t;
    });
    const result = await sendTicketsEmail({ to, tickets, fromName, message });
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
});

app.get('/api/tickets/:code', (req, res) => {
  const t = verifyTicket(req.params.code);
  if (!t) return res.status(404).json({ valid: false });
  res.json({ valid: true, ticket: t });
});

app.post('/api/waitlist', async (req, res, next) => {
  try {
    await addToWaitlist(req.body || {});
    res.status(201).json({ ok: true });
  } catch (err) {
    next(err);
  }
});

if (process.env.NODE_ENV === 'production') {
  const dist = path.join(__dirname, '..', 'dist');
  app.use(express.static(dist));
  app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err, _req, res, _next) => {
  if (err instanceof OrderError) return res.status(400).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

app.listen(PORT, () => console.log(`Ticketing API listening on http://localhost:${PORT}`));
