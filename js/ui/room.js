// Florians Baumhaus-Zimmer: Gegenstände ansehen, im Shop bestellen, Raketenteile in die Kiste.
// Daten: data/shop.json. Zustand: state.items[id] = true, state.money.

import { Painter } from '../render/painter.js';
import { getSprite } from '../render/pixel.js';
import { ROOM, SLOTS, DRAW, drawRoomBase, emptySlot } from '../render/room-art.js';
import { showDialog, toast } from './dialog.js';

const FLOOR_Y = 186; // Fußlinie, auf der Florian im Zimmer läuft

export class Room {
  constructor(el, { shop, state, save, onChange, onCrateFull }) {
    this.el = el;
    this.shop = shop;
    this.state = state;
    this.save = save;
    this.onChange = onChange;
    this.onCrateFull = onCrateFull;
    this.c = el.querySelector('canvas');
    this.ctx = this.c.getContext('2d');
    this.flo = { x: 180, target: 180, flip: false };
    this.t = 0;
    this.busy = false;
    this.c.addEventListener('pointerup', (e) => this.#click(e));
    el.querySelector('.r-shop-btn').addEventListener('click', () => this.#toggleShop());
    new ResizeObserver(() => this.#resize()).observe(this.c);
  }

  get partsOwned() { return this.shop.rocketParts.filter((p) => this.state.items[p.id]).length; }
  get partsTotal() { return this.shop.rocketParts.length; }

  open() {
    this.el.classList.remove('hidden');
    this.#resize();
    this.#renderShop();
    this.#header();
    this.running = true;
    let last = performance.now();
    const loop = (now) => {
      if (!this.running) return;
      const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
      last = now;
      this.t += dt;
      const d = this.flo.target - this.flo.x;
      if (Math.abs(d) > 0.5) { this.flo.x += Math.sign(d) * Math.min(Math.abs(d), 70 * dt); this.flo.flip = d < 0; this.flo.walking = true; }
      else this.flo.walking = false;
      this.draw();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return new Promise((resolve) => {
      this.close = () => { this.running = false; this.el.classList.add('hidden'); resolve(); };
      this.el.querySelector('.r-back').onclick = () => this.close();
    });
  }

  #resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const r = this.c.getBoundingClientRect();
    if (!r.width) return;
    this.c.width = Math.round(r.width * dpr);
    this.c.height = Math.round(r.height * dpr);
    this.dpr = dpr;
    this.s = Math.min(this.c.width / ROOM.W, this.c.height / ROOM.H);
    this.ox = (this.c.width - ROOM.W * this.s) / 2;
    this.oy = (this.c.height - ROOM.H * this.s) / 2;
  }

  draw() {
    if (!this.s) return;
    const ctx = this.ctx;
    ctx.fillStyle = '#2b1a10';
    ctx.fillRect(0, 0, this.c.width, this.c.height);
    const P = new Painter(ctx, this.s, this.ox, this.oy);
    P.dpr = this.dpr;
    drawRoomBase(P, this.t);
    const items = [];
    for (const it of this.shop.items) {
      const s = SLOTS[it.id];
      if (!s) continue;
      const owned = this.state.items[it.id];
      // Wand-Gegenstände und Teppich zuerst, sonst nach Unterkante sortiert
      const z = it.id === 'teppich' ? -1 : ['neon', 'rennrad'].includes(it.id) ? -2 : s.y + s.h;
      items.push({ z, draw: () => (owned ? DRAW[it.id](P, this.t) : emptySlot(P, s)) });
    }
    items.push({ z: 198, draw: () => DRAW.kiste(P, this.t, this.partsOwned, this.partsTotal) });
    items.push({ z: 197, draw: () => DRAW.luke(P, this.t) });
    items.push({ z: FLOOR_Y, draw: () => this.#florian(P) });
    items.sort((a, b) => a.z - b.z).forEach((i) => i.draw());
  }

  #florian(P) {
    const sp = getSprite('florian');
    const f = this.flo.walking ? Math.floor(this.t * sp.fps) % sp.frames.length : 0;
    P.blob(this.flo.x, FLOOR_Y, 10, 'rgba(20,24,40,0.25)', 2);
    P.image(sp.frames[f], this.flo.x - sp.w, FLOOR_Y - sp.h * 2, sp.w * 2, sp.h * 2, this.flo.flip);
  }

  async #walkTo(x) {
    this.flo.target = Math.max(20, Math.min(340, x));
    await new Promise((r) => {
      const check = () => (Math.abs(this.flo.target - this.flo.x) < 1 || !this.running ? r() : setTimeout(check, 50));
      check();
    });
  }

  async #click(e) {
    if (this.busy) return;
    const r = this.c.getBoundingClientRect();
    const x = ((e.clientX - r.left) * this.dpr - this.ox) / this.s;
    const y = ((e.clientY - r.top) * this.dpr - this.oy) / this.s;
    const hit = Object.entries(SLOTS)
      .filter(([, s]) => x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h)
      .sort((a, b) => a[1].w * a[1].h - b[1].w * b[1].h)[0];
    this.busy = true;
    try {
      if (!hit) {
        await this.#walkTo(x);
        const lines = this.shop.florianTalk;
        await showDialog([['florian', lines[Math.floor(this.t) % lines.length]]]);
        return;
      }
      const [id, s] = hit;
      if (id === 'luke') { this.close(); return; }
      await this.#walkTo(id === 'kiste' ? s.x + 48 : s.x + s.w / 2);
      if (id === 'kiste') {
        const n = this.partsOwned, c = this.shop.crate;
        if (n >= this.partsTotal) { await showDialog([['florian', c.full]]); await this.onCrateFull?.(); }
        else await showDialog([['florian', n ? c.some : c.empty]]);
        return;
      }
      const item = this.shop.items.find((i) => i.id === id);
      await showDialog([['florian', this.state.items[id] ? item.text : this.shop.emptySlot]]);
    } finally {
      this.busy = false;
    }
  }

  #header() {
    const owned = this.shop.items.filter((i) => this.state.items[i.id]).length;
    this.el.querySelector('.r-progress').textContent = `Einrichtung ${owned}/${this.shop.items.length} · Kiste ${this.partsOwned}/${this.partsTotal}`;
    this.el.querySelector('.r-money').textContent = `${this.state.money} €`;
  }

  #toggleShop(force) {
    const aside = this.el.querySelector('.shop');
    const open = force ?? aside.classList.contains('hidden');
    aside.classList.toggle('hidden', !open);
    this.el.querySelector('.r-shop-btn').textContent = open ? 'Katalog zu ▴' : 'Bestellen ▾';
  }

