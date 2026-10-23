// Pixel-Szene: zeigt die Akteure eines Szenarios auf einer Straße mit Maßband.
// Läuft synchron zur physikalischen Zeit; meldet die Zeit über onTime(t).

import { stateAt, series, trajectory } from '../engine/kinematics.js';
import { drawSprite, getSprite } from './pixel.js';
import { fmt, niceStep } from './format.js';

const W = 640, H = 160, SCALE = 3, GROUND = 118;

export class Scene {
  constructor(canvas, world, { onTime, rate, ghost, extras, xRange, ruler = true } = {}) {
    this.ghost = ghost;
    this.ruler = ruler; // false: kein Maßband (Strecke soll nicht ablesbar sein) [W20]
    this.extras = extras;
    this.xRangeExtra = xRange;
    this.c = canvas;
    canvas.width = W; canvas.height = H;
    this.ctx = canvas.getContext('2d');
    this.world = world;
    this.onTime = onTime;
    this.t = 0;
    this.playing = false;
    // Zeitraffer, damit eine Animation höchstens ca. 10 s dauert
    this.rate = rate ?? ([1, 2, 5, 10, 20, 50, 100].find((r) => world.tEnd / r <= 10.5) ?? 200);
    this.facing = new Map();
    this.wall = 0; // Animationszeit für Laufbewegung
    this.#layout();
    this.draw();
  }

  #layout() {
    let lo = Infinity, hi = -Infinity, ylo = 0, yhi = 0;
    for (const a of this.world.actors.values()) {
      for (const pc of series(a, 'x')) for (const [, x] of pc) { lo = Math.min(lo, x); hi = Math.max(hi, x); }
      if (this.world.is2D) for (const pc of trajectory(a)) for (const [, y] of pc) { ylo = Math.min(ylo, y); yhi = Math.max(yhi, y); }
    }
    if (this.xRangeExtra) { lo = Math.min(lo, this.xRangeExtra[0]); hi = Math.max(hi, this.xRangeExtra[1]); }
    if (hi - lo < 1) { lo -= 5; hi += 5; }
    const padPx = 56;
    this.mx = (W - 2 * padPx) / (hi - lo);
    this.x0 = lo;
    this.padPx = padPx;
    this.my = this.world.is2D && yhi > ylo ? Math.min(this.mx, (GROUND - 24) / (yhi - ylo)) : 0;
    this.xr = [lo, hi];
  }

  X(x) { return this.padPx + (x - this.x0) * this.mx; }
  Y(y) { return GROUND - y * this.my; }

  setTime(t) {
    this.t = Math.min(Math.max(t, 0), this.world.tEnd);
    this.draw();
    this.onTime?.(this.t);
  }

  play() {
    if (this.playing) return;
    if (this.t >= this.world.tEnd - 1e-6) this.t = 0;
    this.playing = true;
    let last = performance.now();
    const step = (now) => {
      if (!this.playing) return;
      const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;
      this.wall += dt;
      this.t += dt * this.rate;
      if (this.t >= this.world.tEnd) {
        this.t = this.world.tEnd;
        this.playing = false;
        this.onEnd?.();
      }
      this.draw();
      this.onTime?.(this.t);
      if (this.playing) this.raf = requestAnimationFrame(step);
    };
    this.raf = requestAnimationFrame(step);
  }

  pause() { this.playing = false; cancelAnimationFrame(this.raf); }
  destroy() { this.pause(); }

  draw() {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    // Himmel in Bändern
    const bands = ['#8fd3ff', '#a6dcff', '#bfe6ff'];
    bands.forEach((col, i) => { ctx.fillStyle = col; ctx.fillRect(0, i * 20, W, 20); });
    ctx.fillStyle = '#d6efff';
    ctx.fillRect(0, 60, W, GROUND - 78);
    // Häuserzeile im Hintergrund (deterministisch)
    for (let i = 0; i < 14; i++) {
      const bx = i * 48 - 8, bh = 26 + ((i * 37) % 30);
      ctx.fillStyle = ['#c9b6e4', '#b8c9e8', '#e4c9b6', '#c6e2c3'][i % 4];
      ctx.fillRect(bx, GROUND - 22 - bh, 40, bh);
      ctx.fillStyle = 'rgba(26,28,44,0.18)';
      for (let wy = GROUND - 16 - bh; wy < GROUND - 30; wy += 10)
        for (let wx = bx + 6; wx < bx + 34; wx += 10) ctx.fillRect(wx, wy, 4, 5);
    }
    // Gehweg und Straße
    ctx.fillStyle = '#94b0c2'; ctx.fillRect(0, GROUND - 22, W, 6);
    ctx.fillStyle = '#566c86'; ctx.fillRect(0, GROUND - 16, W, 22);
    ctx.fillStyle = '#f4f4f4';
    for (let x = ((-this.x0 * this.mx) % 32) - 32; x < W; x += 32) ctx.fillRect(Math.round(x), GROUND - 6, 16, 2);
    ctx.fillStyle = '#333c57'; ctx.fillRect(0, GROUND + 6, W, H - GROUND - 6);

    // Maßband (abschaltbar per Ticket: "ruler": false)
    if (this.ruler) {
      ctx.font = '15px "AmtPixel", monospace'; // vorher 13 px, +10 % gewünscht [W19, W20]
      // so wenige Teilstriche, dass sich die (großen) Beschriftungen nicht überlappen
      let step = niceStep(this.xr[1] - this.xr[0], 6);
      for (let n = 6; n >= 2; n--) {
        step = niceStep(this.xr[1] - this.xr[0], n);
        const wide = Math.max(...[this.xr[0], this.xr[1]].map((v) => ctx.measureText(`${fmt(Math.ceil(Math.abs(v) / step) * step)} m`).width));
        if (step * this.mx > wide + 14) break;
      }
      ctx.fillStyle = '#ffcd75';
      ctx.textAlign = 'center';
      for (let x = Math.ceil(this.xr[0] / step) * step; x <= this.xr[1] + 1e-9; x += step) {
        const px = Math.round(this.X(x));
        ctx.fillRect(px, GROUND + 6, 2, 8);
        ctx.fillText(`${fmt(x)} m`, px + 1, GROUND + 28);
      }
    }

    // Akteure
    for (const [id, a] of this.world.actors) {
      const s = stateAt(a, this.t);
      const spName = a.def.sprite ?? 'florian';
      const sp = getSprite(spName);
      const vx = s.v[0];
      if (Math.abs(vx) > 0.05) this.facing.set(id, vx < 0);
      const flip = sp.turns && (this.facing.get(id) ?? false);
      const moving = Math.hypot(s.v[0], s.v[1]) > 0.05 && this.t < a.tEnd;
      const bottom = this.world.is2D ? this.Y(s.r[1]) : GROUND - 2;
      const ghost = this.ghost?.has(id);
      if (ghost) ctx.globalAlpha = this.ghostAlpha ?? 0.35;
      if (!ghost || ctx.globalAlpha > 0) drawSprite(ctx, spName, this.X(s.r[0]), bottom, SCALE, { flip, moving, time: this.wall + this.t });
      ctx.globalAlpha = 1;
      // Markierung des Bezugspunkts
      ctx.fillStyle = ghost ? `rgba(239,125,87,${(this.ghostAlpha ?? 0.35) > 0 ? 0.4 : 0})` : '#ef7d57';
      ctx.fillRect(Math.round(this.X(s.r[0])) - 1, GROUND + 2, 3, 4);
    }
    // Zusätzliche, frei gesteuerte Figuren (Live-Steuerung): [{ sprite, x, flip, moving }]
    for (const e of this.extras?.() ?? []) {
      const px = Math.max(8, Math.min(W - 8, this.X(e.x)));
      drawSprite(ctx, e.sprite, px, GROUND - 2, SCALE, { flip: e.flip, moving: e.moving, time: this.wall + this.t });
      ctx.fillStyle = '#ffcd75';
      ctx.fillRect(Math.round(px) - 1, GROUND + 2, 3, 4);
    }

    // Zeitanzeige
    ctx.font = '15px "AmtPixel", monospace';
    ctx.textAlign = 'left';
    const tTxt = `t = ${fmt(this.t, 1)} s`, rTxt = this.rate !== 1 ? `  ×${this.rate}` : '';
    const tw = ctx.measureText(tTxt).width, rw = ctx.measureText(rTxt).width;
    ctx.fillStyle = 'rgba(26,28,44,0.75)';
    ctx.fillRect(8, 8, tw + rw + 16, 22);
    ctx.fillStyle = '#f4f4f4';
    ctx.fillText(tTxt, 16, 24);
    if (rTxt) {
      ctx.fillStyle = '#ffcd75';
      ctx.fillText(rTxt, 16 + tw, 24);
    }
  }
}
