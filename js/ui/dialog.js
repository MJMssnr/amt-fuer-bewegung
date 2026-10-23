// Dialogboxen mit Porträt und Schreibmaschinen-Effekt.
// Zeilen-Format (wie in story.json/tickets.json): [ "sprecherId", "Text" ]

import { getSprite } from '../render/pixel.js';

let characters = {};
export const setCharacters = (c) => (characters = c);

function portrait(spriteName) {
  const c = document.createElement('canvas');
  if (!spriteName) return c;
  const sp = getSprite(spriteName);
  const s = Math.max(1, Math.floor(56 / Math.max(sp.w, sp.h)));
  c.width = sp.w * s; c.height = sp.h * s;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sp.frames[0], 0, 0, c.width, c.height);
  return c;
}

/** Zeigt Dialogzeilen nacheinander. Tippen: Text sofort fertig, nochmal tippen: weiter. */
export function showDialog(lines) {
  const box = document.getElementById('dialog');
  return new Promise((resolve) => {
    let i = 0, timer = null, full = '', typing = false;
    const textEl = box.querySelector('.d-text');
    const nameEl = box.querySelector('.d-name');
    const picEl = box.querySelector('.d-pic');

    const show = () => {
      const [who, text] = lines[i];
      const ch = characters[who] || { name: who, sprite: null };
      nameEl.textContent = ch.name || '';
      nameEl.classList.toggle('hidden', !ch.name);
      picEl.replaceChildren(portrait(ch.sprite));
      picEl.classList.toggle('hidden', !ch.sprite);
      box.classList.toggle('narrator', !ch.sprite);
      full = text;
      let n = 0;
      typing = true;
      textEl.textContent = '';
      clearInterval(timer);
      timer = setInterval(() => {
        n += 2;
        textEl.textContent = full.slice(0, n);
        if (n >= full.length) { clearInterval(timer); typing = false; }
      }, 18);
    };

    const next = (e) => {
      e?.preventDefault();
      if (typing) { clearInterval(timer); textEl.textContent = full; typing = false; return; }
      i++;
      if (i >= lines.length) {
        box.classList.add('hidden');
        box.removeEventListener('pointerup', next);
        document.removeEventListener('keydown', onKey);
        resolve();
      } else show();
    };
    const onKey = (e) => { if (e.key === ' ' || e.key === 'Enter') next(e); };

    box.classList.remove('hidden');
    box.addEventListener('pointerup', next);
    document.addEventListener('keydown', onKey);
    show();
  });
}

/** Kurze Einblendung, z. B. "+50 €". */
export function toast(text, cls = '') {
  const t = document.createElement('div');
  t.className = `toast ${cls}`;
  t.textContent = text;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}
