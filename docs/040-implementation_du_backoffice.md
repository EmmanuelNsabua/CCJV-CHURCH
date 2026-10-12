# PROMPT-GOAL — CCJV BACK-OFFICE
## Implémentation complète et granulaire du frontend d'administration avec Next.js, aperçu public éditable et gestion séparée des contenus

Tu interviens comme **Senior Frontend Engineer, Software Architect et Product Designer** sur le projet CCJV-CHURCH, le site du Centre Chrétien Jésus ma Vie, à Lubumbashi, en RDC.

Ta mission n'est pas de proposer une maquette ni de rédiger une nouvelle spécification. Tu dois **implémenter le frontend du back-office dans le dépôt existant**, avec une interface visuellement aboutie, des parcours utilisateur cohérents, une intégration réelle au backend disponible et une progression rapide vers un résultat présentable.

Le projet est en phase de développement. Le backend existe sur Railway et est connecté à Supabase. Le site public est actuellement utilisé en local et n'est pas encore ouvert au public. L'environnement de production sert également à des essais en conditions réelles.

Nous voulons obtenir des résultats visibles et utilisables dans les prochaines heures. Évite les audits transversaux, les documents préparatoires volumineux, les refactorisations non nécessaires et les fonctionnalités hors périmètre.

---

# 1. ORDRE D'EXÉCUTION OBLIGATOIRE

Avant d'écrire du code, lis les instructions et les compétences disponibles.

## 1.1. Instructions et documentation à consulter

Lis intégralement ou dans la mesure nécessaire à leur application :

- `GEMINI.md` à la racine ;
- `skills/MANIFEST.md` ;
- `docs/010-design_system.md` ;
- `docs/020-conception_backoffice.md` ;
- `docs/024_architecture_logicielle_backend.md` ;
- `docs/029-matrice_rbac.md` ;
- `docs/030-specification_cryptographique_prieres.md` ;
- `docs/037-contrat-design-system-backoffice.md` ;
- `docs/038-plan_implementation_lot8_prieres.md` ;
- `docs/039-audit_harnais_verification.md`.

Consulte également les fichiers réels du frontend, du backend et de Supabase nécessaires pour comprendre les routes API, les modèles, les permissions, les conventions et les composants déjà présents.

Les documents peuvent décrire des fonctionnalités non encore implémentées. **Le code et l'état réel de l'API font foi pour déterminer ce qui peut fonctionner immédiatement.** Ne présente jamais un endpoint supposé comme existant.

## 1.2. Skills à utiliser explicitement

Utilise les skills présents dans `./skills/` en respectant leurs instructions respectives.

| Skill | Utilisation attendue |
|---|---|
| `frontend-design` | Concevoir une interface de qualité produit, cohérente avec l'identité CCJV, sans aspect de tableau de bord générique. |
| `vercel-react-best-practices` | Appliquer les bonnes pratiques React, Next.js, rendu, chargement des données et performances. |
| `web-design-guidelines` | Contrôler l'accessibilité, la hiérarchie visuelle, la navigation, les états et les interactions. |
| `composition-patterns` | Créer des composants composables et des primitives réutilisables sans multiplier les abstractions inutiles. |
| `webapp-testing` | Tester les parcours principaux, les formulaires, la navigation, les états et les interactions réelles. |

Ne te contente pas de mentionner ces skills dans le rapport. Lis leurs instructions et applique-les au code livré.

Si un skill recommande une approche contraire au contrat de design ou aux règles métier du projet, respecte d'abord les contraintes spécifiques du projet.

---

# 2. CONTRAINTES TECHNIQUES NON NÉGOCIABLES

## 2.1. Stack existante

Conserve la stack en place :

- Next.js 15.5.26 et App Router ;
- React 19.1 ;
- TypeScript strict ;
- Tailwind CSS 4.3.3 ;
- Supabase Auth ;
- API REST du backend Express sous `/api/v1` ;
- Railway pour le backend ;
- Vercel pour le frontend, selon la configuration existante.

Utilise les versions réellement présentes dans le dépôt. N'effectue aucune mise à niveau majeure pour cette mission.

Le frontend ne doit jamais accéder directement à PostgreSQL, utiliser Drizzle pour accéder à la base, ni exposer une clé de service Supabase dans le navigateur.

Toute opération métier persistante doit passer par l'API backend autorisée ou par le mécanisme Supabase explicitement prévu dans l'architecture.

## 2.2. Design system CCJV

Respecte `docs/037-contrat-design-system-backoffice.md` et le système de design existant.

Palette de référence :

- Vert CCJV : `#1e7a1e`
- Vert soutenu : `#176317`
- Vert doux : `#eaf3ea`
- Crème : `#ede4c8`
- Noir : `#121212`
- Blanc cassé : `#fafaf7`
- Texte principal : `#1a1a1a`
- Texte secondaire : `#5e5d59`
- Bordures : `#e5e2d9`

