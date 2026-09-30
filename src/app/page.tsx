'use client'

import React, { useState, useEffect } from 'react'
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
  Lock,
  MessageSquarePlus,
  Send,
  Loader2,
  Award,
  Radio,
  Share2,
  Printer
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
    comment: 'Le QR code sur nos tables a augmenté nos ventes de desserts et boissons de 38%. Les clients adorent voir les vraies photos de nos plats et le service en cuisine est 2 fois plus rapide !',
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
    comment: 'L\'encaissement Wave & Orange Money a éliminé tous les problèmes de monnaie aux heures de pointe. Les cuisiniers reçoivent les bons instantanément sur leur écran sans aucun papier égaré.',
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
    comment: 'En moins de 10 minutes nous étions opérationnels. Le studio photo IA intégré nous a permis d\'avoir un menu digne d\'un palace 5 étoiles sans dépenser des centaines de mille en shooting.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop',
    isVerified: true
  },
  {
    id: 'rev-4',
    authorName: 'Ibrahim Touré',
    authorRole: 'Propriétaire',
    restaurantName: 'Maquis Le Braisé Royal',
    city: 'Bamako, Mali',
    rating: 5,
    comment: 'La simplicité est déconcertante. Nos serveurs sont moins stressés, les commandes sont exactes sans erreur de cuisson et les clients apprécient le suivi WhatsApp.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop',
    isVerified: true
  }
]

