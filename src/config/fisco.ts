// Imposte sui carburanti usate nei calcoli delle guide.
//
// Aliquota piena dell'accisa: 672,90 euro per mille litri, uguale per benzina e
// gasolio usato come carburante dal 1° gennaio 2026. Nel 2026 il governo l'ha
// ridotta più volte per decreto, per periodi limitati; l'ultimo sconto (gasolio,
// 5 centesimi al litro) è terminato il 5 ottobre 2026.
// Fonti lette il 13 ottobre 2026:
// - quotidianomotori.com/automobili/accise-carburanti/ (aliquota, tagli del 2026);
// - sbircialanotizia.it/articoli/2026/10/08/gasolio-accise-hobrl/ (ritorno
//   all'aliquota piena dal 6 ottobre 2026, decreto-legge 162/2026);
// - teleborsa.it/Guide/2026/04/10/da-che-cosa-dipende-il-prezzo-della-benzina-1.html
//   (672,90 dal 1° gennaio 2026, ridotta a 472,90 in primavera; IVA al 22% anche
//   sull'accisa);
// - rivaluta.it/prezzi/prezzi-carburanti-accise-iva-netto.asp (dati MASE del
//   5 ottobre 2026: accisa 0,673 €/l, IVA calcolata su netto + accisa).
//
// DA RICONTROLLARE a ogni nuovo decreto sulle accise: se l'aliquota in vigore
// cambia, aggiornare ACCISA e DATA_VERIFICA (le guide dicono che il calcolo usa
// l'aliquota piena e in quale data è stata verificata).
export const ACCISA = 0.6729; // €/litro, benzina e gasolio
export const IVA = 0.22;
export const DATA_VERIFICA = '2026-10-13';
