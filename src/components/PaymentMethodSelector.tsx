'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CreditCard, 
  Smartphone, 
  Banknote, 
  CheckCircle2, 
  QrCode, 
  ShieldCheck, 
  Zap, 
  Phone, 
  ChevronDown,
  Lock,
  ArrowRight,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'

export type PaymentProviderId = 'wave' | 'orange' | 'mtn' | 'moov' | 'card' | 'cash'

export interface PaymentProviderInfo {
  id: PaymentProviderId
  name: string
  category: 'mobile_money' | 'card' | 'cash'
  badge: string
  color: string
  textColor: string
  bgLight: string
  borderColor: string
  iconName: string
  ussdCode?: string
  description: string
}

export const PAYMENT_PROVIDERS: PaymentProviderInfo[] = [
  {
    id: 'wave',
    name: 'Wave',
    category: 'mobile_money',
    badge: '0% Frais • Instantané',
    color: '#1DC3F3',
    textColor: 'text-[#0284C7]',
    bgLight: 'bg-[#F0F9FF]',
    borderColor: 'border-[#BAE6FD]',
    iconName: '🌊',
    ussdCode: 'App Wave / QR',
    description: 'Validation en 1 clic via notification ou QR code Wave.',
  },
  {
    id: 'orange',
    name: 'Orange Money',
    category: 'mobile_money',
    badge: 'OM Pay / OTP',
    color: '#FF7900',
    textColor: 'text-[#EA580C]',
    bgLight: 'bg-[#FFF7ED]',
    borderColor: 'border-[#FDBA74]',
    iconName: '🟧',
    ussdCode: '#144#391#',
    description: 'Générez votre code secret éphémère ou validez par USSD.',
  },
  {
    id: 'mtn',
    name: 'MTN Mobile Money',
    category: 'mobile_money',
    badge: 'MoMo Push',
    color: '#FFCC00',
    textColor: 'text-[#CA8A04]',
    bgLight: 'bg-[#FEFCE8]',
    borderColor: 'border-[#FDE047]',
    iconName: '🟨',
    ussdCode: '*133# / Push',
    description: 'Notification de confirmation envoyée directement sur votre téléphone.',
  },
  {
    id: 'moov',
    name: 'Moov Money',
    category: 'mobile_money',
    badge: 'Flooz',
    color: '#005DAA',
    textColor: 'text-[#0284C7]',
    bgLight: 'bg-[#F0FDF4]',
    borderColor: 'border-[#86EFAC]',
    iconName: '🟦',
    ussdCode: '*155# / Flooz',
    description: 'Débit direct et sécurisé sur votre portefeuille Flooz.',
  },
  {
    id: 'card',
    name: 'Carte Bancaire',
    category: 'card',
    badge: 'Visa • Mastercard',
    color: '#1E293B',
    textColor: 'text-[#1E293B]',
    bgLight: 'bg-slate-50',
    borderColor: 'border-slate-200',
    iconName: '💳',
    description: 'Paiement international chiffré 3D-Secure 256 bits.',
  },
  {
    id: 'cash',
    name: 'Espèces / Sur Place',
    category: 'cash',
    badge: 'À la table / Livraison',
    color: '#16A34A',
    textColor: 'text-[#16A34A]',
    bgLight: 'bg-emerald-50/60',
    borderColor: 'border-emerald-200',
    iconName: '💵',
    description: 'Règlement au serveur lors du service ou au livreur.',
  },
]

export const COUNTRY_PREFIXES = [
  { code: '+229', country: 'Bénin', flag: '🇧🇯', placeholder: '97 00 00 00' },
  { code: '+225', country: 'Côte d\'Ivoire', flag: '🇨🇮', placeholder: '07 00 00 00 00' },
  { code: '+221', country: 'Sénégal', flag: '🇸🇳', placeholder: '77 000 00 00' },
  { code: '+228', country: 'Togo', flag: '🇹🇬', placeholder: '90 00 00 00' },
  { code: '+226', country: 'Burkina Faso', flag: '🇧🇫', placeholder: '70 00 00 00' },
  { code: '+223', country: 'Mali', flag: '🇲🇱', placeholder: '70 00 00 00' },
  { code: '+237', country: 'Cameroun', flag: '🇨🇲', placeholder: '6 90 00 00 00' },
  { code: '+33', country: 'France', flag: '🇫🇷', placeholder: '6 12 34 56 78' },
]

interface PaymentMethodSelectorProps {
  selectedProvider: PaymentProviderId
  onSelectProvider: (provider: PaymentProviderId) => void
  phoneNumber: string
  onPhoneChange: (phone: string) => void
  countryCode?: string
  onCountryCodeChange?: (code: string) => void
  allowCash?: boolean
  className?: string
  currency?: string
  amount?: number
}

