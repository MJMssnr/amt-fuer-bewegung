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

import { faultySeries } from '../js/tasks/errorhunt.js';

function checkTask(task, world, label) {
  const actorId = task.actor ?? [...world.actors.keys()][0];
  const actor = world.actors.get(actorId);
  assert.ok(actor, `${label}: Akteur "${actorId}" fehlt`);
  if (task.type === 'errorhunt') {
    assert.ok(task.error && task.error.segment < actor.pieces.length, `${label}: error.segment ungültig`);
    const bad = faultySeries(actor, task.graph ?? 'xt', task.error);
    assert.ok(bad.length === actor.pieces.length, `${label}: fehlerhafte Serie unvollständig`);
  }
  if (task.type === 'live') assert.ok(actor.pieces.every((p) => Math.abs(p.a[0]) < 1e-9), `${label}: Live-Aufgaben nur mit gleichförmigen Abschnitten`);
  for (const q of task.questions || []) assert.ok(Number.isFinite(evaluateGoal(q.goal, world).value), `${label}: "${q.label}" ohne Wert`);
}

for (const tk of tickets) {
  test(`Aufgabe ${tk.id} (${tk.task.type})`, () => {
    const sc = typeof tk.scenario === 'object' ? tk.scenario : read(`data/scenarios/${tk.scenario}.json`);
    checkTask(tk.task, buildWorld(sc), tk.id);
  });
}

test('Abschlussprüfung', () => {
  const exam = read('data/exam.json');
  const world = buildWorld(read(`data/scenarios/${exam.scenario}.json`));
  exam.parts.forEach((p, i) => checkTask(p.task, world, `Prüfung ${i + 1}`));
  assert.ok(exam.passNeeded <= exam.parts.length);
});

test('Shop: jeder Gegenstand hat einen Platz im Zimmer', async () => {
  const { SLOTS } = await import('../js/render/room-art.js');
  const shop = read('data/shop.json');
  for (const it of shop.items) assert.ok(SLOTS[it.id], `Kein Platz für "${it.id}"`);
  const earn = tickets.reduce((a, t) => a + t.reward, 0);
  const cost = [...shop.items, ...shop.rocketParts].reduce((a, i) => a + i.price, 0);
  assert.ok(cost <= earn, `Shop (${cost} €) teurer als alle Aufträge zusammen (${earn} €)`);
});
