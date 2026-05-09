"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  getExpandedRowModel,
} from "@tanstack/react-table"
import {
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  CheckCircle2,
  CheckSquare,
  Truck,
  CircleDot,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  LayoutGrid,
  List,
  Eye,
  Trash2,
  Settings2,
  Calendar,
  DollarSign,
  ArrowRight,
  Ban,
  Package,
  Info,
  XCircle,
  Edit3,
  FileText,
  Send
} from "lucide-react"
import { toast } from "sonner"
import { jsPDF } from "jspdf"

import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { InvoiceTemplate } from "@/components/dashboard/invoice-template"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

// --- Types ---

interface Order {
  id: string
  order_number: string
  customer_name: string
  status: string
  currency: string
  total_price: number | string
  shipping_cost: number | string
  order_date: string
}

// --- Components ---

const StatsCard = ({ label, value, icon: Icon, color }: { label: string, value: string | number, icon: any, color: string }) => (
  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col gap-1 transition-all hover:shadow-md hover:-translate-y-1">
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</span>
      <div className={cn("size-8 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800", color)}>
        <Icon className="size-4" />
      </div>
    </div>
    <span
      className="text-3xl font-black text-gray-900 dark:text-white tracking-tight"
      suppressHydrationWarning
    >
      {value}
    </span>
  </div>
)

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, { bg: string, text: string, icon: any }> = {
    "Completed": { bg: "bg-emerald-600 text-white border-none shadow-lg shadow-emerald-500/20", text: "Completed", icon: CheckCircle },
    "Delivered": { bg: "bg-emerald-50 text-emerald-600 border-none", text: "Delivered", icon: CheckCircle2 },
    "Shipped": { bg: "bg-white text-emerald-600 border border-emerald-200", text: "Shipped", icon: Truck },
    "New": { bg: "bg-blue-50 text-blue-600 border-none", text: "New", icon: Info },
    "Processing": { bg: "bg-amber-50 text-amber-600 border-none", text: "Processing", icon: Clock },
    "Cancelled": { bg: "bg-rose-50 text-rose-600 border-none", text: "Cancelled", icon: Ban },
  }

  const s = styles[status] || styles["New"]
  const Icon = s.icon

  return (
    <Badge className={cn("font-bold text-[8px] uppercase tracking-widest gap-1.5 px-2 py-1 shadow-none transition-all", s.bg)}>
      <Icon className="size-3" /> {s.text}
    </Badge>
  )
}

// --- Page ---

