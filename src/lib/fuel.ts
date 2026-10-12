import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// ── Tipi ─────────────────────────────────────────────────────────────────

export type FuelKey = 'benzina' | 'gasolio' | 'gpl' | 'metano';

/**
 * Benzina e gasolio: avg/min/max dei soli prezzi self, `servito` = media del servito.
 * `soloServito`: nessun impianto del gruppo ha il self, le cifre sono quelle del servito.
 * GPL e metano: tutti i prezzi, senza distinzione.
 */
export type Stat = { avg: number; min: number; max: number; n: number; servito: number | null; soloServito: boolean };
export type FuelStats = Partial<Record<FuelKey, Stat>>;

export type Impianto = {
  id: string;
  nome: string;
  addr: string;
  cap: string | null;
  comune: string;
  comuneSlug: string;
  sigla: string;
  /** sigla dell'autostrada, null per la rete stradale */
  aut: string | null;
  /** prezzo mostrato: self se disponibile, altrimenti servito */
  p: Partial<Record<FuelKey, number>>;
  /** carburanti per cui l'impianto ha solo il prezzo servito */
  x: FuelKey[];
  /** prezzo servito, quando esiste anche il self */
  s: Partial<Record<FuelKey, number>>;
  marca: string;
  marcaSlug: string;
  lat: number;
  lng: number;
  agg: string | null;
};

export type Provincia = {
  sigla: string; name: string; slug: string; regione: string; regioneSlug: string;
  count: number; comuni: number; stats: FuelStats;
};
export type Regione = { name: string; slug: string; province: string[]; count: number; stats: FuelStats };
export type Comune = {
  name: string; slug: string; sigla: string; cap: string[]; count: number; lat: number; lng: number; stats: FuelStats;
};
export type Marca = { name: string; slug: string; count: number; stats: FuelStats };
export type Autostrada = {
  code: string; slug: string;
  /** nome d'uso (Autostrada del Sole...), se attestato */
  nome: string | null;
  percorso: string | null;
  count: number; stats: FuelStats;
};
export type MarcaDetail = {
  cheapest: Record<FuelKey, Impianto[]>;
  perRegione: { name: string; slug: string; count: number; stats: FuelStats }[];
};
export type Meta = {
  lastUpdate: string; estrazione: string; generatedAt: string; totalStations: number; totalComuni: number; source: string;
};
export type Nazionale = {
  stats: FuelStats;
  autostrada: { autostrada: FuelStats; strada: FuelStats; countAutostrada: number };
};

// ── Carburanti ───────────────────────────────────────────────────────────

export const FUEL_KEYS: FuelKey[] = ['benzina', 'gasolio', 'gpl', 'metano'];

export const FUELS: Record<FuelKey, {
  key: FuelKey; slug: string; label: string; unit: string; color: string; veicoli: string; descrizione: string[];
}> = {
  benzina: {
    key: 'benzina',
    slug: 'prezzo-benzina',
    label: 'Benzina',
    unit: '€/L',
    color: '#16a34a',
    veicoli: 'Auto e moto con motore a benzina, ibride benzina',
    descrizione: [
      'Il prezzo di riferimento di questa pagina è quello della benzina standard in modalità self service. Il prezzo servito è riportato a parte, quando l’impianto comunica entrambi.',
      'Le benzine speciali dei singoli marchi non entrano nelle medie: hanno nomi e prezzi diversi da una rete all’altra e non sono confrontabili.',
    ],
  },
  gasolio: {
    key: 'gasolio',
    slug: 'prezzo-gasolio',
    label: 'Gasolio',
    unit: '€/L',
    color: '#374151',
    veicoli: 'Auto diesel, veicoli commerciali, camper',
    descrizione: [
      'Il gasolio per autotrazione è chiamato anche diesel. Il prezzo di riferimento di questa pagina è quello del gasolio standard in modalità self service; il servito è riportato a parte.',
      'I gasoli speciali dei singoli marchi non entrano nelle medie: hanno nomi e prezzi diversi da una rete all’altra e non sono confrontabili.',
    ],
  },
  gpl: {
    key: 'gpl',
    slug: 'prezzo-gpl',
    label: 'GPL',
    unit: '€/L',
    color: '#ca8a04',
    veicoli: 'Auto bifuel benzina-GPL, di serie o trasformate',
    descrizione: [
      'GPL è la sigla di gas di petrolio liquefatto. Il prezzo è espresso in euro al litro.',
      'Non tutti i distributori lo vendono: il numero di impianti con un prezzo comunicato è indicato in cima a questa pagina. Per chi guida un’auto a GPL sapere dove trovarlo conta quanto il prezzo.',
    ],
  },
  metano: {
    key: 'metano',
    slug: 'prezzo-metano',
    label: 'Metano',
    unit: '€/kg',
    color: '#2563eb',
    veicoli: 'Auto bifuel benzina-metano, veicoli commerciali a metano',
    descrizione: [
      'Il metano per auto si vende al chilogrammo e non al litro: tutti i prezzi di questa pagina sono in euro al chilo.',
      'È il carburante con meno punti vendita tra i quattro confrontati: il numero di impianti con un prezzo comunicato è indicato in cima a questa pagina.',
    ],
  },
};

