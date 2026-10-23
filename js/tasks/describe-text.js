// Fachsprachliche Beschreibung einer 1D-Bewegung und Distraktoren aus Fehlvorstellungen.
// Reine Textlogik ohne DOM, damit sie testbar bleibt.
// Regel: "verzögert" nur, wenn der Betrag der Geschwindigkeit abnimmt (vₓ und aₓ mit entgegengesetztem Vorzeichen).

import { fmt as fmtRaw } from '../render/format.js';
import { atLeast2 } from '../engine/sigfig.js';

const fmt = (v) => atLeast2(fmtRaw(v), v); // nie nur 1 g.Z. [W18]

const EPS = 1e-9;
const sgn = (x) => (Math.abs(x) < EPS ? 0 : Math.sign(x));
const dirOf = (s) => (s > 0 ? 'in +x-Richtung' : 'in −x-Richtung');

/** Abschnitte eines Akteurs als einfache Beschreibungs-Objekte. */
export function segmentsOf(actor) {
  return actor.pieces.map((p) => ({ dt: p.t1 - p.t0, v0: p.v0[0], a: p.a[0] }));
}

/** Ein Abschnitt als Satzteil. mode "swap" vertauscht schneller/langsamer, "signA" urteilt nur nach dem Vorzeichen von a. */
export function phrase(seg) {
  const { dt, v0, a } = seg;
  const v1 = v0 + a * dt;
  const T = `${fmt(dt)} s`;
  if (sgn(a) === 0) {
    return sgn(v0) === 0 ? `${T} Stillstand` : `${T} gleichförmig mit ${fmt(Math.abs(v0))} m/s ${dirOf(v0)}`;
  }
  const A = `(|aₓ| = ${fmt(Math.abs(a))} m/s²)`;
  if (sgn(v0) === 0) return `${T} aus der Ruhe gleichmäßig beschleunigt ${dirOf(a)} ${A}`;
  if (sgn(v1) !== 0 && sgn(v1) !== sgn(v0) && !seg.mode) {
    return `${T} zuerst langsamer, Umkehr, dann gleichmäßig beschleunigt ${dirOf(a)} ${A}`;
  }
  let speeding = sgn(v0) === sgn(a);
  if (seg.mode === 'signA') speeding = a > 0;
  if (seg.mode === 'swap') speeding = !speeding;
  if (speeding) return `${T} gleichmäßig beschleunigt ${dirOf(v0)} ${A}`;
  return `${T} gleichmäßig verzögert ${dirOf(v0)}${Math.abs(v1) < 1e-6 && !seg.mode ? ' bis zum Stillstand' : ''} ${A}`;
}

const NUM = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧'];
/** Beschreibung als Zeilen, eine pro Abschnitt: "① 4 s gleichförmig …" */
export function describe(segs) {
  const parts = segs.map(phrase);
  return parts.length === 1 ? parts[0] : parts.map((p, i) => `${NUM[i] ?? `${i + 1}.`} ${p}`).join('\n');
}

const firstIdx = (segs, f) => segs.findIndex(f);
const withSeg = (segs, i, patch) => segs.map((s, j) => (j === i ? { ...s, ...patch } : s));

/** Katalog: id -> { make(segs) -> segs | null, text } */
export const DESCRIBE_CATALOG = {
  stillstand: {
    make: (s) => { const i = firstIdx(s, (x) => sgn(x.a) === 0 && sgn(x.v0) !== 0); return i < 0 ? null : withSeg(s, i, { v0: 0 }); },
    text: 'Eine waagrechte Linie im t-vₓ-Diagramm heißt konstante Geschwindigkeit, nicht Stillstand. Stillstand wäre vₓ = 0.',
  },
  signA: {
    // nur bei Bewegung in −x-Richtung führt "aₓ < 0 = bremsen" in die Irre
    make: (s) => (s.some((x) => sgn(x.a) !== 0 && sgn(x.v0) < 0)
      ? s.map((x) => (sgn(x.a) !== 0 && sgn(x.v0) < 0 ? { ...x, mode: 'signA' } : x)) : null),
    text: 'Negative Beschleunigung heißt nicht automatisch Bremsen! Entscheidend ist, ob vₓ und aₓ dasselbe Vorzeichen haben (dann wird der Körper schneller).',
  },
  swap: {
    make: (s) => { const i = firstIdx(s, (x) => sgn(x.a) !== 0 && sgn(x.v0) !== 0); return i < 0 ? null : withSeg(s, i, { mode: 'swap' }); },
    text: 'Beschleunigt und verzögert vertauscht. Schau, ob der Betrag der Geschwindigkeit in diesem Abschnitt zu- oder abnimmt.',
  },
  va: {
    make: (s) => { const i = firstIdx(s, (x) => sgn(x.a) === 0 && sgn(x.v0) !== 0); return i < 0 ? null : withSeg(s, i, { a: s[i].v0, v0: 0, dt: s[i].dt }); },
    text: 'Geschwindigkeit und Beschleunigung verwechselt: Ein konstanter Wert im t-vₓ-Diagramm ist eine konstante Geschwindigkeit, keine Beschleunigung.',
  },
  richtung: {
    make: (s) => (s.some((x) => sgn(x.v0) || sgn(x.a)) ? s.map((x) => ({ ...x, v0: -x.v0, a: -x.a })) : null),
    text: 'Die Richtung stimmt nicht. Positive Werte von vₓ heißen: Bewegung in positive x-Richtung.',
  },
  reihenfolge: {
    make: (s) => (s.length > 1 ? [...s].reverse().map((x) => ({ ...x, v0: x.v0 + x.a * x.dt, a: -x.a })) : null),
    text: 'Die Abschnitte sind in der falschen Reihenfolge. Lies das Diagramm von links nach rechts.',
  },
  werte: {
    make: (s) => { const i = firstIdx(s, (x) => sgn(x.v0) !== 0); return i < 0 ? null : withSeg(s, i, { v0: s[i].v0 * 2, a: s[i].a * 2 }); },
    text: 'Die Art der Bewegung stimmt, aber die Zahlenwerte nicht. Lies die Werte genau an den Achsen ab.',
  },
};
const ORDER = ['signA', 'stillstand', 'swap', 'va', 'richtung', 'reihenfolge', 'werte'];

/** Richtige Beschreibung plus bis zu `count` verschiedene falsche. */
export function makeDescriptions(segs, count = 3, prefer = []) {
  const correct = describe(segs);
  const seen = new Set([correct]);
  const out = [];
  for (const id of [...new Set([...prefer, ...ORDER])]) {
    const d = DESCRIBE_CATALOG[id];
    const s = d?.make(segs);
    if (!s) continue;
    const txt = describe(s);
    if (seen.has(txt)) continue;
    seen.add(txt);
    out.push({ id, text: txt, feedback: d.text });
    if (out.length >= count) break;
  }
  return { correct, distractors: out };
}
