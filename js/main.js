// Einstieg: Demo-Hinweis -> Startbildschirm -> Stadtkarte. Verbindet Karte, Aufträge, Baumhaus und Prüfung.

import { loadSprites } from './render/pixel.js';
import { buildWorld } from './engine/kinematics.js';
import { Overworld } from './ui/overworld.js';
import { showDialog, setCharacters, toast } from './ui/dialog.js';
import { loadState, saveState, resetState } from './ui/state.js';
import { showNotice, showTitle } from './ui/title.js';
import { Room } from './ui/room.js';
import { playFinale } from './ui/finale.js';
import { loadTask } from './tasks/index.js';
import { pickParams, resolveTicket, applyScenario } from './engine/variants.js';

const getJSON = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.json();
};

let state = loadState();
let tickets = [], story = {}, shop = {}, exam = {}, overworld = null, room = null, busy = false;
const scenarioCache = new Map();

async function scenarioOf(ref) {
  if (typeof ref === 'object') return ref;
  if (!scenarioCache.has(ref)) scenarioCache.set(ref, await getJSON(`data/scenarios/${ref}.json`));
  return scenarioCache.get(ref);
}

const doneCount = () => tickets.filter((t) => state.done[t.id]).length;
// Nachfrage: verpatzter Auftrag kommt zurück, sobald zwei weitere erledigt sind (mit neuen Zahlen, falls "vary")
const isRegularOpen = (t) => !state.done[t.id] && (t.requires || []).every((r) => state.done[r]);
// …oder sofort, wenn es keine regulären Aufträge mehr gibt
const isRetry = (t) => Boolean(state.retry?.[t.id])
  && (doneCount() >= state.retry[t.id].after || !tickets.some(isRegularOpen));
const isOpen = (t) => isRegularOpen(t) || isRetry(t);
const crateFull = () => shop.rocketParts.every((p) => state.items[p.id]);

function markers() {
  const m = {};
  for (const t of tickets) {
    if (isOpen(t)) m[t.node] = 'open';
    else if (state.done[t.id] && m[t.node] !== 'open') m[t.node] = 'done';
  }
  if (crateFull() && !state.examPassed) m.baumhaus = 'open';
  return m;
}

function updateHud() {
  document.querySelector('.hud-money').textContent = `${state.money} €`;
  const n = tickets.filter((t) => state.done[t.id]).length;
  document.querySelector('.hud-tickets').textContent = `Aufträge ${n}/${tickets.length}`;
  document.querySelector('.map-hint')?.classList.toggle('hidden', n > 0);
}
const save = () => { saveState(state); updateHud(); };

/** Zeigt den Aufgabenbildschirm und liefert { grade, attempts } oder null (abgebrochen). */
async function runTaskScreen({ title, fromName, rewardText, ticket, world }) {
  const screen = document.getElementById('task');
  const mod = await loadTask(ticket.task.type);
  screen.querySelector('.t-title').textContent = title;
  screen.querySelector('.t-from').textContent = fromName ?? '';
  screen.querySelector('.t-reward').textContent = rewardText ?? '';
  screen.querySelector('.t-reward').classList.toggle('hidden', !rewardText);
  const root = screen.querySelector('.task-root');
  screen.classList.remove('hidden');
  overworld.stop();
  const result = await new Promise((resolve) => {
    const inst = mod.mount(root, { ticket, world, onSolved: (r) => { inst.destroy(); resolve(r); } });
    screen.querySelector('.t-back').onclick = () => { inst.destroy(); resolve(null); };
  });
  screen.classList.add('hidden');
  root.innerHTML = '';
  overworld.start();
  return result;
}

/** Story-Zeilen mit Platzhalter $from für die Auftraggeberin/den Auftraggeber */
const pick = (variants, key) => variants[[...key].reduce((h, ch) => h + ch.charCodeAt(0), 0) % variants.length];
const withFrom = (lines, from) => lines.map(([who, txt]) => [who === '$from' ? from : who, txt]);

async function runTicket(ticket, raw, params) {
  const world = buildWorld(applyScenario(await scenarioOf(raw.scenario), raw, params));
  const result = await runTaskScreen({
    title: ticket.title, fromName: story.characters[ticket.from]?.name, rewardText: `${ticket.reward} €`, ticket, world,
  });
  if (!result) return;
  const grade = result.grade ?? (result.attempts <= 1 ? 'perfect' : 'fail');
  const reward = grade === 'perfect' ? ticket.reward : grade === 'partial' ? Math.ceil(ticket.reward / 2) : 0;
  state.money += reward;
  state.done[ticket.id] = true;
  state.grades = { ...(state.grades || {}), [ticket.id]: grade };
  state.retry ??= {};
  if (grade === 'fail') state.retry[ticket.id] = { after: doneCount() + 2, n: (state.retry[ticket.id]?.n ?? 0) + 1 };
  else delete state.retry[ticket.id];
  save();
  if (grade === 'fail') {
    const florianLines = (ticket.success || []).filter(([who]) => who === 'florian');
    await showDialog([...withFrom(pick(story.fail, ticket.id), ticket.from), ...(florianLines.length ? [story.failExplain, ...florianLines] : [])]);
    toast('0 € – diesmal leider nichts', 'bad');
  } else {
    if (grade === 'partial') await showDialog(withFrom(pick(story.partial, ticket.id), ticket.from));
    await showDialog(ticket.success || []);
    toast(`+${reward} €${grade === 'partial' ? '  (halber Lohn)' : ''}`, 'money');
  }
  if (tickets.every((t) => state.done[t.id]) && !Object.keys(state.retry).length && !state.outroSeen) {
    state.outroSeen = true;
    save();
    await showDialog(story.outro);
  }
}

