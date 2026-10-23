// Auftragsbuch (Questlog): welche Aufträge offen/erledigt sind, von wem, wo, welcher Typ [W16].
// Im Testmodus (?test=1 oder Strg+Shift+T) zusätzlich: gesperrte Aufträge sehen, starten, abhaken, zurücksetzen.

import { TYPES, typeOf } from '../tasks/types.js';

const STATUS = {
  perfect: ['✔', 'voll gelöst', 'st-perfect'],
  partial: ['◐', 'halb gelöst', 'st-partial'],
  fail: ['✘', 'verpatzt', 'st-fail'],
  retry: ['↻', 'Nachfrage offen', 'st-retry'],
  open: ['●', 'offen', 'st-open'],
  locked: ['🔒', 'gesperrt', 'st-locked'],
};

/** Status eines Auftrags aus dem Spielstand */
export function statusOf(t, state, { isOpen, isRetry }) {
  if (state.retry?.[t.id]) return isRetry(t) ? 'retry' : 'fail';
  if (state.done[t.id]) return state.grades?.[t.id] ?? 'perfect';
  return isOpen(t) ? 'open' : 'locked';
}

const earned = (t, st) => (st === 'perfect' ? t.reward : st === 'partial' ? Math.ceil(t.reward / 2) : 0);
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
    const order = { retry: 0, open: 1, fail: 2, partial: 3, perfect: 4, locked: 5 };
    rows.sort((a, b) => order[a.st] - order[b.st]);
    const sum = rows.reduce((s, r) => s + earned(r.t, r.st), 0);
    body.innerHTML = `
      <table class="ql-table">
        <thead><tr><th></th><th title="Aufgabentyp">Typ</th><th>Auftrag</th><th>von</th><th>Ort</th><th class="num">Lohn</th>${test ? '<th>Test</th>' : ''}</tr></thead>
        <tbody>${rows.map(({ t, st }) => {
          const [icon, label, cls] = STATUS[st];
          const ty = typeOf(t.task.type);
          return `<tr class="${cls}" data-id="${esc(t.id)}">
            <td class="ql-st" title="${label}">${icon}</td>
            <td><span class="type-badge" title="${esc(ty.name)}">${ty.letter}</span></td>
            <td>${esc(t.title)}<small>${label}</small></td>
            <td>${esc(ctx.characters[t.from]?.name ?? t.from)}</td>
            <td>${esc(ctx.nodes[t.node]?.name ?? t.node)}</td>
            <td class="num">${['perfect', 'partial', 'fail', 'retry'].includes(st) ? `${earned(t, st)} / ${t.reward} €` : `${t.reward} €`}</td>
            ${test ? `<td class="ql-test"><button data-a="play" title="Starten">▶</button><button data-a="perfect" title="Als voll gelöst abhaken">✔</button><button data-a="partial" title="Als halb gelöst">◐</button><button data-a="fail" title="Als verpatzt (Nachfrage)">✘</button><button data-a="reset" title="Zurücksetzen">↺</button></td>` : ''}
          </tr>`;
        }).join('')}</tbody>
      </table>
      <p class="ql-sum">Verdient mit diesen Aufträgen: <b>${sum} €</b></p>
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
  });
}
