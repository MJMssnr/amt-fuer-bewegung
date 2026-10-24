// Passwort-Tor [W45]: Verschlüsselung des ganzen Spiels mit dem Passwort (läuft in Node 22 und im Browser).
// PBKDF2-SHA-256 (600 000 Runden) leitet aus Passwort + Salz einen AES-256-GCM-Schlüssel ab.
// Paketformat: 4 Byte Kennung "AMT1" | 16 Byte Salz | 12 Byte IV | Geheimtext (mit GCM-Prüfsumme).
// Ohne Passwort ist der Inhalt nicht lesbar; ein falsches Passwort scheitert an der Prüfsumme.

const ITER = 600000;
const MAGIC = [65, 77, 84, 49]; // "AMT1"
const enc = new TextEncoder(), dec = new TextDecoder();
const subtle = () => globalThis.crypto.subtle;

export async function deriveKey(password, salt) {
  const base = await subtle().importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return subtle().deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITER }, base, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

/** files: { pfad: Uint8Array } → Uint8Array (Paket). Salz fest (nicht geheim), damit gemerkte Schlüssel
 *  Updates überstehen; nur ein neues Passwort macht neue Eingabe nötig. IV ist bei jedem Build neu. */
export async function seal(files, password, salt) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const json = JSON.stringify(Object.fromEntries(Object.entries(files).map(([p, b]) => [p, toB64(b)])));
  const ct = new Uint8Array(await subtle().encrypt({ name: 'AES-GCM', iv }, key, enc.encode(json)));
  const out = new Uint8Array(4 + 16 + 12 + ct.length);
  out.set(MAGIC, 0); out.set(salt, 4); out.set(iv, 20); out.set(ct, 32);
  return out;
}

/** Salz aus dem Paket (für die Schlüsselableitung) */
export function saltOf(pack) {
  if (MAGIC.some((m, i) => pack[i] !== m)) throw new Error('Kein Amt-Paket');
  return pack.slice(4, 20);
}

/** Paket mit Schlüssel öffnen → { pfad: Uint8Array }; wirft bei falschem Schlüssel */
export async function open(pack, key) {
  saltOf(pack);
  const pt = await subtle().decrypt({ name: 'AES-GCM', iv: pack.slice(20, 32) }, key, pack.slice(32));
  const obj = JSON.parse(dec.decode(pt));
  return Object.fromEntries(Object.entries(obj).map(([p, s]) => [p, fromB64(s)]));
}

export async function exportKey(key) { return toB64(new Uint8Array(await subtle().exportKey('raw', key))); }
export function importKey(b64) { return subtle().importKey('raw', fromB64(b64), { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']); }

function toB64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
function fromB64(s) { const bin = atob(s), out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }
