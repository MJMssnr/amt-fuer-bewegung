// Aufgabentyp O: Stroboskopbild bauen [W22]. Links läuft die Bewegung (es blitzt zu jedem Blitzzeitpunkt),
// rechts zieht man die Abbilder 2, 3, … aus der Leiste auf die Bahn. Das erste Abbild ist vorgegeben.
// Prüfung qualitativ: Reihenfolge, Lage (±tol), Muster der Abstände (js/engine/strobe.js → checkStrobe).
//
// Ticket-Feld "task": gemeinsame Felder siehe strobe-common.js, dazu "tol" (m, Standard 6 % des Bildausschnitts),
// "prompt", "paper".

import { checkStrobe } from '../engine/strobe.js';
import { frame } from './common.js';
import { strobeData, photo, flashInfo, fmt2 } from './strobe-common.js';

export function mount(root, { ticket, onSolved }) {
  const task = ticket.task;
  const D = strobeData(task);
  const n = task.flash.n, T = D.motion.tEnd;
  const flashes = D.pos.map((p) => p.t);
  const tol = task.tol ?? 0.06 * (D.range[1] - D.range[0]);
  const { left, right } = frame(root);
  const base = { range: D.range, pendulum: D.pendulum };

  // ---------- links: Bewegung mit Blitzen ----------
  left.innerHTML = `<div class="scene-wrap sb-anim"></div>
    <div class="scene-ctrl sb-ctrl"><button class="btn btn-play" type="button">▶</button>
      <button class="btn sb-prev" type="button" title="voriger Blitz">◀📸</button><button class="btn sb-next" type="button" title="nächster Blitz">📸▶</button>
      <input class="scrub" type="range" min="0" max="${T}" step="0.01" value="0"></div>
    <p class="sb-info">${flashInfo(task)}</p>
    <div class="paper-note"><strong>✎ Auf Papier</strong><span></span></div>`;
  left.querySelector('.paper-note span').textContent = task.paper
    ?? 'Schau genau hin: Wo ist der Körper bei jedem Blitz? Werden die Abstände zwischen zwei Blitzen größer, kleiner oder bleiben sie gleich?';
  const anim = photo(left.querySelector('.sb-anim'), task, { ...base, ruler: 'none', alpha: 1 });
  let t = 0, playing = false, flash = 0, raf = 0, last = 0;
  const scrub = left.querySelector('.scrub'), playBtn = left.querySelector('.btn-play');
  const drawAnim = () => {
    const p = D.motion.at(t);
    const k = flashes.findIndex((f) => Math.abs(f - t) < 1e-6);
    anim.draw({ positions: [p.x], extra: (ctx) => {
      if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${(0.55 * flash).toFixed(2)})`; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); }
      const dpr = ctx.canvas.width / Math.max(1, anim.canvas.clientWidth);
      ctx.font = `${15 * dpr}px "AmtPixel", monospace`; ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(26,28,44,0.75)'; ctx.fillRect(6 * dpr, 6 * dpr, 150 * dpr, 20 * dpr);
      ctx.fillStyle = '#f4f4f4'; ctx.fillText(`t = ${fmt2(Math.round(t * 100) / 100)} s${k >= 0 ? `  📸 ${k + 1}` : ''}`, 12 * dpr, 21 * dpr);
    } });
  };
  const step = (now) => {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    const before = t;
    t = Math.min(T, t + dt * (task.rate ?? 1));
    if (flashes.some((f) => f > before && f <= t)) flash = 1;
    flash = Math.max(0, flash - dt * 6);
    scrub.value = t; drawAnim();
    if (t >= T && flash <= 0) { playing = false; playBtn.textContent = '▶'; return; }
    raf = requestAnimationFrame(step);
  };
  const play = () => { if (t >= T) t = 0; playing = true; playBtn.textContent = '⏸'; last = performance.now(); flash = t === 0 ? 1 : 0; raf = requestAnimationFrame(step); };
  const pause = () => { playing = false; cancelAnimationFrame(raf); playBtn.textContent = '▶'; };
  playBtn.addEventListener('click', () => (playing ? pause() : play()));
  scrub.addEventListener('input', () => { pause(); t = Number(scrub.value); drawAnim(); });
  const jump = (d) => {
    pause();
    const i = d > 0 ? flashes.findIndex((f) => f > t + 1e-6) : flashes.findLastIndex((f) => f < t - 1e-6);
    if (i < 0) return;
    t = flashes[i]; scrub.value = t; flash = 1; drawAnim(); flash = 0;
  };
  left.querySelector('.sb-prev').addEventListener('click', () => jump(-1));
  left.querySelector('.sb-next').addEventListener('click', () => jump(1));
  setTimeout(play, 500);

  // ---------- rechts: Bild bauen ----------
  right.innerHTML = `<p class="prompt"></p><div class="sb-build"></div>
    <div class="sb-tray" aria-label="Abbilder zum Ziehen"></div>
    <div class="calc-actions"><button class="btn sb-reset" type="button">Alle zurück</button>
      <button class="btn btn-check" type="button">Prüfen</button><button class="btn btn-reveal hidden" type="button">Lösung zeigen</button></div>
    <div class="feedback" aria-live="polite"></div>`;
  right.querySelector('.prompt').textContent = task.prompt
    ?? `Bau das Stroboskopbild: Zieh die Abbilder 2 bis ${n} an die Stelle, an der der Körper beim jeweiligen Blitz war. Abbild 1 ist schon da.`;
  const build = photo(right.querySelector('.sb-build'), task, { ...base, labels: true });
  const placed = new Array(n).fill(null);
  placed[0] = D.xs[0];
  let done = false, wrong = 0, showTruth = false;
  const tray = right.querySelector('.sb-tray');
  const redraw = () => {
    const pos = [], lab = [];
    placed.forEach((x, i) => { if (x !== null) { pos.push(x); lab.push(i); } });
    build.draw({ positions: [], extra: (ctx, geo) => {
      const dpr = ctx.canvas.width / Math.max(1, build.canvas.clientWidth);
      if (showTruth) D.xs.forEach((x) => { const [X, Y] = geo.toPx(x); ctx.strokeStyle = '#38b764'; ctx.lineWidth = 2.5 * dpr; ctx.beginPath(); ctx.arc(X, Y - (D.pendulum ? -2 : 9) * dpr, 12 * dpr, 0, 7); ctx.stroke(); });
      pos.forEach((x, j) => token(ctx, geo, x, lab[j], dpr, j === 0 && lab[j] === 0));
    } });
    tray.innerHTML = placed.map((x, i) => (i > 0 && x === null ? `<button class="sb-chip" type="button" data-i="${i}">${i + 1}</button>` : '')).join('')
      || '<span class="sb-empty">Alle Abbilder liegen auf der Bahn.</span>';
  };
  // Ein Abbild: Kreis/Ball mit Nummer
  function token(ctx, geo, x, i, dpr, fixed) {
    let [X, Y] = geo.toPx(x);
    if (D.pendulum) { ctx.strokeStyle = 'rgba(148,176,194,0.5)'; ctx.lineWidth = 1.5 * dpr; ctx.beginPath(); ctx.moveTo(...geo.pivot); ctx.lineTo(X, Y); ctx.stroke(); }
    const r = 9 * dpr, cy = Y - (D.pendulum ? -2 : 9) * dpr;
    ctx.globalAlpha = fixed ? 0.95 : 0.8;
    ctx.fillStyle = fixed ? '#94b0c2' : '#ffcd75'; ctx.beginPath(); ctx.arc(X, cy, r, 0, 7); ctx.fill();
    ctx.lineWidth = 2 * dpr; ctx.strokeStyle = '#1a1c2c'; ctx.stroke(); ctx.globalAlpha = 1;
    ctx.font = `${13 * dpr}px "AmtPixel", monospace`; ctx.textAlign = 'center'; ctx.fillStyle = '#1a1c2c';
    ctx.fillText(`${i + 1}`, X, cy + 4.5 * dpr);
  }

  // ---------- Ziehen ----------
  let drag = null;
  const ghost = document.createElement('div');
  ghost.className = 'sb-ghost hidden';
  document.body.appendChild(ghost);
  const toCanvas = (e) => {
    const r = build.canvas.getBoundingClientRect(), k = build.canvas.width / r.width;
    return { inside: e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top - 20 && e.clientY <= r.bottom + 20, X: (e.clientX - r.left) * k, Y: (e.clientY - r.top) * k };
  };
  const startDrag = (i, e) => {
    if (done) return;
    e.preventDefault();
    drag = i; ghost.textContent = `${i + 1}`; ghost.classList.remove('hidden');
    moveGhost(e);
    document.addEventListener('pointermove', moveGhost);
    document.addEventListener('pointerup', endDrag, { once: true });
  };
  function moveGhost(e) {
    ghost.style.left = `${e.clientX}px`; ghost.style.top = `${e.clientY}px`;
    if (drag === null) return;
    const c = toCanvas(e);
    if (c.inside) { placed[drag] = clampX(build.geo().fromPx(c.X, c.Y)); redraw(); ghost.classList.add('hidden'); }
    else if (placed[drag] !== null) { placed[drag] = null; redraw(); ghost.classList.remove('hidden'); }
  }
  function endDrag(e) {
    document.removeEventListener('pointermove', moveGhost);
    ghost.classList.add('hidden');
    const c = toCanvas(e);
    if (drag !== null) placed[drag] = c.inside ? clampX(build.geo().fromPx(c.X, c.Y)) : null;
    drag = null; redraw();
  }
  const clampX = (x) => Math.max(D.range[0], Math.min(D.range[1], x));
  tray.addEventListener('pointerdown', (e) => { const b = e.target.closest('.sb-chip'); if (b) startDrag(Number(b.dataset.i), e); });
  build.canvas.addEventListener('pointerdown', (e) => {
    const c = toCanvas(e), g = build.geo();
    let best = -1, bd = Infinity;
    placed.forEach((x, i) => { if (i === 0 || x === null) return; const [X, Y] = g.toPx(x); const d = Math.hypot(X - c.X, Y - 9 - c.Y); if (d < bd) { bd = d; best = i; } });
    if (best > 0 && bd < 30 * (build.canvas.width / build.canvas.clientWidth)) startDrag(best, e);
  });
  build.canvas.style.touchAction = 'none';

  const fb = right.querySelector('.feedback');
  function finish(grade) {
    done = true; showTruth = true; redraw();
    right.querySelectorAll('.calc-actions .btn').forEach((b) => (b.disabled = true));
    setTimeout(() => onSolved({ attempts: wrong + 1, grade }), 700);
  }
  right.querySelector('.btn-check').addEventListener('click', () => {
    if (done) return;
    const missing = placed.map((x, i) => (x === null ? i + 1 : 0)).filter(Boolean);
    if (missing.length) { fb.className = 'feedback bad'; fb.textContent = `Es fehlen noch Abbilder: ${missing.join(', ')}.`; return; }
    const r = checkStrobe(placed, D.xs, { tol });
    if (r.ok) {
      fb.className = 'feedback ok';
      fb.textContent = `${wrong ? 'Jetzt passt dein Stroboskopbild!' : 'Stroboskopbild wie aus dem Labor!'} Grüne Ringe: die genauen Orte. ${task.explain ?? ''}`;
      finish(wrong ? 'partial' : 'perfect');
      return;
    }
    wrong++;
    const msgs = [];
    if (!r.order) msgs.push('Die Reihenfolge stimmt nicht: Die Abbilder müssen in Bewegungsrichtung der Reihe nach liegen.');
    if (r.pattern.length) { const p = r.pattern[0]; msgs.push(`Der Abstand von Abbild ${p.i + 2} zu ${p.i + 3} sollte ${p.want === 'gleich' ? 'genauso groß' : p.want} sein als der davor.`); }
    if (r.far.length) msgs.push(`Abbild ${r.far.slice(0, 3).map((i) => i + 1).join(', ')} liegt noch deutlich daneben.`);
    fb.className = 'feedback bad';
    fb.textContent = msgs.join(' ');
    if (wrong >= 2) right.querySelector('.btn-reveal').classList.remove('hidden');
  });
  right.querySelector('.sb-reset').addEventListener('click', () => { if (!done) { placed.fill(null, 1); redraw(); } });
  right.querySelector('.btn-reveal').addEventListener('click', () => {
    D.xs.forEach((x, i) => (placed[i] = x));
    fb.className = 'feedback'; fb.textContent = 'So sieht das Stroboskopbild aus. Vergleiche die Abstände. Bezahlt wird diesmal nicht.';
    finish('fail');
  });
  requestAnimationFrame(redraw);

  return { destroy: () => { pause(); anim.destroy(); build.destroy(); ghost.remove(); } };
}