async function runExam() {
  const roomEl = document.getElementById('room');
  await showDialog(state.examTried ? exam.intro : [...exam.discover, ...exam.intro]);
  state.examTried = true;
  save();
  const world = buildWorld(await scenarioOf(exam.scenario));
  roomEl.classList.add('hidden');
  let passed = 0;
  for (const [i, part] of exam.parts.entries()) {
    const ticket = { id: `exam-${i}`, title: part.title, task: part.task };
    const r = await runTaskScreen({ title: part.title, fromName: 'Raketenschlitten', ticket, world });
    if (!r) { roomEl.classList.remove('hidden'); await showDialog([['kranz', 'Prüfung abgebrochen. Sie können jederzeit wieder an die Kiste.']]); return; }
    if (r.grade === 'perfect' || r.grade === 'partial') passed++;
    toast(`Prüfungsteil ${i + 1}: ${r.grade === 'fail' ? 'nicht bestanden' : 'bestanden'}`, r.grade === 'fail' ? 'bad' : 'money');
  }
  roomEl.classList.remove('hidden');
  await showDialog([['erz', `Ergebnis: ${passed} von ${exam.parts.length} Prüfungsteilen bestanden.`]]);
  if (passed < exam.passNeeded) { await showDialog(exam.fail); return; }
  await showDialog(exam.pass);
  state.examPassed = true;
  save();
  room.close();
  overworld.stop();
  await playFinale();
  overworld.start();
}

async function onArrive(nodeId) {
  if (busy) return;
  busy = true;
  state.node = nodeId;
  saveState(state);
  try {
    if (nodeId === 'baumhaus') {
      overworld.stop();
      await room.open();
      overworld.start();
      return;
    }
    const raw = tickets.find((t) => t.node === nodeId && isOpen(t));
    if (raw) {
      const retry = isRetry(raw);
      const params = pickParams(raw, state.seed, state.retry?.[raw.id]?.n ?? 0);
      const ticket = resolveTicket(raw, params);
      await showDialog([...(retry ? withFrom(pick(story.retry, raw.id), raw.from) : []), ...(ticket.intro || [])]);
      await runTicket(ticket, raw, params);
    } else if (nodeId === 'rathaus') {
      await showDialog(story.office);
    } else {
      await showDialog(story.nothingHere);
    }
  } catch (e) {
    console.error(e);
    toast(`Fehler: ${e.message}`, 'bad');
  } finally {
    busy = false;
  }
}

async function boot() {
  const [map] = await Promise.all([getJSON('data/map.json'), loadSprites(), document.fonts?.ready]);
  [tickets, story, shop, exam] = await Promise.all(['tickets', 'story', 'shop', 'exam'].map((n) => getJSON(`data/${n}.json`)));
  setCharacters(story.characters);
  document.getElementById('loading').classList.add('hidden');

  await showNotice();
  const choice = await showTitle(Boolean(state.introSeen));
  if (choice === 'new') { resetState(); state = loadState(); }
  if (!state.seed) { state.seed = Math.floor(Math.random() * 2 ** 31); saveState(state); }

  overworld = new Overworld(document.getElementById('map'), map, { onArrive, markers });
  overworld.locked = () => busy;
  overworld.tutorial = () => doneCount() === 0;
  if (state.node) overworld.setNode(state.node);
  overworld.start();
  room = new Room(document.getElementById('room'), { shop, state, save: () => save(), onChange: updateHud, onCrateFull: runExam });
  updateHud();

  document.querySelector('.hud-reset').addEventListener('click', () => {
    if (confirm('Spielstand wirklich löschen?')) { resetState(); location.reload(); }
  });
  document.querySelector('.hud-full').addEventListener('click', () => {
    const d = document.documentElement;
    if (!document.fullscreenElement) d.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.();
  });

  if (!state.introSeen) {
    busy = true;
    await showDialog(story.intro);
    state.introSeen = true;
    saveState(state);
    busy = false;
  }
}

boot().catch((e) => {
  console.error(e);
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('loading').textContent =
    `Laden fehlgeschlagen: ${e.message}. (Lokal bitte über einen Webserver öffnen, nicht per Doppelklick.)`;
});