export const FUEL_BY_SLUG = Object.fromEntries(FUEL_KEYS.map((k) => [FUELS[k].slug, FUELS[k]]));

// ── Formattazione ────────────────────────────────────────────────────────

/** 2.037 → "2,037" */
export function prezzo(val: number | null | undefined): string {
  if (val == null) return '–';
  return val.toLocaleString('it-IT', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

/** Differenza in centesimi con segno: 0.021 → "+2,1 cent" */
export function diffCent(val: number | null | undefined, ref: number | null | undefined): string | null {
  if (val == null || ref == null) return null;
  const c = (val - ref) * 100;
  if (Math.abs(c) < 0.05) return 'in linea';
  return `${c > 0 ? '+' : '−'}${Math.abs(c).toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} cent`;
}

export function euro(n: number): string {
  return n.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function numero(n: number): string {
  // 'always': in italiano i numeri di quattro cifre non vengono raggruppati per default (5280 → 5.280)
  return n.toLocaleString('it-IT', { useGrouping: 'always' } as Intl.NumberFormatOptions);
}

export function dataLunga(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Rome' });
}

/** Nome mostrato per un impianto: il marchio, o il nome proprio per le pompe bianche */
export function nomeImpianto(s: Impianto): string {
  return s.marca === 'Pompe bianche' || s.marca === 'Altri marchi' ? titolo(s.nome) : s.marca;
}

function titolo(s: string): string {
  return s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s\-.'(])(\p{L})/gu, (_, a, b) => a + b.toUpperCase()) : s;
}

// ── Accesso ai dati (generati da scripts/fetch-fuel-data.js) ─────────────

const DATA_DIR = join(process.cwd(), 'src', 'data', 'fuel');

function read<T>(file: string, fallback?: T): T {
  const path = join(DATA_DIR, file);
  if (!existsSync(path)) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Manca ${file}: eseguire "npm run fetch-fuel" prima della build.`);
  }
  return JSON.parse(readFileSync(path, 'utf-8')) as T;
}

const cache = new Map<string, unknown>();
function cached<T>(file: string, fallback?: T): T {
  if (!cache.has(file)) cache.set(file, read<T>(file, fallback));
  return cache.get(file) as T;
}

export const getMeta = () => cached<Meta>('meta.json');
export const getNazionale = () => cached<Nazionale>('nazionale.json');
export const getRegioni = () => cached<Regione[]>('regioni.json');
export const getProvince = () => cached<Provincia[]>('province.json');
export const getComuni = () => cached<Comune[]>('comuni.json');
export const getMarche = () => cached<Marca[]>('marche.json');
export const getAutostrade = () => cached<Autostrada[]>('autostrade.json');
export const getImpiantiProvincia = (sigla: string) => cached<Impianto[]>(`impianti-provincia/${sigla}.json`, []);
export const getMarcaDetail = (slug: string) => read<MarcaDetail>(`impianti-marca/${slug}.json`);

export function getStorico(): { date: string; benzina: number | null; gasolio: number | null; gpl: number | null; metano: number | null }[] {
  const path = join(process.cwd(), 'src', 'data', 'price-history.json');
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf-8')) : [];
}

const provinceBySigla = () => {
  if (!cache.has('__prov')) cache.set('__prov', Object.fromEntries(getProvince().map((p) => [p.sigla, p])));
  return cache.get('__prov') as Record<string, Provincia>;
};
export const getProvincia = (sigla: string) => provinceBySigla()[sigla];

// ── Regole di indicizzazione ─────────────────────────────────────────────

/** Soglie e fasi di apertura a Google: src/config/indicizzazione.mjs */
export { MIN_IMPIANTI_SIGNIFICATIVI } from '../config/indicizzazione.mjs';

export function piuEconomici(list: Impianto[], fuel: FuelKey, limit = 10): Impianto[] {
  return list.filter((s) => s.p[fuel] != null).sort((a, b) => (a.p[fuel] as number) - (b.p[fuel] as number)).slice(0, limit);
}

/** Etichetta della modalità a cui si riferisce una statistica: "self", "servito" o nessuna (GPL, metano) */
export function modo(key: FuelKey, stat: Stat): string {
  if (key === 'gpl' || key === 'metano') return '';
  return stat.soloServito ? 'servito' : 'self';
}

/** Carburanti effettivamente presenti in un insieme di statistiche */
export function fuelsOf(stats: FuelStats): FuelKey[] {
  return FUEL_KEYS.filter((k) => stats[k]);
}
