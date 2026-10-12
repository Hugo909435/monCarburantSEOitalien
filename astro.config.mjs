import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import {
  comuneIndicizzabile, autostradaIndicizzabile, marcheIndicizzabili, elencoAutostradeIndicizzabile,
} from './src/config/indicizzazione.mjs';

// Stesso valore di SITE.url in src/config/site.ts
const SITE = 'https://mio-carburante.it';


const readData = (file) => {
  try {
    return JSON.parse(readFileSync(new URL(`./src/data/fuel/${file}`, import.meta.url), 'utf-8'));
  } catch {
    return null; // dati non ancora generati
  }
};

const meta = readData('meta.json');
const lastmod = meta?.lastUpdate ? new Date(meta.lastUpdate) : new Date();

// Le pagine in noindex non devono comparire nella sitemap: stesse regole delle
// pagine, lette da src/config/indicizzazione.mjs.
const weakUrls = new Set([`${SITE}/privacy/`]);
for (const c of readData('comuni.json') ?? []) {
  if (!comuneIndicizzabile(c.count)) weakUrls.add(`${SITE}/prezzi-carburanti/comune/${c.slug}/`);
}
for (const a of readData('autostrade.json') ?? []) {
  if (!autostradaIndicizzabile(a.count)) weakUrls.add(`${SITE}/prezzi-carburanti/autostrada/${a.slug}/`);
}
const closedSections = [
  !marcheIndicizzabili && `${SITE}/prezzi-carburanti/marca/`,
  !elencoAutostradeIndicizzabile && `${SITE}/prezzi-carburanti/autostrada/`,
].filter(Boolean);
const inSitemap = (page) =>
  !page.includes('/404') && !weakUrls.has(page) && !closedSections.some((s) => page.startsWith(s));

export default defineConfig({
  site: SITE,
  output: 'static',
  trailingSlash: 'always',
  compressHTML: true,
  prefetch: { defaultStrategy: 'hover' },
  integrations: [
    mdx(),
    sitemap({
      filter: inSitemap,
      serialize(item) {
        if (item.url === `${SITE}/`) {
          item.lastmod = lastmod.toISOString();
          item.changefreq = 'daily';
          item.priority = 1.0;
        } else if (item.url.includes('/prezzi-carburanti/') || item.url.includes('/prezzo-')) {
          // Pagine dei prezzi: ricalcolate ogni giorno
          item.lastmod = lastmod.toISOString();
          item.changefreq = 'daily';
          item.priority = 0.8;
        } else {
          item.changefreq = 'monthly';
          item.priority = 0.4;
        }
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    // CSS in file separati e messi in cache: con oltre 5.000 pagine, inserirli
    // in ogni HTML moltiplicherebbe il peso del sito.
    inlineStylesheets: 'never',
  },
});
