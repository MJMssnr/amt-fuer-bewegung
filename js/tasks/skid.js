// Aufgabentyp S: Unfallgutachten [W32]. ① Bremsspur messen (Marken A und B ziehen), ② Straßenzustand wählen,
// ③ v₀ aus v₁² − v₀² = 2·a·Δx ausrechnen (km/h, Polizist aktiv), ④ Urteil: zu schnell oder nicht?
// Geld wie H: alles beim ersten Versuch → voll; Fehler unterwegs → halb; „Lösung zeigen“ → 0 €.
//
// Ticket-Feld "task":
// { "type":"skid", "weather":"dry"|"rain"|"snow", "limit":50, "skid":[2, 11], "range":[0, 16], "v1":0,
//   "surface":"dry", "prompt":"…", "paper":"…", "hints":[…], "help":"…" }

import { drawSkid } from '../render/skid.js';
import { frame } from './common.js';
import { questionBlock } from './questions.js';
import { addSignButtons } from '../ui/signbtn.js';

const SURFACES = [
  { id: 'dry', icon: '☀️', label: 'Asphalt trocken', a: 8 },
  { id: 'rain', icon: '🌧️', label: 'Asphalt nass', a: 5 },
  { id: 'snow', icon: '❄️', label: 'Schneedecke', a: 2 },
];
const TOL = 0.3; // m, Messgenauigkeit je Marke

