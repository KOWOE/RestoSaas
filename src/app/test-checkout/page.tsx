import { db } from "@/lib/db"
import { CheckoutClient } from "./checkout-client"

export const dynamic = 'force-dynamic'

export default async function TestCheckoutPage() {
  // Récupérer le premier restaurant (ou un spécifique si besoin)
  const restaurant = await db.restaurant.findFirst({
    include: {
      products: true,
    }
  })

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="bg-card p-8 rounded-2xl shadow-sm border border-border text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-foreground mb-2">Aucun restaurant trouvé</h1>
          <p className="text-muted-foreground mb-6">
            Vous devez d'abord créer un restaurant et un produit.
          </p>
        </div>
      </div>
    )
  }

  const testProduct = restaurant.products[0]

  if (!testProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="bg-card p-8 rounded-2xl shadow-sm border border-border text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-foreground mb-2">Aucun produit trouvé</h1>
          <p className="text-muted-foreground mb-6">
            Exécutez le script create-product.js pour créer un produit de test.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden bg-noise">
      <div className="absolute inset-0 bg-background/95 backdrop-blur-[1px] pointer-events-none" />
      
      <div className="relative z-10 container max-w-lg mx-auto py-12 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Finaliser la commande</h1>
          <p className="text-muted-foreground">Vérifiez vos informations et procédez au paiement.</p>
        </div>

        <CheckoutClient restaurant={restaurant} product={testProduct} />
      </div>
    </div>
  )
}
