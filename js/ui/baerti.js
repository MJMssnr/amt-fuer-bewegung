// Bärti, der Waschbär im Baumhaus [W26]. Läuft herum, snackt, spielt mit Gegenständen, klettert die Wände hoch.
// Antippen: Er läuft zu Florian, klettert an ihm hoch, und die beiden kuscheln kurz (mit Herzchen).
// Zustand nur im Speicher (nicht im Spielstand) – Bärti macht einfach, was er will.

import { getSprite } from '../render/pixel.js';
import { SLOTS } from '../render/room-art.js';

const K = 1.6;                 // Zeichengröße
const SPEED = 46, CLIMB = 34;  // Welt-Pixel pro Sekunde
const WALLS = [58, 196, 330, 446];
const rnd = (a, b) => a + Math.random() * (b - a);

export class Baerti {
  constructor(floorY) {
    this.floor = floorY;
    this.x = 300; this.y = 0;  // y = Höhe über dem Boden
    this.flip = false;
    this.state = 'sit'; this.until = 1.5; this.t = 0;
    this.hearts = [];
  }

  /** Klickfläche in Welt-Koordinaten */
  hit(x, y) {
    const w = 22 * K, h = 14 * K;
    return Math.abs(x - this.x) < w * 0.6 && y < this.floor - this.y + 4 && y > this.floor - this.y - h - 6;
  }

  /** Angetippt: zu Florian laufen und kuscheln */
  cuddle(flo) {
    if (this.state.startsWith('cuddle')) return;
    this.flo = flo;
    this.state = 'cuddleGo';
  }

  #next(owned) {
    const r = Math.random();
    if (r < 0.3) { this.state = 'walk'; this.tx = rnd(30, 455); }
    else if (r < 0.48) { this.state = 'sit'; this.until = this.t + rnd(1.5, 3.5); }
    else if (r < 0.64) { this.state = 'snack'; this.until = this.t + rnd(2.5, 4); }
    else if (r < 0.82) { this.state = 'toWall'; this.tx = WALLS[Math.floor(Math.random() * WALLS.length)]; }
    else {
      const toys = owned.filter((id) => SLOTS[id] && SLOTS[id].y + SLOTS[id].h > 110);
      if (!toys.length) { this.state = 'walk'; this.tx = rnd(30, 455); return; }
      const s = SLOTS[toys[Math.floor(Math.random() * toys.length)]];
      this.state = 'toToy'; this.tx = s.x + s.w / 2;
    }
  }

  step(dt, owned) {
    this.t += dt;
    const walkTo = (tx) => {
      const d = tx - this.x;
      if (Math.abs(d) < 1) return true;
      this.x += Math.sign(d) * Math.min(Math.abs(d), SPEED * dt);
      this.flip = d < 0;
      return false;
    };
    switch (this.state) {
      case 'walk': if (walkTo(this.tx)) this.#next(owned); break;
      case 'sit': case 'snack': if (this.t > this.until) this.#next(owned); break;
      case 'toWall': if (walkTo(this.tx)) { this.state = 'up'; this.top = rnd(40, 70); } break;
      case 'up': this.y += CLIMB * dt; if (this.y >= this.top) { this.state = 'hang'; this.until = this.t + rnd(1, 2.2); } break;
      case 'hang': if (this.t > this.until) this.state = 'down'; break;
      case 'down': this.y -= CLIMB * 1.4 * dt; if (this.y <= 0) { this.y = 0; this.#next(owned); } break;
      case 'toToy': if (walkTo(this.tx)) { this.state = 'play'; this.until = this.t + 2.4; } break;
      case 'play': this.y = Math.abs(Math.sin((this.until - this.t) * 5)) * 6; if (this.t > this.until) { this.y = 0; this.#next(owned); } break;
      case 'cuddleGo': {
        if (this.y > 0) { this.y = Math.max(0, this.y - CLIMB * 2 * dt); break; }
        const side = this.flo.x + (this.x < this.flo.x ? -8 : 8);
        if (walkTo(side)) { this.state = 'cuddleUp'; this.flip = this.x > this.flo.x; }
        break;
      }
      case 'cuddleUp': this.x += (this.flo.x - this.x) * Math.min(1, dt * 4); this.y += CLIMB * 1.5 * dt;
        if (this.y >= 12) { this.y = 12; this.state = 'cuddle'; this.until = this.t + 3; } break;
      case 'cuddle':
        this.x = this.flo.x + 3 * (this.flip ? -1 : 1);
        if (Math.random() < dt * 5) this.hearts.push({ x: this.x + rnd(-8, 8), y: this.y + 22, t0: this.t });
        if (this.t > this.until) this.state = 'down';
        break;
      default: this.#next(owned);
    }
    this.hearts = this.hearts.filter((h) => this.t - h.t0 < 1.4);
  }

  draw(P) {
    const sit = ['sit', 'snack', 'hang', 'cuddle'].includes(this.state);
    const sp = getSprite(sit ? 'baerti_sit' : 'baerti');
    const moving = !sit;
    const blink = sit && Math.sin(this.t * 1.7) > 0.96;
    const f = sit ? (blink ? 1 : 0) : moving ? Math.floor(this.t * sp.fps) % sp.frames.length : 0;
    const w = sp.w * K, h = sp.h * K;
    const footY = this.floor - this.y;
    const climbing = ['up', 'hang', 'down'].includes(this.state);
    if (this.y < 1) P.blob(this.x, this.floor, 10, 'rgba(20,24,40,0.25)', 2);
    if (climbing) {
      // an der Wand: um 90° gedreht, Kopf nach oben
      const ctx = P.ctx, X = P.X(this.x), Y = P.Y(footY - w / 2);
      ctx.save(); ctx.imageSmoothingEnabled = false;
      ctx.translate(X, Y); ctx.rotate(-Math.PI / 2 + (this.state === 'hang' ? Math.sin(this.t * 4) * 0.08 : 0));
      const fr = sp.frames[Math.floor(this.t * (this.state === 'hang' ? 0 : 8)) % sp.frames.length];
      ctx.drawImage(fr, (-w / 2) * P.s, (-h / 2) * P.s, w * P.s, h * P.s);
      ctx.restore();
    } else {
      const wob = this.state === 'cuddle' ? Math.sin(this.t * 6) * 0.6 : 0;
      P.image(sp.frames[f], this.x - w / 2, footY - h + wob, w, h, this.flip);
    }
    if (this.state === 'snack') { // Keks mit Krümeln
      const mx = this.x + (this.flip ? -12 : 12), my = footY - 8;
      const bite = Math.floor(this.t * 2) % 3;
      P.blob(mx, my, 3, '#1a1c2c'); P.blob(mx, my, 2, '#c58b5e');
      if (bite) P.rect(mx + (this.flip ? -3 : 2), my - 2, 2, 2, '#9c6233');
      if (Math.sin(this.t * 9) > 0.7) P.px(mx + (this.flip ? -2 : 2), this.floor - 1, '#e7b98a');
    }
    for (const hrt of this.hearts) { // Pixelherzen beim Kuscheln
      const a = (this.t - hrt.t0) / 1.4, y = this.floor - hrt.y - a * 26, x = hrt.x + Math.sin(a * 6) * 2;
      for (const [dx, dy] of [[-2, 0], [-1, -1], [1, -1], [2, 0], [-2, 1], [-1, 1], [0, 1], [1, 1], [2, 1], [-1, 2], [0, 2], [1, 2], [0, 3], [0, 0], [-1, 0], [1, 0]])
        P.px(x + dx, y + dy, a < 0.8 ? '#e43b44' : 'rgba(228,59,68,0.5)');
    }
  }
}
