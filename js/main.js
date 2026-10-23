// Einstieg: lädt Daten, startet Stadtkarte, verbindet Tickets mit Aufgaben.

import { loadSprites } from './render/pixel.js';
import { buildWorld } from './engine/kinematics.js';
import { Overworld } from './ui/overworld.js';
import { showDialog, setCharacters, toast } from './ui/dialog.js';
import { loadState, saveState, resetState } from './ui/state.js';
import { loadTask } from './tasks/index.js';

const getJSON = async (url) => {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.json();
};

const state = loadState();
let tickets = [], story = {}, overworld = null, busy = false;
const scenarioCache = new Map();

async function scenarioOf(ticket) {
  if (typeof ticket.scenario === 'object') return ticket.scenario;
  if (!scenarioCache.has(ticket.scenario)) scenarioCache.set(ticket.scenario, await getJSON(`data/scenarios/${ticket.scenario}.json`));
  return scenarioCache.get(ticket.scenario);
}

const isOpen = (t) => !state.done[t.id] && (t.requires || []).every((r) => state.done[r]);

function markers() {
  const m = {};
  for (const t of tickets) {
    if (isOpen(t)) m[t.node] = 'open';
    else if (state.done[t.id] && m[t.node] !== 'open') m[t.node] = 'done';
  }
  return m;
}

function updateHud() {
  document.querySelector('.hud-money').textContent = `${state.money} €`;
  const n = tickets.filter((t) => state.done[t.id]).length;
  document.querySelector('.hud-tickets').textContent = `Aufträge ${n}/${tickets.length}`;
}

async function onArrive(nodeId) {
  if (busy) return;
  busy = true;
  state.node = nodeId;
  saveState(state);
  try {
    const ticket = tickets.find((t) => t.node === nodeId && isOpen(t));
    if (ticket) {
      await showDialog(ticket.intro || []);
      await runTicket(ticket);
    } else if (nodeId === 'rathaus') {
      await showDialog(story.office);
    } else {
      await showDialog(story.nothingHere);
    }
  } catch (e) {
    console.error(e);
    toast(`Fehler: ${e.message}`, 'bad');
  }
  busy = false;
}

async function runTicket(ticket) {
  const screen = document.getElementById('task');
  const world = buildWorld(await scenarioOf(ticket));
  const mod = await loadTask(ticket.task.type);
  screen.querySelector('.t-title').textContent = ticket.title;
  screen.querySelector('.t-from').textContent = story.characters[ticket.from]?.name ?? '';
  screen.querySelector('.t-reward').textContent = `${ticket.reward} €`;
  const root = screen.querySelector('.task-root');
  screen.classList.remove('hidden');
  overworld.stop();

  const result = await new Promise((resolve) => {
    const inst = mod.mount(root, {
      ticket,
      world,
      onSolved: (r) => { inst.destroy(); resolve(r); },
    });
    screen.querySelector('.t-back').onclick = () => { inst.destroy(); resolve(null); };
  });

  screen.classList.add('hidden');
  root.innerHTML = '';
  overworld.start();
  if (!result) return;

  const reward = result.attempts <= 1 ? ticket.reward : Math.ceil(ticket.reward / 2);
  state.money += reward;
  state.done[ticket.id] = true;
  saveState(state);
  updateHud();
  await showDialog(ticket.success || []);
  toast(`+${reward} €${result.attempts > 1 ? '  (mit Umweg)' : ''}`, 'money');
  if (tickets.every((t) => state.done[t.id])) await showDialog(story.outro);
}

async function boot() {
  const [map] = await Promise.all([getJSON('data/map.json'), loadSprites(), document.fonts?.ready]);
  tickets = await getJSON('data/tickets.json');
  story = await getJSON('data/story.json');
  setCharacters(story.characters);

  overworld = new Overworld(document.getElementById('map'), map, { onArrive, markers });
  overworld.locked = () => busy;
  if (state.node) overworld.setNode(state.node);
  overworld.start();
  updateHud();

  document.querySelector('.hud-reset').addEventListener('click', () => {
    if (confirm('Spielstand wirklich löschen?')) { resetState(); location.reload(); }
  });
  document.querySelector('.hud-full').addEventListener('click', () => {
    const d = document.documentElement;
    if (!document.fullscreenElement) d.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.();
  });

  document.getElementById('loading').classList.add('hidden');
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
  document.getElementById('loading').textContent =
    `Laden fehlgeschlagen: ${e.message}. (Lokal bitte über einen Webserver öffnen, nicht per Doppelklick.)`;
});
