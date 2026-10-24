// Bärtis Aktivitätenwahl [W52]: nie Besuch direkt nach Besuch, lange nicht Gemachtes wird bevorzugt, alle Aktivitäten lauffähig
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chooseActivity } from '../js/ui/baerti-acts.js';

const map = JSON.parse(readFileSync(new URL('../data/map.json', import.meta.url)));
const mk = () => ({ t: 0, map, trees: map.decor.filter((d) => d.type === 'tree'), puddles: [],
  life: { walkers: [{ lane: { a: 0, b: 100, y: 50 }, u: 0.5 }] }, walkerPos: () => ({ x: 50, y: 53 }) });

test('Bärti: nach einem Besuch kommt Beet, Baum oder Schwimmen', () => {
  const b = mk();
  for (let i = 0; i < 3000; i++) {
    const prev = b.lastAct;
    const a = chooseActivity(b);
    b.t += 20;
    if (!a) continue;
    if (prev === 'visit') assert.ok(['bed', 'tree', 'river', 'pond'].includes(a.name), `nach Besuch: ${a.name}`);
    assert.notEqual(a.name, prev, 'nicht zweimal dasselbe hintereinander');
    assert.ok(a.target && Number.isFinite(a.target.x) && Number.isFinite(a.target.y), `${a.name}: Ziel`);
  }
});

test('Bärti: alle neuen Aktivitäten kommen vor und sind gut verteilt', () => {
  const b = mk(), n = {};
  for (let i = 0; i < 4000; i++) { const a = chooseActivity(b); b.t += 20; if (a) n[a.name] = (n[a.name] ?? 0) + 1; }
  for (const k of ['trash', 'dance', 'roll', 'butterfly', 'wiggle', 'tree', 'river', 'visit']) assert.ok(n[k] > 40, `${k}: ${n[k]}`);
  const max = Math.max(...Object.values(n)), min = Math.min(...Object.values(n));
  assert.ok(max / min < 8, `Verteilung ${JSON.stringify(n)}`);
});
