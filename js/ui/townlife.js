// Leben auf der Stadtkarte [W33]: zwei Radler auf Rundkursen, Fußgänger auf den Gehwegen, die stehen bleiben
// und plaudern, wenn sie sich begegnen. Ressourcensparend: feste Bahnen, keine Wegsuche, ein paar Rechenschritte pro Bild.
// Zeichnen über Painter (Welt-Koordinaten); Tiefensortierung übernimmt die Karte (items mit y).

import { getSprite } from '../render/pixel.js';
import { shadow } from '../render/town.js';

// Rundkurse der Radler (Straßenmitte), Fahrtrichtung rechts → Versatz nach rechts
const LOOPS = [
  [[110, 104], [560, 104], [560, 316], [110, 316]],
  [[110, 220], [110, 316], [330, 316], [330, 220]],
];
// Gehweg-Bahnen: waagrecht (y fest, x von–bis) oder senkrecht (x fest, y von–bis)
const LANES = [
  { y: 93, a: 120, b: 548 }, { y: 231, a: 122, b: 318 }, { y: 231, a: 342, b: 548 },
  { y: 305, a: 122, b: 318 }, { x: 99, a: 118, b: 300 }, { y: 209, a: 342, b: 548 },
];
const WALKERS = [
  [0, 'passant_a', 0.1], [0, 'passant_b', 0.8], [1, 'passant_c', 0.2], [1, 'passant_d', 0.9],
  [2, 'passant_b', 0.5], [3, 'passant_a', 0.4], [4, 'passant_c', 0.3], [5, 'passant_d', 0.6],
];
const BUBBLES = ['…', '!', '♪', '?', 'haha'];

export class TownLife {
  constructor() {
    this.riders = LOOPS.map((pts, i) => {
      const len = pts.reduce((s, p, k) => s + Math.hypot(pts[(k + 1) % pts.length][0] - p[0], pts[(k + 1) % pts.length][1] - p[1]), 0);
      return { pts, len, s: i * 300, v: 42 + i * 6, sprite: i ? 'cyclist_b' : 'cyclist', dist: 0 };
    });
    this.walkers = WALKERS.map(([lane, sprite, u], i) => ({ lane: LANES[lane], sprite, u, dir: i % 2 ? -1 : 1, v: 9 + (i % 3) * 2, chat: 0, cool: 0, bubble: '', t: i }));
  }

  step(dt) {
    for (const r of this.riders) { r.s = (r.s + r.v * dt) % r.len; r.dist += r.v * dt; }
    for (const w of this.walkers) {
      w.t += dt; w.cool = Math.max(0, w.cool - dt);
      if (w.chat > 0) { w.chat -= dt; continue; }
      const L = w.lane, span = L.b - L.a;
      w.u += (w.dir * w.v * dt) / span;
      if (w.u > 1) { w.u = 1; w.dir = -1; } else if (w.u < 0) { w.u = 0; w.dir = 1; }
    }
    // Begegnung: gleiche Bahn, entgegengesetzt, nah → beide plaudern ein paar Sekunden
    for (let i = 0; i < this.walkers.length; i++) for (let j = i + 1; j < this.walkers.length; j++) {
      const a = this.walkers[i], b = this.walkers[j];
      if (a.lane !== b.lane || a.chat > 0 || b.chat > 0 || a.cool || b.cool || a.dir === b.dir) continue;
      const d = (b.u - a.u) * (a.lane.b - a.lane.a);
      if (Math.abs(d) > 9 || Math.sign(d) !== a.dir) continue;
      const time = 2.5 + ((i + j) % 3);
      for (const w of [a, b]) { w.chat = time; w.cool = time + 6; }
      a.bubble = BUBBLES[(i + j) % BUBBLES.length]; b.bubble = BUBBLES[(i * 3 + j) % BUBBLES.length];
      // danach geht jeder in seiner Richtung weiter (aneinander vorbei)
    }
  }

  /** Positionen der Radler (für Bärti: vor der Straße warten) */
  riderPositions() { return this.riders.map((r) => { const [x, y] = this.#onLoop(r); return { x, y }; }); }

  /** Zeichen-Einträge für die Tiefensortierung der Karte */
  items(P, dpr = 1) {
    const out = [];
    for (const r of this.riders) {
      const [x, y, dx, dy] = this.#onLoop(r);
      out.push({ y, draw: () => {
        const sp = getSprite(r.sprite), f = Math.floor(r.dist / 6) % sp.frames.length;
        shadow(P, x, y + 1, 12);
        P.image(sp.frames[f], x - sp.w / 2, y - sp.h + 1, sp.w, sp.h, dx < -0.1 || (Math.abs(dx) < 0.1 && dy < 0));
      } });
    }
    for (const w of this.walkers) {
      const L = w.lane, p = L.a + w.u * (L.b - L.a);
      const x = L.y !== undefined ? p : L.x, y = L.y !== undefined ? L.y : p;
      out.push({ y, draw: () => {
        const sp = getSprite(w.sprite), moving = w.chat <= 0;
        const f = moving ? Math.floor(w.t * sp.fps) % sp.frames.length : 0;
        shadow(P, x, y + 1, 8);
        P.image(sp.frames[f], x - sp.w / 2, y - sp.h + 1, sp.w, sp.h, w.dir < 0);
        if (!moving && Math.sin(w.t * 3) > -0.3) P.text(w.bubble, x, y - sp.h - 4, 4.5, { color: '#1a1c2c', bg: '#ffffff', pad: 1.5, minPx: 9, dpr });
      } });
    }
    return out;
  }

  #onLoop(r) {
    let s = r.s;
    const n = r.pts.length;
    for (let k = 0; k < n; k++) {
      const [ax, ay] = r.pts[k], [bx, by] = r.pts[(k + 1) % n], L = Math.hypot(bx - ax, by - ay);
      if (s <= L) {
        const dx = (bx - ax) / L, dy = (by - ay) / L, off = 4; // rechts fahren
        return [ax + dx * s - dy * off, ay + dy * s + dx * off, dx, dy];
      }
      s -= L;
    }
    return [r.pts[0][0], r.pts[0][1], 1, 0];
  }
}
