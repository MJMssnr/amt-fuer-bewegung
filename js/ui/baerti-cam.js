// Bärti-Cam [W43]: Die Karte zoomt stark auf Bärti und folgt ihm weich. Boden wird für den Ausschnitt
// neu gerendert (scharfe Pixel statt hochskaliertem Bild), aber nur, wenn sich die Kamera merklich bewegt hat.

import { Painter } from '../render/painter.js';
import { drawGround } from '../render/town.js';

const ZOOM = 4.2; // Ausschnitt ≈ ein Viertel der Kartenbreite

export class BaertiCam {
  constructor() { this.on = false; this.z = 1; this.c = null; }

  toggle(v = !this.on) { this.on = v; if (v) this.c = null; }

  /** Neue Ansicht (Skalierung, Versatz) für dieses Bild; ow = Overworld, f = Bärtis Mittelpunkt */
  view(ow, f, dt) {
    const targetZ = this.on ? ZOOM : 1;
    this.z += (targetZ - this.z) * Math.min(1, dt * 3.5);
    if (Math.abs(this.z - targetZ) < 0.01) this.z = targetZ;
    if (this.z === 1) { this.c = null; return null; }
    const k = Math.min(1, dt * 4);
    this.c = this.c ? { x: this.c.x + (f.x - this.c.x) * k, y: this.c.y + (f.y - this.c.y) * k } : { ...f };
    // beim Ein-/Auszoomen vom Kartenmittelpunkt zu Bärti gleiten
    const u = (this.z - 1) / (ZOOM - 1), cx = ow.W / 2 + (this.c.x - ow.W / 2) * u, cy = ow.H / 2 + (this.c.y - ow.H / 2) * u;
    const s = ow.s * this.z, cw = ow.c.width, ch = ow.c.height;
    let ox = cw / 2 - cx * s, oy = ch / 2 - cy * s;
    if (ow.W * s > cw) ox = Math.min(0, Math.max(cw - ow.W * s, ox)); else ox = (cw - ow.W * s) / 2;
    if (ow.H * s > ch) oy = Math.min(0, Math.max(ch - ow.H * s, oy)); else oy = (ch - ow.H * s) / 2;
    return { s, ox: Math.round(ox), oy: Math.round(oy) };
  }

  /** Boden für den Ausschnitt (zwischengespeichert, solange sich die Ansicht kaum ändert) */
  ground(ow, v) {
    const key = `${v.s.toFixed(3)}|${v.ox}|${v.oy}|${ow.c.width}x${ow.c.height}`;
    if (this.key === key && this.g) return this.g;
    this.g ??= document.createElement('canvas');
    if (this.g.width !== ow.c.width || this.g.height !== ow.c.height) { this.g.width = ow.c.width; this.g.height = ow.c.height; }
    const g = this.g.getContext('2d');
    g.imageSmoothingEnabled = false;
    g.fillStyle = '#3f8f2a'; g.fillRect(0, 0, this.g.width, this.g.height);
    drawGround(new Painter(g, v.s, v.ox, v.oy), ow.map);
    this.key = key;
    return this.g;
  }
}
