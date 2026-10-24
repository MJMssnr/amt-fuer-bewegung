// Bärtis Aktivitäten auf der Karte [W42, W43]. Jede Aktivität: Ziel (mit Wegpunkten) + Folge von Phasen,
// die BaertiMap abspielt. Phasen:
//   { s:'up', to, rate }        hochklettern (Höhe über dem Boden)      { s:'down', rate }  runterklettern
//   { s:'wait', d, pose, fx }   warten; pose: sit|stand|hop|lie|swim|cling (hängt am Mast), fx: z|look|dig|worm|splash|pee|cookie|fish|fishing|dizzy|oops|proud
//   { s:'move', x, y, rate, swim }  gleiten (z. B. ins Wasser)        { s:'circle', cx, cy, rx, ry, d }  im Teich kreisen
//   { s:'fall', dx }            vom Windrad springen (Schwerkraft, Drehung, landet liegend)
//   { s:'call', fn }            einmalige Wirkung (Fahrrad umwerfen …)
// Alles nur Spielfreude, nichts davon steht im Spielstand.

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export const RIVER = { bank: 664, swim: 688, top: 40, bot: 330 };
const PARK_GATE = [{ x: 231, y: 98 }, { x: 231, y: 62 }];           // Parkeingang zwischen den Hecken
const POND = { cx: 178, cy: 36, bank: { x: 178, y: 54 } };
const FOUNTAIN = { x: 230, y: 42 };
const BEDS = [{ x: 178, y: 76 }, { x: 280, y: 76 }, { x: 280, y: 22 }];
const GRASS = [[60, 120], [140, 150], [250, 190], [400, 150], [480, 180], [600, 120], [180, 270], [420, 280], [600, 260], [60, 250], [240, 120]];
// Gebäude zum Hochklettern: Knoten, Versatz zur Kletterkante, Dachhöhe
const ROOFS = [['supermarkt', 52, 41], ['schule', -46, 45], ['fotolabor', 22, 37], ['polizei', 18, 39], ['rathaus', 42, 49], ['werkstatt', 16, 35]];

// Mülltonnen in der Stadt [W52]: Knoten + Versatz an der Gebäudekante (gezeichnet in baerti-map.js)
export const BINS = [['supermarkt', 60, 4], ['baeckerei', 22, 4], ['schule', -54, 4], ['rathaus', 50, 4]];

// Grundgewichte; tatsächliches Gewicht wächst mit der Zeit seit dem letzten Mal (lange nicht gemacht → bevorzugt) [W52]
const ACTS = { visit: 9, tree: 12, roof: 8, river: 10, pond: 8, fountain: 7, bed: 8, pee: 4, bike: 5, windmill: 5, grass: 4,
  trash: 8, dance: 6, roll: 5, butterfly: 6, wiggle: 5 };
const AFTER_VISIT = ['bed', 'tree', 'river', 'pond']; // nach Besuch + Keks: erst Beet, Baum (Schlafen), Schwimmen

/** Liefert { name, text, target, via, seq } oder null (dann nimmt BaertiMap etwas anderes) */
export function chooseActivity(b) {
  b.lastDone ??= {};
  const names = b.lastAct === 'visit' ? AFTER_VISIT : Object.keys(ACTS).filter((n) => n !== b.lastAct);
  const w = names.map((n) => ACTS[n] * Math.min(4, 0.25 + (b.t - (b.lastDone[n] ?? -240)) / 80));
  let r = Math.random() * w.reduce((x, y) => x + y, 0);
  for (let i = 0; i < names.length; i++) {
    r -= w[i];
    if (r <= 0) {
      const a = FN[names[i]](b);
      if (a) { a.name = names[i]; b.lastAct = names[i]; b.lastDone[names[i]] = b.t; }
      return a;
    }
  }
  return grass(b);
}

function visit(b) {
  const w = b.life?.walkers ?? [];
  if (!w.length) return null;
  const p = pick(w);
  return { text: 'besucht jemanden', target: b.walkerPos(p), visit: p, seq: [] };
}

function tree(b) {
  const tr = pick(b.trees);
  const sleep = Math.random() < 0.55;
  return {
    text: sleep ? 'macht ein Nickerchen im Baum' : 'klettert auf einen Baum', target: { x: tr.x + 4, y: tr.y + 2 },
    seq: [{ s: 'up', to: 18, rate: 14 }, sleep ? { s: 'wait', d: rnd(6, 10), pose: 'sit', fx: 'z' } : { s: 'wait', d: rnd(2.5, 4), pose: 'sit', fx: 'look' }, { s: 'down', rate: 20 }],
  };
}

