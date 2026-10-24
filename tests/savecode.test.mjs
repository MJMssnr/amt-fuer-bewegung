// Speichercode [W36]: Hin und zurück, Tippfehler im richtigen Block, Raten zwecklos
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { encodeSave, decodeSave } from '../js/engine/savecode.js';
import { partOrder } from '../js/engine/packages.js';

const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url)));
const tickets = read('data/tickets.json'), shop = read('data/shop.json');
const ctx = { tickets, items: shop.items, parts: shop.rocketParts, partOrder };

function sample() {
  const st = { money: 1234, seed: 77, introSeen: true, finaleReady: false, finaleDone: false, done: {}, grades: {}, retry: {}, items: {}, pkg: { sent: 3, waiting: [] } };
  tickets.forEach((t, i) => { if (i % 3 === 0) { st.done[t.id] = true; st.grades[t.id] = 'perfect'; } if (i % 7 === 1) { st.done[t.id] = true; st.grades[t.id] = 'fail'; st.retry[t.id] = { after: 3, n: 1 }; } });
  shop.items.forEach((it, i) => { if (i % 2) st.items[it.id] = true; });
  const order = partOrder(shop.rocketParts, 77);
  st.items[order[0]] = true; st.items[order[1]] = true; st.pkg.waiting = [order[2]];
  return st;
}

test('Code hin und zurück: Aufträge, Geld, Einrichtung, Pakete', () => {
  const st = sample(), code = encodeSave(st, ctx);
  assert.match(code, /^([0-9A-HJKMNP-TV-Z]{6}-)*[0-9A-HJKMNP-TV-Z]{6}$/);
  const r = decodeSave(code.toLowerCase().replace(/-/g, ' '), ctx);
  assert.ok(r.ok, r.error);
  assert.equal(r.state.money, 1234);
  for (const t of tickets) {
    assert.equal(Boolean(r.state.done[t.id]), Boolean(st.done[t.id]), t.id);
    assert.equal(Boolean(r.state.retry[t.id]), Boolean(st.retry[t.id]), t.id);
  }
  for (const it of shop.items) assert.equal(Boolean(r.state.items[it.id]), Boolean(st.items[it.id]), it.id);
  assert.equal(r.state.pkg.sent, 3); assert.equal(r.state.pkg.waiting.length, 1);
  assert.ok(code.split("-").length <= 10, `Code zu lang: ${code.length}`);
});

test('Tippfehler und Zahlendreher werden dem Block zugeordnet', () => {
  const code = encodeSave(sample(), ctx).replace(/-/g, '');
  const swap = (s, i) => s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2);
  const sub = (s, i) => s.slice(0, i) + (s[i] === 'A' ? 'B' : 'A') + s.slice(i + 2 - 1);
  const r1 = decodeSave(sub(code, 14), ctx); assert.equal(r1.ok, false); assert.deepEqual(r1.blocks, [3]);
  let k = 7; while (code[k] === code[k + 1]) k++;
  const r2 = decodeSave(swap(code, k), ctx); assert.equal(r2.ok, false); assert.deepEqual(r2.blocks, [2]);
});

test('Zufällige Codes sind ungültig', () => {
  const A = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  let x = 12345, ok = 0;
  for (let n = 0; n < 2000; n++) {
    let s = '';
    for (let i = 0; i < 48; i++) { x = (x * 1103515245 + 12345) >>> 0; s += A[x % 32]; }
    if (decodeSave(s, ctx).ok) ok++;
  }
  assert.equal(ok, 0);
});
