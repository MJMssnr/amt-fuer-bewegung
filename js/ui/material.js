// Material-Hinweis nach dem Demo-Hinweis [W52]: Große Schrift, dann fliegen Karopapier, Kugelschreiber,
// wissenschaftlicher Taschenrechner und Formelsammlung ins Bild. „Lege das Material bereit!“ – weiter per Tippen/Leertaste.

import { sfx } from '../audio/sound.js';

const W = 160, H = 90; // logische Pixel (Pixel-Art, scharf skaliert)
const INK = '#1a1c2c';

// Gegenstände: Zielposition, Drehung, Startrichtung, Verzögerung (s)
const ITEMS = [
  { draw: paper, x: 30, y: 52, rot: -0.12, from: [-60, 40], delay: 0.0 },
  { draw: pen, x: 64, y: 58, rot: 0.55, from: [80, -60], delay: 0.35 },
  { draw: calculator, x: 98, y: 54, rot: 0.08, from: [220, 40], delay: 0.7 },
  { draw: book, x: 132, y: 54, rot: -0.06, from: [200, 140], delay: 1.05 },
];

export function showMaterial() {
  const el = document.createElement('div');
  el.className = 'material';
  el.innerHTML = `<canvas></canvas>
    <p class="mat-text">Für dieses Spiel brauchst du <b>Papier</b>, einen <b>Stift</b> und einen <b>Taschenrechner</b> – vielleicht sogar deine <b>Formelsammlung</b>.</p>
    <p class="mat-call hidden">Lege das Material bereit!</p>
    <p class="mat-tap hidden">▶ tippen oder Leertaste</p>`;
  document.body.appendChild(el);
  const c = el.querySelector('canvas'), ctx = c.getContext('2d');
  let raf = 0, t0 = performance.now(), landed = 0, ready = false;
  const frame = (now) => {
    const t = (now - t0) / 1000;
    const r = c.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 3);
    if (r.width && c.width !== Math.round(r.width * d)) { c.width = Math.round(r.width * d); c.height = Math.round(r.height * d); }
    const s = Math.min(c.width / W, c.height / H);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height);
    ctx.imageSmoothingEnabled = false;
    let n = 0;
    for (const it of ITEMS) {
      const u = Math.min(1, Math.max(0, (t - 0.6 - it.delay) / 0.55));
      if (u <= 0) continue;
      const e = 1 - (1 - u) ** 3, wob = u >= 1 ? 0 : Math.sin(u * 9) * 0.25 * (1 - u);
      const x = it.from[0] + (it.x - it.from[0]) * e, y = it.from[1] + (it.y - it.from[1]) * e;
      ctx.setTransform(s, 0, 0, s, (c.width - W * s) / 2 + x * s, (c.height - H * s) / 2 + y * s);
      if (u >= 1) { n++; ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-13, 21, 28, 3); } // Schatten ungedreht
      ctx.rotate(it.rot + wob + (1 - e) * 2.5);
      it.draw(ctx);
    }
    if (n > landed) { landed = n; sfx('coin'); }
    if (landed === ITEMS.length && !ready) {
      ready = true;
      el.querySelector('.mat-call').classList.remove('hidden');
      setTimeout(() => el.querySelector('.mat-tap').classList.remove('hidden'), 500);
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return new Promise((resolve) => {
    const done = (e) => {
      if (e.type === 'keydown' && ![' ', 'Enter'].includes(e.key)) return;
      if (!ready) { t0 -= 5000; return; } // erster Tipp spult vor
      e.preventDefault?.();
      cancelAnimationFrame(raf); el.remove();
      document.removeEventListener('keydown', done); resolve();
    };
    el.addEventListener('pointerup', done);
    document.addEventListener('keydown', done);
  });
}

// ---------- Zeichnungen (Ursprung = Mitte, logische Pixel) ----------
function paper(ctx) {
  ctx.fillStyle = INK; ctx.fillRect(-15, -20, 30, 40);
  ctx.fillStyle = '#fbfbf6'; ctx.fillRect(-14, -19, 28, 38);
  ctx.fillStyle = '#b9cde3';
  for (let x = -13; x < 14; x += 3) ctx.fillRect(x, -19, 0.5, 38);
  for (let y = -18; y < 19; y += 3) ctx.fillRect(-14, y, 28, 0.5);
  ctx.fillStyle = '#e43b44'; ctx.fillRect(-10, -19, 0.6, 38); // Rand
  ctx.fillStyle = '#3b5dc9'; // eine kleine Parabel auf dem Papier
  for (let i = 0; i < 18; i++) { const px = -8 + i, py = 12 - 0.08 * i * i; ctx.fillRect(px, py, 1, 1); }
}
function pen(ctx) {
  ctx.fillStyle = INK; ctx.fillRect(-2, -19, 4, 36);
  ctx.fillStyle = '#29366f'; ctx.fillRect(-1, -18, 2, 30);
  ctx.fillStyle = '#c7cfdd'; ctx.fillRect(-1, 12, 2, 4); // Spitze
  ctx.fillStyle = INK; ctx.fillRect(-0.5, 16, 1, 2);
  ctx.fillStyle = '#c7cfdd'; ctx.fillRect(1, -17, 1.5, 9); // Clip
}
function calculator(ctx) {
  ctx.fillStyle = INK; ctx.fillRect(-12, -20, 24, 40);
  ctx.fillStyle = '#4a5068'; ctx.fillRect(-11, -19, 22, 38);
  ctx.fillStyle = '#9fd18f'; ctx.fillRect(-9, -17, 18, 7); // Anzeige
  ctx.fillStyle = INK; ctx.fillRect(-1, -15, 1, 3); ctx.fillRect(1, -15, 1, 3); ctx.fillRect(4, -15, 3, 1); ctx.fillRect(4, -13, 3, 1); // „sin“-artige Zeichen
  for (let r = 0; r < 5; r++) for (let k = 0; k < 4; k++) {
    ctx.fillStyle = r === 0 ? '#ef7d57' : k === 3 ? '#ffcd75' : '#d6d0c2';
    ctx.fillRect(-9 + k * 5, -7 + r * 5, 3.5, 3);
  }
}
function book(ctx) {
  ctx.fillStyle = INK; ctx.fillRect(-14, -20, 28, 40);
  ctx.fillStyle = '#b13e53'; ctx.fillRect(-13, -19, 26, 38);
  ctx.fillStyle = '#7a2a3a'; ctx.fillRect(-13, -19, 3, 38); // Rücken
  ctx.fillStyle = '#ffcd75'; ctx.fillRect(-7, -12, 16, 2); ctx.fillRect(-7, -8, 12, 1.5);
  ctx.fillStyle = '#fff1c4'; for (let i = 0; i < 4; i++) ctx.fillRect(-7, 1 + i * 4, i % 2 ? 10 : 14, 1); // Formelzeilen
  ctx.fillStyle = '#f4f4f4'; ctx.fillRect(13, -18, 1, 36); // Seiten
}
