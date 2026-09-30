'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  UtensilsCrossed, ShoppingCart, Plus, Minus, 
  ChefHat, BarChart3, Package, Clock, 
  CheckCircle, MapPin, Phone, Heart,
  Flame, Star, Menu, X, Check,
  CreditCard, TrendingUp, Users, DollarSign,
  RefreshCw, QrCode, Eye, Settings, Bell,
  Search, Filter, Edit, Trash2, Save, 
  Image as ImageIcon, Upload, Camera, Sparkles, Loader2,
  LogIn, LogOut, Lock, User as UserIcon, Mail, Key,
  Navigation, MapPinned, Timer, Receipt, MessageCircle,
  AlertCircle, Truck, Store, Home, ClipboardList,
  Crown, ArrowRight, ArrowLeft, Building2,
  Printer, ExternalLink, Share2, HelpCircle,
  LayoutGrid, List, SlidersHorizontal, Info, ShieldCheck
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
import { useCartStore, useRestaurantStore, useAuthStore, useCustomerStore, TrackedOrder } from '@/lib/store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import PaymentMethodSelector, { PaymentProviderId, PAYMENT_PROVIDERS } from '@/components/PaymentMethodSelector'

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
  serviceType?: string | null // 'physical' | 'online' | 'both'
  orderModes?: string | null  // 'dine_in,takeaway,delivery'
  categories: Category[]
  tables: { id: string; number: string }[]
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

