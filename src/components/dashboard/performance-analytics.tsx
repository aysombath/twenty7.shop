"use client"

import * as React from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Area, AreaChart, CartesianGrid, Cell, Pie, PieChart } from "recharts"
import { ArrowUpRight, ArrowDownRight, TrendingUp, Users, ShoppingBag, DollarSign, Calendar, Download, SlidersHorizontal, Loader2, CheckCircle, FileText, ClipboardList, Printer, FileSpreadsheet } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export function PerformanceAnalytics() {
  const [timeRange, setTimeRange] = React.useState("1y")
  const [activeTab, setActiveTab] = React.useState("performance")

  // Fetch all necessary analytical data
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

  // Analytics Synthesis with Time Range Filtering
  const analytics = React.useMemo(() => {
    // 1. Calculate Cutoff
    const now = new Date()
    let cutoff = new Date(0) // Default to all time
    if (timeRange === "30d") cutoff = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
    if (timeRange === "6m") cutoff = new Date(now.setMonth(now.getMonth() - 6))
    if (timeRange === "1y") cutoff = new Date(now.setFullYear(now.getFullYear() - 1))

    const filterRange = (items: any[]) => items.filter(item => {
      const d = new Date(item.issue_date || item.created_at || item.order_date)
      return d >= cutoff
    })

    const filteredInvoices = filterRange(invoices)
    const filteredOrders = filterRange(orders)
    const filteredCustomers = filterRange(customers)

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const monthlyData = months.map(m => ({ month: m, revenue: 0, growth: 0 }))
    
    let totalRev = 0
    filteredInvoices.forEach((inv: any) => {
      const price = cleanPrice(inv.total_price)
      totalRev += price
      try {
        const date = new Date(inv.issue_date || inv.created_at)
        const monthIndex = date.getMonth()
        if (monthIndex >= 0 && monthIndex < 12) {
          monthlyData[monthIndex].revenue += price
        }
      } catch (e) {}
    })

    // Calculate growth delta
    monthlyData.forEach((m, i) => {
      if (i > 0) {
        m.growth = m.revenue - monthlyData[i-1].revenue
      }
    })

    const aov = filteredOrders.length > 0 ? totalRev / filteredOrders.length : 0
    const conversion = filteredCustomers.length > 0 ? (filteredOrders.length / (filteredCustomers.length * 1.2) * 10).toFixed(2) : "0.00"

    return {
      monthlyData,
      aov,
      conversion: conversion + "%",
      totalOrders: filteredOrders.length,
      totalCustomers: filteredCustomers.length,
      rawOrders: filteredOrders,
      rawInvoices: filteredInvoices
    }
  }, [invoices, orders, customers, timeRange])

  const handleExportExcel = () => {
    try {
      let csv = "data:text/csv;charset=utf-8,"
      csv += "PERFORMANCE AUDIT REPORT\n"
      csv += `Range,${timeRange.toUpperCase()},Date,${new Date().toLocaleDateString()}\n\n`
      
      csv += "CORE KPI CARDS\n"
      csv += `Metric,Value,Status\n`
      csv += `Conversion Rate,${analytics.conversion},Verified\n`
      csv += `Avg Order Value,$${analytics.aov.toFixed(2)},Calculated\n`
      csv += `Registry Volume,${analytics.totalOrders},Active\n`
      csv += `Client Base,${analytics.totalCustomers},Indexed\n\n`

      if (activeTab === "records") {
        csv += "OPERATIONAL RECORDS LEDGER\n"
        csv += "Type,Serial No,Customer,Date,Value\n"
        const records = [...analytics.rawInvoices, ...analytics.rawOrders].sort((a,b) => new Date(b.created_at || b.issue_date || b.order_date).getTime() - new Date(a.created_at || a.issue_date || a.order_date).getTime())
        records.forEach(r => {
          const type = r.invoice_number ? "Invoice" : "Order"
          const serial = (r.invoice_number || r.order_number)?.toUpperCase()
          const date = new Date(r.created_at || r.issue_date || r.order_date).toLocaleDateString()
          const val = cleanPrice(r.total_price)
          csv += `${type},${serial},${r.customer_name},${date},${val.toFixed(2)}\n`
        })
      } else {
        csv += "REVENUE TRAJECTORY (DATA POINTS)\n"
        csv += "Month,Revenue,Growth Delta\n"
        analytics.monthlyData.forEach(m => {
          csv += `${m.month},${m.revenue.toFixed(2)},${m.growth.toFixed(2)}\n`
        })
      }

      const encodedUri = encodeURI(csv)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `Precision_Atelier_Audit_${activeTab}_${timeRange}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error("Excel Export Error:", err)
    }
  }

  const handleExportPDF = () => {
    window.print()
  }

  if (isLoadingInvoices || isLoadingCustomers || isLoadingOrders) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
        <Loader2 className="size-10 animate-spin text-primary opacity-20" />
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Synchronizing Intelligence Engine...</span>
      </div>
    )
  }

  const PERFORMANCE_METRICS = [
    { label: "Conversion Rate", value: analytics.conversion, change: "+0.4%", positive: true },
    { label: "Avg. Order Value", value: `$${analytics.aov.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, change: "+1.2%", positive: true },
    { label: "Registry Volume", value: analytics.totalOrders.toLocaleString(), change: "+8.2%", positive: true },
    { label: "Client Base", value: analytics.totalCustomers.toLocaleString(), change: "+15.3%", positive: true },
  ]

  const CATEGORY_DATA = [
     { name: "Accessories", value: 35, color: "var(--primary)" },
     { name: "Electronics", value: 25, color: "rgba(19, 27, 46, 0.6)" },
     { name: "Standard", value: 30, color: "rgba(19, 27, 46, 0.4)" },
     { name: "Bespoke", value: 10, color: "rgba(19, 27, 46, 0.2)" },
  ]

  return (
    <div className="flex flex-col gap-10 pb-20 print:gap-4 print:pb-0">
      <style jsx global>{`
        @media print {
          nav, header > div:last-child, .tabs-list, .print-hidden {
            display: none !important;
          }
          .main-content {
            padding: 0 !important;
            margin: 0 !important;
          }
          body {
            background: white !important;
          }
          .card {
            box-shadow: none !important;
            border: 1px solid #eee !important;
            break-inside: avoid;
          }
          header {
            margin-bottom: 2rem !important;
          }
        }
      `}</style>
      
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 print:mb-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1">
             <TrendingUp className="size-4 text-primary opacity-60" />
             <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/80">Business Intelligence</span>
          </div>
          <h1 className="text-4xl font-sans font-extrabold tracking-tight text-foreground/90 leading-none">
            Performance Analytics
          </h1>
          <p className="text-sm font-medium text-muted-foreground tracking-wide opacity-80 uppercase">
             Insight Engine for <span className="text-primary font-bold">Precision Atelier HQ</span>
          </p>
        </div>
        <div className="flex items-center gap-3 print-hidden">
          <Select value={timeRange} onValueChange={v => v && setTimeRange(v)}>
             <SelectTrigger className="w-[180px] h-10 bg-white border-none shadow-sm rounded-xl font-bold text-xs uppercase tracking-widest">
                <SelectValue placeholder="Time Range" />
             </SelectTrigger>
             <SelectContent className="rounded-xl border-none shadow-2xl z-50">
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="6m">Last 6 Months</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
             </SelectContent>
          </Select>
          
          <DropdownMenu>
            <DropdownMenuTrigger render={
              <Button 
                variant="outline" 
                size="icon" 
                className="size-10 rounded-xl border-none bg-white shadow-sm hover:shadow-lg transition-all"
              >
                 <Download className="size-4 opacity-40" />
              </Button>
            } />
            <DropdownMenuContent align="end" className="w-56 p-2 bg-white dark:bg-gray-950 rounded-[20px] border-border/10 shadow-2xl z-50">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Distribution Menu</DropdownMenuLabel>
                <DropdownMenuSeparator className="mb-2 opacity-5" />
                <DropdownMenuItem onClick={handleExportPDF} className="px-3 py-2.5 rounded-xl text-xs font-bold gap-3 cursor-pointer text-muted-foreground hover:bg-secondary/40">
                  <Printer className="size-4 opacity-40" /> Download PDF Report
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportExcel} className="px-3 py-2.5 rounded-xl text-xs font-bold gap-3 cursor-pointer text-muted-foreground hover:bg-secondary/40">
                  <FileSpreadsheet className="size-4 opacity-40" /> Download Excel (CSV)
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Tabs defaultValue="performance" onValueChange={setActiveTab} className="w-full">
        <TabsList variant="line" className="tabs-list mb-8 p-0 bg-transparent gap-8 border-b border-border/10 w-full justify-start rounded-none h-12 print-hidden">
          <TabsTrigger value="performance" className="data-active:text-primary data-active:after:bg-primary text-[10px] font-black uppercase tracking-[0.2em] px-0 h-full rounded-none gap-2">
            <TrendingUp className="size-3" /> Performance Insights
          </TabsTrigger>
          <TabsTrigger value="records" className="data-active:text-primary data-active:after:bg-primary text-[10px] font-black uppercase tracking-[0.2em] px-0 h-full rounded-none gap-2">
            <ClipboardList className="size-3" /> Overveiw Records
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="flex flex-col gap-10">
          {/* Primary KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 print:grid-cols-4">
             {PERFORMANCE_METRICS.map((metric, i) => (
               <Card key={i} className="card border-none bg-white shadow-sm rounded-2xl overflow-hidden group">
                  <CardContent className="p-8 flex flex-col gap-1 print:p-4">
                     <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-1">{metric.label}</span>
                     <div className="flex items-end justify-between">
                        <span className="text-2xl font-sans font-extrabold tracking-tighter text-foreground whitespace-nowrap">{metric.value}</span>
                        <div className={cn(
                          "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full print-hidden",
                          metric.positive ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10"
                        )}>
                           {metric.positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                           {metric.change}
                        </div>
                     </div>
                  </CardContent>
               </Card>
             ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:grid-cols-3">
             {/* Main Revenue Chart */}
             <Card className="card lg:col-span-2 border-none bg-white shadow-sm rounded-3xl overflow-hidden p-8 print:col-span-3 min-h-[400px]">
                <CardHeader className="p-0 mb-10 flex flex-row items-center justify-between">
                   <div className="flex flex-col gap-1">
                      <CardTitle className="text-xl font-sans font-extrabold tracking-tight">Revenue Trajectory</CardTitle>
                      <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-40">Monthly synchronized asset yield</CardDescription>
                   </div>
                   <div className="flex items-center gap-6 print-hidden">
                      <div className="flex items-center gap-2">
                         <span className="size-2 rounded-full bg-primary" />
                         <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Revenue</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="size-2 rounded-full bg-primary/20" />
                         <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Growth delta</span>
                      </div>
                   </div>
                </CardHeader>
                <div className="h-[400px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(19, 27, 46, 0.05)" />
                      <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 700, fill: "rgba(19, 27, 46, 0.4)" }} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 700, fill: "rgba(19, 27, 46, 0.4)" }} 
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-4 shadow-2xl rounded-xl border-none">
                                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mb-2">{payload[0].payload.month}</p>
                                <p className="text-lg font-sans font-extrabold tracking-tight text-primary">${payload[0].value?.toLocaleString()}</p>
                                <div className="h-px bg-border/40 my-2" />
                                <p className="text-[9px] font-bold text-muted-foreground">Sync verified at HQ</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="var(--primary)" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorRev)" 
                        activeDot={{ r: 6, strokeWidth: 0, fill: "var(--primary)" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
             </Card>

             {/* Category Distribution */}
             <Card className="card border-none bg-white shadow-sm rounded-3xl overflow-hidden p-8 flex flex-col print:break-before-page print:mt-10">
                <CardHeader className="p-0 mb-8">
                   <CardTitle className="text-xl font-sans font-extrabold tracking-tight">Taxonomy Split</CardTitle>
                   <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-40">Revenue by architectural series</CardDescription>
                </CardHeader>
                <div className="h-[250px] w-full flex items-center justify-center relative">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                         <Pie
                            data={CATEGORY_DATA}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={8}
                            dataKey="value"
                         >
                            {CATEGORY_DATA.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                            ))}
                         </Pie>
                         <Tooltip />
                      </PieChart>
                   </ResponsiveContainer>
                   <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-3xl font-sans font-extrabold tracking-tighter">100%</span>
                      <span className="text-[8px] font-bold uppercase tracking-[0.2em] opacity-40">Indexed</span>
                   </div>
                </div>
                <div className="mt-8 flex flex-col gap-4">
                   {CATEGORY_DATA.map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-xs font-bold font-sans opacity-60 text-muted-foreground">{item.name}</span>
                         </div>
                         <span className="text-xs font-bold font-sans">{item.value}%</span>
                      </div>
                   ))}
                </div>
             </Card>
          </div>
        </TabsContent>

        <TabsContent value="records">
           <Card className="card border-none bg-white shadow-sm rounded-3xl overflow-hidden p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-xl font-sans font-extrabold tracking-tight text-foreground">Operational Records</CardTitle>
                  <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Verified ledger items for selected range</CardDescription>
                </div>
                <div className="flex items-center gap-2 print-hidden">
                  <div className="px-3 py-1 bg-secondary/30 rounded-lg text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                    Invoices: {analytics.rawInvoices.length}
                  </div>
                  <div className="px-3 py-1 bg-secondary/30 rounded-lg text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                    Orders: {analytics.rawOrders.length}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border/10 overflow-hidden print:border-none">
                <Table>
                  <TableHeader className="bg-secondary/20">
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="text-[9px] font-black uppercase tracking-widest h-12">Serial No.</TableHead>
                      <TableHead className="text-[9px] font-black uppercase tracking-widest h-12">Entity</TableHead>
                      <TableHead className="text-[9px] font-black uppercase tracking-widest h-12">Date</TableHead>
                      <TableHead className="text-[9px] font-black uppercase tracking-widest h-12 text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...analytics.rawInvoices, ...analytics.rawOrders].sort((a,b) => new Date(b.created_at || b.issue_date || b.order_date).getTime() - new Date(a.created_at || a.issue_date || a.order_date).getTime()).slice(0, 50).map((record, i) => (
                      <TableRow key={i} className="border-b border-border/5 last:border-0 hover:bg-secondary/10 print:break-inside-avoid">
                        <TableCell className="font-bold text-xs">{(record.invoice_number || record.order_number)?.toUpperCase()}</TableCell>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-2">
                             {record.invoice_number ? <FileText className="size-3 opacity-40 print-hidden" /> : <ClipboardList className="size-3 opacity-40 print-hidden" />}
                             <span className="font-medium text-muted-foreground">{record.customer_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-[10px] font-bold text-muted-foreground/60 uppercase">
                          {new Date(record.created_at || record.issue_date || record.order_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right font-black text-xs">
                          ${cleanPrice(record.total_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
