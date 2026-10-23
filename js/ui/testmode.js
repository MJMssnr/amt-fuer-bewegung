// Testmodus für Herrn Messner [W16]. Einschalten auf drei Wegen:
// - URL mit ?amtstest=1 (aus: ?amtstest=0)
// - am Notebook einfach „amtstest“ tippen (kein Eingabefeld aktiv)
// - im Startbildschirm 20× auf Oma Gerda mit dem Rollator tippen (js/ui/title.js) [W17]
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

export function initTestMode(onChange) {
  const p = new URLSearchParams(location.search).get('amtstest');
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
}
