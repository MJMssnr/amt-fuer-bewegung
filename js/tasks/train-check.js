// Prüfungen für generierte Trainings-Aufgaben, die Wissen aus den Aufgabenmodulen brauchen [W49].
// js/engine/gen/index.js → generate(type, level, seed, ACCEPT[type]) würfelt neu, wenn eine Prüfung fehlschlägt.

import { buildWorld } from '../engine/kinematics.js';
import { makeDistractors } from './distractors.js';

export const ACCEPT = {
  // A: Es braucht drei verschiedene Fehlvorstellungs-Diagramme (bei t-aₓ manchmal zu wenige)
  match: ({ scenario, task }) => makeDistractors(task.ask, buildWorld(scenario).actors.get(task.actor), 3, []).distractors.length === 3,
};