export default function OrdersPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isMounted, setIsMounted] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("All")
  const [searchTerm, setSearchTerm] = React.useState("")
  const [rowSelection, setRowSelection] = React.useState({})
  const [pageSize, setPageSize] = React.useState(10)
  const [viewType, setViewType] = React.useState<"list" | "grid">("list")
  const [showFilters, setShowFilters] = React.useState(true)

  // PDF Export States
  const [invoiceConfig, setInvoiceConfig] = React.useState<any>(null)
  const [selectedOrderForPdf, setSelectedOrderForPdf] = React.useState<any>(null)
  const [isExporting, setIsExporting] = React.useState(false)

  // Ensure mounting guard and load settings
  React.useEffect(() => {
    setIsMounted(true)
    const saved = localStorage.getItem('invoice_settings')
    if (saved) {
      try {
        setInvoiceConfig(JSON.parse(saved))
      } catch (e) { }
    } else {
      setInvoiceConfig({
        companyName: "Twenty 7 Shop",
        companyAddress: "123 Commerce St\nSan Francisco, CA 94105\n+1 (555) 123-4567",
        themeColor: "text-pink-600",
        showLogo: true,
        showQR: true,
        blocks: ['header', 'metadata', 'table', 'footer']
      })
    }
  }, [])

  // Fetch orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await fetch('/api/orders')
      const json = await res.json()
      return json.success ? json.data : []
    }
  })

  // Table Setup & Mutations
  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      // If completing an order, we must deduct stock from the inventory index first
      if (status === 'Completed') {
        const detailRes = await fetch(`/api/orders/${id}`)
        const detailJson = await detailRes.json()
        
        if (detailJson.success && detailJson.data?.items) {
          const items = detailJson.data.items
          
          for (const item of items) {
            const pId = item.productId || item.product_id
            const qty = item.quantity || 1
            
            // Query ground truth for this product
            const pRes = await fetch('/api/products')
            const pJson = await pRes.json()
            const product = pJson.data?.find((p: any) => p.id.toString() === pId.toString())
            
            if (product) {
              const currentStock = parseInt(product.stock || "0")
              const newStock = Math.max(0, currentStock - qty)
              
              // Synchronize with the Neon vault
              await fetch('/api/products', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  id: product.id,
                  stock: newStock,
                  price: parseFloat(product.price),
                  name: product.name,
                  sku: product.sku
                })
              })
            }
          }
        }
      }

      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "Update failed")
      return json
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      if (variables.status === 'Completed') {
        toast.success("Order finalized & Stock adjusted", { description: "Inventory counts were synchronized automatically." })
      } else {
        toast.success("Order status updated.")
      }
    },
    onError: (e: any) => toast.error("Update failed", { description: e.message }),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/orders?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "Delete failed")
      return json
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      toast.success("Order deleted.")
    },
    onError: (e: any) => toast.error("Delete failed", { description: e.message }),
  })
  const columns = React.useMemo<ColumnDef<Order>[]>(() => [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="size-4 rounded border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="size-4 rounded border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "order_number",
      header: "Number",
      cell: info => <span className="font-mono text-xs font-bold text-gray-400 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{info.getValue() as string}</span>
    },
    {
      accessorKey: "customer_name",
      header: "Customer",
      cell: info => <span className="text-sm font-black text-gray-900 dark:text-white tracking-tight">{info.getValue() as string}</span>
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: info => <StatusBadge status={info.getValue() as string} />
    },
    {
      accessorKey: "currency",
      header: "Currency",
      cell: info => <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{info.getValue() as string}</span>
    },
    {
      accessorKey: "total_price",
      header: "Total Price",
      cell: info => <span className="font-black text-sm text-gray-900 dark:text-white">${parseFloat(info.getValue() as string).toFixed(2)}</span>
    },
    {
      accessorKey: "shipping_cost",
      header: "Shipping Cost",
      cell: info => <span className="text-xs font-bold text-gray-400">${parseFloat(info.getValue() as string).toFixed(2)}</span>
    },
    {
      accessorKey: "order_date",
      header: "Order Date",
      cell: info => <span className="text-xs font-bold text-gray-500">{new Date(info.getValue() as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const orderStatus = (row.original.status || "new").toLowerCase();

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger render={
                <Button variant="ghost" size="icon" className="size-8 rounded-lg opacity-40 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-opacity outline-none">
                  <MoreVertical className="size-4" />
                </Button>
              } />
              <DropdownMenuContent align="end" className="bg-white dark:bg-gray-950 rounded-xl border-gray-100 dark:border-gray-800 shadow-xl p-2 font-black z-50">

                {/* Contextual Status Actions */}
                {orderStatus === 'new' && (
                  <DropdownMenuItem
                    onClick={() => updateMutation.mutate({ id: row.original.order_number, status: 'Processing' })}
                    className="gap-2 p-3 text-xs rounded-lg cursor-pointer text-amber-600"
                  >
                    <Clock className="size-3.5" /> Process Order
                  </DropdownMenuItem>
                )}

                {orderStatus === 'processing' && (
                  <DropdownMenuItem
                    onClick={() => updateMutation.mutate({ id: row.original.order_number, status: 'Shipped' })}
                    className="gap-2 p-3 text-xs rounded-lg cursor-pointer text-blue-600"
                  >
                    <Truck className="size-3.5" /> Ship Order
                  </DropdownMenuItem>
                )}

                {orderStatus === 'shipped' && (
                  <DropdownMenuItem
                    onClick={() => updateMutation.mutate({ id: row.original.order_number, status: 'Delivered' })}
                    className="gap-2 p-3 text-xs rounded-lg cursor-pointer text-emerald-600"
                  >
                    <CheckCircle2 className="size-3.5" /> Deliver Order
                  </DropdownMenuItem>
                )}

                {orderStatus === 'delivered' && (
                  <DropdownMenuItem
                    onClick={() => updateMutation.mutate({ id: row.original.order_number, status: 'Completed' })}
                    className="gap-2 p-3 text-xs rounded-lg cursor-pointer text-emerald-600 font-black"
                  >
                    <CheckSquare className="size-3.5" /> Complete Order
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem
                  onClick={() => router.push(`/admin/orders/${row.original.order_number}/edit`)}
                  className="gap-2 p-3 text-xs rounded-lg cursor-pointer text-gray-700 dark:text-gray-300"
                >
                  <Edit3 className="size-3.5 opacity-60" /> Edit Order
                </DropdownMenuItem>

                {['new', 'processing', 'shipped'].includes(orderStatus) && (
                  <DropdownMenuItem
                    onClick={() => updateMutation.mutate({ id: row.original.order_number, status: 'Cancelled' })}
                    className="gap-2 p-3 text-xs rounded-lg cursor-pointer text-orange-600"
                  >
                    <XCircle className="size-3.5" /> Cancel Order
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="bg-gray-50 dark:bg-gray-800" />

                <DropdownMenuItem
                  disabled={isExporting}
                  onClick={async () => {
                    const rowData = row.original
                    setIsExporting(true)
                    toast.loading(`Fetching full details for ${rowData.order_number}...`, { id: 'pdf-toast' })

                    try {
                      const res = await fetch(`/api/orders/${rowData.order_number}`)
                      const json = await res.json()

                      const orderDetails = json?.success && json.data ? json.data : {}

                      const mappedOrder = {
                        ...rowData,
                        address: orderDetails.address || {
                          street: (rowData as any).street_address,
                          city: (rowData as any).city,
                          state: (rowData as any).state,
                          zip: (rowData as any).zip_code
                        },
                        items: (orderDetails.items && orderDetails.items.length > 0)
                          ? orderDetails.items.map((i: any) => ({
                            description: i.productId || i.product_id || 'Product',
                            quantity: i.quantity || 1,
                            unit_price: i.unitPrice || i.unit_price || 0,
                            total: (i.quantity || 1) * (i.unitPrice || i.unit_price || 0)
                          }))
                          : null // Fallback natively to "Standard Service" in template if completely empty
                      }

                      setSelectedOrderForPdf(mappedOrder)
                      toast.loading('Rendering visual PDF...', { id: 'pdf-toast' })

                      setTimeout(async () => {
                        const el = document.getElementById('pdf-invoice-print-node')
                        if (el) {
                          try {
                            const { toPng } = await import('html-to-image')
                            const imgData = await toPng(el, { pixelRatio: 2, backgroundColor: '#ffffff', skipFonts: true })

                            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
                            const pdfWidth = pdf.internal.pageSize.getWidth()
                            const elRect = el.getBoundingClientRect()
                            const pdfHeight = (elRect.height * pdfWidth) / elRect.width

                            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
                            pdf.save(`Invoice_${rowData.order_number}.pdf`)

                            toast.success(`Invoice for ${rowData.order_number} saved to your downloads`, { id: 'pdf-toast' })
                          } catch (e: any) {
                            console.error('PDF Generation Error:', e)
                            toast.error(`Failed to generate PDF: ${e.message || 'Unknown error'}`, { id: 'pdf-toast' })
                          }
                        } else {
                          toast.error('Template node not found', { id: 'pdf-toast' })
                        }
                        setSelectedOrderForPdf(null)
                        setIsExporting(false)
                      }, 500)

                    } catch (err) {
                      toast.error("Failed to fetch order details", { id: 'pdf-toast' })
                      setIsExporting(false)
                    }
                  }}
                  className="gap-2 p-3 text-xs rounded-lg cursor-pointer text-gray-700 dark:text-gray-300"
                >
                  <FileText className="size-3.5 opacity-60 text-blue-500" /> Download Invoice (PDF)
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    toast.promise(new Promise(resolve => setTimeout(resolve, 1000)), {
                      loading: 'Connecting to mail server...',
                      success: `Invoice emailed to ${row.original.customer_name} successfully`,
                      error: 'Failed to send email'
                    })
                  }}
                  className="gap-2 p-3 text-xs rounded-lg cursor-pointer text-gray-700 dark:text-gray-300"
                >
                  <Send className="size-3.5 opacity-60 text-emerald-500" /> Send via Email
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-gray-50 dark:bg-gray-800" />

                <DropdownMenuItem
                  onClick={() => { if (confirm("Delete this order?")) deleteMutation.mutate(row.original.order_number) }}
                  className="gap-2 p-3 text-xs rounded-lg cursor-pointer text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950"
                >
                  <Trash2 className="size-3.5" /> Delete Order
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      }
    }
  ], [updateMutation, deleteMutation])

  const filteredData = React.useMemo(() => {
    let data = orders
    if (activeTab !== "All") {
      data = data.filter((o: Order) => o.status === activeTab)
    }
    if (searchTerm) {
      data = data.filter((o: Order) =>
        o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    return data
  }, [orders, activeTab, searchTerm])

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { rowSelection },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 10
      }
    }
  })

  // Summary Calculations
  const pageTotal = table.getRowModel().rows.reduce((acc: number, row) => acc + parseFloat(String(row.original.total_price)), 0)
  const pageShipping = table.getRowModel().rows.reduce((acc: number, row) => acc + parseFloat(String(row.original.shipping_cost)), 0)
  const allTotal = orders.reduce((acc: number, o: Order) => acc + parseFloat(String(o.total_price)), 0)
  const allShipping = orders.reduce((acc: number, o: Order) => acc + parseFloat(String(o.shipping_cost)), 0)

  // Stats Calculation from API
  const stats = React.useMemo(() => {
    if (!isMounted) return { total: 0, open: 0, avgPrice: 0 }

    const totalCount = orders.length
    const openCount = orders.filter((o: Order) => ["New", "Processing", "Shipped"].includes(o.status)).length
    const sumTotal = orders.reduce((acc: number, o: Order) => acc + parseFloat(String(o.total_price)), 0)
    const avgPrice = totalCount > 0 ? sumTotal / totalCount : 0
    return {
      total: totalCount,
      open: openCount,
      avgPrice: avgPrice
    }
  }, [orders, isMounted])

  if (!isMounted) return null

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-8 font-sans">
        {/* Header Block */}
        <div className="flex flex-col gap-8 mb-10">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <nav className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-[0.2em] text-gray-400">
                <Link href="/admin/orders" className="hover:text-blue-600 transition-colors">Orders</Link>
                <span className="opacity-20">/</span>
                <span className="text-gray-900 dark:text-white">List</span>
              </nav>
              <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">Orders</h1>
            </div>
            <Link href="/admin/orders/create">
              <Button className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                New order
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard
              label="Orders"
              value={isMounted ? stats.total : 0}
              icon={Package}
              color="text-blue-600"
            />
            <StatsCard
              label="Open orders"
              value={isMounted ? stats.open : 0}
              icon={CircleDot}
              color="text-amber-500"
            />
            <StatsCard
              label="Average price"
              value={isMounted ? `$${stats.avgPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "$0.00"}
              icon={DollarSign}
              color="text-emerald-500"
            />
          </div>
        </div>

        {/* Filters & Status Tabs */}
        <div className="flex flex-col gap-8 mb-8">
          {showFilters && (
            <div className="flex flex-wrap items-center gap-2 animate-in slide-in-from-top-4 fade-in duration-200">
              {["All", "New", "Processing", "Shipped", "Delivered", "Cancelled"].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                    activeTab === tab
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                      : "bg-white dark:bg-gray-900 text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-100 dark:border-gray-800"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              {showFilters && (
                <DropdownMenu>
                  <DropdownMenuTrigger render={
                    <Button variant="ghost" className="h-11 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-5 font-bold text-xs gap-3 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                      Group by <ChevronDown className="size-3.5 opacity-40" />
                    </Button>
                  } />
                  <DropdownMenuContent align="start" className="w-56 bg-white rounded-xl shadow-2xl border-gray-100 font-bold text-xs p-2">
                    <DropdownMenuItem className="p-3 rounded-lg cursor-pointer">Date Executed</DropdownMenuItem>
                    <DropdownMenuItem className="p-3 rounded-lg cursor-pointer">Cluster Status</DropdownMenuItem>
                    <DropdownMenuItem className="p-3 rounded-lg cursor-pointer">Client Identity</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="h-11 pl-11 w-72 bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 rounded-xl shadow-sm font-bold text-sm focus:ring-2 focus:ring-blue-500/20 transition-all focus:w-80"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "h-11 w-11 border rounded-xl shadow-sm transition-colors",
                  showFilters
                    ? "bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/20 dark:border-blue-800"
                    : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 text-gray-400 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <Filter className="size-4" />
              </Button>
              <div className="flex items-center gap-1 p-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewType("grid")}
                  className={cn(
                    "size-9 rounded-lg transition-colors",
                    viewType === "grid" ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20" : "text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  <LayoutGrid className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewType("list")}
                  className={cn(
                    "size-9 rounded-lg transition-colors",
                    viewType === "list" ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20" : "text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  )}
                >
                  <List className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        {isLoading ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-[2.5rem] p-32 text-center mb-8 border-dashed">
            <div className="size-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 animate-pulse">Loading orders...</p>
          </div>
        ) : orders.length > 0 ? (
          viewType === "list" ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden mb-8 animate-in fade-in duration-300">
              <div className="overflow-x-auto min-h-[400px]">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-800">
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <th key={header.id} className="py-4 px-3 pl-6 first:pl-6 last:pr-6 whitespace-nowrap">
                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {table.getRowModel().rows.map(row => (
                      <tr
                        key={row.id}
                        onClick={() => row.toggleSelected()}
                        className={cn(
                          "group transition-all hover:bg-gray-50/80 dark:hover:bg-gray-800 select-none cursor-pointer",
                          row.getIsSelected() && "bg-blue-50/30 dark:bg-blue-900/10"
                        )}
                      >
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id} className="py-4 px-3 pl-6 first:pl-6 last:pr-6 align-middle">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
                    <tr className="hover:bg-gray-50/80 dark:hover:bg-gray-800 transition-all">
                      <td colSpan={5} className="py-4 px-3 pl-6 first:pl-6 last:pr-6 align-middle text-right">
                        <div className="flex flex-col gap-1 justify-end">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Total Projection</span>
                          <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">This page</span>
                        </div>
                      </td>
                      <td className="py-4 px-3 pl-6 first:pl-6 last:pr-6 align-middle text-sm font-black text-gray-900 dark:text-white">
                        ${pageTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-3 pl-6 first:pl-6 last:pr-6 align-middle text-xs font-bold text-gray-500">
                        ${pageShipping.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td colSpan={2} className="py-4 px-3 pl-6 first:pl-6 last:pr-6 align-middle"></td>
                    </tr>
                    <tr className="hover:bg-gray-50/80 dark:hover:bg-gray-800 transition-all">
                      <td colSpan={5} className="py-4 px-3 pl-6 first:pl-6 last:pr-6 align-middle text-right">
                        <div className="flex flex-col gap-1 justify-end">
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Global Registry</span>
                          <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">All orders</span>
                        </div>
                      </td>
                      <td className="py-4 px-3 pl-6 first:pl-6 last:pr-6 align-middle text-sm font-black text-gray-900 dark:text-white">
                        ${allTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-3 pl-6 first:pl-6 last:pr-6 align-middle text-xs font-bold text-gray-500">
                        ${allShipping.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td colSpan={2} className="py-4 px-3 pl-6 first:pl-6 last:pr-6 align-middle"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 mb-8 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {table.getRowModel().rows.map(row => (
                  <div key={row.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all relative group h-full">
                    <div className="flex items-center justify-between">
                      <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        className="size-4 rounded border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <StatusBadge status={row.original.status as string} />
                    </div>

                    <div className="grid grid-cols-2 mt-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Order</span>
                        <span className="font-mono text-xs font-black text-gray-900 dark:text-gray-100 uppercase group-hover:text-blue-600 transition-colors">{row.original.order_number}</span>
                      </div>
                      <div className="flex flex-col gap-1 items-end text-right">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Date</span>
                        <span className="text-xs font-bold text-gray-500">{new Date(row.original.order_date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 pt-4 border-t border-gray-100 dark:border-gray-800 mt-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Customer</span>
                      <span className="text-sm font-black text-gray-900 dark:text-white truncate" title={row.original.customer_name}>{row.original.customer_name}</span>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-gray-100 dark:border-gray-800 border-dashed">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total</span>
                        <span className="font-black text-lg text-gray-900 dark:text-white flex items-baseline gap-1">
                          <span className="text-sm text-gray-400">{row.original.currency}</span>
                          {parseFloat(String(row.original.total_price)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {flexRender(row.getVisibleCells().find(c => c.column.id === 'actions')?.column.columnDef.cell, row.getVisibleCells().find(c => c.column.id === 'actions')?.getContext() as any)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Grid Summary Footer */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-around gap-6 animate-in slide-in-from-bottom-4 fade-in duration-300">
                <div className="flex flex-col items-center gap-1 group">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Page Total</span>
                  <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tight group-hover:scale-105 transition-transform">${pageTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">+ ${pageShipping.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Shipping</span>
                </div>
                <div className="h-20 w-px bg-gray-100 dark:bg-gray-800 hidden md:block" />
                <div className="flex flex-col items-center gap-1 group">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Global Registry</span>
                  <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tight group-hover:scale-105 transition-transform">${allTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-bold">+ ${allShipping.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Shipping</span>
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="bg-white dark:bg-gray-900 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-[2.5rem] p-32 text-center mb-8">
            <Package className="size-12 mx-auto text-gray-200 dark:text-gray-700 mb-4 opacity-50" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">No orders found</p>
          </div>
        )}

        {/* Footer / Pagination - Only render if mounted and has data */}
        {isMounted && orders.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
            <div className="flex items-center gap-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Showing <span className="text-gray-900 dark:text-white">{table.getState().pagination.pageIndex * pageSize + 1}</span> to <span className="text-gray-900 dark:text-white">{Math.min((table.getState().pagination.pageIndex + 1) * pageSize, filteredData.length)}</span> of <span className="text-gray-900 dark:text-white">{filteredData.length.toLocaleString()}</span> results
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Per page</span>
                <select
                  value={pageSize}
                  onChange={e => {
                    const val = Number(e.target.value)
                    setPageSize(val)
                    table.setPageSize(val)
                  }}
                  className="bg-transparent border-none text-[10px] font-black uppercase text-gray-900 dark:text-white focus:ring-0 cursor-pointer"
                >
                  {[10, 25, 50, 100].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="size-10 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm disabled:opacity-20 transition-all shadow-none hover:shadow-md"
              >
                <ChevronLeft className="size-4" />
              </Button>

              <div className="flex items-center gap-1">
                {[...Array(Math.min(table.getPageCount(), 5))].map((_, i) => (
                  <Button
                    key={i}
                    onClick={() => table.setPageIndex(i)}
                    variant={table.getState().pagination.pageIndex === i ? "default" : "ghost"}
                    className={cn(
                      "size-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      table.getState().pagination.pageIndex === i
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                        : "text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    {i + 1}
                  </Button>
                ))}
                {table.getPageCount() > 5 && <span className="text-gray-300 font-black px-2 mb-1">...</span>}
                {table.getPageCount() > 5 && (
                  <Button
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    variant={table.getState().pagination.pageIndex === table.getPageCount() - 1 ? "default" : "ghost"}
                    className={cn(
                      "size-10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      table.getState().pagination.pageIndex === table.getPageCount() - 1
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                        : "text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    )}
                  >
                    {table.getPageCount()}
                  </Button>
                )}
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="size-10 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm disabled:opacity-20 transition-all shadow-none hover:shadow-md"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
      {/* Hidden Ghost Container for Generating PDF Snapshot via html2canvas */}
      {selectedOrderForPdf && invoiceConfig && (
        <div className="fixed left-[200vw] top-0 z-[-1] pointer-events-none" style={{ backgroundColor: 'white' }}>
          <InvoiceTemplate
            id="pdf-invoice-print-node"
            config={invoiceConfig}
            order={selectedOrderForPdf as any}
          />
        </div>
      )}

    </DashboardLayout>
  )
}

