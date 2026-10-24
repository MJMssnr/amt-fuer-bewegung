// Auswahlfrage mit Begründung nach einer gelösten Aufgabe [W47]: genutzt von U (t74 „Warum unmöglich?“)
// und O (Verständnisfrage zum Stroboskop). Gemischt fest, falsche Antworten mit eigener Rückmeldung.
/** Auswahlfrage „Warum?“ [W47]: why = { question, choices:[{ text, correct?, feedback? }] }; done(firstTry) */
export function whyQuestion(box, why, done) {
  const wrap = document.createElement('div');
  wrap.className = 'avg-why';
  wrap.innerHTML = `<p class="prompt">${why.question}</p><div class="rv-choices"></div><div class="feedback" aria-live="polite"></div>`;
  box.appendChild(wrap);
  const fb = wrap.querySelector('.feedback');
  let first = true;
  const order = why.choices.map((c, i) => [c, (i * 7 + 3) % 5]).sort((a, b) => a[1] - b[1]).map(([c]) => c); // fest gemischt
  order.forEach((c) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'rv-choice'; b.textContent = c.text;
    b.addEventListener('click', () => {
      if (c.correct) { wrap.querySelectorAll('.rv-choice').forEach((x) => (x.disabled = true)); b.classList.add('right'); fb.textContent = ''; done(first); return; }
      first = false; b.disabled = true; b.classList.add('wrong');
      fb.className = 'feedback bad'; fb.textContent = c.feedback ?? 'Nein, das ist nicht der Grund.';
    });
    wrap.querySelector('.rv-choices').appendChild(b);
  });
  wrap.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
}

/** Mehrere Fragen nacheinander; done(allFirstTry) */
export function whyQuestions(box, list, done) {
  const qs = Array.isArray(list) ? list : [list];
  let all = true, k = 0;
  const step = () => (k < qs.length ? whyQuestion(box, qs[k++], (first) => { all &&= first; step(); }) : done(all));
  step();
}