export default function LandingPage() {
  const [isAnnual, setIsAnnual] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0)

  // Interactive Live Simulator State
  const [simCart, setSimCart] = useState<{ id: string; name: string; price: number; qty: number; image: string }[]>([
    {
      id: 'sim-1',
      name: 'Poulet Braisé Sauvage & Alloco',
      price: 6500,
      qty: 1,
      image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=300&fit=crop'
    },
    {
      id: 'sim-2',
      name: 'Cocktail Hibiscus Royal (Bissap Bio)',
      price: 2500,
      qty: 2,
      image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop'
    }
  ])
  const [simOrderPlaced, setSimOrderPlaced] = useState(false)
  const [simTableNum, setSimTableNum] = useState('Table 04')

  // Review submission state
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>(INITIAL_REVIEWS_LIST)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewAuthor, setReviewAuthor] = useState('')
  const [reviewRole, setReviewRole] = useState('')
  const [reviewRestaurant, setReviewRestaurant] = useState('')
  const [reviewCity, setReviewCity] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

  // Simulator helper
  const simTotal = simCart.reduce((acc, item) => acc + item.price * item.qty, 0)

  const handleSimAddQuantity = (id: string) => {
    setSimCart(prev => prev.map(item => item.id === id ? { ...item, qty: item.qty + 1 } : item))
  }

  const handleSimReduceQuantity = (id: string) => {
    setSimCart(prev => prev.map(item => item.id === id ? { ...item, qty: Math.max(1, item.qty - 1) } : item))
  }

  const handleSimulateOrder = () => {
    setSimOrderPlaced(true)
    toast.success('🔔 Bip ! Nouvelle commande reçue instantanément dans le Cockpit Cuisine !')
    setTimeout(() => {
      setSimOrderPlaced(false)
    }, 6000)
  }

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewAuthor.trim() || !reviewRestaurant.trim() || !reviewComment.trim()) {
      toast.error('Veuillez renseigner votre nom, établissement et avis.')
      return
    }

    setReviewSubmitting(true)
    setTimeout(() => {
      const newRev: ReviewItem = {
        id: `rev-${Date.now()}`,
        authorName: reviewAuthor,
        authorRole: reviewRole || 'Restaurateur Partenaire',
        restaurantName: reviewRestaurant,
        city: reviewCity || 'Afrique de l\'Ouest',
        rating: reviewRating,
        comment: reviewComment,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop',
        isVerified: true,
        createdAt: new Date().toISOString()
      }
      setReviewsList([newRev, ...reviewsList])
      setReviewSubmitting(false)
      setShowReviewModal(false)
      toast.success('Merci pour votre témoignage ! Il a été publié avec succès.')
      setReviewAuthor('')
      setReviewRole('')
      setReviewRestaurant('')
      setReviewCity('')
      setReviewComment('')
    }, 600)
  }

  return (
    <div className="min-h-screen bg-[#FFFBF5] text-[#1C1917] font-sans antialiased selection:bg-[#EA580C] selection:text-white relative overflow-x-hidden">
      
      {/* Texture de fond bruit SVG globale */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.035] bg-noise" />

      {/* 📢 Top Announcement Bar */}
      <div className="bg-[#1C1917] text-white py-2 px-4 text-center text-xs font-semibold border-b border-[#292524] relative z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 flex-wrap">
          <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
          <span className="text-[#FDE8CD]">Offre Lancement Afrique :</span>
          <span className="text-white font-bold">5 500 FCFA/mois sans engagement • 0% de commission sur vos commandes</span>
          <Link
            href="/souscrire"
            className="inline-flex items-center gap-1 text-[#EA580C] hover:underline font-extrabold ml-1"
          >
            <span>Activer mon restaurant</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* 🧭 Sticky Floating Navbar Glassmorphism */}
      <header className="sticky top-0 z-40 bg-[#FFFBF5]/90 backdrop-blur-xl border-b border-[#FDE8CD] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#EA580C] to-[#C2410C] flex items-center justify-center text-white shadow-lg shadow-[#EA580C]/25 group-hover:scale-105 transition-transform">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-black text-2xl tracking-tight text-[#1C1917] font-heading block leading-none">
                Zagoor <span className="text-[#EA580C]">Resto</span>
              </span>
              <span className="text-[10px] text-[#78716C] font-extrabold uppercase tracking-widest block mt-0.5">
                Menu QR & Cockpit SaaS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-extrabold text-[#78716C]">
            <a href="#features" className="hover:text-[#EA580C] transition-colors">Fonctionnalités</a>
            <a href="#demo-live" className="hover:text-[#EA580C] transition-colors flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] animate-pulse" />
              <span>Simulateur Live</span>
            </a>
            <a href="#how-it-works" className="hover:text-[#EA580C] transition-colors">Comment ça marche</a>
            <a href="#pricing" className="hover:text-[#EA580C] transition-colors">Tarifs</a>
            <a href="#reviews" className="hover:text-[#EA580C] transition-colors">Avis Chefs</a>
            <a href="#faq" className="hover:text-[#EA580C] transition-colors">FAQ</a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Direct Link to Founder Cockpit */}
            <Link
              href="/admin/super-admin"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-500/30 text-xs font-bold transition-all"
              title="Espace Fondateur SaaS"
            >
              <Crown className="w-3.5 h-3.5 text-[#EA580C]" />
              <span>Fondateur</span>
            </Link>

            {/* Direct Link to Manager Cockpit */}
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white hover:bg-[#FFF7ED] text-[#1C1917] border border-[#FDE8CD] text-xs font-extrabold transition-all shadow-xs"
            >
              <Store className="w-4 h-4 text-[#EA580C]" />
              <span>Cockpit Gérant</span>
            </Link>

            {/* Primary Subscription Button */}
            <Link
              href="/souscrire"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-extrabold shadow-md shadow-[#EA580C]/25 transition-all hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Souscrire (5 500 FCFA)</span>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 rounded-xl bg-white border border-[#FDE8CD] text-[#1C1917]"
            aria-label="Ouvrir le menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-b border-[#FDE8CD] bg-white px-4 py-6 space-y-4 shadow-xl"
            >
              <div className="flex flex-col gap-3 font-extrabold text-sm">
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="py-2 text-[#1C1917]">Fonctionnalités</a>
                <a href="#demo-live" onClick={() => setMobileMenuOpen(false)} className="py-2 text-[#1C1917]">Simulateur Live</a>
                <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="py-2 text-[#1C1917]">Comment ça marche</a>
                <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="py-2 text-[#1C1917]">Tarifs</a>
                <a href="#reviews" onClick={() => setMobileMenuOpen(false)} className="py-2 text-[#1C1917]">Témoignages</a>
                <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="py-2 text-[#1C1917]">FAQ</a>
              </div>

              <div className="pt-4 border-t border-[#FDE8CD] flex flex-col gap-2.5">
                <Link
                  href="/souscrire"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 rounded-2xl bg-[#EA580C] text-white font-extrabold text-center text-sm shadow-md"
                >
                  Souscrire & Débloquer mon Restaurant
                </Link>
                <Link
                  href="/le-jardin-savoureux"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 rounded-2xl bg-[#FFF7ED] text-[#EA580C] border border-[#FDE8CD] font-bold text-center text-sm"
                >
                  Tester le Restaurant Démo
                </Link>
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3 rounded-2xl bg-[#1C1917] text-white font-bold text-center text-sm flex items-center justify-center gap-2"
                >
                  <Store className="w-4 h-4 text-[#EA580C]" />
                  <span>Accéder au Cockpit Gérant</span>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 🚀 1. HERO SECTION: ULTRA-PREMIUM & HIGH-CONVERTING */}
      <section className="relative pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
        
        {/* Soft Background Accents */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#EA580C]/10 via-[#FDE8CD]/40 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-4xl mx-auto space-y-6">
            
            {/* Top Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#FDE8CD] shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-[#EA580C] animate-ping" />
              <span className="text-xs font-black text-[#1C1917] uppercase tracking-wider">
                La Solution Restauration N°1 en Afrique
              </span>
              <Badge className="bg-[#16A34A] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full border-0">
                0% Commission
              </Badge>
            </motion.div>

            {/* Massive Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-black text-[#1C1917] tracking-tight font-heading leading-[1.08]"
            >
              Transformez vos Tables en Bornes de Commande et Boostez vos Recettes de <span className="text-[#EA580C] underline decoration-[#FDE8CD] underline-offset-8">+35%</span>.
            </motion.h1>

            {/* Punchy Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-base sm:text-xl text-[#78716C] max-w-2xl mx-auto font-medium leading-relaxed"
            >
              Menu digital QR Code haute définition, encaissement direct Wave & Mobile Money, écran cuisine KDS en direct et studio photo culinaire par IA. Vos clients commandent en 1 clic sans rien installer.
            </motion.p>

            {/* Dual CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
            >
              <Link
                href="/souscrire"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-base font-extrabold shadow-xl shadow-[#EA580C]/25 transition-all hover:scale-105 active:scale-95 group"
              >
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span>Débloquer mon Restaurant (5 500 FCFA)</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/le-jardin-savoureux"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white hover:bg-[#FFF7ED] text-[#1C1917] border-2 border-[#FDE8CD] text-base font-extrabold shadow-xs transition-all hover:scale-105"
              >
                <UtensilsCrossed className="w-5 h-5 text-[#EA580C]" />
                <span>Tester la Démo Restaurant</span>
              </Link>
            </motion.div>

            {/* Trust Badges & Supported Operators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="pt-6 flex flex-wrap items-center justify-center gap-y-3 gap-x-6 text-xs text-[#78716C] font-bold"
            >
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                <span>Sans installation d&apos;application</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                <span>Paiements Wave, MoMo, Orange & Flooz</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                <span>Prêt en 10 minutes chrono</span>
              </div>
            </motion.div>

          </div>

          {/* 📱 Interactive Dual Showcase Mockup (Menu Client + Cockpit Cuisine KDS) */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="mt-14 sm:mt-20 max-w-5xl mx-auto relative"
          >
            <div className="bg-white border-2 border-[#FDE8CD] rounded-3xl sm:rounded-[36px] p-4 sm:p-8 shadow-2xl shadow-[#EA580C]/10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Side: Mobile Phone Menu View (Client) */}
              <div className="lg:col-span-5 bg-[#FFFBF5] border border-[#FDE8CD] rounded-3xl p-5 shadow-inner space-y-4">
                
                {/* Header Phone */}
                <div className="flex items-center justify-between pb-3 border-b border-[#FDE8CD]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#EA580C] text-white flex items-center justify-center font-bold text-xs">
                      🍴
                    </div>
                    <div>
                      <h4 className="font-black text-xs text-[#1C1917]">Le Jardin Savoureux</h4>
                      <span className="text-[10px] text-[#16A34A] font-bold">● Table N°04 • En direct</span>
                    </div>
                  </div>
                  <Badge className="bg-[#FFF7ED] text-[#EA580C] border border-[#FDE8CD] text-[10px]">
                    Menu Client
                  </Badge>
                </div>

                {/* Featured Dish Card */}
                <div className="bg-white rounded-2xl p-3 border border-[#FDE8CD] shadow-sm space-y-2">
                  <div className="h-32 rounded-xl overflow-hidden relative">
                    <img
                      src="https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=600&h=400&fit=crop"
                      alt="Poulet Braisé"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 bg-[#EA580C] text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs">
                      🔥 Best-Seller
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-extrabold text-xs text-[#1C1917]">Poulet Braisé & Alloco</h5>
                      <span className="text-xs font-black text-[#EA580C] font-mono">6 500 FCFA</span>
                    </div>
                    <Button size="sm" className="h-7 px-3 bg-[#EA580C] hover:bg-[#C2410C] text-white text-[11px] font-bold rounded-lg">
                      + Ajouter
                    </Button>
                  </div>
                </div>

                {/* Second Dish Card */}
                <div className="bg-white rounded-2xl p-3 border border-[#FDE8CD] shadow-sm flex items-center justify-between gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1544145945-f90425340c7e?w=200&h=200&fit=crop"
                      alt="Bissap"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h5 className="font-extrabold text-xs text-[#1C1917]">Cocktail Bissap Royal</h5>
                    <span className="text-xs font-black text-[#EA580C] font-mono">2 500 FCFA</span>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 px-3 border-[#FDE8CD] text-xs font-bold rounded-lg">
                    +1
                  </Button>
                </div>

                {/* Instant Mobile Money Pay Button */}
                <div className="pt-2">
                  <div className="p-3 bg-[#1C1917] text-white rounded-2xl flex items-center justify-between shadow-md">
                    <div>
                      <span className="text-[10px] text-[#A8A29E] block">Total Panier (2 articles)</span>
                      <span className="font-black text-sm text-[#16A34A] font-mono">9 000 FCFA</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-black bg-[#EA580C] px-3 py-1.5 rounded-xl">
                      <span>Commander</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Side: Kitchen KDS / Manager View */}
              <div className="lg:col-span-7 space-y-4">
                
                <div className="flex items-center justify-between pb-3 border-b border-[#FDE8CD]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#1C1917] text-white flex items-center justify-center font-bold">
                      <Store className="w-5 h-5 text-[#EA580C]" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-[#1C1917]">Écran Cuisine KDS & Dashboard Gérant</h4>
                      <p className="text-[11px] text-[#78716C]">Réception instantanée avec minuteur et alertes</p>
                    </div>
                  </div>
                  <Badge className="bg-[#16A34A]/10 text-[#16A34A] border-none text-xs font-bold">
                    🟢 En direct
                  </Badge>
                </div>

                {/* Live Order Ticket */}
                <div className="bg-[#FFF7ED] border-2 border-[#EA580C]/40 rounded-2xl p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C] animate-ping" />
                      <span className="font-black text-xs text-[#1C1917]">Commande #CMD-842 • Table 04</span>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-[#EA580C] bg-white px-2 py-0.5 rounded-md border border-[#FDE8CD]">
                      Il y a 30 sec
                    </span>
                  </div>

                  <div className="divide-y divide-[#FDE8CD]/70 text-xs">
                    <div className="py-1.5 flex justify-between font-bold">
                      <span>1x Poulet Braisé & Alloco (Piment doux)</span>
                      <span className="font-mono text-[#EA580C]">6 500 FCFA</span>
                    </div>
                    <div className="py-1.5 flex justify-between font-bold">
                      <span>2x Cocktail Bissap Royal (Bien glacé)</span>
                      <span className="font-mono text-[#EA580C]">2 500 FCFA</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-[#FDE8CD]">
                    <span className="text-xs text-[#16A34A] font-bold">✅ Réglé via Wave (WAV-98124)</span>
                    <div className="flex gap-2">
                      <Button size="sm" className="h-8 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl">
                        ✓ Valider en Cuisine
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Quick Feature Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                  <div className="p-2.5 bg-white border border-[#FDE8CD] rounded-xl text-center shadow-2xs">
                    <span className="text-[10px] text-[#78716C] block">Panier Moyen</span>
                    <span className="font-black text-xs text-[#1C1917] font-mono">+35% générés</span>
                  </div>
                  <div className="p-2.5 bg-white border border-[#FDE8CD] rounded-xl text-center shadow-2xs">
                    <span className="text-[10px] text-[#78716C] block">Attente Table</span>
                    <span className="font-black text-xs text-[#16A34A] font-mono">-40% de temps</span>
                  </div>
                  <div className="p-2.5 bg-white border border-[#FDE8CD] rounded-xl text-center shadow-2xs col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-[#78716C] block">Commission</span>
                    <span className="font-black text-xs text-[#EA580C] font-mono">0 FCFA (Zéro)</span>
                  </div>
                </div>

              </div>

            </div>
          </motion.div>

        </div>
      </section>

      {/* 📊 2. METRICS & SOCIAL PROOF STRIP */}
      <section className="py-12 bg-[#1C1917] text-white border-y border-[#292524]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-black text-[#EA580C] font-mono tracking-tight">+100</span>
              <p className="text-xs text-[#A8A29E] font-bold uppercase tracking-wider">Restaurants & Lounges</p>
            </div>

            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-black text-[#16A34A] font-mono tracking-tight">+350 000</span>
              <p className="text-xs text-[#A8A29E] font-bold uppercase tracking-wider">Commandes Traitées</p>
            </div>

            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-black text-white font-mono tracking-tight">0%</span>
              <p className="text-xs text-[#A8A29E] font-bold uppercase tracking-wider">Commission Prélevée</p>
            </div>

            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-black text-[#CA8A04] font-mono tracking-tight">10 Min</span>
              <p className="text-xs text-[#A8A29E] font-bold uppercase tracking-wider">Mise en Ligne Express</p>
            </div>

          </div>
        </div>
      </section>

      {/* 🛠️ 3. HOW IT WORKS IN 3 STEPS */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-[#FFFBF5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <Badge className="bg-[#FFF7ED] text-[#EA580C] border border-[#FDE8CD] px-4 py-1 text-xs font-black uppercase tracking-wider rounded-full">
              Processus 100% Automatisé
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-black text-[#1C1917] font-heading tracking-tight">
              Comment ça fonctionne pour votre restaurant ?
            </h2>
            <p className="text-base text-[#78716C]">
              Démarrez aujourd&apos;hui sans matériel complexe ni contrat d&apos;engagement lourd.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <Card className="rounded-3xl border border-[#FDE8CD] bg-white p-8 shadow-xs space-y-5 relative overflow-hidden group hover:shadow-xl transition-all">
              <div className="w-14 h-14 rounded-2xl bg-[#EA580C]/10 text-[#EA580C] flex items-center justify-center font-black text-xl">
                1
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-[#1C1917] font-heading">
                  Créez votre Carte & Imprimez vos QR Codes
                </h3>
                <p className="text-xs text-[#78716C] leading-relaxed">
                  Renseignez vos plats avec nos modèles de démarrage ou utilisez notre studio photo IA. Téléchargez vos chevalets QR prêts pour vos tables.
                </p>
              </div>
              <div className="pt-2 text-xs font-bold text-[#EA580C] flex items-center gap-1">
                <span>Génération automatique</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </Card>

            {/* Step 2 */}
            <Card className="rounded-3xl border border-[#FDE8CD] bg-white p-8 shadow-xs space-y-5 relative overflow-hidden group hover:shadow-xl transition-all">
              <div className="w-14 h-14 rounded-2xl bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center font-black text-xl">
                2
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-[#1C1917] font-heading">
                  Vos Clients Scannent & Commandent à Table
                </h3>
                <p className="text-xs text-[#78716C] leading-relaxed">
                  Pas d&apos;application à installer. Le client scanne simplement le QR code avec l&apos;appareil photo de son téléphone et découvre votre menu interactif en HD.
                </p>
              </div>
              <div className="pt-2 text-xs font-bold text-[#16A34A] flex items-center gap-1">
                <span>0 friction client</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </Card>

            {/* Step 3 */}
            <Card className="rounded-3xl border border-[#FDE8CD] bg-white p-8 shadow-xs space-y-5 relative overflow-hidden group hover:shadow-xl transition-all">
              <div className="w-14 h-14 rounded-2xl bg-[#CA8A04]/10 text-[#CA8A04] flex items-center justify-center font-black text-xl">
                3
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-[#1C1917] font-heading">
                  Encaissez Directement & Préparez en Cuisine
                </h3>
                <p className="text-xs text-[#78716C] leading-relaxed">
                  Le client règle par Wave, MoMo ou en espèces. Le bon de commande sonne en cuisine sur votre écran KDS ou votre téléphone gérant en direct.
                </p>
              </div>
              <div className="pt-2 text-xs font-bold text-[#CA8A04] flex items-center gap-1">
                <span>100% sécurisé</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </Card>

          </div>

        </div>
      </section>

      {/* 🌟 4. CORE FEATURES (GRID 6 BESPOKE MICRO-UIS) */}
      <section id="features" className="py-20 sm:py-28 bg-white border-y border-[#FDE8CD]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <Badge className="bg-[#FFF7ED] text-[#EA580C] border border-[#FDE8CD] px-4 py-1 text-xs font-black uppercase tracking-wider rounded-full">
              Fonctionnalités Exclusives
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-black text-[#1C1917] font-heading tracking-tight">
              Tout ce dont votre établissement a besoin pour réussir
            </h2>
            <p className="text-base text-[#78716C]">
              Une suite complète d&apos;outils pensés pour le terrain et les réalités de la restauration en Afrique.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Feature 1 */}
            <Card className="rounded-3xl border border-[#FDE8CD] bg-[#FFFBF5] p-7 shadow-xs space-y-4 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#EA580C] text-white flex items-center justify-center font-bold shadow-md shadow-[#EA580C]/20">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-[#1C1917] font-heading">
                Menu Digital QR Code à Table
              </h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Photos alléchantes, descriptions gourmandes, indication des calories et choix des niveaux de piment. Fonctionne sur tous les smartphones sans téléchargement.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="rounded-3xl border border-[#FDE8CD] bg-[#FFFBF5] p-7 shadow-xs space-y-4 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#16A34A] text-white flex items-center justify-center font-bold shadow-md shadow-[#16A34A]/20">
                <Laptop className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-[#1C1917] font-heading">
                Écran Cuisine KDS & Alertes Sonores
              </h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Finis les tickets papiers perdus ou tachés de sauce. La cuisine voit les commandes par table avec chronomètre et valide l&apos;état de préparation d&apos;un simple clic.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="rounded-3xl border border-[#FDE8CD] bg-[#FFFBF5] p-7 shadow-xs space-y-4 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#CA8A04] text-white flex items-center justify-center font-bold shadow-md shadow-[#CA8A04]/20">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-[#1C1917] font-heading">
                Paiement Mobile Money Direct
              </h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Support complet de Wave, MTN MoMo, Orange Money, Moov Flooz et Carte Bancaire. L&apos;argent arrive directement sur votre compte sans intermédiaire bloquant.
              </p>
            </Card>

            {/* Feature 4 */}
            <Card className="rounded-3xl border border-[#FDE8CD] bg-[#FFFBF5] p-7 shadow-xs space-y-4 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#0284C7] text-white flex items-center justify-center font-bold shadow-md shadow-[#0284C7]/20">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-[#1C1917] font-heading">
                Gestion des Stocks & Plats Épuisés
              </h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Une rupture sur le poisson ou le poulet ? Marquez le plat comme « Épuisé » en 1 seconde depuis votre téléphone gérant pour éviter les déceptions clients.
              </p>
            </Card>

            {/* Feature 5 */}
            <Card className="rounded-3xl border border-[#FDE8CD] bg-[#FFFBF5] p-7 shadow-xs space-y-4 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#7C3AED] text-white flex items-center justify-center font-bold shadow-md shadow-[#7C3AED]/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-[#1C1917] font-heading">
                Studio Photos Culinaires par IA
              </h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Vous n&apos;avez pas de photos professionnelles ? Notre intelligence artificielle génère des visuels culinaires réalistes et ultra-appétissants pour vos spécialités.
              </p>
            </Card>

            {/* Feature 6 */}
            <Card className="rounded-3xl border border-[#FDE8CD] bg-[#FFFBF5] p-7 shadow-xs space-y-4 hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-[#EA580C] text-white flex items-center justify-center font-bold shadow-md shadow-[#EA580C]/20">
                <Printer className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold text-[#1C1917] font-heading">
                Chevalets & Supports Prêts à Imprimer
              </h3>
              <p className="text-xs text-[#78716C] leading-relaxed">
                Générez des fiches chevalets PDF haute résolution personnalisées avec votre logo et vos numéros de table, prêtes à être posées directement sur vos tables.
              </p>
            </Card>

          </div>

        </div>
      </section>

      {/* 🧪 5. INTERACTIVE LIVE SIMULATOR: TRY IT LIVE */}
      <section id="demo-live" className="py-20 sm:py-28 bg-[#FFFBF5]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <Badge className="bg-[#16A34A]/10 text-[#16A34A] border-none px-4 py-1 text-xs font-black uppercase tracking-wider rounded-full">
              ⚡ Démonstration Interactive
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1C1917] font-heading tracking-tight">
              Testez la commande en direct maintenant
            </h2>
            <p className="text-xs sm:text-sm text-[#78716C]">
              Ajoutez des articles au panier et simulez l&apos;envoi instantané de la commande vers la cuisine.
            </p>
          </div>

          <Card className="rounded-3xl border-2 border-[#EA580C]/30 bg-white p-6 sm:p-8 shadow-xl relative overflow-hidden">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              
              {/* Simulator Left: Order Cart */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#FDE8CD]">
                  <span className="text-xs font-black text-[#1C1917] uppercase tracking-wide">
                    Panier Client ({simTableNum})
                  </span>
                  <span className="text-[11px] text-[#16A34A] font-bold">● Menu Démo Actif</span>
                </div>

                <div className="space-y-3">
                  {simCart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-[#FFFBF5] rounded-2xl border border-[#FDE8CD]">
                      <div className="flex items-center gap-3">
                        <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover" />
                        <div>
                          <h5 className="font-extrabold text-xs text-[#1C1917]">{item.name}</h5>
                          <span className="text-xs font-black text-[#EA580C] font-mono">{formatXOF(item.price)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSimReduceQuantity(item.id)}
                          className="w-7 h-7 rounded-lg bg-white border border-[#FDE8CD] text-xs font-bold hover:bg-[#FFF7ED]"
                        >
                          -
                        </button>
                        <span className="font-mono font-bold text-xs">{item.qty}</span>
                        <button
                          onClick={() => handleSimAddQuantity(item.id)}
                          className="w-7 h-7 rounded-lg bg-white border border-[#FDE8CD] text-xs font-bold hover:bg-[#FFF7ED]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between font-extrabold text-sm border-t border-[#FDE8CD]">
                  <span>Total à payer :</span>
                  <span className="text-lg font-black text-[#EA580C] font-mono">{formatXOF(simTotal)}</span>
                </div>

                <Button
                  onClick={handleSimulateOrder}
                  className="w-full h-12 bg-[#EA580C] hover:bg-[#C2410C] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-[#EA580C]/25 transition-all hover:scale-[1.01]"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  <span>Simuler le passage de commande</span>
                </Button>
              </div>

              {/* Simulator Right: Result / Notification */}
              <div className="bg-[#FFF7ED] rounded-3xl p-6 border border-[#FDE8CD] space-y-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white border border-[#FDE8CD] text-[#EA580C] flex items-center justify-center mx-auto shadow-sm">
                  <Receipt className="w-8 h-8" />
                </div>
                
                {simOrderPlaced ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="space-y-2"
                  >
                    <Badge className="bg-[#16A34A] text-white font-black text-xs px-3 py-1">
                      ✅ Commande Reçue en Cuisine !
                    </Badge>
                    <h4 className="font-extrabold text-base text-[#1C1917]">Ticket #CMD-SIMU validé</h4>
                    <p className="text-xs text-[#78716C]">
                      La cuisine prépare actuellement la commande pour la <strong>{simTableNum}</strong>. Les montants ont été crédités sans délai.
                    </p>
                  </motion.div>
                ) : (
                  <div className="space-y-2">
                    <h4 className="font-extrabold text-base text-[#1C1917]">Prêt pour l&apos;expérience ?</h4>
                    <p className="text-xs text-[#78716C] leading-relaxed">
                      Cliquez sur le bouton pour tester l&apos;envoi instantané vers le KDS cuisine et l&apos;alerte sonore.
                    </p>
                  </div>
                )}

                <div className="pt-2">
                  <Link
                    href="/le-jardin-savoureux"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#EA580C] hover:underline"
                  >
                    <span>Ouvrir l&apos;application démo complète</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

              </div>

            </div>

          </Card>

        </div>
      </section>

      {/* 💰 6. PRICING SECTION: SIMPLE, TRANSPARENT & ACCESSIBLE */}
      <section id="pricing" className="py-20 sm:py-28 bg-white border-y border-[#FDE8CD]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <Badge className="bg-[#FFF7ED] text-[#EA580C] border border-[#FDE8CD] px-4 py-1 text-xs font-black uppercase tracking-wider rounded-full">
              Tarification Transparente
            </Badge>
            <h2 className="text-3xl sm:text-5xl font-black text-[#1C1917] font-heading tracking-tight">
              Un tarif unique, accessible à tous les restaurants
            </h2>
            <p className="text-base text-[#78716C]">
              Pas de pourcentage prélevé sur votre chiffre d&apos;affaires. Vous gardez 100% de vos gains.
            </p>

            {/* Toggle Billing Cycle */}
            <div className="pt-4 flex items-center justify-center gap-3">
              <span className={cn("text-xs font-extrabold", !isAnnual ? "text-[#1C1917]" : "text-[#78716C]")}>
                Facturation Mensuelle
              </span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className="w-14 h-8 bg-[#1C1917] rounded-full p-1 transition-colors relative"
                aria-label="Changer période de facturation"
              >
                <div
                  className={cn(
                    "w-6 h-6 rounded-full bg-[#EA580C] transition-transform",
                    isAnnual ? "translate-x-6" : "translate-x-0"
                  )}
                />
              </button>
              <div className="flex items-center gap-1.5">
                <span className={cn("text-xs font-extrabold", isAnnual ? "text-[#1C1917]" : "text-[#78716C]")}>
                  Facturation Annuelle
                </span>
                <Badge className="bg-[#16A34A] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  -20% Réduction
                </Badge>
              </div>
            </div>

          </div>

          {/* Pricing Card */}
          <div className="max-w-lg mx-auto">
            <Card className="rounded-[32px] border-2 border-[#EA580C] bg-[#FFFBF5] p-8 sm:p-10 shadow-2xl relative overflow-hidden">
              
              <div className="absolute top-0 right-0 bg-[#EA580C] text-white text-[10px] font-black uppercase tracking-wider px-4 py-1.5 rounded-bl-2xl">
                Formule Illimitée Pro
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-[#1C1917] font-heading">
                    Zagoor Resto Pro
                  </h3>
                  <p className="text-xs text-[#78716C] mt-1">
                    Idéal pour restaurants, maquis, lounges, bars et dark kitchens.
                  </p>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-[#EA580C] font-mono tracking-tight">
                    {isAnnual ? '54 000' : '5 500'}
                  </span>
                  <span className="text-sm font-extrabold text-[#78716C]">
                    FCFA {isAnnual ? '/ an (soit 4 500 F/mois)' : '/ mois'}
                  </span>
                </div>

                {/* Features list */}
                <div className="space-y-3 pt-2 text-xs font-bold text-[#1C1917]">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                    <span>Menu digital QR Code personnalisé à votre nom</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                    <span>Tables QR codes illimitées avec chevalets PDF HD</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                    <span>Écran cuisine KDS en direct & alertes commandes</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                    <span>Paiements Mobile Money intégrés (Wave, MoMo, Flooz)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                    <span>Studio photo culinaire par IA illimité</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                    <span>Gestion des stocks & plats épuisés en 1 clic</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                    <span>0% de commission sur l&apos;ensemble de vos ventes</span>
                  </div>
                </div>

                <div className="pt-4">
                  <Link
                    href="/souscrire"
                    className="w-full inline-flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-[#EA580C] hover:bg-[#C2410C] text-white font-extrabold text-base shadow-xl shadow-[#EA580C]/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Souscrire & Débloquer mon Restaurant</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                <p className="text-[11px] text-center text-[#78716C]">
                  Activation instantanée • Paiement sécurisé via Wave, MoMo ou Carte
                </p>

              </div>

            </Card>
          </div>

        </div>
      </section>

      {/* 💬 7. REVIEWS & TESTIMONIALS SECTION */}
      <section id="reviews" className="py-20 sm:py-28 bg-[#FFFBF5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <Badge className="bg-[#FFF7ED] text-[#EA580C] border border-[#FDE8CD] px-4 py-1 text-xs font-black uppercase tracking-wider rounded-full">
                Témoignages Partenaires
              </Badge>
              <h2 className="text-3xl sm:text-5xl font-black text-[#1C1917] font-heading tracking-tight">
                Ce que disent les restaurateurs qui l&apos;utilisent
              </h2>
            </div>

            <Button
              onClick={() => setShowReviewModal(true)}
              className="bg-white hover:bg-[#FFF7ED] text-[#EA580C] border border-[#FDE8CD] rounded-2xl font-bold text-xs h-11 px-5 shadow-xs"
            >
              <MessageSquarePlus className="w-4 h-4 mr-1.5" />
              <span>Laisser un avis restaurateur</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reviewsList.map((rev) => (
              <Card key={rev.id} className="rounded-3xl border border-[#FDE8CD] bg-white p-6 shadow-xs space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-[#EA580C]">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs text-[#1C1917] leading-relaxed italic">
                    « {rev.comment} »
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-[#FDE8CD]/70">
                  <img
                    src={rev.avatar || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=120&h=120&fit=crop'}
                    alt={rev.authorName}
                    className="w-10 h-10 rounded-full object-cover border border-[#FDE8CD]"
                  />
                  <div>
                    <h5 className="font-extrabold text-xs text-[#1C1917]">{rev.authorName}</h5>
                    <p className="text-[10px] text-[#78716C] font-semibold">{rev.restaurantName}</p>
                    {rev.city && <p className="text-[9px] text-[#EA580C]">{rev.city}</p>}
                  </div>
                </div>
              </Card>
            ))}
          </div>

        </div>
      </section>

      {/* ❓ 8. FAQ ACCORDION SECTION */}
      <section id="faq" className="py-20 sm:py-28 bg-white border-y border-[#FDE8CD]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center space-y-3">
            <Badge className="bg-[#FFF7ED] text-[#EA580C] border border-[#FDE8CD] px-4 py-1 text-xs font-black uppercase tracking-wider rounded-full">
              Questions Fréquentes
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-black text-[#1C1917] font-heading tracking-tight">
              Tout ce que vous devez savoir avant de commencer
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Faut-il du matériel ou des tablettes spécifiques pour faire tourner Zagoor ?",
                a: "Non, aucun matériel coûteux n'est requis ! Zagoor fonctionne sur n'importe quel smartphone (Android ou iPhone), tablette ou ordinateur que vous possédez déjà."
              },
              {
                q: "Mes clients doivent-ils télécharger une application mobile ?",
                a: "Absolument pas. Le client scanne simplement le QR Code posé sur sa table avec l'appareil photo de son smartphone et votre menu s'ouvre instantanément dans son navigateur web en moins d'une seconde."
              },
              {
                q: "Comment fonctionne le règlement des commandes par les clients ?",
                a: "Les clients peuvent payer directement en ligne via Wave, MTN MoMo, Orange Money, Moov Flooz ou Carte Bancaire, ou bien sélectionner le paiement en espèces à la table auprès du serveur."
              },
              {
                q: "Y a-t-il des commissions prélevées sur mes ventes de plats ?",
                a: "Non ! Zagoor applique une politique de 0% de commission. Votre abonnement fixe (5 500 FCFA/mois) couvre l'intégralité du service sans aucun frais masqué."
              },
              {
                q: "Puis-je modifier mes prix et ajouter des plats en cours de journée ?",
                a: "Oui, en temps réel depuis votre cockpit gérant sur votre téléphone. Dès que vous changez un prix ou marquez un plat comme épuisé, la mise à jour est immédiate pour vos clients."
              }
            ].map((faq, idx) => (
              <div
                key={idx}
                className="border border-[#FDE8CD] rounded-2xl bg-[#FFFBF5] overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full p-5 text-left font-extrabold text-sm text-[#1C1917] flex items-center justify-between gap-4"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={cn("w-4 h-4 text-[#EA580C] transition-transform", openFaqIndex === idx && "rotate-180")} />
                </button>
                <AnimatePresence>
                  {openFaqIndex === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-5 pb-5 text-xs text-[#78716C] leading-relaxed border-t border-[#FDE8CD]/40 pt-3"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 🚀 9. FINAL HIGH-CONVERTING CALL TO ACTION */}
      <section className="py-20 sm:py-28 bg-[#1C1917] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-noise pointer-events-none" />
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 relative z-10">
          
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#EA580C] to-[#C2410C] flex items-center justify-center mx-auto shadow-2xl shadow-[#EA580C]/40">
            <ChefHat className="w-8 h-8 text-white" />
          </div>

          <div className="space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-black text-white font-heading tracking-tight leading-tight">
              Rejoignez les meilleurs restaurants modernes d&apos;Afrique dès aujourd&apos;hui.
            </h2>
            <p className="text-sm sm:text-base text-[#A8A29E]">
              Débloquez votre restaurant en 10 minutes pour seulement 5 500 FCFA/mois. Vos tables QR seront prêtes immédiatement.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/souscrire"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-9 py-4.5 rounded-2xl bg-[#EA580C] hover:bg-[#C2410C] text-white font-extrabold text-base shadow-xl shadow-[#EA580C]/30 transition-all hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-5 h-5" />
              <span>Activer mon Restaurant Maintenant</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <a
              href="https://wa.me/22997123456?text=Bonjour%20Zagoor,%20je%20souhaite%20des%20renseignements%20sur%20la%20solution%20pour%20mon%20restaurant."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4.5 rounded-2xl bg-[#292524] hover:bg-[#44403C] text-white border border-[#44403C] font-bold text-sm transition-all"
            >
              <MessageCircle className="w-4 h-4 text-[#16A34A]" />
              <span>Discuter sur WhatsApp</span>
            </a>
          </div>

        </div>
      </section>

      {/* 🧭 10. FOOTER */}
      <footer className="bg-[#141211] text-[#A8A29E] py-14 px-4 sm:px-6 lg:px-8 text-xs border-t border-[#292524]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-[#292524]">
          
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EA580C] text-white flex items-center justify-center font-bold">
                <ChefHat className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg text-white font-heading">
                Zagoor <span className="text-[#EA580C]">RestoSaas</span>
              </span>
            </div>
            <p className="text-xs text-[#78716C] max-w-sm leading-relaxed">
              La plateforme tout-en-un de menus digitaux QR Code, encaissement Mobile Money et gestion de cuisine pour les restaurateurs d&apos;Afrique et du monde.
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-white uppercase tracking-wider text-[11px]">Accès Rapides</h5>
            <div className="flex flex-col gap-2">
              <Link href="/souscrire" className="hover:text-white transition-colors">Souscrire au SaaS</Link>
              <Link href="/le-jardin-savoureux" className="hover:text-white transition-colors">Menu Démo (/jardin)</Link>
              <Link href="/admin" className="hover:text-white transition-colors">Cockpit Gérant (/admin)</Link>
              <Link href="/admin/super-admin" className="hover:text-white transition-colors text-amber-400 font-bold">👑 Espace Fondateur SaaS</Link>
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-white uppercase tracking-wider text-[11px]">Support & Sécurité</h5>
            <div className="flex flex-col gap-2">
              <span>Support WhatsApp 7j/7</span>
              <span>Paiements Chiffrés SSL 256 bits</span>
              <span className="text-[#16A34A] font-bold">● Serveurs Opérationnels (100%)</span>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#78716C]">
          <span>© {new Date().getFullYear()} Zagoor RestoSaas. Tous droits réservés.</span>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:underline">Conditions d&apos;utilisation</Link>
            <Link href="/" className="hover:underline">Confidentialité</Link>
          </div>
        </div>
      </footer>

      {/* ✍️ Modal : Déposer un Avis Restaurateur */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border border-[#FDE8CD] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#FDE8CD]">
              <h4 className="font-black text-base text-[#1C1917]">Laisser un avis restaurateur</h4>
              <button onClick={() => setShowReviewModal(false)} className="text-[#78716C] hover:text-[#1C1917]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Votre Nom & Prénom *</label>
                <input
                  required
                  value={reviewAuthor}
                  onChange={(e) => setReviewAuthor(e.target.value)}
                  placeholder="Ex: Chef Koffi"
                  className="w-full p-2.5 bg-[#FFFBF5] border border-[#FDE8CD] rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">Nom de votre Restaurant *</label>
                <input
                  required
                  value={reviewRestaurant}
                  onChange={(e) => setReviewRestaurant(e.target.value)}
                  placeholder="Ex: Le Grill Teranga"
                  className="w-full p-2.5 bg-[#FFFBF5] border border-[#FDE8CD] rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">Votre Rôle</label>
                  <input
                    value={reviewRole}
                    onChange={(e) => setReviewRole(e.target.value)}
                    placeholder="Ex: Chef Propriétaire"
                    className="w-full p-2.5 bg-[#FFFBF5] border border-[#FDE8CD] rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Ville, Pays</label>
                  <input
                    value={reviewCity}
                    onChange={(e) => setReviewCity(e.target.value)}
                    placeholder="Ex: Cotonou, Bénin"
                    className="w-full p-2.5 bg-[#FFFBF5] border border-[#FDE8CD] rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Votre Note</label>
                <div className="flex gap-2 text-[#EA580C]">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setReviewRating(s)}
                      className="p-1"
                    >
                      <Star className={cn("w-5 h-5", s <= reviewRating ? "fill-current" : "text-gray-300")} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Votre Témoignage *</label>
                <textarea
                  required
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Racontez votre expérience avec Zagoor..."
                  className="w-full p-2.5 bg-[#FFFBF5] border border-[#FDE8CD] rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowReviewModal(false)}
                  className="border-[#FDE8CD] rounded-xl text-xs font-bold"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl text-xs font-bold px-5"
                >
                  {reviewSubmitting ? 'Publication...' : 'Publier mon avis'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
