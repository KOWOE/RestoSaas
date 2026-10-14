# 🔍 Audit complet — Zagoor / RestoSaas

**Date :** 14 octobre 2026
**Périmètre :** dépôt `KOWOE/RestoSaas`, branche `arena/f9c06fb9-restosaas` (commit `129333c`)
**Méthode :** revue statique du code (100 % des fichiers métier), analyse du schéma de données, des flux de paiement, `npm audit`, ESLint, TypeScript, revue Git/DevOps.

---

## 1. Synthèse exécutive

| | |
|---|---|
| **Ce que c'est** | SaaS multi-tenant de menus digitaux + commandes pour restaurants (Afrique de l'Ouest, marque **Zagoor**). Landing, parcours d'abonnement, menu QR par restaurant (`/[slug]`), cockpit gérant, back-office super-admin, paiements Moneroo/FedaPay (Mobile Money, carte). |
| **Stack** | Next.js 16 (App Router, standalone), React 19, TypeScript 5, Tailwind 4, shadcn/ui, Prisma 6 + **SQLite**, Zustand, PWA, Framer Motion. |
| **Taille** | 82 fichiers source, ~18 800 lignes TS/TSX, 13 routes API. Composants géants : `restaurant-app.tsx` (4 153 l.), `admin/page.tsx` (2 159 l.), `super-admin/page.tsx` (1 152 l.). |
| **Verdict** | 🟠 **Prototype / MVP très avancé côté produit et UI, mais non exploitable en production en l'état.** Le produit est séduisant (parcours d'onboarding, design, mode démo) mais les fondations sécurité, paiement et multi-tenant sont absentes ou contournables. |

### Notes par domaine

| Domaine | Note | Commentaire |
|---|---|---|
| Produit & UX | 🟢 **8/10** | Landing convaincante, parcours complet, PWA, mode démo. |
| Qualité du code | 🟡 **4/10** | Fonctionnel mais god-components, `any`, ESLint neutralisé. |
| Performance | 🟡 **6/10** | Correct pour un MVP, N+1 et absence de pagination à corriger. |
| Sécurité | 🔴 **1/10** | **Aucune auth réelle, API ouvertes, secrets commités.** |
| Paiements & métier | 🔴 **2/10** | Contournables de bout en bout (voir §4). |
| Base de données | 🔴 **3/10** | SQLite, pas d'index, `any`, pas de transactions/migrations. |
| DevOps / CI | 🔴 **2/10** | Pas de CI, pas de tests, pas de Dockerfile, 29 vulnérabilités. |
| Conformité (PII) | 🔴 **2/10** | Téléphones/emails stockés en clair, aucune politique, avis falsifiables. |
| **GLOBAL** | **🔴 3/10 en production** | **7/10 comme prototype.** L'écart est composable : le travail restant est surtout du "durcissement", pas une refonte produit. |

---

## 2. Ce qui est bien (à conserver) ✅

1. **Parcours produit cohérent** : landing → souscription → onboarding → menu QR → commande → tracking → cockpit gérant → super-admin. Le fil rouge tient debout.
2. **Design soigné** : identité "Afrique Premium" cohérente, shadcn/ui bien utilisé, micro-interactions, états de chargement, toasts.
3. **Mode démo élégant** : restaurant `le-jardin-savoureux` avec seed automatique — idéal pour une démo commerciale.
4. **Schéma Prisma multi-tenant propre** : modèles `Restaurant / User / Category / Product / Order / OrderItem / Payment / Table / Review` bien structurés, `@@map` explicites, cascade cohérentes.
5. **Onboarding contextualisé** : templates de plats selon le type de cuisine (gastronomique / grillades / défaut) — bon effet produit.
6. **PWA complète** : manifest, icônes, service worker, thèmes, `appleWebApp`.
7. **Métadonnées Next.js** soignées (title template, OG, viewport, fonts).
8. **TypeScript compile sans erreur** (`tsc --noEmit` : 0 erreur), build `standalone` pour la prod.

---

## 3. 🔴 SÉCURITÉ — critiques

