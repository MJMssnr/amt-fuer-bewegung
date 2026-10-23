// Kleine Fall-Animation für Typ Q [W30]: Querschnitt eines Brunnens, ein Kiesel fällt in Echtzeit (y ∝ t²)
// und platscht nach `t` Sekunden ins Wasser. Stoppuhr oben links. Nur Darstellung, keine Spiellogik.

const INK = '#1a1c2c';

/** box: Container; { t: Fallzeit in s, label } → { replay(), destroy() } */
export function dropScene(box, { t: T = 2, label = 'Brunnen' } = {}) {
  box.insertAdjacentHTML('beforeend', `<div class="scene-wrap drop-wrap"><canvas class="drop"></canvas>
    <div class="scene-ctrl"><button class="btn btn-play" type="button">↺</button><span class="drop-info">Nochmal fallen lassen</span></div></div>`);
  const cv = box.querySelector('canvas.drop'), ctx = cv.getContext('2d');
  let t0 = performance.now(), raf = 0, splash = 0;

  function draw(now) {
    const dpr = Math.min(window.devicePixelRatio || 1, 3), r = cv.getBoundingClientRect();
    if (r.width && (cv.width !== Math.round(r.width * dpr) || cv.height !== Math.round(r.height * dpr))) {
      cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
    }
    const W = cv.width, H = cv.height, u = H / 100; // 100 Einheiten hoch
    const t = Math.min(T, (now - t0) / 1000 - 0.6);
    // Himmel, Wiese, Erdreich
    ctx.fillStyle = '#9fd6f2'; ctx.fillRect(0, 0, W, 18 * u);
    ctx.fillStyle = '#38b764'; ctx.fillRect(0, 18 * u, W, 4 * u);
    ctx.fillStyle = '#7a5235'; ctx.fillRect(0, 22 * u, W, H);
    for (let i = 0; i < 40; i++) { ctx.fillStyle = i % 2 ? '#6b4226' : '#8a6040'; ctx.fillRect(((i * 97) % 100) / 100 * W, (24 + ((i * 53) % 74)) * u, 3 * u, 2 * u); }
    // Schacht mit Mauersteinen
    const sx = W / 2 - 9 * u, sw = 18 * u, top = 18 * u, water = 92 * u;
    ctx.fillStyle = '#2a2e45'; ctx.fillRect(sx, top, sw, H - top);
    for (let y = top; y < H; y += 5 * u) for (const x of [sx - 4 * u, sx + sw]) { ctx.fillStyle = (y / u) % 10 < 5 ? '#94b0c2' : '#566c86'; ctx.fillRect(x, y, 4 * u, 4.4 * u); }
    // Brunnenrand oben
    ctx.fillStyle = '#c2c7cf'; ctx.fillRect(sx - 7 * u, top - 6 * u, sw + 14 * u, 6 * u); ctx.fillStyle = INK; ctx.fillRect(sx - 7 * u, top - 6 * u, sw + 14 * u, 0.8 * u);
    // Wasser
    ctx.fillStyle = '#3b5dc9'; ctx.fillRect(sx, water, sw, H - water);
    ctx.fillStyle = '#73eff7'; ctx.fillRect(sx, water, sw, 0.8 * u);
    // Stein
    const y = top - 3 * u + (t > 0 ? (t / T) ** 2 : 0) * (water - top + 1 * u);
    if (t < T) { ctx.fillStyle = INK; ctx.fillRect(W / 2 - 3 * u, y - 3 * u, 6 * u, 6 * u); ctx.fillStyle = '#c2c7cf'; ctx.fillRect(W / 2 - 2 * u, y - 2 * u, 4 * u, 4 * u); ctx.fillStyle = '#f4f4f4'; ctx.fillRect(W / 2 - 2 * u, y - 2 * u, 1.5 * u, 1.5 * u); }
    else {
      if (!splash) splash = now;
      const a = Math.min(1, (now - splash) / 600);
      ctx.fillStyle = `rgba(115,239,247,${1 - a})`;
      for (const dx of [-6, -3, 0, 3, 6]) ctx.fillRect(W / 2 + dx * u - u, water - (8 - Math.abs(dx)) * a * u * 1.4, 2 * u, 2 * u);
      if (a < 1) { ctx.font = `${7 * u}px "AmtPixel", monospace`; ctx.fillStyle = '#f4f4f4'; ctx.textAlign = 'center'; ctx.fillText('PLATSCH!', W / 2, water - 10 * u); }
    }
    // Stoppuhr
    ctx.fillStyle = 'rgba(26,28,44,0.8)'; ctx.fillRect(4 * u, 4 * u, 46 * u, 10 * u);
    ctx.font = `${7.5 * u}px "AmtPixel", monospace`; ctx.textAlign = 'left'; ctx.fillStyle = '#f4f4f4';
    ctx.fillText(`t = ${Math.max(0, t).toFixed(2).replace('.', ',')} s`, 6 * u, 11.8 * u);
    ctx.font = `${6 * u}px "AmtPixel", monospace`; ctx.textAlign = 'right'; ctx.fillStyle = INK; ctx.fillText(label, W - 4 * u, 12 * u);
    raf = requestAnimationFrame(draw);
  }
  const replay = () => { t0 = performance.now(); splash = 0; };
  box.querySelector('.btn-play').addEventListener('click', replay);
  cv.addEventListener('pointerdown', replay);
  raf = requestAnimationFrame(draw);
  return { replay, destroy: () => cancelAnimationFrame(raf) };
}