export function mount(root, { ticket, onSolved }) {
  const task = ticket.task;
  const [lo, hi] = task.range, [s0, s1] = task.skid, len = s1 - s0;
  const surf = SURFACES.find((s) => s.id === (task.surface ?? task.weather));
  const { left, right } = frame(root);
  let errors = 0, step = 1, raf = 0;
  const marks = [lo + (hi - lo) * 0.15, lo + (hi - lo) * 0.4];

  // ---------- links: Unfallstelle ----------
  left.innerHTML = `<div class="scene-wrap skid-wrap"><canvas class="skid-cv"></canvas></div>
    <p class="skid-info">Zieh die gelben Marken <b>A</b> und <b>B</b> an Anfang und Ende der Bremsspur.</p>
    <div class="paper-note"><strong>✎ Auf Papier</strong><span></span></div>`;
  left.querySelector('.paper-note span').textContent = task.paper
    ?? 'v₁² − v₀² = 2 · a · Δx. Das Auto steht am Ende (v₁ = 0) und bremst (a negativ): v₀ = √(2 · |a| · Δx). Am Ende mal 3,6 für km/h.';
  const cv = left.querySelector('.skid-cv');
  let geo = null;
  const draw = (now = performance.now()) => {
    const d = Math.min(window.devicePixelRatio || 1, 3), r = cv.getBoundingClientRect();
    if (!r.width) return;
    if (cv.width !== Math.round(r.width * d)) { cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); }
    geo = drawSkid(cv, { range: task.range, skid: task.skid, weather: task.weather, limit: task.limit, obstacle: !!task.v1, v1: task.v1, marks: step === 1 ? marks : [s0, s1], dpr: d, t: now / 1000 });
  };
  const loop = (now) => { draw(now); raf = requestAnimationFrame(loop); };
  raf = requestAnimationFrame(loop);

  // Marken ziehen
  let drag = -1;
  const toX = (e) => { const r = cv.getBoundingClientRect(); return (e.clientX - r.left) * (cv.width / r.width); };
  cv.addEventListener('pointerdown', (e) => {
    if (step !== 1 || !geo) return;
    const X = toX(e), dA = Math.abs(X - geo.toPx(marks[0])), dB = Math.abs(X - geo.toPx(marks[1]));
    drag = dA <= dB ? 0 : 1;
    cv.setPointerCapture(e.pointerId);
    marks[drag] = snap(geo.fromPx(X));
  });
  cv.addEventListener('pointermove', (e) => { if (drag >= 0) marks[drag] = snap(geo.fromPx(toX(e))); });
  cv.addEventListener('pointerup', () => (drag = -1));
  cv.style.touchAction = 'none';
  const snap = (x) => Math.min(hi, Math.max(lo, Math.round(x * 10) / 10));

  // ---------- rechts: Gutachten in vier Schritten ----------
  right.innerHTML = `<p class="prompt"></p>
    <div class="f-step sk-1"><div class="f-head">① Bremsspur messen</div>
      <button class="btn sk-take" type="button">Messung übernehmen</button><div class="feedback sk-fb1"></div></div>
    <div class="f-step sk-2 hidden"><div class="f-head">② Straßenzustand: Welche Bremsverzögerung gilt?</div>
      <div class="sk-surf">${SURFACES.map((s) => `<button class="f-choice" type="button" data-id="${s.id}">${s.icon} ${s.label}<br><b>|a| = ${s.a.toFixed(1).replace('.', ',')} m/s²</b></button>`).join('')}</div>
      <div class="feedback sk-fb2"></div></div>
    <div class="f-step sk-3 hidden"><div class="f-head">③ Geschwindigkeit vor dem Bremsen</div>${task.v1 ? `<div class="sk-given">${task.v1Text ?? `Beim Aufprall noch v₁ = ${task.v1.toFixed(1).replace('.', ',')} m/s`}</div>` : ''}</div>
    <div class="f-step sk-4 hidden"><div class="f-head">④ Urteil bei Tempo ${task.limit}</div>
      <div class="sk-verdict"><button class="f-choice" type="button" data-v="1">🚨 Zu schnell</button><button class="f-choice" type="button" data-v="0">✅ Nicht zu schnell</button></div>
      <div class="feedback sk-fb4"></div></div>`;
  right.querySelector('.prompt').textContent = task.prompt ?? 'Erstelle das Gutachten: War das Auto zu schnell?';
  const show = (sel) => { const el = right.querySelector(sel); el.classList.remove('hidden'); el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); };

  // ① Messen
  right.querySelector('.sk-take').addEventListener('click', () => {
    if (step !== 1) return;
    const [a, b] = [...marks].sort((x, y) => x - y), fb = right.querySelector('.sk-fb1');
    const okA = Math.abs(a - s0) <= TOL, okB = Math.abs(b - s1) <= TOL;
    if (okA && okB) {
      step = 2;
      fb.className = 'feedback sk-fb1 ok'; fb.textContent = `Gemessen: Δx = ${len.toFixed(1).replace('.', ',')} m. Sauber!`;
      right.querySelector('.sk-take').disabled = true;
      show('.sk-2'); return;
    }
    errors++;
    fb.className = 'feedback sk-fb1 bad';
    fb.textContent = !okA ? 'Der Anfang stimmt noch nicht: Die Spur beginnt dort, wo der erste (blasse) schwarze Strich anfängt.'
      : 'Das Ende stimmt noch nicht: Die Spur endet am Hinterrad des Autos.';
  });
  // ② Straßenzustand
  right.querySelectorAll('.sk-surf .f-choice').forEach((b) => b.addEventListener('click', () => {
    if (step !== 2 || b.disabled) return;
    const fb = right.querySelector('.sk-fb2');
    if (b.dataset.id !== surf.id) {
      errors++; b.disabled = true; b.classList.add('wrong');
      fb.className = 'feedback sk-fb2 bad'; fb.textContent = 'Schau dir das Wetter auf dem Bild genau an: Sonne, Regen oder Schnee?';
      return;
    }
    step = 3; b.classList.add('right');
    right.querySelectorAll('.sk-surf .f-choice').forEach((x) => (x.disabled = true));
    fb.className = 'feedback sk-fb2 ok'; fb.textContent = `Richtig: |a| = ${surf.a.toFixed(1).replace('.', ',')} m/s².`;
    startCalc();
  }));
  // ③ Rechnen
  let calcGrade = 'perfect', calcTries = 1;
  function startCalc() {
    const box = right.querySelector('.sk-3');
    box.classList.remove('hidden');
    const v1 = task.v1 ?? 0, v0 = Math.sqrt(v1 * v1 + 2 * surf.a * len);
    questionBlock(box, [{ label: 'Geschwindigkeit vor dem Bremsen', symbol: 'v_0', unit: 'km/h', truth: v0 * 3.6, hints: task.hints, help: task.help }], {
      rule: false,
      onSolved: ({ attempts, grade }) => {
        calcGrade = grade; calcTries = attempts;
        if (grade === 'fail') return finish('fail');
        step = 4; show('.sk-4');
      },
    });
    addSignButtons(box);
    box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
  // ④ Urteil
  right.querySelectorAll('.sk-verdict .f-choice').forEach((b) => b.addEventListener('click', () => {
    if (step !== 4 || b.disabled) return;
    const v0 = Math.sqrt((task.v1 ?? 0) ** 2 + 2 * surf.a * len) * 3.6, fast = v0 > task.limit;
    const fb = right.querySelector('.sk-fb4');
    if ((b.dataset.v === '1') !== fast) {
      errors++; b.disabled = true; b.classList.add('wrong');
      fb.className = 'feedback sk-fb4 bad'; fb.textContent = `Vergleiche dein Ergebnis mit dem Tempolimit ${task.limit} km/h.`;
      return;
    }
    b.classList.add('right'); right.querySelectorAll('.sk-verdict .f-choice').forEach((x) => (x.disabled = true));
    fb.className = 'feedback sk-fb4 ok';
    fb.textContent = fast ? `Zu schnell: etwa ${Math.round(v0)} km/h statt ${task.limit} km/h.` : `Nicht zu schnell: etwa ${Math.round(v0)} km/h bei erlaubten ${task.limit} km/h.`;
    finish(calcGrade === 'perfect' && !errors ? 'perfect' : 'partial');
  }));
  function finish(grade) {
    step = 5;
    setTimeout(() => onSolved({ attempts: errors + calcTries, grade }), 1200);
  }

  return { destroy: () => cancelAnimationFrame(raf) };
}
