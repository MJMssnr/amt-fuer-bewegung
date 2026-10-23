// Scroll-Pfeile am Rand [W28]: Wenn eine Aufgabenspalte länger ist als der Bildschirm (Handy quer),
// erscheinen ▲/▼-Knöpfe am rechten Rand der Spalte. Antippen scrollt um ein gutes Stück.

export function scrollArrows(root) {
  const cleanups = [];
  for (const col of root.querySelectorAll('.task-right, .task-left')) {
    const wrap = document.createElement('div');
    wrap.className = 'scroll-arrows';
    wrap.innerHTML = '<button type="button" class="sa-up" aria-label="nach oben scrollen">▲</button><button type="button" class="sa-down" aria-label="nach unten scrollen">▼</button>';
    col.style.position = 'relative';
    col.parentElement.appendChild(wrap);
    const up = wrap.querySelector('.sa-up'), down = wrap.querySelector('.sa-down');
    const place = () => {
      const r = col.getBoundingClientRect(), p = col.parentElement.getBoundingClientRect();
      wrap.style.left = `${r.right - p.left - 34}px`; wrap.style.top = `${r.top - p.top}px`; wrap.style.height = `${r.height}px`;
      const more = col.scrollHeight > col.clientHeight + 6;
      up.classList.toggle('hidden', !more || col.scrollTop < 4);
      down.classList.toggle('hidden', !more || col.scrollTop + col.clientHeight > col.scrollHeight - 4);
    };
    const by = (d) => col.scrollBy({ top: d * col.clientHeight * 0.7, behavior: 'smooth' });
    up.addEventListener('click', () => by(-1));
    down.addEventListener('click', () => by(1));
    col.addEventListener('scroll', place, { passive: true });
    const ro = new ResizeObserver(place); ro.observe(col);
    const mo = new MutationObserver(() => requestAnimationFrame(place)); mo.observe(col, { childList: true, subtree: true });
    setTimeout(place, 300);
    cleanups.push(() => { ro.disconnect(); mo.disconnect(); wrap.remove(); });
  }
  return () => cleanups.forEach((f) => f());
}
