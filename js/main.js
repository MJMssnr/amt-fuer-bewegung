// Einstieg: Demo-Hinweis -> Startbildschirm -> Stadtkarte. Verbindet Karte, Aufträge, Baumhaus und Prüfung.

import { loadSprites } from './render/pixel.js';
import { buildWorld } from './engine/kinematics.js';
import { Overworld } from './ui/overworld.js';
import { askChoice, showDialog, setCharacters, toast } from './ui/dialog.js';
import { loadState, saveState, resetState } from './ui/state.js';
import { showNotice, showTitle } from './ui/title.js';
import { Room } from './ui/room.js';
import { playFinale } from './ui/finale.js';
import { deliverDue, partOrder } from './engine/packages.js';
import { LOT } from './render/bauplatz.js';
import { loadTask } from './tasks/index.js';
import { pickParams, resolveTicket, applyScenario } from './engine/variants.js';
import { unlockAudio } from './audio/sound.js';
import { initSoundMenu } from './ui/sound-menu.js';
import { openQuestlog } from './ui/questlog.js';
import { encodeSave, decodeSave } from './engine/savecode.js';
import { showSaveCode, askLoadCode } from './ui/savecode-ui.js';
import { resetPatrol } from './ui/police.js';
import { addSignButtons } from './ui/signbtn.js';
import { scrollArrows } from './ui/scrollhint.js';
import { typeOf } from './tasks/types.js';
import { initTestMode, isTestMode, setTestMode } from './ui/testmode.js';

// Browser erlauben Klang erst nach einer Nutzeraktion
document.addEventListener('pointerdown', unlockAudio, { capture: true });
document.addEventListener('keydown', unlockAudio, { capture: true });

const getJSON = async (url) => {
  const r = await fetch(url, { cache: 'no-cache' }); // nach Updates nie alte Daten [W24]
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.json();
};

let state = loadState();
let finaleTexts = null;
let tickets = [], story = {}, shop = {}, map = {}, overworld = null, room = null, busy = false;
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

function markers() {
  const m = {};
  LOT.phase = state.finaleDone ? 'done' : state.finaleReady ? 'ready' : 'empty';
  for (const t of tickets) {
    if (isOpen(t)) m[t.node] = 'open';
    else if (state.done[t.id] && m[t.node] !== 'open') m[t.node] = 'done';
  }
  if (state.pkg?.waiting?.length) m.baumhaus = 'open';
  if (state.finaleReady && !state.finaleDone) m.bauplatz = 'open';
  return m;
}

