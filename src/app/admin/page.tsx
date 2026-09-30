'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChefHat, Package, QrCode, BarChart3, Settings,
  UtensilsCrossed, ShoppingCart, Plus, Minus, Clock,
  CheckCircle, MapPin, Phone, Heart, Flame, Star,
  Menu, X, Check, CreditCard, TrendingUp, Users,
  DollarSign, RefreshCw, Eye, Bell, Search, Filter,
  Edit, Trash2, Save, Image as ImageIcon, Upload,
  Sparkles, Loader2, LogIn, LogOut, Lock, User as UserIcon,
  Mail, Key, Navigation, MapPinned, Timer, Receipt,
  MessageCircle, AlertCircle, Truck, Store, Home,
  ClipboardList, Crown, ArrowRight, ArrowLeft, Building2,
  Printer, ExternalLink, Share2, HelpCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useAuthStore } from '@/lib/store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Types
interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image: string | null
  isAvailable: boolean
  isFeatured: boolean
  preparationTime: number | null
  calories: number | null
  categoryId: string
  categoryName?: string
  categoryIcon?: string
}

interface Category {
  id: string
  name: string
  icon: string | null
  description: string | null
  products: Product[]
}

interface Restaurant {
  id: string
  name: string
  slug: string
  description: string | null
  logo: string | null
  banner: string | null
  address: string | null
  phone: string | null
  email?: string | null
  currency: string
  taxRate: number
  serviceType?: string | null
  orderModes?: string | null
  categories: Category[]
  tables: { id: string; number: string; isActive?: boolean }[]
}

interface Order {
  id: string
  orderNumber: string
  status: string
  type?: string
  paymentStatus: string
  paymentMethod: string | null
  customerName: string | null
  customerPhone?: string | null
  tableNumber: string | null
  total: number
  createdAt: string
  items: { product: { name: string; image?: string | null }; quantity: number; price: number }[]
}

interface DashboardStats {
  overview: {
    totalOrders: number
    todayOrders: number
    todayRevenue: number
    monthlyRevenue: number
    revenueGrowth: number
    orderGrowth: number
  }
  ordersByStatus: { status: string; _count: number }[]
  topProducts: { id: string; name: string; count: number; revenue: number }[]
  recentOrders: Order[]
  dailyRevenue: { date: string; revenue: number; orders: number }[]
}

interface ProductForm {
  name: string
  description: string
  price: string
  image: string
  categoryId: string
  isAvailable: boolean
  isFeatured: boolean
  preparationTime: string
  calories: string
}

const emptyProductForm: ProductForm = {
  name: '',
  description: '',
  price: '',
  image: '',
  categoryId: '',
  isAvailable: true,
  isFeatured: false,
  preparationTime: '15',
  calories: '',
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-300',
  confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
  preparing: 'bg-orange-100 text-orange-800 border-orange-300',
  ready: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  delivered: 'bg-teal-100 text-teal-800 border-teal-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
}

const statusLabels: Record<string, string> = {
  pending: '⏳ En attente',
  confirmed: '👍 Confirmée',
  preparing: '🍳 En cuisine',
  ready: '🍽️ Prête',
  delivered: '✅ Livrée / Servie',
  cancelled: '❌ Annulée',
}

