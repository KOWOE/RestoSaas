'use client'

import Link from 'next/link'
import { UtensilsCrossed } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 bg-amber-100/90 rounded-full flex items-center justify-center mb-6 shadow-sm">
        <UtensilsCrossed className="w-10 h-10 text-amber-500" />
      </div>
      <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
        Restaurant introuvable
      </h1>
      <p className="text-slate-500 font-normal mb-8 max-w-md">
        Ce restaurant n'existe pas ou a été désactivé.
      </p>
      <Button 
        asChild
        className="bg-[#111827] hover:bg-slate-800 text-white font-medium px-8 py-6 rounded-full text-base shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <Link href="/">
          Retour à l'accueil
        </Link>
      </Button>
    </div>
  )
}
