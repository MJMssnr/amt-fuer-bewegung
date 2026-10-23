// Register aller Aufgabentypen. Neuer Typ = neue Datei + eine Zeile hier.
// Jedes Modul exportiert mount(root, { ticket, world, onSolved }) -> { destroy() }

const LOADERS = {
  match: () => import('./match.js'),
  describe: () => import('./describe.js'),     // G: Bewegung beschreiben
  calc: () => import('./calc.js'),             // H: Berechnen
  axes: () => import('./axes.js'),             // C: Achsen-Detektiv
  errorhunt: () => import('./errorhunt.js'),   // E: Fehlerjagd
  live: () => import('./live.js'),             // F: Live-Steuerung
  construct: () => import('./construct.js'),   // Konstrukteur: Diagramm selbst bauen
  reaction: () => import('./reaction.js'),     // Reaktionstest -> eigener Anhalteweg
  freehand: () => import('./freehand.js'),     // B: Freihand mit Auto-Begradigung
  area: () => import('./area.js'),             // K: Flächen-Puzzle (Fläche unter t-vₓ = Δx)
  slope: () => import('./slope.js'),           // L: Steigungsdreieck
  direct: () => import('./direct.js'),         // D: Regie (Variante a)
  strobecalc: () => import('./strobecalc.js'), // M: Stroboskop – rechnen
  strobedescribe: () => import('./strobedescribe.js'), // N: Stroboskop – beschreiben
  strobebuild: () => import('./strobebuild.js'), // O: Stroboskop – bauen
  errorbar: () => import('./errorbar.js'),     // P: Fehlerbalken (Größt-/Kleinstwert)
  formula: () => import('./formula.js'),       // Q: Bewegungsformel umstellen und ausrechnen
  pairs: () => import('./pairs.js'),           // R: t-x und t-vₓ verbinden
  skid: () => import('./skid.js'),             // S: Unfallgutachten (v₁² − v₀² = 2·a·Δx)
  puppet: () => import('./puppet.js'),         // T: Puppenspieler (x direkt mit dem Finger)
};

export async function loadTask(type) {
  const load = LOADERS[type];
  if (!load) throw new Error(`Aufgabentyp "${type}" gibt es (noch) nicht`);
  return load();
}
