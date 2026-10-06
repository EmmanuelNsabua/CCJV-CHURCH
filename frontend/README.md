# Centre Chrétien Jésus ma Vie (CCJV) — Site public

Site public du **Centre Chrétien Jésus ma Vie (CCJV)**, église basée à Lubumbashi
(République démocratique du Congo). Première version (MVP) : données mockées, prête à
être connectée au futur backend.

## Stack

- **Next.js** (App Router) · **TypeScript** · **React**
- Design System maison : CSS Modules + variables CSS (tokens)
- Typographies **Lora** (titres) / **Inter** (corps), self-hostées via `next/font`

## Prérequis

- Node.js ≥ 18.18 (testé sur Node 22)

## Installation & commandes

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build de production
npm run start      # sert le build de production
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

## Variables d'environnement

Copier `.env.example` en `.env.local` puis définir `NEXT_PUBLIC_SITE_URL`
(URL publique utilisée pour canonical, sitemap, Open Graph).

## Pages publiques

| Route | Description |
| --- | --- |
| `/` | Accueil (Hero éditorial, identité, horaires, événements, départements, publications, invitation) |
| `/qui-sommes-nous` | Histoire, vision, Pasteur Manasse Mwamba, Ecodim |
| `/organisation` | Départements (données dynamiques) |
| `/evenements` | Événements à venir / passés |
| `/publications` | Vidéos, photos, textes |
| `/contact` | Coordonnées, horaires, WhatsApp, réseaux sociaux |

## Structure

```text
src/
├── app/            # routes publiques + layout + SEO (sitemap, robots, icon)
├── components/     # ui/ · layout/ · shared/
├── features/       # events/ · departments/ · publications/ · pages/
├── data/mock/      # données fictives typées (à remplacer par l'API)
├── lib/            # utils, nav, seo
└── types/          # modèle de domaine (Department, Event, Publication…)
```

## Documentation

- Conception : `docs/008-audit_design.md` → `docs/011-architecture_visuelle.md`
- Documentation fonctionnelle/technique : `docs/001` → `docs/007`
