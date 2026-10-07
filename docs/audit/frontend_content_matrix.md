# Matrice de contenu du frontend — CCJV

**Objet :** recenser chaque élément significatif du frontend afin qu'un architecte backend puisse concevoir le modèle de données et le Back-Office sans relire le code.
**Périmètre :** les 21 routes servies, section par section.
**Compagnon de :** `audit_architecture_editoriale_frontend.md` (analyse), `frontend_component_catalog.md` (composants), `backoffice_open_questions.md` (décisions).

---

## Légende

### Colonne `Type`

| Code | Signification |
|---|---|
| **STATIC** | `STATIC_CODE` — entièrement défini dans le code, jamais administrable |
| **EDIT** | `EDITORIAL_CONTENT` — structure codée, contenu à administrer |
| **DYN** | `DYNAMIC_ENTITY` — provient d'une entité dynamique |
| **HYB** | `HYBRID` — structure codée + contenu éditorial + données dynamiques |
| **CFG** | `CONFIGURATION` — contrôle le fonctionnement, pas le contenu |

### Colonne `Source`
`API` = via `@/lib/api` · `MOCK` = `@/data/mock/*` · `JSX` = littéral dans le JSX · `CODE` = structure/logique · `MIXTE` = plusieurs sources

### Colonne `Admin.` (administrable)
`oui` · `non` · `partiel` · `à décider`

### Colonne `Rôle` / `Scope`
`ADM` = Administrateur · `SA` = Super Admin · `RD` = Responsable de département · `—` = non administrable
`GLB` = global · `DEP` = départemental · `—`

### Fiabilité
`✅` = vérifié par lecture directe du code · `⚠` = incohérence ou défaut relevé · `?` = incertain (voir limites de l'audit)

---

## Synthèse chiffrée

| Indicateur | Valeur |
|---|---|
| Routes servies | **21** (19 statiques + 2 dynamiques `[slug]`) |
| Sections recensées | **~130** |
| Sections en `STATIC_CODE` | ~48 |
| Sections en `EDITORIAL_CONTENT` seul | ~28 |
| Sections en `DYNAMIC_ENTITY` | ~18 |
| Sections en `HYBRID` | ~36 |
| Pages utilisant un archétype | **9 / 21** |
| Pages 100 % mock | **11** |
| Pages branchées sur l'API | **10** (21 sites d'appel) |
| `EmptyState` en place | **9 appels / 6 fichiers** |
| `ContentPending` visible | **5 appels / 4 fichiers** |
| Éléments de contenu encore en `JSX` littéral à rapatrier | **~150 chaînes** |

---

# 1. `/` — Accueil

`app/page.tsx` (337 lignes, 13,2 Ko) · **Composition libre, aucun archétype** · 12 sections
Consomme : `getEvents`, `getPublications`, `getCommunityFaces`, `getDepartments` (API) + `images`, `site`, `socials`, `weeklyRhythm`, `verses` (MOCK)

