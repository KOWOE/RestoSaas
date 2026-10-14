import { z } from 'zod'

// ============================================================================
// Schémas de validation Zod — utilisés par toutes les routes API
// ============================================================================

const trimmedString = (min: number, max: number) =>
  z.string().trim().min(min).max(max)

export const emailSchema = z.string().trim().email().max(254)

// Téléphone : formats internationaux souples (+229 97 xx xx xx, chiffres espaces +)
export const phoneSchema = z
  .string()
  .trim()
  .min(6, 'Numéro de téléphone trop court')
  .max(32)
  .regex(/^[+0-9\s().-]+$/, 'Numéro de téléphone invalide')

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const loginSchema = z.object({
  email: emailSchema,
  password: trimmedString(1, 128),
})

// ---------------------------------------------------------------------------
// Commandes
// ---------------------------------------------------------------------------
export const orderItemSchema = z.object({
  productId: trimmedString(1, 64),
  quantity: z.number().int().min(1).max(100),
  notes: z.string().trim().max(500).optional().nullable(),
})

export const createOrderSchema = z.object({
  restaurantId: trimmedString(1, 64),
  items: z.array(orderItemSchema).min(1).max(50),
  customerName: trimmedString(1, 120).optional().nullable(),
  customerPhone: phoneSchema.optional().nullable(),
  customerEmail: emailSchema.optional().nullable(),
  tableNumber: trimmedString(1, 20).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  type: z.enum(['dine_in', 'takeaway', 'delivery']).optional(),
  paymentMethod: z
    .enum(['cash', 'mobile_money', 'card', 'moneroo', 'fedapay', 'assazara', 'sur_place'])
    .optional()
    .nullable(),
  paymentProvider: z.string().trim().max(60).optional().nullable(),
  paymentPhone: phoneSchema.optional().nullable(),
})

export const updateOrderSchema = z.object({
  id: trimmedString(1, 64),
  status: z
    .enum(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'])
    .optional(),
  // Uniquement pour l'encaissement encaissé (espèces) par le staff authentifié
  // du restaurant concerné. Les paiements en ligne sont marqués par le webhook.
  paymentStatus: z.enum(['pending', 'paid', 'failed', 'refunded']).optional(),
  paymentMethod: z.string().trim().max(30).optional().nullable(),
})

// ---------------------------------------------------------------------------
// Produits / Catégories
// ---------------------------------------------------------------------------
export const createProductSchema = z.object({
  name: trimmedString(1, 160),
  description: z.string().trim().max(2000).optional().nullable(),
  price: z.coerce.number().min(0).max(10_000_000),
  image: z.string().trim().max(2048).optional().nullable(),
  categoryId: trimmedString(1, 64),
  restaurantId: trimmedString(1, 64),
  isAvailable: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  preparationTime: z.coerce.number().int().min(0).max(600).optional().nullable(),
  calories: z.coerce.number().int().min(0).max(20000).optional().nullable(),
})

export const updateProductSchema = z.object({
  id: trimmedString(1, 64),
  name: trimmedString(1, 160).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  price: z.coerce.number().min(0).max(10_000_000).optional(),
  image: z.string().trim().max(2048).optional().nullable(),
  categoryId: trimmedString(1, 64).optional(),
  restaurantId: trimmedString(1, 64).optional(),
  isAvailable: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  preparationTime: z.coerce.number().int().min(0).max(600).optional().nullable(),
  calories: z.coerce.number().int().min(0).max(20000).optional().nullable(),
})

export const createCategorySchema = z.object({
  name: trimmedString(1, 120),
  description: z.string().trim().max(1000).optional().nullable(),
  image: z.string().trim().max(2048).optional().nullable(),
  icon: z.string().trim().max(16).optional().nullable(),
  restaurantId: trimmedString(1, 64),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
})

export const updateCategorySchema = z.object({
  id: trimmedString(1, 64),
  name: trimmedString(1, 120).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  image: z.string().trim().max(2048).optional().nullable(),
  icon: z.string().trim().max(16).optional().nullable(),
  restaurantId: trimmedString(1, 64).optional(),
  sortOrder: z.number().int().min(0).max(10_000).optional(),
  isActive: z.boolean().optional(),
})

// ---------------------------------------------------------------------------
// Restaurants
// ---------------------------------------------------------------------------
export const createRestaurantSchema = z.object({
  name: trimmedString(1, 160),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/)
    .max(120)
    .optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  phone: phoneSchema.optional().nullable(),
  email: emailSchema,
  currency: z.string().trim().length(3).optional(),
  taxRate: z.coerce.number().min(0).max(1).optional(),
  plan: z.enum(['basic', 'pro', 'premium']).optional(),
  serviceType: z.enum(['physical', 'online', 'both']).optional(),
  orderModes: z.string().trim().max(100).optional().nullable(),
})

