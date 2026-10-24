// Stadtkarte: Florian läuft per Tippen von Ort zu Ort. Rendert in voller Bildschirmauflösung
// (keine Unschärfe durch Hochskalieren). Daten: data/map.json, Grafik: js/render/town.js + buildings.js

import { Painter } from '../render/painter.js';
import { getSprite } from '../render/pixel.js';
import { drawGround, decor, shadow } from '../render/town.js';
import { BUILDINGS, halfpipe, rail, funbox, parkedCar } from '../render/buildings.js';
import { treehouse } from '../render/treehouse.js';
import { school } from '../render/school.js';
import { fotolabor } from '../render/fotolabor.js';
import { police, workshop } from '../render/places2.js';
import { bauplatz } from '../render/bauplatz.js';
import { natureOn, natureOff, sfx, engineStart, engineSet, engineStop } from '../audio/sound.js';
import { bikeRide, motoRide, smoke } from '../render/ride.js';
import { TownLife } from './townlife.js';
import { windmill, solar, cloud, riverFlow, dock } from '../render/townlife-art.js';

BUILDINGS.treehouse = treehouse;
BUILDINGS.school = school;
BUILDINGS.fotolabor = fotolabor;
BUILDINGS.bauplatz = bauplatz;
BUILDINGS.police = police;
BUILDINGS.workshop = workshop;
BUILDINGS.dock = dock;

const SPEED = 140; // Welt-Pixel pro Sekunde (zu Fuß)
// Fahrzeuge [W26]: Höchstgeschwindigkeit und Beschleunigung (Welt-Pixel/s bzw. /s²)
const RIDE = { walk: { v: SPEED, a: 1e9 }, bike: { v: 250, a: 520 }, moto: { v: 460, a: 950 } };

