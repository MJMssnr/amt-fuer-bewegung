// Gemeinsamer Frageblock für Rechen- und Ablese-Aufgaben (Typ H und C).
// qs: [{ label, symbol, unit, truth, tol?, range?: [min, max], hints?, help?, follows? }]  range ersetzt tol (z. B. Ablesen aus Diagramm)
// Folgefehler [W47]: follows = { q: Index der Bezugsfrage, var: "s", expr: "s/70*3.6" } oder { vars: { s1: 0, s2: 1 }, expr }. Ist die Bezugsantwort
// akzeptiert (z. B. großzügig abgelesen), wird diese Frage mit dem WERT DES SPIELERS nachgerechnet – dann muss sie
// exakt dazu passen (normale Toleranz, Gültige-Ziffern-Polizei). Hinweise dürfen statt "value" ein "expr" haben.
// Bewertung: perfect = beim ersten Prüfen alles richtig; partial = nach Hinweisen selbst gelöst;
//            fail = "Lösung zeigen" benutzt (dann wird nicht bezahlt).

import { isClose, matchHint } from '../engine/answer.js';
import { fmt, parseNum } from '../render/format.js';
import { evalExpr } from '../engine/variants.js';
import { sigPatrol, sigPraise } from '../ui/police.js';

const sym = (s) => (s ? s.replace(/_(\w+)/, '<sub>$1</sub>') : '');

