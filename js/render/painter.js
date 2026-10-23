// Zeichenhilfe: Welt-Koordinaten (Pixelart-Einheiten) -> Bildschirmpixel, kantenscharf gerundet.
// Text wird in echter Bildschirmauflösung gezeichnet und ist dadurch gestochen scharf.

export class Painter {
  constructor(ctx, s, ox = 0, oy = 0) {
    this.ctx = ctx;
    this.s = s;
    this.ox = ox;
    this.oy = oy;
  }
  X(x) { return Math.round(this.ox + x * this.s); }
  Y(y) { return Math.round(this.oy + y * this.s); }

  rect(x, y, w, h, col) {
    const x0 = this.X(x), y0 = this.Y(y);
    this.ctx.fillStyle = col;
    this.ctx.fillRect(x0, y0, this.X(x + w) - x0, this.Y(y + h) - y0);
  }
  px(x, y, col) { this.rect(x, y, 1, 1, col); }

  /** Pixel-Kreis/Ellipse aus Zeilen (keine Kantenglättung). */
  blob(cx, cy, rx, col, ry = rx) {
    for (let dy = -ry; dy <= ry; dy++) {
      const hw = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry + 0.0001))));
      if (hw > 0) this.rect(cx - hw, cy + dy, 2 * hw, 1, col);
    }
  }

  /** Bild/Canvas (z. B. Sprite-Frame) in Welt-Koordinaten, optional gespiegelt. */
  image(img, x, y, w, h, flip = false) {
    const ctx = this.ctx;
    const x0 = this.X(x), y0 = this.Y(y), w0 = this.X(x + w) - x0, h0 = this.Y(y + h) - y0;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (flip) { ctx.translate(x0 + w0, y0); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, w0, h0); }
    else ctx.drawImage(img, x0, y0, w0, h0);
    ctx.restore();
  }

  /** Breite eines Textes in Welt-Einheiten (gleiche Parameter wie text()). */
  measure(str, size, { bold = false, minPx = 0, dpr = 1 } = {}) {
    const fs = Math.max(size * this.s, minPx * dpr);
    this.ctx.font = `${bold ? 600 : 400} ${fs}px "AmtPixel", ui-monospace, monospace`;
    return { w: this.ctx.measureText(str).width / this.s, h: fs / this.s };
  }

  /** Scharfer Text. size in Welt-Einheiten; minPx: Mindestgröße in CSS-Pixeln. */
  text(str, x, y, size, { color = '#1a1c2c', align = 'center', bold = false, bg = null, pad = 2, minPx = 0, dpr = 1 } = {}) {
    const ctx = this.ctx;
    const fs = Math.max(size * this.s, minPx * dpr);
    ctx.font = `${bold ? 600 : 400} ${fs}px "AmtPixel", ui-monospace, monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    const tx = this.ox + x * this.s, ty = this.oy + y * this.s;
    if (bg) {
      const w = ctx.measureText(str).width + 2 * pad * this.s;
      const h = fs + pad * this.s;
      const left = align === 'center' ? tx - w / 2 : align === 'right' ? tx - w : tx;
      ctx.fillStyle = bg;
      ctx.fillRect(Math.round(left), Math.round(ty - h / 2), Math.round(w), Math.round(h));
    }
    ctx.fillStyle = color;
    ctx.fillText(str, Math.round(tx), Math.round(ty + fs * 0.06));
  }
}

/** Deterministischer Zufall (für Gras, Blumen …), damit die Stadt immer gleich aussieht. */
export const hash = (x, y, seed = 1) => {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
