# 🚀 Déploiement production — Zagoor / RestoSaas

Ce guide couvre le déploiement type **VPS + Caddy (HTTPS) + Node.js standalone**,
qui correspond aux scripts du dépôt (`npm run build` → `npm start`).

---

## 0. Prérequis sur le serveur

- Un VPS (Ubuntu/Debian) avec un domaine pointé dessus (ex : `zagoor.com`)
- Node.js 20+ (`curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs`)
- Caddy (`sudo apt install -y caddy`) — gère HTTPS automatiquement
- Git

---

## 1. Récupérer le code

```bash
sudo mkdir -p /opt/restosaas && sudo chown $USER /opt/restosaas
cd /opt/restosaas
git clone https://github.com/KOWOE/RestoSaas.git .
git checkout arena/f9c06fb9-restosaas
```

Pour les prochaines mises à jour : `git pull`.

---

## 2. Configurer les variables d'environnement (le vrai secret)

⚠️ **Jamais de clés dans Git.** Le fichier `.env` du serveur est local et ignoré par Git.

```bash
cd /opt/restosaas
./scripts/setup-env.sh     # saisie masquée des clés, génération auto de SESSION_SECRET
```

Ou manuellement : `cp .env.example .env` puis remplir :

| Variable | Obligatoire | Valeur production |
|---|---|---|
| `SESSION_SECRET` | ✅ | `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `ADMIN_EMAIL` | ✅ | email du compte super-admin (aucune valeur par défaut en prod) |
| `ADMIN_PASSWORD` | ✅ | mot de passe fort (aucune valeur par défaut en prod) |
| `MONEROO_SECRET_KEY` | ✅ | clé **live** (`pvk_…`) créée dans la console Moneroo |
| `MONEROO_WEBHOOK_SECRET` | ✅ | secret du webhook Moneroo (`ih_…`) |
| `WEBHOOK_ALLOW_UNSIGNED` | ✅ | **`false`** (le code refuse de toute façon les webhooks non signés en prod) |
| `NEXT_PUBLIC_APP_URL` | ✅ | `https://votre-domaine.com` |
| `DATABASE_URL` | ✅ | `file:./prisma/dev.db` (SQLite) ou URL PostgreSQL |
| `MONEROO_URL` | optionnel | `https://api.moneroo.io/v1/payments/initialize` |
| `MONEROO_VERIFY_URL` | optionnel | `https://api.moneroo.io/v1/payments` |
| `SEED_TOKEN` | optionnel | si vous voulez peupler la base de démo à distance |

Sécurité du fichier : `chmod 600 .env`

---

## 3. Base de données

```bash
npm install
npm run db:push      # synchronise le schéma (index, tables)
```

---

## 4. Build + service systemd

```bash
npm run build        # génère .next/standalone (+ copie des assets, fait par le script)
```

Copier le service : `sudo cp deploy/zagoor.service /etc/systemd/system/`
Ajuster `User=` et les chemins si besoin, puis :

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now zagoor
sudo systemctl status zagoor      # doit être "active (running)"
curl -s http://127.0.0.1:3000/api  # → {"message":"Hello, world!"}
```

---

## 5. Caddy (HTTPS + proxy)

```bash
sudo cp deploy/Caddyfile.production /etc/caddy/Caddyfile
# → remplacer zagoor.com par votre domaine
sudo systemctl reload caddy
```

Vérifier : `curl -I https://votre-domaine.com` → `200`, avec `strict-transport-security`.

---

## 6. Côté Moneroo (console)

1. **API Keys** : la clé live utilisée dans `.env`
2. **Webhooks** : endpoint `https://votre-domaine.com/api/webhooks/moneroo`,
   événements `payment.success`, `payment.failed` — copier le secret (`ih_…`) dans `MONEROO_WEBHOOK_SECRET`
3. Faire un **envoi de test** depuis la console → réponse attendue `200 {"received":true}`

---

## 7. Vérifications post-déploiement

```bash
# Login super-admin (doit renvoyer success + cookie)
curl -X POST https://votre-domaine.com/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"VOTRE-ADMIN","password":"VOTRE-MDP"}'

# Les API protégées doivent refuser sans session (401)
curl -o /dev/null -w "%{http_code}\n" "https://votre-domaine.com/api/orders?restaurantId=x"

# Webhook sans signature → 401
curl -o /dev/null -w "%{http_code}\n" -X POST https://votre-domaine.com/api/webhooks/moneroo -d '{}'
```

---

## 8. 🔒 Checklist sécurité (à faire APRÈS le déploiement)

- [ ] **Révoquer toute clé qui a circulé dans un chat / email** et en générer une nouvelle dans la console Moneroo, puis `sudo systemctl restart zagoor`
- [ ] `.env` en `chmod 600`, jamais commité (`git check-ignore .env` doit répondre `.env`)
- [ ] Pare-feu : seul Caddy (80/443) est exposé — `sudo ufw allow 'Caddy Full' && sudo ufw enable`
- [ ] Backups : copier régulièrement `prisma/dev.db` (ou activer les backups PostgreSQL)
- [ ] Les comptes créés lors des souscriptions reçoivent un **mot de passe temporaire affiché une fois** — inviter les propriétaires à le changer (fonction "changer le mot de passe" à venir)

---

## Dépannage

| Symptôme | Cause | Solution |
|---|---|---|
| Login → 500 ou "Erreur de connexion" | `SESSION_SECRET` absent | compléter `.env`, `systemctl restart zagoor` |
| Login → 401 bootstrap | `ADMIN_EMAIL`/`ADMIN_PASSWORD` absents en prod | compléter `.env`, restart |
| Paiement → 503 "Passerelle non configurée" | `MONEROO_SECRET_KEY` absente | compléter `.env`, restart |
| Webhook → 503 | `MONEROO_WEBHOOK_SECRET` absente | compléter `.env`, restart |
| Webhook → 401 "Signature invalide" | secret différent de celui de la console | aligner les deux |
| Restaurant créé mais "non activé" | paiement d'abonnement non abouti | vérifier le webhook / `payment/verify` |
