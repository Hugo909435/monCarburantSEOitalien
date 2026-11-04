import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createServer as createTcpServer } from 'node:net';
import { once } from 'node:events';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { csvDate, validateDatasets, extractionTimestamp, requestText, downloadCsv } from './fuel-download.js';
import { checkSnapshot, verifyDeployment } from './verify-deployment.js';

const date = '2026-11-03';
const now = new Date('2026-11-04T10:00:00Z');
const csv = (name, day = date) => `Estrazione del ${day}\n${name === 'prezzi'
  ? 'idImpianto|descCarburante|prezzo|isSelf|dtComu\n1|Benzina|1.8|1|03/11/2026 08:00:00'
  : 'idImpianto|Gestore|Bandiera|Tipo Impianto|Nome Impianto|Indirizzo|Comune|Provincia|Latitudine|Longitudine\n1|G|Eni|Stradale|N|Via Roma|Roma|RM|41.9|12.5'}\n`;

async function server(t, handler) {
  const instance = createServer(handler);
  instance.listen(0, '127.0.0.1');
  await once(instance, 'listening');
  t.after(() => { instance.closeAllConnections(); instance.close(); });
  return `http://127.0.0.1:${instance.address().port}`;
}

test('CSV: accepte BOM/CRLF et refuse HTML, en-tête modifié, date impossible et fichier vide', () => {
  assert.equal(csvDate('prezzi', '\uFEFF' + csv('prezzi').replaceAll('\n', '\r\n')), date);
  for (const text of ['<html>maintenance</html>', csv('prezzi').replaceAll('|', ';'), csv('prezzi', '2026-02-30'), csv('prezzi').split('\n').slice(0, 2).join('\n')]) {
    assert.throws(() => csvDate('prezzi', text));
  }
});

test('refuse les extractions périmées, futures et de dates différentes avant génération', () => {
  assert.equal(validateDatasets(csv('impianti'), csv('prezzi'), { now }), date);
  assert.throws(() => validateDatasets(csv('impianti', '2026-10-15'), csv('prezzi', '2026-10-15'), { now }), /3 giorni/);
  assert.throws(() => validateDatasets(csv('impianti', '2026-11-05'), csv('prezzi', '2026-11-05'), { now }), /futura/);
  assert.throws(() => validateDatasets(csv('impianti'), csv('prezzi', '2026-11-02'), { now }), /diverse/);
});

test('mode offline explicite : anciennes données permises, formats et cohérence toujours contrôlés', () => {
  const offline = { offline: true, now };
  assert.equal(validateDatasets(csv('impianti', '2026-10-11'), csv('prezzi', '2026-10-11'), offline), '2026-10-11');
  assert.throws(() => validateDatasets(csv('impianti'), '<html/>', offline));
  assert.throws(() => validateDatasets(csv('impianti'), csv('prezzi', '2026-11-02'), offline));
});

test('la fraîcheur suit le calendrier italien, y compris autour de minuit', () => {
  assert.equal(validateDatasets(csv('impianti', '2026-11-05'), csv('prezzi', '2026-11-05'), { now: new Date('2026-11-04T23:30:00Z') }), '2026-11-05');
  assert.throws(() => validateDatasets(csv('impianti', '2026-10-31'), csv('prezzi', '2026-10-31'), { now }), /3 giorni/);
});

test('heure de relevé : décalage hiver/été de Rome', () => {
  assert.equal(extractionTimestamp('2026-11-03'), '2026-11-03T08:00:00+01:00');
  assert.equal(extractionTimestamp('2026-07-03'), '2026-07-03T08:00:00+02:00');
});

test('réessaie un HTTP 503 et suit un redirect vers un CSV valide', async (t) => {
  let attempts = 0;
  const base = await server(t, (req, res) => {
    if (req.url === '/csv') { res.end(csv('prezzi')); return; }
    attempts++;
    if (attempts === 1) { res.writeHead(503); res.end('maintenance'); }
    else { res.writeHead(302, { Location: '/csv' }); res.end(); }
  });
  assert.equal(await downloadCsv('prezzi', base, { retryDelayMs: 1, log() {} }), csv('prezzi'));
  assert.equal(attempts, 2);
});

test('HTTP 404 non réessayé ; page HTML en 200 refusée après trois essais', async (t) => {
  let calls = 0;
  const base = await server(t, (req, res) => { calls++; if (req.url === '/404') res.writeHead(404); res.end('<html>indisponible</html>'); });
  await assert.rejects(downloadCsv('prezzi', base + '/404', { retryDelayMs: 1, log() {} }), /HTTP 404/);
  assert.equal(calls, 1);
  calls = 0;
  await assert.rejects(downloadCsv('prezzi', base, { retryDelayMs: 1, log() {} }), /CSV atteso/);
  assert.equal(calls, 3);
});

