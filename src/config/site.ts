// Identità del sito. Cambiare nome o dominio qui (e in astro.config.mjs).
export const SITE = {
  name: 'Mio Carburante',
  /** Logo testuale: parte normale + parte in grassetto */
  logoA: 'Mio',
  logoB: 'Carburante',
  url: 'https://mio-carburante.it',
  tagline: 'Confronta i prezzi dei carburanti e trova il distributore più economico vicino a te.',
  locale: 'it_IT',
  lang: 'it-IT',
  /** Editore, a titolo non professionale (stesso editore del sito francese) */
  editor: 'Hugo Beignon',
  // Indirizzo del sito francese, l'unico esistente il 12 ottobre 2026.
  // Da sostituire quando esisterà una casella sul dominio italiano.
  contactEmail: 'contact@mon-carburant.com',
  // Fonti, lette il 12 ottobre 2026: condizioni generali di Hostinger
  // (hostinger.com/legal/universal-terms-of-service-agreement, entità per
  // «tutti gli altri Paesi», Francia compresa secondo
  // hostinger.com/legal/list-of-countries) e note legali di mon-carburant.com.
  host: {
    name: 'Hostinger International Ltd',
    address: '61 Lordou Vironos Street, 6023 Larnaca, Cipro',
    url: 'https://www.hostinger.com',
  },
  // Vuoti finché gli account non esistono: nessuno script viene caricato.
  // Prima di riempirli: scrivere la sezione «Cookie» di src/pages/privacy.astro
  // (il build si ferma finché non è fatto).
  gaId: '',
  adsClient: '',
  dataSource: {
    label: 'MIMIT, Osservaprezzi carburanti',
    url: 'https://www.mimit.gov.it/it/open-data/elenco-dataset/carburanti-prezzi-praticati-e-anagrafica-degli-impianti',
    licence: 'IODL 2.0',
    licenceUrl: 'https://www.dati.gov.it/content/italian-open-data-license-v20',
  },
} as const;
