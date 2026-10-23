// Auftragsbuch (Questlog): welche Aufträge offen/erledigt sind, von wem, wo, welcher Typ [W16].
// Im Testmodus (?test=1 oder Strg+Shift+T) zusätzlich: gesperrte Aufträge sehen, starten, abhaken, zurücksetzen.

import { TYPES, typeOf } from '../tasks/types.js';

// [Zeichen im Kreis, Text, CSS-Klasse] – grün ✓ voll, gelb ~ halb, rot ✕ verpatzt [W17]
const STATUS = {
  perfect: ['✓', 'voller Erfolg', 'st-perfect'],
  partial: ['~', 'halber Erfolg', 'st-partial'],
  fail: ['✕', 'verpatzt – Nachfrage kommt', 'st-fail'],
  retry: ['✕', 'verpatzt – Nachfrage wartet jetzt', 'st-retry'],
  open: ['', 'offen', 'st-open'],
  locked: ['🔒', 'gesperrt', 'st-locked'],
};

/** Status eines Auftrags aus dem Spielstand */
export function statusOf(t, state, { isOpen, isRetry }) {
  if (state.retry?.[t.id]) return isRetry(t) ? 'retry' : 'fail';
  if (state.done[t.id]) return state.grades?.[t.id] ?? 'perfect';
  return isOpen(t) ? 'open' : 'locked';
}

const gradeMoney = (t, st) => (st === 'perfect' ? t.reward : st === 'partial' ? Math.ceil(t.reward / 2) : 0);
/** Tatsächlich verdientes Geld (state.earned); ältere Spielstände: aus der Bewertung geschätzt */
const earnedOf = (t, st, state) => state.earned?.[t.id] ?? gradeMoney(t, st);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/**
 * ctx: { tickets, state, characters, nodes, isOpen, isRetry, test, actions:{ play, setGrade, reset, money } }
 * Liefert ein Promise, das beim Schließen auflöst.
 */
export function openQuestlog(ctx) {
  const box = document.getElementById('questlog');
  const body = box.querySelector('.ql-body');
  box.classList.toggle('test', ctx.test());

  function render() {
    const test = ctx.test();
    box.classList.toggle('test', test);
    const rows = ctx.tickets.map((t) => ({ t, st: statusOf(t, ctx.state, ctx) }))
      .filter((r) => test || r.st !== 'locked');
    // Reihenfolge der Annahme von oben nach unten; offene und gesperrte Aufträge darunter
    const seq = ctx.state.order ?? [];
    const pos = (r) => {
      const i = seq.indexOf(r.t.id);
      if (i >= 0) return i;
      if (ctx.state.done[r.t.id]) return seq.length + ctx.tickets.indexOf(r.t) / 1000;
      return 1e6 + (r.st === 'locked' ? 1e5 : 0) + ctx.tickets.indexOf(r.t);
    };
    rows.sort((a, b) => pos(a) - pos(b));
    const sum = rows.reduce((s, r) => s + (ctx.state.done[r.t.id] ? earnedOf(r.t, r.st, ctx.state) : 0), 0);
    body.innerHTML = `
      <table class="ql-table">
        <thead><tr><th>#</th><th></th><th title="Aufgabentyp">Typ</th><th>Auftrag</th><th>von</th><th>Ort</th><th class="num">Lohn</th>${test ? '<th>Test</th>' : ''}</tr></thead>
        <tbody>${rows.map(({ t, st }, i) => {
          const [icon, label, cls] = STATUS[st];
          const ty = typeOf(t.task.type);
          return `<tr class="${cls}" data-id="${esc(t.id)}">
            <td class="ql-n">${ctx.state.done[t.id] ? i + 1 : ''}</td>
            <td class="ql-st" title="${label}"><span class="st-ico">${icon}</span></td>
            <td><span class="type-badge" title="${esc(ty.name)}">${ty.letter}</span></td>
            <td>${esc(t.title)}<small>${label}</small></td>
            <td>${esc(ctx.characters[t.from]?.name ?? t.from)}</td>
            <td>${esc(ctx.nodes[t.node]?.name ?? t.node)}</td>
            <td class="num">${ctx.state.done[t.id] ? `<b>${earnedOf(t, st, ctx.state)} €</b> <small>von ${t.reward} €</small>` : `<small>bis ${t.reward} €</small>`}</td>
            ${test ? `<td class="ql-test"><button data-a="play" title="Starten">▶</button><button data-a="perfect" title="Als voll gelöst abhaken">✔</button><button data-a="partial" title="Als halb gelöst">◐</button><button data-a="fail" title="Als verpatzt (Nachfrage)">✘</button><button data-a="reset" title="Zurücksetzen">↺</button></td>` : ''}
          </tr>`;
        }).join('')}</tbody>
      </table>
      ${rows.length ? '' : '<p class="ql-empty">Noch keine Aufträge. Tippe auf der Karte auf das Ausrufezeichen!</p>'}
      <p class="ql-sum">Verdient insgesamt: <b>${sum} €</b> &nbsp;·&nbsp; <span class="st-perfect"><span class="st-ico">✓</span></span> voll &nbsp; <span class="st-partial"><span class="st-ico">~</span></span> halb &nbsp; <span class="st-fail"><span class="st-ico">✕</span></span> verpatzt</p>
      <details class="ql-legend"><summary>Aufgabentypen (Buchstaben)</summary>
        <ul>${Object.values(TYPES).map((x) => `<li><span class="type-badge">${x.letter}</span> ${x.name}</li>`).join('')}</ul>
      </details>
      ${test ? '<p class="ql-testbar">🧪 Testmodus: <button data-a="money">+100 €</button> <button data-a="all">alle offenen abhaken</button> <button data-a="off">Testmodus aus</button></p>' : ''}`;
  }

  return new Promise((resolve) => {
    const onClick = async (e) => {
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      const a = b.dataset.a, id = b.closest('tr')?.dataset.id;
      const t = ctx.tickets.find((x) => x.id === id);
      if (a === 'money') ctx.actions.money(100);
      else if (a === 'off') ctx.actions.testOff();
      else if (a === 'all') ctx.tickets.filter((x) => !ctx.state.done[x.id]).forEach((x) => ctx.actions.setGrade(x, 'perfect'));
      else if (a === 'play' && t) { close(); ctx.actions.play(t); return; }
      else if (a === 'reset' && t) ctx.actions.reset(t);
      else if (t) ctx.actions.setGrade(t, a);
      render();
    };
    const close = () => {
      box.classList.add('hidden');
      body.removeEventListener('click', onClick);
      resolve();
    };
    body.addEventListener('click', onClick);
    box.querySelector('.ql-close').onclick = close;
    render();
    box.classList.remove('hidden');
    // Buch fliegt heran und klappt auf (ca. 1 s), siehe css/questlog.css
    box.classList.remove('opening');
    void box.offsetWidth;
    box.classList.add('opening');
  });
}
