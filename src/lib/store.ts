import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Cart Item Type
export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  notes?: string
}

// User Type
export interface User {
  id: string
  email: string
  name: string
  role: string
  restaurantId?: string
}

// Restaurant Context
export interface RestaurantState {
  currentRestaurant: string | null
  restaurantName: string
  tableNumber: string | null
  setRestaurant: (id: string, name: string) => void
  setTable: (number: string | null) => void
}

// Cart Store
export interface CartState {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  updateNotes: (id: string, notes: string) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

// Auth Store
export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
}

// View Mode
export type ViewMode = 'menu' | 'dashboard' | 'tracking'

// Tracked Order
export interface TrackedOrder {
  id: string
  orderNumber: string
  status: string
  type: string
  tableNumber: string | null
  customerName: string | null
  customerPhone: string | null
  notes: string | null
  subtotal: number
  tax: number
  total: number
  paymentStatus: string
  paymentMethod: string | null
  createdAt: string
  updatedAt: string
  items: {
    id: string
    quantity: number
    price: number
    notes: string | null
    product: {
      id: string
      name: string
      image: string | null
    }
  }[]
}

// Customer Store (for tracking)
export interface CustomerState {
  trackedOrders: TrackedOrder[]
  customerPhone: string
  setTrackedOrders: (orders: TrackedOrder[]) => void
  setCustomerPhone: (phone: string) => void
  addTrackedOrder: (order: TrackedOrder) => void
  clearTrackedOrders: () => void
}

export interface AppState {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
}

// Restaurant Store
export const useRestaurantStore = create<RestaurantState>()(
  persist(
    (set) => ({
      currentRestaurant: null,
      restaurantName: '',
      tableNumber: null,
      setRestaurant: (id, name) => set({ currentRestaurant: id, restaurantName: name }),
      setTable: (number) => set({ tableNumber: number }),
    }),
    {
      name: 'restaurant-storage',
    }
  )
)

// Cart Store
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const items = get().items
        const existing = items.find((i) => i.id === item.id)
        if (existing) {
          set({
            items: items.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
            ),
          })
        } else {
          set({ items: [...items, item] })
        }
      },
      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) })
      },
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter((i) => i.id !== id) })
        } else {
          set({
            items: get().items.map((i) =>
              i.id === id ? { ...i, quantity } : i
            ),
          })
        }
      },
      updateNotes: (id, notes) => {
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, notes } : i
          ),
        })
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0)
      },
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0)
      },
    }),
    {
      name: 'cart-storage',
    }
  )
)

// Auth Store
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
)

// App Store
export const useAppStore = create<AppState>((set) => ({
  viewMode: 'menu',
  setViewMode: (mode) => set({ viewMode: mode }),
}))

// Customer Store (for tracking orders)
export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      trackedOrders: [],
      customerPhone: '',
      setTrackedOrders: (orders) => set({ trackedOrders: orders }),
      setCustomerPhone: (phone) => set({ customerPhone: phone }),
      addTrackedOrder: (order) => {
        const orders = get().trackedOrders
        const exists = orders.find(o => o.id === order.id)
        if (!exists) {
          set({ trackedOrders: [order, ...orders].slice(0, 10) })
        }
      },
      clearTrackedOrders: () => set({ trackedOrders: [] }),
    }),
    {
      name: 'customer-storage',
    }
  )
)
