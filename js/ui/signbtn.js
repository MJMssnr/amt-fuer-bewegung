// Minus-Knopf für Zahleneingaben [W28]: Viele Handy-Tastaturen (inputmode="decimal") haben kein Minuszeichen.
// Vor jedes Zahlenfeld kommt ein „±“-Knopf, der das Vorzeichen umschaltet, ohne die Tastatur zu schließen.

export function addSignButtons(root) {
  for (const input of root.querySelectorAll('input[inputmode="decimal"]')) {
    if (input.previousElementSibling?.classList.contains('sign-btn')) continue;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'sign-btn';
    b.textContent = '±';
    b.title = 'Vorzeichen umschalten (Minus)';
    b.setAttribute('aria-label', 'Minus / Vorzeichen umschalten');
    // pointerdown statt click: Fokus bleibt im Feld, die Handy-Tastatur bleibt offen
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (input.disabled) return;
      const v = input.value.trim();
      input.value = /^[-−]/.test(v) ? v.replace(/^[-−]\s*/, '') : `-${v}`;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      if (document.activeElement !== input) input.focus();
    });
    input.before(b);
  }
}
