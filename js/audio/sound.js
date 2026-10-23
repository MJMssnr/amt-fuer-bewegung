// Klang ohne Audiodateien: WebAudio-Synthese.
// - Stimmen: pro Buchstabe ein kurzer Laut. Vokale über zwei Formant-Filter (F1/F2) grob modelliert,
//   Konsonanten als leises Klicken/Zischen. Jede Figur hat ein Stimmprofil (VOICES).
// - Natur (nur auf der Stadtkarte): leiser Wind + gelegentliches Vogelzwitschern.
// - Effekte: richtig / falsch / Münzen.
// Lautstärken werden in localStorage gespeichert.

const KEY = 'amt-fuer-bewegung.sound';
// Version 2: Sprache startet halb so laut wie vorher [W16]. Alte gespeicherte Werte werden einmal halbiert.
const settings = { voice: 0.3, nature: 0.35, sfx: 0.6, muted: false, ver: 2 };
try {
  const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
  if (saved.voice !== undefined && !(saved.ver >= 2)) saved.voice = Math.round(saved.voice * 50) / 100;
  Object.assign(settings, saved, { ver: 2 });
} catch { /* egal */ }

let ctx = null, buses = null, noiseBuf = null;

/** Muss nach einer Nutzeraktion aufgerufen werden (Autoplay-Regeln der Browser). */
export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    const master = ctx.createGain();
    master.connect(ctx.destination);
    buses = { master };
    for (const k of ['voice', 'nature', 'sfx']) { buses[k] = ctx.createGain(); buses[k].connect(master); }
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    applySettings();
  }
  if (ctx.state === 'suspended') ctx.resume();
}

function applySettings() {
  if (!buses) return;
  const m = settings.muted ? 0 : 1;
  buses.voice.gain.value = settings.voice * m;
  buses.nature.gain.value = settings.nature * m * 0.5;
  buses.sfx.gain.value = settings.sfx * m;
}
export const getSettings = () => ({ ...settings });
export function setSetting(k, v) {
  settings[k] = v;
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* egal */ }
  applySettings();
}

// ---------- Stimmen ----------

// Formanten (Hz) grob nach deutschen Vokalen
const FORMANTS = {
  a: [800, 1250], e: [450, 2000], i: [300, 2300], o: [450, 850], u: [320, 750],
  ä: [650, 1800], ö: [430, 1550], ü: [300, 1650], y: [300, 1650],
};
export const VOICES = {
  florian: { f0: 150, wave: 'sawtooth', fScale: 1.0, dur: 0.07, vib: 0, gain: 0.5, speed: 1 },
  frau_mittel: { f0: 215, wave: 'sawtooth', fScale: 1.12, dur: 0.075, vib: 0, gain: 0.45, speed: 1 },
  frau_alt: { f0: 245, wave: 'triangle', fScale: 1.08, dur: 0.09, vib: 7, gain: 0.6, speed: 0.8 },
  mann_duenn: { f0: 132, wave: 'triangle', fScale: 1.04, dur: 0.06, vib: 0, gain: 0.6, speed: 1.12 },
  mann_kraeftig: { f0: 98, wave: 'sawtooth', fScale: 0.88, dur: 0.085, vib: 0, gain: 0.55, speed: 0.92 },
};
export const voiceSpeed = (v) => VOICES[v]?.speed ?? 1;

