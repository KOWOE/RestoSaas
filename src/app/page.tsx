'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
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
  AlertCircle, Truck, Store, Home, ClipboardList
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
  currency: string
  taxRate: number
  categories: Category[]
  tables: { id: string; number: string }[]
}

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  paymentMethod: string | null
  customerName: string | null
  tableNumber: string | null
  total: number
  createdAt: string
  items: { product: { name: string }; quantity: number; price: number }[]
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

// Demo data
const DEMO_RESTAURANT: Restaurant = {
  id: 'demo-restaurant',
  name: 'Zagoor',
  slug: 'zagoor',
  description: 'Restaurant gastronomique proposant une cuisine africaine moderne.',
  logo: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop',
  banner: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=400&fit=crop',
  address: 'Cotonou, Bénin',
  phone: '+229 97 12 34 56',
  currency: 'XOF',
  taxRate: 0.18,
  tables: Array.from({ length: 10 }, (_, i) => ({ id: `t${i + 1}`, number: `T${i + 1}` })),
  categories: [
    {
      id: 'cat-1',
      name: 'Entrées',
      icon: '🥗',
      description: 'Commencez votre repas en douceur',
      products: [
        { id: 'p1', name: 'Salade de Mangue', description: 'Mangue fraîche, avocat, oignons rouges', price: 2500, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop', isAvailable: true, isFeatured: true, preparationTime: 10, calories: 180, categoryId: 'cat-1' },
        { id: 'p2', name: 'Brochettes de Crevettes', description: 'Crevettes marinées aux épices', price: 3500, image: 'https://images.unsplash.com/photo-1565680018093-ebb6b9ab5460?w=400&h=300&fit=crop', isAvailable: true, isFeatured: true, preparationTime: 15, calories: 220, categoryId: 'cat-1' },
        { id: 'p3', name: 'Acarajé', description: 'Beignets de haricots noirs traditionnels', price: 1500, image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400&h=300&fit=crop', isAvailable: true, isFeatured: false, preparationTime: 8, calories: 280, categoryId: 'cat-1' },
      ],
    },
    {
      id: 'cat-2',
      name: 'Plats Principaux',
      icon: '🍽️',
      description: 'Les spécialités de la maison',
      products: [
        { id: 'p4', name: 'Poulet Moambé', description: 'Poulet fermier braisé sauce moambé', price: 5500, image: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=400&h=300&fit=crop', isAvailable: true, isFeatured: true, preparationTime: 25, calories: 650, categoryId: 'cat-2' },
        { id: 'p5', name: 'Thiéboudienne', description: 'Riz rouge au poisson, spécialité sénégalaise', price: 4500, image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop', isAvailable: true, isFeatured: true, preparationTime: 30, calories: 580, categoryId: 'cat-2' },
        { id: 'p6', name: 'Poisson Braisé', description: 'Poisson grillé aux épices locales', price: 5000, image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&h=300&fit=crop', isAvailable: true, isFeatured: false, preparationTime: 25, calories: 450, categoryId: 'cat-2' },
      ],
    },
    {
      id: 'cat-3',
      name: 'Grillades',
      icon: '🔥',
      description: 'Viandes et poissons grillés',
      products: [
        { id: 'p7', name: 'Brochettes de Bœuf', description: 'Bœuf mariné grillé sur feu de bois', price: 4000, image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=300&fit=crop', isAvailable: true, isFeatured: true, preparationTime: 15, calories: 380, categoryId: 'cat-3' },
        { id: 'p8', name: 'Côtes d\'Agneau', description: 'Côtes grillées, sauce moutarde', price: 7000, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop', isAvailable: true, isFeatured: true, preparationTime: 20, calories: 520, categoryId: 'cat-3' },
      ],
    },
    {
      id: 'cat-4',
      name: 'Boissons',
      icon: '🍹',
      description: 'Rafraîchissements naturels',
      products: [
        { id: 'p9', name: 'Jus de Bissap', description: 'Jus d\'hibiscus frais', price: 1000, image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=300&fit=crop', isAvailable: true, isFeatured: false, preparationTime: 2, calories: 120, categoryId: 'cat-4' },
        { id: 'p10', name: 'Cocktail Maison', description: 'Mélange de jus tropicaux', price: 2000, image: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=400&h=300&fit=crop', isAvailable: true, isFeatured: true, preparationTime: 5, calories: 180, categoryId: 'cat-4' },
      ],
    },
    {
      id: 'cat-5',
      name: 'Desserts',
      icon: '🍰',
      description: 'Finitions sucrées',
      products: [
        { id: 'p11', name: 'Banane Flambée', description: 'Banane caramélisée flambée au rhum', price: 2500, image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop', isAvailable: true, isFeatured: false, preparationTime: 10, calories: 280, categoryId: 'cat-5' },
        { id: 'p12', name: 'Moelleux au Chocolat', description: 'Gâteau coulant, glace vanille', price: 3000, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop', isAvailable: true, isFeatured: true, preparationTime: 12, calories: 420, categoryId: 'cat-5' },
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

export default function RestaurantApp() {
  const { items, addItem, removeItem, updateQuantity, clearCart, getTotal, getItemCount } = useCartStore()
  const { currentRestaurant, setRestaurant, tableNumber, setTable } = useRestaurantStore()
  const { user, isAuthenticated, login, logout } = useAuthStore()
  
  const [restaurant, setRestaurantData] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('menu')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', notes: '' })
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway'>('dine_in')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'moneroo'>('moneroo')
  
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
  })
  const [savingSettings, setSavingSettings] = useState(false)

  // Initialize restaurant
  useEffect(() => {
    const initRestaurant = async () => {
      try {
        await fetch('/api/seed')
        const res = await fetch('/api/restaurants?slug=le-jardin-savoureux')
        const data = await res.json()
        
        if (!data.error) {
          setRestaurantData(data)
          if (!currentRestaurant || currentRestaurant !== data.id) {
            setRestaurant(data.id, data.name)
          }
        } else {
          setRestaurantData(DEMO_RESTAURANT)
          setRestaurant(DEMO_RESTAURANT.id, DEMO_RESTAURANT.name)
        }
      } catch {
        setRestaurantData(DEMO_RESTAURANT)
        setRestaurant(DEMO_RESTAURANT.id, DEMO_RESTAURANT.name)
      } finally {
        setLoading(false)
      }
    }
    
    initRestaurant()
  }, [setRestaurant])

  // Initialize settings form when restaurant loads
  useEffect(() => {
    if (restaurant) {
      setSettingsForm({
        name: restaurant.name || '',
        phone: restaurant.phone || '',
        address: restaurant.address || '',
        email: restaurant.email || '',
        description: restaurant.description || '',
        taxRate: ((restaurant.taxRate || 0.18) * 100).toString(),
        currency: restaurant.currency || 'XOF',
      })
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

  // Handle checkout
  const handleCheckout = async () => {
    if (isSubmittingCheckout) return;
    if (!customerInfo.name || !customerInfo.phone) {
      toast.error('Veuillez remplir vos informations')
      return
    }

    setIsSubmittingCheckout(true)
    try {
      let order: any = null;
      let orderNumber = `ORD-${Date.now().toString(36).toUpperCase().substring(0, 8)}`;
      let isMock = false;

      // 1. D'abord, créer la vraie commande en base de données (si ce n'est pas le mode démo)
      if (restaurant?.id === 'demo-restaurant') {
        isMock = true;
        order = {
          id: `mock-${Date.now()}`,
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
          tableNumber: orderType === 'dine_in' ? tableNumber : null,
          notes: customerInfo.notes,
          paymentMethod: paymentMethod,
          createdAt: new Date().toISOString()
        };
      } else {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId: restaurant?.id,
            items: items.map(item => ({
              productId: item.id,
              quantity: item.quantity,
              notes: item.notes,
            })),
            customerName: customerInfo.name,
            customerPhone: customerInfo.phone,
            tableNumber: orderType === 'dine_in' ? tableNumber : null,
            notes: customerInfo.notes,
            type: orderType,
            paymentMethod: paymentMethod,
          }),
        });

        try {
          const data = await res.json();
          if (res.ok && data.id) {
            order = data;
            orderNumber = order.orderNumber;
          } else {
            console.error('API Orders Error:', data);
            toast.error(`Erreur Serveur: ${data.error || 'Erreur inconnue'}`);
          }
        } catch (e) {
          console.error('Failed to parse API Orders response:', e);
          toast.error('Erreur Serveur: Impossible de parser la réponse');
        }
      }

      // Si l'API a échoué (order est null)
      if (!order && !isMock) {
        order = {
          id: `mock-${Date.now()}`,
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
          tableNumber: orderType === 'dine_in' ? tableNumber : null,
          notes: customerInfo.notes,
          paymentMethod: paymentMethod,
          createdAt: new Date().toISOString()
        };
        isMock = true;
      }

      // 2. Ensuite, gérer le paiement Mobile Money
      if (paymentMethod === 'moneroo' && order.paymentData?.data?.checkout_url) {
        toast.success('Redirection vers le paiement sécurisé...');
        window.location.href = order.paymentData.data.checkout_url;
        return;
      } else if (paymentMethod === 'moneroo') {
        let errorMsg = "Impossible d'initier le paiement.";
        if (order.paymentError) {
          try {
            const parsed = JSON.parse(order.paymentError);
            errorMsg = `Moneroo: ${parsed.message || order.paymentError}`;
          } catch(e) {
            errorMsg = `Moneroo: ${order.paymentError}`;
          }
        }
        toast.error(errorMsg);
      } else {
        toast.success(`Commande ${orderNumber} créée ! ${isMock ? '(Simulée)' : ''}`);
      }

      // 3. Vider le panier et rediriger vers le suivi
      clearCart();
      setCheckoutOpen(false);
      setCustomerInfo({ name: '', phone: '', notes: '' });
      setCustomerPhone(customerInfo.phone);
      addTrackedOrder(order);
      setViewMode('tracking');
      setSearchValue(orderNumber);

    } catch (e) {
      toast.error('Erreur lors de la création')
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
      toast.error('Veuillez entrer le nom du plat d\'abord')
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
        toast.success(isEditing ? 'Plat modifié!' : 'Plat ajouté!')
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
        toast.success('Plat supprimé!')
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
                <h1 className="font-bold text-slate-900">{restaurant?.name || 'Restaurant'}</h1>
                <p className="text-xs text-slate-500">Menu Digital</p>
              </div>
            </motion.div>

            <div className="flex items-center gap-2">
              <div className="flex bg-slate-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('menu')}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    viewMode === 'menu' ? "bg-white text-amber-600 shadow-md" : "text-slate-600"
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <Menu className="w-4 h-4" />
                    <span className="hidden sm:inline">Menu</span>
                  </span>
                </button>
                <button
                  onClick={() => setViewMode('tracking')}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    viewMode === 'tracking' ? "bg-white text-amber-600 shadow-md" : "text-slate-600"
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <Navigation className="w-4 h-4" />
                    <span className="hidden sm:inline">Suivi</span>
                  </span>
                </button>
                <button
                  onClick={handleDashboardAccess}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                    viewMode === 'dashboard' ? "bg-white text-amber-600 shadow-md" : "text-slate-600"
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </span>
                </button>
              </div>

              {/* User info or login button */}
              {isAuthenticated && user ? (
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{user.name}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-slate-500 hover:text-red-500"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : null}

              {viewMode === 'menu' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCartOpen(true)}
                  className="relative p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg hover:shadow-xl transition-shadow"
                >
                  <ShoppingCart className="w-5 h-5" />
                  {getItemCount() > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold"
                    >
                      {getItemCount()}
                    </motion.span>
                  )}
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {viewMode === 'menu' ? (
            <motion.div key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {/* Hero Banner */}
              {restaurant?.banner && (
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-[2rem] overflow-hidden mb-12 h-64 sm:h-80 xl:h-96 shadow-2xl">
                  <Image src={restaurant.banner} alt="Restaurant" fill sizes="100vw" className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">{restaurant.name}</h2>
                    <p className="text-white/90 text-sm sm:text-lg max-w-2xl font-medium">{restaurant.description}</p>
                    <div className="flex flex-wrap items-center gap-6 mt-6">
                      <span className="flex items-center gap-2 text-white/90 font-medium bg-white/20 px-4 py-2 rounded-full backdrop-blur-md"><MapPin className="w-4 h-4" />{restaurant.address}</span>
                      <span className="flex items-center gap-2 text-white/90 font-medium bg-white/20 px-4 py-2 rounded-full backdrop-blur-md"><Phone className="w-4 h-4" />{restaurant.phone}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Search & Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher un plat..." className="pl-10 h-12 bg-white border-slate-200 rounded-xl" />
                </div>
                <ScrollArea className="whitespace-nowrap pb-2">
                  <div className="flex gap-2">
                    <Button onClick={() => setSelectedCategory(null)} variant={!selectedCategory ? 'default' : 'outline'} className={cn("rounded-full", !selectedCategory && "bg-amber-500 hover:bg-amber-600")}>Tout</Button>
                    {restaurant?.categories.map((cat) => (
                      <Button key={cat.id} onClick={() => setSelectedCategory(cat.id)} variant={selectedCategory === cat.id ? 'default' : 'outline'} className={cn("rounded-full whitespace-nowrap", selectedCategory === cat.id && "bg-amber-500 hover:bg-amber-600")}>{cat.icon} {cat.name}</Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Featured Products */}
              {featuredProducts.length > 0 && !searchQuery && !selectedCategory && (
                <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Star className="w-5 h-5 text-amber-500" />
                    <h3 className="text-lg font-bold text-slate-900">Plats Populaires</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {featuredProducts.slice(0, 3).map((product, index) => (
                      <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * index }} className="group relative bg-white rounded-2xl shadow-sm overflow-hidden border border-orange-900/5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="relative h-48 overflow-hidden bg-slate-100 flex items-center justify-center">
                          {product.image ? (
                            <Image src={product.image} alt={product.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <UtensilsCrossed className="w-12 h-12 text-slate-300" />
                          )}
                          <div className="absolute top-3 left-3"><Badge className="bg-amber-500 text-white border-0 shadow-md font-bold"><Flame className="w-3 h-3 mr-1" />Populaire</Badge></div>
                        </div>
                        <div className="p-5">
                          <h4 className="font-bold text-slate-900 mb-2 text-lg">{product.name}</h4>
                          <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed">{product.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="font-black text-amber-600 text-lg">{formatCurrency(product.price, restaurant?.currency)}</span>
                            <Button size="sm" onClick={() => handleAddToCart(product)} className="bg-amber-500 hover:bg-amber-600 rounded-xl shadow-md hover:shadow-lg transition-all font-bold group-hover:scale-105"><Plus className="w-4 h-4 mr-1" />Ajouter</Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.section>
              )}

              {/* Products Grid */}
              {!searchQuery && (
                <div className="space-y-8">
                  {restaurant?.categories.filter(cat => !selectedCategory || cat.id === selectedCategory).map((category, catIndex) => (
                    <motion.section key={category.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * catIndex }}>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">{category.icon}</span>
                        <div><h3 className="text-xl font-bold text-slate-900">{category.name}</h3><p className="text-sm text-slate-500">{category.description}</p></div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {category.products.map((product, index) => (
                          <motion.div key={product.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 * index }} className="group bg-white rounded-2xl shadow-sm overflow-hidden border border-orange-900/5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                            <div className="flex">
                              <div className="relative w-32 h-32 flex-shrink-0 bg-slate-100 flex items-center justify-center">
                                {product.image ? (
                                  <Image src={product.image} alt={product.name} fill sizes="128px" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                  <UtensilsCrossed className="w-8 h-8 text-slate-300" />
                                )}
                              </div>
                              <div className="p-4 flex flex-col flex-1 justify-between">
                                <div>
                                  <h4 className="font-bold text-slate-900 mb-1 text-base">{product.name}</h4>
                                  <p className="text-xs text-slate-500 line-clamp-2 mb-2 leading-relaxed">{product.description}</p>
                                </div>
                                <div className="flex items-center justify-between mt-auto">
                                  <span className="font-black text-amber-600">{formatCurrency(product.price, restaurant?.currency)}</span>
                                  <Button size="sm" onClick={() => handleAddToCart(product)} className="bg-amber-500 hover:bg-amber-600 rounded-xl shadow-sm transition-all group-hover:scale-105 h-8 w-8 p-0" title="Ajouter au panier"><Plus className="w-4 h-4" /></Button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.section>
                  ))}
                </div>
              )}

              {/* Search Results */}
              {searchQuery && (
                <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <h3 className="text-lg font-semibold text-slate-700 mb-4">{filteredProducts.length} résultat(s) pour "{searchQuery}"</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map((product, index) => (
                      <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * index }} className="bg-white rounded-2xl shadow-md overflow-hidden border border-slate-100">
                        <div className="relative h-36"><img src={product.image || ''} alt={product.name} className="w-full h-full object-cover" /></div>
                        <div className="p-4">
                          <h4 className="font-bold text-slate-900">{product.name}</h4>
                          <p className="text-sm text-slate-500 line-clamp-2 mt-1">{product.description}</p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="font-bold text-amber-600">{formatCurrency(product.price, restaurant?.currency)}</span>
                            <Button size="sm" onClick={() => handleAddToCart(product)} className="bg-amber-500 hover:bg-amber-600 rounded-full"><Plus className="w-4 h-4 mr-1" />Ajouter</Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.section>
              )}
            </motion.div>
          ) : viewMode === 'tracking' ? (
            <motion.div key="tracking" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
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
            <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {/* Dashboard Header */}
              <div className="flex items-center justify-between mb-6">
                <div><h2 className="text-2xl font-bold text-slate-900">Tableau de Bord</h2><p className="text-slate-500">Gérez votre restaurant en temps réel</p></div>
                <Button onClick={fetchDashboardData} variant="outline" className="gap-2"><RefreshCw className="w-4 h-4" />Actualiser</Button>
              </div>

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

              {/* Dashboard Tabs */}
              <Tabs value={dashboardTab} onValueChange={setDashboardTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
                  <TabsTrigger value="orders" className="gap-2"><ChefHat className="w-4 h-4" />Commandes</TabsTrigger>
                  <TabsTrigger value="products" className="gap-2"><Package className="w-4 h-4" />Plats</TabsTrigger>
                  <TabsTrigger value="settings" className="gap-2"><Settings className="w-4 h-4" />Paramètres</TabsTrigger>
                </TabsList>

                {/* Orders Tab */}
                <TabsContent value="orders">
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-2"><ChefHat className="w-5 h-5 text-amber-500" />Gestion des Commandes</CardTitle>
                      <Select value={ordersFilter} onValueChange={setOrdersFilter}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="Filtrer" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes</SelectItem>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="confirmed">Confirmées</SelectItem>
                          <SelectItem value="preparing">En préparation</SelectItem>
                          <SelectItem value="ready">Prêtes</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-96">
                        <div className="space-y-3">
                          {orders.filter(o => ordersFilter === 'all' || o.status === ordersFilter).slice(0, 10).map((order, index) => (
                            <motion.div key={order.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * index }} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900">#{order.orderNumber}</span>
                                    <Badge className={cn("border", statusColors[order.status])}>{statusLabels[order.status]}</Badge>
                                  </div>
                                  <p className="text-sm text-slate-500 mt-1">{order.customerName} {order.tableNumber && `• Table ${order.tableNumber}`}</p>
                                </div>
                                <span className="font-bold text-amber-600">{formatCurrency(order.total, restaurant?.currency)}</span>
                              </div>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {order.items.map((item, i) => (<span key={i} className="text-xs bg-white px-2 py-1 rounded-full text-slate-600">{item.quantity}x {item.product.name}</span>))}
                              </div>
                              <div className="flex items-center justify-between text-xs text-slate-400">
                                <span>{new Date(order.createdAt).toLocaleString('fr-FR')}</span>
                                <div className="flex gap-1">
                                  {order.status === 'pending' && (<><Button size="sm" variant="outline" className="h-7 text-xs text-green-600" onClick={() => updateOrderStatus(order.id, 'confirmed')}><Check className="w-3 h-3 mr-1" />Confirmer</Button><Button size="sm" variant="outline" className="h-7 text-xs text-red-600" onClick={() => updateOrderStatus(order.id, 'cancelled')}><X className="w-3 h-3 mr-1" />Annuler</Button></>)}
                                  {order.status === 'confirmed' && <Button size="sm" variant="outline" className="h-7 text-xs text-orange-600" onClick={() => updateOrderStatus(order.id, 'preparing')}><ChefHat className="w-3 h-3 mr-1" />Préparer</Button>}
                                  {order.status === 'preparing' && <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-600" onClick={() => updateOrderStatus(order.id, 'ready')}><CheckCircle className="w-3 h-3 mr-1" />Prête</Button>}
                                  {order.status === 'ready' && <Button size="sm" variant="outline" className="h-7 text-xs text-green-600" onClick={() => updateOrderStatus(order.id, 'delivered')}><CheckCircle className="w-3 h-3 mr-1" />Livrée</Button>}
                                </div>
                              </div>
                            </motion.div>
                          ))}
                          {orders.length === 0 && <div className="text-center py-12 text-slate-400"><Package className="w-12 h-12 mx-auto mb-3 opacity-50" /><p>Aucune commande</p></div>}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Products Tab */}
                <TabsContent value="products">
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-2"><Package className="w-5 h-5 text-amber-500" />Gestion des Plats</CardTitle>
                      <Button onClick={openAddProduct} className="bg-amber-500 hover:bg-amber-600"><Plus className="w-4 h-4 mr-2" />Nouveau Plat</Button>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {allProducts.map((product, index) => (
                          <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * index }} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="relative h-32">
                              <img src={product.image || ''} alt={product.name} className="w-full h-full object-cover" />
                              <div className="absolute top-2 left-2 flex gap-1">
                                {product.isFeatured && <Badge className="bg-amber-500 text-white border-0 text-xs"><Star className="w-3 h-3" /></Badge>}
                                {!product.isAvailable && <Badge className="bg-red-500 text-white border-0 text-xs">Indisponible</Badge>}
                              </div>
                              <div className="absolute top-2 right-2 flex gap-1">
                                <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={() => openEditProduct(product)}><Edit className="w-4 h-4" /></Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild><Button size="sm" variant="destructive" className="h-8 w-8 p-0"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader><AlertDialogTitle>Supprimer le plat?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible. Le plat "{product.name}" sera définitivement supprimé.</AlertDialogDescription></AlertDialogHeader>
                                    <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => deleteProduct(product.id)} className="bg-red-500 hover:bg-red-600">Supprimer</AlertDialogAction></AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                            <div className="p-3">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{product.categoryIcon}</span>
                                <h4 className="font-semibold text-slate-900 line-clamp-1">{product.name}</h4>
                              </div>
                              <p className="text-xs text-slate-500 line-clamp-2 mb-2">{product.description}</p>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-amber-600">{formatCurrency(product.price, restaurant?.currency)}</span>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                  {product.preparationTime && <span><Clock className="w-3 h-3 inline mr-1" />{product.preparationTime}min</span>}
                                  {product.calories && <span>{product.calories} cal</span>}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Restaurant Info */}
                    <Card className="border-slate-200 shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Settings className="w-5 h-5 text-amber-500" />
                          Informations du Restaurant
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="restaurant-name">Nom du restaurant *</Label>
                          <Input
                            id="restaurant-name"
                            value={settingsForm.name}
                            onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                            placeholder="Le Jardin Savoureux"
                            className="mt-1.5"
                          />
                        </div>

                        <div>
                          <Label htmlFor="restaurant-phone">Téléphone</Label>
                          <div className="relative mt-1.5">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                              id="restaurant-phone"
                              value={settingsForm.phone}
                              onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                              placeholder="+229 97 12 34 56"
                              className="pl-10"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="restaurant-email">Email</Label>
                          <div className="relative mt-1.5">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                              id="restaurant-email"
                              type="email"
                              value={settingsForm.email}
                              onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                              placeholder="contact@restaurant.com"
                              className="pl-10"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="restaurant-address">Adresse</Label>
                          <div className="relative mt-1.5">
                            <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <Textarea
                              id="restaurant-address"
                              value={settingsForm.address}
                              onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                              placeholder="Cotonou, Bénin"
                              className="pl-10 min-h-[80px]"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="restaurant-description">Description</Label>
                          <Textarea
                            id="restaurant-description"
                            value={settingsForm.description}
                            onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                            placeholder="Restaurant gastronomique proposant une cuisine africaine moderne."
                            className="mt-1.5 min-h-[80px]"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Financial Settings */}
                    <div className="space-y-6">
                      <Card className="border-slate-200 shadow-sm">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-amber-500" />
                            Paramètres Financiers
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="tax-rate">Taux de TVA (%)</Label>
                              <Input
                                id="tax-rate"
                                type="number"
                                value={settingsForm.taxRate}
                                onChange={(e) => setSettingsForm({ ...settingsForm, taxRate: e.target.value })}
                                placeholder="18"
                                className="mt-1.5"
                              />
                            </div>
                            <div>
                              <Label htmlFor="currency">Devise</Label>
                              <Select
                                value={settingsForm.currency}
                                onValueChange={(value) => setSettingsForm({ ...settingsForm, currency: value })}
                              >
                                <SelectTrigger className="mt-1.5">
                                  <SelectValue placeholder="Sélectionner" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="XOF">XOF (FCFA)</SelectItem>
                                  <SelectItem value="EUR">EUR (€)</SelectItem>
                                  <SelectItem value="USD">USD ($)</SelectItem>
                                  <SelectItem value="MAD">MAD (DH)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Quick Info Card */}
                      <Card className="border-amber-200 bg-amber-50/50">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                              <Bell className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                              <h4 className="font-medium text-amber-900">Conseil</h4>
                              <p className="text-sm text-amber-700 mt-1">
                                Les modifications apportées ici seront visibles immédiatement sur votre menu digital. 
                                Assurez-vous que les informations sont correctes avant de sauvegarder.
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Save Button */}
                      <Button
                        onClick={saveSettings}
                        disabled={savingSettings}
                        className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-lg"
                      >
                        {savingSettings ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Enregistrement...
                          </>
                        ) : (
                          <>
                            <Save className="w-5 h-5 mr-2" />
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
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 mr-2" onClick={() => removeItem(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="w-3 h-3" /></Button>
                      <span className="w-6 text-center font-medium">{item.quantity}</span>
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
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Finaliser la Commande</DialogTitle><DialogDescription>Veuillez remplir vos informations</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type de commande</Label>
              <div className="flex gap-2 mt-2">
                <Button variant={orderType === 'dine_in' ? 'default' : 'outline'} className={cn("flex-1", orderType === 'dine_in' && "bg-amber-500 hover:bg-amber-600")} onClick={() => setOrderType('dine_in')}><UtensilsCrossed className="w-4 h-4 mr-2" />Sur place</Button>
                <Button variant={orderType === 'takeaway' ? 'default' : 'outline'} className={cn("flex-1", orderType === 'takeaway' && "bg-amber-500 hover:bg-amber-600")} onClick={() => setOrderType('takeaway')}><Package className="w-4 h-4 mr-2" />À emporter</Button>
              </div>
            </div>
            {orderType === 'dine_in' && (
              <div>
                <Label>Numéro de table</Label>
                <Select value={tableNumber || ''} onValueChange={setTable}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Sélectionnez une table" /></SelectTrigger>
                  <SelectContent>{restaurant?.tables.map((table) => (<SelectItem key={table.id} value={table.number}>Table {table.number}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Moyen de paiement</Label>
              <div className="flex gap-2 mt-2">
                <Button variant={paymentMethod === 'moneroo' ? 'default' : 'outline'} className={cn("flex-1", paymentMethod === 'moneroo' && "bg-amber-500 hover:bg-amber-600")} onClick={() => setPaymentMethod('moneroo')}><CreditCard className="w-4 h-4 mr-2" />Mobile Money</Button>
                <Button variant={paymentMethod === 'cash' ? 'default' : 'outline'} className={cn("flex-1", paymentMethod === 'cash' && "bg-amber-500 hover:bg-amber-600")} onClick={() => setPaymentMethod('cash')}><DollarSign className="w-4 h-4 mr-2" />Espèces</Button>
              </div>
            </div>
            <div><Label htmlFor="name">Nom *</Label><Input id="name" value={customerInfo.name} onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })} placeholder="Votre nom" /></div>
            <div><Label htmlFor="phone">Téléphone *</Label><Input id="phone" value={customerInfo.phone} onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })} placeholder="+229 97 12 34 56" /></div>
            <div><Label htmlFor="notes">Notes (optionnel)</Label><Textarea id="notes" value={customerInfo.notes} onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })} placeholder="Instructions spéciales..." rows={2} /></div>
            <Separator />
            <div className="flex justify-between font-bold text-lg"><span>Total à payer</span><span className="text-amber-600">{formatCurrency(getTotal() * (1 + (restaurant?.taxRate || 0.18)), restaurant?.currency)}</span></div>
            <DialogFooter><Button variant="outline" onClick={() => setCheckoutOpen(false)} disabled={isSubmittingCheckout}>Annuler</Button><Button className="bg-amber-500 hover:bg-amber-600" onClick={handleCheckout} disabled={!customerInfo.name || !customerInfo.phone || isSubmittingCheckout}>{isSubmittingCheckout ? 'En cours...' : 'Confirmer'}</Button></DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Modal (Add/Edit) */}
      <Dialog open={productModalOpen} onOpenChange={setProductModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Modifier le Plat' : 'Nouveau Plat'}</DialogTitle>
            <DialogDescription>Remplissez les informations du plat</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label htmlFor="productName">Nom du plat *</Label><Input id="productName" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} placeholder="Ex: Poulet Moambé" /></div>
            <div><Label htmlFor="productDescription">Description</Label><Textarea id="productDescription" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} placeholder="Description du plat..." rows={2} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label htmlFor="productPrice">Prix (XOF) *</Label><Input id="productPrice" type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} placeholder="5000" /></div>
              <div>
                <Label htmlFor="productCategory">Catégorie *</Label>
                <Select value={productForm.categoryId} onValueChange={(value) => setProductForm({ ...productForm, categoryId: value })}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                  <SelectContent>{restaurant?.categories.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="space-y-3">
              <Label>Image du plat</Label>
              
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
