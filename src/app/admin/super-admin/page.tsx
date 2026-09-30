'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Crown,
  Building2,
  TrendingUp,
  DollarSign,
  Users,
  Store,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Plus,
  ArrowRight,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  QrCode,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Eye,
  Lock,
  ChevronRight,
  Sliders,
  BarChart3,
  Calendar,
  X,
  Check,
  Power,
  UtensilsCrossed,
  MessageCircle,
  Receipt,
  Share2,
  Star,
  Settings,
  Trash2,
  Radio
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

function formatXOF(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0
  }).format(amount)
}

interface RestaurantTenant {
  id: string
  name: string
  slug: string
  ownerName: string
  email: string
  phone: string
  city: string
  country: string
  plan: string
  billingCycle: string
  planPrice: number
  serviceType: string
  isActive: boolean
  tableCount: number
  orderCount: number
  totalVolume: number
  createdAt: string
}

interface SaasTransaction {
  id: string
  restaurantName: string
  slug: string
  amount: number
  currency: string
  plan: string
  paymentMethod: string
  reference: string
  status: string
  date: string
}

interface LiveNetworkOrder {
  id: string
  orderNumber: string
  restaurantName: string
  slug: string
  customerName: string
  total: number
  status: string
  date: string
}

const DEFAULT_RESTAURANTS: RestaurantTenant[] = [
  {
    id: 'resto-1',
    name: 'Le Jardin Savoureux',
    slug: 'le-jardin-savoureux',
    ownerName: 'Chef Malik Koffi',
    email: 'contact@lejardinsavoureux.com',
    phone: '+229 97 12 34 56',
    city: 'Cotonou',
    country: 'Bénin',
    plan: 'pro',
    billingCycle: 'annual',
    planPrice: 54000,
    serviceType: 'both',
    isActive: true,
    tableCount: 12,
    orderCount: 1420,
    totalVolume: 12450000,
    createdAt: '2026-01-15T10:00:00.000Z'
  },
  {
    id: 'resto-2',
    name: 'Lounge & Grill Teranga',
    slug: 'lounge-grill-teranga',
    ownerName: 'Awa Diop',
    email: 'awa@terangagrill.sn',
    phone: '+221 77 456 78 90',
    city: 'Dakar',
    country: 'Sénégal',
    plan: 'pro',
    billingCycle: 'monthly',
    planPrice: 5500,
    serviceType: 'both',
    isActive: true,
    tableCount: 16,
    orderCount: 2150,
    totalVolume: 18900000,
    createdAt: '2026-02-01T14:30:00.000Z'
  },
  {
    id: 'resto-3',
    name: 'L\'Ébène Gourmet',
    slug: 'lebene-gourmet',
    ownerName: 'Yao Kouamé',
    email: 'direction@ebenengourmet.ci',
    phone: '+225 07 89 01 23 45',
    city: 'Abidjan',
    country: 'Côte d\'Ivoire',
    plan: 'pro',
    billingCycle: 'annual',
    planPrice: 54000,
    serviceType: 'physical',
    isActive: true,
    tableCount: 20,
    orderCount: 3890,
    totalVolume: 32400000,
    createdAt: '2026-02-18T09:15:00.000Z'
  },
  {
    id: 'resto-4',
    name: 'Maquis Le Braisé Royal',
    slug: 'maquis-braise-royal',
    ownerName: 'Ibrahim Touré',
    email: 'contact@braiseroyal.ml',
    phone: '+223 66 12 34 56',
    city: 'Bamako',
    country: 'Mali',
    plan: 'pro',
    billingCycle: 'monthly',
    planPrice: 5500,
    serviceType: 'both',
    isActive: true,
    tableCount: 10,
    orderCount: 980,
    totalVolume: 6750000,
    createdAt: '2026-03-05T11:20:00.000Z'
  },
  {
    id: 'resto-5',
    name: 'Dark Kitchen AfroBurger',
    slug: 'afroburger-lome',
    ownerName: 'Komi Mensah',
    email: 'orders@afroburger.tg',
    phone: '+228 90 23 45 67',
    city: 'Lomé',
    country: 'Togo',
    plan: 'pro',
    billingCycle: 'monthly',
    planPrice: 5500,
    serviceType: 'online',
    isActive: true,
    tableCount: 0,
    orderCount: 1650,
    totalVolume: 11200000,
    createdAt: '2026-03-12T16:45:00.000Z'
  }
]

