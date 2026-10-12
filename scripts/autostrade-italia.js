// Nome e percorso delle autostrade presenti nei dati.
//
// REGOLA: un'informazione compare solo se è confermata da almeno due fonti
// indipendenti. Nel dubbio non si scrive nulla: la pagina mostra la sola sigla.
//
// Fonti confrontate il 9 ottobre 2026:
//   [M] denominazioni comunicate dai gestori al MIMIT nell'indirizzo dell'impianto
//   [A] elenco della rete sul sito di Autostrade per l'Italia (autostrade.it/it/la-nostra-rete)
//   [W] elenco «Autostrade in Italia» di Wikipedia in italiano
//   [T] Enciclopedia Treccani, voce «autostrada»
//
// Percorso: formulazione di [A], coerente con [M] e [W].
// Nome: solo quando è attestato da una fonte diversa da Wikipedia.
//
// Volutamente assenti, perché attestati dalla sola Wikipedia: i nomi d'uso di
// A4, A5, A6, A7, A8, A9, A10, A11, A12, A13, A14, A15, A16, A21, A22, A23, A24,
// A25, A26, A27, A31, A32, A91. Possono essere aggiunti uno per uno quando una
// seconda fonte li conferma.

export const AUTOSTRADE = {
  A1: { nome: 'Autostrada del Sole', percorso: 'Milano - Napoli' },            // nome [T][W], percorso [A][M][W]
  A2: { nome: 'Autostrada del Mediterraneo', percorso: 'Salerno - Reggio Calabria' }, // nome [M][W], percorso [A][W]
  A3: { percorso: 'Napoli - Salerno' },                 // [A][M][W]
  A4: { percorso: 'Torino - Trieste' },                 // [A][W], tratte in [M]
  A5: { percorso: 'Torino - Aosta' },                   // [A], tratte in [M]
  A6: { percorso: 'Torino - Savona' },                  // [A][M][W]
  A7: { percorso: 'Milano - Genova' },                  // [A][W], tratte in [M]
  A8: { percorso: 'Milano - Varese' },                  // [A][M][W]
  A9: { percorso: 'Lainate - Como - Chiasso' },         // [M][W]
  A10: { percorso: 'Genova - Ventimiglia' },            // [A][W], tratte in [M]
  A11: { percorso: 'Firenze - Pisa' },                  // [A][M][W]
  A12: { percorso: 'Genova - Roma' },                   // [A], tratte in [M]
  A13: { percorso: 'Bologna - Padova' },                // [A][M][W]
  A14: { percorso: 'Bologna - Taranto' },               // [A][M][W]
  A15: { percorso: 'Parma - La Spezia' },               // [A][M]
  A16: { percorso: 'Napoli - Canosa' },                 // [A][M][W]
  A18: { percorso: 'Messina - Catania' },               // [A][M][W]
  A19: { percorso: 'Palermo - Catania' },               // [A][M][W]
  A20: { percorso: 'Messina - Palermo' },               // [A][M]
  A21: { percorso: 'Torino - Piacenza - Brescia' },     // [W], tratte in [M], estremi in [A]
  A22: { percorso: 'Brennero - Modena' },               // [A][M][W]
  A23: { percorso: 'Palmanova - Tarvisio' },            // [A][W], tratte in [M]
  A24: { percorso: "Roma - L'Aquila - Teramo" },        // [A][M][W]
  A25: { percorso: 'Torano - Pescara' },                // [A][W]
  A26: { percorso: 'Genova Voltri - Gravellona Toce' }, // [M][W], [A] in forma breve
  A27: { percorso: 'Venezia - Belluno' },               // [A][W]
  A28: { percorso: 'Portogruaro - Conegliano' },        // [A][M][W]
  A30: { percorso: 'Caserta - Salerno' },               // [A][M][W]
  A31: {},                                              // tre fonti, tre percorsi diversi: nulla
  A32: { percorso: 'Torino - Bardonecchia' },           // [A][M][W]
  A35: { nome: 'BreBeMi' },                             // nome [M][W]; percorso solo [W]: nulla
  A50: { nome: 'Tangenziale Ovest di Milano' },         // [M][W]
  A51: { nome: 'Tangenziale Est di Milano' },           // [M][W]
  A52: { nome: 'Tangenziale Nord di Milano' },          // [M][W]
  A55: { nome: 'Tangenziale di Torino' },               // [M][W]
  A56: { nome: 'Tangenziale di Napoli' },               // nome [M][A][W]; sigla [W]
  A57: { nome: 'Tangenziale di Mestre' },               // [M][A][W]
  A58: { nome: 'Tangenziale Est Esterna di Milano' },   // [M][W]
  A90: { nome: 'Grande Raccordo Anulare di Roma (GRA)' }, // [M] «G.R.A.», [A], [W]
  A91: { percorso: 'Roma - Fiumicino' },                // [M][W]
};

/**
 * Sigla dell'autostrada di un'area di servizio, ricavata dall'indirizzo e dal
 * nome comunicati dal gestore. Restituisce null quando non è determinabile con
 * certezza: l'area resta nei dati, ma non compare in nessuna pagina autostrada.
 */
export function highwayCode(text) {
  const t = text.toUpperCase();
  // La Catania-Siracusa è un'autostrada senza numero: non è la A18 (Messina-Catania).
  if (/CATANIA\s*-\s*SIRACUSA/.test(t)) return null;
  if (/TANG\S*\s+DI\s+NAPOLI/.test(t)) return 'A56';
  // Due sigle nello stesso indirizzo (A4/A5, A8-A9, A8/A26): raccordi e tratti
  // comuni, non attribuibili a una sola autostrada.
  if (/\bA\s?\d{1,2}\s*[\/-]\s*A?\s?\d{1,2}\b/.test(t)) return null;

  const m = t.match(/\bA\s?(\d{1,2})\b/);
  if (!m) return null;
  let code = `A${m[1]}`;
  // Dal 2017 la Salerno-Reggio Calabria è la A2; la A3 è la sola Napoli-Salerno.
  // Molti gestori comunicano ancora la vecchia sigla.
  if (code === 'A3' && /SALERNO\s*-\s*REGGIO/.test(t)) code = 'A2';
  // Una sigla che non esiste nell'elenco è un errore di inserimento.
  return AUTOSTRADE[code] ? code : null;
}