test('borne le temps de téléchargement même lorsque le corps reste bloqué', async (t) => {
  const base = await server(t, (_, res) => { res.writeHead(200); res.write('Estrazione del '); });
  await assert.rejects(requestText(base, { totalTimeoutMs: 100 }), /Download scaduto/);
});

test('borne explicitement le temps de connexion TLS', async (t) => {
  const sockets = new Set();
  const tcp = createTcpServer((socket) => { sockets.add(socket); socket.on('error', () => {}); });
  tcp.listen(0, '127.0.0.1');
  await once(tcp, 'listening');
  t.after(() => { for (const socket of sockets) socket.destroy(); tcp.close(); });
  await assert.rejects(requestText(`https://127.0.0.1:${tcp.address().port}`, { connectTimeoutMs: 100, totalTimeoutMs: 1000 }), /Connessione scaduta/);
});

test('refuse les réponses tronquées et trop volumineuses, limite les redirects', async (t) => {
  const base = await server(t, (req, res) => {
    if (req.url === '/loop') { res.writeHead(302, { Location: '/loop' }); res.end(); }
    else if (req.url === '/truncated') { res.writeHead(200, { 'Content-Length': '99999' }); res.end('short'); }
    else res.end('123456789');
  });
  await assert.rejects(requestText(base, { maxBytes: 3 }), /troppo grande/);
  await assert.rejects(requestText(base + '/truncated', { totalTimeoutMs: 200 }), /aborted|scaduto/);
  await assert.rejects(requestText(base + '/loop'), /HTTP 302/);
});

const expected = { lastUpdate: extractionTimestamp(date), totalStations: 21000 };
const html = `<time datetime="${expected.lastUpdate}">3 novembre</time>`;

test('contrôle public : exige des données récentes et identiques au build, ainsi que la date sur l’accueil', () => {
  checkSnapshot(expected, expected, html, now);
  assert.throws(() => checkSnapshot(expected, { ...expected, totalStations: 20000 }, html, now), /différentes/);
  assert.throws(() => checkSnapshot(expected, expected, '<html/>', now), /accueil/);
  assert.throws(() => checkSnapshot(expected, expected, html, new Date('2026-12-01')), /récentes/);
});

test('vérification publique : réessaie lorsque la copie servie est encore ancienne', async (t) => {
  const actualDate = new Date();
  const liveExpected = { ...expected, lastUpdate: `${actualDate.toISOString().slice(0, 10)}T08:00:00+01:00` };
  let metaCalls = 0;
  const base = await server(t, (req, res) => {
    if (req.url.startsWith('/data/')) {
      metaCalls++;
      res.end(JSON.stringify(metaCalls === 1 ? { ...liveExpected, totalStations: 20000 } : liveExpected));
    } else res.end(`<time datetime="${liveExpected.lastUpdate}"></time>`);
  });
  await verifyDeployment(liveExpected, base, { retryDelayMs: 1 });
  assert.equal(metaCalls, 2);
});

test('le générateur préserve les données et l’historique si les CSV sont incohérents ou incomplets', (t) => {
  const root = mkdtempSync(join(tmpdir(), 'mio-fuel-test-'));
  t.after(() => {
    assert.equal(dirname(root), tmpdir());
    rmSync(root, { recursive: true, force: true });
  });
  for (const directory of ['scripts', '.cache', 'src/data/fuel', 'public/data']) mkdirSync(join(root, directory), { recursive: true });
  writeFileSync(join(root, 'package.json'), '{"type":"module"}');
  for (const file of ['fetch-fuel-data.js', 'fuel-download.js', 'geo-italia.js', 'autostrade-italia.js']) {
    copyFileSync(new URL(file, import.meta.url), join(root, 'scripts', file));
  }
  const protectedFiles = ['src/data/fuel/meta.json', 'public/data/meta.json', 'src/data/price-history.json'];
  for (const file of protectedFiles) writeFileSync(join(root, file), 'existing-data');
  writeFileSync(join(root, '.cache/impianti.csv'), csv('impianti'));
  for (const [prices, error] of [[csv('prezzi', '2026-11-02'), /Estrazioni diverse/], [csv('prezzi'), /dati incompleti/]]) {
    writeFileSync(join(root, '.cache/prezzi.csv'), prices);
    const result = spawnSync(process.execPath, [join(root, 'scripts/fetch-fuel-data.js'), '--offline'], { encoding: 'utf-8', timeout: 10_000 });
    assert.equal(result.status, 1);
    assert.match(result.stderr, error);
    for (const file of protectedFiles) assert.equal(readFileSync(join(root, file), 'utf-8'), 'existing-data');
  }
});