| # | Section | Composant | Variante | Type | Source | Admin. | Rôle | Scope | Donnée dynamique | Fallback | Réutil. | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 01 | Accueillir | `Hero` (`features/pages/Hero.tsx`) | aucune | HYB | JSX + MOCK | **oui** *(props à créer)* | ADM | GLB | — | aucun | non | ⚠ **`Hero` n'accepte AUCUNE prop** : titre, paragraphe, 2 CTA et `images.portraitLarge` sont en dur dans le composant ✅ |
| 02 | La Parole du jour | `VerseSection` | `left` (défaut, non passé) | HYB | MOCK `verses.rassemblement` + CODE | **oui** | ADM | GLB | **`Scripture` (clé `rassemblement`)** | photos → 4 littéraux en dur | oui (8) | ✅ `tone="dark"`. La variante n'est pas passée ⇒ mosaïque 4 photos. Doit lire `getScripture("rassemblement")` |
| 03 | Un mot du pasteur | `Section` *(legacy)* + `Reveal` + `CrossMark` | `tone="tinted"` | HYB | JSX + MOCK `site` | **oui** | ADM | GLB | `site.visionary`, `site.visionaryRole` | aucun | non | ✅ ~70 mots en dur : « Vous êtes les bienvenus parmi nous. », etc. `images.portraitLarge`. **Utilise `Section`, pas `Band`** ⚠ |
| 04 | Qui sommes-nous en bref | `Section` + `Reveal` + `Button` | défaut | HYB | JSX + MOCK | **oui** | ADM | GLB | `site.name` | aucun | non | ✅ Titre « Une famille chrétienne au cœur de Lubumbashi » + ~50 mots + CTA « Découvrir notre histoire → ». `images.identite` |
| 05 | Ce qui se passe | `EventsSection` | `tone="tinted"` | **HYB** | JSX + **API** | **oui** | ADM | GLB / **DEP** | `getEvents({status:"UPCOMING",limit:6})` | ⚠ **AUCUN** | 1 seul | ✅ Props éditoriales : `title`, `description`, `ctaLabel="TOUT L'AGENDA"`, `ctaHref`. ⚠ `id` ARIA codé en dur ; repli mock `upcomingEvents` ; plafond `maxEvents=3` ; **colonne droite vide si `events=[]`** |
| 06 | Quand nous nous rassemblons | `Section` + `SectionHeading` + `WeekRhythm` + `Button` | défaut | HYB | JSX + **MOCK** | **oui** | ADM | GLB | **`ScheduleEntry`** (`getSchedule()` non appelée) | ⚠ aucun | 1 seul (`/ou-nous-trouver` importe sans utiliser) | ✅ Titre « Quand nous nous rassemblons », description, CTA. ⚠ `WeekRhythm.RhythmItem` incompatible avec `ScheduleEntry` (`time` vs `timeLabel`) ; `confirmed` jamais affiché |
| 07 | Écouter la Parole | `Section` + `SectionHeading` + `TeachingFeature` + `TeachingCard` + `OpenBookMark` + `Button` | `tone="tinted"` | **HYB** | JSX + **API** | **oui** | ADM | GLB | `getPublications({category:"ENSEIGNEMENT",limit:3})` | ✅ `{leadTeaching &&}` + `{otherTeachings.length>0 &&}` | 1 | ✅ Meilleure dégradation de l'accueil. ~60 mots en dur. `slice(0,2)` sur les secondaires |
| 08 | Les visages de notre communauté | `Section` + `SectionHeading` + `CommunityFaces` | défaut | **HYB** | JSX + **API** | **oui** | ADM | GLB | `getCommunityFaces()` | ⚠ **aucun** | 1 | ✅ Titre + description en dur. ⚠ Si toutes les entrées sont écartées faute de portrait (`keepWithPortrait`) → **zone vide sous titre visible** |
| 09 | Respiration | `BreathingPhoto` | défaut | HYB | MOCK + JSX | **oui** | ADM | GLB | — | aucun | non | ✅ Props : `image={images.louange}`, `phrase="La parole nous rassemble"`, `` reference={`${site.acronym} — Lubumbashi`} `` |
| 10 | La prière | `Section` + `Reveal` + `CrossMark` + `Button` | `tone="tinted"` | EDIT | JSX + MOCK | **oui** | ADM | GLB | `site.whatsappHref` | aucun | non | ✅ ~50 mots. ⚠ CTA vers **WhatsApp** alors que `/communaute/priere-et-intercession` existe |
| 11 | Soutenir l'œuvre | `Section` + `Reveal` + `Button` | défaut | HYB | JSX + MOCK | **oui** | ADM | GLB | `site.whatsappHref` | aucun | non | ✅ ~60 mots. `images.communaute`. ⚠ CTA WhatsApp alors que `/faire-un-don` existe |
| 12 | L'envoi | `Section` + `Reveal` + `CrossMark` + `Button` + `Link` | `tone="green"` | HYB | JSX + MOCK | **oui** | ADM | GLB | `socials[]`, `site.whatsappHref` | aucun | non | ✅ ~40 mots + 2 CTA + liste de réseaux. **Sections 10/11/12 ne dépendent d'aucune donnée → jamais vides** |

**Métadonnées :** `title: {absolute: defaultTitle}`, `description` en dur (33 mots) — ✅ **à administrer** (SEO).

---

# 2. `/qui-sommes-nous`

