#!/usr/bin/env node
/**
 * scripts/fetch-fuel-data.js
 *
 * Scarica i due file open data del MIMIT (Ministero delle Imprese e del Made in
 * Italy, licenza IODL 2.0) e genera i JSON usati dal sito:
 *
 *   anagrafica_impianti_attivi.csv  impianti (gestore, bandiera, indirizzo, coordinate)
 *   prezzo_alle_8.csv               prezzi in vigore alle 8 del giorno precedente
 *
 * Output:
 *   src/data/fuel/meta.json, nazionale.json, regioni.json, province.json,
 *     comuni.json, marche.json, autostrade.json
 *   src/data/fuel/impianti-provincia/<sigla>.json
 *   src/data/fuel/impianti-marca/<slug>.json
 *   src/data/price-history.json     una riga al giorno, versionata
 *   public/data/impianti.json       dati compatti per la mappa
 *   public/data/meta.json
 *
 * Opzioni: --offline  riusa i CSV già presenti in .cache/ (sviluppo)
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROVINCE, REGIONI, toSlug, nomeProprio } from './geo-italia.js';
import { AUTOSTRADE, highwayCode } from './autostrade-italia.js';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const OUT = join(ROOT, 'src', 'data', 'fuel');
const PUBLIC_DATA = join(ROOT, 'public', 'data');
const CACHE = join(ROOT, '.cache');
const HISTORY_FILE = join(ROOT, 'src', 'data', 'price-history.json');

const SOURCES = {
  impianti: 'https://www.mimit.gov.it/images/exportCSV/anagrafica_impianti_attivi.csv',
  prezzi: 'https://www.mimit.gov.it/images/exportCSV/prezzo_alle_8.csv',
};
const OFFLINE = process.argv.includes('--offline');

export const FUELS = ['benzina', 'gasolio', 'gpl', 'metano'];
// Solo le denominazioni standard: i carburanti "premium" (Blue Diesel, HVO,
// V-Power...) hanno prezzi non confrontabili tra un marchio e l'altro.
const FUEL_OF = { Benzina: 'benzina', Gasolio: 'gasolio', GPL: 'gpl', Metano: 'metano' };

// Limiti di plausibilità (€/L, €/kg per il metano): fuori da qui è un errore di inserimento.
const LIMITS = { benzina: [1.2, 3.2], gasolio: [1.2, 3.3], gpl: [0.4, 1.6], metano: [0.8, 3.2] };
// Banda ammessa attorno alla mediana del giorno, per carburante: [minimo, massimo].
// Benzina e gasolio: le imposte fissano un pavimento, uno scarto oltre il 20% in
// meno non è realistico. GPL e metano variano di più da una zona all'altra.
const BANDA = { benzina: [0.8, 1.35], gasolio: [0.8, 1.35], gpl: [0.65, 1.45], metano: [0.65, 1.45] };
// Un prezzo non confermato da oltre 30 giorni non è più affidabile.
const MAX_AGE_DAYS = 30;
const MIN_IMPIANTI = 15000; // sotto questa soglia il file è incompleto: si interrompe
const HISTORY_DAYS = 800;

// ── Marchi ────────────────────────────────────────────────────────────────

const BRAND_NAMES = {
  'Agip Eni': 'Eni', 'Api-Ip': 'IP', 'Pompe Bianche': 'Pompe bianche', 'Q8': 'Q8', 'Esso': 'Esso',
  'Tamoil': 'Tamoil', 'Shell': 'Shell', 'KEROPETROL': 'Keropetrol', 'Giap': 'Giap',
};
const MIN_BRAND = 40; // marchi con meno impianti confluiscono in "Altri marchi"

// ── Utilità ───────────────────────────────────────────────────────────────

async function download(name) {
  const cached = join(CACHE, `${name}.csv`);
  if (OFFLINE && existsSync(cached)) return readFileSync(cached, 'utf-8');
  const res = await fetch(SOURCES[name], { signal: AbortSignal.timeout(120_000), headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  const text = await res.text();
  mkdirSync(CACHE, { recursive: true });
  writeFileSync(cached, text, 'utf-8');
  return text;
}

/** "06/10/2026 20:00:07" → Date (ora italiana, trattata come UTC: serve solo l'età in giorni) */
function parseDate(s) {
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/);
  return m ? Date.UTC(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]) : NaN;
}

