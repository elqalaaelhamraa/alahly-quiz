// Catalogue shared by the web app and the API server.
// Prices are in EGP. The server always re-prices orders from this file,
// so the client can never set its own price.

export const SERVICE_FEE_RATE = 0.05;

export const VENUES = [
  {
    id: 'ahly',
    name: 'Al Ahly Stadium',
    tagline: 'The home of the Red Eagles',
    status: 'Opening 2029',
    animation: 'eagle',
    theme: { from: '#c8102e', to: '#5a0010', accent: '#ffd23f' },
    location: 'New Cairo',
    about:
      'A 42,000-seat home for the club of the century. Reserve your founding seat today and be first in line for the opening season.',
  },
  {
    id: 'zoo',
    name: 'Giza Zoo',
    tagline: 'Reborn. Wilder than ever.',
    status: 'Reopening Q1 2027',
    animation: 'lion',
    theme: { from: '#2f7d32', to: '#0f3d17', accent: '#f6c945' },
    location: 'Giza',
    about:
      'The historic Giza Zoo returns with open habitats, night safaris and family experiences across 80 acres of gardens.',
  },
  {
    id: 'balloon',
    name: 'Pyramids Balloon',
    tagline: 'See the Pyramids from the sky',
    status: 'Flying daily',
    animation: 'balloon',
    theme: { from: '#f28c28', to: '#8a3b12', accent: '#fff1c1' },
    location: 'Giza Plateau',
    about:
      'A tethered balloon rising 150 m above the Giza Plateau. Sunrise, daytime and sunset flights every day, weather permitting.',
  },
  {
    id: 'events',
    name: 'Concerts & Events',
    tagline: 'Live at every venue',
    status: 'On the schedule',
    animation: 'concert',
    theme: { from: '#6a1bd1', to: '#1b0a3d', accent: '#ff4fd8' },
    location: 'All venues',
    about:
      'Concerts, festivals and special nights hosted across the stadium, the zoo gardens and the plateau.',
  },
];

