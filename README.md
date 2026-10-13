# Mio Carburante

Comparateur de prix des carburants pour l'Italie, décliné de mon-carburant.com : même design, même header, même page d'accueil avec carte.

**Stack** : Astro v5 · Tailwind CSS v4 · TypeScript · Leaflet (auto-hébergé)

## Commandes

```bash
npm install
npm run fetch-fuel          # télécharge les deux fichiers du ministère et génère les JSON
npm run fetch-fuel:offline  # régénère depuis les fichiers déjà dans .cache/ (sans réseau)
npm run dev                 # http://localhost:4321
npm run build               # fetch-fuel + site statique dans /dist
npm run build:astro         # site seul, avec les données déjà générées
```

## Données

Source unique : open data du MIMIT (ministère italien), licence **IODL 2.0**, usage commercial autorisé à condition de citer la source et de ne pas se présenter comme site officiel.

- `anagrafica_impianti_attivi.csv` : les stations
- `prezzo_alle_8.csv` : les prix en vigueur à 8 h la veille de la publication

`scripts/fetch-fuel-data.js` nettoie et agrège. Règles appliquées :

- quatre carburants standard (benzina, gasolio, GPL, metano), les carburants premium des marques sont ignorés ;
- prix de référence = libre-service (`self`), le prix servi (`servito`) est conservé à part ;
- prix de plus de 30 jours ou hors bornes écartés ;
- arrêt sans rien écrire si moins de 15 000 stations ont un prix (fichier incomplet).

Fichiers générés, non versionnés : `src/data/fuel/` et `public/data/`.
Fichier versionné : `src/data/price-history.json` (une ligne par jour, pour les futurs graphiques).

## Mise en ligne

Dépôt : `github.com/Hugo909435/monCarburantSEOitalien`. Hébergement : Hostinger, domaine `mio-carburante.it`.

`.github/workflows/deploy.yml` télécharge les prix, construit le site, enregistre la ligne du jour dans `price-history.json` et envoie `dist/` par FTP. Il tourne deux fois par jour (8 h 30 et 13 h 30 UTC), à chaque push sur `main`, et à la demande depuis l'onglet Actions.

Secrets à définir dans le dépôt GitHub : `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD`. Sans eux, le site est construit mais pas envoyé. Le compte FTP doit ouvrir directement le `public_html` du site italien : le déploiement efface du serveur ce qui n'est pas dans `dist/`, et s'annule si le `robots.txt` distant ne cite pas le domaine.

## Pages

| URL | Nombre |
|---|---|
| `/` accueil avec carte | 1 |
| `/prezzi-carburanti/` | 1 |
| `/prezzi-carburanti/regione/<slug>/` | 20 |
| `/prezzi-carburanti/province/` puis `/provincia/<slug>/` | 1 + 107 |
| `/prezzi-carburanti/comune/<nom>-<sigle>/` | environ 5 280 |
| `/prezzi-carburanti/marca/` puis `/marca/<slug>/` | 1 + 34 |
| `/prezzi-carburanti/autostrada/` puis `/autostrada/<a1>/` | 1 + 40 |
| `/prezzo-benzina/`, `/prezzo-gasolio/`, `/prezzo-gpl/`, `/prezzo-metano/` | 4 |
| `/guide/` puis `/guide/<slug>/` | 1 + 15 |
| `/prezzi-carburanti/metodologia/`, `/chi-siamo/`, `/contatti/`, `/note-legali/`, `/privacy/` | 5 |

Toutes ces pages sont générées, mais seule une partie est ouverte à Google : voir le plan ci-dessous.

## Plan d'indexation (ouverture progressive à Google)

Décision de l'utilisateur du 12 octobre 2026 : ne pas proposer toutes les pages à Google d'un coup, comme sur le site français (environ 1 000 pages). Les pages hors palier restent en ligne et consultables, mais en `noindex, follow` et hors sitemap.

**Palier en cours : 1** (réglé le 12 octobre 2026, site pas encore en ligne).

Un seul réglage : `FASE` dans `src/config/indicizzazione.mjs`. Il pilote à la fois la balise `noindex` des pages et le filtre du sitemap dans `astro.config.mjs`.

| Palier | Ouvert à Google | Pages indexables |
|---|---|---|
| 1 | accueil, 4 carburants, 20 régions, 107 provinces et leur liste, méthodologie, pages légales, communes de 20 stations et plus (138), guides (liste et 15 articles) | 292 |
| 2 | + marques (liste et 34 fiches), autoroutes (liste et fiches de 3 aires et plus), communes de 10 stations et plus (399) | environ 620 |
| 3 | + communes de 6 stations et plus (817) | environ 1 040 |
| 4 | + communes de 4 stations et plus (1 414) | environ 1 640 |
| 5 | + communes de 3 stations et plus (1 956) | environ 2 180 |

