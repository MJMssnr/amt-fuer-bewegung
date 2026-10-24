// Der Gültige-Ziffern-Polizist [W16]: drängt sich mit Trillerpfeife groß ins Rätselfenster, wenn eine Eingabe
// nur 1 gültige Ziffer hat (immer zu wenig!) oder 4 und mehr (zu genau). Kein Geldabzug.
// Texte: data/police.json. Regeln: js/engine/sigfig.js.

import { sigVerdict, sigSuggest, countSig } from '../engine/sigfig.js';
import { parseNum } from '../render/format.js';
import { getSprite } from '../render/pixel.js';
import { speakChar, voiceSpeed, sfx } from '../audio/sound.js';

const KEY = 'amt-fuer-bewegung.gz-verwarnungen';
const KEY_PRAISE = 'amt-fuer-bewegung.gz-lob';
const VOICE = 'mann_kraeftig';
let texts = null;
let shownThisTask = false;
/** Zu Beginn jedes Auftrags aufrufen: Polizist kommt höchstens einmal pro Auftrag [W20] */
export const resetPatrol = () => { shownThisTask = false; };
const loadTexts = async () => (texts ??= await (await fetch('data/police.json', { cache: 'no-cache' })).json());

// vergrößerte, kantenscharfe Einzelbilder des Polizisten als Data-URL (einmal erzeugt, dann aus dem Speicher)
const FRAMES = new Map();
function policeFrame(name, f) {
  const sp = getSprite(name), k = `${name}:${f % sp.frames.length}`;
  if (!FRAMES.has(k)) {
    const sc = 8, c = document.createElement('canvas');
    c.width = sp.w * sc; c.height = sp.h * sc;
    const cx = c.getContext('2d'); cx.imageSmoothingEnabled = false;
    cx.drawImage(sp.frames[f % sp.frames.length], 0, 0, c.width, c.height);
    FRAMES.set(k, c.toDataURL());
  }
  return FRAMES.get(k);
}

function warnings(inc = 0) {
  let n = 0;
  try { n = Number(localStorage.getItem(KEY)) || 0; } catch { /* egal */ }
  if (inc) { n += inc; try { localStorage.setItem(KEY, String(n)); } catch { /* egal */ } }
  return n;
}

/**
 * Prüft die Eingabefelder; bei Verstoß kommt der Polizist (einmal pro Prüfen, erster Verstoß zählt).
 * fields: [{ input: HTMLInputElement, sig?: false }]   Rückgabe: Promise<boolean> (ob er da war)
 */
export async function sigPatrol(fields, { enabled = true, host } = {}) {
  if (!enabled || shownThisTask) return false;
  for (const f of fields) {
    if (f.sig === false || f.input.disabled) continue;
    const verdict = sigVerdict(f.input.value);
    if (!verdict) continue;
    const value = parseNum(f.input.value);
    shownThisTask = true;
    await showPolice(host ?? document.getElementById('task'), {
      kind: verdict, input: f.input.value.trim(), suggest: sigSuggest(value, verdict === 'few' ? 2 : 2),
    });
    return true;
  }
  return false;
}

/**
 * Lob [W28]: einmalig, nachdem schon mindestens zweimal verwarnt wurde. Kommt, wenn eine richtige Antwort
 * „eigentlich“ nur eine Ziffer hat (z. B. 8) und der Spieler trotzdem „8,0“ getippt hat.
 * fields: [{ input, truth, sig?: false }]
 */
export async function sigPraise(fields, { enabled = true, host } = {}) {
  if (!enabled || shownThisTask || warnings() < 2) return false;
  try { if (localStorage.getItem(KEY_PRAISE)) return false; } catch { return false; }
  for (const f of fields) {
    const v = f.truth;
    if (f.sig === false || !Number.isFinite(v) || v === 0) continue;
    if (Number(v.toPrecision(1)) !== Number(v.toPrecision(2))) continue; // hat „natürlich“ 2 Ziffern
    if (Math.abs(v) >= 10 && Number.isInteger(v)) continue;            // 80 → schon 2 g.Z. ohne Komma
    if (countSig(f.input.value) < 2) continue;
    shownThisTask = true;
    try { localStorage.setItem(KEY_PRAISE, '1'); } catch { /* egal */ }
    await showPolice(host ?? document.getElementById('task'), { kind: 'praise', input: f.input.value.trim(), suggest: '' });
    return true;
  }
  return false;
}

export async function showPolice(host, { kind, input, suggest }) {
  const T = await loadTexts();
  const n = kind === 'praise' ? warnings() : warnings(1);
  const lines = T[kind].map((l) => ({ mood: l.mood, text: l.text[(n - 1) % l.text.length]
    .replace('{input}', input).replace('{suggest}', suggest).replace('{n}', n) }));

  const el = document.createElement('div');
  el.className = 'police angry';
  el.innerHTML = `<div class="pol-fig"><img class="pol-img" alt="Gültige-Ziffern-Polizist"><div class="pol-heart hidden" aria-hidden="true"></div></div>
    <div class="pol-bubble"><div class="pol-name"></div><div class="pol-text"></div><div class="pol-more">▼</div></div>`;
  el.querySelector('.pol-name').textContent = T.name;
  host.appendChild(el);
  sfx('whistle');

  // Figur als <img> statt Canvas [W37]: Safari/iPad zeigte das animierte Canvas manchmal gar nicht an
  // (Sprechblase da, Polizist fehlt). Bilder werden einmal vergrößert erzeugt und dann nur getauscht.
  const img = el.querySelector('.pol-img');
  let mood = 'angry', f = 0;
  const frame = () => { img.src = policeFrame(mood === 'angry' ? 'polizist_rot' : 'polizist', mood === 'angry' ? f : 0); };
  frame();
  const timer = setInterval(() => { f++; frame(); }, 170);

  const textEl = el.querySelector('.pol-text');
  return new Promise((resolve) => {
    let i = 0, timer = null, typing = false, started = false;
    const show = () => {
      started = true;
      const line = lines[i];
      mood = line.mood; frame();
      el.className = `police ${mood}`;
      el.querySelector('.pol-heart').classList.toggle('hidden', mood !== 'happy');
      let k = 0;
      typing = true;
      const step = () => {
        const c = line.text[k++];
        textEl.textContent = line.text.slice(0, k);
        if (k >= line.text.length) { typing = false; return; }
        timer = setTimeout(step, speakChar(c, VOICE, k) / voiceSpeed(VOICE));
      };
      step();
    };
    const next = (e) => {
      e?.preventDefault();
      if (!started) return;
      if (typing) { clearTimeout(timer); textEl.textContent = lines[i].text; typing = false; return; }
      if (++i < lines.length) { show(); return; }
      el.classList.add('leaving');
      el.removeEventListener('pointerup', next);
      document.removeEventListener('keydown', onKey, true);
      setTimeout(() => { clearInterval(timer); el.remove(); resolve(); }, 380);
    };
    const onKey = (e) => {
      if (e.key === ' ' || e.key === 'Enter') { e.stopPropagation(); next(e); }
    };
    el.addEventListener('pointerup', next);
    document.addEventListener('keydown', onKey, true);
    document.activeElement?.blur?.();
    setTimeout(show, 450);
  });
}