> **C'est le sujet n°1. En l'état, n'importe qui sur Internet peut : créer/supprimer des restaurants, marquer des commandes comme payées, lire tous les clients (noms, téléphones, emails) de tous les tenants, et accéder au back-office super-admin.**

### S1. Aucune authentification réelle — **Critique**
- `src/app/api/auth/login/route.ts` : identifiants **en dur** dans le code (`admin@restaurant.com` / `admin123`), retour d'un jeton bidon `'demo-token-' + Date.now()`. **Aucun mot de passe n'est vérifié en base, aucune session serveur n'est créée.** Le champ `User.password` existe dans le schéma mais n'est jamais rempli ni haché (bcrypt/argon2 absents du projet).
- L'état d'auth est un store **Zustand persisté en `localStorage`** (`auth-storage`) — falsifiable en 2 secondes via les DevTools.
- **Bypass par URL** : `src/app/admin/page.tsx` (~ligne 243) — visiter `/admin?restaurant=mon-slug` **connecte automatiquement** un utilisateur `super_admin` (`login({ id: 'super-admin-impersonate', role: 'super_admin', ... })`) sans aucun mot de passe.
- Aucun middleware Next.js (`src/middleware.ts` absent) : rien ne protège les pages ni les API côté serveur.

### S2. Toutes les API sont ouvertes (aucune authentification, aucune isolation multi-tenant) — **Critique**

| Route | Méthodes | Risque |
|---|---|---|
| `/api/restaurants` | GET/POST/PUT/DELETE | Supprimer ou modifier **n'importe quel** restaurant. `?id=` inclut la table `users` → **fuite d'emails/noms**. |
| `/api/orders` | GET/POST/PUT/DELETE | Lire **tout l'historique de commandes** (PII clients), **marquer `paymentStatus: 'paid'`** (PUT), supprimer des commandes. |
| `/api/products`, `/api/categories` | CRUD | Modifier les menus de tous les tenants. |
| `/api/admin/super-admin` | GET/POST/PUT/DELETE | **Back-office complet ouvert** : stats plateforme, création/suspension/suppression de tenants. |
| `/api/dashboard` | GET | Statistiques financières de n'importe quel restaurant avec un simple `restaurantId`. |
| `/api/seed` | GET | Peupler/réinitialiser la base — **et le frontend l'appelle tout seul** en cas d'échec de chargement. |
| `/api/generate-image` | POST | Génération d'images IA sans auth ni rate-limit → **coût financier ouvert**. |
| `/api/tracking` | GET | Recherche par `customerPhone: { contains: ... }` → **énumération de clients** à partir d'un fragment de numéro. |

Aucune route ne vérifie que l'appelant est bien le propriétaire du `restaurantId` passé en paramètre.

### S3. Secrets et données sensibles commités dans Git — **Critique**
- **Pas de `.gitignore` du tout.** Sont trackés par Git : `.env`, `prisma/dev.db` (base SQLite avec données clients), `tsconfig.tsbuildinfo`.
- `.env` contient `NEXTAUTH_SECRET="restosaas_super_secret_key_2026_dev_mode"` (commité).
- **Clé secrète Moneroo en dur** dans le code : `pvk_sandbox_xd3hbu|01KYSKY0QD9EM65FAXFVK2ZKN6` dans `api/payment/route.ts`, `api/payment/verify/route.ts`, `api/orders/route.ts` (fallback si `MONEROO_SECRET_KEY` absent — ce qui est le cas du `.env` !).
- **Clé de webhook + URL de test en dur** dans `test-webhook.js` : `ih_01KYQX8F6XYP5482DCT1XSBEA7_...` et `https://hooks.moneroo.io/ho_g2ozy8hh46l5`.
- ⚠️ **Toutes ces clés doivent être considérées comme compromises et révoquées/rotées immédiatement**, même si elles sont théoriquement "sandbox".
- `test-webhook.js` et `create-product.js` (scripts de debug) traînent à la racine.

