"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Receipt, CreditCard, ArrowRight } from "lucide-react"

export function CheckoutClient({ restaurant, product }: { restaurant: any, product: any }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "John Doe",
    email: "john@example.com",
    phone: "22990000000"
  })

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          tableNumber: "T1",
          type: "dine_in",
          paymentMethod: "moneroo",
          items: [
            {
              productId: product.id,
              quantity: 1,
              notes: "Sans oignon"
            }
          ]
        })
      })

      const data = await res.json()

      if (data.paymentData?.checkout_url) {
        // Redirection vers Moneroo
        window.location.href = data.paymentData.checkout_url
      } else {
        alert("Erreur lors de l'initialisation du paiement")
        setLoading(false)
      }
    } catch (error) {
      console.error(error)
      alert("Une erreur est survenue")
      setLoading(false)
    }
  }

  const tax = product.price * restaurant.taxRate
  const total = product.price + tax

  return (
    <Card className="border-border shadow-md rounded-2xl overflow-hidden group hover:shadow-lg transition-all duration-300">
      <CardHeader className="bg-secondary/50 border-b border-border pb-6">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Receipt className="w-5 h-5 text-accent" />
          Résumé de la commande
        </CardTitle>
      </CardHeader>
      
      <form onSubmit={handleCheckout}>
        <CardContent className="pt-6 space-y-6">
          {/* Order Summary */}
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium text-foreground">{product.name}</p>
                <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>
              </div>
              <p className="font-medium whitespace-nowrap">{product.price} {restaurant.currency}</p>
            </div>
            
            <div className="h-px bg-border w-full" />
            
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <p>Sous-total</p>
              <p>{product.price} {restaurant.currency}</p>
            </div>
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <p>Taxes ({(restaurant.taxRate * 100).toFixed(0)}%)</p>
              <p>{tax.toFixed(0)} {restaurant.currency}</p>
            </div>
            
            <div className="flex justify-between items-center font-bold text-lg pt-2">
              <p>Total</p>
              <p className="text-accent">{total.toFixed(0)} {restaurant.currency}</p>
            </div>
          </div>

          <div className="h-px bg-border w-full" />

          {/* Customer Info */}
          <div className="space-y-4">
            <h3 className="font-medium text-foreground">Vos informations</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input 
                id="name" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="focus-visible:ring-accent bg-background" 
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="focus-visible:ring-accent bg-background" 
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input 
                id="phone" 
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="focus-visible:ring-accent bg-background" 
                required
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-secondary/30 pt-6 pb-6">
          <Button 
            type="submit" 
            className="w-full bg-accent hover:bg-accent/90 text-white font-medium h-12 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-md active:scale-95 group relative overflow-hidden"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <div className="flex items-center justify-center gap-2 w-full">
                <CreditCard className="w-5 h-5" />
                <span>Payer {total.toFixed(0)} {restaurant.currency}</span>
                <ArrowRight className="w-4 h-4 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 absolute right-6" />
              </div>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
