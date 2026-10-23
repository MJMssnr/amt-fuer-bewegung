// Gemeinsamer Frageblock für Rechen- und Ablese-Aufgaben (Typ H und C).
// qs: [{ label, symbol, unit, truth, tol?, hints?, help? }]
// Bewertung: perfect = beim ersten Prüfen alles richtig; partial = nach Hinweisen selbst gelöst;
//            fail = "Lösung zeigen" benutzt (dann wird nicht bezahlt).

import { isClose, matchHint } from '../engine/answer.js';
import { fmt, parseNum } from '../render/format.js';

const sym = (s) => (s ? s.replace(/_(\w+)/, '<sub>$1</sub>') : '');

export function questionBlock(container, qs, { onSolved, rule = true }) {
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
  let wrongChecks = 0, done = false;

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

  function check() {
    if (done) return;
    const msgs = [];
    let allRight = true;
    qs.forEach((q, i) => {
      const row = inputs[i].closest('.calc-row');
      const val = parseNum(inputs[i].value);
      row.classList.remove('ok', 'bad');
      if (!Number.isFinite(val)) { allRight = false; msgs.push(`<b>${q.label}:</b> Hier fehlt noch eine Zahl.`); return; }
      if (isClose(val, q.truth, q.tol)) { row.classList.add('ok'); inputs[i].disabled = true; return; }
      allRight = false;
      row.classList.add('bad');
      const hint = matchHint(val, q.hints);
      if (hint) msgs.push(`<b>${q.label}:</b> ${hint.text}`);
      else if (Math.sign(val) !== Math.sign(q.truth) && isClose(-val, q.truth, q.tol)) msgs.push(`<b>${q.label}:</b> Der Betrag stimmt, aber das Vorzeichen nicht. In welche Richtung zeigt die x-Achse?`);
      else if (wrongChecks >= 1 && q.help) msgs.push(`<b>${q.label}:</b> ${q.help}`);
      else msgs.push(`<b>${q.label}:</b> Das stimmt noch nicht. Rechne nochmal nach.`);
    });
    if (allRight) {
      fb.className = 'feedback ok';
      fb.textContent = wrongChecks ? 'Jetzt stimmt alles!' : 'Alles richtig, sauber gerechnet!';
      finish(wrongChecks ? 'partial' : 'perfect');
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
      inputs[i].value = fmt(q.truth, 2);
      inputs[i].closest('.calc-row').classList.remove('bad');
      inputs[i].closest('.calc-row').classList.add('shown');
    });
    fb.className = 'feedback';
    fb.textContent = 'Das sind die Lösungen. Vergleiche sie mit deinem Rechenweg auf Papier. Bezahlt wird diesmal nicht, denn geliefert hast du ja nicht selbst.';
    finish('fail');
  });
}