### S4. Webhook Moneroo "fail-open" — **Critique**
`src/app/api/webhooks/moneroo/route.ts` : si la signature HMAC est fournie mais **incorrecte**, le code se contente d'un `console.warn('...Traitement conditionnel autorisé.')` **et traite quand même l'événement** → un attaquant peut forger un webhook `payment.success` et faire marquer n'importe quelle commande comme payée, voire activer un restaurant. Il faut **rejeter (401) en cas de signature invalide**, exiger la signature en toutes circonstances, et implémenter l'idempotence (anti-rejeu).

### S5. Validation des entrées inexistante
- **Zod est installé mais jamais importé** dans tout le projet. Les payloads (`orders`, `onboarding`, `products`, `payment`) sont crus.
- Exemple : `POST /api/orders` boucle sur `items` sans vérifier le tableau, les quantités (**négatives ou flottantes acceptées** → totaux négatifs), ni la cohérence `restaurantId` des produits.

### S6. Absence de protections transverses
- Pas de rate limiting nulle part (login, onboarding, payment init, tracking, generate-image).
- Pas de headers de sécurité (CSP, `X-Frame-Options`, `Referrer-Policy`, HSTS…) dans `next.config.ts`.
- Pas de journal d'audit (qui a modifié quoi ?).
- `reactStrictMode: false` (masque des bugs React en dev).

### S7. Fuites de données personnelles (PII)
- `GET /api/restaurants?id=` renvoie `users: true` (emails, noms).
- `GET /api/orders?restaurantId=` renvoie l'intégralité des commandes avec noms/téléphones/emails des clients.
- `POST /api/reviews` : **tout avis publié est marqué `isVerified: true`** et affiché publiquement sur la landing → faux témoignages "vérifiables" injectables par n'importe qui (risque réputationnel et publicitaire).

---

## 4. 💳 Paiements & logique métier

