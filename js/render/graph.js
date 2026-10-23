// Bewegungsdiagramme als SVG ("Karopapier"-Look). Kein Spielzustand, nur Darstellung.

import { fmt, niceRange, minorDiv } from './format.js';

export const KINDS = {
  xt: { q: 'x', axis: 'x', unit: 'm', title: 't-x-Diagramm' },
  vt: { q: 'vx', axis: 'vₓ', unit: 'm/s', title: 't-vₓ-Diagramm' },
  at: { q: 'ax', axis: 'aₓ', unit: 'm/s²', title: 't-aₓ-Diagramm' },
  yt: { q: 'y', axis: 'y', unit: 'm', title: 't-y-Diagramm' },
  vyt: { q: 'vy', axis: 'v_y', unit: 'm/s', title: 't-v_y-Diagramm' },
  ayt: { q: 'ay', axis: 'a_y', unit: 'm/s²', title: 't-a_y-Diagramm' },
};

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
};

export function rangeOf(pieces) {
  let lo = Infinity, hi = -Infinity;
  for (const pc of pieces) for (const [, y] of pc) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
  return [lo, hi];
}

/**
 * pieces: [[ [t,y], ... ], ...]   kind: Schlüssel aus KINDS
 * opts: { tMax, yRange:[lo,hi], width, height, hideScale, compact }
 * Rückgabe: { el: SVGElement, setCursor(t|null) }
 */
