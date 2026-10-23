// Freischaltplan aus data/tickets.json erzeugen [W16]:
//   node tools/questplan.mjs            -> docs/QUESTPLAN.md (Mermaid, rendert direkt auf GitHub) + docs/questplan.dot
//   dot -Tpng docs/questplan.dot -o docs/questplan.png   (Graphviz, für das PNG)
// Pfeil A → B heißt: B wird frei, wenn A erledigt ist (B braucht alle eingehenden Pfeile).

import { readFileSync, writeFileSync } from 'node:fs';
import { TYPES } from '../js/tasks/types.js';

const root = new URL('../', import.meta.url);
const tickets = JSON.parse(readFileSync(new URL('data/tickets.json', root)));
const story = JSON.parse(readFileSync(new URL('data/story.json', root)));
const map = JSON.parse(readFileSync(new URL('data/map.json', root)));

const id = (s) => s.replace(/[^a-zA-Z0-9]/g, '_');
const who = (t) => (story.characters[t.from]?.name ?? t.from).split(',')[0];
const L = (t) => TYPES[t.task.type]?.letter ?? '?';
const COLORS = { A: '#ffcd75', B: '#f6a6b2', C: '#a7f070', D: '#c7a6ff', E: '#ff9f7a', F: '#73eff7', G: '#ffe8a3',
  H: '#9fc5ff', I: '#b6e3b0', J: '#f0b0e0', K: '#d9d9a0', L: '#a0d9d0', M: '#e0c8a8', N: '#c8d8f0', O: '#f0d0a0' };

// Mermaid
const mm = ['flowchart LR'];
for (const t of tickets) mm.push(`  ${id(t.id)}["<b>${L(t)}</b> ${t.title.replace(/"/g, "'")}<br/><small>${who(t)} · ${map.nodes[t.node]?.name ?? t.node} · ${t.reward} €</small>"]:::t${L(t)}`);
for (const t of tickets) for (const r of t.requires || []) mm.push(`  ${id(r)} --> ${id(t.id)}`);
for (const [k, c] of Object.entries(COLORS)) mm.push(`  classDef t${k} fill:${c},stroke:#1a1c2c,color:#1a1c2c`);

const starts = tickets.filter((t) => !(t.requires || []).length).map((t) => t.title);
const md = `# Freischaltplan der Aufträge

> Automatisch erzeugt mit \`node tools/questplan.mjs\` aus \`data/tickets.json\` – **nicht von Hand bearbeiten**.
> Pfeil X → Y: Y wird frei, sobald X erledigt ist. Hat Y mehrere eingehende Pfeile, müssen **alle** erledigt sein.
> Buchstabe = Aufgabentyp (siehe Legende). PNG: \`docs/questplan.png\`.

Startaufträge (sofort frei): ${starts.join(', ')}.
Anzahl Aufträge: ${tickets.length}, verdienbar: ${tickets.reduce((s, t) => s + t.reward, 0)} €.

\`\`\`mermaid
${mm.join('\n')}
\`\`\`

## Legende
| Buchstabe | Typ | Aufträge |
|---|---|---|
${Object.entries(TYPES).map(([k, v]) => `| ${v.letter} | ${v.name} | ${tickets.filter((t) => t.task.type === k).length} |`).join('\n')}

## Liste
| Auftrag | Typ | von | Ort | Lohn | braucht |
|---|---|---|---|---|---|
${tickets.map((t) => `| ${t.title} | ${L(t)} | ${who(t)} | ${map.nodes[t.node]?.name ?? t.node} | ${t.reward} € | ${(t.requires || []).map((r) => tickets.find((x) => x.id === r)?.title ?? r).join(', ') || '–'} |`).join('\n')}
`;
writeFileSync(new URL('docs/QUESTPLAN.md', root), md);

// Graphviz
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const dot = [`digraph Q {`, `  rankdir=LR; bgcolor="#fffdf6"; nodesep=0.25; ranksep=0.5;`,
  `  node [shape=box style="rounded,filled" fontname="Helvetica" fontsize=11 color="#1a1c2c" penwidth=1.5];`,
  `  edge [color="#29366f" arrowsize=0.7];`,
  `  label=<<b>Amt für Bewegung – Freischaltplan</b><br/>Pfeil = wird frei nach; Buchstabe = Aufgabentyp>; labelloc=t; fontname="Helvetica"; fontsize=16;`];
for (const t of tickets) dot.push(`  ${id(t.id)} [fillcolor="${COLORS[L(t)] ?? '#dddddd'}" label=<<b>${L(t)}</b>  ${esc(t.title)}<br/><font point-size="9">${esc(who(t))} · ${esc(map.nodes[t.node]?.name ?? t.node)} · ${t.reward} €</font>>];`);
for (const t of tickets) for (const r of t.requires || []) dot.push(`  ${id(r)} -> ${id(t.id)};`);
dot.push('}');
writeFileSync(new URL('docs/questplan.dot', root), dot.join('\n'));
console.log(`QUESTPLAN.md + questplan.dot: ${tickets.length} Aufträge`);
