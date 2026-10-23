// Der g.Z.-Polizist [W16]: drängt sich mit Trillerpfeife groß ins Rätselfenster, wenn eine Eingabe
// nur 1 gültige Ziffer hat (immer zu wenig!) oder 4 und mehr (zu genau). Kein Geldabzug.
// Texte: data/police.json. Regeln: js/engine/sigfig.js.

import { sigVerdict, sigSuggest } from '../engine/sigfig.js';
import { parseNum } from '../render/format.js';
import { getSprite } from '../render/pixel.js';
import { speakChar, voiceSpeed, sfx } from '../audio/sound.js';

const KEY = 'amt-fuer-bewegung.gz-verwarnungen';
const VOICE = 'mann_kraeftig';
let texts = null;
let shownThisTask = false;
/** Zu Beginn jedes Auftrags aufrufen: Polizist kommt höchstens einmal pro Auftrag [W20] */
export const resetPatrol = () => { shownThisTask = false; };
const loadTexts = async () => (texts ??= await (await fetch('data/police.json', { cache: 'no-cache' })).json());

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

export async function showPolice(host, { kind, input, suggest }) {
  const T = await loadTexts();
  const n = warnings(1);
  const lines = T[kind].map((l) => ({ mood: l.mood, text: l.text[(n - 1) % l.text.length]
    .replace('{input}', input).replace('{suggest}', suggest).replace('{n}', n) }));

  const el = document.createElement('div');
  el.className = 'police angry';
  el.innerHTML = `<div class="pol-fig"><canvas></canvas><div class="pol-heart hidden" aria-hidden="true"></div></div>
    <div class="pol-bubble"><div class="pol-name"></div><div class="pol-text"></div><div class="pol-more">▼</div></div>`;
  el.querySelector('.pol-name').textContent = T.name;
  host.appendChild(el);
  sfx('whistle');

  // Figur: 12×18-Sprite groß, kantenscharf; wütend = roter Kopf und Stampfen
  const cv = el.querySelector('canvas'), cx = cv.getContext('2d');
  const sc = 8;
  let raf = 0, t0 = performance.now(), mood = 'angry';
  // Größe nur einmal setzen (ständiges Umsetzen von width leert in Safari das Bild)
  const sp0 = getSprite('polizist');
  cv.width = sp0.w * sc; cv.height = sp0.h * sc;
  cv.style.aspectRatio = `${sp0.w} / ${sp0.h}`;
  const draw = (now) => {
    const sp = getSprite(mood === 'angry' ? 'polizist_rot' : 'polizist');
    cx.clearRect(0, 0, cv.width, cv.height);
    cx.imageSmoothingEnabled = false;
    const f = mood === 'angry' ? Math.floor(((now - t0) / 1000) * 6) % sp.frames.length : 0;
    cx.drawImage(sp.frames[f], 0, 0, cv.width, cv.height);
    raf = requestAnimationFrame(draw);
  };
  raf = requestAnimationFrame(draw);

  const textEl = el.querySelector('.pol-text');
  return new Promise((resolve) => {
    let i = 0, timer = null, typing = false, started = false;
    const show = () => {
      started = true;
      const line = lines[i];
      mood = line.mood;
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
      setTimeout(() => { cancelAnimationFrame(raf); el.remove(); resolve(); }, 380);
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
