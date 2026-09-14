'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  UtensilsCrossed, 
  Crown, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  Sparkles, 
  Smartphone, 
  CreditCard, 
  Store, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Building2, 
  QrCode, 
  Loader2, 
  Receipt,
  CheckCircle2,
  Lock,
  Flame,
  Award,
  Truck
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

const AFRICAN_COUNTRIES = [
  { name: 'Bénin', code: 'BJ', dial: '+229', currency: 'XOF' },
  { name: 'Côte d\'Ivoire', code: 'CI', dial: '+225', currency: 'XOF' },
  { name: 'Sénégal', code: 'SN', dial: '+221', currency: 'XOF' },
  { name: 'Togo', code: 'TG', dial: '+228', currency: 'XOF' },
  { name: 'Cameroun', code: 'CM', dial: '+237', currency: 'XAF' },
  { name: 'Mali', code: 'ML', dial: '+223', currency: 'XOF' },
  { name: 'Burkina Faso', code: 'BF', dial: '+226', currency: 'XOF' },
  { name: 'Gabon', code: 'GA', dial: '+241', currency: 'XAF' },
  { name: 'Guinée', code: 'GN', dial: '+224', currency: 'GNF' },
  { name: 'RDC', code: 'CD', dial: '+243', currency: 'CDF' },
]

const CUISINE_TYPES = [
  { id: 'gastronomique', label: 'Gastronomie & Africain Moderne', icon: '🍽️', desc: 'Spécialités raffinées, dressage soigné' },
  { id: 'grillades', label: 'Grillades, Braises & Maquis', icon: '🔥', desc: 'Poulet braisé, suya, poissons & brochettes' },
  { id: 'default', label: 'Bistrot, Lounge & Bar', icon: '🍹', desc: 'Cocktails, tapas, desserts & plats du jour' },
]

const SERVICE_MODELS = [
  { 
    id: 'both', 
    label: 'Les Deux (Hybride)', 
    badge: '3-en-1 Recommandé', 
    icon: '🌟', 
    desc: 'Service en salle avec tables QR Code + Vente à emporter & Livraison à domicile.',
    modes: ['Sur place (Tables)', 'À emporter', 'Livraison']
  },
  { 
    id: 'physical', 
    label: 'Restaurant Physique', 
    badge: 'Salle & Comptoir', 
    icon: '🏛️', 
    desc: 'Établissement physique avec accueil des clients en salle, à emporter et livraison.',
    modes: ['Sur place (Tables)', 'À emporter', 'Livraison']
  },
  { 
    id: 'online', 
    label: 'Restaurant en Ligne (Dark Kitchen)', 
    badge: '100% Digital', 
    icon: '🛵', 
    desc: 'Cuisine virtuelle sans salle physique. Commandes en livraison et à emporter uniquement.',
    modes: ['À emporter', 'Livraison (Pas de tables)']
  },
]

const PAYMENT_PROVIDERS = [
  { id: 'wave', name: 'Wave', badge: '0% Frais', color: 'bg-cyan-500' },
  { id: 'mtn', name: 'MTN Mobile Money', badge: 'MoMo', color: 'bg-yellow-500' },
  { id: 'moov', name: 'Moov Money', badge: 'Flooz', color: 'bg-blue-600' },
  { id: 'orange', name: 'Orange Money', badge: 'OM', color: 'bg-orange-500' },
  { id: 'card', name: 'Carte Bancaire', badge: 'Visa / Mastercard', color: 'bg-slate-800' },
]