### P1. Le paiement d'abonnement est contournable — **Critique business**
Dans `api/onboarding/route.ts`, le restaurant est créé **avec `isActive: true` par défaut** (le schéma Prisma défaut `true`), avec plan `pro`, **avant** l'appel à `/api/payment`. Si l'utilisateur quitte la page pendant le paiement (ou utilise l'API directement), **le tenant existe et est actif gratuitement**. Le webhook n'a qu'un rôle "d'activation" (`isActive: true`) alors que rien ne désactive en cas d'échec. ➡️ Créer en `isActive: false` / `pending_payment`, n'activer que sur webhook signé validant le montant.

### P2. Commandes "payées" sans paiement
- `api/orders/route.ts` : si `restaurant.slug === 'le-jardin-savoureux'` **ou** `isDemo: true` (envoyé par le **client** !) → `paymentStatus: 'paid'` immédiat, sans passerelle. La confiance est placée dans un flag envoyé par le navigateur.
- `PUT /api/orders` accepte `paymentStatus: 'paid'` de quiconque (cf. S2).

### P3. Gestion de l'argent en `Float` — **Élevé**
Tous les montants (`price`, `subtotal`, `tax`, `total`, `amount`) sont des `Float` IEEE-754. Pour de l'argent : utiliser des **entiers (centimes)** ou `Decimal`. Les arrondis `Math.round()` sont dispersés côté serveur et client.

### P4. Incohérences de calcul
- La TVA (`taxRate: 0.18`) est appliquée **en plus** du prix affiché côté client (`total = subtotal * (1 + taxRate)`) — à clarifier (TTC ou HT ?) et documenter.
- Fallback sandbox Moneroo : conversion **`XOF → USD` au taux hardcodé `/600`** (`api/payment/route.ts`, `api/orders/route.ts`). Même si c'est gardé hors live, c'est une bombe logique.
- Le prix de l'abonnement (5 500 / 54 000 FCFA) est calculé côté client puis transmis au serveur — le serveur doit recalculer.

### P5. Faiblesses du traitement des paiements
- Aucune **comparaison montant payé (webhook) vs montant de la commande**.
- Aucune **idempotence** webhook (un même événement rejoué recrée des `Payment`).
- `payment/verify` est public et renvoie les détails client du paiement pour n'importe quel `paymentId`.
- `Order.orderNumber` n'est **ni unique ni indexé** en base ; génération faible (`timestamp base36 + 4 caractères`).
- Un seul `Payment` par commande (`@unique` sur `orderId`) : pas de gestion des paiements partiels/échoués puis retentés.

---

## 5. 🗄️ Architecture & base de données

1. **SQLite en production multi-tenant** : verrou d'écriture unique, une seule machine, inadapté dès que plusieurs restaurants prennent des commandes en simultané. ➡️ Prévoir PostgreSQL (le schéma Prisma se transpose quasi tel quel).
2. **Base de données dev (`prisma/dev.db`) commitée** : données de démo/clients dans Git, conflits binaires, aucune stratégie de backup.
3. **Aucun index** hors clés uniques — `orderNumber`, les FK `restaurantId`, `categoryId`, `orderId`, `createdAt` des recherches du dashboard… tout est en scan complet.
4. **`src/lib/db.ts` est typé `any`** (`// @ts-ignore`, `new (PrismaClient as any)`) → **toute la sécurité de types Prisma est annulée** (fautes sur les noms de champs = runtime).
5. **Pas de transactions** : l'onboarding crée restaurant, user, tables, catégories, produits en boucle avec `.catch(() => null)` → en cas d'erreur, **données partielles silencieuses** (un restaurant sans produits, etc.).
6. **"Fallback mémoire"** (`api/onboarding/route.ts`) : si la DB échoue, le serveur renvoie un restaurant **fabriqué en JS, jamais persisté** — le client croit que son enregistrement a réussi (`/[slug]` ne fonctionnera pas plus tard).
7. **Suppression dure** (`onDelete: Cascade`) : supprimer un restaurant efface commandes et paiements — problématique pour la facturation/la comptabilité. Prévoir soft-delete/archivage.
8. **Pas de migrations versionnées** : seulement `prisma db push` (scripts npm). Aucun historique d'évolution du schéma exploitable en équipe.

---

## 6. 🧹 Qualité du code & maintenabilité

1. **God components** : `restaurant-app.tsx` (4 153 lignes) contient le menu, le panier, le checkout, le tracking, le cockpit gérant, les réglages, le login… à découper en features (`features/menu`, `features/orders`, `features/admin`…).
2. **ESLint neutralisé** : `eslint.config.mjs` désactive ~25 règles (`no-unused-vars`, `prefer-const`, `react-hooks/exhaustive-deps`, `no-console`, `no-debugger`…). Avec ce filet de sécurité retiré, il reste quand même **8 erreurs / 74 warnings** (principalement `react-hooks/set-state-in-effect`).
3. **`typescript.ignoreBuildErrors: true`** dans `next.config.ts` : le build passe même avec des erreurs TS. À retirer.
4. **Dépendances mortes** (installées, jamais utilisées) : `next-auth`, `next-intl`, `@tanstack/react-query`, `react-hook-form`, `@hookform/resolvers`, `zod`, `@tanstack/react-table`, `@mdxeditor/editor`… Le README promet NextAuth/i18n/TanStack Table : rien n'est branché.
5. **README générique Z.ai** : ne décrit ni le produit (Zagoor), ni la configuration (variables Moneroo), ni le déploiement. `CLAUDE.md` = 1 ligne. Pas de doc d'API.
6. **Duplication de logique métier** : vérification du statut Moneroo copiée dans `payment/verify` **et** `webhooks/moneroo` ; templates de plats recopiés dans `onboarding`, `seed` et `super-admin` (3 versions divergentes).
7. **Double lockfile** (`bun.lock` + `package-lock.json`) + `tsconfig.tsbuildinfo` commité + `public/sw.js` / `workbox-*.js` (artifacts PWA générés) commités.
8. **`console.log` de debug partout** (y compris des données de paiement en prod).
9. **Constantes en dur** : le slug démo `le-jardin-savoureux` est littéralement vérifié dans 4 fichiers ; l'email de repli `client@resto-saas.com` ; les images Unsplash en dur.

---

## 7. ⚡ Performance

1. **N+1 dans `/api/dashboard`** : boucle de 7 `findMany` (revenus par jour) + `orderItem.findMany` **sans filtre de date ni pagination** pour les top produits — à calculer en agrégation SQL (`groupBy`/`$queryRaw`).
2. **Pas de pagination** : `GET /api/orders` (tout l'historique + `include.product`), `restaurants`, `reviews` — temps de réponse et mémoire qui dégradent avec la croissance.
3. **`images.unoptimized: true`** : aucune optimisation des images de menu, dépendance à Unsplash/Pexels en production (si Unsplash est lent ou bloque le hotlink, les menus sont sans photos). ➡️ uploader/stocker les images (le champ `image` est une URL externe partout).
4. **Tout est client-side** (`'use client'` sur les pages, y compris la landing et `/[slug]`) : TTFB correct mais **contenu invisible pour Google** (les menus des restaurants ne sont pas indexés) et JS bundle très lourd (framer-motion + recharts + 40 composants Radix sur chaque page).
5. **Polling super-admin toutes les 12 s** + `cacheOnFrontEndNav` PWA agressif : attention à la fraîcheur des données de commande en cuisine.
6. Pas de `Suspense`/streaming sur les parcours data (sauf `success`), pas de mise en cache des lectures (`revalidate`).

---

## 8. 🚀 DevOps, tests & exploitation

1. **Aucun test** (0 fichier de test, aucun runner : pas de vitest/jest/playwright).
2. **Aucune CI/CD** (pas de `.github/`).
3. **`.dockerignore` sans `Dockerfile`** — le déploiement documenté est hypothétique ; le script `build` fait un `cpSync` artisanal vers `.next/standalone`.
4. **`npm audit` : 29 vulnérabilités (2 critiques, 18 high)** :
   - 🔴 **next** — contournement Middleware/Proxy App Router (Turbopack, locale unique) — *le projet n'utilise pas de middleware aujourd'hui, mais montez de version avant d'en ajouter un* ;
   - 🔴 **next-auth** — bypass de normalisation d'email (homoglyphe) ;
   - 🟠 **sharp** (CVE libvips), **serialize-javascript** (RCE), **brace-expansion/braces/micromatch** (DoS), **postcss** (XSS stringify), **nanoid**, **js-yaml**… (beaucoup transitent par les toolchains dev, mais `sharp` et `next` sont runtime).
5. **Pas de variables `MONEROO_*` dans `.env`** alors que le code en a besoin : en prod, le code **tombera silencieusement sur les clés sandbox en dur** (cf. S3). Pas de `.env.example`.
6. **Pas de healthcheck, pas de monitoring** (Sentry/Logs structurés), pas de stratégie de backup SQLite, pas de process manager documenté (`bun .next/standalone/server.js | tee server.log`).
7. `start` écrit `server.log` dans le cwd du conteneur, sans rotation.

---

## 9. ⚖️ Conformité & données personnelles

1. **PII clients (noms, téléphones, emails, adresses de livraison) en clair** dans SQLite, sans politique de confidentialité, sans durée de rétention/purge, sans chiffrement au repos.
2. **Aucune mention légale / CGU / politique de confidentialité** alors que la landing collecte emails et numéros Mobile Money (obligations légales, et exigences des agrégateurs de paiement).
3. **Témoignages "vérifiés" par défaut** (reviews seed + `isVerified: true` à la volée) : pratique à risque si les personnes/établissements sont fictifs.
4. **Pas de journal d'audit** ni de traçabilité des actions gérant/super-admin (obligation de base pour un SaaS qui touche à de l'argent).
5. `userScalable: false` dans le viewport : **problème d'accessibilité** (utilisateurs malvoyants).

---

## 10. 📱 SEO / PWA / i18n

- ✅ `robots.txt` (tout ouvert), manifest PWA complet, icônes, thèmes, OG de base.
- ❌ **Menus restaurants non indexables** (rendu 100 % client) alors que c'est le contenu à référencer (`/le-jardin-savoureux` devrait être en Server Component + ISR).
- ❌ **`next-intl` installé mais non branché** — pourtant cible francophone avec extension régionale probable.
- ⚠️ Landing page en `use client` avec animation : le HTML critique devrait être serveur pour le SEO/LCP.

---

## 11. 🗺️ Plan d'action priorisé

### 🔥 P0 — bloquants avant toute mise en ligne (1-2 semaines)
1. **Révoquer/rotater toutes les clés Moneroo** (compromises dans Git) ; retirer les fallbacks de clés en dur du code.
2. **Créer un `.gitignore`** (`.env`, `*.db`, `node_modules`, `.next`, `tsconfig.tsbuildinfo`, `*.log`), exclure `.env` + `dev.db` du tracking, fournir `.env.example`.
3. **Authentification réelle** : NextAuth (déjà en dépendance) ou sessions JWT `httpOnly` + hachage des mots de passe (argon2/bcrypt), rôles (`super_admin`, `restaurant_owner`, `manager`, `staff`), middleware de protection.
4. **Sécuriser toutes les routes API** : auth obligatoire + vérification d'appartenance au tenant (le `restaurantId` vient de la session, jamais du body).
5. **Webhook fail-closed** : signature HMAC exigée et rejetée si invalide, idempotence, vérification du montant et de la devise.
6. **Supprimer les backdoors** : bypass `?restaurant=`, `isDemo` côté client, auto-appel de `/api/seed`, endpoint super-admin public.
7. **Valider toutes les entrées avec Zod** (déjà installé) : items, quantités > 0, prix, emails, montants.

### 🟧 P1 — fiabilité & fondations (1 mois)
8. Paiement **avant** activation : tenant créé `pending`, activation par webhook signé.
9. Montants en **entiers (centimes)** ou `Decimal` ; prix de l'abonnement recalculé serveur ; retirer la conversion XOF/USD hardcodée.
10. **PostgreSQL** + migrations versionnées (`prisma migrate`), index (`orderNumber` unique, FK, `createdAt`), transactions Prisma sur les écritures multi-lignes.
11. **Pagination** partout, agrégations SQL pour le dashboard, `revalidate`/ISR sur les pages menus.
12. Headers de sécurité + rate limiting (middleware/upstash), HTTPS/HSTS via Caddy.
13. **Tests** : vitest (services/API) + Playwright (parcours critique : onboarding → commande → paiement). **CI GitHub Actions** (lint, typecheck, test, build, `npm audit`).
14. `Dockerfile` multi-stage + healthcheck, `.env.example`, README projet (setup, variables, déploiement).
15. Retirer `ignoreBuildErrors`, remettre `reactStrictMode`, réactiver ESLint (au minimum `exhaustive-deps`, `no-unused-vars`).

### 🟨 P2 — dette technique & croissance (trimestre)
16. Découper `restaurant-app.tsx` / `admin/page.tsx` par feature ; typer Prisma correctement (supprimer le `any` de `db.ts`).
17. Brancher **TanStack Query** pour le fetch (cache, retry, invalidation) et **react-hook-form + Zod** pour les formulaires.
18. Server Components sur landing + `[slug]` (SEO), optimisation images (stockage objet + `next/image`), i18n réelle si expansion.
19. Soft-delete/Archivage des tenants, journal d'audit, purge/rétention des PII, pages légales (CGU, confidentialité), consentement.
20. Monitoring (Sentry + logs structurés), alerting, backups base automatiques, runbook de paiement.

---

## 12. Conclusion

Le projet a **le profil d'un excellent MVP commercial** : l'expérience de souscription et le menu QR sont au-dessus de la moyenne des prototypes, et l'architecture de données multi-tenant est saine dans ses grandes lignes. En revanche, **il ne faut absolument pas l'exposer en l'état à de vrais paiements ou de vrais clients** : l'authentification est fictive, toutes les API — y compris celle qui marque les commandes comme payées — sont publiques, les clés de paiement sont dans Git, et le paiement d'abonnement se contourne en une requête.

La bonne nouvelle : 80 % du travail restant est du durcissement de sécurité/qualité bien balisé (plan P0 ci-dessus), et non une refonte. En 2 à 4 semaines de travail ciblé, ce dépôt peut passer du statut de "démo commerciale" à celui de "SaaS exploitable".

---

*Rapport généré par revue manuelle du code — chaque constat est référencé par fichier. Aucune donnée de production n'a été modifiée.*
