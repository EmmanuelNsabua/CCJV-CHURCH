# =============================================================================
#  CCJV — API REST · image de production (déploiement Railway)
#
#  Build multi-étapes : la chaîne de compilation TypeScript (et ses outils de
#  développement) ne se retrouve jamais dans l'image finale. Celle-ci ne contient
#  que `dist/`, les dépendances de production et les migrations `drizzle/`.
#
#  Aucun secret n'est copié dans l'image : `.env` est exclu par `.dockerignore`
#  et les valeurs sont injectées à l'exécution par l'environnement de la
#  plateforme (`DATABASE_URL`, `SUPABASE_*`…).
# =============================================================================

# ------------------------------- Étape 1 · build -----------------------------
FROM node:22-alpine AS build

WORKDIR /app

# Les dépendances sont copiées seules d'abord : cette couche n'est reconstruite
# que si `package.json` / `package-lock.json` changent.
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json ./
COPY src ./src

# `tsc -p tsconfig.build.json` → `dist/`
RUN npm run build

# ------------------------- Étape 2 · image d'exécution -----------------------
FROM node:22-alpine AS runtime

ENV NODE_ENV=production

# Port par défaut. Railway injecte sa propre variable `PORT` à l'exécution :
# c'est elle que lit `src/config/env.ts`, `EXPOSE` n'étant qu'une déclaration.
ARG PORT=4000
ENV PORT=${PORT}

WORKDIR /app

# Uniquement les dépendances de production, sans outillage de compilation.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

# Migrations versionnées : `node dist/infrastructure/database/migrate.js` lit ce
# dossier, y compris `meta/_journal.json` (indispensable au migrateur Drizzle).
COPY drizzle ./drizzle

RUN chown -R node:node /app

# Jamais root : une compromission via une dépendance n'hérite que des droits de
# l'utilisateur `node`, fourni par l'image officielle.
USER node

EXPOSE ${PORT}

CMD ["node", "dist/server.js"]
