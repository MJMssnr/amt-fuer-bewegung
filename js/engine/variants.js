// Zufallsvarianten für Aufträge: jeder Spieler bekommt andere (aber "schöne") Zahlen.
//
// Im Ticket:
// "vary": {
//   "options": [ { "va": 5, "vb": 7.5 }, { "va": 4, "vb": 6 } ],          // mögliche Zahlensätze
//   "set": { "actors.anna.segments.0.v": "va", "actors.bernd.segments.0.v": "-vb" }  // Szenario-Pfad -> Ausdruck
// }
// In allen Texten des Tickets werden {Ausdrücke} ersetzt, z. B. "{3000/(va+vb)} s" oder "{v*3.6} km/h".
// Ein String, der nur aus einem Ausdruck besteht (z. B. "value": "{3000/va}"), wird zur Zahl.

import { fmt } from '../render/format.js';
import { atLeast2 } from './sigfig.js';

const SAFE = /^[\d\s+\-*/().,a-zA-Z_]*$/;
const MATH = ['abs', 'sqrt', 'round', 'min', 'max', 'PI'];

/** Ausdruck mit den Parametern auswerten (nur Zahlen, Rechenzeichen und Parameternamen erlaubt). */
export function evalExpr(expr, params) {
  if (!SAFE.test(expr)) throw new Error(`Unzulässiger Ausdruck: ${expr}`);
  const names = Object.keys(params);
  for (const id of expr.match(/[a-zA-Z_]\w*/g) || []) {
    if (!names.includes(id) && !MATH.includes(id)) throw new Error(`Unbekannter Name "${id}" in {${expr}}`);
  }
  // eslint-disable-next-line no-new-func
  const f = new Function(...names, ...MATH, `return (${expr});`);
  return f(...names.map((n) => params[n]), ...MATH.map((m) => Math[m]));
}

/** Deterministischer Index aus Seed und Text. */
function pickIndex(seed, key, n) {
  let h = (seed ^ 0x9e3779b9) >>> 0;
  for (const ch of key) h = Math.imul(h ^ ch.charCodeAt(0), 2654435761) >>> 0;
  // murmur3-Endmischung, damit auch kurze Schlüssel gut streuen
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h % n;
}

/** Zahlensatz für dieses Ticket (Seed des Spielers + Anzahl Wiederholungen). */
export function pickParams(ticket, seed = 0, round = 0) {
  const opts = ticket.vary?.options;
  if (!opts?.length) return {};
  return { ...opts[pickIndex(seed + round * 7919, ticket.id, opts.length)] };
}

function templ(value, params) {
  if (typeof value === 'string') {
    const whole = value.match(/^\{([^{}]+)\}$/);
    if (whole) return evalExpr(whole[1], params);
    return value.replace(/\{([^{}]+)\}/g, (_, e) => {
      const r = evalExpr(e, params);
      return typeof r === 'number' ? atLeast2(fmt(r), r) : String(r); // Florian: nie nur 1 g.Z.
    });
  }
  if (Array.isArray(value)) return value.map((v) => templ(v, params));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = k === 'vary' ? v : templ(v, params);
    return out;
  }
  return value;
}

/** Ticket mit eingesetzten Zahlen (Texte, Hinweise). Ohne "vary" unverändert. */
export function resolveTicket(ticket, params) {
  if (!ticket.vary) return ticket;
  return templ(ticket, params);
}

/** Szenario-Kopie mit eingesetzten Zahlen. Pfade wie "actors.<id>.segments.0.v". */
export function applyScenario(scenario, ticket, params) {
  const set = ticket.vary?.set;
  if (!set) return scenario;
  const sc = structuredClone(scenario);
  for (const [path, expr] of Object.entries(set)) {
    const keys = path.split('.');
    let o = sc;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (i === 1 && keys[0] === 'actors') o = o.find((a) => a.id === k);
      else o = o[Array.isArray(o) ? Number(k) : k];
      if (o === undefined) throw new Error(`Pfad "${path}" ungültig`);
    }
    o[keys[keys.length - 1]] = evalExpr(String(expr), params);
  }
  return sc;
}
