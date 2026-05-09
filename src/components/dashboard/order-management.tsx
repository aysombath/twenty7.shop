"use client"

import * as React from "react"
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  ShoppingCart, 
  Truck, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical, 
  Eye, 
  Trash2, 
  Settings2,
  Package,
  CircleDollarSign,
  ArrowRight,
  PenLine
} from "lucide-react"
import { toast } from "sonner"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface OrderItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
}

interface Order {
  id: string
  orderNumber: string
  customer: string
  customerEmail: string
  status: string
  currency: "USD" | "KHR"
  totalPrice: number
  shippingCost: number
  orderDate: string
  address: {
    street: string
    city: string
    state: string
  }
  notes?: string
  items: OrderItem[]
}

const INITIAL_ORDERS: Order[] = [
  {
    id: "1",
    orderNumber: "ORD-2026-001",
    customer: "Sombath Chann",
    customerEmail: "sombath@example.com",
    status: "Delivered",
    currency: "USD",
    totalPrice: 1240.00,
    shippingCost: 5.00,
    orderDate: "2026-03-27",
    address: { street: "No. 123 St. 456", city: "Phnom Penh", state: "PP" },
    items: [{ productId: "p1", productName: "Architectural Asset", quantity: 1, unitPrice: 1240.00 }]
  },
  {
    id: "2",
    orderNumber: "ORD-2026-002",
    customer: "Elena Rossi",
    customerEmail: "elena@rossi.it",
    status: "Shipped",
    currency: "USD",
    totalPrice: 450.00,
    shippingCost: 0.00,
    orderDate: "2026-03-26",
    address: { street: "Via Roma 10", city: "Milan", state: "MI" },
    items: [{ productId: "p2", productName: "Minimalist Pendant", quantity: 1, unitPrice: 450.00 }]
  }
]

