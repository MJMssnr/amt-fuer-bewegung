// Testmodus für Herrn Messner [W16]. Einschalten auf drei Wegen:
// - URL mit ?test=1 (aus: ?test=0)
// - am Notebook einfach „amtstest“ tippen (kein Eingabefeld aktiv)
// - am iPad/Handy 5× schnell auf den Titel „Amt für Bewegung“ oben links tippen
// Wirkung: im Auftragsbuch 📖 gesperrte Aufträge sehen, starten, abhaken, zurücksetzen, Geld.

const KEY = 'amt-fuer-bewegung.test';
const CODE = 'amtstest';

let on = false;
try { on = localStorage.getItem(KEY) === '1'; } catch { /* egal */ }

export const isTestMode = () => on;

let notify = () => {};
export function setTestMode(v) {
  on = Boolean(v);
  try { localStorage.setItem(KEY, on ? '1' : '0'); } catch { /* egal */ }
  document.body.classList.toggle('test-mode', on);
  notify(on);
}

export function initTestMode(titleEl, onChange) {
  const p = new URLSearchParams(location.search).get('test');
  if (p !== null) setTestMode(p === '1');
  document.body.classList.toggle('test-mode', on);
  notify = onChange;

  let typed = '';
  document.addEventListener('keydown', (e) => {
    if (e.target.closest?.('input, textarea')) return;
    if (e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-CODE.length);
    if (typed === CODE) { typed = ''; setTestMode(!on); }
  });

  let taps = [];
  titleEl?.addEventListener('pointerdown', () => {
    const now = performance.now();
    taps = [...taps.filter((t) => now - t < 1500), now];
    if (taps.length >= 5) { taps = []; setTestMode(!on); }
  });
}