export const updateRestaurantSchema = z.object({
  id: trimmedString(1, 64),
  name: trimmedString(1, 160).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  address: z.string().trim().max(500).optional().nullable(),
  phone: phoneSchema.optional().nullable(),
  email: emailSchema.optional(),
  currency: z.string().trim().length(3).optional(),
  taxRate: z.number().min(0).max(1).optional(),
  plan: z.enum(['basic', 'pro', 'premium']).optional(),
  serviceType: z.enum(['physical', 'online', 'both']).optional(),
  orderModes: z.string().trim().max(100).optional().nullable(),
  logo: z.string().trim().max(2048).optional().nullable(),
  banner: z.string().trim().max(2048).optional().nullable(),
  isActive: z.boolean().optional(),
})

// ---------------------------------------------------------------------------
// Onboarding (souscription)
// ---------------------------------------------------------------------------
export const onboardingSchema = z.object({
  restaurantName: trimmedString(2, 160),
  cuisineType: z.enum(['gastronomique', 'grillades', 'default']).optional(),
  serviceType: z.enum(['physical', 'online', 'both']).optional(),
  orderModes: z.string().trim().max(100).optional().nullable(),
  city: trimmedString(1, 120).optional().nullable(),
  country: trimmedString(1, 120).optional().nullable(),
  phone: phoneSchema.optional().nullable(),
  email: emailSchema,
  ownerName: trimmedString(2, 120),
  currency: z.string().trim().length(3).optional(),
  tableCount: z.coerce.number().int().min(0).max(50).optional(),
  billingCycle: z.enum(['monthly', 'annual']).optional(),
  paymentMethod: z.enum(['mobile_money', 'card']).optional(),
  paymentProvider: z.string().trim().max(60).optional(),
  paymentPhone: phoneSchema.optional().nullable(),
})

// ---------------------------------------------------------------------------
// Paiement
// ---------------------------------------------------------------------------
export const paymentInitSchema = z.object({
  amount: z.coerce.number().min(100).max(100_000_000),
  currency: z.string().trim().length(3).optional(),
  description: z.string().trim().max(500).optional(),
  customer: z
    .object({
      email: emailSchema.optional(),
      first_name: z.string().trim().max(100).optional(),
      last_name: z.string().trim().max(100).optional(),
      name: z.string().trim().max(160).optional(),
      phone: phoneSchema.optional(),
    })
    .optional(),
  orderId: z.string().trim().max(64).optional().nullable(),
  restaurantId: z.string().trim().max(64).optional().nullable(),
  type: z.enum(['subscription', 'order']).optional(),
  returnUrl: z.string().trim().max(2048).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

// ---------------------------------------------------------------------------
// Avis
// ---------------------------------------------------------------------------
export const reviewSchema = z.object({
  authorName: trimmedString(2, 120),
  authorRole: trimmedString(2, 80).optional(),
  restaurantName: trimmedString(2, 160),
  city: z.string().trim().max(120).optional().nullable(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  comment: trimmedString(10, 2000),
  avatar: z.string().trim().max(2048).optional().nullable(),
})

// ---------------------------------------------------------------------------
// Tracking
// ---------------------------------------------------------------------------
export const trackingQuerySchema = z
  .object({
    restaurantId: trimmedString(1, 64),
    orderNumber: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9-]{4,40}$/)
      .optional(),
    phone: z
      .string()
      .trim()
      .min(6, 'Recherche par téléphone : 6 caractères minimum')
      .max(32)
      .regex(/^[+0-9\s().-]+$/)
      .optional(),
  })
  .refine((v) => Boolean(v.orderNumber || v.phone), {
    message: 'orderNumber ou phone requis',
  })
