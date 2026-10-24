// Passwort-Tor bauen [W45]: verschlüsselt das ganze Spiel nach dist/spiel.enc und legt das Tor daneben.
// Aufruf:  AMT_PASSWORT='…' node tools/encrypt.mjs
// Das Passwort steht NIE im Repo. dist/ wird nicht eingecheckt, sondern veröffentlicht (GitHub Action oder Cloudflare/Netlify).
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync, copyFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { seal } from './tor/tor-crypto.js';

const ROOT = new URL('..', import.meta.url).pathname, DIST = join(ROOT, 'dist');
const pw = process.env.AMT_PASSWORT;
if (!pw) { console.error('Bitte Passwort setzen: AMT_PASSWORT=… node tools/encrypt.mjs'); process.exit(1); }

const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const files = {};
for (const dir of ['js', 'data', 'css']) for (const p of walk(join(ROOT, dir))) files[relative(ROOT, p)] = readFileSync(p);
files['assets/sprites.json'] = readFileSync(join(ROOT, 'assets/sprites.json'));
files['spiel.html'] = readFileSync(join(ROOT, 'index.html')); // das eigentliche Spiel

const SALT = new Uint8Array(Buffer.from(readFileSync(join(ROOT, 'tools/tor/salz.hex'), 'utf8').trim(), 'hex'));
const pack = await seal(files, pw, SALT);
mkdirSync(DIST, { recursive: true }); // Inhalt leeren, Ordner behalten (laufender Testserver)
for (const f of readdirSync(DIST)) rmSync(join(DIST, f), { recursive: true, force: true });
mkdirSync(join(DIST, 'assets/fonts'), { recursive: true }); mkdirSync(join(DIST, 'css'), { recursive: true });
writeFileSync(join(DIST, 'spiel.enc'), pack);
writeFileSync(join(DIST, 'version.json'), JSON.stringify({ v: createHash('sha256').update(pack).digest('hex').slice(0, 12) }));
for (const f of ['index.html', 'sw.js', 'tor-crypto.js']) copyFileSync(join(ROOT, 'tools/tor', f), join(DIST, f));
copyFileSync(join(ROOT, 'css/fonts.css'), join(DIST, 'css/fonts.css')); // Schriften sind frei (OFL), nicht geheim
for (const f of readdirSync(join(ROOT, 'assets/fonts'))) copyFileSync(join(ROOT, 'assets/fonts', f), join(DIST, 'assets/fonts', f));
writeFileSync(join(DIST, '.nojekyll'), '');
console.log(`dist/ fertig: ${Object.keys(files).length} Dateien verschlüsselt, ${(pack.length / 1024).toFixed(0)} KB`);
