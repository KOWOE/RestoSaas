'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  UtensilsCrossed, 
  QrCode, 
  Smartphone, 
  CreditCard, 
  Sparkles, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  ChevronRight, 
  ChevronDown, 
  Star, 
  ShieldCheck, 
  Zap, 
  ChefHat, 
  Flame, 
  BarChart3, 
  Users, 
  Percent, 
  Coins, 
  ShoppingBag, 
  Store, 
  Receipt, 
  Layers, 
  Play, 
  MessageCircle, 
  Check, 
  HelpCircle, 
  Phone, 
  Mail, 
  MapPin, 
  ExternalLink,
  Laptop,
  CheckCircle,
  Eye,
  Plus,
  RefreshCw,
  Sliders,
  DollarSign,
  Menu,
  X,
  Crown,
  MessageSquarePlus,
  Send,
  Loader2,
  Award
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

// Helper format currency
function formatXOF(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0
  }).format(amount)
}

interface ReviewItem {
  id: string
  authorName: string
  authorRole: string
  restaurantName: string
  city?: string | null
  rating: number
  comment: string
  avatar?: string | null
  isVerified?: boolean
  createdAt?: string
}

const INITIAL_REVIEWS_LIST: ReviewItem[] = [
  {
    id: 'rev-1',
    authorName: 'Chef Malik Koffi',
    authorRole: 'Chef Exécutif & Propriétaire',
    restaurantName: 'Le Jardin Savoureux',
    city: 'Cotonou, Bénin',
    rating: 5,
    comment: 'Le QR code sur nos tables a augmenté nos ventes de desserts et boissons de 34%. Les clients adorent voir les photos réelles des plats avant de commander !',
    avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=120&h=120&fit=crop',
    isVerified: true
  },
  {
    id: 'rev-2',
    authorName: 'Awa Diop',
    authorRole: 'Gérante & Fondatrice',
    restaurantName: 'Lounge & Grill Teranga',
    city: 'Dakar, Sénégal',
    rating: 5,
    comment: 'L\'intégration Mobile Money est magique. Plus aucune dispute de monnaie aux heures de pointe et nos cuisiniers reçoivent les bons instantanément sur leur écran.',
    avatar: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=120&h=120&fit=crop',
    isVerified: true
  },
  {
    id: 'rev-3',
    authorName: 'Yao Kouamé',
    authorRole: 'Directeur d\'Exploitation',
    restaurantName: 'L\'Ébène Gourmet',
    city: 'Abidjan, Côte d\'Ivoire',
    rating: 5,
    comment: 'En 10 minutes nous étions opérationnels. Le générateur de photos IA nous a permis d\'avoir un menu digne d\'un hôtel 5 étoiles sans rien dépenser en shooting photo.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop',
    isVerified: true
  }
]

