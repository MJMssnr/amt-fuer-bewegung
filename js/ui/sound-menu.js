// Kleines Klang-Menü im HUD: Stimmen, Natur (nur Stadtkarte), Effekte, Stumm.

import { getSettings, setSetting, unlockAudio, speakChar } from '../audio/sound.js';

const ROWS = [['voice', 'Stimmen'], ['nature', 'Natur (Karte)'], ['sfx', 'Effekte']];

export function initSoundMenu(btn) {
  const panel = document.createElement('div');
  panel.className = 'sound-panel hidden';
  const s = getSettings();
  panel.innerHTML = ROWS.map(([k, label]) =>
    `<label>${label}<input type="range" min="0" max="1" step="0.05" data-k="${k}" value="${s[k]}"></label>`).join('') +
    `<label class="sp-mute"><input type="checkbox" ${s.muted ? 'checked' : ''}> stumm</label>`;
  document.body.appendChild(panel);
  const icon = () => { btn.textContent = getSettings().muted ? '🔇' : '🔊'; };
  icon();

  panel.querySelectorAll('input[type=range]').forEach((r) => r.addEventListener('input', () => {
    setSetting(r.dataset.k, +r.value);
    // Hörprobe beim Stimmen-Regler
    if (r.dataset.k === 'voice') [...'Hallo'].forEach((c, i) => setTimeout(() => speakChar(c, 'florian', i), i * 45));
  }));
  panel.querySelector('.sp-mute input').addEventListener('change', (e) => { setSetting('muted', e.target.checked); icon(); });
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    unlockAudio();
    panel.classList.toggle('hidden');
  });
  document.addEventListener('pointerdown', (e) => {
    if (!panel.contains(e.target) && e.target !== btn) panel.classList.add('hidden');
  });
}
