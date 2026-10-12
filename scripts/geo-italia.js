// Province italiane (sigla automobilistica) e regioni.
// Fonte: suddivisione amministrativa ISTAT. Le 107 sigle corrispondono a quelle
// presenti nell'anagrafica impianti del MIMIT.

export const REGIONI = [
  { name: 'Piemonte', province: { TO: 'Torino', VC: 'Vercelli', NO: 'Novara', CN: 'Cuneo', AT: 'Asti', AL: 'Alessandria', BI: 'Biella', VB: 'Verbano-Cusio-Ossola' } },
  { name: "Valle d'Aosta", province: { AO: 'Aosta' } },
  { name: 'Lombardia', province: { VA: 'Varese', CO: 'Como', SO: 'Sondrio', MI: 'Milano', BG: 'Bergamo', BS: 'Brescia', PV: 'Pavia', CR: 'Cremona', MN: 'Mantova', LC: 'Lecco', LO: 'Lodi', MB: 'Monza e Brianza' } },
  { name: 'Trentino-Alto Adige', province: { BZ: 'Bolzano', TN: 'Trento' } },
  { name: 'Veneto', province: { VR: 'Verona', VI: 'Vicenza', BL: 'Belluno', TV: 'Treviso', VE: 'Venezia', PD: 'Padova', RO: 'Rovigo' } },
  { name: 'Friuli-Venezia Giulia', province: { UD: 'Udine', GO: 'Gorizia', TS: 'Trieste', PN: 'Pordenone' } },
  { name: 'Liguria', province: { IM: 'Imperia', SV: 'Savona', GE: 'Genova', SP: 'La Spezia' } },
  { name: 'Emilia-Romagna', province: { PC: 'Piacenza', PR: 'Parma', RE: 'Reggio Emilia', MO: 'Modena', BO: 'Bologna', FE: 'Ferrara', RA: 'Ravenna', FC: 'Forlì-Cesena', RN: 'Rimini' } },
  { name: 'Toscana', province: { MS: 'Massa-Carrara', LU: 'Lucca', PT: 'Pistoia', FI: 'Firenze', LI: 'Livorno', PI: 'Pisa', AR: 'Arezzo', SI: 'Siena', GR: 'Grosseto', PO: 'Prato' } },
  { name: 'Umbria', province: { PG: 'Perugia', TR: 'Terni' } },
  { name: 'Marche', province: { PU: 'Pesaro e Urbino', AN: 'Ancona', MC: 'Macerata', AP: 'Ascoli Piceno', FM: 'Fermo' } },
  { name: 'Lazio', province: { VT: 'Viterbo', RI: 'Rieti', RM: 'Roma', LT: 'Latina', FR: 'Frosinone' } },
  { name: 'Abruzzo', province: { AQ: "L'Aquila", TE: 'Teramo', PE: 'Pescara', CH: 'Chieti' } },
  { name: 'Molise', province: { CB: 'Campobasso', IS: 'Isernia' } },
  { name: 'Campania', province: { CE: 'Caserta', BN: 'Benevento', NA: 'Napoli', AV: 'Avellino', SA: 'Salerno' } },
  { name: 'Puglia', province: { FG: 'Foggia', BA: 'Bari', TA: 'Taranto', BR: 'Brindisi', LE: 'Lecce', BT: 'Barletta-Andria-Trani' } },
  { name: 'Basilicata', province: { PZ: 'Potenza', MT: 'Matera' } },
  { name: 'Calabria', province: { CS: 'Cosenza', CZ: 'Catanzaro', RC: 'Reggio Calabria', KR: 'Crotone', VV: 'Vibo Valentia' } },
  { name: 'Sicilia', province: { TP: 'Trapani', PA: 'Palermo', ME: 'Messina', AG: 'Agrigento', CL: 'Caltanissetta', EN: 'Enna', CT: 'Catania', RG: 'Ragusa', SR: 'Siracusa' } },
  { name: 'Sardegna', province: { SS: 'Sassari', NU: 'Nuoro', CA: 'Cagliari', OR: 'Oristano', SU: 'Sud Sardegna' } },
];

export function toSlug(str) {
  return (str ?? '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/['’`]/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** sigla → { sigla, name, slug, regione, regioneSlug } */
export const PROVINCE = Object.fromEntries(
  REGIONI.flatMap((r) =>
    Object.entries(r.province).map(([sigla, name]) => [
      sigla,
      { sigla, name, slug: toSlug(name), regione: r.name, regioneSlug: toSlug(r.name) },
    ]),
  ),
);

// Parole che restano minuscole all'interno di un toponimo.
const MINUSCOLE = new Set([
  'di', 'del', 'della', 'delle', 'dei', 'degli', 'dello', 'de', 'da', 'dal', 'dalla',
  'in', 'nel', 'nella', 'nelle', 'nei', 'a', 'al', 'alla', 'alle', 'ai', 'e', 'ed',
  'con', 'su', 'sul', 'sulla', 'sullo', 'sui', 'per', 'tra', 'fra', 'la', 'le', 'lo', 'il', 'i', 'gli',
]);

/** "REGGIO NELL'EMILIA" → "Reggio nell'Emilia", "L'AQUILA" → "L'Aquila" */
export function nomeProprio(raw) {
  const s = (raw ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  if (!s) return '';
  const cap = (w) => (w ? w[0].toUpperCase() + w.slice(1) : w);
  return s
    .split(' ')
    .map((word, i) =>
      word
        .split('-')
        .map((part, j) => {
          // elisione: d'esi, nell'emilia, l'aquila
          const m = part.match(/^([a-zà-ù]+)'(.+)$/);
          if (m) {
            const head = i === 0 && j === 0 ? cap(m[1]) : m[1].length <= 2 || MINUSCOLE.has(m[1].replace(/l+$/, 'la')) || /^(dell|nell|sull|all|dall)$/.test(m[1]) ? m[1] : cap(m[1]);
            return `${head}'${cap(m[2])}`;
          }
          // "de'" (Cava de' Tirreni): preposizione tronca, resta minuscola
          if (i > 0 && /^[a-z]{1,3}'$/.test(part)) return part;
          return i > 0 && j === 0 && MINUSCOLE.has(part) ? part : cap(part);
        })
        .join('-'),
    )
    .join(' ');
}
