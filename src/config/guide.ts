// Elenco delle guide. Ogni guida è una pagina in src/pages/guide/<slug>.astro:
// i numeri sono calcolati a ogni build dai dati del Ministero, i fatti esterni
// (norme, imposte) sono citati con le fonti in fondo alla pagina.
// Tutti i temi sono italiani: nessuna guida è tradotta dal sito francese.
export type Guida = {
  slug: string;
  /** Titolo della pagina (H1) */
  titolo: string;
  /** Titolo per Google, entro 60 caratteri */
  metaTitolo: string;
  descrizione: string;
  /** Riassunto mostrato sotto il titolo e nell'elenco */
  sintesi: string;
  pubblicata: string;
};

export const GUIDE: Guida[] = [
  {
    slug: 'accise-benzina-gasolio',
    titolo: 'Accise su benzina e gasolio: quanto pesano sul prezzo',
    metaTitolo: 'Accise benzina e gasolio: quanto pesano oggi',
    descrizione: 'Quanto vale l’accisa su benzina e gasolio, come si somma all’IVA e quale parte del prezzo di oggi finisce in imposte.',
    sintesi: 'L’accisa è una somma fissa per ogni litro, uguale per benzina e gasolio. Ecco quanto vale e quanta parte del prezzo di oggi è fatta di imposte.',
    pubblicata: '2026-10-13',
  },
  {
    slug: 'come-si-forma-il-prezzo-della-benzina',
    titolo: 'Come si forma il prezzo della benzina',
    metaTitolo: 'Come si forma il prezzo della benzina alla pompa',
    descrizione: 'Prezzo industriale, accisa e IVA: le tre voci che compongono il prezzo alla pompa, calcolate sul prezzo medio di oggi.',
    sintesi: 'Il prezzo alla pompa è la somma di tre voci: prezzo industriale, accisa e IVA. Le calcoliamo sul prezzo medio di oggi.',
    pubblicata: '2026-10-13',
  },
  {
    slug: 'self-o-servito',
    titolo: 'Self o servito: quanto costa la differenza',
    metaTitolo: 'Self o servito: quanto costa la differenza oggi',
    descrizione: 'La differenza di prezzo tra self service e servito per benzina e gasolio, in Italia e regione per regione, sui dati di oggi.',
    sintesi: 'Lo stesso carburante costa di più se a fare rifornimento è un addetto. Di quanto, oggi, in Italia e nella tua regione.',
    pubblicata: '2026-10-13',
  },
  {
    slug: 'pompe-bianche',
    titolo: 'Pompe bianche: cosa sono e quanto costano',
    metaTitolo: 'Pompe bianche: cosa sono e quanto costano oggi',
    descrizione: 'Cosa sono le pompe bianche, quante sono in Italia e come si collocano oggi i loro prezzi rispetto ai grandi marchi.',
    sintesi: 'I distributori senza il marchio di una grande compagnia hanno fama di essere più economici. Abbiamo controllato sui prezzi di oggi.',
    pubblicata: '2026-10-13',
  },
  {
    slug: 'prezzi-carburanti-in-autostrada',
    titolo: 'Benzina in autostrada: quanto costa rispetto alla strada',
    metaTitolo: 'Benzina in autostrada: il confronto dei prezzi oggi',
    descrizione: 'Il confronto tra i prezzi dei carburanti in autostrada e sulla rete ordinaria, self e servito, e le autostrade più e meno care.',
    sintesi: 'Fare il pieno in autostrada costa davvero di più? Il confronto con la rete ordinaria, self e servito, e la classifica delle autostrade.',
    pubblicata: '2026-10-13',
  },
  {
    slug: 'dove-costa-meno-la-benzina',
    titolo: 'Dove costa meno la benzina in Italia',
    metaTitolo: 'Dove costa meno la benzina in Italia oggi',
    descrizione: 'La classifica delle regioni e delle province italiane per prezzo medio di benzina e gasolio, aggiornata ogni giorno.',
    sintesi: 'La classifica delle regioni e delle province per prezzo medio della benzina e del gasolio, ricalcolata ogni giorno.',
    pubblicata: '2026-10-13',
  },
  {
    slug: 'marchi-carburante-prezzi',
    titolo: 'Marchi di carburante a confronto: chi costa meno',
    metaTitolo: 'Marchi di carburante a confronto: chi costa meno',
    descrizione: 'Il prezzo medio di benzina e gasolio per ciascun grande marchio di distributori in Italia, sui dati di oggi.',
    sintesi: 'Eni, IP, Q8, Esso, Tamoil e gli altri: il prezzo medio di benzina e gasolio marchio per marchio.',
    pubblicata: '2026-10-13',
  },
  {
    slug: 'prezzi-benzina-grandi-citta',
    titolo: 'Prezzo della benzina nelle grandi città italiane',
    metaTitolo: 'Prezzo benzina nelle grandi città italiane oggi',
    descrizione: 'Il prezzo medio di benzina e gasolio a Roma, Milano, Napoli, Torino e nelle altre grandi città, e quello dei distributori più economici.',
    sintesi: 'Roma, Milano, Napoli, Torino e le altre: il prezzo medio e quello dei distributori più economici nelle città con più impianti.',
    pubblicata: '2026-10-13',
  },
  {
    slug: 'gpl-auto-prezzo',
    titolo: 'GPL per auto: prezzo e distributori regione per regione',
    metaTitolo: 'GPL auto: prezzo e distributori per regione',
    descrizione: 'Quanto costa oggi il GPL per auto, quanti distributori lo vendono e in quali regioni è più facile e più conveniente trovarlo.',
    sintesi: 'Quanto costa oggi il GPL, quanti distributori lo vendono e dove è più facile trovarlo.',
    pubblicata: '2026-10-13',
  },
  {
    slug: 'metano-auto-prezzo',
    titolo: 'Metano per auto: prezzo al kg, distributori e bombole',
    metaTitolo: 'Metano auto: prezzo al kg e distributori',
    descrizione: 'Il prezzo del metano per auto al chilogrammo, le regioni con più distributori e ogni quanto vanno revisionate le bombole.',
    sintesi: 'Il metano si paga al chilo e si trova in pochi distributori. Prezzi, regioni servite e scadenze delle bombole.',
    pubblicata: '2026-10-13',
  },
  {
    slug: 'quanto-costa-un-pieno',
    titolo: 'Quanto costa un pieno di benzina o di gasolio',
    metaTitolo: 'Quanto costa un pieno di benzina o gasolio oggi',
    descrizione: 'Il costo di un pieno da 40, 50, 60 e 70 litri con i prezzi medi di oggi, self e servito, e quanto ne va in imposte.',
    sintesi: 'Il costo di un pieno da 40 a 70 litri con i prezzi di oggi, in self e in servito, e la parte che va in imposte.',
    pubblicata: '2026-10-13',
  },
  {
    slug: 'gasolio-o-benzina-quale-costa-di-piu',
    titolo: 'Gasolio o benzina: quale costa di più oggi',
    metaTitolo: 'Gasolio o benzina: quale costa di più oggi',
    descrizione: 'Il confronto tra il prezzo del gasolio e quello della benzina oggi, regione per regione, e il ruolo delle accise.',
    sintesi: 'Dal 2026 gasolio e benzina pagano la stessa accisa. Ecco quale dei due costa di più oggi, e da dove viene la differenza.',
    pubblicata: '2026-10-13',
  },
  {
    slug: 'etichette-carburanti-e5-e10-b7',
    titolo: 'E5, E10, B7: cosa significano le sigle sulla pompa',
    metaTitolo: 'E5, E10, B7: cosa significano le sigle carburanti',
    descrizione: 'Il significato delle etichette europee dei carburanti: E5 ed E10 per la benzina, B7 per il gasolio, LPG e CNG per i gas.',
    sintesi: 'Cerchio per la benzina, quadrato per il gasolio, rombo per i gas: come leggere le etichette europee dei carburanti.',
    pubblicata: '2026-10-13',
  },
  {
    slug: 'osservaprezzi-carburanti',
    titolo: 'Osservaprezzi carburanti: come funziona',
    metaTitolo: 'Osservaprezzi carburanti: come funziona',
    descrizione: 'Chi comunica i prezzi dei carburanti al Ministero, con quale frequenza e perché il prezzo alla pompa può essere diverso.',
    sintesi: 'Da dove arrivano i prezzi che vedi su questo sito: gli obblighi dei gestori e i limiti dei dati.',
    pubblicata: '2026-10-13',
  },
  {
    slug: 'risparmiare-confrontando-i-distributori',
    titolo: 'Quanto si risparmia confrontando i distributori',
    metaTitolo: 'Quanto si risparmia confrontando i distributori',
    descrizione: 'La differenza tra il prezzo medio e quello dei distributori più economici nelle grandi città, e quanto vale su un pieno.',
    sintesi: 'Nella stessa città il prezzo cambia da un distributore all’altro. Quanto vale la differenza su un pieno.',
    pubblicata: '2026-10-13',
  },
];

export const getGuida = (slug: string): Guida => {
  const g = GUIDE.find((x) => x.slug === slug);
  if (!g) throw new Error(`guide.ts: guida sconosciuta «${slug}»`);
  return g;
};