Typographie :
- Inter pour les interfaces fonctionnelles ;
- Lora pour les titres éditoriaux et les aperçus publics, lorsque cohérent avec les styles existants.

Règles :
- bordures fines ;
- angles carrés par défaut ;
- ombres limitées ;
- espaces réguliers ;
- densité équilibrée ;
- icônes `lucide-react` ;
- formulaires natifs améliorés ;
- tableaux conçus sur mesure ;
- focus clavier visible ;
- animations discrètes et respect de `prefers-reduced-motion`.

Réutilise les composants existants : `Button`, `Badge`, `EmptyState`, `PageHeader` et toute autre primitive pertinente.

Respecte les variantes, tailles et états documentés dans le contrat. Ne crée pas un deuxième design system parallèle.

---

# 3. VISION PRODUIT

Le back-office est un outil éditorial et administratif pour une équipe d'église. Il doit permettre de gérer le site sans connaissances techniques.

Il comprend quatre zones fonctionnelles :

1. **Tableau de bord** : aperçu de l'activité et accès rapide aux actions.
2. **Pages du site** : aperçu proche du site public et édition contextuelle des éléments statiques.
3. **Contenus dynamiques** : gestion indépendante des publications, événements, témoignages et autres ressources prises en charge par le backend.
4. **Administration et bibliothèque** : accès aux fonctions de gestion effectivement prévues par l'architecture et autorisées par le rôle.

La distinction fondamentale est la suivante :

**Une page publique est une composition de sections statiques et de blocs dynamiques. L'éditeur de pages modifie les données éditoriales statiques autorisées ; les blocs dynamiques ouvrent leur espace de gestion spécialisé.**

Exemple :

Une page « Communauté » peut afficher :
- un titre ;
- un texte d'introduction ;
- une image de couverture ;
- un texte de présentation ;
- une liste d'événements ;
- des témoignages.

Le titre, l'introduction, la couverture et le texte de présentation sont éditables dans l'aperçu de la page.

La liste d'événements et les témoignages sont affichés comme ils le seraient sur le site public, mais ils ne peuvent pas être modifiés depuis cette vue. Des actions discrètes permettent d'ouvrir les espaces « Agenda » ou « Témoignages ».

**Il est interdit de créer un éditeur générique permettant de modifier arbitrairement la structure, les composants ou le code du site.**

---

# 4. ARCHITECTURE GÉNÉRALE DU BACK-OFFICE

Préserve les routes publiques et le site existant. Intègre le back-office dans un espace clairement séparé, par exemple sous `/admin`, en vérifiant d'abord la structure réelle du projet et les routes déjà utilisées.

Organisation cible indicative, à adapter à l'existant :

- `/admin/login`
- `/admin`
- `/admin/pages`
- `/admin/pages/[slug]`
- `/admin/publications`
- `/admin/publications/new`
- `/admin/publications/[id]`
- `/admin/agenda`
- `/admin/agenda/new`
- `/admin/agenda/[id]`
- `/admin/testimonials`
- `/admin/testimonials/new`
- `/admin/testimonials/[id]`
- `/admin/media`
- `/admin/departments`
- `/admin/settings`

Ces routes constituent une vision cible, pas la preuve que toutes les ressources sont déjà disponibles dans l'API. Pour chaque module, vérifie les endpoints et les contrats existants. Si une fonctionnalité n'est pas prise en charge par le backend, ne simule pas sa persistance.

Les pages peuvent être réalisées progressivement. Le premier lot doit fournir une expérience cohérente de connexion, navigation, tableau de bord, pages statiques et publications.

## 4.1. Shell desktop

Crée une interface administrative avec :

- une sidebar fixe ou persistante de 260 px ;
- une topbar de 60 px ;
- une zone de contenu flexible ;
- une largeur et des espacements cohérents ;
- des titres de page alignés ;
- des actions principales visibles et prévisibles.

### Sidebar

En haut :
- identité CCJV ;
- libellé « Administration » ;
- séparateur fin.

Navigation :

**Vue d'ensemble**
- Tableau de bord

**Contenu du site**
- Pages du site
- Publications
- Agenda
- Témoignages
- Bibliothèque média

**Organisation**
- Départements
- Paramètres, uniquement si autorisés et effectivement pris en charge.

Chaque entrée possède :
- une icône Lucide pertinente ;
- un libellé explicite ;
- un état actif lisible ;
- un état de survol discret ;
- une indication de permission ou une absence de visibilité selon les règles RBAC.

En bas :
- identité de l'utilisateur connecté ;
- rôle et département si pertinent ;
- action de déconnexion.