function formatCurrency(amount: number, currency = 'XOF') {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function AdminPage() {
  const { user, isAuthenticated, login, logout } = useAuthStore()

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Restaurant & Data state
  const [restaurantsList, setRestaurantsList] = useState<{ id: string; name: string; slug: string }[]>([])
  const [selectedRestaurantSlug, setSelectedRestaurantSlug] = useState<string>('le-jardin-savoureux')
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [dashboardTab, setDashboardTab] = useState('orders')

  // Dashboard state
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersFilter, setOrdersFilter] = useState('all')
  const [ordersSearchQuery, setOrdersSearchQuery] = useState('')
  const [productCategoryFilter, setProductCategoryFilter] = useState('all')

  // Modals & form state
  const [selectedTableForQr, setSelectedTableForQr] = useState<{ id: string; number: string } | null>(null)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm)
  const [isEditing, setIsEditing] = useState(false)
  const [currentEditingProductId, setCurrentEditingProductId] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Settings state
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
    description: '',
    taxRate: '18',
    currency: 'XOF',
    serviceType: 'both',
  })
  const [savingSettings, setSavingSettings] = useState(false)

  // Fetch list of restaurants
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const res = await fetch('/api/restaurants')
        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
          setRestaurantsList(data.map(r => ({ id: r.id, name: r.name, slug: r.slug })))
        } else {
          setRestaurantsList([{ id: 'demo', name: 'Le Jardin Savoureux', slug: 'le-jardin-savoureux' }])
        }
      } catch (e) {
        console.error(e)
      }
    }
    fetchRestaurants()
  }, [])

  // Fetch current restaurant data and orders
  const fetchRestaurantData = async () => {
    setLoading(true)
    try {
      let res = await fetch(`/api/restaurants?slug=${encodeURIComponent(selectedRestaurantSlug)}`)
      let data = await res.json()

      if (!res.ok || !data?.id) {
        await fetch('/api/seed')
        res = await fetch(`/api/restaurants?slug=${encodeURIComponent(selectedRestaurantSlug)}`)
        data = await res.json()
      }

      if (data?.id) {
        setRestaurant(data)
        setSettingsForm({
          name: data.name || '',
          phone: data.phone || '',
          address: data.address || '',
          email: data.email || '',
          description: data.description || '',
          taxRate: ((data.taxRate || 0.18) * 100).toString(),
          currency: data.currency || 'XOF',
          serviceType: data.serviceType || 'both',
        })

        // Fetch dashboard stats & orders
        const statsRes = await fetch(`/api/dashboard?restaurantId=${data.id}`)
        if (statsRes.ok) {
          const stats = await statsRes.json()
          setDashboardData(stats)
          if (stats.recentOrders) {
            setOrders(stats.recentOrders)
          }
        }
      }
    } catch (e) {
      console.error(e)
      toast.error('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchRestaurantData()
    }
  }, [selectedRestaurantSlug, isAuthenticated])

  // Login handler
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!loginEmail || !loginPassword) {
      toast.error('Veuillez renseigner votre email et mot de passe')
      return
    }

    setLoginLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        login(data.user)
        toast.success(`Bienvenue, ${data.user.name || 'Gérant'} !`)
      } else {
        toast.error(data.error || 'Email ou mot de passe incorrect')
      }
    } catch (error) {
      toast.error('Erreur de connexion au serveur')
    } finally {
      setLoginLoading(false)
    }
  }

  const fillDemoCredentials = () => {
    setLoginEmail('admin@restaurant.com')
    setLoginPassword('admin123')
    toast.info('Identifiants démo insérés')
  }

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      })

      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
        toast.success(`Commande mise à jour : ${statusLabels[newStatus] || newStatus}`)
      } else {
        toast.error('Erreur lors de la mise à jour de la commande')
      }
    } catch (e) {
      toast.error('Erreur de communication avec le serveur')
    }
  }

  // Toggle dish stock availability
  const toggleProductAvailability = async (productId: string, currentStatus: boolean) => {
    setRestaurant(prev => {
      if (!prev) return prev
      return {
        ...prev,
        categories: prev.categories.map(cat => ({
          ...cat,
          products: cat.products.map(p => p.id === productId ? { ...p, isAvailable: !currentStatus } : p)
        }))
      }
    })

    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, isAvailable: !currentStatus })
      })
      if (res.ok) {
        toast.success(!currentStatus ? 'Plat activé (Disponible)' : 'Plat marqué comme Épuisé')
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Flatten all products
  const allProducts: Product[] = restaurant?.categories.flatMap(cat =>
    cat.products.map(p => ({
      ...p,
      categoryName: cat.name,
      categoryIcon: cat.icon || '🍽️'
    }))
  ) || []

  // Add / Edit Product Handlers
  const openAddProduct = () => {
    setIsEditing(false)
    setCurrentEditingProductId(null)
    setProductForm({
      ...emptyProductForm,
      categoryId: restaurant?.categories[0]?.id || ''
    })
    setProductModalOpen(true)
  }

  const openEditProduct = (product: Product) => {
    setIsEditing(true)
    setCurrentEditingProductId(product.id)
    setProductForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      image: product.image || '',
      categoryId: product.categoryId,
      isAvailable: product.isAvailable,
      isFeatured: product.isFeatured,
      preparationTime: product.preparationTime?.toString() || '15',
      calories: product.calories?.toString() || '',
    })
    setProductModalOpen(true)
  }

  const saveProduct = async () => {
    if (!productForm.name.trim() || !productForm.price || !productForm.categoryId) {
      toast.error('Veuillez remplir les champs obligatoires (Nom, Prix, Catégorie)')
      return
    }

    try {
      const payload = {
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        image: productForm.image || null,
        categoryId: productForm.categoryId,
        isAvailable: productForm.isAvailable,
        isFeatured: productForm.isFeatured,
        preparationTime: productForm.preparationTime ? parseInt(productForm.preparationTime) : null,
        calories: productForm.calories ? parseInt(productForm.calories) : null,
      }

      if (isEditing && currentEditingProductId) {
        const res = await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: currentEditingProductId, ...payload }),
        })
        if (res.ok) {
          toast.success('Plat modifié avec succès !')
          fetchRestaurantData()
          setProductModalOpen(false)
        }
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          toast.success('Nouveau plat ajouté à la carte !')
          fetchRestaurantData()
          setProductModalOpen(false)
        }
      }
    } catch (e) {
      toast.error('Erreur lors de la sauvegarde du plat')
    }
  }

  const deleteProduct = async (productId: string) => {
    try {
      const res = await fetch(`/api/products?id=${productId}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Plat supprimé de la carte')
        fetchRestaurantData()
      }
    } catch (e) {
      toast.error('Erreur lors de la suppression')
    }
  }

  // AI Image generation
  const generateAIImage = async () => {
    if (!productForm.name) {
      toast.error('Veuillez d’abord renseigner le nom du plat')
      return
    }
    setAiGenerating(true)
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `Delicious African gourmet dish: ${productForm.name}. Professional food photography, top restaurant presentation.` })
      })
      const data = await res.json()
      if (data.image) {
        setProductForm(prev => ({ ...prev, image: data.image }))
        toast.success('Photo culinaire générée par IA !')
      }
    } catch (e) {
      toast.error('Erreur de génération d’image')
    } finally {
      setAiGenerating(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageUploading(true)
      const reader = new FileReader()
      reader.onloadend = () => {
        setProductForm(prev => ({ ...prev, image: reader.result as string }))
        setImageUploading(false)
        toast.success('Image téléchargée avec succès')
      }
      reader.readAsDataURL(file)
    }
  }

  // Save Settings
  const saveSettings = async () => {
    if (!restaurant?.id) return
    setSavingSettings(true)
    try {
      const res = await fetch('/api/restaurants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: restaurant.id,
          name: settingsForm.name,
          phone: settingsForm.phone,
          address: settingsForm.address,
          email: settingsForm.email,
          description: settingsForm.description,
          taxRate: parseFloat(settingsForm.taxRate) / 100,
          currency: settingsForm.currency,
          serviceType: settingsForm.serviceType,
        }),
      })

      if (res.ok) {
        toast.success('Paramètres du restaurant enregistrés avec succès !')
        fetchRestaurantData()
      } else {
        toast.error('Erreur lors de l’enregistrement des paramètres')
      }
    } catch (e) {
      toast.error('Erreur de communication avec le serveur')
    } finally {
      setSavingSettings(false)
    }
  }

  // 1. UNAUTHENTICATED VIEW -> DEDICATED LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFFBF5] via-white to-[#FFF7ED] flex flex-col justify-between p-4 sm:p-6 bg-noise">
        {/* Top Minimal Bar */}
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between py-2">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#EA580C] text-white flex items-center justify-center font-bold shadow-md shadow-[#EA580C]/20">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-[#1C1917] font-heading block leading-tight">
                RestoSaas <span className="text-[#EA580C]">Pro</span>
              </span>
              <span className="text-[10px] text-[#78716C] font-semibold">Espace Gestion Restauration</span>
            </div>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#78716C] hover:text-[#EA580C] bg-white border border-[#FDE8CD] px-3.5 py-2 rounded-xl transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour au site</span>
          </Link>
        </div>

        {/* Login Box */}
        <div className="max-w-md mx-auto w-full my-auto py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-2 border-[#FDE8CD] rounded-3xl p-6 sm:p-8 shadow-xl shadow-[#EA580C]/5 space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-3xl bg-[#FFF7ED] border-2 border-[#FDE8CD] text-[#EA580C] flex items-center justify-center mx-auto shadow-xs">
                <Lock className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-black text-[#1C1917] font-heading">
                Connexion Cockpit Gérant
              </h1>
              <p className="text-xs text-[#78716C]">
                Accédez à vos commandes en temps réel, écran cuisine KDS, gestion des stocks et chevalets QR Code.
              </p>
            </div>

            {/* Demo Helper Banner */}
            <div className="p-3.5 bg-[#FFF7ED] border border-[#EA580C]/30 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#EA580C] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Mode Démo Essai
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={fillDemoCredentials}
                  className="h-6 px-2.5 text-[10px] font-extrabold bg-white border-[#EA580C]/40 text-[#EA580C] hover:bg-[#EA580C] hover:text-white rounded-lg transition-colors"
                >
                  Remplir automatiquement
                </Button>
              </div>
              <div className="text-[11px] font-mono text-[#78716C] space-y-0.5">
                <div>Email : <span className="font-bold text-[#1C1917]">admin@restaurant.com</span></div>
                <div>Pass : <span className="font-bold text-[#1C1917]">admin123</span></div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="admin-email" className="text-xs font-bold text-[#1C1917]">Email Gérant / Admin</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@restaurant.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="pl-10 h-11 bg-[#FFFBF5] border-[#FDE8CD] rounded-xl text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="admin-password" className="text-xs font-bold text-[#1C1917]">Mot de passe</Label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
                  <Input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 bg-[#FFFBF5] border-[#FDE8CD] rounded-xl text-xs font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917]"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loginLoading}
                className="w-full h-12 bg-[#EA580C] hover:bg-[#C2410C] text-white font-extrabold text-sm rounded-2xl shadow-md shadow-[#EA580C]/20 transition-all hover:scale-[1.01]"
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Ouvrir le Cockpit RestoSaas
                  </>
                )}
              </Button>

              <div className="pt-2 text-center">
                <Link
                  href="/admin/super-admin"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#EA580C] hover:underline"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Vous êtes le créateur du SaaS ? Accéder au Cockpit Fondateur</span>
                </Link>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="max-w-7xl mx-auto w-full text-center py-2 text-xs text-[#78716C]">
          © {new Date().getFullYear()} RestoSaas Pro • Solution Digitale pour Restaurants Africains
        </div>
      </div>
    )
  }

  // 2. AUTHENTICATED EXECUTIVE ADMIN COCKPIT
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFBF5] via-white to-[#FFF7ED] flex flex-col bg-noise">
      {/* Executive Admin Top Header */}
      <header className="sticky top-0 z-50 bg-[#1C1917] text-white border-b border-[#292524] shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Left: Branding & Restaurant Selector */}
            <div className="flex items-center gap-4">
              <Link href="/admin" className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#EA580C] text-white flex items-center justify-center font-bold shadow-md shadow-[#EA580C]/30 flex-shrink-0">
                  <ChefHat className="w-6 h-6" />
                </div>
                <div className="hidden sm:block">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base text-white font-heading">
                      RestoSaas <span className="text-[#EA580C]">Cockpit</span>
                    </span>
                    <Badge className="bg-[#16A34A] text-white text-[10px] font-bold px-2 py-0.2 border-0 rounded-full">
                      En Ligne
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[#A8A29E]">Espace d&apos;Administration Gérant</p>
                </div>
              </Link>

              {/* Restaurant Switcher */}
              <div className="pl-2 sm:pl-4 border-l border-[#292524]">
                <Select
                  value={selectedRestaurantSlug}
                  onValueChange={(val) => setSelectedRestaurantSlug(val)}
                >
                  <SelectTrigger className="w-44 sm:w-56 h-9 bg-white/10 hover:bg-white/15 border-[#44403C] text-white rounded-xl text-xs font-bold">
                    <Store className="w-3.5 h-3.5 text-[#EA580C] mr-1" />
                    <SelectValue placeholder="Changer de restaurant" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1C1917] border-[#44403C] text-white rounded-2xl">
                    {restaurantsList.map((r) => (
                      <SelectItem key={r.slug} value={r.slug} className="text-xs font-bold focus:bg-[#EA580C] focus:text-white">
                        🍽️ {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right: Quick actions & User */}
            <div className="flex items-center gap-2.5">
              {/* Founder SaaS Cockpit Link */}
              <Link
                href="/admin/super-admin"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#EA580C] to-[#C2410C] hover:from-[#C2410C] hover:to-[#9A3412] text-white text-xs font-extrabold shadow-md shadow-[#EA580C]/25 transition-all hover:scale-105 border border-[#EA580C]/40"
                title="Accéder au Cockpit Fondateur / Super Admin"
              >
                <Crown className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span className="hidden sm:inline">Espace Fondateur SaaS</span>
                <span className="sm:hidden">Fondateur</span>
              </Link>

              {/* Direct Link to Live Customer Menu */}
              <Link
                href={`/${restaurant?.slug || selectedRestaurantSlug}`}
                target="_blank"
                className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-[#44403C] transition-all"
                title="Ouvrir le menu client dans un nouvel onglet"
              >
                <Eye className="w-3.5 h-3.5 text-[#EA580C]" />
                <span>Voir Menu Client</span>
                <ExternalLink className="w-3 h-3 text-[#A8A29E]" />
              </Link>

              {/* Refresh Button */}
              <Button
                onClick={fetchRestaurantData}
                variant="outline"
                size="sm"
                className="h-9 px-3 border-[#44403C] bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#EA580C]" />
                <span className="hidden sm:inline">Actualiser</span>
              </Button>

              {/* Logout Button */}
              <Button
                onClick={logout}
                variant="ghost"
                size="sm"
                className="h-9 px-3 text-[#A8A29E] hover:text-white hover:bg-red-950/40 rounded-xl text-xs font-bold gap-1.5"
                title="Se déconnecter"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 w-full space-y-6">
        {/* Restaurant Header Banner */}
        <div className="bg-white border-2 border-[#FDE8CD] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#FFF7ED] border-2 border-[#FDE8CD] text-[#EA580C] flex items-center justify-center font-extrabold text-xl flex-shrink-0 shadow-xs">
              {restaurant?.logo ? (
                <img src={restaurant.logo} alt={restaurant.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <UtensilsCrossed className="w-7 h-7" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-[#1C1917] font-heading">
                  {restaurant?.name || 'Restaurant'}
                </h1>
                <Badge className="bg-[#EA580C] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border-0">
                  {restaurant?.serviceType === 'online' ? '🛵 Dark Kitchen' : '🏛️ Restaurant & Tables'}
                </Badge>
              </div>
              <p className="text-xs text-[#78716C] mt-0.5">
                {restaurant?.address || 'Cotonou, Bénin'} • {restaurant?.phone || '+229 97 00 00 00'} • Devise : <strong className="font-mono text-[#1C1917]">{restaurant?.currency || 'XOF'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                const firstTable = restaurant?.tables?.[0] || { id: 't1', number: 'T1' }
                setSelectedTableForQr(firstTable)
                setQrModalOpen(true)
              }}
              className="bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-2xl text-xs font-bold gap-2 px-4 shadow-md shadow-[#EA580C]/20"
            >
              <Printer className="w-4 h-4" />
              <span>Générer Chevalet QR</span>
            </Button>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-2 border-[#FDE8CD] bg-white rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#78716C] uppercase tracking-wider">CA Aujourd&apos;hui</p>
                <p className="text-2xl font-black font-mono text-[#1C1917] mt-1">
                  {formatCurrency(dashboardData?.overview?.todayRevenue || 0, restaurant?.currency)}
                </p>
                <p className="text-[11px] text-[#16A34A] font-bold mt-1">
                  ↑ +{dashboardData?.overview?.revenueGrowth || 14}% vs hier
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#EA580C]/10 text-[#EA580C] flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="border-2 border-[#FDE8CD] bg-white rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Commandes du Jour</p>
                <p className="text-2xl font-black font-mono text-[#1C1917] mt-1">
                  {dashboardData?.overview?.todayOrders || orders.length || 0}
                </p>
                <p className="text-[11px] text-[#78716C] font-semibold mt-1">
                  En direct depuis QR & En ligne
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center flex-shrink-0">
                <ShoppingCart className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="border-2 border-[#FDE8CD] bg-white rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Panier Moyen</p>
                <p className="text-2xl font-black font-mono text-[#1C1917] mt-1">
                  {formatCurrency(
                    (dashboardData?.overview?.todayOrders || 1) > 0
                      ? Math.round((dashboardData?.overview?.todayRevenue || 18500) / Math.max(1, dashboardData?.overview?.todayOrders || 3))
                      : 5500,
                    restaurant?.currency
                  )}
                </p>
                <p className="text-[11px] text-[#16A34A] font-bold mt-1">
                  ⚡ Sans commission intermédiaire
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#0284C7]/10 text-[#0284C7] flex items-center justify-center flex-shrink-0">
                <Receipt className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="border-2 border-[#FDE8CD] bg-white rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Total Ventes Mensuelles</p>
                <p className="text-2xl font-black font-mono text-[#1C1917] mt-1">
                  {formatCurrency(dashboardData?.overview?.monthlyRevenue || 450000, restaurant?.currency)}
                </p>
                <p className="text-[11px] text-[#16A34A] font-bold mt-1">
                  ✨ +{dashboardData?.overview?.orderGrowth || 22}% de croissance
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </div>

        {/* 5 Main Tabs Navigation - Centered */}
        <Tabs value={dashboardTab} onValueChange={setDashboardTab} className="space-y-6">
          <div className="flex items-center justify-center overflow-x-auto pb-1 w-full">
            <TabsList className="bg-white/95 backdrop-blur-md border-2 border-[#FDE8CD] p-1.5 rounded-2xl shadow-sm inline-flex h-auto gap-1.5 mx-auto">
              <TabsTrigger
                value="orders"
                className="gap-2 px-4 py-2.5 rounded-xl text-xs font-bold data-[state=active]:bg-[#EA580C] data-[state=active]:text-white transition-all shadow-none"
              >
                <ChefHat className="w-4 h-4" />
                <span>Commandes & KDS</span>
                {orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] font-black rounded-full bg-amber-400 text-[#1C1917]">
                    {orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length}
                  </span>
                )}
              </TabsTrigger>

              <TabsTrigger
                value="products"
                className="gap-2 px-4 py-2.5 rounded-xl text-xs font-bold data-[state=active]:bg-[#EA580C] data-[state=active]:text-white transition-all shadow-none"
              >
                <Package className="w-4 h-4" />
                <span>Carte & Stock</span>
                <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-[#1C1917]/10 data-[state=active]:bg-white/20">
                  {allProducts.length}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="tables"
                className="gap-2 px-4 py-2.5 rounded-xl text-xs font-bold data-[state=active]:bg-[#EA580C] data-[state=active]:text-white transition-all shadow-none"
              >
                <QrCode className="w-4 h-4" />
                <span>Plan de Tables & QR</span>
                <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-[#1C1917]/10 data-[state=active]:bg-white/20">
                  {restaurant?.tables?.length || 10}
                </span>
              </TabsTrigger>

              <TabsTrigger
                value="analytics"
                className="gap-2 px-4 py-2.5 rounded-xl text-xs font-bold data-[state=active]:bg-[#EA580C] data-[state=active]:text-white transition-all shadow-none"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Analytiques</span>
              </TabsTrigger>

              <TabsTrigger
                value="settings"
                className="gap-2 px-4 py-2.5 rounded-xl text-xs font-bold data-[state=active]:bg-[#EA580C] data-[state=active]:text-white transition-all shadow-none"
              >
                <Settings className="w-4 h-4" />
                <span>Paramètres</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* 1. ORDERS TAB */}
          <TabsContent value="orders" className="space-y-4 outline-none">
            <div className="bg-white border-2 border-[#FDE8CD] rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
                  <Input
                    placeholder="Rechercher par n° commande, nom client, table ou téléphone..."
                    value={ordersSearchQuery}
                    onChange={(e) => setOrdersSearchQuery(e.target.value)}
                    className="pl-10 bg-[#FFFBF5] border-[#FDE8CD] rounded-2xl text-xs h-10"
                  />
                  {ordersSearchQuery && (
                    <button
                      onClick={() => setOrdersSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Select value={ordersFilter} onValueChange={setOrdersFilter}>
                    <SelectTrigger className="w-full sm:w-56 bg-white border-2 border-[#FDE8CD] rounded-2xl text-xs font-bold h-10">
                      <Filter className="w-3.5 h-3.5 text-[#EA580C] mr-1" />
                      <SelectValue placeholder="Filtrer statut" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-[#FDE8CD]">
                      <SelectItem value="all">📋 Toutes ({orders.length})</SelectItem>
                      <SelectItem value="pending">⏳ En attente ({orders.filter(o => o.status === 'pending').length})</SelectItem>
                      <SelectItem value="confirmed">👍 Confirmées ({orders.filter(o => o.status === 'confirmed').length})</SelectItem>
                      <SelectItem value="preparing">🍳 En cuisine ({orders.filter(o => o.status === 'preparing').length})</SelectItem>
                      <SelectItem value="ready">🍽️ Prêtes ({orders.filter(o => o.status === 'ready').length})</SelectItem>
                      <SelectItem value="delivered">✅ Livrées / Servies ({orders.filter(o => o.status === 'delivered').length})</SelectItem>
                      <SelectItem value="cancelled">❌ Annulées ({orders.filter(o => o.status === 'cancelled').length})</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    onClick={fetchRestaurantData}
                    variant="outline"
                    size="sm"
                    className="h-10 px-3 border-2 border-[#FDE8CD] rounded-2xl text-xs font-bold text-[#1C1917] hover:bg-[#FFF7ED]"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#EA580C]" />
                  </Button>
                </div>
              </div>

              {/* Status Badges Toolbar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {[
                  { id: 'all', label: 'Toutes', count: orders.length, color: 'bg-slate-100 text-slate-700' },
                  { id: 'pending', label: '⏳ En attente', count: orders.filter(o => o.status === 'pending').length, color: 'bg-amber-100 text-amber-800' },
                  { id: 'confirmed', label: '👍 Confirmées', count: orders.filter(o => o.status === 'confirmed').length, color: 'bg-blue-100 text-blue-800' },
                  { id: 'preparing', label: '🍳 En cuisine', count: orders.filter(o => o.status === 'preparing').length, color: 'bg-orange-100 text-orange-800' },
                  { id: 'ready', label: '🍽️ Prêtes', count: orders.filter(o => o.status === 'ready').length, color: 'bg-emerald-100 text-emerald-800' },
                  { id: 'delivered', label: '✅ Livrées', count: orders.filter(o => o.status === 'delivered').length, color: 'bg-teal-100 text-teal-800' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setOrdersFilter(item.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5",
                      ordersFilter === item.id
                        ? "bg-[#1C1917] text-white shadow-xs"
                        : "bg-[#FFFBF5] text-[#78716C] hover:bg-[#FFF7ED] border border-[#FDE8CD]"
                    )}
                  >
                    <span>{item.label}</span>
                    <span className={cn("px-1.5 py-0.2 rounded-full text-[10px] font-black", item.color)}>
                      {item.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Orders List */}
              <div className="space-y-3.5 pt-2">
                {orders
                  .filter(o => {
                    const matchesFilter = ordersFilter === 'all' || o.status === ordersFilter
                    if (!matchesFilter) return false
                    if (!ordersSearchQuery.trim()) return true
                    const q = ordersSearchQuery.toLowerCase()
                    return (
                      o.orderNumber.toLowerCase().includes(q) ||
                      (o.customerName && o.customerName.toLowerCase().includes(q)) ||
                      (o.customerPhone && o.customerPhone.includes(q)) ||
                      (o.tableNumber && o.tableNumber.toLowerCase().includes(q))
                    )
                  })
                  .map((order, index) => {
                    const orderMinutesAgo = Math.max(0, Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000))
                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.03 * index }}
                        className={cn(
                          "rounded-2xl p-4 border-2 transition-all shadow-xs",
                          order.status === 'pending'
                            ? "bg-amber-50/40 border-amber-300 shadow-amber-100"
                            : order.status === 'preparing'
                            ? "bg-orange-50/40 border-orange-300 shadow-orange-100"
                            : order.status === 'ready'
                            ? "bg-emerald-50/40 border-emerald-300 shadow-emerald-100"
                            : "bg-[#FFFBF5] border-[#FDE8CD]"
                        )}
                      >
                        {/* Order Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-[#FDE8CD]">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-mono font-extrabold text-sm sm:text-base text-[#1C1917] bg-white px-2.5 py-1 rounded-xl border border-[#FDE8CD]">
                              #{order.orderNumber}
                            </span>

                            <Badge className={cn("border font-bold text-xs px-2.5 py-0.5 rounded-full", statusColors[order.status] || "bg-slate-100 text-slate-800")}>
                              {statusLabels[order.status] || order.status}
                            </Badge>

                            {order.tableNumber ? (
                              <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-[#EA580C] text-white shadow-xs">
                                <UtensilsCrossed className="w-3 h-3" />
                                Table {order.tableNumber}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-white">
                                <Truck className="w-3 h-3" />
                                Livraison / Emporter
                              </span>
                            )}

                            <span className="text-xs text-[#78716C] flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-[#EA580C]" />
                              {orderMinutesAgo === 0 ? 'À l’instant' : `Il y a ${orderMinutesAgo} min`}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-mono font-black text-base sm:text-lg text-[#EA580C]">
                              {formatCurrency(order.total, restaurant?.currency)}
                            </span>
                          </div>
                        </div>

                        {/* Customer & Items Details */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-3 text-xs">
                          {/* Customer info */}
                          <div className="md:col-span-4 space-y-1.5 bg-white/70 p-3 rounded-xl border border-[#FDE8CD]">
                            <p className="font-bold text-[#1C1917] text-sm flex items-center gap-1.5">
                              <UserIcon className="w-3.5 h-3.5 text-[#EA580C]" />
                              {order.customerName || 'Client de passage'}
                            </p>

                            {order.customerPhone && (
                              <div className="flex items-center gap-2 pt-0.5">
                                <span className="font-mono text-[#78716C]">{order.customerPhone}</span>
                                <a
                                  href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-transform hover:scale-105"
                                  title="Contacter sur WhatsApp"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                  WhatsApp
                                </a>
                              </div>
                            )}

                            <div className="pt-1 flex items-center gap-1.5 text-[11px] text-[#78716C]">
                              <CreditCard className="w-3 h-3 text-[#EA580C]" />
                              <span>Paiement : <strong className="text-[#1C1917] capitalize">{order.paymentMethod || 'Mobile Money'}</strong> ({order.paymentStatus === 'paid' ? '✅ Payé' : '⏳ En attente'})</span>
                            </div>
                          </div>

                          {/* Items */}
                          <div className="md:col-span-8 space-y-1.5">
                            <p className="font-bold text-[#78716C] uppercase text-[10px] tracking-wider">
                              Articles commandés ({order.items.reduce((s, it) => s + it.quantity, 0)})
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {order.items.map((item, i) => (
                                <div key={i} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-[#FDE8CD]">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="w-6 h-6 rounded-lg bg-[#EA580C]/10 text-[#EA580C] font-mono font-bold text-xs flex items-center justify-center flex-shrink-0">
                                      {item.quantity}x
                                    </span>
                                    <span className="font-bold text-[#1C1917] text-xs truncate">
                                      {item.product.name}
                                    </span>
                                  </div>
                                  <span className="font-mono font-semibold text-[#78716C] text-xs whitespace-nowrap ml-2">
                                    {formatCurrency(item.price * item.quantity, restaurant?.currency)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#FDE8CD]">
                          <div className="text-[11px] text-[#78716C]">
                            Reçu le {new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {order.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  className="h-8 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl text-xs font-bold gap-1 shadow-xs"
                                  onClick={() => updateOrderStatus(order.id, 'confirmed')}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Accepter</span>
                                </Button>
                                <Button
                                  size="sm"
                                  className="h-8 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl text-xs font-bold gap-1 shadow-xs"
                                  onClick={() => updateOrderStatus(order.id, 'preparing')}
                                >
                                  <ChefHat className="w-3.5 h-3.5" />
                                  <span>En Cuisine</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs font-bold text-red-600 border-red-200 hover:bg-red-50 rounded-xl"
                                  onClick={() => updateOrderStatus(order.id, 'cancelled')}
                                >
                                  <X className="w-3.5 h-3.5 mr-1" />
                                  Refuser
                                </Button>
                              </>
                            )}

                            {order.status === 'confirmed' && (
                              <Button
                                size="sm"
                                className="h-8 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl text-xs font-bold gap-1.5 shadow-xs"
                                onClick={() => updateOrderStatus(order.id, 'preparing')}
                              >
                                <ChefHat className="w-3.5 h-3.5" />
                                <span>Transmettre en Cuisine</span>
                              </Button>
                            )}

                            {order.status === 'preparing' && (
                              <Button
                                size="sm"
                                className="h-8 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl text-xs font-bold gap-1.5 shadow-xs"
                                onClick={() => updateOrderStatus(order.id, 'ready')}
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Plat Prêt pour Service</span>
                              </Button>
                            )}

                            {order.status === 'ready' && (
                              <Button
                                size="sm"
                                className="h-8 bg-[#0284C7] hover:bg-[#0369A1] text-white rounded-xl text-xs font-bold gap-1.5 shadow-xs"
                                onClick={() => updateOrderStatus(order.id, 'delivered')}
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Marquer Livrée / Encaissée</span>
                              </Button>
                            )}

                            {order.status === 'delivered' && (
                              <Badge className="bg-teal-100 text-teal-800 border-teal-200 text-xs py-1 px-3 rounded-xl font-bold">
                                ✨ Service Terminé
                              </Badge>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}

                {orders.length === 0 && (
                  <div className="text-center py-16 bg-[#FFFBF5] rounded-3xl border-2 border-dashed border-[#FDE8CD]">
                    <div className="w-14 h-14 rounded-2xl bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center mx-auto mb-3">
                      <ClipboardList className="w-7 h-7" />
                    </div>
                    <h3 className="font-extrabold text-[#1C1917] text-base">Aucune commande en cours</h3>
                    <p className="text-xs text-[#78716C] mt-1 max-w-sm mx-auto">
                      Les commandes passées par vos clients depuis les QR Codes de table ou le menu en ligne s&apos;afficheront ici en direct.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* 2. PRODUCTS & STOCK TAB */}
          <TabsContent value="products" className="space-y-4 outline-none">
            <div className="bg-white border-2 border-[#FDE8CD] rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-lg text-[#1C1917] font-heading flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#EA580C]" />
                    Gestion de la Carte & Disponibilité des Plats
                  </h3>
                  <p className="text-xs text-[#78716C]">
                    Activez ou désactivez la disponibilité d&apos;un plat en un clic si un ingrédient vient à manquer.
                  </p>
                </div>

                <Button
                  onClick={openAddProduct}
                  className="bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-2xl text-xs font-bold gap-2 px-4 shadow-md shadow-[#EA580C]/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouveau Plat</span>
                </Button>
              </div>

              {/* Category Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setProductCategoryFilter('all')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all",
                    productCategoryFilter === 'all'
                      ? "bg-[#1C1917] text-white shadow-xs"
                      : "bg-[#FFFBF5] text-[#78716C] hover:bg-[#FFF7ED] border border-[#FDE8CD]"
                  )}
                >
                  🌟 Tous ({allProducts.length})
                </button>

                {restaurant?.categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setProductCategoryFilter(cat.id)}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5",
                      productCategoryFilter === cat.id
                        ? "bg-[#EA580C] text-white shadow-xs"
                        : "bg-[#FFFBF5] text-[#78716C] hover:bg-[#FFF7ED] border border-[#FDE8CD]"
                    )}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name} ({cat.products.length})</span>
                  </button>
                ))}
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {allProducts
                  .filter(p => productCategoryFilter === 'all' || p.categoryId === productCategoryFilter)
                  .map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.03 * index }}
                      className={cn(
                        "bg-[#FFFBF5] rounded-3xl border-2 transition-all overflow-hidden flex flex-col justify-between hover-lift",
                        product.isAvailable
                          ? "border-[#FDE8CD] shadow-sm hover:border-[#EA580C]/40"
                          : "border-slate-200 opacity-70 bg-slate-50"
                      )}
                    >
                      <div>
                        {/* Image */}
                        <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                          <img
                            src={product.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'}
                            alt={product.name}
                            className={cn("w-full h-full object-cover transition-transform duration-300 hover:scale-105", !product.isAvailable && "grayscale")}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                            {product.isFeatured && (
                              <Badge className="bg-[#EA580C] text-white border-0 text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                                ⭐ Populaire
                              </Badge>
                            )}
                            <Badge className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border-0 shadow-xs", product.isAvailable ? "bg-[#16A34A] text-white" : "bg-red-600 text-white")}>
                              {product.isAvailable ? 'En Stock' : 'Épuisé'}
                            </Badge>
                          </div>

                          <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-8 w-8 p-0 rounded-xl bg-white/90 hover:bg-white text-[#1C1917] shadow-sm"
                              onClick={() => openEditProduct(product)}
                              title="Modifier le plat"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 w-8 p-0 rounded-xl bg-red-600/90 hover:bg-red-600 text-white shadow-sm"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-3xl border-2 border-[#FDE8CD]">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-[#1C1917] font-extrabold">Supprimer ce plat ?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-xs text-[#78716C]">
                                    Le plat &quot;{product.name}&quot; sera définitivement retiré de votre carte et de tous les menus QR Code.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-xl border-[#FDE8CD] text-xs font-bold">Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteProduct(product.id)}
                                    className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
                                  >
                                    Supprimer
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>

                          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white">
                            <span className="font-mono font-black text-base text-amber-300 drop-shadow-md">
                              {formatCurrency(product.price, restaurant?.currency)}
                            </span>
                            {product.preparationTime && (
                              <span className="text-[11px] font-mono font-semibold bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-full">
                                ⏱️ {product.preparationTime} min
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Text Content */}
                        <div className="p-4 space-y-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base">{product.categoryIcon || '🍽️'}</span>
                            <h4 className="font-extrabold text-sm text-[#1C1917] line-clamp-1 font-heading">
                              {product.name}
                            </h4>
                          </div>
                          <p className="text-xs text-[#78716C] line-clamp-2">
                            {product.description || 'Délicieuse spécialité préparée avec soin.'}
                          </p>
                        </div>
                      </div>

                      {/* Stock Toggle Footer */}
                      <div className="p-3 bg-white border-t border-[#FDE8CD] flex items-center justify-between rounded-b-3xl">
                        <span className="text-xs font-bold text-[#1C1917]">
                          {product.isAvailable ? '✅ Disponible à la commande' : '❌ Marqué comme épuisé'}
                        </span>
                        <Switch
                          checked={product.isAvailable}
                          onCheckedChange={() => toggleProductAvailability(product.id, product.isAvailable)}
                        />
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          </TabsContent>

          {/* 3. TABLES & QR CODE CHEVALETS TAB */}
          <TabsContent value="tables" className="space-y-4 outline-none">
            <div className="bg-white border-2 border-[#FDE8CD] rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#FDE8CD]">
                <div>
                  <h3 className="font-extrabold text-lg text-[#1C1917] font-heading flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-[#EA580C]" />
                    Plan des Tables & Chevalets QR Code
                  </h3>
                  <p className="text-xs text-[#78716C] mt-0.5">
                    Chaque table dispose d&apos;un QR Code unique. Les clients scannent avec leur smartphone, accèdent à la carte, et commandent instantanément sans faire signe au serveur.
                  </p>
                </div>

                <Button
                  onClick={() => {
                    const firstTable = restaurant?.tables?.[0] || { id: 't1', number: 'T1' }
                    setSelectedTableForQr(firstTable)
                    setQrModalOpen(true)
                  }}
                  className="bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-2xl text-xs font-bold gap-2 px-4 shadow-md shadow-[#EA580C]/20"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer Chevalet de Table</span>
                </Button>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 pt-2">
                {(restaurant?.tables && restaurant.tables.length > 0
                  ? restaurant.tables
                  : Array.from({ length: 10 }, (_, i) => ({ id: `t${i + 1}`, number: `T${i + 1}` }))
                ).map((table, index) => {
                  const activeOrderForTable = orders.find(o => o.tableNumber === table.number && (o.status === 'pending' || o.status === 'confirmed' || o.status === 'preparing'))
                  return (
                    <motion.div
                      key={table.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.02 * index }}
                      className={cn(
                        "bg-[#FFFBF5] rounded-2xl p-4 border-2 transition-all flex flex-col justify-between hover-lift text-center",
                        activeOrderForTable
                          ? "border-[#EA580C] bg-orange-50/50 shadow-md shadow-[#EA580C]/10"
                          : "border-[#FDE8CD] hover:border-[#EA580C]/50"
                      )}
                    >
                      <div>
                        <div className="w-12 h-12 rounded-2xl bg-white border-2 border-[#FDE8CD] flex items-center justify-center mx-auto mb-2 text-[#EA580C] shadow-xs">
                          <UtensilsCrossed className="w-6 h-6" />
                        </div>

                        <h4 className="font-extrabold text-base text-[#1C1917] font-mono">
                          Table {table.number}
                        </h4>

                        <div className="mt-1">
                          {activeOrderForTable ? (
                            <Badge className="bg-[#EA580C] text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-0 animate-pulse">
                              🍳 En cours ({activeOrderForTable.status})
                            </Badge>
                          ) : (
                            <Badge className="bg-[#16A34A]/15 text-[#16A34A] text-[10px] font-bold px-2 py-0.5 rounded-full border-0">
                              🟢 Disponible
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-3 mt-3 border-t border-[#FDE8CD]">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full h-8 text-[11px] font-bold border-[#FDE8CD] bg-white hover:bg-[#FFF7ED] text-[#1C1917] rounded-xl gap-1"
                          onClick={() => {
                            setSelectedTableForQr(table)
                            setQrModalOpen(true)
                          }}
                        >
                          <QrCode className="w-3 h-3 text-[#EA580C]" />
                          <span>Chevalet QR</span>
                        </Button>

                        <Link
                          href={`/${restaurant?.slug || selectedRestaurantSlug}?table=${table.number}`}
                          target="_blank"
                          className="w-full inline-flex items-center justify-center gap-1 text-[10px] font-bold text-[#78716C] hover:text-[#EA580C] py-1 transition-colors"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span>Tester le menu</span>
                        </Link>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </TabsContent>

          {/* 4. ANALYTICS TAB */}
          <TabsContent value="analytics" className="space-y-5 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Top Selling Dishes */}
              <div className="bg-white border-2 border-[#FDE8CD] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                <h4 className="font-extrabold text-base text-[#1C1917] font-heading flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[#EA580C]" />
                  Top 5 des Plats les Plus Vendus
                </h4>
                <div className="space-y-3 pt-1">
                  {(dashboardData?.topProducts && dashboardData.topProducts.length > 0
                    ? dashboardData.topProducts
                    : allProducts.slice(0, 5).map((p, idx) => ({
                        id: p.id,
                        name: p.name,
                        count: 32 - idx * 5,
                        revenue: (32 - idx * 5) * p.price
                      }))
                  ).map((item, idx) => {
                    const percentage = Math.min(100, Math.round((item.count / 35) * 100))
                    return (
                      <div key={item.id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#1C1917] flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-[#FFF7ED] text-[#EA580C] font-mono font-bold flex items-center justify-center text-[11px]">
                              #{idx + 1}
                            </span>
                            {item.name}
                          </span>
                          <span className="font-mono font-semibold text-[#78716C]">
                            {item.count} ventes • {formatCurrency(item.revenue, restaurant?.currency)}
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2 bg-[#FFF7ED]" />
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Payment distribution */}
              <div className="bg-white border-2 border-[#FDE8CD] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                <h4 className="font-extrabold text-base text-[#1C1917] font-heading flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#EA580C]" />
                  Répartition des Modes de Paiement
                </h4>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {[
                    { name: 'Wave Bénin / CI / SN', share: '48%', color: 'border-sky-300 bg-sky-50 text-sky-900' },
                    { name: 'MTN Mobile Money', share: '32%', color: 'border-amber-300 bg-amber-50 text-amber-900' },
                    { name: 'Moov Money / Orange', share: '12%', color: 'border-blue-300 bg-blue-50 text-blue-900' },
                    { name: 'Espèces / Carte Bancaire', share: '8%', color: 'border-emerald-300 bg-emerald-50 text-emerald-900' },
                  ].map((m) => (
                    <div key={m.name} className={cn("p-3 rounded-2xl border-2 text-xs", m.color)}>
                      <p className="font-bold">{m.name}</p>
                      <p className="text-xl font-black font-mono mt-1">{m.share}</p>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-[#FFFBF5] rounded-2xl border border-[#FDE8CD] text-xs text-[#78716C] flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                  <span>Les fonds Mobile Money et Carte sont versés instantanément sur votre compte professionnel sans intermédiaire.</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 5. SETTINGS TAB */}
          <TabsContent value="settings" className="outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Restaurant Info */}
              <Card className="border-2 border-[#FDE8CD] bg-white rounded-3xl shadow-xs">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base font-extrabold text-[#1C1917] font-heading">
                    <Settings className="w-4 h-4 text-[#EA580C]" />
                    Informations de l&apos;Établissement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="admin-res-name" className="text-xs font-bold text-[#1C1917]">Nom du restaurant *</Label>
                    <Input
                      id="admin-res-name"
                      value={settingsForm.name}
                      onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                      placeholder="Le Jardin Savoureux"
                      className="mt-1 bg-[#FFFBF5] border-[#FDE8CD] rounded-xl text-xs"
                    />
                  </div>

                  <div>
                    <Label htmlFor="admin-res-phone" className="text-xs font-bold text-[#1C1917]">Téléphone & WhatsApp Pro *</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
                      <Input
                        id="admin-res-phone"
                        value={settingsForm.phone}
                        onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                        placeholder="+229 97 12 34 56"
                        className="pl-10 bg-[#FFFBF5] border-[#FDE8CD] rounded-xl text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="admin-res-email" className="text-xs font-bold text-[#1C1917]">Email officiel</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
                      <Input
                        id="admin-res-email"
                        type="email"
                        value={settingsForm.email}
                        onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                        placeholder="contact@restaurant.com"
                        className="pl-10 bg-[#FFFBF5] border-[#FDE8CD] rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="admin-res-address" className="text-xs font-bold text-[#1C1917]">Adresse physique</Label>
                    <div className="relative mt-1">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-[#78716C]" />
                      <Textarea
                        id="admin-res-address"
                        value={settingsForm.address}
                        onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                        placeholder="Cotonou, Bénin"
                        className="pl-10 min-h-[70px] bg-[#FFFBF5] border-[#FDE8CD] rounded-xl text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="admin-res-desc" className="text-xs font-bold text-[#1C1917]">Description du menu</Label>
                    <Textarea
                      id="admin-res-desc"
                      value={settingsForm.description}
                      onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                      placeholder="Restaurant gastronomique proposant une cuisine africaine moderne."
                      className="mt-1 min-h-[70px] bg-[#FFFBF5] border-[#FDE8CD] rounded-xl text-xs"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Financial Settings & Model */}
              <div className="space-y-6">
                <Card className="border-2 border-[#FDE8CD] bg-white rounded-3xl shadow-xs">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base font-extrabold text-[#1C1917] font-heading">
                      <DollarSign className="w-4 h-4 text-[#EA580C]" />
                      Modèle Opérationnel & Devise
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="font-bold text-xs text-[#1C1917] flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#EA580C]" /> Modèle d&apos;Exploitation
                      </Label>
                      <Select
                        value={settingsForm.serviceType}
                        onValueChange={(value) => setSettingsForm({ ...settingsForm, serviceType: value })}
                      >
                        <SelectTrigger className="w-full bg-[#FFFBF5] border-2 border-[#FDE8CD] rounded-xl font-bold text-xs">
                          <SelectValue placeholder="Sélectionner le modèle" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-[#FDE8CD]">
                          <SelectItem value="both">🌟 Hybride — Les Deux (Salle + Livraison & Emporter)</SelectItem>
                          <SelectItem value="physical">🏛️ Restaurant Physique (Salle, Tables & Comptoir)</SelectItem>
                          <SelectItem value="online">🛵 100% En Ligne / Dark Kitchen (Livraison & Emporter)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-[#78716C]">
                        {settingsForm.serviceType === 'online'
                          ? '🛵 Mode Dark Kitchen : Le service sur place et les tables sont masqués dans le menu client.'
                          : '🍽️ Service complet : Commandes sur place avec tables QR Code, à emporter et livraison.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="admin-tax-rate" className="text-xs font-bold text-[#1C1917]">Taux de TVA (%)</Label>
                        <Input
                          id="admin-tax-rate"
                          type="number"
                          value={settingsForm.taxRate}
                          onChange={(e) => setSettingsForm({ ...settingsForm, taxRate: e.target.value })}
                          placeholder="18"
                          className="mt-1 bg-[#FFFBF5] border-[#FDE8CD] rounded-xl text-xs font-mono"
                        />
                      </div>
                      <div>
                        <Label htmlFor="admin-currency" className="text-xs font-bold text-[#1C1917]">Devise</Label>
                        <Select
                          value={settingsForm.currency}
                          onValueChange={(value) => setSettingsForm({ ...settingsForm, currency: value })}
                        >
                          <SelectTrigger className="mt-1 bg-[#FFFBF5] border-2 border-[#FDE8CD] rounded-xl font-bold text-xs">
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-[#FDE8CD]">
                            <SelectItem value="XOF">💰 XOF (FCFA) — UEMOA</SelectItem>
                            <SelectItem value="XAF">💰 XAF (FCFA) — CEMAC</SelectItem>
                            <SelectItem value="GNF">🇬🇳 GNF (Franc Guinéen)</SelectItem>
                            <SelectItem value="CDF">🇨🇩 CDF (Franc Congolais)</SelectItem>
                            <SelectItem value="EUR">💶 EUR (€) — Euro</SelectItem>
                            <SelectItem value="USD">💵 USD ($) — Dollar US</SelectItem>
                            <SelectItem value="MAD">🇲🇦 MAD (DH) — Dirham</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Save Button */}
                <Button
                  onClick={saveSettings}
                  disabled={savingSettings}
                  className="w-full h-12 bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-2xl font-extrabold text-sm shadow-md shadow-[#EA580C]/20 transition-all hover:scale-[1.01]"
                >
                  {savingSettings ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enregistrement en cours...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Enregistrer les paramètres du restaurant
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Table QR Stand Modal */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="max-w-md bg-white border-2 border-[#FDE8CD] rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-[#1C1917] font-heading flex items-center gap-2">
              <QrCode className="w-5 h-5 text-[#EA580C]" />
              Chevalet QR Code • Table {selectedTableForQr?.number || 'T1'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#78716C]">
              Posez ce chevalet sur la table {selectedTableForQr?.number}. Les clients scannent et commandent directement.
            </DialogDescription>
          </DialogHeader>

          {/* Printable Table Tent Preview */}
          <div className="my-2 p-6 rounded-3xl bg-gradient-to-b from-[#FFFBF5] to-[#FFF7ED] border-2 border-[#EA580C]/40 text-center shadow-lg space-y-4">
            <div className="flex items-center justify-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#EA580C] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base text-[#1C1917] font-heading">
                {restaurant?.name || 'Restaurant'}
              </span>
            </div>

            <div className="py-1">
              <span className="inline-block px-4 py-1 rounded-full bg-[#EA580C] text-white font-mono font-black text-sm tracking-wider shadow-xs">
                TABLE {selectedTableForQr?.number || 'T1'}
              </span>
            </div>

            {/* QR Code Image */}
            <div className="bg-white p-4 rounded-2xl inline-block border-2 border-[#FDE8CD] shadow-md">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  typeof window !== 'undefined'
                    ? `${window.location.origin}/${restaurant?.slug || selectedRestaurantSlug}?table=${selectedTableForQr?.number || 'T1'}`
                    : `https://restosaas.com/${restaurant?.slug || selectedRestaurantSlug}?table=${selectedTableForQr?.number || 'T1'}`
                )}`}
                alt={`QR Code Table ${selectedTableForQr?.number || 'T1'}`}
                className="w-44 h-44 mx-auto rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <p className="font-extrabold text-sm text-[#1C1917]">
                Scannez avec votre téléphone 📸
              </p>
              <p className="text-[11px] text-[#78716C] max-w-xs mx-auto">
                Consultez le menu interactif en photos, commandez et payez en quelques secondes par Mobile Money ou Carte.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-[#EA580C] pt-1">
              <span>⚡ Sans attente</span>
              <span>•</span>
              <span>💳 Wave & MoMo</span>
              <span>•</span>
              <span>✨ Service Rapide</span>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                const url = typeof window !== 'undefined'
                  ? `${window.location.origin}/${restaurant?.slug || selectedRestaurantSlug}?table=${selectedTableForQr?.number || 'T1'}`
                  : `https://restosaas.com/${restaurant?.slug || selectedRestaurantSlug}?table=${selectedTableForQr?.number || 'T1'}`
                navigator.clipboard.writeText(url)
                toast.success('Lien direct de la table copié !')
              }}
              className="border-[#FDE8CD] rounded-2xl text-xs font-bold text-[#1C1917] hover:bg-[#FFF7ED]"
            >
              <Share2 className="w-3.5 h-3.5 mr-1.5" />
              Copier le lien direct
            </Button>

            <Button
              onClick={() => window.print()}
              className="bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-2xl text-xs font-extrabold gap-1.5 px-5 shadow-md shadow-[#EA580C]/20"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimer le Chevalet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Modal (Add/Edit) */}
      <Dialog open={productModalOpen} onOpenChange={setProductModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-white border-2 border-[#FDE8CD] rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-[#1C1917] font-heading">
              {isEditing ? 'Modifier le Plat' : 'Nouveau Plat à la Carte'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#78716C]">
              Remplissez les informations et ajoutez une photo culinaire
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <div>
              <Label htmlFor="admin-prod-name" className="text-xs font-bold text-[#1C1917]">Nom du plat *</Label>
              <Input
                id="admin-prod-name"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                placeholder="Ex: Poulet Yassa Grillé"
                className="mt-1 border-[#FDE8CD] rounded-xl text-xs"
              />
            </div>

            <div>
              <Label htmlFor="admin-prod-desc" className="text-xs font-bold text-[#1C1917]">Description</Label>
              <Textarea
                id="admin-prod-desc"
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                placeholder="Ingrédients, saveurs, accompagnements..."
                rows={2}
                className="mt-1 border-[#FDE8CD] rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="admin-prod-price" className="text-xs font-bold text-[#1C1917]">Prix ({restaurant?.currency || 'XOF'}) *</Label>
                <Input
                  id="admin-prod-price"
                  type="number"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  placeholder="4500"
                  className="mt-1 border-[#FDE8CD] rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <Label htmlFor="admin-prod-cat" className="text-xs font-bold text-[#1C1917]">Catégorie *</Label>
                <Select
                  value={productForm.categoryId}
                  onValueChange={(val) => setProductForm({ ...productForm, categoryId: val })}
                >
                  <SelectTrigger className="mt-1 bg-white border-2 border-[#FDE8CD] rounded-xl font-bold text-xs">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-[#FDE8CD]">
                    {restaurant?.categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id} className="text-xs font-bold">
                        <span className="mr-1.5">{cat.icon || '🍽️'}</span>
                        <span>{cat.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Image Upload & AI Generation */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-[#1C1917]">Photo du Plat</Label>

              {productForm.image && (
                <div className="relative w-full h-36 rounded-2xl overflow-hidden border-2 border-[#FDE8CD]">
                  <img src={productForm.image} alt="Preview" className="w-full h-full object-cover" />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 h-7 w-7 p-0 rounded-lg"
                    onClick={() => setProductForm({ ...productForm, image: '' })}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-16 flex-col gap-1 border-[#FDE8CD] rounded-xl text-xs font-bold"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageUploading}
                >
                  {imageUploading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#EA580C]" />
                  ) : (
                    <Upload className="w-5 h-5 text-[#78716C]" />
                  )}
                  <span>{imageUploading ? 'Chargement...' : 'Télécharger'}</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="h-16 flex-col gap-1 border-purple-200 bg-purple-50/50 hover:bg-purple-50 rounded-xl text-xs font-bold text-purple-900"
                  onClick={generateAIImage}
                  disabled={aiGenerating || !productForm.name}
                >
                  {aiGenerating ? (
                    <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-purple-600" />
                  )}
                  <span>{aiGenerating ? 'Génération...' : 'Studio IA'}</span>
                </Button>
              </div>

              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
                <Input
                  value={productForm.image}
                  onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                  placeholder="Ou collez une URL d'image..."
                  className="pl-9 bg-[#FFFBF5] border-[#FDE8CD] rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="admin-prep" className="text-xs font-bold text-[#1C1917]">Temps préparation (min)</Label>
                <Input
                  id="admin-prep"
                  type="number"
                  value={productForm.preparationTime}
                  onChange={(e) => setProductForm({ ...productForm, preparationTime: e.target.value })}
                  placeholder="15"
                  className="mt-1 border-[#FDE8CD] rounded-xl text-xs font-mono"
                />
              </div>
              <div>
                <Label htmlFor="admin-cal" className="text-xs font-bold text-[#1C1917]">Calories (kcal)</Label>
                <Input
                  id="admin-cal"
                  type="number"
                  value={productForm.calories}
                  onChange={(e) => setProductForm({ ...productForm, calories: e.target.value })}
                  placeholder="450"
                  className="mt-1 border-[#FDE8CD] rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#FDE8CD]">
              <div className="flex items-center gap-2">
                <Switch
                  id="admin-avail"
                  checked={productForm.isAvailable}
                  onCheckedChange={(val) => setProductForm({ ...productForm, isAvailable: val })}
                />
                <Label htmlFor="admin-avail" className="text-xs font-bold text-[#1C1917]">Disponible</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="admin-feat"
                  checked={productForm.isFeatured}
                  onCheckedChange={(val) => setProductForm({ ...productForm, isFeatured: val })}
                />
                <Label htmlFor="admin-feat" className="text-xs font-bold text-[#1C1917]">⭐ Populaire</Label>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-[#FDE8CD]">
            <Button
              variant="outline"
              onClick={() => setProductModalOpen(false)}
              className="border-[#FDE8CD] rounded-xl text-xs font-bold"
            >
              Annuler
            </Button>
            <Button
              onClick={saveProduct}
              className="bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl text-xs font-bold px-5"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {isEditing ? 'Enregistrer les modifications' : 'Créer le Plat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
