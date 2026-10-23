// Spielstand im Browser (localStorage). Fehlertolerant: ohne Speicher läuft das Spiel trotzdem.

const KEY = 'amt-fuer-bewegung.v1';
const DEFAULT = { money: 0, done: {}, introSeen: false, node: null, items: {}, grades: {}, pkg: { sent: 0, waiting: [] }, finaleReady: false, finaleDone: false };

export function loadState() {
  try {
    const st = { ...structuredClone(DEFAULT), ...JSON.parse(localStorage.getItem(KEY) || '{}') };
    st.items ??= {}; st.done ??= {};
    return st;
  } catch {
    return structuredClone(DEFAULT);
  }
}

export function saveState(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* privat/blockiert: egal */ }
}

export function resetState() {
  try { localStorage.removeItem(KEY); } catch { /* egal */ }
}
