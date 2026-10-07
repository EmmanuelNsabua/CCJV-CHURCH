# 031 — Schémas de contenu des pages éditoriales

> **Statut :** spécification formelle dérivée du frontend réel. Elle applique la
> décision **D-23** (`docs/028` §6) — *« Contrat de contenu par template, jamais de
> page builder »* — et le livrable n°3 de `docs/028` §11.
> **Périmètre :** le contenu éditable de `Page.content` pour les **huit pages
> canoniques** de `docs/025` §8. Aucune structure, aucun layout, aucune liste.
> **Règle de dérivation :** chaque champ de ce document est **relevé dans le code**
> (`frontend/src/app/**`, `frontend/src/components/**`, `frontend/src/data/mock/**`,
> `backend/src/domain/content/page-content.ts`). Un champ sans provenance vérifiable
> n'est pas proposé.
> **Ce document ne code rien** : les extraits Zod sont normatifs pour le
> comportement, pas un patch à appliquer.

---

# 0. Méthode, sources et vocabulaire

## 0.1 Sources inspectées

| Source | Ce qui en est tiré |
| --- | --- |
| `frontend/src/app/page.tsx` (337 l.) | sections de l'Accueil, textes, CTA, images |
| `frontend/src/app/qui-sommes-nous/page.tsx` (624 l.) | 14 sections, textes, versets, images |
| `frontend/src/app/organisation/page.tsx` (542 l.) + `OrganisationExplorer.tsx` + `DepartmentModal.tsx` | 7 sections, fiche département, replis |
| `frontend/src/app/vie-de-leglise/**`, `frontend/src/app/communaute/**`, `frontend/src/app/publications/**` | pages Événements, Où nous trouver, Faire un don, Communauté |
| `frontend/src/components/composition/*` (6), `editorial/*` (13), `archetypes/*` (7 + `rhythm.ts`) | contrat de props réel : quelles données un composant consomme |
| `frontend/src/data/mock/site.ts`, `verses.ts`, `images.ts`, `departments.ts`, `community.ts` | faits institutionnels, versets, rôles d'image, données départementales |
| `frontend/src/types/index.ts`, `frontend/src/lib/api/types.ts`, `endpoints.ts`, `nav.ts` | modèle frontend, contrat de lecture, navigation |
| `backend/src/domain/content/page-content.ts` | registre Zod actuel : 6 `pageKey` |
| `backend/src/modules/static-pages/*` | validation à l'écriture, `PAGE_NOT_FOUND`, `VALIDATION_ERROR` |
| `backend/src/infrastructure/database/schema/editorial.ts` + `seed-data.ts` | `static_pages`, `scriptures`, `schedule_entries`, `social_links`, `site_settings` — et les valeurs déjà enregistrées |
| `backend/src/modules/settings/setting.schema.ts` | liste fermée des clés institutionnelles déjà éditables |
| `docs/015`, `docs/016`, `docs/018` §5, `docs/020` §12-13, `docs/022` §9, `docs/024` §24, `docs/025` §8 | principes éditoriaux et modèle `Page` déjà arbitrées |

## 0.2 Vocabulaire de types employé dans les tableaux

| Type | Définition normative |
| --- | --- |
| `text(n)` | chaîne **nettoyée** (`trim`), non vide, longueur ≤ `n`. Jamais de HTML, jamais de balisage. |
| `text?(n)` | idem, mais **facultatif** : absent ⇒ le frontend garde son texte par défaut. |
| `cta?(n)` | libellé de bouton (≤ `n`). **La cible du CTA reste dans le code** (§1.2). |
| `media?` | référence d'un média de la bibliothèque (`Media.id`, UUID). La forme de transition `mediaOrLegacyPath` (§3.1) accepte un chemin `/media/ccjv-XX.jpeg` **le temps de la migration** (§6.4, M6). |
| `verse?` | **clé** d'un enregistrement `Scripture` (`scriptures.key`) — pas le texte du verset (§2.9). |
| `items[]` | tableau **borné** d'objets dont tous les champs sont eux-mêmes des `text`/`media`. L'ordre des éléments est éditorial ; l'ordre des **sections** ne l'est pas (§1.4, L6). |

**Provenance** est notée `chemin:lignes`. Quand une valeur est déjà persistée, la
provenance est donnée en deux temps : le code du frontend **et** la graine
(`seed-data.ts`).

**Décompte des champs.** Un champ = **une clé de schéma**. Les tableaux du §2
regroupent parfois une paire `image` + `imageAlt` (alt descriptif fourni par le
code) ou une paire de libellés d'état vide sur une même ligne : le total annoncé
compte les **clés**, pas les lignes.

## 0.3 Ce que ce document n'est pas

Ce document n'est **pas** un plan d'implémentation, **pas** un schéma SQL, et
**pas** une autorisation à créer des champs hors contrat. Les huit contrats
ci-dessous sont **fermés** : ajouter une page ou une section relève de la Phase 6
(`docs/025` §20 et `docs/028` §11).

---

# 1. Principe et frontière

## 1.1 La chaîne D-23

```text
Template           (code — dérivé de pageKey)
   ↓
Sections autorisées (code — JSX fixe, ordre fixe)
   ↓
Champs éditables     (back-office — valeurs uniquement)
```

`Page.content` est **flexible à l'intérieur du contrat**, jamais arbitraire. Le
`content` n'est pas un document : c'est un **jeu de valeurs nommées** qui remplit
des emplacements que le code a déjà décidés.

## 1.2 Ce que le back-office contrôle

- **les textes éditoriaux** : titres de page et de section, chapeaux, paragraphes,
  mentions, phrases de repli assumées ;
- **les libellés de CTA** (`cta`) — la **cible** (route, ancre, lien externe) reste
  dans le code ;
- **les références de verset** (`verse` → `scriptures.key`) là où le code place un
  verset ;
- **les images** (`media`) que le code attend à un emplacement donné ;
- **les éléments de présentation** de liste bornée (`items[]`) : cartes de
  conviction, jalons historiques, étapes, repères — c'est-à-dire **le contenu de
  l'emplacement**, jamais son existence ;
- **les valeurs éditoriales des entités départementales** (`Department`) pour le
  template `[Département]` (§2.8) — par l'entité, pas par `Page.content`.

## 1.3 Ce que le code contrôle **exclusivement**

Structure · ordre des sections · existence d'une section · nom du composant ·
variantes (`PhotoGalleryVariant`, `FeatureImageVariant`, `ScriptureVariant`…) ·
largeurs et tons (`Band` `tone`/`space`/`width`/`rule`) · rythme (`rhythm`) ·
grille et colonnes · responsive · animations et révélations · design · typographie ·
maquette · routes et ancres · métadonnées SEO · textes alternatifs décoratifs ·
libellés d'état vide · micro-libellés internes · navigation · fil d'Ariane ·
numérotation automatique (`StepsList` `index + 1`, `OrganisationExplorer`
`String(idx + 1).padStart(2, "0")`).

Ces éléments sont **dans le JSX** : par exemple `NarrativePage` enveloppe chaque
section dans `{prop && (<Band …>)}` avec des tons littéraux
(`epilogue` `tone="dark"`, `MediaPage.gallery` `tone="dark"`, `EventPage.practical`
`tone="cream"`) et `rhythm` ne module que le `space` (`archetypes/rhythm.ts:12-18`).

## 1.4 Comment le système **empêche** qu'une structure soit modifiée

Sept verrous, tous déjà présents ou directement dérivés du code existant.

**L1 — Une seule porte d'écriture : le registre Zod.**
`StaticPageService.updateContent` valide par `schema.safeParse(content)` avant tout
`upsert` (`static-page.service.ts:55-68`). Un contenu non conforme produit
`VALIDATION_ERROR` (400) **nommant le champ fautif**
(`static-page.service.ts:59-66`), et non une écriture partielle.

**L2 — Le vocabulaire du contrat ne contient aucun mot de structure.**
Les types autorisés sont : texte, libellé de CTA, référence média, clé de verset,
tableau borné de ces mêmes types. Sont **interdits** dans `Page.content` : `html`,
`markdown`, `richText`, `script`, `style`, `className`, `section`, `sections`,
`block`, `blocks`, `component`, `template`, `order`, `position`, `index`, `variant`,
`tone`, `width`, `rhythm`, `layout`, `columns`, `href`, `slug`, `pageKey`.
Le commentaire du registre l'énonce déjà : « **seuls des champs textuels nommés**
existent ici […] Jamais de HTML, jamais de mise en page, jamais d'ordre de
sections » (`page-content.ts:16-19`).

**L3 — Rejet des clés inconnues.**
Chaque schéma de page est un `z.strictObject` : toute clé non déclarée est refusée.
C'est la même rigueur que celle déjà appliquée aux paramètres d'API — « Les schémas
de *query* sont des objets **stricts** : tout paramètre non reconnu est refusé ici,
et jamais ignoré en silence » (`presentation/openapi/document.ts:1400-1409`), avec
`z.strictObject` déjà utilisé par `prayer-request.schema.ts:50` et
`media.schema.ts:68`. **État actuel :** les schémas du registre sont des `z.object`
(`page-content.ts:35-75`) ; le passage en `strictObject` est une exigence de cette
spécification (écart §3.6).

**L4 — Le template est dérivé côté serveur, jamais reçu.**
Le template n'est pas une donnée d'entrée : il est obtenu par une table de
correspondance `pageKey → template` du code serveur. Si `docs/022` §9 fait
persister une colonne `template`, elle est **écrite par le serveur** et jamais lue
du corps de requête. Aucune route n'accepte de `template` en entrée.

**L5 — La route → `pageKey` est un littéral du frontend.**
Le back-office ne crée ni page, ni route, ni section : il ne peut écrire que dans
une clé déjà déclarée. Une clé inconnue est refusée en 404 métier
(`PAGE_NOT_FOUND`, `static-page.service.ts:24-34` et `.36-48`) — et non par un 400
de forme, la route `pageParamsSchema` étant volontairement permissive
(`static-page.schema.ts:13-17`).

**L6 — Le rendu n'itère jamais sur le contenu.**
Le JSX fixe la liste et l'ordre des sections : `app/page.tsx:59-334` pour
l'Accueil, 14 sections écrites à la main pour `/qui-sommes-nous`, 7 pour
`/organisation`. Les archétypes ne sont pas des moteurs de rendu : ils rendent des
**emplacements nommés**, chacun conditionnel (`{prop && <Band>}`), et les titres
`*Title` sont rendus **dans** le bloc conditionnel de leur contenu
(`ListingPage.tsx:58-62`, `DetailPage.tsx:75-79`, `DirectoryPage.tsx:65-69`,
`InformationPage.tsx:63-67`) : un titre fourni sans contenu ne s'affiche jamais.
Un `content` inattendu ne peut donc pas créer de section.

**L7 — L'absence est un état normal, pas une instruction.**
Un champ facultatif absent laisse le texte par défaut du code en place
(`page-content.ts:29-33`). Le contenu **remplit** ; il ne **supprime** ni ne
**réordonne** rien.

## 1.5 Pourquoi il n'y a pas de page builder

Décision déjà prise et verrouillée :

- `docs/025` §8 : « Il n'existe **aucun page builder générique**. » ;
- `docs/022` §9 : `Page` « ne doit pas être interprétée comme un page builder » ;
- `docs/025` §19 : « ne transforme pas les pages structurées en page builder » ;
- `docs/018` §5 : le `jsonb` est validé par un registre Zod parce que le back-office
  « édite des **champs nommés**, pas du HTML — pas de risque d'injection ni de mise
  en page cassée » ;
- `backend/src/infrastructure/database/schema/editorial.ts:17-21` : « on ne
  transforme pas l'interface en CMS générique ».

Un page builder produirait exactement les quatre dégâts que D-23 interdit :
(1) une structure non déterministe, donc un frontend qui ne sait plus ce qu'il
reçoit ; (2) du balisage saisi par l'éditeur, donc injection et mise en page
cassée ; (3) une régression garantie du responsive, des animations et de
l'accessibilité, qui sont aujourd'hui portés par le code ; (4) une maintenance
impossible, chaque page devenant un cas particulier.

## 1.6 Règles transverses du contrat

1. **Bornes de longueur obligatoires.** Aucun `text` sans maximum : une borne est
   une garantie de mise en page (le titre le plus long reste un titre).
2. **Titres courts.** Les `*Title` sont bornés à 120 (valeur déjà retenue par le
   registre actuel, `page-content.ts:36-75`) ; les chapeaux à 400-600 ; les corps à
   600-900.
3. **Longueur = maquette.** Les bornes sont alignées sur les volumes de texte
   effectivement rendus par les composants (colonne « Mots » de `docs/015` §2.2).
4. **Le contenu n'écrit jamais de lien.** Aucun `href` dans le contenu.
5. **Les textes alternatifs ne sont pas des champs** — sauf là où le code fournit
   aujourd'hui un `alt` descriptif littéral (§2.8, §2.2). Le composant `Hero`,
   `FeatureImage`, `PhotoDuo`, `PeopleGrid`, `CrossLinks` codent `alt=""`
   (décoratif) et n'exposent **aucune** prop `alt` : proposer un champ serait
   inventer une prop (§7, Q-PG6).
6. **Un verset est une référence, pas un texte.** Le texte et la traduction vivent
   dans `scriptures` (`editorial.ts:59-81`, `translation` affichée) ; `Page.content`
   ne porte que la **clé** (§7, Q-PG2).
7. **Les listes ne sont pas dans `Page`** (§5).
8. **Tout nouveau champ est facultatif** après gel (§3.5).
9. **Aucune mise en forme dans un texte.** Le contrat transporte du texte brut :
   les emphases internes (`<span class="italic">`, changement de couleur, lettrine,
   seconde ligne colorée) ne sont **jamais** exprimables. Là où le code applique une
   emphase à un fragment littéral — Accueil `Hero.tsx`, `/qui-sommes-nous` (titre
   sur deux lignes), `/vie-de-leglise/evenements:120-121`, `/communaute/*` —, soit
   l'emphase reste portée par le composant à une position fixe, soit elle est
   abandonnée : ce point est un choix de mise en œuvre, pas un champ.
10. **Aucune numérotation dans le contenu.** Les index affichés (`01`, `02`, …,
    `Étape 1`) sont produits par le code depuis la position de l'élément
    (`OrganisationExplorer.tsx:74`, `StepsList.tsx:37,64`). Aucun `index`, `order`
    ni `position` n'entre dans un schéma — ni pour les sections (L2), ni pour les
    éléments d'un tableau.
11. **Aucune cible dans le contenu.** Ni `href`, ni `target`, ni `slug` : les
    libellés de CTA sont éditables, les destinations sont du code.

---

# 2. Une fiche par page canonique

Ordre de `docs/025` §8. Pour chaque page : la route réelle, les sections relevées
dans le code, les champs éditables **avec provenance**, les contenus dynamiques
**non éditoriaux**, et ce qui n'est **jamais** éditable.

## 2.1 Accueil — `/`

**`pageKey` : `accueil`** (existant, `page-content.ts:35-40`).

### Sections relevées (haut → bas)

| # | Section | Source | Nature |
| --- | --- | --- | --- |
| 1 | Hero d'accueil | `app/page.tsx:60` → `features/pages/Hero.tsx` | éditorial + image |
| 2 | La Parole du jour (verset + mosaïque) | `app/page.tsx:63-67` (`VerseSection`) | verset |
| 3 | Un mot du pasteur (`id="mot-du-pasteur"`) | `app/page.tsx:70-107` | éditorial + image |
| 4 | Qui sommes-nous en bref | `app/page.tsx:110-140` | éditorial + image + CTA |
| 5 | Ce qui se passe (`EventsSection`) | `app/page.tsx:143-151` | éditorial + **dynamique** |
| 6 | Quand nous nous rassemblons (`WeekRhythm`) | `app/page.tsx:155-167` | éditorial + **dynamique** |
| 7 | Écouter la Parole (enseignements) | `app/page.tsx:170-206` | éditorial + **dynamique** |
| 8 | Les visages de notre communauté | `app/page.tsx:209-216` | éditorial + **dynamique** |
| 9 | Respiration photographique | `app/page.tsx:219-223` (`BreathingPhoto`) | image + texte |
| 10 | La prière | `app/page.tsx:226-246` | éditorial + CTA |
| 11 | Soutenir l'œuvre | `app/page.tsx:249-282` | éditorial + image + CTA |
| 12 | L'envoi | `app/page.tsx:285-334` | éditorial + CTA + réseaux |

