// Speichercode anzeigen und eingeben [W36]. Logik: js/engine/savecode.js.

const NOTE = 'Das Spiel speichert automatisch in diesem Browser. Den Code brauchst du nur als Backup – oder wenn du auf einem anderen Gerät weiterspielen willst.';

function modal(html) {
  const el = document.createElement('div');
  el.className = 'save-modal';
  el.innerHTML = `<div class="save-card">${html}</div>`;
  document.body.appendChild(el);
  return el;
}

/** Code anzeigen, mit Kopieren-Knopf */
export function showSaveCode(code) {
  return new Promise((resolve) => {
    const el = modal(`<h3>💾 Dein Speichercode</h3><p class="save-note">${NOTE}</p>
      <div class="save-code"></div>
      <p class="save-hint">Schreib ihn ab oder kopiere ihn (z. B. in deine Notizen). Groß- und Kleinschreibung ist egal.</p>
      <div class="save-actions"><button class="btn btn-check save-copy" type="button">📋 Kopieren</button><button class="btn save-close" type="button">Schließen</button></div>`);
    el.querySelector('.save-code').innerHTML = code.split('-').map((b, i) => `<span data-n="${i + 1}">${b}</span>`).join('');
    el.querySelector('.save-copy').onclick = async (e) => {
      try { await navigator.clipboard.writeText(code); e.target.textContent = '✓ Kopiert'; }
      catch { // Fallback: Text markieren
        const r = document.createRange(); r.selectNodeContents(el.querySelector('.save-code'));
        const s = getSelection(); s.removeAllRanges(); s.addRange(r); e.target.textContent = 'Markiert – jetzt kopieren';
      }
    };
    el.querySelector('.save-close').onclick = () => { el.remove(); resolve(); };
  });
}

/** Code eingeben; check(code) → { ok, error, blocks }. Rückgabe: Ergebnis von check oder null (abgebrochen) */
export function askLoadCode(check) {
  return new Promise((resolve) => {
    const el = modal(`<h3>🔑 Spielstand laden</h3><p class="save-note">${NOTE}</p>
      <textarea class="save-input" rows="2" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="XXXXXX-XXXXXX-…"></textarea>
      <div class="feedback save-fb"></div>
      <div class="save-actions"><button class="btn btn-check save-load" type="button">Laden</button><button class="btn save-close" type="button">Abbrechen</button></div>`);
    const inp = el.querySelector('.save-input'), fb = el.querySelector('.save-fb');
    inp.focus();
    el.querySelector('.save-load').onclick = () => {
      const r = check(inp.value);
      if (!r.ok) { fb.className = 'feedback save-fb bad'; fb.textContent = r.error; return; }
      if (!confirm('Spielstand laden? Der Spielstand in diesem Browser wird dabei ersetzt.')) return;
      el.remove(); resolve(r);
    };
    el.querySelector('.save-close').onclick = () => { el.remove(); resolve(null); };
  });
}
