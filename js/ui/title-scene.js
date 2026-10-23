// Animierte Startbildschirm-Szene: Morgendämmerung, Straße voller Bewegung, Florian mittendrin.
// Florian notiert, fotografiert (Blitz!), misst Geschwindigkeiten und plaudert mit Oma Gerda.

import { Painter, hash } from '../render/painter.js';
import { getSprite } from '../render/pixel.js';
import { tree, flower, lamp } from '../render/town.js';
import { car, motorbike, rocket, stepParticles, drawParticles } from '../render/vehicles.js';

const W = 480, H = 270;
const SIDEWALK = 199, BIKE = 213, CAR = 231, MOTO = 249;
const PX_PER_M = 4.6;
const VK = 1.8; // Fahrzeuge größer zeichnen, damit sie zu den Figuren passen
const RK = 1.7;
const MK = 1.35; // nur für die Mess-Etiketten (Welt-Pixel pro Meter)
const CAR_COLS = [['#e43b44', '#a12a35'], ['#41a6f6', '#2a6fb0'], ['#ffcd75', '#d19a3c'], ['#38b764', '#257179']];
const TALK = [
  ['oma', 'Na, junger Mann, was messen Sie denn da?'],
  ['flo', 'Ihre Geschwindigkeit: 0,8 m/s!'],
  ['oma', 'Frechheit! Mit dem Rollator bin ich flott!'],
  ['flo', 'Gleichförmig und vorbildlich, Frau Gerda!'],
];