Ne montre pas les menus interdits à un rôle, sauf si la matrice RBAC prévoit explicitement une visibilité en lecture seule.

### Topbar

Elle comprend :
- le titre ou fil d'Ariane de la page ;
- un indicateur discret d'environnement lorsque disponible ;
- un accès au site public ;
- l'identité de l'utilisateur ;
- éventuellement une action de déconnexion ou un menu utilisateur.

Ne crée pas un centre de notifications factice.

## 4.2. Responsive

Desktop : sidebar persistante.

Tablette : sidebar compacte ou repliable.

Mobile : tiroir de navigation avec :
- fermeture par bouton ;
- fermeture par Échap ;
- gestion du focus ;
- arrière-plan interactif désactivé lorsque le tiroir est ouvert ;
- navigation utilisable au toucher.

Les tableaux doivent rester utilisables sur petits écrans, avec une stratégie de défilement horizontal ou de présentation en cartes lorsque cela est pertinent.

---

# 5. PAGE DE CONNEXION

Route : `/admin/login`, sous réserve de compatibilité avec les routes existantes.

Créer une page sobre, soignée et cohérente avec l'identité CCJV.

Composition :

- identité de l'église ;
- titre « Administration CCJV » ;
- sous-titre « Connectez-vous pour gérer les contenus du site » ;
- champ email ;
- champ mot de passe ;
- contrôle d'affichage du mot de passe ;
- bouton de connexion ;
- état de chargement ;
- erreurs compréhensibles ;
- gestion de la session existante ;
- redirection après authentification.

Utilise Supabase Auth conformément à l'implémentation déjà présente.

Contraintes :
- aucun compte fictif ;
- aucun contournement d'authentification ;
- aucun mot de passe codé en dur ;
- aucun secret côté navigateur ;
- aucune redirection basée uniquement sur un rôle supposé.

Après connexion, récupère la session et les permissions selon les mécanismes existants.

Une route protégée doit vérifier l'authentification. Le backend reste l'autorité pour toutes les autorisations métier.

Si la session expire, affiche un état explicite et propose de se reconnecter.

---

# 6. TABLEAU DE BORD

Route : `/admin`.

Le tableau de bord doit immédiatement donner une impression de produit opérationnel, pas de template de démonstration.

## 6.1. En-tête

- titre « Tableau de bord » ;
- phrase courte de bienvenue ;
- date du jour, si pertinente ;
- bouton principal « Créer une publication », seulement si l'utilisateur possède cette permission.

## 6.2. Indicateurs

Afficher uniquement des indicateurs fondés sur des données réellement accessibles :

- publications publiées ;
- brouillons ;
- événements à venir ;
- contenus nécessitant une action, si cette donnée est réellement disponible.

Chaque indicateur possède :
- un libellé ;
- une valeur ;
- une explication concise ;
- un lien vers le module correspondant.

Ne fabrique pas de chiffres pour donner l'impression d'une activité réelle.

Si les endpoints d'agrégation n'existent pas, exploite les listes déjà disponibles et leurs métadonnées lorsque cela suffit. Sinon, affiche un état honnête : « Indicateur indisponible ».

## 6.3. Activité récente

Afficher une liste compacte des dernières publications ou modifications uniquement si l'API fournit ces informations.

Chaque ligne indique :
- type de contenu ;
- titre ;
- statut ;
- date ;
- lien vers la gestion du contenu.

## 6.4. Actions rapides

Prévoir des accès vers :
- gérer les pages ;
- créer une publication ;
- gérer l'agenda ;
- ouvrir la bibliothèque média.

Masquer ou désactiver les actions que le rôle ne peut pas effectuer.

## 6.5. États de chargement et d'erreur

Prévoir :
- skeletons discrets ;
- état vide avec explication et action utile ;
- erreur de chargement avec possibilité de réessayer ;
- message de session expirée ;
- état de permissions insuffisantes.

Ne pas afficher un tableau de bord vide sans explication.

---

# 7. MODULE CENTRAL : PAGES DU SITE

Routes :
- `/admin/pages`
- `/admin/pages/[slug]`

C'est la fonctionnalité visuelle prioritaire du projet.

L'objectif est de permettre à un administrateur autorisé de reconnaître la page publique, de sélectionner un élément statique, de modifier son contenu et de comprendre le rendu avant d'enregistrer.

## 7.1. Liste des pages

Créer une grille ou une liste éditoriale claire présentant les pages existantes du site.

Pour chaque page :
- titre ;
- chemin public ;
- miniature ou aperçu si disponible ;
- courte description ;
- date de dernière modification si disponible ;
- action « Modifier » ;
- action « Voir la page publique ».

Afficher uniquement les pages effectivement identifiées dans le projet.