export function OrderManagement() {
  const [orders, setOrders] = React.useState<Order[]>(INITIAL_ORDERS)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [activeTab, setActiveTab] = React.useState("all")
  const [isNewOrderOpen, setIsNewOrderOpen] = React.useState(false)
  const [editingOrder, setEditingOrder] = React.useState<Order | null>(null)
  const [currentFormStep, setCurrentFormStep] = React.useState<"details" | "items">("details")
  
  // Table Visibility
  const [columnVisibility, setColumnVisibility] = React.useState({
    number: true,
    customer: true,
    status: true,
    currency: true,
    total: true,
    shipping: true,
    date: true
  })

  // New Order State
  const [newOrder, setNewOrder] = React.useState<Partial<Order>>({
    orderNumber: `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    status: "New",
    currency: "USD",
    items: []
  })
  const [newItem, setNewItem] = React.useState<OrderItem>({
    productId: "",
    productName: "",
    quantity: 1,
    unitPrice: 0
  })

  // Dummy data for customer/product search
  const customers = [
    { name: "Sombath Chann", email: "sombath@example.com", phone: "012345678" },
    { name: "Elena Rossi", email: "elena@rossi.it", phone: "098765432" }
  ]
  const products = [
    { id: "p1", name: "Architectural Asset", price: 1240 },
    { id: "p2", name: "Minimalist Pendant", price: 450 },
    { id: "p3", name: "Brutalist Chair", price: 890 }
  ]

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customer.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (activeTab === "all") return matchesSearch
    return matchesSearch && o.status.toLowerCase() === activeTab
  })

  const stats = {
    total: orders.length,
    open: orders.filter(o => ["new", "processing", "shipped"].includes(o.status.toLowerCase())).length,
    avg: orders.reduce((acc, curr) => acc + curr.totalPrice, 0) / (orders.length || 1)
  }

  const handleAddOrderItem = () => {
    if (!newItem.productName || newItem.quantity <= 0) {
      toast.error("Invalid Item", { description: "Please select a product and quantity." })
      return
    }
    setNewOrder(prev => ({
      ...prev,
      items: [...(prev.items || []), { ...newItem }]
    }))
    setNewItem({ productId: "", productName: "", quantity: 1, unitPrice: 0 })
  }

  const handleRemoveOrderItem = (index: number) => {
    setNewOrder(prev => ({
      ...prev,
      items: (prev.items || []).filter((_, i) => i !== index)
    }))
  }

  const handleCreateOrder = () => {
    const total = (newOrder.items || []).reduce((acc, curr) => acc + (curr.unitPrice * curr.quantity), 0) + (newOrder.shippingCost || 0)
    const finalizedOrder: Order = {
      ...newOrder as Order,
      id: Math.random().toString(36).substring(7),
      totalPrice: total,
      orderDate: new Date().toISOString().split('T')[0],
      items: newOrder.items as OrderItem[]
    }
    setOrders([finalizedOrder, ...orders])
    setIsNewOrderOpen(false)
    setEditingOrder(null)
    toast.success(editingOrder ? "Acquisition Modified" : "Order Manifest Created", { 
      description: `Order ${finalizedOrder.orderNumber} successfully ${editingOrder ? 'updated' : 'registered'}.` 
    })
    // Reset
    setNewOrder({
      orderNumber: `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: "New",
      currency: "USD",
      items: []
    })
    setCurrentFormStep("details")
  }

  return (
    <div className="flex flex-col gap-10">
      {/* Header & Stats */}
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/10">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-sans font-extrabold tracking-tight text-foreground/90">Order Intelligence</h1>
            <p className="text-sm font-medium text-muted-foreground tracking-wide opacity-80 uppercase">Precision tracking for global fulfillment architecture.</p>
          </div>
          <Dialog open={isNewOrderOpen} onOpenChange={(open) => { setIsNewOrderOpen(open); if (!open) setEditingOrder(null); }}>
            <DialogTrigger render={
              <Button onClick={() => setEditingOrder(null)} className="gap-2 rounded-xl bg-primary hover:bg-primary/90 shadow-lg px-8 font-bold h-12 uppercase text-[10px] tracking-widest">
                <Plus className="size-4" /> New Acquisition
              </Button>
            } />
            <DialogContent className="max-w-4xl bg-white border-none shadow-2xl p-0 overflow-hidden rounded-[2.5rem]">
              <DialogHeader className="p-10 bg-surface-low border-b border-border/5">
                <DialogTitle className="text-3xl font-black font-sans flex items-center gap-4">
                  <ShoppingCart className="size-8 text-primary" /> {editingOrder ? `Modify Acquisition: ${editingOrder.orderNumber}` : "Execute New Order Protocol"}
                </DialogTitle>
              </DialogHeader>
              
              <Tabs value={currentFormStep} className="w-full">
                <div className="px-8 pt-6">
                  <TabsList className="grid w-full grid-cols-2 bg-secondary/20 p-1 rounded-xl h-12">
                    <TabsTrigger value="details" disabled className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-[10px] uppercase tracking-widest">1. Details</TabsTrigger>
                    <TabsTrigger value="items" disabled className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-[10px] uppercase tracking-widest">2. Items</TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-8">
                  {currentFormStep === "details" ? (
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">Order #</label>
                         <Input value={newOrder.orderNumber} readOnly className="h-12 bg-secondary/10 border-none font-bold text-sm rounded-xl" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">Client</label>
                         <div className="flex gap-2">
                            <Input placeholder="Find customer..." className="h-12 bg-secondary/5 border-none font-bold text-sm rounded-xl" onChange={e => setNewOrder({...newOrder, customer: e.target.value})} />
                            <Dialog>
                              <DialogTrigger render={
                                <Button variant="outline" className="h-12 w-12 rounded-xl border-dashed opacity-40 hover:opacity-100"><Plus className="size-4" /></Button>
                              } />
                              <DialogContent className="bg-white rounded-[2rem] border-none shadow-2xl">
                                <DialogHeader><DialogTitle>Enroll New Client</DialogTitle></DialogHeader>
                                <div className="space-y-4 py-4">
                                  <Input placeholder="Full Name" />
                                  <Input placeholder="Email Address" />
                                  <Input placeholder="Phone Number" />
                                </div>
                                <DialogFooter><Button className="rounded-xl w-full">Register Identity</Button></DialogFooter>
                              </DialogContent>
                            </Dialog>
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">Status</label>
                         <Select value={newOrder.status} onValueChange={v => { if(v) setNewOrder({...newOrder, status: v}) }}>
                            <SelectTrigger className="h-12 bg-secondary/5 border-none font-bold text-sm rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-white rounded-xl border-none shadow-xl">
                              <SelectItem value="New">New</SelectItem>
                              <SelectItem value="Processing">Processing</SelectItem>
                              <SelectItem value="Shipped">Shipped</SelectItem>
                            </SelectContent>
                         </Select>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">Currency</label>
                         <Select value={newOrder.currency} onValueChange={(v) => { if (v) setNewOrder({...newOrder, currency: v as any}) }}>
                            <SelectTrigger className="h-12 bg-secondary/5 border-none font-bold text-sm rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-white rounded-xl border-none shadow-xl">
                              <SelectItem value="USD">USD ($)</SelectItem>
                              <SelectItem value="KHR">KHR (៛)</SelectItem>
                            </SelectContent>
                         </Select>
                      </div>
                      <div className="col-span-2 space-y-2">
                         <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">Logistics: Primary Street Address</label>
                         <Input placeholder="123 Atelier Way..." value={newOrder.address?.street} onChange={e => setNewOrder({...newOrder, address: {...(newOrder.address || {} as any), street: e.target.value}})} className="h-12 bg-secondary/5 border-none font-bold text-sm rounded-xl" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">City</label>
                         <Input placeholder="Phnom Penh" value={newOrder.address?.city} onChange={e => setNewOrder({...newOrder, address: {...(newOrder.address || {} as any), city: e.target.value}})} className="h-12 bg-secondary/5 border-none font-bold text-sm rounded-xl" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">State / Province</label>
                         <Input placeholder="PP" value={newOrder.address?.state} onChange={e => setNewOrder({...newOrder, address: {...(newOrder.address || {} as any), state: e.target.value}})} className="h-12 bg-secondary/5 border-none font-bold text-sm rounded-xl" />
                      </div>
                      <div className="col-span-2 space-y-2">
                         <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">Instructional Notes</label>
                         <Textarea placeholder="Special handling requirements..." className="bg-secondary/5 border-none font-bold text-sm rounded-2xl min-h-[100px]" onChange={e => setNewOrder({...newOrder, notes: e.target.value})} />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      <div className="p-5 bg-primary/5 rounded-2xl flex flex-col gap-4 border border-primary/10">
                         <div className="grid grid-cols-4 gap-4">
                            <div className="col-span-2 space-y-2">
                              <label className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-40 ml-1">Item Label</label>
                              <Input placeholder="Filter products..." value={newItem.productName} onChange={e => setNewItem({...newItem, productName: e.target.value})} className="h-10 bg-white border-none text-xs font-bold rounded-lg" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-40 ml-1">Quantity</label>
                              <Input type="number" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})} className="h-10 bg-white border-none text-xs font-bold rounded-lg" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-40 ml-1">Unit Value</label>
                              <div className="relative">
                                <CircleDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-3 opacity-30" />
                                <Input type="number" value={newItem.unitPrice} onChange={e => setNewItem({...newItem, unitPrice: parseFloat(e.target.value) || 0})} className="h-10 pl-8 bg-white border-none text-xs font-bold rounded-lg" />
                              </div>
                            </div>
                         </div>
                         <Button onClick={handleAddOrderItem} variant="outline" className="w-full h-11 border-dashed rounded-xl border-primary/30 text-primary font-bold text-[10px] uppercase tracking-widest hover:bg-primary/5">
                            Allocate Asset to Manifest
                         </Button>
                      </div>

                      <div className="space-y-3">
                         <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">Manifest Queue ({(newOrder.items || []).length})</h4>
                         <div className="bg-secondary/10 rounded-2xl overflow-hidden">
                            <Table>
                               <TableHeader className="bg-secondary/10">
                                  <TableRow className="border-none">
                                    <TableHead className="text-[9px] uppercase font-bold py-3 pl-5">Asset Reference</TableHead>
                                    <TableHead className="text-[9px] uppercase font-bold py-3 text-center">Qty</TableHead>
                                    <TableHead className="text-[9px] uppercase font-bold py-3 text-right">Value</TableHead>
                                    <TableHead className="text-[9px] uppercase font-bold py-3 text-right pr-5"></TableHead>
                                  </TableRow>
                               </TableHeader>
                               <TableBody>
                                  {(newOrder.items || []).map((item, i) => (
                                    <TableRow key={i} className="border-border/5 hover:bg-white/50 transition-colors">
                                      <TableCell className="pl-5 text-sm font-bold font-sans">{item.productName}</TableCell>
                                      <TableCell className="text-center font-bold text-xs opacity-60">x{item.quantity}</TableCell>
                                      <TableCell className="text-right font-bold text-xs">${(item.unitPrice * item.quantity).toFixed(2)}</TableCell>
                                      <TableCell className="text-right pr-5">
                                        <button onClick={() => handleRemoveOrderItem(i)} className="text-destructive opacity-40 hover:opacity-100 transition-opacity"><Trash2 className="size-4" /></button>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                  {(newOrder.items || []).length === 0 && (
                                    <TableRow className="border-none">
                                      <TableCell colSpan={4} className="text-center py-6 text-[10px] font-bold opacity-30 uppercase tracking-widest">Queue is currently void</TableCell>
                                    </TableRow>
                                  )}
                               </TableBody>
                            </Table>
                         </div>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter className="p-8 border-t border-border/5 bg-surface-low gap-3">
                   {currentFormStep === "details" ? (
                      <>
                        <Button variant="ghost" onClick={() => setIsNewOrderOpen(false)} className="rounded-xl font-bold uppercase text-[10px] tracking-widest opacity-40 hover:opacity-100">Cancel</Button>
                        <Button onClick={() => setCurrentFormStep("items")} className="rounded-xl px-10 font-bold uppercase text-[10px] tracking-widest gap-2">Next Step <ArrowRight className="size-3" /></Button>
                      </>
                   ) : (
                      <>
                        <Button variant="outline" onClick={() => setCurrentFormStep("details")} className="rounded-xl font-bold uppercase text-[10px] tracking-widest gap-2 bg-white border-none shadow-sm"><ChevronLeft className="size-3" /> Back</Button>
                        <Button onClick={handleCreateOrder} className="rounded-xl px-10 font-bold uppercase text-[10px] tracking-widest bg-primary text-white shadow-lg shadow-primary/20">Finalize Execution</Button>
                      </>
                   )}
                </DialogFooter>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {[
             { label: "Total Acquisitions", val: stats.total, icon: ShoppingCart, color: "text-primary" },
             { label: "Open Queue", val: stats.open, icon: Clock, color: "text-amber-500" },
             { label: "Yield (Avg)", val: `$${stats.avg.toFixed(2)}`, icon: CircleDollarSign, color: "text-emerald-500" }
           ].map((s, i) => (
             <Card key={i} className="rounded-3xl border-none bg-white shadow-sm ring-1 ring-border/5 overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1">
                <CardContent className="p-6 flex items-center gap-5">
                   <div className={cn("size-12 rounded-2xl bg-secondary/10 flex items-center justify-center", s.color)}>
                      <s.icon className="size-6" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{s.label}</span>
                      <span className="text-2xl font-sans font-black tracking-tight">{s.val}</span>
                   </div>
                </CardContent>
             </Card>
           ))}
        </div>
      </div>

      {/* Main Container */}
      <div className="flex flex-col gap-6">
         <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
               <TabsList className="bg-transparent h-auto p-0 flex flex-wrap gap-2">
                 {["all", "new", "processing", "shipped", "delivered", "cancelled"].map((tab) => (
                    <TabsTrigger 
                      key={tab} 
                      value={tab} 
                      className={cn(
                        "rounded-full px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest border border-border/10 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg transition-all",
                        tab === "all" ? "" : "opacity-60"
                      )}
                    >
                      {tab}
                    </TabsTrigger>
                 ))}
               </TabsList>
               
               <div className="flex items-center gap-3">
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-3.5 opacity-30 group-focus-within:opacity-100 transition-opacity" />
                    <Input 
                      placeholder="Search assets..." 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10 h-11 w-64 bg-white border-none rounded-2xl shadow-sm focus-visible:ring-1 focus-visible:ring-primary/20 text-xs font-bold" 
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={
                      <Button variant="outline" size="icon" className="h-11 w-11 rounded-2xl border-none bg-white shadow-sm hover:shadow-xl transition-all">
                        <Settings2 className="size-4 opacity-50" />
                      </Button>
                    } />
                    <DropdownMenuContent align="end" className="w-56 bg-white rounded-2xl shadow-2xl border-none p-2 font-black">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel className="text-[9px] uppercase tracking-widest opacity-40 px-3 py-2 leading-none mb-1">Column Display Control</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {Object.keys(columnVisibility).map((key) => (
                          <DropdownMenuCheckboxItem
                            key={key}
                            className="rounded-xl px-3 py-2 text-xs font-bold capitalize cursor-pointer mb-1 last:mb-0"
                            checked={columnVisibility[key as keyof typeof columnVisibility]}
                            onCheckedChange={(val) => setColumnVisibility({...columnVisibility, [key]: val})}
                          >
                            {key}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
               </div>
            </div>
         </Tabs>

         <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white">
            <Table>
               <TableHeader className="bg-secondary/5">
                  <TableRow className="border-none hover:bg-transparent">
                  {columnVisibility.number && <TableHead className="text-[10px] uppercase font-bold py-6 pl-10 w-[140px]">Acquisition ID</TableHead>}
                  {columnVisibility.customer && <TableHead className="text-[10px] uppercase font-bold py-6">Identity</TableHead>}
                  {columnVisibility.status && <TableHead className="text-[10px] uppercase font-bold py-6">State</TableHead>}
                  {columnVisibility.currency && <TableHead className="text-[10px] uppercase font-bold py-6">Unit</TableHead>}
                  {columnVisibility.total && <TableHead className="text-[10px] uppercase font-bold py-6">Gross Value</TableHead>}
                  {columnVisibility.shipping && <TableHead className="text-[10px] uppercase font-bold py-6">Logistics</TableHead>}
                  {columnVisibility.date && <TableHead className="text-[10px] uppercase font-bold py-6">Execution</TableHead>}
                  <TableHead className="text-right pr-10"></TableHead>
                  </TableRow>
               </TableHeader>
               <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} className="border-none group hover:bg-accent/30 transition-all">
                       {columnVisibility.number && (
                         <TableCell className="pl-10 py-7 font-mono text-xs font-bold text-primary tracking-tight">{order.orderNumber}</TableCell>
                       )}
                       {columnVisibility.customer && (
                         <TableCell className="py-7">
                            <div className="flex flex-col leading-none">
                               <span className="text-sm font-extrabold font-sans">{order.customer}</span>
                               <span className="text-[10px] opacity-40 font-bold uppercase mt-1">{order.customerEmail}</span>
                            </div>
                         </TableCell>
                       )}
                       {columnVisibility.status && (
                         <TableCell className="py-7">
                            <Badge className={cn(
                              "font-bold uppercase text-[8px] tracking-[0.1em] border-none shadow-none leading-none px-2 py-1",
                              order.status === "Completed" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" :
                              order.status === "Delivered" ? "bg-emerald-500/10 text-emerald-600" :
                              order.status === "Shipped" ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-600"
                            )}>
                              {order.status}
                            </Badge>
                         </TableCell>
                       )}
                       {columnVisibility.currency && (
                         <TableCell className="py-7 font-bold text-xs opacity-60 underline underline-offset-4 decoration-primary/20">{order.currency}</TableCell>
                       )}
                       {columnVisibility.total && (
                         <TableCell className="py-7 font-sans font-black text-sm">${order.totalPrice.toFixed(2)}</TableCell>
                       )}
                       {columnVisibility.shipping && (
                         <TableCell className="py-7 font-bold text-xs opacity-40">${order.shippingCost.toFixed(2)}</TableCell>
                       )}
                       {columnVisibility.date && (
                         <TableCell className="py-7 font-bold text-xs opacity-60">{order.orderDate}</TableCell>
                       )}
                       <TableCell className="py-7 text-right pr-10">
                          <DropdownMenu>
                             <DropdownMenuTrigger render={
                               <Button variant="ghost" size="icon" className="size-9 rounded-xl opacity-20 hover:opacity-100 hover:bg-white transition-all"><MoreHorizontal className="size-4" /></Button>
                             } />
                             <DropdownMenuContent align="end" className="w-52 bg-white rounded-2xl shadow-2xl border-none p-2 font-black">
                                <DropdownMenuItem className="gap-2 cursor-pointer font-bold text-xs p-3 rounded-xl"><Eye className="size-3" /> Inspect Briefing</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setEditingOrder(order); setNewOrder(order); setIsNewOrderOpen(true); }} className="gap-2 cursor-pointer font-bold text-xs p-3 rounded-xl"><PenLine className="size-3" /> Edit Acquisition Cluster</DropdownMenuItem>
                                <DropdownMenuItem className="gap-2 cursor-pointer font-bold text-xs p-3 rounded-xl"><Plus className="size-3" /> Replicate Node</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="gap-2 cursor-pointer font-bold text-xs p-3 text-destructive rounded-xl"><Trash2 className="size-3" /> Purge Acquisition</DropdownMenuItem>
                             </DropdownMenuContent>
                          </DropdownMenu>
                       </TableCell>
                    </TableRow>
                  ))}
               </TableBody>
            </Table>

            <div className="p-8 bg-secondary/5 flex items-center justify-between border-t border-border/5">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Viewing 1-2 of {filteredOrders.length} Indexed acquisitions</span>
                <div className="flex items-center gap-2">
                   <Button variant="outline" size="sm" disabled className="h-9 px-4 rounded-xl border-none bg-white shadow-sm opacity-50 transition-all font-bold text-[10px] uppercase tracking-widest"><ChevronLeft className="size-3 mr-2" /> Back</Button>
                   <Button variant="outline" size="sm" disabled className="h-9 px-4 rounded-xl border-none bg-white shadow-sm opacity-50 transition-all font-bold text-[10px] uppercase tracking-widest">Next <ChevronRight className="size-3 ml-2" /></Button>
                </div>
            </div>
         </Card>
      </div>
    </div>
  )
}