`app/qui-sommes-nous/page.tsx` (30,1 Ko — **la plus grosse page éditoriale**) · **aucun archétype** *(le commentaire interne dit « Page Narrative Majeure » alors que `NarrativePage` n'est pas importé)* ⚠ · 14 sections
**Chiffre-clé : 0 appel API.** Sources : `images`, `site`, `verses` (MOCK), `communityFaces` (**MOCK**)

| # | Section | Composant | Variante | Type | Source | Admin. | Rôle | Scope | Donnée dynamique | Fallback | Réutil. | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| — | Héros | *?(héros local ou composition libre)* | ? | HYB | JSX + MOCK | oui | ADM | GLB | — | aucun | non | ? Le fichier n'a pas été audité ligne à ligne dans le périmètre de preuve ; **héros à confirmer** |
| 01-14 | Prose institutionnelle, 4 piliers de croyance, visages, versets | `Prose`, `FeatureImage`, `PhotoDuo`, `PullQuote`, `ScriptureBlock`, `CrossMark` *(+ JSX brut)* | divers | **EDIT / HYB** | **JSX littéral** + MOCK | **oui** | ADM | GLB | `CommunityFace` *(mais via MOCK)* | ⚠ aucun | — | ✅ **Défauts relevés :** dates `"17 Mars 2023"` / `"02 Juillet 2023"` **en dur, casse différente** de `site.foundedAt` / `site.ecodimFoundedAt` ; les **4 piliers de croyance sont 4 blocs JSX dupliqués à la main** (pas un `.map()`) ⚠ ; la grille de visages lit **`communityFaces` MOCK** alors que `/` lit `getCommunityFaces()` → **deux sources pour une même notion** ⚠ |

**Priorité : MAXIMALE.** C'est la page où le besoin d'administration est le plus fort (30 Ko de prose, zéro API) et où la divergence avec l'accueil est la plus visible.
**À administrer :** ~14 blocs de prose → `static_pages` clé `QUI_SOMMES_NOUS` ; les visages → `getCommunityFaces()` ; les dates → `site_settings`.

---

# 3. `/vie-de-leglise/evenements`

`app/vie-de-leglise/evenements/page.tsx` (37,5 Ko — **la plus grosse du site**) · **aucun archétype** *(profil `ListingPage`)* ⚠ · 11 sections
Consomme : `getDepartments`, `getEvents` (API) + `images` (MOCK)

| # | Section | Composant | Variante | Type | Source | Admin. | Rôle | Scope | Donnée dynamique | Fallback | Réutil. | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| — | Héros | *?(local)* | ? | HYB | JSX + MOCK | oui | ADM | GLB | — | — | non | ? Héros à confirmer |
| 01-11 | Liste d'événements, filtres, vedette, agenda, timeline | `FeaturedEvent`, `EventRow`, `CrossMark` *(+ JSX brut)* | divers | **HYB** | **API** + JSX | **oui** | ADM / **RD** | GLB / **DEP** | `Event[]` via `getEvents()` + `getDepartments()` | ✅ 4 sections gardées sur 11 | partiel | ⚠ **Défauts majeurs :** ① un `weeklyRhythm` **local** (ligne 81) contredit le mock : *Mercredi **18:00*** et ***Vendredi 17:00 chorale*** — le mock place la chorale Lundi/Mercredi-nuit/Samedi ; ② le CTA `#a-venir` est **inconditionnel** alors que sa cible est `{leadEvent &&}` ; ③ 2 versets en dur (Matthieu 18:20 **avec guillemets** + Hébreux 10:24-25) absents de `verses.ts` |
| — | Section 08 | — | — | **DYN** | API | oui | ADM/RD | DEP | `Event[]` | ✅ **message de repli explicite** | — | Le meilleur traitement de vacuité de la page |

---

# 4. `/vie-de-leglise/evenements/[slug]`

`app/vie-de-leglise/evenements/[slug]/page.tsx` (9,0 Ko) · **Archétype `EventPage`** ✅ · 5 emplacements
Consomme : `getEvent`, `getEvents`, `getDepartments` (API) + `site` (MOCK) · `generateStaticParams` ✅ (`limit:100`, `try/catch → []`) · `generateMetadata` ✅ · `notFound()` ✅

| Slot | Composant | Variante | Type | Source | Admin. | Rôle | Scope | Donnée dynamique | Fallback | Réutil. | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `hero` | `HeroPhoto` | `tall` | HYB | API | oui | ADM/RD | DEP | `Event.title`, `bannerImage`, date, lieu | — | 2 | ✅ |
| *métadonnées* | — | — | DYN | API | oui | ADM/RD | DEP | `Event.excerpt`, `description`, `practicalInfo[]` | — | — | ✅ |
| `description` | `Prose` | défaut | DYN | API | oui | ADM/RD | DEP | `Event.description` | ⚠ aucun | 8 | ⚠ `"Entrée : Libre et ouverte à tous"` **asserté en littéral** quelle que soit la donnée |
| `facts` | `KeyFacts` | ? | DYN | API | oui | ADM/RD | DEP | `Event.practicalInfo[]`, `eventTime`, `location` | — | 1 | ✅ |
| `gallery` | `PhotoGallery` | ? | DYN | API | oui | ADM/RD | DEP | `event_media` (relation ordonnée) | ⚠ ? | 4 | ✅ Relation **existe en base** (`event_media`) |
| `program` | — | — | — | — | — | — | — | — | — | — | ⚠ **Emplacement prévu par l'archétype, JAMAIS fourni** |
| `related` | — | ? | DYN | API | oui | ADM/RD | DEP | `getEvents()` | — | — | ✅ |
| — | *déclaration manquante* | — | CFG | CODE | non | — | — | — | — | — | ⚠ `dynamicParams` non déclaré (défaut Next = `true`) |

---

# 5. `/vie-de-leglise/faire-un-don`

`app/vie-de-leglise/faire-un-don/page.tsx` (29,6 Ko) · **aucun archétype** *(profil `EditorialPage`)* ⚠ · 9 sections
**Chiffre-clé : 100 % en dur** — 4 tableaux littéraux locaux, **aucun appel API**. Sources : `site`, `images` (MOCK)

| # | Section | Composant | Type | Source | Admin. | Rôle | Scope | Donnée dynamique | Fallback | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| 01-09 | Prose, canaux de contribution, étapes, verset, FAQ | JSX brut + `CrossMark` + `ScriptureBlock` ? | **EDIT** | **JSX littéral** | **oui** | ADM | GLB | — | — | ⚠ **Page fonctionnellement incomplète :** aucune Mobile Money, aucun IBAN, **aucun bouton de paiement** ; la section « Comment contribuer ? » décrit des canaux qu'elle ne fournit jamais, **sans être marquée comme en attente**. Verset 2 Corinthiens 9:7 en dur |

**Priorité : HAUTE.** Contenu 100 % éditorial, aucune entité. Mais **la décision de fournir ou non les canaux de don est un préalable produit** (`backoffice_open_questions.md` IMPORTANT-4).

---

# 6. `/vie-de-leglise/ou-nous-trouver`

`app/vie-de-leglise/ou-nous-trouver/page.tsx` (17,2 Ko) · **aucun archétype** *(profil `InformationPage` non utilisé)* ⚠ · 5 sections
Sources : `site`, `weeklyRhythm` (MOCK) + `images` (MOCK)

| # | Section | Composant | Type | Source | Admin. | Rôle | Scope | Donnée dynamique | Fallback | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| 01 | Héros pratique | *?(local ; `HeroPractical` existe et n'est pas utilisé)* ⚠ | HYB | JSX + MOCK | oui | ADM | GLB | `site.address` | — | ⚠ Profil `InformationPage` non adopté |
| 02-05 | Adresse, horaires, accès, contact | JSX brut | **EDIT + DYN** | **JSX littéral** | **oui** | ADM | GLB | **`ScheduleEntry`** | ⚠ aucun | ⚠ **`weeklyRhythm` est importé ligne 7 et JAMAIS utilisé** ; les 4 lignes d'horaires sont écrites à la main avec une **4ᵉ formulation** : `"Dimanche · 09:00"`, `"Mercredi · 17:00"`, `"Lundi & Samedi · 16:30"` — **supprimant le créneau « mercredi dans la nuit » marqué `confirmed: true`**. Verset Jean 1:46 en dur |

---

# 7. `/communaute/groupes-de-maison`

`app/communaute/groupes-de-maison/page.tsx` (20,7 Ko) · **aucun archétype** ⚠ · 7 sections
Sources : `houseGroups` (**MOCK**), `images`, `site` (MOCK)

| # | Section | Composant | Type | Source | Admin. | Rôle | Scope | Donnée dynamique | Fallback | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| 01-07 | Prose, liste des groupes, carte, participation | JSX brut + `CrossMark` | **HYB** | **MOCK** | **à décider** | ADM | GLB | **`HouseGroup` (entité à créer ?)** | ⚠ aucun | ⚠ **Défauts :** ① **lien mort** `/vie-de-leglise/premiere-visite` (ligne 65) — route inexistante ; ② commentaires de section sautent `03`→`05` (`04` absente) ; ③ numéro WhatsApp `243123456789` **en dur ligne 255** alors que `site.whatsappHref` est utilisé 3× dans le même fichier ⚠ |
| — | `HouseGroup` | — | **DYN sans backend** | MOCK seul | **à décider** | — | — | `id, name, quarter, schedule, host, description, image?` | — | ⚠ **Entité présente dans le frontend, ABSENTE du backend et de TOUS les documents** → `backoffice_open_questions.md` **BLOQUANT-4** |

---

# 8. `/communaute/parcours-nouveau`

`app/communaute/parcours-nouveau/page.tsx` (19,5 Ko) · **aucun archétype** *(profil `EditorialPage`)* ⚠ · 6 sections
Sources : `images`, `site` (MOCK) — **aucun appel API**

| # | Section | Composant | Type | Source | Admin. | Rôle | Scope | Donnée dynamique | Fallback | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| 01-06 | Prose, étapes, dimensions, questions, CTA | JSX brut + `StepsList` ? | **EDIT** | **JSX littéral** | **oui** | ADM | GLB | — | — | ⚠ **Défauts :** ① `dimensions[].keyword` (`"CÉLÉBRER"`, `"RENCONTRER"`…) défini en donnée mais **utilisé seulement comme `key` React, JAMAIS rendu** ⚠ ; ② **5 cartes dans une grille `lg:grid-cols-3`** → 2 orphelines ; ③ couleur **hors palette** `bg-[#132A13]` ⚠ ; ④ horaire du culte `"ce dimanche à 09h00"` = **5ᵉ formulation** ; verset Jean 14:6 en dur |

---

# 9. `/communaute/priere-et-intercession`

`app/communaute/priere-et-intercession/page.tsx` (20,5 Ko) · **aucun archétype** ⚠ · 7 sections
Sources : `images`, `site` (MOCK) + `PrayerRequestForm`

| # | Section | Composant | Type | Source | Admin. | Rôle | Scope | Donnée dynamique | Fallback | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| 01-06 | Prose, enseignements sur la prière, verset, CTA WhatsApp | JSX brut | **EDIT** | **JSX littéral** | **oui** | ADM | GLB | — | — | Verset Philippiens 4:6-7 en dur |
| 07 | Formulaire de demande de prière | `PrayerRequestForm` | **DYNAMIC — NON BRANCHÉE** | CODE (simulé) | **oui** | — | GLB | **`PrayerRequest`** (`confidentiality`, `status`) | — | ⚠⚠ **Défaut critique :** `handleSubmit` exécute `setTimeout(…, 600)` puis `setSubmitted(true)` — **aucun appel réseau** — et l'écran de succès affirme **« Votre demande a bien été reçue. »** Les champs `contact` et `confidentiality` sont **collectés et jamais utilisés**. Contredit `/confidentialite`. → **BLOQUANT-5** |

---

# 10. `/communaute/temoignages`

`app/communaute/temoignages/page.tsx` (11,1 Ko) · **Archétype `NarrativePage`** (`rhythm="serene"`) ✅ · 7 emplacements
Consomme : `getTestimonies` (API) + `images`, `site`, `verses` (MOCK) · **le meilleur traitement de vacuité du site**

| Slot | Composant | Variante | Type | Source | Admin. | Rôle | Scope | Donnée dynamique | Fallback | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `hero` | `HeroManifesto` | `dark` | HYB | JSX + MOCK | oui | ADM | GLB | — | — | ✅ |
| `prologue` | `Prose` | `lead` | EDIT | JSX | oui | ADM | GLB | — | — | ✅ |
| `chapters` | `FeatureImage`, `PhotoDuo`, `PullQuote` | `offset` | HYB | MOCK `verses` + JSX | oui | ADM | GLB | — | — | ✅ |
| `feature` | — | — | — | — | — | — | — | — | — | ? |
| `chronology` | *détourné* | — | HYB | JSX | oui | ADM | GLB | — | — | ⚠ **emplacement « repères datés » détourné** pour une section photo+texte |
| `epilogue` | `ContentPending` ×2 + `EmptyState` | `block` | EDIT | JSX | oui | ADM | GLB | **`Testimony`** | ✅ **`EmptyState` sur le ternaire du `lead`** | ✅ **Rendu visible : `TODO — Témoignages réels à fournir`** |
| `related` | `CrossLinks` | `doors` | EDIT | CODE | oui | ADM | GLB | — | — | ✅ |
| — | `testimonies` | — | DYN | **API** ✅ | oui | ADM | GLB | `getTestimonies()` | ✅ `keepWithPortrait` | ✅ `mock/testimonies.ts` **importé par personne** |

---

# 11. `/organisation`

`app/organisation/page.tsx` (25,9 Ko) · **aucun archétype** *(profil `DirectoryPage` non utilisé — et `DirectoryPage` n'est utilisé par AUCUNE route)* ⚠ · 7 sections
Consomme : `getDepartments`, `getLeaders` (API) + `images`, `site` (MOCK) · **le meilleur traitement API du site**

| # | Section | Composant | Variante | Type | Source | Admin. | Rôle | Scope | Donnée dynamique | Fallback | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 01 | Héros éditorial sombre | JSX brut (`min-h-[92vh]`) | — | HYB | JSX + MOCK | oui | ADM | GLB | — | — | ⚠ **Rend un `<main>` DANS le `<main id="contenu">` du layout** — seule page dans ce cas (HTML invalide) ⚠. 3 surimpressions photo affirmatives : « Entraide & Service », « Louange », « Ecodim » — **contredit `docs/015` §5** ⚠. 3 ancres + 2 CTA en dur |
| 02 | Respiration biblique 1 | JSX brut + `CrossMark` | `bg-ccjv-green` | **EDIT** | **JSX littéral** | **oui** | ADM | GLB | **`Scripture`** | — | ⚠ Verset **1 Corinthiens 12:12 étendu** au-delà de `verses.corps`, réf. `"1 Corinthiens 12:12, 4–5"` — **introuvable par recherche dans `verses.ts`** |
| 03a | Pasteur visionnaire | JSX brut + `EmptyState` | — | **HYB** | **API** | oui | ADM | GLB | `getLeaders()[0]` ⚠ | ✅ `EmptyState` « Direction pastorale » | ⚠⚠ **`const [leadPastor, ...teamLeaders] = leaders` : le pasteur est DÉFINI PAR SA POSITION.** Réordonner les responsables change silencieusement qui est présenté comme visionnaire. `leadPastor.scope ?? "Direction spirituelle"`, `photo ?? images.portraitLarge` |
| 03b | Coordination des ministères | JSX brut | — | **HYB** | **API** | oui | ADM | GLB | `getLeaders()` | ⚠ **stratégie ≠ 03a** : paragraphe **en dur**, non administrable | ⚠ **3ᵉ stratégie de repli pour la même entité.** `ldr.scope ?? "Coordination"` |
| 04 | Transition narrative | JSX brut + `CrossMark` | `bg-ccjv-cream` | **EDIT** | **JSX littéral** | **oui** | ADM | GLB | — | — | ~60 mots. 2 photos (`fraternite`, `predication`) |
| 05 | Départements | `OrganisationExplorer` + `DepartmentModal` | alternance `idx%2` | **HYB** | **API** | **oui** | **ADM + RD** | **DEP** | `getDepartments()`, `department_media` | ✅ `EmptyState` « en cours de mise à jour » | ⚠ **Slugs codés en dur** : `enfants-ecodim` → `id="ecodim"`, `adultes` → `id="adulte"` ; `keyPoints.slice(0,4)` en carte mais **intégraux** en tiroir ; `bannerImage ?? images.communaute` ⚠ ; `meetingSchedule ?? "Culte dominical · 09:00"` ⚠⚠ **horaire non validé** |
| 06 | Respiration biblique 2 | JSX brut + `CrossMark` | `bg-ccjv-black` | **EDIT** | **JSX littéral** | **oui** | ADM | GLB | **`Scripture`** | — | Verset 1 Pierre 4:10 en dur |
| 07 | Conclusion & appel | JSX brut + `Button` | — | **EDIT** | JSX + MOCK | **oui** | ADM | GLB | `site.whatsappHref` | — | ✅ 3 étapes **dupliquées à la main** (`StepsList` existe, non utilisé) ; 2 CTA + 1 lien |

**Métadonnées SEO** en dur : `title: "Organisation & Ministères"`, description (~30 mots) ✅ à administrer.

---

# 12. `/publications/actualites`

`app/publications/actualites/page.tsx` (8,6 Ko) · **Archétype `ListingPage`** ✅ · 5 emplacements
Consomme : `getPublications` (API) + `images` (MOCK)

| Slot | Composant | Variante | Type | Source | Admin. | Rôle | Scope | Donnée dynamique | Fallback | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `header` | `HeroCompact` | défaut (« aucune photo ») | EDIT | JSX | oui | ADM | GLB | — | — | ✅ `overline`, `title`, `intro` en littéral |
| `lead` | `FeatureImage` | `wide` | DYN | API | oui | ADM | GLB | `Publication` (1ʳᵉ) | — | ✅ |
| `list` | JSX + `CrossLinks` | — | DYN | API | oui | ADM | GLB | `Publication[]` | ✅ `EmptyState` | ✅ `listTitle` en dur |
| `archives` | JSX | — | DYN | API | oui | ADM | GLB | `Publication[]` | ⚠⚠ **AUCUN GARDE** | ⚠ **`archives` sans test `elsewhere.length > 0` → `<ul>` VIDE sous un titre visible « Également publié sur le site ».** Défaut réel |
| `related` | `CrossLinks` | `?` | EDIT | CODE | oui | ADM | GLB | — | — | ✅ |

Catégorie → libellé par **ternaire inline**, dupliquant le `Record categoryLabel` de `[slug]` ⚠ (duplication).

---

# 13. `/publications/enseignements`

`app/publications/enseignements/page.tsx` (7,9 Ko) · **Archétype `MediaPage`** ✅ · 6 emplacements
Consomme : `getPublications` (API) + `photoPool`, `verses` (MOCK)

| Slot | Composant | Variante | Type | Source | Admin. | Rôle | Scope | Donnée dynamique | Fallback | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `header` | `HeroCompact` | `tone="tinted"` | EDIT | JSX | oui | ADM | GLB | — | — | ✅ |
| `feature` | `MediaFeature` | `hero` | DYN | API | oui | ADM | GLB | `Publication` (VIDEO) | ✅ `EmptyState` (l.171) | ✅ |
| `intro` | `Prose` | `lead` | EDIT | JSX | oui | ADM | GLB | — | — | ⚠⚠ **Auto-contradiction :** la prose affirme que *« la vidéo peut être regardée **sans quitter le site** »* alors que **chaque ligne est `target="_blank"`** vers YouTube et que `[slug]` dit explicitement « sans lecteur intégré » |
| `listing` | JSX + `CrossLinks` | — | DYN | API | oui | ADM | GLB | `Publication[]` | ✅ `EmptyState` (l.81) | ✅ |
| `gallery` | `PhotoGallery` | `?` | **MOCK** | `photoPool.slice(0,3)` | **oui** | ADM | GLB | ⚠ **aucune** | — | ⚠ Galerie composée de **3 photos génériques** sans rapport avec les enseignements |
| `related` | `ScriptureBlock` + `ContentPending` | `concluding` | EDIT | MOCK `verses` + JSX | oui | ADM | GLB | `Scripture` | ✅ `ContentPending` « Séries et thèmes » | ⚠ `ContentPending` **visible publiquement** |

---

# 14. `/publications/mediatheque`

`app/publications/mediatheque/page.tsx` (6,7 Ko) · **Archétype `MediaPage`** ✅ — ⚠ **emplacement `listing` NON fourni** · 5 emplacements
Consomme : `getPublications` (API) + `images`, `photoPool` (MOCK)

| Slot | Composant | Variante | Type | Source | Admin. | Rôle | Scope | Donnée dynamique | Fallback | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `header` | `HeroImmersive` | `center` | HYB | JSX + MOCK | oui | ADM | GLB | — | — | ✅ |
| `feature` | `MediaFeature` | `hero` | DYN | API | oui | ADM | GLB | `Publication` (VIDEO) | ✅ `EmptyState` (l.86) | ✅ |
| `intro` | `Prose` | défaut | EDIT | JSX | oui | ADM | GLB | — | — | ⚠ **reste affichée AU-DESSUS de l'`EmptyState` vidéo** |
| `listing` | — | — | — | — | — | — | — | — | — | ⚠ **non fourni** — les albums viennent d'ailleurs dans la page |
| `gallery` | `PhotoGallery` | `mosaic` | **MOCK** | `photoPool.slice(0,5)` + `.slice(5,11)` | **oui** | ADM | GLB | ⚠ **aucune** | ✅ `EmptyState` (l.150) | ⚠⚠ **11 photos génériques formant une « galerie » sans légende ni avertissement**, juxtaposées aux « Albums publiés » venus de l'API |
| `related` | `CrossLinks` | `?` | EDIT | CODE | oui | ADM | GLB | — | — | ✅ |

---

# 15. `/publications/ressources`

`app/publications/ressources/page.tsx` (9,3 Ko) · **Archétype `ListingPage`** (`rhythm="dense"`) ✅ · 5 emplacements
Consomme : `getPublications` (API) + `images` (MOCK)

| Slot | Composant | Variante | Type | Source | Admin. | Rôle | Scope | Donnée dynamique | Fallback | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `header` | `HeroPractical` | défaut | EDIT | JSX | oui | ADM | GLB | — | — | ✅ `facts[]` en littéral |
| `lead` | `FeatureImage` | `inset` | DYN | API | oui | ADM | GLB | `Publication` (RESSOURCE) | — | ✅ |
| `list` | JSX | — | DYN | API | oui | ADM | GLB | `Publication[]` | ✅ `EmptyState` (l.150) | ✅ `<dl>` latérale = **purs littéraux** (`Rubrique: Ressources`, `Lecture: Directement en ligne`) ; carte de fait affiche **un nombre sans unité** ⚠ |
| `archives` | `StepsList` | `vertical` | **EDIT** | JSX | oui | ADM | GLB | — | — | ⚠ **emplacement « entrées plus anciennes » DÉTOURNÉ** en « Comment utiliser ces ressources » |
| `related` | `CrossLinks` | `list` | EDIT | CODE | oui | ADM | GLB | — | — | ✅ |

---

# 16. `/publications/[slug]`

`app/publications/[slug]/page.tsx` (14,2 Ko) · **Archétype `DetailPage`** ✅ · 6 emplacements
Consomme : `getPublication` + `getPublications` + `getDepartments(?)` (API) + `images`, `galleryImages` (MOCK) · `generateStaticParams` ✅ · `generateMetadata` ✅

| Slot | Composant | Variante | Type | Source | Admin. | Rôle | Scope | Donnée dynamique | Fallback | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| `hero` | `HeroPhoto` | `normal` | HYB | API | oui | ADM | GLB | `Publication.title`, `coverMediaId` | — | ✅ **Titre rendu 2× (`h1` + `h2`)** ⚠ |
| *métadonnées* | JSX | — | DYN | API | oui | ADM | GLB | `publishedAt`, `author`, `category`, `type` | ⚠ `"Auteur non renseigné"` | ✅ `author` présent sur **2 publications sur 10** seulement |
| `body` | `Prose` | `dropcap` | DYN | API | oui | ADM | GLB | `Publication.body[]` | ✅ `ContentPending` (l.193) | ✅ `body` présent sur **4/10** (types TEXTE) |
| `gallery` | `PhotoGallery` | `mosaic` | **HYB ⚠** | API + **MOCK** | oui | ADM | GLB | ⚠ **`galleryImages` (10 photos génériques)** | — | ⚠⚠ **PIRE CAS DU SITE :** la « Galerie de l'album » = `imageSource` + **10 photos du mock `galleryImages`**, présentées **sans aucune mention**. `Publication` **n'a AUCUNE relation de galerie en base** (contrairement à `events`/`departments`) |
| `related` | JSX + `CrossLinks` | — | DYN | API | oui | ADM | GLB | `getPublications()` | — | ⚠ **Contenus associés rendus 2×** (aside + slot `related`) |
| — | *libellés* | — | CODE | JSX | non | — | — | — | — | ⚠ **`typeLabel.VIDEO = "Enseignement"`** → toute vidéo est étiquetée « Enseignement » ; `categoryLabel` dupliqué avec `/actualites` ; `dynamicParams` non déclaré |

---

# 17. `/recherche`

`app/recherche/page.tsx` (5,4 Ko) · **Archétype `InformationPage`** (`dense`) ✅ · 4 emplacements
⚠⚠ **Sources : `@/data/mock/events`, `@/data/mock/departments`, `@/data/mock/publications` — AUCUN appel API**

| Slot | Composant | Type | Source | Admin. | Rôle | Scope | Donnée dynamique | Fallback | Notes |
|---|---|---|---|---|---|---|---|---|---|
| `header` | `HeroPractical` | EDIT | JSX | oui | ADM | GLB | — | — | ✅ |
| `intro` | `Prose` | EDIT | JSX | oui | ADM | GLB | — | — | ⚠ **affirme que médiathèque et ressources « ne sont pas encore publiés »** alors que les mocks qu'elle indexe contiennent déjà 4 MEDIA + 2 RESSOURCE |
| `content` | `SearchClient` | **HYB — BRANCHÉE SUR MOCK** | MOCK | à décider | — | GLB | ⚠ **aucune** | — | ⚠⚠ **L'index est construit depuis les mocks pendant que les pages servent l'API** → **slugs périmés (⇒ `notFound()`) et contenu du Back-Office invisible à la recherche** |
| `related` | `CrossLinks` | EDIT | CODE | oui | ADM | GLB | — | — | ✅ |

**Plafond :** `docs/014` indique **30** résultats. ✅

---

# 18-21. Pages légales

`app/mentions-legales/`, `app/confidentialite/`, `app/conditions/`, `app/accessibilite/` (2,0–2,6 Ko) · **`LegalPage`** ✅ · 3 sections chacune
Source : `verses` (MOCK) + JSX

| Page | Type | Source | Admin. | Rôle | Scope | Notes |
|---|---|---|---|---|---|---|
| `/mentions-legales` | **EDIT** | **JSX littéral** | **oui** | ADM | GLB | ⚠⚠ **2 placeholders PUBLIÉS :** `"Adresse : information à compléter. Contact : information à compléter."` + `"Les coordonnées précises de l'hébergeur seront complétées avant la mise en production."` Pointe vers une route **`/contact` inexistante**, alors que `site.address` est disponible et affiché ailleurs |
| `/confidentialite` | **EDIT** | JSX littéral | oui | ADM | GLB | ⚠ **Contredit `PrayerRequestForm`** : promet un traitement confidentiel des demandes de prière qu'un formulaire simulé ne transmet pas. **Faute publiée :** `"Données susceptible d'être traitées"` |
| `/conditions` | **EDIT** | JSX littéral | oui | ADM | GLB | ✅ Affirmations **exactes** (aucune plateforme de paiement, hébergement vidéo externe). ⚠ `"contactez-nous directement"` **sans lien** — `LegalPage` n'en rend aucun |
| `/accessibilite` | **EDIT** | JSX littéral | oui | ADM | GLB | ⚠ Affirme « Des images décoratives marquées comme telles » — **partiellement vrai** : plusieurs `alt` réels existent (`alt="Pasteur Manasse Mwamba, visionnaire CCJV"`, `` alt={`${activeDept.name} — photo ${gIdx+1}`} ``) |

**Recommandation :** 4 clés `static_pages` (`LEGAL_MENTIONS`, `LEGAL_CONFIDENTIALITE`, `LEGAL_CONDITIONS`, `LEGAL_ACCESSIBILITE`) **ou** un champ JSON partagé. La seconde option évite 4 schémas quasi identiques.

---

# 22. Transverses — layout, navigation, SEO

| Élément | Composant | Type | Source | Admin. | Rôle | Scope | Donnée dynamique | Notes |
|---|---|---|---|---|---|---|---|---|
| Header | `Header` | HYB | MOCK `site` + CODE | partiel | ADM | GLB | — | ✅ Nom + sigle depuis `site` ; navigation depuis `nav.ts` (CODE) |
| Menu plein écran | `FullscreenMenu` | HYB | MOCK `site`, `socials`, `images` | partiel | ADM | GLB | — | ✅ **6 replis d'image codés** ; structure de navigation = CODE |
| Pied de page | `Footer` | HYB | MOCK `site` | partiel | ADM | GLB | — | ✅ Plan du site groupé depuis `nav.ts` |
| Rideau d'introduction | `IntroCurtain` | HYB | MOCK `verses`, `site` | oui | ADM | GLB | `Scripture` | Durée ~1,6 s = **STATIC_CODE** |
| Fil d'Ariane | `Breadcrumbs` | **STATIC** | CODE (`getBreadcrumbs`) | **non** | — | — | — | ✅ Dérivé de `nav.ts` |
| Structure de navigation | `lib/nav.ts` | **STATIC** | CODE | **non** | — | — | — | ⚠ **Entièrement codée en dur** : aucun `icon`, `badge`, `order`, `visible`, ni condition de rôle. `ready` figé à `true` partout ; `primaryNav` = clone identique ; `allDestinations` jamais consommé |
| Sitemap | `app/sitemap.ts` | **STATIC — MAIS ALIMENTÉ PAR MOCK** | MOCK | **non** | — | — | ⚠ **à brancher** | ⚠⚠ Importe `departments` (l.5) et **ne l'utilise jamais** ; construit les URL dynamiques **depuis les mocks, pas depuis l'API** → **17 slugs de démonstration** annoncés |
| `robots.ts` | `app/robots.ts` | STATIC | CODE | non | — | — | — | ✅ |
| SEO / métadonnées | `lib/seo.ts` | EDIT | JSX par page | oui | ADM | GLB | — | ✅ `title` + `description` en dur sur chaque page → **à administrer par `page_key`** |
| Jetons de design | `globals.css` | **STATIC** | CODE | **non** | — | — | — | ✅ `--ccjv-*` : `offwhite`, `cream`, `green`, `green-soft`, `ink`, `ink-secondary`, `line`, `black`. **À GELER** |

---

## Annexe — Tableau de bord des priorités de rapatriement

Ordre de traitement recommandé, du plus rentable au moins rentable.

| Priorité | Cible | Nature | Volume | Bloque |
|---|---|---|---|---|
| **P1** | Brancher `getSettings`, `getScripture`, `getSchedule`, `getPage` | Recâblage | 6 fonctions → 11 pages | Tout le Back-Office éditorial |
| **P1** | `/sitemap.ts` + `/recherche` sur l'API | Recâblage | 2 fichiers | Référencement, recherche |
| **P2** | `/qui-sommes-nous` (30 Ko, 0 API) | Rapatriement | ~14 blocs | La page la plus volumineuse |
| **P2** | Versets en dur → `scriptures` | Unification | **8 occurrences / 7 pages** | Cohérence éditoriale |
| **P2** | Rythme hebdomadaire → `schedule_entries` | Unification | **5 formulations divergentes** | Cohérence factuelle |
| **P3** | `/organisation` (2 versets, 3 étapes, replis) | Rapatriement | 7 sections | Cohérence departements |
| **P3** | Visages : `/qui-sommes-nous` sur `getCommunityFaces()` | Recâblage | 1 page | — |
| **P4** | `Organization` : marqueur « pasteur principal » | Modèle | 1 colonne | Fiabilité de l'affichage |
| **P4** | Galerie de `Publication` | Modèle | 1 table de jointure | Fiche publication |
| **P5** | `/faire-un-don` (100 % en dur) | Rapatriement | 9 sections | Décision produit préalable |
| **P5** | 4 pages légales + `page_key` légales | Rapatriement | 4 fichiers | — |
| **P6** | `HouseGroup` | Décision de modèle | 1 entité | — |
| **P6** | Formulaire de prière | Décision technique | 1 composant | Conformité |
