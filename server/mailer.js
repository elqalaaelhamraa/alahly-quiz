import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import { eventById, venueById } from '../src/data/venues.js';
import { OrderError } from './orders.js';

const EMAIL_RE = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']{2,}$/;
const PUBLIC_URL = (process.env.PUBLIC_URL || 'http://localhost:5173').replace(/\/$/, '');
const FROM = process.env.MAIL_FROM || 'Ahly Group Tickets <tickets@example.com>';

// Real SMTP when configured, otherwise a JSON transport that just logs (demo mode).
const smtpConfigured = Boolean(process.env.SMTP_HOST);
const transport = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    })
  : nodemailer.createTransport({ jsonTransport: true });

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export async function sendTicketsEmail({ to, tickets, fromName, message }) {
  to = String(to || '').trim();
  if (!EMAIL_RE.test(to)) throw new OrderError('Please enter a valid email address.');
  const sender = esc(String(fromName || 'A friend').slice(0, 60));
  const note = message ? `<p style="font-style:italic;color:#444">“${esc(String(message).slice(0, 300))}”</p>` : '';

  const attachments = [];
  const cards = await Promise.all(
    tickets.map(async (t, i) => {
      const event = eventById(t.eventId);
      const venue = venueById(event.host || event.venue);
      const cid = `qr${i}@tickets`;
      attachments.push({ filename: `${t.id}.png`, content: await QRCode.toBuffer(t.code, { width: 360, margin: 1 }), cid });
      const link = `${PUBLIC_URL}/#/ticket/${encodeURIComponent(t.code)}`;
      return `
        <table width="100%" style="border-collapse:collapse;margin:16px 0;border-radius:16px;overflow:hidden;background:${venue.theme.from};color:#fff">
          <tr><td style="padding:20px">
            <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;opacity:.8">${esc(venue.name)}</div>
            <div style="font-size:22px;font-weight:800;margin:6px 0">${esc(event.title)}</div>
            <div>${esc(t.date)}${t.slot ? ' · ' + esc(t.slot) : event.time ? ' · ' + esc(event.time) : ''}</div>
            <div style="margin-top:8px">${esc(t.typeName)} · <b>${esc(t.holder)}</b></div>
            <div style="margin-top:14px"><a href="${link}" style="background:#fff;color:#111;padding:10px 16px;border-radius:999px;text-decoration:none;font-weight:700">Open ticket</a></div>
          </td>
          <td style="padding:16px;background:#fff;width:150px" align="center">
            <img src="cid:${cid}" width="140" height="140" alt="Ticket QR code"/>
            <div style="color:#333;font-size:11px;margin-top:4px">${esc(t.id)}</div>
          </td></tr>
        </table>`;
    }),
  );

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#111">
      <h2>🎟️ ${sender} sent you ${tickets.length > 1 ? tickets.length + ' tickets' : 'a ticket'}!</h2>
      ${note}
      ${cards.join('')}
      <p style="color:#666;font-size:12px">Show the QR code at the gate. Each code can be scanned once.</p>
    </div>`;

  const info = await transport.sendMail({
    from: FROM,
    to,
    subject: `${String(fromName || 'A friend').slice(0, 60)} sent you tickets 🎟️`,
    html,
    attachments,
  });
  if (!smtpConfigured) console.log(`[demo mail] to=${to} tickets=${tickets.map((t) => t.id).join(',')}`);
  return { demo: !smtpConfigured, messageId: info.messageId };
}
