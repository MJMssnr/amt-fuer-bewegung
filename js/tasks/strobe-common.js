// Gemeinsames für die Stroboskop-Typen M, N, O [W22]: Foto-Kasten, Blitz-Info, Bewegungsdaten aus dem Ticket.
//
// Ticket-Feld "task" (gemeinsam):
// { "motion":{…siehe js/engine/strobe.js…}, "flash":{ "n":6, "dt":0.5, "t0":0 },
//   "photo":{ "bg":"night"|"park"|"city", "obj":"ball"|Sprite, "ruler":"band"|"bar"|"none", "bar":1, "vertical":false, "flip":false,
//             "range":[lo,hi] (optional, sonst automatisch) } }

import { strobePositions, motionOf } from '../engine/strobe.js';
import { drawStrobe } from '../render/strobe.js';
import { fmt as fmtRaw } from '../render/format.js';
import { atLeast2 } from '../engine/sigfig.js';

export const fmt2 = (v) => atLeast2(fmtRaw(v), v);

/** Orte der Abbilder und sinnvoller Bildausschnitt */
export function strobeData(task) {
  const pos = strobePositions(task.motion, task.flash);
  const xs = pos.map((p) => p.x);
  const lo = Math.min(...xs), hi = Math.max(...xs), pad = (hi - lo) * 0.08 || 1;
  const range = task.photo?.range ?? [Math.floor(lo - pad), Math.ceil(hi + pad)];
  const pendulum = task.motion.kind === 'pendulum' ? { L: task.motion.L, amp: task.motion.amp } : null;
  return { pos, xs, range, pendulum, motion: motionOf(task.motion) };
}

/** Foto-Kasten in `box` anlegen; zeichnet neu bei Größenänderung. Rückgabe: { canvas, draw(extra), geo() } */
export function photo(box, task, base = {}) {
  const canvas = document.createElement('canvas');
  canvas.className = `strobe-photo${task.photo?.vertical ? ' vertical' : ''}${task.motion?.kind === 'pendulum' ? ' pendulum' : ''}`;
  box.appendChild(canvas);
  let opts = {}, geo = null;
  const draw = (o = opts) => {
    opts = o;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const r = canvas.getBoundingClientRect();
    if (!r.width) return;
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    geo = drawStrobe(canvas, { ...task.photo, ...base, ...opts, dpr });
  };
  const ro = new ResizeObserver(() => draw());
  ro.observe(canvas);
  return { canvas, draw, geo: () => geo, destroy: () => ro.disconnect() };
}

/** Kurzinfo unter dem Foto */
export function flashInfo(task) {
  return `📸 ${task.flash.n} Blitze, einer alle Δt = ${fmt2(task.flash.dt)} s`;
}
