"use client"

import * as React from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { InventoryMetrics } from "@/components/dashboard/inventory-metrics"
import { InventoryTable } from "@/components/dashboard/inventory-table"

export default function InventoryPage() {
  const [products, setProducts] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  // Master Synchronization Fetcher
  const syncInventoryIndex = React.useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      const res = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('atelier_access_token')}`
        }
      })
      const json = await res.json()
      if (json.success) {
        // Mapping architectural SQL schema to Fulfillment UI
        const mapped = json.data.map((p: any) => ({
          id: p.id.toString(),
          sku: p.sku || `PRD-${p.id.toString().padStart(4, '0')}`,
          name: p.name,
          category: p.category,
          stock: p.stock || 0,
          location: "Main Warehouse",
          price: `$${parseFloat(p.price).toFixed(2)}`,
          priceValue: parseFloat(p.price),
          status: p.stock === 0 ? "Out of Stock" : (p.stock < 10 ? "Low Stock" : "In Stock"),
          image: p.image_url || "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=64&h=64"
        }))
        setProducts(mapped)
      }
    } catch (err) {
      console.warn("Neon vault synchronization offline. Utilizing localized stock backup.", err)
    } finally {
      if (!silent) setIsLoading(false)
    }
  }, [])

  // Initial Sync & Real-time Polling Logic
  React.useEffect(() => {
    syncInventoryIndex()
    
    // Establishing a 10s architectural revalidation interval for "real-time" sync
    const interval = setInterval(() => syncInventoryIndex(true), 10000)
    return () => clearInterval(interval)
  }, [syncInventoryIndex])

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-10">
        <InventoryMetrics products={products} isLoading={isLoading} />
        <InventoryTable 
          initialProducts={products} 
          isLoading={isLoading} 
          onRefresh={() => syncInventoryIndex(true)} 
        />
      </div>
    </DashboardLayout>
  )
}
