// Aufgabentyp P: Fehlerbalken [W30]. Aus Messwerten mit ± Unsicherheit Größt- und Kleinstwert abschätzen.
// Der Bestwert steht fest in der Mitte; oberen und unteren Whisker zieht man mit dem Finger (▲/▼ zum Feinjustieren).
// Gültige Ziffern spielen hier keine Rolle (kein Polizist). Geld wie H: perfect / partial / fail.
//
// Ticket-Feld "task":
// { "type":"errorbar", "context":"…", "prompt":"…", "paper":"…",
//   "measures":[ { "name":"x", "label":"Δx", "value":1.0, "err":0.2, "unit":"m" }, … ],
//   "result":{ "expr":"x / t", "label":"v", "unit":"m/s", "axis":[0, 10], "step":0.05, "tol":0.1 } }

import { extremes, diagnose } from '../engine/errors.js';
import { fmt } from '../render/format.js';
import { frame } from './common.js';

const sub = (s) => s.replace(/_(\w+)/, '<sub>$1</sub>');
const HINT = {
  best: 'Das ist der Bestwert. Gesucht ist der Wert ganz außen am Balken.',
  corner: 'Diese Kombination aus Messwerten gibt nicht den äußersten Wert. Welcher Messwert muss dafür groß, welcher klein sein?',
  single: 'Du hast nur eine Unsicherheit berücksichtigt. Im ungünstigsten Fall liegen alle Messwerte gleichzeitig daneben!',
};

