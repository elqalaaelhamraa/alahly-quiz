// Orders are kept on the device so "My tickets" works offline.
const KEY = 'agt.orders.v1';

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
}

function write(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage full or blocked – the order still lives in memory for this session */
  }
}

let memory = read();

export const getOrders = () => [...memory].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
export const getOrder = (id) => memory.find((o) => o.id === id);

export function saveOrder(order) {
  memory = memory.filter((o) => o.id !== order.id).concat(order);
  write(memory);
}

// Sound preference
const SOUND_KEY = 'agt.sound';
export function soundOn() {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'off';
  } catch {
    return true;
  }
}
export function setSound(on) {
  try {
    localStorage.setItem(SOUND_KEY, on ? 'on' : 'off');
  } catch {
    /* ignore */
  }
}

// The booking in progress (not persisted – a refresh starts over).
export const draft = { eventId: null, date: '', slot: '', quantities: {}, attendees: [], buyer: {}, payment: 'card' };

export function resetDraft(eventId) {
  Object.assign(draft, { eventId, date: '', slot: '', quantities: {}, attendees: [], buyer: draft.buyer || {}, payment: 'card' });
}
