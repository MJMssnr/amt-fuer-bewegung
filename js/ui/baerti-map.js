// Bärti auf der Stadtkarte [W42, W43]: läuft auf Gehwegen (Straßennetz, leicht versetzt) und über Wiesen,
// wartet vor dem Überqueren einer Straße, bis kein Radler in der Nähe ist. Was er dort tut, steht als
// Phasenfolge in js/ui/baerti-acts.js; hier: Wegsuche, Abspielen der Phasen, Zeichnen.
// Ressourcensparend: Wegsuche nur beim Start einer Aktivität (Karte ist klein).

import { getSprite } from '../render/pixel.js';
import { shadow } from '../render/town.js';
import { chooseActivity, RIVER } from './baerti-acts.js';
import { drawFx, drawPuddles } from './baerti-fx.js';

const OFF = 11, SPEED = 24, ROAD = 8.5, K = 0.55; // Gehweg-Versatz, Tempo (Welt-px/s), halbe Fahrbahn, Größe
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
    this.pos = { x: start.x, y: start.y }; this.path = []; this.seq = []; this.t = 0; this.flip = false;
    this.state = 'phase'; this.lift = 0; this.walk = 0; this.rot = 0; this.puddles = []; this.doing = 'schaut sich um';
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
  /** Weg planen: kurze Wege ohne Straße direkt, sonst über die Gehwege; via = Wegpunkte vor dem Ziel (z. B. Parkeingang) */
  goTo(target, then, via = []) {
    const first = via[0] ?? target;
    const near = Math.hypot(first.x - this.pos.x, first.y - this.pos.y) < 90 && !this.crosses(this.pos, first);
    const a = this.nearest(this.pos), b = this.nearest(first);
    const pts = near ? [] : [this.nodes[a], ...this.route(a, b).slice(1)];
    this.path = [...pts, ...via, target].map((p) => ({ x: p.x, y: p.y }));
    this.state = 'walk'; this.then = then;
  }
  walkerPos(w) { const L = w.lane, p = L.a + w.u * (L.b - L.a); return L.y !== undefined ? { x: p, y: L.y + 3 } : { x: L.x + 3, y: p }; }
  riderNear(p, r = 46) { return (this.life?.riderPositions?.() ?? []).some((q) => Math.hypot(q.x - p.x, q.y - p.y) < r); }

  #next() {
    this.rot = 0; this.lift = 0; this.pose = 'sit'; this.fx = null;
    const a = chooseActivity(this);
    if (!a) { this.seq = [{ s: 'wait', d: 1, pose: 'sit' }]; this.state = 'phase'; return; }
    this.doing = a.text;
    if (a.visit) { this.chase = 3; this.goTo(a.target, () => this.#visit(a.visit)); return; }
    this.goTo(a.target, () => { this.seq = a.seq.map((p) => ({ ...p })); this.state = 'phase'; }, a.via);
  }
  #visit(w) {
    const p = this.walkerPos(w);
    if (Math.hypot(p.x - this.pos.x, p.y - this.pos.y) > 22) { // weitergelaufen: hinterher (höchstens dreimal)
      if (this.chase-- > 0) this.goTo(p, () => this.#visit(w)); else { this.seq = []; this.state = 'phase'; }
      return;
    }
    w.chat = 4.5; w.cool = 10; w.bubble = '♥'; this.flip = p.x < this.pos.x;
    this.doing = 'bekommt einen Keks';
    this.seq = [{ s: 'wait', d: 3.5, pose: 'sit', fx: 'cookie' }]; this.state = 'phase';
  }

  step(dt) {
    this.t += dt;
    if (this.state === 'walk') return this.#walk(dt);
    if (this.state === 'waitRoad') {
      const tgt = this.path[0];
      if (!tgt || !this.riderNear({ x: (this.pos.x + tgt.x) / 2, y: (this.pos.y + tgt.y) / 2 })) { this.state = 'walk'; this.legChecked = true; }
      return;
    }
    const ph = this.seq[0];
    if (!ph) return this.#next();
    ph.t0 ??= this.t;
    const el = this.t - ph.t0, done = () => { this.seq.shift(); };
    this.pose = ph.pose ?? 'stand'; this.fx = ph.fx ?? null;
    switch (ph.s) {
      case 'up': this.pose = 'climb'; this.lift = Math.min(ph.to, this.lift + dt * ph.rate); this.walk += dt; if (this.lift >= ph.to) done(); break;
      case 'down': this.pose = 'climbDown'; this.lift = Math.max(0, this.lift - dt * ph.rate); this.walk += dt; if (!this.lift) done(); break;
      case 'wait': if (ph.fx === 'look') this.flip = Math.sin(el * 2.2) > 0; if (el > ph.d) done(); break;
      case 'call': ph.fn(); done(); break;
      case 'move': {
        const ty = ph.y ?? this.pos.y, dx = ph.x - this.pos.x, dy = ty - this.pos.y, d = Math.hypot(dx, dy), v = ph.rate * dt;
        if (Math.abs(dx) > 0.3) this.flip = dx < 0;
        if (d <= v) { this.pos = { x: ph.x, y: ty }; done(); } else { this.pos.x += (dx / d) * v; this.pos.y += (dy / d) * v; }
        this.pose = ph.swim && this.#inWater() ? 'swim' : 'walk'; this.walk += dt;
        break;
      }
      case 'circle': {
        this.pose = 'swim';
        const a = Math.PI / 2 + el * 1.1, nx = ph.cx + Math.cos(a) * ph.rx, ny = ph.cy + Math.sin(a) * ph.ry;
        this.flip = nx < this.pos.x; this.pos = { x: nx, y: ny };
        if (el > ph.d && Math.sin(a) > 0.9) done();
        break;
      }
      case 'fall': { // Sprung vom Windrad: Schwerkraft, Purzeln, landet liegend
        ph.v = (ph.v ?? -20) + 160 * dt; this.lift = Math.max(0, this.lift - ph.v * dt); this.pos.x += (ph.dx / 0.8) * dt;
        this.pose = 'tumble'; this.rot += dt * 9;
        if (!this.lift) { this.rot = 0; done(); }
        break;
      }
      default: done();
    }
  }

  #walk(dt) {
    const tgt = this.path[0];
    if (!tgt) { const f = this.then; this.then = null; this.state = 'phase'; this.seq = []; f?.(); return; }
    if (!this.legChecked) { // vor einer Straße: warten, bis kein Radler kommt
      this.legChecked = true;
      if (this.crosses(this.pos, tgt) && this.riderNear({ x: (this.pos.x + tgt.x) / 2, y: (this.pos.y + tgt.y) / 2 })) { this.state = 'waitRoad'; this.legChecked = false; return; }
    }
    const dx = tgt.x - this.pos.x, dy = tgt.y - this.pos.y, d = Math.hypot(dx, dy), v = SPEED * (this.onRoad(this.pos.x, this.pos.y) ? 1.7 : 1) * dt;
    if (Math.abs(dx) > 0.3) this.flip = dx < 0;
    this.walk += dt;
    if (d <= v) { this.pos = { ...tgt }; this.path.shift(); this.legChecked = false; } else { this.pos.x += (dx / d) * v; this.pos.y += (dy / d) * v; }
  }

  /** Mittelpunkt für die Bärti-Cam (Welt-Koordinaten) */
  focus() { return { x: this.pos.x, y: this.pos.y - this.lift - 5 }; }

  items(P, dpr) {
    this.puddles = this.puddles.filter((p) => this.t - p.t0 < 25);
    const out = [{ y: this.pos.y + (this.lift ? 40 : 0), draw: () => this.#draw(P, dpr) }];
    if (this.puddles.length) out.push({ y: -999, draw: () => drawPuddles(P, this.puddles, this.t) });
    return out;
  }

  #draw(P, dpr) {
    const { x } = this.pos, st = this.state, pose = st === 'phase' ? this.pose : st === 'waitRoad' ? 'sit' : 'walk';
    const hop = pose === 'hop' ? Math.abs(Math.sin(this.t * 9)) * 3 : 0;
    const y = this.pos.y - this.lift - hop;
    if (pose === 'swim') { // nur Kopf und Wellenring
      P.blob(x, y - 2, 4, 'rgba(255,255,255,0.45)', 2);
      P.blob(x, y - 3, 3, '#8f93a3'); P.rect(x - 2, y - 4, 4, 1, '#3e4152'); P.px(x - 1, y - 4, '#ffffff'); P.px(x + 1, y - 4, '#ffffff');
      P.rect(x - 2, y - 7, 1, 2, '#3e4152'); P.rect(x + 2, y - 7, 1, 2, '#3e4152');
      return;
    }
    const sit = ['sit', 'lie'].includes(pose);
    const sp = getSprite(sit ? 'baerti_sit' : 'baerti');
    const anim = ['walk', 'climb', 'climbDown'].includes(pose) || (pose === 'stand' && this.fx === 'dig');
    const f = sit ? (this.fx !== 'z' && Math.sin(this.t * 1.7) > 0.96 ? 1 : 0) : anim ? Math.floor(this.walk * 8 + (this.fx === 'dig' ? this.t * 6 : 0)) % sp.frames.length : 0;
    const w = sp.w * K, h = sp.h * K;
    if (!this.lift) shadow(P, x, this.pos.y + 1, 9);
    const rot = pose === 'climb' || pose === 'cling' ? -Math.PI / 2 : pose === 'climbDown' ? Math.PI / 2 : pose === 'lie' ? Math.PI / 2 : pose === 'tumble' ? this.rot : 0;
    if (rot) { // an der Wand / im Fall / liegend: um die Bildmitte drehen
      const cx = P.X(x), cy = P.Y(y - h / 2), ctx = P.ctx;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.translate(-cx, -cy);
      P.image(sp.frames[f], x - w / 2, y - h, w, h, pose === 'climbDown');
      ctx.restore();
    } else P.image(sp.frames[this.fx === 'z' ? 1 : f], x - w / 2, y - h + 1, w, h, this.flip);
    drawFx(P, this, { x, y, w, h, dpr });
    if (st === 'waitRoad' && Math.sin(this.t * 6) > 0) P.text('!', x, y - h - 3, 3.6, { color: '#ffcd75', minPx: 8, dpr });
  }
  #inWater() { return this.pos.x > RIVER.bank + 6 || Math.hypot((this.pos.x - 178) / 18, (this.pos.y - 36) / 12) < 1; }
}