export class Overworld {
  constructor(canvas, map, { onArrive, markers }) {
    this.c = canvas;
    this.map = map;
    [this.W, this.H] = map.size;
    this.ctx = canvas.getContext('2d');
    this.onArrive = onArrive;
    this.markers = markers; // () => { nodeId: 'open' | 'done' }
    this.node = map.start;
    const n = map.nodes[this.node];
    this.pos = { x: n.x, y: n.y };
    this.path = [];
    this.dir = 'down';
    this.flip = false;
    this.time = 0;
    this.walkTime = 0;
    this.adj = {};
    for (const [a, b] of map.roads) {
      (this.adj[a] ??= []).push(b);
      (this.adj[b] ??= []).push(a);
    }
    this.life = new TownLife(); // Radler und Fußgänger [W33]
    canvas.addEventListener('pointerup', (e) => this.#tap(e));
    new ResizeObserver(() => this.#resize()).observe(canvas);
    this.#resize();
  }

  #resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const r = this.c.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.c.width = Math.round(r.width * dpr);
    this.c.height = Math.round(r.height * dpr);
    this.dpr = dpr;
    this.s = Math.min(this.c.width / this.W, this.c.height / this.H);
    this.ox = (this.c.width - this.W * this.s) / 2;
    this.oy = (this.c.height - this.H * this.s) / 2;
    // Boden einmal vorrendern
    this.ground = document.createElement('canvas');
    this.ground.width = this.c.width;
    this.ground.height = this.c.height;
    const g = this.ground.getContext('2d');
    g.fillStyle = '#3f8f2a';
    g.fillRect(0, 0, this.c.width, this.c.height);
    drawGround(new Painter(g, this.s, this.ox, this.oy), this.map);
    this.draw();
  }

  setNode(id) {
    if (!this.map.nodes[id]) return;
    this.node = id;
    const n = this.map.nodes[id];
    this.pos = { x: n.x, y: n.y };
  }

  start() {
    if (this.running) return;
    this.running = true;
    natureOn(); // Vogelzwitschern nur auf der Karte
    let last = performance.now();
    const loop = (now) => {
      if (!this.running) return;
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      this.time += dt;
      this.#walk(dt);
      this.life.step(dt);
      this.draw();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  stop() { this.running = false; natureOff(); }

  // Kürzester Weg nach Strecke (Dijkstra; die Karte ist klein)
  #route(from, to) {
    const N = this.map.nodes;
    const dist = { [from]: 0 }, prev = {}, open = new Set([from]), done = new Set();
    while (open.size) {
      const cur = [...open].reduce((a, b) => (dist[a] <= dist[b] ? a : b));
      open.delete(cur);
      if (cur === to) break;
      done.add(cur);
      for (const nb of this.adj[cur] || []) {
        if (done.has(nb)) continue;
        const d = dist[cur] + Math.abs(N[cur].x - N[nb].x) + Math.abs(N[cur].y - N[nb].y);
        if (d < (dist[nb] ?? Infinity)) { dist[nb] = d; prev[nb] = cur; open.add(nb); }
      }
    }
    if (!(to in dist)) return [];
    const ids = [];
    for (let c = to; c !== undefined; c = prev[c]) ids.unshift(c);
    return ids.slice(1).map((id) => ({ x: N[id].x, y: N[id].y, id }));
  }

  #tap(e) {
    if (this.locked?.()) return;
    const r = this.c.getBoundingClientRect();
    const x = ((e.clientX - r.left) * this.dpr - this.ox) / this.s;
    const y = ((e.clientY - r.top) * this.dpr - this.oy) / this.s;
    let best = null, bd = 34;
    for (const [id, n] of Object.entries(this.map.nodes)) {
      if (n.junction) continue;
      const [bx, by] = n.at ?? [n.x, n.y - 20];
      const d = Math.min(Math.hypot(n.x - x, n.y - y), Math.hypot(bx - x, by - 18 - y) * 0.8);
      if (d < bd) { bd = d; best = id; }
    }
    if (!best) return;
    // Unterwegs umentscheiden [W28]: vom nächsten Wegpunkt aus neu planen, Fahrt läuft ohne Halt weiter
    if (this.path.length) {
      const next = this.path[0], N = this.map.nodes, prev = { ...N[this.node], id: this.node };
      const len = (from, pts) => pts.reduce((s, p, i) => s + Math.hypot(p.x - (i ? pts[i - 1].x : from.x), p.y - (i ? pts[i - 1].y : from.y)), 0);
      const via = (n) => [n, ...(n.id === best ? [] : this.#route(n.id, best))];
      const a = via(next), b = via(prev); // weiter oder umdrehen – was ist kürzer?
      this.path = len(this.pos, a) <= len(this.pos, b) ? a : b;
      return;
    }
    if (best === this.node) { this.onArrive?.(best); return; }
    this.path = this.#route(this.node, best);
    if (this.path.length) this.#depart();
  }

  /** Abfahrt: Fahrmodus festlegen, Geräusche starten */
  #depart() {
    this.ride = this.mode?.() ?? 'walk';
    this.v = this.ride === 'walk' ? SPEED : 0;
    this.rideT = 0; this.dist ??= 0; this.puffs = []; this.lean = 0;
    if (this.ride === 'bike') sfx('bell');
    if (this.ride === 'moto') engineStart();
  }

  #walk(dt) {
    if (!this.path.length) return;
    this.walkTime += dt;
    // Geschwindigkeitsprofil: anfahren mit a, rechtzeitig bremsen (v² = 2·a·Restweg)
    const R = RIDE[this.ride ?? 'walk'];
    let rest = 0, px = this.pos.x, py = this.pos.y;
    for (const p of this.path) { rest += Math.hypot(p.x - px, p.y - py); px = p.x; py = p.y; }
    this.rideT = (this.rideT ?? 0) + dt;
    this.rest = rest;
    this.v = Math.min(R.v, (this.v ?? 0) + R.a * dt, Math.sqrt(2 * R.a * rest) + 25);
    if (this.ride === 'moto') engineSet(this.v / R.v);
    this.lean = Math.max(0, (this.lean ?? 0) - dt * 2.5);
    let budget = this.v * dt;
    this.dist = (this.dist ?? 0) + budget;
    while (budget > 0 && this.path.length) {
      const tgt = this.path[0];
      const dx = tgt.x - this.pos.x, dy = tgt.y - this.pos.y;
      const d = Math.hypot(dx, dy);
      if (Math.abs(dx) > Math.abs(dy)) { this.dir = 'side'; this.flip = dx < 0; }
      else if (Math.abs(dy) > 0.01) this.dir = dy > 0 ? 'down' : 'up';
      if (d <= budget) {
        this.pos = { x: tgt.x, y: tgt.y };
        budget -= d;
        const prevDir = this.dir;
        this.path.shift();
        this.node = tgt.id;
        if (this.path.length) { // Kurve? Dann Schräglage (Motorrad: Knie am Boden)
          const nx = this.path[0].x - tgt.x, ny = this.path[0].y - tgt.y;
          const newDir = Math.abs(nx) > Math.abs(ny) ? 'side' : 'vert';
          if ((prevDir === 'side') !== (newDir === 'side')) this.lean = 0.6;
        }
        if (!this.path.length) {
          this.dir = 'down';
          if (this.ride === 'moto') engineStop();
          this.ride = 'walk';
          this.onArrive?.(this.node);
        }
      } else {
        this.pos.x += (dx / d) * budget;
        this.pos.y += (dy / d) * budget;
        budget = 0;
      }
    }
  }

  // ---------- Zeichnen ----------

  draw() {
    if (!this.ground) return;
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.ground, 0, 0);
    const P = new Painter(ctx, this.s, this.ox, this.oy);
    const t = this.time;
    const items = [];
    for (const n of Object.values(this.map.nodes)) {
      const fn = BUILDINGS[n.building];
      if (!fn) continue;
      const [cx, by] = n.at ?? [n.x, n.y - 13];
      items.push({ y: by, draw: () => fn(P, cx, by, n, t, this.dpr) });
    }
    for (const d of this.map.decor || []) {
      items.push({ y: d.z ?? d.y, draw: () => this.#decor(P, d, t) }); // z: Zeichenreihenfolge (z. B. Solar auf dem Dach)
    }
    items.push({ y: this.pos.y + 0.5, draw: () => this.#florian(P) });
    items.push(...this.life.items(P, this.dpr));
    items.sort((a, b) => a.y - b.y).forEach((it) => it.draw());
    // zwei fast durchsichtige Wolken ziehen am oberen und unteren Rand entlang [W33]
    cloud(P, ((t * 6) % (this.W + 120)) - 60, 26, 1.2);
    cloud(P, this.W + 60 - ((t * 4 + 300) % (this.W + 120)), this.H - 52, 1);
    this.#markers(P);
    this.#labels(P);
  }

  #decor(P, d, t) {
    switch (d.type) {
      case 'halfpipe': return halfpipe(P, d.x, d.y, d.w);
      case 'rail': return rail(P, d.x, d.y, d.w);
      case 'funbox': return funbox(P, d.x, d.y);
      case 'car': return parkedCar(P, d.x, d.y, d.color);
      case 'windmill': return windmill(P, d.x, d.y, t, d.h, d.x * 0.1);
      case 'solar': return solar(P, d.x, d.y, d.n, t);
      case 'riverflow': return riverFlow(P, d.x, d.y, d.w, d.h, t);
      default: return decor(P, d, t);
    }
  }

  #florian(P) {
    const moving = this.path.length > 0;
    if (moving && this.ride === 'bike') { shadow(P, this.pos.x, this.pos.y + 1, 16); bikeRide(P, this.pos.x, this.pos.y + 1, this.dir, this.flip, this.dist); return; }
    if (moving && this.ride === 'moto') {
      // Wheelie beim Anfahren, Stoppie beim Ankommen
      let pitch = 0;
      if (this.rideT < 0.7) pitch = 0.45 * Math.sin((Math.PI * this.rideT) / 0.7);
      else if (this.rest < 34) pitch = -0.3 * Math.sin((Math.PI * (1 - this.rest / 34)) * 0.9);
      if (this.dir === 'side' && Math.random() < 0.5) this.puffs.push({ x: this.pos.x - (this.flip ? -9 : 9), y: this.pos.y - 6, vx: this.flip ? -1 : 1, t0: this.time });
      this.puffs = this.puffs.filter((p) => this.time - p.t0 < 0.9);
      smoke(P, this.puffs, this.time);
      shadow(P, this.pos.x, this.pos.y + 1, 18);
      motoRide(P, this.pos.x, this.pos.y + 1, this.dir, this.flip, this.dist, { pitch, lean: this.lean, t: this.time });
      return;
    }
    const sp = getSprite(`florian_${this.dir}`);
    const n = sp.frames.length;
    const f = moving ? Math.floor(this.walkTime * sp.fps) % n : 0;
    const bob = moving && f % 2 === 1 ? 1 : 0;
    shadow(P, this.pos.x, this.pos.y + 1, 12);
    P.image(sp.frames[f], this.pos.x - sp.w / 2, this.pos.y - sp.h + 2 - bob, sp.w, sp.h, this.dir === 'side' && this.flip);
  }

  // Erster Auftrag: großes Ausrufezeichen mit Puls-Ring und tippendem Finger
  #tutorialMarker(P, x, y) {
    y = Math.max(y, 34); // nie oben aus dem Bild
    const pulse = (this.time * 1.5) % 1;
    P.blob(x, y, Math.round(10 + pulse * 14), `rgba(255,205,117,${(0.55 * (1 - pulse)).toFixed(2)})`);
    P.rect(x - 11, y - 14, 23, 28, C_INK); P.rect(x - 10, y - 13, 21, 26, '#ffcd75'); P.rect(x - 10, y - 13, 21, 3, '#fff1c4');
    P.rect(x - 2, y - 9, 5, 12, C_INK); P.rect(x - 2, y + 6, 5, 4, C_INK);
    P.rect(x - 2, y + 14, 5, 3, C_INK); P.rect(x, y + 17, 1, 2, C_INK);
    const tap = Math.abs(Math.sin(this.time * 3.2));
    const fx = x + 4 + Math.round(tap * 6), fy = y + 8 + Math.round(tap * 6);
    const HAND = ['...kk....', '..kssk...', '..kssk...', '..ksskkk.', '..ksskssk', 'kkksssssk', 'ksksssssk', 'kssssssSk', '.kssssSk.', '..kwwwk..', '..kwwwk..', '..kkkkk..'];
    const pal = { k: C_INK, s: '#f2c9a0', S: '#d9a07a', w: '#f4f4f4' };
    // Finger in doppelter Größe
    HAND.forEach((row, j) => [...row].forEach((ch, i) => { if (pal[ch]) P.rect(fx + i * 2, fy + j * 2, 2, 2, pal[ch]); }));
    if (tap > 0.85) for (const [dx, dy] of [[-3, -2], [-5, 3], [1, -5]]) P.rect(fx + dx, fy + dy, 2, 2, '#ffffff');
    P.text('Hier tippen!', x, y - 22, 6, { color: C_INK, bold: true, bg: '#ffffff', pad: 2, minPx: 12, dpr: this.dpr });
  }

  #markers(P) {
    const m = this.markers?.() || {};
    for (const [id, state] of Object.entries(m)) {
      const n = this.map.nodes[id];
      const [cx, by] = n.at ?? [n.x, n.y - 13];
      const top = by - (n.markerH ?? 46);
      const bob = state === 'open' ? Math.round(Math.sin(this.time * 4) * 2) : 0;
      const x = cx, y = top + bob;
      if (state === 'open' && this.tutorial?.()) {
        this.#tutorialMarker(P, x, y);
      } else if (state === 'open') {
        P.blob(x, y + 8, 7, 'rgba(20,24,40,0.0)');
        P.rect(x - 6, y - 7, 13, 15, C_INK); P.rect(x - 5, y - 6, 11, 13, '#ffcd75'); P.rect(x - 5, y - 6, 11, 2, '#fff1c4');
        P.rect(x - 1, y + 8, 3, 2, C_INK); P.rect(x, y + 10, 1, 1, C_INK);
        P.rect(x - 1, y - 4, 3, 6, C_INK); P.rect(x - 1, y + 3, 3, 2, C_INK);
      } else if (state === 'free') { // offen zum freien Üben, keine Belohnung: blauer Kreis mit Spiel-Dreieck [W37]
        P.blob(x, y + 2, 7, C_INK); P.blob(x, y + 2, 6, '#3b5dc9');
        P.rect(x - 2, y - 1, 2, 7, '#f4f4f4'); P.rect(x, y, 2, 5, '#f4f4f4'); P.rect(x + 2, y + 1, 1, 3, '#f4f4f4');
        P.text('frei', x + 13, y + 2, 3.6, { color: '#ffffff', bg: 'rgba(59,93,201,0.85)', pad: 1, minPx: 8, dpr: this.dpr });
      } else if (state === 'done') {
        P.blob(x, y + 2, 6, C_INK); P.blob(x, y + 2, 5, '#38b764');
        P.rect(x - 3, y + 2, 2, 2, '#f4f4f4'); P.rect(x - 1, y + 3, 2, 2, '#f4f4f4'); P.rect(x + 1, y - 1, 2, 4, '#f4f4f4');
      }
    }
  }

  // Ortsnamen nur in der Nähe [W33]: unsichtbar ab ~200 Bildschirm-px Abstand zu Florian, voll sichtbar ab ~130 px.
  // Das Ziel einer Fahrt wird immer angezeigt.
  #labels(P) {
    const far = 200 / (this.s / this.dpr), near = far * 0.65;
    const goal = this.path.at(-1)?.id;
    const ctx = this.ctx;
    for (const [id, n] of Object.entries(this.map.nodes)) {
      if (n.junction || !n.name) continue;
      const [bx, by] = n.at ?? [n.x, n.y];
      const d = Math.min(Math.hypot(n.x - this.pos.x, n.y - this.pos.y), Math.hypot(bx - this.pos.x, by - this.pos.y));
      const a = id === goal ? 1 : Math.max(0, Math.min(1, (far - d) / (far - near)));
      if (a <= 0.01) continue;
      const [lx, ly] = n.label ?? [n.x, n.y + 18];
      ctx.globalAlpha = a;
      P.text(n.name, lx, ly, 6, { color: '#ffffff', bg: 'rgba(26,28,44,0.78)', pad: 2, minPx: 11, dpr: this.dpr });
    }
    ctx.globalAlpha = 1;
  }
}

const C_INK = '#1a1c2c';