### Champs éditables

| Clé | Type | Oblig. | Max | Description d'usage | Provenance |
| --- | --- | --- | --- | --- | --- |
| `heroTitle` | `text` | **oui** | 120 | Titre principal (h1) de la page. | `Hero.tsx:49` ; graine `seed-data.ts:242` |
| `heroIntro` | `text` | **oui** | 600 | Chapeau du hero : qui nous sommes, en deux phrases. | `Hero.tsx:50-58` ; graine `seed-data.ts:243-244` |
| `heroCtaPrimaryLabel` | `cta` | non | 48 | Libellé du CTA principal ; cible `/vie-de-leglise/ou-nous-trouver` en code. | `Hero.tsx:61-67` |
| `heroCtaSecondaryLabel` | `cta` | non | 48 | Libellé du CTA secondaire ; même cible, en code. | `Hero.tsx:68-70` |
| `heroImage` | `media` | non | — | Photo d'ouverture (portrait vertical). | `Hero.tsx:27` → `images.portraitLarge` = `/media/ccjv-05.jpeg` (`images.ts:23`) |
| `verseKey` | `verse` | non | 60 | Verset de la section 2 ; référence `scriptures.key`. | `page.tsx:64-65` → `verses.rassemblement` (`verses.ts:15-18`) |
| `pastorHeading` | `text?` | non | 160 | Titre de la section « mot du pasteur ». | `page.tsx:89-91` |
| `pastorMessage` | `text?` | non | 900 | Corps éditorial du mot du pasteur (paragraphe d'accueil). | `page.tsx:92-95` ; clé existante `page-content.ts:38` |
| `pastorMessageSecondary` | `text?` | non | 900 | Second paragraphe du mot du pasteur. | `page.tsx:96-100` |
| `pastorImage` | `media` | non | — | Portrait associé au mot du pasteur. | `page.tsx:79` → `images.portraitLarge` |
| `briefTitle` | `text?` | non | 120 | Titre du bloc « qui sommes-nous en bref ». | `page.tsx:113-115` |
| `briefIntro` | `text?` | non | 600 | Chapeau du bloc identité. | `page.tsx:116-121` |
| `briefCtaLabel` | `cta` | non | 48 | Libellé du lien vers `/qui-sommes-nous`. | `page.tsx:123-125` |
| `briefImage` | `media` | non | — | Photo du bloc identité. | `page.tsx:131` → `images.identite` = `/media/ccjv-27.jpeg` (`images.ts:15`) |
| `eventsTitle` | `text?` | non | 120 | Titre de la section agenda. | `page.tsx:144` ; défaut composant `EventsSection.tsx:66` |
| `eventsIntro` | `text?` | non | 400 | Chapeau de la section agenda. | `page.tsx:145` ; défaut `EventsSection.tsx:67` |
| `eventsCtaLabel` | `cta` | non | 48 | Libellé du CTA vers l'agenda complet. | `page.tsx:146` ; défaut `EventsSection.tsx:68` |
| `rhythmTitle` | `text?` | non | 120 | Titre de la section horaires. | `page.tsx:157` |
| `rhythmIntro` | `text?` | non | 400 | Description de la section horaires. | `page.tsx:159` |
| `rhythmCtaLabel` | `cta` | non | 48 | Libellé du CTA vers `/vie-de-leglise/ou-nous-trouver`. | `page.tsx:163-165` |
| `teachingsTitle` | `text?` | non | 120 | Titre de la section enseignements. | `page.tsx:176` |
| `teachingsIntro` | `text?` | non | 400 | Description de la section enseignements. | `page.tsx:178` |
| `teachingsNote` | `text?` | non | 300 | Mention de bas de section (chaîne YouTube). | `page.tsx:196-200` |
| `teachingsCtaLabel` | `cta` | non | 48 | Libellé du CTA vers `/publications/enseignements`. | `page.tsx:202-204` |
| `facesTitle` | `text?` | non | 120 | Titre de la section visages. | `page.tsx:211` |
| `facesIntro` | `text?` | non | 400 | Description de la section visages. | `page.tsx:213` |
| `breathingPhrase` | `text?` | non | 120 | Phrase de la photographie-respiration. | `page.tsx:221` |
| `breathingReference` | `text?` | non | 120 | Mention de la même photographie (aujourd'hui `CCJV — Lubumbashi`). | `page.tsx:222` |
| `breathingImage` | `media` | non | — | Photographie plein écran. | `page.tsx:220` → `images.louange` = `/media/ccjv-08.jpeg` (`images.ts:17`) |
| `prayerTitle` | `text?` | non | 120 | Titre du bloc prière. | `page.tsx:233` |
| `prayerMessage` | `text?` | non | 600 | Corps du bloc prière. | `page.tsx:235-239` |
| `prayerCtaLabel` | `cta` | non | 48 | Libellé du CTA « demander la prière » ; cible WhatsApp en code. | `page.tsx:241-243` |
| `supportTitle` | `text?` | non | 120 | Titre du bloc « soutenir l'église ». | `page.tsx:252-254` |
| `supportIntro` | `text?` | non | 600 | Chapeau du bloc don. | `page.tsx:255-258` |
| `supportNote` | `text?` | non | 400 | Précision sur les modalités de contribution. | `page.tsx:259-263` |
| `supportCtaLabel` | `cta` | non | 48 | Libellé du CTA « nous écrire ». | `page.tsx:265-267` |
| `supportImage` | `media` | non | — | Photo du bloc don. | `page.tsx:273` → `images.communaute` = `/media/ccjv-30.jpeg` (`images.ts:19`) |
| `sendingTitle` | `text?` | non | 120 | Titre de l'appel final. | `page.tsx:292` |
| `sendingMessage` | `text?` | non | 600 | Corps de l'appel final. | `page.tsx:294-297` |
| `sendingPrimaryCtaLabel` | `cta` | non | 48 | Libellé du CTA « planifier ma visite ». | `page.tsx:299-305` |
| `sendingSecondaryCtaLabel` | `cta` | non | 48 | Libellé du CTA WhatsApp. | `page.tsx:306-308` |
| `sendingLinkLabel` | `cta` | non | 60 | Libellé du lien final vers les horaires. | `page.tsx:326-331` |

**Total : 42 champs** (2 obligatoires, 40 facultatifs).

### Contenus dynamiques — **non** éditoriaux ici

| Contenu | Source runtime | Emplacement |
| --- | --- | --- |
| Événements à venir | `getEvents({ status: "UPCOMING", limit: 6 })` → `GET /events` (`endpoints.ts:138-150`) | section 5, `EventsSection` |
| Enseignements | `getPublications({ category: "ENSEIGNEMENT", limit: 3 })` (`endpoints.ts:162-178`) | section 7 |
| Visages de la communauté | `getCommunityFaces()` (`endpoints.ts:218-224`) | section 8 |
| Noms de départements (résolution d'affichage) | `getDepartments()` (`endpoints.ts:115-121`), mappé en `id → name` (`page.tsx:52-55`) | section 5 |
| Rythme hebdomadaire | `weeklyRhythm` (`site.ts:64-104`) / table `schedule_entries` | section 6 |
| Réseaux sociaux | `socials` (`site.ts:43-46`) / table `social_links` | section 12 |
| Signature et rôle du pasteur | `site.visionary`, `site.visionaryRole` (`site.ts:23-24`) — déjà éditables via `site_settings` | section 3 |
| Lien WhatsApp | `site.whatsappHref` (`site.ts:40`) — `site.whatsappHref` ∈ `ALLOWED_SETTING_KEYS` | sections 10, 11, 12 |
| Métadonnées SEO | `page.tsx:30-34` | hors rendu |

### Jamais éditable sur l'Accueil

Ordre et existence des 12 sections · variantes et tons (`tone="tinted"`,
`tone="green"`) · grilles `md:grid-cols-12` · `aspect-[3/4]`, `aspect-[4/3]` ·
cibles de tous les CTA et liens · ancres `#mot-du-pasteur`, `#horaires`,
`#enseignements`, `#communaute`, `#priere`, `#soutenir`, `#envoi` · titres
alternatifs (`alt=""`) · libellés internes des composants (« ÉVÉNEMENT »,
« Regarder sur YouTube », « Témoignage ») · nombre maximal d'éléments listés
(`EventsSection` plafonne à 3 par défaut, `EventsSection.tsx:72`) · métadonnées SEO.

---

## 2.2 Qui sommes-nous — `/qui-sommes-nous`

**`pageKey` : `qui-sommes-nous`** (existant, `page-content.ts:42-47`).

Page **synchrone**, JSX écrit à la main, **aucune** donnée d'API
(`app/qui-sommes-nous/page.tsx:26-27`).

### Sections relevées (haut → bas)

| # | Section | Source | Nature |
| --- | --- | --- | --- |
| 1 | Hero « Notre histoire & notre foi. » | `:32-58` | éditorial + image |
| 2 | La Vision (portrait, citation fondatrice) | `:63-103` | éditorial + image |
| 3 | Naissance — 17 Mars 2023 | `:108-147` | éditorial + image |
| 4 | Respiration biblique (`VerseSection variant="center" tone="cream"`) | `:152-157` | verset |
| 5 | L'histoire en marche (2 jalons) | `:162-230` | éditorial + images |
| 6 | Transition cinématographique | `:235-252` | image + titre |
| 7 | Ce qui nous définit (citation-manifeste) | `:257-272` | éditorial |
| 8 | Les piliers de notre marche (4 cartes) | `:277-378` | éditorial |
| 9 | La foi prend forme (3 repères + 4 photos) | `:383-448` | éditorial + images |
| 10 | Verset monumental (`variant="both" tone="dark"`) | `:453-460` | verset + 2 images |
| 11 | CCJV aujourd'hui (2 chiffres-clés) | `:465-513` | éditorial + image |
| 12 | Les visages (5 portraits) | `:518-565` | éditorial + **dynamique** |
| 13 | L'histoire continue | `:570-583` | éditorial |
| 14 | L'appel chaleureux | `:588-621` | éditorial + CTA |

### Champs éditables

| Clé | Type | Oblig. | Max | Description d'usage | Provenance |
| --- | --- | --- | --- | --- | --- |
| `title` | `text` | **oui** | 120 | Titre de la page (hero, h1). | `:47-50` ; graine `seed-data.ts:250` |
| `intro` | `text` | **oui** | 600 | Chapeau du hero. | `:52-55` ; graine `seed-data.ts:251-252` |
| `heroImage` + `heroImageAlt` | `media` + `text?` | non | — / 160 | Image de fond du hero et son texte alternatif descriptif. | `:36-37` → `images.hero` ; alt littéral `:37` |
| `visionHeading` | `text?` | non | 160 | Titre de la section « La Vision ». | `:82-85` |
| `visionQuote` | `text?` | non | 600 | Citation fondatrice (sans référence biblique). | `:87-91` |
| `visionBody` | `text?` | non | 900 | Corps de la section Vision. | `:93-99` |
| `visionImage` + `visionImageAlt` | `media` + `text?` | non | — / 160 | Portrait du visionnaire et son alt. | `:69-70` |
| `birthDate` | `text?` | non | 40 | Date mise en avant (aujourd'hui « 17 Mars 2023 »). | `:114-116` |
| `birthHeading` | `text?` | non | 160 | Titre de la section Naissance. | `:119-121` |
| `birthBody` | `text?` | non | 900 | Corps de la section Naissance. | `:123-128` |
| `birthImage` + `birthImageAlt` | `media` + `text?` | non | — / 160 | Photo des premiers rassemblements et son alt. | `:134-135` |
| `birthCaption` | `text?` | non | 200 | Légende photographique. | `:141-143` |
| `verseKeys` | `verse[]` (2 max) | non | 60/clé | Versets des sections 4 et 10 (`parole`, `ouvrage`). | `:152-157`, `:453-460` → `verses.parole`, `verses.ouvrage` |
| `versePairImages` | `{image, alt?}[]` (2 max) | non | — / 160 | Photos encadrant le verset monumental (section 10). | `:458-459` (`leftPhoto`, `rightPhoto`) |
| `historyHeading` | `text?` | non | 120 | Titre « L'histoire en marche ». | `:165-167` |
| `historyIntro` | `text?` | non | 600 | Chapeau de la section. | `:168-171` ; clé existante `page-content.ts:46` |
| `milestones` | `{date, title, text, image, alt?}[]` (1-4) | non | 40/160/900/—/160 | Les jalons chronologiques (Ecodim, chorale, ministères). | `:178-188`, `:205-215` (2 enregistrements littéraux) |
| `transitionTitle` | `text?` | non | 120 | Titre de la bande photographique. | `:247-249` |
| `transitionImage` + `transitionImageAlt` | `media` + `text?` | non | — / 160 | Photo pleine largeur et son alt. | `:237-238` |
| `convictionsHeading` | `text?` | non | 300 | Titre-citation « Ce qui nous définit ». | `:261-264` |
| `convictionsIntro` | `text?` | non | 600 | Paragraphe de convictions. | `:265-269` |
| `pillarsHeading` | `text?` | non | 120 | Titre de la section des piliers. | `:280-282` |
| `pillars` | `{category, angle?, title, text, references}[]` (1-6) | non | 60/60/120/600/160 | Les cartes de conviction : catégorie, mention d'angle, titre, texte, références bibliques. | `:289-374` (4 cartes littérales) |
| `shapeHeading` | `text?` | non | 120 | Titre « La foi prend forme dans le quotidien ». | `:387-389` |
| `shapeBody` | `text?` | non | 900 | Corps de la section. | `:390-395` |
| `shapePhotos` | `{image, alt}[]` (1-6) | non | — / 160 | Les 4 photographies en parallaxe (alt descriptif aujourd'hui fourni par la page). | `:418-441` → `ParallaxImage` (`src`, `alt`, `speed`) |
| `todayHeading` | `text?` | non | 120 | Titre « CCJV aujourd'hui ». | `:481-483` |
| `todayBody` | `text?` | non | 900 | Corps de la section. | `:484-490` |
| `todayImage` + `todayImageAlt` | `media` + `text?` | non | — / 160 | Photo de l'assemblée et son alt. | `:471-472` |
| `todayFacts` | `{label, value}[]` (1-4) | non | 60/60 | Chiffres-clés (« 2023 / Année de fondation », « Lubumbashi / Haut-Katanga · RDC »). | `:492-509` |
| `facesHeading` | `text?` | non | 300 | Titre-citation de la section visages. | `:521-524` |
| `facesIntro` | `text?` | non | 600 | Paragraphe d'introduction. | `:525-528` |
| `facesCtaLabel` | `cta` | non | 60 | Libellé du lien vers `/organisation`. | `:557-562` |
| `outroHeading` | `text?` | non | 120 | Titre « L'histoire continue ». | `:574-576` |
| `outroBody` | `text?` | non | 600 | Paragraphe de conclusion. | `:577-580` |
| `callHeading` | `text?` | non | 160 | Titre de l'appel final. | `:596-598` |
| `callBody` | `text?` | non | 600 | Corps de l'appel final. | `:599-603` |
| `callPrimaryCtaLabel` | `cta` | non | 48 | Libellé du lien « Planifier une visite ». | `:606-611` |
| `callSecondaryCtaLabel` | `cta` | non | 48 | Libellé du lien « Où nous trouver & Horaires ». | `:612-617` |

**Total : 44 champs** (2 obligatoires, 42 facultatifs) — 39 lignes de tableau, dont
5 lignes portant une paire `image` + `imageAlt`.

### Contenus dynamiques — **non** éditoriaux ici

| Contenu | Source | Remarque |
| --- | --- | --- |
| Les 5 visages de la section 12 | **mock statique** `data/mock/community.ts:15-46`, consommé par une boucle `map` locale (`:532-553`) | Entité `CommunityFace` (D-24) : contenu éditorial **persistant**, donc hors `Page.content`. La page ne consomme **pas** `getCommunityFaces()` — écart à corriger côté intégration. |
| Signature et rôle du visionnaire (section 2) | `site.visionary`, `site.visionaryRole` (`:76-78`) | déjà éditables via `site_settings` |
| Lieu (légende de la section 3) | `site.location` (`:142-143`) | `site_settings` |
| Versets | `verses.parole`, `verses.ouvrage` (mock `verses.ts:27-34`) | deviennent des références `scriptures.key` |

### Jamais éditable sur Qui sommes-nous

Les 14 sections et leur ordre · la composition narrative (portrait + citation,
date monumentale, cartes-jalons, mosaïque parallaxe, verset encadré, citation-
manifeste) · grilles (`lg:grid-cols-12`, 2×2 des piliers) · classes typographiques
(`font-serif italic`, `clamp(...)`, `opacity-25`, `line-clamp-2`) · vitesses de
parallaxe `speed` (`:419, 425, 434, 440`) · absence d'image sur la variante
`center` du verset (`VerseSection.tsx:238-271`) · cibles des liens · dates et
horaires **dupliqués en dur** (`:399`, `:404`) tant que les décisions §7 Q-PG4 et
Q-PG5 ne sont pas prises · libellés d'état vide.

### Écarts relevés, à traiter en migration (§6)

1. La page écrit **en dur** « 17 Mars 2023 » (`:115`), « 02 Juillet 2023 »
   (`:179`), « Dimanche 09h » (`:399`), « Mercredi 17h » (`:404`), « 2023 »
   (`:495`), « Haut-Katanga · RDC » (`:506`), alors que `site_settings` expose
   déjà `site.foundedAt`, `site.ecodimFoundedAt`, `site.scheduleAdults`
   (`seed-data.ts:107,108,116`). Deux sources pour un même fait : à trancher
   (§7 Q-PG4).
2. Les 4 références bibliques des piliers (`:303`, `:326`, `:350`, `:373`) et la
   citation `:87-91` sont des textes littéraux ; les unes et l'autre sont des
   champs `pillars[].references` / `visionQuote` dans le contrat ci-dessus.
3. `verses.mission` (Matthieu 28:19-20) est présent dans le mock mais **non
   affiché** : aucun contenu perdu en migration, mais la liste des `Scripture`
   persistés doit rester la référence (§2.9).

---

## 2.3 Événements — `/vie-de-leglise/evenements`

**`pageKey` : `evenements`** — **clé à créer** : aucune des 6 clés actuelles ne
correspond à cette page (§6.5).

Page **asynchrone**, JSX écrit à la main, **aucun archétype** :
`getEvents({ status: "UPCOMING", limit: 50 })`, `getEvents({ status: "ARCHIVED",
sort: "-event_date", limit: 50 })`, `getDepartments()` (`:25-27`).

### Sections relevées (haut → bas)

| # | Section | Source | Nature |
| --- | --- | --- | --- |
| 1 | Hero — titre + composition de 4 photos | `:110-187` | éditorial + images |
| 2 | Première respiration biblique (`VerseSection variant="center"`) | `:192-197` | verset |
| 3 | Le prochain rendez-vous (`leadEvent`) | `:199-294` | éditorial + **dynamique** |
| 4 | Ce qui arrive bientôt | `:296-437` | éditorial + **dynamique** |
| 5 | Ce que vous pouvez vivre ici (4 cartes) | `:439-498` | éditorial |
| 6 | Le rythme régulier qui nous rassemble (3 cartes) | `:500-555` | éditorial |
| 7 | Section photographique (citation + CTA) | `:557-599` | éditorial + image |
| 8 | La vie dans nos différents ministères | `:601-671` | éditorial + **dynamique** |
| 9 | Les moments vécus ensemble (archives) | `:673-727` | éditorial + **dynamique** |
| 10 | Deuxième respiration biblique (`VerseSection variant="both"`) | `:729-739` | verset + images |
| 11 | L'invitation | `:741-773` | éditorial + CTA |

### Champs éditables

| Clé | Type | Oblig. | Max | Description d'usage | Provenance |
| --- | --- | --- | --- | --- | --- |
| `title` | `text` | **oui** | 160 | Titre du hero. | `:120-121` |
| `verseKeys` | `verse[]` (0-2) | non | 60/clé | Versets des sections 2 et 10 (aujourd'hui Matthieu 18:20 et Hébreux 10:24-25, **littéraux**). | `:195-196`, `:735-736` |
| `verseImages` | `{image, alt}[]` (0-2) | non | — / 160 | Photos encadrant le second verset. | `:737-738` (`leftPhoto`, `rightPhoto`) |
| `heroPhotos` | `{image, alt}[]` (1-6) | non | — / 160 | Les 4 photos composées du hero et leurs textes alternatifs descriptifs. | `:133-175` |
| `leadSectionTitle` | `text?` | non | 120 | Titre de la section « prochain rendez-vous ». | `:214` |
| `leadFallbackLabel` | `text?` | non | 60 | Libellé affiché quand l'événement n'a pas de département. | `:234` (« Événement Majeur ») |
| `leadWhenLabel` | `text?` | non | 40 | Libellé du repère de date. | `:268` (« Quand : ») |
| `leadWhereLabel` | `text?` | non | 40 | Libellé du repère de lieu. | `:274` (« Lieu : ») |
| `leadCtaLabel` | `cta` | non | 60 | Libellé du CTA vers la fiche de l'événement. | `:286` |
| `upcomingTitle` | `text?` | non | 120 | Titre de la section « ce qui arrive bientôt ». | `:310` |
| `upcomingFallbackLabel` | `text?` | non | 60 | Libellé de repli du département dans les listes. | `:336`, `:396` (« Vie de l'église ») |
| `upcomingLeadCtaLabel` | `cta` | non | 60 | Libellé du CTA de l'événement mis en avant. | `:363` |
| `upcomingItemCtaLabel` | `cta` | non | 60 | Libellé du CTA de chaque élément de liste. | `:425` |
| `pillarsTitle` | `text?` | non | 120 | Titre de la section des piliers d'expérience. | `:452` |
| `pillarsIntro` | `text?` | non | 600 | Chapeau de la même section. | `:455-456` |
| `pillars` | `{overline, title, text, ctaLabel}[]` (1-6) | non | 40/120/600/60 | Les 4 cartes d'expérience (célébrer, grandir, se retrouver, servir) ; **la cible** de chaque CTA reste en code (`#a-venir`, `#cette-semaine`, `/communaute/groupes-de-maison`, `/organisation#departements`). | `:41-78` |
| `rhythmTitle` | `text?` | non | 120 | Titre de la section du rythme hebdomadaire. | `:514` |
| `rhythmIntro` | `text?` | non | 600 | Chapeau de la même section. | `:517-518` |
| `weeklyEntries` | `{day, time, title, location, type, text}[]` (1-6) | non | 30/30/160/120/80/600 | Les 3 cartes du rythme affiché sur cette page (jour, heure, titre, lieu, type, description). **Voir §6.7 : ces horaires contredisent le mock `weeklyRhythm`.** | `:81-106` |
| `photoQuote` | `text?` | non | 600 | Déclaration de la section photographique. | `:577-581` |
| `photoQuoteBody` | `text?` | non | 600 | Paragraphe accompagnant la déclaration. | `:585-586` |
| `photoQuoteCtaLabel` | `cta` | non | 60 | Libellé du CTA vers `/qui-sommes-nous`. | `:594` |
| `photoQuoteImage` | `media` | non | — | Photographie en filigrane de la section. | `:564-565` (`images.assemblee`) |
| `departmentsTitle` | `text?` | non | 120 | Titre de la section par département. | `:614` |
| `departmentsIntro` | `text?` | non | 600 | Chapeau de la même section. | `:617-618` |
| `departmentsCtaLabel` | `cta` | non | 60 | Libellé du CTA de chaque carte département. | `:655` |
| `departmentsEmptyText` | `text?` | non | 600 | Message éditorial affiché quand la liste des départements est vide — cas admis par `docs/020` §13 (« afficher un message éditorial »). | `:663-669` |
| `archivedTitle` | `text?` | non | 120 | Titre de la section des moments vécus (archives). | `:687` |
| `archivedIntro` | `text?` | non | 600 | Chapeau de la même section. | `:690-691` |
| `invitationTitle` | `text?` | non | 160 | Titre de l'invitation finale. | `:748` |
| `invitationBody` | `text?` | non | 900 | Corps de l'invitation finale. | `:752-754` |
| `invitationPrimaryCtaLabel` | `cta` | non | 60 | Libellé du CTA remontant à l'agenda. | `:762` |
| `invitationSecondaryCtaLabel` | `cta` | non | 60 | Libellé du CTA vers `/vie-de-leglise/ou-nous-trouver`. | `:768` |

**Total : 33 champs** (1 obligatoire, 32 facultatifs).

> **Emphase typographique :** le titre contient un mot mis en italique par le JSX
> (ici « célébrer, » dans un `<span class="italic">`, `:120-121`). Le contrat ne
> transporte **jamais** de balisage (§1.6 règle 9) : l'emphase doit être portée par
> le composant à une position fixe, ou abandonnée.

### Contenus dynamiques — **non** éditoriaux ici

| Contenu | Source | Emplacement |
| --- | --- | --- |
| Événements à venir (50) | `getEvents({ status: "UPCOMING", limit: 50 })` | sections 3, 4 |
| Événements archivés (50) | `getEvents({ status: "ARCHIVED", sort: "-event_date", limit: 50 })` | section 9 |
| Départements | `getDepartments()` | sections 4, 8 |
| Statut d'un événement | **calculé**, jamais persisté (`types/index.ts:12-16`) | badges |
| Nom de département d'un événement | résolu par l'API, repli `upcomingFallbackLabel` | listes |
| Lieu d'un événement | `event.location` (API) | sections 3, 4 |
| Photos d'événements | `event.imageUrl`, `event.bannerImage` (API) | sections 3, 4, 9 |

### Jamais éditable sur Événements

Les 11 sections et leur ordre · le repli « les sections concernées sont alors
simplement omises » quand aucune donnée n'existe (`:19-23`) · les compositions de
photos, les filigranes, les fonds (`bg-[#132A13]`, noir), les grilles et colonnes
sticky · les ancres `#a-venir`, `#cette-semaine`, `#par-departement` · les cibles de
tous les CTA · les icônes et l'émoji de lieu (`📍`, `:547`) · les libellés dérivés
du statut · les métadonnées SEO. La fiche `[slug]` (`/vie-de-leglise/evenements/[slug]`)
n'est **pas** une page canonique : elle restitue l'**entité `Event`** via
l'archétype `EventPage` et n'a donc **aucun** `pageKey`.

## 2.4 Où nous trouver — `/vie-de-leglise/ou-nous-trouver`

**`pageKey` : `ou-nous-trouver`** — **clé à créer** : la clé existante
`vie-de-leglise` désigne le **pôle**, qui n'est plus une destination (§6.5).

Page **entièrement statique** : aucun appel à `@/lib/api` (`:6-20`).

### Sections relevées (haut → bas)

| # | Section | Source | Nature |
| --- | --- | --- | --- |
| 1 | Hero — photo en parallaxe + titre + CTA | `:63-101` | éditorial + image |
| 2 | Quand & où — 2 cartes (rendez-vous réguliers, adresse) | `:103-259` | éditorial + **données institutionnelles** |
| 3 | Respiration biblique (`VerseSection variant="center"`) | `:261-269` | verset |
| 4 | Première visite — 3 repères | `:271-310` | éditorial |
| 5 | Section finale — filigrane, citation, 2 CTA | `:312-357` | éditorial + image |

### Champs éditables

| Clé | Type | Oblig. | Max | Description d'usage | Provenance |
| --- | --- | --- | --- | --- | --- |
| `title` | `text` | **oui** | 160 | Titre du hero. | `:86` |
| `heroImage` | `media` | non | — | Photographie d'accueil. | `:73` → `images.exterieur` = `/media/ccjv-21.jpeg` |
| `heroImageAlt` | `text?` | non | 160 | Texte alternatif descriptif de la même photo. | `:74` |
| `heroCtaLabel` | `cta` | non | 60 | Libellé du CTA d'ancre vers la section « quand & où ». | `:94` |
| `meetingsTitle` | `text?` | non | 120 | Titre de la section « quand & où ». | `:117` |
| `meetingsIntro` | `text?` | non | 600 | Chapeau de la même section. | `:120` |
| `meetingsSubtitle` | `text?` | non | 120 | Sous-titre de la carte des rendez-vous. | `:129` |
| `meetingsSubtitleText` | `text?` | non | 400 | Précision sous ce sous-titre. | `:132` |
| `scheduleEntries` | `{name, time, text}[]` (1-6) | non | 160/60/600 | Les rendez-vous réguliers affichés (aujourd'hui 4, **littéraux** : culte dominical, Ecodim, prière & enseignement, répétition de la chorale). | `:139-192` |
| `meetingsNote` | `text?` | non | 400 | Mention pratique de bas de carte. | `:199` |
| `addressSubtitle` | `text?` | non | 120 | Sous-titre de la carte d'adresse. | `:207` |
| `addressText` | `text?` | non | 300 | Phrase introduisant l'adresse. | `:210` |
| `directionsCtaLabel` | `cta` | non | 60 | Libellé du CTA d'itinéraire ; **la cible** (Google Maps, construite depuis l'adresse) reste en code (`:18-20`). | `:253` |
| `contactLabel` | `text?` | non | 120 | Libellé de contact. | `:239` |
| `contactText` | `text?` | non | 300 | Phrase de contact accompagnant le libellé. | `:240` |
| `verseKey` | `verse` | non | 60 | Verset de la section 3 (aujourd'hui Jean 1:46, **littéral**). | `:267-268` |
| `visitTitle` | `text?` | non | 120 | Titre de la section « première visite ». | `:279` |
| `visitIntro` | `text?` | non | 600 | Chapeau de la même section. | `:282` |
| `visitPoints` | `{title, text}[]` (1-6) | non | 160/600 | Les 3 repères de première visite (venez comme vous êtes, seul ou accompagné, les enfants). | `:23-59` |
| `closingTitle` | `text?` | non | 160 | Titre de la section finale. | `:332` |
| `closingBody` | `text?` | non | 600 | Corps de la section finale. | `:336` |
| `closingImage` | `media` | non | — | Photo en filigrane de la section finale. | `:319` → `images.communaute` |
| `closingImageAlt` | `text?` | non | 160 | Texte alternatif descriptif de la même photo. | `:320` |
| `closingPrimaryCtaLabel` | `cta` | non | 60 | Libellé du CTA WhatsApp. | `:346` |
| `closingSecondaryCtaLabel` | `cta` | non | 60 | Libellé du CTA vers l'agenda. | `:352` |

**Total : 25 champs** (1 obligatoire, 24 facultatifs).

### Contenus dynamiques — **non** éditoriaux ici

| Contenu | Source | Remarque |
| --- | --- | --- |
| Adresse affichée (3 lignes) | **littéraux** `:224`, `:227`, `:230` | Devrait venir de `site_settings` : `site.address`, `site.addressLine1…3` (`seed-data.ts:111-114`). **Trois formulations concurrentes** coexistent (§6.6, Q-PG4). |
| Lien d'itinéraire | construit depuis `site.address` (`:18-20`) | `site_settings` |
| Lien WhatsApp | `site.whatsappHref` (`:335`, `:346`) | `site_settings` |
| Horaires | `scheduleEntries` (contrat ci-dessus) | le mock `weeklyRhythm` est **importé mais inutilisé** (`:7`) — divergence relevée en §6.7 |

### Jamais éditable sur Où nous trouver

Les 5 sections et leur ordre · la parallaxe (`ParallaxImage speed={0.10}`), les
filigranes (`opacity-25`), `CrossMark`, les grilles · les icônes SVG inline des
3 repères (`:29-33`, `:40-45`, `:53-56`) · l'ancre `#quand-et-ou` · la cible du CTA
d'itinéraire et sa construction Google Maps · les cibles WhatsApp et agenda ·
les lignes d'adresse (elles appartiennent à `site_settings`) · les métadonnées SEO.

## 2.5 Faire un don — `/vie-de-leglise/faire-un-don`

**`pageKey` : `faire-un-don`** — **clé à créer** (§6.5).

Page **entièrement statique** : aucun appel à `@/lib/api`.

### Sections relevées (haut → bas)

| # | Section | Source | Nature |
| --- | --- | --- | --- |
| 1 | Hero — photo, titre, chapeau, 2 CTA | `:130-179` | éditorial + image |
| 2 | Pourquoi donner ? — texte + 4 cartes numérotées | `:181-265` | éditorial |
| 3 | Le chemin de votre geste — 4 étapes | `:267-308` | éditorial |
| 4 | Ce que votre soutien rend possible — 4 domaines | `:310-354` | éditorial + images |
| 5 | Respiration biblique (2 Corinthiens 9:7) | `:356-376` | verset |
| 6 | Donner est un choix — texte + mosaïque de 4 photos | `:378-444` | éditorial + images |
| 7 | Comment contribuer ? — 3 méthodes + panneau secrétariat | `:446-519` | éditorial |
| 8 | L'impact humain & invitation finale | `:521-577` | éditorial + images + CTA |
| 9 | Cross-links — 3 liens | `:579-610` | éditorial |

### Champs éditables

| Clé | Type | Oblig. | Max | Description d'usage | Provenance |
| --- | --- | --- | --- | --- | --- |
| `title` | `text` | **oui** | 160 | Titre du hero. | `:153` |
| `heroIntro` | `text?` | non | 600 | Chapeau du hero. | `:157-158` |
| `heroPrimaryCtaLabel` | `cta` | non | 60 | Libellé du premier CTA (ancre vers « comment contribuer »). | `:166` |
| `heroSecondaryCtaLabel` | `cta` | non | 60 | Libellé du second CTA (ancre vers « pourquoi donner »). | `:172` |
| `heroImage` | `media` | non | — | Photo d'ouverture. | `:140` → `images.communaute` |
| `heroImageAlt` | `text?` | non | 160 | Texte alternatif descriptif. | `:141` |
| `whyOverline` | `text?` | non | 80 | Sur-titre de la section « pourquoi donner ». | `:196` |
| `whyTitle` | `text?` | non | 160 | Titre de la même section. | `:203` |
| `whyBody` | `text?` | non | 900 | Premier paragraphe : ce qui est ouvert à tous sans condition. | `:206-208` |
| `whyBodySecondary` | `text?` | non | 900 | Second paragraphe : ce que le don soutient. | `:211-213` |
| `whyCards` | `{title, text}[]` (1-6) | non | 120/600 | Les 4 cartes de destination du don ; leur numérotation est produite par le code (`01`…`04`, `:222-259`). | `:222-259` |
| `flowTitle` | `text?` | non | 160 | Titre de la section « le chemin de votre geste ». | `:275` |
| `flowIntro` | `text?` | non | 600 | Chapeau de la même section. | `:278` |
| `flowSteps` | `{title, subtitle, text}[]` (1-6) | non | 120/120/600 | Les 4 étapes de transformation du don. | `:51-76` |
| `domainsTitle` | `text?` | non | 160 | Titre de la section des domaines d'impact. | `:318` |
| `domainsIntro` | `text?` | non | 600 | Chapeau de la même section. | `:321` |
| `impactDomains` | `{title, text, image, alt}[]` (1-6) | non | 120/600/—/160 | Les 4 domaines d'impact (Ecodim, louange, enseignement, entraide) avec leur visuel. | `:21-46`, `:333` |
| `verseKey` | `verse` | non | 60 | Verset de la section 5 (aujourd'hui 2 Corinthiens 9:7, **littéral**). | `:367-371` |
| `choiceTitle` | `text?` | non | 160 | Titre de la section « donner est un choix ». | `:387` |
| `choiceBody` | `text?` | non | 900 | Premier paragraphe : refus de toute pression. | `:391-392` |
| `choiceBodySecondary` | `text?` | non | 900 | Second paragraphe : ce que la contribution permet. | `:395-396` |
| `choiceBodyTertiary` | `text?` | non | 900 | Troisième paragraphe : l'accueil inconditionnel. | `:399-400` |
| `choicePhotos` | `{image, alt}[]` (1-6) | non | — / 160 | La mosaïque de 4 photographies. | `:412-437` |
| `methodsTitle` | `text?` | non | 160 | Titre de la section « comment contribuer ». | `:461` |
| `methodsIntro` | `text?` | non | 600 | Chapeau de la même section. | `:464` |
| `givingMethods` | `{badge, title, text, note}[]` (1-6) | non | 60/120/900/300 | Les 3 méthodes (remise directe, à distance, projet ciblé) : remise, canaux nommés, précision. | `:81-103` |
| `contactPanelTitle` | `text?` | non | 160 | Titre du panneau secrétariat. | `:500` |
| `contactPanelBody` | `text?` | non | 600 | Corps du panneau secrétariat. | `:503-504` |
| `contactPanelCtaLabel` | `cta` | non | 60 | Libellé du CTA WhatsApp du panneau. | `:513` |
| `contactMessage` | `text?` | non | 400 | Message WhatsApp pré-rempli. | `:125` |
| `impactTitle` | `text?` | non | 160 | Titre de l'invitation finale. | `:545` |
| `impactBody` | `text?` | non | 900 | Premier paragraphe de l'invitation. | `:548-550` |
| `impactBodySecondary` | `text?` | non | 900 | Second paragraphe de remerciement. | `:553-554` |
| `impactPhotos` | `{image, alt}[]` (1-4) | non | — / 160 | Les 2 photographies de la section. | `:529-539` |
| `impactPrimaryCtaLabel` | `cta` | non | 60 | Libellé du CTA de don (WhatsApp). | `:564` |
| `impactSecondaryCtaLabel` | `cta` | non | 60 | Libellé du CTA vers les départements. | `:570` |
| `linksTitle` | `text?` | non | 120 | Titre du maillage final. | `:586` |
| `crossLinks` | `{title, description}[]` (1-6) | non | 120/300 | Les 3 liens de poursuite ; **les cibles restent en code**. | `:105-121` |

**Total : 38 champs** (1 obligatoire, 37 facultatifs).

### Ce qui n'est **pas** proposé — et pourquoi

**Aucun champ de coordonnées de don.** Le code documente lui-même l'absence de
ces données : « Aucune statistique inventée, aucun montant artificiel » (`:17-20`).
Aucun IBAN, aucun numéro de compte, aucun montant, aucune plateforme liée n'existe
dans le dépôt ; les seules mentions sont **textuelles** et appartiennent à
`givingMethods` (« M-Pesa, Airtel Money, Orange Money ou virement bancaire »,
`:93`) avec renvoi au secrétariat. Créer des champs de paiement serait inventer une
décision métier ; `docs/013` §C.4 l'interdit d'ailleurs explicitement (« aucun faux
système de paiement »).

### Contenus dynamiques — **non** éditoriaux ici

Aucun. Les deux seules données externes sont `site.whatsappHref` (`site_settings`)
et le message pré-rempli (`contactMessage`, contrat ci-dessus).

### Jamais éditable sur Faire un don

Les 9 sections et leur ordre · le parcours visuel (mosaïque, parallaxe, filigranes,
fonds crème/noir) · les numérotations `01`…`04` des cartes et des étapes · les
ancres `#pourquoi-donner`, `#comment-donner` · les cibles de tous les liens et CTA ·
l'encodage du message WhatsApp · les icônes · les métadonnées SEO.

## 2.6 Communauté — *(pôle sans route servie)*

**`pageKey` : `communaute`** (existant, `page-content.ts:56-61`) — mais
**aucune route servie** : `frontend/src/app/communaute/` ne contient aucun
`page.tsx`, seulement quatre sous-pages. La navigation confirme que « Notre
communauté » est un pôle **sans `href`** (`lib/nav.ts:70-100`).

`docs/013` §D.0 (`:86-88`) décrit la composition retenue pour ce hub :
« en-tête · photographies réelles · 4 portes (groupes de maison / parcours nouveaux /
prière / témoignages) · respiration ». Les **quatre portes** existent déjà, avec
leur libellé et leur accroche, dans `mainNav` (`nav.ts:76-98`).

### Champs éditables

| Clé | Type | Oblig. | Max | Description d'usage | Provenance |
| --- | --- | --- | --- | --- | --- |
| `title` | `text` | **oui** | 120 | Titre du hub communautaire. | graine `seed-data.ts:266` (« La communauté ») ; libellé de pôle `nav.ts:72` |
| `intro` | `text` | **oui** | 600 | Chapeau du hub. | graine `seed-data.ts:267-268` ; accroche de pôle `nav.ts:73` |
| `doors` | `{label, description}[]` (1-6) | non | 120/300 | Les quatre portes communautaires et leur accroche ; **les cibles restent en code**. | `nav.ts:76-98` (4 portes) ; structure `docs/013` §D.0 |

**Total : 3 champs** (2 obligatoires, 1 facultatif).

> Le contrat reste volontairement minimal parce que **la page n'existe pas** : il
> reprend la seule matière sourçable aujourd'hui (titre et introduction déjà
> persistés, portes déjà déclarées dans la navigation). Étendre ce contrat sans
> route servie reviendrait à écrire un contenu que personne ne lit — c'est
> précisément ce que D-23 interdit.

### Textes communautaires **hors contrat** aujourd'hui

Ces textes sont éditoriaux et **réellement rendus**, mais ils appartiennent à quatre
sous-pages qui **ne font pas partie** des huit pages canoniques de `docs/025` §8.
Ils restent donc sous contrôle du code jusqu'à décision (§7 Q-PG10). Relevé
exhaustif, pour que la décision soit prise en connaissance de cause :

| Sous-page | Route | Textes éditoriaux rendus | Verset |
| --- | --- | --- | --- |
| Groupes de maison | `/communaute/groupes-de-maison` | titre, 2 CTA, 2 légendes photo, 2 titres + 3 paragraphes, titre « Trouvez votre groupe » + chapeau + CTA, libellé « Lieu : », CTA « Rejoindre », titre + paragraphe « et si je suis nouveau ? », légende, titre + paragraphe final, 2 CTA, 4 libellés de liens croisés | Actes 2:46-47 (**littéral**) |
| Témoignages | `/communaute/temoignages` | `HeroManifesto` (sur-titre, titre, déclaration, contexte), 3 paragraphes du prologue, 3 sur-titres + 3 titres de section, 1 paragraphe, titre + paragraphe d'invitation, CTA, mention d'accord préalable, 4 libellés de liens croisés | Psaume 107:2 et Psaume 150:6 (mock `verses.ts`) |
| Prière & intercession | `/communaute/priere-et-intercession` | titre, 2 CTA, 2 légendes, 2 titres + 4 paragraphes, titre + chapeau des étapes, 3 étapes `{title, subtitle, text}`, titre + chapeau du formulaire, titre + 2 paragraphes, citation, 2 CTA, titre + chapeau final, 3 libellés de liens | Philippiens 4:6-7 (**littéral**) |
| Parcours nouveau | `/communaute/parcours-nouveau` | titre, 2 CTA, 3 légendes, titre + paragraphe d'immersion, titre de section, 5 blocs `{title, subtitle, text}` + 5 légendes, sur-titre + paragraphe, titre + chapeau des 5 portes, titre + paragraphe final, 2 CTA | Jean 14:6 (**littéral**) |

Trois écarts à connaître avant toute extension :

1. **Données de démonstration.** Les groupes de maison proviennent de
   `data/mock/community.ts` (4 groupes codés au build, étiquetés « DÉMONSTRATION »
   `community.ts:2-7`) et la page n'a **aucun** état vide : une liste vide ne
   produirait aucun message.
2. **Contenus manquants assumés.** `/communaute/temoignages` affiche deux
   `ContentPending` — « TODO — **Témoignages réels** à fournir » (`:100-104` et
   `:186-191`) — conformément à `docs/015` §5 et à la décision D-24 (« statut et
   modération à définir avant exposition publique »), ainsi qu'un `EmptyState`
   (« Aucun témoignage publié pour le moment »). Ces mentions ne sont **pas**
   éditoriales : elles signalent un contenu institutionnel absent.
3. **Lien mort relevé.** `/communaute/groupes-de-maison` pointe vers
   `/vie-de-leglise/premiere-visite` (`:65`), route qui **n'existe pas** dans
   `src/app`. Aucun champ de contenu n'est en cause, mais le maillage doit être
   corrigé indépendamment de ce contrat.

### Jamais éditable sur Communauté

La structure du hub (`docs/013` §D.0) · l'existence d'une route (elle n'existe
pas) · les cibles des quatre portes · les compositions des quatre sous-pages tant
qu'elles ne relèvent pas d'un contrat · les états vides et les `ContentPending` ·
la modération des témoignages (D-24, Q-PR9).

---

## 2.7 Organisation — `/organisation`

**`pageKey` : `organisation`** (existant, `page-content.ts:49-54`).

Page **asynchrone** : `getDepartments()` + `getLeaders()`
(`app/organisation/page.tsx:21-24`).

### Sections relevées (haut → bas)

| # | Section | Source | Nature |
| --- | --- | --- | --- |
| 1 | Hero éditorial sombre + 3 photos + 3 ancres | `:34-183` | éditorial + images + CTA |
| 2 | Respiration biblique 1 | `:188-208` | verset |
| 3 | Les responsables (`id="responsables"`) | `:213-347` | éditorial + **dynamique** |
| 4 | Transition narrative | `:352-399` | éditorial + images |
| 5 | Les départements (`id="departements"`) | `:404-437` + `OrganisationExplorer.tsx` + `DepartmentModal.tsx` | éditorial + **dynamique** |
| 6 | Respiration biblique 2 | `:442-460` | verset |
| 7 | Conclusion & appel (`id="rejoindre"`) | `:465-539` | éditorial + étapes + CTA |

### Champs éditables

| Clé | Type | Oblig. | Max | Description d'usage | Provenance |
| --- | --- | --- | --- | --- | --- |
| `title` | `text` | **oui** | 120 | Titre du hero (h1). | `:63-65` ; graine `seed-data.ts:258` |
| `intro` | `text` | **oui** | 600 | Chapeau du hero. | `:67-72` ; graine `seed-data.ts:259-260` |
| `overline` | `text?` | non | 80 | Sur-titre du hero (« Organisation & Vie de l'Église »). | `:58-60` |
| `heroPrimaryCtaLabel` | `cta` | non | 48 | Libellé du CTA vers `#departements`. | `:75-77` |
| `heroSecondaryCtaLabel` | `cta` | non | 48 | Libellé du CTA vers `#responsables`. | `:78-80` |
| `heroPhotos` | `{image, alt, label}[]` (1-4) | non | — / 160 / 60 | Les photos composées du hero avec leur texte alternatif et leur libellé superposé. | `:88-137` (3 enregistrements ; alt littéraux `:91,110,126`) |
| `verseKeys` | `verse[]` (0-3) | non | 60/clé | Versets des sections 2, 3 et 6 (aujourd'hui 1 Co 12:12,4-5 ; Matthieu 23:11 ; 1 P 4:10). | `:197-206`, `:269-272`, `:451-458` — **textes littéraux**, non présents dans `scriptures` |
| `leadersHeading` | `text?` | non | 120 | Titre de la section responsables. | `:221-226` |
| `leadersIntro` | `text?` | non | 600 | Chapeau de la section responsables. | `:227-231` |
| `leadersFallbackLabel` | `text?` | non | 80 | Sur-titre de repli d'un responsable sans `scope`. | `:252` (« Direction spirituelle »), `:318` (« Coordination ») |
| `coordinationHeading` | `text?` | non | 120 | Titre de la colonne « La coordination des ministères ». | `:287-289` |
| `coordinationIntro` | `text?` | non | 600 | Chapeau de la même colonne. | `:290-293` |
| `coordinationFallback` | `text?` | non | 600 | Paragraphe affiché quand aucun coordinateur n'est disponible. | `:336-342` |
| `leadersEmptyTitle` + `leadersEmptyText` | `text?` + `text?` | non | 120 / 300 | État vide de la direction pastorale. | `:278-281` (`EmptyState`) |
| `transitionHeading` | `text?` | non | 300 | Titre-citation de la transition narrative. | `:361-363` |
| `transitionSubtitle` | `text?` | non | 200 | Sous-titre de la transition. | `:364-366` |
| `transitionBody` | `text?` | non | 900 | Corps de la transition. | `:367-371` |
| `transitionPhotos` | `{image, alt}[]` (1-4) | non | — / 160 | Photos de la transition et leurs alts. | `:379-389` |
| `departmentsTitle` | `text?` | non | 160 | Titre de la section départements. | `:413-418` ; clé existante `page-content.ts:52` |
| `departmentsIntro` | `text?` | non | 600 | Chapeau de la section départements. | `:420-423` ; clé existante `page-content.ts:53` |
| `departmentsEmptyTitle` + `departmentsEmptyText` | `text?` + `text?` | non | 120 / 300 | État vide de la liste des départements. | `:430-434` (`EmptyState`) |
| `joinHeading` | `text?` | non | 160 | Titre de l'appel final. | `:471-476` |
| `joinBody` | `text?` | non | 900 | Corps de l'appel final. | `:477-482` |
| `joinSteps` | `{title, text}[]` (1-5) | non | 120 / 600 | Les étapes de participation ; leur numérotation est produite par le code (`01`…, `:487`). | `:485-518` (3 étapes littérales) |
| `joinPrimaryCtaLabel` | `cta` | non | 48 | Libellé du CTA WhatsApp. | `:522-524` |
| `joinSecondaryCtaLabel` | `cta` | non | 48 | Libellé du CTA « parcours nouveau ». | `:525-527` |
| `joinLinkLabel` | `cta` | non | 60 | Libellé du lien final vers les horaires. | `:531-536` |

**Total : 29 champs** (2 obligatoires, 27 facultatifs) — 27 lignes de tableau, dont
2 lignes portant une paire de libellés d'état vide.

### Contenus dynamiques — **non** éditoriaux ici

| Contenu | Source | Emplacement |
| --- | --- | --- |
| Départements | `getDepartments()` (`endpoints.ts:115-121`) → `OrganisationExplorer` (`:428`) → `DepartmentModal` | section 5 |
| Responsables | `getLeaders()` (`endpoints.ts:194-200`) — premier élément = direction pastorale, reste = coordination (`:27`) | section 3 |
| Champs consommés d'un responsable | `name`, `role`, `scope`, `bio`, `photo` (`lib/api/types.ts:85-97`) | section 3 |
| Adresse affichée dans la fiche département | `site.address` (`DepartmentModal.tsx:189`) | section 5 — `site_settings` |
| WhatsApp | `site.whatsappHref` (`:522`) | sections 1, 5, 7 — `site_settings` |

### Jamais éditable sur Organisation

Les 7 sections et leur ordre · la composition du hero (3 photos, `data-hero-dark`,
`opacity-20`) · **la barre d'ancres dans son intégralité** (existence, ordre,
numérotation `01`…`03`, libellés et cibles `#responsables`, `#departements`,
`#rejoindre` — `:144-182`) · les alias d'ancre `#ecodim` et `#adulte` (`OrganisationExplorer.tsx:41-42`,
`DepartmentModal.tsx:40-46`) · la numérotation automatique des cartes
(`OrganisationExplorer.tsx:74`) · les tons et grilles · les 3 photos du hero sans
`bannerImage` disponible (replis littéraux `:90,109,125`) · le comportement de
repli `EmptyState` (existence, composant, ton) · les cibles de CTA · la limite
d'affichage `keyPoints.slice(0, 4)` (`OrganisationExplorer.tsx:101`) · les
métadonnées SEO.

### Écarts relevés

Les trois versets de cette page (`:197-206`, `:269-272`, `:451-458`) sont des
**littéraux** ; `verses.corps` (`verses.ts:35-38`) ne contient que la première
phrase et n'est **pas** utilisé. La migration doit créer les `Scripture`
correspondants avant de les référencer par clé (§6.4).

---

## 2.8 `[Département]` — template dynamique

**Cas à part : il n'existe aujourd'hui aucune route `[Département]` dans le
frontend.** Vérifié : `frontend/src/app/` ne contient **aucun** dossier
`departements`, et `docs/015` §4.2 (`:190`) comme `docs/013` §E.3 (`:118-121`)
prescrivent pourtant `/organisation/departements/[slug]`. Le mock
`data/mock/departments.ts:93` documente ce même chemin cible, mais le
résolveur `getDepartmentBySlug` (`:94-96`) **n'a aucun consommateur**.

**Ce qui existe réellement :** la fiche département est rendue par
`frontend/src/app/organisation/DepartmentModal.tsx` (client), ouverte depuis
`OrganisationExplorer` sur `/organisation` (`:141-146`), avec une ancre par
`Department.slug` (`OrganisationExplorer.tsx:37`).

### Conséquence sur le contrat

`[Département]` **n'est pas** une page statique : ses valeurs viennent de
l'entité `Department`. Sa **composition** reste dans le code. Le contrat se scinde
donc en deux :

1. **Valeurs par département → entité `Department`** (jamais `Page.content`) ;
2. **Textes de template, partagés par tous les départements →** une `pageKey`
   `departement`, si le §7 Q-PG7 confirme que ces libellés sont éditables.

### Sections relevées (`DepartmentModal.tsx`)

| # | Section | Source |
| --- | --- | --- |
| 1 | Bannière + identification (nom, accroche, description) | `:131-161` |
| 2 | Repères essentiels (rythme, responsable, lieu) | `:164-193` |
| 3 | Ce qui structure ce département (`keyPoints`) | `:198-210` |
| 4 | La vie en images (`gallery`) | `:220-241` |
| 5 | Participer (paragraphe + CTA WhatsApp) | `:244-255` |
| 6 | Explorer un autre département | `:261-276` |

### Champs — partie A : entité `Department`

Source : `frontend/src/types/index.ts:18-34` (frontend) et
`backend/src/domain/entities/index.ts:60-76` (backend) ; valeurs de démonstration
`data/mock/departments.ts:8-85` ; graine `seed-data.ts:292-…`.

| Champ | Type | Oblig. | Max | Description d'usage | Provenance |
| --- | --- | --- | --- | --- | --- |
| `name` | `text` | **oui** | 120 | Nom du département, affiché en titre de fiche et dans les listes. | `types/index.ts:20` ; `DepartmentModal.tsx:145-150` |
| `slug` | identifiant | **oui** | 60 | Identifiant d'URL et **d'ancre** (`OrganisationExplorer.tsx:37`). | `types/index.ts:21` ; `departments.ts:11` |
| `tagline` | `text?` | non | 160 | Accroche courte en italique sous le titre. | `types/index.ts:33` ; `:152-156` |
| `description` | `text?` | non | 1200 | Présentation du département (vocation, public, contenu). | `types/index.ts:22` ; `:159-161` |
| `responsibleName` | `text?` | non | 120 | Responsable affiché ; replis littéraux « Coordination d'équipe » / « Équipe de coordination ». | `types/index.ts:23` ; `:180` |
| `meetingSchedule` | `text?` | non | 160 | Rythme de rencontre ; repli littéral « Culte dominical · 09:00 ». | `types/index.ts:27` ; `:171` |
| `keyPoints` | `text[]` (0-6) | non | 300/point | Les piliers du département ; **la fiche n'en affiche que 4**. | `types/index.ts:29` ; `:207-210`, `OrganisationExplorer.tsx:101` |
| `bannerImage` | `media?` | non | — | Image d'en-tête de la fiche. | `types/index.ts:25` ; `:131-141` ; backend `bannerMediaId`/`bannerImageUrl` (`entities:69-71`) |
| `gallery` | `media[]` (0-6) | non | — | Galerie photographique ; **6 affichées au maximum**, `alt` généré `${name} — photo ${n}`. | `types/index.ts:31` ; `:224-231` |
| `position` | entier | non | — | Ordre d'affichage **dans la liste** (ordre des départements). | `entities:73` ; `endpoints.ts` commentaire « dans l'ordre défini par le back-office » |
| `verseKey` / `verseKeys` | `verse?` / `verse[]` | non | 60 | Versets prescrits par `docs/013` §E.3 (« en-tête (verset) », « respiration (verset) ») — **non implémentés aujourd'hui**. | `docs/013:118-121` — champ **à créer** avec la route (§7 Q-PG7) |

### Champs — partie B : textes de template (`pageKey` `departement`)

Seulement si le §7 Q-PG7 confirme. Ces textes sont **aujourd'hui littéraux dans
le composant** et identiques pour tous les départements.

| Clé | Type | Oblig. | Max | Description d'usage | Provenance |
| --- | --- | --- | --- | --- | --- |
| `overline` | `text?` | non | 80 | Sur-titre de la fiche (« Département CCJV »). | `DepartmentModal.tsx:110-112` |
| `closeLabel` | `cta` | non | 40 | Libellé du bouton de fermeture (« Fermer »). | `:121` |
| `factsTitle` | `text?` | non | 120 | Titre du bloc de repères (« Repères essentiels »). | `:164-193` |
| `factsScheduleLabel` | `text?` | non | 60 | Libellé « Rythme & Horaires ». | `:168` |
| `factsResponsibleLabel` | `text?` | non | 60 | Libellé « Responsable ». | `:177` |
| `factsLocationLabel` | `text?` | non | 60 | Libellé « Lieu de rassemblement ». | `:186` |
| `keyPointsTitle` | `text?` | non | 120 | Titre « Ce qui structure ce département ». | `:198-200` |
| `galleryTitle` | `text?` | non | 120 | Titre « La vie en images ». | `:220-222` |
| `joinTitle` | `text?` | non | 120 | Titre « Participer à ce département ». | `:244-246` |
| `joinBody` | `text?` | non | 600 | Paragraphe d'invitation. | `:247-250` |
| `joinCtaLabel` | `cta` | non | 60 | Libellé du CTA WhatsApp (« Écrire au sujet de ce département »). | `:253-255` |
| `switchLabel` | `text?` | non | 80 | Libellé « Explorer un autre département : ». | `:261-263` |
| `contactMessage` | `text?` | non | 400 | Message WhatsApp pré-rempli, avec le nom du département interpolé. | `:88-91` |

**Total partie B : 13 champs**, uniquement si Q-PG7 est tranchée favorablement.

### Contenus dynamiques — **non** éditoriaux ici

- la liste des départements (`getDepartments()`) et son ordre (`position`) ;
- le département actif (sélection par ancre ou clic, `:40-46`) ;
- l'adresse de rassemblement (`site.address`, `site_settings`) ;
- le lien WhatsApp et son encodage (`site.whatsappHref`) ;
- le `alt` généré des photos de galerie (`:231`) ;
- les libellés de repli quand un champ est absent.

### Jamais éditable sur `[Département]`

Le template lui-même · l'ordre des 6 sections · l'existence et le style de la
bannière · la grille de galerie et sa limite de 6 · le passe-plat d'ancre
(`#ecodim`, `#adulte`) · la numérotation `01`, `02`… · l'existence du sélecteur
« Explorer un autre département » · la cible du CTA · les replis littéraux ·
`role="dialog"` / `aria-modal` · la limite de 4 `keyPoints` en carte.

---

## 2.9 Traitement transversal des versets

Les versets apparaissent dans **sept** emplacements du frontend, sous trois
formes différentes — c'est la source d'ambiguïté la plus importante du contrat.

| Emplacement | Forme actuelle | Source |
| --- | --- | --- |
| Accueil, section 2 (`VerseSection`) | `verses.rassemblement` | `page.tsx:64-65` |
| Qui sommes-nous, section 4 | `verses.parole` | `:152-157` |
| Qui sommes-nous, section 10 | `verses.ouvrage` + 2 photos | `:453-460` |
| Organisation, sections 2, 3, 6 | **littéraux** (1 Co 12:12,4-5 ; Mt 23:11 ; 1 P 4:10) | `:197-206`, `:269-272`, `:451-458` |
| Intro de coquille (`IntroCurtain`) | `verses.rassemblement` réaffiché | `layout.tsx:52` → `IntroCurtain.tsx:22-26` |
| `/vie-de-leglise/evenements` — §2.3 | 2 versets **littéraux** : Matthieu 18:20, Hébreux 10:24-25 | `:195-196`, `:735-736` |
| `/vie-de-leglise/ou-nous-trouver` — §2.4 | Jean 1:46 **littéral** | `:267-268` |
| `/vie-de-leglise/faire-un-don` — §2.5 | 2 Corinthiens 9:7 **littéral** | `:367-371` |
| `/communaute/temoignages` — §2.6 (hors contrat) | `verses.memoire` (`HeroManifesto`), `verses.louange` (`ScriptureBlock`) | mock `verses.ts:39-42`, `:19-22` |
| `/publications/enseignements` (hors contrat) | `verses.parole` (`ScriptureBlock`) | mock `verses.ts:27-30` |
| Autres pages communautaires | Actes 2:46-47, Philippiens 4:6-7, Jean 14:6 — **littéraux** | §2.6 |
| `HeroManifesto` | `scripture: {text, reference}` **obligatoire, sans garde** | `HeroManifesto.tsx:18,105,113` |

**Décision de contrat retenue ici :** `Page.content` ne contient **que des clés**
(`verse` → `scriptures.key`), jamais le texte ni la référence. Trois raisons
vérifiables : la table `scriptures` existe déjà avec `key`, `text`, `reference`,
`translation`, `context` (`editorial.ts:59-81`) ; la traduction doit être affichée
et `HeroManifesto` la code en dur (« Traduction Louis Segond 1910. », `:117-118`)
alors que `ScriptureBlock` déclare une prop `translation` **morte**
(`ScriptureBlock.tsx:28`) ; et `docs/024` §24 range les versets parmi les entités
persistées.

**Point de fragilité à corriger avant d'exposer le contrat :** `HeroManifesto`
déréférence `scripture.text` et `scripture.reference` sans garde (`:105`, `:113`).
Un verset absent ou une clé non résolue y produit une **erreur de rendu**. Tant que
ce composant n'est pas rendu tolérant, une clé de verset doit être traitée comme
**facultative côté contrat** et l'emplacement omis si elle ne se résout pas.

---

# 3. Schémas de validation

## 3.1 Primitives partagées

```ts
// backend/src/domain/content/primitives.ts  (proposition)

/** Texte éditorial : nettoyé, non vide, borné. Jamais de HTML, jamais de balisage. */
const text = (max: number) => z.string().trim().min(1).max(max);

/** Champ facultatif : absent ⇒ le frontend garde son texte par défaut (page-content.ts:29-33). */
const opt = (max: number) => text(max).optional();

/** Libellé de CTA : le libellé est éditorial, la cible reste dans le code. */
const cta = (max = 48) => text(max).optional();

/** Référence média : identifiant de la bibliothèque (`Media.id`). */
const media = z.uuid();

/**
 * Forme de transition : les valeurs existantes du frontend sont des CHEMINS
 * (`/media/ccjv-XX.jpeg`, `images.ts:11-40`). Elles sont acceptées le temps de la
 * migration (§6.4, étape M6) puis retirées ; un chemin n'est jamais une
 * référence de bibliothèque et ne bénéficie d'aucun contrôle d'accès (`MediaAccess`,
 * D-21/D-22).
 */
const mediaOrLegacyPath = z.union([
  media,
  z.string().trim().regex(/^\/media\/ccjv-\d{2}\.jpeg$/),
]);

/**
 * Référence de verset : clé d'un enregistrement `Scripture`.
 * Bornée à 60 comme `scriptures.key` (editorial.ts:64).
 */
const verse = text(60).optional();

/** Tableau borné d'objets éditoriaux : l'ordre des éléments est éditorial. */
const bounded = <T extends z.ZodType>(item: T, min: number, max: number) =>
  z.array(item).min(min).max(max);
```

**Interdits, énoncés explicitement :** aucun schéma ne déclare `html`, `markdown`,
`richText`, `className`, `style`, `order`, `position`, `index`, `variant`, `tone`,
`width`, `rhythm`, `layout`, `component`, `template`, `href`, `slug`, `pageKey`.

**Lecture des schémas du §3.2 :** chaque `media.optional()` y est lu comme
`mediaOrLegacyPath.optional()` **pendant la migration** ; après l'étape M6 (§6.4),
seule la forme `z.uuid()` subsiste et un chemin `/media/...` devient une erreur de
validation.

## 3.2 Schémas par `pageKey`

Tous les schémas sont des **`z.strictObject`** (L3, §1.4).

### `accueil`

```ts
accueil: z.strictObject({
  heroTitle: text(120),
  heroIntro: text(600),
  heroCtaPrimaryLabel: cta(),
  heroCtaSecondaryLabel: cta(),
  heroImage: media.optional(),

  verseKey: verse,

  pastorHeading: opt(160),
  pastorMessage: opt(900),
  pastorMessageSecondary: opt(900),
  pastorImage: media.optional(),

  briefTitle: opt(120),
  briefIntro: opt(600),
  briefCtaLabel: cta(),
  briefImage: media.optional(),

  eventsTitle: opt(120),
  eventsIntro: opt(400),
  eventsCtaLabel: cta(),

  rhythmTitle: opt(120),
  rhythmIntro: opt(400),
  rhythmCtaLabel: cta(),

  teachingsTitle: opt(120),
  teachingsIntro: opt(400),
  teachingsNote: opt(300),
  teachingsCtaLabel: cta(),

  facesTitle: opt(120),
  facesIntro: opt(400),

  breathingPhrase: opt(120),
  breathingReference: opt(120),
  breathingImage: media.optional(),

  prayerTitle: opt(120),
  prayerMessage: opt(600),
  prayerCtaLabel: cta(),

  supportTitle: opt(120),
  supportIntro: opt(600),
  supportNote: opt(400),
  supportCtaLabel: cta(),
  supportImage: media.optional(),

  sendingTitle: opt(120),
  sendingMessage: opt(600),
  sendingPrimaryCtaLabel: cta(),
  sendingSecondaryCtaLabel: cta(),
  sendingLinkLabel: cta(60),
}),
```

### `qui-sommes-nous`

```ts
"qui-sommes-nous": z.strictObject({
  title: text(120),
  intro: text(600),

  heroImage: media.optional(),
  heroImageAlt: opt(160),

  visionHeading: opt(160),
  visionQuote: opt(600),
  visionBody: opt(900),
  visionImage: media.optional(),
  visionImageAlt: opt(160),

  birthDate: opt(40),
  birthHeading: opt(160),
  birthBody: opt(900),
  birthImage: media.optional(),
  birthImageAlt: opt(160),
  birthCaption: opt(200),

  verseKeys: bounded(verse.unwrap(), 0, 2).optional(),
  versePairImages: bounded(
    z.strictObject({ image: media, alt: opt(160) }), 0, 2,
  ).optional(),

  historyHeading: opt(120),
  historyIntro: opt(600),
  milestones: bounded(
    z.strictObject({
      date: text(40),
      title: text(160),
      text: text(900),
      image: media.optional(),
      alt: opt(160),
    }), 1, 4,
  ).optional(),

  transitionTitle: opt(120),
  transitionImage: media.optional(),
  transitionImageAlt: opt(160),

  convictionsHeading: opt(300),
  convictionsIntro: opt(600),

  pillarsHeading: opt(120),
  pillars: bounded(
    z.strictObject({
      category: text(60),
      angle: opt(60),
      title: text(120),
      text: text(600),
      references: text(160),
    }), 1, 6,
  ).optional(),

  shapeHeading: opt(120),
  shapeBody: opt(900),
  shapePhotos: bounded(
    z.strictObject({ image: media, alt: text(160) }), 1, 6,
  ).optional(),

  todayHeading: opt(120),
  todayBody: opt(900),
  todayImage: media.optional(),
  todayImageAlt: opt(160),
  todayFacts: bounded(
    z.strictObject({ label: text(60), value: text(60) }), 1, 4,
  ).optional(),

  facesHeading: opt(300),
  facesIntro: opt(600),
  facesCtaLabel: cta(60),

  outroHeading: opt(120),
  outroBody: opt(600),

  callHeading: opt(160),
  callBody: opt(600),
  callPrimaryCtaLabel: cta(),
  callSecondaryCtaLabel: cta(),
}),
```

### `evenements`

```ts
evenements: z.strictObject({
  title: text(160),
  verseKeys: bounded(verse.unwrap(), 0, 2).optional(),
  verseImages: bounded(
    z.strictObject({ image: media, alt: text(160) }), 0, 2,
  ).optional(),
  heroPhotos: bounded(
    z.strictObject({ image: media, alt: text(160) }), 1, 6,
  ).optional(),

  leadSectionTitle: opt(120),
  leadFallbackLabel: opt(60),
  leadWhenLabel: opt(40),
  leadWhereLabel: opt(40),
  leadCtaLabel: cta(60),

  upcomingTitle: opt(120),
  upcomingFallbackLabel: opt(60),
  upcomingLeadCtaLabel: cta(60),
  upcomingItemCtaLabel: cta(60),

  pillarsTitle: opt(120),
  pillarsIntro: opt(600),
  pillars: bounded(
    z.strictObject({
      overline: text(40),
      title: text(120),
      text: text(600),
      ctaLabel: text(60),
    }), 1, 6,
  ).optional(),

  rhythmTitle: opt(120),
  rhythmIntro: opt(600),
  weeklyEntries: bounded(
    z.strictObject({
      day: text(30),
      time: text(30),
      title: text(160),
      location: text(120),
      type: text(80),
      text: text(600),
    }), 1, 6,
  ).optional(),

  photoQuote: opt(600),
  photoQuoteBody: opt(600),
  photoQuoteCtaLabel: cta(60),
  photoQuoteImage: media.optional(),

  departmentsTitle: opt(120),
  departmentsIntro: opt(600),
  departmentsCtaLabel: cta(60),
  departmentsEmptyText: opt(600),

  archivedTitle: opt(120),
  archivedIntro: opt(600),

  invitationTitle: opt(160),
  invitationBody: opt(900),
  invitationPrimaryCtaLabel: cta(60),
  invitationSecondaryCtaLabel: cta(60),
}),
```

### `ou-nous-trouver`

```ts
"ou-nous-trouver": z.strictObject({
  title: text(160),
  heroImage: media.optional(),
  heroImageAlt: opt(160),
  heroCtaLabel: cta(60),

  meetingsTitle: opt(120),
  meetingsIntro: opt(600),
  meetingsSubtitle: opt(120),
  meetingsSubtitleText: opt(400),
  scheduleEntries: bounded(
    z.strictObject({ name: text(160), time: text(60), text: text(600) }), 1, 6,
  ).optional(),
  meetingsNote: opt(400),

  addressSubtitle: opt(120),
  addressText: opt(300),
  directionsCtaLabel: cta(60),
  contactLabel: opt(120),
  contactText: opt(300),

  verseKey: verse,

  visitTitle: opt(120),
  visitIntro: opt(600),
  visitPoints: bounded(
    z.strictObject({ title: text(160), text: text(600) }), 1, 6,
  ).optional(),

  closingTitle: opt(160),
  closingBody: opt(600),
  closingImage: media.optional(),
  closingImageAlt: opt(160),
  closingPrimaryCtaLabel: cta(60),
  closingSecondaryCtaLabel: cta(60),
}),
```

### `faire-un-don`

```ts
"faire-un-don": z.strictObject({
  title: text(160),
  heroIntro: opt(600),
  heroPrimaryCtaLabel: cta(60),
  heroSecondaryCtaLabel: cta(60),
  heroImage: media.optional(),
  heroImageAlt: opt(160),

  whyOverline: opt(80),
  whyTitle: opt(160),
  whyBody: opt(900),
  whyBodySecondary: opt(900),
  whyCards: bounded(
    z.strictObject({ title: text(120), text: text(600) }), 1, 6,
  ).optional(),

  flowTitle: opt(160),
  flowIntro: opt(600),
  flowSteps: bounded(
    z.strictObject({ title: text(120), subtitle: text(120), text: text(600) }), 1, 6,
  ).optional(),

  domainsTitle: opt(160),
  domainsIntro: opt(600),
  impactDomains: bounded(
    z.strictObject({
      title: text(120), text: text(600), image: media, alt: text(160),
    }), 1, 6,
  ).optional(),

  verseKey: verse,

  choiceTitle: opt(160),
  choiceBody: opt(900),
  choiceBodySecondary: opt(900),
  choiceBodyTertiary: opt(900),
  choicePhotos: bounded(
    z.strictObject({ image: media, alt: text(160) }), 1, 6,
  ).optional(),

  methodsTitle: opt(160),
  methodsIntro: opt(600),
  givingMethods: bounded(
    z.strictObject({
      badge: text(60), title: text(120), text: text(900), note: text(300),
    }), 1, 6,
  ).optional(),
  contactPanelTitle: opt(160),
  contactPanelBody: opt(600),
  contactPanelCtaLabel: cta(60),
  contactMessage: opt(400),

  impactTitle: opt(160),
  impactBody: opt(900),
  impactBodySecondary: opt(900),
  impactPhotos: bounded(
    z.strictObject({ image: media, alt: text(160) }), 1, 4,
  ).optional(),
  impactPrimaryCtaLabel: cta(60),
  impactSecondaryCtaLabel: cta(60),

  linksTitle: opt(120),
  crossLinks: bounded(
    z.strictObject({ title: text(120), description: text(300) }), 1, 6,
  ).optional(),
}),
```

### `communaute`

```ts
communaute: z.strictObject({
  title: text(120),
  intro: text(600),
  doors: bounded(
    z.strictObject({ label: text(120), description: text(300) }), 1, 6,
  ).optional(),
}),
```

> Contrat minimal **assumé** : la page n'a pas de route servie (§2.6). Les textes
> des quatre sous-pages communautaires restent hors contrat jusqu'à décision
> (§7 Q-PG10).

### `organisation`

```ts
organisation: z.strictObject({
  title: text(120),
  intro: text(600),
  overline: opt(80),
  heroPrimaryCtaLabel: cta(),
  heroSecondaryCtaLabel: cta(),

  heroPhotos: bounded(
    z.strictObject({ image: media, alt: text(160), label: text(60) }), 1, 4,
  ).optional(),

  verseKeys: bounded(verse.unwrap(), 0, 3).optional(),

  leadersHeading: opt(120),
  leadersIntro: opt(600),
  leadersFallbackLabel: opt(80),
  leadersEmptyTitle: opt(120),
  leadersEmptyText: opt(300),

  coordinationHeading: opt(120),
  coordinationIntro: opt(600),
  coordinationFallback: opt(600),

  transitionHeading: opt(300),
  transitionSubtitle: opt(200),
  transitionBody: opt(900),
  transitionPhotos: bounded(
    z.strictObject({ image: media, alt: text(160) }), 1, 4,
  ).optional(),

  departmentsTitle: opt(160),
  departmentsIntro: opt(600),
  departmentsEmptyTitle: opt(120),
  departmentsEmptyText: opt(300),

  joinHeading: opt(160),
  joinBody: opt(900),
  joinSteps: bounded(
    z.strictObject({ title: text(120), text: text(600) }), 1, 5,
  ).optional(),
  joinPrimaryCtaLabel: cta(),
  joinSecondaryCtaLabel: cta(),
  joinLinkLabel: cta(60),
}),
```

### `departement` (template — sous réserve du §7 Q-PG7)

```ts
departement: z.strictObject({
  overline: opt(80),
  closeLabel: cta(40),
  factsTitle: opt(120),
  factsScheduleLabel: opt(60),
  factsResponsibleLabel: opt(60),
  factsLocationLabel: opt(60),
  keyPointsTitle: opt(120),
  galleryTitle: opt(120),
  joinTitle: opt(120),
  joinBody: opt(600),
  joinCtaLabel: cta(60),
  switchLabel: opt(80),
  contactMessage: opt(400),
}),
```

**Les valeurs par département ne sont pas ici** : elles appartiennent à l'entité
`Department` (§2.8, partie A) et relèvent du lot Départements.

## 3.3 Enveloppe d'écriture

```ts
// backend/src/modules/static-pages/static-page.schema.ts (proposition)
export const pageContentUpdateSchema = z.strictObject({
  content: z.record(z.string(), z.unknown()), // validé par le schéma de la pageKey
});
```

Le corps est validé **en deux temps**, ce qui est déjà la conception retenue
(`static-page.schema.ts:3-11`) : forme générale par l'enveloppe, contenu par le
schéma de la page dans le service — seul moyen de distinguer `PAGE_NOT_FOUND`
(404, clé inconnue) de `VALIDATION_ERROR` (400, contenu non conforme).

## 3.4 Rejet des clés inconnues — comportement exigé

| Requête | Attendu |
| --- | --- |
| `PATCH /pages/accueil` avec `{ content: { heroTitle, heroIntro, sections: [] } }` | **400 `VALIDATION_ERROR`**, `details` nommant `sections` et la raison (« clé non reconnue »). |
| `PATCH /pages/accueil` avec `{ content: { heroTitle, heroIntro, heroTittle: "…" } }` | **400**, `details` nommant `heroTittle`. |
| `PATCH /pages/inconnue` | **404 `PAGE_NOT_FOUND`** (métier), jamais 400 de forme. |
| `PATCH /pages/accueil` avec `{ content: [], extra: 1 }` | **400** : `content` n'est pas un objet, `extra` n'est pas reconnu. |
| `PATCH /pages/accueil` avec `{ content: { heroTitle: "<b>x</b>" } }` | **accepté** comme **texte** : le balisage n'est jamais interprété. Le contrat interdit le HTML, pas la chaîne qui y ressemble. |

Le format de `details` est déjà celui du service : `{ champ, message }` avec
`champ` = chemin pointé (`static-page.service.ts:61-64`).

## 3.5 Stratégie de versionnage

**Objectif : faire évoluer un schéma sans casser le contenu déjà enregistré.**

Le registre actuel écrit sans jamais versionner (`upsert(pageKey, content, updatedBy)`,
`static-page.repository.ts:54-68`) et **ne revalide pas à la lecture**
(`getByKey` ne fait que `findByKey`, `static-page.service.ts:36-48`). Deux règles
en découlent.

### Règle A — Évolution additive par défaut (aucune version à écrire)

1. Tout nouveau champ est **facultatif** (`opt`/`cta`/`media.optional()`).
2. Une borne de longueur peut être **élargie**, jamais réduite sous la longueur
   d'une valeur susceptible d'exister ; un texte trop long déjà enregistré ne doit
   jamais être tronqué silencieusement.
3. Un nom de clé n'est **jamais réutilisé** avec un autre type (interdiction de
   transformer `heroTitle` en tableau).
4. Un champ facultatif **ne devient jamais obligatoire** après le gel : le rendre
   obligatoire invaliderait toutes les lignes existantes à la prochaine écriture.

### Règle B — Changement structurel : version de contrat explicite

Un changement qui **retire**, **renomme** ou **change le type** d'un champ est une
évolution de Phase 6 (`docs/025` §20, `docs/028` §11). Procédure :

1. **geler** l'ancien numéro et incrémenter `contractVersion` pour la `pageKey` ;
2. **conserver** l'ancien champ en `deprecated` **facultatif** au moins un cycle ;
3. **normaliser à la lecture** : `normalizePageContent(pageKey, content)` applique
   les migrations dans l'ordre `v1 → v2 → …` et produit une valeur conforme au
   schéma courant ;
4. **migrer en base** par un script idempotent qui recopie les valeurs (jamais de
   suppression) — le `jsonb` d'origine reste la trace ;
5. **vérifier** qu'aucune valeur ancienne n'a disparu.

**Où vit le numéro ?** Pas dans `pageKey` (une clé `accueil.v2` casserait
l'identité stable de `Page` — `docs/022` §9 : `key`, `template`, `content` — et le
contrat du back-office). Deux emplacements acceptables, à trancher en implémentation :

- **option retenue :** une **colonne** `contract_version` sur `static_pages`,
  écrite par le serveur ; le contenu reste purement éditorial ;
- option de repli : une clé réservée `contentVersion` **déclarée** dans chaque
  schéma (sinon L3 la refuse).

Dans les deux cas, le numéro est **écrit par le serveur**, jamais accepté du client.

### Règle C — Tolérance de lecture obligatoire

Le chemin de lecture **ne lève jamais**. Il applique, dans cet ordre :
(1) normalisation de version ; (2) validation en mode tolérant ; (3) pour chaque
champ manquant ou invalide, **repli sur la constante du code**. Une ligne écrite
sous un ancien schéma ne peut donc pas empêcher une page de se rendre — exigence
déjà énoncée par `docs/020` §13 (« le comportement ne doit pas être laissé au
hasard ») et par le commentaire du registre : « absents, la page garde son texte
par défaut dans le code » (`page-content.ts:29-33`).

### Règle D — Gel du registre

Les huit `pageKey` de ce document sont **la liste complète**. Ajouter une page,
une section ou un champ obligatoire est un acte de Phase 6, pas une extension
silencieuse.

## 3.6 Écarts entre l'implémentation actuelle et cette spécification

| # | Écart | Emplacement | Correction attendue |
| --- | --- | --- | --- |
| E1 | Schémas en `z.object` : une clé inconnue est **silencieusement retirée** | `page-content.ts:35-75` | passer chaque schéma en `z.strictObject` (§3.2) |
| E2 | Enveloppe non stricte | `static-page.schema.ts:19-21` | `z.strictObject` (§3.3) |
| E3 | Aucune validation à la lecture | `static-page.service.ts:36-48` | normalisation + validation tolérante (§3.5 règle C) |
| E4 | Aucun numéro de contrat | table `static_pages` (`editorial.ts:32-50`) | colonne `contract_version` (option retenue) |
| E5 | 6 `pageKey` au lieu de 8 pages canoniques | `page-content.ts:34-76` | §6 |
| E6 | `pageKey` sans rapport avec une route servie (`communaute`, `vie-de-leglise`, `publications`) | idem | §6.3 |
| E7 | Champ `template` absent de la table alors que `docs/022` §9 le modélise | `editorial.ts:32-50` | colonne serveur, jamais reçue du client (L4) |

---

# 4. Fallback et états vides

**Contrainte établie et vérifiée du projet : une page ne s'effondre jamais.** Le
client d'API est explicitement tolérant aux pannes — « elles renvoient un tableau
vide (collection) ou `null` (ressource unique) quand l'API est injoignable, de
sorte qu'une page puisse toujours être rendue » (`lib/api/endpoints.ts:1-10`), et
`getPage()` normalise déjà `content` en objet vide (`endpoints.ts:298-319`).

## 4.1 Scénarios et comportement exigé

| Scénario | Backend | Frontend | Résultat visible |
| --- | --- | --- | --- |
| `pageKey` inconnue | `404 PAGE_NOT_FOUND` | `getPage()` renvoie `null` | la page se rend avec **tous** les textes du code |
| Ligne absente pour une `pageKey` connue | `404 PAGE_NOT_FOUND` (« n'a pas encore de contenu enregistré », `static-page.service.ts:41-46`) | idem | idem |
| Champ obligatoire absent en base (ligne ancienne) | lecture tolérante | repli sur la constante du code | idem |
| Champ facultatif absent | — | le code garde son texte par défaut | idem |
| Champ présent mais **vide** (`""`) | **refusé à l'écriture** : `text()` impose `min(1)` (`page-content.ts:27`) | impossible en base | — |
| Champ présent mais **trop long** | **refusé à l'écriture** : `.max(n)` | impossible en base | — |
| Texte contenant du balisage | accepté **comme texte** | affiché comme texte, jamais interprété | aucun risque d'injection |
| Clé de verset non résolue | — | **emplacement omis** (jamais de `<blockquote>` vide) | section de verset non rendue |
| Référence média non résolue | — | image du composant omise **ou** repli littéral du code, jamais un cadre vide blanc | image absente proprement |
| Liste dynamique vide (événements, publications, visages, départements, responsables) | `200` + collection vide | comportement **déjà défini par section** (§4.2) | section masquée, état vide ou message éditorial |
| Contenu totalement absent alors qu'un composant exige un champ (ex. `HeroManifesto.scripture`) | — | **erreur de rendu** aujourd'hui (`HeroManifesto.tsx:105,113`) | **à corriger avant exposition** (§2.9) |

## 4.2 Comportement défini par section (état actuel du code)

| Section | Liste vide | Texte absent |
| --- | --- | --- |
| `PeopleGrid` (responsables) | `<ContentPending what="Liste des responsables" …>` (`PeopleGrid.tsx:34-42`) | titre sans contenu ⇒ bloc non rendu |
| `/organisation` — responsables | `EmptyState` dédié (`page.tsx:278-281`) | littéral de repli (`:252`, `:318`) |
| `/organisation` — départements | `EmptyState` dédié (`:430-434`) | — |
| `HeroPractical.facts` | rien n'est rendu (`HeroPractical.tsx:58`) | — |
| `KeyFacts.items` | `return null` (`KeyFacts.tsx:31`) | — |
| `CrossLinks.items` | `return null` (`CrossLinks.tsx:34`) | — |
| `PhotoGallery.images` | `return null` (`PhotoGallery.tsx:28`) | — |
| `StepsList.steps` | **`<ol>` vide rendu** (`StepsList.tsx:52-74`) — anomalie : aucun garde-fou de liste vide | — |
| `EventsSection` (Accueil) | section rendue, liste vide | titres par défaut du composant (`EventsSection.tsx:66-68`) |
| `VerseSection` / `ScriptureBlock` | sans `photos` : 4 images par défaut injectées par `VerseSection` (`:104-115`) | `context` absent ⇒ sur-titre non rendu |

**Exigence :** `StepsList` est le seul composant qui produit un vide sans le dire.
Le contrat qui l'alimente (`joinSteps`, `pillars`) impose donc `min(1)`, ou le
composant doit être aligné sur `KeyFacts`/`CrossLinks`.

## 4.3 Trois règles de repli

1. **Le texte manquant n'est jamais remplacé par un texte inventé.** Le repli est
   soit la constante du code, soit l'omission. `docs/016` §5 est non négociable :
   « Ne jamais inventer : témoignages, noms, biographies, responsables, horaires,
   événements, statistiques, doctrine, dates, activités, lieux, résultats. »
2. **Un contenu manquant n'est pas une erreur visible pour le visiteur.** Pas de
   message technique ; soit le texte par défaut, soit l'emplacement omis.
3. **Aucune page ne renvoie 500 à cause de son contenu.** Une donnée éditoriale
   invalide est impossible en base (refus à l'écriture) ; une donnée ancienne est
   normalisée à la lecture.

---

# 5. Ce qui n'est **pas** dans `Page`

Liste explicite. Ces éléments ont **leurs propres tables ou leur propre code** et
ne doivent jamais apparaître dans `static_pages.content`.

### 5.1 Les listes

| Liste | Où elle vit | Source vérifiée |
| --- | --- | --- |
| Événements | table événements · `GET /events` | `endpoints.ts:138-150` |
| Publications | table publications · `GET /publications` | `endpoints.ts:162-178` |
| Départements | table départements · `GET /departments` | `endpoints.ts:115-121` |
| Responsables (`Leader`) | table dédiée · `GET /leaders` | `endpoints.ts:194-200` |
| Témoignages (`Testimony`) | table dédiée · `GET /testimonies` | `endpoints.ts:206-212` |
| Visages (`CommunityFace`) | table dédiée · `GET /community-faces` | `endpoints.ts:218-224` |
| Versets (`Scripture`) | table `scriptures` | `editorial.ts:59-81` |
| Rythme hebdomadaire | table `schedule_entries` | `editorial.ts:90-110` |
| Réseaux sociaux | table `social_links` | `editorial.ts:112-128` |
| Médias | table médias + `MediaAccess` | `editorial.ts`, D-21/D-22 |
| Réglages institutionnels | table `site_settings` (liste **fermée** de 15 clés) | `setting.schema.ts:15-31` |

La règle est déjà écrite dans le registre : « Les listes (événements, publications,
départements, versets) ne sont **pas** ici : elles ont leurs propres tables »
(`page-content.ts:21-23`), et dans `docs/018` §5.

**Seule exception admise :** un tableau **borné** de champs éditoriaux **propres à
une section** (§0.2 `items[]`) — cartes de conviction, jalons, étapes, repères,
chiffres-clés, photos d'une composition. Ce ne sont pas des entités métier : ils
n'existent nulle part ailleurs et n'ont pas de cycle de vie. Un tableau d'`id` vers
d'autres entités est en revanche **interdit** (ce serait une liste).

### 5.2 L'ordre des sections

L'ordre est **dans le JSX** : `app/page.tsx` (12 sections), `/qui-sommes-nous`
(14), `/organisation` (7). Les archétypes le confirment : chaque emplacement est
rendu dans un ordre fixe, et `rhythm` ne module que le `space`
(`archetypes/rhythm.ts:6-8`, `NarrativePage.tsx:49-82`).

Aucune clé `order`, `position`, `index` **de section** n'existe dans les schémas
du §3.2. L'ordre **des éléments à l'intérieur d'une section** (les 4 piliers, les
3 étapes) est en revanche éditorial : il appartient au contenu de la section.

### 5.3 La mise en page et le design

Variante · ton (`Band tone`) · respiration (`Band space`) · largeur (`Band width`) ·
filet (`rule`) · rythme (`rhythm`) · colonnes et grilles · ratios (`aspect-*`) ·
animations, révélations et parallaxe (`Reveal`, `ParallaxImage speed`) ·
typographie (`clamp(...)`, `font-serif`) · responsive (`max-md:*`, `svh`) ·
textes alternatifs **décoratifs** (`alt=""`) · micro-libellés internes ·
numérotation automatique · libellés d'état vide · SEO.

### 5.4 Les contenus dérivés

| Contenu dérivé | Règle | Source |
| --- | --- | --- |
| Statut d'un événement | **calculé** depuis `eventDate`, jamais persisté | `types/index.ts:12-16` |
| Nom d'un département depuis un identifiant | résolu par jointure / mapping | `page.tsx:52-55` |
| Nombre de publications publiées | **calculé** (maximum 3 `PUBLISHED` par département) | D-18 |
| Archives d'événements / de publications | **dérivées** de l'état et de la date | D-20 |
| `alt` d'une photo de galerie départementale | **généré** `${name} — photo ${n}` | `DepartmentModal.tsx:231` |
| Date de fondation affichée comme « 2023 » | **dérivée** de `site.foundedAt` après migration | `:495` vs `seed-data.ts:107` |
| Fil d'Ariane, navigation, sitemap | **code** | `lib/nav.ts:179-219` |
| Légendes photographiques affirmatives | **interdites par défaut** : « aucune légende photographique affirmative n'est écrite » | `images.ts:5-9`, `docs/015:268-270` |

---

# 6. Migration depuis l'existant

## 6.1 État de départ (vérifié)

**Registre :** 6 `pageKey`, 4 champs déclarés chacune (2 obligatoires + 2
facultatifs) — `page-content.ts:34-76`.

| `pageKey` actuel | Obligatoires | Facultatifs |
| --- | --- | --- |
| `accueil` | `heroTitle`, `heroIntro` | `pastorHeading`, `pastorMessage` |
| `qui-sommes-nous` | `title`, `intro` | `historyTitle`, `historyIntro` |
| `organisation` | `title`, `intro` | `departmentsTitle`, `departmentsIntro` |
| `communaute` | `title`, `intro` | `facesTitle`, `facesIntro` |
| `vie-de-leglise` | `title`, `intro` | `rhythmTitle`, `rhythmIntro` |
| `publications` | `title`, `intro` | `teachingsTitle`, `teachingsIntro` |

**Contenu réellement enregistré :** `seed-data.ts:238-287` — **12 valeurs**, toutes
obligatoires, aucune facultative :

| `pageKey` | Clé | Valeur enregistrée |
| --- | --- | --- |
| `accueil` | `heroTitle` | « Bienvenue dans la maison. » |
| `accueil` | `heroIntro` | « Le Centre Chrétien Jésus ma Vie est une famille spirituelle à Lubumbashi… » |
| `qui-sommes-nous` | `title` | « Une famille spirituelle à Lubumbashi » |
| `qui-sommes-nous` | `intro` | « Église chrétienne fondée le 17 mars 2023… » |
| `organisation` | `title` | « Comment l'église s'organise » |
| `organisation` | `intro` | « Les départements sont dynamiques… » |
| `communaute` | `title` | « La communauté » |
| `communaute` | `intro` | « L'église n'est pas un bâtiment, c'est un peuple… » |
| `vie-de-leglise` | `title` | « Quand et où nous rassembler » |
| `vie-de-leglise` | `intro` | « Cultes, rencontres et temps forts… » |
| `publications` | `title` | « Publications & Médias » |
| `publications` | `intro` | « Actualités, enseignements, médiathèque et ressources… » |

**Consommation côté frontend :** `getPage()` existe (`endpoints.ts:304-319`) mais
**n'a aucun consommateur** dans `frontend/src` ; aucune page ne lit aujourd'hui
`Page.content`. Le contenu est donc éditable en back-office **sans être encore
affiché** — ce qui rend la migration sans risque visuel immédiat.

## 6.2 Règle de migration

> **Aucune valeur existante ne disparaît. Toute ligne est conservée. Toute
> suppression de clé est un acte explicite et documenté.**

Trois principes opérationnels :

1. **Aucun `DELETE`** sur `static_pages`.
2. **Les 6 anciennes clés restent lisibles** tant que la matrice de
   correspondance §6.3 n'est pas entièrement appliquée.
3. **Les schémas sont d'abord élargis, ensuite utilisés** : une ligne existante
   (`title`, `intro`) doit continuer à valider contre le schéma cible. C'est
   pourquoi les anciens noms sont **conservés** là où ils existaient déjà
   (`title`, `intro`, `historyIntro`, `departmentsTitle`, `departmentsIntro`,
   `pastorHeading`, `pastorMessage` — voir §2.1, §2.2, §2.7).

## 6.3 Correspondance ancien → nouveau

| Ancienne clé | Nouveau propriétaire | Traitement |
| --- | --- | --- |
| `accueil.heroTitle` | `accueil.heroTitle` | **inchangé** (même nom, même borne 120) |
| `accueil.heroIntro` | `accueil.heroIntro` | inchangé (borne 600 conservée) |
| `qui-sommes-nous.title` | `qui-sommes-nous.title` | inchangé |
| `qui-sommes-nous.intro` | `qui-sommes-nous.intro` | inchangé |
| `organisation.title` | `organisation.title` | inchangé |
| `organisation.intro` | `organisation.intro` | inchangé |
| `communaute.title` / `.intro` | **en attente** | la « Communauté » de D-23 n'a pas de route servie (§6.5) |
| `vie-de-leglise.title` / `.intro` | **en attente** | le pôle n'est plus une destination (§6.5) |
| `publications.title` / `.intro` | **en attente** | idem |

**Aucune valeur n'est perdue par construction** : les clés conservées gardent leur
nom et leur borne ; les trois clés en attente restent en base, intactes.

## 6.4 Séquence de migration proposée

| Étape | Contenu | Vérification |
| --- | --- | --- |
| M1 | Étendre le registre aux 8 `pageKey` du §2, **en conservant** les 6 schémas actuels | `node -e` / script : les 12 valeurs de la graine valident contre les nouveaux schémas |
| M2 | Passer les schémas cibles en `z.strictObject` (E1) et l'enveloppe aussi (E2) | un `PATCH` avec clé inconnue renvoie 400 nommant la clé |
| M3 | Ajouter `contract_version` (E4) et la remplir à `1` pour toutes les lignes | aucune ligne sans version |
| M4 | Implémenter la normalisation de lecture (§3.5 règle C) | une ligne privée d'un champ obligatoire se lit sans erreur |
| M5 | Créer les `Scripture` manquants (1 Co 12:12,4-5 ; Matthieu 23:11 ; 1 Pierre 4:10) puis convertir les versets littéraux de `/organisation` en clés | les 3 sections affichent le même texte après migration |
| M6 | Migrer le contenu des 6 lignes vers les contrats enrichis : les 2 champs obligatoires restent ; les champs facultatifs non renseignés **ne sont pas inventés** | 12 valeurs retrouvables à l'identique |
| M7 | Trancher §6.5 (clés orphelines) et exécuter la décision | aucune ligne supprimée sans décision écrite |
| M8 | Brancher les pages sur `getPage(pageKey)` avec repli sur les textes du code | page rendue à l'identique, avec et sans API (§4.1) |

## 6.5 Les trois clés sans route servie — point dur de la migration

Vérifié : `frontend/src/app/` ne contient **aucun** `communaute/page.tsx`, ni
`vie-de-leglise/page.tsx`, ni `publications/page.tsx`. La navigation confirme que
ces trois pôles ne sont pas des destinations — `mainNav` leur donne `ready: true`
pour le regroupement mais **aucun `href`** (`lib/nav.ts:45-137`), et `allDestinations`
les exclut explicitement (`nav.ts:148-155`). À l'inverse, `qui-sommes-nous`
(`nav.ts:40`) et `/organisation` (`nav.ts:102`) **sont** des destinations servies.

Conséquence : **trois des six `pageKey` actuelles** (`communaute`,
`vie-de-leglise`, `publications`) désignent des pages qui n'existent pas, tandis
que **trois pages servies** (Événements, Où nous trouver, Faire un don) n'ont
**aucune clé**. C'est la contradiction principale que cette migration doit résoudre
— et elle ne peut pas l'être sans une décision (§7 Q-PG3).

Options, à titre d'analyse (aucune n'est appliquée d'office) :

- **option 1 — rattacher les textes du pôle à une page canonique** : le contenu de
  `vie-de-leglise` (« Quand et où nous rassembler ») décrit littéralement la page
  *Où nous trouver* ; le contenu de `publications` recouvre quatre pages filles ;
- **option 2 — conserver les lignes comme contenu de pôle non rendu**, en attente
  d'un usage (aucune perte, aucun gain immédiat) ;
- **option 3 — redistribuer** ces textes dans les pages enfants concernées, ligne
  par ligne, avec traçabilité.

## 6.6 Autres écarts à traiter pendant la migration

1. **Type frontend obsolète.** `frontend/src/types/index.ts:75` déclare
   `PageKey = "ACCUEIL" | "QUI_SOMMES_NOUS" | "COMMUNAUTE" | "CONTACT"` — alors que
   le backend utilise `accueil`, `qui-sommes-nous`, `organisation`, `communaute`,
   `vie-de-leglise`, `publications` (`page-content.ts:34-76`). Le fichier déclare
   de plus `StaticPage { content: string }` (`:77-81`), contredit par
   `EditablePage { content: Record<string, unknown> }` (`lib/api/types.ts:176-183`).
   À aligner : les clés de ce document font foi.
2. **Deux sources pour un même fait.** « 17 Mars 2023 » (`:115`), « 02 Juillet
   2023 » (`:179`), « Dimanche 09h » (`:399`), « Mercredi 17h » (`:404`) sont en
   dur alors que `site_settings` porte `site.foundedAt`, `site.ecodimFoundedAt`,
   `site.scheduleAdults` (`seed-data.ts:107,108,116`).
3. **Textes institutionnels non branchés.** L'adresse et le numéro WhatsApp
   affichés viennent du **mock** `site.ts:27,39-40`, alors que `GET /settings`
   existe et que `getSettings()` n'a **aucun consommateur**.
4. **`.strictObject` déjà disponible** dans la stack (`z.strictObject` utilisé par
   `prayer-request.schema.ts:50`, `media.schema.ts:68`) : E1/E2 sont des
   remplacements mécaniques, pas des changements de version de Zod.
5. **Champ `template`** (E7) : si `docs/022` §9 est implémenté, il est **écrit par
   le serveur**, jamais accepté d'un corps de requête.

## 6.7 Les horaires : quatre formulations concurrentes

Le même fait — le rythme hebdomadaire — est écrit **quatre fois** dans le dépôt,
avec des valeurs qui ne coïncident pas :

| Emplacement | Forme | Valeurs |
| --- | --- | --- |
| `data/mock/site.ts:64-104` (`weeklyRhythm`) + table `schedule_entries` | donnée structurée `{day, title, timeLabel, audience, isConfirmed}` | chorale « Lundi 16h30 – 18h30 / Mercredi dans la nuit / Samedi 16h30 – 18h30 » ; prière **mercredi 17h00** |
| `/vie-de-leglise/ou-nous-trouver:139-192` | **littéraux** dans la page | culte dimanche 09:00, Ecodim dimanche 09:00, prière & enseignement **mercredi 17:00**, chorale **lundi & samedi 16:30** ; `weeklyRhythm` est **importé mais non utilisé** (`:7`) |
| `/vie-de-leglise/evenements:81-106` | **littéraux** dans la page | mercredi 18:00 étude biblique, vendredi 17:00 chorale, dimanche 09:00 culte |
| `/qui-sommes-nous:396-411` | **littéraux** en trois repères | « Dimanche 09h », « Mercredi 17h », « Enfants » |

**Conséquence pour le contrat.** Deux options, qui ne peuvent pas coexister :
soit ces blocs deviennent des champs de page (`scheduleEntries`, `weeklyEntries` —
c'est ce que propose ce document, chaque valeur étant aujourd'hui dans le JSX), soit
ils **lisent** `schedule_entries` et `Page.content` n'en porte rien. Dans le second
cas, les trois blocs ci-dessus doivent être refactorés et les valeurs divergentes
tranchées par CCJV — aucune ne peut être déduite du code (§7 Q-PG5).

---

# 7. Questions restantes

Uniquement les points **réellement non tranchés** par D-23, `docs/018` §5,
`docs/020` §12-13, `docs/022` §9, `docs/024` §24 et `docs/025` §8. Chacune est
formulée pour être répondue en une phrase.

**Q-PG1** (`docs/027` §H) — « quel est le texte réellement éditable ? » — est
**tranchée par ce document** : la réponse est la somme des fiches du §2 (238 clés,
13 obligatoires). Elle n'est donc pas reprise ci-dessous.

| # | Question | Ce qui est déjà su | Lot |
| --- | --- | --- | --- |
| **Q-PG2** *(reprise de `docs/028`)* | Les **versets** sont-ils éditables par le back-office, et si oui : le texte du verset (`scriptures.text`), ou seulement la **clé** placée sur chaque page ? | Le contrat propose la seule clé ; la table `scriptures` existe déjà avec `text`/`reference`/`translation` | 3 |
| **Q-PG3** | Les trois clés sans route servie (`communaute`, `vie-de-leglise`, `publications`) doivent-elles être **rattachées** à une page canonique, **conservées sans usage**, ou **redistribuées** (§6.5) ? | Aucune des trois n'a de `page.tsx` ; la nav les déclare sans `href` | 3 |
| **Q-PG4** | Les faits institutionnels déjà présents deux fois (dates de fondation, horaires) doivent-ils venir **uniquement** de `site_settings`, ou peuvent-ils rester des champs de page ? | `site_settings` est déjà éditable et `GET /settings` existe | 3 / 9 |
| **Q-PG5** | Le bloc « La foi prend forme » de `/qui-sommes-nous` (3 repères horaires aujourd'hui en dur) doit-il lire `schedule_entries`, ou rester du texte éditorial ? | `schedule_entries` existe et porte `isConfirmed` | 3 / 9 |
| **Q-PG6** | Les **textes alternatifs** des images doivent-ils devenir des champs éditables ? | Les composants codent `alt=""` et n'exposent aucune prop `alt` : ce serait un ajout de prop, pas un champ | 3 / 11 |
| **Q-PG7** | La fiche `[Département]` doit-elle exister comme **route** `/organisation/departements/[slug]`, et ses libellés de template être éditables (contrat `departement` du §2.8) ? | `docs/013` §E.3 et `docs/015` §4.2 prescrivent la route ; le code ne rend aujourd'hui qu'une modale sur `/organisation` | 3 / 2 |
| **Q-PG8** | Les **métadonnées SEO** (`title`, `description` de chaque page) restent-elles dans le code, ou deviennent-elles un champ du contrat ? | Elles sont aujourd'hui littérales dans chaque `page.tsx` (`page.tsx:30-34`, `:14-19`) | 3 / 11 |
| **Q-PG9** | Un **libellé de CTA** est éditable (D-23) : sa **cible** doit-elle rester strictement dans le code, y compris pour un lien externe ? | Le contrat proposé interdit tout `href` dans `content` | 3 |
| **Q-PG10** | Les **quatre sous-pages de la Communauté** (`groupes-de-maison`, `parcours-nouveau`, `priere-et-intercession`, `temoignages`) doivent-elles recevoir **leur propre `pageKey`**, ou rester hors contrat comme aujourd'hui (§2.6) ? | Ces pages sont rendues, lisibles et liées depuis la navigation, mais aucune des huit pages canoniques de `docs/025` §8 ne les couvre | 3 |

---

# 8. Synthèse

| Page canonique | `pageKey` | Route réelle | Champs éditables | Dont obligatoires |
| --- | --- | --- | --- | --- |
| Accueil | `accueil` | `/` | 42 | 2 |
| Qui sommes-nous | `qui-sommes-nous` | `/qui-sommes-nous` | 44 | 2 |
| Événements | `evenements` *(à créer)* | `/vie-de-leglise/evenements` | 33 | 1 |
| Où nous trouver | `ou-nous-trouver` *(à créer)* | `/vie-de-leglise/ou-nous-trouver` | 25 | 1 |
| Faire un don | `faire-un-don` *(à créer)* | `/vie-de-leglise/faire-un-don` | 38 | 1 |
| Communauté | `communaute` *(existant)* | *(aucune route servie)* | 3 | 2 |
| Organisation | `organisation` | `/organisation` | 29 | 2 |
| `[Département]` | *(clé `departement` — sous réserve de Q-PG7)* | *(aucune route servie)* | 11 (entité) + 13 (template) | 2 |
| **Total** | **8 pages** | | **238** | **13** |

Les 13 champs obligatoires sont **exclusivement** des identités de page déjà
existantes : les `title`/`intro` déjà persistés pour `accueil`,
`qui-sommes-nous`, `organisation`, `communaute` (`seed-data.ts:238-287`), les
`name`/`slug` de l'entité `Department`, et le titre de hero de chaque page créée.
**Aucune nouvelle obligation n'est introduite** par cette spécification (§3.5
règle A.4).

**Champs interdits sans exception** : structure, ordre des sections, existence des
sections, variantes, layout, tons, largeurs, rythme, grilles, animations,
responsive, design, routes et ancres, cibles de CTA, numérotation affichée,
emphases typographiques, textes alternatifs décoratifs, listes d'entités, contenus
dérivés, métadonnées SEO, HTML ou balisage de toute forme.

## 8.1 Correspondance avec le tableau D-23

Chaque ligne du tableau D-23 est appliquée, jamais réinterprétée.

| Page (D-23) | « Éditable » → où c'est réalisé | « Non éditable » → où c'est verrouillé |
| --- | --- | --- |
| **Accueil** — textes éditoriaux, versets, images, CTA, contenus dynamiques prévus | §2.1 : 43 champs (textes, `verseKey`, 5 `media`, 12 libellés de CTA) ; les contenus dynamiques prévus restent en tables (§2.1) | structure, ordre des sections, layout → §2.1 « Jamais éditable » + §5.2 et §5.3 |
| **Qui sommes-nous** — textes historiques et identitaires, images, versets, contenus de présentation | §2.2 : 39 champs (`milestones`, `pillars`, `todayFacts`, `verseKeys`, `media` + `alt` descriptifs) | composition narrative, grille, animations → §2.2 « Jamais éditable » (parallaxe, tons, séquence des 14 sections) |
| **Événements** — introduction éditoriale, éléments de présentation, contenus d'événements | §2.3 : 33 champs ; les **contenus d'événements** viennent de l'entité `Event` via `GET /events`, jamais de `Page.content` | structure de page et composants → §2.3 (les 11 sections, l'omission conditionnelle, la fiche `[slug]` hors contrat) |
| **Où nous trouver** — textes d'accueil, horaires, informations pratiques, images, CTA | §2.4 : 25 champs ; **horaires** → `scheduleEntries`/`schedule_entries`, **informations pratiques** (adresse, WhatsApp) → `site_settings` | structure et design → §2.4 « Jamais éditable » |
| **Faire un don** — textes de conviction, visuels, informations de don, CTA | §2.5 : 38 champs ; les « informations de don » sont **textuelles** (`givingMethods`, `contactMessage`) faute de données bancaires existantes | composition et parcours visuel → §2.5 « Jamais éditable » |
| **Communauté** — textes, images, contenus communautaires prévus | §2.6 : 3 champs (hub) + relevé des textes communautaires hors contrat ; les **contenus communautaires** (`CommunityFace`, `HouseGroup`, `Testimony`) restent des entités | structure et layout → §2.6 « Jamais éditable » |
| **Organisation** — présentation de l'organisation, textes, visuels | §2.7 : 29 champs ; la présentation des personnes et des départements vient des entités `Leader` et `Department` | structure organisationnelle de la page → §2.7 « Jamais éditable » (barre d'ancres, ordre, replis) |
| **`[Département]`** — nom et informations éditoriales, textes, images, médias, contenus autorisés | §2.8 : entité `Department` (11 champs) + textes de template (13 champs, sous réserve de Q-PG7) | template, layout, structure → §2.8 « Jamais éditable » |

**Deux points où D-23 renvoie à d'autres tables plutôt qu'à `Page.content`** — et
où le présent document le dit explicitement plutôt que de dupliquer la donnée :
les **horaires** (§2.4, §6.7) et les **informations pratiques institutionnelles**
(adresse, WhatsApp, dates de fondation), déjà couvertes par la liste fermée des
15 clés de `site_settings` (`setting.schema.ts:15-31`).
