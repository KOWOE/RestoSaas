#!/usr/bin/env node
// ============================================================================
// Build de production (Vercel) — étapes annotées pour un diagnostic instantané
// Remplace : "node scripts/check-prod-env.mjs && prisma generate && ..."
// ============================================================================
import { execSync } from 'node:child_process'

const steps = [
  {
    label: "Vérification des variables d'environnement",
    cmd: 'node scripts/check-prod-env.mjs',
    hint: "→ Complétez les variables manquantes (Vercel → Settings → Environment Variables,\n   environnement « Production » cochée) puis cliquez sur Redeploy.",
  },
  {
    label: 'Génération du client Prisma',
    cmd: 'npx prisma generate',
    hint: '→ Rare. Vérifiez que prisma/schema.prisma est valide.',
  },
  {
    label: 'Synchronisation du schéma en base (prisma db push)',
    cmd: 'npx prisma db push --skip-generate',
    hint: "→ Vérifiez DATABASE_URL :\n   • doit commencer par postgresql:// (PAS https:// — ça, c'est l'URL du dashboard Supabase)\n   • mode « Session » du Connection string Supabase\n   • si le mot de passe contient @ # / % : il doit être encodé (%40 %23 %2F %25)\n     (bouton « Reset database password » + copier l'URI telle quelle)\n   • la base Supabase est bien « Active » (pas en pause après inactivité)",
  },
  {
    label: 'Build Next.js',
    cmd: 'npm run build',
    hint: "→ Envoyez le bloc d'erreur complet ci-dessus à votre assistant.",
  },
]

console.log('🚀 vercel-build — Zagoor / RestoSaas')

let current = ''
try {
  for (const step of steps) {
    current = step.label
    console.log('\n' + '─'.repeat(64))
    console.log(`▶ Étape : ${step.label}`)
    console.log(`  $ ${step.cmd}`)
    console.log('─'.repeat(64))
    execSync(step.cmd, { stdio: 'inherit' })
    console.log(`✅ ${step.label} — OK`)
  }
} catch {
  const step = steps.find((s) => s.label === current)
  console.error('\n' + '⛔'.repeat(32))
  console.error(`⛔ ÉCHEC DE L'ÉTAPE : ${current}`)
  console.error(`   Commande : ${step?.cmd || '?'}`)
  console.error(step?.hint || '')
  console.error('⛔'.repeat(32) + '\n')
  process.exit(1)
}

console.log('\n🎉 vercel-build terminé avec succès — prêt à déployer.')
