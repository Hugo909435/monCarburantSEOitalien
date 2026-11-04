import { request as httpsRequest } from 'node:https';
import { request as httpRequest } from 'node:http';
import { setTimeout as sleep } from 'node:timers/promises';

const DAY = 86_400_000;
const HEADERS = {
  impianti: 'idImpianto|Gestore|Bandiera|Tipo Impianto|Nome Impianto|Indirizzo|Comune|Provincia|Latitudine|Longitudine',
  prezzi: 'idImpianto|descCarburante|prezzo|isSelf|dtComu',
};

export function errorDetail(error) {
  return [error.message, error.code, error.cause?.message, error.cause?.code].filter(Boolean).join(' — ');
}

export function romeDay(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const value = (key) => parts.find((p) => p.type === key).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

export function csvDate(name, text) {
  const [first, header, row] = text.replace(/^\uFEFF/, '').split(/\r?\n/, 3);
  const date = first?.trim().match(/^Estrazione del (\d{4}-\d{2}-\d{2})$/)?.[1];
  if (!date || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) {
    throw new Error(`${name}: data di estrazione non valida (CSV atteso, non una pagina HTML).`);
  }
  if (!HEADERS[name] || header?.trim() !== HEADERS[name] || !row?.trim()) {
    throw new Error(`${name}: intestazione CSV inattesa o file vuoto.`);
  }
  return date;
}

// I due file devono appartenere alla stessa estrazione. Solo lo sviluppo
// offline può usare un'estrazione vecchia; non esiste un fallback automatico.
export function validateDatasets(impianti, prezzi, { offline = false, now = new Date() } = {}) {
  const stationDate = csvDate('impianti', impianti);
  const priceDate = csvDate('prezzi', prezzi);
  if (stationDate !== priceDate) {
    throw new Error(`Estrazioni diverse: impianti ${stationDate}, prezzi ${priceDate}. Nessun dato generato.`);
  }
  if (!offline) {
    const age = (Date.parse(romeDay(now)) - Date.parse(priceDate)) / DAY;
    if (age < 0 || age > 3) {
      throw new Error(`Estrazione ${priceDate}: data futura o più vecchia di 3 giorni. Nessun dato generato.`);
    }
  }
  return priceDate;
}

export function extractionTimestamp(date) {
  const offset = new Intl.DateTimeFormat('en', {
    timeZone: 'Europe/Rome', timeZoneName: 'longOffset',
  }).formatToParts(new Date(`${date}T08:00:00Z`)).find((p) => p.type === 'timeZoneName').value.replace('GMT', '');
  return `${date}T08:00:00${offset}`;
}

// Native HTTPS: il timeout di connessione è esplicito, senza il limite
// implicito di 10 secondi del fetch. Il secondo timer copre anche il body.
export function requestText(url, { connectTimeoutMs = 30_000, totalTimeoutMs = 120_000, maxBytes = 64 * 1024 * 1024, redirects = 3 } = {}) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const target = new URL(url);
    if (!['https:', 'http:'].includes(target.protocol)) return reject(new Error('Protocollo non supportato.'));
    const request = target.protocol === 'https:' ? httpsRequest : httpRequest;
    const req = request(target, {
      agent: false,
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'text/csv, text/plain, */*', 'Accept-Encoding': 'identity' },
    });
    const abort = (message, code) => req.destroy(Object.assign(new Error(message), { code }));
    const connectTimer = setTimeout(() => abort(`Connessione scaduta dopo ${connectTimeoutMs} ms`, 'CONNECT_TIMEOUT'), connectTimeoutMs);
    const totalTimer = setTimeout(() => abort(`Download scaduto dopo ${totalTimeoutMs} ms`, 'DOWNLOAD_TIMEOUT'), totalTimeoutMs);
    const cleanup = () => { clearTimeout(connectTimer); clearTimeout(totalTimer); };
    req.on('socket', (socket) => {
      socket.once(target.protocol === 'https:' ? 'secureConnect' : 'connect', () => clearTimeout(connectTimer));
    });
    req.on('error', (error) => { cleanup(); reject(error); });
    req.on('response', (res) => {
      clearTimeout(connectTimer);
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && redirects > 0) {
        cleanup();
        res.destroy();
        const next = new URL(res.headers.location, target);
        if (target.protocol === 'https:' && next.protocol !== 'https:') {
          reject(new Error('Redirect HTTPS non sicuro.'));
          return;
        }
        const remaining = totalTimeoutMs - (Date.now() - started);
        if (remaining <= 0) { reject(new Error('Download scaduto durante il redirect.')); return; }
        resolve(requestText(next, { connectTimeoutMs, totalTimeoutMs: remaining, maxBytes, redirects: redirects - 1 }));
        return;
      }
      if (res.statusCode !== 200) {
        const error = Object.assign(new Error(`HTTP ${res.statusCode}`), { status: res.statusCode });
        cleanup();
        res.destroy();
        reject(error);
        return;
      }
      const chunks = [];
      let bytes = 0;
      res.on('data', (chunk) => {
        bytes += chunk.length;
        if (bytes > maxBytes) {
          const error = Object.assign(new Error('File troppo grande'), { code: 'MAX_SIZE' });
          cleanup();
          reject(error);
          req.destroy(error);
        } else chunks.push(chunk);
      });
      res.on('error', (error) => { cleanup(); reject(error); });
      res.on('end', () => {
        cleanup();
        if (!res.complete) { reject(new Error('Download incompleto.')); return; }
        resolve(Buffer.concat(chunks).toString('utf-8').replace(/^\uFEFF/, ''));
      });
    });
    req.end();
  });
}

export async function downloadCsv(name, url, { attempts = 3, retryDelayMs = 5_000, log = console.warn, ...timeouts } = {}) {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      console.log(`   ${name}: tentativo ${attempt}/${attempts} — ${url}`);
      const text = await requestText(url, timeouts);
      csvDate(name, text);
      return text;
    } catch (error) {
      const retryable = error.status == null || [408, 425, 429].includes(error.status) || error.status >= 500;
      log(`   ${name}: ${errorDetail(error)}`);
      if (attempt === attempts || !retryable || error.code === 'MAX_SIZE') {
        throw new Error(`${name}: download fallito (${url}): ${errorDetail(error)}`, { cause: error });
      }
      await sleep(retryDelayMs * attempt);
    }
  }
}