Les nombres de communes sont ceux des données du 8 octobre 2026 et bougent un peu chaque jour. Les communes et autoroutes de moins de 3 stations ne sont jamais indexées (`MIN_IMPIANTI_SIGNIFICATIVI`).

Règles pour avancer, dans l'ordre :

1. Un palier à la fois, jamais deux d'un coup.
2. Passer au suivant seulement quand la Search Console montre que la grande majorité des pages du palier en cours sont indexées.
3. Si un palier s'indexe mal (beaucoup de « explorée, actuellement non indexée »), ne pas avancer : enrichir d'abord les pages.
4. Le palier 3 correspond à la taille du site français. Les paliers 4 et 5 sont facultatifs et à décider avec l'utilisateur.

Pour changer de palier : modifier `FASE`, lancer `npm run build`, vérifier que le nombre d'URL de `dist/sitemap-0.xml` correspond au tableau, puis mettre à jour « Palier en cours » et le journal.

Journal :

- 12 octobre 2026 : palier 1 mis en place, 276 URL dans le sitemap.
- 13 octobre 2026 : ajout de la rubrique « Guide » (liste et 15 articles), indexable dès le palier 1 : 292 URL dans le sitemap.

## Guides (articles)

Rubrique `/guide/`, créée le 13 octobre 2026 : 15 articles sur des sujets italiens (accises, self et servito, pompe bianche, autoroutes, GPL, metano, étiquettes, Osservaprezzi…). Aucun n'est traduit du site français.

- Liste, titres et descriptions : `src/config/guide.ts`. Un article = une page `src/pages/guide/<slug>.astro`, gabarit `src/layouts/GuidaLayout.astro`.
- Les chiffres sont recalculés à chaque build à partir des données du ministère, et les phrases s'adaptent aux données (qui est le moins cher, dans quel sens va l'écart). Calculs partagés : `src/lib/guide.ts`.
- Les faits extérieurs (normes, fiscalité) ont été lus dans au moins deux sources, notées en commentaire dans chaque page et affichées en bas de l'article.
- **À surveiller : les accises.** Quatre articles (accises, formation du prix, plein, gasolio ou benzina) calculent la part de taxes avec l'accise pleine de 672,90 € pour mille litres, vérifiée le 13 octobre 2026. Le gouvernement l'a réduite plusieurs fois par décret en 2026 : à chaque nouveau décret, mettre à jour `src/config/fisco.ts` (valeur et date de vérification) et le paragraphe « I tagli temporanei del 2026 » de `accise-benzina-gasolio.astro`.
- Livigno est une zone extradouanière : ses prix sont exclus des calculs des guides (`src/lib/guide.ts`). Le filtre anti-erreurs de `scripts/fetch-fuel-data.js` écarte une partie de ses prix réels (trop loin de la médiane nationale), donc la page de Livigno affiche des moyennes faussées : à corriger avant d'écrire un article sur Livigno.

## Où changer quoi

- Nom du site, domaine, identifiants Analytics : `src/config/site.ts` (et la constante `SITE` de `astro.config.mjs`, plus `public/robots.txt`).
- Lecture des données et formatage : `src/lib/fuel.ts`.
- Styles des pages de prix : `src/styles/prezzi.css`. Couleurs et polices : `src/styles/global.css`.
- Carte de l'accueil : `src/components/HeroMap.astro`, alimentée par `public/data/impianti.json`.

## Avant la mise en ligne

Pages légales rédigées le 12 octobre 2026 à partir de celles du site français (même éditeur, même hébergeur). Restent à faire :

- remplacer `contactEmail` dans `src/config/site.ts` par une adresse du domaine italien quand elle existera (pour l'instant celle du site français) ;
- Analytics : `gaId` rempli le 13 octobre 2026 (`G-0CH8CM88FW`). Cela active le bandeau de consentement (`src/components/CookieBanner.astro`, logique dans `public/js/cookie-consenso.js`) et la version « avec Analytics » de la section « Cookie » de `src/pages/privacy.astro`. Google Analytics n'est chargé qu'après acceptation. Bandeau écrit et testé en local le 13 octobre 2026 ;
- AdSense : avant de remplir `adsClient`, écrire la partie publicité de la section « Cookie » et étendre le bandeau aux cookies publicitaires : le build s'arrête tant que ce n'est pas fait.