function updateHud() {
  document.querySelector('.hud-money').textContent = `${state.money} €`;
  const n = tickets.filter((t) => state.done[t.id]).length;
  document.querySelector('.hud-tickets').textContent = `Aufträge ${n}/${tickets.length}`;
  document.querySelector('.map-hint')?.classList.toggle('hidden', n > 0);
  // Fahrzeuge: Knopf erscheint nach dem Kauf; an = dieses Fahrzeug benutzen [W26]
  const own = { bike: state.items.rennrad, moto: state.items.motorrad };
  if (state.travel && !own[state.travel]) state.travel = 'walk';
  document.querySelectorAll('.hud-ride').forEach((b) => {
    b.classList.toggle('hidden', !own[b.dataset.mode]);
    b.classList.toggle('on', state.travel === b.dataset.mode);
  });
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
  const ty = typeOf(ticket.task.type);
  const badge = screen.querySelector('.t-type');
  badge.textContent = ty.letter;
  badge.title = `Aufgabentyp ${ty.letter}: ${ty.name}`;
  const root = screen.querySelector('.task-root');
  resetPatrol();
  screen.classList.remove('hidden');
  overworld.stop();
  const result = await new Promise((resolve) => {
    let solved = null;
    // Nach dem Lösen bleibt der Bildschirm stehen, bis getippt wird: Lösungshinweis in Ruhe lesen und notieren [W20]
    const finish = () => {
      screen.removeEventListener('click', onTap, true);
      document.removeEventListener('keydown', onKey, true);
      screen.classList.remove('await-tap');
      unArrows();
      inst.destroy();
      resolve(solved);
    };
    const onTap = (e) => { e.stopPropagation(); e.preventDefault(); finish(); };
    const onKey = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); finish(); } };
    const inst = mod.mount(root, { ticket, world, onSolved: (r) => {
      solved = r;
      document.activeElement?.blur?.();
      screen.classList.add('await-tap');
      screen.querySelector('.t-reward').textContent = 'Weiter ▶';
      setTimeout(() => {
        screen.addEventListener('click', onTap, true);
        document.addEventListener('keydown', onKey, true);
      }, 250);
    } });
    addSignButtons(root); // „±“ vor jedem Zahlenfeld [W28]
    const unArrows = scrollArrows(root);
    screen.querySelector('.t-back').onclick = () => { if (solved) finish(); else { unArrows(); inst.destroy(); resolve(null); } };
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
  // Stroboskop-Aufträge (M, N, O) bringen ihre Bewegung im Ticket mit und brauchen kein Szenario
  const world = raw.scenario ? buildWorld(applyScenario(await scenarioOf(raw.scenario), raw, params)) : null;
  const result = await runTaskScreen({
    title: ticket.title, fromName: story.characters[ticket.from]?.name, rewardText: `${ticket.reward} €`, ticket, world,
  });
  if (!result) return;
  const grade = result.grade ?? (result.attempts <= 1 ? 'perfect' : 'fail');
  const reward = grade === 'perfect' ? ticket.reward : grade === 'partial' ? Math.ceil(ticket.reward / 2) : 0;
  state.money += reward;
  state.done[ticket.id] = true;
  // Auftragsbuch: Reihenfolge der Annahme und tatsächlich verdientes Geld
  state.order ??= [];
  if (!state.order.includes(ticket.id)) state.order.push(ticket.id);
  state.earned = { ...(state.earned || {}), [ticket.id]: (state.earned?.[ticket.id] ?? 0) + reward };
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
  // Rätselhafte Pakete [W24]
  if (deliverDue(state, tickets, shop.rocketParts)) { save(); toast(shop.packages.arrived, 'money'); }
  if (tickets.every((t) => state.done[t.id]) && !Object.keys(state.retry).length && !state.outroSeen) {
    state.outroSeen = true;
    save();
    await showDialog(story.outro);
  }
}

/** Intro-Dialog + Aufgabe für einen Auftrag (auch aus dem Testmodus im Auftragsbuch) */
async function playTicket(raw) {
  const retry = isRetry(raw);
  const params = pickParams(raw, state.seed, state.retry?.[raw.id]?.n ?? 0);
  const ticket = resolveTicket(raw, params);
  await showDialog([...(retry ? withFrom(pick(story.retry, raw.id), raw.from) : []), ...(ticket.intro || [])]);
  await runTicket(ticket, raw, params);
}