function roof(b) {
  const [id, dx, h] = pick(ROOFS), n = b.map.nodes[id];
  const [cx, by] = n.at ?? [n.x, n.y - 13];
  return {
    text: 'klettert aufs Dach', target: { x: cx + dx, y: by + 2 },
    seq: [{ s: 'up', to: h, rate: 16 }, { s: 'wait', d: rnd(3, 5), pose: 'sit', fx: 'look' }, { s: 'down', rate: 22 }],
  };
}

function river(b) {
  const y = rnd(RIVER.top, RIVER.bot);
  if (Math.random() < 0.5) {
    return {
      text: 'geht im Fluss schwimmen', target: { x: RIVER.bank, y },
      seq: [{ s: 'move', x: RIVER.swim, y, rate: 14, swim: true }, { s: 'move', x: RIVER.swim, y: Math.min(RIVER.bot, y + rnd(15, 30)), rate: 5, swim: true }, { s: 'move', x: RIVER.bank, y: null, rate: 14, swim: true }, { s: 'wait', d: 1.5, pose: 'sit', fx: 'shake' }],
    };
  }
  return { text: 'angelt sich einen Fisch', target: { x: RIVER.bank, y }, seq: [{ s: 'wait', d: rnd(3, 5), pose: 'sit', fx: 'fishing' }, { s: 'wait', d: 3, pose: 'sit', fx: 'fish' }] };
}

function pond() {
  return {
    text: 'schwimmt im Teich', target: POND.bank, via: PARK_GATE,
    seq: [{ s: 'move', x: POND.cx, y: POND.cy + 7, rate: 12, swim: true }, { s: 'circle', cx: POND.cx, cy: POND.cy, rx: 11, ry: 6, d: rnd(6, 9) }, { s: 'move', x: POND.bank.x, y: POND.bank.y, rate: 12, swim: true }, { s: 'wait', d: 1.5, pose: 'sit', fx: 'shake' }],
  };
}

function fountain() {
  return {
    text: 'spielt am Brunnen', target: { x: FOUNTAIN.x + 11, y: FOUNTAIN.y + 6 }, via: PARK_GATE,
    seq: [{ s: 'wait', d: rnd(4, 6), pose: 'hop', fx: 'splash' }, { s: 'wait', d: 1.2, pose: 'sit', fx: 'shake' }],
  };
}

function bed() {
  const p = pick(BEDS);
  return {
    text: 'wühlt im Blumenbeet', target: { x: p.x + rnd(-10, 10), y: p.y }, via: PARK_GATE,
    seq: [{ s: 'wait', d: rnd(3, 4.5), pose: 'stand', fx: 'dig' }, { s: 'wait', d: 2.5, pose: 'sit', fx: 'worm' }],
  };
}

function pee(b) {
  const n = b.map.nodes.polizei, [cx, by] = n.at;
  return {
    text: 'markiert das Polizeirevier', target: { x: cx + 33, y: by + 1 },
    seq: [{ s: 'call', fn: () => { b.flip = false; } }, { s: 'wait', d: 2.2, pose: 'stand', fx: 'pee' }, { s: 'call', fn: () => b.puddles.push({ x: cx + 26, y: by + 2, t0: b.t }) }, { s: 'wait', d: 1.2, pose: 'sit', fx: 'proud' }],
  };
}

function bike(b) {
  const n = b.map.nodes.schule, [cx, by] = n.at; // Fahrradständer rechts neben der Schule (school.js)
  const bx = cx - 56 + 112 + 10;
  return {
    text: 'stößt ein Fahrrad um', target: { x: bx - 12, y: by + 1 },
    seq: [
      { s: 'call', fn: () => { b.flip = false; } }, { s: 'wait', d: 0.8, pose: 'stand', fx: 'look' },
      { s: 'call', fn: () => { n.bikeDown = true; } }, { s: 'wait', d: 1.4, pose: 'sit', fx: 'oops' },
      { s: 'wait', d: 1.2, pose: 'hop' }, { s: 'call', fn: () => { n.bikeDown = false; } }, { s: 'wait', d: 1.5, pose: 'sit', fx: 'proud' },
    ],
  };
}

