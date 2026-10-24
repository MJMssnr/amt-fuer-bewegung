// Bärtis Aktivitäten [W43]: jede liefert ein erreichbares Ziel auf der Karte und gültige Phasen
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chooseActivity } from '../js/ui/baerti-acts.js';

const map = JSON.parse(readFileSync(new URL('../data/map.json', import.meta.url)));
const PHASES = new Set(['up', 'down', 'wait', 'move', 'circle', 'fall', 'call']);

test('Alle Aktivitäten: Ziel in der Karte, bekannte Phasen', () => {
  const b = { map, trees: map.decor.filter((d) => d.type === 'tree'), life: { walkers: [{ lane: { a: 100, b: 200, y: 96 }, u: 0.5 }] },
    walkerPos: (w) => ({ x: w.lane.a + w.u * (w.lane.b - w.lane.a), y: w.lane.y + 3 }), puddles: [], t: 0 };
  const orig = Math.random, seen = new Set();
  try {
    for (let r = 0; r < 100; r += 0.5) {
      let n = 0; Math.random = () => (n++ === 0 ? r / 100 : orig());
      const a = chooseActivity(b);
      Math.random = orig;
      assert.ok(a && a.text, `r=${r}`);
      seen.add(a.text.split(' ')[0] + a.text.length);
      const [W, H] = map.size;
      assert.ok(a.target.x > 0 && a.target.x < W && a.target.y > 0 && a.target.y < H, a.text);
      for (const p of a.seq) assert.ok(PHASES.has(p.s), `${a.text}: ${p.s}`);
      for (const p of a.seq) if (p.s === 'call') p.fn();
    }
  } finally { Math.random = orig; }
  assert.ok(seen.size >= 10, `nur ${seen.size} verschiedene Aktivitäten`);
});
