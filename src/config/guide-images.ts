// Immagine di copertina di ogni guida, con i crediti richiesti dalla licenza.
// Fonte di tutte le immagini: Wikimedia Commons (file scaricati il 13 ottobre 2026,
// licenza e autore letti nei metadati di ogni file). I file sono in public/images/guide/
// a 960×630, ritagliati o incorniciati senza deformarli.
export type ImmagineGuida = {
  /** Nome del file su Wikimedia Commons, senza «File:» */
  file: string;
  /** Testo alternativo in italiano, descrive cosa si vede */
  alt: string;
  autore: string;
  licenza: string;
  /** Pagina del file su Commons, dove si legge la licenza completa */
  url: string;
};

const commons = (file: string) => `https://commons.wikimedia.org/wiki/File:${file.replace(/ /g, '_')}`;

const img = (slug: string, file: string, alt: string, autore: string, licenza: string): [string, ImmagineGuida] => [
  slug,
  { file, alt, autore, licenza, url: commons(file) },
];

export const IMMAGINI_GUIDE: Record<string, ImmagineGuida> = Object.fromEntries([
  img('accise-benzina-gasolio', '1 Euro at Republica 2023 01.jpg', 'Monete da un euro', 'Kritzolina', 'CC BY-SA 4.0'),
  img('come-si-forma-il-prezzo-della-benzina', 'Oil refinery, Port Dickson.jpg', 'Raffineria di petrolio', 'AyyanD', 'CC BY-SA 4.0'),
  img('self-o-servito', 'Weyl service station pump front.JPG', 'Colonnine self service di un distributore di benzina', 'Ammodramus', 'Pubblico dominio'),
  img('gasolio-o-benzina-quale-costa-di-piu', 'Refueling a diesel vehicle at a gas station during the day with focus on the fuel cap and nozzle.jpg', 'Rifornimento di un\'auto diesel: pistola e bocchettone', 'Shixart1985', 'CC BY 2.0'),
  img('dove-costa-meno-la-benzina', 'Regions of Italy with official names.png', 'Mappa delle regioni d\'Italia', 'LorenzoF06 (originale di mac9)', 'CC BY-SA 4.0'),
  img('pompe-bianche', 'Petrol stations at night 01.jpg', 'Distributore di carburante di notte', 'RamaGaspar', 'CC BY-SA 4.0'),
  img('prezzi-benzina-grandi-citta', 'Vol I (42) Mediolanum (Milan). (IA dr vol-i-42-mediolanum-milan-12126088).jpg', 'Milano in un\'antica incisione', 'Georg Braun e Franz Hogenberg (incisione del XVI secolo)', 'Pubblico dominio'),
  img('prezzi-carburanti-in-autostrada', 'A14 presso Montone.jpg', 'Autostrada A14 presso Montone', 'Syrio', 'CC BY-SA 4.0'),
  img('gpl-auto-prezzo', 'Autogastank in japan.jpg', 'Serbatoio di GPL per auto', 'maneco1227', 'Pubblico dominio'),
  img('metano-auto-prezzo', 'Dual Fuel (48638292123).jpg', 'Auto a doppia alimentazione', 'Archives New Zealand', 'CC BY 2.0'),
  img('etichette-carburanti-e5-e10-b7', '91 Octane gasoline label.jpg', 'Etichetta della benzina con indice di ottano 91', 'Epolk', 'CC BY-SA 4.0'),
  img('marchi-carburante-prezzi', 'Vintage Mobil gas station.jpg', 'Vecchio distributore Mobil', 'Moxmarco', 'CC BY-SA 4.0'),
  img('osservaprezzi-carburanti', 'Unlocking Government Data for Wikidata- Stories, Impacts, and Open Dialogue --Wikimania 2025, Nairobi-070A4860.jpg', 'Incontro sui dati pubblici aperti', 'Bijay Chaurasia', 'CC BY-SA 4.0'),
  img('quanto-costa-un-pieno', 'Biofuel Propel Gas Tank.jpg', 'Serbatoio di carburante', 'Robert Couse-Baker', 'CC BY 2.0'),
  img('risparmiare-confrontando-i-distributori', '-finance -wealth -savings -security -coin.jpg', 'Monete accatastate', 'Free Images', 'CC BY 2.0'),
]);