export function drawGraph(kind, pieces, opts = {}) {
  const K = KINDS[kind];
  const W = opts.width ?? 320, H = opts.height ?? 200;
  const compact = !!opts.compact;
  const M = { l: compact ? 40 : 46, r: 16, t: compact ? 18 : 20, b: compact ? 22 : 26 };
  const tR = niceRange(0, opts.tMax ?? Math.max(...pieces.flat().map((p) => p[0])), compact ? 5 : 6);
  const [ylo, yhi] = opts.yRange ?? rangeOf(pieces);
  const yR = niceRange(ylo, yhi, 5);

  const X = (t) => M.l + ((t - tR.lo) / (tR.hi - tR.lo)) * (W - M.l - M.r);
  const Y = (y) => H - M.b - ((y - yR.lo) / (yR.hi - yR.lo)) * (H - M.t - M.b);

  const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'graph', role: 'img', 'aria-label': K.title });
  el('rect', { x: 0, y: 0, width: W, height: H, class: 'g-paper', rx: 6 }, svg);

  // Karoraster: Feinlinien (zählbare Kästchen), Hauptlinien kräftiger
  const grid = el('g', { class: 'g-grid' }, svg);
  const lines = (R, draw) => {
    const n = minorDiv(R.step), d = R.step / n;
    const k0 = Math.round(R.lo / d), k1 = Math.round(R.hi / d);
    for (let k = k0; k <= k1; k++) draw(k * d, k % n === 0 ? 'major' : 'minor');
  };
  lines(tR, (t, c) => el('line', { x1: X(t), x2: X(t), y1: Y(yR.lo), y2: Y(yR.hi), class: c }, grid));
  lines(yR, (y, c) => el('line', { x1: X(tR.lo), x2: X(tR.hi), y1: Y(y), y2: Y(y), class: c }, grid));

  // Achsen mit Pfeilen
  const axes = el('g', { class: 'g-axis' }, svg);
  const y0 = Y(0);
  el('line', { x1: X(0), x2: X(tR.hi) + 10, y1: y0, y2: y0 }, axes);
  el('line', { x1: X(0), x2: X(0), y1: Y(yR.lo), y2: Y(yR.hi) - 10 }, axes);
  el('path', { d: `M${X(tR.hi) + 12},${y0} l-7,-3.5 v7 z`, class: 'g-arrow' }, axes);
  el('path', { d: `M${X(0)},${Y(yR.hi) - 12} l-3.5,7 h7 z`, class: 'g-arrow' }, axes);

  const labels = el('g', { class: 'g-label' }, svg);
  const txt = (x, y, s, anchor = 'middle', cls = '') => {
    const t = el('text', { x, y, 'text-anchor': anchor, class: cls }, labels);
    t.textContent = s;
    return t;
  };
  txt(X(0) + 6, M.t - 6, `${K.axis} in ${K.unit}`, 'start', 'g-title');
  txt(W - 4, y0 - 6, 't in s', 'end', 'g-title');

  // Teilstriche immer, Zahlen nur ohne hideScale. Markierte Teilstriche (opts.mark) bekommen ein "?".
  const mark = opts.mark ?? {};
  const markT = mark.t !== undefined ? mark.t : null;
  const markY = mark.y !== undefined ? mark.y : null;
  const isMark = (v, m, step) => m !== null && Math.abs(v - m * step) < step * 1e-6;
  for (let t = tR.step; t <= tR.hi + 1e-9; t += tR.step) {
    el('line', { x1: X(t), x2: X(t), y1: y0 - 3, y2: y0 + 3 }, axes);
    if (isMark(t, markT, tR.step)) markLabel(X(t), Math.min(y0 + 14, H - 6), 'v', X(t), y0);
    else if (!opts.hideScale) txt(X(t), Math.min(y0 + 13, H - 4), fmt(t));
  }
  for (let y = yR.lo; y <= yR.hi + 1e-9; y += yR.step) {
    if (Math.abs(y) < 1e-9) continue;
    el('line', { x1: X(0) - 3, x2: X(0) + 3, y1: Y(y), y2: Y(y) }, axes);
    if (isMark(y, markY, yR.step)) markLabel(X(0) - 14, Y(y), 'h', X(0), Y(y));
    else if (!opts.hideScale) txt(X(0) - 5, Y(y) + 3.5, fmt(y), 'end');
  }
  txt(X(0) - 5, y0 + 12, '0', 'end');

  function markLabel(x, y, dir, ax, ay) {
    const g = el('g', { class: 'g-mark' }, svg);
    if (dir === 'v') el('line', { x1: ax, x2: ax, y1: Y(yR.lo), y2: Y(yR.hi) }, g);
    else el('line', { x1: X(tR.lo), x2: X(tR.hi), y1: ay, y2: ay }, g);
    el('rect', { x: x - 9, y: y - 8, width: 18, height: 15, rx: 3 }, g);
    const tt = el('text', { x, y: y + 4, 'text-anchor': 'middle' }, g);
    tt.textContent = '?';
  }

  // Anklickbare Abschnitte (Fehlerjagd): opts.bands = [[t0,t1], ...]
  const bands = (opts.bands || []).map(([a, b], i) => {
    const r = el('rect', { x: X(a), y: Y(yR.hi), width: X(b) - X(a), height: Y(yR.lo) - Y(yR.hi), class: 'g-band', 'data-i': i }, svg);
    return r;
  });

  // Kurve
  const curve = el('g', { class: 'g-curve' }, svg);
  for (const pc of pieces) {
    el('polyline', { points: pc.map(([t, y]) => `${X(t).toFixed(1)},${Y(y).toFixed(1)}`).join(' ') }, curve);
  }

  // Zeit-Cursor (für Synchronisation mit der Animation)
  const cur = el('g', { class: 'g-cursor', visibility: 'hidden' }, svg);
  const cline = el('line', { y1: Y(yR.lo), y2: Y(yR.hi) }, cur);
  const cdot = el('circle', { r: 4, visibility: 'hidden' }, cur);

  const valueAt = (t) => {
    for (const pc of pieces) {
      if (t >= pc[0][0] - 1e-9 && t <= pc[pc.length - 1][0] + 1e-9) {
        for (let i = 0; i < pc.length - 1; i++) {
          const [t0, y0v] = pc[i], [t1, y1v] = pc[i + 1];
          if (t <= t1 + 1e-9) return y0v + ((y1v - y0v) * (t - t0)) / (t1 - t0 || 1);
        }
      }
    }
    return null;
  };

  const toPts = (pc) => pc.map(([t, y]) => `${X(t).toFixed(1)},${Y(y).toFixed(1)}`).join(' ');
  let traceLine = null;
  return {
    el: svg,
    tR, yR, bands,
    /** Bildschirmkoordinaten (clientX/Y) -> Diagrammwerte [t, y] (für Freihand) */
    toData(cx, cy) {
      const pt = svg.createSVGPoint();
      pt.x = cx; pt.y = cy;
      const p = pt.matrixTransform(svg.getScreenCTM().inverse());
      return [tR.lo + ((p.x - M.l) / (W - M.l - M.r)) * (tR.hi - tR.lo), yR.lo + ((H - M.b - p.y) / (H - M.t - M.b)) * (yR.hi - yR.lo)];
    },
    /** Fläche/Polygon in Diagrammwerten (Flächen-Puzzle, Steigungsdreieck); vor der Kurve eingefügt */
    shape(pts, cls = 'g-shape') {
      const e = el('polygon', { points: toPts(pts), class: cls });
      svg.insertBefore(e, curve);
      return e;
    },
    /** Linie in Diagrammwerten über allem (z. B. Dreiecksschenkel) */
    seg([a, b], cls = 'g-seg') {
      return el('line', { x1: X(a[0]), y1: Y(a[1]), x2: X(b[0]), y2: Y(b[1]), class: cls }, svg);
    },
    /** Beschriftung in Diagrammwerten, optional mit Pixelversatz */
    note([t, y], text, cls = 'g-note', [dx, dy] = [0, 0]) {
      const e = el('text', { x: X(t) + dx, y: Y(y) + dy, 'text-anchor': 'middle', class: cls }, svg);
      e.textContent = text;
      return e;
    },
    /** Kreis in Diagrammwerten */
    dot([t, y], cls = 'g-dot', r = 4) {
      return el('circle', { cx: X(t), cy: Y(y), r, class: cls }, svg);
    },
    /** Diagrammwerte -> SVG-Pixel (für Toleranzen in Pixeln) */
    toPx: ([t, y]) => [X(t), Y(y)],
    /** Zusätzliche Kurve (z. B. Lösung) mit eigener CSS-Klasse */
    overlay(more, cls = 'g-overlay') {
      const g = el('g', { class: cls }, svg);
      for (const pc of more) el('polyline', { points: toPts(pc) }, g);
      return g;
    },
    /** Live-Spur (Live-Steuerung): Punkte [[t,y], ...] */
    trace(pts) {
      if (!traceLine) traceLine = el('polyline', { class: 'g-trace' }, svg);
      traceLine.setAttribute('points', toPts(pts.map(([t, y]) => [t, Math.max(yR.lo, Math.min(yR.hi, y))])));
    },
    setCursor(t) {
      if (t === null || t === undefined) return cur.setAttribute('visibility', 'hidden');
      const v = valueAt(t);
      cur.setAttribute('visibility', 'visible');
      cline.setAttribute('x1', X(t));
      cline.setAttribute('x2', X(t));
      cdot.setAttribute('visibility', v === null ? 'hidden' : 'visible');
      if (v !== null) { cdot.setAttribute('cx', X(t)); cdot.setAttribute('cy', Y(v)); }
    },
  };
}
