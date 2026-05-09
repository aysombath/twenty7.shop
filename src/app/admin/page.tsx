"use client"

import * as React from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { MetricsGrid } from "@/components/dashboard/metrics-grid"
import { RevenueChart } from "@/components/dashboard/revenue-chart"
import { RecentOrders } from "@/components/dashboard/recent-orders"
import { Button } from "@/components/ui/button"
import { Download, Filter, Plus, RefreshCw, CheckCircle } from "lucide-react"
import { usePermissions } from "@/hooks/use-permissions"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export const dynamic = 'force-dynamic'

export default function Home() {
  const { hasPermission, isMounted, isPermissionsLoading } = usePermissions()
  const [dateRange, setDateRange] = React.useState<"7d" | "30d" | "90d" | "all">("all")

  const handleExport = () => {
    // Basic CSV construction for Dashboard Overview
    try {
      const csvContent = "data:text/csv;charset=utf-8," 
        + "Metric,Value,Status\n"
        + `Generation Date,${new Date().toLocaleDateString()},Active\n`
        + `Reporting Range,${dateRange.toUpperCase()},Verified\n`
        + "Operational Context,Precision Atelier HQ,Live";
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Precision_Atelier_Report_${dateRange}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Export failure:", e);
    }
  }

  if (!isMounted || isPermissionsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="size-8 animate-spin opacity-20" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 md:gap-10">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-5xl font-sans font-black tracking-tight text-foreground">
              Command Center
            </h1>
            <p className="text-[10px] md:text-sm font-bold text-muted-foreground tracking-[0.2em] opacity-60 uppercase">
              Operational overview for <span className="text-primary">Precision Atelier HQ</span>
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            {hasPermission("view_analytics") && (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger render={
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="hidden sm:flex gap-2 rounded-xl border-border/40 hover:bg-white hover:shadow-sm transition-all px-4 font-bold tracking-tight h-9 md:h-11 shadow-sm"
                    >
                      <Filter data-icon="inline-start" className="size-4 opacity-60" /> 
                      {dateRange === 'all' ? 'All Time' : 
                       dateRange === '7d' ? 'Last 7 Days' : 
                       dateRange === '30d' ? 'Last 30 Days' : 'Last Quarter'}
                    </Button>
                  } />
                  <DropdownMenuContent align="end" className="w-56 p-2 bg-white dark:bg-gray-950 rounded-[20px] border-border/10 shadow-2xl z-50">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Analytical Range</DropdownMenuLabel>
                      <DropdownMenuSeparator className="mb-2 opacity-5" />
                      {[
                        { id: '7d', label: 'Last 7 Days' },
                        { id: '30d', label: 'Last 30 Days' },
                        { id: '90d', label: 'Last 90 Days' },
                        { id: 'all', label: 'All Time Records' }
                      ].map((range) => (
                        <DropdownMenuItem
                          key={range.id}
                          onClick={() => setDateRange(range.id as any)}
                          className={cn(
                            "px-3 py-2.5 rounded-xl text-xs font-bold gap-3 cursor-pointer",
                            dateRange === range.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary/40"
                          )}
                        >
                           {dateRange === range.id ? <CheckCircle className="size-4" /> : <div className="size-4 border-2 border-current/10 rounded-full" />}
                           {range.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="hidden sm:flex gap-2 rounded-xl border-border/40 hover:bg-white hover:shadow-sm transition-all px-4 font-bold tracking-tight h-9 md:h-11 shadow-sm"
                  onClick={handleExport}
                >
                  <Download data-icon="inline-start" className="size-4 opacity-60" /> Export
                </Button>
              </>
            )}
          </div>
        </header>

        <MetricsGrid dateRange={dateRange} />

        <div className="grid gap-6 md:gap-8 grid-cols-1 lg:grid-cols-5">
           <RevenueChart dateRange={dateRange} />
           {hasPermission("view_analytics") && (
             <div className="lg:col-span-2 flex flex-col">
                <div className="bg-primary p-8 md:p-12 rounded-[32px] text-primary-foreground relative overflow-hidden group h-full flex flex-col justify-end gap-1 shadow-xl shadow-primary/20 min-h-[300px]">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700">
                    <Plus className="size-48 md:size-64" />
                  </div>
                  <div className="relative z-10 space-y-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Campaign Active</span>
                      <h3 className="text-2xl md:text-4xl font-sans font-black tracking-tight leading-tight">Spring Collection '26</h3>
                      <p className="text-xs md:text-base opacity-80 font-bold tracking-tight max-w-[280px]">Flash sale performance is surging at <span className="text-white">+42%</span> this evening.</p>
                    </div>
                    <Button variant="secondary" size="lg" className="mt-4 w-full sm:w-fit font-black tracking-[0.1em] px-8 rounded-2xl text-primary hover:bg-white hover:scale-105 transition-all uppercase text-[10px] md:text-xs">
                      View Intelligence
                    </Button>
                  </div>
                </div>
             </div>
           )}
        </div>

        <RecentOrders />
      </div>
    </DashboardLayout>
  )
}
