// Register aller Aufgabentypen. Neuer Typ = neue Datei + eine Zeile hier.
// Jedes Modul exportiert mount(root, { ticket, world, onSolved }) -> { destroy() }

const LOADERS = {
  match: () => import('./match.js'),
  // describe: () => import('./describe.js'),   // G: Bewegung beschreiben
  // calc:     () => import('./calc.js'),       // H: Berechnen
  // axes:     () => import('./axes.js'),       // C: Achsen-Detektiv
};

export async function loadTask(type) {
  const load = LOADERS[type];
  if (!load) throw new Error(`Aufgabentyp "${type}" gibt es (noch) nicht`);
  return load();
}