/** Auftragsbuch öffnen; Testmodus-Aktionen verändern den Spielstand direkt */
async function showQuestlog() {
  if (busy) return;
  busy = true;
  let toPlay = null;
  try {
    await openQuestlog({
      tickets, state, characters: story.characters, nodes: map.nodes, isOpen, isRetry, test: isTestMode,
      actions: {
        play: (t) => { toPlay = t; },
        money: (n) => { state.money += n; save(); },
        saveCode: () => showSaveCode(encodeSave(state, { tickets, items: shop.items, parts: shop.rocketParts })),
        testOff: () => setTestMode(false),
        reset: (t) => {
          delete state.done[t.id]; delete state.grades?.[t.id]; delete state.retry?.[t.id]; delete state.earned?.[t.id];
          state.order = (state.order || []).filter((x) => x !== t.id);
          save();
        },
        setGrade: (t, g) => {
          state.done[t.id] = true;
          state.grades = { ...(state.grades || {}), [t.id]: g };
          state.order ??= [];
          if (!state.order.includes(t.id)) state.order.push(t.id);
          state.retry ??= {};
          if (g === 'fail') state.retry[t.id] = { after: doneCount() + 2, n: (state.retry[t.id]?.n ?? 0) + 1 };
          else delete state.retry[t.id];
          if (deliverDue(state, tickets, shop.rocketParts)) toast(shop.packages.arrived, 'money');
          save();
        },
      },
    });
    if (toPlay) await playTicket(toPlay);
  } catch (e) {
    console.error(e);
    toast(`Fehler: ${e.message}`, 'bad');
  } finally {
    busy = false;
  }
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
      await playTicket(raw);
    } else if (nodeId === 'bauplatz') {
      if (state.finaleReady && !state.finaleDone) {
        overworld.stop();
        await playFinale({ texts: finaleTexts ??= await getJSON('data/finale.json'), baerti: Boolean(state.items.waschbaer) });
        state.finaleDone = true;
        save();
        overworld.start();
      } else if (state.finaleDone) { // Rakete steht wieder bereit: kurzer Flug [W33]
        const F = finaleTexts ??= await getJSON('data/finale.json');
        await showDialog(F.again.ask);
        if (await askChoice(F.again.question, [F.again.yes, F.again.no])) {
          overworld.stop();
          await playFinale({ texts: F, baerti: Boolean(state.items.waschbaer), mode: 'flight' });
          overworld.start();
        }
      } else await showDialog(shop.packages.lotEmpty);
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
  [map] = await Promise.all([getJSON('data/map.json'), loadSprites(),
    // lokale Schriften aktiv laden, sonst zeichnet das Canvas anfangs mit Ersatzschrift
    ...['16px AmtPixel', '16px AmtTitel', '600 16px AmtTitel'].map((f) => document.fonts?.load(f).catch(() => {}))]);
  [tickets, story, shop] = await Promise.all(['tickets', 'story', 'shop'].map((n) => getJSON(`data/${n}.json`)));
  setCharacters(story.characters);
  document.getElementById('loading').classList.add('hidden');

  await showNotice();
  const saveCtx = { tickets, items: shop.items, parts: shop.rocketParts, partOrder };
  const choice = await showTitle(Boolean(state.introSeen), { loadCode: () => askLoadCode((c) => decodeSave(c, saveCtx)) });
  if (choice === 'new') { resetState(); state = loadState(); }
  if (choice?.loaded) { resetState(); state = { ...loadState(), ...choice.loaded }; saveState(state); toast('🔑 Spielstand geladen', 'money'); } // Speichercode [W36]
  if (!state.seed) { state.seed = Math.floor(Math.random() * 2 ** 31); saveState(state); }

  overworld = new Overworld(document.getElementById('map'), map, { onArrive, markers });
  overworld.locked = () => busy;
  overworld.tutorial = () => doneCount() === 0;
  overworld.mode = () => state.travel ?? 'walk';
  document.querySelectorAll('.hud-ride').forEach((b) => b.addEventListener('click', () => {
    state.travel = state.travel === b.dataset.mode ? 'walk' : b.dataset.mode;
    save();
    toast(state.travel === 'bike' ? '🚲 Rennrad an' : state.travel === 'moto' ? '🏍️ Rennmotorrad an' : '🚶 zu Fuß');
  }));
  if (state.node) overworld.setNode(state.node);
  overworld.start();
  room = new Room(document.getElementById('room'), { shop, state, save: () => save(), onChange: updateHud, onManual: () => { state.finaleReady = true; save(); } });
  updateHud();

  document.querySelector('.hud-reset').addEventListener('click', () => {
    if (confirm('Spielstand wirklich löschen?')) { resetState(); location.reload(); }
  });
  initSoundMenu(document.querySelector('.hud-sound'));
  window.amtTest = { arrive: (n) => onArrive(n), state: () => state, room: () => room, ow: () => overworld }; // für automatische Tests
  document.querySelector('.hud-log').addEventListener('click', showQuestlog);
  initTestMode((on) => toast(on ? '🧪 Testmodus an – siehe Auftragsbuch 📖' : 'Testmodus aus'));
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
