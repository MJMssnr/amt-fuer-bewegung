// Rätselhafte Pakete mit Raketenteilen [W24]. Kein DOM.
// Teile 1–6 kommen in zufälliger Reihenfolge (Spieler-Seed), sobald genug Aufträge erledigt sind
// (wachsende Abstände). Teil 7 (mit Anleitung) erst, wenn ALLE Aufträge probiert wurden und
// mindestens 80 % voll oder halb gelöst sind.

// Abstände wachsen (6, 8, 10, 12, 14); letztes Teilpaket bei ~71 % der Aufträge. Angepasst an 76 Aufträge [W34]
export const THRESHOLDS = [4, 10, 18, 28, 40, 54];
export const FINAL_RATE = 0.8;

/** Wie viele Pakete stehen dem Spieler zu? */
export function packagesDue(state, tickets) {
  const done = tickets.filter((t) => state.done?.[t.id]).length;
  let n = THRESHOLDS.filter((k) => done >= k).length;
  const good = tickets.filter((t) => ['perfect', 'partial'].includes(state.grades?.[t.id])).length;
  if (done === tickets.length && good >= FINAL_RATE * tickets.length) n = THRESHOLDS.length + 1;
  return n;
}

/** Zufällige, aber pro Spieler feste Reihenfolge der Teile 1–6; das letzte Teil bleibt am Ende. */
export function partOrder(parts, seed = 1) {
  const head = parts.filter((p) => !p.last), last = parts.filter((p) => p.last);
  let s = (seed >>> 0) || 1;
  const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 2 ** 32);
  for (let i = head.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [head[i], head[j]] = [head[j], head[i]]; }
  return [...head, ...last].map((p) => p.id);
}

/**
 * Neue Pakete einbuchen: state.pkg = { sent: Anzahl verschickt, waiting: [ids noch nicht ausgepackt] }.
 * Rückgabe: Anzahl neu angekommener Pakete.
 */
export function deliverDue(state, tickets, parts) {
  state.pkg ??= { sent: 0, waiting: [] };
  const order = partOrder(parts, state.seed);
  const due = Math.min(packagesDue(state, tickets), parts.length);
  let added = 0;
  while (state.pkg.sent < due) { state.pkg.waiting.push(order[state.pkg.sent++]); added++; }
  return added;
}
