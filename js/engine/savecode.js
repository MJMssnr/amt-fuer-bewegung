// Speichercode [W36]: Spielstand als gut lesbarer Code (Backup / Gerätewechsel). Kein DOM.
// Das Spiel speichert ohnehin automatisch im Browser – der Code ist nur die Sicherung zum Mitnehmen.
//
// Zeichen: Crockford-Base32 (0–9, A–Z ohne I, L, O, U). Eingabe tolerant: klein = groß, O→0, I/L→1, U→V.
// Aufbau: Blöcke à 6 Zeichen = 5 Datenzeichen (25 Bit) + 1 Prüfzeichen (gewichtete Summe mod 31 + geheimer
// Block-Schlüssel). Ein Tippfehler oder Zahlendreher wird dem Block zugeordnet; Raten ist aussichtslos
// (8 Prüfzeichen ≈ 1 : 10¹²). Die Daten sind mit einem festen Schlüsselstrom verwürfelt und tragen eine 12-Bit-Prüfsumme.
//
// Inhalt (Bits): Version 2 · Anzahl Aufträge 7 · Anzahl Gegenstände 5 · Aufträge je 3 Zustände (offen/gelöst/verpatzt,
// als Zahl zur Basis 3) · Gegenstände je 1 · Geld 13 · Seed 8 · Pakete geliefert 3 / ausgepackt 3 · Flags 3 · Prüfsumme 12.

const ALPHA = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const VERSION = 1;
const KEY = [17, 5, 29, 11, 23, 2, 19, 7, 13, 27, 3, 31, 9, 21, 15, 25]; // Block-Schlüssel (geheim genug für Schüler)
const W = [1, 2, 3, 4, 5];

function keystream(nBits) { // xorshift32, fester Startwert
  let s = 0x2f6b9a1d; const out = [];
  for (let i = 0; i < nBits; i++) { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; out.push(s & 1); }
  return out;
}
const checkChar = (vals, b) => ALPHA[(vals.reduce((a, v, i) => a + W[i] * v, 0) + KEY[b % KEY.length]) % 31];
function hash12(bits) { let h = 0x5a3; for (const x of bits) h = ((h * 31) ^ x) & 0xfff; return h; }

class Bits {
  constructor() { this.a = []; }
  put(v, n) { for (let i = n - 1; i >= 0; i--) this.a.push(Number((BigInt(v) >> BigInt(i)) & 1n)); }
}
function take(bits, pos, n) { let v = 0n; for (let i = 0; i < n; i++) v = (v << 1n) | BigInt(bits[pos + i] ?? 0); return v; }

/** Spielstand → Code. ctx: { tickets, items (Shop-Gegenstände ohne Raketenteile), parts (Raketenteile) } */
export function encodeSave(state, { tickets, items, parts }) {
  const B = new Bits();
  B.put(VERSION, 2); B.put(tickets.length, 7); B.put(items.length, 5);
  let tri = 0n;
  for (let i = tickets.length - 1; i >= 0; i--) {
    const t = tickets[i], g = state.grades?.[t.id];
    const st = !state.done?.[t.id] ? 0 : g === 'fail' && state.retry?.[t.id] ? 2 : 1;
    tri = tri * 3n + BigInt(st);
  }
  const triBits = Math.ceil(tickets.length * Math.log2(3));
  B.put(tri, triBits);
  for (const it of items) B.put(state.items?.[it.id] ? 1 : 0, 1);
  B.put(Math.min(8191, Math.max(0, Math.round(state.money ?? 0))), 13);
  B.put((state.seed ?? 0) & 255, 8);
  const sent = state.pkg?.sent ?? 0, unpacked = parts.filter((p) => state.items?.[p.id]).length;
  B.put(sent, 3); B.put(Math.min(unpacked, sent), 3);
  B.put(state.introSeen ? 1 : 0, 1); B.put(state.finaleReady ? 1 : 0, 1); B.put(state.finaleDone ? 1 : 0, 1);
  B.put(hash12(B.a), 12);
  const nBlocks = Math.ceil(B.a.length / 25), ks = keystream(nBlocks * 25);
  const bits = Array.from({ length: nBlocks * 25 }, (_, i) => (B.a[i] ?? 0) ^ ks[i]);
  const blocks = [];
  for (let b = 0; b < nBlocks; b++) {
    const vals = [0, 1, 2, 3, 4].map((k) => Number(take(bits, b * 25 + k * 5, 5)));
    blocks.push(vals.map((v) => ALPHA[v]).join('') + checkChar(vals, b));
  }
  return blocks.join('-');
}

