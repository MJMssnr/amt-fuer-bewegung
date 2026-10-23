// Prüft alle Inhalte in data/: Szenarien bauen, Goals lösbar, Verweise gültig.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildWorld } from '../js/engine/kinematics.js';
import { evaluateGoal } from '../js/engine/goals.js';

const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url)));
const tickets = read('data/tickets.json');
const map = read('data/map.json');
const story = read('data/story.json');
const sprites = read('assets/sprites.json').sprites;

for (const tk of tickets) {
  test(`Ticket ${tk.id}`, () => {
    const sc = typeof tk.scenario === 'object' ? tk.scenario : read(`data/scenarios/${tk.scenario}.json`);
    const world = buildWorld(sc);
    assert.ok(map.nodes[tk.node], `Ort "${tk.node}" fehlt in map.json`);
    assert.ok(story.characters[tk.from], `Figur "${tk.from}" fehlt in story.json`);
    for (const r of tk.requires || []) assert.ok(tickets.some((t) => t.id === r), `requires "${r}" unbekannt`);
    for (const [who] of [...(tk.intro || []), ...(tk.success || [])]) assert.ok(story.characters[who], `Sprecher "${who}" fehlt`);
    for (const a of sc.actors) assert.ok(!a.sprite || sprites[a.sprite], `Sprite "${a.sprite}" fehlt`);
    if (tk.task.actor) assert.ok(world.actors.has(tk.task.actor), `Akteur "${tk.task.actor}" fehlt`);
    for (const q of tk.task.questions || []) {
      const v = evaluateGoal(q.goal, world).value;
      assert.ok(Number.isFinite(v), `Frage "${q.label}" liefert keinen Wert`);
    }
  });
}
