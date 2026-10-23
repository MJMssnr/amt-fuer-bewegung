// Stadtkarte in Pixelart: Orte (Knoten), Straßen, Florian läuft per Tippen von Ort zu Ort.
// Daten: data/map.json. Gebäude werden prozedural gezeichnet (später durch PNGs ersetzbar).

import { drawSprite } from '../render/pixel.js';

const SPEED = 110; // Pixel pro Sekunde

export class Overworld {
  constructor(canvas, map, { onArrive, markers }) {
    this.c = canvas;
    this.map = map;
    [this.W, this.H] = map.size;
    canvas.width = this.W; canvas.height = this.H;
    this.ctx = canvas.getContext('2d');
    this.onArrive = onArrive;
    this.markers = markers; // () => { nodeId: 'open' | 'done' }
    this.node = map.start;
    const n = map.nodes[this.node];
    this.pos = { x: n.x, y: n.y };
    this.path = [];
    this.flip = false;
    this.time = 0;
    this.adj = {};
    for (const [a, b] of map.roads) {
      (this.adj[a] ??= []).push(b);
      (this.adj[b] ??= []).push(a);
    }
    canvas.addEventListener('pointerup', (e) => this.#tap(e));
    this.running = false;
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

  // L-förmige Straße: erst waagerecht, dann senkrecht
  #corner(a, b) { return { x: b.x, y: a.y }; }

  #route(from, to) {
    const prev = { [from]: null };
    const q = [from];
    while (q.length) {
      const cur = q.shift();
      if (cur === to) break;
      for (const nb of this.adj[cur] || []) if (!(nb in prev)) { prev[nb] = cur; q.push(nb); }
    }
    if (!(to in prev)) return [];
    const ids = [];
    for (let c = to; c; c = prev[c]) ids.unshift(c);
    const pts = [];
    for (let i = 1; i < ids.length; i++) {
      const A = this.map.nodes[ids[i - 1]], B = this.map.nodes[ids[i]];
      // Straße ist immer von roads[k][0] nach roads[k][1] als L gezeichnet
      const forward = this.map.roads.some(([a, b]) => a === ids[i - 1] && b === ids[i]);
      const c = forward ? this.#corner(A, B) : { x: A.x, y: B.y };
      pts.push(c, { x: B.x, y: B.y, id: ids[i] });
    }
    return pts;
  }

  #tap(e) {
    if (this.path.length || this.locked?.()) return;
    const r = this.c.getBoundingClientRect();
    // canvas ist per CSS "contain" skaliert
    const scale = Math.min(r.width / this.W, r.height / this.H);
    const ox = r.left + (r.width - this.W * scale) / 2;
    const oy = r.top + (r.height - this.H * scale) / 2;
    const x = (e.clientX - ox) / scale, y = (e.clientY - oy) / scale;
    let best = null, bd = 40;
    for (const [id, n] of Object.entries(this.map.nodes)) {
      const bx = n.x + (n.side === 'right' ? 40 : n.side === 'left' ? -40 : 0);
      const by = n.y - (n.side ? 12 : 22);
      const d = Math.min(Math.hypot(n.x - x, n.y - y), Math.hypot(bx - x, by - y));
      if (d < bd) { bd = d; best = id; }
    }
    if (!best) return;
    if (best === this.node) { this.onArrive?.(best); return; }
    this.path = this.#route(this.node, best);
  }