Ne fabrique pas une liste de pages imaginaires. Inspecte les routes publiques et les documents de conception.

La page doit distinguer :
- page disponible à l'édition ;
- page consultable mais non éditable ;
- page dont le contenu n'est pas encore pris en charge par le backend.

Ne donne pas à l'utilisateur l'impression qu'une page peut être enregistrée si le mécanisme de persistance n'existe pas.

## 7.2. Éditeur de page : composition visuelle

Sur `/admin/pages/[slug]`, crée un éditeur à trois zones sur grand écran :

**Zone gauche — Structure de la page**
- liste ordonnée des sections éditoriales reconnues ;
- nom explicite de chaque section ;
- sélection d'une section ;
- indication « Statique » ou « Dynamique » ;
- ordre réel des sections, sans réorganisation arbitraire.

**Zone centrale — Aperçu public**
- rendu aussi fidèle que possible à la page publique réelle ;
- respect du système de design public ;
- typographie, images, espacements et compositions cohérents ;
- navigation et footer publics conservés dans l'aperçu lorsque pertinents ;
- possibilité de simuler les largeurs desktop, tablette et mobile.

**Zone droite — Inspecteur de contenu**
- champs correspondant à l'élément sélectionné ;
- titre du champ ;
- valeur actuelle ;
- aide contextuelle concise ;
- compteur de caractères lorsque pertinent ;
- validation ;
- état de sauvegarde.

Sur petit écran, transformer ces zones en vues ou panneaux adaptés plutôt que réduire trois colonnes illisibles.

## 7.3. Édition contextuelle directe

Dans l'aperçu, les éléments statiques éditables doivent être sélectionnables.

Au survol ou au focus :
- afficher un contour vert fin ;
- afficher une petite action « Modifier » ou une icône de crayon ;
- conserver autant que possible l'apparence de la page publique.

Au clic :
- sélectionner l'élément ;
- afficher ses champs dans l'inspecteur ;
- indiquer visuellement quel élément est sélectionné ;
- synchroniser les champs avec l'aperçu.

Pour un titre, l'utilisateur doit pouvoir modifier le texte dans l'inspecteur et voir immédiatement le résultat dans l'aperçu.

Pour une image, l'utilisateur doit pouvoir ouvrir le sélecteur de média, choisir une image autorisée, voir la nouvelle image dans l'aperçu, puis enregistrer.

Ne mets pas systématiquement des champs de formulaire sur la page publique. L'édition doit rester une couche administrative activée dans le back-office.

Ne remplace pas le rendu public par une page entièrement réinventée pour l'administration. Réutilise les composants de rendu public lorsque cela est techniquement possible.

## 7.4. Types de champs statiques à prendre en charge

Selon les champs réellement présents dans le modèle éditorial :

- titre ;
- surtitre ;
- sous-titre ;
- paragraphe ;
- texte de présentation ;
- libellé de bouton ;
- lien de bouton ;
- texte alternatif d'image ;
- image de couverture ;
- image d'illustration ;
- citation statique ;
- libellé de section ;
- coordonnées éditoriales si elles font partie du modèle.

N'ajoute pas des champs arbitraires simplement parce qu'ils semblent utiles.

Pour les images :
- utiliser la bibliothèque média existante si elle est disponible ;
- afficher une prévisualisation ;
- montrer les dimensions ou le ratio lorsqu'ils sont connus ;
- permettre de remplacer l'image ;
- permettre de modifier son texte alternatif ;
- vérifier les permissions d'utilisation du média ;
- ne pas transformer l'URL d'une image en valeur persistée si le contrat attend un identifiant média.

Pour les liens :
- valider les URL ;
- distinguer les routes internes des liens externes ;
- empêcher les valeurs dangereuses ;
- préserver le contrat existant.

## 7.5. Sauvegarde

L'éditeur doit gérer explicitement :
- modifications non enregistrées ;
- sauvegarde en cours ;
- sauvegarde réussie ;
- échec de sauvegarde ;
- conflits ou données devenues obsolètes, si détectables ;
- confirmation avant de quitter avec des modifications non enregistrées.

La sauvegarde doit persister sur le backend.

Si le backend ne permet pas encore de modifier les champs statiques, ne crée pas une fausse sauvegarde dans `localStorage` et ne prétends pas que les changements sont enregistrés.

Dans ce cas :
1. construis l'expérience d'édition ;
2. isole le contrat d'accès aux données ;
3. affiche clairement le caractère non persistant des champs concernés ;
4. identifie précisément l'endpoint ou le champ manquant ;
5. conserve le reste du back-office fonctionnel.

Ne change pas le schéma de données dans cette mission sans autorisation explicite.

## 7.6. Garde-fou essentiel : pages statiques contre blocs dynamiques

