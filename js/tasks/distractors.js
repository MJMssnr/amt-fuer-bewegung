// Distraktoren aus typischen Fehlvorstellungen. Jeder Distraktor ist eine Diagramm-Serie
// plus Kennung (id) und Rückmeldetext. Neue Fehlvorstellungen: Eintrag in CATALOG ergänzen.

import { series } from '../engine/kinematics.js';
import { KINDS } from '../render/graph.js';

const mapY = (pieces, f) => pieces.map((pc) => pc.map(([t, y]) => [t, f(y, t)]));
const NEIGHBOR_UP = { xt: 'vt', vt: 'at', at: 'vt', yt: 'vyt', vyt: 'ayt', ayt: 'vyt' };
const NEIGHBOR_DOWN = { xt: 'vt', vt: 'xt', at: 'vt', yt: 'vyt', vyt: 'yt', ayt: 'vyt' };
const name = (k) => `${KINDS[k].title}s`; // Genitiv: "des t-x-Diagramms"

/** Bewegung ohne Beschleunigung: jeder beschleunigte Abschnitt mit seiner Durchschnittsgeschwindigkeit. */
function linearized(actor, q) {
  return actor.pieces.map((p) => {
    const k = q === 'y' ? 1 : 0;
    const x0 = p.r0[k];
    const dt = p.t1 - p.t0;
    const x1 = x0 + p.v0[k] * dt + 0.5 * p.a[k] * dt * dt;
    return [[p.t0, x0], [p.t1, x1]];
  });
}

export const CATALOG = {
  form: {
    applies: (ask, actor) => (ask === 'xt' || ask === 'yt') && actor.pieces.some((p) => Math.abs(p.a[0]) + Math.abs(p.a[1]) > 1e-9),
    make: (ask, actor) => linearized(actor, KINDS[ask].q),
    text: () => 'Geraden statt Parabeln! Bei beschleunigter Bewegung ändert sich die Steigung im t-x-Diagramm ständig, die Kurve ist gekrümmt.',
  },
  abgeschrieben: {
    applies: () => true,
    make: (ask, actor) => series(actor, KINDS[NEIGHBOR_DOWN[ask]].q),
    text: (ask) => {
      const src = NEIGHBOR_DOWN[ask];
      if (ask === 'xt' || ask === 'yt') return `Das ist das ${KINDS[src].title}, nur umbeschriftet. Den Ort bekommst du aus der Fläche unter der t-v-Kurve, nicht aus ihrer Form.`;
      return `Das ist die Form des ${name(src)}, nur umbeschriftet. Gesucht ist die Steigung dieses Diagramms, nicht sein Wert.`;
    },
  },
  vorzeichen: {
    applies: () => true,
    make: (ask, actor) => {
      const s = series(actor, KINDS[ask].q);
      if (ask === 'xt' || ask === 'yt') { const y0 = s[0][0][1]; return mapY(s, (y) => 2 * y0 - y); }
      return mapY(s, (y) => -y);
    },
    text: () => 'Vorzeichen vertauscht: Hier zeigt die Bewegung in die falsche Richtung. Positiv heißt: in Richtung der x-Achse.',
  },
  zeitumkehr: {
    applies: () => true,
    make: (ask, actor) => {
      const T = actor.tEnd;
      const s = series(actor, KINDS[ask].q);
      return s.map((pc) => pc.map(([t, y]) => [T - t, y]).reverse()).reverse();
    },
    text: () => 'Die Abschnitte sind in der falschen Reihenfolge. Das Diagramm liest man von links nach rechts, also zeitlich von vorne nach hinten.',
  },
  betrag: {
    applies: () => true,
    make: (ask, actor) => {
      const s = series(actor, KINDS[ask].q);
      const y0 = s[0][0][1];
      return ask === 'xt' || ask === 'yt' ? mapY(s, (y) => y0 + 2 * (y - y0)) : mapY(s, (y) => 2 * y);
    },
    text: () => 'Die Form passt, aber die Werte nicht. Schau genau auf die Achsenbeschriftung und rechne nach.',
  },
  stufe: {
    applies: (ask) => NEIGHBOR_UP[ask] !== NEIGHBOR_DOWN[ask],
    make: (ask, actor) => series(actor, KINDS[NEIGHBOR_UP[ask]].q),
    text: (ask) => `Das ist die Form des ${name(NEIGHBOR_UP[ask])}. Da bist du eine Ableitung zu weit gegangen.`,
  },
};

const PRIORITY = {
  xt: ['form', 'abgeschrieben', 'vorzeichen', 'zeitumkehr', 'betrag'],
  yt: ['form', 'abgeschrieben', 'vorzeichen', 'zeitumkehr', 'betrag'],
  vt: ['abgeschrieben', 'vorzeichen', 'zeitumkehr', 'stufe', 'betrag'],
  vyt: ['abgeschrieben', 'vorzeichen', 'zeitumkehr', 'stufe', 'betrag'],
  at: ['abgeschrieben', 'vorzeichen', 'zeitumkehr', 'betrag'],
  ayt: ['abgeschrieben', 'vorzeichen', 'zeitumkehr', 'betrag'],
};

/** Fingerabdruck einer Serie zum Erkennen gleicher Diagramme. */
function signature(pieces, T) {
  const vals = [];
  for (let i = 0; i <= 40; i++) {
    const t = (T * i) / 40;
    let v = null;
    for (const pc of pieces) {
      if (t >= pc[0][0] - 1e-9 && t <= pc[pc.length - 1][0] + 1e-9) {
        for (let j = 0; j < pc.length - 1; j++) {
          const [t0, y0] = pc[j], [t1, y1] = pc[j + 1];
          if (t <= t1 + 1e-9) { v = y0 + ((y1 - y0) * (t - t0)) / (t1 - t0 || 1); break; }
        }
        if (v !== null) break;
      }
    }
    vals.push(v ?? 0);
  }
  return vals;
}
const same = (a, b) => {
  const scale = Math.max(1e-6, ...a.map(Math.abs), ...b.map(Math.abs));
  return a.every((v, i) => Math.abs(v - b[i]) / scale < 0.02);
};

/** Liefert bis zu `count` verschiedene Distraktoren für das gefragte Diagramm. */
export function makeDistractors(ask, actor, count = 3, prefer = []) {
  const correct = series(actor, KINDS[ask].q);
  const sigs = [signature(correct, actor.tEnd)];
  const order = [...new Set([...prefer, ...PRIORITY[ask]])];
  const out = [];
  for (const id of order) {
    const d = CATALOG[id];
    if (!d || !d.applies(ask, actor)) continue;
    const pieces = d.make(ask, actor);
    const sig = signature(pieces, actor.tEnd);
    if (sigs.some((s) => same(s, sig))) continue;
    sigs.push(sig);
    out.push({ id, pieces, feedback: d.text(ask) });
    if (out.length >= count) break;
  }
  return { correct, distractors: out };
}
