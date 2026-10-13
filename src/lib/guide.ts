// Calcoli e formati usati dalle guide.
import { ACCISA, IVA } from '../config/fisco';
import { getProvince, getImpiantiProvincia, type FuelKey, type Impianto } from './fuel';

const fmt1 = (n: number) => n.toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Differenza tra due prezzi in centesimi, senza segno: 0.139 → "13,9" */
export const cent = (diff: number) => fmt1(Math.abs(diff) * 100);

/** Quota in percentuale: 0.511 → "51,1" */
export const perc = (quota: number) => fmt1(quota * 100);

/** Scompone un prezzo alla pompa (benzina o gasolio) in prezzo industriale, accisa e IVA. */
export function composizione(prezzoPompa: number) {
  const imponibile = prezzoPompa / (1 + IVA);
  const iva = prezzoPompa - imponibile;
  const industriale = imponibile - ACCISA;
  return { industriale, accisa: ACCISA, iva, imposte: ACCISA + iva, quotaImposte: (ACCISA + iva) / prezzoPompa };
}

// Livigno è zona extradoganale (comunicato ADM del 5 ottobre 2023, letto il
// 13 ottobre 2026): i suoi prezzi non sono confrontabili con quelli del resto
// d'Italia e restano fuori dai calcoli qui sotto.
const LIVIGNO = 'livigno-so';
export const FONTE_LIVIGNO = {
  label: 'Agenzia delle Dogane e dei Monopoli, comunicato del 5 ottobre 2023 sulla zona extradoganale di Livigno',
  url: 'https://www.adm.gov.it/portale/documents/20182/136620407/CS-20231005-Tirano.pdf/41b86bea-b5d9-09f9-ceb3-d58f6f94b5c4',
};

const media = (v: number[]) => v.reduce((t, x) => t + x, 0) / v.length;

/** Prezzi di un carburante, in ordine crescente (self per benzina e gasolio), Livigno escluso. */
function prezziOrdinati(fuel: FuelKey, filtro: (s: Impianto) => boolean = () => true): number[] {
  return getProvince()
    .flatMap((p) => getImpiantiProvincia(p.sigla))
    .filter((s) => s.comuneSlug !== LIVIGNO && s.p[fuel] != null && !s.x.includes(fuel) && filtro(s))
    .map((s) => s.p[fuel] as number)
    .sort((x, y) => x - y);
}

/**
 * Intervallo in cui cade il 90% dei prezzi (dal 5° al 95° percentile). Gli
 * estremi assoluti non sono usati: il prezzo più basso e il più alto di tutta
 * Italia sono spesso un errore di inserimento del gestore.
 */
export function intervallo90(fuel: FuelKey, filtro?: (s: Impianto) => boolean) {
  const v = prezziOrdinati(fuel, filtro);
  return { da: v[Math.floor(v.length * 0.05)], a: v[Math.ceil(v.length * 0.95) - 1], n: v.length };
}

/**
 * Per ogni comune: media della benzina self e media del 10% di distributori più
 * economici (almeno 3). Più affidabile del singolo prezzo minimo, che può
 * essere un errore di inserimento.
 */
export function fasciaEconomica(minImpianti: number) {
  const perComune = new Map<string, number[]>();
  for (const p of getProvince()) {
    for (const s of getImpiantiProvincia(p.sigla)) {
      if (s.comuneSlug === LIVIGNO || s.p.benzina == null || s.x.includes('benzina')) continue;
      if (!perComune.has(s.comuneSlug)) perComune.set(s.comuneSlug, []);
      perComune.get(s.comuneSlug)!.push(s.p.benzina);
    }
  }
  const out = new Map<string, { n: number; media: number; economici: number; quanti: number }>();
  for (const [slug, v] of perComune) {
    if (v.length < minImpianti) continue;
    v.sort((x, y) => x - y);
    const quanti = Math.max(3, Math.round(v.length * 0.1));
    out.set(slug, { n: v.length, media: media(v), economici: media(v.slice(0, quanti)), quanti });
  }
  return out;
}

// Nome della regione con la preposizione articolata «di»: "del Lazio", "delle Marche".
const DEL: Record<string, string> = {
  Piemonte: 'del Piemonte', "Valle d'Aosta": "della Valle d'Aosta", Lombardia: 'della Lombardia',
  'Trentino-Alto Adige': 'del Trentino-Alto Adige', Veneto: 'del Veneto', 'Friuli-Venezia Giulia': 'del Friuli-Venezia Giulia',
  Liguria: 'della Liguria', 'Emilia-Romagna': "dell'Emilia-Romagna", Toscana: 'della Toscana', Umbria: "dell'Umbria",
  Marche: 'delle Marche', Lazio: 'del Lazio', Abruzzo: "dell'Abruzzo", Molise: 'del Molise', Campania: 'della Campania',
  Puglia: 'della Puglia', Basilicata: 'della Basilicata', Calabria: 'della Calabria', Sicilia: 'della Sicilia',
  Sardegna: 'della Sardegna',
};
export const delRegione = (nome: string): string => {
  if (!DEL[nome]) throw new Error(`guide.ts: regione senza preposizione «${nome}»`);
  return DEL[nome];
};