Les sections statiques sont éditables lorsqu'elles sont explicitement prises en charge.

Les blocs dynamiques sont affichés dans l'aperçu mais ne sont pas modifiables dans l'inspecteur statique.

Exemples :
- une section affichant les dernières publications ;
- un calendrier d'événements ;
- une liste de témoignages ;
- une galerie générée à partir de la bibliothèque ;
- un bloc alimenté par une API.

Lorsqu'un bloc dynamique est sélectionné :
- afficher une information « Contenu géré séparément » ;
- afficher le nom de son module de gestion ;
- proposer une action « Ouvrir la gestion » si le rôle y a accès ;
- ne pas exposer de champs de modification de son contenu dans l'éditeur de page.

La structure, l'ordre et le type de ces blocs ne sont pas librement modifiables depuis cet écran.

---

# 8. MODULE PUBLICATIONS

Routes :
- `/admin/publications`
- `/admin/publications/new`
- `/admin/publications/[id]`

Ce module gère les publications éditoriales, indépendamment de l'éditeur de pages.

## 8.1. Liste

Créer une table avec :
- titre ;
- département ;
- statut ;
- date de publication ;
- dernière modification si disponible ;
- auteur si disponible ;
- actions.

Filtres :
- statut ;
- département ;
- recherche par titre ;
- période uniquement si les données nécessaires sont disponibles.

Prévoir :
- pagination si prise en charge par l'API ;
- tri si prise en charge par l'API ;
- état vide ;
- état de chargement ;
- erreur avec réessai ;
- actions selon les permissions.

Ne mets pas en place une pagination purement locale en prétendant qu'elle correspond à une pagination serveur.

## 8.2. Création et modification

Formulaire comprenant, selon le modèle réel :
- titre ;
- slug si prévu ;
- extrait ;
- corps du contenu ;
- image de couverture ;
- département ;
- statut ;
- date de publication si prévue.

Les champs obligatoires doivent être clairement identifiés.

Le formulaire doit :
- valider les données ;
- signaler les erreurs près des champs ;
- empêcher les doubles soumissions ;
- confirmer les sauvegardes ;
- préserver les modifications en cas d'erreur serveur lorsque possible.

## 8.3. Statuts

Respecter les statuts métier existants :
- `DRAFT` ;
- `PUBLISHED` ;
- `ARCHIVED`.

Le frontend ne décide pas de la règle du quota. Le backend reste responsable de l'application de la limite globale de trois publications publiées et de l'archivage automatique de la plus ancienne.

Si une publication est archivée automatiquement, rafraîchir l'état à partir de la réponse API et informer l'utilisateur de ce que le backend confirme.

Ne simule pas une publication réussie avant confirmation du serveur.

## 8.4. Permissions

Un responsable de département ne peut agir que dans le périmètre autorisé.

Ne lui permets pas de changer arbitrairement le département d'une publication.

Les règles finales sont appliquées par le backend, même si le frontend masque ou désactive les contrôles interdits.

---

# 9. MODULE AGENDA

Routes cibles :
- `/admin/agenda`
- `/admin/agenda/new`
- `/admin/agenda/[id]`

Avant d'implémenter, vérifie le modèle et les endpoints réellement disponibles.

## 9.1. Vue liste

Présenter les événements sous forme de liste claire avec :
- titre ;
- date et heure ;
- lieu si disponible ;
- département organisateur ;
- statut ;
- action d'édition.

Prévoir des filtres utiles :
- à venir ;
- passés ;
- département ;
- recherche.

Une vue calendrier mensuelle peut être ajoutée uniquement si elle est utile et raisonnablement implémentable sans dépendance superflue. La liste reste le parcours de référence.

## 9.2. Formulaire événement

Selon le contrat réel :
- titre ;
- description ;
- début ;
- fin si prévue ;
- lieu ;
- image ;
- département ;
- statut.

Gérer correctement les dates, les fuseaux horaires et les erreurs de validation.

Le contenu des événements ne doit jamais être modifiable depuis l'éditeur des pages statiques.

Si l'API n'est pas disponible, ne construis pas un CRUD factice : prépare l'interface et documente précisément le blocage.

---

# 10. MODULE TÉMOIGNAGES

Routes cibles :
- `/admin/testimonials`
- `/admin/testimonials/new`
- `/admin/testimonials/[id]`

Ce module doit être distinct de l'éditeur de pages.

Après inspection du backend, construire une interface de gestion adaptée au modèle existant :
- contenu ou extrait du témoignage ;
- attribution ou nom affiché, si le modèle le prévoit ;
- statut ;
- date ;
- éventuelle image ;
- actions autorisées.

Les témoignages ne doivent pas être modifiables dans l'aperçu des pages statiques.

N'invente pas de fonctionnalités de modération, de publication ou de consentement qui ne correspondent pas au modèle existant.

