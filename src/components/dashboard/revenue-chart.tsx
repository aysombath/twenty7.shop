"use client"

import * as React from "react"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts"
import { useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { usePermissions } from "@/hooks/use-permissions"

interface RevenueChartProps {
  dateRange?: "7d" | "30d" | "90d" | "all"
}

export function RevenueChart({ dateRange = "all" }: RevenueChartProps) {
  const { hasPermission, isMounted, isPermissionsLoading } = usePermissions()

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const res = await fetch('/api/invoices')
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

  const chartData = React.useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const monthlyData = months.map(m => ({ month: m, revenue: 0 }))

    const now = new Date()
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 9999
    const cutoff = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000))

    invoices.forEach((inv: any) => {
      try {
        const date = new Date(inv.issue_date || inv.created_at)
        if (dateRange !== 'all' && date < cutoff) return

        const monthIndex = date.getMonth()
        if (monthIndex >= 0 && monthIndex < 12) {
          monthlyData[monthIndex].revenue += cleanPrice(inv.total_price)
        }
      } catch (err) {}
    })

    return monthlyData
  }, [invoices, dateRange])

  if (!isMounted || isPermissionsLoading || !hasPermission("view_analytics")) return null

  return (
    <Card className="col-span-1 lg:col-span-3 rounded-2xl border-none shadow-sm h-[400px] md:h-[500px] flex flex-col p-5 md:p-8 overflow-hidden bg-card/50 backdrop-blur-sm shadow-indigo-500/5">
      <CardHeader className="p-0 mb-6 md:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-xl md:text-2xl font-sans font-black tracking-tight text-foreground">Revenue Insights</CardTitle>
          <CardDescription className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60">Year over year performance</CardDescription>
        </div>
        <div className="flex items-center gap-3 md:gap-4 self-end sm:self-auto">
          <div className="flex items-center gap-1.5 md:gap-2">
            <span className="size-2.5 md:size-3 rounded-full bg-primary shadow-sm shadow-primary/40" />
            <span className="text-[10px] md:text-xs font-bold text-foreground/70 uppercase tracking-wider">Revenue</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-full w-full p-0 mt-2 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/10 backdrop-blur-[1px] z-10 transition-opacity">
            <Loader2 className="size-8 animate-spin text-primary/20" />
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" strokeOpacity={0.2} />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 500, fill: 'var(--muted-foreground)' }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fontWeight: 500, fill: 'var(--muted-foreground)' }}
              tickFormatter={(value) => `$${value / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
                borderRadius: 'var(--radius)',
                fontSize: '12px',
                fontWeight: '500',
                boxShadow: '0 4px 12px rgba(19, 27, 46, 0.08)'
              }}
              formatter={(value: any) => [`$${parseFloat(value).toLocaleString()}`, 'Revenue']}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="var(--primary)"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