export default function SouscrirePage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [isAnnual, setIsAnnual] = useState(true)
  const [loading, setLoading] = useState(false)
  const [createdSlug, setCreatedSlug] = useState<string | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    restaurantName: '',
    cuisineType: 'gastronomique',
    serviceType: 'both', // 'physical' | 'online' | 'both'
    country: 'Bénin',
    city: 'Cotonou',
    phone: '',
    email: '',
    ownerName: '',
    tableCount: '8',
    paymentProvider: 'wave',
    paymentPhone: '',
  })

  // Simulated OTP/USSD progress during payment
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'approved'>('idle')

  const currentPricePerMonth = isAnnual ? 4500 : 5500
  const totalBilledAmount = isAnnual ? 54000 : 5500

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.restaurantName.trim()) {
      toast.error('Veuillez renseigner le nom de votre établissement.')
      return
    }
    if (!formData.ownerName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast.error('Veuillez renseigner vos coordonnées de contact.')
      return
    }
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePaymentAndCreation = async () => {
    if (formData.paymentProvider !== 'card' && !formData.paymentPhone.trim()) {
      toast.error('Veuillez indiquer le numéro Mobile Money pour le débit.')
      return
    }

    setLoading(true)
    setPaymentStatus('processing')

    try {
      // 1. Création préalable du restaurant en base de données
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantName: formData.restaurantName,
          cuisineType: formData.cuisineType,
          serviceType: formData.serviceType,
          city: formData.city,
          country: formData.country,
          phone: formData.phone,
          email: formData.email,
          ownerName: formData.ownerName,
          currency: 'XOF',
          tableCount: formData.serviceType === 'online' ? 0 : (parseInt(formData.tableCount) || 8),
          billingCycle: isAnnual ? 'annual' : 'monthly',
          paymentMethod: formData.paymentProvider === 'card' ? 'card' : 'mobile_money',
          paymentProvider: formData.paymentProvider,
          paymentPhone: formData.paymentPhone || formData.phone,
        })
      })

      const data = await res.json()

      if (!res.ok || !data.restaurant) {
        throw new Error(data.error || 'Erreur lors de la création du compte.')
      }

      const createdRestaurant = data.restaurant
      setCreatedSlug(createdRestaurant.slug)

      // 2. Initialisation du paiement auprès de la passerelle Moneroo / FedaPay
      const returnUrl = `${window.location.origin}/success?type=subscription&restaurantId=${createdRestaurant.id}&slug=${createdRestaurant.slug}&amount=${totalBilledAmount}&plan=${isAnnual ? 'annual' : 'monthly'}`

      const paymentRes = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalBilledAmount,
          currency: 'XOF',
          description: `Abonnement Zagoor Pro (${isAnnual ? 'Annuel' : 'Mensuel'}) - ${formData.restaurantName}`,
          type: 'subscription',
          restaurantId: createdRestaurant.id,
          customer: {
            email: formData.email,
            first_name: formData.ownerName.split(' ')[0] || 'Chef',
            last_name: formData.ownerName.split(' ').slice(1).join(' ') || 'Restaurateur',
            phone: formData.paymentPhone || formData.phone
          },
          returnUrl,
          metadata: {
            restaurantId: createdRestaurant.id,
            slug: createdRestaurant.slug,
            plan: isAnnual ? 'annual' : 'monthly',
            billingCycle: isAnnual ? 'annual' : 'monthly',
            restaurantName: formData.restaurantName
          }
        })
      })

      const paymentData = await paymentRes.json()

      // 3. Si une URL de checkout Moneroo / FedaPay est fournie, redirection sécurisée
      if (paymentData.success && paymentData.checkoutUrl) {
        toast.success('Paiement initié ! Redirection vers la passerelle sécurisée (FedaPay / MoMo / Wave / Carte)...')
        setPaymentStatus('approved')
        setTimeout(() => {
          window.location.href = paymentData.checkoutUrl
        }, 1000)
        return
      }

      // Si mode direct / sandbox sans redirection externe
      setPaymentStatus('approved')
      setStep(3)
      toast.success(`Félicitations Chef ${formData.ownerName} ! Votre restaurant est en ligne.`)

    } catch (err: unknown) {
      console.error(err)
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue'
      toast.error(errorMsg || 'Impossible d\'enregistrer le restaurant.')
      setPaymentStatus('idle')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5] text-[#1C1917] font-sans selection:bg-[#EA580C] selection:text-white relative pb-20">
      
      {/* Texture de fond bruit SVG */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.035] bg-noise" />

      {/* Header Minimalist */}
      <header className="border-b border-[#FDE8CD] bg-[#FFFBF5]/90 backdrop-blur-md sticky top-0 z-40 py-4 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#EA580C] to-[#C2410C] flex items-center justify-center text-white shadow-md shadow-[#EA580C]/25">
              <UtensilsCrossed className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-[#1C1917] font-heading">
              Zagoor<span className="text-[#EA580C]">.</span>
            </span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-semibold text-[#78716C]">
            <Lock className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>Souscription Sécurisée Zagoor Pro</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14">
        
        {/* Stepper Progress */}
        <div className="mb-10">
          <div className="flex items-center justify-between max-w-md mx-auto relative">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-[#FDE8CD] -z-10" />
            
            <div className={`flex flex-col items-center gap-1.5 ${step >= 1 ? 'text-[#EA580C]' : 'text-[#78716C]'}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                step >= 1 ? 'bg-[#EA580C] text-white shadow-md shadow-[#EA580C]/30' : 'bg-white border-2 border-[#FDE8CD] text-[#78716C]'
              }`}>
                {step > 1 ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <span className="text-xs font-bold">Restaurant</span>
            </div>

            <div className={`flex flex-col items-center gap-1.5 ${step >= 2 ? 'text-[#EA580C]' : 'text-[#78716C]'}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                step >= 2 ? 'bg-[#EA580C] text-white shadow-md shadow-[#EA580C]/30' : 'bg-white border-2 border-[#FDE8CD] text-[#78716C]'
              }`}>
                {step > 2 ? <Check className="w-4 h-4" /> : '2'}
              </div>
              <span className="text-xs font-bold">Abonnement</span>
            </div>

            <div className={`flex flex-col items-center gap-1.5 ${step === 3 ? 'text-[#16A34A]' : 'text-[#78716C]'}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                step === 3 ? 'bg-[#16A34A] text-white shadow-md shadow-[#16A34A]/30' : 'bg-white border-2 border-[#FDE8CD] text-[#78716C]'
              }`}>
                <Crown className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold">Activation</span>
            </div>
          </div>
        </div>

        {/* STEP 1: RESTAURANT INFORMATIONS */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <Badge className="bg-[#FFF7ED] text-[#EA580C] border-[#FDE8CD] px-3.5 py-1 font-bold text-xs uppercase rounded-full">
                Étape 1 sur 2 • Configuration
              </Badge>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1C1917] tracking-tight font-heading">
                Configurez votre espace restaurant
              </h1>
              <p className="text-sm sm:text-base text-[#78716C]">
                Ces informations génèrent automatiquement votre menu digital interactif et vos QR Codes.
              </p>
            </div>

            <Card className="border-2 border-[#FDE8CD] bg-white rounded-3xl p-6 sm:p-10 shadow-xl shadow-[#EA580C]/5">
              <form onSubmit={handleStep1Submit} className="space-y-6">
                
                {/* Nom et Cuisine */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="restaurantName" className="font-bold text-sm text-[#1C1917] flex items-center gap-1.5">
                      <Store className="w-4 h-4 text-[#EA580C]" /> Nom de l&apos;établissement *
                    </Label>
                    <Input
                      id="restaurantName"
                      required
                      placeholder="Ex: Le Grill Abidjanais, Lounge Teranga..."
                      value={formData.restaurantName}
                      onChange={e => setFormData({ ...formData, restaurantName: e.target.value })}
                      className="border-[#FDE8CD] focus-visible:ring-[#EA580C] rounded-xl py-5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-sm text-[#1C1917] flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-[#EA580C]" /> Ambiance & Spécialité *
                    </Label>
                    <Select
                      value={formData.cuisineType}
                      onValueChange={(val) => setFormData({ ...formData, cuisineType: val })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionnez une spécialité" />
                      </SelectTrigger>
                      <SelectContent>
                        {CUISINE_TYPES.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            <span className="text-base mr-2">{c.icon}</span>
                            <span className="font-bold">{c.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Modèle d'Exploitation du Restaurant */}
                <div className="space-y-3 pt-1">
                  <div>
                    <Label className="font-bold text-sm text-[#1C1917] flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-[#EA580C]" /> Modèle d&apos;Exploitation *
                    </Label>
                    <p className="text-xs text-[#78716C] mt-0.5">
                      Sélectionnez comment vos clients commanderont vos plats :
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {SERVICE_MODELS.map((model) => {
                      const isSelected = formData.serviceType === model.id
                      return (
                        <div
                          key={model.id}
                          onClick={() => {
                            setFormData({
                              ...formData,
                              serviceType: model.id,
                              tableCount: model.id === 'online' ? '0' : (formData.tableCount === '0' ? '8' : formData.tableCount)
                            })
                          }}
                          className={`cursor-pointer rounded-2xl p-4 border-2 transition-all duration-200 relative flex flex-col justify-between ${
                            isSelected
                              ? 'border-[#EA580C] bg-[#FFF7ED] ring-2 ring-[#EA580C]/20 shadow-md shadow-[#EA580C]/10'
                              : 'border-[#FDE8CD] bg-white hover:border-[#EA580C]/40 hover:bg-[#FFFBF5]'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-2xl">{model.icon}</span>
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                isSelected ? 'bg-[#EA580C] text-white' : 'bg-[#FFF7ED] text-[#EA580C] border border-[#FDE8CD]'
                              }`}>
                                {model.badge}
                              </span>
                            </div>
                            <h4 className="font-extrabold text-sm text-[#1C1917]">{model.label}</h4>
                            <p className="text-xs text-[#78716C] leading-relaxed">{model.desc}</p>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-[#FDE8CD]/70 flex flex-wrap gap-1">
                            {model.modes.map(m => (
                              <span key={m} className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                isSelected ? 'bg-[#EA580C]/10 text-[#EA580C]' : 'bg-stone-100 text-stone-600'
                              }`}>
                                ✓ {m}
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Localisation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="font-bold text-sm text-[#1C1917] flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#EA580C]" /> Pays *
                    </Label>
                    <Select
                      value={formData.country}
                      onValueChange={(val) => setFormData({ ...formData, country: val })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Sélectionnez un pays" />
                      </SelectTrigger>
                      <SelectContent>
                        {AFRICAN_COUNTRIES.map(c => (
                          <SelectItem key={c.code} value={c.name}>
                            <span className="font-bold">{c.name}</span>
                            <span className="text-xs text-[#78716C] ml-1.5">({c.dial})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city" className="font-bold text-sm text-[#1C1917] flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-[#EA580C]" /> Ville / Quartier *
                    </Label>
                    <Input
                      id="city"
                      required
                      placeholder="Ex: Cotonou, Haie Vive / Abidjan, Cocody..."
                      value={formData.city}
                      onChange={e => setFormData({ ...formData, city: e.target.value })}
                      className="border-[#FDE8CD] focus-visible:ring-[#EA580C] rounded-xl py-5"
                    />
                  </div>
                </div>

                {/* Gérant, WhatsApp & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="ownerName" className="font-bold text-sm text-[#1C1917] flex items-center gap-1.5">
                      <User className="w-4 h-4 text-[#EA580C]" /> Nom du Gérant / Chef *
                    </Label>
                    <Input
                      id="ownerName"
                      required
                      placeholder="Ex: Chef Koffi Mensah"
                      value={formData.ownerName}
                      onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
                      className="border-[#FDE8CD] focus-visible:ring-[#EA580C] rounded-xl py-5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="font-bold text-sm text-[#1C1917] flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-[#EA580C]" /> WhatsApp Commandes *
                    </Label>
                    <Input
                      id="phone"
                      required
                      placeholder="+229 97 00 00 00"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="border-[#FDE8CD] focus-visible:ring-[#EA580C] rounded-xl py-5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="font-bold text-sm text-[#1C1917] flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-[#EA580C]" /> Email de gestion *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="contact@mon-resto.com"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="border-[#FDE8CD] focus-visible:ring-[#EA580C] rounded-xl py-5"
                    />
                  </div>
                </div>

                {/* Tables count / Online notice */}
                {formData.serviceType === 'online' ? (
                  <div className="p-4 rounded-2xl bg-[#FFF7ED] border border-[#FDE8CD] flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#EA580C]/10 text-[#EA580C] flex items-center justify-center flex-shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div className="text-xs text-[#78716C] leading-relaxed">
                      <p className="font-bold text-[#1C1917] text-sm mb-0.5">Configuration Restaurant 100% En Ligne (Dark Kitchen)</p>
                      Les QR Codes et tables physiques sont désactivés. Votre menu digital sera configuré directement pour la <strong className="text-[#EA580C]">Livraison à domicile</strong> et les commandes <strong className="text-[#EA580C]">À emporter</strong>.
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-[#FFF7ED] border border-[#FDE8CD] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#EA580C]/10 text-[#EA580C] flex items-center justify-center flex-shrink-0">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[#1C1917]">Nombre de tables à équiper</h4>
                        <p className="text-xs text-[#78716C]">Nous générons automatiquement un QR code haute définition pour chaque table.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Input
                        type="number"
                        min="1"
                        max="50"
                        value={formData.tableCount}
                        onChange={e => setFormData({ ...formData, tableCount: e.target.value })}
                        className="w-24 text-center font-bold font-mono border-[#FDE8CD] bg-white rounded-xl"
                      />
                      <span className="text-xs font-bold text-[#78716C]">Tables</span>
                    </div>
                  </div>
                )}

                {/* Bouton Continuer */}
                <div className="pt-4 flex justify-end">
                  <Button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-6 rounded-2xl bg-[#EA580C] hover:bg-[#C2410C] text-white font-extrabold text-base shadow-xl shadow-[#EA580C]/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Continuer vers le Paiement</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>

              </form>
            </Card>
          </motion.div>
        )}

        {/* STEP 2: SUBSCRIPTION & PAYMENT */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-8"
          >
            <div className="text-center space-y-2">
              <Badge className="bg-[#FFF7ED] text-[#EA580C] border-[#FDE8CD] px-3.5 py-1 font-bold text-xs uppercase rounded-full">
                Étape 2 sur 2 • Paiement de l&apos;Abonnement
              </Badge>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1C1917] tracking-tight font-heading">
                Activation de votre Abonnement Zagoor Pro
              </h1>
              <p className="text-sm sm:text-base text-[#78716C]">
                Toutes les fonctionnalités incluses, sans engagement. Débit Mobile Money sécurisé instantané.
              </p>
            </div>

            {/* Billing Toggle Box */}
            <div className="bg-[#FFF7ED] p-4 rounded-3xl border border-[#FDE8CD] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#EA580C] block">Choix de la formule</span>
                <h4 className="font-extrabold text-base text-[#1C1917]">
                  {isAnnual ? 'Abonnement Annuel (4 500 FCFA / mois)' : 'Abonnement Mensuel (5 500 FCFA / mois)'}
                </h4>
              </div>

              <div className="flex items-center gap-3 bg-white p-1.5 rounded-full border border-[#FDE8CD] shadow-xs">
                <button
                  type="button"
                  onClick={() => setIsAnnual(false)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                    !isAnnual ? 'bg-[#1C1917] text-white shadow-xs' : 'text-[#78716C] hover:text-[#1C1917]'
                  }`}
                >
                  Mensuel (5 500 F)
                </button>
                <button
                  type="button"
                  onClick={() => setIsAnnual(true)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isAnnual ? 'bg-[#EA580C] text-white shadow-xs' : 'text-[#78716C] hover:text-[#1C1917]'
                  }`}
                >
                  <span>Annuel (-20%)</span>
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full">2 mois offerts</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Payment Form (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <Card className="border-2 border-[#FDE8CD] bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#EA580C]/5 space-y-6">
                  
                  <div>
                    <Label className="font-bold text-sm text-[#1C1917] block mb-3">
                      Sélectionnez votre moyen de paiement Mobile Money ou Carte :
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {PAYMENT_PROVIDERS.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, paymentProvider: p.id })}
                          className={`p-3 rounded-2xl border text-left transition-all relative ${
                            formData.paymentProvider === p.id 
                              ? 'border-[#EA580C] bg-[#FFF7ED] ring-2 ring-[#EA580C]/20 shadow-xs' 
                              : 'border-[#FDE8CD] hover:border-[#EA580C]/50 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className={`w-3 h-3 rounded-full ${p.color}`} />
                            {formData.paymentProvider === p.id && (
                              <Check className="w-3.5 h-3.5 text-[#EA580C]" />
                            )}
                          </div>
                          <p className="font-bold text-xs text-[#1C1917]">{p.name}</p>
                          <span className="text-[10px] text-[#78716C]">{p.badge}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {formData.paymentProvider !== 'card' ? (
                    <div className="space-y-2">
                      <Label htmlFor="paymentPhone" className="font-bold text-sm text-[#1C1917] flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-[#EA580C]" /> Numéro de compte Mobile Money *
                      </Label>
                      <Input
                        id="paymentPhone"
                        required
                        placeholder="Ex: 97 00 00 00 (Numéro pour validation USSD)"
                        value={formData.paymentPhone}
                        onChange={e => setFormData({ ...formData, paymentPhone: e.target.value })}
                        className="border-[#FDE8CD] focus-visible:ring-[#EA580C] rounded-xl py-5 font-mono"
                      />
                      <p className="text-[11px] text-[#78716C]">
                        Une notification de confirmation de paiement vous sera envoyée sur ce numéro.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Label className="font-bold text-sm text-[#1C1917] flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-[#EA580C]" /> Coordonnées de carte bancaire
                      </Label>
                      <Input placeholder="Numéro de carte (16 chiffres)" className="border-[#FDE8CD] rounded-xl py-4 font-mono" />
                      <div className="grid grid-cols-2 gap-3">
                        <Input placeholder="MM / AA" className="border-[#FDE8CD] rounded-xl py-4 font-mono" />
                        <Input placeholder="CVC" className="border-[#FDE8CD] rounded-xl py-4 font-mono" />
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex items-center justify-between gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="border-[#FDE8CD] rounded-2xl px-5 py-6 font-bold text-[#78716C]"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1.5" /> Retour
                    </Button>

                    <Button
                      type="button"
                      disabled={loading}
                      onClick={handlePaymentAndCreation}
                      className="px-8 py-6 rounded-2xl bg-[#EA580C] hover:bg-[#C2410C] text-white font-extrabold text-base shadow-xl shadow-[#EA580C]/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex-1"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          <span>Validation en cours...</span>
                        </>
                      ) : (
                        <>
                          <span>Payer {totalBilledAmount.toLocaleString('fr-FR')} FCFA</span>
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="text-center text-[11px] text-[#78716C] flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
                    Paiement crypté 256-bit certifié MoMo & FedaPay. Sans engagement.
                  </p>

                </Card>
              </div>

              {/* Right Column: Order Summary (5 cols) */}
              <div className="lg:col-span-5">
                <Card className="border-2 border-[#EA580C] bg-white rounded-3xl p-6 shadow-xl shadow-[#EA580C]/10 space-y-6 sticky top-24">
                  
                  <div className="flex items-center justify-between pb-4 border-b border-[#FDE8CD]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center font-bold">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-[#1C1917]">Récapitulatif</h4>
                        <p className="text-xs text-[#78716C]">{formData.restaurantName || 'Votre Restaurant'}</p>
                      </div>
                    </div>
                    <Badge className="bg-[#16A34A]/10 text-[#16A34A] border-0 text-[10px] font-bold">
                      Prêt à activer
                    </Badge>
                  </div>

                  <div className="space-y-3 text-xs text-[#1C1917]">
                    <div className="flex justify-between py-1">
                      <span className="text-[#78716C]">Établissement</span>
                      <span className="font-bold">{formData.restaurantName || '—'}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#78716C]">Modèle d&apos;exploitation</span>
                      <span className="font-bold text-[#EA580C]">
                        {formData.serviceType === 'online' ? '🛵 100% En Ligne (Dark Kitchen)' : (formData.serviceType === 'physical' ? '🏛️ Restaurant Physique' : '🌟 Hybride (Les Deux)')}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#78716C]">Localisation</span>
                      <span className="font-bold">{formData.city}, {formData.country}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-[#78716C]">Gérant responsable</span>
                      <span className="font-bold">{formData.ownerName || '—'}</span>
                    </div>
                    {formData.serviceType !== 'online' ? (
                      <div className="flex justify-between py-1">
                        <span className="text-[#78716C]">Tables équipées QR</span>
                        <span className="font-bold">{formData.tableCount} tables incluses</span>
                      </div>
                    ) : (
                      <div className="flex justify-between py-1">
                        <span className="text-[#78716C]">Modes de commande</span>
                        <span className="font-bold text-[#16A34A]">Livraison & À emporter</span>
                      </div>
                    )}
                    <div className="flex justify-between py-1">
                      <span className="text-[#78716C]">Période de facturation</span>
                      <span className="font-bold text-[#EA580C]">{isAnnual ? 'Annuelle (1 an)' : 'Mensuelle'}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#FDE8CD] space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="font-extrabold text-sm text-[#1C1917]">Montant Total à régler :</span>
                      <div className="text-right">
                        <span className="text-2xl font-black text-[#EA580C] font-mono">
                          {totalBilledAmount.toLocaleString('fr-FR')} FCFA
                        </span>
                        {isAnnual && (
                          <p className="text-[10px] text-[#16A34A] font-bold">Soit 4 500 FCFA / mois</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#FFF7ED] rounded-2xl border border-[#FDE8CD] text-[11px] text-[#78716C] space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-[#1C1917]">
                      <Sparkles className="w-3.5 h-3.5 text-[#EA580C]" /> Ce qui sera prêt immédiatement :
                    </div>
                    <p>• Votre menu digital en ligne à votre nom</p>
                    {formData.serviceType !== 'online' ? (
                      <p>• {formData.tableCount} QR Codes téléchargeables pour vos tables</p>
                    ) : (
                      <p>• Module de commande en ligne & livraison configuré</p>
                    )}
                    <p>• Générateur de photos IA & Dashboard gérant actif</p>
                  </div>

                </Card>
              </div>

            </div>
          </motion.div>
        )}

        {/* STEP 3: ACTIVATION COMPLETED & ACCESS TO PRO RESTAURATEUR SPACE */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-2xl mx-auto space-y-8 py-8"
          >
            <div className="w-20 h-20 rounded-full bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center mx-auto border-2 border-[#16A34A]/20 shadow-xl shadow-[#16A34A]/10">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-3">
              <Badge className="bg-[#16A34A] text-white px-4 py-1 font-extrabold text-xs uppercase tracking-wider rounded-full">
                👑 Restaurant Officiel Zagoor Pro Activé
              </Badge>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1C1917] tracking-tight font-heading">
                Bienvenue sur Zagoor, {formData.ownerName.toLowerCase().startsWith('chef') ? formData.ownerName : `Chef ${formData.ownerName}`} !
              </h1>
              <p className="text-base text-[#78716C] max-w-lg mx-auto">
                Votre restaurant <span className="font-bold text-[#1C1917]">« {formData.restaurantName} »</span> ({formData.serviceType === 'online' ? 'Dark Kitchen 100% En Ligne' : (formData.serviceType === 'physical' ? 'Restaurant Physique' : 'Hybride Salle & Livraison')}) est opérationnel et prêt à recevoir ses premières commandes.
              </p>
            </div>

            {/* Quick Access Card */}
            <Card className="border-2 border-[#16A34A] bg-white rounded-3xl p-6 sm:p-8 shadow-2xl shadow-[#16A34A]/15 text-left space-y-6">
              
              <div className="flex items-center justify-between pb-4 border-b border-[#FDE8CD]">
                <div>
                  <h4 className="font-extrabold text-lg text-[#1C1917]">{formData.restaurantName}</h4>
                  <p className="text-xs text-[#78716C]">
                    {formData.city}, {formData.country} • {formData.serviceType === 'online' ? '🛵 Vente en Ligne & Livraison' : `${formData.tableCount} Tables QR Code`}
                  </p>
                </div>
                <div className="px-3 py-1 bg-[#16A34A]/10 text-[#16A34A] rounded-full text-xs font-extrabold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> Abonné Pro
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-[#FFFBF5] border border-[#FDE8CD] flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] text-[#78716C] block">Lien public de votre menu digital :</span>
                    <span className="font-bold text-sm text-[#EA580C] font-mono">
                      localhost:3000/{createdSlug || 'mon-restaurant'}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(`http://localhost:3000/${createdSlug}`)
                      toast.success('Lien copié dans le presse-papier !')
                    }}
                    className="border-[#FDE8CD] rounded-xl text-xs font-bold"
                  >
                    Copier
                  </Button>
                </div>
              </div>

              {/* Direct Access Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link
                  href={`/${createdSlug || 'le-jardin-savoureux'}`}
                  className="flex-1 inline-flex items-center justify-center py-4 px-6 rounded-2xl bg-[#EA580C] hover:bg-[#C2410C] text-white font-extrabold text-sm shadow-lg shadow-[#EA580C]/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <UtensilsCrossed className="w-4 h-4 mr-2" />
                  <span>Ouvrir mon Restaurant & Gérer</span>
                </Link>

                <Link
                  href="/"
                  className="inline-flex items-center justify-center py-4 px-6 rounded-2xl border border-[#FDE8CD] bg-white hover:bg-[#FFF7ED] text-[#78716C] font-bold text-sm"
                >
                  Retour Accueil
                </Link>
              </div>

            </Card>

          </motion.div>
        )}

      </main>

    </div>
  )
}
