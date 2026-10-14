#!/usr/bin/env node
// ============================================================================
// Vérification des variables d'environnement obligatoires AVANT build/déploiement
// Utilisé par `npm run vercel-build` — échoue vite et fort si une config manque.
//
// Usage : node scripts/check-prod-env.mjs [--force-prod]
// ============================================================================
import { existsSync, readFileSync } from 'node:fs'

// Charge .env local si présent (développement) — en prod (Vercel), les vars sont injectées
if (existsSync('.env')) {
  const raw = readFileSync('.env', 'utf8')
  for (const line of raw.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/)
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2]
  }
}

const isProd = process.env.VERCEL === '1'
  || process.env.NODE_ENV === 'production'
  || process.argv.includes('--force-prod')

const required = [
  'DATABASE_URL',
  'SESSION_SECRET',
  'MONEROO_SECRET_KEY',
  'MONEROO_WEBHOOK_SECRET',
  'NEXT_PUBLIC_APP_URL',
]

// En production stricte : pas de valeurs par défaut pour l'admin bootstrap
const requiredInProd = ['ADMIN_EMAIL', 'ADMIN_PASSWORD']

const missing = required.filter((k) => !process.env[k])
if (isProd) {
  missing.push(...requiredInProd.filter((k) => !process.env[k]))
}

if (missing.length > 0) {
  console.error('\n⛔ Configuration incomplète — variables manquantes :')
  for (const k of missing) console.error(`   • ${k}`)
  console.error('\n   → Vercel : Project → Settings → Environment Variables')
  console.error('   → Serveur : ./scripts/setup-env.sh (ou éditer .env)')
  console.error('   → Modèle  : .env.example\n')
  process.exit(1)
}

// Vérifications de cohérence
const warnings = []
if (isProd && process.env.WEBHOOK_ALLOW_UNSIGNED === 'true') {
  warnings.push('WEBHOOK_ALLOW_UNSIGNED=true est interdit en production (webhooks non signés).')
}
if (isProd && process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
  warnings.push('SESSION_SECRET trop court (32+ caractères recommandés).')
}
if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.startsWith('https://') && isProd) {
  warnings.push('NEXT_PUBLIC_APP_URL devrait être en https:// en production.')
}

if (warnings.length > 0) {
  console.warn('\n⚠️  Avertissements :')
  for (const w of warnings) console.warn(`   • ${w}`)
  console.warn('')
}

console.log(`✅ Variables d'environnement OK (${isProd ? 'production' : 'développement'})`)
