// Aufgabentyp T: Puppenspieler [W32]. Oben das Soll-t-x-Diagramm als Korridor, unten die Straße.
// Die Zeit läuft, und man schiebt die Figur direkt mit dem Finger: man steuert x selbst (bei F war es vₓ).
// Die eigene t-x-Kurve wird live mitgezeichnet. Bestanden, wenn sie zu ≥ 90 % im Korridor bleibt.
// Geld: erster Lauf bestanden → voll; später → halb; „Lösung zeigen“ (ab 3 Fehlläufen) → 0 €.
//
// Ticket-Feld "task":
// { "type":"puppet", "sprite":"oma_rollator", "x0":0, "segments":[…], "range":[0, 12], "tol":0.8, "need":0.9,
//   "prompt":"…", "paper":"…" }

import { buildWorld, series, quantityAt } from '../engine/kinematics.js';
import { KINDS } from '../render/graph.js';
import { graphInto } from './common.js';
import { getSprite } from '../render/pixel.js';

export function mount(root, { ticket, onSolved }) {
  const task = ticket.task;
  const actor = buildWorld({ actors: [{ id: 'a', x0: task.x0 ?? 0, segments: task.segments }] }).actors.get('a');
  const T = actor.tEnd, [lo, hi] = task.range;
  const tol = task.tol ?? 0.08 * (hi - lo), need = task.need ?? 0.9;
  const target = (t) => quantityAt(actor, KINDS.xt.q, Math.min(t, T));

  root.innerHTML = `<div class="puppet">
    <div class="pp-top"><figure class="graph-card pp-graph"></figure>
      <div class="pp-side"><p class="prompt pp-prompt"></p><div class="paper-note"><strong>✎ Auf Papier</strong><span></span></div></div></div>
    <div class="scene-wrap pp-street"><canvas class="pp-cv"></canvas></div>
    <div class="pp-ctrl"><button class="btn btn-check pp-start" type="button">▶ Start</button>
      <button class="btn live-slow pp-slow" type="button">🐢 halbe Zeit</button>
      <span class="pp-score"></span><button class="btn btn-reveal hidden" type="button">Lösung zeigen</button>
      <div class="feedback pp-fb" aria-live="polite"></div></div>
  </div>`;
  root.querySelector('.pp-prompt').textContent = task.prompt ?? 'Schieb die Figur mit dem Finger so, dass deine t-x-Kurve im Korridor bleibt.';
  root.querySelector('.paper-note span').textContent = task.paper
    ?? 'Lies vorher ab: Wo steht die Figur wann? Steil heißt schnell schieben, waagrecht heißt festhalten, fallend heißt zurück.';

  // ---------- Diagramm mit Korridor ----------
  const card = root.querySelector('.pp-graph');
  let g = null;
  const drawGraph = () => {
    card.innerHTML = '';
    g = graphInto(card, 'xt', series(actor, KINDS.xt.q), { tMax: T, yRange: [lo, hi] });
    const band = g.overlay(series(actor, KINDS.xt.q), 'pp-band');
    const w = Math.abs(g.toPx([0, tol])[1] - g.toPx([0, 0])[1]) * 2;
    band.querySelectorAll('polyline').forEach((pl) => (pl.style.strokeWidth = `${w}px`));
    g.el.insertBefore(band, g.el.querySelector('.g-curve') ?? null);
    if (trace.length) g.trace(trace);
    g.setCursor(running ? t : 0);
  };

  // ---------- Straße mit Figur ----------
  const cv = root.querySelector('.pp-cv'), ctx = cv.getContext('2d');
  const sp = getSprite(task.sprite ?? 'oma_rollator');
  let x = target(0), flip = false, t = 0, running = false, rate = 1, raf = 0, last = 0, trace = [], runs = 0, fails = 0, done = false, auto = false;
  const m = 22;
  const toPx = (v, W, d) => m * d + ((v - lo) / (hi - lo)) * (W - 2 * m * d);
  const fromPx = (X, W, d) => lo + ((X - m * d) / (W - 2 * m * d)) * (hi - lo);
  function drawStreet() {
    const d = Math.min(window.devicePixelRatio || 1, 3), r = cv.getBoundingClientRect();
    if (!r.width) return;
    if (cv.width !== Math.round(r.width * d)) { cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); }
    const W = cv.width, H = cv.height, ground = H * 0.62;
    ctx.fillStyle = '#9fd6f2'; ctx.fillRect(0, 0, W, ground);
    ctx.fillStyle = '#cfc6b4'; ctx.fillRect(0, ground, W, H * 0.12);
    ctx.fillStyle = '#f4f4f4'; ctx.fillRect(0, ground + H * 0.12, W, H);
    ctx.fillStyle = '#1a1c2c'; ctx.font = `${11 * d}px "AmtPixel", monospace`; ctx.textAlign = 'center';
    const step = (hi - lo) <= 14 ? 1 : 2;
    for (let v = Math.ceil(lo); v <= hi + 1e-9; v += step) {
      const X = toPx(v, W, d);
      ctx.fillRect(X, ground + H * 0.12, 1.5 * d, 6 * d);
      if ((v - Math.ceil(lo)) % (step * 2) === 0) ctx.fillText(`${v} m`, X, H - 4 * d);
    }
    // Figur (Fußpunkt bei x)
    const k = (H * 0.5) / sp.h, w = sp.w * k, h = sp.h * k, X = toPx(x, W, d);
    const f = running ? Math.floor(t * (sp.fps ?? 6)) % sp.frames.length : 0;
    ctx.imageSmoothingEnabled = false;
    ctx.save(); ctx.translate(X, ground + H * 0.06 - h);
    if (flip) { ctx.scale(-1, 1); ctx.drawImage(sp.frames[f], -w / 2, 0, w, h); } else ctx.drawImage(sp.frames[f], -w / 2, 0, w, h);
    ctx.restore();
    // Marionettenfäden nach oben
    ctx.strokeStyle = 'rgba(26,28,44,0.5)'; ctx.lineWidth = d;
    for (const dx of [-w * 0.3, w * 0.3]) { ctx.beginPath(); ctx.moveTo(X + dx, 0); ctx.lineTo(X + dx * 0.6, ground + H * 0.06 - h * 0.7); ctx.stroke(); }
    ctx.fillStyle = 'rgba(26,28,44,0.75)'; ctx.fillRect(4 * d, 4 * d, 92 * d, 18 * d);
    ctx.fillStyle = '#f4f4f4'; ctx.textAlign = 'left'; ctx.font = `${13 * d}px "AmtPixel", monospace`;
    ctx.fillText(`t = ${t.toFixed(1).replace('.', ',')} s`, 9 * d, 17 * d);
  }

  // ---------- Ziehen ----------
  let dragging = false;
  const setX = (e) => {
    const r = cv.getBoundingClientRect(), d = cv.width / r.width;
    const nx = Math.min(hi, Math.max(lo, fromPx((e.clientX - r.left) * d, cv.width, d)));
    if (Math.abs(nx - x) > 1e-3) flip = nx < x;
    x = nx;
  };
  cv.addEventListener('pointerdown', (e) => { if (done || auto) return; dragging = true; cv.setPointerCapture(e.pointerId); setX(e); });
  cv.addEventListener('pointermove', (e) => { if (dragging) setX(e); });
  cv.addEventListener('pointerup', () => (dragging = false));
  cv.style.touchAction = 'none';

  // ---------- Lauf ----------
  const fb = root.querySelector('.pp-fb'), score = root.querySelector('.pp-score'), startBtn = root.querySelector('.pp-start');
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (running) {
      t = Math.min(T, t + dt * rate);
      if (auto) { const nx = target(t); flip = nx < x; x = nx; }
      trace.push([t, x]);
      g.trace(trace); g.setCursor(t);
      const inside = trace.filter(([tt, xx]) => Math.abs(xx - target(tt)) <= tol).length / trace.length;
      score.textContent = `Im Korridor: ${Math.round(inside * 100)} %`;
      if (t >= T) end(inside);
    }
    drawStreet();
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (done || running) return;
    trace = []; t = 0; x = target(0); running = false; startBtn.disabled = true;
    let n = 3;
    fb.className = 'feedback pp-fb'; fb.textContent = 'Fass die Figur an … 3';
    const tick = setInterval(() => {
      n--;
      if (n > 0) { fb.textContent = `Fass die Figur an … ${n}`; return; }
      clearInterval(tick); fb.textContent = 'Los!'; running = true; last = performance.now();
    }, 700);
  }
  function end(inside) {
    running = false; runs++; startBtn.disabled = false;
    if (auto) { fb.className = 'feedback pp-fb'; fb.textContent = 'So läuft es nach Plan. Bezahlt wird diesmal nicht.'; return finish('fail'); }
    if (inside >= need) {
      fb.className = 'feedback pp-fb ok';
      fb.textContent = `Bravo! ${Math.round(inside * 100)} % im Korridor – das Publikum tobt.`;
      return finish(fails ? 'partial' : 'perfect');
    }
    fails++;
    fb.className = 'feedback pp-fb bad';
    fb.textContent = `${Math.round(inside * 100)} % im Korridor, nötig sind ${Math.round(need * 100)} %. ${fails === 1 ? 'Tipp: Mit 🐢 läuft die Zeit halb so schnell.' : 'Wo bist du rausgerutscht? Schau, wo deine Linie den Korridor verlässt.'}`;
    startBtn.textContent = '↺ Nochmal';
    if (fails >= 3) root.querySelector('.btn-reveal').classList.remove('hidden');
  }
  function finish(grade) {
    done = true; startBtn.disabled = true; root.querySelector('.btn-reveal').disabled = true;
    setTimeout(() => onSolved({ attempts: runs, grade }), 1300);
  }
  startBtn.addEventListener('click', start);
  root.querySelector('.pp-slow').addEventListener('click', (e) => { rate = rate === 1 ? 0.5 : 1; e.currentTarget.classList.toggle('on', rate !== 1); });
  root.querySelector('.btn-reveal').addEventListener('click', () => { if (done || running) return; auto = true; trace = []; t = 0; x = target(0); running = true; last = performance.now(); });

  const ro = new ResizeObserver(() => drawGraph());
  ro.observe(card);
  raf = requestAnimationFrame((now) => { last = now; frame(now); });
  return { destroy: () => { cancelAnimationFrame(raf); ro.disconnect(); } };
}
