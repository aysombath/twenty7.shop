"use client"

import * as React from "react"
import { Search, Bell, LogOut, ShieldCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "./app-sidebar"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

function getInitials(name?: string) {
  if (!name) return 'PA'
  const parts = name.split(/[\s_@.]+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.substring(0, 2).toUpperCase()
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = React.useState<{
    username?: string
    name?: string
    role?: string
    type?: string
  } | null>(null)
  const [lowStockProducts, setLowStockProducts] = React.useState<any[]>([])
  const [isMounted, setIsMounted] = React.useState(false)

  const checkLowStock = React.useCallback(async () => {
    try {
      const res = await fetch('/api/products', {
        headers: { 'Authorization': `Bearer ${sessionStorage.getItem('atelier_access_token')}` }
      })
      const json = await res.json()
      if (json.success) {
        const products = json.data.filter((p: any) => (p.stock || 0) < 10 && (p.stock || 0) > 0)
        setLowStockProducts(products)
      }
    } catch {}
  }, [])

  React.useEffect(() => {
    setIsMounted(true)
    try {
      const raw = sessionStorage.getItem('atelier_user')
      if (raw) setUser(JSON.parse(raw))
    } catch {}

    checkLowStock()
    const interval = setInterval(checkLowStock, 30000)
    return () => clearInterval(interval)
  }, [checkLowStock])

  if (!isMounted) {
    return <div className="min-h-screen bg-background" />
  }

  const displayName = user?.name || user?.username || 'Architect'
  const displayRole = user?.role || 'Admin'
  const isAdmin = user?.type === 'admin' || !user
  const initials = getInitials(displayName)

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      sessionStorage.clear()
      toast.info("Session Terminated", { description: "Logged out successfully." })
      router.push('/login')
      router.refresh()
    } catch {
      toast.error("Logout failure.")
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset className="min-w-0">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border/10 bg-background/80 backdrop-blur-md px-4 md:px-6 sticky top-0 z-20">
          <div className="flex items-center gap-2 md:gap-4 flex-1">
            <SidebarTrigger className="-ml-1" />
            
            {/* Search - Desktop always visible, Mobile hidden by default */}
            <div className="relative max-w-md w-full hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 opacity-50" />
              <Input
                placeholder="Search orders, products..."
                className="pl-9 bg-surface-low border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/20 transition-all font-medium text-sm"
              />
            </div>

            {/* Mobile Search Trigger */}
            <Button variant="ghost" size="icon" className="md:hidden text-foreground/70">
              <Search className="size-5" />
            </Button>
          </div>

          <div className="flex items-center gap-1 md:gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="ghost" size="icon" className="relative text-foreground/70 hover:text-foreground">
                  <Bell className="size-5" />
                  {lowStockProducts.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 size-4 bg-destructive text-[8px] text-white flex items-center justify-center rounded-full border-2 border-background font-black">
                      {lowStockProducts.length}
                    </span>
                  )}
                </Button>
              } />
              <DropdownMenuContent align="end" className="w-80 p-3 rounded-[2rem] shadow-2xl border-none bg-white/90 backdrop-blur-xl animate-in zoom-in-95 duration-200">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="flex items-center justify-between px-3 py-3">
                    <span className="text-[10px] items-center gap-2 flex uppercase font-extrabold tracking-[0.2em] text-foreground/40">
                      <Bell className="size-3.5" /> System Alerts
                    </span>
                    {lowStockProducts.length > 0 && (
                       <Badge variant="destructive" className="h-4 text-[8px] font-black uppercase tracking-widest px-2 shadow-lg shadow-destructive/20 border-none">
                          {lowStockProducts.length} Critical
                       </Badge>
                    )}
                  </DropdownMenuLabel>
                  
                  <DropdownMenuSeparator className="bg-border/40 my-2" />
                  
                  {lowStockProducts.length > 0 ? (
                    <div className="flex flex-col gap-1 max-h-[320px] overflow-y-auto pr-1">
                      {lowStockProducts.map((p: any) => (
                        <DropdownMenuItem 
                          key={p.id} 
                          onClick={() => router.push('/admin/inventory')}
                          className="rounded-2xl p-4 cursor-pointer group flex flex-col gap-2 items-start focus:bg-amber-500/5 transition-all mb-1 border border-transparent hover:border-amber-500/10"
                        >
                           <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-black tracking-tight text-foreground/90">{p.name}</span>
                              <div className="flex items-center gap-1.5 bg-amber-500/10 px-2 py-1 rounded-lg">
                                 <span className="size-1 rounded-full bg-amber-600 shadow-sm" />
                                 <span className="text-[9px] text-amber-700 font-black uppercase tracking-widest">
                                    {p.stock} Left
                                 </span>
                              </div>
                           </div>
                           <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono font-bold opacity-30 uppercase tracking-tighter">SKU: {p.sku || `PRD-${p.id}`}</span>
                              <span className="size-1 rounded-full bg-border/40" />
                              <span className="text-[8px] font-black text-amber-600/60 uppercase tracking-[0.2em]">
                                 Restock Mandatory
                              </span>
                           </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 flex flex-col items-center justify-center gap-4 opacity-20">
                       <div className="p-4 bg-muted/20 rounded-2xl">
                          <Bell className="size-10 stroke-[1px]" />
                       </div>
                       <p className="text-[10px] font-black uppercase tracking-[0.4em] ml-1">No active alerts</p>
                    </div>
                  )}
                  
                  {lowStockProducts.length > 0 && (
                    <>
                      <DropdownMenuSeparator className="bg-border/40 my-3" />
                      <DropdownMenuItem 
                        onClick={() => router.push('/admin/inventory')}
                        className="w-full py-3.5 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 hover:bg-primary/10 rounded-2xl transition-all flex items-center justify-center gap-3 border border-primary/10 cursor-pointer shadow-sm"
                      >
                         Go to inventory control
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="h-6 w-[1px] bg-border/20 mx-1 hidden sm:block" />

            {/* User identity chip */}
            <div className="flex items-center gap-2 bg-secondary/40 rounded-xl px-2 py-1 md:px-3 md:py-1.5 transition-all hover:bg-secondary/60 cursor-pointer">
              <Avatar className="size-6 md:size-7 rounded-lg">
                <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-[9px] md:text-[10px] font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col leading-none">
                <span className="text-[11px] md:text-xs font-bold text-foreground/80 flex items-center gap-1">
                  {displayName}
                  {isAdmin && <ShieldCheck className="size-3 text-primary" />}
                </span>
                <span className="text-[8px] md:text-[9px] text-muted-foreground font-medium">{displayRole}</span>
              </div>
            </div>

            {/* Quick logout button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-foreground/50 hover:text-destructive hover:bg-destructive/5 transition-colors"
              title="Sign Out"
            >
              <LogOut className="size-4 md:size-5" />
            </Button>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-4 md:gap-8 p-4 md:p-8 max-w-[1600px] mx-auto w-full">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