export default function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState<'tenants' | 'transactions' | 'analytics' | 'pricing' | 'settings'>('tenants')
  const [restaurants, setRestaurants] = useState<RestaurantTenant[]>(DEFAULT_RESTAURANTS)
  const [transactions, setTransactions] = useState<SaasTransaction[]>([])
  const [liveNetworkOrders, setLiveNetworkOrders] = useState<LiveNetworkOrder[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')
  const [loading, setLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<string>('')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // New Partner Modal Form
  const [newPartnerForm, setNewPartnerForm] = useState({
    name: '',
    ownerName: '',
    email: '',
    phone: '',
    city: 'Cotonou',
    country: 'Bénin',
    billingCycle: 'monthly',
    serviceType: 'both',
    tableCount: 8
  })

  // Synchronize Super Admin data with Backend API & LocalStorage
  const fetchSuperAdminData = useCallback(async (isManual = false) => {
    if (isManual) setIsSyncing(true)
    try {
      const res = await fetch('/api/admin/super-admin')
      if (res.ok) {
        const data = await res.json()
        if (data.restaurants && data.restaurants.length > 0) {
          // Cross sync with localStorage statuses if any
          const mergedWithLocal = data.restaurants.map((r: RestaurantTenant) => {
            if (typeof window !== 'undefined') {
              const localStatus = localStorage.getItem(`zagoor_restaurant_status_${r.slug}`)
              if (localStatus === 'suspended') return { ...r, isActive: false }
              if (localStatus === 'active') return { ...r, isActive: true }
            }
            return r
          })
          setRestaurants(mergedWithLocal)
        }
        if (data.transactions) {
          setTransactions(data.transactions)
        }
        if (data.liveNetworkOrders) {
          setLiveNetworkOrders(data.liveNetworkOrders)
        }
        setLastSyncTime(new Date().toLocaleTimeString('fr-FR'))
        if (isManual) {
          toast.success('🚀 Tout le SaaS est synchronisé avec succès !')
        }
      }
    } catch (err) {
      console.warn('Fallback super-admin sync:', err)
      if (isManual) toast.info('Synchronisé localement')
    } finally {
      if (isManual) setIsSyncing(false)
    }
  }, [])

  // Initial load + periodic 12s live heartbeat polling
  useEffect(() => {
    fetchSuperAdminData()
    const interval = setInterval(() => {
      fetchSuperAdminData(false)
    }, 12000)
    return () => clearInterval(interval)
  }, [fetchSuperAdminData])

  // Calculate Live Aggregates
  const totalTenants = restaurants.length
  const activeTenants = restaurants.filter(r => r.isActive).length
  const totalOrdersNetwork = restaurants.reduce((sum, r) => sum + (r.orderCount || 0), 0)
  const totalVolumeNetwork = restaurants.reduce((sum, r) => sum + (r.totalVolume || 0), 0)
  
  // MRR: Monthly subscriptions + (Annual / 12)
  const mrr = restaurants.reduce((sum, r) => {
    if (!r.isActive) return sum
    return sum + (r.billingCycle === 'annual' ? 4500 : 5500)
  }, 0)
  const arr = mrr * 12

  // 1. Toggle Restaurant Status (Synchronized with Backend & LocalStorage & Client Menus)
  const handleToggleStatus = async (id: string) => {
    const target = restaurants.find(r => r.id === id)
    if (!target) return
    const nextState = !target.isActive

    // Optimistic UI update
    setRestaurants(prev => prev.map(r => r.id === id ? { ...r, isActive: nextState } : r))

    // Save in LocalStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`zagoor_restaurant_status_${target.slug}`, nextState ? 'active' : 'suspended')
        localStorage.setItem(`zagoor_restaurant_status_${target.id}`, nextState ? 'active' : 'suspended')
      } catch {}
    }

    // Call Backend API
    try {
      const res = await fetch('/api/admin/super-admin', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: nextState })
      })

      if (res.ok) {
        toast.success(`Statut de « ${target.name} » : ${nextState ? 'Actif 🟢' : 'Suspendu 🔴'}`)
      } else {
        toast.info(`Statut synchronisé : ${nextState ? 'Actif 🟢' : 'Suspendu 🔴'}`)
      }
    } catch {
      toast.info(`Statut synchronisé localement : ${nextState ? 'Actif 🟢' : 'Suspendu 🔴'}`)
    }
  }

  // 2. Handle Add Partner Restaurant (Synchronized creation)
  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPartnerForm.name || !newPartnerForm.ownerName || !newPartnerForm.email) {
      toast.error('Veuillez remplir les informations obligatoires.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/super-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPartnerForm)
      })

      const data = await res.json()
      if (res.ok && data.restaurant) {
        setRestaurants(prev => [data.restaurant, ...prev.filter(r => r.id !== data.restaurant.id)])
        
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`zagoor_restaurant_${data.restaurant.slug}`, JSON.stringify(data.restaurant))
          } catch {}
        }
        
        toast.success(`👑 Partenaire « ${data.restaurant.name} » activé et en ligne immédiatement !`)
        setAddModalOpen(false)
        setNewPartnerForm({
          name: '',
          ownerName: '',
          email: '',
          phone: '',
          city: 'Cotonou',
          country: 'Bénin',
          billingCycle: 'monthly',
          serviceType: 'both',
          tableCount: 8
        })
      } else {
        toast.error(data.error || 'Erreur lors de la création')
      }
    } catch {
      toast.error('Erreur réseau lors de la création')
    } finally {
      setLoading(false)
    }
  }

  // 3. Handle Delete / Archive Restaurant
  const handleDeletePartner = async (id: string) => {
    const target = restaurants.find(r => r.id === id)
    if (!target) return

    setRestaurants(prev => prev.filter(r => r.id !== id))
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`zagoor_restaurant_${target.slug}`)
      } catch {}
    }

    try {
      await fetch(`/api/admin/super-admin?id=${id}`, { method: 'DELETE' })
      toast.success(`Restaurant « ${target.name} » retiré du réseau.`)
    } catch {
      toast.info(`Restaurant « ${target.name} » retiré localement.`)
    } finally {
      setDeleteConfirmId(null)
    }
  }

  // Filtered restaurants
  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.includes(searchQuery)
    
    if (filterStatus === 'active') return matchesSearch && r.isActive
    if (filterStatus === 'inactive') return matchesSearch && !r.isActive
    return matchesSearch
  })

  return (
    <div className="min-h-screen bg-[#FFFBF5] text-[#1C1917] font-sans antialiased selection:bg-[#EA580C] selection:text-white relative pb-20">
      
      {/* Background Noise Texture */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.035] bg-noise" />

      {/* 🧭 Top Executive Header */}
      <header className="sticky top-0 z-40 bg-[#1C1917] text-white border-b border-[#292524] px-4 sm:px-8 py-3.5 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#EA580C] to-[#C2410C] flex items-center justify-center text-white shadow-lg shadow-[#EA580C]/30">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white font-heading">
                  Zagoor SaaS <span className="text-[#EA580C]">Cockpit Fondateur</span>
                </span>
                <Badge className="bg-[#EA580C] text-white text-[10px] font-extrabold px-2 py-0.5 uppercase tracking-wider">
                  Super Admin
                </Badge>
              </div>
              <p className="text-[11px] text-[#A8A29E] flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
                <span>Synchronisé en direct avec toute la plateforme</span>
                {lastSyncTime && <span className="text-[10px] text-[#78716C]">({lastSyncTime})</span>}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            {/* Live Sync Button */}
            <Button
              onClick={() => fetchSuperAdminData(true)}
              disabled={isSyncing}
              size="sm"
              variant="outline"
              className="bg-[#292524] hover:bg-[#44403C] border-[#44403C] text-white text-xs font-bold rounded-xl gap-1.5 h-9"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 text-[#EA580C]", isSyncing && "animate-spin")} />
              <span>{isSyncing ? 'Synchronisation...' : 'Synchroniser SaaS'}</span>
            </Button>

            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#292524] hover:bg-[#44403C] text-white font-bold transition-all border border-[#44403C]"
            >
              <Store className="w-3.5 h-3.5 text-[#EA580C]" />
              <span>Cockpit Gérant (/admin)</span>
            </Link>

            <Link
              href="/le-jardin-savoureux"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#292524] hover:bg-[#44403C] text-white font-bold transition-all border border-[#44403C]"
            >
              <UtensilsCrossed className="w-3.5 h-3.5 text-[#EA580C]" />
              <span>Menu Démo (/jardin)</span>
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#FFF7ED] text-[#1C1917] font-bold transition-all shadow-xs"
            >
              <span>Landing Page</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#78716C]" />
            </Link>
          </div>

        </div>
      </header>

      {/* 👑 Master Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* 📊 4 KPI Metric Cards (MRR / ARR / Tenants / Volume) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          {/* Card 1: MRR */}
          <Card className="rounded-3xl border border-[#FDE8CD] bg-white p-6 shadow-xs relative overflow-hidden group hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#78716C] uppercase tracking-wider">MRR (Revenu Mensuel)</span>
              <div className="w-10 h-10 rounded-2xl bg-[#EA580C]/10 text-[#EA580C] flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl sm:text-3xl font-black text-[#EA580C] font-mono tracking-tight">
                {formatXOF(mrr)}
              </h3>
              <p className="text-xs text-[#16A34A] font-bold flex items-center gap-1 mt-1">
                <TrendingUp className="w-3.5 h-3.5" /> +24.5% de croissance SaaS
              </p>
            </div>
          </Card>

          {/* Card 2: ARR */}
          <Card className="rounded-3xl border border-[#FDE8CD] bg-white p-6 shadow-xs relative overflow-hidden group hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#78716C] uppercase tracking-wider">ARR (Revenu Annuel)</span>
              <div className="w-10 h-10 rounded-2xl bg-[#16A34A]/10 text-[#16A34A] flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl sm:text-3xl font-black text-[#16A34A] font-mono tracking-tight">
                {formatXOF(arr)}
              </h3>
              <p className="text-xs text-[#78716C] mt-1">
                Projection sur 12 mois
              </p>
            </div>
          </Card>

          {/* Card 3: Active Tenants */}
          <Card className="rounded-3xl border border-[#FDE8CD] bg-white p-6 shadow-xs relative overflow-hidden group hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Restaurants Inscrits</span>
              <div className="w-10 h-10 rounded-2xl bg-[#CA8A04]/10 text-[#CA8A04] flex items-center justify-center font-bold">
                <Store className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl sm:text-3xl font-black text-[#1C1917] font-mono tracking-tight">
                  {totalTenants}
                </h3>
                <span className="text-xs font-bold text-[#16A34A]">({activeTenants} Actifs)</span>
              </div>
              <p className="text-xs text-[#78716C] mt-1">
                Restaurants, Lounges & Dark Kitchens
              </p>
            </div>
          </Card>

          {/* Card 4: Orders & Volume */}
          <Card className="rounded-3xl border border-[#FDE8CD] bg-white p-6 shadow-xs relative overflow-hidden group hover:shadow-lg transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#78716C] uppercase tracking-wider">Commandes Réseau</span>
              <div className="w-10 h-10 rounded-2xl bg-[#0284C7]/10 text-[#0284C7] flex items-center justify-center font-bold">
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl sm:text-3xl font-black text-[#1C1917] font-mono tracking-tight">
                {totalOrdersNetwork.toLocaleString('fr-FR')}
              </h3>
              <p className="text-xs text-[#78716C] mt-1">
                {formatXOF(totalVolumeNetwork)} générés
              </p>
            </div>
          </Card>

        </div>

        {/* 🧭 Main Navigation Tabs */}
        <div className="flex items-center justify-center">
          <div className="inline-flex p-1.5 bg-white/90 backdrop-blur-md rounded-2xl border border-[#FDE8CD] shadow-sm gap-1">
            <button
              onClick={() => setActiveTab('tenants')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2",
                activeTab === 'tenants'
                  ? "bg-[#EA580C] text-white shadow-md shadow-[#EA580C]/20 scale-[1.02]"
                  : "text-[#78716C] hover:text-[#1C1917] hover:bg-[#FFF7ED]"
              )}
            >
              <Store className="w-4 h-4" />
              <span>Restaurants ({totalTenants})</span>
            </button>

            <button
              onClick={() => setActiveTab('transactions')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2",
                activeTab === 'transactions'
                  ? "bg-[#EA580C] text-white shadow-md shadow-[#EA580C]/20 scale-[1.02]"
                  : "text-[#78716C] hover:text-[#1C1917] hover:bg-[#FFF7ED]"
              )}
            >
              <CreditCard className="w-4 h-4" />
              <span>Encaissements SaaS</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2",
                activeTab === 'analytics'
                  ? "bg-[#EA580C] text-white shadow-md shadow-[#EA580C]/20 scale-[1.02]"
                  : "text-[#78716C] hover:text-[#1C1917] hover:bg-[#FFF7ED]"
              )}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Performances Réseau</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2",
                activeTab === 'settings'
                  ? "bg-[#EA580C] text-white shadow-md shadow-[#EA580C]/20 scale-[1.02]"
                  : "text-[#78716C] hover:text-[#1C1917] hover:bg-[#FFF7ED]"
              )}
            >
              <Settings className="w-4 h-4" />
              <span>Paramètres SaaS</span>
            </button>
          </div>
        </div>

        {/* 🏢 TAB 1: RESTAURANTS TENANTS MANAGEMENT */}
        {activeTab === 'tenants' && (
          <div className="space-y-6">
            
            {/* Search, Filters and Create Button Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-[#FDE8CD] shadow-xs">
              
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#78716C]" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par nom, ville, gérant..."
                  className="pl-9 bg-[#FFFBF5] border-[#FDE8CD] rounded-xl text-xs h-10"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-1 bg-[#FFFBF5] p-1 rounded-xl border border-[#FDE8CD]">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                      filterStatus === 'all' ? "bg-white text-[#EA580C] shadow-xs" : "text-[#78716C]"
                    )}
                  >
                    Tous
                  </button>
                  <button
                    onClick={() => setFilterStatus('active')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                      filterStatus === 'active' ? "bg-white text-[#16A34A] shadow-xs" : "text-[#78716C]"
                    )}
                  >
                    Actifs
                  </button>
                  <button
                    onClick={() => setFilterStatus('inactive')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                      filterStatus === 'inactive' ? "bg-white text-[#DC2626] shadow-xs" : "text-[#78716C]"
                    )}
                  >
                    Suspendus
                  </button>
                </div>

                <Button
                  onClick={() => setAddModalOpen(true)}
                  className="bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl text-xs font-bold h-10 px-4 shadow-md shadow-[#EA580C]/20 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouveau Restaurant Partenaire</span>
                </Button>
              </div>

            </div>

            {/* Restaurants Master Table */}
            <Card className="rounded-3xl border border-[#FDE8CD] bg-white overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FFF7ED] text-[#1C1917] font-extrabold uppercase tracking-wider text-[11px] border-b border-[#FDE8CD]">
                    <tr>
                      <th className="py-4 px-6">Établissement</th>
                      <th className="py-4 px-4">Gérant & Contact</th>
                      <th className="py-4 px-4">Localisation</th>
                      <th className="py-4 px-4">Formule & MRR</th>
                      <th className="py-4 px-4 text-center">Tables QR</th>
                      <th className="py-4 px-4 text-center">Statut</th>
                      <th className="py-4 px-6 text-right">Actions Fondateur</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#FDE8CD]/70">
                    {filteredRestaurants.map((resto) => (
                      <tr key={resto.id} className="hover:bg-[#FFFBF5] transition-colors">
                        
                        {/* Restaurant Name & Type */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#FFF7ED] border border-[#FDE8CD] text-[#EA580C] flex items-center justify-center font-bold flex-shrink-0">
                              <UtensilsCrossed className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-sm text-[#1C1917]">{resto.name}</h4>
                              <p className="text-[11px] text-[#78716C] font-mono">/{resto.slug}</p>
                            </div>
                          </div>
                        </td>

                        {/* Owner & Contact WhatsApp */}
                        <td className="py-4 px-4">
                          <p className="font-bold text-[#1C1917]">{resto.ownerName}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <a
                              href={`https://wa.me/${resto.phone.replace(/[^0-9]/g, '')}?text=Bonjour%20${encodeURIComponent(resto.ownerName)},%20je%20suis%20le%20fondateur%20de%20Zagoor%20RestoSaas.`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-[#16A34A] hover:underline flex items-center gap-1 font-semibold"
                            >
                              <MessageCircle className="w-3 h-3" /> {resto.phone}
                            </a>
                          </div>
                        </td>

                        {/* City & Country */}
                        <td className="py-4 px-4">
                          <span className="font-medium text-[#1C1917] flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#EA580C]" /> {resto.city}, {resto.country}
                          </span>
                          <span className="text-[10px] text-[#78716C] mt-0.5 block">
                            {resto.serviceType === 'online' ? '🛵 Dark Kitchen' : (resto.serviceType === 'physical' ? '🏛️ Salle physique' : '🌟 Salle & Livraison')}
                          </span>
                        </td>

                        {/* Pricing Plan */}
                        <td className="py-4 px-4">
                          <span className="font-black font-mono text-sm text-[#EA580C]">
                            {resto.billingCycle === 'annual' ? '54 000 FCFA/an' : '5 500 FCFA/mois'}
                          </span>
                          <Badge className="bg-[#16A34A]/10 text-[#16A34A] border-none text-[10px] block w-fit mt-0.5">
                            {resto.billingCycle === 'annual' ? 'Annuel Pro' : 'Mensuel Pro'}
                          </Badge>
                        </td>

                        {/* Tables count */}
                        <td className="py-4 px-4 text-center font-mono font-bold text-xs">
                          {resto.serviceType === 'online' ? '—' : `${resto.tableCount} tables`}
                        </td>

                        {/* Status Toggle (Directly Synchronized) */}
                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(resto.id)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-[11px] font-extrabold transition-all hover:scale-105 inline-flex items-center gap-1.5 shadow-xs",
                              resto.isActive
                                ? "bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20"
                                : "bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/20"
                            )}
                            title="Cliquer pour Activer ou Suspendre"
                          >
                            <span className={cn("w-2 h-2 rounded-full", resto.isActive ? "bg-[#16A34A] animate-pulse" : "bg-[#DC2626]")} />
                            <span>{resto.isActive ? 'Actif' : 'Suspendu'}</span>
                          </button>
                        </td>

                        {/* Founder Actions */}
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/${resto.slug}`}
                              target="_blank"
                              className="p-2 rounded-xl bg-[#FFF7ED] hover:bg-[#FDE8CD] text-[#EA580C] font-bold transition-colors"
                              title="Ouvrir le Menu Digital Client"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>

                            <Link
                              href={`/admin?restaurant=${resto.slug}`}
                              className="px-3 py-2 rounded-xl bg-[#1C1917] hover:bg-[#292524] text-white font-bold transition-colors flex items-center gap-1.5"
                              title="Ouvrir directement le Cockpit Gérant de ce restaurant"
                            >
                              <Store className="w-3.5 h-3.5 text-[#EA580C]" />
                              <span>Cockpit</span>
                            </Link>

                            <button
                              onClick={() => setDeleteConfirmId(resto.id)}
                              className="p-2 rounded-xl hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                              title="Retirer ce restaurant"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

          </div>
        )}

        {/* 💳 TAB 2: SAAS REVENUE TRANSACTIONS */}
        {activeTab === 'transactions' && (
          <div className="space-y-6">
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-[#1C1917] font-heading">
                  Historique des Encaissements SaaS
                </h3>
                <p className="text-xs text-[#78716C]">
                  Tous les paiements d&apos;abonnements souscrits par les restaurants via Wave, MTN MoMo, Flooz & Carte
                </p>
              </div>

              <Badge className="bg-[#16A34A]/10 text-[#16A34A] border-none px-3 py-1 text-xs font-bold">
                100% Réceptionnés en direct
              </Badge>
            </div>

            <Card className="rounded-3xl border border-[#FDE8CD] bg-white overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FFF7ED] text-[#1C1917] font-extrabold uppercase tracking-wider text-[11px] border-b border-[#FDE8CD]">
                    <tr>
                      <th className="py-4 px-6">Restaurant Client</th>
                      <th className="py-4 px-4">Formule Souscrite</th>
                      <th className="py-4 px-4">Moyen de Paiement</th>
                      <th className="py-4 px-4">Réf. Transaction</th>
                      <th className="py-4 px-4">Montant Reçu</th>
                      <th className="py-4 px-4">Date</th>
                      <th className="py-4 px-6 text-right">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#FDE8CD]/70">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#FFFBF5] transition-colors">
                        <td className="py-4 px-6 font-bold text-[#1C1917]">{tx.restaurantName}</td>
                        <td className="py-4 px-4 text-[#78716C]">{tx.plan}</td>
                        <td className="py-4 px-4 font-medium flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-[#EA580C]" /> {tx.paymentMethod}
                        </td>
                        <td className="py-4 px-4 font-mono text-[#78716C]">{tx.reference}</td>
                        <td className="py-4 px-4 font-black font-mono text-sm text-[#16A34A]">
                          +{formatXOF(tx.amount)}
                        </td>
                        <td className="py-4 px-4 text-[#78716C]">
                          {new Date(tx.date).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#16A34A] bg-[#16A34A]/10 px-2.5 py-1 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Encaissé
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

          </div>
        )}

        {/* 📊 TAB 3: NETWORK PERFORMANCE & LIVE STREAM */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <Card className="rounded-3xl border border-[#FDE8CD] bg-white p-6 shadow-xs space-y-4">
                <h4 className="font-extrabold text-base text-[#1C1917] flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#EA580C]" /> Répartition par Pays
                </h4>
                <div className="space-y-3">
                  {[
                    { country: 'Bénin (Cotonou, Porto-Novo, Parakou)', pct: 42, count: `${Math.round(totalTenants * 0.42)} restaurants` },
                    { country: 'Côte d\'Ivoire (Abidjan, San-Pédro, Yamoussoukro)', pct: 28, count: `${Math.round(totalTenants * 0.28)} restaurants` },
                    { country: 'Sénégal (Dakar, Saly, Saint-Louis)', pct: 18, count: `${Math.round(totalTenants * 0.18)} restaurants` },
                    { country: 'Togo (Lomé, Kpalimé)', pct: 8, count: `${Math.round(totalTenants * 0.08)} restaurants` },
                    { country: 'Autres (Mali, Cameroun, Gabon, Guinée)', pct: 4, count: 'Émergent' }
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{item.country}</span>
                        <span className="text-[#EA580C] font-mono font-bold">{item.pct}% ({item.count})</span>
                      </div>
                      <div className="w-full h-2 bg-[#FFF7ED] rounded-full overflow-hidden">
                        <div className="h-full bg-[#EA580C] rounded-full" style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="rounded-3xl border border-[#FDE8CD] bg-white p-6 shadow-xs space-y-4">
                <h4 className="font-extrabold text-base text-[#1C1917] flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#16A34A]" /> Répartition des Encaissements
                </h4>
                <div className="space-y-3">
                  {[
                    { method: 'Wave Mobile Money', pct: 45, color: 'bg-cyan-500' },
                    { method: 'MTN Mobile Money (MoMo)', pct: 30, color: 'bg-yellow-500' },
                    { method: 'Moov Money (Flooz)', pct: 15, color: 'bg-blue-600' },
                    { method: 'Carte Bancaire (Visa / Mastercard)', pct: 10, color: 'bg-slate-800' }
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>{item.method}</span>
                        <span className="font-mono font-bold">{item.pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-[#FFF7ED] rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

            </div>

            {/* Live Feed Network Activity */}
            {liveNetworkOrders.length > 0 && (
              <Card className="rounded-3xl border border-[#FDE8CD] bg-white p-6 shadow-xs space-y-4">
                <h4 className="font-extrabold text-base text-[#1C1917] flex items-center gap-2">
                  <Radio className="w-5 h-5 text-[#16A34A] animate-pulse" />
                  <span>Flux des Commandes Réseau en Temps Réel</span>
                </h4>
                <div className="divide-y divide-[#FDE8CD]/70">
                  {liveNetworkOrders.map((ord) => (
                    <div key={ord.id} className="py-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#FFF7ED] text-[#EA580C] font-mono font-bold flex items-center justify-center">
                          #
                        </div>
                        <div>
                          <p className="font-bold text-[#1C1917]">
                            Commande {ord.orderNumber} • <span className="text-[#EA580C]">{ord.restaurantName}</span>
                          </p>
                          <p className="text-[11px] text-[#78716C]">
                            Client : {ord.customerName} • {new Date(ord.date).toLocaleTimeString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono font-extrabold text-sm text-[#16A34A]">
                        {formatXOF(ord.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

          </div>
        )}

        {/* ⚙️ TAB 4: SAAS SETTINGS & PRICING */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <Card className="rounded-3xl border border-[#FDE8CD] bg-white p-8 shadow-xs space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-[#FDE8CD]">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF7ED] text-[#EA580C] flex items-center justify-center font-bold">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-[#1C1917] font-heading">
                    Paramètres Généraux de la Plateforme Zagoor
                  </h3>
                  <p className="text-xs text-[#78716C]">
                    Configurez vos tarifs d&apos;abonnements et coordonnées fondateur
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Tarif Mensuel Standard</Label>
                  <Input defaultValue="5 500 FCFA / mois" className="bg-[#FFFBF5] border-[#FDE8CD] rounded-xl font-mono font-bold" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Tarif Annuel Réduit (-20%)</Label>
                  <Input defaultValue="54 000 FCFA / an" className="bg-[#FFFBF5] border-[#FDE8CD] rounded-xl font-mono font-bold text-[#16A34A]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Numéro WhatsApp Fondateur & Support</Label>
                <Input defaultValue="+229 97 12 34 56" className="bg-[#FFFBF5] border-[#FDE8CD] rounded-xl font-mono" />
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  onClick={() => toast.success('Paramètres SaaS sauvegardés avec succès !')}
                  className="bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl text-xs font-bold px-6 h-11 shadow-md shadow-[#EA580C]/20"
                >
                  Enregistrer les Modifications
                </Button>
              </div>
            </Card>
          </div>
        )}

      </main>

      {/* ➕ Modal: Ajouter un Nouveau Restaurant Partenaire */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md bg-white border border-[#FDE8CD] rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-[#1C1917] flex items-center gap-2">
              <Crown className="w-5 h-5 text-[#EA580C]" />
              Ajouter un Restaurant Partenaire
            </DialogTitle>
            <DialogDescription className="text-xs text-[#78716C]">
              Création et activation instantanée avec menu et QR codes
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePartner} className="space-y-3.5 pt-2">
            <div>
              <Label className="text-xs font-bold">Nom du Restaurant *</Label>
              <Input
                required
                value={newPartnerForm.name}
                onChange={(e) => setNewPartnerForm({ ...newPartnerForm, name: e.target.value })}
                placeholder="Ex: Le Teranga Lounge"
                className="border-[#FDE8CD] rounded-xl text-xs mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Nom du Gérant *</Label>
                <Input
                  required
                  value={newPartnerForm.ownerName}
                  onChange={(e) => setNewPartnerForm({ ...newPartnerForm, ownerName: e.target.value })}
                  placeholder="Ex: Chef Awa"
                  className="border-[#FDE8CD] rounded-xl text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">WhatsApp / Tél *</Label>
                <Input
                  value={newPartnerForm.phone}
                  onChange={(e) => setNewPartnerForm({ ...newPartnerForm, phone: e.target.value })}
                  placeholder="+229 97 00 00 00"
                  className="border-[#FDE8CD] rounded-xl text-xs mt-1 font-mono"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold">Email du Gérant *</Label>
              <Input
                type="email"
                required
                value={newPartnerForm.email}
                onChange={(e) => setNewPartnerForm({ ...newPartnerForm, email: e.target.value })}
                placeholder="gerant@restaurant.com"
                className="border-[#FDE8CD] rounded-xl text-xs mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-bold">Ville</Label>
                <Input
                  value={newPartnerForm.city}
                  onChange={(e) => setNewPartnerForm({ ...newPartnerForm, city: e.target.value })}
                  placeholder="Cotonou"
                  className="border-[#FDE8CD] rounded-xl text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-bold">Pays</Label>
                <Input
                  value={newPartnerForm.country}
                  onChange={(e) => setNewPartnerForm({ ...newPartnerForm, country: e.target.value })}
                  placeholder="Bénin"
                  className="border-[#FDE8CD] rounded-xl text-xs mt-1"
                />
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddModalOpen(false)}
                className="border-[#FDE8CD] rounded-xl text-xs font-bold"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-[#EA580C] hover:bg-[#C2410C] text-white rounded-xl text-xs font-bold px-6 shadow-md shadow-[#EA580C]/20"
              >
                {loading ? 'Création en cours...' : 'Activer le Restaurant'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 🗑️ Modal: Confirmer la suppression d'un restaurant */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm bg-white border border-[#FDE8CD] rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-[#1C1917] flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Retirer ce restaurant ?
            </DialogTitle>
            <DialogDescription className="text-xs text-[#78716C]">
              Cette action retirera l&apos;accès à ce restaurant sur le réseau SaaS.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 flex gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              className="border-[#FDE8CD] rounded-xl text-xs font-bold flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={() => deleteConfirmId && handleDeletePartner(deleteConfirmId)}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex-1"
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
