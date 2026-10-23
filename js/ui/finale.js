// Spielabschluss [W24]: Florian trägt die Kisten zum Bauplatz, baut Schritt für Schritt die rote Rakete
// (Schutzbrille, Schweißen, Anleitung), Herr Messner bedankt sich und befördert ihn (Teil 2: 2D),
// die ganze Stadt kommt, Florian steigt im Raumanzug ein – Countdown, Feuer, Rauch, Start.
// Texte: data/finale.json. Ablauf als „Regie“-Funktionen nacheinander; eine Zeichenschleife zeigt den Zustand S.

import { Painter, hash } from '../render/painter.js';
import { getSprite } from '../render/pixel.js';
import { treehouse } from '../render/treehouse.js';
import { tree } from '../render/town.js';
import { rocket, stepParticles, drawParticles } from '../render/vehicles.js';
import { showDialog } from './dialog.js';
import { sfx, engineStart, engineSet, engineStop } from '../audio/sound.js';

const W = 320, H = 180, GROUND = 150, LOT = 236, HOUSE = 70;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const ease = (u) => (u < 0 ? 0 : u > 1 ? 1 : u * u * (3 - 2 * u));

export async function playFinale({ texts, baerti = false } = {}) {
  const el = document.getElementById('finale');
  const c = el.querySelector('canvas'), ctx = c.getContext('2d');
  const panel = el.querySelector('.finale-text');
  el.classList.remove('hidden'); panel.classList.add('hidden');
  document.body.classList.add('finale-on');
  const T = texts;

  // ---------- Szenenzustand ----------
  const S = {
    t: 0, zoom: 1, cam: [W / 2, H / 2], zoomTo: 1, camTo: [W / 2, H / 2],
    stage: 0, thrust: 0, lift: 0, lights: false, caption: '', big: '', flash: 0,
    actors: [], smoke: [], sparks: [], weld: false, book: false,
  };
  const flo = { id: 'florian', sprite: 'florian', x: HOUSE + 8, flip: false, moving: false, boxes: false, goggles: false, helmet: false, show: true };
  S.actors.push(flo);
  let dpr = 1, s = 1, running = true, last = performance.now();
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    const r = c.getBoundingClientRect();
    c.width = Math.round(r.width * dpr); c.height = Math.round(r.height * dpr);
    s = Math.max(c.width / W, c.height / H);
  };
  resize();
  const ro = new ResizeObserver(resize); ro.observe(c);

  const walk = async (a, x, speed = 45) => {
    a.moving = true; a.flip = x < a.x;
    while (Math.abs(a.x - x) > 0.5 && running) { a.x += Math.sign(x - a.x) * Math.min(Math.abs(x - a.x), speed / 60); await wait(16); }
    a.moving = false;
  };
  const camera = (zoom, cx, cy) => { S.zoomTo = zoom; S.camTo = [cx, cy]; };

  // ---------- Zeichnen ----------
  const frame = (now) => {
    if (!running) return;
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    S.t += dt;
    S.zoom += (S.zoomTo - S.zoom) * Math.min(1, dt * 2.5);
    S.cam = S.cam.map((v, i) => v + (S.camTo[i] - v) * Math.min(1, dt * 2.5));
    if (S.weld && Math.random() < 0.8) for (let i = 0; i < 3; i++) S.sparks.push({ x: LOT - 6 + Math.random() * 4, y: GROUND - 10 - S.stage * 5 + Math.random() * 6, vx: (Math.random() - 0.5) * 50, vy: -20 - Math.random() * 30, r: 0.6, life: 0.4, max: 0.4, grow: 0, col: 'rgba(255,230,140,A)', alpha: 1 });
    const ry = GROUND - S.lift;
    if (S.thrust > 0 && ry > -60) for (let i = 0; i < 6 * S.thrust; i++)
      S.smoke.push({ x: LOT + (Math.random() - 0.5) * 8, y: ry + 6, vx: (Math.random() - 0.5) * 70, vy: 8 + Math.random() * 20, r: 2 + Math.random() * 3, life: 3, max: 3, grow: 7 });
    if (S.lights && S.thrust === 0 && Math.random() < 0.3) // Dampf vor dem Start
      S.smoke.push({ x: LOT + (Math.random() - 0.5) * 20, y: GROUND - 2, vx: (Math.random() - 0.5) * 30, vy: -4, r: 2, life: 2, max: 2, grow: 4, col: 'rgba(245,248,255,A)' });
    stepParticles(S.smoke, dt, 5); stepParticles(S.sparks, dt);
    for (const p of S.sparks) p.vy += 120 * dt;
    S.flash = Math.max(0, S.flash - dt * 2);
    draw(ry);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  function draw(ry) {
    const z = S.zoom * s, shake = S.thrust > 0 && S.lift < 40 ? Math.sin(S.t * 70) * 1.2 : 0;
    const ox = c.width / 2 - S.cam[0] * z + shake * z, oy = c.height / 2 - S.cam[1] * z;
    const P = new Painter(ctx, z, ox, oy); P.dpr = dpr;
    const night = Math.min(1, Math.max(0, S.lift / 300));
    ['#2b2f6b', '#3b3f8a', '#5a4d9a', '#8a5aa0', '#c06f8f', '#f09a7a'].forEach((col, i) => P.rect(-200, -400 + i * 92, W + 400, 93, col));
    P.rect(-200, -400, W + 400, 600, `rgba(10,12,30,${(night * 0.8).toFixed(2)})`);
    for (let i = 0; i < 90; i++) P.px(hash(i, 1, 9) * W, -300 + hash(i, 2, 9) * 400, `rgba(255,250,220,${(0.25 + night * 0.75).toFixed(2)})`);
    for (let x = -40; x < W + 40; x += 2) { const h = 14 + Math.sin(x * 0.03) * 5; P.rect(x, GROUND - h + 8, 2, h + 40, '#2f6b3a'); }
    P.rect(-200, GROUND + 2, W + 400, 200, '#3f8f2a');
    tree(P, 'pine', 14, GROUND + 4, S.t); tree(P, 'round', 300, GROUND + 4, S.t); tree(P, 'birch', 150, GROUND + 4, S.t);
    treehouse(P, HOUSE, GROUND + 4, {}, S.t, dpr);
    P.rect(LOT - 26, GROUND, 52, 6, '#c9b98f'); P.rect(LOT - 26, GROUND, 52, 1, '#ddd0a8');
    drawParticles(P, S.smoke);
    // Rakete in doppelter Größe, Stufe für Stufe von unten nach oben sichtbar
    if (S.stage > 0 && ry > -200) {
      const P2 = new Painter(ctx, z * 2, ox + LOT * z * (1 - 2), oy + GROUND * z * (1 - 2)); P2.dpr = dpr;
      const shown = S.stage >= 7 ? 1 : S.stage / 7;
      ctx.save();
      ctx.beginPath(); ctx.rect(0, P.Y(ry - 76 * shown), c.width, c.height); ctx.clip();
      rocket(P2, LOT, GROUND + (ry - GROUND) / 2, S.t, S.thrust, true); // die rote Rakete
      ctx.restore();
      if (S.lights) for (let i = 0; i < 3; i++) if (Math.sin(S.t * 9 + i * 2) > 0) P.rect(LOT - 4 + i * 4, ry - 34 + i * 6, 1.5, 1.5, ['#ff5a36', '#73eff7', '#ffcd75'][i]);
    }
    for (const a of S.actors) if (a.show) actor(P, a);
    drawParticles(P, S.sparks);
    if (S.book) book(P, flo.x + (flo.flip ? -9 : 9), GROUND - 10, S.t);
    if (S.weld && Math.sin(S.t * 30) > 0.3) P.blob(LOT - 4, GROUND - 10 - S.stage * 5, 5, 'rgba(200,240,255,0.7)');
    if (S.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${(0.7 * S.flash).toFixed(2)})`; ctx.fillRect(0, 0, c.width, c.height); }
    // Untertitel und große Schrift in Bildschirmkoordinaten
    const PS = new Painter(ctx, s, (c.width - W * s) / 2, (c.height - H * s) / 2); PS.dpr = dpr;
    if (S.caption) PS.text(S.caption, W / 2, 14, 6, { color: '#ffffff', bg: 'rgba(26,28,44,0.7)', pad: 3, minPx: 13, dpr });
    if (S.big) PS.text(S.big, W / 2, 70, 18, { color: '#ffcd75', bold: true, bg: 'rgba(26,28,44,0.6)', pad: 4, minPx: 26, dpr });
  }

  function actor(P, a) {
    const sp = getSprite(a.sprite);
    const f = a.moving ? Math.floor(S.t * sp.fps) % sp.frames.length : 0;
    const k = a.scale ?? 1, w = sp.w * k, h = sp.h * k, y = (a.y ?? GROUND + 2) - h;
    P.blob(a.x, (a.y ?? GROUND + 2), w * 0.4, 'rgba(20,24,40,0.25)', 1);
    P.image(sp.frames[f], a.x - w / 2, y, w, h, a.flip && sp.turns !== false);
    if (a.boxes) for (let i = 0; i < 3; i++) { P.rect(a.x - 5, y - 6 - i * 5, 10, 5, '#1a1c2c'); P.rect(a.x - 4, y - 5 - i * 5, 8, 3, '#a0622d'); }
    if (a.goggles) { P.rect(a.x - 4, y + 5, 8, 2, '#1a1c2c'); P.rect(a.x - 3, y + 5, 2, 1, '#73eff7'); P.rect(a.x + 1, y + 5, 2, 1, '#73eff7'); }
    if (a.helmet) { P.blob(a.x, y + 5, 7, 'rgba(168,236,255,0.45)'); P.blob(a.x, y + 5, 7, 'rgba(255,255,255,0.0)'); P.rect(a.x - 7, y + 10, 14, 2, '#c2c7cf'); P.px(a.x - 3, y + 1, '#ffffff'); }
  }
  function book(P, x, y, t) {
    P.rect(x - 5, y - 4, 10, 7, '#1a1c2c'); P.rect(x - 4, y - 3, 4, 5, '#fff7e0'); P.rect(x + 1, y - 3, 3, 5, '#fff7e0');
    const flip = (t * 1.5) % 1;
    if (flip < 0.3) P.rect(x + 1 - Math.round(flip * 15), y - 3, 2, 5, '#e9e0c8');
  }

  // ---------- Regie ----------
  try {
    // 1) Kisten raus zum Bauplatz
    camera(1, W / 2, H / 2 + 10);
    S.caption = T.carry; flo.boxes = true;
    await walk(flo, LOT - 26, 50);
    flo.boxes = false; S.caption = '';
    // 2) Nahaufnahme: Bauen mit Schutzbrille, Schweißen, Anleitung
    camera(2.2, LOT - 8, GROUND - 30);
    flo.goggles = true; flo.flip = false;
    await wait(900);
    for (let i = 0; i < 7 && running; i++) {
      S.caption = T.steps[i];
      if (i % 3 === 1) { S.book = true; S.caption = `${T.steps[i]}  📖 ${T.reading[(i / 3) | 0] ?? ''}`; await wait(1500); S.book = false; }
      S.weld = true; sfx('ok'); await wait(1100); S.weld = false;
      S.stage = i + 1; S.flash = 0.3; await wait(450);
    }
    S.caption = ''; flo.goggles = false;
    // 3) Herr Messner kommt
    camera(1.8, LOT - 40, GROUND - 2); // Boden in Bildmitte: Dialogbox verdeckt niemanden
    const mess = { sprite: 'messner', x: -10, flip: false, show: true };
    S.actors.push(mess);
    await walk(mess, LOT - 54, 40);
    flo.flip = true;
    await showDialog(T.messner);
    // 4) Die ganze Stadt eilt herbei
    camera(1.15, W / 2 + 10, GROUND - 8);
    const who = T.town.map(([id]) => id);
    const sprites = { kranz: 'kranz', post: 'postbote', broesel: 'broesel', kevin: 'kevin', oetzi: 'oetzi', baecker: 'baecker', jo: 'jo', filiale: 'filiale', ralf: 'ralf', gerda: 'oma_rollator', ohm: 'ohm', slavi: 'slavi', polizist: 'polizist' };
    const slots = who.map((_, i) => (i < 7 ? 12 + i * 22 : 258 + (i - 7) * 11));
    const crowd = who.map((id, i) => ({ sprite: sprites[id] ?? 'florian', x: i < 7 ? -20 - i * 14 : W + 20 + i * 10, show: true, flip: i >= 7, scale: id === 'polizist' ? 0.9 : 1 }));
    crowd.forEach((a) => S.actors.push(a));
    if (baerti) S.actors.push({ sprite: 'baerti_sit', x: LOT - 44, show: true, scale: 0.7 });
    await Promise.all(crowd.map((a, i) => walk(a, slots[i], 70 + (i % 4) * 12)));
    crowd.forEach((a, i) => (a.flip = slots[i] > LOT));
    await showDialog(T.town);
    // 5) Raumanzug, Helm, einsteigen
    camera(2.4, flo.x, GROUND - 6);
    await wait(700);
    S.flash = 0.6; flo.sprite = 'florian_suit'; flo.helmet = true; sfx('coin');
    await showDialog(T.suit);
    flo.moving = true;
    for (let i = 0; i < 60 && running; i++) { flo.x += (LOT - flo.x) * 0.06; flo.y = GROUND + 2 - i * 0.55; await wait(16); }
    flo.show = false; flo.moving = false;
    // 6) Countdown, Zündung, Start
    camera(1, W / 2, H / 2 + 10);
    S.lights = true;
    for (const n of T.countdown) { S.big = n; sfx('ok'); await wait(900); }
    S.big = ''; S.flash = 0.8; engineStart();
    for (let i = 0; i <= 40 && running; i++) { S.thrust = Math.min(1, i / 25); engineSet(S.thrust); await wait(30); }
    const t0 = S.t;
    while (running && S.lift < 900) {
      const tt = S.t - t0;
      S.lift = 0.5 * 26 * tt * tt;
      if (S.lift > 60) camera(1, W / 2, GROUND - S.lift + 40);
      await wait(16);
    }
    engineStop();
    await wait(600);
    panel.classList.remove('hidden');
    await new Promise((r) => { el.querySelector('.finale-ok').onclick = r; });
  } finally {
    running = false; ro.disconnect(); engineStop();
    el.classList.add('hidden'); document.body.classList.remove('finale-on');
  }
}