  #renderShop() {
    const list = this.el.querySelector('.shop-list');
    const row = (it, part) => {
      const owned = this.state.items[it.id];
      const needs = it.requires && !this.state.items[it.requires];
      const poor = this.state.money < it.price;
      const label = owned ? (part ? 'in der Kiste' : 'im Baumhaus ✓') : needs ? `braucht ${this.shop.items.find((i) => i.id === it.requires).name}` : `${it.price} €`;
      return `<div class="shop-row ${owned ? 'owned' : ''}">
        <span class="shop-name">${it.name}</span>
        <button class="btn shop-buy" data-id="${it.id}" ${owned || needs || poor ? 'disabled' : ''}>${label}</button>
      </div>`;
    };
    list.innerHTML = `<h4>Einrichtung</h4>${this.shop.items.map((i) => row(i, false)).join('')}
      <h4>Sonstiges</h4>${this.shop.rocketParts.map((p) => row(p, true)).join('')}`;
    list.querySelectorAll('.shop-buy').forEach((b) => b.addEventListener('click', () => this.#buy(b.dataset.id)));
  }

  async #buy(id) {
    if (this.busy) return;
    const item = this.shop.items.find((i) => i.id === id);
    const part = this.shop.rocketParts.find((p) => p.id === id);
    const it = item ?? part;
    if (!it || this.state.items[id] || this.state.money < it.price) return;
    this.busy = true;
    this.state.money -= it.price;
    this.state.items[id] = true;
    this.save();
    this.onChange?.();
    this.#renderShop();
    this.#header();
    toast(`−${it.price} €  ${it.name}`, 'money');
    if (window.matchMedia('(max-width: 900px)').matches) this.#toggleShop(false);
    if (item) {
      await this.#walkTo(SLOTS[id].x + SLOTS[id].w / 2);
      await showDialog([['florian', `Geliefert: ${item.name}!`]]);
    } else {
      await this.#walkTo(SLOTS.kiste.x + 48);
      const lines = this.shop.partBought;
      await showDialog([lines[Math.min(this.partsOwned - 1, lines.length - 1)]]);
      if (this.partsOwned >= this.partsTotal) await showDialog([['florian', 'Ich sollte mir die Kiste mal genauer ansehen.']]);
    }
    this.busy = false;
  }
}
