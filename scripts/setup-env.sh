#!/usr/bin/env bash
# ============================================================================
# Zagoor / RestoSaas — Configuration interactive du fichier .env
#
# Usage :  ./scripts/setup-env.sh
#
# - Les secrets sont saisis en lecture MASQUÉE (ils ne s'affichent pas,
#   ne vont ni dans l'historique shell ni dans le chat)
# - SESSION_SECRET et SEED_TOKEN sont générés automatiquement
# - Vérifie que .env n'est jamais suivi par Git
# ============================================================================
set -euo pipefail

cd "$(dirname "$0")/.."

echo "🔧 Configuration de Zagoor / RestoSaas"
echo "======================================"
echo ""

# --- Garde-fous Git --------------------------------------------------------
if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  echo "⛔ ERREUR : .env est suivi par Git !"
  echo "   Lancez d'abord : git rm --cached .env && git commit -m 'untrack .env'"
  exit 1
fi

if [ -f .env ]; then
  echo "⚠️  Un fichier .env existe déjà."
  read -r -p "   Le remplacer ? (o/N) : " confirm
  if [[ ! "${confirm:-N}" =~ ^[oO]$ ]]; then
    echo "Annulé — .env inchangé."
    exit 0
  fi
  cp .env ".env.backup.$(date +%Y%m%d%H%M%S)"
  echo "   (ancienne version sauvegardée)"
fi

# --- Fonctions de saisie ---------------------------------------------------
ask() {           # ask "Question" "variable" ["défaut"]
  local prompt="$1" var="$2" default="${3:-}"
  if [ -n "$default" ]; then
    read -r -p "$prompt [$default] : " value
    value="${value:-$default}"
  else
    read -r -p "$prompt : " value
  fi
  printf -v "$var" '%s' "$value"
}

ask_secret() {    # ask_secret "Question" "variable"
  local prompt="$1" var="$2"
  read -r -s -p "$prompt (masqué) : " value
  echo ""
  printf -v "$var" '%s' "$value"
}

# --- Collecte --------------------------------------------------------------
echo ""
echo "📦 Base de données"
ask "   URL de la base" DATABASE_URL "file:./dev.db"

echo ""
echo "🔐 Authentification"
echo "   (Entrée = génération automatique recommandée)"
ask_secret "   SESSION_SECRET" SESSION_SECRET
if [ -z "$SESSION_SECRET" ]; then
  SESSION_SECRET="$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")"
  echo "   → SESSION_SECRET généré automatiquement ✅"
fi
ask "   ADMIN_EMAIL (compte super-admin)" ADMIN_EMAIL "admin@restaurant.com"
ask_secret "   ADMIN_PASSWORD (super-admin)" ADMIN_PASSWORD
if [ -z "$ADMIN_PASSWORD" ]; then
  echo "   ⚠️  Mot de passe vide — refusez de démarrer en production sans mot de passe fort !"
fi

echo ""
echo "💳 Passerelle Moneroo / FedaPay"
echo "   (clés créées/révoquées dans la console Moneroo → API Keys)"
ask_secret "   MONEROO_SECRET_KEY" MONEROO_SECRET_KEY
ask "   MONEROO_WEBHOOK_URL (hooks.moneroo.io/ho_…)" MONEROO_WEBHOOK_URL ""
ask_secret "   MONEROO_WEBHOOK_SECRET (ih_…)" MONEROO_WEBHOOK_SECRET
ask "   MONEROO_URL" MONEROO_URL "https://api.moneroo.io/v1/payments/initialize"
ask "   MONEROO_VERIFY_URL" MONEROO_VERIFY_URL "https://api.moneroo.io/v1/payments"

echo ""
echo "🧪 Supabase API publique (optionnel — Auth/Storage ultérieurs)"
ask "   NEXT_PUBLIC_SUPABASE_URL" NEXT_PUBLIC_SUPABASE_URL ""
ask_secret "   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

echo ""
echo "🌍 Application"
ask "   NEXT_PUBLIC_APP_URL" NEXT_PUBLIC_APP_URL "http://localhost:3000"
echo ""
echo "   WEBHOOK_ALLOW_UNSIGNED=true accepte les webhooks NON signés."
echo "   → Laissez 'false' sauf en développement local."
ask "   WEBHOOK_ALLOW_UNSIGNED" WEBHOOK_ALLOW_UNSIGNED "false"
SEED_TOKEN="$(node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")"

# --- Écriture --------------------------------------------------------------
cat > .env <<EOF
# Généré par scripts/setup-env.sh le $(date -u +%Y-%m-%dT%H:%M:%SZ)
# ⚠️ Fichier local — ne JAMAIS commiter.

DATABASE_URL="${DATABASE_URL}"

SESSION_SECRET="${SESSION_SECRET}"
ADMIN_EMAIL="${ADMIN_EMAIL}"
ADMIN_PASSWORD="${ADMIN_PASSWORD}"

MONEROO_URL="${MONEROO_URL}"
MONEROO_VERIFY_URL="${MONEROO_VERIFY_URL}"
MONEROO_SECRET_KEY="${MONEROO_SECRET_KEY}"
MONEROO_WEBHOOK_URL="${MONEROO_WEBHOOK_URL}"
MONEROO_WEBHOOK_SECRET="${MONEROO_WEBHOOK_SECRET}"
WEBHOOK_ALLOW_UNSIGNED="${WEBHOOK_ALLOW_UNSIGNED}"

NEXT_PUBLIC_SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="${NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}"

NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL}"
SEED_TOKEN="${SEED_TOKEN}"

NEXTAUTH_SECRET="${SESSION_SECRET}"
NEXTAUTH_URL="${NEXT_PUBLIC_APP_URL}"
EOF

chmod 600 .env

echo ""
echo "✅ .env écrit (droits 600) et non suivi par Git."
echo ""
echo "======================================"
echo "📋 Prochaines étapes :"
echo "======================================"
echo "1. Appliquer les index en base :"
echo "     npm run db:push"
echo ""
echo "2. Démarrer :"
echo "     npm run dev          # développement"
echo "     npm run build && npm start   # production"
echo ""
echo "3. Vérifier le login super-admin :"
echo "     curl -X POST http://localhost:3000/api/auth/login \\"
echo "       -H 'Content-Type: application/json' \\"
echo "       -d '{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"VOTRE_MDP\"}'"
echo ""
echo "4. Tester le webhook (depuis la console Moneroo, bouton « Send test event »,"
echo "   ou avec la commande ci-dessous en remplaçant le corps par un événement) :"
echo "     BODY='{\"event\":\"payment.failed\",\"data\":{\"id\":\"test\",\"status\":\"failed\"}}'"
echo "     SIG=\$(node -e \"console.log(require('crypto').createHmac('sha256','${MONEROO_WEBHOOK_SECRET:0:8}...').update(process.argv[1]).digest('hex'))\" \"\$BODY\")"
echo "     curl -X POST http://localhost:3000/api/webhooks/moneroo -H 'Content-Type: application/json' -H \"x-moneroo-signature: \$SIG\" -d \"\$BODY\""
echo "     # attendu : 200 {\"received\":true}"
echo ""
echo "5. ⚠️  N'oubliez pas de RÉVOQUER les anciennes clés dans la console Moneroo"
echo "   si ce n'est pas déjà fait (les anciennes sont compromises dans l'historique Git)."