export default function PaymentMethodSelector({
  selectedProvider,
  onSelectProvider,
  phoneNumber,
  onPhoneChange,
  countryCode = '+229',
  onCountryCodeChange,
  allowCash = true,
  className,
  currency = 'XOF',
  amount,
}: PaymentMethodSelectorProps) {
  const [showCountryMenu, setShowCountryMenu] = useState(false)
  const currentProvider = PAYMENT_PROVIDERS.find(p => p.id === selectedProvider) || PAYMENT_PROVIDERS[0]
  const currentCountry = COUNTRY_PREFIXES.find(c => c.code === countryCode) || COUNTRY_PREFIXES[0]

  const availableProviders = allowCash 
    ? PAYMENT_PROVIDERS 
    : PAYMENT_PROVIDERS.filter(p => p.id !== 'cash')

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header Label */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-[#1C1917] flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-[#EA580C]" />
          Mode de règlement
        </label>
        <span className="text-[10px] font-semibold text-[#78716C] bg-[#FFF7ED] px-2 py-0.5 rounded-full border border-[#FDE8CD]">
          Chiffré SSL 256-bit
        </span>
      </div>

      {/* Grid of Providers */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {availableProviders.map((provider) => {
          const isSelected = selectedProvider === provider.id

          return (
            <motion.button
              key={provider.id}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelectProvider(provider.id)}
              className={cn(
                'relative p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden',
                isSelected
                  ? 'bg-white border-[#EA580C] shadow-md shadow-[#EA580C]/15 ring-2 ring-[#EA580C]/20'
                  : 'bg-[#FAFAF9] border-[#FDE8CD]/80 hover:bg-white hover:border-[#EA580C]/40'
              )}
            >
              {/* Selected indicator corner */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <CheckCircle2 className="w-4 h-4 text-[#EA580C]" />
                </div>
              )}

              {/* Provider Header */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg leading-none">{provider.iconName}</span>
                  <span className="font-extrabold text-xs text-[#1C1917] truncate">
                    {provider.name}
                  </span>
                </div>
                <span className={cn(
                  'inline-block text-[9px] font-bold px-2 py-0.5 rounded-md truncate max-w-full',
                  provider.bgLight,
                  provider.textColor,
                  'border',
                  provider.borderColor
                )}>
                  {provider.badge}
                </span>
              </div>

              {/* Bottom active bar */}
              <div 
                className={cn(
                  'h-1 w-full rounded-full mt-2 transition-all',
                  isSelected ? 'bg-[#EA580C]' : 'bg-transparent'
                )} 
              />
            </motion.button>
          )
        })}
      </div>

      {/* Dynamic details per selected provider */}
      <AnimatePresence mode="wait">
        {currentProvider.category === 'mobile_money' && (
          <motion.div
            key={currentProvider.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="p-3.5 rounded-2xl bg-[#FFFBF5] border border-[#FDE8CD] space-y-3"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-[#1C1917] font-bold">
                <Smartphone className="w-4 h-4 text-[#EA580C]" />
                <span>Numéro de débit {currentProvider.name}</span>
              </div>
              {currentProvider.ussdCode && (
                <span className="text-[10px] font-mono font-bold text-[#EA580C] bg-[#FFF7ED] px-2 py-0.5 rounded-md border border-[#FDE8CD]">
                  {currentProvider.ussdCode}
                </span>
              )}
            </div>

            {/* Phone Input with Country Prefix Dropdown */}
            <div className="flex gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCountryMenu(!showCountryMenu)}
                  className="h-10 px-2.5 bg-white border border-[#FDE8CD] rounded-xl flex items-center gap-1.5 text-xs font-bold text-[#1C1917] hover:bg-[#FFF7ED] transition-colors"
                >
                  <span>{currentCountry.flag}</span>
                  <span className="font-mono">{currentCountry.code}</span>
                  <ChevronDown className="w-3 h-3 text-[#78716C]" />
                </button>

                {/* Country dropdown */}
                {showCountryMenu && (
                  <div className="absolute top-full left-0 mt-1.5 w-48 bg-white border border-[#FDE8CD] rounded-xl shadow-xl z-50 py-1 max-h-48 overflow-y-auto">
                    {COUNTRY_PREFIXES.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          if (onCountryCodeChange) onCountryCodeChange(c.code)
                          setShowCountryMenu(false)
                        }}
                        className="w-full px-3 py-1.5 text-left text-xs font-medium hover:bg-[#FFF7ED] flex items-center justify-between text-[#1C1917]"
                      >
                        <span className="flex items-center gap-2">
                          <span>{c.flag}</span>
                          <span>{c.country}</span>
                        </span>
                        <span className="font-mono text-[11px] text-[#78716C]">{c.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative flex-1">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => onPhoneChange(e.target.value)}
                  placeholder={currentCountry.placeholder}
                  className="w-full h-10 px-3.5 bg-white border border-[#FDE8CD] rounded-xl text-xs font-mono font-bold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C]"
                />
              </div>
            </div>

            <p className="text-[11px] text-[#78716C] leading-snug flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#EA580C] flex-shrink-0" />
              <span>{currentProvider.description}</span>
            </p>
          </motion.div>
        )}

        {currentProvider.id === 'card' && (
          <motion.div
            key="card-info"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-700"
          >
            <div className="flex items-center justify-between font-bold text-slate-900">
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-blue-600" />
                Carte Bancaire Visa / Mastercard
              </span>
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Vous serez redirigé vers l'interface de paiement sécurisé 3D-Secure de votre banque pour autoriser la transaction.
            </p>
          </motion.div>
        )}

        {currentProvider.id === 'cash' && (
          <motion.div
            key="cash-info"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2 text-xs text-emerald-950"
          >
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <Banknote className="w-4 h-4 text-emerald-600" />
              Règlement en espèces
            </div>
            <p className="text-[11px] text-emerald-800 leading-snug">
              Préparez le montant exact ou votre monnaie. La commande sera immédiatement transmise en cuisine.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
