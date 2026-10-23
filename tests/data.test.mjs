// Prüft alle Inhalte in data/: Szenarien bauen, Goals lösbar, Verweise gültig.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildWorld } from '../js/engine/kinematics.js';
import { evaluateGoal } from '../js/engine/goals.js';
import { resolveTicket, applyScenario } from '../js/engine/variants.js';

const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url)));
const tickets = read('data/tickets.json');
const map = read('data/map.json');
const story = read('data/story.json');
const sprites = read('assets/sprites.json').sprites;

for (const tk of tickets) {
  test(`Ticket ${tk.id}`, () => {
    if (!tk.scenario) { // Stroboskop: Bewegung im Ticket
      assert.ok(tk.task.motion && tk.task.flash, `${tk.id}: ohne Szenario braucht es task.motion und task.flash`);
      assert.ok(map.nodes[tk.node] && story.characters[tk.from]);
      return;
    }
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

for (const tk0 of tickets) {
  test(`Aufgabe ${tk0.id} (${tk0.task.type}), alle Varianten`, async () => {
    if (!tk0.scenario) return checkStrobeTask(tk0);
    for (const params of tk0.vary?.options ?? [{}]) {
      const tk = resolveTicket(tk0, params);
      const sc0 = typeof tk0.scenario === 'object' ? tk0.scenario : read(`data/scenarios/${tk0.scenario}.json`);
      checkTask(tk.task, buildWorld(applyScenario(sc0, tk0, params)), `${tk0.id} ${JSON.stringify(params)}`);
      assert.ok(!/"[^"]*\{[\w\s+\-*/().,]+\}[^"]*"/.test(JSON.stringify(tk)), `${tk0.id}: Platzhalter nicht ersetzt`);
    }
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

import { constructTruth } from '../js/tasks/construct.js';

test('Konstrukteur: Lösungen der Hausaufgaben', () => {
  const sc = read('data/scenarios/einkaufswagen.json');
  const tr = constructTruth(buildWorld(sc).actors.get('cart'), 'xt');
  assert.deepEqual(tr.shapes, ['down', 'line', 'up']);
  assert.deepEqual(tr.values.map((v) => Math.round(v * 100) / 100), [12, 8, 2, 1]);
  const bus = constructTruth(buildWorld(read('data/scenarios/bus-anfahren.json')).actors.get('bus'), 'xt');
  assert.deepEqual(bus.values.map((v) => Math.round(v * 10) / 10), [0, 27, 117, 130.5]);
});

test('Jeder Aufgabentyp hat einen Kennbuchstaben; Buchstaben eindeutig', async () => {
  const { TYPES } = await import('../js/tasks/types.js');
  for (const tk of tickets) assert.ok(TYPES[tk.task.type], `Typ "${tk.task.type}" (${tk.id}) ohne Buchstabe in types.js`);
  const letters = Object.values(TYPES).map((t) => t.letter);
  assert.equal(new Set(letters).size, letters.length);
});

test('Freischaltplan: keine Zyklen, alles erreichbar', () => {
  const done = new Set();
  let changed = true;
  while (changed) {
    changed = false;
    for (const t of tickets) if (!done.has(t.id) && (t.requires || []).every((r) => done.has(r))) { done.add(t.id); changed = true; }
  }
  assert.equal(done.size, tickets.length, `unerreichbar: ${tickets.filter((t) => !done.has(t.id)).map((t) => t.id)}`);
});

// Stroboskop-Aufträge (M, N, O): Bewegung rechenbar, genau eine richtige Antwort, Fragen lösbar [W22]
async function checkStrobeTask(tk) {
  const { strobePositions, strobeSpeed, strobeAccel } = await import('../js/engine/strobe.js');
  const pos = strobePositions(tk.task.motion, tk.task.flash);
  assert.equal(pos.length, tk.task.flash.n);
  assert.ok(pos.every((p) => Number.isFinite(p.x)), `${tk.id}: Orte nicht berechenbar`);
  if (tk.task.type === 'strobedescribe') assert.equal(tk.task.choices.filter((c) => c.correct).length, 1, `${tk.id}: genau eine richtige Antwort`);
  if (tk.task.type === 'strobecalc') {
    for (const q of tk.task.questions) {
      const v = strobeSpeed(pos, q.i ?? 0, q.j ?? pos.length - 1);
      const truth = { v, kmh: v * 3.6, a: q.ask === 'a' ? strobeAccel(pos, q.i ?? 0) : NaN }[q.ask ?? 'v'];
      assert.ok(Number.isFinite(truth), `${tk.id}: ${q.label}`);
      if (q.range) assert.ok(truth >= q.range[0] && truth <= q.range[1], `${tk.id}: ${q.label} ${truth} außerhalb von range`);
    }
  }
}