Si le backend ne gère pas encore les témoignages, ne crée pas une persistance artificielle. Affiche le module comme indisponible ou non connecté, et continue le reste de la mission.

---

# 11. BIBLIOTHÈQUE MÉDIA

Route : `/admin/media`.

La bibliothèque doit fournir un espace central de consultation et de sélection des médias autorisés.

## 11.1. Présentation

Créer une grille d'images soignée avec :
- miniature ;
- nom du fichier ;
- format ou type ;
- dimensions si disponibles ;
- date d'ajout si disponible ;
- aperçu plus grand ;
- recherche ou filtre si le backend le permet.

Prévoir un état vide utile et un état de chargement.

## 11.2. Sélection depuis l'éditeur de pages

Lorsqu'un utilisateur choisit une image dans l'éditeur :
- ouvrir une fenêtre ou un panneau de sélection ;
- permettre de sélectionner un média autorisé ;
- afficher une prévisualisation ;
- confirmer la sélection ;
- revenir à l'élément édité ;
- mettre à jour l'aperçu avant sauvegarde.

## 11.3. Permissions des médias

Respecter la politique média existante, notamment les droits distincts :
- `USE` ;
- `MANAGE` ;
- `DELETE`.

Le fait d'avoir téléversé un média ne signifie pas automatiquement que l'utilisateur peut l'utiliser partout.

Ne crée pas de champ `department_id` dans le modèle `Media` pour simplifier l'interface.

Ne permets pas la suppression d'un média sans autorisation effective.

Si l'upload est disponible, intégrer le flux réel Supabase Storage/API existant. Sinon, afficher une action non disponible plutôt qu'un upload fictif.

---

# 12. MODULE DÉPARTEMENTS

Route : `/admin/departments`.

La liste canonique des départements du projet est :

- Les Serviteurs ;
- Chorale Grand Groupe CCVJ ;
- Chorale de Cano Vocal ;
- L'Ecodume ;
- Affaires Sociales ;
- Hygiène et Ancienneté ;
- Protocole ;
- Évangélisation ;
- Intercession ;
- Presse.

Utilise les identifiants et libellés canoniques du backend. N'invente pas de nouvelles entités et ne réintroduis pas des noms obsolètes.

Ce module doit rester un espace d'administration limité aux données réellement prises en charge.

Pour un responsable de département :
- afficher son département autorisé ;
- ne pas exposer les départements étrangers ;
- ne pas proposer de changement de périmètre ;
- ne pas donner accès à la structure technique du site.

Pour les rôles administratifs supérieurs, afficher les informations autorisées par la matrice RBAC.

Ne crée pas de CRUD de départements si le modèle est fixe et qu'aucune API ne le permet. Dans ce cas, une page informative en lecture seule est suffisante ou le lien peut être masqué.

---

# 13. PARAMÈTRES ET PROFIL

Route cible : `/admin/settings`.

N'implémente que les paramètres déjà prévus par le projet et pris en charge par une API existante.

Le profil peut afficher :
- nom ou identité de l'utilisateur ;
- email ;
- rôle ;
- département, le cas échéant ;
- état de session.

Ne permets pas de modifier le rôle, le département ou les permissions depuis un formulaire ordinaire.

Ne crée pas une gestion complète des utilisateurs si elle n'est pas déjà définie et autorisée.

Le changement de mot de passe, la récupération de compte et les paramètres Supabase doivent suivre les mécanismes de sécurité réellement existants.

---

# 14. RBAC ET SÉCURITÉ FRONTEND

La matrice de référence est `docs/029-matrice_rbac.md` ou son chemin réel dans le dépôt.

Les rôles à respecter comprennent notamment :
- `SUPER_ADMIN` ;
- `ADMIN` ;
- `DEPARTMENT_MANAGER`.

Le comportement exact doit être dérivé de la matrice RBAC existante.

## Contraintes impératives

- Les permissions doivent être centralisées dans une couche frontend cohérente.
- Ne duplique pas des conditions de rôle différentes dans chaque composant.
- Ne considère jamais le masquage d'un bouton comme une protection suffisante.
- Le backend demeure l'autorité pour les permissions et les règles métier.
- Les responsables de département restent limités à leur département.
- Le `SUPER_ADMIN` ne doit pas pouvoir connaître l'existence, le nombre ou les dates des demandes de prière.
- Aucun écran ne doit exposer indirectement des informations interdites à un rôle.
- N'implémente pas le Lot 8 ni d'interface de gestion des demandes de prière dans cette mission.

Si une permission ne peut pas être vérifiée avec fiabilité, applique le comportement le plus restrictif et signale le blocage.

---

# 15. CLIENT API ET GESTION DE SESSION

