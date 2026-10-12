export interface EditableFieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "url";
  placeholder?: string;
  hint?: string;
}

export interface EditableSectionDef {
  id: string;
  title: string;
  description: string;
  isDynamic?: false;
  fields: EditableFieldDef[];
}

export interface DynamicBlockDef {
  id: string;
  title: string;
  description: string;
  isDynamic: true;
  managementRoute: string;
  managementLabel: string;
}

export type PageSectionItem = EditableSectionDef | DynamicBlockDef;

export interface PageRegistryItem {
  slug: string;
  title: string;
  publicPath: string;
  description: string;
  sections: PageSectionItem[];
  defaultContent: Record<string, string>;
}

export const PAGES_REGISTRY: Record<string, PageRegistryItem> = {
  accueil: {
    slug: "accueil",
    title: "Page d'Accueil",
    publicPath: "/",
    description: "Page principale du site CCJV, affichant la bannière héro, le verset d'ouverture et l'introduction.",
    defaultContent: {
      "hero.title": "Une église vivante pour un Dieu vivant",
      "hero.subtitle": "Bienvenue au Centre Chrétien Jésus ma Vie à Lubumbashi. Nous vous accueillons dans la communion fraternelle, la louange et la Parole vivante.",
      "hero.badge": "Centre Chrétien Jésus ma Vie • Lubumbashi",
      "hero.ctaPrimaryText": "Découvrir nos cultes",
      "hero.ctaSecondaryText": "Demande d'intercession",
      "verset.verseText": "Car Dieu a tant aimé le monde qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu'il ait la vie éternelle.",
      "verset.verseReference": "Jean 3:16",
      "presentation.sectionTitle": "Qui sommes-nous ?",
      "presentation.paragraph1": "Le Centre Chrétien Jésus ma Vie est une communauté chrétienne engagée dans l'annonce fidèle de l'Évangile de Jésus-Christ.",
      "presentation.paragraph2": "Chaque dimanche et tout au long de la semaine, nous nous rassemblons pour célébrer notre Seigneur et grandir ensemble dans la foi.",
      "banner.bannerTitle": "Venez célébrer le Seigneur avec nous",
      "banner.bannerSubtitle": "Cultes chaque dimanche matin à Lubumbashi. Tout le monde est bienvenu.",
    },
    sections: [
      {
        id: "hero",
        title: "Bannière Héro & Accueil",
        description: "Titre d'impact, phrase d'introduction et boutons d'action au sommet de la page.",
        fields: [
          { key: "hero.title", label: "Titre principal", type: "text" },
          { key: "hero.subtitle", label: "Sous-titre d'accueil", type: "textarea" },
          { key: "hero.badge", label: "Badge d'en-tête", type: "text" },
          { key: "hero.ctaPrimaryText", label: "Texte du bouton principal", type: "text" },
          { key: "hero.ctaSecondaryText", label: "Texte du bouton secondaire", type: "text" },
        ],
      },
      {
        id: "verset",
        title: "Verset du Moment",
        description: "Passage biblique mis en avant sur la page d'accueil.",
        fields: [
          { key: "verset.verseText", label: "Texte du verset", type: "textarea" },
          { key: "verset.verseReference", label: "Référence biblique (Livre Chapitre:Verset)", type: "text" },
        ],
      },
      {
        id: "presentation",
        title: "Présentation Éditoriale",
        description: "Texte de bienvenue et présentation générale de l'église.",
        fields: [
          { key: "presentation.sectionTitle", label: "Titre de section", type: "text" },
          { key: "presentation.paragraph1", label: "Premier paragraphe", type: "textarea" },
          { key: "presentation.paragraph2", label: "Second paragraphe", type: "textarea" },
        ],
      },
      {
        id: "upcoming_events",
        title: "Bloc Dynamique : Prochains Cultes & Événements",
        description: "Ce bloc affiche automatiquement les prochains rassemblements programmés.",
        isDynamic: true,
        managementRoute: "/admin/agenda",
        managementLabel: "Gérer les événements dans l'Agenda",
      },
      {
        id: "recent_publications",
        title: "Bloc Dynamique : Derniers Enseignements",
        description: "Ce bloc affiche automatiquement les dernières publications pastorales et notes.",
        isDynamic: true,
        managementRoute: "/admin/publications",
        managementLabel: "Gérer les publications",
      },
    ],
  },

  "qui-sommes-nous": {
    slug: "qui-sommes-nous",
    title: "Qui sommes-nous",
    publicPath: "/qui-sommes-nous",
    description: "Vision spirituelle, histoire et fondements doctrinaux de l'église.",
    defaultContent: {
      "hero.title": "Notre vision, notre histoire et notre foi",
      "hero.subtitle": "Fondé sur la Parole de Dieu, le CCJV proclame la grâce transformative de Jésus-Christ.",
      "hero.badge": "Identité & Foi CCJV",
      "vision.sectionTitle": "Notre Vision Spirituelle",
      "vision.leadText": "Bâtir des disciples affermis, rayonnants et engagés pour la gloire de Dieu.",
      "vision.paragraph1": "Nous croyons en la puissance salvatrice de Jésus-Christ et en l'action vivante du Saint-Esprit.",
      "values.value1Title": "La Primauté de la Parole",
      "values.value1Desc": "La Bible est notre autorité suprême et infaillible.",
      "values.value2Title": "La Communion Fraternelle",
      "values.value2Desc": "Une famille unie dans l'amour du Christ.",
      "values.value3Title": "Le Témoignage & l'Évangélisation",
      "values.value3Desc": "Partager la Bonne Nouvelle à Lubumbashi et au-delà.",
    },
    sections: [
      {
        id: "hero",
        title: "En-tête de page",
        description: "Titre et introduction de la page Qui sommes-nous.",
        fields: [
          { key: "hero.title", label: "Titre principal", type: "text" },
          { key: "hero.subtitle", label: "Sous-titre explicatif", type: "textarea" },
          { key: "hero.badge", label: "Badge d'en-tête", type: "text" },
        ],
      },
      {
        id: "vision",
        title: "Vision & Mission",
        description: "Texte décrivant la vocation de l'église.",
        fields: [
          { key: "vision.sectionTitle", label: "Titre de section", type: "text" },
          { key: "vision.leadText", label: "Phrase maîtresse", type: "text" },
          { key: "vision.paragraph1", label: "Texte explicatif", type: "textarea" },
        ],
      },
      {
        id: "values",
        title: "Piliers & Valeurs",
        description: "Les trois valeurs fondatrices du CCJV.",
        fields: [
          { key: "values.value1Title", label: "Valeur 1 - Titre", type: "text" },
          { key: "values.value1Desc", label: "Valeur 1 - Description", type: "textarea" },
          { key: "values.value2Title", label: "Valeur 2 - Titre", type: "text" },
          { key: "values.value2Desc", label: "Valeur 2 - Description", type: "textarea" },
          { key: "values.value3Title", label: "Valeur 3 - Titre", type: "text" },
          { key: "values.value3Desc", label: "Valeur 3 - Description", type: "textarea" },
        ],
      },
      {
        id: "pastoral_team",
        title: "Bloc Dynamique : Équipe Pastorale & Anciens",
        description: "Les membres du conseil et pasteurs sont synchronisés automatiquement.",
        isDynamic: true,
        managementRoute: "/admin/departments",
        managementLabel: "Gérer l'organisation et les responsables",
      },
    ],
  },

  communaute: {
    slug: "communaute",
    title: "Communauté & Vie de l'église",
    publicPath: "/communaute",
    description: "Présentation des cellules de prière, activités fraternelles et accueil.",
    defaultContent: {
      "hero.title": "Vivre la foi ensemble, au quotidien",
      "hero.subtitle": "Une communauté fraternelle chaleureuse où chacun trouve sa place et grandit.",
      "hero.badge": "Vie Fraternelle",
      "welcome.title": "Bienvenue au CCJV",
      "welcome.description": "Que vous soyez de passage ou à la recherche d'une église locale, nous serons honorés de vous accueillir.",
    },
    sections: [
      {
        id: "hero",
        title: "Bannière Communauté",
        description: "Titre et accroche de la page vie communautaire.",
        fields: [
          { key: "hero.title", label: "Titre de la page", type: "text" },
          { key: "hero.subtitle", label: "Sous-titre d'accueil", type: "textarea" },
          { key: "hero.badge", label: "Badge d'en-tête", type: "text" },
        ],
      },
      {
        id: "welcome",
        title: "Message de Bienvenue",
        description: "Texte chaleureux pour les nouveaux visiteurs.",
        fields: [
          { key: "welcome.title", label: "Titre de section", type: "text" },
          { key: "welcome.description", label: "Texte de bienvenue", type: "textarea" },
        ],
      },
      {
        id: "testimonies_block",
        title: "Bloc Dynamique : Témoignages & Visages",
        description: "Les récits de foi et visages de la communauté s'affichent automatiquement.",
        isDynamic: true,
        managementRoute: "/admin/media",
        managementLabel: "Gérer la médiathèque et témoignages",
      },
    ],
  },

  organisation: {
    slug: "organisation",
    title: "Organisation & Départements",
    publicPath: "/organisation",
    description: "Structure et fonctionnement des départements de service du CCJV.",
    defaultContent: {
      "hero.title": "Servir le Seigneur avec excellence",
      "hero.subtitle": "Découvrez les ministères et départements qui animent la vie de notre église.",
      "hero.badge": "Départements & Ministères",
      "structure.title": "Une structure au service de la mission",
      "structure.description": "Chaque département rassemble des serviteurs dévoués dans la louange, l'accueil, l'intercession et la logistique.",
    },
    sections: [
      {
        id: "hero",
        title: "En-tête Organisation",
        description: "Titre et présentation des ministères.",
        fields: [
          { key: "hero.title", label: "Titre de la page", type: "text" },
          { key: "hero.subtitle", label: "Sous-titre", type: "textarea" },
          { key: "hero.badge", label: "Badge d'en-tête", type: "text" },
        ],
      },
      {
        id: "structure",
        title: "Texte explicatif",
        description: "Description de l'organisation générale.",
        fields: [
          { key: "structure.title", label: "Titre", type: "text" },
          { key: "structure.description", label: "Description", type: "textarea" },
        ],
      },
      {
        id: "dept_list",
        title: "Bloc Dynamique : Liste des Départements",
        description: "La liste des pôles (Louange, Intercession, Jeunesse...) est reliée au backend.",
        isDynamic: true,
        managementRoute: "/admin/departments",
        managementLabel: "Gérer la liste des départements",
      },
    ],
  },

  evenements: {
    slug: "evenements",
    title: "Agenda des Événements",
    publicPath: "/vie-de-leglise",
    description: "Calendrier des rassemblements cultuels et réunions de prière.",
    defaultContent: {
      "hero.title": "Agenda & Prochains Rassemblements",
      "hero.subtitle": "Retrouvez les dates de nos cultes dominicaux, séminaires et veillées de prière.",
      "hero.badge": "Vie de l'Église • Calendrier",
    },
    sections: [
      {
        id: "hero",
        title: "En-tête Agenda",
        description: "Titre principal de la page d'événements.",
        fields: [
          { key: "hero.title", label: "Titre", type: "text" },
          { key: "hero.subtitle", label: "Sous-titre", type: "textarea" },
          { key: "hero.badge", label: "Badge", type: "text" },
        ],
      },
      {
        id: "events_feed",
        title: "Bloc Dynamique : Flux d'Événements",
        description: "La liste dynamique des événements programmés.",
        isDynamic: true,
        managementRoute: "/admin/agenda",
        managementLabel: "Ajouter ou modifier des événements",
      },
    ],
  },

  "ou-nous-trouver": {
    slug: "ou-nous-trouver",
    title: "Où nous trouver & Accès",
    publicPath: "/qui-sommes-nous",
    description: "Coordonnées géographiques, adresse du temple et horaires d'ouverture.",
    defaultContent: {
      "hero.title": "Rejoignez-nous au Temple CCJV",
      "hero.subtitle": "Nous sommes situés au cœur de Lubumbashi.",
      "address.street": "Avenue des Églises, Quartier Industriel",
      "address.city": "Lubumbashi, Haut-Katanga, RD Congo",
      "address.phone": "+243 000 000 000",
      "address.email": "contact@ccjv.org",
    },
    sections: [
      {
        id: "hero",
        title: "En-tête Localisation",
        description: "Présentation du lieu de culte.",
        fields: [
          { key: "hero.title", label: "Titre", type: "text" },
          { key: "hero.subtitle", label: "Sous-titre", type: "textarea" },
        ],
      },
      {
        id: "address",
        title: "Coordonnées & Contact",
        description: "Adresse physique et numéros de téléphone.",
        fields: [
          { key: "address.street", label: "Rue / Avenue", type: "text" },
          { key: "address.city", label: "Ville / Province / Pays", type: "text" },
          { key: "address.phone", label: "Téléphone du secrétariat", type: "text" },
          { key: "address.email", label: "Adresse e-mail", type: "text" },
        ],
      },
    ],
  },

  "faire-un-don": {
    slug: "faire-un-don",
    title: "Faire un don & Soutenir",
    publicPath: "/faire-un-don",
    description: "Informations sur les offrandes, dîmes et soutien aux projets de l'église.",
    defaultContent: {
      "hero.title": "Soutenir l'œuvre du Seigneur",
      "hero.subtitle": "Votre générosité permet d'annoncer l'Évangile et de soutenir les actions caritatives.",
      "hero.badge": "Générosité & Dîmes",
      "bank.details": "Compte bancaire CCJV : Rawbank / Equity BCDC - Titulaire : CCJV ASBL",
      "mobile.details": "M-Pesa / Airtel Money / Orange Money : +243 000 000 000",
    },
    sections: [
      {
        id: "hero",
        title: "En-tête Dons",
        description: "Titre et message d'encouragement au don.",
        fields: [
          { key: "hero.title", label: "Titre", type: "text" },
          { key: "hero.subtitle", label: "Sous-titre", type: "textarea" },
          { key: "hero.badge", label: "Badge", type: "text" },
        ],
      },
      {
        id: "payment_info",
        title: "Coordonnées Bancaires & Mobile Money",
        description: "Numéros de compte et coordonnées de transfert.",
        fields: [
          { key: "bank.details", label: "Coordonnées bancaires", type: "textarea" },
          { key: "mobile.details", label: "Mobile Money", type: "textarea" },
        ],
      },
    ],
  },

  departement: {
    slug: "departement",
    title: "Modèle de Fiche Département",
    publicPath: "/organisation",
    description: "Gabarit éditorial type pour la présentation détaillée des départements.",
    defaultContent: {
      "hero.title": "Présentation du Département",
      "hero.subtitle": "Une équipe consacrée au service de Dieu et de Son église.",
      "join.title": "Comment intégrer ce département ?",
      "join.text": "Les inscriptions se font auprès des responsables de département à la fin de chaque culte dominical.",
    },
    sections: [
      {
        id: "hero",
        title: "En-tête Département",
        description: "Titre et sous-titre générique de département.",
        fields: [
          { key: "hero.title", label: "Titre type", type: "text" },
          { key: "hero.subtitle", label: "Sous-titre type", type: "textarea" },
        ],
      },
      {
        id: "join",
        title: "Modalités d'intégration",
        description: "Consignes d'adhésion pour les membres.",
        fields: [
          { key: "join.title", label: "Titre de section", type: "text" },
          { key: "join.text", label: "Instructions d'intégration", type: "textarea" },
        ],
      },
    ],
  },
};