// sig: Gültige-Ziffern-Polizist aktiv (Standard ja; pro Frage abschaltbar mit q.sig = false) [W16]
export function questionBlock(container, qs, { onSolved, rule = true, sig = true }) {
  container.insertAdjacentHTML('beforeend', `
    <form class="calc-list" autocomplete="off"></form>
    <div class="calc-actions">
      <button class="btn btn-check" type="button">Prüfen</button>
      <button class="btn btn-reveal hidden" type="button">Lösung zeigen</button>
    </div>
    <div class="feedback" aria-live="polite"></div>
    ${rule ? '<div class="amtsregel"><b>Amtsregel § 3:</b> Kleine Rundungsabweichungen winkt das Amt durch. In der Schulaufgabe zählen aber ein sauberer Rechenweg und sinnvoll gerundete Ergebnisse!</div>' : ''}`);
  const list = container.querySelector('.calc-list');
  qs.forEach((q, i) => {
    list.insertAdjacentHTML('beforeend', `
      <label class="calc-row">
        <span class="calc-label">${q.label}${q.symbol ? ` ${sym(q.symbol)}` : ''}</span>
        <span class="calc-input"><input inputmode="decimal" enterkeyhint="${i === qs.length - 1 ? 'done' : 'next'}" aria-label="${q.label}"><span class="unit">${q.unit ?? ''}</span></span>
        <span class="calc-mark" aria-hidden="true"></span>
      </label>`);
  });
  const inputs = [...list.querySelectorAll('input')];
  const fb = container.querySelector('.feedback');
  const btnCheck = container.querySelector('.btn-check');
  const btnReveal = container.querySelector('.btn-reveal');
  let wrongChecks = 0, done = false, patrolling = false;

  inputs.forEach((inp, i) => inp.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (i < inputs.length - 1) inputs[i + 1].focus(); else check();
  }));

  function finish(grade) {
    done = true;
    inputs.forEach((inp) => (inp.disabled = true));
    btnCheck.disabled = true;
    btnReveal.classList.add('hidden');
    setTimeout(() => onSolved({ attempts: wrongChecks + 1, grade }), 1400);
  }

  const accepted = (q, val) => Number.isFinite(val) && (q.range ? val >= q.range[0] - 1e-9 && val <= q.range[1] + 1e-9 : isClose(val, q.truth, q.tol));
  const effectiveRef = (k) => ({ ...qs[k], ...effective(qs[k]) }); // Ketten: Bezugsfrage kann selbst Folgefrage sein
  /** Wahrheit und Hinweise einer Frage, bei Folgefragen aus der Antwort des Spielers [W47] */
  function effective(q) {
    const f = q.follows;
    if (!f) return { truth: q.truth, range: q.range, hints: q.hints };
    const refs = f.vars ?? { [f.var]: f.q }; // mehrere Bezugsfragen: { vars: { s1: 0, s2: 1 }, expr: "s1+s2" }
    const vars = {};
    for (const [name, k] of Object.entries(refs)) {
      const rv = parseNum(inputs[k].value);
      if (!accepted(effectiveRef(k), rv)) return { truth: q.truth, range: q.range, hints: q.hints };
      vars[name] = rv;
    }
    return { truth: evalExpr(f.expr, vars), range: null, follow: true,
      hints: (q.hints ?? []).map((h) => (h.expr ? { ...h, value: evalExpr(h.expr, vars) } : h)).filter((h) => !h.absolute) };
  }

  async function check() {
    if (done || patrolling) return;
    patrolling = true;
    try { await sigPatrol(qs.map((q, i) => ({ input: inputs[i], sig: q.sig })), { enabled: sig }); } finally { patrolling = false; }
    const msgs = [];
    let allRight = true;
    qs.forEach((q, i) => {
      const row = inputs[i].closest('.calc-row');
      const val = parseNum(inputs[i].value);
      row.classList.remove('ok', 'bad');
      if (!Number.isFinite(val)) { allRight = false; msgs.push(`<b>${q.label}:</b> Hier fehlt noch eine Zahl.`); return; }
      const e = effective(q);
      if (accepted({ ...q, ...e }, val)) { row.classList.add('ok'); inputs[i].disabled = true; return; }
      allRight = false;
      row.classList.add('bad');
      const hint = matchHint(val, (e.hints ?? []).filter((h) => h.value !== undefined));
      if (hint) msgs.push(`<b>${q.label}:</b> ${hint.text}`);
      else if (e.follow && wrongChecks === 0) msgs.push(`<b>${q.label}:</b> Rechne mit DEINEM Wert von oben weiter – damit muss es genau passen, auch beim Runden.`);
      else if (Math.sign(val) !== Math.sign(e.truth) && isClose(-val, e.truth, q.tol)) msgs.push(`<b>${q.label}:</b> Der Betrag stimmt, aber das Vorzeichen nicht. In welche Richtung zeigt die x-Achse?`);
      else if (wrongChecks >= 1 && q.help) msgs.push(`<b>${q.label}:</b> ${q.help}`);
      else msgs.push(`<b>${q.label}:</b> Das stimmt noch nicht. Rechne nochmal nach.`);
    });
    if (allRight) {
      fb.className = 'feedback ok';
      fb.textContent = wrongChecks ? 'Jetzt stimmt alles!' : 'Alles richtig, sauber gerechnet!';
      done = true;
      sigPraise(qs.map((q, i) => ({ input: inputs[i], truth: effective(q).truth, sig: q.sig })), { enabled: sig })
        .finally(() => finish(wrongChecks ? 'partial' : 'perfect'));
      return;
    }
    wrongChecks++;
    fb.className = 'feedback bad';
    fb.innerHTML = msgs.join('<br>');
    if (wrongChecks >= 2) btnReveal.classList.remove('hidden');
  }

  btnCheck.addEventListener('click', check);
  btnReveal.addEventListener('click', () => {
    qs.forEach((q, i) => {
      if (!inputs[i].disabled || !Number.isFinite(parseNum(inputs[i].value))) inputs[i].value = fmt(effective(q).truth, 2);
      inputs[i].closest('.calc-row').classList.remove('bad');
      inputs[i].closest('.calc-row').classList.add('shown');
    });
    fb.className = 'feedback';
    fb.textContent = 'Das sind die Lösungen. Vergleiche sie mit deinem Rechenweg auf Papier. Bezahlt wird diesmal nicht, denn geliefert hast du ja nicht selbst.';
    finish('fail');
  });
}
