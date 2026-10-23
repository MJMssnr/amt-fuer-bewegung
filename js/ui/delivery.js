// Lieferung ins Baumhaus: Postbote Paul klettert durch die Luke, bringt das Paket zum Platz,
// plaudert kurz, stellt es ab – puff – erst dann steht der Gegenstand im Zimmer.
// Texte: data/shop.json → "delivery". Zeichnen: drawDelivery() aus Room.draw().

import { getSprite } from '../render/pixel.js';
import { SLOTS } from '../render/room-art.js';
import { showDialog } from './dialog.js';
import { sfx } from '../audio/sound.js';

const HATCH_X = SLOTS.luke.x + SLOTS.luke.w / 2;
const SPEED = 60; // Welt-Pixel pro Sekunde

/** Zustand pro Zimmer; die Spielschleife des Zimmers ruft stepDelivery(room, dt). */
export function stepDelivery(room, dt) {
  const p = room.post;
  if (!p) return;
  const d = p.tx - p.x;
  p.walking = Math.abs(d) > 0.5;
  if (p.walking) { p.x += Math.sign(d) * Math.min(Math.abs(d), SPEED * dt); p.flip = d < 0; }
  const dr = p.trise - p.rise;
  if (Math.abs(dr) > 0.001) p.rise += Math.sign(dr) * Math.min(Math.abs(dr), 1.8 * dt);
}

const until = (room, cond) => new Promise((r) => {
  const check = () => (cond() || !room.running ? r() : setTimeout(check, 40));
  check();
});

const fill = (line, name) => [line[0], line[1].replaceAll('{item}', name)];
const pick = (arr, n) => arr[n % arr.length];

/**
 * Spielt die Lieferung ab. room.pending = id verhindert, dass der Gegenstand vorher zu sehen ist.
 * walkTo: Florian laufen lassen (Promise).
 */
export async function deliver(room, { id, name, tx, isPart, walkTo, texts }) {
  const n = room.deliveries = (room.deliveries ?? 0) + 1;
  room.pending = id;
  room.post = { x: HATCH_X, tx: HATCH_X, rise: 1, trise: 0, carrying: true, flip: false };
  sfx('ok'); // Klingeln
  await until(room, () => room.post.rise <= 0.001);
  // Florian geht zur Seite, Paul trägt das Paket zum Platz
  const fx = tx + 30 <= 340 ? tx + 30 : tx - 30;
  room.post.tx = tx;
  await Promise.all([walkTo(fx), until(room, () => !room.post.walking && Math.abs(room.post.tx - room.post.x) < 1)]);
  room.flo.flip = fx > tx;
  room.post.flip = fx < tx;

  const d = texts;
  const lines = [fill(pick(isPart ? d.part : d.greet, n - 1), name), pick(d.florian, n - 1)];
  await showDialog(lines);

  // Abstellen, auspacken, puff
  room.post.carrying = false;
  room.parcel = { x: tx };
  await new Promise((r) => setTimeout(r, 450));
  room.parcel = null;
  room.poof = { x: tx, t0: room.t };
  room.pending = null;
  sfx('coin');
  await new Promise((r) => setTimeout(r, 350));
  await showDialog([pick(d.bye, n - 1)]);

  // Paul geht zurück zur Luke und klettert hinunter
  room.post.tx = HATCH_X;
  await until(room, () => !room.post.walking && Math.abs(room.post.tx - room.post.x) < 1);
  room.post.trise = 1;
  await until(room, () => room.post.rise >= 0.999);
  room.post = null;
}

function parcel(P, x, y) {
  P.rect(x - 7, y - 10, 14, 10, '#1a1c2c');
  P.rect(x - 6, y - 9, 12, 8, '#c58b5e');
  P.rect(x - 6, y - 9, 12, 2, '#d9a07a');
  P.rect(x - 1, y - 9, 2, 8, '#f7c815'); // Klebeband in Postgelb
}

/** Zeichnet Postbote, Paket und Auspack-Wolke. ctx-Clipping: Paul taucht aus der Luke auf. */
export function drawDelivery(P, room, floorY) {
  const p = room.post;
  if (room.parcel) parcel(P, room.parcel.x, floorY);
  if (p) {
    const sp = getSprite('postbote');
    const f = p.walking ? Math.floor(room.t * sp.fps * 1.5) % sp.frames.length : 0;
    const k = 2.75; // so groß wie Florian im Zimmer
    const h = sp.h * k, w = sp.w * k;
    const y = floorY - h + p.rise * (h + 2);
    const ctx = P.ctx ?? room.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, room.c.width, room.oy + floorY * room.s);
    ctx.clip();
    if (p.rise < 0.05) P.blob(p.x, floorY, 9, 'rgba(20,24,40,0.25)', 2);
    P.image(sp.frames[f], p.x - w / 2, y, w, h, p.flip);
    if (p.carrying) parcel(P, p.x + (p.flip ? -11 : 11), y + h * 0.66);
    ctx.restore();
  }
  if (room.poof) {
    const a = (room.t - room.poof.t0) / 0.6;
    if (a >= 1) room.poof = null;
    else for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2, r = 4 + a * 18;
      const s = Math.max(1, Math.round(4 * (1 - a)));
      P.rect(room.poof.x + Math.cos(ang) * r - s / 2, floorY - 8 + Math.sin(ang) * r * 0.6 - s / 2, s, s, i % 2 ? '#ffffff' : '#ffcd75');
    }
  }
}
