// Finale nach bestandener Prüfung: Raketenstart am Baumhaus, danach Ausblick auf Teil 2.

import { Painter, hash } from '../render/painter.js';
import { getSprite } from '../render/pixel.js';
import { treehouse } from '../render/treehouse.js';
import { tree } from '../render/town.js';
import { rocket, stepParticles, drawParticles } from '../render/vehicles.js';

const W = 320, H = 180, PAD_X = 210, GROUND = 150;

export function playFinale() {
  const el = document.getElementById('finale');
  const c = el.querySelector('canvas');
  const ctx = c.getContext('2d');
  const text = el.querySelector('.finale-text');
  el.classList.remove('hidden');
  text.classList.add('hidden');
  let t = 0, last = performance.now(), running = true, s = 1, ox = 0, oy = 0, dpr = 1;
  const smoke = [], sparks = [];

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    const r = c.getBoundingClientRect();
    c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr);
    s = Math.max(c.width / W, c.height / H);
    ox = (c.width - W * s) / 2; oy = c.height - H * s;
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(c);

  // Flughöhe: Zündung bei 4,5 s, dann gleichmäßig beschleunigt
  const lift = () => (t < 5 ? 0 : 0.5 * 14 * (t - 5) ** 2);

  const frame = (now) => {
    if (!running) return;
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    t += dt;
    const ry = GROUND - lift();
    if (t > 3.8 && ry > -40) {
      for (let i = 0; i < (t < 5 ? 2 : 5); i++)
        smoke.push({ x: PAD_X + (Math.random() - 0.5) * 6, y: ry + 8, vx: (Math.random() - 0.5) * 40, vy: 6 + Math.random() * 14, r: 2 + Math.random() * 3, life: 2.8, max: 2.8, grow: 6 });
      if (Math.random() < 0.6) sparks.push({ x: PAD_X, y: ry + 6, vx: (Math.random() - 0.5) * 60, vy: 20 + Math.random() * 30, r: 1, life: 0.5, max: 0.5, grow: 0, col: 'rgba(255,210,120,A)', alpha: 1 });
    }
    stepParticles(smoke, dt, 6);
    stepParticles(sparks, dt);
    const shake = t > 4 && t < 8 ? Math.round(Math.sin(t * 70) * (8 - t) * 0.5) : 0;
    const P = new Painter(ctx, s, ox + shake * s * 0.5, oy);
    draw(P, ry);
    if (t > 11 && text.classList.contains('hidden')) text.classList.remove('hidden');
    requestAnimationFrame(frame);
  };

  function draw(P, ry) {
    // Himmel wird mit dem Flug dunkler
    const night = Math.min(1, Math.max(0, (t - 6) / 5));
    const bands = ['#2b2f6b', '#3b3f8a', '#5a4d9a', '#8a5aa0', '#c06f8f', '#f09a7a'];
    bands.forEach((col, i) => P.rect(-20, i * 22, W + 40, 23, col));
    P.rect(-20, 0, W + 40, H, `rgba(10,12,30,${(night * 0.75).toFixed(2)})`);
    for (let i = 0; i < 70; i++) {
      const a = (0.3 + night * 0.7) * (Math.sin(t * 2 + i) > -0.3 ? 1 : 0.4);
      P.px(hash(i, 1, 9) * W, hash(i, 2, 9) * 110, `rgba(255,250,220,${a.toFixed(2)})`);
    }
    P.blob(270, 30, 10, '#fdf6d8'); P.blob(266, 27, 9, `rgba(43,47,107,${0.2 + night * 0.4})`);
    // Hügel, Bäume, Baumhaus
    for (let x = -20; x < W + 20; x += 2) {
      const h = 14 + Math.sin(x * 0.03) * 5;
      P.rect(x, GROUND - h + 8, 2, h + 40, '#2f6b3a');
    }
    P.rect(-20, GROUND + 2, W + 40, 40, '#3f8f2a');
    tree(P, 'pine', 20, GROUND + 4, t); tree(P, 'round', 290, GROUND + 4, t); tree(P, 'birch', 250, GROUND + 4, t);
    treehouse(P, 90, GROUND + 4, {}, t, dpr);
    // Startrampe
    P.rect(PAD_X - 18, GROUND - 2, 36, 5, '#333c57'); P.rect(PAD_X - 16, GROUND - 3, 32, 1, '#94b0c2');
    P.rect(PAD_X + 12, GROUND - 46, 3, 44, '#566c86');
    for (let y = GROUND - 44; y < GROUND - 4; y += 6) P.rect(PAD_X + 6, y, 9, 1, '#566c86');
    drawParticles(P, smoke);
    const thrust = t < 3.8 ? 0 : t < 5 ? (t - 3.8) / 1.2 : 1;
    if (ry > -50) rocket(P, PAD_X, ry, t, thrust);
    drawParticles(P, sparks);
    // Florian und Bürgermeisterin schauen zu
    const fl = getSprite('florian_photo'), kr = getSprite('kranz');
    P.image(t > 5.5 && t < 7 ? fl.frames[0] : getSprite('florian').frames[0], 140, GROUND - 18, 14, 22);
    P.image(kr.frames[0], 124, GROUND - 13, 10, 16);
    // Countdown und Texte
    const opt = { color: '#ffffff', bold: true, bg: 'rgba(26,28,44,0.6)', pad: 3, minPx: 18, dpr };
    if (t > 0.6 && t < 4.6) {
      const n = Math.ceil(4 - t);
      P.text(n > 0 ? String(n) : 'ZÜNDUNG!', W / 2, 72, 16, opt);
    }
    if (t > 6 && t < 10) P.text(`a = 14 m/s²   v = ${Math.round(14 * (t - 5))} m/s`, W / 2, 80, 7, { ...opt, minPx: 12 });
    if (t > 5.5 && t < 6.6) {
      ctx.fillStyle = `rgba(255,255,255,${(0.35 * (6.6 - t)).toFixed(2)})`;
      ctx.fillRect(0, 0, c.width, c.height);
    }
  }

  requestAnimationFrame(frame);
  return new Promise((resolve) => {
    el.querySelector('.finale-ok').onclick = () => {
      running = false; ro.disconnect(); el.classList.add('hidden'); resolve();
    };
  });
}