function windmill(b) {
  const m = pick(b.map.decor.filter((d) => d.type === 'windmill'));
  const h = m.h ?? 46;
  return {
    text: 'klettert aufs Windrad', target: { x: m.x, y: m.y + 1 },
    seq: [{ s: 'up', to: h * 0.55, rate: 12 }, { s: 'wait', d: 1.8, pose: 'cling', fx: 'oops' }, { s: 'fall', dx: m.x < 40 ? 14 : -14 }, { s: 'wait', d: 1.8, pose: 'lie', fx: 'dizzy' }, { s: 'wait', d: 0.8, pose: 'sit', fx: 'shake' }],
  };
}

function grass() {
  const g = pick(GRASS);
  return { text: 'macht Pause auf der Wiese', target: { x: g[0] + rnd(-8, 8), y: g[1] + rnd(-6, 6) }, seq: [{ s: 'wait', d: rnd(2, 4), pose: 'sit' }] };
}

function trash(b) { // in einer Mülltonne wühlen: Deckel hoch, Zeug fliegt, Bananenschale als Beute
  const [id, dx, dy] = pick(BINS), n = b.map.nodes[id];
  if (!n) return null;
  const [cx, by] = n.at ?? [n.x, n.y - 13], bin = { x: cx + dx, y: by + dy };
  return {
    text: 'wühlt in einer Mülltonne', target: { x: bin.x - 6, y: bin.y },
    seq: [{ s: 'call', fn: () => { b.flip = false; b.binOpen = bin; } }, { s: 'wait', d: 0.6, pose: 'stand', fx: 'look' },
      { s: 'wait', d: rnd(3, 4.5), pose: 'stand', fx: 'trash' }, { s: 'call', fn: () => { b.binOpen = null; } },
      { s: 'wait', d: 2.2, pose: 'sit', fx: 'banana' }],
  };
}

function dance() { // hat seine „5 Minuten“: Freudensprünge und Herzchen/Noten
  const g = pick(GRASS);
  return { text: 'tanzt vor Freude', target: { x: g[0] + rnd(-8, 8), y: g[1] + rnd(-6, 6) },
    seq: [{ s: 'wait', d: rnd(3, 4.5), pose: 'hop', fx: 'joy' }, { s: 'spin', d: 1.2 }, { s: 'wait', d: 1, pose: 'sit', fx: 'proud' }] };
}

function roll() { // kugelt sich ein und rollt ein Stück
  const g = pick(GRASS), dir = Math.random() < 0.5 ? -1 : 1, x = g[0] + rnd(-6, 6), y = g[1] + rnd(-4, 4);
  return { text: 'kugelt sich ein und rollt', target: { x, y },
    seq: [{ s: 'wait', d: 0.8, pose: 'sit' }, { s: 'move', x: x + dir * 34, y, rate: 26, roll: true }, { s: 'wait', d: 1.4, pose: 'sit', fx: 'dizzy' }] };
}

function butterfly() { // bleibt stehen, lauert, springt nach einem Schmetterling – und verfehlt ihn
  const g = pick(GRASS), dir = Math.random() < 0.5 ? -1 : 1, x = g[0] + rnd(-8, 8), y = g[1] + rnd(-4, 4);
  return { text: 'jagt einen Schmetterling', target: { x, y },
    seq: [{ s: 'call', fn: (bb) => { bb.flip = dir < 0; } }, { s: 'wait', d: rnd(1.5, 2.5), pose: 'stand', fx: 'butterfly' },
      { s: 'pounce', dx: dir * 16, d: 0.55 }, { s: 'wait', d: 1.6, pose: 'sit', fx: 'flyaway' }] };
}

function wiggle() { // wirft sich auf den Rücken und strampelt wie eine glückliche Katze
  const g = pick(GRASS);
  return { text: 'strampelt auf dem Rücken', target: { x: g[0] + rnd(-8, 8), y: g[1] + rnd(-6, 6) },
    seq: [{ s: 'wait', d: 0.5, pose: 'sit' }, { s: 'wait', d: rnd(3, 4.5), pose: 'back', fx: 'hearts' }, { s: 'wait', d: 0.8, pose: 'sit', fx: 'shake' }] };
}

const FN = { visit, tree, roof, river, pond, fountain, bed, pee, bike, windmill, grass, trash, dance, roll, butterfly, wiggle };
