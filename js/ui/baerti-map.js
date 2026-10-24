// Bärti auf der Stadtkarte [W42]: läuft auf Gehwegen (Straßennetz, Ecke rechts unten) und über Wiesen,
// wartet vor dem Überqueren einer Straße, bis kein Radler in der Nähe ist. Aktivitäten: Passanten besuchen
// (sie plaudern und geben ihm einen Keks), in einer Baumkrone schlafen, im Fluss schwimmen oder einen Fisch angeln.
// Ressourcensparend: einfache Zustandsmaschine, Wegsuche nur beim Start einer Aktivität (Karte ist klein).

import { getSprite } from '../render/pixel.js';
import { shadow } from '../render/town.js';

const OFF = 11, SPEED = 24, ROAD = 8.5, K = 0.55; // Gehweg-Versatz, Tempo (Welt-px/s), halbe Fahrbahn, Größe
const RIVER = { bank: 664, swim: 688, top: 40, bot: 330 };
const GRASS = [[60, 120], [140, 150], [250, 190], [400, 150], [480, 180], [600, 120], [180, 270], [420, 280], [600, 260], [60, 250], [240, 120]];
const rnd = (a, b) => a + Math.random() * (b - a);

export class BaertiMap {
  constructor(map, life) {
    this.map = map; this.life = life;
    this.nodes = Object.fromEntries(Object.entries(map.nodes).map(([id, n]) => [id, { x: n.x + OFF, y: n.y + OFF }]));
    this.adj = {};
    for (const [a, b] of map.roads) { (this.adj[a] ??= []).push(b); (this.adj[b] ??= []).push(a); }
    this.segs = map.roads.map(([a, b]) => [map.nodes[a], map.nodes[b]]);
    this.trees = map.decor.filter((d) => d.type === 'tree');
    const start = this.nodes.baumhaus;
    this.pos = { x: start.x, y: start.y }; this.path = []; this.state = 'idle'; this.until = 1; this.t = 0; this.flip = false;
    this.lift = 0; this.walk = 0;
  }

  onRoad(x, y) {
    return this.segs.some(([A, B]) => x >= Math.min(A.x, B.x) - ROAD && x <= Math.max(A.x, B.x) + ROAD && y >= Math.min(A.y, B.y) - ROAD && y <= Math.max(A.y, B.y) + ROAD);
  }
  crosses(a, b) { for (let i = 1; i < 10; i++) { const u = i / 10; if (this.onRoad(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u)) return true; } return false; }
  nearest(p) { let best = null, bd = Infinity; for (const [id, n] of Object.entries(this.nodes)) { const d = Math.hypot(n.x - p.x, n.y - p.y); if (d < bd) { bd = d; best = id; } } return best; }
  route(from, to) { // Breitensuche im Straßennetz
    const prev = { [from]: null }, q = [from];
    while (q.length) { const c = q.shift(); if (c === to) break; for (const nb of this.adj[c] ?? []) if (!(nb in prev)) { prev[nb] = c; q.push(nb); } }
    const ids = []; for (let c = to; c != null; c = prev[c]) ids.unshift(c);
    return ids.map((id) => this.nodes[id]);
  }
  goTo(target, then) {
    const a = this.nearest(this.pos), b = this.nearest(target);
    const near = Math.hypot(target.x - this.pos.x, target.y - this.pos.y) < 90 && !this.crosses(this.pos, target);
    this.path = (near ? [target] : [this.nodes[a], ...this.route(a, b).slice(1), target]).map((p) => ({ x: p.x, y: p.y }));
    this.state = 'walk'; this.then = then;
  }

  #choose() {
    const r = Math.random(), w = this.life?.walkers ?? [];
    if (r < 0.3 && w.length) {
      const p = w[Math.floor(Math.random() * w.length)];
      this.chase = 3; this.goTo(this.walkerPos(p), () => this.#visit(p));
    } else if (r < 0.52) {
      const tr = this.trees[Math.floor(Math.random() * this.trees.length)];
      this.goTo({ x: tr.x + 4, y: tr.y + 2 }, () => { this.state = 'climb'; this.tree = tr; });
    } else if (r < 0.75) {
      const y = rnd(RIVER.top, RIVER.bot);
      this.goTo({ x: RIVER.bank, y }, () => { this.state = Math.random() < 0.5 ? 'swimIn' : 'fish'; this.until = this.t + 3; });
    } else {
      const g = GRASS[Math.floor(Math.random() * GRASS.length)];
      this.goTo({ x: g[0] + rnd(-8, 8), y: g[1] + rnd(-6, 6) }, () => { this.state = 'idle'; this.until = this.t + rnd(2, 4); });
    }
  }
  walkerPos(w) { const L = w.lane, p = L.a + w.u * (L.b - L.a); return L.y !== undefined ? { x: p, y: L.y + 3 } : { x: L.x + 3, y: p }; }
  #visit(w) {
    const p = this.walkerPos(w);
    if (Math.hypot(p.x - this.pos.x, p.y - this.pos.y) > 22) { // weitergelaufen: hinterher (höchstens dreimal)
      if (this.chase-- > 0) this.goTo(p, () => this.#visit(w)); else { this.state = 'idle'; this.until = this.t + 1; }
      return;
    }
    w.chat = 4.5; w.cool = 10; w.bubble = '♥'; this.flip = p.x < this.pos.x;
    this.state = 'eat'; this.until = this.t + 3.5;
  }
  riderNear(p, r = 46) { return (this.life?.riderPositions?.() ?? []).some((q) => Math.hypot(q.x - p.x, q.y - p.y) < r); }

