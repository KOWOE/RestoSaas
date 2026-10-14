# 🚀 Déploiement production — Zagoor / RestoSaas

> **Base de données : PostgreSQL obligatoire en production.**
> SQLite (fichier `dev.db`) ne persiste **pas** sur Vercel (disque éphémère) :
> les données disparaîtraient à chaque déploiement/redémarrage.
> Le schéma Prisma est donc configuré pour **PostgreSQL**.

---

# Option A — Vercel (✅ recommandée)

## A1. Créer la base Supabase (5 min, gratuit)

1. Créez un projet sur **[supabase.com](https://supabase.com)** (plan Free suffisant)
2. **Project Settings → Database → Connection string → URI**
   - Sélectionnez le mode **« Session »** (recommandé avec Prisma)
   - Copiez l'URL type :
     ```
     postgresql://postgres.PROJECT:VOTRE_MDP@aws-0-xx.pooler.supabase.com:5432/postgres
     ```
   - ⚠️ Elle contient votre **mot de passe** : collez-la directement dans Vercel (A3),
     ne la faites pas circuler par email/chat.
3. Testez-la depuis votre machine :
   ```bash
   DATABASE_URL="postgresql://..." npx prisma db push
   ```
   → `Your database is now in sync with your schema` ✅

> Alternative : Neon, ElephantSQL, ou tout PostgreSQL hébergé — le schéma est standard.

## A2. Connecter le dépôt à Vercel (5 min)

1. [vercel.com](https://vercel.com) → **Add New → Project** → importez `KOWOE/RestoSaas`
2. Framework : **Next.js** détecté automatiquement
3. **Build & Development Settings** → Build Command :
   ```
   npm run vercel-build
   ```
   *(vérifie les variables d'env, génère Prisma, pousse le schéma, build l'app)*

## A3. Variables d'environnement (⚠️ l'étape qui compte)

**Vercel → Project → Settings → Environment Variables** (cocher *Production*,
et *Preview* si vous voulez tester) :

| Name | Value |
|---|---|
| `DATABASE_URL` | l'URL PostgreSQL **Supabase** (mode Session, A1) |
| `SESSION_SECRET` | `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `ADMIN_EMAIL` | email du super-admin (**obligatoire en prod**) |
| `ADMIN_PASSWORD` | mot de passe fort (**obligatoire en prod**) |
| `MONEROO_SECRET_KEY` | votre clé `pvk_…` |
| `MONEROO_WEBHOOK_URL` | `https://hooks.moneroo.io/ho_s5e1oxk8847i` |
| `MONEROO_WEBHOOK_SECRET` | secret `ih_…` affiché avec le webhook (A4) |
| `NEXT_PUBLIC_APP_URL` | `https://votre-projet.vercel.app` (ou domaine custom) |
| `WEBHOOK_ALLOW_UNSIGNED` | `false` |
| `MONEROO_URL` | `https://api.moneroo.io/v1/payments/initialize` |
| `MONEROO_VERIFY_URL` | `https://api.moneroo.io/v1/payments` |

Astuce CLI (alternative au dashboard) :
```bash
npm i -g vercel && vercel link
echo "postgresql://..." | vercel env add DATABASE_URL production
echo "votre-cle-pvk"   | vercel env add MONEROO_SECRET_KEY production
# ...
```

## A4. Configurer le webhook Moneroo

Votre webhook `https://hooks.moneroo.io/ho_s5e1oxk8847i` a été créé dans la console Moneroo.
Vérifiez ces **3 éléments** dans la console (section *Webhooks*) :

| Élément | Valeur attendue |
|---|---|
| **URL de destination** (endpoint) | `https://votre-projet.vercel.app/api/webhooks/moneroo` ← c'est Moneroo qui **appelle** votre app ici |
| **Identifiant du hook** | `https://hooks.moneroo.io/ho_s5e1oxk8847i` (celui que vous venez de me donner) |
| **Secret de signature** (`ih_…`) | copié tel quel dans `MONEROO_WEBHOOK_SECRET` sur Vercel (A3) |

Événements à activer : `payment.success`, `payment.failed`.

**Test** : bouton **« Send test event »** de la console → votre app doit répondre
`200 {"received":true}`. Si vous obtenez `401` → le secret `ih_…` de Vercel ne correspond pas
à celui de la console. Si `503` → `MONEROO_WEBHOOK_SECRET` absent de Vercel.

## A5. Déployer

- Dashboard Vercel → **Deploy** (ou `git push` sur la branche connectée)
- Le build s'arrête **avant** de produire un artefact cassé si une variable manque
  (grâce à `scripts/check-prod-env.mjs`)

## A6. Vérifications post-déploiement

```bash
APP="https://votre-projet.vercel.app"

# Login super-admin → {"success":true,...} + cookie
curl -X POST $APP/api/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"VOTRE-ADMIN","password":"VOTRE-MDP"}'

# API protégée sans session → 401
curl -o /dev/null -w "%{http_code}\n" "$APP/api/orders?restaurantId=x"

# Webhook sans signature → 401
curl -o /dev/null -w "%{http_code}\n" -X POST $APP/api/webhooks/moneroo -d '{}'
```

## A7. Après la mise en prod — 🔒

- [ ] **Révoquez la clé `pvk_…` qui a circulé dans un chat**, créez-en une nouvelle
      dans la console Moneroo, mettez à jour `MONEROO_SECRET_KEY` sur Vercel, Redeploy
- [ ] Idem pour le secret webhook `ih_…` s'il a circulé hors console
- [ ] Base Supabase : activer les backups (Database → Backups) et **Row Level Security**
      si vous exposez la base via Supabase API plus tard (pas besoin pour Prisma seul)
- [ ] Domaine custom : Vercel → Settings → Domains (HTTPS automatique)
- [ ] Demander aux propriétaires de changer leur mot de passe temporaire

---

# Option B — VPS + Caddy (alternative)

Suivre les étapes ci-dessous si vous préférez un serveur classique.

## B1. Prérequis
Node.js 20+, Caddy (`apt install caddy`), Git, un domaine pointé sur le VPS.

## B2. Installation
```bash
sudo mkdir -p /opt/restosaas && sudo chown $USER /opt/restosaas
cd /opt/restosaas
git clone https://github.com/KOWOE/RestoSaas.git . && git checkout arena/f9c06fb9-restosaas
npm install
./scripts/setup-env.sh     # saisie MASQUÉE des clés, .env généré (chmod 600)
npm run db:push            # schéma PostgreSQL (DATABASE_URL du .env)
npm run build
```

## B3. Service + Caddy
```bash
sudo cp deploy/zagoor.service /etc/systemd/system/     # ajuster User=/chemins
sudo systemctl daemon-reload && sudo systemctl enable --now zagoor
sudo cp deploy/Caddyfile.production /etc/caddy/Caddyfile  # remplacer zagoor.com
sudo systemctl reload caddy
```

---

# 🔧 Dépannage

| Symptôme | Cause | Solution |
|---|---|---|
| Build Vercel arrêté : "⛔ Configuration incomplète" | variable d'env manquante | compléter dans Settings → Environment Variables |
| Login → "Erreur de connexion" | `SESSION_SECRET` absent | ajouter + redeploy |
| Login → 401 | `ADMIN_EMAIL`/`ADMIN_PASSWORD` absents en prod | ajouter + redeploy |
| Paiement → 503 "Passerelle non configurée" | `MONEROO_SECRET_KEY` absente | ajouter + redeploy |
| Webhook → 503 | `MONEROO_WEBHOOK_SECRET` absente | ajouter + redeploy |
| Webhook → 401 "Signature invalide" | secret ≠ celui de la console | aligner les deux |
| Données qui disparaissent | base SQLite encore utilisée | vérifier `DATABASE_URL` PostgreSQL + `provider = "postgresql"` dans le schéma |
| Restaurant créé mais "non activé" | abonnement non payé / webhook non reçu | vérifier l'URL webhook + `payment/verify` |

# 📦 Base de données — précisions

- **Schéma** : `prisma/schema.prisma` (provider `postgresql`)
- **Sync du schéma** : `npm run db:push` (en local) — fait automatiquement au build Vercel
- **Évolution recommandée** : passer à `prisma migrate dev` pour versionner les migrations
  puis `prisma migrate deploy` dans `vercel-build`
- **Seed démo** : `POST /api/seed` (base vide, ou en-tête `x-seed-token: $SEED_TOKEN`)
