// Spielabschluss [W24]: Florian trägt die Kisten zum Bauplatz, baut Schritt für Schritt die rote Rakete
// (Schutzbrille, Schweißen, Anleitung), Herr Messner bedankt sich und befördert ihn (Teil 2: 2D),
// die ganze Stadt kommt, Florian steigt im Raumanzug ein – Countdown, Feuer, Rauch, Start.
// Texte: data/finale.json. Ablauf als „Regie“-Funktionen nacheinander; eine Zeichenschleife zeigt den Zustand S.
// [W33] Bauschritte per Tippen bestätigen, Bärti kommt mit (falls gekauft), kürzere Stadt-Szene.
// mode 'flight': kurzer Wiederholungsflug nach dem Finale (Rakete steht schon, Bärti springt vom Baum).

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

export async function playFinale({ texts, baerti = false, mode = 'full' } = {}) {
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
    actors: [], smoke: [], sparks: [], weld: false, book: false, hearts: [], tap: false,
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
  // Weiter erst nach Tippen / Leertaste [W33]
  const waitTap = () => new Promise((resolve) => {
    S.tap = true;
    const go = (e) => {
      if (e.type === 'keydown' && e.key !== ' ' && e.key !== 'Enter') return;
      e.preventDefault?.(); el.removeEventListener('pointerup', go); document.removeEventListener('keydown', go);
      S.tap = false; resolve();
    };
    setTimeout(() => { el.addEventListener('pointerup', go); document.addEventListener('keydown', go); }, 250);
  });
  const arc = async (a, x1, y1, ms = 500, h = 14) => { // Sprung im Bogen
    const x0 = a.x, y0 = a.y ?? GROUND + 2, n = Math.max(1, Math.round(ms / 16));
    for (let i = 1; i <= n && running; i++) { const u = i / n; a.x = x0 + (x1 - x0) * u; a.y = y0 + (y1 - y0) * u - Math.sin(Math.PI * u) * h; await wait(16); }
  };

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
    for (const a of S.actors) if (a.carried) { a.x = a.carried.x + 3; a.y = (a.carried.y ?? GROUND + 2) - 8; a.show = a.carried.show; }
    S.hearts = S.hearts.filter((h) => S.t - h.t0 < 1.4);
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
      // Clip nur nach oben begrenzen: liegt die Spitze über dem Bildrand (Nahaufnahme beim Raumanzug), darf der
      // Sockel unten nicht abgeschnitten werden [W47]
      const clipY = P.Y(ry - 76 * shown);
      ctx.beginPath(); ctx.rect(0, clipY, c.width, Math.max(c.height, c.height - clipY)); ctx.clip();
      rocket(P2, LOT, GROUND + (ry - GROUND) / 2, S.t, S.thrust, true); // die rote Rakete
      ctx.restore();
      if (S.lights) for (let i = 0; i < 3; i++) if (Math.sin(S.t * 9 + i * 2) > 0) P.rect(LOT - 4 + i * 4, ry - 34 + i * 6, 1.5, 1.5, ['#ff5a36', '#73eff7', '#ffcd75'][i]);
    }
    for (const a of S.actors) if (a.show) actor(P, a);
    drawParticles(P, S.sparks);
    for (const h of S.hearts) { const u = (S.t - h.t0) / 1.4, hx = h.x + Math.sin(u * 6) * 2, hy = h.y - u * 18; for (const [dx, dy] of [[-1, 0], [1, 0], [-2, -1], [-1, -1], [1, -1], [2, -1], [0, 1], [-1, 1], [1, 1], [0, 2], [0, 0]]) P.px(hx + dx, hy + dy, u < 0.8 ? '#e43b44' : 'rgba(228,59,68,0.5)'); }
    if (S.book) book(P, flo.x + (flo.flip ? -9 : 9), GROUND - 10, S.t);
    if (S.weld && Math.sin(S.t * 30) > 0.3) P.blob(LOT - 4, GROUND - 10 - S.stage * 5, 5, 'rgba(200,240,255,0.7)');
    if (S.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${(0.7 * S.flash).toFixed(2)})`; ctx.fillRect(0, 0, c.width, c.height); }
    // Untertitel und große Schrift in Bildschirmkoordinaten
    // „contain“ statt „cover“: Untertitel liegen immer ganz im Bild, auch bei breiten Fenstern [W47]
    const sc = Math.min(c.width / W, c.height / H);
    const PS = new Painter(ctx, sc, (c.width - W * sc) / 2, (c.height - H * sc) / 2); PS.dpr = dpr;
    if (S.caption) PS.text(S.caption, W / 2, 14, 6, { color: '#ffffff', bg: 'rgba(26,28,44,0.7)', pad: 3, minPx: 13, dpr });
    if (S.big) PS.text(S.big, W / 2, 70, 18, { color: '#ffcd75', bold: true, bg: 'rgba(26,28,44,0.6)', pad: 4, minPx: 26, dpr });
    if (S.tap && Math.sin(S.t * 5) > -0.4) PS.text(T.tap ?? '▶ tippen', W - 26, H - 10, 5, { color: '#1a1c2c', bg: '#ffcd75', pad: 2, minPx: 12, dpr });
  }

  function actor(P, a) {
    const sp = getSprite(a.sprite);
    const f = a.moving ? Math.floor(S.t * sp.fps) % sp.frames.length : 0;
    const hop = a.hop && a.moving ? Math.abs(Math.sin(S.t * 10)) * 4 : 0;
    const k = a.scale ?? 1, w = sp.w * k, h = sp.h * k, y = (a.y ?? GROUND + 2) - h - hop;
    if (a.rot) { // drehen (Bärti purzelt / liegt) um die Bildmitte
      const cx = P.X(a.x), cy = P.Y(y + h / 2);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(a.rot); ctx.translate(-cx, -cy);
      P.image(sp.frames[0], a.x - w / 2, y, w, h, a.flip);
      ctx.restore();
      if (a.dizzy) for (let i = 0; i < 3; i++) { const an = S.t * 4 + i * 2.1; P.rect(a.x + Math.cos(an) * 6, y - 2 + Math.sin(an) * 2, 1.5, 1.5, '#ffcd75'); }
      return;
    }
    P.blob(a.x, (a.y ?? GROUND + 2), w * 0.4, 'rgba(20,24,40,0.25)', 1);
    P.image(sp.frames[f], a.x - w / 2, y, w, h, a.flip && sp.turns !== false);
    if (a.boxes) for (let i = 0; i < 3; i++) { P.rect(a.x - 5, y - 6 - i * 5, 10, 5, '#1a1c2c'); P.rect(a.x - 4, y - 5 - i * 5, 8, 3, '#a0622d'); }
    if (a.goggles) { P.rect(a.x - 4, y + 5, 8, 2, '#1a1c2c'); P.rect(a.x - 3, y + 5, 2, 1, '#73eff7'); P.rect(a.x + 1, y + 5, 2, 1, '#73eff7'); }
    if (a.raccoon) { // Bärti: Keks, eigener kleiner Helm
      const hx = a.x + (a.flip ? -1 : 1) * w * 0.27, hy = y + h * 0.35;
      if (a.cookie) { P.blob(hx + (a.flip ? -4 : 4), hy + 3, 2, '#1a1c2c'); P.blob(hx + (a.flip ? -4 : 4), hy + 3, 1.5, '#c58b5e'); if (Math.sin(S.t * 9) > 0.6) P.px(hx + (a.flip ? -5 : 5), (a.y ?? GROUND + 2) - 1, '#e7b98a'); }
      if (a.helmet) { P.blob(hx, hy, 5, 'rgba(168,236,255,0.45)'); P.rect(hx - 5, hy + 3, 10, 1, '#c2c7cf'); P.px(hx - 2, hy - 3, '#ffffff'); }
      return;
    }
    if (a.helmet) { P.blob(a.x, y + 5, 7, 'rgba(168,236,255,0.45)'); P.blob(a.x, y + 5, 7, 'rgba(255,255,255,0.0)'); P.rect(a.x - 7, y + 10, 14, 2, '#c2c7cf'); P.px(a.x - 3, y + 1, '#ffffff'); }
  }
  function book(P, x, y, t) {
    P.rect(x - 5, y - 4, 10, 7, '#1a1c2c'); P.rect(x - 4, y - 3, 4, 5, '#fff7e0'); P.rect(x + 1, y - 3, 3, 5, '#fff7e0');
    const flip = (t * 1.5) % 1;
    if (flip < 0.3) P.rect(x + 1 - Math.round(flip * 15), y - 3, 2, 5, '#e9e0c8');
  }

  // ---------- Regie ----------
  // Bärti kommt mit [W33]: hüpft heran (oder springt vom Baumhaus), isst einen Keks, bekommt einen Helm,
  // springt Florian in die Arme, die beiden kuscheln.
  async function baertiJoins(fromTree) {
    const b = { sprite: 'baerti', raccoon: true, hop: true, scale: 0.7, x: fromTree ? HOUSE + 10 : -14, y: fromTree ? GROUND - 34 : GROUND + 2, show: true };
    S.actors.push(b);
    if (fromTree) { await arc(b, HOUSE + 30, GROUND + 2, 650, 10); sfx('ok'); }
    await walk(b, flo.x - 16, 55);
    b.sprite = 'baerti_sit'; b.flip = false; b.hop = false;
    b.cookie = true; await wait(2200); b.cookie = false;
    S.flash = 0.5; b.helmet = true; sfx('coin'); await wait(600);
    b.sprite = 'baerti'; await arc(b, flo.x, GROUND - 6, 450, 12); b.carried = flo; b.sprite = 'baerti_sit';
    for (let i = 0; i < 8; i++) { S.hearts.push({ x: flo.x + (Math.random() - 0.5) * 10, y: GROUND - 14, t0: S.t + i * 0.12 }); }
    await wait(1400);
    return b;
  }
  async function climbAndLaunch(maxLift = 900) {
    flo.moving = true;
    for (let i = 0; i < 60 && running; i++) { flo.x += (LOT - flo.x) * 0.06; flo.y = GROUND + 2 - i * 0.55; await wait(16); }
    flo.show = false; flo.moving = false;
    camera(1, W / 2, H / 2 + 10);
    S.lights = true;
    for (const n of T.countdown) { S.big = n; sfx('ok'); await wait(900); }
    S.big = ''; S.flash = 0.8; engineStart();
    for (let i = 0; i <= 40 && running; i++) { S.thrust = Math.min(1, i / 25); engineSet(S.thrust); await wait(30); }
    const t0 = S.t;
    while (running && S.lift < maxLift) {
      const tt = S.t - t0;
      S.lift = 0.5 * 26 * tt * tt;
      if (S.lift > 60) camera(1, W / 2, GROUND - S.lift + 40);
      await wait(16);
    }
  }

  try {
    if (mode === 'baerti') { // Bärti fällt aus der Baumkrone und bekommt seinen Namen [W42]
      const B = T.baertiIntro;
      S.stage = 0; camera(2.2, HOUSE + 24, GROUND - 26); flo.x = HOUSE + 46; flo.flip = true;
      await wait(600);
      await showDialog(B.rustle);
      const b = { sprite: 'baerti_sit', raccoon: true, scale: 0.7, x: HOUSE + 14, y: GROUND - 56, show: true };
      S.actors.push(b);
      for (let i = 0; i < 6; i++) { b.x += i % 2 ? 1 : -1; await wait(90); } // zappelt im Laub
      let v = 0; b.sprite = 'baerti'; b.rot = 0;
      while (b.y < GROUND + 2 && running) { v += 0.45; b.y = Math.min(GROUND + 2, b.y + v); b.rot += 0.35; await wait(16); }
      sfx('bad'); b.rot = Math.PI / 2; b.dizzy = true; S.flash = 0.2;
      await wait(1600);
      await showDialog(B.hello);
      b.rot = 0; b.dizzy = false; b.sprite = 'baerti_sit'; await wait(500);
      b.sprite = 'baerti'; b.hop = true; await walk(b, flo.x - 14, 70); b.hop = false;
      b.sprite = 'baerti_sit'; await wait(500);
      b.sprite = 'baerti'; await arc(b, flo.x, GROUND - 6, 420, 12); b.carried = flo; b.sprite = 'baerti_sit';
      for (let i = 0; i < 8; i++) S.hearts.push({ x: flo.x + (Math.random() - 0.5) * 10, y: GROUND - 14, t0: S.t + i * 0.12 });
      await showDialog(B.name);
      await showDialog(B.cookie);
      b.cookie = true; await wait(2200); b.cookie = false;
      for (let i = 0; i < 5; i++) S.hearts.push({ x: flo.x + (Math.random() - 0.5) * 8, y: GROUND - 14, t0: S.t + i * 0.15 });
      await wait(900);
      await showDialog(B.end);
      return;
    }
    if (mode === 'flight') {
      // Kurzer Wiederholungsflug: Rakete steht schon
      S.stage = 7; camera(1.6, (HOUSE + LOT) / 2, GROUND - 14);
      await wait(500);
      if (baerti) { await showDialog(T.again.baerti); await baertiJoins(true); }
      S.flash = 0.6; flo.sprite = 'florian_suit'; flo.helmet = true; sfx('coin');
      await showDialog(T.again.suit);
      await climbAndLaunch(520);
      engineStop(); S.flash = 1; await wait(500);
      await showDialog(T.again.back);
      return;
    }
    // 1) Kisten raus zum Bauplatz
    camera(1, W / 2, H / 2 + 10);
    S.caption = T.carry; flo.boxes = true;
    await walk(flo, LOT - 26, 50);
    flo.boxes = false; S.caption = '';
    // 2) Nahaufnahme: Bauen mit Schutzbrille, Schweißen, Anleitung – jede Stufe per Tippen bestätigen [W33]
    camera(2.2, LOT - 8, GROUND - 30);
    flo.goggles = true; flo.flip = false;
    await wait(900);
    for (let i = 0; i < 7 && running; i++) {
      S.caption = T.steps[i];
      if (i % 3 === 1) { S.book = true; S.caption = `${T.steps[i]}  📖 ${T.reading[(i / 3) | 0] ?? ''}`; await wait(1500); S.book = false; }
      S.weld = true; sfx('ok'); await wait(1100); S.weld = false;
      S.stage = i + 1; S.flash = 0.3; await wait(300);
      await waitTap();
    }
    S.caption = ''; flo.goggles = false;
    // 3) Herr Messner kommt
    camera(1.8, LOT - 40, GROUND - 2); // Boden in Bildmitte: Dialogbox verdeckt niemanden
    const mess = { sprite: 'messner', x: -10, flip: false, show: true };
    S.actors.push(mess);
    await walk(mess, LOT - 54, 40);
    flo.flip = true;
    await showDialog(T.messner);
    // 4) Die ganze Stadt eilt herbei (alle kommen, nur einige sprechen)
    camera(1.15, W / 2 + 10, GROUND - 8);
    const who = [...T.town.map(([id]) => id), ...(T.crowdExtra ?? [])];
    const sprites = { kranz: 'kranz', post: 'postbote', broesel: 'broesel', kevin: 'kevin', oetzi: 'oetzi', baecker: 'baecker', jo: 'jo', filiale: 'filiale', ralf: 'ralf', gerda: 'oma_rollator', ohm: 'ohm', slavi: 'slavi', polizist: 'polizist', hilde: 'hilde' };
    const half = Math.ceil(who.length / 2);
    const slots = who.map((_, i) => (i < half ? 10 + i * 19 : 252 + (i - half) * 9));
    const crowd = who.map((id, i) => ({ sprite: sprites[id] ?? 'florian', x: i < half ? -20 - i * 14 : W + 20 + i * 10, show: true, flip: i >= half, scale: id === 'polizist' ? 0.9 : 1 }));
    crowd.forEach((a) => S.actors.push(a));
    await Promise.all(crowd.map((a, i) => walk(a, slots[i], 70 + (i % 4) * 12)));
    crowd.forEach((a, i) => (a.flip = slots[i] > LOT));
    // Slavi: „Bitte lächeln“ → mehrere Blitze hintereinander, Anspielung auf seine Stroboskopbilder [W52]
    const k = T.town.findIndex(([id]) => id === 'slavi');
    if (k >= 0) {
      await showDialog(T.town.slice(0, k + 1));
      for (let i = 0; i < 6 && running; i++) { S.flash = 0.9; sfx('shutter'); await wait(i < 5 ? 260 : 600); }
      await showDialog(T.town.slice(k + 1));
    } else await showDialog(T.town);
    // 5) Raumanzug, Helm, (Bärti), einsteigen
    camera(2.4, flo.x - 8, GROUND - 6);
    await wait(700);
    S.flash = 0.6; flo.sprite = 'florian_suit'; flo.helmet = true; sfx('coin');
    await showDialog(T.suit);
    if (baerti) { await baertiJoins(false); await showDialog(T.baerti); }
    // 6) Countdown, Zündung, Start
    await climbAndLaunch();
    engineStop();
    await wait(600);
    panel.classList.remove('hidden');
    await new Promise((r) => { el.querySelector('.finale-ok').onclick = r; });
  } finally {
    running = false; ro.disconnect(); engineStop();
    el.classList.add('hidden'); document.body.classList.remove('finale-on');
  }
}