  step(dt) {
    this.t += dt;
    switch (this.state) {
      case 'idle': case 'eat': case 'fishing': if (this.t > this.until) { if (this.state === 'fishing') { this.state = 'eat'; this.fish = true; this.until = this.t + 3; } else { this.fish = false; this.#choose(); } } break;
      case 'walk': {
        const tgt = this.path[0];
        if (!tgt) { const f = this.then; this.then = null; this.state = 'idle'; this.until = this.t + 1; f?.(); break; }
        if (!this.legChecked) { // vor einer Straße: warten, bis kein Radler kommt
          this.legChecked = true;
          if (this.crosses(this.pos, tgt) && this.riderNear({ x: (this.pos.x + tgt.x) / 2, y: (this.pos.y + tgt.y) / 2 })) { this.state = 'waitRoad'; this.legChecked = false; break; }
        }
        const dx = tgt.x - this.pos.x, dy = tgt.y - this.pos.y, d = Math.hypot(dx, dy), v = SPEED * (this.onRoad(this.pos.x, this.pos.y) ? 1.7 : 1) * dt;
        if (Math.abs(dx) > 0.3) this.flip = dx < 0;
        this.walk += dt;
        if (d <= v) { this.pos = { ...tgt }; this.path.shift(); this.legChecked = false; } else { this.pos.x += (dx / d) * v; this.pos.y += (dy / d) * v; }
        break;
      }
      case 'waitRoad': { const tgt = this.path[0]; if (!tgt || !this.riderNear({ x: (this.pos.x + tgt.x) / 2, y: (this.pos.y + tgt.y) / 2 })) { this.state = 'walk'; this.legChecked = true; } break; }
      case 'climb': this.lift = Math.min(18, this.lift + dt * 14); if (this.lift >= 18) { this.state = 'sleep'; this.until = this.t + rnd(6, 10); } break;
      case 'sleep': if (this.t > this.until) this.state = 'down'; break;
      case 'down': this.lift = Math.max(0, this.lift - dt * 20); if (!this.lift) { this.state = 'idle'; this.until = this.t + 1; } break;
      case 'swimIn': this.pos.x = Math.min(RIVER.swim, this.pos.x + dt * 14); if (this.pos.x >= RIVER.swim) { this.state = 'swim'; this.until = this.t + rnd(4, 7); } break;
      case 'swim': this.pos.y = Math.min(RIVER.bot, this.pos.y + dt * 5); if (this.t > this.until) this.state = 'swimOut'; break; // treibt langsam mit
      case 'swimOut': this.pos.x = Math.max(RIVER.bank, this.pos.x - dt * 14); this.flip = true; if (this.pos.x <= RIVER.bank) { this.state = 'idle'; this.until = this.t + 1.5; } break;
      case 'fish': this.flip = false; this.state = 'fishing'; this.until = this.t + rnd(3, 5); break;
      default: this.#choose();
    }
  }

  items(P, dpr) {
    const y = this.pos.y;
    return [{ y: y + (this.lift ? 40 : 0), draw: () => this.#draw(P, dpr) }];
  }

  #draw(P, dpr) {
    const { x } = this.pos, y = this.pos.y - this.lift;
    const swimming = ['swim', 'swimIn', 'swimOut'].includes(this.state) && this.pos.x > RIVER.bank + 6;
    if (swimming) { // nur Kopf und Wellenring
      P.blob(x, y - 2, 4, 'rgba(255,255,255,0.45)', 2);
      P.blob(x, y - 3, 3, '#8f93a3'); P.rect(x - 2, y - 4, 4, 1, '#3e4152'); P.px(x - 1, y - 4, '#ffffff'); P.px(x + 1, y - 4, '#ffffff');
      P.rect(x - 2, y - 7, 1, 2, '#3e4152'); P.rect(x + 2, y - 7, 1, 2, '#3e4152');
      return;
    }
    const sit = ['idle', 'eat', 'sleep', 'fishing', 'waitRoad'].includes(this.state);
    const sp = getSprite(sit ? 'baerti_sit' : 'baerti');
    const f = sit ? (this.state !== 'sleep' && Math.sin(this.t * 1.7) > 0.96 ? 1 : 0) : Math.floor(this.walk * 8) % sp.frames.length;
    const w = sp.w * K, h = sp.h * K;
    if (!this.lift) shadow(P, x, this.pos.y + 1, 9);
    P.image(sp.frames[this.state === 'sleep' ? 1 : f], x - w / 2, y - h + 1, w, h, this.flip);
    const hx = x + (this.flip ? -1 : 1) * w * 0.3;
    if (this.state === 'eat') { // Keks oder Fisch
      if (this.fish) { P.rect(hx - 3, y - 4, 6, 2, '#94b0c2'); P.px(hx + (this.flip ? -4 : 3), y - 4, '#566c86'); }
      else { P.blob(hx + (this.flip ? -2 : 2), y - 3, 1.5, '#c58b5e'); }
      if (Math.sin(this.t * 9) > 0.7) P.px(hx, this.pos.y, '#e7b98a');
    }
    if (this.state === 'fishing') { P.rect(hx, y - 9, 1, 8, '#73441d'); P.rect(hx + 1, y - 9, 6, 1, '#73441d'); P.rect(hx + 7, y - 9, 1, 6 + Math.round(Math.sin(this.t * 3)), '#f4f4f4'); }
    if (this.state === 'sleep') P.text('z', x + 5, y - h - 2 - ((this.t * 4) % 4), 3.6, { color: '#ffffff', minPx: 8, dpr });
    if (this.state === 'waitRoad' && Math.sin(this.t * 6) > 0) P.text('!', x, y - h - 3, 3.6, { color: '#ffcd75', minPx: 8, dpr });
  }
}