  #walk(dt) {
    if (!this.path.length) return;
    let budget = SPEED * dt;
    while (budget > 0 && this.path.length) {
      const tgt = this.path[0];
      const dx = tgt.x - this.pos.x, dy = tgt.y - this.pos.y;
      const d = Math.hypot(dx, dy);
      if (Math.abs(dx) > 0.5) this.flip = dx < 0;
      if (d <= budget) {
        this.pos = { x: tgt.x, y: tgt.y };
        budget -= d;
        this.path.shift();
        if (tgt.id) this.node = tgt.id;
        if (!this.path.length) this.onArrive?.(this.node);
      } else {
        this.pos.x += (dx / d) * budget;
        this.pos.y += (dy / d) * budget;
        budget = 0;
      }
    }
  }

  // ---------- Zeichnen ----------

  draw() {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#38b764';
    ctx.fillRect(0, 0, this.W, this.H);
    // Grasbüschel (deterministisch)
    ctx.fillStyle = '#2a9d55';
    for (let i = 0; i < 260; i++) {
      const x = (i * 97) % this.W, y = (i * 53 + ((i * 7) % 13)) % this.H;
      ctx.fillRect(x, y, 2, 1);
      ctx.fillRect(x + 1, y - 1, 1, 1);
    }
    this.#roads(ctx);
    const items = [];
    for (const [id, n] of Object.entries(this.map.nodes)) items.push({ y: n.y - 1, draw: () => this.#building(ctx, n) });
    for (const [x, y] of this.map.trees || []) items.push({ y, draw: () => this.#tree(ctx, x, y) });
    items.push({ y: this.pos.y + 0.5, draw: () => drawSprite(ctx, 'florian', this.pos.x, this.pos.y + 4, 2, { flip: this.flip, moving: this.path.length > 0, time: this.time }) });
    items.sort((a, b) => a.y - b.y).forEach((it) => it.draw());
    this.#markers(ctx);
    this.#labels(ctx);
  }

  #roads(ctx) {
    const segs = [];
    for (const [a, b] of this.map.roads) {
      const A = this.map.nodes[a], B = this.map.nodes[b], C = this.#corner(A, B);
      segs.push([A, C], [C, B]);
    }
    const stroke = (w, col) => {
      ctx.fillStyle = col;
      for (const [p, q] of segs) {
        const x = Math.min(p.x, q.x) - w / 2, y = Math.min(p.y, q.y) - w / 2;
        ctx.fillRect(Math.round(x), Math.round(y), Math.round(Math.abs(q.x - p.x) + w), Math.round(Math.abs(q.y - p.y) + w));
      }
    };
    stroke(18, '#94b0c2'); // Gehweg
    stroke(14, '#566c86'); // Fahrbahn
    ctx.fillStyle = '#c2d3df';
    for (const [p, q] of segs) {
      const len = Math.hypot(q.x - p.x, q.y - p.y);
      for (let s = 4; s < len - 4; s += 12) {
        const x = p.x + ((q.x - p.x) * s) / len, y = p.y + ((q.y - p.y) * s) / len;
        if (p.y === q.y) ctx.fillRect(Math.round(x), Math.round(y), 6, 1);
        else ctx.fillRect(Math.round(x), Math.round(y), 1, 6);
      }
    }
  }

  #tree(ctx, x, y) {
    ctx.fillStyle = '#5d3a1a'; ctx.fillRect(x - 1, y - 6, 3, 6);
    ctx.fillStyle = '#257179'; ctx.fillRect(x - 7, y - 18, 15, 12); ctx.fillRect(x - 5, y - 21, 11, 3);
    ctx.fillStyle = '#38b764'; ctx.fillRect(x - 5, y - 17, 6, 4);
  }

  #building(ctx, n) {
    // Gebäude steht über dem Knoten bzw. seitlich (side: left/right)
    const bx = n.x + (n.side === 'right' ? 44 : n.side === 'left' ? -44 : 0);
    const bottom = n.side ? n.y + 10 : n.y - 11;
    const rect = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
    const windows = (x, y, cols, rows) => {
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        rect(x + c * 10, y + r * 10, 6, 6, '#1a1c2c');
        rect(x + c * 10 + 1, y + r * 10 + 1, 4, 4, '#73eff7');
      }
    };
    switch (n.building) {
      case 'rathaus': {
        const w = 76, h = 46, x = bx - w / 2, y = bottom - h;
        rect(x - 1, y - 1, w + 2, h + 2, '#1a1c2c');
        rect(x, y, w, h, '#c2d3df');
        rect(x - 4, y - 8, w + 8, 8, '#b13e53');
        rect(x + w / 2 - 12, y - 22, 24, 14, '#c2d3df');
        rect(x + w / 2 - 14, y - 26, 28, 5, '#b13e53');
        rect(x + w / 2 - 5, y - 19, 10, 10, '#f4f4f4');
        rect(x + w / 2, y - 17, 1, 4, '#1a1c2c'); rect(x + w / 2, y - 14, 3, 1, '#1a1c2c');
        rect(x + w / 2 + 10, y - 40, 1, 14, '#1a1c2c'); rect(x + w / 2 + 11, y - 40, 8, 5, '#41a6f6'); rect(x + w / 2 + 11, y - 37, 8, 2, '#f4f4f4');
        windows(x + 6, y + 6, 3, 3); windows(x + w - 32, y + 6, 3, 3);
        rect(x + w / 2 - 7, y + h - 18, 14, 18, '#5d3a1a');
        rect(x + w / 2 - 12, y + h - 26, 24, 6, '#ffcd75');
        ctx.fillStyle = '#1a1c2c'; ctx.font = '7px "Pixelify Sans", monospace'; ctx.textAlign = 'center';
        ctx.fillText('AMT', x + w / 2, y + h - 21);
        break;
      }
      case 'house': {
        const w = 44, h = 30, x = bx - w / 2, y = bottom - h;
        rect(x - 1, y - 1, w + 2, h + 2, '#1a1c2c');
        rect(x, y, w, h, n.color || '#e4c9b6');
        for (let i = 0; i < 6; i++) rect(x - 3 + i * 2, y - 4 - i * 3, w + 6 - i * 4, 3, i % 2 ? '#b13e53' : '#9a3346');
        windows(x + 5, y + 6, 2, 2); rect(x + w - 15, y + h - 16, 10, 16, '#5d3a1a');
        break;
      }
      case 'shop': {
        const w = 52, h = 30, x = bx - w / 2, y = bottom - h;
        rect(x - 1, y - 1, w + 2, h + 2, '#1a1c2c');
        rect(x, y, w, h, '#f4f4f4');
        rect(x - 2, y - 6, w + 4, 6, '#333c57');
        for (let i = 0; i < w; i += 8) rect(x + i, y, 4, 6, n.color || '#b13e53');
        rect(x + 4, y + 10, 22, 14, '#1a1c2c'); rect(x + 5, y + 11, 20, 12, '#73eff7');
        rect(x + w - 16, y + h - 18, 11, 18, '#5d3a1a');
        break;
      }
      case 'busstop': {
        const w = 40, h = 24, x = bx - w / 2, y = bottom - h;
        rect(x, y, w, 3, '#1a1c2c'); rect(x + 2, y + 3, 2, h - 3, '#1a1c2c'); rect(x + w - 4, y + 3, 2, h - 3, '#1a1c2c');
        rect(x + 4, y + 4, w - 8, h - 10, 'rgba(115,239,247,0.5)');
        rect(x + 6, y + h - 6, w - 12, 3, '#5d3a1a');
        rect(x + w + 4, y - 10, 2, h + 10, '#566c86');
        rect(x + w, y - 18, 10, 10, '#38b764'); rect(x + w + 1, y - 17, 8, 8, '#ffcd75');
        ctx.fillStyle = '#257179'; ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center';
        ctx.fillText('H', x + w + 5, y - 10);
        break;
      }
    }
  }

  #markers(ctx) {
    const m = this.markers?.() || {};
    for (const [id, state] of Object.entries(m)) {
      const n = this.map.nodes[id];
      const bx = n.x + (n.side === 'right' ? 44 : n.side === 'left' ? -44 : 0);
      const topY = n.side ? n.y - 26 : n.building === 'rathaus' ? n.y - 96 : n.y - 50;
      const bob = state === 'open' ? Math.round(Math.sin(this.time * 5) * 2) : 0;
      const x = Math.round(bx), y = topY + bob;
      if (state === 'open') {
        ctx.fillStyle = '#1a1c2c'; ctx.fillRect(x - 6, y - 16, 12, 16);
        ctx.fillStyle = '#ffcd75'; ctx.fillRect(x - 5, y - 15, 10, 14);
        ctx.fillStyle = '#1a1c2c'; ctx.fillRect(x - 1, y - 13, 2, 7); ctx.fillRect(x - 1, y - 4, 2, 2);
        ctx.fillStyle = '#1a1c2c'; ctx.fillRect(x - 1, y, 2, 3);
      } else if (state === 'done') {
        ctx.fillStyle = '#1a1c2c'; ctx.fillRect(x - 6, y - 12, 12, 12);
        ctx.fillStyle = '#38b764'; ctx.fillRect(x - 5, y - 11, 10, 10);
        ctx.fillStyle = '#f4f4f4'; ctx.fillRect(x - 3, y - 6, 2, 2); ctx.fillRect(x - 1, y - 4, 2, 2); ctx.fillRect(x + 1, y - 8, 2, 4);
      }
    }
  }

  #labels(ctx) {
    ctx.font = '8px "Pixelify Sans", monospace';
    ctx.textAlign = 'center';
    for (const n of Object.values(this.map.nodes)) {
      const bx = n.x + (n.side === 'right' ? 44 : n.side === 'left' ? -44 : 0);
      const y = n.side ? n.y + 22 : n.y + 20;
      const w = Math.ceil(ctx.measureText(n.name).width) + 6;
      ctx.fillStyle = 'rgba(26,28,44,0.7)';
      ctx.fillRect(Math.round(bx - w / 2), y - 8, w, 10);
      ctx.fillStyle = '#f4f4f4';
      ctx.fillText(n.name, bx, y);
    }
  }
}
