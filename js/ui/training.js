// Training (Endlosmodus) im Hauptmenü [W47]: Typ (Buchstabe) und Stufe wählen, Aufgaben werden prozedural erzeugt.
// Kein Geld, keine Story; eigene Statistik je Typ und Stufe (localStorage, unabhängig vom Spielstand).

import { TYPES } from '../tasks/types.js';
import { TRAINING, LEVELS, generate } from '../engine/gen/index.js';
import { askChoice, toast } from './dialog.js';

const KEY = 'amt-fuer-bewegung.training';
const loadStats = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; } };
const saveStats = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* egal */ } };

/** Auswahlbildschirm → { type, level } oder null (zurück) */
function choose(last) {
  const stats = loadStats();
  const ready = new Set(TRAINING.map((e) => e.type));
  const el = document.createElement('div');
  el.className = 'training';
  const types = Object.entries(TYPES).map(([type, t]) => {
    const on = ready.has(type), st = stats[type] ?? {};
    const n = LEVELS.reduce((a, l) => a + (st[l]?.n ?? 0), 0), ok = LEVELS.reduce((a, l) => a + (st[l]?.ok ?? 0), 0);
    return `<button type="button" class="tr-type${on ? '' : ' off'}" data-type="${type}" ${on ? '' : 'disabled'}>
      <b>${t.letter}</b><span>${t.name}</span><small>${on ? (n ? `${ok}/${n} richtig` : 'neu') : 'bald'}</small></button>`;
  }).join('');
  el.innerHTML = `<div class="tr-panel">
    <h2>🏋 Training</h2>
    <p class="tr-lead">Ohne Geschichte, ohne Geld – einfach üben. Jede Aufgabe wird neu erzeugt. Papier, Stift und Taschenrechner bereitlegen!</p>
    <div class="tr-types">${types}</div>
    <div class="tr-levels">${LEVELS.map((l) => `<button type="button" class="tr-level" data-level="${l}">${l}</button>`).join('')}</div>
    <div class="tr-actions"><button type="button" class="btn secondary tr-back">← Zurück</button><button type="button" class="btn tr-go" disabled>Los ▶</button></div>
  </div>`;
  document.body.appendChild(el);
  let type = last?.type && ready.has(last.type) ? last.type : null, level = last?.level ?? 'leicht';
  const sync = () => {
    el.querySelectorAll('.tr-type').forEach((b) => b.classList.toggle('on', b.dataset.type === type));
    el.querySelectorAll('.tr-level').forEach((b) => b.classList.toggle('on', b.dataset.level === level));
    el.querySelector('.tr-go').disabled = !type;
  };
  sync();
  return new Promise((resolve) => {
    const close = (v) => { el.remove(); resolve(v); };
    el.querySelectorAll('.tr-type').forEach((b) => b.addEventListener('click', () => { type = b.dataset.type; sync(); }));
    el.querySelectorAll('.tr-level').forEach((b) => b.addEventListener('click', () => { level = b.dataset.level; sync(); }));
    el.querySelector('.tr-back').addEventListener('click', () => close(null));
    el.querySelector('.tr-go').addEventListener('click', () => close({ type, level }));
  });
}

/** Trainingsschleife; runTask = runTaskScreen aus main.js, buildWorld aus der Engine */
export async function runTraining({ runTask, buildWorld }) {
  let last = null;
  const back = document.querySelector('#task .t-back'), backText = back?.textContent;
  if (back) back.textContent = '← Auswahl';
  try { await loop(); } finally { if (back) back.textContent = backText; }
  async function loop() {
  for (;;) {
    const sel = await choose(last);
    if (!sel) return;
    last = sel;
    const t = TYPES[sel.type];
    let seed = Math.floor(Math.random() * 2 ** 31);
    for (;;) {
      const { ticket, scenario } = generate(sel.type, sel.level, seed++);
      const res = await runTask({ title: `Training ${t.letter}: ${t.name}`, fromName: `Stufe ${sel.level}`, rewardText: '', ticket, world: buildWorld(scenario) });
      if (!res) break; // „← Karte“ ohne Lösung: zurück zur Auswahl
      const ok = res.grade === 'perfect' || (res.grade == null && res.attempts <= 1);
      const stats = loadStats();
      const st = ((stats[sel.type] ??= {})[sel.level] ??= { n: 0, ok: 0, streak: 0 });
      st.n++; if (ok) { st.ok++; st.streak++; } else st.streak = 0;
      saveStats(stats);
      toast(ok ? (st.streak >= 3 ? `🔥 ${st.streak} richtig in Folge!` : '✔ Richtig') : res.grade === 'partial' ? '◐ Mit Hilfe geschafft' : 'Nächstes Mal klappt es!', ok ? 'money' : undefined);
      if (!(await askChoice('Noch eine Aufgabe?', ['Nächste Aufgabe ▶', 'Andere Auswahl']))) break;
    }
  }
}
}
