import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';
import { requestText, romeDay, errorDetail } from './fuel-download.js';

export function checkSnapshot(expected, actual, html, now = new Date()) {
  const date = expected.lastUpdate?.slice(0, 10);
  const age = (Date.parse(romeDay(now)) - Date.parse(date)) / 86_400_000;
  if (!Number.isFinite(age) || age < 0 || age > 3 || !Number.isFinite(Date.parse(expected.lastUpdate))) {
    throw new Error('Les données construites ne sont pas récentes.');
  }
  if (!Number.isInteger(expected.totalStations) || expected.totalStations < 15000) {
    throw new Error('Nombre de stations invalide dans les données construites.');
  }
  if (actual.lastUpdate !== expected.lastUpdate || actual.totalStations !== expected.totalStations) {
    throw new Error(`Données publiques différentes du build : attendu ${expected.lastUpdate} / ${expected.totalStations}, reçu ${actual.lastUpdate} / ${actual.totalStations}.`);
  }
  const dates = [...html.matchAll(/<time\b[^>]*\bdatetime=["']([^"']+)["']/gi)].map((m) => m[1]);
  if (!dates.includes(expected.lastUpdate)) {
    throw new Error(`La page d'accueil ne présente pas le relevé ${expected.lastUpdate}.`);
  }
}

export async function verifyDeployment(expected, base = 'https://mio-carburante.it', { attempts = 4, retryDelayMs = 5_000 } = {}) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const nonce = `${Date.now()}-${attempt}`;
      const options = { connectTimeoutMs: 20_000, totalTimeoutMs: 30_000, maxBytes: 2 * 1024 * 1024 };
      const results = await Promise.allSettled([
        requestText(new URL(`/data/meta.json?verify=${nonce}`, base), options),
        requestText(new URL(`/?verify=${nonce}`, base), options),
      ]);
      for (const result of results) if (result.status === 'rejected') throw result.reason;
      checkSnapshot(expected, JSON.parse(results[0].value), results[1].value);
      console.log(`Déploiement vérifié : ${expected.lastUpdate}, ${expected.totalStations} stations, métadonnées et accueil à jour.`);
      return;
    } catch (error) {
      console.warn(`Vérification ${attempt}/${attempts} : ${errorDetail(error)}`);
      if (attempt === attempts) throw error;
      await sleep(retryDelayMs * attempt);
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const expected = JSON.parse(readFileSync(new URL('../dist/data/meta.json', import.meta.url), 'utf-8'));
    await verifyDeployment(expected);
  } catch (error) {
    console.error(`Échec du contrôle après déploiement : ${errorDetail(error)}`);
    process.exitCode = 1;
  }
}