const round3 = (n) => Math.round(n * 1000) / 1000;

function stats(values) {
  const v = values.filter((x) => x != null);
  if (!v.length) return null;
  return {
    avg: round3(v.reduce((a, b) => a + b, 0) / v.length),
    min: round3(Math.min(...v)),
    max: round3(Math.max(...v)),
    n: v.length,
  };
}

// Benzina e gasolio hanno due prezzi distinti (self e servito). GPL e metano
// sono quasi sempre erogati dal personale: per loro non si distingue.
const SELF_FUELS = new Set(['benzina', 'gasolio']);

/**
 * Statistiche per carburante.
 * Benzina e gasolio: media, minimo e massimo dei SOLI prezzi self, e a parte la
 * media del servito. Un impianto che ha solo il servito non entra nella media
 * self: mescolare i due prezzi falserebbe il confronto.
 * `soloServito` è true quando nel gruppo nessun impianto ha il self: le cifre
 * sono allora quelle del servito, e la pagina lo dichiara.
 */
function fuelStats(list) {
  const out = {};
  for (const f of FUELS) {
    if (!SELF_FUELS.has(f)) {
      const all = stats(list.map((s) => s.p[f]));
      if (all) out[f] = { ...all, servito: null, soloServito: false };
      continue;
    }
    const self = stats(list.map((s) => (s.x.includes(f) ? null : s.p[f])));
    const servito = stats(list.map((s) => s.s[f] ?? (s.x.includes(f) ? s.p[f] : null)));
    if (self) out[f] = { ...self, servito: servito?.avg ?? null, soloServito: false };
    else if (servito) out[f] = { ...servito, servito: null, soloServito: true };
  }
  return out;
}

function cleanAddress(raw) {
  const s = raw.replace(/\s+/g, ' ').trim();
  const cap = s.match(/\b(\d{5})$/)?.[1] ?? null;
  let addr = s.replace(/\s*-?\s*\d{5}$/, '').replace(/\s*-\s*$/, '').trim();
  if (addr === addr.toUpperCase()) addr = nomeProprio(addr).replace(/\b(Ss|Sp|Sr|Snc|Km)\b/g, (m) => m.toUpperCase());
  return { addr, cap };
}

const writeJson = (path, data) => writeFileSync(path, JSON.stringify(data), 'utf-8');

