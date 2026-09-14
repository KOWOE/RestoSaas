'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  CheckCircle2, 
  ArrowRight, 
  UtensilsCrossed, 
  Receipt, 
  ShieldCheck, 
  Store, 
  Sparkles, 
  ExternalLink,
  Loader2,
  Clock,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

function SuccessContent() {
  const searchParams = useSearchParams()
  const paymentId = searchParams.get('paymentId') || searchParams.get('id') || searchParams.get('token')
  const type = searchParams.get('type') || 'subscription'
  const slug = searchParams.get('slug')
  const orderId = searchParams.get('orderId')
  const amountParam = searchParams.get('amount')
  const plan = searchParams.get('plan')

  const [verifying, setVerifying] = useState(Boolean(paymentId))
  const [paymentDetails, setPaymentDetails] = useState<{
    isPaid?: boolean
    amount?: number
    currency?: string
    customer?: { email?: string; first_name?: string; last_name?: string }
    transactionId?: string
  } | null>(null)

  useEffect(() => {
    if (paymentId) {
      fetch(`/api/payment/verify?paymentId=${encodeURIComponent(paymentId)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setPaymentDetails(data)
          }
        })
        .catch(err => console.error('Erreur vérification paiement:', err))
        .finally(() => setVerifying(false))
    }
  }, [paymentId])

  const formattedAmount = paymentDetails?.amount 
    ? `${paymentDetails.amount.toLocaleString('fr-FR')} ${paymentDetails.currency || 'FCFA'}`
    : amountParam 
      ? `${Number(amountParam).toLocaleString('fr-FR')} FCFA`
      : plan === 'annual' ? '54 000 FCFA' : '5 500 FCFA'

  return (
    <div className="min-h-screen bg-[#FFFBF5] text-[#1C1917] font-sans selection:bg-[#EA580C] selection:text-white relative flex flex-col justify-between">
      
      {/* Texture de fond bruit SVG */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.035] bg-noise" />

      {/* Header Minimalist */}
      <header className="border-b border-[#FDE8CD] bg-[#FFFBF5]/90 backdrop-blur-md sticky top-0 z-40 py-4 px-4 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#EA580C] to-[#C2410C] flex items-center justify-center text-white shadow-md shadow-[#EA580C]/25 transition-transform group-hover:scale-105">
              <UtensilsCrossed className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-[#1C1917] font-heading">
              Zagoor<span className="text-[#EA580C]">.</span>
            </span>
          </Link>

          <Badge className="bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/20 flex items-center gap-1.5 px-3 py-1 font-semibold text-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            Paiement Confirmé
          </Badge>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-12 flex flex-col items-center justify-center">
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="w-full text-center"
        >
          {/* Animated Success Badge */}
          <div className="relative inline-block mb-6">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 220, damping: 15 }}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-[#16A34A] to-[#22C55E] flex items-center justify-center text-white shadow-xl shadow-[#16A34A]/25 mx-auto"
            >
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-white stroke-[2.5]" />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-[#EA580C] text-white flex items-center justify-center shadow-md border-2 border-[#FFFBF5]"
            >
              <Sparkles className="w-4 h-4 text-white" />
            </motion.div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1C1917] tracking-tight font-heading mb-2">
            {type === 'subscription' ? 'Abonnement Zagoor Pro Activé !' : 'Commande Validée & Payée !'}
          </h1>
          <p className="text-sm sm:text-base text-[#78716C] max-w-md mx-auto mb-8">
            {type === 'subscription' 
              ? 'Votre paiement a été traité et sécurisé avec succès via la passerelle Mobile Money / Carte.'
              : 'Votre commande a été transmise instantanément à la cuisine du restaurant.'}
          </p>

          {/* Receipt Card */}
          <Card className="border border-[#FDE8CD] bg-white rounded-2xl shadow-sm text-left mb-8 overflow-hidden">
            <div className="bg-[#FFF7ED] border-b border-[#FDE8CD] px-6 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#EA580C]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#EA580C]">
                  Reçu de Transaction
                </span>
              </div>
              {verifying ? (
                <div className="flex items-center gap-1.5 text-xs text-[#78716C]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#EA580C]" />
                  <span>Vérification...</span>
                </div>
              ) : (
                <span className="text-xs font-semibold text-[#16A34A] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Validé
                </span>
              )}
            </div>

            <CardContent className="p-6 space-y-4 text-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#FDE8CD]/60">
                <span className="text-[#78716C]">Type de service</span>
                <span className="font-bold text-[#1C1917]">
                  {type === 'subscription' ? `Abonnement SaaS (${plan === 'annual' ? 'Annuel' : 'Mensuel'})` : 'Commande en ligne'}
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-[#FDE8CD]/60">
                <span className="text-[#78716C]">Montant total réglé</span>
                <span className="font-extrabold text-[#1C1917] font-mono text-base text-[#EA580C]">
                  {formattedAmount}
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-[#FDE8CD]/60">
                <span className="text-[#78716C]">Moyen de règlement</span>
                <span className="font-semibold text-[#1C1917] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                  Passerelle Sécurisée (FedaPay / Moneroo)
                </span>
              </div>

              {paymentId && (
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-[#78716C]">Réf. Transaction</span>
                  <span className="font-mono text-[#78716C] bg-[#FFF7ED] px-2 py-0.5 rounded border border-[#FDE8CD]">
                    {paymentId.slice(0, 18)}...
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
            {slug ? (
              <>
                <Button 
                  asChild 
                  className="w-full sm:w-auto h-12 px-6 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold shadow-md shadow-[#EA580C]/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                >
                  <Link href={`/${slug}`}>
                    <Store className="w-4 h-4" />
                    <span>Accéder à mon Restaurant</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </Button>

                <Button 
                  asChild 
                  variant="outline"
                  className="w-full sm:w-auto h-12 px-6 rounded-xl border-[#FDE8CD] bg-white hover:bg-[#FFF7ED] text-[#1C1917] font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Link href={`/${slug}?tab=dashboard`}>
                    <span>Cockpit Gérant</span>
                    <ExternalLink className="w-4 h-4 text-[#78716C]" />
                  </Link>
                </Button>
              </>
            ) : (
              <Button 
                asChild 
                className="w-full sm:w-auto h-12 px-8 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white font-bold shadow-md shadow-[#EA580C]/20 transition-all hover:scale-[1.02]"
              >
                <Link href="/">
                  <span>Retourner à l&apos;accueil</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            )}
          </div>
        </motion.div>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#FDE8CD] py-6 px-4 text-center text-xs text-[#78716C]">
        <p>© 2026 Zagoor SaaS. Tous droits réservés. Transactions sécurisées par FedaPay & Moneroo.</p>
      </footer>

    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#EA580C]" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