/** Eingabe säubern: Leerzeichen/Striche weg, Verwechslungen korrigieren */
export function normalizeCode(text) {
  return String(text ?? '').toUpperCase().replace(/[\s\-–_.]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1').replace(/U/g, 'V');
}

/**
 * Code → Spielstand. Rückgabe { ok: true, state } oder { ok: false, error, blocks: [fehlerhafte Blocknummern ab 1] }.
 * Der zurückgegebene Zustand ersetzt den alten komplett (Auftragsbuch-Reihenfolge und Einzellöhne gehen verloren).
 */
export function decodeSave(text, { tickets, items, parts, partOrder }) {
  const s = normalizeCode(text);
  if (!s.length) return { ok: false, error: 'Bitte den Code eingeben.' };
  if ([...s].some((c) => !ALPHA.includes(c))) return { ok: false, error: 'Im Code ist ein Zeichen, das es nicht gibt.' };
  if (s.length % 6) return { ok: false, error: `Der Code hat ${s.length} Zeichen – er muss aus Blöcken zu je 6 Zeichen bestehen.` };
  const nBlocks = s.length / 6, bad = [], bits = [];
  for (let b = 0; b < nBlocks; b++) {
    const blk = s.slice(b * 6, b * 6 + 6), vals = [...blk.slice(0, 5)].map((c) => ALPHA.indexOf(c));
    if (checkChar(vals, b) !== blk[5]) bad.push(b + 1);
    for (const v of vals) for (let i = 4; i >= 0; i--) bits.push((v >> i) & 1);
  }
  if (bad.length) return { ok: false, error: `Tippfehler in Block ${bad.join(', ')}. Bitte genau vergleichen!`, blocks: bad };
  const ks = keystream(bits.length);
  const raw = bits.map((x, i) => x ^ ks[i]);
  let p = 0;
  const get = (n) => { const v = take(raw, p, n); p += n; return v; };
  const version = Number(get(2)), nT = Number(get(7)), nI = Number(get(5));
  if (version !== VERSION) return { ok: false, error: 'Dieser Code stammt aus einer anderen Spielversion.' };
  if (nT > tickets.length || nI > items.length) return { ok: false, error: 'Dieser Code passt nicht zu dieser Spielversion.' };
  const triBits = Math.ceil(nT * Math.log2(3));
  let tri = get(triBits);
  const st = { done: {}, grades: {}, retry: {}, order: [], items: {} };
  for (let i = 0; i < nT; i++) {
    const v = Number(tri % 3n); tri /= 3n;
    const id = tickets[i].id;
    if (v) { st.done[id] = true; st.order.push(id); st.grades[id] = v === 2 ? 'fail' : 'perfect'; }
    if (v === 2) st.retry[id] = { after: 0, n: 1 };
  }
  for (let i = 0; i < nI; i++) if (get(1) === 1n) st.items[items[i].id] = true;
  st.money = Number(get(13)); st.seed = Number(get(8)) || 1;
  const sent = Number(get(3)), unpacked = Number(get(3));
  st.introSeen = get(1) === 1n; st.finaleReady = get(1) === 1n; st.finaleDone = get(1) === 1n;
  const end = p, h = Number(get(12));
  if (h !== hash12(raw.slice(0, end)) || unpacked > sent || sent > parts.length) return { ok: false, error: 'Der Code ist ungültig.' };
  const order = partOrder(parts, st.seed);
  order.slice(0, unpacked).forEach((id) => (st.items[id] = true));
  st.pkg = { sent, waiting: order.slice(unpacked, sent) };
  return { ok: true, state: st };
}
