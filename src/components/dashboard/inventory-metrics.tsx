"use client"

import * as React from "react"
import { Package, AlertTriangle, XCircle, DollarSign } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface InventoryMetricsProps {
  products: any[]
  isLoading?: boolean
}

export function InventoryMetrics({ products, isLoading }: InventoryMetricsProps) {
  const stats = React.useMemo(() => {
    const totalSkus = products.length
    const lowStock = products.filter(p => p.stock > 0 && p.stock < 10).length
    const outOfStock = products.filter(p => p.stock === 0).length
    const totalValue = products.reduce((acc, p) => acc + (p.priceValue * (p.stock || 0)), 0)

    return [
      {
        title: "Total SKUs",
        value: totalSkus.toLocaleString(),
        description: "Active products",
        icon: Package,
        color: "primary" as const
      },
      {
        title: "Low Stock Items",
        value: lowStock.toLocaleString(),
        description: "Requires attention",
        icon: AlertTriangle,
        color: "tertiary" as const
      },
      {
        title: "Out of Stock",
        value: outOfStock.toLocaleString(),
        description: "Needs restock",
        icon: XCircle,
        color: "secondary" as const
      },
      {
        title: "Inventory Value",
        value: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          notation: 'compact',
          maximumFractionDigits: 1
        }).format(totalValue),
        description: "Current valuation",
        icon: DollarSign,
        color: "primary" as const
      }
    ]
  }, [products])

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 bg-surface-low rounded-xl border border-border/5" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((metric) => (
        <Card key={metric.title} className="rounded-xl border-none shadow-sm hover:shadow-md transition-shadow group cursor-default">
          <CardContent className="p-8 flex flex-col gap-6">
            <div className="flex justify-between items-start">
              <div className={cn(
                "p-3 rounded-lg flex items-center justify-center transition-colors",
                metric.color === "primary" ? "bg-primary/10 text-primary" :
                metric.color === "tertiary" ? "bg-tertiary/10 text-tertiary" :
                "bg-secondary/10 text-secondary"
              )}>
                <metric.icon data-icon="inline-start" className="size-5" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-3xl font-sans font-bold tracking-tight text-foreground/90 group-hover:text-foreground transition-colors">
                {metric.value}
              </span>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest opacity-80">
                {metric.title}
              </span>
              <p className="text-[10px] text-muted-foreground/60 font-medium mt-1">{metric.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
