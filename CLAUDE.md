# Consignes pour Claude : site italien de prix des carburants

## Deux sites distincts (NON NÉGOCIABLE)

Ce site et le site français mon-carburant.com
(`C:\Users\hbeignon\Desktop\monCarburant\projetSeoMoncarburant`) sont **deux sites
différents**.

- Ne jamais dupliquer ni traduire un article du blog français pour ce site.
- Tout contenu éditorial italien part d'un sujet italien : accises, self contre
  servito, GPL et metano, autostrade, réglementation italienne.
- Ce qui est commun et doit le rester : le design, le header, la structure des
  pages et la page d'accueil avec carte, repris volontairement du site français.

Décision de l'utilisateur du 9 octobre 2026.

## Aucune information non vérifiée (NON NÉGOCIABLE)

Règle de l'utilisateur, 9 octobre 2026 : « quand t'es pas sûr ne mets rien, je
ne veux pas d'erreur ».

- Tout fait écrit sur le site qui ne sort pas directement des données du
  ministère (nom d'usage d'une autoroute, trajet, règle fiscale, chiffre de
  contexte) doit être confirmé par au moins deux sources indépendantes, lues à
  la source et non résumées de mémoire.
- En cas de doute ou de sources qui se contredisent : ne rien afficher. Une
  page avec moins d'information vaut mieux qu'une page avec une erreur.
- Noter dans le code d'où vient chaque information ajoutée, comme dans
  `scripts/autostrade-italia.js`.

## Données : obligations de la licence

Les prix viennent des open data du MIMIT, sous licence IODL 2.0. L'usage
commercial est autorisé, à deux conditions à respecter dans tout nouveau gabarit :

- citer la source et le ministère sur les pages de prix ;
- ne rien faire qui laisse croire que le site est officiel (pas d'habillage
  institutionnel ni tricolore, mention « sito non ufficiale » conservée).

## Rédaction

L'utilisateur ne parle pas italien : c'est à Claude de vérifier lui-même la
qualité de l'italien, sans renvoyer cette vérification à l'utilisateur ni à un
relecteur.

Pour tout texte italien rédigé ou modifié, relire avant de rendre la main :

- grammaire et accords, en particulier l'article devant le carburant
  (la benzina, il gasolio, il GPL, il metano) et les prépositions articulées ;
- singulier et pluriel dans les phrases générées à partir d'un nombre
  (1 distributore, 2 distributori) ;
- vocabulaire du secteur tel qu'il s'emploie en Italie : distributore, impianto,
  self, servito, pompe bianche, area di servizio ;
- noms de communes et de provinces correctement écrits (majuscules, apostrophes) ;
- registre : phrases naturelles, pas de calque du français.

Expliquer en français à l'utilisateur ce que dit chaque nouveau texte, puisqu'il
ne peut pas le lire lui-même.

## Repères

Commandes, architecture des pages et emplacement des réglages : voir `README.md`.
Nom du site : « Mio Carburante », confirmé par l'utilisateur le 12 octobre 2026. Domaine `mio-carburante.it` pas encore acheté. Réglages : `src/config/site.ts`.