// status: 'on_sale' → can be bought; 'coming_soon' → waitlist only.
// dateMode: 'fixed' → single date; 'pick' → customer picks a date in [from, to].
// slots: optional time slots the customer picks from.
// fanId: Tazkarti-style Fan ID required per attendee.
export const EVENTS = [
  // ── Al Ahly Stadium ──
  {
    id: 'ahly-founders',
    venue: 'ahly',
    title: 'Founders Seat Reservation',
    subtitle: 'Lock your seat for the 2029 opening season',
    status: 'on_sale',
    dateMode: 'fixed',
    date: '2029-08-01',
    time: 'Season 2029/30',
    fanId: true,
    tickets: [
      { id: 'cat3', name: 'Category 3 – Behind the goal', price: 1500 },
      { id: 'cat2', name: 'Category 2 – Corner stands', price: 3000 },
      { id: 'cat1', name: 'Category 1 – Main stand', price: 6000 },
      { id: 'vip', name: 'VIP Box seat', price: 25000 },
    ],
    maxPerOrder: 4,
  },
  {
    id: 'ahly-opening',
    venue: 'ahly',
    title: 'Grand Opening Ceremony',
    subtitle: 'Fireworks, legends and the first whistle',
    status: 'coming_soon',
    dateMode: 'fixed',
    date: '2029-09-15',
    time: '19:00',
    tickets: [],
  },
  {
    id: 'ahly-derby',
    venue: 'ahly',
    title: 'Al Ahly vs Zamalek – Cairo Derby',
    subtitle: 'The first derby in the new house',
    status: 'coming_soon',
    dateMode: 'fixed',
    date: '2029-10-20',
    time: '21:00',
    tickets: [],
  },

  // ── Giza Zoo ──
  {
    id: 'zoo-reopening',
    venue: 'zoo',
    title: 'Grand Reopening Day',
    subtitle: 'Be among the first through the gates',
    status: 'on_sale',
    dateMode: 'fixed',
    date: '2027-01-15',
    time: '09:00 – 18:00',
    tickets: [
      { id: 'child', name: 'Child (3–12)', price: 60 },
      { id: 'adult', name: 'Adult', price: 120 },
      { id: 'foreign', name: 'Foreign visitor', price: 400 },
      { id: 'family', name: 'Family pack (2 adults + 2 kids)', price: 320 },
    ],
    maxPerOrder: 10,
  },
  {
    id: 'zoo-daily',
    venue: 'zoo',
    title: 'Daily Admission',
    subtitle: 'Pick any day from opening',
    status: 'on_sale',
    dateMode: 'pick',
    from: '2027-01-16',
    to: '2027-12-31',
    slots: ['09:00', '12:00', '15:00'],
    tickets: [
      { id: 'child', name: 'Child (3–12)', price: 40 },
      { id: 'adult', name: 'Adult', price: 80 },
      { id: 'foreign', name: 'Foreign visitor', price: 300 },
    ],
    maxPerOrder: 10,
  },
  {
    id: 'zoo-night',
    venue: 'zoo',
    title: "Lion's Den Night Safari",
    subtitle: 'Guided torch-lit tour after dark',
    status: 'on_sale',
    dateMode: 'pick',
    from: '2027-02-01',
    to: '2027-12-31',
    slots: ['19:00', '21:00'],
    tickets: [{ id: 'safari', name: 'Night Safari pass (age 8+)', price: 450 }],
    maxPerOrder: 6,
  },

  // ── Pyramids Balloon ──
  {
    id: 'balloon-sunrise',
    venue: 'balloon',
    title: 'Sunrise Flight',
    subtitle: 'Golden light over Khufu',
    status: 'on_sale',
    dateMode: 'pick',
    from: '2026-09-28',
    to: '2027-12-31',
    slots: ['05:45', '06:15', '06:45'],
    tickets: [
      { id: 'std', name: 'Standard basket', price: 1800 },
      { id: 'child', name: 'Child (6–12)', price: 900 },
    ],
    maxPerOrder: 8,
  },
  {
    id: 'balloon-day',
    venue: 'balloon',
    title: 'Daytime Flight',
    subtitle: '15 minutes, 150 metres up',
    status: 'on_sale',
    dateMode: 'pick',
    from: '2026-09-28',
    to: '2027-12-31',
    slots: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00'],
    tickets: [
      { id: 'std', name: 'Standard basket', price: 1200 },
      { id: 'child', name: 'Child (6–12)', price: 600 },
    ],
    maxPerOrder: 8,
  },
  {
    id: 'balloon-private',
    venue: 'balloon',
    title: 'Private Sunset Basket',
    subtitle: 'The whole basket, just for your group',
    status: 'on_sale',
    dateMode: 'pick',
    from: '2026-09-28',
    to: '2027-12-31',
    slots: ['17:00', '17:30'],
    tickets: [{ id: 'private', name: 'Private basket seat', price: 4500 }],
    maxPerOrder: 6,
  },

  // ── Concerts & Events ──
  {
    id: 'ev-pyramids-sunset',
    venue: 'events',
    host: 'balloon',
    title: 'Sunset Symphony at the Pyramids',
    subtitle: 'Full orchestra under the Great Pyramid',
    status: 'on_sale',
    dateMode: 'fixed',
    date: '2026-11-20',
    time: '18:30',
    tickets: [
      { id: 'ga', name: 'General admission', price: 950 },
      { id: 'gold', name: 'Golden circle', price: 2200 },
      { id: 'vip', name: 'VIP lounge', price: 5500 },
    ],
    maxPerOrder: 6,
  },
  {
    id: 'ev-zoo-jazz',
    venue: 'events',
    host: 'zoo',
    title: 'Zoo Nights: Jazz in the Garden',
    subtitle: 'Live jazz among the old banyan trees',
    status: 'on_sale',
    dateMode: 'fixed',
    date: '2027-04-10',
    time: '20:00',
    tickets: [
      { id: 'ga', name: 'Garden entry', price: 600 },
      { id: 'table', name: 'Table seat', price: 1400 },
    ],
    maxPerOrder: 8,
  },
  {
    id: 'ev-newyear',
    venue: 'events',
    host: 'balloon',
    title: "New Year's Eve on the Plateau",
    subtitle: 'Countdown to 2027 with the Pyramids lit up',
    status: 'on_sale',
    dateMode: 'fixed',
    date: '2026-12-31',
    time: '21:00',
    tickets: [
      { id: 'ga', name: 'General admission', price: 1500 },
      { id: 'vip', name: 'VIP terrace', price: 7500 },
    ],
    maxPerOrder: 6,
  },
  {
    id: 'ev-stadium-concert',
    venue: 'events',
    host: 'ahly',
    title: 'Stadium Opening Concert',
    subtitle: 'The first show under the new lights',
    status: 'coming_soon',
    dateMode: 'fixed',
    date: '2029-09-01',
    time: '20:00',
    tickets: [],
  },
];

export const venueById = (id) => VENUES.find((v) => v.id === id);
export const eventById = (id) => EVENTS.find((e) => e.id === id);
export const eventsForVenue = (id) => EVENTS.filter((e) => e.venue === id || e.host === id);

// Price a cart of { ticketTypeId: qty }. Used by both client and server.
export function priceOrder(event, quantities) {
  let subtotal = 0;
  let count = 0;
  for (const t of event.tickets) {
    const q = Math.max(0, Math.floor(Number(quantities[t.id]) || 0));
    subtotal += q * t.price;
    count += q;
  }
  const fees = Math.round(subtotal * SERVICE_FEE_RATE);
  return { subtotal, fees, total: subtotal + fees, count };
}