Inspecte `frontend/src/lib/api/client.ts` et les utilitaires existants avant toute modification.

Centralise la communication avec le backend.

Le client doit :
- utiliser la base URL de l'API configurée dans les variables d'environnement ;
- transmettre le jeton Supabase lorsque l'endpoint le nécessite ;
- gérer correctement les réponses JSON et les erreurs HTTP ;
- distinguer les erreurs de validation, d'authentification, d'autorisation et les erreurs serveur ;
- permettre aux composants de présenter des messages utiles ;
- éviter de dupliquer la logique réseau dans les pages.

N'ajoute pas un deuxième client HTTP sans justification.

Ne place pas de secret dans les variables `NEXT_PUBLIC_*`.

N'utilise pas de fausses données en production pour masquer une réponse API vide ou en erreur.

Si des données de démonstration sont nécessaires pour un état de maquette locale, elles doivent être explicitement isolées et ne jamais être présentées comme des données persistées.

---

# 16. COMPOSANTS RÉUTILISABLES À LIVRER

Enrichis les composants existants plutôt que de les remplacer arbitrairement.

Créer ou compléter, selon les besoins réels :

- `AdminShell` ;
- `AdminSidebar` ;
- `AdminTopbar` ;
- `AdminPageHeader` ;
- `AdminBreadcrumbs` ;
- `PermissionGate` ;
- `SessionProvider` ou équivalent conforme à l'architecture existante ;
- `DataTable` ;
- `StatusBadge` ou mappings de statut réutilisables ;
- `EmptyState` ;
- `LoadingState` ;
- `ErrorState` ;
- `ConfirmDialog` ;
- `FormField` ;
- `MediaPicker` ;
- `PagePreview` ;
- `EditableContentOverlay` ;
- `StaticContentInspector` ;
- `DynamicBlockNotice` ;
- `UnsavedChangesGuard`.

Cette liste indique les responsabilités attendues, pas une obligation de créer un fichier pour chaque élément.

Les composants doivent être cohérents, typés, testables et réellement réutilisés.

Évite :
- les composants géants ;
- les abstractions prématurées ;
- les duplications de formulaires ;
- les props sans utilité ;
- les états globaux inutiles ;
- les bibliothèques supplémentaires lorsque le stack actuel suffit.

N'ajoute `lucide-react` que si cette dépendance n'est pas déjà installée.

---

# 17. PRIORISATION POUR OBTENIR UN RÉSULTAT VISIBLE RAPIDEMENT

Tu dois travailler en lots successifs et laisser le dépôt dans un état fonctionnel à la fin de chaque lot.

## Lot A — Fondation visible

À implémenter en premier :
- shell administratif ;
- sidebar et topbar ;
- responsive ;
- page de connexion reliée à Supabase Auth ;
- protection des routes ;
- gestion de session ;
- client API centralisé ;
- tableau de bord connecté aux données disponibles.

Critère de fin : un utilisateur autorisé peut se connecter et naviguer dans une interface cohérente.

## Lot B — Publications opérationnelles

À implémenter ensuite :
- liste des publications ;
- recherche et filtres compatibles avec l'API ;
- création ;
- modification ;
- statuts ;
- gestion des erreurs ;
- permissions.

Critère de fin : un utilisateur autorisé peut réellement gérer les publications via Railway, avec les changements persistés dans Supabase/PostgreSQL par le backend.

## Lot C — Pages statiques et aperçu éditable

À implémenter ensuite :
- liste des pages existantes ;
- rendu fidèle ;
- sections reconnues ;
- sélection d'éléments ;
- inspecteur ;
- édition des textes ;
- sélection d'images ;
- sauvegarde réelle lorsque le backend le permet ;
- distinction visuelle et fonctionnelle entre éléments statiques et dynamiques.

Critère de fin : un utilisateur peut sélectionner un élément statique et voir l'édition se refléter dans l'aperçu. La sauvegarde doit être réellement persistante pour être considérée opérationnelle.

## Lot D — Agenda, témoignages et bibliothèque

À implémenter uniquement sur la base des contrats API disponibles.

Ne retarde pas les lots A à C pour construire des modules dont le backend n'est pas prêt.

## Lot E — Finition

- accessibilité ;
- responsive ;
- tests des parcours principaux ;
- gestion des états ;
- correction des erreurs ;
- contrôle du design system ;
- build et lint.

**Ne commence pas tous les lots simultanément.** Termine d'abord un parcours de bout en bout, puis poursuis.

Si une dépendance bloque un lot, poursuis les parties indépendantes au lieu d'interrompre tout le travail.

---

# 18. TESTS ET CRITÈRES D'ACCEPTATION

Les tests doivent refléter des interactions réelles et les contrats existants.