/** Einen Buchstaben "sprechen". Gibt die empfohlene Pause danach (ms) zurück. */
export function speakChar(ch, voiceName, index = 0) {
  const lower = ch.toLowerCase();
  if (/[.!?…]/.test(ch)) return 260;
  if (/[,;:–-]/.test(ch)) return 140;
  if (ch === ' ') return 45;
  const v = VOICES[voiceName];
  if (!v || !ctx || settings.muted || settings.voice <= 0) return 28;
  const t = ctx.currentTime;
  if (FORMANTS[lower]) {
    // Satzmelodie: leicht schwankende Tonhöhe
    const f0 = v.f0 * (1 + 0.06 * Math.sin(index * 0.9) + (ch === ch.toUpperCase() && ch !== lower ? 0.05 : 0));
    const osc = ctx.createOscillator();
    osc.type = v.wave;
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.linearRampToValueAtTime(f0 * 0.94, t + v.dur);
    if (v.vib) {
      const lfo = ctx.createOscillator(), lg = ctx.createGain();
      lfo.frequency.value = v.vib; lg.gain.value = f0 * 0.03;
      lfo.connect(lg).connect(osc.frequency); lfo.start(t); lfo.stop(t + v.dur + 0.02);
    }
    const out = ctx.createGain();
    out.gain.setValueAtTime(0, t);
    out.gain.linearRampToValueAtTime(v.gain, t + 0.012);
    out.gain.exponentialRampToValueAtTime(0.001, t + v.dur);
    for (const [i, f] of FORMANTS[lower].entries()) {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = f * v.fScale; bp.Q.value = i === 0 ? 6 : 9;
      const g = ctx.createGain(); g.gain.value = i === 0 ? 1 : 0.6;
      osc.connect(bp).connect(g).connect(out);
    }
    out.connect(buses.voice);
    osc.start(t); osc.stop(t + v.dur + 0.02);
    return 34;
  }
  if (/[a-zß]/i.test(ch)) {
    // Konsonant: Zischlaute hell, andere als kurzes, gedämpftes Klicken
    const hiss = /[szßcfx]/.test(lower);
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = hiss ? 'highpass' : 'bandpass';
    f.frequency.value = hiss ? 4500 : 1400 * v.fScale; f.Q.value = 1;
    const g = ctx.createGain(); const d = hiss ? 0.05 : 0.02;
    g.gain.setValueAtTime(hiss ? 0.08 : 0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
    src.connect(f).connect(g).connect(buses.voice);
    src.start(t, Math.random() * 0.5, d + 0.01);
    return 24;
  }
  return 20;
}

// ---------- Effekte ----------

function tone(freq, start, dur, type = 'square', gain = 0.15) {
  const t = ctx.currentTime + start;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(buses.sfx); o.start(t); o.stop(t + dur + 0.02);
}
export function sfx(name) {
  if (!ctx || settings.muted) return;
  if (name === 'ok') { tone(660, 0, 0.12); tone(990, 0.1, 0.18); }
  else if (name === 'bad') { tone(220, 0, 0.16, 'square', 0.1); tone(160, 0.12, 0.22, 'square', 0.1); }
  else if (name === 'coin') { tone(988, 0, 0.08, 'square', 0.1); tone(1319, 0.07, 0.25, 'square', 0.1); }
  else if (name === 'whistle') whistle();
  else if (name === 'bell') { tone(2100, 0, 0.12, 'sine', 0.12); tone(2100, 0.16, 0.25, 'sine', 0.1); }
}

/** Trillerpfeife (Sportunterricht) für den g.Z.-Polizisten: hoher Ton mit schnellem Triller */
function whistle() {
  const t = ctx.currentTime;
  const o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
  o.type = 'sine'; o.frequency.value = 2900;
  lfo.type = 'square'; lfo.frequency.value = 28; lg.gain.value = 180;
  lfo.connect(lg).connect(o.frequency);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.16, t + 0.02);
  g.gain.setValueAtTime(0.16, t + 0.18); g.gain.linearRampToValueAtTime(0.05, t + 0.24);
  g.gain.linearRampToValueAtTime(0.18, t + 0.3); g.gain.setValueAtTime(0.18, t + 0.7);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.85);
  o.connect(g).connect(buses.sfx);
  o.start(t); lfo.start(t); o.stop(t + 0.9); lfo.stop(t + 0.9);
}

// ---------- Natur (Stadtkarte) ----------

let nature = null;
export function natureOn() {
  if (!ctx || nature) return;
  // Wind: tiefpassgefiltertes Rauschen, langsam schwankend
  const src = ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 500;
  const g = ctx.createGain(); g.gain.value = 0.05;
  const lfo = ctx.createOscillator(), lg = ctx.createGain();
  lfo.frequency.value = 0.08; lg.gain.value = 0.03; lfo.connect(lg).connect(g.gain);
  src.connect(lp).connect(g).connect(buses.nature);
  src.start(); lfo.start();
  const chirp = () => {
    if (!nature) return;
    const n = 2 + Math.floor(Math.random() * 4), base = 2600 + Math.random() * 1600;
    for (let i = 0; i < n; i++) {
      const t = ctx.currentTime + i * (0.09 + Math.random() * 0.05);
      const o = ctx.createOscillator(), gg = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(base, t); o.frequency.exponentialRampToValueAtTime(base * (1.2 + Math.random() * 0.4), t + 0.06);
      gg.gain.setValueAtTime(0, t); gg.gain.linearRampToValueAtTime(0.12, t + 0.01); gg.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      o.connect(gg).connect(buses.nature); o.start(t); o.stop(t + 0.1);
    }
    nature.timer = setTimeout(chirp, 1500 + Math.random() * 4500);
  };
  nature = { src, lfo, timer: setTimeout(chirp, 800) };
}
export function natureOff() {
  if (!nature) return;
  clearTimeout(nature.timer);
  try { nature.src.stop(); nature.lfo.stop(); } catch { /* egal */ }
  nature = null;
}

// ---------- Motor (Rennmotorrad auf der Karte) [W26] ----------
let engine = null;
export function engineStart() {
  if (!ctx || engine || settings.muted) return;
  const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
  o1.type = 'sawtooth'; o2.type = 'square'; lp.type = 'lowpass'; lp.frequency.value = 900;
  o1.frequency.value = 55; o2.frequency.value = 27.5; g.gain.value = 0;
  o1.connect(lp); o2.connect(lp); lp.connect(g).connect(buses.sfx);
  o1.start(); o2.start();
  g.gain.linearRampToValueAtTime(0.09, ctx.currentTime + 0.08);
  engine = { o1, o2, lp, g };
}
/** frac 0…1 (Leerlauf bis Vollgas) */
export function engineSet(frac) {
  if (!engine) return;
  const f = 55 + 150 * frac, now = ctx.currentTime;
  engine.o1.frequency.setTargetAtTime(f, now, 0.05);
  engine.o2.frequency.setTargetAtTime(f / 2, now, 0.05);
  engine.lp.frequency.setTargetAtTime(700 + 2200 * frac, now, 0.05);
}
export function engineStop() {
  if (!engine) return;
  const e = engine; engine = null;
  e.g.gain.setTargetAtTime(0, ctx.currentTime, 0.12);
  setTimeout(() => { try { e.o1.stop(); e.o2.stop(); } catch { /* egal */ } }, 600);
}
