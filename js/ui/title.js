// Demo-Hinweis und Startbildschirm.

import { TitleScene } from './title-scene.js';

/** Hinweis vor dem Start. Löst sich beim Klick auf "Los geht's". */
export function showNotice() {
  const el = document.getElementById('notice');
  el.classList.remove('hidden');
  return new Promise((resolve) => {
    el.querySelector('.notice-ok').addEventListener('click', () => { el.classList.add('hidden'); resolve(); }, { once: true });
  });
}

/** Startbildschirm. Rückgabe: 'new' | 'continue' */
export function showTitle(hasSave) {
  const el = document.getElementById('title');
  el.classList.remove('hidden');
  // Logo-Buchstaben einzeln, damit sie wellenförmig hüpfen
  const logo = el.querySelector('.logo-main');
  if (!logo.dataset.done) {
    logo.innerHTML = [...logo.textContent].map((ch, i) =>
      ch === ' ' ? '<span class="sp"> </span>' : `<span style="animation-delay:${(i * 0.07).toFixed(2)}s">${ch}</span>`).join('');
    logo.dataset.done = '1';
  }
  const scene = new TitleScene(el.querySelector('canvas'));
  scene.start();
  const btnNew = el.querySelector('.title-new');
  const btnCont = el.querySelector('.title-continue');
  btnCont.classList.toggle('hidden', !hasSave);
  btnNew.textContent = hasSave ? 'Neu beginnen' : 'Dienst antreten ▶';
  btnNew.classList.toggle('secondary', hasSave);
  return new Promise((resolve) => {
    const done = (v) => { scene.stop(); el.classList.add('hidden'); resolve(v); };
    btnCont.onclick = () => done('continue');
    btnNew.onclick = () => {
      if (hasSave && !confirm('Wirklich neu beginnen? Der bisherige Spielstand wird gelöscht.')) return;
      done('new');
    };
  });
}