// Demo data - Curated African & International Haute Gastronomie
const DEMO_RESTAURANT: Restaurant = {
  id: 'demo-restaurant',
  name: 'Le Jardin Savoureux',
  slug: 'le-jardin-savoureux',
  description: 'Haute gastronomie africaine & grillades au feu de bois. Une expérience culinaire d’exception préparée à la minute avec des produits frais locaux.',
  logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop',
  banner: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&h=600&fit=crop',
  address: 'Boulevard de la Marina, Cotonou, Bénin',
  phone: '+229 97 12 34 56',
  currency: 'XOF',
  taxRate: 0.18,
  serviceType: 'both',
  orderModes: 'dine_in,takeaway,delivery',
  tables: Array.from({ length: 10 }, (_, i) => ({ id: `t${i + 1}`, number: `T${i + 1}` })),
  categories: [
    {
      id: 'cat-1',
      name: 'Entrées & Tapas',
      icon: '🥗',
      description: 'Mises en bouche fraîches et créations artisanales du Chef',
      products: [
        { id: 'p1', name: 'Salade de Mangue & Avocat', description: 'Mangues fraîches locales, avocats crémeux, oignons rouges de Grand-Popo et vinaigrette au citron vert.', price: 2500, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=450&fit=crop', isAvailable: true, isFeatured: false, preparationTime: 10, calories: 180, categoryId: 'cat-1' },
        { id: 'p2', name: 'Brochettes de Gambas Épicées', description: 'Grosses crevettes sauvages marinées au gingembre, ail confit et piment doux grillées à la flamme.', price: 3500, image: 'https://images.unsplash.com/photo-1559742811-822873691df8?w=600&h=450&fit=crop', isAvailable: true, isFeatured: true, preparationTime: 15, calories: 220, categoryId: 'cat-1' },
        { id: 'p3', name: 'Acarajé Traditionnel & Vatapa', description: 'Beignets croustillants de niébé garnis de pâte de crevettes séchées et sauce pimentée maison.', price: 1500, image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&h=450&fit=crop', isAvailable: true, isFeatured: false, preparationTime: 8, calories: 280, categoryId: 'cat-1' },
        { id: 'p4-e', name: 'Pastels & Samoussas Dorés', description: 'Assortiment de 4 feuilletés croustillants au bœuf épicé et légumes croquants avec sauce tartare afrik.', price: 2000, image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&h=450&fit=crop', isAvailable: true, isFeatured: true, preparationTime: 12, calories: 240, categoryId: 'cat-1' },
      ],
    },
    {
      id: 'cat-2',
      name: 'Plats Principaux',
      icon: '🍲',
      description: 'Les grands classiques réinventés avec raffinement',
      products: [
        { id: 'p4', name: 'Poulet Moambé Prestige', description: 'Poulet fermier braisé mijoté dans une onctueuse sauce moambé aux noix de palme, riz parfumé et plantains.', price: 5500, image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=600&h=450&fit=crop', isAvailable: true, isFeatured: true, preparationTime: 25, calories: 650, categoryId: 'cat-2' },
        { id: 'p5', name: 'Thiéboudienne Royale au Mérou', description: 'Riz rouge sénégalais mijoté au bouillon de poisson noble, légumes confits, tamarins et piments doux.', price: 4500, image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&h=450&fit=crop', isAvailable: true, isFeatured: true, preparationTime: 30, calories: 580, categoryId: 'cat-2' },
        { id: 'p6', name: 'Poisson Capitaine Braisé', description: 'Pavé de capitaine frais mariné aux épices du golfe de Guinée, grillé et servi avec attiéké et sauce moutarde.', price: 5000, image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&h=450&fit=crop', isAvailable: true, isFeatured: false, preparationTime: 25, calories: 450, categoryId: 'cat-2' },
        { id: 'p7-m', name: 'Mafé Fondant au Bœuf', description: 'Morceaux de bœuf braisés longuement dans une sauce arachide veloutée, carottes et patates douces.', price: 4800, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=450&fit=crop', isAvailable: true, isFeatured: false, preparationTime: 25, calories: 680, categoryId: 'cat-2' },
      ],
    },
    {
      id: 'cat-3',
      name: 'Grillades au Feu de Bois',
      icon: '🔥',
      description: 'Viandes d’exception marinées et grillées à la braise',
      products: [
        { id: 'p7', name: 'Brochettes Suya de Bœuf', description: 'Fines lamelles de bœuf tendre assaisonnées aux épices kankankan et grillées au charbon de bois.', price: 4000, image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=450&fit=crop', isAvailable: true, isFeatured: false, preparationTime: 15, calories: 380, categoryId: 'cat-3' },
        { id: 'p8', name: 'Côtes d’Agneau Braisées', description: 'Côtes d’agneau sélectionnées, dorées à point, badigeonnées de beurre aux herbes et moutarde à l’ancienne.', price: 7000, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=450&fit=crop', isAvailable: true, isFeatured: true, preparationTime: 20, calories: 520, categoryId: 'cat-3' },
        { id: 'p9-y', name: 'Poulet Yassa Grillé', description: 'Cuisse de poulet grillée nappée d’une compotée d’oignons caramélisés au citron vert et moutarde de Dijon.', price: 4500, image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=600&h=450&fit=crop', isAvailable: true, isFeatured: false, preparationTime: 20, calories: 420, categoryId: 'cat-3' },
        { id: 'p10-dg', name: 'Poulet DG aux Plantains', description: 'Dés de poulet sautés avec alloco croustillant, poivrons colorés, carottes et petits pois.', price: 6000, image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&h=450&fit=crop', isAvailable: true, isFeatured: false, preparationTime: 20, calories: 690, categoryId: 'cat-3' },
      ],
    },
    {
      id: 'cat-4',
      name: 'Accompagnements',
      icon: '🍚',
      description: 'Le complément parfait pour sublimer votre repas',
      products: [
        { id: 'p11-al', name: 'Alloco Croustillant', description: 'Bananes plantains mûres frites à l’huile dorée avec sauce piment tomate.', price: 1200, image: 'https://images.unsplash.com/photo-1600335895229-6e75511892c8?w=600&h=450&fit=crop', isAvailable: true, isFeatured: false, preparationTime: 8, calories: 280, categoryId: 'cat-4' },
        { id: 'p12-at', name: 'Attiéké Traditionnel', description: 'Semoule de manioc fine cuite à la vapeur, légèrement acidulée et parfumée.', price: 1000, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&h=450&fit=crop', isAvailable: true, isFeatured: false, preparationTime: 5, calories: 180, categoryId: 'cat-4' },
        { id: 'p13-rz', name: 'Riz Parfumé aux Épices', description: 'Riz blanc jasmin délicatement infusé à la cardamome et feuilles de laurier.', price: 800, image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=600&h=450&fit=crop', isAvailable: true, isFeatured: false, preparationTime: 5, calories: 200, categoryId: 'cat-4' },
        { id: 'p14-fr', name: 'Frites Maison Croquantes', description: 'Pommes de terre fraîches coupées à la main, frites deux fois pour un croustillant parfait.', price: 1500, image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&h=450&fit=crop', isAvailable: true, isFeatured: false, preparationTime: 10, calories: 320, categoryId: 'cat-4' },
      ],
    },
    {
      id: 'cat-5',
      name: 'Boissons & Cocktails',
      icon: '🍹',
      description: 'Jus pressés à froid et infusions artisanales',
      products: [
        { id: 'p9', name: 'Jus de Bissap Royal', description: 'Infusion de fleurs d’hibiscus bio, menthe fraîche et une touche de fleur d’oranger.', price: 1000, image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=600&h=450&fit=crop', isAvailable: true, isFeatured: false, preparationTime: 2, calories: 120, categoryId: 'cat-5' },
        { id: 'p10', name: 'Cocktail Signature Zagoor', description: 'Nectar de mangue fraîche, ananas victoria, passion et pointe de gingembre.', price: 2000, image: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=600&h=450&fit=crop', isAvailable: true, isFeatured: true, preparationTime: 5, calories: 180, categoryId: 'cat-5' },
        { id: 'p15-gg', name: 'Jus de Gingembre Tonifiant', description: 'Gingembre pressé pur, citron vert pressé et sucre de canne bio.', price: 1000, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&h=450&fit=crop', isAvailable: true, isFeatured: false, preparationTime: 3, calories: 80, categoryId: 'cat-5' },
        { id: 'p16-bb', name: 'Nectar de Baobab Crémeux', description: 'Pulpe de pain de singe riche en antioxydants, lait végétal et muscade.', price: 1200, image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&h=450&fit=crop', isAvailable: true, isFeatured: false, preparationTime: 3, calories: 110, categoryId: 'cat-5' },
      ],
    },
    {
      id: 'cat-6',
      name: 'Desserts Gourmands',
      icon: '🍰',
      description: 'Douceurs sucrées et créations pâtissières',
      products: [
        { id: 'p12', name: 'Moelleux Coulant au Chocolat', description: 'Chocolat noir pure origine au cœur fondant, accompagné de sa boule de glace vanille.', price: 3000, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&h=450&fit=crop', isAvailable: true, isFeatured: true, preparationTime: 12, calories: 420, categoryId: 'cat-6' },
        { id: 'p11', name: 'Bananes Flambées au Rhum', description: 'Bananes caramélisées au sucre roux, flambées au rhum ambré et zeste de citron vert.', price: 2500, image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&h=450&fit=crop', isAvailable: true, isFeatured: false, preparationTime: 10, calories: 280, categoryId: 'cat-6' },
        { id: 'p17-fr', name: 'Carpaccio de Fruits Tropicaux', description: 'Ananas Victoria, mangue, papaye et fruits de la passion avec sirop à la menthe fraîche.', price: 2200, image: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=600&h=450&fit=crop', isAvailable: true, isFeatured: false, preparationTime: 8, calories: 140, categoryId: 'cat-6' },
        { id: 'p18-gl', name: 'Glace Artisanale 2 Boules', description: 'Parfums au choix : Vanille Bourbon, Chocolat Intense, Mangue du Bénin, Coco Grillée.', price: 2000, image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=600&h=450&fit=crop', isAvailable: true, isFeatured: false, preparationTime: 3, calories: 210, categoryId: 'cat-6' },
      ],
    },
  ],
}

// Format currency
function formatCurrency(amount: number, currency: string = 'XOF'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

// Status colors
const statusColors: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  confirmed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  preparing: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  ready: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  delivered: 'bg-green-500/10 text-green-600 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
}

const statusLabels: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  preparing: 'En préparation',
  ready: 'Prête',
  delivered: 'Livrée',
  cancelled: 'Annulée',
}

// View mode type
type ViewMode = 'menu' | 'dashboard' | 'tracking'

// Product form type
interface ProductForm {
  id?: string
  name: string
  description: string
  price: string
  image: string
  categoryId: string
  preparationTime: string
  calories: string
  isAvailable: boolean
  isFeatured: boolean
}

const emptyProductForm: ProductForm = {
  name: '',
  description: '',
  price: '',
  image: '',
  categoryId: '',
  preparationTime: '',
  calories: '',
  isAvailable: true,
  isFeatured: false,
}

interface RestaurantAppProps {
  targetSlug?: string
}

export default function RestaurantApp({ targetSlug }: RestaurantAppProps = {}) {
  const { items, addItem, removeItem, updateQuantity, clearCart, getTotal, getItemCount } = useCartStore()
  const { currentRestaurant, setRestaurant, tableNumber, setTable } = useRestaurantStore()
  const { user, isAuthenticated, login, logout } = useAuthStore()
  
  const [restaurant, setRestaurantData] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('menu')
  const [viewLayout, setViewLayout] = useState<'grid' | 'compact'>('grid')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null)
  const [detailQuantity, setDetailQuantity] = useState(1)
  const [detailSpiceLevel, setDetailSpiceLevel] = useState<'mild' | 'medium' | 'hot'>('medium')
  const [detailSpecialNote, setDetailSpecialNote] = useState('')
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', address: '', notes: '' })
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway' | 'delivery'>('dine_in')
  const [paymentProvider, setPaymentProvider] = useState<PaymentProviderId>('wave')
  const [paymentPhone, setPaymentPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+229')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'assazara' | 'mobile_money' | 'card'>('mobile_money')

  const openProductDetail = (product: Product) => {
    setSelectedProductForDetail(product)
    setDetailQuantity(1)
    setDetailSpecialNote('')
    setDetailSpiceLevel('medium')
  }

  const addDetailProductToCart = () => {
    if (!selectedProductForDetail) return
    for (let i = 0; i < detailQuantity; i++) {
      addItem({
        id: selectedProductForDetail.id,
        name: selectedProductForDetail.name,
        price: selectedProductForDetail.price,
        quantity: 1,
        image: selectedProductForDetail.image || undefined,
      })
    }
    toast.success(`${detailQuantity}x ${selectedProductForDetail.name} ajouté au panier`)
    setSelectedProductForDetail(null)
  }
  
  // Login state
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  // Product management state
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm)
  const [isEditing, setIsEditing] = useState(false)
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Dashboard state
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersFilter, setOrdersFilter] = useState<string>('all')
  const [dashboardTab, setDashboardTab] = useState<string>('orders')
  const [selectedTableForQr, setSelectedTableForQr] = useState<{ id: string; number: string } | null>(null)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [ordersSearchQuery, setOrdersSearchQuery] = useState('')
  const [productCategoryFilter, setProductCategoryFilter] = useState('all')
  const [callWaiterModalOpen, setCallWaiterModalOpen] = useState(false)

  const toggleProductAvailability = async (productId: string, currentStatus: boolean) => {
    setRestaurantData(prev => {
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

  // Tracking state
  const { trackedOrders, setTrackedOrders, customerPhone, setCustomerPhone, addTrackedOrder } = useCustomerStore()
  const [searchType, setSearchType] = useState<'orderNumber' | 'phone'>('orderNumber')
  const [searchValue, setSearchValue] = useState('')
  const [searching, setSearching] = useState(false)
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<TrackedOrder | null>(null)

  // Settings state
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
    description: '',
    taxRate: '',
    currency: 'XOF',
    serviceType: 'both',
  })
  const [savingSettings, setSavingSettings] = useState(false)

  // Initialize restaurant
  useEffect(() => {
    const initRestaurant = async () => {
      setLoading(true)
      setNotFound(false)
      const slugToFetch = targetSlug || 'le-jardin-savoureux'

      try {
        let res = await fetch(`/api/restaurants?slug=${encodeURIComponent(slugToFetch)}`)
        let data = await res.json()
        
        if (!res.ok || data?.error || !data?.id) {
          // If default/demo slug or fetch failed, attempt seed
          if (slugToFetch === 'le-jardin-savoureux') {
            await fetch('/api/seed')
            res = await fetch('/api/restaurants?slug=le-jardin-savoureux')
            data = await res.json()
          }
        }

        if (data && data.id && !data.error) {
          setRestaurantData(data)
          if (!currentRestaurant || currentRestaurant !== data.id) {
            setRestaurant(data.id, data.name)
          }
          if (data.serviceType === 'online') {
            setOrderType('delivery')
          }
        } else if (slugToFetch === 'le-jardin-savoureux') {
          setRestaurantData(DEMO_RESTAURANT)
          setRestaurant(DEMO_RESTAURANT.id, DEMO_RESTAURANT.name)
        } else {
          setNotFound(true)
        }
      } catch {
        if (slugToFetch === 'le-jardin-savoureux') {
          setRestaurantData(DEMO_RESTAURANT)
          setRestaurant(DEMO_RESTAURANT.id, DEMO_RESTAURANT.name)
        } else {
          setNotFound(true)
        }
      } finally {
        setLoading(false)
      }
    }
    
    initRestaurant()
  }, [targetSlug, setRestaurant])

  // Initialize settings form when restaurant loads
  useEffect(() => {
    if (restaurant) {
      const type = restaurant.serviceType || 'both'
      setSettingsForm({
        name: restaurant.name || '',
        phone: restaurant.phone || '',
        address: restaurant.address || '',
        email: restaurant.email || '',
        description: restaurant.description || '',
        taxRate: ((restaurant.taxRate || 0.18) * 100).toString(),
        currency: restaurant.currency || 'XOF',
        serviceType: type,
      })
      if (type === 'online') {
        setOrderType('delivery')
      }
    }
  }, [restaurant])

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    if (!currentRestaurant) return
    
    try {
      const [statsRes, ordersRes] = await Promise.all([
        fetch(`/api/dashboard?restaurantId=${currentRestaurant}`),
        fetch(`/api/orders?restaurantId=${currentRestaurant}`),
      ])
      
      const stats = await statsRes.json()
      const ordersData = await ordersRes.json()
      
      setDashboardData(statsRes.ok && !stats.error ? stats : null)
      setOrders(Array.isArray(ordersData) ? ordersData : [])
    } catch {
      // Silent fail
    }
  }, [currentRestaurant])

  // Refresh restaurant data
  const refreshRestaurantData = useCallback(async () => {
    if (!currentRestaurant) return
    try {
      const res = await fetch(`/api/restaurants?id=${currentRestaurant}`)
      const data = await res.json()
      if (data && data.id) {
        setRestaurantData(data)
      }
    } catch {
      // Silent fail
    }
  }, [currentRestaurant])

  useEffect(() => {
    if (viewMode === 'dashboard') {
      fetchDashboardData()
    }
  }, [viewMode, fetchDashboardData])

  // Filter products
  const filteredProducts = restaurant?.categories
    .filter(cat => !selectedCategory || cat.id === selectedCategory)
    .flatMap(cat => cat.products)
    .filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    ) || []

  // Get featured products
  const featuredProducts = restaurant?.categories
    .flatMap(cat => cat.products)
    .filter(p => p.isFeatured) || []

  // Get all products for management
  const allProducts = restaurant?.categories.flatMap(cat => 
    cat.products.map(p => ({ ...p, categoryName: cat.name, categoryIcon: cat.icon }))
  ) || []

  // Handle add to cart
  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image || undefined,
    })
    toast.success(`${product.name} ajouté au panier`)
  }

  // Handle decrement / remove from cart
  const handleRemoveFromCart = (productId: string) => {
    const existing = items.find(i => i.id === productId)
    if (existing) {
      if (existing.quantity <= 1) {
        removeItem(productId)
      } else {
        updateQuantity(productId, existing.quantity - 1)
      }
    }
  }

  // Handle checkout
  const handleCheckout = async () => {
    if (isSubmittingCheckout) return
    if (!customerInfo.name.trim() || !customerInfo.phone.trim()) {
      toast.error('Veuillez remplir votre nom et votre numéro WhatsApp/Téléphone')
      return
    }

    if (orderType === 'delivery' && !customerInfo.address.trim()) {
      toast.error('Veuillez renseigner votre adresse de livraison')
      return
    }

    if (orderType === 'dine_in' && restaurant?.serviceType !== 'online' && !tableNumber) {
      toast.error('Veuillez sélectionner un numéro de table pour le service sur place')
      return
    }

    const computedMethod = paymentProvider === 'cash' 
      ? 'cash' 
      : (paymentProvider === 'card' ? 'card' : 'mobile_money')

    const effectivePaymentPhone = paymentPhone.trim() 
      ? (paymentPhone.startsWith('+') ? paymentPhone : `${countryCode}${paymentPhone.replace(/^0+/, '')}`) 
      : customerInfo.phone

    setIsSubmittingCheckout(true)
    try {
      const isDemoMode = Boolean(
        restaurant?.slug === 'le-jardin-savoureux' || 
        restaurant?.id === 'demo-restaurant' || 
        targetSlug === 'le-jardin-savoureux'
      )

      let order: any = null
      let orderNumber = `ORD-${Date.now().toString(36).toUpperCase().substring(0, 8)}`
      let checkoutUrl: string | null = null
      const fullNotes = orderType === 'delivery'
        ? `[Livraison: ${customerInfo.address.trim()}] ${customerInfo.notes.trim()}`.trim()
        : customerInfo.notes.trim()
      const finalTableNumber = (orderType === 'dine_in' && restaurant?.serviceType !== 'online') ? tableNumber : null

      // 1. Créer la commande via l'API
      if (restaurant?.id && restaurant.id !== 'demo-restaurant') {
        try {
          const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              restaurantId: restaurant.id,
              items: items.map(item => ({
                productId: item.id,
                quantity: item.quantity,
                notes: item.notes,
              })),
              customerName: customerInfo.name,
              customerPhone: customerInfo.phone,
              tableNumber: finalTableNumber,
              notes: fullNotes,
              type: orderType,
              paymentMethod: computedMethod,
              paymentProvider: paymentProvider,
              paymentPhone: effectivePaymentPhone,
              isDemo: isDemoMode,
            }),
          })

          const data = await res.json()
          if (res.ok && data.id) {
            order = data
            orderNumber = order.orderNumber
            if (!isDemoMode) {
              checkoutUrl = data.checkoutUrl || null
            }
          }
        } catch (err) {
          console.error('API Orders fetch error:', err)
        }
      }

      // Si mode démo local ou repli
      if (!order) {
        order = {
          id: `order-${Date.now()}`,
          orderNumber,
          status: 'pending',
          type: orderType,
          subtotal: items.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0),
          tax: 0,
          total: items.reduce((sum, item) => sum + ((item.price || 0) * item.quantity), 0) * (1 + (restaurant?.taxRate || 0.18)),
          items: items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes || null,
            product: { id: item.id, name: item.name, image: item.image || null }
          })),
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone,
          tableNumber: finalTableNumber,
          notes: fullNotes,
          paymentStatus: (computedMethod === 'mobile_money' || computedMethod === 'card') ? 'paid' : 'pending',
          paymentMethod: computedMethod,
          createdAt: new Date().toISOString()
        }
      }

      const providerInfo = PAYMENT_PROVIDERS.find(p => p.id === paymentProvider)
      const providerLabel = providerInfo ? `${providerInfo.iconName} ${providerInfo.name}` : 'Mobile Money'

      // 2. Gestion Paiement : En mode DÉMO, pas de redirection Moneroo
      if (isDemoMode) {
        if (computedMethod === 'mobile_money' || computedMethod === 'card') {
          toast.success(`🎉 Commande #${orderNumber} validée ! Règlement par ${providerLabel} simulé avec succès en Mode Démo 🔥`)
        } else {
          toast.success(`🎉 Commande #${orderNumber} enregistrée ! Règlement en espèces à la réception.`)
        }
      } else if (checkoutUrl) {
        toast.success(`Commande validée ! Redirection sécurisée ${providerLabel}...`)
        window.location.href = checkoutUrl
        return
      } else {
        toast.success(`Commande #${orderNumber} créée avec succès (${providerLabel}) !`)
      }

      // 3. Vider le panier et basculer vers l'écran de suivi
      clearCart()
      setCheckoutOpen(false)
      const savedPhone = customerInfo.phone
      setCustomerInfo({ name: '', phone: '', address: '', notes: '' })
      setPaymentPhone('')
      setCustomerPhone(savedPhone)
      addTrackedOrder(order)
      setSelectedOrder(order)
      setOrders(prev => [order, ...prev])
      setViewMode('tracking')
      setSearchValue(orderNumber)

    } catch (e) {
      toast.error('Erreur lors de la validation de la commande')
    } finally {
      setIsSubmittingCheckout(false)
    }
  }

  // Update order status
  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status }),
      })
      toast.success('Statut mis à jour')
      fetchDashboardData()
    } catch {
      toast.error('Erreur')
    }
  }

  // Open product modal for adding
  const openAddProduct = () => {
    setProductForm(emptyProductForm)
    setIsEditing(false)
    setProductModalOpen(true)
  }

  // Open product modal for editing
  const openEditProduct = (product: Product) => {
    setProductForm({
      id: product.id,
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      image: product.image || '',
      categoryId: product.categoryId,
      preparationTime: product.preparationTime?.toString() || '',
      calories: product.calories?.toString() || '',
      isAvailable: product.isAvailable,
      isFeatured: product.isFeatured,
    })
    setIsEditing(true)
    setProductModalOpen(true)
  }

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5MB')
      return
    }

    setImageUploading(true)

    try {
      // Convert to base64
      const reader = new FileReader()
      reader.onload = async (event) => {
        const base64 = event.target?.result as string
        setProductForm({ ...productForm, image: base64 })
        setImageUploading(false)
        toast.success('Image téléchargée!')
      }
      reader.onerror = () => {
        setImageUploading(false)
        toast.error('Erreur lors du téléchargement')
      }
      reader.readAsDataURL(file)
    } catch {
      setImageUploading(false)
      toast.error('Erreur lors du téléchargement')
    }
  }

  // Generate AI image
  const generateAIImage = async () => {
    if (!productForm.name) {
      toast.error('Veuillez entrer le nom du produit d\'abord')
      return
    }

    setAiGenerating(true)
    
    try {
      // Get category name for better prompt
      const categoryName = restaurant?.categories.find(c => c.id === productForm.categoryId)?.name || 'plat'
      
      const prompt = `${productForm.name}, ${categoryName} africain, food photography, professional lighting, appetizing, high quality, on plate, restaurant style`
      
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      const data = await res.json()
      
      if (data.image) {
        setProductForm({ ...productForm, image: data.image })
        toast.success('Image générée avec succès!')
      } else {
        throw new Error('No image in response')
      }
    } catch {
      toast.error('Erreur lors de la génération. Veuillez réessayer.')
    } finally {
      setAiGenerating(false)
    }
  }

  // Save product (create or update)
  const saveProduct = async () => {
    if (!productForm.name || !productForm.price || !productForm.categoryId) {
      toast.error('Veuillez remplir les champs obligatoires')
      return
    }

    try {
      const url = '/api/products'
      const method = isEditing ? 'PUT' : 'POST'
      const body = {
        ...(isEditing && { id: productForm.id }),
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        image: productForm.image || null,
        categoryId: productForm.categoryId,
        preparationTime: productForm.preparationTime ? parseInt(productForm.preparationTime) : null,
        calories: productForm.calories ? parseInt(productForm.calories) : null,
        isAvailable: productForm.isAvailable,
        isFeatured: productForm.isFeatured,
        restaurantId: currentRestaurant,
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success(isEditing ? 'Produit modifié!' : 'Produit ajouté!')
        setProductModalOpen(false)
        refreshRestaurantData()
      }
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    }
  }

  // Delete product
  const deleteProduct = async (productId: string) => {
    try {
      const res = await fetch(`/api/products?id=${productId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Produit supprimé!')
        setDeleteProductId(null)
        refreshRestaurantData()
      }
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  // Handle login
  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      toast.error('Veuillez remplir tous les champs')
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

      if (data.success && data.user) {
        login(data.user)
        setLoginModalOpen(false)
        setLoginEmail('')
        setLoginPassword('')
        toast.success(`Bienvenue, ${data.user.name}!`)
      } else {
        toast.error(data.error || 'Erreur de connexion')
      }
    } catch {
      toast.error('Erreur de connexion')
    } finally {
      setLoginLoading(false)
    }
  }

  // Handle logout
  const handleLogout = () => {
    logout()
    setViewMode('menu')
    toast.success('Déconnexion réussie')
  }

  // Handle dashboard access
  const handleDashboardAccess = () => {
    if (isAuthenticated) {
      setViewMode('dashboard')
    } else {
      setLoginModalOpen(true)
    }
  }

  // Search orders for tracking
  const searchOrders = async () => {
    if (!searchValue.trim() || !currentRestaurant) {
      toast.error('Veuillez entrer une valeur de recherche')
      return
    }

    setSearching(true)

    try {
      const params = new URLSearchParams({
        restaurantId: currentRestaurant,
        ...(searchType === 'orderNumber' 
          ? { orderNumber: searchValue.trim() }
          : { phone: searchValue.trim() }
        ),
      })

      const res = await fetch(`/api/tracking?${params}`)
      const data = await res.json()

      if (res.ok && data.length > 0) {
        setTrackedOrders(data)
        // Save phone for convenience
        if (searchType === 'phone') {
          setCustomerPhone(searchValue.trim())
        }
        toast.success(`${data.length} commande(s) trouvée(s)`)
      } else {
        toast.error('Aucune commande trouvée')
      }
    } catch {
      toast.error('Erreur lors de la recherche')
    } finally {
      setSearching(false)
    }
  }

  // Refresh single order status
  const refreshOrderStatus = async (orderNumber: string) => {
    if (!currentRestaurant) return

    try {
      const res = await fetch(`/api/tracking?restaurantId=${currentRestaurant}&orderNumber=${orderNumber}`)
      const data = await res.json()

      if (res.ok && data.length > 0) {
        const updatedOrder = data[0]
        // Update in tracked orders
        const updated = trackedOrders.map(o => 
          o.orderNumber === updatedOrder.orderNumber ? updatedOrder : o
        )
        setTrackedOrders(updated)
        if (selectedOrder?.orderNumber === updatedOrder.orderNumber) {
          setSelectedOrder(updatedOrder)
        }
        toast.success('Statut mis à jour')
      }
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  // Get status progress percentage
  const getStatusProgress = (status: string): number => {
    const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'delivered']
    const index = statusOrder.indexOf(status)
    if (status === 'cancelled') return 0
    return index >= 0 ? ((index + 1) / statusOrder.length) * 100 : 0
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock
      case 'confirmed': return Check
      case 'preparing': return ChefHat
      case 'ready': return CheckCircle
      case 'delivered': return Package
      case 'cancelled': return X
      default: return Clock
    }
  }

  // Save restaurant settings
  const saveSettings = async () => {
    if (!currentRestaurant) {
      toast.error('Restaurant non trouvé')
      return
    }

    if (!settingsForm.name.trim()) {
      toast.error('Le nom du restaurant est obligatoire')
      return
    }

    setSavingSettings(true)

    try {
      const res = await fetch('/api/restaurants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentRestaurant,
          name: settingsForm.name.trim(),
          phone: settingsForm.phone.trim() || null,
          address: settingsForm.address.trim() || null,
          email: settingsForm.email.trim() || null,
          description: settingsForm.description.trim() || null,
          taxRate: parseFloat(settingsForm.taxRate) / 100 || 0.18,
          currency: settingsForm.currency || 'XOF',
          serviceType: settingsForm.serviceType,
          orderModes: settingsForm.serviceType === 'online' ? 'takeaway,delivery' : 'dine_in,takeaway,delivery',
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast.success('Paramètres enregistrés avec succès!')
        // Refresh restaurant data
        refreshRestaurantData()
      } else {
        toast.error(data.error || 'Erreur lors de la sauvegarde')
      }
    } catch {
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      setSavingSettings(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-xl"
          >
            <UtensilsCrossed className="w-8 h-8 text-white" />
          </motion.div>
          <p className="text-slate-600 font-medium">Chargement...</p>
        </motion.div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#FFFBF5] text-[#1C1917] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden font-sans">
        <div className="fixed inset-0 pointer-events-none opacity-[0.035] bg-noise" />
        <div className="max-w-md w-full bg-white border border-[#FDE8CD] rounded-3xl p-8 shadow-2xl shadow-[#1C1917]/5 space-y-6 relative z-10">
          <div className="w-20 h-20 bg-[#FFF7ED] border-2 border-[#FDE8CD] rounded-3xl flex items-center justify-center mx-auto shadow-md">
            <UtensilsCrossed className="w-10 h-10 text-[#EA580C]" />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-[#EA580C] bg-[#FFF7ED] border border-[#FDE8CD] px-3 py-1 rounded-full inline-block">
              Restaurant non activé
            </span>
            <h1 className="text-2xl font-extrabold text-[#1C1917] tracking-tight font-heading">
              Restaurant Introuvable
            </h1>
            <p className="text-sm text-[#78716C] leading-relaxed">
              Ce restaurant n&apos;est pas encore créé ou son abonnement n&apos;est pas actif. Vous pouvez tester la démo publique ou créer et activer votre propre restaurant dès maintenant.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/souscrire"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-[#EA580C] hover:bg-[#C2410C] text-white font-extrabold text-sm shadow-md shadow-[#EA580C]/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Crown className="w-4 h-4" />
              <span>Souscrire & Débloquer mon Restaurant</span>
            </Link>
            <Link
              href="/le-jardin-savoureux"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#FFF7ED] hover:bg-[#FDE8CD] text-[#EA580C] font-bold text-sm border border-[#FDE8CD] transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Tester la Démo Interactive</span>
            </Link>
            <Link
              href="/"
              className="text-xs font-semibold text-[#78716C] hover:text-[#1C1917] transition-colors pt-2"
            >
              ← Retour à l&apos;accueil Zagoor
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <motion.div 
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-slate-900">{restaurant?.name || 'Restaurant'}</h1>
                  {restaurant?.slug === 'le-jardin-savoureux' || restaurant?.id === 'demo-restaurant' ? (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100/80 border border-amber-300 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Espace Démo
                    </span>
                  ) : (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 border border-emerald-300 px-2 py-0.5 rounded-full">
                      <Crown className="w-3 h-3 text-emerald-600" /> Abonné Pro
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">{restaurant?.address || 'Menu Digital & Commandes'}</p>
              </div>
            </motion.div>

            <div className="flex items-center gap-2">
              {restaurant?.slug === 'le-jardin-savoureux' && (
                <Link
                  href="/souscrire"
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-bold shadow-sm transition-all hover:scale-105"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>S&apos;abonner / Créer mon resto</span>
                </Link>
              )}
              {/* Client Mode Switcher (Menu & Suivi) */}
              <div className="flex bg-[#FFF7ED] border border-[#FDE8CD] rounded-2xl p-1 shadow-xs">
                <button
                  onClick={() => setViewMode('menu')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                    viewMode === 'menu' 
                      ? "bg-[#EA580C] text-white shadow-sm" 
                      : "text-[#78716C] hover:text-[#1C1917]"
                  )}
                >
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span>Menu</span>
                </button>
                <button
                  onClick={() => setViewMode('tracking')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                    viewMode === 'tracking' 
                      ? "bg-[#EA580C] text-white shadow-sm" 
                      : "text-[#78716C] hover:text-[#1C1917]"
                  )}
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Suivi</span>
                </button>
              </div>

              {/* Cart Button */}
              {viewMode === 'menu' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCartOpen(true)}
                  className="relative p-2.5 sm:px-4 sm:py-2 rounded-2xl bg-gradient-to-br from-[#EA580C] to-[#C2410C] text-white shadow-md shadow-[#EA580C]/25 hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span className="hidden sm:inline font-bold text-xs">Panier</span>
                  {getItemCount() > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-5 h-5 rounded-full bg-[#1C1917] text-white text-[10px] flex items-center justify-center font-bold"
                    >
                      {getItemCount()}
                    </motion.span>
                  )}
                </motion.button>
              )}

              {/* Direct Link to Dedicated Admin Cockpit Portal */}
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-2xl border transition-all shadow-xs bg-white text-[#78716C] hover:text-[#EA580C] hover:bg-[#FFF7ED] border-[#FDE8CD]"
                title="Accès réservé au Cockpit Gérant & Cuisine"
              >
                <Lock className="w-3.5 h-3.5 text-[#EA580C]" />
                <span className="hidden md:inline">Espace Gérant</span>
              </Link>

              {/* User info or logout button if logged in */}
              {isAuthenticated && user && (
                <div className="flex items-center gap-1.5 pl-1 border-l border-[#FDE8CD]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    title="Se déconnecter"
                    className="text-[#78716C] hover:text-red-500 h-8 w-8 p-0 rounded-xl"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          {viewMode === 'menu' ? (
            <motion.div key="menu" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8 pb-16">
              {/* Demo Mode Notice Banner */}
              {(restaurant?.slug === 'le-jardin-savoureux' || restaurant?.id === 'demo-restaurant') && (
                <div className="bg-gradient-to-r from-[#FFF7ED] via-white to-[#FFF7ED] border-2 border-[#EA580C]/40 rounded-3xl p-4 sm:p-5 shadow-lg shadow-[#EA580C]/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 text-left">
                    <div className="w-11 h-11 rounded-2xl bg-[#EA580C] text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-[#EA580C]/30">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-[#EA580C] bg-[#FFF7ED] border border-[#FDE8CD] px-2.5 py-0.5 rounded-full">
                          Démonstration Interactive
                        </span>
                        <span className="text-xs text-[#78716C]">Vous testez actuellement la version d&apos;essai</span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-[#1C1917] mt-1">
                        Pour créer votre propre espace restaurant, imprimer vos QR Codes et connecter votre WhatsApp :
                      </p>
                    </div>
                  </div>
                  <a
                    href="/souscrire"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#EA580C] hover:bg-[#C2410C] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-[#EA580C]/25 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
                  >
                    <Crown className="w-4 h-4" />
                    <span>S&apos;abonner pour 5 500 F/mois</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </a>
                </div>
              )}

              {/* Hero Restaurant Banner */}
              {restaurant?.banner && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-[2.5rem] overflow-hidden h-72 sm:h-88 xl:h-96 shadow-2xl border-2 border-[#FDE8CD]">
                  <Image src={restaurant.banner} alt={restaurant.name} fill sizes="100vw" className="object-cover" priority />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/15" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 text-white space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#EA580C] bg-white px-3 py-1 rounded-full shadow-md">
                        Menu Digital & Commandes
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-white/15">
                        <Star className="w-3.5 h-3.5 fill-current text-amber-400" /> 4.9/5 (140+ avis)
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md border border-white/15">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Ouvert • Service en salle & livraison
                      </span>
                    </div>

                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight font-heading text-white">{restaurant.name}</h2>
                    <p className="text-white/90 text-xs sm:text-base max-w-3xl font-medium leading-relaxed">{restaurant.description}</p>
                    
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      {restaurant.address && (
                        <span className="flex items-center gap-1.5 text-white/90 text-xs font-semibold bg-black/40 px-3.5 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                          <MapPin className="w-3.5 h-3.5 text-[#EA580C]" /> {restaurant.address}
                        </span>
                      )}
                      {restaurant.phone && (
                        <a href={`tel:${restaurant.phone}`} className="flex items-center gap-1.5 text-white/90 hover:text-white text-xs font-semibold bg-black/40 hover:bg-black/60 px-3.5 py-1.5 rounded-full backdrop-blur-md border border-white/10 transition-colors">
                          <Phone className="w-3.5 h-3.5 text-[#EA580C]" /> {restaurant.phone}
                        </a>
                      )}
                      <span className="flex items-center gap-1.5 text-white/90 text-xs font-semibold bg-black/40 px-3.5 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                        <Clock className="w-3.5 h-3.5 text-[#EA580C]" /> 15 - 25 min de préparation
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Dine-in Table & Waiter Service Bar */}
              {restaurant?.serviceType !== 'online' && (
                <div className="bg-white border-2 border-[#FDE8CD] rounded-3xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-[#FFF7ED] border border-[#FDE8CD] text-[#EA580C] flex items-center justify-center font-extrabold flex-shrink-0 shadow-xs">
                      <UtensilsCrossed className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-[#1C1917]">
                          {tableNumber ? `Service en Table : ${tableNumber}` : 'Service en Salle & Terrasse'}
                        </span>
                        {tableNumber && (
                          <span className="px-2.5 py-0.5 rounded-full bg-[#EA580C] text-white text-xs font-black font-mono shadow-xs">
                            {tableNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#78716C] mt-0.5">
                        {tableNumber
                          ? 'Vos commandes et boissons seront servies directement à votre table.'
                          : 'Scannez le QR Code de votre chevalet de table ou choisissez votre numéro ci-contre.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <Select value={tableNumber || ''} onValueChange={setTable}>
                      <SelectTrigger className="w-40 h-10 bg-[#FFFBF5] border-2 border-[#FDE8CD] rounded-2xl text-xs font-bold text-[#1C1917] focus:ring-[#EA580C]">
                        <SelectValue placeholder="Changer table" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-2 border-[#FDE8CD]">
                        {restaurant?.tables && restaurant.tables.length > 0 ? (
                          restaurant.tables.map((t) => (
                            <SelectItem key={t.id} value={t.number} className="text-xs font-bold">
                              🍽️ Table {t.number}
                            </SelectItem>
                          ))
                        ) : (
                          Array.from({ length: 10 }, (_, i) => (
                            <SelectItem key={`T${i + 1}`} value={`T${i + 1}`} className="text-xs font-bold">
                              🍽️ Table T{i + 1}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>

                    <Button
                      onClick={() => setCallWaiterModalOpen(true)}
                      variant="outline"
                      size="sm"
                      className="h-10 px-4 rounded-2xl border-2 border-[#FDE8CD] bg-[#FFF7ED] text-[#EA580C] hover:bg-[#EA580C] hover:text-white font-extrabold text-xs transition-all gap-2 shadow-xs"
                    >
                      <Bell className="w-4 h-4" />
                      <span>Appeler le Serveur</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Sticky Search, Category Selector & Layout Switcher */}
              <div className="sticky top-16 z-30 bg-[#FFFBF5]/95 backdrop-blur-xl pt-2 pb-3 border-b border-[#FDE8CD] space-y-3">
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                  {/* Search Input */}
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
                    <Input 
                      value={searchQuery} 
                      onChange={(e) => setSearchQuery(e.target.value)} 
                      placeholder="Rechercher un plat, une grillade, une boisson..." 
                      className="pl-11 pr-10 h-12 bg-white border-2 border-[#FDE8CD] focus-visible:ring-[#EA580C] rounded-2xl text-sm font-medium shadow-xs" 
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#78716C] hover:text-[#1C1917] bg-[#FFF7ED] w-6 h-6 rounded-full flex items-center justify-center"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Layout View Switcher (Grid / Compact List) */}
                  <div className="flex items-center gap-1.5 bg-white border-2 border-[#FDE8CD] p-1 rounded-2xl shadow-xs self-end sm:self-auto flex-shrink-0">
                    <button
                      onClick={() => setViewLayout('grid')}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all",
                        viewLayout === 'grid'
                          ? "bg-[#EA580C] text-white shadow-xs"
                          : "text-[#78716C] hover:text-[#1C1917] hover:bg-[#FFF7ED]"
                      )}
                      title="Affichage en Grille Gourmande"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Grille Visuelle</span>
                    </button>
                    <button
                      onClick={() => setViewLayout('compact')}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all",
                        viewLayout === 'compact'
                          ? "bg-[#EA580C] text-white shadow-xs"
                          : "text-[#78716C] hover:text-[#1C1917] hover:bg-[#FFF7ED]"
                      )}
                      title="Affichage en Liste Carte Restaurant"
                    >
                      <List className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Carte Épurée</span>
                    </button>
                  </div>
                </div>

                {/* Horizontal Category Navigation Bar with Badges */}
                <ScrollArea className="whitespace-nowrap pb-1">
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={() => setSelectedCategory(null)} 
                      className={cn(
                        "rounded-2xl text-xs font-extrabold px-4 py-5 transition-all shadow-xs gap-2", 
                        !selectedCategory 
                          ? "bg-[#EA580C] hover:bg-[#C2410C] text-white shadow-md shadow-[#EA580C]/20 border-0" 
                          : "bg-white hover:bg-[#FFF7ED] text-[#78716C] border-2 border-[#FDE8CD]"
                      )}
                    >
                      <span>🍽️ Tout le Menu</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold font-mono",
                        !selectedCategory ? "bg-white/20 text-white" : "bg-[#FFF7ED] text-[#EA580C]"
                      )}>
                        {allProducts.length}
                      </span>
                    </Button>
                    {restaurant?.categories.map((cat) => (
                      <Button 
                        key={cat.id} 
                        onClick={() => setSelectedCategory(cat.id)} 
                        className={cn(
                          "rounded-2xl text-xs font-extrabold px-4 py-5 transition-all whitespace-nowrap shadow-xs gap-2", 
                          selectedCategory === cat.id 
                            ? "bg-[#EA580C] hover:bg-[#C2410C] text-white shadow-md shadow-[#EA580C]/20 border-0" 
                            : "bg-white hover:bg-[#FFF7ED] text-[#78716C] border-2 border-[#FDE8CD]"
                        )}
                      >
                        <span className="text-sm">{cat.icon || '🍽️'}</span>
                        <span>{cat.name}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold font-mono",
                          selectedCategory === cat.id ? "bg-white/20 text-white" : "bg-[#FFF7ED] text-[#EA580C]"
                        )}>
                          {cat.products.length}
                        </span>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* 1. Featured / Incontournables - Perfectly Balanced 4-Column Grid */}
              {featuredProducts.length > 0 && !searchQuery && !selectedCategory && (
                <motion.section initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#EA580C] text-white flex items-center justify-center shadow-md shadow-[#EA580C]/30">
                        <Flame className="w-4 h-4 fill-current" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-black text-[#1C1917] font-heading">
                          Suggestions & Incontournables du Chef
                        </h3>
                        <p className="text-xs text-[#78716C]">Nos spécialités les plus plébiscitées par nos clients</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {featuredProducts.slice(0, 4).map((product) => {
                      const cartItem = items.find(i => i.id === product.id)
                      const cartQty = cartItem ? cartItem.quantity : 0
                      return (
                        <div
                          key={product.id}
                          className="group bg-white rounded-3xl overflow-hidden border-2 border-[#FDE8CD] shadow-[0_4px_20px_rgba(28,25,23,0.04)] hover:shadow-[0_16px_36px_rgba(234,88,12,0.14)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
                        >
                          {/* Card Image Banner */}
                          <div 
                            onClick={() => openProductDetail(product)}
                            className="relative h-48 w-full overflow-hidden bg-[#FFF7ED] cursor-pointer"
                          >
                            {product.image ? (
                              <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                className="object-cover group-hover:scale-108 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#EA580C]/40">
                                <UtensilsCrossed className="w-12 h-12" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 pointer-events-none" />
                            <div className="absolute top-3 left-3">
                              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-white bg-[#EA580C] px-2.5 py-1 rounded-full shadow-md">
                                <Flame className="w-3 h-3 fill-current" /> Populaire
                              </span>
                            </div>
                            {product.preparationTime && (
                              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                <Clock className="w-3 h-3 text-[#EA580C]" />
                                <span>{product.preparationTime} min</span>
                              </div>
                            )}
                          </div>

                          {/* Card Info */}
                          <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3.5">
                            <div 
                              onClick={() => openProductDetail(product)}
                              className="space-y-1 cursor-pointer"
                            >
                              <h4 className="font-black text-[#1C1917] text-base font-heading leading-snug group-hover:text-[#EA580C] transition-colors">
                                {product.name}
                              </h4>
                              {product.description && (
                                <p className="text-xs text-[#78716C] line-clamp-2 leading-relaxed">
                                  {product.description}
                                </p>
                              )}
                            </div>

                            <div className="pt-3 border-t border-[#FDE8CD] flex items-center justify-between gap-2">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider">Prix</span>
                                <span className="text-base sm:text-lg font-black text-[#EA580C] font-mono tracking-tight">
                                  {formatCurrency(product.price, restaurant?.currency)}
                                </span>
                              </div>

                              {cartQty > 0 ? (
                                <div className="flex items-center gap-1 bg-[#EA580C] text-white p-1 rounded-2xl shadow-md shadow-[#EA580C]/25">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveFromCart(product.id)}
                                    className="w-7 h-7 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors active:scale-90"
                                    aria-label="Diminuer"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="font-bold text-xs px-1.5 font-mono">{cartQty}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleAddToCart(product)}
                                    className="w-7 h-7 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors active:scale-90"
                                    aria-label="Augmenter"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => handleAddToCart(product)}
                                  className="bg-[#FFF7ED] hover:bg-[#EA580C] text-[#EA580C] hover:text-white border border-[#FDE8CD] hover:border-[#EA580C] rounded-2xl font-extrabold text-xs px-3.5 py-2 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] shadow-xs flex items-center gap-1.5"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Commander</span>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.section>
              )}

              {/* 2. Menu Organized by Categories */}
              {!searchQuery && (
                <div className="space-y-12">
                  {restaurant?.categories.filter(cat => !selectedCategory || cat.id === selectedCategory).map((category, catIndex) => (
                    <motion.section 
                      key={category.id} 
                      initial={{ opacity: 0, y: 15 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ delay: 0.04 * catIndex }} 
                      className="space-y-5"
                    >
                      {/* Category Header */}
                      <div className="flex items-center justify-between pb-3 border-b-2 border-[#FDE8CD]">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{category.icon || '🍽️'}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xl sm:text-2xl font-black text-[#1C1917] font-heading">{category.name}</h3>
                              <span className="px-2.5 py-0.5 rounded-full bg-[#FFF7ED] border border-[#FDE8CD] text-[#EA580C] text-xs font-bold font-mono">
                                {category.products.length} plat{category.products.length > 1 ? 's' : ''}
                              </span>
                            </div>
                            {category.description && (
                              <p className="text-xs text-[#78716C] mt-0.5">{category.description}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Display Mode A: Grid Layout */}
                      {viewLayout === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                          {category.products.map((product) => {
                            const cartItem = items.find(i => i.id === product.id)
                            const cartQty = cartItem ? cartItem.quantity : 0
                            return (
                              <div
                                key={product.id}
                                className="group bg-white rounded-3xl overflow-hidden border-2 border-[#FDE8CD] shadow-[0_4px_20px_rgba(28,25,23,0.04)] hover:shadow-[0_16px_36px_rgba(234,88,12,0.12)] hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between"
                              >
                                <div 
                                  onClick={() => openProductDetail(product)}
                                  className="relative h-44 sm:h-48 w-full overflow-hidden bg-[#FFF7ED] cursor-pointer"
                                >
                                  {product.image ? (
                                    <Image
                                      src={product.image}
                                      alt={product.name}
                                      fill
                                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                      className="object-cover group-hover:scale-108 transition-transform duration-500"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[#EA580C]/40">
                                      <UtensilsCrossed className="w-12 h-12" />
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10 pointer-events-none" />
                                  {product.isFeatured && (
                                    <div className="absolute top-3 left-3">
                                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-white bg-[#EA580C] px-2.5 py-1 rounded-full shadow-md">
                                        <Flame className="w-3 h-3 fill-current" /> Spécialité
                                      </span>
                                    </div>
                                  )}
                                  {product.preparationTime && (
                                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                                      <Clock className="w-3 h-3 text-[#EA580C]" />
                                      <span>{product.preparationTime} min</span>
                                    </div>
                                  )}
                                </div>
                                <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3.5">
                                  <div 
                                    onClick={() => openProductDetail(product)}
                                    className="space-y-1 cursor-pointer"
                                  >
                                    <h4 className="font-extrabold text-[#1C1917] text-base font-heading leading-snug group-hover:text-[#EA580C] transition-colors">
                                      {product.name}
                                    </h4>
                                    {product.description && (
                                      <p className="text-xs text-[#78716C] line-clamp-2 leading-relaxed">
                                        {product.description}
                                      </p>
                                    )}
                                  </div>
                                  <div className="pt-3 border-t border-[#FDE8CD] flex items-center justify-between gap-2">
                                    <div className="flex flex-col">
                                      <span className="text-[10px] font-bold text-[#78716C] uppercase tracking-wider">Prix</span>
                                      <span className="text-base sm:text-lg font-black text-[#EA580C] font-mono tracking-tight">
                                        {formatCurrency(product.price, restaurant?.currency)}
                                      </span>
                                    </div>
                                    {cartQty > 0 ? (
                                      <div className="flex items-center gap-1 bg-[#EA580C] text-white p-1 rounded-2xl shadow-md shadow-[#EA580C]/25">
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveFromCart(product.id)}
                                          className="w-7 h-7 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors active:scale-90"
                                          aria-label="Diminuer"
                                        >
                                          <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="font-bold text-xs px-1.5 font-mono">{cartQty}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleAddToCart(product)}
                                          className="w-7 h-7 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors active:scale-90"
                                          aria-label="Augmenter"
                                        >
                                          <Plus className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    ) : (
                                      <Button
                                        size="sm"
                                        onClick={() => handleAddToCart(product)}
                                        className="bg-[#FFF7ED] hover:bg-[#EA580C] text-[#EA580C] hover:text-white border border-[#FDE8CD] hover:border-[#EA580C] rounded-2xl font-extrabold text-xs px-3.5 py-2 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] shadow-xs flex items-center gap-1.5"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Commander</span>
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        /* Display Mode B: Compact List Menu Layout */
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {category.products.map((product) => {
                            const cartItem = items.find(i => i.id === product.id)
                            const cartQty = cartItem ? cartItem.quantity : 0
                            return (
                              <div
                                key={product.id}
                                className="group bg-white rounded-3xl p-3 sm:p-4 border-2 border-[#FDE8CD] shadow-xs hover:shadow-lg hover:border-[#EA580C]/50 transition-all flex items-center justify-between gap-4"
                              >
                                <div 
                                  onClick={() => openProductDetail(product)}
                                  className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
                                >
                                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-[#FFF7ED] flex-shrink-0 border border-[#FDE8CD]">
                                    {product.image ? (
                                      <Image src={product.image} alt={product.name} fill sizes="100px" className="object-cover group-hover:scale-108 transition-transform duration-300" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-[#EA580C]/40">
                                        <UtensilsCrossed className="w-8 h-8" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="space-y-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-extrabold text-[#1C1917] text-sm sm:text-base font-heading truncate group-hover:text-[#EA580C] transition-colors">
                                        {product.name}
                                      </h4>
                                      {product.isFeatured && (
                                        <span className="text-[9px] font-black uppercase text-[#EA580C] bg-[#FFF7ED] border border-[#FDE8CD] px-2 py-0.2 rounded-full">
                                          ★ Chef
                                        </span>
                                      )}
                                    </div>
                                    {product.description && (
                                      <p className="text-xs text-[#78716C] line-clamp-2 leading-relaxed">
                                        {product.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 text-[11px] text-[#78716C] pt-0.5">
                                      {product.preparationTime && (
                                        <span className="flex items-center gap-1 font-medium">
                                          <Clock className="w-3 h-3 text-[#EA580C]" /> {product.preparationTime} min
                                        </span>
                                      )}
                                      {product.calories && (
                                        <span>• {product.calories} kcal</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                  <span className="text-base sm:text-lg font-black text-[#EA580C] font-mono">
                                    {formatCurrency(product.price, restaurant?.currency)}
                                  </span>
                                  {cartQty > 0 ? (
                                    <div className="flex items-center gap-1 bg-[#EA580C] text-white p-1 rounded-2xl shadow-xs">
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveFromCart(product.id)}
                                        className="w-6 h-6 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors active:scale-90"
                                        aria-label="Diminuer"
                                      >
                                        <Minus className="w-3 h-3" />
                                      </button>
                                      <span className="font-bold text-xs px-1 font-mono">{cartQty}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleAddToCart(product)}
                                        className="w-6 h-6 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors active:scale-90"
                                        aria-label="Augmenter"
                                      >
                                        <Plus className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={() => handleAddToCart(product)}
                                      className="bg-[#FFF7ED] hover:bg-[#EA580C] text-[#EA580C] hover:text-white border border-[#FDE8CD] rounded-xl font-bold text-xs px-3 h-8 shadow-xs"
                                    >
                                      <Plus className="w-3 h-3 mr-1" />
                                      Ajouter
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </motion.section>
                  ))}
                </div>
              )}

              {/* Search Results Display */}
              {searchQuery && (
                <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                  <div className="flex items-center justify-between pb-2 border-b border-[#FDE8CD]">
                    <h3 className="text-lg font-black text-[#1C1917] font-heading">
                      {filteredProducts.length} résultat{filteredProducts.length > 1 ? 's' : ''} pour &quot;{searchQuery}&quot;
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')} className="text-xs text-[#EA580C] font-bold">
                      Effacer recherche
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {filteredProducts.map((product) => {
                      const cartItem = items.find(i => i.id === product.id)
                      const cartQty = cartItem ? cartItem.quantity : 0
                      return (
                        <div
                          key={product.id}
                          className="group bg-white rounded-3xl overflow-hidden border-2 border-[#FDE8CD] shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
                        >
                          <div 
                            onClick={() => openProductDetail(product)}
                            className="relative h-44 w-full overflow-hidden bg-[#FFF7ED] cursor-pointer"
                          >
                            {product.image ? (
                              <Image src={product.image} alt={product.name} fill sizes="(max-width: 768px) 100vw, 25vw" className="object-cover group-hover:scale-108 transition-transform duration-300" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#EA580C]/40">
                                <UtensilsCrossed className="w-10 h-10" />
                              </div>
                            )}
                          </div>
                          <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                            <div 
                              onClick={() => openProductDetail(product)}
                              className="cursor-pointer space-y-1"
                            >
                              <h4 className="font-extrabold text-[#1C1917] text-base font-heading">{product.name}</h4>
                              <p className="text-xs text-[#78716C] line-clamp-2">{product.description}</p>
                            </div>
                            <div className="pt-2 border-t border-[#FDE8CD] flex items-center justify-between">
                              <span className="font-black text-[#EA580C] text-base font-mono">{formatCurrency(product.price, restaurant?.currency)}</span>
                              <Button size="sm" onClick={() => handleAddToCart(product)} className="bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl font-bold text-xs px-3">
                                <Plus className="w-3.5 h-3.5 mr-1" /> Commander
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </motion.section>
              )}

              {/* Floating Bottom Cart Bar (Appears when cart has items) */}
              {getItemCount() > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 30, scale: 0.95 }}
                  className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4"
                >
                  <div 
                    onClick={() => setCartOpen(true)}
                    className="bg-[#1C1917]/95 hover:bg-[#1C1917] text-white backdrop-blur-2xl border-2 border-[#EA580C]/40 rounded-full p-3 sm:p-3.5 shadow-2xl shadow-[#EA580C]/25 flex items-center justify-between gap-4 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center gap-3 pl-2">
                      <div className="w-10 h-10 rounded-full bg-[#EA580C] text-white flex items-center justify-center font-bold text-sm shadow-md">
                        <ShoppingCart className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white/90">
                            {getItemCount()} article{getItemCount() > 1 ? 's' : ''} sélectionné{getItemCount() > 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className="text-base sm:text-lg font-black font-mono text-[#EA580C]">
                          {formatCurrency(getTotal(), restaurant?.currency)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-[#EA580C] hover:bg-[#C2410C] text-white px-5 py-2.5 rounded-full font-extrabold text-xs sm:text-sm shadow-md transition-colors">
                      <span>Voir la commande</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : viewMode === 'tracking' ? (
            <motion.div key="tracking" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
              {/* Tracking Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Suivi de Commande</h2>
                <p className="text-slate-500">Suivez l&apos;évolution de votre commande en temps réel</p>
              </div>

              {/* Search Section */}
              <Card className="border-slate-200 shadow-sm mb-6">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Search Type Toggle */}
                    <div className="flex gap-2">
                      <Button
                        variant={searchType === 'orderNumber' ? 'default' : 'outline'}
                        className={cn("flex-1", searchType === 'orderNumber' && "bg-amber-500 hover:bg-amber-600")}
                        onClick={() => setSearchType('orderNumber')}
                      >
                        <Receipt className="w-4 h-4 mr-2" />
                        N° Commande
                      </Button>
                      <Button
                        variant={searchType === 'phone' ? 'default' : 'outline'}
                        className={cn("flex-1", searchType === 'phone' && "bg-amber-500 hover:bg-amber-600")}
                        onClick={() => setSearchType('phone')}
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Téléphone
                      </Button>
                    </div>

                    {/* Search Input */}
                    <div className="flex-1 flex gap-2">
                      <div className="relative flex-1">
                        {searchType === 'orderNumber' ? (
                          <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        ) : (
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        )}
                        <Input
                          value={searchValue}
                          onChange={(e) => setSearchValue(e.target.value)}
                          placeholder={searchType === 'orderNumber' ? 'Ex: ORD-001' : 'Ex: +229 97 12 34 56'}
                          className="pl-10 h-12"
                          onKeyDown={(e) => e.key === 'Enter' && searchOrders()}
                        />
                      </div>
                      <Button
                        className="h-12 px-6 bg-amber-500 hover:bg-amber-600"
                        onClick={searchOrders}
                        disabled={searching}
                      >
                        {searching ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Search className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Quick search with saved phone */}
                  {customerPhone && searchType === 'phone' && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-sm text-slate-500">Récent:</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchValue(customerPhone)
                          setTimeout(searchOrders, 100)
                        }}
                      >
                        {customerPhone}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tracked Orders */}
              {trackedOrders.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Orders List */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-amber-500" />
                        Vos Commandes ({trackedOrders.length})
                      </h3>
                      <Button variant="ghost" size="sm" onClick={() => setTrackedOrders([])} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        Vider
                      </Button>
                    </div>
                    <ScrollArea className="h-[500px] pr-4">
                      <div className="space-y-3">
                        {trackedOrders.map((order, index) => {
                          const StatusIcon = getStatusIcon(order.status)
                          const isActive = selectedOrder?.id === order.id

                          return (
                            <motion.div
                              key={order.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={cn(
                                "bg-white rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-md",
                                isActive ? "border-amber-500 shadow-md" : "border-slate-200"
                              )}
                              onClick={() => setSelectedOrder(order)}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900">#{order.orderNumber}</span>
                                    <Badge className={cn("border", statusColors[order.status])}>
                                      {statusLabels[order.status]}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-slate-500 mt-1">
                                    {new Date(order.createdAt).toLocaleString('fr-FR')}
                                  </p>
                                </div>
                                <div className={cn(
                                  "w-10 h-10 rounded-full flex items-center justify-center",
                                  statusColors[order.status].split(' ')[0].replace('/10', '')
                                )}>
                                  <StatusIcon className="w-5 h-5" />
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div className="mb-3">
                                <Progress
                                  value={getStatusProgress(order.status)}
                                  className="h-2"
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-500">
                                  {order.items.length} article(s)
                                </span>
                                <span className="font-bold text-amber-600">
                                  {formatCurrency(order.total, restaurant?.currency)}
                                </span>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Order Details */}
                  {selectedOrder && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden"
                    >
                      {/* Order Header */}
                      <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-white/80 text-sm">Commande</p>
                            <h3 className="text-2xl font-bold">#{selectedOrder.orderNumber}</h3>
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => refreshOrderStatus(selectedOrder.orderNumber)}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Actualiser
                          </Button>
                        </div>
                      </div>

                      {/* Status Timeline */}
                      <div className="p-6 border-b border-slate-100">
                        <h4 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                          <Timer className="w-5 h-5 text-amber-500" />
                          Évolution de votre commande
                        </h4>
                        <div className="relative">
                          {['pending', 'confirmed', 'preparing', 'ready', 'delivered'].map((status, index) => {
                            const StatusIcon = getStatusIcon(status)
                            const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'delivered']
                            const currentIndex = statusOrder.indexOf(selectedOrder.status)
                            const isCompleted = index <= currentIndex && selectedOrder.status !== 'cancelled'
                            const isCurrent = status === selectedOrder.status
                            const isCancelled = selectedOrder.status === 'cancelled'

                            return (
                              <div key={status} className="flex items-start mb-4 last:mb-0">
                                <div className="relative">
                                  <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                    isCompleted && !isCancelled ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-400",
                                    isCurrent && !isCancelled && "ring-4 ring-amber-200"
                                  )}>
                                    {isCurrent && !isCancelled ? (
                                      <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 1, repeat: Infinity }}
                                      >
                                        <StatusIcon className="w-5 h-5" />
                                      </motion.div>
                                    ) : (
                                      <StatusIcon className="w-5 h-5" />
                                    )}
                                  </div>
                                  {index < 4 && (
                                    <div className={cn(
                                      "absolute left-1/2 top-10 w-0.5 h-8 -translate-x-1/2",
                                      isCompleted && !isCancelled ? "bg-amber-500" : "bg-slate-200"
                                    )} />
                                  )}
                                </div>
                                <div className="ml-4 flex-1">
                                  <p className={cn(
                                    "font-medium",
                                    isCompleted && !isCancelled ? "text-slate-900" : "text-slate-400"
                                  )}>
                                    {statusLabels[status]}
                                  </p>
                                  {isCurrent && !isCancelled && (
                                    <p className="text-sm text-amber-600">En cours...</p>
                                  )}
                                </div>
                              </div>
                            )
                          })}

                          {/* Cancelled state */}
                          {selectedOrder.status === 'cancelled' && (
                            <div className="flex items-start">
                              <div className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center">
                                <X className="w-5 h-5" />
                              </div>
                              <div className="ml-4">
                                <p className="font-medium text-red-600">Commande Annulée</p>
                                <p className="text-sm text-slate-500">Votre commande a été annulée</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Order Info */}
                      <div className="p-6 border-b border-slate-100">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500">Type</p>
                            <p className="font-medium flex items-center gap-2">
                              {selectedOrder.type === 'dine_in' ? (
                                <>
                                  <Store className="w-4 h-4" />
                                  Sur place {selectedOrder.tableNumber && `(Table ${selectedOrder.tableNumber})`}
                                </>
                              ) : (
                                <>
                                  <Truck className="w-4 h-4" />
                                  À emporter
                                </>
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">Paiement</p>
                            <p className="font-medium">
                              {selectedOrder.paymentStatus === 'paid' ? (
                                <span className="text-green-600">Payé</span>
                              ) : (
                                <span className="text-amber-600">En attente</span>
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">Nom</p>
                            <p className="font-medium">{selectedOrder.customerName}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Téléphone</p>
                            <p className="font-medium">{selectedOrder.customerPhone}</p>
                          </div>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="p-6">
                        <h4 className="font-semibold text-slate-900 mb-4">Articles commandés</h4>
                        <div className="space-y-3">
                          {selectedOrder.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 bg-slate-50 rounded-lg p-3">
                              {item.product.image && (
                                <img
                                  src={item.product.image}
                                  alt={item.product.name}
                                  className="w-12 h-12 rounded-lg object-cover"
                                />
                              )}
                              <div className="flex-1">
                                <p className="font-medium text-slate-900">{item.product.name}</p>
                                <p className="text-sm text-slate-500">Quantité: {item.quantity}</p>
                              </div>
                              <p className="font-semibold text-amber-600">
                                {formatCurrency(item.price * item.quantity, restaurant?.currency)}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Total */}
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-500">Sous-total</span>
                            <span>{formatCurrency(selectedOrder.subtotal, restaurant?.currency)}</span>
                          </div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-slate-500">TVA</span>
                            <span>{formatCurrency(selectedOrder.tax, restaurant?.currency)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-lg pt-2 border-t">
                            <span>Total</span>
                            <span className="text-amber-600">{formatCurrency(selectedOrder.total, restaurant?.currency)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      {selectedOrder.notes && (
                        <div className="p-6 bg-slate-50 border-t border-slate-100">
                          <p className="text-sm text-slate-500 flex items-center gap-2">
                            <MessageCircle className="w-4 h-4" />
                            Note: {selectedOrder.notes}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              ) : (
                /* Empty State */
                <div className="text-center py-16">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md mx-auto"
                  >
                    <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
                      <Navigation className="w-12 h-12 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      Suivez votre commande
                    </h3>
                    <p className="text-slate-500 mb-6">
                      Entrez votre numéro de commande ou votre numéro de téléphone pour voir l&apos;évolution de votre commande en temps réel.
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
                      <p className="text-sm text-amber-800 font-medium mb-2">💡 Astuce</p>
                      <p className="text-sm text-amber-700">
                        Le numéro de commande vous a été donné après avoir passé votre commande. Il commence généralement par &quot;ORD-&quot;.
                      </p>
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}>
              {/* Cockpit Top Bar */}
              <div className="bg-[#1C1917] text-white p-4 sm:p-5 rounded-3xl mb-8 shadow-2xl border border-[#292524] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#EA580C] flex items-center justify-center text-white shadow-md shadow-[#EA580C]/30 flex-shrink-0">
                    <ChefHat className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-extrabold text-base sm:text-xl text-white font-heading">
                        Cockpit Gérant • {restaurant?.name}
                      </h2>
                      <Badge className="bg-[#16A34A] text-white text-[10px] px-2.5 py-0.5 font-bold border-0 rounded-full">
                        👑 Espace Pro
                      </Badge>
                    </div>
                    <p className="text-xs text-[#A8A29E] mt-0.5">
                      Gestion des commandes, écran cuisine KDS, carte & studio photo IA, tables QR Code
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <Button
                    onClick={fetchDashboardData}
                    variant="outline"
                    size="sm"
                    className="border-[#44403C] bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Actualiser</span>
                  </Button>

                  <Button
                    onClick={() => setViewMode('menu')}
                    className="bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl text-xs font-bold gap-1.5 px-4 shadow-md shadow-[#EA580C]/20"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Retour au Menu Client</span>
                  </Button>
                </div>
              </div>

              {/* Demo Notice Banner inside Cockpit */}
              {(restaurant?.slug === 'le-jardin-savoureux' || restaurant?.id === 'demo-restaurant') && (
                <div className="bg-gradient-to-r from-[#FFF7ED] via-white to-[#FFF7ED] border-2 border-[#EA580C]/40 rounded-3xl p-4 sm:p-5 shadow-lg mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 text-left">
                    <div className="w-10 h-10 rounded-2xl bg-[#EA580C] text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-[#EA580C]/30">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black uppercase tracking-wider text-[#EA580C] bg-[#FFF7ED] border border-[#FDE8CD] px-2.5 py-0.5 rounded-full">
                          Démonstration Cockpit
                        </span>
                        <span className="text-xs text-[#78716C]">Mode essai public</span>
                      </div>
                      <p className="text-xs sm:text-sm font-bold text-[#1C1917] mt-0.5">
                        Ce cockpit est partagé pour la démo. Pour obtenir votre restaurant officiel avec vos tables et vos commandes privées, activez votre abonnement.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/souscrire"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-[#EA580C] hover:bg-[#C2410C] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-[#EA580C]/25 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
                  >
                    <Crown className="w-4 h-4" />
                    <span>Activer mon Restaurant (5 500 F/mois)</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              )}

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                  { title: "Revenus Aujourd'hui", value: formatCurrency(dashboardData?.overview?.todayRevenue || 0, restaurant?.currency), icon: DollarSign, gradient: "from-amber-500 to-orange-600" },
                  { title: "Commandes Aujourd'hui", value: dashboardData?.overview?.todayOrders || 0, icon: ShoppingCart, gradient: "from-emerald-500 to-teal-600" },
                  { title: "Revenus Mensuels", value: formatCurrency(dashboardData?.overview?.monthlyRevenue || 0, restaurant?.currency), icon: TrendingUp, gradient: "from-blue-500 to-indigo-600" },
                  { title: "Total Commandes", value: dashboardData?.overview?.totalOrders || 0, icon: Package, gradient: "from-purple-500 to-pink-600" },
                ].map((stat, index) => (
                  <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * (index + 1) }}>
                    <Card className={cn("border-0 text-white overflow-hidden relative", `bg-gradient-to-br ${stat.gradient}`)}>
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div><p className="text-white/80 text-sm">{stat.title}</p><p className="text-3xl font-bold mt-1">{stat.value}</p></div>
                          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center"><stat.icon className="w-6 h-6" /></div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Dashboard Tabs Navigation */}
              <Tabs value={dashboardTab} onValueChange={setDashboardTab} className="space-y-6">
                <div className="flex items-center justify-between overflow-x-auto pb-1">
                  <TabsList className="bg-white/80 backdrop-blur-md border-2 border-[#FDE8CD] p-1.5 rounded-2xl shadow-xs inline-flex h-auto gap-1">
                    <TabsTrigger
                      value="orders"
                      className="gap-2 px-3.5 py-2 rounded-xl text-xs font-bold data-[state=active]:bg-[#EA580C] data-[state=active]:text-white transition-all shadow-none"
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
                      className="gap-2 px-3.5 py-2 rounded-xl text-xs font-bold data-[state=active]:bg-[#EA580C] data-[state=active]:text-white transition-all shadow-none"
                    >
                      <Package className="w-4 h-4" />
                      <span>Carte & Stock</span>
                      <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-[#1C1917]/10 data-[state=active]:bg-white/20">
                        {allProducts.length}
                      </span>
                    </TabsTrigger>

                    <TabsTrigger
                      value="tables"
                      className="gap-2 px-3.5 py-2 rounded-xl text-xs font-bold data-[state=active]:bg-[#EA580C] data-[state=active]:text-white transition-all shadow-none"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Tables & QR Chevalets</span>
                      <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-[#1C1917]/10 data-[state=active]:bg-white/20">
                        {restaurant?.tables?.length || 10}
                      </span>
                    </TabsTrigger>

                    <TabsTrigger
                      value="analytics"
                      className="gap-2 px-3.5 py-2 rounded-xl text-xs font-bold data-[state=active]:bg-[#EA580C] data-[state=active]:text-white transition-all shadow-none"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>Analytiques</span>
                    </TabsTrigger>

                    <TabsTrigger
                      value="settings"
                      className="gap-2 px-3.5 py-2 rounded-xl text-xs font-bold data-[state=active]:bg-[#EA580C] data-[state=active]:text-white transition-all shadow-none"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Paramètres</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* 1. ORDERS TAB */}
                <TabsContent value="orders" className="space-y-4 outline-none">
                  <div className="bg-white border-2 border-[#FDE8CD] rounded-3xl p-5 shadow-sm space-y-4">
                    {/* Filter & Search Bar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
                        <Input
                          placeholder="Rechercher par n° commande, client, table ou téléphone..."
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
                            <SelectItem value="preparing">🍳 En préparation ({orders.filter(o => o.status === 'preparing').length})</SelectItem>
                            <SelectItem value="ready">🍽️ Prêtes ({orders.filter(o => o.status === 'ready').length})</SelectItem>
                            <SelectItem value="delivered">✅ Livrées / Servies ({orders.filter(o => o.status === 'delivered').length})</SelectItem>
                            <SelectItem value="cancelled">❌ Annulées ({orders.filter(o => o.status === 'cancelled').length})</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          onClick={fetchDashboardData}
                          variant="outline"
                          size="sm"
                          className="h-10 px-3 border-2 border-[#FDE8CD] rounded-2xl text-xs font-bold text-[#1C1917] hover:bg-[#FFF7ED]"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-[#EA580C]" />
                        </Button>
                      </div>
                    </div>

                    {/* Quick Status Badges Filter Bar */}
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

                    {/* Orders List Grid */}
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
                              {/* Order Card Header */}
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

                              {/* Customer & Items Body */}
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-3 text-xs">
                                {/* Customer Info */}
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

                                {/* Order Items List */}
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

                              {/* Action Buttons Toolbar */}
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
                  <div className="bg-white border-2 border-[#FDE8CD] rounded-3xl p-5 shadow-sm space-y-4">
                    {/* Header bar */}
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

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={openAddProduct}
                          className="bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-2xl text-xs font-bold gap-2 px-4 shadow-md shadow-[#EA580C]/20"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Nouveau Plat</span>
                        </Button>
                      </div>
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

                    {/* Products Grid */}
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
                              {/* Product Image & Badges */}
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

                              {/* Card Content */}
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
                  <div className="bg-white border-2 border-[#FDE8CD] rounded-3xl p-5 shadow-sm space-y-5">
                    {/* Header info */}
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
                          <span>Imprimer Chevalet de Table</span>
                        </Button>
                      </div>
                    </div>

                    {/* How it works info strip */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-[#FFFBF5] border border-[#FDE8CD] rounded-2xl text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#EA580C]/10 text-[#EA580C] font-bold flex items-center justify-center flex-shrink-0">
                          1
                        </div>
                        <div>
                          <strong className="text-[#1C1917] block">Posez sur les tables</strong>
                          <span className="text-[#78716C]">Imprimez les chevalets cartonnés ou plastifiés.</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#EA580C]/10 text-[#EA580C] font-bold flex items-center justify-center flex-shrink-0">
                          2
                        </div>
                        <div>
                          <strong className="text-[#1C1917] block">Scan sans application</strong>
                          <span className="text-[#78716C]">Fonctionne avec l&apos;appareil photo iPhone & Android.</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#EA580C]/10 text-[#EA580C] font-bold flex items-center justify-center flex-shrink-0">
                          3
                        </div>
                        <div>
                          <strong className="text-[#1C1917] block">Commande & KDS direct</strong>
                          <span className="text-[#78716C]">La commande arrive directement avec le n° de table.</span>
                        </div>
                      </div>
                    </div>

                    {/* Tables Grid */}
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
                                href={`/${restaurant?.slug || 'le-jardin-savoureux'}?table=${table.number}`}
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

                {/* 4. ANALYTICS & KPIS TAB */}
                <TabsContent value="analytics" className="space-y-5 outline-none">
                  {/* Top Overview Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-2 border-[#FDE8CD] bg-white rounded-3xl p-5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Chiffre d&apos;Affaires</p>
                          <p className="text-2xl font-black font-mono text-[#1C1917] mt-1">
                            {formatCurrency(dashboardData?.overview?.todayRevenue || 0, restaurant?.currency)}
                          </p>
                          <p className="text-[11px] text-[#16A34A] font-bold mt-1">
                            ↑ +{dashboardData?.overview?.revenueGrowth || 12}% vs hier
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-[#EA580C]/10 text-[#EA580C] flex items-center justify-center">
                          <DollarSign className="w-6 h-6" />
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
                          <p className="text-[11px] text-[#78716C] font-semibold mt-1">
                            Moyenne par client
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center">
                          <Receipt className="w-6 h-6" />
                        </div>
                      </div>
                    </Card>

                    <Card className="border-2 border-[#FDE8CD] bg-white rounded-3xl p-5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Commandes Servies</p>
                          <p className="text-2xl font-black font-mono text-[#1C1917] mt-1">
                            {dashboardData?.overview?.totalOrders || orders.length || 24}
                          </p>
                          <p className="text-[11px] text-[#16A34A] font-bold mt-1">
                            ✨ 100% de taux de complétion
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-[#0284C7]/10 text-[#0284C7] flex items-center justify-center">
                          <ShoppingCart className="w-6 h-6" />
                        </div>
                      </div>
                    </Card>

                    <Card className="border-2 border-[#FDE8CD] bg-white rounded-3xl p-5 shadow-xs">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Temps Moyen Service</p>
                          <p className="text-2xl font-black font-mono text-[#1C1917] mt-1">
                            14 min
                          </p>
                          <p className="text-[11px] text-[#16A34A] font-bold mt-1">
                            ⚡ -30% d&apos;attente grâce aux QR
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                          <Timer className="w-6 h-6" />
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Detailed Performance Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Top Selling Dishes */}
                    <div className="bg-white border-2 border-[#FDE8CD] rounded-3xl p-5 shadow-xs space-y-4">
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
                              count: 28 - idx * 4,
                              revenue: (28 - idx * 4) * p.price
                            }))
                        ).map((item, idx) => {
                          const percentage = Math.min(100, Math.round((item.count / 30) * 100))
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

                    {/* Breakdown & Payment Methods */}
                    <div className="bg-white border-2 border-[#FDE8CD] rounded-3xl p-5 shadow-xs space-y-4">
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
                          <Label htmlFor="restaurant-name" className="text-xs font-bold text-[#1C1917]">Nom du restaurant *</Label>
                          <Input
                            id="restaurant-name"
                            value={settingsForm.name}
                            onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                            placeholder="Le Jardin Savoureux"
                            className="mt-1 bg-[#FFFBF5] border-[#FDE8CD] rounded-xl text-xs"
                          />
                        </div>

                        <div>
                          <Label htmlFor="restaurant-phone" className="text-xs font-bold text-[#1C1917]">Téléphone & WhatsApp Pro *</Label>
                          <div className="relative mt-1">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
                            <Input
                              id="restaurant-phone"
                              value={settingsForm.phone}
                              onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                              placeholder="+229 97 12 34 56"
                              className="pl-10 bg-[#FFFBF5] border-[#FDE8CD] rounded-xl text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="restaurant-email" className="text-xs font-bold text-[#1C1917]">Email officiel</Label>
                          <div className="relative mt-1">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
                            <Input
                              id="restaurant-email"
                              type="email"
                              value={settingsForm.email}
                              onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                              placeholder="contact@restaurant.com"
                              className="pl-10 bg-[#FFFBF5] border-[#FDE8CD] rounded-xl text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="restaurant-address" className="text-xs font-bold text-[#1C1917]">Adresse physique</Label>
                          <div className="relative mt-1">
                            <MapPin className="absolute left-3 top-3 w-4 h-4 text-[#78716C]" />
                            <Textarea
                              id="restaurant-address"
                              value={settingsForm.address}
                              onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                              placeholder="Cotonou, Bénin"
                              className="pl-10 min-h-[70px] bg-[#FFFBF5] border-[#FDE8CD] rounded-xl text-xs"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="restaurant-description" className="text-xs font-bold text-[#1C1917]">Description du menu</Label>
                          <Textarea
                            id="restaurant-description"
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
                          {/* Modèle Opérationnel */}
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
                              <Label htmlFor="tax-rate" className="text-xs font-bold text-[#1C1917]">Taux de TVA (%)</Label>
                              <Input
                                id="tax-rate"
                                type="number"
                                value={settingsForm.taxRate}
                                onChange={(e) => setSettingsForm({ ...settingsForm, taxRate: e.target.value })}
                                placeholder="18"
                                className="mt-1 bg-[#FFFBF5] border-[#FDE8CD] rounded-xl text-xs font-mono"
                              />
                            </div>
                            <div>
                              <Label htmlFor="currency" className="text-xs font-bold text-[#1C1917]">Devise</Label>
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

                      {/* Quick Info Card */}
                      <Card className="border-2 border-[#FDE8CD] bg-[#FFF7ED] rounded-3xl shadow-none">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#EA580C]/10 flex items-center justify-center flex-shrink-0 text-[#EA580C]">
                              <Bell className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-[#1C1917]">Mise à jour en temps réel</h4>
                              <p className="text-[11px] text-[#78716C] mt-0.5">
                                Les modifications enregistrées ici sont répercutées instantanément sur les QR Codes et menus de vos clients.
                              </p>
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
                            Enregistrement...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Enregistrer les paramètres
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Cart Drawer */}
      <Dialog open={cartOpen} onOpenChange={setCartOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-amber-500" />Votre Panier ({getItemCount()} articles)</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-80">
            {items.length === 0 ? (
              <div className="text-center py-8 text-slate-400"><ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Votre panier est vide</p></div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                    {item.image && <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover" />}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm truncate">{item.name}</p>
                      <p className="text-amber-600 font-semibold text-sm">{formatCurrency(item.price, restaurant?.currency)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors mr-1" 
                        title="Supprimer du panier" 
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="w-3 h-3" /></Button>
                      <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="w-3 h-3" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          {items.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-slate-500">Sous-total</span><span>{formatCurrency(getTotal(), restaurant?.currency)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-500">TVA ({((restaurant?.taxRate || 0.18) * 100).toFixed(0)}%)</span><span>{formatCurrency(getTotal() * (restaurant?.taxRate || 0.18), restaurant?.currency)}</span></div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Total</span><span className="text-amber-600">{formatCurrency(getTotal() * (1 + (restaurant?.taxRate || 0.18)), restaurant?.currency)}</span></div>
              </div>
              <Button className="w-full bg-amber-500 hover:bg-amber-600" onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>Commander</Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-md bg-white border-2 border-[#FDE8CD] rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-[#1C1917] flex items-center gap-2">
              <Receipt className="w-5 h-5 text-[#EA580C]" />
              Finaliser la Commande
            </DialogTitle>
            <DialogDescription className="text-xs text-[#78716C]">
              {restaurant?.serviceType === 'online'
                ? 'Restaurant en ligne (Dark Kitchen) • Livraison & À emporter'
                : 'Choisissez votre mode de commande et vos coordonnées'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            {(restaurant?.slug === 'le-jardin-savoureux' || restaurant?.id === 'demo-restaurant' || targetSlug === 'le-jardin-savoureux') && (
              <div className="p-3 bg-[#FFF7ED] border border-[#EA580C]/30 rounded-2xl flex items-center gap-2.5 text-xs text-[#EA580C] font-semibold">
                <Sparkles className="w-4 h-4 flex-shrink-0 text-[#EA580C]" />
                <span>Mode Démo : Vous pouvez tester le passage de commande et les différents paiements sans aucun prélèvement ni redirection.</span>
              </div>
            )}
            <div>
              <Label className="font-bold text-xs text-[#1C1917] block mb-1.5">Mode de commande *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {restaurant?.serviceType !== 'online' && (
                  <Button
                    type="button"
                    variant={orderType === 'dine_in' ? 'default' : 'outline'}
                    className={cn(
                      "rounded-xl py-5 text-xs font-bold transition-all",
                      orderType === 'dine_in'
                        ? "bg-[#EA580C] hover:bg-[#C2410C] text-white shadow-md shadow-[#EA580C]/20"
                        : "border-[#FDE8CD] bg-white text-[#1C1917] hover:bg-[#FFF7ED]"
                    )}
                    onClick={() => setOrderType('dine_in')}
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5 mr-1.5" />
                    Sur place
                  </Button>
                )}

                <Button
                  type="button"
                  variant={orderType === 'takeaway' ? 'default' : 'outline'}
                  className={cn(
                    "rounded-xl py-5 text-xs font-bold transition-all",
                    orderType === 'takeaway'
                      ? "bg-[#EA580C] hover:bg-[#C2410C] text-white shadow-md shadow-[#EA580C]/20"
                      : "border-[#FDE8CD] bg-white text-[#1C1917] hover:bg-[#FFF7ED]"
                  )}
                  onClick={() => setOrderType('takeaway')}
                >
                  <Package className="w-3.5 h-3.5 mr-1.5" />
                  À emporter
                </Button>

                <Button
                  type="button"
                  variant={orderType === 'delivery' ? 'default' : 'outline'}
                  className={cn(
                    "rounded-xl py-5 text-xs font-bold transition-all",
                    orderType === 'delivery'
                      ? "bg-[#EA580C] hover:bg-[#C2410C] text-white shadow-md shadow-[#EA580C]/20"
                      : "border-[#FDE8CD] bg-white text-[#1C1917] hover:bg-[#FFF7ED]"
                  )}
                  onClick={() => setOrderType('delivery')}
                >
                  <Truck className="w-3.5 h-3.5 mr-1.5" />
                  Livraison
                </Button>
              </div>
            </div>

            {/* Table Selector (Hidden if online or not dine_in) */}
            {orderType === 'dine_in' && restaurant?.serviceType !== 'online' && (
              <div className="p-3 bg-[#FFF7ED] rounded-2xl border border-[#FDE8CD] space-y-1.5">
                <Label className="font-bold text-xs text-[#1C1917] flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-[#EA580C]" /> Numéro de table *
                </Label>
                <Select value={tableNumber || ''} onValueChange={setTable}>
                  <SelectTrigger className="mt-1 bg-white border-2 border-[#FDE8CD] rounded-xl font-bold">
                    <SelectValue placeholder="Sélectionnez une table" />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurant?.tables && restaurant.tables.length > 0 ? (
                      restaurant.tables.map((table) => (
                        <SelectItem key={table.id} value={table.number}>
                          🍽️ Table {table.number}
                        </SelectItem>
                      ))
                    ) : (
                      Array.from({ length: 10 }, (_, i) => (
                        <SelectItem key={`T${i + 1}`} value={`T${i + 1}`}>
                          🍽️ Table T{i + 1}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Delivery Address (Shown when delivery selected) */}
            {orderType === 'delivery' && (
              <div className="p-3 bg-[#FFF7ED] rounded-2xl border border-[#FDE8CD] space-y-1.5">
                <Label htmlFor="deliveryAddress" className="font-bold text-xs text-[#1C1917] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#EA580C]" /> Adresse / Quartier de livraison *
                </Label>
                <Input
                  id="deliveryAddress"
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                  placeholder="Ex: Cotonou, Haie Vive, Rue 310 / Indications..."
                  className="bg-white border-[#FDE8CD] rounded-xl text-xs"
                />
              </div>
            )}

            <PaymentMethodSelector
              selectedProvider={paymentProvider}
              onSelectProvider={setPaymentProvider}
              phoneNumber={paymentPhone || customerInfo.phone}
              onPhoneChange={(val) => {
                setPaymentPhone(val)
                if (!customerInfo.phone) {
                  setCustomerInfo(prev => ({ ...prev, phone: val }))
                }
              }}
              countryCode={countryCode}
              onCountryCodeChange={setCountryCode}
              allowCash={true}
              currency={restaurant?.currency}
              amount={getTotal() * (1 + (restaurant?.taxRate || 0.18))}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="name" className="text-xs font-bold text-[#1C1917]">Nom *</Label>
                <Input
                  id="name"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  placeholder="Votre nom"
                  className="border-[#FDE8CD] rounded-xl mt-1 text-xs"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-xs font-bold text-[#1C1917]">WhatsApp / Tél *</Label>
                <Input
                  id="phone"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  placeholder="+229 97 00 00 00"
                  className="border-[#FDE8CD] rounded-xl mt-1 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes" className="text-xs font-bold text-[#1C1917]">Notes (optionnel)</Label>
              <Textarea
                id="notes"
                value={customerInfo.notes}
                onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                placeholder="Instructions spéciales pour la cuisine..."
                rows={2}
                className="border-[#FDE8CD] rounded-xl mt-1 text-xs"
              />
            </div>

            <Separator className="bg-[#FDE8CD]" />

            <div className="flex justify-between font-extrabold text-base text-[#1C1917]">
              <span>Total à régler</span>
              <span className="text-[#EA580C] font-mono text-lg">
                {formatCurrency(getTotal() * (1 + (restaurant?.taxRate || 0.18)), restaurant?.currency)}
              </span>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                variant="outline"
                onClick={() => setCheckoutOpen(false)}
                disabled={isSubmittingCheckout}
                className="border-[#FDE8CD] rounded-xl text-xs font-bold"
              >
                Annuler
              </Button>
              <Button
                className="bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl text-xs font-extrabold px-6 shadow-md shadow-[#EA580C]/20"
                onClick={handleCheckout}
                disabled={!customerInfo.name.trim() || !customerInfo.phone.trim() || isSubmittingCheckout}
              >
                {isSubmittingCheckout ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    En cours...
                  </>
                ) : (
                  'Confirmer'
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Modal (Add/Edit) */}
      <Dialog open={productModalOpen} onOpenChange={setProductModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-white border-2 border-[#FDE8CD] rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-[#1C1917]">{isEditing ? 'Modifier le Produit' : 'Nouveau Produit'}</DialogTitle>
            <DialogDescription className="text-xs text-[#78716C]">Remplissez les informations du plat</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label htmlFor="productName">Nom du produit *</Label><Input id="productName" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} placeholder="Ex: Poulet Moambé" className="border-[#FDE8CD] rounded-xl" /></div>
            <div><Label htmlFor="productDescription">Description</Label><Textarea id="productDescription" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} placeholder="Description du plat..." rows={2} className="border-[#FDE8CD] rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="productPrice">Prix (XOF) *</Label><Input id="productPrice" type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} placeholder="5000" className="border-[#FDE8CD] rounded-xl" /></div>
              <div>
                <Label htmlFor="productCategory">Catégorie *</Label>
                <Select value={productForm.categoryId} onValueChange={(value) => setProductForm({ ...productForm, categoryId: value })}>
                  <SelectTrigger className="bg-white border-2 border-[#FDE8CD] rounded-xl font-bold">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {restaurant?.categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="text-base mr-2">{cat.icon}</span>
                        <span>{cat.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="space-y-3">
              <Label>Image du produit</Label>
              
              {/* Image Preview */}
              {productForm.image && (
                <div className="relative w-full h-40 rounded-xl overflow-hidden border border-slate-200">
                  <img src={productForm.image} alt="Preview" className="w-full h-full object-cover" />
                  <Button
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2 h-8 w-8 p-0"
                    onClick={() => setProductForm({ ...productForm, image: '' })}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Upload Options */}
              <div className="grid grid-cols-2 gap-2">
                {/* File Upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-1"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={imageUploading}
                >
                  {imageUploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                  ) : (
                    <Upload className="w-6 h-6 text-slate-400" />
                  )}
                  <span className="text-xs text-slate-500">
                    {imageUploading ? 'Téléchargement...' : 'Télécharger'}
                  </span>
                </Button>

                {/* AI Generate */}
                <Button
                  variant="outline"
                  className="h-20 flex-col gap-1"
                  onClick={generateAIImage}
                  disabled={aiGenerating || !productForm.name}
                >
                  {aiGenerating ? (
                    <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                  ) : (
                    <Sparkles className="w-6 h-6 text-purple-500" />
                  )}
                  <span className="text-xs text-slate-500">
                    {aiGenerating ? 'Génération...' : 'Générer (AI)'}
                  </span>
                </Button>
              </div>

              {/* URL Input */}
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  value={productForm.image}
                  onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                  placeholder="Ou entrez une URL d'image..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="prepTime">Temps de préparation (min)</Label><Input id="prepTime" type="number" value={productForm.preparationTime} onChange={(e) => setProductForm({ ...productForm, preparationTime: e.target.value })} placeholder="15" /></div>
              <div><Label htmlFor="calories">Calories</Label><Input id="calories" type="number" value={productForm.calories} onChange={(e) => setProductForm({ ...productForm, calories: e.target.value })} placeholder="500" /></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Switch id="available" checked={productForm.isAvailable} onCheckedChange={(checked) => setProductForm({ ...productForm, isAvailable: checked })} /><Label htmlFor="available">Disponible</Label></div>
              <div className="flex items-center gap-2"><Switch id="featured" checked={productForm.isFeatured} onCheckedChange={(checked) => setProductForm({ ...productForm, isFeatured: checked })} /><Label htmlFor="featured">Populaire</Label></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductModalOpen(false)}>Annuler</Button>
            <Button onClick={saveProduct} className="bg-amber-500 hover:bg-amber-600"><Save className="w-4 h-4 mr-2" />{isEditing ? 'Modifier' : 'Créer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Login Modal */}
      <Dialog open={loginModalOpen} onOpenChange={setLoginModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-500" />
              Connexion Dashboard
            </DialogTitle>
            <DialogDescription>
              Connectez-vous pour accéder au tableau de bord
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Demo credentials hint */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
              <p className="font-medium text-amber-800 mb-1">🔑 Identifiants de démo:</p>
              <p className="text-amber-700">Email: <code className="bg-amber-100 px-1 rounded">admin@restaurant.com</code></p>
              <p className="text-amber-700">Mot de passe: <code className="bg-amber-100 px-1 rounded">admin123</code></p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="admin@restaurant.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="pl-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Mot de passe</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="pl-10 pr-10"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <Eye className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setLoginModalOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleLogin} 
              className="bg-amber-500 hover:bg-amber-600"
              disabled={loginLoading}
            >
              {loginLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Se connecter
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                    ? `${window.location.origin}/${restaurant?.slug || 'le-jardin-savoureux'}?table=${selectedTableForQr?.number || 'T1'}`
                    : `https://restosaas.com/${restaurant?.slug || 'le-jardin-savoureux'}?table=${selectedTableForQr?.number || 'T1'}`
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
                  ? `${window.location.origin}/${restaurant?.slug || 'le-jardin-savoureux'}?table=${selectedTableForQr?.number || 'T1'}`
                  : `https://restosaas.com/${restaurant?.slug || 'le-jardin-savoureux'}?table=${selectedTableForQr?.number || 'T1'}`
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

      {/* Call Waiter Modal */}
      <Dialog open={callWaiterModalOpen} onOpenChange={setCallWaiterModalOpen}>
        <DialogContent className="max-w-md bg-white border-2 border-[#FDE8CD] rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-[#1C1917] font-heading flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#EA580C]" />
              Appeler le Service • Table {tableNumber || 'Salle'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#78716C]">
              Besoin d&apos;assistance ou de régler votre repas ? Sélectionnez votre demande ci-dessous.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {[
              { title: '🧾 Demander l’addition', desc: 'Règlement en Espèces, Wave ou Mobile Money', icon: Receipt },
              { title: '💧 Eau / Serviettes / Couverts', desc: 'Demander un réassort à votre table', icon: UtensilsCrossed },
              { title: '🙋 Conseil ou nouvelle commande', desc: 'Un serveur viendra vous conseiller', icon: ChefHat },
            ].map((opt) => (
              <button
                key={opt.title}
                onClick={() => {
                  setCallWaiterModalOpen(false)
                  toast.success(`🔔 Demande transmise à l’équipe : "${opt.title}" pour la Table ${tableNumber || 'votre table'} !`)
                }}
                className="w-full text-left p-3.5 rounded-2xl border-2 border-[#FDE8CD] bg-[#FFFBF5] hover:bg-[#FFF7ED] hover:border-[#EA580C] transition-all flex items-center gap-3.5 group hover-lift"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-[#FDE8CD] text-[#EA580C] flex items-center justify-center flex-shrink-0 group-hover:bg-[#EA580C] group-hover:text-white transition-colors">
                  <opt.icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs text-[#1C1917]">{opt.title}</h4>
                  <p className="text-[11px] text-[#78716C]">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCallWaiterModalOpen(false)}
              className="w-full border-[#FDE8CD] rounded-2xl text-xs font-bold text-[#1C1917]"
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Interactive Dish Detail Modal */}
      <Dialog 
        open={Boolean(selectedProductForDetail)} 
        onOpenChange={(open) => !open && setSelectedProductForDetail(null)}
      >
        <DialogContent className="max-w-lg bg-white border-2 border-[#FDE8CD] rounded-3xl p-0 overflow-hidden shadow-2xl">
          {selectedProductForDetail && (
            <div className="flex flex-col">
              {/* Photo Banner */}
              <div className="relative h-60 w-full bg-[#FFF7ED]">
                {selectedProductForDetail.image ? (
                  <Image
                    src={selectedProductForDetail.image}
                    alt={selectedProductForDetail.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 500px"
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#EA580C]/40">
                    <UtensilsCrossed className="w-16 h-16" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                
                {/* Close Button */}
                <button
                  onClick={() => setSelectedProductForDetail(null)}
                  className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="absolute bottom-4 left-5 right-5 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    {selectedProductForDetail.isFeatured && (
                      <span className="text-[10px] font-black uppercase text-white bg-[#EA580C] px-2.5 py-0.5 rounded-full shadow-xs">
                        ★ Spécialité Chef
                      </span>
                    )}
                    {selectedProductForDetail.preparationTime && (
                      <span className="text-[10px] font-bold text-white bg-black/50 backdrop-blur-md px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#EA580C]" /> {selectedProductForDetail.preparationTime} min
                      </span>
                    )}
                    {selectedProductForDetail.calories && (
                      <span className="text-[10px] font-bold text-white/80 bg-black/50 backdrop-blur-md px-2.5 py-0.5 rounded-full">
                        {selectedProductForDetail.calories} kcal
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-black text-white font-heading leading-tight">
                    {selectedProductForDetail.name}
                  </h3>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Description & Ingrédients</span>
                    <span className="text-xl font-black text-[#EA580C] font-mono">
                      {formatCurrency(selectedProductForDetail.price, restaurant?.currency)}
                    </span>
                  </div>
                  <p className="text-sm text-[#1C1917] leading-relaxed">
                    {selectedProductForDetail.description || 'Plat d’exception préparé avec passion par notre brigade.'}
                  </p>
                </div>

                {/* Spice Level Selector */}
                <div className="space-y-2 pt-2 border-t border-[#FDE8CD]">
                  <Label className="text-xs font-extrabold text-[#1C1917]">Niveau de Piment / Assaisonnement</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'mild', label: 'Doux', icon: '🟢', desc: 'Sans piment' },
                      { id: 'medium', label: 'Moyen 🌶️', icon: '🟡', desc: 'Léger piquant' },
                      { id: 'hot', label: 'Épicé 🔥', icon: '🔴', desc: 'Bien pimenté' },
                    ].map((lvl) => (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setDetailSpiceLevel(lvl.id as any)}
                        className={cn(
                          "p-2.5 rounded-2xl border-2 text-center transition-all",
                          detailSpiceLevel === lvl.id
                            ? "bg-[#FFF7ED] border-[#EA580C] text-[#EA580C] font-bold shadow-xs"
                            : "bg-[#FFFBF5] border-[#FDE8CD] text-[#78716C] hover:border-[#EA580C]/40"
                        )}
                      >
                        <div className="text-xs font-extrabold">{lvl.label}</div>
                        <div className="text-[10px] text-[#78716C]">{lvl.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Special instructions */}
                <div className="space-y-1.5 pt-2 border-t border-[#FDE8CD]">
                  <Label className="text-xs font-extrabold text-[#1C1917]">Instructions spéciales pour la cuisine (optionnel)</Label>
                  <Input
                    value={detailSpecialNote}
                    onChange={(e) => setDetailSpecialNote(e.target.value)}
                    placeholder="Ex: Sans oignon, sauce à part, bien cuit..."
                    className="h-10 bg-[#FFFBF5] border-2 border-[#FDE8CD] rounded-xl text-xs"
                  />
                </div>

                {/* Stepper and Add Button */}
                <div className="pt-3 border-t border-[#FDE8CD] flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-[#FFF7ED] border-2 border-[#FDE8CD] p-1 rounded-2xl">
                    <button
                      type="button"
                      onClick={() => setDetailQuantity(Math.max(1, detailQuantity - 1))}
                      className="w-8 h-8 rounded-xl bg-white text-[#1C1917] hover:bg-[#EA580C] hover:text-white flex items-center justify-center font-bold transition-colors shadow-xs"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-black text-sm font-mono text-[#1C1917]">{detailQuantity}</span>
                    <button
                      type="button"
                      onClick={() => setDetailQuantity(detailQuantity + 1)}
                      className="w-8 h-8 rounded-xl bg-[#EA580C] text-white hover:bg-[#C2410C] flex items-center justify-center font-bold transition-colors shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <Button
                    onClick={addDetailProductToCart}
                    className="flex-1 h-12 bg-[#EA580C] hover:bg-[#C2410C] text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-[#EA580C]/25 transition-all hover:scale-[1.01]"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Ajouter ({formatCurrency(selectedProductForDetail.price * detailQuantity, restaurant?.currency)})
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-slate-500">
            <p>© 2024 {restaurant?.name || 'Restaurant'} - Tous droits réservés</p>
            <p className="flex items-center gap-1">Powered by <span className="font-semibold text-amber-600">Zagoor</span></p>
          </div>
        </div>
      </footer>
    </div>
  )
}
