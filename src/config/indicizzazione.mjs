// Apertura progressiva delle pagine a Google.
//
// Tutte le pagine esistono fin dal primo giorno, ma solo quelle della fase in
// corso sono indicizzabili: le altre sono in «noindex» e fuori dalla sitemap.
// Per passare alla fase successiva basta cambiare FASE qui sotto e rifare il
// build. Piano completo e criteri di passaggio: README.md, «Plan d'indexation».
//
// File in JavaScript puro perché è letto sia dalle pagine sia da astro.config.mjs.

/** Fase in corso. Cambiare solo questo numero, una fase alla volta. */
export const FASE = 1;

// comuni: numero minimo di impianti perché la pagina di un comune sia indicizzabile
// marche, autostrade: pagine dei marchi e delle autostrade (elenco e schede)
const FASI = {
  1: { comuni: 20, marche: false, autostrade: false },
  2: { comuni: 10, marche: true, autostrade: true },
  3: { comuni: 6, marche: true, autostrade: true },
  4: { comuni: 4, marche: true, autostrade: true },
  5: { comuni: 3, marche: true, autostrade: true },
};

const regole = FASI[FASE];
if (!regole) throw new Error(`indicizzazione.mjs: la fase ${FASE} non esiste`);

/**
 * Sotto questa soglia la media di un comune o di un'autostrada è poco
 * significativa: la pagina non è mai indicizzata, in nessuna fase.
 */
export const MIN_IMPIANTI_SIGNIFICATIVI = 3;

/** @param {number} count numero di impianti del comune */
export const comuneIndicizzabile = (count) => count >= regole.comuni;

export const marcheIndicizzabili = regole.marche;

export const elencoAutostradeIndicizzabile = regole.autostrade;

/** @param {number} count numero di aree di servizio dell'autostrada */
export const autostradaIndicizzabile = (count) =>
  regole.autostrade && count >= MIN_IMPIANTI_SIGNIFICATIVI;
