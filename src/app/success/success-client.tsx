"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ArrowRight, Receipt, Loader2, XCircle } from "lucide-react"
import Link from "next/link"

export function SuccessClient() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")

  useEffect(() => {
    // Dans un cas réel, Moneroo redirige avec des paramètres dans l'URL.
    // Vous pourriez vérifier le statut exact ici ou appeler votre backend pour vérifier la transaction.
    // Pour l'instant, on simule un petit chargement puis un succès.
    const timer = setTimeout(() => {
      // S'il y a un paramètre d'erreur spécifique, on pourrait le gérer
      if (searchParams.get("error")) {
        setStatus("error")
      } else {
        setStatus("success")
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [searchParams])

  if (status === "loading") {
    return (
      <Card className="border-border shadow-lg rounded-2xl overflow-hidden">
        <CardContent className="pt-12 pb-12 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Vérification du paiement...</h2>
          <p className="text-muted-foreground text-sm">Veuillez patienter quelques instants.</p>
        </CardContent>
      </Card>
    )
  }

  if (status === "error") {
    return (
      <Card className="border-border shadow-lg rounded-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
        <CardContent className="pt-10 pb-6 flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
            <XCircle className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Paiement échoué</h1>
          <p className="text-muted-foreground">
            Nous n'avons pas pu valider votre paiement. Veuillez réessayer.
          </p>
        </CardContent>
        <CardFooter className="bg-secondary/30 pt-6 pb-6 flex flex-col gap-3">
          <Link href="/test-checkout" className="w-full">
            <Button className="w-full bg-accent hover:bg-accent/90 text-white rounded-xl h-12">
              Réessayer
            </Button>
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="border-border shadow-xl rounded-2xl overflow-hidden animate-in fade-in zoom-in duration-700 slide-in-from-bottom-4">
      <div className="h-2 w-full bg-gradient-to-r from-accent to-accent/60" />
      <CardContent className="pt-10 pb-6 flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <div className="absolute inset-0 bg-chart-2/20 rounded-full animate-ping opacity-75" />
          <div className="relative w-20 h-20 rounded-full bg-chart-2/10 flex items-center justify-center mb-2">
            <CheckCircle2 className="w-10 h-10 text-chart-2" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Paiement Réussi !</h1>
          <p className="text-muted-foreground text-sm px-4">
            Votre commande a bien été validée et envoyée en cuisine.
          </p>
        </div>

        <div className="w-full bg-secondary/50 rounded-xl p-4 mt-6 border border-border/50 text-left space-y-3">
          <div className="flex items-center gap-2 text-foreground font-medium mb-1">
            <Receipt className="w-4 h-4 text-accent" />
            <span>Détails</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Statut</span>
            <span className="font-medium text-chart-2 bg-chart-2/10 px-2 py-0.5 rounded-full text-xs">Confirmé</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Mode de paiement</span>
            <span className="font-medium">Moneroo</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="bg-secondary/30 pt-6 pb-6 flex flex-col gap-3">
        <Link href="/test-checkout" className="w-full">
          <Button variant="outline" className="w-full border-border hover:bg-secondary text-foreground rounded-xl h-12 transition-all hover:scale-[1.02]">
            Nouvelle commande
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
