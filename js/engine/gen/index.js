// Endlos-Generator: Katalog der Trainings-Typen und Erzeugen einer Aufgabe [W47]. Kein DOM.
// Neuer Typ: Generator (level, r) → { scenario, task } schreiben und unten in TRAINING eintragen.

import { rng } from './motion.js';
import { genArea, genSlope } from './kl.js';

export const LEVELS = ['leicht', 'mittel', 'schwer'];

/** Reihenfolge = Reihenfolge im Trainingsmenü. type = Aufgabentyp (js/tasks/types.js) */
export const TRAINING = [
  { type: 'area', gen: genArea },
  { type: 'slope', gen: genSlope },
];

/** Aufgabe erzeugen: { ticket, scenario }. Gleicher Seed → gleiche Aufgabe. */
export function generate(type, level, seed) {
  const entry = TRAINING.find((e) => e.type === type);
  if (!entry) throw new Error(`Kein Generator für ${type}`);
  const { scenario, task } = entry.gen(level, rng(seed));
  const ticket = { id: `train-${type}-${level}-${seed}`, title: 'Training', from: null, reward: 0, difficulty: level, scenario, task, training: true };
  return { ticket, scenario };
}
