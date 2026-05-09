"use client"

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  name: string
  price: number
  comparePrice?: number
  image?: string
  quantity: number
  series?: string
}

interface CartStore {
  items: CartItem[]
  wishlist: string[] // Array of item IDs
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  totalItems: () => number
  totalPrice: () => number
  toggleFavorite: (id: string) => void
  isFavorite: (id: string) => boolean
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      wishlist: [],
      addItem: (newItem) => {
        const currentItems = get().items
        const existingItem = currentItems.find(item => item.id === newItem.id)

        if (existingItem) {
          set({
            items: currentItems.map(item =>
              item.id === newItem.id
                ? { ...item, quantity: item.quantity + (newItem.quantity || 1) }
                : item
            )
          })
        } else {
          set({ items: [...currentItems, { ...newItem, quantity: newItem.quantity || 1 }] })
        }
      },
      removeItem: (id) => {
        set({ items: get().items.filter(item => item.id !== id) })
      },
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id)
          return
        }
        set({
          items: get().items.map(item =>
            item.id === id ? { ...item, quantity } : item
          )
        })
      },
      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
      totalPrice: () => get().items.reduce((acc, item) => acc + (item.price * item.quantity), 0),
      toggleFavorite: (id) => {
        const current = get().wishlist
        if (current.includes(id)) {
          set({ wishlist: current.filter(item => item !== id) })
        } else {
          set({ wishlist: [...current, id] })
        }
      },
      isFavorite: (id) => get().wishlist.includes(id),
    }),
    {
      name: 'atelier-cart-storage',
    }
  )
)
