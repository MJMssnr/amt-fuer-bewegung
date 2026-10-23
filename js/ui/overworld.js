// Stadtkarte: Florian läuft per Tippen von Ort zu Ort. Rendert in voller Bildschirmauflösung
// (keine Unschärfe durch Hochskalieren). Daten: data/map.json, Grafik: js/render/town.js + buildings.js

import { Painter } from '../render/painter.js';
import { getSprite } from '../render/pixel.js';
import { drawGround, decor, shadow } from '../render/town.js';
import { BUILDINGS, halfpipe, rail, funbox, parkedCar } from '../render/buildings.js';
import { treehouse } from '../render/treehouse.js';
import { school } from '../render/school.js';

BUILDINGS.treehouse = treehouse;
BUILDINGS.school = school;

const SPEED = 140; // Welt-Pixel pro Sekunde

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
    let last = performance.now();
    const loop = (now) => {
      if (!this.running) return;
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      this.time += dt;
      this.#walk(dt);
      this.draw();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  stop() { this.running = false; }

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
    if (this.path.length || this.locked?.()) return;
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
    if (best === this.node) { this.onArrive?.(best); return; }
    this.path = this.#route(this.node, best);
  }

  #walk(dt) {
    if (!this.path.length) return;
    this.walkTime += dt;
    let budget = SPEED * dt;
    while (budget > 0 && this.path.length) {
      const tgt = this.path[0];
      const dx = tgt.x - this.pos.x, dy = tgt.y - this.pos.y;
      const d = Math.hypot(dx, dy);
      if (Math.abs(dx) > Math.abs(dy)) { this.dir = 'side'; this.flip = dx < 0; }
      else if (Math.abs(dy) > 0.01) this.dir = dy > 0 ? 'down' : 'up';
      if (d <= budget) {
        this.pos = { x: tgt.x, y: tgt.y };
        budget -= d;
        this.path.shift();
        this.node = tgt.id;
        if (!this.path.length) { this.dir = 'down'; this.onArrive?.(this.node); }
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
      items.push({ y: d.y, draw: () => this.#decor(P, d, t) });
    }
    items.push({ y: this.pos.y + 0.5, draw: () => this.#florian(P) });
    items.sort((a, b) => a.y - b.y).forEach((it) => it.draw());
    this.#markers(P);
    this.#labels(P);
  }

  #decor(P, d, t) {
    switch (d.type) {
      case 'halfpipe': return halfpipe(P, d.x, d.y, d.w);
      case 'rail': return rail(P, d.x, d.y, d.w);
      case 'funbox': return funbox(P, d.x, d.y);
      case 'car': return parkedCar(P, d.x, d.y, d.color);
      default: return decor(P, d, t);
    }
  }

  #florian(P) {
    const moving = this.path.length > 0;
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
      } else if (state === 'done') {
        P.blob(x, y + 2, 6, C_INK); P.blob(x, y + 2, 5, '#38b764');
        P.rect(x - 3, y + 2, 2, 2, '#f4f4f4'); P.rect(x - 1, y + 3, 2, 2, '#f4f4f4'); P.rect(x + 1, y - 1, 2, 4, '#f4f4f4');
      }
    }
  }

  #labels(P) {
    for (const n of Object.values(this.map.nodes)) {
      if (n.junction || !n.name) continue;
      const [lx, ly] = n.label ?? [n.x, n.y + 18];
      P.text(n.name, lx, ly, 6, { color: '#ffffff', bg: 'rgba(26,28,44,0.78)', pad: 2, minPx: 11, dpr: this.dpr });
    }
  }
}

const C_INK = '#1a1c2c';