export default function LandingPage() {
  // Navigation scroll state
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Interactive Phone Mockup Tab
  const [activeMockupTab, setActiveMockupTab] = useState<'client' | 'kitchen' | 'ai'>('client')
  
  // Hero Interactive Demo State
  const [selectedDemoItem, setSelectedDemoItem] = useState<{ id: string; name: string; price: number; image: string; qty: number }[]>([
    { id: '1', name: 'Poulet Moambé Braisé', price: 5500, image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=300&fit=crop', qty: 1 },
    { id: '2', name: 'Jus de Bissap Maison', price: 1000, image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop', qty: 2 }
  ])
  const [mockOrderPlaced, setMockOrderPlaced] = useState(false)

  // ROI Calculator State
  const [coversPerDay, setCoversPerDay] = useState<number>(65)
  const [averageCheck, setAverageCheck] = useState<number>(6500)
  
  // Billing cycle toggle
  const [isAnnualBilling, setIsAnnualBilling] = useState<boolean>(true)

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  // AI Prompt Simulator State
  const [aiDishName, setAiDishName] = useState('Attiéké Poisson Braisé aux Épices Douces')
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
  const [aiGeneratedImage, setAiGeneratedImage] = useState('https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&h=450&fit=crop')

  // Review System & Popup State
  const [reviews, setReviews] = useState<ReviewItem[]>(INITIAL_REVIEWS_LIST)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reviewToastPopupOpen, setReviewToastPopupOpen] = useState(false)
  const [submittingReview, setSubmittingReview] = useState(false)
  
  // Review Form State
  const [newReviewForm, setNewReviewForm] = useState({
    authorName: '',
    authorRole: 'Chef Cuisinier',
    restaurantName: '',
    city: '',
    rating: 5,
    comment: '',
    avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=120&h=120&fit=crop'
  })

  // Avatars options for review modal
  const avatarOptions = [
    { label: 'Chef Toque', url: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=120&h=120&fit=crop' },
    { label: 'Gérante', url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=120&h=120&fit=crop' },
    { label: 'Directeur', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop' },
    { label: 'Restauratrice', url: 'https://images.unsplash.com/photo-1534528741775?w=120&h=120&fit=crop' },
  ]

  // Fetch reviews on load
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch('/api/reviews')
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            setReviews(data)
          }
        }
      } catch {
        // Use fallback
      }
    }
    fetchReviews()
  }, [])

  // Auto-trigger the Chef Review Pop-up for visitors after 3.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setReviewToastPopupOpen(true)
    }, 3500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Calculate ROI Metrics
  const monthlyRevenue = coversPerDay * averageCheck * 30
  const estimatedGainPercent = 0.22 // +22% ticket moyen & turnover
  const additionalMonthlyIncome = Math.round(monthlyRevenue * estimatedGainPercent)
  const serverHoursSaved = Math.round(coversPerDay * 0.08 * 30) // ~5 min par commande x 30 jours

  // Mock items for Hero simulator
  const demoDishes = [
    { id: '1', name: 'Poulet Moambé Braisé', price: 5500, cat: 'Plats', image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=300&fit=crop' },
    { id: '2', name: 'Jus de Bissap Maison', price: 1000, cat: 'Boissons', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop' },
    { id: '3', name: 'Salade d\'Avocat Mangue', price: 2500, cat: 'Entrées', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop' },
    { id: '4', name: 'Brochettes de Crevettes', price: 3500, cat: 'Grillades', image: 'https://images.unsplash.com/photo-1565680018093-ebb6b9ab5460?w=400&h=300&fit=crop' }
  ]

  const totalDemoPrice = selectedDemoItem.reduce((acc, item) => acc + (item.price * item.qty), 0)

  const handleAddDemoDish = (dish: typeof demoDishes[0]) => {
    setSelectedDemoItem(prev => {
      const exists = prev.find(i => i.id === dish.id)
      if (exists) {
        return prev.map(i => i.id === dish.id ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, { ...dish, qty: 1 }]
    })
    toast.success(`+1 ${dish.name} ajouté au panier démo !`)
  }

  const handleSimulateOrder = () => {
    setMockOrderPlaced(true)
    toast.success('Commande #T4 envoyée en cuisine ! Statut: En préparation 🔥', {
      duration: 4000,
    })
    setTimeout(() => {
      setMockOrderPlaced(false)
    }, 6000)
  }

  const handleSimulateAiImage = () => {
    setIsGeneratingAi(true)
    setTimeout(() => {
      setIsGeneratingAi(false)
      const images = [
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=450&fit=crop',
        'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&h=450&fit=crop',
        'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=450&fit=crop',
        'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&h=450&fit=crop'
      ]
      setAiGeneratedImage(images[Math.floor(Math.random() * images.length)])
      toast.success('✨ Photo de plat gastronomique générée avec succès !')
    }, 1200)
  }

  // Handle Review Submission
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newReviewForm.authorName || !newReviewForm.restaurantName || !newReviewForm.comment) {
      toast.error('Veuillez renseigner votre nom, établissement et votre avis.')
      return
    }

    setSubmittingReview(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReviewForm)
      })

      const data = await res.json()
      if (res.ok && data.id) {
        setReviews(prev => [data, ...prev])
        toast.success('Merci Chef ! Votre avis a été publié avec succès ⭐', {
          duration: 5000
        })
        setReviewModalOpen(false)
        setReviewToastPopupOpen(false)
        setNewReviewForm({
          authorName: '',
          authorRole: 'Chef Cuisinier',
          restaurantName: '',
          city: '',
          rating: 5,
          comment: '',
          avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=120&h=120&fit=crop'
        })
      } else {
        toast.error('Erreur lors de l\'enregistrement de l\'avis.')
      }
    } catch {
      toast.error('Erreur de connexion au serveur.')
    } finally {
      setSubmittingReview(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5] text-[#1C1917] font-sans antialiased selection:bg-[#EA580C] selection:text-white relative overflow-x-hidden">
      
      {/* Texture de fond bruit SVG subtle */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.035] bg-noise" />

      {/* 🧭 Dynamic Floating Pill / Rounded Island Navbar */}
      <header className="fixed top-3 sm:top-5 left-0 right-0 z-40 px-3 sm:px-6 pointer-events-none transition-all duration-300">
        <div className={`pointer-events-auto max-w-6xl mx-auto rounded-full transition-all duration-300 flex items-center justify-between ${
          isScrolled 
            ? 'bg-[#FFFBF5]/90 backdrop-blur-xl border border-[#FDE8CD] shadow-[0_12px_36px_rgba(28,25,23,0.12)] py-2.5 px-4 sm:px-6 scale-[0.99]' 
            : 'bg-[#FFFBF5]/80 backdrop-blur-md border border-[#FDE8CD]/80 shadow-[0_6px_24px_rgba(28,25,23,0.06)] py-3 px-5 sm:px-8'
        }`}>
          
          {/* Logo Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#EA580C] to-[#C2410C] flex items-center justify-center text-white shadow-md shadow-[#EA580C]/25 transition-transform duration-300 group-hover:scale-105">
              <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg sm:text-xl tracking-tight text-[#1C1917] block font-heading">
                Zagoor<span className="text-[#EA580C]">.</span>
              </span>
            </div>
          </Link>

          {/* Center Navigation Links with Pill Hover Effect */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-[#78716C]">
            <a href="#features" className="px-3.5 py-1.5 rounded-full hover:text-[#EA580C] hover:bg-[#FFF7ED] transition-all duration-200">
              Fonctionnalités
            </a>
            <a href="#how-it-works" className="px-3.5 py-1.5 rounded-full hover:text-[#EA580C] hover:bg-[#FFF7ED] transition-all duration-200">
              Comment ça marche
            </a>
            <a href="#simulator" className="px-3.5 py-1.5 rounded-full hover:text-[#EA580C] hover:bg-[#FFF7ED] transition-all duration-200">
              Calculateur ROI
            </a>
            <a href="#pricing" className="px-3.5 py-1.5 rounded-full hover:text-[#EA580C] hover:bg-[#FFF7ED] transition-all duration-200">
              Tarifs
            </a>
            <a href="#testimonials" className="px-3.5 py-1.5 rounded-full hover:text-[#EA580C] hover:bg-[#FFF7ED] transition-all duration-200">
              Avis Chefs
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Button to directly open Review Modal */}
            <button
              onClick={() => setReviewModalOpen(true)}
              className="hidden sm:inline-flex items-center justify-center px-3.5 py-2 text-xs font-bold text-[#EA580C] bg-[#FFF7ED] hover:bg-[#FDE8CD] border border-[#FDE8CD] rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Star className="w-3.5 h-3.5 mr-1.5 fill-current text-[#EA580C]" />
              Avis Chef
            </button>
            
            <a
              href="#pricing"
              className="inline-flex items-center justify-center px-4 sm:px-5 py-2 text-xs sm:text-sm font-bold text-white bg-[#EA580C] hover:bg-[#C2410C] rounded-full shadow-md shadow-[#EA580C]/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
            >
              <span>Abonnements</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-1" />
            </a>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-9 h-9 rounded-full bg-[#FFF7ED] border border-[#FDE8CD] flex items-center justify-center text-[#1C1917] hover:text-[#EA580C] transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Pill Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto lg:hidden max-w-sm mx-auto mt-2 bg-[#FFFBF5] rounded-3xl border border-[#FDE8CD] p-5 shadow-2xl space-y-3"
            >
              <nav className="flex flex-col gap-1 text-sm font-medium text-[#1C1917]">
                <a 
                  href="#features" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-2xl hover:bg-[#FFF7ED] hover:text-[#EA580C] transition-colors"
                >
                  Fonctionnalités
                </a>
                <a 
                  href="#how-it-works" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-2xl hover:bg-[#FFF7ED] hover:text-[#EA580C] transition-colors"
                >
                  Comment ça marche
                </a>
                <a 
                  href="#simulator" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-2xl hover:bg-[#FFF7ED] hover:text-[#EA580C] transition-colors"
                >
                  Calculateur ROI
                </a>
                <a 
                  href="#pricing" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-2xl hover:bg-[#FFF7ED] hover:text-[#EA580C] transition-colors"
                >
                  Tarifs & Abonnements
                </a>
                <a 
                  href="#testimonials" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-2.5 rounded-2xl hover:bg-[#FFF7ED] hover:text-[#EA580C] transition-colors"
                >
                  Avis Chefs
                </a>
              </nav>

              <div className="pt-2 border-t border-[#FDE8CD] flex flex-col gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setReviewModalOpen(true)
                  }}
                  className="w-full py-2.5 text-center text-sm font-bold bg-[#FFF7ED] text-[#EA580C] border border-[#FDE8CD] rounded-2xl flex items-center justify-center gap-1.5"
                >
                  <Star className="w-4 h-4 fill-current text-[#EA580C]" /> Laisser un avis Chef
                </button>
                <a
                  href="#pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-2.5 text-center text-sm font-bold bg-[#EA580C] text-white rounded-2xl shadow-md shadow-[#EA580C]/20"
                >
                  Souscrire un Abonnement
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 🚀 Hero Section (Full Viewport Impact) */}
      <section className="relative pt-36 md:pt-44 pb-20 md:pb-32 overflow-hidden">
        
        {/* Warm Ambient Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-gradient-to-tr from-[#EA580C]/15 to-[#F59E0B]/10 blur-[130px] rounded-full pointer-events-none -z-10" />
        <div className="absolute top-1/3 -right-20 w-[400px] h-[400px] bg-[#EA580C]/10 blur-[100px] rounded-full pointer-events-none -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Hero Content (7 cols) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="lg:col-span-7 text-center lg:text-left space-y-6"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF7ED] border border-[#FDE8CD] text-[#EA580C] text-xs md:text-sm font-semibold shadow-xs">
                <Sparkles className="w-4 h-4 text-[#EA580C]" />
                <span>Le Menu Digital & QR Code N°1 pour Restaurants en Afrique</span>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#1C1917] leading-[1.1] font-heading">
                Digitalisez vos tables, <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-[#EA580C] via-[#D97706] to-[#EA580C] bg-clip-text text-transparent">
                  boostez votre chiffre
                </span> & régalez vos clients.
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg lg:text-xl text-[#78716C] leading-relaxed max-w-2xl mx-auto lg:mx-0 font-normal">
                Vos clients scannent le QR code à table, commandent en toute autonomie grâce à un menu interactif avec photos gourmandes, et règlent par <strong className="text-[#1C1917] font-semibold">Mobile Money (Moov, MTN, Wave)</strong>. Vos cuisines reçoivent tout en temps réel.
              </p>

              {/* CTA Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link
                  href="/souscrire"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-4 text-base font-bold text-white bg-[#EA580C] hover:bg-[#C2410C] rounded-2xl shadow-xl shadow-[#EA580C]/30 transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] group"
                >
                  <Crown className="w-5 h-5 mr-2.5 text-white" />
                  <span>Souscrire à l&apos;Abonnement Pro</span>
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/le-jardin-savoureux"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-4 text-base font-bold text-[#1C1917] bg-[#FFFFFF] hover:bg-[#FFF7ED] border-2 border-[#FDE8CD] rounded-2xl shadow-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
                >
                  <UtensilsCrossed className="w-5 h-5 mr-2.5 text-[#EA580C] transition-transform group-hover:rotate-12" />
                  <span>Tester le Restaurant Démo</span>
                </Link>
              </div>

              {/* Social Proof Badges under Hero */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs sm:text-sm text-[#78716C]">
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-1.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="w-7 h-7 rounded-full border-2 border-[#FFFBF5] bg-[#EA580C]/20 flex items-center justify-center overflow-hidden">
                        <Image 
                          src={`https://images.unsplash.com/photo-${1534528741775 + i}?w=80&h=80&fit=crop`} 
                          alt="Restaurateur" 
                          width={28} 
                          height={28} 
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                  <span className="font-semibold text-[#1C1917]">+180 Restaurants</span>
                </div>

                <div className="flex items-center gap-1 text-[#CA8A04]">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-current" />
                  ))}
                  <span className="font-bold text-[#1C1917] ml-1">4.9/5</span>
                </div>

                <div className="flex items-center gap-1.5 text-[#16A34A] font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>0 Frais d&apos;installation</span>
                </div>
              </div>

            </motion.div>

            {/* Right Hero Interactive Simulator (5 cols) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="lg:col-span-5 relative"
            >
              {/* Smartphone Frame Container */}
              <div className="relative mx-auto max-w-[340px] sm:max-w-[360px] bg-[#1C1917] p-3 sm:p-4 rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(234,88,12,0.25)] border-4 border-[#292524]">
                
                {/* Phone Notch & Speaker */}
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-4 bg-[#1C1917] rounded-full z-30 flex items-center justify-center">
                  <div className="w-12 h-1.5 bg-[#44403C] rounded-full" />
                </div>

                {/* Inner Screen */}
                <div className="bg-[#FFFBF5] rounded-[2rem] overflow-hidden border border-[#FDE8CD] relative text-xs">
                  
                  {/* Top Header of the mock app */}
                  <div className="bg-[#1C1917] text-white p-3.5 pt-7">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm">Le Jardin Savoureux</span>
                          <span className="w-2 h-2 rounded-full bg-[#16A34A] inline-block" />
                        </div>
                        <p className="text-[10px] text-[#A8A29E]">Table N°04 • Cotonou</p>
                      </div>
                      <Badge className="bg-[#EA580C] text-white text-[10px] px-2 py-0.5 font-bold">
                        Menu Digital
                      </Badge>
                    </div>

                    {/* Mode Switcher inside simulator */}
                    <div className="flex items-center gap-1 mt-3 p-1 bg-[#292524] rounded-xl">
                      <button 
                        onClick={() => setActiveMockupTab('client')} 
                        className={`flex-1 py-1 rounded-lg text-[10px] font-semibold transition-all ${activeMockupTab === 'client' ? 'bg-[#EA580C] text-white' : 'text-[#A8A29E]'}`}
                      >
                        Vue Client
                      </button>
                      <button 
                        onClick={() => setActiveMockupTab('kitchen')} 
                        className={`flex-1 py-1 rounded-lg text-[10px] font-semibold transition-all ${activeMockupTab === 'kitchen' ? 'bg-[#EA580C] text-white' : 'text-[#A8A29E]'}`}
                      >
                        Vue Cuisine
                      </button>
                    </div>
                  </div>

                  {/* Simulator Body */}
                  <div className="p-3.5 space-y-3 min-h-[360px] max-h-[380px] overflow-y-auto">
                    
                    {activeMockupTab === 'client' ? (
                      <>
                        {/* Dishes Grid */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px] font-bold text-[#78716C]">
                            <span>Suggestions du Chef 🔥</span>
                            <span className="text-[#EA580C]">Cliquez pour ajouter</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {demoDishes.slice(0, 2).map((dish) => (
                              <div 
                                key={dish.id} 
                                onClick={() => handleAddDemoDish(dish)}
                                className="p-2 bg-white rounded-xl border border-[#FDE8CD] shadow-xs cursor-pointer hover:border-[#EA580C] transition-all hover:scale-[1.02] active:scale-95 group"
                              >
                                <div className="h-20 w-full rounded-lg overflow-hidden relative mb-1.5">
                                  <Image src={dish.image} alt={dish.name} fill className="object-cover group-hover:scale-105 transition-transform" />
                                </div>
                                <h4 className="font-bold text-[11px] leading-tight line-clamp-1">{dish.name}</h4>
                                <div className="flex items-center justify-between mt-1">
                                  <span className="font-extrabold text-[#EA580C] text-[11px] font-mono">{formatXOF(dish.price)}</span>
                                  <div className="w-5 h-5 rounded-full bg-[#EA580C] text-white flex items-center justify-center font-bold text-[10px]">
                                    +
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Cart Preview in Mockup */}
                        <div className="bg-white p-3 rounded-xl border border-[#FDE8CD] space-y-2 shadow-xs">
                          <div className="flex items-center justify-between font-bold text-[11px]">
                            <span className="flex items-center gap-1">
                              <ShoppingBag className="w-3.5 h-3.5 text-[#EA580C]" />
                              Panier Table 04
                            </span>
                            <span className="text-[#EA580C] font-mono">{formatXOF(totalDemoPrice)}</span>
                          </div>

                          <div className="space-y-1 text-[10px] text-[#78716C]">
                            {selectedDemoItem.map((item) => (
                              <div key={item.id} className="flex justify-between items-center">
                                <span>{item.qty}x {item.name}</span>
                                <span className="font-mono font-medium">{formatXOF(item.price * item.qty)}</span>
                              </div>
                            ))}
                          </div>

                          <Button
                            onClick={handleSimulateOrder}
                            disabled={mockOrderPlaced}
                            className="w-full h-8 text-[11px] font-bold bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-lg mt-1"
                          >
                            {mockOrderPlaced ? (
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                Commande Transmise !
                              </span>
                            ) : (
                              'Commander & Payer Mobile Money'
                            )}
                          </Button>
                        </div>
                      </>
                    ) : (
                      /* Kitchen KDS View */
                      <div className="space-y-2">
                        <div className="flex items-center justify-between font-bold text-[11px]">
                          <span>Écran Cuisine (KDS Direct)</span>
                          <Badge className="bg-[#16A34A] text-white text-[9px]">3 En cours</Badge>
                        </div>

                        <div className="p-2.5 bg-white rounded-xl border-l-4 border-l-[#EA580C] border border-[#FDE8CD] space-y-1.5 shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[11px] text-[#EA580C]">Commande #T04</span>
                            <span className="text-[10px] text-[#78716C] font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Il y a 2 min
                            </span>
                          </div>
                          <ul className="text-[10px] space-y-0.5 text-[#1C1917] font-medium">
                            <li>• 1x Poulet Moambé Braisé (Bien pimenté)</li>
                            <li>• 2x Jus de Bissap Frais</li>
                          </ul>
                          <div className="pt-1 flex gap-1.5">
                            <Button size="sm" className="h-6 text-[9px] bg-[#EA580C] text-white flex-1 rounded-md">
                              En préparation 🔥
                            </Button>
                            <Button size="sm" variant="outline" className="h-6 text-[9px] border-[#16A34A] text-[#16A34A] flex-1 rounded-md">
                              Prête ✅
                            </Button>
                          </div>
                        </div>

                        <div className="p-2 bg-[#FFF7ED] rounded-lg border border-[#FDE8CD] text-[10px] text-[#78716C]">
                          💡 Le chef met à jour le statut, le client et les serveurs sont notifiés immédiatement.
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Bottom Home indicator */}
                  <div className="p-2 bg-white border-t border-[#FDE8CD] flex justify-center">
                    <div className="w-20 h-1 bg-[#1C1917]/30 rounded-full" />
                  </div>

                </div>

              </div>

              {/* Floating feature pills around mockup */}
              <div className="hidden sm:flex items-center gap-2 absolute -bottom-6 -left-8 bg-white p-3 rounded-2xl shadow-xl border border-[#FDE8CD] text-xs font-bold text-[#1C1917]">
                <div className="w-8 h-8 rounded-xl bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-[#78716C] font-normal">Paiement instantané</p>
                  <p className="font-bold text-xs">Moov • MTN • Wave</p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 absolute -top-4 -right-6 bg-white p-3 rounded-2xl shadow-xl border border-[#FDE8CD] text-xs font-bold text-[#1C1917]">
                <div className="w-8 h-8 rounded-xl bg-[#EA580C]/10 text-[#EA580C] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#EA580C]" />
                </div>
                <div>
                  <p className="text-[11px] text-[#78716C] font-normal">Photos par IA</p>
                  <p className="font-bold text-xs">+35% de commandes</p>
                </div>
              </div>

            </motion.div>

          </div>
        </div>
      </section>

      {/* 📊 Key Metrics Ribbon */}
      <section className="bg-[#1C1917] text-white py-12 relative z-10 border-y border-[#292524]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-y lg:divide-y-0 lg:divide-x divide-[#292524]">
            
            <div className="pt-4 lg:pt-0">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#EA580C] font-mono tracking-tight">
                +28%
              </div>
              <div className="mt-1 text-xs sm:text-sm text-[#A8A29E] font-medium">
                Augmentation du ticket moyen
              </div>
            </div>

            <div className="pt-4 lg:pt-0">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#16A34A] font-mono tracking-tight">
                &lt; 15s
              </div>
              <div className="mt-1 text-xs sm:text-sm text-[#A8A29E] font-medium">
                Temps moyen de prise de commande
              </div>
            </div>

            <div className="pt-4 lg:pt-0">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#F59E0B] font-mono tracking-tight">
                100%
              </div>
              <div className="mt-1 text-xs sm:text-sm text-[#A8A29E] font-medium">
                Paiement Mobile Money & Carte
              </div>
            </div>

            <div className="pt-4 lg:pt-0">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white font-mono tracking-tight">
                0 FCFA
              </div>
              <div className="mt-1 text-xs sm:text-sm text-[#A8A29E] font-medium">
                Frais d&apos;installation ou matériel dédié
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ⚡ Features Section with Interactive Micro-UIs */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <Badge className="bg-[#FFF7ED] text-[#EA580C] border-[#FDE8CD] px-3 py-1 font-bold text-xs uppercase tracking-wider">
              Fonctionnalités Clés
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1C1917] tracking-tight font-heading">
              Tout ce dont votre établissement a besoin pour dominer son marché.
            </h2>
            <p className="text-base sm:text-lg text-[#78716C]">
              Conçu spécifiquement pour les réalités des restaurants, maquis, lounges et hôtels africains.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature 1: QR Code Table */}
            <Card className="rounded-3xl border border-[#FDE8CD] bg-white p-7 shadow-xs hover:shadow-xl hover:shadow-[#EA580C]/10 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#FFF7ED] border border-[#FDE8CD] text-[#EA580C] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <QrCode className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-[#1C1917]">
                  QR Codes Intelligents par Table
                </h3>
                <p className="text-sm text-[#78716C] leading-relaxed">
                  Générez des QR codes stylisés à vos couleurs. Chaque table a son identifiant unique pour router automatiquement les commandes en cuisine sans confusion.
                </p>
              </div>

              {/* Micro-UI Visual */}
              <div className="mt-6 p-4 bg-[#FFFBF5] rounded-2xl border border-[#FDE8CD] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white border border-[#FDE8CD] rounded-xl flex items-center justify-center font-mono font-bold text-[#EA580C]">
                    T08
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1C1917]">Table Terrasse</p>
                    <p className="text-[11px] text-[#78716C]">QR Code Actif</p>
                  </div>
                </div>
                <Badge className="bg-[#16A34A]/10 text-[#16A34A] border-none text-[10px]">Prêt à imprimer</Badge>
              </div>
            </Card>

            {/* Feature 2: AI Food Photo Studio */}
            <Card className="rounded-3xl border border-[#FDE8CD] bg-white p-7 shadow-xs hover:shadow-xl hover:shadow-[#EA580C]/10 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#FFF7ED] border border-[#FDE8CD] text-[#EA580C] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-[#1C1917]">
                  Générateur de Photos Culinaire IA
                </h3>
                <p className="text-sm text-[#78716C] leading-relaxed">
                  Pas de photographe professionnel ? Notre intelligence artificielle culinaire génère des visuels alléchants de vos plats en quelques secondes.
                </p>
              </div>

              {/* Micro-UI Visual */}
              <div className="mt-6 p-3 bg-[#FFFBF5] rounded-2xl border border-[#FDE8CD] space-y-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={aiDishName}
                    onChange={(e) => setAiDishName(e.target.value)}
                    className="flex-1 bg-white border border-[#FDE8CD] rounded-lg px-2.5 py-1 text-[11px] font-medium focus:ring-1 focus:ring-[#EA580C] outline-none"
                    placeholder="Nom du plat..."
                  />
                  <button 
                    onClick={handleSimulateAiImage} 
                    disabled={isGeneratingAi}
                    className="px-2.5 py-1 bg-[#EA580C] text-white rounded-lg text-[10px] font-bold hover:bg-[#C2410C] flex items-center gap-1"
                  >
                    {isGeneratingAi ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    IA
                  </button>
                </div>
                <div className="h-16 w-full rounded-xl overflow-hidden relative border border-[#FDE8CD]">
                  <Image src={aiGeneratedImage} alt="Plat IA" fill className="object-cover" />
                </div>
              </div>
            </Card>

            {/* Feature 3: Mobile Money Integration */}
            <Card className="rounded-3xl border border-[#FDE8CD] bg-white p-7 shadow-xs hover:shadow-xl hover:shadow-[#EA580C]/10 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#FFF7ED] border border-[#FDE8CD] text-[#EA580C] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CreditCard className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-[#1C1917]">
                  Paiements Mobile Money & Cartes
                </h3>
                <p className="text-sm text-[#78716C] leading-relaxed">
                  Encaissez directement via Moov Money, MTN MoMo, Wave, Orange Money et Cartes Bancaires. Zéro tracas de monnaie physique.
                </p>
              </div>

              {/* Micro-UI Visual */}
              <div className="mt-6 p-4 bg-[#FFFBF5] rounded-2xl border border-[#FDE8CD] flex items-center justify-around">
                <div className="text-center">
                  <div className="w-9 h-9 rounded-xl bg-[#FACC15]/20 text-[#CA8A04] flex items-center justify-center font-bold text-xs mx-auto mb-1">
                    MTN
                  </div>
                  <span className="text-[10px] text-[#78716C] font-semibold">MoMo</span>
                </div>
                <div className="text-center">
                  <div className="w-9 h-9 rounded-xl bg-[#0284C7]/20 text-[#0284C7] flex items-center justify-center font-bold text-xs mx-auto mb-1">
                    Moov
                  </div>
                  <span className="text-[10px] text-[#78716C] font-semibold">Flooz</span>
                </div>
                <div className="text-center">
                  <div className="w-9 h-9 rounded-xl bg-[#38BDF8]/20 text-[#0284C7] flex items-center justify-center font-bold text-xs mx-auto mb-1">
                    Wave
                  </div>
                  <span className="text-[10px] text-[#78716C] font-semibold">Wave</span>
                </div>
                <div className="text-center">
                  <div className="w-9 h-9 rounded-xl bg-[#16A34A]/20 text-[#16A34A] flex items-center justify-center font-bold text-xs mx-auto mb-1">
                    CB
                  </div>
                  <span className="text-[10px] text-[#78716C] font-semibold">Visa/MC</span>
                </div>
              </div>
            </Card>

            {/* Feature 4: Live Kitchen Screen (KDS) */}
            <Card className="rounded-3xl border border-[#FDE8CD] bg-white p-7 shadow-xs hover:shadow-xl hover:shadow-[#EA580C]/10 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#FFF7ED] border border-[#FDE8CD] text-[#EA580C] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ChefHat className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-[#1C1917]">
                  Écran Cuisine & KDS en Direct
                </h3>
                <p className="text-sm text-[#78716C] leading-relaxed">
                  Fini les bons papier perdus ou illisibles. Les cuisiniers voient les commandes s&apos;afficher avec un chronomètre et les spécificités des clients.
                </p>
              </div>

              {/* Micro-UI Visual */}
              <div className="mt-6 p-3 bg-[#1C1917] text-white rounded-2xl border border-[#292524] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#EA580C] animate-ping" />
                  <span className="font-mono font-bold">Commande #T12</span>
                </div>
                <Badge className="bg-[#EA580C] text-white text-[9px]">Cuisson: À point</Badge>
              </div>
            </Card>

            {/* Feature 5: Real-time Analytics */}
            <Card className="rounded-3xl border border-[#FDE8CD] bg-white p-7 shadow-xs hover:shadow-xl hover:shadow-[#EA580C]/10 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#FFF7ED] border border-[#FDE8CD] text-[#EA580C] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-[#1C1917]">
                  Statistiques & Ventes en Temps Réel
                </h3>
                <p className="text-sm text-[#78716C] leading-relaxed">
                  Identifiez vos plats les plus rentables, vos heures de pointe et le chiffre d&apos;affaires généré en direct depuis votre smartphone.
                </p>
              </div>

              {/* Micro-UI Visual */}
              <div className="mt-6 p-3.5 bg-[#FFFBF5] rounded-2xl border border-[#FDE8CD] flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-[#78716C] uppercase font-bold">Revenu du jour</p>
                  <p className="text-base font-extrabold text-[#1C1917] font-mono">485 000 FCFA</p>
                </div>
                <span className="text-xs font-bold text-[#16A34A] flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> +24%
                </span>
              </div>
            </Card>

            {/* Feature 6: PWA & Offline Resilience */}
            <Card className="rounded-3xl border border-[#FDE8CD] bg-white p-7 shadow-xs hover:shadow-xl hover:shadow-[#EA580C]/10 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#FFF7ED] border border-[#FDE8CD] text-[#EA580C] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-[#1C1917]">
                  PWA Ultra-Légère & Résilience Réseau
                </h3>
                <p className="text-sm text-[#78716C] leading-relaxed">
                  Vos clients n&apos;ont rien à télécharger sur l&apos;App Store ou Google Play. Le menu s&apos;ouvre instantanément même avec une connexion 3G faible.
                </p>
              </div>

              {/* Micro-UI Visual */}
              <div className="mt-6 p-3.5 bg-[#FFFBF5] rounded-2xl border border-[#FDE8CD] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-[#EA580C]" />
                  <span className="text-xs font-bold text-[#1C1917]">0 Mo à télécharger</span>
                </div>
                <Badge className="bg-[#EA580C]/10 text-[#EA580C] border-none text-[10px]">Chargement &lt; 1s</Badge>
              </div>
            </Card>

          </div>

        </div>
      </section>

      {/* 🧭 Section "Comment ça marche" en 3 étapes */}
      <section id="how-it-works" className="py-24 bg-[#FFF7ED] border-y border-[#FDE8CD] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <Badge className="bg-white text-[#EA580C] border-[#FDE8CD] px-3 py-1 font-bold text-xs uppercase tracking-wider">
              Simplicité Totale
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1C1917] tracking-tight font-heading">
              Comment ça marche pour vos clients & votre équipe ?
            </h2>
            <p className="text-base sm:text-lg text-[#78716C]">
              Une adoption immédiate sans formation compliquée.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            
            {/* Step 1 */}
            <div className="bg-white p-8 rounded-3xl border border-[#FDE8CD] shadow-xs relative space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EA580C] text-white flex items-center justify-center font-mono font-extrabold text-lg shadow-md shadow-[#EA580C]/25">
                01
              </div>
              <h3 className="text-xl font-bold text-[#1C1917]">
                Le client scanne le QR code
              </h3>
              <p className="text-sm text-[#78716C] leading-relaxed">
                Installé sur chaque table ou au comptoir, le QR code ouvre le menu digital en 1 seconde sans téléchargement d&apos;application.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-8 rounded-3xl border border-[#FDE8CD] shadow-xs relative space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EA580C] text-white flex items-center justify-center font-mono font-extrabold text-lg shadow-md shadow-[#EA580C]/25">
                02
              </div>
              <h3 className="text-xl font-bold text-[#1C1917]">
                Il choisit & personnalise
              </h3>
              <p className="text-sm text-[#78716C] leading-relaxed">
                Le client explore les photos gourmandes, personnalise ses options (cuisson, suppléments, boissons) et valide son panier.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-8 rounded-3xl border border-[#FDE8CD] shadow-xs relative space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#EA580C] text-white flex items-center justify-center font-mono font-extrabold text-lg shadow-md shadow-[#EA580C]/25">
                03
              </div>
              <h3 className="text-xl font-bold text-[#1C1917]">
                Paiement & Cuisine Instantanés
              </h3>
              <p className="text-sm text-[#78716C] leading-relaxed">
                La commande part immédiatement sur l&apos;écran cuisine (KDS) et le client peut payer par Mobile Money ou au serveur.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 💰 Section Calculateur de ROI / Rentabilité */}
      <section id="simulator" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="bg-[#1C1917] text-white rounded-[3rem] p-8 sm:p-12 lg:p-16 border border-[#292524] shadow-2xl relative overflow-hidden">
            
            {/* Ambient Lighting in Dark Card */}
            <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-[#EA580C]/20 blur-[120px] rounded-full pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              {/* Left Column: Sliders & Adjustments */}
              <div className="lg:col-span-6 space-y-8">
                <div>
                  <Badge className="bg-[#EA580C] text-white px-3 py-1 font-bold text-xs uppercase tracking-wider mb-3">
                    Calculateur de Rentabilité
                  </Badge>
                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-heading">
                    Combien Zagoor va rapporter à votre restaurant ?
                  </h2>
                  <p className="text-sm sm:text-base text-[#A8A29E] mt-2">
                    Ajustez les curseurs selon votre activité actuelle pour calculer votre gain net estimé.
                  </p>
                </div>

                {/* Slider 1: Couverts par jour */}
                <div className="space-y-3 bg-[#292524] p-5 rounded-2xl border border-[#44403C]">
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span className="text-[#A8A29E]">Couverts servis par jour</span>
                    <span className="text-[#EA580C] font-mono font-bold text-lg">{coversPerDay} clients/jour</span>
                  </div>
                  <input 
                    type="range" 
                    min="15" 
                    max="250" 
                    step="5"
                    value={coversPerDay} 
                    onChange={(e) => setCoversPerDay(parseInt(e.target.value))}
                    className="w-full h-2 bg-[#44403C] rounded-lg appearance-none cursor-pointer accent-[#EA580C]"
                  />
                  <div className="flex justify-between text-[11px] text-[#78716C]">
                    <span>15 couverts</span>
                    <span>120 couverts</span>
                    <span>250 couverts</span>
                  </div>
                </div>

                {/* Slider 2: Ticket Moyen */}
                <div className="space-y-3 bg-[#292524] p-5 rounded-2xl border border-[#44403C]">
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span className="text-[#A8A29E]">Ticket moyen actuel par personne</span>
                    <span className="text-[#EA580C] font-mono font-bold text-lg">{formatXOF(averageCheck)}</span>
                  </div>
                  <input 
                    type="range" 
                    min="2000" 
                    max="25000" 
                    step="500"
                    value={averageCheck} 
                    onChange={(e) => setAverageCheck(parseInt(e.target.value))}
                    className="w-full h-2 bg-[#44403C] rounded-lg appearance-none cursor-pointer accent-[#EA580C]"
                  />
                  <div className="flex justify-between text-[11px] text-[#78716C]">
                    <span>2 000 FCFA</span>
                    <span>12 000 FCFA</span>
                    <span>25 000 FCFA</span>
                  </div>
                </div>

              </div>

              {/* Right Column: Dynamic Results Card */}
              <div className="lg:col-span-6">
                <div className="bg-gradient-to-br from-[#292524] to-[#1C1917] p-8 rounded-3xl border-2 border-[#EA580C]/40 space-y-6 shadow-xl relative">
                  
                  <div className="flex items-center justify-between pb-4 border-b border-[#44403C]">
                    <div>
                      <p className="text-xs text-[#A8A29E] font-bold uppercase tracking-wider">Chiffre d&apos;affaires additionnel estimé</p>
                      <h3 className="text-3xl sm:text-4xl font-extrabold text-[#16A34A] font-mono mt-1">
                        +{formatXOF(additionalMonthlyIncome)} / mois
                      </h3>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-[#16A34A]/20 text-[#16A34A] flex items-center justify-center font-bold">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                    <div className="p-4 bg-[#1C1917] rounded-2xl border border-[#44403C]">
                      <p className="text-[#A8A29E] text-[11px]">Temps gagné / mois</p>
                      <p className="text-lg font-bold text-white font-mono mt-0.5">~{serverHoursSaved} heures</p>
                      <p className="text-[10px] text-[#78716C] mt-1">Serveurs plus disponibles</p>
                    </div>

                    <div className="p-4 bg-[#1C1917] rounded-2xl border border-[#44403C]">
                      <p className="text-[#A8A29E] text-[11px]">Économie menus papier</p>
                      <p className="text-lg font-bold text-[#EA580C] font-mono mt-0.5">100% Digital</p>
                      <p className="text-[10px] text-[#78716C] mt-1">Zéro réimpression</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <a
                      href="#pricing"
                      className="w-full inline-flex items-center justify-center px-6 py-4 text-sm sm:text-base font-bold text-white bg-[#EA580C] hover:bg-[#C2410C] rounded-2xl shadow-lg shadow-[#EA580C]/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
                    >
                      <span>Souscrire & Commencer à Générer ces Revenus</span>
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </a>
                  </div>

                </div>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ⭐️ Section Social Proof & Avis Chefs */}
      <section id="testimonials" className="py-24 bg-[#FFFBF5] relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-16">
            <div className="space-y-3 text-center md:text-left max-w-2xl">
              <Badge className="bg-[#FFF7ED] text-[#EA580C] border-[#FDE8CD] px-3.5 py-1 font-bold text-xs uppercase tracking-wider rounded-full">
                Témoignages & Avis Chefs
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1C1917] tracking-tight font-heading">
                Adopté par les plus grands restaurateurs d&apos;Afrique.
              </h2>
              <p className="text-base text-[#78716C]">
                Découvrez les retours authentiques de chefs, gérants et maîtres d&apos;hôtel.
              </p>
            </div>

            {/* Direct button to leave review */}
            <button
              onClick={() => setReviewModalOpen(true)}
              className="inline-flex items-center justify-center px-6 py-3.5 text-sm font-bold text-white bg-[#EA580C] hover:bg-[#C2410C] rounded-2xl shadow-lg shadow-[#EA580C]/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
            >
              <MessageSquarePlus className="w-4 h-4 mr-2" />
              <span>Laisser un avis Chef / Gérant</span>
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {reviews.map((rev) => (
              <Card key={rev.id} className="rounded-3xl border border-[#FDE8CD] bg-white p-8 shadow-xs hover:shadow-xl transition-all duration-300 space-y-5 flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex text-[#CA8A04] gap-1">
                      {Array.from({ length: rev.rating || 5 }).map((_, s) => (
                        <Star key={s} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    {rev.isVerified && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#16A34A] bg-[#16A34A]/10 px-2 py-0.5 rounded-full">
                        <Check className="w-3 h-3" /> Vérifié
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#1C1917] leading-relaxed italic">
                    « {rev.comment} »
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-[#FDE8CD]">
                  <div className="w-11 h-11 rounded-full overflow-hidden relative border-2 border-[#EA580C] bg-[#EA580C]/10 flex-shrink-0">
                    <Image 
                      src={rev.avatar || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=100&h=100&fit=crop'} 
                      alt={rev.authorName} 
                      fill 
                      className="object-cover" 
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#1C1917] leading-tight">{rev.authorName}</h4>
                    <p className="text-xs text-[#EA580C] font-semibold">{rev.authorRole}</p>
                    <p className="text-[11px] text-[#78716C]">{rev.restaurantName}{rev.city ? ` • ${rev.city}` : ''}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

        </div>
      </section>

      {/* 🏷️ Section Grille Tarifaire (Formule Unique Tout Inclus : 5 500 FCFA / mois) */}
      <section id="pricing" className="py-24 bg-[#FFF7ED] border-y border-[#FDE8CD] relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <Badge className="bg-white text-[#EA580C] border-[#FDE8CD] px-3.5 py-1 font-bold text-xs uppercase tracking-wider rounded-full shadow-xs">
              Tarification Unique & Transparente
            </Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1C1917] tracking-tight font-heading">
              Une seule formule complète pour tous les restaurants.
            </h2>
            <p className="text-base sm:text-lg text-[#78716C]">
              Toutes les fonctionnalités incluses, sans coûts cachés ni matériel supplémentaire.
            </p>

            {/* Monthly / Annual Toggle */}
            <div className="pt-4 flex items-center justify-center gap-3">
              <span className={`text-sm font-semibold ${!isAnnualBilling ? 'text-[#1C1917]' : 'text-[#78716C]'}`}>
                Mensuel
              </span>
              <button
                onClick={() => setIsAnnualBilling(!isAnnualBilling)}
                className="w-14 h-8 bg-[#1C1917] rounded-full p-1 transition-colors relative focus:outline-none"
                aria-label="Basculer facturation annuelle"
              >
                <div className={`w-6 h-6 rounded-full bg-[#EA580C] transition-transform duration-200 ${isAnnualBilling ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
              <span className={`text-sm font-semibold flex items-center gap-1.5 ${isAnnualBilling ? 'text-[#1C1917]' : 'text-[#78716C]'}`}>
                <span>Annuel</span>
                <Badge className="bg-[#16A34A] text-white text-[10px] px-2 py-0.5 font-bold rounded-full">
                  -20% Réduction
                </Badge>
              </span>
            </div>
          </div>

          {/* Single Master Pricing Card (5 500 FCFA) */}
          <div className="max-w-2xl mx-auto pt-6">
            <Card className="rounded-[2.5rem] border-2 border-[#EA580C] bg-white pt-10 pb-8 px-6 sm:px-12 sm:pt-12 sm:pb-12 shadow-2xl shadow-[#EA580C]/20 relative group">
              
              {/* Top Banner Tag */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-[#EA580C] to-[#C2410C] text-white text-xs font-extrabold uppercase tracking-wider rounded-full shadow-lg shadow-[#EA580C]/30 flex items-center gap-2 z-20 whitespace-nowrap">
                <Crown className="w-4 h-4" />
                <span>Formule Complète • Tout Inclus</span>
              </div>

              <div className="space-y-8">
                
                {/* Header Price Info */}
                <div className="text-center pt-2 space-y-3 pb-6 border-b border-[#FDE8CD]">
                  <div className="w-14 h-14 rounded-2xl bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center font-bold mx-auto shadow-xs">
                    <UtensilsCrossed className="w-7 h-7" />
                  </div>

                  <div>
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-[#1C1917] font-heading">
                      Abonnement Zagoor Pro
                    </h3>
                    <p className="text-sm text-[#78716C] mt-1">
                      Accès illimité pour votre restaurant, maquis, lounge ou hôtel.
                    </p>
                  </div>

                  <div className="flex items-baseline justify-center gap-1.5 pt-2">
                    <span className="text-5xl sm:text-6xl font-black text-[#EA580C] font-mono tracking-tight">
                      {isAnnualBilling ? '4 500' : '5 500'}
                    </span>
                    <span className="text-sm sm:text-base text-[#78716C] font-bold">FCFA / mois</span>
                  </div>
                  {isAnnualBilling && (
                    <p className="text-xs text-[#16A34A] font-semibold">
                      Facturé 54 000 FCFA / an (soit 2 mois offerts)
                    </p>
                  )}
                </div>

                {/* Features 2 Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-sm text-[#1C1917]">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#EA580C]/15 text-[#EA580C] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 font-bold" />
                    </div>
                    <span className="font-medium">Tables QR Code illimitées</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#EA580C]/15 text-[#EA580C] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 font-bold" />
                    </div>
                    <span className="font-medium">Menu digital interactif complet</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#EA580C]/15 text-[#EA580C] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 font-bold" />
                    </div>
                    <span className="font-medium">Studio Photos IA Culinaire</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#EA580C]/15 text-[#EA580C] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 font-bold" />
                    </div>
                    <span className="font-medium">Encaissement Mobile Money direct</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#EA580C]/15 text-[#EA580C] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 font-bold" />
                    </div>
                    <span className="font-medium">Écran Cuisine (KDS) en direct</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#EA580C]/15 text-[#EA580C] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 font-bold" />
                    </div>
                    <span className="font-medium">Comptes serveurs & managers</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#EA580C]/15 text-[#EA580C] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 font-bold" />
                    </div>
                    <span className="font-medium">Statistiques & Ventes en direct</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#EA580C]/15 text-[#EA580C] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 font-bold" />
                    </div>
                    <span className="font-medium">Assistance WhatsApp 7j/7</span>
                  </div>
                </div>

                {/* Call to action button */}
                <div className="pt-2">
                  <Link
                    href="/souscrire"
                    className="w-full inline-flex items-center justify-center py-4 text-base font-extrabold text-white bg-[#EA580C] hover:bg-[#C2410C] rounded-2xl shadow-xl shadow-[#EA580C]/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
                  >
                    <span>Souscrire à l&apos;Abonnement ({isAnnualBilling ? '4 500 FCFA / mois' : '5 500 FCFA / mois'})</span>
                    <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                  </Link>

                  <p className="text-center text-[11px] text-[#78716C] mt-3">
                    🔒 Paiement sécurisé via Mobile Money (Moov, MTN, Wave) & Carte Bancaire
                  </p>
                </div>

              </div>

            </Card>
          </div>

        </div>
      </section>

      {/* ❓ Section FAQ Interactive */}
      <section className="py-24 bg-[#FFFBF5] relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-4 mb-14">
            <Badge className="bg-[#FFF7ED] text-[#EA580C] border-[#FDE8CD] px-3.5 py-1 font-bold text-xs uppercase tracking-wider rounded-full">
              FAQ
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1C1917] tracking-tight font-heading">
              Questions Fréquentes des Restaurateurs
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Puis-je tester la démo avant de prendre un abonnement ?",
                a: "Oui, absolument ! Une démo interactive complète est accessible en libre accès sur notre site pour vous permettre d'expérimenter le menu digital client, le passage de commande et le cockpit cuisine. Dès que vous souscrivez à l'abonnement (5 500 FCFA/mois), votre propre restaurant dédié est activé instantanément avec vos QR codes personnalisés."
              },
              {
                q: "Faut-il acheter du matériel ou des tablettes spécifiques ?",
                a: "Absolument pas ! Zagoor fonctionne sur n'importe quel smartphone, tablette ou ordinateur déjà existant dans votre restaurant. Vos clients utilisent simplement leur propre téléphone pour scanner et commander."
              },
              {
                q: "Que se passe-t-il en cas de coupure Internet ?",
                a: "Notre application intègre la technologie PWA avec mise en cache locale. Le menu reste consultable et les commandes sont synchronisées dès que la connexion est rétablie."
              },
              {
                q: "Comment les paiements Mobile Money arrivent-ils sur mon compte ?",
                a: "Les fonds sont versés directement sur votre compte Mobile Money marchand ou compte bancaire en toute sécurité avec validation instantanée."
              },
              {
                q: "Combien de temps faut-il pour mettre en place mon restaurant ?",
                a: "Moins de 5 minutes ! Après la souscription, vous donnez le nom de votre établissement, choisissez vos spécialités, et vos QR codes sont prêts à être téléchargés et imprimés."
              }
            ].map((faq, idx) => (
              <div 
                key={idx} 
                className="border border-[#FDE8CD] rounded-2xl bg-white overflow-hidden transition-all shadow-xs"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-left font-bold text-[#1C1917] flex justify-between items-center text-base hover:text-[#EA580C] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-[#EA580C] transition-transform duration-200 ${openFaq === idx ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-sm text-[#78716C] leading-relaxed border-t border-[#FDE8CD] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 🚀 CTA Final Immense */}
      <section id="demo-section" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="bg-gradient-to-tr from-[#EA580C] via-[#C2410C] to-[#9A3412] rounded-[3rem] p-10 sm:p-16 text-white text-center space-y-8 relative overflow-hidden shadow-2xl shadow-[#EA580C]/25">
            
            {/* SVG Pattern Decor */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-noise" />

            <div className="max-w-3xl mx-auto space-y-4 relative z-10">
              <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 px-3.5 py-1 font-bold text-xs uppercase tracking-wider rounded-full">
                Digitalisez votre établissement dès aujourd&apos;hui
              </Badge>

              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight font-heading">
                Rejoignez la nouvelle génération de restaurants africains à succès.
              </h2>

              <p className="text-base sm:text-lg text-white/90 leading-relaxed font-medium">
                Augmentez votre ticket moyen, supprimez les erreurs de commande et offrez une expérience gastronomique inoubliable.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <Link
                href="/souscrire"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-bold text-[#EA580C] bg-white hover:bg-[#FFF7ED] rounded-2xl shadow-xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] group"
              >
                <Crown className="w-5 h-5 mr-2 text-[#EA580C]" />
                <span>Souscrire à l&apos;Abonnement Pro</span>
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/le-jardin-savoureux"
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-white/15 hover:bg-white/25 border border-white/30 rounded-2xl backdrop-blur-md transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              >
                <UtensilsCrossed className="w-5 h-5 mr-2" />
                <span>Tester la Démo Restaurant</span>
              </Link>
            </div>

          </div>

        </div>
      </section>

      {/* 🌘 Footer Sombre Élégant */}
      <footer className="bg-[#1C1917] text-white pt-16 pb-12 border-t border-[#292524] relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-[#292524]">
            
            {/* Col 1: Brand (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#EA580C] flex items-center justify-center text-white">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <span className="font-bold text-2xl tracking-tight text-white font-heading">
                  Zagoor<span className="text-[#EA580C]">.</span>
                </span>
              </div>
              <p className="text-sm text-[#A8A29E] max-w-sm leading-relaxed">
                La plateforme SaaS de référence pour la digitalisation, la prise de commande QR code et le paiement Mobile Money des restaurants africains.
              </p>
              <div className="flex items-center gap-3 pt-2 text-xs text-[#A8A29E]">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#EA580C]" /> Cotonou • Abidjan • Dakar • Lomé
                </span>
              </div>
            </div>

            {/* Col 2: Produit */}
            <div className="space-y-3 text-sm">
              <h4 className="font-bold text-white uppercase text-xs tracking-wider">Produit</h4>
              <ul className="space-y-2 text-[#A8A29E]">
                <li><Link href="/le-jardin-savoureux" className="hover:text-[#EA580C] transition-colors">Menu Digital Client</Link></li>
                <li><a href="#features" className="hover:text-[#EA580C] transition-colors">Écran Cuisine KDS</a></li>
                <li><a href="#features" className="hover:text-[#EA580C] transition-colors">Studio Photo IA</a></li>
                <li><a href="#features" className="hover:text-[#EA580C] transition-colors">Paiement Mobile Money</a></li>
              </ul>
            </div>

            {/* Col 3: Entreprise */}
            <div className="space-y-3 text-sm">
              <h4 className="font-bold text-white uppercase text-xs tracking-wider">Solutions</h4>
              <ul className="space-y-2 text-[#A8A29E]">
                <li><a href="#pricing" className="hover:text-[#EA580C] transition-colors">Restaurants & Fast-Foods</a></li>
                <li><a href="#pricing" className="hover:text-[#EA580C] transition-colors">Maquis & Lounges</a></li>
                <li><a href="#pricing" className="hover:text-[#EA580C] transition-colors">Hôtels & Terrasses</a></li>
                <li><a href="#simulator" className="hover:text-[#EA580C] transition-colors">Calculateur de Gain</a></li>
              </ul>
            </div>

            {/* Col 4: Contact & Légal */}
            <div className="space-y-3 text-sm">
              <h4 className="font-bold text-white uppercase text-xs tracking-wider">Contact</h4>
              <ul className="space-y-2 text-[#A8A29E]">
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#EA580C]" /> contact@zagoor.app
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#EA580C]" /> +229 97 12 34 56
                </li>
                <li className="pt-2 text-xs text-[#78716C]">
                  Disponible 7j/7 pour vous accompagner.
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom copyright */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#78716C]">
            <div>
              © {new Date().getFullYear()} Zagoor Technologies. Tous droits réservés.
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
              <a href="#" className="hover:text-white transition-colors">Conditions Générales</a>
              <a href="#" className="hover:text-white transition-colors">Sécurité</a>
            </div>
          </div>

        </div>
      </footer>

      {/* 🔔 Automatic Intelligent Chef/Admin Review Floating Toast Popup */}
      <AnimatePresence>
        {reviewToastPopupOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full p-4 bg-[#1C1917] text-white rounded-3xl border-2 border-[#EA580C]/50 shadow-2xl shadow-[#EA580C]/20"
          >
            <button
              onClick={() => setReviewToastPopupOpen(false)}
              className="absolute top-3 right-3 text-[#A8A29E] hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Fermer la pop-up"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3.5 pr-6">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#EA580C] to-[#C2410C] flex items-center justify-center text-white flex-shrink-0 shadow-md">
                <ChefHat className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white">Vous êtes Chef ou Gérant ?</span>
                  <span className="w-2 h-2 rounded-full bg-[#16A34A] inline-block animate-pulse" />
                </div>
                <p className="text-xs text-[#A8A29E] leading-relaxed">
                  Partagez votre avis sur Zagoor et inspirez les restaurateurs de votre région !
                </p>
              </div>
            </div>

            <div className="mt-3.5 pt-3 border-t border-[#292524] flex items-center justify-between gap-2">
              <button
                onClick={() => setReviewToastPopupOpen(false)}
                className="px-3 py-1.5 text-xs text-[#A8A29E] hover:text-white font-medium"
              >
                Plus tard
              </button>
              <button
                onClick={() => {
                  setReviewToastPopupOpen(false)
                  setReviewModalOpen(true)
                }}
                className="px-4 py-2 text-xs font-bold bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl shadow-md flex items-center gap-1.5 transition-transform hover:scale-105"
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>Laisser mon Avis</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 👨‍🍳 Master Chef & Admin Review Modal */}
      <AnimatePresence>
        {reviewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.25 }}
              className="bg-[#FFFBF5] text-[#1C1917] rounded-3xl border-2 border-[#FDE8CD] max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8"
            >
              {/* Close button */}
              <button
                onClick={() => setReviewModalOpen(false)}
                className="absolute top-5 right-5 text-[#78716C] hover:text-[#1C1917] p-2 rounded-full hover:bg-[#FFF7ED] transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-3.5 mb-6 pb-4 border-b border-[#FDE8CD]">
                <div className="w-12 h-12 rounded-2xl bg-[#EA580C] text-white flex items-center justify-center shadow-md shadow-[#EA580C]/25 flex-shrink-0">
                  <ChefHat className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1C1917] font-heading">
                    Laisser un Avis Chef & Restaurateur
                  </h3>
                  <p className="text-xs text-[#78716C]">
                    Votre retour d&apos;expérience sera visible par tous les professionnels.
                  </p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmitReview} className="space-y-4">
                
                {/* Rating selection (Stars) */}
                <div className="space-y-1.5 bg-white p-4 rounded-2xl border border-[#FDE8CD]">
                  <label className="text-xs font-bold text-[#78716C] uppercase tracking-wider block">
                    Votre Note Globale
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewReviewForm({ ...newReviewForm, rating: star })}
                        className="p-1 text-2xl transition-transform hover:scale-125 focus:outline-none"
                      >
                        <Star 
                          className={`w-7 h-7 ${star <= newReviewForm.rating ? 'text-[#CA8A04] fill-current' : 'text-[#D6D3D1]'}`} 
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-[#EA580C] ml-2">
                      {newReviewForm.rating === 5 ? 'Exceptionnel (5/5)' : `${newReviewForm.rating}/5`}
                    </span>
                  </div>
                </div>

                {/* Author Name & Role */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1C1917]">
                      Nom & Prénom <span className="text-[#EA580C]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Chef Malik Koffi"
                      value={newReviewForm.authorName}
                      onChange={(e) => setNewReviewForm({ ...newReviewForm, authorName: e.target.value })}
                      className="w-full bg-white border border-[#FDE8CD] rounded-xl px-3.5 py-2 text-xs font-medium focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1C1917]">
                      Rôle / Fonction
                    </label>
                    <Select
                      value={newReviewForm.authorRole}
                      onValueChange={(val) => setNewReviewForm({ ...newReviewForm, authorRole: val })}
                    >
                      <SelectTrigger className="w-full h-10 rounded-xl border border-[#FDE8CD] text-xs font-medium bg-white">
                        <SelectValue placeholder="Sélectionnez votre rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Chef Cuisinier">Chef Cuisinier</SelectItem>
                        <SelectItem value="Chef Exécutif & Propriétaire">Chef Exécutif & Propriétaire</SelectItem>
                        <SelectItem value="Gérant de Restaurant">Gérant de Restaurant</SelectItem>
                        <SelectItem value="Directeur d'Exploitation">Directeur d&apos;Exploitation</SelectItem>
                        <SelectItem value="Maître d'Hôtel">Maître d&apos;Hôtel</SelectItem>
                        <SelectItem value="Admin & Fondateur">Admin & Fondateur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Restaurant Name & City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1C1917]">
                      Nom du Restaurant <span className="text-[#EA580C]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Le Jardin Savoureux"
                      value={newReviewForm.restaurantName}
                      onChange={(e) => setNewReviewForm({ ...newReviewForm, restaurantName: e.target.value })}
                      className="w-full bg-white border border-[#FDE8CD] rounded-xl px-3.5 py-2 text-xs font-medium focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#1C1917]">
                      Ville & Pays
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Cotonou, Bénin"
                      value={newReviewForm.city}
                      onChange={(e) => setNewReviewForm({ ...newReviewForm, city: e.target.value })}
                      className="w-full bg-white border border-[#FDE8CD] rounded-xl px-3.5 py-2 text-xs font-medium focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] outline-none"
                    />
                  </div>
                </div>

                {/* Testimonial Comment */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#1C1917]">
                    Votre Avis / Témoignage <span className="text-[#EA580C]">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Racontez votre expérience : impact sur vos ventes, facilité d'utilisation, retours de vos clients ou de votre cuisine..."
                    value={newReviewForm.comment}
                    onChange={(e) => setNewReviewForm({ ...newReviewForm, comment: e.target.value })}
                    className="w-full bg-white border border-[#FDE8CD] rounded-xl p-3 text-xs font-medium focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] outline-none resize-none leading-relaxed"
                  />
                </div>

                {/* Avatar Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#78716C]">
                    Photo de Profil
                  </label>
                  <div className="flex items-center gap-3">
                    {avatarOptions.map((av, idx) => (
                      <button
                        type="button"
                        key={idx}
                        onClick={() => setNewReviewForm({ ...newReviewForm, avatar: av.url })}
                        className={`w-10 h-10 rounded-full overflow-hidden relative border-2 transition-transform ${
                          newReviewForm.avatar === av.url ? 'border-[#EA580C] scale-110 shadow-md shadow-[#EA580C]/20' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <Image src={av.url} alt={av.label} fill className="object-cover" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#FDE8CD]">
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(false)}
                    className="px-4 py-2.5 text-xs font-semibold text-[#78716C] hover:text-[#1C1917]"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-6 py-2.5 text-xs sm:text-sm font-bold bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl shadow-lg shadow-[#EA580C]/25 flex items-center gap-2 disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {submittingReview ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Publication en cours...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Publier mon Avis</span>
                      </>
                    )}
                  </button>
                </div>

              </form>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
