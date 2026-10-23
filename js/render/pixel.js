// Sprite-Verwaltung: Pixel-Sprites aus assets/sprites.json ODER eigene PNGs.
//
// Pixel-Sprite:  { "w":10, "h":16, "turns":true, "fps":6, "frames":[[ "..kk..", ... ]] }
// PNG-Sprite:    { "png":"assets/img/wappen.png", "w":32, "h":32, "frames":1, "turns":false }
//                (bei mehreren Frames: nebeneinander in einem Bildstreifen)

const SPRITES = new Map();

function frameFromRows(rows, palette, w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const col = palette[ch];
      if (!col) return;
      ctx.fillStyle = col;
      ctx.fillRect(x, y, 1, 1);
    });
  });
  return c;
}

function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error(`Bild fehlt: ${src}`));
    img.src = src;
  });
}

export async function loadSprites(url = 'assets/sprites.json') {
  const data = await (await fetch(url, { cache: 'no-cache' })).json();
  const palette = data.palette;
  for (const [name, sp] of Object.entries(data.sprites)) {
    try {
      let frames;
      if (sp.png) {
        const img = await loadImage(sp.png);
        const n = sp.frames ?? 1;
        frames = Array.from({ length: n }, (_, i) => {
          const c = document.createElement('canvas');
          c.width = sp.w; c.height = sp.h;
          c.getContext('2d').drawImage(img, i * sp.w, 0, sp.w, sp.h, 0, 0, sp.w, sp.h);
          return c;
        });
      } else {
        frames = sp.frames.map((rows) => frameFromRows(rows, { ...palette, ...(sp.palette || {}) }, sp.w, sp.h));
      }
      SPRITES.set(name, { w: sp.w, h: sp.h, turns: sp.turns ?? true, fps: sp.fps ?? 6, frames });
    } catch (e) {
      console.warn(e.message);
    }
  }
}

export function getSprite(name) {
  if (SPRITES.has(name)) return SPRITES.get(name);
  // Platzhalter, damit fehlende Sprites nicht alles lahmlegen
  const c = document.createElement('canvas');
  c.width = 8; c.height = 8;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ff00aa';
  ctx.fillRect(0, 0, 8, 8);
  return { w: 8, h: 8, turns: false, fps: 1, frames: [c] };
}

/**
 * Zeichnet ein Sprite mit Fußpunkt (cx, bottom) in ganzzahliger Vergrößerung.
 * flip: horizontal gespiegelt, moving: Laufanimation aktiv, time: Sekunden (für Frames)
 */
export function drawSprite(ctx, name, cx, bottom, scale = 2, { flip = false, moving = false, time = 0 } = {}) {
  const sp = getSprite(name);
  const n = sp.frames.length;
  const idx = moving && n > 1 ? ((Math.floor(time * sp.fps) % n) + n) % n : 0;
  const w = sp.w * scale, h = sp.h * scale;
  const x = Math.round(cx - w / 2), y = Math.round(bottom - h);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (flip) {
    ctx.translate(x + w, y);
    ctx.scale(-1, 1);
    ctx.drawImage(sp.frames[idx], 0, 0, w, h);
  } else {
    ctx.drawImage(sp.frames[idx], x, y, w, h);
  }
  ctx.restore();
}
