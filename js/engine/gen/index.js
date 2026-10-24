// Endlos-Generator: Katalog der Trainings-Typen und Erzeugen einer Aufgabe [W47]. Kein DOM.
// Neuer Typ: Generator (level, r) → { scenario, task } schreiben und unten in TRAINING eintragen.

import { rng } from './motion.js';
import { genArea, genSlope } from './kl.js';
import { genCalc } from './h.js';
import { genAvgDist } from './u.js';
import { genMatch, genErrorhunt, genPairs, genAvgTime } from './aerv.js';
import { genConstruct, genFreehand, genLive, genSkid } from './more.js';
import { genFormula, genRiverCalc } from './formulas.js';

export const LEVELS = ['leicht', 'mittel', 'schwer'];

/** Reihenfolge = Reihenfolge im Trainingsmenü. type = Aufgabentyp (js/tasks/types.js) */
export const TRAINING = [
  { type: 'match', gen: genMatch },
  { type: 'errorhunt', gen: genErrorhunt },
  { type: 'calc', gen: genCalc },
  { type: 'area', gen: genArea },
  { type: 'slope', gen: genSlope },
  { type: 'pairs', gen: genPairs },
  { type: 'avgdist', gen: genAvgDist },
  { type: 'avgtime', gen: genAvgTime },
  { type: 'construct', gen: genConstruct },
  { type: 'freehand', gen: genFreehand },
  { type: 'live', gen: genLive },
  { type: 'formula', gen: genFormula },
  { type: 'skid', gen: genSkid },
  { type: 'river', gen: genRiverCalc }, // W als Rechenvariante (Aufgabentyp formula mit Flussbild)
];

/** Aufgabe erzeugen: { ticket, scenario }. Gleicher Seed → gleiche Aufgabe. */
// accept (optional): Prüfung aus der Aufgaben-Schicht (js/tasks/train-check.js), z. B. „genug Distraktoren“.
// Passt eine Aufgabe nicht, wird mit verschobenem Seed neu gewürfelt (reproduzierbar).
export function generate(type, level, seed, accept = null) {
  const entry = TRAINING.find((e) => e.type === type);
  if (!entry) throw new Error(`Kein Generator für ${type}`);
  let res;
  for (let k = 0; k < 40; k++) {
    res = entry.gen(level, rng(seed + k * 7919));
    if (!accept || accept(res)) break;
  }
  const { scenario, task } = res;
  const ticket = { id: `train-${type}-${level}-${seed}`, title: 'Training', from: null, reward: 0, difficulty: level, scenario, task, training: true, badgeType: type };
  return { ticket, scenario };
}