export function mount(root, { ticket, onSolved }) {
  const task = ticket.task, R = task.result;
  const ex = extremes(R.expr, task.measures);
  const step = R.step ?? 0.1, tol = R.tol ?? step;
  const dec = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
  const fx = (v, d) => v.toFixed(d).replace('.', ',').replace('-', '−'); // feste Nachkommastellen: „0,20“
  const f = (v) => fx(Math.round(v / step) * step, dec);
  const { left, right } = frame(root);

  // ---------- links: Messprotokoll ----------
  const rows = task.measures.map((m) => `<tr><td>${sub(m.label)}</td><td>= ${fx(m.value, m.dec ?? dec)} ± ${fx(m.err, m.dec ?? dec)} ${m.unit}</td></tr>`).join('');
  left.innerHTML = `${task.context ? '<div class="strobe-context"></div>' : ''}
    <div class="eb-protocol"><strong>Messprotokoll</strong><table>${rows}</table>
      <div class="eb-best">Bestwert: ${sub(R.label)} = ${fx(ex.best, R.bestDec ?? dec)} ${R.unit}</div></div>
    <div class="paper-note"><strong>✎ Auf Papier</strong><span></span></div>`;
  if (task.context) left.querySelector('.strobe-context').textContent = task.context;
  left.querySelector('.paper-note span').textContent = task.paper
    ?? 'Rechne mit Zettel und Stift: Für den größten Wert alle Messwerte so wählen, dass das Ergebnis möglichst groß wird – für den kleinsten umgekehrt. Gültige Ziffern spielen hier keine Rolle.';

  // ---------- rechts: Fehlerbalken ----------
  right.innerHTML = `<p class="prompt"></p>
    <div class="eb-main"><div class="eb-wrap"><svg class="eb-svg" role="img" aria-label="Fehlerbalken"></svg></div>
    <div class="eb-fine">
      <div class="eb-row" data-k="max"><span>${sub(R.label)}<sub>max</sub></span><button class="btn" data-d="-1" type="button">▼</button><b class="eb-val"></b><button class="btn" data-d="1" type="button">▲</button></div>
      <div class="eb-row" data-k="min"><span>${sub(R.label)}<sub>min</sub></span><button class="btn" data-d="-1" type="button">▼</button><b class="eb-val"></b><button class="btn" data-d="1" type="button">▲</button></div>
    </div></div>
    <div class="calc-actions"><button class="btn btn-check" type="button">Prüfen</button><button class="btn btn-reveal hidden" type="button">Lösung zeigen</button></div>
    <div class="feedback" aria-live="polite"></div>`;
  right.querySelector('.prompt').textContent = task.prompt ?? 'Zieh die Enden des Fehlerbalkens auf den größten und den kleinsten möglichen Wert.';
  const svg = right.querySelector('.eb-svg'), wrap = right.querySelector('.eb-wrap');
  const [lo, hi] = R.axis;
  const snap = (v) => Math.min(hi, Math.max(lo, Math.round(v / step) * step));
  const val = { max: snap(ex.best + (hi - lo) * 0.08), min: snap(ex.best - (hi - lo) * 0.08) };
  let geo = null, done = false, wrong = 0, showTruth = false;

  const NS = 'http://www.w3.org/2000/svg';
  const el = (name, attrs, parent = svg) => { const e = document.createElementNS(NS, name); for (const k in attrs) e.setAttribute(k, attrs[k]); parent.appendChild(e); return e; };
  function draw() {
    const W = Math.max(160, wrap.clientWidth), H = Math.max(150, wrap.clientHeight);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = '';
    const top = 24, bot = H - 12, ax = Math.round(W * 0.3), bx = Math.round(W * 0.55);
    const Y = (v) => bot - ((v - lo) / (hi - lo)) * (bot - top);
    geo = { Y, inv: (y) => lo + ((bot - y) / (bot - top)) * (hi - lo), bx };
    el('rect', { x: 0, y: 0, width: W, height: H, class: 'g-paper', rx: 6 });
    // Achse mit Teilung
    const tick = niceTick(hi - lo);
    for (let v = Math.ceil(lo / tick) * tick; v <= hi + 1e-9; v += tick) {
      el('line', { x1: ax - 5, x2: W - 8, y1: Y(v), y2: Y(v), class: 'eb-grid' });
      const t = el('text', { x: ax - 8, y: Y(v) + 4, class: 'eb-tick', 'text-anchor': 'end' }); t.textContent = fmt(Math.round(v * 1e6) / 1e6);
    }
    for (let v = Math.ceil(lo / (tick / 5)) * (tick / 5); v <= hi + 1e-9; v += tick / 5) el('line', { x1: ax, x2: W - 8, y1: Y(v), y2: Y(v), class: 'eb-grid minor' });
    el('line', { x1: ax, x2: ax, y1: top - 6, y2: bot, class: 'eb-axis' });
    const lab = el('text', { x: 6, y: 15, class: 'eb-title' }); lab.textContent = `${R.label.replace(/_/, '')} in ${R.unit}`;
    if (showTruth) for (const k of ['max', 'min']) el('line', { x1: bx - 26, x2: bx + 26, y1: Y(ex[k]), y2: Y(ex[k]), class: 'eb-truth' });
    // Balken
    el('line', { x1: bx, x2: bx, y1: Y(val.max), y2: Y(val.min), class: 'eb-bar' });
    for (const k of ['max', 'min']) {
      const y = Y(val[k]);
      el('line', { x1: bx - 18, x2: bx + 18, y1: y, y2: y, class: 'eb-cap' });
      el('rect', { x: bx - 22, y: y - 9, width: 44, height: 18, class: `eb-handle ${k}`, 'data-k': k, rx: 4 });
      const t = el('text', { x: bx + 28, y: y + 5, class: 'eb-lab' }); t.textContent = `${f(val[k])} ${R.unit}`;
    }
    el('circle', { cx: bx, cy: Y(ex.best), r: 6, class: 'eb-best-dot' });
    const bl = el('text', { x: bx - 28, y: Y(ex.best) + 4, class: 'eb-lab best', 'text-anchor': 'end' }); bl.textContent = fx(ex.best, R.bestDec ?? dec);
    right.querySelectorAll('.eb-row').forEach((r) => (r.querySelector('.eb-val').textContent = `${f(val[r.dataset.k])} ${R.unit}`));
  }
  function niceTick(span) {
    const raw = span / 6, p = 10 ** Math.floor(Math.log10(raw));
    return [1, 2, 5, 10].map((m) => m * p).find((s) => s >= raw);
  }
  const set = (k, v) => {
    if (done) return;
    v = snap(v);
    if (k === 'max') v = Math.max(v, snap(ex.best)); else v = Math.min(v, snap(ex.best));
    val[k] = v; draw();
  };

  // Ziehen: Griff oder Balkenende antippen, dann senkrecht ziehen
  let drag = null;
  const toY = (e) => { const r = svg.getBoundingClientRect(); return (e.clientY - r.top) * (svg.viewBox.baseVal.height / r.height); };
  svg.addEventListener('pointerdown', (e) => {
    if (done || !geo) return;
    const y = toY(e), dMax = Math.abs(y - geo.Y(val.max)), dMin = Math.abs(y - geo.Y(val.min));
    drag = Math.min(dMax, dMin) < 34 ? (dMax <= dMin ? 'max' : 'min') : (y < geo.Y(ex.best) ? 'max' : 'min');
    svg.setPointerCapture(e.pointerId);
    set(drag, geo.inv(y));
  });
  svg.addEventListener('pointermove', (e) => { if (drag) set(drag, geo.inv(toY(e))); });
  svg.addEventListener('pointerup', () => (drag = null));
  svg.style.touchAction = 'none';
  right.querySelectorAll('.eb-row .btn').forEach((b) => b.addEventListener('click', () => {
    const k = b.closest('.eb-row').dataset.k; set(k, val[k] + Number(b.dataset.d) * step);
  }));
  const ro = new ResizeObserver(draw); ro.observe(wrap);

  // ---------- Prüfen ----------
  const fb = right.querySelector('.feedback'), btnReveal = right.querySelector('.btn-reveal');
  function finish(grade) {
    done = true; showTruth = true; draw();
    right.querySelectorAll('.calc-actions .btn, .eb-row .btn').forEach((b) => (b.disabled = true));
    setTimeout(() => onSolved({ attempts: wrong + 1, grade }), 1200);
  }
  right.querySelector('.btn-check').addEventListener('click', () => {
    if (done) return;
    const msgs = [];
    for (const k of ['max', 'min']) {
      if (Math.abs(val[k] - ex[k]) <= tol + 1e-9) continue;
      const d = diagnose(val[k], k, R.expr, task.measures, tol);
      const name = `${sub(R.label)}<sub>${k}</sub>`;
      msgs.push(`<b>${name}:</b> ${d ? HINT[d] : (wrong >= 1 && R.help?.[k]) || 'Das stimmt noch nicht. Rechne nochmal auf dem Zettel nach.'}`);
    }
    if (!msgs.length) {
      fb.className = 'feedback ok';
      fb.innerHTML = `${wrong ? 'Jetzt stimmt der Fehlerbalken!' : 'Sauber abgeschätzt!'} ${sub(R.label)} liegt zwischen ${f(ex.min)} und ${f(ex.max)} ${R.unit}.`;
      finish(wrong ? 'partial' : 'perfect');
      return;
    }
    wrong++;
    fb.className = 'feedback bad'; fb.innerHTML = msgs.join('<br>');
    if (wrong >= 2) btnReveal.classList.remove('hidden');
  });
  btnReveal.addEventListener('click', () => {
    val.max = ex.max; val.min = ex.min;
    fb.className = 'feedback'; fb.textContent = 'So sieht der Fehlerbalken aus (grüne Striche). Bezahlt wird diesmal nicht.';
    finish('fail');
  });

  return { destroy: () => ro.disconnect() };
}
