"use client"

import * as React from "react"
import { MoreHorizontal, ChevronRight, Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { usePermissions } from "@/hooks/use-permissions"

export function RecentOrders() {
  const { hasPermission, isMounted, isPermissionsLoading } = usePermissions()

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders')
      const json = await res.json()
      // Limit to 5 for "Recent" view
      return json.success ? json.data.slice(0, 5) : []
    }
  })

  if (!isMounted || isPermissionsLoading || !hasPermission("view_orders")) return null

  return (
    <Card className="rounded-2xl border-none shadow-sm flex flex-col p-5 md:p-8 overflow-hidden bg-card/50 backdrop-blur-sm self-stretch">
      <CardHeader className="p-0 mb-6 md:mb-8 flex flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-xl md:text-2xl font-sans font-black tracking-tight text-foreground">Recent Activity</CardTitle>
          <CardDescription className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60">Latest transactions across storefront</CardDescription>
        </div>
        <Link href="/admin/orders">
          <Button variant="ghost" size="sm" className="hidden sm:flex gap-2 group text-muted-foreground hover:text-foreground font-bold text-[10px] md:text-xs uppercase tracking-widest px-4 h-9 md:h-11 rounded-xl hover:bg-secondary/40 transition-all">
            View All <ChevronRight data-icon="inline-end" className="size-3 md:size-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <div className="rounded-2xl overflow-x-auto border border-border/10">
          <Table>
            <TableHeader className="bg-secondary/20">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="font-sans text-[9px] md:text-[10px] uppercase font-black tracking-widest h-12 md:h-14 px-4 md:px-8 text-muted-foreground/50 whitespace-nowrap">Order</TableHead>
                <TableHead className="font-sans text-[9px] md:text-[10px] uppercase font-black tracking-widest h-12 md:h-14 px-4 md:px-8 text-muted-foreground/50 whitespace-nowrap">Customer</TableHead>
                <TableHead className="font-sans text-[9px] md:text-[10px] uppercase font-black tracking-widest h-12 md:h-14 px-4 md:px-8 text-muted-foreground/50 whitespace-nowrap">Status</TableHead>
                <TableHead className="font-sans text-[9px] md:text-[10px] uppercase font-black tracking-widest h-12 md:h-14 px-4 md:px-8 text-muted-foreground/50 whitespace-nowrap">Total</TableHead>
                <TableHead className="font-sans text-[9px] md:text-[10px] uppercase font-black tracking-widest h-12 md:h-14 px-4 md:px-8 text-right text-muted-foreground/50 whitespace-nowrap">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1,2,3,4,5].map(i => (
                  <TableRow key={i} className="animate-pulse">
                    <TableCell colSpan={5} className="h-16 flex items-center justify-center">
                       <Loader2 className="size-4 animate-spin opacity-10" />
                    </TableCell>
                  </TableRow>
                ))
              ) : orders.length > 0 ? (
                orders.map((order: any) => (
                  <TableRow key={order.id} className="border-b border-border/5 group hover:bg-secondary/20 transition-colors last:border-0 cursor-pointer">
                    <TableCell className="px-4 md:px-8 py-3 md:py-6 font-black font-sans text-xs md:text-sm text-foreground/80">{order.order_number}</TableCell>
                    <TableCell className="px-4 md:px-8 py-3 md:py-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8 md:size-9 rounded-xl shadow-sm border border-border/10">
                          <AvatarImage src={`https://avatar.vercel.sh/${order.customer_name}`} alt={order.customer_name} />
                          <AvatarFallback className="rounded-xl text-[10px] bg-primary/5 text-primary font-bold">{order.customer_name?.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-[120px]">
                          <span className="font-black text-xs md:text-sm tracking-tight text-foreground/90 leading-none mb-1">{order.customer_name}</span>
                          <span className="text-[10px] md:text-xs text-muted-foreground opacity-60 truncate">{new Date(order.order_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 md:px-8 py-3 md:py-6">
                      <div className="flex items-center gap-2">
                         <Badge variant="outline" className={cn(
                          "rounded-lg px-2 py-0.5 font-bold text-[9px] uppercase h-5 border-none",
                          order.status === "Completed" ? "bg-emerald-500/10 text-emerald-600" :
                          order.status === "Processing" ? "bg-primary/10 text-primary" :
                          order.status === "Pending" ? "bg-amber-500/10 text-amber-600" :
                          "bg-destructive/10 text-destructive"
                        )}>
                          {order.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 md:px-8 py-3 md:py-6 font-black text-xs md:text-sm text-foreground">
                      {order.currency || '$'} {parseFloat(order.total_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="px-4 md:px-8 py-3 md:py-6 text-right">
                      <Button variant="ghost" size="icon" className="size-8 hover:bg-primary/5 hover:text-primary transition-all rounded-lg opacity-40 hover:opacity-100">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">
                    No recent transactions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
