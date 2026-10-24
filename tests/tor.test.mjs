// Passwort-Tor [W45]: Paket nur mit dem richtigen Passwort lesbar, Schlüssel übersteht Neubau (festes Salz)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { seal, open, deriveKey, saltOf, exportKey, importKey } from '../tools/tor/tor-crypto.js';

const salt = new Uint8Array(16).fill(7);
const files = { 'js/main.js': new TextEncoder().encode('console.log("Amt")'), 'data/x.json': new Uint8Array([1, 2, 3]) };

test('richtiges Passwort öffnet, falsches nicht', async () => {
  const pack = await seal(files, 'BewegungIstToll!', salt);
  assert.ok(!new TextDecoder().decode(pack).includes('Amt'), 'Klartext im Paket');
  const ok = await open(pack, await deriveKey('BewegungIstToll!', saltOf(pack)));
  assert.equal(new TextDecoder().decode(ok['js/main.js']), 'console.log("Amt")');
  await assert.rejects(open(pack, await deriveKey('bewegungisttoll!', saltOf(pack))));
});

test('gemerkter Schlüssel öffnet auch einen Neubau', async () => {
  const k = await exportKey(await deriveKey('pw', salt));
  const pack2 = await seal(files, 'pw', salt);
  const r = await open(pack2, await importKey(k));
  assert.deepEqual([...r['data/x.json']], [1, 2, 3]);
});