export class TitleScene {
  constructor(canvas) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.t = 0;
    this.smoke = [];
    this.puffs = [];
    this.flash = 0;
    this.flo = { x: 230, target: 230, pose: 'note', poseUntil: 0, face: 1, walk: 0, nextWalk: 4 };
    this.oma = { x: -30, talkIdx: -1, talkT: 0, talked: false };
    this.bubble = null;
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.resize();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const r = this.c.getBoundingClientRect();
    if (!r.width) return;
    this.c.width = Math.round(r.width * dpr);
    this.c.height = Math.round(r.height * dpr);
    this.dpr = dpr;
    // "cover": Szene füllt den ganzen Bildschirm, Ränder dürfen abgeschnitten werden
    this.s = Math.max(this.c.width / W, this.c.height / H);
    this.ox = (this.c.width - W * this.s) / 2;
    this.oy = this.c.height - H * this.s; // unten bündig: abgeschnitten wird nur Himmel
  }

  start() {
    this.running = true;
    let last = performance.now();
    const loop = (now) => {
      if (!this.running) return;
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      this.update(dt);
      this.draw();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  stop() { this.running = false; this.ro.disconnect(); }

  /** Trifft ein Klick (Bildschirmkoordinaten) Oma Gerda? Für den versteckten Testmodus. */
  hitOma(cx, cy) {
    const r = this.c.getBoundingClientRect();
    const wx = ((cx - r.left) * this.dpr - this.ox) / this.s;
    const wy = ((cy - r.top) * this.dpr - this.oy) / this.s;
    const sp = getSprite('oma_rollator');
    return Math.abs(wx - (this.oma.x + 18)) <= sp.w + 4 && wy <= SIDEWALK + 4 && wy >= SIDEWALK - sp.h * 2 - 6;
  }

  // ---------- Zustände ----------
  carX() { return ((this.t * 70) % 720) - 120; }
  carCol() { return CAR_COLS[Math.floor((this.t * 70) / 720) % CAR_COLS.length]; }
  bikeX() { return ((this.t * 26 + 300) % 640) - 80; }
  motoX() { return 560 - ((this.t * 165 + 200) % 900); }
  rocketPhase() { return this.t % 18; } // 0–4 Countdown, 4–14 Flug, danach neu aufbauen
  rocketY() {
    const p = this.rocketPhase() - 4.5;
    return p < 0 ? 0 : 0.5 * 9 * p * p;
  }

  update(dt) {
    this.t += dt;
    const t = this.t, f = this.flo, o = this.oma;
    // Oma: langsam, bleibt zum Plaudern stehen
    if (o.talkIdx < 0 || o.talkIdx >= TALK.length) o.x += 3.7 * dt;
    if (o.x > 520) { o.x = -40; o.talked = false; o.talkIdx = -1; }
    if (!o.talked && Math.abs(o.x + 14 - f.x) < 26 && o.x < f.x) { o.talkIdx = 0; o.talkT = t; o.talked = true; f.target = f.x; }
    if (o.talkIdx >= 0 && o.talkIdx < TALK.length) {
      f.face = -1;
      if (t - o.talkT > 2.4) { o.talkIdx++; o.talkT = t; }
      this.bubble = o.talkIdx < TALK.length ? TALK[o.talkIdx] : null;
    } else this.bubble = null;
    const talking = this.bubble !== null;

    // Rakete: Zündung -> Foto mit Blitz
    const rp = this.rocketPhase();
    if (rp > 4.5 && rp < 4.55 && !talking) this.photo(1.6);
    if (rp > 3.6 && rp < 13) {
      const ry = 160 - this.rocketY();
      const n = rp < 4.5 ? 1 : 3;
      for (let i = 0; i < n; i++) this.smoke.push({ x: 418 + (Math.random() - 0.5) * 6, y: ry + 6, vx: (Math.random() - 0.5) * 18, vy: 10 + Math.random() * 10, r: 2 + Math.random() * 2, life: 2.5, max: 2.5, grow: 5 });
    }
    // Motorrad an Florian vorbei -> Foto
    const mx = this.motoX();
    if (Math.abs(mx + 28 - f.x) < 5 && !talking && t > f.poseUntil) this.photo(1.0);
    // Abgase
    if (Math.random() < dt * 8) this.puffs.push({ x: this.carX() + 3, y: CAR - 9, vx: -12, vy: -6, r: 1, life: 1.2, max: 1.2, grow: 2, alpha: 0.5 });
    if (Math.random() < dt * 14) this.puffs.push({ x: mx + 52, y: MOTO - 14, vx: 20, vy: -4, r: 1, life: 0.8, max: 0.8, grow: 3, alpha: 0.45 });
    stepParticles(this.smoke, dt, 8);
    stepParticles(this.puffs, dt);
    this.flash = Math.max(0, this.flash - dt * 3);

    // Florian: kleine Wege auf dem Gehweg, sonst Notizen
    if (!talking && t > f.poseUntil) {
      if (t > f.nextWalk) { f.target = 170 + hash(Math.floor(t), 3, 5) * 140; f.nextWalk = t + 6 + hash(Math.floor(t), 9, 2) * 4; }
      const d = f.target - f.x;
      if (Math.abs(d) > 1) { f.x += Math.sign(d) * Math.min(Math.abs(d), 28 * dt); f.face = Math.sign(d); f.pose = 'walk'; f.walk += dt; }
      else { f.pose = 'note'; f.face = this.carX() > f.x ? 1 : f.face; }
    } else if (talking) f.pose = 'stand';
  }

  photo(dur) {
    const f = this.flo;
    f.pose = 'photo';
    f.poseUntil = this.t + dur;
    f.face = this.rocketPhase() > 4 && this.rocketPhase() < 6 ? 1 : f.face;
    setTimeout(() => (this.flash = 1), 350);
  }

  // ---------- Zeichnen ----------
  draw() {
    const P = new Painter(this.ctx, this.s, this.ox, this.oy);
    const t = this.t;
    this.#sky(P, t);
    this.#skyline(P, t);
    this.#rocketPad(P, t);
    this.#ground(P, t);
    // Gehweg-Figuren
    const o = this.oma;
    const omaMoving = o.talkIdx < 0 || o.talkIdx >= TALK.length;
    this.#sprite(P, 'oma_rollator', o.x + 18, SIDEWALK, 2, false, omaMoving);
    this.#florian(P, t);
    // Straße: Fahrrad, Auto, Motorrad
    this.#sprite(P, 'cyclist', this.bikeX() + 16, BIKE, 2, false, true);
    const [col, colD] = this.carCol();
    drawParticles(P, this.puffs);
    const PV = new Painter(this.ctx, this.s * VK, this.ox, this.oy);
    car(PV, this.carX() / VK, CAR / VK, this.t * 70 / VK, col, colD, t);
    const mx = this.motoX();
    for (let i = 0; i < 6; i++) {
      const len = 10 + hash(i, Math.floor(t * 10), 4) * 18;
      P.rect(mx + 56 + i * 4, MOTO - 28 + i * 4, len, 1, 'rgba(255,255,255,0.55)');
    }
    const PM = new Painter(this.ctx, this.s * MK, this.ox, this.oy);
    motorbike(PM, mx / MK, MOTO / MK, -this.t * 165 / MK, t);
    this.#foreground(P, t);
    this.#tags(P, t);
    this.#bubble(P);
    if (this.flash > 0) {
      const f = this.flo;
      const fx = f.x + f.face * 10, fy = SIDEWALK - 34;
      for (let r = 26; r > 0; r -= 4) P.blob(fx, fy, Math.round(r * this.flash), `rgba(255,255,255,${0.12 + (26 - r) / 60})`);
      this.ctx.fillStyle = `rgba(255,255,255,${this.flash * 0.25})`;
      this.ctx.fillRect(0, 0, this.c.width, this.c.height);
    }
  }

  #sky(P, t) {
    const bands = ['#2b2f6b', '#383d82', '#4b4c98', '#6a5aa8', '#8f66ae', '#b874a6', '#dc8a92', '#f2a57f', '#ffc285', '#ffd99a'];
    const h = 158 / bands.length;
    bands.forEach((c, i) => P.rect(0, i * h, W, h + 1, c));
    for (let i = 0; i < 40; i++) {
      const x = hash(i, 1, 3) * W, y = hash(i, 2, 3) * 60;
      if (Math.sin(t * 2 + i) > -0.2) P.px(x, y, i % 3 ? 'rgba(255,255,255,0.6)' : '#fff8d0');
    }
    // Sonne mit Schein
    for (let r = 34; r > 18; r -= 4) P.blob(110, 132, r, `rgba(255,224,150,${0.05 + (34 - r) / 200})`);
    P.blob(110, 132, 17, '#ffe08a'); P.blob(107, 129, 12, '#fff1c4');
    // Wolken (Parallaxe)
    for (let i = 0; i < 6; i++) {
      const speed = 4 + i * 1.5;
      const x = ((hash(i, 7, 1) * 600 + t * speed) % 640) - 80, y = 20 + hash(i, 8, 1) * 70;
      P.blob(x, y, 14, 'rgba(255,230,240,0.55)', 5); P.blob(x + 10, y - 4, 10, 'rgba(255,240,245,0.7)', 5); P.blob(x - 9, y + 1, 8, 'rgba(255,240,245,0.6)', 4);
    }
    // Vogelschwarm
    const bx = ((t * 18) % 700) - 100;
    for (let i = 0; i < 5; i++) {
      const x = bx - i * 9 - (i % 2) * 2, y = 58 + Math.abs(i - 2) * 5 + Math.sin(t * 2 + i) * 1.5;
      const up = Math.sin(t * 9 + i) > 0;
      P.px(x - 1, y - (up ? 1 : 0), '#2b2f6b'); P.px(x, y, '#2b2f6b'); P.px(x + 1, y - (up ? 1 : 0), '#2b2f6b');
    }
  }

  #skyline(P, t) {
    for (let i = 0; i < 22; i++) {
      const x = i * 23 - 10, h = 18 + hash(i, 4, 2) * 34, w = 18 + hash(i, 5, 2) * 8;
      P.rect(x, 158 - h, w, h, i % 2 ? '#5a4d8f' : '#4f4485');
      for (let wy = 158 - h + 4; wy < 154; wy += 6) for (let wx = x + 3; wx < x + w - 3; wx += 5)
        if (hash(wx, wy, Math.floor(t / 3)) < 0.28) P.rect(wx, wy, 2, 2, '#ffd98a');
    }
    // Hügel mit Bäumen
    for (let x = 0; x < W; x += 2) {
      const h = 10 + Math.sin(x * 0.02) * 6 + Math.sin(x * 0.051) * 4;
      P.rect(x, 168 - h, 2, h + 20, x % 4 ? '#3f8f4a' : '#3a8545');
    }
    for (const [x, k] of [[20, 'round'], [60, 'pine'], [150, 'birch'], [190, 'round'], [300, 'blossom'], [340, 'pine'], [470, 'round']]) tree(P, k, x, 172, t);
  }

  #rocketPad(P, t) {
    // Startturm auf dem Hügel rechts
    P.rect(404, 128, 3, 36, '#566c86');
    for (let y = 130; y < 162; y += 5) P.rect(404, y, 9, 1, '#566c86');
    P.rect(398, 162, 40, 4, '#333c57'); P.rect(400, 161, 36, 1, '#94b0c2');
    const rp = this.rocketPhase();
    drawParticles(P, this.smoke);
    if (rp < 14) {
      const ry = 161 - this.rocketY();
      const thrust = rp < 3.6 ? 0 : rp < 4.5 ? (rp - 3.6) / 0.9 : 1;
      const shake = rp > 3.8 && rp < 5 ? Math.round(Math.sin(t * 60)) : 0;
      if (ry > -80) rocket(new Painter(this.ctx, this.s * RK, this.ox, this.oy), (418 + shake) / RK, ry / RK, t, thrust);
      if (rp < 4.5) {
        const n = Math.max(0, Math.ceil(4.5 - rp));
        if (rp > 1.5) P.text(n > 0 ? `${n}` : 'Zündung!', 418, 112, 8, { color: '#ffffff', bold: true, bg: 'rgba(26,28,44,0.6)', minPx: 12, dpr: this.dpr });
      }
    }
  }

  #ground(P, t) {
    P.rect(0, 172, W, 14, '#4fa33c');
    for (let x = 0; x < W; x += 3) if (hash(x, 1, 6) < 0.4) P.px(x, 173 + hash(x, 2, 6) * 12, '#3f8f2a');
    // Gehweg
    P.rect(0, 186, W, 16, '#cfc6b4'); P.rect(0, 186, W, 1, '#e3dccd');
    for (let x = 0; x < W; x += 12) P.rect(x, 186, 1, 16, '#b9ae99');
    P.rect(0, 201, W, 2, '#a39a8a');
    // Fahrbahn
    P.rect(0, 203, W, 48, '#5a6070');
    P.rect(0, 203, W, 12, '#4f7a58'); // Radweg
    for (let x = 30; x < W; x += 120) { P.rect(x, 207, 10, 1, '#f4f4f4'); P.blob(x + 2, 211, 2, '#f4f4f4'); P.blob(x + 9, 211, 2, '#f4f4f4'); }
    P.rect(0, 215, W, 1, '#f4f4f4');
    for (let x = 0; x < W; x += 16) P.rect(x, 234, 9, 1, '#ffcd75');
    for (let i = 0; i < 200; i++) P.px(hash(i, 3, 8) * W, 216 + hash(i, 4, 8) * 34, '#4a4f5e');
    P.rect(0, 251, W, 2, '#d6d0c4');
  }

  #foreground(P, t) {
    P.rect(0, 253, W, 17, '#4fa33c');
    for (let i = 0; i < 40; i++) {
      const x = 4 + i * 12 + hash(i, 1, 4) * 6, sway = Math.round(Math.sin(t * 2 + i) * 0.7);
      flower(P, x + sway, 262 + hash(i, 2, 4) * 5, ['#ef476f', '#ffd166', '#f78ad1', '#b78cff', '#ffffff'][i % 5]);
    }
    for (const x of [60, 300]) lamp(P, x, 200, t);
  }

  #sprite(P, name, cx, base, sc, flip, moving) {
    const sp = getSprite(name);
    const f = moving ? Math.floor(this.t * sp.fps) % sp.frames.length : 0;
    P.blob(cx, base, sp.w * sc * 0.4, 'rgba(20,24,40,0.25)', 2);
    P.image(sp.frames[f], cx - (sp.w * sc) / 2, base - sp.h * sc, sp.w * sc, sp.h * sc, flip);
  }

  #florian(P, t) {
    const f = this.flo;
    const name = f.pose === 'photo' ? 'florian_photo' : f.pose === 'note' ? 'florian_note' : 'florian';
    const moving = f.pose === 'walk' || f.pose === 'note';
    this.#sprite(P, name, f.x, SIDEWALK, 2, f.face < 0, moving);
    if (f.pose === 'note' && Math.sin(t * 3) > 0.6) P.text('✎', f.x + f.face * 16, SIDEWALK - 46, 6, { color: '#ffffff', minPx: 10, dpr: this.dpr });
    if (f.pose === 'photo' && this.flash > 0.5) P.text('KLICK!', f.x + f.face * 18, SIDEWALK - 52, 6, { color: '#1a1c2c', bold: true, bg: '#ffcd75', minPx: 10, dpr: this.dpr });
  }

  #tags(P, t) {
    const tag = (x, y, txt, dir, len, col = '#73eff7') => {
      P.text(txt, x, y, 5, { color: '#ffffff', bg: 'rgba(26,28,44,0.75)', minPx: 10, dpr: this.dpr });
      const ay = y + 6;
      P.rect(dir > 0 ? x - len / 2 : x - len / 2, ay, len, 1, col);
      const hx = dir > 0 ? x + len / 2 : x - len / 2;
      P.px(hx - dir, ay - 1, col); P.px(hx - dir, ay + 1, col); P.px(hx - 2 * dir, ay - 2, col); P.px(hx - 2 * dir, ay + 2, col);
    };
    const v = (pxs) => (pxs / PX_PER_M).toLocaleString('de-DE', { maximumFractionDigits: 1 });
    tag(this.carX() + 42, CAR - 44, `v = ${v(70)} m/s`, 1, 30);
    tag(this.bikeX() + 16, BIKE - 36, `v = ${v(26)} m/s`, 1, 12);
    tag(this.motoX() + 28, MOTO - 42, `v = ${v(165)} m/s  ⚠`, -1, 44, '#ff6b6b');
    const rp = this.rocketPhase();
    if (rp > 5.2 && rp < 12) tag(450, 150 - this.rocketY() - 34, 'a = 9 m/s²', 0, 0, '#ffcd75');
  }

  #bubble(P) {
    if (!this.bubble) return;
    const [who, txt] = this.bubble;
    const x = who === 'oma' ? this.oma.x + 18 : this.flo.x;
    const y = SIDEWALK - (who === 'oma' ? 44 : 56);
    P.text(txt, x, y, 5.5, { color: '#1a1c2c', bg: '#ffffff', pad: 3, minPx: 11, dpr: this.dpr });
    P.rect(x - 1, y + 5, 3, 3, '#ffffff');
  }
}
