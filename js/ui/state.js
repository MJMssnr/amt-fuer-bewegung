// Spielstand im Browser (localStorage). Fehlertolerant: ohne Speicher läuft das Spiel trotzdem.

const KEY = 'amt-fuer-bewegung.v1';
const DEFAULT = { money: 0, done: {}, introSeen: false, node: null };

export function loadState() {
  try {
    return { ...DEFAULT, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...DEFAULT };
  }
}

export function saveState(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* privat/blockiert: egal */ }
}

export function resetState() {
  try { localStorage.removeItem(KEY); } catch { /* egal */ }
}
