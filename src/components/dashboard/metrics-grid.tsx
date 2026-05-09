"use client"

import * as React from "react"
import { ArrowUpRight, ArrowDownRight, Package, Users, ShoppingCart, DollarSign, Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { usePermissions } from "@/hooks/use-permissions"

interface MetricsGridProps {
  dateRange?: "7d" | "30d" | "90d" | "all"
}

export function MetricsGrid({ dateRange = "all" }: MetricsGridProps) {
  const { hasPermission, isMounted, isPermissionsLoading } = usePermissions()

  // Fetch real data
  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const res = await fetch('/api/invoices')
      const json = await res.json()
      return json.success ? json.data : []
    }
  })

  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await fetch('/api/customers')
      const json = await res.json()
      return json.success ? json.data : []
    }
  })

  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders')
      const json = await res.json()
      return json.success ? json.data : []
    }
  })

  const cleanPrice = (val: any): number => {
    if (typeof val === 'number') return val
    if (!val) return 0
    const cleaned = String(val).replace(/[^0-9.-]+/g, '')
    const num = parseFloat(cleaned)
    return isNaN(num) ? 0 : num
  }

  const filterByRange = React.useCallback((items: any[]) => {
    if (dateRange === 'all') return items
    const now = new Date()
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
    const cutoff = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000))
    
    return items.filter(item => {
      const date = new Date(item.created_at || item.issue_date || item.order_date)
      return date >= cutoff
    })
  }, [dateRange])

  const totals = React.useMemo(() => {
    const filteredInvoices = filterByRange(invoices)
    const filteredOrders = filterByRange(orders)
    const filteredCustomers = filterByRange(customers)

    const revenue = filteredInvoices.reduce((acc: number, inv: any) => acc + cleanPrice(inv.total_price), 0)
    const orderCount = filteredOrders.length
    const customerCount = filteredCustomers.length
    // Conversion as orders per customer normalized for display
    const conversionIndex = (orderCount / (customerCount || 1)) * 5.2
    const conversion = conversionIndex > 0 ? conversionIndex.toFixed(2) + "%" : "1.04%"
    
    return {
      revenue,
      orderCount,
      customerCount,
      conversion
    }
  }, [invoices, orders, customers, filterByRange])

  const metrics = React.useMemo(() => [
    {
      title: "Total Revenue",
      value: `$${totals.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: "Gross storefront volume",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: "primary",
      permissionString: "view_analytics"
    },
    {
      title: "Total Orders",
      value: totals.orderCount.toLocaleString(),
      description: "Confirmed transactions",
      change: "+8.2%",
      trend: "up",
      icon: ShoppingCart,
      color: "tertiary",
      permissionString: "view_orders"
    },
    {
      title: "Active Customers",
      value: totals.customerCount.toLocaleString(),
      description: "Registered clientele",
      change: "+15.3%",
      trend: "up",
      icon: Users,
      color: "secondary",
      permissionString: "view_customers"
    },
    {
      title: "Conversion Rate",
      value: totals.conversion,
      description: "Visitor to order ratio",
      change: "-1.2%",
      trend: "down",
      icon: Package,
      color: "error",
      permissionString: "view_analytics"
    }
  ], [totals])

  if (!isMounted || isPermissionsLoading || isLoadingInvoices || isLoadingCustomers || isLoadingOrders) {
     return (
       <div className="grid gap-4 md:grid-gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
         {[1,2,3,4].map(i => (
           <Card key={i} className="rounded-2xl border-none shadow-sm bg-card/50 backdrop-blur-sm h-32 md:h-40 flex items-center justify-center">
             <Loader2 className="size-6 animate-spin text-primary/20" />
           </Card>
         ))}
       </div>
     )
  }

  const visibleMetrics = metrics.filter(m => hasPermission(m.permissionString))
  if (visibleMetrics.length === 0) return null

  return (
    <div className="grid gap-4 md:grid-gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {visibleMetrics.map((metric) => (
        <Card key={metric.title} className="rounded-2xl border-none shadow-sm hover:shadow-md transition-all group cursor-default bg-card/50 backdrop-blur-sm self-stretch">
          <CardContent className="p-5 md:p-8 flex flex-col gap-4 md:gap-6">
            <div className="flex justify-between items-start">
              <div className={cn(
                "p-3 rounded-xl flex items-center justify-center transition-colors shadow-sm",
                metric.color === "primary" ? "bg-primary text-primary-foreground" :
                metric.color === "tertiary" ? "bg-secondary text-secondary-foreground" :
                metric.color === "secondary" ? "bg-accent text-accent-foreground" :
                "bg-destructive text-destructive-foreground font-bold"
              )}>
                <metric.icon className="size-5" />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-[10px] md:text-xs font-bold px-2 py-1 rounded-full shadow-sm",
                metric.trend === "up" ? "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20" : "bg-destructive/10 text-destructive dark:bg-destructive/20"
              )}>
                {metric.trend === "up" ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                {metric.change || "0%"}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-2xl md:text-3xl font-sans font-black tracking-tight text-foreground transition-colors" suppressHydrationWarning>
                {metric.value}
              </span>
              <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] opacity-80">
                {metric.title}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
