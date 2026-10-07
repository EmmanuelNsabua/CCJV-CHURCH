# 01 — Inventaire de composition des pages

**Périmètre** : `frontend/src/app/**` — Next.js App Router, TypeScript.
**Méthode** : lecture intégrale de chaque fichier de route (offsets/limits), plus lecture des archétypes (`src/components/archetypes/*`), des compositions de héros (`src/components/composition/*`), des blocs éditoriaux (`src/components/editorial/*`), des composants partagés (`src/components/shared/*`), des features (`src/features/*`), des mocks (`src/data/mock/*`), de `src/lib/api/*`, `src/lib/nav.ts`, `src/lib/utils.ts`.
**Règle appliquée** : ne décrire que ce que le code fait. Aucune recommandation, aucune modification.

---

## 0. Infrastructure de route (non-pages)

### PAGE: (racine — layout)  (file: src/app/layout.tsx, 62 lines)
- **Objectif UX** : coquille globale — polices, métadonnées, rideau d'introduction, lien d'évitement, header, footer.
- **Archétype** : none/raw (`<html>`/`<body>`, pas d'archétype).
- **Sections, en ordre de rendu** :
  1. `<script dangerouslySetInnerHTML={{ __html: introScript }} />` — script inline anti-flash : `try{var e=document.documentElement;if(sessionStorage.getItem("ccjv-intro")==="1"){e.classList.add("intro-seen")}else{sessionStorage.setItem("ccjv-intro","1")}}catch(t){}`
     - composants : aucun
     - data source : aucune (littéral inline `introScript`)
     - conditionnel : `if(sessionStorage.getItem("ccjv-intro")==="1")`
  2. `<IntroCurtain />` — `@/components/layout/IntroCurtain`
  3. skip-link `<a href="#contenu" className="skip-link">Aller au contenu</a>`
  4. `<Header />` — `@/components/layout/Header`
  5. `<main id="contenu">{children}</main>`
  6. `<Footer />` — `@/components/layout/Footer`
- **Hardcodé vs data-driven** : métadonnées mêlant littéral (`description`) et données (`site.name`, `site.acronym` de `@/data/mock/site`) ; `defaultTitle`, `siteUrl` de `@/lib/seo`.
- **Empty-data** : N/A.
- **Placeholder/TODO** : aucun.

### PAGE: (racine — template)  (file: src/app/template.tsx, 15 lines)
- **Objectif UX** : rejouer l'animation d'entrée à chaque changement de route.
- **Archétype** : none/raw — `<div className="page-enter">{children}</div>`.
- **Sections** : 1 (`page-enter`). Data source : aucune. Conditionnels : aucun.
- **Empty-data** : N/A. **Placeholder** : aucun.

### PAGE: /sitemap.xml  (file: src/app/sitemap.ts, 51 lines)
- **Objectif UX** : sitemap généré depuis la navigation et les données.
- **Archétype** : none/raw (`MetadataRoute.Sitemap`).
- **Data sources** : `@/lib/seo` (`siteUrl`), `@/lib/nav` (`mainNav`, `legalNav`), `@/data/mock/events` (`events`), `@/data/mock/departments` (`departments` — **importé mais jamais utilisé**), `@/data/mock/publications` (`publications`).
- **Conditionnels** : `if (item.href && item.href !== "/" && !item.href.includes("#"))`, `if (child.href && !child.href.includes("#"))`.
- **Hardcodé vs data-driven** : `staticPaths` littéral `[{ path: "", priority: 1 }, { path: "/recherche", priority: 0.3 }]` ; priorités littérales (0.8, 0.3, 0.6) ; `changeFrequency: "weekly"` littéral ; `lastModified: new Date()`.
- **NOTABLE** : `departments` est importé ligne 5 mais **aucune occurrence** dans le corps → import mort. Le sitemap ne liste **aucune** fiche département (les fiches département n'existent pas comme route, cf. `/organisation#<slug>`). Le sitemap construit aussi les URL dynamiques depuis les **mocks**, pas depuis l'API → divergera des pages réelles (`/publications`, `/vie-de-leglise/evenements`) qui lisent l'API.
- **Empty-data** : NONE — si `events`/`publications` mocks étaient vides, le sitemap perdrait simplement ces URL, sans branche dédiée.

### PAGE: /robots.txt  (file: src/app/robots.ts, 12 lines)
- **Objectif UX** : autoriser l'indexation et pointer le sitemap.
- **Archétype** : none/raw (`MetadataRoute.Robots`).
- **Sections** : 1 objet littéral. Data source : `siteUrl` de `@/lib/seo`. Conditionnels : aucun.
- `rules: { userAgent: "*", allow: "/" }` littéral.

---

## 1. Accueil

### PAGE: /  (file: src/app/page.tsx, 337 lines)
- **Objectif UX** : accueillir le visiteur, poser l'identité de l'église, orienter vers agenda / horaires / enseignements / contact.
- **Archétype** : **none/raw** — assemblage manuel de `Section` + `VerseSection` + composants de feature. Aucun import depuis `src/components/archetypes`.
- **Composants importés** : `@/components/ui/Button`, `@/components/shared/Section`, `@/components/shared/SectionHeading`, `@/components/shared/Reveal`, `@/components/shared/CrossMark`, `@/components/shared/OpenBookMark`, `@/components/shared/VerseSection`, `@/components/shared/BreathingPhoto`, `@/components/shared/WeekRhythm`, `@/components/shared/CommunityFaces`, `@/features/pages/Hero`, `@/features/events/EventsSection`, `@/features/publications/TeachingFeature`, `@/features/publications/TeachingCard`.
- **Data sources** : `@/lib/api` → `getEvents({ status: "UPCOMING", limit: 6 })`, `getPublications({ category: "ENSEIGNEMENT", limit: 3 })`, `getCommunityFaces()`, `getDepartments()` (dans un `Promise.all`) ; `@/data/mock/images` (`images`) ; `@/data/mock/site` (`site`, `socials`, `weeklyRhythm`) ; `@/data/mock/verses` (`verses`) ; `@/lib/seo` (`defaultTitle`). `page.tsx` est `async`.

**Sections, en ordre de rendu** :

1. **« 01 — ACCUEILLIR »** — `<Hero />`
   - composant : `@/features/pages/Hero` (Hero.tsx, 76 lignes)
   - data source : `images.portraitLarge` (mock images) ; le composant porte ses propres littéraux
   - littéraux (dans Hero.tsx) : `"Bienvenue dans la maison."`, `"Le Centre Chrétien Jésus ma Vie est une famille spirituelle à Lubumbashi. On y vient comme on est : pour écouter la Parole, louer Dieu et marcher ensemble."`, `"Planifier ma visite"`, `"Voir les horaires"`
   - images : `images.portraitLarge` → `/media/ccjv-05.jpeg`
   - liens/CTA : `/vie-de-leglise/ou-nous-trouver` (**les deux** boutons pointent sur la même cible)
   - conditionnels : aucun dans Hero.tsx
   - props : aucune

2. **« 02 — LA PAROLE DU JOUR »** — `<VerseSection text={verses.rassemblement.text} reference={verses.rassemblement.reference} tone="dark" />`
   - composant : `@/components/shared/VerseSection`
   - data source : `@/data/mock/verses` → `rassemblement` = `"Car là où deux ou trois sont assemblés en mon nom, je suis au milieu d'eux."` / `"Matthieu 18:20"`
   - variante : `variant` non passé → défaut `"left"` → mosaïque de 4 photos par défaut issue de `defaultImages` (`/media/ccjv-30.jpeg`, `/media/ccjv-35.jpeg`, `/media/ccjv-09.jpeg`, `/media/ccjv-08.jpeg`)
   - conditionnels : dans VerseSection, `{displayPhotos[1] && …}`, `{displayPhotos[2] && …}`, `{displayPhotos[3] && …}`

3. **« 03 — UN MOT DU PASTEUR »** — `<Section id="mot-du-pasteur" tone="tinted" aria-labelledby="mot-pasteur-titre">`
   - composants : `Section`, `Reveal`, `CrossMark`, `Image` (next/image)
   - littéraux : `"Vous êtes les bienvenus parmi nous."`, `"Que vous cherchiez Dieu depuis longtemps ou que vous poussiez la porte pour la première fois, il y a une place pour vous ici."`, `"Notre désir est simple : que chacun rencontre Jésus-Christ, grandisse dans Sa Parole et trouve une famille pour avancer. Venez tel que vous êtes — nous vous attendons avec joie."`
   - data source : `images.portraitLarge` (image), `site.visionary`, `site.visionaryRole` (texte)
   - images : `images.portraitLarge` → `/media/ccjv-05.jpeg`, `alt=""`
   - liens/CTA : aucun
   - conditionnels : aucun
   - props : `Reveal delay={100}` sur la colonne texte

4. **« 04 — QUI SOMMES-NOUS EN BREF »** — `<Section id="qui-sommes-nous" aria-labelledby="qui-sommes-nous-titre">`
   - littéraux : `"Une famille chrétienne au cœur de Lubumbashi"`, `"Le {site.name} est une église vivante…"`, `"Découvrir notre histoire →"`
   - data source : `site.name`, `images.identite`
   - images : `images.identite` → `/media/ccjv-27.jpeg`
   - liens/CTA : `/qui-sommes-nous` (« Découvrir notre histoire → », `Button variant="outline"`)
   - conditionnels : aucun
   - props : `Reveal delay={100}`

5. **« 05 — LA VIE DE L'ÉGLISE / ÉVÉNEMENTS »** — `<EventsSection … />`
   - composant : `@/features/events/EventsSection` (EventsSection.tsx, 245 lignes)
   - props : `title="Ce qui se passe"`, `description="Rejoignez-nous et marchons ensemble avec Jésus ! Découvrez nos prochains cultes, temps de prière et rencontres fraternelles."`, `ctaLabel="TOUT L'AGENDA"`, `ctaHref="/vie-de-leglise/evenements"`, `events={upcoming}` (**API**), `departmentNames={departmentNames}`, `tone="tinted"` ; `maxEvents` non passé → défaut `3`
   - data source : `getEvents({ status: "UPCOMING", limit: 6 })` ; `departmentNames` construit par `Object.fromEntries(departments.map((department) => [department.id, department.name]))` depuis `getDepartments()`
   - conditionnels (dans EventsSection) : `{description && …}`, `{ctaLabel && …}`, `const displayedEvents = events.slice(0, maxEvents)`, `{event.location && …}`, `{event.eventTime && \`${event.eventTime} · \`}`
   - liens : `/vie-de-leglise/evenements/<slug>` par item
   - **Empty-data** : NONE — si `upcoming` est vide, `displayedEvents` est vide et la colonne droite rend un `<div className="divide-y">` **sans aucun enfant** ; la section garde son titre, sa description et son CTA. Aucun `EmptyState`.
   - **Incohérence** : `EventsSection` a pour défaut `events = upcomingEvents` **importé du mock** `@/data/mock/events` (ligne 4/70) — ici le prop est fourni, donc le mock n'est pas utilisé, mais le composant porte une double source.

6. **« 06 — NOTRE RYTHME DE LA SEMAINE »** — `<Section id="horaires" aria-labelledby="horaires-titre">`
   - composants : `SectionHeading` (`@/components/shared/SectionHeading`), `WeekRhythm` (`@/components/shared/WeekRhythm`), `Button`
   - data source : `@/data/mock/site` → `weeklyRhythm` (6 entrées : Dimanche Culte dominical 09h00, Dimanche Ecodim 09h00, Lundi Répétition chorale 16h30–18h30 `confirmed`, Mercredi Répétition chorale « Dans la nuit » `confirmed`, Mercredi Prière et intercession 17h00, Samedi Répétition chorale 16h30–18h30 `confirmed`)
   - littéraux : `"Quand nous nous rassemblons"`, `"Retrouvez les horaires de nos cultes, temps de prière et répétitions tout au long de la semaine."`, `"Nous trouver et nous contacter →"`
   - liens/CTA : `/vie-de-leglise/ou-nous-trouver`
   - conditionnels : dans `WeekRhythm`, `{item.audience && …}` par entrée ; aucun `.length > 0` de garde
   - **Empty-data** : NONE — `WeekRhythm` rend `<ul className="border-t border-ccjv-line">` avec `items.map` ; tableau vide ⇒ `<ul>` vide, pas de message.
   - **NOTABLE** : `weeklyRhythm` est la **source mock** ; le champ `confirmed: true` existe dans la donnée mais `WeekRhythm` **ne l'affiche pas** (aucune mention « confirmé / à valider »).

7. **« 07 — DERNIERS ENSEIGNEMENTS (card vidéo YouTube) »** — `<Section id="enseignements" tone="tinted" aria-labelledby="enseignements-titre">`
   - composants : `SectionHeading`, `Reveal`, `TeachingFeature`, `TeachingCard`, `OpenBookMark`, `Button`
   - data source : `getPublications({ category: "ENSEIGNEMENT", limit: 3 })` ; `const [leadTeaching, ...otherTeachings] = teachings;`
   - littéraux : `"Écouter la Parole"`, `"Retrouvez nos prédications et messages récents pour nourrir votre foi."`, `"Retrouvez l'ensemble de nos messages sur notre chaîne YouTube."`, `"Tous les enseignements →"`
   - conditionnels : `{leadTeaching && (…)}`, `{otherTeachings.length > 0 && (…)}`, `{otherTeachings.slice(0, 2).map((teaching) => …)}`, `key={teaching.id}`
   - liens : `/publications/enseignements` ; les cartes pointent vers `publication.contentUrl` (YouTube, `target="_blank"`)
   - **Empty-data** : **implémentée** — si `teachings` est vide, `leadTeaching` est `undefined`, le bloc principal est omis et `otherTeachings.length > 0` est faux : la section garde titre + description + pied (« Tous les enseignements → »). Pas de message d'état vide ; c'est un repli par omission, pas un `EmptyState`.

8. **« 08 — LA COMMUNAUTÉ (visages, scrollytelling) »** — `<Section id="communaute" aria-labelledby="communaute-titre">`
   - composants : `SectionHeading`, `CommunityFaces` (`@/components/shared/CommunityFaces`, `"use client"`)
   - data source : `getCommunityFaces()` (**API**) ; `keepWithPortrait()` écarte les entrées sans `photo` et journalise via `logApiIssue`
   - littéraux : `"Les visages de notre communauté"`, `"Découvrez les hommes et les femmes qui font vivre l'église au quotidien."`
   - images : `face.photo` (venant de la donnée) — dans le mock : `/media/ccjv-01.jpeg`, `/media/ccjv-03.jpeg`, `/media/ccjv-06.jpeg`, `/media/ccjv-18.jpeg`, `/media/ccjv-34.jpeg`
   - conditionnels : dans `CommunityFaces` : `if (nodes.length === 0) return;`, `const current = faces[active];`, `{current && (…)}`
   - **Empty-data** : NONE — `faces` vide ⇒ desktop : colonne légende avec les seuls `CrossMark` + `<ol>` de progression vide, et colonne portraits vide ; mobile : `<ul className="flex flex-col gap-12 md:hidden">` vide. **Aucun message.**
   - **Incohérence majeure** : `/` prend les visages via **l'API**, tandis que `/qui-sommes-nous` les prend via **`@/data/mock/community`** (voir §2).

9. **« 09 — RESPIRATION (photographie-témoignage) »** — `<BreathingPhoto image={images.louange} phrase="La parole nous rassemble" reference={`${site.acronym} — Lubumbashi`} />`
   - composant : `@/components/shared/BreathingPhoto`
   - littéraux : `"La parole nous rassemble"`, `"Témoignage"` (dans le composant)
   - data source : `images.louange` → `/media/ccjv-08.jpeg` ; `site.acronym` → `"CCJV"` ⇒ référence affichée `"CCJV — Lubumbashi"`
   - conditionnels : `{hasArch && …}` (non activé) ; `{reference && …}`
   - **NOTABLE** : le libellé `"Témoignage"` est écrit en dur dans le composant pour une phrase qui n'est pas un témoignage de personne.

10. **« 10 — LA PRIÈRE »** — `<Section id="priere" tone="tinted" aria-labelledby="priere-titre">`
    - littéraux : `"Prenez un moment."`, `"Vous traversez une épreuve, une joie, une question ? Vous pouvez déposer votre demande de prière. Notre équipe prie pour chaque intention reçue."`, `"Demander la prière"`
    - data source : `site.whatsappHref` → `"https://wa.me/243123456789"`
    - liens/CTA : `site.whatsappHref` en `external` (WhatsApp), **pas** `/communaute/priere-et-intercession`
    - conditionnels : aucun
    - **NOTABLE** : depuis l'accueil, la prière mène hors du site (WhatsApp) alors qu'une page dédiée `/communaute/priere-et-intercession` existe avec un formulaire.

11. **« 11 — SOUTENIR L'ÉGLISE »** — `<Section id="soutenir" aria-labelledby="soutenir-titre">`
    - littéraux : `"Soutenir l'œuvre de l'église"`, `"Vos dons soutiennent l'accueil, l'enseignement des enfants, la louange et l'entraide au sein de la communauté."`, `"Vous pouvez déposer votre offrande lors de nos rassemblements ou nous contacter directement pour connaître les modalités de contribution."`, `"Nous écrire à ce sujet"`
    - data source : `images.communaute` → `/media/ccjv-30.jpeg` ; `site.whatsappHref`
    - liens/CTA : `site.whatsappHref` external
    - conditionnels : aucun
    - **NOTABLE** : aucun lien vers `/vie-de-leglise/faire-un-don` alors que la page existe.

12. **« 12 — L'ENVOI »** — `<Section id="envoi" tone="green" aria-labelledby="envoi-titre">`
    - composants : `CrossMark`, `Button`, `Link`
    - littéraux : `"La porte est ouverte."`, `"Vous n'avez rien à préparer, rien à prouver. Venez un dimanche, présentez-vous : nous serons heureux de vous accueillir."`, `"Planifier ma visite"`, `"Écrire sur WhatsApp"`, `"Voir les horaires et l'accès →"`
    - data source : `socials` (mock) → `[{ label: "Instagram", href: "https://www.instagram.com/ecodim_ccjv/" }, { label: "TikTok", href: "https://www.tiktok.com/@ecodim_ccjv" }]`
    - liens/CTA : `/vie-de-leglise/ou-nous-trouver` (×2), `site.whatsappHref`, `social.href` (×N)
    - conditionnels : `{socials.map((social) => …)}` — **pas** de garde `.length > 0`
    - **Empty-data** : NONE — `socials` vide ⇒ `<ul>` vide.

- **Hardcodé vs data-driven** : mixte. Identité/institutionnel depuis `@/data/mock/site` (`site.visionary`, `site.visionaryRole`, `site.acronym`, `site.whatsappHref`, `socials`, `weeklyRhythm`) et versets depuis `@/data/mock/verses`. Événements, enseignements, visages et départements depuis **l'API** (`@/lib/api`). **Toute la prose de la page (12 sections) est en dur dans le JSX.**
- **Empty-data behaviour** : partielle et non homogène — `{leadTeaching &&}` / `{otherTeachings.length > 0 &&}` protègent la section 07 ; les sections 05, 06, 08, 12 rendent un conteneur vide (NONE).
- **Placeholder / TODO / « à venir »** : aucun `ContentPending`, aucun `EmptyState`, aucun TODO dans ce fichier.

---

## 2. Qui sommes-nous

### PAGE: /qui-sommes-nous  (file: src/app/qui-sommes-nous/page.tsx, 624 lines)
- **Objectif UX** : raconter l'histoire fondatrice (vision, 17 mars 2023, Ecodim 2 juillet 2023), exposer foi/vision/valeurs/mission, humaniser la communauté, appeler à la visite.
- **Archétype annoncé vs réel** : le commentaire d'en-tête dit « 🏛️ Page Narrative Majeure » mais **`NarrativePage` n'est PAS importé ni utilisé**. La page est **none/raw** : `<div className="relative w-full overflow-hidden bg-ccjv-offwhite …">` contenant 14 `<section>` manuelles. Aucun `Band`, aucun `rhythm`.
- **Data sources** : `@/data/mock/images` (`images`), `@/data/mock/site` (`site`), `@/data/mock/verses` (`verses`), **`@/data/mock/community` (`communityFaces`)**, `@/lib/seo` (`pageMetadata`). **Aucun appel `@/lib/api`.**
- **Composants importés** : `@/components/shared/CrossMark`, `@/components/shared/Reveal`, `@/components/shared/VerseSection`, `@/components/shared/ParallaxImage`, `next/image`, `next/link`.

**Sections, en ordre de rendu** :

1. **HERO « Notre histoire & notre foi. »** (lignes 32-58)
   - littéraux : `"Notre histoire "`, `&`, `"notre foi."`, `"« Une histoire née d'une vision, portée par la foi et vécue ensemble à Lubumbashi. »"`
   - images : `images.hero` → `/media/ccjv-02.jpeg` (`alt="Assemblée du Centre Chrétien Jésus ma Vie"`, `priority`, `opacity-25`)
   - conditionnels : aucun. Props : `Reveal` sans delay.

2. **LA VISION « Avant la date, il y avait une vision. »** (63-103)
   - littéraux : `"Avant la date, "`, `"il y avait une vision."`, `"« Fonder une église ne commence pas par un bâtiment. Cela commence par une soif d'obéir à Dieu, et de bâtir un foyer où chacun peut Le rencontrer en vérité. »"`, `"Le Centre Chrétien Jésus ma Vie est né dans le cœur de serviteurs convaincus que l'Évangile de Jésus-Christ transforme les vies, les familles et notre ville de Lubumbashi. Avant le premier rassemblement public, il y a eu la prière, le recueillement et l'attente paisible de la direction divine."`
   - data source : `images.portraitLarge`, `site.visionary`, `site.visionaryRole`
   - images : `/media/ccjv-05.jpeg`, `alt="Pasteur Manasse Mwamba, visionnaire CCJV"` — **l'alt cite le pasteur en dur alors que `site.visionary` est disponible**
   - conditionnels : aucun. Props : `Reveal delay={120}`

3. **NAISSANCE « 17 Mars 2023 »** (108-147)
   - littéraux : `"17 Mars 2023"` (date en dur, **pas** `site.foundedAt` qui vaut `"17 mars 2023"`), `"Tout a commencé à Lubumbashi."`, `"C'est à cette date que l'église a tenu son tout premier rassemblement. Commencer avec peu, sans savoir exactement de quoi demain sera fait, en tenant la Parole de Dieu et la communion fraternelle comme seuls appuis solides."`, `"Rassemblement de l'assemblée · "`
   - data source : `images.assemblee`, `site.location` (`"Lubumbashi, République démocratique du Congo"`)
   - images : `/media/ccjv-09.jpeg`
   - conditionnels : aucun

4. **RESPIRATION BIBLIQUE I** — `<VerseSection variant="center" tone="cream" text={verses.parole.text} reference={verses.parole.reference} />` (152-157)
   - data source : `verses.parole` → `"Ta parole est une lampe à mes pieds, et une lumière sur mon sentier."` / `"Psaume 119:105"`
   - conditionnels : aucun

5. **L'HISTOIRE CONTINUE « L'histoire en marche. »** (162-230) — 2 cartes
   - littéraux : `"L'histoire en marche."`, `"Une église grandit au rythme des vies qui la composent et des ministères qui s'y éveillent."`, `"02 Juillet 2023"` (en dur, **pas** `site.ecodimFoundedAt` = `"2 juillet 2023"`), `"Naissance de l'Ecodim"`, `"Ministère dédié aux enfants : chants, récits bibliques et découverte de Dieu à leur mesure. Parce que la transmission de la foi commence dès le plus jeune âge."`, `"Déploiement"`, `"Chorale, Groupes & Ministères"`, `"Structuration des temps de prière en semaine, veillées de louange et réunions dans les quartiers. L'église devient une famille présente au quotidien."`
   - images : `images.ecodim` → `/media/ccjv-13.jpeg` ; `images.chorale` → `/media/ccjv-15.jpeg`
   - conditionnels : aucun. Props : `Reveal delay={120}` sur la 2ᵉ
   - **NOTABLE** : la date de l'Ecodim est écrite en dur « 02 Juillet 2023 » alors que `site.ecodimFoundedAt` existe — deux graphies concurrentes de la même date dans le projet.

6. **TRANSITION CINÉMATOGRAPHIQUE « Une communauté commence à prendre vie. »** (235-252)
   - littéraux : `"Une communauté commence à prendre vie."`
   - images : `images.communaute` → `/media/ccjv-30.jpeg` (`opacity-60`, `h-[65svh] min-h-[24rem]`)
   - conditionnels : aucun

7. **CE QUI NOUS DÉFINIT** (257-272)
   - littéraux : `"« Une histoire ne se résume pas à des dates. "`, `"Elle est portée par des convictions. »"`, `"Ce que nous croyons oriente tout ce que nous faisons : notre façon d'enseigner, d'accueillir, de prier et d'aimer notre prochain. Notre foi est fermement ancrée dans la Parole de Dieu."`
   - data source : aucune (littéral). conditionnels : aucun

8. **LES PILIERS DE NOTRE MARCHE** (277-378) — 4 cartes
   - littéraux : `"Les piliers de notre marche"`, `"Foi & Écriture"`, `"Notre Foi"`, `"Nous confessons l'autorité souveraine des Saintes Écritures, la foi en un seul Dieu manifesté en Père, Fils et Saint-Esprit, et le salut accordé par grâce par la foi en Jésus-Christ."`, `"Éphésiens 2:8-9 · 2 Timothée 3:16"`, `"Vision & Espérance"`, `"Regard vers l'avenir"`, `"Notre Vision"`, `"Être une église vivante, chaleureuse et rayonnante à Lubumbashi, qui équipe les croyants, guérit les cœurs brisés et prépare une génération consacrée au service de Dieu."`, `"Ésaïe 61:1-3 · Actes 2:42"`, `"Cœur & Service"`, `"Ce qui nous guide"`, `"Nos Valeurs"`, `"L'amour fraternel sincère, l'intégrité de cœur, l'humilité dans le service, la prière continuelle et l'accueil inconditionnel de toute personne qui pousse nos portes."`, `"Colossiens 3:12-14 · Jean 13:35"`, `"Grand Mandat"`, `"Le mandat"`, `"Notre Mission"`, `"Annoncer l'Évangile de Jésus-Christ, faire des disciples de toutes les nations, enseigner Sa Parole et manifester Sa bonté par des œuvres de compassion concrètes."`, `"Matthieu 28:19-20 · Marc 16:15"`
   - data source : **aucune** — les 4 piliers sont du JSX répété, **pas** un `.map()` sur un tableau. 4 blocs quasi identiques dupliqués.
   - conditionnels : aucun. Props : `Reveal delay={0|80|120|160}`
   - **NOTABLE** : aucun tableau de données, aucune garde — impossible d'en retirer un sans éditer le JSX.

9. **LA FOI PREND FORME « La foi prend forme dans le quotidien. »** (383-448)
   - littéraux : `"La foi prend forme dans le quotidien."`, `"La foi ne demeure pas une idée abstraite : elle s'exprime dans nos cultes du dimanche, dans l'adoration communautaire, dans le rire des enfants à l'Ecodim et dans le soutien mutuel lors des épreuves."`, `"Culte"`, `"Dimanche 09h"`, `"Prière"`, `"Mercredi 17h"`, `"Ecodim"`, `"Enfants"`
   - **NOTABLE** : trois horaires écrits en dur ici (`Dimanche 09h`, `Mercredi 17h`, `Enfants`) en **4ᵉ format** (ni `site.scheduleAdults` `"Dimanche · 09h00"`, ni `weeklyRhythm`, ni `ou-nous-trouver`).
   - images : `images.louange` (speed 0.10), `images.fraternite` (0.14), `images.service` (0.08), `images.predication` (0.15) → `/media/ccjv-08.jpeg`, `/media/ccjv-35.jpeg`, `/media/ccjv-28.jpeg`, `/media/ccjv-11.jpeg` — via `ParallaxImage`
   - conditionnels : aucun

10. **DEUXIÈME RESPIRATION BIBLIQUE** — `<VerseSection variant="both" tone="dark" text={verses.ouvrage.text} reference={verses.ouvrage.reference} leftPhoto={images.identite} rightPhoto={images.assemblee} />` (453-460)
    - data source : `verses.ouvrage` → `"Car nous sommes son ouvrage, ayant été créés en Jésus-Christ pour de bonnes œuvres, que Dieu a préparées d'avance, afin que nous les pratiquions."` / `"Éphésiens 2:10"` ; photos `/media/ccjv-27.jpeg` et `/media/ccjv-09.jpeg`
    - conditionnels : dans VerseSection, `{displayPhotos[1..3] && …}` (non pertinents en variante `both`)

11. **CCJV AUJOURD'HUI** (465-513)
    - littéraux : `"CCJV aujourd'hui."`, `"Aujourd'hui, le Centre Chrétien Jésus ma Vie continue d'accueillir des hommes, des femmes, des jeunes et des enfants venus de divers horizons de Lubumbashi. Une église unie par l'amour de Christ, où chacun trouve une famille spirituelle solide."`, `"2023"`, `"Année de fondation"`, `"Lubumbashi"`, `"Haut-Katanga · RDC"`
    - images : `images.identite` → `/media/ccjv-27.jpeg` — **même photo qu'en section 10 (`leftPhoto`) sur la même page**
    - conditionnels : aucun

12. **LES VISAGES « Une église n'est pas un bâtiment… »** (518-565)
    - littéraux : `"« Une église n'est pas un bâtiment : "`, `"ce sont des personnes qui marchent ensemble. »"`, `"Derrière chaque rencontre, il y a des visages dévoués, des familles engagées et des cœurs accueillants."`, `"Découvrir nos équipes et notre organisation →"`
    - data source : **`communityFaces` de `@/data/mock/community`** (5 entrées : Grâce, Patrick, Esther, Naomi, Emmanuel)
    - images : `face.photo` depuis le mock → `/media/ccjv-01.jpeg`, `/media/ccjv-03.jpeg`, `/media/ccjv-06.jpeg`, `/media/ccjv-18.jpeg`, `/media/ccjv-34.jpeg`
    - conditionnels : `{communityFaces.map((face) => …)}` — **aucun `.length > 0`**
    - liens : `/organisation`
    - **Empty-data** : NONE — `communityFaces` vide ⇒ `<div className="mt-14 grid …">` vide, le lien `/organisation` reste seul.
    - **INCOHÉRENCE** : `/` alimente `CommunityFaces` via **l'API** `getCommunityFaces()` ; `/qui-sommes-nous` alimente sa propre grille via le **mock** `communityFaces`. Deux sources pour la même notion.

13. **GRANDE RESPIRATION FINALE « L'histoire continue. »** (570-583)
    - littéraux : `"L'histoire continue."`, `"Ce qui a été commencé par la grâce de Dieu se poursuit avec chacun de ceux qu'Il appelle et conduit parmi nous."`
    - conditionnels : aucun

14. **L'APPEL CHALEUREUX « Et si vous veniez écrire la suite avec nous ? »** (588-621)
    - littéraux : `"Et si vous veniez écrire la suite avec nous ?"`, `"Que vous soyez de passage à Lubumbashi ou en recherche d'une maison spirituelle pour grandir dans la foi, vous êtes le bienvenu parmi nous."`, `"Planifier une visite"`, `"Où nous trouver & Horaires"`
    - liens/CTA : `/communaute/parcours-nouveau` (« Planifier une visite ») et `/vie-de-leglise/ou-nous-trouver`
    - conditionnels : aucun
    - **NOTABLE** : « Planifier une visite » mène à `/communaute/parcours-nouveau`, alors que le même libellé mène à `/vie-de-leglise/ou-nous-trouver` depuis `Hero.tsx` (accueil), `parcours-nouveau` (×2) et `[slug]` événement.

- **Hardcodé vs data-driven** : **massivement hardcodé**. Seuls les versets (2), les images, `site.visionary`, `site.visionaryRole`, `site.location` et `communityFaces` (mock) sont data-driven. Telle quelle, la page est **insensible à l'API** : aucun `@/lib/api`. Les dates de fondation sont réécrites en dur avec une casse différente de `site.foundedAt` / `site.ecodimFoundedAt`.
- **Empty-data behaviour** : NONE sur la quasi-totalité des sections (JSX littéral). Seule la section 12 dépend d'un tableau et n'a **aucune** garde : « NONE — would render section frame with nothing inside ».
- **Placeholder / TODO / lorem** : aucun `ContentPending`, aucun TODO. Mais deux affirmations institutionnelles non sourcées sont écrites d'autorité : les 4 piliers de foi (« Éphésiens 2:8-9 · 2 Timothée 3:16 », etc.) et la date `"17 Mars 2023"` / `"02 Juillet 2023"`.
- **INCERTAIN** : la correspondance `images.identite` ↔ « assemblée aujourd'hui » n'est pas vérifiable par le code (le fichier `images.ts` précise lui-même que ce sont des « RÔLES DE MISE EN PAGE, pas des légendes »).

---

## 3. Vie de l'Église — Événements

### PAGE: /vie-de-leglise/evenements  (file: src/app/vie-de-leglise/evenements/page.tsx, 776 lines)
- **Objectif UX** : présenter l'agenda — prochain rendez-vous mis en avant, liste à venir, rythme hebdomadaire, pôles d'expérience, ministères, archives.
- **Archétype** : **none/raw** — aucun archétype importé ; 11 `<section>` manuelles dans un `<div className="bg-ccjv-offwhite …">`.
- **Data sources** : `@/lib/api` → `getEvents({ status: "UPCOMING", limit: 50 })`, `getEvents({ status: "ARCHIVED", sort: "-event_date", limit: 50 })`, `getDepartments()` ; `@/data/mock/images` (`images`) ; `@/lib/seo` (`pageMetadata`) ; `@/lib/utils` (`formatLongDate`, `formatDay`, `formatMonthShort`, `formatYear`). Fonction `async`.
- **Composants importés** : `next/image`, `next/link`, `@/components/shared/CrossMark`, `@/components/shared/VerseSection`, `@/components/shared/Reveal`.
- **Constantes locales (tableaux littéraux)** : `experiencePillars` (4 objets, lignes 41-78), `weeklyRhythm` (**lignes 81-106, redéfinition locale**).

**Sections, en ordre de rendu** :

1. **01 — HERO : COMPOSITION TEXTE + COMPOSITION PHOTOGRAPHIQUE (2 PÔLES)** (113-187)
   - littéraux : `"Des temps pour se retrouver, "`, `"célébrer,"`, `"apprendre et grandir ensemble."`
   - images (toutes **littérales en dur**, pas via `images`) : `"/media/ccjv-08.jpeg"` (`alt="Louange et célébration au CCJV"`, priority), `"/media/ccjv-09.jpeg"` (`alt="Assemblée en prière"`, priority), `"/media/ccjv-27.jpeg"` (`alt="Communion fraternelle"`), `"/media/ccjv-13.jpeg"` (`alt="Enfants de l'Ecodim"`, masquée sous `sm` par `hidden sm:block`)
   - conditionnels : `hidden sm:block` (CSS, pas JS) ; aucun ternaire
   - **NOTABLE** : les 4 chemins `/media/*.jpeg` sont écrits en dur alors que `@/data/mock/images` (`images`) est **importé** (ligne 7) et utilisé plus loin (section 07 : `images.assemblee`). Deux régimes dans le même fichier.

2. **02 — PREMIÈRE RESPIRATION BIBLIQUE** — `<VerseSection variant="center" tone="offwhite" text="« Car là où deux ou trois sont assemblés en mon nom, je suis au milieu d'eux. »" reference="Matthieu 18:20" />` (192-197)
   - **NOTABLE** : texte et référence sont des **littéraux en dur**, écrits **avec** les guillemets `«…»` inclus dans la chaîne, alors que `verses.rassemblement.text` contient exactement la même citation **sans** guillemets et que `VerseSection` n'ajoute pas de guillemets. Le même verset apparaît donc sous deux formes (accueil : sans guillemets via mock ; ici : avec guillemets en dur).

3. **03 — LE PROCHAIN RENDEZ-VOUS** (202-294) — conditionnelle
   - garde : `{leadEvent && (…)}` où `const [leadEvent, ...otherEvents] = upcomingEvents;`
   - composants : `Image`, `Link`, `Reveal`, `formatDay/formatMonthShort/formatYear/formatLongDate`
   - littéraux : `"Le prochain rendez-vous."`, `"Événement Majeur"` (repli), `"Quand :"`, `"Lieu :"`, `"Voir les détails de l'événement →"`
   - data source : **API** `getEvents({ status: "UPCOMING", limit: 50 })` ; `departmentName(leadEvent.departmentId) || "Événement Majeur"`
   - images : `leadEvent.imageUrl || images.assemblee` → repli `/media/ccjv-09.jpeg`
   - conditionnels : `{leadEvent && (…)}`, `departmentName(leadEvent.departmentId) || "Événement Majeur"`, `{leadEvent.description || leadEvent.excerpt}`
   - liens : `/vie-de-leglise/evenements/${leadEvent.slug}`
   - **Empty-data** : **implémentée** — pas de `leadEvent` ⇒ la section entière est omise (pas de cadre vide).

4. **04 — CE QUI ARRIVE BIENTÔT** (299-437) — conditionnelle
   - garde : `{otherEvents.length > 0 && (…)}`
   - littéraux : `"Ce qui arrive bientôt."`, `"Vie de l'église"` (repli ×2), `"Voir l'événement →"`, `"Voir →"`
   - sous-conditions : `{firstUpcoming && (…)}` (colonne gauche 66 % sticky) ; `{subsequentEvents.length > 0 && (…)}` (colonne droite 30 %) ; par item : `{firstUpcoming.imageUrl && (…)}`, `{event.imageUrl && (…)}` ; `{event.excerpt || event.description}`, `{firstUpcoming.excerpt || firstUpcoming.description}`
   - data source : **API** ; `departmentName(...) || "Vie de l'église"`
   - images : `event.imageUrl` / `firstUpcoming.imageUrl` (données API)
   - conditionnels exacts : `const [leadEvent, ...otherEvents] = upcomingEvents;`, `const [firstUpcoming, ...subsequentEvents] = otherEvents;`, `{subsequentEvents.map((event, idx) => {…})}`, `delay={idx * 50}`
   - **Empty-data** : **implémentée** — un seul événement à venir ⇒ section 03 remplie, section 04 entièrement omise.

5. **05 — DIFFÉRENTES MANIÈRES DE VIVRE CCJV (4 PÔLES D'EXPÉRIENCE)** (442-498)
   - littéraux : `"Ce que vous pouvez vivre ici."`, `"Chaque événement répond à une dimension de notre marche avec Dieu. Trouvez l'espace qui correspond à votre étape spirituelle."` ; puis `"CÉLÉBRER"`/`"Louange & Adoration"`/`"Participer au culte"`, `"GRANDIR"`/`"Étude & Enseignement"`/`"Voir les temps d'étude"`, `"SE RETROUVER"`/`"Communion & Fraternité"`/`"Groupes de maison"`, `"SERVIR"`/`"Ministères & Entraide"`/`"Nos départements"`
   - data source : **`experiencePillars`, tableau littéral local** (4 objets) — images en dur `"/media/ccjv-08.jpeg"`, `"/media/ccjv-11.jpeg"`, `"/media/ccjv-30.jpeg"`, `"/media/ccjv-28.jpeg"` ; liens `"#a-venir"`, `"#cette-semaine"`, `"/communaute/groupes-de-maison"`, `"/organisation#departements"`
   - conditionnels : `{experiencePillars.map((pillar, index) => …)}`, `delay={index * 60}`, `key={pillar.tag}`
   - **NOTABLE** : deux piliers pointent vers des **ancres de la même page** (`#a-venir`, `#cette-semaine`) et deux vers des routes ; 2 des 4 CTA sont donc des sauts internes.

6. **06 — CETTE SEMAINE (LE RYTHME ÉVÉNEMENTIEL)** (503-555)
   - littéraux : `"Le rythme régulier qui nous rassemble."`, `"Les rendez-vous hebdomadaires pour prier, écouter la Parole et servir ensemble."` ; puis `"MERCREDI"`/`"18:00"`/`"Étude biblique & Intercession"`/`"Temple CCJV"`/`"Enseignement"`/`"Méditation collective des Écritures et temps de prière pour la communauté."`, `"VENDREDI"`/`"17:00"`/`"Répétition de la chorale"`/`"Temple CCJV"`/`"Louange & Musique"`/`"Préparation vocale, instrumentale et consécration dans la prière."`, `"DIMANCHE"`/`"09:00"`/`"Culte Dominical & Ecodim"`/`"Grand Temple CCJV"`/`"Célébration générale"`/`"Le grand rassemblement de la famille CCJV : louange, prédication et culte des enfants."`
   - data source : **`const weeklyRhythm = [...]` locale (lignes 81-106)** — tableau littéral dans le fichier ; **le mock `@/data/mock/site` n'est PAS importé ici**
   - images : aucune. icône : `📍` en dur dans `{item.location}`
   - conditionnels : `{weeklyRhythm.map((item, i) => …)}`, `delay={i * 80}`, `key={item.day}`
   - **INCOHÉRENCE MAJEURE** : ce `weeklyRhythm` **contredit** celui de `@/data/mock/site` (utilisé par `/`) et celui écrit en dur dans `/vie-de-leglise/ou-nous-trouver` :
     - ici : Mercredi **18:00** « Étude biblique & Intercession » ; **Vendredi 17:00** « Répétition de la chorale »
     - mock `site.ts` : Mercredi **17h00** « Prière et intercession » ; chorale **Lundi 16h30–18h30 · Mercredi dans la nuit · Samedi 16h30–18h30** — **jamais le vendredi**
     - `ou-nous-trouver` : « Prière & Enseignement **Mercredi · 17:00** » ; « Répétition de la Chorale **Lundi & Samedi · 16:30** »
     - ⇒ **trois calendriers hebdomadaires différents** pour la même église dans trois pages.

7. **07 — SECTION PHOTOGRAPHIQUE (« NOUS NOUS RETROUVONS »)** (560-599)
   - littéraux : `"« Nous ne nous réunissons pas seulement pour assister à quelque chose. "`, `"Nous nous réunissons pour être ensemble. »"`, `"Chaque dimanche, chaque répétition, chaque temps de prière est une occasion de vivre l'amour fraternel et de grandir dans la foi."`, `"Découvrir notre histoire & notre foi →"`
   - images : `images.assemblee` → `/media/ccjv-09.jpeg` (`opacity-20`, filigrane plein cadre)
   - liens : `/qui-sommes-nous`
   - conditionnels : aucun

8. **08 — PAR DÉPARTEMENT (COMMENT LA VIE S'ORGANISE)** (604-671)
   - littéraux : `"La vie dans nos différents ministères."`, `"Des espaces dédiés à chaque tranche d'âge et à chaque forme d'engagement au sein de l'église."`, `"Découvrir ce département →"`, et le message de repli `"La présentation des ministères n'est pas disponible pour le moment. Vous pouvez nous écrire : nous vous orienterons vers le département qui correspond à votre place."`
   - data source : **API** `getDepartments()` ; par item `dept.bannerImage || "/media/ccjv-27.jpeg"` (repli en dur), `dept.name`, `dept.tagline`, `dept.description`, `dept.slug`
   - conditionnels : `{departments.map((dept, index) => …)}`, `delay={index * 80}`, `key={dept.id}`, **`{departments.length === 0 && (<p …>La présentation des ministères n'est pas disponible…</p>)}`**
   - liens : `/organisation#${dept.slug}`
   - **Empty-data** : **implémentée** — seule section de cette page avec un message de repli explicite ; rend un `<p>` avec filet supérieur.

9. **09 — MOMENTS VÉCUS (MÉMOIRE VISUELLE & ARCHIVES)** (676-727) — conditionnelle
   - garde : `{archivedEvents.length > 0 && (…)}`
   - littéraux : `"Les moments vécus ensemble."`, `"Retour en images sur les temps forts qui ont marqué la vie de notre communauté."`
   - data source : **API** `getEvents({ status: "ARCHIVED", sort: "-event_date", limit: 50 })` ; `event.imageUrl || "/media/ccjv-11.jpeg"` (repli en dur) ; `{event.excerpt || event.description}`
   - conditionnels : `{archivedEvents.map((event, idx) => …)}`, `delay={idx * 60}`, `line-clamp-2`
   - liens : `/vie-de-leglise/evenements/${event.slug}`
   - **Empty-data** : **implémentée** — aucun archivé ⇒ section omise.

10. **10 — DEUXIÈME RESPIRATION BIBLIQUE** — `<VerseSection variant="both" tone="dark" text="« Veillons les uns sur les autres… »" reference="Hébreux 10:24-25" leftPhoto="/media/ccjv-08.jpeg" rightPhoto="/media/ccjv-30.jpeg" />` (732-739)
    - **NOTABLE** : texte, référence **et** photos en littéraux ; ce verset n'existe **pas** dans `@/data/mock/verses` (8 versets disponibles, aucun Hébreux 10:24-25) → verset non centralisé.

11. **11 — SECTION FINALE : L'INVITATION** (744-773)
    - littéraux : `"Quel sera votre prochain rendez-vous avec nous ?"`, `"Que ce soit pour un dimanche de célébration, une rencontre en semaine ou simplement pour faire vos premiers pas, nos portes vous sont grandes ouvertes. Venez comme vous êtes."`, `"Voir les prochains événements ↑"`, `"Planifier ma visite"`
    - liens : `#a-venir` (ancre, `<a>`) et `/vie-de-leglise/ou-nous-trouver` (`<Link>`)
    - conditionnels : aucun
    - **NOTABLE** : le CTA `#a-venir` est rendu **inconditionnellement**, alors que la section cible (03) est conditionnée par `{leadEvent && …}` : sans événement à venir, le lien d'ancre ne mène nulle part.

- **Hardcodé vs data-driven** : les **données événements/départements sont API-driven** (sections 03, 04, 08, 09) ; les **sections 01, 02, 05, 06, 07, 10, 11 sont entièrement hardcodées** (images `/media/*.jpeg` en littéral, tableau `experiencePillars`, tableau `weeklyRhythm` local, verset Hébreux en littéral).
- **Empty-data** : bonne couverture sur les sections pilotées par l'API (03, 04, 08, 09 avec message explicite) ; NONE ailleurs (ce sont des littéraux). Le cas « aucun événement » produit une page de 7 sections éditoriales sans aucune mention d'agenda vide.
- **Placeholder / TODO / lorem** : aucun `ContentPending`. Le message de repli de la section 08 joue le rôle d'état vide. Tous les commentaires `/* ===== 01 … 11 ===== */` sont des marqueurs de section, pas des TODO.
- **INCERTAIN** : `sort: "-event_date"` (snake_case) passé à `getEvents` alors que le type `Event` et les autres appels utilisent `eventDate` (camelCase) — la clé de tri dépend du contrat de l'API, non vérifiable ici.

---

### PAGE: /vie-de-leglise/evenements/[slug]  (file: src/app/vie-de-leglise/evenements/[slug]/page.tsx, 251 lines)
- **Objectif UX** : fiche d'un rendez-vous — photo d'ouverture, date/lieu, description, informations pratiques, galerie, autres rendez-vous.
- **Archétype** : **EventPage** (`@/components/archetypes/EventPage`).
- **Data sources** : `@/lib/api` → `getEvent(slug)`, `getDepartments()`, `getEvents({ status: "UPCOMING", limit: 4 })` ; `@/data/mock/site` (`site.address`, `site.name`, `site.whatsappHref`) ; `@/lib/utils` (`formatLongDate`, `formatTime`) ; `@/lib/seo` (`pageMetadata`).
- **Composants importés** : `@/components/composition/HeroPhoto`, `@/components/archetypes/EventPage`, `@/components/editorial/Prose`, `@/components/editorial/KeyFacts`, `@/components/editorial/PhotoGallery`, `@/components/ui/Badge`, `@/features/events/EventRow`, `next/link`, `notFound`.
- **Génération statique / params dynamiques** :
  - **`generateStaticParams` : OUI** (lignes 24-36) — `const events = await getEvents({ limit: 100 }); return events.map((event) => ({ slug: event.slug }));` dans un `try/catch` qui renvoie `[]` et `console.warn("[evenements] generateStaticParams : API indisponible, repli sur une liste vide", error)`.
  - **`generateMetadata` : OUI** — `getEvent(slug)`, retourne `{}` si absent.
  - **`dynamicParams` : NON déclaré** → valeur Next.js par défaut (`true`) — commentaire du fichier : « Les fiches restent servies à la demande (`dynamicParams` par défaut) ».
  - `params` typé `Promise<{ slug: string }>` (API Next 15) ; `if (!event) notFound();`.

**Slots de l'archétype, en ordre de rendu** (EventPage rend `hero`, puis `summary`, `description`, `practical`, `program`, `gallery`, `related`, chacun dans un `Band` conditionnel) :

1. **hero** — `<HeroPhoto overline={departmentName ?? "Vie de l'Église"} title={event.title} image={event.bannerImage ?? event.imageUrl ?? "/media/ccjv-08.jpeg"} caption={[formatLongDate(event.eventDate), event.location].filter(Boolean).join(" · ")} height="tall" />`
   - littéral : `"Vie de l'Église"` (repli overline)
   - images : données API, repli en dur `"/media/ccjv-08.jpeg"`
   - conditionnels : `event.bannerImage ?? event.imageUrl ?? "/media/ccjv-08.jpeg"`, `[formatLongDate(event.eventDate), event.location].filter(Boolean)`

2. **summary** — badge + date + lieu + extrait
   - littéraux : `"À venir"`, `"Passé"`
   - composants : `Badge` (`variant={isUpcoming ? "default" : "outline"}`)
   - conditionnels : `const isUpcoming = event.status === "UPCOMING";`, `{isUpcoming ? "À venir" : "Passé"}`, `{departmentName && <Badge variant="outline">{departmentName}</Badge>}`, `{event.excerpt && (…)}`, `[formatTime(event.eventTime), event.location].filter(Boolean).join(" · ")`
   - data source : API + `departmentNames` résolu depuis `getDepartments()`

3. **description** — « À propos de ce rendez-vous »
   - composants : `Prose` (`large`)
   - littéraux : `"À propos de ce rendez-vous"`, `"Bon à savoir"`
   - conditionnels : `{event.description && (<Prose large className="mt-6"><p>{event.description}</p></Prose>)}`, **`{event.practicalInfo && event.practicalInfo.length > 0 && (…)}`**, `{event.practicalInfo.map((info) => …)}`
   - **Empty-data** : **implémentée** — absent `description` ⇒ titre seul ; `practicalInfo` vide ⇒ la colonne latérale disparaît entièrement.

4. **practical** — « Ce qu'il faut pour venir » + `KeyFacts`
   - composants : `KeyFacts` (`variant="pairs"`), `Link`
   - items littéraux : `{ label: "Date", value: formatLongDate(event.eventDate) }`, `{ label: "Heure", value: formatTime(event.eventTime) || "Horaire à confirmer" }`, `{ label: "Lieu", value: event.location ?? "Lubumbashi" }`, `{ label: "Entrée", value: "Libre et ouverte à tous", hint: "Aucune inscription n'est requise pour participer." }`, `{ label: "Accès", value: \`${site.address}\`, hint: "Écrivez-nous si vous avez besoin d'être guidé jusqu'à l'église." }`
   - littéraux d'entête : `"Informations pratiques"`, `"Ce qu'il faut pour venir"`, `"Planifier ma visite"`, `"Poser une question →"`
   - liens : `/vie-de-leglise/ou-nous-trouver`, `site.whatsappHref` (`target="_blank"`)
   - conditionnels : `formatTime(event.eventTime) || "Horaire à confirmer"`, `event.location ?? "Lubumbashi"`
   - **NOTABLE** : « Entrée : Libre et ouverte à tous » est un **littéral** — affirmé quelle que soit la donnée.

5. **program** — **NON FOURNI** (le slot existe dans `EventPage` mais n'est pas passé ⇒ bandeau non rendu)
   - **Signification** : aucun programme/déroulé n'est affiché sur les fiches événement, alors que l'archétype prévoit un slot dédié. Les `practicalInfo` jouent ce rôle.

6. **gallery** — « En images » + `PhotoGallery variant="mosaic"`
   - littéral : `"En images"`
   - conditionnels : **`event.gallery && event.gallery.length > 0 ? (…) : undefined`**
   - **Empty-data** : **implémentée** — `undefined` ⇒ `{gallery && …}` faux ⇒ bandeau non rendu.

7. **related** — « Autres rendez-vous à venir » + `EventRow` ×3
   - littéral : `"Autres rendez-vous à venir"`
   - data source : `getEvents({ status: "UPCOMING", limit: 4 })` filtré
   - conditionnels : `const related = upcomingEvents.filter((item) => item.id !== event.id).slice(0, 3);`, **`related.length > 0 ? (…) : undefined`**, `{related.map((item) => …)}`, `item.departmentId ? departmentNames[item.departmentId] : undefined`
   - liens : `/vie-de-leglise/evenements/${item.slug}`

- **Hardcodé vs data-driven** : **fortement data-driven** (API). Littéraux limités aux libellés d'interface, aux replis (`"/media/ccjv-08.jpeg"`, `"Vie de l'Église"`, `"Lubumbashi"`, `"Horaire à confirmer"`) et aux faits affirmés en dur (`"Libre et ouverte à tous"`, `site.address`).
- **Empty-data behaviour** : bon — `gallery` et `related` retournent `undefined` et suppriment le bandeau ; `practicalInfo` protégé par `.length > 0`. `notFound()` si le slug est inconnu.
- **Placeholder / TODO** : aucun `ContentPending`. `"Horaire à confirmer"` est le seul marqueur d'incertitude.

---

### PAGE: /vie-de-leglise/faire-un-don  (file: src/app/vie-de-leglise/faire-un-don/page.tsx, 613 lines)
- **Objectif UX** : expliquer le sens du don, montrer les domaines d'impact, indiquer les moyens de contribuer, contacter le secrétariat.
- **Archétype** : **none/raw** — 9 `<section>` manuelles ; aucun archétype importé.
- **Data sources** : `@/data/mock/site` (`site.whatsappHref`, `site.address` indirectement), `@/data/mock/images` (`images`), `@/lib/seo`. **Aucun appel `@/lib/api`.** Composant synchrone (`export default function`).
- **Constantes locales** : `impactDomains` (4), `impactFlow` (4), `givingMethods` (3), `crossLinks` (3).
- **Composants importés** : `next/image`, `next/link`, `@/components/shared/CrossMark`, `@/components/shared/Reveal`, `@/components/shared/ParallaxImage`.

**Sections, en ordre de rendu** :

1. **01 — HERO : L'INVITATION À PARTICIPER** (133-179)
   - littéraux : `"Vous pouvez faire une différence"`, `"Votre soutien volontaire contribue à faire vivre les actions, l'accueil, la formation des enfants et la mission de l'église auprès de chacun."`, `"Faire un don ↓"`, `"Comprendre l'impact"`
   - images : `images.communaute || "/media/ccjv-30.jpeg"` via `ParallaxImage` (`priority`, `speed={0.10}`)
   - liens/CTA : `#comment-donner` et `#pourquoi-donner` (ancres internes)
   - conditionnels : aucun

2. **02 — POURQUOI DONNER ?** (184-265)
   - littéraux : `"Sens & Engagement"`, `"Une contribution qui devient action."`, `"Au Centre Chrétien Jésus ma Vie, rien de ce qui est spirituel ne s'achète : l'entrée au culte, l'écoute de la Parole, la prière fraternelle et l'encadrement des enfants sont ouverts à tous sans aucune condition."`, `"Le don est la réponse libre de personnes qui souhaitent que cette œuvre continue de rayonner, de bénir et d'accueillir dignement d'autres personnes à Lubumbashi."` ; puis 4 cartes littérales : `"01"`/`"Accueillir dignement"`/`"Recevoir chaque visiteur dans des conditions respectueuses, chaleureuses et ouvertes."`, `"02"`/`"Transmettre & Former"`/`"Enseigner les Écritures, équiper les croyants et accompagner les nouvelles générations."`, `"03"`/`"Accompagner les enfants"`/`"Donner à l'Ecodim les ressources pédagogiques et matérielles pour leur éveil spirituel."`, `"04"`/`"Servir & Soutenir"`/`"Porter assistance aux membres dans le besoin et manifester une solidarité concrète."`
   - data source : **aucune** — les 4 cartes sont du JSX dupliqué, **pas** un `.map()`
   - conditionnels : aucun

3. **03 — VOTRE DON DEVIENT ACTION** (270-308)
   - littéraux : `"Le chemin de votre geste"`, `"Comment un don financier volontaire se transforme très concrètement en impact humain et spirituel."` ; items `impactFlow` : `"01"`/`"Le geste libre"`/`"Votre contribution"`/`"Un don volontaire remis sans contrainte, fruit d'un choix personnel et réfléchi."`, `"02"`/`"Les moyens concrets"`/`"La capacité d'agir"`/`"L'église dispose des ressources nécessaires pour maintenir ses espaces, ses matériels et ses programmes."`, `"03"`/`"Le service régulier"`/`"L'action sur le terrain"`/`"Célébrations, temps d'Ecodim, répétitions de la chorale, visites et soutien fraternel prennent vie."`, `"04"`/`"La finalité humaine"`/`"Des vies touchées"`/`"Des enfants formés, des familles accompagnées et une communauté fortifiée dans la foi."`
   - data source : **`impactFlow`, tableau littéral local**
   - conditionnels : `{impactFlow.map((item, index) => …)}`, `delay={index * 100}`, `key={item.step}`

4. **04 — DOMAINES D'IMPACT** (313-354)
   - littéraux : `"Ce que votre soutien rend possible"`, `"Voici les piliers essentiels de l'église alimentés par les contributions de chacun."` ; items : `"Ecodim & Les enfants"`, `"Louange & Célébration"`, `"Enseignement & Édification"`, `"Entraide & Présence fraternelle"` avec leurs descriptions
   - data source : **`impactDomains`, tableau littéral local** ; images `images.ecodim || "/media/ccjv-13.jpeg"`, `images.chorale || "/media/ccjv-15.jpeg"`, `images.predication || "/media/ccjv-11.jpeg"`, `images.service || "/media/ccjv-28.jpeg"`
   - conditionnels : `{impactDomains.map((domain, index) => …)}`, `delay={index * 100}`

5. **05 — RESPIRATION BIBLIQUE** (359-376)
   - littéraux : `"« Que chacun donne comme il l'a résolu en son cœur, sans tristesse ni contrainte ; car Dieu aime celui qui donne avec joie. »"`, `"— 2 Corinthiens 9:7"`
   - data source : **aucune** — verset en dur, **absent** de `@/data/mock/verses` ; rendu manuellement (`<blockquote>`, `<figcaption>`), **pas** via `VerseSection`/`ScriptureBlock`
   - conditionnels : aucun

6. **06 — DONNER EST UN CHOIX (TRANSPARENCE & RESPECT)** (381-444)
   - littéraux : `"Vous êtes libre de donner"`, `"Donner est un choix éminemment personnel et volontaire. Nous refusons toute culpabilisation, pression émotionnelle ou obligation artificielle."`, `"Si vous choisissez de soutenir CCJV, votre contribution participe concrètement à la vie, aux actions et au rayonnement de la communauté."`, `"Si vous ne le faites pas, vous êtes tout autant chez vous parmi nous, reçu avec le même amour et la même joie."`
   - images : 4 `ParallaxImage` — `images.fraternite || "/media/ccjv-35.jpeg"` (0.10), `images.louange || "/media/ccjv-08.jpeg"` (0.14), `images.service || "/media/ccjv-28.jpeg"` (0.08), `images.assemblee || "/media/ccjv-09.jpeg"` (0.15) — **dont 3 déjà utilisées en section 04**
   - conditionnels : aucun

7. **07 — COMMENT CONTRIBUER ?** (449-519)
   - littéraux : `"Comment contribuer ?"`, `"Des démarches simples, directes et sécurisées adaptées à votre situation."` ; items `givingMethods` : `"Sur place, lors des cultes"`/`"Remise directe"`/`"Les contributions (dîmes, offrandes, dons de soutien) se remettent traditionnellement lors des cultes dominicaux et des rassemblements de prière dans les enveloppes prévues à cet effet."`/`"Accessible chaque dimanche matin lors du culte au quartier Hewa Bora."`, `"Mobile Money & Virement"`/`"À distance"`/`"Si vous êtes éloigné ou souhaitez effectuer un don par voie électronique (M-Pesa, Airtel Money, Orange Money ou virement bancaire), contactez le secrétariat pour obtenir les canaux officiels."`/`"Numéros et coordonnées officielles transmis sur simple message sécurisé."`, `"Soutenir un projet dédié"`/`"Projet ciblé"`/`"Vous pouvez choisir d'affecter spécialement votre don à l'Ecodim (matériel pour les enfants), aux instruments de musique de la louange ou aux actions d'entraide."`/`"Précisez l'intention de votre geste lors de votre contact avec l'église."`
   - bloc secrétariat : `"Échanger avec le secrétariat"`, `"Pour recevoir les coordonnées de Mobile Money ou du compte bancaire officiel, ou pour toute question concernant un don, écrivez-nous directement."`, `"Contacter via WhatsApp →"`
   - data source : **`givingMethods`, tableau littéral local** ; CTA `whatsappDonHref` = `${site.whatsappHref}?text=${encodeURIComponent("Bonjour Centre Chrétien Jésus ma Vie, je souhaite obtenir les informations et coordonnées pour faire un don ou soutenir l'œuvre de l'église.")}`
   - conditionnels : `{givingMethods.map((method, index) => …)}`, `delay={index * 100}`, `delay={200}` sur le bloc secrétariat
   - **NOTABLE** : **aucun moyen de don n'est réellement affiché** — pas de numéro Mobile Money, pas d'IBAN, pas de bouton de paiement ; la page renvoie vers WhatsApp pour obtenir les coordonnées. Aucune route de don transactionnel.

8. **08 — L'IMPACT HUMAIN & INVITATION FINALE** (524-577)
   - littéraux : `"Vous pouvez prendre part à cette œuvre."`, `"Derrière chaque contribution, il y a la possibilité de maintenir des portes ouvertes, d'enseigner un enfant, d'élever des louanges et de soutenir quelqu'un dans le besoin."`, `"Si vous souhaitez vous associer à ce que Dieu accomplit à travers CCJV à Lubumbashi, nous vous en remercions de tout cœur."`, `"Faire un don"`, `"Découvrir nos départements"`
   - images : `images.assemblee || "/media/ccjv-09.jpeg"` (0.10), `images.fraternite || "/media/ccjv-35.jpeg"` (0.16) — **2ᵉ et 3ᵉ réutilisation des mêmes fichiers sur cette page**
   - liens/CTA : `whatsappDonHref` (external) ; `/organisation#departements`
   - conditionnels : aucun

9. **09 — CROSS-LINKS : POURSUIVRE LA DÉCOUVERTE** (582-610)
   - littéraux : `"Poursuivre la découverte de l'église"`
   - data source : **`crossLinks`, tableau littéral local** → `{ title: "Où nous trouver", href: "/vie-de-leglise/ou-nous-trouver" }`, `{ title: "Agenda & Événements", href: "/vie-de-leglise/evenements" }`, `{ title: "Les départements", href: "/organisation#departements" }`
   - conditionnels : `{crossLinks.map((link, index) => …)}`, `delay={index * 100}`

- **Hardcodé vs data-driven** : **entièrement hardcodé** hormis `site.whatsappHref` et le pool d'images mock. Les 4 tableaux de contenu (`impactDomains`, `impactFlow`, `givingMethods`, `crossLinks`) sont des littéraux du fichier. Aucun appel API : la page ne reflète aucune donnée éditable.
- **Empty-data behaviour** : NONE partout — les tableaux sont des constantes littérales non vides, jamais alimentées par une source externe. Si `givingMethods` était vidé, la section 07 rendrait une grille vide sans message. Le bloc secrétariat (WhatsApp) resterait.
- **Placeholder / TODO / lorem** : aucun `ContentPending`. La section 07 **fonctionnellement incomplète** (aucun canal de don affiché) sans être marquée comme telle. Les 4 premiers blocs de section 02 sont des cartes dupliquées à la main plutôt qu'un `.map()`.

---

### PAGE: /vie-de-leglise/ou-nous-trouver  (file: src/app/vie-de-leglise/ou-nous-trouver/page.tsx, 360 lines)
- **Objectif UX** : donner adresse, horaires, itinéraire et rassurer le premier visiteur.
- **Archétype** : **none/raw** — 5 `<section>` manuelles ; aucun archétype. (Alors que `InformationPage` de `src/components/archetypes/InformationPage.tsx` est conçu exactement pour ce cas et n'est pas utilisé.)
- **Data sources** : `@/data/mock/site` → **`site` ET `weeklyRhythm`**, `@/data/mock/images` (`images`), `@/lib/seo`. **Aucun appel `@/lib/api`.**
- **Constante locale** : `itineraryHref = \`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address)}\`` (lignes 18-20).
- **Composants importés** : `next/image`, `next/link`, `@/components/shared/CrossMark`, `@/components/shared/VerseSection`, `@/components/shared/Reveal`, `@/components/shared/ParallaxImage`, 3 SVG inline.

**Sections, en ordre de rendu** :

1. **01 — HERO : L'ACCUEIL** (66-101)
   - littéraux : `"Une communauté prête à vous accueillir."`, `"Planifier ma visite ↓"`
   - images : `images.exterieur || "/media/ccjv-21.jpeg"` via `ParallaxImage` (`priority`, `speed={0.10}`)
   - liens : `#quand-et-ou` (ancre interne)
   - conditionnels : aucun

2. **02 — QUAND & OÙ (HORAIRES + ADRESSE + ITINÉRAIRE)** (106-259)
   - littéraux : `"Venez nous rencontrer."`, `"Toutes les informations nécessaires pour nous rejoindre simplement, sans complication."`, `"Les rendez-vous réguliers"`, `"Nos temps de rassemblement hebdomadaires ouverts à tous."`
     - ligne Culte : `"Culte Dominical"`, `"Dimanche · 09:00"`, `"Le grand culte de toute l'assemblée, suivi de moments fraternels."`
     - ligne Ecodim : `"Enfants · Ecodim"`, `"Dimanche · 09:00"`, `"Temps dédié aux enfants pendant le culte des adultes."`
     - ligne Prière : `"Prière & Enseignement"`, `"Mercredi · 17:00"`, `"Méditation de la Parole et temps d'intercession communautaire."`
     - ligne Chorale : `"Répétition de la Chorale"`, `"Lundi & Samedi · 16:30"`, `"Préparation spirituelle, musicale et vocale pour la louange."`
     - pied : `"Aucune réservation nécessaire. L'accueil commence 30 minutes avant chaque service."`
     - adresse : `"Notre adresse"`, `"Où trouver l'église à Lubumbashi."`, `"Centre Chrétien Jésus ma Vie"` (en dur, **pas** `site.name`), `"Avenue Djoloko, Quartier Hewa Bora"` (en dur, ordre inversé par rapport à `site.address` `"Quartier Hewa Bora, Avenue Djoloko Lubumbashi"`), `"Lubumbashi, République démocratique du Congo"`
     - contact : `"Besoin d'orientation :"`, `"Écrivez-nous sur WhatsApp pour des repères précis."`
     - CTA : `"Ouvrir l'itinéraire sur Google Maps ↗"`
   - data source : **littéraux en dur** sauf `itineraryHref` (dérivé de `site.address`) et `site.whatsappHref`
   - **INCOHÉRENCE CONFIRMÉE** : `weeklyRhythm` est **importé ligne 7** (`import { site, weeklyRhythm } from "@/data/mock/site";`) et **n'est utilisé nulle part** dans le fichier (grep : 1 seule occurrence = la ligne d'import). Le tableau affiché est du JSX dupliqué à la main. Les valeurs divergent du mock utilisé par `/` : la répétition « Mercredi dans la nuit » (`confirmed: true` dans `site.ts`) **disparaît**, et « Lundi & Samedi · 16:30 » remplace les trois créneaux de `choraleSchedule`.
   - conditionnels : aucun (ni `.map()`, ni `.length > 0` — 4 blocs de ligne dupliqués)
   - images : icône SVG pin en dur (lignes 217-220)

3. **03 — RESPIRATION BIBLIQUE** — `<VerseSection variant="center" tone="cream" text="« Venez, et voyez. »" reference="Jean 1:46" />` (264-269)
   - **NOTABLE** : littéraux en dur avec guillemets inclus ; verset **absent** de `@/data/mock/verses`.

4. **04 — PREMIÈRE VISITE** (274-310)
   - littéraux : `"Vous venez pour la première fois ?"`, `"Trois repères simples pour vous sentir immédiatement chez vous."` ; items `firstVisitPoints` (constante locale lignes 23-59) : `"Venez comme vous êtes"`/`"Aucun code vestimentaire imposé, aucune démarche complexe. Vous êtes le bienvenu tel que vous êtes."`, `"Seul ou accompagné"`/`"Que vous veniez en famille, entre amis ou seul pour la première fois, une équipe d'accueil attentionnée sera là pour vous guider."`, `"Vos enfants sont les bienvenus"`/`"Pendant le culte, les enfants ont leur propre espace avec l'Ecodim : chants, récits bibliques et encadrement bienveillant."`
   - data source : **tableau littéral local** avec `icon:` = JSX `<svg>` **stocké dans la donnée** (mélange données/présentation)
   - conditionnels : `{firstVisitPoints.map((point, index) => …)}`, `delay={index * 80}`, `key={point.title}`

5. **05 — SECTION FINALE : INVITATION** (315-357)
   - littéraux : `"Nous serons heureux de vous accueillir."`, `"N'hésitez pas à nous écrire si vous avez la moindre question avant de venir. Notre équipe est à votre disposition."`, `"Écrire sur WhatsApp"`, `"Voir les prochains événements →"`
   - images : `images.communaute || "/media/ccjv-30.jpeg"` (filigrane `opacity-25`)
   - liens : `site.whatsappHref` (external), `/vie-de-leglise/evenements`
   - conditionnels : aucun
   - **NOTABLE** : aucun lien vers `/communaute/parcours-nouveau` alors que c'est la page « premiers pas ».

- **Hardcodé vs data-driven** : **entièrement hardcodé** (aucune API). Trois régimes d'horaires coexistent dans le seul répertoire `vie-de-leglise` (voir événements §6).
- **Empty-data behaviour** : NONE — 4 blocs d'horaires écrits à la main, aucun `.map()`, donc aucune branche vide possible ; mais aussi aucune source unique.
- **Placeholder / TODO / lorem** : aucun `ContentPending`. `weeklyRhythm` importé et inutilisé = import mort (preuve d'un contenu qui a été copié du mock puis figé en dur).

---

## 4. Communauté

### PAGE: /communaute/groupes-de-maison  (file: src/app/communaute/groupes-de-maison/page.tsx, 440 lines)
- **Objectif UX** : expliquer l'intérêt des petits groupes de quartier et permettre d'en rejoindre un.
- **Archétype** : **none/raw** — 7 `<section>` manuelles.
- **Data sources** : `@/data/mock/images` (`images`), `@/data/mock/site` (`site.whatsappHref`), **`@/data/mock/community` (`houseGroups`)**, `@/lib/seo`. **Aucun appel `@/lib/api`.**
- **Constantes locales** : `groupPillars` (4), `relatedLinks` (3, lignes 56-72).
- **Composants importés** : `next/image`, `next/link`, `@/components/shared/CrossMark`, `@/components/shared/Reveal`, `@/components/shared/ParallaxImage`.

**Sections, en ordre de rendu** :

1. **01 — HERO : « La foi se vit aussi ensemble. »** (80-149)
   - littéraux : `"La foi se vit "`, `"aussi"`, `"ensemble."`, `"La vie avec Dieu n'a jamais été pensée pour être vécue en solitaire, ni limitée au seul rassemblement du dimanche."`, `"Trouver un groupe"`, `"Nous écrire"`
   - images : `images.communaute` (fond, `opacity-30`, `priority`) ; `images.fraternite` (cadrage flottant, `hidden lg:col-span-4 lg:block`)
   - liens : `#trouvez-votre-groupe`, `site.whatsappHref` (external)
   - conditionnels : `hidden lg:col-span-4 lg:block` (CSS)

2. **02 — POURQUOI LES GROUPES DE MAISON ?** (154-190)
   - littéraux : `"Parce que la communauté "`, `"commence à petite échelle."`, `"Un groupe de maison n'est pas une réunion administrative de plus dans la semaine. C'est un foyer où chacun peut être écouté, compris et accompagné dans ses joies comme dans ses épreuves."`, `"On y vient pour ouvrir la Bible sans complexe, prier pour des sujets qui touchent directement nos vies de famille, de couple ou d'activité, et expérimenter l'entraide chrétienne concrète."`, `"Une communauté vivante, tissée de relations authentiques."`
   - images : `images.identite` via `ParallaxImage` (0.10)
   - conditionnels : aucun

3. **03 — RESPIRATION BIBLIQUE (Actes 2:46-47)** (195-218)
   - littéraux : `"« Ils étaient chaque jour tous ensemble assidus au temple, ils rompaient le pain dans les maisons, et prenaient leur nourriture avec joie et simplicité de cœur, louant Dieu et ayant la faveur de tout le peuple. »"`, `"— Actes 2:46-47"`
   - data source : **aucune** — verset en dur, **absent** de `@/data/mock/verses` ; rendu manuellement, **pas** via `VerseSection`
   - conditionnels : aucun
   - **NOTABLE de numérotation** : les commentaires sautent de `03` (cette section) à **`05`** — il n'y a **pas de section `04`** dans le fichier. Trace d'une section supprimée.

4. **05 — TROUVEZ VOTRE GROUPE (SECTION FONCTIONNELLE RÉELLE)** (223-316)
   - littéraux : `"Trouvez votre groupe"`, `"Plusieurs cellules de quartier se réunissent chaque semaine à Lubumbashi. Choisissez le groupe le plus proche de votre domicile ou de votre lieu de travail."`, `"Nous écrire"`, `"Lieu :"`, `"Rejoindre"`
   - data source : **`houseGroups` de `@/data/mock/community`** — 4 entrées : `Groupe Hewa Bora & Centre` (Quartier Hewa Bora, « Chaque mercredi · 17h30 », image `/media/ccjv-35.jpeg`), `Groupe Bel-Air & Ruashi` (Quartier Bel-Air, « Chaque jeudi · 17h00 », `/media/ccjv-30.jpeg`), `Groupe Golf & Baudouin` (Quartier Golf, « Chaque mercredi · 18h00 », `/media/ccjv-28.jpeg`), `Groupe Kenya & Kamalondo` (Commune de la Kenya, « Chaque mardi · 17h30 », `/media/ccjv-27.jpeg`)
   - images : `group.image` (données) — conditionnel `{group.image && (…)}`
   - conditionnels : `{houseGroups.map((group, index) => {…})}`, `{group.image && (…)}`, `delay={index * 120}`, `key={group.id}`
   - CTA par groupe : `const whatsappUrl = \`https://wa.me/243123456789?text=${encodeURIComponent(\`Bonjour CCJV, je souhaite des informations pour rejoindre le ${group.name} (${group.quarter}).\`)}\`` — **le numéro `243123456789` est écrit en dur dans la page** alors que `site.whatsappHref` (`"https://wa.me/243123456789"`) est disponible et utilisé 3 fois ailleurs dans le même fichier.
   - **Empty-data** : NONE — `houseGroups` vide ⇒ `<div className="mt-14 grid …">` vide ; le titre, la description et le bouton « Nous écrire » restent.

5. **06 — ET SI JE SUIS NOUVEAU ?** (321-362)
   - littéraux : `"Vous ne connaissez "`, `"encore personne ?"`, `"C'est précisément pour cela que ces groupes existent: pour permettre à chacun de venir tel qu'il est, sans prérequis biblique ni engagement. Si vous hésitez à faire le premier pas seul, un membre de la communauté peut vous accueillir et vous accompagner lors de votre première visite."`, `"Demander un guide"`, `"Un visage ami vous attend dès votre première visite."`
   - images : `images.portraitA` → `/media/ccjv-01.jpeg`
   - liens : `site.whatsappHref` external
   - conditionnels : aucun
   - **Typographie** : `exist: pour` — espace manquante avant les deux-points (incohérence avec le reste du site qui utilise `« : »`).

6. **07 — INVITATION FINALE & LIENS CROISÉS** (367-437)
   - littéraux : `"Une place peut être "`, `"la vôtre."`, `"Ne restez pas seul avec votre foi. Rejoignez un petit groupe dans votre quartier et faites l'expérience d'une église proche et vivante."`, `"Choisir un quartier"`, `"Écrire à l'accueil CCJV"`, `"Poursuivre la découverte"`, `"Découvrir"` ; items `relatedLinks` : `"Prière & intercession"`, `"Première visite"`, `"Où nous retrouver"`
   - liens/CTA : `#trouvez-votre-groupe`, `site.whatsappHref` ; puis `relatedLinks.map` → **`{ title: "Prière & intercession", href: "/communaute/priere-et-intercession" }`, `{ title: "Première visite", description: "Tout ce que vous devez savoir pour votre premier dimanche parmi nous.", href: "/vie-de-leglise/premiere-visite" }`, `{ title: "Où nous retrouver", href: "/vie-de-leglise/ou-nous-trouver" }`**
   - conds : `{relatedLinks.map((item, index) => …)}`, `delay={index * 100}`
   - **LIEN MORT CONFIRMÉ** : `/vie-de-leglise/premiere-visite` **n'existe pas** comme route (grep sur tout `frontend/src` : seule occurrence = ce `href`). Le `<Link>` produira un 404.

- **Hardcodé vs data-driven** : mixte — les groupes viennent du mock `houseGroups` ; tout le reste est littéral. Aucune API.
- **Empty-data** : NONE pour la liste des groupes (aucun `.length > 0`, aucun `EmptyState`).
- **Placeholder / TODO / lorem** : aucun `ContentPending`. **Deux défauts factuels non marqués** : le lien mort `/vie-de-leglise/premiere-visite` et le numéro WhatsApp dupliqué en dur.

---

### PAGE: /communaute/parcours-nouveau  (file: src/app/communaute/parcours-nouveau/page.tsx, 427 lines)
- **Objectif UX** : présenter les « 5 dimensions » de la vie communautaire et projeter le visiteur dans un premier pas.
- **Archétype** : **none/raw** — 6 `<section>` manuelles.
- **Data sources** : `@/data/mock/images` (`images`), `@/data/mock/site` (`site.whatsappHref`), `@/lib/seo`. **Aucun appel `@/lib/api`.**
- **Constantes locales** : `dimensions` (5), `projectionPlaces` (5).
- **Composants importés** : `next/image`, `next/link`, `@/components/shared/CrossMark`, `@/components/shared/Reveal`, `@/components/shared/ParallaxImage`.

**Sections, en ordre de rendu** :

1. **01 — HERO CINÉMATOGRAPHIQUE (PLEIN ÉCRAN MIN-H-SCREEN)** (107-148)
   - littéraux : `"Et si vous commenciez "`, `"un nouveau chemin ?"`, `"En savoir plus"`, `"Planifier ma visite"`
   - images : `images.hero` → `/media/ccjv-02.jpeg` (`opacity-35`, `priority`)
   - liens : `#decouverte`, `/vie-de-leglise/ou-nous-trouver`
   - conditionnels : aucun

2. **02 — IMMERSION DANS LA COMMUNAUTÉ** (153-228)
   - littéraux : `"La vie chrétienne "`, `"ne s'explique pas : elle se vit."`, `"Avant les programmes et les structures, il y a des rassemblements authentiques, des chants portés par la foi, des enfants qui grandissent et des mains tendues pour s'épauler."`, `"Adoration & louange vivante"`, `"L'éveil des enfants"`, `"La foi vécue au quotidien"`
   - images : `images.louange || "/media/ccjv-08.jpeg"`, `images.ecodim || "/media/ccjv-13.jpeg"`, `images.identite || "/media/ccjv-27.jpeg"`
   - conditionnels : aucun

3. **03 — LE PARCOURS : LES DIMENSIONS DE LA VIE COMMUNAUTAIRE** (233-290)
   - littéraux : `"Cinq dimensions "`, `"pour cheminer ensemble."` ; items `dimensions` : keyword `"CÉLÉBRER"`/`"Le cœur qui s'élève"`/`"Vivre la louange et écouter la Parole chaque dimanche"`/`"Le culte dominical"`, `"RENCONTRER"`/`"Des visages et des noms"`/`"Dépasser l'anonymat dans la fraternité sincère"`/`"La communion fraternelle"`, `"GRANDIR"`/`"S'enraciner dans la Parole"`/`"Une foi qui mûrit au fil des saisons"`/`"La maturité spirituelle"`, `"PARTICIPER"`/`"Mettre ses dons au service"`/`"Chacun a quelque chose d'unique à offrir"`/`"L'engagement volontaire"`, `"S'ENRACINER"`/`"Trouver son foyer spirituel"`/`"Une communauté pour avancer toute la vie"`/`"L'appartenance durable"`
   - data source : **`dimensions`, tableau littéral local** (5 objets avec `image`, `aspect`, `accent`)
   - images : `images.assemblee || "/media/ccjv-09.jpeg"`, `images.fraternite || "/media/ccjv-35.jpeg"`, `images.predication || "/media/ccjv-11.jpeg"`, `images.service || "/media/ccjv-28.jpeg"`, `images.communaute || "/media/ccjv-30.jpeg"`
   - conditionnels : `{dimensions.map((dim, idx) => { const isAlternate = idx % 2 === 1; … })}`, `className={\`lg:col-span-6 ${isAlternate ? "lg:order-2" : "lg:order-1"}\`}` (alternance gauche/droite)
   - **NOTABLE** : la propriété `keyword` (`"CÉLÉBRER"`, `"RENCONTRER"`, …) est définie dans la donnée et sert de `key`, mais **n'est jamais affichée** — sur-titre perdu.

4. **04 — RUPTURE SPIRITUELLE (LE CENTRE DU CHEMIN : CHRIST)** (295-325)
   - littéraux : `"Le Centre de notre foi"`, `"« Je suis le chemin, la vérité, et la vie. Nul ne vient au Père que par moi. »"`, `"— Jean 14:6"`, `"Notre parcours trouve tout son sens en Jésus-Christ."`
   - data source : **aucune** — verset en dur ; rendu manuellement
   - **NOTABLE** : couleur de fond en hexadécimal arbitraire `bg-[#132A13]` (hors palette `ccjv-*`), unique dans tout le périmètre audité.

5. **05 — SE PROJETER DANS LA COMMUNAUTÉ : « IL Y A UNE PLACE POUR VOUS »** (330-373)
   - littéraux : `"Il y a une place pour vous."`, `"Peu importe d'où vous venez, votre parcours ou votre histoire, la communauté s'ouvre à vous à travers différents espaces."`, `"Découvrir"`
   - data source : **`projectionPlaces`, tableau littéral local** → `"Dans le culte"`/`/vie-de-leglise/ou-nous-trouver`, `"Dans la prière"`/`/communaute/priere-et-intercession`, `"Dans un groupe"`/`/communaute/groupes-de-maison`, `"Dans le service"`/`/organisation#departements`, `"Dans la famille"`/`/vie-de-leglise/ou-nous-trouver`
   - conditionnels : `{projectionPlaces.map((place, idx) => …)}`, `delay={idx * 80}`, numérotation `0{idx + 1}` (⇒ `01`…`05`, mais **5 cartes dans une grille `lg:grid-cols-3`** ⇒ 2 cartes orphelines sur la dernière rangée)
   - **NOTABLE** : deux entrées pointent vers la même cible (`/vie-de-leglise/ou-nous-trouver`) avec des libellés différents (« Dans le culte », « Dans la famille »).

6. **06 — INVITATION FINALE (L'APPEL SUBTIL ET ÉMOTIONNEL)** (378-424)
   - littéraux : `"Votre parcours "`, `"peut commencer ici."`, `"Venez simplement découvrir, rencontrer et vivre un moment avec nous ce dimanche à 09h00 au quartier Hewa Bora à Lubumbashi."`, `"Planifier ma visite"`, `"Nous écrire"`
   - images : `images.exterieur || "/media/ccjv-21.jpeg"` (`opacity-20`)
   - liens : `/vie-de-leglise/ou-nous-trouver`, `site.whatsappHref` external
   - conditionnels : aucun
   - **NOTABLE** : « ce dimanche à 09h00 au quartier Hewa Bora » — **5ᵉ écriture différente** de l'horaire du culte (`09h00` ici ; `"Dimanche · 09h00"` dans `site.scheduleAdults` ; `"09:00"` dans le `weeklyRhythm` local d'événements ; `"Dimanche · 09:00"` dans `ou-nous-trouver` ; `"Dimanche 09h"` dans `qui-sommes-nous`).

- **Hardcodé vs data-driven** : **entièrement hardcodé** (mocks images/site seulement). Aucune API.
- **Empty-data** : NONE — tous les contenus sont des tableaux littéraux ou du JSX. Aucun `EmptyState`, aucun `ContentPending`.
- **Placeholder / TODO / lorem** : aucun. Le champ `keyword` non affiché est la seule trace de contenu non exploité.

---

### PAGE: /communaute/priere-et-intercession  (file: src/app/communaute/priere-et-intercession/page.tsx, 435 lines)
- **Objectif UX** : rassurer, expliquer le cheminement de la prière, offrir un formulaire de dépôt d'intention, inviter à l'intercession du mercredi.
- **Archétype** : **none/raw** — 7 `<section>` manuelles.
- **Data sources** : `@/data/mock/images` (`images`), `@/data/mock/site` (`site.whatsappHref`), `@/lib/seo` ; `@/components/forms/PrayerRequestForm` (client). **Aucun appel `@/lib/api`.**
- **Constantes locales** : `prayerSteps` (3), `relatedLinks` (3).
- **Composants importés** : `next/image`, `next/link`, `@/components/shared/CrossMark`, `@/components/shared/Reveal`, `@/components/shared/ParallaxImage`, `@/components/forms/PrayerRequestForm`.

**Sections, en ordre de rendu** :

1. **01 — HERO : « Vous pouvez déposer votre prière. »** (73-142)
   - littéraux : `"Vous pouvez déposer "`, `"votre prière."`, `"Vous traversez une épreuve, une souffrance, une décision ou une action de grâce ? Vous n'avez pas à porter cela seul."`, `"Déposer une demande"`, `"Nous écrire"`
   - images : `images.louange || "/media/ccjv-08.jpeg"` (fond `opacity-30`, `priority`) ; `images.predication || "/media/ccjv-11.jpeg"` (cadrage flottant, `hidden lg:col-span-4 lg:block`)
   - liens : `#deposer-une-priere`, `site.whatsappHref` external
   - conditionnels : `hidden lg:col-span-4 lg:block` (CSS)

2. **02 — VOUS POUVEZ VENIR COMME VOUS ÊTES (RÉASSURANCE)** (147-184)
   - littéraux : `"Vous pouvez venir "`, `"exactement comme vous êtes."`, `"Que vous soyez un chrétien affermi, en recherche spirituelle ou simplement traversé par une épreuve douloureuse, vous n'avez pas besoin d'employer un langage codé ni une formulation parfaite."`, `"Partagez simplement votre situation en quelques mots. Nous croyons en un Dieu proche qui console les cœurs brisés et fortifie ceux qui espèrent en Lui."`, `"Une communauté unie pour porter les fardeaux de chacun."`
   - images : `images.fraternite || "/media/ccjv-35.jpeg"` via `ParallaxImage` (0.10)
   - conditionnels : aucun

3. **03 — RESPIRATION BIBLIQUE (Philippiens 4:6-7)** (189-212)
   - littéraux : `"« Ne vous inquiétez de rien ; mais en toute chose faites connaître vos besoins à Dieu par des prières et des supplications, avec des actions de grâces. Et la paix de Dieu, qui surpasse toute intelligence, gardera vos cœurs et vos pensées en Jésus-Christ. »"`, `"— Philippiens 4:6-7"`
   - data source : **aucune** — verset en dur, absent des mocks ; rendu manuellement
   - **NOTABLE** : le même verset est cité à nouveau, en abrégé et **sans guillemets ni référence**, dans l'état « envoyé » du formulaire (`PrayerRequestForm.tsx:58`).

4. **04 — COMMENT ÇA SE PASSE ? (3 ÉTAPES NARRATIVES)** (217-265)
   - littéraux : `"Comment votre prière est portée"`, `"Un cheminement respectueux et digne, depuis le dépôt de votre intention jusqu'à son intercession régulière."` ; items `prayerSteps` : `"01"`/`"Vous déposez"`/`"Liberté & discrétion"`, `"02"`/`"Nous prions"`/`"Engagement fidèle"`, `"03"`/`"Nous espérons"`/`"Paix & accompagnement"` + descriptions ; pied de carte `"Étape {index + 1}"` et `"Fidélité & Discrétion"` (littéral **répété à l'identique** sur les 3 cartes)
   - data source : **`prayerSteps`, tableau littéral local**
   - conditionnels : `{prayerSteps.map((item, index) => …)}`, `delay={index * 100}`, `key={item.step}`

5. **05 — SECTION PRINCIPALE : DÉPOSER UNE DEMANDE DE PRIÈRE (FORMULAIRE)** (270-293)
   - littéraux : `"Déposer une demande de prière"`, `"Remplissez ce formulaire en toute liberté. Votre intention sera confiée à nos responsables d'intercession."`
   - composant : `PrayerRequestForm` (`@/components/forms/PrayerRequestForm`, `"use client"`)
   - data source du formulaire : **aucune** — état React local (`name`, `contact`, `request`, `confidentiality`, `submitted`, `submitting`)
   - **NOTABLE — FONCTIONNEL** : la soumission est **simulée**, il n'y a **aucun appel réseau** :
     ```ts
     const handleSubmit = (e: React.FormEvent) => {
       e.preventDefault();
       if (!request.trim()) return;
       setSubmitting(true);
       // Simulation d'envoi fluide et asynchrone
       setTimeout(() => { setSubmitting(false); setSubmitted(true); }, 600);
     };
     ```
     L'écran de succès affirme `"Votre demande a bien été reçue."` et `"Notre équipe d'intercession la portera fidèlement dans la prière dès aujourd'hui."` alors que **rien n'est transmis**. Le seul canal réel est le bouton `"Confirmer sur WhatsApp →"` (`whatsappPrefilledHref`, construit depuis `site.whatsappHref`).
   - autres littéraux du formulaire : `"Que cherchez-vous ?"` → non ; exacts : `"Votre intention de prière"`, `"Quelques mots suffisent. Écrivez simplement ce que vous vivez ou ce pour quoi vous souhaitez que nous priions."`, `"Écrivez votre demande ici..."`, `"Votre prénom ou nom (facultatif)"`, `"Laissez vide pour rester anonyme"`, `"WhatsApp ou téléphone (facultatif)"`, `"Pour un message d'encouragement"`, `"Confidentialité de votre demande"`, `"Confidentiel :"`, `"Porter en assemblée :"`, `"Engagement CCJV :"`, `"Votre demande ne sera jamais publiée sur Internet ni sur les réseaux sociaux. Le respect de votre vie privée et de votre dignité est absolu."`, `"Transmission en cours..."`, `"Transmettre ma demande de prière"`, `"Déposer une autre demande"`
   - **NOTABLE** : le champ `contact` est collecté (`useState`) mais **jamais utilisé** dans `handleSubmit` ni dans le message WhatsApp — donnée saisie et ignorée. De même `confidentiality` est collecté et n'a aucun effet sur le traitement.
   - conditionnels : `if (!request.trim()) return;`, `if (submitted) { … }`, `disabled={submitting || !request.trim()}`, `{submitting ? "Transmission en cours..." : "Transmettre ma demande de prière"}`

6. **06 — NOUS PRIONS LES UNS POUR LES AUTRES (INTERCESSION)** (298-357)
   - littéraux : `"Nous prions "`, `"les uns pour les autres."`, `"« L'intercession est le souffle vivant de notre communauté. »"`, `"Au Centre Chrétien Jésus ma Vie, la prière n'est pas une formalité occasionnelle. Chaque semaine, lors de notre temps d'intercession le mercredi à 17h00 et au sein de nos groupes de maison, nous portons les besoins concrets des familles, des malades et de notre ville de Lubumbashi."`, `"Vous pouvez également nous rejoindre sur place pour prier ensemble et expérimenter la puissance de la communion fraternelle."`, `"Prier en groupe de maison"`, `"Horaires des cultes"`, `"Prière et intercession chaque mercredi à 17h00 à l'église."`
   - data source : **horaires en dur** (`"mercredi à 17h00"` ×2) — concordant avec `weeklyRhythm` du mock, **contredisant** le `weeklyRhythm` local de `/vie-de-leglise/evenements` (Mercredi 18:00)
   - images : `images.assemblee || "/media/ccjv-09.jpeg"`
   - liens : `/communaute/groupes-de-maison`, `/vie-de-leglise/ou-nous-trouver`
   - conditionnels : aucun

7. **07 — INVITATION FINALE & LIENS CROISÉS** (362-432)
   - littéraux : `"Nous pouvons prier "`, `"avec vous."`, `"Que ce soit par écrit, sur WhatsApp ou en personne lors de nos rassemblements, notre porte et nos cœurs vous restent ouverts."`, `"Déposer une intention"`, `"Écrire à l'équipe pastorale"`, `"Poursuivre la découverte"`, `"Découvrir"`
   - data source : **`relatedLinks`, tableau littéral local** → `"Groupes de maison"`/`/communaute/groupes-de-maison`, `"Parcours nouveau"`/`/communaute/parcours-nouveau`, `"Où nous retrouver"`/`/vie-de-leglise/ou-nous-trouver`
   - liens : `#deposer-une-priere`, `site.whatsappHref`
   - conditionnels : `{relatedLinks.map((item, index) => …)}`, `delay={index * 100}`

- **Hardcodé vs data-driven** : **entièrement hardcodé** (mocks images/site). Aucune API — donc aucun stockage des demandes de prière.
- **Empty-data behaviour** : NONE (littéraux). **Cas le plus significatif** : le formulaire **réussit toujours**, quelle que soit la réalité de la transmission.
- **Placeholder / TODO / lorem** : aucun `ContentPending`. La simulation est **explicitement commentée comme telle dans le code** (`// Simulation d'envoi fluide et asynchrone`) mais **annoncée comme réussie à l'utilisateur** — incohérence code/UX, non signalée par un placeholder visible.

---

### PAGE: /communaute/temoignages  (file: src/app/communaute/temoignages/page.tsx, 280 lines)
- **Objectif UX** : raconter des histoires vraies, en afficher une en grand, inviter à proposer la sienne.
- **Archétype** : **NarrativePage** (`@/components/archetypes/NarrativePage`), `rhythm="serene"`.
- **Data sources** : **`@/lib/api` → `getTestimonies()`** ; `@/data/mock/images` (`images`), `@/data/mock/site` (`site.whatsappHref`), `@/data/mock/verses` (`verses.memoire`, `verses.louange`), `@/lib/seo`. Fonction `async`.
- **Composants importés** : `next/image`, `@/components/composition/HeroManifesto`, `@/components/archetypes/NarrativePage`, `@/components/editorial/Prose`, `@/components/editorial/FeatureImage`, `@/components/editorial/PhotoDuo`, `@/components/editorial/PullQuote`, `@/components/editorial/ScriptureBlock`, `@/components/editorial/ContentPending`, `@/components/editorial/CrossLinks`, `@/components/ui/Button`, `@/components/ui/EmptyState`.
- **Constante** : `related: CrossLink[]` (4 entrées, lignes 26-47).

**Slots de l'archétype, en ordre de rendu** (NarrativePage : `hero` → `prologue` → `chapters` → `feature` → `chronology` → `epilogue` → `related`) :

1. **hero** — `<HeroManifesto tone="dark" overline="Communauté" title="Ce que Dieu a fait" declaration="Un témoignage n'est pas une performance. C'est une histoire vraie, racontée simplement par quelqu'un qui l'a vécue." scripture={{ text: verses.memoire.text, reference: verses.memoire.reference }} scriptureContext="Pourquoi nous racontons" />`
   - composant : `@/components/composition/HeroManifesto`
   - littéraux : `"Communauté"`, `"Ce que Dieu a fait"`, `"Un témoignage n'est pas une performance. C'est une histoire vraie, racontée simplement par quelqu'un qui l'a vécue."`, `"Pourquoi nous racontons"` ; le composant ajoute `"Traduction Louis Segond 1910."`
   - data source : `verses.memoire` → `"Qu'ainsi disent les rachetés de l'Éternel, ceux qu'il a délivrés de la main de l'ennemi."` / `"Psaume 107:2"`
   - images : **aucune** (HeroManifesto est sans image par construction)

2. **prologue** — « Une histoire vaut mieux qu'un argument »
   - composants : `Prose` (`dropcap large`), `ContentPending`
   - littéraux : `"Pourquoi nous racontons"`, `"Une histoire vaut mieux qu'un argument"`, `"Un raisonnement ne suffit jamais à dire ce qui change une vie. Ce qui se raconte, ce sont des moments : une période traversée, une décision prise, une rencontre qui a déplacé quelque chose."`, `"Nous racontons parce que la Bible elle-même est pleine d'histoires — et parce qu'une église est faite de personnes qui ont quelque chose à dire, même maladroitement."`, `"Ces récits ne sont ni des preuves ni des modèles. Ce sont des voix, avec leurs mots, et elles ne prétendent pas parler pour tout le monde."`
   - **`ContentPending`** : `what="Témoignages réels"`, `hint="Les témoignages présentés sur cette page sont des exemples de démonstration rédigés pour la maquette. Ils seront remplacés par de vrais témoignages, recueillis avec l'accord explicite des personnes concernées."` → rendu par `ContentPending` comme `"TODO — Témoignages réels à fournir"` (littéral exact dans le composant : `TODO — {what} à fournir`).
   - conditionnels : aucun

3. **chapters** — conditionnel `lead ? (…) : (…)`
   - garde : `const [lead, ...others] = testimonies;` puis `lead ? (…) : (<EmptyState … />)`
   - **(a) Témoignage principal** : `<article>` portrait + parole
     - littéraux : `"Témoignage"`
     - images : `lead.photo` (**donnée API**), `alt=""`
     - composant : `PullQuote` `align="left"` avec `text={\`« ${lead.quote} »\`}`
     - conditionnels : aucun à l'intérieur
   - **(b) Autres voix** : garde `{others.length > 0 && (…)}`
     - littéraux : `"D'autres voix"`, `"Des récits courts, chacun avec ses mots"`
     - images : `testimony.photo` (donnée), `alt=""`
     - conditionnels : `{others.map((testimony) => …)}`, puis 2ⁿᵈ **`ContentPending`** `variant="inline"` avec `what="Témoignages réels"` et `hint="Ces récits, comme le précédent, sont des contenus de démonstration : les témoignages définitifs doivent être recueillis auprès des personnes elles-mêmes."` → rend `"TODO — Témoignages réels à fournir."`
   - **(c) branche `else`** : `<EmptyState title="Aucun témoignage publié pour le moment" description="Les récits publiés depuis le back-office apparaîtront ici. Si vous souhaitez raconter le vôtre, écrivez-nous : il sera publié avec votre accord." />`
   - **Empty-data** : **implémentée et explicite** — la branche `else` d'un ternaire sur `lead`.

4. **feature** — `<FeatureImage src={images.service} variant="full" aspect="h-[64svh] min-h-[22rem] w-full" />`
   - image : `images.service` → `/media/ccjv-28.jpeg` (littéral via mock, **sans légende** — `caption` non passé)
   - inconditionnel.

5. **chronology** — « L'église, telle qu'on y vit »
   - littéraux : `"Photographies"`, `"L'église, telle qu'on y vit"`, `"Un témoignage se dit aussi en images. Celles-ci ne prétendent rien démontrer : elles montrent un lieu, un rassemblement, et des personnes qui s'y tiennent."`
   - composants : `Prose` (`width="narrow"`), `PhotoDuo` (`variant="offset"`)
   - images : `left={{ src: images.assemblee }}`, `right={{ src: images.fraternite }}` → `/media/ccjv-09.jpeg`, `/media/ccjv-35.jpeg`
   - conditionnels : aucun
   - **NOTABLE** : le slot `chronology` de l'archétype (prévu pour une timeline datée, `Band tone="cream"`) est détourné pour une section photo + texte — l'archétype n'est pas respecté dans son intention.

6. **epilogue** — `<ScriptureBlock variant="wide" onDark context="Rendre grâce" text={verses.louange.text} reference={verses.louange.reference} />`
   - data source : `verses.louange` → `"Que tout ce qui respire loue l'Éternel !"` / `"Psaume 150:6"`
   - `ScriptureBlock` mappe `variant="wide"` → `VerseVariant "both"` et `onDark` → `tone="dark"` ; `compact` forcé

7. **related** — « Et vous, que diriez-vous ? » + `CrossLinks`
   - littéraux : `"Partager"`, `"Et vous, que diriez-vous ?"`, `"Si quelque chose a changé dans votre vie, votre histoire peut encourager quelqu'un d'autre. Nous serions honorés de l'entendre — et vous restez libre de la raconter comme vous le souhaitez."`, `"Proposer mon témoignage"`, `"Aucun témoignage n'est publié sans l'accord explicite de la personne concernée."`
   - composants : `Prose`, `Button variant="primary" href={site.whatsappHref} external`, `CrossLinks items={related} variant="list"`
   - liens : `site.whatsappHref`, puis les 4 `related` → `/communaute/priere-et-intercession`, `/communaute/parcours-nouveau`, `/communaute/groupes-de-maison`, `/qui-sommes-nous`
   - conditionnels : dans `CrossLinks` : `if (items.length === 0) return null;`

- **Hardcodé vs data-driven** : **partiellement data-driven** — les témoignages viennent de **l'API** `getTestimonies()`, tout le reste est littéral (prologue, section photo, épilogue, related).
- **Empty-data behaviour** : **la meilleure du périmètre** — `EmptyState` explicite si `lead` est absent (`/testimonies` vide ou API injoignable → `readCollection(null) → []`). De plus l'API écarte les témoignages sans portrait via `keepWithPortrait()` et journalise l'omission.
- **Placeholder / TODO** : **DEUX `ContentPending`** visibles (un `block`, un `inline`) qui affichent littéralement **`TODO — Témoignages réels à fournir`**. C'est le seul endroit du périmètre audité où un placeholder visible est rendu à l'utilisateur en production.
- **INCOHÉRENCE** : `@/data/mock/testimonies` (`src/data/mock/testimonies.ts`, 4 témoignages : Grâce, Patrick, Esther, Josué) **n'est importé par aucune page** (grep global : 0 usage hors du fichier). Pourtant le `hint` du `ContentPending` décrit « des exemples de démonstration rédigés pour la maquette » — la donnée décrite existe mais n'est pas branchée ; c'est l'API qui fournit (ou non) les témoignages.

---

## 5. Organisation

### PAGE: /organisation  (file: src/app/organisation/page.tsx, 542 lines)
- **Objectif UX** : présenter l'organisation humaine — responsables, pasteur visionnaire, départements, et comment prendre part.
- **Archétype** : **none/raw** (et non `DirectoryPage`, conçu pour ce cas : « présenter des personnes »). 7 `<section>` manuelles dans un `<main>`. **Seule page du périmètre à rendre `<main>` elle-même** (les autres rendent un `<div>` ou `<>`) ⇒ **`<main>` imbriqué** dans le `<main id="contenu">` de `layout.tsx`.
- **Data sources** : `@/lib/api` → `getDepartments()`, `getLeaders()` ; `@/data/mock/images` (`images`), `@/data/mock/site` (`site.whatsappHref`), `@/lib/seo`. Fonction `async`.
- **Composants importés** : `next/image`, `next/link`, `@/components/ui/Button`, `@/components/ui/EmptyState`, `@/components/shared/CrossMark`, **`./OrganisationExplorer`**, `./DepartmentModal` (importé par `OrganisationExplorer`).

**Sections, en ordre de rendu** :

1. **01. HERO ÉDITORIAL DÉDIÉ** (34-183) — `<section data-hero-dark aria-label="Organisation du Centre Chrétien Jésus ma Vie">`
   - littéraux : `"Organisation & Vie de l'Église"`, `"Une communauté portée par ceux qui servent."`, `"À CCJV, l'organisation n'est pas un organigramme administratif figé. Elle est l'expression vivante d'hommes et de femmes qui donnent de leur temps, de leurs dons et de leur cœur pour prendre soin de chacun et faire grandir la famille de Dieu."`, `"Découvrir les départements ↓"`, `"Les visages du service"`, `"Entraide & Service"`, `"Louange"`, `"Ecodim"`, `"01 · Direction & Service"`, `"Les responsables"`, `"02 · Ministères actifs"`, `"Les départements"`, `"03 · Participation"`, `"Trouver sa place"`
   - images : `images.assemblee` (fond `opacity-20`, `priority`) ; `images.service || "/media/ccjv-28.jpeg"` ; `images.chorale || "/media/ccjv-15.jpeg"` ; `images.ecodim || "/media/ccjv-13.jpeg"`
   - liens/CTA : `Button variant="primary" href="#departements"`, `Button variant="inverse" href="#responsables"`, puis 3 `<a href="#responsables|#departements|#rejoindre">`
   - conditionnels : aucun
   - **NOTABLE** : `data-hero-dark` est un attribut de données posé ici ; la feuille `globals.css` s'y réfère peut-être — **INCERTAIN** : je n'ai pas audité `globals.css` dans le cadre de cette extraction (hors périmètre `app/**` + composants).

2. **02. RESPIRATION BIBLIQUE 1 : L'UNITÉ DANS LE CORPS DE CHRIST** (188-208) — `<section className="… bg-ccjv-green …" aria-label="Méditation biblique sur l'unité">`
   - littéraux : `"« Car, comme le corps est un et a plusieurs membres, et comme tous les membres du corps, malgré leur nombre, ne forment qu'un seul corps, ainsi en est-il de Christ. Il y a diversité de dons, mais le même Esprit ; diversité de ministères, mais le même Seigneur. »"`, `"1 Corinthiens 12:12, 4–5"`
   - data source : **aucune** — verset en dur, rendu manuellement (pas `VerseSection`) ; le mock `verses.corps` contient **uniquement** `"1 Corinthiens 12:12"` et **sans** la phrase « Il y a diversité de dons… » ⇒ **la citation affichée est plus longue que la donnée centralisée et porte une référence composée**.
   - conditionnels : aucun

3. **03. LES RESPONSABLES** (213-347) — `<section id="responsables" aria-labelledby="responsables-titre">`
   - littéraux : `"Des femmes et des hommes au service de la communauté"`, `"La conduite de CCJV ne repose pas sur une hiérarchie distante, mais sur des personnes engagées qui enseignent la Parole, accompagnent les familles et veillent sur chaque étape de la vie de l'église."`, `"Direction spirituelle"` (repli `scope`), `"La coordination des ministères"`, `"Chaque domaine est coordonné avec soin pour assurer un accueil chaleureux, une louange consacrée et un encadrement adapté aux petits comme aux grands."`, `"« Le plus grand parmi vous sera votre serviteur. »"`, `"Matthieu 23:11"`, `"Coordination"` (repli `scope`), `"L'ensemble de nos départements est animé par des équipes bénévoles dévouées. Vous pouvez vous adresser à l'équipe d'accueil lors de votre venue pour rencontrer les personnes en charge."`
   - data source : **API** `getLeaders()` ; `const [leadPastor, ...teamLeaders] = leaders;`
   - conditionnels : **`{leadPastor ? (…) : (<EmptyState title="Direction pastorale" description="La présentation pastorale sera affichée dès que les informations seront synchronisées." />)}`** ; **`{teamLeaders.length > 0 ? (…) : (<div className="border border-ccjv-line bg-ccjv-cream p-8">…</div>)}`** ; par item `{ldr.bio && (…)}`, `{leadPastor.bio && (…)}`, `leadPastor.photo ?? images.portraitLarge`, `ldr.photo ?? images.portraitB`, `leadPastor.scope ?? "Direction spirituelle"`, `ldr.scope ?? "Coordination"`
   - images : `leadPastor.photo` (donnée) avec repli `images.portraitLarge` → `/media/ccjv-05.jpeg` ; `ldr.photo ?? images.portraitB` → repli `/media/ccjv-03.jpeg` ; `sizes="120px"`, vignette `w-20 sm:w-24` carrée
   - **Empty-data** : **doublement implémentée** — `EmptyState` pour le pasteur, panneau de repli textuel pour l'équipe.
   - **INCOHÉRENCE** : `@/data/mock/leaders` (`src/data/mock/leaders.ts`, 5 responsables dont `leadPastor = leaders[0]`) **n'est importé nulle part** (grep global) alors qu'il porte exactement la donnée attendue et le helper `leadPastor`. La page ne lit que l'API.

4. **04. TRANSITION NARRATIVE : DE LA CHAIRE À L'ENSEMBLE DU CORPS** (352-399) — `<section … aria-label="Transition narrative">`
   - littéraux : `"« Une église ne se construit pas seulement depuis une chaire. »"`, `"Elle grandit lorsque chacun trouve une manière de servir."`, `"L'église n'est pas un spectacle auquel on assiste en spectateur : c'est une famille où chaque voix, chaque sourire à l'entrée et chaque geste discret contribuent à refléter l'amour de Christ à Lubumbashi."`
   - images : `images.fraternite || "/media/ccjv-35.jpeg"`, `images.predication || "/media/ccjv-11.jpeg"`
   - conditionnels : aucun

5. **05. LES DÉPARTEMENTS DYNAMIQUES** (404-437) — `<section id="departements" aria-labelledby="departements-titre">`
   - littéraux : `"Des espaces pour grandir et servir"`, `"Chaque département répond à un appel particulier : éveil spirituel des enfants, édification des adultes, louange consacrée et fraternité active."`
   - data source : **API** `getDepartments()`
   - conditionnels : **`{departments.length > 0 ? (<OrganisationExplorer departments={departments} />) : (<EmptyState className="mt-12" title="Les départements sont en cours de mise à jour" description="Les pôles et ministères de l'église seront consultables très prochainement." />)}`**
   - **Empty-data** : **implémentée** (`EmptyState`).

6. **06. RESPIRATION BIBLIQUE 2 : LE DON ET LE SERVICE** (442-460) — `<section className="… bg-ccjv-black …" aria-label="Méditation biblique sur le don">`
   - littéraux : `"« Comme de bons dispensateurs des diverses grâces de Dieu, que chacun de vous mette au service des autres le don qu'il a reçu. »"`, `"1 Pierre 4:10"`
   - data source : **aucune** — verset en dur, rendu manuellement ; absent de `@/data/mock/verses`
   - conditionnels : aucun

7. **07. CONCLUSION & APPEL** (465-539) — `<section id="rejoindre" aria-labelledby="rejoindre-titre">`
   - littéraux : `"Et vous, où pourriez-vous trouver votre place ?"`, `"Il n'y a pas de petit service dans la maison de Dieu. Que vous ayez à cœur d'accueillir, d'enseigner les plus jeunes, de chanter ou d'apporter votre aide pratique, nous serons heureux de vous accompagner."` ; 3 cartes : `"01"`/`"Découvrir nos pôles"`, `"02"`/`"Échanger simplement"`, `"03"`/`"Participer à votre rythme"` + descriptions ; CTA `"Écrire pour participer / servir"`, `"Découvrir le parcours nouveau →"`, `"Voir nos horaires de culte et notre adresse à Lubumbashi →"`
   - data source : **aucune** — les 3 étapes sont du JSX dupliqué, **pas** un `.map()`
   - liens : `site.whatsappHref` (external), `/communaute/parcours-nouveau`, `/vie-de-leglise/ou-nous-trouver`
   - conditionnels : aucun

#### Sous-composants de /organisation

**OrganisationExplorer** (`src/app/organisation/OrganisationExplorer.tsx`, 149 lines, `"use client"`)
- Props : `{ departments: Department[] }`
- État : `const [selectedDept, setSelectedDept] = useState<Department | null>(null);`
- Rendu : `<div className="mt-14 space-y-16">` + `{departments.map((dept, idx) => { const isReversed = idx % 2 === 1; return (<article key={dept.id} id={dept.slug} …>…</article>) })}` puis **`<DepartmentModal … />` toujours monté**
- Littéraux : `"Responsable : "`, `"Coordination d'équipe"` (repli `dept.responsibleName`), `"Découvrir le département"`, `"→"`
- Conditionnels : `{dept.slug === "enfants-ecodim" && <div id="ecodim" className="scroll-mt-28" />}` ; `{dept.slug === "adultes" && <div id="adulte" className="scroll-mt-28" />}` (alias d'ancres **codés en dur sur les slugs**) ; `{dept.meetingSchedule && (…)}` ; `{dept.tagline && (…)}` ; **`{dept.keyPoints && dept.keyPoints.length > 0 && (…)}`** avec **`dept.keyPoints.slice(0, 4).map((pt) => …)`** ; `dept.bannerImage ?? images.communaute` (repli `/media/ccjv-30.jpeg`)
- Interaction : `onClick={() => handleOpenDepartment(dept)}` → `setSelectedDept(dept); window.history.replaceState(null, "", \`#${dept.slug}\`);`
- **Empty-data** : `departments` vide ⇒ `<div className="mt-14 space-y-16">` vide (aucun message) — mais le parent ne monte jamais ce composant dans ce cas (`length > 0`), donc la garde est **double**.
- **NOTABLE** : `images` est importé de `@/data/mock/images` dans un composant **client** ⇒ les chemins mock sont embarqués dans le bundle navigateur.

**DepartmentModal** (`src/app/organisation/DepartmentModal.tsx`, 283 lines, `"use client"`)
- Props : `{ departments, selectedDepartment, onClose, onSelect }`
- État : `const [activeDept, setActiveDept] = useState<Department | null>(selectedDepartment);`
- Effets : synchronisation `useEffect(() => { setActiveDept(selectedDepartment); }, [selectedDepartment])` ; écoute `hashchange` + lecture initiale du hash ; verrouillage `document.body.style.overflow = "hidden"` + fermeture sur `Escape`
- Résolution par hash : `d.slug.toLowerCase() === hash || (hash === "ecodim" && d.slug.includes("ecodim")) || (hash === "adultes" && d.slug.includes("adultes")) || (hash === "chorale" && d.slug.includes("chorale"))`
- Rend : `if (!activeDept) return null;` puis `<div role="dialog" aria-modal="true" aria-labelledby="dept-modal-title" onClick={handleClose}>` et un volet `max-w-2xl`
- Littéraux : `"Département CCJV"`, `"Fermer"`, `"✕"`, `"Rythme & Horaires"`, `"Culte dominical · 09:00"` (repli `meetingSchedule`), `"Responsable"`, `"Équipe de coordination"` (repli), `"Lieu de rassemblement"`, `"Ce qui structure ce département"`, `"La vie en images"`, `"Participer à ce département"`, `"Pour vous intégrer ou poser vos questions, écrivez-nous ou adressez-vous directement à l'équipe d'accueil lors de votre venue."`, `"Écrire au sujet de ce département"`, `"Explorer un autre département :"`, `"→"`
- CTA : `whatsappUrl = \`${site.whatsappHref}?text=${encodeURIComponent(\`Bonjour Centre Chrétien Jésus ma Vie, je souhaite obtenir des informations pour participer ou rejoindre le département « ${activeDept.name} ».\`)}\``
- Conditionnels : `if (!activeDept) return null;`, `{activeDept.bannerImage && (…)}`, `{activeDept.tagline && (…)}`, `{activeDept.keyPoints && activeDept.keyPoints.length > 0 && (…)}` puis **`{activeDept.keyPoints.map((point, pIdx) => …)}` avec `{String(pIdx + 1).padStart(2, "0")}`**, **`{activeDept.gallery && activeDept.gallery.length > 0 && (…)}`** puis **`{activeDept.gallery.slice(0, 6).map((imgUrl, gIdx) => …)}`**, `{departments.filter((d) => d.id !== activeDept.id).map((d) => …)}`
- Images : `activeDept.bannerImage`, `activeDept.gallery[]` (données API) ; `alt={\`${activeDept.name} — photo ${gIdx + 1}\`}` (alt générique)
- **NOTABLE — incohérence de repli** : `Explorer` affiche `dept.keyPoints.slice(0, 4)` (4 max) alors que `DepartmentModal` les affiche **tous** (`keyPoints.map` sans `slice`) ; `Explorer` n'affiche **pas** la galerie, `Modal` en affiche 6.
- **NOTABLE** : la fermeture (clic overlay, `Escape`, bouton) appelle `window.history.replaceState(null, "", window.location.pathname)` — l'ancre est retirée ; mais le composant est remonté **sur chaque page `/organisation`** puisqu'il est rendu par `OrganisationExplorer`.

- **Hardcodé vs data-driven** : mixte, très inégal. Responsables et départements = **API** ; hero, 2 respirations bibliques, transition, conclusion + 3 étapes = **entièrement en dur** (dont 2 versets non centralisés, et un verset de `1 Corinthiens 12:12` enrichi par rapport au mock).
- **Empty-data behaviour** : **la plus complète du périmètre** pour les données API (`EmptyState` ×2 + panneau de repli), grâce auxquelles la page reste cohérente si `leaders` ou `departments` sont vides. Les 5 sections littérales n'ont évidemment aucune branche vide.
- **Placeholder / TODO / lorem** : aucun `ContentPending` ni TODO. Mais l'`EmptyState` `"Direction pastorale"` / `"La présentation pastorale sera affichée dès que les informations seront synchronisées."` sert d'état vide. Les responsables du mock portent des libellés explicites de placeholder (`"Responsable — Adultes"`, `"Responsable Ecodim — à confirmer"`, `"Responsable chorale — à confirmer"`) — **mais ni `leaders.ts` ni `departments.ts` (mock) n'atteignent cette page**, qui lit l'API : le marqueur « à confirmer » dépend donc de ce que l'API renvoie. **INCERTAIN** : impossible de savoir depuis le frontend si la valeur affichée contient « à confirmer ».

---

## 6. Publications

### PAGE: /publications/actualites  (file: src/app/publications/actualites/page.tsx, 208 lines)
- **Objectif UX** : indexer les nouvelles et annonces, une en une, puis en liste.
- **Archétype** : **ListingPage** (`@/components/archetypes/ListingPage`), `rhythm` non passé → défaut `"dense"`.
- **Data sources** : `@/lib/api` → `getPublications({ category: "ACTUALITE", limit: 50 })` **et** `getPublications({ limit: 50 })` ; `@/data/mock/images` (`images`), `@/lib/utils` (`formatLongDate`), `@/lib/seo`. Fonction `async`.
- **Composants importés** : `next/link`, `next/image`, `@/components/composition/HeroCompact`, `@/components/archetypes/ListingPage`, `@/components/editorial/CrossLinks`, `@/components/editorial/FeatureImage`, `@/components/ui/EmptyState`.

**Slots de l'archétype, en ordre de rendu** :

1. **header** — `<HeroCompact overline="Publications & Médias" title="Actualités" intro="Les nouvelles de la vie de l'église : annonces, rentrées, informations pratiques. Ce qui change dans les prochaines semaines se trouve ici." aside={<p …>{items.length} actualité{items.length > 1 ? "s" : ""} publiée{items.length > 1 ? "s" : ""}{lead ? \` · dernière le ${formatLongDate(lead.publishedAt)}\` : ""}</p>} />`
   - conditionnels : `{items.length > 1 ? "s" : ""}` (×2 — accord singulier/pluriel), `{lead ? \` · dernière le …\` : ""}`
   - **NOTABLE** : l'`aside` contient `{items.length}` ; si `items` est vide, l'aside affiche **`"0 actualité publiée"`** — pas de branche masquée.

2. **lead** — une seule publication mise en avant
   - garde : `lead ? (…) : (<EmptyState title="Aucune actualité pour le moment" description="Les nouvelles publiées depuis le back-office apparaîtront ici." />)`
   - littéraux : `"À la une"`, `"Lire l'actualité"`, `"Centre Chrétien Jésus ma Vie — Lubumbashi"` (légende `FeatureImage`)
   - composants : `Link`, `<time dateTime={lead.publishedAt}>`, `FeatureImage variant="wide" src={images.fraternite} caption="…"`
   - image : `images.fraternite` → `/media/ccjv-35.jpeg` (littérale via mock, **pas** une image de la publication)
   - conditionnels : `{lead.description && (…)}`
   - liens : `/publications/${lead.slug}` (×2)
   - **Empty-data** : **implémentée** (`EmptyState`).

3. **list** (avec `listTitle="Autres actualités"`)
   - garde : `others.length > 0 ? (<ul>…</ul>) : (<p className="border-t border-ccjv-line pt-7 text-ccjv-ink-secondary">Aucune autre actualité pour l'instant. Les prochaines publications apparaîtront ici.</p>)`
   - littéraux : `"Autres actualités"` (titre), `"Lire →"` (`aria-hidden`)
   - conditionnels : `{others.map((publication) => …)}`, `const [lead, ...others] = items;`
   - liens : `/publications/${publication.slug}`
   - **Empty-data** : **implémentée** (texte de repli, et non `EmptyState`).

4. **archives** (avec `archivesTitle="Également publié sur le site"`)
   - source : `const elsewhere = allPublications.filter((publication) => publication.category !== "ACTUALITE").slice(0, 4);`
   - littéraux : `"Également publié sur le site"`, `"Enseignement"`, `"Média"`, `"Ressource"` (ternaire de catégorie)
   - conditionnels : **`{publication.type === "PHOTO" && thumbnail ? (<span …><Image …/></span>) : null}`** où `const thumbnail = publication.contentUrl ?? publication.coverImage;` ; `{publication.category === "ENSEIGNEMENT" ? "Enseignement" : publication.category === "MEDIA" ? "Média" : "Ressource"}` ; `{elsewhere.map((publication) => …)}` — **aucune garde `elsewhere.length > 0`**
   - images : `thumbnail` (données API) sur `type === "PHOTO"` uniquement ; `sizes="112px"`, `alt=""`
   - **Empty-data** : NONE sur `elsewhere` — si l'API ne renvoie que des ACTUALITE, `<ul className="grid …">` est rendu **vide**, sous un `<h2>` « Également publié sur le site ». (`ListingPage` rend le titre dès que `archives` est *truthy* ; ici `archives` est un `<ul>` toujours truthy.)
   - **NOTABLE** : le `Band` de `ListingPage` a `tone="tinted"` et un `rule="top"` ; rien ne masque le titre.

5. **related** — `<CrossLinks variant="inline" items={[{ href: "/publications/enseignements", label: "Les enseignements" }, { href: "/publications/mediatheque", label: "La médiathèque" }, { href: "/publications/ressources", label: "Les ressources" }, { href: "/vie-de-leglise/evenements", label: "L'agenda" }]} />`
   - conditionnels : dans `CrossLinks` : `if (items.length === 0) return null;`

- **Hardcodé vs data-driven** : **fortement data-driven** (2 appels API). Littéraux réservés aux libellés, au titre de liste, à la légende de photo (`"Centre Chrétien Jésus ma Vie — Lubumbashi"`) et à la carte de catégorie→libellé (ternaire en ligne). **Les libellés de rubrique sont dupliqués en ternaire ici** alors que `publications/[slug]/page.tsx` utilise un `Record` `categoryLabel` (voir §6.5) — deux mécanismes pour la même traduction.
- **Empty-data behaviour** : `EmptyState` pour la une, texte de repli pour la liste, **NONE** pour les archives.
- **Placeholder / TODO** : aucun.

---

### PAGE: /publications/enseignements  (file: src/app/publications/enseignements/page.tsx, 199 lines)
- **Objectif UX** : écouter les messages — vidéo du dernier enseignement en avant, puis la liste complète.
- **Archétype** : **MediaPage** (`@/components/archetypes/MediaPage`), `rhythm="standard"`.
- **Data sources** : `@/lib/api` → `getPublications({ category: "ENSEIGNEMENT", limit: 50 })` ; `@/data/mock/images` (`photoPool`), `@/data/mock/verses` (`verses.parole`), `@/lib/utils` (`formatLongDate`), `@/lib/seo`. Fonction `async`.
- **Composants importés** : `next/link`, `@/components/composition/HeroCompact`, `@/components/archetypes/MediaPage`, `@/components/editorial/Prose`, `@/components/editorial/MediaFeature`, `@/components/editorial/PhotoGallery`, `@/components/editorial/ScriptureBlock`, `@/components/editorial/ContentPending`, `@/components/editorial/CrossLinks`, `@/components/ui/EmptyState`.

**Slots de l'archétype, en ordre de rendu** (MediaPage : `hero` → `featured` → `listing` → `gallery` → `collections` → `related`) :

1. **hero** — `HeroCompact tone="tinted"` avec `overline="Publications & Médias"`, `title="Enseignements"`, `intro="Les messages donnés à l'assemblée. On vient ici pour écouter : la vidéo passe avant le commentaire, et le visionnage se poursuit sur YouTube."`, `aside={<p …>{items.length} message{items.length > 1 ? "s" : ""} publié{items.length > 1 ? "s" : ""}{featured ? \` · le plus récent le ${formatLongDate(featured.publishedAt)}\` : ""}</p>}`
   - conditionnels : `{items.length > 1 ? "s" : ""}` (×2), `{featured ? … : ""}`

2. **featured**
   - garde : `featured && featuredVideo ? (<MediaFeature variant="hero" … />) : (<EmptyState title="Aucun enseignement pour le moment" description="Les messages publiés depuis le back-office apparaîtront ici." />)`
   - `const featured = items[0];` ; `const featuredVideo = featured?.type === "VIDEO" && featured.contentUrl ? featured.contentUrl : undefined;`
   - conditionnels : `featured?.type === "VIDEO" && featured.contentUrl`
   - **Empty-data** : **implémentée** (`EmptyState`), y compris le cas « il y a un enseignement mais ce n'est pas une vidéo ».
   - **NOTABLE** : `MediaFeature` affiche en dur le sur-titre **`"Dernier enseignement"`** et le libellé **`"Regarder sur YouTube"`** (littéraux du composant) — non paramétrables. Ce même composant est réutilisé sur la médiathèque pour une vidéo qui n'est pas un « enseignement ».

3. **listing** (avec `listingTitle="Toutes les prédications"`)
   - garde : `items.length > 0 ? (<>…</>) : (<EmptyState title="Aucune prédication publiée" description="La liste des messages apparaîtra ici dès la première publication." />)`
   - sous-bloc 1 : `<Prose width="narrow"><p>Un message s'écoute une première fois, puis se reprend. Chaque ligne ci-dessous mène à sa page, où la vidéo peut être regardée sans quitter le site.</p></Prose>`
   - sous-bloc 2 : `<ScriptureBlock variant="inline" context="Pourquoi nous revenons à la Parole" text={verses.parole.text} reference={verses.parole.reference} />` → `verses.parole` = `"Ta parole est une lampe à mes pieds, et une lumière sur mon sentier."` / `"Psaume 119:105"`
   - liste : `{items.map((publication) => …)}` avec `<time dateTime={publication.publishedAt}>`, `{publication.description && (…)}`, `{publication.author ?? "Auteur non renseigné"}`
   - CTA par ligne : `publication.type === "VIDEO" && publication.contentUrl ? (<a href={publication.contentUrl} target="_blank" rel="noopener noreferrer">YouTube<span aria-hidden="true"> ↗</span></a>) : (<span className="font-sans text-[0.85rem] text-ccjv-ink-secondary">Vidéo à venir</span>)`
   - **littéraux de repli** : `"Auteur non renseigné"`, `"Vidéo à venir"`
   - conditionnels : `{publication.description && (…)}`, `{publication.type === "VIDEO" && publication.contentUrl ? … : …}`, **`{items.length === 1 && (<p className="mt-8 …">Les messages plus anciens apparaîtront ici au fur et à mesure de leur publication.</p>)}`**
   - **NOTABLE — promesse non tenue** : le `Prose` affirme « la vidéo peut être regardée **sans quitter le site** », alors que chaque ligne ouvre YouTube en `target="_blank"` et que `MediaFeature` / `publications/[slug]` précisent explicitement « nous n'affichons ici que la vignette, sans lecteur intégré ». **Contradiction texte/implémentation.**

4. **gallery** (avec `galleryTitle="En images"`)
   - `<PhotoGallery variant="strip" images={photoPool.slice(0, 3)} />`
   - data source : **`photoPool` mock** → `/media/ccjv-09.jpeg`, `/media/ccjv-11.jpeg`, `/media/ccjv-12.jpeg`
   - conditionnels : `photoPool.slice(0, 3)` ; dans `PhotoGallery` : `if (images.length === 0) return null;`
   - **Empty-data** : **implémentée** côté composant (`return null`), mais le `h2` « En images » est rendu par `MediaPage` car le `<PhotoGallery>` est truthy ⇒ **titre seul si le pool était vide**.

5. **collections** (avec `collectionsTitle="Séries et thèmes"`)
   - contenu : **`ContentPending`** — `what="Séries et thèmes des prédications"`, `hint="Les publications de cette rubrique ne comportent aujourd'hui ni série, ni thème, et aucune durée de message n'est renseignée dans les données. Ces informations restent à fournir pour regrouper les prédications et afficher leur durée."`
   - **PLACEHOLDER VISIBLE** : rend littéralement `TODO — Séries et thèmes des prédications à fournir`.
   - conditionnels : aucun

6. **related**
   - littéraux : `"Continuer"`, `"Ce qui accompagne un message"`
   - `<CrossLinks items={related} variant="list" />` avec la constante locale `related: CrossLink[]` → `"La médiathèque"`, `"Les ressources"`, `"Les actualités"`

- **Hardcodé vs data-driven** : **data-driven** pour les contenus (API) ; littéraux pour héros, sur-titres, replis et prose ; **mock `photoPool`** pour la galerie (indépendante de toute publication) ; **`verses.parole`** pour l'écriture.
- **Empty-data behaviour** : la plus fournie du pôle (`EmptyState` ×2, `items.length === 1`, `"Auteur non renseigné"`, `"Vidéo à venir"`, `PhotoGallery return null`).
- **Placeholder / TODO** : **1 `ContentPending` visible** (« Séries et thèmes »). Plus **6 littéraux de repli** dont `"Auteur non renseigné"` et `"Vidéo à venir"` affichés tels quels à l'utilisateur.
- **INCOHÉRENCE** : prose promettant une lecture sans quitter le site alors que tout ouvre YouTube.

---

### PAGE: /publications/mediatheque  (file: src/app/publications/mediatheque/page.tsx, 177 lines)
- **Objectif UX** : revoir — une vidéo de message en avant, une galerie photo, des albums.
- **Archétype** : **MediaPage**, `rhythm="standard"`. **Le slot `listing` n'est pas passé.**
- **Data sources** : `@/lib/api` → `getPublications({ category: "MEDIA", limit: 50 })`, `getPublications({ category: "ENSEIGNEMENT", limit: 1 })` ; `@/data/mock/images` (`images`, `photoPool`), `@/lib/utils` (`formatLongDate`), `@/lib/seo`. Fonction `async`.
- **Composants importés** : `next/image`, `next/link`, `@/components/composition/HeroImmersive`, `@/components/archetypes/MediaPage`, `@/components/editorial/Prose`, `@/components/editorial/MediaFeature`, `@/components/editorial/PhotoGallery`, `@/components/editorial/CrossLinks`, `@/components/ui/EmptyState`.

**Slots de l'archétype, en ordre de rendu** :

1. **hero** — `<HeroImmersive align="center" overline="Publications & Médias" title="Médiathèque" text="Ce que nous avons vécu, gardé en images. Une communauté se souvient aussi par ce qu'elle a vu — et ces images sont faites pour être revues, pas seulement conservées." image={images.communaute} caption="Centre Chrétien Jésus ma Vie — Lubumbashi" />`
   - image : `images.communaute` → `/media/ccjv-30.jpeg`
   - conditionnels : dans `HeroImmersive` : `align === "center" ? "bg-ccjv-black/62" : "…"`, `{text && (…)}`, `{caption && (…)}`, `{children && (…)}`
   - **NOTABLE** : `align="center"` change le voile (aplat `bg-ccjv-black/62` au lieu d'un dégradé) — seule page à utiliser cette variante.

2. **featured**
   - contenu : `<Prose className="mb-14 max-w-[62ch]" large><p>La médiathèque rassemble deux manières de revoir : la vidéo d'un message, et les albums photographiques publiés après un moment vécu ensemble.</p></Prose>` puis conditionnel
   - garde : `latestVideo && videoUrl ? (<MediaFeature variant="hero" … />) : (<EmptyState title="Aucune vidéo pour le moment" description="Les vidéos publiées depuis le back-office apparaîtront ici." />)`
   - `const latestVideo = teachings[0];` ; `const videoUrl = latestVideo?.type === "VIDEO" && latestVideo.contentUrl ? latestVideo.contentUrl : undefined;`
   - conditionnels : `latestVideo?.type === "VIDEO" && latestVideo.contentUrl`
   - **Empty-data** : **implémentée** — mais le `Prose` reste affiché **au-dessus** de l'`EmptyState` ⇒ **« Aucune vidéo pour le moment » sous un paragraphe qui annonce une vidéo**.

3. **listing** — **NON FOURNI** ⇒ bandeau non rendu (pas de titre de liste sur cette page).

4. **gallery** (avec `galleryTitle="Galerie"`)
   - `<PhotoGallery variant="mosaic" images={photoPool.slice(0, 5)} />` puis `<PhotoGallery variant="columns" className="mt-16 lg:mt-20" images={photoPool.slice(5, 11)} />`
   - data source : **`photoPool` mock** (15 entrées) → mosaic : `/media/ccjv-09`, `-11`, `-12`, `-15`, `-16` ; columns : `-17`, `-23`, `-25`, `-28`, `-31`, `-32`
   - conditionnels : `photoPool.slice(0, 5)` et `photoPool.slice(5, 11)` ; dans `PhotoGallery`, `if (images.length === 0) return null;`, puis `const [lead, ...rest] = images; const supporting = rest.slice(0, 4);`
   - **NOTABLE** : ces 11 photos sont **les mêmes fichiers mock que sur `/publications/enseignements` (3 d'entre eux) et `[slug]`** — la galerie n'a aucun lien avec les albums publiés listés juste en dessous. Aucune légende (`captions` non passé).
   - **NOTABLE** : `MediaPage` rend ce slot en `tone="dark"` avec un `h2` en `text-ccjv-cream` — c'est la seule section sombre de la page.

5. **collections** (avec `collectionsTitle="Albums publiés"`)
   - garde : `albums.length > 0 ? (<ul>…</ul>) : (<EmptyState title="Aucun album publié" description="Les albums publiés depuis le back-office apparaîtront ici." />)`
   - dérivation : `const albums = media.flatMap((publication) => { const image = publication.contentUrl ?? publication.coverImage; if (!image) return []; return [{ id, title, slug, description, publishedAt, image }]; });`
   - conditionnels : `if (!image) return [];` (filtre), `{album.description && (…)}`, `{albums.map((album) => …)}`
   - images : `album.image` (donnée API), `alt=""`
   - liens : `/publications/${album.slug}` ; libellés `"Ouvrir l'album →"`, `<time dateTime={album.publishedAt}>`
   - **Empty-data** : **implémentée** (`EmptyState`) — y compris le cas où des publications MEDIA existent mais **aucune** n'a d'image (`flatMap → []`).

6. **related**
   - littéraux : `"Continuer"`, `"Retrouver ce qui a été dit et partagé"`
   - `<CrossLinks variant="inline" items={[… 4 rubriques …]} />`

- **Hardcodé vs data-driven** : vidéo et albums = **API** ; galerie = **`photoPool` mock** (11 photos fixes, sans légende, sans rapport avec les albums) ; héros = **`images.communaute`** mock.
- **Empty-data behaviour** : bonne (`EmptyState` ×2 + filtre `flatMap`). Point faible : le `Prose` inconditionnel au-dessus de l'`EmptyState` vidéo.
- **Placeholder / TODO** : aucun `ContentPending`. **Le décalage galerie mock ↔ albums API n'est signalé nulle part dans l'interface.**

---

### PAGE: /publications/ressources  (file: src/app/publications/ressources/page.tsx, 228 lines)
- **Objectif UX** : donner des guides et plans de lecture à lire en ligne, expliquer comment s'en servir.
- **Archétype** : **ListingPage**, `rhythm="dense"`.
- **Data sources** : `@/lib/api` → `getPublications({ category: "RESSOURCE", limit: 50 })` ; `@/data/mock/images` (`images`), `@/lib/utils` (`formatLongDate`), `@/lib/seo`. Fonction `async`.
- **Constantes locales** : `steps: Step[]` (3, lignes 21-34), `related: CrossLink[]` (3).
- **Composants importés** : `next/link`, `@/components/composition/HeroPractical`, `@/components/archetypes/ListingPage`, `@/components/editorial/FeatureImage`, `@/components/editorial/StepsList`, `@/components/editorial/CrossLinks`, `@/components/ui/EmptyState`.

**Slots de l'archétype, en ordre de rendu** :

1. **header** — `HeroPractical` avec `facts` (4 entrées)
   - littéraux : `"Publications & Médias"`, `"Ressources"`, `"Des outils simples pour avancer : guides d'étude et plans de lecture, à lire seul ou en petit groupe. Rien à imprimer, rien à télécharger."`
   - `facts` littéraux : `{ label: "Ressources disponibles", value: \`${items.length}\`, hint: "Publiées sur le site à ce jour." }`, `{ label: "Format", value: "Textes à lire en ligne", hint: "Aucun document à télécharger n'est proposé pour ces ressources." }`, `{ label: "Public", value: "Seul ou en groupe", hint: "Ces textes peuvent servir à une lecture personnelle comme à un échange à plusieurs." }`, `{ label: "Dernière parution", value: lead ? formatLongDate(lead.publishedAt) : "À venir", hint: "Les ressources s'ajoutent au fil des publications." }`
   - conditionnels : `lead ? formatLongDate(lead.publishedAt) : "À venir"` ; dans `HeroPractical` : `{intro && …}`, `{aside && …}`, `{facts && facts.length > 0 && (…)}`
   - **NOTABLE** : la carte « Ressources disponibles » affiche `${items.length}` **sans unité ni accord** (un nombre nu), contrairement à `actualites`/`enseignements` qui accordent `"actualité(s)"`/`"message(s)"`.

2. **lead**
   - garde : `lead ? (<article>…) : (<EmptyState title="Aucune ressource pour le moment" description="Les ressources publiées depuis le back-office apparaîtront ici." />)`
   - `const lead = items[0];`
   - littéraux : `"Ressource principale"`, `"Consulter la ressource"`, `"Publiée le"`, `"Rubrique"`, `"Ressources"`, `"Lecture"`, `"Directement en ligne"`
   - conditionnels : `{lead.description && (…)}` ; `<time dateTime={lead.publishedAt}>`
   - liens : `/publications/${lead.slug}` (×2)
   - **Empty-data** : **implémentée** (`EmptyState`).
   - **NOTABLE** : la `<dl>` latérale affiche `Rubrique : Ressources` et `Lecture : Directement en ligne` en **littéraux purs** — aucune donnée, aucune branche.

3. **list** (avec `listTitle="Autres ressources"`)
   - garde : `others.length > 0 ? (<ul>…) : (<p className="border-t border-ccjv-line pt-7 text-ccjv-ink-secondary">Les prochaines ressources apparaîtront ici.</p>)`
   - `const others = items.slice(1);`
   - littéraux : `"Autres ressources"`, `"Consulter →"` (`aria-hidden`), `"Les prochaines ressources apparaîtront ici."`
   - conditionnels : `{others.map((item) => …)}`, `{item.description && (…)}`
   - **Empty-data** : **implémentée** (texte de repli).

4. **archives** (avec `archivesTitle="Comment utiliser ces ressources"`)
   - contenu : `FeatureImage src={images.predication} variant="wide"` + `<p>Vous cherchez une ressource précise, ou vous souhaitez en proposer une ? Écrivez-nous : les ressources publiées ici viennent de la vie de l'église.</p>` + `<StepsList variant="vertical" steps={steps} />`
   - data source : `images.predication` → `/media/ccjv-11.jpeg` ; **`steps`, tableau littéral local** → `"Choisir selon le moment"`, `"Avancer à son rythme"`, `"En parler avec d'autres"` + textes
   - conditionnels : aucun dans le slot ; dans `StepsList` : `{steps.map((step, index) => …)}` avec `{index + 1}`
   - **NOTABLE — incohérence de slot** : le slot **`archives`** (« Entrées plus anciennes, traitées différemment », `Band tone="tinted"`) est détourné pour un **mode d'emploi** — l'archétype `ListingPage` documente ce slot comme « entrées plus anciennes ». Le titre `archivesTitle="Comment utiliser ces ressources"` est rendu en `text-ccjv-ink-secondary uppercase`, donc visuellement distinct du `listTitle` vert.

5. **related**
   - littéraux : `"Continuer"`, `"Autour des ressources"`
   - `<CrossLinks items={related} variant="list" />` → `"Les enseignements"`, `"La médiathèque"`, `"Les actualités"`

- **Hardcodé vs data-driven** : contenus = **API** ; mode d'emploi (`steps`) et prose de l'`archives` = **littéraux** ; image = **mock** (`images.predication`).
- **Empty-data behaviour** : 3 branches explicites (`EmptyState` + 2 textes de repli) + `HeroPractical` masque les faits si vides. **Aucune branche vide non traitée** ; la mention « À venir » couvre le cas `lead === undefined`.
- **Placeholder / TODO** : aucun `ContentPending`. `"À venir"` et `"Les prochaines ressources apparaîtront ici."` jouent ce rôle de manière assumée.

---

### PAGE: /publications/[slug]  (file: src/app/publications/[slug]/page.tsx, 377 lines)
- **Objectif UX** : lire une publication (article, album photo ou message vidéo) dans une colonne de lecture, avec repères latéraux.
- **Archétype** : **DetailPage** (`@/components/archetypes/DetailPage`), `rhythm="standard"`.
- **Data sources** : `@/lib/api` → `getPublication(slug)`, `getPublications({ category, limit: 8 })` **ou** `getPublications({ type, limit: 8 })` ; `@/data/mock/images` (`galleryImages`, `images`), `@/lib/utils` (`getYouTubeId`, `formatLongDate`), `@/types`, `@/lib/seo`.
- **Composants importés** : `next/link`, `notFound`, `@/components/composition/HeroPhoto`, `@/components/archetypes/DetailPage`, `@/components/editorial/Prose`, `@/components/editorial/KeyFacts`, `@/components/editorial/PhotoGallery`, `@/components/editorial/ContentPending`, `@/components/editorial/CrossLinks`, `@/components/ui/Badge`, `@/components/ui/Button`, `@/components/shared/YouTubeThumb`.
- **Génération statique / params dynamiques** :
  - **`generateStaticParams` : OUI** (lignes 69-81) — `const publications = await getPublications({ limit: 100 }); return publications.map((publication) => ({ slug: publication.slug }));`, `try/catch` → `[]` + `console.warn("[publications] generateStaticParams : API indisponible, repli sur une liste vide", error)`.
  - **`generateMetadata` : OUI** — `getPublication(slug)`, `{}` si absent ; `description: publication.description ?? "Publication du Centre Chrétien Jésus ma Vie."`.
  - **`dynamicParams` : NON déclaré** → défaut Next.js `true`.
  - `if (!publication) notFound();`.

**Cartographies et helpers littéraux** :
```ts
const typeLabel: Record<Publication["type"], string> = { VIDEO: "Enseignement", PHOTO: "Album photo", TEXTE: "Texte" };
const categoryLabel: Record<NonNullable<Publication["category"]>, string> = { ACTUALITE: "Actualité", ENSEIGNEMENT: "Enseignement", MEDIA: "Média", RESSOURCE: "Ressource" };
const fallbackImage: Record<Publication["type"], string> = { VIDEO: images.predication, PHOTO: images.assemblee, TEXTE: images.assemblee };
const IMAGE_FILE_PATTERN = /\.(?:avif|gif|jpe?g|png|webp)(?:\?.*)?$/i;
function isImageSource(url?: string): boolean { … }
```
**NOTABLE** : `typeLabel.VIDEO = "Enseignement"` ⇒ un badge « Enseignement » pour **toute** vidéo, y compris une vidéo classée `MEDIA`. Le `type` et la `category` peuvent donc produire deux fois le même libellé sur la même fiche.

**Slots de l'archétype, en ordre de rendu** (DetailPage : `media` → `summary` → `body`(+`aside`) → `gallery` → `related`) :

1. **media** — `<HeroPhoto overline={typeLabel[publication.type]} title={publication.title} image={heroImage} height="normal" caption={[publication.category ? categoryLabel[publication.category] : typeLabel[publication.type], formatLongDate(publication.publishedAt)].join(" · ")} />`
   - `const isPhoto = publication.type === "PHOTO";`
   - `const imageSource = [contentUrl, publication.coverImage].find(isImageSource);`
   - `const heroImage = imageSource ?? fallbackImage[publication.type];`
   - images : donnée API (avec reconnaissance Supabase Storage `/storage/v1/object/public/`), **repli mock** `images.predication` → `/media/ccjv-11.jpeg` (VIDEO) ou `images.assemblee` → `/media/ccjv-09.jpeg` (PHOTO/TEXTE)
   - conditionnels : `if (!url) return false; if (url.startsWith("/")) return true; if (getYouTubeId(url)) return false;` puis regex
   - **Empty-data** : **implémentée** — repli par type, jamais d'image manquante.

2. **summary**
   - littéraux : aucun texte propre (les libellés viennent des `Record`)
   - composants : `Badge variant="outline"` ×2, `<time dateTime={publication.publishedAt}>`
   - conditionnels : `{publication.category && (<Badge variant="outline">{categoryLabel[publication.category]}</Badge>)}`, `{publication.author && <span>{publication.author}</span>}`
   - **NOTABLE — duplication** : le titre `publication.title` est affiché **deux fois** : dans le `h1` de `HeroPhoto` (slot `media`) **et** dans le `h2` de `summary` (`{publication.title}`, ligne 173).

3. **body** (+ `aside`)
   - dérivation : `const paragraphs = publication.body && publication.body.length > 0 ? publication.body : publication.description ? [publication.description] : [];`
   - garde : `paragraphs.length > 0 ? (<Prose large width="narrow">{paragraphs.map((paragraph) => (<p key={paragraph}>{paragraph}</p>))}</Prose>) : (<ContentPending what="Corps de cette publication" hint="La publication ne contient ni texte de lecture, ni résumé : le contenu rédigé reste à fournir." />)`
   - **PLACEHOLDER VISIBLE** : `TODO — Corps de cette publication à fournir`.
   - `aside` : `<p>Repères</p>` + `KeyFacts variant="pairs"` avec `items` construits dynamiquement :
     ```ts
     [
       { label: "Type", value: typeLabel[publication.type] },
       { label: "Rubrique", value: publication.category ? categoryLabel[publication.category] : "Publication" },
       { label: "Publié le", value: formatLongDate(publication.publishedAt) },
       ...(publication.author ? [{ label: "Auteur", value: publication.author }] : []),
     ]
     ```
   - puis dans l'`aside`, bloc « Contenus liés » : `{related.length > 0 && (<div><p>Contenus liés</p><ul>…</ul></div>)}`
   - conditionnels : `publication.body && publication.body.length > 0`, `paragraphs.length > 0`, `publication.author ? … : []`, `{related.length > 0 && (…)}`, `{related.map((item) => …)}` ; dans `DetailPage` : `{body && (…)}` et `{aside && (<div className="lg:col-span-4 lg:col-start-9">…)}` (**l'aside n'est rendu que si `body` est aussi fourni**, puisqu'il est imbriqué dans le même `Band`)
   - **NOTABLE — redondance** : les **contenus liés apparaissent deux fois** sur la page : une première liste dans l'`aside` (donc en colonne latérale) et une seconde dans le slot `related` (bloc « À découvrir aussi » en fin de page). Les deux listes itèrent le **même** tableau `related` et pointent vers les mêmes URL, avec des mises en forme différentes.
   - **Empty-data** : `body` → `ContentPending` ; `aside` → masqué si `related` vide (mais `KeyFacts` reste, car toujours non vide).

4. **gallery** — ternaire à 3 branches
   ```tsx
   gallery={
     isPhoto ? ( "Galerie de l'album" + <PhotoGallery variant="mosaic" images={gallery} /> )
     : publication.type === "VIDEO" && contentUrl ? ( bloc vidéo YouTube )
     : undefined
   }
   ```
   - dérivation : `const gallery = [ ...(imageSource ? [imageSource, ...galleryImages.filter((src) => src !== imageSource)] : galleryImages) ].slice(0, 5);`
   - `const youtubeId = getYouTubeId(contentUrl);`
   - littéraux : `"Galerie de l'album"`, `"La vidéo"`, `"Le message se regarde sur YouTube : nous n'affichons ici que la vignette, sans lecteur intégré."`, `"Regarder sur YouTube"`, `"Regarder la vidéo sur YouTube"` ; `aria-label={\`Regarder « ${publication.title} » sur YouTube\`}`
   - images : `galleryImages` (**mock**, 10 entrées) mélangées à `imageSource` (donnée) ; vignette YouTube via `YouTubeThumb` (`https://i.ytimg.com/vi/<id>/maxresdefault.jpg` avec repli `hqdefault`)
   - conditionnels : `isPhoto ? … : publication.type === "VIDEO" && contentUrl ? … : undefined`, `{youtubeId && (<YouTubeThumb … />)}`
   - **Empty-data** : **implémentée** — `undefined` pour un `TEXTE` ⇒ bandeau non rendu.
   - **INCOHÉRENCE MAJEURE** : la galerie d'un **album photo** (`isPhoto`) est composée de `[contentUrl, ...galleryImages]` — c'est-à-dire **l'image de la publication suivie de 10 photos mock génériques** (`galleryImages` = `/media/ccjv-09, -11, -12, -15, -23, -25, -28, -32, -37, -40`). **La fiche présente donc comme « Galerie de l'album » des photos sans rapport avec l'album publié**, sans légende ni marqueur, alors que `publication.gallery` (le champ utilisé par les événements) n'est pas lu ici.
   - **NOTABLE** : la branche vidéo affirme « nous n'affichons ici que la vignette, sans lecteur intégré » — cohérent avec l'implémentation (aucune `<iframe>`).

5. **related** (avec `relatedTitle="À découvrir aussi"`)
   - garde : `{related.length > 0 ? (<ul …>) : (<p className="border-t border-ccjv-line pt-7 text-ccjv-ink-secondary">Aucun autre contenu de cette rubrique pour le moment.</p>)}`
   - puis bloc inconditionnel : `"Toutes les rubriques"` + `<CrossLinks variant="inline" items={[Actualités, Enseignements, Médiathèque, Ressources]} />`
   - conditionnels : `related.length > 0 ? … : …`, `{related.map((item) => …)}`, `item.category ? categoryLabel[item.category] : typeLabel[item.type]`
   - dérivation : `const relatedPool = publication.category ? await getPublications({ category: publication.category, limit: 8 }) : await getPublications({ type: publication.type, limit: 8 });` puis `relatedPool.filter((item) => item.id !== publication.id && (item.category === publication.category || item.type === publication.type)).slice(0, 3)`
   - **Empty-data** : **implémentée** (texte de repli).

- **Hardcodé vs data-driven** : **fortement data-driven** (2-3 appels API, helpers de résolution `type`/`category`/image). Points hardcodés : `typeLabel`/`categoryLabel`/`fallbackImage` (littéraux du fichier), **`galleryImages` mock** pour la galerie, textes d'interface, et l'affirmation `"Le message se regarde sur YouTube : nous n'affichons ici que la vignette, sans lecteur intégré."` (vraie dans le code).
- **Empty-data behaviour** : la plus complète des fiches — `ContentPending` pour le corps, `undefined` pour la galerie, textes de repli pour `related`, replis d'image par type.
- **Placeholder / TODO** : **1 `ContentPending` visible** (« Corps de cette publication ») ; **aucun** marqueur sur la galerie mock (le point le plus problématique de la page n'est pas signalé).
- **INCERTAIN** : `publication.coverImage` et `publication.gallery` ne figurent pas dans le type `Publication` de `@/data/mock/publications` (qui ne définit que `contentUrl`) mais sont lus par ce fichier via `PublicationRecord` de `@/lib/api/types` — je n'ai pas audité `src/types/index.ts` (hors périmètre demandé).

---

## 7. Pages transversales

### PAGE: /recherche  (file: src/app/recherche/page.tsx, 168 lines)
- **Objectif UX** : une adresse unique pour retrouver page, événement, département ou publication.
- **Archétype** : **InformationPage** (`@/components/archetypes/InformationPage`), `rhythm="dense"`.
- **Data sources** : `@/lib/nav` (`primaryNav`), **`@/data/mock/events` (`events`)**, **`@/data/mock/departments` (`departments`)**, **`@/data/mock/publications` (`publications`)**, `@/lib/seo`. **Aucun appel `@/lib/api`.**
- **Composants importés** : `@/components/composition/HeroPractical`, `@/components/archetypes/InformationPage`, `@/components/editorial/Prose`, `@/components/editorial/CrossLinks`, `@/features/search/SearchClient` (+ type `SearchEntry`).
- **Fonction `buildIndex(): SearchEntry[]`** (lignes 23-83) — index construit au rendu serveur.

**Slots de l'archétype, en ordre de rendu** (InformationPage : `header` → `context` → `facts` → `photo` → `steps` → `contact` → `related`) :

1. **header** — `HeroPractical` avec `overline="Recherche"`, `title="Trouver un contenu"`, `intro="Une page, un événement, un département, un enseignement : retrouvez rapidement ce que vous cherchez sur le site."` et 3 `facts` :
   - `{ label: "Contenus indexés", value: \`${entries.length} entrées\` }`
   - `{ label: "Types de contenu", value: "Pages, événements, départements, publications" }`
   - `{ label: "Recherche", value: "Immédiate, sans rechargement" }`
   - conditionnels : `${entries.length} entrées` (calculé), `{facts && facts.length > 0 && (…)}` dans le composant

2. **context** — 2 colonnes
   - littéraux : `"Une seule adresse pour tout le site"`, `"La recherche couvre l'ensemble des contenus publiés : les pages de présentation, les rendez-vous de l'église, les départements, ainsi que les actualités, enseignements, médias et ressources."`, `"Si vous ne trouvez pas"`, `"Certains contenus ne sont pas encore publiés — la médiathèque et les ressources s'enrichiront au fil des publications. Si vous cherchez une information précise, écrivez-nous directement : nous vous répondrons."`
   - composants : `Prose className="mt-6" width="narrow"` (×2)
   - conditionnels : aucun

3. **facts** (avec `factsTitle="Rechercher sur le site"`)
   - `<SearchClient entries={entries} />` (`@/features/search/SearchClient`, `"use client"`)
   - data source : `entries` = index **construit depuis les mocks** (voir ci-dessous)
   - conditionnels (dans `SearchClient`) : `if (q.length < 2) return [];`, `const hasQuery = query.trim().length >= 2;`, `{hasQuery && (results.length > 0 ? (<ul>…) : (<p role="status">Aucun résultat pour «&nbsp;{query.trim()}&nbsp;». Essayez un autre mot, ou parcourez nos rubriques depuis le menu.</p>))}`, `{entry.description && (…)}`, `.slice(0, 30)`
   - littéraux du composant : `"Que cherchez-vous ?"`, `"Événements, départements, enseignements…"`, `"Saisissez au moins deux caractères. {entries.length} contenus sont référencés sur le site."`, `"Aucun résultat pour «…»"`
   - **Empty-data** : **implémentée** — message `role="status"` si aucun résultat ; `entries` vide ⇒ « 0 contenus sont référencés ».

**Contenu de l'index `buildIndex()`** (lignes 23-83) :
- `primaryNav` de `@/lib/nav` : pour chaque `item` → `if (item.href) entries.push({ href, title: item.label, description: item.description ?? "", kind: "Page" })` ; puis `item.children ?? []` → même push, `kind: "Page"`
- `events` (mock) → `href: \`/vie-de-leglise/evenements/${event.slug}\``, `title: event.title`, `description: event.excerpt ?? event.description ?? ""`, `kind: "Événement"`
- `departments` (mock) → `href: \`/organisation#${department.slug}\``, `title: department.name`, `description: department.tagline ?? department.description ?? ""`, `kind: "Département"`
- `publications` (mock) → `href: \`/publications/${publication.slug}\`` + `kind` via ternaire :
  ```ts
  const kind = publication.category === "ENSEIGNEMENT" ? "Enseignement"
    : publication.category === "RESSOURCE" ? "Ressource"
    : publication.category === "MEDIA" ? "Média" : "Actualité";
  ```
- littéraux de `kind` : `"Page"`, `"Événement"`, `"Département"`, `"Enseignement"`, `"Ressource"`, `"Média"`, `"Actualité"`

4. **photo** — **NON FOURNI** ⇒ bandeau non rendu.
5. **steps** — **NON FOURNI** ⇒ bandeau non rendu.
6. **contact** — **NON FOURNI** ⇒ bandeau non rendu.
7. **related** — `<CrossLinks variant="list" items={[{ href: "/vie-de-leglise/ou-nous-trouver", label: "Où nous trouver", description: "Adresse, horaires et contact." }, { href: "/publications/actualites", label: "Actualités", description: "Les nouvelles et annonces de l'église." }, { href: "/qui-sommes-nous", label: "Qui sommes-nous", description: "Notre histoire, notre foi et notre vision." }]} />`

- **Hardcodé vs data-driven** : **index construit sur les MOCKS**, pas sur l'API.
- **INCOHÉRENCE MAJEURE (source dupliquée)** : `/recherche` indexe `@/data/mock/events`, `@/data/mock/departments`, `@/data/mock/publications` — alors que **les pages correspondantes lisent l'API** (`/vie-de-leglise/evenements` → `getEvents`, `/organisation` → `getDepartments`, `/publications/*` → `getPublications`). **La recherche peut donc renvoyer des URL dont le slug n'existe plus côté API (⇒ 404 via `notFound()`), ou manquer tout contenu créé en back-office.** Les mêmes mocks alimentent `src/app/sitemap.ts` : la recherche et le sitemap sont les **deux seuls consommateurs** de `mock/events`, `mock/departments`, `mock/publications`.
- **Empty-data behaviour** : branchée sur l'index (message de non-résultat) ; mais l'index n'est **jamais vide par construction** (mocks non vides) ⇒ le cas « index vide » n'est pas exerçable.
- **Placeholder / TODO** : aucun `ContentPending`. Le texte du `context` **anticipe la vacuité** : `"Certains contenus ne sont pas encore publiés — la médiathèque et les ressources s'enrichiront au fil des publications."` — note : les mocks `publications` contiennent pourtant déjà 2 RESSOURCE et 4 MEDIA, donc cette phrase contredit l'état actuel de l'index de recherche (qui, lui, les trouve).

---

### PAGE: /accessibilite  (file: src/app/accessibilite/page.tsx, 50 lines)
- **Objectif UX** : informer sur l'engagement d'accessibilité.
- **Archétype** : **`LegalPage`** (`@/components/shared/LegalPage`) — qui compose `PageHeader` + `Section` + `VerseSection`.
- **Data sources** : `@/components/shared/LegalPage`, `@/lib/seo` (`pageMetadata`). Le contenu est un **littéral de props**.
- **Sections, en ordre de rendu** (via `LegalPage`) :
  1. **`PageHeader`** — `overline="Informations légales"`, `title="Accessibilité numérique"`, `description="Nous voulons que ce site soit utilisable par tous, y compris avec un lecteur d'écran, au clavier ou sur une connexion lente."`
  2. **`Section`** avec `"Dernière mise à jour : {updatedAt}"` → `"Dernière mise à jour : Septembre 2026"` et `{sections.map((section, index) => …)}` — 4 sections :
     - `"Notre engagement"` — `"Le site vise la conformité au niveau AA des Règles pour l'accessibilité des contenus web (WCAG 2.2)."`, `"L'accessibilité est intégrée dès la conception : structure sémantique, contrastes vérifiés, navigation clavier complète, focus visible et textes alternatifs."`
     - `"Ce qui est déjà en place"` — `"Une structure de titres cohérente et des repères de navigation (landmarks) sur toutes les pages."`, `"Un lien d'évitement « Aller au contenu », une navigation entièrement utilisable au clavier, et la fermeture du menu par la touche Échap."`, `"Le respect du réglage système « réduire les animations » : les mouvements sont neutralisés, le contenu reste intégralement accessible."`, `"Des images décoratives marquées comme telles, afin de ne pas surcharger la lecture par un lecteur d'écran."`
     - `"Connexions lentes"` — `"Le site est conçu pour rester rapide et léger, afin d'être consultable même avec une connexion instable : images optimisées, chargement différé des médias et très peu de JavaScript."`
     - `"Signaler un problème"` — `"Si vous rencontrez une difficulté d'accès à un contenu, décrivez-nous la page et le problème rencontré : nous nous engageons à corriger et, si besoin, à vous transmettre l'information par un autre moyen."`
  3. **`VerseSection`** (imposé par `LegalPage`) : `context="Marcher dans la vérité"`, `text={verses.parole.text}`, `reference={verses.parole.reference}`, `tone="dark"` → `"Ta parole est une lampe à mes pieds, et une lumière sur mon sentier."` / `"Psaume 119:105"`
- **Conditionnels** : dans `LegalPage` : `{sections.map((section, index) => (…))}` avec `aria-labelledby={\`sec-${index}\`}` et `{section.paragraphs.map((paragraph) => …)}` — **aucune garde sur tableau vide**.
- **Empty-data** : NONE — `sections` est un littéral de props non vide ; si `paragraphs` était `[]`, le `<div className="mt-4 flex flex-col gap-3">` serait vide.
- **NOTABLE — affirmation vérifiable dans le code** : `"Un lien d'évitement « Aller au contenu »"` → **existe** (`layout.tsx:53-55`). `"la fermeture du menu par la touche Échap"` → **existe** (`DepartmentModal.tsx` `if (e.key === "Escape")`). `"Des images décoratives marquées comme telles"` → **majoritairement vrai** (`alt=""` sur la plupart des `Image`), **mais pas partout** : `qui-sommes-nous` ligne 70 utilise `alt="Pasteur Manasse Mwamba, visionnaire CCJV"`, `DepartmentModal` ligne 231 `alt={\`${activeDept.name} — photo ${gIdx + 1}\`}`, et les photos de visages portent `alt={face.name}` / `alt={leadPastor.name}`. `"très peu de JavaScript"` → **INCERTAIN** (des composants `"use client"` : `CommunityFaces`, `ParallaxImage`, `Reveal`, `Breadcrumbs`, `SearchClient`, `PrayerRequestForm`, `OrganisationExplorer`, `DepartmentModal`, `YouTubeThumb` — je n'ai pas mesuré le bundle).
- **Placeholder / TODO** : aucun.

---

### PAGE: /conditions  (file: src/app/conditions/page.tsx, 49 lines)
- **Objectif UX** : encadrer l'usage du site.
- **Archétype** : **`LegalPage`**.
- **Data sources** : littéral de props ; `@/lib/seo`.
- **Sections** :
  1. `PageHeader` — `"Informations légales"`, `"Conditions d'utilisation"`, `"Les règles simples qui encadrent l'usage de ce site."`, `updatedAt="Septembre 2026"`
  2. `Section` — 4 sections :
     - `"Objet du site"` — `"Ce site a pour objet de présenter le Centre Chrétien Jésus ma Vie, ses activités, ses enseignements et ses informations pratiques."`, `"Il ne constitue ni un espace membre, ni un service d'adhésion, ni une plateforme de paiement."`
     - `"Usage autorisé"` — `"Vous pouvez consulter, partager et citer les contenus du site à des fins personnelles ou non commerciales, en mentionnant leur source."`, `"Toute utilisation commerciale, toute reproduction intégrale ou toute modification des contenus requiert une autorisation écrite."`
     - `"Contenus et liens externes"` — `"Les vidéos d'enseignement sont hébergées sur des plateformes externes. Nous ne maîtrisons ni leur disponibilité ni les recommandations qu'elles affichent."`, `"Les liens externes sont fournis pour votre commodité et n'impliquent aucune approbation de leur contenu."`
     - `"Exactitude des informations"` — `"Les informations pratiques (horaires, lieux, programmes) sont publiées de bonne foi et peuvent évoluer. En cas de doute, contactez-nous directement."`
  3. `VerseSection` (dark, `verses.parole`)
- **Empty-data** : NONE (littéraux).
- **NOTABLE — contradiction avec l'implémentation** : la phrase `"Les vidéos d'enseignement sont hébergées sur des plateformes externes."` est **exacte** (`YouTubeThumb`, liens `target="_blank"`, aucun `<iframe>`) ; `"Il ne constitue ni […] ni une plateforme de paiement."` est **exact** (aucun moyen de paiement sur `/vie-de-leglise/faire-un-don`). **En revanche**, `"En cas de doute, contactez-nous directement."` n'est adossé à aucun lien de contact sur la page — le seul « contact » du site est `site.whatsappHref`, absent de `LegalPage`.
- **Placeholder / TODO** : aucun.

---

### PAGE: /confidentialite  (file: src/app/confidentialite/page.tsx, 56 lines)
- **Objectif UX** : expliquer ce qui est collecté et comment.
- **Archétype** : **`LegalPage`**.
- **Sections** :
  1. `PageHeader` — `"Informations légales"`, `"Politique de confidentialité"`, `"Nous collectons le strict minimum, et uniquement ce qui sert à vous accueillir."`, `updatedAt="Septembre 2026"`
  2. `Section` — 5 sections :
     - `"Principe général"` — `"Le site public du Centre Chrétien Jésus ma Vie est conçu pour être consulté librement, sans création de compte et sans collecte de données superflues."`, `"Aucun espace membre, aucune inscription et aucun paiement en ligne ne sont proposés à ce jour."`
     - `"Données susceptible d'être traitées"` (sic — **faute d'accord : « susceptible » au singulier pour « Données »**) — `"Si vous nous contactez par WhatsApp ou par nos réseaux sociaux, les informations que vous transmettez volontairement (nom, message, demande de prière) sont utilisées uniquement pour vous répondre."`, `"Les demandes de prière sont traitées de manière confidentielle par l'équipe concernée et ne sont pas publiées sans votre accord explicite."`
     - `"Mesure d'audience et cookies"` — `"Aucun cookie publicitaire ni traceur tiers n'est déposé sur ce site en dehors des cookies techniques strictement nécessaires à son fonctionnement."`, `"Les vidéos sont hébergées sur des plateformes externes : la consultation d'une vidéo vous conduit sur le site de cette plateforme, soumise à sa propre politique de confidentialité."`
     - `"Témoignages et photographies"` — `"Les témoignages et les photographies de personnes ne sont publiés qu'avec leur accord préalable."`, `"Toute personne peut demander le retrait d'un contenu la concernant en nous contactant."`
     - `"Vos droits"` — `"Vous pouvez demander à consulter, corriger ou supprimer les informations vous concernant en nous écrivant."`
  3. `VerseSection` (dark, `verses.parole`)
- **Empty-data** : NONE (littéraux).
- **NOTABLE — contradiction avec `PrayerRequestForm`** : la politique affirme que les demandes de prière sont « utilisées uniquement pour vous répondre » et traitée confidentiellement. Or le formulaire **ne transmet rien** (voir §4, `PrayerRequestForm`) : il affiche une réussite simulée. La page ne mentionne **pas** que le formulaire est non fonctionnel.
- **NOTABLE — exactitude partielle** : `"Aucun cookie publicitaire ni traceur tiers"` est **cohérent** avec le code (aucun script analytics trouvé ; seul `sessionStorage` est utilisé, dans `layout.tsx`, pour le rideau d'intro). Mais des ressources tierces sont bien appelées : `https://i.ytimg.com/vi/...` (vignettes YouTube, requête réseau vers un domaine tiers à chaque vignette) — non mentionné.
- **Placeholder / TODO** : aucun. Faute de frappe : `"Données susceptible d'être traitées"`.

---

### PAGE: /mentions-legales  (file: src/app/mentions-legales/page.tsx, 54 lines)
- **Objectif UX** : identifier l'éditeur et l'hébergeur.
- **Archétype** : **`LegalPage`**.
- **Sections** :
  1. `PageHeader` — `"Informations légales"`, `"Mentions légales"`, `"Informations relatives à l'éditeur du site et à son hébergement."`, `updatedAt="Septembre 2026"`
  2. `Section` — 4 sections :
     - `"Éditeur du site"` — `"Le présent site est édité par le Centre Chrétien Jésus ma Vie (CCJV), église locale établie à Lubumbashi, en République démocratique du Congo."`, **`"Adresse : information à compléter. Contact : information à compléter."`**, `"Le contenu éditorial du site est produit et validé par la direction de l'église."`
     - `"Hébergement"` — `"Le site public est hébergé sur une infrastructure cloud (frontend et API séparés)."`, **`"Les coordonnées précises de l'hébergeur seront complétées avant la mise en production."`**
     - `"Propriété intellectuelle"` — `"Les textes, photographies et éléments graphiques présents sur ce site sont la propriété du Centre Chrétien Jésus ma Vie, sauf mention contraire."`, `"Toute reproduction sans autorisation écrite est interdite."`
     - `"Signalement"` — `"Pour signaler une erreur, un contenu inapproprié ou un problème d'accessibilité, vous pouvez nous écrire directement depuis la page Contact."`
  3. `VerseSection` (dark, `verses.parole`)
- **Empty-data** : NONE (littéraux).
- **PLACEHOLDER EXPLICITE** : le fichier porte un commentaire JSDoc :
  > `⚠️ Contenu de démonstration : les informations d'éditeur et d'hébergeur doivent être complétées et vérifiées par CCJV avant mise en production.`
  Et **deux chaînes sont rendues visibles à l'utilisateur** : `"Adresse : information à compléter. Contact : information à compléter."` et `"Les coordonnées précises de l'hébergeur seront complétées avant la mise en production."`
- **NOTABLE — contradiction interne** : la section `"Éditeur du site"` déclare l'adresse « à compléter » alors que l'adresse **est** disponible et affichée ailleurs (`site.address` = `"Quartier Hewa Bora, Avenue Djoloko Lubumbashi"`, `site.addressLines`, et `/vie-de-leglise/ou-nous-trouver`). `site` n'est pas importé dans ce fichier.
- **NOTABLE — lien inexistant** : `"vous pouvez nous écrire directement depuis la page Contact"` — **il n'existe aucune route `/contact`** dans `src/app/` (aucun `contact/page.tsx`). La phrase renvoie donc à une page qui n'existe pas. Le seul canal réel serait `site.whatsappHref`, non mentionné.
- **Placeholder / TODO** : **2 chaînes « à compléter » rendues en production**, plus un avertissement en commentaire de code.

---

## 8. ROUTE TABLE

Colonnes : `path` | `file` | `archetype` | `#sections` | `data sources` | `route dynamique` | `generateStaticParams / dynamic params`.

| # | path | fichier | archétype | # sections | sources de données | dynamique | generateStaticParams / dynamicParams |
|---|---|---|---|---|---|---|---|
| 1 | `/` | `src/app/page.tsx` | none/raw | **12** | `@/lib/api` (`getEvents`, `getPublications`, `getCommunityFaces`, `getDepartments`) ; mocks `images`, `site` (`socials`, `weeklyRhythm`), `verses` ; `@/lib/seo` | non | non / non |
| 2 | `/qui-sommes-nous` | `src/app/qui-sommes-nous/page.tsx` | none/raw (**NarrativePage NON utilisée** malgré le commentaire) | **14** | mocks `images`, `site`, `verses`, **`community` (`communityFaces`)** ; `@/lib/seo` ; **aucune API** | non | non / non |
| 3 | `/vie-de-leglise/evenements` | `src/app/vie-de-leglise/evenements/page.tsx` | none/raw | **11** | `@/lib/api` (`getEvents` ×2, `getDepartments`) ; mock `images` ; **tableaux littéraux locaux `experiencePillars` (4) et `weeklyRhythm` (3)** | non | non / non |
| 4 | `/vie-de-leglise/evenements/[slug]` | `src/app/vie-de-leglise/evenements/[slug]/page.tsx` | **EventPage** | **5 slots peuplés** (hero, summary, description, practical, gallery, related) — `program` **NON fourni** | `@/lib/api` (`getEvent`, `getDepartments`, `getEvents`) ; mock `site` ; `@/lib/utils` | **OUI** — `[slug]` | **`generateStaticParams` OUI** (`getEvents({ limit: 100 })` → `{ slug }`, `try/catch` → `[]` + `console.warn`) ; **`dynamicParams` non déclaré** (défaut Next = `true`) ; `generateMetadata` OUI ; `notFound()` |
| 5 | `/vie-de-leglise/faire-un-don` | `src/app/vie-de-leglise/faire-un-don/page.tsx` | none/raw | **9** | mocks `site` (`whatsappHref`), `images` ; **4 tableaux littéraux locaux** : `impactDomains`, `impactFlow`, `givingMethods`, `crossLinks` ; **aucune API** | non | non / non |
| 6 | `/vie-de-leglise/ou-nous-trouver` | `src/app/vie-de-leglise/ou-nous-trouver/page.tsx` | none/raw (**`InformationPage` non utilisée**) | **5** | mocks `site` (**`weeklyRhythm` importé mais INUTILISÉ**), `images` ; `itineraryHref` dérivé de `site.address` ; tableau littéral `firstVisitPoints` | non | non / non |
| 7 | `/communaute/groupes-de-maison` | `src/app/communaute/groupes-de-maison/page.tsx` | none/raw | **7** (numérotation saute `03`→`05`) | mocks `images`, `site`, **`community` (`houseGroups`)** ; tableaux littéraux `groupPillars`, `relatedLinks` | non | non / non |
| 8 | `/communaute/parcours-nouveau` | `src/app/communaute/parcours-nouveau/page.tsx` | none/raw | **6** | mocks `images`, `site` ; tableaux littéraux `dimensions` (5), `projectionPlaces` (5) | non | non / non |
| 9 | `/communaute/priere-et-intercession` | `src/app/communaute/priere-et-intercession/page.tsx` | none/raw | **7** | mocks `images`, `site` ; tableaux littéraux `prayerSteps` (3), `relatedLinks` (3) ; client `PrayerRequestForm` (**aucun appel réseau**) | non | non / non |
| 10 | `/communaute/temoignages` | `src/app/communaute/temoignages/page.tsx` | **NarrativePage** (`rhythm="serene"`) | **7 slots** (hero, prologue, chapters, feature, chronology, epilogue, related) | **`@/lib/api` (`getTestimonies`)** ; mocks `images`, `site`, `verses` (`memoire`, `louange`) ; `ContentPending` ×2 | non | non / non |
| 11 | `/organisation` | `src/app/organisation/page.tsx` | none/raw (**`DirectoryPage` non utilisée**) ; + `OrganisationExplorer` + `DepartmentModal` (2 clients) | **7** | **`@/lib/api` (`getDepartments`, `getLeaders`)** ; mocks `images`, `site` ; 2 versets en dur (non centralisés) | non | non / non |
| 12 | `/publications/actualites` | `src/app/publications/actualites/page.tsx` | **ListingPage** (`rhythm` défaut `dense`) | **5 slots** (header, lead, list, archives, related) | `@/lib/api` (`getPublications` ×2) ; mock `images` (`fraternite`) | non | non / non |
| 13 | `/publications/enseignements` | `src/app/publications/enseignements/page.tsx` | **MediaPage** (`rhythm="standard"`) | **6 slots** (hero, featured, listing, gallery, collections, related) | `@/lib/api` (`getPublications`) ; mocks `photoPool`, `verses.parole` ; `ContentPending` ×1 | non | non / non |
| 14 | `/publications/mediatheque` | `src/app/publications/mediatheque/page.tsx` | **MediaPage** (`rhythm="standard"`) — **`listing` NON fourni** | **5 slots** (hero, featured, gallery, collections, related) | `@/lib/api` (`getPublications` ×2) ; mocks `images`, `photoPool` (11 photos) | non | non / non |
| 15 | `/publications/ressources` | `src/app/publications/ressources/page.tsx` | **ListingPage** (`rhythm="dense"`) | **5 slots** (header, lead, list, archives, related) | `@/lib/api` (`getPublications`) ; mock `images` (`predication`) ; tableau littéral `steps` (3) | non | non / non |
| 16 | `/publications/[slug]` | `src/app/publications/[slug]/page.tsx` | **DetailPage** (`rhythm="standard"`) | **6 slots** (media, summary, body+aside, gallery, related) | `@/lib/api` (`getPublication`, `getPublications` ×1-2) ; mocks `images`, **`galleryImages`** ; `ContentPending` ×1 | **OUI** — `[slug]` | **`generateStaticParams` OUI** (`getPublications({ limit: 100 })` → `{ slug }`, `try/catch` → `[]` + `console.warn`) ; **`dynamicParams` non déclaré** (défaut `true`) ; `generateMetadata` OUI ; `notFound()` |
| 17 | `/recherche` | `src/app/recherche/page.tsx` | **InformationPage** (`rhythm="dense"`) — `photo`/`steps`/`contact` **NON fournis** | **4 slots** (header, context, facts, related) | `@/lib/nav` (`primaryNav`) ; **mocks `events`, `departments`, `publications`** ; `SearchClient` (client) ; **aucune API** | non | non / non |
| 18 | `/accessibilite` | `src/app/accessibilite/page.tsx` | **LegalPage** (→ `PageHeader` + `Section` + `VerseSection`) | **3** | littéral de props ; mock `verses.parole` | non | non / non |
| 19 | `/conditions` | `src/app/conditions/page.tsx` | **LegalPage** | **3** | littéral de props ; mock `verses.parole` | non | non / non |
| 20 | `/confidentialite` | `src/app/confidentialite/page.tsx` | **LegalPage** | **3** | littéral de props ; mock `verses.parole` | non | non / non |
| 21 | `/mentions-legales` | `src/app/mentions-legales/page.tsx` | **LegalPage** | **3** | littéral de props ; mock `verses.parole` | non | non / non |
| — | *(layout)* | `src/app/layout.tsx` | none/raw (coquille) | 6 | `@/lib/seo`, mock `site` | non | non / non |
| — | *(template)* | `src/app/template.tsx` | none/raw | 1 | aucune | non | non / non |
| — | `/sitemap.xml` | `src/app/sitemap.ts` | none/raw | — | `@/lib/seo`, `@/lib/nav`, **mocks `events`, `publications`** (+ `departments` **import mort**) | non | non / non |
| — | `/robots.txt` | `src/app/robots.ts` | none/raw | — | `@/lib/seo` | non | non / non |

**Routes dynamiques** : 2 — `/vie-de-leglise/evenements/[slug]` et `/publications/[slug]`. Les deux déclarent `generateStaticParams` **et** `generateMetadata`, les deux retournent `[]` (avec `console.warn`) si l'API est indisponible au build, et aucun des deux ne déclare `dynamicParams` (donc `true` par défaut côté Next.js).

**Routes référencées mais inexistantes** : `/vie-de-leglise/premiere-visite` (liée depuis `groupes-de-maison/page.tsx:65`) ; `/contact` (mentionnée en prose dans `mentions-legales/page.tsx:48`). Aucun `contact/page.tsx` ni `premiere-visite/page.tsx` n'existe sous `src/app/`.

---

## 9. Synthèse transversale — hardcodé vs data-driven, et incohérences

### 9.1 Répartition des sources

| Régime | Pages |
|---|---|
| **API exclusivement** pour le contenu éditorial | `/communaute/temoignages` ; `/publications/[slug]` |
| **API majoritaire** | `/` ; `/vie-de-leglise/evenements` + `[slug]` ; `/organisation` ; `/publications/actualites` ; `/publications/enseignements` ; `/publications/mediatheque` ; `/publications/ressources` |
| **Mocks seulement, aucune API** | `/qui-sommes-nous` ; `/communaute/groupes-de-maison` ; `/communaute/priere-et-intercession` ; `/recherche` |
| **Aucune source externe (littéraux purs)** | `/vie-de-leglise/faire-un-don` ; `/vie-de-leglise/ou-nous-trouver` ; `/communaute/parcours-nouveau` ; `/accessibilite` ; `/conditions` ; `/confidentialite` ; `/mentions-legales` |

### 9.2 Mocks jamais importés par une page (code mort de données)

Vérifié par recherche globale sur `frontend/src` :
- **`src/data/mock/testimonies.ts`** (4 témoignages : Grâce, Patrick, Esther, Josué) → **0 import**. `/communaute/temoignages` lit `getTestimonies()` (API) et affiche en parallèle un `ContentPending` qui décrit précisément ces contenus de démonstration.
- **`src/data/mock/leaders.ts`** (5 responsables + helper `leadPastor = leaders[0]`) → **0 import**. `/organisation` lit `getLeaders()` (API).
- **`choraleSchedule`** (`src/data/mock/site.ts:107`, `"Lundi 16h30–18h30 · Mercredi dans la nuit · Samedi 16h30–18h30"`) → **0 usage** hors du fichier. Trois pages affichent pourtant un horaire de chorale, chacune différemment.
- **Helpers de résolution par slug jamais appelés** : `getEventBySlug`, `getDepartmentBySlug`, `getPublicationBySlug`, `getPublicationsByCategory` → 0 usage hors de leur module.
- **`sitemap.ts`** importe `departments` **sans l'utiliser**.

### 9.3 Incohérences de source (même notion, deux régimes)

1. **Visages communautaires** : `/` → **API** `getCommunityFaces()` ; `/qui-sommes-nous` → **mock** `communityFaces`.
2. **Événements / départements / publications** : `/vie-de-leglise/evenements`, `/organisation`, `/publications/*` → **API** ; `/recherche` **et** `sitemap.ts` → **mocks** `events`, `departments`, `publications`. ⇒ l'index de recherche et le sitemap peuvent pointer vers des slugs qui n'existent plus côté API (`notFound()`), ou ignorer le contenu créé en back-office.
3. **Défauts de composant** : `EventsSection` (`src/features/events/EventsSection.tsx:70`) a pour valeur par défaut `events = upcomingEvents` **du mock** `@/data/mock/events`, alors que toutes les pages qui l'utilisent lui passent des événements d'**API**. Le composant porte une double source.
4. **Libellés de catégorie de publication** : ternaire en ligne dans `actualites/page.tsx:173-177` vs `Record` `categoryLabel` dans `publications/[slug]/page.tsx:28-33`.

### 9.4 Horaires du culte et de la semaine — 5 écritures divergentes

| Où | Formulation |
|---|---|
| `@/data/mock/site.ts` `site.scheduleAdults` | `"Dimanche · 09h00"` |
| `@/data/mock/site.ts` `weeklyRhythm` | Dimanche `"09h00"` ; **chorale Lundi 16h30–18h30 / Mercredi « Dans la nuit » / Samedi 16h30–18h30** ; Mercredi « Prière et intercession » `"17h00"` |
| `/` (via `WeekRhythm` sur le mock) | idem ci-dessus, **le champ `confirmed: true` n'est pas affiché** |
| `/vie-de-leglise/ou-nous-trouver` (littéral) | `"Dimanche · 09:00"` ; `"Mercredi · 17:00"` ; **chorale `"Lundi & Samedi · 16:30"`** (la nuit du mercredi **disparaît**) |
| `/vie-de-leglise/evenements` (`weeklyRhythm` **local**) | Mercredi `"18:00"` « Étude biblique & Intercession » ; **Vendredi `"17:00"` « Répétition de la chorale »** ; Dimanche `"09:00"` |
| `/communaute/parcours-nouveau` (prose) | `"ce dimanche à 09h00"` |
| `/qui-sommes-nous` (littéral) | `"Dimanche 09h"`, `"Mercredi 17h"` |
| `/communaute/priere-et-intercession` (prose) | `"le mercredi à 17h00"` ×2 |

**Le vendredi (chorale) n'existe que dans `evenements/page.tsx` ; la veillée du mercredi n'existe que dans `site.ts` ; `/vie-de-leglise/ou-nous-trouver` importe `weeklyRhythm` et ne s'en sert pas.**

### 9.5 Versets bibliques — centralisation partielle

`src/data/mock/verses.ts` contient 8 versets (`rassemblement`, `louange`, `repos`, `parole`, `ouvrage`, `corps`, `memoire`, `mission`).
Utilisés via le mock : `/` (`rassemblement`), `/qui-sommes-nous` (`parole`, `ouvrage`), `/communaute/temoignages` (`memoire`, `louange`), `/publications/enseignements` (`parole`), les 4 pages légales (`parole`).
**Écrits intégralement en dur (absents du mock, rendus sans `VerseSection`/`ScriptureBlock`)** :
- `/vie-de-leglise/evenements` : Matthieu 18:20 (avec guillemets, alors que le mock le donne sans) **et** Hébreux 10:24-25.
- `/vie-de-leglise/faire-un-don` : 2 Corinthiens 9:7.
- `/vie-de-leglise/ou-nous-trouver` : Jean 1:46.
- `/communaute/groupes-de-maison` : Actes 2:46-47.
- `/communaute/parcours-nouveau` : Jean 14:6.
- `/communaute/priere-et-intercession` : Philippiens 4:6-7 (et le même verset en abrégé, sans référence, dans l'écran de succès de `PrayerRequestForm`).
- `/organisation` : 1 Corinthiens 12:12 **+ une phrase supplémentaire** (« Il y a diversité de dons, mais le même Esprit ; diversité de ministères, mais le même Seigneur. ») et référence composée `"1 Corinthiens 12:12, 4–5"`, alors que `verses.corps` s'arrête à `"1 Corinthiens 12:12"` ; **et** 1 Pierre 4:10.

### 9.6 Placeholders visibles à l'utilisateur

| Page | Mécanisme | Texte rendu |
|---|---|---|
| `/communaute/temoignages` (prologue) | `ContentPending` `variant="block"` | `TODO — Témoignages réels à fournir` |
| `/communaute/temoignages` (chapitres) | `ContentPending` `variant="inline"` | `TODO — Témoignages réels à fournir.` |
| `/publications/enseignements` (collections) | `ContentPending` | `TODO — Séries et thèmes des prédications à fournir` |
| `/publications/[slug]` (body) | `ContentPending` | `TODO — Corps de cette publication à fournir` |
| `/mentions-legales` | chaîne littérale dans `paragraphs` | `"Adresse : information à compléter. Contact : information à compléter."` et `"Les coordonnées précises de l'hébergeur seront complétées avant la mise en production."` |
| `/publications/enseignements` (liste) | littéral de repli | `"Auteur non renseigné"`, `"Vidéo à venir"` |
| `/publications/ressources` | littéral de repli | `"À venir"` |

**Aucun des 21 fichiers de route ne contient le mot `lorem`.**

### 9.7 Fonctionnalités simulées ou incomplètes (non signalées comme telles à l'utilisateur)

1. **`PrayerRequestForm`** (`src/components/forms/PrayerRequestForm.tsx`) — `handleSubmit` fait `setTimeout(…, 600)` puis `setSubmitted(true)` ; **aucun appel réseau**. L'écran affirme `"Votre demande a bien été reçue."` et `"Notre équipe d'intercession la portera fidèlement dans la prière dès aujourd'hui."`. Les champs `contact` et `confidentiality` sont collectés **et jamais utilisés**. Le seul canal réel est le bouton WhatsApp.
2. **`/vie-de-leglise/faire-un-don`** — aucun moyen de don : ni numéro Mobile Money, ni compte bancaire, ni bouton de paiement. Trois paragraphes renvoient à « contactez le secrétariat » et un CTA WhatsApp. La page « Comment contribuer ? » décrit donc des canaux qu'elle ne fournit pas.
3. **`/publications/[slug]`** — la « Galerie de l'album » d'une publication `PHOTO` est composée de **`galleryImages` (mock, 10 fichiers)** + l'image de la publication, présentée sans aucune mention qu'il s'agit d'images génériques.
4. **`/publications/mediatheque`** — la « Galerie » (11 photos de `photoPool`) est sans rapport avec les « Albums publiés » listés juste en dessous (données API).
5. **`/vie-de-leglise/evenements`** — le CTA `#a-venir` de la section 11 est rendu inconditionnellement, alors que la section cible (`03`) n'existe que `{leadEvent && …}`.

### 9.8 Liens morts et `<main>` imbriqué

- **`/vie-de-leglise/premiere-visite`** — lié depuis `src/app/communaute/groupes-de-maison/page.tsx:65`, route inexistante.
- **`/contact`** — mentionnée en prose dans `src/app/mentions-legales/page.tsx:48`, route inexistante.
- **`src/app/organisation/page.tsx:30`** rend un `<main>` **à l'intérieur** du `<main id="contenu">` de `src/app/layout.tsx:57` ⇒ deux landmarks `main` imbriqués sur `/organisation`. Aucune autre page ne fait cela (toutes rendent un `<div>` ou un fragment).

### 9.9 Archétypes existants non utilisés par les pages qui leur correspondent

| Archétype (`src/components/archetypes/`) | Pages qui l'utilisent | Pages qui auraient le profil mais ne l'utilisent pas |
|---|---|---|
| `NarrativePage.tsx` | `/communaute/temoignages` | `/qui-sommes-nous` (commentaire « Page Narrative Majeure » mais **none/raw**) |
| `ListingPage.tsx` | `/publications/actualites`, `/publications/ressources` | `/vie-de-leglise/evenements` (index d'agenda, **none/raw**) |
| `MediaPage.tsx` | `/publications/enseignements`, `/publications/mediatheque` | — |
| `EventPage.tsx` | `/vie-de-leglise/evenements/[slug]` | — |
| `DirectoryPage.tsx` | **aucune page** | `/organisation` (**none/raw**) |
| `InformationPage.tsx` | `/recherche` | `/vie-de-leglise/ou-nous-trouver` (**none/raw**) |
| `DetailPage.tsx` | `/publications/[slug]` | — |

**`DirectoryPage` n'est utilisé par aucune route** ; 5 autres routes du périmètre affichent un rendu manuel là où un archétype existe, et le fichier `rhythm.ts` (`dense`/`standard`/`serene`) n'est donc pas appliqué à ces pages.

### 9.10 INCERTAIN (limites de cette extraction)

- **INCERTAIN** : la signification exacte de l'attribut `data-hero-dark` posé sur la section hero de `/organisation` (`page.tsx:35`) — je n'ai pas audité `src/app/globals.css` (hors du périmètre `app/**`-routes + composants demandé).
- **INCERTAIN** : `sort: "-event_date"` (snake_case) passé à `getEvents` dans `evenements/page.tsx:26` et `[slug]` — dépend du contrat de l'API, non audité (`src/lib/api/client.ts` lu seulement pour l'existence de `apiFetch`, pas pour la sérialisation des query).
- **INCERTAIN** : présence de `publication.coverImage` et `publication.gallery` dans le type de retour API — `src/lib/api/types.ts` n'a pas été ouvert ; `@/data/mock/publications` ne définit que `contentUrl`.
- **INCERTAIN** : l'affirmation de `/accessibilite` « très peu de JavaScript » — je n'ai pas mesuré le bundle ; j'ai seulement relevé 9 composants `"use client"` (`CommunityFaces`, `ParallaxImage`, `Reveal`, `Breadcrumbs`, `SearchClient`, `PrayerRequestForm`, `OrganisationExplorer`, `DepartmentModal`, `YouTubeThumb`).
- **INCERTAIN** : l'exactitude du lien entre chaque fichier `/media/ccjv-NN.jpeg` et le sujet annoncé par son `alt` — `src/data/mock/images.ts` déclare lui-même que ce sont « des RÔLES DE MISE EN PAGE, pas des légendes » et qu'aucune légende affirmative n'est écrite.
- **INCERTAIN** : le rendu réel des sections quand l'API répond avec des objets partiels (ex. `Event` sans `imageUrl` ni `bannerImage`) — le code prévoit des replis, mais je n'ai pas exécuté le rendu.