// ── Main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n⛽ fetch-fuel-data.js (MIMIT open data${OFFLINE ? ', offline' : ''})\n`);
  const [impiantiCsv, prezziCsv] = await Promise.all([download('impianti'), download('prezzi')]);

  // ── Anagrafica ──────────────────────────────────────────────────────────
  const impLines = impiantiCsv.split(/\r?\n/);
  const estrazione = impLines[0].match(/(\d{4}-\d{2}-\d{2})/)?.[1];
  if (!estrazione) throw new Error('Data di estrazione non trovata nella prima riga.');
  const refTime = Date.parse(`${estrazione}T08:00:00Z`);

  const impianti = new Map();
  for (const line of impLines.slice(2)) {
    if (!line.trim()) continue;
    const c = line.split('|');
    if (c.length < 10) continue;
    // Il nome dell'impianto può contenere il separatore: i primi 4 campi e gli
    // ultimi 5 sono fissi, tutto ciò che sta in mezzo è il nome.
    const [id, gestore, bandiera, tipo] = c;
    const [indirizzo, comune, sigla, lat, lng] = c.slice(-5);
    const nome = c.slice(4, -5).join(' ').trim();
    const prov = PROVINCE[sigla];
    const la = parseFloat(lat), lo = parseFloat(lng);
    // Coordinate fuori dall'Italia: impianto non localizzabile.
    if (!prov || !(la > 35 && la < 47.5 && lo > 6 && lo < 19)) continue;
    const comuneName = nomeProprio(comune);
    if (!comuneName) continue;
    const { addr, cap } = cleanAddress(indirizzo);
    const autostrada = tipo === 'Autostradale';
    impianti.set(id, {
      id,
      nome: nome.replace(/\s+/g, ' '),
      gestore: gestore.trim(),
      bandiera: bandiera.trim(),
      addr,
      cap,
      comune: comuneName,
      comuneSlug: `${toSlug(comuneName)}-${sigla.toLowerCase()}`,
      sigla,
      lat: +la.toFixed(5),
      lng: +lo.toFixed(5),
      aut: autostrada ? highwayCode(`${indirizzo} ${nome}`) ?? 'altre' : null,
      p: {},   // prezzo mostrato: self se disponibile, altrimenti servito
      s: {},   // prezzo servito, quando esiste anche il self
      x: [],   // carburanti (benzina, gasolio) per cui l'impianto ha solo il servito
      agg: 0,  // ultima comunicazione
    });
  }

  // ── Prezzi ──────────────────────────────────────────────────────────────
  const raw = new Map(); // id → fuel → { self, servito }
  let scartati = 0;
  for (const line of prezziCsv.split(/\r?\n/).slice(2)) {
    const c = line.split('|');
    if (c.length !== 5) continue;
    const fuel = FUEL_OF[c[1]];
    const st = impianti.get(c[0]);
    if (!fuel || !st) continue;
    const price = parseFloat(c[2]);
    const t = parseDate(c[4]);
    const [lo, hi] = LIMITS[fuel];
    if (!(price >= lo && price <= hi) || !(refTime - t <= MAX_AGE_DAYS * 86_400_000)) { scartati++; continue; }
    const slot = (raw.get(c[0]) ?? raw.set(c[0], {}).get(c[0]));
    const kind = c[3] === '1' ? 'self' : 'servito';
    // Più righe per lo stesso prezzo: vale la comunicazione più recente.
    const cur = (slot[fuel] ??= {});
    if (!cur[kind] || t > cur[kind].t) cur[kind] = { price: round3(price), t };
    if (t > st.agg) st.agg = t;
  }
  // Secondo filtro: un prezzo molto lontano dalla mediana del giorno è quasi
  // sempre un errore di digitazione (virgola spostata, self e servito
  // invertiti). Mostrarlo come «il più economico d'Italia» sarebbe un errore:
  // si scarta. Le soglie sono larghe per non eliminare prezzi reali.
  const mediana = {};
  for (const fuel of FUELS) {
    for (const kind of ['self', 'servito']) {
      const v = [...raw.values()].map((f) => f[fuel]?.[kind]?.price).filter((x) => x != null).sort((a, b) => a - b);
      if (v.length) mediana[`${fuel}|${kind}`] = v[Math.floor(v.length / 2)];
    }
  }
  let anomali = 0;
  for (const fuels of raw.values()) {
    for (const [fuel, v] of Object.entries(fuels)) {
      const [lo, hi] = BANDA[fuel];
      for (const kind of ['self', 'servito']) {
        const med = mediana[`${fuel}|${kind}`];
        if (v[kind] && med && (v[kind].price < med * lo || v[kind].price > med * hi)) {
          delete v[kind];
          anomali++;
        }
      }
      if (!v.self && !v.servito) delete fuels[fuel];
    }
  }
  console.log(`   Prezzi anomali scartati (lontani dalla mediana): ${anomali}`);

  for (const [id, fuels] of raw) {
    const st = impianti.get(id);
    for (const [fuel, v] of Object.entries(fuels)) {
      st.p[fuel] = (v.self ?? v.servito).price;
      if (!v.self && SELF_FUELS.has(fuel)) st.x.push(fuel);
      if (v.self && v.servito && v.servito.price >= v.self.price) st.s[fuel] = v.servito.price;
    }
  }

  const stations = [...impianti.values()].filter((s) => Object.keys(s.p).length > 0);
  console.log(`   Impianti attivi: ${impianti.size}, con prezzo valido: ${stations.length} (prezzi scartati: ${scartati})`);
  if (stations.length < MIN_IMPIANTI) throw new Error(`Solo ${stations.length} impianti con prezzo: dati incompleti, nessun file scritto.`);

  // ── Marchi ──────────────────────────────────────────────────────────────
  const brandCount = Map.groupBy(stations, (s) => s.bandiera);
  for (const s of stations) {
    const big = (brandCount.get(s.bandiera)?.length ?? 0) >= MIN_BRAND;
    s.marca = big ? BRAND_NAMES[s.bandiera] ?? nomeProprio(s.bandiera) : 'Altri marchi';
    s.marcaSlug = toSlug(s.marca);
  }

  // ── Aggregati ───────────────────────────────────────────────────────────
  const nazionale = fuelStats(stations);
  const byProv = Map.groupBy(stations, (s) => s.sigla);
  const byComune = Map.groupBy(stations, (s) => s.comuneSlug);
  const byMarca = Map.groupBy(stations, (s) => s.marcaSlug);

  const province = Object.values(PROVINCE).map((p) => {
    const list = byProv.get(p.sigla) ?? [];
    return { ...p, count: list.length, comuni: new Set(list.map((s) => s.comuneSlug)).size, stats: fuelStats(list) };
  }).sort((a, b) => a.name.localeCompare(b.name, 'it'));

  const regioni = REGIONI.map((r) => {
    const sigle = Object.keys(r.province);
    const list = sigle.flatMap((s) => byProv.get(s) ?? []);
    return { name: r.name, slug: toSlug(r.name), province: sigle, count: list.length, stats: fuelStats(list) };
  });

  const comuni = [...byComune.entries()].map(([slug, list]) => ({
    name: list[0].comune,
    slug,
    sigla: list[0].sigla,
    cap: [...new Set(list.map((s) => s.cap).filter(Boolean))].sort(),
    count: list.length,
    lat: +(list.reduce((a, s) => a + s.lat, 0) / list.length).toFixed(4),
    lng: +(list.reduce((a, s) => a + s.lng, 0) / list.length).toFixed(4),
    stats: fuelStats(list),
  })).sort((a, b) => b.count - a.count);

  const marche = [...byMarca.entries()].map(([slug, list]) => ({
    name: list[0].marca, slug, count: list.length, stats: fuelStats(list),
  })).sort((a, b) => b.count - a.count);

  const autList = stations.filter((s) => s.aut);
  const autostrade = [...Map.groupBy(autList, (s) => s.aut).entries()]
    .filter(([code]) => code !== 'altre')
    .map(([code, list]) => ({
      code,
      slug: code.toLowerCase(),
      nome: AUTOSTRADE[code]?.nome ?? null,
      percorso: AUTOSTRADE[code]?.percorso ?? null,
      count: list.length,
      stats: fuelStats(list),
    }))
    .sort((a, b) => parseInt(a.code.replace(/\D/g, ''), 10) - parseInt(b.code.replace(/\D/g, ''), 10));
  const confrontoAutostrada = {
    autostrada: fuelStats(autList),
    strada: fuelStats(stations.filter((s) => !s.aut)),
    countAutostrada: autList.length,
  };

  // ── Scrittura ───────────────────────────────────────────────────────────
  for (const d of ['impianti-provincia', 'impianti-marca']) {
    rmSync(join(OUT, d), { recursive: true, force: true });
    mkdirSync(join(OUT, d), { recursive: true });
  }
  mkdirSync(PUBLIC_DATA, { recursive: true });

  const page = ({ gestore, bandiera, lat, lng, agg, ...s }) => ({ ...s, lat, lng, agg: agg ? new Date(agg).toISOString().slice(0, 10) : null });
  for (const [sigla, list] of byProv) writeJson(join(OUT, 'impianti-provincia', `${sigla}.json`), list.map(page));

  // Un marchio può avere migliaia di impianti: si tengono i più economici per
  // carburante e la ripartizione per regione.
  for (const [slug, list] of byMarca) {
    const cheapest = Object.fromEntries(FUELS.map((f) => [
      f, list.filter((s) => s.p[f] != null).sort((a, b) => a.p[f] - b.p[f]).slice(0, 20).map(page),
    ]));
    const perRegione = regioni.map((r) => {
      const l = list.filter((s) => r.province.includes(s.sigla));
      return { name: r.name, slug: r.slug, count: l.length, stats: fuelStats(l) };
    }).filter((r) => r.count > 0).sort((a, b) => b.count - a.count);
    writeJson(join(OUT, 'impianti-marca', `${slug}.json`), { cheapest, perRegione });
  }

  const meta = {
    // I prezzi sono quelli in vigore alle 8 del giorno di estrazione.
    lastUpdate: `${estrazione}T08:00:00+02:00`,
    estrazione,
    generatedAt: new Date().toISOString(),
    totalStations: stations.length,
    totalComuni: comuni.length,
    source: 'MIMIT, Osservaprezzi carburanti (IODL 2.0)',
  };
  writeJson(join(OUT, 'meta.json'), meta);
  writeJson(join(OUT, 'nazionale.json'), { stats: nazionale, autostrada: confrontoAutostrada });
  writeJson(join(OUT, 'regioni.json'), regioni);
  writeJson(join(OUT, 'province.json'), province);
  writeJson(join(OUT, 'comuni.json'), comuni);
  writeJson(join(OUT, 'marche.json'), marche);
  writeJson(join(OUT, 'autostrade.json'), autostrade);

  // Mappa: formato a colonne per ridurre il peso (oltre 21.000 impianti).
  // [id, lat, lng, comune, sigla, indirizzo, indiceMarca, benzina, gasolio, gpl, metano, autostrada, cap]
  const marcheIdx = marche.map((m) => m.name);
  writeJson(join(PUBLIC_DATA, 'impianti.json'), {
    marche: marcheIdx,
    rows: stations.map((s) => [
      s.id, s.lat, s.lng, s.comune, s.sigla, s.addr, marcheIdx.indexOf(s.marca),
      s.p.benzina ?? null, s.p.gasolio ?? null, s.p.gpl ?? null, s.p.metano ?? null, s.aut ? 1 : 0, s.cap ?? '',
    ]),
  });
  writeJson(join(PUBLIC_DATA, 'meta.json'), { lastUpdate: meta.lastUpdate, totalStations: meta.totalStations });

  // Storico nazionale: una riga per data di estrazione.
  const history = existsSync(HISTORY_FILE) ? JSON.parse(readFileSync(HISTORY_FILE, 'utf-8')) : [];
  const entry = {
    date: estrazione,
    ...Object.fromEntries(FUELS.map((f) => [f, nazionale[f]?.avg ?? null])),
    benzinaServito: nazionale.benzina?.servito ?? null,
    gasolioServito: nazionale.gasolio?.servito ?? null,
  };
  const next = [...history.filter((h) => h.date !== estrazione), entry].sort((a, b) => a.date.localeCompare(b.date)).slice(-HISTORY_DAYS);
  writeFileSync(HISTORY_FILE, JSON.stringify(next, null, 1) + '\n', 'utf-8');

  console.log(`
✅ Dati del ${estrazione}
   Impianti: ${stations.length}   Comuni: ${comuni.length}   Province: ${province.filter((p) => p.count).length}   Marchi: ${marche.length}   Autostrade: ${autostrade.length}
   Media self:    benzina ${nazionale.benzina.avg}  gasolio ${nazionale.gasolio.avg}  GPL ${nazionale.gpl?.avg}  metano ${nazionale.metano?.avg}
   Media servito: benzina ${nazionale.benzina.servito}  gasolio ${nazionale.gasolio.servito}
`);
}

main().catch((err) => {
  console.error('\n❌ fetch-fuel-data.js:', err.message);
  process.exit(1);
});
