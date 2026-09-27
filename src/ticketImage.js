// Renders a ticket to a PNG (for "Download") using a canvas.
import QRCode from 'qrcode';
import { eventById, venueById } from './data/venues.js';
import { fmtDate } from './util.js';

export const qrDataUrl = (code, width = 280) =>
  QRCode.toDataURL(code, { width, margin: 1, color: { dark: '#111111', light: '#ffffff' } });

function wrap(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  lines.push(line);
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export async function ticketPng(ticket) {
  const event = eventById(ticket.eventId);
  const venue = venueById(event.host || event.venue);
  await document.fonts?.ready;

  const W = 900;
  const H = 1500;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  const font = (weight, size) => `${weight} ${size}px Cairo, system-ui, sans-serif`;

  ctx.fillStyle = '#0d0d12';
  ctx.fillRect(0, 0, W, H);

  // Top stub
  const g = ctx.createLinearGradient(0, 0, W, 760);
  g.addColorStop(0, venue.theme.from);
  g.addColorStop(1, venue.theme.to);
  ctx.fillStyle = g;
  roundRect(ctx, 40, 40, W - 80, 760, 40);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,.75)';
  ctx.font = font(700, 30);
  ctx.fillText(venue.name.toUpperCase(), 90, 120);
  ctx.fillStyle = venue.theme.accent;
  ctx.fillText('ADMIT ONE', W - 90 - ctx.measureText('ADMIT ONE').width, 120);

  ctx.fillStyle = '#fff';
  ctx.font = font(800, 64);
  let y = 220;
  for (const l of wrap(ctx, event.title, W - 180).slice(0, 3)) {
    ctx.fillText(l, 90, y);
    y += 76;
  }

  const rows = [
    ['DATE', fmtDate(ticket.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })],
    ['TIME', ticket.slot || event.time || '—'],
    ['TICKET', ticket.typeName],
    ['HOLDER', ticket.holder],
  ];
  y += 20;
  for (const [k, v] of rows) {
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ctx.font = font(700, 24);
    ctx.fillText(k, 90, y);
    ctx.fillStyle = '#fff';
    ctx.font = font(700, 36);
    ctx.fillText(wrap(ctx, v, W - 180)[0], 90, y + 44);
    y += 100;
  }

  // Perforation
  ctx.fillStyle = '#0d0d12';
  ctx.beginPath();
  ctx.arc(40, 800, 34, 0, Math.PI * 2);
  ctx.arc(W - 40, 800, 34, 0, Math.PI * 2);
  ctx.fill();

  // QR stub
  ctx.fillStyle = '#fff';
  roundRect(ctx, 40, 800, W - 80, 660, 40);
  ctx.fill();
  ctx.fillStyle = '#0d0d12';
  ctx.beginPath();
  ctx.arc(40, 800, 34, 0, Math.PI * 2);
  ctx.arc(W - 40, 800, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.setLineDash([14, 12]);
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(90, 800);
  ctx.lineTo(W - 90, 800);
  ctx.stroke();
  ctx.setLineDash([]);

  const qr = new Image();
  qr.src = await qrDataUrl(ticket.code, 440);
  await qr.decode();
  ctx.drawImage(qr, (W - 440) / 2, 850, 440, 440);

  ctx.fillStyle = '#111';
  ctx.font = font(800, 34);
  const idW = ctx.measureText(ticket.id).width;
  ctx.fillText(ticket.id, (W - idW) / 2, 1340);
  ctx.fillStyle = '#777';
  ctx.font = font(600, 22);
  const note = 'Show this QR code at the gate · one scan per ticket';
  ctx.fillText(note, (W - ctx.measureText(note).width) / 2, 1390);

  return new Promise((resolve) => c.toBlob(resolve, 'image/png'));
}

export function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