## Authentification
- utilisateur non connecté redirigé vers la connexion ;
- connexion valide ;
- erreur de connexion affichée ;
- session restaurée selon le comportement existant ;
- déconnexion effective ;
- accès refusé aux routes interdites.

## Publications
- liste réelle ;
- état vide ;
- erreur API ;
- création ;
- modification ;
- statut ;
- permissions ;
- aucun succès affiché avant confirmation du backend.

## Éditeur de pages
- liste des pages ;
- aperçu ;
- sélection d'un élément statique ;
- modification d'un texte ;
- modification d'une image ;
- synchronisation de l'inspecteur et de l'aperçu ;
- sauvegarde ;
- gestion d'erreur ;
- avertissement avant de quitter avec des modifications non enregistrées ;
- bloc dynamique non éditable depuis l'inspecteur statique ;
- navigation vers le module de gestion dynamique correspondant.

## Qualité
- TypeScript strict ;
- lint ;
- build ;
- tests ciblés ;
- vérification responsive ;
- vérification clavier ;
- contrôle des erreurs de console et des requêtes réseau.

Utilise le skill `webapp-testing` et les outils déjà présents dans le dépôt. N'ajoute pas une infrastructure de tests disproportionnée.

Si un test dépend d'une API indisponible, signale-le clairement. Ne remplace pas silencieusement le test réel par une simulation.

---

# 19. RÈGLES D'EXÉCUTION

Tu es autorisé à implémenter directement le frontend dans le dépôt.

Tu dois :
- inspecter l'existant avant d'écrire ;
- préserver les routes publiques ;
- préserver les composants et les styles qui fonctionnent ;
- éviter les changements de backend non nécessaires ;
- ne pas modifier les migrations ;
- ne pas créer de nouvelles fonctionnalités métier ;
- ne pas refactoriser l'ensemble du projet ;
- ne pas supprimer des routes simplement parce qu'elles ne sont pas utilisées par le back-office ;
- ne pas exposer les secrets ;
- ne pas créer de fausse persistance ;
- ne pas considérer une réponse simulée comme une intégration réelle.

Le site public étant en cours de développement, l'environnement peut être modifié pour tester l'intégration. Néanmoins, distingue clairement les opérations locales, celles effectuées sur Railway et celles qui modifient des données Supabase. Ne lance pas de migration destructive et ne réinitialise aucune base.

Les modifications doivent rester additives et ciblées autant que possible.

Aucun commit ne doit être créé sans instruction explicite.

---

# 20. RAPPORT FINAL OBLIGATOIRE

À la fin de la mission, fournis un rapport synthétique avec :

## A. Résultat visuel
- routes réellement créées ;
- vues terminées ;
- composants importants ;
- description de l'expérience utilisateur obtenue.

## B. Fonctionnalités opérationnelles
Pour chaque module, préciser :
- connecté au backend ;
- partiellement connecté ;
- interface seulement ;
- bloqué par une API manquante.

## C. Intégration technique
- méthode d'authentification ;
- client API utilisé ;
- gestion des permissions ;
- endpoints effectivement consommés ;
- variables d'environnement nécessaires, sans afficher leurs secrets.

## D. Vérifications
- tests exécutés ;
- résultats ;
- lint ;
- TypeScript ;
- build ;
- problèmes restants.

## E. Blocages précis
Si une fonctionnalité est bloquée, indique :
- le champ ou endpoint manquant ;
- le fichier concerné ;
- la conséquence visible pour l'utilisateur ;
- le plus petit changement nécessaire pour débloquer la fonctionnalité.

## F. État final
Choisir :
- **OPÉRATIONNEL** : le parcours principal est utilisable et connecté au backend ;
- **PARTIELLEMENT OPÉRATIONNEL** : l'interface existe mais certaines fonctions importantes restent bloquées ;
- **BLOQUÉ** : une dépendance majeure empêche la démonstration.

N'annonce jamais une fonctionnalité comme opérationnelle si elle n'a pas été exécutée et vérifiée.

---

# OBJECTIF FINAL

Livrer un back-office CCJV immédiatement présentable, visuellement cohérent avec le site public, structuré autour d'une navigation claire et capable d'utiliser les fonctionnalités réellement disponibles du backend.

La priorité est un parcours complet et réel : **connexion → tableau de bord → gestion des publications → aperçu public des pages avec édition contextuelle des contenus statiques**.

L'éditeur doit donner à l'équipe la sensation de travailler directement sur le site public, tout en garantissant que les contenus dynamiques restent gérés dans leurs modules respectifs.

Privilégie un produit fonctionnel et cohérent plutôt qu'une accumulation d'écrans superficiels. Commence maintenant par les instructions et le code existant, puis implémente les lots dans l'ordre défini, sans attendre une validation intermédiaire de ma part.